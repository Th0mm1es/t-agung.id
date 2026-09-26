"use client";

import { useI18n } from "@/lib/i18n";

interface WizardProgressProps {
  currentStep: number;  // 1-indexed
  totalSteps: number;
  stepLabels: string[];
}

export function WizardProgress({ currentStep, totalSteps, stepLabels }: WizardProgressProps) {
  const { locale } = useI18n();
  const progressPct = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full space-y-3">
      {/* Step counter */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/50">
          {locale === "ja" ? `ステップ ${currentStep} / ${totalSteps}` : locale === "en" ? `Step ${currentStep} / ${totalSteps}` : `Langkah ${currentStep} / ${totalSteps}`}
        </span>
        <span className="text-brand-400 font-medium">{stepLabels[currentStep - 1]}</span>
      </div>

      {/* Progress bar */}
      <div
        className="relative h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(40, 144, 109, 0.15)" }}
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, #28906d, #47ac87)",
            boxShadow: "0 0 8px rgba(40, 144, 109, 0.5)",
          }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between">
        {stepLabels.map((_, index) => {
          const stepNum = index + 1;
          const isDone = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div
              key={stepNum}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? "bg-brand-500 text-white"
                    : isCurrent
                    ? "text-white ring-2 ring-brand-400 ring-offset-1 ring-offset-transparent"
                    : "bg-white/10 text-white/30"
                }`}
                style={isCurrent ? { background: "rgba(40, 144, 109, 0.4)" } : undefined}
              >
                {isDone ? "✓" : stepNum}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
