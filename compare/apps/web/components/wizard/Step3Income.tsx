"use client";

import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import {
  calculateAusbildungNet,
  calculateJapaneseTraineeNet,
  calculateGenericNet,
  AUSBILDUNG_REFERENCE_GROSS,
  formatCurrency,
} from "@bandinghidup/core";
import type { WizardState, WizardAction } from "./wizardState";

interface Step3Props {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  onNext: () => void;
  onBack: () => void;
}

function CurrencyInput({
  id,
  label,
  value,
  onChange,
  currency,
  placeholder,
  locale,
  hint,
}: {
  id: string;
  label: string;
  value: bigint;
  onChange: (v: bigint) => void;
  currency: string;
  placeholder?: string | undefined;
  locale: string;
  hint?: string | undefined;
}) {
  const symbol = currency === "EUR" ? "€" : currency === "JPY" ? "¥" : "Rp";
  
  // Format display value based on currency
  const formatForDisplay = (val: bigint): string => {
    if (val === 0n) return "";
    if (currency === "EUR") {
      const num = Number(val) / 100;
      return num.toString();
    }
    return val.toString();
  };

  const [inputStr, setInputStr] = useState<string>(() => formatForDisplay(value));

  // Keep local string in sync if value changes externally (e.g. preset clicked)
  useEffect(() => {
    const formatted = formatForDisplay(value);
    if (value === 0n && inputStr === "") return;
    setInputStr(formatted);
  }, [value, currency]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setInputStr(raw);

    if (!raw.trim()) {
      onChange(0n);
      return;
    }

    if (currency === "JPY" || currency === "IDR") {
      // Strip any dots or commas that users might type as thousand separators
      const digitsOnly = raw.replace(/[^\d]/g, "");
      if (!digitsOnly) {
        onChange(0n);
        return;
      }
      try {
        onChange(BigInt(digitsOnly));
      } catch {
        onChange(0n);
      }
    } else {
      // EUR: handle comma or dot for cents
      const cleaned = raw.replace(/[^\d.,-]/g, "").replace(/,(\d{3})/g, "$1").replace(",", ".");
      const parsed = parseFloat(cleaned);
      if (isNaN(parsed) || parsed < 0) {
        onChange(0n);
        return;
      }
      onChange(BigInt(Math.round(parsed * 100)));
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-sm font-medium text-fg-70">
          {label}
        </label>
        {hint && <span className="text-xs text-fg-soft">{hint}</span>}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)] font-mono text-sm select-none">
          {symbol}
        </span>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          className="form-select pl-8"
          placeholder={placeholder ?? "0"}
          value={inputStr}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}

const JAPAN_CITY_WAGE_DATA: Record<string, { hourly: number; gross: bigint; labelId: string; labelEn: string; labelJa: string }> = {
  Tokyo: { hourly: 1163, gross: 186080n, labelId: "UMR Tokyo (¥1.163/jam)", labelEn: "Tokyo Min. (¥1,163/hr)", labelJa: "東京最低賃金 (¥1,163/時)" },
  Yokohama: { hourly: 1162, gross: 185920n, labelId: "UMR Kanagawa (¥1.162/jam)", labelEn: "Kanagawa Min. (¥1,162/hr)", labelJa: "神奈川最低賃金 (¥1,162/時)" },
  Osaka: { hourly: 1114, gross: 178240n, labelId: "UMR Osaka (¥1.114/jam)", labelEn: "Osaka Min. (¥1,114/hr)", labelJa: "大阪最低賃金 (¥1,114/時)" },
  Nagoya: { hourly: 1077, gross: 172320n, labelId: "UMR Aichi/Nagoya (¥1.077/jam)", labelEn: "Aichi Min. (¥1,077/hr)", labelJa: "愛知・名古屋最低賃金 (¥1,077/時)" },
  Kyoto: { hourly: 1058, gross: 169280n, labelId: "UMR Kyoto (¥1.058/jam)", labelEn: "Kyoto Min. (¥1,058/hr)", labelJa: "京都最低賃金 (¥1,058/時)" },
  Kobe: { hourly: 1052, gross: 168320n, labelId: "UMR Hyogo/Kobe (¥1.052/jam)", labelEn: "Hyogo Min. (¥1,052/hr)", labelJa: "兵庫・神戸最低賃金 (¥1,052/時)" },
  Sapporo: { hourly: 1010, gross: 161600n, labelId: "UMR Hokkaido (¥1.010/jam)", labelEn: "Hokkaido Min. (¥1,010/hr)", labelJa: "北海道最低賃金 (¥1,010/時)" },
  Fukuoka: { hourly: 992, gross: 158720n, labelId: "UMR Fukuoka (¥992/jam)", labelEn: "Fukuoka Min. (¥992/hr)", labelJa: "福岡最低賃金 (¥992/時)" },
};

