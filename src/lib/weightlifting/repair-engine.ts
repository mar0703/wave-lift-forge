// ─────────────────────────────────────────────────────────────────────────────
// REPAIR ENGINE — runtime repair / fallback logic for orchestration semantics
//
// Owns all workout-modifying behavior:
//   • running read-only analysis via the semantic validator
//   • iterating bounded repair attempts (with post-repair revalidation)
//   • emitting the safest-legal-fallback when repair iterations exhaust
//   • recording telemetry on repair exhaustion
//
// The orchestrator calls this module exclusively. The semantic validator is
// pure analysis and never mutates state.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExerciseBlock } from "../training-engine";
import { buildBlock } from "../training-engine";
import { getExerciseById } from "../exercise-db";
import type { RuntimeCoachingContext, FinalCoachContext } from "../orchestrator";
import type { TelemetrySink } from "../telemetry/types";
import {
  CLASSIC_CANDIDATES,
  LOWER_BODY_CANDIDATES,
  PULL_CANDIDATES,
  RESTORATION_CANDIDATES,
  SQUAT_CANDIDATES,
  analyzeOrchestrationSemantics,
  collectRevalidationIssues,
  hasClassicExposure,
  hasLowerBodyExposure,
  hasPullExposure,
  hasSquatExposure,
  isAllowed,
  isRecoveryOnly,
  uniqueExercises,
} from "./semantic-validator";
import type {
  OrchestrationSemanticDebug,
  SemanticValidationIssue,
  SemanticValidationMode,
} from "./semantic-validator";

export type { SemanticValidationMode } from "./semantic-validator";

// ────────────────────────────────────────────────────────────
// PUBLIC TYPES
// ────────────────────────────────────────────────────────────

export interface SemanticRepairIntervention {
  strategy: string;
  reason: string;
  added_exercise_ids: string[];
  removed_exercise_ids: string[];
  skipped_exercise_ids: string[];
  authority_preserved: "arbitration" | "safety" | "specificity" | "diversity";
  notes: string[];
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
  telemetry?: TelemetrySink;
}

// ────────────────────────────────────────────────────────────
// REPAIR ITERATION GUARD — Phase B Stabilization
// Prevents infinite repair recursion. If repair fails after max iterations,
// emits telemetry warning and returns safest legal fallback.
// ────────────────────────────────────────────────────────────
const MAX_REPAIR_ITERATIONS = 3;

/**
 * Read-only view of every repair candidate list the repair engine may inject
 * during fallback. Exposed for the taxonomy-integrity audit so it can
 * cross-check that every referenced exercise has a stress profile registered.
 */
export const REPAIR_CANDIDATES: Readonly<Record<string, readonly string[]>> = {
  classic: CLASSIC_CANDIDATES,
  lower_body: LOWER_BODY_CANDIDATES,
  pull: PULL_CANDIDATES,
  squat: SQUAT_CANDIDATES,
  restoration: RESTORATION_CANDIDATES,
};

// ────────────────────────────────────────────────────────────
// FALLBACK BLOCK CONSTRUCTION
// ────────────────────────────────────────────────────────────

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

function canRepair(issue: SemanticValidationIssue): boolean {
  return (
    issue.classification === "empty_pipeline" ||
    issue.classification === "movement_pattern_loss" ||
    issue.classification === "specificity_collapse"
  );
}

function repairWorkout(
  exercises: ExerciseBlock[],
  issues: SemanticValidationIssue[],
  runtime: RuntimeCoachingContext,
  finalContext: FinalCoachContext,
): { workout: ExerciseBlock[]; repairs: SemanticRepairIntervention[] } {
  const next = uniqueExercises(exercises).filter((exercise) =>
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

// ────────────────────────────────────────────────────────────
// PUBLIC ENTRY POINT
//
// Runs read-only analysis via the semantic validator, then (when mode is
// "repair") iterates bounded repair attempts, revalidates after each, and
// falls back to the safest legal exercise set if iterations exhaust. Returns
// the validation result + final (possibly repaired) workout.
// ────────────────────────────────────────────────────────────

export function validateOrchestrationSemantics(
  input: OrchestrationSemanticValidationInput,
): OrchestrationSemanticValidationResult {
  const mode = input.mode ?? "warning-only";
  const { runtime_context: runtime, final_context: finalContext } = input;
  const exercises = uniqueExercises(input.exercises);

  const analysis = analyzeOrchestrationSemantics({
    runtime_context: runtime,
    final_context: finalContext,
    exercises,
  });
  const issues = analysis.issues;
  const notes: string[] = [];

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

      const revalidationIssues = collectRevalidationIssues(
        repairedWorkout,
        runtime,
        finalContext,
        iteration,
      );
      const revalidationErrors = revalidationIssues.filter((i) => i.severity === "error");

      if (revalidationErrors.length === 0) {
        break;
      }

        if (iteration >= MAX_REPAIR_ITERATIONS - 1) {
          repairExhausted = true;
          input.telemetry?.emit({
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
        currentExercises = repairedWorkout;
        currentIssues = revalidationIssues;
      }
    }
  }

  const allIssues = repairExhausted ? [...issues] : issues;
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
    constraints_causing_collapse: Array.from(new Set(analysis.constraints_causing_collapse)),
    removed_exercise_ids: Array.from(new Set(analysis.removed_exercise_ids)),
    repair_path_activated: allRepairs.map((repair) => repair.strategy),
    dominating_arbitration_rules: Array.from(new Set(analysis.dominant_rules)),
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
