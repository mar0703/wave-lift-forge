// Olympic Weightlifting Training Engine
// All exercises are referenced by EXERCISE_DB id — no string matching.

import { getExerciseById, type ExerciseGroup } from "./exercise-db";

export type BodyType = "ecto" | "meso" | "endo";
export type Dosha = "vata" | "pitta" | "kapha";

export type BodyTendency = "lose_easily" | "stable" | "gain_easily";
export type StressResponse = "anxious" | "aggressive" | "calm";

export interface ProfileAssessment {
  energy_level: number; // 1-10
  recovery_speed: number; // 1-10
  body_tendency: BodyTendency;
  stress_response: StressResponse;
  sleep_quality: number; // 1-10
}

export interface EngineInput {
  daily_snatch_max: number;
  daily_clean_jerk_max: number;
  readiness: number; // 1-10
  fatigue_score: number; // 0-100
  body_type: BodyType;
  dosha: Dosha;
  training_day_index: 1 | 2 | 3 | 4 | 5;
  profile_assessment?: ProfileAssessment;
}

export interface PostWorkoutInput {
  success_rate: number; // 0-100
  average_RPE: number; // 0-10
  current_intensity: number; // 0-1
  previous_fatigue: number;
  session_load_factor: number;
  recovery_factor: number;
}

export interface ExerciseBlock {
  exercise_id: string;
  name_en: string;
  family: string;
  group: ExerciseGroup;
  sets: number;
  reps: number;
  intensity_pct: number;
  weight_kg: number;
}

export interface WorkoutOutput {
  day: number;
  base_intensity: number;
  adjusted_intensity: number;
  fatigue_modifier: number;
  body_type: BodyType;
  dosha: Dosha;
  notes: string[];
  exercises: ExerciseBlock[];
}

const WAVE: Record<number, number> = { 1: 0.7, 2: 0.8, 3: 0.6, 4: 0.85, 5: 0.75 };

const round25 = (kg: number) => Math.round(kg / 2.5) * 2.5;

function fatigueModifier(f: number): number {
  if (f > 70) return 0.85;
  if (f >= 40) return 1.0;
  return 1.05;
}

export function setsRepsForIntensity(i: number): { sets: number; reps: number } {
  const pct = i * 100;
  if (pct < 70) return { sets: 5, reps: 4 };
  if (pct < 80) return { sets: 5, reps: 3 };
  if (pct < 90) return { sets: 4, reps: 2 };
  return { sets: 3, reps: 1 };
}

export function buildBlock(
  exerciseId: string,
  refMax: number,
  intensity: number,
  setMultiplier = 1,
  volumeMultiplier = 1,
): ExerciseBlock | null {
  const ex = getExerciseById(exerciseId);
  if (!ex) return null;
  const sr = setsRepsForIntensity(intensity);
  const sets = Math.max(1, Math.round(sr.sets * setMultiplier * volumeMultiplier));
  return {
    exercise_id: ex.id,
    name_en: ex.name_en,
    family: ex.family,
    group: ex.group,
    sets,
    reps: sr.reps,
    intensity_pct: Math.round(intensity * 1000) / 10,
    weight_kg: round25(refMax * intensity),
  };
}

export function generateWorkout(input: EngineInput): WorkoutOutput {
  const notes: string[] = [];
  const base = WAVE[input.training_day_index];
  const fMod = fatigueModifier(input.fatigue_score);
  let adjusted = base * (0.85 + 0.03 * input.readiness) * fMod;

  let setMultiplier = 1;
  if (input.body_type === "ecto") {
    setMultiplier = 0.8;
    adjusted *= 1.02;
    notes.push("Ectomorph: fewer sets, slightly higher intensity");
  } else if (input.body_type === "endo") {
    setMultiplier = 1.2;
    adjusted *= 0.97;
    notes.push("Endomorph: more sets, lower intensity, longer rest");
  } else {
    notes.push("Mesomorph: balanced loading");
  }

  let volumeMultiplier = 1;
  if (input.dosha === "vata") {
    adjusted *= 0.95;
    volumeMultiplier = 1.1;
    notes.push("Vata: −5% intensity, +10% volume");
  } else if (input.dosha === "pitta") {
    notes.push("Pitta: keep intensity, occasional deload");
  } else {
    volumeMultiplier = 1.15;
    notes.push("Kapha: +15% volume, longer rest");
  }

  adjusted = Math.min(adjusted, 1.0);

  const blocks: { id: string; max: number; intensityShift: number }[] = [
    { id: "snatch", max: input.daily_snatch_max, intensityShift: 0 },
    { id: "clean_jerk", max: input.daily_clean_jerk_max, intensityShift: 0 },
    { id: "snatch_pull", max: input.daily_snatch_max, intensityShift: 0.05 },
    { id: "clean_pull", max: input.daily_clean_jerk_max, intensityShift: 0.05 },
    { id: "back_squat", max: input.daily_clean_jerk_max * 1.2, intensityShift: -0.05 },
  ];

  const exercises: ExerciseBlock[] = blocks
    .map((b) => {
      const eIntensity = Math.min(adjusted + b.intensityShift, 1.0);
      return buildBlock(b.id, b.max, eIntensity, setMultiplier, volumeMultiplier);
    })
    .filter((b): b is ExerciseBlock => b !== null);

  return {
    day: input.training_day_index,
    base_intensity: Math.round(base * 1000) / 10,
    adjusted_intensity: Math.round(adjusted * 1000) / 10,
    fatigue_modifier: fMod,
    body_type: input.body_type,
    dosha: input.dosha,
    notes,
    exercises,
  };
}

export interface AdaptationResult {
  next_intensity: number;
  next_intensity_pct: number;
  new_fatigue_score: number;
  adjustments: string[];
}

export function postWorkoutAdaptation(p: PostWorkoutInput): AdaptationResult {
  let next = p.current_intensity;
  const adj: string[] = [];

  if (p.success_rate < 70) {
    next *= 0.95;
    adj.push("Success < 70% → −5% intensity");
  }
  if (p.average_RPE > 9) {
    next *= 0.97;
    adj.push("RPE > 9 → −3% intensity");
  }
  if (p.success_rate > 90 && p.average_RPE < 7) {
    next *= 1.025;
    adj.push("Success > 90% & RPE < 7 → +2.5% intensity");
  }
  if (adj.length === 0) adj.push("Hold intensity");

  const newFatigue = Math.max(
    0,
    Math.min(100, p.previous_fatigue + p.session_load_factor - p.recovery_factor),
  );

  return {
    next_intensity: Math.round(next * 1000) / 1000,
    next_intensity_pct: Math.round(next * 1000) / 10,
    new_fatigue_score: Math.round(newFatigue * 10) / 10,
    adjustments: adj,
  };
}

// Auto-detect dosha from profile assessment answers.
export function detectDosha(profile: ProfileAssessment): Dosha {
  let vata = 0;
  let pitta = 0;
  let kapha = 0;

  if (profile.energy_level < 5) vata += 2;
  if (profile.recovery_speed < 5) vata += 2;
  if (profile.stress_response === "anxious") vata += 2;

  if (profile.energy_level > 7) pitta += 2;
  if (profile.stress_response === "aggressive") pitta += 2;

  if (profile.body_tendency === "gain_easily") kapha += 3;
  if (profile.recovery_speed > 7) kapha += 1;

  const max = Math.max(vata, pitta, kapha);
  if (max === vata) return "vata";
  if (max === pitta) return "pitta";
  return "kapha";
}
