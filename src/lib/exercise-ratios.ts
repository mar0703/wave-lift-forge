// Diagnostic strength ratios between lifts.
// Compare numerator_max / denominator_max against norm range to detect weaknesses.

export interface RatioDef {
  id: string;
  numerator: string; // exercise id
  denominator: string; // exercise id
  norm_min: number;
  norm_max: number;
  low_problem: string;
  high_problem: string;
}

export const RATIOS: RatioDef[] = [
  {
    id: "jerk_vs_cj",
    numerator: "jerk_rack",
    denominator: "clean_jerk",
    norm_min: 1.05,
    norm_max: 1.15,
    low_problem: "weak_jerk",
    high_problem: "weak_clean",
  },
  {
    id: "front_squat_vs_cj",
    numerator: "front_squat",
    denominator: "clean_jerk",
    norm_min: 1.25,
    norm_max: 1.35,
    low_problem: "weak_legs",
    high_problem: "tech_limitation_clean",
  },
  {
    id: "clean_pull_vs_clean",
    numerator: "clean_pull",
    denominator: "clean_jerk",
    norm_min: 1.0,
    norm_max: 1.1,
    low_problem: "weak_pull",
    high_problem: "poor_receive_clean",
  },
  {
    id: "snatch_pull_vs_snatch",
    numerator: "snatch_pull",
    denominator: "snatch",
    norm_min: 1.0,
    norm_max: 1.1,
    low_problem: "weak_pull",
    high_problem: "poor_receive_snatch",
  },
  {
    id: "power_snatch_vs_snatch",
    numerator: "power_snatch",
    denominator: "snatch",
    norm_min: 0.8,
    norm_max: 0.9,
    low_problem: "low_speed",
    high_problem: "poor_drop",
  },
];

export type RatioStatus = "low" | "ok" | "high";

export interface RatioEvaluation {
  id: string;
  ratio: number;
  status: RatioStatus;
  problem: string | null;
  norm_min: number;
  norm_max: number;
}

export function evaluateRatio(
  def: RatioDef,
  numeratorMax: number,
  denominatorMax: number
): RatioEvaluation {
  const ratio = denominatorMax > 0 ? numeratorMax / denominatorMax : 0;
  let status: RatioStatus = "ok";
  let problem: string | null = null;
  if (ratio < def.norm_min) {
    status = "low";
    problem = def.low_problem;
  } else if (ratio > def.norm_max) {
    status = "high";
    problem = def.high_problem;
  }
  return { id: def.id, ratio: Math.round(ratio * 1000) / 1000, status, problem, norm_min: def.norm_min, norm_max: def.norm_max };
}

export function evaluateAllRatios(
  maxes: Record<string, number>
): RatioEvaluation[] {
  return RATIOS.map((r) => evaluateRatio(r, maxes[r.numerator] ?? 0, maxes[r.denominator] ?? 0));
}
