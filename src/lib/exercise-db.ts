// Single source of truth for every exercise the app knows about.
// All string-matching logic must go through this DB (no regex on names).

import type {
  MovementPhase,
  MovementPosition,
} from "./weightlifting/movement-model";

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

// ─────────────────── Movement-intelligence metadata ───────────────────

export type ExerciseVariant =
  | "classic"
  | "hang"
  | "block"
  | "pause"
  | "power"
  | "deficit";

export type ExerciseRole =
  | "main"
  | "corrective"
  | "technical"
  | "overload"
  | "accessory";

export type ExerciseIntent =
  | "max_force"
  | "speed_strength"
  | "technical_precision"
  | "speed_under"
  | "positional_control"
  | "competition_execution"
  | "recovery";

export type ExercisePurpose =
  | "extension"
  | "speed"
  | "timing"
  | "positioning"
  | "trajectory"
  | "receive"
  | "balance"
  | "stability";

export type ExerciseFatigueType = "cns" | "local" | "mixed";

export interface TransferProfile {
  snatch?: number;
  clean?: number;
  jerk?: number;
}

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
  fixes?: string[]; // what problems this exercise solves

  // ─── Movement-intelligence metadata (all optional, back-compat safe) ───
  variant?: ExerciseVariant;
  role?: ExerciseRole;
  intent?: ExerciseIntent;
  primary_phase?: MovementPhase;
  secondary_phases?: MovementPhase[];
  primary_position?: MovementPosition;
  purpose?: ExercisePurpose;

  // Why / what / when meaning
  why?: string;            // why this exercise exists
  improves?: string[];     // what it improves
  use_when?: string[];     // when to use
  avoid_when?: string[];   // when to avoid

  // Fatigue model — 1..10 scales
  fatigue_cost?: number;          // immediate session cost
  recovery_demand?: number;       // days/units to recover
  fatigue_type?: ExerciseFatigueType;

  // Skill model — 1..10 scales
  technical_complexity?: number;
  skill_stability_requirement?: number;

  // Transfer to competition lifts — 0..1 coefficients
  transfer_to?: TransferProfile;
}


