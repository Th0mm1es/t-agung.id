/**
 * @bandinghidup/core — Active Multi-Country Tax & Deduction Engine
 *
 * Implements active, real-time statutory payroll deductions for Germany (DE),
 * Japan (JP), and Indonesia (ID) factoring in income brackets, family structure
 * (single, married, children), and country-specific tax rules.
 */

import Decimal from "decimal.js";
import type { CountryCode } from "./housing.js";

export type FamilyStatus = "single" | "married" | "married_children";

export interface ActiveDeductionInput {
  country: CountryCode;
  grossMonthlyMinorUnits: bigint;
  familyStatus?: FamilyStatus | undefined;
  numChildren?: number | undefined;
  /** Germany: Steuerklasse 1 (single), 3 (married sole earner), 4 (married equal) */
  taxClassDE?: (1 | 3 | 4 | 5) | undefined;
  /** Germany: Church tax (Kirchensteuer 8-9%) */
  churchTaxDE?: boolean | undefined;
  /** Japan: Year 2+ Resident Tax (Juminzei ~10%) applies? */
  isJapanSecondYear?: boolean | undefined;
  /** Indonesia: PTKP status */
  ptkpStatusID?: ("TK/0" | "K/0" | "K/1" | "K/2" | "K/3") | undefined;
}

export interface ItemizedDeductionEntry {
  key: string;
  nameId: string;
  nameEn: string;
  amountMinorUnits: bigint;
  amountMajor: number;
  ratePercentage: number;
  category: "tax" | "social_security" | "other";
}

export interface ActiveDeductionResult {
  country: CountryCode;
  grossMonthlyMinorUnits: bigint;
  grossMonthlyMajor: number;
  totalDeductionsMinorUnits: bigint;
  totalDeductionsMajor: number;
  netMonthlyMinorUnits: bigint;
  netMonthlyMajor: number;
  effectiveDeductionRate: number; // 0 - 1
  itemizedDeductions: ItemizedDeductionEntry[];
  summaryNoteId: string;
  summaryNoteEn: string;
}

/**
 * Calculate active statutory deductions for Germany (DE).
 * EUR: 2 decimals (cents).
 */
