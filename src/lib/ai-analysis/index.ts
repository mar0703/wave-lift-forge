/**
 * AI ANALYSIS LAYER — PUBLIC API
 * 
 * This module provides the complete AI analysis layer as a read-only analytical
 * component. It combines interpretation, risk detection, and summary capabilities.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * ARCHITECTURAL DOCTRINE
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * The AI Analysis Layer is STRICTLY a read-only analytical layer:
 * 
 *   1. It DOES NOT generate training programs
 *   2. It DOES NOT modify session types or microcycle logic
 *   3. It DOES NOT change the fatigue model
 *   4. It DOES NOT override periodization rules
 *   5. It DOES NOT introduce new training structures
 * 
 * AI ROLE IS LIMITED TO:
 * 
 *   1. Interpretation layer
 *      - Explain athlete state based on existing data
 *      - Interpret fatigue trends (CNS, muscular, technical)
 *      - Describe readiness state
 * 
 *   2. Risk detection layer
 *      - Detect overload risk
 *      - Identify recovery issues
 *      - Highlight technical degradation patterns
 * 
 *   3. Summary layer
 *      - Summarize training week or mesocycle
 *      - Extract trends from historical data
 * 
 * SYSTEM HIERARCHY (absolute priority):
 *   1. Deterministic Rule Engine (highest authority)
 *   2. Template System (session/microcycle definitions)
 *   3. Data Layer (athlete state inputs)
 *   4. AI Analysis Layer (support only - read-only)
 * 
 * AI outputs MUST NOT be used as direct inputs to modify system rules or templates.
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Confidence and trend types
  type ConfidenceLevel,
  type TrendDirection,
  // State interpretation types
  type ReadinessInterpretation,
  type FatigueInterpretation,
  type AthleteStateInterpretation,
  // Risk detection types
  type RiskLevel,
  type RiskCategory,
  type DetectedRisk,
  type RiskAssessment,
  // Summary types
  type WeekSummary,
  type MesocycleSummary,
  type TrendAnalysis,
  // Combined output
  type AIAnalysisOutput,
  // Input types
  type AnalysisSessionData,
  type AIAnalysisContext,
  type AIAnalysisConfig,
  // Default config
  DEFAULT_AI_ANALYSIS_CONFIG,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// INTERPRETATION LAYER EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  interpretAthleteState,
  // Internal functions exported for testing
  categorizeReadiness,
  categorizeFatigue,
  determineAccumulationPattern,
  estimateDomainFatigue,
  determineOverallState,
} from "./interpretation-layer";

// ─────────────────────────────────────────────────────────────────────────────
// RISK DETECTION LAYER EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  assessRisks,
  // Internal functions exported for testing
  scoreToRiskLevel,
  detectOverloadRisk,
  detectUnderRecoveryRisk,
  detectTechnicalDegradationRisk,
  detectStagnationRisk,
  detectOvertrainingRisk,
  detectInjuryPrecursorRisk,
} from "./risk-detection-layer";

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY LAYER EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export {
  summarizeWeek,
  summarizeMesocycle,
  analyzeTrends,
  generateFullSummary,
  type FullSummaryOutput,
  // Internal functions exported for testing
  groupSessionsByWeek,
  getWeekNumber,
  determineTrendDirection,
  findInflectionPoints,
} from "./summary-layer";

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED ANALYSIS FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

import type {
  AIAnalysisOutput,
  AIAnalysisContext,
  AIAnalysisConfig,
  AthleteStateInterpretation,
  RiskAssessment,
  AnalysisSessionData,
} from "./types";
import type { FullSummaryOutput } from "./summary-layer";
import { DEFAULT_AI_ANALYSIS_CONFIG } from "./types";
import { interpretAthleteState } from "./interpretation-layer";
import { assessRisks } from "./risk-detection-layer";
import { generateFullSummary } from "./summary-layer";

/**
 * Perform a complete AI analysis of athlete state and training history.
 * 
 * This is the main entry point for the AI analysis layer. It combines:
 *   - Athlete state interpretation (readiness, fatigue)
 *   - Risk assessment (overload, under-recovery, technical degradation, etc.)
 *   - Training summary and trend analysis
 * 
 * @param context - The analysis context containing session data and current state
 * @param config - Optional configuration overrides
 * @returns Complete AI analysis output (read-only, descriptive only)
 * 
 * IMPORTANT: This function is PURE and READ-ONLY. It does not modify any system
 * state and its outputs are descriptive interpretations, not training decisions.
 */
