import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useEngine, engineStore } from "@/lib/engine-store";
import { Page, SectionTitle, Stat } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import type { ExerciseBlock } from "@/lib/training-engine";

export const Route = createFileRoute("/workout")({
  head: () => ({
    meta: [
      { title: "Workout — Iron Method" },
      { name: "description", content: "Run your active training session: track sets, weights and RPE." },
      { property: "og:title", content: "Active Workout — Iron Method" },
      { property: "og:description", content: "Tick off sets in real time and adapt the next session." },
    ],
  }),
  component: WorkoutScreen,
});

type ExUI = { offset: number; done: boolean[] };

function WorkoutScreen() {
  const t = useT();
  const { workout } = useEngine();
  const [ui, setUi] = useState<ExUI[]>([]);
  const [post, setPost] = useState({ success_rate: 85, average_RPE: 7 });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!workout) return;
    setUi(workout.exercises.map((e) => ({ offset: 0, done: Array(e.sets).fill(false) })));
    setSubmitted(false);
  }, [workout]);

  const totals = useMemo(() => {
    if (!workout) return { done: 0, total: 0 };
    const total = workout.exercises.reduce((a, e) => a + e.sets, 0);
    const done = ui.reduce((a, s) => a + s.done.filter(Boolean).length, 0);
    return { done, total };
  }, [workout, ui]);

  if (!workout) return <Page title={t("workout")}><p>{t("generate_first")}</p></Page>;

  const adjust = (i: number, d: number) =>
    setUi((p) => p.map((s, k) => (k === i ? { ...s, offset: s.offset + d } : s)));
  const toggle = (i: number, j: number) =>
    setUi((p) => p.map((s, k) => (k === i ? { ...s, done: s.done.map((v, m) => (m === j ? !v : v)) } : s)));

  const submit = () => {
    engineStore.adapt(post.success_rate, post.average_RPE);
    setSubmitted(true);
  };

  return (
    <Page title={t("workout")} subtitle={`${t("day")} ${workout.day}`}>
      <div className="rounded-lg border border-border bg-card p-3 grid grid-cols-3 gap-2">
        <Stat label={t("sets_done")} value={`${totals.done}/${totals.total}`} />
        <Stat label={t("intensity")} value={`${workout.adjusted_intensity}%`} tone="text-primary" />
        <Stat label={t("lifts")} value={String(workout.exercises.length)} />
      </div>

      {(["Main", "Special", "General"] as const).map((g) => {
        const items = workout.exercises.map((e, idx) => ({ e, idx })).filter((x) => x.e.group === g);
        if (!items.length) return null;
        return (
          <section key={g} className="space-y-2">
            <SectionTitle>{g}</SectionTitle>
            {items.map(({ e, idx }) => (
              <ExerciseCard
                key={idx}
                exercise={e}
                state={ui[idx] ?? { offset: 0, done: Array(e.sets).fill(false) }}
                onAdjust={(d) => adjust(idx, d)}
                onToggle={(j) => toggle(idx, j)}
              />
            ))}
          </section>
        );
      })}

      <section className="pt-4 border-t border-border space-y-4">
        <SectionTitle>{t("finish_session")}</SectionTitle>
        <div>
          <div className="text-xs text-muted-foreground mb-2">{t("success_rate")} · {post.success_rate}%</div>
          <Slider min={0} max={100} step={1} value={[post.success_rate]} onValueChange={(v) => setPost((p) => ({ ...p, success_rate: v[0] }))} />
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">{t("average_rpe")} · {post.average_RPE}/10</div>
          <Slider min={1} max={10} step={1} value={[post.average_RPE]} onValueChange={(v) => setPost((p) => ({ ...p, average_RPE: v[0] }))} />
        </div>
        <Button onClick={submit} className="w-full h-14 font-black uppercase tracking-wider">
          {submitted ? t("saved_view_stats") : t("save_adapt")}
        </Button>
        {submitted && (
          <Link to="/analytics" className="block text-center text-xs uppercase tracking-widest text-primary">
            {t("see_analytics")}
          </Link>
        )}
      </section>
    </Page>
  );
}

function ExerciseCard({
  exercise,
  state,
  onAdjust,
  onToggle,
}: {
  exercise: ExerciseBlock;
  state: ExUI;
  onAdjust: (d: number) => void;
  onToggle: (j: number) => void;
}) {
  const w = exercise.weight_kg + state.offset;
  const slug = exercise.exercise.toLowerCase().replace(/\s|&/g, "_");
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-3">
      <div className="flex items-start justify-between">
        <Link to="/exercise/$id" params={{ id: slug }} className="flex-1">
          <div className="font-bold">{exercise.exercise}</div>
          <div className="text-xs text-muted-foreground">
            {exercise.sets}×{exercise.reps} · {exercise.intensity_pct}%
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => onAdjust(-2.5)} className="h-8 w-8 rounded border border-border font-black">−</button>
          <span className="font-black w-14 text-right">{w}kg</span>
          <button onClick={() => onAdjust(2.5)} className="h-8 w-8 rounded border border-border font-black">+</button>
        </div>
      </div>
      <div className="flex gap-1.5">
        {state.done.map((d, j) => (
          <button
            key={j}
            onClick={() => onToggle(j)}
            className={cn(
              "flex-1 h-9 rounded border text-xs font-black",
              d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground",
            )}
          >
            {j + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
