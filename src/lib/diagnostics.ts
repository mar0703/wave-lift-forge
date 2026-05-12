// Diagnostics + corrective selection.
// Source of truth for problem → phase → corrective mappings is now
// `weightlifting/movement-model.ts`. This file keeps the public API
// (detectProblems, selectCorrectives, getPrimaryProblem, …) used by
// the coach pipeline so we don't have to rewrite engine-store yet.

import { EXERCISE_DB, getExerciseById, type ExerciseDef } from "./exercise-db";
import {
  PROBLEM_PHASE,
  PROBLEM_POSITION,
  PHASE_CORRECTIVES,
  ROOT_CAUSE_MAP,
} from "./ontology";
import {
  getPhaseFromProblem,
  getCorrectivesForPhase,
  type MovementPhase,
} from "./weightlifting/movement-model";

export interface ExerciseResult {
  exercise_id: string;
  success_rate: number; // 0..100
  avg_rpe: number;      // 0..10
}

export function getProblemsFromExercise(exId: string): string[] {
  const ex = getExerciseById(exId);
  return ex?.fixes || [];
}

// ─────────────────── Strength ratios ───────────────────

export const RATIOS = {
  clean_vs_jerk: {
    normal_min: 0.95,
    normal_max: 1.05,
    issue_low: "weak_clean",
    issue_high: "weak_jerk",
  },
  front_squat_vs_clean: {
    normal_min: 1.25,
    normal_max: 1.45,
    issue_low: "weak_legs",
  },
  clean_pull_vs_clean: {
    normal_min: 1.05,
    normal_max: 1.2,
    issue_low: "weak_pull",
  },
} as const;

// ─────────────────── Problem metadata ───────────────────

// Re-exports so callers that previously imported from diagnostics keep working.
export { PROBLEM_PHASE, PROBLEM_POSITION };

// Back-compat alias — coach-engine re-exports this name publicly.
export const PROBLEM_PHASE_MAP = PROBLEM_PHASE;

export const PROBLEM_PRIORITY: Record<string, number> = {
  early_arm_bend: 3,
  no_extension: 3,
  bar_drift: 2,
  slow_pull_under: 2,
  weak_legs: 3,
  poor_position: 2,
  unstable_receive: 3,
  soft_lockout: 2,
};

// `ROOT_CAUSE_MAP` lives in `./ontology` and is imported above. Likely root
// causes per problem — a problem is NOT automatically a root cause; these
// are *candidate* causes the engine should consider before committing to a
// correction strategy.

// ─────────────────── Trend tracking ───────────────────

export type Trend = "improving" | "stable" | "worsening";

// Compares latest vs previous correction_state value to estimate trend.
// `history` is an array of correction_state snapshots, newest first.
export function getProblemTrend(
  problem: string,
  history: Record<string, number>[],
): Trend {
  if (history.length < 2) return "stable";
  const latest = history[0]?.[problem] ?? 0;
  const prev = history[1]?.[problem] ?? 0;
  const delta = latest - prev;
  if (delta > 0.5) return "worsening";
  if (delta < -0.5) return "improving";
  return "stable";
}

// ─────────────────── Strength-ratio diagnostics ───────────────────

export function detectProblems(maxes: Record<string, number>): string[] {
  const problems: string[] = [];

  const clean = maxes.clean ?? maxes.clean_jerk * 0.8;
  const jerk = maxes.jerk ?? maxes.clean_jerk;
  const frontSquat = maxes.front_squat;
  const cleanPull = maxes.clean_pull;

  if (clean && jerk) {
    const r = clean / jerk;
    if (r < RATIOS.clean_vs_jerk.normal_min) problems.push(RATIOS.clean_vs_jerk.issue_low);
    else if (r > RATIOS.clean_vs_jerk.normal_max) problems.push(RATIOS.clean_vs_jerk.issue_high);
  }
  if (frontSquat && clean) {
    const r = frontSquat / clean;
    if (r < RATIOS.front_squat_vs_clean.normal_min) {
      problems.push(RATIOS.front_squat_vs_clean.issue_low);
    }
  }
  if (cleanPull && clean) {
    const r = cleanPull / clean;
    if (r < RATIOS.clean_pull_vs_clean.normal_min) {
      problems.push(RATIOS.clean_pull_vs_clean.issue_low);
    }
  }
  return [...new Set(problems)];
}

// ─────────────────── Exercise property helpers ───────────────────
// EXERCISE_DB doesn't store fatigue_cost / fatigue_type /
// technical_complexity yet — derive them from existing fields so we can
// migrate without a destructive schema change.

export type FatigueType = "cns" | "metabolic" | "structural" | "low";

export function technicalComplexity(ex: ExerciseDef): number {
  // 1..5 — directly the existing difficulty rating.
  return ex.difficulty;
}

export function fatigueType(ex: ExerciseDef): FatigueType {
  if (ex.type === "main" || ex.type === "power") return "cns";
  if (ex.family === "squat" || ex.family === "pull") return "structural";
  if (ex.type === "accessory") return "metabolic";
  return "low";
}

