/**
 * @bandinghidup/core — Income & Deduction Engine
 *
 * Calculates gross-to-net pay for Ausbildung (Germany),
 * Japanese Technical Intern/Kenshusei, and generic pathways.
 *
 * All values are in MINOR UNITS (bigint):
 *   EUR → cents  (e.g., €1200 = 120000n)
 *   JPY → yen    (e.g., ¥180000 = 180000n)
 *   IDR → rupiah (e.g., Rp5000000 = 5000000n)
 */

import Decimal from "decimal.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrainingYear = 1 | 2 | 3;

export interface AusbildungIncomeResult {
  grossMonthly: bigint;          // EUR cents
  socialSecurityDeduction: bigint;
  incomeTaxDeduction: bigint;
  totalDeductions: bigint;
  netMonthly: bigint;
  effectiveDeductionRate: number; // 0–1
  /** Reference: 2026 financial-sufficiency benchmark for Germany */
  germanSufficiencyBenchmarkNet: bigint; // EUR cents (currently ~€959/month)
}

export interface JapaneseTraineeDeductions {
  housingDeduction: bigint;       // JPY yen — employer-provided housing deduction
  utilitiesDeduction: bigint;     // JPY yen
  shakaiHokenDeduction: bigint;   // JPY yen — shakai hoken (social insurance)
  employmentInsurance: bigint;    // JPY yen — koyo hoken
  mealsDeduction: bigint;         // JPY yen — if meals provided
  otherDeductions: bigint;        // JPY yen — misc employer deductions
}

export interface JapaneseTraineeIncomeResult {
  grossMonthly: bigint;           // JPY yen (gakumen — 額面)
  totalContractDeductions: bigint;// JPY yen (all employer deductions)
  netMonthly: bigint;             // JPY yen (tedori — 手取り)
  deductionBreakdown: JapaneseTraineeDeductions;
  hasMissingDeductions: boolean;  // true if all deductions are 0
  effectiveDeductionRate: number;
}

