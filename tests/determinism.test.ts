/**
 * DETERMINISM TESTS
 *
 * Verifies the runtime engines (orchestrator + AI analysis layer) are
 * fully deterministic and free of nondeterministic inputs:
 *
 *   1. Identical inputs produce identical outputs (100 runs).
 *   2. No Date.now() drift effects on computed outputs.
 *   3. No Math.random usage in runtime engines (static + dynamic).
 *   4. No ordering instability in array/set outputs across runs.
 *
 * TESTS ONLY — DO NOT MODIFY IMPLEMENTATION.
 *
 * Run with: npx tsx tests/determinism.test.ts
 * Or compile check: npx tsc --noEmit
 */

import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import {
  orchestrateAndPrepareWorkout,
  buildRuntimeCoachingContext,
  buildFinalCoachContext,
  type OrchestratorInput,
} from "../src/lib/orchestrator.js";

import {
  performAIAnalysis,
  type AIAnalysisContext,
  type AnalysisSessionData,
} from "../src/lib/ai-analysis/index.js";

import { type MicrocycleSession } from "../src/lib/weightlifting/microcycle-engine.js";

// ============================================================================
// CONSTANTS — fixed, reproducible fixture timestamps
// ============================================================================

const FIXED_NOW = 1_700_000_000_000; // 2023-11-14T22:13:20.000Z — stable epoch
const ONE_DAY = 24 * 60 * 60 * 1000;

// Wall-clock independent Date.now used to seed fixtures and to pin the
// orchestrator's internal Date.now() reads during 100-run comparisons.
function stubDateNow(value: number): () => void {
  const real = Date.now.bind(Date);
  Date.now = () => value;
  return () => {
    Date.now = real;
  };
}

// ============================================================================
// FIXTURES
// ============================================================================

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
 * Date-bearing sessions whose dates are pinned to FIXED_NOW so output is
 * independent of wall-clock progression.
 */
function createPinnedSessions(
  count: number,
  intensity: "high" | "moderate" | "low",
): MicrocycleSession[] {
  const sessions: MicrocycleSession[] = [];
  const factor = intensity === "high" ? 0.85 : intensity === "moderate" ? 0.55 : 0.25;
  for (let i = 0; i < count; i++) {
    sessions.push({
      date: new Date(FIXED_NOW - (count - i) * ONE_DAY).toISOString(),
      cns_load: 30 + factor * 60,
      technical_load: 30 + factor * 50,
      local_load: 30 + factor * 60,
      overhead_stress: 20 + factor * 60,
      squat_stress: 30 + factor * 60,
      pull_stress: 30 + factor * 60,
      intensity_avg: 60 + factor * 35,
      complexity_avg: 5 + factor * 4,
      specificity_score: 50 + factor * 40,
    });
  }
  return sessions;
}

/** Sessions WITHOUT `date` — used to verify Date.now()-drift independence. */
function createDatelessSessions(
  count: number,
  intensity: "high" | "moderate" | "low",
): MicrocycleSession[] {
  const sessions: MicrocycleSession[] = [];
  const factor = intensity === "high" ? 0.85 : intensity === "moderate" ? 0.55 : 0.25;
  for (let i = 0; i < count; i++) {
    sessions.push({
      cns_load: 30 + factor * 60,
      technical_load: 30 + factor * 50,
      local_load: 30 + factor * 60,
      overhead_stress: 20 + factor * 60,
      squat_stress: 30 + factor * 60,
      pull_stress: 30 + factor * 60,
      intensity_avg: 60 + factor * 35,
      complexity_avg: 5 + factor * 4,
      specificity_score: 50 + factor * 40,
    });
  }
  return sessions;
}

function createAIContext(overrides: Partial<AIAnalysisContext> = {}): AIAnalysisContext {
  const sessions: AnalysisSessionData[] = [];
  for (let i = 0; i < 5; i++) {
    sessions.push({
      timestamp: FIXED_NOW - (5 - i) * ONE_DAY,
      readiness: 70 - i * 2,
      fatigue: 30 + i * 3,
      success_rate: 85 - i * 2,
      average_RPE: 6 + i * 0.3,
    });
  }
  return {
    sessions,
    current_readiness: 70,
    current_fatigue: 40,
    ...overrides,
  };
}

// ============================================================================
// CANONICALIZATION
//
// Outputs may contain Set / Map instances and a handful of non-deterministic
// timestamp fields (e.g. analyzed_at, recorded_at, generated_at). We strip
// those fields and convert Sets/Maps into sorted arrays so byte-equality
// comparison reflects the *computed* result, not bookkeeping noise.
// ============================================================================

