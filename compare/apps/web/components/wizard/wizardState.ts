/**
 * Wizard State Management
 * Uses useReducer for predictable state transitions.
 * All monetary values stored as bigint minor units.
 */

import {
  AUSBILDUNG_REFERENCE_GROSS,
  type CountryCode,
  type PathwayCode,
  type HousingType,
  type LifestyleProfile,
  type TrainingYear,
  type JapaneseTraineeDeductions,
  type BasketOverrides,
} from "@bandinghidup/core";

// ─── State ────────────────────────────────────────────────────────────────────

export interface WizardState {
  currentStep: number;  // 1–7

  // City #1: Reference (Kota Acuan)
  refCountry: CountryCode;
  refCityId: string;
  refCityName: string;

  // City #2: Destination / Comparison (Kota Tujuan Pembanding)
  country: CountryCode | null;
  cityId: string;
  cityName: string;

  // Step 2: Pathway
  pathway: PathwayCode | null;

  // Step 3: Income
  grossMonthlyMinorUnits: bigint;
  ausbildungTrainingYear: TrainingYear;
  japaneseDeductions: JapaneseTraineeDeductions;
  customDeductionRate: number;
  useManualNet: boolean;
  manualNetMonthlyMinorUnits: bigint;

  // Step 4: Housing
  housingType: HousingType;
  monthlyRentMinorUnits: bigint;
  isEmployerProvidedHousing: boolean;
  depositMonths: number;
  keyMoneyMonths: number;
  agencyFeeMinorUnits: bigint;
  setupCushionMinorUnits: bigint;
  initialTravelMinorUnits: bigint;
  availableSavingsMinorUnits: bigint;

  // Step 5: Lifestyle
  lifestyleProfile: LifestyleProfile;

  // Step 6: Overrides
  basketOverrides: BasketOverrides;
}

export const DEFAULT_JP_DEDUCTIONS: JapaneseTraineeDeductions = {
  housingDeduction: 0n,
  utilitiesDeduction: 0n,
  shakaiHokenDeduction: 0n,
  employmentInsurance: 0n,
  mealsDeduction: 0n,
  otherDeductions: 0n,
};

export const INITIAL_STATE: WizardState = {
  currentStep: 1,
  refCountry: "ID",
  refCityId: "",
  refCityName: "Jakarta",
  country: "DE",
  cityId: "",
  cityName: "Berlin",
  pathway: null,
  grossMonthlyMinorUnits: 0n,
  ausbildungTrainingYear: 1,
  japaneseDeductions: DEFAULT_JP_DEDUCTIONS,
  customDeductionRate: 0.20,
  useManualNet: false,
  manualNetMonthlyMinorUnits: 0n,
  housingType: "shared_room",
  monthlyRentMinorUnits: 0n,
  isEmployerProvidedHousing: false,
  depositMonths: 2,
  keyMoneyMonths: 0,
  agencyFeeMinorUnits: 0n,
  setupCushionMinorUnits: 50000n,
  initialTravelMinorUnits: 150000n,
  availableSavingsMinorUnits: 0n,
  lifestyleProfile: "realistic_newcomer",
  basketOverrides: {},
};

// ─── Actions ──────────────────────────────────────────────────────────────────

export type WizardAction =
  | { type: "SET_STEP"; step: number }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_REF_LOCATION"; country: CountryCode; cityId: string; cityName: string }
  | { type: "SET_COUNTRY"; country: CountryCode; defaultDepositMonths: number; defaultKeyMoney: number }
  | { type: "SET_CITY"; cityId: string; cityName: string }
  | { type: "SET_PATHWAY"; pathway: PathwayCode }
  | { type: "SET_GROSS"; amount: bigint }
  | { type: "SET_TRAINING_YEAR"; year: TrainingYear }
  | { type: "SET_JP_DEDUCTION"; field: keyof JapaneseTraineeDeductions; value: bigint }
  | { type: "SET_CUSTOM_DEDUCTION_RATE"; rate: number }
  | { type: "SET_USE_MANUAL_NET"; value: boolean }
  | { type: "SET_MANUAL_NET"; amount: bigint }
  | { type: "SET_HOUSING_TYPE"; housingType: HousingType }
  | { type: "SET_MONTHLY_RENT"; amount: bigint }
  | { type: "SET_EMPLOYER_PROVIDED"; value: boolean }
  | { type: "SET_DEPOSIT_MONTHS"; months: number }
  | { type: "SET_KEY_MONEY_MONTHS"; months: number }
  | { type: "SET_AGENCY_FEE"; amount: bigint }
  | { type: "SET_SETUP_CUSHION"; amount: bigint }
  | { type: "SET_INITIAL_TRAVEL"; amount: bigint }
  | { type: "SET_SAVINGS"; amount: bigint }
  | { type: "SET_LIFESTYLE"; profile: LifestyleProfile }
  | { type: "SET_BASKET_OVERRIDE"; key: keyof BasketOverrides; unitCost?: bigint; frequency?: number }
  | { type: "RESET" };

