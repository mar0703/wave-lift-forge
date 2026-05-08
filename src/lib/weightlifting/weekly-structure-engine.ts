// ─────────────────────────────────────────────────────────────────────────────
// Weekly Structure Engine
//
// Pure intelligence layer that decides HOW a training week is organized:
// heavy/light sequencing, lift-family distribution, CNS/overhead/squat/pull
// stress balancing, restoration placement and competition-week sharpening.
//
// This engine does NOT generate exercises, does NOT render workouts, does NOT
// mutate state and does NOT depend on UI. It is consumed by coach-engine /
// microcycle-engine to inform daily priority selection.
// ─────────────────────────────────────────────────────────────────────────────

import type { DailyPriority, TrainingPhase } from "./daily-priority-engine";
import type { AdaptationTarget } from "./microcycle-engine";

// ────────────────────────────────────────────────────────────
// 1. TYPES
// ────────────────────────────────────────────────────────────

export interface WeeklyDayStructure {
  day_index: number; // 1-based
  primary_priority?: DailyPriority;
  secondary_priority?: DailyPriority;
  expected_cns_load: number; // 0–100
  expected_technical_load: number; // 0–100
  expected_overhead_stress: number; // 0–100
  expected_squat_stress: number; // 0–100
  expected_pull_stress: number; // 0–100
  heavy_day?: boolean;
  restoration_day?: boolean;
  notes: string[];
}

export interface WeeklyStructureContext {
  training_days_per_week: number; // 2–6
  adaptation_target?: AdaptationTarget;
  training_phase: TrainingPhase;
  readiness: number; // 0–100
  fatigue: number; // 0–100
  competition_in_days?: number;
}

export interface WeeklyStructurePlan {
  days: WeeklyDayStructure[];
  weekly_cns_distribution: number[];
  weekly_overhead_distribution: number[];
  weekly_squat_distribution: number[];
  notes: string[];
}

// ────────────────────────────────────────────────────────────
// 2. INTERNAL HELPERS
// ────────────────────────────────────────────────────────────

interface DayLoadProfile {
  cns: number;
  technical: number;
  overhead: number;
  squat: number;
  pull: number;
}

const PRIORITY_LOAD: Record<DailyPriority, DayLoadProfile> = {
  snatch_speed:           { cns: 70, technical: 75, overhead: 65, squat: 25, pull: 35 },
  snatch_technique:       { cns: 45, technical: 80, overhead: 55, squat: 20, pull: 30 },
  snatch_strength:        { cns: 80, technical: 60, overhead: 70, squat: 35, pull: 55 },
  clean_technique:        { cns: 50, technical: 75, overhead: 25, squat: 45, pull: 45 },
  clean_strength:         { cns: 80, technical: 55, overhead: 30, squat: 60, pull: 65 },
  jerk_technique:         { cns: 50, technical: 70, overhead: 80, squat: 25, pull: 15 },
  jerk_strength:          { cns: 75, technical: 55, overhead: 90, squat: 30, pull: 15 },
  speed_under:            { cns: 65, technical: 70, overhead: 50, squat: 35, pull: 25 },
  receive_stability:      { cns: 55, technical: 65, overhead: 55, squat: 55, pull: 25 },
  pull_strength:          { cns: 70, technical: 40, overhead: 10, squat: 35, pull: 90 },
  squat_strength:         { cns: 75, technical: 35, overhead: 10, squat: 90, pull: 25 },
  competition_specific:   { cns: 85, technical: 70, overhead: 70, squat: 50, pull: 55 },
  recovery:               { cns: 15, technical: 25, overhead: 15, squat: 15, pull: 15 },
  technical_restoration:  { cns: 25, technical: 60, overhead: 30, squat: 20, pull: 20 },
};

const EMPTY_LOAD: DayLoadProfile = { cns: 0, technical: 0, overhead: 0, squat: 0, pull: 0 };

function loadFor(p?: DailyPriority): DayLoadProfile {
  return p ? PRIORITY_LOAD[p] : EMPTY_LOAD;
}

