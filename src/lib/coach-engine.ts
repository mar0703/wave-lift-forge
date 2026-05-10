// Deterministic modular coaching engine for Olympic weightlifting.
// Pipeline: Periodization → Strength → Technique → Psychology → Competition
// Each module returns an Adjustment. Adjustments are applied sequentially
// by `applyAdjustment` — global → by_family → by_exercise → absolute overrides.

import type { ExerciseBlock, WorkoutOutput } from "./training-engine";
import { buildBlock } from "./training-engine";
import { getExerciseById } from "./exercise-db";
import {
  detectProblems,
  getProblemsFromExercise,
  PROBLEM_PHASE_MAP,
  type ExerciseResult,
} from "./diagnostics";
import {
  decideCorrection,
  type CorrectionContext,
  type CorrectionDecision,
  type TrainingPhase as CETrainingPhase,
} from "./weightlifting/correction-engine";
import {
  interventionArbiter,
  type InterventionDecision as InterventionArbiterDecision,
} from "./weightlifting/intervention-arbiter";

// ─────────────────── 1. Central state ───────────────────
export interface AthleteState {
  readiness: number; // 0-10
  fatigue: number; // 0-100
  success_rate: number; // 0-100
  average_RPE: number; // 0-10
  exercise_results: ExerciseResult[];
  user_maxes: Record<string, number>;
  correction_state: Record<string, number>;
  training_day_index: number; // 1-5
  competition_mode: boolean;

  // Optional governance context for deciding whether correction is appropriate.
  competition_in_days?: number;
  training_age_months?: number;
  athlete_level?: "novice" | "intermediate" | "advanced" | "elite";
  success_consistency?: number;
  session_context?: {
    set_to_set_degradation?: boolean;
    load_dependent_degradation?: boolean;
    heavy_microcycle_accumulation?: boolean;
    stable_competition_performance?: boolean;
    movement_pattern_established?: boolean;
    established_movement_signature?: boolean;
    psychological_instability?: boolean;
    post_injury_return?: boolean;
    high_cognitive_load_required?: boolean;
    expected_benefit?: "low" | "moderate" | "high";
  };
}

export type ExerciseFamily = "snatch" | "clean" | "pull" | "squat";

// ─────────────────── 3. Adjustment shape ───────────────────
export interface Adjustment {
  global?: {
    intensity_multiplier?: number;
    volume_multiplier?: number;
    set_intensity_pct?: number; // absolute override
  };
  by_family?: Partial<Record<ExerciseFamily, {
    intensity_multiplier?: number;
    volume_multiplier?: number;
  }>>;
  by_exercise?: Record<string, {
    sets?: number;
    intensity_pct?: number;
    replace_with?: string;
  }>;
  add_exercises?: { id: string; role: "main" | "corrective" | "accessory" }[];
  remove_exercises?: string[];
  notes?: string[];
  module?: string;
}

// ─────────────────── 7. Safety clamps ───────────────────
const clampIntensity = (p: number) => Math.min(100, Math.max(60, p));
const clampVolumeMul = (m: number) => Math.min(1.5, Math.max(0.7, m));
const round25 = (kg: number) => Math.round(kg / 2.5) * 2.5;
const round25pct = (p: number) => Math.round(p / 2.5) * 2.5;

