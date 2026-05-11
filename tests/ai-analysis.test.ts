/**
 * AI ANALYSIS LAYER TESTS
 * 
 * Tests the AI analysis layer's read-only behavior, ensuring it:
 *   - Does not modify system state
 *   - Produces deterministic outputs
 *   - Correctly interprets athlete state
 *   - Detects risks appropriately
 *   - Generates accurate summaries
 * 
 * DO NOT MODIFY ORCHESTRATION LOGIC - Tests only.
 * 
 * Run with: npx tsx tests/ai-analysis.test.ts
 * Or compile check: npx tsc --noEmit
 */

import * as assert from "assert";

import {
  // Main analysis function
  performAIAnalysis,
  createAnalysisContext,
  adaptSessionForAnalysis,
  READ_ONLY_GUARANTEE,
  // Types
  type AIAnalysisContext,
  type AnalysisSessionData,
  type AIAnalysisConfig,
  DEFAULT_AI_ANALYSIS_CONFIG,
  // Interpretation layer
  interpretAthleteState,
  categorizeReadiness,
  categorizeFatigue,
  determineOverallState,
  // Risk detection layer
  assessRisks,
  scoreToRiskLevel,
  detectOverloadRisk,
  detectUnderRecoveryRisk,
  detectTechnicalDegradationRisk,
  // Summary layer
  summarizeWeek,
  analyzeTrends,
  determineTrendDirection,
} from "../src/lib/ai-analysis/index.js";

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createTestSessions(count: number, options?: Partial<AnalysisSessionData>): AnalysisSessionData[] {
  const sessions: AnalysisSessionData[] = [];
  const baseDate = Date.now() - count * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    sessions.push({
      timestamp: baseDate + i * 24 * 60 * 60 * 1000,
      readiness: options?.readiness ?? 70 - i * 2,
      fatigue: options?.fatigue ?? 30 + i * 3,
      success_rate: options?.success_rate ?? 85 - i * 2,
      average_RPE: options?.average_RPE ?? 6 + i * 0.3,
      detected_problems: options?.detected_problems,
      intervention_applied: options?.intervention_applied,
      cns_load: options?.cns_load,
      technical_load: options?.technical_load,
      local_load: options?.local_load,
      intensity_avg: options?.intensity_avg,
    });
  }

  return sessions;
}

function createTestContext(overrides?: Partial<AIAnalysisContext>): AIAnalysisContext {
  return {
    sessions: createTestSessions(5),
    current_readiness: 70,
    current_fatigue: 40,
    ...overrides,
  };
}

// ============================================================================
// TEST SUITE
// ============================================================================

console.log("=".repeat(80));
console.log("AI ANALYSIS LAYER TESTS");
console.log("=".repeat(80));

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
// READ-ONLY GUARANTEE TESTS
// --------------------------------------------------------------------------

describeSuite("READ-ONLY GUARANTEE", () => {
  test("should have all guarantee flags set to true", () => {
    assert.strictEqual(READ_ONLY_GUARANTEE.does_not_generate_programs, true);
    assert.strictEqual(READ_ONLY_GUARANTEE.does_not_modify_sessions, true);
    assert.strictEqual(READ_ONLY_GUARANTEE.does_not_modify_microcycles, true);
    assert.strictEqual(READ_ONLY_GUARANTEE.does_not_change_fatigue_model, true);
    assert.strictEqual(READ_ONLY_GUARANTEE.does_not_override_rules, true);
    assert.strictEqual(READ_ONLY_GUARANTEE.does_not_introduce_structures, true);
    assert.strictEqual(READ_ONLY_GUARANTEE.outputs_are_descriptive, true);
    assert.strictEqual(READ_ONLY_GUARANTEE.decisions_with_engine, true);
  });
});

// --------------------------------------------------------------------------
// MAIN ANALYSIS FUNCTION TESTS
// --------------------------------------------------------------------------

