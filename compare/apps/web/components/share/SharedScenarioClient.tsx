"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, type ScenarioResult } from "@bandinghidup/core";
import { saveScenario } from "@/lib/storage/scenarioStore";

interface SharedScenarioClientProps {
  token: string;
  result: ScenarioResult;
}

export function SharedScenarioClient({ token, result }: SharedScenarioClientProps) {
  const { locale } = useI18n();
  const router = useRouter();

  const txt = (idStr: string, enStr: string, jaStr: string) =>
    locale === "ja" ? jaStr : locale === "en" ? enStr : idStr;

  const currency = result.input.country === "DE" ? "EUR" : "JPY";
  const currencyLocale = locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US";
  const isPositive = result.monthlyBalance >= 0n;

  async function handleDuplicate() {
    // Save to user's IndexedDB and open wizard
    await saveScenario(result, `Imported — ${result.input.cityName}`);
    router.push("/wizard");
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-6">
      {/* Unlisted Banner */}
      <div className="rounded-xl p-4 flex items-center justify-between gap-3 bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs">
        <div className="flex items-center gap-2">
          <span>🔒</span>
          <span>
            {txt(
              "Kamu melihat skenario privat yang dibagikan secara rahasia via BandingHidup.",
              "You are viewing a private, unlisted scenario shared via BandingHidup.",
              "BandingHidupを通じて共有された限定公開シミュレーションを表示しています。"
            )}
          </span>
        </div>
        <span className="font-mono text-white/40">noindex</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-display font-bold text-white">
          {txt("Simulasi Biaya Hidup", "Cost of Living Simulation", "生活費シミュレーション")} — {result.input.cityName}
        </h1>
        <p className="text-white/50 text-sm">
          {result.input.pathway} • {result.input.cityName} ({result.input.country})
        </p>
      </div>

      {/* Monthly Cash Flow Card */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          💰 {txt("Cash Flow Bulanan", "Monthly Cash Flow", "月間キャッシュフロー")}
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1">
            <span className="text-white/60">{txt("Gaji Kotor (Brutto)", "Gross Salary (Brutto)", "額面総支給（Gross）")}</span>
            <span className="font-mono font-medium">{formatCurrency(result.income.grossMonthly, currency, currencyLocale)}</span>
          </div>

          <div className="flex justify-between py-1">
            <span className="text-white/60">{txt("Gaji Bersih / Net Take-Home", "Net Salary (Take-Home)", "手取り月給（Netto）")}</span>
            <span className="font-mono font-semibold text-brand-400">{formatCurrency(result.income.netMonthly, currency, currencyLocale)}</span>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex justify-between py-0.5 text-white/50">
            <span>{txt("Sewa / Tempat Tinggal", "Housing & Rent", "家賃・住まい")}</span>
            <span className="font-mono">- {formatCurrency(result.monthlyExpenses.housingRent, currency, currencyLocale)}</span>
          </div>

          <div className="flex justify-between py-0.5 text-white/50">
            <span>{txt("Makanan & Minuman", "Food & Groceries", "食費・飲食")}</span>
            <span className="font-mono">- {formatCurrency(result.monthlyExpenses.food, currency, currencyLocale)}</span>
          </div>

          <div className="flex justify-between py-0.5 text-white/50">
            <span>{txt("Transportasi & Utilitas", "Transport & Utilities", "交通費・光熱通信費")}</span>
            <span className="font-mono">- {formatCurrency(result.monthlyExpenses.transport + result.monthlyExpenses.utilities, currency, currencyLocale)}</span>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex items-center justify-between py-2">
            <span className="font-semibold text-white">{txt("Sisa Uang Bulanan", "Monthly Balance", "月間手残り・貯蓄額")}</span>
            <span className={`text-xl font-bold font-mono ${isPositive ? "text-brand-400" : "text-red-400"}`}>
              {isPositive ? "+" : "- "}
              {formatCurrency(result.monthlyBalance < 0n ? result.monthlyBalance * -1n : result.monthlyBalance, currency, currencyLocale)}
            </span>
          </div>
        </div>
      </div>

      {/* Upfront Card */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
          📦 {txt("Biaya Pindah (Satu Kali)", "Move-In Costs (One-Time)", "初期移住費用（一回限り）")}
        </h3>
        <div className="flex items-center justify-between font-mono">
          <span className="text-sm text-white/70">{txt("Total Biaya Awal", "Total Upfront", "初期費用合計")}</span>
          <span className="text-lg font-bold text-orange-300">
            {formatCurrency(result.upfrontRelocationTotal, currency, currencyLocale)}
          </span>
        </div>
      </div>

      {/* Action CTA */}
      <div className="space-y-3">
        <button
          onClick={handleDuplicate}
          className="btn-primary w-full py-4 text-base font-semibold"
        >
          📥 {txt("Duplikasi ke Browser Saya & Edit", "Duplicate to My Browser & Edit", "ブラウザに複製して編集")}
        </button>

        <a href="/wizard" className="btn-secondary w-full py-3 text-center block text-sm">
          ✨ {txt("Buat Simulasiku Sendiri", "Create My Own Simulation", "自分のシミュレーションを作成")}
        </a>
      </div>
    </div>
  );
}
