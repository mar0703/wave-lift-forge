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
//
// The `EXERCISE_STRESS_PROFILES` dataset lives in `../ontology` (single
// source of truth). It is imported below and consumed by the API helpers.
// ─────────────────────────────────────────────────────────────────────────────

import { EXERCISE_STRESS_PROFILES } from "../ontology";

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
//
// `EXERCISE_STRESS_PROFILES` is imported from `../ontology` at the top of
// this module. The API helpers below operate over that single source.

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
