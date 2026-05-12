// Workout Validator
// ─────────────────────────────────────────────────────────────
// Ensures every generated workout:
//  1. Conforms to the expected structured JSON schema
//     (WorkoutOutput + ExerciseBlock[]).
//  2. Respects the daily wave intensity pattern
//     D1=70%, D2=80%, D3=60%, D4=85%, D5=75% (± tolerance).
//
// This module does NOT mutate workouts and does NOT generate
// exercises — it only validates. Consumers can use the result
// to log issues, gate UI rendering, or trigger regeneration.
// ─────────────────────────────────────────────────────────────

import type { WorkoutOutput, ExerciseBlock } from "@/lib/training-engine";

/** Canonical daily wave (% of base intensity). */
export const DAILY_WAVE: Record<number, number> = {
  1: 70,
  2: 80,
  3: 60,
  4: 85,
  5: 75,
};

/** Acceptable deviation from the canonical wave (in % points). */
export const WAVE_TOLERANCE_PCT = 5;

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  severity: ValidationSeverity;
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  /** The validated (or partially validated) workout. */
  workout: WorkoutOutput | null;
}

// ── Schema guards ────────────────────────────────────────────

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function validateExerciseBlock(
  ex: unknown,
  index: number,
  issues: ValidationIssue[],
): ex is ExerciseBlock {
  const path = `exercises[${index}]`;
  if (!ex || typeof ex !== "object") {
    issues.push({
      code: "EX_NOT_OBJECT",
      severity: "error",
      path,
      message: "Exercise block is not an object.",
    });
    return false;
  }
  const e = ex as Record<string, unknown>;
  let ok = true;

  const requiredStrings: (keyof ExerciseBlock)[] = [
    "exercise_id",
    "name_en",
    "family",
    "group",
  ];
  for (const k of requiredStrings) {
    if (!isNonEmptyString(e[k])) {
      issues.push({
        code: "EX_MISSING_STRING",
        severity: "error",
        path: `${path}.${String(k)}`,
        message: `Missing or invalid string field "${String(k)}".`,
      });
      ok = false;
    }
  }

  const requiredNums: (keyof ExerciseBlock)[] = [
    "sets",
    "reps",
    "intensity_pct",
    "weight_kg",
  ];
  for (const k of requiredNums) {
    if (!isFiniteNumber(e[k])) {
      issues.push({
        code: "EX_MISSING_NUMBER",
        severity: "error",
        path: `${path}.${String(k)}`,
        message: `Missing or invalid numeric field "${String(k)}".`,
      });
      ok = false;
    }
  }

  if (isFiniteNumber(e.sets) && (e.sets as number) <= 0) {
    issues.push({
      code: "EX_SETS_NONPOSITIVE",
      severity: "error",
      path: `${path}.sets`,
      message: "sets must be > 0.",
    });
    ok = false;
  }
  if (isFiniteNumber(e.reps) && (e.reps as number) <= 0) {
    issues.push({
      code: "EX_REPS_NONPOSITIVE",
      severity: "error",
      path: `${path}.reps`,
      message: "reps must be > 0.",
    });
    ok = false;
  }
  if (
    isFiniteNumber(e.intensity_pct) &&
    ((e.intensity_pct as number) < 0 || (e.intensity_pct as number) > 110)
  ) {
    issues.push({
      code: "EX_INTENSITY_OUT_OF_RANGE",
      severity: "error",
      path: `${path}.intensity_pct`,
      message: "intensity_pct must be within [0, 110].",
    });
    ok = false;
  }
  if (isFiniteNumber(e.weight_kg) && (e.weight_kg as number) < 0) {
    issues.push({
      code: "EX_WEIGHT_NEGATIVE",
      severity: "error",
      path: `${path}.weight_kg`,
      message: "weight_kg must be ≥ 0.",
    });
    ok = false;
  }

  return ok;
}

