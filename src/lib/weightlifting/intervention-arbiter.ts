// Intervention Arbiter
// -----------------------------------------------------------------------------
// Coaching governance layer that runs BEFORE correction-engine.ts.
//
// The correction engine knows how to correct. This layer decides when correction
// is appropriate at all. It never selects exercises and never replaces the
// correction engine.

export type InterventionMode = "allow" | "limit" | "block";
export type InterventionRisk = "low" | "moderate" | "high" | "extreme";
export type InterventionScope = "full" | "minimal" | "monitor_only" | "recovery_only";
export type AthleteLevel = "novice" | "intermediate" | "advanced" | "elite";

export interface InterventionSessionContext {
  set_to_set_degradation?: boolean;
  load_dependent_degradation?: boolean;
  heavy_microcycle_accumulation?: boolean;
  stable_competition_performance?: boolean;
  movement_pattern_established?: boolean;
  established_movement_signature?: boolean;
  psychological_instability?: boolean;
  post_injury_return?: boolean;
  high_cognitive_load_required?: boolean;
  expected_benefit?: "low" | "moderate" | "high";
}

export interface InterventionArbiterInput {
  readiness: number; // accepts 0..10 or 0..100
  fatigue: number; // 0..100
  detected_problems: string[];
  success_rate?: number; // 0..100
  success_consistency?: number; // 0..100 — explicit metric, NOT derived from success_rate
  competition_in_days?: number;
  training_age_months?: number;
  athlete_level?: AthleteLevel;
  session_context?: InterventionSessionContext;

  // ── Future state-engine hooks (optional, lightly integrated) ──
  /** Number of days the problem has been observed. TODO: full persistence tracking in state engine */
  problem_persistence_days?: number;
  /** Performance trajectory direction. TODO: integrate into state engine for trend-aware decisions */
  performance_trend?: "improving" | "stable" | "declining";
  /** Confidence in the diagnostic (0-100). TODO: wire from diagnostics engine */
  diagnostic_confidence?: number;
  /** Severity of the problem (0-100). TODO: integrate into fatigue gate refinement */
  problem_severity_score?: number;
}

export interface InterventionDecision {
  intervention_allowed: boolean;
  intervention_mode: InterventionMode;
  intervention_risk: InterventionRisk;
  intervention_scope: InterventionScope;
  reasons: string[];
  blocked_by?: string[];
  warnings?: string[];
  recommendations?: string[];
}

const riskRank: Record<InterventionRisk, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  extreme: 3,
};

function normalizeReadiness(readiness: number): number {
  if (!Number.isFinite(readiness)) return 50;
  return readiness <= 10 ? readiness * 10 : readiness;
}

function inferAthleteLevel(input: InterventionArbiterInput): AthleteLevel {
  if (input.athlete_level) return input.athlete_level;
  const months = input.training_age_months;
  if (months === undefined) return "intermediate";
  if (months < 18) return "novice";
  if (months < 48) return "intermediate";
  if (months < 96) return "advanced";
  return "elite";
}

function maxRisk(a: InterventionRisk, b: InterventionRisk): InterventionRisk {
  return riskRank[b] > riskRank[a] ? b : a;
}

function blocked(
  risk: InterventionRisk,
  scope: InterventionScope,
  reasons: string[],
  blockedBy: string[],
  recommendations: string[],
  warnings: string[] = [],
): InterventionDecision {
  return {
    intervention_allowed: false,
    intervention_mode: "block",
    intervention_risk: risk,
    intervention_scope: scope,
    reasons,
    blocked_by: blockedBy,
    warnings,
    recommendations,
  };
}

/**
 * Decide whether correction is allowed before any corrective exercise logic runs.
 *
 * Example blocked scenarios:
 * - fatigue artifact: readiness 45, fatigue 82, 4 simultaneous problems
 * - taper panic: competition in 5 days with high cognitive-load correction
 * - elite preservation: 93% success, stable competition pattern, established style
 * - post-injury/psychological instability where risk exceeds expected benefit
 */
