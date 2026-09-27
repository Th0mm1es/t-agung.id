"use client";

import { useReducer, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { computeScenario, getCareerPathwayBenchmark } from "@bandinghidup/core";
import { WizardProgress } from "./WizardProgress";
import {
  wizardReducer,
  INITIAL_STATE,
  serializeWizardState,
  deserializeWizardState,
} from "./wizardState";
import { Step1Destination } from "./Step1Destination";
import { Step2Pathway } from "./Step2Pathway";
import { Step3Income } from "./Step3Income";
import { Step4Housing } from "./Step4Housing";
import { Step5Lifestyle } from "./Step5Lifestyle";
import { Step6Review } from "./Step6Review";
import { Step7Results } from "./Step7Results";

const WIZARD_STORAGE_KEY = "bandinghidup_wizard_state";

export function WizardClient() {
  const { locale } = useI18n();
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);
  const isLoadedRef = useRef(false);

  // Restore state from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WIZARD_STORAGE_KEY);
      if (saved) {
        const parsed = deserializeWizardState(saved);
        if (parsed && typeof parsed === "object") {
          dispatch({ type: "LOAD_PERSISTED_STATE", payload: parsed });
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      isLoadedRef.current = true;
    }
  }, []);

  // Persist state to localStorage on updates (after initial restore)
  useEffect(() => {
    if (!isLoadedRef.current) return;
    try {
      localStorage.setItem(WIZARD_STORAGE_KEY, serializeWizardState(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const stepLabels = useMemo(() => {
    return locale === "ja"
      ? ["渡航先", "区分", "給与・控除", "住居", "生活様式", "確認", "診断結果"]
      : locale === "de"
      ? ["Zielort", "Pfad", "Gehalt & Abzüge", "Wohnen", "Lebensstil", "Übersicht", "Ergebnis"]
      : locale === "en"
      ? ["Destination", "Pathway", "Income & Tax", "Housing", "Lifestyle", "Review", "Results"]
      : ["Tujuan", "Jalur", "Gaji & Potongan", "Hunian", "Gaya Hidup", "Review", "Hasil"];
  }, [locale]);

  // Compute scenario result for City #2 (Destination)
  const scenarioResult = useMemo(() => {
    if (state.currentStep !== 7 || !state.country || !state.pathway) {
      return null;
    }

    return computeScenario({
      id: `scenario-${Date.now()}`,
      createdAt: new Date().toISOString(),
      country: state.country,
      cityId: state.cityId,
      cityName: state.cityName || (state.country === "DE" ? "Berlin" : "Tokyo"),
      pathway: state.pathway,
      locale: locale as any,
      grossMonthlyMinorUnits: state.grossMonthlyMinorUnits,
      ausbildungTrainingYear: state.ausbildungTrainingYear,
      japaneseDeductions: state.japaneseDeductions,
      customDeductionRate: state.customDeductionRate,
      manualNetMonthlyMinorUnits: state.useManualNet ? state.manualNetMonthlyMinorUnits : undefined,
      familyStatus: state.familyStatus,
      numChildren: state.numChildren,
      housingType: state.housingType,
      monthlyRentMinorUnits: state.monthlyRentMinorUnits,
      isEmployerProvidedHousing: state.isEmployerProvidedHousing,
      availableSavingsMinorUnits: state.availableSavingsMinorUnits,
      lifestyleProfile: state.lifestyleProfile,
      basketOverrides: state.basketOverrides,
      relocationInput: {
        depositMonths: state.depositMonths,
        keyMoneyMonths: state.keyMoneyMonths,
        agencyFeeMinorUnits: state.agencyFeeMinorUnits,
        setupCushionMinorUnits: state.setupCushionMinorUnits,
        initialTravelMinorUnits: state.initialTravelMinorUnits,
      },
    });
  }, [state, locale]);

  // Compute reference result for City #1 (Reference Baseline)
  const referenceResult = useMemo(() => {
    if (state.currentStep !== 7) return null;

    const refBench = getCareerPathwayBenchmark(
      state.refCountry,
      state.refCityName || "Jakarta",
      "fresh_grad_s1"
    );

    return computeScenario({
      id: `ref-scenario-${Date.now()}`,
      createdAt: new Date().toISOString(),
      country: state.refCountry,
      cityId: state.refCityId || "ref-city",
      cityName: state.refCityName || "Jakarta",
      pathway: state.refCountry === "DE" ? "ausbildung" : state.refCountry === "JP" ? "technical_intern" : "fresh_grad",
      locale: locale as any,
      grossMonthlyMinorUnits: refBench.grossMonthlyMinorUnits,
      housingType: "shared_room",
      monthlyRentMinorUnits: refBench.recommendedRentMinorUnits,
      isEmployerProvidedHousing: false,
      availableSavingsMinorUnits: state.availableSavingsMinorUnits,
      lifestyleProfile: state.lifestyleProfile,
    });
  }, [state.currentStep, state.refCountry, state.refCityId, state.refCityName, state.lifestyleProfile, state.availableSavingsMinorUnits, locale]);

  const handleNext = () => dispatch({ type: "NEXT_STEP" });
  const handleBack = () => dispatch({ type: "PREV_STEP" });
  const handleReset = () => {
    try {
      localStorage.removeItem(WIZARD_STORAGE_KEY);
    } catch {}
    dispatch({ type: "RESET" });
  };

  const containerClass = state.currentStep === 7 ? "max-w-5xl" : "max-w-xl";

  return (
    <div className={`${containerClass} mx-auto py-8 px-4 space-y-6 transition-all duration-300`}>
      {/* Escape Link back to Quick Simulator */}
      <div className="flex items-center justify-between pb-1 text-xs">
        <Link
          href="/"
          id="wizard-escape-to-home"
          className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline font-medium transition-colors"
        >
          <span>←</span>
          <span>
            {locale === "ja"
              ? "簡易シミュレーター（トップページ）へ戻る"
              : locale === "en"
              ? "Back to Instant Quick Simulator"
              : locale === "de"
              ? "Zurück zum Schnellrechner"
              : "Kembali ke simulasi cepat"}
          </span>
        </Link>
        <span className="text-[10px] text-[var(--soft)] font-mono">
          {locale === "ja"
            ? "進行状況は自動保存されます"
            : locale === "en"
            ? "Progress auto-saved"
            : locale === "de"
            ? "Fortschritt automatisch gespeichert"
            : "Otomatis tersimpan"}
        </span>
      </div>

      <WizardProgress
        currentStep={state.currentStep}
        totalSteps={7}
        stepLabels={stepLabels}
        onStepClick={(step) => dispatch({ type: "SET_STEP", step })}
      />

      <div className="glass-card p-6 md:p-8">
        {state.currentStep === 1 && (
          <Step1Destination state={state} dispatch={dispatch} onNext={handleNext} />
        )}
        {state.currentStep === 2 && (
          <Step2Pathway state={state} dispatch={dispatch} onNext={handleNext} onBack={handleBack} />
        )}
        {state.currentStep === 3 && (
          <Step3Income state={state} dispatch={dispatch} onNext={handleNext} onBack={handleBack} />
        )}
        {state.currentStep === 4 && (
          <Step4Housing state={state} dispatch={dispatch} onNext={handleNext} onBack={handleBack} />
        )}
        {state.currentStep === 5 && (
          <Step5Lifestyle state={state} dispatch={dispatch} onNext={handleNext} onBack={handleBack} />
        )}
        {state.currentStep === 6 && (
          <Step6Review state={state} dispatch={dispatch} onNext={handleNext} onBack={handleBack} />
        )}
        {state.currentStep === 7 && scenarioResult && (
          <Step7Results
            result={scenarioResult}
            referenceResult={referenceResult}
            onBack={handleBack}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
