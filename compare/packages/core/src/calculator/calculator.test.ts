import { describe, it, expect } from "vitest";
import {
  calculateAusbildungNet,
  calculateJapaneseTraineeNet,
  calculateGenericNet,
  AUSBILDUNG_REFERENCE_GROSS,
  GERMANY_SUFFICIENCY_BENCHMARK_CENTS,
  type JapaneseTraineeDeductions,
} from "./income.js";
import {
  calculateMonthlyHousing,
  calculateUpfrontRelocation,
  getDefaultRelocationPreset,
} from "./housing.js";
import { buildExpenseBasket } from "./baskets.js";
import { evaluateDiagnostics, getOverallSeverity } from "./diagnostics.js";
import { computeScenario, type ScenarioInput } from "./scenario.js";

// ─── Income Tests ─────────────────────────────────────────────────────────────

describe("calculateAusbildungNet", () => {
  it("computes Year 1 Ausbildung net with ~21.6% deduction", () => {
    const gross = 100000n; // €1000 in cents
    const result = calculateAusbildungNet(gross, 1);

    // Total deduction should be ~21.6% (19.6% SS + 2% tax)
    expect(result.grossMonthly).toBe(100000n);
    expect(result.netMonthly).toBeLessThan(gross);
    expect(result.totalDeductions).toBeGreaterThan(0n);
    expect(result.effectiveDeductionRate).toBeCloseTo(0.216, 2);
    expect(result.germanSufficiencyBenchmarkNet).toBe(GERMANY_SUFFICIENCY_BENCHMARK_CENTS);
  });

  it("Year 2 and 3 produce higher net incomes", () => {
    const year2Gross = AUSBILDUNG_REFERENCE_GROSS[2];
    const year3Gross = AUSBILDUNG_REFERENCE_GROSS[3];
    const r2 = calculateAusbildungNet(year2Gross, 2);
    const r3 = calculateAusbildungNet(year3Gross, 3);

    expect(r3.netMonthly).toBeGreaterThan(r2.netMonthly);
  });

  it("accepts manual net override (payslip entered directly)", () => {
    const gross = 100000n;  // €1000
    const manualNet = 82000n; // €820 user's actual payslip
    const result = calculateAusbildungNet(gross, 1, manualNet);

    expect(result.netMonthly).toBe(82000n);
    expect(result.totalDeductions).toBe(18000n);
    expect(result.effectiveDeductionRate).toBeCloseTo(0.18, 2);
  });

  it("throws for negative gross income", () => {
    expect(() => calculateAusbildungNet(-100n, 1)).toThrow(RangeError);
  });

  it("handles zero gross income", () => {
    const result = calculateAusbildungNet(0n, 1);
    expect(result.grossMonthly).toBe(0n);
    expect(result.netMonthly).toBe(0n);
    expect(result.effectiveDeductionRate).toBe(0);
  });

  it("net income is never negative (clamped to 0)", () => {
    // If somehow deductions exceed gross (edge case)
    const result = calculateAusbildungNet(100n, 1); // Very small gross
    expect(result.netMonthly).toBeGreaterThanOrEqual(0n);
  });
});