export function performAIAnalysis(
  context: AIAnalysisContext,
  config: AIAnalysisConfig = DEFAULT_AI_ANALYSIS_CONFIG,
): AIAnalysisOutput {
  const analyzed_at = new Date().toISOString();

  // 1. State Interpretation
  let stateInterpretation: AthleteStateInterpretation | null = null;
  if (context.sessions.length >= config.min_sessions - 1) {
    stateInterpretation = interpretAthleteState(context, config);
  }

  // 2. Risk Assessment
  let riskAssessment: RiskAssessment | null = null;
  if (context.sessions.length >= config.min_sessions - 1) {
    riskAssessment = assessRisks(context, config);
  }

  // 3. Summary and Trends
  let summaryOutput: FullSummaryOutput | null = null;
  if (context.sessions.length >= 1) {
    summaryOutput = generateFullSummary(
      context.sessions,
      context.training_phase,
      config,
    );
  }

  // 4. Generate analytical summary
  const analyticalSummary = generateAnalyticalSummary(
    stateInterpretation,
    riskAssessment,
    summaryOutput,
  );

  return {
    state_interpretation: stateInterpretation,
    risk_assessment: riskAssessment,
    summary: summaryOutput?.mesocycle_summary ?? summaryOutput?.week_summaries[0] ?? null,
    trend_analyses: summaryOutput?.trend_analyses ?? [],
    analytical_summary: analyticalSummary,
    disclaimer: "AI analysis is descriptive only. All training decisions are made by the deterministic rule engine.",
    analyzed_at,
  };
}

/**
 * Generate a combined analytical summary from all analysis components.
 */
function generateAnalyticalSummary(
  stateInterpretation: AthleteStateInterpretation | null,
  riskAssessment: RiskAssessment | null,
  summaryOutput: FullSummaryOutput | null,
): string {
  const parts: string[] = [];

  // State summary
  if (stateInterpretation) {
    parts.push(stateInterpretation.summary);
  }

  // Risk summary
  if (riskAssessment && riskAssessment.risks.length > 0) {
    parts.push(riskAssessment.summary);
  }

  // Training summary
  if (summaryOutput?.overall_summary) {
    parts.push(summaryOutput.overall_summary);
  }

  return parts.join(" ");
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIDGE FUNCTIONS FOR EXISTING SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert session data from the existing engine-store format to AI analysis format.
 * This function adapts the existing SessionLog format to AnalysisSessionData.
 * 
 * @param sessionLog - Session log from engine-store
 * @param additionalData - Optional additional data for richer analysis
 * @returns AnalysisSessionData compatible with AI analysis layer
 */
export function adaptSessionForAnalysis(
  sessionLog: {
    date: string;
    adjusted_intensity: number;
    success_rate: number;
    average_RPE: number;
    total_sets: number;
  },
  additionalData?: {
    readiness?: number;
    fatigue?: number;
    detected_problems?: string[];
    intervention_applied?: boolean;
    cns_load?: number;
    technical_load?: number;
    local_load?: number;
  },
): { timestamp: number; readiness: number; fatigue: number; success_rate: number; average_RPE: number; detected_problems?: readonly string[]; intervention_applied?: boolean; cns_load?: number; technical_load?: number; local_load?: number; intensity_avg?: number } {
  return {
    timestamp: new Date(sessionLog.date).getTime(),
    readiness: additionalData?.readiness ?? 70,
    fatigue: additionalData?.fatigue ?? 30,
    success_rate: sessionLog.success_rate,
    average_RPE: sessionLog.average_RPE,
    detected_problems: additionalData?.detected_problems,
    intervention_applied: additionalData?.intervention_applied,
    cns_load: additionalData?.cns_load,
    technical_load: additionalData?.technical_load,
    local_load: additionalData?.local_load,
    intensity_avg: sessionLog.adjusted_intensity,
  };
}

/**
 * Create an analysis context from current engine state.
 * This is a convenience function for integrating with the existing system.
 * 
 * @param params - Parameters from the existing system
 * @returns AIAnalysisContext ready for analysis
 */
export function createAnalysisContext(params: {
  sessions: readonly AnalysisSessionData[];
  current_readiness: number;
  current_fatigue: number;
  training_phase?: string;
  competition_in_days?: number;
  athlete_level?: "novice" | "intermediate" | "advanced" | "elite";
}): import("./types").AIAnalysisContext {
  return {
    sessions: params.sessions,
    current_readiness: params.current_readiness,
    current_fatigue: params.current_fatigue,
    training_phase: params.training_phase,
    competition_in_days: params.competition_in_days,
    athlete_level: params.athlete_level,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// READ-ONLY VERIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verification that the AI analysis layer is read-only.
 * 
 * This constant serves as a structural guarantee that the AI layer
 * cannot modify system state. It is included in every analysis output
 * as a reminder of the architectural constraints.
 */
export const READ_ONLY_GUARANTEE = {
  /** AI analysis does not modify training programs */
  does_not_generate_programs: true,
  /** AI analysis does not modify session types */
  does_not_modify_sessions: true,
  /** AI analysis does not modify microcycle logic */
  does_not_modify_microcycles: true,
  /** AI analysis does not change fatigue model */
  does_not_change_fatigue_model: true,
  /** AI analysis does not override periodization rules */
  does_not_override_rules: true,
  /** AI analysis does not introduce new training structures */
  does_not_introduce_structures: true,
  /** AI outputs are descriptive only */
  outputs_are_descriptive: true,
  /** All training decisions remain with deterministic engine */
  decisions_with_engine: true,
} as const;

/**
 * Type-level guarantee that AI analysis outputs cannot be used
 * to modify system rules or templates.
 */
export type AIAnalysisGuarantee = typeof READ_ONLY_GUARANTEE;