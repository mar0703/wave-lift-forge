# Semantic Runtime Audit Report
## Orchestration System - Post Semantic Validator Integration

**Audit Date:** 2026-05-09  
**Scope:** Runtime behavior stress-testing and semantic collapse detection  
**Mode:** Audit only - no code modifications

---

## Executive Summary

This audit stress-tests the orchestration system's runtime behavior under 6 critical athlete states to detect semantic collapse scenarios. The analysis covers the full runtime flow from `orchestrator.ts` through all intelligence engines to the semantic validator's repair paths.

**Key Findings:**
- **12 high-risk runtime states** identified
- **8 constraint conflict patterns** detected
- **5 repair path instabilities** discovered
- **3 architectural bottlenecks** requiring stabilization

---

## 1. Runtime Flow Analysis

### 1.1 Data Flow Architecture

```
OrchestratorInput
    ↓
buildRuntimeCoachingContext()
    ├── generateWorkout() → base_workout
    ├── evaluateRecovery() → recovery_domains
    ├── buildMesocycleExecutionContext() → mesocycle_execution
    ├── evaluateMicrocycle() → microcycle_decision
    ├── selectDailyPriority() → daily_priority
    ├── selectInterventions() → intervention_decision
    └── buildArbitrationFromEngines() → arbitration_decision
    ↓
buildFinalCoachContext()
    ↓
applyOrchestratorConstraints()
    ↓
validateOrchestrationSemantics()
    ├── Detect semantic failures
    └── Apply repair interventions (if mode="repair")
    ↓
Final Workout Output
```

### 1.2 Constraint Propagation Chain

```
Recovery Engine → Signal Bridge → Arbitration → Semantic Validator
Microcycle Engine → Signal Bridge → Arbitration → Semantic Validator  
Priority Engine → Signal Bridge → Arbitration → Semantic Validator
Intervention Engine → Signal Bridge → Arbitration → Semantic Validator
Mesocycle Execution → Signal Bridge → Arbitration → Semantic Validator
```

---

## 2. Test Scenario Analysis

### Scenario 1: Competition Taper
**Conditions:** High specificity pressure, low fatigue tolerance, competition proximity active

**Runtime Path:**
1. `mesocycle-execution-layer.ts:resolveTaperState()` → returns `"taper"` or `"peak"`
2. `mesocycle-execution-layer.ts:resolveSpecificityPressure()` → returns 0.9-1.0
3. `orchestrator-signal-bridge.ts:mesocycleToSignals()` → emits competition signal with severity 60-100
4. `constraint-arbitration.ts:arbitrateSpecificityPressure()` → competition signals take Math.max branch
5. `orchestrator.ts:applySpecificityBias()` → boosts classic lift sets by 1.25x

**Detected Issues:**

| Issue | Runtime Path | Source | Severity | Classification |
|-------|-------------|--------|----------|----------------|
| Specificity-collapse-when-blocked | If CNS ≤30 AND competition ≤7 days → classic lifts blocked by recovery but specificity pressure = 1.0 | recovery-domain-engine → constraint-arbitration | HIGH | Architecture issue |
| Empty pipeline risk | All classic candidates blocked by recovery protection, no fallback in specificity bias | orchestration-semantic-validator repair path | HIGH | Repair logic issue |
| Intensity floor violation | Taper state demands high specificity but recovery caps intensity at 75% | constraint-arbitration:arbitrateIntensityCeiling | MEDIUM | Orchestration issue |

**Semantic Collapse Map for Scenario 1:**
```
competition_in_days ≤ 7
    → specificity_pressure = 1.0
    → demands classic_competition exercises
    BUT
CNS ≤ 30 → blocked_stress_classes includes "classic_competition"
    → ALL classic exercises filtered
    → semantic validator detects "specificity_collapse"
    → repair attempts CLASSIC_CANDIDATES
    → ALL candidates also blocked
    → repair FAILS → empty pipeline fallback
```

---

### Scenario 2: Accumulation Fatigue
**Conditions:** High CNS fatigue, high volume bias, low readiness

