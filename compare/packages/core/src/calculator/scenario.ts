/**
 * @bandinghidup/core — Canonical Scenario Model & Orchestrator
 *
 * ScenarioInput = everything the user enters in the 7-step wizard
 * ScenarioResult = computed outputs (net income, expenses, balance, diagnostics)
 *
 * computeScenario() orchestrates all sub-calculators and returns a full result.
 *
 * STRICT RULE: Monthly cash flow NEVER includes one-time relocation costs.
 */

import {
  calculateAusbildungNet,
  calculateJapaneseTraineeNet,
  calculateGenericNet,
  type TrainingYear,
  type JapaneseTraineeDeductions,
} from "./income.js";
import {
  calculateMonthlyHousing,
  calculateUpfrontRelocation,
  getDefaultRelocationPreset,
  type HousingType,
  type CountryCode,
  type RelocationInput,
} from "./housing.js";
import {
  buildExpenseBasket,
  type LifestyleProfile,
  type BasketOverrides,
  type ExpenseBasketResult,
} from "./baskets.js";
import {
  evaluateDiagnostics,
  getOverallSeverity,
  type DiagnosticResult,
  type DiagnosticLevel,
} from "./diagnostics.js";
import {
  calculateBigMacIndex,
  type BigMacIndexResult,
} from "./bigmac.js";
import type { PathwayCode } from "../types/supabase.js";

// ─── Scenario Input ───────────────────────────────────────────────────────────

export interface ScenarioInput {
  /** Unique ID for storage */
  id: string;
  createdAt: string; // ISO timestamp

  // Step 1: Destination
  country: CountryCode;
  cityId: string;
  cityName: string;

  // Step 2: Pathway
  pathway: PathwayCode;

  // Step 3: Income
  grossMonthlyMinorUnits: bigint;
  /** Ausbildung: 1, 2, or 3 */
  ausbildungTrainingYear?: TrainingYear | undefined;
  /** JP Trainee: itemized contract deductions */
  japaneseDeductions?: JapaneseTraineeDeductions | undefined;
  /** Generic/Student/Custom: flat deduction rate override */
  customDeductionRate?: number | undefined;
  /** If user enters net directly, skip calculation */
  manualNetMonthlyMinorUnits?: bigint | undefined;

  // Step 4: Housing
  housingType: HousingType;
  monthlyRentMinorUnits: bigint;
  isEmployerProvidedHousing: boolean;
  relocationInput?: Partial<RelocationInput> | undefined;
  availableSavingsMinorUnits: bigint;

  // Step 5: Lifestyle
  lifestyleProfile: LifestyleProfile;
  basketOverrides?: BasketOverrides | undefined;

  // Meta
  /** Optional label for comparison display */
  scenarioLabel?: string | undefined;
  /** Language for diagnostics display ('id', 'en', 'ja') */
  locale?: "id" | "en" | "ja" | undefined;
}

// ─── Scenario Result ──────────────────────────────────────────────────────────

export interface IncomeBreakdown {
  grossMonthly: bigint;
  totalDeductions: bigint;
  netMonthly: bigint;
  effectiveDeductionRate: number;
}

export interface MonthlyExpenseBreakdown {
  housingRent: bigint;
  food: bigint;
  transport: bigint;
  utilities: bigint;
  lifestyle: bigint;
  total: bigint;
}

export interface ScenarioResult {
  input: ScenarioInput;

  // ── MONTHLY CASH FLOW (never includes relocation) ─────────────────────────
  income: IncomeBreakdown;
  monthlyExpenses: MonthlyExpenseBreakdown;
  monthlyBalance: bigint;           // netMonthly - totalMonthlyExpenses
  expenseBasket: ExpenseBasketResult;

  // ── UPFRONT RELOCATION (strictly separated) ───────────────────────────────
  upfrontRelocationTotal: bigint;
  upfrontDepositAmount: bigint;
  upfrontKeyMoneyAmount: bigint;
  upfrontAgencyFeeAmount: bigint;
  upfrontSetupCushionAmount: bigint;
  upfrontTravelAmount: bigint;
  upfrontFormula: string;

  // ── RISK DIAGNOSTICS ─────────────────────────────────────────────────────
  diagnostics: DiagnosticResult[];
  overallSeverity: DiagnosticLevel;

  // ── PURCHASING POWER PARITY ──────────────────────────────────────────────
  bigMacIndex: BigMacIndexResult;

