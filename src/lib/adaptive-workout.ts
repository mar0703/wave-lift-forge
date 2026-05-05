// Wraps generateWorkout: detects ratio-based weaknesses and injects
// corrective exercises. ALL exercise lookups go through EXERCISE_DB —
// no regex on names, families decide volume boosts.

import {
  generateWorkout,
  buildBlock,
  type EngineInput,
  type WorkoutOutput,
  type ExerciseBlock,
} from "./training-engine";
import { detectProblems, correctivesForProblems } from "./diagnostics";
import { getExerciseById } from "./exercise-db";

export interface AugmentInput extends EngineInput {
  user_maxes: Record<string, number>;
}

export interface AugmentedWorkout extends WorkoutOutput {
  detected_problems: string[];
  injected_exercises: string[];
  problem_focus: string[];
}

const CLEAN_VOLUME_BOOST = 1.25;
const SQUAT_VOLUME_BOOST = 1.2;
const PULL_VOLUME_BOOST = 1.2;

const PROBLEM_FOCUS: Record<string, string> = {
  weak_clean: "Clean strength",
  weak_jerk: "Jerk drive",
  weak_legs: "Leg strength",
  weak_pull: "Pull strength",
};

export function generateAdaptiveWorkout(input: AugmentInput): AugmentedWorkout {
  const base = generateWorkout(input);
  const problems = detectProblems(input.user_maxes);

  // 1) Volume boosts driven by family (no string regex).
  const exercises: ExerciseBlock[] = base.exercises.map((ex) => {
    let sets = ex.sets;
    if (problems.includes("weak_clean") && ex.family === "clean") {
      sets = Math.round(sets * CLEAN_VOLUME_BOOST);
    }
    if (problems.includes("weak_legs") && ex.family === "squat") {
      sets = Math.round(sets * SQUAT_VOLUME_BOOST);
    }
    if (problems.includes("weak_pull") && ex.family === "pull") {
      sets = Math.round(sets * PULL_VOLUME_BOOST);
    }
    return { ...ex, sets };
  });

  // 2) Inject corrective exercises (skip ones already present by id).
  const presentIds = new Set(exercises.map((e) => e.exercise_id));
  const correctiveIds = correctivesForProblems(problems).slice(0, 3);
  const injected: string[] = [];
  const intensity = base.adjusted_intensity / 100;

  for (const id of correctiveIds) {
    const existing = exercises.find((e) => e.exercise_id === id);
    if (existing) {
      existing.sets = Math.round(existing.sets * 1.2);
      continue;
    }
    const ex = getExerciseById(id);
    if (!ex) continue;

    let modifier = 0.9;
    if (ex.family === "pull") modifier = 1.05;
    if (ex.type === "power") modifier = 0.75;
    if (ex.phase === "receive") modifier = 0.7;

    const refMax =
      ex.family === "snatch" ? input.daily_snatch_max : input.daily_clean_jerk_max;

    const block = buildBlock(id, refMax * modifier, intensity);
    if (!block) continue;
    exercises.push(block);
    injected.push(ex.name_en);
    presentIds.add(id);
  }

  return {
    ...base,
    exercises,
    detected_problems: problems,
    injected_exercises: injected,
    problem_focus: problems.map((p) => PROBLEM_FOCUS[p] || p),
    notes: [
      ...base.notes,
      ...(problems.length ? [`Detected weaknesses: ${problems.join(", ")}`] : []),
      ...(injected.length ? [`Injected correctives: ${injected.join(", ")}`] : []),
    ],
  };
}