function validateSchema(workout: unknown, issues: ValidationIssue[]): workout is WorkoutOutput {
  if (!workout || typeof workout !== "object") {
    issues.push({
      code: "WORKOUT_NOT_OBJECT",
      severity: "error",
      path: "$",
      message: "Workout payload is not an object.",
    });
    return false;
  }

  const w = workout as Record<string, unknown>;
  let ok = true;

  if (!isFiniteNumber(w.day) || ![1, 2, 3, 4, 5].includes(w.day as number)) {
    issues.push({
      code: "DAY_INVALID",
      severity: "error",
      path: "day",
      message: "day must be one of 1..5.",
    });
    ok = false;
  }

  for (const k of ["base_intensity", "adjusted_intensity", "fatigue_modifier"] as const) {
    if (!isFiniteNumber(w[k])) {
      issues.push({
        code: "FIELD_NOT_NUMBER",
        severity: "error",
        path: k,
        message: `${k} must be a finite number.`,
      });
      ok = false;
    }
  }

  if (!isNonEmptyString(w.body_type)) {
    issues.push({
      code: "BODY_TYPE_MISSING",
      severity: "error",
      path: "body_type",
      message: "body_type is required.",
    });
    ok = false;
  }

  if (!Array.isArray(w.notes) || !w.notes.every(isNonEmptyString)) {
    issues.push({
      code: "NOTES_INVALID",
      severity: "error",
      path: "notes",
      message: "notes must be an array of non-empty strings.",
    });
    ok = false;
  }

  if (!Array.isArray(w.exercises)) {
    issues.push({
      code: "EXERCISES_NOT_ARRAY",
      severity: "error",
      path: "exercises",
      message: "exercises must be an array.",
    });
    return false;
  }
  if ((w.exercises as unknown[]).length === 0) {
    issues.push({
      code: "EXERCISES_EMPTY",
      severity: "error",
      path: "exercises",
      message: "exercises must contain at least one block.",
    });
    ok = false;
  }
  (w.exercises as unknown[]).forEach((ex, i) => {
    if (!validateExerciseBlock(ex, i, issues)) ok = false;
  });

  return ok;
}

// ── Wave validation ──────────────────────────────────────────

function validateWave(workout: WorkoutOutput, issues: ValidationIssue[]): void {
  const expected = DAILY_WAVE[workout.day];
  if (expected == null) return;

  // base_intensity is stored as a fraction (0–1) in some engines and as a
  // percentage (0–100) in others. Normalize before comparing.
  const baseAsPct =
    workout.base_intensity <= 1.5
      ? workout.base_intensity * 100
      : workout.base_intensity;

  const delta = Math.abs(baseAsPct - expected);
  if (delta > WAVE_TOLERANCE_PCT) {
    issues.push({
      code: "WAVE_BASE_MISMATCH",
      severity: "error",
      path: "base_intensity",
      message: `Day ${workout.day} base intensity ${baseAsPct.toFixed(1)}% deviates ${delta.toFixed(1)}pp from canonical ${expected}% (tolerance ±${WAVE_TOLERANCE_PCT}pp).`,
    });
  }

  // Adjusted intensity is allowed to drift further (fatigue modifier) but
  // should never exceed the heaviest day in the wave by more than tolerance.
  const adjAsPct =
    workout.adjusted_intensity <= 1.5
      ? workout.adjusted_intensity * 100
      : workout.adjusted_intensity;
  const ceiling = Math.max(...Object.values(DAILY_WAVE)) + WAVE_TOLERANCE_PCT;
  if (adjAsPct > ceiling) {
    issues.push({
      code: "WAVE_ADJUSTED_OVERSHOOT",
      severity: "warning",
      path: "adjusted_intensity",
      message: `adjusted_intensity ${adjAsPct.toFixed(1)}% exceeds wave ceiling ${ceiling}%.`,
    });
  }
  if (adjAsPct < 30) {
    issues.push({
      code: "WAVE_ADJUSTED_UNDERSHOOT",
      severity: "warning",
      path: "adjusted_intensity",
      message: `adjusted_intensity ${adjAsPct.toFixed(1)}% is implausibly low.`,
    });
  }
}

// ── Weight validation ────────────────────────────────────────

/** Bar-loadable rounding step (kg). Olympic plates round to 2 kg pairs. */
export const WEIGHT_ROUNDING_KG = 2;
/** Allowed deviation from the rounded prescription (kg). */
export const WEIGHT_TOLERANCE_KG = 1;

/**
 * Mapping used to verify weight prescriptions. Keys may be either the
 * `exercise_id` or the `family` of an exercise block; the validator checks
 * `exercise_id` first, then falls back to `family`.
 */
export type DailyMaxes = Record<string, number>;

