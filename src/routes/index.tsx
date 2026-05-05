import { createFileRoute, Link } from "@tanstack/react-router";
import { useEngine, engineStore } from "@/lib/engine-store";
import { Page, Stat, SectionTitle } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExerciseBlock } from "@/lib/training-engine";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today — Iron Method" },
      { name: "description", content: "Your adaptive Olympic weightlifting session for today." },
      { property: "og:title", content: "Today — Iron Method" },
      { property: "og:description", content: "Your adaptive Olympic weightlifting session for today." },
    ],
  }),
  component: Dashboard,
});

function focusFor(intensity: number) {
  if (intensity < 70) return { label: "Technique", tone: "text-emerald-400" };
  if (intensity <= 85) return { label: "Strength", tone: "text-amber-400" };
  return { label: "Heavy / Peak", tone: "text-red-400" };
}

function Dashboard() {
  const { workout, input } = useEngine();
  if (!workout) return <Page title="Iron Method"><p>Loading…</p></Page>;
  const f = focusFor(workout.adjusted_intensity);
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);

  return (
    <Page title="Today" subtitle={`Day ${workout.day} · ${f.label}`}>
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Session intensity
          </span>
          <span className={cn("text-xs font-black uppercase", f.tone)}>{f.label}</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-6xl font-black leading-none text-primary">
            {Math.round(workout.adjusted_intensity)}%
          </span>
          <span className="text-sm text-muted-foreground pb-2">
            base {workout.base_intensity}%
          </span>
        </div>
        <Link to="/workout">
          <Button className="w-full h-14 text-base font-black uppercase tracking-wider">
            Start workout
          </Button>
        </Link>
      </section>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-3">
        <Stat label="Lifts" value={String(workout.exercises.length)} />
        <Stat label="Sets" value={String(totalSets)} />
        <Stat label="Fatigue" value={String(input.fatigue_score)} />
      </div>

      <section className="space-y-3">
        <SectionTitle>Plan preview</SectionTitle>
        {workout.exercises.slice(0, 4).map((e: ExerciseBlock, i: number) => (
          <Link
            key={i}
            to="/exercise/$id"
            params={{ id: e.exercise.toLowerCase().replace(/\s|&/g, "_") }}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
          >
            <div>
              <div className="font-bold">{e.exercise}</div>
              <div className="text-xs text-muted-foreground">
                {e.sets}×{e.reps} · {e.intensity_pct}%
              </div>
            </div>
            <div className="font-black">{e.weight_kg}kg</div>
          </Link>
        ))}
      </section>

      <Button
        variant="outline"
        onClick={() => engineStore.generate()}
        className="w-full h-12 font-bold uppercase tracking-wider"
      >
        Regenerate
      </Button>
    </Page>
  );
}
