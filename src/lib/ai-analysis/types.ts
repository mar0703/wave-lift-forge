/**
 * AI ANALYSIS LAYER — TYPES
 * 
 * Doctrine:
 *   - AI is a READ-ONLY analytical layer.
 *   - AI outputs are DESCRIPTIVE and INTERPRETIVE only.
 *   - AI MUST NOT modify system rules, templates, or state.
 *   - All final decisions are made by the deterministic rule engine.
 * 
 * Authority Hierarchy (AI is NOT in the hierarchy):
 *   1. Deterministic Rule Engine (highest authority)
 *   2. Template System (session/microcycle definitions)
 *   3. Data Layer (athlete state inputs)
 *   4. AI Analysis Layer (support only - read-only)
 * 
 * This module is strictly additive. It is NOT imported by:
 *   - src/lib/orchestrator.ts
 *   - src/lib/training-engine.ts
 *   - src/lib/coach-engine.ts
 *   - src/lib/weightlifting/* runtime modules (except for optional display)
 * 
 * AI outputs MUST NOT be used as direct inputs to modify system rules or templates.
 */

// ─────────────────────────────────────────────────────────────────────────────
// CERTAINTY + CONFIDENCE LEVELS
// ─────────────────────────────────────────────────────────────────────────────

export type ConfidenceLevel = "very_low" | "low" | "moderate" | "high" | "very_high";

export type TrendDirection = "increasing" | "stable" | "decreasing" | "unknown";

// ─────────────────────────────────────────────────────────────────────────────
// ATHLETE STATE INTERPRETATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interpretation of the athlete's current readiness state.
 * Descriptive only — does not modify training decisions.
 */
export interface ReadinessInterpretation {
  /** Overall readiness level (0-100 normalized) */
  readonly readiness_score: number;
  /** Categorical readiness state */
  readonly readiness_state: "optimal" | "good" | "adequate" | "compromised" | "poor";
  /** Primary factors influencing readiness */
  readonly contributing_factors: readonly string[];
  /** Confidence in the interpretation */
  readonly confidence: ConfidenceLevel;
  /** Natural language explanation for the athlete/coach */
  readonly explanation: string;
  /** Key observations (not recommendations) */
  readonly observations: readonly string[];
}

/**
 * Interpretation of fatigue patterns across domains.
 * Descriptive only — does not modify training decisions.
 */
export interface FatigueInterpretation {
  /** CNS fatigue level (0-100) */
  readonly cns_fatigue: number;
  /** Muscular/local fatigue level (0-100) */
  readonly muscular_fatigue: number;
  /** Technical fatigue level (0-100) */
  readonly technical_fatigue: number;
  /** Overall fatigue state */
  readonly fatigue_state: "fresh" | "mild" | "moderate" | "elevated" | "severe";
  /** Fatigue accumulation pattern */
  readonly accumulation_pattern: "acute_spike" | "gradual_buildup" | "chronic" | "recovering" | "stable";
  /** Confidence in the interpretation */
  readonly confidence: ConfidenceLevel;
  /** Natural language explanation */
  readonly explanation: string;
  /** Domain-specific observations */
  readonly domain_observations: {
    readonly cns: readonly string[];
    readonly muscular: readonly string[];
    readonly technical: readonly string[];
  };
}

/**
 * Combined athlete state interpretation.
 */
