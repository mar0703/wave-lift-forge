/**
 * ATHLETE PROFILE — QUESTIONNAIRE BANK (additive, observational)
 *
 * Doctrine:
 *   - Questions are observational only — they describe tendencies, not
 *     diagnoses, not medical states, not pathologies.
 *   - Wording avoids clinical framing. Answers may be empty / "unknown"
 *     without breaking downstream surfaces.
 *   - The bank is bounded and static. No dynamic question generation, no
 *     adaptive branching, no hidden state.
 */

import type {
  ProfileAuthorityLevel,
  TendencyLevel,
  SensitivityLevel,
  AppetiteResponse,
  PacingBehavior,
  InterpretiveArchetype,
} from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionnaireLayer =
  | "objective"
  | "behavioral"
  | "recovery"
  | "interpretive";

export type QuestionnaireAnswerKind =
  | "tendency_level"
  | "sensitivity_level"
  | "appetite_response"
  | "pacing_behavior"
  | "archetype"
  | "free_text"
  | "number"
  | "boolean";

export interface QuestionnaireQuestion {
  readonly id: string;
  readonly layer: QuestionnaireLayer;
  readonly authority_level: ProfileAuthorityLevel;
  readonly prompt: string;
  readonly answer_kind: QuestionnaireAnswerKind;
  readonly options?: readonly string[];
  readonly observational_only: true;
  readonly non_diagnostic: true;
  readonly non_medical: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// ANSWER SHAPES
// ─────────────────────────────────────────────────────────────────────────────

export type QuestionnaireAnswerValue =
  | { kind: "tendency_level"; value: TendencyLevel }
  | { kind: "sensitivity_level"; value: SensitivityLevel }
  | { kind: "appetite_response"; value: AppetiteResponse }
  | { kind: "pacing_behavior"; value: PacingBehavior }
  | { kind: "archetype"; value: InterpretiveArchetype }
  | { kind: "free_text"; value: string }
  | { kind: "number"; value: number }
  | { kind: "boolean"; value: boolean }
  | { kind: "unknown" };

export interface QuestionnaireAnswer {
  readonly question_id: string;
  readonly answered_at: string;
  readonly value: QuestionnaireAnswerValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// STATIC QUESTION BANK
// ─────────────────────────────────────────────────────────────────────────────

const TENDENCY_OPTIONS: readonly string[] = ["low", "moderate", "high", "unknown"];
const SENSITIVITY_OPTIONS: readonly string[] = ["low", "moderate", "high", "unknown"];
const APPETITE_OPTIONS: readonly string[] = ["suppressed", "stable", "elevated", "unknown"];
const PACING_OPTIONS: readonly string[] = ["conservative", "balanced", "aggressive", "unknown"];
const ARCHETYPE_OPTIONS: readonly string[] = [
  "vata_like",
  "pitta_like",
  "kapha_like",
  "mixed",
  "undetermined",
];

export const QUESTIONNAIRE_BANK: readonly QuestionnaireQuestion[] = [
  // ── BEHAVIORAL ────────────────────────────────────────────────────────────
  {
    id: "behavioral.monotony_tolerance",
    layer: "behavioral",
    authority_level: "L4_behavioral_profile",
    prompt:
      "When training repeats similar sessions over a week, how comfortable do you feel staying with the plan?",
    answer_kind: "tendency_level",
    options: TENDENCY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "behavioral.pacing_behavior",
    layer: "behavioral",
    authority_level: "L4_behavioral_profile",
    prompt:
      "In a single training session, do you tend to start conservatively, balanced, or aggressively?",
    answer_kind: "pacing_behavior",
    options: PACING_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "behavioral.overreaching_tendency",
    layer: "behavioral",
    authority_level: "L4_behavioral_profile",
    prompt:
      "Looking back over recent training blocks, how often have you pushed beyond what was planned?",
    answer_kind: "tendency_level",
    options: TENDENCY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "behavioral.emotional_reactivity",
    layer: "behavioral",
    authority_level: "L4_behavioral_profile",
    prompt:
      "When a session does not go as planned, how strongly do you typically react in the moment?",
    answer_kind: "tendency_level",
    options: TENDENCY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "behavioral.preference_for_structure",
    layer: "behavioral",
    authority_level: "L4_behavioral_profile",
    prompt:
      "Do you prefer a fixed structured plan, or do you welcome variation between sessions?",
    answer_kind: "tendency_level",
    options: TENDENCY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "behavioral.stimulation_tolerance",
    layer: "behavioral",
    authority_level: "L4_behavioral_profile",
    prompt:
      "How well do you tolerate noisy, busy, or high-stimulation training environments?",
    answer_kind: "tendency_level",
    options: TENDENCY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "behavioral.motivational_stability",
    layer: "behavioral",
    authority_level: "L4_behavioral_profile",
    prompt:
      "Across weeks, how stable does your day-to-day training motivation feel?",
    answer_kind: "tendency_level",
    options: TENDENCY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },

  // ── RECOVERY ──────────────────────────────────────────────────────────────
  {
    id: "recovery.sleep_sensitivity",
    layer: "recovery",
    authority_level: "L3_recovery_profile",
    prompt:
      "How strongly does a short night of sleep affect the way your next session feels?",
    answer_kind: "sensitivity_level",
    options: SENSITIVITY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "recovery.cns_fatigue_sensitivity",
    layer: "recovery",
    authority_level: "L3_recovery_profile",
    prompt:
      "After a heavy CNS-demanding session (e.g. max snatches), how long do you typically feel its effect on the following day(s)?",
    answer_kind: "sensitivity_level",
    options: SENSITIVITY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "recovery.volume_tolerance",
    layer: "recovery",
    authority_level: "L3_recovery_profile",
    prompt:
      "How well do you generally tolerate weeks with higher than usual total training volume?",
    answer_kind: "tendency_level",
    options: TENDENCY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "recovery.intensity_tolerance",
    layer: "recovery",
    authority_level: "L3_recovery_profile",
    prompt:
      "How well do you generally tolerate weeks with higher than usual training intensity?",
    answer_kind: "tendency_level",
    options: TENDENCY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "recovery.heat_tolerance",
    layer: "recovery",
    authority_level: "L3_recovery_profile",
    prompt:
      "How well do you tolerate training in warmer environments compared to neutral ones?",
    answer_kind: "sensitivity_level",
    options: SENSITIVITY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "recovery.cold_tolerance",
    layer: "recovery",
    authority_level: "L3_recovery_profile",
    prompt:
      "How well do you tolerate training in cooler environments compared to neutral ones?",
    answer_kind: "sensitivity_level",
    options: SENSITIVITY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "recovery.appetite_under_stress",
    layer: "recovery",
    authority_level: "L3_recovery_profile",
    prompt:
      "When you are under non-training stress, how does your appetite usually change?",
    answer_kind: "appetite_response",
    options: APPETITE_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "recovery.stress_recovery_interaction",
    layer: "recovery",
    authority_level: "L3_recovery_profile",
    prompt:
      "How strongly does non-training stress (work, life) affect how quickly you recover between sessions?",
    answer_kind: "sensitivity_level",
    options: SENSITIVITY_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },

  // ── INTERPRETIVE (lowest authority, descriptive only) ─────────────────────
  {
    id: "interpretive.primary_archetype",
    layer: "interpretive",
    authority_level: "L5_interpretive_profile",
    prompt:
      "Which descriptive archetype currently feels closest to your overall pattern? This is a communication aid only — your observed performance always takes precedence over any archetype label.",
    answer_kind: "archetype",
    options: ARCHETYPE_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
  {
    id: "interpretive.secondary_archetype",
    layer: "interpretive",
    authority_level: "L5_interpretive_profile",
    prompt:
      "If a secondary archetype also feels relevant, which one? Mixed/undetermined are valid answers.",
    answer_kind: "archetype",
    options: ARCHETYPE_OPTIONS,
    observational_only: true,
    non_diagnostic: true,
    non_medical: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BANK INSPECTION HELPERS (pure projections)
// ─────────────────────────────────────────────────────────────────────────────

export function questionsForLayer(
  layer: QuestionnaireLayer,
): readonly QuestionnaireQuestion[] {
  return QUESTIONNAIRE_BANK.filter((q) => q.layer === layer);
}

export function questionById(id: string): QuestionnaireQuestion | undefined {
  return QUESTIONNAIRE_BANK.find((q) => q.id === id);
}
