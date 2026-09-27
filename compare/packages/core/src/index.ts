/**
 * @bandinghidup/core — Public API
 * Re-exports all public types, utilities, and constants.
 */

// Monetary helpers
export {
  CURRENCY_DECIMALS,
  toMinorUnits,
  toMajorUnits,
  addMinorUnits,
  subtractMinorUnits,
  multiplyMinorUnits,
  formatCurrency,
  parseUserInput,
} from "./money/currency.js";

export type { SupportedCurrencyCode } from "./money/currency.js";

// Supabase database types
export type {
  UUID,
  Timestamp,
  Currency,
  Country,
  AdministrativeRegion,
  RegionType,
  City,
  IncomePathway,
  PathwayCode,
  ExpenseCategory,
  ExpenseCategoryCode,
  AuditLog,
  Database,
} from "./types/supabase.js";

// Calculator — Income
export {
  calculateAusbildungNet,
  calculateJapaneseTraineeNet,
  calculateGenericNet,
  AUSBILDUNG_REFERENCE_GROSS,
  GERMANY_SUFFICIENCY_BENCHMARK_CENTS,
} from "./calculator/income.js";
export type {
  TrainingYear,
  AusbildungIncomeResult,
  JapaneseTraineeDeductions,
  JapaneseTraineeIncomeResult,
  GenericIncomeResult,
} from "./calculator/income.js";

// Calculator — Housing
export {
  calculateMonthlyHousing,
  calculateUpfrontRelocation,
  getDefaultRelocationPreset,
  DE_HOUSING_BENCHMARKS,
  JP_HOUSING_BENCHMARKS,
  ID_HOUSING_BENCHMARKS,
  getCityHousingBenchmark,
} from "./calculator/housing.js";
export type {
  HousingType,
  CountryCode,
  HousingInput,
  RelocationInput,
  HousingMonthlyResult,
  RelocationResult,
} from "./calculator/housing.js";

// Calculator — Baskets
export {
  buildExpenseBasket,
  LIFESTYLE_PROFILES,
  DE_BASKETS,
  JP_BASKETS,
  ID_BASKETS,
} from "./calculator/baskets.js";
export type {
  LifestyleProfile,
  ExpenseLineItem,
  ExpenseBasketResult,
  BasketOverrides,
} from "./calculator/baskets.js";

// Calculator — Diagnostics
export {
  evaluateDiagnostics,
  getOverallSeverity,
} from "./calculator/diagnostics.js";
export type {
  DiagnosticLevel,
  DiagnosticCode,
  DiagnosticResult,
  DiagnosticInput,
} from "./calculator/diagnostics.js";

// Calculator — Scenario Orchestrator
export { computeScenario } from "./calculator/scenario.js";
export type {
  ScenarioInput,
  ScenarioResult,
  IncomeBreakdown,
  MonthlyExpenseBreakdown,
} from "./calculator/scenario.js";

// Big Mac Index, Street Food Index & Purchasing Power Parity
export {
  calculateBigMacIndex,
  compareBigMacParity,
  DEFAULT_BIG_MAC_PRICES,
  DEFAULT_STREET_FOOD_PRICES,
  DEFAULT_COFFEE_PRICES,
  DEFAULT_CPI_BASKET_PRICES,
  calculateLifestyleEquivalenceSalary,
} from "./calculator/bigmac.js";
export type {
  BigMacCountry,
  BigMacIndexResult,
  CalculateBigMacInput,
  FoodIndexType,
  EquivalenceLogic,
  IncomePeriodicity,
  FoodItemInfo,
  EquivalenceSummaryCard,
  LifestyleEquivalenceInput,
  LifestyleEquivalenceResult,
} from "./calculator/bigmac.js";

// Active Tax & Deduction Engine
export {
  calculateActiveDeductions,
} from "./calculator/taxDeductions.js";
export type {
  FamilyStatus,
  ActiveDeductionInput,
  ItemizedDeductionEntry,
  ActiveDeductionResult,
} from "./calculator/taxDeductions.js";

// Career Pathways & Trainee/Fresh Grad Engine
export {
  CAREER_PATHWAYS,
  getCareerPathwayBenchmark,
  CITY_WAGE_MULTIPLIERS,
  CITY_RENT_MULTIPLIERS,
  CITY_FOOD_MULTIPLIERS,
  getCityRentMultiplier,
  getCityFoodMultiplier,
  getCityWageMultiplier,
} from "./calculator/careerPathways.js";
export type {
  CareerPathwayCode,
  CareerPathwayInfo,
  CareerBenchmarkResult,
} from "./calculator/careerPathways.js";

// Income Percentile Engine
export {
  calculateIncomePercentile,
  compareIncomePercentiles,
  DEFAULT_PERCENTILE_ANCHORS,
} from "./calculator/percentile.js";
export type {
  PercentileCountry,
  IncomePercentileAnchor,
  PercentileCalculationResult,
} from "./calculator/percentile.js";

// Data Adapters (Stage 2)
export { parseDestatisPayload } from "./adapters/destatis.js";
export type { DestatisRawCpiPayload, NormalizedProposalOutput } from "./adapters/destatis.js";

export { parseEStatPayload } from "./adapters/estat.js";
export type { EStatRawPayload } from "./adapters/estat.js";

export { processApifyBatch, calculateMedian, filterOutliers } from "./adapters/apify.js";
export type { ApifyRawListingItem, ApifyBatchScrapeOutput } from "./adapters/apify.js";

// Sharing & Privacy (Stage 3)
export { generateToken, hashKey, verifyKeyHash } from "./sharing/token.js";
export { sanitizeFreeText } from "./sharing/redact.js";
export type { RedactionResult } from "./sharing/redact.js";

// Personalization & Advanced Modules (Stage 4)
export { calculateAusbildungDetailed, DE_GRUNDFREIBETRAG_ANNUAL_CENTS, DE_GRUNDFREIBETRAG_MONTHLY_CENTS } from "./calculator/pathways/ausbildung.js";
export type { AusbildungDetailedResult } from "./calculator/pathways/ausbildung.js";

export { calculateJapanTraineeDetailed, JP_EMPLOYER_DORM_CAP_YEN } from "./calculator/pathways/japan_trainee.js";
export type { JapanTraineeDetailedResult } from "./calculator/pathways/japan_trainee.js";

export { calculateFamilyHousehold, calculateChildBenefit, DE_KINDERGELD_PER_CHILD_CENTS, DE_KITA_FEE_PER_CHILD_CENTS, JP_HOIKUEN_FEE_PER_CHILD_YEN } from "./calculator/family/childcare.js";
export type { FamilyComposition, FamilyScalingInput, FamilyScalingResult } from "./calculator/family/childcare.js";

export { calculateCommuterTradeoff, SUBURBAN_RENT_DISCOUNT_MULTIPLIER } from "./calculator/commuter/tradeoff.js";
export type { CommuterZone, CommuterTradeoffInput, CommuterTradeoffResult } from "./calculator/commuter/tradeoff.js";

// Supported locales
export const SUPPORTED_LOCALES = ["id", "en", "de", "ja"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

// Active UI locales
export const ACTIVE_LOCALES = ["id", "en", "de", "ja"] as const;
export type ActiveLocale = (typeof ACTIVE_LOCALES)[number];

// Application constants & URLs
export {
  APP_DOMAIN,
  APP_CANONICAL_URL,
  BLOG_URL,
  COMMENTS_URL,
} from "./constants.js";

