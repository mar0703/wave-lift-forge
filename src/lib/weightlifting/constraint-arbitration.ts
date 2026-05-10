// ─────────────────────────────────────────────────────────────────────────────
// CONSTRAINT ARBITRATION FOUNDATION - Olympic Weightlifting Constraint Resolution
//
// Purpose:
// - Resolve conflicting constraint signals from multiple engines
// - Prioritize constraints like a real coach (not blindly equal weighting)
// - Enable precision blocking instead of broad family blocking
// - Create foundation for realistic coaching decisions
//
// This engine does NOT generate workouts. It only arbitrates constraints.
// ─────────────────────────────────────────────────────────────────────────────

import type { ExerciseStressProfile, StressClass, ComplexityLevel } from "./exercise-stress-taxonomy";

// ────────────────────────────────────────────────────────────
// 1. CONSTRAINT SIGNAL TYPES
// ────────────────────────────────────────────────────────────

export type ConstraintSource =
  | "recovery"      // Recovery domain engine signals
  | "microcycle"    // Microcycle stress analysis
  | "priority"      // Daily priority requirements
  | "intervention"  // Intervention safety requirements
  | "competition";  // Competition proximity signals

export type ConstraintType =
  | "intensity_ceiling"      // Max % 1RM allowed
  | "complexity_ceiling"     // Max complexity level allowed
  | "cns_load_ceiling"       // Max CNS load allowed
  | "exercise_block"         // Specific exercise blocking
  | "family_block"           // Exercise family blocking
  | "stress_class_block"     // Stress class blocking
  | "volume_reduction"       // Volume multiplier reduction
  | "restoration_bias"       // Favor restoration exercises
  | "specificity_pressure"   // Favor competition-specific work
  | "intervention_bias";     // Favor specific interventions

export interface ConstraintSignal {
  source: ConstraintSource;
  constraint_type: ConstraintType;

  // Signal strength (0–100)
  severity: number;

  // What quality is being protected?
  protected_quality?: string; // e.g., "technical_coordination", "cns_recovery", "competition_specificity"

  // Specific targets (if applicable)
  target_exercises?: string[];     // Specific exercise IDs
  target_families?: string[];      // Exercise families
  target_stress_classes?: StressClass[]; // Stress classes
  target_complexity_max?: ComplexityLevel;

  // Constraint values
  intensity_ceiling?: number;
  complexity_ceiling?: ComplexityLevel;
  cns_load_ceiling?: number;
  volume_multiplier?: number;
  restoration_bias?: number;
  specificity_pressure?: number;

  // Context
  notes?: string[];
  expires_at?: Date; // For temporary constraints
}

// ────────────────────────────────────────────────────────────
// 2. ARBITRATION DECISION
// ────────────────────────────────────────────────────────────

export interface ArbitrationDecision {
  // Final resolved constraints
  final_intensity_ceiling: number;
  final_complexity_ceiling: ComplexityLevel;
  final_cns_load_ceiling: number;
  final_volume_multiplier: number;
  final_restoration_bias: number;
  final_specificity_pressure: number;

  // Precision blocking (instead of broad family blocking)
  blocked_exercises: Set<string>;        // Specific exercise IDs
  blocked_stress_classes: Set<StressClass>; // Stress classes to avoid
  protected_stress_classes: Set<StressClass>; // Stress classes to protect

  // Prioritization results
  protected_priorities: string[];        // Which priorities were protected
  reduced_priorities: string[];          // Which priorities were reduced
  ignored_constraints: string[];         // Which constraints were ignored

  // Arbitration metadata
  final_severity: number;                // Overall constraint severity
  arbitration_notes: string[];           // Why decisions were made
  dominant_sources: ConstraintSource[];  // Which sources drove the decision
}

// ────────────────────────────────────────────────────────────
// 3. ARBITRATION PRIORITY RULES
// ────────────────────────────────────────────────────────────

/**
 * CONSTRAINT PRIORITY HIERARCHY
 *
 * Higher priority constraints override lower priority ones.
 * This models how a real coach would prioritize safety over specificity.
 */
const CONSTRAINT_PRIORITY: Record<ConstraintSource, number> = {
  recovery: 100,      // Safety first - recovery degradation is critical
  intervention: 90,   // Safety second - intervention safety requirements
  microcycle: 70,     // Planning - rolling stress analysis
  competition: 50,    // Timing - competition proximity
  priority: 40,       // Preferences - daily focus areas
};

