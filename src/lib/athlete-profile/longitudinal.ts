/**
 * ATHLETE PROFILE — LONGITUDINAL SNAPSHOTS (additive, deterministic)
 *
 * Doctrine:
 *   - Profile evolution is explicit, versioned, serializable, replay-visible.
 *   - No implicit profile mutation. No hidden adaptive state. No invisible
 *     behavioral memory accumulating in the background.
 *   - Each snapshot is immutable. Updates produce NEW evolution objects via
 *     pure function composition.
 *   - Snapshots may be summarized but the underlying observations are never
 *     auto-merged into a single "true" profile; the history is the source.
 */

import type { AthleteProfile, ProfileCertainty } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// SNAPSHOT + EVOLUTION TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ProfileSnapshot {
  readonly snapshot_id: string;
  readonly profile: AthleteProfile;
  readonly superseded_by?: string;
  readonly notes: readonly string[];
}

export interface ProfileEvolution {
  readonly athlete_handle: string;
  readonly snapshots: readonly ProfileSnapshot[];
}

// ─────────────────────────────────────────────────────────────────────────────
// EVOLUTION CONSTRUCTORS (pure)
// ─────────────────────────────────────────────────────────────────────────────

export function createEvolution(
  athlete_handle: string,
  initial_snapshot: ProfileSnapshot,
): ProfileEvolution {
  return {
    athlete_handle,
    snapshots: [initial_snapshot],
  };
}

/**
 * Append a new snapshot, marking the previous head as superseded.
 * Pure function — returns a new ProfileEvolution; the input value is not
 * mutated. The previous-head supersede link is observational; it never
 * deletes data.
 */
export function appendSnapshot(
  evolution: ProfileEvolution,
  next_snapshot: ProfileSnapshot,
): ProfileEvolution {
  if (evolution.snapshots.length === 0) {
    return {
      athlete_handle: evolution.athlete_handle,
      snapshots: [next_snapshot],
    };
  }

  const prior = evolution.snapshots.slice(0, -1);
  const head = evolution.snapshots[evolution.snapshots.length - 1];
  const supersededHead: ProfileSnapshot = {
    snapshot_id: head.snapshot_id,
    profile: head.profile,
    superseded_by: next_snapshot.snapshot_id,
    notes: head.notes,
  };

  return {
    athlete_handle: evolution.athlete_handle,
    snapshots: [...prior, supersededHead, next_snapshot],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EVOLUTION INSPECTION (pure projections)
// ─────────────────────────────────────────────────────────────────────────────

export function currentSnapshot(
  evolution: ProfileEvolution,
): ProfileSnapshot | undefined {
  if (evolution.snapshots.length === 0) return undefined;
  return evolution.snapshots[evolution.snapshots.length - 1];
}

export interface EvolutionSummary {
  readonly athlete_handle: string;
  readonly snapshot_count: number;
  readonly first_captured_at?: string;
  readonly latest_captured_at?: string;
  readonly latest_certainty?: ProfileCertainty;
  readonly version_range?: readonly [number, number];
}

export function summarizeEvolution(
  evolution: ProfileEvolution,
): EvolutionSummary {
  if (evolution.snapshots.length === 0) {
    return {
      athlete_handle: evolution.athlete_handle,
      snapshot_count: 0,
    };
  }
  const first = evolution.snapshots[0];
  const last = evolution.snapshots[evolution.snapshots.length - 1];
  const versions = evolution.snapshots.map((s) => s.profile.profile_version);
  return {
    athlete_handle: evolution.athlete_handle,
    snapshot_count: evolution.snapshots.length,
    first_captured_at: first.profile.captured_at,
    latest_captured_at: last.profile.captured_at,
    latest_certainty: last.profile.certainty,
    version_range: [Math.min(...versions), Math.max(...versions)],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISM ASSERTIONS (static)
// ─────────────────────────────────────────────────────────────────────────────

export interface LongitudinalDeterminismGuarantee {
  readonly guarantee: string;
  readonly enforced_by: "type_system" | "construction" | "convention";
}

export const LONGITUDINAL_DETERMINISM_GUARANTEES: readonly LongitudinalDeterminismGuarantee[] = [
  {
    guarantee: "snapshots are immutable — all fields readonly",
    enforced_by: "type_system",
  },
  {
    guarantee: "evolution updates produce new objects, never mutate input",
    enforced_by: "construction",
  },
  {
    guarantee: "captured_at uses ISO-8601 strings, not Date objects",
    enforced_by: "type_system",
  },
  {
    guarantee: "no Map / Set / WeakMap / WeakSet in profile types",
    enforced_by: "construction",
  },
  {
    guarantee: "supersede links are observational and additive only",
    enforced_by: "construction",
  },
  {
    guarantee: "no hidden adaptive state — full history is the source of truth",
    enforced_by: "convention",
  },
];
