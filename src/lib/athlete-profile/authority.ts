/**
 * ATHLETE PROFILE — AUTHORITY HIERARCHY (additive, non-governing)
 *
 * Doctrine:
 *   - Objective performance / readiness / recovery outcomes ALWAYS win over
 *     interpretive or behavioral profile data when the two conflict.
 *   - Behavioral, recovery, and interpretive profiles may annotate,
 *     recommend, summarize, prioritize coach attention, or personalize
 *     communication — but MUST NEVER directly drive runtime selection,
 *     volume, intensity, repair, arbitration, legality, or fallback.
 *
 * This file declares the hierarchy as data (read-only) and exposes a
 * pure conflict-resolver used by recommendation surfaces only. No runtime
 * orchestration code imports from here.
 */

import type { ProfileAuthorityLevel } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// AUTHORITY RULE TABLE
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthorityRule {
  readonly level: ProfileAuthorityLevel;
  readonly description: string;
  readonly may_govern_runtime: boolean;
  readonly may_recommend: boolean;
  readonly may_personalize_communication: boolean;
}

export const PROFILE_AUTHORITY_HIERARCHY: readonly AuthorityRule[] = [
  {
    level: "L0_observed_outcomes",
    description:
      "Measured workout outcomes — actual loads completed, RPE feedback, recovery deltas. Highest authority; overrides every profile layer when in conflict.",
    may_govern_runtime: true,
    may_recommend: true,
    may_personalize_communication: true,
  },
  {
    level: "L1_measured_performance",
    description:
      "Quantitative performance metrics — readiness, fatigue scores, workload tolerance signals. Governs runtime via the existing orchestration pipeline.",
    may_govern_runtime: true,
    may_recommend: true,
    may_personalize_communication: true,
  },
  {
    level: "L2_objective_profile",
    description:
      "Static objective data — bodyweight, training age, injury history, schedule. Does NOT govern runtime directly; informs coach-facing context only.",
    may_govern_runtime: false,
    may_recommend: true,
    may_personalize_communication: true,
  },
  {
    level: "L3_recovery_profile",
    description:
      "Observed recovery tendencies — sleep sensitivity, CNS fatigue sensitivity, etc. Advisory only; may suggest monitoring emphasis or recovery hints.",
    may_govern_runtime: false,
    may_recommend: true,
    may_personalize_communication: true,
  },
  {
    level: "L4_behavioral_profile",
    description:
      "Observed behavioral tendencies — pacing, monotony tolerance, overreaching tendency. Advisory only; informs coach interpretation and review frequency.",
    may_govern_runtime: false,
    may_recommend: true,
    may_personalize_communication: true,
  },
  {
    level: "L5_interpretive_profile",
    description:
      "Heuristic archetype interpretation (vata-/pitta-/kapha-like). Lowest authority. Communication aid only; never a validated physiological classification.",
    may_govern_runtime: false,
    may_recommend: true,
    may_personalize_communication: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONFLICT RESOLUTION
// ─────────────────────────────────────────────────────────────────────────────

export type ConflictWinner =
  | "objective"
  | "interpretive"
  | "neither";

export interface ProfileConflictResolution<T> {
  readonly winner: ConflictWinner;
  readonly value: T | undefined;
  readonly rationale: string;
}

/**
 * Resolve a conflict between an objective signal and an interpretive signal.
 * Objective wins whenever it is defined. Interpretive can only fill the gap
 * when objective data is absent. This is the only sanctioned cross-layer
 * resolution shape — recommendation surfaces are expected to call this
 * helper rather than reimplementing precedence ad-hoc.
 *
 * Pure function. No state, no side effects, no orchestration coupling.
 */
export function resolveProfileConflict<T>(
  objective_signal: T | undefined,
  interpretive_signal: T | undefined,
): ProfileConflictResolution<T> {
  if (objective_signal !== undefined) {
    return {
      winner: "objective",
      value: objective_signal,
      rationale: "objective signal present — overrides interpretive layer per doctrine",
    };
  }
  if (interpretive_signal !== undefined) {
    return {
      winner: "interpretive",
      value: interpretive_signal,
      rationale: "no objective signal available — interpretive layer surfaces as advisory only",
    };
  }
  return {
    winner: "neither",
    value: undefined,
    rationale: "no signal available from either layer",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GOVERNANCE BOUNDARY ASSERTIONS (static, observational)
// ─────────────────────────────────────────────────────────────────────────────

export interface GovernanceBoundary {
  readonly layer: ProfileAuthorityLevel;
  readonly may_modify_orchestration: false;
  readonly may_modify_repair: false;
  readonly may_modify_arbitration: false;
  readonly may_modify_legality: false;
  readonly may_modify_fallback: false;
  readonly may_emit_recommendations: true;
}

/**
 * Static boundary table. Each non-objective layer carries an explicit
 * structural "false" for every runtime authority surface. The literal-false
 * types make any future attempt to wire these layers into governance
 * a compile-time conflict — not just a convention.
 */
export const PROFILE_GOVERNANCE_BOUNDARIES: readonly GovernanceBoundary[] = [
  {
    layer: "L3_recovery_profile",
    may_modify_orchestration: false,
    may_modify_repair: false,
    may_modify_arbitration: false,
    may_modify_legality: false,
    may_modify_fallback: false,
    may_emit_recommendations: true,
  },
  {
    layer: "L4_behavioral_profile",
    may_modify_orchestration: false,
    may_modify_repair: false,
    may_modify_arbitration: false,
    may_modify_legality: false,
    may_modify_fallback: false,
    may_emit_recommendations: true,
  },
  {
    layer: "L5_interpretive_profile",
    may_modify_orchestration: false,
    may_modify_repair: false,
    may_modify_arbitration: false,
    may_modify_legality: false,
    may_modify_fallback: false,
    may_emit_recommendations: true,
  },
];
