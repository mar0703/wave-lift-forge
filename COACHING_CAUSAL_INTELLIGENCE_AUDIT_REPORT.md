# COACHING CAUSAL INTELLIGENCE AUDIT REPORT

**Audit Date:** 2026-05-10  
**Audit Type:** Coaching Reasoning Architecture (NOT code quality)  
**Scope:** Full causal coaching intelligence pipeline  
**Mode:** Audit only — no code modifications

---

## EXECUTIVE SUMMARY

This audit evaluates whether the system reasons through the complete coaching causality chain:

```
competition result → movement failure → biomechanical cause → limiting factor → corrective strategy → exercise selection → loading strategy
```

**Overall Coaching Intelligence Maturity: 6.5/10**

The system demonstrates **significant coaching intelligence depth** with multi-layered causal reasoning, but exhibits **critical gaps** in distinguishing symptoms from root causes and in modeling the full biomechanical causal chain. The architecture excels at exercise intervention modeling and corrective strategy layering, but falls short on deep technical diagnostic intelligence and human coach-like inference patterns.

---

## 1. CAUSAL COACHING REASONING

### 1.1 Symptom vs Root Cause Distinction

**Assessment: PARTIAL (5/10)**

The system has explicit infrastructure for root cause analysis:

**Evidence of Root Cause Modeling:**
- `ROOT_CAUSE_MAP` in `diagnostics.ts` maps problems to candidate causes:
  ```typescript
  early_arm_bend: ["weak_legs", "loss_of_tension", "rushing_extension"]
  slow_pull_under: ["poor_timing", "low_speed_under", "weak_extension"]
  ```
- `inferRootCause()` in `correction-engine.ts` scores candidate causes by presence in problem list, correction state, and history
- `getPrimaryProblem()` prefers root causes over symptoms when both are present

**Critical Gaps:**
1. **No fatigue artifact detection** — The system cannot distinguish between a technical flaw and a fatigue-induced degradation
2. **No psychological limitation modeling** — "positional fear," "aggression deficit," and "technical confidence" are not represented
3. **No compensation vs adaptation distinction** — The system treats all problems as deficiencies to fix, not potential compensations
4. **Binary problem detection** — Problems are detected via strength ratios or success rates, not through nuanced technical observation

**Example of Missing Reasoning:**
```
System sees: weak snatch + strong pull
System concludes: extension/timing problem (via ratio)

But system CANNOT distinguish:
- Is the weak snatch due to fear under the bar?
- Is it due to fatigue artifact from yesterday's heavy session?
- Is it a compensation for limited overhead mobility?
```

### 1.2 Limiting Factor Classification

**Assessment: LIMITED (4/10)**

The system recognizes these limiting factor types:
- ✅ **Strength limitation** — via strength ratios (FS/CJ, Pull/CJ)
- ✅ **Technical limitation** — via problem phase mapping
- ⚠️ **Mobility limitation** — referenced in ROOT_CAUSE_MAP but not actively inferred
- ❌ **Coordination limitation** — not explicitly modeled
- ❌ **Psychological limitation** — not modeled
- ❌ **Fatigue artifact** — detected as "high fatigue" but not distinguished from technical failure

**Missing Classifications:**
- No distinction between "can't do it" (capacity) vs "didn't do it" (execution)
- No modeling of "technical confidence" as a limiting factor
- No recognition of "positional fear" (e.g., fear of receiving heavy overhead)

---

## 2. TECHNICAL DIAGNOSTIC INTELLIGENCE

### 2.1 Represented Technical Indicators

| Indicator | Represented | Inferred | Measurable | Actionable |
|-----------|-------------|----------|------------|------------|
| Extension timing | ✅ Yes | ⚠️ Partial | ❌ No | ✅ Yes |
| Pull-under timing | ✅ Yes | ⚠️ Partial | ❌ No | ✅ Yes |
| Bar trajectory | ⚠️ Referenced | ❌ No | ❌ No | ❌ No |
| Center-of-pressure shift | ❌ No | ❌ No | ❌ No | ❌ No |
| Torso collapse | ❌ No | ❌ No | ❌ No | ❌ No |
| Fixation instability | ⚠️ Partial | ❌ No | ❌ No | ⚠️ Partial |
| Dip-drive sequencing | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| Rack instability | ❌ No | ❌ No | ❌ No | ❌ No |
| Aggression deficit | ❌ No | ❌ No | ❌ No | ❌ No |
| Hesitation under bar | ⚠️ Partial | ❌ No | ❌ No | ❌ No |
| Positional fear | ❌ No | ❌ No | ❌ No | ❌ No |
| Technical confidence | ❌ No | ❌ No | ❌ No | ❌ No |

