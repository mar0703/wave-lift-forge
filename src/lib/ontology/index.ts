// ─────────────────────────────────────────────────────────────────────────────
// DOMAIN ONTOLOGY
//
// Single source of truth for static domain knowledge used across the
// weightlifting runtime: movement phases/patterns/positions, problem→phase
// mappings, phase-driven corrective lists, priority definitions, root-cause
// candidates, and per-exercise stress profiles.
//
// Pure data only — no runtime logic. Types continue to live next to the
// engines that own them and are imported here as type-only references to
// keep the runtime dependency graph unidirectional (engines → ontology).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  MovementPattern,
  MovementPhase,
  MovementPosition,
  PhaseDef,
  PatternDef,
  PositionDef,
} from "../weightlifting/movement-model";
import type {
  DailyPriority,
  PriorityDefinition,
} from "../weightlifting/daily-priority-engine";
import type { ExerciseStressProfile } from "../weightlifting/exercise-stress-taxonomy";

// ────────────────────────
// PHASE DATABASE
// ────────────────────────

export const PHASES: Record<MovementPhase, PhaseDef> = {
  start: {
    id: "start",
    ru: "Стартовое положение",
    biomechanics:
      "Спина прямая, плечи над грифом, таз выше колен, вес на середине стопы.",
    cues: ["Грудь вверх", "Плечи накрывают гриф", "Давление через пятки"],
    errors: ["Круглая спина", "Таз слишком низко", "Вес на носках"],
  },
  first_pull: {
    id: "first_pull",
    ru: "Первая тяга (тяга от помоста)",
    biomechanics:
      "Гриф поднимается до колен за счёт разгибания ног, угол спины сохраняется.",
    cues: ["Гриф вдоль голени", "Не дёргать руками", "Колени уходят назад"],
    errors: ["Ранний подъём таза", "Гриф уходит вперёд", "Сгибание рук"],
  },
  transition: {
    id: "transition",
    ru: "Подведение коленей (скан)",
    biomechanics:
      "Колени подводятся под гриф, корпус остаётся жёстким, гриф у бедра.",
    cues: ["Колени под гриф", "Гриф к бедру", "Готовность к подрыву"],
    errors: ["Потеря контакта с грифом", "Слишком быстрая транзиция"],
  },
  extension: {
    id: "extension",
    ru: "Подрыв",
    biomechanics:
      "Полное разгибание тазобедренного, коленного и голеностопного суставов (тройное разгибание).",
    cues: ["Толчок пятками", "Бёдра вверх", "Плечи назад"],
    errors: ["Ранний сгиб рук", "Нет полного разгибания", "Прыжок вперёд"],
  },
  pull_under: {
    id: "pull_under",
    ru: "Уход в сед",
    biomechanics:
      "Активное протягивание тела под гриф после подрыва, локти проходят высоко.",
    cues: ["Тяни себя под гриф", "Локти вверх и наружу", "Быстрые ноги"],
    errors: ["Медленный уход", "Гриф уходит вперёд", "Низкие локти"],
  },
  receive: {
    id: "receive",
    ru: "Приём (подсед)",
    biomechanics:
      "Фиксация грифа в нижней точке: над головой (рывок) или на плечах (толчок).",
    cues: ["Жёсткий корпус", "Локти высоко (clean)", "Активные плечи (snatch)"],
    errors: ["Падение грифа вперёд", "Мягкие локти", "Сваливание в сторону"],
  },
  recovery: {
    id: "recovery",
    ru: "Вставание из седа",
    biomechanics:
      "Подъём из приседа с фиксированным грифом, корпус вертикален.",
    cues: ["Грудь вверх", "Колени наружу", "Толчок пятками"],
    errors: ["Заваливание вперёд", "Колени внутрь", "Потеря фиксации"],
  },
  dip: {
    id: "dip",
    ru: "Полуподсед (швунг)",
    biomechanics:
      "Короткий вертикальный полуподсед на 10–15% высоты, корпус строго вертикален.",
    cues: ["Вертикально вниз", "Контроль скорости", "Пятки прижаты"],
    errors: ["Колени вперёд", "Наклон корпуса", "Слишком глубокий подсед"],
  },
  drive: {
    id: "drive",
    ru: "Выталкивание",
    biomechanics:
      "Резкое разгибание ног передаёт ускорение грифу вертикально вверх.",
    cues: ["Толчок пятками", "Гриф вертикально", "Полное разгибание"],
    errors: ["Раннее включение рук", "Гриф уходит вперёд"],
  },
  lockout: {
    id: "lockout",
    ru: "Фиксация над головой",
    biomechanics:
      "Полное выпрямление рук, плечи активны, гриф над основанием шеи.",
    cues: ["Локти жёстко", "Плечи в уши", "Гриф над затылком"],
    errors: ["Мягкие локти", "Гриф впереди", "Прогиб в пояснице"],
  },
  split: {
    id: "split",
    ru: "Ножницы (сед в разножку)",
    biomechanics:
      "Передняя нога вперёд под прямым углом, задняя на подушечке стопы, таз между опорами.",
    cues: ["Передняя голень вертикально", "Задняя нога активна", "Таз по центру"],
    errors: ["Узкая разножка", "Передняя нога завалена", "Корпус наклонён вперёд"],
  },
};