/**
 * QUALITY PROTECTION PRIORITIES
 *
 * Some qualities are more critical to protect than others.
 * Technical coordination collapse is worse than moderate fatigue.
 */
const QUALITY_PRIORITY: Record<string, number> = {
  technical_coordination: 100,  // Coordination is fundamental
  cns_recovery: 95,             // Neural recovery is critical
  overhead_integrity: 90,       // Shoulder health is priority
  speed_freshness: 85,          // Speed qualities recover slowly
  competition_specificity: 70,  // Important but not critical
  general_fatigue: 60,          // Moderate fatigue can be managed
  planned_overload: 50,         // Intentional overload is acceptable
  volume_accumulation: 40,      // Volume can be adjusted
  preference_alignment: 20,     // Preferences are flexible
};

// ────────────────────────────────────────────────────────────
// 4. ARBITRATION LOGIC
// ────────────────────────────────────────────────────────────

export interface ArbitrationInput {
  constraint_signals: ConstraintSignal[];
  athlete_context?: {
    competition_in_days?: number;
    training_phase?: "accumulation" | "intensification" | "peak";
    readiness?: number;
    fatigue?: number;
  };
}

export function arbitrateConstraints(input: ArbitrationInput): ArbitrationDecision {
  const { constraint_signals, athlete_context } = input;
  const notes: string[] = [];

  // 1. Group signals by type and source
  const signalsByType = constraint_signals.reduce((acc, signal) => {
    if (!acc[signal.constraint_type]) acc[signal.constraint_type] = [];
    acc[signal.constraint_type].push(signal);
    return acc;
  }, {} as Record<ConstraintType, ConstraintSignal[]>);

  // 2. Resolve each constraint type through arbitration
  const resolvedConstraints = {
    intensity_ceiling: arbitrateIntensityCeiling(signalsByType.intensity_ceiling || [], notes),
    complexity_ceiling: arbitrateComplexityCeiling(signalsByType.complexity_ceiling || [], notes),
    cns_load_ceiling: arbitrateCNSLoadCeiling(signalsByType.cns_load_ceiling || [], notes),
    volume_multiplier: arbitrateVolumeMultiplier(signalsByType.volume_reduction || [], notes),
    restoration_bias: arbitrateRestorationBias(signalsByType.restoration_bias || [], notes),
    specificity_pressure: arbitrateSpecificityPressure(signalsByType.specificity_pressure || [], notes),
  };

  // 3. Resolve blocking constraints
  const blockingResult = arbitrateBlockingConstraints(
    signalsByType.exercise_block || [],
    signalsByType.family_block || [],
    signalsByType.stress_class_block || [],
    notes
  );

  // 4. Calculate overall severity and dominant sources
  const { final_severity, dominant_sources } = calculateOverallSeverity(constraint_signals);

  // 5. Generate prioritization analysis
  const prioritization = analyzePrioritization(constraint_signals, notes);

  return {
    // Final resolved values
    final_intensity_ceiling: resolvedConstraints.intensity_ceiling,
    final_complexity_ceiling: resolvedConstraints.complexity_ceiling,
    final_cns_load_ceiling: resolvedConstraints.cns_load_ceiling,
    final_volume_multiplier: resolvedConstraints.volume_multiplier,
    final_restoration_bias: resolvedConstraints.restoration_bias,
    final_specificity_pressure: resolvedConstraints.specificity_pressure,

    // Precision blocking
    blocked_exercises: blockingResult.blocked_exercises,
    blocked_stress_classes: blockingResult.blocked_stress_classes,
    protected_stress_classes: blockingResult.protected_stress_classes,

    // Prioritization results
    protected_priorities: prioritization.protected,
    reduced_priorities: prioritization.reduced,
    ignored_constraints: prioritization.ignored,

    // Metadata
    final_severity,
    arbitration_notes: notes,
    dominant_sources,
  };
}

// ────────────────────────────────────────────────────────────
// 5. INDIVIDUAL CONSTRAINT ARBITRATION FUNCTIONS
// ────────────────────────────────────────────────────────────

