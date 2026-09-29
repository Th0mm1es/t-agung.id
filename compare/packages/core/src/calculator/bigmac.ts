/**
 * @bandinghidup/core — Big Mac Index & Purchasing Power Parity (PPP) Engine
 *
 * Provides standardized purchasing power comparisons using the Big Mac metric.
 * Allows comparing living expenses, salaries, and savings in real burger units
 * unaffected by fluctuating nominal exchange rates.
 */

import Decimal from "decimal.js";
import type { CountryCode, HousingType } from "./housing.js";
import { getCityRentMultiplier, getCityFoodMultiplier } from "./careerPathways.js";

export type BigMacCountry = CountryCode | "US";
export type FoodIndexType = "big_mac" | "street_food" | "coffee" | "cpi_basket";
export type EquivalenceLogic = "same_savings" | "same_net" | "same_gross";
export type IncomePeriodicity = "monthly" | "yearly";

export interface FoodItemInfo {
  itemCode: string;
  itemName: string;
  emoji: string;
  minor: bigint;
  major: number;
  currency: "EUR" | "JPY" | "IDR" | "USD";
}

export const DEFAULT_STREET_FOOD_PRICES: Record<BigMacCountry, FoodItemInfo> = {
  DE: { itemCode: "doner", itemName: "Döner Kebab", emoji: "🥙", minor: 750n, major: 7.50, currency: "EUR" },
  JP: { itemCode: "udon", itemName: "Udon / Gyudon", emoji: "🍜", minor: 620n, major: 620, currency: "JPY" },
  ID: { itemCode: "mie_ayam", itemName: "Mie Ayam / Nasi Goreng", emoji: "🍜", minor: 20000n, major: 20000, currency: "IDR" },
  US: { itemCode: "burger", itemName: "Food Truck Meal", emoji: "🍔", minor: 950n, major: 9.50, currency: "USD" },
};

export const DEFAULT_COFFEE_PRICES: Record<BigMacCountry, FoodItemInfo> = {
  DE: { itemCode: "coffee", itemName: "Cappuccino / Flat White", emoji: "☕", minor: 380n, major: 3.80, currency: "EUR" },
  JP: { itemCode: "coffee", itemName: "Cafe Latte / Doutor", emoji: "☕", minor: 450n, major: 450, currency: "JPY" },
  ID: { itemCode: "coffee", itemName: "Es Kopi Susu Aren", emoji: "☕", minor: 22000n, major: 22000, currency: "IDR" },
  US: { itemCode: "coffee", itemName: "Specialty Coffee", emoji: "☕", minor: 500n, major: 5.00, currency: "USD" },
};

export const DEFAULT_CPI_BASKET_PRICES: Record<BigMacCountry, FoodItemInfo> = {
  DE: { itemCode: "cpi_basket", itemName: "Keranjang Belanja Resmi (Destatis)", emoji: "🛒", minor: 38000n, major: 380.00, currency: "EUR" },
  JP: { itemCode: "cpi_basket", itemName: "生活消費バスケット (e-Stat)", emoji: "🛒", minor: 45000n, major: 45000, currency: "JPY" },
  ID: { itemCode: "cpi_basket", itemName: "Keranjang Konsumsi Bulanan (BPS)", emoji: "🛒", minor: 2400000n, major: 2400000, currency: "IDR" },
  US: { itemCode: "cpi_basket", itemName: "Consumer Basket (BLS)", emoji: "🛒", minor: 45000n, major: 450.00, currency: "USD" },
};

export interface BigMacIndexResult {
  country: BigMacCountry;
  currency: "EUR" | "JPY" | "IDR" | "USD";
  bigMacPriceMinorUnits: bigint;
  bigMacPriceMajor: number;
  rentInBigMacs: number;
  grossSalaryInBigMacs: number;
  netSalaryInBigMacs: number;
  monthlySavingsInBigMacs: number;
  workMinutesPerBigMac: number;
  summaryText: string;
}

/**
 * Standard baseline prices for a Big Mac (in integer minor units).
 * Germany: 520 cents (€5.20)
 * Japan: 540 yen (¥540)
 * Indonesia: 42,000 rupiah (Rp 42.000)
 * US: 569 cents ($5.69)
 */
