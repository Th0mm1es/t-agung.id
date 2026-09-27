import { describe, it, expect } from "vitest";
import {
  calculateActiveDeductions,
  getCareerPathwayBenchmark,
  calculateLifestyleEquivalenceSalary,
  calculateChildBenefit,
} from "../index.js";

describe("Active Statutory Tax & Deduction Engine", () => {
  it("calculates German deductions for single vs married with children", () => {
    // €3,500 monthly gross = 350000 cents
    const single = calculateActiveDeductions({
      country: "DE",
      grossMonthlyMinorUnits: 350000n,
      familyStatus: "single",
      taxClassDE: 1,
    });

    expect(single.effectiveDeductionRate).toBeGreaterThan(0.30);
    expect(single.effectiveDeductionRate).toBeLessThan(0.42);
    expect(single.netMonthlyMajor).toBeGreaterThan(2000);

    const married = calculateActiveDeductions({
      country: "DE",
      grossMonthlyMinorUnits: 350000n,
      familyStatus: "married_children",
      numChildren: 2,
      taxClassDE: 3,
    });

    // Married sole earner with kids should pay lower tax than single
    expect(married.totalDeductionsMajor).toBeLessThan(single.totalDeductionsMajor);
    expect(married.netMonthlyMajor).toBeGreaterThan(single.netMonthlyMajor);
  });

  it("calculates Japanese deductions and distinguishes Year 1 from Year 2 Juminzei", () => {
    // ¥250,000 monthly gross = 250000n
    const year1 = calculateActiveDeductions({
      country: "JP",
      grossMonthlyMinorUnits: 250000n,
      isJapanSecondYear: false,
    });

    const year2 = calculateActiveDeductions({
      country: "JP",
      grossMonthlyMinorUnits: 250000n,
      isJapanSecondYear: true,
    });

    // Year 1 exempt from resident tax
    const resTaxYear1 = year1.itemizedDeductions.find((i) => i.key === "resident_tax");
    const resTaxYear2 = year2.itemizedDeductions.find((i) => i.key === "resident_tax");

    expect(resTaxYear1?.amountMinorUnits).toBe(0n);
    expect(resTaxYear2?.amountMinorUnits).toBeGreaterThan(0n);
    expect(year2.netMonthlyMajor).toBeLessThan(year1.netMonthlyMajor);
  });

  it("calculates Indonesian deductions with BPJS and TER PPh 21", () => {
    // Rp 10.000.000 monthly gross
    const res = calculateActiveDeductions({
      country: "ID",
      grossMonthlyMinorUnits: 10000000n,
      familyStatus: "single",
      ptkpStatusID: "TK/0",
    });

    expect(res.itemizedDeductions.some((d) => d.key === "jht")).toBe(true);
    expect(res.itemizedDeductions.some((d) => d.key === "jp")).toBe(true);
    expect(res.itemizedDeductions.some((d) => d.key === "bpjs_kes")).toBe(true);
    expect(res.itemizedDeductions.some((d) => d.key === "pph21")).toBe(true);
    expect(res.effectiveDeductionRate).toBeGreaterThan(0.04);
    expect(res.effectiveDeductionRate).toBeLessThan(0.10);
  });
});

describe("Career Pathways & Entry-Level Benchmarks", () => {
  it("provides distinct benchmarks for Ausbildung, Fresh Grad S1, and Fresh Grad S2", () => {
    const ausbildung = getCareerPathwayBenchmark("DE", "Berlin", "ausbildung_kenshusei");
    const s1 = getCareerPathwayBenchmark("DE", "Berlin", "fresh_grad_s1");
    const s2 = getCareerPathwayBenchmark("DE", "Berlin", "fresh_grad_s2");

    expect(ausbildung.grossMonthlyMajor).toBeLessThan(s1.grossMonthlyMajor);
    expect(s1.grossMonthlyMajor).toBeLessThan(s2.grossMonthlyMajor);
    expect(ausbildung.netMonthlyMajor).toBeLessThan(s1.netMonthlyMajor);
    expect(s1.netMonthlyMajor).toBeLessThan(s2.netMonthlyMajor);
  });

  it("handles Japanese Technical Intern and Fresh Grad in Tokyo", () => {
    const kenshusei = getCareerPathwayBenchmark("JP", "Tokyo", "ausbildung_kenshusei");
    const s1 = getCareerPathwayBenchmark("JP", "Tokyo", "fresh_grad_s1");

    expect(kenshusei.grossMonthlyMajor).toBeGreaterThan(150000);
    expect(s1.grossMonthlyMajor).toBeGreaterThan(200000);
    expect(kenshusei.recommendedRentMajor).toBeLessThan(s1.recommendedRentMajor);
  });
});

