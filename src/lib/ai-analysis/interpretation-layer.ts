/**
 * AI ANALYSIS LAYER — INTERPRETATION LAYER
 * 
 * Responsibility:
 *   - Interpret athlete state based on existing data
 *   - Interpret fatigue trends (CNS, muscular, technical)
 *   - Describe readiness state
 * 
 * Constraints:
 *   - READ-ONLY: Does not modify any system state
 *   - DESCRIPTIVE: Outputs are interpretations, not decisions
 *   - PURE: No side effects, deterministic given same inputs
 * 
 * This layer consumes data from the existing state engine and session history
 * to produce human-readable interpretations of the athlete's current state.
 */

import type {
  ConfidenceLevel,
  TrendDirection,
  ReadinessInterpretation,
  FatigueInterpretation,
  AthleteStateInterpretation,
  AnalysisSessionData,
  AIAnalysisContext,
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
  // Support both 0-10 and 0-100 scales
  return r <= 10 ? r * 10 : clamp(r, 0, 100);
}

function confidenceFromSampleSize(n: number, config: AIAnalysisConfig): ConfidenceLevel {
  if (n >= config.min_sessions + 3) return "high";
  if (n >= config.min_sessions + 1) return "moderate";
  return "low";
}

function trendFromDelta(delta: number, threshold: number): TrendDirection {
  if (delta > threshold) return "increasing";
  if (delta < -threshold) return "decreasing";
  return "stable";
}

// ─────────────────────────────────────────────────────────────────────────────
// READINESS INTERPRETATION
// ─────────────────────────────────────────────────────────────────────────────

function categorizeReadiness(score: number): ReadinessInterpretation["readiness_state"] {
  if (score >= 85) return "optimal";
  if (score >= 70) return "good";
  if (score >= 55) return "adequate";
  if (score >= 40) return "compromised";
  return "poor";
}