// ─────────────────── 6.5 Apply engine ───────────────────
export function applyAdjustment(
  exercises: ExerciseBlock[],
  adj: Adjustment,
  state: AthleteState,
  removed: Set<string>,
): { exercises: ExerciseBlock[]; added: string[] } {
  const gIM = adj.global?.intensity_multiplier ?? 1;
  const gVM = clampVolumeMul(adj.global?.volume_multiplier ?? 1);
  const absI = adj.global?.set_intensity_pct;

  let next: ExerciseBlock[] = exercises.map((ex) => {
    if (removed.has(ex.exercise_id)) return ex;

    let intensityPct = ex.intensity_pct * gIM;
    let sets = ex.sets * gVM;

    const fam = adj.by_family?.[ex.family as ExerciseFamily];
    if (fam) {
      if (fam.intensity_multiplier) intensityPct *= fam.intensity_multiplier;
      if (fam.volume_multiplier) sets *= clampVolumeMul(fam.volume_multiplier);
    }

    const byEx = adj.by_exercise?.[ex.exercise_id];
    if (byEx) {
      if (byEx.sets !== undefined) sets = byEx.sets;
      if (byEx.intensity_pct !== undefined) intensityPct = byEx.intensity_pct;
      if (byEx.replace_with) {
        const replacement = getExerciseById(byEx.replace_with);
        if (replacement) {
          const refMax =
            replacement.family === "snatch"
              ? state.user_maxes.snatch || 100
              : state.user_maxes.clean_jerk || state.user_maxes.clean || 130;
          const block = buildBlock(replacement.id, refMax, intensityPct / 100);
          if (block) return block;
        }
      }
    }

    if (absI !== undefined) intensityPct = absI;

    intensityPct = clampIntensity(intensityPct);
    intensityPct = round25pct(intensityPct);
    sets = Math.max(1, Math.round(sets));

    const refMax =
      ex.family === "snatch"
        ? state.user_maxes.snatch || ex.weight_kg / (ex.intensity_pct / 100)
        : ex.family === "clean" || ex.family === "jerk"
          ? state.user_maxes.clean_jerk || state.user_maxes.clean || 130
          : ex.weight_kg / (ex.intensity_pct / 100);

    return {
      ...ex,
      sets,
      intensity_pct: intensityPct,
      weight_kg: round25(refMax * (intensityPct / 100)),
    };
  });

  if (adj.remove_exercises?.length) {
    const rem = new Set(adj.remove_exercises);
    next = next.filter((e) => !rem.has(e.exercise_id));
  }

  const added: string[] = [];
  if (adj.add_exercises?.length) {
    const present = new Set(next.map((e) => e.exercise_id));
    for (const a of adj.add_exercises) {
      if (present.has(a.id)) continue;
      const def = getExerciseById(a.id);
      if (!def) continue;
      const refMax =
        def.family === "snatch"
          ? state.user_maxes.snatch || 100
          : state.user_maxes.clean_jerk || state.user_maxes.clean || 130;
      const baseI = absI !== undefined ? absI / 100 : 0.7;
      const block = buildBlock(a.id, refMax * 0.85, clampIntensity(baseI * 100) / 100);
      if (block) {
        next.push(block);
        added.push(def.name_en);
        present.add(a.id);
      }
    }
  }

  return { exercises: next, added };
}

// ─────────────────── 4. Modules ───────────────────
type Phase = "accumulation" | "intensification" | "peak";
function phaseFor(day: number): Phase {
  if (day <= 2) return "accumulation";
  if (day <= 4) return "intensification";
  return "peak";
}

export function periodizationModule(s: AthleteState): Adjustment {
  const phase = phaseFor(s.training_day_index);
  if (phase === "accumulation")
    return {
      module: "Periodization",
      global: { intensity_multiplier: 0.95, volume_multiplier: 1.15 },
      notes: [`Phase: accumulation (day ${s.training_day_index})`],
    };
  if (phase === "intensification")
    return {
      module: "Periodization",
      global: { intensity_multiplier: 1.0, volume_multiplier: 1.0 },
      notes: [`Phase: intensification (day ${s.training_day_index})`],
    };
  return {
    module: "Periodization",
    global: { intensity_multiplier: 1.05, volume_multiplier: 0.85 },
    notes: [`Phase: peak (day ${s.training_day_index})`],
  };
}

