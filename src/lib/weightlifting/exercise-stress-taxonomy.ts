// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE STRESS TAXONOMY - Olympic Weightlifting Stress Classification
//
// Purpose:
// - Classify exercises by stress signatures (NOT just load/intensity)
// - Standardize complexity interpretation across ALL engines
// - Enable precision blocking instead of broad family blocking
// - Improve realism of recovery + orchestrator logic
//
// This engine does NOT generate workouts. It only classifies and standardizes.
// ─────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// 1. UNIFIED COMPLEXITY SCALE (Architecture Standard)
// ────────────────────────────────────────────────────────────

export type ComplexityLevel =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10;

/**
 * UNIFIED COMPLEXITY SCALE - Same meaning across ALL engines
 *
 * 1–2: Restoration / mobility / simple technical drills
 *      → Basic movement patterns, low coordination, recovery-focused
 *
 * 3–4: Segmented lifts / pauses / isolated technical work
 *      → Broken-down movements, technical isolation, moderate coordination
 *
 * 5–6: Power variations / moderate coordination lifts
 *      → Explosive elements, moderate technical demand, power focus
 *
 * 7–8: Full classic lifts
 *      → Complete competition movements, high coordination, technical mastery
 *
 * 9–10: Maximal competition-specific execution
 *       → Peak performance, maximal technical precision, competition intensity
 */
export const COMPLEXITY_DEFINITIONS = {
  1: "Basic mobility / restoration",
  2: "Simple technical drills",
  3: "Segmented movement isolation",
  4: "Pause work / technical breaks",
  5: "Power variations / moderate coordination",
  6: "Explosive technical work",
  7: "Full classic lifts",
  8: "Competition-ready execution",
  9: "Maximal technical precision",
  10: "Peak competition performance",
} as const;

// ────────────────────────────────────────────────────────────
// 2. STRESS CLASSES (Precision Blocking Foundation)
// ────────────────────────────────────────────────────────────

export type StressClass =
  | "overhead_maximal"        // Heavy jerks, split jerks at high intensity
  | "overhead_technical"      // Jerk technique work, push presses
  | "pull_maximal"           // Heavy pulls, deficit work
  | "pull_technical"         // Technical pulls, speed pulls
  | "squat_maximal"          // Heavy squats, competition squats
  | "squat_restoration"      // Light squats, mobility work
  | "classic_competition"    // Full snatch, clean_and_jerk
  | "restoration_coordination" // Tall variations, drop work
  | "segmented_technical"    // Pause lifts, segmented work
  | "power_explosive";       // Power variations, speed work

// ────────────────────────────────────────────────────────────
// 3. EXERCISE STRESS PROFILE
// ────────────────────────────────────────────────────────────

export interface ExerciseStressProfile {
  exercise_id: string;

  // Stress dimensions (0–100 scale)
  cns_cost: number;              // Neural demand / fatigue
  coordination_cost: number;     // Motor coordination complexity
  technical_cost: number;        // Technical precision requirement
  overhead_cost: number;         // Shoulder/overhead stress
  eccentric_cost: number;        // Eccentric loading / braking
  speed_cost: number;            // Speed/explosive demand
  local_muscular_cost: number;   // Local muscle fatigue

  // Classification
  complexity: ComplexityLevel;
  stress_class: StressClass;
  specificity_score: number;     // Competition transfer (0–100)

  // Recovery impact
  recovery_disruption: number;   // Recovery system disruption (0–100)

  notes?: string[];
}

// ────────────────────────────────────────────────────────────
// 4. EXERCISE STRESS TAXONOMY DATABASE
// ────────────────────────────────────────────────────────────

