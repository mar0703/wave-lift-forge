// Olympic Weightlifting Training Engine

export type BodyType = "ecto" | "meso" | "endo";
export type Dosha = "vata" | "pitta" | "kapha";

export interface EngineInput {
  daily_snatch_max: number;
  daily_clean_jerk_max: number;
  readiness: number; // 1-10
  fatigue_score: number; // 0-100
  body_type: BodyType;
  dosha: Dosha;
  training_day_index: 1 | 2 | 3 | 4 | 5;
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
  exercise: string;
  group: "Main" | "Special" | "General";
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

function setsRepsForIntensity(i: number): { sets: number; reps: number } {
  const pct = i * 100;
  if (pct < 70) return { sets: 5, reps: 4 };
  if (pct < 80) return { sets: 5, reps: 3 };
  if (pct < 90) return { sets: 4, reps: 2 };
  return { sets: 3, reps: 1 };
}

export function generateWorkout(input: EngineInput): WorkoutOutput {
  const notes: string[] = [];
  const base = WAVE[input.training_day_index];
  const fMod = fatigueModifier(input.fatigue_score);
  let adjusted = base * (0.85 + 0.03 * input.readiness) * fMod;

  // Body type
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

  // Dosha
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

  const blocks: { name: string; group: ExerciseBlock["group"]; max: number; intensityShift: number }[] = [
    { name: "Snatch", group: "Main", max: input.daily_snatch_max, intensityShift: 0 },
    { name: "Clean & Jerk", group: "Main", max: input.daily_clean_jerk_max, intensityShift: 0 },
    { name: "Snatch Pull", group: "Special", max: input.daily_snatch_max, intensityShift: 0.05 },
    { name: "Clean Pull", group: "Special", max: input.daily_clean_jerk_max, intensityShift: 0.05 },
    { name: "Back Squat", group: "General", max: input.daily_clean_jerk_max * 1.2, intensityShift: -0.05 },
  ];

  const exercises: ExerciseBlock[] = blocks.map((b) => {
    const eIntensity = Math.min(adjusted + b.intensityShift, 1.0);
    const sr = setsRepsForIntensity(eIntensity);
    const sets = Math.max(1, Math.round(sr.sets * setMultiplier * volumeMultiplier));
    const weight = round25(b.max * eIntensity);
    return {
      exercise: b.name,
      group: b.group,
      sets,
      reps: sr.reps,
      intensity_pct: Math.round(eIntensity * 1000) / 10,
      weight_kg: weight,
    };
  });

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
    Math.min(100, p.previous_fatigue + p.session_load_factor - p.recovery_factor)
  );

  return {
    next_intensity: Math.round(next * 1000) / 1000,
    next_intensity_pct: Math.round(next * 1000) / 10,
    new_fatigue_score: Math.round(newFatigue * 10) / 10,
    adjustments: adj,
  };
}
