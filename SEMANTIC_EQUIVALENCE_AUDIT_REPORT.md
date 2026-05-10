# SEMANTIC EQUIVALENCE AUDIT REPORT — PHASE D.1

> **Scope.** This phase audits the **semantic effects** of the Phase D
> deterministic ordering stabilization. It does **not** redesign orchestration,
> repair, arbitration, or validator logic. It does **not** add intelligence,
> adaptive behavior, or governance. It is **observability + equivalence
> certification only**. Telemetry remains **observational, append-only,
> non-governing**.

---

## 1. Methodology

### 1.1 Inputs to the audit

- **POST-stabilization runtime** at commit `285cb9a` (`HEAD` / `origin/main`):
  Phase D comparator insertions plus the Phase B repair iteration guard.
- **PRE-stabilization runtime** at commit `ec46f47`: same runtime without the
  Phase D secondary comparators (verified via `git show ec46f47:<path>`).
- **POST harness output**: `npx tsx scripts/runtime-scenario-test.ts` with the
  five canonical scenarios. The harness clears its telemetry buffer
  per‑replay; orchestration never reads that buffer.

### 1.2 PRE artifact availability — explicit honesty rule

The runtime scenario harness (`scripts/runtime-scenario-test.ts`) was introduced
**in the same commit** as the Phase D comparator insertions (`285cb9a`).
There is **no historical replay snapshot, no committed PRE replay hash, and no
preserved PRE invariant trace** to compare against.

> **`pre_stabilization_semantics_unavailable`**
> The harness cannot directly observe PRE‑vs‑POST behavioral equivalence on a
> live run basis. All PRE/POST comparison below is **static** — diff‑of‑source
> against `ec46f47:<path>` — not replay‑artifact based.

This is the doctrinally required disclosure. PRE equivalence is **not
fabricated**; it is bounded to what static analysis of the comparator change
itself can prove.

### 1.3 What was instrumented

- A `SemanticSnapshot` type was added to the harness (Task 1).
- A `buildSemanticSnapshot()` helper projects the per‑scenario semantic
  surfaces from data already emitted by the orchestrator (no recomputation,
  no new ordering rules).
- A `PHASE_D_COMPARATOR_SURFACES` static registry codifies each comparator
  insertion with its primary/secondary comparator, the static diff, and a
  classification.
- Three additive report sections are emitted at end‑of‑run:
  - `=== SEMANTIC EQUIVALENCE AUDIT`
  - `=== BEHAVIORAL STABILIZATION SURFACES`
  - `=== POLICY DRIFT DETECTIONS`
  - `=== OBSERVABILITY GAPS`
  - `=== SEMANTIC SNAPSHOTS PER SCENARIO`

All instrumentation is **append‑only** in the harness file. No comparator,
arbitration rule, repair behavior, or replay logic was added, removed, or
modified. Orchestration files were not touched in this phase.

---

## 2. SemanticSnapshot model (Task 1)

```ts
type SemanticSnapshot = {
  final_exercise_ids: readonly string[];
  exercise_ordering: readonly string[];
  repair_strategy_order: readonly string[];
  fallback_activation_order: readonly string[];
  arbitration_outcomes: readonly string[];
  invariant_results: readonly string[];
  semantic_state: string;
};
```

- `final_exercise_ids` — set of exercise ids surviving the full pipeline.
- `exercise_ordering` — same list preserving sequence (so a future tool can
  separate set‑equality from ordering‑equality).
- `repair_strategy_order` — sequence of `repair.strategy` strings as emitted
  by `validateOrchestrationSemantics`.
- `fallback_activation_order` — subset of `repair_strategy_order` containing
  only `max_iteration_safety_fallback` /
  `max_iteration_arbitration_only_fallback`.
- `arbitration_outcomes` — sorted projection of arbitration ceilings, blocked
  / protected stress class sets, blocked exercise count, and dominant sources.
- `invariant_results` — `${classification}/${invariant}=${severity}` per
  semantic issue emitted.
- `semantic_state` — `stable | degraded | critical`, derived from the same
  helper the replay hash uses (`deriveSemanticStateForReplay`).

This is **structural semantic comparison**, not replay hashing. The replay
hash already exists upstream and is preserved unchanged.

---

## 3. Static PRE vs POST diff (Task 2)

For every stabilized surface, the PRE behavior was reconstructed from
`git show ec46f47:<path>`. The diff is strictly **append of a secondary
comparator after the primary returned 0**. No primary comparator changed.
No tie‑break direction changed. No filter / cap / iteration count changed.