### 2.2 Technical Phase Causality

**Assessment: GOOD (7/10)**

The system has a well-structured phase model (`movement-model.ts`):
- 12 movement phases defined (start, first_pull, transition, extension, pull_under, receive, recovery, dip, drive, lockout, split)
- Each phase has biomechanical description, coaching cues, and common errors
- Problems are mapped to phases via `PROBLEM_PHASE`

**Strengths:**
- Phase-based corrective selection (`PHASE_CORRECTIVES`)
- Position-aware problem mapping (`PROBLEM_POSITION`)
- Multi-phase exercise targeting

**Gaps:**
- **No cross-phase causal reasoning** — The system doesn't infer that a "poor receive" might be caused by "bad extension" or "wrong trajectory"
- **No bar path analysis** — Referenced in exercise diagnostics but not actively computed
- **No temporal sequencing analysis** — Cannot detect "early extension" vs "late turnover" as distinct timing faults

---

## 3. EXERCISE AS INTERVENTION INSTRUMENT

### 3.1 Exercise Modeling Depth

**Assessment: EXCELLENT (9/10)**

The system models exercises with remarkable sophistication (`exercise-db.ts`, `exercise-intervention-engine.ts`):

**Exercise Attributes Modeled:**
- `role`: main, corrective, technical, overload, accessory
- `intent`: max_force, speed_strength, technical_precision, speed_under, positional_control, competition_execution, recovery
- `purpose`: extension, speed, timing, positioning, trajectory, receive, balance, stability
- `fatigue_cost`: 1-10 scale
- `recovery_demand`: days to recover
- `fatigue_type`: cns, local, mixed
- `technical_complexity`: 1-10 scale
- `transfer_to`: snatch/clean/jerk coefficients (0-1)

**Intervention Categories:**
- timing, speed, stability, strength, technical_restoration, coordination, specificity, recovery

**Intervention Stages:**
- isolated → integrated → competition_specific

**Intervention Purposes:**
- correction, adaptation, restoration

**Example of Rich Modeling:**
```typescript
tall_snatch: {
  role: "technical",
  intent: "speed_under",
  primary_phase: "pull_under",
  purpose: "speed",
  fatigue_cost: 3,
  technical_complexity: 9,
  transfer_to: { snatch: 0.55 },
  use_when: ["slow_pull_under", "early_arm_bend", "skill_day"],
  avoid_when: ["low_readiness", "high_fatigue"]
}
```

This is **elite-level exercise modeling** — far beyond simple "exercise → fixes problem" mapping.

---

## 4. CORRECTIVE STRATEGY LAYER

### 4.1 Strategy Layer Existence

**Assessment: EXCELLENT (9/10)**

The system has a **well-defined corrective strategy layer** between problem and exercise:

**Strategy Components:**
1. **Correction Stage** (`correction-engine.ts`):
   - awareness → acquisition → stabilization → integration → automation
   - Determines how aggressively to intervene

2. **Strategy Building** (`buildStrategy()`):
   ```typescript
   // Trend-aware strategy
   if (trend === "worsening") → "simplify drills, drop intensity"
   if (trend === "improving") → "reduce corrective volume, add specificity"
   
   // Stage-aware strategy
   case "awareness": "simple positional drills, low intensity"
   case "acquisition": "repeatable patterning, moderate volume"
   case "integration": "bias high-transfer drills, raise specificity"
   ```

3. **Training Phase Integration**:
   - Accumulation: more technical work, simpler correctives
   - Intensification: fewer correctives, prefer high transfer
   - Peak: minimal correction, preserve competition specificity

4. **Safety Filtering**:
   - Readiness-based complexity filtering
   - Fatigue-based CNS filtering
   - Competition proximity adjustments

**Example of Strategy Layer in Action:**
```
Problem: slow_pull_under
Trend: worsening
Stage: acquisition
Phase: accumulation

Strategy:
1. Simplify drills (worsening trend)
2. Repeatable patterning (acquisition stage)
3. Simple correctives (accumulation phase)
4. Low complexity (safety filter)

Selected: tall_snatch, muscle_snatch
NOT selected: snatch_balance (too complex for worsening trend)
```

This is **sophisticated coaching reasoning** — the system doesn't just pick exercises, it develops a strategic approach.

---

## 5. TECHNICAL PHASE CAUSALITY

### 5.1 Cross-Phase Causal Reasoning

**Assessment: LIMITED (5/10)**

**What the System Does Well:**
- Maps problems to specific phases
- Selects correctives that target the problem phase
- Understands phase sequences in movement patterns