export interface AthleteStateInterpretation {
  readonly readiness: ReadinessInterpretation;
  readonly fatigue: FatigueInterpretation;
  /** Overall athlete state summary */
  readonly overall_state: "peak" | "ready" | "maintaining" | "fatigued" | "overreached";
  /** Read-only summary for display */
  readonly summary: string;
  /** Timestamp of analysis */
  readonly analyzed_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK DETECTION
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = "negligible" | "low" | "moderate" | "high" | "critical";

export type RiskCategory = 
  | "overload" 
  | "under_recovery" 
  | "technical_degradation" 
  | "stagnation" 
  | "overtraining"
  | "injury_precursor";

/**
 * Individual risk detection result.
 */
export interface DetectedRisk {
  /** Risk category */
  readonly category: RiskCategory;
  /** Risk level (0-100 score) */
  readonly risk_score: number;
  /** Categorical risk level */
  readonly risk_level: RiskLevel;
  /** Evidence supporting the risk detection */
  readonly evidence: readonly string[];
  /** Confidence in the risk detection */
  readonly confidence: ConfidenceLevel;
  /** Natural language description of the risk */
  readonly description: string;
  /** Observable indicators (not prescriptive recommendations) */
  readonly indicators: readonly string[];
}

/**
 * Comprehensive risk assessment.
 */
export interface RiskAssessment {
  /** All detected risks */
  readonly risks: readonly DetectedRisk[];
  /** Overall risk level (highest individual risk) */
  readonly overall_risk_level: RiskLevel;
  /** Primary risk concern */
  readonly primary_concern: DetectedRisk | null;
  /** Risk trend (are risks increasing/decreasing) */
  readonly risk_trend: TrendDirection;
  /** Summary of risk assessment */
  readonly summary: string;
  /** Timestamp of analysis */
  readonly analyzed_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY LAYER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Summary of a training week (microcycle).
 */
export interface WeekSummary {
  /** Week identifier */
  readonly week_label: string;
  /** Total sessions in the week */
  readonly sessions_completed: number;
  /** Average readiness during the week */
  readonly avg_readiness: number;
  /** Average fatigue during the week */
  readonly avg_fatigue: number;
  /** Training load trend */
  readonly load_trend: TrendDirection;
  /** Key observations from the week */
  readonly key_observations: readonly string[];
  /** Performance trends observed */
  readonly performance_trends: readonly string[];
  /** Notable patterns */
  readonly patterns: readonly string[];
}

/**
 * Summary of a mesocycle (multiple weeks).
 */
export interface MesocycleSummary {
  /** Mesocycle label/phase */
  readonly phase: string;
  /** Number of weeks in the mesocycle */
  readonly weeks: number;
  /** Week-by-week summaries */
  readonly weekly_summaries: readonly WeekSummary[];
  /** Overall adaptation trend */
  readonly adaptation_trend: TrendDirection;
  /** Fatigue trajectory across the mesocycle */
  readonly fatigue_trajectory: "controlled" | "accumulating" | "excessive" | "insufficient";
  /** Key adaptations observed */
  readonly observed_adaptations: readonly string[];
  /** Concerns or areas of attention */
  readonly concerns: readonly string[];
  /** Summary narrative */
  readonly narrative: string;
}

/**
 * Historical trend extraction result.
 */
export interface TrendAnalysis {
  /** Metric being analyzed */
  readonly metric: string;
  /** Direction of the trend */
  readonly direction: TrendDirection;
  /** Magnitude of change (percentage or absolute) */
  readonly magnitude: number;
  /** Statistical confidence (if applicable) */
  readonly statistical_confidence?: number;
  /** Qualitative confidence */
  readonly confidence: ConfidenceLevel;
  /** Description of the trend */
  readonly description: string;
  /** Notable inflection points or changes */
  readonly inflection_points: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMBINED AI ANALYSIS OUTPUT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete AI analysis output.
 * This is the main output type for the AI analysis layer.
 */
export interface AIAnalysisOutput {
  /** Athlete state interpretation */
  readonly state_interpretation: AthleteStateInterpretation | null;
  /** Risk assessment */
  readonly risk_assessment: RiskAssessment | null;
  /** Training summary (week or mesocycle) */
  readonly summary: WeekSummary | MesocycleSummary | null;
  /** Trend analyses for key metrics */
  readonly trend_analyses: readonly TrendAnalysis[];
  /** Overall analytical summary */
  readonly analytical_summary: string;
  /** Disclaimer: AI analysis is descriptive only */
  readonly disclaimer: "AI analysis is descriptive only. All training decisions are made by the deterministic rule engine.";
  /** Timestamp of analysis */
  readonly analyzed_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES FOR AI ANALYSIS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Session data for AI analysis.
 * Compatible with existing session snapshot formats.
 */
export interface AnalysisSessionData {
  readonly timestamp: number;
  readonly readiness: number;
  readonly fatigue: number;
  readonly success_rate: number;
  readonly average_RPE: number;
  readonly detected_problems?: readonly string[];
  readonly intervention_applied?: boolean;
  readonly notes?: readonly string[];
  // Microcycle-level data
  readonly cns_load?: number;
  readonly technical_load?: number;
  readonly local_load?: number;
  readonly intensity_avg?: number;
}

/**
 * Context for AI analysis.
 */
export interface AIAnalysisContext {
  /** Recent session data (chronological, oldest first) */
  readonly sessions: readonly AnalysisSessionData[];
  /** Current readiness (0-100) */
  readonly current_readiness: number;
  /** Current fatigue (0-100) */
  readonly current_fatigue: number;
  /** Training phase */
  readonly training_phase?: string;
  /** Days until competition (if applicable) */
  readonly competition_in_days?: number;
  /** Athlete level */
  readonly athlete_level?: "novice" | "intermediate" | "advanced" | "elite";
}

/**
 * Configuration for AI analysis.
 */
export interface AIAnalysisConfig {
  /** Minimum sessions required for analysis */
  readonly min_sessions: number;
  /** Window size for trend analysis */
  readonly trend_window: number;
  /** Thresholds for risk detection */
  readonly risk_thresholds: {
    readonly overload: number;
    readonly under_recovery: number;
    readonly technical_degradation: number;
  };
}

// Default configuration
export const DEFAULT_AI_ANALYSIS_CONFIG: AIAnalysisConfig = {
  min_sessions: 3,
  trend_window: 7,
  risk_thresholds: {
    overload: 70,
    under_recovery: 60,
    technical_degradation: 50,
  },
};