// ─────────────────────────────────────────────────────────────────────────────
// TRAINING ORCHESTRATOR - SINGLE AUTHORITATIVE RUNTIME COORDINATOR
//
// Purpose:
// - Merges ALL intelligence engine outputs into unified runtime context
// - Actively propagates engine decisions into coaching pipeline
// - Makes existing intelligence operational (no new engines added)
// - Removes dependency on generateAdaptiveWorkout as sole entrypoint
//
// Responsibility:
// - buildRuntimeCoachingContext: Merge all intelligence signals
// - Apply recovery domain constraints
// - Apply microcycle state biases
// - Apply daily priority constraints
// - Apply intervention biases
// - buildFinalCoachContext: Unified payload before coach-engine
// ─────────────────────────────────────────────────────────────────────────────

import type { EngineInput, WorkoutOutput, ExerciseBlock } from "./training-engine";
import { generateWorkout, buildBlock } from "./training-engine";
import { detectProblems, selectCorrectives, getPrimaryProblem } from "./diagnostics";
import { getExerciseById } from "./exercise-db";

// Recovery domain engine
import type { RecoveryDecision, RecoveryDomains } from "./weightlifting/recovery-domain-engine";
import { evaluateRecovery } from "./weightlifting/recovery-domain-engine";

// Microcycle engine
import type { MicrocycleDecision, MicrocycleContext } from "./weightlifting/microcycle-engine";
import { evaluateMicrocycle } from "./weightlifting/microcycle-engine";

// Daily priority engine
import type { DailyPriority, PriorityDefinition } from "./weightlifting/daily-priority-engine";
import { PRIORITY_DEFINITIONS } from "./weightlifting/daily-priority-engine";

// Intervention engine
import type { InterventionDecision, InterventionContext } from "./weightlifting/exercise-intervention-engine";
import { selectInterventions } from "./weightlifting/exercise-intervention-engine";

// Arbitration bridge
import {
  buildArbitrationFromEngines,
  type ArbitrationDecision,
} from "./weightlifting/orchestrator-signal-bridge";

// ─────────────────────────────────────────────────────────────────────────────
// 1. ORCHESTRATOR INPUT & CONTEXT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface OrchestratorInput {
  // Core engine input
  engine_input: EngineInput;
  user_maxes: Record<string, number>;
  correction_state?: Record<string, number>;

  // History for microcycle / recovery calculation
  recent_sessions?: Array<{
    date?: string;
    cns_load?: number;
    technical_load?: number;
    local_load?: number;
    overhead_stress?: number;
    squat_stress?: number;
    pull_stress?: number;
    intensity_avg?: number;
    complexity_avg?: number;
    specificity_score?: number;
  }>;

  // Athlete state for intervention context
  readiness?: number;
  fatigue?: number;
  success_rate?: number;
  competition_in_days?: number;
  adaptation_target?: "timing" | "speed" | "max_strength" | "competition" | "technical_rebuild" | "work_capacity";
}

export interface RuntimeCoachingContext {
  // Original engine baseline
  base_workout: WorkoutOutput;
  detected_problems: string[];
  primary_problem?: string;

  // Recovery domain intelligence
  recovery_decision: RecoveryDecision;
  recovery_domains: RecoveryDomains;

  // Microcycle intelligence
  microcycle_decision: MicrocycleDecision;
  rolling_cns_load: number;
  rolling_technical_load: number;
  maladaptation_risk: number;

  // Daily priority intelligence
  daily_priority: DailyPriority;
  priority_definition: PriorityDefinition;

  // Intervention intelligence
  intervention_decision: InterventionDecision;
  safe_exercises: string[];
  blocked_exercises: string[];

  // Unified constraints & biases
  intensity_ceiling: number;      // % of base intensity
  complexity_tolerance: number;   // 0–10
  cns_load_ceiling: number;       // 0–100
  restoration_bias: number;       // 0–1, favor restoration exercises
  specificity_pressure: number;   // 0–1, favor specificity
  intervention_bias: Set<string>; // exercise IDs to favor
  blocked_ids: Set<string>;       // exercise IDs to avoid

  // Arbitration decision
  arbitration: ArbitrationDecision;

  notes: string[];
}

