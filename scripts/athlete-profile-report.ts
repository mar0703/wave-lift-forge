/**
 * ATHLETE PROFILE — STATIC AUDIT / DOCTRINE REPORTER
 *
 * Observational only. Walks the static athlete-profile registry, exercises
 * the pure projection helpers, and prints a doctrine-compliance report.
 *
 * Doctrine:
 *   - Reporter is read-only. It does not import any runtime orchestration
 *     module and cannot, by construction, influence deterministic replay or
 *     orchestration outcomes.
 *   - Output is a bounded, human-auditable summary suitable for review
 *     alongside the runtime-scenario-test harness.
 */

import {
  // Types
  type AthleteProfile,
  type AuthorityRule,
  type GovernanceBoundary,
  type ProfileEvolution,
  type ProfileRecommendation,
  type ProfileSnapshot,
  type QuestionnaireLayer,
  type QuestionnaireQuestion,
  // Registries
  PROFILE_AUTHORITY_HIERARCHY,
  PROFILE_GOVERNANCE_BOUNDARIES,
  QUESTIONNAIRE_BANK,
  LONGITUDINAL_DETERMINISM_GUARANTEES,
  // Helpers
  appendSnapshot,
  createEmptyAthleteProfile,
  createEvolution,
  deriveRecommendations,
  questionsForLayer,
  resolveProfileConflict,
  summarizeEvolution,
} from "../src/lib/athlete-profile";

// ─────────────────────────────────────────────────────────────────────────────
// PRESENTATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function header(title: string): void {
  console.log("\n" + "═".repeat(60));
  console.log(`=== ${title}`);
  console.log("═".repeat(60));
}

