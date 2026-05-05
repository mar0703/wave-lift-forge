// Production-grade hybrid i18n:
//  - Synchronous UI translations (instant render)
//  - Strict English weightlifting terminology (word-boundary safe — no substring bugs)
//  - Async translation ONLY for dynamic text, with timeout + bounded LRU cache
//  - SSR-safe language handling (server + first client render === "en")
//  - No React misuse: stable subscribe, leak-safe effects

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Terminology (strict, word-boundary matching)
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
  return text.toLowerCase().replace(/[^a-z0-9& ]+/g, " ").replace(/\s+/g, " ").trim();
}

// Build a single regex with word boundaries to avoid substring false positives
// (e.g. "cleanse" must NOT match "clean", "spring" must NOT match "ring").
const WL_REGEX = new RegExp(
  "(^|[^a-z0-9])(" +
    WL_TERMS.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+"))
      .sort((a, b) => b.length - a.length) // longest first → "clean & jerk" before "clean"
      .join("|") +
    ")($|[^a-z0-9])",
  "i",
);

/** Exact match — the whole string IS a single weightlifting term. */
export function isWeightliftingTerm(text: string): boolean {
  const n = normalize(text);
  return WL_TERMS.some((t) => normalize(t) === n);
}

/** Phrase match — text contains a weightlifting term as a whole word. */
export function containsWeightliftingTerm(text: string): boolean {
  if (!text) return false;
  return WL_REGEX.test(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Dictionary (UI strings only — never weightlifting terms)
// ─────────────────────────────────────────────────────────────────────────────

export type Lang = "en" | "pl" | "ru";
export const LANGS: readonly Lang[] = ["en", "pl", "ru"] as const;

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
// STEP 3 — Synchronous lookup (use this in render — never async in render)
// ─────────────────────────────────────────────────────────────────────────────

export function tSync(key: string, lang: Lang): string {
  // If the key is itself a weightlifting term and not in dictionary → keep English.
  if (containsWeightliftingTerm(key) && !DICT.en[key]) return key;
  const fromLang = DICT[lang]?.[key];
  if (fromLang) return fromLang;
  return DICT.en[key] ?? key;
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Async auto-translation (dynamic strings only)
//   * AbortController timeout → no UI freeze
//   * Bounded LRU cache → no memory leaks
//   * Always falls back to English on any failure
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_LIMIT = 500;
const TRANSLATE_TIMEOUT_MS = 4000;
const asyncCache = new Map<string, string>(); // insertion-ordered → simple LRU

function cacheGet(key: string): string | undefined {
  const v = asyncCache.get(key);
  if (v !== undefined) {
    asyncCache.delete(key);
    asyncCache.set(key, v); // refresh recency
  }
  return v;
}

function cacheSet(key: string, value: string): void {
  if (asyncCache.has(key)) asyncCache.delete(key);
  asyncCache.set(key, value);
  if (asyncCache.size > CACHE_LIMIT) {
    const oldest = asyncCache.keys().next().value;
    if (oldest !== undefined) asyncCache.delete(oldest);
  }
}

export async function autoTranslate(text: string, lang: Lang): Promise<string> {
  if (!text) return text;
  if (lang === "en") return text;
  if (containsWeightliftingTerm(text)) return text;

  const key = `${lang}::${text}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TRANSLATE_TIMEOUT_MS);

  try {
    const res = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      signal: ctrl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: "en", target: lang, format: "text" }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { translatedText?: string };
    const out = data.translatedText?.trim() || text;
    cacheSet(key, out);
    return out;
  } catch {
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 5 — React integration: language store + hooks (SSR-safe)
// ─────────────────────────────────────────────────────────────────────────────

const LANG_KEY = "iron-method-lang";
let currentLang: Lang = "en";
const langListeners = new Set<() => void>();

function detectBrowserLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  const candidates: string[] = [
    ...(navigator.languages ?? []),
    navigator.language ?? "",
  ].filter(Boolean);
  for (const raw of candidates) {
    const code = raw.toLowerCase().split("-")[0];
    if ((LANGS as readonly string[]).includes(code)) return code as Lang;
  }
  return "en";
}

function loadLang(): Lang {
  if (typeof localStorage === "undefined") return "en";
  const v = localStorage.getItem(LANG_KEY);
  if ((LANGS as readonly string[]).includes(v ?? "")) return v as Lang;
  // First visit → auto-detect from browser. Manual setLang() will persist and override.
  return detectBrowserLang();
}

export function setLang(lang: Lang): void {
  if (lang === currentLang) return;
  currentLang = lang;
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore quota / private mode */
    }
  }
  langListeners.forEach((l) => l());
}

export function getLang(): Lang {
  return currentLang;
}

// Stable subscribe reference — required by useSyncExternalStore.
function subscribe(cb: () => void): () => void {
  langListeners.add(cb);
  return () => {
    langListeners.delete(cb);
  };
}

const getSnapshot = (): Lang => currentLang;
const getServerSnapshot = (): Lang => "en"; // SSR + first client render → "en"

/**
 * Active language. Server and first client render BOTH return "en"
 * (prevents hydration mismatch). After mount we sync from localStorage.
 */
export function useLang(): Lang {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const stored = loadLang();
    if (stored !== currentLang) setLang(stored);
  }, []);

  return lang;
}

/** Synchronous translator bound to current language. */
export function useT(): (key: string) => string {
  const lang = useLang();
  return (key: string) => tSync(key, lang);
}

/**
 * Async translation for dynamic text (descriptions, user content).
 * Returns English immediately, then upgrades when translation resolves.
 * Leak-safe: ignores resolution after unmount or text/lang change.
 */
export function useAutoTranslate(text: string): string {
  const lang = useLang();
  const [out, setOut] = useState<string>(text);

  useEffect(() => {
    setOut(text);
    if (lang === "en" || !text || containsWeightliftingTerm(text)) return;

    let alive = true;
    autoTranslate(text, lang).then((translated) => {
      if (alive && translated !== text) setOut(translated);
    });
    return () => {
      alive = false;
    };
  }, [text, lang]);

  return out;
}

// Optional context provider for components that prefer context over the hook.
const LangContext = createContext<Lang>("en");

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useLang();
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLanguageContext(): Lang {
  return useContext(LangContext);
}
