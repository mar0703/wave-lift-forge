// ─────────────────────────────────────────────────────────────────────────────
// Mesocycle Planning Intelligence — VERSION 4
//
// Pure planning layer. Organizes 4–8 week adaptation blocks, sequences stress,
// progresses specificity, and coordinates microcycle direction. Does NOT
// generate workouts, does NOT pick exercises, does NOT mutate state.
//
// Architecture is forward-compatible with yearly / Olympic-cycle planning,
// AI forecasting, adaptation history, meet scheduling and auto-taper.
// ─────────────────────────────────────────────────────────────────────────────

import type { AdaptationTarget, MicrocycleState } from "./microcycle-engine";

// ────────────────────────────────────────────────────────────
// 1. TYPES
// ────────────────────────────────────────────────────────────

export type MesocycleGoal =
  | "competition_peak"
  | "strength_block"
  | "speed_block"
  | "technical_rebuild"
  | "work_capacity";

export type MesocyclePhase =
  | "accumulation"
  | "intensification"
  | "realization"
  | "peak"
  | "taper"
  | "deload";

export interface MesocycleWeek {
  week_index: number;             // 1-based
  phase: MesocyclePhase;
  primary_focus: string;

  adaptation_target: AdaptationTarget;

  // Biases are 0.6 – 1.4 multipliers (1.0 = neutral)
  volume_bias: number;
  intensity_bias: number;
  specificity_bias: number;
  technical_density_bias: number;
  recovery_bias: number;

  expected_fatigue: number;       // 0–100

  notes: string[];
}

export interface MesocycleContext {
  goal: MesocycleGoal;
  duration_weeks: number;         // 4–8 typical
  athlete_readiness: number;      // 0–100
  athlete_level?: string;         // "novice" | "intermediate" | "advanced" | ...
  competition_in_days?: number;
  recent_microcycles?: MicrocycleState[];
}

export interface MesocyclePlan {
  goal: MesocycleGoal;
  weeks: MesocycleWeek[];
  fatigue_curve: number[];
  specificity_curve: number[];
  intensity_curve: number[];
  notes: string[];
}

// ────────────────────────────────────────────────────────────
// 2. HELPERS
// ────────────────────────────────────────────────────────────

function clamp(n: number, lo: number, hi: number): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function clampBias(n: number): number {
  return clamp(n, 0.6, 1.4);
}

function clampDuration(n: number): number {
  return Math.round(clamp(n, 4, 8));
}

function recentFatigueAverage(ctx: MesocycleContext): number {
  const list = ctx.recent_microcycles ?? [];
  if (!list.length) return 50;
  const sum = list.reduce((a, m) => a + (m.fatigue_risk ?? 50), 0);
  return sum / list.length;
}

function readinessAdjust(readiness: number): number {
  // returns multiplicative tweak in [0.9, 1.1]
  if (readiness >= 75) return 1.05;
  if (readiness >= 55) return 1.0;
  if (readiness >= 40) return 0.95;
  return 0.9;
}

// ────────────────────────────────────────────────────────────
// 3. PHASE MAPPING PER GOAL
// ────────────────────────────────────────────────────────────

interface PhaseTemplate {
  phase: MesocyclePhase;
  primary_focus: string;
  adaptation_target: AdaptationTarget;
  volume_bias: number;
  intensity_bias: number;
  specificity_bias: number;
  technical_density_bias: number;
  recovery_bias: number;
  expected_fatigue: number;
}