// ─── Reducer ──────────────────────────────────────────────────────────────────

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, currentStep: Math.max(1, Math.min(7, action.step)) };
    case "NEXT_STEP":
      return { ...state, currentStep: Math.min(7, state.currentStep + 1) };
    case "PREV_STEP":
      return { ...state, currentStep: Math.max(1, state.currentStep - 1) };

    case "SET_REF_LOCATION":
      return {
        ...state,
        refCountry: action.country,
        refCityId: action.cityId,
        refCityName: action.cityName,
      };

    case "SET_COUNTRY":
      return {
        ...state,
        country: action.country,
        cityId: "",
        cityName: "",
        pathway: null,
        grossMonthlyMinorUnits: 0n,
        depositMonths: action.defaultDepositMonths,
        keyMoneyMonths: action.defaultKeyMoney,
      };
    case "SET_CITY":
      return { ...state, cityId: action.cityId, cityName: action.cityName };
    case "SET_PATHWAY": {
      let defaultGross = state.grossMonthlyMinorUnits;
      if (defaultGross === 0n) {
        if (action.pathway === "technical_intern") {
          defaultGross = 180000n; // Standard national average gakumen for technical interns
        } else if (action.pathway === "ausbildung") {
          defaultGross = AUSBILDUNG_REFERENCE_GROSS[state.ausbildungTrainingYear];
        }
      }
      return { ...state, pathway: action.pathway, grossMonthlyMinorUnits: defaultGross };
    }

    case "SET_GROSS":
      return { ...state, grossMonthlyMinorUnits: action.amount };
    case "SET_TRAINING_YEAR":
      return { ...state, ausbildungTrainingYear: action.year };
    case "SET_JP_DEDUCTION":
      return {
        ...state,
        japaneseDeductions: { ...state.japaneseDeductions, [action.field]: action.value },
      };
    case "SET_CUSTOM_DEDUCTION_RATE":
      return { ...state, customDeductionRate: action.rate };
    case "SET_USE_MANUAL_NET":
      return { ...state, useManualNet: action.value };
    case "SET_MANUAL_NET":
      return { ...state, manualNetMonthlyMinorUnits: action.amount };

    case "SET_HOUSING_TYPE":
      return { ...state, housingType: action.housingType };
    case "SET_MONTHLY_RENT":
      return { ...state, monthlyRentMinorUnits: action.amount };
    case "SET_EMPLOYER_PROVIDED":
      return { ...state, isEmployerProvidedHousing: action.value };
    case "SET_DEPOSIT_MONTHS":
      return { ...state, depositMonths: action.months };
    case "SET_KEY_MONEY_MONTHS":
      return { ...state, keyMoneyMonths: action.months };
    case "SET_AGENCY_FEE":
      return { ...state, agencyFeeMinorUnits: action.amount };
    case "SET_SETUP_CUSHION":
      return { ...state, setupCushionMinorUnits: action.amount };
    case "SET_INITIAL_TRAVEL":
      return { ...state, initialTravelMinorUnits: action.amount };
    case "SET_SAVINGS":
      return { ...state, availableSavingsMinorUnits: action.amount };

    case "SET_LIFESTYLE":
      return { ...state, lifestyleProfile: action.profile };

    case "SET_BASKET_OVERRIDE":
      return {
        ...state,
        basketOverrides: {
          ...state.basketOverrides,
          [action.key]: {
            ...(state.basketOverrides[action.key] ?? {}),
            ...(action.unitCost !== undefined ? { unitCost: action.unitCost } : {}),
            ...(action.frequency !== undefined ? { frequency: action.frequency } : {}),
          },
        },
      };

    case "RESET":
      return INITIAL_STATE;

    default:
      return state;
  }
}
