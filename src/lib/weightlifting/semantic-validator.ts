// ─────────────────────────────────────────────────────────────────────────────
// SEMANTIC VALIDATOR — read-only orchestration analysis layer
//
// Pure analysis functions. Inspect the orchestrated workout against runtime
// arbitration + final-context invariants and return issues / debug data. This
// module never mutates the runtime context, the final context, the exercise
// list, or any other state. Repair / fallback / telemetry lives in
// repair-engine.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExerciseBlock } from "../training-engine";
import { getExerciseById } from "../exercise-db";
import type { RuntimeCoachingContext, FinalCoachContext } from "../orchestrator";
import type { StressClass } from "./exercise-stress-taxonomy";
import {
  getExerciseStressProfile,
  isCompetitionSpecific,
  isRestorationFocused,
} from "./exercise-stress-taxonomy";

// ────────────────────────────────────────────────────────────
// TYPES (read-only surface)
// ────────────────────────────────────────────────────────────

export type SemanticValidationMode = "strict" | "warning-only" | "repair";

export type SemanticFailureClassification =
  | "schema_failure"
  | "arbitration_conflict"
  | "specificity_collapse"
  | "movement_pattern_loss"
  | "empty_pipeline"
  | "recovery_violation"
  | "phase_intent_violation"
  | "normalization_override_conflict";

export type SemanticSeverity = "error" | "warning";

export interface SemanticValidationIssue {
  classification: SemanticFailureClassification;
  invariant: string;
  severity: SemanticSeverity;
  message: string;
  exercise_id?: string;
  blocked_by?: string[];
  dominated_by?: string[];
}

export interface OrchestrationSemanticDebug {
  failed_invariants: string[];
  constraints_causing_collapse: string[];
  removed_exercise_ids: string[];
  repair_path_activated: string[];
  dominating_arbitration_rules: string[];
  final_semantic_confidence: number;
}

export interface SemanticAnalysisResult {
  issues: SemanticValidationIssue[];
  constraints_causing_collapse: string[];
  removed_exercise_ids: string[];
  dominant_rules: string[];
}

export interface SemanticAnalysisInput {
  runtime_context: RuntimeCoachingContext;
  final_context: FinalCoachContext;
  exercises: ExerciseBlock[];
}

// ────────────────────────────────────────────────────────────
// CANDIDATE EXPOSURE LISTS
//
// Shared between analysis (used to test whether legal fallbacks exist when
// surfacing arbitration_conflict / specificity_collapse issues) and repair.
// ────────────────────────────────────────────────────────────

export const CLASSIC_CANDIDATES = ["snatch", "clean_and_jerk", "clean", "jerk"];
export const LOWER_BODY_CANDIDATES = ["back_squat", "front_squat", "clean_pull", "snatch_pull"];
export const PULL_CANDIDATES = ["snatch_pull", "clean_pull", "snatch_deadlift", "clean_deadlift"];
export const SQUAT_CANDIDATES = ["back_squat", "front_squat", "pause_back_squat", "pause_front_squat"];
export const RESTORATION_CANDIDATES = ["tall_snatch", "tall_clean", "muscle_snatch", "jerk_dip"];

// ────────────────────────────────────────────────────────────
// HELPERS (pure)
// ────────────────────────────────────────────────────────────

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function uniqueExercises(exercises: ExerciseBlock[]): ExerciseBlock[] {
  const seen = new Set<string>();
  const out: ExerciseBlock[] = [];
  for (const exercise of exercises) {
    if (seen.has(exercise.exercise_id)) continue;
    seen.add(exercise.exercise_id);
    out.push(exercise);
  }
  return out;
}

export function blockedStressClasses(runtime: RuntimeCoachingContext): Set<StressClass> {
  return new Set([
    ...runtime.arbitration.blocked_stress_classes,
    ...runtime.arbitration.protected_stress_classes,
  ]);
}

export function blockingReasons(
  exerciseId: string,
  runtime: RuntimeCoachingContext,
  finalContext: FinalCoachContext,
): string[] {
  const reasons: string[] = [];
  const blockedIds = new Set([
    ...runtime.blocked_ids,
    ...runtime.arbitration.blocked_exercises,
    ...finalContext.constraints.blocked_exercises,
  ]);
  if (blockedIds.has(exerciseId)) reasons.push("blocked_exercise");

  const profile = getExerciseStressProfile(exerciseId);
  if (profile) {
    const stressBlocks = blockedStressClasses(runtime);
    if (stressBlocks.has(profile.stress_class)) {
      reasons.push(`blocked_stress_class:${profile.stress_class}`);
    }
    if (profile.complexity > runtime.arbitration.final_complexity_ceiling) {
      reasons.push(`complexity_ceiling:${runtime.arbitration.final_complexity_ceiling}`);
    }
  }

  return reasons;
}

