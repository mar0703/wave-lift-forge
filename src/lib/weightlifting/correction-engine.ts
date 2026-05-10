// Correction decision engine.
// Pure logic — does NOT touch coach pipeline, engine-store, or UI.
// Decides: which problem matters most, what root cause to address,
// which correctives are safe, what stage of correction we're in,
// and how training phase + trend + fatigue shape the strategy.

import {
  EXERCISE_DB,
  getExerciseById,
  getSafeExercises,
  type ExerciseDef,
  type TransferProfile,
} from "../exercise-db";
import {
  PROBLEM_PRIORITY,
  ROOT_CAUSE_MAP,
  getProblemTrend,
  selectCorrectives as selectCorrectivesByPhase,
  type Trend,
} from "../diagnostics";
import {
  getPhaseFromProblem,
  type MovementPhase,
} from "./movement-model";

// ────────────────────────
// TYPES
// ────────────────────────

export type ProblemTrend = Trend;

export type CorrectionStage =
  | "awareness"
  | "acquisition"
  | "stabilization"
  | "integration"
  | "automation";

export type TrainingPhase = "accumulation" | "intensification" | "peak" | "deload";

export interface CorrectionCandidate {
  exercise_id: string;
  transfer_score: number;     // 0..1
  fatigue_score: number;      // 0..1 (higher = better i.e. lower fatigue)
  complexity_score: number;   // 0..1 (higher = better i.e. more appropriate)
  safety_score: number;       // 0..1
  final_score: number;        // 0..1
  rejection_reason?: string;
}

export interface CorrectionDecision {
  primary_problem: string;
  root_cause?: string;
  root_cause_confidence?: number;
  movement_phase?: MovementPhase;
  correction_stage?: CorrectionStage;
  selected_correctives: CorrectionCandidate[];
  rejected_correctives: CorrectionCandidate[];
  correction_score: number;
  correction_strategy: string[];
  trend: ProblemTrend;
  notes: string[];
}

export interface CorrectionContext {
  problems: string[];
  correction_state: Record<string, number>;
  history?: Record<string, number>[]; // newest first
  exercise_results?: Record<string, { success_rate: number; avg_rpe: number }>;
  readiness: number;          // 0..10
  fatigue: number;            // 0..100
  training_phase: TrainingPhase;
  primary_lift?: keyof TransferProfile; // snatch | clean | jerk
  // Optional coach overrides
  forced_problem?: string;
  forced_correctives?: string[];
  banned_correctives?: string[];
  lock_focus?: boolean;
  disable_progression?: boolean;
}

// ────────────────────────
// CORRECTION PRIORITY
// ────────────────────────

export interface CorrectionScoreInput {
  problem: string;
  correction_state: Record<string, number>;
  history?: Record<string, number>[];
  exercise_results?: Record<string, { success_rate: number; avg_rpe: number }>;
}

export function calculateCorrectionScore(input: CorrectionScoreInput): number {
  const { problem, correction_state, history, exercise_results } = input;
  const severity = PROBLEM_PRIORITY[problem] ?? 1;
  const recurrence = correction_state[problem] ?? 0;

  // Confidence: more history snapshots referencing the problem = more confidence.
  const seen = (history ?? []).filter((h) => (h?.[problem] ?? 0) > 0).length;
  const confidence = Math.min(1, seen / 3);

  const trend = history ? getProblemTrend(problem, history) : "stable";
  const trendBonus = trend === "worsening" ? 2 : trend === "improving" ? -1 : 0;

  // Competition impact: high-priority problems near competition lifts hurt more.
  const competitionImpact = severity >= 3 ? 1 : 0;

  // Recent in-session signal: low success / high RPE on related exercises.
  let recentSignal = 0;
  if (exercise_results) {
    for (const r of Object.values(exercise_results)) {
      if (r.success_rate < 80 || r.avg_rpe > 8) {
        recentSignal += 0.25;
      }
    }
    recentSignal = Math.min(1, recentSignal);
  }

  return (
    severity * 2 +
    recurrence +
    confidence +
    trendBonus +
    competitionImpact +
    recentSignal
  );
}

// ────────────────────────
// PRIMARY PROBLEM (root-cause aware)
// ────────────────────────

