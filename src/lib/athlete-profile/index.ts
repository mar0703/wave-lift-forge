/**
 * ATHLETE PROFILE — PUBLIC EXPORTS
 *
 * Additive, non-governing layer. Importers (UI, coach-facing surfaces,
 * reporting scripts) should depend only on this barrel. Runtime orchestration
 * modules (orchestrator, training-engine, weightlifting/*) MUST NOT import
 * from this barrel — that would silently convert advisory data into runtime
 * authority and violate the governance boundary doctrine.
 */

export type {
  // Authority + certainty
  ProfileAuthorityLevel,
  ProfileCertainty,
  TendencyLevel,
  SensitivityLevel,
  AppetiteResponse,
  PacingBehavior,
  CompetitionLevel,
  // Layer types
  ObjectiveProfile,
  BehavioralProfile,
  RecoveryProfile,
  InterpretiveProfile,
  InterpretiveArchetype,
  AthleteProfile,
} from "./types";

export { createEmptyAthleteProfile } from "./types";

export type {
  AuthorityRule,
  ConflictWinner,
  ProfileConflictResolution,
  GovernanceBoundary,
} from "./authority";

export {
  PROFILE_AUTHORITY_HIERARCHY,
  PROFILE_GOVERNANCE_BOUNDARIES,
  resolveProfileConflict,
} from "./authority";

export type {
  QuestionnaireLayer,
  QuestionnaireAnswerKind,
  QuestionnaireAnswerValue,
  QuestionnaireQuestion,
  QuestionnaireAnswer,
} from "./questionnaire";

export {
  QUESTIONNAIRE_BANK,
  questionsForLayer,
  questionById,
} from "./questionnaire";

export type {
  RecommendationSurface,
  RecommendationSourceLayer,
  ProfileRecommendation,
  RecommendationProjection,
} from "./recommendations";

export { deriveRecommendations } from "./recommendations";

export type {
  ProfileSnapshot,
  ProfileEvolution,
  EvolutionSummary,
  LongitudinalDeterminismGuarantee,
} from "./longitudinal";

export {
  createEvolution,
  appendSnapshot,
  currentSnapshot,
  summarizeEvolution,
  LONGITUDINAL_DETERMINISM_GUARANTEES,
} from "./longitudinal";
