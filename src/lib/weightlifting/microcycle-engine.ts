// ─────────────────────────────────────────────────────────────────────────────
// Microcycle Intelligence Engine — VERSION 1
//
// Pure analytics layer. Tracks rolling 7–10 day stress exposure and emits
// recovery / restoration / blocking recommendations. It does NOT generate
// workouts, does NOT pick exercises, and does NOT mutate state.
//
// Consumed later by coach-engine + daily-priority-engine to bias decisions.
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyPriority, TrainingPhase } from "./daily-priority-engine";
import type { ExerciseFamily } from "../exercise-db";

// ────────────────────────────────────────────────────────────
// 1. TYPES
// ────────────────────────────────────────────────────────────

export interface MicrocycleSession {
  date?: string;
  daily_priority?: DailyPriority;

  cns_load?: number;          // 0–100
  technical_load?: number;    // 0–100
  local_load?: number;        // 0–100

  overhead_stress?: number;   // 0–100
  squat_stress?: number;      // 0–100
  pull_stress?: number;       // 0–100

  intensity_avg?: number;     // 0–100 (% 1RM avg)
  complexity_avg?: number;    // 0–10
  specificity_score?: number; // 0–100 (closeness to comp lifts)

  recovery_day?: boolean;
  restoration_day?: boolean;

  exercise_families?: ExerciseFamily[];
}

export interface MicrocycleContext {
  recent_sessions: MicrocycleSession[]; // newest first OR oldest first; we treat as a window
  readiness: number;                    // 0–100
  fatigue: number;                      // 0–100
  training_phase: TrainingPhase;
}

export interface MicrocycleState {
  rolling_cns_load: number;
  rolling_technical_load: number;
  rolling_local_load: number;

  overhead_density: number;
  squat_density: number;
  pull_density: number;
  technical_density: number;
  specificity_density: number;

  heavy_day_count: number;
  restoration_count: number;
  recovery_spacing_score: number; // higher = better spaced recovery

  fatigue_risk: number;           // 0–100 composite

  notes: string[];
}

export interface MicrocycleDecision {
  microcycle_state: MicrocycleState;
  blocked_priorities: DailyPriority[];
  biased_priorities: DailyPriority[];
  recovery_recommended: boolean;
  restoration_recommended: boolean;
  notes: string[];
}

// ────────────────────────────────────────────────────────────
// 2. CONSTANTS
// ────────────────────────────────────────────────────────────

const WINDOW_MIN = 7;
const WINDOW_MAX = 10;

const HEAVY_CNS_THRESHOLD = 65;
const HEAVY_INTENSITY_THRESHOLD = 85;
const HIGH_TECHNICAL_THRESHOLD = 60;
const HIGH_OVERHEAD_THRESHOLD = 60;
const HIGH_SQUAT_THRESHOLD = 60;
const HIGH_PULL_THRESHOLD = 60;

// ────────────────────────────────────────────────────────────
// 3. HELPERS
// ────────────────────────────────────────────────────────────

function clamp(n: number, lo = 0, hi = 100): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function takeWindow(sessions: MicrocycleSession[]): MicrocycleSession[] {
  if (!Array.isArray(sessions) || !sessions.length) return [];
  const w = sessions.slice(-WINDOW_MAX);
  return w.length >= WINDOW_MIN ? w : w;
}

function isHeavySession(s: MicrocycleSession): boolean {
  const cns = s.cns_load ?? 0;
  const intensity = s.intensity_avg ?? 0;
  return cns >= HEAVY_CNS_THRESHOLD || intensity >= HEAVY_INTENSITY_THRESHOLD;
}

function consecutiveCount(
  sessions: MicrocycleSession[],
  pred: (s: MicrocycleSession) => boolean,
): number {
  let max = 0;
  let cur = 0;
  for (const s of sessions) {
    if (pred(s)) {
      cur += 1;
      if (cur > max) max = cur;
    } else {
      cur = 0;
    }
  }
  return max;
}

function recoverySpacing(sessions: MicrocycleSession[]): number {
  // higher score = recovery days are well distributed
  const n = sessions.length;
  if (!n) return 100;
  const recoveryIdx = sessions
    .map((s, i) => (s.recovery_day || s.restoration_day ? i : -1))
    .filter((i) => i >= 0);
  if (!recoveryIdx.length) {
    // no recovery in window → poor
    return Math.max(0, 40 - n * 3);
  }
  // gaps between recoveries (and edges)
  const gaps: number[] = [];
  let prev = -1;
  for (const i of recoveryIdx) {
    gaps.push(i - prev);
    prev = i;
  }
  gaps.push(n - prev);
  const maxGap = Math.max(...gaps);
  // ideal max gap is ~3
  return clamp(100 - (maxGap - 3) * 15);
}

// ────────────────────────────────────────────────────────────
// 4. STATE CALCULATION
// ────────────────────────────────────────────────────────────

