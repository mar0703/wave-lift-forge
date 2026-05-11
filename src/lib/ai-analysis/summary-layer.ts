/**
 * AI ANALYSIS LAYER — SUMMARY LAYER
 * 
 * Responsibility:
 *   - Summarize training week or mesocycle
 *   - Extract trends from historical data
 * 
 * Constraints:
 *   - READ-ONLY: Does not modify any system state
 *   - DESCRIPTIVE: Outputs are summaries, not decisions
 *   - PURE: No side effects, deterministic given same inputs
 * 
 * This layer produces human-readable summaries of training periods and extracts
 * meaningful trends from historical data. It does NOT make training decisions.
 */

import type {
  ConfidenceLevel,
  TrendDirection,
  WeekSummary,
  MesocycleSummary,
  TrendAnalysis,
  AnalysisSessionData,
  AIAnalysisConfig,
} from "./types";
import { DEFAULT_AI_ANALYSIS_CONFIG } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const squaredDiffs = values.map((v) => (v - m) ** 2);
  return Math.sqrt(mean(squaredDiffs));
}

function normalizeReadiness(r: number): number {
  return r <= 10 ? r * 10 : clamp(r, 0, 100);
}

function confidenceFromSampleSize(n: number, config: AIAnalysisConfig): ConfidenceLevel {
  if (n >= config.min_sessions + 3) return "high";
  if (n >= config.min_sessions + 1) return "moderate";
  return "low";
}