export function interventionArbiter(input: InterventionArbiterInput): InterventionDecision {
  const readiness = normalizeReadiness(input.readiness);
  const fatigue = input.fatigue;
  const problems = input.detected_problems;
  const ctx = input.session_context ?? {};
  const athleteLevel = inferAthleteLevel(input);

  let risk: InterventionRisk = "low";
  let mode: InterventionMode = "allow";
  let scope: InterventionScope = "full";
  const reasons: string[] = [];
  const blockedBy: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // GATE 1 - FATIGUE ARTIFACT GATE
  // If many technical signals appear under low readiness/high fatigue, treat
  // them as recovery information first. Correcting fatigued technique is how a
  // coach creates problems out of noise.
  //
  // KEY DISTINCTIONS (future state-engine will refine):
  // - Temporary degradation: appears under fatigue, resolves with recovery
  // - Stable technical flaw: present regardless of fatigue state
  // - Transient instability: set-to-set worsening under load
  // - Chronic instability: consistent across all sessions and states
  //
  // TODO: State engine will track problem persistence across sessions to
  // distinguish temporary fatigue artifacts from stable technical flaws.
  const fatigueEvidence = [
    readiness < 55,
    fatigue > 75,
    problems.length >= 3,
    !!ctx.load_dependent_degradation,
    !!ctx.set_to_set_degradation,
    !!ctx.heavy_microcycle_accumulation,
  ].filter(Boolean).length;

  // Light integration of problem severity for fatigue gate refinement
  const severityAdjustment = (input.problem_severity_score ?? 50) / 100;

  if (
    (readiness < 55 && fatigue > 75) ||
    (fatigue > 75 && problems.length >= 3) ||
    (fatigueEvidence >= 4)
  ) {
    const fatigueReasons = ["Likely fatigue artifact: technical degradation is probably recovery-driven, not a stable skill flaw."];
    if (severityAdjustment < 0.5) {
      fatigueReasons.push("Low severity score supports fatigue artifact hypothesis.");
    }

    const fatigueDetails = [`Fatigue evidence score: ${fatigueEvidence}/6.`];
    if (input.problem_severity_score !== undefined) {
      fatigueDetails.push(`Problem severity: ${input.problem_severity_score}/100.`);
    }

    return blocked(
      "extreme",
      "recovery_only",
      fatigueReasons,
      ["fatigue_artifact_gate"],
      [
        "Block technical correction.",
        "Prioritize recovery, reduce workload, and retest movement quality after recovery.",
      ],
      fatigueDetails,
    );
  }

  // GATE 2 - COMPETITION PROXIMITY GATE
  // Major technical rebuilding near competition has poor risk/reward. Close to
  // competition, preserve confidence and reinforce known patterns.
  //
  // NOTE: Elite coaching still allows safe low-risk interventions near competition:
  // - confidence stabilization
  // - opener stabilization
  // - emergency low-risk correction
  // - rhythm reinforcement
  // Therefore we LIMIT rather than BLOCK at <= 7 days.
  if (input.competition_in_days !== undefined) {
    if (input.competition_in_days <= 7) {
      // Do NOT hard block — preserve safe low-risk intervention capability
      mode = "limit";
      scope = "monitor_only";
      risk = maxRisk(risk, "high");
      reasons.push("Competition is within 7 days: limit intervention to low-risk confidence and pattern reinforcement only.");
      blockedBy.push("competition_proximity_gate");
      warnings.push("No new movement patterns — preserve competition-ready technique.");
      warnings.push("No high cognitive-load corrections — athlete needs confidence, not complexity.");
      warnings.push("No technical rebuilding — only reinforcement of established patterns.");
      recommendations.push("Focus on confidence stabilization, opener consistency, and rhythm reinforcement.");
      recommendations.push("If intervention is necessary, use single familiar cue with minimal disruption.");
    }

    if (input.competition_in_days <= 21) {
      risk = maxRisk(risk, "high");
      mode = "limit";
      scope = "minimal";
      reasons.push("Competition is within 21 days: major technical rebuilds are not appropriate.");
      blockedBy.push("competition_proximity_gate");
      warnings.push("Avoid new movement patterns and high cognitive-load corrections.");
      recommendations.push("Limit work to light technical reinforcement and known-pattern consistency.");
    }
  }

  // GATE 3 - SUCCESS PRESERVATION GATE
  // If it works, do not fix it. Stable, successful patterns should be watched
  // before they are corrected, especially for advanced and elite lifters.
  //
  // CRITICAL: success_consistency and success_rate are DISTINCT metrics.
  // - success_rate: percentage of successful lifts (single-session or aggregate)
  // - success_consistency: stability of success across contexts/loads/time
  // We do NOT fall back to success_rate when consistency is missing.
  const hasConsistencyMetric = input.success_consistency !== undefined;
  const highSuccess = (input.success_rate ?? 0) >= 90;
  const highConsistency = hasConsistencyMetric && input.success_consistency! >= 85;

  if (
    highSuccess &&
    highConsistency &&
    (ctx.stable_competition_performance || ctx.movement_pattern_established)
  ) {
    const successRisk = athleteLevel === "elite" || athleteLevel === "advanced" ? "extreme" : "high";
    return blocked(
      successRisk,
      "monitor_only",
      [
        "Successful, consistent movement pattern detected: correction risk exceeds likely benefit.",
      ],
      ["success_preservation_gate"],
      [
        "Preserve the pattern and monitor only.",
        "Intervene only if success rate, pain, or competition stability deteriorates.",
      ],
    );
  }

  // If success_rate is high but consistency metric is missing, apply warning-level
  // preservation bias rather than full block
  if (highSuccess && !hasConsistencyMetric && (ctx.stable_competition_performance || ctx.movement_pattern_established)) {
    risk = maxRisk(risk, "moderate");
    if (mode === "allow") mode = "limit";
    if (scope === "full") scope = "minimal";
    reasons.push("High success rate detected without explicit consistency metric: applying preservation bias.");
    warnings.push("Success rate is high but consistency is unconfirmed — prefer minimal intervention.");
    recommendations.push("Monitor pattern stability before committing to correction.");
  }

  // GATE 4 - ATHLETE LEVEL GATE
  // Novices need one simple correction. Elites need identity preservation and
  // minimal disruption. Intermediate lifters can tolerate moderate correction.
  //
  // NOTE: Elite level alone should NOT strongly bias toward preservation.
  // Elite athletes sometimes require aggressive rebuilding if trajectory declines.
  // The risk/reward gate handles trajectory-aware decisions.
  if (athleteLevel === "novice") {
    risk = maxRisk(risk, problems.length > 1 ? "high" : "moderate");
    mode = "limit";
    scope = "minimal";
    reasons.push("Novice athlete: limit correction to one low-complexity primary intervention.");
    warnings.push("Avoid multiple simultaneous corrections and high cognitive load.");
    recommendations.push("Use one cue, low complexity, and technical consistency before adding new corrections.");
  } else if (athleteLevel === "elite") {
    // Soft bias only — elite athletes may need aggressive intervention if declining
    risk = maxRisk(risk, "low"); // Reduced from "moderate" to avoid automatic over-protection
    reasons.push("Elite athlete: prefer minimal disruption but allow intervention if clearly beneficial.");
    recommendations.push("Use targeted intervention with clear success criteria and exit strategy.");
  }

  // GATE 5 - RISK VS REWARD GATE
  // A correction can be technically valid and still be bad coaching if the
  // athlete is close to competition, psychologically unstable, post-injury, or
  // already successful.
  //
  // TODO: Future state-engine integration will refine these heuristics with:
  // - Problem persistence tracking (chronic vs temporary)
  // - Performance trend analysis (improving vs declining)
  // - Diagnostic confidence weighting
  // - Severity-adjusted risk calculation
  let riskPoints = 0;
  // Reduced elite bias: elite level alone should not strongly increase risk
  // Elite athletes may need aggressive intervention if trajectory is declining
  if (athleteLevel === "elite") riskPoints += 1; // Reduced from 2
  else if (athleteLevel === "advanced") riskPoints += 1;
  if (input.competition_in_days !== undefined && input.competition_in_days <= 28) riskPoints += 2;
  if (ctx.established_movement_signature || ctx.movement_pattern_established) riskPoints += 2;
  if (ctx.psychological_instability) riskPoints += 2;
  if (ctx.post_injury_return) riskPoints += 2;
  if ((input.success_rate ?? 0) >= 85) riskPoints += 1;

  const benefitPoints =
    ctx.expected_benefit === "high" ? 3 :
    ctx.expected_benefit === "moderate" ? 2 :
    ctx.expected_benefit === "low" ? 1 :
    problems.length >= 2 ? 2 :
    problems.length === 1 ? 1 :
    0;

  // Light integration of future state-engine hooks
  if (input.diagnostic_confidence !== undefined && input.diagnostic_confidence < 50) {
    warnings.push(`Low diagnostic confidence (${input.diagnostic_confidence}%) — consider further assessment before intervention.`);
  }

  // Performance trend integration (future state-engine hook)
  if (input.performance_trend === "declining") {
    // Declining trajectory may justify higher-risk intervention for elites
    if (athleteLevel === "elite") {
      reasons.push("Elite athlete with declining trajectory — intervention may be justified despite typical preservation bias.");
    }
  } else if (input.performance_trend === "improving") {
    // Improving trajectory suggests caution — don't disrupt positive momentum
    riskPoints += 1;
    warnings.push("Performance trend is improving — avoid interventions that could disrupt positive momentum.");
  }

  if (riskPoints >= benefitPoints + 3) {
    return blocked(
      riskPoints >= benefitPoints + 5 ? "extreme" : "high",
      "monitor_only",
      [
        "Intervention risk exceeds expected benefit.",
      ],
      ["risk_vs_reward_gate", ...blockedBy],
      [
        "Prefer preservation, monitoring, confidence support, or recovery management.",
      ],
      [
        `Risk/reward score: risk=${riskPoints}, benefit=${benefitPoints}.`,
        ...warnings,
      ],
    );
  }

  if (riskPoints > benefitPoints) {
    risk = maxRisk(risk, "high");
    mode = "limit";
    scope = "minimal";
    reasons.push("Intervention risk is elevated relative to expected benefit.");
    warnings.push(`Risk/reward score: risk=${riskPoints}, benefit=${benefitPoints}.`);
    recommendations.push("Use the least disruptive intervention and monitor response before progressing.");
  } else if (riskPoints > 0) {
    risk = maxRisk(risk, "moderate");
  }

  if (reasons.length === 0) {
    reasons.push("No governance gate blocked correction.");
    recommendations.push("Proceed to correction engine.");
  }

  return {
    intervention_allowed: true,
    intervention_mode: mode,
    intervention_risk: risk,
    intervention_scope: scope,
    reasons,
    blocked_by: blockedBy.length ? blockedBy : undefined,
    warnings: warnings.length ? warnings : undefined,
    recommendations: recommendations.length ? recommendations : undefined,
  };
}