export function calculateMicrocycleState(
  ctx: MicrocycleContext,
): MicrocycleState {
  const window = takeWindow(ctx.recent_sessions);
  const n = window.length || 1;
  const notes: string[] = [];

  const rolling_cns_load = clamp(avg(window.map((s) => s.cns_load ?? 0)));
  const rolling_technical_load = clamp(
    avg(window.map((s) => s.technical_load ?? 0)),
  );
  const rolling_local_load = clamp(avg(window.map((s) => s.local_load ?? 0)));

  const overhead_density = clamp(avg(window.map((s) => s.overhead_stress ?? 0)));
  const squat_density = clamp(avg(window.map((s) => s.squat_stress ?? 0)));
  const pull_density = clamp(avg(window.map((s) => s.pull_stress ?? 0)));
  const technical_density = clamp(
    avg(window.map((s) => s.technical_load ?? 0)),
  );
  const specificity_density = clamp(
    avg(window.map((s) => s.specificity_score ?? 0)),
  );

  const heavy_day_count = window.filter(isHeavySession).length;
  const restoration_count = window.filter(
    (s) => s.restoration_day || s.recovery_day,
  ).length;

  const recovery_spacing_score = recoverySpacing(window);

  // composite fatigue risk: weights rolling CNS, heavy density, poor spacing,
  // current readiness/fatigue
  const heavyRatio = heavy_day_count / n;
  const fatigue_risk = clamp(
    rolling_cns_load * 0.35 +
      heavyRatio * 100 * 0.25 +
      (100 - recovery_spacing_score) * 0.15 +
      clamp(ctx.fatigue) * 0.15 +
      (100 - clamp(ctx.readiness)) * 0.1,
  );

  if (rolling_cns_load >= HEAVY_CNS_THRESHOLD)
    notes.push(`Rolling CNS load elevated (${Math.round(rolling_cns_load)}).`);
  if (heavy_day_count >= 3)
    notes.push(`${heavy_day_count} heavy sessions in last ${n} days.`);
  if (recovery_spacing_score < 50)
    notes.push("Recovery days poorly spaced across window.");
  if (overhead_density >= HIGH_OVERHEAD_THRESHOLD)
    notes.push(`High overhead density (${Math.round(overhead_density)}).`);
  if (technical_density >= HIGH_TECHNICAL_THRESHOLD)
    notes.push(`High technical density (${Math.round(technical_density)}).`);

  return {
    rolling_cns_load,
    rolling_technical_load,
    rolling_local_load,
    overhead_density,
    squat_density,
    pull_density,
    technical_density,
    specificity_density,
    heavy_day_count,
    restoration_count,
    recovery_spacing_score,
    fatigue_risk,
    notes,
  };
}

// ────────────────────────────────────────────────────────────
// 5. RECOVERY INSERTION
// ────────────────────────────────────────────────────────────

export function shouldInsertRecovery(
  state: MicrocycleState,
  ctx: MicrocycleContext,
): { recovery: boolean; restoration: boolean; reasons: string[] } {
  const reasons: string[] = [];
  let recovery = false;
  let restoration = false;

  const consecutiveHeavy = consecutiveCount(
    takeWindow(ctx.recent_sessions),
    isHeavySession,
  );

  if (state.fatigue_risk >= 70) {
    recovery = true;
    reasons.push("Composite fatigue risk high.");
  }
  if (state.rolling_cns_load >= 70 && state.restoration_count === 0) {
    recovery = true;
    reasons.push("CNS accumulation without restoration in window.");
  }
  if (consecutiveHeavy >= 3) {
    recovery = true;
    reasons.push(`${consecutiveHeavy} consecutive heavy sessions.`);
  }
  if (state.recovery_spacing_score < 40) {
    recovery = true;
    reasons.push("Recovery spacing too sparse.");
  }

  if (state.technical_density >= HIGH_TECHNICAL_THRESHOLD && ctx.readiness < 60) {
    restoration = true;
    reasons.push("Technical density high while readiness limited.");
  }
  if (state.rolling_technical_load >= 65 && state.restoration_count === 0) {
    restoration = true;
    reasons.push("Sustained technical load with no restoration.");
  }

  return { recovery, restoration, reasons };
}

// ────────────────────────────────────────────────────────────
// 6. PRIORITY BIASING
// ────────────────────────────────────────────────────────────

function computeBlockedPriorities(state: MicrocycleState): DailyPriority[] {
  const blocked = new Set<DailyPriority>();

  if (state.overhead_density >= HIGH_OVERHEAD_THRESHOLD + 10) {
    blocked.add("jerk_strength");
    blocked.add("jerk_technique");
  }
  if (state.squat_density >= HIGH_SQUAT_THRESHOLD + 10) {
    blocked.add("squat_strength");
  }
  if (state.pull_density >= HIGH_PULL_THRESHOLD + 10) {
    blocked.add("pull_strength");
  }
  if (state.rolling_cns_load >= 75) {
    blocked.add("competition_specific");
    blocked.add("snatch_strength");
    blocked.add("clean_strength");
  }

  return Array.from(blocked);
}

function computeBiasedPriorities(
  state: MicrocycleState,
  recovery: boolean,
  restoration: boolean,
): DailyPriority[] {
  const biased: DailyPriority[] = [];
  if (recovery) biased.push("recovery");
  if (restoration) biased.push("technical_restoration");
  if (
    !recovery &&
    !restoration &&
    state.specificity_density < 30 &&
    state.fatigue_risk < 50
  ) {
    // window has been very general — gently bias technique work
    biased.push("snatch_technique", "clean_technique");
  }
  return biased;
}

// ────────────────────────────────────────────────────────────
// 7. PUBLIC API
// ────────────────────────────────────────────────────────────

export function evaluateMicrocycle(
  ctx: MicrocycleContext,
): MicrocycleDecision {
  const microcycle_state = calculateMicrocycleState(ctx);
  const rec = shouldInsertRecovery(microcycle_state, ctx);

  const blocked_priorities = computeBlockedPriorities(microcycle_state);
  const biased_priorities = computeBiasedPriorities(
    microcycle_state,
    rec.recovery,
    rec.restoration,
  );

  const notes = [...microcycle_state.notes, ...rec.reasons];

  return {
    microcycle_state,
    blocked_priorities,
    biased_priorities,
    recovery_recommended: rec.recovery,
    restoration_recommended: rec.restoration,
    notes,
  };
}
