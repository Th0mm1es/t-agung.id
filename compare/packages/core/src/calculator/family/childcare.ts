/**
 * @bandinghidup/core — Family & Childcare Personalization Engine
 *
 * Scales household budgets based on family composition and adds childcare fees
 * (Kita in Germany, Hoiku-en in Japan) & official Kindergeld child benefits context.
 */

import Decimal from "decimal.js";
import type { CountryCode } from "../housing.js";

export type FamilyComposition =
  | "single"
  | "couple_1inc"
  | "couple_2inc"
  | "family_children";

export interface FamilyScalingInput {
  country: CountryCode;
  composition: FamilyComposition;
  numChildren: number;
  baseHousingRent: bigint;
  baseGroceryCost: bigint;
}

export interface FamilyScalingResult {
  composition: FamilyComposition;
  numChildren: number;
  scaledHousingRent: bigint;
  scaledGroceryCost: bigint;
  monthlyChildcareCost: bigint;
  monthlyKindergeldAllowance: bigint; // Contextual child benefit (e.g. €259/child in DE)
  netChildcareExpense: bigint; // childcareCost - kindergeld
  familyHousingMultiplier: number;
  familyGroceryMultiplier: number;
}

/** Germany Kindergeld 2026: €259 / child / month (25900 cents, arbeitsagentur.de 2026-01) */
export const DE_KINDERGELD_PER_CHILD_CENTS = 25900n;

/** Germany Kita average monthly fee estimate: €150 / child / month (15000 cents) */
export const DE_KITA_FEE_PER_CHILD_CENTS = 15000n;

/** Japan Hoiku-en average monthly fee estimate: ¥25,000 / child / month */
export const JP_HOIKUEN_FEE_PER_CHILD_YEN = 25000n;

export function calculateFamilyHousehold(input: FamilyScalingInput): FamilyScalingResult {
  const { country, composition, numChildren, baseHousingRent, baseGroceryCost } = input;

  let housingMultiplier = 1.0;
  let groceryMultiplier = 1.0;

  if (composition === "couple_1inc" || composition === "couple_2inc") {
    housingMultiplier = 1.25; // 25% larger flat
    groceryMultiplier = 1.60; // 60% more food
  } else if (composition === "family_children") {
    const childAdd = Math.min(numChildren, 3) * 0.15;
    housingMultiplier = 1.40 + childAdd; // 2-bed / family apartment
    groceryMultiplier = 1.60 + Math.min(numChildren, 3) * 0.30;
  }

  const scaledHousingRent = BigInt(
    new Decimal(baseHousingRent.toString()).mul(housingMultiplier).toFixed(0, Decimal.ROUND_HALF_UP)
  );

  const scaledGroceryCost = BigInt(
    new Decimal(baseGroceryCost.toString()).mul(groceryMultiplier).toFixed(0, Decimal.ROUND_HALF_UP)
  );

  let monthlyChildcareCost = 0n;
  let monthlyKindergeldAllowance = 0n;

  if (composition === "family_children" && numChildren > 0) {
    if (country === "DE") {
      monthlyChildcareCost = DE_KITA_FEE_PER_CHILD_CENTS * BigInt(numChildren);
      monthlyKindergeldAllowance = DE_KINDERGELD_PER_CHILD_CENTS * BigInt(numChildren);
    } else if (country === "JP") {
      monthlyChildcareCost = JP_HOIKUEN_FEE_PER_CHILD_YEN * BigInt(numChildren);
      monthlyKindergeldAllowance = 15000n * BigInt(numChildren); // ¥15,000/child J児童手当
    }
  }

  const netChildcareExpense =
    monthlyChildcareCost > monthlyKindergeldAllowance
      ? monthlyChildcareCost - monthlyKindergeldAllowance
      : 0n;

  return {
    composition,
    numChildren,
    scaledHousingRent,
    scaledGroceryCost,
    monthlyChildcareCost,
    monthlyKindergeldAllowance,
    netChildcareExpense,
    familyHousingMultiplier: housingMultiplier,
    familyGroceryMultiplier: groceryMultiplier,
  };
}

export function calculateChildBenefit(country: CountryCode, numChildren: number): {
  monthlyBenefitMinorUnits: bigint;
  monthlyBenefitMajor: number;
  benefitNameId: string;
  benefitNameEn: string;
  benefitNameDe: string;
  benefitNameJa: string;
} {
  if (numChildren <= 0) {
    return {
      monthlyBenefitMinorUnits: 0n,
      monthlyBenefitMajor: 0,
      benefitNameId: "-",
      benefitNameEn: "-",
      benefitNameDe: "-",
      benefitNameJa: "-",
    };
  }
  if (country === "DE") {
    const minor = DE_KINDERGELD_PER_CHILD_CENTS * BigInt(numChildren);
    return {
      monthlyBenefitMinorUnits: minor,
      monthlyBenefitMajor: 259 * numChildren,
      benefitNameId: `Tunjangan Anak (Kindergeld: €${259 * numChildren}/bln)`,
      benefitNameEn: `Child Benefit (Kindergeld: €${259 * numChildren}/mo)`,
      benefitNameDe: `Kindergeld (€${259 * numChildren}/Monat)`,
      benefitNameJa: `Kindergeld（ドイツ子供手当: €${259 * numChildren}/月）`,
    };
  }
  if (country === "JP") {
    const minor = 15000n * BigInt(numChildren);
    return {
      monthlyBenefitMinorUnits: minor,
      monthlyBenefitMajor: 15000 * numChildren,
      benefitNameId: `Tunjangan Anak Jepang (Kodomo Teate: ¥${(15000 * numChildren).toLocaleString()}/bln)`,
      benefitNameEn: `Japan Child Allowance (Jido Teate: ¥${(15000 * numChildren).toLocaleString()}/mo)`,
      benefitNameDe: `Kindergeld Japan (Jido Teate: ¥${(15000 * numChildren).toLocaleString()}/Monat)`,
      benefitNameJa: `児童手当（¥${(15000 * numChildren).toLocaleString()}/月）`,
    };
  }
  return {
    monthlyBenefitMinorUnits: 0n,
    monthlyBenefitMajor: 0,
    benefitNameId: "-",
    benefitNameEn: "-",
    benefitNameDe: "-",
    benefitNameJa: "-",
  };
}
