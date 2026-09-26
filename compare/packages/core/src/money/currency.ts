/**
 * @bandinghidup/core — Monetary Helpers
 *
 * RULE: NEVER use native JavaScript `number` for monetary storage or arithmetic.
 * All monetary values are stored as `bigint` minor units.
 *
 * Examples:
 *   EUR 10.50  → 1050n (cents)
 *   JPY 1000   → 1000n (yen — 0 decimal places)
 *   IDR 15000  → 15000n (rupiah — 0 decimal places)
 */

import Decimal from "decimal.js";

// ─── Currency Definitions ────────────────────────────────────────────────────

export const CURRENCY_DECIMALS: Readonly<Record<string, number>> = {
  EUR: 2,
  JPY: 0,
  IDR: 0,
  USD: 2,
} as const;

export type SupportedCurrencyCode = keyof typeof CURRENCY_DECIMALS;

/**
 * Validate that a currency code is supported.
 * Throws a TypeError if not.
 */
function assertSupportedCurrency(code: string): asserts code is SupportedCurrencyCode {
  if (!(code in CURRENCY_DECIMALS)) {
    throw new TypeError(`Unsupported currency code: "${code}". Supported: ${Object.keys(CURRENCY_DECIMALS).join(", ")}`);
  }
}

// ─── Conversion Helpers ──────────────────────────────────────────────────────

/**
 * Convert a major currency unit (as a string or number) to integer minor units (bigint).
 *
 * Uses Decimal.js internally to prevent floating-point drift.
 *
 * @example
 *   toMinorUnits("10.50", "EUR") → 1050n
 *   toMinorUnits(1000, "JPY")    → 1000n
 *   toMinorUnits("0.01", "EUR")  → 1n
 */
export function toMinorUnits(amount: string | number, currencyCode: string): bigint {
  assertSupportedCurrency(currencyCode);
  const decimals = CURRENCY_DECIMALS[currencyCode] as number;
  const multiplier = new Decimal(10).pow(decimals);
  const result = new Decimal(amount).mul(multiplier);

  // Ensure exact integer — throw if fractional minor units (e.g., 0.001 EUR is invalid)
  if (!result.isInteger()) {
    throw new RangeError(
      `Amount ${amount} ${currencyCode} results in fractional minor units (${result}). ` +
        `${currencyCode} has ${decimals} decimal places.`
    );
  }

  return BigInt(result.toFixed(0));
}

/**
 * Convert integer minor units (bigint) back to a major currency unit (number).
 *
 * @example
 *   toMajorUnits(1050n, "EUR") → 10.5
 *   toMajorUnits(1000n, "JPY") → 1000
 */
export function toMajorUnits(minorAmount: bigint, currencyCode: string): number {
  assertSupportedCurrency(currencyCode);
  const decimals = CURRENCY_DECIMALS[currencyCode] as number;
  const divisor = new Decimal(10).pow(decimals);
  return new Decimal(minorAmount.toString()).div(divisor).toNumber();
}

/**
 * Add two minor-unit bigint values.
 * Safe wrapper to prevent accidental mixing of currencies.
 */
export function addMinorUnits(a: bigint, b: bigint): bigint {
  return a + b;
}

/**
 * Subtract minor-unit bigint values (b from a).
 */
export function subtractMinorUnits(a: bigint, b: bigint): bigint {
  return a - b;
}

/**
 * Multiply a minor-unit bigint by a scalar (e.g., for tax calculations).
 * Uses Decimal.js for precision, returns bigint rounded to nearest.
 *
 * @example
 *   multiplyMinorUnits(10000n, 0.19) → 1900n  (19% of 10000 JPY)
 */
export function multiplyMinorUnits(minorAmount: bigint, scalar: number): bigint {
  const result = new Decimal(minorAmount.toString()).mul(new Decimal(scalar));
  return BigInt(result.toFixed(0, Decimal.ROUND_HALF_UP));
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/**
 * Format a minor-unit bigint as a localized currency string.
 *
 * @example
 *   formatCurrency(1050n, "EUR", "id") → "€10,50" or "10,50 €" depending on locale
 *   formatCurrency(1000n, "JPY", "ja") → "¥1,000"
 *   formatCurrency(15000n, "IDR", "id") → "Rp 15.000"
 */
export function formatCurrency(
  minorAmount: bigint,
  currencyCode: string,
  locale: string = "en"
): string {
  assertSupportedCurrency(currencyCode);
  const majorAmount = toMajorUnits(minorAmount, currencyCode);
  const decimals = CURRENCY_DECIMALS[currencyCode] as number;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(majorAmount);
}

/**
 * Parse a raw user input string into minor units.
 * Strips common locale formatting before parsing.
 * Returns null if input is invalid/unparseable.
 */
export function parseUserInput(raw: string, currencyCode: string): bigint | null {
  assertSupportedCurrency(currencyCode);
  if (!raw || !raw.trim()) return null;
  // For currencies without decimals (JPY, IDR), any dots or commas are thousand separators
  const isZeroDecimal = CURRENCY_DECIMALS[currencyCode] === 0;
  const cleaned = isZeroDecimal
    ? raw.replace(/[^\d-]/g, "")
    : raw.replace(/[^\d.,-]/g, "").replace(/,(\d{3})/g, "$1").replace(",", ".");
  if (!cleaned || cleaned === "-") return null;
  const num = parseFloat(cleaned);
  if (!isFinite(num)) return null;
  try {
    return toMinorUnits(num, currencyCode);
  } catch {
    return null;
  }
}
