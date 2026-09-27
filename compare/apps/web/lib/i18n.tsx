"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { ActiveLocale } from "@bandinghidup/core";
import idDict from "../locales/id.json";
import enDict from "../locales/en.json";
import deDict from "../locales/de.json";
import jaDict from "../locales/ja.json";

// ─── Translation Dictionaries Loaded from JSON ────────────────────────────────

const dictionaries: Record<ActiveLocale, Record<string, string>> = {
  id: idDict,
  en: enDict,
  de: deDict,
  ja: jaDict,
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface I18nContextValue {
  locale: ActiveLocale;
  setLocale: (locale: ActiveLocale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: ActiveLocale;
}

export function I18nProvider({ children, defaultLocale = "id" }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<ActiveLocale>(defaultLocale);

  // Initialize from persisted localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bandinghidup_locale") as ActiveLocale | null;
      if (saved && (["id", "en", "de", "ja"] as ActiveLocale[]).includes(saved)) {
        setLocaleState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
          const title = dictionaries[saved]?.["app.title"];
          if (title) document.title = title;
        }
      }
    } catch {}
  }, []);

  const setLocale = useCallback((newLocale: ActiveLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("bandinghidup_locale", newLocale);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
      const title = dictionaries[newLocale]?.["app.title"];
      if (title) document.title = title;
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = dictionaries[locale] ?? dictionaries["id"];
      return dict[key] ?? fallback ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }
  return ctx;
}
