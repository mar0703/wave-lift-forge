import { createFileRoute } from "@tanstack/react-router";
import { useEngine, engineStore } from "@/lib/engine-store";
import { Page, SectionTitle } from "@/components/Page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { BodyType, Dosha } from "@/lib/training-engine";
import { LANGS, useLang, setLang, useT, type Lang } from "@/lib/i18n";

const LANG_LABEL: Record<Lang, string> = { en: "EN", pl: "PL", ru: "RU" };

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Iron Method" },
      { name: "description", content: "Set your current maxes, body type, dosha and recovery state." },
      { property: "og:title", content: "Athlete Profile — Iron Method" },
      { property: "og:description", content: "Configure inputs that drive your adaptive training engine." },
    ],
  }),
  component: ProfileScreen,
});

const DOSHAS: Dosha[] = ["vata", "pitta", "kapha"];

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

      <section className="space-y-3">
        <SectionTitle>{t("dosha")}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {DOSHAS.map((d) => (
            <Button key={d} variant={input.dosha === d ? "default" : "outline"} className={cn("h-12 font-bold uppercase")} onClick={() => engineStore.setInput({ dosha: d })}>
              {d}
            </Button>
          ))}
        </div>
      </section>

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
