/**
 * @bandinghidup/core — Apify Scraper Output Adapter
 *
 * Validates raw HTML/JSON rental listing or item payloads scraped by Apify crawlers.
 * Calculates median prices, filters outliers, and produces normalized proposal structures.
 */

import Decimal from "decimal.js";

export interface ApifyRawListingItem {
  id: string;
  sourceUrl: string;
  cityName: string;
  countryCode: "DE" | "JP";
  categoryCode: "housing" | "food" | "transport" | "utilities" | "lifestyle";
  rawPriceAmount: number; // Major unit (e.g. 550.00 EUR or 45000 JPY)
  currency: "EUR" | "JPY";
}

export interface ApifyBatchScrapeOutput {
  actorRunId: string;
  scrapedAt: string;
  items: ApifyRawListingItem[];
}

/**
 * Calculate median of array of numbers
 */
export function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const val1 = sorted[mid - 1] ?? 0;
    const val2 = sorted[mid] ?? 0;
    return (val1 + val2) / 2;
  }
  return sorted[mid] ?? 0;
}

/**
 * Filter extreme outliers using IQR method (Interquartile Range)
 */
export function filterOutliers(numbers: number[]): number[] {
  if (numbers.length < 4) return numbers;
  const sorted = [...numbers].sort((a, b) => a - b);
  const q1 = calculateMedian(sorted.slice(0, Math.floor(sorted.length / 2)));
  const q3 = calculateMedian(sorted.slice(Math.ceil(sorted.length / 2)));
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  return sorted.filter((n) => n >= lowerBound && n <= upperBound);
}

/**
 * Parse a batch of scraped listings from Apify, remove outliers,
 * calculate median price, and produce a normalized proposal.
 */
export function processApifyBatch(batch: ApifyBatchScrapeOutput): {
  sourceCode: string;
  cityName: string;
  categoryCode: string;
  proposedValueMinorUnits: bigint;
  currencyCode: "EUR" | "JPY";
  confidenceScore: number; // based on sample size
  sampleCount: number;
  rationale: string;
} {
  const sample = batch.items[0];
  if (!sample) {
    throw new Error("Apify batch output contains zero items");
  }

  const rawPrices = batch.items.map((i) => i.rawPriceAmount);
  const cleanedPrices = filterOutliers(rawPrices);
  const medianPrice = calculateMedian(cleanedPrices);

  // Convert to minor units (EUR cents = x100, JPY yen = x1)
  const multiplier = sample.currency === "EUR" ? 100 : 1;
  const minorUnits = BigInt(
    new Decimal(medianPrice).mul(multiplier).toFixed(0, Decimal.ROUND_HALF_UP)
  );

  // Confidence score derived from sample size (max 0.85 for scraped data)
  const confidenceScore = Math.min(0.85, 0.5 + Math.min(cleanedPrices.length, 35) * 0.01);

  return {
    sourceCode: sample.countryCode === "DE" ? "apify_housing_de" : "apify_housing_jp",
    cityName: sample.cityName,
    categoryCode: sample.categoryCode,
    proposedValueMinorUnits: minorUnits,
    currencyCode: sample.currency,
    confidenceScore: Number(confidenceScore.toFixed(2)),
    sampleCount: cleanedPrices.length,
    rationale: `Scraped ${batch.items.length} listings via Apify actor ${batch.actorRunId}. Cleaned sample: ${cleanedPrices.length} listings. Computed median: ${medianPrice} ${sample.currency}.`,
  };
}
