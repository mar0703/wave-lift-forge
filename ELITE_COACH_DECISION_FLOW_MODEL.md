# ELITE COACH DECISION FLOW MODEL
## Olympic Weightlifting Coaching Intelligence — Intervention Reasoning Architecture

**Version:** 1.0  
**Domain:** Elite Olympic Weightlifting Coaching Decision Science  
**Purpose:** Formalize the sequential reasoning process an elite coach uses when diagnosing movement problems and deciding whether, when, and how to intervene

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Core Coaching Philosophy](#2-core-coaching-philosophy)
3. [Full Decision Flow Architecture](#3-full-decision-flow-architecture)
4. [Sequential Reasoning Model](#4-sequential-reasoning-model)
5. [Intervention Gating Logic](#5-intervention-gating-logic)
6. [Correction Veto System](#6-correction-veto-system)
7. [Athlete Identity Preservation Framework](#7-athlete-identity-preservation-framework)
8. [Compensation Acceptance Framework](#8-compensation-acceptance-framework)
9. [Correction Timing Framework](#9-correction-timing-framework)
10. [Risk-Reward Decision Framework](#10-risk-reward-decision-framework)
11. [Elite-vs-Novice Coaching Logic](#11-elite-vs-novice-coaching-logic)
12. [Runtime Architecture Placement](#12-runtime-architecture-placement)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Purpose and Scope

This document formalizes the decision-making architecture of an elite Olympic weightlifting coach. It models not only **WHAT is wrong** with a movement, but **HOW coaches decide whether intervention is necessary** — a critical distinction that separates coaching intelligence from biomechanical analysis systems.

### 1.2 Core Thesis

**Elite coaching is fundamentally about strategic non-intervention as much as intervention.** The decision to NOT correct is often more important than the decision to correct. This model captures:

- When to intervene vs when to leave alone
- How to distinguish signal from noise in movement variability
- When compensation patterns should be preserved rather than "fixed"
- How competition timing constraints override technical optimization
- Why elite athletes receive different correction philosophies than novices

### 1.3 Key Innovations

1. **Intervention Necessity Threshold** — A formal gating mechanism that prevents unnecessary corrections
2. **Athlete Identity Preservation** — A framework for respecting individual movement signatures
3. **Strategic Under-Correction** — Deliberate choice to correct less than technically possible
4. **Competition-Protection Logic** — Priority system that protects competition performance
5. **Fatigue-State Protection** — Filtering mechanism that prevents correcting fatigue artifacts

---

## 2. CORE COACHING PHILOSOPHY

### 2.1 Fundamental Principles

| Principle | Description | Implication |
|-----------|-------------|-------------|
| **Performance First** | Competition results trump technical purity | Never sacrifice competition performance for technical optimization |
| **Individuality Over Ideology** | Athlete-specific solutions over universal models | Technical model serves athlete, not vice versa |
| **Stability Over Optimization** | Consistent performance over perfect mechanics | Prefer stable 90% over unstable 100% |
| **Timing Is Everything** | When to correct matters as much as what to correct | Competition proximity dictates intervention aggressiveness |
| **Minimal Effective Dose** | Smallest intervention that produces result | Avoid over-correction that disrupts established patterns |
| **Protection Over Perfection** | Protect athlete health and confidence | Never correct at expense of athlete wellbeing |

### 2.2 The Coach's Primary Question

Before any intervention, the elite coach asks:

> **"Will correcting this make the athlete more successful at their next competition?"**

If the answer is "no" or "uncertain," the default is **non-intervention**.

### 2.3 The Three Laws of Coaching Intervention

1. **First Law — Do No Harm**: An intervention that risks competition performance requires extraordinary justification.
2. **Second Law — Preserve Identity**: An athlete's movement signature is their competitive asset; modify only when it limits performance.
3. **Third Law — Respect Timing**: The closer to competition, the more conservative the intervention.

---

## 3. FULL DECISION FLOW ARCHITECTURE

### 3.1 High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           OBSERVATION CAPTURE                                │
│                    (Movement pattern detected in training)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STAGE 1: PATTERN CLASSIFICATION                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Is this:                                                                ││
│  │   □ Normal movement variability?           → NO INTERVENTION           ││
│  │   □ Fatigue artifact?                      → RECOVERY MANAGEMENT       ││
│  │   □ Technical flaw?                        → CONTINUE TO STAGE 2       ││
│  │   □ Compensation pattern?                  → CONTINUE TO STAGE 2       ││
│  │   □ Psychological expression?              → CONTINUE TO STAGE 2       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STAGE 2: TEMPORAL ASSESSMENT                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Pattern Duration:                                                       ││
│  │   □ Transient (single session)             → MONITOR ONLY               ││
│  │   □ Temporary (1-4 weeks)                  → LIGHT INTERVENTION         ││
│  │   □ Established (1-6 months)               → SYSTEMATIC INTERVENTION    ││
│  │   □ Chronic (6+ months)                    → MULTI-MODAL INTERVENTION   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STAGE 3: ROOT CAUSE ANALYSIS                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Distinguish:                                                            ││
│  │   □ Symptom vs Root Cause                                               ││
│  │   □ Compensation vs Dysfunction                                         ││
│  │   □ Capacity Limitation vs Execution Failure                            ││
│  │   □ Strength vs Mobility vs Technical vs Psychological                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STAGE 4: INTERVENTION GATING                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Intervention Necessity Assessment:                                      ││
│  │   □ Does this limit competition performance?                            ││
│  │   □ Is this a safety risk?                                              ││
│  │   □ Will correction improve performance within timeline?                ││
│  │   □ Does athlete have capacity for change?                              ││
│  │   □ Is timing appropriate for intervention?                             ││
│  │                                                                         ││
│  │ Decision: INTERVENE / MONITOR / ACCEPT                                  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (if INTERVENE)
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STAGE 5: CORRECTION VETO CHECK                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Veto Conditions (any = NO INTERVENTION):                                ││
│  │   □ Competition within 4 weeks (unless safety issue)                    ││
│  │   □ Athlete in high fatigue state                                       ││
│  │   □ Pattern is functional compensation                                  ││
│  │   □ Correction would disrupt athlete identity                           ││
│  │   □ Risk of over-correction > benefit of correction                     ││
│  │   □ Athlete psychological state contraindicates correction              ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼ (if NOT VETOED)
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STAGE 6: INTERVENTION CALIBRATION                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Determine:                                                              ││
│  │   □ Correction aggressiveness level                                     ││
│  │   □ Intervention timeline                                               ││
│  │   □ Exercise selection and loading                                      ││
│  │   □ Success metrics and monitoring                                      ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STAGE 7: IMPLEMENTATION & MONITORING                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Execute intervention with:                                              ││
│  │   □ Clear success criteria                                              ││
│  │   □ Regular reassessment checkpoints                                    ││
│  │   □ Exit strategy if not working                                        ││
│  │   □ Competition-protection overrides                                    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Decision Flow State Machine

```
States:
  OBSERVING     → Initial state, pattern detected
  CLASSIFYING   → Determining pattern type
  ASSESSING     → Temporal and root cause analysis
  GATING        → Intervention necessity decision
  VETOING       → Correction veto check
  CALIBRATING   → Intervention parameter setting
  IMPLEMENTING  → Active correction phase
  MONITORING    → Tracking intervention results
  ACCEPTING     → Pattern accepted, no intervention

Transitions:
  OBSERVING → CLASSIFYING     [pattern detected]
  CLASSIFYING → ASSESSING     [pattern classified as intervention-worthy]
  CLASSIFYING → ACCEPTING     [pattern classified as normal/fatigue]
  ASSESSING → GATING          [root cause identified]
  ASSESSING → ACCEPTING       [pattern deemed non-limiting]
  GATING → VETOING            [intervention deemed necessary]
  GATING → ACCEPTING          [intervention deemed unnecessary]
  VETOING → ACCEPTING         [veto condition triggered]
  VETOING → CALIBRATING       [no veto conditions met]
  CALIBRATING → IMPLEMENTING  [parameters set]
  IMPLEMENTING → MONITORING   [intervention active]
  MONITORING → OBSERVING      [reassessment cycle]
  MONITORING → ACCEPTING      [intervention complete or abandoned]
```

---

## 4. SEQUENTIAL REASONING MODEL

### 4.1 The Ten-Step Reasoning Sequence

Elite coaches reason through interventions in a specific sequence. Each step must be resolved before proceeding to the next.

#### Step 1: Temporary vs Chronic Issue

**Question:** Is this a transient pattern or an established characteristic?

| Classification | Duration | Characteristics | Coach Response |
|----------------|----------|-----------------|----------------|
| **Transient** | Single session | Appears once, no history | Observe only, no action |
| **Temporary** | 1-4 weeks | New pattern, learning phase | Light cueing, monitor |
| **Established** | 1-6 months | Consistent pattern, motor engram | Systematic intervention |
| **Chronic** | 6+ months | Deeply ingrained, structural/psychological | Multi-modal approach |

**Decision Rule:**
```
if (pattern_duration < 1_week) → OBSERVE
elif (pattern_duration < 1_month) → LIGHT_INTERVENTION
elif (pattern_duration < 6_months) → SYSTEMATIC_INTERVENTION
else → MULTI_MODAL_INTERVENTION
```

**Elite Coach Insight:** Transient patterns are often noise. Correcting them creates confusion, not improvement.

#### Step 2: Fatigue Artifact vs Real Limitation

**Question:** Is this pattern caused by fatigue or is it a genuine limitation?

| Indicator | Fatigue Artifact | Real Limitation |
|-----------|------------------|-----------------|
| **Temporal Pattern** | Appears late in session | Consistent across session |
| **Load Dependency** | Worse with heavier loads | Present across all loads |
| **Recovery Response** | Normalizes after 48-72h rest | No change after recovery |
| **Fresh State** | Normal when fresh | Abnormal even when fresh |
| **Set-to-Set** | Deteriorates across sets | Consistent across sets |

**Discrimination Protocol:**
```
1. Test pattern in fresh state (beginning of session)
2. Test pattern after 48-72h recovery
3. Compare pattern severity across loading spectrum
4. Check correlation with fatigue metrics (readiness, RPE trends)

if (pattern_normal_when_fresh AND pattern_resolves_with_rest) → FATIGUE_ARTIFACT
elif (pattern_consistent_regardless_of_state) → REAL_LIMITATION
else → INCONCLUSIVE → MONITOR
```

**Intervention Routing:**
- Fatigue Artifact → Recovery management, load adjustment
- Real Limitation → Continue to Step 3

#### Step 3: Symptom vs Root Cause

**Question:** Is this the actual problem or just where the problem manifests?

**Cross-Phase Causality Analysis:**

```
Observed Symptom: Unstable Receive

Possible Upstream Causes:
├── Extension Phase
│   ├── Incomplete triple extension → reduced bar height
│   ├── Forward bar drift → receive position compromised
│   └── Late extension timing → rushed pull-under
├── Pull-Under Phase
│   ├── Slow turnover → late bar reception
│   ├── Late initiation → bar falling during catch
│   └── Poor bar path under body → balance compromised
└── Receive Phase (actual root)
    ├── Overhead stability deficit
    ├── Core stability deficit
    └── Positional confidence issue

Discrimination Process:
1. Analyze extension quality (complete? trajectory?)
2. Analyze pull-under timing (speed? initiation?)
3. Analyze receive-specific factors (stability? mobility? confidence?)
4. Determine PRIMARY cause (upstream vs downstream)

Rule: Correct the ROOT CAUSE, not the downstream symptom.
```

**Root Cause Priority:**
1. Upstream timing/coordination issues (highest leverage)
2. Upstream power/force issues
3. Downstream stability/mobility issues
4. Psychological/confidence issues (often overlooked)

#### Step 4: Compensation vs Dysfunction

**Question:** Does this pattern serve a protective or adaptive function?

| Criterion | Compensation | Dysfunction |
|-----------|--------------|-------------|
| **Function** | Serves protective/adaptive purpose | Indicates limitation/weakness |
| **Consistency** | Consistent across contexts | May vary with fatigue/state |
| **Removal Risk** | Removing may expose limitation | Addressing improves performance |
| **Origin** | Adaptive response to limitation | Primary movement fault |

**Compensation Recognition Patterns:**

```
Pattern: Hip-Dominant Pull
├── Observable: Excessive hip elevation, reduced knee contribution
├── Compensated Limitation: Quad weakness, knee pain, ankle mobility
├── Function: Reduces knee demand, shifts load to hips
├── Risk if Removed: May expose quad weakness or mobility limitation
└── Decision: Address root limitation FIRST, then modify compensation

Pattern: Forward Torso Compensation
├── Observable: Excessive forward lean in catch/recovery
├── Compensated Limitation: Ankle mobility, quad strength, core stability
├── Function: Maintains balance with limited ankle dorsiflexion
├── Risk if Removed: May cause forward fall if mobility not addressed
└── Decision: Address mobility FIRST, then modify torso angle

Pattern: Arm-Dominant Pull
├── Observable: Early arm bend, excessive high pull
├── Compensated Limitation: Leg power deficit, timing coordination deficit
├── Function: Generates bar height through arm pull when leg drive insufficient
├── Risk if Removed: May reduce bar height if power not developed
└── Decision: Develop leg power FIRST, then modify pull pattern
```

**Compensation Resolution Protocol:**
```
Phase 1: Identify Root Limitation
Phase 2: Address Root Cause (mobility, strength, coordination)
Phase 3: Gradually Modify Compensation (only after root addressed)
Phase 4: Integration and Monitoring
```

#### Step 5: Athlete Identity Preservation

**Question:** Will correcting this pattern disrupt the athlete's movement signature?

**Movement Identity Components:**
- Natural rhythm and tempo preferences
- Individual bar path characteristics
- Personal start position variations
- Unique receiving style
- Characteristic aggression/commitment level

**Identity Preservation Assessment:**

```
Identity Preservation Score (0-100):
├── Pattern Uniqueness (how specific to this athlete?)
├── Pattern Consistency (how stable across time?)
├── Pattern Success Association (linked to successful lifts?)
├── Pattern Comfort (athlete feels "right" with pattern?)
└── Pattern Competition Stability (maintained under pressure?)

if (identity_score > 70 AND pattern_not_limiting_performance) → PRESERVE
elif (identity_score > 50 AND pattern_somewhat_limiting) → MODIFY_CAUTIOUSLY
else → CORRECT
```

**Identity Preservation Rules:**
1. Never correct a pattern that is part of an athlete's successful signature
2. Modify at the margins, not the core, of movement identity
3. Preserve characteristics that contribute to competition stability
4. Accept individual variations that don't limit performance

#### Step 6: Risk vs Reward of Correction

**Question:** Does the potential benefit outweigh the risk of disruption?

**Risk-Reward Matrix:**

```
                        REWARD
                    Low         High
              ┌───────────┬───────────┐
              │           │           │
         Low  │  AVOID    │  CONSIDER │
              │           │           │
    RISK      ├───────────┼───────────┤
              │           │           │
        High  │  REJECT   │  WEIGH    │
              │           │           │
              └───────────┴───────────┘

Risk Factors:
├── Competition proximity (higher risk closer to competition)
├── Pattern chronicity (higher risk for chronic patterns)
├── Athlete confidence level (higher risk if confidence fragile)
├── Training phase (higher risk in intensification/peak)
├── Pattern integration depth (higher risk if deeply ingrained)
└── Previous correction failures (higher risk if history of failure)

Reward Factors:
├── Performance limitation severity
├── Safety risk if uncorrected
├── Competition performance impact
├── Long-term development value
└── Transfer to competition lifts
```

**Decision Rule:**
```
if (risk_score > reward_score) → NO_INTERVENTION
elif (risk_score ≈ reward_score AND competition_near) → NO_INTERVENTION
elif (risk_score ≈ reward_score AND competition_far) → CAUTIOUS_INTERVENTION
else → INTERVENTION
```

#### Step 7: Competition Timing Constraints

**Question:** How does competition timing affect intervention appropriateness?

**Competition Proximity Framework:**

```
Timeline to Competition:

12+ weeks (Off-Season)
├── Intervention Aggressiveness: HIGH
├── Acceptable Disruption: HIGH
├── Focus: Fundamental changes, multi-modal interventions
└── Veto Threshold: LOW (few vetoes)

8-12 weeks (Preparation Phase)
├── Intervention Aggressiveness: MODERATE-HIGH
├── Acceptable Disruption: MODERATE
├── Focus: Technical refinement, targeted interventions
└── Veto Threshold: MODERATE

4-8 weeks (Pre-Competition)
├── Intervention Aggressiveness: MODERATE-LOW
├── Acceptable Disruption: LOW
├── Focus: Stabilization, minimal corrections
└── Veto Threshold: HIGH (many vetoes)

0-4 weeks (Competition Phase)
├── Intervention Aggressiveness: MINIMAL
├── Acceptable Disruption: VERY LOW
├── Focus: Maintenance, confidence building
└── Veto Threshold: VERY HIGH (almost all corrections vetoed)

Exception: Safety-critical issues may override timing constraints
```

**Competition-Protection Logic:**
```
if (weeks_to_competition < 4) {
    if (issue_type == SAFETY_CRITICAL) → MINIMAL_INTERVENTION
    else → DEFER_UNTIL_POST_COMPETITION
}
elif (weeks_to_competition < 8) {
    if (intervention_duration < 2_weeks) → PROCEED
    else → DEFER_OR_SIMPLIFY
}
else {
    → PROCEED_WITH_STANDARD_PROTOCOL
}
```

#### Step 8: Intervention Necessity Threshold

**Question:** Does this issue meet the threshold for intervention?

**Necessity Criteria (any = INTERVENE):**
1. **Safety Risk**: Pattern creates injury risk
2. **Performance Limitation**: Pattern demonstrably limits competition performance
3. **Progressive Degradation**: Pattern is worsening over time
4. **Competition Impact**: Pattern causes competition failures
5. **Athlete Distress**: Pattern causes significant athlete concern

**Non-Necessity Criteria (any = DO NOT INTERVENE):**
1. **Aesthetic Only**: Pattern is "ugly" but functional
2. **Model Deviation**: Pattern deviates from ideal model but produces results
3. **Transient**: Pattern appears only under specific temporary conditions
4. **Compensatory Function**: Pattern serves protective purpose
5. **Identity Core**: Pattern is central to athlete's movement signature

**Threshold Calculation:**
```
Intervention_Necessity_Score = 
    (safety_risk * 3) + 
    (performance_impact * 2) + 
    (degradation_rate * 2) + 
    (competition_impact * 2) + 
    (athlete_concern * 1) -
    (aesthetic_only * 2) -
    (compensatory_function * 2) -
    (identity_core * 3)

if (score > 5) → INTERVENE
elif (score > 2) → CONSIDER
else → DO_NOT_INTERVENE
```

#### Step 9: Correction Aggressiveness Selection

**Question:** How aggressively should the correction be pursued?

**Aggressiveness Levels:**

| Level | Description | Use Case | Duration | Volume |
|-------|-------------|----------|----------|--------|
| **Minimal** | Light cueing only | Maintenance, competition phase | Ongoing | Negligible |
| **Light** | Occasional drills | Minor refinements, pre-competition | 2-4 weeks | Low |
| **Moderate** | Regular corrective work | Technical development, preparation | 4-8 weeks | Moderate |
| **Aggressive** | Primary training focus | Major technical overhaul, off-season | 8-16 weeks | High |
| **Intensive** | Comprehensive reprogramming | Chronic issues, multi-modal approach | 16+ weeks | Very High |

**Aggressiveness Selection Factors:**
```
Base Level = f(
    issue_severity,
    competition_timeline,
    training_phase,
    athlete_training_age,
    pattern_chronicity,
    previous_correction_history
)

Adjustments:
├── Increase if: Safety risk, rapid degradation, high performance impact
├── Decrease if: Competition near, fragile confidence, high fatigue
└── Override if: Competition within 4 weeks → MINIMAL
```

#### Step 10: Minimal Effective Intervention Logic

**Question:** What is the smallest intervention that will produce the desired result?

**Minimal Effective Dose Principles:**
1. Start with the simplest intervention
2. Escalate only if simpler interventions fail
3. Prefer cueing over drills, drills over exercises
4. Prefer single-focus over multi-focus interventions
5. Prefer high-transfer over low-transfer exercises

**Intervention Escalation Ladder:**
```
Level 1: Verbal/Visual Cueing
├── Single cue focus
├── Immediate feedback
└── Escalate if: No improvement after 2-3 sessions

Level 2: Technical Drills
├── Position-specific drills
├── Reduced load patterning
└── Escalate if: No improvement after 2-4 weeks

Level 3: Corrective Exercises
├── Targeted exercise selection
├── Moderate volume integration
└── Escalate if: No improvement after 4-8 weeks

Level 4: Comprehensive Reprogramming
├── Multi-exercise approach
├── Training structure modification
└── Last resort for chronic issues
```

**Minimal Intervention Selection:**
```
Select intervention at lowest level that:
1. Addresses root cause (not symptom)
2. Fits within competition timeline
3. Matches athlete training age
4. Respects fatigue state
5. Preserves movement identity

Prefer:
- Cueing over drilling
- Single exercises over complexes
- High-transfer over low-transfer
- Simple over complex
- Familiar over novel
```

---

## 5. INTERVENTION GATING LOGIC

### 5.1 Gating Framework

The intervention gating system determines whether an observed pattern warrants any intervention at all. It is the first and most critical filter in the coaching decision process.

### 5.2 Gate Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INTERVENTION GATING SYSTEM                           │
└─────────────────────────────────────────────────────────────────────────────┘

Gate 1: Pattern Reality Check
├── Is the pattern real or perceptual artifact?
├── Is it consistent or one-time occurrence?
└── Decision: REAL / ARTIFACT

Gate 2: Pattern Classification
├── Normal variability / Fatigue artifact / Technical flaw / Compensation
└── Decision: INTERVENE_WORTHY / NON_INTERVENE_WORTHY

Gate 3: Performance Impact Assessment
├── Does pattern limit competition performance?
├── Does pattern create safety risk?
└── Decision: IMPACT / NO_IMPACT

Gate 4: Temporal Appropriateness
├── Is timing appropriate for intervention?
├── Competition proximity considerations
└── Decision: APPROPRIATE_TIMING / INAPPROPRIATE_TIMING

Gate 5: Athlete Capacity Check
├── Does athlete have capacity for change?
├── Physical, technical, psychological readiness
└── Decision: CAPABLE / NOT_CAPABLE

FINAL GATE: Intervention Authorization
├── All gates passed → AUTHORIZE_INTERVENTION
├── Any gate failed → DEFER_OR_REJECT
└── Partial pass → CONDITIONAL_AUTHORIZATION
```

### 5.3 Gate 1: Pattern Reality Check

**Purpose:** Distinguish real patterns from perceptual noise.

```
Reality Check Criteria:

Consistency Test:
├── Observed in 3+ consecutive sessions? → REAL
├── Observed in 2 sessions? → POSSIBLY_REAL
├── Observed in 1 session? → ARTIFACT

Cross-Context Test:
├── Present across different exercises? → REAL
├── Present across different loads? → REAL
├── Present only in specific context? → CONTEXT_DEPENDENT

Observer Corroboration:
├── Multiple observers agree? → REAL
├── Video analysis confirms? → REAL
├── Single observation? → NEEDS_CORROBORATION

Decision Matrix:
┌─────────────┬─────────────┬─────────────┬──────────────────────────────────┐
│ Consistency │ Cross-Ctxt  │ Corroboration│ Decision                        │
├─────────────┼─────────────┼─────────────┼──────────────────────────────────┤
│ High        │ High        │ High        │ REAL → Proceed to Gate 2         │
│ High        │ Low         │ High        │ CONTEXT_SPECIFIC → Note context  │
│ Low         │ Any         │ Any         │ ARTIFACT → Monitor, no action    │
│ Any         │ Any         │ Low         │ NEEDS_MORE_DATA → Continue obs.  │
└─────────────┴─────────────┴─────────────┴──────────────────────────────────┘
```

### 5.4 Gate 2: Pattern Classification

**Purpose:** Classify pattern type to determine intervention worthiness.

```
Classification Tree:

Pattern Observed
│
├─ Is pattern within normal movement variability range?
│  ├─ Yes → NORMAL_VARIABILITY → NO_INTERVENTION
│  └─ No → Continue
│
├─ Does pattern correlate with fatigue state?
│  ├─ Yes, strongly → FATIGUE_ARTIFACT → RECOVERY_MANAGEMENT
│  └─ No/Weak → Continue
│
├─ Does pattern serve apparent protective function?
│  ├─ Yes → COMPENSATION → Continue to Root Cause Analysis
│  └─ No → Continue
│
├─ Does pattern indicate technical deficiency?
│  ├─ Yes → TECHNICAL_FLAW → Continue to Root Cause Analysis
│  └─ No → Continue
│
├─ Does pattern indicate psychological factor?
│  ├─ Yes → PSYCHOLOGICAL_EXPRESSION → Continue to Root Cause Analysis
│  └─ No → Continue
│
└─ Unclassified → MONITOR_FOR_MORE_DATA
```

### 5.5 Gate 3: Performance Impact Assessment

**Purpose:** Determine if pattern actually matters for performance.

```
Impact Assessment Framework:

Performance Impact Questions:
1. Does pattern cause missed lifts in training?
2. Does pattern cause competition failures?
3. Does pattern limit weight progression?
4. Does pattern create injury risk?
5. Does pattern reduce movement efficiency?

Impact Scoring:
├── 5/5 criteria met → HIGH_IMPACT
├── 3-4/5 criteria met → MODERATE_IMPACT
├── 1-2/5 criteria met → LOW_IMPACT
└── 0/5 criteria met → NO_IMPACT

Decision:
├── HIGH_IMPACT → INTERVENE_WORTHY
├── MODERATE_IMPACT → CONDITIONALLY_WORTHY
├── LOW_IMPACT → MONITOR_ONLY
└── NO_IMPACT → NO_INTERVENTION
```

### 5.6 Gate 4: Temporal Appropriateness

**Purpose:** Ensure timing is appropriate for intervention.

```
Temporal Assessment:

Competition Proximity:
├── >12 weeks → HIGH_APPROPRIATENESS
├── 8-12 weeks → MODERATE_APPROPRIATENESS
├── 4-8 weeks → LOW_APPROPRIATENESS
└── <4 weeks → INAPPROPRIATE (unless safety)

Training Phase:
├── Off-season/General prep → HIGH_APPROPRIATENESS
├── Specific prep → MODERATE_APPROPRIATENESS
├── Pre-competition → LOW_APPROPRIATENESS
└── Competition → INAPPROPRIATE

Athlete State:
├── Fresh, recovered → HIGH_APPROPRIATENESS
├── Moderate fatigue → MODERATE_APPROPRIATENESS
├── High fatigue → LOW_APPROPRIATENESS
└── Overreached → INAPPROPRIATE

Combined Appropriateness:
├── All high → PROCEED
├── Mixed → CONDITIONAL_PROCEED
└── Any inappropriate → DEFER
```

### 5.7 Gate 5: Athlete Capacity Check

**Purpose:** Verify athlete can successfully engage with intervention.

```
Capacity Assessment:

Physical Capacity:
├── Injury status (clear to train?)
├── Recovery status (adequate for adaptation?)
├── Training age (experienced enough?)
└── Physical readiness (prepared for change?)

Technical Capacity:
├── Body awareness (can feel the difference?)
├── Motor learning ability (can acquire new pattern?)
├── Technical foundation (base for change?)
└── Attention capacity (can focus on correction?)

Psychological Capacity:
├── Confidence level (stable enough for change?)
├── Frustration tolerance (can handle temporary decline?)
├── Trust in coach (will follow guidance?)
└── Motivation (wants to change?)

Capacity Decision:
├── All capacities adequate → CAPABLE
├── Some capacities limited → CONDITIONALLY_CAPABLE
└── Key capacities missing → NOT_CAPABLE
```

### 5.8 Final Gate: Intervention Authorization

```
Authorization Logic:

if (Gate1 == REAL &&
    Gate2 == INTERVENE_WORTHY &&
    Gate3 == IMPACT &&
    Gate4 == APPROPRIATE &&
    Gate5 == CAPABLE) {
    return AUTHORIZE_INTERVENTION
}
elif (Gates 1-3 passed && (Gate4 || Gate5) conditional) {
    return CONDITIONAL_AUTHORIZATION
}
else {
    return DEFER_OR_REJECT
}
```

---

## 6. CORRECTION VETO SYSTEM

### 6.1 Veto Philosophy

The veto system exists to prevent corrections that, while technically justified, would be strategically unwise. It embodies the principle that **not every correctable issue should be corrected**.

### 6.2 Veto Conditions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CORRECTION VETO SYSTEM                             │
└─────────────────────────────────────────────────────────────────────────────┘

VETO CONDITION 1: Competition Proximity
├── Trigger: Competition within 4 weeks
├── Override: Safety-critical issues only
└── Rationale: Protect competition performance

VETO CONDITION 2: High Fatigue State
├── Trigger: Athlete fatigue score > 80/100
├── Override: None
└── Rationale: Cannot correct under fatigue

VETO CONDITION 3: Functional Compensation
├── Trigger: Pattern is functional compensation
├── Override: Root cause addressed first
└── Rationale: Removing compensation before addressing limitation is dangerous

VETO CONDITION 4: Identity Disruption
├── Trigger: Correction would disrupt core movement identity
├── Override: Performance clearly limited
└── Rationale: Identity is competitive asset

VETO CONDITION 5: Over-Correction Risk
├── Trigger: Risk of over-correction > benefit of correction
├── Override: Safety issue
└── Rationale: Over-correction creates new problems

VETO CONDITION 6: Psychological Contraindication
├── Trigger: Athlete psychological state contraindicates correction
├── Override: Address psychology first
└── Rationale: Psychological readiness required for change

VETO CONDITION 7: Training Phase Inappropriateness
├── Trigger: Current training phase incompatible with correction
├── Override: Issue is priority over phase goals
└── Rationale: Phase goals take precedence

VETO CONDITION 8: Insufficient Monitoring Capacity
├── Trigger: Cannot adequately monitor intervention
├── Override: Safety issue
└── Rationale: Unmonitored corrections are risky
```

### 6.3 Veto Decision Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VETO DECISION MATRIX                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Veto Condition          │ Triggered │ Override Available │ Final Decision │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Competition Proximity   │    Y/N    │   Safety only      │   VETO/PROCEED │
│  High Fatigue State      │    Y/N    │   None             │   VETO         │
│  Functional Compensation │    Y/N    │   Root addressed   │   VETO/DEFER   │
│  Identity Disruption     │    Y/N    │   Performance      │   VETO/PROCEED │
│  Over-Correction Risk    │    Y/N    │   Safety           │   VETO/PROCEED │
│  Psychological           │    Y/N    │   Address first    │   VETO/DEFER   │
│  Training Phase          │    Y/N    │   Priority         │   VETO/PROCEED │
│  Monitoring Capacity     │    Y/N    │   Safety           │   VETO/PROCEED │
│                                                                              │
│  FINAL VETO STATUS:       │           │                    │                │
│  □ VETOED (any hard veto triggered, no override)                           │
│  □ DEFERRED (soft veto, address condition then reconsider)                 │
│  □ CLEARED (no vetoes triggered, or all overridden)                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Veto Override Protocol

```
Override Eligibility:

Hard Vetoes (cannot be overridden):
├── High Fatigue State
└── (Safety is exception path, not override)

Soft Vetoes (can be overridden):
├── Competition Proximity → Override if safety-critical
├── Functional Compensation → Override if root cause addressed
├── Identity Disruption → Override if performance clearly limited
├── Over-Correction Risk → Override if safety issue
├── Psychological → Override if addressed first
├── Training Phase → Override if issue is priority
└── Monitoring Capacity → Override if safety issue

Override Authorization:
├── Requires: Senior coach approval
├── Requires: Documented justification
├── Requires: Enhanced monitoring plan
└── Requires: Athlete consultation
```

### 6.5 "Do Not Correct" Scenarios

Explicit scenarios where correction should NOT occur:

```
SCENARIO 1: The "Ugly But Effective" Lift
├── Description: Movement deviates from ideal model but produces results
├── Example: Athlete with unusual bar path but consistent competition success
├── Decision: DO NOT CORRECT
└── Rationale: Results trump aesthetics

SCENARIO 2: The "Competition Signature"
├── Description: Pattern is part of athlete's competition identity
├── Example: Characteristic dip depth that athlete trusts under pressure
├── Decision: DO NOT CORRECT
└── Rationale: Identity preservation > technical optimization

SCENARIO 3: The "Fatigue Mirage"
├── Description: Pattern appears only when fatigued
├── Example: Extension timing degrades only in late sets
├── Decision: DO NOT CORRECT (manage fatigue instead)
└── Rationale: Fatigue management, not technical correction

SCENARIO 4: The "Protective Shield"
├── Description: Compensation protects against injury
├── Example: Modified bar path due to previous injury
├── Decision: DO NOT CORRECT (unless root cause addressed)
└── Rationale: Protection > optimization

SCENARIO 5: The "Wrong Time"
├── Description: Issue is correctable but timing is wrong
├── Example: Technical flaw identified 3 weeks before Olympics
├── Decision: DO NOT CORRECT (defer to post-competition)
└── Rationale: Competition protection > technical improvement

SCENARIO 6: The "Confidence Killer"
├── Description: Correction would damage athlete confidence
├── Example: Athlete anxious about changing trusted pattern
├── Decision: DO NOT CORRECT (address psychology first)
└── Rationale: Confidence > technical purity

SCENARIO 7: The "Stable 90%"
├── Description: Pattern produces stable 90% performance
├── Example: Slight technical flaw but 100% competition success rate
├── Decision: DO NOT CORRECT
└── Rationale: Stability > optimization

SCENARIO 8: The "Novice Over-Correction Risk"
├── Description: Novice athlete with multiple issues
├── Example: Beginner with 5+ technical flaws
├── Decision: CORRECT ONE THING ONLY (strategic under-correction)
└── Rationale: Cognitive load management
```

---

## 7. ATHLETE IDENTITY PRESERVATION FRAMEWORK

### 7.1 Identity Concept

**Movement Identity** is the collection of individual characteristics that make an athlete's technique uniquely theirs. It includes:
- Natural rhythm and tempo
- Personal bar path characteristics
- Individual start position variations
- Unique receiving style
- Characteristic aggression/commitment patterns

### 7.2 Identity Assessment Framework

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ATHLETE IDENTITY ASSESSMENT                              │
└─────────────────────────────────────────────────────────────────────────────┘

IDENTITY COMPONENT 1: Movement Signature
├── Natural Rhythm
│   ├── Tempo preferences (fast/slow/moderate)
│   ├── Pause patterns (pause vs continuous)
│   └── Transition speed (explosive vs controlled)
├── Bar Path Characteristics
│   ├── Natural trajectory tendencies
│   ├── Contact point preferences
│   └── Loop patterns (if any)
├── Position Preferences
│   ├── Start position variations
│   ├── Receiving depth preferences
│   └── Stance width preferences
└── Expression Style
    ├── Aggression level (explosive vs smooth)
    ├── Commitment pattern (all-out vs controlled)
    └── Recovery style (stable vs dynamic)

IDENTITY COMPONENT 2: Success Association
├── Patterns linked to personal bests
├── Patterns used in competition successes
├── Patterns athlete "trusts" under pressure
└── Patterns that feel "right" to athlete

IDENTITY COMPONENT 3: Consistency Markers
├── Patterns stable across training contexts
├── Patterns maintained under competition pressure
├── Patterns resistant to fatigue
└── Patterns persistent over time

IDENTITY COMPONENT 4: Comfort Indicators
├── Patterns athlete reports feeling confident with
├── Patterns that reduce anxiety
├── Patterns athlete resists changing
└── Patterns described as "my lift"
```

### 7.3 Identity Preservation Score

```
Identity Preservation Score (0-100):

Factor                          Weight    Score (0-10)    Weighted
─────────────────────────────────────────────────────────────────
Pattern Uniqueness               1.5      _____          _____
(How specific to this athlete?)

Pattern-Success Association      2.0      _____          _____
(Linked to successful lifts?)

Pattern Consistency              1.5      _____          _____
(Stable across contexts?)

Pattern Comfort                  1.5      _____          _____
(Athlete feels "right" with it?)

Competition Stability            2.0      _____          _____
(Maintained under pressure?)

Pattern Persistence              1.5      _____          _____
(Resistant to change attempts?)

─────────────────────────────────────────────────────────────────
TOTAL SCORE (max 100):                          _____

Interpretation:
├── 80-100: Core identity — preserve at all costs
├── 60-79: Strong identity marker — modify cautiously
├── 40-59: Moderate identity — can modify with care
├── 20-39: Weak identity — modification acceptable
└── 0-19: Not identity-related — free to correct
```

### 7.4 Identity Preservation Decision Rules

```
DECISION RULE 1: Core Identity Protection
if (identity_score >= 80) {
    if (pattern_limiting_performance) {
        → MODIFY_AT_MARGINS_ONLY
    } else {
        → PRESERVE_COMPLETELY
    }
}

DECISION RULE 2: Strong Identity Modification
if (identity_score 60-79) {
    if (pattern_limiting_performance) {
        → MODIFY_CAUTIOUSLY
    } else {
        → PRESERVE
    }
}

DECISION RULE 3: Moderate Identity
if (identity_score 40-59) {
    if (pattern_limiting_performance) {
        → CORRECT_WITH_CARE
    } else {
        → ACCEPT
    }
}

DECISION RULE 4: Low/No Identity
if (identity_score < 40) {
    → STANDARD_CORRECTION_PROTOCOL
}
```

### 7.5 Identity-Preserving Correction Strategies

When correction is necessary but identity must be preserved:

```
STRATEGY 1: Margin Modification
├── Keep core pattern intact
├── Modify only peripheral aspects
├── Example: Keep natural rhythm, adjust only bar contact timing
└── Risk: LOW

STRATEGY 2: Gradual Evolution
├── Very slow pattern modification
├── Maintain athlete comfort throughout
├── Example: Incremental stance width adjustment over months
└── Risk: LOW

STRATEGY 3: Context-Specific Modification
├── Preserve pattern in competition
├── Modify only in training
├── Example: Competition uses natural pattern, training uses modified
└── Risk: MODERATE

STRATEGY 4: Compensation Addition
├── Don't remove existing pattern
├── Add complementary pattern
├── Example: Keep natural pull, add specific receive stability work
└── Risk: LOW

STRATEGY 5: Performance-Linked Modification
├── Only modify when linked to performance improvement
├── Athlete experiences benefit before full adoption
└── Risk: MODERATE
```

---

## 8. COMPENSATION ACCEPTANCE FRAMEWORK

### 8.1 Compensation Philosophy

**Compensations are adaptive solutions, not problems to be fixed.** They represent the body's intelligent response to limitations. The framework distinguishes between:
- **Functional Compensations**: Serve a protective purpose, should be preserved
- **Dysfunctional Compensations**: No longer serve a purpose, can be modified

### 8.2 Compensation Assessment Framework

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     COMPENSATION ASSESSMENT FRAMEWORK                        │
└─────────────────────────────────────────────────────────────────────────────┘

COMPENSATION IDENTIFICATION:

Step 1: Pattern Analysis
├── Is pattern consistent across contexts?
├── Does pattern appear protective?
├── Is pattern linked to specific limitation?
└── Does pattern persist despite technical instruction?

Step 2: Function Analysis
├── What does this pattern accomplish?
├── What would happen if pattern was removed?
├── What limitation does it compensate for?
└── Is the compensation successful?

Step 3: Limitation Identification
├── Mobility restriction?
├── Strength deficit?
├── Coordination limitation?
├── Previous injury adaptation?
└── Structural/anatomical factor?

COMPENSATION CLASSIFICATION:

┌─────────────────────────────────────────────────────────────────────────────┐
│ Type                    │ Function              │ Action                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Functional-Mobility     │ Compensates for       │ Address mobility,         │
│                         │ mobility restriction  │ preserve compensation     │
├─────────────────────────────────────────────────────────────────────────────┤
│ Functional-Strength     │ Compensates for       │ Develop strength,         │
│                         │ strength deficit      │ gradually modify          │
├─────────────────────────────────────────────────────────────────────────────┤
│ Functional-Protection   │ Protects injury area  │ Maintain unless cleared   │
│                         │                       │ by medical                │
├─────────────────────────────────────────────────────────────────────────────┤
│ Dysfunctional-Habitual  │ No current function,  │ Can modify directly       │
│                         │ just learned pattern  │                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ Dysfunctional-Maladaptive│ Actively harmful,    │ Priority correction       │
│                         │ limits performance    │                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Compensation Acceptance Criteria

```
ACCEPT COMPENSATION (Do Not Correct) When:

1. Compensation is Functional
   ├── Successfully compensates for limitation
   ├── Limitation cannot be fully resolved
   └── Removing compensation would expose limitation

2. Compensation is Protective
   ├── Protects previous injury site
   ├── Medical clearance not obtained
   └── Risk of re-injury if removed

3. Compensation is Identity-Linked
   ├── Part of athlete's movement signature
   ├── Linked to competition success
   └── Removal would disrupt confidence

4. Compensation is Stable
   ├── Pattern is consistent and predictable
   ├── Does not degrade under fatigue
   └── Does not cause secondary issues

5. Compensation Has No Performance Cost
   ├── Does not limit competition performance
   ├── Does not create injury risk
   └── Does not prevent progression

CORRECT COMPENSATION When:

1. Compensation is Dysfunctional
   ├── No longer serves a purpose
   ├── Actively limits performance
   └── Creates secondary movement issues

2. Root Cause is Resolved
   ├── Original limitation has been addressed
   ├── Compensation no longer needed
   └── Athlete has capacity for new pattern

3. Performance Benefit Clear
   ├── Removing compensation will improve performance
   ├── Benefit outweighs disruption risk
   └── Timing is appropriate

4. Compensation is Causing Problems
   ├── Creating injury risk
   ├── Preventing technical development
   └── Limiting competition performance
```

### 8.4 Compensation Resolution Protocol

When compensation correction is warranted:

```
PHASE 1: Root Cause Address (Weeks 1-4)
├── Identify and address underlying limitation
├── Mobility work (if mobility restriction)
├── Strength development (if strength deficit)
├── Coordination training (if motor control)
└── Do NOT modify compensation yet

PHASE 2: Dual Pattern Development (Weeks 5-8)
├── Maintain original compensation
├── Introduce corrected pattern at low load
├── Build new pattern in parallel
└── Athlete learns both patterns

PHASE 3: Gradual Transition (Weeks 9-12)
├── Slowly increase use of new pattern
├── Gradually decrease reliance on compensation
├── Monitor for regression or issues
└── Competition may still use compensation

PHASE 4: Integration (Weeks 13+)
├── New pattern becomes primary
├── Compensation available as backup
├── Full integration into competition
└── Ongoing monitoring

EXIT CRITERIA:
├── Root cause adequately addressed
├── New pattern stable under load
├── New pattern stable under fatigue
├── New pattern stable in competition
└── No regression to old compensation
```

### 8.5 Common Compensation Patterns and Acceptance Logic

```
COMPENSATION: Hip-Dominant Pull
├── Observable: Excessive hip elevation, reduced knee contribution
├── Compensated Limitation: Quad weakness, knee pain, ankle mobility
├── Accept If: Limitation is structural/permanent
├── Correct If: Limitation is addressable and performance-limiting
└── Strategy: Address limitation first, then modify if appropriate

COMPENSATION: Forward Torso Lean
├── Observable: Excessive forward lean in catch/recovery
├── Compensated Limitation: Ankle mobility, quad strength
├── Accept If: Mobility is structural limit, performance stable
├── Correct If: Mobility can improve, performance would benefit
└── Strategy: Improve mobility, maintain torso angle that works

COMPENSATION: Arm-Dominant Pull
├── Observable: Early arm bend, excessive high pull
├── Compensated Limitation: Leg power deficit, timing deficit
├── Accept If: Power deficit is permanent, pattern is effective
├── Correct If: Power can develop, timing can improve
└── Strategy: Develop leg power, then modify pull pattern

COMPENSATION: Wide Stance
├── Observable: Stance wider than technical model
├── Compensated Limitation: Hip structure, adductor mobility
├── Accept If: Structural/anatomical, performance stable
├── Correct If: Mobility can improve, would benefit performance
└── Strategy: Respect anatomy, optimize within individual structure

COMPENSATION: Modified Bar Path
├── Observable: Bar path deviates from ideal model
├── Compensated Limitation: Previous injury, structural factors
├── Accept If: Pattern is consistent and effective
├── Correct If: Pattern causes inconsistency or limits performance
└── Strategy: Preserve if functional, modify only if necessary
```

---

## 9. CORRECTION TIMING FRAMEWORK

### 9.1 Timing Philosophy

**When to correct is as important as what to correct.** The framework recognizes that:
- Corrections require adaptation time
- Competition timing constrains intervention options
- Training phases have different correction appropriateness
- Athlete state affects correction readiness

### 9.2 Correction Timing Windows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORRECTION TIMING WINDOWS                            │
└─────────────────────────────────────────────────────────────────────────────┘

WINDOW 1: Off-Season (12+ weeks from competition)
├── Aggressiveness: HIGH
├── Acceptable Disruption: HIGH
├── Intervention Types: All types appropriate
├── Duration Tolerance: Long interventions (8-16 weeks)
├── Focus: Fundamental changes, comprehensive reprogramming
├── Risk Tolerance: HIGH
└── Veto Threshold: LOW

WINDOW 2: General Preparation (8-12 weeks from competition)
├── Aggressiveness: MODERATE-HIGH
├── Acceptable Disruption: MODERATE
├── Intervention Types: Technical and physical interventions
├── Duration Tolerance: Moderate interventions (4-8 weeks)
├── Focus: Technical refinement, targeted development
├── Risk Tolerance: MODERATE-HIGH
└── Veto Threshold: MODERATE

WINDOW 3: Specific Preparation (4-8 weeks from competition)
├── Aggressiveness: MODERATE-LOW
├── Acceptable Disruption: LOW
├── Intervention Types: Technical only, minimal physical
├── Duration Tolerance: Short interventions (2-4 weeks)
├── Focus: Stabilization, fine-tuning
├── Risk Tolerance: LOW-MODERATE
└── Veto Threshold: HIGH

WINDOW 4: Pre-Competition (2-4 weeks from competition)
├── Aggressiveness: LOW
├── Acceptable Disruption: VERY LOW
├── Intervention Types: Cueing only, no structural changes
├── Duration Tolerance: Very short (1-2 weeks max)
├── Focus: Maintenance, confidence building
├── Risk Tolerance: VERY LOW
└── Veto Threshold: VERY HIGH

WINDOW 5: Competition (0-2 weeks from competition)
├── Aggressiveness: MINIMAL
├── Acceptable Disruption: NONE
├── Intervention Types: None (except safety)
├── Duration Tolerance: N/A
├── Focus: Performance execution
├── Risk Tolerance: ZERO
└── Veto Threshold: ABSOLUTE

WINDOW 6: Post-Competition (1-2 weeks after)
├── Aggressiveness: MODERATE
├── Acceptable Disruption: MODERATE
├── Intervention Types: Assessment and planning
├── Duration Tolerance: Variable
├── Focus: Analysis, new cycle planning
├── Risk Tolerance: MODERATE
└── Veto Threshold: LOW
```

### 9.3 Timing Decision Algorithm

```
Timing Decision Process:

Step 1: Determine Competition Timeline
├── Calculate weeks to next competition
├── Identify current training phase
└── Map to correction timing window

Step 2: Assess Issue Urgency
├── Safety critical? → May override timing
├── Performance critical? → Factor into decision
├── Development important? → Consider long-term
└── Cosmetic only? → Defer to appropriate window

Step 3: Evaluate Intervention Duration
├── Estimate time needed for correction
├── Compare to available time before competition
└── Decision: Enough time? / Not enough time?

Step 4: Make Timing Decision

if (weeks_to_competition < 4) {
    if (safety_critical) → MINIMAL_INTERVENTION
    else → DEFER_TO_POST_COMPETITION
}
elif (weeks_to_competition < 8) {
    if (intervention_duration <= 3_weeks) → PROCEED_CAUTIOUSLY
    elif (intervention_duration <= 6_weeks) → SIMPLIFY_AND_PROCEED
    else → DEFER_OR_MODIFY
}
elif (weeks_to_competition < 12) {
    if (intervention_duration <= 8_weeks) → PROCEED
    else → MODIFY_SCOPE
}
else {
    → PROCEED_WITH_STANDARD_PROTOCOL
}
```

### 9.4 Session-Level Timing

Within a training session, timing also matters:

```
SESSION TIMING CONSIDERATIONS:

Best Time for Correction Work:
├── Beginning of session (athlete fresh)
├── After warm-up, before main work
├── When athlete can focus fully
└── When coach can provide full attention

Worst Time for Correction Work:
├── End of session (athlete fatigued)
├── After heavy main lifts
├── When athlete is rushed
└── When coach attention is divided

Fatigue-State Considerations:
├── Fresh state: Best for learning new patterns
├── Moderate fatigue: Can test pattern stability
├── High fatigue: No correction work (only monitoring)
└── Chronic fatigue: No correction work (recovery focus)

Set-to-Set Timing:
├── First set: Establish baseline
├── Middle sets: Implement correction
├── Last sets: Test under fatigue (if appropriate)
└── Never: Continue correction when form breaks down
```

### 9.5 Microcycle Timing

Correction work must be positioned appropriately within the weekly training structure:

```
MICROCYCLE POSITIONING:

High-Priority Correction Day:
├── Position: After rest day
├── Athlete state: Fresh
├── Volume: Moderate (focus on quality)
├── Intensity: Low-moderate (learning focus)
└── Follow-up: Recovery day or light day

Integration Day:
├── Position: Mid-week
├── Athlete state: Moderately fresh
├── Volume: Low (maintenance)
├── Intensity: Build toward working weights
└── Follow-up: Standard training

Testing Day:
├── Position: After adaptation period
├── Athlete state: Fresh
├── Volume: Low
├── Intensity: Build to heavy singles
└── Purpose: Test correction under load

Avoid:
├── Correction work on heavy days
├── Correction work when cumulative fatigue high
├── Correction work before competition
└── Multiple correction focuses in same microcycle
```

---

## 10. RISK-REWARD DECISION FRAMEWORK

### 10.1 Risk-Reward Philosophy

Every coaching intervention carries risk. The framework provides systematic evaluation of:
- What could go wrong (risk assessment)
- What could go right (reward assessment)
- Whether the bet is worth making (decision calculus)

### 10.2 Risk Assessment Framework

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RISK ASSESSMENT MATRIX                             │
└─────────────────────────────────────────────────────────────────────────────┘

RISK DIMENSION 1: Performance Risk
├── Competition Performance Degradation
│   ├── Probability: Low/Medium/High
│   ├── Impact: Minor/Moderate/Severe
│   └── Mitigation: Possible/Partial/Not possible
├── Training Performance Disruption
│   ├── Probability: Low/Medium/High
│   ├── Impact: Minor/Moderate/Severe
│   └── Duration: Short/Medium/Long
└── Confidence Impact
    ├── Probability: Low/Medium/High
    ├── Impact: Minor/Moderate/Severe
    └── Recovery: Easy/Moderate/Difficult

RISK DIMENSION 2: Technical Risk
├── Over-Correction
│   ├── Probability: Based on pattern chronicity
│   ├── Impact: Creates new technical issues
│   └── Reversibility: Easy/Moderate/Difficult
├── Incomplete Correction
│   ├── Probability: Based on intervention quality
│   ├── Impact: Wasted effort, frustration
│   └── Reversibility: N/A (just ineffective)
└── Pattern Confusion
    ├── Probability: Based on intervention complexity
    ├── Impact: Temporary performance decline
    └── Reversibility: Easy with simplified approach

RISK DIMENSION 3: Physical Risk
├── Injury Risk from New Pattern
│   ├── Probability: Based on pattern change magnitude
│   ├── Impact: Minor/Moderate/Severe
│   └── Prevention: Proper progression
├── Fatigue Accumulation
│   ├── Probability: Based on intervention volume
│   ├── Impact: Performance decrement
│   └── Prevention: Volume management
└── Compensation Exposure
    ├── Probability: If removing functional compensation
    ├── Impact: Exposes underlying limitation
    └── Prevention: Address root cause first

RISK DIMENSION 4: Timing Risk
├── Wrong Timing
│   ├── Probability: Based on competition proximity
│   ├── Impact: Competition performance affected
│   └── Prevention: Follow timing framework
├── Insufficient Adaptation Time
│   ├── Probability: Based on intervention scope
│   ├── Impact: Pattern not stable for competition
│   └── Prevention: Realistic timeline
└── Phase Conflict
    ├── Probability: Based on training phase
    ├── Impact: Conflicts with phase goals
    └── Prevention: Phase-appropriate intervention
```

### 10.3 Reward Assessment Framework

```
REWARD DIMENSION 1: Performance Reward
├── Competition Performance Improvement
│   ├── Probability: Based on issue-performance link
│   ├── Magnitude: Small/Moderate/Large
│   └── Timeline: Immediate/Short-term/Long-term
├── Training Performance Improvement
│   ├── Probability: Based on intervention quality
│   ├── Magnitude: Small/Moderate/Large
│   └── Timeline: Immediate/Short-term/Long-term
└── Progression Enablement
    ├── Probability: Based on limitation severity
    ├── Magnitude: Unlocks next level?
    └── Timeline: When will progression occur?

REWARD DIMENSION 2: Technical Reward
├── Movement Efficiency Improvement
│   ├── Probability: Based on technical analysis
│   ├── Magnitude: Marginal/Moderate/Significant
│   └── Transfer: Training → Competition
├── Consistency Improvement
│   ├── Probability: Based on pattern stability
│   ├── Magnitude: Reduced variability?
│   └── Impact: More predictable performance
└── Long-term Development
    ├── Probability: Based on athlete trajectory
    ├── Magnitude: Sets up future gains?
    └── Timeline: Multi-cycle benefit

REWARD DIMENSION 3: Health Reward
├── Injury Risk Reduction
│   ├── Probability: Based on risk factor analysis
│   ├── Magnitude: Reduced injury likelihood?
│   └── Impact: Career longevity
├── Movement Quality Improvement
│   ├── Probability: Based on technical analysis
│   ├── Magnitude: Better movement patterns?
│   └── Impact: Long-term joint health
└── Confidence Improvement
    ├── Probability: Based on athlete response
    ├── Magnitude: Increased self-efficacy?
    └── Impact: Competition performance

REWARD DIMENSION 4: Strategic Reward
├── Competitive Advantage
│   ├── Probability: Based on uniqueness of solution
│   ├── Magnitude: Differentiates from competitors?
│   └── Impact: Medal contention
├── Career Development
│   ├── Probability: Based on athlete potential
│   ├── Magnitude: Unlocks next career level?
│   └── Timeline: When will benefit manifest?
└── Coach-Athlete Relationship
    ├── Probability: Based on communication quality
    ├── Magnitude: Strengthens trust?
    └── Impact: Better long-term collaboration
```

### 10.4 Risk-Reward Decision Calculus

```
DECISION CALCULUS:

Risk Score Calculation:
├── Performance Risk:     ___ × 3 = ___
├── Technical Risk:       ___ × 2 = ___
├── Physical Risk:        ___ × 3 = ___
└── Timing Risk:          ___ × 2 = ___
                              TOTAL: ___

Reward Score Calculation:
├── Performance Reward:   ___ × 3 = ___
├── Technical Reward:     ___ × 2 = ___
├── Health Reward:        ___ × 2 = ___
└── Strategic Reward:     ___ × 1 = ___
                              TOTAL: ___

Decision Matrix:
┌─────────────────────────────────────────────────────────────────────────────┐
│                        │ REWARD HIGH         │ REWARD LOW                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ RISK HIGH              │ Complex Decision     │ REJECT                       │
│                        │ (requires careful    │ (risks outweigh benefits)    │
│                        │ consideration of     │                              │
│                        │ mitigations)         │                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ RISK LOW               │ PROCEED              │ CONSIDER                     │
│                        │ (clear go-ahead)     │ (low stakes, may proceed)    │
└─────────────────────────────────────────────────────────────────────────────┘

Decision Rules:
├── Risk > Reward by >20% → REJECT
├── Risk > Reward by <20% → CAUTIOUS_PROCEED
├── Risk ≈ Reward → CONDITIONAL_PROCEED
├── Reward > Risk by <20% → PROCEED
└── Reward > Risk by >20% → STRONG_PROCEED

Competition Proximity Modifier:
├── >12 weeks: No modification
├── 8-12 weeks: Risk threshold -10%
├── 4-8 weeks: Risk threshold -25%
├── 2-4 weeks: Risk threshold -50%
└── <2 weeks: Risk threshold -90% (almost any risk is too much)
```

### 10.5 Strategic Under-Correction

Sometimes, correcting LESS than technically possible is the optimal strategy:

```
STRATEGIC UNDER-CORRECTION PRINCIPLES:

Principle 1: Good Enough is Good Enough
├── If pattern produces competition success, full correction unnecessary
├── Example: 95% technical efficiency with 100% competition success
├── Decision: Accept 95%, don't chase 100%

Principle 2: Stability Over Optimization
├── Stable 90% > Unstable 100%
├── Example: Slight technical flaw but consistent performance
├── Decision: Preserve stability, accept minor flaw

Principle 3: Cognitive Load Management
├── Athletes have limited attention capacity
├── Example: Novice with multiple issues
├── Decision: Correct ONE thing, ignore others

Principle 4: Confidence Preservation
├── Over-correction can damage confidence
├── Example: Athlete anxious about changing trusted pattern
├── Decision: Minimal intervention, preserve confidence

Principle 5: Competition Priority
├── Competition performance trumps technical purity
├── Example: Technical flaw that doesn't affect competition
├── Decision: No intervention

IMPLEMENTATION:
├── Set correction ceiling (don't correct beyond X%)
├── Define "good enough" criteria upfront
├── Stop intervention when criteria met
├── Resist urge to "finish the job"
└── Accept that some issues remain partially uncorrected
```

### 10.6 Over-Correction Risk Modeling

Over-correction creates new problems while solving old ones:

```
OVER-CORRECTION RISK FACTORS:

Factor 1: Pattern Chronicity
├── Chronic patterns (6+ months): HIGH risk
├── Established patterns (1-6 months): MODERATE risk
├── Temporary patterns (<1 month): LOW risk
└── Rationale: Deeply ingrained patterns resist change

Factor 2: Identity Integration
├── Core identity patterns: HIGH risk
├── Strong identity patterns: MODERATE-HIGH risk
├── Weak identity patterns: LOW-MODERATE risk
└── Non-identity patterns: LOW risk

Factor 3: Correction Aggressiveness
├── Intensive correction: HIGH risk
├── Aggressive correction: MODERATE-HIGH risk
├── Moderate correction: MODERATE risk
├── Light correction: LOW risk
└── Minimal correction: VERY LOW risk

Factor 4: Athlete Training Age
├── Novice (<2 years): HIGH risk (limited adaptation capacity)
├── Intermediate (2-5 years): MODERATE risk
├── Advanced (5-8 years): MODERATE risk
└── Elite (8+ years): LOW risk (high adaptation capacity)

Factor 5: Competition Proximity
├── <4 weeks: HIGH risk (no time for stabilization)
├── 4-8 weeks: MODERATE-HIGH risk
├── 8-12 weeks: MODERATE risk
└── >12 weeks: LOW risk

OVER-CORRECTION PREVENTION:
├── Set correction boundaries upfront
├── Monitor for signs of over-correction
├── Have exit strategy if over-correction occurs
├── Prefer under-correction to over-correction
└── Remember: You can always correct more later
```

---

## 11. ELITE-VS-NOVICE COACHING LOGIC

### 11.1 Philosophy Difference

Elite and novice athletes require fundamentally different coaching approaches:

| Dimension | Novice | Elite |
|-----------|--------|-------|
| **Correction Priority** | Build foundation | Optimize performance |
| **Technical Model** | Follow model closely | Adapt model to athlete |
| **Correction Scope** | Multiple areas | Single focus |
| **Correction Speed** | Slow, gradual | Can be rapid |
| **Identity Consideration** | Low (building identity) | High (preserving identity) |
| **Compensation Tolerance** | Low (build correct patterns) | High (if functional) |
| **Risk Tolerance** | Low (prevent bad habits) | Moderate (calculated risks) |

### 11.2 Training Age Considerations

```
TRAINING AGE FRAMEWORK:

NOVICE (<2 years systematic training)
├── Characteristics:
│   ├── Building fundamental movement patterns
│   ├── High neural adaptability
│   ├── Limited movement vocabulary
│   ├── Rapid strength gains possible
│   └── Technique highly malleable
├── Correction Approach:
│   ├── Follow technical model closely
│   ├── Correct multiple fundamentals
│   ├── Build correct patterns from start
│   ├── Low compensation tolerance
│   └── High repetition for pattern establishment
├── Correction Limits:
│   ├── One technical focus per session
│   ├── Simple cueing only
│   ├── Avoid complex corrections
│   └── Prioritize safety and fundamentals
└── Success Metrics:
    ├── Pattern consistency
    ├── Technical compliance
    └── Foundation building

INTERMEDIATE (2-5 years)
├── Characteristics:
│   ├── Established movement patterns
│   ├── Moderate neural adaptability
│   ├── Developing movement vocabulary
│   ├── Steady strength gains
│   └── Technique refinement phase
├── Correction Approach:
│   ├── Adapt model to individual
│   ├── Targeted corrections
│   ├── Balance foundation and optimization
│   ├── Moderate compensation tolerance
│   └── Strategic correction selection
├── Correction Limits:
│   ├── One primary focus per microcycle
│   ├── Can handle moderate complexity
│   ├── Monitor for over-correction
│   └── Consider competition timing
└── Success Metrics:
    ├── Performance improvement
    ├── Technical efficiency
    └── Competition results

ADVANCED (5-8 years)
├── Characteristics:
│   ├── Highly established patterns
│   ├── Specific adaptability
│   ├── Rich movement vocabulary
│   ├── Incremental gains
│   └── Fine-tuning phase
├── Correction Approach:
│   ├── Highly individualized
│   ├── Minimal corrections
│   ├── Marginal gains focus
│   ├── High compensation tolerance
│   └── Strategic under-correction
├── Correction Limits:
│   ├── Very selective intervention
│   ├── Preserve movement identity
│   ├── Competition timing critical
│   └── Risk-reward analysis essential
└── Success Metrics:
    ├── Competition performance
    ├── Consistency
    └── Career longevity

ELITE (8+ years, international level)
├── Characteristics:
│   ├── Deeply established signature style
│   ├── Specific, refined adaptability
│   ├── Complete movement vocabulary
│   ├── Marginal gains only
│   └── Competition optimization
├── Correction Approach:
│   ├── Extreme individualization
│   ├── Minimal to no corrections
│   ├── Stability over optimization
│   ├── Very high compensation tolerance
│   └── Strategic non-intervention
├── Correction Limits:
│   ├── Intervention only for safety or major performance limit
│   ├── Identity preservation paramount
│   ├── Competition timing absolute
│   └── Risk tolerance very low
└── Success Metrics:
    ├── Medal performance
    ├── Career sustainability
    └── Legacy building
```

### 11.3 Elite Coaching Principles

```
ELITE COACHING PRINCIPLES:

Principle 1: The Athlete Is the Model
├── Technical model serves athlete, not vice versa
├── Individual variations are features, not bugs
├── Success validates approach, not conformity
└── Example: Lu Xiaojun's unique receiving style

Principle 2: Stability Trumps Optimization
├── Consistent 95% > Variable 100%
├── Competition reliability is ultimate metric
├── Don't fix what isn't broken
└── Example: Maintaining trusted patterns under pressure

Principle 3: Strategic Non-Intervention
├── Knowing when NOT to correct is elite skill
├── Some issues resolve with time and training
├── Intervention can create more problems than it solves
└── Example: Leaving minor technical quirks that don't limit performance

Principle 4: Identity Preservation
├── Movement signature is competitive asset
├── Disrupting identity risks competition performance
├── Modify at margins, not core
└── Example: Preserving natural rhythm while adjusting timing

Principle 5: Competition-First Thinking
├── All decisions filtered through competition lens
├── Training performance secondary to competition performance
├── Timing of interventions dictated by competition calendar
└── Example: Deferring corrections until post-competition

Principle 6: Minimal Effective Dose
├── Smallest intervention that produces result
├── Escalate only when necessary
├── Prefer cueing to drilling to exercises
└── Example: Single cue vs. complete technical overhaul

Principle 7: Calculated Risk-Taking
├── Some risks necessary for elite performance
├── Risk-reward analysis guides decisions
├── Accept calculated risks, avoid unnecessary ones
└── Example: Attempting technical change in off-season
```

### 11.4 Novice Coaching Principles

```
NOVICE COACHING PRINCIPLES:

Principle 1: Foundation First
├── Build correct patterns from the start
├── Technical model provides template
├── Prevent bad habits before they form
└── Example: Teaching proper start position before adding load

Principle 2: Compliance Over Individuality
├── Follow technical model closely
├── Individual variations emerge naturally over time
├── Premature individualization creates problems
└── Example: Standard stance width before individual optimization

Principle 3: Comprehensive Development
├── Address multiple technical areas
├── Build complete movement vocabulary
├── Develop all aspects of the lifts
└── Example: Working on start, pull, and receive simultaneously

Principle 4: High Repetition for Pattern Establishment
├── Neural pathways need repeated activation
├── Consistency builds automaticity
├── Quality repetition over intensity
└── Example: High-volume technical work at low intensity

Principle 5: Low Compensation Tolerance
├── Correct compensations early
├── Build capacity rather than compensate
├── Prevent reliance on compensatory patterns
└── Example: Addressing mobility restrictions directly

Principle 6: Clear, Simple Instruction
├── One technical focus at a time
├── Simple, actionable cues
├── Build understanding progressively
└── Example: "Push the floor away" vs. complex biomechanical explanation

Principle 7: Patience and Progression
├── Allow time for adaptation
├── Progressive overload of technical complexity
├── Don't rush the process
└── Example: Mastering positions before connecting them
```

### 11.5 Decision Tree: Elite vs Novice Approach

```
DECISION TREE:

Step 1: Assess Training Age
├── <2 years → NOVICE approach
├── 2-5 years → INTERMEDIATE approach
├── 5-8 years → ADVANCED approach
└── 8+ years → ELITE approach

Step 2: Determine Correction Scope
├── Novice: Multiple fundamentals
├── Intermediate: Targeted areas
├── Advanced: Selective refinement
└── Elite: Minimal intervention

Step 3: Set Technical Model Adherence
├── Novice: High adherence
├── Intermediate: Moderate adaptation
├── Advanced: Significant adaptation
└── Elite: Model serves athlete

Step 4: Establish Compensation Tolerance
├── Novice: Low (build correct patterns)
├── Intermediate: Moderate (selective acceptance)
├── Advanced: High (if functional)
└── Elite: Very high (preserve what works)

Step 5: Determine Intervention Aggressiveness
├── Novice: Light to moderate
├── Intermediate: Moderate
├── Advanced: Light
└── Elite: Minimal

Step 6: Set Risk Tolerance
├── Novice: Low (prevent bad habits)
├── Intermediate: Moderate
├── Advanced: Moderate (calculated)
└── Elite: Low (protect performance)
```

---

## 12. RUNTIME ARCHITECTURE PLACEMENT

### 12.1 System Integration Overview

The Elite Coach Decision Flow Model integrates with the existing coaching intelligence system as a meta-layer that governs all intervention decisions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COACHING INTELLIGENCE SYSTEM ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         DECISION FLOW ORCHESTRATOR                           │
│                    (NEW - Implements this framework)                         │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  • Intervention Gating Logic                                             ││
│  │  • Correction Veto System                                                ││
│  │  • Risk-Reward Decision Engine                                           ││
│  │  • Timing Framework Controller                                           ││
│  │  • Athlete Identity Preservation Module                                  ││
│  │  • Compensation Acceptance Logic                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXISTING SYSTEMS                                     │
│                                                                               │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  Movement        │    │  Diagnostics     │    │  Correction      │       │
│  │  Behavior        │    │  Engine          │    │  Engine          │       │
│  │  Ontology        │    │  (diagnostics.ts)│    │  (correction-    │       │
│  │  (existing)      │    │                  │    │   engine.ts)     │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
│                                                                               │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐       │
│  │  Exercise        │    │  Athlete         │    │  Competition   │         │
│  │  Database        │    │  Profile         │    │  Module          │       │
│  │  (exercise-db.ts)│   │  (existing)      │    │  (existing)      │       │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Module Placement

```
RECOMMENDED FILE STRUCTURE:

src/lib/
├── decision-flow/
│   ├── index.ts                    # Main orchestrator
│   ├── intervention-gating.ts      # Gate logic
│   ├── veto-system.ts              # Veto conditions
│   ├── risk-reward.ts              # Risk-reward calculus
│   ├── timing-framework.ts         # Correction timing
│   ├── identity-preservation.ts    # Identity assessment
│   ├── compensation-acceptance.ts  # Compensation logic
│   ├── elite-novice-logic.ts       # Training age considerations
│   └── types.ts                    # TypeScript interfaces
│
├── diagnostics.ts                  # Existing (unchanged)
├── correction-engine.ts            # Existing (enhanced)
├── exercise-db.ts                  # Existing (unchanged)
└── weightlifting/
    └── movement-model.ts           # Existing (unchanged)
```

### 12.3 Integration Points

```
INTEGRATION WITH EXISTING SYSTEMS:

1. Movement Behavior Ontology Integration
   ├── Input: Behavior classifications (TB, PB, FB, CB, etc.)
   ├── Processing: Apply decision flow to each behavior
   └── Output: Intervention decision per behavior

2. Diagnostics Engine Integration
   ├── Input: Problem detection from diagnostics.ts
   ├── Processing: Apply gating and veto logic
   └── Output: Authorized interventions only

3. Correction Engine Integration
   ├── Input: Authorized interventions from decision flow
   ├── Processing: Select exercises per existing logic
   └── Output: Final exercise selection with constraints

4. Athlete Profile Integration
   ├── Input: Training age, competition history, identity markers
   ├── Processing: Adjust decision parameters based on athlete type
   └── Output: Individualized intervention approach

5. Competition Module Integration
   ├── Input: Competition calendar, proximity
   ├── Processing: Apply timing framework
   └── Output: Time-appropriate intervention decisions
```

### 12.4 Data Flow

```
RUNTIME DATA FLOW:

1. OBSERVATION INPUT
   Training Session Data → Movement Observations → Behavior Classifications

2. BEHAVIOR PROCESSING
   Behavior Classifications → Decision Flow Orchestrator

3. DECISION FLOW EXECUTION
   Decision Flow Orchestrator:
   ├── Stage 1: Pattern Classification
   ├── Stage 2: Temporal Assessment
   ├── Stage 3: Root Cause Analysis
   ├── Stage 4: Intervention Gating
   ├── Stage 5: Correction Veto Check
   ├── Stage 6: Risk-Reward Analysis
   ├── Stage 7: Timing Assessment
   ├── Stage 8: Identity Preservation Check
   ├── Stage 9: Compensation Assessment
   └── Stage 10: Elite-Novice Logic Application

4. INTERVENTION DECISION OUTPUT
   ├── INTERVENE → Correction Engine → Exercise Selection
   ├── MONITOR → No action, continue observation
   └── ACCEPT → No intervention, pattern accepted

5. FEEDBACK LOOP
   Intervention Results → Update Athlete Profile → Refine Future Decisions
```

### 12.5 Interface Definitions

```typescript
// Core decision flow interfaces

interface InterventionDecision {
  action: 'INTERVENE' | 'MONITOR' | 'ACCEPT';
  confidence: number;           // 0-1 confidence in decision
  reasoning: DecisionReasoning;
  constraints?: InterventionConstraints;
}

interface DecisionReasoning {
  patternClassification: PatternClassification;
  temporalAssessment: TemporalAssessment;
  rootCauseAnalysis: RootCauseAnalysis;
  gatingResult: GatingResult;
  vetoStatus: VetoStatus;
  riskRewardAnalysis: RiskRewardAnalysis;
  timingAssessment: TimingAssessment;
  identityPreservationScore: number;
  compensationAssessment: CompensationAssessment;
}

interface InterventionConstraints {
  maxAggressiveness: number;    // 1-10 scale
  allowedDuration: number;      // weeks
  excludedExercises: string[];
  requiredMonitoring: string[];
}

interface AthleteDecisionProfile {
  trainingAge: TrainingAge;
  competitionLevel: CompetitionLevel;
  identityPreservationThreshold: number;
  compensationTolerance: number;
  riskTolerance: number;
  correctionHistory: CorrectionHistory[];
}

// Decision flow processor interface
interface DecisionFlowProcessor {
  processObservation(
    observation: MovementObservation,
    athleteProfile: AthleteDecisionProfile,
    context: TrainingContext
  ): InterventionDecision;
}
```

### 12.6 Implementation Priority

```
IMPLEMENTATION PHASES:

Phase 1: Foundation (Weeks 1-4)
├── Decision Flow Orchestrator core
├── Intervention Gating Logic
├── Basic Veto System
└── Integration with existing diagnostics

Phase 2: Assessment Modules (Weeks 5-8)
├── Risk-Reward Decision Engine
├── Timing Framework Controller
├── Root Cause Analysis enhancement
└── Temporal Assessment logic

Phase 3: Advanced Logic (Weeks 9-12)
├── Athlete Identity Preservation Module
├── Compensation Acceptance Logic
├── Elite-Novice Coaching Logic
└── Strategic Under-Correction implementation

Phase 4: Integration & Refinement (Weeks 13-16)
├── Full system integration
├── Validation against expert coach decisions
├── Performance optimization
└── Documentation and testing
```

### 12.7 Validation Strategy

```
VALIDATION APPROACH:

1. Expert Coach Validation
   ├── Present decision scenarios to elite coaches
   ├── Compare system decisions to coach decisions
   ├── Target: >85% agreement on intervention decisions
   └── Iterate on disagreements

2. Historical Case Analysis
   ├── Apply system to historical training data
   ├── Evaluate whether system would have made correct decisions
   ├── Focus on competition-protection scenarios
   └── Validate timing framework against actual outcomes

3. A/B Testing
   ├── Compare training outcomes with/without decision flow
   ├── Measure competition performance impact
   ├── Track intervention success rates
   └── Monitor athlete feedback

4. Edge Case Testing
   ├── Test all veto conditions
   ├── Validate risk-reward calculations
   ├── Stress test timing framework
   └── Verify elite-novice differentiation
```

---

## APPENDIX A: DECISION FLOW QUICK REFERENCE

### A.1 Intervention Decision Checklist

```
□ Is pattern real and consistent?
□ Is pattern intervention-worthy (not normal variability/fatigue)?
□ Does pattern limit performance or create safety risk?
□ Is timing appropriate for intervention?
□ Does athlete have capacity for change?
□ Are there any veto conditions?
□ Does reward outweigh risk?
□ Is correction aggressiveness appropriate?
□ Is athlete identity preserved?
□ Is compensation appropriately handled?
□ Is approach appropriate for training age?

DECISION: INTERVENE / MONITOR / ACCEPT
```

### A.2 Veto Condition Quick Reference

```
HARD VETO (Cannot Override):
□ High fatigue state (fatigue > 80)

SOFT VETO (Can Override with Justification):
□ Competition within 4 weeks
□ Functional compensation (root not addressed)
□ High identity disruption risk
□ Over-correction risk > benefit
□ Psychological contraindication
□ Training phase inappropriate
□ Insufficient monitoring capacity
```

### A.3 Timing Window Quick Reference

```
12+ weeks: HIGH aggressiveness, HIGH risk tolerance
8-12 weeks: MODERATE-HIGH aggressiveness, MODERATE-HIGH risk
4-8 weeks: MODERATE-LOW aggressiveness, LOW-MODERATE risk
2-4 weeks: LOW aggressiveness, VERY LOW risk
0-2 weeks: MINIMAL intervention, ZERO risk tolerance
```

---

## APPENDIX B: GLOSSARY

| Term | Definition |
|------|------------|
| **Compensation** | Adaptive movement pattern that compensates for limitation |
| **Correction Aggressiveness** | Intensity level of intervention approach |
| **Decision Flow** | Sequential reasoning process for intervention decisions |
| **Dysfunction** | Movement pattern that indicates limitation or deficit |
| **Elite Athlete** | 8+ years training, international competition level |
| **Fatigue Artifact** | Temporary movement degradation due to fatigue |
| **Functional Compensation** | Compensation that serves protective/adaptive purpose |
| **Identity Preservation** | Protecting athlete's unique movement signature |
| **Intervention Gating** | Process of determining whether intervention is warranted |
| **Intervention Necessity** | Threshold that must be met to justify intervention |
| **Minimal Effective Dose** | Smallest intervention that produces desired result |
| **Movement Identity** | Collection of individual characteristics in technique |
| **Novice Athlete** | <2 years systematic training |
| **Over-Correction** | Correcting beyond optimal point, creating new problems |
| **Root Cause** | Underlying mechanism producing observed pattern |
| **Strategic Under-Correction** | Deliberate choice to correct less than technically possible |
| **Symptom** | Observable manifestation of underlying cause |
| **Training Age** | Years of systematic, structured training |
| **Veto Condition** | Factor that prevents intervention despite technical justification |

---

*End of Elite Coach Decision Flow Model*

**Document Version:** 1.0  
**Last Updated:** 2026-05-10  
**Status:** Ready for Implementation Review