function calculateGermanyDeductions(input: ActiveDeductionInput): ActiveDeductionResult {
  const grossCents = input.grossMonthlyMinorUnits;
  const grossMajor = Number(grossCents) / 100;
  const taxClass = input.taxClassDE ?? (input.familyStatus === "married" || input.familyStatus === "married_children" ? 3 : 1);
  const numChildren = input.numChildren ?? (input.familyStatus === "married_children" ? 1 : 0);
  const hasChurchTax = !!input.churchTaxDE;

  if (grossCents <= 0n) {
    return {
      country: "DE",
      grossMonthlyMinorUnits: 0n,
      grossMonthlyMajor: 0,
      totalDeductionsMinorUnits: 0n,
      totalDeductionsMajor: 0,
      netMonthlyMinorUnits: 0n,
      netMonthlyMajor: 0,
      effectiveDeductionRate: 0,
      itemizedDeductions: [],
      summaryNoteId: "Tidak ada potongan untuk penghasilan nihil.",
      summaryNoteEn: "No deductions for zero income.",
    };
  }

  // 1. Social Security (Sozialversicherung)
  // Rentenversicherung (RV): 9.3%
  const pensionRate = 0.093;
  const pensionCents = BigInt(Math.round(grossMajor * pensionRate * 100));

  // Krankenversicherung (KV): 7.3% statutory base + 0.8% avg Zusatzbeitrag = 8.1%
  const healthRate = 0.081;
  const healthCents = BigInt(Math.round(grossMajor * healthRate * 100));

  // Arbeitslosenversicherung (AV): 1.3%
  const unemploymentRate = 0.013;
  const unemploymentCents = BigInt(Math.round(grossMajor * unemploymentRate * 100));

  // Pflegeversicherung (PV): 2.3% for childless >= 23yo, 1.7% if 1 child, 1.45% if 2+ children
  const careRate = numChildren >= 2 ? 0.0145 : numChildren === 1 ? 0.017 : 0.023;
  const careCents = BigInt(Math.round(grossMajor * careRate * 100));

  const totalSocialSecurityCents = pensionCents + healthCents + unemploymentCents + careCents;
  const socialSecurityDeductible = (Number(totalSocialSecurityCents) / 100) * 0.85; // ~85% deductible under § 10 EStG

  // 2. Income Tax (Lohnsteuer)
  // Monthly Grundfreibetrag 2026: €982 for Tax Class 1/4; ~€1,964 for Tax Class 3
  const monthlyAllowance = taxClass === 3 ? 1964 : 982;
  const childAllowanceDeduction = numChildren > 0 ? numChildren * 250 : 0; // Tax relief proxy
  const taxableBase = Math.max(0, grossMajor - monthlyAllowance - socialSecurityDeductible - childAllowanceDeduction);

  let taxRate = 0;
  if (taxableBase > 0) {
    if (taxableBase < 1200) {
      taxRate = 0.14 + (taxableBase / 1200) * 0.08; // 14% to 22%
    } else if (taxableBase < 3000) {
      taxRate = 0.22 + (taxableBase / 3000) * 0.14; // 22% to 36%
    } else {
      taxRate = 0.38; // Peak bracket
    }
  }

  const taxMajor = taxableBase * taxRate;
  const taxCents = BigInt(Math.round(taxMajor * 100));

  // Church tax (8% of income tax in Bayern/Baden-Württemberg, 9% in others; avg 8.5%)
  const churchCents = hasChurchTax ? BigInt(Math.round(Number(taxCents) * 0.085)) : 0n;

  const items: ItemizedDeductionEntry[] = [
    {
      key: "pension",
      nameId: "Asuransi Pensiun (Rentenversicherung)",
      nameEn: "Pension Insurance",
      amountMinorUnits: pensionCents,
      amountMajor: Number(pensionCents) / 100,
      ratePercentage: pensionRate * 100,
      category: "social_security",
    },
    {
      key: "health",
      nameId: "Asuransi Kesehatan (Krankenversicherung)",
      nameEn: "Health Insurance (incl. Zusatzbeitrag)",
      amountMinorUnits: healthCents,
      amountMajor: Number(healthCents) / 100,
      ratePercentage: healthRate * 100,
      category: "social_security",
    },
    {
      key: "care",
      nameId: "Asuransi Perawatan (Pflegeversicherung)",
      nameEn: "Long-term Care Insurance",
      amountMinorUnits: careCents,
      amountMajor: Number(careCents) / 100,
      ratePercentage: careRate * 100,
      category: "social_security",
    },
    {
      key: "unemployment",
      nameId: "Asuransi Pengangguran (Arbeitslosenversicherung)",
      nameEn: "Unemployment Insurance",
      amountMinorUnits: unemploymentCents,
      amountMajor: Number(unemploymentCents) / 100,
      ratePercentage: unemploymentRate * 100,
      category: "social_security",
    },
    {
      key: "income_tax",
      nameId: `Pajak Penghasilan (Lohnsteuer - Kelas ${taxClass})`,
      nameEn: `Income Tax (Steuerklasse ${taxClass})`,
      amountMinorUnits: taxCents,
      amountMajor: Number(taxCents) / 100,
      ratePercentage: grossMajor > 0 ? Number(((Number(taxCents) / 100 / grossMajor) * 100).toFixed(1)) : 0,
      category: "tax",
    },
  ];

  if (hasChurchTax && churchCents > 0n) {
    items.push({
      key: "church_tax",
      nameId: "Pajak Gereja (Kirchensteuer)",
      nameEn: "Church Tax (Kirchensteuer)",
      amountMinorUnits: churchCents,
      amountMajor: Number(churchCents) / 100,
      ratePercentage: grossMajor > 0 ? Number(((Number(churchCents) / 100 / grossMajor) * 100).toFixed(1)) : 0,
      category: "tax",
    });
  }

  const totalDeductionsCents = pensionCents + healthCents + careCents + unemploymentCents + taxCents + churchCents;
  const netCents = grossCents > totalDeductionsCents ? grossCents - totalDeductionsCents : 0n;
  const effectiveRate = grossCents > 0n ? Number((new Decimal(totalDeductionsCents.toString()).div(grossCents.toString())).toFixed(4)) : 0;

  return {
    country: "DE",
    grossMonthlyMinorUnits: grossCents,
    grossMonthlyMajor: grossMajor,
    totalDeductionsMinorUnits: totalDeductionsCents,
    totalDeductionsMajor: Number(totalDeductionsCents) / 100,
    netMonthlyMinorUnits: netCents,
    netMonthlyMajor: Number(netCents) / 100,
    effectiveDeductionRate: effectiveRate,
    itemizedDeductions: items,
    summaryNoteId: `Steuerklasse ${taxClass} · Jaminan sosial total ~${(pensionRate + healthRate + careRate + unemploymentRate) * 100}% · Bebas pajak bulanan €${monthlyAllowance}`,
    summaryNoteEn: `Tax Class ${taxClass} · Social security total ~${(pensionRate + healthRate + careRate + unemploymentRate) * 100}% · Monthly tax-free threshold €${monthlyAllowance}`,
  };
}

