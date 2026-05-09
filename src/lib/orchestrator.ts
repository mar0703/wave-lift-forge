// ─────────────────────────────────────────────────────────────────────────────
// Training Orchestrator
//
// Single authoritative runtime coordinator. Evaluates ALL intelligence engines
// (recovery domain, microcycle, daily priority, intervention) and merges their
// outputs into a unified runtime coaching context. That context is then used
// to constrain and bias the base augmented workout BEFORE the coach-pipeline
// applies its periodization/strength/technique refinements.
//
// This module:
//   • does NOT rewrite any engine
//   • does NOT replace the coach-pipeline
//   • does NOT mutate engine state
//   • does NOT render UI
//
// It is pure orchestration: read engine outputs → resolve constraints →
// transform exercises → emit context.
// ─────────────────────────────────────────────────────────────────────────────

import {
  generateAdaptiveWorkout,
  type AugmentInput,
  type AugmentedWorkout,
} from "./adaptive-workout";
import type { ExerciseBlock } from "./training-engine";
import { getExerciseById } from "./exercise-db";
import { detectProblems } from "./diagnostics";

import {
  evaluateRecovery,
  type RecoveryDecision,
  type RecoveryDomains,
} from "./weightlifting/recovery-domain-engine";
import {
  evaluateMicrocycle,
  type MicrocycleDecision,
  type MicrocycleSession,
} from "./weightlifting/microcycle-engine";
import {
  selectDailyPriority,
  getPriorityHints,
  type DailyPriorityDecision,
  type DailyPriorityContext,
  type PreviousSession,
  type PriorityProblemSignal,
} from "./weightlifting/daily-priority-engine";
import {
  selectInterventions,
  type InterventionDecision,
  type FatigueState,
} from "./weightlifting/exercise-intervention-engine";
import type { SessionLog } from "./engine-store";

// ────────────────────────────────────────────────────────────
// Public types
// ────────────────────────────────────────────────────────────

export interface OrchestratorInput {
  engine_input: AugmentInput;
  user_maxes: Record<string, number>;
  correction_state?: Record<string, number>;
  recent_sessions?: SessionLog[];
  competition_in_days?: number;
  /** Optional override priority from coach. */
  priority_override?: DailyPriorityContext["override"];
}

export interface RuntimeConstraints {
  intensity_ceiling: number;        // 0–100 (% 1RM)
  complexity_tolerance: number;     // 0–10
  cns_load_ceiling: number;         // 0–100
  restoration_bias: number;         // 0–1
  specificity_pressure: number;     // 0–1
  intervention_bias: Set<string>;   // exercise IDs to favor
  blocked_ids: Set<string>;         // exercise IDs to drop
  /** preferred families (from daily priority). */
  preferred_families: Set<string>;
  /** notes describing why the constraint was applied. */
  notes: string[];
}

export interface RuntimeCoachingContext {
  recovery: RecoveryDecision;
  microcycle: MicrocycleDecision;
  priority: DailyPriorityDecision;
  intervention: InterventionDecision;
  constraints: RuntimeConstraints;
}

export interface OrchestratorResult {
  final_context: RuntimeCoachingContext;
  base_workout: AugmentedWorkout;
  constrained_exercises: ExerciseBlock[];
  priority_notes: string[];
}

// ────────────────────────────────────────────────────────────
// Helpers — convert legacy state into engine-input shapes
// ────────────────────────────────────────────────────────────

function toFatigueState(f: number): FatigueState {
  if (f >= 85) return "collapse";
  if (f >= 70) return "high";
  if (f >= 45) return "moderate";
  return "fresh";
}

function readinessTo100(r1to10: number): number {
  return Math.max(0, Math.min(100, Math.round(r1to10 * 10)));
}

function sessionLogToMicroSession(log: SessionLog): MicrocycleSession {
  // SessionLog is sparse — we approximate per-domain stress from intensity + RPE.
  const intensity = log.adjusted_intensity; // 0–100
  const rpe = log.average_RPE; // 0–10
  const cns_load = Math.min(100, intensity * 0.7 + rpe * 5);
  const local_load = Math.min(100, intensity * 0.5 + rpe * 4);
  return {
    date: log.date,
    cns_load,
    technical_load: Math.min(100, intensity * 0.4 + rpe * 3),
    local_load,
    overhead_stress: Math.min(100, intensity * 0.4),
    squat_stress: Math.min(100, intensity * 0.5),
    pull_stress: Math.min(100, intensity * 0.5),
    intensity_avg: intensity,
    complexity_avg: 4,
    specificity_score: 60,
    recovery_day: false,
    restoration_day: false,
  };
}