export function strengthModule(s: AthleteState): Adjustment {
  const adj: Adjustment = { module: "Strength", by_family: {}, notes: [] };
  const fs = s.user_maxes.front_squat;
  const cl = s.user_maxes.clean || s.user_maxes.clean_jerk * 0.8;
  const cp = s.user_maxes.clean_pull;
  if (fs && cl && fs / cl < 1.25) {
    adj.by_family!.squat = { volume_multiplier: 1.2 };
    adj.notes!.push("Front squat / clean ratio low → squat volume +20%");
  }
  if (cp && cl && cp / cl < 1.05) {
    adj.by_family!.pull = { volume_multiplier: 1.2 };
    adj.notes!.push("Clean pull / clean ratio low → pull volume +20%");
  }
  return adj;
}

function trainingPhaseFor(s: AthleteState): CETrainingPhase {
  if (s.competition_mode) return "peak";
  const p = phaseFor(s.training_day_index);
  return p as CETrainingPhase;
}

export function techniqueModule(
  s: AthleteState,
  detected: string[],
): Adjustment & {
  decision?: CorrectionDecision;
  arbiter_decision?: InterventionArbiterDecision;
  primary?: string;
  correctives: string[];
} {
  const adj: Adjustment & {
    decision?: CorrectionDecision;
    arbiter_decision?: InterventionArbiterDecision;
    primary?: string;
    correctives: string[];
  } = {
    module: "Technique",
    correctives: [],
    notes: [],
  };

  const activeProblems = new Set<string>(detected);
  const exerciseResultsMap: Record<string, { success_rate: number; avg_rpe: number }> = {};
  for (const r of s.exercise_results) {
    exerciseResultsMap[r.exercise_id] = { success_rate: r.success_rate, avg_rpe: r.avg_rpe };
    const related = getProblemsFromExercise(r.exercise_id);
    if (r.success_rate < 80 || r.avg_rpe > 8) related.forEach((p) => activeProblems.add(p));
  }

  if (!activeProblems.size) return adj;

  const arbiterDecision = interventionArbiter({
    readiness: s.readiness,
    fatigue: s.fatigue,
    detected_problems: [...activeProblems],
    success_rate: s.success_rate,
    success_consistency: s.success_consistency,
    competition_in_days: s.competition_in_days,
    training_age_months: s.training_age_months,
    athlete_level: s.athlete_level,
    session_context: s.session_context,
  });
  adj.arbiter_decision = arbiterDecision;
  adj.notes!.push(
    `Intervention arbiter: ${arbiterDecision.intervention_mode} ` +
      `(risk=${arbiterDecision.intervention_risk}, scope=${arbiterDecision.intervention_scope})`,
  );
  adj.notes!.push(...arbiterDecision.reasons);
  if (arbiterDecision.warnings?.length) adj.notes!.push(...arbiterDecision.warnings);
  if (arbiterDecision.recommendations?.length) adj.notes!.push(...arbiterDecision.recommendations);

  if (!arbiterDecision.intervention_allowed) {
    if (arbiterDecision.intervention_scope === "recovery_only") {
      adj.global = { intensity_multiplier: 0.85, volume_multiplier: 0.75 };
    }
    return adj;
  }

  const ctx: CorrectionContext = {
    problems: [...activeProblems],
    correction_state: s.correction_state,
    exercise_results: exerciseResultsMap,
    readiness: s.readiness,
    fatigue: s.fatigue,
    training_phase: trainingPhaseFor(s),
  };

  const decision = decideCorrection(ctx);
  adj.decision = decision;
  adj.primary = decision.primary_problem || undefined;

  const ids = decision.selected_correctives
    .map((c) => c.exercise_id)
    .filter((id) => !!getExerciseById(id))
    .slice(0, arbiterDecision.intervention_scope === "minimal" ? 1 : 2);
  adj.correctives = ids;
  adj.add_exercises = ids.map((id) => ({ id, role: "corrective" }));

  // Trend / stage-aware intensity cap
  let cap = 75;
  if (decision.trend === "worsening") cap = 70;
  else if (decision.correction_stage === "integration") cap = 80;
  else if (decision.correction_stage === "automation") cap = 85;
  if (arbiterDecision.intervention_scope === "minimal") cap = Math.min(cap, 70);
  adj.global = { set_intensity_pct: cap };

  adj.notes!.push(
    `Technique focus: ${decision.primary_problem || "general"}${decision.root_cause ? ` (root: ${decision.root_cause})` : ""} → cap @ ${cap}%, inject ${ids.length} corrective(s)`,
  );
  if (decision.correction_strategy.length) adj.notes!.push(...decision.correction_strategy);
  return adj;
}

