/**
 * @bandinghidup/core — Culturally-Equivalent Expense Baskets
 *
 * Models monthly living expenses using culturally-equivalent
 * food/lifestyle categories for Germany and Japan.
 *
 * All values in minor units (bigint): EUR cents (DE), JPY yen (JP)
 */

import type { CountryCode } from "./housing.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LifestyleProfile = "minimum_viable" | "realistic_newcomer" | "comfortable";

export interface ExpenseLineItem {
  key: string;
  labelKey: string;          // i18n key for display
  exampleKey: string;        // i18n key for cultural example (e.g., "Kebab/Bäckerei")
  unitCostMinorUnits: bigint; // Cost per occurrence
  monthlyFrequency: number;  // Times per month
  monthlyTotalMinorUnits: bigint; // unitCost × frequency
  isOverridden: boolean;
}

export interface ExpenseBasketResult {
  profile: LifestyleProfile;
  country: CountryCode;
  /** Warning for minimum_viable profile */
  profileWarning?: string | undefined;
  items: {
    quickMeals: ExpenseLineItem;
    casualDining: ExpenseLineItem;
    socialOutings: ExpenseLineItem;
    groceries: ExpenseLineItem;
    transport: ExpenseLineItem;
    utilities: ExpenseLineItem;   // Internet + phone
    miscPersonal: ExpenseLineItem;
  };
  monthlyFoodTotal: bigint;
  monthlyTransportTotal: bigint;
  monthlyUtilitiesTotal: bigint;
  monthlyLifestyleTotal: bigint;
  monthlyGrandTotal: bigint;
}

export interface BasketOverrides {
  quickMeals?: { unitCost?: bigint; frequency?: number };
  casualDining?: { unitCost?: bigint; frequency?: number };
  socialOutings?: { unitCost?: bigint; frequency?: number };
  groceries?: { unitCost?: bigint; frequency?: number };
  transport?: { unitCost?: bigint; frequency?: number };
  utilities?: { unitCost?: bigint; frequency?: number };
  miscPersonal?: { unitCost?: bigint; frequency?: number };
}

// ─── Basket Presets ───────────────────────────────────────────────────────────

/**
 * Germany expense basket presets.
 * Values in EUR cents.
 *
 * Quick meal examples: Döner Kebab (€4–6), Bäckerei sandwich (€3–5)
 * Casual dining: Mensa/cafeteria (€5–8), local restaurant (€10–15)
 * Social: Beer garden / bar (€15–30 per session)
 */
export const DE_BASKETS: Record<LifestyleProfile, {
  quickMeal: { unit: bigint; freq: number };
  casualDining: { unit: bigint; freq: number };
  social: { unit: bigint; freq: number };
  groceries: { unit: bigint; freq: number };
  transport: { unit: bigint; freq: number };
  utilities: { unit: bigint; freq: number };
  misc: { unit: bigint; freq: number };
}> = {
  minimum_viable: {
    quickMeal:    { unit: 450n,   freq: 8  },  // €4.50 × 8 = €36
    casualDining: { unit: 600n,   freq: 2  },  // €6 (Mensa) × 2 = €12
    social:       { unit: 1200n,  freq: 1  },  // €12 × 1 = €12
    groceries:    { unit: 15000n, freq: 1  },  // €150/month
    transport:    { unit: 4900n,  freq: 1  },  // €49 Deutschland-Ticket
    utilities:    { unit: 2500n,  freq: 1  },  // €25 phone+internet
    misc:         { unit: 5000n,  freq: 1  },  // €50 personal
  },
  realistic_newcomer: {
    quickMeal:    { unit: 550n,   freq: 12 },  // €5.50 × 12 = €66
    casualDining: { unit: 1300n,  freq: 4  },  // €13 × 4 = €52
    social:       { unit: 2000n,  freq: 2  },  // €20 × 2 = €40
    groceries:    { unit: 20000n, freq: 1  },  // €200/month
    transport:    { unit: 4900n,  freq: 1  },  // €49 Deutschland-Ticket
    utilities:    { unit: 3500n,  freq: 1  },  // €35 phone+internet
    misc:         { unit: 8000n,  freq: 1  },  // €80 personal
  },
  comfortable: {
    quickMeal:    { unit: 700n,   freq: 16 },  // €7 × 16 = €112
    casualDining: { unit: 1800n,  freq: 6  },  // €18 × 6 = €108
    social:       { unit: 3000n,  freq: 3  },  // €30 × 3 = €90
    groceries:    { unit: 28000n, freq: 1  },  // €280/month
    transport:    { unit: 4900n,  freq: 1  },  // €49 Deutschland-Ticket
    utilities:    { unit: 4500n,  freq: 1  },  // €45 phone+internet+streaming
    misc:         { unit: 15000n, freq: 1  }, // €150 personal
  },
};