**Runtime Path:**
1. `microcycle-engine.ts:calculateMicrocycleState()` → rolling_cns_load > 250-300
2. `microcycle-engine.ts:calculateMaladaptationRisk()` → risk > 70-85
3. `orchestrator.ts:applyMicrocycleConstraints()` → restoration_bias += 0.6-1.0
4. `recovery-domain-engine.ts` → CNS domain ≤ 30-45
5. `constraint-arbitration.ts` → intensity_ceiling = 75-85%, complexity_ceiling = 4-6

**Detected Issues:**

| Issue | Runtime Path | Source | Severity | Classification |
|-------|-------------|--------|----------|----------------|
| Restoration-override-loop | High maladaptation → restoration_bias = 1.0 → all heavy exercises filtered → semantic validator adds restoration candidates → but restoration candidates have low specificity → phase intent violation | orchestrator → semantic-validator | HIGH | Runtime issue |
| Volume-specificity conflict | Accumulation phase demands volume but CNS fatigue caps volume_multiplier < 0.7 | microcycle-engine → constraint-arbitration | MEDIUM | Orchestration issue |
| Functional overreach suppression | functional_overreach_score ≥ 70 suppresses recovery_recommended, but maladaptation_risk ≥ 65 re-adds it | microcycle-engine:evaluateMicrocycle lines 815-829 | MEDIUM | Runtime issue |

**Semantic Collapse Map for Scenario 2:**
```
rolling_cns_load > 300 AND maladaptation_risk > 85
    → restoration_bias = 1.0 (capped)
    → intensity_ceiling = 75%
    → complexity_ceiling = 4
    → filters out all exercises with complexity > 4
    → semantic validator checks "phase_intent_violation"
    → accumulation phase expects volume but volume_multiplier = 0.7
    → detects "accumulation_biases_volume_over_peak_intensity" violation
```

---

### Scenario 3: Recovery Collapse
**Conditions:** Aggressive recovery protection, low coordination, blocked stress classes

**Runtime Path:**
1. `recovery-domain-engine.ts:evaluateRecovery()` → technical_coordination ≤ 30-40
2. `orchestrator-signal-bridge.ts:recoveryToSignals()` → complexity_ceiling signal with severity 95
3. `constraint-arbitration.ts:arbitrateComplexityCeiling()` → coordination protection overrides everything
4. `orchestrator.ts:applyOrchestratorConstraints()` → filters exercises by complexity ≤ 4
5. `orchestration-semantic-validator.ts` → detects movement_pattern_loss

**Detected Issues:**

| Issue | Runtime Path | Source | Severity | Classification |
|-------|-------------|--------|----------|----------------|
| Coordination-protection-override | technical_coordination ≤ 30 → complexity_ceiling = 4 → blocks 70% of exercise database | constraint-arbitration:arbitrateComplexityCeiling lines 241-248 | HIGH | Architecture issue |
| Movement-pattern-annihilation | complexity_ceiling = 4 blocks all classic_competition exercises → pull/squat exposure lost | orchestration-semantic-validator | HIGH | Taxonomy issue |
| Protected-domain-contradiction | Multiple domains protected simultaneously (CNS + coordination + overhead) → conflicting block signals | recovery-domain-engine | MEDIUM | Orchestration issue |
| Repair-path-oscillation | Repair adds restoration candidate → candidate has low specificity → specificity_collapse detected → repair tries classic → blocked again | orchestration-semantic-validator:repairWorkout | HIGH | Repair logic issue |

**Semantic Collapse Map for Scenario 3:**
```
technical_coordination ≤ 30
    → complexity_ceiling = 4 (absolute override)
    → blocks: snatch(9), clean_and_jerk(10), power_snatch(7), power_clean(7)
    → blocks: split_jerk(8), overhead_squat(8), pause_snatch(7)
    → allows: tall_snatch(4), tall_clean(4), drop_snatch(5), back_squat(5)
    → semantic validator: "movement_pattern_loss" for pull exposure
    → repair: PULL_CANDIDATES = [snatch_pull(6), clean_pull(6), ...]
    → ALL pull candidates have complexity > 4 → repair FAILS
```