function buildPreviousSessions(logs: SessionLog[]): PreviousSession[] {
  return logs.slice(0, 5).map((l) => ({
    day_index: l.day,
    cns_load: Math.min(100, l.adjusted_intensity * 0.7 + l.average_RPE * 5),
    heavy_pull: l.adjusted_intensity >= 80,
    heavy_squat: l.adjusted_intensity >= 80,
    heavy_overhead: l.adjusted_intensity >= 80,
    date: l.date,
  }));
}

function problemsToSignals(problems: string[]): PriorityProblemSignal[] {
  return problems.map((p) => ({
    problem: p,
    severity: 6,
    trend: "stable",
  }));
}

// ────────────────────────────────────────────────────────────
// Constraint reducers — each engine contributes restrictive caps
// ────────────────────────────────────────────────────────────

function applyRecoveryConstraints(
  rec: RecoveryDecision,
  c: RuntimeConstraints,
): void {
  const d = rec.recovery_domains;
  const degraded = new Set(rec.degraded_domains);
  const protectedSet = new Set(rec.protected_domains);

  const isDegraded = (k: keyof RecoveryDomains) => degraded.has(k) || d[k] <= 45;
  const isProtected = (k: keyof RecoveryDomains) =>
    protectedSet.has(k) || d[k] <= 30;

  // CNS
  if (isProtected("cns")) {
    c.intensity_ceiling = Math.min(c.intensity_ceiling, 75);
    c.cns_load_ceiling = Math.min(c.cns_load_ceiling, 50);
    c.restoration_bias = Math.min(1, c.restoration_bias + 0.4);
    c.notes.push("CNS protected → intensity ≤75%, restoration bias up");
  } else if (isDegraded("cns")) {
    c.intensity_ceiling = Math.min(c.intensity_ceiling, 85);
    c.cns_load_ceiling = Math.min(c.cns_load_ceiling, 65);
    c.restoration_bias = Math.min(1, c.restoration_bias + 0.2);
    c.notes.push("CNS degraded → intensity ≤85%");
  }

  // Technical coordination
  if (isProtected("technical_coordination")) {
    c.complexity_tolerance = Math.min(c.complexity_tolerance, 4);
    c.notes.push("Coordination protected → complexity ≤4");
  } else if (isDegraded("technical_coordination")) {
    c.complexity_tolerance = Math.min(c.complexity_tolerance, 6);
    c.notes.push("Coordination degraded → complexity ≤6");
  }

  // Overhead
  if (isProtected("overhead")) {
    addBlockedFamily(c, "jerk");
    c.notes.push("Overhead protected → block jerk/overhead work");
  } else if (isDegraded("overhead")) {
    c.intensity_ceiling = Math.min(c.intensity_ceiling, 85);
    c.notes.push("Overhead degraded → reduce jerk volume");
  }

  // Speed
  if (isProtected("speed_freshness")) {
    c.restoration_bias = Math.min(1, c.restoration_bias + 0.2);
    c.notes.push("Speed freshness protected → reduce explosive work");
  }

  // Legs
  if (isProtected("legs")) {
    addBlockedFamily(c, "squat");
    c.notes.push("Legs protected → block squat sessions");
  } else if (isDegraded("legs")) {
    c.notes.push("Legs degraded → reduce squat volume");
  }

  // Pull chain
  if (isProtected("pull_chain")) {
    addBlockedFamily(c, "pull");
    c.notes.push("Pull chain protected → block pull sessions");
  } else if (isDegraded("pull_chain")) {
    c.notes.push("Pull chain degraded → reduce pull volume");
  }
}

function applyMicrocycleConstraints(
  m: MicrocycleDecision,
  c: RuntimeConstraints,
  competition_in_days?: number,
): void {
  const s = m.microcycle_state;

  if (s.rolling_cns_load > 300) {
    c.intensity_ceiling = Math.min(c.intensity_ceiling, 80);
    c.restoration_bias = Math.min(1, c.restoration_bias + 0.4);
    c.notes.push("Rolling CNS very high → restoration bias +40%");
  } else if (s.rolling_cns_load > 250) {
    c.intensity_ceiling = Math.min(c.intensity_ceiling, 88);
    c.restoration_bias = Math.min(1, c.restoration_bias + 0.15);
    c.notes.push("Rolling CNS high → restoration bias up");
  }

  const malad = s.maladaptation_risk ?? 0;
  if (malad > 85) {
    c.intensity_ceiling = Math.min(c.intensity_ceiling, 80);
    c.restoration_bias = Math.min(1, c.restoration_bias + 0.35);
    c.notes.push("Critical maladaptation risk → strong restoration bias");
  } else if (malad > 70) {
    c.intensity_ceiling = Math.min(c.intensity_ceiling, 88);
    c.restoration_bias = Math.min(1, c.restoration_bias + 0.2);
    c.notes.push("High maladaptation risk → reduce overload");
  }

  if (s.technical_density > 200) {
    c.complexity_tolerance = Math.min(c.complexity_tolerance, 5);
    c.notes.push("Technical density high → reduce complexity");
  }

  // Competition specificity pressure
  if (
    competition_in_days !== undefined &&
    competition_in_days <= 28 &&
    s.specificity_density < 60
  ) {
    c.specificity_pressure = Math.min(1, c.specificity_pressure + 0.8);
    c.notes.push("Competition near → specificity pressure +80%");
  }
}

