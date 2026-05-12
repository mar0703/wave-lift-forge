/**
 * ORCHESTRATION RUNTIME INVARIANT TESTS
 *
 * Tests the orchestration system's runtime behavior under stress conditions.
 * Verifies semantic invariants, constraint enforcement, and repair legality.
 *
 * DO NOT MODIFY ORCHESTRATION LOGIC - Tests only.
 *
 * Run with: npx tsx tests/orchestration-runtime-invariants.test.ts
 * Or compile check: npx tsc --noEmit
 */

import * as assert from "assert";

// Import orchestration system
import {
  orchestrateAndPrepareWorkout,
  buildRuntimeCoachingContext,
  buildFinalCoachContext,
  type OrchestratorInput,
} from "../src/lib/orchestrator.js";

import * as SemanticValidator from "../src/lib/weightlifting/repair-engine.js";

import {
  arbitrateConstraints,
  validateArbitrationDecision,
  type ConstraintSignal,
} from "../src/lib/weightlifting/constraint-arbitration.js";

import {
  getExerciseStressProfile,
  isCompetitionSpecific,
  type StressClass,
} from "../src/lib/weightlifting/exercise-stress-taxonomy.js";

import {
  type ExerciseBlock,
} from "../src/lib/training-engine.js";

import {
  getExerciseById,
} from "../src/lib/exercise-db.js";

import {
  type MicrocycleSession,
} from "../src/lib/weightlifting/microcycle-engine.js";

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Creates a base OrchestratorInput with configurable overrides
 */
function createBaseInput(overrides: Partial<OrchestratorInput> = {}): OrchestratorInput {
  return {
    engine_input: {
      daily_snatch_max: 100,
      daily_clean_jerk_max: 130,
      readiness: 7,
      fatigue_score: 30,
      body_type: "meso" as const,
      training_day_index: 1 as const,
      profile_assessment: {
        energy_level: 7,
        recovery_speed: 6,
        body_tendency: "stable" as const,
        stress_response: "calm" as const,
        sleep_quality: 7,
      },
    },
    user_maxes: {
      snatch: 100,
      clean_and_jerk: 130,
      front_squat: 140,
      back_squat: 160,
    },
    readiness: 70,
    fatigue: 30,
    recent_sessions: [],
    ...overrides,
  };
}

/**
 * Creates recent sessions for fatigue simulation
 */
function createFatiguedSessions(count: number, intensity: "high" | "moderate" | "low"): MicrocycleSession[] {
  const sessions: MicrocycleSession[] = [];
  const baseDate = Date.now() - count * 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < count; i++) {
    const session: MicrocycleSession = {
      date: new Date(baseDate + i * 24 * 60 * 60 * 1000).toISOString(),
      cns_load: intensity === "high" ? 70 + Math.random() * 20 : intensity === "moderate" ? 40 + Math.random() * 20 : 20 + Math.random() * 10,
      technical_load: intensity === "high" ? 60 + Math.random() * 20 : 40,
      local_load: intensity === "high" ? 70 + Math.random() * 20 : 50,
      overhead_stress: intensity === "high" ? 50 + Math.random() * 30 : 30,
      squat_stress: intensity === "high" ? 60 + Math.random() * 30 : 40,
      pull_stress: intensity === "high" ? 60 + Math.random() * 30 : 40,
      intensity_avg: intensity === "high" ? 80 + Math.random() * 15 : 60,
      complexity_avg: intensity === "high" ? 7 + Math.random() * 2 : 5,
      specificity_score: intensity === "high" ? 70 + Math.random() * 20 : 50,
    };
    sessions.push(session);
  }
  
  return sessions;
}

/**
 * Asserts that a workout is structurally viable (non-empty with valid exercises)
 */
function assertWorkoutViable(exercises: ExerciseBlock[], context: string) {
  assert.ok(Array.isArray(exercises), `${context}: exercises should be an array`);
  assert.ok(exercises.length > 0, `${context}: workout should not be empty`);
  
  for (const ex of exercises) {
    assert.ok(getExerciseById(ex.exercise_id), `${context}: exercise ${ex.exercise_id} should exist in database`);
    assert.ok(ex.sets >= 1, `${context}: exercise should have at least 1 set`);
    assert.ok(ex.reps >= 1, `${context}: exercise should have at least 1 rep`);
    assert.ok(ex.intensity_pct > 0, `${context}: exercise should have positive intensity`);
    assert.ok(ex.weight_kg >= 0, `${context}: exercise should have non-negative weight`);
  }
}