/**
 * Calculate active statutory deductions for Japan (JP).
 * JPY: 0 decimals (yen).
 */
function calculateJapanDeductions(input: ActiveDeductionInput): ActiveDeductionResult {
  const grossYen = input.grossMonthlyMinorUnits;
  const grossMajor = Number(grossYen);
  const isSecondYear = input.isJapanSecondYear ?? true;
  const numChildren = input.numChildren ?? (input.familyStatus === "married_children" ? 1 : 0);
  const isMarried = input.familyStatus === "married" || input.familyStatus === "married_children";

  if (grossYen <= 0n) {
    return {
      country: "JP",
      grossMonthlyMinorUnits: 0n,
      grossMonthlyMajor: 0,
      totalDeductionsMinorUnits: 0n,
      totalDeductionsMajor: 0,
      netMonthlyMinorUnits: 0n,
      netMonthlyMajor: 0,
      effectiveDeductionRate: 0,
      itemizedDeductions: [],
      summaryNoteId: "Tidak ada potongan untuk penghasilan nihil.",
      summaryNoteEn: "No deductions for zero income.",
    };
  }

  // 1. Shakai Hoken (Social Insurance)
  // Kenko Hoken (Health): ~4.99% (Tokyo standard employee share)
  const healthRate = 0.0499;
  const healthYen = BigInt(Math.round(grossMajor * healthRate));

  // Kosei Nenkin (Pension): 9.15% (employee share)
  const pensionRate = 0.0915;
  const pensionYen = BigInt(Math.round(grossMajor * pensionRate));

  // Koyo Hoken (Employment Insurance): 0.6%
  const empInsuranceRate = 0.006;
  const empInsuranceYen = BigInt(Math.round(grossMajor * empInsuranceRate));

  const totalShakaiHoken = healthYen + pensionYen + empInsuranceYen;

  // 2. Shotokuzei (National Income Tax)
  // Monthly basic deduction ~¥40,000 + employment deduction ~¥45,000 + social insurance deduction
  const dependentRelief = (isMarried ? 31666 : 0) + numChildren * 31666;
  const monthlyExemptions = 85000 + Number(totalShakaiHoken) + dependentRelief;
  const taxableBase = Math.max(0, grossMajor - monthlyExemptions);

  let incomeTaxRate = 0.05;
  if (taxableBase > 275000) incomeTaxRate = 0.20;
  else if (taxableBase > 160000) incomeTaxRate = 0.10;

  const incomeTaxYen = BigInt(Math.round(taxableBase * incomeTaxRate));

  // 3. Juminzei (Resident Tax ~10%)
  // In Year 1, resident tax is 0 because there was no prior year Japanese income.
  // In Year 2+, it is ~10% of prior year's taxable income (~8% of gross after deductions).
  let residentTaxYen = 0n;
  if (isSecondYear) {
    const residentTaxable = Math.max(0, grossMajor - 80000 - Number(totalShakaiHoken) - dependentRelief);
    residentTaxYen = BigInt(Math.round(residentTaxable * 0.10));
  }

  const items: ItemizedDeductionEntry[] = [
    {
      key: "pension",
      nameId: "Pensiun Karyawan (Kosei Nenkin / 厚生年金)",
      nameEn: "Welfare Pension (Kosei Nenkin)",
      amountMinorUnits: pensionYen,
      amountMajor: Number(pensionYen),
      ratePercentage: 9.15,
      category: "social_security",
    },
    {
      key: "health",
      nameId: "Asuransi Kesehatan Sosial (Kenko Hoken / 健康保険)",
      nameEn: "Social Health Insurance",
      amountMinorUnits: healthYen,
      amountMajor: Number(healthYen),
      ratePercentage: 5.0,
      category: "social_security",
    },
    {
      key: "unemployment",
      nameId: "Asuransi Ketenagakerjaan (Koyo Hoken / 雇用保険)",
      nameEn: "Employment Insurance",
      amountMinorUnits: empInsuranceYen,
      amountMajor: Number(empInsuranceYen),
      ratePercentage: 0.6,
      category: "social_security",
    },
    {
      key: "income_tax",
      nameId: "Pajak Penghasilan Nasional (Shotokuzei / 所得税)",
      nameEn: "National Income Tax",
      amountMinorUnits: incomeTaxYen,
      amountMajor: Number(incomeTaxYen),
      ratePercentage: grossMajor > 0 ? Number(((Number(incomeTaxYen) / grossMajor) * 100).toFixed(1)) : 0,
      category: "tax",
    },
    {
      key: "resident_tax",
      nameId: isSecondYear
        ? "Pajak Warga / Tempat Tinggal (Juminzei / 住民税 ~10%)"
        : "Pajak Warga (Juminzei) — Bebas di Tahun Pertama!",
      nameEn: isSecondYear
        ? "Resident / Inhabitant Tax (~10%)"
        : "Resident Tax — 0 in 1st Year (Exempt)",
      amountMinorUnits: residentTaxYen,
      amountMajor: Number(residentTaxYen),
      ratePercentage: grossMajor > 0 ? Number(((Number(residentTaxYen) / grossMajor) * 100).toFixed(1)) : 0,
      category: "tax",
    },
  ];

  const totalDeductionsYen = totalShakaiHoken + incomeTaxYen + residentTaxYen;
  const netYen = grossYen > totalDeductionsYen ? grossYen - totalDeductionsYen : 0n;
  const effectiveRate = grossYen > 0n ? Number((new Decimal(totalDeductionsYen.toString()).div(grossYen.toString())).toFixed(4)) : 0;

  const noteId = isSecondYear
    ? "Tahun ke-2+: Shakai Hoken ~14.75% + Pajak Daerah (Juminzei) 10% aktif berlaku."
    : "Tahun ke-1: Bebas Pajak Daerah (Juminzei) karena belum ada penghasilan tahun sebelumnya!";
  const noteEn = isSecondYear
    ? "Year 2+: Shakai Hoken ~14.75% + Resident Tax (Juminzei) 10% fully deducted."
    : "Year 1: Resident Tax exempt as there was no prior Japanese taxable income!";

  return {
    country: "JP",
    grossMonthlyMinorUnits: grossYen,
    grossMonthlyMajor: grossMajor,
    totalDeductionsMinorUnits: totalDeductionsYen,
    totalDeductionsMajor: Number(totalDeductionsYen),
    netMonthlyMinorUnits: netYen,
    netMonthlyMajor: Number(netYen),
    effectiveDeductionRate: effectiveRate,
    itemizedDeductions: items,
    summaryNoteId: noteId,
    summaryNoteEn: noteEn,
  };
}

