// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator Signal Bridge
//
// Converts raw engine outputs (RecoveryDecision, MicrocycleDecision,
// DailyPriorityDecision, InterventionDecision) into typed ConstraintSignal[]
// and calls arbitrateConstraints().
//
// This is the ONLY place that translates engine outputs → arbitration layer.
// The orchestrator calls this bridge; engines stay pure.
// ─────────────────────────────────────────────────────────────────────────────

import {
  arbitrateConstraints,
  createConstraintSignal,
  type ConstraintSignal,
} from "./constraint-arbitration";

import type { ArbitrationDecision } from "./constraint-arbitration";
import type { MicrocycleDecision } from "./microcycle-engine";
import type { DailyPriorityDecision } from "./daily-priority-engine";
import type { InterventionDecision } from "./exercise-intervention-engine";
import type { RecoveryDecision } from "./recovery-domain-engine";
// Re-export for convenience
export type { ArbitrationDecision } from "./constraint-arbitration";

// ────────────────────────────────────────────────────────────
// Input
// ────────────────────────────────────────────────────────────

export interface BridgeInput {
  recovery: RecoveryDecision;
  microcycle: MicrocycleDecision;
  priority: DailyPriorityDecision;
  intervention: InterventionDecision;
  athlete_context?: {
    competition_in_days?: number;
    training_phase?: "accumulation" | "intensification" | "peak";
    readiness?: number;
    fatigue?: number;
  };
  // Optional strategic specificity pressure derived from the mesocycle
  // execution layer (taper state, adaptation target, weekly bias,
  // competition proximity — already aggregated via Math.max upstream).
  // Routed through arbitration so runtime biases reflect strategic plan.
  mesocycle?: {
    specificity_pressure: number; // 0..1
  };
}

// ────────────────────────────────────────────────────────────
// Converters — one per engine output
// ────────────────────────────────────────────────────────────

function recoveryToSignals(recovery: RecoveryDecision): ConstraintSignal[] {
  const signals: ConstraintSignal[] = [];
  const d = recovery.recovery_domains;

  // CNS
  if (d.cns <= 30) {
    signals.push(createConstraintSignal("recovery", "intensity_ceiling", 90, {
      intensity_ceiling: 75,
      cns_load_ceiling: 50,
      protected_quality: "cns_recovery",
    }));
    signals.push(createConstraintSignal("recovery", "restoration_bias", 90, {
      restoration_bias: 0.4,
      protected_quality: "cns_recovery",
    }));
  } else if (d.cns <= 45) {
    signals.push(createConstraintSignal("recovery", "intensity_ceiling", 65, {
      intensity_ceiling: 85,
      cns_load_ceiling: 65,
      protected_quality: "cns_recovery",
    }));
    signals.push(createConstraintSignal("recovery", "restoration_bias", 65, {
      restoration_bias: 0.2,
      protected_quality: "cns_recovery",
    }));
  }

  // Technical coordination — drives complexity ceiling
  if (d.technical_coordination <= 30) {
    signals.push(createConstraintSignal("recovery", "complexity_ceiling", 95, {
      target_complexity_max: 4,
      protected_quality: "technical_coordination",
    }));
  } else if (d.technical_coordination <= 45) {
    signals.push(createConstraintSignal("recovery", "complexity_ceiling", 70, {
      target_complexity_max: 6,
      protected_quality: "technical_coordination",
    }));
  }

  // Overhead
  if (d.overhead <= 30) {
    signals.push(createConstraintSignal("recovery", "stress_class_block", 85, {
      target_stress_classes: ["overhead_maximal", "overhead_technical"],
      protected_quality: "overhead_integrity",
    }));
  } else if (d.overhead <= 45) {
    signals.push(createConstraintSignal("recovery", "intensity_ceiling", 60, {
      intensity_ceiling: 85,
      protected_quality: "overhead_integrity",
    }));
  }

  // Legs
  if (d.legs <= 30) {
    signals.push(createConstraintSignal("recovery", "stress_class_block", 80, {
      target_stress_classes: ["squat_maximal"],
      protected_quality: "legs_recovery",
    }));
  }

  // Pull chain
  if (d.pull_chain <= 30) {
    signals.push(createConstraintSignal("recovery", "stress_class_block", 80, {
      target_stress_classes: ["pull_maximal"],
      protected_quality: "pull_recovery",
    }));
  }

  // Speed freshness
  if (d.speed_freshness <= 30) {
    signals.push(createConstraintSignal("recovery", "restoration_bias", 70, {
      restoration_bias: 0.2,
      protected_quality: "speed_freshness",
    }));
  }

  return signals;
}

