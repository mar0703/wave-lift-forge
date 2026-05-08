// Exercise Intervention Intelligence Engine (V1)
// ----------------------------------------------------------------------------
// Pure intelligence layer: maps athletic problems, fatigue states, movement
// errors, and adaptation targets to intervention strategies. Understands WHY
// specific exercises solve specific problems and at what cost.
//
// IMPORTANT: This engine does NOT generate workouts. It only evaluates and
// selects intervention candidates. Workout assembly stays in coach-engine /
// training-engine; this layer informs those choices.

import type { MovementPhase } from "./movement-model";

// ---------------------------------------------------------------------------
// 3. Types
// ---------------------------------------------------------------------------

export type InterventionCategory =
  | "timing"
  | "speed"
  | "stability"
  | "strength"
  | "technical_restoration"
  | "coordination"
  | "specificity"
  | "recovery";

export type InterventionStage =
  | "isolated"
  | "integrated"
  | "competition_specific";

export type InterventionPurpose =
  | "correction"
  | "adaptation"
  | "restoration";

export interface ExerciseIntervention {
  exercise_id: string;
  intervention_category: InterventionCategory;
  intervention_stage: InterventionStage;
  intervention_purpose: InterventionPurpose;
  target_problems: string[];
  target_phases: MovementPhase[];
  /** 0–100, how much coordination it disturbs / costs to learn or execute. */
  coordination_cost: number;
  /** 0–100, CNS / neural cost of the intervention. */
  cns_cost: number;
  /** 0–100, how well it transfers to classic competition lifts. */
  technical_transfer: number;
  /** 0–100, raw similarity to competition lift. */
  specificity_score: number;
  /** 0–100, how compatible the intervention is with active recovery needs. */
  recovery_compatibility: number;
  notes?: string[];
}

export type FatigueState =
  | "fresh"
  | "moderate"
  | "high"
  | "collapse";

export type AdaptationTarget =
  | "timing"
  | "speed"
  | "strength"
  | "stability"
  | "technical_restoration"
  | "specificity"
  | "recovery";

export interface InterventionContext {
  problems: string[];                    // e.g. ["weak_clean", "slow_under"]
  movement_errors?: MovementPhase[];     // failing phases
  adaptation_target?: AdaptationTarget;
  fatigue_state: FatigueState;
  competition_in_days?: number;
  /** prior selections (per microcycle) — used to limit correction density */
  recent_intervention_count?: number;
  /** progression hint: how many sessions of isolated work already completed */
  isolated_sessions_completed?: number;
}

export interface InterventionDecision {
  selected_interventions: ExerciseIntervention[];
  rejected_interventions: Array<{
    intervention: ExerciseIntervention;
    reason: string;
  }>;
  intervention_notes: string[];
}

// ---------------------------------------------------------------------------
// 4. Intervention catalog
// ---------------------------------------------------------------------------
// Curated, opinionated mappings derived from real Olympic weightlifting
// coaching practice. Exercise IDs match those used elsewhere in the project
// (training-engine / exercise-db) where possible. Unknown IDs are still safe
// because this engine never executes them — it only ranks and selects.