/**
 * Calculate active statutory deductions for Indonesia (ID).
 * IDR: 0 decimals (rupiah).
 */
function calculateIndonesiaDeductions(input: ActiveDeductionInput): ActiveDeductionResult {
  const grossRp = input.grossMonthlyMinorUnits;
  const grossMajor = Number(grossRp);
  const ptkpStatus = input.ptkpStatusID ?? (
    input.familyStatus === "married_children"
      ? (input.numChildren && input.numChildren >= 2 ? "K/2" : "K/1")
      : input.familyStatus === "married"
      ? "K/0"
      : "TK/0"
  );

  if (grossRp <= 0n) {
    return {
      country: "ID",
      grossMonthlyMinorUnits: 0n,
      grossMonthlyMajor: 0,
      totalDeductionsMinorUnits: 0n,
      totalDeductionsMajor: 0,
      netMonthlyMinorUnits: 0n,
      netMonthlyMajor: 0,
      effectiveDeductionRate: 0,
      itemizedDeductions: [],
      summaryNoteId: "Tidak ada potongan untuk penghasilan nihil.",
      summaryNoteEn: "No deductions for zero income.",
    };
  }

  // 1. BPJS Ketenagakerjaan
  // Jaminan Hari Tua (JHT): 2% karyawan
  const jhtRate = 0.02;
  const jhtRp = BigInt(Math.round(grossMajor * jhtRate));

  // Jaminan Pensiun (JP): 1% karyawan (capped at ceiling Rp 10.042.300)
  const jpCeiling = 10042300;
  const jpBase = Math.min(grossMajor, jpCeiling);
  const jpRp = BigInt(Math.round(jpBase * 0.01));

  // 2. BPJS Kesehatan
  // 1% karyawan (capped at ceiling Rp 12.000.000)
  const bpjsKesCeiling = 12000000;
  const bpjsKesBase = Math.min(grossMajor, bpjsKesCeiling);
  const bpjsKesRp = BigInt(Math.round(bpjsKesBase * 0.01));

  // 3. PPh 21 (TER scheme based on PP 58/2023 & PMK 168/2023)
  let terRate = 0;
  if (ptkpStatus === "K/3") {
    // TER C
    if (grossMajor <= 6600000) terRate = 0;
    else if (grossMajor <= 6950000) terRate = 0.0025;
    else if (grossMajor <= 7350000) terRate = 0.005;
    else if (grossMajor <= 7800000) terRate = 0.0075;
    else if (grossMajor <= 8850000) terRate = 0.01;
    else if (grossMajor <= 9800000) terRate = 0.0125;
    else if (grossMajor <= 10950000) terRate = 0.015;
    else if (grossMajor <= 12600000) terRate = 0.02;
    else if (grossMajor <= 14050000) terRate = 0.03;
    else if (grossMajor <= 17000000) terRate = 0.05;
    else if (grossMajor <= 21250000) terRate = 0.07;
    else if (grossMajor <= 30000000) terRate = 0.10;
    else terRate = 0.15;
  } else if (ptkpStatus === "K/1" || ptkpStatus === "K/2") {
    // TER B
    if (grossMajor <= 6200000) terRate = 0;
    else if (grossMajor <= 6500000) terRate = 0.0025;
    else if (grossMajor <= 6850000) terRate = 0.005;
    else if (grossMajor <= 7300000) terRate = 0.0075;
    else if (grossMajor <= 9200000) terRate = 0.01;
    else if (grossMajor <= 10750000) terRate = 0.015;
    else if (grossMajor <= 12500000) terRate = 0.02;
    else if (grossMajor <= 13950000) terRate = 0.03;
    else if (grossMajor <= 16800000) terRate = 0.05;
    else if (grossMajor <= 21000000) terRate = 0.07;
    else if (grossMajor <= 29000000) terRate = 0.10;
    else terRate = 0.16;
  } else {
    // TER A (TK/0, K/0)
    if (grossMajor <= 5400000) terRate = 0;
    else if (grossMajor <= 5650000) terRate = 0.0025;
    else if (grossMajor <= 5950000) terRate = 0.005;
    else if (grossMajor <= 6300000) terRate = 0.0075;
    else if (grossMajor <= 6750000) terRate = 0.01;
    else if (grossMajor <= 7500000) terRate = 0.0125;
    else if (grossMajor <= 8550000) terRate = 0.015;
    else if (grossMajor <= 9650000) terRate = 0.0175;
    else if (grossMajor <= 10050000) terRate = 0.02;
    else if (grossMajor <= 10350000) terRate = 0.0225;
    else if (grossMajor <= 10700000) terRate = 0.025;
    else if (grossMajor <= 11050000) terRate = 0.03;
    else if (grossMajor <= 11600000) terRate = 0.035;
    else if (grossMajor <= 12500000) terRate = 0.04;
    else if (grossMajor <= 13750000) terRate = 0.05;
    else if (grossMajor <= 15100000) terRate = 0.06;
    else if (grossMajor <= 16950000) terRate = 0.07;
    else if (grossMajor <= 19750000) terRate = 0.08;
    else if (grossMajor <= 24150000) terRate = 0.09;
    else if (grossMajor <= 26450000) terRate = 0.10;
    else terRate = 0.15;
  }

  const pph21Rp = BigInt(Math.round(grossMajor * terRate));

  const items: ItemizedDeductionEntry[] = [
    {
      key: "jht",
      nameId: "BPJS TK — JHT (Jaminan Hari Tua 2%)",
      nameEn: "BPJS JHT (Old Age Pension)",
      amountMinorUnits: jhtRp,
      amountMajor: Number(jhtRp),
      ratePercentage: 2.0,
      category: "social_security",
    },
    {
      key: "jp",
      nameId: `BPJS TK — JP (Jaminan Pensiun 1% ${grossMajor > jpCeiling ? "max cap" : ""})`,
      nameEn: "BPJS JP (Pension Security)",
      amountMinorUnits: jpRp,
      amountMajor: Number(jpRp),
      ratePercentage: grossMajor > 0 ? Number(((Number(jpRp) / grossMajor) * 100).toFixed(2)) : 1.0,
      category: "social_security",
    },
    {
      key: "bpjs_kes",
      nameId: `BPJS Kesehatan (1% ${grossMajor > bpjsKesCeiling ? "max cap" : ""})`,
      nameEn: "BPJS Healthcare (1%)",
      amountMinorUnits: bpjsKesRp,
      amountMajor: Number(bpjsKesRp),
      ratePercentage: grossMajor > 0 ? Number(((Number(bpjsKesRp) / grossMajor) * 100).toFixed(2)) : 1.0,
      category: "social_security",
    },
    {
      key: "pph21",
      nameId: `PPh 21 (Skema TER Status ${ptkpStatus})`,
      nameEn: `Income Tax PPh 21 (Status ${ptkpStatus})`,
      amountMinorUnits: pph21Rp,
      amountMajor: Number(pph21Rp),
      ratePercentage: Number((terRate * 100).toFixed(2)),
      category: "tax",
    },
  ];

  const totalDeductionsRp = jhtRp + jpRp + bpjsKesRp + pph21Rp;
  const netRp = grossRp > totalDeductionsRp ? grossRp - totalDeductionsRp : 0n;
  const effectiveRate = grossRp > 0n ? Number((new Decimal(totalDeductionsRp.toString()).div(grossRp.toString())).toFixed(4)) : 0;

  return {
    country: "ID",
    grossMonthlyMinorUnits: grossRp,
    grossMonthlyMajor: grossMajor,
    totalDeductionsMinorUnits: totalDeductionsRp,
    totalDeductionsMajor: Number(totalDeductionsRp),
    netMonthlyMinorUnits: netRp,
    netMonthlyMajor: Number(netRp),
    effectiveDeductionRate: effectiveRate,
    itemizedDeductions: items,
    summaryNoteId: `Status PTKP ${ptkpStatus} · BPJS Ketenagakerjaan & Kesehatan total ~3-4% · PPh 21 tarif efektif ${(terRate * 100).toFixed(2)}%`,
    summaryNoteEn: `PTKP Status ${ptkpStatus} · BPJS Social Security total ~3-4% · Effective PPh 21 rate ${(terRate * 100).toFixed(2)}%`,
  };
}

/**
 * Calculate active deductions dispatcher based on country.
 */
export function calculateActiveDeductions(input: ActiveDeductionInput): ActiveDeductionResult {
  switch (input.country) {
    case "DE":
      return calculateGermanyDeductions(input);
    case "JP":
      return calculateJapanDeductions(input);
    case "ID":
      return calculateIndonesiaDeductions(input);
    default:
      return calculateGermanyDeductions(input);
  }
}
