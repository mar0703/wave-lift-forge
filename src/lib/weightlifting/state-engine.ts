// State Engine
// -----------------------------------------------------------------------------
// Deterministic coaching-state interpreter that converts repeated session
// snapshots into meaningful temporal memory.
//
// This is NOT a database layer.
// This is NOT ML.
// This is NOT a full athlete history system.
//
// RESPONSIBILITY BOUNDARIES (strict):
//   State Engine     → observes repeated patterns over time
//   Arbiter          → decides whether intervention is appropriate
//   Correction Engine→ decides how to correct
//
// State Engine MUST NOT:
//   - select exercises
//   - assign severity scores
//   - estimate diagnostic confidence
//   - evaluate correction success
//   - claim physiological inference (systemic / resolved fatigue, etc.)
//   - simulate coaching intelligence
//
// Every view carries a `confidence` rating and the engine surfaces a
// `data_gaps` list. Downstream layers decide how much to trust each view.
// -----------------------------------------------------------------------------

// ── Core State Concepts ──────────────────────────────────────────────────────

/** How long a problem has been observed across sessions */
export type ProblemPersistence =
  | "transient"            // appeared once — likely noise or fatigue artifact
  | "emerging"             // appeared 2+ sessions — developing pattern
  | "persistent_pattern"   // appeared 4+ sessions — stable observation
  | "chronic";             // appeared over 14+ days — long-running observation

/** Direction of performance change across sessions */
export type PerformanceTrend =
  | "improving"
  | "stable"
  | "declining"
  | "unknown";             // insufficient data

/**
 * Type of fatigue accumulation pattern.
 *
 * Limited intentionally to what is observable from session readings.
 * No physiological / systemic recovery claims.
 */
export type FatiguePattern =
  | "acute"                // single-session spike
  | "accumulated"          // multi-session buildup
  | "stable";              // no clear pattern from available data

/** Per-view confidence rating. */
export type Confidence = "low" | "medium" | "high";

// ── Athlete Session Snapshot ─────────────────────────────────────────────────

/** Lightweight historical snapshot for one training session */
export interface AthleteSessionSnapshot {
  /** Session timestamp (ms since epoch) */
  timestamp: number;
  /** Readiness score (0-100 or 0-10) */
  readiness: number;
  /** Fatigue score (0-100) */
  fatigue: number;
  /** Success rate for the session (0-100) */
  success_rate: number;
  /** Average RPE for the session (6-10 scale) */
  average_RPE: number;
  /** Problems detected in this session */
  detected_problems: string[];
  /** Whether any intervention was applied */
  intervention_applied?: boolean;
  /** Primary problem targeted (if intervention applied) */
  primary_problem?: string;
  /** Optional session notes */
  notes?: string[];
}

// ── Derived Coaching State ───────────────────────────────────────────────────

export interface ProblemPersistenceView {
  classification: ProblemPersistence;
  /** Number of sessions in which this problem was observed (within window). */
  sessions_observed: number;
  /** Days span between first and last observation (within window). */
  days_span: number;
  confidence: Confidence;
  notes: string[];
}

export interface PerformanceTrendView {
  trend: PerformanceTrend;
  /** Number of sessions used for the trend calculation. */
  sessions_analyzed: number;
  confidence: Confidence;
  notes: string[];
}

export interface FatiguePatternView {
  pattern: FatiguePattern;
  /** Number of sessions inspected for the pattern. */
  sessions_analyzed: number;
  confidence: Confidence;
  notes: string[];
}

/** Coaching state derived from session history. */
export interface DerivedCoachingState {
  /** Persistence view per observed problem. */
  persistence_by_problem: Record<string, ProblemPersistenceView>;
  /** Overall performance trend view. */
  performance: PerformanceTrendView;
  /** Current fatigue pattern view. */
  fatigue: FatiguePatternView;
  /** Engine-wide observations. */
  meta: {
    sessions_in_window: number;
    overall_confidence: Confidence;
    data_gaps: string[];
    notes: string[];
  };
}

// ── Configuration ────────────────────────────────────────────────────────────

