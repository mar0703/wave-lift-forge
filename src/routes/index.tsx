import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  generateWorkout,
  postWorkoutAdaptation,
  type BodyType,
  type Dosha,
  type EngineInput,
} from "@/lib/training-engine";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  component: Index,
});

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

  const [postWorkout, setPostWorkout] = useState({
    success_rate: 85,
    average_RPE: 7,
    session_load_factor: 25,
    recovery_factor: 15,
  });

  const workout = useMemo(() => generateWorkout(input), [input]);
  const adaptation = useMemo(
    () =>
      postWorkoutAdaptation({
        ...postWorkout,
        current_intensity: workout.adjusted_intensity / 100,
        previous_fatigue: input.fatigue_score,
      }),
    [postWorkout, workout.adjusted_intensity, input.fatigue_score]
  );

  const update = <K extends keyof EngineInput>(k: K, v: EngineInput[K]) =>
    setInput((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
              Ω
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Iron Wave</h1>
              <p className="text-sm text-muted-foreground">
                Adaptive Olympic weightlifting training engine
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Input panel */}
        <Card className="p-6 space-y-6 h-fit">
          <div>
            <h2 className="text-lg font-semibold mb-4">Today's Inputs</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="snatch">Snatch max (kg)</Label>
                  <Input
                    id="snatch"
                    type="number"
                    value={input.daily_snatch_max}
                    onChange={(e) => update("daily_snatch_max", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="cj">C&J max (kg)</Label>
                  <Input
                    id="cj"
                    type="number"
                    value={input.daily_clean_jerk_max}
                    onChange={(e) =>
                      update("daily_clean_jerk_max", Number(e.target.value))
                    }
                  />
                </div>
              </div>

              <div>
                <Label>Readiness: {input.readiness}/10</Label>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[input.readiness]}
                  onValueChange={(v) => update("readiness", v[0])}
                />
              </div>

              <div>
                <Label>Fatigue score: {input.fatigue_score}/100</Label>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[input.fatigue_score]}
                  onValueChange={(v) => update("fatigue_score", v[0])}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Body type</Label>
                  <Select
                    value={input.body_type}
                    onValueChange={(v) => update("body_type", v as BodyType)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ecto">Ectomorph</SelectItem>
                      <SelectItem value="meso">Mesomorph</SelectItem>
                      <SelectItem value="endo">Endomorph</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Dosha</Label>
                  <Select
                    value={input.dosha}
                    onValueChange={(v) => update("dosha", v as Dosha)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vata">Vata</SelectItem>
                      <SelectItem value="pitta">Pitta</SelectItem>
                      <SelectItem value="kapha">Kapha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Training day (wave)</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((d) => (
                    <Button
                      key={d}
                      type="button"
                      variant={input.training_day_index === d ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => update("training_day_index", d as 1 | 2 | 3 | 4 | 5)}
                    >
                      {d}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-lg font-semibold mb-4">Post-workout</h2>
            <div className="space-y-4">
              <div>
                <Label>Success rate: {postWorkout.success_rate}%</Label>
                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[postWorkout.success_rate]}
                  onValueChange={(v) =>
                    setPostWorkout((p) => ({ ...p, success_rate: v[0] }))
                  }
                />
              </div>
              <div>
                <Label>Average RPE: {postWorkout.average_RPE}/10</Label>
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[postWorkout.average_RPE]}
                  onValueChange={(v) =>
                    setPostWorkout((p) => ({ ...p, average_RPE: v[0] }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="load">Load factor</Label>
                  <Input
                    id="load"
                    type="number"
                    value={postWorkout.session_load_factor}
                    onChange={(e) =>
                      setPostWorkout((p) => ({
                        ...p,
                        session_load_factor: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="rec">Recovery</Label>
                  <Input
                    id="rec"
                    type="number"
                    value={postWorkout.recovery_factor}
                    onChange={(e) =>
                      setPostWorkout((p) => ({
                        ...p,
                        recovery_factor: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Output panel */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="secondary">Day {workout.day}</Badge>
              <Badge variant="outline">Base {workout.base_intensity}%</Badge>
              <Badge>Adjusted {workout.adjusted_intensity}%</Badge>
              <Badge variant="outline">Fatigue ×{workout.fatigue_modifier}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {workout.notes.map((n, i) => (
                <span key={i} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {n}
                </span>
              ))}
            </div>
          </Card>

          <Tabs defaultValue="workout">
            <TabsList>
              <TabsTrigger value="workout">Workout</TabsTrigger>
              <TabsTrigger value="adaptation">Adaptation</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="workout" className="space-y-3">
              {(["Main", "Special", "General"] as const).map((group) => (
                <div key={group}>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    {group}
                  </h3>
                  <div className="grid gap-2">
                    {workout.exercises
                      .filter((e) => e.group === group)
                      .map((e, i) => (
                        <Card key={i} className="p-4 flex items-center justify-between">
                          <div>
                            <div className="font-semibold">{e.exercise}</div>
                            <div className="text-sm text-muted-foreground">
                              {e.sets} × {e.reps} @ {e.intensity_pct}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{e.weight_kg}</div>
                            <div className="text-xs text-muted-foreground">kg</div>
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="adaptation">
              <Card className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">Next intensity</div>
                    <div className="text-3xl font-bold">{adaptation.next_intensity_pct}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase">New fatigue</div>
                    <div className="text-3xl font-bold">{adaptation.new_fatigue_score}</div>
                  </div>
                </div>
                <div className="space-y-1">
                  {adaptation.adjustments.map((a, i) => (
                    <div key={i} className="text-sm text-muted-foreground">• {a}</div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="json">
              <Card className="p-4">
                <pre className="text-xs overflow-auto max-h-[600px] font-mono">
{JSON.stringify({ workout, adaptation }, null, 2)}
                </pre>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
