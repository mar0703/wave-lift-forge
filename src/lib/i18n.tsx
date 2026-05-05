// Hybrid i18n system:
//  - UI translations are SYNCHRONOUS (instant render, no flicker)
//  - Weightlifting terminology stays strictly in English
//  - Dynamic / unknown text can be auto-translated asynchronously
//  - Failures fall back to English; results are cached in-memory

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Terminology (strict, lowercase, normalized)
// ─────────────────────────────────────────────────────────────────────────────

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
  "1rm",
  "rpe",
] as const;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9& ]/g, " ").replace(/\s+/g, " ").trim();
}

/** Exact match — use for a string that is itself a single term. */
export function isWeightliftingTerm(text: string): boolean {
  const n = normalize(text);
  return WL_TERMS.some((t) => normalize(t) === n);
}

/** Substring match — use for longer phrases that may embed a term. */
export function containsWeightliftingTerm(text: string): boolean {
  const lower = text.toLowerCase();
  return WL_TERMS.some((t) => lower.includes(t));
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Dictionary (UI strings only — never weightlifting terms)
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = "en" | "pl" | "ru";
export const LANGS: Lang[] = ["en", "pl", "ru"];

export const DICT: Record<Lang, Record<string, string>> = {
  en: {
    start_workout: "Start workout",
    finish_session: "Finish session",
    regenerate: "Regenerate",
    today: "Today",
    cycle: "Cycle",
    stats: "Stats",
    profile: "Profile",
    workout: "Workout",
    loading: "Loading…",
    session_intensity: "Session intensity",
    plan_preview: "Plan preview",
    lifts: "Lifts",
    sets: "Sets",
    fatigue: "Fatigue",
    base: "base",
    day: "Day",
    technique: "Technique",
    strength: "Strength",
    heavy_peak: "Heavy / Peak",
  },
  pl: {
    start_workout: "Rozpocznij trening",
    finish_session: "Zakończ trening",
    regenerate: "Wygeneruj ponownie",
    today: "Dziś",
    cycle: "Cykl",
    stats: "Statystyki",
    profile: "Profil",
    workout: "Trening",
    loading: "Ładowanie…",
    session_intensity: "Intensywność sesji",
    plan_preview: "Podgląd planu",
    lifts: "Ćwiczenia",
    sets: "Serie",
    fatigue: "Zmęczenie",
    base: "baza",
    day: "Dzień",
    technique: "Technika",
    strength: "Siła",
    heavy_peak: "Ciężko / Peak",
  },
  ru: {
    start_workout: "Начать тренировку",
    finish_session: "Завершить тренировку",
    regenerate: "Сгенерировать заново",
    today: "Сегодня",
    cycle: "Цикл",
    stats: "Статистика",
    profile: "Профиль",
    workout: "Тренировка",
    loading: "Загрузка…",
    session_intensity: "Интенсивность сессии",
    plan_preview: "Превью плана",
    lifts: "Упражнения",
    sets: "Подходы",
    fatigue: "Усталость",
    base: "база",
    day: "День",
    technique: "Техника",
    strength: "Сила",
    heavy_peak: "Тяжёлая / Пик",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Synchronous lookup (use this in render)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Synchronous translation. Always returns immediately.
 * Order: dict[lang][key] → dict.en[key] → key itself.
 * Weightlifting terms are returned untouched (English).
 */
export function tSync(key: string, lang: Lang): string {
  if (containsWeightliftingTerm(key) && !DICT.en[key]) return key;
  const fromLang = DICT[lang]?.[key];
  if (fromLang) return fromLang;
  return DICT.en[key] ?? key;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Async auto-translation (for dynamic strings)
// ─────────────────────────────────────────────────────────────────────────────

const asyncCache = new Map<string, string>();

export async function autoTranslate(text: string, lang: Lang): Promise<string> {
  if (!text) return text;
  if (lang === "en") return text;
  if (containsWeightliftingTerm(text)) return text; // never translate WL terms

  const cacheKey = `${lang}::${text}`;
  const cached = asyncCache.get(cacheKey);
  if (cached) return cached;

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
    const out = data.translatedText?.trim() || text;
    asyncCache.set(cacheKey, out);
    return out;
  } catch {
    return text; // fallback to English
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — React integration: language store + hooks + provider
// ─────────────────────────────────────────────────────────────────────────────

const LANG_KEY = "iron-method-lang";
let currentLang: Lang = "en";
const langListeners = new Set<() => void>();

function loadLang(): Lang {
  if (typeof localStorage === "undefined") return "en";
  const v = localStorage.getItem(LANG_KEY);
  return (LANGS as string[]).includes(v ?? "") ? (v as Lang) : "en";
}

export function setLang(lang: Lang): void {
  if (lang === currentLang) return;
  currentLang = lang;
  if (typeof localStorage !== "undefined") localStorage.setItem(LANG_KEY, lang);
  langListeners.forEach((l) => l());
}

export function getLang(): Lang {
  return currentLang;
}

function subscribe(cb: () => void): () => void {
  langListeners.add(cb);
  return () => langListeners.delete(cb);
}

/**
 * Returns the active language. SSR-safe: server and first client render both
 * return "en". After mount, real language from localStorage is applied.
 */
export function useLang(): Lang {
  const lang = useSyncExternalStore<Lang>(
    subscribe,
    () => currentLang,
    () => "en" as Lang,
  );
  // Hydrate from localStorage on mount (once)
  useEffect(() => {
    const stored = loadLang();
    if (stored !== currentLang) setLang(stored);
  }, []);
  return lang;
}

/** Convenience hook returning a synchronous translator bound to current lang. */
export function useT(): (key: string) => string {
  const lang = useLang();
  return (key: string) => tSync(key, lang);
}

/**
 * Async translation hook for arbitrary dynamic text (e.g. exercise descriptions).
 * Returns English immediately, then swaps to translation when ready.
 * Cleanup on unmount prevents state updates on dead components (no leaks).
 */
export function useAutoTranslate(text: string): string {
  const lang = useLang();
  const [out, setOut] = useState<string>(text);

  useEffect(() => {
    setOut(text); // reset to English fallback while loading
    if (lang === "en" || containsWeightliftingTerm(text) || !text) return;

    let alive = true;
    autoTranslate(text, lang).then((translated) => {
      if (alive) setOut(translated);
    });
    return () => {
      alive = false;
    };
  }, [text, lang]);

  return out;
}

// Optional context-based provider (kept lightweight; the store works without it)
const LangContext = createContext<Lang>("en");

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useLang();
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLanguageContext(): Lang {
  return useContext(LangContext);
}
