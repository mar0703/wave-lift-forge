/**
 * ATHLETE PROFILE — RECOMMENDATION PROJECTOR (additive, advisory-only)
 *
 * Doctrine:
 *   - Recommendations are advisory. They are NEVER auto-promoted into
 *     orchestration, repair, arbitration, legality, or fallback behavior.
 *   - Every emitted ProfileRecommendation carries a structural `governing:
 *     false` literal so the non-governing contract is enforced by the type
 *     system, not just by convention.
 *   - This projector is a pure function: same profile in → same notes out.
 *     No hidden state, no randomness, no time-coupled behavior.
 */

import type {
  AthleteProfile,
  BehavioralProfile,
  InterpretiveProfile,
  ProfileAuthorityLevel,
  RecoveryProfile,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type RecommendationSurface =
  | "coach_note"
  | "monitoring_emphasis"
  | "recovery_suggestion"
  | "communication_style"
  | "review_frequency";

export type RecommendationSourceLayer =
  | "objective"
  | "behavioral"
  | "recovery"
  | "interpretive";

export interface ProfileRecommendation {
  readonly id: string;
  readonly source_layer: RecommendationSourceLayer;
  readonly authority_level: ProfileAuthorityLevel;
  readonly surface: RecommendationSurface;
  readonly message: string;
  /** Structural non-governing contract — enforced by the type system. */
  readonly governing: false;
}

// ─────────────────────────────────────────────────────────────────────────────
// PER-LAYER PROJECTORS
// ─────────────────────────────────────────────────────────────────────────────

function behavioralRecommendations(
  p: BehavioralProfile,
): readonly ProfileRecommendation[] {
  const out: ProfileRecommendation[] = [];

  if (p.overreaching_tendency === "high") {
    out.push({
      id: "behavioral.overreaching_high",
      source_layer: "behavioral",
      authority_level: "L4_behavioral_profile",
      surface: "monitoring_emphasis",
      message:
        "Athlete reports a high tendency to push beyond plan. Increase review frequency around heavy weeks; remain alert to early fatigue signals. Plan itself remains driven by measured readiness.",
      governing: false,
    });
  }

  if (p.monotony_tolerance === "low") {
    out.push({
      id: "behavioral.monotony_low",
      source_layer: "behavioral",
      authority_level: "L4_behavioral_profile",
      surface: "coach_note",
      message:
        "Athlete reports low monotony tolerance. Communication may emphasize the purpose of repeated work; do not alter the prescription based on this signal alone.",
      governing: false,
    });
  }

  if (p.preference_for_structure === "high") {
    out.push({
      id: "behavioral.structure_pref_high",
      source_layer: "behavioral",
      authority_level: "L4_behavioral_profile",
      surface: "communication_style",
      message:
        "Athlete prefers clearly structured plans. Present sessions with explicit set/rep targets and a brief stated objective.",
      governing: false,
    });
  }

  if (p.emotional_reactivity === "high") {
    out.push({
      id: "behavioral.reactivity_high",
      source_layer: "behavioral",
      authority_level: "L4_behavioral_profile",
      surface: "coach_note",
      message:
        "Athlete reports high in-session reactivity. Frame setbacks as expected variance; coach interpretation only — does not change prescription.",
      governing: false,
    });
  }

  if (p.pacing_behavior === "aggressive") {
    out.push({
      id: "behavioral.pacing_aggressive",
      source_layer: "behavioral",
      authority_level: "L4_behavioral_profile",
      surface: "monitoring_emphasis",
      message:
        "Athlete pacing tends aggressive. Watch warmup load progression in heavy sessions; runtime load remains driven by the engine.",
      governing: false,
    });
  }

  return out;
}

function recoveryRecommendations(
  p: RecoveryProfile,
): readonly ProfileRecommendation[] {
  const out: ProfileRecommendation[] = [];

  if (p.sleep_sensitivity === "high") {
    out.push({
      id: "recovery.sleep_sens_high",
      source_layer: "recovery",
      authority_level: "L3_recovery_profile",
      surface: "recovery_suggestion",
      message:
        "Athlete reports high sleep sensitivity. Encourage consistent sleep timing; the engine's readiness/fatigue inputs remain the authority for actual session adjustment.",
      governing: false,
    });
  }

  if (p.cns_fatigue_sensitivity === "high") {
    out.push({
      id: "recovery.cns_sens_high",
      source_layer: "recovery",
      authority_level: "L3_recovery_profile",
      surface: "monitoring_emphasis",
      message:
        "Athlete reports lingering effects from high-CNS sessions. Track subjective CNS load following peak days; load prescription itself continues to come from measured readiness.",
      governing: false,
    });
  }

  if (p.volume_tolerance === "low") {
    out.push({
      id: "recovery.vol_tol_low",
      source_layer: "recovery",
      authority_level: "L3_recovery_profile",
      surface: "coach_note",
      message:
        "Athlete reports lower tolerance for high-volume weeks. Coach interpretation only; weekly volume continues to be derived from the engine and measured outcomes.",
      governing: false,
    });
  }

  if (p.intensity_tolerance === "low") {
    out.push({
      id: "recovery.int_tol_low",
      source_layer: "recovery",
      authority_level: "L3_recovery_profile",
      surface: "coach_note",
      message:
        "Athlete reports lower tolerance for high-intensity weeks. Coach interpretation only; intensity ceilings continue to come from arbitration and measured readiness.",
      governing: false,
    });
  }

  if (p.stress_recovery_interaction === "high") {
    out.push({
      id: "recovery.stress_interaction_high",
      source_layer: "recovery",
      authority_level: "L3_recovery_profile",
      surface: "review_frequency",
      message:
        "Athlete reports strong non-training stress effect on recovery. Increase coach check-in frequency during high-stress life periods; runtime decisions remain driven by readiness/fatigue scores.",
      governing: false,
    });
  }

  if (p.appetite_under_stress === "suppressed") {
    out.push({
      id: "recovery.appetite_suppressed",
      source_layer: "recovery",
      authority_level: "L3_recovery_profile",
      surface: "coach_note",
      message:
        "Athlete reports appetite suppression under stress. Worth surfacing during nutrition discussions; not a training-load signal.",
      governing: false,
    });
  }

  return out;
}

function interpretiveRecommendations(
  p: InterpretiveProfile,
): readonly ProfileRecommendation[] {
  const out: ProfileRecommendation[] = [];

  // Interpretive layer is heuristic. Each note explicitly reminds the reader
  // that the archetype is a communication aid, not a physiological claim.
  const archetype = p.primary_archetype;
  let archetype_message: string | undefined;
  switch (archetype) {
    case "vata_like":
      archetype_message =
        "Vata-like archetype is a heuristic label suggesting a tendency toward variability. Communication may emphasize routine and warmth; observed performance always overrides this label.";
      break;
    case "pitta_like":
      archetype_message =
        "Pitta-like archetype is a heuristic label suggesting a tendency toward intensity. Communication may emphasize pacing and recovery framing; observed performance always overrides this label.";
      break;
    case "kapha_like":
      archetype_message =
        "Kapha-like archetype is a heuristic label suggesting a tendency toward steadiness. Communication may emphasize variety and tempo; observed performance always overrides this label.";
      break;
    case "mixed":
      archetype_message =
        "Mixed archetype is a descriptive note about blended tendencies; treat as a communication aid only. Observed performance always overrides any archetype label.";
      break;
    case "undetermined":
      archetype_message = undefined;
      break;
  }

  if (archetype_message !== undefined) {
    out.push({
      id: `interpretive.${archetype}`,
      source_layer: "interpretive",
      authority_level: "L5_interpretive_profile",
      surface: "communication_style",
      message: archetype_message,
      governing: false,
    });

    // Low-certainty note only when there is an actual archetype to be
    // uncertain about. An "undetermined" archetype carries no interpretive
    // claim and therefore needs no caveat.
    if (p.archetype_certainty === "low" || p.archetype_certainty === "unknown") {
      out.push({
        id: "interpretive.low_certainty",
        source_layer: "interpretive",
        authority_level: "L5_interpretive_profile",
        surface: "coach_note",
        message:
          "Archetype certainty is low or unknown. Treat archetype-related guidance as tentative; defer to objective signals whenever they are available.",
        governing: false,
      });
    }
  }

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATE PROJECTOR
// ─────────────────────────────────────────────────────────────────────────────

export interface RecommendationProjection {
  readonly recommendations: readonly ProfileRecommendation[];
  readonly summary: {
    readonly total: number;
    readonly by_surface: Readonly<Record<RecommendationSurface, number>>;
    readonly by_source_layer: Readonly<Record<RecommendationSourceLayer, number>>;
  };
  readonly doctrine_notes: readonly string[];
}

export function deriveRecommendations(
  profile: AthleteProfile,
): RecommendationProjection {
  const recs: ProfileRecommendation[] = [
    ...behavioralRecommendations(profile.behavioral_profile),
    ...recoveryRecommendations(profile.recovery_profile),
    ...interpretiveRecommendations(profile.interpretive_profile),
  ];

  const by_surface: Record<RecommendationSurface, number> = {
    coach_note: 0,
    monitoring_emphasis: 0,
    recovery_suggestion: 0,
    communication_style: 0,
    review_frequency: 0,
  };
  const by_source_layer: Record<RecommendationSourceLayer, number> = {
    objective: 0,
    behavioral: 0,
    recovery: 0,
    interpretive: 0,
  };
  for (const r of recs) {
    by_surface[r.surface]++;
    by_source_layer[r.source_layer]++;
  }

  return {
    recommendations: recs,
    summary: {
      total: recs.length,
      by_surface,
      by_source_layer,
    },
    doctrine_notes: [
      "all_recommendations_are_advisory",
      "no_recommendation_modifies_runtime_state",
      "objective_outcomes_override_recommendations_when_in_conflict",
      "interpretive_layer_is_communication_aid_only",
    ],
  };
}
