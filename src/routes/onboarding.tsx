import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useEngine, engineStore } from "@/lib/engine-store";
import { Page, SectionTitle } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { BodyType, BodyTendency, StressResponse, ProfileAssessment } from "@/lib/training-engine";
import { useT } from "@/lib/i18n";

const STEPS = [
  "onboarding_step1",
  "onboarding_step2",
  "onboarding_step3",
  "onboarding_step4",
  "onboarding_step5",
] as const;

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — Iron Method" },
      { name: "description", content: "Set up your athlete profile to personalize your training." },
      { property: "og:title", content: "Athlete Onboarding — Iron Method" },
      { property: "og:description", content: "Configure your fatigue, readiness, energy, recovery, and psychological profile." },
    ],
  }),
  component: OnboardingScreen,
});

const DEFAULT_ASSESSMENT: ProfileAssessment = {
  energy_level: 7,
  recovery_speed: 7,
  body_tendency: "stable",
  stress_response: "calm",
  sleep_quality: 7,
};

function OnboardingScreen() {
  const t = useT();
  const navigate = useNavigate();
  const { input } = useEngine();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Local form state mirrors engine state for controlled inputs
  const a = input.profile_assessment ?? DEFAULT_ASSESSMENT;

  // ── Step 1 fields ──
  const updateEngineField = useCallback(
    (patch: Partial<typeof input>) => engineStore.setInput(patch),
    [],
  );

  const updateAssessment = useCallback(
    (patch: Partial<ProfileAssessment>) =>
      engineStore.setInput({ profile_assessment: { ...a, ...patch } }),
    [a],
  );

  const BODY: Record<BodyType, string> = {
    ecto: t("body_lean"),
    meso: t("body_balanced"),
    endo: t("body_strong"),
  };

  const TENDENCY: Record<BodyTendency, string> = {
    lose_easily: t("body_tendency_lose"),
    stable: t("body_tendency_stable"),
    gain_easily: t("body_tendency_gain"),
  };

  const STRESS: Record<StressResponse, string> = {
    anxious: t("stress_anxious"),
    aggressive: t("stress_aggressive"),
    calm: t("stress_calm"),
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleComplete = () => {
    // All inputs are already synced to engineStore via onChange/onValueChange handlers.
    // Regenerate the workout so the orchestrator picks up the new state values.
    engineStore.generate();
    setSubmitted(true);
    // Navigate to the dashboard after a brief delay to show the success message.
    setTimeout(() => {
      navigate({ to: "/" });
    }, 1500);
  };

  const handleSkip = () => {
    // Navigate to dashboard without changing anything.
    navigate({ to: "/" });
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <Page title={t("onboarding_title")} subtitle={t("onboarding_subtitle")}>
      {/* ── Step indicator ── */}
      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold text-center">
        {t(STEPS[step])}
      </div>

      {/* ── STEP 1: Athlete Profile ── */}
      {step === 0 && (
        <section className="space-y-5">
          <SectionTitle>{t("body_type")}</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(BODY) as BodyType[]).map((b) => (
              <Button
                key={b}
                variant={input.body_type === b ? "default" : "outline"}
                className="h-12 font-bold uppercase"
                onClick={() => updateEngineField({ body_type: b })}
              >
                {BODY[b]}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Body type influences exercise selection, volume distribution, and intensity scaling across mesocycles.
          </p>

          <SectionTitle className="mt-4">{t("body_tendency")}</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(TENDENCY) as BodyTendency[]).map((bt) => (
              <Button
                key={bt}
                variant={a.body_tendency === bt ? "default" : "outline"}
                className={cn("h-12 text-[10px] font-bold uppercase leading-tight whitespace-normal")}
                onClick={() => updateAssessment({ body_tendency: bt })}
              >
                {TENDENCY[bt]}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Determines how the engine adapts volume and nutrition-aware load scaling over time.
          </p>
        </section>
      )}

      {/* ── STEP 2: Fatigue & Readiness ── */}
      {step === 1 && (
        <section className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold uppercase tracking-wide">{t("fatigue")}</span>
              <span className="text-2xl font-black">{input.fatigue_score}/100</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[input.fatigue_score]}
              onValueChange={([v]) => updateEngineField({ fatigue_score: v })}
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t("onboarding_fatigue_desc")}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold uppercase tracking-wide">{t("readiness")}</span>
              <span className="text-2xl font-black">{input.readiness}/10</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[input.readiness]}
              onValueChange={([v]) => updateEngineField({ readiness: v })}
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t("onboarding_readiness_desc")}
            </p>
          </div>
        </section>
      )}

      {/* ── STEP 3: Energy Level ── */}
      {step === 2 && (
        <section className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold uppercase tracking-wide">{t("energy_level")}</span>
              <span className="text-2xl font-black">{a.energy_level}/10</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[a.energy_level]}
              onValueChange={([v]) => updateAssessment({ energy_level: v })}
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t("onboarding_energy_desc")}
            </p>
          </div>

          <div className="space-y-3 mt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold uppercase tracking-wide">{t("sleep_quality")}</span>
              <span className="text-2xl font-black">{a.sleep_quality}/10</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[a.sleep_quality]}
              onValueChange={([v]) => updateAssessment({ sleep_quality: v })}
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Sleep quality directly impacts readiness and recovery calculations. Low sleep amplifies fatigue accumulation.
            </p>
          </div>
        </section>
      )}

      {/* ── STEP 4: Recovery Speed ── */}
      {step === 3 && (
        <section className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold uppercase tracking-wide">{t("recovery_speed")}</span>
              <span className="text-2xl font-black">{a.recovery_speed}/10</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[a.recovery_speed]}
              onValueChange={([v]) => updateAssessment({ recovery_speed: v })}
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t("onboarding_recovery_speed_desc")}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              Recovery Speed Guide
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p><span className="font-bold text-foreground">1–3</span> — Slow recovery. Needs extra rest days, lower volume.</p>
              <p><span className="font-bold text-foreground">4–6</span> — Moderate recovery. Standard microcycle structure works.</p>
              <p><span className="font-bold text-foreground">7–8</span> — Fast recovery. Can handle higher frequency and density.</p>
              <p><span className="font-bold text-foreground">9–10</span> — Elite recovery. High workload tolerance with minimal rest needed.</p>
            </div>
          </div>
        </section>
      )}

      {/* ── STEP 5: Psychological Type ── */}
      {step === 4 && (
        <section className="space-y-5">
          <SectionTitle>{t("stress_response")}</SectionTitle>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(STRESS) as StressResponse[]).map((s) => (
              <Button
                key={s}
                variant={a.stress_response === s ? "default" : "outline"}
                className={cn("h-12 text-[10px] font-bold uppercase leading-tight whitespace-normal")}
                onClick={() => updateAssessment({ stress_response: s })}
              >
                {STRESS[s]}
              </Button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t("onboarding_psych_desc")}
          </p>

          <div className="rounded-lg border border-border bg-card p-4 space-y-2 mt-4">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              How This Affects Training
            </div>
            <div className="space-y-1 text-[11px] text-muted-foreground">
              <p><span className="font-bold text-foreground">Calm</span> — Stable under load. Standard intensity progression.</p>
              <p><span className="font-bold text-foreground">Aggressive</span> — Thrives on intensity. Higher max effort tolerance, watch for overreaching.</p>
              <p><span className="font-bold text-foreground">Anxious</span> — Benefits from conservative loading and technical focus days.</p>
            </div>
          </div>
        </section>
      )}

      {/* ── Navigation ── */}
      {submitted ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
          <p className="text-sm font-bold text-emerald-400">{t("onboarding_success")}</p>
        </div>
      ) : (
        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={prevStep}
              className="flex-1 h-12 font-bold uppercase tracking-wider"
            >
              ← Back
            </Button>
          )}
          {isLastStep ? (
            <Button
              onClick={handleComplete}
              className="flex-1 h-14 font-black uppercase tracking-wider"
            >
              {t("onboarding_complete")}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              className="flex-1 h-12 font-bold uppercase tracking-wider"
            >
              Next →
            </Button>
          )}
        </div>
      )}

      {!submitted && (
        <Button
          variant="ghost"
          onClick={handleSkip}
          className="w-full h-10 text-[10px] uppercase tracking-widest text-muted-foreground"
        >
          {t("onboarding_skip")}
        </Button>
      )}
    </Page>
  );
}