function combine(a: DayLoadProfile, b: DayLoadProfile, weightB = 0.5): DayLoadProfile {
  return {
    cns:       Math.min(100, a.cns       + b.cns       * weightB),
    technical: Math.min(100, a.technical + b.technical * weightB),
    overhead:  Math.min(100, a.overhead  + b.overhead  * weightB),
    squat:     Math.min(100, a.squat     + b.squat     * weightB),
    pull:      Math.min(100, a.pull      + b.pull      * weightB),
  };
}

// ────────────────────────────────────────────────────────────
// 3. PHASE / TARGET TEMPLATES
// ────────────────────────────────────────────────────────────
//
// Templates describe primary priorities by day index for an "ideal" week.
// They are then trimmed to the athlete's training_days_per_week and adjusted
// for sequencing safety.

type Template = DailyPriority[];

function baseTemplate(
  phase: TrainingPhase,
  target?: AdaptationTarget,
): Template {
  if (target === "competition" || phase === "peak" || phase === "realization") {
    return [
      "competition_specific",
      "jerk_technique",
      "snatch_speed",
      "technical_restoration",
      "competition_specific",
      "recovery",
    ];
  }
  if (target === "speed") {
    return [
      "snatch_speed",
      "clean_technique",
      "jerk_technique",
      "speed_under",
      "snatch_technique",
      "recovery",
    ];
  }
  if (target === "max_strength" || phase === "intensification") {
    return [
      "squat_strength",
      "snatch_strength",
      "pull_strength",
      "clean_strength",
      "jerk_strength",
      "recovery",
    ];
  }
  if (target === "technical_rebuild" || phase === "deload") {
    return [
      "snatch_technique",
      "technical_restoration",
      "clean_technique",
      "jerk_technique",
      "recovery",
      "technical_restoration",
    ];
  }
  if (target === "work_capacity" || phase === "accumulation") {
    return [
      "clean_strength",
      "snatch_technique",
      "pull_strength",
      "jerk_technique",
      "squat_strength",
      "technical_restoration",
    ];
  }
  // sensible default
  return [
    "snatch_technique",
    "clean_strength",
    "jerk_technique",
    "pull_strength",
    "snatch_speed",
    "recovery",
  ];
}

// Pick N training days from a 6-slot template, evenly spaced so heavy days
// aren't accidentally clustered.
function distributeDays(template: Template, n: number): (DailyPriority | undefined)[] {
  const days = Math.max(2, Math.min(6, n));
  const out: (DailyPriority | undefined)[] = [];
  const step = template.length / days;
  for (let i = 0; i < days; i++) {
    out.push(template[Math.min(template.length - 1, Math.floor(i * step))]);
  }
  return out;
}

// ────────────────────────────────────────────────────────────
// 4. SEQUENCING SAFETY
// ────────────────────────────────────────────────────────────
//
// Real coaches avoid:
//  - back-to-back maximal CNS days
//  - heavy pull → heavy classic next day
//  - heavy jerk → high overhead next day
//  - squat stacking
//  - chaotic technical density

function isHeavy(p?: DailyPriority): boolean {
  if (!p) return false;
  const l = PRIORITY_LOAD[p];
  return l.cns >= 70;
}

function isOverhead(p?: DailyPriority): boolean {
  return !!p && PRIORITY_LOAD[p].overhead >= 65;
}

function isSquat(p?: DailyPriority): boolean {
  return !!p && PRIORITY_LOAD[p].squat >= 70;
}

function isPull(p?: DailyPriority): boolean {
  return !!p && PRIORITY_LOAD[p].pull >= 70;
}

