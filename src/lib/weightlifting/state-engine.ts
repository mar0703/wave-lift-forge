// State Engine
// -----------------------------------------------------------------------------
// Lightweight coaching-state interpreter that converts repeated session
// snapshots into meaningful coaching state.
//
// This is NOT a database layer.
// This is NOT ML.
// This is NOT a full athlete history system.
//
// Core purpose: introduce temporal memory and trajectory awareness
// into the coaching system using pure deterministic functions.

// ── Core State Concepts ──────────────────────────────────────────────────────

/** How long a problem has been observed across sessions */
export type ProblemPersistence =
  | "transient"          // appeared once — likely noise or fatigue artifact
  | "emerging"           // appeared 2+ sessions — developing pattern
  | "persistent_pattern" // appeared 4+ sessions — stable technical issue
  | "chronic";           // appeared 14+ days — deeply ingrained

/** Direction of performance change across sessions */
export type PerformanceTrend =
  | "improving"   // getting better
  | "stable"      // no significant change
  | "declining";  // getting worse

/** Type of fatigue accumulation pattern */
export type FatiguePattern =
  | "acute"       // single-session spike
  | "accumulated" // multi-session buildup
  | "systemic"    // chronic fatigue trend
  | "resolved";   // fatigue clearing

/** How athlete responded to intervention */
export type InterventionResponse =
  | "improving"   // getting better after intervention
  | "unchanged"   // no change after intervention
  | "worsening"   // getting worse after intervention
  | "unstable";   // inconsistent response

// ── Athlete Session Snapshot ─────────────────────────────────────────────────

/** Lightweight historical snapshot for one training session */
export interface AthleteSessionSnapshot {
  /** Session timestamp (ms since epoch) */
  timestamp: number;

  /** Readiness score (0-100) */
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

/** Coaching state derived from session history */
export interface DerivedCoachingState {
  /** Persistence classification for each observed problem */
  persistence_by_problem: Record<string, ProblemPersistence>;

  /** Overall performance trend direction */
  performance_trend: PerformanceTrend;

  /** Current fatigue accumulation pattern */
  fatigue_pattern: FatiguePattern;

  /** Response to last intervention (if any) */
  intervention_response?: InterventionResponse;

  /** Movement stability score (0-100) — lower = more variable */
  movement_stability_score: number;

  /** Confidence placeholder (future integration) */
  confidence_score?: number;

  /** Debug notes (e.g., ordering corrections) — for development use only */
  _debug_notes?: string[];
}

// ── Configuration ────────────────────────────────────────────────────────────

export interface StateEngineConfig {
  /** Minimum sessions required for analysis (default: 3) */
  min_sessions: number;

  /** Maximum sessions to consider (default: 10) */
  max_sessions: number;

  /** Days threshold for chronic classification (default: 14) */
  chronic_days_threshold: number;

  /** Sessions threshold for persistent_pattern classification (default: 4) */
  persistent_sessions_threshold: number;

