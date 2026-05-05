// ADAPTER LAYER
// engine -> UI. Pure mapping. Does NOT touch engine logic.

import type { ExerciseBlock } from "./training-engine";
import type { AugmentedWorkout } from "./adaptive-workout";

export interface UIExercise {
  name: string;
  group: "Main" | "Special" | "General";
  sets: number;
  reps: number;
  weight_kg: number;
  intensity_pct: number;
  prescription: string; // e.g. "5 x 3 @ 75%"
}

export interface UIBlock {
  name: "Main" | "Special" | "General";
  exercises: UIExercise[];
}

export interface UIWorkout {
  day: number;
  intensity: number; // adjusted intensity %
  base_intensity: number;
  blocks: UIBlock[];
  notes: string[];
  detected_problems: string[];
  injected_exercises: string[];
  problem_focus: string[];
}

const GROUPS: Array<UIBlock["name"]> = ["Main", "Special", "General"];

function toUIExercise(e: ExerciseBlock): UIExercise {
  return {
    name: e.exercise,
    group: e.group,
    sets: e.sets,
    reps: e.reps,
    weight_kg: e.weight_kg,
    intensity_pct: e.intensity_pct,
    prescription: `${e.sets} x ${e.reps} @ ${e.intensity_pct}%`,
  };
}

export function mapWorkoutToUI(workout: AugmentedWorkout): UIWorkout {
  const blocks: UIBlock[] = GROUPS.map((g) => ({
    name: g,
    exercises: workout.exercises.filter((e) => e.group === g).map(toUIExercise),
  })).filter((b) => b.exercises.length > 0);

  return {
    day: workout.day,
    intensity: workout.adjusted_intensity,
    base_intensity: workout.base_intensity,
    blocks,
    notes: workout.notes,
    detected_problems: workout.detected_problems,
    injected_exercises: workout.injected_exercises,
    problem_focus: workout.problem_focus,
  };
}