function determineTrendDirection(
  values: readonly number[],
  threshold: number = 5,
): TrendDirection {
  if (values.length < 2) return "unknown";
  const first = values[0];
  const last = values[values.length - 1];
  const delta = last - first;

  if (delta > threshold) return "increasing";
  if (delta < -threshold) return "decreasing";
  return "stable";
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEK SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Group sessions into weekly buckets.
 * Assumes sessions are in chronological order (oldest first).
 */
function groupSessionsByWeek(sessions: readonly AnalysisSessionData[]): AnalysisSessionData[][] {
  if (sessions.length === 0) return [];

  const weeks: AnalysisSessionData[][] = [];
  let currentWeek: AnalysisSessionData[] = [sessions[0]];

  for (let i = 1; i < sessions.length; i++) {
    const prevDate = new Date(sessions[i - 1].timestamp);
    const currDate = new Date(sessions[i].timestamp);
    const prevWeek = getWeekNumber(prevDate);
    const currWeek = getWeekNumber(currDate);

    if (currWeek !== prevWeek || currDate.getFullYear() !== prevDate.getFullYear()) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(sessions[i]);
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
}

/**
 * Generate a summary for a single week of training.
 */
export function summarizeWeek(
  sessions: readonly AnalysisSessionData[],
  weekIndex: number,
  config: AIAnalysisConfig = DEFAULT_AI_ANALYSIS_CONFIG,
): WeekSummary | null {
  if (sessions.length === 0) return null;

  const confidence = confidenceFromSampleSize(sessions.length, config);

  // Basic metrics
  const avgReadiness = mean(sessions.map((s) => normalizeReadiness(s.readiness)));
  const avgFatigue = mean(sessions.map((s) => s.fatigue));

  // Load trend
  const readinessValues = sessions.map((s) => normalizeReadiness(s.readiness));
  const loadTrend = determineTrendDirection(readinessValues);

  // Key observations
  const keyObservations: string[] = [];
  const performanceTrends: string[] = [];
  const patterns: string[] = [];

  // Session count analysis
  if (sessions.length >= 5) {
    keyObservations.push(`High training frequency (${sessions.length} sessions).`);
  } else if (sessions.length <= 2) {
    keyObservations.push(`Low training frequency (${sessions.length} sessions).`);
  }

  // Readiness analysis
  if (avgReadiness >= 80) {
    keyObservations.push(`Consistently high readiness (avg: ${avgReadiness.toFixed(0)}/100).`);
  } else if (avgReadiness <= 50) {
    keyObservations.push(`Below-optimal readiness throughout week (avg: ${avgReadiness.toFixed(0)}/100).`);
  }

  // Fatigue analysis
  const fatigueValues = sessions.map((s) => s.fatigue);
  const fatigueVariability = stdDev(fatigueValues);
  if (avgFatigue >= 70) {
    keyObservations.push(`Elevated fatigue levels throughout week (avg: ${avgFatigue.toFixed(0)}/100).`);
  }
  if (fatigueVariability > 20) {
    patterns.push(`High day-to-day fatigue variability (±${fatigueVariability.toFixed(0)}).`);
  }

  // Success rate trends
  const successRates = sessions.map((s) => s.success_rate);
  const successTrend = determineTrendDirection(successRates, 5);
  if (successTrend === "increasing") {
    performanceTrends.push(`Success rate improved from ${successRates[0].toFixed(0)}% to ${successRates[successRates.length - 1].toFixed(0)}%.`);
  } else if (successTrend === "decreasing") {
    performanceTrends.push(`Success rate declined from ${successRates[0].toFixed(0)}% to ${successRates[successRates.length - 1].toFixed(0)}%.`);
  } else {
    performanceTrends.push(`Success rate remained stable (avg: ${mean(successRates).toFixed(0)}%).`);
  }

  // RPE trends
  const rpeValues = sessions.map((s) => s.average_RPE);
  const rpeTrend = determineTrendDirection(rpeValues, 0.5);
  if (rpeTrend === "increasing") {
    performanceTrends.push(`Session RPE increased (effort perception rising).`);
  } else if (rpeTrend === "decreasing") {
    performanceTrends.push(`Session RPE decreased (effort perception improving).`);
  }

  // Problem patterns
  const allProblems = new Set<string>();
  sessions.forEach((s) => s.detected_problems?.forEach((p) => allProblems.add(p)));
  if (allProblems.size > 0) {
    patterns.push(`${allProblems.size} distinct technical problem(s) detected.`);
  }

  // Intervention patterns
  const interventionCount = sessions.filter((s) => s.intervention_applied).length;
  if (interventionCount > 0) {
    patterns.push(`${interventionCount} session(s) required intervention.`);
  }

  // Week label
  const firstDate = formatDate(sessions[0].timestamp);
  const lastDate = formatDate(sessions[sessions.length - 1].timestamp);
  const weekLabel = `Week ${weekIndex} (${firstDate} – ${lastDate})`;

  return {
    week_label: weekLabel,
    sessions_completed: sessions.length,
    avg_readiness: Math.round(avgReadiness),
    avg_fatigue: Math.round(avgFatigue),
    load_trend: loadTrend,
    key_observations: keyObservations,
    performance_trends: performanceTrends,
    patterns,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MESOCYCLE SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a comprehensive mesocycle summary from weekly data.
 */
export function summarizeMesocycle(
  weeklySummaries: readonly WeekSummary[],
  phase: string = "training",
): MesocycleSummary | null {
  if (weeklySummaries.length === 0) return null;

  const observations: string[] = [];
  const concerns: string[] = [];

  // Adaptation trend (based on readiness trajectory)
  const readinessTrends = weeklySummaries.map((w) => w.avg_readiness);
  const adaptationTrend = determineTrendDirection(readinessTrends, 5);

  // Fatigue trajectory
  const fatigueTrends = weeklySummaries.map((w) => w.avg_fatigue);
  const fatigueEnd = fatigueTrends[fatigueTrends.length - 1];
  const fatigueStart = fatigueTrends[0];
  const fatigueDelta = fatigueEnd - fatigueStart;

  let fatigueTrajectory: MesocycleSummary["fatigue_trajectory"] = "controlled";
  if (fatigueDelta > 20 && fatigueEnd > 70) {
    fatigueTrajectory = "excessive";
    concerns.push("Excessive fatigue accumulation across mesocycle.");
  } else if (fatigueDelta > 10) {
    fatigueTrajectory = "accumulating";
    observations.push("Gradual fatigue accumulation observed.");
  } else if (fatigueEnd < 30 && fatigueDelta < -10) {
    fatigueTrajectory = "insufficient";
    observations.push("Fatigue levels very low — training stimulus may be insufficient.");
  }

  // Key adaptations
  const adaptedObservations: string[] = [];
  if (adaptationTrend === "increasing") {
    adaptedObservations.push("Readiness improved across the mesocycle.");
  } else if (adaptationTrend === "stable") {
    adaptedObservations.push("Readiness remained stable throughout.");
  } else {
    adaptedObservations.push("Readiness declined across the mesocycle.");
    concerns.push("Declining readiness trend warrants attention.");
  }

  // Session volume trend
  const sessionCounts = weeklySummaries.map((w) => w.sessions_completed);
  const volumeTrend = determineTrendDirection(sessionCounts, 1);
  if (volumeTrend === "increasing") {
    adaptedObservations.push("Training volume progressively increased.");
  } else if (volumeTrend === "decreasing") {
    adaptedObservations.push("Training volume was reduced (taper or deload).");
  }

  // Consistency check
  const avgSessionsPerWeek = mean(sessionCounts);
  if (avgSessionsPerWeek >= 4) {
    adaptedObservations.push("High training consistency maintained.");
  }

  // Performance trends across weeks
  const performanceObservations: string[] = [];
  weeklySummaries.forEach((week, i) => {
    if (week.performance_trends.length > 0) {
      performanceObservations.push(`${week.week_label}: ${week.performance_trends[0]}`);
    }
  });

  // Generate narrative
  const narrativeParts: string[] = [];
  narrativeParts.push(`Mesocycle "${phase}" spanned ${weeklySummaries.length} weeks.`);
  narrativeParts.push(`Average training frequency: ${avgSessionsPerWeek.toFixed(1)} sessions/week.`);
  narrativeParts.push(`Fatigue trajectory: ${fatigueTrajectory}.`);
  narrativeParts.push(`Overall adaptation trend: ${adaptationTrend}.`);

  if (concerns.length > 0) {
    narrativeParts.push(`Areas of concern: ${concerns.length} identified.`);
  }

  const narrative = narrativeParts.join(" ");

  return {
    phase,
    weeks: weeklySummaries.length,
    weekly_summaries: weeklySummaries,
    adaptation_trend: adaptationTrend,
    fatigue_trajectory: fatigueTrajectory,
    observed_adaptations: adaptedObservations,
    concerns,
    narrative,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TREND ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyze trends for key metrics from session history.
 */
export function analyzeTrends(
  sessions: readonly AnalysisSessionData[],
  config: AIAnalysisConfig = DEFAULT_AI_ANALYSIS_CONFIG,
): TrendAnalysis[] {
  if (sessions.length < 2) return [];

  const trends: TrendAnalysis[] = [];

  // 1. Readiness trend
  const readinessValues = sessions.map((s) => normalizeReadiness(s.readiness));
  const readinessTrend = determineTrendDirection(readinessValues, 5);
  const readinessDelta = readinessValues[readinessValues.length - 1] - readinessValues[0];
  trends.push({
    metric: "readiness",
    direction: readinessTrend,
    magnitude: readinessDelta,
    confidence: confidenceFromSampleSize(sessions.length, config),
    description: readinessTrend === "increasing"
      ? `Readiness improved by ${readinessDelta.toFixed(0)} points.`
      : readinessTrend === "decreasing"
        ? `Readiness declined by ${Math.abs(readinessDelta).toFixed(0)} points.`
        : `Readiness remained stable (±${Math.abs(readinessDelta).toFixed(0)} points).`,
    inflection_points: findInflectionPoints(readinessValues, 10),
  });

  // 2. Fatigue trend
  const fatigueValues = sessions.map((s) => s.fatigue);
  const fatigueTrend = determineTrendDirection(fatigueValues, 5);
  const fatigueDelta = fatigueValues[fatigueValues.length - 1] - fatigueValues[0];
  trends.push({
    metric: "fatigue",
    direction: fatigueTrend,
    magnitude: fatigueDelta,
    confidence: confidenceFromSampleSize(sessions.length, config),
    description: fatigueTrend === "increasing"
      ? `Fatigue increased by ${fatigueDelta.toFixed(0)} points.`
      : fatigueTrend === "decreasing"
        ? `Fatigue decreased by ${Math.abs(fatigueDelta).toFixed(0)} points.`
        : `Fatigue remained stable (±${Math.abs(fatigueDelta).toFixed(0)} points).`,
    inflection_points: findInflectionPoints(fatigueValues, 10),
  });

  // 3. Success rate trend
  const successValues = sessions.map((s) => s.success_rate);
  const successTrend = determineTrendDirection(successValues, 5);
  const successDelta = successValues[successValues.length - 1] - successValues[0];
  trends.push({
    metric: "success_rate",
    direction: successTrend,
    magnitude: successDelta,
    confidence: confidenceFromSampleSize(sessions.length, config),
    description: successTrend === "increasing"
      ? `Success rate improved by ${successDelta.toFixed(1)} percentage points.`
      : successTrend === "decreasing"
        ? `Success rate declined by ${Math.abs(successDelta).toFixed(1)} percentage points.`
        : `Success rate remained stable (±${Math.abs(successDelta).toFixed(1)}pp).`,
    inflection_points: findInflectionPoints(successValues, 8),
  });

  // 4. RPE trend
  const rpeValues = sessions.map((s) => s.average_RPE);
  const rpeTrend = determineTrendDirection(rpeValues, 0.5);
  const rpeDelta = rpeValues[rpeValues.length - 1] - rpeValues[0];
  trends.push({
    metric: "session_RPE",
    direction: rpeTrend,
    magnitude: rpeDelta,
    confidence: confidenceFromSampleSize(sessions.length, config),
    description: rpeTrend === "increasing"
      ? `Session RPE increased by ${rpeDelta.toFixed(1)} (effort perception rising).`
      : rpeTrend === "decreasing"
        ? `Session RPE decreased by ${Math.abs(rpeDelta).toFixed(1)} (effort perception improving).`
        : `Session RPE remained stable (±${Math.abs(rpeDelta).toFixed(1)}).`,
    inflection_points: findInflectionPoints(rpeValues, 1),
  });

  return trends;
}

/**
 * Find inflection points in a data series.
 * Returns descriptions of notable changes.
 */
function findInflectionPoints(values: readonly number[], threshold: number): string[] {
  const points: string[] = [];
  if (values.length < 3) return points;

  for (let i = 1; i < values.length - 1; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const next = values[i + 1];

    // Check for local maxima
    if (curr - prev >= threshold && curr - next >= threshold) {
      points.push(`Peak at session ${i + 1} (${curr.toFixed(1)}).`);
    }
    // Check for local minima
    else if (prev - curr >= threshold && next - curr >= threshold) {
      points.push(`Trough at session ${i + 1} (${curr.toFixed(1)}).`);
    }
    // Check for sustained direction change
    else if (curr - prev >= threshold && next - curr >= threshold && next - prev >= threshold * 2) {
      points.push(`Upward inflection at session ${i + 1}.`);
    }
    else if (prev - curr >= threshold && curr - next >= threshold && prev - next >= threshold * 2) {
      points.push(`Downward inflection at session ${i + 1}.`);
    }
  }

  return points;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE SUMMARY GENERATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a complete summary from session data.
 * Returns week summaries, mesocycle summary (if enough data), and trend analyses.
 */
export interface FullSummaryOutput {
  readonly week_summaries: readonly WeekSummary[];
  readonly mesocycle_summary: MesocycleSummary | null;
  readonly trend_analyses: readonly TrendAnalysis[];
  readonly overall_summary: string;
}

export function generateFullSummary(
  sessions: readonly AnalysisSessionData[],
  phase: string = "training",
  config: AIAnalysisConfig = DEFAULT_AI_ANALYSIS_CONFIG,
): FullSummaryOutput {
  // Group sessions by week
  const weeklyGroups = groupSessionsByWeek(sessions);

  // Generate week summaries
  const weekSummaries: WeekSummary[] = [];
  weeklyGroups.forEach((group, index) => {
    const summary = summarizeWeek(group, index + 1, config);
    if (summary) weekSummaries.push(summary);
  });

  // Generate mesocycle summary if we have multiple weeks
  const mesocycleSummary =
    weekSummaries.length >= 2
      ? summarizeMesocycle(weekSummaries, phase)
      : null;

  // Analyze trends
  const trendAnalyses = analyzeTrends(sessions, config);

  // Generate overall summary
  const overallParts: string[] = [];

  if (weekSummaries.length === 1) {
    overallParts.push(`Single week of training analyzed (${weekSummaries[0].sessions_completed} sessions).`);
  } else if (weekSummaries.length > 1) {
    overallParts.push(`${weekSummaries.length} weeks of training analyzed.`);
    if (mesocycleSummary) {
      overallParts.push(`Fatigue trajectory: ${mesocycleSummary.fatigue_trajectory}.`);
      overallParts.push(`Adaptation trend: ${mesocycleSummary.adaptation_trend}.`);
    }
  }

  if (trendAnalyses.length > 0) {
    const notableTrends = trendAnalyses.filter((t) => t.direction !== "stable" && t.direction !== "unknown");
    if (notableTrends.length > 0) {
      overallParts.push(`Notable trends: ${notableTrends.map((t) => t.metric).join(", ")}.`);
    }
  }

  const overallSummary = overallParts.join(" ");

  return {
    week_summaries: weekSummaries,
    mesocycle_summary: mesocycleSummary,
    trend_analyses: trendAnalyses,
    overall_summary: overallSummary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS FOR TESTING
// ─────────────────────────────────────────────────────────────────────────────

export {
  groupSessionsByWeek,
  getWeekNumber,
  determineTrendDirection,
  findInflectionPoints,
};