  /** Success rate change threshold for trend detection (default: 10) */
  trend_threshold: number;
}

const DEFAULT_CONFIG: StateEngineConfig = {
  min_sessions: 3,
  max_sessions: 10,
  chronic_days_threshold: 14,
  persistent_sessions_threshold: 4,
  trend_threshold: 10,
};

// ── Internal Helpers ─────────────────────────────────────────────────────────

/**
 * Normalize readiness score to 0-100 scale.
 * Supports both 0-10 and 0-100 input ranges.
 */
function normalizeReadiness(r: number): number {
  if (!Number.isFinite(r)) return 50;
  return r <= 10 ? r * 10 : r;
}

/**
 * Validate and normalize session history ordering.
 * Engine expects oldest-first ordering. If timestamps suggest newest-first,
 * the array is automatically reversed with a warning note added.
 *
 * Returns: { sessions: normalized array, notes: any ordering warnings }
 */
function normalizeHistoryOrdering(
  sessions: AthleteSessionSnapshot[],
): { sessions: AthleteSessionSnapshot[]; notes: string[] } {
  const notes: string[] = [];

  if (sessions.length < 2) {
    return { sessions, notes };
  }

  // Check ordering by comparing first and last timestamps
  const firstTimestamp = sessions[0].timestamp;
  const lastTimestamp = sessions[sessions.length - 1].timestamp;

  if (firstTimestamp > lastTimestamp) {
    // Appears to be newest-first — reverse to oldest-first
    notes.push(
      `History ordering detected as newest-first (first=${new Date(firstTimestamp).toISOString().slice(0, 10)}, last=${new Date(lastTimestamp).toISOString().slice(0, 10)}). Reversing to oldest-first for analysis.`,
    );
    return { sessions: [...sessions].reverse(), notes };
  }

  return { sessions, notes };
}

// ── Derivation Functions ─────────────────────────────────────────────────────

/**
 * Derive problem persistence from session history.
 *
 * Heuristics:
 * - appears in 1 session → transient
 * - appears in 2 sessions → emerging
 * - appears in 4+ sessions → persistent_pattern
 * - appears over 14+ days → chronic
 */
function deriveProblemPersistence(
  sessions: AthleteSessionSnapshot[],
  problem: string,
  config: StateEngineConfig,
): ProblemPersistence {
  // Count sessions where problem appeared
  const sessionsWithProblem = sessions.filter(s =>
    s.detected_problems.includes(problem)
  );

  const sessionCount = sessionsWithProblem.length;

  if (sessionCount === 0) return "transient";

  // Calculate days span
  const firstAppearance = sessionsWithProblem[0].timestamp;
  const lastAppearance = sessionsWithProblem[sessionCount - 1].timestamp;
  const daysSpan = (lastAppearance - firstAppearance) / (1000 * 60 * 60 * 24);

  // Classify persistence
  if (daysSpan >= config.chronic_days_threshold) {
    return "chronic";
  }
  if (sessionCount >= config.persistent_sessions_threshold) {
    return "persistent_pattern";
  }
  if (sessionCount >= 2) {
    return "emerging";
  }
  return "transient";
}

/**
 * Derive performance trend from session history.
 *
 * Uses:
 * - success_rate trend
 * - readiness trend
 * - fatigue trend (inverse)
 * - RPE trend (inverse)
 */
function derivePerformanceTrend(
  sessions: AthleteSessionSnapshot[],
  config: StateEngineConfig,
): PerformanceTrend {
  if (sessions.length < 2) return "stable";

  // Use last N sessions for trend
  const recentSessions = sessions.slice(-config.max_sessions);

  // Calculate simple linear trend for each metric
  const successTrend = calculateTrend(recentSessions.map(s => s.success_rate));
  // Normalize readiness (supports 0-10 or 0-100 input)
  const readinessTrend = calculateTrend(recentSessions.map(s => normalizeReadiness(s.readiness)));
  const fatigueTrend = calculateTrend(recentSessions.map(s => s.fatigue));
  const rpeTrend = calculateTrend(recentSessions.map(s => s.average_RPE));

  // Score: positive = improving, negative = declining
  let score = 0;

  // Success rate trend (most important)
  if (successTrend > config.trend_threshold) score += 2;
  else if (successTrend < -config.trend_threshold) score -= 2;

  // Readiness trend
  if (readinessTrend > config.trend_threshold) score += 1;
  else if (readinessTrend < -config.trend_threshold) score -= 1;

  // Fatigue trend (inverse — decreasing fatigue is good)
  if (fatigueTrend < -config.trend_threshold) score += 1;
  else if (fatigueTrend > config.trend_threshold) score -= 1;

  // RPE trend (inverse — decreasing RPE is good)
  if (rpeTrend < -1) score += 1;
  else if (rpeTrend > 1) score -= 1;

  // Classify
  if (score >= 2) return "improving";
  if (score <= -2) return "declining";
  return "stable";
}

/**
 * Simple linear trend calculation (last value - first value).
 * For more sessions, uses average of pairwise differences.
 */
function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0;

  // Simple: last - first
  return values[values.length - 1] - values[0];
}

/**
 * Derive fatigue pattern from session history.
 *
 * Patterns:
 * - acute: single-session spike (high fatigue, was low before)
 * - accumulated: multi-session buildup (fatigue increasing)
 * - systemic: chronic high fatigue (consistently high)
 * - resolved: fatigue decreasing after intervention
 */