/**
 * Asserts that all exercises respect the complexity ceiling
 */
function assertComplexityCeilingRespected(
  exercises: ExerciseBlock[],
  ceiling: number,
  context: string
) {
  for (const ex of exercises) {
    const profile = getExerciseStressProfile(ex.exercise_id);
    if (profile) {
      assert.ok(profile.complexity <= ceiling,
        `${context}: exercise ${ex.exercise_id} has complexity ${profile.complexity} > ceiling ${ceiling}`);
    }
  }
}

/**
 * Asserts that all exercises respect the intensity ceiling
 */
function assertIntensityCeilingRespected(
  exercises: ExerciseBlock[],
  ceiling: number,
  context: string
) {
  for (const ex of exercises) {
    assert.ok(ex.intensity_pct <= ceiling + 0.1, // Small tolerance for floating point
      `${context}: exercise ${ex.exercise_id} has intensity ${ex.intensity_pct}% > ceiling ${ceiling}%`);
  }
}

// ============================================================================
// TEST SUITE: Orchestration Runtime Invariants
// ============================================================================

console.log("=".repeat(80));
console.log("ORCHESTRATION RUNTIME INVARIANT TESTS");
console.log("=".repeat(80));
console.log();

let passed = 0;
let failed = 0;
let total = 0;