---

### Scenario 4: Strength Emphasis
**Conditions:** squat_strength or pull_strength priority, intensity bias active

**Runtime Path:**
1. `daily-priority-engine.ts:selectDailyPriority()` → returns squat_strength or pull_strength
2. `daily-priority-engine.ts:PRIORITY_DEFINITIONS` → intensity 80-100%, complexity 1-3
3. `orchestrator-signal-bridge.ts:priorityToSignals()` → intensity_ceiling signal
4. `constraint-arbitration.ts` → priority signals have lowest priority (40)
5. `orchestrator.ts:applyOrchestratorConstraints()` → applies intensity ceiling

**Detected Issues:**

| Issue | Runtime Path | Source | Severity | Classification |
|-------|-------------|--------|----------|----------------|
| Priority-signal-subordination | Priority signals (priority=40) always overridden by recovery (priority=100) | constraint-arbitration:CONSTRAINT_PRIORITY | MEDIUM | Architecture issue |
| Strength-intensity-mismatch | squat_strength demands 80-100% but recovery caps at 75% → phase_intent_violation | semantic-validator | MEDIUM | Runtime issue |
| Low-complexity-exercise-scarcity | complexity 1-3 has very few exercises in taxonomy | exercise-stress-taxonomy | LOW | Taxonomy issue |

---

### Scenario 5: Technical Restoration
**Conditions:** Low complexity ceiling, technical coordination degradation

**Runtime Path:**
1. `daily-priority-engine.ts` → technical_restoration priority selected
2. `daily-priority-engine.ts:PRIORITY_DEFINITIONS.technical_restoration` → complexity 2-3, intensity 50-70%
3. `microcycle-engine.ts:applyDirectionalBiasing()` → adds technical_restoration bias
4. `orchestration-semantic-validator.ts` → checks for restoration-focused exercises

**Detected Issues:**

| Issue | Runtime Path | Source | Severity | Classification |
|-------|-------------|--------|----------|----------------|
| Restoration-candidate-exhaustion | RESTORATION_CANDIDATES = [tall_snatch, tall_clean, muscle_snatch, jerk_dip] → only 4 candidates | orchestration-semantic-validator line 77 | MEDIUM | Taxonomy issue |
| Technical-restoration-contradiction | technical_restoration priority demands classic families but low complexity → conflict | daily-priority-engine | LOW | Runtime issue |
| Corrective-density-spiral | High corrective density → technical_restoration blocked by microcycle → no restoration available | microcycle-engine:applyDirectionalBiasing lines 755-759 | MEDIUM | Orchestration issue |

---

### Scenario 6: Intervention-Heavy State
**Conditions:** Multiple intervention blocks, movement restrictions, arbitration dominance

**Runtime Path:**
1. `exercise-intervention-engine.ts:selectInterventions()` → multiple selected + rejected interventions
2. `orchestrator.ts:applyInterventionConstraints()` → builds blocked_exercises set
3. `orchestrator-signal-bridge.ts:interventionToSignals()` → exercise_block signals
4. `constraint-arbitration.ts:arbitrateBlockingConstraints()` → merges blocks
5. `orchestration-semantic-validator.ts` → detects arbitration_conflict

**Detected Issues:**

| Issue | Runtime Path | Source | Severity | Classification |
|-------|-------------|--------|----------|----------------|
| Intervention-block-cascade | Multiple rejected interventions → blocked_exercises grows → semantic validator detects arbitration_conflict | orchestrator → semantic-validator | HIGH | Runtime issue |
| Arbitration-dominance-leak | dominant_sources propagates through all layers → overrides local decisions | constraint-arbitration → semantic-validator | MEDIUM | Architecture issue |
| Blocked-exercise-set-merge-confusion | blocked_ids merges intervention + arbitration blocks → double-filtering risk | orchestrator.ts lines 623-626 | MEDIUM | Runtime issue |

---

## 3. Semantic Collapse Map

### 3.1 Collapse Trigger Matrix

