export const EXERCISE_DB = [
  // 🔴 SNATCH FAMILY
  {
    id: "snatch",
    name_en: "snatch",
    family: "snatch",
    type: "competition",
    phases: ["first_pull", "second_pull", "turnover", "catch"],
    diagnostics: ["speed_under_bar", "bar_path"],
  },
  {
    id: "power_snatch",
    name_en: "power snatch",
    family: "snatch",
    type: "power",
    diagnostics: ["explosiveness"],
  },
  {
    id: "hang_snatch",
    name_en: "hang snatch",
    family: "snatch",
    type: "position",
    diagnostics: ["second_pull"],
  },
  // 🔵 CLEAN FAMILY
  {
    id: "clean",
    name_en: "clean",
    family: "clean",
    type: "competition",
    diagnostics: ["leg_strength", "pull_timing"],
  },
  {
    id: "hang_clean",
    name_en: "hang clean",
    family: "clean",
    type: "position",
    diagnostics: ["second_pull"],
  },
  {
    id: "power_clean",
    name_en: "power clean",
    family: "clean",
    type: "power",
    diagnostics: ["explosiveness"],
  },
  // 🟡 JERK FAMILY
  {
    id: "jerk",
    name_en: "jerk",
    family: "jerk",
    type: "competition",
    diagnostics: ["overhead_strength", "dip_drive"],
  },
  {
    id: "push_jerk",
    name_en: "push jerk",
    family: "jerk",
    type: "variation",
    diagnostics: ["leg_drive"],
  },
  // 🟢 PULLS (КЛЮЧ К ТВОЕЙ СИСТЕМЕ)
  {
    id: "snatch_pull",
    name_en: "snatch pull",
    family: "pull",
    diagnostics: ["bar_path", "extension"],
  },
  {
    id: "clean_pull",
    name_en: "clean pull",
    family: "pull",
    diagnostics: ["leg_drive"],
  },
  // 🟤 SQUATS
  {
    id: "front_squat",
    name_en: "front squat",
    family: "squat",
    diagnostics: ["clean_recovery"],
  },
  {
    id: "back_squat",
    name_en: "back squat",
    family: "squat",
    diagnostics: ["general_strength"],
  },
  // ⚙️ SPECIAL
  {
    id: "clean_from_deficit",
    name_en: "clean from deficit",
    family: "clean",
    type: "special",
    diagnostics: ["first_pull"],
  },
];