function applyPriorityConstraints(
  p: DailyPriorityDecision,
  c: RuntimeConstraints,
): void {
  const hints = getPriorityHints(p.daily_priority);
  c.intensity_ceiling = Math.min(c.intensity_ceiling, hints.intensity_clamp.max);
  c.complexity_tolerance = Math.min(
    c.complexity_tolerance,
    hints.complexity_clamp.max,
  );
  c.cns_load_ceiling = Math.min(c.cns_load_ceiling, hints.max_cns_load);
  for (const f of hints.preferred_families) c.preferred_families.add(f);
  c.specificity_pressure = Math.min(
    1,
    c.specificity_pressure + hints.bias.specificity * 0.5,
  );
  c.notes.push(
    `Priority ${p.daily_priority} → intensity ≤${hints.intensity_clamp.max}%, CNS ≤${hints.max_cns_load}`,
  );
}

function applyInterventionConstraints(
  iv: InterventionDecision,
  c: RuntimeConstraints,
): void {
  for (const sel of iv.selected_interventions) {
    c.intervention_bias.add(sel.exercise_id);
  }
  for (const r of iv.rejected_interventions) {
    // Only block when rejection is safety-driven (CNS/coordination).
    if (
      /cns|coordination|fatigue|competition/i.test(r.reason) &&
      r.intervention.cns_cost > 60
    ) {
      c.blocked_ids.add(r.intervention.exercise_id);
    }
  }
  if (iv.selected_interventions.length) {
    c.notes.push(
      `Interventions biased: ${iv.selected_interventions
        .map((s) => s.exercise_id)
        .join(", ")}`,
    );
  }
}

function addBlockedFamily(c: RuntimeConstraints, family: string): void {
  // Best-effort: blocked at exercise-application time we re-check family.
  c.blocked_ids.add(`__family:${family}`);
}

function isFamilyBlocked(c: RuntimeConstraints, family: string): boolean {
  return c.blocked_ids.has(`__family:${family}`);
}

// ────────────────────────────────────────────────────────────
// Exercise transformation — apply unified constraints
// ────────────────────────────────────────────────────────────

function applyOrchestratorConstraints(
  exercises: ExerciseBlock[],
  c: RuntimeConstraints,
): ExerciseBlock[] {
  const out: ExerciseBlock[] = [];
  for (const ex of exercises) {
    if (c.blocked_ids.has(ex.exercise_id)) continue;
    if (isFamilyBlocked(c, ex.family)) continue;

    let { sets, intensity_pct, weight_kg } = ex;

    // Intensity ceiling
    if (intensity_pct > c.intensity_ceiling) {
      const ratio = c.intensity_ceiling / intensity_pct;
      intensity_pct = Math.round(c.intensity_ceiling);
      weight_kg = Math.round(weight_kg * ratio * 2) / 2;
    }

    // Bias selected interventions: +10% sets
    if (c.intervention_bias.has(ex.exercise_id)) {
      sets = Math.max(sets, Math.round(sets * 1.1));
    }

    // Restoration bias: trim heavy/CNS-costly main work
    if (c.restoration_bias > 0.5 && intensity_pct > 80) {
      sets = Math.max(1, Math.round(sets * 0.85));
    }

    out.push({ ...ex, sets, intensity_pct, weight_kg });
  }
  return out;
}

function prioritizeByDailyPriority(
  exercises: ExerciseBlock[],
  c: RuntimeConstraints,
): ExerciseBlock[] {
  if (c.preferred_families.size === 0) return exercises;
  const main = exercises.filter((e) => c.preferred_families.has(e.family));
  const rest = exercises.filter((e) => !c.preferred_families.has(e.family));
  return [...main, ...rest];
}

// ────────────────────────────────────────────────────────────
// Build runtime coaching context
// ────────────────────────────────────────────────────────────

