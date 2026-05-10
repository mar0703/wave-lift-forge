import {
  auditTaxonomyIntegrity,
  formatTaxonomyIntegrityReport,
} from "../src/lib/weightlifting/taxonomy-integrity-audit";

const report = auditTaxonomyIntegrity();
console.log(formatTaxonomyIntegrityReport(report));
console.log("\n--- JSON snapshot ---");
console.log(
  JSON.stringify(
    {
      total_profiles: report.total_profiles,
      missing_repair_candidates: report.missing_repair_candidates,
      orphan_stress_classes: report.orphan_stress_classes,
      complexity_coverage: report.complexity_coverage,
      complexity_coverage_gaps: report.complexity_coverage_gaps,
      unknown_bypass_event_count: report.unknown_bypass_event_count,
      unique_bypassed_exercise_ids: report.unique_bypassed_exercise_ids,
      candidate_audit: report.candidate_audit,
    },
    null,
    2,
  ),
);
