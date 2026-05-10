import type { ExerciseBlock } from "../training-engine";
import { buildBlock } from "../training-engine";
import { getExerciseById } from "../exercise-db";
import type { RuntimeCoachingContext, FinalCoachContext } from "../orchestrator";
import type { StressClass } from "./exercise-stress-taxonomy";
import {
  getExerciseStressProfile,
  isCompetitionSpecific,
  isRestorationFocused,
} from "./exercise-stress-taxonomy";
import { recordUnknownExerciseBypass } from "./orchestrator-telemetry";

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

export interface SemanticRepairIntervention {
  strategy: string;
  reason: string;
  added_exercise_ids: string[];
  removed_exercise_ids: string[];
  skipped_exercise_ids: string[];
  authority_preserved: "arbitration" | "safety" | "specificity" | "diversity";
  notes: string[];
}

export interface OrchestrationSemanticDebug {
  failed_invariants: string[];
  constraints_causing_collapse: string[];
  removed_exercise_ids: string[];
  repair_path_activated: string[];
  dominating_arbitration_rules: string[];
  final_semantic_confidence: number;
}

export interface OrchestrationSemanticValidationResult {
  valid: boolean;
  mode: SemanticValidationMode;
  confidence: number;
  issues: SemanticValidationIssue[];
  repairs: SemanticRepairIntervention[];
  debug: OrchestrationSemanticDebug;
  workout: ExerciseBlock[];
  notes: string[];
}

export interface OrchestrationSemanticValidationInput {
  runtime_context: RuntimeCoachingContext;
  final_context: FinalCoachContext;
  exercises: ExerciseBlock[];
  mode?: SemanticValidationMode;
}

// ─────────────────────────────────────────────────────────────────────────────
// REPAIR ITERATION GUARD — Phase B Stabilization
// Prevents infinite repair recursion. If repair fails after max iterations,
// emits telemetry warning and returns safest legal fallback.
// ─────────────────────────────────────────────────────────────────────────────
const MAX_REPAIR_ITERATIONS = 3;

const CLASSIC_CANDIDATES = ["snatch", "clean_and_jerk", "clean", "jerk"];
const LOWER_BODY_CANDIDATES = ["back_squat", "front_squat", "clean_pull", "snatch_pull"];
const PULL_CANDIDATES = ["snatch_pull", "clean_pull", "snatch_deadlift", "clean_deadlift"];
const SQUAT_CANDIDATES = ["back_squat", "front_squat", "pause_back_squat", "pause_front_squat"];
const RESTORATION_CANDIDATES = ["tall_snatch", "tall_clean", "muscle_snatch", "jerk_dip"];

/**
 * Read-only view of every repair candidate list the semantic validator may
 * inject during fallback. Exposed for the taxonomy-integrity audit so it can
 * cross-check that every referenced exercise has a stress profile registered.
 */
export const REPAIR_CANDIDATES: Readonly<Record<string, readonly string[]>> = {
  classic: CLASSIC_CANDIDATES,
  lower_body: LOWER_BODY_CANDIDATES,
  pull: PULL_CANDIDATES,
  squat: SQUAT_CANDIDATES,
  restoration: RESTORATION_CANDIDATES,
};

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function uniqueExercises(exercises: ExerciseBlock[]): ExerciseBlock[] {
  const seen = new Set<string>();
  const out: ExerciseBlock[] = [];
  for (const exercise of exercises) {
    if (seen.has(exercise.exercise_id)) continue;
    seen.add(exercise.exercise_id);
    out.push(exercise);
  }
  return out;
}

function blockedStressClasses(runtime: RuntimeCoachingContext): Set<StressClass> {
  return new Set([
    ...runtime.arbitration.blocked_stress_classes,
    ...runtime.arbitration.protected_stress_classes,
  ]);
}