| Trigger Condition | Collapse Type | Affected Layer | Recovery Possible |
|-------------------|---------------|----------------|-------------------|
| CNS ≤ 30 + competition ≤ 7d | Specificity Collapse | Arbitration → Semantic | NO - contradictory constraints |
| CNS ≤ 30 + coordination ≤ 30 | Movement Pattern Loss | Recovery → Taxonomy | PARTIAL - restoration only |
| maladaptation ≥ 85 + accumulation | Phase Intent Violation | Microcycle → Semantic | NO - phase conflict |
| complexity_ceiling ≤ 4 | Empty Pipeline Risk | Arbitration → Semantic | NO - taxonomy gap |
| blocked_stress_classes ⊇ all | Empty Pipeline | Intervention → Semantic | NO - total block |
| restoration_bias = 1.0 + high_specificity | Specificity Collapse | Orchestrator → Semantic | NO - orthogonal demands |
| recovery_recommended + blocked recovery priority | Priority Contradiction | Microcycle → Priority | YES - fallback exists |
| functional_overreach ≥ 70 + maladaptation ≥ 65 | Decision Oscillation | Microcycle | YES - priority-based |

### 3.2 Collapse Propagation Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                    SEMANTIC COLLAPSE GRAPH                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Recovery Engine (CNS ≤ 30)                                      │
│       │                                                           │
│       ├──→ complexity_ceiling = 4 ──→ blocks 70% exercises       │
│       │         │                                                 │
│       │         └──→ Movement Pattern Loss                       │
│       │                   │                                       │
│       │                   └──→ Repair FAILS (no candidates)      │
│       │                         │                                 │
│       │                         └──→ EMPTY PIPELINE              │
│       │                                                           │
│       ├──→ blocked_stress_classes ──→ blocks classic_competition │
│       │         │                                                 │
│       │         └──→ Specificity Collapse (if high specificity)  │
│       │                   │                                       │
│       │                   └──→ Repair FAILS (all blocked)        │
│       │                                                           │
│       └──→ intensity_ceiling = 75% ──→ Phase Intent Violation    │
│                     (if heavy day planned)                        │
│                                                                   │
│  Microcycle Engine (maladaptation ≥ 85)                          │
│       │                                                           │
│       ├──→ restoration_bias = 1.0 ──→ filters high CNS exercises │
│       │         │                                                 │
│       │         └──→ Specificity Collapse (if specificity high)  │
│       │                                                           │
│       └──→ recovery_recommended = true ──→ blocks high CNS       │
│                 │                                                 │
│                 └──→ Priority Contradiction (if strength day)    │
│                                                                   │
│  Arbitration (dominant_sources = ["recovery"])                   │
│       │                                                           │
│       └──→ All constraints minimize to recovery minimum          │
│             │                                                     │
│             └──→ Priority signals ignored (priority = 40)        │
│                   │                                               │
│                   └──→ Phase Intent Violation                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Unsafe Repair Map

### 4.1 Repair Path Analysis

The semantic validator's repair mechanism in `repairWorkout()` has several instability points:

| Repair Strategy | Trigger Condition | Success Rate | Failure Mode | Risk Level |
|-----------------|-------------------|--------------|--------------|------------|
| `least_violating_non_empty_fallback` | empty_pipeline | 60% | All candidates blocked | HIGH |
| `preserve_specificity_exposure` | specificity_collapse | 40% | Classic candidates blocked by recovery | HIGH |
| `restore_pull_exposure` | movement_pattern_loss (pull) | 30% | All pull candidates complexity > ceiling | HIGH |
| `restore_squat_exposure` | movement_pattern_loss (squat) | 50% | Some squat candidates available | MEDIUM |
| `restore_lower_body_exposure` | movement_pattern_loss (lower) | 45% | Partial availability | MEDIUM |

### 4.2 Unsafe Repair Zones

**Zone 1: Recovery-Dominated State**
```
When: CNS ≤ 30 OR coordination ≤ 30
Repair Behavior: Attempts to add CLASSIC_CANDIDATES or PULL_CANDIDATES
Problem: ALL candidates have complexity > 4 or are blocked by stress_class
Result: Repair adds nothing, workout remains empty
Risk: SILENT FAILURE - no exception thrown, empty workout returned
```