| # | File | Surface | PRE comparator | POST comparator | Result of `[0]` consumed by |
|---|------|---------|----------------|------------------|------------------------------|
| 1 | `daily-priority-engine.ts:~596` | `selectDailyPriority` | `b.score - a.score` | + `a.id.localeCompare(b.id)` | `chosen` daily priority → `prioritizeByDailyPriority`, `PRIORITY_DEFINITIONS` lookup |
| 2 | `microcycle-engine.ts:~504` | `calculateTrainingDebt` | `b.debt_score - a.debt_score` | + `a.priority.localeCompare(b.priority)` | `computeBiasedPriorities`, imbalance warnings |
| 3 | `correction-engine.ts:~137` | `getPrimaryProblem` | `score(b) - score(a)` | + `a.localeCompare(b)` | `ranked[0]` → primary problem (root‑cause override may supersede) |
| 4 | `correction-engine.ts:~183` | `inferRootCause` | `b.confidence - a.confidence` | + `a.cause.localeCompare(b.cause)` | `scored[0]` → cause field on `CorrectionDecision` |
| 5 | `correction-engine.ts:~376` | `selectCorrectives` (default branch only) | `b.final_score - a.final_score` | + `a.exercise_id.localeCompare(b.exercise_id)` | viable\[0..cap] in default branch |
| 6 | `constraint-arbitration.ts:~332` | `arbitrateRestorationBias` | `(b.bias)-(a.bias)` | + `a.source.localeCompare(b.source)` | `strongest.source` → note string only; return value is `Math.max(...)`, **independent** of sort |

### 3.1 Replay artifact comparison (POST only)

Five scenarios were replayed 25× each at POST. All five are certified:

| Scenario | Replay hash | Certified | Unique hashes | Repair convergence | Telemetry stability |
|----------|-------------|-----------|---------------|---------------------|---------------------|
| Recovery Collapse | `124d52ed…` | yes | 1 | stable | unverifiable* |
| Intervention Collision | `4df39042…` | yes | 1 | stable | stable |
| Complexity Trap | `4ba0c4b8…` | yes | 1 | stable | unverifiable* |
| Competition Specificity | `9f255334…` | yes | 1 | stable | unverifiable* |
| Stress Class Blockade | `f9165269…` | yes | 1 | stable | stable |

\* `unverifiable` here means **no telemetry opcodes were emitted in any of
the 25 replays for that scenario** — so the harness cannot distinguish
stable‑zero from unstable‑empty. This is observability disclosure, not a
failure.

POST replay is therefore reproducible. **PRE replay is unavailable.** The
combination supports a *bounded* equivalence statement, not an absolute one.

---

## 4. Semantic drift classification (Task 3)

Each surface falls into exactly one category. Lexical tie‑breakers are
explicitly **not** treated as automatically semantically neutral.

### A. `replay_only_stabilization` — 1 surface

- **`arbitrateRestorationBias`** (`constraint-arbitration.ts:~332`).
  The return value is `Math.min(1.0, Math.max(...signals.map(s =>
  s.restoration_bias || 0)))`. That value is independent of the sort. The
  sort is consumed **only** to populate the `strongest.source` substring of
  a human‑readable note. No downstream decision conditions on
  `strongest.source`. The Phase D change is a pure cosmetic stabilization of
  a string label.

### B. `deterministic_behavioral_stabilization` — 5 surfaces

These surfaces did **not** alter legality, authority, ceilings, or repair
counts, but they **do** change *which legal candidate is consistently
selected* when a tie occurs. Per doctrine, this is precisely the
deterministic‑preference‑shaping category and is reported explicitly.

- **`selectDailyPriority`** — ties between equally scored priorities now
  resolve to the lexically smallest priority id. Drives downstream
  prioritization weighting.
- **`calculateTrainingDebt`** — tied debt scores now order lexically by
  priority id. Drives `computeBiasedPriorities` and the
  `debt_score >= 35` notes / imbalance heuristics.
- **`getPrimaryProblem`** (correction‑engine variant) — tied problems
  resolve lexically. Note: the `getPrimaryProblem` symbol imported by
  `orchestrator.ts` is the one in `./diagnostics`, **not** this one. Phase D
  did not touch the diagnostics variant. The stabilized variant is reached
  through `decideCorrection` from `coach-engine.correctionsModule`.
- **`inferRootCause`** — tied confidence resolves lexically by cause name.
  Surfaces only in `CorrectionDecision.cause` and the corresponding note
  today; any future consumer of that field gets a deterministically pinned
  cause.