const EXERCISE_STRESS_PROFILES: Record<string, ExerciseStressProfile> = {
  // ── CLASSIC COMPETITION LIFTS ──
  snatch: {
    exercise_id: "snatch",
    cns_cost: 85,
    coordination_cost: 90,
    technical_cost: 95,
    overhead_cost: 75,
    eccentric_cost: 60,
    speed_cost: 95,
    local_muscular_cost: 70,
    complexity: 9,
    stress_class: "classic_competition",
    specificity_score: 100,
    recovery_disruption: 80,
    notes: ["Peak competition lift", "Maximal coordination demand", "High speed requirement"],
  },

  clean_and_jerk: {
    exercise_id: "clean_and_jerk",
    cns_cost: 90,
    coordination_cost: 95,
    technical_cost: 90,
    overhead_cost: 85,
    eccentric_cost: 65,
    speed_cost: 85,
    local_muscular_cost: 75,
    complexity: 10,
    stress_class: "classic_competition",
    specificity_score: 100,
    recovery_disruption: 85,
    notes: ["Full competition movement", "Highest coordination complexity", "Two-phase lift"],
  },

  // ── POWER VARIATIONS ──
  power_snatch: {
    exercise_id: "power_snatch",
    cns_cost: 70,
    coordination_cost: 80,
    technical_cost: 85,
    overhead_cost: 60,
    eccentric_cost: 40,
    speed_cost: 90,
    local_muscular_cost: 55,
    complexity: 7,
    stress_class: "power_explosive",
    specificity_score: 85,
    recovery_disruption: 60,
    notes: ["Power catch reduces eccentric stress", "High speed focus", "Moderate coordination"],
  },

  power_clean: {
    exercise_id: "power_clean",
    cns_cost: 75,
    coordination_cost: 85,
    technical_cost: 80,
    overhead_cost: 45,
    eccentric_cost: 45,
    speed_cost: 80,
    local_muscular_cost: 60,
    complexity: 7,
    stress_class: "power_explosive",
    specificity_score: 85,
    recovery_disruption: 65,
    notes: ["Power catch reduces overhead stress", "Speed and timing focus", "Front rack position"],
  },

  // ── PULL VARIATIONS ──
  snatch_pull: {
    exercise_id: "snatch_pull",
    cns_cost: 65,
    coordination_cost: 70,
    technical_cost: 75,
    overhead_cost: 30,
    eccentric_cost: 80,
    speed_cost: 75,
    local_muscular_cost: 85,
    complexity: 6,
    stress_class: "pull_maximal",
    specificity_score: 70,
    recovery_disruption: 70,
    notes: ["High eccentric loading", "Pull strength focus", "Moderate technical demand"],
  },

  clean_pull: {
    exercise_id: "clean_pull",
    cns_cost: 70,
    coordination_cost: 75,
    technical_cost: 70,
    overhead_cost: 25,
    eccentric_cost: 85,
    speed_cost: 70,
    local_muscular_cost: 90,
    complexity: 6,
    stress_class: "pull_maximal",
    specificity_score: 75,
    recovery_disruption: 75,
    notes: ["Maximum eccentric stress", "Pull strength development", "High local fatigue"],
  },

  // ── SQUAT VARIATIONS ──
  front_squat: {
    exercise_id: "front_squat",
    cns_cost: 60,
    coordination_cost: 65,
    technical_cost: 70,
    overhead_cost: 40,
    eccentric_cost: 75,
    speed_cost: 40,
    local_muscular_cost: 95,
    complexity: 6,
    stress_class: "squat_maximal",
    specificity_score: 80,
    recovery_disruption: 70,
    notes: ["High local muscular demand", "Front rack position", "Technical stability required"],
  },

  back_squat: {
    exercise_id: "back_squat",
    cns_cost: 55,
    coordination_cost: 50,
    technical_cost: 60,
    overhead_cost: 20,
    eccentric_cost: 80,
    speed_cost: 35,
    local_muscular_cost: 100,
    complexity: 5,
    stress_class: "squat_maximal",
    specificity_score: 60,
    recovery_disruption: 65,
    notes: ["Maximum local muscular stress", "Lower technical demand", "High eccentric loading"],
  },

  // ── JERK VARIATIONS ──
  push_press: {
    exercise_id: "push_press",
    cns_cost: 50,
    coordination_cost: 60,
    technical_cost: 65,
    overhead_cost: 70,
    eccentric_cost: 30,
    speed_cost: 60,
    local_muscular_cost: 60,
    complexity: 5,
    stress_class: "overhead_technical",
    specificity_score: 65,
    recovery_disruption: 50,
    notes: ["Technical jerk introduction", "Moderate overhead stress", "Leg drive focus"],
  },

  power_jerk: {
    exercise_id: "power_jerk",
    cns_cost: 65,
    coordination_cost: 75,
    technical_cost: 80,
    overhead_cost: 75,
    eccentric_cost: 35,
    speed_cost: 70,
    local_muscular_cost: 65,
    complexity: 7,
    stress_class: "overhead_technical",
    specificity_score: 85,
    recovery_disruption: 60,
    notes: ["Split jerk technique", "High coordination demand", "Power catch"],
  },

  split_jerk: {
    exercise_id: "split_jerk",
    cns_cost: 75,
    coordination_cost: 85,
    technical_cost: 90,
    overhead_cost: 90,
    eccentric_cost: 40,
    speed_cost: 65,
    local_muscular_cost: 70,
    complexity: 8,
    stress_class: "overhead_maximal",
    specificity_score: 95,
    recovery_disruption: 75,
    notes: ["Competition jerk", "Maximal overhead stress", "High technical precision"],
  },

  // ── RESTORATION / TECHNICAL VARIATIONS ──
  tall_snatch: {
    exercise_id: "tall_snatch",
    cns_cost: 35,
    coordination_cost: 55,
    technical_cost: 70,
    overhead_cost: 50,
    eccentric_cost: 20,
    speed_cost: 60,
    local_muscular_cost: 30,
    complexity: 4,
    stress_class: "restoration_coordination",
    specificity_score: 40,
    recovery_disruption: 25,
    notes: ["Technical restoration", "Low loading", "Speed under focus", "Coordination isolation"],
  },

  tall_clean: {
    exercise_id: "tall_clean",
    cns_cost: 40,
    coordination_cost: 60,
    technical_cost: 65,
    overhead_cost: 35,
    eccentric_cost: 25,
    speed_cost: 55,
    local_muscular_cost: 35,
    complexity: 4,
    stress_class: "restoration_coordination",
    specificity_score: 45,
    recovery_disruption: 30,
    notes: ["Clean technique restoration", "Front rack focus", "Low stress"],
  },

  drop_snatch: {
    exercise_id: "drop_snatch",
    cns_cost: 45,
    coordination_cost: 65,
    technical_cost: 75,
    overhead_cost: 55,
    eccentric_cost: 15,
    speed_cost: 75,
    local_muscular_cost: 25,
    complexity: 5,
    stress_class: "restoration_coordination",
    specificity_score: 50,
    recovery_disruption: 35,
    notes: ["Speed under restoration", "Drop catch", "Minimal eccentric stress"],
  },

  // ── SEGMENTED / PAUSE WORK ──
  segmented_snatch: {
    exercise_id: "segmented_snatch",
    cns_cost: 55,
    coordination_cost: 70,
    technical_cost: 80,
    overhead_cost: 60,
    eccentric_cost: 45,
    speed_cost: 50,
    local_muscular_cost: 50,
    complexity: 6,
    stress_class: "segmented_technical",
    specificity_score: 60,
    recovery_disruption: 45,
    notes: ["Broken-down snatch", "Technical isolation", "Moderate coordination"],
  },

  segmented_clean: {
    exercise_id: "segmented_clean",
    cns_cost: 60,
    coordination_cost: 75,
    technical_cost: 75,
    overhead_cost: 40,
    eccentric_cost: 50,
    speed_cost: 45,
    local_muscular_cost: 55,
    complexity: 6,
    stress_class: "segmented_technical",
    specificity_score: 65,
    recovery_disruption: 50,
    notes: ["Broken-down clean", "Technical precision", "Position work"],
  },

  pause_snatch: {
    exercise_id: "pause_snatch",
    cns_cost: 70,
    coordination_cost: 80,
    technical_cost: 85,
    overhead_cost: 65,
    eccentric_cost: 55,
    speed_cost: 40,
    local_muscular_cost: 65,
    complexity: 7,
    stress_class: "segmented_technical",
    specificity_score: 70,
    recovery_disruption: 55,
    notes: ["Pause in catch position", "Stability focus", "Technical precision"],
  },

  pause_clean: {
    exercise_id: "pause_clean",
    cns_cost: 65,
    coordination_cost: 75,
    technical_cost: 80,
    overhead_cost: 45,
    eccentric_cost: 60,
    speed_cost: 35,
    local_muscular_cost: 70,
    complexity: 6,
    stress_class: "segmented_technical",
    specificity_score: 75,
    recovery_disruption: 55,
    notes: ["Pause in front rack", "Stability development", "Position strength"],
  },

  // ── OVERHEAD SQUAT ──
  overhead_squat: {
    exercise_id: "overhead_squat",
    cns_cost: 70,
    coordination_cost: 80,
    technical_cost: 85,
    overhead_cost: 95,
    eccentric_cost: 70,
    speed_cost: 30,
    local_muscular_cost: 75,
    complexity: 8,
    stress_class: "overhead_maximal",
    specificity_score: 90,
    recovery_disruption: 70,
    notes: ["Maximal overhead stability", "High technical demand", "Shoulder stress"],
  },
};

