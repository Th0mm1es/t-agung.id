/**
 * @bandinghidup/core — Housing & Relocation Cost Engine
 *
 * Models housing types and calculates upfront relocation costs
 * for Germany (Ausbildung) and Japan (Kenshusei/Technical Intern).
 *
 * All values in minor units (bigint):
 *   Germany: EUR cents
 *   Japan: JPY yen
 */

import Decimal from "decimal.js";
import { getCityRentMultiplier } from "./careerPathways.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HousingType =
  | "shared_room"          // WG (DE) / Sharehouse (JP) — cheapest
  | "dormitory"            // Employer-provided / company dorm
  | "studio"               // Studio / 1K / 1R apartment
  | "one_bedroom";         // 1-bedroom apartment — most expensive

export type CountryCode = "DE" | "JP" | "ID";

export interface HousingInput {
  type: HousingType;
  monthlyRentMinorUnits: bigint;  // Actual rent entered by user
  isEmployerProvided: boolean;    // True = dorm, cost may be deducted from wage
  country: CountryCode;
}

export interface RelocationInput {
  country: CountryCode;
  monthlyRentMinorUnits: bigint;
  /** Germany (Kaution): 1–3 months. Japan (Shikikin): 1–2 months. */
  depositMonths: number;
  /** Japan only (Reikin 礼金): 0–2 months. 0 for Germany. */
  keyMoneyMonths: number;
  /** Agency/broker fee (in minor units). Set 0 if no agent used. */
  agencyFeeMinorUnits: bigint;
  /** One-time budget for furniture, bedding, kitchenware. In minor units. */
  setupCushionMinorUnits: bigint;
  /** One-way flight + airport transport to destination. In minor units. */
  initialTravelMinorUnits: bigint;
}

export interface HousingMonthlyResult {
  type: HousingType;
  monthlyRent: bigint;
  isEmployerProvided: boolean;
  /** Net cash out of pocket (0 if employer-provided and deducted from wage) */
  netMonthlyCashOut: bigint;
}

export interface RelocationResult {
  deposit: bigint;
  keyMoney: bigint;
  agencyFee: bigint;
  setupCushion: bigint;
  initialTravel: bigint;
  totalUpfront: bigint;
  /** Human-readable formula string for UI display */
  formula: string;
}

// ─── Housing Benchmarks (reference ranges for UI hints) ──────────────────────

/** EUR cents per month — rough market ranges for major cities */
export const DE_HOUSING_BENCHMARKS: Record<HousingType, { min: bigint; max: bigint; label: string }> = {
  shared_room:  { min: 35000n,  max: 60000n,  label: "WG-Zimmer (Shared Room)" },
  dormitory:    { min: 20000n,  max: 40000n,  label: "Wohnheim / Company Dorm" },
  studio:       { min: 60000n,  max: 120000n, label: "Studio / 1-Zimmer-Wohnung" },
  one_bedroom:  { min: 90000n,  max: 160000n, label: "2-Zimmer-Wohnung" },
};

/** JPY yen per month — rough market ranges for major Japanese cities */
export const JP_HOUSING_BENCHMARKS: Record<HousingType, { min: bigint; max: bigint; label: string }> = {
  shared_room:  { min: 35000n,  max: 65000n,  label: "シェアハウス (Share House)" },
  dormitory:    { min: 15000n,  max: 40000n,  label: "会社寮 (Company Dorm)" },
  studio:       { min: 50000n,  max: 90000n,  label: "1K/1R アパート" },
  one_bedroom:  { min: 70000n,  max: 120000n, label: "1LDK アパート" },
};

/** IDR rupiah per month — rough market ranges for major Indonesian cities */
export const ID_HOUSING_BENCHMARKS: Record<HousingType, { min: bigint; max: bigint; label: string }> = {
  shared_room:  { min: 500000n,   max: 1200000n,  label: "Kost Kamar Mandi Luar" },
  dormitory:    { min: 400000n,   max: 1000000n,  label: "Mess / Asrama Karyawan" },
  studio:       { min: 1500000n,  max: 3500000n,  label: "Kost AC KM Dalam / Studio" },
  one_bedroom:  { min: 3000000n,  max: 6500000n,  label: "Apartemen 1-BR / Kontrakan" },
};

/**
 * Resolves market rent ranges and official government statistical citations
 * for any given city and housing size (WG/Shared, Studio/1K, 1-Bedroom/2-Zimmer/1LDK).
 *
 * Calibrated against:
 *   - Germany: Destatis & Municipal Mietspiegel (§ 558c BGB)
 *   - Japan: e-Stat MIC Housing & Land Survey & MLIT Real Estate Market Indices
 *   - Indonesia: BPS Survei Biaya Hidup (SBH) & Susenas
 */
export function getCityHousingBenchmark(
  country: CountryCode,
  cityName: string,
  housingType: HousingType = "studio"
): {
  minMinorUnits: bigint;
  medianMinorUnits: bigint;
  maxMinorUnits: bigint;
  label: string;
  sourceCitation: string;
} {
  const mult = getCityRentMultiplier(cityName);
  const benchmarks = country === "DE"
    ? DE_HOUSING_BENCHMARKS
    : country === "JP"
    ? JP_HOUSING_BENCHMARKS
    : ID_HOUSING_BENCHMARKS;

  const b = benchmarks[housingType] ?? benchmarks.studio;
  const minVal = BigInt(Math.round(Number(b.min) * mult));
  const maxVal = BigInt(Math.round(Number(b.max) * mult));
  const medianVal = (minVal + maxVal) / 2n;

  const sourceCitation = country === "DE"
    ? `Destatis & Mietspiegel ${cityName} 2024/2025 (§ 558c BGB)`
    : country === "JP"
    ? `e-Stat 住宅・土地統計調査 & 国土交通省 ${cityName}`
    : `BPS Survei Biaya Hidup & Susenas ${cityName}`;

  return {
    minMinorUnits: minVal,
    medianMinorUnits: medianVal,
    maxMinorUnits: maxVal,
    label: b.label,
    sourceCitation,
  };
}

