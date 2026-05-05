// Strength-ratio diagnostics. Pure data → problem ids.
// No string matching on exercise names — works on user max ids.

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
    normal_min: 1.0,
    normal_max: 1.15,
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

export function detectProblems(maxes: Record<string, number>): string[] {
  const problems: string[] = [];

  const clean = maxes.clean ?? maxes.clean_jerk;
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

export function correctivesForProblems(problems: string[]): string[] {
  const out: string[] = [];
  for (const p of problems) {
    for (const id of PROBLEM_MAP[p] ?? []) {
      if (!out.includes(id)) out.push(id);
    }
  }
  return out;
}
