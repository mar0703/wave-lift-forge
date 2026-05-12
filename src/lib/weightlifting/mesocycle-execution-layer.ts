// Mesocycle Execution Integration Layer
//
// Pure strategic adapter between macrocycle planning, mesocycle planning,
// weekly structure and orchestrator runtime. This module does not generate
// workouts, select exercises, mutate state, or create an alternate pipeline.

import type { MacrocycleBlock, MacrocyclePlan, MesocycleDirective } from "./macrocycle-engine";
import { getMesocycleDirective } from "./macrocycle-engine";
import type {
  MesocyclePhase,
  MesocyclePlan,
  MesocycleWeek,
} from "./mesocycle-engine";
import { buildMesocyclePlan, getMicrocycleDirective } from "./mesocycle-engine";
import type { AdaptationTarget, MicrocycleState } from "./microcycle-engine";
import type { TrainingPhase } from "./daily-priority-engine";
import type { WeeklyStructurePlan } from "./weekly-structure-engine";
import { buildWeeklyStructure } from "./weekly-structure-engine";
import type { AthleteState } from "../state/athlete-state";

export type PhaseIntent =
  | "build_capacity"
  | "raise_intensity"
  | "express_adaptation"
  | "competition_readiness"
  | "restore_quality";

export type TaperState = "none" | "pre_taper" | "taper" | "peak";

export interface MesocycleExecutionInput {
  macrocycle_plan?: MacrocyclePlan;
  active_block_index?: number;
  active_week_index?: number;
  active_training_day_index?: number;

  mesocycle_plan?: MesocyclePlan;
  weekly_structure?: WeeklyStructurePlan;
  training_days_per_week?: number;

  readiness: number;
  fatigue: number;
  competition_in_days?: number;
  athlete_level?: string;
  recent_microcycles?: MicrocycleState[];

  fallback_adaptation_target?: AdaptationTarget;
  fallback_training_phase?: TrainingPhase;

  // ── State layer (additive) ──
  state?: AthleteState;
}

export interface ActiveMacrocyclePhase {
  block_index?: number;
  duration_weeks?: number;
  mesocycle_goal?: MesocycleDirective["mesocycle_goal"];
  adaptation_target: AdaptationTarget;
  taper_required: boolean;
  notes: string[];
}

export interface WeeklyDirection {
  day_index?: number;
  weekly_structure?: WeeklyStructurePlan;
  notes: string[];
}

export interface MesocycleExecutionContext {
  active_macrocycle_phase: ActiveMacrocyclePhase;
  weekly_direction: WeeklyDirection;

  adaptation_target: AdaptationTarget;
  training_phase: TrainingPhase;
  phase_intent: PhaseIntent;
  taper_state: TaperState;
  specificity_pressure: number;
  notes: string[];
}

const DEFAULT_ADAPTATION_TARGET: AdaptationTarget = "technical_rebuild";
const DEFAULT_TRAINING_PHASE: TrainingPhase = "accumulation";

