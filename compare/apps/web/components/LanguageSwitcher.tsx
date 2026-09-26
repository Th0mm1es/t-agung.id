"use client";

import React from "react";
import { useI18n } from "@/lib/i18n";
import type { ActiveLocale } from "@bandinghidup/core";

const LOCALES: Array<{
  code: ActiveLocale;
  flag: string;
  short: string;
  name: string;
}> = [
  { code: "id", flag: "🇮🇩", short: "ID", name: "Bahasa Indonesia" },
  { code: "en", flag: "🇬🇧", short: "EN", name: "English" },
  { code: "de", flag: "🇩🇪", short: "DE", name: "Deutsch" },
  { code: "ja", flag: "🇯🇵", short: "JA", name: "日本語" },
];

export function LanguageSwitcher({ fullLabels = false }: { fullLabels?: boolean }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl transition-colors flex-shrink-0"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
      role="group"
      aria-label="Language selector"
    >
      {LOCALES.map(({ code, flag, short, name }) => {
        const isActive = locale === code;
        return (
          <button
            key={code}
            id={`lang-btn-${code}`}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={isActive}
            title={name}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 flex-shrink-0 whitespace-nowrap ${
              isActive
                ? "bg-[var(--accent)] text-white font-bold shadow-sm scale-100"
                : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]"
            }`}
          >
            <span>{flag}</span>
            <span>{fullLabels ? name : short}</span>
          </button>
        );
      })}
    </div>
  );
}