const CATALOG: ExerciseIntervention[] = [
  // ---------------- timing / speed-under (isolated) ----------------
  {
    exercise_id: "tall_snatch",
    intervention_category: "timing",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["slow_under", "late_turnover", "weak_pull_under"],
    target_phases: ["pull_under", "receive"],
    coordination_cost: 25,
    cns_cost: 20,
    technical_transfer: 70,
    specificity_score: 35,
    recovery_compatibility: 70,
    notes: ["Isolates pull-under speed without heavy load."],
  },
  {
    exercise_id: "tall_clean",
    intervention_category: "timing",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["slow_under_clean", "late_turnover_clean"],
    target_phases: ["pull_under", "receive"],
    coordination_cost: 25,
    cns_cost: 20,
    technical_transfer: 65,
    specificity_score: 35,
    recovery_compatibility: 70,
  },
  {
    exercise_id: "high_hang_snatch",
    intervention_category: "speed",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["weak_extension", "slow_second_pull", "early_arm_bend"],
    target_phases: ["extension"],
    coordination_cost: 30,
    cns_cost: 35,
    technical_transfer: 75,
    specificity_score: 50,
    recovery_compatibility: 60,
  },
  {
    exercise_id: "drop_snatch",
    intervention_category: "speed",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["slow_under", "weak_receive_snatch"],
    target_phases: ["pull_under", "receive"],
    coordination_cost: 30,
    cns_cost: 25,
    technical_transfer: 65,
    specificity_score: 30,
    recovery_compatibility: 65,
  },

  // ---------------- segmented / pause (isolated correction) ----------------
  {
    exercise_id: "segmented_snatch",
    intervention_category: "timing",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["bar_path", "early_extension", "weak_first_pull"],
    target_phases: ["first_pull", "transition"],
    coordination_cost: 35,
    cns_cost: 40,
    technical_transfer: 70,
    specificity_score: 55,
    recovery_compatibility: 55,
  },
  {
    exercise_id: "segmented_clean",
    intervention_category: "timing",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["bar_path_clean", "weak_first_pull_clean"],
    target_phases: ["first_pull", "transition"],
    coordination_cost: 35,
    cns_cost: 45,
    technical_transfer: 70,
    specificity_score: 55,
    recovery_compatibility: 50,
  },
  {
    exercise_id: "pause_snatch",
    intervention_category: "stability",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["bar_path", "early_extension"],
    target_phases: ["first_pull", "transition"],
    coordination_cost: 30,
    cns_cost: 40,
    technical_transfer: 70,
    specificity_score: 60,
    recovery_compatibility: 55,
  },
  {
    exercise_id: "pause_clean",
    intervention_category: "stability",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["bar_path_clean", "early_extension_clean"],
    target_phases: ["first_pull", "transition"],
    coordination_cost: 30,
    cns_cost: 45,
    technical_transfer: 70,
    specificity_score: 60,
    recovery_compatibility: 50,
  },

  // ---------------- receiving stability (isolated) ----------------
  {
    exercise_id: "snatch_balance",
    intervention_category: "stability",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["weak_receive_snatch", "overhead_instability"],
    target_phases: ["receive", "recovery"],
    coordination_cost: 35,
    cns_cost: 40,
    technical_transfer: 70,
    specificity_score: 50,
    recovery_compatibility: 60,
  },
  {
    exercise_id: "pause_overhead_squat",
    intervention_category: "stability",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["overhead_instability", "weak_receive_snatch"],
    target_phases: ["receive", "recovery"],
    coordination_cost: 25,
    cns_cost: 30,
    technical_transfer: 60,
    specificity_score: 40,
    recovery_compatibility: 70,
  },
  {
    exercise_id: "pause_jerk_dip",
    intervention_category: "stability",
    intervention_stage: "isolated",
    intervention_purpose: "correction",
    target_problems: ["unstable_dip", "forward_dip"],
    target_phases: ["dip", "drive"],
    coordination_cost: 20,
    cns_cost: 25,
    technical_transfer: 65,
    specificity_score: 50,
    recovery_compatibility: 75,
  },

  // ---------------- integrated stage ----------------
  {
    exercise_id: "hang_snatch",
    intervention_category: "speed",
    intervention_stage: "integrated",
    intervention_purpose: "correction",
    target_problems: ["weak_extension", "slow_second_pull"],
    target_phases: ["extension", "pull_under"],
    coordination_cost: 40,
    cns_cost: 55,
    technical_transfer: 85,
    specificity_score: 75,
    recovery_compatibility: 50,
  },
  {
    exercise_id: "hang_clean",
    intervention_category: "speed",
    intervention_stage: "integrated",
    intervention_purpose: "correction",
    target_problems: ["weak_extension_clean", "slow_second_pull_clean"],
    target_phases: ["extension", "pull_under"],
    coordination_cost: 40,
    cns_cost: 60,
    technical_transfer: 85,
    specificity_score: 75,
    recovery_compatibility: 45,
  },
  {
    exercise_id: "power_snatch",
    intervention_category: "speed",
    intervention_stage: "integrated",
    intervention_purpose: "adaptation",
    target_problems: ["slow_extension", "weak_pull_speed"],
    target_phases: ["extension"],
    coordination_cost: 45,
    cns_cost: 60,
    technical_transfer: 80,
    specificity_score: 80,
    recovery_compatibility: 45,
  },
  {
    exercise_id: "power_clean",
    intervention_category: "speed",
    intervention_stage: "integrated",
    intervention_purpose: "adaptation",
    target_problems: ["slow_extension_clean", "weak_pull_speed_clean"],
    target_phases: ["extension"],
    coordination_cost: 45,
    cns_cost: 65,
    technical_transfer: 80,
    specificity_score: 80,
    recovery_compatibility: 40,
  },
  {
    exercise_id: "power_jerk",
    intervention_category: "stability",
    intervention_stage: "integrated",
    intervention_purpose: "correction",
    target_problems: ["weak_drive", "split_timing"],
    target_phases: ["drive", "receive"],
    coordination_cost: 35,
    cns_cost: 55,
    technical_transfer: 75,
    specificity_score: 75,
    recovery_compatibility: 50,
  },

  // ---------------- strength / pulls (adaptation, high cost) ----------------
  {
    exercise_id: "snatch_pull",
    intervention_category: "strength",
    intervention_stage: "isolated",
    intervention_purpose: "adaptation",
    target_problems: ["weak_pull", "weak_extension"],
    target_phases: ["first_pull", "extension"],
    coordination_cost: 25,
    cns_cost: 75,
    technical_transfer: 55,
    specificity_score: 60,
    recovery_compatibility: 30,
    notes: ["High force adaptation; do not use when technical restoration is the goal."],
  },
  {
    exercise_id: "clean_pull",
    intervention_category: "strength",
    intervention_stage: "isolated",
    intervention_purpose: "adaptation",
    target_problems: ["weak_pull_clean", "weak_extension_clean"],
    target_phases: ["first_pull", "extension"],
    coordination_cost: 25,
    cns_cost: 80,
    technical_transfer: 55,
    specificity_score: 60,
    recovery_compatibility: 25,
  },
  {
    exercise_id: "front_squat",
    intervention_category: "strength",
    intervention_stage: "isolated",
    intervention_purpose: "adaptation",
    target_problems: ["weak_legs", "weak_recovery_clean"],
    target_phases: ["recovery"],
    coordination_cost: 15,
    cns_cost: 70,
    technical_transfer: 65,
    specificity_score: 55,
    recovery_compatibility: 35,
  },
  {
    exercise_id: "back_squat",
    intervention_category: "strength",
    intervention_stage: "isolated",
    intervention_purpose: "adaptation",
    target_problems: ["weak_legs"],
    target_phases: ["recovery"],
    coordination_cost: 10,
    cns_cost: 75,
    technical_transfer: 50,
    specificity_score: 40,
    recovery_compatibility: 30,
  },

  // ---------------- competition specific ----------------
  {
    exercise_id: "snatch",
    intervention_category: "specificity",
    intervention_stage: "competition_specific",
    intervention_purpose: "adaptation",
    target_problems: ["specificity_decay"],
    target_phases: ["first_pull", "extension", "pull_under", "receive", "recovery"],
    coordination_cost: 60,
    cns_cost: 80,
    technical_transfer: 100,
    specificity_score: 100,
    recovery_compatibility: 25,
  },
  {
    exercise_id: "clean_and_jerk",
    intervention_category: "specificity",
    intervention_stage: "competition_specific",
    intervention_purpose: "adaptation",
    target_problems: ["specificity_decay"],
    target_phases: ["first_pull", "extension", "pull_under", "receive", "recovery", "dip", "drive"],
    coordination_cost: 65,
    cns_cost: 90,
    technical_transfer: 100,
    specificity_score: 100,
    recovery_compatibility: 20,
  },

  // ---------------- restoration ----------------
  {
    exercise_id: "muscle_snatch",
    intervention_category: "technical_restoration",
    intervention_stage: "isolated",
    intervention_purpose: "restoration",
    target_problems: ["technical_degradation", "early_arm_bend"],
    target_phases: ["extension", "pull_under"],
    coordination_cost: 20,
    cns_cost: 25,
    technical_transfer: 55,
    specificity_score: 35,
    recovery_compatibility: 80,
  },
  {
    exercise_id: "snatch_technique_complex",
    intervention_category: "technical_restoration",
    intervention_stage: "isolated",
    intervention_purpose: "restoration",
    target_problems: ["technical_degradation", "rhythm_loss"],
    target_phases: ["transition", "extension", "pull_under"],
    coordination_cost: 25,
    cns_cost: 20,
    technical_transfer: 60,
    specificity_score: 40,
    recovery_compatibility: 85,
  },
  {
    exercise_id: "overhead_squat",
    intervention_category: "recovery",
    intervention_stage: "isolated",
    intervention_purpose: "restoration",
    target_problems: ["overhead_instability"],
    target_phases: ["receive", "recovery"],
    coordination_cost: 15,
    cns_cost: 20,
    technical_transfer: 50,
    specificity_score: 35,
    recovery_compatibility: 90,
  },
];

