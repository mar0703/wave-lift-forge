// ─────────────────────────────────────────────────────────────────────────────
// Recovery Domain Intelligence Engine
//
// Pure analytics layer. Models recovery as multiple independent domains
// (CNS, legs, pull-chain, overhead, technical coordination, speed freshness)
// rather than a single fatigue scalar. Emits per-domain freshness scores and
// flags degraded / protected domains for downstream sequencing + intervention
// safety.
//
// Does NOT generate workouts. Does NOT mutate state. Does NOT replace the
// fatigue-engine — it complements it with directional resolution.
// ─────────────────────────────────────────────────────────────────────────────

import type { MicrocycleSession } from "./microcycle-engine";
import type { FatigueState } from "./exercise-intervention-engine";

// ────────────────────────────────────────────────────────────
// 1. TYPES
// ────────────────────────────────────────────────────────────

export type RuntimeClock = { now(): number };

export interface RecoveryDomains {
  /** 0 = collapsed, 100 = fully fresh */
  cns: number;
  legs: number;
  pull_chain: number;
  overhead: number;
  technical_coordination: number;
  speed_freshness: number;
}

export interface RecoveryInput {
  /** chronological, oldest → newest */
  recent_sessions: MicrocycleSession[];
  fatigue_state?: FatigueState;
  readiness?: number;       // 0–100
  sleep_quality?: number;   // 0–100
  soreness?: number;        // 0–100 (higher = more sore)
}

export interface RecoveryDecision {
  recovery_domains: RecoveryDomains;
  /** domains < degraded threshold (≤ 45) */
  degraded_domains: string[];
  /** domains that must be protected from further loading (≤ 30 or coordination-critical) */
  protected_domains: string[];
  recovery_notes: string[];
}

// ────────────────────────────────────────────────────────────
// 2. RECOVERY KINETICS
//
// Each domain recovers at a different rate per "day since exposure".
// Values are recovery percentage points returned per 24h.
// ────────────────────────────────────────────────────────────

const DOMAIN_RECOVERY_RATE_PER_DAY: Record<keyof RecoveryDomains, number> = {
  // CNS lags behind local muscular recovery
  cns: 18,
  // Local muscular tissue recovers comparatively quickly
  legs: 28,
  pull_chain: 26,
  // Overhead structures (shoulder/scap stabilizers) lag
  overhead: 16,
  // Technical coordination recovers slowest after high-complexity exposure
  technical_coordination: 14,
  // Speed freshness rebuilds quickly when not re-stressed
  speed_freshness: 22,
};

// ────────────────────────────────────────────────────────────
// 3. PER-SESSION DOMAIN COST
//
// Translates a session into the residual cost it imposes on each domain.
// Returned values are 0–100 "fatigue points deposited" per domain.
// ────────────────────────────────────────────────────────────

function sessionDomainCost(s: MicrocycleSession): RecoveryDomains {
  const cns = s.cns_load ?? 0;
  const tech = s.technical_load ?? 0;
  const local = s.local_load ?? 0;
  const overhead = s.overhead_stress ?? 0;
  const squat = s.squat_stress ?? 0;
  const pull = s.pull_stress ?? 0;
  const intensity = s.intensity_avg ?? 0;
  const complexity = (s.complexity_avg ?? 0) * 10; // → 0–100
  const specificity = s.specificity_score ?? 0;

  // Heavy squats → leg + CNS fatigue
  const legCost = clamp(squat * 0.9 + local * 0.4 + intensity * 0.15);

  // Heavy pulls → pull-chain + CNS fatigue
  const pullCost = clamp(pull * 0.9 + local * 0.3 + intensity * 0.15);

  // Heavy overhead → overhead + coordination fatigue
  const overheadCost = clamp(overhead * 0.95 + complexity * 0.25);

  // CNS pooled from heavy + intense + explosive contributions
  const cnsCost = clamp(
    cns * 0.85 +
      intensity * 0.25 +
      Math.max(squat, pull, overhead) * 0.2,
  );

  // Technical coordination: complexity + technical load + overhead echo
  const techCost = clamp(
    tech * 0.7 + complexity * 0.6 + overhead * 0.2 + specificity * 0.15,
  );

  // Speed freshness erodes with explosive / specific work and high intensity
  const speedCost = clamp(
    specificity * 0.5 + intensity * 0.4 + cns * 0.25,
  );

  return {
    cns: cnsCost,
    legs: legCost,
    pull_chain: pullCost,
    overhead: overheadCost,
    technical_coordination: techCost,
    speed_freshness: speedCost,
  };
}

// ────────────────────────────────────────────────────────────
// 4. RECOVERY SIMULATION
//
// Walks the session timeline forward, depositing per-domain fatigue and
// applying per-domain recovery between sessions. Returns final freshness.
// ────────────────────────────────────────────────────────────