function microcycleToSignals(
  microcycle: MicrocycleDecision,
  competitionInDays?: number,
): ConstraintSignal[] {
  const signals: ConstraintSignal[] = [];
  const s = microcycle.microcycle_state;

  // Technical density — real coordination safety constraint
  if (s.technical_density > 200) {
    signals.push(createConstraintSignal("microcycle", "complexity_ceiling", 65, {
      target_complexity_max: 5,
      protected_quality: "technical_coordination",
    }));
  }

  // Competition specificity pressure — timing signal only
  if (competitionInDays !== undefined && competitionInDays <= 28) {
    const severity = competitionInDays <= 7 ? 90 : competitionInDays <= 14 ? 75 : 55;
    signals.push(createConstraintSignal("competition", "specificity_pressure", severity, {
      specificity_pressure: competitionInDays <= 14 ? 0.8 : 0.5,
      protected_quality: "competition_specificity",
    }));
  }

  // NOTE: maladaptation_risk and rolling_cns_load are NOT converted to
  // constraint signals. They are informational — surfaced via overload_signals
  // in the orchestrator. Planned overload is intentional.

  return signals;
}

function priorityToSignals(priority: DailyPriorityDecision): ConstraintSignal[] {
  const signals: ConstraintSignal[] = [];
  const hints = priority.definition;

  signals.push(createConstraintSignal("priority", "intensity_ceiling", 40, {
    intensity_ceiling: hints.preferred_intensity_range.max,
    protected_quality: "preference_alignment",
  }));

  signals.push(createConstraintSignal("priority", "complexity_ceiling", 40, {
    target_complexity_max: hints.preferred_complexity_range.max as
      1|2|3|4|5|6|7|8|9|10,
    protected_quality: "preference_alignment",
  }));

  signals.push(createConstraintSignal("priority", "cns_load_ceiling", 40, {
    cns_load_ceiling: hints.max_cns_load,
    protected_quality: "preference_alignment",
  }));

  return signals;
}

function mesocycleToSignals(
  mesocycle: { specificity_pressure: number } | undefined,
): ConstraintSignal[] {
  if (!mesocycle) return [];
  const pressure = mesocycle.specificity_pressure;
  if (!Number.isFinite(pressure) || pressure <= 0) return [];

  // Emit under source="competition" so it lands in the high-severity
  // Math.max branch of arbitrateSpecificityPressure alongside the
  // microcycle competition-proximity signal — preventing additive
  // double-counting in the sum branch. mesocycleExecution.specificity_pressure
  // already aggregates competition proximity via Math.max upstream, so
  // sharing the source here is architecturally consistent.
  const severity = Math.min(100, Math.max(60, Math.round(60 + pressure * 40)));

  return [
    createConstraintSignal("competition", "specificity_pressure", severity, {
      specificity_pressure: Math.min(1, Math.max(0, pressure)),
      protected_quality: "competition_specificity",
      notes: ["Strategic specificity pressure from mesocycle execution layer"],
    }),
  ];
}

function interventionToSignals(intervention: InterventionDecision): ConstraintSignal[] {
  const signals: ConstraintSignal[] = [];

  // Safety-rejected interventions → block by exercise ID
  const safetyRejected = intervention.rejected_interventions.filter(r =>
    /cns|coordination|fatigue|competition/i.test(r.reason) &&
    r.intervention.cns_cost > 60
  );

  if (safetyRejected.length > 0) {
    signals.push(createConstraintSignal("intervention", "exercise_block", 85, {
      target_exercises: safetyRejected.map(r => r.intervention.exercise_id),
      protected_quality: "cns_recovery",
    }));
  }

  return signals;
}

// ────────────────────────────────────────────────────────────
// Main bridge function
// ────────────────────────────────────────────────────────────

export function buildArbitrationFromEngines(input: BridgeInput): ArbitrationDecision {
  const signals: ConstraintSignal[] = [
    ...recoveryToSignals(input.recovery),
    ...microcycleToSignals(input.microcycle, input.athlete_context?.competition_in_days),
    ...mesocycleToSignals(input.mesocycle),
    ...priorityToSignals(input.priority),
    ...interventionToSignals(input.intervention),
  ];

  return arbitrateConstraints({
    constraint_signals: signals,
    athlete_context: input.athlete_context,
  });
}