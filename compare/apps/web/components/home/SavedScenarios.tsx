"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import type { PathwayPreset } from "@/components/home/QuickHeroSimulator";

export interface SavedScenario {
  id: string;
  label: string;
  pathway: PathwayPreset;
  gross: number;
  rent: number;
  living: number;
  currencySymbol: string;
  netSavingsText: string;
  savedAt: string;
}

const STORAGE_KEY = "bandinghidup_saved_scenarios";
const MAX_SCENARIOS = 3;

export function SavedScenarios() {
  const { locale } = useI18n();
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const txt = (idStr: string, enStr: string, deStr: string, jaStr: string) => {
    if (locale === "de") return deStr;
    if (locale === "ja") return jaStr;
    if (locale === "en") return enStr;
    return idStr;
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setScenarios(parsed.slice(0, MAX_SCENARIOS));
        }
      }
    } catch (e) {
      console.warn("Failed to load saved scenarios from localStorage", e);
    }
    setIsLoaded(true);

    const handleScenarioSaved = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setScenarios(JSON.parse(stored).slice(0, MAX_SCENARIOS));
        }
      } catch {}
    };

    window.addEventListener("bandinghidup:scenario-saved", handleScenarioSaved);
    return () => {
      window.removeEventListener("bandinghidup:scenario-saved", handleScenarioSaved);
    };
  }, []);

  function deleteScenario(id: string) {
    const updated = scenarios.filter((s) => s.id !== id);
    setScenarios(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }

  function loadScenario(scenario: SavedScenario) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bandinghidup:load-scenario", { detail: scenario })
      );
      const el = document.getElementById("quick-simulator");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  if (!isLoaded || scenarios.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-5 border border-line rounded-xl bg-panel space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📌</span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
            {txt(
              "Skenario Tersimpan",
              "Saved Scenarios",
              "Gespeicherte Szenarien",
              "保存済みシミュレーション"
            )}
          </h3>
          <span className="badge-accent text-[10px]">
            {scenarios.length}/{MAX_SCENARIOS}
          </span>
        </div>
        <span className="text-[11px] text-fg-muted font-mono">
          {txt("1-klik muat ulang", "1-click reload", "1-Klick Reload", "1クリックで復元")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {scenarios.map((s) => (
          <div
            key={s.id}
            className="p-3.5 rounded-lg bg-panel-2 border border-line hover:border-line-strong transition-all flex flex-col justify-between space-y-3 group"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text)] mb-1">
                <span className="truncate pr-1">{s.label}</span>
                <button
                  onClick={() => deleteScenario(s.id)}
                  title={txt("Hapus skenario", "Delete scenario", "Löschen", "削除")}
                  className="text-fg-soft hover:text-red-400 p-0.5 rounded transition-colors text-xs opacity-60 group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-0.5 text-[11px] font-mono text-fg-70">
                <div>
                  <span className="text-fg-muted">{txt("Gross:", "Gross:", "Brutto:", "額面:")} </span>
                  <span className="font-semibold text-[var(--accent)]">
                    {s.currencySymbol}{s.gross.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-fg-muted">{txt("Sisa:", "Buffer:", "Puffer:", "余剰:")} </span>
                  <span className="font-semibold text-emerald-400">
                    {s.netSavingsText}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => loadScenario(s)}
              className="btn-secondary w-full py-1.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 rounded-md"
            >
              <span>⚡</span>
              <span>{txt("Muat ke Simulator", "Load to Tool", "Laden", "再試算")}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