// ---------------------------------------------------------------------------
// 8. Fatigue interaction
// ---------------------------------------------------------------------------

const MAX_CNS_BY_FATIGUE: Record<FatigueState, number> = {
  fresh: 100,
  moderate: 75,
  high: 50,
  collapse: 30,
};

const MAX_COORD_BY_FATIGUE: Record<FatigueState, number> = {
  fresh: 100,
  moderate: 70,
  high: 45,
  collapse: 25,
};

// Adaptation target → preferred categories.
const TARGET_TO_CATEGORY: Record<AdaptationTarget, InterventionCategory[]> = {
  timing: ["timing", "speed"],
  speed: ["speed", "timing"],
  strength: ["strength", "specificity"],
  stability: ["stability", "technical_restoration"],
  technical_restoration: ["technical_restoration", "stability", "recovery"],
  specificity: ["specificity", "speed"],
  recovery: ["recovery", "technical_restoration"],
};

// ---------------------------------------------------------------------------
// 6. Stage progression
// ---------------------------------------------------------------------------

function preferredStage(ctx: InterventionContext): InterventionStage {
  if (ctx.competition_in_days !== undefined && ctx.competition_in_days <= 14) {
    return "competition_specific";
  }
  const completed = ctx.isolated_sessions_completed ?? 0;
  if (completed < 3) return "isolated";
  if (completed < 8) return "integrated";
  return "competition_specific";
}

