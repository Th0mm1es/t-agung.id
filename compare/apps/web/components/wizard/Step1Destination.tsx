"use client";

import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Country, City } from "@bandinghidup/core";
import type { WizardState, WizardAction } from "./wizardState";
import type { CountryCode } from "@bandinghidup/core";

interface Step1Props {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  onNext: () => void;
}

const COUNTRY_CONFIG: Record<CountryCode, { flag: string; label: string; labelId: string; labelJa: string; depositMonths: number; keyMoney: number }> = {
  DE: { flag: "🇩🇪", label: "Germany", labelId: "Jerman", labelJa: "ドイツ", depositMonths: 2, keyMoney: 0 },
  JP: { flag: "🇯🇵", label: "Japan", labelId: "Jepang", labelJa: "日本", depositMonths: 1, keyMoney: 1 },
  ID: { flag: "🇮🇩", label: "Indonesia", labelId: "Indonesia", labelJa: "インドネシア", depositMonths: 1, keyMoney: 0 },
};

export function Step1Destination({ state, dispatch, onNext }: Step1Props) {
  const { locale } = useI18n();

  const txt = (idStr: string, enStr: string, jaStr: string) =>
    locale === "ja" ? jaStr : locale === "en" ? enStr : idStr;

  const { data: countries, isLoading: countriesLoading } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("countries").select("*").order("name_en");
      if (error) throw error;
      return data as Country[];
    },
  });

  // Cities for Reference (#1)
  const { data: refCities } = useQuery({
    queryKey: ["cities-ref", state.refCountry],
    queryFn: async () => {
      const cObj = countries?.find((c) => c.code === state.refCountry);
      if (!cObj) return [];
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("country_id", cObj.id)
        .order("is_major_hub", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as City[];
    },
    enabled: !!state.refCountry && !!countries,
  });

  // Cities for Target (#2)
  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", state.country],
    queryFn: async () => {
      const cObj = countries?.find((c) => c.code === state.country);
      if (!cObj) return [];
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("country_id", cObj.id)
        .order("is_major_hub", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as City[];
    },
    enabled: !!state.country && !!countries,
  });

  const canProceed = !!state.country && (!!state.cityId || !!state.cityName);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="badge-brand text-xs">
            {txt("⚖️ Perbandingan Dual-Kota", "⚖️ Dual-City Comparison", "⚖️ 2都市並行比較")}
          </span>
          <span className="text-xs text-white/40 font-mono">
            {txt("Kota #1 sebagai Acuan", "City #1 as Baseline", "基準都市 #1")}
          </span>
        </div>
        <h2 className="text-2xl font-display font-bold text-white">
          {txt("Tentukan Kota Acuan & Kota Tujuan", "Select Reference & Destination Cities", "基準都市と渡航先都市を選択")}
        </h2>
        <p className="text-white/50 text-sm">
          {txt(
            "Pilih kota asal Anda sebagai acuan pembanding (#1), dan kota impian tujuan Anda (#2) untuk analisis komparatif penuh.",
            "Choose your baseline reference city (#1) and target destination (#2) for side-by-side budgeting.",
            "比較の基準となる現在の都市 (#1) と、渡航予定の目標都市 (#2) を選択してください。"
          )}
        </p>
      </div>

      {/* ── Section 1: Reference City (#1 Acuan) ───────────────────────── */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">
            {txt(
              "📍 Kota #1: Kota Acuan Pembanding (Reference)",
              "📍 City #1: Baseline Reference City",
              "📍 第1都市: 比較基準都市 (現在地)"
            )}
          </span>
          <span className="badge-brand text-[10px]">
            {txt("Acuan #1", "Baseline #1", "基準 #1")}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-white/60 mb-1">
              {txt("Negara Acuan", "Baseline Country", "基準国")}
            </label>
            <select
              value={state.refCountry}
              onChange={(e) => {
                const c = e.target.value as CountryCode;
                const defCity = c === "ID" ? "Jakarta" : c === "JP" ? "Tokyo" : "Berlin";
                dispatch({
                  type: "SET_REF_LOCATION",
                  country: c,
                  cityId: "",
                  cityName: defCity,
                });
              }}
              className="form-select text-xs py-2"
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
              value={state.refCityName}
              onChange={(e) => {
                const c = refCities?.find((x) => x.name === e.target.value);
                dispatch({
                  type: "SET_REF_LOCATION",
                  country: state.refCountry,
                  cityId: c?.id ?? "",
                  cityName: e.target.value,
                });
              }}
              className="form-select text-xs py-2"
            >
              {refCities && refCities.length > 0 ? (
                refCities.map((city) => (
                  <option key={city.id} value={city.name}>
                    {city.is_major_hub ? "🏙️" : "🏘️"} {city.name}
                  </option>
                ))
              ) : (
                <option value={state.refCityName}>{state.refCityName}</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 2: Destination City (#2 Target) ───────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-accent-400 uppercase tracking-wider">
            {txt(
              "🎯 Kota #2: Kota Tujuan Relokasi (Destination)",
              "🎯 City #2: Destination City",
              "🎯 第2都市: 渡航目標都市 (移住先)"
            )}
          </span>
          <span className="badge-accent text-[10px]">
            {txt("Target #2", "Target #2", "目標 #2")}
          </span>
        </div>

        {/* Country Cards */}
        <div className="grid grid-cols-2 gap-4">
          {(["DE", "JP"] as CountryCode[]).map((code) => {
            const cfg = COUNTRY_CONFIG[code];
            const isSelected = state.country === code;

            return (
              <button
                key={code}
                id={`country-btn-${code}`}
                onClick={() => {
                  dispatch({
                    type: "SET_COUNTRY",
                    country: code,
                    defaultDepositMonths: cfg.depositMonths,
                    defaultKeyMoney: cfg.keyMoney,
                  });
                  const defCity = code === "DE" ? "Berlin" : "Tokyo";
                  dispatch({ type: "SET_CITY", cityId: "", cityName: defCity });
                }}
                className={`relative p-5 rounded-2xl text-left transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-brand-400 bg-brand-500/15 border-brand-500/50"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
                style={{ border: `1px solid ${isSelected ? "rgba(40, 144, 109, 0.5)" : "rgba(255,255,255,0.08)"}` }}
              >
                <div className="text-3xl mb-2">{cfg.flag}</div>
                <div className="font-semibold text-white text-base">
                  {locale === "ja" ? cfg.labelJa : locale === "en" ? cfg.label : cfg.labelId}
                </div>
                {code === "DE" && (
                  <div className="text-xs text-brand-300 mt-0.5 font-mono">
                    {txt("Ausbildung & Fresh Grad", "Vocational & Graduates", "職業訓練 & 大卒初任給")}
                  </div>
                )}
                {code === "JP" && (
                  <div className="text-xs text-accent-300 mt-0.5 font-mono">
                    {txt("Kenshusei & Fresh Grad", "Intern & Graduates", "技能実習 & 大卒初任給")}
                  </div>
                )}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-xs text-white">
                    ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* City Selector for Destination */}
        {state.country && (
          <div className="space-y-1.5 animate-slide-up">
            <label htmlFor="wizard-city-select" className="block text-xs font-medium text-white/70">
              {txt("Pilih Kota Tujuan Spesifik:", "Select Specific Target City:", "渡航先の具体都市を選択:")}
            </label>
            <div className="relative">
              <select
                id="wizard-city-select"
                className="form-select text-xs py-2"
                value={state.cityName}
                onChange={(e) => {
                  const city = cities?.find((c) => c.name === e.target.value);
                  dispatch({
                    type: "SET_CITY",
                    cityId: city?.id ?? "",
                    cityName: e.target.value,
                  });
                }}
                disabled={citiesLoading || countriesLoading}
              >
                {cities && cities.length > 0 ? (
                  cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.is_major_hub ? "🏙️" : "🏘️"} {city.name}
                    </option>
                  ))
                ) : (
                  <option value={state.cityName}>{state.cityName}</option>
                )}
              </select>
            </div>
          </div>
        )}
      </div>

      <button
        id="wizard-step1-next"
        onClick={onNext}
        disabled={!canProceed}
        className={`btn-primary w-full py-4 text-sm font-bold ${!canProceed ? "opacity-40 cursor-not-allowed" : ""}`}
      >
        {txt("Lanjut ke Pilih Jalur →", "Continue to Pathway →", "キャリア区分の選択へ進む →")}
      </button>
    </div>
  );
}