export interface FinalCoachContext {
  // Unified runtime payload
  base_workout: ExerciseBlock[];
  constraints: {
    intensity_pct: number;
    complexity_max: number;
    cns_load_ceiling: number;
    blocked_exercises: Set<string>;
  };
  biases: {
    restoration_favor: number;
    specificity_favor: number;
    intervention_exercise_ids: Set<string>;
    preferred_families: string[];
  };
  intelligence_summary: {
    recovery_domains: RecoveryDomains;
    microcycle_state_risk: number;
    daily_priority: DailyPriority;
    intervention_count: number;
  };
  notes: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. HELPER: Select Daily Priority
// ─────────────────────────────────────────────────────────────────────────────

function selectDailyPriority(
  microcycle: MicrocycleDecision,
  correction_state: Record<string, number>,
  training_day: number,
): DailyPriority {
  // If microcycle blocks priorities, default to recovery or restoration
  if (microcycle.blocked_priorities?.length === microcycle.biased_priorities?.length) {
    return "recovery";
  }

  // If strong training debt in a priority, bias toward it
  const debts = microcycle.training_debts || [];
  if (debts.length > 0) {
    const sortedByDebt = [...debts].sort((a, b) => b.debt_score - a.debt_score);
    const topDebt = sortedByDebt[0];
    if (topDebt && !microcycle.blocked_priorities?.includes(topDebt.priority)) {
      return topDebt.priority;
    }
  }

  // Fallback: day-of-week based + correction state
  const dayPriorities: Record<number, DailyPriority> = {
    1: "snatch_speed",
    2: "clean_technique",
    3: "squat_strength",
    4: "jerk_strength",
    5: "pull_strength",
  };

  return dayPriorities[training_day] || "snatch_speed";
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RECOVERY DOMAIN CONSTRAINT APPLICATION
// ─────────────────────────────────────────────────────────────────────────────

interface RecoveryConstraint {
  intensity_ceiling: number;
  complexity_tolerance: number;
  cns_load_ceiling: number;
  notes: string[];
}

function applyRecoveryConstraints(domains: RecoveryDomains): RecoveryConstraint {
  const notes: string[] = [];
  let intensity = 100;
  let complexity = 10;
  let cns = 100;

  // CNS < 45: reduce intensity and CNS load
  if (domains.cns <= 45) {
    intensity *= 0.9;
    cns *= 0.85;
    notes.push("CNS degraded: reduce intensity -10%, CNS ceiling -15%");
  }
  if (domains.cns <= 30) {
    intensity *= 0.85;
    cns *= 0.7;
    notes.push("CNS severely degraded: reduce intensity -15%, CNS ceiling -30%");
  }

  // Technical coordination < 45: reduce complexity
  if (domains.technical_coordination <= 45) {
    complexity *= 0.75;
    notes.push("Technical coordination degraded: reduce complexity -25%");
  }
  if (domains.technical_coordination <= 30) {
    complexity *= 0.6;
    notes.push("Technical coordination severely degraded: reduce complexity -40%");
  }

  // Overhead freshness < 45: reduce jerk/overhead exercises
  if (domains.overhead <= 45) {
    notes.push("Overhead freshness degraded: reduce jerk volume");
  }

  // Speed freshness < 45: avoid explosive overload
  if (domains.speed_freshness <= 45) {
    notes.push("Speed freshness degraded: avoid explosive speed work");
  }

  // Legs < 45: reduce squat load
  if (domains.legs <= 45) {
    notes.push("Leg freshness degraded: reduce squat volume/intensity");
  }

  // Pull < 45: reduce pull load
  if (domains.pull_chain <= 45) {
    notes.push("Pull chain freshness degraded: reduce pull volume/intensity");
  }

  return {
    intensity_ceiling: intensity,
    complexity_tolerance: complexity,
    cns_load_ceiling: cns,
    notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. MICROCYCLE STATE CONSTRAINT APPLICATION
// ─────────────────────────────────────────────────────────────────────────────

interface MicrocycleConstraint {
  intensity_ceiling: number;
  restoration_bias: number;
  cns_load_ceiling: number;
  specificity_pressure: number;
  notes: string[];
}

function applyMicrocycleConstraints(microcycle: MicrocycleDecision): MicrocycleConstraint {
  const state = microcycle.microcycle_state;
  const notes: string[] = [];
  let intensity = 100;
  let restoration = 0;
  let cns = 100;
  let specificity = 0;

  // High rolling CNS load → bias restoration
  if ((state.rolling_cns_load || 0) > 250) {
    restoration += 0.6;
    intensity *= 0.9;
    notes.push("Rolling CNS load high: bias restoration -10% intensity");
  }
  if ((state.rolling_cns_load || 0) > 300) {
    restoration += 0.4;
    intensity *= 0.85;
    cns *= 0.85;
    notes.push("Rolling CNS load very high: strong restoration bias");
  }

  // Maladaptation risk high → reduce overload pressure
  if ((state.maladaptation_risk || 0) > 70) {
    intensity *= 0.92;
    restoration += 0.7;
    notes.push("Maladaptation risk high: reduce intensity -8%, increase restoration");
  }
  if ((state.maladaptation_risk || 0) > 85) {
    intensity *= 0.85;
    restoration += 0.3;
    notes.push("Maladaptation risk critical: strong restoration bias");
  }

  // High technical density → reduce complexity
  if ((state.rolling_technical_load || 0) > 200) {
    notes.push("Technical load high: reduce exercise complexity");
  }

  // High specificity density + days to competition close → increase specificity
  if ((state.specificity_density || 0) > 60 && microcycle.notes?.some((n) => n.includes("competition"))) {
    specificity += 0.8;
    notes.push("Competition approaching: increase specificity bias");
  }

  return {
    intensity_ceiling: intensity,
    restoration_bias: restoration,
    cns_load_ceiling: cns,
    specificity_pressure: specificity,
    notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. DAILY PRIORITY CONSTRAINT APPLICATION
// ─────────────────────────────────────────────────────────────────────────────

interface PriorityConstraint {
  intensity_ceiling: number;
  complexity_tolerance: number;
  cns_load_ceiling: number;
  preferred_families: string[];
  notes: string[];
}

function applyPriorityConstraints(priority: PriorityDefinition): PriorityConstraint {
  const notes: string[] = [];
  const intensity = (priority.preferred_intensity_range.max / 100) * 100; // as % ceiling
  const complexity = priority.preferred_complexity_range.max;
  const cns = priority.max_cns_load;
  const families = priority.preferred_families || [];

  notes.push(`Daily priority: ${priority.id}`);
  notes.push(`  Target phases: ${priority.target_phases.join(", ")}`);
  notes.push(
    `  Intensity: ${priority.preferred_intensity_range.min}–${priority.preferred_intensity_range.max}%`,
  );
  notes.push(
    `  Complexity: ${priority.preferred_complexity_range.min}–${priority.preferred_complexity_range.max}`,
  );
  notes.push(`  Max CNS load: ${priority.max_cns_load}`);

  return {
    intensity_ceiling: intensity,
    complexity_tolerance: complexity,
    cns_load_ceiling: cns,
    preferred_families: families,
    notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. INTERVENTION CONSTRAINT APPLICATION
// ─────────────────────────────────────────────────────────────────────────────

interface InterventionConstraint {
  safe_exercises: string[];
  blocked_exercises: string[];
  bias_exercises: Set<string>;
  notes: string[];
}

function applyInterventionConstraints(decision: InterventionDecision): InterventionConstraint {
  const notes: string[] = [];
  const bias = new Set<string>();
  const blocked = new Set<string>();
  const safe = new Array<string>();

  // Selected interventions should be actively biased
  for (const intervention of decision.selected_interventions) {
    bias.add(intervention.exercise_id);
    safe.push(intervention.exercise_id);
    notes.push(
      `Selected intervention: ${intervention.exercise_id} ` +
        `(category: ${intervention.intervention_category}, purpose: ${intervention.intervention_purpose})`,
    );
  }

  // Rejected interventions should be blocked if they are unsafe
  for (const { intervention, reason } of decision.rejected_interventions) {
    if (reason.includes("CNS") || reason.includes("fatigue") || reason.includes("unsafe")) {
      blocked.add(intervention.exercise_id);
      notes.push(`Blocked intervention: ${intervention.exercise_id} (${reason})`);
    }
  }

  return {
    safe_exercises: safe,
    blocked_exercises: Array.from(blocked),
    bias_exercises: bias,
    notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. MAIN: Build Runtime Coaching Context
// ─────────────────────────────────────────────────────────────────────────────

export function buildRuntimeCoachingContext(input: OrchestratorInput): RuntimeCoachingContext {
  // 1. Generate base workout (training-engine)
  const base = generateWorkout(input.engine_input);
  const detected = detectProblems(input.user_maxes);
  const primary = getPrimaryProblem(detected, input.correction_state || {});

  // 2. Call recovery-domain-engine
  const recoveryInput = {
    recent_sessions: input.recent_sessions || [],
    readiness: input.readiness || input.engine_input.readiness,
    sleep_quality: input.engine_input.profile_assessment.sleep_quality * 10,
    soreness: Math.max(0, input.fatigue || 0), // approximate
  };
  const recoveryDecision = evaluateRecovery(recoveryInput);
  const recoveryDomains = recoveryDecision.recovery_domains;

  // 3. Call microcycle-engine
  const microcycleCtx: MicrocycleContext = {
    recent_sessions: input.recent_sessions || [],
    readiness: input.readiness || input.engine_input.readiness,
    fatigue: input.fatigue || input.engine_input.fatigue_score,
    training_phase: input.engine_input.training_day_index <= 2 ? "accumulation" : 
                    input.engine_input.training_day_index <= 4 ? "intensification" : "peak",
    adaptation_target: input.adaptation_target as any,
    competition_in_days: input.competition_in_days,
  };
  const microcycleDecision = evaluateMicrocycle(microcycleCtx);

  // 4. Select daily priority
  const dailyPriority = selectDailyPriority(
    microcycleDecision,
    input.correction_state || {},
    input.engine_input.training_day_index,
  );
  const priorityDef = PRIORITY_DEFINITIONS[dailyPriority];

  // 5. Call intervention-engine
  const interventionCtx: InterventionContext = {
    problems: detected,
    adaptation_target: input.adaptation_target === "max_strength" ? "strength" :
                      input.adaptation_target === "technical_rebuild" ? "technical_restoration" :
                      input.adaptation_target === "competition" ? "specificity" :
                      input.adaptation_target as any,
    fatigue_state: (input.fatigue || 0) > 70 ? "high" : (input.fatigue || 0) > 40 ? "moderate" : "fresh",
    competition_in_days: input.competition_in_days,
    recent_intervention_count: 0,
  };
  const interventionDecision = selectInterventions(interventionCtx);

  // 6. Apply recovery domain constraints
  const recoveryConstraint = applyRecoveryConstraints(recoveryDomains);

  // 7. Apply microcycle constraints
  const microcycleConstraint = applyMicrocycleConstraints(microcycleDecision);

  // 8. Apply priority constraints
  const priorityConstraint = applyPriorityConstraints(priorityDef);

  // 9. Apply intervention constraints
  const interventionConstraint = applyInterventionConstraints(interventionDecision);

  // 10. Build arbitration decision from all engines
  const arbitration = buildArbitrationFromEngines({
    recovery: recoveryDecision,
    microcycle: microcycleDecision,
    priority: {
      daily_priority: dailyPriority,
      definition: priorityDef,
      primary_focus: "",
      technical_focus: [],
      fatigue_focus: "",
      priority_notes: [],
      candidates: [],
      rejected: [],
    },
    intervention: interventionDecision,
    athlete_context: {
      competition_in_days: input.competition_in_days,
      readiness: input.readiness,
      fatigue: input.fatigue,
    },
  });

  // 11. MERGE all constraints into unified context
  // Most restrictive ceiling wins
  const intensity_ceiling = Math.min(
    recoveryConstraint.intensity_ceiling,
    microcycleConstraint.intensity_ceiling,
    priorityConstraint.intensity_ceiling,
  );

  const complexity_tolerance = Math.min(
    recoveryConstraint.complexity_tolerance,
    priorityConstraint.complexity_tolerance,
  );

  const cns_load_ceiling = Math.min(
    recoveryConstraint.cns_load_ceiling,
    microcycleConstraint.cns_load_ceiling,
    priorityConstraint.cns_load_ceiling,
  );

  const restoration_bias = Math.max(
    microcycleConstraint.restoration_bias,
    microcycleDecision.restoration_recommended ? 0.7 : 0,
  );

  const specificity_pressure = Math.max(
    microcycleConstraint.specificity_pressure,
    microcycleDecision.notes?.some((n) => n.includes("competition")) ? 0.8 : 0,
  );

  // Collect all notes
  const notes: string[] = [
    ...recoveryConstraint.notes,
    ...microcycleConstraint.notes,
    ...priorityConstraint.notes,
    ...interventionConstraint.notes,
  ];

  return {
    base_workout: base,
    detected_problems: detected,
    primary_problem: primary,

    recovery_decision: recoveryDecision,
    recovery_domains: recoveryDomains,

    microcycle_decision: microcycleDecision,
    rolling_cns_load: microcycleDecision.microcycle_state.rolling_cns_load,
    rolling_technical_load: microcycleDecision.microcycle_state.rolling_technical_load,
    maladaptation_risk: microcycleDecision.microcycle_state.maladaptation_risk || 0,

    daily_priority: dailyPriority,
    priority_definition: priorityDef,

    intervention_decision: interventionDecision,
    safe_exercises: interventionConstraint.safe_exercises,
    blocked_exercises: interventionConstraint.blocked_exercises,

    intensity_ceiling,
    complexity_tolerance,
    cns_load_ceiling,
    restoration_bias,
    specificity_pressure,
    intervention_bias: interventionConstraint.bias_exercises,
    blocked_ids: new Set(interventionConstraint.blocked_exercises),

    arbitration,

    notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. FINAL COACH CONTEXT: Unified Execution Payload
// ─────────────────────────────────────────────────────────────────────────────

export function buildFinalCoachContext(runtime: RuntimeCoachingContext): FinalCoachContext {
  return {
    base_workout: runtime.base_workout.exercises,
    constraints: {
      intensity_pct: runtime.intensity_ceiling,
      complexity_max: runtime.complexity_tolerance,
      cns_load_ceiling: runtime.cns_load_ceiling,
      blocked_exercises: runtime.blocked_ids,
    },
    biases: {
      restoration_favor: runtime.restoration_bias,
      specificity_favor: runtime.specificity_pressure,
      intervention_exercise_ids: runtime.intervention_bias,
      preferred_families: runtime.priority_definition.preferred_families || [],
    },
    intelligence_summary: {
      recovery_domains: runtime.recovery_domains,
      microcycle_state_risk: runtime.maladaptation_risk,
      daily_priority: runtime.daily_priority,
      intervention_count: runtime.intervention_decision.selected_interventions.length,
    },
    notes: runtime.notes,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. CONSTRAINT APPLICATION TO EXERCISES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply orchestrator constraints to a set of exercises.
 * - Removes blocked exercises
 * - Caps intensity based on constraints
 * - Reduces complexity if needed
 * - Biases toward intervention exercises
 */
export function applyOrchestratorConstraints(
  exercises: ExerciseBlock[],
  context: FinalCoachContext,
): ExerciseBlock[] {
  const {
    constraints: { intensity_pct, complexity_max, blocked_exercises },
    biases: { intervention_exercise_ids },
  } = context;

  return exercises
    .filter((ex) => !blocked_exercises.has(ex.exercise_id))
    .map((ex) => {
      // Apply intensity ceiling
      const cappedIntensity = Math.min(ex.intensity_pct, intensity_pct);

      // Recalculate weight based on capped intensity
      const refMax =
        ex.family === "snatch" ? 100 : ex.family === "clean" || ex.family === "jerk" ? 130 : 120;
      const cappedWeight = Math.round((refMax * cappedIntensity) / 100 / 2.5) * 2.5;

      // If intervention exercise, slightly boost sets for emphasis
      let sets = ex.sets;
      if (intervention_exercise_ids.has(ex.exercise_id)) {
        sets = Math.round(sets * 1.1);
      }

      return {
        ...ex,
        intensity_pct: cappedIntensity,
        weight_kg: cappedWeight,
        sets,
      };
    });
}

/**
 * Score exercises for alignment with daily priority
 * Returns modified exercise sets prioritized by alignment
 */
export function prioritizeByDailyPriority(
  exercises: ExerciseBlock[],
  priorityDef: PriorityDefinition,
): ExerciseBlock[] {
  if (!priorityDef.preferred_families || !priorityDef.preferred_families.length) {
    return exercises;
  }

  const preferredSet = new Set(priorityDef.preferred_families);
  return exercises.sort((a, b) => {
    const aPreferred = preferredSet.has(a.family as any) ? 1 : 0;
    const bPreferred = preferredSet.has(b.family as any) ? 1 : 0;
    return bPreferred - aPreferred;
  });
}

/**
 * Bias exercise selection toward restoration exercises when needed
 */
export function applyRestorationBias(
  exercises: ExerciseBlock[],
  restoration_favor: number,
): ExerciseBlock[] {
  if (restoration_favor <= 0.1) return exercises;

  // Restoration exercises: lower intensity, technical focus
  // Boost their sets when restoration bias is high
  return exercises.map((ex) => {
    // Consider exercises with intensity < 75% as "restoration-friendly"
    const isRestorationFriendly = ex.intensity_pct < 75;
    if (isRestorationFriendly) {
      const boost = Math.round(1 + restoration_favor * 0.3);
      return { ...ex, sets: Math.max(1, ex.sets * boost) };
    }
    return ex;
  });
}

/**
 * Bias exercise selection toward specificity exercises when needed
 */
export function applySpecificityBias(
  exercises: ExerciseBlock[],
  specificity_favor: number,
): ExerciseBlock[] {
  if (specificity_favor <= 0.1) return exercises;

  // Classic lifts (snatch, clean, jerk) are competition-specific
  const specificFamilies = new Set(["snatch", "clean", "jerk"]);
  return exercises.map((ex) => {
    if (specificFamilies.has(ex.family)) {
      const boost = Math.round(1 + specificity_favor * 0.25);
      return { ...ex, sets: Math.max(1, ex.sets * boost) };
    }
    return ex;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. INTEGRATED ORCHESTRATOR PIPELINE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ORCHESTRATOR PIPELINE: Complete runtime coordination
 *
 * This replaces the legacy generateAdaptiveWorkout → coach-pipeline flow.
 * The orchestrator is now the SINGLE AUTHORITATIVE ENTRYPOINT.
 *
 * Flow:
 * 1. Build runtime context from ALL intelligence engines
 * 2. Generate base workout
 * 3. Apply orchestrator constraints (blocking, intensity ceilings, etc.)
 * 4. Apply priority biasing
 * 5. Apply restoration/specificity biases
 * 6. Return unified context for coach-engine
 */
export function orchestrateAndPrepareWorkout(input: OrchestratorInput): {
  final_context: FinalCoachContext;
  constrained_exercises: ExerciseBlock[];
  priority_notes: string[];
} {
  // Build unified intelligence context
  const runtime_context = buildRuntimeCoachingContext(input);
  const final_context = buildFinalCoachContext(runtime_context);

  // Apply constraints to base exercises
  let exercises = applyOrchestratorConstraints(
    final_context.base_workout,
    final_context,
  );

  // Apply priority biasing
  const priorityDef = PRIORITY_DEFINITIONS[final_context.intelligence_summary.daily_priority];
  if (priorityDef) {
    exercises = prioritizeByDailyPriority(exercises, priorityDef);
  }

  // Apply restoration bias
  exercises = applyRestorationBias(exercises, final_context.biases.restoration_favor);

  // Apply specificity bias
  exercises = applySpecificityBias(exercises, final_context.biases.specificity_favor);

  const priority_notes = [
    `Daily priority: ${final_context.intelligence_summary.daily_priority}`,
    `Recovery domains: ${Object.entries(final_context.intelligence_summary.recovery_domains)
      .map(([domain, score]) => `${domain}=${Math.round(score as number)}`)
      .join(", ")}`,
    `Maladaptation risk: ${Math.round(final_context.intelligence_summary.microcycle_state_risk)}`,
    ...final_context.notes,
  ];

  return {
    final_context,
    constrained_exercises: exercises,
    priority_notes,
  };
}