describe("calculateJapaneseTraineeNet (Gakumen → Tedori)", () => {
  const fullDeductions: JapaneseTraineeDeductions = {
    housingDeduction: 25000n,       // ¥25,000
    utilitiesDeduction: 5000n,      // ¥5,000
    shakaiHokenDeduction: 20000n,   // ¥20,000
    employmentInsurance: 2000n,     // ¥2,000
    mealsDeduction: 10000n,         // ¥10,000
    otherDeductions: 3000n,         // ¥3,000
  };                                // Total: ¥65,000

  it("correctly calculates tedori from gakumen with full deductions", () => {
    const gross = 200000n; // ¥200,000 gakumen
    const result = calculateJapaneseTraineeNet(gross, fullDeductions);

    expect(result.grossMonthly).toBe(200000n);
    expect(result.totalContractDeductions).toBe(65000n);
    expect(result.netMonthly).toBe(135000n); // ¥200,000 - ¥65,000
    expect(result.effectiveDeductionRate).toBeCloseTo(0.325, 3);
    expect(result.hasMissingDeductions).toBe(false);
  });

  it("detects missing deductions (hasMissingDeductions = true)", () => {
    const zeroDeductions: JapaneseTraineeDeductions = {
      housingDeduction: 0n,
      utilitiesDeduction: 0n,
      shakaiHokenDeduction: 0n,
      employmentInsurance: 0n,
      mealsDeduction: 0n,
      otherDeductions: 0n,
    };
    const result = calculateJapaneseTraineeNet(180000n, zeroDeductions);

    expect(result.hasMissingDeductions).toBe(true);
    expect(result.netMonthly).toBe(180000n); // No deductions = tedori = gakumen (unrealistic)
    expect(result.totalContractDeductions).toBe(0n);
  });

  it("partial deductions are handled correctly", () => {
    const partial: JapaneseTraineeDeductions = {
      housingDeduction: 30000n,
      utilitiesDeduction: 0n,
      shakaiHokenDeduction: 18000n,
      employmentInsurance: 1800n,
      mealsDeduction: 0n,
      otherDeductions: 0n,
    };
    const result = calculateJapaneseTraineeNet(180000n, partial);
    expect(result.totalContractDeductions).toBe(49800n);
    expect(result.netMonthly).toBe(130200n);
    expect(result.hasMissingDeductions).toBe(false);
  });

  it("net monthly is never negative", () => {
    // Edge: deductions exceed gross
    const excessive: JapaneseTraineeDeductions = {
      housingDeduction: 200000n,
      utilitiesDeduction: 0n,
      shakaiHokenDeduction: 0n,
      employmentInsurance: 0n,
      mealsDeduction: 0n,
      otherDeductions: 0n,
    };
    const result = calculateJapaneseTraineeNet(180000n, excessive);
    expect(result.netMonthly).toBe(0n);
  });

  it("throws for negative gross", () => {
    expect(() => calculateJapaneseTraineeNet(-1n, fullDeductions)).toThrow(RangeError);
  });
});

describe("calculateGenericNet", () => {
  it("applies default 20% deduction", () => {
    const result = calculateGenericNet(100000n);
    expect(result.netMonthly).toBe(80000n);
    expect(result.deductions).toBe(20000n);
    expect(result.effectiveDeductionRate).toBe(0.20);
  });

  it("accepts custom deduction rate", () => {
    const result = calculateGenericNet(100000n, 0.15);
    expect(result.netMonthly).toBe(85000n);
  });

  it("accepts manual net override", () => {
    const result = calculateGenericNet(100000n, 0.20, 78000n);
    expect(result.netMonthly).toBe(78000n);
    expect(result.deductions).toBe(22000n);
  });

  it("throws for invalid deduction rate", () => {
    expect(() => calculateGenericNet(100000n, 1.5)).toThrow(RangeError);
    expect(() => calculateGenericNet(100000n, -0.1)).toThrow(RangeError);
  });
});

// ─── Housing Tests ────────────────────────────────────────────────────────────

describe("calculateMonthlyHousing", () => {
  it("returns rent as net cash out for non-employer-provided", () => {
    const result = calculateMonthlyHousing({
      type: "shared_room",
      monthlyRentMinorUnits: 45000n, // €450
      isEmployerProvided: false,
      country: "DE",
    });
    expect(result.netMonthlyCashOut).toBe(45000n);
  });

  it("returns 0 net cash out for employer-provided housing", () => {
    const result = calculateMonthlyHousing({
      type: "dormitory",
      monthlyRentMinorUnits: 30000n,
      isEmployerProvided: true, // Deducted from wage already
      country: "JP",
    });
    expect(result.netMonthlyCashOut).toBe(0n);
  });

  it("throws for negative rent", () => {
    expect(() =>
      calculateMonthlyHousing({
        type: "studio",
        monthlyRentMinorUnits: -1n,
        isEmployerProvided: false,
        country: "DE",
      })
    ).toThrow(RangeError);
  });
});