// ────────────────────────
// MOVEMENT PATTERNS
// ────────────────────────

export const MOVEMENT_PATTERNS: Record<MovementPattern, PatternDef> = {
  snatch: {
    id: "snatch",
    ru: "Рывок",
    phases: [
      "start",
      "first_pull",
      "transition",
      "extension",
      "pull_under",
      "receive",
      "recovery",
    ],
  },
  clean: {
    id: "clean",
    ru: "Взятие на грудь",
    phases: [
      "start",
      "first_pull",
      "transition",
      "extension",
      "pull_under",
      "receive",
      "recovery",
    ],
  },
  push_press: {
    id: "push_press",
    ru: "Жимовой швунг",
    phases: ["dip", "drive", "lockout"],
  },
  push_jerk: {
    id: "push_jerk",
    ru: "Швунг толчковый",
    phases: ["dip", "drive", "pull_under", "lockout"],
  },
  split_jerk: {
    id: "split_jerk",
    ru: "Толчок от груди (ножницы)",
    phases: ["dip", "drive", "split", "lockout"],
  },
};

// ────────────────────────
// POSITION DATABASE
// ────────────────────────

export const POSITIONS: Record<MovementPosition, PositionDef> = {
  floor: {
    id: "floor",
    ru: "Гриф на помосте",
    description: "Исходное положение, гриф лежит на полу.",
  },
  below_knee: {
    id: "below_knee",
    ru: "Гриф ниже колен",
    description: "Гриф между полом и коленями, угол спины сохраняется.",
  },
  above_knee: {
    id: "above_knee",
    ru: "Гриф выше колен",
    description: "Гриф прошёл колени, начало подведения коленей под гриф.",
  },
  power_position: {
    id: "power_position",
    ru: "Силовая позиция",
    description: "Гриф у середины бедра, корпус почти вертикален, готовность к подрыву.",
  },
  hip_contact: {
    id: "hip_contact",
    ru: "Контакт с бедром",
    description: "Точка контакта грифа с бедром в момент подрыва.",
  },
  rack: {
    id: "rack",
    ru: "Положение на груди",
    description: "Гриф зафиксирован на дельтах, локти высоко.",
  },
  overhead: {
    id: "overhead",
    ru: "Над головой",
    description: "Гриф зафиксирован на прямых руках над основанием шеи.",
  },
};

// ────────────────────────
// PROBLEM MAPPINGS
// ────────────────────────

export const PROBLEM_PHASE: Record<string, MovementPhase> = {
  early_arm_bend: "extension",
  no_extension: "extension",
  bar_drift: "first_pull",
  slow_pull_under: "pull_under",
  weak_legs: "recovery",
  poor_position: "start",
  unstable_receive: "receive",
  soft_lockout: "lockout",
  shallow_dip: "dip",
  weak_drive: "drive",
  narrow_split: "split",
};

