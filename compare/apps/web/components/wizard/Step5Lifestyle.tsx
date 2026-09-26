"use client";

import { useI18n } from "@/lib/i18n";
import { buildExpenseBasket, formatCurrency, LIFESTYLE_PROFILES } from "@bandinghidup/core";
import type { LifestyleProfile } from "@bandinghidup/core";
import type { WizardState, WizardAction } from "./wizardState";

interface Step5Props {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  onNext: () => void;
  onBack: () => void;
}

type ProfileConfig = {
  profile: LifestyleProfile;
  icon: string;
  labelId: string;
  labelEn: string;
  labelJa: string;
  descId: string;
  descEn: string;
  descJa: string;
  color: string;
  bgColor: string;
};

const PROFILE_CONFIGS: ProfileConfig[] = [
  {
    profile: "minimum_viable",
    icon: "🧩",
    labelId: "Minimum Viable",
    labelEn: "Minimum Viable",
    labelJa: "必要最小限 (ミニマム)",
    descId: "Hanya kebutuhan dasar. Peringatan: ini bukan rekomendasi kenyamanan.",
    descEn: "Basic needs only. Warning: not a comfort recommendation.",
    descJa: "自炊中心・娯楽を削った最低限の生存生活。注意: 長期滞在での推奨値ではありません。",
    color: "rgba(239, 68, 68, 0.8)",
    bgColor: "rgba(239, 68, 68, 0.08)",
  },
  {
    profile: "realistic_newcomer",
    icon: "🌱",
    labelId: "Realistic Newcomer",
    labelEn: "Realistic Newcomer",
    labelJa: "堅実な新生活 (標準的)",
    descId: "Pengeluaran realistis untuk pendatang baru. Seimbang dan berkelanjutan.",
    descEn: "Realistic spending for a newcomer. Balanced and sustainable.",
    descJa: "渡航初期の無理のない堅実な生活水準。節約しつつ適度な外食や外出を維持。",
    color: "rgba(40, 144, 109, 0.9)",
    bgColor: "rgba(40, 144, 109, 0.08)",
  },
  {
    profile: "comfortable",
    icon: "✨",
    labelId: "Comfortable",
    labelEn: "Comfortable",
    labelJa: "ゆとりある生活 (快適)",
    descId: "Kualitas hidup lebih baik. Makan enak, nongkrong, hobi.",
    descEn: "Better quality of life. Good food, socializing, hobbies.",
    descJa: "生活の質を重視。外食・趣味・旅行や友人との交流を楽しむ水準。",
    color: "rgba(168, 85, 247, 0.8)",
    bgColor: "rgba(168, 85, 247, 0.08)",
  },
];

export function Step5Lifestyle({ state, dispatch, onNext, onBack }: Step5Props) {
  const { locale } = useI18n();
  const txt = (idStr: string, enStr: string, jaStr: string) =>
    locale === "ja" ? jaStr : locale === "en" ? enStr : idStr;

  const currency = state.country === "DE" ? "EUR" : "JPY";
  const currencyLocale = locale === "id" ? "id-ID" : locale === "ja" ? "ja-JP" : "en-US";

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-white">
          {txt("Profil Gaya Hidup", "Lifestyle Profile", "生活水準・ライフスタイル")}
        </h2>
        <p className="text-white/50">
          {txt(
            "Pilih baseline pengeluaran harianmu. Kamu bisa override detail di langkah selanjutnya.",
            "Choose your daily spending baseline. You can override details in the next step.",
            "月々の生活費ベースラインを選択してください。次のステップで個別に微調整可能です。"
          )}
        </p>
      </div>

      <div className="space-y-4">
        {PROFILE_CONFIGS.map((cfg) => {
          const isSelected = state.lifestyleProfile === cfg.profile;
          const basket = buildExpenseBasket(state.country ?? "DE", cfg.profile);
          const total = basket.monthlyGrandTotal;

          return (
            <button
              key={cfg.profile}
              id={`lifestyle-${cfg.profile}`}
              onClick={() => dispatch({ type: "SET_LIFESTYLE", profile: cfg.profile })}
              className={`w-full p-5 rounded-2xl text-left transition-all duration-200 ${isSelected ? "ring-2" : ""}`}
              style={{
                background: isSelected ? cfg.bgColor : "rgba(28, 46, 34, 0.5)",
                border: `1px solid ${isSelected ? cfg.color : "rgba(255,255,255,0.08)"}`,
              }}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{cfg.icon}</span>
                  <div>
                    <div className="font-semibold text-white">
                      {locale === "ja" ? cfg.labelJa : locale === "en" ? cfg.labelEn : cfg.labelId}
                    </div>
                    <p className="text-sm text-white/50 mt-0.5 leading-relaxed">
                      {locale === "ja" ? cfg.descJa : locale === "en" ? cfg.descEn : cfg.descId}
                    </p>

                    {cfg.profile === "minimum_viable" && (
                      <div className="mt-2 text-xs px-2 py-1 rounded" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#f87171" }}>
                        ⚠️ {txt("Perencanaan dasar yang dibatasi, bukan rekomendasi kenyamanan", "Constrained planning baseline, not a comfort recommendation", "制約付きの最低限基準であり、快適な生活推奨値ではありません")}
                      </div>
                    )}

                    {/* Preview line items */}
                    <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-white/40">
                      {[
                        { label: txt("Makanan", "Food", "食費"), value: basket.monthlyFoodTotal },
                        { label: txt("Transport", "Transport", "交通費"), value: basket.monthlyTransportTotal },
                        { label: txt("Utilities", "Utilities", "通信・光熱費"), value: basket.monthlyUtilitiesTotal },
                        { label: txt("Gaya hidup", "Lifestyle", "交際・娯楽費"), value: basket.monthlyLifestyleTotal },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between gap-1">
                          <span>{label}</span>
                          <span>{formatCurrency(value, currency, currencyLocale)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <div className="text-xs text-white/40 mb-0.5">
                    {txt("Total bulanan", "Monthly total", "月間生活費合計")}
                  </div>
                  <div className="font-bold text-lg" style={{ color: cfg.color }}>
                    {formatCurrency(total, currency, currencyLocale)}
                  </div>
                  {isSelected && (
                    <div className="mt-1 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ml-auto" style={{ background: cfg.color }}>
                      ✓
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button id="wizard-step5-back" onClick={onBack} className="btn-secondary flex-1 py-3">← {txt("Kembali", "Back", "戻る")}</button>
        <button id="wizard-step5-next" onClick={onNext} className="btn-primary flex-[2] py-3">
          {txt("Review Detail →", "Review Details →", "詳細確認へ進む →")}
        </button>
      </div>
    </div>
  );
}
