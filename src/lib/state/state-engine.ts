// ===================================================================
// STATE ENGINE — PURE DETERMINISTIC ATHLETE STATE UPDATE
//
// Purpose:
// - updateState(prevState, sessionResult) → new AthleteState
// - Pure function: no side effects, no I/O, no randomness
// - Determines snapshot, trends, load_history, and flags from session
//
// Rules:
// - fatigue increases with session_load × RPE
// - readiness decreases with fatigue accumulation + technical failure
// - trends are rolling 7/28 day approximations
// - flags are threshold-based boolean triggers
//
// Architecture:
//   This is an additive layer. It does NOT modify orchestrator logic.
//   It is called AFTER the orchestrator produces a session to update
//   the athlete's state for the NEXT session.
// ===================================================================

import type { AthleteState, SessionResult } from "./athlete-state";

// ── Default values ────────────────────────────────────────────────────────────

const DEFAULT_READINESS = 70;
const DEFAULT_FATIGUE = 30;
const DEFAULT_PERFORMANCE = 65;
const DEFAULT_TECHNICAL_QUALITY = 75;
const DEFAULT_RECOVERY = 70;

// ── Smoothing constants ───────────────────────────────────────────────────────

/** How much the current session affects the snapshots (0–1). Higher = faster change. */
const SNAPSHOT_ALPHA = 0.3;

/** How much the current session affects trends. */
const TREND_ALPHA = 0.15;

/** How much the current session load affects acute load history. */
const LOAD_ALPHA = 0.25;

// ── Thresholds ────────────────────────────────────────────────────────────────

const OVERREACHING_ACWR = 1.5;
const OVERREACHING_FATIGUE = 75;
const TECHNICAL_DEGRADATION = 40;
const UNDER_RECOVERY_READINESS = 35;
const UNDER_RECOVERY_FATIGUE = 70;
const LOAD_TOLERANCE_HIGH = 200;
const FLAG_FATIGUE_THRESHOLD = 70;
const FLAG_READINESS_THRESHOLD = 35;

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Computes a deterministic fatigue increment from session load and RPE.
 *
 * Fatigue grows proportionally to:
 *   - session_load intensity (absolute work done)
 *   - average RPE (perceived exertion amplifies fatigue)
 *
 * Returns an additive fatigue delta (0–30 range for typical sessions).
 */
function computeFatigueDelta(session: SessionResult): number {
  // Normalize load: typical session load ~200–800
  const loadFactor = session.session_load / 400;
  // RPE contributes multiplicatively: higher RPE → more fatigue per unit of work
  const rpeFactor = session.average_rpe / 7;
  const base = loadFactor * rpeFactor * 15;
  // Cap the delta so no single session pushes fatigue beyond plausibility
  return clamp(Math.round(base), 0, 25);
}

/**
 * Computes a performance estimate from the session result.
 * Performance is influenced by:
 *   - success_rate (positive)
 *   - average_intensity relative to a reference (positive up to a point)
 *   - technical_failure (negative)
 */
function computePerformanceDelta(session: SessionResult): number {
  const successFactor = (session.success_rate - 60) / 40; // -1.5 to +1
  const intensityFactor = (session.average_intensity - 75) / 25; // -3 to +1
  // Technical failure is a flat penalty
  const techPenalty = session.technical_failure ? -10 : 0;
  const delta = successFactor * 8 + intensityFactor * 5 + techPenalty;
  return clamp(Math.round(delta), -15, 15);
}

/**
 * Computes a recovery score based on the current fatigue and readiness values.
 */
function computeRecovery(fatigue: number, readiness: number, sessionLoad: number): number {
  // Recovery is high when fatigue is low and readiness is high
  // Session load temporarily depresses recovery
  const base = (readiness + (100 - fatigue)) / 2;
  const loadPenalty = sessionLoad / 30;
  return clamp(Math.round(base - loadPenalty), 0, 100);
}

/**
 * Computes a technical quality estimate.
 */
