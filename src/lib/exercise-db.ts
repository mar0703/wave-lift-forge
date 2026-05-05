// Single source of truth for every exercise the app knows about.
// All string-matching logic must go through this DB (no regex on names).

export type ExerciseFamily = "snatch" | "clean" | "jerk" | "pull" | "squat";
export type ExerciseGroup = "Main" | "Special" | "General";

export interface ExerciseDef {
  id: string;
  name_en: string;
  family: ExerciseFamily;
  group: ExerciseGroup;
  type?: string;
  phases?: string[];
  diagnostics?: string[];
  aliases?: string[];
}

export const EXERCISE_DB: ExerciseDef[] = [
  // 🔴 SNATCH FAMILY
  {
    id: "snatch",
    name_en: "snatch",
    family: "snatch",
    group: "Main",
    type: "competition",
    phases: ["first_pull", "second_pull", "turnover", "catch"],
    diagnostics: ["speed_under_bar", "bar_path"],
  },
  {
    id: "power_snatch",
    name_en: "power snatch",
    family: "snatch",
    group: "Special",
    type: "power",
    diagnostics: ["explosiveness"],
  },
  {
    id: "hang_snatch",
    name_en: "hang snatch",
    family: "snatch",
    group: "Special",
    type: "position",
    diagnostics: ["second_pull"],
  },
  {
    id: "snatch_balance",
    name_en: "snatch balance",
    family: "snatch",
    group: "Special",
    type: "receive",
    diagnostics: ["weak_catch", "slow_drop"],
  },
  // 🔵 CLEAN FAMILY
  {
    id: "clean",
    name_en: "clean",
    family: "clean",
    group: "Main",
    type: "competition",
    diagnostics: ["leg_strength", "pull_timing"],
  },
  {
    id: "clean_jerk",
    name_en: "clean & jerk",
    family: "clean",
    group: "Main",
    type: "competition",
    aliases: ["clean and jerk", "c&j", "cj"],
    diagnostics: ["leg_strength", "overhead_strength"],
  },
  {
    id: "hang_clean",
    name_en: "hang clean",
    family: "clean",
    group: "Special",
    type: "position",
    diagnostics: ["second_pull"],
  },
  {
    id: "power_clean",
    name_en: "power clean",
    family: "clean",
    group: "Special",
    type: "power",
    diagnostics: ["explosiveness"],
  },
  {
    id: "clean_from_deficit",
    name_en: "clean from deficit",
    family: "clean",
    group: "Special",
    type: "special",
    diagnostics: ["first_pull"],
  },
  // 🟡 JERK FAMILY
  {
    id: "jerk",
    name_en: "jerk",
    family: "jerk",
    group: "Main",
    type: "competition",
    diagnostics: ["overhead_strength", "dip_drive"],
  },
  {
    id: "push_jerk",
    name_en: "push jerk",
    family: "jerk",
    group: "Special",
    type: "variation",
    diagnostics: ["leg_drive"],
  },
  {
    id: "jerk_rack",
    name_en: "jerk from rack",
    family: "jerk",
    group: "Special",
    type: "jerk",
    diagnostics: ["weak_jerk", "overhead_instability"],
  },
  {
    id: "push_press",
    name_en: "push press",
    family: "jerk",
    group: "Special",
    type: "overhead",
    diagnostics: ["overhead_strength"],
  },
  // 🟢 PULLS
  {
    id: "snatch_pull",
    name_en: "snatch pull",
    family: "pull",
    group: "Special",
    diagnostics: ["bar_path", "extension"],
  },
  {
    id: "clean_pull",
    name_en: "clean pull",
    family: "pull",
    group: "Special",
    diagnostics: ["leg_drive"],
  },
  // 🟤 SQUATS
  {
    id: "front_squat",
    name_en: "front squat",
    family: "squat",
    group: "General",
    diagnostics: ["clean_recovery"],
  },
  {
    id: "back_squat",
    name_en: "back squat",
    family: "squat",
    group: "General",
    diagnostics: ["general_strength"],
  },
];

export function getExerciseById(id: string): ExerciseDef | undefined {
  return EXERCISE_DB.find((e) => e.id === id);
}

export function getExerciseByName(name: string): ExerciseDef | undefined {
  const lower = name.toLowerCase().trim();
  return EXERCISE_DB.find(
    (e) => e.name_en === lower || e.aliases?.includes(lower) || e.id === lower,
  );
}

export function getExercisesByFamily(family: ExerciseFamily): ExerciseDef[] {
  return EXERCISE_DB.filter((e) => e.family === family);
}
