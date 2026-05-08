// ─────────────────────────────────────────────────────────────────────────────
// Macrocycle Planning Intelligence — VERSION 5
//
// Pure long-term planning layer. Coordinates mesocycles across 2–6 months,
// distributes adaptation targets, schedules overload + restoration, and
// manages taper timing around competitions. Does NOT generate workouts,
// does NOT pick exercises, does NOT mutate state.
//
// Forward-compatible with AI forecasting, adaptation memory, HRV/wearable
// integration, Olympic-cycle planning, and coach override systems.
// ─────────────────────────────────────────────────────────────────────────────

import type { AdaptationTarget } from "./microcycle-engine";
import type { MesocycleGoal, MesocyclePlan } from "./mesocycle-engine";

// ────────────────────────────────────────────────────────────
// 1. TYPES
// ────────────────────────────────────────────────────────────

export type MacrocycleGoal =
  | "competition_season"
  | "long_term_development"
  | "elite_peak"
  | "technical_rebuild"
  | "strength_rebuild";

export type CompetitionImportance = "low" | "medium" | "high" | "priority";

export interface CompetitionTarget {
  date?: string;                 // ISO date
  importance: CompetitionImportance;
  notes?: string[];
}

export interface MacrocycleBlock {
  block_index: number;           // 1-based
  duration_weeks: number;        // 4–8 typically
  mesocycle_goal: MesocycleGoal;
  adaptation_target: AdaptationTarget;

  volume_bias: number;           // 0.6 – 1.4
  intensity_bias: number;        // 0.6 – 1.4
  specificity_bias: number;      // 0.6 – 1.4

  fatigue_target: number;        // 0–100 expected average

  taper_required?: boolean;
  competition_target?: CompetitionTarget;

  notes: string[];
}

export interface MacrocycleContext {
  start_date?: string;           // ISO date
  duration_weeks: number;        // total horizon
  athlete_level?: string;        // novice | intermediate | advanced | elite
  competition_targets?: CompetitionTarget[];
  long_term_goal?: MacrocycleGoal;
  recent_mesocycles?: MesocyclePlan[];
}

export interface MacrocyclePlan {
  blocks: MacrocycleBlock[];
  competition_targets?: CompetitionTarget[];
  fatigue_curve: number[];       // per-block expected fatigue
  specificity_curve: number[];   // per-block specificity bias
  intensity_curve: number[];     // per-block intensity bias
  notes: string[];
}

// ────────────────────────────────────────────────────────────
// 2. HELPERS
// ────────────────────────────────────────────────────────────

const MS_DAY = 24 * 60 * 60 * 1000;

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function clampBias(n: number): number {
  return clamp(n, 0.6, 1.4);
}

function parseDate(d?: string): Date | null {
  if (!d) return null;
  const t = Date.parse(d);
  return Number.isNaN(t) ? null : new Date(t);
}

function weeksBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (7 * MS_DAY));
}

function chooseBlockDuration(level?: string): number {
  switch (level) {
    case "novice":       return 4;
    case "intermediate": return 5;
    case "advanced":     return 6;
    case "elite":        return 4; // shorter, more rotation
    default:             return 5;
  }
}

function importanceWeight(i: CompetitionImportance): number {
  switch (i) {
    case "priority": return 1.0;
    case "high":     return 0.8;
    case "medium":   return 0.5;
    case "low":      return 0.25;
  }
}

// ────────────────────────────────────────────────────────────
// 3. BLOCK TEMPLATES (sequence of mesocycle goals)
// ────────────────────────────────────────────────────────────

interface BlockSeed {
  mesocycle_goal: MesocycleGoal;
  adaptation_target: AdaptationTarget;
  volume_bias: number;
  intensity_bias: number;
  specificity_bias: number;
  fatigue_target: number;
}