export function psychologyModule(s: AthleteState): Adjustment {
  const adj: Adjustment = { module: "Psychology", notes: [] };
  if (s.fatigue > 80) {
    adj.global = { intensity_multiplier: 0.9, volume_multiplier: 0.85 };
    adj.notes!.push("Fatigue > 80 → −10% intensity, −15% volume");
    return adj;
  }
  if (s.average_RPE > 9) {
    adj.global = { intensity_multiplier: 0.93 };
    adj.notes!.push("avg RPE > 9 → −7% intensity");
    return adj;
  }
  if (s.success_rate < 60) {
    adj.global = { intensity_multiplier: 0.92 };
    adj.notes!.push("Success < 60% → −8% intensity");
    return adj;
  }
  if (s.fatigue < 30 && s.success_rate > 90 && s.average_RPE < 7) {
    adj.global = { intensity_multiplier: 1.05 };
    adj.notes!.push("Stable & fresh → +5% intensity");
  }
  return adj;
}

export function competitionModule(s: AthleteState): Adjustment | null {
  if (!s.competition_mode) return null;
  return {
    module: "Competition",
    remove_exercises: [],
    add_exercises: [
      { id: "snatch", role: "main" },
      { id: "clean_and_jerk", role: "main" },
    ],
    by_exercise: {
      snatch: { sets: 3, intensity_pct: 95 },
      clean_and_jerk: { sets: 3, intensity_pct: 95 },
    },
    global: { set_intensity_pct: 95 },
    notes: [
      "Competition override active",
      "Attempt 1: 90% (opener)",
      "Attempt 2: 95% (qualifier)",
      "Attempt 3: 100%+ (PR)",
    ],
  };
}

// ─────────────────── 6.6 Validation & normalization ───────────────────
const CLASSIC_FALLBACKS = ["snatch", "clean_and_jerk", "clean"];
const SQUAT_PULL_FALLBACKS = ["back_squat", "front_squat", "snatch_pull", "clean_pull"];

function normalize(
  exercises: ExerciseBlock[],
  base: WorkoutOutput,
  state: AthleteState,
): { exercises: ExerciseBlock[]; notes: string[] } {
  const notes: string[] = [];
  const seen = new Set<string>();
  let next = exercises.filter((e) => {
    if (!getExerciseById(e.exercise_id)) return false;
    if (seen.has(e.exercise_id)) return false;
    seen.add(e.exercise_id);
    return true;
  });

  const hasClassic = next.some((e) => e.family === "snatch" || e.family === "clean");
  if (!hasClassic) {
    const fb =
      base.exercises.find((e) => e.family === "snatch" || e.family === "clean") ||
      CLASSIC_FALLBACKS.map((id) =>
        buildBlock(id, state.user_maxes.snatch || 100, 0.75),
      ).find(Boolean);
    if (fb) {
      next.unshift(fb);
      notes.push("Inserted classic lift to satisfy structure");
    }
  }

  const hasSP = next.some((e) => e.family === "squat" || e.family === "pull");
  if (!hasSP) {
    const fb =
      base.exercises.find((e) => e.family === "squat" || e.family === "pull") ||
      SQUAT_PULL_FALLBACKS.map((id) =>
        buildBlock(id, state.user_maxes.back_squat || 150, 0.7),
      ).find(Boolean);
    if (fb) {
      next.push(fb);
      notes.push("Inserted squat/pull to satisfy structure");
    }
  }

  if (next.length > 7) {
    next.sort((a, b) => priorityOf(a) - priorityOf(b));
    next = next.slice(0, 7);
    notes.push("Capped at 7 exercises (dropped lowest priority)");
  }

  if (next.length < 3) {
    for (const e of base.exercises) {
      if (next.length >= 3) break;
      if (!next.some((x) => x.exercise_id === e.exercise_id)) next.push(e);
    }
    notes.push("Padded to minimum 3 exercises");
  }

  return { exercises: next, notes };
}

