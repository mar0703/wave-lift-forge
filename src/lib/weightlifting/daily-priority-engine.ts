// ─────────────────────────────────────────────────────────────────────────────
// Daily Training Priority Engine
//
// Pure decision intelligence layer. Decides WHAT adaptation matters most today
// before the workout is built. Does NOT generate workouts, does NOT mutate
// state, does NOT depend on UI. Consumed by coach-engine in a later step.
// ─────────────────────────────────────────────────────────────────────────────

import type { MovementPhase } from "./movement-model";
import type {
  ExerciseFamily,
  ExerciseRole,
} from "../exercise-db";

// ────────────────────────────────────────────────────────────
// 1. PRIORITY TYPES
// ────────────────────────────────────────────────────────────

export type DailyPriority =
  | "snatch_speed"
  | "snatch_technique"
  | "snatch_strength"
  | "clean_technique"
  | "clean_strength"
  | "jerk_technique"
  | "jerk_strength"
  | "speed_under"
  | "receive_stability"
  | "pull_strength"
  | "squat_strength"
  | "competition_specific"
  | "recovery"
  | "technical_restoration";

export type TrainingPhase =
  | "accumulation"
  | "intensification"
  | "realization"
  | "peak"
  | "deload";

export type ProblemTrend = "improving" | "stable" | "worsening" | "new";

// ────────────────────────────────────────────────────────────
// 2. PRIORITY MODEL
// ────────────────────────────────────────────────────────────

export interface PriorityDefinition {
  id: DailyPriority;
  primary_focus: string;
  secondary_focus?: string;
  target_phases: MovementPhase[];
  preferred_families: ExerciseFamily[];
  preferred_roles: ExerciseRole[];
  preferred_intensity_range: { min: number; max: number };
  preferred_complexity_range: { min: number; max: number };
  /** Maximum cumulative CNS load allowed in a session targeting this priority (0–100). */
  max_cns_load: number;
  max_correctives: number;
  /** 0–1 weights — how much each axis matters when ranking exercises. */
  technical_bias: number;
  strength_bias: number;
  specificity_bias: number;
  notes: string[];
}

// ────────────────────────────────────────────────────────────
// 3. PRIORITY DATABASE
// ────────────────────────────────────────────────────────────

