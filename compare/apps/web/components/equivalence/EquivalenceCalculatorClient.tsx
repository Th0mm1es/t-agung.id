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
import { convertCurrency, formatConverted } from "@/lib/exchangeRate";

const REMITTANCE_MARGIN_RATE = 0.015; // 1.5%
const REMITTANCE_FLAT_FEE_EUR = 1.50; // €1.50
const REMITTANCE_FLAT_FEE_JPY = 250;  // ¥250
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { ShareResultCardModal } from "@/components/common/ShareResultCardModal";
import { SubscribeOptIn } from "@/components/common/SubscribeOptIn";
import DE_INLINE from "@/locales/de_inlines.json";

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

  // Detailed breakdown tab state
  const [activeDetailTab, setActiveDetailTab] = useState<"ringkasan" | "pajak" | "asuransi" | "konsumsi">("ringkasan");

  // Save Scenario & WhatsApp feedback
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");

  // Custom Price Overrides
  const [customSourcePrice, setCustomSourcePrice] = useState<string>("");
  const [customTargetPrice, setCustomTargetPrice] = useState<string>("");
  const [customSourceRent, setCustomSourceRent] = useState<string>("");
  const [customTargetRent, setCustomTargetRent] = useState<string>("");
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

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

  const txt = (idStr: string, enStr: string, deOrJaStr: string, jaStr?: string) => {
    if (jaStr !== undefined) {
      if (locale === "ja") return jaStr;
      if (locale === "de") return deOrJaStr;
      if (locale === "en") return enStr;
      return idStr;
    }
    if (locale === "ja") return deOrJaStr;
    if (locale === "de") return (DE_INLINE as Record<string, string>)[idStr] ?? (console.warn("[i18n] missing de inline:", idStr), enStr);
    if (locale === "en") return enStr;
    return idStr;
  };

  const formatMoney = (val: number, cur: string) => {
    const loc = locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : locale === "de" ? "de-DE" : "en-US";
    return `${cur}${Math.round(val).toLocaleString(loc)}`;
  };

  // Remittance arriving in IDR for Target Country
  const remitTargetMajor = Math.max(
    100,
    Math.round(
      equivalenceResult.targetSummary.discretionarySavingsMonthlyMajor > 0
        ? equivalenceResult.targetSummary.discretionarySavingsMonthlyMajor
        : equivalenceResult.targetSummary.netMonthlyMajor * 0.25
    )
  );
  const remitFee =
    remitTargetMajor * REMITTANCE_MARGIN_RATE +
    (targetCountry === "DE" ? REMITTANCE_FLAT_FEE_EUR : targetCountry === "JP" ? REMITTANCE_FLAT_FEE_JPY : 0);
  const remitNetArriving = Math.max(0, remitTargetMajor - remitFee);
  const remitIdrText = useMemo(() => {
    if (!exchangeRates || targetCountry === "ID") return "Rp 0";
    const minor = BigInt(Math.round(remitNetArriving * (targetCountry === "DE" ? 100 : 1)));
    const conv = convertCurrency(minor, targetCountry === "DE" ? "EUR" : "JPY", "IDR", exchangeRates);
    return formatConverted(conv, "IDR", locale === "id" ? "id-ID" : "en-US");
  }, [remitNetArriving, targetCountry, exchangeRates, locale]);

  const handleSaveScenario = () => {
    try {
      const currentRaw = localStorage.getItem("bandinghidup_saved_scenarios");
      const currentList = currentRaw ? JSON.parse(currentRaw) : [];
      const newScenario = {
        id: `equiv_${sourceCityName}_${targetCityName}_${Date.now()}`,
        savedAt: new Date().toISOString(),
        title: `${sourceCityName} → ${targetCityName} (${targetCur}${Math.round(equivalenceResult.targetSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : "en-US")})`,
        sourceCity: sourceCityName,
        sourceCountry,
        targetCity: targetCityName,
        targetCountry,
        pathway: "equivalence",
        monthlySavingsTargetMajor: equivalenceResult.targetSummary.discretionarySavingsMonthlyMajor,
        targetGrossMajor: equivalenceResult.targetSummary.grossMonthlyMajor,
        targetNetMajor: equivalenceResult.targetSummary.netMonthlyMajor,
        currencyTarget: targetCur.trim(),
      };
      const updated = [newScenario, ...currentList.filter((s: any) => s.id !== newScenario.id)].slice(0, 5);
      localStorage.setItem("bandinghidup_saved_scenarios", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("bandinghidup:scenario-saved"));
      setSaveSuccessMsg(txt("Tersimpan!", "Saved!", "Gespeichert!", "保存完了!"));
      setTimeout(() => setSaveSuccessMsg(""), 2500);
    } catch {}
  };

  const handleShareWhatsApp = () => {
    const textMsg = encodeURIComponent(
      `📊 Simulasi Gaji Setara di BandingHidup:\n` +
      `Gaji di ${sourceCityName}: ${sourceCur}${Math.round(equivalenceResult.sourceSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : "en-US")}\n` +
      `Target Gaji di ${targetCityName}: ${targetCur}${Math.round(equivalenceResult.targetSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : "en-US")} gross\n` +
      `Gaji Bersih Target: ${targetCur}${Math.round(equivalenceResult.targetSummary.netMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : "en-US")}\n` +
      `Sisa Tabungan Target: +${targetCur}${Math.round(equivalenceResult.targetSummary.discretionarySavingsMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : "en-US")}\n\n` +
      `Hitung skenario lengkap di https://compare.t-agung.id/gaji-setara`
    );
    window.open(`https://wa.me/?text=${textMsg}`, "_blank");
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in">
      {/* ── Title & Introduction ────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="badge-brand text-xs">
            {txt("🌐 Gaya Hidup & Gaji Setara", "🌐 Lifestyle & Salary Equivalence", "🌐 生活水準・必要給与シミュレーター")}
          </span>
          <span className="text-xs text-fg-soft font-mono">Stage 4 Active Parity Engine</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-display font-bold text-[var(--text)]">
          {txt(
            "Berapa Gaji Setaraku di Luar Negeri?",
            "What Is My Equivalent Salary Abroad?",
            "海外で同等の生活水準を保つための必要給与シミュレーター"
          )}
        </h1>
        <p className="text-sm text-fg-60 max-w-3xl leading-relaxed">
          {txt(
            "Hitung secara realistis berapa gaji kotor (gross) yang harus Anda dapatkan di negara tujuan agar standar hidup Anda tidak turun. Dilengkapi simulasi potongan pajak & asuransi aktif sesuai struktur keluarga, sewa tempat tinggal, serta berbagai pilihan logika daya beli riil.",
            "Calculate the exact gross salary you need abroad to preserve your domestic lifestyle, factoring in interactive statutory tax/social deductions, family dependents, local rent, and real purchasing power parities.",
            "生活水準を落とさずに海外移住・転職するために必要な額面年収・月給を精密に逆算。家族構成に応じた税金・社会保険料の天引きシミュレーション、都市別家賃相場、購買力平価（PPP）指数を統合。"
          )}
        </p>
      </div>

      {/* ── ATAS (SECTION 1): INPUT CONTROLS (Kota Asal & Kota Tujuan) ── */}
      <div className="glass-card p-6 space-y-6 border border-line">
        <div className="border-b border-line pb-3">
          <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
            <span>⚙️</span>
            <span>{txt("1. Parameter Simulasi & Lokasi", "1. Simulation Parameters & Locations", "1. シミュレーション条件・都市設定")}</span>
          </h2>
          <p className="text-xs text-fg-muted mt-0.5">
            {txt(
              "Tentukan kota asal, kota tujuan, struktur rumah tangga, dan acuan gaya hidup untuk menghitung kesetaraan daya beli.",
              "Specify origin, destination, household structure, and lifestyle benchmark to calculate real parity.",
              "出発地、目的地、世帯構成、および基準とする物価指標を選択してください。"
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Location & Salary */}
          <div className="space-y-4 p-4 rounded-xl bg-panel-2 border border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center justify-between">
              <span>{txt("📍 Kondisi Anda Saat Ini (Kota Asal)", "📍 Current Status (Origin City)", "📍 現在の状況（出発地・現職）")}</span>
              <span className="badge-brand text-[10px]">{txt("Baseline Acuan", "Baseline Reference", "基準ベースライン")}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-fg-60 mb-1">
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
                <label className="block text-[11px] text-fg-60 mb-1">
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
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-fg-muted">
                  <span>{txt("Sewa:", "Rent:", "家賃:")}</span>
                  <span className={`font-mono font-semibold ${
                    sourceRentMult > 1.0 ? "text-amber-300" : sourceRentMult < 1.0 ? "text-emerald-300" : "text-fg-70"
                  }`}>
                    {sourceRentMult > 1.0 ? `+${Math.round((sourceRentMult - 1) * 100)}%` : sourceRentMult < 1.0 ? `${Math.round((sourceRentMult - 1) * 100)}%` : txt("Acuan", "Baseline", "基準")}
                  </span>
                  <span>•</span>
                  <span>{txt("Makan:", "Food:", "食費:")}</span>
                  <span className={`font-mono font-semibold ${
                    sourceFoodMult > 1.0 ? "text-amber-300" : sourceFoodMult < 1.0 ? "text-emerald-300" : "text-fg-70"
                  }`}>
                    {sourceFoodMult > 1.0 ? `+${Math.round((sourceFoodMult - 1) * 100)}%` : sourceFoodMult < 1.0 ? `${Math.round((sourceFoodMult - 1) * 100)}%` : txt("Acuan", "Baseline", "基準")}
                  </span>
                </div>
              </div>
            </div>

            {/* Salary Input with Monthly / Yearly Dropdown Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-fg-70 font-medium">
                  {txt("Gaji Kotor / Gross Saat Ini:", "Current Gross Salary:", "現在の額面給与（Gross）:")}
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-fg-muted">{txt("Periode:", "Period:", "期間:")}</span>
                  <select
                    value={periodicity}
                    onChange={(e) => handlePeriodicityChange(e.target.value as IncomePeriodicity)}
                    className="form-select text-[11px] py-0.5 px-2 bg-panel-2 rounded-md border-line-strong text-[var(--accent)] font-semibold"
                  >
                    <option value="monthly">{txt("Per Bulan (Monthly)", "Monthly", "月給（月額）")}</option>
                    <option value="yearly">{txt("Per Tahun (Yearly)", "Annual / Yearly", "年収（年額）")}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-bold text-fg-70">{sourceCur}</span>
                <input
                  type="number"
                  value={sourceGrossInput}
                  onChange={(e) => setSourceGrossInput(e.target.value)}
                  className="form-select text-sm font-mono font-bold py-2"
                  placeholder="10000000"
                />
              </div>

              <div className="flex justify-between text-[10px] text-fg-soft mt-1 font-mono">
                <span>
                  {periodicity === "yearly"
                    ? `~${formatMoney(Number(sourceGrossInput) / 12, sourceCur)}/${txt("bulan", "mo", "月")}`
                    : `~${formatMoney(Number(sourceGrossInput) * 12, sourceCur)}/${txt("tahun", "yr", "年")}`}
                </span>
                <span>{txt("Statistik Resmi", "Official Data", "公的統計データ")}</span>
              </div>
            </div>

            {/* P0-2: 4-Option Family Selector in Kota Asal */}
            <div className="pt-2 border-t border-line space-y-2">
              <label className="block text-[11px] text-fg-60 font-medium">
                {txt("👨‍👩‍👧 Komposisi Keluarga & Tanggungan:", "👨‍👩‍👧 Household & Dependents:", "👨‍👩‍👧 家族構成・扶養人数:")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "single", labelId: "Lajang", labelEn: "Single", labelJa: "独身", status: "single", children: 0 },
                  { key: "married_0", labelId: "Menikah (0 Anak)", labelEn: "Married (0 Kids)", labelJa: "既婚 (子なし)", status: "married", children: 0 },
                  { key: "married_1", labelId: "Keluarga 1 Anak", labelEn: "Family (1 Child)", labelJa: "子1人世帯", status: "married_children", children: 1 },
                  { key: "married_2", labelId: "Keluarga 2 Anak", labelEn: "Family (2 Children)", labelJa: "子2人世帯", status: "married_children", children: 2 },
                ].map((f) => {
                  const isSelected = familyStatus === f.status && numChildren === f.children;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setFamilyStatus(f.status as FamilyStatus);
                        setNumChildren(f.children);
                        if (f.status === "single") {
                          setTaxClassDE(1);
                          setPtkpStatusID("TK/0");
                        } else if (f.status === "married") {
                          setTaxClassDE(3);
                          setPtkpStatusID("K/0");
                        } else if (f.children === 1) {
                          setTaxClassDE(3);
                          setPtkpStatusID("K/1");
                        } else {
                          setTaxClassDE(3);
                          setPtkpStatusID("K/2");
                        }
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        isSelected
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-sm font-bold"
                          : "bg-panel text-fg-70 hover:bg-panel-2 border-line"
                      }`}
                    >
                      {txt(f.labelId, f.labelEn, f.labelJa)}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Age-Limit Note */}
              <div className="text-[10px] text-fg-muted bg-panel p-2 rounded-lg border border-line flex items-start gap-1.5 mt-2">
                <span className="text-accent-400">ℹ️</span>
                <span>
                  {targetCountry === "DE" || sourceCountry === "DE"
                    ? txt(
                        "🇩🇪 Jerman: Tunjangan anak (Kindergeld €255/bln/anak) berlaku s.d. 18 th (atau 25 th jika kuliah/Ausbildung).",
                        "🇩🇪 Germany: Child benefit (Kindergeld €255/mo/child) applies up to 18 (or 25 if studying/Ausbildung).",
                        "🇩🇪 ドイツ: 児童手当（Kindergeld €255/月/子）は18歳まで（就学・職業訓練中は最長25歳まで）支給。"
                      )
                    : targetCountry === "JP" || sourceCountry === "JP"
                    ? txt(
                        "🇯🇵 Jepang: Tunjangan anak (Jido Teate ¥15.000/bln) berlaku hingga anak menyelesaikan SMA (<18 th).",
                        "🇯🇵 Japan: Child allowance (Jido Teate ¥15,000/mo) applies through high school graduation (<18 yrs).",
                        "🇯🇵 日本: 児童手当（月額15,000円）は高校生年代（18歳の年度末）まで支給。"
                      )
                    : txt(
                        "🇮🇩 Indonesia: Pengurang PTKP tanggungan anak (Rp 4.5jt/thn/anak, maks 3) berlaku untuk anak belum berpenghasilan.",
                        "🇮🇩 Indonesia: PTKP child relief (Rp 4.5m/yr/child, max 3) applies for non-earning dependents.",
                        "🇮🇩 インドネシア: 扶養控除（PTKP子供1人あたり年間450万ルピア、最大3人）が適用されます。"
                      )}
                </span>
              </div>
            </div>
          </div>

          {/* Target Location */}
          <div className="space-y-4 p-4 rounded-xl bg-panel-2 border border-line">
            <h3 className="text-xs font-bold uppercase tracking-wider text-accent-400 flex items-center justify-between">
              <span>{txt("🎯 Kota Tujuan yang Dituju", "🎯 Target Destination", "🎯 移住・転職先の都市（目的地）")}</span>
              <span className="badge-accent text-[10px]">{txt("Tujuan Relokasi", "Relocation Target", "移住目的地")}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-fg-60 mb-1">
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
                <label className="block text-[11px] text-fg-60 mb-1">
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
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-fg-muted">
                  <span>{txt("Sewa:", "Rent:", "家賃:")}</span>
                  <span className={`font-mono font-semibold ${
                    targetRentMult > 1.0 ? "text-amber-300" : targetRentMult < 1.0 ? "text-emerald-300" : "text-fg-70"
                  }`}>
                    {targetRentMult > 1.0 ? `+${Math.round((targetRentMult - 1) * 100)}%` : targetRentMult < 1.0 ? `${Math.round((targetRentMult - 1) * 100)}%` : txt("Acuan", "Baseline", "基準")}
                  </span>
                  <span>•</span>
                  <span>{txt("Makan:", "Food:", "食費:")}</span>
                  <span className={`font-mono font-semibold ${
                    targetFoodMult > 1.0 ? "text-amber-300" : targetFoodMult < 1.0 ? "text-emerald-300" : "text-fg-70"
                  }`}>
                    {targetFoodMult > 1.0 ? `+${Math.round((targetFoodMult - 1) * 100)}%` : targetFoodMult < 1.0 ? `${Math.round((targetFoodMult - 1) * 100)}%` : txt("Acuan", "Baseline", "基準")}
                  </span>
                </div>
              </div>
            </div>

            {/* Parity Index Mode Selector */}
            <div>
              <label className="block text-[11px] text-fg-60 mb-1">
                {txt("Pilihan Indeks Daya Beli Riil:", "Real Purchasing Power Benchmark:", "実質購買力平価（PPP）指数の選択:")}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIndexType("street_food")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium transition-all text-left flex items-center gap-2 ${
                    indexType === "street_food"
                      ? "bg-[var(--accent)] text-white font-bold border border-[var(--accent)]/40 shadow-sm"
                      : "bg-panel-2 text-fg-70 hover:bg-panel-2 border border-line"
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
                      ? "bg-[var(--accent)] text-white font-bold border border-[var(--accent)]/40 shadow-sm"
                      : "bg-panel-2 text-fg-70 hover:bg-panel-2 border border-line"
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
                      ? "bg-[var(--accent)] text-white font-bold border border-[var(--accent)]/40 shadow-sm"
                      : "bg-panel-2 text-fg-70 hover:bg-panel-2 border border-line"
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
                      ? "bg-[var(--accent)] text-white font-bold border border-[var(--accent)]/40 shadow-sm"
                      : "bg-panel-2 text-fg-70 hover:bg-panel-2 border border-line"
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
        <div className="pt-4 border-t border-line space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs text-fg-80 font-semibold flex items-center gap-1.5">
              <span>🏠</span>
              <span>
                {txt("Tipe & Ukuran Tempat Tinggal (Acuan Biaya Sewa):", "Housing Type & Reference Apartment Size:", "住居タイプ・広さ（家賃基準）:")}
              </span>
            </span>
            <span className="text-[11px] text-[var(--accent)] font-mono">
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
                  ? "bg-[var(--accent-soft)] border-[var(--accent)]/60 text-[var(--text)] ring-1 ring-[var(--accent-soft)]"
                  : "bg-panel-2 border-line text-fg-60 hover:bg-panel-2"
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
                  ? "bg-[var(--accent-soft)] border-[var(--accent)]/60 text-[var(--text)] ring-1 ring-[var(--accent-soft)]"
                  : "bg-panel-2 border-line text-fg-60 hover:bg-panel-2"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-0.5">
                <span>{txt("🏠 Studio / 1K / Kos AC", "🏠 Studio / 1K / Private", "🏠 ワンルーム / 1K")}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-[var(--accent)]/40 text-[var(--accent)]">
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
                  ? "bg-[var(--accent-soft)] border-[var(--accent)]/60 text-[var(--text)] ring-1 ring-[var(--accent-soft)]"
                  : "bg-panel-2 border-line text-fg-60 hover:bg-panel-2"
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
        <div className="pt-4 border-t border-line space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs text-fg-80 font-semibold flex items-center gap-1.5">
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
                  ? "bg-[var(--accent-soft)] border-[var(--accent)]/60 text-[var(--text)] shadow-sm ring-1 ring-[var(--accent-soft)]"
                  : "bg-panel-2 border-line text-fg-60 hover:bg-panel-2"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>{txt("🪙 Sisa Uang & Tabungan Setara", "🪙 Same Savings & Discretionary", "🪙 自由裁量・実質貯金額の一致")}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/40 text-[var(--accent)]">
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
                  ? "bg-[var(--accent-soft)] border-[var(--accent)]/60 text-[var(--text)] shadow-sm ring-1 ring-[var(--accent-soft)]"
                  : "bg-panel-2 border-line text-fg-60 hover:bg-panel-2"
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
                  ? "bg-[var(--accent-soft)] border-[var(--accent)]/60 text-[var(--text)] shadow-sm ring-1 ring-[var(--accent-soft)]"
                  : "bg-panel-2 border-line text-fg-60 hover:bg-panel-2"
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
        <details className="group rounded-xl border border-line bg-panel p-3 text-xs">
          <summary className="cursor-pointer font-semibold text-fg-70 hover:text-[var(--text)] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>⚙️</span>
              <span>{txt("Sesuaikan Harga Acuan & Sewa Hunian Kustom (Opsional)", "Customize Price & Rent Benchmarks (Optional)", "物価基準・家賃の手動微調整（任意）")}</span>
            </span>
            <span className="text-accent-400 text-sm group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="pt-3 border-t border-line mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-fg-muted mb-1">
                {equivalenceResult.sourceFoodItem.emoji} {equivalenceResult.sourceFoodItem.itemName} ({sourceCityName})
              </label>
              <input
                type="number"
                placeholder={String(defaultSourceFoodPrice)}
                value={customSourcePrice}
                onChange={(e) => setCustomSourcePrice(e.target.value)}
                className="form-select text-xs py-1.5 font-mono"
              />
              <span className="text-[10px] text-fg-soft block mt-0.5">
                {txt("Rekomendasi", "Recommended", "推奨値")}: {formatMoney(defaultSourceFoodPrice, sourceCur)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-fg-muted mb-1">
                {equivalenceResult.targetFoodItem.emoji} {equivalenceResult.targetFoodItem.itemName} ({targetCityName})
              </label>
              <input
                type="number"
                placeholder={String(defaultTargetFoodPrice)}
                value={customTargetPrice}
                onChange={(e) => setCustomTargetPrice(e.target.value)}
                className="form-select text-xs py-1.5 font-mono"
              />
              <span className="text-[10px] text-fg-soft block mt-0.5">
                {txt("Rekomendasi", "Recommended", "推奨値")}: {formatMoney(defaultTargetFoodPrice, targetCur)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-fg-muted mb-1 truncate">
                🏠 {txt("Sewa", "Rent", "家賃")} {sourceHousingBenchmark.label} ({sourceCityName})
              </label>
              <input
                type="number"
                placeholder={String(defaultSourceRent)}
                value={customSourceRent}
                onChange={(e) => setCustomSourceRent(e.target.value)}
                className="form-select text-xs py-1.5 font-mono"
              />
              <span className="text-[10px] text-fg-soft block mt-0.5">
                {txt("Rekomendasi:", "Recommended:", "推奨家賃:")} {formatMoney(defaultSourceRent, sourceCur)}
              </span>
            </div>

            <div>
              <label className="block text-[11px] text-fg-muted mb-1 truncate">
                🏠 {txt("Sewa", "Rent", "家賃")} {targetHousingBenchmark.label} ({targetCityName})
              </label>
              <input
                type="number"
                placeholder={String(defaultTargetRent)}
                value={customTargetRent}
                onChange={(e) => setCustomTargetRent(e.target.value)}
                className="form-select text-xs py-1.5 font-mono"
              />
              <span className="text-[10px] text-fg-soft block mt-0.5">
                {txt("Rekomendasi:", "Recommended:", "推奨家賃:")} {formatMoney(defaultTargetRent, targetCur)}
              </span>
            </div>
          </div>
        </details>
      </div>

      {/* ── KEDUA (SECTION 2): RESULT BLOCK (Sticky on scroll) ─────── */}
      <div className="space-y-6 lg:sticky lg:top-16 z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Target Required Salary Card */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-accent-400 bg-gradient-to-br from-accent-500/10 to-transparent shadow-xl">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  {txt(
                    "Gaji Kotor Target yang Harus Diminta",
                    "Required Gross Contract Salary",
                    "Ziel-Bruttogehalt im Vertrag",
                    "契約交渉で提示すべき必要額面給与"
                  )}
                </span>
                <span className="badge-accent text-[10px] font-bold">
                  {txt("Target Setara", "Equivalence Target", "Zieläquivalent", "目標水準")}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-teal-700 dark:text-teal-300">
                  {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.targetSummary.grossYearlyMajor, targetCur)
                    : formatMoney(equivalenceResult.targetSummary.grossMonthlyMajor, targetCur)}
                </h3>
                <span className="text-xs text-fg-60 font-medium">
                  / {periodicity === "yearly" ? txt("thn gross", "yr gross", "J. brutto", "年額面") : txt("bln gross", "mo gross", "M. brutto", "月額面")}
                </span>
              </div>
              <p className="text-xs text-fg-muted font-mono">{targetCityName}, {targetCountry}</p>
            </div>

            <hr className="divider" />

            {/* Symmetrical 4 Core Items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center bg-panel-2 p-2.5 rounded-lg border border-accent-400/20">
                <span className="text-fg-80 font-medium">
                  {txt("1. Gaji Bersih (Take Home Pay):", "1. Net Take-Home Pay:", "1. 手取り月給:")}
                </span>
                <span className="font-mono font-bold text-accent-300 text-sm">
                  {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.targetSummary.netYearlyMajor, targetCur)
                    : formatMoney(equivalenceResult.targetSummary.netMonthlyMajor, targetCur)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-fg-60">
                  {txt("2. Total Deduksi (Pajak & Asuransi):", "2. Total Deductions (Tax & Social):", "2. 天引き総額:")}
                </span>
                <span className="font-mono text-red-400 font-semibold">
                  - {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.targetSummary.totalDeductionsYearlyMajor, targetCur)
                    : formatMoney(equivalenceResult.targetSummary.totalDeductionsMonthlyMajor, targetCur)}
                  <span className="text-[10px] text-fg-soft ml-1 font-mono">
                    ({(equivalenceResult.targetSummary.effectiveDeductionRate * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-fg-60">
                  {txt("3. Total Konsumsi (Sewa + Rutin):", "3. Total Living (Rent + Utilities):", "3. 生活費総額:")}
                </span>
                <span className="font-mono text-fg-80">
                  - {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.targetSummary.totalConsumptionYearlyMajor, targetCur)
                    : formatMoney(equivalenceResult.targetSummary.totalConsumptionMonthlyMajor, targetCur)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-line font-bold">
                <span className="text-fg-80">
                  {txt("4. Sisa Belanja & Tabungan:", "4. Discretionary & Savings:", "4. 自由裁量余剰金・貯蓄:")}
                </span>
                <span className="font-mono text-emerald-400 text-sm">
                  + {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.targetSummary.discretionarySavingsYearlyMajor, targetCur)
                    : formatMoney(equivalenceResult.targetSummary.discretionarySavingsMonthlyMajor, targetCur)}
                </span>
              </div>

              {/* Financial Health Indicators */}
              {(() => {
                const rentRatio = Math.round((equivalenceResult.targetSummary.rentMonthlyMajor / Math.max(1, equivalenceResult.targetSummary.netMonthlyMajor)) * 100);
                const savingsRate = Math.round((equivalenceResult.targetSummary.discretionarySavingsMonthlyMajor / Math.max(1, equivalenceResult.targetSummary.netMonthlyMajor)) * 100);
                return (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-mono font-medium ${
                      rentRatio <= 30 ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" :
                      rentRatio <= 40 ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
                      "bg-red-500/15 text-red-300 border border-red-500/30"
                    }`}>
                      {txt("🏠 Sewa:", "🏠 Rent:", "🏠 家賃:")} {rentRatio}% {txt("THP", "Net", "手取り")} {rentRatio <= 30 ? txt("(Aman)", "(Healthy)", "(適正)") : rentRatio <= 40 ? txt("(Moderat)", "(Moderate)", "(標準)") : txt("(Beban Tinggi)", "(High Burden)", "(高負担)")}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-medium bg-accent-500/15 text-accent-300 border border-accent-500/30">
                      {txt("📈 Tabungan:", "📈 Savings:", "📈 貯蓄率:")} {savingsRate}%
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-between items-center pt-1 text-[11px] text-fg-muted">
                <span>
                  {txt("Daya Beli", "Purchasing Power", "購買力:")} {equivalenceResult.targetFoodItem.itemName}:
                </span>
                <span className="font-mono text-amber-300 font-semibold">
                  {equivalenceResult.targetFoodItem.emoji} {equivalenceResult.targetSummary.foodPurchasingPowerQuantity} {txt("porsi / bln", "servings / mo", "食 / 月")}
                </span>
              </div>
            </div>
          </div>

          {/* Source Status Card (Kondisi Anda Saat Ini) */}
          <div className="glass-card p-6 space-y-4 border-l-4 border-l-[var(--accent)] bg-gradient-to-br from-[var(--accent)]/5 to-transparent">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                  {txt("Kondisi Anda Saat Ini (Acuan)", "Current Baseline (Origin)", "現在の状況（基準）")}
                </span>
                <span className="badge-brand text-[10px]">
                  {periodicity === "yearly" ? txt("Per Tahun", "Yearly", "年額") : txt("Per Bulan", "Monthly", "月額")}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text)] mt-1">
                {periodicity === "yearly"
                  ? formatMoney(equivalenceResult.sourceSummary.grossYearlyMajor, sourceCur)
                  : formatMoney(equivalenceResult.sourceSummary.grossMonthlyMajor, sourceCur)}
                <span className="text-xs text-fg-muted font-normal ml-2">
                  / {periodicity === "yearly" ? txt("thn kotor", "yr gross", "年額面") : txt("bln kotor", "mo gross", "月額面")}
                </span>
              </h3>
              <p className="text-xs text-fg-muted font-mono">{sourceCityName}, {sourceCountry}</p>
            </div>

            <hr className="divider" />

            {/* Symmetrical 4 Core Items */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center bg-panel-2 p-2.5 rounded-lg border border-line">
                <span className="text-fg-80 font-medium">
                  {txt("1. Gaji Bersih (Take Home Pay):", "1. Net Take-Home Pay:", "1. 手取り月給:")}
                </span>
                <span className="font-mono font-bold text-[var(--text)] text-sm">
                  {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.sourceSummary.netYearlyMajor, sourceCur)
                    : formatMoney(equivalenceResult.sourceSummary.netMonthlyMajor, sourceCur)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-fg-60">
                  {txt("2. Total Deduksi (Pajak & Asuransi):", "2. Total Deductions (Tax & Social):", "2. 天引き総額:")}
                </span>
                <span className="font-mono text-red-400 font-semibold">
                  - {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.sourceSummary.totalDeductionsYearlyMajor, sourceCur)
                    : formatMoney(equivalenceResult.sourceSummary.totalDeductionsMonthlyMajor, sourceCur)}
                  <span className="text-[10px] text-fg-soft ml-1 font-mono">
                    ({(equivalenceResult.sourceSummary.effectiveDeductionRate * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-fg-60">
                  {txt("3. Total Konsumsi (Sewa + Rutin):", "3. Total Living (Rent + Utilities):", "3. 生活費総額:")}
                </span>
                <span className="font-mono text-fg-80">
                  - {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.sourceSummary.totalConsumptionYearlyMajor, sourceCur)
                    : formatMoney(equivalenceResult.sourceSummary.totalConsumptionMonthlyMajor, sourceCur)}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-line font-bold">
                <span className="text-fg-80">
                  {txt("4. Sisa Belanja & Tabungan:", "4. Discretionary & Savings:", "4. 自由裁量余剰金・貯蓄:")}
                </span>
                <span className="font-mono text-emerald-400 text-sm">
                  + {periodicity === "yearly"
                    ? formatMoney(equivalenceResult.sourceSummary.discretionarySavingsYearlyMajor, sourceCur)
                    : formatMoney(equivalenceResult.sourceSummary.discretionarySavingsMonthlyMajor, sourceCur)}
                </span>
              </div>

              {/* Financial Health Indicators */}
              {(() => {
                const rentRatio = Math.round((equivalenceResult.sourceSummary.rentMonthlyMajor / Math.max(1, equivalenceResult.sourceSummary.netMonthlyMajor)) * 100);
                const savingsRate = Math.round((equivalenceResult.sourceSummary.discretionarySavingsMonthlyMajor / Math.max(1, equivalenceResult.sourceSummary.netMonthlyMajor)) * 100);
                return (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-line text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-mono font-medium ${
                      rentRatio <= 30 ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" :
                      rentRatio <= 40 ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
                      "bg-red-500/15 text-red-300 border border-red-500/30"
                    }`}>
                      {txt("🏠 Sewa:", "🏠 Rent:", "🏠 家賃:")} {rentRatio}% {txt("THP", "Net", "手取り")} {rentRatio <= 30 ? txt("(Aman)", "(Healthy)", "(適正)") : rentRatio <= 40 ? txt("(Moderat)", "(Moderate)", "(標準)") : txt("(Beban Tinggi)", "(High Burden)", "(高負担)")}
                    </span>
                    <span className="px-2 py-0.5 rounded font-mono font-medium bg-[var(--accent-soft)] text-[var(--accent)] border border-line-strong">
                      {txt("📈 Tabungan:", "📈 Savings:", "📈 貯蓄率:")} {savingsRate}%
                    </span>
                  </div>
                );
              })()}

              <div className="flex justify-between items-center pt-1 text-[11px] text-fg-muted">
                <span>
                  {txt("Daya Beli", "Purchasing Power", "購買力:")} {equivalenceResult.sourceFoodItem.itemName}:
                </span>
                <span className="font-mono text-amber-300 font-semibold">
                  {equivalenceResult.sourceFoodItem.emoji} {equivalenceResult.sourceSummary.foodPurchasingPowerQuantity} {txt("porsi / bln", "servings / mo", "食 / 月")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Remittance / Kirim ke Orang Tua Callout ── */}
        {targetCountry !== "ID" && (
          <div className="p-4 rounded-2xl bg-panel-2 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl shrink-0">
                💌
              </div>
              <div>
                <div className="text-xs text-fg-muted font-medium">
                  {txt("Potensi Kirim Uang ke Keluarga di Indonesia", "Remittance Potential to Family in Indonesia", "インドネシアの家族への送金目安")}
                </div>
                <div className="text-sm font-bold text-[var(--text)]">
                  {txt(
                    `Estimasi bersih tiba di tanah air: ~${remitIdrText} / bln`,
                    `Estimated net arriving: ~${remitIdrText} / mo`,
                    `Geschätzter Netto-Eingang in der Heimat: ~${remitIdrText} / Monat`,
                    `手取り送金見積もり: 約 ${remitIdrText} / 月`
                  )}
                </div>
              </div>
            </div>
            <div className="text-[11px] text-fg-muted max-w-xs sm:text-right">
              {txt(
                "Simulasi alokasi surplus tabungan / ~25% THP via transfer transparan (estimasi fee Wise ~1.5%).",
                "Assumes surplus or ~25% net pay allocation via transparent mid-market rates (~1.5% Wise fee).",
                "実質手取りの約25%または貯蓄余力を送金した場合の試算（Wise等の送金手数料約1.5%を考慮）。"
              )}
            </div>
          </div>
        )}

        {/* ── Action Row: Save Scenario, WhatsApp Share, Generate Card PNG ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-line bg-panel-2">
          <div>
            <h4 className="text-sm font-bold text-[var(--text)]">
              {txt("Aksi & Bagikan Hasil Simulasi", "Actions & Share Equivalence", "アクション・シミュレーション結果を保存/共有")}
            </h4>
            <p className="text-xs text-fg-muted mt-0.5">
              {txt(
                `Simpan skenario ke browser, bagikan via WhatsApp, atau unduh infografis PNG 1080×1350.`,
                `Save scenario locally, share via WhatsApp, or download high-res 1080×1350 PNG card.`,
                `Speichern Sie das Szenario im Browser, teilen Sie es per WhatsApp oder laden Sie die PNG-Infografikkarte (1080×1350) herunter.`,
                `シミュレーションをブラウザに保存、WhatsAppで共有、または高画質PNGカード（1080×1350）を出力。`
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveScenario}
              className="py-2 px-3.5 rounded-xl text-xs font-semibold border border-line bg-panel hover:bg-panel-2 transition-all flex items-center gap-1.5 shadow-sm text-fg-80 hover:text-[var(--text)]"
            >
              <span>💾</span>
              <span>{saveSuccessMsg || txt("Simpan Skenario", "Save Scenario", "保存")}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-2 px-3.5 rounded-xl text-xs font-semibold bg-emerald-600/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/25 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-2 whitespace-nowrap shadow-sm"
            >
              <span>✨</span>
              <span>{txt("Buat Kartu Hasil PNG", "Generate Card PNG", "結果カード出力")}</span>
            </button>
          </div>
        </div>

        {/* Subscribe Opt-In */}
        <SubscribeOptIn cityName={targetCityName} countryCode={targetCountry} />
      </div>

      {/* ── KETIGA (SECTION 3): PERSENTIL GAJI & MOBILITAS SOSIAL ──── */}
      <div className="glass-card p-6 space-y-4 border border-line bg-gradient-to-b from-[var(--accent-soft)] to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <span>📊</span>
              <span>
                {txt(
                  "Posisi Persentil & Status Ekonomi Nasional",
                  "National Income Percentile & Economic Standing",
                  "国内所得パーセンタイル・経済階層の位置づけ"
                )}
              </span>
            </h3>
            <p className="text-xs text-fg-muted">
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
          <div className="p-4 sm:p-5 rounded-xl bg-panel border border-line border-t-2 border-t-[var(--accent)] space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[var(--accent)] uppercase tracking-wider block">
                  {txt("Kota Asal (Acuan)", "Origin Reference", "出発地（基準都市）")}
                </span>
                <span className="text-sm font-bold text-[var(--text)]">
                  {sourceCountry === "ID" ? "🇮🇩" : sourceCountry === "JP" ? "🇯🇵" : "🇩🇪"} {sourceCityName}, {sourceCountry}
                </span>
              </div>
              <span className="badge-brand text-[10px] font-mono font-bold">
                Top {sourcePercentile.topPercentage}%
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-[var(--text)]">
                  {txt("Persentil ke-", "Percentile ", "Perzentil ", "第")}{sourcePercentile.percentile}{txt("", "", "", "パーセンタイル")}
                </div>
                <div className="text-xs text-fg-muted font-mono">
                  {sourceCur}{Math.round(equivalenceResult.sourceSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : locale === "de" ? "de-DE" : locale === "ja" ? "ja-JP" : "en-US")} / {txt("bln gross", "mo gross", "M. brutto", "月額面")}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-fg-soft block">
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
                <div className="w-full h-2 bg-panel-2 rounded-full overflow-hidden border border-line">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--accent)] via-emerald-400 to-accent-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, sourcePercentile.percentile))}%` }}
                  />
                </div>
                <div
                  className="absolute top-1.5 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
                  style={{ left: `${Math.max(4, Math.min(96, sourcePercentile.percentile))}%` }}
                >
                  <div className="w-3 h-3 rounded-full bg-[var(--surface)] border-2 border-[var(--accent)] shadow-md shadow-[var(--accent)]/30" />
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-fg-soft font-mono">
                <span>P10</span>
                <span className="text-fg-60">{txt("P50 (Median)", "P50 (Median)", "P50（中央値）")}</span>
                <span>P90</span>
                <span>{txt("P99 (Top 1%)", "P99 (Top 1%)", "P99（上位1%）")}</span>
              </div>
            </div>

            {/* Socio-economic Category Badge */}
            <div className="pt-2 border-t border-line flex items-center justify-between text-[11px]">
              <span className="text-fg-muted">{txt("Status Kelas:", "Economic Bracket:", "階層区分:")}</span>
              <span className="font-semibold text-fg-90">
                {sourcePercentile.description[locale as "id" | "en" | "ja"] ?? sourcePercentile.description.id}
              </span>
            </div>
          </div>

          {/* Card Right: Kota Tujuan */}
          <div className="p-4 sm:p-5 rounded-xl bg-panel border border-line border-t-2 border-t-accent-400 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-accent-300 uppercase tracking-wider block">
                  {txt("Kota Tujuan (Target)", "Destination Target", "目的地（目標都市）")}
                </span>
                <span className="text-sm font-bold text-[var(--text)]">
                  {targetCountry === "ID" ? "🇮🇩" : targetCountry === "JP" ? "🇯🇵" : "🇩🇪"} {targetCityName}, {targetCountry}
                </span>
              </div>
              <span className="badge-accent text-[10px] font-mono font-bold">
                Top {targetPercentile.topPercentage}%
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <div className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-300">
                  {txt("Persentil ke-", "Percentile ", "Perzentil ", "第")}{targetPercentile.percentile}{txt("", "", "", "パーセンタイル")}
                </div>
                <div className="text-xs text-fg-muted font-mono">
                  {targetCur}{Math.round(equivalenceResult.targetSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : locale === "de" ? "de-DE" : locale === "ja" ? "ja-JP" : "en-US")} / {txt("bln gross", "mo gross", "M. brutto", "月額面")}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-fg-soft block">
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
                <div className="w-full h-2 bg-panel-2 rounded-full overflow-hidden border border-line">
                  <div
                    className="h-full bg-gradient-to-r from-accent-400 via-amber-300 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, targetPercentile.percentile))}%` }}
                  />
                </div>
                <div
                  className="absolute top-1.5 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
                  style={{ left: `${Math.max(4, Math.min(96, targetPercentile.percentile))}%` }}
                >
                  <div className="w-3 h-3 rounded-full bg-[var(--surface)] border-2 border-accent-400 shadow-md shadow-accent-400/30" />
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-fg-soft font-mono">
                <span>P10</span>
                <span className="text-fg-60">{txt("P50 (Median)", "P50 (Median)", "P50（中央値）")}</span>
                <span>P90</span>
                <span>{txt("P99 (Top 1%)", "P99 (Top 1%)", "P99（上位1%）")}</span>
              </div>
            </div>

            {/* Socio-economic Category Badge */}
            <div className="pt-2 border-t border-line flex items-center justify-between text-[11px]">
              <span className="text-fg-muted">{txt("Status Kelas:", "Economic Bracket:", "階層区分:")}</span>
              <span className="font-semibold text-fg-90">
                {targetPercentile.description[locale as "id" | "en" | "ja"] ?? targetPercentile.description.id}
              </span>
            </div>
          </div>
        </div>

        {/* Socioeconomic Shift Advisor Note */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-[var(--accent-soft)] border border-line text-xs text-fg-80 flex items-start gap-2.5">
          <span className="text-base leading-none mt-0.5">💡</span>
          <div className="space-y-1">
            <span className="font-semibold text-[var(--accent)] block">
              {txt("Analisis Mobilitas Sosio-Ekonomi:", "Socioeconomic Mobility Insight:", "社会経済的モビリティ分析・格差評価:")}
            </span>
            <p className="text-[11px] leading-relaxed text-fg-70">
              {txt(
                `Di ${sourceCityName}, gaji acuan Anda menempati posisi Top ${sourcePercentile.topPercentage}% (${sourcePercentile.ratioToMedian}x median). Agar dapat mempertahankan gaya hidup & daya beli yang sama di ${targetCityName}, gaji target yang Anda minta (${targetCur}${Math.round(equivalenceResult.targetSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : "en-US")} gross) menempatkan Anda di posisi Top ${targetPercentile.topPercentage}% (${targetPercentile.ratioToMedian}x median nasional ${targetCountry}).`,
                `In ${sourceCityName}, your reference salary ranks at Top ${sourcePercentile.topPercentage}% (${sourcePercentile.ratioToMedian}x median). To maintain the equivalent lifestyle in ${targetCityName}, your required contract salary places you at Top ${targetPercentile.topPercentage}% (${targetPercentile.ratioToMedian}x median in ${targetCountry}).`,
                `In ${sourceCityName} liegt Ihr Referenzgehalt in den oberen ${sourcePercentile.topPercentage}% (${sourcePercentile.ratioToMedian}x Median). Um denselben Lebensstandard in ${targetCityName} beizubehalten, platziert Sie das erforderliche Zielgehalt (${targetCur}${Math.round(equivalenceResult.targetSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : "de-DE")} Brutto) in den oberen ${targetPercentile.topPercentage}% (${targetPercentile.ratioToMedian}x nationaler Median in ${targetCountry}).`,
                `${sourceCityName}では、現在の基準給与は上位${sourcePercentile.topPercentage}%（中央値の${sourcePercentile.ratioToMedian}倍）に位置しています。${targetCityName}で同等の生活水準を維持するために必要な契約給与（月額面 ${targetCur}${Math.round(equivalenceResult.targetSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : "en-US")}）は、渡航先国の給与分布において上位${targetPercentile.topPercentage}%（中央値の${targetPercentile.ratioToMedian}倍）に相当します。`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── TERAKHIR (SECTION 4): RINCIAN DEDUKSI & PENGELUARAN (TABS) ─ */}
      <div className="glass-card p-6 space-y-6 border border-line">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
              <span>🔬</span>
              <span>
                {txt(
                  "Rincian Deduksi Aktif & Simulasi Pengeluaran Mendalam",
                  "Active Statutory Deductions & Itemized Consumption",
                  "控除明細および生活費内訳の詳細シミュレーション"
                )}
              </span>
            </h2>
            <p className="text-xs text-fg-muted">
              {txt(
                "Pajak dan potongan jaminan sosial dihitung secara aktif berdasarkan aturan resmi negara masing-masing.",
                "Taxes and statutory social contributions are calculated interactively based on national laws.",
                "各国の最新法令（所得税・社会保険料等）に基づき天引き額を動的に算出しています。"
              )}
            </p>
          </div>
          <span className="badge-brand text-xs">{txt("Simulasi Interaktif", "Interactive Simulation", "インタラクティブ試算")}</span>
        </div>

        {/* 4 Detail Tabs: Ringkasan | Pajak | Asuransi | Konsumsi */}
        <div className="flex items-center gap-1.5 border-b border-line pb-2 overflow-x-auto">
          {[
            { id: "ringkasan", label: txt("📋 Ringkasan Lengkap", "📋 Full Summary", "📋 総合サマリー") },
            { id: "pajak", label: txt("🏛️ Pajak Penghasilan", "🏛️ Income Tax", "🏛️ 所得税・住民税") },
            { id: "asuransi", label: txt("🏥 Jaminan Sosial / Asuransi", "🏥 Social Security", "🏥 社会保険料") },
            { id: "konsumsi", label: txt("🏠 Sewa & Konsumsi", "🏠 Rent & Living", "🏠 家賃・生活費") },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveDetailTab(t.id as any)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeDetailTab === t.id
                  ? "bg-[var(--accent)] text-white shadow-sm font-bold"
                  : "bg-panel text-fg-60 hover:text-[var(--text)] hover:bg-panel-2"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Country-Specific Advanced Tax Profiles (Conditional Controls) */}
        <div className="p-3.5 rounded-xl bg-panel-2 border border-line space-y-3">
          <div className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider">
            {txt("⚙️ Opsi Pajak Khusus Negara", "⚙️ Country-Specific Tax Profiles", "⚙️ 国別税制オプション")}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Germany Specific Controls */}
            {(sourceCountry === "DE" || targetCountry === "DE") && (
              <div>
                <label className="block text-[11px] text-fg-60 mb-1">
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
                <label className="block text-[11px] text-fg-60 mb-1">
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
                <label className="block text-[11px] text-fg-60 mb-1">
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

        {/* Tab 1: Ringkasan Lengkap */}
        {activeDetailTab === "ringkasan" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-fg-muted">
                  <th className="py-2.5 px-3">{txt("Komponen Rincian", "Itemized Component", "内訳項目")}</th>
                  <th className="py-2.5 px-3">{sourceCityName} ({sourceCountry})</th>
                  <th className="py-2.5 px-3">{targetCityName} ({targetCountry})</th>
                  <th className="py-2.5 px-3">{txt("Keterangan", "Notes & Regulatory Basis", "備考・適用制度")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                <tr className="bg-panel-2 font-bold text-[var(--text)]">
                  <td className="py-2.5 px-3 font-sans">
                    {txt("Gaji Kotor Bulanan (Brutto)", "Monthly Gross Salary", "額面月給（Gross）")}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--accent)]">
                    {formatMoney(equivalenceResult.sourceSummary.grossMonthlyMajor, sourceCur)}
                  </td>
                  <td className="py-2.5 px-3 text-accent-300">
                    {formatMoney(equivalenceResult.targetSummary.grossMonthlyMajor, targetCur)}
                  </td>
                  <td className="py-2.5 px-3 text-fg-muted font-sans text-[11px]">
                    {txt("Kontrak kerja bruto", "Gross contract employment", "契約上の総支給額")}
                  </td>
                </tr>

                <tr className="text-red-400">
                  <td className="py-2 px-3 font-sans">
                    {txt("Total Deduksi Pajak & Asuransi", "Total Deductions (Tax & Social)", "控除合計（税金＋社会保険）")}
                  </td>
                  <td className="py-2 px-3">
                    - {formatMoney(equivalenceResult.sourceSummary.totalDeductionsMonthlyMajor, sourceCur)}
                  </td>
                  <td className="py-2 px-3">
                    - {formatMoney(equivalenceResult.targetSummary.totalDeductionsMonthlyMajor, targetCur)}
                  </td>
                  <td className="py-2 px-3 text-fg-60 font-sans text-[11px]">
                    {(equivalenceResult.sourceSummary.effectiveDeductionRate * 100).toFixed(1)}% vs {(equivalenceResult.targetSummary.effectiveDeductionRate * 100).toFixed(1)}%
                  </td>
                </tr>

                <tr className="font-bold text-[var(--text)]">
                  <td className="py-2.5 px-3 font-sans">
                    {txt("Gaji Bersih (Take Home Pay)", "Net Take-Home Pay", "手取り月給（Net）")}
                  </td>
                  <td className="py-2.5 px-3">
                    {formatMoney(equivalenceResult.sourceSummary.netMonthlyMajor, sourceCur)}
                  </td>
                  <td className="py-2.5 px-3 text-accent-300">
                    {formatMoney(equivalenceResult.targetSummary.netMonthlyMajor, targetCur)}
                  </td>
                  <td className="py-2.5 px-3 text-fg-muted font-sans text-[11px]">
                    {txt("Uang cair ke rekening bank", "Net deposit to bank account", "銀行口座への実支給額")}
                  </td>
                </tr>

                <tr>
                  <td className="py-2 px-3 font-sans">
                    {txt("Estimasi Biaya Sewa Hunian", "Estimated Housing Rent", "推定家賃")}
                  </td>
                  <td className="py-2 px-3">
                    - {formatMoney(equivalenceResult.sourceSummary.rentMonthlyMajor, sourceCur)}
                  </td>
                  <td className="py-2 px-3">
                    - {formatMoney(equivalenceResult.targetSummary.rentMonthlyMajor, targetCur)}
                  </td>
                  <td className="py-2 px-3 text-fg-muted font-sans text-[11px]">
                    {sourceHousingBenchmark.label}
                  </td>
                </tr>

                <tr>
                  <td className="py-2 px-3 font-sans">
                    {txt("Konsumsi & Kebutuhan Rutin Lainnya", "Other Living & Utilities", "食費・光熱費・雑費")}
                  </td>
                  <td className="py-2 px-3">
                    - {formatMoney(Math.max(0, equivalenceResult.sourceSummary.totalConsumptionMonthlyMajor - equivalenceResult.sourceSummary.rentMonthlyMajor), sourceCur)}
                  </td>
                  <td className="py-2 px-3">
                    - {formatMoney(Math.max(0, equivalenceResult.targetSummary.totalConsumptionMonthlyMajor - equivalenceResult.targetSummary.rentMonthlyMajor), targetCur)}
                  </td>
                  <td className="py-2 px-3 text-fg-muted font-sans text-[11px]">
                    {txt("Makan, transport, utilitas dasar", "Food, commute, utilities", "食費、交通費、生活必需品")}
                  </td>
                </tr>

                <tr className="bg-emerald-500/15 font-bold text-emerald-300 text-sm">
                  <td className="py-3 px-3 font-sans">
                    {txt("Sisa Uang Belanja & Tabungan", "Discretionary & Net Savings", "自由裁量余剰金・貯金可能額")}
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
        )}

        {/* Tab 2: Pajak Penghasilan */}
        {activeDetailTab === "pajak" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-fg-muted">
                  <th className="py-2.5 px-3">{txt("Jenis Pajak", "Tax Item", "税金項目")}</th>
                  <th className="py-2.5 px-3">{sourceCityName} ({sourceCountry})</th>
                  <th className="py-2.5 px-3">{targetCityName} ({targetCountry})</th>
                  <th className="py-2.5 px-3">{txt("Dasar Hukum", "Legal Citation", "法的根拠")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono text-red-400">
                <tr>
                  <td className="py-2 px-3 font-sans text-fg-70">
                    {txt("Pajak Penghasilan (Income / Wage Tax)", "Income / Wage Tax", "所得税 / 賃金税")}
                  </td>
                  <td className="py-2 px-3">
                    - {formatMoney(
                      equivalenceResult.sourceSummary.deductionResult.itemizedDeductions
                        .filter((d) => d.category === "tax")
                        .reduce((sum, d) => sum + d.amountMajor, 0),
                      sourceCur
                    )}
                  </td>
                  <td className="py-2 px-3">
                    - {formatMoney(
                      equivalenceResult.targetSummary.deductionResult.itemizedDeductions
                        .filter((d) => d.category === "tax")
                        .reduce((sum, d) => sum + d.amountMajor, 0),
                      targetCur
                    )}
                  </td>
                  <td className="py-2 px-3 text-fg-muted font-sans text-[11px]">
                    PPh 21 (PP 58/2023) · Shotokuzei/Juminzei · § 32a EStG
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Asuransi Sosial */}
        {activeDetailTab === "asuransi" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-fg-muted">
                  <th className="py-2.5 px-3">{txt("Program Jaminan Sosial", "Social Security Program", "公的社会保険制度")}</th>
                  <th className="py-2.5 px-3">{sourceCityName} ({sourceCountry})</th>
                  <th className="py-2.5 px-3">{targetCityName} ({targetCountry})</th>
                  <th className="py-2.5 px-3">{txt("Cakupan Perlindungan", "Coverage", "適用範囲")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono text-red-400">
                <tr>
                  <td className="py-2 px-3 font-sans text-fg-70">
                    {txt("Total Potongan Asuransi Wajib", "Total Mandatory Social Contributions", "公的社会保険料合計")}
                  </td>
                  <td className="py-2 px-3">
                    - {formatMoney(
                      equivalenceResult.sourceSummary.deductionResult.itemizedDeductions
                        .filter((d) => d.category === "social_security")
                        .reduce((sum, d) => sum + d.amountMajor, 0),
                      sourceCur
                    )}
                  </td>
                  <td className="py-2 px-3">
                    - {formatMoney(
                      equivalenceResult.targetSummary.deductionResult.itemizedDeductions
                        .filter((d) => d.category === "social_security")
                        .reduce((sum, d) => sum + d.amountMajor, 0),
                      targetCur
                    )}
                  </td>
                  <td className="py-2 px-3 text-fg-muted font-sans text-[11px]">
                    BPJS Kes/Ket (ID) · Kenko Hoken & Kosei Nenkin (JP) · KV/RV/AV/PV (DE)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Sewa & Konsumsi */}
        {activeDetailTab === "konsumsi" && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-line text-fg-muted">
                  <th className="py-2.5 px-3">{txt("Pos Konsumsi Riil", "Consumption Item", "生活費項目")}</th>
                  <th className="py-2.5 px-3">{sourceCityName} ({sourceCountry})</th>
                  <th className="py-2.5 px-3">{targetCityName} ({targetCountry})</th>
                  <th className="py-2.5 px-3">{txt("Benchmark Metrik", "Benchmark Standard", "基準指標")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-mono">
                <tr>
                  <td className="py-2 px-3 font-sans text-fg-70">
                    {txt("Sewa Hunian Standar", "Reference Housing Rent", "基準家賃")}
                  </td>
                  <td className="py-2 px-3">
                    {formatMoney(equivalenceResult.sourceSummary.rentMonthlyMajor, sourceCur)}
                  </td>
                  <td className="py-2 px-3">
                    {formatMoney(equivalenceResult.targetSummary.rentMonthlyMajor, targetCur)}
                  </td>
                  <td className="py-2 px-3 text-fg-muted font-sans text-[11px]">
                    Destatis / e-Stat / BPS Mietspiegel
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-sans text-fg-70">
                    {txt("Makan & Kebutuhan Harian", "Food & Daily Consumption", "食費・日常消費")}
                  </td>
                  <td className="py-2 px-3">
                    {formatMoney(Math.max(0, equivalenceResult.sourceSummary.totalConsumptionMonthlyMajor - equivalenceResult.sourceSummary.rentMonthlyMajor), sourceCur)}
                  </td>
                  <td className="py-2 px-3">
                    {formatMoney(Math.max(0, equivalenceResult.targetSummary.totalConsumptionMonthlyMajor - equivalenceResult.targetSummary.rentMonthlyMajor), targetCur)}
                  </td>
                  <td className="py-2 px-3 text-fg-muted font-sans text-[11px]">
                    {equivalenceResult.sourceFoodItem.emoji} {indexType.replace("_", " ")} parity
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Index Advisory & Consultant Explanation Box ─────────────── */}
      <div className="rounded-xl p-5 bg-panel-2 border border-line space-y-4 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-[var(--accent)] font-semibold text-sm">
          <span>💡</span>
          <span>
            {txt(
              "Konsultasi Indeks: Pilihan Indeks Daya Beli yang Tepat untuk Anda",
              "Index Consultation: Choosing the Right Purchasing Power Benchmark",
              "指数解説：あなたに最適な購買力平価基準の選び方"
            )}
          </span>
        </div>

        <p className="text-fg-80">
          {equivalenceResult.explanation[locale as "id" | "en" | "ja"] ?? equivalenceResult.explanation.id}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-fg-70">
          <div className="p-3 rounded-lg bg-panel-2 border border-line space-y-1">
            <div className="font-bold text-[var(--text)] flex items-center gap-1.5">
              <span>🥙</span>
              <span>Street Food Index</span>
            </div>
            <p className="text-[11px] text-fg-60">
              {txt(
                "Paling realistis untuk pekerja pemula dan mahasiswa perantau. Mengukur harga makanan cepat saji lokal yang menjadi santapan harian (Döner Kebab di Jerman, Gyudon/Udon di Jepang, Mie Ayam di Indonesia).",
                "Most realistic for entry-level workers and students. Benchmarks common daily street meals (Döner Kebab in Germany, Gyudon/Udon in Japan, Mie Ayam in Indonesia).",
                "新社会人や留学生に最も現実的な指標。日常的なローカルファストフード（ドイツのドネルケバブ、日本の牛丼・うどん、インドネシアのミーアヤム）を基準にします。"
              )}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-panel-2 border border-line space-y-1">
            <div className="font-bold text-[var(--text)] flex items-center gap-1.5">
              <span>🍔</span>
              <span>Big Mac Index</span>
            </div>
            <p className="text-[11px] text-fg-60">
              {txt(
                "Metrik standar internasional ciptaan The Economist sejak 1986. Standar komposisi burger McDonald's identik di seluruh dunia, mencerminkan gabungan biaya sewa komersial lokal, bahan baku, dan upah tenaga kerja.",
                "The Economist's renowned international benchmark since 1986. Standardized McDonald's burgers reflect local commercial rents, commodity prices, and service wages.",
                "1986年より英エコノミスト誌が発表している国際比較基準。世界同一品質のマクドナルド商品を通じ、現地の商業賃料・原材料費・人件費を包括的に反映します。"
              )}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-panel-2 border border-line space-y-1">
            <div className="font-bold text-[var(--text)] flex items-center gap-1.5">
              <span>☕</span>
              <span>Coffee / Cafe Index</span>
            </div>
            <p className="text-[11px] text-fg-60">
              {txt(
                "Indikator gaya hidup urban pekerja modern & tech professionals. Mengukur biaya secangkir cappuccino / specialty coffee di kedai kopi kota metropolitan sebagai representasi pengeluaran rekreasi sosial harian.",
                "Urban lifestyle metric for modern professionals. Measures specialty coffee costs in metropolitan cafes, reflecting daily social and recreational expenditure.",
                "都市部のオフィスワーカーやIT専門職向けライフスタイル指標。主要都市カフェのカプチーノ価格をもとに、日々の社交・余暇活動費用の購買力を測定します。"
              )}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-panel-2 border border-line space-y-1">
            <div className="font-bold text-[var(--text)] flex items-center gap-1.5">
              <span>🛒</span>
              <span>CPI Consumer Basket</span>
            </div>
            <p className="text-[11px] text-fg-60">
              {txt(
                "Paritas keranjang konsumsi statistik resmi (BPS Indonesia, Destatis Jerman, e-Stat Jepang) mencakup bahan pokok supermarket, biaya kebersihan, transportasi, dan telekomunikasi.",
                "Official statistical consumption basket parity (Destatis, e-Stat, BPS) covering supermarket staples, household items, transit, and connectivity.",
                "各国の公的統計（独Destatis、日e-Stat、尼BPS）による総合消費者物価バスケット。食料品・日用品・交通・通信費を包括します。"
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-3 border-t border-line text-[11px] text-fg-soft">
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

      {/* Share Card Modal (1080x1350 PNG with itemized props) */}
      <ShareResultCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={{
          title: `${sourceCityName} ➔ ${targetCityName}`,
          sourceCity: sourceCityName,
          sourceCountry,
          targetCity: targetCityName,
          targetCountry,
          grossSalaryText: `${targetCur}${Math.round(equivalenceResult.targetSummary.grossMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : locale === "de" ? "de-DE" : locale === "ja" ? "ja-JP" : "en-US")}`,
          netSalaryText: `${targetCur}${Math.round(equivalenceResult.targetSummary.netMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : locale === "de" ? "de-DE" : locale === "ja" ? "ja-JP" : "en-US")}`,
          expensesText: `${targetCur}${Math.round(equivalenceResult.targetSummary.totalConsumptionMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : locale === "de" ? "de-DE" : locale === "ja" ? "ja-JP" : "en-US")}`,
          savingsText: `+${targetCur}${Math.round(equivalenceResult.targetSummary.discretionarySavingsMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : locale === "de" ? "de-DE" : locale === "ja" ? "ja-JP" : "en-US")}`,
          foodIndexText: `${equivalenceResult.targetFoodItem.emoji} ${equivalenceResult.targetSummary.foodPurchasingPowerQuantity} ${targetCountry === "JP" ? txt("mangkuk Gyudon", "bowls of gyudon", "Gyudon-Schalen", "ラーメン") : targetCountry === "DE" ? txt("porsi Döner Kebab", "servings of Döner Kebab", "Döner-Taschen", "ドネルケバブ") : txt("porsi Mie Ayam", "servings of Mie Ayam", "Portionen Mie Ayam", "ミーアヤム")} / ${txt("bln", "mo", "M.", "月")}`,
          badgeText: txt(`Gaji Bersih Setara di ${targetCityName}`, `Equivalent Net Salary in ${targetCityName}`, `Äquivalentes Nettogehalt in ${targetCityName}`, `${targetCityName}での実質手取り水準`),
          periodicityText: periodicity === "yearly" ? txt("Per Tahun · Setara", "Per Year · Equivalent", "Jährlich · Äquivalent", "年額 · 同等") : txt("Per Bulan · Setara", "Per Month · Equivalent", "Monatlich · Äquivalent", "月額 · 同等"),
          rentText: `${targetCur}${Math.round(equivalenceResult.targetSummary.rentMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : locale === "de" ? "de-DE" : locale === "ja" ? "ja-JP" : "en-US")}`,
          otherExpensesText: `${targetCur}${Math.round(Math.max(0, equivalenceResult.targetSummary.totalConsumptionMonthlyMajor - equivalenceResult.targetSummary.rentMonthlyMajor)).toLocaleString(locale === "id" ? "id-ID" : locale === "de" ? "de-DE" : locale === "ja" ? "ja-JP" : "en-US")}`,
          deductionsText: `${targetCur}${Math.round(equivalenceResult.targetSummary.totalDeductionsMonthlyMajor).toLocaleString(locale === "id" ? "id-ID" : locale === "de" ? "de-DE" : locale === "ja" ? "ja-JP" : "en-US")}`,
          remittanceIdrText: targetCountry !== "ID" ? remitIdrText : undefined,
        }}
      />
    </div>
  );
}
