// ─────────────────────────────────────────────────────────────────────────────
// IN-MEMORY TELEMETRY SINK — holds the event buffer and state.
//
// Used only for logging/debug/tests. NOT imported by runtime modules.
// Runtime modules depend only on the TelemetrySink interface from
// src/lib/telemetry/types.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  TelemetrySink,
  UnknownExerciseBypassEvent,
} from "../telemetry/types";

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

export const inMemorySink: TelemetrySink = {
  emit: recordUnknownExerciseBypass,
};