export function getPrimaryProblem(ctx: CorrectionContext): string | undefined {
  if (ctx.forced_problem) return ctx.forced_problem;
  if (!ctx.problems.length) return undefined;

  // Deterministic stabilization: secondary comparator by problem name for equal scores.
  const ranked = [...ctx.problems].sort((a, b) => {
    const scoreDiff =
      calculateCorrectionScore({
        problem: b,
        correction_state: ctx.correction_state,
        history: ctx.history,
        exercise_results: ctx.exercise_results,
      }) -
      calculateCorrectionScore({
        problem: a,
        correction_state: ctx.correction_state,
        history: ctx.history,
        exercise_results: ctx.exercise_results,
      });
    if (scoreDiff !== 0) return scoreDiff;
    // Stable tie-breaker: lexical order by problem name (deterministic, semantically neutral)
    return a.localeCompare(b);
  });

  // Prefer root cause over symptom: if a candidate root cause is itself
  // present in the problem list, focus on that root cause instead.
  const top = ranked[0];
  const candidates = ROOT_CAUSE_MAP[top] ?? [];
  for (const cause of candidates) {
    if (ctx.problems.includes(cause)) return cause;
  }
  return top;
}

export function inferRootCause(
  problem: string,
  ctx: CorrectionContext,
): { cause?: string; confidence: number } {
  const candidates = ROOT_CAUSE_MAP[problem];
  if (!candidates?.length) return { confidence: 0 };

  // Confidence: present in problem list > present in correction_state > none.
  const scored = candidates.map((c) => {
    let s = 0;
    if (ctx.problems.includes(c)) s += 0.6;
    if ((ctx.correction_state[c] ?? 0) > 0) s += 0.3;
    if (ctx.history?.some((h) => (h?.[c] ?? 0) > 0)) s += 0.1;
    return { cause: c, confidence: s };
  });
  // Deterministic stabilization: secondary comparator by cause name for equal confidence.
  scored.sort((a, b) => {
    const confDiff = b.confidence - a.confidence;
    if (confDiff !== 0) return confDiff;
    // Stable tie-breaker: lexical order by cause name (deterministic, semantically neutral)
    return a.cause.localeCompare(b.cause);
  });
  return scored[0];
}

// ────────────────────────
// CORRECTION STAGE
// ────────────────────────

export function inferCorrectionStage(
  problem: string,
  ctx: CorrectionContext,
): CorrectionStage {
  const recurrence = ctx.correction_state[problem] ?? 0;
  const trend = ctx.history ? getProblemTrend(problem, ctx.history) : "stable";

  if (recurrence < 1) return "awareness";
  if (recurrence < 3) return "acquisition";
  if (trend === "worsening") return "acquisition";
  if (recurrence < 5) return "stabilization";
  if (trend === "improving") return "integration";
  return "automation";
}

// ────────────────────────
// CORRECTIVE SCORING
// ────────────────────────

function transferOf(ex: ExerciseDef, lift?: keyof TransferProfile): number {
  if (!lift) {
    const t = ex.transfer_to;
    if (!t) return 0.4;
    const vals = [t.snatch, t.clean, t.jerk].filter(
      (v): v is number => typeof v === "number",
    );
    return vals.length ? Math.max(...vals) : 0.4;
  }
  return ex.transfer_to?.[lift] ?? 0.3;
}

function complexityFitness(ex: ExerciseDef, readiness: number): number {
  const tc = ex.technical_complexity ?? ex.difficulty;
  // ideal when tc ≈ readiness; falls off fast above readiness+2.
  const diff = Math.abs(tc - readiness);
  if (tc > readiness + 2) return 0;
  return Math.max(0, 1 - diff / 5);
}

function fatigueFitness(ex: ExerciseDef, fatigue: number): number {
  const fc = ex.fatigue_cost ?? ex.difficulty * 1.5;
  // higher fatigue in athlete → punish high-cost drills more.
  const fatigueFactor = fatigue / 100;
  const cost = fc / 10;
  return Math.max(0, 1 - cost * (0.5 + fatigueFactor));
}

function safetyOf(
  ex: ExerciseDef,
  ctx: CorrectionContext,
): { score: number; reason?: string } {
  const tc = ex.technical_complexity ?? ex.difficulty;
  if (tc > ctx.readiness + 2) {
    return { score: 0, reason: "complexity > readiness+2" };
  }
  if (ctx.fatigue > 80 && ex.fatigue_type === "cns") {
    return { score: 0, reason: "CNS-heavy under high fatigue" };
  }
  if (ctx.fatigue > 90 && (ex.fatigue_cost ?? 0) >= 7) {
    return { score: 0, reason: "fatigue_cost too high for current fatigue" };
  }
  if (ctx.readiness < 3 && tc >= 4) {
    return { score: 0.2, reason: "low readiness, high complexity" };
  }
  return { score: 1 };
}