function templatesForGoal(
  goal: MesocycleGoal,
  weeks: number,
): PhaseTemplate[] {
  // Build a normalized "shape" of the block, then we map to actual week count.
  switch (goal) {
    case "strength_block":
      return [
        { phase: "accumulation", primary_focus: "general strength accumulation",
          adaptation_target: "max_strength",
          volume_bias: 1.25, intensity_bias: 0.9, specificity_bias: 0.85,
          technical_density_bias: 0.95, recovery_bias: 1.0, expected_fatigue: 60 },
        { phase: "accumulation", primary_focus: "strength volume",
          adaptation_target: "max_strength",
          volume_bias: 1.2, intensity_bias: 0.95, specificity_bias: 0.9,
          technical_density_bias: 0.95, recovery_bias: 0.95, expected_fatigue: 70 },
        { phase: "intensification", primary_focus: "rising intensity",
          adaptation_target: "max_strength",
          volume_bias: 1.05, intensity_bias: 1.1, specificity_bias: 1.0,
          technical_density_bias: 0.9, recovery_bias: 0.95, expected_fatigue: 78 },
        { phase: "intensification", primary_focus: "heavy strength expression",
          adaptation_target: "max_strength",
          volume_bias: 0.95, intensity_bias: 1.2, specificity_bias: 1.05,
          technical_density_bias: 0.85, recovery_bias: 1.0, expected_fatigue: 82 },
        { phase: "realization", primary_focus: "strength realization",
          adaptation_target: "max_strength",
          volume_bias: 0.8, intensity_bias: 1.25, specificity_bias: 1.1,
          technical_density_bias: 0.85, recovery_bias: 1.05, expected_fatigue: 75 },
        { phase: "deload", primary_focus: "deload",
          adaptation_target: "technical_rebuild",
          volume_bias: 0.7, intensity_bias: 0.8, specificity_bias: 0.9,
          technical_density_bias: 1.05, recovery_bias: 1.3, expected_fatigue: 45 },
      ];

    case "speed_block":
      return [
        { phase: "accumulation", primary_focus: "speed exposure base",
          adaptation_target: "speed",
          volume_bias: 1.1, intensity_bias: 0.95, specificity_bias: 1.0,
          technical_density_bias: 1.05, recovery_bias: 1.05, expected_fatigue: 55 },
        { phase: "accumulation", primary_focus: "speed-strength",
          adaptation_target: "speed",
          volume_bias: 1.05, intensity_bias: 1.0, specificity_bias: 1.05,
          technical_density_bias: 1.05, recovery_bias: 1.0, expected_fatigue: 62 },
        { phase: "intensification", primary_focus: "bar speed expression",
          adaptation_target: "speed",
          volume_bias: 0.95, intensity_bias: 1.1, specificity_bias: 1.1,
          technical_density_bias: 1.0, recovery_bias: 1.0, expected_fatigue: 68 },
        { phase: "realization", primary_focus: "speed realization",
          adaptation_target: "speed",
          volume_bias: 0.85, intensity_bias: 1.15, specificity_bias: 1.15,
          technical_density_bias: 0.95, recovery_bias: 1.1, expected_fatigue: 65 },
        { phase: "deload", primary_focus: "speed deload",
          adaptation_target: "technical_rebuild",
          volume_bias: 0.7, intensity_bias: 0.8, specificity_bias: 1.0,
          technical_density_bias: 1.05, recovery_bias: 1.3, expected_fatigue: 40 },
      ];

    case "competition_peak":
      return [
        { phase: "accumulation", primary_focus: "specificity ramp",
          adaptation_target: "competition",
          volume_bias: 1.1, intensity_bias: 0.95, specificity_bias: 1.05,
          technical_density_bias: 1.0, recovery_bias: 1.0, expected_fatigue: 65 },
        { phase: "intensification", primary_focus: "classic lift density",
          adaptation_target: "competition",
          volume_bias: 1.0, intensity_bias: 1.1, specificity_bias: 1.2,
          technical_density_bias: 0.9, recovery_bias: 1.0, expected_fatigue: 75 },
        { phase: "intensification", primary_focus: "heavy classic exposure",
          adaptation_target: "competition",
          volume_bias: 0.9, intensity_bias: 1.2, specificity_bias: 1.25,
          technical_density_bias: 0.85, recovery_bias: 1.0, expected_fatigue: 80 },
        { phase: "realization", primary_focus: "opener / second-attempt work",
          adaptation_target: "competition",
          volume_bias: 0.8, intensity_bias: 1.25, specificity_bias: 1.3,
          technical_density_bias: 0.85, recovery_bias: 1.1, expected_fatigue: 70 },
        { phase: "taper", primary_focus: "taper",
          adaptation_target: "competition",
          volume_bias: 0.6, intensity_bias: 1.1, specificity_bias: 1.2,
          technical_density_bias: 0.85, recovery_bias: 1.25, expected_fatigue: 50 },
        { phase: "peak", primary_focus: "competition peak",
          adaptation_target: "competition",
          volume_bias: 0.5, intensity_bias: 1.15, specificity_bias: 1.25,
          technical_density_bias: 0.85, recovery_bias: 1.3, expected_fatigue: 35 },
      ];

    case "technical_rebuild":
      return [
        { phase: "accumulation", primary_focus: "positional restoration",
          adaptation_target: "technical_rebuild",
          volume_bias: 1.0, intensity_bias: 0.75, specificity_bias: 0.9,
          technical_density_bias: 1.3, recovery_bias: 1.15, expected_fatigue: 45 },
        { phase: "accumulation", primary_focus: "movement pattern depth",
          adaptation_target: "technical_rebuild",
          volume_bias: 1.05, intensity_bias: 0.8, specificity_bias: 0.95,
          technical_density_bias: 1.25, recovery_bias: 1.1, expected_fatigue: 50 },
        { phase: "intensification", primary_focus: "technical under load",
          adaptation_target: "technical_rebuild",
          volume_bias: 1.0, intensity_bias: 0.9, specificity_bias: 1.0,
          technical_density_bias: 1.2, recovery_bias: 1.05, expected_fatigue: 58 },
        { phase: "realization", primary_focus: "reintroduce intensity",
          adaptation_target: "technical_rebuild",
          volume_bias: 0.9, intensity_bias: 1.0, specificity_bias: 1.05,
          technical_density_bias: 1.1, recovery_bias: 1.05, expected_fatigue: 60 },
        { phase: "deload", primary_focus: "deload",
          adaptation_target: "technical_rebuild",
          volume_bias: 0.7, intensity_bias: 0.8, specificity_bias: 0.95,
          technical_density_bias: 1.1, recovery_bias: 1.3, expected_fatigue: 40 },
      ];

    case "work_capacity":
      return [
        { phase: "accumulation", primary_focus: "general work capacity",
          adaptation_target: "work_capacity",
          volume_bias: 1.3, intensity_bias: 0.85, specificity_bias: 0.85,
          technical_density_bias: 1.0, recovery_bias: 1.0, expected_fatigue: 60 },
        { phase: "accumulation", primary_focus: "extended work capacity",
          adaptation_target: "work_capacity",
          volume_bias: 1.35, intensity_bias: 0.9, specificity_bias: 0.9,
          technical_density_bias: 1.0, recovery_bias: 0.95, expected_fatigue: 70 },
        { phase: "intensification", primary_focus: "strength under volume",
          adaptation_target: "work_capacity",
          volume_bias: 1.2, intensity_bias: 1.0, specificity_bias: 0.95,
          technical_density_bias: 0.95, recovery_bias: 0.95, expected_fatigue: 78 },
        { phase: "realization", primary_focus: "expressed strength",
          adaptation_target: "max_strength",
          volume_bias: 0.95, intensity_bias: 1.1, specificity_bias: 1.05,
          technical_density_bias: 0.9, recovery_bias: 1.05, expected_fatigue: 72 },
        { phase: "deload", primary_focus: "deload",
          adaptation_target: "technical_rebuild",
          volume_bias: 0.7, intensity_bias: 0.8, specificity_bias: 0.95,
          technical_density_bias: 1.05, recovery_bias: 1.3, expected_fatigue: 42 },
      ];
  }
}

