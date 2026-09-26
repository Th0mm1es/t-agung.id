/**
 * @bandinghidup/core — Suburban vs. City Core Commuter Trade-Off Engine
 *
 * Computes housing rent vs. transit pass tradeoffs:
 * Suburban Savings = (City Core Rent - Suburban Rent) - Extra Transit Cost.
 */

import type { CountryCode } from "../housing.js";

export type CommuterZone = "city_core" | "suburban";

export interface CommuterTradeoffInput {
  country: CountryCode;
  zone: CommuterZone;
  cityCoreRentMinorUnits: bigint;
  extraTransitPassCostMinorUnits: bigint;
}

export interface CommuterTradeoffResult {
  zone: CommuterZone;
  estimatedRentMinorUnits: bigint;
  extraTransitCostMinorUnits: bigint;
  netMonthlySavingsMinorUnits: bigint;
  adviceMessage: string;
}

/** Average suburban rent discount multiplier: ~25% cheaper than city core */
export const SUBURBAN_RENT_DISCOUNT_MULTIPLIER = 0.75;

export function calculateCommuterTradeoff(input: CommuterTradeoffInput): CommuterTradeoffResult {
  const { country, zone, cityCoreRentMinorUnits, extraTransitPassCostMinorUnits } = input;

  if (zone === "city_core") {
    return {
      zone,
      estimatedRentMinorUnits: cityCoreRentMinorUnits,
      extraTransitCostMinorUnits: 0n,
      netMonthlySavingsMinorUnits: 0n,
      adviceMessage: "Living in the City Core minimizes commute times and public transit costs, but housing rents are higher.",
    };
  }

  // Suburban zone (25% rent discount)
  const estimatedSuburbanRent = BigInt(Math.round(Number(cityCoreRentMinorUnits) * SUBURBAN_RENT_DISCOUNT_MULTIPLIER));
  const grossRentSavings = cityCoreRentMinorUnits - estimatedSuburbanRent;
  const netMonthlySavings = grossRentSavings > extraTransitPassCostMinorUnits ? grossRentSavings - extraTransitPassCostMinorUnits : 0n;

  const symbol = country === "DE" ? "€" : country === "JP" ? "¥" : "Rp";
  const displaySavings = Number(netMonthlySavings) / (country === "DE" ? 100 : 1);

  const adviceMessage = netMonthlySavings > 0n
    ? `Living in the suburban zone saves approximately ${symbol}${displaySavings}/month in net housing costs after accounting for the extra commuter transit pass.`
    : "Suburban rent savings are offset by higher commuter transit pass costs. Consider staying in City Core.";

  return {
    zone,
    estimatedRentMinorUnits: estimatedSuburbanRent,
    extraTransitCostMinorUnits: extraTransitPassCostMinorUnits,
    netMonthlySavingsMinorUnits: netMonthlySavings,
    adviceMessage,
  };
}