export function isAllowed(
  exerciseId: string,
  runtime: RuntimeCoachingContext,
  finalContext: FinalCoachContext,
): boolean {
  return blockingReasons(exerciseId, runtime, finalContext).length === 0;
}

export function hasLowerBodyExposure(exercises: ExerciseBlock[]): boolean {
  return exercises.some((exercise) => {
    if (exercise.family === "squat" || exercise.family === "pull") return true;
    const def = getExerciseById(exercise.exercise_id);
    return def?.transfer_to?.clean !== undefined || def?.transfer_to?.snatch !== undefined;
  });
}

export function hasPullExposure(exercises: ExerciseBlock[]): boolean {
  return exercises.some((exercise) => {
    if (exercise.family === "pull") return true;
    const def = getExerciseById(exercise.exercise_id);
    return def?.primary_phase === "first_pull" || def?.primary_phase === "extension";
  });
}

export function hasSquatExposure(exercises: ExerciseBlock[]): boolean {
  return exercises.some((exercise) => {
    if (exercise.family === "squat") return true;
    const def = getExerciseById(exercise.exercise_id);
    return def?.primary_position === "rack" && def.intent === "max_force";
  });
}

export function hasClassicExposure(exercises: ExerciseBlock[]): boolean {
  return exercises.some((exercise) => {
    const def = getExerciseById(exercise.exercise_id);
    const profile = getExerciseStressProfile(exercise.exercise_id);
    return def?.role === "main" && (def.family === "snatch" || def.family === "clean" || def.family === "jerk") &&
      (profile ? isCompetitionSpecific(profile) : true);
  });
}

export function isRecoveryOnly(finalContext: FinalCoachContext): boolean {
  return (
    finalContext.intelligence_summary.daily_priority === "recovery" ||
    finalContext.biases.restoration_favor >= 0.7
  );
}

export function isHighSpecificity(runtime: RuntimeCoachingContext, finalContext: FinalCoachContext): boolean {
  return (
    runtime.arbitration.final_specificity_pressure >= 0.65 ||
    finalContext.biases.specificity_favor >= 0.65 ||
    finalContext.intelligence_summary.daily_priority === "competition_specific" ||
    finalContext.intelligence_summary.adaptation_target === "competition" ||
    finalContext.intelligence_summary.taper_state === "taper" ||
    finalContext.intelligence_summary.taper_state === "peak"
  );
}

export function isHeavyIntent(finalContext: FinalCoachContext): boolean {
  const priority = finalContext.intelligence_summary.daily_priority;
  return (
    priority === "snatch_strength" ||
    priority === "clean_strength" ||
    priority === "jerk_strength" ||
    priority === "pull_strength" ||
    priority === "squat_strength" ||
    priority === "competition_specific"
  );
}

export function sessionMetrics(exercises: ExerciseBlock[]): {
  avgIntensity: number;
  totalVolume: number;
  avgSpecificity: number;
  avgComplexity: number;
  avgRecoveryDisruption: number;
} {
  const profiles = exercises.map((exercise) => getExerciseStressProfile(exercise.exercise_id)).filter(Boolean);
  return {
    avgIntensity: average(exercises.map((exercise) => exercise.intensity_pct)),
    totalVolume: exercises.reduce((sum, exercise) => sum + exercise.sets * exercise.reps, 0),
    avgSpecificity: average(profiles.map((profile) => profile!.specificity_score)),
    avgComplexity: average(profiles.map((profile) => profile!.complexity)),
    avgRecoveryDisruption: average(profiles.map((profile) => profile!.recovery_disruption)),
  };
}

function addIssue(
  issues: SemanticValidationIssue[],
  issue: SemanticValidationIssue,
): void {
  issues.push(issue);
}

// ────────────────────────────────────────────────────────────
// READ-ONLY ANALYSIS
//
// Walks the orchestrated workout against runtime + final-context invariants
// and produces issues, debug breadcrumbs, and the list of base-workout
// exercises that did not survive into the final selection. Pure function.
// ────────────────────────────────────────────────────────────

