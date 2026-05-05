// Strength-ratio diagnostics. Pure data → problem ids.
// No string matching on exercise names — works on user max ids.

import { EXERCISE_DB } from "./exercise-db";

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

// Problem id → corrective exercise ids (must exist in EXERCISE_DB).
export const PROBLEM_MAP: Record<string, string[]> = {
  weak_clean: ["clean_pull", "hang_clean", "clean_from_deficit"],
  weak_jerk: ["jerk_rack", "push_press"],
  weak_legs: ["front_squat", "back_squat"],
  weak_pull: ["snatch_pull", "clean_pull"],
};

// Severity weight per problem — higher = more urgent to fix.
export const PROBLEM_PRIORITY: Record<string, number> = {
  early_arm_bend: 3,
  no_extension: 3,
  bar_drift: 2,
  slow_pull_under: 2,
  weak_legs: 3,
  poor_position: 2,
};

// Pick the most urgent problem given priority + accumulated session count.
export function getPrimaryProblem(
  problems: string[],
  state: Record<string, number>,
): string | undefined {
  if (!problems.length) return undefined;
  return [...problems].sort((a, b) => {
    const pa = PROBLEM_PRIORITY[a] || 1;
    const pb = PROBLEM_PRIORITY[b] || 1;
    const sa = state[a] || 0;
    const sb = state[b] || 0;
    return pb + sb - (pa + sa);
  })[0];
}

// Problem id → primary technical phase the problem belongs to.
export const PROBLEM_PHASE_MAP: Record<string, "pull" | "transition" | "receive" | "recovery"> = {
  early_arm_bend: "pull",
  no_extension: "transition",
  bar_drift: "pull",
  slow_pull_under: "receive",
  weak_legs: "recovery",
  poor_position: "pull",
};

export function detectProblems(maxes: Record<string, number>): string[] {
  const problems: string[] = [];

  const clean = maxes.clean ?? maxes.clean_jerk * 0.8;
  const jerk = maxes.jerk ?? maxes.clean_jerk;
  const frontSquat = maxes.front_squat;
  const cleanPull = maxes.clean_pull;

  if (clean && jerk) {
    const r = clean / jerk;
    console.log("[diagnostics] clean:", clean, "jerk:", jerk, "ratio:", r);
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

// Score every exercise by how well its `fixes` cover the given problems
// (+2 per matching fix, +1 bonus when the exercise phase matches the
// problem's phase). Returns the top 3 exercise ids.
export function selectCorrectives(problems: string[]): string[] {
  const scored: Record<string, number> = {};

  for (const ex of EXERCISE_DB) {
    let score = 0;

    for (const p of problems) {
      if (ex.fixes?.includes(p)) score += 2;
      if (PROBLEM_PHASE_MAP[p] === ex.phase) score += 1;
    }

    if (score > 0) scored[ex.id] = score;
  }

  return Object.entries(scored)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);
}
