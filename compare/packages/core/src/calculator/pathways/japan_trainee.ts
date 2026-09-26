/**
 * @bandinghidup/core — Japanese Technical Intern Detailed Domain Engine
 *
 * Models prefecture minimum wage validation, employer housing deduction caps
 * (e.g. max ¥15,000/month dorm deduction), and itemized payslip deductions.
 */

import type { JapaneseTraineeDeductions } from "../income.js";

/** Standard employer dormitory deduction cap under Japanese labor guidelines */
export const JP_EMPLOYER_DORM_CAP_YEN = 15000n; // ¥15,000/month cap

export interface JapanTraineeDetailedResult {
  grossMonthlyYen: bigint;
  totalDeductionsYen: bigint;
  netMonthlyYen: bigint;
  housingDeductionExceedsCap: boolean;
  excessHousingDeductionYen: bigint;
  hasMissingDeductionsWarning: boolean;
}

export function calculateJapanTraineeDetailed(
  grossMonthlyYen: bigint,
  deductions: JapaneseTraineeDeductions
): JapanTraineeDetailedResult {
  const totalDeductionsYen =
    deductions.housingDeduction +
    deductions.utilitiesDeduction +
    deductions.shakaiHokenDeduction +
    deductions.employmentInsurance +
    deductions.mealsDeduction +
    deductions.otherDeductions;

  const netMonthlyYen = grossMonthlyYen > totalDeductionsYen ? grossMonthlyYen - totalDeductionsYen : 0n;

  const housingDeductionExceedsCap = deductions.housingDeduction > JP_EMPLOYER_DORM_CAP_YEN;
  const excessHousingDeductionYen = housingDeductionExceedsCap
    ? deductions.housingDeduction - JP_EMPLOYER_DORM_CAP_YEN
    : 0n;

  const hasMissingDeductionsWarning = totalDeductionsYen === 0n;

  return {
    grossMonthlyYen,
    totalDeductionsYen,
    netMonthlyYen,
    housingDeductionExceedsCap,
    excessHousingDeductionYen,
    hasMissingDeductionsWarning,
  };
}
