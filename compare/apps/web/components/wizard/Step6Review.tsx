"use client";

import { useI18n } from "@/lib/i18n";
import { buildExpenseBasket, formatCurrency } from "@bandinghidup/core";
import type { WizardState, WizardAction } from "./wizardState";

interface Step6Props {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  onNext: () => void;
  onBack: () => void;
}

export function Step6Review({ state, dispatch, onNext, onBack }: Step6Props) {
  const { locale } = useI18n();
  const txt = (idStr: string, enStr: string, jaStr: string) =>
    locale === "ja" ? jaStr : locale === "en" ? enStr : idStr;

  const currency = state.country === "DE" ? "EUR" : "JPY";
  const currencyLocale = locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US";
  const basket = buildExpenseBasket(state.country ?? "DE", state.lifestyleProfile, state.basketOverrides);

  const items = [
    { key: "quickMeals" as const, item: basket.items.quickMeals, label: txt("Makan cepat", "Quick Meals", "軽食・ファストフード"), example: basket.country === "DE" ? "Döner / Bäckerei" : "Udon / Gyudon" },
    { key: "casualDining" as const, item: basket.items.casualDining, label: txt("Makan santai", "Casual Dining", "一般外食"), example: basket.country === "DE" ? "Mensa / Restaurant" : "Saizeriya / Curry" },
    { key: "socialOutings" as const, item: basket.items.socialOutings, label: txt("Nongkrong", "Social Outings", "飲み会・カフェ・交際費"), example: basket.country === "DE" ? "Biergarten" : "Izakaya" },
    { key: "groceries" as const, item: basket.items.groceries, label: txt("Belanja bahan makanan", "Groceries", "スーパー食料品自炊"), example: basket.country === "DE" ? "Aldi / Lidl" : "スーパーマーケット" },
    { key: "transport" as const, item: basket.items.transport, label: txt("Transportasi", "Transportation", "交通費・定期代"), example: basket.country === "DE" ? "Deutschland-Ticket" : "通勤定期券" },
    { key: "utilities" as const, item: basket.items.utilities, label: txt("Internet & Ponsel", "Internet & Phone", "通信費・スマホ・Wi-Fi"), example: basket.country === "DE" ? "SIM + DSL" : "格安SIM" },
    { key: "miscPersonal" as const, item: basket.items.miscPersonal, label: txt("Kebutuhan pribadi", "Personal Misc.", "日用品・消耗品・雑費"), example: txt("Perawatan diri, dll.", "Personal care, etc.", "日用品・消耗品・美容等") },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-white">
          {txt("Review & Override", "Review & Override", "生活費の詳細確認・手動調整")}
        </h2>
        <p className="text-white/50">
          {txt(
            "Semua nilai bisa kamu sesuaikan. Perubahan langsung terlihat di hasil.",
            "All values are editable. Changes reflect immediately in results.",
            "各項目の単価と月間頻度を自由に微調整できます。結果に即座に反映されます。"
          )}
        </p>
      </div>

      {/* Line Items Table */}
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr,auto,auto,auto] gap-3 text-xs text-white/40 px-1 pb-1 border-b border-white/10">
          <span>{txt("Kategori", "Category", "項目")}</span>
          <span className="text-right">{txt("Harga/kali", "Unit Cost", "単価")}</span>
          <span className="text-right">{txt("Frekuensi", "Times/mo", "月間頻度")}</span>
          <span className="text-right">{txt("Total/bulan", "Monthly", "月額小計")}</span>
        </div>

        {items.map(({ key, item, label, example }) => (
          <div
            key={key}
            className="grid grid-cols-[1fr,auto,auto,auto] gap-3 items-center py-2 px-1 rounded-lg transition-all"
            style={{ background: item.isOverridden ? "rgba(40, 144, 109, 0.05)" : "transparent" }}
          >
            <div>
              <div className="text-sm text-white font-medium">{label}</div>
              <div className="text-xs text-white/30">{example}</div>
            </div>

            {/* Unit cost editable */}
            <div className="relative w-24">
              <input
                id={`override-unit-${key}`}
                type="number"
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-right text-sm text-white focus:border-brand-500 focus:outline-none"
                value={Number(item.unitCostMinorUnits) / (currency === "EUR" ? 100 : 1)}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value);
                  if (isNaN(raw) || raw < 0) return;
                  const minor = currency === "EUR" ? BigInt(Math.round(raw * 100)) : BigInt(Math.round(raw));
                  dispatch({ type: "SET_BASKET_OVERRIDE", key, unitCost: minor });
                }}
              />
            </div>

            {/* Frequency editable */}
            <div className="relative w-16">
              <input
                id={`override-freq-${key}`}
                type="number"
                min="1"
                max="60"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-right text-sm text-white focus:border-brand-500 focus:outline-none"
                value={item.monthlyFrequency}
                onChange={(e) => {
                  const freq = parseInt(e.target.value);
                  if (isNaN(freq) || freq < 1) return;
                  dispatch({ type: "SET_BASKET_OVERRIDE", key, frequency: freq });
                }}
              />
            </div>

            {/* Monthly total */}
            <div className={`text-sm font-medium text-right ${item.isOverridden ? "text-brand-400" : "text-white/70"}`}>
              {formatCurrency(item.monthlyTotalMinorUnits, currency, currencyLocale)}
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-sm font-semibold text-white">
            {txt("Total Pengeluaran Gaya Hidup", "Lifestyle Expenses Total", "月間生活費合計")}
          </span>
          <span className="text-brand-400 font-bold">
            {formatCurrency(basket.monthlyGrandTotal, currency, currencyLocale)}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button id="wizard-step6-back" onClick={onBack} className="btn-secondary flex-1 py-3">← {txt("Kembali", "Back", "戻る")}</button>
        <button id="wizard-step6-next" onClick={onNext} className="btn-primary flex-[2] py-3">
          {txt("Lihat Hasil →", "See Results →", "診断結果を見る →")}
        </button>
      </div>
    </div>
  );
}
