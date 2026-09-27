"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currencyContext";
import { calculateActiveDeductions } from "@bandinghidup/core";
import { ShareResultCardModal } from "@/components/common/ShareResultCardModal";

export type PathwayPreset = "kenshusei" | "ausbildung" | "indonesia";

interface PresetData {
  id: PathwayPreset;
  countryCode: "DE" | "JP" | "ID";
  flag: string;
  name: { id: string; en: string; de: string; ja: string };
  badge: { id: string; en: string; de: string; ja: string };
  currency: "EUR" | "JPY" | "IDR";
  currencySymbol: string;
  defaultGross: number;
  minGross: number;
  maxGross: number;
  stepGross: number;
  deductionRate: number; // baseline fallback percentage
  defaultRent: number;
  defaultLiving: number;
  rentLabel: { id: string; en: string; de: string; ja: string };
  stapleMeal: {
    name: { id: string; en: string; de: string; ja: string };
    price: number;
  };
}

const PRESETS: Record<PathwayPreset, PresetData> = {
  kenshusei: {
    id: "kenshusei",
    countryCode: "JP",
    flag: "🇯🇵",
    name: {
      id: "Kenshusei / Tokutei Jepang",
      en: "Technical Intern Japan",
      de: "Kenshusei / Tokutei (JP)",
      ja: "日本 技能実習・特定技能",
    },
    badge: {
      id: "Praktek Kerja",
      en: "Intern / Trainee",
      de: "Fachpraktikum",
      ja: "技能実習",
    },
    currency: "JPY",
    currencySymbol: "¥",
    defaultGross: 180000,
    minGross: 100000,
    maxGross: 500000,
    stepGross: 5000,
    deductionRate: 0.165,
    defaultRent: 35000,
    defaultLiving: 35000,
    rentLabel: {
      id: "Asrama / Apato Perusahaan",
      en: "Company Dormitory",
      de: "Wohnheim / Firmenappartment",
      ja: "会社寮・アパート",
    },
    stapleMeal: {
      name: {
        id: "mangkuk Gyudon",
        en: "bowls of gyudon",
        de: "Gyudon-Schalen",
        ja: "ラーメン",
      },
      price: 600, // ¥600
    },
  },
  ausbildung: {
    id: "ausbildung",
    countryCode: "DE",
    flag: "🇩🇪",
    name: {
      id: "Ausbildung Jerman",
      en: "Ausbildung Germany",
      de: "Duale Ausbildung (DE)",
      ja: "ドイツ 職業訓練",
    },
    badge: {
      id: "Magang Vokasi",
      en: "Vocational",
      de: "Auszubildende",
      ja: "職業訓練生",
    },
    currency: "EUR",
    currencySymbol: "€",
    defaultGross: 1100,
    minGross: 500,
    maxGross: 5000,
    stepGross: 50,
    deductionRate: 0.205,
    defaultRent: 420,
    defaultLiving: 260,
    rentLabel: {
      id: "Kamar Bersama (WG)",
      en: "Shared Flat (WG)",
      de: "WG-Zimmer (Warmmiete)",
      ja: "ルームシェア (WG)",
    },
    stapleMeal: {
      name: {
        id: "porsi Döner Kebab / makan hangat",
        en: "warm Döner / staple meals",
        de: "Döner / warme Mahlzeiten",
        ja: "ケバブ・定食",
      },
      price: 7.5, // €7.50
    },
  },
  indonesia: {
    id: "indonesia",
    countryCode: "ID",
    flag: "🇮🇩",
    name: {
      id: "Fresh Grad S1 Jakarta",
      en: "Fresh Grad Jakarta",
      de: "Berufseinsteiger Jakarta",
      ja: "ジャカルタ 大卒初任給",
    },
    badge: {
      id: "Pekerja Pemula",
      en: "Entry Level",
      de: "Einsteiger",
      ja: "新卒採用",
    },
    currency: "IDR",
    currencySymbol: "Rp",
    defaultGross: 6500000,
    minGross: 2000000,
    maxGross: 50000000,
    stepGross: 500000,
    deductionRate: 0.04,
    defaultRent: 1900000,
    defaultLiving: 2400000,
    rentLabel: {
      id: "Kamar Kost Mandiri",
      en: "Rented Room (Kost)",
      de: "Kost-Zimmer (Miete)",
      ja: "単身用賃貸（Kost）",
    },
    stapleMeal: {
      name: {
        id: "porsi Nasi Padang / Ayam",
        en: "Nasi Padang / staple meals",
        de: "Nasi Padang Mahlzeiten",
        ja: "ナシパダン定食",
      },
      price: 25000, // Rp 25.000
    },
  },
};

