import { createFileRoute } from "@tanstack/react-router";
import { useEngine, engineStore } from "@/lib/engine-store";
import { Page, SectionTitle } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { BodyType, BodyTendency, StressResponse, ProfileAssessment } from "@/lib/training-engine";
import { LANGS, useLang, setLang, useT, type Lang } from "@/lib/i18n";

const LANG_LABEL: Record<Lang, string> = { en: "EN", pl: "PL", ru: "RU" };

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Iron Method" },
      { name: "description", content: "Set your current maxes, body type and recovery state." },
      { property: "og:title", content: "Athlete Profile — Iron Method" },
      { property: "og:description", content: "Configure inputs that drive your adaptive training engine." },
    ],
  }),
  component: ProfileScreen,
});



function ProfileScreen() {
  const t = useT();
  const { input, user_maxes } = useEngine();
  const lang = useLang();
  const BODY: Record<BodyType, string> = {
    ecto: t("body_lean"),
    meso: t("body_balanced"),
    endo: t("body_strong"),
  };
  const STRENGTH_LABEL: Record<"front_squat" | "back_squat", string> = {
    front_squat: t("front_squat_kg"),
    back_squat: t("back_squat_kg"),
  };
  return (
    <Page title={t("profile")} subtitle={t("athlete_inputs")}>
      <section className="space-y-3">
        <SectionTitle>{t("language")}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((l) => (
            <Button
              key={l}
              variant={lang === l ? "default" : "outline"}
              className="h-12 font-bold uppercase tracking-widest"
              onClick={() => setLang(l)}
            >
              {LANG_LABEL[l]}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>{t("daily_maxes")}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("snatch_kg")}>
            <Input
              type="number"
              value={input.daily_snatch_max}
              onChange={(e) => engineStore.setInput({ daily_snatch_max: Number(e.target.value) })}
              className="h-12 text-lg font-bold"
            />
          </Field>
          <Field label={t("cj_kg")}>
            <Input
              type="number"
              value={input.daily_clean_jerk_max}
              onChange={(e) => engineStore.setInput({ daily_clean_jerk_max: Number(e.target.value) })}
              className="h-12 text-lg font-bold"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <SectionTitle>{t("strength_maxes")}</SectionTitle>
        {(["front_squat", "back_squat"] as const).map((id) => (
          <Field key={id} label={STRENGTH_LABEL[id]}>
            <Input
              type="number"
              value={user_maxes[id] ?? 0}
              onChange={(e) => engineStore.setMax(id, Number(e.target.value))}
              className="h-12 text-lg font-bold"
            />
          </Field>
        ))}
      </section>

      <section className="space-y-4">
        <SectionTitle>{t("state")}</SectionTitle>
        <Field label={`${t("readiness")} · ${input.readiness}/10`}>
          <Slider min={1} max={10} step={1} value={[input.readiness]} onValueChange={(v) => engineStore.setInput({ readiness: v[0] })} />
        </Field>
        <Field label={`${t("fatigue")} · ${input.fatigue_score}/100`}>
          <Slider min={0} max={100} step={1} value={[input.fatigue_score]} onValueChange={(v) => engineStore.setInput({ fatigue_score: v[0] })} />
        </Field>
      </section>

      <section className="space-y-3">
        <SectionTitle>{t("body_type")}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(BODY) as BodyType[]).map((b) => (
            <Button key={b} variant={input.body_type === b ? "default" : "outline"} className="h-12 font-bold uppercase" onClick={() => engineStore.setInput({ body_type: b })}>
              {BODY[b]}
            </Button>
          ))}
        </div>
      </section>

      <ProfileAssessmentSection />

      <Button onClick={() => engineStore.generate()} className="w-full h-14 font-black uppercase tracking-wider">
        {t("regenerate_workout")}
      </Button>
      <Button variant="outline" onClick={() => engineStore.reset()} className="w-full h-10 uppercase text-xs tracking-widest">
        {t("reset_all")}
      </Button>
    </Page>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">{label}</div>
      {children}
    </div>
  );
}

const DEFAULT_ASSESSMENT: ProfileAssessment = {
  energy_level: 7,
  recovery_speed: 7,
  body_tendency: "stable",
  stress_response: "calm",
  sleep_quality: 7,
};

function ProfileAssessmentSection() {
  const t = useT();
  const { input } = useEngine();
  const a = input.profile_assessment ?? DEFAULT_ASSESSMENT;
  const update = (patch: Partial<ProfileAssessment>) =>
    engineStore.setInput({ profile_assessment: { ...a, ...patch } });

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

  return (
    <section className="space-y-4">
      <SectionTitle>{t("profile_assessment")}</SectionTitle>

      <Field label={`${t("energy_level")} · ${a.energy_level}/10`}>
        <Slider min={1} max={10} step={1} value={[a.energy_level]} onValueChange={(v) => update({ energy_level: v[0] })} />
      </Field>

      <Field label={`${t("recovery_speed")} · ${a.recovery_speed}/10`}>
        <Slider min={1} max={10} step={1} value={[a.recovery_speed]} onValueChange={(v) => update({ recovery_speed: v[0] })} />
      </Field>

      <Field label={`${t("sleep_quality")} · ${a.sleep_quality}/10`}>
        <Slider min={1} max={10} step={1} value={[a.sleep_quality]} onValueChange={(v) => update({ sleep_quality: v[0] })} />
      </Field>

      <Field label={t("body_tendency")}>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(TENDENCY) as BodyTendency[]).map((b) => (
            <Button
              key={b}
              variant={a.body_tendency === b ? "default" : "outline"}
              className={cn("h-12 text-[10px] font-bold uppercase leading-tight whitespace-normal")}
              onClick={() => update({ body_tendency: b })}
            >
              {TENDENCY[b]}
            </Button>
          ))}
        </div>
      </Field>

      <Field label={t("stress_response")}>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(STRESS) as StressResponse[]).map((s) => (
            <Button
              key={s}
              variant={a.stress_response === s ? "default" : "outline"}
              className={cn("h-12 text-[10px] font-bold uppercase leading-tight whitespace-normal")}
              onClick={() => update({ stress_response: s })}
            >
              {STRESS[s]}
            </Button>
          ))}
        </div>
      </Field>
    </section>
  );
}
