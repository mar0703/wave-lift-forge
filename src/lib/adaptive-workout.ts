// Wrapper around generateWorkout that injects corrective work based on
// detected weaknesses. Does NOT modify engine logic — only augments output.

import { generateWorkout, type EngineInput, type WorkoutOutput, type ExerciseBlock } from "./training-engine";
import { detectProblems } from "./exercise-ratios";
import { exercisesForProblems, getProblem } from "./problems";
import { getExerciseById } from "./exercise-catalog";

export interface AugmentInput extends EngineInput {
  user_maxes: Record<string, number>; // exercise id -> current max kg
}

export interface AugmentedWorkout extends WorkoutOutput {
  detected_problems: string[];
  injected_exercises: string[];
  problem_focus: string[];
}

const CLEAN_VOLUME_BOOST = 1.25;

function setsRepsForIntensity(i: number) {
  const pct = i * 100;
  if (pct < 70) return { sets: 5, reps: 4 };
  if (pct < 80) return { sets: 5, reps: 3 };
  if (pct < 90) return { sets: 4, reps: 2 };
  return { sets: 3, reps: 1 };
}

const round25 = (kg: number) => Math.round(kg / 2.5) * 2.5;

export function generateAdaptiveWorkout(input: AugmentInput): AugmentedWorkout {
  const base = generateWorkout(input);
  const problems = detectProblems(input.user_maxes);

  // 1) Volume boosts for specific problems (mutates a copy, not engine state)
  const exercises: ExerciseBlock[] = base.exercises.map((ex) => {
    let sets = ex.sets;
    if (problems.includes("weak_clean") && /clean/i.test(ex.exercise)) {
      sets = Math.round(sets * CLEAN_VOLUME_BOOST);
    }
    if (problems.includes("weak_legs") && /squat/i.test(ex.exercise)) {
      sets = Math.round(sets * 1.2);
    }
    if (problems.includes("weak_pull") && /pull/i.test(ex.exercise)) {
      sets = Math.round(sets * 1.2);
    }
    return { ...ex, sets };
  });

  // 2) Inject corrective exercises (skip ones already present)
  const present = new Set(exercises.map((e) => e.exercise.toLowerCase()));
  const correctiveIds = exercisesForProblems(problems).slice(0, 2); // ограничение
  const injected: string[] = [];
  const intensity = base.adjusted_intensity / 100;

  for (const id of correctiveIds) {
    const cat = getExerciseById(id);
    if (!cat) continue;
    if (present.has(cat.name.toLowerCase())) continue;

    const isPull = cat.type === "pull";
    const isSpeed = cat.type === "speed";
    const isReceive = cat.type === "receive";

    let modifier = 0.9;
    if (isPull) modifier = 1.05;
    if (isSpeed) modifier = 0.75;
    if (isReceive) modifier = 0.7;

    const isSnatchFamily = /snatch/i.test(id);
    const refMax = isSnatchFamily
      ? input.daily_snatch_max
      : input.daily_clean_jerk_max;

    const sr = setsRepsForIntensity(intensity);
    exercises.push({
      exercise: cat.name,
      group: cat.group,
      sets: Math.max(2, sr.sets - 1),
      reps: sr.reps + 1,
      intensity_pct: Math.round(intensity * 1000) / 10,
      weight_kg: round25(refMax * intensity * modifier),
    });
    injected.push(cat.name);
  }

  const focus = problems
    .map((p) => getProblem(p)?.focus)
    .filter((f): f is string => Boolean(f));

  return {
    ...base,
    exercises,
    detected_problems: problems,
    injected_exercises: injected,
    problem_focus: [...new Set(focus)],
    notes: [
      ...base.notes,
      ...(problems.length ? [`Detected weaknesses: ${problems.join(", ")}`] : []),
      ...(injected.length ? [`Injected correctives: ${injected.join(", ")}`] : []),
    ],
  };
}
