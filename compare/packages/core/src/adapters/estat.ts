/**
 * @bandinghidup/core — Japan e-Stat Data Adapter
 *
 * Parses raw statistical tables from Japan Government Statistics (e-Stat).
 * Converts Household Expenditure Survey (家計調査) tables into JPY yen minor unit proposals.
 */

export interface EStatRawPayload {
  statId: string;        // e.g., '000342352'
  surveyYear: number;    // e.g., 2025
  prefectureCode: string;// e.g., '13000' (Tokyo), '23000' (Aichi/Nagoya)
  cityName: string;      // e.g., 'Tokyo' | 'Nagoya' | 'Osaka'
  itemCode: string;      // e.g., '01.01.01'
  itemNameJp: string;    // e.g., '家賃' (Rent) | '外食' (Eating out)
  monthlyAverageYen: number; // e.g. 58000 (yen)
}

const ESTAT_CATEGORY_MAP: Record<string, string> = {
  家賃: "housing",
  民営家賃: "housing",
  電気代: "utilities",
  水道光熱費: "utilities",
  食料: "food",
  外食: "food",
  交通: "transport",
  教養娯楽: "lifestyle",
};

/**
 * Parse e-Stat raw payload and compute normalized cost proposal in JPY yen.
 */
export function parseEStatPayload(payload: EStatRawPayload): {
  sourceCode: string;
  cityName: string;
  categoryCode: string;
  proposedValueMinorUnits: bigint;
  currencyCode: "JPY";
  confidenceScore: number;
  rationale: string;
} {
  const categoryCode = ESTAT_CATEGORY_MAP[payload.itemNameJp] ?? "lifestyle";
  const proposedValueMinorUnits = BigInt(Math.round(payload.monthlyAverageYen));

  return {
    sourceCode: "estat",
    cityName: payload.cityName,
    categoryCode,
    proposedValueMinorUnits,
    currencyCode: "JPY",
    confidenceScore: 0.95, // Tier 1 Official Stat
    rationale: `Extracted from Japan e-Stat survey ${payload.statId} (${payload.surveyYear}) for prefecture ${payload.prefectureCode} item '${payload.itemNameJp}'.`,
  };
}