function softenAfter(prev: DailyPriority, fallback: DailyPriority = "technical_restoration"): DailyPriority {
  // Map a heavy lift to its safer "next-day" partner
  switch (prev) {
    case "clean_strength":
    case "pull_strength":
      return "snatch_technique"; // avoid stacked classic/pull stress
    case "jerk_strength":
      return "clean_technique"; // remove overhead
    case "snatch_strength":
      return "jerk_technique";
    case "squat_strength":
      return "snatch_technique"; // protect receiving quality
    case "competition_specific":
      return "technical_restoration";
    default:
      return fallback;
  }
}

function applySequencingSafety(
  picks: (DailyPriority | undefined)[],
  ctx: WeeklyStructureContext,
): { picks: (DailyPriority | undefined)[]; notes: string[] } {
  const notes: string[] = [];
  const out = [...picks];

  for (let i = 1; i < out.length; i++) {
    const prev = out[i - 1];
    const cur = out[i];
    if (!prev || !cur) continue;

    // back-to-back maximal CNS
    if (isHeavy(prev) && isHeavy(cur)) {
      const replaced = softenAfter(prev);
      notes.push(`day ${i + 1}: replaced ${cur} with ${replaced} (back-to-back CNS)`);
      out[i] = replaced;
      continue;
    }

    // overhead destruction
    if (isOverhead(prev) && isOverhead(cur)) {
      notes.push(`day ${i + 1}: ${cur} reduced to clean_technique (overhead stacking)`);
      out[i] = "clean_technique";
      continue;
    }

    // squat stacking
    if (isSquat(prev) && isSquat(cur)) {
      notes.push(`day ${i + 1}: ${cur} replaced with snatch_technique (squat stacking)`);
      out[i] = "snatch_technique";
      continue;
    }

    // heavy pull → classic lift the next day suffers
    if (isPull(prev) && (cur === "clean_strength" || cur === "snatch_strength")) {
      notes.push(`day ${i + 1}: ${cur} demoted to technique (post-pull fatigue)`);
      out[i] = cur === "clean_strength" ? "clean_technique" : "snatch_technique";
    }
  }

  // Low readiness → force restoration mid-week
  if (ctx.readiness < 45 || ctx.fatigue > 75) {
    const mid = Math.floor(out.length / 2);
    if (out[mid] && isHeavy(out[mid])) {
      notes.push(`day ${mid + 1}: forced restoration (readiness ${ctx.readiness}, fatigue ${ctx.fatigue})`);
      out[mid] = "technical_restoration";
    }
  }

  return { picks: out, notes };
}

// ────────────────────────────────────────────────────────────
// 5. COMPETITION ADJUSTMENTS
// ────────────────────────────────────────────────────────────

function applyCompetitionTaper(
  picks: (DailyPriority | undefined)[],
  ctx: WeeklyStructureContext,
): { picks: (DailyPriority | undefined)[]; notes: string[] } {
  const notes: string[] = [];
  const days = ctx.competition_in_days;
  if (days === undefined || days > 14) return { picks, notes };

  const out = [...picks];

  if (days <= 3) {
    // sharpen only — no fatigue
    for (let i = 0; i < out.length; i++) {
      const p = out[i];
      if (!p) continue;
      if (isHeavy(p) && p !== "competition_specific") {
        out[i] = "technical_restoration";
        notes.push(`day ${i + 1}: removed heavy ${p} (≤3d to meet)`);
      }
    }
    if (out.length >= 2) out[1] = "competition_specific";
  } else if (days <= 7) {
    // increase specificity, reduce variation
    for (let i = 0; i < out.length; i++) {
      const p = out[i];
      if (p === "pull_strength" || p === "squat_strength") {
        out[i] = "competition_specific";
        notes.push(`day ${i + 1}: ${p} → competition_specific (taper week)`);
      }
    }
  } else {
    // 8–14d: reduce variation, no extra structural overload
    for (let i = 0; i < out.length; i++) {
      if (out[i] === "pull_strength") {
        out[i] = "clean_technique";
        notes.push(`day ${i + 1}: trimmed pull_strength (pre-taper)`);
      }
    }
  }

  return { picks: out, notes };
}