export interface WeightValidationOptions {
  /** Per-exercise/family training maxes in kg (e.g. daily 1RM). */
  dailyMaxes?: DailyMaxes;
  /** Override rounding step (default 2 kg). */
  roundingKg?: number;
  /** Override tolerance (default 1 kg). */
  toleranceKg?: number;
}

/** Round a weight to the nearest `step` kg. */
export function roundToStep(weight: number, step: number = WEIGHT_ROUNDING_KG): number {
  if (step <= 0) return weight;
  return Math.round(weight / step) * step;
}

function resolveMax(ex: ExerciseBlock, maxes: DailyMaxes): number | null {
  if (Object.prototype.hasOwnProperty.call(maxes, ex.exercise_id)) {
    return maxes[ex.exercise_id];
  }
  if (Object.prototype.hasOwnProperty.call(maxes, ex.family)) {
    return maxes[ex.family];
  }
  return null;
}

function validateWeights(
  workout: WorkoutOutput,
  options: WeightValidationOptions,
  issues: ValidationIssue[],
): void {
  const maxes = options.dailyMaxes;
  if (!maxes) return;

  const step = options.roundingKg ?? WEIGHT_ROUNDING_KG;
  const tol = options.toleranceKg ?? WEIGHT_TOLERANCE_KG;

  const adjAsPct =
    workout.adjusted_intensity <= 1.5
      ? workout.adjusted_intensity * 100
      : workout.adjusted_intensity;

  workout.exercises.forEach((ex, i) => {
    const path = `exercises[${i}].weight_kg`;
    const max = resolveMax(ex, maxes);
    if (max == null || !Number.isFinite(max) || max <= 0) {
      issues.push({
        code: "WEIGHT_NO_MAX",
        severity: "warning",
        path,
        message: `No daily max provided for exercise_id "${ex.exercise_id}" (family "${ex.family}"); skipping weight check.`,
      });
      return;
    }

    // Per-exercise prescribed intensity, capped by the day's adjusted intensity.
    const prescribedPct = Math.min(ex.intensity_pct, adjAsPct);
    const expectedRaw = (max * prescribedPct) / 100;
    const expected = roundToStep(expectedRaw, step);
    const delta = Math.abs(ex.weight_kg - expected);

    if (delta > tol) {
      issues.push({
        code: "WEIGHT_ROUNDING_MISMATCH",
        severity: "error",
        path,
        message: `weight_kg ${ex.weight_kg}kg ≠ expected ${expected}kg (max ${max}kg × ${prescribedPct}% = ${expectedRaw.toFixed(2)}kg, rounded to nearest ${step}kg, tolerance ±${tol}kg).`,
      });
      return;
    }

    // Even if within tolerance, flag prescriptions that are not on the
    // rounding grid — they cannot be loaded on a real bar.
    const offGrid = Math.abs(ex.weight_kg - roundToStep(ex.weight_kg, step));
    if (offGrid > 1e-6) {
      issues.push({
        code: "WEIGHT_OFF_GRID",
        severity: "warning",
        path,
        message: `weight_kg ${ex.weight_kg}kg is not a multiple of ${step}kg (nearest loadable: ${roundToStep(ex.weight_kg, step)}kg).`,
      });
    }
  });
}

// ── Public API ───────────────────────────────────────────────

/**
 * Validate a generated workout against the expected JSON schema, the
 * canonical daily wave intensity pattern, and (when daily maxes are
 * provided) the rounded weight prescriptions.
 */
export function validateWorkout(
  workout: unknown,
  options: WeightValidationOptions = {},
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const schemaOk = validateSchema(workout, issues);

  if (schemaOk) {
    validateWave(workout, issues);
    validateWeights(workout, options, issues);
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    workout: schemaOk ? (workout as WorkoutOutput) : null,
  };
}

/**
 * Throwing variant — useful in tests or strict pipelines.
 */
export function assertValidWorkout(
  workout: unknown,
  options: WeightValidationOptions = {},
): WorkoutOutput {
  const result = validateWorkout(workout, options);
  if (!result.valid || !result.workout) {
    const summary = result.errors
      .map((e) => `[${e.code}] ${e.path}: ${e.message}`)
      .join("\n");
    throw new Error(`Invalid workout:\n${summary}`);
  }
  return result.workout;
}
