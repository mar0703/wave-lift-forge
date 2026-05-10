// ─────────────────────────────────────────────────────────────────────────────
// TAXONOMY INTEGRITY AUDIT — Phase A observability helper
//
// Deterministic, read-only check that surfaces:
//   - exercises referenced by validator repair candidates but missing profiles
//   - stress classes declared in the type union but unused
//   - complexity tiers with zero exercise coverage
//   - exercises that have bypassed semantic filtering at runtime
//
// This module mutates nothing. It is safe to call from any context. It does
// not change orchestration, arbitration, repair, or validator behavior.
// ─────────────────────────────────────────────────────────────────────────────

import type { ComplexityLevel, StressClass } from "./exercise-stress-taxonomy";
import {
  getAllExerciseProfiles,
  getExerciseStressProfile,
} from "./exercise-stress-taxonomy";
import { REPAIR_CANDIDATES } from "./orchestration-semantic-validator";
import {
  getUnknownExerciseBypassEvents,
  type UnknownExerciseBypassEvent,
} from "./orchestrator-telemetry";

/**
 * Authoritative list of every stress class the taxonomy declares. Kept in
 * sync with the StressClass union in exercise-stress-taxonomy.ts. Adding a
 * class to the union without adding it here is itself an audit gap.
 */
const DECLARED_STRESS_CLASSES: readonly StressClass[] = [
  "overhead_maximal",
  "overhead_technical",
  "pull_maximal",
  "pull_technical",
  "squat_maximal",
  "squat_restoration",
  "classic_competition",
  "restoration_coordination",
  "segmented_technical",
  "power_explosive",
];

const ALL_COMPLEXITY_LEVELS: readonly ComplexityLevel[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
];

export interface CandidateListAuditEntry {
  list_name: string;
  candidates: string[];
  defined: string[];
  missing: string[];
}

export interface ComplexityCoverageEntry {
  level: ComplexityLevel;
  count: number;
}

export interface TaxonomyIntegrityReport {
  generated_at: number;
  total_profiles: number;
  candidate_audit: CandidateListAuditEntry[];
  missing_repair_candidates: string[];
  orphan_stress_classes: StressClass[];
  complexity_coverage: ComplexityCoverageEntry[];
  complexity_coverage_gaps: ComplexityLevel[];
  unknown_referenced_exercises: string[];
  unknown_bypass_event_count: number;
  unique_bypassed_exercise_ids: string[];
  unknown_bypass_events: UnknownExerciseBypassEvent[];
}

function partitionDefined(ids: readonly string[]): {
  defined: string[];
  missing: string[];
} {
  const defined: string[] = [];
  const missing: string[] = [];
  for (const id of ids) {
    if (getExerciseStressProfile(id)) defined.push(id);
    else missing.push(id);
  }
  return { defined, missing };
}

/**
 * Run the full taxonomy integrity audit. Pure: same input state → same result.
 * The only non-deterministic field is generated_at and the runtime bypass
 * buffer; the structural integrity checks are fully deterministic.
 */
export function auditTaxonomyIntegrity(): TaxonomyIntegrityReport {
  const profiles = getAllExerciseProfiles();

  // 1. Validator repair candidate audit
  const candidate_audit: CandidateListAuditEntry[] = Object.entries(REPAIR_CANDIDATES).map(
    ([list_name, candidates]) => {
      const { defined, missing } = partitionDefined(candidates);
      return {
        list_name,
        candidates: [...candidates],
        defined,
        missing,
      };
    },
  );

  const missing_repair_candidates = Array.from(
    new Set(candidate_audit.flatMap((entry) => entry.missing)),
  ).sort();

  // 2. Orphan stress classes — declared but no exercise assigned
  const assignedStressClasses = new Set(profiles.map((p) => p.stress_class));
  const orphan_stress_classes = DECLARED_STRESS_CLASSES.filter(
    (cls) => !assignedStressClasses.has(cls),
  );

  // 3. Complexity coverage
  const counts: Record<number, number> = {};
  for (const p of profiles) {
    counts[p.complexity] = (counts[p.complexity] ?? 0) + 1;
  }
  const complexity_coverage: ComplexityCoverageEntry[] = ALL_COMPLEXITY_LEVELS.map(
    (level) => ({ level, count: counts[level] ?? 0 }),
  );
  const complexity_coverage_gaps = complexity_coverage
    .filter((entry) => entry.count === 0)
    .map((entry) => entry.level);

  // 4. Unknown referenced exercises — currently the same set as
  //    missing_repair_candidates. Exposed as a separate field so future
  //    additional reference sources (intervention engine, daily-priority
  //    preferred_families, etc.) can be folded in without breaking callers.
  const unknown_referenced_exercises = [...missing_repair_candidates];

  // 5. Runtime bypass events
  const unknown_bypass_events = getUnknownExerciseBypassEvents();
  const unique_bypassed_exercise_ids = Array.from(
    new Set(unknown_bypass_events.map((evt) => evt.exercise_id)),
  ).sort();

  return {
    generated_at: Date.now(),
    total_profiles: profiles.length,
    candidate_audit,
    missing_repair_candidates,
    orphan_stress_classes,
    complexity_coverage,
    complexity_coverage_gaps,
    unknown_referenced_exercises,
    unknown_bypass_event_count: unknown_bypass_events.length,
    unique_bypassed_exercise_ids,
    unknown_bypass_events,
  };
}

/**
 * Render the report as a flat, human-readable text block. Useful for logs,
 * dev-tooling output, or CI assertion messages. Deterministic except for
 * the generated_at timestamp.
 */
export function formatTaxonomyIntegrityReport(report: TaxonomyIntegrityReport): string {
  const lines: string[] = [];
  lines.push(`=== Taxonomy Integrity Audit ===`);
  lines.push(`Generated at: ${new Date(report.generated_at).toISOString()}`);
  lines.push(`Total profiles: ${report.total_profiles}`);
  lines.push("");

  lines.push(`-- Repair candidate audit --`);
  for (const entry of report.candidate_audit) {
    lines.push(
      `  ${entry.list_name}: ${entry.defined.length}/${entry.candidates.length} defined` +
        (entry.missing.length ? ` (missing: ${entry.missing.join(", ")})` : ""),
    );
  }
  lines.push("");

  lines.push(`-- Missing repair candidates --`);
  if (report.missing_repair_candidates.length === 0) {
    lines.push("  (none)");
  } else {
    for (const id of report.missing_repair_candidates) lines.push(`  - ${id}`);
  }
  lines.push("");

  lines.push(`-- Orphan stress classes --`);
  if (report.orphan_stress_classes.length === 0) {
    lines.push("  (none)");
  } else {
    for (const cls of report.orphan_stress_classes) lines.push(`  - ${cls}`);
  }
  lines.push("");

  lines.push(`-- Complexity coverage --`);
  for (const entry of report.complexity_coverage) {
    lines.push(`  C${entry.level}: ${entry.count} exercise(s)`);
  }
  if (report.complexity_coverage_gaps.length > 0) {
    lines.push(
      `  Gaps at: ${report.complexity_coverage_gaps.map((l) => `C${l}`).join(", ")}`,
    );
  }
  lines.push("");

  lines.push(`-- Runtime unknown-profile bypass --`);
  lines.push(`  Events recorded: ${report.unknown_bypass_event_count}`);
  if (report.unique_bypassed_exercise_ids.length === 0) {
    lines.push(`  Unique exercises bypassed: (none)`);
  } else {
    lines.push(
      `  Unique exercises bypassed: ${report.unique_bypassed_exercise_ids.join(", ")}`,
    );
  }

  return lines.join("\n");
}