function arbitrateIntensityCeiling(signals: ConstraintSignal[], notes: string[]): number {
  if (signals.length === 0) return 100;

  // Sort by priority (highest first) then by severity
  const sorted = signals.sort((a, b) => {
    const priorityDiff = CONSTRAINT_PRIORITY[b.source] - CONSTRAINT_PRIORITY[a.source];
    if (priorityDiff !== 0) return priorityDiff;
    return b.severity - a.severity;
  });

  // Take the most restrictive (lowest) value from highest priority signals
  const highestPriority = CONSTRAINT_PRIORITY[sorted[0].source];
  const topPrioritySignals = sorted.filter(s => CONSTRAINT_PRIORITY[s.source] === highestPriority);

  const finalCeiling = Math.min(...topPrioritySignals.map(s => s.intensity_ceiling || 100));

  if (finalCeiling < 100) {
    notes.push(
      `Intensity ceiling set to ${finalCeiling}% by ${topPrioritySignals[0].source} ` +
      `(${topPrioritySignals[0].protected_quality || 'general constraint'})`
    );
  }

  return finalCeiling;
}

function arbitrateComplexityCeiling(signals: ConstraintSignal[], notes: string[]): ComplexityLevel {
  if (signals.length === 0) return 10;

  // Technical coordination protection overrides everything
  const coordinationSignals = signals.filter(s =>
    s.protected_quality === "technical_coordination" && s.severity >= 70
  );

  if (coordinationSignals.length > 0) {
    const ceiling = Math.min(...coordinationSignals.map(s => s.target_complexity_max || 10)) as ComplexityLevel;
    notes.push(`Complexity ceiling set to ${ceiling} due to coordination protection`);
    return ceiling;
  }

  // Otherwise, take most restrictive from highest priority
  const sorted = signals.sort((a, b) => {
    const priorityDiff = CONSTRAINT_PRIORITY[b.source] - CONSTRAINT_PRIORITY[a.source];
    if (priorityDiff !== 0) return priorityDiff;
    return b.severity - a.severity;
  });

  const highestPriority = CONSTRAINT_PRIORITY[sorted[0].source];
  const topPrioritySignals = sorted.filter(s => CONSTRAINT_PRIORITY[s.source] === highestPriority);

  const finalCeiling = Math.min(...topPrioritySignals.map(s => s.target_complexity_max || 10)) as ComplexityLevel;

  if (finalCeiling < 10) {
    notes.push(
      `Complexity ceiling set to ${finalCeiling} by ${topPrioritySignals[0].source} ` +
      `(${topPrioritySignals[0].protected_quality || 'general constraint'})`
    );
  }

  return finalCeiling;
}

function arbitrateCNSLoadCeiling(signals: ConstraintSignal[], notes: string[]): number {
  if (signals.length === 0) return 100;

  // Recovery protection is absolute for CNS
  const recoverySignals = signals.filter(s => s.source === "recovery" && s.severity >= 60);

  if (recoverySignals.length > 0) {
    const ceiling = Math.min(...recoverySignals.map(s => s.cns_load_ceiling || 100));
    notes.push(`CNS ceiling set to ${ceiling} by recovery protection`);
    return ceiling;
  }

  // Otherwise, standard arbitration
  const sorted = signals.sort((a, b) => {
    const priorityDiff = CONSTRAINT_PRIORITY[b.source] - CONSTRAINT_PRIORITY[a.source];
    if (priorityDiff !== 0) return priorityDiff;
    return b.severity - a.severity;
  });

  const finalCeiling = Math.min(...sorted.slice(0, 2).map(s => s.cns_load_ceiling || 100)); // Top 2

  if (finalCeiling < 100) {
    notes.push(`CNS ceiling set to ${finalCeiling} by ${sorted[0].source}`);
  }

  return finalCeiling;
}

function arbitrateVolumeMultiplier(signals: ConstraintSignal[], notes: string[]): number {
  if (signals.length === 0) return 1.0;

  // Volume reductions are additive (most restrictive wins)
  const reductions = signals.map(s => s.volume_multiplier || 1.0);
  const finalMultiplier = Math.min(...reductions);

  if (finalMultiplier < 1.0) {
    const strongestSignal = signals.find(s => s.volume_multiplier === finalMultiplier);
    notes.push(
      `Volume multiplier set to ${finalMultiplier} by ${strongestSignal?.source} ` +
      `(${strongestSignal?.protected_quality || 'volume constraint'})`
    );
  }

  return finalMultiplier;
}

