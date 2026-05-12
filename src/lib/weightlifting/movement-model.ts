// Biomechanical foundation layer for Olympic weightlifting.
// Pure data + helpers. Does NOT touch the existing coach pipeline,
// engine-store, exercise DB, or diagnostics. Safe to import in isolation.
//
// Domain constants (PHASES, MOVEMENT_PATTERNS, POSITIONS, PROBLEM_PHASE,
// PROBLEM_POSITION, PHASE_CORRECTIVES) live in `../ontology`. This module
// owns the type vocabulary and the helper functions that consume them.

import {
  PHASES,
  MOVEMENT_PATTERNS,
  POSITIONS,
  PROBLEM_PHASE,
  PROBLEM_POSITION,
  PHASE_CORRECTIVES,
} from "../ontology";

export type MovementPattern =
  | "snatch"
  | "clean"
  | "push_press"
  | "push_jerk"
  | "split_jerk";

export type MovementPhase =
  | "start"
  | "first_pull"
  | "transition"
  | "extension"
  | "pull_under"
  | "receive"
  | "recovery"
  | "dip"
  | "drive"
  | "lockout"
  | "split";

export type MovementPosition =
  | "floor"
  | "below_knee"
  | "above_knee"
  | "power_position"
  | "hip_contact"
  | "rack"
  | "overhead";

// ────────────────────────
// PHASE DATABASE
// ────────────────────────

export interface PhaseDef {
  id: MovementPhase;
  ru: string;              // Russian weightlifting terminology
  biomechanics: string;    // what the body does
  cues: string[];          // coaching cues
  errors: string[];        // common technical errors
}

// ────────────────────────
// MOVEMENT PATTERNS
// ────────────────────────

export interface PatternDef {
  id: MovementPattern;
  ru: string;
  phases: MovementPhase[];
}

// ────────────────────────
// POSITION DATABASE
// ────────────────────────

export interface PositionDef {
  id: MovementPosition;
  ru: string;
  description: string;
}

// ────────────────────────
// HELPER FUNCTIONS
// ────────────────────────

export function getPhase(id: MovementPhase): PhaseDef | undefined {
  return PHASES[id];
}

export function getPattern(id: MovementPattern): PatternDef | undefined {
  return MOVEMENT_PATTERNS[id];
}

export function getPosition(id: MovementPosition): PositionDef | undefined {
  return POSITIONS[id];
}

export function getPhaseFromProblem(problem: string): MovementPhase | undefined {
  return PROBLEM_PHASE[problem];
}

export function getPositionFromProblem(problem: string): MovementPosition | undefined {
  return PROBLEM_POSITION[problem];
}

export function getCorrectivesForPhase(phase: MovementPhase): string[] {
  return PHASE_CORRECTIVES[phase] ?? [];
}