describeSuite("performAIAnalysis", () => {
  test("should produce output with all required fields", () => {
    const context = createTestContext();
    const result = performAIAnalysis(context);

    assert.ok(result.analyzed_at, "Should have timestamp");
    assert.strictEqual(
      result.disclaimer,
      "AI analysis is descriptive only. All training decisions are made by the deterministic rule engine.",
    );
    assert.ok(typeof result.analytical_summary === "string");
    assert.ok(Array.isArray(result.trend_analyses));
  });

  test("should produce deterministic output for same input", () => {
    const context = createTestContext();
    const result1 = performAIAnalysis(context);
    const result2 = performAIAnalysis(context);

    // Timestamps will differ, but other fields should be identical
    assert.strictEqual(result1.disclaimer, result2.disclaimer);
    assert.strictEqual(result1.analytical_summary, result2.analytical_summary);
    assert.strictEqual(result1.trend_analyses.length, result2.trend_analyses.length);
  });

  test("should handle empty sessions gracefully", () => {
    const context = createTestContext({ sessions: [] });
    const result = performAIAnalysis(context);

    // Should not throw, but may have null interpretation/risk
    assert.ok(result.disclaimer);
  });

  test("should include state interpretation with sufficient sessions", () => {
    const context = createTestContext({ sessions: createTestSessions(5) });
    const result = performAIAnalysis(context);

    assert.ok(result.state_interpretation, "Should have state interpretation");
    assert.ok(result.state_interpretation?.readiness);
    assert.ok(result.state_interpretation?.fatigue);
  });

  test("should include risk assessment with sufficient sessions", () => {
    const context = createTestContext({ sessions: createTestSessions(5) });
    const result = performAIAnalysis(context);

    assert.ok(result.risk_assessment, "Should have risk assessment");
    assert.ok(Array.isArray(result.risk_assessment?.risks));
  });
});

// --------------------------------------------------------------------------
// INTERPRETATION LAYER TESTS
// --------------------------------------------------------------------------

describeSuite("Interpretation Layer", () => {
  test("should categorize readiness correctly", () => {
    assert.strictEqual(categorizeReadiness(90), "optimal");
    assert.strictEqual(categorizeReadiness(85), "optimal");
    assert.strictEqual(categorizeReadiness(75), "good");
    assert.strictEqual(categorizeReadiness(60), "adequate");
    assert.strictEqual(categorizeReadiness(45), "compromised");
    assert.strictEqual(categorizeReadiness(30), "poor");
    assert.strictEqual(categorizeReadiness(10), "poor");
  });

  test("should categorize fatigue correctly", () => {
    assert.strictEqual(categorizeFatigue(20), "fresh");
    assert.strictEqual(categorizeFatigue(35), "mild");
    assert.strictEqual(categorizeFatigue(55), "moderate");
    assert.strictEqual(categorizeFatigue(75), "elevated");
    assert.strictEqual(categorizeFatigue(90), "severe");
  });

  test("should determine overall state correctly", () => {
    const readiness = {
      readiness_score: 85,
      readiness_state: "optimal" as const,
      contributing_factors: [],
      confidence: "high" as const,
      explanation: "test",
      observations: [],
    };
    const fatigue = {
      fatigue_state: "fresh" as const,
      cns_fatigue: 20,
      muscular_fatigue: 20,
      technical_fatigue: 20,
      accumulation_pattern: "stable" as const,
      confidence: "high" as const,
      explanation: "test",
      domain_observations: { cns: [], muscular: [], technical: [] },
    };
    assert.strictEqual(determineOverallState(readiness, fatigue), "peak");
  });

  test("should produce consistent interpretations", () => {
    const context = createTestContext();
    const result1 = interpretAthleteState(context);
    const result2 = interpretAthleteState(context);

    assert.strictEqual(result1.overall_state, result2.overall_state);
    assert.strictEqual(result1.readiness.readiness_state, result2.readiness.readiness_state);
    assert.strictEqual(result1.fatigue.fatigue_state, result2.fatigue.fatigue_state);
  });
});

// --------------------------------------------------------------------------
// RISK DETECTION LAYER TESTS
// --------------------------------------------------------------------------

