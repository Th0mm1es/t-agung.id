/**
 * @bandinghidup/core — Destatis / GENESIS-Online Data Adapter
 *
 * Parses raw statistical tables from the German Federal Statistical Office (Destatis GENESIS-Online).
 * Normalizes Consumer Price Index (VPI) sub-indices and average prices into minor unit proposals.
 */

import Decimal from "decimal.js";

export interface DestatisRawCpiPayload {
  tableCode: string; // e.g. '61111-0002'
  period: string;    // e.g. '2026-01'
  categoryName: string; // e.g. 'Wohnungsmiete' (housing rent)
  cpiIndexValue: number; // e.g. 118.4 (base 2020 = 100)
  basePriceEurCents: number; // e.g. 45000 (cents)
  cityCode: string;  // e.g. 'STUTTGART' | 'BERLIN'
}

export interface NormalizedProposalOutput {
  sourceCode: string;
  cityName: string;
  categoryCode: string;
  proposedValueMinorUnits: bigint;
  currencyCode: "EUR" | "JPY" | "IDR";
  confidenceScore: number; // 0.00 - 1.00
  rationale: string;
}

const DESTATIS_CATEGORY_MAP: Record<string, string> = {
  Wohnungsmiete: "housing",
  Strom_Gas_Wasser: "utilities",
  Nahrungsmittel: "food",
  ÖPNV_Fahrkarte: "transport",
  Freizeit_Kultur: "lifestyle",
};

/**
 * Parse Destatis raw payload and compute normalized cost proposal in EUR cents.
 */
export function parseDestatisPayload(payload: DestatisRawCpiPayload): NormalizedProposalOutput {
  const categoryCode = DESTATIS_CATEGORY_MAP[payload.categoryName] ?? "lifestyle";

  // Adjusted price = base price * (current index / 100)
  const adjustedPriceCents = new Decimal(payload.basePriceEurCents)
    .mul(new Decimal(payload.cpiIndexValue).div(100))
    .toFixed(0, Decimal.ROUND_HALF_UP);

  const proposedValueMinorUnits = BigInt(adjustedPriceCents);

  return {
    sourceCode: "destatis",
    cityName: payload.cityCode,
    categoryCode,
    proposedValueMinorUnits,
    currencyCode: "EUR",
    confidenceScore: 0.95, // Tier 1 Official Stat
    rationale: `Computed from Destatis table ${payload.tableCode} (${payload.period}) CPI index ${payload.cpiIndexValue} for category '${payload.categoryName}'.`,
  };
}
