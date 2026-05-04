import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  generateWorkout,
  postWorkoutAdaptation,
  type BodyType,
  type EngineInput,
  type WorkoutOutput,
  type AdaptationResult,
  type ExerciseBlock,
} from "@/lib/training-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

const BODY_LABEL: Record<BodyType, string> = {
  ecto: "Lean",
  meso: "Balanced",
  endo: "Strong",
};

function focusFor(intensity: number) {
  if (intensity < 70) return { label: "Technique day", tone: "text-emerald-400" };
  if (intensity <= 85) return { label: "Strength day", tone: "text-amber-400" };
  return { label: "Heavy / Peak day", tone: "text-red-400" };
}

function getZone(pct: number) {
  if (pct < 70) return { label: "Z1", range: "<70%", tone: "text-zinc-400", bg: "bg-zinc-500/20", border: "border-zinc-500" };
  if (pct < 80) return { label: "Z2", range: "70–80%", tone: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500" };
  if (pct < 90) return { label: "Z3", range: "80–90%", tone: "text-amber-400", bg: "bg-amber-500/20", border: "border-amber-500" };
  return { label: "Z4", range: "90%+", tone: "text-red-400", bg: "bg-red-500/20", border: "border-red-500" };
}

function fatigueBand(mod: number) {
  // engine: >70 fatigue → 0.85, 40–70 → 1.0, <40 → 1.05
  if (mod <= 0.9) return { label: "HIGH", pct: 90, tone: "text-red-400", bar: "bg-red-500" };
  if (mod >= 1.04) return { label: "LOW", pct: 25, tone: "text-emerald-400", bar: "bg-emerald-500" };
  return { label: "MEDIUM", pct: 60, tone: "text-amber-400", bar: "bg-amber-500" };
}

const WAVE_DISPLAY = [70, 80, 60, 85, 75];

function intensityTone(pct: number) {
  if (pct < 70)
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-400",
      ring: "border-l-emerald-500",
    };
  if (pct <= 85)
    return {
      bar: "bg-amber-500",
      text: "text-amber-400",
      ring: "border-l-amber-500",
    };
  return { bar: "bg-red-500", text: "text-red-400", ring: "border-l-red-500" };
}