function seasonSequence(goal: MacrocycleGoal): BlockSeed[] {
  switch (goal) {
    case "competition_season":
      return [
        { mesocycle_goal: "work_capacity",     adaptation_target: "work_capacity",
          volume_bias: 1.25, intensity_bias: 0.9, specificity_bias: 0.85, fatigue_target: 65 },
        { mesocycle_goal: "strength_block",    adaptation_target: "max_strength",
          volume_bias: 1.1,  intensity_bias: 1.05, specificity_bias: 0.95, fatigue_target: 72 },
        { mesocycle_goal: "speed_block",       adaptation_target: "speed",
          volume_bias: 0.95, intensity_bias: 1.1,  specificity_bias: 1.05, fatigue_target: 65 },
        { mesocycle_goal: "competition_peak",  adaptation_target: "competition",
          volume_bias: 0.8,  intensity_bias: 1.2,  specificity_bias: 1.25, fatigue_target: 60 },
        { mesocycle_goal: "technical_rebuild", adaptation_target: "technical_rebuild",
          volume_bias: 0.9,  intensity_bias: 0.85, specificity_bias: 0.95, fatigue_target: 45 },
      ];

    case "long_term_development":
      return [
        { mesocycle_goal: "work_capacity",     adaptation_target: "work_capacity",
          volume_bias: 1.3,  intensity_bias: 0.85, specificity_bias: 0.85, fatigue_target: 60 },
        { mesocycle_goal: "technical_rebuild", adaptation_target: "technical_rebuild",
          volume_bias: 1.0,  intensity_bias: 0.85, specificity_bias: 0.95, fatigue_target: 50 },
        { mesocycle_goal: "strength_block",    adaptation_target: "max_strength",
          volume_bias: 1.15, intensity_bias: 1.05, specificity_bias: 0.95, fatigue_target: 70 },
        { mesocycle_goal: "speed_block",       adaptation_target: "speed",
          volume_bias: 0.95, intensity_bias: 1.1,  specificity_bias: 1.05, fatigue_target: 62 },
        { mesocycle_goal: "competition_peak",  adaptation_target: "competition",
          volume_bias: 0.85, intensity_bias: 1.15, specificity_bias: 1.2,  fatigue_target: 58 },
      ];

    case "elite_peak":
      return [
        { mesocycle_goal: "strength_block",    adaptation_target: "max_strength",
          volume_bias: 1.05, intensity_bias: 1.1,  specificity_bias: 1.0,  fatigue_target: 72 },
        { mesocycle_goal: "speed_block",       adaptation_target: "speed",
          volume_bias: 0.9,  intensity_bias: 1.15, specificity_bias: 1.1,  fatigue_target: 65 },
        { mesocycle_goal: "competition_peak",  adaptation_target: "competition",
          volume_bias: 0.8,  intensity_bias: 1.2,  specificity_bias: 1.3,  fatigue_target: 55 },
        { mesocycle_goal: "technical_rebuild", adaptation_target: "technical_rebuild",
          volume_bias: 0.85, intensity_bias: 0.85, specificity_bias: 0.95, fatigue_target: 42 },
      ];

    case "technical_rebuild":
      return [
        { mesocycle_goal: "technical_rebuild", adaptation_target: "technical_rebuild",
          volume_bias: 1.0,  intensity_bias: 0.8,  specificity_bias: 0.9,  fatigue_target: 50 },
        { mesocycle_goal: "technical_rebuild", adaptation_target: "technical_rebuild",
          volume_bias: 1.05, intensity_bias: 0.9,  specificity_bias: 1.0,  fatigue_target: 55 },
        { mesocycle_goal: "strength_block",    adaptation_target: "max_strength",
          volume_bias: 1.05, intensity_bias: 1.0,  specificity_bias: 1.0,  fatigue_target: 65 },
        { mesocycle_goal: "speed_block",       adaptation_target: "speed",
          volume_bias: 0.95, intensity_bias: 1.05, specificity_bias: 1.05, fatigue_target: 58 },
      ];

    case "strength_rebuild":
      return [
        { mesocycle_goal: "work_capacity",     adaptation_target: "work_capacity",
          volume_bias: 1.25, intensity_bias: 0.85, specificity_bias: 0.85, fatigue_target: 60 },
        { mesocycle_goal: "strength_block",    adaptation_target: "max_strength",
          volume_bias: 1.2,  intensity_bias: 1.05, specificity_bias: 0.95, fatigue_target: 72 },
        { mesocycle_goal: "strength_block",    adaptation_target: "max_strength",
          volume_bias: 1.05, intensity_bias: 1.15, specificity_bias: 1.0,  fatigue_target: 75 },
        { mesocycle_goal: "technical_rebuild", adaptation_target: "technical_rebuild",
          volume_bias: 0.9,  intensity_bias: 0.85, specificity_bias: 0.95, fatigue_target: 45 },
        { mesocycle_goal: "competition_peak",  adaptation_target: "competition",
          volume_bias: 0.85, intensity_bias: 1.15, specificity_bias: 1.2,  fatigue_target: 60 },
      ];
  }
}

// ────────────────────────────────────────────────────────────
// 4. SAFETY / ROTATION CONSTRAINTS
// ────────────────────────────────────────────────────────────

