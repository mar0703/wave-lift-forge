import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  generateWorkout,
  postWorkoutAdaptation,
  type BodyType,
  type EngineInput,
  type WorkoutOutput,
  type AdaptationResult,
} from "@/lib/training-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/")({
  component: Index,
});

const BODY_LABEL: Record<BodyType, string> = {
  ecto: "Lean",
  meso: "Balanced",
  endo: "Strong",
};

function Index() {
  const [input, setInput] = useState<EngineInput>({
    daily_snatch_max: 100,
    daily_clean_jerk_max: 130,
    readiness: 7,
    fatigue_score: 45,
    body_type: "meso",
    dosha: "pitta",
    training_day_index: 1,
  });

  const [post, setPost] = useState({ success_rate: 85, average_RPE: 7 });

  const [workout, setWorkout] = useState<WorkoutOutput | null>(null);
  const [adaptation, setAdaptation] = useState<AdaptationResult | null>(null);

  const update = <K extends keyof EngineInput>(k: K, v: EngineInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  const onGenerate = () => {
    setWorkout(generateWorkout(input));
    setAdaptation(null);
  };

  const onAdapt = () => {
    if (!workout) return;
    setAdaptation(
      postWorkoutAdaptation({
        success_rate: post.success_rate,
        average_RPE: post.average_RPE,
        current_intensity: workout.adjusted_intensity / 100,
        previous_fatigue: input.fatigue_score,
        session_load_factor: 25,
        recovery_factor: 15,
      })
    );
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="px-5 pt-8 pb-4 border-b border-border">
        <h1 className="text-3xl font-black tracking-tight uppercase">Iron Wave</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Daily training engine
        </p>
      </header>

      <main className="px-5 py-6 space-y-8 max-w-md mx-auto">
        {/* INPUT */}
        <section className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Snatch (kg)">
              <Input
                type="number"
                inputMode="numeric"
                value={input.daily_snatch_max}
                onChange={(e) => update("daily_snatch_max", Number(e.target.value))}
                className="h-12 text-lg font-bold"
              />
            </Field>
            <Field label="C&J (kg)">
              <Input
                type="number"
                inputMode="numeric"
                value={input.daily_clean_jerk_max}
                onChange={(e) => update("daily_clean_jerk_max", Number(e.target.value))}
                className="h-12 text-lg font-bold"
              />
            </Field>
          </div>

          <Field label={`Readiness · ${input.readiness}/10`}>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[input.readiness]}
              onValueChange={(v) => update("readiness", v[0])}
            />
          </Field>

          <Field label={`Fatigue · ${input.fatigue_score}/100`}>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[input.fatigue_score]}
              onValueChange={(v) => update("fatigue_score", v[0])}
            />
          </Field>

          <Field label="Body type">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(BODY_LABEL) as BodyType[]).map((b) => (
                <Button
                  key={b}
                  type="button"
                  variant={input.body_type === b ? "default" : "outline"}
                  className="h-12 font-bold uppercase"
                  onClick={() => update("body_type", b)}
                >
                  {BODY_LABEL[b]}
                </Button>
              ))}
            </div>
          </Field>

          <Field label="Training day">
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={input.training_day_index === d ? "default" : "outline"}
                  className="h-12 font-bold text-lg"
                  onClick={() => update("training_day_index", d as 1 | 2 | 3 | 4 | 5)}
                >
                  {d}
                </Button>
              ))}
            </div>
          </Field>

          <Button
            onClick={onGenerate}
            className="w-full h-14 text-base font-black uppercase tracking-wider"
          >
            Generate Workout
          </Button>
        </section>

        {/* OUTPUT */}
        {workout && (
          <section className="space-y-5">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    Day
                  </div>
                  <div className="text-4xl font-black">{workout.day}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    Adjusted
                  </div>
                  <div className="text-4xl font-black text-primary">
                    {workout.adjusted_intensity}%
                  </div>
                  <div className="text-[10px] uppercase text-muted-foreground">
                    Base {workout.base_intensity}%
                  </div>
                </div>
              </div>
              {workout.notes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-border">
                  {workout.notes.map((n, i) => (
                    <span
                      key={i}
                      className="text-[10px] uppercase tracking-wide bg-secondary text-secondary-foreground px-2 py-1 rounded"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {(["Main", "Special", "General"] as const).map((group) => {
              const items = workout.exercises.filter((e) => e.group === group);
              if (items.length === 0) return null;
              return (
                <div key={group} className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {group}
                  </h3>
                  {items.map((e, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-card p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold uppercase tracking-wide">
                          {e.exercise}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {e.sets} × {e.reps}
                          <span className="mx-2">·</span>
                          {e.intensity_pct}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-primary leading-none">
                          {e.weight_kg}
                        </div>
                        <div className="text-[10px] uppercase text-muted-foreground mt-1">
                          kg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}

            {/* POST WORKOUT */}
            <div className="pt-4 border-t border-border space-y-5">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Post workout
              </h2>

              <Field label={`Success rate · ${post.success_rate}%`}>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[post.success_rate]}
                  onValueChange={(v) => setPost((p) => ({ ...p, success_rate: v[0] }))}
                />
              </Field>

              <Field label={`Avg RPE · ${post.average_RPE}/10`}>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[post.average_RPE]}
                  onValueChange={(v) => setPost((p) => ({ ...p, average_RPE: v[0] }))}
                />
              </Field>

              <Button
                onClick={onAdapt}
                className="w-full h-14 text-base font-black uppercase tracking-wider"
              >
                Update Next Session
              </Button>

              {adaptation && (
                <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Next intensity
                      </div>
                      <div className="text-3xl font-black text-primary">
                        {adaptation.next_intensity_pct}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        New fatigue
                      </div>
                      <div className="text-3xl font-black">
                        {adaptation.new_fatigue_score}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border space-y-1">
                    {adaptation.adjustments.map((a, i) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        · {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
        {label}
      </Label>
      {children}
    </div>
  );
}