export function buildRuntimeCoachingContext(
  input: OrchestratorInput,
): RuntimeCoachingContext {
  const { engine_input, user_maxes, recent_sessions = [] } = input;
  const readiness100 = readinessTo100(engine_input.readiness);
  const fatigue100 = engine_input.fatigue_score;
  const fatigueState = toFatigueState(fatigue100);

  const microSessions = recent_sessions.map(sessionLogToMicroSession).reverse();

  // 1. Recovery
  const recovery = evaluateRecovery({
    recent_sessions: microSessions,
    fatigue_state: fatigueState,
    readiness: readiness100,
  });

  // 2. Microcycle
  const microcycle = evaluateMicrocycle({
    recent_sessions: microSessions,
    readiness: readiness100,
    fatigue: fatigue100,
    training_phase:
      input.competition_in_days !== undefined && input.competition_in_days <= 14
        ? "peak"
        : "accumulation",
    competition_in_days: input.competition_in_days,
  });

  // 3. Daily priority
  const detected = detectProblems(user_maxes);
  const priority = selectDailyPriority({
    readiness: readiness100,
    fatigue: fatigue100,
    training_phase:
      input.competition_in_days !== undefined && input.competition_in_days <= 14
        ? "peak"
        : "accumulation",
    competition_in_days: input.competition_in_days,
    problems: problemsToSignals(detected),
    previous_sessions: buildPreviousSessions(recent_sessions),
    override: input.priority_override,
  });

  // 4. Interventions
  const intervention = selectInterventions({
    problems: detected,
    fatigue_state: fatigueState,
    competition_in_days: input.competition_in_days,
    recent_intervention_count: 0,
  });

  // 5. Resolve unified constraints (most-restrictive wins)
  const constraints: RuntimeConstraints = {
    intensity_ceiling: 100,
    complexity_tolerance: 10,
    cns_load_ceiling: 100,
    restoration_bias: 0,
    specificity_pressure: 0,
    intervention_bias: new Set(),
    blocked_ids: new Set(),
    preferred_families: new Set(),
    notes: [],
  };

  applyRecoveryConstraints(recovery, constraints);
  applyMicrocycleConstraints(microcycle, constraints, input.competition_in_days);
  applyPriorityConstraints(priority, constraints);
  applyInterventionConstraints(intervention, constraints);

  // Readiness tail-cap (low readiness = stricter ceiling)
  if (readiness100 <= 30) {
    constraints.intensity_ceiling = Math.min(constraints.intensity_ceiling, 80);
    constraints.notes.push("Low readiness → intensity ≤80%");
  }

  return { recovery, microcycle, priority, intervention, constraints };
}

// ────────────────────────────────────────────────────────────
// Public entrypoint
// ────────────────────────────────────────────────────────────

export function orchestrateAndPrepareWorkout(
  input: OrchestratorInput,
): OrchestratorResult {
  const final_context = buildRuntimeCoachingContext(input);

  const base = generateAdaptiveWorkout({
    ...input.engine_input,
    user_maxes: input.user_maxes,
    correction_state: input.correction_state,
  });

  let constrained = applyOrchestratorConstraints(
    base.exercises,
    final_context.constraints,
  );
  constrained = prioritizeByDailyPriority(constrained, final_context.constraints);

  // Inject any biased intervention exercises that weren't already present.
  const present = new Set(constrained.map((e) => e.exercise_id));
  const intensity = base.adjusted_intensity / 100;
  for (const ivId of final_context.constraints.intervention_bias) {
    if (present.has(ivId)) continue;
    const def = getExerciseById(ivId);
    if (!def) continue;
    const refMax =
      def.family === "snatch"
        ? input.engine_input.daily_snatch_max
        : input.engine_input.daily_clean_jerk_max;
    // Light injection — 3 sets at conservative %.
    const pct = Math.min(
      final_context.constraints.intensity_ceiling,
      Math.round(70 * intensity * 100) / 100,
    );
    const block: ExerciseBlock = {
      exercise_id: def.id,
      name_en: def.name_en,
      family: def.family,
      group: (def.group as ExerciseBlock["group"]) ?? "Special",
      sets: 3,
      reps: 3,
      intensity_pct: pct,
      weight_kg: Math.round(refMax * (pct / 100) * 2) / 2,
    };
    constrained.push(block);
  }

  const priority_notes = [
    `Daily priority: ${final_context.priority.daily_priority} — ${final_context.priority.primary_focus}`,
    ...final_context.constraints.notes,
    ...final_context.priority.priority_notes.slice(0, 3),
    ...final_context.recovery.recovery_notes.slice(0, 3),
  ];

  return {
    final_context,
    base_workout: base,
    constrained_exercises: constrained,
    priority_notes,
  };
}
