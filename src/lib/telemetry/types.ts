// ─────────────────────────────────────────────────────────────────────────────
// TELEMETRY CONTRACT — write-only interface for runtime telemetry emission.
//
// Runtime modules depend only on TelemetrySink. They never read telemetry
// state. Concrete implementations (e.g. in-memory-sink) live in
// src/lib/observability/ and are never imported by runtime code.
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

export interface TelemetrySink {
  emit(event: UnknownExerciseBypassEvent): void;
}
