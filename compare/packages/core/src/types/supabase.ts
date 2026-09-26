/**
 * @bandinghidup/core — Supabase Database Types
 *
 * Explicit TypeScript types mirroring the PostgreSQL schema defined in:
 * supabase/migrations/00001_initial_schema.sql
 *
 * Stage 0: Hand-written. Future stages will use `supabase gen types typescript`.
 */

// ─── Base Types ──────────────────────────────────────────────────────────────

export type UUID = string;
export type Timestamp = string; // ISO 8601

// ─── currencies ──────────────────────────────────────────────────────────────

export interface Currency {
  code: string;         // Primary key: 'EUR', 'JPY', 'IDR'
  symbol: string;       // '€', '¥', 'Rp'
  decimals: number;     // 2, 0, 0
  name_key: string;     // i18n key: 'currency.eur'
}

// ─── countries ───────────────────────────────────────────────────────────────

export interface Country {
  id: UUID;
  code: string;                   // 'DE', 'JP', 'ID'
  name_en: string;
  name_id: string;
  name_ja: string;
  default_currency_code: string;  // FK → currencies.code
  created_at: Timestamp;
}

// ─── administrative_regions ──────────────────────────────────────────────────

export type RegionType = "state" | "prefecture" | "province";

export interface AdministrativeRegion {
  id: UUID;
  country_id: UUID;     // FK → countries.id
  name: string;
  region_type: RegionType;
}

// ─── cities ──────────────────────────────────────────────────────────────────

export interface City {
  id: UUID;
  country_id: UUID;       // FK → countries.id
  region_id: UUID | null; // FK → administrative_regions.id
  name: string;
  is_major_hub: boolean;
  created_at: Timestamp;
}

// ─── income_pathways ─────────────────────────────────────────────────────────

export type PathwayCode =
  | "ausbildung"
  | "technical_intern"
  | "student"
  | "fresh_grad"
  | "custom";

export interface IncomePathway {
  id: UUID;
  code: PathwayCode;
  country_id: UUID;         // FK → countries.id
  name_key: string;         // i18n key
  description_key: string | null;
}

// ─── expense_categories ──────────────────────────────────────────────────────

export type ExpenseCategoryCode =
  | "housing"
  | "utilities"
  | "food"
  | "transport"
  | "lifestyle"
  | "relocation";

export interface ExpenseCategory {
  id: UUID;
  code: ExpenseCategoryCode;
  name_key: string;         // i18n key
  is_recurring: boolean;
  display_order: number;
}

// ─── audit_logs ──────────────────────────────────────────────────────────────

export interface AuditLog {
  id: UUID;
  action: string;
  entity_type: string;
  entity_id: UUID | null;
  payload: Record<string, unknown> | null;
  created_at: Timestamp;
}

// ─── Supabase Database Schema Type (for typed client) ────────────────────────

export interface Database {
  public: {
    Tables: {
      currencies: {
        Row: Currency;
        Insert: Omit<Currency, never>;
        Update: Partial<Currency>;
      };
      countries: {
        Row: Country;
        Insert: Omit<Country, "id" | "created_at">;
        Update: Partial<Omit<Country, "id">>;
      };
      administrative_regions: {
        Row: AdministrativeRegion;
        Insert: Omit<AdministrativeRegion, "id">;
        Update: Partial<Omit<AdministrativeRegion, "id">>;
      };
      cities: {
        Row: City;
        Insert: Omit<City, "id" | "created_at">;
        Update: Partial<Omit<City, "id">>;
      };
      income_pathways: {
        Row: IncomePathway;
        Insert: Omit<IncomePathway, "id">;
        Update: Partial<Omit<IncomePathway, "id">>;
      };
      expense_categories: {
        Row: ExpenseCategory;
        Insert: Omit<ExpenseCategory, "id">;
        Update: Partial<Omit<ExpenseCategory, "id">>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, "id" | "created_at">;
        Update: Partial<Omit<AuditLog, "id">>;
      };
    };
  };
}