function interpretReadiness(
  context: AIAnalysisContext,
  config: AIAnalysisConfig,
): ReadinessInterpretation {
  const readiness = normalizeReadiness(context.current_readiness);
  const state = categorizeReadiness(readiness);
  const confidence = confidenceFromSampleSize(context.sessions.length, config);

  const contributing_factors: string[] = [];
  const observations: string[] = [];

  // Analyze fatigue impact on readiness
  const fatigue = clamp(context.current_fatigue, 0, 100);
  if (fatigue >= 70) {
    contributing_factors.push("elevated fatigue");
    observations.push(`Current fatigue (${fatigue.toFixed(0)}) is elevated.`);
  } else if (fatigue <= 30) {
    contributing_factors.push("low fatigue");
    observations.push(`Current fatigue (${fatigue.toFixed(0)}) is low.`);
  }

  // Analyze readiness trend from session history
  if (context.sessions.length >= 2) {
    const readinessHistory = context.sessions.map((s) => normalizeReadiness(s.readiness));
    const firstHalf = readinessHistory.slice(0, Math.floor(readinessHistory.length / 2));
    const secondHalf = readinessHistory.slice(Math.floor(readinessHistory.length / 2));
    const delta = mean(secondHalf) - mean(firstHalf);

    if (delta > 5) {
      contributing_factors.push("improving readiness trend");
      observations.push(`Readiness has improved by ${delta.toFixed(1)} points over recent sessions.`);
    } else if (delta < -5) {
      contributing_factors.push("declining readiness trend");
      observations.push(`Readiness has declined by ${Math.abs(delta).toFixed(1)} points over recent sessions.`);
    }

    // Analyze readiness variability
    const variability = stdDev(readinessHistory);
    if (variability > 15) {
      contributing_factors.push("high readiness variability");
      observations.push(`Readiness has been inconsistent (±${variability.toFixed(1)}).`);
    }
  }

  // Competition proximity effect
  if (context.competition_in_days !== undefined && context.competition_in_days <= 14) {
    contributing_factors.push("competition proximity");
    observations.push(`Competition in ${context.competition_in_days} days may affect readiness.`);
  }

  // Success rate analysis
  if (context.sessions.length >= 1) {
    const recentSuccessRates = context.sessions.slice(-3).map((s) => s.success_rate);
    const avgSuccess = mean(recentSuccessRates);
    if (avgSuccess < 70) {
      contributing_factors.push("low recent success rate");
      observations.push(`Recent success rate averages ${avgSuccess.toFixed(0)}%.`);
    } else if (avgSuccess > 90) {
      contributing_factors.push("high recent success rate");
      observations.push(`Recent success rate averages ${avgSuccess.toFixed(0)}%.`);
    }
  }

  // Generate explanation
  let explanation = `Readiness is ${state}.`;
  if (contributing_factors.length > 0) {
    explanation += ` Key factors: ${contributing_factors.join(", ")}.`;
  }
  if (readiness >= 80) {
    explanation += " Athlete appears well-prepared for training demands.";
  } else if (readiness <= 40) {
    explanation += " Athlete may benefit from reduced training demands.";
  }

  return {
    readiness_score: readiness,
    readiness_state: state,
    contributing_factors,
    confidence,
    explanation,
    observations,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FATIGUE INTERPRETATION
// ─────────────────────────────────────────────────────────────────────────────

function categorizeFatigue(score: number): FatigueInterpretation["fatigue_state"] {
  if (score <= 25) return "fresh";
  if (score <= 45) return "mild";
  if (score <= 65) return "moderate";
  if (score <= 80) return "elevated";
  return "severe";
}

function determineAccumulationPattern(
  sessions: readonly AnalysisSessionData[],
  currentFatigue: number,
): FatigueInterpretation["accumulation_pattern"] {
  if (sessions.length < 2) return "stable";

  const fatigueHistory = sessions.map((s) => s.fatigue);
  const recent = fatigueHistory[fatigueHistory.length - 1];
  const baseline = mean(fatigueHistory.slice(0, -1));
  const delta = currentFatigue - baseline;

  // Check for acute spike
  if (currentFatigue >= 75 && delta >= 15) {
    return "acute_spike";
  }

  // Check for gradual buildup
  const trend = fatigueHistory.length >= 3
    ? fatigueHistory[fatigueHistory.length - 1] - fatigueHistory[0]
    : 0;
  if (trend >= 15) {
    return "gradual_buildup";
  }

  // Check for chronic fatigue
  const avgFatigue = mean(fatigueHistory);
  if (avgFatigue >= 65 && sessions.length >= 5) {
    return "chronic";
  }

  // Check for recovery
  if (delta <= -10) {
    return "recovering";
  }

  return "stable";
}

function estimateDomainFatigue(
  sessions: readonly AnalysisSessionData[],
  currentFatigue: number,
): { cns: number; muscular: number; technical: number } {
  // Estimate domain-specific fatigue based on available data
  // These are heuristic estimates, not precise measurements

  let cnsFatigue = currentFatigue;
  let muscularFatigue = currentFatigue;
  let technicalFatigue = currentFatigue;

  if (sessions.length >= 2) {
    // CNS fatigue estimation
    const cnsLoads = sessions.filter((s) => s.cns_load !== undefined).map((s) => s.cns_load!);
    if (cnsLoads.length > 0) {
      cnsFatigue = mean(cnsLoads);
    } else {
      // Use intensity as proxy for CNS load
      const intensities = sessions.filter((s) => s.intensity_avg !== undefined).map((s) => s.intensity_avg!);
      if (intensities.length > 0) {
        cnsFatigue = mean(intensities);
      }
    }

    // Muscular fatigue estimation
    const localLoads = sessions.filter((s) => s.local_load !== undefined).map((s) => s.local_load!);
    if (localLoads.length > 0) {
      muscularFatigue = mean(localLoads);
    }

    // Technical fatigue estimation
    const techLoads = sessions.filter((s) => s.technical_load !== undefined).map((s) => s.technical_load!);
    if (techLoads.length > 0) {
      technicalFatigue = mean(techLoads);
    } else {
      // Use RPE and success rate as proxy for technical fatigue
      const rpes = sessions.map((s) => s.average_RPE);
      const successRates = sessions.map((s) => s.success_rate);
      // Higher RPE and lower success = more technical fatigue
      const avgRPE = mean(rpes);
      const avgSuccess = mean(successRates);
      technicalFatigue = clamp(avgRPE * 8 + (100 - avgSuccess), 0, 100);
    }
  }

  return {
    cns: clamp(cnsFatigue, 0, 100),
    muscular: clamp(muscularFatigue, 0, 100),
    technical: clamp(technicalFatigue, 0, 100),
  };
}

function interpretFatigue(
  context: AIAnalysisContext,
  config: AIAnalysisConfig,
): FatigueInterpretation {
  const fatigue = clamp(context.current_fatigue, 0, 100);
  const state = categorizeFatigue(fatigue);
  const pattern = determineAccumulationPattern(context.sessions, fatigue);
  const confidence = confidenceFromSampleSize(context.sessions.length, config);
  const domainFatigue = estimateDomainFatigue(context.sessions, fatigue);

  const domainObservations = {
    cns: [] as string[],
    muscular: [] as string[],
    technical: [] as string[],
  };

  // CNS observations
  if (domainFatigue.cns >= 70) {
    domainObservations.cns.push(`CNS load is elevated (${domainFatigue.cns.toFixed(0)}).`);
  } else if (domainFatigue.cns <= 40) {
    domainObservations.cns.push(`CNS load is manageable (${domainFatigue.cns.toFixed(0)}).`);
  }

  // Muscular observations
  if (domainFatigue.muscular >= 70) {
    domainObservations.muscular.push(`Muscular fatigue is elevated (${domainFatigue.muscular.toFixed(0)}).`);
  }

  // Technical observations
  if (domainFatigue.technical >= 65) {
    domainObservations.technical.push(`Technical fatigue may affect movement quality (${domainFatigue.technical.toFixed(0)}).`);
  }

  // Generate explanation
  let explanation = `Overall fatigue is ${state}.`;
  if (pattern === "acute_spike") {
    explanation += " Recent session shows an acute fatigue spike.";
  } else if (pattern === "gradual_buildup") {
    explanation += " Fatigue has been gradually accumulating across sessions.";
  } else if (pattern === "chronic") {
    explanation += " Chronic elevation in fatigue markers observed.";
  } else if (pattern === "recovering") {
    explanation += " Fatigue markers show signs of recovery.";
  }

  return {
    cns_fatigue: domainFatigue.cns,
    muscular_fatigue: domainFatigue.muscular,
    technical_fatigue: domainFatigue.technical,
    fatigue_state: state,
    accumulation_pattern: pattern,
    confidence,
    explanation,
    domain_observations: domainObservations,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED STATE INTERPRETATION
// ─────────────────────────────────────────────────────────────────────────────

function determineOverallState(
  readiness: ReadinessInterpretation,
  fatigue: FatigueInterpretation,
): AthleteStateInterpretation["overall_state"] {
  const rScore = readiness.readiness_score;
  const fState = fatigue.fatigue_state;

  if (rScore >= 80 && (fState === "fresh" || fState === "mild")) {
    return "peak";
  }
  if (rScore >= 65 && (fState === "fresh" || fState === "mild" || fState === "moderate")) {
    return "ready";
  }
  if (rScore >= 50 && fState !== "severe") {
    return "maintaining";
  }
  if (fState === "severe" || rScore < 40) {
    return "overreached";
  }
  return "fatigued";
}

function generateStateSummary(
  readiness: ReadinessInterpretation,
  fatigue: FatigueInterpretation,
  overallState: AthleteStateInterpretation["overall_state"],
): string {
  const parts: string[] = [];

  parts.push(`Athlete is in a(n) ${overallState} state.`);
  parts.push(`Readiness: ${readiness.readiness_state} (${readiness.readiness_score.toFixed(0)}/100).`);
  parts.push(`Fatigue: ${fatigue.fatigue_state} (${fatigue.accumulation_pattern}).`);

  if (overallState === "peak" || overallState === "ready") {
    parts.push("Conditions favor normal to elevated training demands.");
  } else if (overallState === "overreached") {
    parts.push("Recovery should be prioritized.");
  } else {
    parts.push("Training demands should be moderated based on session goals.");
  }

  return parts.join(" ");
}

/**
 * Main interpretation function.
 * Produces a comprehensive athlete state interpretation from available data.
 * 
 * Pure function - no side effects, no state modification.
 */
export function interpretAthleteState(
  context: AIAnalysisContext,
  config: AIAnalysisConfig = DEFAULT_AI_ANALYSIS_CONFIG,
): AthleteStateInterpretation {
  const readiness = interpretReadiness(context, config);
  const fatigue = interpretFatigue(context, config);
  const overallState = determineOverallState(readiness, fatigue);
  const summary = generateStateSummary(readiness, fatigue, overallState);

  return {
    readiness,
    fatigue,
    overall_state: overallState,
    summary,
    analyzed_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS FOR TESTING
// ─────────────────────────────────────────────────────────────────────────────

export {
  categorizeReadiness,
  categorizeFatigue,
  determineAccumulationPattern,
  estimateDomainFatigue,
  determineOverallState,
};