export const DEFAULT_BIG_MAC_PRICES: Record<BigMacCountry, { minor: bigint; major: number; currency: "EUR" | "JPY" | "IDR" | "USD" }> = {
  DE: { minor: 520n, major: 5.20, currency: "EUR" },
  JP: { minor: 540n, major: 540, currency: "JPY" },
  ID: { minor: 42000n, major: 42000, currency: "IDR" },
  US: { minor: 569n, major: 5.69, currency: "USD" },
};

export interface CalculateBigMacInput {
  country: BigMacCountry;
  monthlyRentMinorUnits: bigint;
  grossMonthlyMinorUnits: bigint;
  netMonthlyMinorUnits: bigint;
  monthlyBalanceMinorUnits: bigint;
  /** Optional custom price override (e.g. from live expense_benchmarks) */
  customPriceMinorUnits?: bigint | undefined;
  /** Estimated working hours per month (default: 160 hrs) */
  monthlyWorkingHours?: number | undefined;
}

/**
 * Calculate the Big Mac Index metrics for a given financial scenario.
 */
export function calculateBigMacIndex(input: CalculateBigMacInput): BigMacIndexResult {
  const defaultMeta = DEFAULT_BIG_MAC_PRICES[input.country] ?? DEFAULT_BIG_MAC_PRICES.DE;
  const priceMinor = input.customPriceMinorUnits && input.customPriceMinorUnits > 0n
    ? input.customPriceMinorUnits
    : defaultMeta.minor;

  const priceMinorDec = new Decimal(priceMinor.toString());
  const hours = input.monthlyWorkingHours ?? 160;

  // Major price representation
  const divisor = (defaultMeta.currency === "EUR" || defaultMeta.currency === "USD") ? 100 : 1;
  const bigMacPriceMajor = Number(priceMinorDec.div(divisor).toFixed(2));

  // Rent in Big Macs
  const rentInBigMacs = Number(
    new Decimal(input.monthlyRentMinorUnits.toString())
      .div(priceMinorDec)
      .toFixed(1)
  );

  // Gross Salary in Big Macs
  const grossSalaryInBigMacs = Number(
    new Decimal(input.grossMonthlyMinorUnits.toString())
      .div(priceMinorDec)
      .toFixed(1)
  );

  // Net Salary in Big Macs
  const netSalaryInBigMacs = Number(
    new Decimal(input.netMonthlyMinorUnits.toString())
      .div(priceMinorDec)
      .toFixed(1)
  );

  // Monthly Savings (Balance) in Big Macs
  const monthlySavingsInBigMacs = Number(
    new Decimal(input.monthlyBalanceMinorUnits.toString())
      .div(priceMinorDec)
      .toFixed(1)
  );

  // Working minutes required to earn 1 Big Mac
  // Net hourly wage = (netMonthly / hours)
  // Minutes to buy 1 Big Mac = (price / hourlyNet) * 60
  let workMinutesPerBigMac = 0;
  if (input.netMonthlyMinorUnits > 0n) {
    const netHourlyMinor = new Decimal(input.netMonthlyMinorUnits.toString()).div(hours);
    if (netHourlyMinor.gt(0)) {
      const minutesDec = priceMinorDec.div(netHourlyMinor).mul(60);
      workMinutesPerBigMac = Math.max(1, Number(minutesDec.toFixed(0)));
    }
  }

  const summaryText = `Satu bulan sewa setara dengan ${rentInBigMacs} Big Mac. Gaji bersih setara dengan ${netSalaryInBigMacs} Big Mac (perlu ~${workMinutesPerBigMac} menit kerja per burger).`;

  return {
    country: input.country,
    currency: defaultMeta.currency,
    bigMacPriceMinorUnits: priceMinor,
    bigMacPriceMajor,
    rentInBigMacs,
    grossSalaryInBigMacs,
    netSalaryInBigMacs,
    monthlySavingsInBigMacs,
    workMinutesPerBigMac,
    summaryText,
  };
}

/**
 * Compare Big Mac Index purchasing power between two countries or cities.
 */