function clamp(n: number, lo = 0, hi = 1): number {
  if (Number.isNaN(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function asTrainingPhase(phase?: MesocyclePhase, fallback: TrainingPhase = DEFAULT_TRAINING_PHASE): TrainingPhase {
  if (!phase) return fallback;
  if (phase === "taper") return "peak";
  return phase;
}

function resolveActiveBlock(
  plan: MacrocyclePlan | undefined,
  blockIndex: number,
): MacrocycleBlock | undefined {
  if (!plan?.blocks.length) return undefined;
  return plan.blocks.find((b) => b.block_index === blockIndex) ?? plan.blocks[0];
}

export function resolveActiveMacrocyclePhase(input: MesocycleExecutionInput): ActiveMacrocyclePhase {
  const blockIndex = Math.max(1, Math.round(input.active_block_index ?? 1));
  const block = resolveActiveBlock(input.macrocycle_plan, blockIndex);
  const directive = input.macrocycle_plan
    ? getMesocycleDirective(input.macrocycle_plan, block?.block_index ?? blockIndex)
    : null;

  const adaptationTarget =
    directive?.adaptation_target ??
    block?.adaptation_target ??
    input.fallback_adaptation_target ??
    DEFAULT_ADAPTATION_TARGET;

  return {
    block_index: block?.block_index,
    duration_weeks: block?.duration_weeks,
    mesocycle_goal: directive?.mesocycle_goal ?? block?.mesocycle_goal,
    adaptation_target: adaptationTarget,
    taper_required: directive?.taper_required ?? !!block?.taper_required,
    notes: [...(directive?.notes ?? block?.notes ?? [])],
  };
}

export function resolveActiveMesocycleDirective(
  input: MesocycleExecutionInput,
): MesocycleDirective | undefined {
  const blockIndex = Math.max(1, Math.round(input.active_block_index ?? 1));
  if (!input.macrocycle_plan) return undefined;
  return getMesocycleDirective(input.macrocycle_plan, blockIndex) ?? undefined;
}

export function resolveMesocyclePlan(
  input: MesocycleExecutionInput,
  directive: MesocycleDirective | undefined,
  activeMacrocyclePhase: ActiveMacrocyclePhase,
): MesocyclePlan | undefined {
  if (input.mesocycle_plan) return input.mesocycle_plan;
  const goal = directive?.mesocycle_goal ?? activeMacrocyclePhase.mesocycle_goal;
  if (!goal) return undefined;

  return buildMesocyclePlan({
    goal,
    duration_weeks: activeMacrocyclePhase.duration_weeks ?? 4,
    athlete_readiness: input.readiness,
    athlete_level: input.athlete_level,
    competition_in_days: input.competition_in_days,
    recent_microcycles: input.recent_microcycles,
    state: input.state,
  });
}

export function resolveActiveMesocycleWeek(
  plan: MesocyclePlan | undefined,
  weekIndex: number | undefined,
): MesocycleWeek | undefined {
  if (!plan?.weeks.length) return undefined;
  const index = Math.max(1, Math.round(weekIndex ?? 1));
  return plan.weeks.find((w) => w.week_index === index) ?? plan.weeks[0];
}

export function resolvePhaseIntent(
  phase: TrainingPhase,
  adaptationTarget: AdaptationTarget,
  taperState: TaperState,
): PhaseIntent {
  if (taperState === "taper" || taperState === "peak") return "competition_readiness";
  if (phase === "deload" || adaptationTarget === "technical_rebuild") return "restore_quality";
  if (phase === "accumulation" || adaptationTarget === "work_capacity") return "build_capacity";
  if (phase === "intensification" || adaptationTarget === "max_strength") return "raise_intensity";
  return "express_adaptation";
}

export function resolveTaperState(
  activeMacrocyclePhase: ActiveMacrocyclePhase,
  activeWeek: MesocycleWeek | undefined,
  competitionInDays: number | undefined,
): TaperState {
  if (activeWeek?.phase === "peak") return "peak";
  if (activeWeek?.phase === "taper") return "taper";
  if (competitionInDays !== undefined && competitionInDays <= 7) return "taper";
  if (competitionInDays !== undefined && competitionInDays <= 21) return "pre_taper";
  if (activeMacrocyclePhase.taper_required) return "pre_taper";
  return "none";
}

export function resolveSpecificityPressure(
  activeMacrocyclePhase: ActiveMacrocyclePhase,
  activeWeek: MesocycleWeek | undefined,
  taperState: TaperState,
  competitionInDays: number | undefined,
): number {
  const weekPressure = activeWeek ? clamp((activeWeek.specificity_bias - 0.6) / 0.8) : 0;
  const targetPressure = activeMacrocyclePhase.adaptation_target === "competition" ? 0.8 : 0;
  const taperPressure = taperState === "peak" ? 1 : taperState === "taper" ? 0.9 : taperState === "pre_taper" ? 0.65 : 0;
  const competitionPressure =
    competitionInDays === undefined ? 0 :
    competitionInDays <= 7 ? 1 :
    competitionInDays <= 21 ? 0.75 :
    competitionInDays <= 42 ? 0.45 :
    0;

  return clamp(Math.max(weekPressure, targetPressure, taperPressure, competitionPressure));
}

export function buildMesocycleExecutionContext(
  input: MesocycleExecutionInput,
): MesocycleExecutionContext {
  const activeMacrocyclePhase = resolveActiveMacrocyclePhase(input);
  const mesocycleDirective = resolveActiveMesocycleDirective(input);
  const mesocyclePlan = resolveMesocyclePlan(input, mesocycleDirective, activeMacrocyclePhase);
  const activeWeek = resolveActiveMesocycleWeek(mesocyclePlan, input.active_week_index);
  const microcycleDirective = mesocyclePlan
    ? getMicrocycleDirective(mesocyclePlan, activeWeek?.week_index ?? input.active_week_index ?? 1) ?? undefined
    : undefined;

  const adaptationTarget =
    microcycleDirective?.adaptation_target ??
    activeWeek?.adaptation_target ??
    activeMacrocyclePhase.adaptation_target;
  const trainingPhase = asTrainingPhase(activeWeek?.phase, input.fallback_training_phase);
  const taperState = resolveTaperState(activeMacrocyclePhase, activeWeek, input.competition_in_days);
  const phaseIntent = resolvePhaseIntent(trainingPhase, adaptationTarget, taperState);
  const specificityPressure = resolveSpecificityPressure(
    activeMacrocyclePhase,
    activeWeek,
    taperState,
    input.competition_in_days,
  );

  const weeklyStructure = input.weekly_structure ?? buildWeeklyStructure({
    training_days_per_week: input.training_days_per_week ?? 5,
    adaptation_target: adaptationTarget,
    training_phase: trainingPhase,
    readiness: input.readiness,
    fatigue: input.fatigue,
    competition_in_days: input.competition_in_days,
  });
  const weeklyDirection: WeeklyDirection = {
    day_index: input.active_training_day_index,
    weekly_structure: weeklyStructure,
    notes: weeklyStructure.notes,
  };

  const notes = [
    `Mesocycle execution: ${phaseIntent} (${trainingPhase}, target=${adaptationTarget}).`,
    `Specificity pressure: ${Math.round(specificityPressure * 100)}%.`,
    ...activeMacrocyclePhase.notes,
    ...(activeWeek?.notes ?? []),
    ...weeklyStructure.notes,
  ];

  return {
    active_macrocycle_phase: activeMacrocyclePhase,
    weekly_direction: weeklyDirection,
    adaptation_target: adaptationTarget,
    training_phase: trainingPhase,
    phase_intent: phaseIntent,
    taper_state: taperState,
    specificity_pressure: specificityPressure,
    notes,
  };
}