export function Step3Income({ state, dispatch, onNext, onBack }: Step3Props) {
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

  // Regional Japanese wage calculation based on selected city in Step 1
  const cityWageInfo = JAPAN_CITY_WAGE_DATA[state.cityName] ?? {
    hourly: 1055,
    gross: 168800n,
    labelId: `UMR ${state.cityName || "Daerah"} (~¥1.055/jam)`,
    labelEn: `${state.cityName || "Regional"} Min. (~¥1,055/hr)`,
    labelJa: `${state.cityName || "地方"}最低賃金 (~¥1,055/時)`,
  };

  const regionalGross = cityWageInfo.gross;
  const regionalNet = BigInt(Math.round(Number(regionalGross) * 0.81));

  const nationalGross = 180000n;
  const nationalNet = 144000n;

  const overtimeHours = 20;
  const overtimeGross = regionalGross + BigInt(Math.round(cityWageInfo.hourly * 1.25 * overtimeHours));
  const overtimeNet = BigInt(Math.round(Number(overtimeGross) * 0.80));

  const applyJapanesePreset = (gross: bigint, net: bigint) => {
    dispatch({ type: "SET_GROSS", amount: gross });
    if (state.useManualNet) {
      dispatch({ type: "SET_MANUAL_NET", amount: net });
    } else {
      // Auto-populate realistic Japanese contract deductions
      dispatch({ type: "SET_JP_DEDUCTION", field: "housingDeduction", value: 20000n });
      dispatch({ type: "SET_JP_DEDUCTION", field: "utilitiesDeduction", value: 8000n });
      dispatch({
        type: "SET_JP_DEDUCTION",
        field: "shakaiHokenDeduction",
        value: BigInt(Math.round(Number(gross) * 0.145)),
      });
      dispatch({
        type: "SET_JP_DEDUCTION",
        field: "employmentInsurance",
        value: BigInt(Math.round(Number(gross) * 0.006)),
      });
    }
  };

  // Total contract deductions (for JPY Technical Intern)
  const totalContractDeductions =
    state.japaneseDeductions.housingDeduction +
    state.japaneseDeductions.utilitiesDeduction +
    state.japaneseDeductions.shakaiHokenDeduction +
    state.japaneseDeductions.employmentInsurance +
    state.japaneseDeductions.mealsDeduction +
    state.japaneseDeductions.otherDeductions;

  // Live computed net preview
  const computedNet = (() => {
    const hasIncomeInput =
      state.grossMonthlyMinorUnits > 0n ||
      (state.useManualNet && state.manualNetMonthlyMinorUnits > 0n);
    if (!hasIncomeInput) return null;

    if (state.pathway === "ausbildung") {
      return calculateAusbildungNet(
        state.grossMonthlyMinorUnits,
        state.ausbildungTrainingYear,
        state.useManualNet ? state.manualNetMonthlyMinorUnits : undefined
      );
    }
    if (state.pathway === "technical_intern") {
      return calculateJapaneseTraineeNet(
        state.grossMonthlyMinorUnits,
        state.japaneseDeductions,
        state.useManualNet ? state.manualNetMonthlyMinorUnits : undefined
      );
    }
    return calculateGenericNet(
      state.grossMonthlyMinorUnits,
      state.customDeductionRate,
      state.useManualNet ? state.manualNetMonthlyMinorUnits : undefined
    );
  })();

  const netMonthly = computedNet
    ? "netMonthly" in computedNet
      ? computedNet.netMonthly
      : 0n
    : 0n;

  // Validation: can proceed if either gross is provided, or manual net is provided when toggle is active
  const canProceed = state.useManualNet
    ? state.manualNetMonthlyMinorUnits > 0n || state.grossMonthlyMinorUnits > 0n
    : state.grossMonthlyMinorUnits > 0n;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-[var(--text)]">
          {txt("Penghasilan & Potongan", "Income & Deductions", "給与・法定控除")}
        </h2>
        <p className="text-fg-muted">
          {state.pathway === "ausbildung"
            ? txt(
                "Masukkan uang saku kotor (Brutto) Ausbildungmu.",
                "Enter your Ausbildung gross stipend.",
                "Ausbildungの月額支給額（額面/Brutto）を入力してください。"
              )
            : state.pathway === "technical_intern"
            ? txt(
                "Masukkan gaji kotor (Gakumen) dan semua potongan kontrak dari majikan.",
                "Enter your gross wage (Gakumen) and all employer contract deductions.",
                "基本給（額面）および受入機関からの天引き項目を入力してください。"
              )
            : txt(
                "Masukkan penghasilan bulananmu.",
                "Enter your monthly income.",
                "月額給与を入力してください。"
              )}
        </p>
      </div>

      {/* Ausbildung Reference */}
      {state.pathway === "ausbildung" && (
        <div
          className="rounded-xl p-4 space-y-2"
          style={{
            background: "rgba(40, 144, 109, 0.08)",
            border: "1px solid rgba(40, 144, 109, 0.2)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--accent)]">
              {txt(
                "📊 Referensi Gaji Ausbildung 2026 (rata-rata nasional)",
                "📊 2026 Ausbildung Stipend Reference (national average)",
                "📊 2026年 Ausbildung手当基準 (全国平均)"
              )}
            </p>
            <span className="text-[10px] text-fg-soft">
              {txt("Klik untuk isi otomatis", "Click to auto-fill", "クリックで自動入力")}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {([1, 2, 3] as const).map((year) => (
              <button
                key={year}
                type="button"
                id={`training-year-${year}`}
                onClick={() => {
                  dispatch({ type: "SET_TRAINING_YEAR", year });
                  dispatch({
                    type: "SET_GROSS",
                    amount: AUSBILDUNG_REFERENCE_GROSS[year],
                  });
                }}
                className={`p-2 rounded-lg text-center transition-all ${
                  state.ausbildungTrainingYear === year &&
                  state.grossMonthlyMinorUnits === AUSBILDUNG_REFERENCE_GROSS[year]
                    ? "ring-1 ring-[var(--accent-soft)] bg-[var(--accent-soft)]"
                    : "bg-panel-2 hover:bg-panel-2"
                }`}
              >
                <div className="text-fg-muted text-xs">
                  {txt(`Tahun ke-${year}`, `Year ${year}`, `第${year}年目`)}
                </div>
                <div className="text-[var(--text)] font-medium">
                  {formatCurrency(AUSBILDUNG_REFERENCE_GROSS[year], "EUR", currencyLocale)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Japanese Trainee (Kenshusei) Reference */}
      {state.pathway === "technical_intern" && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background: "rgba(40, 144, 109, 0.08)",
            border: "1px solid rgba(40, 144, 109, 0.2)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--accent)]">
              {txt(
                "📊 Estimasi Gaji Kenshusei Jepang (Gaji Kotor & Bersih)",
                "📊 Japanese Trainee Wage Estimates (Gross & Net)",
                "📊 日本・実習生賃金目安 (額面・手取り)"
              )}
            </p>
            <span className="text-[10px] text-fg-soft">
              {txt("Klik untuk isi otomatis", "Click to auto-fill", "クリックで自動入力")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              {
                id: "ref-regional",
                title: locale === "ja" ? cityWageInfo.labelJa : locale === "en" ? cityWageInfo.labelEn : cityWageInfo.labelId,
                desc: txt("Sesuai UMR prefektur pilihan", "Based on selected prefecture", "選択都道府県の地域別最低賃金"),
                gross: regionalGross,
                net: regionalNet,
              },
              {
                id: "ref-national",
                title: txt("Standar Nasional", "National Standard", "全国標準水準"),
                desc: txt("Rata-rata nasional magang", "Average trainee contract", "全国実習生平均契約"),
                gross: nationalGross,
                net: nationalNet,
              },
              {
                id: "ref-metro",
                title: txt("Kota + Lembur (+20j)", "Metro + Overtime (+20h)", "都市部＋残業20時間"),
                desc: txt("Termasuk lembur ~20 jam/bln", "With ~20h overtime", "月約20時間の時間外手当含む"),
                gross: overtimeGross,
                net: overtimeNet,
              },
            ].map((ref) => {
              const isSelected = state.grossMonthlyMinorUnits === ref.gross;
              return (
                <button
                  key={ref.id}
                  type="button"
                  id={`kenshusei-${ref.id}`}
                  onClick={() => applyJapanesePreset(ref.gross, ref.net)}
                  className={`p-2.5 rounded-lg text-left transition-all border ${
                    isSelected
                      ? "ring-1 ring-[var(--accent-soft)] bg-[var(--accent-soft)] border-[var(--accent)]/50"
                      : "bg-panel-2 hover:bg-panel-2 border-line"
                  }`}
                >
                  <div className="text-[var(--accent)] font-semibold text-xs truncate">{ref.title}</div>
                  <div className="text-[var(--text)] font-mono font-bold text-sm mt-0.5">
                    {formatCurrency(ref.gross, "JPY", currencyLocale)}
                  </div>
                  <div className="text-[11px] text-fg-60 font-mono">
                    {txt("Bersih: ~", "Net: ~", "手取り概算: ~")}
                    {formatCurrency(ref.net, "JPY", currencyLocale)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Household Composition Selector */}
      <div className="space-y-2">
        <label htmlFor="family-comp-select" className="block text-sm font-medium text-fg-70">
          {txt("Komposisi Rumah Tangga", "Household Composition", "世帯構成")}
        </label>
        <select
          id="family-comp-select"
          className="form-select text-sm"
          value={
            state.familyStatus === "married_children"
              ? state.numChildren >= 2
                ? "family_2"
                : "family_1"
              : state.familyStatus === "married"
              ? "couple"
              : "single"
          }
          onChange={(e) => {
            const val = e.target.value;
            if (val === "single") {
              dispatch({ type: "SET_FAMILY_STRUCTURE", familyStatus: "single", numChildren: 0 });
            } else if (val === "couple") {
              dispatch({ type: "SET_FAMILY_STRUCTURE", familyStatus: "married", numChildren: 0 });
            } else if (val === "family_1") {
              dispatch({ type: "SET_FAMILY_STRUCTURE", familyStatus: "married_children", numChildren: 1 });
              dispatch({ type: "SET_LIFESTYLE", profile: "comfortable" });
            } else if (val === "family_2") {
              dispatch({ type: "SET_FAMILY_STRUCTURE", familyStatus: "married_children", numChildren: 2 });
              dispatch({ type: "SET_LIFESTYLE", profile: "comfortable" });
            }
          }}
        >
          <option value="single">{txt("Lajang (1 Dewasa)", "Single (1 Adult)", "単身 (大人1名)")}</option>
          <option value="couple">{txt("Menikah (Tanpa Anak)", "Married (No Children)", "既婚・子なし (大人2名)")}</option>
          <option value="family_1">{txt("Keluarga dengan 1 Anak", "Family with 1 Child", "家族（子ども1名）")}</option>
          <option value="family_2">{txt("Keluarga dengan 2 Anak", "Family with 2 Children", "家族（子ども2名）")}</option>
        </select>

        {/* Dynamic Age-Limit Note based on Destination Country */}
        {(state.familyStatus === "married_children" || true) && (
          <div className="text-[11px] text-fg-muted bg-panel-2 p-2 rounded-lg border border-line flex items-start gap-1.5">
            <span className="text-accent-400">ℹ️</span>
            <span>
              {state.country === "DE"
                ? txt(
                    "Kindergeld (€255/anak/bln) berlaku untuk anak <18 th (maks 25 th jika masih pendidikan/training).",
                    "Kindergeld (€255/child/mo) applies for children <18 yo (up to 25 yo if in education/training).",
                    "Kindergeld（ドイツ子供手当 €255/月/人）は18歳未満対象（教育・訓練中は最長25歳まで）。"
                  )
                : state.country === "JP"
                ? txt(
                    "Tunjangan Anak Jepang (Jido Teate ¥15.000/anak/bln) berlaku untuk anak <18 th; ada batas penghasilan orang tua.",
                    "Japan Child Allowance (¥15,000/child/mo) applies for children <18 yo; parent income caps apply.",
                    "児童手当（月額15,000円/人）は高校生年代（18歳到達後最初の3月31日）まで支給されます。"
                  )
                : txt(
                    "Penyesuaian PTKP & tunjangan anak berlaku sesuai status tanggungan pajak resmi (K/1, K/2).",
                    "PTKP tax relief applies based on official tax dependent status (K/1, K/2).",
                    "扶養親族控除（PTKP K/1, K/2）は公式な税制要件に基づいて適用されます。"
                  )}
            </span>
          </div>
        )}
      </div>

      {/* Payslip Net Mode Toggle */}
      <div className="flex items-center gap-3">
        <button
          id="toggle-manual-net"
          type="button"
          onClick={() => {
            const nextVal = !state.useManualNet;
            dispatch({ type: "SET_USE_MANUAL_NET", value: nextVal });
            if (nextVal && state.manualNetMonthlyMinorUnits === 0n && state.grossMonthlyMinorUnits > 0n) {
              // Pre-fill realistic net (~81%)
              dispatch({
                type: "SET_MANUAL_NET",
                amount: BigInt(Math.round(Number(state.grossMonthlyMinorUnits) * 0.81)),
              });
            }
          }}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            state.useManualNet ? "bg-[var(--accent)]" : "bg-panel-3"
          }`}
          role="switch"
          aria-checked={state.useManualNet}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              state.useManualNet ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span className="text-sm text-fg-60">
          {txt(
            "Saya punya slip gaji (masukkan netto langsung)",
            "I have a payslip (enter net pay directly)",
            "給与明細あり（手取り額を直接入力）"
          )}
        </span>
      </div>

      {/* Gross Input */}
      <div>
        <CurrencyInput
          id="gross-income-input"
          label={txt(
            `Gaji Kotor / Gakumen (${currency}/bulan)`,
            `Gross Income / Gakumen (${currency}/month)`,
            `額面給与 (${currency}/月)`
          )}
          value={state.grossMonthlyMinorUnits}
          onChange={(v) => dispatch({ type: "SET_GROSS", amount: v })}
          currency={currency}
          locale={locale}
          placeholder={currency === "EUR" ? "1050" : "180000"}
          hint={
            state.grossMonthlyMinorUnits === 0n
              ? txt("⚠️ Wajib diisi", "⚠️ Required", "⚠️ 入力必須")
              : undefined
          }
        />
        {state.grossMonthlyMinorUnits === 0n && !state.useManualNet && (
          <p className="text-xs text-amber-400/80 mt-1.5 flex items-center gap-1">
            <span>💡</span>
            <span>
              {txt(
                "Ketik gaji kotor kamu atau klik salah satu tombol referensi di atas.",
                "Type your gross income or click one of the reference buttons above.",
                "額面給与を入力するか、上記の参考水準ボタンをクリックしてください。"
              )}
            </span>
          </p>
        )}
      </div>

      {/* Manual Net Input (if payslip mode enabled) */}
      {state.useManualNet && (
        <CurrencyInput
          id="manual-net-input"
          label={txt(
            "Gaji Bersih / Net Take-Home (dari slip gaji)",
            "Net Pay (from payslip)",
            "手取り給与 (給与明細の実支給額)"
          )}
          value={state.manualNetMonthlyMinorUnits}
          onChange={(v) => dispatch({ type: "SET_MANUAL_NET", amount: v })}
          currency={currency}
          locale={locale}
          placeholder={currency === "EUR" ? "820" : "135000"}
        />
      )}

      {/* JP Trainee Contract Deductions Warning if Deductions Filled but Gross is 0 */}
      {state.pathway === "technical_intern" &&
        !state.useManualNet &&
        totalContractDeductions > 0n &&
        state.grossMonthlyMinorUnits === 0n && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-amber-100 flex items-center gap-1.5">
                <span>⚠️</span>
                <span>
                  {txt(
                    "Gaji Kotor (Gakumen) Belum Diisi",
                    "Gross Income (Gakumen) Not Filled",
                    "額面給与が未入力です"
                  )}
                </span>
              </div>
              <p className="text-amber-200/80 mt-0.5">
                {txt(
                  `Kamu sudah mengisi potongan ${formatCurrency(
                    totalContractDeductions,
                    "JPY",
                    currencyLocale
                  )}, tetapi Gaji Kotor masih ¥0 sehingga tidak bisa lanjut.`,
                  `You entered deductions of ${formatCurrency(
                    totalContractDeductions,
                    "JPY",
                    currencyLocale
                  )}, but gross income is ¥0.`,
                  `控除額 ${formatCurrency(
                    totalContractDeductions,
                    "JPY",
                    currencyLocale
                  )} が入力されていますが、額面給与が未入力のため次へ進めません。`
                )}
              </p>
            </div>
            <button
              type="button"
              id="quick-fill-standard-gross"
              onClick={() => dispatch({ type: "SET_GROSS", amount: 180000n })}
              className="px-3 py-1.5 bg-amber-500/25 hover:bg-amber-500/40 text-amber-100 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border border-amber-400/30 self-start sm:self-center"
            >
              {txt("Gunakan Standar ¥180.000", "Use Standard ¥180,000", "標準額 ¥180,000 を適用")}
            </button>
          </div>
        )}

      {/* JP Trainee Deductions List */}
      {state.pathway === "technical_intern" && !state.useManualNet && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-fg-70">
                {txt("Potongan Kontrak (賃金控除)", "Contract Deductions (賃金控除)", "給与天引き項目 (賃金控除)")}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(249, 134, 7, 0.15)",
                  border: "1px solid rgba(249, 134, 7, 0.3)",
                  color: "var(--highlight)",
                }}
              >
                {txt("Rincian Dari Kontrak / Slip", "Contract Breakdown", "雇用契約・明細書の控除内訳")}
              </span>
            </div>
          </div>

          {/* Quick Fill All Standard Deductions Button */}
          <button
            type="button"
            onClick={() => {
              const gross = state.grossMonthlyMinorUnits > 0n ? state.grossMonthlyMinorUnits : 180000n;
              if (state.grossMonthlyMinorUnits === 0n) {
                dispatch({ type: "SET_GROSS", amount: 180000n });
              }
              dispatch({ type: "SET_JP_DEDUCTION", field: "housingDeduction", value: 20000n });
              dispatch({ type: "SET_JP_DEDUCTION", field: "utilitiesDeduction", value: 8000n });
              dispatch({
                type: "SET_JP_DEDUCTION",
                field: "shakaiHokenDeduction",
                value: BigInt(Math.round(Number(gross) * 0.145)),
              });
              dispatch({
                type: "SET_JP_DEDUCTION",
                field: "employmentInsurance",
                value: BigInt(Math.round(Number(gross) * 0.006)),
              });
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[var(--accent-soft)] hover:bg-[var(--accent-soft)] border border-line-strong text-[var(--accent)] text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <span>✨</span>
            <span>
              {txt(
                "Isi Otomatis Estimasi Standar Jepang (Asrama ¥20rb, Listrik ¥8rb, Asuransi ~15%)",
                "Auto-fill Standard Contract Deductions (Dorm ¥20k, Utilities ¥8k, Insurance ~15%)",
                "日本の標準天引き額を一括自動入力 (寮費2万円・光熱費8千円・社保約15%)"
              )}
            </span>
          </button>

          {[
            {
              field: "housingDeduction" as const,
              labelId: "Tempat tinggal (住居費)",
              labelEn: "Housing (住居費)",
              labelJa: "宿舎費・寮費 (住居費)",
              hintId: "Standar asrama: ¥15.000 – ¥25.000",
              hintEn: "Standard dorm: ¥15,000 – ¥25,000",
              hintJa: "寮費相場: 15,000円〜25,000円",
              suggestions: [
                { label: txt("Asrama ¥20.000", "Dorm ¥20k", "寮費 20,000円"), val: 20000n },
                { label: txt("Sharehouse ¥35.000", "Sharehouse ¥35k", "シェアハウス 35,000円"), val: 35000n },
              ],
            },
            {
              field: "utilitiesDeduction" as const,
              labelId: "Listrik/air (光熱費)",
              labelEn: "Utilities (光熱費)",
              labelJa: "水道光熱費",
              hintId: "Rata-rata: ¥7.000 – ¥10.000",
              hintEn: "Average: ¥7,000 – ¥10,000",
              hintJa: "平均相場: 7,000円〜10,000円",
              suggestions: [
                { label: txt("Standar ¥8.000", "Standard ¥8k", "標準 8,000円"), val: 8000n },
                { label: txt("Hemat ¥5.000", "Frugal ¥5k", "節約 5,000円"), val: 5000n },
              ],
            },
            {
              field: "shakaiHokenDeduction" as const,
              labelId: "Shakai Hoken (社会保険)",
              labelEn: "Shakai Hoken (社会保険)",
              labelJa: "社会保険料 (健保・厚年)",
              hintId: "Standar hukum: ~14.5% dari gaji",
              hintEn: "Statutory standard: ~14.5% of gross",
              hintJa: "法定標準: 額面の約14.5%",
              suggestions: [
                {
                  label: `${txt("Hitung 14.5%", "Calc 14.5%", "14.5%自動計算")} (¥${Math.round(Number(state.grossMonthlyMinorUnits || 180000n) * 0.145).toLocaleString()})`,
                  val: BigInt(Math.round(Number(state.grossMonthlyMinorUnits || 180000n) * 0.145)),
                },
              ],
            },
            {
              field: "employmentInsurance" as const,
              labelId: "Koyo Hoken (雇用保険)",
              labelEn: "Employment Insurance (雇用保険)",
              labelJa: "雇用保険料",
              hintId: "Standar hukum: 0.6% (~¥1.000)",
              hintEn: "Statutory standard: 0.6% (~¥1,000)",
              hintJa: "法定標準: 額面の0.6% (約1,000円)",
              suggestions: [
                {
                  label: `${txt("Hitung 0.6%", "Calc 0.6%", "0.6%自動計算")} (¥${Math.round(Number(state.grossMonthlyMinorUnits || 180000n) * 0.006).toLocaleString()})`,
                  val: BigInt(Math.round(Number(state.grossMonthlyMinorUnits || 180000n) * 0.006)),
                },
              ],
            },
            {
              field: "mealsDeduction" as const,
              labelId: "Makan (食費)",
              labelEn: "Meals (食費)",
              labelJa: "給食費・社食代",
              hintId: "Jika katering majikan (¥0 jika masak sendiri)",
              hintEn: "If meals provided by employer",
              hintJa: "受入先提供の場合 (自炊は0円)",
              suggestions: [
                { label: txt("¥0 (Masak Sendiri)", "¥0 (Self cook)", "0円 (自炊)"), val: 0n },
                { label: txt("Katering ¥15.000", "Catering ¥15k", "給食 15,000円"), val: 15000n },
              ],
            },
            {
              field: "otherDeductions" as const,
              labelId: "Lain-lain",
              labelEn: "Other deductions",
              labelJa: "その他控除 (親睦会・Wi-Fi等)",
              hintId: "WiFi asrama / seragam / paguyuban",
              hintEn: "WiFi / uniform / misc",
              hintJa: "寮Wi-Fi・制服・組合費等",
              suggestions: [
                { label: "¥0", val: 0n },
                { label: "¥3.000", val: 3000n },
              ],
            },
          ].map(({ field, labelId, labelEn, labelJa, hintId, hintEn, hintJa, suggestions }) => (
            <div key={field} className="space-y-1.5">
              <CurrencyInput
                id={`deduction-${field}`}
                label={locale === "ja" ? labelJa : locale === "en" ? labelEn : labelId}
                value={state.japaneseDeductions[field]}
                onChange={(v) => dispatch({ type: "SET_JP_DEDUCTION", field, value: v })}
                currency="JPY"
                locale={locale}
                placeholder="0"
                hint={locale === "ja" ? hintJa : locale === "en" ? hintEn : hintId}
              />
              <div className="flex flex-wrap gap-1.5 pl-1">
                {suggestions.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => dispatch({ type: "SET_JP_DEDUCTION", field, value: s.val })}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-all ${
                      state.japaneseDeductions[field] === s.val
                        ? "bg-[var(--accent-soft)] border-[var(--accent)]/50 text-[var(--accent)] font-semibold"
                        : "bg-panel-2 border-line text-fg-muted hover:text-fg-80 hover:bg-panel-2"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Net Preview */}
      {computedNet && (state.grossMonthlyMinorUnits > 0n || state.manualNetMonthlyMinorUnits > 0n) && (
        <div
          className="rounded-xl p-4"
          style={{
            background: "rgba(40, 144, 109, 0.1)",
            border: "1px solid rgba(40, 144, 109, 0.3)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-fg-muted mb-0.5">
                {txt("Estimasi Gaji Bersih / Net Take-Home", "Estimated Net Salary", "手取り概算 (差引支給額)")}
              </p>
              <p className="text-xl font-bold text-gradient-brand">
                {formatCurrency(netMonthly, currency, currencyLocale)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-fg-muted mb-0.5">
                {txt("Potongan efektif", "Effective deduction", "実質控除率")}
              </p>
              <p className="text-sm font-semibold text-fg-70">
                {Math.round(computedNet.effectiveDeductionRate * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons & feedback */}
      <div className="space-y-3">
        {!canProceed && (
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 text-center font-medium">
            {state.useManualNet
              ? txt(
                  "⚠️ Masukkan Gaji Bersih (dari slip) atau Gaji Kotor untuk melanjutkan",
                  "⚠️ Please enter Net Pay or Gross Income to continue",
                  "⚠️ 次へ進むには手取り額または額面給与を入力してください"
                )
              : txt(
                  "⚠️ Masukkan Gaji Kotor / Gakumen di atas untuk melanjutkan ke langkah berikutnya",
                  "⚠️ Please enter Gross Income / Gakumen above to continue",
                  "⚠️ 次へ進むには上記の額面給与を入力してください"
                )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            id="wizard-step3-back"
            type="button"
            onClick={onBack}
            className="btn-secondary flex-1 py-3"
          >
            ← {txt("Kembali", "Back", "戻る")}
          </button>
          <button
            id="wizard-step3-next"
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className={`btn-primary flex-[2] py-3 ${
              !canProceed ? "opacity-40 cursor-not-allowed" : ""
            }`}
          >
            {txt("Lanjut →", "Continue →", "次へ進む →")}
          </button>
        </div>
      </div>
    </div>
  );
}