function computeTechnicalQuality(
  prev: number,
  session: SessionResult,
  prevFlags: AthleteState["flags"],
): number {
  // Technical failure erodes quality; success restores it
  const failurePenalty = session.technical_failure ? -15 : 0;
  const successBonus = session.success_rate > 80 ? 5 : session.success_rate > 60 ? 2 : 0;
  // If already degraded, recovery is slower
  const recoveryRate = prevFlags.technical_degradation ? 0.5 : 1.0;
  const target = prev + (failurePenalty + successBonus) * recoveryRate;
  return clamp(Math.round(target), 0, 100);
}

// ── Rolling trend approximations ──────────────────────────────────────────────

function updateTrends(
  prev: AthleteState,
  session: SessionResult,
): AthleteState["trends"] {
  // Each trend is an exponential moving average of the current snapshots.
  // The "alpha" controls how much the present changes the rolling trend.
  const a = TREND_ALPHA;
  const prevT = prev.trends;

  // Fatigue trend (7-day proxy via EMA)
  const fatigue7d = Math.round(lerp(prevT.fatigue_7d, prev.snapshot.fatigue, a));

  // Readiness trend (7-day proxy via EMA)
  const readiness7d = Math.round(lerp(prevT.readiness_7d, prev.snapshot.readiness, a));

  // Performance trend (28-day proxy via slower EMA)
  const perf28d = Math.round(lerp(prevT.performance_28d, prev.snapshot.performance, a * 0.5));

  // Load tolerance slope: positive = improving tolerance, negative = degrading
  // Approximated by comparing acute load to the trend
  const loadTol = clamp(
    Math.round(lerp(prevT.load_tolerance_slope, prev.load_history.acwr > 1.2 ? -1 : 1, a)),
    -10,
    10,
  );

  return {
    readiness_7d: readiness7d,
    fatigue_7d: fatigue7d,
    performance_28d: perf28d,
    load_tolerance_slope: loadTol,
  };
}

function updateLoadHistory(
  prev: AthleteState,
  session: SessionResult,
): AthleteState["load_history"] {
  const a = LOAD_ALPHA;
  const prevLH = prev.load_history;

  // Acute load: EMA of the current session load
  const acute = Math.round(lerp(prevLH.acute_load, session.session_load, a));

  // Chronic load: slower EMA of acute load
  const chronicAlpha = a * 0.4;
  const chronic = Math.round(lerp(prevLH.chronic_load, acute, chronicAlpha));

  // ACWR: acute / chronic workload ratio
  const acwr = chronic > 0 ? Math.round((acute / chronic) * 100) / 100 : 1.0;

  return {
    acute_load: acute,
    chronic_load: chronic,
    acwr,
  };
}

function updateFlags(state: AthleteState): AthleteState["flags"] {
  const { snapshot, load_history } = state;

  return {
    overreaching:
      load_history.acwr >= OVERREACHING_ACWR && snapshot.fatigue >= OVERREACHING_FATIGUE,
    technical_degradation: snapshot.technical_quality < TECHNICAL_DEGRADATION,
    under_recovery:
      snapshot.readiness <= UNDER_RECOVERY_READINESS && snapshot.fatigue >= UNDER_RECOVERY_FATIGUE,
  };
}

// ── Main update function ──────────────────────────────────────────────────────

/**
 * Pure function: updates AthleteState from a session result.
 *
 * Called AFTER the orchestrator produces a session.
 * Does NOT modify the orchestrator output.
 * Does NOT introduce randomness or external dependencies.
 *
 * @param prevState - The athlete's state before this session
 * @param sessionResult - The result of the just-completed session
 * @returns A new AthleteState reflecting the updated athlete condition
 */