export const PROBLEM_POSITION: Record<string, MovementPosition> = {
  early_arm_bend: "power_position",
  no_extension: "hip_contact",
  bar_drift: "below_knee",
  slow_pull_under: "power_position",
  weak_legs: "rack",
  poor_position: "floor",
  unstable_receive: "overhead",
  soft_lockout: "overhead",
};

// ────────────────────────
// PHASE CORRECTIVES
// ────────────────────────

export const PHASE_CORRECTIVES: Partial<Record<MovementPhase, string[]>> = {
  start: ["halting_deadlift", "snatch_deadlift"],
  first_pull: ["snatch_deadlift", "clean_deadlift"],
  transition: ["snatch_pull_below_knee", "clean_pull_below_knee"],
  extension: ["snatch_pull", "clean_pull", "high_pull"],
  pull_under: ["tall_snatch", "tall_clean", "snatch_balance"],
  receive: ["overhead_squat", "snatch_balance", "front_squat"],
  recovery: ["front_squat", "back_squat"],
  dip: ["pause_front_squat", "tempo_squat"],
  drive: ["push_press", "jerk_drive"],
  lockout: ["jerk_rack", "press_behind_neck"],
  split: ["split_jerk_balance", "jerk_recovery"],
};

// ────────────────────────
// ROOT CAUSE MAP
// ────────────────────────

// Likely root causes per problem. A problem is NOT automatically a root
// cause — these are *candidate* causes the engine should consider before
// committing to a correction strategy.
export const ROOT_CAUSE_MAP: Record<string, string[]> = {
  early_arm_bend: ["weak_legs", "loss_of_tension", "rushing_extension"],
  bar_forward: ["weak_lats", "poor_transition", "no_leg_drive"],
  bar_drift: ["weak_lats", "poor_transition", "no_leg_drive"],
  slow_pull_under: ["poor_timing", "low_speed_under", "weak_extension"],
  weak_legs: ["low_squat_strength", "fatigue_accumulation"],
  no_extension: ["rushing_extension", "weak_posterior_chain"],
  unstable_receive: ["poor_mobility", "weak_overhead", "weak_legs"],
  soft_lockout: ["weak_overhead", "shoulder_mobility"],
  weak_pull: ["weak_posterior_chain", "weak_first_pull"],
  poor_position: ["mobility_restriction", "weak_core"],
};

// ────────────────────────
// PRIORITY DEFINITIONS
// ────────────────────────

