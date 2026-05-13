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
import {
  detectProblems,
  getPrimaryProblem,
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

const PROBLEM_FOCUS: Record<string, string> = {
  weak_clean: "Clean strength",
  weak_jerk: "Jerk drive",
  weak_legs: "Leg strength",
  weak_pull: "Pull strength",
};

const KEY = "iron-method-state-v1";

// Bump APP_VERSION whenever runtime logic, state shape, or scoring changes.
// Any persisted state with a different version is discarded on load.
export const APP_VERSION = "2026.05.12-1";

interface StateMeta {
  version: string;
}

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
  meta: StateMeta;
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
  meta: { version: APP_VERSION },
};

let state: EngineState = load();
const listeners = new Set<() => void>();

// TEMPORARY runtime debug — confirms version + state alignment per session.
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[engine-store] runtime", {
    app_version: APP_VERSION,
    state_version: state.meta.version,
    readiness: state.input.readiness,
    fatigue: state.input.fatigue_score,
    acwr: state.history.length
      ? state.history.slice(0, 7).reduce((a, h) => a + h.adjusted_intensity, 0) /
        Math.max(1, state.history.slice(0, 28).reduce((a, h) => a + h.adjusted_intensity, 0) / 4)
      : null,
  });
}

function load(): EngineState {
  if (typeof localStorage === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.log("[TRACER][PATH_START]", {
          path_id: "state_rehydrate_flow",
          timestamp: new Date().toISOString(),
          outcome: "fresh_default",
        });
      }
      return defaultState;
    }
    const parsed = JSON.parse(raw) as Partial<EngineState>;
    if (!parsed?.meta || parsed.meta.version !== APP_VERSION) {
      console.warn(
        `[engine-store] STATE RESET DUE TO VERSION MISMATCH (stored=${parsed?.meta?.version ?? "none"}, app=${APP_VERSION})`,
      );
      if (typeof window !== "undefined") {
        // eslint-disable-next-line no-console
        console.log("[TRACER][HIDDEN_PATH_DETECTED]", {
          source: "fallback_trigger_flow",
          detail: { reason: "version_mismatch", stored: parsed?.meta?.version },
        });
      }
      try {
        localStorage.removeItem(KEY);
      } catch {
        /* ignore */
      }
      return defaultState;
    }
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("[TRACER][PATH_START]", {
        path_id: "state_rehydrate_flow",
        timestamp: new Date().toISOString(),
        outcome: "restored",
      });
    }
    return { ...defaultState, ...parsed, meta: { version: APP_VERSION } };
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

function hashWorkout(w: unknown): string {
  try {
    const s = JSON.stringify(w);
    let h = 0;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return `${s.length}:${h}`;
  } catch {
    return "n/a";
  }
}

// Exposed for UI-side divergence comparison + multi-path tracing.
type PathId =
  | "session_submit_flow"
  | "workout_generate_flow"
  | "apply_workout_flow"
  | "state_rehydrate_flow"
  | "fallback_trigger_flow"
  | "rapid_reapply_flow";

interface PathRecord {
  path_id: PathId;
  session_id: string;
  state_version: string;
  timestamp: string;
  workout_hash: string;
  intensity: number | null;
  acwr: number | null;
}

export const __TRACER__: {
  lastOrchestratorOutput: unknown;
  lastStoredWorkoutHash: string | null;
  paths: PathRecord[];
  currentPath: PathId | null;
  sessionId: string;
  lastPathTs: number;
  detectHidden: (source: string, detail?: unknown) => void;
  comparePaths: () => void;
} = {
  lastOrchestratorOutput: null,
  lastStoredWorkoutHash: null,
  paths: [],
  currentPath: null,
  sessionId:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `s_${Date.now()}`,
  lastPathTs: 0,
  detectHidden(source, detail) {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line no-console
    console.log("[TRACER][HIDDEN_PATH_DETECTED]", { source, detail });
  },
  comparePaths() {
    if (typeof window === "undefined") return;
    const intensities = new Set(
      __TRACER__.paths.map((p) => p.intensity).filter((v) => v !== null),
    );
    const hashes = new Set(__TRACER__.paths.map((p) => p.workout_hash));
    const acwrs = new Set(
      __TRACER__.paths.map((p) => p.acwr).filter((v) => v !== null),
    );
    // eslint-disable-next-line no-console
    console.log("[TRACER][CROSS_PATH_REPORT]", {
      total_paths: __TRACER__.paths.length,
      intensity_consistency: intensities.size <= 1,
      state_consistency: hashes.size <= 1,
      acwr_consistency: acwrs.size <= 1,
      paths: __TRACER__.paths,
    });
  },
};

