// Problem → corrective exercise mapping.
// Used to add focused work when ratio diagnostics flag a weakness.

export interface ProblemDef {
  id: string;
  focus: string;
  add_exercises: string[];
}

export const PROBLEMS: ProblemDef[] = [
  { id: "weak_clean", focus: "clean_phase", add_exercises: ["clean_jerk", "front_squat", "clean_pull"] },
  { id: "weak_jerk", focus: "jerk_phase", add_exercises: ["jerk_rack", "push_press"] },
  { id: "weak_legs", focus: "strength", add_exercises: ["front_squat", "back_squat"] },
  { id: "weak_pull", focus: "pull", add_exercises: ["clean_pull", "snatch_pull"] },
  { id: "poor_receive_snatch", focus: "receive", add_exercises: ["snatch_balance", "hang_snatch"] },
  { id: "low_speed", focus: "explosion", add_exercises: ["power_snatch"] },
];

export function getProblem(id: string): ProblemDef | undefined {
  return PROBLEMS.find((p) => p.id === id);
}

// Given a list of problem ids, return a deduped list of corrective exercise ids
// in priority order (first occurrence wins).
export function exercisesForProblems(problemIds: string[]): string[] {
  const out: string[] = [];
  for (const pid of problemIds) {
    const p = getProblem(pid);
    if (!p) continue;
    for (const ex of p.add_exercises) {
      if (!out.includes(ex)) out.push(ex);
    }
  }
  return out;
}
