import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { generateAdaptiveWorkout, type AugmentInput } from "@/lib/adaptive-workout";
import { mapWorkoutToUI, type UIExercise } from "@/lib/workout-adapter";
import { postWorkoutAdaptation, type AdaptationResult } from "@/lib/training-engine";

export const Route = createFileRoute("/workout")({
  component: ActiveWorkout,
});

const DEFAULT_INPUT: AugmentInput = {
  daily_snatch_max: 115,
  daily_clean_jerk_max: 140,
  readiness: 7,
  fatigue_score: 45,
  body_type: "meso",
  dosha: "pitta",
  training_day_index: 1,
  user_maxes: {
    snatch: 115,
    clean_jerk: 140,
    jerk_rack: 150,
    front_squat: 170,
    back_squat: 195,
    clean_pull: 150,
    snatch_pull: 125,
    power_snatch: 92,
  },
};

interface SetLog {
  reps: number;
  rpe: number;
  completed: boolean;
}

function ActiveWorkout() {
  const ui = useMemo(
    () => mapWorkoutToUI(generateAdaptiveWorkout(DEFAULT_INPUT)),
    []
  );
  const exercises: UIExercise[] = useMemo(
    () => ui.blocks.flatMap((b) => b.exercises),
    [ui]
  );

  // logs[exerciseIdx][setIdx]
  const [logs, setLogs] = useState<SetLog[][]>(() =>
    exercises.map((e) =>
      Array.from({ length: e.sets }, () => ({
        reps: e.reps,
        rpe: 7,
        completed: false,
      }))
    )
  );
  const [exIdx, setExIdx] = useState(0);
  const [result, setResult] = useState<AdaptationResult | null>(null);

  const current = exercises[exIdx];
  const currentLog = logs[exIdx] ?? [];

  const updateSet = (setIdx: number, patch: Partial<SetLog>) => {
    setLogs((prev) =>
      prev.map((sets, i) =>
        i === exIdx
          ? sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s))
          : sets
      )
    );
  };

  const finish = () => {
    const flat = logs.flat();
    const total = flat.length;
    const done = flat.filter((s) => s.completed);
    const success_rate = total > 0 ? (done.length / total) * 100 : 0;
    const avgRpe =
      done.length > 0 ? done.reduce((a, s) => a + s.rpe, 0) / done.length : 0;
    const sessionLoad = exercises.reduce(
      (acc, e, i) =>
        acc +
        (logs[i]?.filter((s) => s.completed).length ?? 0) *
          e.reps *
          (e.intensity_pct / 100),
      0
    );

    const adaptation = postWorkoutAdaptation({
      success_rate,
      average_RPE: avgRpe,
      current_intensity: ui.intensity / 100,
      previous_fatigue: DEFAULT_INPUT.fatigue_score,
      session_load_factor: Math.min(40, sessionLoad / 5),
      recovery_factor: 10,
    });
    setResult(adaptation);
  };

  if (result) {
    return (
      <div className="dark bg-background text-on-surface min-h-screen p-6 flex flex-col gap-lg max-w-3xl mx-auto">
        <h1 className="font-h2-headline text-h2-headline">Session Complete</h1>
        <div className="bg-surface-container-low border border-white/10 rounded-xl p-lg flex flex-col gap-sm">
          <div className="flex justify-between">
            <span className="text-on-surface-variant">Next intensity</span>
            <span className="font-data-point">{result.next_intensity_pct}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-on-surface-variant">New fatigue</span>
            <span className="font-data-point">{result.new_fatigue_score}</span>
          </div>
          <div className="flex flex-col gap-xs mt-sm">
            {result.adjustments.map((a, i) => (
              <span key={i} className="text-[13px] text-on-surface-variant">
                · {a}
              </span>
            ))}
          </div>
        </div>
        <Link
          to="/"
          className="bg-secondary-container text-black font-black uppercase py-4 rounded-lg text-center"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="dark bg-background text-on-surface min-h-screen p-6">
        No exercises.
      </div>
    );
  }

  return (
    <div className="dark bg-background text-on-surface min-h-screen pb-24 flex flex-col">
      <header className="bg-[#121212] flex justify-between items-center px-6 h-20 border-b border-white/10">
        <Link to="/" className="text-[#FF5F1F]">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-black text-[#FF5F1F] tracking-widest uppercase">
          {current.name}
        </h1>
        <span className="font-data-point text-on-surface-variant text-sm">
          {exIdx + 1}/{exercises.length}
        </span>
      </header>

      <main className="flex-grow px-6 py-md flex flex-col gap-lg max-w-3xl mx-auto w-full">
        <section className="bg-surface-container-low border border-white/10 rounded-xl p-lg flex flex-col gap-xs">
          <span className="font-label-caps text-label-caps text-secondary-container uppercase">
            {current.group}
          </span>
          <h2 className="font-h3-section text-h3-section">{current.prescription}</h2>
          <span className="font-data-point text-[28px]">{current.weight_kg} kg</span>
        </section>

        <section className="flex flex-col gap-md">
          {currentLog.map((s, i) => (
            <div
              key={i}
              className="bg-surface-container-low border border-white/10 rounded-xl p-md flex items-center gap-md"
            >
              <span className="font-label-caps text-on-surface-variant w-12">
                SET {i + 1}
              </span>
              <label className="flex flex-col text-[10px] text-on-surface-variant flex-1">
                REPS
                <input
                  type="number"
                  value={s.reps}
                  onChange={(e) =>
                    updateSet(i, { reps: parseInt(e.target.value) || 0 })
                  }
                  className="bg-surface-container-high rounded px-2 py-1 text-on-surface text-[14px]"
                />
              </label>
              <label className="flex flex-col text-[10px] text-on-surface-variant flex-1">
                RPE
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={s.rpe}
                  onChange={(e) =>
                    updateSet(i, { rpe: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-surface-container-high rounded px-2 py-1 text-on-surface text-[14px]"
                />
              </label>
              <button
                onClick={() => updateSet(i, { completed: !s.completed })}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  s.completed
                    ? "bg-secondary-container text-black"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
                aria-label="Toggle set complete"
              >
                <span className="material-symbols-outlined">check</span>
              </button>
            </div>
          ))}
        </section>

        <div className="flex gap-md">
          {exIdx > 0 && (
            <button
              onClick={() => setExIdx((i) => i - 1)}
              className="flex-1 bg-surface-container-high text-on-surface font-bold uppercase py-3 rounded-lg"
            >
              Prev
            </button>
          )}
          {exIdx < exercises.length - 1 ? (
            <button
              onClick={() => setExIdx((i) => i + 1)}
              className="flex-1 bg-secondary-container text-black font-black uppercase py-3 rounded-lg"
            >
              Next
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex-1 bg-secondary-container text-black font-black uppercase py-3 rounded-lg"
            >
              Finish
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