function stageScore(stage: InterventionStage, preferred: InterventionStage): number {
  if (stage === preferred) return 1;
  // adjacency bonus
  const order: InterventionStage[] = ["isolated", "integrated", "competition_specific"];
  const dist = Math.abs(order.indexOf(stage) - order.indexOf(preferred));
  return dist === 1 ? 0.6 : 0.25;
}

// ---------------------------------------------------------------------------
// 5+9. Scoring
// ---------------------------------------------------------------------------

function scoreIntervention(
  iv: ExerciseIntervention,
  ctx: InterventionContext,
  preferred: InterventionStage,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // problem match
  const matched = iv.target_problems.filter((p) => ctx.problems.includes(p));
  if (matched.length) {
    score += 30 + matched.length * 10;
    reasons.push(`solves: ${matched.join(", ")}`);
  }

  // phase match
  if (ctx.movement_errors?.length) {
    const phaseMatch = iv.target_phases.filter((p) => ctx.movement_errors!.includes(p));
    if (phaseMatch.length) {
      score += phaseMatch.length * 8;
      reasons.push(`covers phase: ${phaseMatch.join(", ")}`);
    }
  }

  // adaptation target alignment
  if (ctx.adaptation_target) {
    const cats = TARGET_TO_CATEGORY[ctx.adaptation_target];
    if (cats.includes(iv.intervention_category)) {
      score += 15;
      reasons.push(`aligns with target: ${ctx.adaptation_target}`);
    }
  }

  // transfer + specificity rewards
  score += iv.technical_transfer * 0.25;

  // competition proximity bias toward specificity
  if (ctx.competition_in_days !== undefined && ctx.competition_in_days <= 14) {
    score += iv.specificity_score * 0.3;
    if (iv.intervention_purpose === "adaptation" && iv.cns_cost > 70) {
      score -= 20;
      reasons.push("penalty: high-cost adaptation near competition");
    }
  }

  // cost penalties
  score -= iv.coordination_cost * 0.2;
  score -= iv.cns_cost * 0.15;

  // fatigue-state bias
  if (ctx.fatigue_state === "high" || ctx.fatigue_state === "collapse") {
    score += iv.recovery_compatibility * 0.3;
  }

  // stage preference
  score *= stageScore(iv.intervention_stage, preferred);

  return { score, reasons };
}