interface QuickHeroSimulatorProps {
  selectedPathway?: PathwayPreset;
  onPathwayChange?: (pathway: PathwayPreset) => void;
}

export function QuickHeroSimulator({
  selectedPathway,
  onPathwayChange,
}: QuickHeroSimulatorProps) {
  const { locale } = useI18n();
  const { exchangeRates } = useCurrency();

  const txt = (idStr: string, enStr: string, deStr: string, jaStr: string) => {
    if (locale === "de") return deStr;
    if (locale === "ja") return jaStr;
    if (locale === "en") return enStr;
    return idStr;
  };

  const [internalPathway, setInternalPathway] = useState<PathwayPreset>(
    selectedPathway || "kenshusei"
  );

  const activePathway = selectedPathway || internalPathway;
  const preset = PRESETS[activePathway];

  useEffect(() => {
    if (selectedPathway && selectedPathway !== internalPathway) {
      setInternalPathway(selectedPathway);
      const p = PRESETS[selectedPathway];
      setGrossInput(p.defaultGross);
      setRentCost(p.defaultRent);
      setLivingCost(p.defaultLiving);
    }
  }, [selectedPathway, internalPathway]);

  const [grossInput, setGrossInput] = useState<number>(preset.defaultGross);
  const [rentCost, setRentCost] = useState<number>(preset.defaultRent);
  const [livingCost, setLivingCost] = useState<number>(preset.defaultLiving);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Listen for scenario reload events from SavedScenarios component
  useEffect(() => {
    const handleLoadScenario = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { pathway, gross, rent, living } = customEvent.detail;
        if (pathway && PRESETS[pathway as PathwayPreset]) {
          if (onPathwayChange) {
            onPathwayChange(pathway as PathwayPreset);
          }
          setInternalPathway(pathway as PathwayPreset);
        }
        if (typeof gross === "number") setGrossInput(gross);
        if (typeof rent === "number") setRentCost(rent);
        if (typeof living === "number") setLivingCost(living);
      }
    };

    window.addEventListener("bandinghidup:load-scenario", handleLoadScenario);
    return () => {
      window.removeEventListener("bandinghidup:load-scenario", handleLoadScenario);
    };
  }, [onPathwayChange]);

  // When changing preset, reset numbers
  const handleSelectPreset = (key: PathwayPreset) => {
    if (onPathwayChange) {
      onPathwayChange(key);
    }
    setInternalPathway(key);
    const p = PRESETS[key];
    setGrossInput(p.defaultGross);
    setRentCost(p.defaultRent);
    setLivingCost(p.defaultLiving);
  };

  const handleSaveScenario = () => {
    try {
      const stored = localStorage.getItem("bandinghidup_saved_scenarios");
      const currentList = stored ? JSON.parse(stored) : [];
      const newScenario = {
        id: `sc_${Date.now()}`,
        label: `${preset.name[locale] || preset.name.en}`,
        pathway: activePathway,
        gross: grossInput,
        rent: rentCost,
        living: livingCost,
        currencySymbol: preset.currencySymbol,
        netSavingsText: `${preset.currencySymbol}${remainingSavings.toLocaleString()}`,
        savedAt: new Date().toISOString(),
      };
      const updated = [newScenario, ...currentList.filter((s: any) => s.pathway !== activePathway)].slice(0, 3);
      localStorage.setItem("bandinghidup_saved_scenarios", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("bandinghidup:scenario-saved"));
      setSaveSuccessMsg(txt("Tersimpan!", "Saved!", "Gespeichert!", "保存完了!"));
      setTimeout(() => setSaveSuccessMsg(""), 2500);
    } catch {}
  };

  // Realistic Multi-Country Progressive Deductions Engine
  const deductionResult = useMemo(() => {
    try {
      const minorUnits = BigInt(
        preset.currency === "EUR" ? Math.round(grossInput * 100) : Math.round(grossInput)
      );
      return calculateActiveDeductions({
        country: preset.countryCode,
        grossMonthlyMinorUnits: minorUnits,
        taxClassDE: 1, // Single Steuerklasse 1
        familyStatus: "single",
        isJapanSecondYear: false, // 1st year Kenshusei
        ptkpStatusID: "TK/0",
      });
    } catch {
      const fallbackDed = Math.round(grossInput * preset.deductionRate);
      return {
        totalDeductionsMajor: fallbackDed,
        netMonthlyMajor: Math.max(0, grossInput - fallbackDed),
        effectiveDeductionRate: preset.deductionRate,
      };
    }
  }, [grossInput, preset.countryCode, preset.currency, preset.deductionRate]);

  const mandatoryDeduction = Math.round(deductionResult.totalDeductionsMajor);
  const netTakeHome = Math.max(0, Math.round(deductionResult.netMonthlyMajor));
  const effectiveDeductionPct = Math.round(deductionResult.effectiveDeductionRate * 100);

  const totalExpenses = rentCost + livingCost;
  const remainingSavings = netTakeHome - totalExpenses;

  // Percentage breakdown for stacked bar
  const taxPct = Math.min(100, Math.max(1, Math.round((mandatoryDeduction / grossInput) * 100)));
  const rentPct = Math.min(100, Math.max(1, Math.round((rentCost / grossInput) * 100)));
  const livingPct = Math.min(100, Math.max(1, Math.round((livingCost / grossInput) * 100)));
  const savingsPct = 100 - taxPct - rentPct - livingPct;

  // Real Purchasing Power Equivalent (Indeks Kenyang)
  const savingsMeals = Math.max(0, Math.round(remainingSavings / preset.stapleMeal.price));
  const netMeals = Math.max(0, Math.round(netTakeHome / preset.stapleMeal.price));

  // Rupiah conversions (Nominal FX only)
  const toRupiahRate = useMemo(() => {
    if (!exchangeRates || !exchangeRates.rates) {
      if (preset.currency === "EUR") return 17200;
      if (preset.currency === "JPY") return 105.2;
      return 1;
    }
    const eurToIdr = exchangeRates.rates["IDR"] ?? 17200;
    if (preset.currency === "EUR") return eurToIdr;
    if (preset.currency === "JPY") {
      const eurToJpy = exchangeRates.rates["JPY"] ?? 163.5;
      return eurToIdr / eurToJpy;
    }
    return 1;
  }, [exchangeRates, preset.currency]);

  const savingsInIdr = Math.round(remainingSavings * toRupiahRate);
  const netTakeHomeInIdr = Math.round(netTakeHome * toRupiahRate);

  // Format currency helpers
  const fmt = (val: number, curr = preset.currency) => {
    if (curr === "IDR") {
      return `Rp ${Math.abs(val).toLocaleString("id-ID")}`;
    }
    if (curr === "JPY") {
      return `¥${Math.abs(val).toLocaleString("id-ID")}`;
    }
    return `€${Math.abs(val).toLocaleString("de-DE")}`;
  };

  const fmtIdr = (val: number) => {
    const abs = Math.abs(val);
    if (abs >= 1_000_000) {
      return `Rp ${(abs / 1_000_000).toFixed(1)} Juta`;
    }
    return `Rp ${abs.toLocaleString("id-ID")}`;
  };

  // Status Badge Logic
  const statusConfig = useMemo(() => {
    if (remainingSavings > (preset.currency === "IDR" ? 1500000 : preset.currency === "JPY" ? 40000 : 150)) {
      return {
        label: txt("🟢 Aman & Bisa Nabung", "🟢 Healthy Savings", "🟢 Solide & Sparfähig", "🟢 貯蓄可能・余裕あり"),
        desc: txt(
          `Bisa kirim sekitar ${fmtIdr(savingsInIdr)}/bln ke orang tua di Indonesia.`,
          `Estimated ~${fmtIdr(savingsInIdr)}/mo available for remittances.`,
          `Ermöglicht monatliche Ersparnisse/Rücküberweisungen von ca. ${fmtIdr(savingsInIdr)}.`,
          `毎月約${fmtIdr(savingsInIdr)}相当の貯蓄・本国送金が視野に入ります。`
        ),
        colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    }
    if (remainingSavings >= 0) {
      return {
        label: txt("🟡 Pas-pasan / Kritis", "🟡 Tight Margin", "🟡 Knappes Budget", "🟡 収支均衡・余裕少"),
        desc: txt(
          "Cukup untuk hidup mandiri, tapi minim tabungan darurat.",
          "Covers living costs but leaves minimal emergency buffer.",
          "Deckt die Kosten, bietet aber kaum Notfallreserve.",
          "自活は可能ですが、突発的な出費に備える余裕は少なめです。"
        ),
        colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    }
    return {
      label: txt("🔴 Defisit / Kurang", "🔴 Deficit Warning", "🔴 Defizit", "🔴 赤字・要見直し"),
      desc: txt(
        "Biaya hidup melampaui sisa uang saku bersih Anda!",
        "Living expenses exceed your net take-home allowance!",
        "Lebenshaltungskosten übersteigen Ihre Nettovergütung!",
        "手取り収入より固定費・生活費が上回っています！"
      ),
      colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    };
  }, [remainingSavings, preset.currency, locale, savingsInIdr]);

  // Localized WhatsApp share link pointing to compare.t-agung.id
  const whatsappShareUrl = useMemo(() => {
    const currentName = preset.name[locale] ?? preset.name.en;
    const url = "https://compare.t-agung.id";
    const textId =
      `Halo! Aku baru cek simulasi penghasilan ${preset.name.id} di BandingHidup:\n\n` +
      `• Gaji Kotor: ${fmt(grossInput)}\n` +
      `• Gaji Bersih: ${fmt(netTakeHome)} (~${fmtIdr(netTakeHomeInIdr)} nominal kurs)\n` +
      `• Sewa Kamar: ${fmt(rentCost)}\n` +
      `• Kebutuhan Hidup: ${fmt(livingCost)}\n` +
      `• Sisa Tabungan: ${remainingSavings >= 0 ? "+" : "-"}${fmt(remainingSavings)} (Daya beli: ~${savingsMeals} ${preset.stapleMeal.name.id}/bln)\n\n` +
      `Cek selengkapnya di: ${url}`;

    const textEn =
      `BandingHidup living cost simulation for ${currentName}:\n\n` +
      `• Gross Pay: ${fmt(grossInput)}\n` +
      `• Net Take-Home: ${fmt(netTakeHome)} (~${fmtIdr(netTakeHomeInIdr)} FX-only)\n` +
      `• Housing Rent: ${fmt(rentCost)}\n` +
      `• Living Essentials: ${fmt(livingCost)}\n` +
      `• Est. Savings: ${remainingSavings >= 0 ? "+" : "-"}${fmt(remainingSavings)} (Purchasing power: ~${savingsMeals} ${preset.stapleMeal.name.en}/mo)\n\n` +
      `Explore details: ${url}`;

    const textDe =
      `BandingHidup Lebenshaltungsvergleich für ${currentName}:\n\n` +
      `• Bruttogehalt: ${fmt(grossInput)}\n` +
      `• Netto-Auszahlung: ${fmt(netTakeHome)}\n` +
      `• Warmmiete: ${fmt(rentCost)}\n` +
      `• Lebenshaltung: ${fmt(livingCost)}\n` +
      `• Monatliche Ersparnis: ${remainingSavings >= 0 ? "+" : "-"}${fmt(remainingSavings)} (Kaufkraft: ~${savingsMeals} ${preset.stapleMeal.name.de}/Monat)\n\n` +
      `Vollständiger Rechner: ${url}`;

    const textJa =
      `BandingHidup 生活費・手取り試算（${currentName}）:\n\n` +
      `• 額面総支給: ${fmt(grossInput)}\n` +
      `• 手取り概算: ${fmt(netTakeHome)}\n` +
      `• 家賃: ${fmt(rentCost)}\n` +
      `• 生活費: ${fmt(livingCost)}\n` +
      `• 毎月の貯蓄余力: ${remainingSavings >= 0 ? "+" : "-"}${fmt(remainingSavings)}（実質購買力: 約${savingsMeals}${preset.stapleMeal.name.ja}/月）\n\n` +
      `詳細シミュレーター: ${url}`;

    const text = txt(textId, textEn, textDe, textJa);
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [grossInput, netTakeHome, rentCost, livingCost, remainingSavings, savingsMeals, preset, locale, netTakeHomeInIdr]);

  return (
    <div id="quick-simulator" className="tagung-card p-5 sm:p-6 space-y-5">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-pulse" />
          <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider font-mono">
            {txt(
              "⚡ Simulator Kilat Realistis",
              "⚡ Instant Realistic Simulator",
              "⚡ Realistischer Schnellrechner",
              "⚡ リアルタイム簡易試算"
            )}
          </span>
        </div>
        <div className="text-[11px] text-[var(--soft)] font-mono">
          {txt("Data Resmi 2026", "Official 2026 Data", "Datenstand 2026", "2026年公的統計")}
        </div>
      </div>

      {/* Preset Selector Segmented Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
        {(["kenshusei", "ausbildung", "indonesia"] as PathwayPreset[]).map((key) => {
          const p = PRESETS[key];
          const isSelected = activePathway === key;
          const labelName = p.name[locale] ?? p.name.en;
          const badgeName = p.badge[locale] ?? p.badge.en;
          return (
            <button
              key={key}
              type="button"
              id={`preset-btn-${key}`}
              onClick={() => handleSelectPreset(key)}
              className={`py-2 px-2.5 rounded-lg flex flex-col items-center justify-center gap-0.5 text-center transition-all ${
                isSelected
                  ? "bg-[var(--accent)] text-white shadow-md font-bold scale-[1.02]"
                  : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]"
              }`}
            >
              <span className="text-base leading-none">{p.flag}</span>
              <span className="text-[11px] truncate max-w-full font-medium">
                {labelName.split(" ")[0]}
              </span>
              <span className="text-[9px] opacity-75 hidden sm:inline">
                {badgeName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Gross Allowance Input & Slider */}
      <div className="space-y-3 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
        <div className="flex items-center justify-between">
          <label htmlFor="gross-slider" className="text-xs font-medium text-[var(--muted)]">
            {txt("Gaji Kotor", "Gross Salary", "Bruttogehalt", "額面総支給")}
          </label>
          <span className="text-base font-bold font-mono text-[var(--text)]">
            {fmt(grossInput)}
            <span className="text-xs font-normal text-[var(--muted)] ml-1">
              {txt("/bln", "/mo", "/Monat", "/月")}
            </span>
          </span>
        </div>

        {/* Range Slider */}
        <input
          id="gross-slider"
          type="range"
          min={preset.minGross}
          max={preset.maxGross}
          step={preset.stepGross}
          value={grossInput}
          onChange={(e) => setGrossInput(Number(e.target.value))}
          className="w-full cursor-pointer h-2 rounded-lg bg-[var(--surface-3)]"
          style={{ accentColor: "var(--accent)" }}
          aria-label={txt("Geser gaji kotor", "Slide gross allowance", "Bruttogehalt anpassen", "額面給与スライダー")}
        />

        <div className="flex justify-between text-[10px] font-mono text-[var(--soft)]">
          <span>{fmt(preset.minGross)}</span>
          <span className="text-[var(--accent)] font-semibold">
            {txt("Geser untuk Ubah", "Drag to adjust", "Schieberegler bewegen", "スライドで調整")}
          </span>
          <span>{fmt(preset.maxGross)}</span>
        </div>
      </div>

      {/* Net Remaining Savings Headline Highlight Card */}
      <div
        className="p-4 rounded-xl border space-y-2.5"
        style={{
          background:
            remainingSavings >= 0
              ? "var(--accent-soft)"
              : "rgba(239, 68, 68, 0.1)",
          borderColor:
            remainingSavings >= 0
              ? "var(--border-strong)"
              : "rgba(239, 68, 68, 0.35)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text)]">
            {txt(
              "💰 Sisa Uang Tabungan Bulanan:",
              "💰 Est. Monthly Net Savings:",
              "💰 Monatliche Ersparnis / Reserve:",
              "💰 毎月の実質貯蓄可能額:"
            )}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.colorClass}`}
          >
            {statusConfig.label}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--text)]">
            {remainingSavings >= 0 ? "+" : "-"}
            {fmt(remainingSavings)}
            <span className="text-xs font-normal text-[var(--muted)] ml-1">
              {txt("/bln", "/mo", "/Monat", "/月")}
            </span>
          </div>
          <div className="text-xs font-mono text-[var(--muted)] text-right">
            <span>
              ≈ {remainingSavings >= 0 ? "+" : "-"}
              {fmtIdr(savingsInIdr)}
            </span>
            <span className="text-[9px] text-[var(--soft)] block">
              {txt(
                "(nominal kurs saja · bukan daya beli)",
                "(nominal FX only · not PPP)",
                "(nur nominaler Kurs · keine Kaufkraft)",
                "(名目為替換算・実質購買力ではありません)"
              )}
            </span>
          </div>
        </div>

        {/* Primary Purchasing Power Metric Highlight (Indeks Kenyang) */}
        <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-[11px]">
          <span className="text-[var(--text)] font-medium flex items-center gap-1.5">
            <span>🍽️</span>
            <span>
              {txt(
                "Daya Beli Nyata (Indeks Kenyang):",
                "Real Purchasing Power (Food Index):",
                "Monatliche Realkaufkraft:",
                "月間実質購買力（満腹指数）:"
              )}
            </span>
          </span>
          <span className="font-mono font-bold text-[var(--accent)] text-xs">
            ~{savingsMeals} {preset.stapleMeal.name[locale] ?? preset.stapleMeal.name.en}
          </span>
        </div>

        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
          {statusConfig.desc}
        </p>

        {/* One-Line Pointer to Gaji Setara */}
        <div className="pt-0.5">
          <Link
            href="/gaji-setara"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent)] hover:underline"
          >
            <span>
              {txt(
                "💡 Ingin bandingkan daya beli riil antar kota? Coba Kalkulator Gaji Setara",
                "💡 Want to compare real purchasing power across cities? Try Salary Equivalent",
                "💡 Reale Kaufkraft zwischen Städten vergleichen? Gehaltsäquivalent öffnen",
                "💡 都市間の実質購買力を正確に比較？ 購買力平価（Gaji Setara）へ"
              )}
            </span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Progressive Disclosure Toggle Button */}
      <button
        type="button"
        id="quick-simulator-toggle-details"
        onClick={() => setShowDetails(!showDetails)}
        className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs text-[var(--accent)] font-medium flex items-center justify-between transition-colors cursor-pointer"
        aria-expanded={showDetails}
      >
        <span className="flex items-center gap-1.5">
          <span className="text-[10px]">{showDetails ? "▲" : "▼"}</span>
          <span>
            {showDetails
              ? txt(
                  "Sembunyikan Rincian Alokasi",
                  "Hide Allocation Details",
                  "Aufteilungsdetails ausblenden",
                  "内訳詳細を閉じる"
                )
              : txt(
                  "Lihat detail ▾ (Alokasi, Pajak & Sewa)",
                  "Show details ▾ (Breakdown, Taxes & Rent)",
                  "Details anzeigen ▾ (Steuern, Miete, Essen)",
                  "内訳詳細を表示 ▾"
                )}
          </span>
        </span>
        <span className="text-[10px] text-[var(--soft)] font-mono">
          {showDetails ? "−" : "+"}
        </span>
      </button>

      {/* Collapsible Secondary Details */}
      {showDetails && (
        <div className="space-y-4 pt-1 animate-fade-in">
          {/* Visual Stacked Expense Split Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] text-[var(--muted)]">
              <span>
                {txt(
                  "Alokasi Gaji & Pengeluaran:",
                  "Where Money Goes:",
                  "Aufteilung Ihrer Vergütung:",
                  "総支給額の配分内訳:"
                )}
              </span>
              <span className="font-mono text-[var(--accent)] font-semibold">
                {txt("Gaji Bersih: ", "Net: ", "Netto: ", "手取り: ")}
                {fmt(netTakeHome)}
              </span>
            </div>

            <div className="w-full h-3 bg-[var(--surface-3)] rounded-full overflow-hidden flex shadow-inner border border-[var(--border)]">
              <div
                style={{ width: `${taxPct}%` }}
                className="h-full bg-red-400 transition-all duration-300"
                title={`Pajak & Jaminan Sosial: ~${taxPct}%`}
              />
              <div
                style={{ width: `${rentPct}%` }}
                className="h-full bg-purple-400 transition-all duration-300"
                title={`Biaya Sewa: ~${rentPct}%`}
              />
              <div
                style={{ width: `${livingPct}%` }}
                className="h-full bg-amber-400 transition-all duration-300"
                title={`Biaya Makan & Hidup: ~${livingPct}%`}
              />
              <div
                style={{ width: `${Math.max(0, savingsPct)}%` }}
                className="h-full bg-teal-400 transition-all duration-300"
                title={`Sisa Tabungan: ~${Math.max(0, savingsPct)}%`}
              />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-[10px] text-[var(--soft)] pt-0.5 flex-wrap gap-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                <span>{txt("Pajak/Asuransi", "Tax/Deductions", "Steuer/Abzüge", "税・社会保険")} (~{taxPct}%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                <span>{txt("Sewa", "Rent", "Warmmiete", "家賃・寮費")} (~{rentPct}%)</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span>{txt("Makan", "Living", "Lebenshaltung", "食費・生活")} (~{livingPct}%)</span>
              </span>
              <span className="flex items-center gap-1 font-semibold text-[var(--accent)]">
                <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                <span>{txt("Tabungan", "Savings", "Ersparnis", "貯蓄・送金")} (~{Math.max(0, savingsPct)}%)</span>
              </span>
            </div>
          </div>

          {/* Main Breakdown Numbers Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Net Take-Home */}
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
              <div className="text-[11px] text-[var(--muted)]">
                {txt(
                  "💵 Gaji Bersih Masuk Rekening",
                  "💵 Net Take-Home Pay",
                  "💵 Netto-Auszahlung",
                  "💵 手取り額（差引支給額）"
                )}
              </div>
              <div className="text-base font-bold text-[var(--text)] font-mono">
                {fmt(netTakeHome)}
              </div>
              <div className="text-[10px] text-[var(--accent)] font-mono font-medium">
                ≈ {netMeals} {preset.stapleMeal.name[locale] ?? preset.stapleMeal.name.en}
              </div>
              <div className="text-[10px] text-[var(--soft)] font-mono">
                ≈ {fmtIdr(netTakeHomeInIdr)}{" "}
                <span className="text-[9px] opacity-75">
                  {txt("(kurs saja)", "(FX only)", "(nur Kurs)", "(名目換算)")}
                </span>
              </div>
            </div>

            {/* Rent & Living Total */}
            <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1">
              <div className="text-[11px] text-[var(--muted)]">
                {txt(
                  "🏠 Sewa & Kebutuhan Pokok",
                  "🏠 Rent & Living Expenses",
                  "🏠 Warmmiete & Lebensbedarf",
                  "🏠 家賃＋基本生活費"
                )}
              </div>
              <div className="text-base font-bold text-[var(--text)] font-mono">
                - {fmt(totalExpenses)}
              </div>
              <div className="text-[10px] text-[var(--soft)] truncate">
                {preset.rentLabel[locale] ?? preset.rentLabel.en}
              </div>
              <div className="text-[10px] text-[var(--soft)] font-mono">
                {txt("Sewa", "Rent", "Miete", "家賃")} {fmt(rentCost)} + {txt("Makan", "Food", "Essen", "食費")} {fmt(livingCost)}
              </div>
            </div>
          </div>

          {/* Assumptions Note */}
          <div className="text-[10px] text-[var(--soft)] pt-2 border-t border-[var(--border)] leading-relaxed">
            {preset.countryCode === "DE"
              ? txt(
                  `*Asumsi Jerman: Status lajang (Steuerklasse 1), potongan progresif Lohnsteuer (PPh) + Asuransi Sosial wajib (Kranken-/Renten-/Arbeitslosen-/Pflegeversicherung total ~${effectiveDeductionPct}%). Masak sendiri & tinggal di WG.`,
                  `*Germany Assumptions: Single (Tax Class 1), progressive income tax + statutory social security (~${effectiveDeductionPct}% total deduction). Self-cooking & shared flat (WG).`,
                  `*Annahmen Deutschland: Steuerklasse 1 (ledig), progressive Lohnsteuer + gesetzliche Sozialversicherung (~${effectiveDeductionPct}% Gesamtabzug). Selbstkochen & WG-Zimmer.`,
                  `*ドイツ前提条件: 独身（税区分1級）、累進所得税＋公的社会保険料（総控除率 約${effectiveDeductionPct}%）。WGシェアハウス入居・自炊生活。`
                )
              : preset.countryCode === "JP"
              ? txt(
                  `*Asumsi Jepang: Kenshusei / Tokutei tahun ke-1 (bebas pajak penduduk Juminzei), asuransi Shakai Hoken & Koyo Hoken (~${effectiveDeductionPct}%). Asrama pabrik & masak sendiri.`,
                  `*Japan Assumptions: Trainee 1st year (resident tax exempt), Shakai Hoken & employment insurance (~${effectiveDeductionPct}%). Company dorm & self-cooking.`,
                  `*Annahmen Japan: 1. Praktikumsjahr (keine Einwohnersteuer), Sozialversicherung & Arbeitslosenversicherung (~${effectiveDeductionPct}%). Firmenwohnheim & Selbstkochen.`,
                  `*日本前提条件: 技能実習・特定技能1年目（住民税非課税）、社会保険・雇用保険天引き（約${effectiveDeductionPct}%）。会社寮・自炊生活。`
                )
              : txt(
                  `*Asumsi Indonesia: Status PTKP TK/0, BPJS Ketenagakerjaan (JHT, JP) & Kesehatan + PPh 21 tarif efektif (~${effectiveDeductionPct}%). Kost mandiri.`,
                  `*Indonesia Assumptions: Single (TK/0), BPJS social security & effective PPh 21 income tax (~${effectiveDeductionPct}%). Rented room (Kost).`,
                  `*Annahmen Indonesien: Ledig (TK/0), gesetzliche Sozialabgaben & PPh 21 (~${effectiveDeductionPct}%). Kost-Zimmer.`,
                  `*インドネシア前提条件: 単身（扶養控除TK/0）、BPJS社会保険＋所得税実効税率（約${effectiveDeductionPct}%）。単身Kost賃貸。`
                )}
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="space-y-2 pt-1">
        <Link
          href="/wizard"
          id="hero-simulator-wizard-btn"
          className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
        >
          <span>
            {txt(
              "🚀 Buka Kalkulator Lengkap (7 Langkah)",
              "🚀 Open Full 7-Step Calculator",
              "🚀 Vollständigen 7-Schritte-Rechner öffnen",
              "🚀 7段階完全シミュレーターを開く"
            )}
          </span>
          <span>→</span>
        </Link>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/compare"
            id="hero-simulator-compare-btn"
            className="btn-secondary py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 text-center"
          >
            <span>⚖️</span>
            <span>
              {txt(
                "Bandingkan Jalur",
                "Compare Pathways",
                "Wege vergleichen",
                "キャリア経路を比較"
              )}
            </span>
          </Link>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            id="hero-simulator-whatsapp-btn"
            className="btn-secondary py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 text-center hover:border-emerald-500 hover:text-emerald-500"
            title={txt(
              "Kirim ringkasan ini ke WhatsApp Orang Tua / Teman",
              "Share summary via WhatsApp",
              "Zusammenfassung per WhatsApp teilen",
              "WhatsAppで共有"
            )}
          >
            <span>💬</span>
            <span>
              {txt("Kirim WhatsApp", "Share WhatsApp", "Per WhatsApp teilen", "WhatsApp共有")}
            </span>
          </a>
        </div>

        {/* Retention Actions: Save Scenario & Export Card PNG */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleSaveScenario}
            className="py-1.5 px-2.5 rounded-lg border border-line bg-panel-2 hover:bg-panel-3 text-[11px] font-medium text-[var(--accent)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>💾</span>
            <span>{saveSuccessMsg || txt("Simpan Skenario", "Save Scenario", "Szenario speichern", "シミュレーション保存")}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="py-1.5 px-2.5 rounded-lg border border-line bg-panel-2 hover:bg-panel-3 text-[11px] font-medium text-accent-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>✨</span>
            <span>{txt("Kartu Hasil PNG", "Result Card PNG", "Ergebniskarte", "結果カード出力")}</span>
          </button>
        </div>
      </div>

      {/* Share Card Modal (1080x1350 PNG) */}
      <ShareResultCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={{
          title: preset.name[locale] || preset.name.en,
          sourceCity: preset.countryCode === "ID" ? "Jakarta" : "Tokyo",
          sourceCountry: preset.countryCode === "ID" ? "Indonesia" : "Jepang",
          targetCity: preset.countryCode === "DE" ? "Berlin" : preset.countryCode === "JP" ? "Tokyo" : "Jakarta",
          targetCountry: preset.countryCode,
          grossSalaryText: `${preset.currencySymbol}${grossInput.toLocaleString()}`,
          netSalaryText: `${preset.currencySymbol}${netTakeHome.toLocaleString()}`,
          expensesText: `${preset.currencySymbol}${totalExpenses.toLocaleString()}`,
          savingsText: `${preset.currencySymbol}${remainingSavings.toLocaleString()}`,
          foodIndexText: `~${savingsMeals} ${preset.stapleMeal.name[locale] || preset.stapleMeal.name.en} / ${txt("bln", "mo", "M.", "月")}`,
          badgeText: `${txt("Gaji Bersih", "Net Salary", "Nettogehalt", "手取り")}: ${preset.currencySymbol}${netTakeHome.toLocaleString()} (${txt("Potongan", "Deductions", "Abzüge", "控除")} ~${effectiveDeductionPct}%)`,
          periodicityText: `${preset.name[locale] || preset.name.en} · ${txt("Per Bulan", "Monthly", "Monatlich", "月額")}`,
        }}
      />
    </div>
  );
}