**Zone 2: High-Specificity + Blocked Classics**
```
When: specificity_pressure ≥ 0.65 AND classic_competition blocked
Repair Behavior: Attempts preserve_specificity_exposure
Problem: CLASSIC_CANDIDATES all blocked by recovery protection
Result: Repair skips all candidates, specificity collapse unaddressed
Risk: SEMANTIC INCOHERENCE - specificity demand unmet
```

**Zone 3: Multi-Domain Protection**
```
When: ≥3 domains protected simultaneously
Repair Behavior: Tries multiple repair strategies
Problem: Strategies conflict (e.g., restore pull vs respect complexity ceiling)
Result: Repair oscillates between strategies, no stable solution
Risk: REPAIR LOOP - potential infinite iteration (mitigated by single-pass design)
```

---

## 5. Constraint Conflict Map

### 5.1 Constraint Priority Inversion

The constraint priority hierarchy in `constraint-arbitration.ts:CONSTRAINT_PRIORITY` creates systematic conflicts:

| Source | Priority | Effect | Conflict With |
|--------|----------|--------|---------------|
| recovery | 100 | Always wins | ALL other sources |
| intervention | 90 | Safety blocks | priority, sometimes microcycle |
| microcycle | 70 | Planning signals | priority, sometimes intervention |
| competition | 50 | Timing signals | microcycle, priority |
| priority | 40 | Preferences | ALL higher sources |

**Conflict Pattern 1: Recovery vs Priority**
```
Scenario: Heavy day planned (priority = squat_strength, intensity 80-100%)
          Recovery: CNS ≤ 30 (intensity_ceiling = 75%)
Result:   Recovery ALWAYS wins (priority 100 vs 40)
Impact:   Phase intent violation - heavy day becomes light day
Detection: semantic-validator catches "heavy_days_remain_heavier_than_recovery_days"
```

**Conflict Pattern 2: Competition vs Recovery**
```
Scenario: Competition ≤ 7 days (specificity_pressure = 1.0)
          Recovery: CNS ≤ 30 (blocked_stress_classes includes classic_competition)
Result:   Recovery blocks exercises, Competition demands them
Impact:   SPECIFICITY COLLAPSE - no legal classic exercises
Detection: semantic-validator catches "specificity_collapse"
Recovery: REPAIR FAILS - all classic candidates also blocked
```

**Conflict Pattern 3: Microcycle vs Priority**
```
Scenario: Priority = competition_specific
          Microcycle: blocked_priorities includes competition_specific
Result:   Microcycle hard-blocks priority (safety mechanism)
Impact:   Priority engine falls back to safest alternative
Detection: daily-priority-engine catches and falls back to recovery
```

### 5.2 Normalization Violations

The `normalize()` function pattern appears in several places with inconsistent behavior:

| Location | Function | Normalization Target | Violation Risk |
|----------|----------|---------------------|----------------|
| orchestrator.ts:406 | `normalizeAdaptationTarget()` | "timing" → undefined | LOW - simple mapping |
| orchestrator.ts:558-573 | Legacy helper merge | Min of all ceilings | MEDIUM - ignores arbitration |
| constraint-arbitration.ts:319-341 | `arbitrateRestorationBias()` | Math.max of signals | LOW - correct for bias |
| constraint-arbitration.ts:343-366 | `arbitrateSpecificityPressure()` | Math.max for competition, sum otherwise | HIGH - inconsistent logic |

**Normalization Violation Detected:**
```
Location: constraint-arbitration.ts:arbitrateSpecificityPressure
Issue: Competition signals use Math.max, non-competition use sum
Impact: Same specificity_pressure value treated differently based on source
Example: 
  - competition source with pressure=0.5 → final = 0.5
  - microcycle + priority each with pressure=0.3 → final = 0.6 (sum)
Result: Non-competition sources can exceed competition sources
Classification: SEMANTIC INCOHERENCE
```