// ────────────────────────────────────────────────────────────
// 5. TAXONOMY API
// ────────────────────────────────────────────────────────────

export function getExerciseStressProfile(exerciseId: string): ExerciseStressProfile | null {
  return EXERCISE_STRESS_PROFILES[exerciseId] || null;
}

export function getExercisesByStressClass(stressClass: StressClass): ExerciseStressProfile[] {
  return Object.values(EXERCISE_STRESS_PROFILES).filter(
    (profile) => profile.stress_class === stressClass
  );
}

export function getExercisesByComplexity(complexity: ComplexityLevel): ExerciseStressProfile[] {
  return Object.values(EXERCISE_STRESS_PROFILES).filter(
    (profile) => profile.complexity === complexity
  );
}

export function getExercisesBelowComplexity(maxComplexity: ComplexityLevel): ExerciseStressProfile[] {
  return Object.values(EXERCISE_STRESS_PROFILES).filter(
    (profile) => profile.complexity <= maxComplexity
  );
}

export function getExercisesAboveComplexity(minComplexity: ComplexityLevel): ExerciseStressProfile[] {
  return Object.values(EXERCISE_STRESS_PROFILES).filter(
    (profile) => profile.complexity >= minComplexity
  );
}

export function getAllExerciseProfiles(): ExerciseStressProfile[] {
  return Object.values(EXERCISE_STRESS_PROFILES);
}

