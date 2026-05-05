import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { generateWorkout, type EngineInput } from "@/lib/training-engine";
import { mapWorkoutToUI, type UIWorkout } from "@/lib/workout-adapter";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const DEFAULT_INPUT: EngineInput = {
  daily_snatch_max: 115,
  daily_clean_jerk_max: 140,
  readiness: 7,
  fatigue_score: 45,
  body_type: "meso",
  dosha: "pitta",
  training_day_index: 1,
};

function ExerciseRow({ name, prescription }: { name: string; prescription: string }) {
  return (
    <div className="flex items-center gap-md bg-surface border border-white/10 rounded-lg p-md">
      <div className="w-12 h-12 bg-surface-container-highest rounded flex items-center justify-center text-on-surface">
        <span className="material-symbols-outlined">fitness_center</span>
      </div>
      <div className="flex flex-col flex-grow">
        <span className="font-body-md text-body-md text-on-surface font-semibold">{name}</span>
        <span className="font-body-md text-[14px] text-on-surface-variant">{prescription}</span>
      </div>
    </div>
  );
}

function Dashboard() {
  const ui: UIWorkout = useMemo(
    () => mapWorkoutToUI(generateWorkout(DEFAULT_INPUT)),
    []
  );

  const allExercises = ui.blocks.flatMap((b) => b.exercises);

  return (
    <div className="dark bg-background text-on-surface min-h-screen pb-24 flex flex-col font-body-md antialiased">
      {/* TopAppBar */}
      <header className="bg-[#121212] flex justify-between items-center px-6 h-20 w-full top-0 border-b border-white/10 z-50">
        <div className="flex items-center gap-4">
          <button
            aria-label="Menu"
            className="text-[#FF5F1F] hover:bg-[#2C2C2C] transition-colors active:scale-95 duration-100 p-2 rounded-full"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="text-xl font-black text-[#FF5F1F] tracking-widest uppercase">
            ELITE LIFT
          </h1>
        </div>
        <div>
          <div
            aria-label="User Profile"
            className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden flex items-center justify-center text-[#FF5F1F] hover:bg-[#2C2C2C] transition-colors active:scale-95 duration-100 cursor-pointer"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </div>
        </div>
      </header>

      <main className="flex-grow px-container-margin py-md flex flex-col gap-xl max-w-3xl mx-auto w-full">
        {/* Welcome */}
        <section className="flex flex-col gap-sm mt-sm">
          <h2 className="font-h2-headline text-h2-headline text-on-surface">Hello, Athlete.</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Ready to crush today's block?
          </p>
        </section>

        {/* Today's Session */}
        <section className="bg-surface-container-low border border-white/10 rounded-xl p-lg flex flex-col gap-lg relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-secondary-container/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="flex justify-between items-start z-10">
            <div className="flex flex-col gap-xs">
              <span className="font-label-caps text-label-caps text-secondary-container uppercase">
                Day {ui.day} · Today's Block
              </span>
              <h3 className="font-h3-section text-h3-section text-on-surface">
                {ui.intensity}% Intensity Session
              </h3>
            </div>
            <div className="bg-surface-container-high px-3 py-1.5 rounded border border-white/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary-container text-[18px]">
                timer
              </span>
              <span className="font-data-point text-[14px] text-on-surface">
                ~{Math.max(45, allExercises.length * 12)} MIN
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-md z-10">
            {allExercises.slice(0, 3).map((e, i) => (
              <ExerciseRow key={i} name={e.name} prescription={e.prescription} />
            ))}
          </div>

          <button className="w-full bg-secondary-container text-black font-h3-section text-[20px] font-black uppercase py-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition active:scale-[0.98] duration-100 z-10 shadow-[0_0_20px_rgba(254,95,0,0.3)] mt-sm">
            START WORKOUT
            <span className="material-symbols-outlined font-black">play_arrow</span>
          </button>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 gap-md">
          <div className="bg-surface-container-low border border-white/10 rounded-xl p-md flex flex-col justify-between min-h-[140px]">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              1RM Snatch
            </span>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="font-h1-display text-[40px] text-on-surface">
                {DEFAULT_INPUT.daily_snatch_max}
              </span>
              <span className="font-data-point text-[16px] text-on-surface-variant">KG</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-primary">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span className="font-label-caps text-[10px]">Daily max</span>
            </div>
          </div>
          <div className="bg-surface-container-low border border-white/10 rounded-xl p-md flex flex-col justify-between min-h-[140px]">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              1RM C&amp;J
            </span>
            <div className="flex items-baseline gap-2 mt-auto">
              <span className="font-h1-display text-[40px] text-on-surface">
                {DEFAULT_INPUT.daily_clean_jerk_max}
              </span>
              <span className="font-data-point text-[16px] text-on-surface-variant">KG</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-primary">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span className="font-label-caps text-[10px]">Daily max</span>
            </div>
          </div>
        </section>

        {/* Blocks (Main / Special / General) */}
        {ui.blocks.map((block) => (
          <section key={block.name} className="flex flex-col gap-md">
            <h3 className="font-h3-section text-[20px] text-on-surface">{block.name}</h3>
            <div className="flex flex-col gap-md">
              {block.exercises.map((e, i) => (
                <div
                  key={i}
                  className="bg-surface-container-low border border-white/10 rounded-xl p-md flex items-center justify-between"
                >
                  <div className="flex flex-col gap-xs">
                    <span className="font-body-md text-body-md text-on-surface font-semibold">
                      {e.name}
                    </span>
                    <span className="font-body-md text-[14px] text-on-surface-variant">
                      {e.prescription}
                    </span>
                  </div>
                  <div className="text-right flex flex-col gap-xs">
                    <span className="font-data-point text-[18px] text-on-surface">
                      {e.weight_kg} kg
                    </span>
                    <span className="font-label-caps text-[10px] text-outline">WORKING</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* BottomNavBar */}
      <nav className="md:hidden bg-[#1E1E1E] fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-2 border-t border-white/10">
        <a
          className="flex flex-col items-center justify-center text-[#FF5F1F] bg-[#2C2C2C] rounded-lg py-1 px-4 transition-all active:scale-90 duration-75"
          href="#"
        >
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
            grid_view
          </span>
          <span className="font-['Lexend'] font-bold text-[10px] tracking-widest">DASHBOARD</span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-neutral-500 py-1 px-4 hover:text-white transition-all active:scale-90 duration-75"
          href="#"
        >
          <span className="material-symbols-outlined mb-1">fitness_center</span>
          <span className="font-['Lexend'] font-bold text-[10px] tracking-widest">WORKOUT</span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-neutral-500 py-1 px-4 hover:text-white transition-all active:scale-90 duration-75"
          href="#"
        >
          <span className="material-symbols-outlined mb-1">leaderboard</span>
          <span className="font-['Lexend'] font-bold text-[10px] tracking-widest">ANALYTICS</span>
        </a>
        <a
          className="flex flex-col items-center justify-center text-neutral-500 py-1 px-4 hover:text-white transition-all active:scale-90 duration-75"
          href="#"
        >
          <span className="material-symbols-outlined mb-1">person</span>
          <span className="font-['Lexend'] font-bold text-[10px] tracking-widest">PROFILE</span>
        </a>
      </nav>
    </div>
  );
}
