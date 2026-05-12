// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATOR TELEMETRY — backward-compatibility re-export shim
//
// The telemetry state (buffer, record, get, clear) has been moved to:
//   src/lib/observability/in-memory-sink.ts
//
// The TelemetrySink contract and event type have been moved to:
//   src/lib/telemetry/types.ts
//
// Runtime modules (orchestrator, repair-engine) should NOT import from this
// file. They must use the TelemetrySink interface via dependency injection.
//
// This file remains only for backward compatibility with any external callers
// or tests that may still reference the old exports.
// ─────────────────────────────────────────────────────────────────────────────

export {
  recordUnknownExerciseBypass,
  getUnknownExerciseBypassEvents,
  clearUnknownExerciseBypassEvents,
} from "../observability/in-memory-sink";

export {
  UnknownExerciseBypassEvent,
  TelemetrySink,
} from "../telemetry/types";