/**
 * Japan expense basket presets.
 * Values in JPY yen.
 *
 * Quick meal examples: Udon ¥400–600, Gyudon (Matsuya/Sukiya) ¥500–700
 * Casual dining: Saizeriya ¥1000, Curry shop ¥800, family restaurant ¥1200
 * Social: Izakaya ¥2000–4000 per session
 */
export const JP_BASKETS: Record<LifestyleProfile, {
  quickMeal: { unit: bigint; freq: number };
  casualDining: { unit: bigint; freq: number };
  social: { unit: bigint; freq: number };
  groceries: { unit: bigint; freq: number };
  transport: { unit: bigint; freq: number };
  utilities: { unit: bigint; freq: number };
  misc: { unit: bigint; freq: number };
}> = {
  minimum_viable: {
    quickMeal:    { unit: 500n,   freq: 12 },  // ¥500 × 12 = ¥6,000
    casualDining: { unit: 900n,   freq: 2  },  // ¥900 (Saizeriya) × 2 = ¥1,800
    social:       { unit: 2000n,  freq: 1  },  // ¥2,000 izakaya × 1
    groceries:    { unit: 25000n, freq: 1  },  // ¥25,000/month
    transport:    { unit: 8000n,  freq: 1  },  // ¥8,000 commuter pass
    utilities:    { unit: 3000n,  freq: 1  },  // ¥3,000 SIM/internet (if not deducted)
    misc:         { unit: 5000n,  freq: 1  },  // ¥5,000 personal
  },
  realistic_newcomer: {
    quickMeal:    { unit: 600n,   freq: 16 },  // ¥600 × 16 = ¥9,600
    casualDining: { unit: 1200n,  freq: 4  },  // ¥1,200 × 4 = ¥4,800
    social:       { unit: 3000n,  freq: 2  },  // ¥3,000 izakaya × 2 = ¥6,000
    groceries:    { unit: 30000n, freq: 1  },  // ¥30,000/month
    transport:    { unit: 10000n, freq: 1  },  // ¥10,000 commuter pass
    utilities:    { unit: 4000n,  freq: 1  },  // ¥4,000 phone+internet
    misc:         { unit: 8000n,  freq: 1  },  // ¥8,000 personal
  },
  comfortable: {
    quickMeal:    { unit: 800n,   freq: 20 },  // ¥800 × 20 = ¥16,000
    casualDining: { unit: 2000n,  freq: 6  },  // ¥2,000 × 6 = ¥12,000
    social:       { unit: 4000n,  freq: 3  },  // ¥4,000 izakaya × 3 = ¥12,000
    groceries:    { unit: 40000n, freq: 1  },  // ¥40,000/month
    transport:    { unit: 12000n, freq: 1  },  // ¥12,000 pass
    utilities:    { unit: 5000n,  freq: 1  },  // ¥5,000 phone+internet+streaming
    misc:         { unit: 15000n, freq: 1  }, // ¥15,000 personal
  },
};

/**
 * Indonesia expense basket presets.
 * Values in IDR rupiah.
 *
 * Quick meal examples: Warteg / Nasi Rames Rp 18.000–Rp 25.000
 * Casual dining: Solaria / Cafe lokal Rp 35.000–Rp 60.000
 * Social: Kopi / Nongkrong Rp 50.000–Rp 100.000
 */