const MAX_CONSECUTIVE_ACCUMULATION = 2; // mesocycles
const RESTORATION_INTERVAL_BLOCKS = 3;  // insert technical_rebuild after N intense blocks

function isHighStress(seed: BlockSeed): boolean {
  return seed.fatigue_target >= 65 || seed.intensity_bias >= 1.1;
}

function rotateForLongevity(seeds: BlockSeed[]): BlockSeed[] {
  const out: BlockSeed[] = [];
  let consecutiveStress = 0;
  for (const s of seeds) {
    if (isHighStress(s)) {
      consecutiveStress += 1;
    } else {
      consecutiveStress = 0;
    }
    if (consecutiveStress > MAX_CONSECUTIVE_ACCUMULATION) {
      out.push({
        mesocycle_goal: "technical_rebuild",
        adaptation_target: "technical_rebuild",
        volume_bias: 0.9,
        intensity_bias: 0.8,
        specificity_bias: 0.95,
        fatigue_target: 45,
      });
      consecutiveStress = 0;
    }
    out.push(s);
  }
  // Periodic restoration injection
  if (out.length >= RESTORATION_INTERVAL_BLOCKS) {
    const hasRestoration = out.some(
      (s) => s.mesocycle_goal === "technical_rebuild",
    );
    if (!hasRestoration) {
      const idx = Math.min(out.length - 1, RESTORATION_INTERVAL_BLOCKS);
      out.splice(idx, 0, {
        mesocycle_goal: "technical_rebuild",
        adaptation_target: "technical_rebuild",
        volume_bias: 0.9,
        intensity_bias: 0.8,
        specificity_bias: 0.95,
        fatigue_target: 45,
      });
    }
  }
  return out;
}

// ────────────────────────────────────────────────────────────
// 5. COMPETITION COORDINATION
// ────────────────────────────────────────────────────────────

function alignToCompetitions(
  blocks: MacrocycleBlock[],
  startDate: Date | null,
  competitions: CompetitionTarget[],
): { blocks: MacrocycleBlock[]; notes: string[] } {
  const notes: string[] = [];
  if (!startDate || !competitions.length) return { blocks, notes };

  // Map each competition to the block that ends nearest its date.
  const sortedComps = [...competitions]
    .filter((c) => parseDate(c.date))
    .sort(
      (a, b) => parseDate(a.date)!.getTime() - parseDate(b.date)!.getTime(),
    );

  let cursorWeek = 0;
  const blockEnds = blocks.map((b) => {
    cursorWeek += b.duration_weeks;
    return cursorWeek;
  });

  for (const comp of sortedComps) {
    const compWeek = weeksBetween(startDate, parseDate(comp.date)!);
    if (compWeek < 0) continue;

    // Find block whose end-week is closest (>=) to compWeek
    let chosenIdx = -1;
    let bestDelta = Infinity;
    for (let i = 0; i < blocks.length; i++) {
      const delta = Math.abs(blockEnds[i] - compWeek);
      if (delta < bestDelta) {
        bestDelta = delta;
        chosenIdx = i;
      }
    }
    if (chosenIdx < 0) continue;

    const w = importanceWeight(comp.importance);
    const block = blocks[chosenIdx];

    // Priority/high → coerce to competition_peak with full taper
    if (comp.importance === "priority" || comp.importance === "high") {
      block.mesocycle_goal = "competition_peak";
      block.adaptation_target = "competition";
      block.taper_required = true;
      block.volume_bias = clampBias(block.volume_bias * (1 - 0.2 * w));
      block.intensity_bias = clampBias(block.intensity_bias * (1 + 0.05 * w));
      block.specificity_bias = clampBias(
        block.specificity_bias * (1 + 0.2 * w),
      );
      block.fatigue_target = clamp(block.fatigue_target - 10 * w, 30, 80);
      block.notes.push(
        `Aligned to ${comp.importance} competition (taper enforced).`,
      );
    } else {
      // Medium / low → partial sharpening, no full taper
      block.taper_required = false;
      block.specificity_bias = clampBias(
        block.specificity_bias * (1 + 0.1 * w),
      );
      block.volume_bias = clampBias(block.volume_bias * (1 - 0.05 * w));
      block.notes.push(
        `Sharpening for ${comp.importance} competition (no full taper).`,
      );
    }
    block.competition_target = comp;
  }

  // Avoid repeated peak collapse: never two consecutive competition_peak blocks
  for (let i = 1; i < blocks.length; i++) {
    if (
      blocks[i].mesocycle_goal === "competition_peak" &&
      blocks[i - 1].mesocycle_goal === "competition_peak"
    ) {
      blocks[i - 1].mesocycle_goal = "speed_block";
      blocks[i - 1].adaptation_target = "speed";
      blocks[i - 1].taper_required = false;
      blocks[i - 1].notes.push(
        "Demoted to speed_block: avoid consecutive peaks.",
      );
      notes.push(
        `Block ${blocks[i - 1].block_index} demoted to prevent double peak.`,
      );
    }
  }

  return { blocks, notes };
}