function deriveFatiguePattern(
  sessions: AthleteSessionSnapshot[],
  config: StateEngineConfig,
): FatiguePattern {
  if (sessions.length < 2) return "acute";

  const recentSessions = sessions.slice(-config.max_sessions);
  const currentFatigue = recentSessions[recentSessions.length - 1].fatigue;
  const previousFatigue = recentSessions[recentSessions.length - 2]?.fatigue ?? currentFatigue;

  // Calculate fatigue trend
  const fatigueValues = recentSessions.map(s => s.fatigue);
  const fatigueTrend = calculateTrend(fatigueValues);
  const avgFatigue = fatigueValues.reduce((a, b) => a + b, 0) / fatigueValues.length;

  // Classify pattern
  if (currentFatigue < 50 && fatigueTrend < -5) {
    return "resolved"; // Fatigue decreasing from higher levels
  }

  if (avgFatigue > 70) {
    return "systemic"; // Consistently high fatigue
  }

  if (fatigueTrend > 10) {
    return "accumulated"; // Clear upward trend
  }

  if (currentFatigue > 75 && previousFatigue < 60) {
    return "acute"; // Sudden spike
  }

  // Default based on current level
  if (currentFatigue > 70) return "accumulated";
  return "acute";
}

/**
 * Derive intervention response by comparing sessions before and after intervention.
 */
function deriveInterventionResponse(
  sessions: AthleteSessionSnapshot[],
  primaryProblem: string,
): InterventionResponse | undefined {
  // Find the session where intervention was applied
  const interventionIndex = sessions.findIndex(s => s.intervention_applied && s.primary_problem === primaryProblem);

  if (interventionIndex === -1 || interventionIndex >= sessions.length - 1) {
    return undefined; // No intervention found or no sessions after
  }

  const preIntervention = sessions[interventionIndex];
  const postSessions = sessions.slice(interventionIndex + 1);

  if (postSessions.length === 0) return undefined;

  // Check if primary problem still appears
  const problemStillAppears = postSessions.some(s => s.detected_problems.includes(primaryProblem));

  if (!problemStillAppears) {
    return "improving"; // Problem resolved
  }

  // Compare problem frequency before/after
  const preProblemCount = preIntervention.detected_problems.filter(p => p === primaryProblem).length;
  const postProblemCount = postSessions.filter(s => s.detected_problems.includes(primaryProblem)).length;

  if (postProblemCount < preProblemCount) return "improving";
  if (postProblemCount > preProblemCount) return "worsening";

  // Check stability
  const responses = postSessions.map(s => s.detected_problems.includes(primaryProblem) ? 1 : 0);
  const variance = responses.some(r => r !== responses[0]);

  if (variance) return "unstable";
  return "unchanged";
}

/**
 * Derive movement stability score from problem consistency.
 *
 * 0 = completely different problems every session
 * 100 = identical problems every session
 */
function deriveMovementStability(sessions: AthleteSessionSnapshot[]): number {
  if (sessions.length < 2) return 100;

  const recentSessions = sessions.slice(-6); // Last 6 sessions

  // Count unique problems across sessions
  const allProblems = new Set<string>();
  recentSessions.forEach(s => s.detected_problems.forEach(p => allProblems.add(p)));

  if (allProblems.size === 0) return 100; // No problems = stable

  // Calculate average problems per session
  const avgProblemsPerSession = recentSessions.reduce((sum, s) => sum + s.detected_problems.length, 0) / recentSessions.length;

  // Stability = how consistent the problem set is
  // If same problems appear every session, stability is high
  // If different problems each session, stability is low
  const problemFrequency: Record<string, number> = {};
  recentSessions.forEach(s => {
    s.detected_problems.forEach(p => {
      problemFrequency[p] = (problemFrequency[p] ?? 0) + 1;
    });
  });

  // Calculate stability: problems that appear in all sessions contribute to high stability
  const consistentProblems = Object.values(problemFrequency).filter(count => count === recentSessions.length).length;
  const totalUniqueProblems = Object.keys(problemFrequency).length;

  if (totalUniqueProblems === 0) return 100;

  // Score based on how many problems are consistent
  const consistencyRatio = consistentProblems / totalUniqueProblems;
  const sessionConsistency = 1 - (avgProblemsPerSession / allProblems.size);

  return Math.round(Math.max(0, Math.min(100, (consistencyRatio * 60 + sessionConsistency * 40) * 100)));
}

// ── Main State Engine ────────────────────────────────────────────────────────

export interface StateEngineInput {
  /** Historical session snapshots (ordered by timestamp, oldest first) */
  sessions: AthleteSessionSnapshot[];

  /** Optional configuration overrides */
  config?: Partial<StateEngineConfig>;