export function fatigueCost(ex: ExerciseDef): number {
  // 1..10 rough estimate from difficulty + family weight.
  const base = ex.difficulty * 1.5;
  const heavy = ex.family === "squat" || ex.family === "pull" ? 1.5 : 0;
  const cns = ex.type === "main" || ex.type === "power" ? 1 : 0;
  return Math.min(10, Math.round(base + heavy + cns));
}

// ─────────────────── Corrective filtering ───────────────────

export function filterCorrectivesByReadiness(
  ids: string[],
  readiness: number,
): string[] {
  return ids.filter((id) => {
    const ex = getExerciseById(id);
    if (!ex) return false;
    const tc = technicalComplexity(ex);
    if (readiness < 4 && tc >= 4) return false;       // avoid high-complexity drills
    if (tc > readiness + 2) return false;              // strict guardrail
    return true;
  });
}

export function filterCorrectivesByFatigue(
  ids: string[],
  fatigue: number,
): string[] {
  return ids.filter((id) => {
    const ex = getExerciseById(id);
    if (!ex) return false;
    if (fatigue > 80 && fatigueType(ex) === "cns") return false;
    if (fatigue > 90 && fatigueCost(ex) >= 7) return false;
    return true;
  });
}

export function getSafeCorrectives(
  ids: string[],
  readiness: number,
  fatigue: number,
): string[] {
  const known = ids.filter((id) => !!getExerciseById(id));
  const byReadiness = filterCorrectivesByReadiness(known, readiness);
  const byFatigue = filterCorrectivesByFatigue(byReadiness, fatigue);
  // dedupe + cap
  return [...new Set(byFatigue)].slice(0, 2);
}

// ─────────────────── Phase-based corrective selection ───────────────────

// Fallback correctives by family for problems whose phase has no entry
// in PHASE_CORRECTIVES or whose canonical IDs aren't in EXERCISE_DB yet.
const FAMILY_FALLBACK: Partial<Record<MovementPhase, string[]>> = {
  extension: ["snatch_pull", "clean_pull", "snatch_high_pull"],
  pull_under: ["tall_snatch", "tall_clean", "muscle_snatch"],
  receive: ["overhead_squat", "snatch_balance", "front_squat"],
  recovery: ["front_squat", "back_squat"],
  first_pull: ["snatch_deadlift", "clean_deadlift"],
  transition: ["snatch_pause_knee", "clean_pause_knee"],
  start: ["snatch_deadlift_pause", "clean_deadlift_pause"],
  dip: ["pause_jerk", "jerk_dip"],
  drive: ["push_press", "jerk_drive"],
  lockout: ["jerk_support", "push_press_behind_neck"],
  split: ["jerk_balance", "jerk_recovery"],
};

function correctivesForProblem(problem: string): string[] {
  const phase = getPhaseFromProblem(problem);
  if (!phase) {
    // legacy fallback — exercise DB matches `fixes`
    return EXERCISE_DB.filter((ex) => ex.fixes?.includes(problem)).map((e) => e.id);
  }
  const phaseIds = getCorrectivesForPhase(phase);
  const known = phaseIds.filter((id) => !!getExerciseById(id));
  if (known.length) return known;
  return FAMILY_FALLBACK[phase] ?? [];
}

// Public selector — takes problems, returns ranked corrective exercise IDs.
// Phase-driven, never regex/string based.
export function selectCorrectives(problems: string[]): string[] {
  const scored: Record<string, number> = {};
  for (const p of problems) {
    const ids = correctivesForProblem(p);
    ids.forEach((id, i) => {
      // earlier in the list = more direct corrective → higher score
      scored[id] = (scored[id] || 0) + (10 - i);
    });
  }
  return Object.entries(scored)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);
}

// ─────────────────── Weighted primary-problem selection ───────────────────
// Considers correction_state (recurrence), severity (PRIORITY), and trend.

export interface PrimaryProblemCtx {
  correction_state: Record<string, number>;
  history?: Record<string, number>[]; // newest first; optional
}

export function getPrimaryProblem(
  problems: string[],
  stateOrCtx: Record<string, number> | PrimaryProblemCtx,
): string | undefined {
  if (!problems.length) return undefined;
  const ctx: PrimaryProblemCtx =
    "correction_state" in stateOrCtx
      ? (stateOrCtx as PrimaryProblemCtx)
      : { correction_state: stateOrCtx as Record<string, number> };

  const scoreFor = (p: string) => {
    const severity = PROBLEM_PRIORITY[p] || 1;
    const recurrence = ctx.correction_state[p] || 0;
    const trend = ctx.history ? getProblemTrend(p, ctx.history) : "stable";
    const trendBonus = trend === "worsening" ? 2 : trend === "improving" ? -1 : 0;
    return severity + recurrence + trendBonus;
  };

  return [...problems].sort((a, b) => scoreFor(b) - scoreFor(a))[0];
}
