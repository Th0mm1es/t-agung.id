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
import { ShareResultCardModal } from "@/components/common/ShareResultCardModal";
import { SubscribeOptIn } from "@/components/common/SubscribeOptIn";
import DE_INLINE from "@/locales/de_inlines.json";

export function CompareClient() {
  const { locale, t } = useI18n();
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
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");

  // Realistic international remittance fee benchmark: Wise / bank transfer (~1.5% margin + statutory flat network fee)
  const REMITTANCE_MARGIN_RATE = 0.015; // 1.5%
  const REMITTANCE_FLAT_FEE_EUR = 1.50; // €1.50
  const REMITTANCE_FLAT_FEE_JPY = 250;  // ¥250

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
      const savings = netVal - rentVal - Math.round(rentVal * 0.9);

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
      const savings = netVal - rentVal - Math.round(rentVal * 0.9);

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

  const curSymbol = (c: CountryCode) => (c === "DE" ? "€" : c === "JP" ? "¥" : "Rp ");
  const curCode = (c: CountryCode): "EUR" | "JPY" | "IDR" => (c === "DE" ? "EUR" : c === "JP" ? "JPY" : "IDR");

  const formatMoney = (val: number, c: CountryCode) => {
    const loc = locale === "de" ? "de-DE" : locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US";
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency: curCode(c),
      maximumFractionDigits: 0,
    }).format(Math.round(val));
  };

  // Convert to common reference currency
  const toRefCurrency = (amountMajor: number, country: CountryCode) => {
    if (!exchangeRates) return null;
    const decimals = country === "DE" ? 2 : 0;
    const minor = BigInt(Math.round(amountMajor * Math.pow(10, decimals)));
    const conv = convertCurrency(minor, curCode(country), refCurrency, exchangeRates);
    const loc = locale === "de" ? "de-DE" : locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US";
    return formatConverted(conv, refCurrency, loc);
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

  const handleSaveScenario = () => {
    try {
      const stored = localStorage.getItem("bandinghidup_saved_scenarios");
      const currentList = stored ? JSON.parse(stored) : [];
      const newScenario = {
        id: `sc_cmp_${Date.now()}`,
        label: `${cityNameA} vs ${cityNameB}`,
        pathway: pathwayB,
        gross: benchmarkB.grossMonthlyMajor,
        rent: benchmarkB.recommendedRentMajor,
        living: benchmarkB.otherConsumptionMajor,
        currencySymbol: curSymbol(countryB),
        netSavingsText: `${curSymbol(countryB)}${benchmarkB.monthlySavingsMajor.toLocaleString(locale === "id" ? "id-ID" : "en-US")}`,
        savedAt: new Date().toISOString(),
      };
      const updated = [newScenario, ...currentList.filter((s: any) => s.id !== newScenario.id)].slice(0, 3);
      localStorage.setItem("bandinghidup_saved_scenarios", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("bandinghidup:scenario-saved"));
      setSaveSuccessMsg(txt("Tersimpan!", "Saved!", "Gespeichert!", "保存完了!"));
      setTimeout(() => setSaveSuccessMsg(""), 2500);
    } catch {}
  };

  const handleShareWhatsApp = () => {
    const textMsg = encodeURIComponent(
      `📊 Komparasi Karir & Daya Beli di BandingHidup:\n` +
      `${cityNameA} (${curSymbol(countryA)}${benchmarkA.grossMonthlyMajor.toLocaleString(locale === "id" ? "id-ID" : "en-US")}) vs ${cityNameB} (${curSymbol(countryB)}${benchmarkB.grossMonthlyMajor.toLocaleString(locale === "id" ? "id-ID" : "en-US")})\n` +
      `Gaji Bersih ${cityNameB}: ${curSymbol(countryB)}${benchmarkB.netMonthlyMajor.toLocaleString(locale === "id" ? "id-ID" : "en-US")}\n` +
      `Tabungan ${cityNameB}: +${curSymbol(countryB)}${benchmarkB.monthlySavingsMajor.toLocaleString(locale === "id" ? "id-ID" : "en-US")}\n\n` +
      `Cek simulasi lengkap di https://compare.t-agung.id/compare`
    );
    window.open(`https://wa.me/?text=${textMsg}`, "_blank");
  };

  // Remittance arriving in IDR for Column B
  const remitTargetMajorB = Math.max(
    100,
    Math.round(
      benchmarkB.monthlySavingsMajor > 0
        ? benchmarkB.monthlySavingsMajor
        : benchmarkB.netMonthlyMajor * 0.25
    )
  );
  const remitFeeB =
    remitTargetMajorB * REMITTANCE_MARGIN_RATE +
    (countryB === "DE" ? REMITTANCE_FLAT_FEE_EUR : countryB === "JP" ? REMITTANCE_FLAT_FEE_JPY : 0);
  const remitNetArrivingB = Math.max(0, remitTargetMajorB - remitFeeB);
  const remitIdrTextB = useMemo(() => {
    if (!exchangeRates) return "Rp 0";
    const minor = BigInt(Math.round(remitNetArrivingB * (countryB === "DE" ? 100 : 1)));
    const conv = convertCurrency(minor, curCode(countryB), "IDR", exchangeRates);
    return formatConverted(conv, "IDR", locale === "id" ? "id-ID" : "en-US");
  }, [remitNetArrivingB, countryB, exchangeRates, locale]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in">
      {/* ── Title & Introduction ────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge-accent text-xs">
              {txt("🎓 Komparasi Dua Kolom", "🎓 Side-by-Side Dual Column", "🎓 2列並行比較")}
            </span>
            <span className="text-xs text-fg-soft font-mono">
              {txt("Tolok Ukur Karir Tahap 4", "Stage 4 Career Benchmark", "第4段階 キャリアベンチマーク")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text)]">
            {txt(
              "Perbandingan Magang & Fresh Graduate",
              "Trainee & Fresh Graduate Dual-City Comparison",
              "インターン・新卒 2都市給与比較"
            )}
          </h1>
          <p className="text-sm text-fg-60 max-w-2xl leading-relaxed">
            {txt(
              "Bandingkan uang saku Ausbildung di Jerman, gaji kenshusei di Jepang, dan fresh graduate di Indonesia secara berdampingan. Lengkap dengan potongan pajak resmi, biaya sewa hunian, dan analisis ketahanan finansial.",
              "Compare vocational training stipends, intern wages, and fresh grad entry-level salaries side-by-side with statutory payroll deductions, accommodation costs, and net savings.",
              "ドイツのAusbildung手当、日本の技能実習・新卒初任給、インドネシアの新卒初任給を並行比較。法定控除（税金・社会保険）、推奨家賃、手元に残る実質貯蓄可能額を完全シミュレーション。"
            )}
          </p>
        </div>

        {/* Global Reference Currency Switcher */}
        <div className="flex items-center gap-2 bg-panel-2 p-2 rounded-xl border border-line self-start md:self-center">
          <span className="text-xs text-fg-muted px-1 font-medium">
            {t("compare.ref_currency")}
          </span>
          {(["EUR", "JPY", "IDR", "USD"] as ReferenceCurrency[]).map((c) => (
            <button
              key={c}
              onClick={() => setRefCurrency(c)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                refCurrency === c
                  ? "bg-[var(--accent)] text-white shadow-sm font-bold"
                  : "text-fg-60 hover:text-[var(--text)] hover:bg-panel-2"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── Net Monthly Savings Parity Callout ────────────────────────── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[var(--accent)]/10 via-accent-500/10 to-transparent border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-line-strong flex items-center justify-center text-xl">
            ⚖️
          </div>
          <div>
            <div className="text-xs text-fg-muted font-medium">
              {txt(
                "Perbandingan Potensi Tabungan Bulanan Bersih",
                "Net Monthly Savings Potential Comparison",
                "月間実質貯蓄ポテンシャル比較"
              )}
            </div>
            <div className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <span>{cityNameA} ({curSymbol(countryA)}{benchmarkA.monthlySavingsMajor.toLocaleString(locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US")})</span>
              <span className="text-fg-soft">vs</span>
              <span>{cityNameB} ({curSymbol(countryB)}{benchmarkB.monthlySavingsMajor.toLocaleString(locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US")})</span>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-[11px] text-fg-muted">
            {txt(
              `Selisih Konversi (${refCurrency}):`,
              `Conversion Difference (${refCurrency}):`,
              `Währungsdifferenz (${refCurrency}):`,
              `換算差額 (${refCurrency}):`
            )}
          </div>
          <div className={`text-base font-bold font-mono ${savingsDelta >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
            {savingsDelta >= 0 ? "+" : ""}
            {formatConverted(savingsDelta, refCurrency, locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US")} {txt("/ bulan", "/ month", "/ 月")}
          </div>
        </div>
      </div>

      {/* ── Remittance / Kirim ke Orang Tua Callout ── */}
      {countryB !== "ID" && (
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
                  `Estimasi bersih tiba di tanah air: ~${remitIdrTextB} / bln`,
                  `Estimated net arriving: ~${remitIdrTextB} / mo`,
                  `Geschätzter Netto-Eingang in der Heimat: ~${remitIdrTextB} / Monat`,
                  `手取り送金見積もり: 約 ${remitIdrTextB} / 月`
                )}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-fg-muted max-w-xs sm:text-right">
            {txt(
              "Simulasi alokasi ~25% THP atau sisa tabungan via kurs pasar transparan (estimasi fee Wise ~1.5%).",
              "Assumes ~25% net pay or surplus allocation via transparent mid-market rates (~1.5% Wise fee).",
              "実質手取りの約25%または貯蓄余力を送金した場合の試算（Wise等の送金手数料約1.5%を考慮）。"
            )}
          </div>
        </div>
      )}

      {/* ── Persistent Two Columns Main Comparison Layout ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ─── COLUMN A: SKENARIO ACUAN ─────────────────────────────────── */}
        <div className="glass-card p-6 space-y-6 border-t-4 border-t-[var(--accent)]">
          {/* Header & Selectors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="badge-brand text-[10px] font-bold uppercase tracking-wider">
                {txt("Kolom 1: Skenario Acuan (A)", "Column 1: Baseline Scenario (A)", "第1列: 基準シナリオ (A)")}
              </span>
              <span className="text-xs font-mono text-[var(--accent)] font-bold">
                {benchmarkA.cityName}, {benchmarkA.country}
              </span>
            </div>

            {/* Country & City Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-fg-60 mb-1">
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
                <label className="block text-[11px] text-fg-60 mb-1">
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
              <label className="block text-[11px] text-fg-60 mb-1">
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
                          ? "bg-[var(--accent)] text-white font-bold border-[var(--accent)] shadow-sm"
                          : "bg-panel-2 text-fg-60 hover:bg-panel-2 border-line"
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
              <div className="p-2.5 rounded-lg bg-panel-2 border border-line flex items-center justify-between text-xs">
                <span className="text-fg-70">
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
              <div className="text-[11px] text-fg-muted uppercase tracking-wider">
                {txt("Gaji Kotor Resmi (Gross)", "Official Gross Salary", "法定額面給与 (Gross)")}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[var(--text)] font-mono">
                  {formatMoney(benchmarkA.grossMonthlyMajor, countryA)}
                </span>
                <span className="text-xs text-fg-muted">{txt("/ bulan", "/ month", "/ 月")}</span>
              </div>
              <div className="text-[11px] text-fg-soft font-mono">
                {txt("Setara", "Eq.", "換算約")} {toRefCurrency(benchmarkA.grossMonthlyMajor, countryA)} · {formatMoney(benchmarkA.grossYearlyMajor, countryA)} {txt("/ tahun", "/ year", "/ 年")}
              </div>
            </div>

            {/* Symmetrical Metric Rows */}
            <div className="space-y-2.5 text-xs bg-panel-2 p-4 rounded-xl border border-line">
              <div className="flex justify-between items-center">
                <span className="text-fg-70">{t("compare.net_salary")}</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {formatMoney(benchmarkA.netMonthlyMajor, countryA)}
                </span>
              </div>

              <div className="flex justify-between items-center text-red-400">
                <span className="text-fg-60">{t("compare.total_deductions")}</span>
                <span className="font-mono font-semibold">
                  - {formatMoney(benchmarkA.deductionResult.totalDeductionsMajor, countryA)}
                  <span className="text-[10px] text-fg-soft ml-1">
                    ({(benchmarkA.deductionResult.effectiveDeductionRate * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-fg-60">{t("compare.estimated_rent")}</span>
                <span className="font-mono text-fg-80">
                  - {formatMoney(benchmarkA.recommendedRentMajor, countryA)}
                </span>
              </div>

              <div className="text-[10px] text-[var(--accent)] italic pl-2 border-l border-line-strong">
                🏠 {locale === "ja" && benchmarkA.housingTypeDescriptionJa ? benchmarkA.housingTypeDescriptionJa : locale === "en" ? benchmarkA.housingTypeDescriptionEn : benchmarkA.housingTypeDescriptionId}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-line font-bold text-sm">
                <span className="text-fg-90">{t("compare.discretionary_savings")}</span>
                <span className="font-mono text-emerald-400">
                  + {formatMoney(benchmarkA.monthlySavingsMajor, countryA)}
                </span>
              </div>
              <div className="text-right text-[10px] text-fg-soft font-mono">
                ~{toRefCurrency(benchmarkA.monthlySavingsMajor, countryA)} {txt("/ bulan", "/ month", "/ 月")}
              </div>

              {/* Financial Health & Multi-year Savings Forecast */}
              <div className="pt-2 border-t border-line space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-fg-60">{txt("Status Finansial:", "Financial Health:", "財務健全性ステータス:")}</span>
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
                  <span className="text-fg-muted">{txt("Potensi Tabungan 1 Tahun:", "1-Year Savings Potential:", "年間貯蓄ポテンシャル:")}</span>
                  <span className="font-mono font-semibold text-fg-90">
                    {benchmarkA.monthlySavingsMajor >= 0 ? "+" : ""}{formatMoney(benchmarkA.monthlySavingsMajor * 12, countryA)}
                  </span>
                </div>
                {pathwayA === "ausbildung_kenshusei" && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-fg-soft">{txt("Akumulasi Kontrak (3 Thn):", "3-Year Contract Total:", "契約期間累計 (3年分):")}</span>
                    <span className="font-mono text-[var(--accent)] font-medium">
                      {benchmarkA.monthlySavingsMajor >= 0 ? "+" : ""}{formatMoney(benchmarkA.monthlySavingsMajor * 36, countryA)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contextual Consultant Advice */}
            <div className="p-3 rounded-xl bg-[var(--accent-soft)] border border-line text-xs text-fg-80 space-y-1.5">
              <div className="font-semibold text-[var(--accent)]">{txt("💡 Fakta Kontrak & Bonus:", "💡 Contract Facts & Bonuses:", "💡 契約・賞与の留意点:")}</div>
              <p className="text-[11px] leading-relaxed text-fg-70">
                {locale === "ja" && benchmarkA.bonusContextJa ? benchmarkA.bonusContextJa : locale === "en" ? benchmarkA.bonusContextEn : benchmarkA.bonusContextId}
              </p>
              <p className="text-[11px] leading-relaxed text-[var(--accent)]">
                {locale === "ja" && benchmarkA.auditorAdviceJa ? benchmarkA.auditorAdviceJa : locale === "en" ? benchmarkA.auditorAdviceEn : benchmarkA.auditorAdviceId}
              </p>
            </div>

            {/* Sesuaikan Mandiri (Custom Override) Accordion for Column A */}
            <details className="group rounded-xl border border-line bg-panel p-3 text-xs">
              <summary className="cursor-pointer font-semibold text-fg-70 hover:text-[var(--text)] flex items-center justify-between">
                <span>{txt("⚙️ Sesuaikan Angka Mandiri (Kota A)", "⚙️ Custom Override (City A)", "⚙️ 手動調整 (都市A)")}</span>
                <span className="text-[var(--accent)] text-sm group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="pt-3 space-y-3 border-t border-line mt-2">
                <div>
                  <label className="block text-[11px] text-fg-muted mb-1">
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
                  <label className="block text-[11px] text-fg-muted mb-1">
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
                  <label className="block text-[11px] text-fg-muted mb-1">
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
                <label className="block text-[11px] text-fg-60 mb-1">
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
                <label className="block text-[11px] text-fg-60 mb-1">
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
              <label className="block text-[11px] text-fg-60 mb-1">
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
                          ? "bg-accent-500 text-[var(--text)] font-bold border-accent-400 shadow-sm"
                          : "bg-panel-2 text-fg-60 hover:bg-panel-2 border-line"
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
              <div className="p-2.5 rounded-lg bg-panel-2 border border-line flex items-center justify-between text-xs">
                <span className="text-fg-70">
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
              <div className="text-[11px] text-fg-muted uppercase tracking-wider">
                {txt("Gaji Kotor Resmi (Gross)", "Official Gross Salary", "法定額面給与 (Gross)")}
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-extrabold text-[var(--text)] font-mono">
                  {formatMoney(benchmarkB.grossMonthlyMajor, countryB)}
                </span>
                <span className="text-xs text-fg-muted">{txt("/ bulan", "/ month", "/ 月")}</span>
              </div>
              <div className="text-[11px] text-fg-soft font-mono">
                {txt("Setara", "Eq.", "換算約")} {toRefCurrency(benchmarkB.grossMonthlyMajor, countryB)} · {formatMoney(benchmarkB.grossYearlyMajor, countryB)} {txt("/ tahun", "/ year", "/ 年")}
              </div>
            </div>

            {/* Symmetrical Metric Rows */}
            <div className="space-y-2.5 text-xs bg-panel-2 p-4 rounded-xl border border-line">
              <div className="flex justify-between items-center">
                <span className="text-fg-70">{t("compare.net_salary")}</span>
                <span className="font-mono font-bold text-accent-300 text-sm">
                  {formatMoney(benchmarkB.netMonthlyMajor, countryB)}
                </span>
              </div>

              <div className="flex justify-between items-center text-red-400">
                <span className="text-fg-60">{t("compare.total_deductions")}</span>
                <span className="font-mono font-semibold">
                  - {formatMoney(benchmarkB.deductionResult.totalDeductionsMajor, countryB)}
                  <span className="text-[10px] text-fg-soft ml-1">
                    ({(benchmarkB.deductionResult.effectiveDeductionRate * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-fg-60">{t("compare.estimated_rent")}</span>
                <span className="font-mono text-fg-80">
                  - {formatMoney(benchmarkB.recommendedRentMajor, countryB)}
                </span>
              </div>

              <div className="text-[10px] text-accent-300 italic pl-2 border-l border-accent-500/30">
                🏠 {locale === "ja" && benchmarkB.housingTypeDescriptionJa ? benchmarkB.housingTypeDescriptionJa : locale === "en" ? benchmarkB.housingTypeDescriptionEn : benchmarkB.housingTypeDescriptionId}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-line font-bold text-sm">
                <span className="text-fg-90">{t("compare.discretionary_savings")}</span>
                <span className="font-mono text-emerald-400">
                  + {formatMoney(benchmarkB.monthlySavingsMajor, countryB)}
                </span>
              </div>
              <div className="text-right text-[10px] text-fg-soft font-mono">
                ~{toRefCurrency(benchmarkB.monthlySavingsMajor, countryB)} {txt("/ bulan", "/ month", "/ 月")}
              </div>

              {/* Financial Health & Multi-year Savings Forecast */}
              <div className="pt-2 border-t border-line space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-fg-60">{txt("Status Finansial:", "Financial Health:", "財務健全性ステータス:")}</span>
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
                  <span className="text-fg-muted">{txt("Potensi Tabungan 1 Tahun:", "1-Year Savings Potential:", "年間貯蓄ポテンシャル:")}</span>
                  <span className="font-mono font-semibold text-fg-90">
                    {benchmarkB.monthlySavingsMajor >= 0 ? "+" : ""}{formatMoney(benchmarkB.monthlySavingsMajor * 12, countryB)}
                  </span>
                </div>
                {pathwayB === "ausbildung_kenshusei" && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-fg-soft">{txt("Akumulasi Kontrak (3 Thn):", "3-Year Contract Total:", "契約期間累計 (3年分):")}</span>
                    <span className="font-mono text-accent-300 font-medium">
                      {benchmarkB.monthlySavingsMajor >= 0 ? "+" : ""}{formatMoney(benchmarkB.monthlySavingsMajor * 36, countryB)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contextual Consultant Advice */}
            <div className="p-3 rounded-xl bg-accent-500/10 border border-accent-500/20 text-xs text-fg-80 space-y-1.5">
              <div className="font-semibold text-accent-300">{txt("💡 Fakta Kontrak & Bonus:", "💡 Contract Facts & Bonuses:", "💡 契約・賞与の留意点:")}</div>
              <p className="text-[11px] leading-relaxed text-fg-70">
                {locale === "ja" && benchmarkB.bonusContextJa ? benchmarkB.bonusContextJa : locale === "en" ? benchmarkB.bonusContextEn : benchmarkB.bonusContextId}
              </p>
              <p className="text-[11px] leading-relaxed text-accent-200">
                {locale === "ja" && benchmarkB.auditorAdviceJa ? benchmarkB.auditorAdviceJa : locale === "en" ? benchmarkB.auditorAdviceEn : benchmarkB.auditorAdviceId}
              </p>
            </div>

            {/* Sesuaikan Mandiri (Custom Override) Accordion for Column B */}
            <details className="group rounded-xl border border-line bg-panel p-3 text-xs">
              <summary className="cursor-pointer font-semibold text-fg-70 hover:text-[var(--text)] flex items-center justify-between">
                <span>{txt("⚙️ Sesuaikan Angka Mandiri (Kota B)", "⚙️ Custom Override (City B)", "⚙️ 手動調整 (都市B)")}</span>
                <span className="text-accent-400 text-sm group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="pt-3 space-y-3 border-t border-line mt-2">
                <div>
                  <label className="block text-[11px] text-fg-muted mb-1">
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
                  <label className="block text-[11px] text-fg-muted mb-1">
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
                  <label className="block text-[11px] text-fg-muted mb-1">
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

      {/* ── Action Row (Save, WhatsApp, PNG Card) & Subscribe Opt-In ── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-line bg-panel-2">
          <div>
            <h4 className="text-sm font-bold text-[var(--text)]">
              {txt("Aksi & Bagikan Hasil Perbandingan", "Actions & Share Comparison", "アクション・比較結果を保存/共有")}
            </h4>
            <p className="text-xs text-fg-muted mt-0.5">
              {txt(
                `Simpan simulasi ke browser, bagikan via WhatsApp, atau unduh kartu infografis PNG 1080×1350.`,
                `Save simulation locally, share via WhatsApp, or download high-res 1080×1350 PNG card.`,
                `Speichern Sie die Simulation im Browser, teilen Sie sie per WhatsApp oder laden Sie die PNG-Infografikkarte (1080×1350) herunter.`,
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

        <SubscribeOptIn cityName={cityNameB} countryCode={countryB} />
      </div>

      {/* Share Card Modal */}
      <ShareResultCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={{
          title: `${cityNameA} (${countryA}) vs ${cityNameB} (${countryB})`,
          sourceCity: cityNameA,
          sourceCountry: countryA,
          targetCity: cityNameB,
          targetCountry: countryB,
          grossSalaryText: `${formatMoney(benchmarkB.grossMonthlyMajor, countryB)}`,
          netSalaryText: `${formatMoney(benchmarkB.netMonthlyMajor, countryB)}`,
          expensesText: `${formatMoney(benchmarkB.totalExpensesMajor || (benchmarkB.recommendedRentMajor + (benchmarkB.otherConsumptionMajor || 0)), countryB)}`,
          savingsText: `${benchmarkB.monthlySavingsMajor >= 0 ? "+" : ""}${formatMoney(benchmarkB.monthlySavingsMajor, countryB)}`,
          foodIndexText: `${txt("Surplus", "Surplus", "Überschuss", "黒字")}: ${formatMoney(benchmarkB.monthlySavingsMajor, countryB)} / ${txt("bln", "mo", "M.", "月")}`,
          badgeText: `${txt("Gaji Bersih", "Net Salary", "Nettogehalt", "手取り")} ${cityNameB}: ${formatMoney(benchmarkB.netMonthlyMajor, countryB)}`,
          periodicityText: txt("Perbandingan Jalur Karir · Per Bulan", "Career Pathway Comparison · Monthly", "Karrierepfad-Vergleich · Monatlich", "キャリアパス比較 · 月額"),
          rentText: `${formatMoney(benchmarkB.recommendedRentMajor, countryB)}`,
          otherExpensesText: `${formatMoney(benchmarkB.otherConsumptionMajor || 0, countryB)}`,
          deductionsText: `${formatMoney(benchmarkB.deductionResult.totalDeductionsMajor, countryB)}`,
          remittanceIdrText: countryB !== "ID" ? remitIdrTextB : undefined,
        }}
      />
    </div>
  );
}
