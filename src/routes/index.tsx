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
  const { workout, input, coach, competition_mode, final_context, athlete_state } = useEngine();
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

      {final_context && (
        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <SectionTitle>Engine state</SectionTitle>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Stat
              label={t("intensity") + " ceiling"}
              value={`${Math.round(final_context.constraints.intensity_pct)}%`}
            />
            <Stat
              label="Daily priority"
              value={humanize(final_context.intelligence_summary.daily_priority)}
            />
            <Stat
              label="Phase"
              value={humanize(final_context.intelligence_summary.training_phase)}
            />
            <Stat
              label="Adaptation"
              value={humanize(final_context.intelligence_summary.adaptation_target)}
            />
          </div>
          {athlete_state && (
            <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
              <Stat
                label="Readiness"
                value={String(Math.round(athlete_state.snapshot.readiness))}
              />
              <Stat
                label={t("fatigue") + " (state)"}
                value={String(Math.round(athlete_state.snapshot.fatigue))}
              />
              <Stat
                label="ACWR"
                value={athlete_state.load_history.acwr.toFixed(2)}
              />
            </div>
          )}
        </section>
      )}

      {coach && (
        <section className="space-y-2 rounded-xl border border-border bg-card p-4">
          <SectionTitle>Coach pipeline</SectionTitle>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Focus area
          </div>
          <div className="font-black capitalize">{humanize(coach.focus_area)}</div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {coach.adjustments_applied.map((m, i) => (
              <span
                key={i}
                className="text-[10px] uppercase tracking-widest font-bold border border-border rounded px-2 py-0.5"
              >
                {m}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-2">
        <Button
          variant={competition_mode ? "default" : "outline"}
          onClick={() => {
            engineStore.setCompetitionMode(!competition_mode);
            engineStore.generate();
          }}
          className="flex-1 h-12 font-bold uppercase tracking-wider"
        >
          {competition_mode ? "Comp ON" : "Comp OFF"}
        </Button>
        <Button
          variant="outline"
          onClick={() => engineStore.generate()}
          className="flex-1 h-12 font-bold uppercase tracking-wider"
        >
          {t("regenerate")}
        </Button>
      </div>
    </Page>
  );
}
