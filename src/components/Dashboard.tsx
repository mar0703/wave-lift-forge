import React from "react";
import { __TRACER__, engineStore, APP_VERSION } from "@/lib/engine-store";

type Exercise = {
  exercise: string;
  sets: number;
  reps: number;
  weight_kg: number;
  intensity_pct: number;
  group: "Main" | "Special" | "General";
};

type Workout = {
  day: number;
  adjusted_intensity: number;
  base_intensity: number;
  exercises: Exercise[];
};

export default function Dashboard({
  workout,
  onStart,
}: {
  workout: Workout;
  onStart: () => void;
}) {
  if (typeof window !== "undefined") {
    const stored = engineStore.get().workout;
    const orch = __TRACER__.lastOrchestratorOutput as { workout?: { adjusted_intensity?: number } } | null;
    // eslint-disable-next-line no-console
    console.log("[TRACER][UI_RENDER]", {
      workout_from_store: stored,
      displayed_intensity: workout.adjusted_intensity,
      displayed_acwr: null,
      displayed_fatigue: null,
      displayed_readiness: null,
      app_version: APP_VERSION,
    });
    const orchInt = orch?.workout?.adjusted_intensity;
    const storeInt = (stored as { adjusted_intensity?: number } | null)?.adjusted_intensity;
    const uiInt = workout.adjusted_intensity;
    if ((orchInt !== undefined && orchInt !== uiInt) || (storeInt !== undefined && storeInt !== uiInt)) {
      // eslint-disable-next-line no-console
      console.log("[TRACER][DIVERGENCE_DETECTED]", {
        mismatch_field: "adjusted_intensity",
        orchestrator_value: orchInt,
        store_value: storeInt,
        ui_value: uiInt,
      });
    }
  }
  return (
    <div className="bg-background text-foreground min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="fixed top-0 w-full h-16 px-6 flex justify-between items-center border-b border-[#2C2C2C] bg-[#121212] z-50">
        <span className="text-[#007AFF]">🏋️</span>
        <h1 className="font-black text-white tracking-widest">IRON METHOD</h1>
        <span className="text-zinc-500">⚙️</span>
      </header>

      {/* MAIN */}
      <main className="pt-20 px-4 pb-24 max-w-5xl mx-auto w-full flex flex-col gap-6">
        {/* HERO CARD */}
        <section className="relative bg-card border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div
            className="absolute inset-0 opacity-20 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBp-V0HO0nA9m8vx-Zu8pYp1dRYrKffdEMcVNDZPjIY9uHsCSAFi9vfrz2U3mZcf2E3quAWjJhBB0QiORZrmaOjv72FZe-8ra7QzFVN4mrmoj_JWPAYOtQY0cBolsYxACaS4TwCpq6e1uqWH3zpZU3eFUnM6kbaMoCVuzq1DXGxwL_yRBk3dJi7kUonCqQoaBxSDM0NCxkOh4xWpjS6C1h-cUnUUPmKd-ON56nQxQzEZJ-WOBCAGU6wKKN1JIzS3sMonU94WYp5rbww')",
            }}
          />
          <div className="relative p-6 flex flex-col gap-4">
            <span className="text-xs uppercase text-zinc-400">
              TODAY'S SESSION
            </span>
            <h2 className="text-xl font-bold">Day {workout.day}</h2>
            <p className="text-sm text-zinc-400">
              Base {workout.base_intensity}% → {workout.adjusted_intensity}%
            </p>
            <button
              onClick={onStart}
              className="mt-4 h-14 bg-primary text-primary-foreground font-bold rounded"
            >
              START WORKOUT
            </button>
          </div>
        </section>

        {/* BLOCKS */}
        {(["Main", "Special", "General"] as const).map((group) => {
          const items = workout.exercises.filter((e) => e.group === group);
          if (!items.length) return null;
          return (
            <section key={group} className="flex flex-col gap-3">
              <h3 className="text-lg font-bold uppercase text-zinc-400">
                {group}
              </h3>
              {items.map((e, i) => (
                <div
                  key={i}
                  className="bg-card border border-white/10 rounded p-4 flex justify-between"
                >
                  <div>
                    <div className="font-bold">{e.exercise}</div>
                    <div className="text-sm text-zinc-400">
                      {e.sets} × {e.reps} · {e.intensity_pct}%
                    </div>
                  </div>
                  <div className="font-bold text-lg">{e.weight_kg} kg</div>
                </div>
              ))}
            </section>
          );
        })}
      </main>
    </div>
  );
}