function priorityOf(e: ExerciseBlock): number {
  if (e.family === "snatch" || e.family === "clean") return 100;
  if (e.family === "squat" || e.family === "pull") return 80;
  if (e.family === "jerk") return 70;
  return 10;
}

// ─────────────────── 5. Pipeline ───────────────────

export interface CoachOutput {
  workout: WorkoutOutput;
  adjustments_applied: string[];
  detected_problems: string[];
  focus_area: string;
  primary_problem?: string;
  root_cause?: string;
  correction_stage?: string;
  correction_strategy?: string[];
  selected_correctives?: string[];
  trend?: string;
  intervention_arbiter?: InterventionArbiterDecision;
  injected_exercises: string[];
  notes: string[];
}

export function runCoachPipeline(base: WorkoutOutput, state: AthleteState): CoachOutput {
  const detected = detectProblems(state.user_maxes);
  const applied: string[] = [];
  const allNotes: string[] = [...base.notes];
  const removed = new Set<string>();
  let exercises: ExerciseBlock[] = [...base.exercises];
  const injected: string[] = [];
  let primary: string | undefined;

  const periodization = periodizationModule(state);
  const strength = strengthModule(state);
  const psych = psychologyModule(state);
  const technique = techniqueModule(state, detected);
  const comp = competitionModule(state);

  // §9 Order: periodization → fatigue/readiness (psych+strength) → correction → competition
  const sequence: Adjustment[] = [periodization, strength, psych, technique];
  if (comp) sequence.push(comp);

  for (const adj of sequence) {
    if (!adj) continue;
    const { exercises: out, added } = applyAdjustment(exercises, adj, state, removed);
    exercises = out;
    if (added.length) injected.push(...added);
    if (adj.notes?.length) allNotes.push(...adj.notes);
    applied.push(adj.module || "module");
  }
  primary = technique.primary;
  const decision = technique.decision;

  const norm = normalize(exercises, base, state);
  exercises = norm.exercises;
  allNotes.push(...norm.notes);

  // §15 Failure protection — fallback to baseWorkout if structure invalid.
  const hasClassic = exercises.some((e) => e.family === "snatch" || e.family === "clean");
  const onlyCorrective = exercises.length > 0 && exercises.every((e) => {
    const def = getExerciseById(e.exercise_id);
    return def?.type === "technique";
  });
  if (!exercises.length || !hasClassic || onlyCorrective) {
    exercises = base.exercises.map((ex) => ({
      ...ex,
      intensity_pct: round25pct(clampIntensity(ex.intensity_pct)),
    }));
    allNotes.push("⚠ Fallback to base workout (failure protection)");
  }

  // §14 focus_area MUST never be undefined.
  const phase = phaseFor(state.training_day_index);
  const focus_area: string =
    primary ||
    (state.competition_mode ? "competition" : phase) ||
    "general development";

  return {
    workout: { ...base, exercises, notes: allNotes },
    adjustments_applied: applied,
    detected_problems: detected,
    focus_area,
    primary_problem: primary,
    root_cause: decision?.root_cause,
    correction_stage: decision?.correction_stage,
    correction_strategy: decision?.correction_strategy,
    selected_correctives: decision?.selected_correctives.map((c) => c.exercise_id),
    trend: decision?.trend,
    intervention_arbiter: technique.arbiter_decision,
    injected_exercises: injected,
    notes: allNotes,
  };
}

export { PROBLEM_PHASE_MAP };