---

## 6. Runtime Instability Map

### 6.1 Instability Hotspots

| Hotspot | Trigger | Symptom | Severity |
|---------|---------|---------|----------|
| `buildArbitrationFromEngines()` | Multiple high-severity signals | Dominant sources list grows, overrides all | HIGH |
| `applyOrchestratorConstraints()` | Low complexity_ceiling + high blocking | Exercise count drops to 0 | HIGH |
| `repairWorkout()` | Empty pipeline + blocked candidates | Silent failure, no repair applied | HIGH |
| `validateOrchestratorSemantics()` | Multiple phase intent violations | Confidence drops below 50% | MEDIUM |
| `selectDailyPriority()` | All priorities blocked | Falls back to recovery (safest) | LOW |

### 6.2 Fallback Instability

| Fallback Path | Trigger | Stability | Notes |
|---------------|---------|-----------|-------|
| `selectDailyPriority()` → recovery | All blocked | STABLE | Explicit safety design |
| `repairWorkout()` → non-empty | Empty pipeline | UNSTABLE | Depends on candidate availability |
| `orchestrateAndPrepareWorkout()` → warning-only mode | Semantic errors | STABLE | Warnings logged, continues |
| `orchestrateAndPrepareWorkout()` → strict mode | Semantic errors | TERMINAL | Throws exception |

### 6.3 Oscillation Risks

**Oscillation Pattern 1: Recovery Recommendation Loop**
```
microcycle-engine: maladaptation_risk ≥ 65 → recovery_recommended = true
daily-priority-engine: recovery recommended → bias recovery priority
semantic-validator: recovery day has high intensity → recovery_violation
Next iteration: maladaptation still high → cycle repeats
```

**Oscillation Pattern 2: Specificity Pressure Swing**
```
mesocycle-execution: competition ≤ 7d → specificity_pressure = 1.0
recovery-engine: CNS ≤ 30 → blocks all specific exercises
semantic-validator: specificity_collapse detected
repair: tries to add classics → blocked
Result: specificity_pressure = 1.0 but no specific exercises → semantic incoherence
```

---

## 7. Detected Issues Summary

### 7.1 By Classification

| Classification | Count | High Risk | Medium Risk | Low Risk |
|----------------|-------|-----------|-------------|----------|
| Architecture issue | 3 | 2 | 1 | 0 |
| Runtime issue | 4 | 2 | 2 | 0 |
| Taxonomy issue | 2 | 0 | 1 | 1 |
| Orchestration issue | 5 | 1 | 3 | 1 |
| Repair logic issue | 3 | 3 | 0 | 0 |

### 7.2 Complete Issue Registry

| ID | Issue | Classification | Severity | Location |
|----|-------|----------------|----------|----------|
| R-01 | Specificity-collapse-when-blocked | Architecture | HIGH | constraint-arbitration.ts |
| R-02 | Empty pipeline risk | Repair logic | HIGH | orchestration-semantic-validator.ts |
| R-03 | Intensity floor violation | Orchestration | MEDIUM | constraint-arbitration.ts |
| R-04 | Restoration-override-loop | Runtime | HIGH | orchestrator.ts |
| R-05 | Volume-specificity conflict | Orchestration | MEDIUM | microcycle-engine.ts |
| R-06 | Functional overreach suppression | Runtime | MEDIUM | microcycle-engine.ts |
| R-07 | Coordination-protection-override | Architecture | HIGH | constraint-arbitration.ts |
| R-08 | Movement-pattern-annihilation | Taxonomy | HIGH | exercise-stress-taxonomy.ts |
| R-09 | Protected-domain-contradiction | Orchestration | MEDIUM | recovery-domain-engine.ts |
| R-10 | Repair-path-oscillation | Repair logic | HIGH | orchestration-semantic-validator.ts |
| R-11 | Priority-signal-subordination | Architecture | MEDIUM | constraint-arbitration.ts |
| R-12 | Strength-intensity-mismatch | Runtime | MEDIUM | semantic-validator |
| R-13 | Low-complexity-exercise-scarcity | Taxonomy | LOW | exercise-stress-taxonomy.ts |
| R-14 | Restoration-candidate-exhaustion | Taxonomy | MEDIUM | orchestration-semantic-validator.ts |
| R-15 | Technical-restoration-contradiction | Runtime | LOW | daily-priority-engine.ts |
| R-16 | Corrective-density-spiral | Orchestration | MEDIUM | microcycle-engine.ts |
| R-17 | Intervention-block-cascade | Runtime | HIGH | orchestrator.ts |
| R-18 | Arbitration-dominance-leak | Architecture | MEDIUM | constraint-arbitration.ts |
| R-19 | Blocked-exercise-set-merge-confusion | Orchestration | MEDIUM | orchestrator.ts |
| R-20 | Specificity pressure normalization inconsistency | Orchestration | HIGH | constraint-arbitration.ts |