export const ID_BASKETS: Record<LifestyleProfile, {
  quickMeal: { unit: bigint; freq: number };
  casualDining: { unit: bigint; freq: number };
  social: { unit: bigint; freq: number };
  groceries: { unit: bigint; freq: number };
  transport: { unit: bigint; freq: number };
  utilities: { unit: bigint; freq: number };
  misc: { unit: bigint; freq: number };
}> = {
  minimum_viable: {
    quickMeal:    { unit: 18000n,  freq: 15 }, // Warteg Rp 18k
    casualDining: { unit: 35000n,  freq: 2  }, // Cafe/warung Rp 35k
    social:       { unit: 50000n,  freq: 1  }, // Nongkrong Rp 50k
    groceries:    { unit: 600000n, freq: 1  }, // Belanja pasar Rp 600k
    transport:    { unit: 200000n, freq: 1  }, // Bensin motor Rp 200k
    utilities:    { unit: 150000n, freq: 1  }, // Pulsa + kuota Rp 150k
    misc:         { unit: 200000n, freq: 1  }, // Kebutuhan pribadi Rp 200k
  },
  realistic_newcomer: {
    quickMeal:    { unit: 25000n,   freq: 20 }, // Makan siang kantin/warteg Rp 25k × 20 = Rp 500k
    casualDining: { unit: 50000n,   freq: 4  }, // Resto / cafe Rp 50k × 4 = Rp 200k
    social:       { unit: 100000n,  freq: 2  }, // Kopi / nongkrong Rp 100k × 2 = Rp 200k
    groceries:    { unit: 900000n,  freq: 1  }, // Supermarket / pasar Rp 900k
    transport:    { unit: 350000n,  freq: 1  }, // TransJakarta / KRL / bensin Rp 350k
    utilities:    { unit: 300000n,  freq: 1  }, // Pulsa + internet + listrik kost Rp 300k
    misc:         { unit: 400000n,  freq: 1  }, // Personal care / laundry Rp 400k
  },
  comfortable: {
    quickMeal:    { unit: 35000n,   freq: 25 }, // Gofood / resto Rp 35k × 25 = Rp 875k
    casualDining: { unit: 85000n,   freq: 6  }, // Resto mall Rp 85k × 6 = Rp 510k
    social:       { unit: 200000n,  freq: 3  }, // Hangout / hiburan Rp 200k × 3 = Rp 600k
    groceries:    { unit: 1500000n, freq: 1  }, // Belanja bulanan supermarket Rp 1.5jt
    transport:    { unit: 700000n,  freq: 1  }, // Ojek online / bensin mobil Rp 700k
    utilities:    { unit: 500000n,  freq: 1  }, // Fiber internet + pulsa Rp 500k
    misc:         { unit: 800000n,  freq: 1  }, // Gym / lifestyle Rp 800k
  },
};

// ─── Basket Builder ───────────────────────────────────────────────────────────

function makeLineItem(
  key: string,
  labelKey: string,
  exampleKey: string,
  unit: bigint,
  freq: number,
  override?: { unitCost?: bigint; frequency?: number }
): ExpenseLineItem {
  const finalUnit = override?.unitCost ?? unit;
  const finalFreq = override?.frequency ?? freq;
  const monthly = BigInt(Math.round(Number(finalUnit) * finalFreq));

  return {
    key,
    labelKey,
    exampleKey,
    unitCostMinorUnits: finalUnit,
    monthlyFrequency: finalFreq,
    monthlyTotalMinorUnits: monthly,
    isOverridden: !!(override?.unitCost || override?.frequency),
  };
}

/**
 * Build a complete expense basket for a given country and lifestyle profile.
 *
 * @param country - 'DE', 'JP', or 'ID'
 * @param profile - lifestyle profile
 * @param overrides - optional per-item overrides from user
 */