export function analyzeOrchestrationSemantics(
  input: SemanticAnalysisInput,
): SemanticAnalysisResult {
  const { runtime_context: runtime, final_context: finalContext } = input;
  const exercises = uniqueExercises(input.exercises);
  const issues: SemanticValidationIssue[] = [];
  const constraintsCausingCollapse: string[] = [];
  const removedExerciseIds = runtime.base_workout.exercises
    .filter((base) => !exercises.some((exercise) => exercise.exercise_id === base.exercise_id))
    .map((exercise) => exercise.exercise_id);
  const dominantRules = [
    ...runtime.arbitration.dominant_sources.map((source) => `source:${source}`),
    ...runtime.arbitration.protected_priorities,
  ];

  for (const exercise of exercises) {
    if (!getExerciseById(exercise.exercise_id)) {
      addIssue(issues, {
        classification: "schema_failure",
        invariant: "known_exercise_ids",
        severity: "error",
        message: `Unknown exercise emitted after orchestration: ${exercise.exercise_id}.`,
        exercise_id: exercise.exercise_id,
      });
    }

    const reasons = blockingReasons(exercise.exercise_id, runtime, finalContext);
    if (reasons.length > 0) {
      addIssue(issues, {
        classification: "arbitration_conflict",
        invariant: "arbitration_blocks_respected",
        severity: "error",
        message: `${exercise.exercise_id} violates active arbitration constraints.`,
        exercise_id: exercise.exercise_id,
        blocked_by: reasons,
        dominated_by: runtime.arbitration.dominant_sources,
      });
      constraintsCausingCollapse.push(...reasons);
    }

    if (exercise.intensity_pct > runtime.arbitration.final_intensity_ceiling + 0.1) {
      addIssue(issues, {
        classification: "arbitration_conflict",
        invariant: "arbitrated_intensity_ceiling_respected",
        severity: "error",
        message: `${exercise.exercise_id} exceeds the arbitrated intensity ceiling.`,
        exercise_id: exercise.exercise_id,
        blocked_by: [`intensity_ceiling:${runtime.arbitration.final_intensity_ceiling}`],
        dominated_by: runtime.arbitration.dominant_sources,
      });
      constraintsCausingCollapse.push(`intensity_ceiling:${runtime.arbitration.final_intensity_ceiling}`);
    }
  }

  if (!exercises.length) {
    addIssue(issues, {
      classification: "empty_pipeline",
      invariant: "workout_non_empty",
      severity: "error",
      message: "Final orchestration pipeline emitted an empty workout.",
      dominated_by: runtime.arbitration.dominant_sources,
    });
  }

  const metrics = sessionMetrics(exercises);
  const baseMetrics = sessionMetrics(runtime.base_workout.exercises);
  const recoveryOnly = isRecoveryOnly(finalContext);
  const highSpecificity = isHighSpecificity(runtime, finalContext);

  if (highSpecificity && !hasClassicExposure(exercises)) {
    const allowedClassics = CLASSIC_CANDIDATES.filter((id) => isAllowed(id, runtime, finalContext));
    addIssue(issues, {
      classification: "specificity_collapse",
      invariant: "high_specificity_preserves_classic_lifts",
      severity: allowedClassics.length ? "error" : "warning",
      message: allowedClassics.length
        ? "Specificity pressure is high, but no legal classic lift survived final exercise selection."
        : "Specificity pressure is high, but arbitration/safety constraints block available classic fallbacks.",
      blocked_by: CLASSIC_CANDIDATES.flatMap((id) => blockingReasons(id, runtime, finalContext)),
      dominated_by: runtime.arbitration.dominant_sources,
    });
  }

  const lowerBlocked = LOWER_BODY_CANDIDATES.every((id) => !isAllowed(id, runtime, finalContext));
  if (!lowerBlocked && !hasLowerBodyExposure(exercises)) {
    addIssue(issues, {
      classification: "movement_pattern_loss",
      invariant: "lower_body_exposure_present",
      severity: "error",
      message: "Lower-body exposure disappeared without an explicit arbitration block.",
    });
  }

  const pullBlocked = PULL_CANDIDATES.every((id) => !isAllowed(id, runtime, finalContext));
  if (!pullBlocked && !hasPullExposure(exercises)) {
    addIssue(issues, {
      classification: "movement_pattern_loss",
      invariant: "pull_exposure_present",
      severity: "error",
      message: "Pull exposure disappeared without an explicit arbitration block.",
    });
  }

  const squatBlocked = SQUAT_CANDIDATES.every((id) => !isAllowed(id, runtime, finalContext));
  if (!squatBlocked && !hasSquatExposure(exercises) && !recoveryOnly) {
    addIssue(issues, {
      classification: "movement_pattern_loss",
      invariant: "squat_exposure_present",
      severity: "warning",
      message: "Squat exposure disappeared without an explicit arbitration block.",
    });
  }

  if (recoveryOnly) {
    const disruptive = exercises.filter((exercise) => {
      const profile = getExerciseStressProfile(exercise.exercise_id);
      return profile && !isRestorationFocused(profile) && profile.recovery_disruption >= 70;
    });
    if (disruptive.length > 0) {
      addIssue(issues, {
        classification: "recovery_violation",
        invariant: "recovery_day_limits_fatigue_accumulation",
        severity: "error",
        message: "Recovery-biased day retained highly recovery-disruptive exercises.",
        blocked_by: disruptive.map((exercise) => exercise.exercise_id),
        dominated_by: runtime.arbitration.dominant_sources,
      });
    }
  }

  if (
    runtime.arbitration.final_restoration_bias >= 0.7 &&
    finalContext.intelligence_summary.daily_priority !== "competition_specific" &&
    metrics.avgIntensity > Math.max(72, runtime.arbitration.final_intensity_ceiling)
  ) {
    addIssue(issues, {
      classification: "recovery_violation",
      invariant: "recovery_protection_overrides_tactical_preferences",
      severity: "error",
      message: "Recovery protection is high, but final average intensity remains too aggressive.",
      dominated_by: runtime.arbitration.dominant_sources,
    });
  }

  if (
    isHeavyIntent(finalContext) &&
    !recoveryOnly &&
    metrics.avgIntensity < 60 &&
    runtime.arbitration.final_restoration_bias < 0.7
  ) {
    addIssue(issues, {
      classification: "phase_intent_violation",
      invariant: "heavy_days_remain_heavier_than_recovery_days",
      severity: "warning",
      message: "Heavy tactical intent collapsed into recovery-level loading without a dominant recovery reason.",
      dominated_by: runtime.arbitration.dominant_sources,
    });
  }

  if (
    isHeavyIntent(finalContext) &&
    runtime.arbitration.final_restoration_bias >= 0.7 &&
    !hasLowerBodyExposure(exercises) &&
    !hasClassicExposure(exercises)
  ) {
    addIssue(issues, {
      classification: "phase_intent_violation",
      invariant: "recovery_modified_heavy_days_preserve_training_intent",
      severity: "warning",
      message: "Recovery reduced a heavy-intent day but left no classic or lower-body training signal.",
      dominated_by: runtime.arbitration.dominant_sources,
    });
  }

  if (
    finalContext.intelligence_summary.training_phase === "accumulation" &&
    metrics.avgIntensity > 88 &&
    metrics.totalVolume < baseMetrics.totalVolume * 0.7
  ) {
    addIssue(issues, {
      classification: "phase_intent_violation",
      invariant: "accumulation_biases_volume_over_peak_intensity",
      severity: "warning",
      message: "Accumulation phase drifted toward peak intensity with reduced volume.",
    });
  }

  if (
    (finalContext.intelligence_summary.training_phase === "realization" ||
      finalContext.intelligence_summary.training_phase === "peak") &&
    !recoveryOnly &&
    metrics.avgSpecificity < 55 &&
    runtime.arbitration.final_specificity_pressure >= 0.4
  ) {
    addIssue(issues, {
      classification: "phase_intent_violation",
      invariant: "realization_preserves_specificity_exposure",
      severity: "warning",
      message: "Realization/peak phase lost meaningful specificity exposure.",
    });
  }

  if (
    (finalContext.intelligence_summary.training_phase === "realization" ||
      finalContext.intelligence_summary.training_phase === "peak") &&
    !recoveryOnly &&
    runtime.arbitration.final_restoration_bias < 0.7 &&
    metrics.avgIntensity < 70
  ) {
    addIssue(issues, {
      classification: "phase_intent_violation",
      invariant: "realization_preserves_intensity_exposure",
      severity: "warning",
      message: "Realization/peak phase preserved neither recovery intent nor meaningful intensity exposure.",
    });
  }

  if (
    finalContext.intelligence_summary.taper_state !== "none" &&
    metrics.avgRecoveryDisruption > baseMetrics.avgRecoveryDisruption &&
    runtime.arbitration.final_restoration_bias > 0
  ) {
    addIssue(issues, {
      classification: "phase_intent_violation",
      invariant: "taper_reduces_fatigue_accumulation",
      severity: "warning",
      message: "Taper context did not reduce fatigue accumulation relative to the base workout.",
    });
  }

  if (
    highSpecificity &&
    baseMetrics.avgSpecificity > 0 &&
    metrics.avgSpecificity < baseMetrics.avgSpecificity * 0.6 &&
    !recoveryOnly
  ) {
    addIssue(issues, {
      classification: "specificity_collapse",
      invariant: "specificity_pressure_affects_selection",
      severity: "warning",
      message: "Specificity pressure did not meaningfully survive final selection.",
      dominated_by: runtime.arbitration.dominant_sources,
    });
  }

  return {
    issues,
    constraints_causing_collapse: constraintsCausingCollapse,
    removed_exercise_ids: removedExerciseIds,
    dominant_rules: dominantRules,
  };
}

