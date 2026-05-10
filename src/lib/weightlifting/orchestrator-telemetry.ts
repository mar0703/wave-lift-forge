// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATOR TELEMETRY — Phase A observability surface
//
// Records runtime occurrences of the unknown-profile-bypass path inside
// applyOrchestratorConstraints. Behavior of the orchestrator is unchanged;
// these helpers only observe. The ring buffer keeps the last N events so
// the taxonomy-integrity audit can surface them without unbounded growth.
// ─────────────────────────────────────────────────────────────────────────────

export interface UnknownExerciseBypassEvent {
  exercise_id: string;
  caller: string;
  validation_mode: string; // "strict" | "warning-only" | "repair" | "unset"
  recorded_at: number;
  constraint_snapshot: {
    complexity_max: number;
    intensity_pct: number;
    volume_multiplier: number;
    blocked_exercises_count: number;
  };
  arbitration_snapshot?: {
    final_complexity_ceiling: number;
    final_intensity_ceiling: number;
    final_cns_load_ceiling: number;
    blocked_stress_classes: string[];
    blocked_exercises_count: number;
    dominant_sources: string[];
  };
}

const UNKNOWN_BYPASS_BUFFER_LIMIT = 200;
const unknownExerciseBypassEvents: UnknownExerciseBypassEvent[] = [];

export function recordUnknownExerciseBypass(event: UnknownExerciseBypassEvent): void {
  unknownExerciseBypassEvents.push(event);
  if (unknownExerciseBypassEvents.length > UNKNOWN_BYPASS_BUFFER_LIMIT) {
    unknownExerciseBypassEvents.splice(
      0,
      unknownExerciseBypassEvents.length - UNKNOWN_BYPASS_BUFFER_LIMIT,
    );
  }
  if (typeof console !== "undefined" && typeof console.warn === "function") {
    console.warn("[orchestrator.unknown_exercise_bypass]", JSON.stringify(event));
  }
}

export function getUnknownExerciseBypassEvents(): UnknownExerciseBypassEvent[] {
  return [...unknownExerciseBypassEvents];
}

export function clearUnknownExerciseBypassEvents(): void {
  unknownExerciseBypassEvents.length = 0;
}
