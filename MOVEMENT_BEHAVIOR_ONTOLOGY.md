# MOVEMENT BEHAVIOR ONTOLOGY FOR ELITE OLYMPIC WEIGHTLIFTING COACHING INTELLIGENCE

**Version:** 1.0  
**Domain:** Elite Olympic Weightlifting Coaching  
**Purpose:** Formalize how coaches interpret movement behavior patterns, psychological movement signatures, fatigue behaviors, and technical execution styles

---

## TABLE OF CONTENTS

1. [Ontology Overview](#1-ontology-overview)
2. [Behavior Taxonomy](#2-behavior-taxonomy)
3. [Behavior-to-Cause Relationships](#3-behavior-to-cause-relationships)
4. [Observable Evidence Structures](#4-observable-evidence-structures)
5. [Competition Behavior Modeling](#5-competition-behavior-modeling)
6. [Fatigue Behavior Modeling](#6-fatigue-behavior-modeling)
7. [Psychological Behavior Modeling](#7-psychological-behavior-modeling)
8. [Compensation Behavior Logic](#8-compensation-behavior-logic)
9. [Cross-Phase Propagation Logic](#9-cross-phase-propagation-logic)
10. [Runtime Architecture Placement](#10-runtime-architecture-placement)

---

## 1. ONTOLOGY OVERVIEW

### 1.1 Core Philosophy

This ontology distinguishes between:
- **Observable Movement Behavior**: What the coach sees (kinematics, timing, expression)
- **Root Cause**: The underlying mechanism producing the behavior (strength, mobility, psychology, fatigue, coordination)
- **Behavior Signature**: A consistent pattern of movement expression that identifies an athlete's technical identity
- **Evidence Pattern**: Multiple observable indicators that converge on a single inference

### 1.2 Fundamental Distinctions

| Dimension | Description |
|-----------|-------------|
| **Symptom vs Cause** | A forward bar drift (symptom) may be caused by weak lats, poor transition timing, or hip elevation fear |
| **Chronic vs Temporary** | A technical flaw present for 6+ months vs one appearing only under fatigue |
| **Capacity vs Execution** | "Cannot do it" (physical limitation) vs "Did not do it" (execution failure) |
| **Compensation vs Deficit** | A movement pattern that serves a protective function vs one that indicates weakness |
| **Fatigue Artifact vs Technical Flaw** | Temporary degradation from fatigue vs persistent technical deficiency |
| **Competition-Induced vs Training-Normal** | Behaviors that emerge only under competition pressure |

### 1.3 Behavior Persistence Classification

| Persistence Type | Duration | Characteristics | Intervention Approach |
|------------------|----------|-----------------|----------------------|
| **Transient** | Single session | Fatigue-related, resolves with rest | Recovery management |
| **Temporary** | 1-4 weeks | Learning phase, neural adaptation | Technical drilling |
| **Established** | 1-6 months | Engrained motor pattern | Systematic reprogramming |
| **Chronic** | 6+ months | Structural/psychological root | Multi-modal intervention |
| **Competition-Induced** | Competition context only | Pressure-responsive | Psychological + specificity |

### 1.4 Fatigue-Artifact Overlap Matrix

| Behavior | Fresh State | Moderate Fatigue | High Fatigue | Chronic Fatigue |
|----------|-------------|------------------|--------------|-----------------|
| Extension power | Normal | Slightly reduced | Significantly reduced | Consistently poor |
| Pull-under speed | Normal | Slightly slower | Noticeably slow | Chronically slow |
| Position stability | Stable | Minor oscillation | Clear instability | Persistent instability |
| Technical precision | Precise | Minor deviations | Clear errors | Engrained errors |

**Discrimination Rule**: If behavior normalizes after 48-72h recovery → fatigue artifact. If persistent → technical flaw.

---

## 2. BEHAVIOR TAXONOMY

### 2.1 Technical Behaviors (TB)

Observable movement execution patterns related to the technical model.

| Code | Behavior | Observable Evidence | Phases Affected |
|------|----------|---------------------|-----------------|
| TB-01 | **Extension Timing Deviation** | Early extension (hips rise before bar passes knees), Late extension (bar above hips before extension) | First pull → Transition → Extension |
| TB-02 | **Bar Trajectory Deviation** | Forward drift (bar moves away from body), Backward crash (bar contacts hips/thighs aggressively) | All pulling phases |
| TB-03 | **Pull-Under Timing Error** | Early pull-under (before full extension), Late pull-under (after extension completion) | Extension → Receive |
| TB-04 | **Turnover Speed Deficit** | Slow elbow turnover, Passive bar path under body | Extension → Receive |
| TB-05 | **Receive Position Collapse** | Torso flexion in catch, Knee valgus, Heel lift | Receive → Recovery |
| TB-06 | **Fixation Quality Deficit** | Soft lockout, Arm bend under load, Scapular instability | Receive → Recovery |
| TB-07 | **Dip-Drive Sequencing Error** | Dip too deep, Forward knee travel, Incomplete drive | Jerk dip → Drive |
| TB-08 | **Split Timing Error** | Early split (before drive), Late split (after bar ascent stops) | Drive → Split |
| TB-09 | **Recovery Instability** | Multiple steps, Forward/backward hop, Asymmetric foot placement | Recovery |
| TB-10 | **Start Position Inconsistency** | Variable hip height, Inconsistent shoulder position, Grip width drift | Start |

### 2.2 Psychological Behaviors (PB)

Movement expressions that reveal psychological state, confidence, and mental approach.

| Code | Behavior | Observable Evidence | Root Causes |
|------|----------|---------------------|-------------|
| PB-01 | **Positional Fear** | Hesitation before receiving heavy load, Incomplete depth in catch, Protective arm bend | Fear of injury, Previous trauma, Lack of confidence in position |
| PB-02 | **Aggression Deficit** | Passive extension, Slow turnover, Tentative pull-under | Low arousal, Risk aversion, Lack of competitive drive |
| PB-03 | **Technical Confidence** | Smooth execution under load, Consistent positioning, Decisive movement | Mastery experience, Preparation quality, Self-efficacy |
| PB-04 | **Competition Anxiety** | Rushed setup, Inconsistent rhythm, Premature fatigue | Pressure sensitivity, Outcome focus, Over-arousal |
| PB-05 | **Risk Avoidance** | Conservative attempt selection, Modified technique under load, Early bail | Fear of failure, Injury concern, Low confidence |
| PB-06 | **Frustration Expression** | Aggressive bar drop, Visible emotional reaction, Technique deterioration after failure | Perfectionism, Low frustration tolerance, External focus |

### 2.3 Fatigue-Induced Behaviors (FB)

Movement degradation patterns specifically attributable to fatigue state.

| Code | Behavior | Observable Evidence | Fatigue Type | Discrimination |
|------|----------|---------------------|--------------|----------------|
| FB-01 | **Extension Power Loss** | Reduced bar velocity, Incomplete triple extension, Early termination | CNS fatigue | Resolves with 48-72h rest |
| FB-02 | **Pull-Under Speed Reduction** | Slower turnover, Delayed drop under bar, Passive reception | CNS + metabolic | Improves with active recovery |
| FB-03 | **Position Stability Degradation** | Increased oscillation, Balance corrections, Inconsistent catch | Structural fatigue | Correlates with training load |
| FB-04 | **Technical Precision Loss** | Increased movement variability, Phase timing errors, Trajectory deviations | CNS fatigue | Most evident in later sets |
| FB-05 | **Grip Failure** | Hook grip release, Bar roll in hand, Premature fatigue in forearms | Local muscular | Specific to pulling volume |
| FB-06 | **Core Stability Breakdown** | Torso flexion under load, Lumbar rounding, Loss of intra-abdominal pressure | Structural + neural | Worsens with cumulative fatigue |

### 2.4 Competition-State Behaviors (CB)

Behaviors that emerge specifically in competition context or under competitive pressure.

| Code | Behavior | Observable Evidence | Context Trigger |
|------|----------|---------------------|-----------------|
| CB-01 | **Competition Aggression** | Elevated extension power, Faster pull-under, Decisive execution | Competition environment, Important attempts |
| CB-02 | **Competition Breakdown** | Technical deterioration, Rushed execution, Loss of rhythm | High-stakes attempts, Chasing position |
| CB-03 | **Attempt Sequencing Behavior** | Conservative opener, Progressive aggression, Strategic risk-taking | Competition tactics |
| CB-04 | **Warm-Up Behavior** | Over-warming, Under-warming, Excessive drilling | Anxiety management |
| CB-05 | **Between-Attempt Behavior** | Recovery quality, Focus maintenance, Emotional regulation | Competition pacing |
| CB-06 | **Crowd/Environment Response** | Performance elevation, Performance degradation, Distraction susceptibility | External stimuli |

### 2.5 Coordination Behaviors (CoB)

Patterns revealing inter-segmental coordination and movement organization.

| Code | Behavior | Observable Evidence | Coordination Type |
|------|----------|---------------------|-------------------|
| CoB-01 | **Segment Sequencing Error** | Hips before knees, Arms before legs, Shoulders before hips | Temporal coordination |
| CoB-02 | **Force Transfer Inefficiency** | Energy leak at joint, Dissipation of force, Poor kinetic chain | Force transmission |
| CoB-03 | **Bilateral Asymmetry** | Uneven force production, Asymmetric bar path, Stance preference | Left-right coordination |
| CoB-04 | **Rhythm Disruption** | Loss of movement flow, Pauses in execution, Acceleration errors | Temporal patterning |
| CoB-05 | **Stretch-Shortening Cycle Deficit** | Poor utilization of elastic energy, Slow amortization, Weak rebound | SSC coordination |
| CoB-06 | **Proprioceptive Awareness Deficit** | Poor body position sense, Inconsistent catch position, Balance corrections | Spatial awareness |

### 2.6 Commitment/Aggression Behaviors (CAB)

Behaviors expressing the athlete's level of commitment and aggressive intent.

| Code | Behavior | Observable Evidence | Psychological Correlate |
|------|----------|---------------------|------------------------|
| CAB-01 | **Full Commitment** | Maximal acceleration, Complete extension, Decisive pull-under | High confidence, Competitive drive |
| CAB-02 | **Partial Commitment** | Submaximal acceleration, Incomplete extension, Hesitant pull-under | Uncertainty, Risk calculation |
| CAB-03 | **Aggressive Extension** | Explosive triple extension, Audible effort, Visible intent | High arousal, Competitive state |
| CAB-04 | **Passive Execution** | Slow bar velocity, Minimal acceleration, Tentative movement | Low arousal, Fear-based |
| CAB-05 | **Commitment Inconsistency** | Variable execution quality, Set-to-set variation, Load-dependent | Confidence fluctuation |

### 2.7 Stability Behaviors (SB)

Behaviors related to postural control and balance throughout the lift.

| Code | Behavior | Observable Evidence | Stability Domain |
|------|----------|---------------------|------------------|
| SB-01 | **Sagittal Plane Instability** | Forward/backward sway, Hip hunting, Step corrections | Anterior-posterior |
| SB-02 | **Frontal Plane Instability** | Lateral sway, Knee valgus/varus, Asymmetric loading | Medial-lateral |
| SB-03 | **Rotational Instability** | Bar rotation, Torso twist, Asymmetric arm position | Transverse plane |
| SB-04 | **Dynamic Stability Deficit** | Oscillation in catch, Multiple recovery steps, Balance loss | Movement phase |
| SB-05 | **Static Stability Deficit** | Inability to hold finish position, Sway in lockout, Foot movement | End position |

### 2.8 Timing Behaviors (TB)

Temporal patterns in movement execution.

| Code | Behavior | Observable Evidence | Timing Domain |
|------|----------|---------------------|---------------|
| TB-01 | **Phase Duration Anomaly** | Extended first pull, Rushed transition, Prolonged receive | Phase timing |
| TB-02 | **Inter-Phase Timing Error** | Gap between phases, Overlapping phases, Missing transitions | Phase sequencing |
| TB-03 | **Velocity Profile Deviation** | Premature acceleration, Late peak velocity, Multiple acceleration peaks | Velocity timing |
| TB-04 | **Rhythm Pattern Deviation** | Loss of characteristic rhythm, Irregular tempo, Broken flow | Movement rhythm |
| TB-05 | **Reactive Timing Deficit** | Slow response to bar trajectory, Delayed corrections, Late adjustments | Reactive timing |

### 2.9 Positional Behaviors (PB)

Body positioning patterns at key lift positions.

| Code | Behavior | Observable Evidence | Position |
|------|----------|---------------------|----------|
| PB-01 | **Start Position Deviation** | Hip height variance, Shoulder position inconsistency, Weight distribution errors | Start |
| PB-02 | **Power Position Deviation** | Hip-bar relationship error, Knee angle error, Torso angle error | Extension |
| PB-03 | **Catch Position Deviation** | Depth inconsistency, Foot placement variance, Torso angle error | Receive |
| PB-04 | **Recovery Position Deviation** | Asymmetric stance, Incomplete extension, Balance errors | Recovery |
| PB-05 | **Finish Position Deviation** | Incomplete lockout, Asymmetric arm position, Postural collapse | Finish |

### 2.10 Compensation Behaviors (CB)

Adaptive movement patterns that compensate for limitations.

| Code | Behavior | Observable Evidence | Compensated Limitation |
|------|----------|---------------------|------------------------|
| CB-01 | **Hip-Dominant Pull** | Excessive hip elevation, Reduced knee contribution, Early hip extension | Quad weakness, Knee pain, Ankle mobility |
| CB-02 | **Arm-Dominant Pull** | Early arm bend, Excessive high pull, Reduced leg contribution | Leg weakness, Timing deficit, Power deficit |
| CB-03 | **Forward Torso Compensation** | Excessive forward lean, Reduced upright torso, Hip-dominant squat | Ankle mobility, Quad weakness, Core stability |
| CB-04 | **Asymmetric Compensation** | Uneven loading, Stance preference, Dominant side bias | Unilateral weakness, Mobility asymmetry, Injury history |
| CB-05 | **Protective Compensation** | Reduced range of motion, Modified bar path, Avoidance patterns | Pain avoidance, Injury protection, Fear response |
| CB-06 | **Grip Compensation** | Wide grip, Hook grip modification, Wrist position change | Shoulder mobility, Wrist stability, Grip strength |

---

## 3. BEHAVIOR-TO-CAUSE RELATIONSHIPS

### 3.1 Multi-Cause Mapping Framework

Each behavior may have multiple potential causes. The ontology uses a **weighted probability model** where causes are ranked by likelihood based on:
1. **Behavior pattern specificity** (some behaviors are highly specific to certain causes)
2. **Convergent evidence** (multiple behaviors pointing to same cause)
3. **Context factors** (training phase, fatigue state, competition proximity)
4. **Athlete history** (known limitations, injury history, training age)

### 3.2 Cause Categories

| Category | Subcategories | Assessment Methods |
|----------|---------------|-------------------|
| **Strength Limitation** | Max strength, Rate of force development, Strength endurance | Strength ratios, Velocity-based testing, Repetition performance |
| **Mobility Restriction** | Ankle dorsiflexion, Hip mobility, Thoracic extension, Shoulder mobility | Range of motion testing, Position screening, Movement quality |
| **Technical Deficiency** | Motor pattern, Timing, Coordination, Proprioception | Video analysis, Technical screening, Consistency metrics |
| **Psychological Factor** | Confidence, Arousal, Focus, Fear, Aggression | Behavioral observation, Competition performance, Self-report |
| **Fatigue State** | CNS fatigue, Metabolic fatigue, Structural fatigue | Readiness metrics, Performance decrement, Recovery markers |
| **Structural Limitation** | Limb lengths, Joint structure, Connective tissue | Anthropometric assessment, Movement screening |

### 3.3 Behavior → Cause Mapping Matrix

#### Extension Timing Deviation (TB-01)

| Possible Cause | Probability | Discriminating Evidence |
|----------------|-------------|------------------------|
| Weak posterior chain | High | Strong first pull, weak extension, good squat |
| Poor transition timing | High | Inconsistent bar contact, variable extension timing |
| Rushing the movement | Medium | Fast overall tempo, impatience cues, competition anxiety |
| Ankle mobility restriction | Medium | Forward weight shift, heel lift, limited dorsiflexion |
| Fear of heavy load | Low | Hesitation before extension, conservative attempts |

#### Bar Trajectory Deviation (TB-02)

| Possible Cause | Probability | Discriminating Evidence |
|----------------|-------------|------------------------|
| Weak lat engagement | High | Bar drift forward, poor bar contact, weak pulls |
| Hip elevation fear | High | Early hip rise, conservative first pull, protective pattern |
| Poor transition timing | High | Inconsistent scoop, variable bar path, timing errors |
| Grip width error | Medium | Consistent trajectory error, suboptimal leverage |
| Anthropometric mismatch | Low | Consistent pattern across all loads, structural factors |

#### Pull-Under Timing Error (TB-03)

| Possible Cause | Probability | Discriminating Evidence |
|----------------|-------------|------------------------|
| Poor extension-pull under coupling | High | Gap between extension and pull-under, timing disconnection |
| Slow turnover mechanics | High | Slow elbow rotation, passive bar path, weak high pull |
| Positional fear | Medium | Hesitation before catch, incomplete depth, protective pattern |
| Weak extension | Medium | Incomplete extension, reduced bar height, early pull-under |
| Coordination deficit | Medium | Inconsistent timing, variable execution, poor rhythm |

#### Receive Position Collapse (TB-05)

| Possible Cause | Probability | Discriminating Evidence |
|----------------|-------------|------------------------|
| Overhead stability deficit | High | Soft lockout, arm bend, scapular instability |
| Core stability deficit | High | Torso flexion, lumbar rounding, loss of tension |
| Ankle mobility restriction | Medium | Heel lift, forward knee travel, limited dorsiflexion |
| Quad weakness | Medium | Depth limitation, slow recovery, struggle in bottom |
| Positional fear | Medium | Hesitation, incomplete depth, protective arm bend |

### 3.4 Convergent Evidence Patterns

**Pattern 1: Weak Posterior Chain**
- Extension timing deviation (TB-01)
- Extension power loss (FB-01)
- Strong first pull relative to extension
- Clean pull > clean ratio elevated
- Front squat > clean ratio normal

**Pattern 2: Positional Fear**
- Hesitation before receive (PB-01)
- Incomplete depth in catch (PB-03)
- Protective arm bend (TB-06)
- Conservative attempt selection (PB-05)
- Competition breakdown (CB-02)

**Pattern 3: CNS Fatigue**
- Extension power loss (FB-01)
- Pull-under speed reduction (FB-02)
- Technical precision loss (FB-04)
- Performance decrement in later sets
- Readiness metrics depressed

**Pattern 4: Ankle Mobility Restriction**
- Forward torso compensation (CB-03)
- Receive position deviation (PB-03)
- Heel lift in squat positions
- Limited dorsiflexion ROM
- Forward knee travel limitation

---

## 4. OBSERVABLE EVIDENCE STRUCTURES

### 4.1 Evidence Hierarchy

| Level | Evidence Type | Reliability | Example |
|-------|---------------|-------------|---------|
| 1 | Direct kinematic observation | High | Bar trajectory, joint angles, timing |
| 2 | Performance outcome | Medium | Success rate, weight lifted, consistency |
| 3 | Athlete self-report | Low-Medium | RPE, confidence rating, perceived issues |
| 4 | Strength/mobility testing | Medium-High | Ratios, ROM measurements, force metrics |
| 5 | Competition performance | Medium | Attempt success, technical stability under pressure |

### 4.2 Evidence Convergence Model

```
Single Observation → Pattern Recognition → Convergent Evidence → High-Confidence Inference
```

**Example: Identifying Weak Posterior Chain**

1. **Single Observation**: Extension appears weak
2. **Pattern Recognition**: Extension weakness + strong first pull + strong squat
3. **Convergent Evidence**: 
   - Clean pull / clean ratio > 1.2
   - Front squat / clean ratio 1.25-1.45 (normal)
   - Video shows incomplete triple extension
   - Bar velocity drops at extension phase
4. **High-Confidence Inference**: Posterior chain strength deficit

### 4.3 Evidence Weighting System

| Evidence Source | Weight | Conditions |
|-----------------|--------|------------|
| Video kinematic analysis | 3x | Multiple angles, slow motion, expert review |
| Consistent performance pattern | 2x | Same behavior across 3+ sessions |
| Strength ratio anomaly | 2x | Ratio outside normal range by >10% |
| Competition performance | 2x | Behavior consistent under pressure |
| Single session observation | 1x | One-time observation |
| Athlete self-report | 0.5x | Subjective report only |

### 4.4 Contradiction Detection

The system must identify when evidence contradicts the primary inference:

| Primary Inference | Contradicting Evidence | Resolution |
|-------------------|------------------------|------------|
| Weak posterior chain | Strong jump squat, good RFD | Re-evaluate: may be technical timing |
| Positional fear | Aggressive training performance | Re-evaluate: may be competition-specific |
| Technical flaw | Perfect execution when fresh | Re-evaluate: likely fatigue artifact |
| Mobility restriction | Normal ROM in testing | Re-evaluate: may be motor control issue |

---

## 5. COMPETITION BEHAVIOR MODELING

### 5.1 Competition State Dimensions

| Dimension | Low Expression | High Expression | Behavioral Indicators |
|-----------|----------------|-----------------|----------------------|
| **Arousal** | Under-aroused, flat | Over-aroused, anxious | Warm-up intensity, movement tempo, facial expression |
| **Focus** | Distracted, external | Laser-focused, internal | Pre-lift routine, environmental awareness, cue usage |
| **Confidence** | Doubtful, hesitant | Confident, decisive | Attempt selection, execution commitment, body language |
| **Aggression** | Passive, conservative | Aggressive, attacking | Extension power, pull-under speed, bar treatment |
| **Composure** | Rushed, frantic | Calm, controlled | Timing consistency, routine adherence, emotional regulation |

### 5.2 Competition Behavior Profiles

**Profile A: The Competitor**
- Elevated aggression in competition
- Maintains technical precision under pressure
- Strategic attempt selection
- Strong between-attempt recovery
- Performance elevation in competition

**Profile B: The Trainer**
- Technical breakdown in competition
- Rushed execution under pressure
- Conservative or reckless attempt selection
- Poor between-attempt recovery
- Performance decrement in competition

**Profile C: The Technician**
- Consistent technique regardless of context
- Methodical approach to attempts
- Moderate arousal optimization
- Strong routine adherence
- Competition performance matches training

### 5.3 Competition-Induced Behavior Changes

| Training Behavior | Competition Behavior | Interpretation |
|-------------------|----------------------|----------------|
| Aggressive extension | More aggressive | Positive competition response |
| Aggressive extension | Passive | Competition breakdown, arousal mismatch |
| Consistent timing | Rushed timing | Anxiety-induced, needs composure work |
| Consistent timing | Slower timing | Over-thinking, needs trust building |
| Full depth receives | Shallow receives | Positional fear amplified by pressure |
| Shallow receives | Full depth | Competition arousal overcoming fear |

### 5.4 Competition Intelligence Framework

```
Pre-Competition Assessment:
├── Training behavior baseline
├── Historical competition performance
├── Psychological profile
├── Readiness state
└── Attempt strategy

Competition Behavior Monitoring:
├── Warm-up behavior patterns
├── Attempt execution quality
├── Between-attempt recovery
├── Emotional regulation
└── Technical stability under pressure

Post-Competition Analysis:
├── Performance vs training comparison
├── Attempt strategy effectiveness
├── Technical breakdown points
├── Psychological response patterns
└── Adaptation recommendations
```

---

## 6. FATIGUE BEHAVIOR MODELING

### 6.1 Fatigue Type → Behavior Signature Mapping

| Fatigue Type | Primary Behavior Signatures | Recovery Timeline | Discrimination |
|--------------|----------------------------|-------------------|----------------|
| **CNS Fatigue** | Extension power loss, Pull-under speed reduction, Technical precision loss | 48-72 hours | Performance decrement without metabolic stress |
| **Metabolic Fatigue** | Grip failure, Repetition performance drop, Extended recovery between reps | 24-48 hours | Correlates with metabolic demand of session |
| **Structural Fatigue** | Position stability degradation, Core stability breakdown, Joint discomfort | 48-96 hours | Localized to loaded structures |
| **Mixed Fatigue** | Multiple signatures present | 72-96+ hours | Combination of above patterns |

### 6.2 Fatigue Artifact vs Technical Flaw Discrimination

| Criterion | Fatigue Artifact | Technical Flaw |
|-----------|------------------|----------------|
| **Temporal Pattern** | Appears late in session, resolves with rest | Consistent across session, persists with rest |
| **Load Dependency** | Worse with heavier loads | Present across all loads |
| **Recovery Response** | Normalizes after 48-72h recovery | No change after recovery |
| **Set-to-Set Consistency** | Deteriorates across sets | Consistent across sets |
| **Fresh State Performance** | Normal when fresh | Abnormal even when fresh |

### 6.3 Fatigue Accumulation Model

```
Acute Fatigue (Session):
├── Immediate performance decrement
├── Technical degradation in later sets
├── Recovery: hours to 1 day

Residual Fatigue (Microcycle):
├── Accumulated from multiple sessions
├── Performance decrement across sessions
├── Recovery: 2-4 days

Chronic Fatigue (Mesocycle):
├── Long-term accumulation
├── Persistent performance plateau/decline
├── Recovery: 1-3 weeks

Overreaching/Overtraining:
├── Systemic dysfunction
├── Multiple system involvement
├── Recovery: weeks to months
```

### 6.4 Fatigue Behavior Monitoring Protocol

**Daily Assessment:**
- Readiness questionnaire (sleep, soreness, motivation)
- Movement quality screening
- Bar velocity monitoring
- Technical consistency check

**Session Assessment:**
- Set-to-set performance tracking
- Technical degradation monitoring
- RPE progression
- Recovery between sets

**Microcycle Assessment:**
- Performance trend analysis
- Fatigue accumulation indicators
- Technical stability patterns
- Psychological state monitoring

---

## 7. PSYCHOLOGICAL BEHAVIOR MODELING

### 7.1 Psychological State → Movement Expression Mapping

| Psychological State | Movement Expression | Observable Indicators |
|---------------------|---------------------|----------------------|
| **High Confidence** | Decisive execution, Full commitment, Smooth rhythm | Aggressive extension, Complete positions, Consistent timing |
| **Low Confidence** | Hesitant execution, Partial commitment, Disrupted rhythm | Passive extension, Incomplete positions, Variable timing |
| **High Arousal** | Explosive execution, Fast tempo, High aggression | Powerful extension, Rapid pull-under, Audible effort |
| **Low Arousal** | Flat execution, Slow tempo, Low aggression | Weak extension, Slow pull-under, Minimal effort expression |
| **Anxiety** | Rushed execution, Inconsistent rhythm, Premature fatigue | Quick setup, Broken flow, Early performance drop |
| **Focus** | Consistent execution, Strong routine, Technical precision | Repeatable patterns, Cue adherence, Minimal errors |

### 7.2 Confidence/Fear Manifestations

| Manifestation | Behavioral Expression | Root Cause |
|---------------|----------------------|------------|
| **Positional Fear (Overhead)** | Incomplete lockout, Arm bend, Avoidance of heavy overhead | Previous injury, Lack of overhead strength, Mobility anxiety |
| **Positional Fear (Catch)** | Shallow depth, Forward lean, Early stand | Previous injury, Lack of bottom position strength, Mobility limitation |
| **Bar Path Fear** | Modified trajectory, Excessive caution, Protective pulling | Previous missed lift, Lack of trust in technique |
| **Heavy Load Fear** | Conservative attempts, Submaximal commitment, Technical breakdown | Lack of exposure to heavy loads, Psychological barrier |

### 7.3 Aggression/Commitment Spectrum

| Level | Behavioral Expression | Training Implications |
|-------|----------------------|----------------------|
| **Passive** | Minimal acceleration, Incomplete extension, Tentative | Needs arousal activation, confidence building |
| **Moderate** | Controlled aggression, Complete extension, Committed | Optimal for technical development |
| **High** | Maximum aggression, Explosive extension, Full commitment | Optimal for competition preparation |
| **Excessive** | Loss of control, Technical breakdown, Reckless | Needs composure development, technique focus |

### 7.4 Psychological Intervention Strategies

| Psychological Issue | Movement-Based Intervention | Cognitive Intervention |
|---------------------|----------------------------|-----------------------|
| **Positional Fear** | Progressive exposure, Position holds, Confidence-building drills | Imagery, Self-talk, Reframing |
| **Low Confidence** | Success accumulation, Appropriate progression, Mastery experiences | Goal setting, Evidence collection, Positive reinforcement |
| **Competition Anxiety** | Competition simulation, Pressure training, Routine development | Breathing techniques, Focus strategies, Arousal regulation |
| **Aggression Deficit** | Competitive drills, Partner challenges, Performance feedback | Arousal regulation, Competitive mindset, Goal commitment |

---

## 8. COMPENSATION BEHAVIOR LOGIC

### 8.1 Compensation vs Deficit Framework

| Criterion | Compensation | Deficit |
|-----------|--------------|---------|
| **Function** | Serves protective or adaptive purpose | Indicates limitation or weakness |
| **Consistency** | Consistent pattern across contexts | May vary with fatigue/state |
| **Removal Risk** | Removing compensation may expose limitation | Addressing deficit improves performance |
| **Intervention** | Address root cause, then gradually modify | Direct correction and strengthening |

### 8.2 Compensation Pattern Recognition

**Pattern 1: Hip-Dominant Pull Compensation**
- **Observable**: Excessive hip elevation, Reduced knee contribution
- **Compensated Limitation**: Quad weakness, Knee pain, Ankle mobility restriction
- **Function**: Reduces knee demand, shifts load to hips
- **Risk if Removed**: May expose quad weakness or mobility limitation

**Pattern 2: Forward Torso Compensation**
- **Observable**: Excessive forward lean in catch/recovery
- **Compensated Limitation**: Ankle mobility, Quad strength, Core stability
- **Function**: Maintains balance with limited ankle dorsiflexion
- **Risk if Removed**: May cause forward fall if mobility not addressed

**Pattern 3: Arm-Dominant Pull Compensation**
- **Observable**: Early arm bend, Excessive high pull
- **Compensated Limitation**: Leg power deficit, Timing coordination deficit
- **Function**: Generates bar height through arm pull when leg drive insufficient
- **Risk if Removed**: May reduce bar height if power not developed

### 8.3 Compensation Resolution Protocol

```
Phase 1: Identify Root Limitation
├── Assess mobility restrictions
├── Test strength deficits
├── Evaluate coordination patterns
└── Determine primary limitation

Phase 2: Address Root Cause
├── Mobility intervention (if restriction)
├── Strength development (if weakness)
├── Coordination training (if motor control)
└── Gradual progression

Phase 3: Modify Compensation
├── Introduce corrected pattern at low load
├── Progressive load increase
├── Monitor for regression
└── Reinforce new pattern

Phase 4: Integration
├── Competition-specific application
├── Pressure testing
├── Long-term monitoring
└── Maintenance strategy
```

### 8.4 Compensation Decision Tree

```
Observed Movement Pattern
│
├─ Is pattern consistent across contexts?
│  ├─ Yes → Likely compensation or chronic technical flaw
│  └─ No → Likely fatigue artifact or state-dependent
│
├─ Does pattern serve apparent protective function?
│  ├─ Yes → Likely compensation
│  └─ No → Likely technical flaw or deficit
│
├─ Is there identifiable root limitation?
│  ├─ Yes → Address limitation first
│  └─ No → May be learned motor pattern
│
└─ Intervention approach:
   ├─ Compensation with limitation → Address limitation, then modify
   ├─ Compensation without limitation → Gradual pattern modification
   ├─ Technical flaw → Direct correction and drilling
   └─ Fatigue artifact → Recovery management
```

---

## 9. CROSS-PHASE PROPAGATION LOGIC

### 9.1 Phase Causality Chain

```
Start → First Pull → Transition → Extension → Pull-Under → Receive → Recovery
  │          │            │           │            │           │         │
  └──────────┴────────────┴───────────┴────────────┴───────────┴─────────┘
                                    │
                                    ▼
                          Cross-Phase Causality
```

### 9.2 Upstream → Downstream Causation

| Upstream Phase | Error Type | Downstream Effect | Observable Pattern |
|----------------|------------|-------------------|-------------------|
| **Start** | Hip height too high | Reduced first pull leverage | Weak initial bar acceleration |
| **Start** | Hip height too low | Slow bar acceleration | Extended first pull duration |
| **First Pull** | Bar drift forward | Poor transition position | Compensatory arm pull |
| **First Pull** | Slow bar velocity | Insufficient momentum | Weak extension, early fatigue |
| **Transition** | Poor scoop timing | Suboptimal extension position | Reduced extension power |
| **Transition** | Early hip rise | Bar drift forward | Arm-dominant pull |
| **Extension** | Incomplete extension | Reduced bar height | Early pull-under, shallow receive |
| **Extension** | Forward drift | Bar path deviation | Receive position forward |
| **Pull-Under** | Slow turnover | Reduced time under bar | Shallow receive, forward catch |
| **Pull-Under** | Late initiation | Missed timing window | Bar falling before lockout |

### 9.3 Root Cause Inference from Downstream Symptoms

**Symptom: Unstable Receive**

Possible upstream causes:
1. **Extension error** → Bar too far forward → Receive position compromised
2. **Pull-under timing** → Late turnover → Bar falling during reception
3. **Trajectory deviation** → Bar path too far forward/back → Balance compromised
4. **Receive-specific issue** → Stability deficit, mobility restriction

**Discrimination Process:**
```
Observe receive instability
│
├─ Check extension quality
│  ├─ Complete triple extension? → Yes/No
│  ├─ Bar trajectory at extension? → Forward/Neutral/Backward
│  └─ Bar height achieved? → Sufficient/Insufficient
│
├─ Check pull-under timing
│  ├─ Turnover speed? → Fast/Moderate/Slow
│  ├─ Pull-under initiation? → Early/On-time/Late
│  └─ Bar path under body? → Close/Drifting
│
├─ Check receive-specific factors
│  ├─ Overhead stability? → Stable/Unstable
│  ├─ Mobility in position? → Full/Limited
│  └─ Confidence in position? → Confident/Hesitant
│
└─ Determine primary cause:
   ├─ Extension issue → Address extension mechanics
   ├─ Pull-under issue → Address timing/turnover
   └─ Receive issue → Address stability/mobility/confidence
```

### 9.4 Cross-Phase Propagation Patterns

**Pattern 1: Extension → Receive Propagation**
```
Weak extension → Reduced bar height → Early pull-under → Shallow receive
```
**Intervention**: Address extension power before receive work

**Pattern 2: Transition → Extension Propagation**
```
Poor scoop → Suboptimal extension position → Weak extension → Reduced bar height
```
**Intervention**: Address transition timing before extension power

**Pattern 3: First Pull → Transition Propagation**
```
Forward bar drift → Poor transition position → Compensatory movement → Extension error
```
**Intervention**: Address first pull bar path before transition work

**Pattern 4: Start → First Pull Propagation**
```
Inconsistent start → Variable first pull → Unstable transition → Inconsistent extension
```
**Intervention**: Address start consistency before first pull work

### 9.5 Multi-Phase Error Cascades

**Cascade 1: Hip Height Error Cascade**
```
Start: Hip height too high
  ↓
First Pull: Reduced leverage, weak initial acceleration
  ↓
Transition: Bar too high at knee, poor scoop position
  ↓
Extension: Suboptimal power position, reduced extension power
  ↓
Pull-Under: Insufficient bar height, early turnover
  ↓
Receive: Shallow position, forward catch
```

**Cascade 2: Aggression Deficit Cascade**
```
Start: Passive setup, low tension
  ↓
First Pull: Slow bar acceleration, passive pulling
  ↓
Transition: Insufficient momentum, delayed transition
  ↓
Extension: Weak extension, incomplete triple extension
  ↓
Pull-Under: Slow turnover, passive pull-under
  ↓
Receive: Soft catch, unstable position
```

---

## 10. RUNTIME ARCHITECTURE PLACEMENT

### 10.1 Architecture Integration Points

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COACHING INTELLIGENCE SYSTEM                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐ │
│  │  Performance     │    │  Movement        │    │  Athlete         │ │
│  │  Data Layer      │    │  Behavior        │    │  Profile         │ │
│  │  (Exercise       │    │  Analysis        │    │  (History,       │ │
│  │   Results,       │    │  Engine          │    │   Limitations,   │ │
│  │   Ratios)        │    │                  │    │   Profiles)      │ │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘ │
│           │                       │                       │           │
│           ▼                       ▼                       ▼           │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │              BEHAVIOR CLASSIFICATION ENGINE                       │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │  • Technical Behavior Detection (TB-01 to TB-10)            │ │ │
│  │  │  • Psychological Behavior Detection (PB-01 to PB-06)        │ │ │
│  │  │  • Fatigue Behavior Detection (FB-01 to FB-06)              │ │ │
│  │  │  • Competition Behavior Detection (CB-01 to CB-06)          │ │ │
│  │  │  • Coordination Behavior Detection (CoB-01 to CoB-06)       │ │ │
│  │  │  • Commitment Behavior Detection (CAB-01 to CAB-05)         │ │ │
│  │  │  • Stability Behavior Detection (SB-01 to SB-05)            │ │ │
│  │  │  • Timing Behavior Detection (TB-01 to TB-05)               │ │ │
│  │  │  • Positional Behavior Detection (PB-01 to PB-05)           │ │ │
│  │  │  • Compensation Behavior Detection (CB-01 to CB-06)         │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                               │                                         │
│                               ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │              CAUSAL INFERENCE ENGINE                              │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │  • Behavior → Cause Mapping (Section 3)                     │ │ │
│  │  │  • Convergent Evidence Analysis (Section 4)                 │ │ │
│  │  │  • Contradiction Detection (Section 4)                      │ │ │
│  │  │  • Cross-Phase Propagation Analysis (Section 9)             │ │ │
│  │  │  • Fatigue vs Technical Discrimination (Section 6)          │ │ │
│  │  │  • Compensation vs Deficit Classification (Section 8)       │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                               │                                         │
│                               ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │              INTERVENTION PLANNING ENGINE                         │ │
│  │  ┌─────────────────────────────────────────────────────────────┐ │ │
│  │  │  • Corrective Exercise Selection                            │ │ │
│  │  │  • Psychological Intervention Planning                      │ │ │
│  │  │  • Fatigue Management Strategy                              │ │ │
│  │  │  • Competition Preparation Protocol                         │ │ │
│  │  │  • Compensation Resolution Protocol                         │ │ │
│  │  └─────────────────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Module Responsibilities

| Module | Responsibility | Input Sources | Output |
|--------|----------------|---------------|--------|
| **Performance Data Layer** | Collect exercise results, strength ratios, performance metrics | Training logs, testing results, competition results | Structured performance data |
| **Movement Behavior Analysis Engine** | Classify observed behaviors into ontology categories | Video analysis, coach observations, sensor data | Behavior classifications with confidence scores |
| **Athlete Profile** | Maintain athlete history, limitations, psychological profile | Historical data, assessments, self-reports | Athlete context for inference |
| **Behavior Classification Engine** | Map raw observations to behavior codes | Movement data, performance patterns | Categorized behaviors with evidence |
| **Causal Inference Engine** | Infer root causes from behavior patterns | Classified behaviors, athlete profile, context | Root cause hypotheses with confidence |
| **Intervention Planning Engine** | Generate corrective strategies | Root causes, training phase, competition schedule | Intervention plan with exercises and progressions |

### 10.3 Data Flow Sequence

```
1. OBSERVATION CAPTURE
   Training session → Performance data + Movement observations
   
2. BEHAVIOR CLASSIFICATION
   Raw observations → Behavior codes (TB, PB, FB, CB, CoB, CAB, SB, PB, CB)
   
3. EVIDENCE AGGREGATION
   Multiple observations → Convergent evidence patterns
   
4. FATIGUE ARTIFACT FILTER
   Check for fatigue signatures → Separate fatigue artifacts from technical flaws
   
5. CAUSAL INFERENCE
   Behavior patterns + Evidence + Context → Root cause hypotheses
   
6. CONTRADICTION CHECK
   Hypotheses vs Contradicting evidence → Refined hypotheses
   
7. CROSS-PHASE ANALYSIS
   Downstream symptoms → Upstream cause identification
   
8. INTERVENTION PLANNING
   Root causes + Training context → Corrective strategy
   
9. FEEDBACK LOOP
   Intervention results → Updated athlete profile → Improved future inference
```

### 10.4 Integration with Existing System

Based on the audit report, the following integration points are recommended:

**1. Extend `diagnostics.ts`**
```typescript
// Add behavior classification layer
interface BehaviorObservation {
  code: string;           // e.g., "TB-01"
  confidence: number;     // 0-1 confidence score
  evidence: string[];     // Observable evidence items
  phase: MovementPhase;
  persistence: 'transient' | 'temporary' | 'established' | 'chronic';
}

// Extend ROOT_CAUSE_MAP with behavior-based causes
const BEHAVIOR_CAUSE_MAP: Record<string, string[]> = {
  'TB-01': ['weak_posterior_chain', 'poor_transition_timing', 'rushing_movement'],
  'PB-01': ['fear_of_injury', 'previous_trauma', 'lack_of_confidence'],
  // ... full mapping
};
```

**2. Add Fatigue Artifact Detection**
```typescript
interface FatigueAssessment {
  type: 'cns' | 'metabolic' | 'structural' | 'mixed';
  severity: number;       // 0-100
  artifact_behaviors: string[];  // Behaviors likely due to fatigue
  technical_behaviors: string[]; // Behaviors likely technical flaws
}

function assessFatigueArtifact(
  behaviors: BehaviorObservation[],
  readiness: number,
  trainingLoad: TrainingLoad
): FatigueAssessment;
```

**3. Add Cross-Phase Causal Analysis**
```typescript
interface CrossPhaseAnalysis {
  downstream_symptom: string;
  upstream_causes: {
    cause: string;
    phase: MovementPhase;
    confidence: number;
    evidence: string[];
  }[];
  primary_cause: string;
}

function analyzeCrossPhaseCausality(
  symptom: string,
  phaseBehaviors: Map<MovementPhase, BehaviorObservation[]>
): CrossPhaseAnalysis;
```

**4. Add Psychological Behavior Layer**
```typescript
interface PsychologicalProfile {
  confidence_level: number;      // 0-100
  aggression_tendency: number;   // 0-100
  competition_response: 'elevator' | 'decliner' | 'consistent';
  positional_fears: string[];    // e.g., ['overhead', 'catch']
  anxiety_triggers: string[];
}

function assessPsychologicalState(
  behaviors: BehaviorObservation[],
  context: 'training' | 'competition'
): PsychologicalProfile;
```

### 10.5 Runtime Processing Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RUNTIME PROCESSING PIPELINE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  INPUT: Training Session Data                                        │
│  ├── Exercise results (weight, reps, success rate, RPE)             │
│  ├── Strength ratios (FS/CJ, Pull/CJ, etc.)                         │
│  ├── Movement observations (video analysis, coach notes)            │
│  ├── Readiness metrics (sleep, soreness, motivation)                │
│  └── Context (training phase, competition proximity)                │
│                                                                       │
│  STAGE 1: Performance Problem Detection                              │
│  ├── Strength ratio analysis (existing)                             │
│  ├── Success rate analysis (existing)                               │
│  └── RPE pattern analysis (existing)                                │
│                                                                       │
│  STAGE 2: Behavior Classification (NEW)                              │
│  ├── Technical behavior detection                                   │
│  ├── Fatigue behavior detection                                     │
│  ├── Psychological behavior detection                               │
│  └── Competition behavior detection                                 │
│                                                                       │
│  STAGE 3: Fatigue Artifact Filtering (NEW)                           │
│  ├── Identify fatigue signatures                                    │
│  ├── Separate fatigue artifacts from technical flaws                │
│  └── Adjust problem detection based on fatigue state                │
│                                                                       │
│  STAGE 4: Causal Inference (ENHANCED)                                │
│  ├── Behavior → cause mapping                                       │
│  ├── Convergent evidence analysis                                   │
│  ├── Cross-phase propagation analysis                               │
│  └── Contradiction detection                                        │
│                                                                       │
│  STAGE 5: Intervention Planning (ENHANCED)                           │
│  ├── Technical correctives (existing)                               │
│  ├── Fatigue management strategies (NEW)                            │
│  ├── Psychological interventions (NEW)                              │
│  └── Competition preparation protocols (NEW)                        │
│                                                                       │
│  OUTPUT: Comprehensive Intervention Plan                             │
│  ├── Primary problem identification                                 │
│  ├── Root cause analysis                                            │
│  ├── Corrective exercise selection                                  │
│  ├── Fatigue management recommendations                             │
│  ├── Psychological intervention suggestions                         │
│  └── Monitoring and progression plan                                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.6 Recommended Implementation Priority

**Phase 1: Foundation (Weeks 1-4)**
1. Implement behavior classification engine
2. Add fatigue artifact detection layer
3. Extend ROOT_CAUSE_MAP with behavior-based causes

**Phase 2: Causal Enhancement (Weeks 5-8)**
1. Implement cross-phase causal analysis
2. Add convergent evidence scoring
3. Implement contradiction detection

**Phase 3: Psychological Layer (Weeks 9-12)**
1. Add psychological behavior detection
2. Implement confidence/fear assessment
3. Add competition behavior modeling

**Phase 4: Integration & Refinement (Weeks 13-16)**
1. Full pipeline integration
2. Validation against expert coach assessments
3. Iterative refinement based on feedback

---

## APPENDIX A: BEHAVIOR CODE REFERENCE

### Complete Behavior Code Listing

| Code | Category | Behavior Name | Key Observable |
|------|----------|---------------|----------------|
| TB-01 | Technical | Extension Timing Deviation | Early/late extension |
| TB-02 | Technical | Bar Trajectory Deviation | Forward/backward drift |
| TB-03 | Technical | Pull-Under Timing Error | Early/late turnover |
| TB-04 | Technical | Turnover Speed Deficit | Slow elbow rotation |
| TB-05 | Technical | Receive Position Collapse | Torso flexion, instability |
| TB-06 | Technical | Fixation Quality Deficit | Soft lockout, arm bend |
| TB-07 | Technical | Dip-Drive Sequencing Error | Dip depth, drive completion |
| TB-08 | Technical | Split Timing Error | Early/late split |
| TB-09 | Technical | Recovery Instability | Multiple steps, hops |
| TB-10 | Technical | Start Position Inconsistency | Variable positioning |
| PB-01 | Psychological | Positional Fear | Hesitation, incomplete depth |
| PB-02 | Psychological | Aggression Deficit | Passive execution |
| PB-03 | Psychological | Technical Confidence | Smooth execution under load |
| PB-04 | Psychological | Competition Anxiety | Rushed setup, inconsistency |
| PB-05 | Psychological | Risk Avoidance | Conservative attempts |
| PB-06 | Psychological | Frustration Expression | Aggressive bar drop |
| FB-01 | Fatigue | Extension Power Loss | Reduced bar velocity |
| FB-02 | Fatigue | Pull-Under Speed Reduction | Slower turnover |
| FB-03 | Fatigue | Position Stability Degradation | Increased oscillation |
| FB-04 | Fatigue | Technical Precision Loss | Increased variability |
| FB-05 | Fatigue | Grip Failure | Hook grip release |
| FB-06 | Fatigue | Core Stability Breakdown | Torso flexion |
| CB-01 | Competition | Competition Aggression | Elevated extension power |
| CB-02 | Competition | Competition Breakdown | Technical deterioration |
| CB-03 | Competition | Attempt Sequencing Behavior | Strategic selection |
| CB-04 | Competition | Warm-Up Behavior | Over/under warming |
| CB-05 | Competition | Between-Attempt Behavior | Recovery quality |
| CB-06 | Competition | Crowd/Environment Response | Performance change |
| CoB-01 | Coordination | Segment Sequencing Error | Wrong order activation |
| CoB-02 | Coordination | Force Transfer Inefficiency | Energy leak |
| CoB-03 | Coordination | Bilateral Asymmetry | Uneven loading |
| CoB-04 | Coordination | Rhythm Disruption | Loss of flow |
| CoB-05 | Coordination | SSC Deficit | Poor elastic utilization |
| CoB-06 | Coordination | Proprioceptive Deficit | Poor position sense |
| CAB-01 | Commitment | Full Commitment | Maximal acceleration |
| CAB-02 | Commitment | Partial Commitment | Submaximal execution |
| CAB-03 | Commitment | Aggressive Extension | Explosive triple extension |
| CAB-04 | Commitment | Passive Execution | Slow, tentative movement |
| CAB-05 | Commitment | Commitment Inconsistency | Variable execution |
| SB-01 | Stability | Sagittal Plane Instability | Forward/backward sway |
| SB-02 | Stability | Frontal Plane Instability | Lateral sway |
| SB-03 | Stability | Rotational Instability | Bar/torso rotation |
| SB-04 | Stability | Dynamic Stability Deficit | Oscillation in catch |
| SB-05 | Stability | Static Stability Deficit | Sway in lockout |
| TB-01 | Timing | Phase Duration Anomaly | Extended/rushed phase |
| TB-02 | Timing | Inter-Phase Timing Error | Gap/overlap between phases |
| TB-03 | Timing | Velocity Profile Deviation | Wrong acceleration pattern |
| TB-04 | Timing | Rhythm Pattern Deviation | Irregular tempo |
| TB-05 | Timing | Reactive Timing Deficit | Slow corrections |
| PB-01 | Positional | Start Position Deviation | Inconsistent start |
| PB-02 | Positional | Power Position Deviation | Hip-bar relationship error |
| PB-03 | Positional | Catch Position Deviation | Depth/stance errors |
| PB-04 | Positional | Recovery Position Deviation | Asymmetric stance |
| PB-05 | Positional | Finish Position Deviation | Incomplete lockout |
| CB-01 | Compensation | Hip-Dominant Pull | Excessive hip elevation |
| CB-02 | Compensation | Arm-Dominant Pull | Early arm bend |
| CB-03 | Compensation | Forward Torso Compensation | Excessive forward lean |
| CB-04 | Compensation | Asymmetric Compensation | Uneven loading |
| CB-05 | Compensation | Protective Compensation | Reduced ROM |
| CB-06 | Compensation | Grip Compensation | Modified grip |

---

## APPENDIX B: EVIDENCE COLLECTION PROTOCOL

### Video Analysis Checklist

**Sagittal Plane View:**
- [ ] Start position consistency
- [ ] Bar trajectory (forward/backward drift)
- [ ] Extension completeness (triple extension)
- [ ] Pull-under timing relative to extension
- [ ] Receive depth and torso angle
- [ ] Recovery stability

**Frontal Plane View:**
- [ ] Bar path straightness
- [ ] Knee tracking (valgus/varus)
- [ ] Stance symmetry
- [ ] Lockout symmetry

**Key Timing Markers:**
- [ ] Time from floor to knee
- [ ] Time from knee to extension
- [ ] Time from extension to catch
- [ ] Total lift duration

### Coach Observation Protocol

**Pre-Lift:**
- [ ] Setup consistency
- [ ] Tension creation
- [ ] Focus/ concentration

**During Lift:**
- [ ] Movement tempo
- [ ] Aggression level
- [ ] Technical precision

**Post-Lift:**
- [ ] Fixation quality
- [ ] Recovery control
- [ ] Emotional response

---

*End of Movement Behavior Ontology*