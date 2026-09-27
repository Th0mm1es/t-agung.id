"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currencyContext";
import {
  calculateIncomePercentile,
  compareIncomePercentiles,
  type PercentileCountry,
  DEFAULT_PERCENTILE_ANCHORS,
} from "@bandinghidup/core";

export function PercentileClient() {
  const { locale } = useI18n();
  const { exchangeRates } = useCurrency();

  const txt = (idStr: string, enStr: string, deOrJaStr: string, jaStr?: string) => {
    if (jaStr !== undefined) {
      if (locale === "ja") return jaStr;
      if (locale === "de") return deOrJaStr;
      if (locale === "en") return enStr;
      return idStr;
    }
    if (locale === "ja") return deOrJaStr;
    if (locale === "de") return enStr;
    if (locale === "en") return enStr;
    return idStr;
  };

  const [country, setCountry] = useState<PercentileCountry>("ID");
  const [grossInput, setGrossInput] = useState<string>("10000000"); // Rp 10.000.000

  const decimals = country === "DE" ? 2 : 0;
  const currencySymbol = country === "DE" ? "€" : country === "JP" ? "¥" : "Rp ";

  const grossMinorUnits = useMemo(() => {
    const val = parseFloat(grossInput) || 0;
    return BigInt(Math.round(val * Math.pow(10, decimals)));
  }, [grossInput, decimals]);

  // Current Domestic Percentile
  const localResult = useMemo(() => {
    return calculateIncomePercentile(grossMinorUnits, country);
  }, [grossMinorUnits, country]);

  // Comparison Across 3 Countries
  const crossComparison = useMemo(() => {
    return compareIncomePercentiles(grossMinorUnits, country, exchangeRates?.rates);
  }, [grossMinorUnits, country, exchangeRates]);

  const countryNames = {
    ID: { id: "Indonesia 🇮🇩", en: "Indonesia 🇮🇩", de: "Indonesien 🇮🇩", ja: "インドネシア 🇮🇩" },
    JP: { id: "Jepang 🇯🇵", en: "Japan 🇯🇵", de: "Japan 🇯🇵", ja: "日本 🇯🇵" },
    DE: { id: "Jerman 🇩🇪", en: "Germany 🇩🇪", de: "Deutschland 🇩🇪", ja: "ドイツ 🇩🇪" },
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 space-y-8 animate-fade-in">
      {/* Title */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="badge-brand text-xs">
            {txt("📊 Radar Distribusi Pendapatan", "📊 Income Distribution Radar", "📊 所得分布レーダー")}
          </span>
          <span className="text-xs text-fg-soft font-mono">BPS · e-Stat · Destatis</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text)]">
          {locale === "id"
            ? "Di Mana Posisi Gajimu? (Radar Persentil Pendapatan)"
            : locale === "ja"
            ? "あなたの月収はどの位置？（日・独・尼 所得パーセンタイル診断）"
            : locale === "de"
            ? "Wo steht Ihr Gehalt? (Einkommens-Perzentil-Radar)"
            : "Where Does Your Salary Rank? (Income Percentile Radar)"}
        </h1>
        <p className="text-sm text-fg-60 max-w-2xl leading-relaxed">
          {locale === "id"
            ? "Masukkan penghasilan kotor Anda untuk melihat peringkat persentil Anda di negara asal, serta perbandingannya jika dikonversi secara riil di Jerman dan Jepang. Data diperbarui secara berkala."
            : locale === "ja"
            ? "額面月給を入力すると、国内就業者全体におけるパーセンタイル順位と、ドイツ・日本・インドネシア間での相対的な所得ポジションを比較できます。"
            : locale === "de"
            ? "Geben Sie Ihr Bruttomonatseinkommen ein, um Ihren Perzentilrang im Heimatland zu ermitteln und mit Deutschland und Japan zu vergleichen. Regelmäßig aktualisierte Daten."
            : "Enter your gross monthly income to evaluate your domestic percentile rank and see how your earnings compare across Germany, Japan, and Indonesia."}
        </p>
      </div>

      {/* Input Card */}
      <div className="glass-card p-6 space-y-6 border border-line">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs text-fg-70 mb-1.5 font-semibold">
              {txt("Pilih Negara Asal Acuan:", "Select Reference Country:", "基準国を選択:")}
            </label>
            <select
              value={country}
              onChange={(e) => {
                const c = e.target.value as PercentileCountry;
                setCountry(c);
                if (c === "ID") setGrossInput("10000000");
                else if (c === "JP") setGrossInput("320000");
                else setGrossInput("3650");
              }}
              className="form-select text-sm py-2"
            >
              <option value="ID">{txt("🇮🇩 Indonesia (Rupiah - IDR)", "🇮🇩 Indonesia (Rupiah - IDR)", "🇮🇩 インドネシア (ルピア - IDR)")}</option>
              <option value="JP">{txt("🇯🇵 Jepang (Yen - JPY)", "🇯🇵 Japan (Yen - JPY)", "🇯🇵 日本 (円 - JPY)")}</option>
              <option value="DE">{txt("🇩🇪 Jerman (Euro - EUR)", "🇩🇪 Germany (Euro - EUR)", "🇩🇪 ドイツ (ユーロ - EUR)")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-fg-70 mb-1.5 font-semibold">
              {txt("Gaji Kotor / Gross Bulanan:", "Gross Monthly Income:", "額面月収 (Gross):")}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-[var(--accent)]">{currencySymbol}</span>
              <input
                type="number"
                value={grossInput}
                onChange={(e) => setGrossInput(e.target.value)}
                className="form-select text-base font-mono font-bold py-1.5"
                placeholder="10000000"
              />
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              <span className="text-[10px] text-fg-soft self-center mr-1 font-medium">
                {txt("Contoh:", "Presets:", "目安例:")}
              </span>
              {country === "ID" && (
                <>
                  <button type="button" onClick={() => setGrossInput("5400000")} className="px-2 py-0.5 rounded text-[10px] bg-panel-2 hover:bg-panel-2 text-fg-70 border border-line transition-colors">
                    {txt("UMR Jakarta (5,4 jt)", "Jakarta Min Wage (5.4m)", "ジャカルタ最低賃金 (540万Rp)")}
                  </button>
                  <button type="button" onClick={() => setGrossInput("8500000")} className="px-2 py-0.5 rounded text-[10px] bg-panel-2 hover:bg-panel-2 text-fg-70 border border-line transition-colors">
                    {txt("Fresh Grad S1 (8,5 jt)", "Fresh Grad Bachelor (8.5m)", "大卒初任給 (850万Rp)")}
                  </button>
                  <button type="button" onClick={() => setGrossInput("15000000")} className="px-2 py-0.5 rounded text-[10px] bg-panel-2 hover:bg-panel-2 text-fg-70 border border-line transition-colors">
                    {txt("Mid-Level (15 jt)", "Mid-Level (15m)", "中堅専門職 (1500万Rp)")}
                  </button>
                  <button type="button" onClick={() => setGrossInput("30000000")} className="px-2 py-0.5 rounded text-[10px] bg-panel-2 hover:bg-panel-2 text-fg-70 border border-line transition-colors">
                    {txt("Senior Lead (30 jt)", "Senior Lead (30m)", "シニアリーダー (3000万Rp)")}
                  </button>
                </>
              )}
              {country === "DE" && (
                <>
                  <button type="button" onClick={() => setGrossInput("2054")} className="px-2 py-0.5 rounded text-[10px] bg-panel-2 hover:bg-panel-2 text-fg-70 border border-line transition-colors">
                    {txt("Mindestlohn (€2.054)", "Min. Wage (€2,054)", "法定最低賃金 (€2,054)")}
                  </button>
                  <button type="button" onClick={() => setGrossInput("3650")} className="px-2 py-0.5 rounded text-[10px] bg-panel-2 hover:bg-panel-2 text-fg-70 border border-line transition-colors">
                    {txt("Median Jerman (€3.650)", "German Median (€3,650)", "独中央値 (€3,650)")}
                  </button>
                  <button type="button" onClick={() => setGrossInput("5500")} className="px-2 py-0.5 rounded text-[10px] bg-panel-2 hover:bg-panel-2 text-fg-70 border border-line transition-colors">
                    {txt("Tech/Engineer (€5.500)", "Tech/Engineer (€5,500)", "IT技術職 (€5,500)")}
                  </button>
                </>
              )}
              {country === "JP" && (
                <>
                  <button type="button" onClick={() => setGrossInput("180000")} className="px-2 py-0.5 rounded text-[10px] bg-panel-2 hover:bg-panel-2 text-fg-70 border border-line transition-colors">
                    {txt("Upah Minimum (¥180k)", "Min. Wage (¥180k)", "法定最低賃金 (月給換算18万円)")}
                  </button>
                  <button type="button" onClick={() => setGrossInput("240000")} className="px-2 py-0.5 rounded text-[10px] bg-panel-2 hover:bg-panel-2 text-fg-70 border border-line transition-colors">
                    {txt("Fresh Grad (¥240k)", "Fresh Grad (¥240k)", "大卒初任給 (24万円)")}
                  </button>
                  <button type="button" onClick={() => setGrossInput("320000")} className="px-2 py-0.5 rounded text-[10px] bg-panel-2 hover:bg-panel-2 text-fg-70 border border-line transition-colors">
                    {txt("Median Jepang (¥320k)", "Japan Median (¥320k)", "日本中央値 (32万円)")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

          {/* Visual Percentile Gauge */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 via-white/5 to-transparent border border-line space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
                  {txt("Peringkat Nasional Anda", "National Percentile Rank", "国内パーセンタイル順位")}
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-[var(--text)] mt-0.5">
                  {locale === "ja"
                    ? `第${localResult.percentile}パーセンタイル`
                    : locale === "en"
                    ? `${localResult.percentile}th Percentile`
                    : `Persentil ke-${localResult.percentile}`}
                  <span className="text-base sm:text-lg font-bold text-[var(--accent)] ml-3">
                    {locale === "ja" ? `(上位 ${localResult.topPercentage}%)` : `(Top ${localResult.topPercentage}%)`}
                  </span>
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-xs text-fg-muted block">
                  {txt("Rasio terhadap Median Nasional:", "Ratio to National Median:", "国内中央値比:")}
                </span>
                <span className="text-lg font-mono font-bold text-amber-300">
                  {locale === "ja" ? `${localResult.ratioToMedian}倍 (中央値)` : `${localResult.ratioToMedian}x Median`}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="w-full h-4 bg-panel-2 rounded-full overflow-hidden p-0.5 border border-line relative">
                <div
                  className="h-full bg-gradient-to-r from-[var(--accent)] via-emerald-400 to-accent-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(3, localResult.percentile)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-fg-soft font-mono">
                <span>{txt("P1 (Bawah)", "P1 (Bottom)", "P1 (下位)")}</span>
                <span>P25</span>
                <span>{txt("P50 (Median)", "P50 (Median)", "P50 (中央値)")}</span>
                <span>P75</span>
                <span>{txt("P90 (Top 10%)", "P90 (Top 10%)", "P90 (上位10%)")}</span>
                <span>{txt("P99 (Top 1%)", "P99 (Top 1%)", "P99 (上位1%)")}</span>
              </div>
            </div>

            <p className="text-xs text-fg-70 leading-relaxed">
              {localResult.description[locale as "id" | "en" | "de" | "ja"] ?? localResult.description.id}
            </p>
          </div>
        </div>

        {/* Financial Advisor Insight: Nominal Exchange Illusion */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
            <span>💡</span>
            <span>
              {txt(
                "Catatan Penasihat Finansial: Waspadai Ilusi Nilai Tukar (Exchange Rate Illusion)",
                "Financial Advisor Note: Beware the Exchange Rate Illusion",
                "ファイナンシャルアドバイザーの助言: 為替レートの錯覚に注意"
              )}
            </span>
          </div>
          <p className="text-fg-80 leading-relaxed">
            {country === "ID"
              ? txt(
                  "Gaji Rp 10.000.000 menempatkan Anda di kelas atas nasional Indonesia (Top 15%), namun jika dikonversi secara nominal hanya setara ~€581 di Jerman. Di Jerman, upah minimum resmi (Mindestlohn) adalah €2.054/bulan. Angka konversi nominal murni tidak mencerminkan daya beli riil karena biaya hidup dasar dan struktur upah di negara tujuan jauh lebih tinggi.",
                  "An income of IDR 10,000,000 places you in Indonesia's national upper tier (Top 15%), yet nominally converts to only ~€581 in Germany. In Germany, the official gross minimum wage (Mindestlohn) is €2,054/month. Nominal conversions fail to reflect real purchasing power because baseline living costs and wage floors in destination countries are significantly higher.",
                  "月収1,000万ルピアはインドネシア国内の上位15%に位置しますが、名目為替換算するとドイツでは約581ユーロに過ぎません。ドイツの法定最低賃金は月額2,054ユーロです。現地の物価水準や基礎生活費が根本的に異なるため、単なる名目換算値だけでは実質的な購買力を測ることはできません。"
                )
              : txt(
                  "Konversi mata uang pasar murni tidak memperhitungkan perbedaan struktur pajak wajib dan biaya hidup lokal. Gunakan Menu 1 (Berapa Gaji Setaraku) untuk menghitung angka negosiasi kontrak yang melindungi standar hidup riil Anda.",
                  "Market exchange rates do not account for mandatory tax deductions and local living costs. Use Menu 1 (Equivalent Salary) to calculate target contract salaries that preserve your real living standards.",
                  "市場為替レートによる換算は、現地の法定税・社会保険控除や住居費などの生活コストを反映していません。「第1の柱: 等価給与計算」を活用し、実質的な生活水準を維持できる交渉基準額を算出してください。"
                )}
          </p>
        </div>

        {/* Cross-Country Comparison Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
            <span>🌐</span>
            <span>
              {txt(
                "Posisi Gaji Ini Jika Dikonversi di Negara Lain",
                "Equivalent Position in Other Countries",
                "他国における名目換算後の所得ポジション"
              )}
            </span>
          </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["ID", "JP", "DE"] as PercentileCountry[]).map((c) => {
            const data = crossComparison[c];
            const isHome = c === country;
            const curSym = c === "DE" ? "€" : c === "JP" ? "¥" : "Rp ";

            return (
              <div
                key={c}
                className={`glass-card p-5 space-y-3 border-t-4 transition-all ${
                  isHome
                    ? "border-t-[var(--accent)] bg-[var(--accent-soft)] shadow-lg shadow-[var(--accent)]/10"
                    : "border-t-white/20"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[var(--text)]">
                    {countryNames[c][locale as "id" | "en" | "ja"] ?? countryNames[c].id}
                  </span>
                  {isHome && (
                    <span className="badge-brand text-[10px]">
                      {txt("Negara Asal", "Home Country", "基準国")}
                    </span>
                  )}
                </div>

                <div>
                  <div className="text-xs text-fg-muted">{txt("Nilai Konversi Nominal:", "Nominal Converted Value:", "名目換算月収:")}</div>
                  <div className="text-lg font-mono font-bold text-[var(--text)]">
                    {curSym}{data.convertedGrossMajor.toLocaleString()}
                    <span className="text-[11px] text-fg-soft font-normal ml-1">{txt("/ bln", "/ mo", "/ 月")}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-line">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-fg-60">{txt("Posisi Persentil:", "Percentile Rank:", "パーセンタイル順位:")}</span>
                    <span className="font-bold text-[var(--accent)]">
                      {locale === "ja"
                        ? `第${data.percentile}パーセンタイル (上位${data.topPercentage}%)`
                        : locale === "en"
                        ? `${data.percentile}th Percentile (Top ${data.topPercentage}%)`
                        : `Persentil ke-${data.percentile} (Top ${data.topPercentage}%)`}
                    </span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-panel-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] rounded-full"
                    style={{ width: `${Math.max(3, data.percentile)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reference Anchors Table & Methodology */}
      <div className="glass-card p-6 space-y-4 border border-line">
        <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
          <span>📚</span>
          <span>
            {txt(
              "Tabel Acuan Persentil Nasional (Anchor Points)",
              "National Percentile Calibration Anchors",
              "国家所得パーセンタイル基準表 (アンカーポイント)"
            )}
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-line text-fg-muted uppercase font-mono">
                <th className="py-2">{txt("Persentil", "Percentile", "パーセンタイル")}</th>
                <th className="py-2 text-right">{txt("🇮🇩 Indonesia (IDR)", "🇮🇩 Indonesia (IDR)", "🇮🇩 インドネシア (IDR)")}</th>
                <th className="py-2 text-right">{txt("🇯🇵 Jepang (JPY)", "🇯🇵 Japan (JPY)", "🇯🇵 日本 (JPY)")}</th>
                <th className="py-2 text-right">{txt("🇩🇪 Jerman (EUR)", "🇩🇪 Germany (EUR)", "🇩🇪 ドイツ (EUR)")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-mono text-fg-80">
              <tr>
                <td className="py-2 text-fg-60 font-sans">{txt("P10 (Pekerja Bawah)", "P10 (Entry / Lower Tier)", "P10 (低所得層 / 見習い)")}</td>
                <td className="py-2 text-right">Rp 1.800.000</td>
                <td className="py-2 text-right">¥140.000</td>
                <td className="py-2 text-right">€1.850</td>
              </tr>
              <tr>
                <td className="py-2 text-fg-60 font-sans">{txt("P25 (Entry Level / Trainee)", "P25 (Entry Level / Trainee)", "P25 (新卒・若手層)")}</td>
                <td className="py-2 text-right">Rp 3.000.000</td>
                <td className="py-2 text-right">¥200.000</td>
                <td className="py-2 text-right">€2.600</td>
              </tr>
              <tr className="bg-[var(--accent-soft)] font-bold text-[var(--accent)]">
                <td className="py-2 font-sans">{txt("P50 (Median Nasional)", "P50 (National Median)", "P50 (国内中央値)")}</td>
                <td className="py-2 text-right">Rp 4.200.000</td>
                <td className="py-2 text-right">¥320.000</td>
                <td className="py-2 text-right">€3.650</td>
              </tr>
              <tr>
                <td className="py-2 text-fg-60 font-sans">{txt("P75 (Senior Specialist)", "P75 (Senior Specialist)", "P75 (中堅・専門職層)")}</td>
                <td className="py-2 text-right">Rp 7.500.000</td>
                <td className="py-2 text-right">¥480.000</td>
                <td className="py-2 text-right">€5.200</td>
              </tr>
              <tr className="text-accent-300">
                <td className="py-2 font-sans">{txt("P90 (Top 10% Nasional)", "P90 (Top 10% National)", "P90 (上位10% 上位所得層)")}</td>
                <td className="py-2 text-right">Rp 15.000.000</td>
                <td className="py-2 text-right">¥750.000</td>
                <td className="py-2 text-right">€7.400</td>
              </tr>
              <tr>
                <td className="py-2 text-fg-60 font-sans">{txt("P95 (Top 5%)", "P95 (Top 5%)", "P95 (上位5% 富裕層)")}</td>
                <td className="py-2 text-right">Rp 25.000.000</td>
                <td className="py-2 text-right">¥950.000</td>
                <td className="py-2 text-right">€9.200</td>
              </tr>
              <tr className="text-emerald-300">
                <td className="py-2 font-sans">{txt("P99 (Top 1%)", "P99 (Top 1%)", "P99 (上位1% 最高所得層)")}</td>
                <td className="py-2 text-right">Rp 50.000.000+</td>
                <td className="py-2 text-right">¥1.500.000+</td>
                <td className="py-2 text-right">€15.000+</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-line space-y-3">
          <p className="text-[11px] text-fg-soft leading-relaxed">
            {txt(
              "Sumber data resmi: BPS Survei Angkatan Kerja Nasional (Sakernas) 2024–2026, Ministry of Health, Labour and Welfare (MHLW / 厚生労働省) 国民生活基礎調査, dan Statistisches Bundesamt (Destatis) Vollzeitverdienste. Dikalibrasi otomatis secara berkala.",
              "Official data sources: BPS National Labor Force Survey (Sakernas) 2024–2026, Japan MHLW Comprehensive Survey of Living Conditions, and German Federal Statistical Office (Destatis) Full-time Earnings. Automated periodic calibration.",
              "Amtliche Datenquellen: BPS Arbeitskräfteerhebung (Sakernas), Japan MHLW Statistik sowie Statistisches Bundesamt (Destatis) Vollzeitverdienste. Regelmäßig kalibriert.",
              "公的統計データ出典: インドネシア統計局 (BPS) 労働力調査 (Sakernas) 2024–2026、厚生労働省 国民生活基礎調査・賃金構造基本統計、ドイツ連邦統計局 (Destatis) フルタイム常用雇用者統計。定期的に自動更新。"
            )}
          </p>

          <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1.5">
                <span>🔍</span>
                <span>{txt("Metode & Mitigasi Distorsi Kurs", "Methodology & FX Distortion Mitigation", "Methodik & Wechselkurs-Bereinigung", "為替歪み補正と推計手法")}</span>
              </span>
              <span className="badge-brand text-[10px]">Data Pipeline</span>
            </div>

            <p className="text-xs text-fg-70 leading-relaxed">
              {txt(
                "Perbandingan antar negara dihitung dengan menggabungkan posisi persentil domestik di masing-masing negara dengan paritas daya beli riil (PPP). Konversi mata uang nominal semata dapat mendistorsi persepsi kesejahteraan karena perbedaan signifikan pada struktur pajak progresif dan harga sewa tempat tinggal.",
                "Cross-border comparisons integrate domestic percentile standing with real purchasing power parity (PPP). Nominal exchange conversion alone distorts living standard perceptions due to stark differences in progressive taxation and local rental costs.",
                "国境を越えた比較は、各国での国内所得パーセンタイル位置と実質購買力平価（PPP）を組み合わせて算出。単純な為替換算は、累進課税や都市別家賃相場の大きな差により、生活水準の認識に深刻な歪みを生じさせます。"
              )}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href="/metode"
                className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 text-[var(--accent)] hover:bg-[var(--accent-soft)]"
              >
                <span>📖</span>
                <span>{txt("Pelajari Metodologi Lengkap", "Read Full Methodology", "詳細な推計手法を見る")}</span>
                <span>→</span>
              </Link>

              <Link
                href="/contribute"
                className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 text-fg-70 hover:text-[var(--text)]"
              >
                <span>💬</span>
                <span>{txt("Bantu Laporkan Data Lokal", "Contribute Local Data", "現地データを報告する")}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