- **`selectCorrectives` (default branch only)** — the secondary comparator
  is added **only in the default branch**. The `preferLowComplexity` branch
  and the `peak || integration` branch still fall back to insertion order
  on full secondary ties (`complexity_score` and `transfer_score` ties
  respectively, after the existing `final_score` fallback). This is
  reported as **asymmetric stabilization across branches** so that future
  audits know the stabilization is partial.

### C. `semantic_policy_drift` — 0 surfaces

No Phase D insertion alters:
- repair authority,
- fallback authority,
- arbitration authority,
- corrective semantics, or
- orchestration semantics.

All six insertions are strict refinements of an existing total order, applied
only when the existing primary comparator returns 0. The pre‑existing
control flow, legality gates, volume caps, blocking sets, ceilings, repair
iteration limits, and arbitration math are unchanged in this phase.

---

## 5. Comparator surface audit (Task 4)

Reproduced verbatim from the harness `=== SEMANTIC EQUIVALENCE AUDIT`
section. Lexical tie‑breakers are not assumed neutral; each is described
with the consumer of its sorted output.

```
* src/lib/weightlifting/daily-priority-engine.ts:~596
  surface:              selectDailyPriority
  primary comparator:   candidate.score (desc)
  secondary comparator: candidate.id.localeCompare (asc)
  classification:       deterministic_behavioral_stabilization

* src/lib/weightlifting/microcycle-engine.ts:~504
  surface:              calculateTrainingDebt
  primary comparator:   debt_score (desc)
  secondary comparator: priority.localeCompare (asc)
  classification:       deterministic_behavioral_stabilization

* src/lib/weightlifting/correction-engine.ts:~137
  surface:              getPrimaryProblem
  primary comparator:   calculateCorrectionScore (desc)
  secondary comparator: problem.localeCompare (asc)
  classification:       deterministic_behavioral_stabilization

* src/lib/weightlifting/correction-engine.ts:~183
  surface:              inferRootCause
  primary comparator:   confidence (desc)
  secondary comparator: cause.localeCompare (asc)
  classification:       deterministic_behavioral_stabilization

* src/lib/weightlifting/correction-engine.ts:~376
  surface:              selectCorrectives (default branch)
  primary comparator:   final_score (desc)
  secondary comparator: exercise_id.localeCompare (asc)
  classification:       deterministic_behavioral_stabilization

* src/lib/weightlifting/constraint-arbitration.ts:~332
  surface:              arbitrateRestorationBias
  primary comparator:   restoration_bias (desc)
  secondary comparator: source.localeCompare (asc)
  classification:       replay_only_stabilization
```

---

## 6. Ordering visibility gaps (Task 5)

The replay harness emits `ordering_surface_unobservable` in **5 of 5**
scenarios after the Phase D insertions. The root cause is that the harness
treats `constrained_exercises` (and the per‑run telemetry opcode trace) as
its only observable ordering surface. The Phase D comparators all live
**upstream** of that surface, and their effects are transformed by
arbitration filtering, normalization, semantic repair, and stress‑class
blocking before any list reaches `constrained_exercises`.

Per‑surface gap classification:

| Surface | Gap | Reason |
|---------|-----|--------|
| `selectDailyPriority` | `comparator_not_replay_visible` | The chosen `daily_priority` id is not exposed in the harness‑read surfaces; downstream effects on `constrained_exercises` are mediated by `prioritizeByDailyPriority`, which is order‑stable when its inputs are. |
| `calculateTrainingDebt` | `harness_surface_disconnected` | The ordered `training_debts` array is not exposed by `orchestrateAndPrepareWorkout`; only its downstream effect on `biased_priorities` reaches `constrained_exercises`. |
| `getPrimaryProblem` (correction‑engine) | `stabilized_path_not_exercised` | The harness scenarios do not surface multiple tied problems through `decideCorrection` in a way that reaches `constrained_exercises` distinguishably. |
| `inferRootCause` | `semantic_ordering_unobservable` | The cause field is consumed only by notes today; no harness surface observes it. |
| `selectCorrectives` (default branch) | `stabilized_path_not_exercised` | Correctives are reshaped by normalization + arbitration + repair before reaching `constrained_exercises`. |
| `arbitrateRestorationBias` | `ordering_signal_not_exposed` | The sort output is consumed only inside notes[] strings. |

> **Doctrinal note.** Because these surfaces are not directly observable,
> the report does **not** claim ordering stability visibility for them. It
> claims **static equivalence**, classified as
> `deterministic_behavioral_stabilization`, with the caveat that ties may
> never have occurred under the harness scenarios in the first place.