  // ── META ─────────────────────────────────────────────────────────────────
  computedAt: string;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Compute a complete scenario result from wizard inputs.
 * This is the single entry point for the calculation engine.
 */
export function computeScenario(input: ScenarioInput): ScenarioResult {
  // ── 1. Income ──────────────────────────────────────────────────────────────
  let incomeResult: IncomeBreakdown;
  let hasZeroDeductionsJPTrainee = false;

  if (input.pathway === "ausbildung") {
    const res = calculateAusbildungNet(
      input.grossMonthlyMinorUnits,
      input.ausbildungTrainingYear ?? 1,
      input.manualNetMonthlyMinorUnits
    );
    incomeResult = {
      grossMonthly: res.grossMonthly,
      totalDeductions: res.totalDeductions,
      netMonthly: res.netMonthly,
      effectiveDeductionRate: res.effectiveDeductionRate,
    };
  } else if (input.pathway === "technical_intern") {
    const deductions: JapaneseTraineeDeductions = input.japaneseDeductions ?? {
      housingDeduction: 0n,
      utilitiesDeduction: 0n,
      shakaiHokenDeduction: 0n,
      employmentInsurance: 0n,
      mealsDeduction: 0n,
      otherDeductions: 0n,
    };
    const totalDeductions =
      deductions.housingDeduction +
      deductions.utilitiesDeduction +
      deductions.shakaiHokenDeduction +
      deductions.employmentInsurance +
      deductions.mealsDeduction +
      deductions.otherDeductions;
    const gross = input.grossMonthlyMinorUnits > 0n
      ? input.grossMonthlyMinorUnits
      : (input.manualNetMonthlyMinorUnits && input.manualNetMonthlyMinorUnits > 0n
          ? input.manualNetMonthlyMinorUnits + totalDeductions
          : 0n);
    const res = calculateJapaneseTraineeNet(
      gross,
      deductions,
      input.manualNetMonthlyMinorUnits
    );
    hasZeroDeductionsJPTrainee = res.hasMissingDeductions;
    incomeResult = {
      grossMonthly: res.grossMonthly,
      totalDeductions: res.totalContractDeductions,
      netMonthly: res.netMonthly,
      effectiveDeductionRate: res.effectiveDeductionRate,
    };
  } else {
    // Student, fresh_grad, custom
    const res = calculateGenericNet(
      input.grossMonthlyMinorUnits,
      input.customDeductionRate ?? 0.20,
      input.manualNetMonthlyMinorUnits
    );
    incomeResult = {
      grossMonthly: res.grossMonthly,
      totalDeductions: res.deductions,
      netMonthly: res.netMonthly,
      effectiveDeductionRate: res.effectiveDeductionRate,
    };
  }

  // ── 2. Housing (monthly) ──────────────────────────────────────────────────
  const housingResult = calculateMonthlyHousing({
    type: input.housingType,
    monthlyRentMinorUnits: input.monthlyRentMinorUnits,
    isEmployerProvided: input.isEmployerProvidedHousing,
    country: input.country,
  });

  // ── 3. Expense Basket ─────────────────────────────────────────────────────
  const basket = buildExpenseBasket(
    input.country,
    input.lifestyleProfile,
    input.basketOverrides ?? {}
  );

  // ── 4. Monthly Expense Summary ────────────────────────────────────────────
  const monthlyExpenses: MonthlyExpenseBreakdown = {
    housingRent: housingResult.netMonthlyCashOut,
    food: basket.monthlyFoodTotal,
    transport: basket.monthlyTransportTotal,
    utilities: basket.monthlyUtilitiesTotal,
    lifestyle: basket.monthlyLifestyleTotal,
    total:
      housingResult.netMonthlyCashOut +
      basket.monthlyGrandTotal,
  };

  // ── 5. Monthly Balance (STRICT: no relocation costs here) ─────────────────
  const monthlyBalance = incomeResult.netMonthly - monthlyExpenses.total;

  // ── 6. Upfront Relocation ─────────────────────────────────────────────────
  const defaultRelocation = getDefaultRelocationPreset(
    input.country,
    input.monthlyRentMinorUnits
  );

  const relocationInput: RelocationInput = {
    country: input.country,
    monthlyRentMinorUnits: input.monthlyRentMinorUnits,
    depositMonths: input.relocationInput?.depositMonths ?? defaultRelocation.depositMonths,
    keyMoneyMonths: input.relocationInput?.keyMoneyMonths ?? defaultRelocation.keyMoneyMonths,
    agencyFeeMinorUnits: input.relocationInput?.agencyFeeMinorUnits ?? defaultRelocation.agencyFeeMinorUnits,
    setupCushionMinorUnits: input.relocationInput?.setupCushionMinorUnits ?? defaultRelocation.setupCushionMinorUnits,
    initialTravelMinorUnits: input.relocationInput?.initialTravelMinorUnits ?? defaultRelocation.initialTravelMinorUnits,
  };

  const upfrontResult = calculateUpfrontRelocation(relocationInput);

  // ── 7. Diagnostics ────────────────────────────────────────────────────────
  const diagnostics = evaluateDiagnostics({
    netMonthlyIncome: incomeResult.netMonthly,
    totalMonthlyExpenses: monthlyExpenses.total,
    monthlyHousingCost: housingResult.netMonthlyCashOut,
    totalUpfrontRelocationCost: upfrontResult.totalUpfront,
    availableSavings: input.availableSavingsMinorUnits,
    hasZeroDeductionsJPTrainee,
    pathway: input.pathway,
    locale: input.locale ?? "id",
  });

  return {
    input,
    income: incomeResult,
    monthlyExpenses,
    monthlyBalance,
    expenseBasket: basket,
    upfrontRelocationTotal: upfrontResult.totalUpfront,
    upfrontDepositAmount: upfrontResult.deposit,
    upfrontKeyMoneyAmount: upfrontResult.keyMoney,
    upfrontAgencyFeeAmount: upfrontResult.agencyFee,
    upfrontSetupCushionAmount: upfrontResult.setupCushion,
    upfrontTravelAmount: upfrontResult.initialTravel,
    upfrontFormula: upfrontResult.formula,
    diagnostics,
    overallSeverity: getOverallSeverity(diagnostics),
    bigMacIndex: calculateBigMacIndex({
      country: input.country,
      monthlyRentMinorUnits: housingResult.monthlyRent,
      grossMonthlyMinorUnits: incomeResult.grossMonthly,
      netMonthlyMinorUnits: incomeResult.netMonthly,
      monthlyBalanceMinorUnits: monthlyBalance,
    }),
    computedAt: new Date().toISOString(),
  };
}
