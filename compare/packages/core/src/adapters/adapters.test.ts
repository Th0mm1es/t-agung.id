import { describe, it, expect } from "vitest";
import { parseDestatisPayload } from "./destatis.js";
import { parseEStatPayload } from "./estat.js";
import { processApifyBatch, calculateMedian, filterOutliers } from "./apify.js";

describe("Destatis Adapter", () => {
  it("parses CPI payload and computes price in EUR cents", () => {
    const result = parseDestatisPayload({
      tableCode: "61111-0002",
      period: "2026-01",
      categoryName: "Wohnungsmiete",
      cpiIndexValue: 110.0, // 10% increase over base 45000
      basePriceEurCents: 45000,
      cityCode: "STUTTGART",
    });

    expect(result.sourceCode).toBe("destatis");
    expect(result.cityName).toBe("STUTTGART");
    expect(result.categoryCode).toBe("housing");
    expect(result.proposedValueMinorUnits).toBe(49500n); // 45000 * 1.10 = 49500 cents (€495.00)
    expect(result.currencyCode).toBe("EUR");
    expect(result.confidenceScore).toBe(0.95);
  });
});

describe("e-Stat Adapter", () => {
  it("parses e-Stat payload into JPY yen proposal", () => {
    const result = parseEStatPayload({
      statId: "000342352",
      surveyYear: 2025,
      prefectureCode: "13000",
      cityName: "Tokyo",
      itemCode: "01.01.01",
      itemNameJp: "家賃",
      monthlyAverageYen: 68500,
    });

    expect(result.sourceCode).toBe("estat");
    expect(result.cityName).toBe("Tokyo");
    expect(result.categoryCode).toBe("housing");
    expect(result.proposedValueMinorUnits).toBe(68500n);
    expect(result.currencyCode).toBe("JPY");
    expect(result.confidenceScore).toBe(0.95);
  });
});

describe("Apify Scraper Adapter", () => {
  it("calculates median correctly", () => {
    expect(calculateMedian([100, 200, 300])).toBe(200);
    expect(calculateMedian([100, 200, 300, 400])).toBe(250);
  });

  it("filters extreme outliers", () => {
    const raw = [400, 420, 450, 480, 500, 520, 2000]; // 2000 is an outlier
    const cleaned = filterOutliers(raw);
    expect(cleaned).not.toContain(2000);
    expect(cleaned.length).toBe(6);
  });

  it("processes Apify batch and returns normalized proposal", () => {
    const batch = {
      actorRunId: "run_987654",
      scrapedAt: "2026-08-03T12:00:00Z",
      items: [
        { id: "1", sourceUrl: "http://example.com/1", cityName: "Berlin", countryCode: "DE" as const, categoryCode: "housing" as const, rawPriceAmount: 500, currency: "EUR" as const },
        { id: "2", sourceUrl: "http://example.com/2", cityName: "Berlin", countryCode: "DE" as const, categoryCode: "housing" as const, rawPriceAmount: 520, currency: "EUR" as const },
        { id: "3", sourceUrl: "http://example.com/3", cityName: "Berlin", countryCode: "DE" as const, categoryCode: "housing" as const, rawPriceAmount: 480, currency: "EUR" as const },
      ],
    };

    const result = processApifyBatch(batch);
    expect(result.sourceCode).toBe("apify_housing_de");
    expect(result.cityName).toBe("Berlin");
    expect(result.categoryCode).toBe("housing");
    expect(result.proposedValueMinorUnits).toBe(50000n); // 500.00 EUR median = 50000 cents
    expect(result.currencyCode).toBe("EUR");
    expect(result.confidenceScore).toBeGreaterThan(0.5);
  });
});
