import { describe, it, expect } from "vitest";
import {
  toMinorUnits,
  toMajorUnits,
  formatCurrency,
  addMinorUnits,
  subtractMinorUnits,
  multiplyMinorUnits,
  parseUserInput,
} from "./currency.js";

// ─── toMinorUnits ────────────────────────────────────────────────────────────

describe("toMinorUnits", () => {
  describe("EUR (2 decimal places)", () => {
    it("converts whole EUR amounts correctly", () => {
      expect(toMinorUnits(10, "EUR")).toBe(1000n);
      expect(toMinorUnits(1, "EUR")).toBe(100n);
      expect(toMinorUnits(100, "EUR")).toBe(10000n);
    });

    it("converts decimal EUR amounts without floating-point drift", () => {
      expect(toMinorUnits("10.50", "EUR")).toBe(1050n);
      expect(toMinorUnits("0.01", "EUR")).toBe(1n);
      expect(toMinorUnits("1234.99", "EUR")).toBe(123499n);
      // Classic float drift case: 0.1 + 0.2 = 0.30000000000000004 in JS
      expect(toMinorUnits("0.30", "EUR")).toBe(30n);
    });

    it("handles string and number inputs identically", () => {
      expect(toMinorUnits("10.50", "EUR")).toBe(toMinorUnits(10.5, "EUR"));
    });
  });

  describe("JPY (0 decimal places)", () => {
    it("converts JPY whole amounts correctly", () => {
      expect(toMinorUnits(1000, "JPY")).toBe(1000n);
      expect(toMinorUnits("250000", "JPY")).toBe(250000n);
      expect(toMinorUnits(0, "JPY")).toBe(0n);
    });

    it("throws on fractional JPY amounts", () => {
      expect(() => toMinorUnits("100.5", "JPY")).toThrow(RangeError);
      expect(() => toMinorUnits(0.1, "JPY")).toThrow(RangeError);
    });
  });

  describe("IDR (0 decimal places)", () => {
    it("converts IDR amounts correctly", () => {
      expect(toMinorUnits(15000, "IDR")).toBe(15000n);
      expect(toMinorUnits("5000000", "IDR")).toBe(5000000n);
    });

    it("throws on fractional IDR amounts", () => {
      expect(() => toMinorUnits("15000.5", "IDR")).toThrow(RangeError);
    });
  });

  describe("Zero and negative values", () => {
    it("handles zero for all currencies", () => {
      expect(toMinorUnits(0, "EUR")).toBe(0n);
      expect(toMinorUnits(0, "JPY")).toBe(0n);
      expect(toMinorUnits(0, "IDR")).toBe(0n);
    });

    it("handles negative values correctly", () => {
      expect(toMinorUnits(-10, "EUR")).toBe(-1000n);
      expect(toMinorUnits("-5.25", "EUR")).toBe(-525n);
      expect(toMinorUnits(-500, "JPY")).toBe(-500n);
    });
  });

  describe("Error handling", () => {
    it("throws TypeError for unsupported currency codes", () => {
      expect(() => toMinorUnits(100, "XYZ")).toThrow(TypeError);
      expect(() => toMinorUnits(100, "")).toThrow(TypeError);
    });
  });
});

// ─── toMajorUnits ────────────────────────────────────────────────────────────

describe("toMajorUnits", () => {
  it("converts EUR minor units back to major units", () => {
    expect(toMajorUnits(1050n, "EUR")).toBe(10.5);
    expect(toMajorUnits(100n, "EUR")).toBe(1);
    expect(toMajorUnits(1n, "EUR")).toBe(0.01);
  });

  it("converts JPY minor units (identity, no division)", () => {
    expect(toMajorUnits(1000n, "JPY")).toBe(1000);
    expect(toMajorUnits(250000n, "JPY")).toBe(250000);
  });

  it("converts IDR minor units correctly", () => {
    expect(toMajorUnits(15000n, "IDR")).toBe(15000);
  });

  it("handles zero and negative minor units", () => {
    expect(toMajorUnits(0n, "EUR")).toBe(0);
    expect(toMajorUnits(-1050n, "EUR")).toBe(-10.5);
    expect(toMajorUnits(-500n, "JPY")).toBe(-500);
  });

  it("is inverse of toMinorUnits for valid values", () => {
    const eurAmount = "1234.56";
    expect(toMajorUnits(toMinorUnits(eurAmount, "EUR"), "EUR")).toBe(1234.56);

    const jpyAmount = 250000;
    expect(toMajorUnits(toMinorUnits(jpyAmount, "JPY"), "JPY")).toBe(250000);
  });
});

// ─── Arithmetic Helpers ──────────────────────────────────────────────────────

describe("addMinorUnits", () => {
  it("adds two bigint minor amounts", () => {
    expect(addMinorUnits(1000n, 500n)).toBe(1500n);
    expect(addMinorUnits(0n, 250n)).toBe(250n);
    expect(addMinorUnits(-100n, 100n)).toBe(0n);
  });
});

describe("subtractMinorUnits", () => {
  it("subtracts two bigint minor amounts", () => {
    expect(subtractMinorUnits(1500n, 500n)).toBe(1000n);
    expect(subtractMinorUnits(100n, 150n)).toBe(-50n);
  });
});

describe("multiplyMinorUnits", () => {
  it("multiplies minor units by a scalar (e.g., tax rate)", () => {
    // 10000 JPY * 0.1 = 1000 JPY
    expect(multiplyMinorUnits(10000n, 0.1)).toBe(1000n);
    // 1000 EUR cents * 0.19 = 190 cents (€1.90)
    expect(multiplyMinorUnits(1000n, 0.19)).toBe(190n);
  });

  it("rounds correctly on half-values", () => {
    // 3n * 0.5 = 1.5 → rounds to 2
    expect(multiplyMinorUnits(3n, 0.5)).toBe(2n);
  });
});

// ─── formatCurrency ──────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats EUR correctly with 2 decimal places", () => {
    const result = formatCurrency(1050n, "EUR", "en");
    expect(result).toContain("10"); // At minimum contains the amount
    expect(result).toContain("50");
  });

  it("formats JPY correctly with 0 decimal places", () => {
    const result = formatCurrency(1000n, "JPY", "ja");
    expect(result).toContain("1,000");
    expect(result).not.toContain(".");
  });

  it("formats IDR in Indonesian locale", () => {
    const result = formatCurrency(15000n, "IDR", "id");
    expect(result).toContain("15");
    expect(result).toContain("000");
  });

  it("throws for unsupported currency", () => {
    expect(() => formatCurrency(1000n, "GBP", "en")).toThrow(TypeError);
  });
});

// ─── parseUserInput ───────────────────────────────────────────────────────────

describe("parseUserInput", () => {
  it("parses simple number string", () => {
    expect(parseUserInput("100", "JPY")).toBe(100n);
  });

  it("parses decimal EUR string", () => {
    expect(parseUserInput("10.50", "EUR")).toBe(1050n);
  });

  it("parses formatted JPY with dots or commas as thousand separators", () => {
    expect(parseUserInput("180.000", "JPY")).toBe(180000n);
    expect(parseUserInput("180,000", "JPY")).toBe(180000n);
    expect(parseUserInput("¥180.000", "JPY")).toBe(180000n);
  });

  it("returns null for invalid input", () => {
    expect(parseUserInput("abc", "EUR")).toBeNull();
    expect(parseUserInput("", "EUR")).toBeNull();
  });
});