function scoreCandidate(
  id: string,
  ctx: CorrectionContext,
): CorrectionCandidate {
  const ex = getExerciseById(id);
  if (!ex) {
    return {
      exercise_id: id,
      transfer_score: 0,
      fatigue_score: 0,
      complexity_score: 0,
      safety_score: 0,
      final_score: 0,
      rejection_reason: "unknown exercise",
    };
  }
  const transfer_score = transferOf(ex, ctx.primary_lift);
  const fatigue_score = fatigueFitness(ex, ctx.fatigue);
  const complexity_score = complexityFitness(ex, ctx.readiness);
  const { score: safety_score, reason } = safetyOf(ex, ctx);

  // Weighted aggregate. Safety is a hard gate.
  const final_score =
    safety_score === 0
      ? 0
      : 0.4 * transfer_score +
        0.25 * fatigue_score +
        0.2 * complexity_score +
        0.15 * safety_score;

  return {
    exercise_id: id,
    transfer_score,
    fatigue_score,
    complexity_score,
    safety_score,
    final_score,
    rejection_reason: safety_score === 0 ? reason : undefined,
  };
}

// ────────────────────────
// STAGE / PHASE STRATEGY ADJUSTMENTS
// ────────────────────────

function maxCorrectivesFor(
  stage: CorrectionStage,
  phase: TrainingPhase,
): number {
  if (phase === "peak") return 1;
  if (phase === "deload") return 1;
  if (stage === "automation") return 1;
  if (stage === "integration") return 1;
  return 2; // awareness / acquisition / stabilization
}

function preferLowComplexity(stage: CorrectionStage): boolean {
  return stage === "awareness" || stage === "acquisition";
}

// ────────────────────────
// SELECT CORRECTIVES
// ────────────────────────

export function selectCorrectives(
  primary_problem: string,
  ctx: CorrectionContext,
): { selected: CorrectionCandidate[]; rejected: CorrectionCandidate[] } {
  // 1. coach overrides — forced list bypasses scoring but still safety-filtered
  let candidateIds: string[];
  if (ctx.forced_correctives?.length) {
    candidateIds = ctx.forced_correctives.filter((id) => !!getExerciseById(id));
  } else {
    candidateIds = selectCorrectivesByPhase([primary_problem]);
  }

  // expand with phase pool if too thin
  const phase = getPhaseFromProblem(primary_problem);
  if (candidateIds.length < 3 && phase) {
    const pool = EXERCISE_DB.filter(
      (e) => e.primary_phase === phase || e.secondary_phases?.includes(phase),
    ).map((e) => e.id);
    candidateIds = [...new Set([...candidateIds, ...pool])];
  }

  // remove banned + dedupe
  const banned = new Set(ctx.banned_correctives ?? []);
  candidateIds = [...new Set(candidateIds)].filter((id) => !banned.has(id));

  const stage = inferCorrectionStage(primary_problem, ctx);
  const trainingPhase = ctx.training_phase;

  // Score everything
  const scored = candidateIds.map((id) => scoreCandidate(id, ctx));

  // Hard reject
  const rejected = scored.filter((c) => c.final_score === 0);
  let viable = scored.filter((c) => c.final_score > 0);

  // Stage/phase-based bias
  if (preferLowComplexity(stage)) {
    viable = viable.sort(
      (a, b) =>
        b.complexity_score - a.complexity_score ||
        b.final_score - a.final_score,
    );
  } else if (trainingPhase === "peak" || stage === "integration") {
    viable = viable.sort(
      (a, b) =>
        b.transfer_score - a.transfer_score || b.final_score - a.final_score,
    );
  } else {
    // Deterministic stabilization: secondary comparator by exercise_id for equal scores.
    viable = viable.sort((a, b) => {
      const scoreDiff = b.final_score - a.final_score;
      if (scoreDiff !== 0) return scoreDiff;
      // Stable tie-breaker: lexical order by exercise_id (deterministic, semantically neutral)
      return a.exercise_id.localeCompare(b.exercise_id);
    });
  }

  // Volume cap
  const cap = maxCorrectivesFor(stage, trainingPhase);

  // Avoid stacking multiple high-complexity / multi-CNS drills for same phase
  const selected: CorrectionCandidate[] = [];
  let cnsHits = 0;
  let highComplexityHits = 0;
  for (const c of viable) {
    if (selected.length >= cap) break;
    const ex = getExerciseById(c.exercise_id)!;
    const tc = ex.technical_complexity ?? ex.difficulty;
    if (ex.fatigue_type === "cns" && cnsHits >= 1) continue;
    if (tc >= 4 && highComplexityHits >= 1) continue;
    selected.push(c);
    if (ex.fatigue_type === "cns") cnsHits++;
    if (tc >= 4) highComplexityHits++;
  }

  // Push any leftover viable into rejected for transparency
  for (const c of viable) {
    if (!selected.find((s) => s.exercise_id === c.exercise_id)) {
      rejected.push({ ...c, rejection_reason: c.rejection_reason ?? "capped" });
    }
  }

  return { selected, rejected };
}