export const PRIORITY_DEFINITIONS: Record<DailyPriority, PriorityDefinition> = {
  snatch_speed: {
    id: "snatch_speed",
    primary_focus: "Bar speed and pull-under velocity in the snatch",
    secondary_focus: "Extension timing",
    target_phases: ["extension", "pull_under", "transition"],
    preferred_families: ["snatch"],
    preferred_roles: ["main", "technical"],
    preferred_intensity_range: { min: 70, max: 85 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 70,
    max_correctives: 1,
    technical_bias: 0.5,
    strength_bias: 0.2,
    specificity_bias: 0.7,
    notes: [
      "Bias toward power snatch, hang snatch high, tall snatch.",
      "Keep volume low, intent maximal.",
    ],
  },
  snatch_technique: {
    id: "snatch_technique",
    primary_focus: "Snatch positions, trajectory, and timing",
    target_phases: ["first_pull", "transition", "extension", "receive"],
    preferred_families: ["snatch"],
    preferred_roles: ["technical", "corrective", "main"],
    preferred_intensity_range: { min: 60, max: 78 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 60,
    max_correctives: 2,
    technical_bias: 0.9,
    strength_bias: 0.2,
    specificity_bias: 0.5,
    notes: ["Slow, deliberate work. Pauses, segments, positional drills."],
  },
  snatch_strength: {
    id: "snatch_strength",
    primary_focus: "Snatch overload and pull strength",
    target_phases: ["first_pull", "extension"],
    preferred_families: ["snatch", "pull"],
    preferred_roles: ["main", "overload"],
    preferred_intensity_range: { min: 80, max: 95 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 85,
    max_correctives: 1,
    technical_bias: 0.3,
    strength_bias: 0.8,
    specificity_bias: 0.6,
    notes: ["Snatch pulls, deficit snatch pulls, heavy classic snatch."],
  },
  clean_technique: {
    id: "clean_technique",
    primary_focus: "Clean positions, transition, and rack",
    target_phases: ["first_pull", "transition", "extension", "receive"],
    preferred_families: ["clean"],
    preferred_roles: ["technical", "corrective", "main"],
    preferred_intensity_range: { min: 60, max: 78 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 60,
    max_correctives: 2,
    technical_bias: 0.9,
    strength_bias: 0.3,
    specificity_bias: 0.5,
    notes: ["Hang clean, pause clean, tall clean."],
  },
  clean_strength: {
    id: "clean_strength",
    primary_focus: "Clean overload and pull strength",
    target_phases: ["first_pull", "extension"],
    preferred_families: ["clean", "pull", "squat"],
    preferred_roles: ["main", "overload"],
    preferred_intensity_range: { min: 80, max: 95 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 85,
    max_correctives: 1,
    technical_bias: 0.3,
    strength_bias: 0.85,
    specificity_bias: 0.6,
    notes: ["Heavy clean, clean pulls, front squat support."],
  },
  jerk_technique: {
    id: "jerk_technique",
    primary_focus: "Jerk dip, drive, split, lockout",
    target_phases: ["dip", "drive", "split", "lockout"],
    preferred_families: ["jerk"],
    preferred_roles: ["technical", "main", "corrective"],
    preferred_intensity_range: { min: 60, max: 80 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 65,
    max_correctives: 2,
    technical_bias: 0.85,
    strength_bias: 0.3,
    specificity_bias: 0.6,
    notes: [
      "Bias jerk, push jerk, split jerk, jerk balance, jerk dip.",
      "Front squat as overhead-support strength.",
    ],
  },
  jerk_strength: {
    id: "jerk_strength",
    primary_focus: "Overhead lockout and drive strength",
    target_phases: ["drive", "lockout"],
    preferred_families: ["jerk", "squat"],
    preferred_roles: ["main", "overload"],
    preferred_intensity_range: { min: 80, max: 95 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 80,
    max_correctives: 1,
    technical_bias: 0.3,
    strength_bias: 0.8,
    specificity_bias: 0.6,
    notes: ["Push press, jerk behind neck, heavy front squat."],
  },
  speed_under: {
    id: "speed_under",
    primary_focus: "Pull-under speed and turnover",
    target_phases: ["pull_under", "receive"],
    preferred_families: ["snatch", "clean"],
    preferred_roles: ["technical", "main"],
    preferred_intensity_range: { min: 60, max: 80 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 65,
    max_correctives: 2,
    technical_bias: 0.7,
    strength_bias: 0.2,
    specificity_bias: 0.6,
    notes: ["Tall snatch, drop snatch, tall clean, high-hang variants."],
  },
  receive_stability: {
    id: "receive_stability",
    primary_focus: "Bottom-position stability and fixation",
    target_phases: ["receive", "lockout"],
    preferred_families: ["snatch", "clean", "jerk", "squat"],
    preferred_roles: ["technical", "corrective", "accessory"],
    preferred_intensity_range: { min: 55, max: 80 },
    preferred_complexity_range: { min: 2, max: 4 },
    max_cns_load: 60,
    max_correctives: 2,
    technical_bias: 0.7,
    strength_bias: 0.4,
    specificity_bias: 0.5,
    notes: ["OHS, snatch balance, pause squats, jerk recovery holds."],
  },
  pull_strength: {
    id: "pull_strength",
    primary_focus: "Posterior chain and pulling strength",
    target_phases: ["first_pull", "extension"],
    preferred_families: ["pull"],
    preferred_roles: ["overload", "main"],
    preferred_intensity_range: { min: 80, max: 110 },
    preferred_complexity_range: { min: 1, max: 3 },
    max_cns_load: 80,
    max_correctives: 1,
    technical_bias: 0.2,
    strength_bias: 0.9,
    specificity_bias: 0.5,
    notes: ["Snatch pulls, clean pulls, deficit pulls, RDL."],
  },
  squat_strength: {
    id: "squat_strength",
    primary_focus: "Leg strength base",
    target_phases: ["recovery", "receive"],
    preferred_families: ["squat"],
    preferred_roles: ["overload", "main"],
    preferred_intensity_range: { min: 80, max: 100 },
    preferred_complexity_range: { min: 1, max: 3 },
    max_cns_load: 80,
    max_correctives: 1,
    technical_bias: 0.2,
    strength_bias: 0.95,
    specificity_bias: 0.4,
    notes: ["Back squat, front squat, pause squat."],
  },
  competition_specific: {
    id: "competition_specific",
    primary_focus: "Classic lifts under competition conditions",
    target_phases: ["extension", "receive", "lockout"],
    preferred_families: ["snatch", "clean", "jerk"],
    preferred_roles: ["main"],
    preferred_intensity_range: { min: 85, max: 100 },
    preferred_complexity_range: { min: 3, max: 4 },
    max_cns_load: 85,
    max_correctives: 0,
    technical_bias: 0.3,
    strength_bias: 0.4,
    specificity_bias: 1.0,
    notes: [
      "Classic snatch and C&J only.",
      "Minimal correction noise. High specificity.",
    ],
  },
  recovery: {
    id: "recovery",
    primary_focus: "CNS recovery and movement quality",
    target_phases: ["recovery", "start"],
    preferred_families: ["general", "squat"],
    preferred_roles: ["accessory", "technical"],
    preferred_intensity_range: { min: 40, max: 65 },
    preferred_complexity_range: { min: 1, max: 2 },
    max_cns_load: 35,
    max_correctives: 2,
    technical_bias: 0.5,
    strength_bias: 0.2,
    specificity_bias: 0.2,
    notes: ["Low complexity. Positional drills. Mobility, light technique."],
  },
  technical_restoration: {
    id: "technical_restoration",
    primary_focus: "Re-grooving positions after fatigue or breakdown",
    target_phases: ["start", "first_pull", "transition", "receive"],
    preferred_families: ["snatch", "clean", "jerk"],
    preferred_roles: ["technical", "corrective"],
    preferred_intensity_range: { min: 50, max: 70 },
    preferred_complexity_range: { min: 2, max: 3 },
    max_cns_load: 45,
    max_correctives: 3,
    technical_bias: 1.0,
    strength_bias: 0.1,
    specificity_bias: 0.4,
    notes: ["Slow segmented work. Positional drills. No max effort."],
  },
};

// ────────────────────────
// EXERCISE STRESS PROFILES
// ────────────────────────

export const EXERCISE_STRESS_PROFILES: Record<string, ExerciseStressProfile> = {
  // ── CLASSIC COMPETITION LIFTS ──
  snatch: {
    exercise_id: "snatch",
    cns_cost: 85,
    coordination_cost: 90,
    technical_cost: 95,
    overhead_cost: 75,
    eccentric_cost: 60,
    speed_cost: 95,
    local_muscular_cost: 70,
    complexity: 9,
    stress_class: "classic_competition",
    specificity_score: 100,
    recovery_disruption: 80,
    notes: ["Peak competition lift", "Maximal coordination demand", "High speed requirement"],
  },

  clean_and_jerk: {
    exercise_id: "clean_and_jerk",
    cns_cost: 90,
    coordination_cost: 95,
    technical_cost: 90,
    overhead_cost: 85,
    eccentric_cost: 65,
    speed_cost: 85,
    local_muscular_cost: 75,
    complexity: 10,
    stress_class: "classic_competition",
    specificity_score: 100,
    recovery_disruption: 85,
    notes: ["Full competition movement", "Highest coordination complexity", "Two-phase lift"],
  },

  clean: {
    exercise_id: "clean",
    cns_cost: 80,
    coordination_cost: 88,
    technical_cost: 88,
    overhead_cost: 50,
    eccentric_cost: 65,
    speed_cost: 85,
    local_muscular_cost: 75,
    complexity: 8,
    stress_class: "classic_competition",
    specificity_score: 92,
    recovery_disruption: 75,
    notes: ["Full clean (no jerk)", "Catch + recovery", "Lower overhead than clean_and_jerk"],
  },

  // ── POWER VARIATIONS ──
  power_snatch: {
    exercise_id: "power_snatch",
    cns_cost: 70,
    coordination_cost: 80,
    technical_cost: 85,
    overhead_cost: 60,
    eccentric_cost: 40,
    speed_cost: 90,
    local_muscular_cost: 55,
    complexity: 7,
    stress_class: "power_explosive",
    specificity_score: 85,
    recovery_disruption: 60,
    notes: ["Power catch reduces eccentric stress", "High speed focus", "Moderate coordination"],
  },

  power_clean: {
    exercise_id: "power_clean",
    cns_cost: 75,
    coordination_cost: 85,
    technical_cost: 80,
    overhead_cost: 45,
    eccentric_cost: 45,
    speed_cost: 80,
    local_muscular_cost: 60,
    complexity: 7,
    stress_class: "power_explosive",
    specificity_score: 85,
    recovery_disruption: 65,
    notes: ["Power catch reduces overhead stress", "Speed and timing focus", "Front rack position"],
  },

  // ── PULL VARIATIONS ──
  snatch_pull: {
    exercise_id: "snatch_pull",
    cns_cost: 65,
    coordination_cost: 70,
    technical_cost: 75,
    overhead_cost: 30,
    eccentric_cost: 80,
    speed_cost: 75,
    local_muscular_cost: 85,
    complexity: 6,
    stress_class: "pull_maximal",
    specificity_score: 70,
    recovery_disruption: 70,
    notes: ["High eccentric loading", "Pull strength focus", "Moderate technical demand"],
  },

  clean_pull: {
    exercise_id: "clean_pull",
    cns_cost: 70,
    coordination_cost: 75,
    technical_cost: 70,
    overhead_cost: 25,
    eccentric_cost: 85,
    speed_cost: 70,
    local_muscular_cost: 90,
    complexity: 6,
    stress_class: "pull_maximal",
    specificity_score: 75,
    recovery_disruption: 75,
    notes: ["Maximum eccentric stress", "Pull strength development", "High local fatigue"],
  },

  snatch_deadlift: {
    exercise_id: "snatch_deadlift",
    cns_cost: 50,
    coordination_cost: 50,
    technical_cost: 55,
    overhead_cost: 15,
    eccentric_cost: 90,
    speed_cost: 30,
    local_muscular_cost: 85,
    complexity: 4,
    stress_class: "pull_technical",
    specificity_score: 55,
    recovery_disruption: 60,
    notes: ["Slow snatch pull at deadlift tempo", "Position and starting strength", "Low speed demand"],
  },

  clean_deadlift: {
    exercise_id: "clean_deadlift",
    cns_cost: 55,
    coordination_cost: 50,
    technical_cost: 50,
    overhead_cost: 15,
    eccentric_cost: 95,
    speed_cost: 25,
    local_muscular_cost: 90,
    complexity: 4,
    stress_class: "pull_technical",
    specificity_score: 60,
    recovery_disruption: 65,
    notes: ["Slow clean pull at deadlift tempo", "Position and starting strength", "Highest eccentric stress"],
  },

  // ── SQUAT VARIATIONS ──
  front_squat: {
    exercise_id: "front_squat",
    cns_cost: 60,
    coordination_cost: 65,
    technical_cost: 70,
    overhead_cost: 40,
    eccentric_cost: 75,
    speed_cost: 40,
    local_muscular_cost: 95,
    complexity: 6,
    stress_class: "squat_maximal",
    specificity_score: 80,
    recovery_disruption: 70,
    notes: ["High local muscular demand", "Front rack position", "Technical stability required"],
  },

  back_squat: {
    exercise_id: "back_squat",
    cns_cost: 55,
    coordination_cost: 50,
    technical_cost: 60,
    overhead_cost: 20,
    eccentric_cost: 80,
    speed_cost: 35,
    local_muscular_cost: 100,
    complexity: 5,
    stress_class: "squat_maximal",
    specificity_score: 60,
    recovery_disruption: 65,
    notes: ["Maximum local muscular stress", "Lower technical demand", "High eccentric loading"],
  },

  pause_back_squat: {
    exercise_id: "pause_back_squat",
    cns_cost: 60,
    coordination_cost: 55,
    technical_cost: 65,
    overhead_cost: 20,
    eccentric_cost: 90,
    speed_cost: 25,
    local_muscular_cost: 100,
    complexity: 6,
    stress_class: "squat_maximal",
    specificity_score: 60,
    recovery_disruption: 75,
    notes: ["Pause at bottom of back squat", "Maximal local stress", "Tempo discipline"],
  },

  pause_front_squat: {
    exercise_id: "pause_front_squat",
    cns_cost: 65,
    coordination_cost: 65,
    technical_cost: 75,
    overhead_cost: 40,
    eccentric_cost: 80,
    speed_cost: 30,
    local_muscular_cost: 90,
    complexity: 7,
    stress_class: "squat_maximal",
    specificity_score: 80,
    recovery_disruption: 75,
    notes: ["Pause at bottom of front squat", "Position strength + stability", "Front rack demand"],
  },

  // ── JERK VARIATIONS ──
  push_press: {
    exercise_id: "push_press",
    cns_cost: 50,
    coordination_cost: 60,
    technical_cost: 65,
    overhead_cost: 70,
    eccentric_cost: 30,
    speed_cost: 60,
    local_muscular_cost: 60,
    complexity: 5,
    stress_class: "overhead_technical",
    specificity_score: 65,
    recovery_disruption: 50,
    notes: ["Technical jerk introduction", "Moderate overhead stress", "Leg drive focus"],
  },

  power_jerk: {
    exercise_id: "power_jerk",
    cns_cost: 65,
    coordination_cost: 75,
    technical_cost: 80,
    overhead_cost: 75,
    eccentric_cost: 35,
    speed_cost: 70,
    local_muscular_cost: 65,
    complexity: 7,
    stress_class: "overhead_technical",
    specificity_score: 85,
    recovery_disruption: 60,
    notes: ["Split jerk technique", "High coordination demand", "Power catch"],
  },

  split_jerk: {
    exercise_id: "split_jerk",
    cns_cost: 75,
    coordination_cost: 85,
    technical_cost: 90,
    overhead_cost: 90,
    eccentric_cost: 40,
    speed_cost: 65,
    local_muscular_cost: 70,
    complexity: 8,
    stress_class: "overhead_maximal",
    specificity_score: 95,
    recovery_disruption: 75,
    notes: ["Competition jerk", "Maximal overhead stress", "High technical precision"],
  },

  jerk: {
    exercise_id: "jerk",
    cns_cost: 70,
    coordination_cost: 82,
    technical_cost: 88,
    overhead_cost: 88,
    eccentric_cost: 40,
    speed_cost: 70,
    local_muscular_cost: 60,
    complexity: 8,
    stress_class: "overhead_maximal",
    specificity_score: 88,
    recovery_disruption: 65,
    notes: ["Stand-alone jerk (rack/blocks)", "Maximal overhead demand", "Lower CNS than full clean_and_jerk"],
  },

  jerk_dip: {
    exercise_id: "jerk_dip",
    cns_cost: 25,
    coordination_cost: 40,
    technical_cost: 45,
    overhead_cost: 25,
    eccentric_cost: 20,
    speed_cost: 40,
    local_muscular_cost: 30,
    complexity: 2,
    stress_class: "restoration_coordination",
    specificity_score: 35,
    recovery_disruption: 15,
    notes: ["Dip and drive rehearsal", "Position drill", "Minimal stress"],
  },

  // ── RESTORATION / TECHNICAL VARIATIONS ──
  tall_snatch: {
    exercise_id: "tall_snatch",
    cns_cost: 35,
    coordination_cost: 55,
    technical_cost: 70,
    overhead_cost: 50,
    eccentric_cost: 20,
    speed_cost: 60,
    local_muscular_cost: 30,
    complexity: 4,
    stress_class: "restoration_coordination",
    specificity_score: 40,
    recovery_disruption: 25,
    notes: ["Technical restoration", "Low loading", "Speed under focus", "Coordination isolation"],
  },

  tall_clean: {
    exercise_id: "tall_clean",
    cns_cost: 40,
    coordination_cost: 60,
    technical_cost: 65,
    overhead_cost: 35,
    eccentric_cost: 25,
    speed_cost: 55,
    local_muscular_cost: 35,
    complexity: 4,
    stress_class: "restoration_coordination",
    specificity_score: 45,
    recovery_disruption: 30,
    notes: ["Clean technique restoration", "Front rack focus", "Low stress"],
  },

  drop_snatch: {
    exercise_id: "drop_snatch",
    cns_cost: 45,
    coordination_cost: 65,
    technical_cost: 75,
    overhead_cost: 55,
    eccentric_cost: 15,
    speed_cost: 75,
    local_muscular_cost: 25,
    complexity: 5,
    stress_class: "restoration_coordination",
    specificity_score: 50,
    recovery_disruption: 35,
    notes: ["Speed under restoration", "Drop catch", "Minimal eccentric stress"],
  },

  muscle_snatch: {
    exercise_id: "muscle_snatch",
    cns_cost: 40,
    coordination_cost: 55,
    technical_cost: 60,
    overhead_cost: 60,
    eccentric_cost: 25,
    speed_cost: 55,
    local_muscular_cost: 40,
    complexity: 4,
    stress_class: "restoration_coordination",
    specificity_score: 45,
    recovery_disruption: 30,
    notes: ["Snatch with no re-bend", "Upper-pull and turnover focus", "Restoration / technical drill"],
  },

  // ── SEGMENTED / PAUSE WORK ──
  segmented_snatch: {
    exercise_id: "segmented_snatch",
    cns_cost: 55,
    coordination_cost: 70,
    technical_cost: 80,
    overhead_cost: 60,
    eccentric_cost: 45,
    speed_cost: 50,
    local_muscular_cost: 50,
    complexity: 6,
    stress_class: "segmented_technical",
    specificity_score: 60,
    recovery_disruption: 45,
    notes: ["Broken-down snatch", "Technical isolation", "Moderate coordination"],
  },

  segmented_clean: {
    exercise_id: "segmented_clean",
    cns_cost: 60,
    coordination_cost: 75,
    technical_cost: 75,
    overhead_cost: 40,
    eccentric_cost: 50,
    speed_cost: 45,
    local_muscular_cost: 55,
    complexity: 6,
    stress_class: "segmented_technical",
    specificity_score: 65,
    recovery_disruption: 50,
    notes: ["Broken-down clean", "Technical precision", "Position work"],
  },

  pause_snatch: {
    exercise_id: "pause_snatch",
    cns_cost: 70,
    coordination_cost: 80,
    technical_cost: 85,
    overhead_cost: 65,
    eccentric_cost: 55,
    speed_cost: 40,
    local_muscular_cost: 65,
    complexity: 7,
    stress_class: "segmented_technical",
    specificity_score: 70,
    recovery_disruption: 55,
    notes: ["Pause in catch position", "Stability focus", "Technical precision"],
  },

  pause_clean: {
    exercise_id: "pause_clean",
    cns_cost: 65,
    coordination_cost: 75,
    technical_cost: 80,
    overhead_cost: 45,
    eccentric_cost: 60,
    speed_cost: 35,
    local_muscular_cost: 70,
    complexity: 6,
    stress_class: "segmented_technical",
    specificity_score: 75,
    recovery_disruption: 55,
    notes: ["Pause in front rack", "Stability development", "Position strength"],
  },

  // ── OVERHEAD SQUAT ──
  overhead_squat: {
    exercise_id: "overhead_squat",
    cns_cost: 70,
    coordination_cost: 80,
    technical_cost: 85,
    overhead_cost: 95,
    eccentric_cost: 70,
    speed_cost: 30,
    local_muscular_cost: 75,
    complexity: 8,
    stress_class: "overhead_maximal",
    specificity_score: 90,
    recovery_disruption: 70,
    notes: ["Maximal overhead stability", "High technical demand", "Shoulder stress"],
  },
};