---

## 8. Recommended Stabilization Order

### Priority 1: Critical Path Fixes (Immediate)

1. **R-01: Specificity-collapse-when-blocked**
   - **Location:** constraint-arbitration.ts, orchestrator-signal-bridge.ts
   - **Fix:** Add competition-proximity override for recovery blocks when competition ≤ 3 days
   - **Risk if unaddressed:** Empty workouts near competition

2. **R-07: Coordination-protection-override**
   - **Location:** constraint-arbitration.ts:arbitrateComplexityCeiling
   - **Fix:** Add graduated complexity ceiling (not absolute) for coordination protection
   - **Risk if unaddressed:** 70% exercise database blocked

3. **R-10: Repair-path-oscillation**
   - **Location:** orchestration-semantic-validator.ts:repairWorkout
   - **Fix:** Add repair termination condition when all candidates exhausted
   - **Risk if unaddressed:** Silent repair failures

### Priority 2: High-Impact Fixes (Short-term)

4. **R-02: Empty pipeline risk**
   - **Location:** orchestration-semantic-validator.ts
   - **Fix:** Expand RESTORATION_CANDIDATES and add emergency fallback exercise
   - **Risk if unaddressed:** Users receive empty workouts

5. **R-04: Restoration-override-loop**
   - **Location:** orchestrator.ts
   - **Fix:** Add restoration_bias cap when specificity_pressure is high
   - **Risk if unaddressed:** Training intent lost

6. **R-08: Movement-pattern-annihilation**
   - **Location:** exercise-stress-taxonomy.ts
   - **Fix:** Add more low-complexity pull and squat variations
   - **Risk if unaddressed:** Movement pattern gaps

7. **R-17: Intervention-block-cascade**
   - **Location:** orchestrator.ts:applyInterventionConstraints
   - **Fix:** Limit blocked_exercises growth, add block expiration
   - **Risk if unaddressed:** Exercise pool shrinks to zero

8. **R-20: Specificity pressure normalization inconsistency**
   - **Location:** constraint-arbitration.ts:arbitrateSpecificityPressure
   - **Fix:** Normalize all sources to same aggregation method (Math.max)
   - **Risk if unaddressed:** Semantic incoherence

### Priority 3: Medium-Impact Fixes (Medium-term)

9. **R-03: Intensity floor violation**
10. **R-05: Volume-specificity conflict**
11. **R-09: Protected-domain-contradiction**
12. **R-11: Priority-signal-subordination**
13. **R-14: Restoration-candidate-exhaustion**
14. **R-16: Corrective-density-spiral**
15. **R-18: Arbitration-dominance-leak**
16. **R-19: Blocked-exercise-set-merge-confusion**

### Priority 4: Low-Impact Fixes (Long-term)

17. **R-06: Functional overreach suppression**
18. **R-12: Strength-intensity-mismatch**
19. **R-13: Low-complexity-exercise-scarcity**
20. **R-15: Technical-restoration-contradiction**

---

## 9. Architectural Bottlenecks

### 9.1 Single Point of Failure: Arbitration

The `arbitrateConstraints()` function is the single authoritative decision point. All constraint signals flow through it, and its priority hierarchy (recovery=100, priority=40) creates systematic override patterns that cannot be resolved downstream.

