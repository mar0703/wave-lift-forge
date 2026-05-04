// Exercise catalog for Olympic weightlifting training engine
export type ExerciseGroup = "Main" | "Special" | "General";

export interface CatalogExercise {
  id: string;
  name: string;
  group: ExerciseGroup;
  type: string;
  phases: string[];
  fixes?: string[];
}

export const EXERCISE_CATALOG: CatalogExercise[] = [
  { id: "snatch", name: "Snatch", group: "Main", type: "competition", phases: ["full"] },
  { id: "clean_jerk", name: "Clean & Jerk", group: "Main", type: "competition", phases: ["full"] },

  { id: "jerk_rack", name: "Jerk from Rack", group: "Special", type: "jerk", phases: ["drive", "lockout"], fixes: ["weak_jerk", "overhead_instability"] },
  { id: "clean_pull", name: "Clean Pull", group: "Special", type: "pull", phases: ["first_pull", "second_pull"], fixes: ["weak_pull", "poor_extension"] },
  { id: "snatch_pull", name: "Snatch Pull", group: "Special", type: "pull", phases: ["first_pull", "second_pull"], fixes: ["weak_pull", "early_arm_bend"] },
  { id: "hang_snatch", name: "Hang Snatch", group: "Special", type: "technique", phases: ["second_pull", "receive"], fixes: ["poor_timing", "slow_turnover"] },
  { id: "power_snatch", name: "Power Snatch", group: "Special", type: "speed", phases: ["explosion"], fixes: ["low_speed"] },
  { id: "snatch_balance", name: "Snatch Balance", group: "Special", type: "receive", phases: ["receive"], fixes: ["weak_catch", "slow_drop"] },

  { id: "front_squat", name: "Front Squat", group: "General", type: "strength", phases: ["recovery"], fixes: ["weak_legs", "clean_failure"] },
  { id: "back_squat", name: "Back Squat", group: "General", type: "strength", phases: ["general_strength"], fixes: ["weak_base"] },
];

// Daily rotation of Special + General work so each training day differs.
// Main lifts (Snatch, Clean & Jerk) are scheduled separately per day to keep variation.
export const DAILY_PLAN: Record<
  number,
  { mains: string[]; specials: string[]; generals: string[] }
> = {
  1: { mains: ["snatch", "clean_jerk"], specials: ["snatch_pull", "clean_pull"], generals: ["back_squat"] },
  2: { mains: ["snatch"], specials: ["hang_snatch", "snatch_balance"], generals: ["front_squat"] },
  3: { mains: ["clean_jerk"], specials: ["jerk_rack", "clean_pull"], generals: ["back_squat"] },
  4: { mains: ["snatch", "clean_jerk"], specials: ["power_snatch", "snatch_pull"], generals: ["front_squat"] },
  5: { mains: ["clean_jerk"], specials: ["jerk_rack", "snatch_balance"], generals: ["back_squat"] },
};

export function getExerciseById(id: string): CatalogExercise | undefined {
  return EXERCISE_CATALOG.find((e) => e.id === id);
}