describe("calculateUpfrontRelocation (strict separation from monthly)", () => {
  it("Germany: 2 months deposit, no key money", () => {
    const result = calculateUpfrontRelocation({
      country: "DE",
      monthlyRentMinorUnits: 50000n, // €500
      depositMonths: 2,
      keyMoneyMonths: 0,
      agencyFeeMinorUnits: 0n,
      setupCushionMinorUnits: 50000n,
      initialTravelMinorUnits: 150000n,
    });

    expect(result.deposit).toBe(100000n);  // 2 × €500 = €1000
    expect(result.keyMoney).toBe(0n);      // No key money in DE
    expect(result.totalUpfront).toBe(300000n); // €1000 + €500 + €1500 = €3000
    expect(result.formula).toContain("Deposit");
    expect(result.formula).not.toContain("Key Money");
  });

  it("Japan: 1 shikikin + 1 reikin + 1 agency fee", () => {
    const rent = 60000n; // ¥60,000
    const result = calculateUpfrontRelocation({
      country: "JP",
      monthlyRentMinorUnits: rent,
      depositMonths: 1,
      keyMoneyMonths: 1,
      agencyFeeMinorUnits: rent, // 1 month agency fee
      setupCushionMinorUnits: 50000n,
      initialTravelMinorUnits: 150000n,
    });

    expect(result.deposit).toBe(60000n);   // 1× ¥60k
    expect(result.keyMoney).toBe(60000n);  // 1× ¥60k reikin
    expect(result.agencyFee).toBe(60000n); // 1× ¥60k agency
    expect(result.totalUpfront).toBe(380000n); // ¥60k+60k+60k+50k+150k
  });

  it("throws for invalid deposit months", () => {
    expect(() =>
      calculateUpfrontRelocation({
        country: "DE",
        monthlyRentMinorUnits: 50000n,
        depositMonths: 10, // > 6: invalid
        keyMoneyMonths: 0,
        agencyFeeMinorUnits: 0n,
        setupCushionMinorUnits: 0n,
        initialTravelMinorUnits: 0n,
      })
    ).toThrow(RangeError);
  });

  it("strictly produces upfront total (no monthly amounts included)", () => {
    // Monthly rent must NOT be in the totalUpfront
    const rent = 50000n;
    const result = calculateUpfrontRelocation({
      country: "DE",
      monthlyRentMinorUnits: rent,
      depositMonths: 2,
      keyMoneyMonths: 0,
      agencyFeeMinorUnits: 0n,
      setupCushionMinorUnits: 0n,
      initialTravelMinorUnits: 0n,
    });
    // Only deposit (2× rent = 100000) — NOT the rent itself
    expect(result.totalUpfront).toBe(100000n);
    expect(result.totalUpfront).not.toBe(rent * 3n); // NOT gross rent × (2+1)
  });
});

// ─── Expense Basket Tests ─────────────────────────────────────────────────────

describe("buildExpenseBasket", () => {
  it("minimum_viable DE basket has warning", () => {
    const basket = buildExpenseBasket("DE", "minimum_viable");
    expect(basket.profileWarning).toBeDefined();
    expect(basket.profileWarning).toContain("not a comfort recommendation");
  });

  it("comfortable basket costs more than realistic_newcomer", () => {
    const comfortable = buildExpenseBasket("DE", "comfortable");
    const realistic = buildExpenseBasket("DE", "realistic_newcomer");
    expect(comfortable.monthlyGrandTotal).toBeGreaterThan(realistic.monthlyGrandTotal);
  });

  it("JP baskets have no EU cents — all JPY yen", () => {
    const basket = buildExpenseBasket("JP", "realistic_newcomer");
    // JPY amounts should be in whole yen, not cents
    // Quick meal in JP should be around ¥500–800, not €5–8 in cents
    expect(basket.items.quickMeals.unitCostMinorUnits).toBeGreaterThanOrEqual(400n);
    expect(basket.items.quickMeals.unitCostMinorUnits).toBeLessThanOrEqual(1000n);
  });

  it("user override is reflected and marks item as overridden", () => {
    const basket = buildExpenseBasket("DE", "realistic_newcomer", {
      quickMeals: { unitCost: 700n, frequency: 20 },
    });
    expect(basket.items.quickMeals.unitCostMinorUnits).toBe(700n);
    expect(basket.items.quickMeals.monthlyFrequency).toBe(20);
    expect(basket.items.quickMeals.isOverridden).toBe(true);
    expect(basket.items.casualDining.isOverridden).toBe(false);
  });

  it("grand total = food + transport + utilities + lifestyle", () => {
    const basket = buildExpenseBasket("JP", "comfortable");
    const expected =
      basket.monthlyFoodTotal +
      basket.monthlyTransportTotal +
      basket.monthlyUtilitiesTotal +
      basket.monthlyLifestyleTotal;
    expect(basket.monthlyGrandTotal).toBe(expected);
  });
});