export const PRIORITY_DEFINITIONS: Record<DailyPriority, PriorityDefinition> = {
  snatch_speed: {
    id: "snatch_speed",
    primary_focus: "Bar speed and pull-under velocity in the snatch",
    secondary_focus: "Extension timing",
    target_phases: ["extension", "pull_under", "transition"],
    preferred_families: ["snatch"],
    preferred_roles: ["main", "technical"],
    preferred_intensity_range: { min: 70, max: 85 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 70,
    max_correctives: 1,
    technical_bias: 0.5,
    strength_bias: 0.2,
    specificity_bias: 0.7,
    notes: [
      "Bias toward power snatch, hang snatch high, tall snatch.",
      "Keep volume low, intent maximal.",
    ],
  },
  snatch_technique: {
    id: "snatch_technique",
    primary_focus: "Snatch positions, trajectory, and timing",
    target_phases: ["first_pull", "transition", "extension", "receive"],
    preferred_families: ["snatch"],
    preferred_roles: ["technical", "corrective", "main"],
    preferred_intensity_range: { min: 60, max: 78 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 60,
    max_correctives: 2,
    technical_bias: 0.9,
    strength_bias: 0.2,
    specificity_bias: 0.5,
    notes: ["Slow, deliberate work. Pauses, segments, positional drills."],
  },
  snatch_strength: {
    id: "snatch_strength",
    primary_focus: "Snatch overload and pull strength",
    target_phases: ["first_pull", "extension"],
    preferred_families: ["snatch", "pull"],
    preferred_roles: ["main", "overload"],
    preferred_intensity_range: { min: 80, max: 95 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 85,
    max_correctives: 1,
    technical_bias: 0.3,
    strength_bias: 0.8,
    specificity_bias: 0.6,
    notes: ["Snatch pulls, deficit snatch pulls, heavy classic snatch."],
  },
  clean_technique: {
    id: "clean_technique",
    primary_focus: "Clean positions, transition, and rack",
    target_phases: ["first_pull", "transition", "extension", "receive"],
    preferred_families: ["clean"],
    preferred_roles: ["technical", "corrective", "main"],
    preferred_intensity_range: { min: 60, max: 78 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 60,
    max_correctives: 2,
    technical_bias: 0.9,
    strength_bias: 0.3,
    specificity_bias: 0.5,
    notes: ["Hang clean, pause clean, tall clean."],
  },
  clean_strength: {
    id: "clean_strength",
    primary_focus: "Clean overload and pull strength",
    target_phases: ["first_pull", "extension"],
    preferred_families: ["clean", "pull", "squat"],
    preferred_roles: ["main", "overload"],
    preferred_intensity_range: { min: 80, max: 95 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 85,
    max_correctives: 1,
    technical_bias: 0.3,
    strength_bias: 0.85,
    specificity_bias: 0.6,
    notes: ["Heavy clean, clean pulls, front squat support."],
  },
  jerk_technique: {
    id: "jerk_technique",
    primary_focus: "Jerk dip, drive, split, lockout",
    target_phases: ["dip", "drive", "split", "lockout"],
    preferred_families: ["jerk"],
    preferred_roles: ["technical", "main", "corrective"],
    preferred_intensity_range: { min: 60, max: 80 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 65,
    max_correctives: 2,
    technical_bias: 0.85,
    strength_bias: 0.3,
    specificity_bias: 0.6,
    notes: [
      "Bias jerk, push jerk, split jerk, jerk balance, jerk dip.",
      "Front squat as overhead-support strength.",
    ],
  },
  jerk_strength: {
    id: "jerk_strength",
    primary_focus: "Overhead lockout and drive strength",
    target_phases: ["drive", "lockout"],
    preferred_families: ["jerk", "squat"],
    preferred_roles: ["main", "overload"],
    preferred_intensity_range: { min: 80, max: 95 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 80,
    max_correctives: 1,
    technical_bias: 0.3,
    strength_bias: 0.8,
    specificity_bias: 0.6,
    notes: ["Push press, jerk behind neck, heavy front squat."],
  },
  speed_under: {
    id: "speed_under",
    primary_focus: "Pull-under speed and turnover",
    target_phases: ["pull_under", "receive"],
    preferred_families: ["snatch", "clean"],
    preferred_roles: ["technical", "main"],
    preferred_intensity_range: { min: 60, max: 80 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 65,
    max_correctives: 2,
    technical_bias: 0.7,
    strength_bias: 0.2,
    specificity_bias: 0.6,
    notes: ["Tall snatch, drop snatch, tall clean, high-hang variants."],
  },
  receive_stability: {
    id: "receive_stability",
    primary_focus: "Bottom-position stability and fixation",
    target_phases: ["receive", "lockout"],
    preferred_families: ["snatch", "clean", "jerk", "squat"],
    preferred_roles: ["technical", "corrective", "accessory"],
    preferred_intensity_range: { min: 55, max: 80 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 60,
    max_correctives: 2,
    technical_bias: 0.7,
    strength_bias: 0.4,
    specificity_bias: 0.5,
    notes: ["OHS, snatch balance, pause squats, jerk recovery holds."],
  },
  pull_strength: {
    id: "pull_strength",
    primary_focus: "Posterior chain and pulling strength",
    target_phases: ["first_pull", "extension"],
    preferred_families: ["pull"],
    preferred_roles: ["overload", "main"],
    preferred_intensity_range: { min: 80, max: 110 },
    preferred_complexity_range: { min: 1, max: 3 },
    max_cns_load: 80,
    max_correctives: 1,
    technical_bias: 0.2,
    strength_bias: 0.9,
    specificity_bias: 0.5,
    notes: ["Snatch pulls, clean pulls, deficit pulls, RDL."],
  },
  squat_strength: {
    id: "squat_strength",
    primary_focus: "Leg strength base",
    target_phases: ["recovery", "receive"],
    preferred_families: ["squat"],
    preferred_roles: ["overload", "main"],
    preferred_intensity_range: { min: 80, max: 100 },
    preferred_complexity_range: { min: 1, max: 3 },
    max_cns_load: 80,
    max_correctives: 1,
    technical_bias: 0.2,
    strength_bias: 0.95,
    specificity_bias: 0.4,
    notes: ["Back squat, front squat, pause squat."],
  },
  competition_specific: {
    id: "competition_specific",
    primary_focus: "Classic lifts under competition conditions",
    target_phases: ["extension", "receive", "lockout"],
    preferred_families: ["snatch", "clean", "jerk"],
    preferred_roles: ["main"],
    preferred_intensity_range: { min: 85, max: 100 },
    preferred_complexity_range: { min: 3, max: 4 },
    max_cns_load: 85,
    max_correctives: 0,
    technical_bias: 0.3,
    strength_bias: 0.4,
    specificity_bias: 1.0,
    notes: [
      "Classic snatch and C&J only.",
      "Minimal correction noise. High specificity.",
    ],
  },
  recovery: {
    id: "recovery",
    primary_focus: "CNS recovery and movement quality",
    target_phases: ["recovery", "start"],
    preferred_families: ["general", "squat"],
    preferred_roles: ["accessory", "technical"],
    preferred_intensity_range: { min: 40, max: 65 },
    preferred_complexity_range: { min: 1, max: 2 },
    max_cns_load: 35,
    max_correctives: 2,
    technical_bias: 0.5,
    strength_bias: 0.2,
    specificity_bias: 0.2,
    notes: ["Low complexity. Positional drills. Mobility, light technique."],
  },
  technical_restoration: {
    id: "technical_restoration",
    primary_focus: "Re-grooving positions after fatigue or breakdown",
    target_phases: ["start", "first_pull", "transition", "receive"],
    preferred_families: ["snatch", "clean", "jerk"],
    preferred_roles: ["technical", "corrective"],
    preferred_intensity_range: { min: 50, max: 70 },
    preferred_complexity_range: { min: 2, max: 3 },
    max_cns_load: 45,
    max_correctives: 3,
    technical_bias: 1.0,
    strength_bias: 0.1,
    specificity_bias: 0.4,
    notes: ["Slow segmented work. Positional drills. No max effort."],
  },
};

// ────────────────────────────────────────────────────────────
// 4. CONTEXT + DECISION TYPES
// ────────────────────────────────────────────────────────────

export interface PriorityProblemSignal {
  problem: string;
  phase?: MovementPhase;
  severity: number;          // 0–10
  trend: ProblemTrend;
  recurrence?: number;
}

export interface PreviousSession {
  day_index?: number;
  priority?: DailyPriority;
  families?: ExerciseFamily[];
  cns_load?: number;         // 0–100
  heavy_pull?: boolean;
  heavy_squat?: boolean;
  heavy_overhead?: boolean;
  date?: string;
}

export interface DailyPriorityContext {
  readiness: number;         // 0–100
  fatigue: number;           // 0–100
  technical_fatigue?: number;// 0–100
  overhead_fatigue?: number; // 0–100
  training_phase: TrainingPhase;
  competition_in_days?: number;
  problems: PriorityProblemSignal[];
  previous_sessions: PreviousSession[];
  /** Optional weekly distribution counts so far. */
  weekly_counts?: Partial<Record<DailyPriority, number>>;
  /** Optional explicit override from the coach. */
  override?: DailyPriority;

  // ── Strategic bias inputs (scoring only — not direct selection) ──
  /**
   * Weekly structure suggestion for this day. Biases candidate scoring
   * upward but does NOT directly select the tactical priority — the engine
   * remains free to pick another candidate when athlete state demands it.
   */
  weekly_planned_priority?: DailyPriority;
  /** Microcycle soft bias — these priorities receive a scoring boost. */
  biased_priorities?: DailyPriority[];
  /**
   * Microcycle hard safety — these priorities are excluded from the
   * candidate pool. Used for blocked-priority safety logic.
   */
  blocked_priorities?: DailyPriority[];
  /** Microcycle recovery safety: strongly bias recovery and suppress high CNS. */
  recovery_recommended?: boolean;
  /** Microcycle restoration safety: bias technical restoration. */
  restoration_recommended?: boolean;
}

export interface PriorityCandidate {
  id: DailyPriority;
  score: number;
  reasons: string[];
  penalties: string[];
}

export interface DailyPriorityDecision {
  daily_priority: DailyPriority;
  definition: PriorityDefinition;
  primary_focus: string;
  technical_focus: string[];
  fatigue_focus: string;
  priority_notes: string[];
  candidates: PriorityCandidate[];
  rejected: PriorityCandidate[];
}

// ────────────────────────────────────────────────────────────
// 5. PRIORITY SELECTION LOGIC
// ────────────────────────────────────────────────────────────

const ALL_PRIORITIES: DailyPriority[] = Object.keys(
  PRIORITY_DEFINITIONS,
) as DailyPriority[];

/** Map a movement phase to the priorities that target it. */
function prioritiesForPhase(phase: MovementPhase): DailyPriority[] {
  return ALL_PRIORITIES.filter((p) =>
    PRIORITY_DEFINITIONS[p].target_phases.includes(phase),
  );
}

/** Yesterday's session, if any. */
function lastSession(ctx: DailyPriorityContext): PreviousSession | undefined {
  return ctx.previous_sessions[ctx.previous_sessions.length - 1];
}

/** How many of the last N sessions used this priority. */
function recentCount(
  ctx: DailyPriorityContext,
  id: DailyPriority,
  window = 3,
): number {
  return ctx.previous_sessions
    .slice(-window)
    .filter((s) => s.priority === id).length;
}

function familyRecentlyHammered(
  ctx: DailyPriorityContext,
  family: ExerciseFamily,
  window = 2,
): boolean {
  return ctx.previous_sessions
    .slice(-window)
    .some((s) => s.families?.includes(family));
}

function scoreCandidate(
  id: DailyPriority,
  ctx: DailyPriorityContext,
): PriorityCandidate {
  const def = PRIORITY_DEFINITIONS[id];
  const reasons: string[] = [];
  const penalties: string[] = [];
  let score = 0;

  // ── (a) Problem-driven boosts ────────────────────────────────
  for (const p of ctx.problems) {
    const sevWeight =
      p.trend === "worsening" ? 1.5 : p.trend === "new" ? 1.2 : 1.0;
    const phaseHit =
      p.phase && def.target_phases.includes(p.phase) ? p.severity * sevWeight : 0;
    if (phaseHit > 0) {
      score += phaseHit;
      reasons.push(
        `phase ${p.phase} matches problem ${p.problem} (sev ${p.severity}, ${p.trend})`,
      );
    }
  }

  // ── (b) Hard heuristics ──────────────────────────────────────
  // Fatigue / readiness
  if (ctx.fatigue >= 85 && (id === "recovery" || id === "technical_restoration")) {
    score += 12;
    reasons.push("high fatigue → recovery / restoration biased");
  }
  if (ctx.readiness <= 35 && id === "recovery") {
    score += 8;
    reasons.push("low readiness → recovery");
  }
  if (
    (ctx.technical_fatigue ?? 0) >= 70 &&
    id === "technical_restoration"
  ) {
    score += 8;
    reasons.push("high technical fatigue → restoration");
  }
  if (
    (ctx.overhead_fatigue ?? 0) >= 70 &&
    (id === "jerk_technique" || id === "jerk_strength")
  ) {
    penalties.push("overhead fatigue elevated");
    score -= 6;
  }

  // Competition proximity
  if (ctx.competition_in_days != null) {
    if (ctx.competition_in_days <= 7 && id === "competition_specific") {
      score += 15;
      reasons.push("competition within 7 days");
    }
    if (ctx.competition_in_days <= 3 && id !== "competition_specific" &&
        id !== "recovery") {
      score -= 6;
      penalties.push("too close to meet for non-specific work");
    }
  }

  // Training phase bias
  switch (ctx.training_phase) {
    case "accumulation":
      if (
        id === "snatch_technique" ||
        id === "clean_technique" ||
        id === "jerk_technique" ||
        id === "pull_strength" ||
        id === "squat_strength"
      )
        score += 3;
      break;
    case "intensification":
      if (
        id === "snatch_strength" ||
        id === "clean_strength" ||
        id === "jerk_strength" ||
        id === "speed_under"
      )
        score += 3;
      break;
    case "realization":
    case "peak":
      if (id === "competition_specific") score += 6;
      if (id === "snatch_speed") score += 2;
      break;
    case "deload":
      if (id === "recovery" || id === "technical_restoration") score += 6;
      if (
        id === "snatch_strength" ||
        id === "clean_strength" ||
        id === "jerk_strength" ||
        id === "pull_strength" ||
        id === "squat_strength"
      )
        score -= 8;
      break;
  }

  // ── (c) Yesterday-aware penalties ────────────────────────────
  const last = lastSession(ctx);
  if (last) {
    if (last.heavy_squat && id === "squat_strength") {
      score -= 8;
      penalties.push("heavy squat yesterday");
    }
    if (last.heavy_pull && id === "pull_strength") {
      score -= 8;
      penalties.push("heavy pulls yesterday");
    }
    if (last.heavy_overhead && (id === "jerk_strength" || id === "jerk_technique")) {
      score -= 4;
      penalties.push("overhead stress yesterday");
    }
    if (last.priority === id) {
      score -= 4;
      penalties.push("same priority as yesterday");
    }
    if ((last.cns_load ?? 0) >= 80 && def.max_cns_load >= 75) {
      score -= 6;
      penalties.push("CNS already loaded, avoid back-to-back high CNS");
    }
  }

  // ── (d) Weekly balancing ─────────────────────────────────────
  const weekN = ctx.weekly_counts?.[id] ?? 0;
  if (weekN >= 2) {
    score -= 3 * (weekN - 1);
    penalties.push(`already used ${weekN}x this week`);
  }
  const recent = recentCount(ctx, id, 3);
  if (recent >= 2) {
    score -= 4;
    penalties.push("repeated in last 3 sessions");
  }

  // ── (e) Family-overuse penalty ───────────────────────────────
  for (const fam of def.preferred_families) {
    if (familyRecentlyHammered(ctx, fam, 2) && id !== "recovery") {
      score -= 1.5;
    }
  }

  // ── (f) Mild baseline so under-served priorities surface ─────
  score += 1;

  // ── (g) Weekly structure bias (scoring only) ─────────────────
  // Weekly plan informs the score but never overrides athlete state.
  if (ctx.weekly_planned_priority === id) {
    score += 6;
    reasons.push("aligned with weekly structure plan");
  }

  // ── (h) Microcycle soft bias ─────────────────────────────────
  if (ctx.biased_priorities?.includes(id)) {
    score += 4;
    reasons.push("microcycle directional bias");
  }

  // ── (i) Recovery / restoration safety bias ───────────────────
  if (ctx.recovery_recommended) {
    if (id === "recovery") {
      score += 14;
      reasons.push("microcycle recovery recommended");
    } else if (def.max_cns_load >= 75) {
      score -= 8;
      penalties.push("recovery recommended — suppress high CNS work");
    }
  }
  if (ctx.restoration_recommended) {
    if (id === "technical_restoration") {
      score += 10;
      reasons.push("microcycle restoration recommended");
    } else if (id === "recovery") {
      score += 4;
    }
  }

  return { id, score, reasons, penalties };
}

export function selectDailyPriority(
  ctx: DailyPriorityContext,
): DailyPriorityDecision {
  // Coach override short-circuits everything except the candidate report.
  // Deterministic stabilization: secondary comparator by priority id for equal scores.
  const candidates = ALL_PRIORITIES.map((id) => scoreCandidate(id, ctx)).sort(
    (a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      // Stable tie-breaker: lexical order by id (deterministic, semantically neutral)
      return a.id.localeCompare(b.id);
    },
  );

  // Hard safety: blocked priorities are removed from the candidate pool.
  const blockedSet = new Set(ctx.blocked_priorities ?? []);

  let chosen: DailyPriority;
  const overrideNote: string[] = [];
  if (ctx.override && PRIORITY_DEFINITIONS[ctx.override]) {
    chosen = ctx.override;
    overrideNote.push(`coach override → ${ctx.override}`);
  } else {
    const allowed = candidates.filter((c) => !blockedSet.has(c.id));
    if (allowed.length > 0) {
      chosen = allowed[0].id;
    } else {
      // Everything blocked — fall back to the safest non-blocked priority.
      chosen = blockedSet.has("recovery") ? "technical_restoration" : "recovery";
    }
  }

  const def = PRIORITY_DEFINITIONS[chosen];
  const technical_focus: string[] = def.target_phases.map((p) => String(p));

  // Fatigue framing
  let fatigue_focus = "balanced";
  if (ctx.fatigue >= 85) fatigue_focus = "recovery";
  else if (ctx.fatigue >= 70) fatigue_focus = "low CNS";
  else if (def.max_cns_load >= 80) fatigue_focus = "high CNS allowed";
  else if (def.max_cns_load <= 50) fatigue_focus = "CNS-light";

  const top = candidates.find((c) => c.id === chosen);
  const priority_notes = [
    ...overrideNote,
    ...def.notes,
    ...(top?.reasons.slice(0, 4) ?? []),
  ];

  return {
    daily_priority: chosen,
    definition: def,
    primary_focus: def.primary_focus,
    technical_focus,
    fatigue_focus,
    priority_notes,
    candidates: candidates.slice(0, 5),
    rejected: candidates.slice(5),
  };
}

// ────────────────────────────────────────────────────────────
// 6. HELPERS — exposed for downstream modules
// ────────────────────────────────────────────────────────────

export function getPriorityDefinition(id: DailyPriority): PriorityDefinition {
  return PRIORITY_DEFINITIONS[id];
}

export function getPrioritiesForPhase(phase: MovementPhase): DailyPriority[] {
  return prioritiesForPhase(phase);
}

/** True if a priority is acceptable given current CNS / readiness. */
export function isPriorityFeasible(
  id: DailyPriority,
  ctx: DailyPriorityContext,
): boolean {
  const def = PRIORITY_DEFINITIONS[id];
  if (ctx.fatigue >= 90 && def.max_cns_load >= 70) return false;
  if (ctx.readiness <= 25 && def.preferred_intensity_range.min >= 80) return false;
  return true;
}

/**
 * Lightweight workout-shape hints derived from a chosen priority.
 * Consumers (coach-engine in a later step) decide how to apply them.
 */
export interface PriorityWorkoutHints {
  intensity_clamp: { min: number; max: number };
  complexity_clamp: { min: number; max: number };
  max_cns_load: number;
  max_correctives: number;
  preferred_families: ExerciseFamily[];
  preferred_roles: ExerciseRole[];
  target_phases: MovementPhase[];
  bias: { technical: number; strength: number; specificity: number };
}

export function getPriorityHints(id: DailyPriority): PriorityWorkoutHints {
  const def = PRIORITY_DEFINITIONS[id];
  return {
    intensity_clamp: def.preferred_intensity_range,
    complexity_clamp: def.preferred_complexity_range,
    max_cns_load: def.max_cns_load,
    max_correctives: def.max_correctives,
    preferred_families: def.preferred_families,
    preferred_roles: def.preferred_roles,
    target_phases: def.target_phases,
    bias: {
      technical: def.technical_bias,
      strength: def.strength_bias,
      specificity: def.specificity_bias,
    },
  };
}