// Map a normalized template list to the requested week count by stretching or
// compressing — preserves the deload as the final week when present.
function fitTemplatesToWeeks(
  templates: PhaseTemplate[],
  weeks: number,
): PhaseTemplate[] {
  const last = templates[templates.length - 1];
  const hasDeloadTail = last.phase === "deload" || last.phase === "peak";
  const tail = hasDeloadTail ? last : null;
  const body = hasDeloadTail ? templates.slice(0, -1) : templates;

  const targetBody = tail ? weeks - 1 : weeks;
  if (targetBody <= 0) return [last];

  const out: PhaseTemplate[] = [];
  for (let i = 0; i < targetBody; i++) {
    const idx = Math.min(
      body.length - 1,
      Math.round((i / Math.max(1, targetBody - 1)) * (body.length - 1)),
    );
    out.push(body[idx]);
  }
  if (tail) out.push(tail);
  return out;
}

// ────────────────────────────────────────────────────────────
// 4. CONTEXT-DRIVEN ADJUSTMENTS
// ────────────────────────────────────────────────────────────

function applyContextAdjustments(
  weeks: MesocycleWeek[],
  ctx: MesocycleContext,
): { weeks: MesocycleWeek[]; notes: string[] } {
  const notes: string[] = [];
  const recentFatigue = recentFatigueAverage(ctx);
  const readinessTweak = readinessAdjust(ctx.athlete_readiness);

  // Auto-taper: if a competition is near, shrink intensity/volume in final weeks
  const compIn = ctx.competition_in_days;

  return {
    notes,
    weeks: weeks.map((w, i) => {
      const adjusted: MesocycleWeek = { ...w, notes: [...w.notes] };

      // Readiness modulation
      adjusted.volume_bias = clampBias(adjusted.volume_bias * readinessTweak);
      adjusted.intensity_bias = clampBias(
        adjusted.intensity_bias * readinessTweak,
      );

      // High recent fatigue → soften early-block accumulation
      if (recentFatigue >= 70 && adjusted.phase === "accumulation") {
        adjusted.volume_bias = clampBias(adjusted.volume_bias * 0.9);
        adjusted.recovery_bias = clampBias(adjusted.recovery_bias * 1.1);
        adjusted.notes.push("Softened accumulation due to elevated recent fatigue.");
      }

      // Auto-taper window
      if (compIn !== undefined && compIn >= 0) {
        const weeksToComp = Math.ceil(compIn / 7);
        const weeksRemaining = weeks.length - i;
        if (weeksRemaining <= 2 && weeksToComp <= 2) {
          adjusted.volume_bias = clampBias(adjusted.volume_bias * 0.8);
          adjusted.recovery_bias = clampBias(adjusted.recovery_bias * 1.15);
          adjusted.specificity_bias = clampBias(
            adjusted.specificity_bias * 1.05,
          );
          adjusted.notes.push("Auto-taper applied (competition window).");
        }
      }

      // Safety: cap expected fatigue ramp; never let two consecutive weeks
      // both exceed 80 without a corresponding recovery boost.
      if (adjusted.expected_fatigue > 85) {
        adjusted.expected_fatigue = 85;
        adjusted.recovery_bias = clampBias(adjusted.recovery_bias * 1.05);
        adjusted.notes.push("Capped expected fatigue at 85 (safety).");
      }

      return adjusted;
    }),
  };
}