// ─── Diagnostics Tests ────────────────────────────────────────────────────────

describe("evaluateDiagnostics", () => {
  it("RED: monthly deficit (expenses > income)", () => {
    const results = evaluateDiagnostics({
      netMonthlyIncome: 80000n,
      totalMonthlyExpenses: 100000n, // Exceeds income
      monthlyHousingCost: 50000n,
      totalUpfrontRelocationCost: 0n,
      availableSavings: 100000n,
      hasZeroDeductionsJPTrainee: false,
      pathway: "ausbildung",
    });

    const red = results.find((r) => r.code === "MONTHLY_DEFICIT");
    expect(red).toBeDefined();
    expect(red?.level).toBe("red");
  });

  it("RED: savings shortfall (upfront costs > savings)", () => {
    const results = evaluateDiagnostics({
      netMonthlyIncome: 120000n,
      totalMonthlyExpenses: 90000n,
      monthlyHousingCost: 45000n,
      totalUpfrontRelocationCost: 300000n, // €3000 upfront
      availableSavings: 100000n,            // only €1000 saved
      hasZeroDeductionsJPTrainee: false,
      pathway: "ausbildung",
    });

    const red = results.find((r) => r.code === "SAVINGS_SHORTFALL");
    expect(red).toBeDefined();
    expect(red?.level).toBe("red");
  });

  it("AMBER: housing > 45% of net income", () => {
    const net = 100000n;
    const rent = 50000n; // 50% of net — exceeds 45% threshold
    const results = evaluateDiagnostics({
      netMonthlyIncome: net,
      totalMonthlyExpenses: 70000n,
      monthlyHousingCost: rent,
      totalUpfrontRelocationCost: 0n,
      availableSavings: 500000n,
      hasZeroDeductionsJPTrainee: false,
      pathway: "ausbildung",
    });

    const amber = results.find((r) => r.code === "HIGH_RENT_SHARE");
    expect(amber).toBeDefined();
    expect(amber?.level).toBe("amber");
  });

  it("AMBER: JP trainee with zero deductions", () => {
    const results = evaluateDiagnostics({
      netMonthlyIncome: 180000n,
      totalMonthlyExpenses: 100000n,
      monthlyHousingCost: 40000n,
      totalUpfrontRelocationCost: 0n,
      availableSavings: 500000n,
      hasZeroDeductionsJPTrainee: true, // ← triggers amber
      pathway: "technical_intern",
    });

    const amber = results.find((r) => r.code === "MISSING_JP_DEDUCTIONS");
    expect(amber).toBeDefined();
    expect(amber?.level).toBe("amber");
  });

  it("GREEN: viable scenario with positive balance and low rent", () => {
    const results = evaluateDiagnostics({
      netMonthlyIncome: 120000n,
      totalMonthlyExpenses: 80000n,    // 67% spent
      monthlyHousingCost: 35000n,      // 29% of net — below 35% threshold
      totalUpfrontRelocationCost: 200000n,
      availableSavings: 500000n,       // Covers upfront
      hasZeroDeductionsJPTrainee: false,
      pathway: "ausbildung",
    });

    const green = results.find((r) => r.code === "VIABLE");
    expect(green).toBeDefined();
    expect(green?.level).toBe("green");
    expect(getOverallSeverity(results)).toBe("green");
  });

  it("diagnostics sorted red > amber > green", () => {
    const results = evaluateDiagnostics({
      netMonthlyIncome: 100000n,
      totalMonthlyExpenses: 120000n,  // deficit → red
      monthlyHousingCost: 55000n,     // 55% rent → also amber
      totalUpfrontRelocationCost: 500000n,
      availableSavings: 100000n,      // shortfall → also red
      hasZeroDeductionsJPTrainee: true, // amber
      pathway: "technical_intern",
    });

    const levels = results.map((r) => r.level);
    const redIdx = levels.indexOf("red");
    const amberIdx = levels.lastIndexOf("amber");
    const greenIdx = levels.lastIndexOf("green");

    // All reds before ambers, ambers before greens (if any green)
    if (redIdx >= 0 && amberIdx >= 0) {
      expect(redIdx).toBeLessThan(amberIdx);
    }
    if (amberIdx >= 0 && greenIdx >= 0) {
      expect(amberIdx).toBeLessThan(greenIdx);
    }
  });
});