  /** Primary problem to track for intervention response */
  primary_problem?: string;
}

/**
 * Convert session history into derived coaching state.
 *
 * This is a pure function — no side effects, no persistence.
 * The caller is responsible for managing session history.
 *
 * Note: History ordering is validated and normalized automatically.
 * If timestamps suggest newest-first, the array is reversed with a warning.
 */
export function deriveCoachingState(input: StateEngineInput): DerivedCoachingState {
  const config: StateEngineConfig = {
    ...DEFAULT_CONFIG,
    ...input.config,
  };

  // Validate and normalize history ordering (oldest-first expected)
  const { sessions: normalizedSessions, notes: orderingNotes } = normalizeHistoryOrdering(input.sessions);

  // Filter to relevant sessions (last N)
  const sessions = normalizedSessions.slice(-config.max_sessions);

  // Collect all unique problems
  const allProblems = new Set<string>();
  sessions.forEach(s => s.detected_problems.forEach(p => allProblems.add(p)));

  // Derive persistence for each problem
  const persistence_by_problem: Record<string, ProblemPersistence> = {};
  allProblems.forEach(problem => {
    persistence_by_problem[problem] = deriveProblemPersistence(sessions, problem, config);
  });

  // Derive performance trend
  const performance_trend = derivePerformanceTrend(sessions, config);

  // Derive fatigue pattern
  const fatigue_pattern = deriveFatiguePattern(sessions, config);

  // Derive intervention response
  const intervention_response = input.primary_problem
    ? deriveInterventionResponse(sessions, input.primary_problem)
    : undefined;

  // Derive movement stability
  const movement_stability_score = deriveMovementStability(sessions);

  return {
    persistence_by_problem,
    performance_trend,
    fatigue_pattern,
    intervention_response,
    movement_stability_score,
    // Include ordering notes for debugging (if any were generated)
    ...(orderingNotes.length > 0 ? { _debug_notes: orderingNotes } : {}),
  };
}

/**
 * Get a summary of the coaching state for logging/display.
 */
export function summarizeCoachingState(state: DerivedCoachingState): string {
  const lines: string[] = [];

  // Performance trend
  lines.push(`Performance trend: ${state.performance_trend}`);

  // Fatigue pattern
  lines.push(`Fatigue pattern: ${state.fatigue_pattern}`);

  // Problem persistence
  const problems = Object.entries(state.persistence_by_problem);
  if (problems.length > 0) {
    lines.push(`Problem persistence:`);
    problems.forEach(([problem, persistence]) => {
      lines.push(`  - ${problem}: ${persistence}`);
    });
  }

  // Intervention response
  if (state.intervention_response) {
    lines.push(`Intervention response: ${state.intervention_response}`);
  }

  // Movement stability
  lines.push(`Movement stability: ${state.movement_stability_score}/100`);

  return lines.join("\n");
}

// ── Arbiter Integration Hooks ────────────────────────────────────────────────

/**
 * Convert derived coaching state to arbiter input extensions.
 *
 * This function bridges the state engine output to the intervention arbiter.
 */
export interface ArbiterStateExtension {
  performance_trend?: "improving" | "stable" | "declining";
  problem_persistence_days?: number;
  diagnostic_confidence?: number;
  problem_severity_score?: number;
}

export function toArbiterExtension(
  state: DerivedCoachingState,
  primaryProblem?: string,
): ArbiterStateExtension {
  const extension: ArbiterStateExtension = {
    performance_trend: state.performance_trend,
  };

  // Estimate persistence days from persistence classification
  if (primaryProblem && state.persistence_by_problem[primaryProblem]) {
    const persistence = state.persistence_by_problem[primaryProblem];
    switch (persistence) {
      case "transient":
        extension.problem_persistence_days = 1;
        extension.diagnostic_confidence = 30; // Low confidence — might be noise
        break;
      case "emerging":
        extension.problem_persistence_days = 3;
        extension.diagnostic_confidence = 50;
        break;
      case "persistent_pattern":
        extension.problem_persistence_days = 7;
        extension.diagnostic_confidence = 70;
        break;
      case "chronic":
        extension.problem_persistence_days = 14;
        extension.diagnostic_confidence = 90;
        break;
    }
  }

  // Movement stability as inverse severity
  extension.problem_severity_score = 100 - state.movement_stability_score;

  return extension;
}