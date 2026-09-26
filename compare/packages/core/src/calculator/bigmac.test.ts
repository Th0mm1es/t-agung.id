import { describe, it, expect } from "vitest";
import { calculateBigMacIndex, compareBigMacParity, DEFAULT_BIG_MAC_PRICES } from "./bigmac.js";

describe("Big Mac Index Engine", () => {
  it("calculates correct burger equivalents for German Ausbildung scenario", () => {
    // Germany: €5.20 = 520 cents per burger
    // Rent: €500 = 50,000 cents
    // Gross: €1,100 = 110,000 cents
    // Net: €880 = 88,000 cents
    // Monthly balance: €250 = 25,000 cents
    const res = calculateBigMacIndex({
      country: "DE",
      monthlyRentMinorUnits: 50000n,
      grossMonthlyMinorUnits: 110000n,
      netMonthlyMinorUnits: 88000n,
      monthlyBalanceMinorUnits: 25000n,
    });

    expect(res.country).toBe("DE");
    expect(res.currency).toBe("EUR");
    expect(res.bigMacPriceMajor).toBe(5.2);
    // 50000 / 520 = 96.15 -> 96.2
    expect(res.rentInBigMacs).toBeCloseTo(96.2, 0);
    // 110000 / 520 = 211.5
    expect(res.grossSalaryInBigMacs).toBeCloseTo(211.5, 0);
    // 88000 / 520 = 169.2
    expect(res.netSalaryInBigMacs).toBeCloseTo(169.2, 0);
    // 25000 / 520 = 48.1
    expect(res.monthlySavingsInBigMacs).toBeCloseTo(48.1, 0);
    // Net hourly = 88000 / 160 = 550 cents/hr. Price is 520 cents. (520/550)*60 = 56.7 mins -> ~57 mins
    expect(res.workMinutesPerBigMac).toBeGreaterThan(45);
    expect(res.workMinutesPerBigMac).toBeLessThan(75);
  });

  it("calculates correct burger equivalents for Japan Trainee scenario", () => {
    // Japan: ¥540 per burger
    // Rent: ¥45,000
    // Gross: ¥180,000
    // Net: ¥150,000
    // Balance: ¥35,000
    const res = calculateBigMacIndex({
      country: "JP",
      monthlyRentMinorUnits: 45000n,
      grossMonthlyMinorUnits: 180000n,
      netMonthlyMinorUnits: 150000n,
      monthlyBalanceMinorUnits: 35000n,
    });

    expect(res.country).toBe("JP");
    expect(res.currency).toBe("JPY");
    expect(res.bigMacPriceMajor).toBe(540);
    // 45000 / 540 = 83.3
    expect(res.rentInBigMacs).toBeCloseTo(83.3, 0);
    // 180000 / 540 = 333.3
    expect(res.grossSalaryInBigMacs).toBeCloseTo(333.3, 0);
    // 150000 / 540 = 277.8
    expect(res.netSalaryInBigMacs).toBeCloseTo(277.8, 0);
    // 35000 / 540 = 64.8
    expect(res.monthlySavingsInBigMacs).toBeCloseTo(64.8, 0);
  });

  it("compares parity between Germany and Japan scenarios accurately", () => {
    const germanResult = calculateBigMacIndex({
      country: "DE",
      monthlyRentMinorUnits: 50000n,
      grossMonthlyMinorUnits: 110000n,
      netMonthlyMinorUnits: 88000n,
      monthlyBalanceMinorUnits: 25000n,
    });

    const japanResult = calculateBigMacIndex({
      country: "JP",
      monthlyRentMinorUnits: 45000n,
      grossMonthlyMinorUnits: 180000n,
      netMonthlyMinorUnits: 150000n,
      monthlyBalanceMinorUnits: 35000n,
    });

    const comparison = compareBigMacParity(germanResult, japanResult);

    // Japan scenario saves 64.8 burgers vs Germany 48.1 burgers -> Scenario B saves more
    expect(comparison.moreAffordableScenario).toBe("B");
    expect(comparison.savingsDifferenceBurgers).toBeGreaterThan(0);
  });

  it("supports custom Big Mac benchmark override from database", () => {
    // If user or database sets Munich Big Mac to €6.00 (600 cents)
    const res = calculateBigMacIndex({
      country: "DE",
      monthlyRentMinorUnits: 60000n,
      grossMonthlyMinorUnits: 120000n,
      netMonthlyMinorUnits: 96000n,
      monthlyBalanceMinorUnits: 30000n,
      customPriceMinorUnits: 600n,
    });

    expect(res.bigMacPriceMajor).toBe(6.0);
    expect(res.rentInBigMacs).toBe(100.0);
    expect(res.grossSalaryInBigMacs).toBe(200.0);
    expect(res.netSalaryInBigMacs).toBe(160.0);
    expect(res.monthlySavingsInBigMacs).toBe(50.0);
  });
});