// ────────────────────────
// STRATEGY NOTES
// ────────────────────────

function buildStrategy(
  stage: CorrectionStage,
  trainingPhase: TrainingPhase,
  trend: ProblemTrend,
): string[] {
  const out: string[] = [];

  if (trend === "worsening") {
    out.push("Trend worsening: simplify drills, drop intensity.");
  } else if (trend === "improving") {
    out.push("Trend improving: reduce corrective volume, add specificity.");
  } else {
    out.push("Trend stable: maintain corrective exposure.");
  }

  switch (stage) {
    case "awareness":
      out.push("Stage: awareness — simple positional drills, low intensity.");
      break;
    case "acquisition":
      out.push("Stage: acquisition — repeatable patterning, moderate volume.");
      break;
    case "stabilization":
      out.push("Stage: stabilization — consistent execution under light load.");
      break;
    case "integration":
      out.push(
        "Stage: integration — bias high-transfer drills, raise specificity.",
      );
      break;
    case "automation":
      out.push("Stage: automation — minimal isolated correction, embed in lifts.");
      break;
  }

  switch (trainingPhase) {
    case "accumulation":
      out.push("Phase: accumulation — more technical work, simpler correctives.");
      break;
    case "intensification":
      out.push("Phase: intensification — fewer correctives, prefer high transfer.");
      break;
    case "peak":
      out.push("Phase: peak — minimal correction, preserve competition specificity.");
      break;
    case "deload":
      out.push("Phase: deload — only safe low-complexity exposure.");
      break;
  }

  return out;
}

// ────────────────────────
// MAIN ENTRY
// ────────────────────────

export function decideCorrection(ctx: CorrectionContext): CorrectionDecision {
  const notes: string[] = [];

  const primary = getPrimaryProblem(ctx);
  if (!primary) {
    return {
      primary_problem: "",
      selected_correctives: [],
      rejected_correctives: [],
      correction_score: 0,
      correction_strategy: ["No active problems — preserve baseline workout."],
      trend: "stable",
      notes: ["empty problem set"],
    };
  }

  const trend = ctx.history ? getProblemTrend(primary, ctx.history) : "stable";
  const stage = ctx.disable_progression
    ? "stabilization"
    : inferCorrectionStage(primary, ctx);
  const phase = getPhaseFromProblem(primary);
  const { cause, confidence } = inferRootCause(primary, ctx);

  if (cause && cause !== primary) {
    notes.push(`Root cause inferred: ${cause} (conf ${confidence.toFixed(2)})`);
  }

  const score = calculateCorrectionScore({
    problem: primary,
    correction_state: ctx.correction_state,
    history: ctx.history,
    exercise_results: ctx.exercise_results,
  });

  // If correction is no longer needed (low score, automation, improving trend) — skip.
  const skipCorrection =
    !ctx.forced_correctives?.length &&
    stage === "automation" &&
    trend !== "worsening" &&
    score < 4;

  let selected: CorrectionCandidate[] = [];
  let rejected: CorrectionCandidate[] = [];

  if (skipCorrection) {
    notes.push("Correction skipped: automation reached, problem under control.");
  } else {
    const result = selectCorrectives(primary, ctx);
    selected = result.selected;
    rejected = result.rejected;
  }

  // Failure protection: if nothing safe came back, try a wider safe pool.
  if (!selected.length && !skipCorrection && phase) {
    const pool = EXERCISE_DB.filter(
      (e) => e.primary_phase === phase && e.role !== "main",
    );
    const safe = getSafeExercises(pool, {
      readiness: ctx.readiness,
      fatigue: ctx.fatigue,
    });
    selected = safe.slice(0, 1).map((ex) => scoreCandidate(ex.id, ctx));
    if (selected.length) {
      notes.push("Fallback: nearest safe phase-matched corrective.");
    }
  }

  // Final dedupe
  const seen = new Set<string>();
  selected = selected.filter((c) => {
    if (seen.has(c.exercise_id)) return false;
    seen.add(c.exercise_id);
    return true;
  });

  return {
    primary_problem: primary,
    root_cause: cause,
    root_cause_confidence: confidence,
    movement_phase: phase,
    correction_stage: stage,
    selected_correctives: selected,
    rejected_correctives: rejected,
    correction_score: score,
    correction_strategy: buildStrategy(stage, ctx.training_phase, trend),
    trend,
    notes,
  };
}
