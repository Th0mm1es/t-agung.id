"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { formatCurrency } from "@bandinghidup/core";
import { saveScenario } from "@/lib/storage/scenarioStore";
import { PriceCorrectionModal } from "@/components/common/PriceCorrectionModal";
import { ShareResultCardModal } from "@/components/common/ShareResultCardModal";
import { SubscribeOptIn } from "@/components/common/SubscribeOptIn";
import { CommentsSection } from "@/components/common/CommentsSection";
import type { ScenarioResult, DiagnosticResult } from "@bandinghidup/core";
import DE_INLINE from "@/locales/de_inlines.json";

interface Step7Props {
  result: ScenarioResult;
  referenceResult?: ScenarioResult | null;
  onBack: () => void;
  onReset: () => void;
}

function DiagnosticCard({ diag }: { diag: DiagnosticResult }) {
  const colors = {
    red:   { bg: "rgba(239, 68, 68, 0.08)",    border: "rgba(239, 68, 68, 0.3)",    text: "#ef4444", dot: "🔴" },
    amber: { bg: "rgba(249, 134, 7, 0.08)",    border: "rgba(249, 134, 7, 0.3)",    text: "var(--highlight)", dot: "🟡" },
    green: { bg: "var(--accent-soft)",   border: "var(--border-strong)",   text: "var(--accent)", dot: "🟢" },
  };
  const c = colors[diag.level];

  return (
    <div className="rounded-xl p-4 space-y-2" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex items-center gap-2">
        <span className="text-sm">{c.dot}</span>
        <span className="font-semibold text-sm" style={{ color: c.text }}>{diag.title}</span>
      </div>
      <p className="text-sm text-fg-60 leading-relaxed">{diag.message}</p>
      <p className="text-xs text-fg-soft leading-relaxed">💡 {diag.suggestion}</p>
    </div>
  );
}

