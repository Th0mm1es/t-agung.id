"use client";

import { useReducer, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { computeScenario, getCareerPathwayBenchmark } from "@bandinghidup/core";
import { WizardProgress } from "./WizardProgress";
import { wizardReducer, INITIAL_STATE } from "./wizardState";
import { Step1Destination } from "./Step1Destination";
import { Step2Pathway } from "./Step2Pathway";
import { Step3Income } from "./Step3Income";
import { Step4Housing } from "./Step4Housing";
import { Step5Lifestyle } from "./Step5Lifestyle";
import { Step6Review } from "./Step6Review";
import { Step7Results } from "./Step7Results";

export function WizardClient() {
  const { locale } = useI18n();
  const [state, dispatch] = useReducer(wizardReducer, INITIAL_STATE);

  const stepLabels = useMemo(() => {
    return locale === "ja"
      ? ["渡航先", "区分", "給与・控除", "住居", "生活様式", "確認", "診断結果"]
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
  const handleReset = () => dispatch({ type: "RESET" });

  const containerClass = state.currentStep === 7 ? "max-w-5xl" : "max-w-xl";

  return (
    <div className={`${containerClass} mx-auto py-8 px-4 space-y-8 transition-all duration-300`}>
      <WizardProgress
        currentStep={state.currentStep}
        totalSteps={7}
        stepLabels={stepLabels}
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
