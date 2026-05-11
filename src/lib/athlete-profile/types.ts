/**
 * ATHLETE PROFILE — LAYER TYPES (additive, non-governing)
 *
 * Doctrine:
 *   - Objective performance data has higher authority than interpretive profiling.
 *   - Interpretive (archetype/dosha-like) profiles are descriptive heuristics
 *     ONLY. They do not encode validated physiology, medical categories, or
 *     authoritative performance predictors.
 *   - Behavioral, recovery, and interpretive profile data MUST NOT silently
 *     evolve into orchestration, repair, arbitration, legality, or fallback
 *     authority.
 *   - Profile types are serializable, bounded, and replay-safe by construction:
 *     no functions, no Date objects, no Maps/Sets, no hidden mutable state.
 *
 * This module is strictly additive. It is NOT imported by:
 *   - src/lib/orchestrator.ts
 *   - src/lib/training-engine.ts
 *   - src/lib/weightlifting/* runtime modules
 *
 * The legacy detectDosha() pathway in training-engine.ts predates this layer
 * and remains untouched to preserve deterministic replay. The new
 * InterpretiveProfile defined here is separate from that legacy surface and
 * carries no governance authority of any kind.
 */

// ─────────────────────────────────────────────────────────────────────────────
// AUTHORITY LEVELS (descending — L0 is highest authority)
// ─────────────────────────────────────────────────────────────────────────────

export type ProfileAuthorityLevel =
  | "L0_observed_outcomes"
  | "L1_measured_performance"
  | "L2_objective_profile"
  | "L3_recovery_profile"
  | "L4_behavioral_profile"
  | "L5_interpretive_profile";

// ─────────────────────────────────────────────────────────────────────────────
// CERTAINTY + BOUNDED OPEN-WORLD MARKERS
// ─────────────────────────────────────────────────────────────────────────────

export type ProfileCertainty = "high" | "moderate" | "low" | "unknown";

export type TendencyLevel = "low" | "moderate" | "high" | "unknown";

export type SensitivityLevel = "low" | "moderate" | "high" | "unknown";

export type AppetiteResponse =
  | "suppressed"
  | "stable"
  | "elevated"
  | "unknown";

export type PacingBehavior =
  | "conservative"
  | "balanced"
  | "aggressive"
  | "unknown";

export type CompetitionLevel =
  | "novice"
  | "intermediate"
  | "advanced"
  | "elite"
  | "unknown";

// ─────────────────────────────────────────────────────────────────────────────
// LAYER A — OBJECTIVE PROFILE
// High-authority measurable data. May be referenced by coaches and by other
// observational layers; never used here to derive orchestration outputs.
// ─────────────────────────────────────────────────────────────────────────────

export interface ObjectiveProfile {
  readonly age_years?: number;
  readonly bodyweight_kg?: number;
  readonly height_cm?: number;
  readonly training_age_years?: number;
  readonly injury_history?: readonly string[];
  readonly typical_sleep_hours?: number;
  readonly weekly_training_days?: number;
  readonly competition_level?: CompetitionLevel;
  readonly workload_tolerance?: TendencyLevel;
  readonly schedule_constraints?: readonly string[];
  readonly notes?: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER B — BEHAVIORAL PROFILE
// Observed behavioral tendencies. Descriptive, non-governing.
// ─────────────────────────────────────────────────────────────────────────────

export interface BehavioralProfile {
  readonly monotony_tolerance?: TendencyLevel;
  readonly aggression_tendency?: TendencyLevel;
  readonly pacing_behavior?: PacingBehavior;
  readonly emotional_reactivity?: TendencyLevel;
  readonly stimulation_tolerance?: TendencyLevel;
  readonly recovery_volatility?: TendencyLevel;
  readonly overreaching_tendency?: TendencyLevel;
  readonly preference_for_structure?: TendencyLevel;
  readonly motivational_stability?: TendencyLevel;
  readonly notes?: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER C — RECOVERY PROFILE
// Recovery-related tendencies. Descriptive, non-governing.
// ─────────────────────────────────────────────────────────────────────────────

export interface RecoveryProfile {
  readonly sleep_sensitivity?: SensitivityLevel;
  readonly cns_fatigue_sensitivity?: SensitivityLevel;
  readonly heat_tolerance?: SensitivityLevel;
  readonly cold_tolerance?: SensitivityLevel;
  readonly hunger_response?: AppetiteResponse;
  readonly appetite_under_stress?: AppetiteResponse;
  readonly volume_tolerance?: TendencyLevel;
  readonly intensity_tolerance?: TendencyLevel;
  readonly stress_recovery_interaction?: SensitivityLevel;
  readonly notes?: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER D — INTERPRETIVE PROFILE
// Optional descriptive/archetype layer. Heuristic only — NOT physiology.
// Lowest authority. Coach-facing communication aid.
// ─────────────────────────────────────────────────────────────────────────────

export type InterpretiveArchetype =
  | "vata_like"
  | "pitta_like"
  | "kapha_like"
  | "mixed"
  | "undetermined";

export interface InterpretiveProfile {
  readonly primary_archetype: InterpretiveArchetype;
  readonly secondary_archetype?: InterpretiveArchetype;
  readonly archetype_certainty: ProfileCertainty;
  readonly volatility_markers?: readonly string[];
  readonly explanatory_notes?: readonly string[];
  /**
   * Hard-coded literal — present in every InterpretiveProfile to make the
   * non-governing contract a structural property of the type. Any code that
   * tried to wire interpretive_profile into runtime authority would still
   * have to deal with this assertion in serialized form.
   */
  readonly governs_runtime: false;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATE PROFILE
// Versioned, serializable snapshot. captured_at is an ISO-8601 string (never
// a Date object) so the profile is structurally replay-safe.
// ─────────────────────────────────────────────────────────────────────────────

export interface AthleteProfile {
  readonly profile_version: number;
  readonly captured_at: string;
  readonly objective_profile: ObjectiveProfile;
  readonly behavioral_profile: BehavioralProfile;
  readonly recovery_profile: RecoveryProfile;
  readonly interpretive_profile: InterpretiveProfile;
  readonly certainty: ProfileCertainty;
  readonly uncertainty_notes: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY / UNKNOWN PROFILE FACTORY
// Provides a deterministic baseline for new athletes / incomplete onboarding.
// All optional fields omitted; interpretive layer defaults to "undetermined".
// ─────────────────────────────────────────────────────────────────────────────

export function createEmptyAthleteProfile(captured_at: string): AthleteProfile {
  return {
    profile_version: 1,
    captured_at,
    objective_profile: {},
    behavioral_profile: {},
    recovery_profile: {},
    interpretive_profile: {
      primary_archetype: "undetermined",
      archetype_certainty: "unknown",
      governs_runtime: false,
    },
    certainty: "unknown",
    uncertainty_notes: [
      "profile_initialized_empty",
      "all_layers_default_to_unknown",
    ],
  };
}