// ────────────────────────────────────────────────────────────
// POST-REPAIR REVALIDATION (read-only)
//
// Narrow set of critical checks the repair engine runs after each repair
// iteration to decide whether to iterate again. Kept here so all read-only
// invariant logic lives in one module.
// ────────────────────────────────────────────────────────────

export function collectRevalidationIssues(
  repairedWorkout: ExerciseBlock[],
  runtime: RuntimeCoachingContext,
  finalContext: FinalCoachContext,
  iteration: number,
): SemanticValidationIssue[] {
  const revalidationIssues: SemanticValidationIssue[] = [];

  if (!repairedWorkout.length) {
    addIssue(revalidationIssues, {
      classification: "empty_pipeline",
      invariant: "workout_non_empty",
      severity: "error",
      message: "Repaired workout is still empty after iteration " + (iteration + 1) + ".",
      dominated_by: runtime.arbitration.dominant_sources,
    });
  }

  const highSpec = isHighSpecificity(runtime, finalContext);
  if (highSpec && !hasClassicExposure(repairedWorkout)) {
    const allowedClassics = CLASSIC_CANDIDATES.filter((id) =>
      isAllowed(id, runtime, finalContext),
    );
    addIssue(revalidationIssues, {
      classification: "specificity_collapse",
      invariant: "high_specificity_preserves_classic_lifts",
      severity: allowedClassics.length ? "error" : "warning",
      message: "Repaired workout still lacks classic lift exposure (iteration " + (iteration + 1) + ").",
      blocked_by: allowedClassics.length
        ? []
        : CLASSIC_CANDIDATES.flatMap((id) => blockingReasons(id, runtime, finalContext)),
      dominated_by: runtime.arbitration.dominant_sources,
    });
  }

  const blockedSC = blockedStressClasses(runtime);
  if (blockedSC.size > 0) {
    const violatingExercises = repairedWorkout.filter((ex) => {
      const profile = getExerciseStressProfile(ex.exercise_id);
      return profile && blockedSC.has(profile.stress_class);
    });
    if (violatingExercises.length > 0) {
      addIssue(revalidationIssues, {
        classification: "arbitration_conflict",
        invariant: "arbitration_blocks_respected",
        severity: "error",
        message: "Repaired workout still contains exercises with blocked stress classes.",
        exercise_id: violatingExercises.map((ex) => ex.exercise_id).join(", "),
        dominated_by: runtime.arbitration.dominant_sources,
      });
    }
  }

  const complexityViolations = repairedWorkout.filter((ex) => {
    const profile = getExerciseStressProfile(ex.exercise_id);
    return profile && profile.complexity > runtime.arbitration.final_complexity_ceiling;
  });
  if (complexityViolations.length > 0) {
    addIssue(revalidationIssues, {
      classification: "arbitration_conflict",
      invariant: "complexity_ceiling_respected",
      severity: "error",
      message: "Repaired workout still contains exercises exceeding complexity ceiling.",
      dominated_by: runtime.arbitration.dominant_sources,
    });
  }

  return revalidationIssues;
}