export function Step7Results({ result, referenceResult, onBack, onReset }: Step7Props) {
  const { locale } = useI18n();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeCorrection, setActiveCorrection] = useState<{
    categoryCode: string;
    categoryLabel: string;
    currentValueMajor: number;
  } | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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

  const currency = result.input.country === "DE" ? "EUR" : "JPY";
  const currencyLocale = locale === "de" ? "de-DE" : locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US";
  const isPositive = result.monthlyBalance >= 0n;

  const refCurrency = referenceResult ? (referenceResult.input.country === "DE" ? "EUR" : referenceResult.input.country === "JP" ? "JPY" : "IDR") : "IDR";

  const toMajor = (minorUnits: bigint, cur: string = currency) => {
    const divisor = cur === "EUR" ? 100 : 1;
    return Number(minorUnits) / divisor;
  };

  async function handleSave() {
    setSaving(true);
    try {
      await saveScenario(result);
      setSaved(true);
    } catch (e) {
      console.error("Failed to save scenario:", e);
    } finally {
      setSaving(false);
    }
  }

  function handleCompare() {
    router.push(`/compare?baseId=${result.input.id}`);
  }

  const pathwayNames: Record<string, Record<string, string>> = {
    ausbildung: {
      id: "Ausbildung (Magang Vokasi Jerman)",
      en: "Ausbildung (German Vocational Training)",
      ja: "アウスビルドゥング（ドイツ職業訓練）",
    },
    technical_intern: {
      id: "Kenshusei / Technical Intern (Magang Jepang)",
      en: "Kenshusei / Technical Intern (Japan)",
      ja: "技能実習生（日本）",
    },
    student: {
      id: "Mahasiswa / Pelajar",
      en: "Student",
      ja: "留学生・学生",
    },
    fresh_grad: {
      id: "Fresh Graduate / Pekerja Baru",
      en: "Fresh Graduate",
      ja: "新卒・エントリーレベル",
    },
    custom: {
      id: "Kustom / Lainnya",
      en: "Custom / Other",
      ja: "カスタム",
    },
  };

  const currentPathwayName =
    pathwayNames[result.input.pathway]?.[locale] ?? result.input.pathway;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="badge-brand text-xs">⚖️ {txt("Perbandingan Anggaran Penuh", "Full Budget Simulation", "総合予算シミュレーション比較")}</span>
          <span className="text-xs text-fg-soft font-mono">{txt("Kota #1 sebagai Acuan", "City #1 as Baseline", "都市#1を基準都市として設定")}</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-[var(--text)]">
          {txt("Hasil Perhitungan & Estimasi Anggaran Penuh", "Full Budget Simulation Results", "総合予算シミュレーション結果")}
        </h2>
        <p className="text-fg-muted text-sm">
          {referenceResult ? (
            <span>
              {txt("Perbandingan: ", "Comparison: ", "都市比較：")}
              <strong className="text-[var(--accent)]">#1 {referenceResult.input.cityName} ({referenceResult.input.country})</strong> vs{" "}
              <strong className="text-accent-300">#2 {result.input.cityName} ({result.input.country})</strong> • {currentPathwayName}
            </span>
          ) : (
            <span>{result.input.cityName} • {currentPathwayName}</span>
          )}
        </p>
      </div>

      {/* ── Dual-City Side-by-Side Comparison Card ─────────────────────── */}
      {referenceResult && (
        <div className="glass-card p-5 space-y-4 border border-line-strong bg-gradient-to-br from-[var(--accent)]/5 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-2">
              <span>🏛️</span>
              <span>{txt("Ringkasan Perbandingan: Kota #1 (Acuan) vs Kota #2 (Tujuan)", "Comparison Summary: City #1 (Baseline) vs City #2 (Destination)", "比較サマリー：都市#1（基準）vs 都市#2（移住先）")}</span>
            </h3>
            <span className="badge-accent text-[10px]">Side-by-Side</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Reference (#1) */}
            <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge-brand text-[10px] font-bold">{txt("#1 Kota Acuan", "#1 Baseline City", "#1 基準都市")}</span>
                <span className="text-xs font-mono font-bold text-[var(--text)]">{referenceResult.input.cityName} ({referenceResult.input.country})</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-fg-60">{txt("Gaji Kotor Bulanan:", "Gross Monthly Salary:", "月額総支給（額面）:")}</span>
                  <span className="font-mono text-[var(--text)] font-semibold whitespace-nowrap tabular-nums">
                    {formatCurrency(referenceResult.income.grossMonthly, refCurrency, currencyLocale)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-red-400">
                  <span>{txt("Deduksi Pajak & Asuransi:", "Tax & Social Deductions:", "税金・社会保険料控除:")}</span>
                  <span className="font-mono whitespace-nowrap tabular-nums">
                    - {formatCurrency(referenceResult.income.totalDeductions, refCurrency, currencyLocale)}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold text-[var(--accent)]">
                  <span>{txt("Gaji Bersih (Net):", "Net Salary (Take-Home):", "手取り月給（Net）:")}</span>
                  <span className="font-mono whitespace-nowrap tabular-nums">
                    {formatCurrency(referenceResult.income.netMonthly, refCurrency, currencyLocale)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-fg-70 pt-1 border-t border-line">
                  <span>{txt("Sewa Tempat Tinggal:", "Housing Rent:", "家賃・住居費:")}</span>
                  <span className="font-mono whitespace-nowrap tabular-nums">
                    - {formatCurrency(referenceResult.monthlyExpenses.housingRent, refCurrency, currencyLocale)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-fg-70">
                  <span>{txt("Konsumsi & Makanan:", "Living & Food Costs:", "食費・生活消費支出:")}</span>
                  <span className="font-mono whitespace-nowrap tabular-nums">
                    - {formatCurrency(referenceResult.monthlyExpenses.food + referenceResult.monthlyExpenses.utilities + referenceResult.monthlyExpenses.transport, refCurrency, currencyLocale)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-line font-bold text-sm">
                  <span className="text-fg-90">{txt("Sisa Tabungan Bulanan:", "Net Monthly Savings:", "月間手残り・貯蓄額:")}</span>
                  <span className={`font-mono whitespace-nowrap tabular-nums ${referenceResult.monthlyBalance >= 0n ? "text-emerald-400" : "text-red-400"}`}>
                    {referenceResult.monthlyBalance >= 0n ? "+" : "-"}
                    {formatCurrency(referenceResult.monthlyBalance < 0n ? referenceResult.monthlyBalance * -1n : referenceResult.monthlyBalance, refCurrency, currencyLocale)}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Destination (#2) */}
            <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge-accent text-[10px] font-bold">{txt("#2 Kota Tujuan", "#2 Destination City", "#2 移住先都市")}</span>
                <span className="text-xs font-mono font-bold text-[var(--text)]">{result.input.cityName} ({result.input.country})</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-fg-60">{txt("Gaji Kotor Bulanan:", "Gross Monthly Salary:", "月額総支給（額面）:")}</span>
                  <span className="font-mono text-[var(--text)] font-semibold whitespace-nowrap tabular-nums">
                    {formatCurrency(result.income.grossMonthly, currency, currencyLocale)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-red-400">
                  <span>{txt("Deduksi Pajak & Asuransi:", "Tax & Social Deductions:", "税金・社会保険料控除:")}</span>
                  <span className="font-mono whitespace-nowrap tabular-nums">
                    - {formatCurrency(result.income.totalDeductions, currency, currencyLocale)}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold text-accent-300">
                  <span>{txt("Gaji Bersih (Net):", "Net Salary (Take-Home):", "手取り月給（Net）:")}</span>
                  <span className="font-mono whitespace-nowrap tabular-nums">
                    {formatCurrency(result.income.netMonthly, currency, currencyLocale)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-fg-70 pt-1 border-t border-line">
                  <span>{txt("Sewa Tempat Tinggal:", "Housing Rent:", "家賃・住居費:")}</span>
                  <span className="font-mono whitespace-nowrap tabular-nums">
                    - {formatCurrency(result.monthlyExpenses.housingRent, currency, currencyLocale)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-fg-70">
                  <span>{txt("Konsumsi & Makanan:", "Living & Food Costs:", "食費・生活消費支出:")}</span>
                  <span className="font-mono whitespace-nowrap tabular-nums">
                    - {formatCurrency(result.monthlyExpenses.food + result.monthlyExpenses.utilities + result.monthlyExpenses.transport, currency, currencyLocale)}
                  </span>
                </div>
                {result.input.familyStatus === "married_children" && (result.input.numChildren ?? 0) > 0 && (
                  <div className="flex justify-between items-center text-emerald-400 font-medium">
                    <span>
                      {result.input.country === "DE"
                        ? txt(
                            `Tunjangan Anak (Kindergeld ${result.input.numChildren}x €259):`,
                            `Child Benefit (Kindergeld ${result.input.numChildren}x €259):`,
                            `Kindergeld (${result.input.numChildren}x €259):`,
                            `Kindergeld（ドイツ子供手当 ${result.input.numChildren}x €259）:`
                          )
                        : txt(
                            `Tunjangan Anak Jepang (Jido Teate ${result.input.numChildren}x ¥15.000):`,
                            `Child Allowance (Jido Teate ${result.input.numChildren}x ¥15,000):`,
                            `Kindergeld Japan (Jido Teate ${result.input.numChildren}x ¥15.000):`,
                            `児童手当（${result.input.numChildren}x ¥15,000）:`
                          )}
                    </span>
                    <span className="font-mono whitespace-nowrap tabular-nums font-semibold">
                      + {formatCurrency(
                        result.input.country === "DE"
                          ? BigInt((result.input.numChildren || 1) * 25900) // 2026: €259/child (was €255)
                          : BigInt((result.input.numChildren || 1) * 15000),
                        currency,
                        currencyLocale
                      )}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-line font-bold text-sm">
                  <span className="text-fg-90">{txt("Sisa Tabungan Bulanan:", "Net Monthly Savings:", "月間手残り・貯蓄額:")}</span>
                  <span className={`font-mono whitespace-nowrap tabular-nums ${result.monthlyBalance >= 0n ? "text-emerald-400" : "text-red-400"}`}>
                    {result.monthlyBalance >= 0n ? "+" : "−"}
                    {formatCurrency(result.monthlyBalance < 0n ? result.monthlyBalance * -1n : result.monthlyBalance, currency, currencyLocale)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overall severity banner */}
      {result.overallSeverity === "red" && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.4)" }}>
          <span>🔴</span>
          <span className="text-sm font-semibold text-red-400">
            {txt(
              "Skenario ini perlu perhatian serius: Pengeluaran melebihi pemasukan atau tabungan darurat tipis.",
              "This scenario needs serious attention: Expenses exceed income or emergency runway is short.",
              "注意が必要なシナリオ：支出が収入を上回っているか、緊急予備資金が不足しています。"
            )}
          </span>
        </div>
      )}

      {/* 🍔 Big Mac Index & Purchasing Power Card */}
      {result.bigMacIndex && (
        <div className="glass-card p-5 space-y-4 border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍔</span>
              <h3 className="text-sm font-semibold text-amber-300 uppercase tracking-wider">
                {txt("Big Mac Index & Daya Beli Riil", "Big Mac Index & Real Purchasing Power", "ビッグマック指数＆実質購買力")}
              </h3>
            </div>
            <button
              onClick={() =>
                setActiveCorrection({
                  categoryCode: "big_mac",
                  categoryLabel: "Big Mac Index Benchmark",
                  currentValueMajor: result.bigMacIndex.bigMacPriceMajor,
                })
              }
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              ✏️ {txt("Koreksi Harga", "Edit Price", "価格を修正")}
            </button>
          </div>

          <p className="text-xs text-fg-muted">
            {txt(
              `Standar perbandingan daya beli internasional (harga 1 Big Mac lokal: ${currency === "EUR" ? "€" : "¥"}${result.bigMacIndex.bigMacPriceMajor.toLocaleString()}).`,
              `International purchasing power parity benchmark (local 1 Big Mac: ${currency === "EUR" ? "€" : "¥"}${result.bigMacIndex.bigMacPriceMajor.toLocaleString()}).`,
              `Internationaler Kaufkraftparitäts-Benchmark (lokaler Big Mac: ${currency === "EUR" ? "€" : "¥"}${result.bigMacIndex.bigMacPriceMajor.toLocaleString()}).`,
              `購買力平価（PPP）の国際比較指標（現地ビッグマック1個：${currency === "EUR" ? "€" : "¥"}${result.bigMacIndex.bigMacPriceMajor.toLocaleString()}）`
            )}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-panel-2 border border-line">
              <p className="text-xs text-fg-soft mb-1">{txt("Sewa Bulanan", "Monthly Rent", "月額家賃")}</p>
              <p className="text-lg font-bold font-mono text-amber-400">{result.bigMacIndex.rentInBigMacs}</p>
              <p className="text-[10px] text-fg-soft">{txt("porsi Big Mac", "Big Macs", "個分")}</p>
            </div>

            <div className="p-3 rounded-xl bg-panel-2 border border-line">
              <p className="text-xs text-fg-soft mb-1">{txt("Gaji Bersih", "Net Salary", "手取り月給")}</p>
              <p className="text-lg font-bold font-mono text-[var(--accent)]">{result.bigMacIndex.netSalaryInBigMacs}</p>
              <p className="text-[10px] text-fg-soft">{txt("porsi Big Mac", "Big Macs", "個分")}</p>
            </div>

            <div className="p-3 rounded-xl bg-panel-2 border border-line">
              <p className="text-xs text-fg-soft mb-1">{txt("Sisa Tabungan", "Net Savings", "月間貯蓄額")}</p>
              <p className={`text-lg font-bold font-mono ${result.bigMacIndex.monthlySavingsInBigMacs >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {result.bigMacIndex.monthlySavingsInBigMacs >= 0 ? "+" : ""}{result.bigMacIndex.monthlySavingsInBigMacs}
              </p>
              <p className="text-[10px] text-fg-soft">{txt("porsi Big Mac", "Big Macs", "個分")}</p>
            </div>

            <div className="p-3 rounded-xl bg-panel-2 border border-line">
              <p className="text-xs text-fg-soft mb-1">{txt("Waktu Kerja / Burger", "Work Time / Burger", "労働時間 / バーガー1個")}</p>
              <p className="text-lg font-bold font-mono text-cyan-300">~{result.bigMacIndex.workMinutesPerBigMac}</p>
              <p className="text-[10px] text-fg-soft">{txt("menit kerja", "working mins", "分間の労働")}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Monthly Cash Flow Card for Target ──────────────────────── */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-fg-60 uppercase tracking-wider">
          {txt(`💰 Rincian Arus Kas di ${result.input.cityName}`, `💰 Monthly Cash Flow in ${result.input.cityName}`, `💰 Monatlicher Cashflow in ${result.input.cityName}`, `💰 ${result.input.cityName} での月間キャッシュフロー明細`)}
        </h3>

        <div className="space-y-2">
          {[
            {
              label: txt("Gaji Kotor (Brutto / Gakumen)", "Gross Salary (Brutto)", "額面総支給（Gross）"),
              value: result.income.grossMonthly,
              color: "text-[var(--text)]",
            },
            {
              label: txt(`Potongan Pajak & Asuransi (${Math.round(result.income.effectiveDeductionRate * 100)}%)`, `Tax & Social Deductions (${Math.round(result.income.effectiveDeductionRate * 100)}%)`, `Steuern & Sozialabgaben (${Math.round(result.income.effectiveDeductionRate * 100)}%)`, `税金・社会保険料控除 (${Math.round(result.income.effectiveDeductionRate * 100)}%)`),
              value: -result.income.totalDeductions,
              color: "text-red-400",
            },
            {
              label: txt("Gaji Bersih / Net Take-Home (Netto)", "Net Salary (Take-Home / Netto)", "手取り月給（Netto）"),
              value: result.income.netMonthly,
              color: "text-[var(--accent)] font-semibold",
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-1">
              <span className="text-sm text-fg-60">{label}</span>
              <span className={`text-sm font-mono ${color}`}>
                {value < 0n
                  ? `- ${formatCurrency(value * -1n, currency, currencyLocale)}`
                  : formatCurrency(value, currency, currencyLocale)}
              </span>
            </div>
          ))}

          <div className="h-px bg-panel-2" />

          {[
            {
              code: "housing",
              label: txt("Sewa / Tempat Tinggal", "Housing / Rent", "家賃・住まい"),
              value: result.monthlyExpenses.housingRent,
            },
            {
              code: "food",
              label: txt("Makanan & Minuman", "Food & Groceries", "食費・日常飲食"),
              value: result.monthlyExpenses.food,
            },
            {
              code: "transport",
              label: txt("Transportasi", "Transportation", "交通費・通勤定期"),
              value: result.monthlyExpenses.transport,
            },
            {
              code: "utilities",
              label: txt("Listrik, Air & Internet", "Utilities & Internet", "水道光熱費＆通信"),
              value: result.monthlyExpenses.utilities,
            },
            {
              code: "lifestyle",
              label: txt("Gaya Hidup & Hiburan", "Lifestyle & Leisure", "趣味・娯楽・交際費"),
              value: result.monthlyExpenses.lifestyle,
            },
          ].map(({ code, label, value }) => (
            <div key={label} className="flex items-center justify-between py-0.5 group">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-fg-muted">{label}</span>
                <button
                  onClick={() =>
                    setActiveCorrection({
                      categoryCode: code,
                      categoryLabel: label,
                      currentValueMajor: toMajor(value),
                    })
                  }
                  title={txt("Koreksi harga ini", "Correct this price", "この価格を修正")}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-fg-soft hover:text-[var(--accent)]"
                >
                  ✏️
                </button>
              </div>
              <span className="text-sm font-mono text-fg-60">- {formatCurrency(value, currency, currencyLocale)}</span>
            </div>
          ))}

          <div className="h-px bg-panel-2" />

          <div className="flex items-center justify-between py-2">
            <span className="font-semibold text-[var(--text)]">
              {txt("Sisa Uang Bulanan", "Monthly Balance", "月間余剰金・貯蓄可能額")}
            </span>
            <span className={`text-xl font-bold font-mono ${isPositive ? "text-[var(--accent)]" : "text-red-400"}`}>
              {isPositive ? "+" : "- "}
              {formatCurrency(result.monthlyBalance < 0n ? result.monthlyBalance * -1n : result.monthlyBalance, currency, currencyLocale)}
            </span>
          </div>
        </div>
      </div>

      {/* ── Upfront Relocation Card ─────────────────────────────────── */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-fg-60 uppercase tracking-wider">
          {txt("📦 Biaya Awal / Pindah (Satu Kali)", "📦 Relocation Costs (One-Time)", "📦 初期費用・渡航移住コスト（一回限り）")}
        </h3>

        <div className="space-y-2 text-sm">
          {[
            {
              label: txt(
                `Deposit (${result.input.relocationInput?.depositMonths ?? (result.input.country === "DE" ? 3 : 1)} bln)`,
                `Deposit (${result.input.relocationInput?.depositMonths ?? (result.input.country === "DE" ? 3 : 1)} mo)`,
                `Kaution (${result.input.relocationInput?.depositMonths ?? (result.input.country === "DE" ? 3 : 1)} Mon.)`,
                `敷金・デポジット (${result.input.relocationInput?.depositMonths ?? (result.input.country === "DE" ? 3 : 1)}ヶ月分)`
              ),
              value: result.upfrontDepositAmount,
            },
            ...(result.upfrontKeyMoneyAmount > 0n
              ? [{ label: txt("Uang Kunci (Reikin)", "Key Money (Reikin)", "礼金（敷引）"), value: result.upfrontKeyMoneyAmount }]
              : []),
            ...(result.upfrontAgencyFeeAmount > 0n
              ? [{ label: txt("Biaya Agen", "Agency Fee", "仲介手数料"), value: result.upfrontAgencyFeeAmount }]
              : []),
            {
              label: txt("Setup Awal & Darurat", "Setup & Cushion", "生活立ち上げ準備金・予備費"),
              value: result.upfrontSetupCushionAmount,
            },
            {
              label: txt("Tiket Pesawat & Visa", "Travel & Visa", "航空券・ビザ申請費用"),
              value: result.upfrontTravelAmount,
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-fg-muted">{label}</span>
              <span className="font-mono text-fg-70">{formatCurrency(value, currency, currencyLocale)}</span>
            </div>
          ))}

          <div className="h-px bg-panel-2" />

          <div className="flex items-center justify-between py-1">
            <span className="font-semibold text-[var(--text)]">{txt("Total Biaya Awal", "Total Upfront", "初期移住費用合計")}</span>
            <span className="text-lg font-bold font-mono text-accent-400">
              {formatCurrency(result.upfrontRelocationTotal, currency, currencyLocale)}
            </span>
          </div>

          {/* Advisor Runway & Capital Diagnostic */}
          {result.input.availableSavingsMinorUnits > 0n && (
            <div className="pt-2 border-t border-line space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-fg-60">{txt("Modal Tabungan yang Dimiliki:", "Available Savings:", "保有自己資金・貯蓄:")}</span>
                <span className="font-mono font-semibold text-[var(--text)]">
                  {formatCurrency(result.input.availableSavingsMinorUnits, currency, currencyLocale)}
                </span>
              </div>
              {result.input.availableSavingsMinorUnits < result.upfrontRelocationTotal ? (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>{txt("Defisit Modal Awal:", "Initial Capital Deficit:", "初期資金不足額:")} -{formatCurrency(result.upfrontRelocationTotal - result.input.availableSavingsMinorUnits, currency, currencyLocale)}</span>
                  </div>
                  <p className="text-[11px] text-fg-70">
                    {txt(
                      "Tabungan Anda belum mencukupi total biaya awal pindah. Disarankan negosiasi akomodasi asrama perusahaan tanpa deposit atau program talangan LPK.",
                      "Available savings are insufficient for full move-in costs. Consider company dormitory options or sponsor assistance.",
                      "初期費用に対して自己資金が不足しています。敷金不要の社員寮・社宅の利用や、渡航資金支援制度の活用を検討してください。"
                    )}
                  </p>
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center justify-between">
                  <span>{txt("✓ Modal awal pindah terpenuhi", "✓ Upfront relocation costs covered", "✓ 初期移住費用は十分にカバーされています")}</span>
                  <span className="font-mono font-semibold">
                    {txt("Cadangan:", "Reserve:", "余剰予備資金:")} +{formatCurrency(result.input.availableSavingsMinorUnits - result.upfrontRelocationTotal, currency, currencyLocale)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Diagnostics Cards ────────────────────────────────────────── */}
      {result.diagnostics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-fg-60 uppercase tracking-wider">
            {txt("🔍 Analisis & Catatan Penting", "🔍 Diagnostics & Insights", "🔍 診断レポート＆留意事項")}
          </h3>
          <div className="space-y-2">
            {result.diagnostics.map((diag) => (
              <DiagnosticCard key={diag.code} diag={diag} />
            ))}
          </div>
        </div>
      )}

      {/* ── Action Buttons ──────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={() => setIsShareModalOpen(true)}
          className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 shadow-sm font-semibold"
        >
          <span>✨</span>
          <span>{txt("Salin / Bagikan Kartu Hasil (PNG 1080×1350)", "Share Result Card (PNG 1080×1350)", "結果カードを画像共有 (PNG 1080×1350)")}</span>
        </button>

        <button
          onClick={handleCompare}
          className="btn-secondary w-full py-3 text-sm flex items-center justify-center gap-2 border-line-strong text-[var(--accent)] hover:bg-[var(--accent-soft)]"
        >
          <span>⚖️</span>
          <span>{txt("Bandingkan Berdampingan di Menu Magang & Fresh Grad", "Compare in Magang & Fresh Grad Menu", "実習生・新卒キャリア比較で並べて確認")}</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`btn-secondary py-3 text-sm flex items-center justify-center gap-2 ${saved ? "text-[var(--accent)] border-line-strong" : ""}`}
          >
            <span>{saved ? "✓" : "💾"}</span>
            <span>{saved ? txt("Tersimpan", "Saved", "保存済み") : txt("Simpan Hasil", "Save Result", "結果を保存")}</span>
          </button>

          <button
            onClick={onReset}
            className="btn-secondary py-3 text-sm text-fg-muted hover:text-[var(--text)]"
          >
            ↺ {txt("Mulai Ulang", "Start Over", "最初からやり直す")}
          </button>
        </div>
      </div>

      {/* Subscribe Opt-In */}
      <SubscribeOptIn cityName={result.input.cityName} countryCode={result.input.country} />

      {/* Route-Specific Discussions (Wizard) */}
      <CommentsSection threadId="wizard" />

      {/* Share Card Modal (1080x1350 PNG) */}
      <ShareResultCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={{
          title: txt(`Simulasi Hidup di ${result.input.cityName}`, `Living Simulation in ${result.input.cityName}`, `Lebenshaltungssimulation für ${result.input.cityName}`, `${result.input.cityName}の生活費シミュレーション`),
          targetCity: result.input.cityName,
          targetCountry: result.input.country,
          grossSalaryText: formatCurrency(result.income.grossMonthly, currency, currencyLocale),
          netSalaryText: formatCurrency(result.income.netMonthly, currency, currencyLocale),
          expensesText: formatCurrency(result.monthlyExpenses.housingRent + result.monthlyExpenses.food + result.monthlyExpenses.utilities + result.monthlyExpenses.transport, currency, currencyLocale),
          savingsText: `${result.monthlyBalance >= 0n ? "+" : "−"}${formatCurrency(result.monthlyBalance < 0n ? result.monthlyBalance * -1n : result.monthlyBalance, currency, currencyLocale)}`,
          foodIndexText: toMajor(result.monthlyBalance, currency) > 0
            ? txt("Surplus Keuangan Sehat", "Healthy Financial Surplus", "Solider finanzieller Überschuss", "黒字（健全な家計）")
            : txt("Perlu Penyesuaian Anggaran", "Budget Adjustment Needed", "Budgetanpassung erforderlich", "予算調整が必要"),
          badgeText: `${txt("Tabungan Bersih", "Net Savings", "Netto-Ersparnis", "実質手残り")}: ${formatCurrency(result.monthlyBalance, currency, currencyLocale)} ${txt("/ bln", "/ mo", "/ Monat", "/ 月")}`,
          periodicityText: txt("Wizard 7-Langkah · Per Bulan", "7-Step Budget · Monthly", "7-Schritte-Planer · Monatlich", "7段階プランナー · 月額"),
        }}
      />

      {/* Price Correction Modal */}
      {activeCorrection && (
        <PriceCorrectionModal
          isOpen={!!activeCorrection}
          onClose={() => setActiveCorrection(null)}
          cityId={result.input.cityId}
          cityName={result.input.cityName}
          categoryCode={activeCorrection.categoryCode}
          categoryLabel={activeCorrection.categoryLabel}
          currentValueMajor={activeCorrection.currentValueMajor}
          currencyCode={currency}
        />
      )}
    </div>
  );
}