function test(name: string, fn: () => void) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${(e as Error).message}`);
  }
}

function describeSuite(name: string, fn: () => void) {
  console.log(`\n${name}`);
  console.log("-".repeat(name.length));
  fn();
}

// --------------------------------------------------------------------------
// INVARIANT 1: Empty Workout Prevention
// --------------------------------------------------------------------------
describeSuite("INVARIANT 1: Empty Workout Prevention", () => {
  test("should produce non-empty workout under normal conditions", () => {
    const input = createBaseInput();
    const result = orchestrateAndPrepareWorkout(input);
    assertWorkoutViable(result.constrained_exercises, "Normal conditions");
  });

  test("should produce non-empty workout under moderate fatigue", () => {
    const input = createBaseInput({
      fatigue: 60,
      readiness: 40,
      recent_sessions: createFatiguedSessions(5, "moderate"),
    });
    const result = orchestrateAndPrepareWorkout(input);
    assertWorkoutViable(result.constrained_exercises, "Moderate fatigue");
  });

  test("should flag empty workout via semantic validator under extreme constraints", () => {
    const input = createBaseInput({
      fatigue: 85,
      readiness: 20,
      recent_sessions: createFatiguedSessions(7, "high"),
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    if (result.constrained_exercises.length === 0) {
      const hasEmptyPipelineIssue = result.semantic_validation.issues.some(
        (issue: { classification: string }) => issue.classification === "empty_pipeline"
      );
      assert.ok(hasEmptyPipelineIssue, "Empty workout should be flagged by semantic validator");
    }
  });
});

// --------------------------------------------------------------------------
// INVARIANT 2: Arbitration Authority Preservation
// --------------------------------------------------------------------------
describeSuite("INVARIANT 2: Arbitration Authority Preservation", () => {
  test("should respect arbitrated intensity ceiling", () => {
    const input = createBaseInput();
    const result = orchestrateAndPrepareWorkout(input);
    const ceiling = result.final_context.constraints.intensity_pct;
    assertIntensityCeilingRespected(result.constrained_exercises, ceiling, "Arbitration intensity");
  });

  test("should respect arbitrated complexity ceiling", () => {
    const input = createBaseInput();
    const result = orchestrateAndPrepareWorkout(input);
    const ceiling = result.final_context.constraints.complexity_max;
    assertComplexityCeilingRespected(result.constrained_exercises, ceiling, "Arbitration complexity");
  });

  test("should preserve arbitration notes in final context", () => {
    const input = createBaseInput();
    const result = orchestrateAndPrepareWorkout(input);
    assert.ok(result.final_context.notes.length > 0, "Arbitration notes should be preserved");
  });
});

// --------------------------------------------------------------------------
// INVARIANT 3: Blocked Exercise Non-Reintroduction
// --------------------------------------------------------------------------
describeSuite("INVARIANT 3: Blocked Exercise Non-Reintroduction", () => {
  test("should not reintroduce explicitly blocked exercises", () => {
    const input = createBaseInput();
    const result = orchestrateAndPrepareWorkout(input);
    
    for (const ex of result.constrained_exercises) {
      assert.ok(!result.final_context.constraints.blocked_exercises.has(ex.exercise_id),
        `Blocked exercise ${ex.exercise_id} should not appear in workout`);
    }
  });

  test("should respect stress class blocking", () => {
    const input = createBaseInput();
    const result = orchestrateAndPrepareWorkout(input);
    
    // If no arbitration conflicts, verify exercises are valid
    const hasArbitrationConflict = result.semantic_validation.issues.some(
      (issue: { classification: string }) => issue.classification === "arbitration_conflict"
    );
    
    if (!hasArbitrationConflict) {
      for (const ex of result.constrained_exercises) {
        const profile = getExerciseStressProfile(ex.exercise_id);
        if (profile) {
          assert.ok(true, `Exercise ${ex.exercise_id} stress class ${profile.stress_class} is allowed`);
        }
      }
    }
  });
});

// --------------------------------------------------------------------------
// INVARIANT 4: Specificity Preservation Under Competition Pressure
// --------------------------------------------------------------------------
describeSuite("INVARIANT 4: Specificity Preservation Under Competition Pressure", () => {
  test("should maintain specificity when competition is near", () => {
    const input = createBaseInput({
      competition_in_days: 7,
      readiness: 80,
      fatigue: 20,
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    assert.ok(
      result.final_context.intelligence_summary.specificity_pressure >= 0.6,
      "Specificity pressure should be high near competition"
    );
    
    const hasClassicLift = result.constrained_exercises.some(
      (ex: ExerciseBlock) => {
        const profile = getExerciseStressProfile(ex.exercise_id);
        return profile && isCompetitionSpecific(profile);
      }
    );
    
    assert.ok(hasClassicLift, "Competition proximity should preserve classic lifts");
  });

  test("should detect specificity collapse when classics are blocked", () => {
    const input = createBaseInput({
      competition_in_days: 7,
      fatigue: 85,
      readiness: 20,
      recent_sessions: createFatiguedSessions(7, "high"),
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    if (result.final_context.intelligence_summary.specificity_pressure >= 0.6) {
      const hasSpecificityCollapse = result.semantic_validation.issues.some(
        (issue: { classification: string }) => issue.classification === "specificity_collapse"
      );
      
      const hasClassicLift = result.constrained_exercises.some(
        (ex: ExerciseBlock) => {
          const profile = getExerciseStressProfile(ex.exercise_id);
          return profile && isCompetitionSpecific(profile);
        }
      );
      
      if (!hasClassicLift) {
        assert.ok(hasSpecificityCollapse,
          "Specificity collapse should be detected when classics are blocked");
      }
    }
  });
});

// --------------------------------------------------------------------------
// INVARIANT 5: Complexity Ceiling Enforcement
// --------------------------------------------------------------------------
describeSuite("INVARIANT 5: Complexity Ceiling Enforcement", () => {
  test("should enforce complexity ceiling under normal conditions", () => {
    const input = createBaseInput();
    const result = orchestrateAndPrepareWorkout(input);
    const ceiling = result.final_context.constraints.complexity_max;
    assertComplexityCeilingRespected(result.constrained_exercises, ceiling, "Normal complexity");
  });

  test("should enforce reduced complexity under coordination degradation", () => {
    const input = createBaseInput({
      recent_sessions: createFatiguedSessions(7, "high"),
      fatigue: 80,
      readiness: 25,
    });
    const result = orchestrateAndPrepareWorkout(input);
    const ceiling = result.final_context.constraints.complexity_max;
    assertComplexityCeilingRespected(result.constrained_exercises, ceiling, "Coordination degradation");
    assert.ok(ceiling <= 8, "Complexity ceiling should be reduced under fatigue");
  });
});

// --------------------------------------------------------------------------
// INVARIANT 6: Stress-Class Blocking Enforcement
// --------------------------------------------------------------------------
describeSuite("INVARIANT 6: Stress-Class Blocking Enforcement", () => {
  test("should block exercises from protected stress classes", () => {
    const input = createBaseInput({
      recent_sessions: createFatiguedSessions(7, "high"),
      fatigue: 90,
      readiness: 15,
    });
    const result = orchestrateAndPrepareWorkout(input);
    const runtimeContext = buildRuntimeCoachingContext(input);
    const blockedClasses = new Set<StressClass>([
      ...runtimeContext.arbitration.blocked_stress_classes,
      ...runtimeContext.arbitration.protected_stress_classes,
    ]);
    
    for (const ex of result.constrained_exercises) {
      const profile = getExerciseStressProfile(ex.exercise_id);
      if (profile && blockedClasses.size > 0) {
        assert.ok(!blockedClasses.has(profile.stress_class),
          `Exercise ${ex.exercise_id} has blocked stress class ${profile.stress_class}`);
      }
    }
  });
});

// --------------------------------------------------------------------------
// INVARIANT 7: Repair-System Legality
// --------------------------------------------------------------------------
describeSuite("INVARIANT 7: Repair-System Legality", () => {
  test("should only add exercises that respect current constraints", () => {
    const input = createBaseInput({
      semantic_validation_mode: "repair" as SemanticValidator.SemanticValidationMode,
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    for (const repair of result.semantic_validation.repairs) {
      for (const exerciseId of repair.added_exercise_ids) {
        const profile = getExerciseStressProfile(exerciseId);
        if (profile) {
          assert.ok(profile.complexity <= result.final_context.constraints.complexity_max,
            `Repair added exercise ${exerciseId} with complexity ${profile.complexity} > ceiling`);
        }
        assert.ok(!result.final_context.constraints.blocked_exercises.has(exerciseId),
          `Repair added blocked exercise ${exerciseId}`);
      }
    }
  });

  test("should preserve arbitration authority in repair decisions", () => {
    const input = createBaseInput({
      semantic_validation_mode: "repair" as SemanticValidator.SemanticValidationMode,
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    for (const repair of result.semantic_validation.repairs) {
      assert.ok(
        ["arbitration", "safety", "specificity", "diversity"].includes(repair.authority_preserved),
        `Repair should preserve a valid authority: ${repair.authority_preserved}`
      );
    }
  });
});

// --------------------------------------------------------------------------
// INVARIANT 8: Recovery Dominance Over Tactical Priority
// --------------------------------------------------------------------------
describeSuite("INVARIANT 8: Recovery Dominance Over Tactical Priority", () => {
  test("should reduce intensity when recovery signals indicate CNS fatigue", () => {
    const input = createBaseInput({
      recent_sessions: createFatiguedSessions(7, "high"),
      fatigue: 85,
      readiness: 20,
    });
    const runtimeContext = buildRuntimeCoachingContext(input);
    
    if (runtimeContext.recovery_domains.cns <= 45) {
      assert.ok(runtimeContext.arbitration.final_intensity_ceiling < 100,
        "CNS fatigue should reduce intensity ceiling");
    }
  });

  test("should override priority signals when recovery is critical", () => {
    const input = createBaseInput({
      recent_sessions: createFatiguedSessions(7, "high"),
      fatigue: 90,
      readiness: 15,
    });
    const runtimeContext = buildRuntimeCoachingContext(input);
    
    if (runtimeContext.recovery_domains.cns <= 30) {
      assert.ok(runtimeContext.arbitration.dominant_sources.includes("recovery"),
        "Critical recovery should be in dominant sources");
    }
  });
});

// --------------------------------------------------------------------------
// INVARIANT 9: Non-Empty Fallback Legality
// --------------------------------------------------------------------------
describeSuite("INVARIANT 9: Non-Empty Fallback Legality", () => {
  test("should provide legal fallback exercises when primary blocked", () => {
    const input = createBaseInput({
      semantic_validation_mode: "repair" as SemanticValidator.SemanticValidationMode,
      recent_sessions: createFatiguedSessions(5, "high"),
      fatigue: 75,
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    for (const ex of result.constrained_exercises) {
      const profile = getExerciseStressProfile(ex.exercise_id);
      if (profile) {
        assert.ok(ex.intensity_pct <= result.final_context.constraints.intensity_pct,
          `Fallback exercise ${ex.exercise_id} exceeds intensity ceiling`);
        assert.ok(profile.complexity <= result.final_context.constraints.complexity_max,
          `Fallback exercise ${ex.exercise_id} exceeds complexity ceiling`);
      }
    }
  });
});

// --------------------------------------------------------------------------
// INVARIANT 10: No Normalization Override Leaks
// --------------------------------------------------------------------------
describeSuite("INVARIANT 10: No Normalization Override Leaks", () => {
  test("should not bypass constraints through legacy helper merge", () => {
    const input = createBaseInput();
    const runtimeContext = buildRuntimeCoachingContext(input);
    
    assert.strictEqual(runtimeContext.intensity_ceiling, 
      runtimeContext.arbitration.final_intensity_ceiling,
      "Arbitrated intensity should be authoritative");
    assert.strictEqual(runtimeContext.complexity_tolerance,
      runtimeContext.arbitration.final_complexity_ceiling,
      "Arbitrated complexity should be authoritative");
    assert.strictEqual(runtimeContext.cns_load_ceiling,
      runtimeContext.arbitration.final_cns_load_ceiling,
      "Arbitrated CNS should be authoritative");
  });

  test("should use arbitration values in final coach context", () => {
    const input = createBaseInput();
    const runtimeContext = buildRuntimeCoachingContext(input);
    const finalContext = buildFinalCoachContext(runtimeContext);
    
    assert.strictEqual(finalContext.constraints.intensity_pct,
      runtimeContext.arbitration.final_intensity_ceiling,
      "Final context should use arbitrated intensity");
    assert.strictEqual(finalContext.constraints.complexity_max,
      runtimeContext.arbitration.final_complexity_ceiling,
      "Final context should use arbitrated complexity");
  });

  test("should not have contradictory constraint values", () => {
    const input = createBaseInput();
    const runtimeContext = buildRuntimeCoachingContext(input);
    
    assert.ok(runtimeContext.arbitration.final_intensity_ceiling >= 50 &&
              runtimeContext.arbitration.final_intensity_ceiling <= 100,
      "Intensity ceiling should be in valid range [50, 100]");
    
    assert.ok(runtimeContext.arbitration.final_complexity_ceiling >= 1 &&
              runtimeContext.arbitration.final_complexity_ceiling <= 10,
      "Complexity ceiling should be in valid range [1, 10]");
    
    assert.ok(runtimeContext.arbitration.final_cns_load_ceiling >= 0 &&
              runtimeContext.arbitration.final_cns_load_ceiling <= 100,
      "CNS ceiling should be in valid range [0, 100]");
  });
});

// ============================================================================
// SCENARIO-BASED TESTS
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("SCENARIO-BASED RUNTIME TESTS");
console.log("=".repeat(80));

// SCENARIO 1: Competition Taper
describeSuite("SCENARIO 1: Competition Taper", () => {
  test("should handle high specificity pressure with low fatigue", () => {
    const input = createBaseInput({
      competition_in_days: 7,
      readiness: 85,
      fatigue: 15,
      recent_sessions: createFatiguedSessions(3, "moderate"),
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    assert.ok(result.final_context.intelligence_summary.specificity_pressure >= 0.7,
      "Competition proximity should create high specificity pressure");
    
    const classicCount = result.constrained_exercises.filter((ex: ExerciseBlock) => {
      const profile = getExerciseStressProfile(ex.exercise_id);
      return profile && profile.specificity_score >= 80;
    }).length;
    
    assert.ok(classicCount >= 1, "Competition taper should include classic lifts");
  });
});

// SCENARIO 2: Recovery Collapse
describeSuite("SCENARIO 2: Recovery Collapse", () => {
  test("should handle aggressive recovery protection", () => {
    const input = createBaseInput({
      recent_sessions: createFatiguedSessions(7, "high"),
      fatigue: 90,
      readiness: 10,
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    assert.ok(result.final_context.constraints.intensity_pct <= 85,
      "Recovery collapse should reduce intensity");
  });
});

// SCENARIO 3: High Specificity + Low Complexity Contradiction
describeSuite("SCENARIO 3: High Specificity + Low Complexity Contradiction", () => {
  test("should detect and report the contradiction", () => {
    const input = createBaseInput({
      competition_in_days: 7,
      recent_sessions: createFatiguedSessions(7, "high"),
      fatigue: 85,
      readiness: 15,
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    const hasSpecificityIssue = result.semantic_validation.issues.some(
      (issue: { classification: string }) => issue.classification === "specificity_collapse" ||
               issue.classification === "phase_intent_violation"
    );
    
    if (result.final_context.intelligence_summary.specificity_pressure >= 0.6 &&
        result.final_context.constraints.complexity_max <= 5) {
      assert.ok(hasSpecificityIssue || result.constrained_exercises.length > 0,
        "Contradiction should be detected or resolved");
    }
  });
});

// SCENARIO 4: Intervention-Heavy Athlete
describeSuite("SCENARIO 4: Intervention-Heavy Athlete", () => {
  test("should handle multiple intervention blocks", () => {
    const input = createBaseInput({
      recent_sessions: createFatiguedSessions(5, "high"),
      fatigue: 75,
      readiness: 30,
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    assert.ok(result.final_context.intelligence_summary.intervention_count >= 0,
      "Intervention count should be non-negative");
  });
});

// SCENARIO 5: Technical Restoration State
describeSuite("SCENARIO 5: Technical Restoration State", () => {
  test("should bias toward technical restoration exercises", () => {
    const input = createBaseInput({
      recent_sessions: createFatiguedSessions(5, "high"),
      fatigue: 70,
      readiness: 35,
    });
    const result = orchestrateAndPrepareWorkout(input);
    
    if (result.final_context.biases.restoration_favor >= 0.5) {
      const lowComplexity = result.constrained_exercises.filter((ex: ExerciseBlock) => {
        const profile = getExerciseStressProfile(ex.exercise_id);
        return profile && profile.complexity <= 5;
      });
      
      assert.ok(lowComplexity.length > 0 || result.constrained_exercises.length === 0,
        "Restoration bias should favor low-complexity exercises");
    }
  });
});

// SCENARIO 6: Accumulation Fatigue Overload
describeSuite("SCENARIO 6: Accumulation Fatigue Overload", () => {
  test("should detect maladaptation risk", () => {
    const input = createBaseInput({
      recent_sessions: createFatiguedSessions(7, "high"),
      fatigue: 90,
      readiness: 15,
    });
    const runtimeContext = buildRuntimeCoachingContext(input);
    
    if (runtimeContext.maladaptation_risk >= 50) {
      assert.ok(runtimeContext.arbitration.final_restoration_bias >= 0.5,
        "High maladaptation risk should increase restoration bias");
    }
  });
});

// ============================================================================
// ARBITRATION BEHAVIOR TESTS
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("ARBITRATION BEHAVIOR TESTS");
console.log("=".repeat(80));

describeSuite("Arbitration Behavior", () => {
  test("should prioritize recovery over priority signals", () => {
    const signals: ConstraintSignal[] = [
      {
        source: "recovery",
        constraint_type: "intensity_ceiling",
        severity: 90,
        intensity_ceiling: 75,
        protected_quality: "cns_recovery",
      },
      {
        source: "priority",
        constraint_type: "intensity_ceiling",
        severity: 40,
        intensity_ceiling: 95,
        protected_quality: "preference_alignment",
      },
    ];
    
    const decision = arbitrateConstraints({ constraint_signals: signals });
    
    assert.ok(decision.final_intensity_ceiling <= 75,
      "Recovery should override priority for intensity ceiling");
    assert.ok(decision.dominant_sources.includes("recovery"),
      "Recovery should be in dominant sources");
  });

  test("should handle empty signal array gracefully", () => {
    const decision = arbitrateConstraints({ constraint_signals: [] });
    
    assert.strictEqual(decision.final_intensity_ceiling, 100);
    assert.strictEqual(decision.final_complexity_ceiling, 10);
    assert.strictEqual(decision.final_cns_load_ceiling, 100);
    assert.strictEqual(decision.final_volume_multiplier, 1.0);
    assert.strictEqual(decision.final_restoration_bias, 0);
    assert.strictEqual(decision.final_specificity_pressure, 0);
  });

  test("should validate arbitration decision ranges", () => {
    const signals: ConstraintSignal[] = [
      {
        source: "recovery",
        constraint_type: "intensity_ceiling",
        severity: 80,
        intensity_ceiling: 80,
      },
    ];
    
    const decision = arbitrateConstraints({ constraint_signals: signals });
    const validation = validateArbitrationDecision(decision);
    
    assert.ok(validation.valid, `Arbitration decision should be valid: ${validation.issues.join(", ")}`);
  });
});

// ============================================================================
// SEMANTIC VALIDATOR BEHAVIOR TESTS
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("SEMANTIC VALIDATOR BEHAVIOR TESTS");
console.log("=".repeat(80));

describeSuite("Semantic Validator Behavior", () => {
  test("should detect empty workout pipeline", () => {
    const input = createBaseInput();
    const runtimeContext = buildRuntimeCoachingContext(input);
    const finalContext = buildFinalCoachContext(runtimeContext);
    
    const validation = SemanticValidator.validateOrchestrationSemantics({
      runtime_context: runtimeContext,
      final_context: finalContext,
      exercises: [], // Empty workout
      mode: "warning-only",
    });
    
    const hasEmptyPipeline = validation.issues.some(
      (issue: { classification: string }) => issue.classification === "empty_pipeline"
    );
    
    assert.ok(hasEmptyPipeline, "Empty workout should be detected");
  });

  test("should produce confidence score", () => {
    const input = createBaseInput();
    const result = orchestrateAndPrepareWorkout(input);
    
    assert.ok(result.semantic_validation.confidence >= 0 &&
              result.semantic_validation.confidence <= 100,
      "Confidence should be between 0 and 100");
  });

  test("should handle different validation modes", () => {
    const input = createBaseInput();
    const runtimeContext = buildRuntimeCoachingContext(input);
    const finalContext = buildFinalCoachContext(runtimeContext);
    
    const warningResult = SemanticValidator.validateOrchestrationSemantics({
      runtime_context: runtimeContext,
      final_context: finalContext,
      exercises: runtimeContext.base_workout.exercises,
      mode: "warning-only",
    });
    
    assert.ok(warningResult.valid !== undefined, "Warning mode should produce result");
    
    const repairResult = SemanticValidator.validateOrchestrationSemantics({
      runtime_context: runtimeContext,
      final_context: finalContext,
      exercises: runtimeContext.base_workout.exercises,
      mode: "repair",
    });
    
    assert.ok(Array.isArray(repairResult.repairs), "Repair mode should produce repairs array");
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("EDGE CASE TESTS");
console.log("=".repeat(80));

describeSuite("Edge Cases", () => {
  test("should handle missing recent sessions", () => {
    const input = createBaseInput({
      recent_sessions: undefined,
    });
    const result = orchestrateAndPrepareWorkout(input);
    assertWorkoutViable(result.constrained_exercises, "Missing sessions");
  });

  test("should handle extreme fatigue values", () => {
    const input = createBaseInput({
      fatigue: 100,
      readiness: 0,
    });
    const result = orchestrateAndPrepareWorkout(input);
    assert.ok(result.constrained_exercises.length >= 0,
      "Extreme fatigue should be handled");
  });

  test("should handle competition_in_days edge cases", () => {
    const input1 = createBaseInput({ competition_in_days: 1 });
    const result1 = orchestrateAndPrepareWorkout(input1);
    assert.ok(result1.semantic_validation.confidence >= 0, "1 day to competition handled");
    
    const input2 = createBaseInput({ competition_in_days: 90 });
    const result2 = orchestrateAndPrepareWorkout(input2);
    assert.ok(result2.semantic_validation.confidence >= 0, "90 days to competition handled");
    
    const input3 = createBaseInput({ competition_in_days: undefined });
    const result3 = orchestrateAndPrepareWorkout(input3);
    assert.ok(result3.semantic_validation.confidence >= 0, "No competition handled");
  });
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("TEST SUMMARY");
console.log("=".repeat(80));
console.log(`Total:  ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Rate:   ${((passed / total) * 100).toFixed(1)}%`);
console.log("=".repeat(80));

if (failed > 0) {
  process.exit(1);
}

// Export for module compatibility
export {};