const NONDETERMINISTIC_TIMESTAMP_KEYS = new Set([
  "analyzed_at",
  "recorded_at",
  "generated_at",
]);

function canonicalize(value: unknown): unknown {
  if (value instanceof Set) {
    const items = [...value].map(canonicalize);
    items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    return ["__SET__", items];
  }
  if (value instanceof Map) {
    const entries: Array<[unknown, unknown]> = [...value.entries()].map(
      ([k, v]) => [canonicalize(k), canonicalize(v)],
    );
    entries.sort((a, b) =>
      JSON.stringify(a[0]).localeCompare(JSON.stringify(b[0])),
    );
    return ["__MAP__", entries];
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      if (NONDETERMINISTIC_TIMESTAMP_KEYS.has(key)) continue;
      out[key] = canonicalize((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

function serialize(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

// ============================================================================
// TEST RUNNER
// ============================================================================

console.log("=".repeat(80));
console.log("DETERMINISM TESTS");
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

/**
 * Run `produce` N times under a pinned Date.now() and assert every output
 * matches the first call byte-for-byte after canonicalization.
 */
function assertStableOver<T>(
  runs: number,
  produce: () => T,
  ctx: string,
): void {
  const restore = stubDateNow(FIXED_NOW);
  try {
    const baseline = serialize(produce());
    for (let i = 1; i < runs; i++) {
      const actual = serialize(produce());
      if (actual !== baseline) {
        throw new Error(
          `${ctx}: divergence on run ${i + 1}/${runs}\n  baseline=${baseline.slice(0, 200)}…\n  actual  =${actual.slice(0, 200)}…`,
        );
      }
    }
  } finally {
    restore();
  }
}

// ============================================================================
// SECTION 1 — Identical inputs produce identical outputs (100 runs)
// ============================================================================

describeSuite("Identical inputs → identical outputs (100 runs)", () => {
  test("orchestrateAndPrepareWorkout: 100 runs, normal input", () => {
    assertStableOver(
      100,
      () => orchestrateAndPrepareWorkout(createBaseInput()),
      "orchestrateAndPrepareWorkout/normal",
    );
  });

  test("orchestrateAndPrepareWorkout: 100 runs, moderately fatigued input", () => {
    const overrides: Partial<OrchestratorInput> = {
      fatigue: 60,
      readiness: 40,
      recent_sessions: createPinnedSessions(5, "moderate"),
    };
    assertStableOver(
      100,
      () => orchestrateAndPrepareWorkout(createBaseInput(overrides)),
      "orchestrateAndPrepareWorkout/moderate-fatigue",
    );
  });

  test("orchestrateAndPrepareWorkout: 100 runs, heavy fatigue input", () => {
    const overrides: Partial<OrchestratorInput> = {
      fatigue: 85,
      readiness: 20,
      recent_sessions: createPinnedSessions(7, "high"),
    };
    assertStableOver(
      100,
      () => orchestrateAndPrepareWorkout(createBaseInput(overrides)),
      "orchestrateAndPrepareWorkout/heavy-fatigue",
    );
  });

  test("orchestrateAndPrepareWorkout: 100 runs, competition-proximate input", () => {
    const overrides: Partial<OrchestratorInput> = {
      competition_in_days: 7,
      readiness: 85,
      fatigue: 15,
      recent_sessions: createPinnedSessions(3, "moderate"),
    };
    assertStableOver(
      100,
      () => orchestrateAndPrepareWorkout(createBaseInput(overrides)),
      "orchestrateAndPrepareWorkout/competition",
    );
  });

  test("buildRuntimeCoachingContext: 100 runs identical", () => {
    const input = createBaseInput({
      recent_sessions: createPinnedSessions(5, "moderate"),
    });
    assertStableOver(
      100,
      () => buildRuntimeCoachingContext(input),
      "buildRuntimeCoachingContext",
    );
  });

  test("buildFinalCoachContext: 100 runs identical", () => {
    const input = createBaseInput();
    assertStableOver(
      100,
      () => buildFinalCoachContext(buildRuntimeCoachingContext(input)),
      "buildFinalCoachContext",
    );
  });

  test("performAIAnalysis: 100 runs identical (modulo analyzed_at)", () => {
    const ctx = createAIContext();
    assertStableOver(100, () => performAIAnalysis(ctx), "performAIAnalysis/baseline");
  });

  test("performAIAnalysis: 100 runs identical under fatigued context", () => {
    const ctx = createAIContext({
      current_readiness: 40,
      current_fatigue: 80,
    });
    assertStableOver(100, () => performAIAnalysis(ctx), "performAIAnalysis/fatigued");
  });
});

// ============================================================================
// SECTION 2 — No Date.now() drift effects
//
// We pick inputs that never thread a real date through the engines (empty or
// undated recent_sessions) and verify that yanking Date.now() across enormous
// jumps does not change the canonical output.
// ============================================================================

describeSuite("No Date.now() drift effects on computed outputs", () => {
  test("orchestrator output is invariant to Date.now() (no dated sessions)", () => {
    const input = createBaseInput({
      recent_sessions: createDatelessSessions(5, "moderate"),
    });

    const samples = [0, 1, FIXED_NOW, FIXED_NOW + 5 * 365 * ONE_DAY, 9_999_999_999_999];
    const outputs: string[] = [];
    for (const t of samples) {
      const restore = stubDateNow(t);
      try {
        outputs.push(serialize(orchestrateAndPrepareWorkout(input)));
      } finally {
        restore();
      }
    }
    for (let i = 1; i < outputs.length; i++) {
      assert.strictEqual(
        outputs[i],
        outputs[0],
        `orchestrator output varies with Date.now() (sample ${i}, t=${samples[i]})`,
      );
    }
  });

  test("runtime context is invariant to Date.now() (no dated sessions)", () => {
    const input = createBaseInput({
      recent_sessions: createDatelessSessions(5, "moderate"),
    });

    const samples = [0, FIXED_NOW, FIXED_NOW + 365 * ONE_DAY];
    const outputs: string[] = [];
    for (const t of samples) {
      const restore = stubDateNow(t);
      try {
        outputs.push(serialize(buildRuntimeCoachingContext(input)));
      } finally {
        restore();
      }
    }
    for (let i = 1; i < outputs.length; i++) {
      assert.strictEqual(
        outputs[i],
        outputs[0],
        `runtime context varies with Date.now() (sample ${i}, t=${samples[i]})`,
      );
    }
  });

  test("AI analysis output is invariant to Date.now() (analyzed_at excluded)", () => {
    const ctx = createAIContext();
    const samples = [0, 1, FIXED_NOW, 9_999_999_999_999];
    const outputs: string[] = [];
    for (const t of samples) {
      const restore = stubDateNow(t);
      try {
        outputs.push(serialize(performAIAnalysis(ctx)));
      } finally {
        restore();
      }
    }
    for (let i = 1; i < outputs.length; i++) {
      assert.strictEqual(
        outputs[i],
        outputs[0],
        `AI analysis output varies with Date.now() (sample ${i}, t=${samples[i]})`,
      );
    }
  });

  test("two back-to-back orchestrator runs do not drift between them", () => {
    // No Date.now() stub here — verifies stability against natural ms drift
    // between two consecutive calls in real time.
    const input = createBaseInput({
      recent_sessions: createDatelessSessions(3, "low"),
    });
    const a = serialize(orchestrateAndPrepareWorkout(input));
    const b = serialize(orchestrateAndPrepareWorkout(input));
    assert.strictEqual(
      a,
      b,
      "orchestrator output drifted between two back-to-back unstubbed calls",
    );
  });
});

// ============================================================================
// SECTION 3 — No Math.random usage in runtime engines
//
// (a) Static scan over runtime engine sources.
// (b) Dynamic guard: replace Math.random with a throw and run the engines —
//     a real call would surface as a test failure.
// ============================================================================

const RUNTIME_ENGINE_PATHS: readonly string[] = [
  "src/lib/orchestrator.ts",
  "src/lib/training-engine.ts",
  "src/lib/coach-engine.ts",
  "src/lib/adaptive-workout.ts",
  "src/lib/diagnostics.ts",
  "src/lib/exercise-db.ts",
  "src/lib/engine-store.ts",
  "src/lib/weightlifting",
  "src/lib/ai-analysis",
];

function getRepoRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "..");
}

function collectTsFiles(repoRoot: string, relPath: string, out: string[]): void {
  const abs = path.join(repoRoot, relPath);
  if (!fs.existsSync(abs)) return;
  const stat = fs.statSync(abs);
  if (stat.isFile()) {
    if (abs.endsWith(".ts") || abs.endsWith(".tsx")) out.push(abs);
    return;
  }
  for (const entry of fs.readdirSync(abs)) {
    collectTsFiles(repoRoot, path.join(relPath, entry), out);
  }
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

describeSuite("No Math.random usage in runtime engines", () => {
  test("static scan: no Math.random in runtime engine sources", () => {
    const root = getRepoRoot();
    const files: string[] = [];
    for (const target of RUNTIME_ENGINE_PATHS) {
      collectTsFiles(root, target, files);
    }
    assert.ok(
      files.length > 0,
      "Expected to discover runtime engine source files; got zero — check RUNTIME_ENGINE_PATHS",
    );

    const offenders: string[] = [];
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      if (/\bMath\.random\b/.test(stripComments(source))) {
        offenders.push(path.relative(root, file).replace(/\\/g, "/"));
      }
    }
    assert.deepStrictEqual(
      offenders,
      [],
      `Runtime engines must not use Math.random. Offenders: ${offenders.join(", ")}`,
    );
  });

  test("dynamic guard: orchestrator does not call Math.random at runtime", () => {
    const realRandom = Math.random;
    let calls = 0;
    Math.random = () => {
      calls += 1;
      return 0; // return *something* so we observe rather than crash mid-trace
    };
    try {
      orchestrateAndPrepareWorkout(createBaseInput());
      orchestrateAndPrepareWorkout(
        createBaseInput({
          fatigue: 80,
          readiness: 25,
          recent_sessions: createPinnedSessions(5, "high"),
        }),
      );
      orchestrateAndPrepareWorkout(
        createBaseInput({
          competition_in_days: 7,
          recent_sessions: createPinnedSessions(3, "moderate"),
        }),
      );
    } finally {
      Math.random = realRandom;
    }
    assert.strictEqual(
      calls,
      0,
      `Math.random was invoked ${calls} time(s) by the orchestrator pipeline`,
    );
  });

  test("dynamic guard: AI analysis does not call Math.random at runtime", () => {
    const realRandom = Math.random;
    let calls = 0;
    Math.random = () => {
      calls += 1;
      return 0;
    };
    try {
      performAIAnalysis(createAIContext());
      performAIAnalysis(
        createAIContext({ current_readiness: 40, current_fatigue: 80 }),
      );
    } finally {
      Math.random = realRandom;
    }
    assert.strictEqual(
      calls,
      0,
      `Math.random was invoked ${calls} time(s) by the AI analysis pipeline`,
    );
  });

  test("output is independent of Math.random's return value", () => {
    const input = createBaseInput({
      recent_sessions: createPinnedSessions(5, "moderate"),
    });
    const realRandom = Math.random;
    const restoreDate = stubDateNow(FIXED_NOW);
    try {
      Math.random = () => 0;
      const a = serialize(orchestrateAndPrepareWorkout(input));
      Math.random = () => 0.999_999_999;
      const b = serialize(orchestrateAndPrepareWorkout(input));
      Math.random = () => 0.5;
      const c = serialize(orchestrateAndPrepareWorkout(input));
      assert.strictEqual(a, b, "Output varies between Math.random()=0 and ≈1");
      assert.strictEqual(b, c, "Output varies between Math.random()≈1 and 0.5");
    } finally {
      Math.random = realRandom;
      restoreDate();
    }
  });
});

// ============================================================================
// SECTION 4 — No ordering instability in outputs
//
// Stability tests on every observable array/set surface that downstream
// consumers may rely on for diff-friendliness and reproducibility.
// ============================================================================

describeSuite("No ordering instability in outputs", () => {
  test("constrained_exercises preserves order across 100 runs", () => {
    const input = createBaseInput();
    const restore = stubDateNow(FIXED_NOW);
    try {
      const baseline = orchestrateAndPrepareWorkout(input).constrained_exercises.map(
        (e) => e.exercise_id,
      );
      for (let i = 1; i < 100; i++) {
        const actual = orchestrateAndPrepareWorkout(input).constrained_exercises.map(
          (e) => e.exercise_id,
        );
        assert.deepStrictEqual(
          actual,
          baseline,
          `constrained_exercises order changed on run ${i + 1}`,
        );
      }
    } finally {
      restore();
    }
  });

  test("base_workout.exercises preserves order across 100 runs", () => {
    const input = createBaseInput();
    const restore = stubDateNow(FIXED_NOW);
    try {
      const baseline = buildRuntimeCoachingContext(input).base_workout.exercises.map(
        (e) => e.exercise_id,
      );
      for (let i = 1; i < 100; i++) {
        const actual = buildRuntimeCoachingContext(input).base_workout.exercises.map(
          (e) => e.exercise_id,
        );
        assert.deepStrictEqual(
          actual,
          baseline,
          `base_workout.exercises order changed on run ${i + 1}`,
        );
      }
    } finally {
      restore();
    }
  });

  test("final_context.notes preserves order across 100 runs", () => {
    const input = createBaseInput({
      recent_sessions: createPinnedSessions(5, "moderate"),
      fatigue: 55,
      readiness: 45,
    });
    const restore = stubDateNow(FIXED_NOW);
    try {
      const baseline = orchestrateAndPrepareWorkout(input).final_context.notes;
      for (let i = 1; i < 100; i++) {
        const actual = orchestrateAndPrepareWorkout(input).final_context.notes;
        assert.deepStrictEqual(
          actual,
          baseline,
          `final_context.notes order changed on run ${i + 1}`,
        );
      }
    } finally {
      restore();
    }
  });

  test("semantic_validation.issues preserves order across 100 runs", () => {
    const input = createBaseInput({
      fatigue: 85,
      readiness: 20,
      competition_in_days: 7,
      recent_sessions: createPinnedSessions(7, "high"),
    });
    const restore = stubDateNow(FIXED_NOW);
    try {
      const baseline = orchestrateAndPrepareWorkout(input).semantic_validation.issues.map(
        (issue: { classification: string }) => issue.classification,
      );
      for (let i = 1; i < 100; i++) {
        const actual = orchestrateAndPrepareWorkout(input).semantic_validation.issues.map(
          (issue: { classification: string }) => issue.classification,
        );
        assert.deepStrictEqual(
          actual,
          baseline,
          `semantic_validation.issues order changed on run ${i + 1}`,
        );
      }
    } finally {
      restore();
    }
  });

  test("priority_notes preserves order across 100 runs", () => {
    const input = createBaseInput({
      recent_sessions: createPinnedSessions(5, "moderate"),
    });
    const restore = stubDateNow(FIXED_NOW);
    try {
      const baseline = orchestrateAndPrepareWorkout(input).priority_notes;
      for (let i = 1; i < 100; i++) {
        const actual = orchestrateAndPrepareWorkout(input).priority_notes;
        assert.deepStrictEqual(
          actual,
          baseline,
          `priority_notes order changed on run ${i + 1}`,
        );
      }
    } finally {
      restore();
    }
  });

  test("blocked_exercises set membership is stable across 100 runs", () => {
    const input = createBaseInput({
      recent_sessions: createPinnedSessions(7, "high"),
      fatigue: 90,
      readiness: 15,
    });
    const restore = stubDateNow(FIXED_NOW);
    try {
      const baseline = [
        ...orchestrateAndPrepareWorkout(input).final_context.constraints.blocked_exercises,
      ].sort();
      for (let i = 1; i < 100; i++) {
        const actual = [
          ...orchestrateAndPrepareWorkout(input).final_context.constraints.blocked_exercises,
        ].sort();
        assert.deepStrictEqual(
          actual,
          baseline,
          `blocked_exercises set diverged on run ${i + 1}`,
        );
      }
    } finally {
      restore();
    }
  });

  test("arbitration.dominant_sources preserves order across 100 runs", () => {
    const input = createBaseInput({
      recent_sessions: createPinnedSessions(7, "high"),
      fatigue: 90,
      readiness: 15,
    });
    const restore = stubDateNow(FIXED_NOW);
    try {
      const baseline = [
        ...buildRuntimeCoachingContext(input).arbitration.dominant_sources,
      ];
      for (let i = 1; i < 100; i++) {
        const actual = [
          ...buildRuntimeCoachingContext(input).arbitration.dominant_sources,
        ];
        assert.deepStrictEqual(
          actual,
          baseline,
          `arbitration.dominant_sources order changed on run ${i + 1}`,
        );
      }
    } finally {
      restore();
    }
  });

  test("trend_analyses preserves order across 100 runs", () => {
    const ctx = createAIContext();
    const baseline = performAIAnalysis(ctx).trend_analyses.map((t) => t.metric);
    for (let i = 1; i < 100; i++) {
      const actual = performAIAnalysis(ctx).trend_analyses.map((t) => t.metric);
      assert.deepStrictEqual(
        actual,
        baseline,
        `trend_analyses order changed on run ${i + 1}`,
      );
    }
  });

  test("risk_assessment.risks preserves order across 100 runs", () => {
    const ctx = createAIContext({
      current_readiness: 30,
      current_fatigue: 85,
    });
    const baseline =
      performAIAnalysis(ctx).risk_assessment?.risks.map((r) => r.category) ?? [];
    for (let i = 1; i < 100; i++) {
      const actual =
        performAIAnalysis(ctx).risk_assessment?.risks.map((r) => r.category) ?? [];
      assert.deepStrictEqual(
        actual,
        baseline,
        `risk_assessment.risks order changed on run ${i + 1}`,
      );
    }
  });
});

// ============================================================================
// SUMMARY
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

export {};