function blockingReasons(
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

function isAllowed(
  exerciseId: string,
  runtime: RuntimeCoachingContext,
  finalContext: FinalCoachContext,
): boolean {
  return blockingReasons(exerciseId, runtime, finalContext).length === 0;
}

function hasLowerBodyExposure(exercises: ExerciseBlock[]): boolean {
  return exercises.some((exercise) => {
    if (exercise.family === "squat" || exercise.family === "pull") return true;
    const def = getExerciseById(exercise.exercise_id);
    return def?.transfer_to?.clean !== undefined || def?.transfer_to?.snatch !== undefined;
  });
}

function hasPullExposure(exercises: ExerciseBlock[]): boolean {
  return exercises.some((exercise) => {
    if (exercise.family === "pull") return true;
    const def = getExerciseById(exercise.exercise_id);
    return def?.primary_phase === "first_pull" || def?.primary_phase === "extension";
  });
}

function hasSquatExposure(exercises: ExerciseBlock[]): boolean {
  return exercises.some((exercise) => {
    if (exercise.family === "squat") return true;
    const def = getExerciseById(exercise.exercise_id);
    return def?.primary_position === "rack" && def.intent === "max_force";
  });
}

function hasClassicExposure(exercises: ExerciseBlock[]): boolean {
  return exercises.some((exercise) => {
    const def = getExerciseById(exercise.exercise_id);
    const profile = getExerciseStressProfile(exercise.exercise_id);
    return def?.role === "main" && (def.family === "snatch" || def.family === "clean" || def.family === "jerk") &&
      (profile ? isCompetitionSpecific(profile) : true);
  });
}

function isRecoveryOnly(finalContext: FinalCoachContext): boolean {
  return (
    finalContext.intelligence_summary.daily_priority === "recovery" ||
    finalContext.biases.restoration_favor >= 0.7
  );
}

function isHighSpecificity(runtime: RuntimeCoachingContext, finalContext: FinalCoachContext): boolean {
  return (
    runtime.arbitration.final_specificity_pressure >= 0.65 ||
    finalContext.biases.specificity_favor >= 0.65 ||
    finalContext.intelligence_summary.daily_priority === "competition_specific" ||
    finalContext.intelligence_summary.adaptation_target === "competition" ||
    finalContext.intelligence_summary.taper_state === "taper" ||
    finalContext.intelligence_summary.taper_state === "peak"
  );
}

function isHeavyIntent(finalContext: FinalCoachContext): boolean {
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

function sessionMetrics(exercises: ExerciseBlock[]): {
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

function canRepair(issue: SemanticValidationIssue): boolean {
  return (
    issue.classification === "empty_pipeline" ||
    issue.classification === "movement_pattern_loss" ||
    issue.classification === "specificity_collapse"
  );
}

function buildFallbackBlock(
  exerciseId: string,
  finalContext: FinalCoachContext,
): ExerciseBlock | null {
  const def = getExerciseById(exerciseId);
  if (!def) return null;
  const ceiling = Math.min(finalContext.constraints.intensity_pct, 75);
  const targetIntensity = Math.max(50, ceiling) / 100;
  const refMax =
    def.family === "snatch" ? 100 :
    def.family === "clean" || def.family === "jerk" ? 130 :
    150;
  return buildBlock(exerciseId, refMax, targetIntensity);
}

function firstAllowedCandidate(
  ids: string[],
  runtime: RuntimeCoachingContext,
  finalContext: FinalCoachContext,
  existing: Set<string>,
): { block: ExerciseBlock | null; skipped: string[] } {
  const skipped: string[] = [];
  for (const id of ids) {
    if (existing.has(id)) continue;
    if (!isAllowed(id, runtime, finalContext)) {
      skipped.push(id);
      continue;
    }
    const fromBase = runtime.base_workout.exercises.find((exercise) => exercise.exercise_id === id);
    if (fromBase) return { block: fromBase, skipped };
    const built = buildFallbackBlock(id, finalContext);
    if (built) return { block: built, skipped };
    skipped.push(id);
  }
  return { block: null, skipped };
}

function repairWorkout(
  exercises: ExerciseBlock[],
  issues: SemanticValidationIssue[],
  runtime: RuntimeCoachingContext,
  finalContext: FinalCoachContext,
): { workout: ExerciseBlock[]; repairs: SemanticRepairIntervention[] } {
  let next = uniqueExercises(exercises).filter((exercise) =>
    isAllowed(exercise.exercise_id, runtime, finalContext),
  );
  const repairs: SemanticRepairIntervention[] = [];
  const removed = exercises
    .filter((exercise) => !isAllowed(exercise.exercise_id, runtime, finalContext))
    .map((exercise) => exercise.exercise_id);

  if (removed.length > 0) {
    repairs.push({
      strategy: "preserve_arbitration_authority",
      reason: "Removed exercises that conflicted with arbitrated blocks before any additive repair.",
      added_exercise_ids: [],
      removed_exercise_ids: removed,
      skipped_exercise_ids: [],
      authority_preserved: "arbitration",
      notes: ["Blocked movements are never silently reintroduced."],
    });
  }

  const existing = new Set(next.map((exercise) => exercise.exercise_id));
  const addCandidate = (
    strategy: string,
    reason: string,
    candidates: string[],
    authority: SemanticRepairIntervention["authority_preserved"],
  ) => {
    const { block, skipped } = firstAllowedCandidate(candidates, runtime, finalContext, existing);
    if (block) {
      next.push(block);
      existing.add(block.exercise_id);
    }
    repairs.push({
      strategy,
      reason,
      added_exercise_ids: block ? [block.exercise_id] : [],
      removed_exercise_ids: [],
      skipped_exercise_ids: skipped,
      authority_preserved: authority,
      notes: block
        ? [`Least-violating fallback selected: ${block.exercise_id}.`]
        : ["No legal fallback found under current arbitration constraints."],
    });
  };

  for (const issue of issues.filter(canRepair)) {
    if (issue.classification === "empty_pipeline") {
      const candidates = isRecoveryOnly(finalContext)
        ? RESTORATION_CANDIDATES
        : [...CLASSIC_CANDIDATES, ...LOWER_BODY_CANDIDATES];
      addCandidate("least_violating_non_empty_fallback", issue.message, candidates, "safety");
    }
    if (issue.classification === "specificity_collapse" && !hasClassicExposure(next)) {
      addCandidate("preserve_specificity_exposure", issue.message, CLASSIC_CANDIDATES, "specificity");
    }
    if (issue.classification === "movement_pattern_loss") {
      if (issue.invariant.includes("pull") && !hasPullExposure(next)) {
        addCandidate("restore_pull_exposure", issue.message, PULL_CANDIDATES, "diversity");
      } else if (issue.invariant.includes("squat") && !hasSquatExposure(next)) {
        addCandidate("restore_squat_exposure", issue.message, SQUAT_CANDIDATES, "diversity");
      } else if (issue.invariant.includes("lower") && !hasLowerBodyExposure(next)) {
        addCandidate("restore_lower_body_exposure", issue.message, LOWER_BODY_CANDIDATES, "diversity");
      }
    }
  }

  return { workout: uniqueExercises(next), repairs };
}

export function validateOrchestrationSemantics(
  input: OrchestrationSemanticValidationInput,
): OrchestrationSemanticValidationResult {
  const mode = input.mode ?? "warning-only";
  const { runtime_context: runtime, final_context: finalContext } = input;
  const exercises = uniqueExercises(input.exercises);
  const issues: SemanticValidationIssue[] = [];
  const notes: string[] = [];
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

  // ───────────────────────────────────────────────────────────────────────────
  // TASK B1 & B2: Bounded repair iteration with post-repair revalidation
  // ───────────────────────────────────────────────────────────────────────────
  let repairedWorkout: ExerciseBlock[] = exercises;
  const allRepairs: SemanticRepairIntervention[] = [];
  let repairExhausted = false;

  if (mode === "repair") {
    let currentExercises = exercises;
    let currentIssues = issues;

    for (let iteration = 0; iteration < MAX_REPAIR_ITERATIONS; iteration++) {
      const repairResult = repairWorkout(currentExercises, currentIssues, runtime, finalContext);
      repairedWorkout = repairResult.workout;
      allRepairs.push(...repairResult.repairs);

      // ─────────────────────────────────────────────────────────────────────
      // TASK B2: POST-REPAIR REVALIDATION
      // Re-validate the repaired workout. If it still fails critical checks,
      // attempt another iteration (up to MAX_REPAIR_ITERATIONS).
      // ─────────────────────────────────────────────────────────────────────
      const revalidationIssues: SemanticValidationIssue[] = [];

      // Check: empty pipeline
      if (!repairedWorkout.length) {
        addIssue(revalidationIssues, {
          classification: "empty_pipeline",
          invariant: "workout_non_empty",
          severity: "error",
          message: "Repaired workout is still empty after iteration " + (iteration + 1) + ".",
          dominated_by: runtime.arbitration.dominant_sources,
        });
      }

      // Check: specificity collapse
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

      // Check: blocked stress classes still present
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

      // Check: complexity ceiling violations
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

      const revalidationErrors = revalidationIssues.filter((i) => i.severity === "error");

      if (revalidationErrors.length === 0) {
        // Repair succeeded — repaired workout passes revalidation
        break;
      }

      if (iteration >= MAX_REPAIR_ITERATIONS - 1) {
        // Max iterations reached — emit telemetry and use safest fallback
        repairExhausted = true;
        recordUnknownExerciseBypass({
          exercise_id: "REPAIR_EXHAUSTED",
          caller: "validateOrchestrationSemantics",
          validation_mode: mode,
          recorded_at: Date.now(),
          constraint_snapshot: {
            complexity_max: runtime.arbitration.final_complexity_ceiling,
            intensity_pct: runtime.arbitration.final_intensity_ceiling,
            volume_multiplier: runtime.arbitration.final_volume_multiplier,
            blocked_exercises_count: runtime.arbitration.blocked_exercises.size,
          },
          arbitration_snapshot: {
            final_complexity_ceiling: runtime.arbitration.final_complexity_ceiling,
            final_intensity_ceiling: runtime.arbitration.final_intensity_ceiling,
            final_cns_load_ceiling: runtime.arbitration.final_cns_load_ceiling,
            blocked_stress_classes: Array.from(runtime.arbitration.blocked_stress_classes),
            blocked_exercises_count: runtime.arbitration.blocked_exercises.size,
            dominant_sources: runtime.arbitration.dominant_sources,
          },
        });
        notes.push(
          `[semantic repair] ⚠ MAX_REPAIR_ITERATIONS (${MAX_REPAIR_ITERATIONS}) reached. ` +
            "Falling back to safest constrained workout.",
        );

        // Build safest legal fallback: use restoration candidates only, at low intensity
        const safeFallback = isRecoveryOnly(finalContext)
          ? RESTORATION_CANDIDATES
          : [...RESTORATION_CANDIDATES, ...LOWER_BODY_CANDIDATES];
        const { block: fallbackBlock, skipped: fallbackSkipped } = firstAllowedCandidate(
          safeFallback,
          runtime,
          finalContext,
          new Set(),
        );
        if (fallbackBlock) {
          repairedWorkout = [fallbackBlock];
          allRepairs.push({
            strategy: "max_iteration_safety_fallback",
            reason: "Repair exhausted after " + MAX_REPAIR_ITERATIONS + " iterations. Using safest legal fallback.",
            added_exercise_ids: [fallbackBlock.exercise_id],
            removed_exercise_ids: [],
            skipped_exercise_ids: fallbackSkipped,
            authority_preserved: "safety",
            notes: ["Safest legal fallback activated after repair exhaustion."],
          });
        } else {
          // No legal fallback found — return filtered exercises that pass arbitration
          repairedWorkout = uniqueExercises(exercises).filter((exercise) =>
            isAllowed(exercise.exercise_id, runtime, finalContext),
          );
          allRepairs.push({
            strategy: "max_iteration_arbitration_only_fallback",
            reason: "Repair exhausted and no safe fallback available. Returning arbitration-filtered exercises only.",
            added_exercise_ids: [],
            removed_exercise_ids: [],
            skipped_exercise_ids: safeFallback,
            authority_preserved: "arbitration",
            notes: ["No legal fallback exists. Returning only exercises that pass arbitration."],
          });
        }
      } else {
        // Prepare for next iteration
        currentExercises = repairedWorkout;
        currentIssues = revalidationIssues;
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Final confidence calculation (using all issues including revalidation)
  // ───────────────────────────────────────────────────────────────────────────
  const allIssues = repairExhausted
    ? [...issues]
    : issues;
  const remainingErrors = allIssues.filter((issue) => issue.severity === "error");
  const confidencePenalty = allIssues.reduce(
    (sum, issue) => sum + (issue.severity === "error" ? 18 : 8),
    0,
  );
  const repairCredit = Math.min(
    20,
    allRepairs.filter((repair) => repair.added_exercise_ids.length > 0).length * 6,
  );
  const confidence = repairExhausted
    ? Math.max(0, Math.min(30, 100 - confidencePenalty + repairCredit))
    : Math.max(0, Math.min(100, 100 - confidencePenalty + repairCredit));

  for (const repair of allRepairs) {
    notes.push(`[semantic repair] ${repair.strategy}: ${repair.notes.join(" ")}`);
  }

  const debug: OrchestrationSemanticDebug = {
    failed_invariants: allIssues.map((issue) => issue.invariant),
    constraints_causing_collapse: Array.from(new Set(constraintsCausingCollapse)),
    removed_exercise_ids: Array.from(new Set(removedExerciseIds)),
    repair_path_activated: allRepairs.map((repair) => repair.strategy),
    dominating_arbitration_rules: Array.from(new Set(dominantRules)),
    final_semantic_confidence: confidence,
  };

  if (mode === "strict" && remainingErrors.length > 0) {
    throw new Error(
      `Orchestration semantic validation failed: ${remainingErrors
        .map((issue) => `${issue.classification}:${issue.invariant}`)
        .join(", ")}`,
    );
  }

  return {
    valid: remainingErrors.length === 0,
    mode,
    confidence,
    issues: allIssues,
    repairs: allRepairs,
    debug,
    workout: repairedWorkout,
    notes,
  };
}