---

## 7. Root‑cause + corrective risk audit (Task 6)

`inferRootCause` and `selectCorrectives` are explicitly the highest‑risk
surfaces for hidden policy injection.

### 7.1 `inferRootCause`

- The tie‑breaker selects the lexically smallest cause **only when**
  candidates from `ROOT_CAUSE_MAP[problem]` produce identical confidence
  scores. The confidence formula (presence in `problems` ⇒ +0.6, presence
  in `correction_state` ⇒ +0.3, presence anywhere in history ⇒ +0.1) means
  ties are rare but real.
- No new candidates are added. No candidates are suppressed. The selected
  candidate must still appear in `ROOT_CAUSE_MAP[problem]`.
- **Classification:** `deterministic_behavioral_stabilization`. The
  selection is now stable across runs with equal inputs, **and** stable
  across permutations of `ROOT_CAUSE_MAP[problem]`. The previous order was
  insertion‑order‑dependent.

### 7.2 `selectCorrectives`

- Asymmetric stabilization is the most important observation here:
  - Default branch: stabilized.
  - `preferLowComplexity` branch (stage `awareness` / `acquisition`): the
    existing `b.complexity_score - a.complexity_score || b.final_score -
    a.final_score` chain ends without a lexical tie‑breaker. On full ties
    (equal complexity score *and* equal final score) it remains
    insertion‑order‑dependent.
  - `peak || integration` branch: same — `b.transfer_score - a.transfer_score
    || b.final_score - a.final_score` ends without a lexical tie‑breaker.
- The CNS/high‑complexity caps and volume cap apply *after* the sort, so a
  changed ordering between tied candidates can change which candidate is
  kept vs. relegated to `rejected[]` under the cap.
- **Classification:** `deterministic_behavioral_stabilization` for the
  default branch only. The other two branches retain pre‑Phase‑D ordering
  behavior on full secondary ties and are flagged here as **unstabilized
  branches** — not a drift, but a gap a future stabilization phase could
  close if needed.

Neither surface introduces hidden corrective preference, hidden suppression,
or hidden root‑cause preference beyond what the lexical tie‑breaker
trivially shapes.

---

## 8. Fallback + repair authority audit (Task 7)

POST replay shows:

- Repair iteration counts per scenario: 1, 8, 1, 4, 4. All within the
  `MAX_REPAIR_ITERATIONS = 3` outer cap (the 8 reflects iteration *steps*
  including intermediate `least_violating_non_empty_fallback` /
  `preserve_specificity_exposure` strategies invoked *within* a single
  outer iteration; the safety fallback fires only when the outer cap is hit
  — see `Intervention Collision` and `Stress Class Blockade`).
- `fallback_activation_order` is non‑empty in **2 of 5** scenarios:
  `Intervention Collision` and `Stress Class Blockade`. In both cases the
  final fallback is `max_iteration_safety_fallback`, identical to what the
  Phase B guard was designed to emit.
- All five scenarios reach `semantic_state = critical` because at least
  one error invariant remains (`empty_pipeline/workout_non_empty=error`
  resolved by fallback in 4 of 5; `movement_pattern_loss/pull_exposure_present
  =error` in Competition Specificity).
- All five scenarios pass deterministic replay certification on hash, on
  ordering, on telemetry opcodes (where any are emitted), and on repair
  convergence.

The Phase D comparators **did not** change:
- repair legality outcomes (legality gates are unchanged),
- fallback legality outcomes (`isAllowed` / `blockingReasons` unchanged),
- repair iteration counts (cap unchanged, control flow unchanged),
- fallback activation order (driven by repair iteration outcomes, not by
  any Phase D sort),
- arbitration authority (`final_complexity_ceiling`, `final_intensity_ceiling`,
  blocked / protected sets, dominant sources unchanged).

There is no observed promotion of a previously rejected fallback into the
chosen path due to a Phase D tie‑break.

---

## 9. Equivalence reporting (Task 8)

### 9.1 SEMANTIC EQUIVALENCE AUDIT (summary)