// ---------------------------------------------------------------------------
// 10. Safety filter
// ---------------------------------------------------------------------------

function rejectionReason(
  iv: ExerciseIntervention,
  ctx: InterventionContext,
): string | null {
  const cnsCap = MAX_CNS_BY_FATIGUE[ctx.fatigue_state];
  const coordCap = MAX_COORD_BY_FATIGUE[ctx.fatigue_state];

  if (iv.cns_cost > cnsCap) {
    return `CNS cost ${iv.cns_cost} exceeds cap ${cnsCap} for fatigue=${ctx.fatigue_state}`;
  }
  if (iv.coordination_cost > coordCap) {
    return `coordination cost ${iv.coordination_cost} exceeds cap ${coordCap} for fatigue=${ctx.fatigue_state}`;
  }
  if (
    ctx.adaptation_target === "technical_restoration" &&
    iv.intervention_purpose === "adaptation" &&
    iv.cns_cost > 60
  ) {
    return "adaptation conflicts with technical restoration goal";
  }
  if (
    ctx.competition_in_days !== undefined &&
    ctx.competition_in_days <= 7 &&
    iv.intervention_category === "strength" &&
    iv.cns_cost > 60
  ) {
    return "heavy strength work too close to competition";
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function selectInterventions(
  ctx: InterventionContext,
  options: { max?: number } = {},
): InterventionDecision {
  const max = options.max ?? clampDensity(ctx);
  const preferred = preferredStage(ctx);
  const notes: string[] = [
    `preferred stage: ${preferred}`,
    `fatigue state: ${ctx.fatigue_state}`,
  ];

  const selected: ExerciseIntervention[] = [];
  const rejected: InterventionDecision["rejected_interventions"] = [];

  // 1. safety filter first
  const survivors: Array<{ iv: ExerciseIntervention; score: number; reasons: string[] }> = [];
  for (const iv of CATALOG) {
    const reject = rejectionReason(iv, ctx);
    if (reject) {
      rejected.push({ intervention: iv, reason: reject });
      continue;
    }
    const { score, reasons } = scoreIntervention(iv, ctx, preferred);
    if (score <= 0) continue;
    survivors.push({ iv, score, reasons });
  }

  // 2. rank by score; prefer simpler interventions on ties
  survivors.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (
      a.iv.coordination_cost + a.iv.cns_cost -
      (b.iv.coordination_cost + b.iv.cns_cost)
    );
  });

  // 3. enforce category diversity (no more than 2 per category)
  const perCategory = new Map<InterventionCategory, number>();
  for (const { iv, reasons } of survivors) {
    if (selected.length >= max) break;
    const used = perCategory.get(iv.intervention_category) ?? 0;
    if (used >= 2) {
      rejected.push({ intervention: iv, reason: "category density limit reached" });
      continue;
    }
    perCategory.set(iv.intervention_category, used + 1);
    if (reasons.length) notes.push(`${iv.exercise_id}: ${reasons.join("; ")}`);
    selected.push(iv);
  }

  if (selected.length === 0) {
    notes.push("no interventions matched — defaulting to restoration recommendation");
  }

  return {
    selected_interventions: selected,
    rejected_interventions: rejected,
    intervention_notes: notes,
  };
}

/** Caps total intervention density based on fatigue and recent volume. */
function clampDensity(ctx: InterventionContext): number {
  const recent = ctx.recent_intervention_count ?? 0;
  const base =
    ctx.fatigue_state === "fresh"
      ? 4
      : ctx.fatigue_state === "moderate"
        ? 3
        : ctx.fatigue_state === "high"
          ? 2
          : 1;
  return Math.max(1, base - Math.floor(recent / 4));
}

/** Helper: list catalog entries for a given problem. Useful for diagnostics. */
export function findInterventionsForProblem(problem: string): ExerciseIntervention[] {
  return CATALOG.filter((iv) => iv.target_problems.includes(problem));
}

/** Helper: expose the catalog for external inspection (read-only intent). */
export function getInterventionCatalog(): ReadonlyArray<ExerciseIntervention> {
  return CATALOG;
}