export interface GenericIncomeResult {
  grossMonthly: bigint;
  deductions: bigint;
  netMonthly: bigint;
  effectiveDeductionRate: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Germany: Approximate combined employee social security contribution rates (2026).
 * Source: Bundesministerium für Gesundheit, Bundesagentur für Arbeit
 *
 * Pension insurance (Rentenversicherung):       9.3%
 * Health insurance (Krankenversicherung):       7.3% (statutory avg)
 * Long-term care insurance (Pflegeversicherung):1.7%
 * Unemployment insurance (Arbeitslosenvers.):   1.3%
 * ─────────────────────────────────────────────────
 * Total employee social security:              ~19.6%
 * Note: Ausbildung trainees often have low income → minimal income tax
 */
const AUSBILDUNG_SOCIAL_SECURITY_RATE = new Decimal("0.196"); // 19.6%
const AUSBILDUNG_INCOME_TAX_RATE = new Decimal("0.02");       // ~2% (very low for trainees)

/**
 * 2026 German financial-sufficiency benchmark for visa/residence:
 * ~€959/month net (Bedarfsbetrag for BAföG reference)
 * Stored as EUR cents.
 */
export const GERMANY_SUFFICIENCY_BENCHMARK_CENTS = 95900n; // €959.00

/**
 * Reference gross Ausbildung stipends by training year (industry average, 2026).
 * Source: Bundesinstitut für Berufsbildung (BIBB) — Datenreport 2025
 * All in EUR cents.
 */
export const AUSBILDUNG_REFERENCE_GROSS: Record<TrainingYear, bigint> = {
  1: 95000n,  // €950/month (Year 1 national average)
  2: 100000n, // €1000/month (Year 2)
  3: 110000n, // €1100/month (Year 3)
};

// ─── Ausbildung (Germany) ─────────────────────────────────────────────────────

/**
 * Calculate net income for an Ausbildung (German vocational trainee).
 *
 * @param grossMonthlyCents - Gross monthly stipend in EUR cents (bigint)
 * @param trainingYear - 1, 2, or 3
 * @param manualNetOverrideCents - Optional: directly enter net pay (skips calculation)
 */
export function calculateAusbildungNet(
  grossMonthlyCents: bigint,
  trainingYear: TrainingYear,
  manualNetOverrideCents?: bigint
): AusbildungIncomeResult {
  if (grossMonthlyCents < 0n) {
    throw new RangeError("Gross income cannot be negative");
  }

  // If user directly enters net pay, bypass calculation
  if (manualNetOverrideCents !== undefined) {
    const totalDeductions = grossMonthlyCents - manualNetOverrideCents;
    const effectiveRate = grossMonthlyCents === 0n
      ? 0
      : new Decimal(totalDeductions.toString())
          .div(grossMonthlyCents.toString())
          .toNumber();

    return {
      grossMonthly: grossMonthlyCents,
      socialSecurityDeduction: totalDeductions,
      incomeTaxDeduction: 0n,
      totalDeductions,
      netMonthly: manualNetOverrideCents,
      effectiveDeductionRate: effectiveRate,
      germanSufficiencyBenchmarkNet: GERMANY_SUFFICIENCY_BENCHMARK_CENTS,
    };
  }

  // Computed path
  const gross = new Decimal(grossMonthlyCents.toString());

  // Social security deductions (~19.6%)
  const socialSecurity = gross
    .mul(AUSBILDUNG_SOCIAL_SECURITY_RATE)
    .toFixed(0, Decimal.ROUND_HALF_UP);

  // Income tax (very low for most Ausbildung trainees, ~2%)
  const incomeTax = gross
    .mul(AUSBILDUNG_INCOME_TAX_RATE)
    .toFixed(0, Decimal.ROUND_HALF_UP);

  const socialSecurityBigint = BigInt(socialSecurity);
  const incomeTaxBigint = BigInt(incomeTax);
  const totalDeductions = socialSecurityBigint + incomeTaxBigint;
  const netMonthly = grossMonthlyCents - totalDeductions;

  const effectiveDeductionRate = grossMonthlyCents === 0n
    ? 0
    : new Decimal(totalDeductions.toString())
        .div(grossMonthlyCents.toString())
        .toNumber();

  return {
    grossMonthly: grossMonthlyCents,
    socialSecurityDeduction: socialSecurityBigint,
    incomeTaxDeduction: incomeTaxBigint,
    totalDeductions,
    netMonthly: netMonthly < 0n ? 0n : netMonthly,
    effectiveDeductionRate,
    germanSufficiencyBenchmarkNet: GERMANY_SUFFICIENCY_BENCHMARK_CENTS,
  };
}

// ─── Japanese Technical Intern / Kenshusei ────────────────────────────────────

/**
 * Calculate net income (手取り / Tedori) for a Japanese Technical Intern/Trainee.
 *
 * Employer contract deductions are itemized and subtracted from gross.
 * If ALL deductions are 0, hasMissingDeductions = true → Amber warning.
 *
 * @param grossMonthlyYen - Gross monthly wage in JPY yen (bigint) — 額面 (gakumen)
 * @param deductions - Per-category employer contract deductions in JPY yen
 */
export function calculateJapaneseTraineeNet(
  grossMonthlyYen: bigint,
  deductions: JapaneseTraineeDeductions,
  manualNetOverride?: bigint
): JapaneseTraineeIncomeResult {
  if (grossMonthlyYen < 0n) {
    throw new RangeError("Gross income cannot be negative");
  }

  const {
    housingDeduction,
    utilitiesDeduction,
    shakaiHokenDeduction,
    employmentInsurance,
    mealsDeduction,
    otherDeductions,
  } = deductions;

  const totalContractDeductions =
    housingDeduction +
    utilitiesDeduction +
    shakaiHokenDeduction +
    employmentInsurance +
    mealsDeduction +
    otherDeductions;

  const computedNet = grossMonthlyYen - totalContractDeductions;
  const netMonthly = manualNetOverride !== undefined && manualNetOverride > 0n
    ? manualNetOverride
    : (computedNet < 0n ? 0n : computedNet);

  const hasMissingDeductions = totalContractDeductions === 0n && (manualNetOverride === undefined || manualNetOverride === 0n);

  const effectiveDeductions = grossMonthlyYen > netMonthly ? grossMonthlyYen - netMonthly : totalContractDeductions;
  const effectiveDeductionRate =
    grossMonthlyYen === 0n
      ? 0
      : new Decimal(effectiveDeductions.toString())
          .div(grossMonthlyYen.toString())
          .toNumber();

  return {
    grossMonthly: grossMonthlyYen,
    totalContractDeductions,
    netMonthly,
    deductionBreakdown: deductions,
    hasMissingDeductions,
    effectiveDeductionRate,
  };
}

// ─── Generic / Student / Fresh Graduate ──────────────────────────────────────

/**
 * Generic gross-to-net calculation for Student, Fresh Graduate, or Custom pathway.
 * Uses a flat deduction rate (default 20%) or accepts direct net input.
 *
 * @param grossMinorUnits - Gross income in currency minor units (bigint)
 * @param deductionRate - Fraction to deduct (e.g., 0.20 = 20%). Default: 0.20
 * @param manualNetOverride - Optional: use this exact net value instead of computing
 */
export function calculateGenericNet(
  grossMinorUnits: bigint,
  deductionRate: number = 0.20,
  manualNetOverride?: bigint
): GenericIncomeResult {
  if (grossMinorUnits < 0n) {
    throw new RangeError("Gross income cannot be negative");
  }
  if (deductionRate < 0 || deductionRate >= 1) {
    throw new RangeError("Deduction rate must be between 0 and 1 (exclusive)");
  }

  if (manualNetOverride !== undefined) {
    const deductions = grossMinorUnits - manualNetOverride;
    const effectiveRate =
      grossMinorUnits === 0n
        ? 0
        : new Decimal(deductions.toString())
            .div(grossMinorUnits.toString())
            .toNumber();

    return {
      grossMonthly: grossMinorUnits,
      deductions: deductions < 0n ? 0n : deductions,
      netMonthly: manualNetOverride,
      effectiveDeductionRate: effectiveRate,
    };
  }

  const gross = new Decimal(grossMinorUnits.toString());
  const deductionAmount = gross
    .mul(new Decimal(deductionRate.toString()))
    .toFixed(0, Decimal.ROUND_HALF_UP);

  const deductions = BigInt(deductionAmount);
  const netMonthly = grossMinorUnits - deductions;

  return {
    grossMonthly: grossMinorUnits,
    deductions,
    netMonthly: netMonthly < 0n ? 0n : netMonthly,
    effectiveDeductionRate: deductionRate,
  };
}
