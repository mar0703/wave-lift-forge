/**
 * AI ANALYSIS LAYER — RISK DETECTION LAYER
 * 
 * Responsibility:
 *   - Detect overload risk
 *   - Identify recovery issues
 *   - Highlight technical degradation patterns
 * 
 * Constraints:
 *   - READ-ONLY: Does not modify any system state
 *   - DESCRIPTIVE: Outputs are risk assessments, not decisions
 *   - PURE: No side effects, deterministic given same inputs
 *   - NON-PRESCRIPTIVE: Indicators are observations, not recommendations
 * 
 * This layer analyzes session history and current state to identify potential
 * risks. It does NOT make training decisions — those remain with the
 * deterministic rule engine.
 */

import type {
  ConfidenceLevel,
  TrendDirection,
  DetectedRisk,
  RiskAssessment,
  RiskLevel,
  RiskCategory,
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
  return r <= 10 ? r * 10 : clamp(r, 0, 100);
}

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 50) return "moderate";
  if (score >= 25) return "low";
  return "negligible";
}

function confidenceFromSampleSize(n: number, config: AIAnalysisConfig): ConfidenceLevel {
  if (n >= config.min_sessions + 3) return "high";
  if (n >= config.min_sessions + 1) return "moderate";
  return "low";
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERLOAD RISK DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function detectOverloadRisk(
  context: AIAnalysisContext,
  config: AIAnalysisConfig,
): DetectedRisk | null {
  const threshold = config.risk_thresholds.overload;
  let score = 0;
  const evidence: string[] = [];
  const indicators: string[] = [];

  // Factor 1: Current fatigue level
  const fatigue = clamp(context.current_fatigue, 0, 100);
  if (fatigue >= threshold) {
    score += 30;
    evidence.push(`Current fatigue (${fatigue.toFixed(0)}) exceeds overload threshold (${threshold}).`);
  } else if (fatigue >= threshold - 15) {
    score += 15;
    indicators.push(`Fatigue approaching overload threshold (${fatigue.toFixed(0)}/${threshold}).`);
  }

  // Factor 2: Fatigue trend
  if (context.sessions.length >= 3) {
    const fatigueHistory = context.sessions.map((s) => s.fatigue);
    const trend = fatigueHistory[fatigueHistory.length - 1] - fatigueHistory[0];
    if (trend >= 20) {
      score += 25;
      evidence.push(`Fatigue has increased by ${trend.toFixed(0)} points across recent sessions.`);
    } else if (trend >= 10) {
      score += 12;
      indicators.push(`Upward fatigue trend detected (+${trend.toFixed(0)}).`);
    }
  }

  // Factor 3: Sustained high intensity
  if (context.sessions.length >= 2) {
    const intensities = context.sessions.filter((s) => s.intensity_avg !== undefined).map((s) => s.intensity_avg!);
    if (intensities.length >= 2) {
      const highIntensityCount = intensities.filter((i) => i >= 85).length;
      if (highIntensityCount >= intensities.length * 0.7) {
        score += 20;
        evidence.push(`${highIntensityCount} of ${intensities.length} recent sessions at high intensity (≥85%).`);
      }
    }
  }

  // Factor 4: CNS load accumulation
  const cnsLoads = context.sessions.filter((s) => s.cns_load !== undefined).map((s) => s.cns_load!);
  if (cnsLoads.length >= 3) {
    const avgCNS = mean(cnsLoads);
    const consecutiveHigh = cnsLoads.filter((c) => c >= 70).length;
    if (avgCNS >= 70) {
      score += 15;
      evidence.push(`Average CNS load is elevated (${avgCNS.toFixed(0)}).`);
    }
    if (consecutiveHigh >= 3) {
      score += 10;
      indicators.push(`${consecutiveHigh} consecutive sessions with high CNS load.`);
    }
  }

  // Factor 5: Low readiness with high fatigue
  const readiness = normalizeReadiness(context.current_readiness);
  if (readiness < 50 && fatigue > 60) {
    score += 10;
    evidence.push(`Low readiness (${readiness.toFixed(0)}) combined with elevated fatigue (${fatigue.toFixed(0)}).`);
  }

  score = clamp(score, 0, 100);
  const riskLevel = scoreToRiskLevel(score);
  const confidence = confidenceFromSampleSize(context.sessions.length, config);

  if (score < 20) return null; // Below meaningful threshold

  const description = `Overload risk is ${riskLevel} (${score}/100). ${evidence.length > 0 ? evidence[0] : ""}`;

  return {
    category: "overload",
    risk_score: score,
    risk_level: riskLevel,
    evidence,
    confidence,
    description,
    indicators,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UNDER-RECOVERY RISK DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function detectUnderRecoveryRisk(
  context: AIAnalysisContext,
  config: AIAnalysisConfig,
): DetectedRisk | null {
  const threshold = config.risk_thresholds.under_recovery;
  let score = 0;
  const evidence: string[] = [];
  const indicators: string[] = [];

  // Factor 1: Recovery-to-stress ratio
  const fatigue = clamp(context.current_fatigue, 0, 100);
  const readiness = normalizeReadiness(context.current_readiness);
  const recoveryStressRatio = readiness / Math.max(fatigue, 1);
  if (recoveryStressRatio < 0.5) {
    score += 30;
    evidence.push(`Recovery-to-stress ratio is low (${recoveryStressRatio.toFixed(2)}).`);
  } else if (recoveryStressRatio < 0.75) {
    score += 15;
    indicators.push(`Recovery-to-stress ratio below optimal (${recoveryStressRatio.toFixed(2)}).`);
  }

  // Factor 2: Session frequency without recovery
  if (context.sessions.length >= 3) {
    const highLoadSessions = context.sessions.filter((s) => {
      const cns = s.cns_load ?? 0;
      const intensity = s.intensity_avg ?? 0;
      return cns >= 70 || intensity >= 85;
    }).length;
    const highLoadRatio = highLoadSessions / context.sessions.length;
    if (highLoadRatio >= 0.8) {
      score += 25;
      evidence.push(`${Math.round(highLoadRatio * 100)}% of recent sessions were high-load.`);
    }
  }

  // Factor 3: RPE trend (increasing effort for same/less output)
  if (context.sessions.length >= 3) {
    const rpeHistory = context.sessions.map((s) => s.average_RPE);
    const successHistory = context.sessions.map((s) => s.success_rate);
    const rpeTrend = rpeHistory[rpeHistory.length - 1] - rpeHistory[0];
    const successTrend = successHistory[successHistory.length - 1] - successHistory[0];

    if (rpeTrend >= 1.5 && successTrend <= -5) {
      score += 20;
      evidence.push(`RPE increasing (+${rpeTrend.toFixed(1)}) while success rate declining (${successTrend.toFixed(1)}pp).`);
    } else if (rpeTrend >= 1) {
      score += 10;
      indicators.push(`RPE trending upward (+${rpeTrend.toFixed(1)}).`);
    }
  }

  // Factor 4: Readiness decline
  if (context.sessions.length >= 3) {
    const readinessHistory = context.sessions.map((s) => normalizeReadiness(s.readiness));
    const readinessTrend = readinessHistory[readinessHistory.length - 1] - readinessHistory[0];
    if (readinessTrend <= -15) {
      score += 15;
      evidence.push(`Readiness has declined by ${Math.abs(readinessTrend).toFixed(0)} points.`);
    }
  }

  // Factor 5: Competition proximity stress
  if (context.competition_in_days !== undefined && context.competition_in_days <= 21) {
    if (fatigue > 50) {
      score += 10;
      indicators.push(`Competition in ${context.competition_in_days} days with elevated fatigue.`);
    }
  }

  score = clamp(score, 0, 100);
  const riskLevel = scoreToRiskLevel(score);
  const confidence = confidenceFromSampleSize(context.sessions.length, config);

  if (score < 20) return null;

  const description = `Under-recovery risk is ${riskLevel} (${score}/100). ${evidence.length > 0 ? evidence[0] : ""}`;

  return {
    category: "under_recovery",
    risk_score: score,
    risk_level: riskLevel,
    evidence,
    confidence,
    description,
    indicators,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TECHNICAL DEGRADATION RISK DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function detectTechnicalDegradationRisk(
  context: AIAnalysisContext,
  config: AIAnalysisConfig,
): DetectedRisk | null {
  const threshold = config.risk_thresholds.technical_degradation;
  let score = 0;
  const evidence: string[] = [];
  const indicators: string[] = [];

  // Factor 1: Success rate decline
  if (context.sessions.length >= 2) {
    const successHistory = context.sessions.map((s) => s.success_rate);
    const successTrend = successHistory[successHistory.length - 1] - successHistory[0];
    const currentSuccess = successHistory[successHistory.length - 1];

    if (currentSuccess < 70) {
      score += 25;
      evidence.push(`Current success rate is low (${currentSuccess.toFixed(0)}%).`);
    }
    if (successTrend <= -10) {
      score += 20;
      evidence.push(`Success rate has declined by ${Math.abs(successTrend).toFixed(0)} percentage points.`);
    } else if (successTrend <= -5) {
      score += 10;
      indicators.push(`Success rate trending downward (${successTrend.toFixed(1)}pp).`);
    }
  }

  // Factor 2: RPE increase (effort compensation)
  if (context.sessions.length >= 2) {
    const rpeHistory = context.sessions.map((s) => s.average_RPE);
    const rpeTrend = rpeHistory[rpeHistory.length - 1] - rpeHistory[0];
    const currentRPE = rpeHistory[rpeHistory.length - 1];

    if (currentRPE >= 9) {
      score += 20;
      evidence.push(`Current session RPE is very high (${currentRPE.toFixed(1)}).`);
    }
    if (rpeTrend >= 1.5) {
      score += 15;
      evidence.push(`Session RPE has increased by ${rpeTrend.toFixed(1)} points.`);
    }
  }

  // Factor 3: Problem detection patterns
  const allProblems = new Set<string>();
  context.sessions.forEach((s) => {
    s.detected_problems?.forEach((p) => allProblems.add(p));
  });

  if (allProblems.size >= 3) {
    score += 15;
    evidence.push(`${allProblems.size} distinct technical problems detected across sessions.`);
  }

  // Check for recurring problems
  const problemCounts: Record<string, number> = {};
  context.sessions.forEach((s) => {
    s.detected_problems?.forEach((p) => {
      problemCounts[p] = (problemCounts[p] ?? 0) + 1;
    });
  });

  const recurringProblems = Object.entries(problemCounts).filter(([, count]) => count >= 2);
  if (recurringProblems.length > 0) {
    score += 10;
    indicators.push(`Recurring problems: ${recurringProblems.map(([p]) => p).join(", ")}.`);
  }

  // Factor 4: Technical load vs. performance
  if (context.sessions.length >= 2) {
    const techLoads = context.sessions.filter((s) => s.technical_load !== undefined).map((s) => s.technical_load!);
    if (techLoads.length >= 2) {
      const avgTechLoad = mean(techLoads);
      if (avgTechLoad >= 70) {
        score += 10;
        indicators.push(`Average technical load is elevated (${avgTechLoad.toFixed(0)}).`);
      }
    }
  }

  // Factor 5: Intervention frequency
  const interventionCount = context.sessions.filter((s) => s.intervention_applied).length;
  if (context.sessions.length > 0) {
    const interventionRate = interventionCount / context.sessions.length;
    if (interventionRate >= 0.5) {
      score += 10;
      indicators.push(`${Math.round(interventionRate * 100)}% of recent sessions required intervention.`);
    }
  }

  score = clamp(score, 0, 100);
  const riskLevel = scoreToRiskLevel(score);
  const confidence = confidenceFromSampleSize(context.sessions.length, config);

  if (score < 15) return null;

  const description = `Technical degradation risk is ${riskLevel} (${score}/100). ${evidence.length > 0 ? evidence[0] : ""}`;

  return {
    category: "technical_degradation",
    risk_score: score,
    risk_level: riskLevel,
    evidence,
    confidence,
    description,
    indicators,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGNATION RISK DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function detectStagnationRisk(
  context: AIAnalysisContext,
  config: AIAnalysisConfig,
): DetectedRisk | null {
  let score = 0;
  const evidence: string[] = [];
  const indicators: string[] = [];

  // Factor 1: Performance plateau
  if (context.sessions.length >= 5) {
    const successHistory = context.sessions.map((s) => s.success_rate);
    const variability = stdDev(successHistory);
    const trend = successHistory[successHistory.length - 1] - successHistory[0];

    if (variability < 5 && Math.abs(trend) < 3) {
      score += 25;
      evidence.push(`Performance has been stable with minimal variation (σ=${variability.toFixed(1)}).`);
    }
  }

  // Factor 2: Consistent moderate fatigue
  if (context.sessions.length >= 4) {
    const fatigueHistory = context.sessions.map((s) => s.fatigue);
    const fatigueVariability = stdDev(fatigueHistory);
    const avgFatigue = mean(fatigueHistory);

    if (fatigueVariability < 10 && avgFatigue >= 50 && avgFatigue <= 70) {
      score += 15;
      indicators.push(`Consistent moderate fatigue without clear progression or recovery.`);
    }
  }

  // Factor 3: Lack of peak performances
  if (context.sessions.length >= 4) {
    const bestSuccess = Math.max(...context.sessions.map((s) => s.success_rate));
    if (bestSuccess < 90) {
      score += 10;
      indicators.push(`No high-quality sessions (≥90% success) in recent history.`);
    }
  }

  score = clamp(score, 0, 100);
  const riskLevel = scoreToRiskLevel(score);
  const confidence = confidenceFromSampleSize(context.sessions.length, config);

  if (score < 20) return null;

  const description = `Stagnation risk is ${riskLevel} (${score}/100). ${evidence.length > 0 ? evidence[0] : ""}`;

  return {
    category: "stagnation",
    risk_score: score,
    risk_level: riskLevel,
    evidence,
    confidence,
    description,
    indicators,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OVERTRAINING RISK DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function detectOvertrainingRisk(
  context: AIAnalysisContext,
  config: AIAnalysisConfig,
): DetectedRisk | null {
  let score = 0;
  const evidence: string[] = [];
  const indicators: string[] = [];

  // Factor 1: Chronic elevated fatigue
  if (context.sessions.length >= 5) {
    const fatigueHistory = context.sessions.map((s) => s.fatigue);
    const highFatigueCount = fatigueHistory.filter((f) => f >= 70).length;
    const avgFatigue = mean(fatigueHistory);

    if (highFatigueCount >= fatigueHistory.length * 0.6 && avgFatigue >= 65) {
      score += 30;
      evidence.push(`Chronic elevated fatigue: ${highFatigueCount}/${fatigueHistory.length} sessions with fatigue ≥70.`);
    }
  }

  // Factor 2: Persistent low readiness
  if (context.sessions.length >= 5) {
    const readinessHistory = context.sessions.map((s) => normalizeReadiness(s.readiness));
    const lowReadinessCount = readinessHistory.filter((r) => r < 50).length;

    if (lowReadinessCount >= readinessHistory.length * 0.5) {
      score += 25;
      evidence.push(`Readiness below 50 in ${lowReadinessCount}/${readinessHistory.length} sessions.`);
    }
  }

  // Factor 3: Declining performance trajectory
  if (context.sessions.length >= 4) {
    const successHistory = context.sessions.map((s) => s.success_rate);
    let decliningCount = 0;
    for (let i = 1; i < successHistory.length; i++) {
      if (successHistory[i] < successHistory[i - 1] - 3) decliningCount++;
    }
    if (decliningCount >= successHistory.length * 0.5) {
      score += 20;
      evidence.push(`Performance declining in ${decliningCount}/${successHistory.length - 1} session transitions.`);
    }
  }

  // Factor 4: Current state severity
  const fatigue = clamp(context.current_fatigue, 0, 100);
  const readiness = normalizeReadiness(context.current_readiness);
  if (fatigue >= 80 && readiness < 40) {
    score += 15;
    evidence.push(`Current state: severe fatigue (${fatigue.toFixed(0)}) with low readiness (${readiness.toFixed(0)}).`);
  }

  score = clamp(score, 0, 100);
  const riskLevel = scoreToRiskLevel(score);
  const confidence = confidenceFromSampleSize(context.sessions.length, config);

  if (score < 30) return null; // Higher threshold for serious risk

  const description = `Overtraining risk is ${riskLevel} (${score}/100). ${evidence.length > 0 ? evidence[0] : ""}`;

  return {
    category: "overtraining",
    risk_score: score,
    risk_level: riskLevel,
    evidence,
    confidence,
    description,
    indicators,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// INJURY PRECURSOR RISK DETECTION
// ─────────────────────────────────────────────────────────────────────────────

function detectInjuryPrecursorRisk(
  context: AIAnalysisContext,
  config: AIAnalysisConfig,
): DetectedRisk | null {
  let score = 0;
  const evidence: string[] = [];
  const indicators: string[] = [];

  // Factor 1: Sudden performance drop
  if (context.sessions.length >= 2) {
    const successHistory = context.sessions.map((s) => s.success_rate);
    const lastSuccess = successHistory[successHistory.length - 1];
    const prevSuccess = successHistory[successHistory.length - 2];
    const drop = prevSuccess - lastSuccess;

    if (drop >= 20) {
      score += 25;
      evidence.push(`Sudden performance drop: ${drop.toFixed(0)}pp decrease in success rate.`);
    }
  }

  // Factor 2: Asymmetric fatigue patterns (proxy for compensation)
  if (context.sessions.length >= 3) {
    const rpeHistory = context.sessions.map((s) => s.average_RPE);
    const rpeSpike = rpeHistory[rpeHistory.length - 1] - mean(rpeHistory.slice(0, -1));
    if (rpeSpike >= 2) {
      score += 15;
      indicators.push(`RPE spike in most recent session (+${rpeSpike.toFixed(1)}).`);
    }
  }

  // Factor 3: High load with declining performance
  if (context.sessions.length >= 3) {
    const lastSession = context.sessions[context.sessions.length - 1];
    const cnsLoad = lastSession.cns_load ?? lastSession.intensity_avg ?? 0;
    const successRate = lastSession.success_rate;

    if (cnsLoad >= 75 && successRate < 70) {
      score += 20;
      evidence.push(`High load (CNS/intensity: ${cnsLoad.toFixed(0)}) with poor performance (success: ${successRate.toFixed(0)}%).`);
    }
  }

  // Factor 4: Repeated interventions for same issue
  if (context.sessions.length >= 3) {
    const interventionStreak = context.sessions.slice(-3).filter((s) => s.intervention_applied).length;
    if (interventionStreak >= 3) {
      score += 10;
      indicators.push(`Intervention applied in ${interventionStreak} consecutive sessions.`);
    }
  }

  score = clamp(score, 0, 100);
  const riskLevel = scoreToRiskLevel(score);
  const confidence = confidenceFromSampleSize(context.sessions.length, config);

  if (score < 20) return null;

  const description = `Injury precursor risk is ${riskLevel} (${score}/100). ${evidence.length > 0 ? evidence[0] : ""}`;

  return {
    category: "injury_precursor",
    risk_score: score,
    risk_level: riskLevel,
    evidence,
    confidence,
    description,
    indicators,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPREHENSIVE RISK ASSESSMENT
// ─────────────────────────────────────────────────────────────────────────────

function determineOverallRiskLevel(risks: readonly DetectedRisk[]): RiskLevel {
  if (risks.length === 0) return "negligible";
  const maxScore = Math.max(...risks.map((r) => r.risk_score));
  return scoreToRiskLevel(maxScore);
}

function determineRiskTrend(
  risks: readonly DetectedRisk[],
  context: AIAnalysisContext,
): TrendDirection {
  if (context.sessions.length < 3 || risks.length === 0) return "unknown";

  // Analyze fatigue and readiness trends as proxy for risk trend
  const fatigueHistory = context.sessions.map((s) => s.fatigue);
  const fatigueTrend = fatigueHistory[fatigueHistory.length - 1] - fatigueHistory[0];

  const readinessHistory = context.sessions.map((s) => normalizeReadiness(s.readiness));
  const readinessTrend = readinessHistory[readinessHistory.length - 1] - readinessHistory[0];

  const combinedTrend = fatigueTrend - readinessTrend; // Higher = worse

  if (combinedTrend > 15) return "increasing";
  if (combinedTrend < -15) return "decreasing";
  return "stable";
}

function generateRiskSummary(assessment: RiskAssessment): string {
  const parts: string[] = [];

  if (assessment.risks.length === 0) {
    return "No significant risks detected in the available data.";
  }

  parts.push(`Overall risk level: ${assessment.overall_risk_level}.`);

  if (assessment.primary_concern) {
    parts.push(`Primary concern: ${assessment.primary_concern.category} (${assessment.primary_concern.risk_level}).`);
  }

  const highRisks = assessment.risks.filter((r) => r.risk_level === "high" || r.risk_level === "critical");
  if (highRisks.length > 0) {
    parts.push(`${highRisks.length} high/critical risk(s) detected.`);
  }

  if (assessment.risk_trend === "increasing") {
    parts.push("Risk indicators are trending upward.");
  } else if (assessment.risk_trend === "decreasing") {
    parts.push("Risk indicators are trending downward.");
  }

  return parts.join(" ");
}

/**
 * Main risk assessment function.
 * Analyzes all risk categories and produces a comprehensive assessment.
 * 
 * Pure function - no side effects, no state modification.
 */
export function assessRisks(
  context: AIAnalysisContext,
  config: AIAnalysisConfig = DEFAULT_AI_ANALYSIS_CONFIG,
): RiskAssessment {
  const risks: DetectedRisk[] = [];

  // Run all risk detectors
  const overloadRisk = detectOverloadRisk(context, config);
  if (overloadRisk) risks.push(overloadRisk);

  const underRecoveryRisk = detectUnderRecoveryRisk(context, config);
  if (underRecoveryRisk) risks.push(underRecoveryRisk);

  const technicalRisk = detectTechnicalDegradationRisk(context, config);
  if (technicalRisk) risks.push(technicalRisk);

  const stagnationRisk = detectStagnationRisk(context, config);
  if (stagnationRisk) risks.push(stagnationRisk);

  const overtrainingRisk = detectOvertrainingRisk(context, config);
  if (overtrainingRisk) risks.push(overtrainingRisk);

  const injuryRisk = detectInjuryPrecursorRisk(context, config);
  if (injuryRisk) risks.push(injuryRisk);

  // Sort by risk score (highest first)
  risks.sort((a, b) => b.risk_score - a.risk_score);

  const overallRiskLevel = determineOverallRiskLevel(risks);
  const primaryConcern = risks.length > 0 ? risks[0] : null;
  const riskTrend = determineRiskTrend(risks, context);

  const summary = generateRiskSummary({
    risks,
    overall_risk_level: overallRiskLevel,
    primary_concern: primaryConcern,
    risk_trend: riskTrend,
    summary: "",
    analyzed_at: new Date().toISOString(),
  });

  return {
    risks,
    overall_risk_level: overallRiskLevel,
    primary_concern: primaryConcern,
    risk_trend: riskTrend,
    summary,
    analyzed_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS FOR TESTING
// ─────────────────────────────────────────────────────────────────────────────

export {
  scoreToRiskLevel,
  detectOverloadRisk,
  detectUnderRecoveryRisk,
  detectTechnicalDegradationRisk,
  detectStagnationRisk,
  detectOvertrainingRisk,
  detectInjuryPrecursorRisk,
};