export function buildExpenseBasket(
  country: CountryCode,
  profile: LifestyleProfile,
  overrides: BasketOverrides = {}
): ExpenseBasketResult {
  const presets =
    country === "DE"
      ? DE_BASKETS[profile]
      : country === "ID"
      ? ID_BASKETS[profile]
      : JP_BASKETS[profile];

  const items = {
    quickMeals: makeLineItem(
      "quickMeals",
      "basket.quick_meals",
      country === "DE"
        ? "basket.example.kebab_backerei"
        : country === "ID"
        ? "basket.example.warteg_kantin"
        : "basket.example.udon_gyudon",
      presets.quickMeal.unit,
      presets.quickMeal.freq,
      overrides.quickMeals
    ),
    casualDining: makeLineItem(
      "casualDining",
      "basket.casual_dining",
      country === "DE"
        ? "basket.example.mensa_restaurant"
        : country === "ID"
        ? "basket.example.solaria_cafe"
        : "basket.example.saizeriya_curry",
      presets.casualDining.unit,
      presets.casualDining.freq,
      overrides.casualDining
    ),
    socialOutings: makeLineItem(
      "socialOutings",
      "basket.social_outings",
      country === "DE"
        ? "basket.example.beer_garden"
        : country === "ID"
        ? "basket.example.kopi_nongkrong"
        : "basket.example.izakaya",
      presets.social.unit,
      presets.social.freq,
      overrides.socialOutings
    ),
    groceries: makeLineItem(
      "groceries",
      "basket.groceries",
      country === "DE"
        ? "basket.example.aldi_lidl"
        : country === "ID"
        ? "basket.example.supermarket_id"
        : "basket.example.supermarket_jp",
      presets.groceries.unit,
      presets.groceries.freq,
      overrides.groceries
    ),
    transport: makeLineItem(
      "transport",
      "basket.transport",
      country === "DE"
        ? "basket.example.deutschland_ticket"
        : country === "ID"
        ? "basket.example.transjakarta_krl"
        : "basket.example.commuter_pass",
      presets.transport.unit,
      presets.transport.freq,
      overrides.transport
    ),
    utilities: makeLineItem(
      "utilities",
      "basket.utilities",
      country === "DE"
        ? "basket.example.phone_internet_de"
        : country === "ID"
        ? "basket.example.pulsa_internet_id"
        : "basket.example.sim_internet_jp",
      presets.utilities.unit,
      presets.utilities.freq,
      overrides.utilities
    ),
    miscPersonal: makeLineItem(
      "miscPersonal",
      "basket.misc_personal",
      "basket.example.personal_care",
      presets.misc.unit,
      presets.misc.freq,
      overrides.miscPersonal
    ),
  };

  const monthlyFoodTotal =
    items.quickMeals.monthlyTotalMinorUnits +
    items.casualDining.monthlyTotalMinorUnits +
    items.groceries.monthlyTotalMinorUnits;

  const monthlyTransportTotal = items.transport.monthlyTotalMinorUnits;

  const monthlyUtilitiesTotal = items.utilities.monthlyTotalMinorUnits;

  const monthlyLifestyleTotal =
    items.socialOutings.monthlyTotalMinorUnits +
    items.miscPersonal.monthlyTotalMinorUnits;

  const monthlyGrandTotal =
    monthlyFoodTotal +
    monthlyTransportTotal +
    monthlyUtilitiesTotal +
    monthlyLifestyleTotal;

  return {
    profile,
    country,
    profileWarning:
      profile === "minimum_viable"
        ? "Constrained planning baseline — not a comfort recommendation. Basic needs only."
        : undefined,
    items,
    monthlyFoodTotal,
    monthlyTransportTotal,
    monthlyUtilitiesTotal,
    monthlyLifestyleTotal,
    monthlyGrandTotal,
  };
}

/** Get basket profiles sorted from cheapest to most expensive */
export const LIFESTYLE_PROFILES: LifestyleProfile[] = [
  "minimum_viable",
  "realistic_newcomer",
  "comfortable",
];