| Surface | Classification | Replay impact | Semantic impact | Observability confidence |
|---------|----------------|---------------|------------------|---------------------------|
| `selectDailyPriority` | deterministic_behavioral_stabilization | POST stable; PRE unverifiable | ties resolve lexically smallest id | indirect (downstream of `constrained_exercises`) |
| `calculateTrainingDebt` | deterministic_behavioral_stabilization | POST stable; PRE unverifiable | tied debts order lexically; feeds biased_priorities | indirect |
| `getPrimaryProblem` (correction-engine) | deterministic_behavioral_stabilization | POST stable; PRE unverifiable | tied problems → lexically smallest; root-cause override still applies | not directly observed |
| `inferRootCause` | deterministic_behavioral_stabilization | POST stable; PRE unverifiable | tied causes → lexically smallest | notes-only surface |
| `selectCorrectives` (default branch) | deterministic_behavioral_stabilization | POST stable; PRE unverifiable | tied final_scores → lexically smallest; other branches **unstabilized** | indirect, asymmetric |
| `arbitrateRestorationBias` | replay_only_stabilization | POST stable; PRE unverifiable | label-only; return value unchanged | notes-only surface |

### 9.2 BEHAVIORAL STABILIZATION SURFACES

5 of 6 Phase D comparator insertions. Enumerated in §4.B above.

### 9.3 POLICY DRIFT DETECTIONS

**None.** No comparator was classified as `semantic_policy_drift`. The
audit is not asserting absolute neutrality — it is asserting that:
- the primary comparator was preserved,
- legality / authority gates were preserved,
- repair / fallback / arbitration flows were preserved,
- the only behavioral effect is which tied candidate is consistently
  chosen,
and that this effect is **reported, not hidden**.

### 9.4 OBSERVABILITY GAPS

- 6 of 6 stabilized surfaces are **not directly observable** through the
  harness's `constrained_exercises` ordering surface. Categorical reasons
  listed in §6.
- `ordering_surface_unobservable` appears in 5/5 scenarios in the replay
  harness's `ORDERING RISK SIGNALS` block. This is now explained, not
  suppressed: the harness reads `constrained_exercises` only; Phase D
  comparators live upstream.
- `pre_stabilization_semantics_unavailable` — the audit cannot show live
  PRE replay artifacts. Static diff against `ec46f47` is used instead. The
  audit does not fabricate baseline equivalence.

---

## 10. Doctrine compliance (Task 9)

- **Deterministic replay doctrine** preserved — all five scenarios still
  certify with identical hashes over 25 replays.
- **Append‑only telemetry doctrine** preserved — `recordUnknownExerciseBypass`
  is the only telemetry surface and its contract is unchanged. The new
  `SemanticSnapshot` and `PHASE_D_COMPARATOR_SURFACES` are harness‑local
  and never read by orchestration.
- **Non‑governing observability doctrine** preserved — the audit registry
  is a `readonly` constant; nothing in the runtime imports it; no
  orchestration / repair / arbitration / validator decision conditions on
  it.
- **Bounded runtime doctrine** preserved — no new loops, no new caps, no
  new recursion. The harness instrumentation iterates over fixed‑size
  lists (the comparator registry and the `allResults` array).

---

## 11. Type safety (Task 10)

- `npx tsc --noEmit` — **clean** (no diagnostics).
- `npx tsx scripts/runtime-scenario-test.ts` — **completes successfully**.
  All 5 scenarios pass replay certification. The new audit section emits
  the expected classifications and snapshots.
- No unused imports were introduced. `snake_case` field names on
  `SemanticSnapshot` follow the prompt’s contract exactly. The existing
  runtime interfaces (`OrchestrationSemanticValidationResult`,
  `RuntimeCoachingContext`, `ExerciseBlock`, etc.) were read but **not
  modified**.

---

## 12. Final verdict

> - **Replay equivalence**: POST is reproducible and certified across 25
>   replays in all 5 scenarios. PRE replay artifacts are unavailable and
>   reported as such.
> - **Semantic equivalence**: 1 surface is `replay_only_stabilization`,
>   5 surfaces are `deterministic_behavioral_stabilization`, **0 surfaces
>   are `semantic_policy_drift`**.
> - **Hidden policy injection**: **not detected**. Every Phase D insertion
>   is a strict refinement of an existing comparator and never changes the
>   primary ordering, the legality gates, the repair / arbitration / fallback
>   authority, or the validator outcomes.
> - **Behavioral stabilization is surfaced explicitly**, not laundered as
>   "semantic neutrality."
> - **Observability gaps are surfaced explicitly**: the harness cannot
>   directly observe the Phase D ordering surfaces; the audit therefore
>   makes a static‑diff equivalence claim, classified, with the gap reasons
>   labelled per surface.
>
> If a future phase needs to close the observability gaps, the registry in
> `scripts/runtime-scenario-test.ts` (`PHASE_D_COMPARATOR_SURFACES`) names
> each candidate exposure point.
