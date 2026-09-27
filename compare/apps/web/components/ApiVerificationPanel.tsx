"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import type { Country, City, IncomePathway } from "@bandinghidup/core";

// ─── Data Fetching ────────────────────────────────────────────────────────────

async function fetchCountries(): Promise<Country[]> {
  const { data, error } = await supabase
    .from("countries")
    .select("*")
    .order("name_en");
  if (error) throw error;
  return data as Country[];
}

async function fetchCitiesByCountry(countryId: string): Promise<City[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("country_id", countryId)
    .order("is_major_hub", { ascending: false })
    .order("name");
  if (error) throw error;
  return data as City[];
}

async function fetchPathwaysByCountry(countryId: string): Promise<IncomePathway[]> {
  const { data, error } = await supabase
    .from("income_pathways")
    .select("*")
    .eq("country_id", countryId);
  if (error) throw error;
  return data as IncomePathway[];
}

// ─── Country Flag Emojis ──────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  DE: "🇩🇪",
  JP: "🇯🇵",
  ID: "🇮🇩",
};

// ─── Helper Components ────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-[var(--accent)]">
      <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      <span className="text-sm">Memuat...</span>
    </div>
  );
}

function StatusDot({ ok, warning }: { ok: boolean; warning?: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${
        ok ? "bg-[var(--accent)] animate-pulse" : warning ? "bg-amber-400" : "bg-red-400"
      }`}
    />
  );
}

// ─── Country City Pathway Selector ───────────────────────────────────────────

export function CountryCityPathwaySelector() {
  const { t, locale } = useI18n();
  const [selectedCountryId, setSelectedCountryId] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>("");

  const {
    data: countries,
    isLoading: countriesLoading,
    error: countriesError,
  } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
  });

  const {
    data: cities,
    isLoading: citiesLoading,
  } = useQuery({
    queryKey: ["cities", selectedCountryId],
    queryFn: () => fetchCitiesByCountry(selectedCountryId),
    enabled: !!selectedCountryId,
  });

  const {
    data: pathways,
    isLoading: pathwaysLoading,
  } = useQuery({
    queryKey: ["pathways", selectedCountryId],
    queryFn: () => fetchPathwaysByCountry(selectedCountryId),
    enabled: !!selectedCountryId,
  });

  const selectedCountry = countries?.find((c) => c.id === selectedCountryId);
  const selectedCity = cities?.find((c) => c.id === selectedCityId);

  function handleCountryChange(countryId: string) {
    setSelectedCountryId(countryId);
    setSelectedCityId("");
    setSelectedPathwayId("");
  }

  const isConnected = !countriesError && !countriesLoading;
  const isTableMissing =
    (countriesError as any)?.code === "PGRST205" ||
    (countriesError as any)?.message?.includes("schema cache") ||
    (countriesError as any)?.message?.includes("countries");

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2
          id="api-verification-heading"
          className="text-lg font-semibold text-[var(--text)]"
        >
          {locale === "id" ? "Verifikasi Koneksi Data" : "Live Data Verification"}
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <StatusDot ok={isConnected} warning={isTableMissing} />
          <span className={isConnected ? "text-[var(--accent)]" : isTableMissing ? "text-amber-400" : "text-red-400"}>
            {countriesLoading
              ? "Connecting..."
              : isConnected
              ? "Supabase Connected"
              : isTableMissing
              ? (locale === "id" ? "Tabel Belum Dibuat" : "Tables Not Created")
              : "Connection Error"}
          </span>
        </div>
      </div>

      <hr className="divider" />

      {/* Country Selector */}
      <div className="space-y-2">
        <label
          htmlFor="country-select"
          className="block text-sm font-medium text-fg-70"
        >
          {t("form.select_country")}
        </label>
        {countriesLoading ? (
          <LoadingSpinner />
        ) : countriesError ? (
          <div className="rounded-lg p-3 text-sm space-y-1 bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <p className="font-semibold flex items-center gap-1.5">
              <span>⚠️</span>
              {((countriesError as any)?.code === "PGRST205" ||
                (countriesError as any)?.message?.includes("schema cache") ||
                (countriesError as any)?.message?.includes("countries"))
                ? (locale === "id"
                    ? "Koneksi Supabase OK, tapi tabel belum dibuat di database."
                    : "Supabase connected, but database tables are not created yet.")
                : (locale === "id"
                    ? "Gagal memuat data. Periksa konfigurasi Supabase di .env.local"
                    : "Failed to load data. Check your Supabase config in .env.local")}
            </p>
            {((countriesError as any)?.code === "PGRST205" ||
              (countriesError as any)?.message?.includes("schema cache") ||
              (countriesError as any)?.message?.includes("countries")) && (
              <p className="text-xs text-fg-70">
                {locale === "id"
                  ? "Buka Supabase SQL Editor lalu jalankan file 'supabase/full_setup.sql'."
                  : "Open Supabase SQL Editor and run 'supabase/full_setup.sql'."}
              </p>
            )}
          </div>
        ) : (
          <div className="relative">
            <select
              id="country-select"
              className="form-select"
              value={selectedCountryId}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              <option value="" disabled>
                {t("form.select_country")}
              </option>
              {countries?.map((country) => (
                <option key={country.id} value={country.id}>
                  {COUNTRY_FLAGS[country.code] ?? "🌏"}{" "}
                  {locale === "id" ? country.name_id : country.name_en}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accent)] text-xs">
              ▾
            </div>
          </div>
        )}
      </div>

      {/* City Selector */}
      <div className="space-y-2">
        <label
          htmlFor="city-select"
          className="block text-sm font-medium text-fg-70"
        >
          {t("form.select_city")}
        </label>
        <div className="relative">
          <select
            id="city-select"
            className="form-select"
            value={selectedCityId}
            onChange={(e) => setSelectedCityId(e.target.value)}
            disabled={!selectedCountryId || citiesLoading}
          >
            <option value="" disabled>
              {citiesLoading
                ? t("form.loading")
                : !selectedCountryId
                ? locale === "id"
                  ? "— Pilih negara dahulu —"
                  : locale === "ja"
                  ? "— 先に国を選択してください —"
                  : "— Select a country first —"
                : t("form.select_city")}
            </option>
            {cities?.map((city) => (
              <option key={city.id} value={city.id}>
                {city.is_major_hub ? "🏙️" : "🏘️"} {city.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accent)] text-xs">
            ▾
          </div>
        </div>
      </div>

      {/* Pathway Selector */}
      <div className="space-y-2">
        <label
          htmlFor="pathway-select"
          className="block text-sm font-medium text-fg-70"
        >
          {t("form.select_pathway")}
        </label>
        <div className="relative">
          <select
            id="pathway-select"
            className="form-select"
            value={selectedPathwayId}
            onChange={(e) => setSelectedPathwayId(e.target.value)}
            disabled={!selectedCountryId || pathwaysLoading}
          >
            <option value="" disabled>
              {pathwaysLoading
                ? t("form.loading")
                : !selectedCountryId
                ? locale === "id"
                  ? "— Pilih negara dahulu —"
                  : locale === "ja"
                  ? "— 先に国を選択してください —"
                  : "— Select a country first —"
                : t("form.select_pathway")}
            </option>
            {pathways?.map((pathway) => (
              <option key={pathway.id} value={pathway.id}>
                {t(pathway.name_key)}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--accent)] text-xs">
            ▾
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedCountry && (
        <div
          className="rounded-xl p-4 space-y-2"
          style={{
            background: "rgba(40, 144, 109, 0.08)",
            border: "1px solid rgba(40, 144, 109, 0.2)",
          }}
        >
          <p className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
            {locale === "id" ? "Pilihan Saat Ini" : "Current Selection"}
          </p>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-fg-muted text-xs">
                {locale === "id" ? "Negara" : "Country"}
              </p>
              <p className="text-[var(--text)] font-medium">
                {COUNTRY_FLAGS[selectedCountry.code]}{" "}
                {locale === "id" ? selectedCountry.name_id : selectedCountry.name_en}
              </p>
            </div>
            <div>
              <p className="text-fg-muted text-xs">
                {locale === "id" ? "Kota" : "City"}
              </p>
              <p className="text-[var(--text)] font-medium">
                {selectedCity ? selectedCity.name : "—"}
              </p>
            </div>
            <div>
              <p className="text-fg-muted text-xs">
                {locale === "id" ? "Jalur" : "Pathway"}
              </p>
              <p className="text-[var(--text)] font-medium text-xs">
                {selectedPathwayId
                  ? t(
                      pathways?.find((p) => p.id === selectedPathwayId)
                        ?.name_key ?? ""
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data source note */}
      <p className="text-xs text-fg-soft text-center">
        {t("footer.data_source")}
      </p>
    </div>
  );
}