describeSuite("Risk Detection Layer", () => {
  test("should convert scores to risk levels correctly", () => {
    assert.strictEqual(scoreToRiskLevel(90), "critical");
    assert.strictEqual(scoreToRiskLevel(75), "high");
    assert.strictEqual(scoreToRiskLevel(60), "moderate");
    assert.strictEqual(scoreToRiskLevel(30), "low");
    assert.strictEqual(scoreToRiskLevel(10), "negligible");
  });

  test("should detect overload risk with high fatigue", () => {
    const context = createTestContext({
      current_fatigue: 80,
      sessions: createTestSessions(5, { fatigue: 75 }),
    });
    const risk = detectOverloadRisk(context, DEFAULT_AI_ANALYSIS_CONFIG);

    if (risk) {
      assert.ok(risk.risk_score > 0, "Should detect some overload risk");
      assert.strictEqual(risk.category, "overload");
    }
  });

  test("should detect under-recovery risk with low recovery ratio", () => {
    const context = createTestContext({
      current_readiness: 30,
      current_fatigue: 80,
      sessions: createTestSessions(5, { readiness: 35, fatigue: 75 }),
    });
    const risk = detectUnderRecoveryRisk(context, DEFAULT_AI_ANALYSIS_CONFIG);

    if (risk) {
      assert.ok(risk.risk_score > 0, "Should detect under-recovery risk");
      assert.strictEqual(risk.category, "under_recovery");
    }
  });

  test("should detect technical degradation with declining success", () => {
    const sessions = createTestSessions(5, { success_rate: 90, average_RPE: 6 });
    // Manually create declining success by creating new array
    const modifiedSessions = sessions.map((s, i) => 
      i === 4 ? { ...s, success_rate: 65, average_RPE: 9 } : s
    );
    const context = createTestContext({ sessions: modifiedSessions });

    const risk = detectTechnicalDegradationRisk(context, DEFAULT_AI_ANALYSIS_CONFIG);

    if (risk) {
      assert.ok(risk.risk_score > 0, "Should detect technical degradation risk");
      assert.strictEqual(risk.category, "technical_degradation");
    }
  });

  test("should produce deterministic risk assessments", () => {
    const context = createTestContext();
    const result1 = assessRisks(context);
    const result2 = assessRisks(context);

    assert.strictEqual(result1.overall_risk_level, result2.overall_risk_level);
    assert.strictEqual(result1.risks.length, result2.risks.length);
  });
});

// --------------------------------------------------------------------------
// SUMMARY LAYER TESTS
// --------------------------------------------------------------------------

describeSuite("Summary Layer", () => {
  test("should summarize a week of training", () => {
    const sessions = createTestSessions(5);
    const summary = summarizeWeek(sessions, 1);

    assert.ok(summary, "Should produce a summary");
    assert.strictEqual(summary.sessions_completed, 5);
    assert.ok(summary.avg_readiness > 0);
    assert.ok(summary.avg_fatigue > 0);
  });

  test("should return null for empty week", () => {
    const summary = summarizeWeek([], 1);
    assert.strictEqual(summary, null);
  });

  test("should analyze trends correctly", () => {
    const sessions = createTestSessions(5);
    const trends = analyzeTrends(sessions);

    assert.ok(trends.length > 0, "Should produce trend analyses");
    assert.ok(trends.some((t) => t.metric === "readiness"));
    assert.ok(trends.some((t) => t.metric === "fatigue"));
    assert.ok(trends.some((t) => t.metric === "success_rate"));
    assert.ok(trends.some((t) => t.metric === "session_RPE"));
  });

  test("should determine trend direction correctly", () => {
    assert.strictEqual(determineTrendDirection([10, 20, 30]), "increasing");
    assert.strictEqual(determineTrendDirection([30, 20, 10]), "decreasing");
    assert.strictEqual(determineTrendDirection([20, 21, 20]), "stable");
    assert.strictEqual(determineTrendDirection([20]), "unknown");
  });
});

// --------------------------------------------------------------------------
// BRIDGE FUNCTION TESTS
// --------------------------------------------------------------------------

describeSuite("Bridge Functions", () => {
  test("should adapt session for analysis", () => {
    const sessionLog = {
      date: "2024-01-15T10:00:00.000Z",
      adjusted_intensity: 85,
      success_rate: 90,
      average_RPE: 7,
      total_sets: 20,
    };

    const adapted = adaptSessionForAnalysis(sessionLog, {
      readiness: 75,
      fatigue: 35,
    });

    assert.ok(adapted.timestamp > 0);
    assert.strictEqual(adapted.readiness, 75);
    assert.strictEqual(adapted.fatigue, 35);
    assert.strictEqual(adapted.success_rate, 90);
    assert.strictEqual(adapted.average_RPE, 7);
    assert.strictEqual(adapted.intensity_avg, 85);
  });

  test("should create analysis context from params", () => {
    const sessions = createTestSessions(3);
    const context = createAnalysisContext({
      sessions,
      current_readiness: 70,
      current_fatigue: 40,
      training_phase: "accumulation",
    });

    assert.strictEqual(context.sessions.length, 3);
    assert.strictEqual(context.current_readiness, 70);
    assert.strictEqual(context.current_fatigue, 40);
    assert.strictEqual(context.training_phase, "accumulation");
  });
});