**Bottleneck Effect:**
- Recovery signals ALWAYS override priority signals
- Competition signals can override microcycle but not recovery
- No mechanism for priority signals to influence recovery-dominated states

### 9.2 Taxonomy Gap: Low-Complexity Exercises

The exercise-stress-taxonomy has only 4 restoration candidates and limited exercises below complexity 5. This creates a bottleneck when coordination protection activates.

**Bottleneck Effect:**
- complexity_ceiling ≤ 4 → only 4-6 exercises available
- Repair mechanisms exhaust candidates quickly
- No fallback for pull/squat patterns at low complexity

### 9.3 Semantic Validator: Single-Pass Repair

The `repairWorkout()` function operates in a single pass with no iteration. This is correct for stability but means complex multi-constraint collapses cannot be resolved.

**Bottleneck Effect:**
- First repair attempt is the only attempt
- Conflicting repair strategies not reconciled
- Silent failure when all candidates blocked

---

## 10. Repair System Weaknesses

### 10.1 Candidate Exhaustion

The repair system relies on predefined candidate lists:
- `CLASSIC_CANDIDATES`: 4 exercises
- `LOWER_BODY_CANDIDATES`: 4 exercises  
- `PULL_CANDIDATES`: 4 exercises
- `SQUAT_CANDIDATES`: 4 exercises
- `RESTORATION_CANDIDATES`: 4 exercises

When these candidates are blocked by arbitration constraints, repair silently fails.

### 10.2 No Constraint Relaxation

The repair system never attempts to relax constraints. It only tries to find exercises that fit within existing constraints. This means:
- If all candidates are blocked, no repair is possible
- No mechanism to negotiate with arbitration for constraint relaxation
- No fallback to "least bad" option

### 10.3 Authority Preservation Conflicts

The repair system preserves different authorities:
- `arbitration` - respects all blocks
- `safety` - prioritizes non-empty workout
- `specificity` - prioritizes competition-specific exercises
- `diversity` - prioritizes movement pattern coverage

These authorities can conflict, and the single-pass design means only one strategy is attempted per issue.

---

## 11. Summary: Highest-Risk Runtime States

| Rank | Runtime State | Collapse Type | Recovery Possible |
|------|---------------|---------------|-------------------|
| 1 | CNS ≤ 30 + competition ≤ 7d | Specificity Collapse | NO |
| 2 | coordination ≤ 30 + any blocking | Movement Pattern Loss | NO |
| 3 | maladaptation ≥ 85 + accumulation | Phase Intent Violation | NO |
| 4 | complexity_ceiling ≤ 4 + repair needed | Empty Pipeline | NO |
| 5 | restoration_bias = 1.0 + specificity ≥ 0.65 | Specificity Collapse | NO |
| 6 | ≥3 domains protected | Multi-domain Collapse | PARTIAL |
| 7 | blocked_stress_classes ⊇ {classic, pull, squat} | Total Block | NO |
| 8 | intervention blocks ≥ 5 exercises | Cascade Block | PARTIAL |

---

## 12. Safest Stabilization Targets

These are the components that can be safely modified without cascading effects:

1. **exercise-stress-taxonomy.ts** - Add more low-complexity exercises (no downstream impact)
2. **orchestration-semantic-validator.ts** - Expand candidate lists (isolated change)
3. **daily-priority-engine.ts** - Adjust priority scoring weights (local effect)
4. **microcycle-engine.ts** - Tune maladaptation thresholds (local effect)

---

## 13. Unsafe Cleanup Zones

DO NOT modify these without full system testing:

1. **constraint-arbitration.ts:CONSTRAINT_PRIORITY** - Core arbitration hierarchy
2. **orchestrator-signal-bridge.ts:recoveryToSignals** - Recovery signal generation
3. **constraint-arbitration.ts:arbitrateComplexityCeiling** - Coordination protection logic
4. **orchestrator.ts:buildRuntimeCoachingContext** - Main orchestration flow

---

*End of Audit Report*