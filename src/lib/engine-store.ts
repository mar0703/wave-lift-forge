// Shared engine state with localStorage persistence + tiny pub/sub so
// screens stay in sync without a heavy state library.
import { useEffect, useSyncExternalStore } from "react";
import {
  generateWorkout,
  postWorkoutAdaptation,
  type EngineInput,
  type WorkoutOutput,
  type AdaptationResult,
} from "./training-engine";
import {
  generateAdaptiveWorkout,
  type AugmentedWorkout,
} from "./adaptive-workout";
import {
  getProblemsFromExercise,
  type ExerciseResult,
} from "./diagnostics";
import { getExerciseById } from "./exercise-db";
import { runCoachPipeline, type AthleteState, type CoachOutput } from "./coach-engine";

export interface FixPerformance {
  exercise_id: string;
  name: string;
  status: "ok" | "struggling";
  success_rate: number;
  avg_rpe: number;
}

const KEY = "iron-method-state-v1";

export interface SessionLog {
  date: string; // ISO
  day: number;
  adjusted_intensity: number;
  success_rate: number;
  average_RPE: number;
  total_sets: number;
}

export interface EngineState {
  input: EngineInput;
  user_maxes: Record<string, number>;
  workout: AugmentedWorkout | WorkoutOutput | null;
  adaptation: AdaptationResult | null;
  history: SessionLog[];
  correction_state: Record<string, number>;
  fix_performance: FixPerformance[];
  coach: CoachOutput | null;
  competition_mode: boolean;
  last_session_results: ExerciseResult[];
}

const defaultState: EngineState = {
  input: {
    daily_snatch_max: 100,
    daily_clean_jerk_max: 130,
    readiness: 7,
    fatigue_score: 45,
    body_type: "meso",
    dosha: "pitta",
    training_day_index: 1,
    profile_assessment: {
      energy_level: 7,
      recovery_speed: 7,
      body_tendency: "stable",
      stress_response: "calm",
      sleep_quality: 7,
    },
  },
  user_maxes: {
    snatch: 100,
    clean_jerk: 130,
    front_squat: 150,
    back_squat: 170,
  },
  workout: null,
  adaptation: null,
  history: [],
  correction_state: {},
  fix_performance: [],
  coach: null,
  competition_mode: false,
  last_session_results: [],
};

let state: EngineState = load();
const listeners = new Set<() => void>();

function load(): EngineState {
  if (typeof localStorage === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

function persist() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function setState(partial: Partial<EngineState>) {
  state = { ...state, ...partial };
  persist();
  listeners.forEach((l) => l());
}

export const engineStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  setInput(patch: Partial<EngineInput>) {
    setState({ input: { ...state.input, ...patch } });
  },
  setMax(id: string, kg: number) {
    setState({ user_maxes: { ...state.user_maxes, [id]: kg } });
  },
  generate() {
    const wo = generateAdaptiveWorkout({
      ...state.input,
      user_maxes: state.user_maxes,
      correction_state: state.correction_state,
    });
    setState({ workout: wo, adaptation: null });
  },
  generatePlain() {
    setState({ workout: generateWorkout(state.input), adaptation: null });
  },
  adapt(
    success_rate: number,
    average_RPE: number,
    exerciseResults: ExerciseResult[] = [],
  ) {
    if (!state.workout) return;
    const result = postWorkoutAdaptation({
      success_rate,
      average_RPE,
      current_intensity: state.workout.adjusted_intensity / 100,
      previous_fatigue: state.input.fatigue_score,
      session_load_factor: 25,
      recovery_factor: 15,
    });
    const total_sets = state.workout.exercises.reduce(
      (a, e) => a + e.sets,
      0,
    );
    const log: SessionLog = {
      date: new Date().toISOString(),
      day: state.workout.day,
      adjusted_intensity: state.workout.adjusted_intensity,
      success_rate,
      average_RPE,
      total_sets,
    };
    // Per-exercise correction memory update (no global decay).
    const nextCorrection: Record<string, number> = { ...state.correction_state };
    const fixPerformance: FixPerformance[] = [];
    const injectedNames = new Set(
      (state.workout as AugmentedWorkout).injected_exercises || [],
    );

    for (const r of exerciseResults) {
      const related = getProblemsFromExercise(r.exercise_id);
      const struggling = r.success_rate < 80 || r.avg_rpe > 8;
      for (const p of related) {
        if (struggling) {
          nextCorrection[p] = (nextCorrection[p] || 0) + 1.5;
        } else {
          nextCorrection[p] = (nextCorrection[p] || 0) * 0.7;
        }
      }
      const ex = getExerciseById(r.exercise_id);
      if (ex && injectedNames.has(ex.name_en)) {
        fixPerformance.push({
          exercise_id: r.exercise_id,
          name: ex.name_en,
          status: struggling ? "struggling" : "ok",
          success_rate: r.success_rate,
          avg_rpe: r.avg_rpe,
        });
      }
    }

    setState({
      adaptation: result,
      history: [log, ...state.history].slice(0, 50),
      input: { ...state.input, fatigue_score: result.new_fatigue_score },
      correction_state: nextCorrection,
      fix_performance: fixPerformance,
    });
  },
  reset() {
    setState(defaultState);
  },
};

export function useEngine(): EngineState {
  const s = useSyncExternalStore(
    engineStore.subscribe,
    engineStore.get,
    engineStore.get,
  );
  // Auto-generate on first mount if missing
  useEffect(() => {
    if (!s.workout) engineStore.generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return s;
}
