// Biomechanical foundation layer for Olympic weightlifting.
// Pure data + helpers. Does NOT touch the existing coach pipeline,
// engine-store, exercise DB, or diagnostics. Safe to import in isolation.

export type MovementPattern =
  | "snatch"
  | "clean"
  | "push_press"
  | "push_jerk"
  | "split_jerk";

export type MovementPhase =
  | "start"
  | "first_pull"
  | "transition"
  | "extension"
  | "pull_under"
  | "receive"
  | "recovery"
  | "dip"
  | "drive"
  | "lockout"
  | "split";

export type MovementPosition =
  | "floor"
  | "below_knee"
  | "above_knee"
  | "power_position"
  | "hip_contact"
  | "rack"
  | "overhead";

// ────────────────────────
// PHASE DATABASE
// ────────────────────────

export interface PhaseDef {
  id: MovementPhase;
  ru: string;              // Russian weightlifting terminology
  biomechanics: string;    // what the body does
  cues: string[];          // coaching cues
  errors: string[];        // common technical errors
}

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

export interface PatternDef {
  id: MovementPattern;
  ru: string;
  phases: MovementPhase[];
}

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

export interface PositionDef {
  id: MovementPosition;
  ru: string;
  description: string;
}

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
// HELPER FUNCTIONS
// ────────────────────────

export function getPhase(id: MovementPhase): PhaseDef | undefined {
  return PHASES[id];
}

export function getPattern(id: MovementPattern): PatternDef | undefined {
  return MOVEMENT_PATTERNS[id];
}

export function getPosition(id: MovementPosition): PositionDef | undefined {
  return POSITIONS[id];
}

export function getPhaseFromProblem(problem: string): MovementPhase | undefined {
  return PROBLEM_PHASE[problem];
}

export function getPositionFromProblem(problem: string): MovementPosition | undefined {
  return PROBLEM_POSITION[problem];
}

export function getCorrectivesForPhase(phase: MovementPhase): string[] {
  return PHASE_CORRECTIVES[phase] ?? [];
}