function startPath(path_id: PathId) {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (__TRACER__.lastPathTs && now - __TRACER__.lastPathTs < 250) {
    // eslint-disable-next-line no-console
    console.log("[TRACER][PATH_START]", {
      path_id: "rapid_reapply_flow",
      origin_path: path_id,
      timestamp: new Date(now).toISOString(),
      session_id: __TRACER__.sessionId,
    });
  }
  __TRACER__.lastPathTs = now;
  __TRACER__.currentPath = path_id;
  // eslint-disable-next-line no-console
  console.log("[TRACER][PATH_START]", {
    path_id,
    timestamp: new Date(now).toISOString(),
    session_id: __TRACER__.sessionId,
    state_version: state.meta.version,
  });
}

function setState(partial: Partial<EngineState>) {
  const prev = state;
  state = { ...state, ...partial, meta: { version: APP_VERSION } };
  if (typeof window !== "undefined" && partial.workout !== undefined) {
    const acwr7 = prev.history.slice(0, 7).reduce((a, h) => a + h.adjusted_intensity, 0) / Math.max(1, Math.min(7, prev.history.length));
    const acwr28 = prev.history.slice(0, 28).reduce((a, h) => a + h.adjusted_intensity, 0) / Math.max(1, Math.min(28, prev.history.length));
    const acwr = acwr28 ? acwr7 / acwr28 : null;
    const hash = hashWorkout(state.workout);
    const path_id = __TRACER__.currentPath ?? "apply_workout_flow";
    const intensity =
      (state.workout as { adjusted_intensity?: number } | null)?.adjusted_intensity ??
      null;
    // eslint-disable-next-line no-console
    console.log("[TRACER][STATE_UPDATE]", {
      path_id,
      session_id: __TRACER__.sessionId,
      state_version: state.meta.version,
      prev_state_snapshot: {
        workout_hash: hashWorkout(prev.workout),
        readiness: prev.input.readiness,
        fatigue: prev.input.fatigue_score,
      },
      session_result_input: partial,
      next_state_output: {
        workout_hash: hash,
        readiness: state.input.readiness,
        fatigue: state.input.fatigue_score,
      },
      acwr,
    });
    __TRACER__.lastStoredWorkoutHash = hash;
    // eslint-disable-next-line no-console
    console.log("[TRACER][STORE_COMMIT]", {
      path_id,
      session_id: __TRACER__.sessionId,
      stored_workout: state.workout,
      stored_state_version: state.meta.version,
      reference_id: KEY,
      workout_hash: hash,
    });
    __TRACER__.paths.push({
      path_id,
      session_id: __TRACER__.sessionId,
      state_version: state.meta.version,
      timestamp: new Date().toISOString(),
      workout_hash: hash,
      intensity,
      acwr,
    });
    __TRACER__.comparePaths();
  }
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
    startPath("workout_generate_flow");
    const baseWorkout = generateWorkout(state.input);
    const detectedProblems = detectProblems(state.user_maxes);
    const primaryProblem = getPrimaryProblem(
      detectedProblems,
      state.correction_state,
    );
    const orchestrated = orchestrateAndPrepareWorkout({
      engine_input: state.input,
      user_maxes: state.user_maxes,
      correction_state: state.correction_state,
      recent_sessions: state.history,
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
    const merged: AugmentedWorkout = {
      ...base,
      exercises: coach.workout.exercises,
      notes: [...orchestrated.priority_notes, ...coach.notes],
      injected_exercises: coach.injected_exercises.length
        ? coach.injected_exercises
        : base.injected_exercises,
      detected_problems: coach.detected_problems,
      primary_problem: coach.primary_problem ?? base.primary_problem,
    };
    if (typeof window !== "undefined") {
      __TRACER__.lastOrchestratorOutput = {
        workout: merged,
        intensity: merged.adjusted_intensity,
        constraints: orchestrated.priority_notes,
      };
      // eslint-disable-next-line no-console
      console.log("[TRACER][ORCHESTRATOR_OUTPUT]", {
        timestamp: new Date().toISOString(),
        workout: merged,
        intensity: merged.adjusted_intensity,
        constraints: orchestrated.priority_notes,
        updated_state: { input: state.input, user_maxes: state.user_maxes },
        workout_hash: hashWorkout(merged),
      });
    }
    setState({ workout: merged, adaptation: null, coach });
  },
  setCompetitionMode(on: boolean) {
    setState({ competition_mode: on });
  },
  generatePlain() {
    startPath("apply_workout_flow");
    setState({ workout: generateWorkout(state.input), adaptation: null });
  },
  adapt(
    success_rate: number,
    average_RPE: number,
    exerciseResults: ExerciseResult[] = [],
  ) {
    startPath("session_submit_flow");
    if (!state.workout) {
      __TRACER__.detectHidden("adapt_skipped_no_workout");
      return;
    }
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