// ────────────────────────────────────────────────────────────
// 6. SECONDARY PRIORITIES
// ────────────────────────────────────────────────────────────
//
// A real week pairs each primary with a complementary secondary that fills
// gaps without stacking the same family.

function pickSecondary(
  primary: DailyPriority | undefined,
  ctx: WeeklyStructureContext,
): DailyPriority | undefined {
  if (!primary) return undefined;
  const l = PRIORITY_LOAD[primary];

  // restoration / recovery days stay clean
  if (primary === "recovery") return undefined;
  if (primary === "technical_restoration") return undefined;

  // protect overhead
  if (l.overhead >= 70) return "clean_technique";
  // strength day → add a touch of technique
  if (l.cns >= 75 && l.technical < 60) return "snatch_technique";
  // technique day → add modest strength stimulus
  if (l.technical >= 70 && l.cns < 60) return "squat_strength";
  // competition-specific → light overhead refinement
  if (primary === "competition_specific") return "jerk_technique";

  // accumulation default: layer pulls under classics
  if (ctx.training_phase === "accumulation" && l.pull < 50) {
    return "pull_strength";
  }
  return undefined;
}

// ────────────────────────────────────────────────────────────
// 7. PUBLIC API
// ────────────────────────────────────────────────────────────

export function buildWeeklyStructure(ctx: WeeklyStructureContext): WeeklyStructurePlan {
  const notes: string[] = [];
  const template = baseTemplate(ctx.training_phase, ctx.adaptation_target);
  let picks = distributeDays(template, ctx.training_days_per_week);

  const seq = applySequencingSafety(picks, ctx);
  picks = seq.picks;
  notes.push(...seq.notes);

  const taper = applyCompetitionTaper(picks, ctx);
  picks = taper.picks;
  notes.push(...taper.notes);

  const days: WeeklyDayStructure[] = picks.map((primary, i) => {
    const secondary = pickSecondary(primary, ctx);
    const load = combine(loadFor(primary), loadFor(secondary), 0.4);
    const dayNotes: string[] = [];

    const heavy = !!primary && isHeavy(primary);
    const restoration =
      primary === "recovery" || primary === "technical_restoration";

    if (heavy) dayNotes.push("heavy day — protect sleep and warm-up");
    if (restoration) dayNotes.push("restoration day — quality over load");
    if (load.overhead >= 75) dayNotes.push("high overhead stress");
    if (load.squat >= 75) dayNotes.push("high squat stress");
    if (load.pull >= 75) dayNotes.push("high pull stress");

    return {
      day_index: i + 1,
      primary_priority: primary,
      secondary_priority: secondary,
      expected_cns_load: Math.round(load.cns),
      expected_technical_load: Math.round(load.technical),
      expected_overhead_stress: Math.round(load.overhead),
      expected_squat_stress: Math.round(load.squat),
      expected_pull_stress: Math.round(load.pull),
      heavy_day: heavy || undefined,
      restoration_day: restoration || undefined,
      notes: dayNotes,
    };
  });

  // Final sanity: never two consecutive heavy_day flags slip through
  for (let i = 1; i < days.length; i++) {
    if (days[i].heavy_day && days[i - 1].heavy_day) {
      notes.push(`safety: demoted day ${i + 1} heavy flag (consecutive heavy)`);
      days[i].heavy_day = undefined;
      days[i].restoration_day = true;
      days[i].primary_priority = "technical_restoration";
      const l = PRIORITY_LOAD["technical_restoration"];
      days[i].expected_cns_load = l.cns;
      days[i].expected_technical_load = l.technical;
      days[i].expected_overhead_stress = l.overhead;
      days[i].expected_squat_stress = l.squat;
      days[i].expected_pull_stress = l.pull;
    }
  }

  return {
    days,
    weekly_cns_distribution: days.map((d) => d.expected_cns_load),
    weekly_overhead_distribution: days.map((d) => d.expected_overhead_stress),
    weekly_squat_distribution: days.map((d) => d.expected_squat_stress),
    notes,
  };
}