function arbitrateRestorationBias(signals: ConstraintSignal[], notes: string[]): number {
  if (signals.length === 0) return 0;

  // MAX, not SUM. Three moderate signals (0.3 each) ≠ one critical signal (0.9).
  // Strongest single source drives the decision — coach logic, not arithmetic.
  const finalBias = Math.min(
    1.0,
    Math.max(...signals.map(s => s.restoration_bias || 0))
  );

  if (finalBias > 0) {
    // Deterministic stabilization: secondary comparator by source for equal restoration_bias.
    const strongest = signals
      .filter(s => (s.restoration_bias || 0) > 0)
      .sort((a, b) => {
        const biasDiff = (b.restoration_bias || 0) - (a.restoration_bias || 0);
        if (biasDiff !== 0) return biasDiff;
        // Stable tie-breaker: lexical order by source (deterministic, semantically neutral)
        return a.source.localeCompare(b.source);
      })[0];

    notes.push(
      `Restoration bias: ${(finalBias * 100).toFixed(0)}% — driven by ${strongest.source}` +
      (strongest.protected_quality ? ` (${strongest.protected_quality})` : "")
    );
  }

  return finalBias;
}

function arbitrateSpecificityPressure(signals: ConstraintSignal[], notes: string[]): number {
  if (signals.length === 0) return 0;

  // Competition specificity can override moderate fatigue
  const competitionSignals = signals.filter(s =>
    s.source === "competition" && s.severity >= 60
  );

  if (competitionSignals.length > 0) {
    const pressure = Math.max(...competitionSignals.map(s => s.specificity_pressure || 0));
    notes.push(`Specificity pressure set to ${(pressure * 100).toFixed(0)}% by competition proximity`);
    return pressure;
  }

  // Otherwise, standard arbitration
  const totalPressure = signals.reduce((sum, s) => sum + (s.specificity_pressure || 0), 0);
  const finalPressure = Math.min(1.0, totalPressure);

  if (finalPressure > 0) {
    notes.push(`Specificity pressure set to ${(finalPressure * 100).toFixed(0)}%`);
  }

  return finalPressure;
}

function arbitrateBlockingConstraints(
  exerciseBlocks: ConstraintSignal[],
  familyBlocks: ConstraintSignal[],
  stressClassBlocks: ConstraintSignal[],
  notes: string[]
): {
  blocked_exercises: Set<string>;
  blocked_stress_classes: Set<StressClass>;
  protected_stress_classes: Set<StressClass>;
} {
  const blocked_exercises = new Set<string>();
  const blocked_stress_classes = new Set<StressClass>();
  const protected_stress_classes = new Set<StressClass>();

  // Exercise blocking - highest priority wins
  if (exerciseBlocks.length > 0) {
    const sorted = exerciseBlocks.sort((a, b) => {
      const priorityDiff = CONSTRAINT_PRIORITY[b.source] - CONSTRAINT_PRIORITY[a.source];
      if (priorityDiff !== 0) return priorityDiff;
      return b.severity - a.severity;
    });

    for (const signal of sorted.slice(0, 3)) { // Top 3 highest priority
      if (signal.target_exercises) {
        signal.target_exercises.forEach(id => blocked_exercises.add(id));
        notes.push(
          `Exercises blocked by ${signal.source}: ${signal.target_exercises.join(", ")}`
        );
      }
    }
  }

  // Stress class blocking - precision over broad blocking
  if (stressClassBlocks.length > 0) {
    const sorted = stressClassBlocks.sort((a, b) => {
      const priorityDiff = CONSTRAINT_PRIORITY[b.source] - CONSTRAINT_PRIORITY[a.source];
      if (priorityDiff !== 0) return priorityDiff;
      return b.severity - a.severity;
    });

    // Recovery protection creates protected classes
    const recoveryProtection = sorted.find(s =>
      s.source === "recovery" && s.severity >= 70 && s.target_stress_classes
    );

    if (recoveryProtection?.target_stress_classes) {
      recoveryProtection.target_stress_classes.forEach(cls => protected_stress_classes.add(cls));
      notes.push(
        `Stress classes protected by recovery: ${recoveryProtection.target_stress_classes.join(", ")}`
      );
    }

    // High priority blocking
    const highPriorityBlocks = sorted.filter(s => CONSTRAINT_PRIORITY[s.source] >= 80);
    for (const signal of highPriorityBlocks) {
      if (signal.target_stress_classes) {
        signal.target_stress_classes.forEach(cls => blocked_stress_classes.add(cls));
        notes.push(
          `Stress classes blocked by ${signal.source}: ${signal.target_stress_classes.join(", ")}`
        );
      }
    }
  }

  return {
    blocked_exercises,
    blocked_stress_classes,
    protected_stress_classes,
  };
}