export const EXERCISE_DB: ExerciseDef[] = [
  // ───────────────────────────── SNATCH FAMILY ─────────────────────────────
  { id: "snatch", name_en: "snatch", aliases: ["full snatch", "squat snatch"], family: "snatch", type: "main", phase: "receive", difficulty: 5, group: "Main", phases: ["first_pull", "second_pull", "turnover", "catch"], diagnostics: ["speed_under_bar", "bar_path"], fixes: ["mixed_technique"] },
  { id: "power_snatch", name_en: "power snatch", aliases: [], family: "snatch", type: "power", phase: "receive", difficulty: 4, group: "Special", diagnostics: ["explosiveness"], fixes: ["weak_extension", "slow_pull_under"] },
  { id: "hang_snatch_high", name_en: "hang snatch from above knee", aliases: ["high hang snatch"], family: "snatch", type: "variation", phase: "transition", difficulty: 4, group: "Special", diagnostics: ["second_pull"], fixes: ["weak_second_pull", "early_arm_bend"] },
  { id: "hang_snatch_low", name_en: "hang snatch from below knee", aliases: ["low hang snatch"], family: "snatch", type: "variation", phase: "pull", difficulty: 5, group: "Special", diagnostics: ["first_pull"], fixes: ["weak_first_pull", "loss_of_position"] },
  { id: "snatch_from_blocks_knee", name_en: "snatch from blocks at knee", aliases: ["block snatch knee"], family: "snatch", type: "variation", phase: "transition", difficulty: 4, group: "Special", fixes: ["poor_position", "bar_path_error"] },
  { id: "snatch_from_blocks_below_knee", name_en: "snatch from blocks below knee", aliases: ["block snatch low"], family: "snatch", type: "variation", phase: "pull", difficulty: 4, group: "Special", fixes: ["poor_position", "bar_path_error", "weak_first_pull"] },
  { id: "snatch_from_blocks_above_knee", name_en: "snatch from blocks above knee", aliases: ["block snatch high"], family: "snatch", type: "variation", phase: "transition", difficulty: 3, group: "Special", fixes: ["poor_position", "bar_path_error", "weak_second_pull"] },
  { id: "snatch_pause_knee", name_en: "snatch with pause at knee", aliases: ["pause snatch knee"], family: "snatch", type: "technique", phase: "transition", difficulty: 4, group: "Special", fixes: ["loss_of_position", "early_pull"] },
  { id: "snatch_pause_below_knee", name_en: "snatch with pause below knee", aliases: ["pause snatch low"], family: "snatch", type: "technique", phase: "pull", difficulty: 4, group: "Special", fixes: ["loss_of_position", "early_pull"] },
  { id: "tall_snatch", name_en: "tall snatch", aliases: [], family: "snatch", type: "technique", phase: "receive", difficulty: 3, group: "Special", fixes: ["early_arm_bend", "no_extension", "slow_pull_under"] },
  { id: "muscle_snatch", name_en: "muscle snatch", aliases: [], family: "snatch", type: "technique", phase: "transition", difficulty: 2, group: "Special", fixes: ["weak_turnover", "slow_pull_under"] },
  { id: "no_feet_snatch", name_en: "no-foot snatch", aliases: ["no jump snatch", "feet planted snatch"], family: "snatch", type: "technique", phase: "transition", difficulty: 3, group: "Special", fixes: ["excessive_jump", "bar_path_error"] },
  { id: "snatch_balance", name_en: "snatch balance", aliases: [], family: "snatch", type: "technique", phase: "receive", difficulty: 3, group: "Special", diagnostics: ["weak_catch", "slow_drop"], fixes: ["weak_catch", "slow_drop", "overhead_instability"] },
  { id: "drop_snatch", name_en: "drop snatch", aliases: [], family: "snatch", type: "technique", phase: "receive", difficulty: 3, group: "Special", fixes: ["slow_drop", "weak_catch"] },
  { id: "heaving_snatch_balance", name_en: "heaving snatch balance", aliases: [], family: "snatch", type: "technique", phase: "receive", difficulty: 3, group: "Special", fixes: ["weak_catch", "overhead_instability"] },
  { id: "pressing_snatch_balance", name_en: "pressing snatch balance", aliases: [], family: "snatch", type: "technique", phase: "receive", difficulty: 2, group: "Special", fixes: ["overhead_instability", "weak_overhead"] },
  { id: "snatch_high_pull", name_en: "snatch high pull", aliases: [], family: "snatch", type: "strength", phase: "pull", difficulty: 3, group: "Special", fixes: ["weak_pull", "no_extension"] },
  { id: "snatch_deadlift", name_en: "snatch deadlift", aliases: ["snatch grip deadlift to standing"], family: "snatch", type: "strength", phase: "pull", difficulty: 2, group: "Special", fixes: ["weak_pull", "weak_first_pull"] },
  { id: "snatch_deadlift_pause", name_en: "snatch deadlift with pause", aliases: [], family: "snatch", type: "strength", phase: "pull", difficulty: 3, group: "Special", fixes: ["loss_of_position", "weak_first_pull"] },
  { id: "snatch_segment_pull", name_en: "snatch segment pull", aliases: ["segmented snatch pull"], family: "snatch", type: "technique", phase: "pull", difficulty: 4, group: "Special", fixes: ["bar_path_error", "loss_of_position"] },
  { id: "snatch_lift_off", name_en: "snatch lift-off", aliases: ["snatch off the floor to knee"], family: "snatch", type: "technique", phase: "pull", difficulty: 2, group: "Special", fixes: ["weak_first_pull", "early_pull"] },
  { id: "overhead_squat", name_en: "overhead squat", aliases: ["ohs"], family: "snatch", type: "accessory", phase: "receive", difficulty: 3, group: "Special", fixes: ["overhead_instability", "weak_legs", "poor_mobility"] },
  { id: "snatch_grip_push_press", name_en: "snatch grip push press", aliases: [], family: "snatch", type: "accessory", phase: "receive", difficulty: 2, group: "Special", fixes: ["weak_overhead", "overhead_instability"] },
  { id: "snatch_grip_behind_neck_press", name_en: "snatch grip press behind neck", aliases: ["sgbnp"], family: "snatch", type: "accessory", phase: "receive", difficulty: 2, group: "Special", fixes: ["weak_overhead", "overhead_instability"] },
  { id: "snatch_complex", name_en: "snatch complex", aliases: [], family: "snatch", type: "variation", phase: "receive", difficulty: 4, group: "Special", fixes: ["mixed_technique"] },
  { id: "snatch_panda_pull", name_en: "snatch panda pull", aliases: ["panda snatch pull"], family: "snatch", type: "technique", phase: "pull", difficulty: 4, group: "Special", fixes: ["bar_path_error", "no_extension"] },

  // ───────────────────────────── CLEAN FAMILY ──────────────────────────────
  { id: "clean", name_en: "clean", aliases: ["full clean", "squat clean"], family: "clean", type: "main", phase: "receive", difficulty: 5, group: "Main", diagnostics: ["leg_strength", "pull_timing"], fixes: ["mixed_technique"] },
  { id: "power_clean", name_en: "power clean", aliases: [], family: "clean", type: "power", phase: "receive", difficulty: 4, group: "Special", diagnostics: ["explosiveness"], fixes: ["weak_extension", "slow_pull_under"] },
  { id: "hang_clean_high", name_en: "hang clean from above knee", aliases: ["high hang clean"], family: "clean", type: "variation", phase: "transition", difficulty: 4, group: "Special", fixes: ["weak_second_pull", "early_arm_bend"] },
  { id: "hang_clean_low", name_en: "hang clean from below knee", aliases: ["low hang clean"], family: "clean", type: "variation", phase: "pull", difficulty: 5, group: "Special", fixes: ["weak_first_pull", "loss_of_position"] },
  { id: "clean_from_blocks_knee", name_en: "clean from blocks at knee", aliases: ["block clean knee"], family: "clean", type: "variation", phase: "transition", difficulty: 4, group: "Special", fixes: ["poor_position", "bar_path_error"] },
  { id: "clean_from_blocks_below_knee", name_en: "clean from blocks below knee", aliases: ["block clean low"], family: "clean", type: "variation", phase: "pull", difficulty: 4, group: "Special", fixes: ["poor_position", "bar_path_error", "weak_first_pull"] },
  { id: "clean_from_blocks_above_knee", name_en: "clean from blocks above knee", aliases: ["block clean high"], family: "clean", type: "variation", phase: "transition", difficulty: 3, group: "Special", fixes: ["poor_position", "bar_path_error", "weak_second_pull"] },
  { id: "clean_pause_knee", name_en: "clean with pause at knee", aliases: [], family: "clean", type: "technique", phase: "transition", difficulty: 4, group: "Special", fixes: ["loss_of_position", "early_pull"] },
  { id: "clean_pause_below_knee", name_en: "clean with pause below knee", aliases: [], family: "clean", type: "technique", phase: "pull", difficulty: 4, group: "Special", fixes: ["loss_of_position", "early_pull"] },
  { id: "tall_clean", name_en: "tall clean", aliases: [], family: "clean", type: "technique", phase: "receive", difficulty: 3, group: "Special", fixes: ["early_arm_bend", "no_extension", "slow_pull_under"] },
  { id: "muscle_clean", name_en: "muscle clean", aliases: [], family: "clean", type: "technique", phase: "transition", difficulty: 2, group: "Special", fixes: ["weak_turnover", "slow_pull_under"] },
  { id: "no_feet_clean", name_en: "no-foot clean", aliases: ["feet planted clean"], family: "clean", type: "technique", phase: "transition", difficulty: 3, group: "Special", fixes: ["excessive_jump", "bar_path_error"] },
  { id: "clean_high_pull", name_en: "clean high pull", aliases: [], family: "clean", type: "strength", phase: "pull", difficulty: 3, group: "Special", fixes: ["weak_pull", "no_extension"] },
  { id: "clean_deadlift", name_en: "clean deadlift", aliases: [], family: "clean", type: "strength", phase: "pull", difficulty: 2, group: "Special", fixes: ["weak_pull", "weak_first_pull"] },
  { id: "clean_deadlift_pause", name_en: "clean deadlift with pause", aliases: [], family: "clean", type: "strength", phase: "pull", difficulty: 3, group: "Special", fixes: ["loss_of_position", "weak_first_pull"] },
  { id: "clean_segment_pull", name_en: "clean segment pull", aliases: ["segmented clean pull"], family: "clean", type: "technique", phase: "pull", difficulty: 4, group: "Special", fixes: ["bar_path_error", "loss_of_position"] },
  { id: "clean_lift_off", name_en: "clean lift-off", aliases: ["clean off the floor to knee"], family: "clean", type: "technique", phase: "pull", difficulty: 2, group: "Special", fixes: ["weak_first_pull", "early_pull"] },
  { id: "clean_complex", name_en: "clean complex", aliases: [], family: "clean", type: "variation", phase: "receive", difficulty: 4, group: "Special", fixes: ["mixed_technique"] },
  { id: "clean_panda_pull", name_en: "clean panda pull", aliases: ["panda clean pull"], family: "clean", type: "technique", phase: "pull", difficulty: 4, group: "Special", fixes: ["bar_path_error", "no_extension"] },
  { id: "clean_and_jerk", name_en: "clean & jerk", aliases: ["clean and jerk", "c&j", "cj"], family: "clean", type: "main", phase: "receive", difficulty: 5, group: "Main", diagnostics: ["leg_strength", "overhead_strength"], fixes: ["mixed_technique"] },
  { id: "hang_power_clean", name_en: "hang power clean", aliases: [], family: "clean", type: "power", phase: "transition", difficulty: 3, group: "Special", fixes: ["weak_second_pull", "slow_pull_under"] },
  { id: "deficit_clean", name_en: "clean from deficit", aliases: ["deficit clean"], family: "clean", type: "variation", phase: "pull", difficulty: 4, group: "Special", diagnostics: ["first_pull"], fixes: ["weak_first_pull", "poor_position"] },

  // ───────────────────────────── JERK FAMILY ───────────────────────────────
  { id: "jerk", name_en: "jerk", aliases: [], family: "jerk", type: "main", phase: "receive", difficulty: 4, group: "Main", diagnostics: ["overhead_strength", "dip_drive"], fixes: ["weak_jerk", "overhead_instability"] },
  { id: "push_jerk", name_en: "push jerk", aliases: [], family: "jerk", type: "variation", phase: "receive", difficulty: 3, group: "Special", diagnostics: ["leg_drive"], fixes: ["weak_leg_drive", "overhead_instability"] },
  { id: "split_jerk", name_en: "split jerk", aliases: [], family: "jerk", type: "main", phase: "receive", difficulty: 4, group: "Main", fixes: ["weak_split", "overhead_instability"] },
  { id: "power_jerk", name_en: "power jerk", aliases: [], family: "jerk", type: "power", phase: "receive", difficulty: 3, group: "Special", fixes: ["weak_leg_drive", "slow_pull_under"] },
  { id: "squat_jerk", name_en: "squat jerk", aliases: [], family: "jerk", type: "variation", phase: "receive", difficulty: 5, group: "Special", fixes: ["weak_overhead", "poor_mobility"] },
  { id: "jerk_from_rack", name_en: "jerk from rack", aliases: ["jerk off rack"], family: "jerk", type: "variation", phase: "receive", difficulty: 3, group: "Special", diagnostics: ["weak_jerk", "overhead_instability"], fixes: ["weak_jerk", "overhead_instability"] },
  { id: "jerk_behind_neck", name_en: "jerk behind the neck", aliases: ["bnj"], family: "jerk", type: "variation", phase: "receive", difficulty: 4, group: "Special", fixes: ["weak_overhead", "bar_path_error"] },
  { id: "jerk_dip", name_en: "jerk dip", aliases: ["jerk dip squat"], family: "jerk", type: "technique", phase: "transition", difficulty: 2, group: "Special", fixes: ["poor_dip", "knee_caving"] },
  { id: "jerk_drive", name_en: "jerk drive", aliases: [], family: "jerk", type: "technique", phase: "transition", difficulty: 2, group: "Special", fixes: ["weak_leg_drive", "poor_dip"] },
  { id: "jerk_recovery", name_en: "jerk recovery", aliases: [], family: "jerk", type: "technique", phase: "recovery", difficulty: 2, group: "Special", fixes: ["weak_split", "overhead_instability"] },
  { id: "jerk_balance", name_en: "jerk balance", aliases: [], family: "jerk", type: "technique", phase: "receive", difficulty: 3, group: "Special", fixes: ["weak_split", "overhead_instability"] },
  { id: "jerk_support", name_en: "jerk support", aliases: ["overhead support hold"], family: "jerk", type: "technique", phase: "receive", difficulty: 2, group: "Special", fixes: ["overhead_instability", "weak_overhead"] },
  { id: "push_press", name_en: "push press", aliases: [], family: "jerk", type: "accessory", phase: "receive", difficulty: 2, group: "Special", diagnostics: ["overhead_strength"], fixes: ["weak_overhead", "weak_leg_drive"] },
  { id: "push_press_behind_neck", name_en: "push press behind the neck", aliases: ["bnpp"], family: "jerk", type: "accessory", phase: "receive", difficulty: 2, group: "Special", fixes: ["weak_overhead", "overhead_instability"] },
  { id: "strict_press", name_en: "strict press", aliases: ["military press", "overhead press"], family: "jerk", type: "accessory", phase: "receive", difficulty: 2, group: "Special", fixes: ["weak_overhead"] },
  { id: "pause_jerk", name_en: "jerk with pause in dip", aliases: ["pause jerk"], family: "jerk", type: "technique", phase: "transition", difficulty: 3, group: "Special", fixes: ["poor_dip", "early_drive"] },
  { id: "jerk_complex", name_en: "jerk complex", aliases: [], family: "jerk", type: "variation", phase: "receive", difficulty: 4, group: "Special", fixes: ["weak_jerk"] },
  { id: "split_jerk_from_blocks", name_en: "split jerk from blocks", aliases: [], family: "jerk", type: "variation", phase: "receive", difficulty: 4, group: "Special", fixes: ["weak_split", "weak_jerk"] },

  // ───────────────────────────── PULL FAMILY ───────────────────────────────
  { id: "snatch_pull", name_en: "snatch pull", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special", diagnostics: ["bar_path", "extension"], fixes: ["weak_pull", "no_extension", "bar_drift"] },
  { id: "clean_pull", name_en: "clean pull", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special", diagnostics: ["leg_drive"], fixes: ["weak_pull", "no_extension", "bar_drift"] },
  { id: "snatch_high_pull_dedicated", name_en: "snatch high pull (dedicated)", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special", fixes: ["weak_pull", "no_extension"] },
  { id: "clean_high_pull_dedicated", name_en: "clean high pull (dedicated)", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special", fixes: ["weak_pull", "no_extension"] },
  { id: "snatch_deficit_pull", name_en: "snatch pull from deficit", aliases: ["deficit snatch pull"], family: "pull", type: "strength", phase: "pull", difficulty: 4, group: "Special", fixes: ["weak_first_pull", "poor_position"] },
  { id: "clean_deficit_pull", name_en: "clean pull from deficit", aliases: ["deficit clean pull"], family: "pull", type: "strength", phase: "pull", difficulty: 4, group: "Special", fixes: ["weak_first_pull", "poor_position"] },
  { id: "snatch_block_pull_knee", name_en: "snatch pull from blocks at knee", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special", fixes: ["weak_second_pull", "bar_path_error"] },
  { id: "snatch_block_pull_below_knee", name_en: "snatch pull from blocks below knee", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special", fixes: ["weak_first_pull", "bar_path_error"] },
  { id: "clean_block_pull_knee", name_en: "clean pull from blocks at knee", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special", fixes: ["weak_second_pull", "bar_path_error"] },
  { id: "clean_block_pull_below_knee", name_en: "clean pull from blocks below knee", aliases: [], family: "pull", type: "strength", phase: "pull", difficulty: 3, group: "Special", fixes: ["weak_first_pull", "bar_path_error"] },
  { id: "snatch_pull_pause_knee", name_en: "snatch pull with pause at knee", aliases: [], family: "pull", type: "technique", phase: "pull", difficulty: 4, group: "Special", fixes: ["loss_of_position", "early_pull"] },
  { id: "clean_pull_pause_knee", name_en: "clean pull with pause at knee", aliases: [], family: "pull", type: "technique", phase: "pull", difficulty: 4, group: "Special", fixes: ["loss_of_position", "early_pull"] },
  { id: "snatch_rdl", name_en: "snatch grip Romanian deadlift", aliases: ["snatch grip rdl"], family: "pull", type: "accessory", phase: "pull", difficulty: 2, group: "General", fixes: ["weak_posterior_chain", "tight_hamstrings"] },
  { id: "clean_rdl", name_en: "clean grip Romanian deadlift", aliases: ["clean grip rdl"], family: "pull", type: "accessory", phase: "pull", difficulty: 2, group: "General", fixes: ["weak_posterior_chain", "tight_hamstrings"] },
  { id: "snatch_shrug", name_en: "snatch shrug", aliases: [], family: "pull", type: "accessory", phase: "pull", difficulty: 1, group: "General", fixes: ["no_extension", "weak_traps"] },
  { id: "clean_shrug", name_en: "clean shrug", aliases: [], family: "pull", type: "accessory", phase: "pull", difficulty: 1, group: "General", fixes: ["no_extension", "weak_traps"] },

  // ───────────────────────────── SQUAT ─────────────────────────────────────
  { id: "front_squat", name_en: "front squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General", diagnostics: ["clean_recovery"], fixes: ["weak_legs", "poor_recovery_from_clean"] },
  { id: "back_squat", name_en: "back squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General", diagnostics: ["general_strength"], fixes: ["weak_legs", "general_weakness"] },
  { id: "overhead_squat_dedicated", name_en: "overhead squat (dedicated)", aliases: [], family: "squat", type: "technique", phase: "receive", difficulty: 3, group: "General", fixes: ["overhead_instability", "poor_mobility"] },
  { id: "pause_front_squat", name_en: "pause front squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 4, group: "General", fixes: ["weak_legs", "poor_recovery_from_clean", "weak_bottom"] },
  { id: "pause_back_squat", name_en: "pause back squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 4, group: "General", fixes: ["weak_legs", "weak_bottom"] },
  { id: "tempo_front_squat", name_en: "tempo front squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General", fixes: ["weak_legs", "poor_control"] },
  { id: "tempo_back_squat", name_en: "tempo back squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General", fixes: ["weak_legs", "poor_control"] },
  { id: "box_squat", name_en: "box squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 2, group: "General", fixes: ["weak_legs", "weak_posterior_chain"] },
  { id: "bulgarian_split_squat", name_en: "Bulgarian split squat", aliases: ["rear foot elevated split squat"], family: "squat", type: "accessory", phase: "recovery", difficulty: 2, group: "General", fixes: ["leg_imbalance", "weak_legs"] },
  { id: "zercher_squat", name_en: "Zercher squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General", fixes: ["weak_upper_back", "weak_legs"] },
  { id: "ssb_squat", name_en: "safety bar squat", aliases: ["ssb squat"], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General", fixes: ["weak_legs", "weak_upper_back"] },
  { id: "jump_squat", name_en: "jump squat", aliases: [], family: "squat", type: "power", phase: "recovery", difficulty: 2, group: "General", fixes: ["weak_extension", "lack_of_power"] },
  { id: "anderson_squat", name_en: "Anderson squat", aliases: ["dead stop squat"], family: "squat", type: "strength", phase: "recovery", difficulty: 4, group: "General", fixes: ["weak_bottom", "weak_legs"] },
  { id: "pin_squat", name_en: "pin squat", aliases: [], family: "squat", type: "strength", phase: "recovery", difficulty: 3, group: "General", fixes: ["weak_legs", "weak_bottom"] },

  // ───────────────────────── GENERAL / ACCESSORY ───────────────────────────
  { id: "deadlift", name_en: "deadlift", aliases: ["conventional deadlift"], family: "general", type: "strength", phase: "pull", difficulty: 3, group: "General", fixes: ["weak_pull", "general_weakness"] },
  { id: "romanian_deadlift", name_en: "Romanian deadlift", aliases: ["rdl"], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General", fixes: ["weak_posterior_chain", "tight_hamstrings"] },
  { id: "snatch_grip_deadlift", name_en: "snatch grip deadlift", aliases: [], family: "general", type: "strength", phase: "pull", difficulty: 3, group: "General", fixes: ["weak_first_pull", "weak_upper_back"] },
  { id: "clean_grip_deadlift", name_en: "clean grip deadlift", aliases: [], family: "general", type: "strength", phase: "pull", difficulty: 3, group: "General", fixes: ["weak_first_pull", "general_weakness"] },
  { id: "good_morning", name_en: "good morning", aliases: [], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General", fixes: ["weak_posterior_chain", "weak_lower_back"] },
  { id: "hip_thrust", name_en: "barbell hip thrust", aliases: ["hip thrust"], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General", fixes: ["weak_glutes", "weak_extension"] },
  { id: "glute_bridge", name_en: "glute bridge", aliases: [], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General", fixes: ["weak_glutes"] },
  { id: "walking_lunge", name_en: "walking lunge", aliases: [], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General", fixes: ["leg_imbalance", "weak_legs"] },
  { id: "reverse_lunge", name_en: "reverse lunge", aliases: [], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General", fixes: ["leg_imbalance", "weak_legs"] },
  { id: "step_up", name_en: "step-up", aliases: ["box step up"], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General", fixes: ["leg_imbalance", "weak_legs"] },
  { id: "calf_raise", name_en: "calf raise", aliases: ["standing calf raise"], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General", fixes: ["weak_calves", "ankle_instability"] },
  { id: "nordic_curl", name_en: "Nordic hamstring curl", aliases: ["nordic curl"], family: "general", type: "accessory", phase: "recovery", difficulty: 4, group: "General", fixes: ["weak_hamstrings", "injury_prevention"] },
  { id: "pull_up", name_en: "pull-up", aliases: ["pullup"], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General", fixes: ["weak_back", "weak_grip"] },
  { id: "chin_up", name_en: "chin-up", aliases: ["chinup"], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General", fixes: ["weak_back", "weak_biceps"] },
  { id: "weighted_pull_up", name_en: "weighted pull-up", aliases: [], family: "general", type: "accessory", phase: "pull", difficulty: 3, group: "General", fixes: ["weak_back", "weak_pull"] },
  { id: "bent_over_row", name_en: "bent-over barbell row", aliases: ["bent over row"], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General", fixes: ["weak_back", "weak_pull"] },
  { id: "pendlay_row", name_en: "Pendlay row", aliases: [], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General", fixes: ["weak_back", "weak_pull"] },
  { id: "barbell_row", name_en: "barbell row", aliases: [], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General", fixes: ["weak_back", "weak_pull"] },
  { id: "t_bar_row", name_en: "T-bar row", aliases: ["tbar row"], family: "general", type: "accessory", phase: "pull", difficulty: 2, group: "General", fixes: ["weak_back", "weak_pull"] },
  { id: "dumbbell_row", name_en: "dumbbell row", aliases: ["one arm db row"], family: "general", type: "accessory", phase: "pull", difficulty: 1, group: "General", fixes: ["weak_back", "muscle_imbalance"] },
  { id: "plank", name_en: "plank", aliases: ["front plank"], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General", fixes: ["weak_core", "poor_stability"] },
  { id: "side_plank", name_en: "side plank", aliases: [], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General", fixes: ["weak_core", "weak_obliques"] },
  { id: "hanging_leg_raise", name_en: "hanging leg raise", aliases: [], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General", fixes: ["weak_core", "weak_grip"] },
  { id: "ab_wheel", name_en: "ab wheel rollout", aliases: ["ab wheel"], family: "general", type: "accessory", phase: "recovery", difficulty: 3, group: "General", fixes: ["weak_core", "poor_stability"] },
  { id: "back_extension", name_en: "back extension", aliases: ["hyperextension"], family: "general", type: "accessory", phase: "recovery", difficulty: 1, group: "General", fixes: ["weak_lower_back", "weak_posterior_chain"] },
  { id: "reverse_hyper", name_en: "reverse hyperextension", aliases: ["reverse hyper"], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General", fixes: ["weak_lower_back", "weak_glutes"] },
  { id: "farmer_carry", name_en: "farmer's carry", aliases: ["farmer walk", "farmers carry"], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General", fixes: ["weak_grip", "weak_core"] },
  { id: "sled_push", name_en: "sled push", aliases: ["prowler push"], family: "general", type: "accessory", phase: "recovery", difficulty: 2, group: "General", fixes: ["weak_legs", "lack_of_conditioning"] },
];

// ─────────────────── Movement-intelligence enrichment ───────────────────
// Incrementally enriches a curated subset of exercises with biomechanical
// metadata. Exercises not listed here keep their base shape — fully
// back-compatible. Add more entries over time without touching IDs.

const ENRICHMENT: Record<string, Partial<ExerciseDef>> = {
  // ── Classic competition lifts ────────────────────────────────────────
  snatch: {
    variant: "classic", role: "main", intent: "competition_execution",
    primary_phase: "receive", primary_position: "overhead", purpose: "trajectory",
    why: "Competition movement; trains full neuromuscular pattern.",
    improves: ["full_pattern", "speed_under", "overhead_stability"],
    use_when: ["competition_prep", "skill_maintenance"],
    avoid_when: ["high_fatigue", "low_readiness"],
    fatigue_cost: 8, recovery_demand: 8, fatigue_type: "cns",
    technical_complexity: 9, skill_stability_requirement: 9,
    transfer_to: { snatch: 1.0 },
  },
  clean: {
    variant: "classic", role: "main", intent: "competition_execution",
    primary_phase: "receive", primary_position: "rack", purpose: "trajectory",
    fatigue_cost: 8, recovery_demand: 8, fatigue_type: "cns",
    technical_complexity: 9, skill_stability_requirement: 9,
    transfer_to: { clean: 1.0 },
  },
  clean_and_jerk: {
    variant: "classic", role: "main", intent: "competition_execution",
    primary_phase: "receive", primary_position: "overhead", purpose: "trajectory",
    fatigue_cost: 9, recovery_demand: 9, fatigue_type: "cns",
    technical_complexity: 9, skill_stability_requirement: 9,
    transfer_to: { clean: 1.0, jerk: 1.0 },
  },
  jerk: {
    variant: "classic", role: "main", intent: "competition_execution",
    primary_phase: "lockout", primary_position: "overhead", purpose: "trajectory",
    fatigue_cost: 7, recovery_demand: 7, fatigue_type: "cns",
    technical_complexity: 8, skill_stability_requirement: 8,
    transfer_to: { jerk: 1.0 },
  },

  // ── Power variants ────────────────────────────────────────────────────
  power_snatch: {
    variant: "power", role: "overload", intent: "speed_strength",
    primary_phase: "extension", primary_position: "power_position", purpose: "extension",
    fatigue_cost: 6, recovery_demand: 5, fatigue_type: "cns",
    technical_complexity: 7, skill_stability_requirement: 7,
    transfer_to: { snatch: 0.7 },
  },
  power_clean: {
    variant: "power", role: "overload", intent: "speed_strength",
    primary_phase: "extension", primary_position: "power_position", purpose: "extension",
    fatigue_cost: 6, recovery_demand: 5, fatigue_type: "cns",
    technical_complexity: 7, skill_stability_requirement: 7,
    transfer_to: { clean: 0.7 },
  },

  // ── Hang variants ─────────────────────────────────────────────────────
  hang_snatch_high: {
    variant: "hang", role: "technical", intent: "positional_control",
    primary_phase: "extension", primary_position: "above_knee", purpose: "positioning",
    fatigue_cost: 5, recovery_demand: 4, fatigue_type: "mixed",
    technical_complexity: 7, skill_stability_requirement: 8,
    transfer_to: { snatch: 0.7 },
  },
  hang_snatch_low: {
    variant: "hang", role: "technical", intent: "positional_control",
    primary_phase: "first_pull", primary_position: "below_knee", purpose: "positioning",
    fatigue_cost: 6, recovery_demand: 5, fatigue_type: "mixed",
    technical_complexity: 8, skill_stability_requirement: 8,
    transfer_to: { snatch: 0.75 },
  },
  hang_clean_high: {
    variant: "hang", role: "technical", intent: "positional_control",
    primary_phase: "extension", primary_position: "above_knee", purpose: "positioning",
    fatigue_cost: 5, recovery_demand: 4, fatigue_type: "mixed",
    technical_complexity: 7, skill_stability_requirement: 8,
    transfer_to: { clean: 0.7 },
  },
  hang_clean_low: {
    variant: "hang", role: "technical", intent: "positional_control",
    primary_phase: "first_pull", primary_position: "below_knee", purpose: "positioning",
    fatigue_cost: 6, recovery_demand: 5, fatigue_type: "mixed",
    technical_complexity: 8, skill_stability_requirement: 8,
    transfer_to: { clean: 0.75 },
  },

  // ── Tall / muscle / balance — high skill ─────────────────────────────
  tall_snatch: {
    variant: "classic", role: "technical", intent: "speed_under",
    primary_phase: "pull_under", primary_position: "overhead", purpose: "speed",
    why: "Trains aggressive pull under the bar with no leg drive.",
    improves: ["speed_under", "turnover_speed", "timing"],
    use_when: ["slow_pull_under", "early_arm_bend", "skill_day"],
    avoid_when: ["low_readiness", "high_fatigue"],
    fatigue_cost: 3, recovery_demand: 2, fatigue_type: "cns",
    technical_complexity: 9, skill_stability_requirement: 9,
    transfer_to: { snatch: 0.55 },
  },
  tall_clean: {
    variant: "classic", role: "technical", intent: "speed_under",
    primary_phase: "pull_under", primary_position: "rack", purpose: "speed",
    fatigue_cost: 3, recovery_demand: 2, fatigue_type: "cns",
    technical_complexity: 9, skill_stability_requirement: 9,
    transfer_to: { clean: 0.55 },
  },
  muscle_snatch: {
    variant: "classic", role: "technical", intent: "technical_precision",
    primary_phase: "extension", primary_position: "power_position", purpose: "trajectory",
    fatigue_cost: 4, recovery_demand: 3, fatigue_type: "mixed",
    technical_complexity: 6, skill_stability_requirement: 7,
    transfer_to: { snatch: 0.45 },
  },
  snatch_balance: {
    variant: "classic", role: "technical", intent: "speed_under",
    primary_phase: "receive", primary_position: "overhead", purpose: "receive",
    fatigue_cost: 4, recovery_demand: 3, fatigue_type: "cns",
    technical_complexity: 8, skill_stability_requirement: 9,
    transfer_to: { snatch: 0.5 },
  },
  overhead_squat: {
    variant: "classic", role: "technical", intent: "positional_control",
    primary_phase: "receive", primary_position: "overhead", purpose: "stability",
    why: "Builds overhead stability and bottom-position confidence.",
    improves: ["overhead_stability", "mobility", "bottom_strength"],
    use_when: ["unstable_receive", "weak_legs", "skill_day"],
    avoid_when: ["shoulder_injury"],
    fatigue_cost: 5, recovery_demand: 4, fatigue_type: "mixed",
    technical_complexity: 8, skill_stability_requirement: 8,
    transfer_to: { snatch: 0.4 },
  },

  // ── Pulls ─────────────────────────────────────────────────────────────
  snatch_pull: {
    variant: "classic", role: "overload", intent: "max_force",
    primary_phase: "extension", primary_position: "hip_contact", purpose: "extension",
    why: "Overloads the second pull and trains full extension.",
    improves: ["extension", "pull_strength", "bar_path"],
    use_when: ["weak_pull", "no_extension", "bar_drift"],
    avoid_when: ["high_cns_fatigue"],
    fatigue_cost: 6, recovery_demand: 5, fatigue_type: "local",
    technical_complexity: 4, skill_stability_requirement: 5,
    transfer_to: { snatch: 0.85 },
  },
  clean_pull: {
    variant: "classic", role: "overload", intent: "max_force",
    primary_phase: "extension", primary_position: "hip_contact", purpose: "extension",
    fatigue_cost: 7, recovery_demand: 6, fatigue_type: "local",
    technical_complexity: 4, skill_stability_requirement: 5,
    transfer_to: { clean: 0.85 },
  },
  snatch_high_pull: {
    role: "overload", intent: "speed_strength",
    primary_phase: "extension", purpose: "speed",
    fatigue_cost: 5, recovery_demand: 4, fatigue_type: "mixed",
    technical_complexity: 5, skill_stability_requirement: 5,
    transfer_to: { snatch: 0.65 },
  },
  snatch_deadlift: {
    variant: "classic", role: "overload", intent: "max_force",
    primary_phase: "first_pull", primary_position: "floor", purpose: "positioning",
    fatigue_cost: 7, recovery_demand: 7, fatigue_type: "local",
    technical_complexity: 3, skill_stability_requirement: 4,
    transfer_to: { snatch: 0.7 },
  },
  clean_deadlift: {
    variant: "classic", role: "overload", intent: "max_force",
    primary_phase: "first_pull", primary_position: "floor", purpose: "positioning",
    fatigue_cost: 8, recovery_demand: 8, fatigue_type: "local",
    technical_complexity: 3, skill_stability_requirement: 4,
    transfer_to: { clean: 0.7 },
  },

  // ── Pause variants ────────────────────────────────────────────────────
  snatch_pause_knee: {
    variant: "pause", role: "technical", intent: "positional_control",
    primary_phase: "transition", primary_position: "above_knee", purpose: "positioning",
    fatigue_cost: 5, recovery_demand: 4, fatigue_type: "mixed",
    technical_complexity: 7, skill_stability_requirement: 8,
    transfer_to: { snatch: 0.75 },
  },
  clean_pause_knee: {
    variant: "pause", role: "technical", intent: "positional_control",
    primary_phase: "transition", primary_position: "above_knee", purpose: "positioning",
    fatigue_cost: 5, recovery_demand: 4, fatigue_type: "mixed",
    technical_complexity: 7, skill_stability_requirement: 8,
    transfer_to: { clean: 0.75 },
  },

  // ── Jerk family ───────────────────────────────────────────────────────
  push_press: {
    role: "overload", intent: "max_force",
    primary_phase: "drive", primary_position: "overhead", purpose: "extension",
    fatigue_cost: 5, recovery_demand: 4, fatigue_type: "mixed",
    technical_complexity: 4, skill_stability_requirement: 5,
    transfer_to: { jerk: 0.6 },
  },
  push_jerk: {
    role: "technical", intent: "speed_under",
    primary_phase: "pull_under", primary_position: "overhead", purpose: "speed",
    fatigue_cost: 5, recovery_demand: 4, fatigue_type: "cns",
    technical_complexity: 6, skill_stability_requirement: 7,
    transfer_to: { jerk: 0.7 },
  },
  split_jerk: {
    variant: "classic", role: "main", intent: "competition_execution",
    primary_phase: "split", primary_position: "overhead", purpose: "trajectory",
    fatigue_cost: 6, recovery_demand: 5, fatigue_type: "cns",
    technical_complexity: 8, skill_stability_requirement: 9,
    transfer_to: { jerk: 1.0 },
  },
  jerk_dip: {
    role: "technical", intent: "positional_control",
    primary_phase: "dip", primary_position: "rack", purpose: "positioning",
    fatigue_cost: 3, recovery_demand: 2, fatigue_type: "local",
    technical_complexity: 4, skill_stability_requirement: 5,
    transfer_to: { jerk: 0.4 },
  },
  jerk_drive: {
    role: "technical", intent: "speed_strength",
    primary_phase: "drive", primary_position: "rack", purpose: "extension",
    fatigue_cost: 4, recovery_demand: 3, fatigue_type: "mixed",
    technical_complexity: 4, skill_stability_requirement: 5,
    transfer_to: { jerk: 0.5 },
  },
  jerk_balance: {
    role: "technical", intent: "positional_control",
    primary_phase: "split", primary_position: "overhead", purpose: "balance",
    fatigue_cost: 3, recovery_demand: 2, fatigue_type: "cns",
    technical_complexity: 6, skill_stability_requirement: 8,
    transfer_to: { jerk: 0.5 },
  },
  jerk_support: {
    role: "accessory", intent: "positional_control",
    primary_phase: "lockout", primary_position: "overhead", purpose: "stability",
    fatigue_cost: 2, recovery_demand: 1, fatigue_type: "local",
    technical_complexity: 3, skill_stability_requirement: 4,
    transfer_to: { jerk: 0.3 },
  },

  // ── Squats ────────────────────────────────────────────────────────────
  front_squat: {
    role: "overload", intent: "max_force",
    primary_phase: "recovery", primary_position: "rack", purpose: "stability",
    fatigue_cost: 7, recovery_demand: 6, fatigue_type: "local",
    technical_complexity: 4, skill_stability_requirement: 5,
    transfer_to: { clean: 0.8, jerk: 0.5 },
  },
  back_squat: {
    role: "overload", intent: "max_force",
    primary_phase: "recovery", purpose: "stability",
    fatigue_cost: 8, recovery_demand: 7, fatigue_type: "local",
    technical_complexity: 3, skill_stability_requirement: 4,
    transfer_to: { clean: 0.5, snatch: 0.4 },
  },
  pause_front_squat: {
    variant: "pause", role: "overload", intent: "positional_control",
    primary_phase: "recovery", primary_position: "rack", purpose: "stability",
    fatigue_cost: 7, recovery_demand: 7, fatigue_type: "local",
    technical_complexity: 5, skill_stability_requirement: 6,
    transfer_to: { clean: 0.75 },
  },
  pause_back_squat: {
    variant: "pause", role: "overload", intent: "positional_control",
    primary_phase: "recovery", purpose: "stability",
    fatigue_cost: 7, recovery_demand: 7, fatigue_type: "local",
    technical_complexity: 4, skill_stability_requirement: 5,
    transfer_to: { clean: 0.45, snatch: 0.4 },
  },
};

// Apply enrichment in-place once at module load. Preserves all existing
// fields; only fills in new metadata where defined.
for (const ex of EXERCISE_DB) {
  const enrich = ENRICHMENT[ex.id];
  if (enrich) Object.assign(ex, enrich);
}

// ─────────────────── Lookup helpers ───────────────────

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

// ─────────────────── Movement-intelligence helpers ───────────────────

export function getExercisesByRole(role: ExerciseRole): ExerciseDef[] {
  return EXERCISE_DB.filter((e) => e.role === role);
}

export function getExercisesByIntent(intent: ExerciseIntent): ExerciseDef[] {
  return EXERCISE_DB.filter((e) => e.intent === intent);
}

export function getExercisesByPhase(phase: MovementPhase): ExerciseDef[] {
  return EXERCISE_DB.filter(
    (e) => e.primary_phase === phase || e.secondary_phases?.includes(phase),
  );
}

export interface SafetyCtx {
  readiness: number; // 0..10
  fatigue: number;   // 0..100
}

export function getSafeExercises(
  pool: ExerciseDef[],
  ctx: SafetyCtx,
): ExerciseDef[] {
  return pool.filter((ex) => {
    const tc = ex.technical_complexity ?? ex.difficulty;
    const fc = ex.fatigue_cost ?? ex.difficulty * 1.5;
    if (tc > ctx.readiness + 2) return false;
    if (ctx.readiness < 4 && tc >= 8) return false;
    if (ctx.fatigue > 80 && ex.fatigue_type === "cns") return false;
    if (ctx.fatigue > 90 && fc >= 7) return false;
    return true;
  });
}

export function getHighTransferExercises(
  lift: keyof TransferProfile,
  threshold = 0.6,
): ExerciseDef[] {
  return EXERCISE_DB
    .filter((e) => (e.transfer_to?.[lift] ?? 0) >= threshold)
    .sort((a, b) => (b.transfer_to![lift]! - a.transfer_to![lift]!));
}