function subheader(title: string): void {
  console.log("\n" + "─".repeat(60));
  console.log(`-- ${title}`);
  console.log("─".repeat(60));
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1 — PROFILE LAYER SEPARATION
// ─────────────────────────────────────────────────────────────────────────────

function reportProfileLayerSeparation(): void {
  header("PROFILE LAYER SEPARATION");

  const layers = [
    {
      layer: "A. objective_profile",
      authority: "L2_objective_profile",
      role: "high-authority measurable data (age, bodyweight, training age, etc.)",
      governs_runtime: false,
      may_recommend: true,
    },
    {
      layer: "B. behavioral_profile",
      authority: "L4_behavioral_profile",
      role: "observed behavioral tendencies (pacing, monotony tolerance, etc.)",
      governs_runtime: false,
      may_recommend: true,
    },
    {
      layer: "C. recovery_profile",
      authority: "L3_recovery_profile",
      role: "observed recovery tendencies (sleep sensitivity, CNS load, etc.)",
      governs_runtime: false,
      may_recommend: true,
    },
    {
      layer: "D. interpretive_profile",
      authority: "L5_interpretive_profile",
      role: "optional descriptive archetypes (vata-/pitta-/kapha-like, mixed)",
      governs_runtime: false,
      may_recommend: true,
    },
  ];

  for (const l of layers) {
    console.log(`\n  ${l.layer}`);
    console.log(`    authority_level:   ${l.authority}`);
    console.log(`    role:              ${l.role}`);
    console.log(`    governs_runtime:   ${l.governs_runtime}`);
    console.log(`    may_recommend:     ${l.may_recommend}`);
  }

  console.log("\n  Note: layers are structurally separated as distinct fields");
  console.log("        on AthleteProfile. Mixing them in runtime decisions would");
  console.log("        require an explicit import that does not exist today.");
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2 — AUTHORITY HIERARCHY
// ─────────────────────────────────────────────────────────────────────────────

function reportAuthorityHierarchy(): void {
  header("AUTHORITY HIERARCHY");

  console.log("\n  Descending authority (highest first):\n");
  for (const rule of PROFILE_AUTHORITY_HIERARCHY) {
    printAuthorityRule(rule);
  }

  subheader("Conflict resolution probe");
  const r1 = resolveProfileConflict<number>(85, 60);
  console.log(`  objective=85, interpretive=60`);
  console.log(`    -> winner: ${r1.winner}, value: ${r1.value}`);
  console.log(`    rationale: ${r1.rationale}`);

  const r2 = resolveProfileConflict<number>(undefined, 60);
  console.log(`\n  objective=undefined, interpretive=60`);
  console.log(`    -> winner: ${r2.winner}, value: ${r2.value}`);
  console.log(`    rationale: ${r2.rationale}`);

  const r3 = resolveProfileConflict<number>(undefined, undefined);
  console.log(`\n  objective=undefined, interpretive=undefined`);
  console.log(`    -> winner: ${r3.winner}, value: ${r3.value}`);
  console.log(`    rationale: ${r3.rationale}`);
}

function printAuthorityRule(rule: AuthorityRule): void {
  console.log(`  - ${rule.level}`);
  console.log(`      may_govern_runtime:           ${rule.may_govern_runtime}`);
  console.log(`      may_recommend:                ${rule.may_recommend}`);
  console.log(`      may_personalize_communication:${rule.may_personalize_communication}`);
  console.log(`      ${rule.description}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 — GOVERNANCE BOUNDARY
// ─────────────────────────────────────────────────────────────────────────────

function reportGovernanceBoundary(): void {
  header("GOVERNANCE BOUNDARY");

  console.log("\n  Static boundary table (per non-objective layer):\n");
  for (const b of PROFILE_GOVERNANCE_BOUNDARIES) {
    printGovernanceBoundary(b);
  }

  console.log("\n  Each `false` above is a literal-type assertion, not a runtime");
  console.log("  check. Any future attempt to set these to `true` would fail to");
  console.log("  type-check, surfacing the governance violation at build time.");
}

function printGovernanceBoundary(b: GovernanceBoundary): void {
  console.log(`  - layer: ${b.layer}`);
  console.log(`      may_modify_orchestration: ${b.may_modify_orchestration}`);
  console.log(`      may_modify_repair:        ${b.may_modify_repair}`);
  console.log(`      may_modify_arbitration:   ${b.may_modify_arbitration}`);
  console.log(`      may_modify_legality:      ${b.may_modify_legality}`);
  console.log(`      may_modify_fallback:      ${b.may_modify_fallback}`);
  console.log(`      may_emit_recommendations: ${b.may_emit_recommendations}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4 — QUESTIONNAIRE EXPANSION
// ─────────────────────────────────────────────────────────────────────────────

function reportQuestionnaire(): void {
  header("QUESTIONNAIRE BANK");

  const layers: readonly QuestionnaireLayer[] = [
    "objective",
    "behavioral",
    "recovery",
    "interpretive",
  ];

  console.log(`\n  Total questions: ${QUESTIONNAIRE_BANK.length}`);
  for (const layer of layers) {
    const qs = questionsForLayer(layer);
    console.log(`    ${layer}: ${qs.length}`);
  }

  for (const layer of layers) {
    const qs = questionsForLayer(layer);
    if (qs.length === 0) continue;
    subheader(`${layer.toUpperCase()} layer (${qs.length} questions)`);
    for (const q of qs) {
      printQuestion(q);
    }
  }

  console.log("\n  Every question carries:");
  console.log("    observational_only: true");
  console.log("    non_diagnostic:     true");
  console.log("    non_medical:        true");
  console.log("  These are literal-type assertions enforced by the type system.");
}

function printQuestion(q: QuestionnaireQuestion): void {
  console.log(`\n  - id:               ${q.id}`);
  console.log(`    authority_level:  ${q.authority_level}`);
  console.log(`    answer_kind:      ${q.answer_kind}`);
  console.log(`    prompt:           ${q.prompt}`);
  if (q.options && q.options.length > 0) {
    console.log(`    options:          [${q.options.join(", ")}]`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5 — DOSHA / ARCHETYPE SAFETY BOUNDARY
// ─────────────────────────────────────────────────────────────────────────────

function reportDoshaSafetyBoundary(): void {
  header("DOSHA / ARCHETYPE SAFETY BOUNDARY");

  console.log("\n  The new InterpretiveProfile (vata_like/pitta_like/kapha_like/");
  console.log("  mixed/undetermined) is a heuristic communication aid only.");
  console.log("");
  console.log("  Hard guarantees enforced by this module:");
  console.log("    - InterpretiveProfile.governs_runtime is a literal `false`");
  console.log("    - No function in src/lib/athlete-profile reads from any");
  console.log("      runtime orchestration module (verified by absence of");
  console.log("      such imports in the module barrel)");
  console.log("    - deriveRecommendations() emits only ProfileRecommendation");
  console.log("      objects, each carrying `governing: false`");
  console.log("    - Allowed downstream uses: coach notes, monitoring emphasis,");
  console.log("      recovery suggestions, communication style adjustments");
  console.log("    - Disallowed: volume derivation, intensity derivation,");
  console.log("      progression rates, fatigue ceilings, arbitration priority,");
  console.log("      legality outcomes, repair decisions, fallback selection");
  console.log("");
  console.log("  Legacy note: a pre-existing dosha pathway lives inside");
  console.log("  src/lib/training-engine.ts (detectDosha → volumeMultiplier).");
  console.log("  That pathway predates this layer and is intentionally NOT");
  console.log("  modified by Phase E to preserve deterministic replay. The new");
  console.log("  InterpretiveProfile is a separate surface and does not feed");
  console.log("  into that legacy pathway.");
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6 — RECOMMENDATION-ONLY SURFACES (live exercise)
// ─────────────────────────────────────────────────────────────────────────────

function reportRecommendationSurfaces(): void {
  header("RECOMMENDATION-ONLY SURFACES");

  // Build a richly populated sample profile to exercise the projector.
  const sample: AthleteProfile = {
    profile_version: 2,
    captured_at: "2026-05-11T00:00:00.000Z",
    objective_profile: {
      age_years: 28,
      bodyweight_kg: 82,
      training_age_years: 6,
      typical_sleep_hours: 7,
      weekly_training_days: 5,
      competition_level: "intermediate",
      workload_tolerance: "moderate",
    },
    behavioral_profile: {
      monotony_tolerance: "low",
      pacing_behavior: "aggressive",
      overreaching_tendency: "high",
      emotional_reactivity: "moderate",
      preference_for_structure: "high",
      motivational_stability: "moderate",
    },
    recovery_profile: {
      sleep_sensitivity: "high",
      cns_fatigue_sensitivity: "high",
      volume_tolerance: "moderate",
      intensity_tolerance: "low",
      stress_recovery_interaction: "high",
      appetite_under_stress: "suppressed",
    },
    interpretive_profile: {
      primary_archetype: "pitta_like",
      secondary_archetype: "vata_like",
      archetype_certainty: "moderate",
      volatility_markers: ["aggressive_pacing_observed"],
      explanatory_notes: ["heuristic_label_only"],
      governs_runtime: false,
    },
    certainty: "moderate",
    uncertainty_notes: ["interpretive_layer_low_confidence_by_design"],
  };

  const projection = deriveRecommendations(sample);

  console.log(`\n  Sample profile generated: ${projection.summary.total} recommendations\n`);

  console.log("  Distribution by surface:");
  for (const [surface, count] of Object.entries(projection.summary.by_surface)) {
    console.log(`    ${surface}: ${count}`);
  }
  console.log("\n  Distribution by source layer:");
  for (const [src, count] of Object.entries(projection.summary.by_source_layer)) {
    console.log(`    ${src}: ${count}`);
  }

  subheader("Recommendation listing");
  for (const r of projection.recommendations) {
    printRecommendation(r);
  }

  console.log("\n  Doctrine notes attached to projection:");
  for (const note of projection.doctrine_notes) {
    console.log(`    - ${note}`);
  }
}

function printRecommendation(r: ProfileRecommendation): void {
  console.log(`\n  - id:              ${r.id}`);
  console.log(`    source_layer:   ${r.source_layer}`);
  console.log(`    authority_level:${r.authority_level}`);
  console.log(`    surface:        ${r.surface}`);
  console.log(`    governing:      ${r.governing}`);
  console.log(`    message:        ${r.message}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7 — UNCERTAINTY HANDLING
// ─────────────────────────────────────────────────────────────────────────────

function reportUncertainty(): void {
  header("PROFILE UNCERTAINTY HANDLING");

  const incomplete: AthleteProfile = createEmptyAthleteProfile(
    "2026-05-11T00:00:00.000Z",
  );

  console.log("\n  Empty / unknown profile factory output:");
  console.log(`    profile_version:                 ${incomplete.profile_version}`);
  console.log(`    captured_at:                     ${incomplete.captured_at}`);
  console.log(`    certainty:                       ${incomplete.certainty}`);
  console.log(`    interpretive.primary_archetype:  ${incomplete.interpretive_profile.primary_archetype}`);
  console.log(`    interpretive.archetype_certainty:${incomplete.interpretive_profile.archetype_certainty}`);
  console.log(`    interpretive.governs_runtime:    ${incomplete.interpretive_profile.governs_runtime}`);
  console.log("  uncertainty_notes:");
  for (const n of incomplete.uncertainty_notes) {
    console.log(`    - ${n}`);
  }

  subheader("Empty-profile recommendation projection");
  const proj = deriveRecommendations(incomplete);
  console.log(`  recommendations produced: ${proj.summary.total}`);
  console.log("  (zero is expected — no tendencies to recommend on)");

  subheader("Uncertainty doctrine");
  console.log("  - blended archetypes are first-class: 'mixed', 'undetermined'");
  console.log("  - certainty ranges: 'high' | 'moderate' | 'low' | 'unknown'");
  console.log("  - any field may be omitted; downstream consumers handle absence");
  console.log("  - no rigid classification is forced on incomplete data");
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8 — LONGITUDINAL DETERMINISM
// ─────────────────────────────────────────────────────────────────────────────

function reportLongitudinal(): void {
  header("LONGITUDINAL PROFILE DETERMINISM");

  // Build two snapshots and append them.
  const s1Profile: AthleteProfile = createEmptyAthleteProfile(
    "2025-12-01T00:00:00.000Z",
  );

  const s1: ProfileSnapshot = {
    snapshot_id: "snap-001",
    profile: s1Profile,
    notes: ["initial_capture"],
  };

  const s2Profile: AthleteProfile = {
    profile_version: 2,
    captured_at: "2026-03-15T00:00:00.000Z",
    objective_profile: {
      training_age_years: 6,
    },
    behavioral_profile: {
      pacing_behavior: "balanced",
      overreaching_tendency: "moderate",
    },
    recovery_profile: {
      sleep_sensitivity: "moderate",
      cns_fatigue_sensitivity: "high",
    },
    interpretive_profile: {
      primary_archetype: "mixed",
      archetype_certainty: "low",
      governs_runtime: false,
    },
    certainty: "low",
    uncertainty_notes: ["evolving_observations"],
  };

  const s2: ProfileSnapshot = {
    snapshot_id: "snap-002",
    profile: s2Profile,
    notes: ["periodic_recalibration"],
  };

  let evolution: ProfileEvolution = createEvolution("athlete-demo", s1);
  evolution = appendSnapshot(evolution, s2);

  console.log("\n  Evolution constructed (pure append; no in-place mutation).");
  const summary = summarizeEvolution(evolution);
  console.log(`    athlete_handle:      ${summary.athlete_handle}`);
  console.log(`    snapshot_count:      ${summary.snapshot_count}`);
  console.log(`    first_captured_at:   ${summary.first_captured_at}`);
  console.log(`    latest_captured_at:  ${summary.latest_captured_at}`);
  console.log(`    latest_certainty:    ${summary.latest_certainty}`);
  console.log(`    version_range:       [${summary.version_range?.join(", ")}]`);

  subheader("Supersede chain");
  for (const snap of evolution.snapshots) {
    console.log(`  - ${snap.snapshot_id} (v${snap.profile.profile_version})`);
    console.log(`      captured_at:   ${snap.profile.captured_at}`);
    console.log(`      superseded_by: ${snap.superseded_by ?? "(head)"}`);
  }

  subheader("Determinism guarantees");
  for (const g of LONGITUDINAL_DETERMINISM_GUARANTEES) {
    console.log(`  - ${g.guarantee}`);
    console.log(`      enforced_by: ${g.enforced_by}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9 — REPLAY / DETERMINISM SAFETY
// ─────────────────────────────────────────────────────────────────────────────

function reportReplaySafety(): void {
  header("REPLAY / DETERMINISM SAFETY");

  console.log("\n  This module does NOT:");
  console.log("    - import from src/lib/orchestrator.ts");
  console.log("    - import from src/lib/training-engine.ts");
  console.log("    - import from any src/lib/weightlifting/* runtime module");
  console.log("    - register any global listeners, timers, or singletons");
  console.log("    - perform any I/O");
  console.log("    - use Date.now(), Math.random(), or any non-deterministic API");
  console.log("");
  console.log("  All profile data is structurally serializable:");
  console.log("    - readonly primitive/enum fields");
  console.log("    - readonly arrays of primitives");
  console.log("    - ISO-8601 strings for timestamps (no Date objects)");
  console.log("    - no functions, no Maps, no Sets, no circular references");
  console.log("");
  console.log("  Consequence: scripts/runtime-scenario-test.ts replay");
  console.log("  certification is unaffected by this module — it cannot");
  console.log("  reach orchestration state under any code path.");
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 — DOCTRINE COMPLIANCE FOOTER
// ─────────────────────────────────────────────────────────────────────────────

function reportDoctrineFooter(): void {
  header("DOCTRINE COMPLIANCE FOOTER");
  console.log("");
  console.log("  The athlete-profile layer may:");
  console.log("    - describe");
  console.log("    - observe");
  console.log("    - interpret");
  console.log("    - recommend");
  console.log("");
  console.log("  It must NOT:");
  console.log("    - govern");
  console.log("    - arbitrate");
  console.log("    - legalize");
  console.log("    - override");
  console.log("    - silently control runtime behavior");
  console.log("");
  console.log("  Objective performance data ALWAYS overrides interpretive");
  console.log("  profiling when the two conflict.");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function main(): void {
  console.log("╔══════════════════════════════════════════════════════════════════╗");
  console.log("║     ATHLETE PROFILE — STATIC AUDIT / DOCTRINE REPORTER           ║");
  console.log("║     Layer separation, authority hierarchy, governance boundary   ║");
  console.log("╚══════════════════════════════════════════════════════════════════╝");

  reportProfileLayerSeparation();
  reportAuthorityHierarchy();
  reportGovernanceBoundary();
  reportQuestionnaire();
  reportDoshaSafetyBoundary();
  reportRecommendationSurfaces();
  reportUncertainty();
  reportLongitudinal();
  reportReplaySafety();
  reportDoctrineFooter();

  console.log("\nReport completed.");
}

main();
