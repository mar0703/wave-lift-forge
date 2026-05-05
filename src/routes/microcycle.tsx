import { createFileRoute } from "@tanstack/react-router";
import { useEngine, engineStore } from "@/lib/engine-store";
import { Page, SectionTitle } from "@/components/Page";
import { generateAdaptiveWorkout } from "@/lib/adaptive-workout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/microcycle")({
  head: () => ({
    meta: [
      { title: "Microcycle — Iron Method" },
      { name: "description", content: "5-day weightlifting microcycle with adaptive intensity." },
      { property: "og:title", content: "Microcycle — Iron Method" },
      { property: "og:description", content: "Plan ahead: intensity wave across the training week." },
    ],
  }),
  component: Microcycle,
});

function tone(pct: number) {
  if (pct < 70) return "bg-emerald-500";
  if (pct <= 85) return "bg-amber-500";
  return "bg-red-500";
}

function Microcycle() {
  const { input, user_maxes, workout } = useEngine();
  const days = [1, 2, 3, 4, 5].map((d) => {
    const w = generateAdaptiveWorkout({
      ...input,
      training_day_index: d as 1 | 2 | 3 | 4 | 5,
      user_maxes,
    });
    return { d, w };
  });

  return (
    <Page title="Cycle" subtitle="5-day microcycle">
      <section className="rounded-lg border border-border bg-card p-3">
        <div className="flex items-end justify-between gap-2 h-32">
          {days.map(({ d, w }) => {
            const isToday = workout?.day === d;
            return (
              <button
                key={d}
                onClick={() => engineStore.setInput({ training_day_index: d as 1 | 2 | 3 | 4 | 5 })}
                className="flex-1 flex flex-col items-center gap-1 h-full"
              >
                <div className="flex-1 w-full flex items-end">
                  <div
                    className={cn("w-full rounded-t transition-all", tone(w.adjusted_intensity), isToday ? "opacity-100" : "opacity-40")}
                    style={{ height: `${w.adjusted_intensity}%` }}
                  />
                </div>
                <div className="text-[10px] font-bold">{Math.round(w.adjusted_intensity)}%</div>
                <div className={cn("text-[10px] uppercase", isToday ? "text-primary font-black" : "text-muted-foreground")}>D{d}</div>
              </button>
            );
          })}
        </div>
      </section>

      {days.map(({ d, w }) => (
        <section key={d} className="space-y-2">
          <SectionTitle>Day {d} · {Math.round(w.adjusted_intensity)}%</SectionTitle>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {w.exercises.map((e, i) => (
              <div key={i} className="p-3 flex justify-between text-sm">
                <span className="font-bold">{e.exercise}</span>
                <span className="text-muted-foreground">{e.sets}×{e.reps} · {e.weight_kg}kg</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <Button onClick={() => engineStore.generate()} className="w-full h-12 font-black uppercase tracking-wider">
        Apply selected day
      </Button>
    </Page>
  );
}
