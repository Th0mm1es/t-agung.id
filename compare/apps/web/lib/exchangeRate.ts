/**
 * BandingHidup — Live Exchange Rate Service
 *
 * Fetches current exchange rates from the free exchangerate.host API.
 * Used for the dual-city comparison reference currency display.
 *
 * Supported reference currencies: EUR, JPY, IDR, USD
 * Cache duration: 1 hour (rates refresh daily in practice)
 */

export type ReferenceCurrency = "EUR" | "JPY" | "IDR" | "USD";

export interface ExchangeRates {
  base: ReferenceCurrency;
  rates: Record<string, number>;
  fetchedAt: string; // ISO timestamp
  isStale: boolean;
}

// ─── Hardcoded 2026 Fallback Rates (used if API fails) ───────────────────────
// Base: EUR. Source: approximate mid-market rates Q1 2026.
const FALLBACK_RATES_EUR_BASE: Record<string, number> = {
  EUR: 1.0,
  JPY: 163.5,
  IDR: 17200.0,
  USD: 1.09,
};

// ─── In-memory cache ─────────────────────────────────────────────────────────
let rateCache: ExchangeRates | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetch live exchange rates with EUR as the base currency.
 * Falls back to hardcoded 2026 rates if the API is unavailable.
 *
 * @returns ExchangeRates object with rate map and metadata
 */
export async function fetchExchangeRates(): Promise<ExchangeRates> {
  // Return cache if still fresh
  if (rateCache && !isCacheStale(rateCache)) {
    return rateCache;
  }

  try {
    // Try exchangerate-api.com (free, no API key for basic endpoints)
    const response = await fetch(
      "https://open.er-api.com/v6/latest/EUR",
      { next: { revalidate: 3600 } } // Next.js ISR cache
    );

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json() as {
      result: string;
      rates: Record<string, number>;
      time_last_update_utc?: string;
    };

    if (data.result !== "success") {
      throw new Error("Exchange rate API returned non-success result");
    }

    const rates: ExchangeRates = {
      base: "EUR",
      rates: data.rates as Record<string, number>,
      fetchedAt: new Date().toISOString(),
      isStale: false,
    };

    rateCache = rates;
    return rates;
  } catch (err) {
    console.warn("[BandingHidup] Exchange rate API failed, using fallback rates:", err);

    // Return stale cache if available, otherwise use hardcoded fallbacks
    if (rateCache) {
      return { ...rateCache, isStale: true };
    }

    return {
      base: "EUR",
      rates: FALLBACK_RATES_EUR_BASE,
      fetchedAt: new Date().toISOString(),
      isStale: true,
    };
  }
}

/**
 * Convert a minor-unit amount from source currency to reference currency.
 *
 * @param minorUnits - Amount in source currency minor units (bigint)
 * @param sourceCurrency - Currency of minorUnits ('EUR' | 'JPY' | 'IDR' | 'USD')
 * @param targetCurrency - Target reference currency for display
 * @param rates - ExchangeRates from fetchExchangeRates()
 * @returns Converted amount as a display number (major units, 2 dp for most currencies)
 */
export function convertCurrency(
  minorUnits: bigint,
  sourceCurrency: ReferenceCurrency,
  targetCurrency: ReferenceCurrency,
  rates: ExchangeRates
): number {
  if (sourceCurrency === targetCurrency) {
    return toMajorForDisplay(minorUnits, sourceCurrency);
  }

  const sourceInEur = toMajorForDisplay(minorUnits, sourceCurrency);

  // Convert source → EUR → target
  const sourceRate = rates.rates[sourceCurrency] ?? FALLBACK_RATES_EUR_BASE[sourceCurrency] ?? 1;
  const targetRate = rates.rates[targetCurrency] ?? FALLBACK_RATES_EUR_BASE[targetCurrency] ?? 1;

  const valueInEur = sourceInEur / sourceRate;
  return valueInEur * targetRate;
}

/** Convert minor units to major units for display (not for calculation) */
function toMajorForDisplay(minorUnits: bigint, currency: ReferenceCurrency): number {
  const DECIMALS: Record<ReferenceCurrency, number> = {
    EUR: 2,
    JPY: 0,
    IDR: 0,
    USD: 2,
  };
  const decimals = DECIMALS[currency];
  return Number(minorUnits) / Math.pow(10, decimals);
}

function isCacheStale(cache: ExchangeRates): boolean {
  const fetchedAt = new Date(cache.fetchedAt).getTime();
  return Date.now() - fetchedAt > CACHE_TTL_MS;
}

/** Format a converted value for display */
export function formatConverted(
  value: number,
  currency: ReferenceCurrency,
  locale: string = "en"
): string {
  const decimals: Record<ReferenceCurrency, number> = {
    EUR: 2, JPY: 0, IDR: 0, USD: 2,
  };
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: decimals[currency],
    maximumFractionDigits: decimals[currency],
  }).format(value);
}