export function compareBigMacParity(
  scenarioA: BigMacIndexResult,
  scenarioB: BigMacIndexResult
): {
  rentDifferenceBurgers: number;
  netSalaryDifferenceBurgers: number;
  savingsDifferenceBurgers: number;
  minutesDifference: number;
  moreAffordableScenario: "A" | "B" | "equal";
} {
  const rentDiff = Number((scenarioB.rentInBigMacs - scenarioA.rentInBigMacs).toFixed(1));
  const netSalaryDiff = Number((scenarioB.netSalaryInBigMacs - scenarioA.netSalaryInBigMacs).toFixed(1));
  const savingsDiff = Number((scenarioB.monthlySavingsInBigMacs - scenarioA.monthlySavingsInBigMacs).toFixed(1));
  const minutesDiff = scenarioB.workMinutesPerBigMac - scenarioA.workMinutesPerBigMac;

  let moreAffordableScenario: "A" | "B" | "equal" = "equal";
  if (scenarioB.monthlySavingsInBigMacs > scenarioA.monthlySavingsInBigMacs) {
    moreAffordableScenario = "B";
  } else if (scenarioA.monthlySavingsInBigMacs > scenarioB.monthlySavingsInBigMacs) {
    moreAffordableScenario = "A";
  }

  return {
    rentDifferenceBurgers: rentDiff,
    netSalaryDifferenceBurgers: netSalaryDiff,
    savingsDifferenceBurgers: savingsDiff,
    minutesDifference: minutesDiff,
    moreAffordableScenario,
  };
}

import { calculateActiveDeductions, type ActiveDeductionResult, type FamilyStatus } from "./taxDeductions.js";

export interface LifestyleEquivalenceInput {
  sourceCountry: CountryCode;
  sourceCityName: string;
  sourceGrossMonthlyMinorUnits: bigint;
  targetCountry: CountryCode;
  targetCityName: string;
  indexType: FoodIndexType;
  periodicity?: IncomePeriodicity;
  equivalenceLogic?: EquivalenceLogic;
  housingType?: HousingType;
  familyStatus?: FamilyStatus;
  numChildren?: number;
  taxClassDE?: 1 | 3 | 4 | 5;
  churchTaxDE?: boolean;
  isJapanSecondYear?: boolean;
  ptkpStatusID?: "TK/0" | "K/0" | "K/1" | "K/2" | "K/3";
  customSourcePriceMajor?: number | undefined;
  customTargetPriceMajor?: number | undefined;
  customSourceRentMajor?: number | undefined;
  customTargetRentMajor?: number | undefined;
  customSourceUtilitiesMajor?: number | undefined;
  customTargetUtilitiesMajor?: number | undefined;
  customSourceTransportMajor?: number | undefined;
  customTargetTransportMajor?: number | undefined;
}

export interface EquivalenceSummaryCard {
  grossMonthlyMajor: number;
  grossYearlyMajor: number;
  netMonthlyMajor: number;
  netYearlyMajor: number;
  totalDeductionsMonthlyMajor: number;
  totalDeductionsYearlyMajor: number;
  effectiveDeductionRate: number;
  rentMonthlyMajor: number;
  foodMonthlyMajor: number;
  utilitiesMonthlyMajor: number;
  transportMonthlyMajor: number;
  totalConsumptionMonthlyMajor: number;
  totalConsumptionYearlyMajor: number;
  discretionarySavingsMonthlyMajor: number;
  discretionarySavingsYearlyMajor: number;
  foodPurchasingPowerQuantity: number;
  foodItem: { itemName: string; emoji: string; major: number; currency: string };
  deductionResult: ActiveDeductionResult;
}

export interface LifestyleEquivalenceResult {
  sourceCountry: CountryCode;
  sourceCityName: string;
  sourceGrossMonthlyMinorUnits: bigint;
  sourceGrossMajor: number;
  sourceNetMajor: number;
  targetCountry: CountryCode;
  targetCityName: string;
  equivalentGrossMonthlyMinorUnits: bigint;
  equivalentGrossMajor: number;
  equivalentNetMajor: number;
  indexType: FoodIndexType;
  equivalenceLogic: EquivalenceLogic;
  periodicity: IncomePeriodicity;
  sourceFoodItem: { itemName: string; emoji: string; major: number; currency: string };
  targetFoodItem: { itemName: string; emoji: string; major: number; currency: string };
  foodParityRatio: number;
  targetRentMajor: number;
  targetDiscretionaryMajor: number;
  targetSavingsMajor: number;
  sourceSummary: EquivalenceSummaryCard;
  targetSummary: EquivalenceSummaryCard;
  explanation: {
    id: string;
    en: string;
    ja: string;
  };
}

/**
 * Calculate the required salary in a target city/country to maintain the same
 * living standard as the source city/country, using food parity, local consumption structures,
 * and active statutory deductions.
 */