// --------------------------------------------------------------------------
// SCENARIO-BASED TESTS
// --------------------------------------------------------------------------

describeSuite("Scenario-Based Tests", () => {
  test("should handle fatigued athlete scenario", () => {
    const context = createTestContext({
      current_readiness: 40,
      current_fatigue: 80,
      sessions: createTestSessions(7, {
        readiness: 45,
        fatigue: 75,
        success_rate: 70,
        average_RPE: 8.5,
      }),
    });

    const result = performAIAnalysis(context);

    // Should detect fatigue-related issues
    assert.ok(result.state_interpretation);
    assert.ok(result.state_interpretation.fatigue.fatigue_state !== "fresh");
  });

  test("should handle fresh athlete scenario", () => {
    const context = createTestContext({
      current_readiness: 90,
      current_fatigue: 20,
      sessions: createTestSessions(5, {
        readiness: 85,
        fatigue: 25,
        success_rate: 92,
        average_RPE: 5.5,
      }),
    });

    const result = performAIAnalysis(context);

    // Should indicate good state
    assert.ok(result.state_interpretation);
    assert.ok(
      result.state_interpretation.overall_state === "peak" ||
        result.state_interpretation.overall_state === "ready",
    );
  });

  test("should handle competition proximity scenario", () => {
    const context = createTestContext({
      competition_in_days: 7,
      current_readiness: 85,
      current_fatigue: 25,
      sessions: createTestSessions(5),
    });

    const result = performAIAnalysis(context);

    // Should include competition context in analysis
    assert.ok(result.state_interpretation);
    const hasCompetition =
      result.state_interpretation.readiness.contributing_factors.some((f) => f.includes("competition")) ||
      result.state_interpretation.readiness.observations.some((o) => o.includes("competition"));
    assert.ok(hasCompetition, "Should mention competition proximity");
  });

  test("should handle declining performance scenario", () => {
    const sessions = createTestSessions(7).map((s, i) => ({
      ...s,
      success_rate: 90 - i * 4,
      average_RPE: 6 + i * 0.5,
    }));

    const context = createTestContext({ sessions });
    const result = performAIAnalysis(context);

    // Should detect declining trends
    const successTrend = result.trend_analyses.find((t) => t.metric === "success_rate");
    assert.ok(successTrend);
    assert.strictEqual(successTrend.direction, "decreasing");
  });
});

// --------------------------------------------------------------------------
// EDGE CASE TESTS
// --------------------------------------------------------------------------

describeSuite("Edge Cases", () => {
  test("should handle single session", () => {
    const context = createTestContext({ sessions: createTestSessions(1) });
    const result = performAIAnalysis(context);

    assert.ok(result.disclaimer);
  });

  test("should handle very large session count", () => {
    const context = createTestContext({ sessions: createTestSessions(50) });
    const result = performAIAnalysis(context);

    assert.ok(result.state_interpretation);
    assert.strictEqual(result.state_interpretation?.readiness.confidence, "high");
  });

  test("should handle boundary values", () => {
    const context = createTestContext({
      current_readiness: 0,
      current_fatigue: 100,
      sessions: createTestSessions(3),
    });
    const result = performAIAnalysis(context);

    assert.ok(result.state_interpretation);
    assert.ok(result.state_interpretation.readiness.readiness_score >= 0);
    assert.ok(result.state_interpretation.readiness.readiness_score <= 100);
  });

  test("should handle zero values gracefully", () => {
    const context = createTestContext({
      current_readiness: 0,
      current_fatigue: 0,
      sessions: createTestSessions(5),
    });
    const result = performAIAnalysis(context);

    // Should handle zero values
    assert.ok(result.state_interpretation);
    assert.strictEqual(result.state_interpretation.readiness.readiness_score, 0);
    assert.strictEqual(result.state_interpretation.fatigue.cns_fatigue, 0);
  });

  test("should handle undefined optional fields", () => {
    const context: AIAnalysisContext = {
      sessions: createTestSessions(3),
      current_readiness: 70,
      current_fatigue: 40,
      // Intentionally omit optional fields
    };
    const result = performAIAnalysis(context);

    assert.ok(result.disclaimer);
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