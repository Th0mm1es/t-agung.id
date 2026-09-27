"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { formatCurrency, DE_HOUSING_BENCHMARKS, JP_HOUSING_BENCHMARKS } from "@bandinghidup/core";
import type { HousingType } from "@bandinghidup/core";
import type { WizardState, WizardAction } from "./wizardState";

interface Step4Props {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  onNext: () => void;
  onBack: () => void;
}

const HOUSING_TYPES: { type: HousingType; iconDE: string; iconJP: string; labelIdDE: string; labelEnDE: string; labelJaDE: string; labelIdJP: string; labelEnJP: string; labelJaJP: string }[] = [
  { type: "shared_room",  iconDE: "🏠", iconJP: "🏠", labelIdDE: "WG-Zimmer (Kamar Bersama)", labelEnDE: "WG Room (Shared Flat)", labelJaDE: "WGルーム (シェアフラット)", labelIdJP: "Sharehouse (Kamar Bersama)", labelEnJP: "Share House", labelJaJP: "シェアハウス (個室)" },
  { type: "dormitory",    iconDE: "🏢", iconJP: "🏢", labelIdDE: "Wohnheim / Asrama Perusahaan", labelEnDE: "Company Dorm / Wohnheim", labelJaDE: "学生寮・社宅 (Wohnheim)", labelIdJP: "Asrama Perusahaan (会社寮)", labelEnJP: "Company Dormitory (会社寮)", labelJaJP: "社員寮・寄宿舎 (会社寮)" },
  { type: "studio",       iconDE: "🏡", iconJP: "🏡", labelIdDE: "Studio / 1-Zimmer Apartment", labelEnDE: "Studio / 1-Zimmer Apartment", labelJaDE: "ワンルーム / 1-Zimmer", labelIdJP: "Studio / 1K / 1R", labelEnJP: "Studio / 1K / 1R", labelJaJP: "ワンルーム / 1K / 1R" },
  { type: "one_bedroom",  iconDE: "🏘️", iconJP: "🏘️", labelIdDE: "Apartment 2 Kamar", labelEnDE: "2-Room Apartment", labelJaDE: "2部屋アパート (2-Zimmer)", labelIdJP: "1LDK / 2DK Apartment", labelEnJP: "1LDK / 2DK Apartment", labelJaJP: "1LDK / 2DK アパート" },
];

function CurrencyInput({ id, label, value, onChange, currency }: {
  id: string; label: string; value: bigint; onChange: (v: bigint) => void; currency: string; locale: string;
}) {
  const symbol = currency === "EUR" ? "€" : "¥";
  const displayValue = value === 0n ? "" : (Number(value) / (currency === "EUR" ? 100 : 1)).toString();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-fg-70">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)] font-mono text-sm select-none">{symbol}</span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          className="form-select pl-8"
          placeholder="0"
          value={displayValue}
          onChange={(e) => {
            const raw = e.target.value;
            if (!raw.trim()) { onChange(0n); return; }
            if (currency === "JPY") {
              const digits = raw.replace(/[^\d]/g, "");
              onChange(digits ? BigInt(digits) : 0n);
            } else {
              const cleaned = raw.replace(/[^\d.,-]/g, "").replace(/,(\d{3})/g, "$1").replace(",", ".");
              const parsed = parseFloat(cleaned);
              onChange(isNaN(parsed) || parsed < 0 ? 0n : BigInt(Math.round(parsed * 100)));
            }
          }}
        />
      </div>
    </div>
  );
}

