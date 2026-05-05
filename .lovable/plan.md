## Expand EXERCISE_DB to 120+ exercises

Rewrite `src/lib/exercise-db.ts` with an expanded catalog using a new schema, while keeping all existing helper functions (`getExerciseById`, `getExerciseByName`, `getExercisesByFamily`) backward compatible.

### Schema changes

Update `ExerciseDef` to the requested shape:

```ts
type ExerciseFamily = "snatch" | "clean" | "jerk" | "pull" | "squat" | "general";
type ExerciseType   = "main" | "variation" | "power" | "strength" | "technique" | "accessory";
type ExercisePhase  = "pull" | "transition" | "receive" | "recovery";

interface ExerciseDef {
  id: string;
  name_en: string;          // canonical IWF term
  aliases: string[];
  family: ExerciseFamily;
  type: ExerciseType;
  phase: ExercisePhase;
  difficulty: 1 | 2 | 3 | 4 | 5;
  // legacy-compatible (kept optional, no longer required)
  group?: "Main" | "Special" | "General";
  phases?: string[];
  diagnostics?: string[];
}
```

Legacy fields stay optional so callers in `training-engine.ts` / `adaptive-workout.ts` that read `family`, `group`, or `diagnostics` keep working. I'll verify those call sites before writing.

### Catalog (≥120 exercises, no duplicates, IWF terminology)

Counts per family (totals 124):

- Snatch family — 26: snatch, power_snatch, hang_snatch_high, hang_snatch_low, snatch_from_blocks_knee, snatch_from_blocks_below_knee, snatch_from_blocks_above_knee, snatch_pause_knee, snatch_pause_below_knee, tall_snatch, muscle_snatch, no_feet_snatch, snatch_balance, drop_snatch, heaving_snatch_balance, pressing_snatch_balance, snatch_high_pull, snatch_deadlift, snatch_deadlift_pause, snatch_segment_pull, snatch_lift_off, overhead_squat, snatch_grip_push_press, snatch_grip_behind_neck_press, snatch_complex, snatch_panda_pull
- Clean family — 22: clean, power_clean, hang_clean_high, hang_clean_low, clean_from_blocks_knee, clean_from_blocks_below_knee, clean_from_blocks_above_knee, clean_pause_knee, clean_pause_below_knee, tall_clean, muscle_clean, no_feet_clean, clean_high_pull, clean_deadlift, clean_deadlift_pause, clean_segment_pull, clean_lift_off, clean_complex, clean_panda_pull, clean_and_jerk, hang_power_clean, deficit_clean
- Jerk family — 18: jerk, push_jerk, split_jerk, power_jerk, squat_jerk, jerk_from_rack, jerk_behind_neck, jerk_dip, jerk_drive, jerk_recovery, jerk_balance, jerk_support, push_press, push_press_behind_neck, strict_press, pause_jerk, jerk_complex, split_jerk_from_blocks
- Pull family — 16: snatch_pull, clean_pull, snatch_high_pull_dedicated, clean_high_pull_dedicated, snatch_deficit_pull, clean_deficit_pull, snatch_block_pull_knee, snatch_block_pull_below_knee, clean_block_pull_knee, clean_block_pull_below_knee, snatch_pull_pause_knee, clean_pull_pause_knee, snatch_rdl, clean_rdl, snatch_shrug, clean_shrug
- Squat — 14: front_squat, back_squat, overhead_squat_dedicated, pause_front_squat, pause_back_squat, tempo_front_squat, tempo_back_squat, box_squat, bulgarian_split_squat, zercher_squat, ssb_squat, jump_squat, anderson_squat, pin_squat
- General/accessory — 28: deadlift, romanian_deadlift, snatch_grip_deadlift, clean_grip_deadlift, good_morning, hip_thrust, glute_bridge, walking_lunge, reverse_lunge, step_up, calf_raise, nordic_curl, pull_up, chin_up, weighted_pull_up, bent_over_row, pendlay_row, barbell_row, t_bar_row, dumbbell_row, plank, side_plank, hanging_leg_raise, ab_wheel, back_extension, reverse_hyper, farmer_carry, sled_push

(IDs renamed to avoid duplicates such as `snatch_high_pull` appearing in both snatch and pull groups — pull-family duplicate is suffixed `_dedicated`.)

Each entry will set:
- correct `family`, `type`, `phase`, `difficulty`
- `aliases` with common gym/coach names (e.g. clean_and_jerk → ["c&j", "cj", "clean and jerk"])

### Verification

Before writing, read `src/lib/training-engine.ts` and `src/lib/adaptive-workout.ts` to confirm which `ExerciseDef` fields they consume, so the schema migration doesn't break them.

### Files

- `src/lib/exercise-db.ts` — full rewrite with new schema + 124 entries
