"use client";

import React, { useState, useMemo } from "react";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currencyContext";
import {
  calculateLifestyleEquivalenceSalary,
  calculateIncomePercentile,
  getCityRentMultiplier,
  getCityFoodMultiplier,
  getCityHousingBenchmark,
  type PercentileCountry,
  DEFAULT_BIG_MAC_PRICES,
  DEFAULT_STREET_FOOD_PRICES,
  DEFAULT_COFFEE_PRICES,
  DEFAULT_CPI_BASKET_PRICES,
  type FoodIndexType,
  type EquivalenceLogic,
  type IncomePeriodicity,
  type CountryCode,
  type HousingType,
  type FamilyStatus,
  type City,
  type Country,
} from "@bandinghidup/core";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

const FALLBACK_CITIES_BY_COUNTRY: Record<CountryCode, string[]> = {
  DE: ["Berlin", "Munich", "Frankfurt am Main", "Hamburg", "Cologne", "Stuttgart", "Dusseldorf", "Nuremberg", "Leipzig", "Dresden"],
  JP: ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Kyoto", "Kobe", "Fukuoka", "Sapporo"],
  ID: ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Denpasar", "Yogyakarta"],
};

export function EquivalenceCalculatorClient() {
  const { locale } = useI18n();
  const { refCurrency, exchangeRates } = useCurrency();

  // Fetch Cities and Countries from Supabase
  const { data: countries } = useQuery<Country[]>({
    queryKey: ["countries-equivalence"],
    queryFn: async () => {
      const { data, error } = await supabase.from("countries").select("*");
      if (error) throw error;
      return data as Country[];
    },
  });

  const { data: cities } = useQuery<City[]>({
    queryKey: ["cities-equivalence"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*").order("name");
      if (error) throw error;
      return data as City[];
    },
  });

  // User Inputs: Locations & Periodicity
  const [sourceCountry, setSourceCountry] = useState<CountryCode>("ID");
  const [sourceCityName, setSourceCityName] = useState<string>("Jakarta");
  const [periodicity, setPeriodicity] = useState<IncomePeriodicity>("monthly");
  const [sourceGrossInput, setSourceGrossInput] = useState<string>("10000000"); // Default Rp 10.000.000 / month

  const [targetCountry, setTargetCountry] = useState<CountryCode>("DE");
  const [targetCityName, setTargetCityName] = useState<string>("Berlin");

  // Logic & Index Modes
  const [indexType, setIndexType] = useState<FoodIndexType>("street_food");
  const [equivalenceLogic, setEquivalenceLogic] = useState<EquivalenceLogic>("same_savings");
  const [housingType, setHousingType] = useState<HousingType>("studio");

  // Family Structure & Active Tax Parameters
  const [familyStatus, setFamilyStatus] = useState<FamilyStatus>("single");
  const [numChildren, setNumChildren] = useState<number>(0);
  const [taxClassDE, setTaxClassDE] = useState<1 | 3 | 4 | 5>(1);
  const [churchTaxDE, setChurchTaxDE] = useState<boolean>(false);
  const [isJapanSecondYear, setIsJapanSecondYear] = useState<boolean>(true);
  const [ptkpStatusID, setPtkpStatusID] = useState<"TK/0" | "K/0" | "K/1" | "K/2" | "K/3">("TK/0");

  // Custom Price Overrides
  const [customSourcePrice, setCustomSourcePrice] = useState<string>("");
  const [customTargetPrice, setCustomTargetPrice] = useState<string>("");
  const [customSourceRent, setCustomSourceRent] = useState<string>("");
  const [customTargetRent, setCustomTargetRent] = useState<string>("");

  // Default Recommended Prices based on Index
  const defaultPrices = useMemo(() => {
    if (indexType === "big_mac") return DEFAULT_BIG_MAC_PRICES;
    if (indexType === "coffee") return DEFAULT_COFFEE_PRICES;
    if (indexType === "cpi_basket") return DEFAULT_CPI_BASKET_PRICES;
    return DEFAULT_STREET_FOOD_PRICES;
  }, [indexType]);

  // Housing Benchmarks (Destatis / e-Stat / BPS)
  const sourceHousingBenchmark = useMemo(() => {
    return getCityHousingBenchmark(sourceCountry, sourceCityName, housingType);
  }, [sourceCountry, sourceCityName, housingType]);

  const targetHousingBenchmark = useMemo(() => {
    return getCityHousingBenchmark(targetCountry, targetCityName, housingType);
  }, [targetCountry, targetCityName, housingType]);

  // City Multipliers & Dynamic Recommendations
  const defaultSourceRent = useMemo(() => {
    const decimals = sourceCountry === "DE" ? 2 : 0;
    return Number(sourceHousingBenchmark.medianMinorUnits) / Math.pow(10, decimals);
  }, [sourceCountry, sourceHousingBenchmark]);

  const defaultTargetRent = useMemo(() => {
    const decimals = targetCountry === "DE" ? 2 : 0;
    return Number(targetHousingBenchmark.medianMinorUnits) / Math.pow(10, decimals);
  }, [targetCountry, targetHousingBenchmark]);

  const defaultSourceFoodPrice = useMemo(() => {
    const base = defaultPrices[sourceCountry].major;
    if (indexType === "big_mac") return base;
    const mult = getCityFoodMultiplier(sourceCityName);
    const p = base * mult;
    if (sourceCountry === "DE") return Math.round(p * 20) / 20;
    if (sourceCountry === "JP") return Math.round(p / 10) * 10;
    return Math.round(p / 500) * 500;
  }, [defaultPrices, sourceCountry, sourceCityName, indexType]);

  const defaultTargetFoodPrice = useMemo(() => {
    const base = defaultPrices[targetCountry].major;
    if (indexType === "big_mac") return base;
    const mult = getCityFoodMultiplier(targetCityName);
    const p = base * mult;
    if (targetCountry === "DE") return Math.round(p * 20) / 20;
    if (targetCountry === "JP") return Math.round(p / 10) * 10;
    return Math.round(p / 500) * 500;
  }, [defaultPrices, targetCountry, targetCityName, indexType]);

  const sourceRentMult = useMemo(() => getCityRentMultiplier(sourceCityName), [sourceCityName]);
  const targetRentMult = useMemo(() => getCityRentMultiplier(targetCityName), [targetCityName]);
  const sourceFoodMult = useMemo(() => getCityFoodMultiplier(sourceCityName), [sourceCityName]);
  const targetFoodMult = useMemo(() => getCityFoodMultiplier(targetCityName), [targetCityName]);

  // Filter cities by selected country (with fallback to official government city lists)
  const sourceCities = useMemo(() => {
    if (!cities || !countries) return [];
    const co = countries.find((c) => c.code === sourceCountry);
    return cities.filter((c) => c.country_id === co?.id);
  }, [cities, countries, sourceCountry]);

  const targetCities = useMemo(() => {
    if (!cities || !countries) return [];
    const co = countries.find((c) => c.code === targetCountry);
    return cities.filter((c) => c.country_id === co?.id);
  }, [cities, countries, targetCountry]);

  const sourceCityOptions = useMemo(() => {
    if (sourceCities && sourceCities.length > 0) return sourceCities.map((c) => c.name);
    return FALLBACK_CITIES_BY_COUNTRY[sourceCountry] || [sourceCityName];
  }, [sourceCities, sourceCountry, sourceCityName]);

  const targetCityOptions = useMemo(() => {
    if (targetCities && targetCities.length > 0) return targetCities.map((c) => c.name);
    return FALLBACK_CITIES_BY_COUNTRY[targetCountry] || [targetCityName];
  }, [targetCities, targetCountry, targetCityName]);

  // Convert gross input to monthly minor units
  const sourceGrossMonthlyMinorUnits = useMemo(() => {
    const rawVal = parseFloat(sourceGrossInput) || 0;
    const monthlyVal = periodicity === "yearly" ? rawVal / 12 : rawVal;
    const decimals = sourceCountry === "DE" ? 2 : 0;
    return BigInt(Math.round(monthlyVal * Math.pow(10, decimals)));
  }, [sourceGrossInput, periodicity, sourceCountry]);

  // Handle periodicity switch
  const handlePeriodicityChange = (newPeriod: IncomePeriodicity) => {
    if (newPeriod === periodicity) return;
    const currentVal = parseFloat(sourceGrossInput) || 0;
    if (newPeriod === "yearly") {
      setSourceGrossInput(String(Math.round(currentVal * 12)));
    } else {
      setSourceGrossInput(String(Math.round(currentVal / 12)));
    }
    setPeriodicity(newPeriod);
  };

  // Calculate Equivalence with Stage 4 Active Engine
  const equivalenceResult = useMemo(() => {
    return calculateLifestyleEquivalenceSalary({
      sourceCountry,
      sourceCityName,
      sourceGrossMonthlyMinorUnits,
      targetCountry,
      targetCityName,
      indexType,
      periodicity,
      equivalenceLogic,
      housingType,
      familyStatus,
      numChildren,
      taxClassDE,
      churchTaxDE,
      isJapanSecondYear,
      ptkpStatusID,
      customSourcePriceMajor: customSourcePrice ? parseFloat(customSourcePrice) : undefined,
      customTargetPriceMajor: customTargetPrice ? parseFloat(customTargetPrice) : undefined,
      customSourceRentMajor: customSourceRent ? parseFloat(customSourceRent) : undefined,
      customTargetRentMajor: customTargetRent ? parseFloat(customTargetRent) : undefined,
    });
  }, [
    sourceCountry,
    sourceCityName,
    sourceGrossMonthlyMinorUnits,
    targetCountry,
    targetCityName,
    indexType,
    periodicity,
    equivalenceLogic,
    housingType,
    familyStatus,
    numChildren,
    taxClassDE,
    churchTaxDE,
    isJapanSecondYear,
    ptkpStatusID,
    customSourcePrice,
    customTargetPrice,
    customSourceRent,
    customTargetRent,
  ]);

  const targetGrossMonthlyMinorUnits = useMemo(() => {
    const decimals = targetCountry === "DE" ? 2 : 0;
    return BigInt(Math.round(equivalenceResult.targetSummary.grossMonthlyMajor * Math.pow(10, decimals)));
  }, [equivalenceResult.targetSummary.grossMonthlyMajor, targetCountry]);

  const sourcePercentile = useMemo(() => {
    return calculateIncomePercentile(sourceGrossMonthlyMinorUnits, sourceCountry as PercentileCountry);
  }, [sourceGrossMonthlyMinorUnits, sourceCountry]);

  const targetPercentile = useMemo(() => {
    return calculateIncomePercentile(targetGrossMonthlyMinorUnits, targetCountry as PercentileCountry);
  }, [targetGrossMonthlyMinorUnits, targetCountry]);

  const sourceCur = sourceCountry === "DE" ? "€" : sourceCountry === "JP" ? "¥" : "Rp ";
  const targetCur = targetCountry === "DE" ? "€" : targetCountry === "JP" ? "¥" : "Rp ";

  const txt = (idStr: string, enStr: string, jaStr: string) =>
    locale === "ja" ? jaStr : locale === "en" ? enStr : idStr;

  const formatMoney = (val: number, cur: string) => {
    return `${cur}${Math.round(val).toLocaleString(locale === "id" ? "id-ID" : "en-US")}`;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in">
      {/* ── Title & Introduction ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="badge-brand text-xs">
            {txt("🌐 Gaya Hidup & Gaji Setara", "🌐 Lifestyle & Salary Equivalence", "🌐 生活水準・必要給与シミュレーター")}
          </span>
          <span className="text-xs text-white/40 font-mono">Stage 4 Active Parity Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-display font-bold text-white">
          {txt(
            "Berapa Gaji Setaraku di Luar Negeri?",
            "What Is My Equivalent Salary Abroad?",
            "海外で同等の生活水準を保つための必要給与シミュレーター"
          )}
        </h1>
        <p className="text-sm text-white/60 max-w-3xl leading-relaxed">
          {txt(
            "Hitung secara realistis berapa gaji kotor (gross) yang harus Anda dapatkan di negara tujuan agar standar hidup Anda tidak turun. Dilengkapi simulasi potongan pajak & asuransi aktif sesuai struktur keluarga, sewa tempat tinggal, serta berbagai pilihan logika daya beli riil.",
            "Calculate the exact gross salary you need abroad to preserve your domestic lifestyle, factoring in interactive statutory tax/social deductions, family dependents, local rent, and real purchasing power parities.",
            "生活水準を落とさずに海外移住・転職するために必要な額面年収・月給を精密に逆算。家族構成に応じた税金・社会保険料の天引きシミュレーション、都市別家賃相場、購買力平価（PPP）指数を統合。"
          )}
        </p>
      </div>

      {/* ── Control Card: Inputs, Periodicity, Parity Benchmark ──────── */}
      <div className="glass-card p-6 space-y-6 border border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Location & Salary */}
          <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center justify-between">
              <span>{txt("📍 Kondisi Anda Saat Ini (Kota Asal)", "📍 Current Status (Origin City)", "📍 現在の状況（出発地・現職）")}</span>
              <span className="badge-brand text-[10px]">{txt("Baseline Acuan", "Baseline Reference", "基準ベースライン")}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("Negara Asal", "Source Country", "国")}
                </label>
                <select
                  value={sourceCountry}
                  onChange={(e) => {
                    const c = e.target.value as CountryCode;
                    setSourceCountry(c);
                    if (c === "ID") {
                      setSourceCityName("Jakarta");
                      setSourceGrossInput(periodicity === "yearly" ? "120000000" : "10000000");
                      setPtkpStatusID("TK/0");
                    } else if (c === "JP") {
                      setSourceCityName("Tokyo");
                      setSourceGrossInput(periodicity === "yearly" ? "3600000" : "300000");
                    } else {
                      setSourceCityName("Berlin");
                      setSourceGrossInput(periodicity === "yearly" ? "42000" : "3500");
                    }
                  }}
                  className="form-select text-xs py-1.5"
                >
                  <option value="ID">🇮🇩 Indonesia</option>
                  <option value="JP">🇯🇵 {txt("Jepang", "Japan", "日本")}</option>
                  <option value="DE">🇩🇪 {txt("Jerman", "Germany", "ドイツ")}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("Kota Asal", "Source City", "都市")}
                </label>
                <select
                  value={sourceCityName}
                  onChange={(e) => setSourceCityName(e.target.value)}
                  className="form-select text-xs py-1.5"
                >
                  {sourceCityOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-white/50">
                  <span>{txt("Sewa:", "Rent:", "家賃:")}</span>
                  <span className={`font-mono font-semibold ${
                    sourceRentMult > 1.0 ? "text-amber-300" : sourceRentMult < 1.0 ? "text-emerald-300" : "text-white/70"
                  }`}>
                    {sourceRentMult > 1.0 ? `+${Math.round((sourceRentMult - 1) * 100)}%` : sourceRentMult < 1.0 ? `${Math.round((sourceRentMult - 1) * 100)}%` : txt("Acuan", "Baseline", "基準")}
                  </span>
                  <span>•</span>
                  <span>{txt("Makan:", "Food:", "食費:")}</span>
                  <span className={`font-mono font-semibold ${
                    sourceFoodMult > 1.0 ? "text-amber-300" : sourceFoodMult < 1.0 ? "text-emerald-300" : "text-white/70"
                  }`}>
                    {sourceFoodMult > 1.0 ? `+${Math.round((sourceFoodMult - 1) * 100)}%` : sourceFoodMult < 1.0 ? `${Math.round((sourceFoodMult - 1) * 100)}%` : txt("Acuan", "Baseline", "基準")}
                  </span>
                </div>
              </div>
            </div>

            {/* Salary Input with Monthly / Yearly Dropdown Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-white/70 font-medium">
                  {txt("Gaji Kotor / Gross Saat Ini:", "Current Gross Salary:", "現在の額面給与（Gross）:")}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/50">{txt("Periode:", "Period:", "期間:")}</span>
                  <select
                    value={periodicity}
                    onChange={(e) => handlePeriodicityChange(e.target.value as IncomePeriodicity)}
                    className="form-select text-[11px] py-0.5 px-2 bg-white/10 rounded-md border-brand-500/40 text-brand-300 font-semibold"
                  >
                    <option value="monthly">{txt("Per Bulan (Monthly)", "Monthly", "月給（月額）")}</option>
                    <option value="yearly">{txt("Per Tahun (Yearly)", "Annual / Yearly", "年収（年額）")}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-white/70">{sourceCur}</span>
                <input
                  type="number"
                  value={sourceGrossInput}
                  onChange={(e) => setSourceGrossInput(e.target.value)}
                  className="form-select text-sm font-mono font-bold py-2"
                  placeholder="10000000"
                />
              </div>

              <div className="flex justify-between text-[10px] text-white/40 mt-1 font-mono">
                <span>
                  {periodicity === "yearly"
                    ? `~${formatMoney(Number(sourceGrossInput) / 12, sourceCur)}/${txt("bulan", "mo", "月")}`
                    : `~${formatMoney(Number(sourceGrossInput) * 12, sourceCur)}/${txt("tahun", "yr", "年")}`}
                </span>
                <span>{txt("Statistik Resmi", "Official Data", "公的統計データ")}</span>
              </div>
            </div>
          </div>

          {/* Target Location */}
          <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent-400 flex items-center justify-between">
              <span>{txt("🎯 Kota Tujuan yang Dituju", "🎯 Target Destination", "🎯 移住・転職先の都市（目的地）")}</span>
              <span className="badge-accent text-[10px]">{txt("Tujuan Relokasi", "Relocation Target", "移住目的地")}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("Negara Tujuan", "Target Country", "渡航先（国）")}
                </label>
                <select
                  value={targetCountry}
                  onChange={(e) => {
                    const c = e.target.value as CountryCode;
                    setTargetCountry(c);
                    if (c === "DE") setTargetCityName("Berlin");
                    else if (c === "JP") setTargetCityName("Tokyo");
                    else setTargetCityName("Jakarta");
                  }}
                  className="form-select text-xs py-1.5"
                >
                  <option value="DE">🇩🇪 {txt("Jerman", "Germany", "ドイツ")}</option>
                  <option value="JP">🇯🇵 {txt("Jepang", "Japan", "日本")}</option>
                  <option value="ID">🇮🇩 Indonesia</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("Kota Tujuan", "Target City", "都市")}
                </label>
                <select
                  value={targetCityName}
                  onChange={(e) => setTargetCityName(e.target.value)}
                  className="form-select text-xs py-1.5"
                >
                  {targetCityOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-white/50">
                  <span>{txt("Sewa:", "Rent:", "家賃:")}</span>
                  <span className={`font-mono font-semibold ${
                    targetRentMult > 1.0 ? "text-amber-300" : targetRentMult < 1.0 ? "text-emerald-300" : "text-white/70"
                  }`}>
                    {targetRentMult > 1.0 ? `+${Math.round((targetRentMult - 1) * 100)}%` : targetRentMult < 1.0 ? `${Math.round((targetRentMult - 1) * 100)}%` : txt("Acuan", "Baseline", "基準")}
                  </span>
                  <span>•</span>
                  <span>{txt("Makan:", "Food:", "食費:")}</span>
                  <span className={`font-mono font-semibold ${
                    targetFoodMult > 1.0 ? "text-amber-300" : targetFoodMult < 1.0 ? "text-emerald-300" : "text-white/70"
                  }`}>
                    {targetFoodMult > 1.0 ? `+${Math.round((targetFoodMult - 1) * 100)}%` : targetFoodMult < 1.0 ? `${Math.round((targetFoodMult - 1) * 100)}%` : txt("Acuan", "Baseline", "基準")}
                  </span>
                </div>
              </div>
            </div>

            {/* Parity Index Mode Selector */}
            <div>
              <label className="block text-[11px] text-white/60 mb-1">
                {txt("Pilihan Indeks Daya Beli Riil:", "Real Purchasing Power Benchmark:", "実質購買力平価（PPP）指数の選択:")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIndexType("street_food")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-2 ${
                    indexType === "street_food"
                      ? "bg-brand-500 text-white font-bold border border-brand-400/40 shadow-sm"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/5"
                  }`}
                >
                  <span className="text-base">🥙</span>
                  <div>
                    <div className="font-semibold">Street Food</div>
                    <div className="text-[10px] opacity-70">
                      {txt("Döner · Udon · Mie Ayam", "Döner · Udon · Street Eats", "ドネルケバブ・うどん・ローカル食")}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIndexType("big_mac")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-2 ${
                    indexType === "big_mac"
                      ? "bg-brand-500 text-white font-bold border border-brand-400/40 shadow-sm"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/5"
                  }`}
                >
                  <span className="text-base">🍔</span>
                  <div>
                    <div className="font-semibold">Big Mac Index</div>
                    <div className="text-[10px] opacity-70">
                      {txt("Standar The Economist", "The Economist Standard", "エコノミスト誌の世界標準指数")}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIndexType("coffee")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-2 ${
                    indexType === "coffee"
                      ? "bg-brand-500 text-white font-bold border border-brand-400/40 shadow-sm"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/5"
                  }`}
                >
                  <span className="text-base">☕</span>
                  <div>
                    <div className="font-semibold">Coffee / Cafe</div>
                    <div className="text-[10px] opacity-70">
                      {txt("Cappuccino · Kopi Susu", "Cappuccino · Specialty Coffee", "カプチーノ・カフェ生活指数")}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIndexType("cpi_basket")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-2 ${
                    indexType === "cpi_basket"
                      ? "bg-brand-500 text-white font-bold border border-brand-400/40 shadow-sm"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/5"
                  }`}
                >
                  <span className="text-base">🛒</span>
                  <div>
                    <div className="font-semibold">CPI Consumer</div>
                    <div className="text-[10px] opacity-70">
                      {txt("Keranjang Konsumsi BPS/Destatis", "Official BPS/Destatis Basket", "公的消費者物価・生活費バスケット")}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Housing Type & Size (Official Benchmarks) ─────────────────── */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs text-white/80 font-semibold flex items-center gap-1.5">
              <span>🏠</span>
              <span>
                {txt("Tipe & Ukuran Tempat Tinggal (Acuan Biaya Sewa):", "Housing Type & Reference Apartment Size:", "住居タイプ・広さ（家賃基準）:")}
              </span>
            </span>
            <span className="text-[11px] text-brand-300 font-mono">
              {housingType === "shared_room"
                ? txt("Hemat (WG-Zimmer / Share / Kos Non-AC ~15 m²)", "Budget (Shared Room / WG / Co-living ~15 m²)", "節約（WGシェアハウス・個室 ~15 m²）")
                : housingType === "studio"
                ? txt("Standar Mandiri (Studio / 1K / Kos AC ~20–30 m²)", "Independent Standard (Studio / 1K / 1-Room ~20–30 m²)", "標準単身（ワンルーム / 1K ~20–30 m²）")
                : txt("Lapang / Keluarga (2-Zimmer / 1LDK / Kontrakan ~45–60 m²)", "Spacious / Family (1-2 Bedroom / 1LDK ~45–60 m²)", "ファミリー・広め（1LDK / 2部屋 ~45–60 m²）")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setHousingType("shared_room")}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                housingType === "shared_room"
                  ? "bg-brand-500/20 border-brand-400/60 text-white ring-1 ring-brand-400"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                <span>{txt("🛏️ Kamar Bersama / WG", "🛏️ Shared Room / WG", "🛏️ シェアハウス / 個室")}</span>
                <span className="text-[10px] opacity-70">~15 m²</span>
              </div>
              <p className="text-[10px] leading-relaxed opacity-75">
                {txt(
                  "WG-Zimmer (DE), Sharehouse (JP), atau Kost Non-AC Kamar Mandi Luar (ID).",
                  "WG-Zimmer (DE), Sharehouse (JP), or shared bathroom rental (ID).",
                  "ドイツのWG個室、日本のシェアハウス、インドネシアの標準コス。"
                )}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setHousingType("studio")}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                housingType === "studio"
                  ? "bg-brand-500/20 border-brand-400/60 text-white ring-1 ring-brand-400"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                <span>{txt("🏠 Studio / 1K / Kos AC", "🏠 Studio / 1K / Private", "🏠 ワンルーム / 1K")}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-brand-500/40 text-brand-200">
                  {txt("Default", "Default", "標準")}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed opacity-75">
                {txt(
                  "1-Zimmer-Wohnung (DE), 1K/1R (JP), atau Kost Eksklusif AC KM Dalam (ID).",
                  "1-Zimmer-Wohnung (DE), 1K/1R (JP), or ensuite private room (ID).",
                  "ドイツの1 Zimmer、日本の1K/1Rマンション、バス・エアコン付。"
                )}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setHousingType("one_bedroom")}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                housingType === "one_bedroom"
                  ? "bg-brand-500/20 border-brand-400/60 text-white ring-1 ring-brand-400"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                <span>{txt("🛋️ Apartemen 1-2 Kamar", "🛋️ 1-2 Bedroom Apartment", "🛋️ 1LDK / 2部屋アパート")}</span>
                <span className="text-[10px] opacity-70">~45–60 m²</span>
              </div>
              <p className="text-[10px] leading-relaxed opacity-75">
                {txt(
                  "2-Zimmer-Wohnung (DE), 1LDK (JP), atau Apartemen 1-BR / Kontrakan Rumah (ID).",
                  "2-Zimmer-Wohnung (DE), 1LDK (JP), or 1-bedroom flat (ID).",
                  "ドイツの2 Zimmer、日本の1LDK、広めの独立居住空間。"
                )}
              </p>
            </button>
          </div>
        </div>

        {/* ── Equivalence Logic Selector ───────────────────────────────── */}
        <div className="pt-4 border-t border-white/10 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs text-white/80 font-semibold flex items-center gap-1.5">
              <span>⚖️</span>
              <span>
                {txt(
                  "Logika Kesetaraan Daya Beli yang Ingin Dicapai:",
                  "Target Purchasing Power Parity Logic:",
                  "目指す実質購買力・生活水準の均衡ロジック:"
                )}
              </span>
            </span>
            <span className="text-[11px] text-amber-300 font-mono">
              {txt("Pilih fokus kesetaraan hidup Anda", "Select your equivalence priority", "優先する生活水準の基準を選択してください")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setEquivalenceLogic("same_savings")}
              className={`p-3 rounded-xl text-left border transition-all ${
                equivalenceLogic === "same_savings"
                  ? "bg-brand-500/20 border-brand-400/60 text-white shadow-sm ring-1 ring-brand-400"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>{txt("🪙 Sisa Uang & Tabungan Setara", "🪙 Same Savings & Discretionary", "🪙 自由裁量・実質貯金額の一致")}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/40 text-brand-200">
                  {txt("Rekomendasi", "Recommended", "推奨")}
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-80">
                {txt(
                  "Mempertahankan jumlah sisa uang / kapasitas belanja riil yang sama setelah membayar sewa & kebutuhan dasar.",
                  "Preserve the exact same discretionary surplus and real savings capacity after paying rent & essential living costs.",
                  "家賃や生活費を支払った後の「自由に使えるお金・貯蓄力」の実質的な価値を保ちます。"
                )}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setEquivalenceLogic("same_net")}
              className={`p-3 rounded-xl text-left border transition-all ${
                equivalenceLogic === "same_net"
                  ? "bg-brand-500/20 border-brand-400/60 text-white shadow-sm ring-1 ring-brand-400"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>{txt("💵 Gaji Bersih (Net) Setara", "💵 Same Take-Home Pay (Net)", "💵 手取り額面購買力の一致")}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-80">
                {txt(
                  "Menyamakan total daya beli seluruh uang yang dibawa pulang (Take Home Pay) dalam unit makanan riil.",
                  "Equalize the total purchasing power of take-home pay in real local consumption units.",
                  "手取り給与（Take Home Pay）全体の購買力を、現地物価水準に合わせて均等化します。"
                )}
              </p>
            </button>

            <button
              type="button"
              onClick={() => setEquivalenceLogic("same_gross")}
              className={`p-3 rounded-xl text-left border transition-all ${
                equivalenceLogic === "same_gross"
                  ? "bg-brand-500/20 border-brand-400/60 text-white shadow-sm ring-1 ring-brand-400"
                  : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>{txt("💼 Gaji Kotor (Gross) Setara", "💼 Same Contract Gross", "💼 契約額面（Gross）の一致")}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-80">
                {txt(
                  "Menyamakan nilai kontrak kerja bruto secara langsung berdasarkan rasio paritas harga indeks tanpa memotong pajak lebih dahulu.",
                  "Directly benchmark the gross contract offer against the price parity ratio without prior tax adjustments.",
                  "税金の差を考慮せず、単純な物価バスケット比率で額面契約額をそのまま換算します。"
                )}
              </p>
            </button>
          </div>
        </div>

        {/* ── Custom Price & Rent Customizer Accordion ───────────────── */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70 font-semibold flex items-center gap-1.5">
              <span>⚙️</span>
              <span>
                {txt(
                  "Sesuaikan Harga Acuan & Sewa Hunian (Opsional):",
                  "Customize Price & Rent Benchmarks (Optional):",
                  "物価基準・家賃の手動微調整（任意）:"
                )}
              </span>
            </span>
            <span className="text-[11px] text-brand-300 font-mono">
              {txt("💡 Rekomendasi Statistik Aktif", "💡 Active Statistical Recommendations", "💡 公的統計による推奨値適用中")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-white/50 mb-1">
                {equivalenceResult.sourceFoodItem.emoji} {equivalenceResult.sourceFoodItem.itemName} ({sourceCityName})
              </label>
              <input
                type="number"
                placeholder={String(defaultSourceFoodPrice)}
                value={customSourcePrice}
                onChange={(e) => setCustomSourcePrice(e.target.value)}
                className="form-select text-xs py-1.5 font-mono"
              />
              <span className="text-[10px] text-white/40 block mt-0.5">
                {txt("Rekomendasi", "Recommended", "推奨値")} {sourceCityName}: {formatMoney(defaultSourceFoodPrice, sourceCur)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-white/50 mb-1">
                {equivalenceResult.targetFoodItem.emoji} {equivalenceResult.targetFoodItem.itemName} ({targetCityName})
              </label>
              <input
                type="number"
                placeholder={String(defaultTargetFoodPrice)}
                value={customTargetPrice}
                onChange={(e) => setCustomTargetPrice(e.target.value)}
                className="form-select text-xs py-1.5 font-mono"
              />
              <span className="text-[10px] text-white/40 block mt-0.5">
                {txt("Rekomendasi", "Recommended", "推奨値")} {targetCityName}: {formatMoney(defaultTargetFoodPrice, targetCur)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-white/50 mb-1 truncate">
                🏠 {txt("Sewa", "Rent", "家賃")} {sourceHousingBenchmark.label} ({sourceCityName})
              </label>
              <input
                type="number"
                placeholder={String(defaultSourceRent)}
                value={customSourceRent}
                onChange={(e) => setCustomSourceRent(e.target.value)}
                className="form-select text-xs py-1.5 font-mono"
              />
              <span className="text-[10px] text-white/40 block mt-0.5">
                {txt("Rekomendasi:", "Recommended:", "推奨家賃:")} {formatMoney(defaultSourceRent, sourceCur)}
              </span>
              <span className="text-[9px] text-brand-300/80 block font-mono truncate" title={sourceHousingBenchmark.sourceCitation}>
                {txt("Rentang:", "Range:", "相場範囲:")} {formatMoney(Number(sourceHousingBenchmark.minMinorUnits) / Math.pow(10, sourceCountry === "DE" ? 2 : 0), sourceCur)} – {formatMoney(Number(sourceHousingBenchmark.maxMinorUnits) / Math.pow(10, sourceCountry === "DE" ? 2 : 0), sourceCur)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-white/50 mb-1 truncate">
                🏠 {txt("Sewa", "Rent", "家賃")} {targetHousingBenchmark.label} ({targetCityName})
              </label>
              <input
                type="number"
                placeholder={String(defaultTargetRent)}
                value={customTargetRent}
                onChange={(e) => setCustomTargetRent(e.target.value)}
                className="form-select text-xs py-1.5 font-mono"
              />
              <span className="text-[10px] text-white/40 block mt-0.5">
                {txt("Rekomendasi:", "Recommended:", "推奨家賃:")} {formatMoney(defaultTargetRent, targetCur)}
              </span>
              <span className="text-[9px] text-brand-300/80 block font-mono truncate" title={targetHousingBenchmark.sourceCitation}>
                {txt("Rentang:", "Range:", "相場範囲:")} {formatMoney(Number(targetHousingBenchmark.minMinorUnits) / Math.pow(10, targetCountry === "DE" ? 2 : 0), targetCur)} – {formatMoney(Number(targetHousingBenchmark.maxMinorUnits) / Math.pow(10, targetCountry === "DE" ? 2 : 0), targetCur)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Conclusion Symmetrical Comparison Cards ──────────────────── */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
          <span>📊</span>
          <span>
            {txt(
              "Kesimpulan Perbandingan Gaji & Beban Hidup (Item Identik)",
              "Conclusion: Symmetrical Salary & Living Cost Comparison",
              "総括：同一基準による給与・生活費の対比比較"
            )}
          </span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Status Card */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-brand-400 bg-gradient-to-br from-brand-500/5 to-transparent">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                  {txt("Kondisi Anda Saat Ini (Acuan)", "Current Baseline (Origin)", "現在の状況（基準）")}
                </span>
                <span className="badge-brand text-[10px]">
                  {periodicity === "yearly" ? txt("Per Tahun", "Yearly", "年額") : txt("Per Bulan", "Monthly", "月額")}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {periodicity === "yearly"
                  ? formatMoney(equivalenceResult.sourceSummary.grossYearlyMajor, sourceCur)
                  : formatMoney(equivalenceResult.sourceSummary.grossMonthlyMajor, sourceCur)}
                <span className="text-xs text-white/50 font-normal ml-2">
                  / {periodicity === "yearly" ? txt("thn kotor", "yr gross", "年額面") : txt("bln kotor", "mo gross", "月額面")}
                </span>
              </h3>
              <p className="text-xs text-white/50">{sourceCityName}, {sourceCountry}</p>
            </div>

            <hr className="divider" />

            {/* Symmetrical 4 Core Items */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                <span className="text-white/80 font-medium">
                  {txt("1. Gaji Bersih (Take Home Pay):", "1. Net Take-Home Pay:", "1. 手取り月給（Take Home Pay）:")}
                </span>
                <span className="font-mono font-bold text-white text-base">
                  {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.sourceSummary.netYearlyMajor, sourceCur)
                    : formatMoney(equivalenceResult.sourceSummary.netMonthlyMajor, sourceCur)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60">
                  {txt("2. Total Deduksi (Pajak & Asuransi):", "2. Total Deductions (Tax & Social):", "2. 天引き総額（税金・社会保険料）:")}
                </span>
                <span className="font-mono text-red-400 font-semibold">
                  - {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.sourceSummary.totalDeductionsYearlyMajor, sourceCur)
                    : formatMoney(equivalenceResult.sourceSummary.totalDeductionsMonthlyMajor, sourceCur)}
                  <span className="text-[11px] text-white/40 ml-1">
                    ({(equivalenceResult.sourceSummary.effectiveDeductionRate * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60">
                  {txt("3. Total Konsumsi (Sewa + Makan + Rutin):", "3. Total Consumption (Rent + Food + Transit):", "3. 生活費総額（家賃＋食費＋光熱費）:")}
                </span>
                <span className="font-mono text-white/80">
                  - {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.sourceSummary.totalConsumptionYearlyMajor, sourceCur)
                    : formatMoney(equivalenceResult.sourceSummary.totalConsumptionMonthlyMajor, sourceCur)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white/80 font-semibold">
                  {txt("4. Sisa Uang Belanja & Tabungan:", "4. Discretionary Spending & Savings:", "4. 自由裁量余剰金・貯蓄可能額:")}
                </span>
                <span className="font-mono text-emerald-400 font-bold text-base">
                  + {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.sourceSummary.discretionarySavingsYearlyMajor, sourceCur)
                    : formatMoney(equivalenceResult.sourceSummary.discretionarySavingsMonthlyMajor, sourceCur)}
                </span>
              </div>

              {/* Financial Health Indicators (Rent-to-Net & Savings Rate) */}
              {(() => {
                const rentRatio = Math.round((equivalenceResult.sourceSummary.rentMonthlyMajor / Math.max(1, equivalenceResult.sourceSummary.netMonthlyMajor)) * 100);
                const savingsRate = Math.round((equivalenceResult.sourceSummary.discretionarySavingsMonthlyMajor / Math.max(1, equivalenceResult.sourceSummary.netMonthlyMajor)) * 100);
                return (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-mono font-medium ${
                      rentRatio <= 30 ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" :
                      rentRatio <= 40 ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
                      "bg-red-500/15 text-red-300 border border-red-500/30"
                    }`}>
                      {txt("🏠 Sewa:", "🏠 Rent:", "🏠 家賃比率:")} {rentRatio}% {txt("Gaji Bersih", "of Net", "手取り比")} {rentRatio <= 30 ? txt("(Aman)", "(Healthy)", "(適正)") : rentRatio <= 40 ? txt("(Moderat)", "(Moderate)", "(標準)") : txt("(Beban Tinggi)", "(High Burden)", "(高負担)")}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-medium bg-brand-500/15 text-brand-300 border border-brand-500/30">
                      {txt("📈 Tabungan:", "📈 Savings Rate:", "📈 貯蓄率:")} {savingsRate}%
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-between items-center pt-1 text-xs text-white/50">
                <span>
                  {txt("Daya Beli", "Purchasing Power", "購買力（食数）:")} {equivalenceResult.sourceFoodItem.itemName}:
                </span>
                <span className="font-mono text-amber-300 font-semibold">
                  {equivalenceResult.sourceFoodItem.emoji} {equivalenceResult.sourceSummary.foodPurchasingPowerQuantity} {txt("porsi / bln", "servings / mo", "食 / 月")}
                </span>
              </div>
            </div>
          </div>

          {/* Target Required Salary Card */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-accent-400 bg-gradient-to-br from-accent-500/10 to-transparent">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-accent-400 uppercase tracking-wider">
                  {txt(
                    "Gaji Kotor yang Harus Anda Minta di Kontrak",
                    "Required Gross Contract Salary to Demand",
                    "契約交渉で提示すべき必要額面年収・月給"
                  )}
                </span>
                <span className="badge-accent text-[10px]">
                  {txt("Target Setara", "Equivalence Target", "目標水準")}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-accent-300 via-amber-200 to-accent-400">
                  {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.targetSummary.grossYearlyMajor, targetCur)
                    : formatMoney(equivalenceResult.targetSummary.grossMonthlyMajor, targetCur)}
                </h3>
                <span className="text-xs text-white/60 font-medium">
                  / {periodicity === "yearly" ? txt("thn gross", "yr gross", "年額面") : txt("bln gross", "mo gross", "月額面")}
                </span>
              </div>
              <p className="text-xs text-white/50">{targetCityName}, {targetCountry}</p>
            </div>

            <hr className="divider" />

            {/* Symmetrical 4 Core Items */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-accent-400/20">
                <span className="text-white/80 font-medium">
                  {txt("1. Gaji Bersih (Take Home Pay):", "1. Net Take-Home Pay:", "1. 手取り月給（Take Home Pay）:")}
                </span>
                <span className="font-mono font-bold text-accent-300 text-base">
                  {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.targetSummary.netYearlyMajor, targetCur)
                    : formatMoney(equivalenceResult.targetSummary.netMonthlyMajor, targetCur)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60">
                  {txt("2. Total Deduksi (Pajak & Asuransi):", "2. Total Deductions (Tax & Social):", "2. 天引き総額（税金・社会保険料）:")}
                </span>
                <span className="font-mono text-red-400 font-semibold">
                  - {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.targetSummary.totalDeductionsYearlyMajor, targetCur)
                    : formatMoney(equivalenceResult.targetSummary.totalDeductionsMonthlyMajor, targetCur)}
                  <span className="text-[11px] text-white/40 ml-1">
                    ({(equivalenceResult.targetSummary.effectiveDeductionRate * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60">
                  {txt("3. Total Konsumsi (Sewa + Makan + Rutin):", "3. Total Consumption (Rent + Food + Transit):", "3. 生活費総額（家賃＋食費＋光熱費）:")}
                </span>
                <span className="font-mono text-white/80">
                  - {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.targetSummary.totalConsumptionYearlyMajor, targetCur)
                    : formatMoney(equivalenceResult.targetSummary.totalConsumptionMonthlyMajor, targetCur)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white/80 font-semibold">
                  {txt("4. Sisa Uang Belanja & Tabungan:", "4. Discretionary Spending & Savings:", "4. 自由裁量余剰金・貯蓄可能額:")}
                </span>
                <span className="font-mono text-emerald-400 font-bold text-base">
                  + {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.targetSummary.discretionarySavingsYearlyMajor, targetCur)
                    : formatMoney(equivalenceResult.targetSummary.discretionarySavingsMonthlyMajor, targetCur)}
                </span>
              </div>

              {/* Financial Health Indicators (Rent-to-Net & Savings Rate) */}
              {(() => {
                const rentRatio = Math.round((equivalenceResult.targetSummary.rentMonthlyMajor / Math.max(1, equivalenceResult.targetSummary.netMonthlyMajor)) * 100);
                const savingsRate = Math.round((equivalenceResult.targetSummary.discretionarySavingsMonthlyMajor / Math.max(1, equivalenceResult.targetSummary.netMonthlyMajor)) * 100);
                return (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-mono font-medium ${
                      rentRatio <= 30 ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" :
                      rentRatio <= 40 ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
                      "bg-red-500/15 text-red-300 border border-red-500/30"
                    }`}>
                      {txt("🏠 Sewa:", "🏠 Rent:", "🏠 家賃比率:")} {rentRatio}% {txt("Gaji Bersih", "of Net", "手取り比")} {rentRatio <= 30 ? txt("(Aman)", "(Healthy)", "(適正)") : rentRatio <= 40 ? txt("(Moderat)", "(Moderate)", "(標準)") : txt("(Beban Tinggi)", "(High Burden)", "(高負担)")}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-medium bg-accent-500/15 text-accent-300 border border-accent-500/30">
                      {txt("📈 Tabungan:", "📈 Savings Rate:", "📈 貯蓄率:")} {savingsRate}%
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-between items-center pt-1 text-xs text-white/50">
                <span>
                  {txt("Daya Beli", "Purchasing Power", "購買力（食数）:")} {equivalenceResult.targetFoodItem.itemName}:
                </span>
                <span className="font-mono text-amber-300 font-semibold">
                  {equivalenceResult.targetFoodItem.emoji} {equivalenceResult.targetSummary.foodPurchasingPowerQuantity} {txt("porsi / bln", "servings / mo", "食 / 月")}
                </span>
              </div>
            </div>
          </div>
      </div>

      {/* ── National Income Percentile Comparison (Mini Pillar 4 Integration) ─ */}
      <div className="glass-card p-6 space-y-4 border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>📊</span>
              <span>
                {txt(
                  "Posisi Persentil & Status Ekonomi Nasional",
                  "National Income Percentile & Economic Standing",
                  "国内所得パーセンタイル・経済階層の位置づけ"
                )}
              </span>
            </h3>
            <p className="text-xs text-white/50">
              {txt(
                "Bandingkan kelas pendapatan Anda di kota asal dengan kelas pendapatan dari gaji target di kota tujuan.",
                "Compare your income percentile at home with the required target salary percentile in your destination.",
                "出発地の国内給与分布におけるあなたの位置と、渡航先で要求される目標給与の相対的な位置を比較します。"
              )}
            </p>
          </div>
          <span className="badge-brand text-[11px] self-start sm:self-auto">
            {txt("Distribusi Upah Resmi", "Official Wage Distribution", "公的賃金統計分布")}
          </span>
        </div>

        {/* 2 Symmetrical Cards (Source vs Target) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Card Left: Kota Asal */}
          <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10 border-t-2 border-t-brand-400 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-brand-300 uppercase tracking-wider block">
                  {txt("Kota Asal (Acuan)", "Origin Reference", "出発地（基準都市）")}
                </span>
                <span className="text-sm font-bold text-white">
                  {sourceCountry === "ID" ? "🇮🇩" : sourceCountry === "JP" ? "🇯🇵" : "🇩🇪"} {sourceCityName}, {sourceCountry}
                </span>
              </div>
              <span className="badge-brand text-[10px] font-mono font-bold">
                Top {sourcePercentile.topPercentage}%
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white">
                  {txt("Persentil ke-", "Percentile ", "第")}{sourcePercentile.percentile}{txt("", "", "パーセンタイル")}
                </div>
                <div className="text-xs text-white/50 font-mono">
                  {sourceCur}{Math.round(equivalenceResult.sourceSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : "en-US")} / {txt("bln gross", "mo gross", "月額面")}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/40 block">
                  {txt("Vs Median Nasional:", "Vs National Median:", "全国中央値比:")}
                </span>
                <span className="text-xs font-mono font-bold text-amber-300">
                  {sourcePercentile.ratioToMedian}x {txt("Median", "Median", "倍")}
                </span>
              </div>
            </div>

            {/* Mini Visual Slider Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="relative pt-2 pb-1">
                {/* Track */}
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 via-emerald-400 to-accent-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, sourcePercentile.percentile))}%` }}
                  />
                </div>
                {/* Marker Pin */}
                <div
                  className="absolute top-1.5 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
                  style={{ left: `${Math.max(4, Math.min(96, sourcePercentile.percentile))}%` }}
                >
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-brand-400 shadow-md shadow-brand-500/50" />
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-white/40 font-mono">
                <span>P10</span>
                <span className="text-white/60">{txt("P50 (Median)", "P50 (Median)", "P50（中央値）")}</span>
                <span>P90</span>
                <span>{txt("P99 (Top 1%)", "P99 (Top 1%)", "P99（上位1%）")}</span>
              </div>
            </div>

            {/* Socio-economic Category Badge */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              <span className="text-white/50">{txt("Status Kelas:", "Economic Bracket:", "階層区分:")}</span>
              <span className="font-semibold text-white/90">
                {sourcePercentile.description[locale as "id" | "en" | "ja"] ?? sourcePercentile.description.id}
              </span>
            </div>
          </div>

          {/* Card Right: Kota Tujuan */}
          <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/10 border-t-2 border-t-accent-400 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-accent-300 uppercase tracking-wider block">
                  {txt("Kota Tujuan (Target)", "Destination Target", "目的地（目標都市）")}
                </span>
                <span className="text-sm font-bold text-white">
                  {targetCountry === "ID" ? "🇮🇩" : targetCountry === "JP" ? "🇯🇵" : "🇩🇪"} {targetCityName}, {targetCountry}
                </span>
              </div>
              <span className="badge-accent text-[10px] font-mono font-bold">
                Top {targetPercentile.topPercentage}%
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-white">
                  {txt("Persentil ke-", "Percentile ", "第")}{targetPercentile.percentile}{txt("", "", "パーセンタイル")}
                </div>
                <div className="text-xs text-white/50 font-mono">
                  {targetCur}{Math.round(equivalenceResult.targetSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : "en-US")} / {txt("bln gross", "mo gross", "月額面")}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/40 block">
                  {txt("Vs Median Nasional:", "Vs National Median:", "全国中央値比:")}
                </span>
                <span className="text-xs font-mono font-bold text-accent-300">
                  {targetPercentile.ratioToMedian}x {txt("Median", "Median", "倍")}
                </span>
              </div>
            </div>

            {/* Mini Visual Slider Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="relative pt-2 pb-1">
                {/* Track */}
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-accent-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, targetPercentile.percentile))}%` }}
                  />
                </div>
                {/* Marker Pin */}
                <div
                  className="absolute top-1.5 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
                  style={{ left: `${Math.max(4, Math.min(96, targetPercentile.percentile))}%` }}
                >
                  <div className="w-3 h-3 rounded-full bg-white border-2 border-accent-400 shadow-md shadow-accent-500/50" />
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-white/40 font-mono">
                <span>P10</span>
                <span className="text-white/60">{txt("P50 (Median)", "P50 (Median)", "P50（中央値）")}</span>
                <span>P90</span>
                <span>{txt("P99 (Top 1%)", "P99 (Top 1%)", "P99（上位1%）")}</span>
              </div>
            </div>

            {/* Socio-economic Category Badge */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
              <span className="text-white/50">{txt("Status Kelas:", "Economic Bracket:", "階層区分:")}</span>
              <span className="font-semibold text-white/90">
                {targetPercentile.description[locale as "id" | "en" | "ja"] ?? targetPercentile.description.id}
              </span>
            </div>
          </div>
        </div>

        {/* Socioeconomic Shift Advisor Note */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-white/80 flex items-start gap-2.5">
          <span className="text-base leading-none mt-0.5">💡</span>
          <div className="space-y-1">
            <span className="font-semibold text-brand-300 block">
              {txt("Analisis Mobilitas Sosio-Ekonomi:", "Socioeconomic Mobility Insight:", "社会経済的モビリティ分析・格差評価:")}
            </span>
            <p className="text-[11px] leading-relaxed text-white/70">
              {txt(
                `Di ${sourceCityName}, gaji acuan Anda menempati posisi Top ${sourcePercentile.topPercentage}% (${sourcePercentile.ratioToMedian}x median). Agar dapat mempertahankan gaya hidup & daya beli yang sama di ${targetCityName}, gaji target yang Anda minta (${targetCur}${Math.round(equivalenceResult.targetSummary.grossMonthlyMajor).toLocaleString()} gross) menempatkan Anda di posisi Top ${targetPercentile.topPercentage}% (${targetPercentile.ratioToMedian}x median nasional ${targetCountry}).`,
                `In ${sourceCityName}, your reference salary ranks at Top ${sourcePercentile.topPercentage}% (${sourcePercentile.ratioToMedian}x median). To maintain the equivalent lifestyle in ${targetCityName}, your required contract salary places you at Top ${targetPercentile.topPercentage}% (${targetPercentile.ratioToMedian}x median in ${targetCountry}).`,
                `${sourceCityName}では、現在の基準給与は上位${sourcePercentile.topPercentage}%（中央値の${sourcePercentile.ratioToMedian}倍）に位置しています。${targetCityName}で同等の生活水準を維持するために必要な契約給与（月額面 ${targetCur}${Math.round(equivalenceResult.targetSummary.grossMonthlyMajor).toLocaleString()}）は、渡航先国の給与分布において上位${targetPercentile.topPercentage}%（中央値の${targetPercentile.ratioToMedian}倍）に相当します。`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── Detailed Comparison Section: Active Deductions & Consumptions ─ */}
      <div className="glass-card p-6 space-y-6 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔬</span>
              <span>
                {txt(
                  "Rincian Deduksi Aktif & Simulasi Pengeluaran Mendalam",
                  "Active Statutory Deductions & Itemized Consumption",
                  "控除明細および生活費内訳の詳細シミュレーション"
                )}
              </span>
            </h2>
            <p className="text-xs text-white/50">
              {txt(
                "Pajak dan potongan jaminan sosial dihitung secara aktif berdasarkan profil keluarga & aturan negara masing-masing.",
                "Taxes and statutory social contributions are calculated interactively based on family structure and national laws.",
                "家族構成や各国の最新法令（所得税・社会保険料等）に基づき天引き額を動的に算出しています。"
              )}
            </p>
          </div>
          <span className="badge-brand text-xs">{txt("Simulasi Interaktif", "Interactive Simulation", "インタラクティブ試算")}</span>
        </div>

        {/* Active Parameter Customizer for Family & Country Tax Options */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
          <h4 className="text-xs font-bold text-brand-300 uppercase tracking-wider">
            {txt("👨‍👩‍👧 Struktur Keluarga & Profil Pajak Aktif", "👨‍👩‍👧 Family Structure & Active Tax Profile", "👨‍👩‍👧 家族構成および税務プロファイル設定")}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-white/60 mb-1">
                {txt("Status Pernikahan", "Marital Status", "配偶者の有無")}
              </label>
              <select
                value={familyStatus}
                onChange={(e) => setFamilyStatus(e.target.value as FamilyStatus)}
                className="form-select text-xs py-1.5"
              >
                <option value="single">{txt("Lajang (Single)", "Single", "独身")}</option>
                <option value="married">{txt("Menikah (Tanpa Anak)", "Married (No Children)", "既婚（子供なし）")}</option>
                <option value="married_children">{txt("Menikah dengan Anak", "Married with Children", "既婚（子供あり）")}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-white/60 mb-1">
                {txt("Jumlah Tanggungan / Anak", "Dependents / Children", "扶養親族・子供の人数")}
              </label>
              <select
                value={numChildren}
                onChange={(e) => setNumChildren(parseInt(e.target.value))}
                className="form-select text-xs py-1.5"
              >
                <option value={0}>{txt("0 Orang", "0", "0人")}</option>
                <option value={1}>{txt("1 Orang", "1", "1人")}</option>
                <option value={2}>{txt("2 Orang", "2", "2人")}</option>
                <option value={3}>{txt("3 Orang atau Lebih", "3 or more", "3人以上")}</option>
              </select>
            </div>

            {/* Germany Specific Controls */}
            {(sourceCountry === "DE" || targetCountry === "DE") && (
              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("🇩🇪 Steuerklasse (Jerman)", "🇩🇪 Tax Class (Germany)", "🇩🇪 税区分（Steuerklasse）")}
                </label>
                <select
                  value={taxClassDE}
                  onChange={(e) => setTaxClassDE(parseInt(e.target.value) as any)}
                  className="form-select text-xs py-1.5"
                >
                  <option value={1}>{txt("Kelas 1 (Lajang)", "Class 1 (Single)", "税区分1（独身・単身）")}</option>
                  <option value={3}>{txt("Kelas 3 (Pencari Nafkah Utama)", "Class 3 (Primary Earner)", "税区分3（主たる稼ぎ手）")}</option>
                  <option value={4}>{txt("Kelas 4 (Gaji Suami-Istri Setara)", "Class 4 (Equal Spouses)", "税区分4（共働き同等）")}</option>
                  <option value={5}>{txt("Kelas 5 (Pencari Nafkah Sekunder)", "Class 5 (Secondary Earner)", "税区分5（従たる稼ぎ手）")}</option>
                </select>
              </div>
            )}

            {/* Japan Specific Controls */}
            {(sourceCountry === "JP" || targetCountry === "JP") && (
              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("🇯🇵 Status Tahun Kerja (Jepang)", "🇯🇵 Resident Year (Japan)", "🇯🇵 在住年数区分（住民税）")}
                </label>
                <select
                  value={isJapanSecondYear ? "year2" : "year1"}
                  onChange={(e) => setIsJapanSecondYear(e.target.value === "year2")}
                  className="form-select text-xs py-1.5"
                >
                  <option value="year1">{txt("Tahun ke-1 (Bebas Pajak Daerah)", "Year 1 (Exempt from Inhabitant Tax)", "1年目（前年所得なし・住民税非課税）")}</option>
                  <option value="year2">{txt("Tahun ke-2+ (Kena Juminzei ~10%)", "Year 2+ (Subject to Juminzei ~10%)", "2年目以降（住民税 約10%課税）")}</option>
                </select>
              </div>
            )}

            {/* Indonesia Specific Controls */}
            {(sourceCountry === "ID" || targetCountry === "ID") && (
              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("🇮🇩 Kategori PTKP PPh 21 (RI)", "🇮🇩 PTKP Tax Bracket (ID)", "🇮🇩 インドネシア基礎控除枠（PTKP）")}
                </label>
                <select
                  value={ptkpStatusID}
                  onChange={(e) => setPtkpStatusID(e.target.value as any)}
                  className="form-select text-xs py-1.5"
                >
                  <option value="TK/0">TK/0 (Rp 54jt / thn)</option>
                  <option value="K/0">K/0 (Rp 58.5jt / thn)</option>
                  <option value="K/1">K/1 (Rp 63jt / thn)</option>
                  <option value="K/2">K/2 (Rp 67.5jt / thn)</option>
                  <option value="K/3">K/3 (Rp 72jt / thn)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── Side-by-Side Detailed Breakdown Table ────────────────────── */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="py-2.5 px-3">{txt("Komponen Rincian", "Itemized Component", "内訳項目")}</th>
                <th className="py-2.5 px-3">{sourceCityName} ({sourceCountry})</th>
                <th className="py-2.5 px-3">{targetCityName} ({targetCountry})</th>
                <th className="py-2.5 px-3">{txt("Keterangan", "Notes & Regulatory Basis", "備考・適用制度")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {/* Gross Income Row */}
              <tr className="bg-white/5 font-bold text-white">
                <td className="py-2.5 px-3 font-sans">
                  {txt("Gaji Kotor Bulanan (Brutto)", "Monthly Gross Salary", "額面月給（Gross）")}
                </td>
                <td className="py-2.5 px-3 text-brand-300">
                  {formatMoney(equivalenceResult.sourceSummary.grossMonthlyMajor, sourceCur)}
                </td>
                <td className="py-2.5 px-3 text-accent-300">
                  {formatMoney(equivalenceResult.targetSummary.grossMonthlyMajor, targetCur)}
                </td>
                <td className="py-2.5 px-3 text-white/50 font-sans text-[11px]">
                  {txt("Kontrak kerja bruto", "Gross contract employment", "契約上の総支給額")}
                </td>
              </tr>

              {/* Deductions Header */}
              <tr className="bg-white/[0.02] text-white/70 font-semibold font-sans">
                <td colSpan={4} className="py-2 px-3 text-[11px] uppercase tracking-wider text-red-400/90">
                  {txt("Potongan Pajak & Asuransi Sosial Wajib (Statutory Deductions)", "Mandatory Tax & Social Security Deductions", "法定控除（税金・公的社会保険料）")}
                </td>
              </tr>

              {/* Itemized Deductions from Active Results */}
              <tr>
                <td className="py-2 px-3 text-white/70 font-sans">
                  {txt("Jaminan Sosial / Pensiun & Kesehatan", "Social Security (Pension, Health, Unemployment)", "公的社会保険料（年金・健康・雇用・介護）")}
                </td>
                <td className="py-2 px-3 text-red-400">
                  - {formatMoney(
                    equivalenceResult.sourceSummary.deductionResult.itemizedDeductions
                      .filter((d) => d.category === "social_security")
                      .reduce((sum, d) => sum + d.amountMajor, 0),
                    sourceCur
                  )}
                </td>
                <td className="py-2 px-3 text-red-400">
                  - {formatMoney(
                    equivalenceResult.targetSummary.deductionResult.itemizedDeductions
                      .filter((d) => d.category === "social_security")
                      .reduce((sum, d) => sum + d.amountMajor, 0),
                    targetCur
                  )}
                </td>
                <td className="py-2 px-3 text-white/50 font-sans text-[11px]">
                  BPJS / Shakai Hoken / Sozialversicherung
                </td>
              </tr>

              <tr>
                <td className="py-2 px-3 text-white/70 font-sans">
                  {txt("Pajak Penghasilan (Income / Resident Tax)", "Income Tax & Resident / Municipal Tax", "所得税・住民税（国税および地方税）")}
                </td>
                <td className="py-2 px-3 text-red-400">
                  - {formatMoney(
                    equivalenceResult.sourceSummary.deductionResult.itemizedDeductions
                      .filter((d) => d.category === "tax")
                      .reduce((sum, d) => sum + d.amountMajor, 0),
                    sourceCur
                  )}
                </td>
                <td className="py-2 px-3 text-red-400">
                  - {formatMoney(
                    equivalenceResult.targetSummary.deductionResult.itemizedDeductions
                      .filter((d) => d.category === "tax")
                      .reduce((sum, d) => sum + d.amountMajor, 0),
                    targetCur
                  )}
                </td>
                <td className="py-2 px-3 text-white/50 font-sans text-[11px]">
                  PPh 21 / Shotokuzei & Juminzei / Lohnsteuer
                </td>
              </tr>

              {/* Total Deductions Summary Row */}
              <tr className="bg-red-500/10 font-bold text-red-300">
                <td className="py-2 px-3 font-sans">
                  {txt("Total Potongan (Total Deductions)", "Total Statutory Deductions", "天引き控除合計額")}
                </td>
                <td className="py-2 px-3">
                  - {formatMoney(equivalenceResult.sourceSummary.totalDeductionsMonthlyMajor, sourceCur)}
                </td>
                <td className="py-2 px-3">
                  - {formatMoney(equivalenceResult.targetSummary.totalDeductionsMonthlyMajor, targetCur)}
                </td>
                <td className="py-2 px-3 text-white/60 font-sans text-[11px]">
                  {txt("Efektif: ", "Effective: ", "実効控除率: ")}{(equivalenceResult.sourceSummary.effectiveDeductionRate * 100).toFixed(1)}% vs {(equivalenceResult.targetSummary.effectiveDeductionRate * 100).toFixed(1)}%
                </td>
              </tr>

              {/* Net Income Row */}
              <tr className="bg-emerald-500/10 font-bold text-emerald-300">
                <td className="py-2.5 px-3 font-sans">
                  {txt("Gaji Bersih Bulanan (Take Home Pay)", "Monthly Net Take-Home Pay", "手取り月給（Take Home Pay）")}
                </td>
                <td className="py-2.5 px-3">
                  {formatMoney(equivalenceResult.sourceSummary.netMonthlyMajor, sourceCur)}
                </td>
                <td className="py-2.5 px-3">
                  {formatMoney(equivalenceResult.targetSummary.netMonthlyMajor, targetCur)}
                </td>
                <td className="py-2.5 px-3 text-white/60 font-sans text-[11px]">
                  {txt("Uang masuk rekening", "Net deposited into bank account", "銀行口座への実手取り振込額")}
                </td>
              </tr>

              {/* Consumption Items Header */}
              <tr className="bg-white/[0.02] text-white/70 font-semibold font-sans">
                <td colSpan={4} className="py-2 px-3 text-[11px] uppercase tracking-wider text-amber-400/90">
                  {txt("Biaya Konsumsi & Kebutuhan Hidup Bulanan", "Monthly Living Expenses & Basic Consumption", "月々の生活費・消費支出")}
                </td>
              </tr>

              <tr>
                <td className="py-2 px-3 text-white/70 font-sans">
                  {txt("Sewa Tempat Tinggal (Rent)", "Housing Rent", "住居費（家賃相場）")}
                </td>
                <td className="py-2 px-3 text-white/80">
                  - {formatMoney(equivalenceResult.sourceSummary.rentMonthlyMajor, sourceCur)}
                </td>
                <td className="py-2 px-3 text-white/80">
                  - {formatMoney(equivalenceResult.targetSummary.rentMonthlyMajor, targetCur)}
                </td>
                <td className="py-2 px-3 text-white/50 font-sans text-[11px]">
                  Kost AC / Asrama 1K / WG-Zimmer
                </td>
              </tr>

              <tr>
                <td className="py-2 px-3 text-white/70 font-sans">
                  {txt("Belanja Makanan & Kuliner", "Food & Grocery Expenses", "食費・外食費")} ({equivalenceResult.sourceFoodItem.itemName})
                </td>
                <td className="py-2 px-3 text-white/80">
                  - {formatMoney(equivalenceResult.sourceSummary.foodMonthlyMajor, sourceCur)}
                </td>
                <td className="py-2 px-3 text-white/80">
                  - {formatMoney(equivalenceResult.targetSummary.foodMonthlyMajor, targetCur)}
                </td>
                <td className="py-2 px-3 text-white/50 font-sans text-[11px]">
                  {txt("Asumsi ~40 porsi kuliner & belanja bahan masak", "Assumes ~40 local meals + grocery cooking", "自炊食材＋外食（約40食分相当）を想定")}
                </td>
              </tr>

              <tr>
                <td className="py-2 px-3 text-white/70 font-sans">
                  {txt("Utilitas (Listrik, Air/Gas, Internet & HP)", "Utilities (Electricity, Water/Gas, Mobile & Fiber)", "水道光熱費・通信費（電気・ガス・水道・ネット・スマホ）")}
                </td>
                <td className="py-2 px-3 text-white/80">
                  - {formatMoney(equivalenceResult.sourceSummary.utilitiesMonthlyMajor, sourceCur)}
                </td>
                <td className="py-2 px-3 text-white/80">
                  - {formatMoney(equivalenceResult.targetSummary.utilitiesMonthlyMajor, targetCur)}
                </td>
                <td className="py-2 px-3 text-white/50 font-sans text-[11px]">
                  {txt("Paket fiber + SIM card + listrik/gas", "Home fiber + mobile SIM + energy", "光回線＋スマホSIM＋電気ガス水道")}
                </td>
              </tr>

              <tr>
                <td className="py-2 px-3 text-white/70 font-sans">
                  {txt("Transportasi Publik Lokal", "Local Public Transit", "地域公共交通費")}
                </td>
                <td className="py-2 px-3 text-white/80">
                  - {formatMoney(equivalenceResult.sourceSummary.transportMonthlyMajor, sourceCur)}
                </td>
                <td className="py-2 px-3 text-white/80">
                  - {formatMoney(equivalenceResult.targetSummary.transportMonthlyMajor, targetCur)}
                </td>
                <td className="py-2 px-3 text-white/50 font-sans text-[11px]">
                  TransJakarta / Tsukin Pass / Deutschlandticket €49
                </td>
              </tr>

              {/* Total Consumption Summary Row */}
              <tr className="bg-amber-500/10 font-bold text-amber-300">
                <td className="py-2 px-3 font-sans">
                  {txt("Total Pengeluaran Rutin (Total Living Cost)", "Total Routine Living Cost", "基本生活費合計")}
                </td>
                <td className="py-2 px-3">
                  - {formatMoney(equivalenceResult.sourceSummary.totalConsumptionMonthlyMajor, sourceCur)}
                </td>
                <td className="py-2 px-3">
                  - {formatMoney(equivalenceResult.targetSummary.totalConsumptionMonthlyMajor, targetCur)}
                </td>
                <td className="py-2 px-3 text-white/60 font-sans text-[11px]">
                  {txt("Beban hidup bulanan", "Monthly baseline living expenses", "月次の固定・変動基礎生活支出")}
                </td>
              </tr>

              {/* Discretionary & Savings Row */}
              <tr className="bg-emerald-500/15 font-bold text-emerald-300 text-sm">
                <td className="py-3 px-3 font-sans">
                  {txt("Sisa Uang Belanja & Tabungan (Savings)", "Discretionary Spending & Net Savings", "自由裁量余剰金・貯金可能額")}
                </td>
                <td className="py-3 px-3">
                  + {formatMoney(equivalenceResult.sourceSummary.discretionarySavingsMonthlyMajor, sourceCur)}
                </td>
                <td className="py-3 px-3">
                  + {formatMoney(equivalenceResult.targetSummary.discretionarySavingsMonthlyMajor, targetCur)}
                </td>
                <td className="py-3 px-3 text-emerald-200 font-sans text-[11px]">
                  {txt("Daya beli sisa uang terjaga seimbang!", "Real surplus purchasing power fully preserved!", "余剰金の実質的な購買力が完全に維持されています！")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Index Advisory & Consultant Explanation Box ─────────────── */}
      <div className="rounded-xl p-5 bg-white/5 border border-white/10 space-y-4 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-brand-300 font-semibold text-sm">
          <span>💡</span>
          <span>
            {txt(
              "Konsultasi Indeks: Pilihan Indeks Daya Beli yang Tepat untuk Anda",
              "Index Consultation: Choosing the Right Purchasing Power Benchmark",
              "指数解説：あなたに最適な購買力平価基準の選び方"
            )}
          </span>
        </div>

        <p className="text-white/80">
          {equivalenceResult.explanation[locale as "id" | "en" | "ja"] ?? equivalenceResult.explanation.id}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-white/70">
          <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>🥙</span>
              <span>Street Food Index</span>
            </div>
            <p className="text-[11px] text-white/60">
              {txt(
                "Paling realistis untuk pekerja pemula dan mahasiswa perantau. Mengukur harga makanan cepat saji lokal yang menjadi santapan harian (Döner Kebab di Jerman, Gyudon/Udon di Jepang, Mie Ayam di Indonesia).",
                "Most realistic for entry-level workers and students. Benchmarks common daily street meals (Döner Kebab in Germany, Gyudon/Udon in Japan, Mie Ayam in Indonesia).",
                "新社会人や留学生に最も現実的な指標。日常的なローカルファストフード（ドイツのドネルケバブ、日本の牛丼・うどん、インドネシアのミーアヤム）を基準にします。"
              )}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>🍔</span>
              <span>Big Mac Index</span>
            </div>
            <p className="text-[11px] text-white/60">
              {txt(
                "Metrik standar internasional ciptaan The Economist sejak 1986. Standar komposisi burger McDonald's identik di seluruh dunia, mencerminkan gabungan biaya sewa komersial lokal, bahan baku, dan upah tenaga kerja.",
                "The Economist's renowned international benchmark since 1986. Standardized McDonald's burgers reflect local commercial rents, commodity prices, and service wages.",
                "1986年より英エコノミスト誌が発表している国際比較基準。世界同一品質のマクドナルド商品を通じ、現地の商業賃料・原材料費・人件費を包括的に反映します。"
              )}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>☕</span>
              <span>Coffee / Cafe Index</span>
            </div>
            <p className="text-[11px] text-white/60">
              {txt(
                "Indikator gaya hidup urban pekerja modern & tech professionals. Mengukur biaya secangkir cappuccino / specialty coffee di kedai kopi kota metropolitan sebagai representasi pengeluaran rekreasi sosial harian.",
                "Urban lifestyle metric for modern professionals. Measures specialty coffee costs in metropolitan cafes, reflecting daily social and recreational expenditure.",
                "都市部のオフィスワーカーやIT専門職向けライフスタイル指標。主要都市カフェのカプチーノ価格をもとに、日々の社交・余暇活動費用の購買力を測定します。"
              )}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <span>🛒</span>
              <span>CPI Consumer Basket</span>
            </div>
            <p className="text-[11px] text-white/60">
              {txt(
                "Paritas keranjang konsumsi statistik resmi (BPS Indonesia, Destatis Jerman, e-Stat Jepang) mencakup bahan pokok supermarket, biaya kebersihan, transportasi, dan telekomunikasi.",
                "Official statistical consumption basket parity (Destatis, e-Stat, BPS) covering supermarket staples, household items, transit, and connectivity.",
                "各国の公的統計（独Destatis、日e-Stat、尼BPS）による総合消費者物価バスケット。食料品・日用品・交通・通信費を包括します。"
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-3 border-t border-white/10 text-[11px] text-white/40">
          <span>
            {txt(
              "🏛️ Sumber Pajak: Destatis § 32a EStG (DE) · NTA & MHLW (JP) · PP 58/2023 & BPJS (ID)",
              "🏛️ Statutory Sources: Destatis § 32a EStG (DE) · NTA & MHLW (JP) · PP 58/2023 & BPJS (ID)",
              "🏛️ 法定根拠：独所得税法§32a (DE) · 国税庁・厚労省 (JP) · PP 58/2023・BPJS (ID)"
            )}
          </span>
          <span>
            {txt(
              "📊 Kurs Konversi: Real-time ECB via Wise / Central Banks",
              "📊 Exchange Rates: Real-time ECB via Wise / Central Banks",
              "📊 為替レート：欧州中央銀行（ECB）/ 各国中央銀行リアルタイム公示相場"
            )}
          </span>
        </div>
      </div>
    </div>
    </div>
  );
}