export function calculateRecoveryDomains(
  input: RecoveryInput,
  clock: RuntimeClock,
): RecoveryDomains {
  // Start fully fresh, subtract accumulated residual fatigue at the end.
  const fatigue: RecoveryDomains = {
    cns: 0,
    legs: 0,
    pull_chain: 0,
    overhead: 0,
    technical_coordination: 0,
    speed_freshness: 0,
  };

  const sessions = [...input.recent_sessions].sort((a, b) =>
    (a.date ?? "").localeCompare(b.date ?? ""),
  );

  let prevDate: Date | null = null;

  for (const s of sessions) {
    const d = s.date ? new Date(s.date) : null;
    if (prevDate && d) {
      const days = Math.max(
        0,
        (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      decay(fatigue, days);
    }

    if (s.recovery_day || s.restoration_day) {
      // Restoration day: no new deposits, mild bonus recovery for coord/CNS.
      fatigue.cns = Math.max(0, fatigue.cns - 6);
      fatigue.technical_coordination = Math.max(
        0,
        fatigue.technical_coordination - 4,
      );
    } else {
      const cost = sessionDomainCost(s);
      (Object.keys(fatigue) as (keyof RecoveryDomains)[]).forEach((k) => {
        fatigue[k] = Math.min(100, fatigue[k] + cost[k]);
      });
    }

    if (d) prevDate = d;
  }

  // Decay from last session to "today" (best-effort if dates exist).
  if (prevDate) {
    const days =
      (clock.now() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    if (days > 0) decay(fatigue, days);
  }

  // Modifiers from subjective + readiness inputs
  const readinessMod = input.readiness != null ? (input.readiness - 50) / 5 : 0;
  const sleepMod =
    input.sleep_quality != null ? (input.sleep_quality - 50) / 6 : 0;
  const sorenessMod = input.soreness != null ? input.soreness / 6 : 0;
  const stateMod = fatigueStateModifier(input.fatigue_state);

  const freshness: RecoveryDomains = {
    cns: clamp(100 - fatigue.cns + readinessMod + sleepMod - stateMod),
    legs: clamp(100 - fatigue.legs - sorenessMod * 1.2),
    pull_chain: clamp(100 - fatigue.pull_chain - sorenessMod),
    overhead: clamp(100 - fatigue.overhead - sorenessMod * 0.8 - stateMod * 0.5),
    technical_coordination: clamp(
      100 - fatigue.technical_coordination + sleepMod * 0.8 - stateMod,
    ),
    speed_freshness: clamp(
      100 - fatigue.speed_freshness + readinessMod * 1.2 - stateMod,
    ),
  };

  return freshness;
}

// ────────────────────────────────────────────────────────────
// 5. DECISION LAYER
// ────────────────────────────────────────────────────────────

const DOMAIN_LABELS: Record<keyof RecoveryDomains, string> = {
  cns: "CNS",
  legs: "Legs",
  pull_chain: "Pull chain",
  overhead: "Overhead",
  technical_coordination: "Technical coordination",
  speed_freshness: "Speed freshness",
};

const DEGRADED_THRESHOLD = 45;
const PROTECTED_THRESHOLD = 30;
// Coordination is treated more conservatively — coaching error to push it.
const COORD_PROTECTED_THRESHOLD = 40;

export function evaluateRecovery(
  input: RecoveryInput,
  clock: RuntimeClock,
): RecoveryDecision {
  const domains = calculateRecoveryDomains(input, clock);

  const degraded: string[] = [];
  const protectedDomains: string[] = [];
  const notes: string[] = [];

  (Object.keys(domains) as (keyof RecoveryDomains)[]).forEach((k) => {
    const v = domains[k];
    const label = DOMAIN_LABELS[k];

    if (v <= DEGRADED_THRESHOLD) degraded.push(k);

    const protectThreshold =
      k === "technical_coordination"
        ? COORD_PROTECTED_THRESHOLD
        : PROTECTED_THRESHOLD;
    if (v <= protectThreshold) protectedDomains.push(k);

    if (v <= PROTECTED_THRESHOLD) {
      notes.push(`${label} severely depleted (${Math.round(v)}/100) — block heavy loading.`);
    } else if (v <= DEGRADED_THRESHOLD) {
      notes.push(`${label} degraded (${Math.round(v)}/100) — reduce volume / intensity.`);
    }
  });

  // Cross-domain conflict notes
  if (
    domains.technical_coordination <= COORD_PROTECTED_THRESHOLD &&
    domains.legs > 65
  ) {
    notes.push(
      "Coordination degraded while muscular freshness intact — soreness ≠ recovery; avoid high-complexity work.",
    );
  }
  if (domains.cns <= 40 && domains.legs > 60) {
    notes.push("CNS lagging behind muscular recovery — keep intensity submaximal.");
  }
  if (domains.overhead <= 40 && domains.speed_freshness > 60) {
    notes.push("Overhead structures lagging — defer jerks / overhead volume.");
  }
  if (domains.speed_freshness <= 40) {
    notes.push("Speed freshness eroded — emphasize lighter, crisp efforts.");
  }

  return {
    recovery_domains: domains,
    degraded_domains: degraded,
    protected_domains: protectedDomains,
    recovery_notes: notes,
  };
}

// ────────────────────────────────────────────────────────────
// 6. HELPERS
// ────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function decay(fatigue: RecoveryDomains, days: number): void {
  (Object.keys(fatigue) as (keyof RecoveryDomains)[]).forEach((k) => {
    const rate = DOMAIN_RECOVERY_RATE_PER_DAY[k];
    fatigue[k] = Math.max(0, fatigue[k] - rate * days);
  });
}

function fatigueStateModifier(state?: FatigueState): number {
  switch (state) {
    case "collapse":
      return 25;
    case "high":
      return 12;
    case "moderate":
      return 5;
    case "fresh":
    default:
      return 0;
  }
}