function enforceFatigueCeiling(weeks: MesocycleWeek[]): void {
  for (let i = 1; i < weeks.length; i++) {
    if (
      weeks[i].expected_fatigue >= 78 &&
      weeks[i - 1].expected_fatigue >= 78 &&
      weeks[i].phase !== "deload" &&
      weeks[i].phase !== "taper"
    ) {
      weeks[i].volume_bias = clampBias(weeks[i].volume_bias * 0.9);
      weeks[i].recovery_bias = clampBias(weeks[i].recovery_bias * 1.1);
      weeks[i].expected_fatigue = Math.max(72, weeks[i].expected_fatigue - 6);
      weeks[i].notes.push(
        "Fatigue ceiling enforced: prevent chronic accumulation.",
      );
    }
  }
}

// ────────────────────────────────────────────────────────────
// 5. PUBLIC API
// ────────────────────────────────────────────────────────────

export function buildMesocyclePlan(ctx: MesocycleContext): MesocyclePlan {
  const duration = clampDuration(ctx.duration_weeks);
  const templates = templatesForGoal(ctx.goal, duration);
  const fitted = fitTemplatesToWeeks(templates, duration);

  const baseWeeks: MesocycleWeek[] = fitted.map((t, i) => ({
    week_index: i + 1,
    phase: t.phase,
    primary_focus: t.primary_focus,
    adaptation_target: t.adaptation_target,
    volume_bias: clampBias(t.volume_bias),
    intensity_bias: clampBias(t.intensity_bias),
    specificity_bias: clampBias(t.specificity_bias),
    technical_density_bias: clampBias(t.technical_density_bias),
    recovery_bias: clampBias(t.recovery_bias),
    expected_fatigue: clamp(t.expected_fatigue, 0, 100),
    notes: [],
  }));

  const adjusted = applyContextAdjustments(baseWeeks, ctx);
  enforceFatigueCeiling(adjusted.weeks);

  const fatigue_curve = adjusted.weeks.map((w) => w.expected_fatigue);
  const specificity_curve = adjusted.weeks.map((w) => w.specificity_bias);
  const intensity_curve = adjusted.weeks.map((w) => w.intensity_bias);

  const notes = [
    `Mesocycle goal: ${ctx.goal} (${duration} weeks).`,
    ...adjusted.notes,
  ];

  return {
    goal: ctx.goal,
    weeks: adjusted.weeks,
    fatigue_curve,
    specificity_curve,
    intensity_curve,
    notes,
  };
}

// ────────────────────────────────────────────────────────────
// 6. MICROCYCLE COORDINATION
// ────────────────────────────────────────────────────────────

export interface MicrocycleDirective {
  adaptation_target: AdaptationTarget;
  volume_bias: number;
  intensity_bias: number;
  specificity_bias: number;
  technical_density_bias: number;
  recovery_bias: number;
  notes: string[];
}

export function getMicrocycleDirective(
  plan: MesocyclePlan,
  weekIndex: number,
): MicrocycleDirective | null {
  const w = plan.weeks.find((x) => x.week_index === weekIndex);
  if (!w) return null;
  return {
    adaptation_target: w.adaptation_target,
    volume_bias: w.volume_bias,
    intensity_bias: w.intensity_bias,
    specificity_bias: w.specificity_bias,
    technical_density_bias: w.technical_density_bias,
    recovery_bias: w.recovery_bias,
    notes: [w.primary_focus, ...w.notes],
  };
}
