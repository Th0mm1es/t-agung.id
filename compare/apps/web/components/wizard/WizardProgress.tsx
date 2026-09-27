"use client";

import React, { useMemo } from "react";
import { useI18n } from "@/lib/i18n";

interface WizardProgressProps {
  currentStep: number;  // 1-indexed (1..7)
  totalSteps: number;
  stepLabels: string[];
  onStepClick?: (step: number) => void;
}

export function WizardProgress({
  currentStep,
  totalSteps,
  stepLabels,
  onStepClick,
}: WizardProgressProps) {
  const { locale } = useI18n();
  const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const shortLabels = useMemo(() => {
    switch (locale) {
      case "ja":
        return ["都市", "進路", "給与", "住居", "生活", "確認", "結果"];
      case "de":
        return ["Stadt", "Pfad", "Gehalt", "Wohnen", "Lebensstil", "Übersicht", "Ergebnis"];
      case "en":
        return ["City", "Track", "Income", "Housing", "Lifestyle", "Review", "Results"];
      case "id":
      default:
        return ["Kota", "Jalur", "Gaji", "Rumah", "Gaya Hidup", "Tinjau", "Hasil"];
    }
  }, [locale]);

  return (
    <nav aria-label="Wizard Progress" className="w-full space-y-4">
      {/* Step counter banner */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="text-fg-muted font-medium">
          {locale === "ja"
            ? `ステップ ${currentStep} / ${totalSteps}`
            : locale === "de"
            ? `Schritt ${currentStep} von ${totalSteps}`
            : locale === "en"
            ? `Step ${currentStep} of ${totalSteps}`
            : `Langkah ${currentStep} dari ${totalSteps}`}
        </span>
        <span className="text-[var(--accent)] font-semibold">
          {stepLabels[currentStep - 1]}
        </span>
      </div>

      {/* Progress bar line */}
      <div
        className="relative h-1.5 rounded-full overflow-hidden bg-panel-2 border border-line"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 bg-[var(--accent)] shadow-sm"
          style={{
            width: `${progressPct}%`,
          }}
        />
      </div>

      {/* 7 Interactive Labeled Step Buttons */}
      <div className="flex items-start justify-between gap-1">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNum = index + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const isClickable = stepNum <= currentStep;
          const label = shortLabels[index] || `Step ${stepNum}`;

          return (
            <button
              key={stepNum}
              type="button"
              id={`wizard-step-dot-${stepNum}`}
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick?.(stepNum)}
              aria-current={isCurrent ? "step" : undefined}
              aria-disabled={!isClickable}
              aria-label={`Step ${stepNum}: ${label}`}
              className={`group flex-1 flex flex-col items-center gap-1.5 transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-lg py-1 px-0.5 ${
                isClickable
                  ? "cursor-pointer hover:opacity-90"
                  : "cursor-not-allowed opacity-40"
              }`}
            >
              {/* Dot badge */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shadow-sm ${
                  isDone
                    ? "bg-[var(--accent)] text-white shadow-emerald-950/20"
                    : isCurrent
                    ? "text-[var(--text)] bg-[var(--accent)]/30 ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg)]"
                    : "bg-panel-2 text-fg-soft border border-line"
                }`}
              >
                {isDone ? "✓" : stepNum}
              </div>

              {/* Step Label (always visible under dot, 1-2 words) */}
              <span
                className={`text-[9px] sm:text-[11px] text-center leading-tight transition-colors break-words max-w-[44px] sm:max-w-[70px] ${
                  isCurrent
                    ? "text-[var(--accent)] font-bold"
                    : isDone
                    ? "text-fg-80 font-medium"
                    : "text-fg-soft"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