**Critical Gaps:**
- **No upstream causality** — Cannot infer that a "receive" problem originates from "extension" or "pull_under"
- **No trajectory analysis** — Cannot reason about bar path deviations causing phase failures
- **No compensatory pattern recognition** — Cannot detect when one phase compensates for another

**Example of Missing Reasoning:**
```
Observed: unstable_receive (snatch)

System reasoning:
→ Problem mapped to "receive" phase
→ Select receive-phase correctives (overhead_squat, snatch_balance)

Human coach reasoning:
→ Unstable receive COULD be caused by:
  - Poor extension (bar too far forward)
  - Late turnover (rushing under bar)
  - Weak fixation (not active overhead)
  - Fear under bar (hesitation)
  - Fatigue artifact (CNS depletion)
→ Tests each hypothesis
→ Selects correctives for ROOT CAUSE, not symptom
```

The system has the **data structures** for this reasoning (ROOT_CAUSE_MAP, phase mappings) but doesn't **execute** cross-phase causal inference.

---

## 6. COMPETITION INTELLIGENCE

### 6.1 Competition Modeling

**Assessment: MODERATE (6/10)**

**What's Modeled:**
- Competition mode flag triggers specificity bias
- Competition proximity affects intervention stage selection
- Taper coordination in macrocycle/mesocycle engines
- Attempt sequencing logic (opener, qualifier, PR)

**Evidence:**
```typescript
// competitionModule() in coach-engine.ts
if (competition_mode) {
  remove_exercises: [],
  add_exercises: [
    { id: "snatch", role: "main" },
    { id: "clean_and_jerk", role: "main" }
  ],
  notes: [
    "Attempt 1: 90% (opener)",
    "Attempt 2: 95% (qualifier)", 
    "Attempt 3: 100%+ (PR)"
  ]
}
```

**Critical Gaps:**
- **No confidence stabilization modeling** — Doesn't adjust for athlete confidence state
- **No aggression readiness** — Doesn't model "competition aggression" as a trainable quality
- **No technical consistency under pressure** — No modeling of pressure-induced technical breakdown
- **No tactical fatigue management** — Competition mode is essentially "higher specificity + higher intensity"

**What's Missing:**
```
Human coach competition reasoning:
- Is the athlete confident with their opener?
- Do they need aggression work or composure work?
- How do they handle competition pressure?
- What's their attempt selection strategy?
- How do they recover between attempts?

System competition reasoning:
- competition_mode = true
- → increase specificity
- → increase intensity
- → add classic lifts
```

---

## 7. HUMAN COACH MODELING

### 7.1 Coach-Like Inference Patterns

**Assessment: MODERATE (6/10)**

**What the System Does Well:**
- Infers causes from exercise ratios (FS/CJ, Pull/CJ)
- Infers causes from technical indicators (success rate, RPE)
- Separates symptom from cause (via ROOT_CAUSE_MAP)
- Distinguishes technical vs strength problems (via phase mapping)

**Evidence of Coach-Like Reasoning:**
```typescript
// From correction-engine.ts:getPrimaryProblem()
// Prefer root cause over symptom
const candidates = ROOT_CAUSE_MAP[top] ?? [];
for (const cause of candidates) {
  if (ctx.problems.includes(cause)) return cause;
}
```

**Critical Gaps:**
- **No movement behavior inference** — Cannot watch a lift and infer causes
- **No qualitative observation** — All inputs are quantitative (numbers, flags)
- **No hypothesis testing** — Doesn't generate and test multiple causal hypotheses
- **No intuition modeling** — No "coaching eye" for subtle technical patterns

**Example of Missing Human Reasoning:**
```
Human coach sees:
- Athlete's snatch is struggling
- But their pulls are strong
- And their overhead squat is solid
- But they hesitate before receiving

Human coach infers:
→ Not a strength problem (pulls are strong)
→ Not a mobility problem (OHS is solid)
→ Likely a confidence/timing issue (hesitation)
→ Solution: confidence-building drills, not strength work

System sees:
→ weak_snatch detected
→ strong_pull detected  
→ No hesitation model
→ No confidence model
→ Selects from phase-appropriate correctives
```

---

## 8. FINAL ASSESSMENT

### 8.1 Coaching Intelligence Maturity: 6.5/10

**Breakdown by Category:**

