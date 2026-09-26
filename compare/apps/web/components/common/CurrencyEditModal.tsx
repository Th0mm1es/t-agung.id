"use client";

import React, { useState } from "react";
import { useCurrency } from "@/lib/currencyContext";
import { useI18n } from "@/lib/i18n";

interface CurrencyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CurrencyEditModal({ isOpen, onClose }: CurrencyEditModalProps) {
  const { locale } = useI18n();
  const { exchangeRates, updateCustomRate, resetToOfficialRates, isCustomized } = useCurrency();

  const [idrRate, setIdrRate] = useState<string>(
    exchangeRates?.rates["IDR"] ? String(Math.round(exchangeRates.rates["IDR"])) : "17200"
  );
  const [jpyRate, setJpyRate] = useState<string>(
    exchangeRates?.rates["JPY"] ? String(Number(exchangeRates.rates["JPY"]).toFixed(1)) : "163.5"
  );
  const [usdRate, setUsdRate] = useState<string>(
    exchangeRates?.rates["USD"] ? String(Number(exchangeRates.rates["USD"]).toFixed(2)) : "1.08"
  );

  if (!isOpen) return null;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const idr = parseFloat(idrRate);
    const jpy = parseFloat(jpyRate);
    const usd = parseFloat(usdRate);

    if (!isNaN(idr) && idr > 0) updateCustomRate("IDR", idr);
    if (!isNaN(jpy) && jpy > 0) updateCustomRate("JPY", jpy);
    if (!isNaN(usd) && usd > 0) updateCustomRate("USD", usd);

    onClose();
  }

  function handleReset() {
    resetToOfficialRates();
    if (exchangeRates?.rates) {
      setIdrRate(String(Math.round(exchangeRates.rates["IDR"] ?? 17200)));
      setJpyRate(String(Number(exchangeRates.rates["JPY"] ?? 163.5).toFixed(1)));
      setUsdRate(String(Number(exchangeRates.rates["USD"] ?? 1.08).toFixed(2)));
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card max-w-md w-full p-6 space-y-5 border border-white/15 shadow-2xl relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💱</span>
            <h2 className="text-lg font-bold text-white">
              {locale === "id" ? "Sesuaikan Nilai Kurs Mata Uang" : locale === "ja" ? "為替レートの手動調整" : "Adjust Custom Exchange Rates"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-white/60 leading-relaxed">
          {locale === "id"
            ? "Sesuaikan nilai tukar sesuai kurs riil yang dikenakan bank, transfer antar-negara (Wise/PayPal), atau estimasi pribadi Anda (Basis: 1 EUR)."
            : locale === "ja"
            ? "ご利用の銀行や送金サービス（Wise等）の実勢レートに合わせて、基準為替レート（1 EURあたり）を自由にカスタマイズできます。"
            : "Adjust exchange rates to match your actual bank or money transfer service rates (Wise, PayPal, etc.) relative to 1 EUR."}
        </p>

        <form onSubmit={handleSave} className="space-y-4 text-sm">
          <div className="space-y-3">
            {/* 1 EUR to IDR */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <label className="text-xs font-semibold text-white/80">
                1 EUR &rarr; IDR (Rp)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/50">Rp</span>
                <input
                  type="number"
                  step="10"
                  value={idrRate}
                  onChange={(e) => setIdrRate(e.target.value)}
                  className="form-select text-xs py-1 px-2.5 w-28 text-right font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* 1 EUR to JPY */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <label className="text-xs font-semibold text-white/80">
                1 EUR &rarr; JPY (¥)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/50">¥</span>
                <input
                  type="number"
                  step="0.1"
                  value={jpyRate}
                  onChange={(e) => setJpyRate(e.target.value)}
                  className="form-select text-xs py-1 px-2.5 w-28 text-right font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* 1 EUR to USD */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
              <label className="text-xs font-semibold text-white/80">
                1 EUR &rarr; USD ($)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/50">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={usdRate}
                  onChange={(e) => setUsdRate(e.target.value)}
                  className="form-select text-xs py-1 px-2.5 w-28 text-right font-mono font-bold"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {isCustomized ? (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors underline"
              >
                ↺ {locale === "id" ? "Reset ke Kurs Resmi" : locale === "ja" ? "公定レートにリセット" : "Reset to Official Rates"}
              </button>
            ) : (
              <span className="text-[11px] text-white/40">
                {locale === "id" ? "✓ Menggunakan kurs resmi live" : locale === "ja" ? "✓ リアルタイム公定レートを使用中" : "✓ Using live official rates"}
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary py-1.5 px-3 text-xs"
              >
                {locale === "id" ? "Batal" : locale === "ja" ? "キャンセル" : "Cancel"}
              </button>
              <button
                type="submit"
                className="btn-primary py-1.5 px-4 text-xs font-semibold"
              >
                {locale === "id" ? "Terapkan Kurs" : locale === "ja" ? "為替レートを適用" : "Apply Rates"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