// ────────────────────────────────────────────────────────────
// 6. META ANALYSIS FUNCTIONS
// ────────────────────────────────────────────────────────────

function calculateOverallSeverity(signals: ConstraintSignal[]): {
  final_severity: number;
  dominant_sources: ConstraintSource[];
} {
  if (signals.length === 0) {
    return { final_severity: 0, dominant_sources: [] };
  }

  // Weight severity by source priority
  const weightedSeverities = signals.map(signal => ({
    source: signal.source,
    weighted_severity: signal.severity * (CONSTRAINT_PRIORITY[signal.source] / 100),
  }));

  const final_severity = Math.min(100, weightedSeverities.reduce((sum, s) => sum + s.weighted_severity, 0));

  // Find dominant sources (those contributing >20% of total weighted severity)
  const totalWeighted = weightedSeverities.reduce((sum, s) => sum + s.weighted_severity, 0);
  const dominant_sources = weightedSeverities
    .filter(s => s.weighted_severity / totalWeighted > 0.2)
    .map(s => s.source);

  return { final_severity, dominant_sources };
}

function analyzePrioritization(signals: ConstraintSignal[], notes: string[]): {
  protected: string[];
  reduced: string[];
  ignored: string[];
} {
  const protected_priorities: string[] = [];
  const reduced_priorities: string[] = [];
  const ignored_constraints: string[] = [];

  // Analyze which priorities were protected vs reduced
  const qualitySignals = signals.filter(s => s.protected_quality);

  for (const signal of qualitySignals) {
    const quality = signal.protected_quality!;
    const priority = QUALITY_PRIORITY[quality] || 50;

    if (signal.severity >= 70 && priority >= 80) {
      protected_priorities.push(`${quality} (${signal.source})`);
    } else if (signal.severity >= 50 && priority >= 60) {
      reduced_priorities.push(`${quality} (${signal.source})`);
    } else {
      ignored_constraints.push(`${quality} constraint from ${signal.source} (low priority/severity)`);
    }
  }

  // Add analysis notes
  if (protected_priorities.length > 0) {
    notes.push(`Protected priorities: ${protected_priorities.join(", ")}`);
  }
  if (reduced_priorities.length > 0) {
    notes.push(`Reduced priorities: ${reduced_priorities.join(", ")}`);
  }
  if (ignored_constraints.length > 0) {
    notes.push(`Ignored constraints: ${ignored_constraints.slice(0, 2).join(", ")}`);
  }

  return {
    protected: protected_priorities,
    reduced: reduced_priorities,
    ignored: ignored_constraints,
  };
}

// ────────────────────────────────────────────────────────────
// 7. UTILITY FUNCTIONS
// ────────────────────────────────────────────────────────────

export function createConstraintSignal(
  source: ConstraintSource,
  type: ConstraintType,
  severity: number,
  options: Partial<Omit<ConstraintSignal, "source" | "constraint_type" | "severity">> = {}
): ConstraintSignal {
  return {
    source,
    constraint_type: type,
    severity,
    ...options,
  };
}

export function validateArbitrationDecision(decision: ArbitrationDecision): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Validate ranges
  if (decision.final_intensity_ceiling < 50 || decision.final_intensity_ceiling > 100) {
    issues.push(`Invalid intensity ceiling: ${decision.final_intensity_ceiling}`);
  }
  if (decision.final_complexity_ceiling < 1 || decision.final_complexity_ceiling > 10) {
    issues.push(`Invalid complexity ceiling: ${decision.final_complexity_ceiling}`);
  }
  if (decision.final_cns_load_ceiling < 0 || decision.final_cns_load_ceiling > 100) {
    issues.push(`Invalid CNS ceiling: ${decision.final_cns_load_ceiling}`);
  }
  if (decision.final_volume_multiplier < 0.5 || decision.final_volume_multiplier > 1.5) {
    issues.push(`Invalid volume multiplier: ${decision.final_volume_multiplier}`);
  }
  if (decision.final_restoration_bias < 0 || decision.final_restoration_bias > 1) {
    issues.push(`Invalid restoration bias: ${decision.final_restoration_bias}`);
  }
  if (decision.final_specificity_pressure < 0 || decision.final_specificity_pressure > 1) {
    issues.push(`Invalid specificity pressure: ${decision.final_specificity_pressure}`);
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}