export function calculateLifestyleEquivalenceSalary(
  input: LifestyleEquivalenceInput
): LifestyleEquivalenceResult {
  const DECIMALS: Record<CountryCode, number> = {
    ID: 0,
    JP: 0,
    DE: 2,
  };

  const CURRENCY: Record<CountryCode, "EUR" | "JPY" | "IDR"> = {
    ID: "IDR",
    JP: "JPY",
    DE: "EUR",
  };

  const housingType: HousingType = input.housingType ?? "studio";

  const BASE_RENTS_BY_TYPE: Record<CountryCode, Record<HousingType, number>> = {
    ID: {
      shared_room: 800000,
      dormitory: 600000,
      studio: 1800000,
      one_bedroom: 4200000,
    },
    JP: {
      shared_room: 38000,
      dormitory: 25000,
      studio: 55000,
      one_bedroom: 90000,
    },
    DE: {
      shared_room: 400,
      dormitory: 300,
      studio: 550,
      one_bedroom: 1100,
    },
  };

  const DEFAULT_RENTS: Record<CountryCode, number> = {
    ID: BASE_RENTS_BY_TYPE.ID[housingType] ?? 1800000,
    JP: BASE_RENTS_BY_TYPE.JP[housingType] ?? 55000,
    DE: BASE_RENTS_BY_TYPE.DE[housingType] ?? 550,
  };

  const DEFAULT_UTILITIES: Record<CountryCode, number> = {
    ID: 350000,  // Listrik, internet, pulsa
    JP: 12000,   // Gas, listrik, air, internet/HP
    DE: 110,     // Rundfunkbeitrag, internet, mobil
  };

  const DEFAULT_TRANSPORT: Record<CountryCode, number> = {
    ID: 350000,  // TransJakarta / KRL / Bensin
    JP: 10000,   // Tsukin pass
    DE: 63,      // Deutschlandticket €63 (2026, deutschlandticket.de)
  };

  const periodicity: IncomePeriodicity = input.periodicity ?? "monthly";
  const equivalenceLogic: EquivalenceLogic = input.equivalenceLogic ?? "same_savings";

  // Convert source gross minor to major
  const sourceGrossMajor = Number(input.sourceGrossMonthlyMinorUnits) / Math.pow(10, DECIMALS[input.sourceCountry]);

  // Active deductions for Source
  const sourceDeductionResult = calculateActiveDeductions({
    country: input.sourceCountry,
    grossMonthlyMinorUnits: input.sourceGrossMonthlyMinorUnits,
    familyStatus: input.familyStatus ?? "single",
    numChildren: input.numChildren,
    taxClassDE: input.taxClassDE,
    churchTaxDE: input.churchTaxDE,
    isJapanSecondYear: input.isJapanSecondYear,
    ptkpStatusID: input.ptkpStatusID,
  });

  const sourceNetMajor = sourceDeductionResult.netMonthlyMajor;

  // City-adjusted housing rent benchmarks
  const sourceRentMult = getCityRentMultiplier(input.sourceCityName);
  const targetRentMult = getCityRentMultiplier(input.targetCityName);

  const defaultSourceRent = Math.round(DEFAULT_RENTS[input.sourceCountry] * sourceRentMult);
  const defaultTargetRent = Math.round(DEFAULT_RENTS[input.targetCountry] * targetRentMult);

  const sourceRentMajor = input.customSourceRentMajor ?? defaultSourceRent;
  const targetRentMajor = input.customTargetRentMajor ?? defaultTargetRent;

  const sourceUtilitiesMajor = input.customSourceUtilitiesMajor ?? DEFAULT_UTILITIES[input.sourceCountry];
  const sourceTransportMajor = input.customSourceTransportMajor ?? DEFAULT_TRANSPORT[input.sourceCountry];

  // Resolve Food / Index items with city-level price variations
  const resolveFoodItem = (country: CountryCode, cityName: string, customPrice?: number) => {
    const foodMult = getCityFoodMultiplier(cityName);

    if (input.indexType === "big_mac") {
      // Big Mac: Uniform franchise price nationally (Economist index standard)
      const b = DEFAULT_BIG_MAC_PRICES[country];
      return { itemName: "Big Mac", emoji: "🍔", major: customPrice ?? b.major, currency: CURRENCY[country] };
    }
    if (input.indexType === "coffee") {
      const c = DEFAULT_COFFEE_PRICES[country];
      let p = c.major * foodMult;
      p = country === "DE" ? Math.round(p * 20) / 20 : country === "JP" ? Math.round(p / 10) * 10 : Math.round(p / 500) * 500;
      return { itemName: c.itemName, emoji: c.emoji, major: customPrice ?? p, currency: CURRENCY[country] };
    }
    if (input.indexType === "cpi_basket") {
      const p = DEFAULT_CPI_BASKET_PRICES[country];
      let val = p.major * foodMult;
      val = country === "DE" ? Math.round(val * 10) / 10 : country === "JP" ? Math.round(val / 10) * 10 : Math.round(val / 1000) * 1000;
      return { itemName: p.itemName, emoji: p.emoji, major: customPrice ?? val, currency: CURRENCY[country] };
    }
    // Street Food: varies significantly by city (Munich Döner €8.60 vs Berlin €7.50 vs Leipzig €6.75; Tokyo Udon ¥620 vs Osaka ¥570; Jakarta Rp 20.000 vs Bandung Rp 16.000)
    const s = DEFAULT_STREET_FOOD_PRICES[country];
    let p = s.major * foodMult;
    p = country === "DE" ? Math.round(p * 20) / 20 : country === "JP" ? Math.round(p / 10) * 10 : Math.round(p / 500) * 500;
    return { itemName: s.itemName, emoji: s.emoji, major: customPrice ?? p, currency: CURRENCY[country] };
  };

  const sourceFood = resolveFoodItem(input.sourceCountry, input.sourceCityName, input.customSourcePriceMajor);
  const targetFood = resolveFoodItem(input.targetCountry, input.targetCityName, input.customTargetPriceMajor);

  // Baseline monthly grocery/food consumption cost (approx 40 meals / month grocery + dining)
  const sourceFoodMonthlyMajor = Math.round(sourceFood.major * 40);
  const targetFoodMonthlyMajor = Math.round(targetFood.major * 40);

  const targetUtilitiesMajor = input.customTargetUtilitiesMajor ?? DEFAULT_UTILITIES[input.targetCountry];
  const targetTransportMajor = input.customTargetTransportMajor ?? DEFAULT_TRANSPORT[input.targetCountry];

  const sourceTotalConsumption = sourceRentMajor + sourceFoodMonthlyMajor + sourceUtilitiesMajor + sourceTransportMajor;
  const targetTotalConsumption = targetRentMajor + targetFoodMonthlyMajor + targetUtilitiesMajor + targetTransportMajor;

  // Calculate Equivalence based on selected Logic
  let targetNetMajor = 0;
  let targetGrossMajor = 0;
  let targetDiscretionary = 0;
  let mealsCapacity = 0;

  // Approximate retention rates for rough initial gross estimation
  const RETENTION_ESTIMATES: Record<CountryCode, number> = {
    ID: 0.94,
    JP: 0.78,
    DE: 0.62,
  };
  const targetRetention = RETENTION_ESTIMATES[input.targetCountry] ?? 0.75;

  if (equivalenceLogic === "same_gross") {
    // Mode 3: Preserves gross contract purchasing power
    mealsCapacity = sourceGrossMajor / sourceFood.major;
    targetGrossMajor = Math.round(mealsCapacity * targetFood.major);

    // Compute deductions on target gross
    const targetGrossMinor = BigInt(Math.round(targetGrossMajor * Math.pow(10, DECIMALS[input.targetCountry])));
    const activeTargetDed = calculateActiveDeductions({
      country: input.targetCountry,
      grossMonthlyMinorUnits: targetGrossMinor,
      familyStatus: input.familyStatus ?? "single",
      numChildren: input.numChildren,
      taxClassDE: input.taxClassDE,
      churchTaxDE: input.churchTaxDE,
      isJapanSecondYear: input.isJapanSecondYear,
      ptkpStatusID: input.ptkpStatusID,
    });
    targetNetMajor = activeTargetDed.netMonthlyMajor;
    targetDiscretionary = Math.max(0, targetNetMajor - targetTotalConsumption);
  } else if (equivalenceLogic === "same_net") {
    // Mode 2: Preserves net take-home purchasing power
    mealsCapacity = sourceNetMajor / sourceFood.major;
    targetNetMajor = Math.round(mealsCapacity * targetFood.major);
    targetGrossMajor = Math.round(targetNetMajor / targetRetention);

    // Refine target gross with iterative active deduction check
    for (let iter = 0; iter < 4; iter++) {
      const gMinor = BigInt(Math.round(targetGrossMajor * Math.pow(10, DECIMALS[input.targetCountry])));
      const d = calculateActiveDeductions({
        country: input.targetCountry,
        grossMonthlyMinorUnits: gMinor,
        familyStatus: input.familyStatus ?? "single",
        numChildren: input.numChildren,
        taxClassDE: input.taxClassDE,
        churchTaxDE: input.churchTaxDE,
        isJapanSecondYear: input.isJapanSecondYear,
        ptkpStatusID: input.ptkpStatusID,
      });
      const diff = targetNetMajor - d.netMonthlyMajor;
      if (Math.abs(diff) <= 2) break;
      targetGrossMajor += Math.round(diff / (1 - d.effectiveDeductionRate));
    }
    targetDiscretionary = Math.max(0, targetNetMajor - targetTotalConsumption);
  } else {
    // Mode 1: Preserves discretionary savings in food units (Default / Recommended)
    const sourceDiscretionary = Math.max(0, sourceNetMajor - sourceTotalConsumption);
    mealsCapacity = sourceDiscretionary / sourceFood.major;
    targetDiscretionary = Math.round(mealsCapacity * targetFood.major);
    targetNetMajor = targetTotalConsumption + targetDiscretionary;
    targetGrossMajor = Math.round(targetNetMajor / targetRetention);

    for (let iter = 0; iter < 4; iter++) {
      const gMinor = BigInt(Math.round(targetGrossMajor * Math.pow(10, DECIMALS[input.targetCountry])));
      const d = calculateActiveDeductions({
        country: input.targetCountry,
        grossMonthlyMinorUnits: gMinor,
        familyStatus: input.familyStatus ?? "single",
        numChildren: input.numChildren,
        taxClassDE: input.taxClassDE,
        churchTaxDE: input.churchTaxDE,
        isJapanSecondYear: input.isJapanSecondYear,
        ptkpStatusID: input.ptkpStatusID,
      });
      const diff = targetNetMajor - d.netMonthlyMajor;
      if (Math.abs(diff) <= 2) break;
      targetGrossMajor += Math.round(diff / (1 - d.effectiveDeductionRate));
    }
  }

  const targetGrossMinor = BigInt(Math.round(targetGrossMajor * Math.pow(10, DECIMALS[input.targetCountry])));
  const targetDeductionResult = calculateActiveDeductions({
    country: input.targetCountry,
    grossMonthlyMinorUnits: targetGrossMinor,
    familyStatus: input.familyStatus ?? "single",
    numChildren: input.numChildren,
    taxClassDE: input.taxClassDE,
    churchTaxDE: input.churchTaxDE,
    isJapanSecondYear: input.isJapanSecondYear,
    ptkpStatusID: input.ptkpStatusID,
  });

  const sourceDiscretionarySavings = Math.max(0, sourceNetMajor - sourceTotalConsumption);
  const targetDiscretionarySavings = Math.max(0, targetNetMajor - targetTotalConsumption);

  const sourceSummary: EquivalenceSummaryCard = {
    grossMonthlyMajor: sourceGrossMajor,
    grossYearlyMajor: sourceGrossMajor * 12,
    netMonthlyMajor: sourceNetMajor,
    netYearlyMajor: sourceNetMajor * 12,
    totalDeductionsMonthlyMajor: sourceDeductionResult.totalDeductionsMajor,
    totalDeductionsYearlyMajor: sourceDeductionResult.totalDeductionsMajor * 12,
    effectiveDeductionRate: sourceDeductionResult.effectiveDeductionRate,
    rentMonthlyMajor: sourceRentMajor,
    foodMonthlyMajor: sourceFoodMonthlyMajor,
    utilitiesMonthlyMajor: sourceUtilitiesMajor,
    transportMonthlyMajor: sourceTransportMajor,
    totalConsumptionMonthlyMajor: sourceTotalConsumption,
    totalConsumptionYearlyMajor: sourceTotalConsumption * 12,
    discretionarySavingsMonthlyMajor: sourceDiscretionarySavings,
    discretionarySavingsYearlyMajor: sourceDiscretionarySavings * 12,
    foodPurchasingPowerQuantity: Math.round(sourceNetMajor / sourceFood.major),
    foodItem: sourceFood,
    deductionResult: sourceDeductionResult,
  };

  const targetSummary: EquivalenceSummaryCard = {
    grossMonthlyMajor: targetGrossMajor,
    grossYearlyMajor: targetGrossMajor * 12,
    netMonthlyMajor: targetNetMajor,
    netYearlyMajor: targetNetMajor * 12,
    totalDeductionsMonthlyMajor: targetDeductionResult.totalDeductionsMajor,
    totalDeductionsYearlyMajor: targetDeductionResult.totalDeductionsMajor * 12,
    effectiveDeductionRate: targetDeductionResult.effectiveDeductionRate,
    rentMonthlyMajor: targetRentMajor,
    foodMonthlyMajor: targetFoodMonthlyMajor,
    utilitiesMonthlyMajor: targetUtilitiesMajor,
    transportMonthlyMajor: targetTransportMajor,
    totalConsumptionMonthlyMajor: targetTotalConsumption,
    totalConsumptionYearlyMajor: targetTotalConsumption * 12,
    discretionarySavingsMonthlyMajor: targetDiscretionarySavings,
    discretionarySavingsYearlyMajor: targetDiscretionarySavings * 12,
    foodPurchasingPowerQuantity: Math.round(targetNetMajor / targetFood.major),
    foodItem: targetFood,
    deductionResult: targetDeductionResult,
  };

  const foodParityRatio = Number((targetFood.major / sourceFood.major).toFixed(6));
  const sourceCur = CURRENCY[input.sourceCountry];
  const targetCur = CURRENCY[input.targetCountry];

  const logicLabelId =
    equivalenceLogic === "same_gross"
      ? "Gaji Kotor (Gross)"
      : equivalenceLogic === "same_net"
      ? "Gaji Bersih (Net)"
      : "Sisa Tabungan Bulanan";

  const explanation = {
    id: `Berdasarkan metode acuan ${targetFood.itemName} (${logicLabelId} setara): Dengan gaji kotor ${sourceCur} ${sourceGrossMajor.toLocaleString()} di ${input.sourceCityName}, Anda memerlukan penghasilan kotor sekitar ${targetCur} ${targetGrossMajor.toLocaleString()} di ${input.targetCityName}. Angka ini memperhitungkan biaya hidup lokal (${targetCur} ${targetTotalConsumption.toLocaleString()}/bln) serta potongan pajak dan asuransi sosial aktif di ${input.targetCountry} (${(targetDeductionResult.effectiveDeductionRate * 100).toFixed(1)}%).`,
    en: `Based on ${targetFood.itemName} benchmark (${equivalenceLogic}): Earning ${sourceCur} ${sourceGrossMajor.toLocaleString()} in ${input.sourceCityName} requires approximately ${targetCur} ${targetGrossMajor.toLocaleString()} gross in ${input.targetCityName}, accounting for local living costs (${targetCur} ${targetTotalConsumption.toLocaleString()}/mo) and statutory deductions in ${input.targetCountry} (${(targetDeductionResult.effectiveDeductionRate * 100).toFixed(1)}%).`,
    ja: `${targetFood.itemName}基準に基づく試算: ${input.sourceCityName}での月収${sourceCur} ${sourceGrossMajor.toLocaleString()}と同等の生活水準を保つには、${input.targetCityName}で約${targetCur} ${targetGrossMajor.toLocaleString()}の額面が必要です（現地生活費 ${targetCur} ${targetTotalConsumption.toLocaleString()}、税・社会保険料率 ${(targetDeductionResult.effectiveDeductionRate * 100).toFixed(1)}% を考慮）。`,
  };

  return {
    sourceCountry: input.sourceCountry,
    sourceCityName: input.sourceCityName,
    sourceGrossMonthlyMinorUnits: input.sourceGrossMonthlyMinorUnits,
    sourceGrossMajor,
    sourceNetMajor,
    targetCountry: input.targetCountry,
    targetCityName: input.targetCityName,
    equivalentGrossMonthlyMinorUnits: targetGrossMinor,
    equivalentGrossMajor: targetGrossMajor,
    equivalentNetMajor: targetNetMajor,
    indexType: input.indexType,
    equivalenceLogic,
    periodicity,
    sourceFoodItem: sourceFood,
    targetFoodItem: targetFood,
    foodParityRatio,
    targetRentMajor,
    targetDiscretionaryMajor: targetDiscretionarySavings,
    targetSavingsMajor: Math.max(0, Math.round(targetDiscretionarySavings * 0.5)),
    sourceSummary,
    targetSummary,
    explanation,
  };
}