type ExerciseUiState = {
  weightOffset: number;
  doneSets: boolean[];
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
  const [uiState, setUiState] = useState<ExerciseUiState[]>([]);

  // Initialize per-exercise UI state when workout regenerates
  useEffect(() => {
    if (!workout) return;
    setUiState(
      workout.exercises.map((e) => ({
        weightOffset: 0,
        doneSets: Array(e.sets).fill(false),
      }))
    );
  }, [workout]);

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

  const adjustWeight = (idx: number, delta: number) =>
    setUiState((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, weightOffset: s.weightOffset + delta } : s))
    );

  const toggleSet = (exIdx: number, setIdx: number) =>
    setUiState((prev) =>
      prev.map((s, i) =>
        i === exIdx
          ? {
              ...s,
              doneSets: s.doneSets.map((d, j) => (j === setIdx ? !d : d)),
            }
          : s
      )
    );

  const summary = useMemo(() => {
    if (!workout)
      return { total: 0, avgIntensity: 0, doneSets: 0, totalSets: 0 };
    const total = workout.exercises.length;
    const avg =
      workout.exercises.reduce((a, e) => a + e.intensity_pct, 0) / Math.max(1, total);
    const totalSets = workout.exercises.reduce((a, e) => a + e.sets, 0);
    const doneSets = uiState.reduce(
      (a, s) => a + s.doneSets.filter(Boolean).length,
      0
    );
    return {
      total,
      avgIntensity: Math.round(avg * 10) / 10,
      doneSets,
      totalSets,
    };
  }, [workout, uiState]);

  const focus = workout ? focusFor(workout.adjusted_intensity) : null;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="px-5 pt-8 pb-4 border-b border-border">
        <h1 className="text-3xl font-black tracking-tight uppercase">Iron Wave</h1>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">
          Daily training engine
        </p>
        {focus && (
          <div className="mt-3 flex items-center gap-2">
            <span className={cn("text-lg font-black uppercase", focus.tone)}>
              {focus.label}
            </span>
            <span className="text-xs text-muted-foreground">
              · {workout!.adjusted_intensity}%
            </span>
          </div>
        )}
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
                onChange={(e) =>
                  update("daily_clean_jerk_max", Number(e.target.value))
                }
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
                  onClick={() =>
                    update("training_day_index", d as 1 | 2 | 3 | 4 | 5)
                  }
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
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-3">
              <Stat label="Lifts" value={String(summary.total)} />
              <Stat
                label="Avg %"
                value={`${summary.avgIntensity}%`}
                tone={intensityTone(summary.avgIntensity).text}
              />
              <Stat
                label="Sets"
                value={`${summary.doneSets}/${summary.totalSets}`}
              />
            </div>

            {/* Fatigue */}
            {(() => {
              const fb = fatigueBand(workout.fatigue_modifier);
              return (
                <div className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      Fatigue load
                    </span>
                    <span className={cn("text-sm font-black uppercase", fb.tone)}>
                      {fb.label}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded overflow-hidden">
                    <div
                      className={cn("h-full transition-all", fb.bar)}
                      style={{ width: `${fb.pct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    modifier ×{workout.fatigue_modifier.toFixed(2)}
                  </div>
                </div>
              );
            })()}

            {/* Live wave */}
            <div className="rounded-lg border border-border bg-card p-3">
              <div className="flex justify-between items-baseline mb-3">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  Wave · day {workout.day}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  base {workout.base_intensity}% → adj {workout.adjusted_intensity}%
                </span>
              </div>
              <div className="flex items-end justify-between gap-1 h-20">
                {WAVE_DISPLAY.map((basePct, i) => {
                  const dayIdx = i + 1;
                  const isToday = dayIdx === workout.day;
                  const displayPct = isToday ? workout.adjusted_intensity : basePct;
                  const tone = intensityTone(displayPct);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex items-end justify-center h-full">
                        <div
                          className={cn(
                            "w-full rounded-t transition-all",
                            tone.bar,
                            isToday ? "opacity-100" : "opacity-30"
                          )}
                          style={{ height: `${displayPct}%` }}
                        />
                      </div>
                      <div
                        className={cn(
                          "text-[9px] font-bold",
                          isToday ? "text-foreground" : "text-muted-foreground"
                        )}
                      >
                        {Math.round(displayPct)}
                      </div>
                      <div
                        className={cn(
                          "text-[9px] uppercase",
                          isToday ? "text-primary font-black" : "text-muted-foreground"
                        )}
                      >
                        D{dayIdx}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {workout.notes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
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

            {(["Main", "Special", "General"] as const).map((group) => {
              const items = workout.exercises
                .map((e, idx) => ({ e, idx }))
                .filter((x) => x.e.group === group);
              if (items.length === 0) return null;
              const isMain = group === "Main";
              return (
                <div key={group} className="space-y-2">
                  <h3
                    className={cn(
                      "text-xs font-black uppercase tracking-widest",
                      isMain ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {group}
                  </h3>
                  {items.map(({ e, idx }) => (
                    <ExerciseCard
                      key={idx}
                      exercise={e}
                      isMain={isMain}
                      state={
                        uiState[idx] ?? {
                          weightOffset: 0,
                          doneSets: Array(e.sets).fill(false),
                        }
                      }
                      onAdjust={(d) => adjustWeight(idx, d)}
                      onToggleSet={(s) => toggleSet(idx, s)}
                    />
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
                  onValueChange={(v) =>
                    setPost((p) => ({ ...p, success_rate: v[0] }))
                  }
                />
              </Field>

              <Field label={`Avg RPE · ${post.average_RPE}/10`}>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[post.average_RPE]}
                  onValueChange={(v) =>
                    setPost((p) => ({ ...p, average_RPE: v[0] }))
                  }
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

function ExerciseCard({
  exercise,
  isMain,
  state,
  onAdjust,
  onToggleSet,
}: {
  exercise: ExerciseBlock;
  isMain: boolean;
  state: ExerciseUiState;
  onAdjust: (delta: number) => void;
  onToggleSet: (setIdx: number) => void;
}) {
  const tone = intensityTone(exercise.intensity_pct);
  const displayWeight = exercise.weight_kg + state.weightOffset;
  const allDone =
    state.doneSets.length > 0 && state.doneSets.every(Boolean);

  return (
    <div
      className={cn(
        "rounded-lg border bg-card border-l-4 transition-opacity",
        tone.ring,
        isMain
          ? "border-2 border-border bg-card p-4 shadow-lg"
          : "p-3 opacity-95",
        allDone && "opacity-60"
      )}
      style={
        isMain
          ? { background: "color-mix(in oklab, var(--card) 92%, black)" }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className={cn(
              "font-black uppercase tracking-wide",
              isMain ? "text-base" : "text-sm"
            )}
          >
            {exercise.exercise}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>{exercise.sets} × {exercise.reps}</span>
            <span>·</span>
            <span className={tone.text}>{exercise.intensity_pct}%</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[10px] font-black border",
                zone.tone,
                zone.bg,
                zone.border
              )}
            >
              {zone.label} {zone.range}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div
            className={cn(
              "font-black leading-none",
              isMain ? "text-4xl" : "text-2xl",
              tone.text
            )}
          >
            {displayWeight}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground mt-1">
            kg
          </div>
        </div>
      </div>

      {/* Set checkboxes */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {state.doneSets.map((done, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onToggleSet(i)}
            className={cn(
              "h-9 w-9 rounded border-2 text-xs font-bold transition-colors flex items-center justify-center",
              done
                ? cn("text-background border-transparent", tone.bar)
                : "border-border text-muted-foreground hover:border-foreground"
            )}
            aria-label={`Set ${i + 1}`}
          >
            {done ? "✓" : i + 1}
          </button>
        ))}
      </div>

      {/* Weight adjust */}
      <div className="grid grid-cols-3 gap-1.5 mt-3">
        <Button
          variant="outline"
          size="sm"
          className="h-9 font-bold"
          onClick={() => onAdjust(-2.5)}
        >
          −2.5
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 font-bold"
          onClick={() => onAdjust(2.5)}
        >
          +2.5
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-9 font-bold"
          onClick={() => onAdjust(5)}
        >
          +5
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-xl font-black", tone)}>{value}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
        {label}
      </Label>
      {children}
    </div>
  );
}