export interface StateEngineConfig {
  /** Minimum sessions required for medium-confidence views (default: 3) */
  min_sessions_medium_confidence: number;
  /** Sessions threshold for high-confidence views (default: 5) */
  min_sessions_high_confidence: number;
  /** Maximum sessions to consider in window (default: 10) */
  max_sessions: number;
  /** Days threshold for chronic classification (default: 14) */
  chronic_days_threshold: number;
  /** Sessions threshold for persistent_pattern classification (default: 4) */
  persistent_sessions_threshold: number;
  /** Success-rate Δ (pp) threshold for trend detection (default: 8) */
  success_trend_delta: number;
  /** RPE Δ threshold for trend detection (default: 0.6) */
  rpe_trend_delta: number;
  /** Fatigue Δ threshold for accumulated-pattern detection (default: 10) */
  fatigue_trend_delta: number;
  /** Spike threshold for acute fatigue detection (default: 75) */
  acute_fatigue_threshold: number;
}

const DEFAULT_CONFIG: StateEngineConfig = {
  min_sessions_medium_confidence: 3,
  min_sessions_high_confidence: 5,
  max_sessions: 10,
  chronic_days_threshold: 14,
  persistent_sessions_threshold: 4,
  success_trend_delta: 8,
  rpe_trend_delta: 0.6,
  fatigue_trend_delta: 10,
  acute_fatigue_threshold: 75,
};

// ── Internal Helpers ─────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * Normalize readiness score to 0-100 scale.
 * Supports both 0-10 and 0-100 input ranges.
 */
function normalizeReadiness(r: number): number {
  if (!Number.isFinite(r)) return 50;
  return r <= 10 ? r * 10 : r;
}

function confidenceFromSampleSize(
  n: number,
  cfg: StateEngineConfig,
): Confidence {
  if (n >= cfg.min_sessions_high_confidence) return "high";
  if (n >= cfg.min_sessions_medium_confidence) return "medium";
  return "low";
}

/**
 * Conservative trend interpretation: compare first-half average vs
 * second-half average over the window. Returns the delta (second − first).
 *
 * Returns 0 if window cannot be split (sample size < 2).
 *
 * This is intentionally simpler than statistical regression. It rejects
 * single-point outliers more reliably than `last − first` and stays
 * explainable to a coach reading the notes.
 */
function halfSplitDelta(values: number[]): number {
  if (values.length < 2) return 0;
  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(values.length - mid);
  if (firstHalf.length === 0 || secondHalf.length === 0) return 0;
  return mean(secondHalf) - mean(firstHalf);
}

/**
 * Validate and normalize session history ordering.
 * Engine expects oldest-first ordering. If timestamps suggest newest-first,
 * the array is automatically reversed with a warning note added.
 */
function normalizeHistoryOrdering(
  sessions: AthleteSessionSnapshot[],
): { sessions: AthleteSessionSnapshot[]; notes: string[] } {
  const notes: string[] = [];

  if (sessions.length < 2) {
    return { sessions, notes };
  }

  const firstTimestamp = sessions[0].timestamp;
  const lastTimestamp = sessions[sessions.length - 1].timestamp;

  if (firstTimestamp > lastTimestamp) {
    notes.push(
      `History ordering detected as newest-first. Reversing to oldest-first for analysis.`,
    );
    return { sessions: [...sessions].reverse(), notes };
  }

  return { sessions, notes };
}

// ── Derivation Functions ─────────────────────────────────────────────────────

/**
 * Derive problem persistence view from session history.
 *
 * Heuristics:
 * - 1 session                        → transient
 * - 2 sessions                       → emerging
 * - 4+ sessions                      → persistent_pattern
 * - observed across 14+ days         → chronic
 *
 * IMPORTANT: persistence is an OBSERVATION of repeated appearance,
 * not a biomechanical diagnosis. Downstream layers must not treat it
 * as proof of a chronic technical flaw.
 */
