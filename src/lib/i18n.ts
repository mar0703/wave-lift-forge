// Hybrid i18n: fixed English weightlifting terminology + auto-translation for UI.

export const WL_TERMS = [
  "snatch",
  "clean",
  "clean & jerk",
  "jerk",
  "push jerk",
  "power clean",
  "power snatch",
  "front squat",
  "back squat",
  "pull",
  "hang",
  "1RM",
  "RPE",
] as const;

export type Lang = "en" | "pl" | "ru";

export const DICT: Record<Lang, Record<string, string>> = {
  en: {
    start_workout: "Start workout",
    finish_session: "Finish session",
  },
  pl: {
    start_workout: "Rozpocznij trening",
    finish_session: "Zakończ trening",
  },
  ru: {
    start_workout: "Начать тренировку",
    finish_session: "Завершить тренировку",
  },
};

export function isWeightliftingTerm(text: string): boolean {
  const lower = text.toLowerCase();
  return WL_TERMS.some((t) => lower.includes(t));
}

const cache = new Map<string, string>();

export async function autoTranslate(text: string, lang: Lang): Promise<string> {
  if (lang === "en") return text;
  if (isWeightliftingTerm(text)) return text;

  const key = `${lang}::${text}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      body: JSON.stringify({
        q: text,
        source: "en",
        target: lang,
        format: "text",
      }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { translatedText?: string };
    const out = data.translatedText ?? text;
    cache.set(key, out);
    return out;
  } catch {
    return text; // fallback to English
  }
}

/**
 * Main translation entry point.
 * 1. If `key` exists in DICT for the lang → use dictionary (override).
 * 2. If text is a weightlifting term → keep in English.
 * 3. Otherwise → auto-translate (with English fallback on failure).
 */
export async function t(key: string, lang: Lang): Promise<string> {
  const dict = DICT[lang] ?? DICT.en;
  if (dict[key]) return dict[key];

  const enFallback = DICT.en[key] ?? key;
  if (isWeightliftingTerm(enFallback)) return enFallback;

  return autoTranslate(enFallback, lang);
}

/** Synchronous lookup: dictionary only, no network. Returns English fallback. */
export function tSync(key: string, lang: Lang): string {
  const dict = DICT[lang] ?? DICT.en;
  return dict[key] ?? DICT.en[key] ?? key;
}