describe("Enhanced Equivalence Engine: Logic Modes & Extra Indices", () => {
  it("supports same_savings, same_net, and same_gross logic modes", () => {
    const grossMonthlyMinorUnits = 10000000n; // Rp 10.000.000

    const sameSavings = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: grossMonthlyMinorUnits,
      targetCountry: "DE",
      targetCityName: "Berlin",
      indexType: "street_food",
      equivalenceLogic: "same_savings",
    });

    const sameNet = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: grossMonthlyMinorUnits,
      targetCountry: "DE",
      targetCityName: "Berlin",
      indexType: "street_food",
      equivalenceLogic: "same_net",
    });

    const sameGross = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: grossMonthlyMinorUnits,
      targetCountry: "DE",
      targetCityName: "Berlin",
      indexType: "street_food",
      equivalenceLogic: "same_gross",
    });

    expect(sameSavings.sourceSummary).toBeDefined();
    expect(sameSavings.targetSummary).toBeDefined();
    expect(sameSavings.equivalentGrossMajor).toBeGreaterThan(0);
    expect(sameNet.equivalentGrossMajor).toBeGreaterThan(0);
    expect(sameGross.equivalentGrossMajor).toBeGreaterThan(0);
  });

  it("calculates parity with Coffee Index and CPI Consumer Basket", () => {
    const coffeeRes = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: 10000000n,
      targetCountry: "JP",
      targetCityName: "Tokyo",
      indexType: "coffee",
    });

    const cpiRes = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: 10000000n,
      targetCountry: "DE",
      targetCityName: "Berlin",
      indexType: "cpi_basket",
    });

    expect(coffeeRes.sourceFoodItem.itemName).toContain("Kopi");
    expect(coffeeRes.targetFoodItem.itemName).toContain("Cafe");
    expect(cpiRes.equivalentGrossMajor).toBeGreaterThan(0);
  });

  it("differentiates cost of living, rent, and food prices dynamically between cities", () => {
    const gross = 10000000n; // Rp 10.000.000

    // Berlin (DE base = 1.00)
    const berlin = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: gross,
      targetCountry: "DE",
      targetCityName: "Berlin",
      indexType: "street_food",
    });

    // Munich (DE highest rent = 1.35x, food = 1.15x)
    const munich = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: gross,
      targetCountry: "DE",
      targetCityName: "Munich",
      indexType: "street_food",
    });

    // Leipzig (DE cheaper rent = 0.70x, food = 0.90x)
    const leipzig = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: gross,
      targetCountry: "DE",
      targetCityName: "Leipzig",
      indexType: "street_food",
    });

    // 1. Munich rent must be significantly higher than Berlin, and Leipzig must be lower
    expect(munich.targetSummary.rentMonthlyMajor).toBeGreaterThan(berlin.targetSummary.rentMonthlyMajor);
    expect(leipzig.targetSummary.rentMonthlyMajor).toBeLessThan(berlin.targetSummary.rentMonthlyMajor);
    expect(munich.targetSummary.rentMonthlyMajor).toBe(Math.round(550 * 1.35));
    expect(leipzig.targetSummary.rentMonthlyMajor).toBe(Math.round(550 * 0.70));

    // 2. Munich street food price must be higher than Berlin, and Leipzig must be lower
    expect(munich.targetFoodItem.major).toBeGreaterThan(berlin.targetFoodItem.major);
    expect(leipzig.targetFoodItem.major).toBeLessThan(berlin.targetFoodItem.major);

    // 3. Required contract salary in Munich must exceed Berlin, while Leipzig requires less
    expect(munich.targetSummary.grossMonthlyMajor).toBeGreaterThan(berlin.targetSummary.grossMonthlyMajor);
    expect(leipzig.targetSummary.grossMonthlyMajor).toBeLessThan(berlin.targetSummary.grossMonthlyMajor);

    // 4. Source city differentiation: Jakarta vs Bandung vs Yogyakarta
    const fromBandung = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Bandung",
      sourceGrossMonthlyMinorUnits: gross,
      targetCountry: "DE",
      targetCityName: "Berlin",
      indexType: "street_food",
    });

    // Bandung rent is 0.65x Jakarta, food is 0.80x Jakarta
    expect(fromBandung.sourceSummary.rentMonthlyMajor).toBe(Math.round(1800000 * 0.65));
    expect(fromBandung.sourceFoodItem.major).toBe(Math.round(20000 * 0.80));

    // 5. Japan destination differentiation: Tokyo vs Osaka vs Sapporo
    const toTokyo = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: gross,
      targetCountry: "JP",
      targetCityName: "Tokyo",
      indexType: "street_food",
    });

    const toOsaka = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: gross,
      targetCountry: "JP",
      targetCityName: "Osaka",
      indexType: "street_food",
    });

    const toSapporo = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: gross,
      targetCountry: "JP",
      targetCityName: "Sapporo",
      indexType: "street_food",
    });

    // Tokyo rent > Osaka rent (0.78x) > Sapporo rent (0.55x)
    expect(toTokyo.targetSummary.rentMonthlyMajor).toBe(55000);
    expect(toOsaka.targetSummary.rentMonthlyMajor).toBe(Math.round(55000 * 0.78));
    expect(toSapporo.targetSummary.rentMonthlyMajor).toBe(Math.round(55000 * 0.55));
    expect(toTokyo.targetSummary.grossMonthlyMajor).toBeGreaterThan(toOsaka.targetSummary.grossMonthlyMajor);
    expect(toOsaka.targetSummary.grossMonthlyMajor).toBeGreaterThan(toSapporo.targetSummary.grossMonthlyMajor);

    // 6. Housing size differentiation: WG (shared_room) vs Studio vs 1-Bedroom
    const wgBerlin = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: gross,
      customSourceRentMajor: 1800000,
      targetCountry: "DE",
      targetCityName: "Berlin",
      indexType: "street_food",
      housingType: "shared_room",
    });

    const studioBerlin = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: gross,
      customSourceRentMajor: 1800000,
      targetCountry: "DE",
      targetCityName: "Berlin",
      indexType: "street_food",
      housingType: "studio",
    });

    const oneBrBerlin = calculateLifestyleEquivalenceSalary({
      sourceCountry: "ID",
      sourceCityName: "Jakarta",
      sourceGrossMonthlyMinorUnits: gross,
      customSourceRentMajor: 1800000,
      targetCountry: "DE",
      targetCityName: "Berlin",
      indexType: "street_food",
      housingType: "one_bedroom",
    });

    expect(wgBerlin.targetSummary.rentMonthlyMajor).toBe(400);
    expect(studioBerlin.targetSummary.rentMonthlyMajor).toBe(550);
    expect(oneBrBerlin.targetSummary.rentMonthlyMajor).toBe(1100);
    expect(oneBrBerlin.targetSummary.grossMonthlyMajor).toBeGreaterThan(studioBerlin.targetSummary.grossMonthlyMajor);
    expect(studioBerlin.targetSummary.grossMonthlyMajor).toBeGreaterThan(wgBerlin.targetSummary.grossMonthlyMajor);
  });

  describe("P1-1 & P1-4: Family Structure (1 vs 2 Children) & Card Math Audit", () => {
    it("family-with-2-children net result ≠ family-with-1-child net result in both DE and JP", () => {
      // Germany: Gross €4,000 / month
      const de1Child = calculateActiveDeductions({
        country: "DE",
        grossMonthlyMinorUnits: 400000n,
        familyStatus: "married_children",
        numChildren: 1,
        taxClassDE: 3,
      });
      const de2Children = calculateActiveDeductions({
        country: "DE",
        grossMonthlyMinorUnits: 400000n,
        familyStatus: "married_children",
        numChildren: 2,
        taxClassDE: 3,
      });

      // 2 children has lower care insurance rate (1.45% vs 1.70%) and higher child tax allowance
      expect(de2Children.netMonthlyMajor).not.toBe(de1Child.netMonthlyMajor);
      expect(de2Children.netMonthlyMajor).toBeGreaterThan(de1Child.netMonthlyMajor);

      // Child benefits (Kindergeld)
      const deBenefit1 = calculateChildBenefit("DE", 1);
      const deBenefit2 = calculateChildBenefit("DE", 2);
      expect(deBenefit1.monthlyBenefitMajor).toBe(255);
      expect(deBenefit2.monthlyBenefitMajor).toBe(510);
      expect(deBenefit2.monthlyBenefitMajor - deBenefit1.monthlyBenefitMajor).toBe(255);

      // Japan: Gross ¥350,000 / month
      const jp1Child = calculateActiveDeductions({
        country: "JP",
        grossMonthlyMinorUnits: 350000n,
        familyStatus: "married_children",
        numChildren: 1,
        isJapanSecondYear: true,
      });
      const jp2Children = calculateActiveDeductions({
        country: "JP",
        grossMonthlyMinorUnits: 350000n,
        familyStatus: "married_children",
        numChildren: 2,
        isJapanSecondYear: true,
      });

      // 2 children has larger dependent relief (Fuyo Kojo: ¥94,998 vs ¥63,332)
      expect(jp2Children.netMonthlyMajor).not.toBe(jp1Child.netMonthlyMajor);
      expect(jp2Children.netMonthlyMajor).toBeGreaterThan(jp1Child.netMonthlyMajor);

      // Child benefits (Jido Teate)
      const jpBenefit1 = calculateChildBenefit("JP", 1);
      const jpBenefit2 = calculateChildBenefit("JP", 2);
      expect(jpBenefit1.monthlyBenefitMajor).toBe(15000);
      expect(jpBenefit2.monthlyBenefitMajor).toBe(30000);
      expect(jpBenefit2.monthlyBenefitMajor - jpBenefit1.monthlyBenefitMajor).toBe(15000);
    });

    it("audits card math: card_total_shown === sum_of_card_line_items and surplus === take_home - card_total_shown for default Ausbildung and 2-child scenario", () => {
      // 1. Default Scenario: Jakarta -> Berlin Ausbildung (Single, no kids, €1,100 gross)
      const benchmark = getCareerPathwayBenchmark("DE", "Berlin", "ausbildung_kenshusei");
      expect(benchmark.grossMonthlyMajor).toBe(1100);
      expect(benchmark.deductionResult.totalDeductionsMajor).toBe(231);
      expect(benchmark.netMonthlyMajor).toBe(869);
      expect(benchmark.recommendedRentMajor).toBe(500);
      expect(benchmark.otherConsumptionMajor).toBe(450);
      expect(benchmark.totalExpensesMajor).toBe(950);

      const sumOfLineItems = benchmark.recommendedRentMajor + benchmark.otherConsumptionMajor;
      const cardTotalShown = benchmark.totalExpensesMajor;
      // Assertion 1: card_total_shown === sum_of_card_line_items
      expect(cardTotalShown).toBe(sumOfLineItems);

      // Raw arithmetic: take_home (869) - card_total_shown (950) = -81 (deficit)
      const rawSurplus = benchmark.netMonthlyMajor - cardTotalShown;
      expect(rawSurplus).toBe(-81);
      // Monthly savings clamps deficit to 0 surplus
      expect(benchmark.monthlySavingsMajor).toBe(Math.max(0, rawSurplus));

      // 2. 2-Child Scenario: Married family in Berlin (€4,000 gross, 2 children, Tax Class 3)
      const familyDeductions = calculateActiveDeductions({
        country: "DE",
        grossMonthlyMinorUnits: 400000n, // €4,000 gross
        familyStatus: "married_children",
        numChildren: 2,
        taxClassDE: 3,
      });
      const kindergeld = calculateChildBenefit("DE", 2).monthlyBenefitMajor; // 2 * €255 = €510
      const familyTakeHome = familyDeductions.netMonthlyMajor + kindergeld; // Net pay + child benefit

      const familyRent = 1200; // 3-room apartment rent
      const familyOtherLiving = 1400; // Groceries, utilities, health
      const familySumOfLineItems = familyRent + familyOtherLiving; // 2600
      const familyCardTotalShown = familySumOfLineItems; // 2600
      const familySurplus = familyTakeHome - familyCardTotalShown;

      // Assertion 2: card_total_shown === sum_of_card_line_items for 2-child scenario
      expect(familyCardTotalShown).toBe(familySumOfLineItems);
      // Assertion 3: surplus === take_home - card_total_shown
      expect(familySurplus).toBe(familyTakeHome - familyCardTotalShown);
      expect(familySurplus).toBeGreaterThan(0);
    });
  });
});