function deriveProblemPersistence(
  sessions: AthleteSessionSnapshot[],
  problem: string,
  config: StateEngineConfig,
): ProblemPersistenceView {
  const sessionsWithProblem = sessions.filter(s =>
    s.detected_problems.includes(problem),
  );
  const sessionCount = sessionsWithProblem.length;
  const notes: string[] = [];

  if (sessionCount === 0) {
    return {
      classification: "transient",
      sessions_observed: 0,
      days_span: 0,
      confidence: "low",
      notes: ["Problem not observed in window."],
    };
  }

  const firstAppearance = sessionsWithProblem[0].timestamp;
  const lastAppearance = sessionsWithProblem[sessionCount - 1].timestamp;
  const daysSpan = (lastAppearance - firstAppearance) / (1000 * 60 * 60 * 24);

  let classification: ProblemPersistence;
  if (daysSpan >= config.chronic_days_threshold) {
    classification = "chronic";
    notes.push(
      `Observed across ${daysSpan.toFixed(1)} days (≥ ${config.chronic_days_threshold}) → chronic.`,
    );
  } else if (sessionCount >= config.persistent_sessions_threshold) {
    classification = "persistent_pattern";
    notes.push(
      `Observed in ${sessionCount} sessions (≥ ${config.persistent_sessions_threshold}) → persistent_pattern.`,
    );
  } else if (sessionCount >= 2) {
    classification = "emerging";
    notes.push(`Observed in ${sessionCount} sessions → emerging.`);
  } else {
    classification = "transient";
    notes.push(`Observed in 1 session → transient.`);
  }

  // Confidence scales with how many session-level observations support it.
  const confidence: Confidence =
    sessionCount >= 4 ? "high" :
    sessionCount >= 2 ? "medium" : "low";

  return {
    classification,
    sessions_observed: sessionCount,
    days_span: daysSpan,
    confidence,
    notes,
  };
}

/**
 * Derive performance trend view.
 *
 * Uses conservative half-split deltas across:
 *   - success_rate (primary)
 *   - readiness    (supporting)
 *   - fatigue      (inverse: rising fatigue = declining)
 *   - average_RPE  (inverse: rising RPE = declining)
 *
 * Each metric contributes a vote. Trend is decided by majority vote
 * with success_rate weighted twice. No hidden composite score.
 */
function derivePerformanceTrend(
  sessions: AthleteSessionSnapshot[],
  config: StateEngineConfig,
): PerformanceTrendView {
  const notes: string[] = [];
  const n = sessions.length;

  if (n < 2) {
    notes.push(`Only ${n} session(s) in window — trend not computable.`);
    return {
      trend: "unknown",
      sessions_analyzed: n,
      confidence: "low",
      notes,
    };
  }

  const successDelta   = halfSplitDelta(sessions.map(s => s.success_rate));
  const readinessDelta = halfSplitDelta(sessions.map(s => normalizeReadiness(s.readiness)));
  const fatigueDelta   = halfSplitDelta(sessions.map(s => s.fatigue));
  const rpeDelta       = halfSplitDelta(sessions.map(s => s.average_RPE));

  // Per-metric vote: +1 improving, -1 declining, 0 stable.
  const voteFor = (delta: number, threshold: number, inverse: boolean): number => {
    if (Math.abs(delta) < threshold) return 0;
    const sign = delta > 0 ? 1 : -1;
    return inverse ? -sign : sign;
  };

  const successVote   = voteFor(successDelta,   config.success_trend_delta, false);
  const readinessVote = voteFor(readinessDelta, config.success_trend_delta, false);
  const fatigueVote   = voteFor(fatigueDelta,   config.fatigue_trend_delta, true);
  const rpeVote       = voteFor(rpeDelta,       config.rpe_trend_delta,     true);

  // success_rate weighted twice (most directly observable performance signal).
  const totalVote = (successVote * 2) + readinessVote + fatigueVote + rpeVote;

  let trend: PerformanceTrend;
  if (totalVote >= 2) trend = "improving";
  else if (totalVote <= -2) trend = "declining";
  else trend = "stable";

  notes.push(
    `Success Δ ${successDelta.toFixed(1)} pp; ` +
    `Readiness Δ ${readinessDelta.toFixed(1)}; ` +
    `Fatigue Δ ${fatigueDelta.toFixed(1)}; ` +
    `RPE Δ ${rpeDelta.toFixed(2)}.`,
  );
  notes.push(`Vote total ${totalVote} → ${trend}.`);

  return {
    trend,
    sessions_analyzed: n,
    confidence: confidenceFromSampleSize(n, config),
    notes,
  };
}

