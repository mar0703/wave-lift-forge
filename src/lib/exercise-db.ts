// Single source of truth for every exercise the app knows about.
// All string-matching logic must go through this DB (no regex on names).

export type ExerciseFamily =
  | "snatch"
  | "clean"
  | "jerk"
  | "pull"
  | "squat"
  | "general";

export type ExerciseType =
  | "main"
  | "variation"
  | "power"
  | "strength"
  | "technique"
  | "accessory";

export type ExercisePhase = "pull" | "transition" | "receive" | "recovery";

export type ExerciseGroup = "Main" | "Special" | "General";

export interface ExerciseDef {
  id: string;
  name_en: string;
  aliases: string[];
  family: ExerciseFamily;
  type: ExerciseType;
  phase: ExercisePhase;
  difficulty: 1 | 2 | 3 | 4 | 5;
  // Legacy fields (kept for back-compat with training-engine / exercise route).
  group: ExerciseGroup;
  phases?: string[];
  diagnostics?: string[];
}

export const EXERCISE_DB: ExerciseDef[] = [
  // ───────────────────────────── SNATCH FAMILY ─────────────────────────────
  { id: "snatch", name_en: "snatch", aliases: ["full snatch", "squat snatch"], family: "snatch", type: "main", phase: "receive", difficulty: 5, group: "Main", phases: ["first_pull", "second_pull", "turnover", "catch"], diagnostics: ["speed_under_bar", "bar_path"] },
  { id: "power_snatch", name_en: "power snatch", aliases: [], family: "snatch", type: "power", phase: "receive", difficulty: 4, group: "Special", diagnostics: ["explosiveness"] },
  { id: "hang_snatch_high", name_en: "hang snatch from above knee", aliases: ["high hang snatch"], family: "snatch", type: "variation", phase: "transition", difficulty: 4, group: "Special", diagnostics: ["second_pull"] },
  { id: "hang_snatch_low", name_en: "hang snatch from below knee", aliases: ["low hang snatch"], family: "snatch", type: "variation", phase: "pull", difficulty: 5, group: "Special", diagnostics: ["first_pull"] },
  { id: "snatch_from_blocks_knee", name_en: "snatch from blocks at knee", aliases: ["block snatch knee"], family: "snatch", type: "variation", phase: "transition", difficulty: 4, group: "Special" },
  { id: "snatch_from_blocks_below_knee", name_en: "snatch from blocks below knee", aliases: ["block snatch low"], family: "snatch", type: "variation", phase: "pull", difficulty: 4, group: "Special" },
  { id: "snatch_from_blocks_above_knee", name_en: "snatch from blocks above knee", aliases: ["block snatch high"], family: "snatch", type: "variation", phase: "transition", difficulty: 3, group: "Special" },
  { id: "snatch_pause_knee", name_en: "snatch with pause at knee", aliases: ["pause snatch knee"], family: "snatch", type: "technique", phase: "transition", difficulty: 4, group: "Special" },
  { id: "snatch_pause_below_knee", name_en: "snatch with pause below knee", aliases: ["pause snatch low"], family: "snatch", type: "technique", phase: "pull", difficulty: 4, group: "Special" },
  { id: "tall_snatch", name_en: "tall snatch", aliases: [], family: "snatch", type: "technique", phase: "receive", difficulty: 3, group: "Special" },
  { id: "muscle_snatch", name_en: "muscle snatch", aliases: [], family: "snatch", type: "technique", phase: "transition", difficulty: 2, group: "Special" },
  { id: "no_feet_snatch", name_en: "no-foot snatch", aliases: ["no jump snatch", "feet planted snatch"], family: "snatch", type: "technique", phase: "transition", difficulty: 3, group: "Special" },
  { id: "snatch_balance", name_en: "snatch balance", aliases: [], family: "snatch", type: "technique", phase: "receive", difficulty: 3, group: "Special", diagnostics: ["weak_catch", "slow_drop"] },
  { id: "drop_snatch", name_en: "drop snatch", aliases: [], family: "snatch", type: "technique", phase: "receive", difficulty: 3, group: "Special" },
  { id: "heaving_snatch_balance", name_en: "heaving snatch balance", aliases: [], family: "snatch", type: "technique", phase: "receive", difficulty: 3, group: "Special" },
  { id: "pressing_snatch_balance", name_en: "pressing snatch balance", aliases: [], family: "snatch", type: "technique", phase: "receive", difficulty: 2, group: "Special" },
  { id: "snatch_high_pull", name_en: "snatch high pull", aliases: [], family: "snatch", type: "strength", phase: "pull", difficulty: 3, group: "Special" },
  { id: "snatch_deadlift", name_en: "snatch deadlift", aliases: ["snatch grip deadlift to standing"], family: "snatch", type: "strength", phase: "pull", difficulty: 2, group: "Special" },
  { id: "snatch_deadlift_pause", name_en: "snatch deadlift with pause", aliases: [], family: "snatch", type: "strength", phase: "pull", difficulty: 3, group: "Special" },
  { id: "snatch_segment_pull", name_en: "snatch segment pull", aliases: ["segmented snatch pull"], family: "snatch", type: "technique", phase: "pull", difficulty: 4, group: "Special" },
  { id: "snatch_lift_off", name_en: "snatch lift-off", aliases: ["snatch off the floor to knee"], family: "snatch", type: "technique", phase: "pull", difficulty: 2, group: "Special" },
  { id: "overhead_squat", name_en: "overhead squat", aliases: ["ohs"], family: "snatch", type: "accessory", phase: "receive", difficulty: 3, group: "Special" },
  { id: "snatch_grip_push_press", name_en: "snatch grip push press", aliases: [], family: "snatch", type: "accessory", phase: "receive", difficulty: 2, group: "Special" },
  { id: "snatch_grip_behind_neck_press", name_en: "snatch grip press behind neck", aliases: ["sgbnp"], family: "snatch", type: "accessory", phase: "receive", difficulty: 2, group: "Special" },
  { id: "snatch_complex", name_en: "snatch complex", aliases: [], family: "snatch", type: "variation", phase: "receive", difficulty: 4, group: "Special" },
  { id: "snatch_panda_pull", name_en: "snatch panda pull", aliases: ["panda snatch pull"], family: "snatch", type: "technique", phase: "pull", difficulty: 4, group: "Special" },

  // ───────────────────────────── CLEAN FAMILY ──────────────────────────────
  { id: "clean", name_en: "clean", aliases: ["full clean", "squat clean"], family: "clean", type: "main", phase: "receive", difficulty: 5, group: "Main", diagnostics: ["leg_strength", "pull_timing"] },
  { id: "power_clean", name_en: "power clean", aliases: [], family: "clean", type: "power", phase: "receive", difficulty: 4, group: "Special", diagnostics: ["explosiveness"] },
  { id: "hang_clean_high", name_en: "hang clean from above knee", aliases: ["high hang clean"], family: "clean", type: "variation", phase: "transition", difficulty: 4, group: "Special" },
  { id: "hang_clean_low", name_en: "hang clean from below knee", aliases: ["low hang clean"], family: "clean", type: "variation", phase: "pull", difficulty: 5, group: "Special" },
  { id: "clean_from_blocks_knee", name_en: "clean from blocks at knee", aliases: ["block clean knee"], family: "clean", type: "variation", phase: "transition", difficulty: 4, group: "Special" },
  { id: "clean_from_blocks_below_knee", name_en: "clean from blocks below knee", aliases: ["block clean low"], family: "clean", type: "variation", phase: "pull", difficulty: 4, group: "Special" },
  { id: "clean_from_blocks_above_knee", name_en: "clean from blocks above knee", aliases: ["block clean high"], family: "clean", type: "variation", phase: "transition", difficulty: 3, group: "Special" },
  { id: "clean_pause_knee", name_en: "clean with pause at knee", aliases: [], family: "clean", type: "technique", phase: "transition", difficulty: 4, group: "Special" },
  { id: "clean_pause_below_knee", name_en: "clean with pause below knee", aliases: [], family: "clean", type: "technique", phase: "pull", difficulty: 4, group: "Special" },
  { id: "tall_clean", name_en: "tall clean", aliases: [], family: "clean", type: "technique", phase: "receive", difficulty: 3, group: "Special" },
  { id: "muscle_clean", name_en: "muscle clean", aliases: [], family: "clean", type: "technique", phase: "transition", difficulty: 2, group: "Special" },
  { id: "no_feet_clean", name_en: "no-foot clean", aliases: ["feet planted clean"], family: "clean", type: "technique", phase: "transition", difficulty: 3, group: "Special" },
  { id: "clean_high_pull", name_en: "clean high pull", aliases: [], family: "clean", type: "strength", phase: "pull", difficulty: 3, group: "Special" },
  { id: "clean_deadlift", name_en: "clean deadlift", aliases: [], family: "clean", type: "strength", phase: "pull", difficulty: 2, group: "Special" },
  { id: "clean_deadlift_pause", name_en: "clean deadlift with pause", aliases: [], family: "clean", type: "strength", phase: "pull", difficulty: 3, group: "Special" },
  { id: "clean_segment_pull", name_en: "clean segment pull", aliases: ["segmented clean pull"], family: "clean", type: "technique", phase: "pull", difficulty: 4, group: "Special" },
  { id: "clean_lift_off", name_en: "clean lift-off", aliases: ["clean off the floor to knee"], family: "clean", type: "technique", phase: "pull", difficulty: 2, group: "Special" },
  { id: "clean_complex", name_en: "clean complex", aliases: [], family: "clean", type: "variation", phase: "receive", difficulty: 4, group: "Special" },
  { id: "clean_panda_pull", name_en: "clean panda pull", aliases: ["panda clean pull"], family: "clean", type: "technique", phase: "pull", difficulty: 4, group: "Special" },
  { id: "clean_and_jerk", name_en: "clean & jerk", aliases: ["clean and jerk", "c&j", "cj"], family: "clean", type: "main", phase: "receive", difficulty: 5, group: "Main", diagnostics: ["leg_strength", "overhead_strength"] },
  { id: "hang_power_clean", name_en: "hang power clean", aliases: [], family: "clean", type: "power", phase: "transition", difficulty: 3, group: "Special" },
  { id: "deficit_clean", name_en: "clean from deficit", aliases: ["deficit clean"], family: "clean", type: "variation", phase: "pull", difficulty: 4, group: "Special", diagnostics: ["first_pull"] },

  // ───────────────────────────── JERK FAMILY ───────────────────────────────
  { id: "jerk", name_en: "jerk", aliases: [], family: "jerk", type: "main", phase: "receive", difficulty: 4, group: "Main", diagnostics: ["overhead_strength", "dip_drive"] },
  { id: "push_jerk", name_en: "push jerk", aliases: [], family: "jerk", type: "variation", phase: "receive", difficulty: 3, group: "Special", diagnostics: ["leg_drive"] },
  { id: "split_jerk", name_en: "split jerk", aliases: [], family: "jerk", type: "main", phase: "receive", difficulty: 4, group: "Main" },
  { id: "power_jerk", name_en: "power jerk", aliases: [], family: "jerk", type: "power", phase: "receive", difficulty: 3, group: "Special" },
  { id: "squat_jerk", name_en: "squat jerk", aliases: [], family: "jerk", type: "variation", phase: "receive", difficulty: 5, group: "Special" },
  { id: "jerk_from_rack", name_en: "jerk from rack", aliases: ["jerk off rack"], family: "jerk", type: "variation", phase: "receive", difficulty: 3, group: "Special", diagnostics: ["weak_jerk", "overhead_instability"] },
  { id: "jerk_behind_neck", name_en: "jerk behind the neck", aliases: ["bnj"], family: "jerk", type: "variation", phase: "receive", difficulty: 4, group: "Special" },
  { id: "jerk_dip", name_en: "jerk dip", aliases: ["jerk dip squat"], family: "jerk", type: "technique", phase: "transition", difficulty: 2, group: "Special" },
  { id: "jerk_drive", name_en: "jerk drive", aliases: [], family: "jerk", type: "technique", phase: "transition", difficulty: 2, group: "Special" },
  { id: "jerk_recovery", name_en: "jerk recovery", aliases: [], family: "jerk", type: "technique", phase: "recovery", difficulty: 2, group: "Special" },
  { id: "jerk_balance", name_en: "jerk balance", aliases: [], family: "jerk", type: "technique", phase: "receive", difficulty: 3, group: "Special" },
  { id: "jerk_support", name_en: "jerk support", aliases: ["overhead support hold"], family: "jerk", type: "technique", phase: "receive", difficulty: 2, group: "Special" },
  { id: "push_press", name_en: "push press", aliases: [], family: "jerk", type: "accessory", phase: "receive", difficulty: 2, group: "Special", diagnostics: ["overhead_strength"] },
  { id: "push_press_behind_neck", name_en: "push press behind the neck", aliases: ["bnpp"], family: "jerk", type: "accessory", phase: "receive", difficulty: 2, group: "Special" },
  { id: "strict_press", name_en: "strict press", aliases: ["military press", "overhead press"], family: "jerk", type: "accessory", phase: "receive", difficulty: 2, group: "Special" },
  { id: "pause_jerk", name_en: "jerk with pause in dip", aliases: ["pause jerk"], family: "jerk", type: "technique", phase: "transition", difficulty: 3, group: "Special" },
  { id: "jerk_complex", name_en: "jerk complex", aliases: [], family: "jerk", type: "variation", phase: "receive", difficulty: 4, group: "Special" },
  { id: "split_jerk_from_blocks", name_en: "split jerk from blocks", aliases: [], family: "jerk", type: "variation", phase: "receive", difficulty: 4, group: "Special" },

  // ───────────────────────────── PULL FAMILY ───────────────────────────────
  { id: "snatch_pull", name_en: "snatch pull", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special", diagnostics: ["bar_path", "extension"] },
  { id: "clean_pull", name_en: "clean pull", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special", diagnostics: ["leg_drive"] },
  { id: "snatch_high_pull_dedicated", name_en: "snatch high pull (dedicated)", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special" },
  { id: "clean_high_pull_dedicated", name_en: "clean high pull (dedicated)", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special" },
  { id: "snatch_deficit_pull", name_en: "snatch pull from deficit", aliases: ["deficit snatch pull"], family: "pull", type: "strength", phase: "pull", difficulty: 4, group: "Special" },
  { id: "clean_deficit_pull", name_en: "clean pull from deficit", aliases: ["deficit clean pull"], family: "pull", type: "strength", phase: "pull", difficulty: 4, group: "Special" },
  { id: "snatch_block_pull_knee", name_en: "snatch pull from blocks at knee", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special" },
  { id: "snatch_block_pull_below_knee", name_en: "snatch pull from blocks below knee", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special" },
  { id: "clean_block_pull_knee", name_en: "clean pull from blocks at knee", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special" },
  { id: "clean_block_pull_below_knee", name_en: "clean pull from blocks below knee", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special" },
  { id: "snatch_pull_pause_knee", name_en: "snatch pull with pause at knee", aliases: [], family: "pull", type: "technique", phase: "pull", difficulty: 4, group: "Special" },
  { id: "clean_pull_pause_knee", name_en: "clean pull with pause at knee", aliases: [], family: "pull", type: "technique", phase: "pull", difficulty: 4, group: "Special" },
  { id: "snatch_rdl", name_en: "snatch grip Romanian deadlift", aliases: ["snatch grip rdl"], family: "pull", type: "accessory", phase: "pull", difficulty: 2, group: "General" },
  { id: "clean_rdl", name_en: "clean grip Romanian deadlift", aliases: ["clean grip rdl"], family: "pull", type: "accessory", phase: "pull", difficulty: 2, group: "General" },
  { id: "snatch_shrug", name_en: "snatch shrug", aliases: [], family: "pull", type: "accessory", phase: "pull", difficulty: 1, group: "General" },
  { id: "clean_shrug", name_en: "clean shrug", aliases: [], family: "pull", type: "accessory", phase: "pull", difficulty: 1, group: "General" },

  // ───────────────────────────── SQUAT ─────────────────────────────────────
  { id: "front_squat", name_en: "front squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General", diagnostics: ["clean_recovery"] },
  { id: "back_squat", name_en: "back squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General", diagnostics: ["general_strength"] },
  { id: "overhead_squat_dedicated", name_en: "overhead squat (dedicated)", aliases: [], family: "squat", type: "technique", phase: "receive", difficulty: 3, group: "General" },
  { id: "pause_front_squat", name_en: "pause front squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 4, group: "General" },
  { id: "pause_back_squat", name_en: "pause back squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 4, group: "General" },
  { id: "tempo_front_squat", name_en: "tempo front squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General" },
  { id: "tempo_back_squat", name_en: "tempo back squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General" },
  { id: "box_squat", name_en: "box squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 2, group: "General" },
  { id: "bulgarian_split_squat", name_en: "Bulgarian split squat", aliases: ["rear foot elevated split squat"], family: "squat", type: "accessory", phase: "recovery", difficulty: 2, group: "General" },
  { id: "zercher_squat", name_en: "Zercher squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General" },
  { id: "ssb_squat", name_en: "safety bar squat", aliases: ["ssb squat"], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General" },
  { id: "jump_squat", name_en: "jump squat", aliases: [], family: "squat", type: "power", phase: "recovery", difficulty: 2, group: "General" },
  { id: "anderson_squat", name_en: "Anderson squat", aliases: ["dead stop squat"], family: "squat", type: "strength", phase: "recovery", difficulty: 4, group: "General" },
  { id: "pin_squat", name_en: "pin squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General" },

  // ───────────────────────── GENERAL / ACCESSORY ───────────────────────────
  { id: "deadlift", name_en: "deadlift", aliases: ["conventional deadlift"], family: "general", type: "strength", phase: "pull", difficulty: 3, group: "General" },
  { id: "romanian_deadlift", name_en: "Romanian deadlift", aliases: ["rdl"], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General" },
  { id: "snatch_grip_deadlift", name_en: "snatch grip deadlift", aliases: [], family: "general", type: "strength", phase: "pull", difficulty: 3, group: "General" },
  { id: "clean_grip_deadlift", name_en: "clean grip deadlift", aliases: [], family: "general", type: "strength", phase: "pull", difficulty: 3, group: "General" },
  { id: "good_morning", name_en: "good morning", aliases: [], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General" },
  { id: "hip_thrust", name_en: "barbell hip thrust", aliases: ["hip thrust"], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General" },
  { id: "glute_bridge", name_en: "glute bridge", aliases: [], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General" },
  { id: "walking_lunge", name_en: "walking lunge", aliases: [], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General" },
  { id: "reverse_lunge", name_en: "reverse lunge", aliases: [], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General" },
  { id: "step_up", name_en: "step-up", aliases: ["box step up"], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General" },
  { id: "calf_raise", name_en: "calf raise", aliases: ["standing calf raise"], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General" },
  { id: "nordic_curl", name_en: "Nordic hamstring curl", aliases: ["nordic curl"], family: "general", type: "accessory", phase: "recovery", difficulty: 4, group: "General" },
  { id: "pull_up", name_en: "pull-up", aliases: ["pullup"], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General" },
  { id: "chin_up", name_en: "chin-up", aliases: ["chinup"], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General" },
  { id: "weighted_pull_up", name_en: "weighted pull-up", aliases: [], family: "general", type: "accessory", phase: "pull", difficulty: 3, group: "General" },
  { id: "bent_over_row", name_en: "bent-over barbell row", aliases: ["bent over row"], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General" },
  { id: "pendlay_row", name_en: "Pendlay row", aliases: [], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General" },
  { id: "barbell_row", name_en: "barbell row", aliases: [], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General" },
  { id: "t_bar_row", name_en: "T-bar row", aliases: ["tbar row"], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General" },
  { id: "dumbbell_row", name_en: "dumbbell row", aliases: ["one arm db row"], family: "general", type: "accessory", phase: "pull", difficulty: 1, group: "General" },
  { id: "plank", name_en: "plank", aliases: ["front plank"], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General" },
  { id: "side_plank", name_en: "side plank", aliases: [], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General" },
  { id: "hanging_leg_raise", name_en: "hanging leg raise", aliases: [], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General" },
  { id: "ab_wheel", name_en: "ab wheel rollout", aliases: ["ab wheel"], family: "general", type: "accessory", phase: "recovery", difficulty: 3, group: "General" },
  { id: "back_extension", name_en: "back extension", aliases: ["hyperextension"], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General" },
  { id: "reverse_hyper", name_en: "reverse hyperextension", aliases: ["reverse hyper"], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General" },
  { id: "farmer_carry", name_en: "farmer's carry", aliases: ["farmer walk", "farmers carry"], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General" },
  { id: "sled_push", name_en: "sled push", aliases: ["prowler push"], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General" },
];

export function getExerciseById(id: string): ExerciseDef | undefined {
  return EXERCISE_DB.find((e) => e.id === id);
}

export function getExerciseByName(name: string): ExerciseDef | undefined {
  const lower = name.toLowerCase().trim();
  return EXERCISE_DB.find(
    (e) =>
      e.name_en.toLowerCase() === lower ||
      e.aliases.some((a) => a.toLowerCase() === lower) ||
      e.id === lower,
  );
}

export function getExercisesByFamily(family: ExerciseFamily): ExerciseDef[] {
  return EXERCISE_DB.filter((e) => e.family === family);
}