export function updateState(
  prevState: AthleteState,
  sessionResult: SessionResult,
): AthleteState {
  const prev = prevState;

  // ── 1. Update snapshot values (exponential moving averages) ──
  const rawFatigue = lerp(
    prev.snapshot.fatigue,
    clamp(prev.snapshot.fatigue + computeFatigueDelta(sessionResult), 0, 100),
    SNAPSHOT_ALPHA,
  );
  const fatigue = clamp(Math.round(rawFatigue), 0, 100);

  const perfDelta = computePerformanceDelta(sessionResult);
  const rawPerformance = lerp(
    prev.snapshot.performance,
    clamp(prev.snapshot.performance + perfDelta, 0, 100),
    SNAPSHOT_ALPHA,
  );
  const performance = clamp(Math.round(rawPerformance), 0, 100);

  // Readiness: base 70, depressed by fatigue and technical failure
  const fatigueDepression = (fatigue - DEFAULT_FATIGUE) * 0.6;
  const techDepression = sessionResult.technical_failure ? 10 : 0;
  const loadDepression = (sessionResult.session_load / LOAD_TOLERANCE_HIGH) * 15;
  const targetReadiness = clamp(
    70 - fatigueDepression - techDepression - loadDepression,
    10,
    100,
  );
  const rawReadiness = lerp(prev.snapshot.readiness, targetReadiness, SNAPSHOT_ALPHA);
  const readiness = clamp(Math.round(rawReadiness), 0, 100);

  const technical_quality = computeTechnicalQuality(
    prev.snapshot.technical_quality,
    sessionResult,
    prev.flags,
  );

  const recovery = computeRecovery(fatigue, readiness, sessionResult.session_load);

  // ── 2. Build intermediate state for trend/flag computation ──
  const intermediateSnapshot: AthleteState["snapshot"] = {
    readiness,
    fatigue,
    performance,
    technical_quality,
    recovery,
  };

  const intermediate: AthleteState = {
    snapshot: intermediateSnapshot,
    trends: prev.trends, // placeholder, will be overwritten
    load_history: prev.load_history, // placeholder
    flags: prev.flags, // placeholder
    meta: {
      last_update: Date.now(),
      phase: sessionResult.phase,
    },
  };

  // ── 3. Update trends ──
  const trends = updateTrends(intermediate, sessionResult);

  // ── 4. Update load history ──
  const load_history = updateLoadHistory(intermediate, sessionResult);

  // ── 5. Update flags ──
  const flags = updateFlags({
    ...intermediate,
    trends,
    load_history,
  });

  return {
    snapshot: intermediate.snapshot,
    trends,
    load_history,
    flags,
    meta: intermediate.meta,
  };
}

// ── Initial state factory ─────────────────────────────────────────────────────

/**
 * Creates a clean initial AthleteState.
 *
 * Defaults:
 *   - readiness = 70
 *   - fatigue = 30
 *   - performance = 65
 *   - technical_quality = 75
 *   - recovery = 70
 *   - trends = neutral (same values)
 *   - load_history: acute=200, chronic=200, acwr=1.0
 *   - flags = all false
 *   - phase = BASE
 *
 * @param profile - Optional override values (e.g. from athlete profile)
 */
export function createInitialState(profile?: {
  readiness?: number;
  fatigue?: number;
  performance?: number;
  technical_quality?: number;
  recovery?: number;
  phase?: AthleteState["meta"]["phase"];
}): AthleteState {
  const readiness = profile?.readiness ?? DEFAULT_READINESS;
  const fatigue = profile?.fatigue ?? DEFAULT_FATIGUE;
  const performance = profile?.performance ?? DEFAULT_PERFORMANCE;
  const technical_quality = profile?.technical_quality ?? DEFAULT_TECHNICAL_QUALITY;
  const recovery = profile?.recovery ?? DEFAULT_RECOVERY;
  const phase = profile?.phase ?? "BASE";

  return {
    snapshot: {
      readiness,
      fatigue,
      performance,
      technical_quality,
      recovery,
    },
    trends: {
      readiness_7d: readiness,
      fatigue_7d: fatigue,
      performance_28d: performance,
      load_tolerance_slope: 0,
    },
    load_history: {
      acute_load: 200,
      chronic_load: 200,
      acwr: 1.0,
    },
    flags: {
      overreaching: false,
      technical_degradation: false,
      under_recovery: false,
    },
    meta: {
      last_update: Date.now(),
      phase,
    },
  };
}