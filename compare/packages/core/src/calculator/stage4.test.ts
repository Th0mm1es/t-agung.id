import { describe, it, expect } from "vitest";
import { calculateAusbildungDetailed, DE_GRUNDFREIBETRAG_MONTHLY_CENTS } from "./pathways/ausbildung.js";
import { calculateJapanTraineeDetailed, JP_EMPLOYER_DORM_CAP_YEN } from "./pathways/japan_trainee.js";
import { calculateFamilyHousehold } from "./family/childcare.js";
import { calculateCommuterTradeoff } from "./commuter/tradeoff.js";

describe("Stage 4 — Ausbildung Detailed Engine", () => {
  it("applies tax exemption when gross is below Grundfreibetrag (€982)", () => {
    const gross = 95000n; // €950/mo
    const res = calculateAusbildungDetailed(gross, 1);

    expect(res.isTaxExempt).toBe(true);
    expect(res.incomeTaxDeduction).toBe(0n);
    expect(res.socialSecurityDeduction).toBeGreaterThan(0n);
  });

  it("applies income tax on amount exceeding Grundfreibetrag", () => {
    const gross = 120000n; // €1200/mo (exceeds €982)
    const res = calculateAusbildungDetailed(gross, 3);

    expect(res.isTaxExempt).toBe(false);
    expect(res.incomeTaxDeduction).toBeGreaterThan(0n);
  });
});

describe("Stage 4 — Japan Trainee Housing Deduction Caps", () => {
  it("detects when employer dorm deduction exceeds ¥15,000 cap", () => {
    const deductions = {
      housingDeduction: 25000n, // ¥25,000 exceeds ¥15,000 cap
      utilitiesDeduction: 5000n,
      shakaiHokenDeduction: 20000n,
      employmentInsurance: 2000n,
      mealsDeduction: 0n,
      otherDeductions: 0n,
    };

    const res = calculateJapanTraineeDetailed(180000n, deductions);
    expect(res.housingDeductionExceedsCap).toBe(true);
    expect(res.excessHousingDeductionYen).toBe(10000n);
  });
});

describe("Stage 4 — Family & Childcare Module", () => {
  it("scales rent and groceries for family with children", () => {
    const res = calculateFamilyHousehold({
      country: "DE",
      composition: "family_children",
      numChildren: 2,
      baseHousingRent: 50000n, // €500
      baseGroceryCost: 20000n,  // €200
    });

    expect(res.scaledHousingRent).toBeGreaterThan(50000n);
    expect(res.scaledGroceryCost).toBeGreaterThan(20000n);
    expect(res.monthlyKindergeldAllowance).toBe(51000n); // 2 × €255 = €510
  });
});

describe("Stage 4 — Commuter Trade-Off Engine", () => {
  it("computes net monthly savings for suburban zone", () => {
    const res = calculateCommuterTradeoff({
      country: "DE",
      zone: "suburban",
      cityCoreRentMinorUnits: 80000n, // €800
      extraTransitPassCostMinorUnits: 4900n, // €49 Deutschland-ticket
    });

    expect(res.estimatedRentMinorUnits).toBe(60000n); // 25% discount = €600
    expect(res.netMonthlySavingsMinorUnits).toBe(15100n); // (€800 - €600) - €49 = €151
    expect(res.adviceMessage).toContain("saves approximately €151");
  });
});