// ────────────────────────────────────────────────────────────
// 6. PUBLIC API
// ────────────────────────────────────────────────────────────

export function buildMacrocyclePlan(ctx: MacrocycleContext): MacrocyclePlan {
  const goal: MacrocycleGoal = ctx.long_term_goal ?? "long_term_development";
  const totalWeeks = clamp(ctx.duration_weeks, 8, 52);
  const blockWeeks = chooseBlockDuration(ctx.athlete_level);

  // Build seed sequence by repeating template until horizon is filled
  const template = seasonSequence(goal);
  const seeds: BlockSeed[] = [];
  let weeksFilled = 0;
  let i = 0;
  while (weeksFilled < totalWeeks) {
    seeds.push(template[i % template.length]);
    weeksFilled += blockWeeks;
    i += 1;
    if (i > 32) break; // safety
  }

  const rotated = rotateForLongevity(seeds);

  let blocks: MacrocycleBlock[] = rotated.map((s, idx) => ({
    block_index: idx + 1,
    duration_weeks: blockWeeks,
    mesocycle_goal: s.mesocycle_goal,
    adaptation_target: s.adaptation_target,
    volume_bias: clampBias(s.volume_bias),
    intensity_bias: clampBias(s.intensity_bias),
    specificity_bias: clampBias(s.specificity_bias),
    fatigue_target: clamp(s.fatigue_target, 30, 85),
    taper_required: s.mesocycle_goal === "competition_peak",
    notes: [],
  }));

  // Trim to exact horizon if oversized
  let acc = 0;
  blocks = blocks.filter((b) => {
    if (acc >= totalWeeks) return false;
    acc += b.duration_weeks;
    return true;
  });

  const startDate = parseDate(ctx.start_date);
  const aligned = alignToCompetitions(
    blocks,
    startDate,
    ctx.competition_targets ?? [],
  );

  // Long-term safety: enforce restoration if the tail is too hot
  for (let k = 1; k < aligned.blocks.length; k++) {
    if (
      aligned.blocks[k].fatigue_target >= 75 &&
      aligned.blocks[k - 1].fatigue_target >= 75 &&
      aligned.blocks[k].mesocycle_goal !== "technical_rebuild"
    ) {
      aligned.blocks[k].fatigue_target = 65;
      aligned.blocks[k].volume_bias = clampBias(
        aligned.blocks[k].volume_bias * 0.9,
      );
      aligned.blocks[k].notes.push(
        "Long-term fatigue ceiling enforced (chronic accumulation guard).",
      );
    }
  }

  const fatigue_curve = aligned.blocks.map((b) => b.fatigue_target);
  const specificity_curve = aligned.blocks.map((b) => b.specificity_bias);
  const intensity_curve = aligned.blocks.map((b) => b.intensity_bias);

  const notes = [
    `Macrocycle goal: ${goal} (${totalWeeks} weeks, ${aligned.blocks.length} blocks).`,
    ...aligned.notes,
  ];

  return {
    blocks: aligned.blocks,
    competition_targets: ctx.competition_targets,
    fatigue_curve,
    specificity_curve,
    intensity_curve,
    notes,
  };
}

// ────────────────────────────────────────────────────────────
// 7. MESOCYCLE COORDINATION
// ────────────────────────────────────────────────────────────

export interface MesocycleDirective {
  mesocycle_goal: MesocycleGoal;
  adaptation_target: AdaptationTarget;
  volume_bias: number;
  intensity_bias: number;
  specificity_bias: number;
  fatigue_target: number;
  taper_required: boolean;
  notes: string[];
}

export function getMesocycleDirective(
  plan: MacrocyclePlan,
  blockIndex: number,
): MesocycleDirective | null {
  const b = plan.blocks.find((x) => x.block_index === blockIndex);
  if (!b) return null;
  return {
    mesocycle_goal: b.mesocycle_goal,
    adaptation_target: b.adaptation_target,
    volume_bias: b.volume_bias,
    intensity_bias: b.intensity_bias,
    specificity_bias: b.specificity_bias,
    fatigue_target: b.fatigue_target,
    taper_required: !!b.taper_required,
    notes: [...b.notes],
  };
}
