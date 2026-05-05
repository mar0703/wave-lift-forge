import { createFileRoute, Link } from "@tanstack/react-router";
import { useEngine, engineStore } from "@/lib/engine-store";
import { Page, Stat, SectionTitle } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExerciseBlock } from "@/lib/training-engine";
import { useT } from "@/lib/i18n";
import { PROBLEM_PHASE_MAP } from "@/lib/diagnostics";

function humanize(id: string) {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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

function focusKey(intensity: number): "technique" | "strength" | "heavy_peak" {
  if (intensity < 70) return "technique";
  if (intensity <= 85) return "strength";
  return "heavy_peak";
}

function Dashboard() {
  const t = useT();
  const { workout, input, fix_performance } = useEngine();
  if (!workout) return <Page title={t("today")}><p>{t("loading")}</p></Page>;
  const fk = focusKey(workout.adjusted_intensity);
  const tone = fk === "technique" ? "text-emerald-400" : fk === "strength" ? "text-amber-400" : "text-red-400";
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);

  return (
    <Page title={t("today")} subtitle={`${t("day")} ${workout.day} · ${t(fk)}`}>
      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {t("session_intensity")}
          </span>
          <span className={cn("text-xs font-black uppercase", tone)}>{t(fk)}</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-6xl font-black leading-none text-primary">
            {Math.round(workout.adjusted_intensity)}%
          </span>
          <span className="text-sm text-muted-foreground pb-2">
            {t("base")} {workout.base_intensity}%
          </span>
        </div>
        <Link to="/workout">
          <Button className="w-full h-14 text-base font-black uppercase tracking-wider">
            {t("start_workout")}
          </Button>
        </Link>
      </section>

      <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-3">
        <Stat label={t("lifts")} value={String(workout.exercises.length)} />
        <Stat label={t("sets")} value={String(totalSets)} />
        <Stat label={t("fatigue")} value={String(input.fatigue_score)} />
      </div>

      <section className="space-y-3">
        <SectionTitle>{t("plan_preview")}</SectionTitle>
        {workout.exercises.slice(0, 4).map((e: ExerciseBlock, i: number) => (
          <Link
            key={i}
            to="/exercise/$id"
            params={{ id: e.exercise_id }}
            className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
          >
            <div>
              <div className="font-bold capitalize">{e.name_en}</div>
              <div className="text-xs text-muted-foreground">
                {e.sets}×{e.reps} · {e.intensity_pct}%
              </div>
            </div>
            <div className="font-black">{e.weight_kg}kg</div>
          </Link>
        ))}
      </section>

      {"detected_problems" in workout &&
        ((workout as { detected_problems: string[] }).detected_problems.length > 0 ||
          (workout as { injected_exercises: string[] }).injected_exercises.length > 0) && (
          <section className="space-y-3 rounded-xl border border-border bg-card p-4">
            <SectionTitle>Diagnostics</SectionTitle>

            {(workout as { primary_problem?: string }).primary_problem && (
              <div className="rounded-lg border border-border bg-background p-3 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Focus today
                </div>
                <div className="text-base font-black">
                  {humanize((workout as { primary_problem: string }).primary_problem)}
                  <span className="ml-2 text-xs font-bold text-muted-foreground">
                    ({Math.max(
                      1,
                      (workout as { primary_problem_sessions?: number })
                        .primary_problem_sessions || 0,
                    )}{" "}
                    sessions)
                  </span>
                </div>
              </div>
            )}

            <ul className="space-y-1 text-sm">
              {(workout as { detected_problems: string[] }).detected_problems.map((p) => {
                const phase = PROBLEM_PHASE_MAP[p];
                return (
                  <li key={p} className="flex items-baseline justify-between gap-3">
                    <span className="font-bold capitalize">{humanize(p)}</span>
                    {phase && (
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        → {phase} phase
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {(workout as { injected_exercises: string[] }).injected_exercises.length > 0 && (
              <>
                <SectionTitle>Fix strategy</SectionTitle>
                <ul className="space-y-1 text-sm">
                  {(workout as { injected_exercises: string[] }).injected_exercises.map((n) => (
                    <li key={n} className="font-bold capitalize">
                      → {n}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}

      {fix_performance.length > 0 && (
        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <SectionTitle>Fix performance</SectionTitle>
          <ul className="space-y-1 text-sm">
            {fix_performance.map((f) => (
              <li key={f.exercise_id} className="flex items-baseline justify-between gap-3">
                <span className="font-bold capitalize">{f.name}</span>
                <span
                  className={cn(
                    "text-[10px] uppercase tracking-widest font-black",
                    f.status === "ok" ? "text-emerald-400" : "text-red-400",
                  )}
                >
                  → {f.status === "ok" ? "OK" : "struggling"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button
        variant="outline"
        onClick={() => engineStore.generate()}
        className="w-full h-12 font-bold uppercase tracking-wider"
      >
        {t("regenerate")}
      </Button>
    </Page>
  );
}