| Category | Score | Classification |
|----------|-------|----------------|
| Causal Coaching Reasoning | 5/10 | Partial — root cause infrastructure exists but incomplete |
| Technical Diagnostic Intelligence | 5/10 | Limited — phase-based but no cross-phase causality |
| Exercise as Intervention Instrument | 9/10 | Excellent — world-class exercise modeling |
| Corrective Strategy Layer | 9/10 | Excellent — sophisticated multi-layer strategy |
| Technical Phase Causality | 5/10 | Limited — phase mapping without cross-phase inference |
| Competition Intelligence | 6/10 | Moderate — structural modeling without psychological depth |
| Human Coach Modeling | 6/10 | Moderate — ratio-based inference without qualitative reasoning |

### 8.2 Biggest Reasoning Gap

**Symptom vs Root Cause vs Fatigue Artifact Distinction**

The system cannot reliably distinguish between:
1. A genuine technical flaw that needs correction
2. A fatigue-induced degradation that needs recovery
3. A compensation pattern that serves a purpose
4. A confidence/psychological limitation

**Impact:** The system may prescribe technical corrections for fatigue artifacts, or strength work for confidence issues.

### 8.3 Biggest Diagnostic Gap

**No Bar Path / Trajectory Analysis**

The system references "bar_path" in diagnostics but has no actual trajectory modeling. This is a critical gap because:
- Bar path is the primary observable for coaching diagnosis
- Forward/backward deviations indicate specific technical faults
- Without trajectory analysis, diagnosis is based on outcomes (success/failure) not mechanics

### 8.4 Biggest Intervention Gap

**No Psychological Intervention Modeling**

The system has no exercises or strategies for:
- Building competition confidence
- Developing aggression under the bar
- Managing competition anxiety
- Overcoming positional fear

**Impact:** Athletes with psychological limitations receive physical solutions.

### 8.5 Biggest Tactical Gap

**No Attempt Sequencing Intelligence**

The competition module hardcodes attempt selection (90%, 95%, 100%+) without considering:
- Athlete's confidence state
- Competition situation (leading, chasing)
- Opening attempt success probability
- Risk/reward optimization

### 8.6 Highest-Risk False Inference

**Strength Ratio → Technical Problem**

The system infers technical problems from strength ratios:
```
if (frontSquat / clean < 1.25) → "weak_legs" problem
```

This can produce false positives:
- Athlete might have excellent leg strength but poor clean technique
- Athlete might be fatigued, temporarily depressing the ratio
- The ratio doesn't distinguish between "weak legs" and "poor clean reception"

**Risk:** Prescribing squat volume for a technical clean issue.

### 8.7 Highest-Risk Coaching Mistake

**Technical Correction During Fatigue Artifact**

The correction engine can select technical correctives when the real issue is fatigue:
```
High fatigue → poor technique → system detects technical problem
→ selects technical correctives → adds more stress → worsens fatigue
```

The system has fatigue filtering but doesn't recognize fatigue-induced technical degradation as distinct from genuine technical flaws.

### 8.8 Safest Next Architecture Target

**Fatigue Artifact Detection Layer**

Add a pre-diagnostic filter that classifies performance degradation as:
1. Fatigue artifact (temporary, recovery-responsive)
2. Technical flaw (persistent, correction-responsive)
3. Strength limitation (chronic, adaptation-responsive)
4. Psychological limitation (context-dependent)

This would prevent the system from prescribing technical corrections for fatigue issues, which is the highest-risk coaching mistake identified.

**Implementation Priority:**
1. Add "fatigue_artifact" as a problem classification
2. Create fatigue vs technical discrimination heuristics
3. Route fatigue artifacts to recovery interventions, not technical correctives
4. Add temporal persistence tracking (fatigue artifacts resolve with rest)

---

## APPENDIX: CAUSAL REASONING CHAIN ANALYSIS

### Complete Chain Evaluation

| Chain Link | Status | Evidence |
|------------|--------|----------|
| Competition result → Movement failure | ✅ Implemented | Problem detection from exercise results |
| Movement failure → Biomechanical cause | ⚠️ Partial | Phase mapping exists, cross-phase inference missing |
| Biomechanical cause → Limiting factor | ⚠️ Partial | ROOT_CAUSE_MAP exists but incomplete |
| Limiting factor → Corrective strategy | ✅ Implemented | Excellent strategy layer with stage/phase awareness |
| Corrective strategy → Exercise selection | ✅ Implemented | Sophisticated multi-criteria exercise scoring |
| Exercise selection → Loading strategy | ✅ Implemented | Fatigue/readiness-based loading adjustments |

### Missing Links

1. **Competition result → Movement failure**: No modeling of competition-specific failures
2. **Movement failure → Biomechanical cause**: No trajectory/bar path analysis
3. **Biomechanical cause → Limiting factor**: No psychological/confidence modeling

---

*End of Coaching Causal Intelligence Audit Report*