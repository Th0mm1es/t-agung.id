/**
 * @bandinghidup/core — Income Percentile Engine
 *
 * Computes individual wage/income percentile rank within Germany, Japan, and Indonesia
 * using statistical distribution anchors from official sources:
 * - Indonesia: BPS Susenas / Sakernas (Survei Angkatan Kerja Nasional)
 * - Japan: e-Stat / MHLW (国民生活基礎調査 - Comprehensive Survey of Living Conditions)
 * - Germany: Destatis / SOEP (Socio-Economic Panel) / IW Köln
 */

import Decimal from "decimal.js";

export type PercentileCountry = "ID" | "JP" | "DE";

export interface IncomePercentileAnchor {
  percentile: number; // e.g. 10, 25, 50, 75, 90, 95, 99
  grossMonthlyMinorUnits: bigint;
}

/**
 * Standard calibrated percentile anchors for formal individual monthly gross income.
 * Updatable via automated cronjob into Supabase `income_percentiles`.
 */
export const DEFAULT_PERCENTILE_ANCHORS: Record<PercentileCountry, IncomePercentileAnchor[]> = {
  ID: [
    { percentile: 10, grossMonthlyMinorUnits: 1800000n }, // Rp 1.800.000
    { percentile: 25, grossMonthlyMinorUnits: 3000000n }, // Rp 3.000.000
    { percentile: 50, grossMonthlyMinorUnits: 4200000n }, // Rp 4.200.000 (Median)
    { percentile: 75, grossMonthlyMinorUnits: 7500000n }, // Rp 7.500.000
    { percentile: 90, grossMonthlyMinorUnits: 15000000n }, // Rp 15.000.000
    { percentile: 95, grossMonthlyMinorUnits: 25000000n }, // Rp 25.000.000
    { percentile: 99, grossMonthlyMinorUnits: 50000000n }, // Rp 50.000.000+
  ],
  JP: [
    { percentile: 10, grossMonthlyMinorUnits: 140000n }, // ¥140.000
    { percentile: 25, grossMonthlyMinorUnits: 200000n }, // ¥200.000 (Kenshusei / Fresh Grad entry)
    { percentile: 50, grossMonthlyMinorUnits: 320000n }, // ¥320.000 (Median)
    { percentile: 75, grossMonthlyMinorUnits: 480000n }, // ¥480.000
    { percentile: 90, grossMonthlyMinorUnits: 750000n }, // ¥750.000
    { percentile: 95, grossMonthlyMinorUnits: 950000n }, // ¥950.000
    { percentile: 99, grossMonthlyMinorUnits: 1500000n }, // ¥1.500.000+
  ],
  DE: [
    { percentile: 10, grossMonthlyMinorUnits: 185000n }, // €1.850 (in cents)
    { percentile: 25, grossMonthlyMinorUnits: 260000n }, // €2.600
    { percentile: 50, grossMonthlyMinorUnits: 365000n }, // €3.650 (Median Vollzeit)
    { percentile: 75, grossMonthlyMinorUnits: 520000n }, // €5.200
    { percentile: 90, grossMonthlyMinorUnits: 740000n }, // €7.400
    { percentile: 95, grossMonthlyMinorUnits: 920000n }, // €9.200
    { percentile: 99, grossMonthlyMinorUnits: 1500000n }, // €15.000+
  ],
};

export interface PercentileCalculationResult {
  country: PercentileCountry;
  grossMonthlyMinorUnits: bigint;
  percentile: number; // 1 to 99
  topPercentage: number; // e.g. 100 - percentile (Top 10%)
  medianMinorUnits: bigint;
  ratioToMedian: number; // e.g. 1.25x median
  description: {
    id: string;
    en: string;
    de: string;
    ja: string;
  };
}

/**
 * Calculate the income percentile rank for a given gross monthly salary.
 * Uses piecewise log-linear interpolation across statistical anchor points.
 */