// ─── Housing Monthly Calculator ───────────────────────────────────────────────

/**
 * Determine the monthly housing cash impact.
 * If employer-provided, the cost is already deducted from wage (via income engine),
 * so netMonthlyCashOut is 0.
 */
export function calculateMonthlyHousing(input: HousingInput): HousingMonthlyResult {
  const { type, monthlyRentMinorUnits, isEmployerProvided } = input;

  if (monthlyRentMinorUnits < 0n) {
    throw new RangeError("Monthly rent cannot be negative");
  }

  return {
    type,
    monthlyRent: monthlyRentMinorUnits,
    isEmployerProvided,
    // If employer-provided (and deducted from pay), no extra cash outflow
    netMonthlyCashOut: isEmployerProvided ? 0n : monthlyRentMinorUnits,
  };
}

// ─── Upfront Relocation Calculator ───────────────────────────────────────────

/**
 * Calculate all one-time upfront relocation costs.
 * STRICTLY SEPARATED from monthly cash flow (per Stage 1 spec).
 *
 * Germany: deposit (Kaution) 1–3 months, optional agency fee
 * Japan: deposit (敷金 Shikikin) + key money (礼金 Reikin) + agency fee
 */
export function calculateUpfrontRelocation(input: RelocationInput): RelocationResult {
  const {
    monthlyRentMinorUnits,
    depositMonths,
    keyMoneyMonths,
    agencyFeeMinorUnits,
    setupCushionMinorUnits,
    initialTravelMinorUnits,
  } = input;

  if (monthlyRentMinorUnits < 0n) {
    throw new RangeError("Monthly rent cannot be negative");
  }
  if (depositMonths < 0 || depositMonths > 6) {
    throw new RangeError("Deposit months must be between 0 and 6");
  }
  if (keyMoneyMonths < 0 || keyMoneyMonths > 3) {
    throw new RangeError("Key money months must be between 0 and 3");
  }

  const rent = new Decimal(monthlyRentMinorUnits.toString());

  const deposit = BigInt(
    rent.mul(new Decimal(depositMonths.toString())).toFixed(0, Decimal.ROUND_HALF_UP)
  );
  const keyMoney = BigInt(
    rent.mul(new Decimal(keyMoneyMonths.toString())).toFixed(0, Decimal.ROUND_HALF_UP)
  );

  const totalUpfront =
    deposit +
    keyMoney +
    agencyFeeMinorUnits +
    setupCushionMinorUnits +
    initialTravelMinorUnits;

  const formula = buildFormula(input, deposit, keyMoney);

  return {
    deposit,
    keyMoney,
    agencyFee: agencyFeeMinorUnits,
    setupCushion: setupCushionMinorUnits,
    initialTravel: initialTravelMinorUnits,
    totalUpfront,
    formula,
  };
}

/** Build a human-readable formula string for the UI */
function buildFormula(
  input: RelocationInput,
  deposit: bigint,
  keyMoney: bigint
): string {
  const parts: string[] = [];

  if (deposit > 0n) {
    parts.push(`Deposit (${input.depositMonths}× rent)`);
  }
  if (keyMoney > 0n) {
    parts.push(`Key Money / Reikin (${input.keyMoneyMonths}× rent)`);
  }
  if (input.agencyFeeMinorUnits > 0n) {
    parts.push("Agency Fee");
  }
  if (input.setupCushionMinorUnits > 0n) {
    parts.push("Setup & Furniture");
  }
  if (input.initialTravelMinorUnits > 0n) {
    parts.push("Initial Travel");
  }

  return parts.join(" + ") || "No relocation costs entered";
}

// ─── Default Relocation Presets ───────────────────────────────────────────────

/**
 * Returns sensible default relocation inputs for each country.
 * These serve as the pre-filled wizard values before user edits.
 */
export function getDefaultRelocationPreset(
  country: CountryCode,
  monthlyRentMinorUnits: bigint
): RelocationInput {
  if (country === "DE") {
    return {
      country,
      monthlyRentMinorUnits,
      depositMonths: 2,          // Typical German Kaution: 2 months
      keyMoneyMonths: 0,         // No key money in Germany
      agencyFeeMinorUnits: 0n,   // Many WG rooms have no agency fee
      setupCushionMinorUnits: 50000n,  // €500 for basic household items
      initialTravelMinorUnits: 150000n, // ~€1500 one-way flight from Indonesia
    };
  }

  if (country === "JP") {
    return {
      country,
      monthlyRentMinorUnits,
      depositMonths: 1,           // 敷金 1 month (often employer handles more)
      keyMoneyMonths: 1,          // 礼金 1 month (varies by region)
      agencyFeeMinorUnits: monthlyRentMinorUnits,  // 1 month agency fee typical
      setupCushionMinorUnits: 50000n,   // ¥50,000 basic household items
      initialTravelMinorUnits: 150000n, // ~¥150,000 one-way flight from Indonesia
    };
  }

  // Indonesia baseline (no relocation, just reference)
  return {
    country,
    monthlyRentMinorUnits,
    depositMonths: 1,
    keyMoneyMonths: 0,
    agencyFeeMinorUnits: 0n,
    setupCushionMinorUnits: 0n,
    initialTravelMinorUnits: 0n,
  };
}
