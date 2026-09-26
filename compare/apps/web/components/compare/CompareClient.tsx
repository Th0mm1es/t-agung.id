"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currencyContext";
import { supabase } from "@/lib/supabase";
import {
  CAREER_PATHWAYS,
  getCareerPathwayBenchmark,
  type CareerPathwayCode,
  type CareerBenchmarkResult,
  type CountryCode,
  type City,
  type Country,
} from "@bandinghidup/core";
import {
  convertCurrency,
  formatConverted,
  type ReferenceCurrency,
} from "@/lib/exchangeRate";

export function CompareClient() {
  const { locale } = useI18n();
  const { refCurrency, setRefCurrency, exchangeRates } = useCurrency();

  // Fetch all countries and cities from Supabase
  const { data: countries } = useQuery<Country[]>({
    queryKey: ["countries-compare"],
    queryFn: async () => {
      const { data, error } = await supabase.from("countries").select("*");
      if (error) throw error;
      return data as Country[];
    },
  });

  const { data: cities } = useQuery<City[]>({
    queryKey: ["cities-compare"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cities").select("*").order("name");
      if (error) throw error;
      return data as City[];
    },
  });

  // ── Column A (Reference / Skenario Acuan) State ─────────────────────────────
  const [countryA, setCountryA] = useState<CountryCode>("ID");
  const [cityNameA, setCityNameA] = useState<string>("Jakarta");
  const [pathwayA, setPathwayA] = useState<CareerPathwayCode>("fresh_grad_s1");
  const [isJapanSecondYearA, setIsJapanSecondYearA] = useState<boolean>(true);

  // Custom Overrides for Column A
  const [overrideGrossA, setOverrideGrossA] = useState<string>("");
  const [overrideRentA, setOverrideRentA] = useState<string>("");
  const [overrideNetA, setOverrideNetA] = useState<string>("");

  // ── Column B (Comparison / Skenario Pembanding) State ───────────────────────
  const [countryB, setCountryB] = useState<CountryCode>("DE");
  const [cityNameB, setCityNameB] = useState<string>("Berlin");
  const [pathwayB, setPathwayB] = useState<CareerPathwayCode>("ausbildung_kenshusei");
  const [isJapanSecondYearB, setIsJapanSecondYearB] = useState<boolean>(true);

  // Custom Overrides for Column B
  const [overrideGrossB, setOverrideGrossB] = useState<string>("");
  const [overrideRentB, setOverrideRentB] = useState<string>("");
  const [overrideNetB, setOverrideNetB] = useState<string>("");

  // Filter cities for Column A and B
  const citiesA = useMemo(() => {
    if (!cities || !countries) return [];
    const co = countries.find((c) => c.code === countryA);
    return cities.filter((c) => c.country_id === co?.id);
  }, [cities, countries, countryA]);

  const citiesB = useMemo(() => {
    if (!cities || !countries) return [];
    const co = countries.find((c) => c.code === countryB);
    return cities.filter((c) => c.country_id === co?.id);
  }, [cities, countries, countryB]);

  // Compute Benchmark for Column A
  const benchmarkA: CareerBenchmarkResult = useMemo(() => {
    const res = getCareerPathwayBenchmark(countryA, cityNameA, pathwayA, {
      isJapanSecondYear: isJapanSecondYearA,
    });

    if (overrideGrossA || overrideRentA || overrideNetA) {
      const grossVal = overrideGrossA ? parseFloat(overrideGrossA) : res.grossMonthlyMajor;
      const rentVal = overrideRentA ? parseFloat(overrideRentA) : res.recommendedRentMajor;
      const netVal = overrideNetA
        ? parseFloat(overrideNetA)
        : Math.round(grossVal * (1 - res.deductionResult.effectiveDeductionRate));
      const savings = Math.max(0, netVal - rentVal - Math.round(rentVal * 0.9));

      return {
        ...res,
        grossMonthlyMajor: grossVal,
        grossYearlyMajor: grossVal * 12,
        recommendedRentMajor: rentVal,
        netMonthlyMajor: netVal,
        netYearlyMajor: netVal * 12,
        monthlySavingsMajor: savings,
      };
    }

    return res;
  }, [countryA, cityNameA, pathwayA, isJapanSecondYearA, overrideGrossA, overrideRentA, overrideNetA]);

  // Compute Benchmark for Column B
  const benchmarkB: CareerBenchmarkResult = useMemo(() => {
    const res = getCareerPathwayBenchmark(countryB, cityNameB, pathwayB, {
      isJapanSecondYear: isJapanSecondYearB,
    });

    if (overrideGrossB || overrideRentB || overrideNetB) {
      const grossVal = overrideGrossB ? parseFloat(overrideGrossB) : res.grossMonthlyMajor;
      const rentVal = overrideRentB ? parseFloat(overrideRentB) : res.recommendedRentMajor;
      const netVal = overrideNetB
        ? parseFloat(overrideNetB)
        : Math.round(grossVal * (1 - res.deductionResult.effectiveDeductionRate));
      const savings = Math.max(0, netVal - rentVal - Math.round(rentVal * 0.9));

      return {
        ...res,
        grossMonthlyMajor: grossVal,
        grossYearlyMajor: grossVal * 12,
        recommendedRentMajor: rentVal,
        netMonthlyMajor: netVal,
        netYearlyMajor: netVal * 12,
        monthlySavingsMajor: savings,
      };
    }

    return res;
  }, [countryB, cityNameB, pathwayB, isJapanSecondYearB, overrideGrossB, overrideRentB, overrideNetB]);

  const txt = (idStr: string, enStr: string, jaStr: string) =>
    locale === "ja" ? jaStr : locale === "en" ? enStr : idStr;

  const curSymbol = (c: CountryCode) => (c === "DE" ? "€" : c === "JP" ? "¥" : "Rp ");
  const curCode = (c: CountryCode): "EUR" | "JPY" | "IDR" => (c === "DE" ? "EUR" : c === "JP" ? "JPY" : "IDR");

  const formatMoney = (val: number, c: CountryCode) => {
    return `${curSymbol(c)}${Math.round(val).toLocaleString(locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US")}`;
  };

  // Convert to common reference currency
  const toRefCurrency = (amountMajor: number, country: CountryCode) => {
    if (!exchangeRates) return null;
    const decimals = country === "DE" ? 2 : 0;
    const minor = BigInt(Math.round(amountMajor * Math.pow(10, decimals)));
    const conv = convertCurrency(minor, curCode(country), refCurrency, exchangeRates);
    return formatConverted(conv, refCurrency, locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US");
  };

  const getRefNumber = (amountMajor: number, country: CountryCode) => {
    if (!exchangeRates) return amountMajor;
    const decimals = country === "DE" ? 2 : 0;
    const minor = BigInt(Math.round(amountMajor * Math.pow(10, decimals)));
    return convertCurrency(minor, curCode(country), refCurrency, exchangeRates);
  };

  const savingsRefA = getRefNumber(benchmarkA.monthlySavingsMajor, countryA);
  const savingsRefB = getRefNumber(benchmarkB.monthlySavingsMajor, countryB);
  const savingsDelta = savingsRefB - savingsRefA;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in">
      {/* ── Title & Introduction ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge-accent text-xs">
              {txt("🎓 Komparasi Dua Kolom", "🎓 Side-by-Side Dual Column", "🎓 2列並行比較")}
            </span>
            <span className="text-xs text-white/40 font-mono">
              {txt("Tolok Ukur Karir Tahap 4", "Stage 4 Career Benchmark", "第4段階 キャリアベンチマーク")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
            {txt(
              "Perbandingan Magang & Fresh Graduate",
              "Trainee & Fresh Graduate Dual-City Comparison",
              "インターン・新卒 2都市給与比較"
            )}
          </h1>
          <p className="text-sm text-white/60 max-w-2xl leading-relaxed">
            {txt(
              "Bandingkan uang saku Ausbildung di Jerman, gaji kenshusei di Jepang, dan fresh graduate di Indonesia secara berdampingan. Lengkap dengan potongan pajak resmi, biaya sewa hunian, dan analisis ketahanan finansial.",
              "Compare vocational training stipends, intern wages, and fresh grad entry-level salaries side-by-side with statutory payroll deductions, accommodation costs, and net savings.",
              "ドイツのAusbildung手当、日本の技能実習・新卒初任給、インドネシアの新卒初任給を並行比較。法定控除（税金・社会保険）、推奨家賃、手元に残る実質貯蓄可能額を完全シミュレーション。"
            )}
          </p>
        </div>

        {/* Global Reference Currency Switcher */}
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10 self-start md:self-center">
          <span className="text-xs text-white/50 px-1 font-medium">
            {txt("Konversi Acuan:", "Ref Currency:", "換算基準通貨:")}
          </span>
          {(["EUR", "JPY", "IDR", "USD"] as ReferenceCurrency[]).map((c) => (
            <button
              key={c}
              onClick={() => setRefCurrency(c)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                refCurrency === c
                  ? "bg-brand-500 text-white shadow-sm font-bold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Net Monthly Savings Parity Callout ────────────────────────── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-500/10 via-accent-500/10 to-transparent border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-xl">
            ⚖️
          </div>
          <div>
            <div className="text-xs text-white/50 font-medium">
              {txt(
                "Perbandingan Potensi Tabungan Bulanan Bersih",
                "Net Monthly Savings Potential Comparison",
                "月間実質貯蓄ポテンシャル比較"
              )}
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{cityNameA} ({curSymbol(countryA)}{benchmarkA.monthlySavingsMajor.toLocaleString()})</span>
              <span className="text-white/40">vs</span>
              <span>{cityNameB} ({curSymbol(countryB)}{benchmarkB.monthlySavingsMajor.toLocaleString()})</span>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-[11px] text-white/50">
            {txt(
              `Selisih Konversi (${refCurrency}):`,
              `Conversion Difference (${refCurrency}):`,
              `換算差額 (${refCurrency}):`
            )}
          </div>
          <div className={`text-base font-bold font-mono ${savingsDelta >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
            {savingsDelta >= 0 ? "+" : ""}
            {formatConverted(savingsDelta, refCurrency, locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US")} {txt("/ bulan", "/ month", "/ 月")}
          </div>
        </div>
      </div>

      {/* ── Persistent Two Columns Main Comparison Layout ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── COLUMN A: SKENARIO ACUAN ─────────────────────────────────── */}
        <div className="glass-card p-6 space-y-6 border-t-4 border-t-brand-400">
          {/* Header & Selectors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="badge-brand text-[10px] font-bold uppercase tracking-wider">
                {txt("Kolom 1: Skenario Acuan (A)", "Column 1: Baseline Scenario (A)", "第1列: 基準シナリオ (A)")}
              </span>
              <span className="text-xs font-mono text-brand-300 font-bold">
                {benchmarkA.cityName}, {benchmarkA.country}
              </span>
            </div>

            {/* Country & City Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("Negara Acuan", "Baseline Country", "基準国")}
                </label>
                <select
                  value={countryA}
                  onChange={(e) => {
                    const c = e.target.value as CountryCode;
                    setCountryA(c);
                    if (c === "ID") setCityNameA("Jakarta");
                    else if (c === "JP") setCityNameA("Tokyo");
                    else setCityNameA("Berlin");
                  }}
                  className="form-select text-xs py-1.5"
                >
                  <option value="ID">{txt("🇮🇩 Indonesia", "🇮🇩 Indonesia", "🇮🇩 インドネシア")}</option>
                  <option value="JP">{txt("🇯🇵 Jepang", "🇯🇵 Japan", "🇯🇵 日本")}</option>
                  <option value="DE">{txt("🇩🇪 Jerman", "🇩🇪 Germany", "🇩🇪 ドイツ")}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("Kota Acuan", "Baseline City", "基準都市")}
                </label>
                <select
                  value={cityNameA}
                  onChange={(e) => setCityNameA(e.target.value)}
                  className="form-select text-xs py-1.5"
                >
                  {citiesA.length > 0 ? (
                    citiesA.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <option value={cityNameA}>{cityNameA}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Pathway Selector */}
            <div>
              <label className="block text-[11px] text-white/60 mb-1">
                {txt("Jalur Karir / Kategori Pekerja:", "Career Pathway / Category:", "キャリア区分 / 就労形態:")}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["ausbildung_kenshusei", "fresh_grad_s1", "fresh_grad_s2"] as CareerPathwayCode[]).map((p) => {
                  const pathwayTitle = (CAREER_PATHWAYS[p][locale === "ja" ? "titleJa" : locale === "en" ? "titleEn" : "titleId"] || CAREER_PATHWAYS[p].titleId).split("/")[0];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPathwayA(p)}
                      className={`py-2 px-1 text-center rounded-xl transition-all border text-xs ${
                        pathwayA === p
                          ? "bg-brand-500 text-white font-bold border-brand-400 shadow-sm"
                          : "bg-white/5 text-white/60 hover:bg-white/10 border-white/5"
                      }`}
                    >
                      <div>{CAREER_PATHWAYS[p].badgeEmoji}</div>
                      <div className="text-[10px] mt-0.5 truncate">{pathwayTitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Japan Specific: Year 1 vs Year 2 Selector */}
            {countryA === "JP" && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-white/70">
                  {txt("Pajak Daerah (Juminzei):", "Resident Tax (Juminzei):", "住民税 (前年度課税):")}
                </span>
                <button
                  type="button"
                  onClick={() => setIsJapanSecondYearA(!isJapanSecondYearA)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    isJapanSecondYearA
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {isJapanSecondYearA
                    ? txt("Tahun ke-2+ (Kena Juminzei)", "Year 2+ (Subject to Juminzei)", "2年目以降 (住民税あり)")
                    : txt("Tahun ke-1 (Bebas Pajak)", "Year 1 (No Juminzei)", "1年目 (住民税免除)")}
                </button>
              </div>
            )}
          </div>

          <hr className="divider" />

          {/* Results Display for Column A */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] text-white/50 uppercase tracking-wider">
                {txt("Gaji Kotor Resmi (Gross)", "Official Gross Salary", "法定額面給与 (Gross)")}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {formatMoney(benchmarkA.grossMonthlyMajor, countryA)}
                </span>
                <span className="text-xs text-white/50">{txt("/ bulan", "/ month", "/ 月")}</span>
              </div>
              <div className="text-[11px] text-white/40 font-mono">
                {txt("Setara", "Eq.", "換算約")} {toRefCurrency(benchmarkA.grossMonthlyMajor, countryA)} · {formatMoney(benchmarkA.grossYearlyMajor, countryA)} {txt("/ tahun", "/ year", "/ 年")}
              </div>
            </div>

            {/* Symmetrical Metric Rows */}
            <div className="space-y-2.5 text-xs bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-white/70">{txt("Gaji Bersih (Take Home Pay):", "Net Salary (Take Home Pay):", "手取り給与 (Take-home Pay):")}</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {formatMoney(benchmarkA.netMonthlyMajor, countryA)}
                </span>
              </div>

              <div className="flex justify-between items-center text-red-400">
                <span className="text-white/60">{txt("Total Deduksi (Pajak & Asuransi):", "Total Deductions (Tax & Social):", "控除合計 (税金・社会保険):")}</span>
                <span className="font-mono font-semibold">
                  - {formatMoney(benchmarkA.deductionResult.totalDeductionsMajor, countryA)}
                  <span className="text-[10px] text-white/40 ml-1">
                    ({(benchmarkA.deductionResult.effectiveDeductionRate * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60">{txt("Estimasi Sewa Hunian Standar:", "Estimated Standard Rent:", "標準家賃見積もり:")}</span>
                <span className="font-mono text-white/80">
                  - {formatMoney(benchmarkA.recommendedRentMajor, countryA)}
                </span>
              </div>

              <div className="text-[10px] text-brand-300 italic pl-2 border-l border-brand-500/30">
                🏠 {locale === "ja" && benchmarkA.housingTypeDescriptionJa ? benchmarkA.housingTypeDescriptionJa : locale === "en" ? benchmarkA.housingTypeDescriptionEn : benchmarkA.housingTypeDescriptionId}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10 font-bold text-sm">
                <span className="text-white/90">{txt("Sisa Uang Belanja & Tabungan:", "Discretionary & Savings:", "可処分残高・貯蓄可能額:")}</span>
                <span className="font-mono text-emerald-400">
                  + {formatMoney(benchmarkA.monthlySavingsMajor, countryA)}
                </span>
              </div>
              <div className="text-right text-[10px] text-white/40 font-mono">
                ~{toRefCurrency(benchmarkA.monthlySavingsMajor, countryA)} {txt("/ bulan", "/ month", "/ 月")}
              </div>

              {/* Financial Health & Multi-year Savings Forecast */}
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/60">{txt("Status Finansial:", "Financial Health:", "財務健全性ステータス:")}</span>
                  <span className={`px-2 py-0.5 rounded font-medium text-[10px] ${
                    benchmarkA.monthlySavingsMajor >= Math.round(benchmarkA.netMonthlyMajor * 0.25)
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : benchmarkA.monthlySavingsMajor >= 0
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "bg-red-500/15 text-red-300 border border-red-500/30"
                  }`}>
                    {benchmarkA.monthlySavingsMajor >= Math.round(benchmarkA.netMonthlyMajor * 0.25)
                      ? txt("🟢 Surplus Sehat (Bisa Menabung)", "🟢 Healthy Surplus (Able to Save)", "🟢 黒字 (貯蓄可能)")
                      : benchmarkA.monthlySavingsMajor >= 0
                      ? txt("🟡 Impas / Cukup Mandiri", "🟡 Break-even / Self-sufficient", "🟡 収支均衡 (生活維持可能)")
                      : txt("🔴 Defisit / Butuh Subsidi", "🔴 Deficit / Needs Support", "🔴 赤字 (補助が必要)")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/50">{txt("Potensi Tabungan 1 Tahun:", "1-Year Savings Potential:", "年間貯蓄ポテンシャル:")}</span>
                  <span className="font-mono font-semibold text-white/90">
                    {benchmarkA.monthlySavingsMajor >= 0 ? "+" : ""}{formatMoney(benchmarkA.monthlySavingsMajor * 12, countryA)}
                  </span>
                </div>
                {pathwayA === "ausbildung_kenshusei" && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40">{txt("Akumulasi Kontrak (3 Thn):", "3-Year Contract Total:", "契約期間累計 (3年分):")}</span>
                    <span className="font-mono text-brand-300 font-medium">
                      {benchmarkA.monthlySavingsMajor >= 0 ? "+" : ""}{formatMoney(benchmarkA.monthlySavingsMajor * 36, countryA)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contextual Consultant Advice */}
            <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 text-xs text-white/80 space-y-1.5">
              <div className="font-semibold text-brand-300">{txt("💡 Fakta Kontrak & Bonus:", "💡 Contract Facts & Bonuses:", "💡 契約・賞与の留意点:")}</div>
              <p className="text-[11px] leading-relaxed text-white/70">
                {locale === "ja" && benchmarkA.bonusContextJa ? benchmarkA.bonusContextJa : locale === "en" ? benchmarkA.bonusContextEn : benchmarkA.bonusContextId}
              </p>
              <p className="text-[11px] leading-relaxed text-brand-200">
                {locale === "ja" && benchmarkA.auditorAdviceJa ? benchmarkA.auditorAdviceJa : locale === "en" ? benchmarkA.auditorAdviceEn : benchmarkA.auditorAdviceId}
              </p>
            </div>

            {/* Sesuaikan Mandiri (Custom Override) Accordion for Column A */}
            <details className="group rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
              <summary className="cursor-pointer font-semibold text-white/70 hover:text-white flex items-center justify-between">
                <span>{txt("⚙️ Sesuaikan Angka Mandiri (Kota A)", "⚙️ Custom Override (City A)", "⚙️ 手動調整 (都市A)")}</span>
                <span className="text-brand-400 text-sm group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="pt-3 space-y-3 border-t border-white/10 mt-2">
                <div>
                  <label className="block text-[11px] text-white/50 mb-1">
                    {txt("Gaji Kotor Kustom", "Custom Gross Salary", "カスタム額面給与")} ({curSymbol(countryA)})
                  </label>
                  <input
                    type="number"
                    placeholder={String(benchmarkA.grossMonthlyMajor)}
                    value={overrideGrossA}
                    onChange={(e) => setOverrideGrossA(e.target.value)}
                    className="form-select text-xs py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/50 mb-1">
                    {txt("Sewa Hunian Kustom", "Custom Rent", "カスタム家賃")} ({curSymbol(countryA)})
                  </label>
                  <input
                    type="number"
                    placeholder={String(benchmarkA.recommendedRentMajor)}
                    value={overrideRentA}
                    onChange={(e) => setOverrideRentA(e.target.value)}
                    className="form-select text-xs py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/50 mb-1">
                    {txt("Gaji Bersih Kustom (Bila Tahu Angka Pasti)", "Custom Net Salary (If known)", "カスタム手取り額 (既知の場合)")}
                  </label>
                  <input
                    type="number"
                    placeholder={String(benchmarkA.netMonthlyMajor)}
                    value={overrideNetA}
                    onChange={(e) => setOverrideNetA(e.target.value)}
                    className="form-select text-xs py-1 font-mono"
                  />
                </div>
                {(overrideGrossA || overrideRentA || overrideNetA) && (
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideGrossA("");
                      setOverrideRentA("");
                      setOverrideNetA("");
                    }}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>↺</span> {txt("Reset ke Standar Resmi", "Reset to Official Defaults", "公式標準値にリセット")}
                  </button>
                )}
              </div>
            </details>
          </div>
        </div>

        {/* ─── COLUMN B: SKENARIO PEMBANDING ─────────────────────────────── */}
        <div className="glass-card p-6 space-y-6 border-t-4 border-t-accent-400">
          {/* Header & Selectors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="badge-accent text-[10px] font-bold uppercase tracking-wider">
                {txt("Kolom 2: Skenario Pembanding (B)", "Column 2: Comparison Scenario (B)", "第2列: 比較シナリオ (B)")}
              </span>
              <span className="text-xs font-mono text-accent-300 font-bold">
                {benchmarkB.cityName}, {benchmarkB.country}
              </span>
            </div>

            {/* Country & City Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("Negara Pembanding", "Comparison Country", "比較国")}
                </label>
                <select
                  value={countryB}
                  onChange={(e) => {
                    const c = e.target.value as CountryCode;
                    setCountryB(c);
                    if (c === "DE") setCityNameB("Berlin");
                    else if (c === "JP") setCityNameB("Tokyo");
                    else setCityNameB("Jakarta");
                  }}
                  className="form-select text-xs py-1.5"
                >
                  <option value="DE">{txt("🇩🇪 Jerman", "🇩🇪 Germany", "🇩🇪 ドイツ")}</option>
                  <option value="JP">{txt("🇯🇵 Jepang", "🇯🇵 Japan", "🇯🇵 日本")}</option>
                  <option value="ID">{txt("🇮🇩 Indonesia", "🇮🇩 Indonesia", "🇮🇩 インドネシア")}</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-white/60 mb-1">
                  {txt("Kota Pembanding", "Comparison City", "比較都市")}
                </label>
                <select
                  value={cityNameB}
                  onChange={(e) => setCityNameB(e.target.value)}
                  className="form-select text-xs py-1.5"
                >
                  {citiesB.length > 0 ? (
                    citiesB.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))
                  ) : (
                    <option value={cityNameB}>{cityNameB}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Pathway Selector */}
            <div>
              <label className="block text-[11px] text-white/60 mb-1">
                {txt("Jalur Karir / Kategori Pekerja:", "Career Pathway / Category:", "キャリア区分 / 就労形態:")}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["ausbildung_kenshusei", "fresh_grad_s1", "fresh_grad_s2"] as CareerPathwayCode[]).map((p) => {
                  const pathwayTitle = (CAREER_PATHWAYS[p][locale === "ja" ? "titleJa" : locale === "en" ? "titleEn" : "titleId"] || CAREER_PATHWAYS[p].titleId).split("/")[0];
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPathwayB(p)}
                      className={`py-2 px-1 text-center rounded-xl transition-all border text-xs ${
                        pathwayB === p
                          ? "bg-accent-500 text-white font-bold border-accent-400 shadow-sm"
                          : "bg-white/5 text-white/60 hover:bg-white/10 border-white/5"
                      }`}
                    >
                      <div>{CAREER_PATHWAYS[p].badgeEmoji}</div>
                      <div className="text-[10px] mt-0.5 truncate">{pathwayTitle}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Japan Specific: Year 1 vs Year 2 Selector */}
            {countryB === "JP" && (
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-xs">
                <span className="text-white/70">
                  {txt("Pajak Daerah (Juminzei):", "Resident Tax (Juminzei):", "住民税 (前年度課税):")}
                </span>
                <button
                  type="button"
                  onClick={() => setIsJapanSecondYearB(!isJapanSecondYearB)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                    isJapanSecondYearB
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}
                >
                  {isJapanSecondYearB
                    ? txt("Tahun ke-2+ (Kena Juminzei)", "Year 2+ (Subject to Juminzei)", "2年目以降 (住民税あり)")
                    : txt("Tahun ke-1 (Bebas Pajak)", "Year 1 (No Juminzei)", "1年目 (住民税免除)")}
                </button>
              </div>
            )}
          </div>

          <hr className="divider" />

          {/* Results Display for Column B */}
          <div className="space-y-4">
            <div>
              <div className="text-[11px] text-white/50 uppercase tracking-wider">
                {txt("Gaji Kotor Resmi (Gross)", "Official Gross Salary", "法定額面給与 (Gross)")}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-white font-mono">
                  {formatMoney(benchmarkB.grossMonthlyMajor, countryB)}
                </span>
                <span className="text-xs text-white/50">{txt("/ bulan", "/ month", "/ 月")}</span>
              </div>
              <div className="text-[11px] text-white/40 font-mono">
                {txt("Setara", "Eq.", "換算約")} {toRefCurrency(benchmarkB.grossMonthlyMajor, countryB)} · {formatMoney(benchmarkB.grossYearlyMajor, countryB)} {txt("/ tahun", "/ year", "/ 年")}
              </div>
            </div>

            {/* Symmetrical Metric Rows */}
            <div className="space-y-2.5 text-xs bg-white/5 p-4 rounded-xl border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-white/70">{txt("Gaji Bersih (Take Home Pay):", "Net Salary (Take Home Pay):", "手取り給与 (Take-home Pay):")}</span>
                <span className="font-mono font-bold text-accent-300 text-sm">
                  {formatMoney(benchmarkB.netMonthlyMajor, countryB)}
                </span>
              </div>

              <div className="flex justify-between items-center text-red-400">
                <span className="text-white/60">{txt("Total Deduksi (Pajak & Asuransi):", "Total Deductions (Tax & Social):", "控除合計 (税金・社会保険):")}</span>
                <span className="font-mono font-semibold">
                  - {formatMoney(benchmarkB.deductionResult.totalDeductionsMajor, countryB)}
                  <span className="text-[10px] text-white/40 ml-1">
                    ({(benchmarkB.deductionResult.effectiveDeductionRate * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/60">{txt("Estimasi Sewa Hunian Standar:", "Estimated Standard Rent:", "標準家賃見積もり:")}</span>
                <span className="font-mono text-white/80">
                  - {formatMoney(benchmarkB.recommendedRentMajor, countryB)}
                </span>
              </div>

              <div className="text-[10px] text-accent-300 italic pl-2 border-l border-accent-500/30">
                🏠 {locale === "ja" && benchmarkB.housingTypeDescriptionJa ? benchmarkB.housingTypeDescriptionJa : locale === "en" ? benchmarkB.housingTypeDescriptionEn : benchmarkB.housingTypeDescriptionId}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10 font-bold text-sm">
                <span className="text-white/90">{txt("Sisa Uang Belanja & Tabungan:", "Discretionary & Savings:", "可処分残高・貯蓄可能額:")}</span>
                <span className="font-mono text-emerald-400">
                  + {formatMoney(benchmarkB.monthlySavingsMajor, countryB)}
                </span>
              </div>
              <div className="text-right text-[10px] text-white/40 font-mono">
                ~{toRefCurrency(benchmarkB.monthlySavingsMajor, countryB)} {txt("/ bulan", "/ month", "/ 月")}
              </div>

              {/* Financial Health & Multi-year Savings Forecast */}
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/60">{txt("Status Finansial:", "Financial Health:", "財務健全性ステータス:")}</span>
                  <span className={`px-2 py-0.5 rounded font-medium text-[10px] ${
                    benchmarkB.monthlySavingsMajor >= Math.round(benchmarkB.netMonthlyMajor * 0.25)
                      ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      : benchmarkB.monthlySavingsMajor >= 0
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                      : "bg-red-500/15 text-red-300 border border-red-500/30"
                  }`}>
                    {benchmarkB.monthlySavingsMajor >= Math.round(benchmarkB.netMonthlyMajor * 0.25)
                      ? txt("🟢 Surplus Sehat (Bisa Menabung)", "🟢 Healthy Surplus (Able to Save)", "🟢 黒字 (貯蓄可能)")
                      : benchmarkB.monthlySavingsMajor >= 0
                      ? txt("🟡 Impas / Cukup Mandiri", "🟡 Break-even / Self-sufficient", "🟡 収支均衡 (生活維持可能)")
                      : txt("🔴 Defisit / Butuh Subsidi", "🔴 Deficit / Needs Support", "🔴 赤字 (補助が必要)")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/50">{txt("Potensi Tabungan 1 Tahun:", "1-Year Savings Potential:", "年間貯蓄ポテンシャル:")}</span>
                  <span className="font-mono font-semibold text-white/90">
                    {benchmarkB.monthlySavingsMajor >= 0 ? "+" : ""}{formatMoney(benchmarkB.monthlySavingsMajor * 12, countryB)}
                  </span>
                </div>
                {pathwayB === "ausbildung_kenshusei" && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-white/40">{txt("Akumulasi Kontrak (3 Thn):", "3-Year Contract Total:", "契約期間累計 (3年分):")}</span>
                    <span className="font-mono text-accent-300 font-medium">
                      {benchmarkB.monthlySavingsMajor >= 0 ? "+" : ""}{formatMoney(benchmarkB.monthlySavingsMajor * 36, countryB)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contextual Consultant Advice */}
            <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-xs text-white/80 space-y-1.5">
              <div className="font-semibold text-accent-300">{txt("💡 Fakta Kontrak & Bonus:", "💡 Contract Facts & Bonuses:", "💡 契約・賞与の留意点:")}</div>
              <p className="text-[11px] leading-relaxed text-white/70">
                {locale === "ja" && benchmarkB.bonusContextJa ? benchmarkB.bonusContextJa : locale === "en" ? benchmarkB.bonusContextEn : benchmarkB.bonusContextId}
              </p>
              <p className="text-[11px] leading-relaxed text-accent-200">
                {locale === "ja" && benchmarkB.auditorAdviceJa ? benchmarkB.auditorAdviceJa : locale === "en" ? benchmarkB.auditorAdviceEn : benchmarkB.auditorAdviceId}
              </p>
            </div>

            {/* Sesuaikan Mandiri (Custom Override) Accordion for Column B */}
            <details className="group rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
              <summary className="cursor-pointer font-semibold text-white/70 hover:text-white flex items-center justify-between">
                <span>{txt("⚙️ Sesuaikan Angka Mandiri (Kota B)", "⚙️ Custom Override (City B)", "⚙️ 手動調整 (都市B)")}</span>
                <span className="text-accent-400 text-sm group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="pt-3 space-y-3 border-t border-white/10 mt-2">
                <div>
                  <label className="block text-[11px] text-white/50 mb-1">
                    {txt("Gaji Kotor Kustom", "Custom Gross Salary", "カスタム額面給与")} ({curSymbol(countryB)})
                  </label>
                  <input
                    type="number"
                    placeholder={String(benchmarkB.grossMonthlyMajor)}
                    value={overrideGrossB}
                    onChange={(e) => setOverrideGrossB(e.target.value)}
                    className="form-select text-xs py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/50 mb-1">
                    {txt("Sewa Hunian Kustom", "Custom Rent", "カスタム家賃")} ({curSymbol(countryB)})
                  </label>
                  <input
                    type="number"
                    placeholder={String(benchmarkB.recommendedRentMajor)}
                    value={overrideRentB}
                    onChange={(e) => setOverrideRentB(e.target.value)}
                    className="form-select text-xs py-1 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-white/50 mb-1">
                    {txt("Gaji Bersih Kustom (Bila Tahu Angka Pasti)", "Custom Net Salary (If known)", "カスタム手取り額 (既知の場合)")}
                  </label>
                  <input
                    type="number"
                    placeholder={String(benchmarkB.netMonthlyMajor)}
                    value={overrideNetB}
                    onChange={(e) => setOverrideNetB(e.target.value)}
                    className="form-select text-xs py-1 font-mono"
                  />
                </div>
                {(overrideGrossB || overrideRentB || overrideNetB) && (
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideGrossB("");
                      setOverrideRentB("");
                      setOverrideNetB("");
                    }}
                    className="w-full mt-2 py-1.5 px-3 rounded-lg text-[11px] font-medium bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>↺</span> {txt("Reset ke Standar Resmi", "Reset to Official Defaults", "公式標準値にリセット")}
                  </button>
                )}
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