export function Step4Housing({ state, dispatch, onNext, onBack }: Step4Props) {
  const { locale } = useI18n();
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

  const currency = state.country === "DE" ? "EUR" : "JPY";
  const currencyLocale = locale === "de" ? "de-DE" : locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US";
  const benchmarks = state.country === "DE" ? DE_HOUSING_BENCHMARKS : JP_HOUSING_BENCHMARKS;

  // Auto-populate rent with benchmark midpoint if 0n
  useEffect(() => {
    if (state.monthlyRentMinorUnits === 0n && !state.isEmployerProvidedHousing) {
      const benchmark = benchmarks[state.housingType];
      if (benchmark) {
        const midpoint = (benchmark.min + benchmark.max) / 2n;
        dispatch({ type: "SET_MONTHLY_RENT", amount: midpoint });
      }
    }
  }, [state.monthlyRentMinorUnits, state.housingType, state.isEmployerProvidedHousing, benchmarks, dispatch]);

  // Calculate upfront total for preview
  const rent = state.monthlyRentMinorUnits;
  const deposit = BigInt(state.depositMonths) * rent;
  const keyMoney = BigInt(state.keyMoneyMonths) * rent;
  const upfrontTotal = deposit + keyMoney + state.agencyFeeMinorUnits + state.setupCushionMinorUnits + state.initialTravelMinorUnits;

  const canProceed = state.monthlyRentMinorUnits > 0n || state.isEmployerProvidedHousing;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-[var(--text)]">
          {txt("Tempat Tinggal & Biaya Pindah", "Housing & Moving Costs", "住居・初期移住費用")}
        </h2>
        <p className="text-fg-muted">
          {txt("Pilih tipe hunian dan estimasi biaya awal pindah.", "Choose housing type and estimate your move-in costs.", "住居タイプを選択し、敷金や初期費用を見積もります。")}
        </p>
      </div>

      {/* Housing Type */}
      <div className="grid grid-cols-2 gap-3">
        {HOUSING_TYPES.map((h) => {
          const isSelected = state.housingType === h.type;
          const benchmark = benchmarks[h.type];
          const label = locale === "ja"
            ? (state.country === "DE" ? h.labelJaDE : h.labelJaJP)
            : locale === "en"
            ? (state.country === "DE" ? h.labelEnDE : h.labelEnJP)
            : (state.country === "DE" ? h.labelIdDE : h.labelIdJP);
          const rangeText = `${formatCurrency(benchmark.min, currency, currencyLocale)}–${formatCurrency(benchmark.max, currency, currencyLocale)}`;
          return (
            <button key={h.type} id={`housing-type-${h.type}`}
              onClick={() => {
                dispatch({ type: "SET_HOUSING_TYPE", housingType: h.type });
                // Auto-fill rent with midpoint benchmark if rent is still 0
                if (state.monthlyRentMinorUnits === 0n) {
                  const midpoint = (benchmark.min + benchmark.max) / 2n;
                  dispatch({ type: "SET_MONTHLY_RENT", amount: midpoint });
                }
                // Auto set employer provided for dormitory
                dispatch({ type: "SET_EMPLOYER_PROVIDED", value: h.type === "dormitory" });
              }}
              className={`p-4 rounded-xl text-left transition-all ${isSelected ? "ring-2 ring-[var(--accent-soft)]" : ""}`}
              style={{ background: isSelected ? "rgba(40, 144, 109, 0.15)" : "rgba(28, 46, 34, 0.5)", border: `1px solid ${isSelected ? "rgba(40, 144, 109, 0.5)" : "rgba(255,255,255,0.08)"}` }}
            >
              <div className="text-xl mb-2">{h.iconDE}</div>
              <div className="text-sm font-medium text-[var(--text)] leading-tight">{label}</div>
              <div className="text-xs text-[var(--accent)] mt-1">{rangeText}</div>
            </button>
          );
        })}
      </div>

      {/* Commuter Zone Trade-Off (Stage 4) */}
      <div className="rounded-xl p-4 space-y-2 bg-panel-2 border border-line">
        <label htmlFor="commuter-zone-select" className="block text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
          🚇 {txt("Zona Hunian & Commuter Trade-Off", "Housing Zone & Commuter Trade-Off", "居住エリアと通勤費トレードオフ")}
        </label>
        <select
          id="commuter-zone-select"
          className="form-select text-sm"
          onChange={(e) => {
            if (e.target.value === "suburban" && state.monthlyRentMinorUnits > 0n) {
              // Apply 25% suburban rent discount automatically
              const discounted = BigInt(Math.round(Number(state.monthlyRentMinorUnits) * 0.75));
              dispatch({ type: "SET_MONTHLY_RENT", amount: discounted });
            }
          }}
        >
          <option value="core">{txt("Pusat Kota (City Core) — Sewa lebih tinggi, tanpa tiket commuter tambahan", "City Core — Higher rent, minimal commuter costs", "都心・市内中心部 — 家賃高め・定期代最小限")}</option>
          <option value="suburban">{txt("Zona Pinggiran (Suburban Zone 3-4) — Sewa ~25% lebih murah, butuh tiket pass", "Suburban (Zone 3-4) — ~25% cheaper rent, monthly transit pass required", "近郊・郊外 (ゾーン3-4) — 家賃約25%安・通勤定期代が必要")}</option>
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button id="employer-provided-toggle"
          onClick={() => dispatch({ type: "SET_EMPLOYER_PROVIDED", value: !state.isEmployerProvidedHousing })}
          className={`relative w-10 h-5 rounded-full transition-colors ${state.isEmployerProvidedHousing ? "bg-[var(--accent)]" : "bg-panel-3"}`}
          role="switch" aria-checked={state.isEmployerProvidedHousing}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${state.isEmployerProvidedHousing ? "translate-x-5" : "translate-x-0"}`} />
        </button>
        <span className="text-sm text-fg-60">
          {txt("Akomodasi disediakan majikan (sudah dipotong dari gaji)", "Employer-provided housing (already deducted from wage)", "会社提供の住居（給与天引き済み）")}
        </span>
      </div>

      {/* Rent Input */}
      <CurrencyInput id="monthly-rent-input"
        label={txt(`Sewa Bulanan (${currency}/bulan)`, `Monthly Rent (${currency}/month)`, `月額家賃 (${currency}/月)`)}
        value={state.monthlyRentMinorUnits} onChange={(v) => dispatch({ type: "SET_MONTHLY_RENT", amount: v })}
        currency={currency} locale={locale} />

      {/* Savings */}
      <CurrencyInput id="savings-input"
        label={txt("Tabungan yang Tersedia (untuk biaya pindah)", "Available Savings (for move-in costs)", "保有準備資金 (移住初期費用向け)")}
        value={state.availableSavingsMinorUnits} onChange={(v) => dispatch({ type: "SET_SAVINGS", amount: v })}
        currency={currency} locale={locale} />

      {/* Relocation Details */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-fg-70 flex items-center gap-2">
          <span>📦</span>
          {txt("Biaya Awal Pindah (Satu Kali)", "One-Time Move-In Costs", "初期移住費用 (一時金)")}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="deposit-months" className="block text-xs text-fg-muted">
              {txt(
                `Uang Jaminan (${state.country === "JP" ? "敷金 Shikikin" : "Kaution"})`,
                `Deposit (${state.country === "JP" ? "Shikikin 敷金" : "Kaution"})`,
                `敷金・保証金 (${state.country === "JP" ? "敷金" : "Kaution"})`
              )}
            </label>
            <select id="deposit-months" className="form-select text-sm" value={state.depositMonths}
              onChange={(e) => dispatch({ type: "SET_DEPOSIT_MONTHS", months: parseInt(e.target.value) })}>
              {[0, 1, 2, 3].map((m) => (
                <option key={m} value={m}>
                  {m}× {txt("sewa", "rent", "ヶ月分")}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="key-money-months" className="block text-xs text-fg-muted">
              {txt("Uang Kunci (礼金 Reikin)", "Key Money (礼金 Reikin)", "礼金 (Reikin)")}
            </label>
            <select id="key-money-months" className="form-select text-sm" value={state.keyMoneyMonths}
              disabled={state.country === "DE"}
              onChange={(e) => dispatch({ type: "SET_KEY_MONEY_MONTHS", months: parseInt(e.target.value) })}>
              {[0, 1, 2].map((m) => (
                <option key={m} value={m}>
                  {m}× {txt("sewa", "rent", "ヶ月分")}
                </option>
              ))}
            </select>
            {state.country === "DE" && (
              <p className="text-xs text-fg-soft">
                {txt("Tidak ada di Jerman", "Not applicable in Germany", "ドイツには存在しません")}
              </p>
            )}
          </div>
        </div>

        <CurrencyInput id="agency-fee-input"
          label={txt("Biaya Agen/Broker", "Agency/Broker Fee", "仲介手数料")}
          value={state.agencyFeeMinorUnits} onChange={(v) => dispatch({ type: "SET_AGENCY_FEE", amount: v })}
          currency={currency} locale={locale} />
        <CurrencyInput id="setup-cushion-input"
          label={txt("Dana Perabotan & Perlengkapan Awal", "Setup & Furniture Budget", "家具・生活用品購入予算")}
          value={state.setupCushionMinorUnits} onChange={(v) => dispatch({ type: "SET_SETUP_CUSHION", amount: v })}
          currency={currency} locale={locale} />
        <CurrencyInput id="travel-input"
          label={txt("Biaya Penerbangan & Perjalanan Awal", "Initial Flight & Travel Cost", "渡航・航空券費用")}
          value={state.initialTravelMinorUnits} onChange={(v) => dispatch({ type: "SET_INITIAL_TRAVEL", amount: v })}
          currency={currency} locale={locale} />
      </div>

      {/* Upfront Total Preview */}
      {upfrontTotal > 0n && (
        <div className="rounded-xl p-4 space-y-1" style={{ background: "rgba(249, 134, 7, 0.08)", border: "1px solid rgba(249, 134, 7, 0.2)" }}>
          <p className="text-xs text-orange-400/70">{txt("Total Biaya Pindah (Satu Kali)", "Total Move-In Cost (One-Time)", "初期費用合計 (一時金)")}</p>
          <p className="text-xl font-bold text-orange-300">{formatCurrency(upfrontTotal, currency, currencyLocale)}</p>
          <p className="text-xs text-fg-soft">{txt("Tidak termasuk dalam cash flow bulanan", "Not included in monthly cash flow", "月々の経常収支には含まれません")}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button id="wizard-step4-back" onClick={onBack} className="btn-secondary flex-1 py-3">← {txt("Kembali", "Back", "戻る")}</button>
        <button id="wizard-step4-next" onClick={onNext} disabled={!canProceed}
          className={`btn-primary flex-[2] py-3 ${!canProceed ? "opacity-40 cursor-not-allowed" : ""}`}>
          {txt("Lanjut →", "Continue →", "次へ進む →")}
        </button>
      </div>
    </div>
  );
}
