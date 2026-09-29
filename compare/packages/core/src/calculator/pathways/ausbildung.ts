/**
 * @bandinghidup/core — Advanced Ausbildung Domain Engine
 *
 * Detailed Germany Ausbildung stipend progression (Years 1-3),
 * statutory social security employee share (~19.6%), and
 * Grundfreibetrag (€12,348/yr, 2026) annual tax exemption logic.
 */

import Decimal from "decimal.js";
import { GERMANY_SUFFICIENCY_BENCHMARK_CENTS, type TrainingYear } from "../income.js";

/** German Grundfreibetrag 2026 (annual tax-free allowance) in cents: €12,348 (BMF 2026; 2024 was €11,784) */
export const DE_GRUNDFREIBETRAG_ANNUAL_CENTS = 1234800n; // €12,348.00

/** Monthly tax-free threshold: €1,029.00 / month (€12,348/12, 2026) */
export const DE_GRUNDFREIBETRAG_MONTHLY_CENTS = 102900n; // €1,029.00

export interface AusbildungDetailedResult {
  trainingYear: TrainingYear;
  grossMonthly: bigint;
  socialSecurityDeduction: bigint;
  incomeTaxDeduction: bigint;
  totalDeductions: bigint;
  netMonthly: bigint;
  effectiveDeductionRate: number;
  isTaxExempt: boolean;
  sufficiencyGap: bigint; // 0 if net >= €959/mo, otherwise required surplus needed
}

export function calculateAusbildungDetailed(
  grossMonthlyCents: bigint,
  trainingYear: TrainingYear = 1
): AusbildungDetailedResult {
  const gross = new Decimal(grossMonthlyCents.toString());

  // 1. Social security (19.6%)
  const ssAmount = gross.mul("0.196").toFixed(0, Decimal.ROUND_HALF_UP);
  const socialSecurityDeduction = BigInt(ssAmount);

  // 2. Income tax (only if gross > monthly Grundfreibetrag €982)
  let incomeTaxDeduction = 0n;
  let isTaxExempt = true;

  if (grossMonthlyCents > DE_GRUNDFREIBETRAG_MONTHLY_CENTS) {
    isTaxExempt = false;
    const taxableGross = gross.sub(new Decimal(DE_GRUNDFREIBETRAG_MONTHLY_CENTS.toString()));
    const taxAmount = taxableGross.mul("0.14").toFixed(0, Decimal.ROUND_HALF_UP); // 14% entry tax rate
    incomeTaxDeduction = BigInt(taxAmount);
  }

  const totalDeductions = socialSecurityDeduction + incomeTaxDeduction;
  const netMonthly = grossMonthlyCents > totalDeductions ? grossMonthlyCents - totalDeductions : 0n;

  const effectiveDeductionRate = grossMonthlyCents === 0n
    ? 0
    : new Decimal(totalDeductions.toString()).div(grossMonthlyCents.toString()).toNumber();

  const sufficiencyGap = netMonthly >= GERMANY_SUFFICIENCY_BENCHMARK_CENTS
    ? 0n
    : GERMANY_SUFFICIENCY_BENCHMARK_CENTS - netMonthly;

  return {
    trainingYear,
    grossMonthly: grossMonthlyCents,
    socialSecurityDeduction,
    incomeTaxDeduction,
    totalDeductions,
    netMonthly,
    effectiveDeductionRate,
    isTaxExempt,
    sufficiencyGap,
  };
}