// ─── End-to-End Scenario Tests ────────────────────────────────────────────────

describe("computeScenario — end to end", () => {
  const baseAusbildungInput: ScenarioInput = {
    id: "test-scenario-001",
    createdAt: new Date().toISOString(),
    country: "DE",
    cityId: "city-stuttgart",
    cityName: "Stuttgart",
    pathway: "ausbildung",
    grossMonthlyMinorUnits: 100000n, // €1000 gross
    ausbildungTrainingYear: 2,
    housingType: "shared_room",
    monthlyRentMinorUnits: 45000n,   // €450/month WG room
    isEmployerProvidedHousing: false,
    availableSavingsMinorUnits: 500000n, // €5000 savings
    lifestyleProfile: "realistic_newcomer",
    relocationInput: {
      depositMonths: 2,
      keyMoneyMonths: 0,
      agencyFeeMinorUnits: 0n,
      setupCushionMinorUnits: 50000n,
      initialTravelMinorUnits: 150000n,
    },
  };

  it("computes net income, expenses, and balance correctly", () => {
    const result = computeScenario(baseAusbildungInput);

    // Income
    expect(result.income.grossMonthly).toBe(100000n);
    expect(result.income.netMonthly).toBeLessThan(100000n);
    expect(result.income.totalDeductions).toBeGreaterThan(0n);

    // Monthly expenses must include housing
    expect(result.monthlyExpenses.housingRent).toBe(45000n);
    expect(result.monthlyExpenses.total).toBeGreaterThan(45000n);

    // Balance = net - expenses
    const expectedBalance = result.income.netMonthly - result.monthlyExpenses.total;
    expect(result.monthlyBalance).toBe(expectedBalance);
  });

  it("upfront relocation is strictly separated from monthly cash flow", () => {
    const result = computeScenario(baseAusbildungInput);

    // Upfront should be: 2× rent (deposit) + €500 setup + €1500 travel = €3900
    expect(result.upfrontRelocationTotal).toBe(
      result.upfrontDepositAmount +
      result.upfrontKeyMoneyAmount +
      result.upfrontAgencyFeeAmount +
      result.upfrontSetupCushionAmount +
      result.upfrontTravelAmount
    );

    // Monthly balance must NOT include upfront costs
    const monthlyBalanceCheck = result.income.netMonthly - result.monthlyExpenses.total;
    expect(result.monthlyBalance).toBe(monthlyBalanceCheck);
  });

  it("JP trainee with zero deductions triggers amber diagnostic", () => {
    const jpInput: ScenarioInput = {
      id: "test-jp-001",
      createdAt: new Date().toISOString(),
      country: "JP",
      cityId: "city-nagoya",
      cityName: "Nagoya",
      pathway: "technical_intern",
      grossMonthlyMinorUnits: 180000n, // ¥180,000 gakumen
      japaneseDeductions: {            // All zero → triggers amber
        housingDeduction: 0n,
        utilitiesDeduction: 0n,
        shakaiHokenDeduction: 0n,
        employmentInsurance: 0n,
        mealsDeduction: 0n,
        otherDeductions: 0n,
      },
      housingType: "dormitory",
      monthlyRentMinorUnits: 25000n,
      isEmployerProvidedHousing: true,
      availableSavingsMinorUnits: 10000000n,
      lifestyleProfile: "minimum_viable",
    };

    const result = computeScenario(jpInput);
    const amberDiag = result.diagnostics.find((d) => d.code === "MISSING_JP_DEDUCTIONS");
    expect(amberDiag).toBeDefined();
    expect(amberDiag?.level).toBe("amber");
  });

  it("result.computedAt is a valid ISO timestamp", () => {
    const result = computeScenario(baseAusbildungInput);
    expect(() => new Date(result.computedAt)).not.toThrow();
    expect(new Date(result.computedAt).getTime()).toBeGreaterThan(0);
  });
});