// ────────────────────────────────────────────────────────────
// 6. STRESS CLASSIFICATION HELPERS
// ────────────────────────────────────────────────────────────

export function isOverheadStressful(profile: ExerciseStressProfile): boolean {
  return profile.overhead_cost >= 70;
}

export function isCoordinationIntensive(profile: ExerciseStressProfile): boolean {
  return profile.coordination_cost >= 75;
}

export function isCNSDemanding(profile: ExerciseStressProfile): boolean {
  return profile.cns_cost >= 70;
}

export function isRecoveryDisruptive(profile: ExerciseStressProfile): boolean {
  return profile.recovery_disruption >= 60;
}

export function isCompetitionSpecific(profile: ExerciseStressProfile): boolean {
  return profile.specificity_score >= 80;
}

export function isRestorationFocused(profile: ExerciseStressProfile): boolean {
  return profile.complexity <= 4 && profile.recovery_disruption <= 40;
}

// ────────────────────────────────────────────────────────────
// 7. COMPLEXITY SCALE VALIDATION
// ────────────────────────────────────────────────────────────

export function validateComplexityScale(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const profiles = getAllExerciseProfiles();

  const complexityGroups = profiles.reduce((acc, profile) => {
    if (!acc[profile.complexity]) acc[profile.complexity] = [];
    acc[profile.complexity].push(profile);
    return acc;
  }, {} as Record<number, ExerciseStressProfile[]>);

  for (let level = 1; level <= 10; level++) {
    if (!complexityGroups[level] || complexityGroups[level].length === 0) {
      issues.push(`No exercises defined for complexity level ${level}`);
    }
  }

  // Only flag gross inversions — complexity is NOT linearly tied to CNS.
  // tall_snatch (complexity=4) has LOW CNS by design — that's correct.
  for (const profile of profiles) {
    if (profile.complexity >= 8 && profile.cns_cost < 50) {
      issues.push(
        `${profile.exercise_id}: complexity ${profile.complexity} but CNS ${profile.cns_cost} — unusually low for high-complexity lift`
      );
    }
    if (profile.complexity <= 2 && profile.cns_cost > 70) {
      issues.push(
        `${profile.exercise_id}: complexity ${profile.complexity} but CNS ${profile.cns_cost} — unusually high for restoration work`
      );
    }
  }

  return { valid: issues.length === 0, issues };
}