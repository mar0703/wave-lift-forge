// ===================================================================
// ATHLETE STATE — UNIFIED RUNTIME STATE MODEL
//
// Purpose:
// - Single source of truth for athlete readiness, fatigue, and load
// - Threaded through the orchestrator as additive state layer
// - Does NOT replace or modify existing periodization logic
// - Serializable, deterministic, no side effects
//
// Architecture:
//   AthleteState is an OUTPUT of the orchestrator pipeline.
//   It is updated AFTER session execution via state-engine.ts.
//   It serves as INPUT for the NEXT session's orchestrator call.
// ===================================================================

export type AthleteState = {
  snapshot: {
    readiness: number;
    fatigue: number;
    performance: number;
    technical_quality: number;
    recovery: number;
  };

  trends: {
    readiness_7d: number;
    fatigue_7d: number;
    performance_28d: number;
    load_tolerance_slope: number;
  };

  load_history: {
    acute_load: number;
    chronic_load: number;
    acwr: number;
    /** Rolling window of recent session loads (most recent last). Max 28 entries for chronic computation. */
    recent_loads: number[];
  };

  flags: {
    overreaching: boolean;
    technical_degradation: boolean;
    under_recovery: boolean;
  };

  meta: {
    last_update: number;
    phase: "BASE" | "STRENGTH" | "SPECIFIC" | "PEAK";
  };
};

/**
 * Input fed into updateState() after a session is planned/executed.
 * Derived from the orchestrator's output — load, intensity, RPE.
 */
export interface SessionResult {
  /** Total session load (sum of sets × reps × intensity across exercises) */
  session_load: number;
  /** Average intensity percentage across exercises (0–100) */
  average_intensity: number;
  /** Average RPE for the session (0–10), typically from engine input */
  average_rpe: number;
  /** Whether the session included technical failure indicators */
  technical_failure: boolean;
  /** Success rate for the session (0–100) */
  success_rate: number;
  /** Training phase at time of session */
  phase: AthleteState["meta"]["phase"];
}