/**
 * Derive fatigue pattern view.
 *
 * Patterns observable from session readings only:
 *   - acute       → current fatigue spikes above threshold relative to recent baseline
 *   - accumulated → multi-session upward trend in fatigue
 *   - stable      → no clear pattern in available data
 *
 * Removed (out of scope for evidence available):
 *   - systemic   (would require physiological / chronic-fatigue inference)
 *   - resolved   (would require longitudinal recovery tracking we do not have)
 */
function deriveFatiguePattern(
  sessions: AthleteSessionSnapshot[],
  config: StateEngineConfig,
): FatiguePatternView {
  const notes: string[] = [];
  const n = sessions.length;

  if (n < 2) {
    notes.push(`Only ${n} session(s) — pattern defaulted to stable.`);
    return {
      pattern: "stable",
      sessions_analyzed: n,
      confidence: "low",
      notes,
    };
  }

  const fatigueValues = sessions.map(s => s.fatigue);
  const current = fatigueValues[fatigueValues.length - 1];
  const baseline = mean(fatigueValues.slice(0, -1)); // all but the last
  const trendDelta = halfSplitDelta(fatigueValues);

  let pattern: FatiguePattern;
  if (
    current >= config.acute_fatigue_threshold &&
    current - baseline >= config.fatigue_trend_delta
  ) {
    pattern = "acute";
    notes.push(
      `Current fatigue ${current} ≥ ${config.acute_fatigue_threshold}, ` +
      `baseline ${baseline.toFixed(1)} → acute spike.`,
    );
  } else if (trendDelta >= config.fatigue_trend_delta) {
    pattern = "accumulated";
    notes.push(
      `Fatigue Δ ${trendDelta.toFixed(1)} (≥ ${config.fatigue_trend_delta}) → accumulated.`,
    );
  } else {
    pattern = "stable";
    notes.push(
      `Fatigue Δ ${trendDelta.toFixed(1)} within ±${config.fatigue_trend_delta} → stable.`,
    );
  }

  return {
    pattern,
    sessions_analyzed: n,
    confidence: confidenceFromSampleSize(n, config),
    notes,
  };
}

// ── Main State Engine ────────────────────────────────────────────────────────

export interface StateEngineInput {
  /** Historical session snapshots (any order — engine normalizes). */
  sessions: AthleteSessionSnapshot[];
  /** Optional configuration overrides */
  config?: Partial<StateEngineConfig>;
  /**
   * Optional primary problem currently under coaching focus.
   * If provided, its persistence view is guaranteed to be present in
   * `persistence_by_problem` even if not observed in the window.
   */
  primary_problem?: string;
}

/**
 * Convert session history into derived coaching state.
 *
 * Pure function. No side effects. No persistence. No async.
 * The caller is responsible for managing session history.
 */
export function deriveCoachingState(input: StateEngineInput): DerivedCoachingState {
  const config: StateEngineConfig = {
    ...DEFAULT_CONFIG,
    ...input.config,
  };

  const data_gaps: string[] = [];
  const engineNotes: string[] = [];

  // Order normalization
  const ordered = normalizeHistoryOrdering(input.sessions);
  engineNotes.push(...ordered.notes);

  // Window selection (last N)
  const windowSessions = ordered.sessions.slice(-config.max_sessions);

  if (windowSessions.length === 0) {
    data_gaps.push("No sessions provided.");
    return {
      persistence_by_problem: {},
      performance: {
        trend: "unknown",
        sessions_analyzed: 0,
        confidence: "low",
        notes: ["No sessions in window."],
      },
      fatigue: {
        pattern: "stable",
        sessions_analyzed: 0,
        confidence: "low",
        notes: ["No sessions in window."],
      },
      meta: {
        sessions_in_window: 0,
        overall_confidence: "low",
        data_gaps,
        notes: engineNotes,
      },
    };
  }

  // Data gap reporting (drives confidence downgrades downstream)
  if (!windowSessions.some(s => s.detected_problems.length > 0)) {
    data_gaps.push("No detected_problems in any session — persistence views inactive.");
  }

  // Collect all unique problems observed in window
  const allProblems = new Set<string>();
  windowSessions.forEach(s =>
    s.detected_problems.forEach(p => allProblems.add(p)),
  );

  // Always include the primary_problem in the output map even if absent.
  if (input.primary_problem) {
    allProblems.add(input.primary_problem);
  }

  const persistence_by_problem: Record<string, ProblemPersistenceView> = {};
  allProblems.forEach(problem => {
    persistence_by_problem[problem] = deriveProblemPersistence(
      windowSessions,
      problem,
      config,
    );
  });

  const performance = derivePerformanceTrend(windowSessions, config);
  const fatigue     = deriveFatiguePattern(windowSessions, config);

  // Overall confidence = lowest among substantive views.
  const rank = (c: Confidence) => (c === "high" ? 2 : c === "medium" ? 1 : 0);
  const candidateConfidences: Confidence[] = [performance.confidence, fatigue.confidence];
  const overall_confidence = candidateConfidences.reduce(
    (acc, c) => (rank(c) < rank(acc) ? c : acc),
    "high" as Confidence,
  );

  return {
    persistence_by_problem,
    performance,
    fatigue,
    meta: {
      sessions_in_window: windowSessions.length,
      overall_confidence,
      data_gaps,
      notes: engineNotes,
    },
  };
}