export function calculateIncomePercentile(
  grossMonthlyMinorUnits: bigint,
  country: PercentileCountry,
  customAnchors?: IncomePercentileAnchor[]
): PercentileCalculationResult {
  const safeAnchors = (customAnchors && customAnchors.length > 0
    ? [...customAnchors].sort((a, b) => a.percentile - b.percentile)
    : DEFAULT_PERCENTILE_ANCHORS[country]) as [IncomePercentileAnchor, ...IncomePercentileAnchor[]];

  const valDec = new Decimal(grossMonthlyMinorUnits.toString());
  const medianAnchor = safeAnchors.find((a) => a.percentile === 50) ?? safeAnchors[Math.floor(safeAnchors.length / 2)] ?? safeAnchors[0];
  const medianDec = new Decimal(medianAnchor.grossMonthlyMinorUnits.toString());
  const ratioToMedian = Number(valDec.div(medianDec).toFixed(2));

  let percentile = 50;

  const firstAnchor = safeAnchors[0];
  const lastAnchor = safeAnchors[safeAnchors.length - 1] ?? firstAnchor;

  if (valDec.lte(0)) {
    percentile = 1;
  } else if (valDec.lte(new Decimal(firstAnchor.grossMonthlyMinorUnits.toString()))) {
    // Below lowest anchor (P10)
    const p10Dec = new Decimal(firstAnchor.grossMonthlyMinorUnits.toString());
    const ratio = valDec.div(p10Dec);
    percentile = Math.max(1, Number(ratio.mul(firstAnchor.percentile).toFixed(0)));
  } else if (valDec.gte(new Decimal(lastAnchor.grossMonthlyMinorUnits.toString()))) {
    // Above highest anchor (P99)
    percentile = 99;
  } else {
    // Piecewise log-linear interpolation between anchors
    for (let i = 0; i < safeAnchors.length - 1; i++) {
      const lower = safeAnchors[i];
      const upper = safeAnchors[i + 1];
      if (!lower || !upper) continue;

      const lowerDec = new Decimal(lower.grossMonthlyMinorUnits.toString());
      const upperDec = new Decimal(upper.grossMonthlyMinorUnits.toString());

      if (valDec.gte(lowerDec) && valDec.lte(upperDec)) {
        // Log-linear interpolation
        const logVal = Decimal.ln(valDec);
        const logLower = Decimal.ln(lowerDec);
        const logUpper = Decimal.ln(upperDec);
        const fraction = logVal.minus(logLower).div(logUpper.minus(logLower));

        const pDiff = upper.percentile - lower.percentile;
        const interpP = new Decimal(lower.percentile).plus(fraction.mul(pDiff));
        percentile = Math.min(99, Math.max(1, Math.round(Number(interpP.toFixed(1)))));
        break;
      }
    }
  }

  const topPercentage = 100 - percentile;

  const countryNames = {
    ID: { id: "Indonesia", en: "Indonesia", de: "Indonesien", ja: "インドネシア" },
    JP: { id: "Jepang", en: "Japan", de: "Japan", ja: "日本" },
    DE: { id: "Jerman", en: "Germany", de: "Deutschland", ja: "ドイツ" },
  };

  const cName = countryNames[country];

  const description = {
    id: `Penghasilan Anda berada di persentil ke-${percentile} (Top ${topPercentage}%) di ${cName.id}. Sekitar ${percentile}% pekerja memiliki pendapatan di bawah angka ini.`,
    en: `Your income ranks in the ${percentile}th percentile (Top ${topPercentage}%) in ${cName.en}. About ${percentile}% of workers earn less than this.`,
    de: `Ihr Einkommen liegt im ${percentile}. Perzentil (Top ${topPercentage}%) in ${cName.de}. Rund ${percentile}% der Beschäftigten verdienen weniger als diesen Betrag.`,
    ja: `あなたの月収は${cName.ja}の所得上位${topPercentage}%（パーセンタイル第${percentile}位）に位置します。就業者の約${percentile}%がこの金額を下回っています。`,
  };

  return {
    country,
    grossMonthlyMinorUnits,
    percentile,
    topPercentage,
    medianMinorUnits: medianAnchor.grossMonthlyMinorUnits,
    ratioToMedian,
    description,
  };
}

/**
 * Compare an income across all 3 countries simultaneously.
 * Converts nominal gross salary using live or fallback exchange rates,
 * then evaluates its percentile rank in each respective domestic distribution.
 */
export function compareIncomePercentiles(
  sourceGrossMinor: bigint,
  sourceCountry: PercentileCountry,
  exchangeRates?: Record<string, number>
): Record<PercentileCountry, PercentileCalculationResult & { convertedGrossMajor: number; currency: string }> {
  // Exchange rates relative to EUR
  const rates = exchangeRates ?? {
    EUR: 1.0,
    JPY: 163.5,
    IDR: 17200.0,
  };

  const currencyMap: Record<PercentileCountry, "EUR" | "JPY" | "IDR"> = {
    DE: "EUR",
    JP: "JPY",
    ID: "IDR",
  };

  const decimals: Record<PercentileCountry, number> = {
    DE: 2,
    JP: 0,
    ID: 0,
  };

  // Convert source to EUR major
  const sourceCurrency = currencyMap[sourceCountry];
  const sourceMajor = Number(sourceGrossMinor) / Math.pow(10, decimals[sourceCountry]);
  const sourceEurRate = rates[sourceCurrency] ?? 1;
  const eurMajor = sourceMajor / sourceEurRate;

  const result: any = {};

  const countries: PercentileCountry[] = ["ID", "JP", "DE"];

  for (const c of countries) {
    const targetCurrency = currencyMap[c];
    const targetRate = rates[targetCurrency] ?? 1;
    const targetMajor = eurMajor * targetRate;
    const targetMinor = BigInt(Math.round(targetMajor * Math.pow(10, decimals[c])));

    const calc = calculateIncomePercentile(targetMinor, c);
    result[c] = {
      ...calc,
      convertedGrossMajor: Math.round(targetMajor),
      currency: targetCurrency,
    };
  }

  return result;
}
