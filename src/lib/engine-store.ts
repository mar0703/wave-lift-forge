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
import { type AugmentedWorkout } from "./adaptive-workout";
import { orchestrateAndPrepareWorkout } from "./orchestrator";
import type { FinalCoachContext } from "./orchestrator";
import type { AthleteState as UnifiedAthleteState } from "./state/athlete-state";
import {
  detectProblems,
  getPrimaryProblem,
  getProblemsFromExercise,
  type ExerciseResult,
} from "./diagnostics";
import { runCoachPipeline, type AthleteState, type CoachOutput } from "./coach-engine";

const PROBLEM_FOCUS: Record<string, string> = {
  weak_clean: "Clean strength",
  weak_jerk: "Jerk drive",
  weak_legs: "Leg strength",
  weak_pull: "Pull strength",
};

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
  coach: CoachOutput | null;
  competition_mode: boolean;
  last_session_results: ExerciseResult[];
  // Orchestrator outputs — primary, state-driven decision signals consumed by UI.
  final_context: FinalCoachContext | null;
  athlete_state: UnifiedAthleteState | null;
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
  coach: null,
  competition_mode: false,
  last_session_results: [],
  final_context: null,
  athlete_state: null,
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
    const baseWorkout = generateWorkout(state.input);
    const detectedProblems = detectProblems(state.user_maxes);
    const primaryProblem = getPrimaryProblem(
      detectedProblems,
      state.correction_state,
    );
    // FIX: Propagate athlete readiness/fatigue AND the prior unified
    // AthleteState into orchestrator so trends/load history accumulate
    // and the engine — not a static baseline — drives this session.
    const orchestrated = orchestrateAndPrepareWorkout({
      engine_input: state.input,
      user_maxes: state.user_maxes,
      correction_state: state.correction_state,
      recent_sessions: state.history,
      readiness: state.input.readiness,
      fatigue: state.input.fatigue_score,
      state: state.athlete_state ?? undefined,
    });
    const base: AugmentedWorkout = {
      ...baseWorkout,
      exercises: orchestrated.constrained_exercises,
      detected_problems: detectedProblems,
      injected_exercises: [],
      problem_focus: detectedProblems.map((p) => PROBLEM_FOCUS[p] || p),
      primary_problem: primaryProblem,
      primary_problem_sessions: primaryProblem
        ? Math.round(state.correction_state[primaryProblem] || 0)
        : undefined,
      notes: [...baseWorkout.notes, ...orchestrated.priority_notes],
    };
    const athlete: AthleteState = {
      readiness: state.input.readiness,
      fatigue: state.input.fatigue_score,
      success_rate: state.history[0]?.success_rate ?? 85,
      average_RPE: state.history[0]?.average_RPE ?? 7,
      exercise_results: state.last_session_results,
      user_maxes: state.user_maxes,
      correction_state: state.correction_state,
      training_day_index: state.input.training_day_index,
      competition_mode: state.competition_mode,
    };
    const coach = runCoachPipeline(base, athlete);

    // Pure pass-through: the coach pipeline is the single source of truth
    // for adjusted_intensity and per-exercise loads. Engine-store MUST NOT
    // recompute, re-derive, or override these values — doing so would
    // re-introduce the max-based UI bug.
    const merged: AugmentedWorkout = {
      ...base,
      ...coach.workout,
      notes: [...orchestrated.priority_notes, ...coach.notes],
      injected_exercises: coach.injected_exercises.length
        ? coach.injected_exercises
        : base.injected_exercises,
      detected_problems: coach.detected_problems,
      primary_problem: coach.primary_problem ?? base.primary_problem,
    };
    setState({
      workout: merged,
      adaptation: null,
      coach,
      final_context: orchestrated.final_context,
      athlete_state: orchestrated.updated_state,
    });
  },
  setCompetitionMode(on: boolean) {
    setState({ competition_mode: on });
  },
  /**
   * LAST-RESORT SAFETY MODE: bypasses orchestrator and coach pipeline,
   * producing a plain max-based percentage workout. Only call this when
   * the engine pipeline cannot be used (e.g. crash recovery, manual
   * diagnostics). Normal generation MUST go through `generate()`.
   */
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
    }

    setState({
      adaptation: result,
      history: [log, ...state.history].slice(0, 50),
      input: { ...state.input, fatigue_score: result.new_fatigue_score },
      correction_state: nextCorrection,
      last_session_results: exerciseResults,
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
    () => defaultState, // SSR snapshot — avoid hydration mismatch from localStorage
  );
  // Auto-generate on first mount if missing
  useEffect(() => {
    if (!s.workout) engineStore.generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return s;
}