/**
 * Get a summary of the coaching state for logging/display.
 */
export function summarizeCoachingState(state: DerivedCoachingState): string {
  const lines: string[] = [];

  lines.push(`Sessions in window: ${state.meta.sessions_in_window} (overall confidence: ${state.meta.overall_confidence})`);
  lines.push(`Performance trend: ${state.performance.trend} (${state.performance.confidence})`);
  lines.push(`Fatigue pattern:   ${state.fatigue.pattern} (${state.fatigue.confidence})`);

  const problems = Object.entries(state.persistence_by_problem);
  if (problems.length > 0) {
    lines.push(`Problem persistence:`);
    problems.forEach(([problem, view]) => {
      lines.push(
        `  - ${problem}: ${view.classification} ` +
        `(${view.sessions_observed} sessions, ${view.days_span.toFixed(1)}d, ${view.confidence})`,
      );
    });
  }

  if (state.meta.data_gaps.length > 0) {
    lines.push(`Data gaps:`);
    state.meta.data_gaps.forEach(g => lines.push(`  - ${g}`));
  }

  return lines.join("\n");
}

// ── Arbiter Integration Hooks ────────────────────────────────────────────────

/**
 * Bridge derived coaching state to the intervention arbiter.
 *
 * The arbiter does NOT receive severity or diagnostic-confidence scores
 * from the State Engine — those would mix observation with diagnosis.
 * It receives only what the engine can honestly observe:
 *
 *   - persistence classification (transient → chronic) for the primary problem
 *   - performance trend
 *   - fatigue pattern
 *   - per-view confidence
 *
 * The arbiter is responsible for combining these observations with its
 * own domain rules to decide whether intervention is appropriate.
 */
export interface ArbiterStateExtension {
  performance_trend?: PerformanceTrend;
  performance_confidence?: Confidence;
  fatigue_pattern?: FatiguePattern;
  fatigue_confidence?: Confidence;
  primary_problem_persistence?: ProblemPersistence;
  primary_problem_sessions_observed?: number;
  primary_problem_days_span?: number;
  primary_problem_confidence?: Confidence;
  state_overall_confidence?: Confidence;
  state_data_gaps?: string[];
}

export function toArbiterExtension(
  state: DerivedCoachingState,
  primaryProblem?: string,
): ArbiterStateExtension {
  const ext: ArbiterStateExtension = {
    performance_trend:        state.performance.trend,
    performance_confidence:   state.performance.confidence,
    fatigue_pattern:          state.fatigue.pattern,
    fatigue_confidence:       state.fatigue.confidence,
    state_overall_confidence: state.meta.overall_confidence,
    state_data_gaps:          state.meta.data_gaps,
  };

  if (primaryProblem) {
    const view = state.persistence_by_problem[primaryProblem];
    if (view) {
      ext.primary_problem_persistence       = view.classification;
      ext.primary_problem_sessions_observed = view.sessions_observed;
      ext.primary_problem_days_span         = view.days_span;
      ext.primary_problem_confidence        = view.confidence;
    }
  }

  return ext;
}