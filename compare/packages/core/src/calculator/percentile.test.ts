import { describe, it, expect } from "vitest";
import {
  calculateIncomePercentile,
  compareIncomePercentiles,
  DEFAULT_PERCENTILE_ANCHORS,
} from "./percentile.js";
import {
  calculateLifestyleEquivalenceSalary,
  DEFAULT_STREET_FOOD_PRICES,
  DEFAULT_BIG_MAC_PRICES,
} from "./bigmac.js";

describe("Income Percentile Engine", () => {
  it("calculates correct median percentile for Indonesia", () => {
    // Median in Indonesia anchor is Rp 4.200.000 (P50)
    const res = calculateIncomePercentile(4200000n, "ID");
    expect(res.percentile).toBe(50);
    expect(res.topPercentage).toBe(50);
    expect(res.ratioToMedian).toBe(1.0);
  });

  it("calculates high percentile for Indonesia above P90", () => {
    // Rp 15.000.000 is P90 anchor
    const res = calculateIncomePercentile(15000000n, "ID");
    expect(res.percentile).toBe(90);
    expect(res.topPercentage).toBe(10);
  });

  it("calculates percentile for Germany Vollzeit salary", () => {
    // €3.650 (365.000 cents) is Median in Germany
    const res = calculateIncomePercentile(365000n, "DE");
    expect(res.percentile).toBe(50);
  });

  it("calculates percentile for Japan salary", () => {
    // ¥320.000 is Median in Japan
    const res = calculateIncomePercentile(320000n, "JP");
    expect(res.percentile).toBe(50);
  });

  it("compares percentiles across all 3 countries simultaneously", () => {
    // Compare Rp 15.000.000 (~€872 / ~¥142.000)
    const res = compareIncomePercentiles(15000000n, "ID");
    expect(res.ID.percentile).toBe(90);
    // In Germany and Japan, €872 and ¥142k are lower in distribution (below median)
    expect(res.DE.percentile).toBeLessThan(30);
    expect(res.JP.percentile).toBeLessThan(30);
  });
});

describe("Lifestyle Equivalence Salary Calculation", () => {
  it("calculates equivalent salary in Berlin from Jakarta using Big Mac Index", () => {
    const res = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: 10000000n, // Rp 10.000.000
      targetCountry: "DE",
      targetCityName: "Berlin",
      indexType: "big_mac",
    });

    expect(res.sourceGrossMajor).toBe(10000000);
    expect(res.targetCountry).toBe("DE");
    // Equivalent gross in Germany should be realistic for maintaining same discretionary
    expect(res.equivalentGrossMajor).toBeGreaterThan(1500); // at least €1.500+
    expect(res.equivalentGrossMajor).toBeLessThan(4500);
    expect(res.foodParityRatio).toBeGreaterThan(0);
    expect(res.explanation.id).toContain("Jakarta");
    expect(res.explanation.id).toContain("Berlin");
  });

  it("calculates equivalent salary in Tokyo from Jakarta using Street Food Index", () => {
    const res = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: 8000000n, // Rp 8.000.000
      targetCountry: "JP",
      targetCityName: "Tokyo",
      indexType: "street_food",
    });

    expect(res.sourceFoodItem.itemName).toBe(DEFAULT_STREET_FOOD_PRICES.ID.itemName);
    expect(res.targetFoodItem.itemName).toBe(DEFAULT_STREET_FOOD_PRICES.JP.itemName);
    // In Tokyo, equivalent gross should be around ¥200k - ¥350k
    expect(res.equivalentGrossMajor).toBeGreaterThan(180000);
    expect(res.equivalentGrossMajor).toBeLessThan(450000);
  });
});
