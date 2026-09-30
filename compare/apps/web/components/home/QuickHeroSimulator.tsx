"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currencyContext";
import {
  calculateActiveDeductions,
  calculateLifestyleEquivalenceSalary,
  calculateIncomePercentile,
  compareIncomePercentiles,
  type PercentileCountry,
  type FoodIndexType,
} from "@bandinghidup/core";
import { ShareResultCardModal } from "@/components/common/ShareResultCardModal";

// ─── Mode Types ─────────────────────────────────────────────────────────────
export type SimulatorMode = "perbandingan_gaji" | "jalur_pemula" | "persentil_gaji";

// ─── City Preset Configurations for "Perbandingan Gaji" ─────────────────────
export type QuickCityKey = "tokyo" | "jakarta" | "berlin";

export interface QuickCityConfig {
  key: QuickCityKey;
  country: "JP" | "ID" | "DE";
  city: string;
  flag: string;
  name: { id: string; en: string; de: string; ja: string };
  currency: "JPY" | "IDR" | "EUR";
  currencySymbol: string;
  minGross: number;
  maxGross: number;
  stepGross: number;
  defaultGross: number;
  rentLabel: { id: string; en: string; de: string; ja: string };
  stapleMeal: {
    name: { id: string; en: string; de: string; ja: string };
    price: number; // in major currency units
  };
  bigMacPrice: number; // in major currency units
  livingNote: { id: string; en: string; de: string; ja: string };
}

export const QUICK_CITIES: Record<QuickCityKey, QuickCityConfig> = {
  tokyo: {
    key: "tokyo",
    country: "JP",
    city: "Tokyo",
    flag: "🇯🇵",
    name: {
      id: "Tokyo, Jepang",
      en: "Tokyo, Japan",
      de: "Tokio, Japan",
      ja: "東京、日本",
    },
    currency: "JPY",
    currencySymbol: "¥",
    minGross: 100000,
    maxGross: 600000,
    stepGross: 5000,
    defaultGross: 180000,
    rentLabel: {
      id: "Asrama / Apato Perusahaan",
      en: "Company Dormitory",
      de: "Wohnheim / Firmenappartment",
      ja: "会社寮・アパート",
    },
    stapleMeal: {
      name: {
        id: "mangkuk Gyudon / Udon",
        en: "bowls of Gyudon / Udon",
        de: "Gyudon / Udon-Schalen",
        ja: "牛丼・うどん",
      },
      price: 620,
    },
    bigMacPrice: 540,
    livingNote: {
      id: "*Asumsi Tokyo: Kenshusei/pekerja pemula tinggal di asrama pabrik/apato subsidi, bebas pajak Juminzei thn ke-1, asuransi Shakai Hoken (~16.5%). Masak sendiri.",
      en: "*Tokyo Assumption: Factory dorm / company-subsidized apt, 1st-year resident tax exemption, Shakai Hoken (~16.5%). Self-cooking.",
      de: "*Annahme Tokio: Firmenwohnheim, 1. Jahr befreit von Einwohnersteuer, Sozialversicherung (~16,5%). Selbstkochen.",
      ja: "*東京前提: 会社寮・家賃補助あり、1年目住民税非課税、社会保険天引き（約16.5%）。自炊生活。",
    },
  },
  berlin: {
    key: "berlin",
    country: "DE",
    city: "Berlin",
    flag: "🇩🇪",
    name: {
      id: "Berlin, Jerman",
      en: "Berlin, Germany",
      de: "Berlin, Deutschland",
      ja: "ベルリン、ドイツ",
    },
    currency: "EUR",
    currencySymbol: "€",
    minGross: 800,
    maxGross: 6000,
    stepGross: 50,
    defaultGross: 1500,
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
      price: 7.5,
    },
    bigMacPrice: 5.2,
    livingNote: {
      id: "*Asumsi Berlin: Status lajang (Steuerklasse 1), potongan progresif Lohnsteuer & jaminan sosial wajib (~20.5%). Tinggal di WG (kamar bersama) & masak sendiri.",
      en: "*Berlin Assumption: Single (Tax Class 1), progressive income tax & statutory social security (~20.5%). Shared flat (WG) & self-cooking.",
      de: "*Annahme Berlin: Steuerklasse 1 (ledig), Lohnsteuer & Sozialversicherungsabzüge (~20,5%). WG-Zimmer & Selbstkochen.",
      ja: "*ベルリン前提: 独身（税区分1級）、所得税＋法定社会保険料（約20.5%）。WGシェアハウス入居・自炊生活。",
    },
  },
  jakarta: {
    key: "jakarta",
    country: "ID",
    city: "Jakarta",
    flag: "🇮🇩",
    name: {
      id: "Jakarta, Indonesia",
      en: "Jakarta, Indonesia",
      de: "Jakarta, Indonesien",
      ja: "ジャカルタ、インドネシア",
    },
    currency: "IDR",
    currencySymbol: "Rp",
    minGross: 3000000,
    maxGross: 35000000,
    stepGross: 250000,
    defaultGross: 8500000,
    rentLabel: {
      id: "Kamar Kost Mandiri",
      en: "Rented Room (Kost)",
      de: "Kost-Zimmer (Miete)",
      ja: "単身用賃貸（Kost）",
    },
    stapleMeal: {
      name: {
        id: "porsi Mie Ayam / Nasi Goreng",
        en: "Mie Ayam / Nasi Goreng meals",
        de: "Mie Ayam / Nasi Goreng Mahlzeiten",
        ja: "チキンヌードル/ナシゴレン定食",
      },
      price: 20000,
    },
    bigMacPrice: 42000,
    livingNote: {
      id: "*Asumsi Jakarta: Status PTKP TK/0, BPJS Ketenagakerjaan & Kesehatan serta PPh 21 tarif efektif (~4-5%). Kost mandiri dekat kantor/stasiun.",
      en: "*Jakarta Assumption: Single (TK/0), BPJS health & employment insurance, effective PPh 21 (~4-5%). Rented Kost room.",
      de: "*Annahme Jakarta: Ledig (TK/0), gesetzliche BPJS-Beiträge & PPh 21 (~4-5%). Privates Kost-Zimmer.",
      ja: "*ジャカルタ前提: 単身（扶養控除TK/0）、BPJS社会保険＋所得税実効税率（約4〜5%）。駅チカ単身Kost賃貸。",
    },
  },
};

// ─── Mode 2: "Jalur Karir Pemula" Legacy Presets ────────────────────────────
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
  deductionRate: number;
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
      price: 600,
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
      price: 7.5,
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
      price: 25000,
    },
  },
};

// ─── Family Status Options ──────────────────────────────────────────────────
export type FamilyCompositionKey = "single" | "married_0" | "married_1" | "married_2";

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

  // ── Mode Switch State (Default: Perbandingan Gaji) ──
  const [simulatorMode, setSimulatorMode] = useState<SimulatorMode>("perbandingan_gaji");

  // ── Mode 1 State: "Perbandingan Gaji" ──
  const [sourceCityKey, setSourceCityKey] = useState<QuickCityKey>("tokyo");
  const [targetCityKey, setTargetCityKey] = useState<QuickCityKey>("jakarta");
  const [familyStatus, setFamilyStatus] = useState<FamilyCompositionKey>("single");
  const [foodBenchmark, setFoodBenchmark] = useState<"street_food" | "big_mac">("street_food");

  const sourceCity = QUICK_CITIES[sourceCityKey];
  const targetCity = QUICK_CITIES[targetCityKey];

  const [compareGrossInput, setCompareGrossInput] = useState<number>(sourceCity.defaultGross);
  const [showAllocationDetails, setShowAllocationDetails] = useState<boolean>(false);
  const [showPercentileDetails, setShowPercentileDetails] = useState<boolean>(false);

  // Sync compare gross slider when source city changes
  const handleSourceCityChange = (newKey: QuickCityKey) => {
    setSourceCityKey(newKey);
    const cfg = QUICK_CITIES[newKey];
    setCompareGrossInput(cfg.defaultGross);
    // If target equals source, switch target automatically
    if (targetCityKey === newKey) {
      const candidates: QuickCityKey[] = (["jakarta", "berlin", "tokyo"] as QuickCityKey[]).filter(
        (k) => k !== newKey
      );
      setTargetCityKey(candidates[0] || "jakarta");
    }
  };

  const handleTargetCityChange = (newKey: QuickCityKey) => {
    setTargetCityKey(newKey);
    if (sourceCityKey === newKey) {
      const candidates: QuickCityKey[] = (["jakarta", "berlin", "tokyo"] as QuickCityKey[]).filter(
        (k) => k !== newKey
      );
      setSourceCityKey(candidates[0] || "tokyo");
      setCompareGrossInput(QUICK_CITIES[candidates[0] || "tokyo"].defaultGross);
    }
  };

  // Format currency helpers
  const fmtValue = (val: number, curr: "IDR" | "EUR" | "JPY") => {
    const abs = Math.abs(Math.round(val));
    if (curr === "IDR") return `Rp ${abs.toLocaleString("id-ID")}`;
    if (curr === "JPY") return `¥${abs.toLocaleString("id-ID")}`;
    return `€${abs.toLocaleString("de-DE")}`;
  };

  // ── Equivalence & Allocations Calculation for Mode 1 ──
  const compareEquivCalculation = useMemo(() => {
    try {
      const sourceMinor = BigInt(
        sourceCity.currency === "EUR"
          ? Math.round(compareGrossInput * 100)
          : Math.round(compareGrossInput)
      );

      const familyParam = {
        familyStatus: (familyStatus === "single"
          ? "single"
          : familyStatus === "married_0"
          ? "married"
          : "with_children") as any,
        numChildren: familyStatus === "married_2" ? 2 : familyStatus === "married_1" ? 1 : 0,
        taxClassDE: (familyStatus === "single" ? 1 : 3) as any,
        ptkpStatusID: (familyStatus === "single"
          ? "TK/0"
          : familyStatus === "married_0"
          ? "K/0"
          : familyStatus === "married_1"
          ? "K/1"
          : "K/2") as any,
      };

      const result = calculateLifestyleEquivalenceSalary({
        sourceCountry: sourceCity.country,
        sourceCityName: sourceCity.city,
        sourceGrossMonthlyMinorUnits: sourceMinor,
        targetCountry: targetCity.country,
        targetCityName: targetCity.city,
        indexType: foodBenchmark as FoodIndexType,
        familyStatus: familyParam.familyStatus,
        numChildren: familyParam.numChildren,
        taxClassDE: familyParam.taxClassDE,
        ptkpStatusID: familyParam.ptkpStatusID,
        housingType: "shared_room",
        equivalenceLogic: "same_savings",
      });

      return result;
    } catch (e) {
      // Fallback
      return null;
    }
  }, [
    compareGrossInput,
    sourceCity.city,
    sourceCity.country,
    sourceCity.currency,
    targetCity.city,
    targetCity.country,
    foodBenchmark,
    familyStatus,
  ]);

  // Percentiles for Source & Target in Mode 1
  const sourcePercentile = useMemo(() => {
    try {
      const sourceMinor = BigInt(
        sourceCity.currency === "EUR"
          ? Math.round(compareGrossInput * 100)
          : Math.round(compareGrossInput)
      );
      return calculateIncomePercentile(sourceMinor, sourceCity.country);
    } catch {
      return null;
    }
  }, [compareGrossInput, sourceCity.currency, sourceCity.country]);

  const targetPercentile = useMemo(() => {
    try {
      if (!compareEquivCalculation) return null;
      const targetMinor = BigInt(
        targetCity.currency === "EUR"
          ? Math.round(compareEquivCalculation.equivalentGrossMajor * 100)
          : Math.round(compareEquivCalculation.equivalentGrossMajor)
      );
      return calculateIncomePercentile(targetMinor, targetCity.country);
    } catch {
      return null;
    }
  }, [compareEquivCalculation, targetCity.currency, targetCity.country]);

  // Breakdown percentages for Stacked Bar 1 (Source)
  const sourceBreakdown = useMemo(() => {
    if (!compareEquivCalculation) {
      return { taxPct: 17, rentPct: 19, livingPct: 19, savingsPct: 45, netSalary: 0 };
    }
    const s = compareEquivCalculation.sourceSummary;
    const gross = s.grossMonthlyMajor || 1;
    const taxPct = Math.min(100, Math.max(1, Math.round((s.totalDeductionsMonthlyMajor / gross) * 100)));
    const rentPct = Math.min(100, Math.max(1, Math.round((s.rentMonthlyMajor / gross) * 100)));
    const livingPct = Math.min(
      100,
      Math.max(
        1,
        Math.round(
          ((s.foodMonthlyMajor + s.utilitiesMonthlyMajor + s.transportMonthlyMajor) / gross) * 100
        )
      )
    );
    const savingsPct = Math.max(0, 100 - taxPct - rentPct - livingPct);
    return { taxPct, rentPct, livingPct, savingsPct, netSalary: s.netMonthlyMajor };
  }, [compareEquivCalculation]);

  // Breakdown percentages for Stacked Bar 2 (Target)
  const targetBreakdown = useMemo(() => {
    if (!compareEquivCalculation) {
      return { taxPct: 17, rentPct: 19, livingPct: 19, savingsPct: 45, netSalary: 0 };
    }
    const t = compareEquivCalculation.targetSummary;
    const gross = t.grossMonthlyMajor || 1;
    const taxPct = Math.min(100, Math.max(1, Math.round((t.totalDeductionsMonthlyMajor / gross) * 100)));
    const rentPct = Math.min(100, Math.max(1, Math.round((t.rentMonthlyMajor / gross) * 100)));
    const livingPct = Math.min(
      100,
      Math.max(
        1,
        Math.round(
          ((t.foodMonthlyMajor + t.utilitiesMonthlyMajor + t.transportMonthlyMajor) / gross) * 100
        )
      )
    );
    const savingsPct = Math.max(0, 100 - taxPct - rentPct - livingPct);
    return { taxPct, rentPct, livingPct, savingsPct, netSalary: t.netMonthlyMajor };
  }, [compareEquivCalculation]);

  // Real purchasing power calculation
  const purchasingPowerText = useMemo(() => {
    if (!compareEquivCalculation) return "";
    const targetNet = compareEquivCalculation.targetSummary.netMonthlyMajor;
    if (foodBenchmark === "street_food") {
      const meals = Math.max(0, Math.round(targetNet / targetCity.stapleMeal.price));
      const mealName = targetCity.stapleMeal.name[locale] ?? targetCity.stapleMeal.name.en;
      return `~${meals.toLocaleString()} ${mealName}`;
    } else {
      const burgers = Math.max(0, Math.round(targetNet / targetCity.bigMacPrice));
      return `~${burgers.toLocaleString()} Big Mac`;
    }
  }, [compareEquivCalculation, foodBenchmark, targetCity, locale]);

  // ── Mode 2 State: "Jalur Karir Pemula" (Legacy Presets) ──
  const [internalPathway, setInternalPathway] = useState<PathwayPreset>(
    selectedPathway || "kenshusei"
  );
  const activePathway = selectedPathway || internalPathway;
  const legacyPreset = PRESETS[activePathway];

  const [legacyGrossInput, setLegacyGrossInput] = useState<number>(legacyPreset.defaultGross);
  const [legacyRentCost, setLegacyRentCost] = useState<number>(legacyPreset.defaultRent);
  const [legacyLivingCost, setLegacyLivingCost] = useState<number>(legacyPreset.defaultLiving);
  const [legacyShowDetails, setLegacyShowDetails] = useState<boolean>(false);

  useEffect(() => {
    if (selectedPathway && selectedPathway !== internalPathway) {
      setInternalPathway(selectedPathway);
      const p = PRESETS[selectedPathway];
      setLegacyGrossInput(p.defaultGross);
      setLegacyRentCost(p.defaultRent);
      setLegacyLivingCost(p.defaultLiving);
    }
  }, [selectedPathway, internalPathway]);

  const handleSelectLegacyPreset = (key: PathwayPreset) => {
    if (onPathwayChange) {
      onPathwayChange(key);
    }
    setInternalPathway(key);
    const p = PRESETS[key];
    setLegacyGrossInput(p.defaultGross);
    setLegacyRentCost(p.defaultRent);
    setLegacyLivingCost(p.defaultLiving);
  };

  const legacyDeductionResult = useMemo(() => {
    try {
      const minorUnits = BigInt(
        legacyPreset.currency === "EUR"
          ? Math.round(legacyGrossInput * 100)
          : Math.round(legacyGrossInput)
      );
      return calculateActiveDeductions({
        country: legacyPreset.countryCode,
        grossMonthlyMinorUnits: minorUnits,
        taxClassDE: 1,
        familyStatus: "single",
        isJapanSecondYear: false,
        ptkpStatusID: "TK/0",
      });
    } catch {
      const fallbackDed = Math.round(legacyGrossInput * legacyPreset.deductionRate);
      return {
        totalDeductionsMajor: fallbackDed,
        netMonthlyMajor: Math.max(0, legacyGrossInput - fallbackDed),
        effectiveDeductionRate: legacyPreset.deductionRate,
      };
    }
  }, [legacyGrossInput, legacyPreset]);

  const legacyNetTakeHome = Math.max(0, Math.round(legacyDeductionResult.netMonthlyMajor));
  const legacyTotalExpenses = legacyRentCost + legacyLivingCost;
  const legacyRemainingSavings = legacyNetTakeHome - legacyTotalExpenses;
  const legacyTaxPct = Math.min(100, Math.max(1, Math.round((legacyDeductionResult.totalDeductionsMajor / legacyGrossInput) * 100)));
  const legacyRentPct = Math.min(100, Math.max(1, Math.round((legacyRentCost / legacyGrossInput) * 100)));
  const legacyLivingPct = Math.min(100, Math.max(1, Math.round((legacyLivingCost / legacyGrossInput) * 100)));
  const legacySavingsPct = 100 - legacyTaxPct - legacyRentPct - legacyLivingPct;
  const legacySavingsMeals = Math.max(0, Math.round(legacyRemainingSavings / legacyPreset.stapleMeal.price));

  // ── Mode 3 State: "Persentil Gaji" ──
  const [percentileCountry, setPercentileCountry] = useState<PercentileCountry>("ID");
  const [percentileGrossInput, setPercentileGrossInput] = useState<number>(10000000);

  const handlePercentileCountryChange = (c: PercentileCountry) => {
    setPercentileCountry(c);
    if (c === "ID") setPercentileGrossInput(10000000);
    else if (c === "JP") setPercentileGrossInput(320000);
    else setPercentileGrossInput(3650);
  };

  const standalonePercentileResult = useMemo(() => {
    try {
      const decimals = percentileCountry === "DE" ? 2 : 0;
      const minor = BigInt(Math.round(percentileGrossInput * Math.pow(10, decimals)));
      return calculateIncomePercentile(minor, percentileCountry);
    } catch {
      return null;
    }
  }, [percentileGrossInput, percentileCountry]);

  const crossCountryPercentiles = useMemo(() => {
    try {
      const decimals = percentileCountry === "DE" ? 2 : 0;
      const minor = BigInt(Math.round(percentileGrossInput * Math.pow(10, decimals)));
      return compareIncomePercentiles(minor, percentileCountry, exchangeRates?.rates);
    } catch {
      return null;
    }
  }, [percentileGrossInput, percentileCountry, exchangeRates]);

  // ── Modal & Save Scenario ──
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  const handleSaveScenario = () => {
    try {
      const stored = localStorage.getItem("bandinghidup_saved_scenarios");
      const currentList = stored ? JSON.parse(stored) : [];
      let newScenario: any;

      if (simulatorMode === "perbandingan_gaji") {
        newScenario = {
          id: `sc_${Date.now()}`,
          label: `${sourceCity.name[locale] || sourceCity.name.en} ➔ ${targetCity.name[locale] || targetCity.name.en}`,
          pathway: "kenshusei",
          gross: compareGrossInput,
          rent: compareEquivCalculation?.sourceSummary.rentMonthlyMajor || 35000,
          living: compareEquivCalculation?.sourceSummary.foodMonthlyMajor || 35000,
          currencySymbol: sourceCity.currencySymbol,
          netSavingsText: `${targetCity.currencySymbol}${compareEquivCalculation?.equivalentGrossMajor?.toLocaleString() || "0"} (${targetCity.city})`,
          savedAt: new Date().toISOString(),
        };
      } else {
        newScenario = {
          id: `sc_${Date.now()}`,
          label: `${legacyPreset.name[locale] || legacyPreset.name.en}`,
          pathway: activePathway,
          gross: legacyGrossInput,
          rent: legacyRentCost,
          living: legacyLivingCost,
          currencySymbol: legacyPreset.currencySymbol,
          netSavingsText: `${legacyPreset.currencySymbol}${legacyRemainingSavings.toLocaleString()}`,
          savedAt: new Date().toISOString(),
        };
      }

      const updated = [newScenario, ...currentList].slice(0, 3);
      localStorage.setItem("bandinghidup_saved_scenarios", JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("bandinghidup:scenario-saved"));
      setSaveSuccessMsg(txt("Tersimpan!", "Saved!", "Gespeichert!", "保存完了!"));
      setTimeout(() => setSaveSuccessMsg(""), 2500);
    } catch {}
  };

  return (
    <div id="quick-simulator" className="tagung-card p-5 sm:p-6 space-y-5 animate-fade-in">
      {/* Top Header Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
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

      {/* ── Mode Selector: 3 Radio Options ─────────────────────────────── */}
      <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 flex-wrap text-xs font-medium text-[var(--text)] pt-0.5 pb-1">
        <label
          className={`flex items-center gap-2 cursor-pointer transition-colors ${
            simulatorMode === "perbandingan_gaji"
              ? "text-[var(--accent)] font-bold"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          <input
            type="radio"
            name="simulator-mode"
            value="perbandingan_gaji"
            checked={simulatorMode === "perbandingan_gaji"}
            onChange={() => setSimulatorMode("perbandingan_gaji")}
            className="w-4 h-4 cursor-pointer accent-[var(--accent)]"
          />
          <span>{txt("Perbandingan Gaji", "Salary Comparison", "Gehaltsvergleich", "給与比較")}</span>
        </label>

        <label
          className={`flex items-center gap-2 cursor-pointer transition-colors ${
            simulatorMode === "jalur_pemula"
              ? "text-[var(--accent)] font-bold"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          <input
            type="radio"
            name="simulator-mode"
            value="jalur_pemula"
            checked={simulatorMode === "jalur_pemula"}
            onChange={() => setSimulatorMode("jalur_pemula")}
            className="w-4 h-4 cursor-pointer accent-[var(--accent)]"
          />
          <span>{txt("Jalur karir pemula", "Entry career path", "Berufseinsteiger", "若手キャリア経路")}</span>
        </label>

        <label
          className={`flex items-center gap-2 cursor-pointer transition-colors ${
            simulatorMode === "persentil_gaji"
              ? "text-[var(--accent)] font-bold"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          <input
            type="radio"
            name="simulator-mode"
            value="persentil_gaji"
            checked={simulatorMode === "persentil_gaji"}
            onChange={() => setSimulatorMode("persentil_gaji")}
            className="w-4 h-4 cursor-pointer accent-[var(--accent)]"
          />
          <span>{txt("Persentil gaji", "Salary percentile", "Einkommens-Perzentil", "給与パーセンタイル")}</span>
        </label>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODE 1: PERBANDINGAN GAJI (NEW DEFAULT CARD)                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {simulatorMode === "perbandingan_gaji" && (
        <div className="space-y-4 animate-fade-in">
          {/* City Selectors (Kota Asal vs Kota Perbandingan) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Kota Asal */}
            <div className="space-y-1.5">
              <label htmlFor="select-source-city" className="text-xs text-[var(--muted)] font-medium block">
                {txt("Kota Asal", "Origin City", "Herkunftsstadt", "出発都市")}
              </label>
              <select
                id="select-source-city"
                value={sourceCityKey}
                onChange={(e) => handleSourceCityChange(e.target.value as QuickCityKey)}
                className="w-full py-2.5 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm font-semibold text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="tokyo">Tokyo, Jepang 🇯🇵</option>
                <option value="berlin">Berlin, Jerman 🇩🇪</option>
                <option value="jakarta">Jakarta, Indonesia 🇮🇩</option>
              </select>
            </div>

            {/* Kota Perbandingan */}
            <div className="space-y-1.5">
              <label htmlFor="select-target-city" className="text-xs text-[var(--muted)] font-medium block">
                {txt("Kota Perbandingan", "Comparison City", "Vergleichsstadt", "比較対象都市")}
              </label>
              <select
                id="select-target-city"
                value={targetCityKey}
                onChange={(e) => handleTargetCityChange(e.target.value as QuickCityKey)}
                className="w-full py-2.5 px-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-sm font-semibold text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="jakarta">Jakarta, Indonesia 🇮🇩</option>
                <option value="tokyo">Tokyo, Jepang 🇯🇵</option>
                <option value="berlin">Berlin, Jerman 🇩🇪</option>
              </select>
            </div>
          </div>

          {/* Family Composition Selector */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-semibold text-[var(--muted)] flex items-center gap-1.5">
              <span>👥</span>
              <span>
                {txt(
                  "Komposisi Keluarga & Tanggungan:",
                  "Family & Dependents Status:",
                  "Familienstand & Kinder:",
                  "世帯構成・扶養状況:"
                )}
              </span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  key: "single",
                  label: txt("Lajang", "Single", "Ledig", "単身"),
                },
                {
                  key: "married_0",
                  label: txt("Menikah (0 Anak)", "Married (0 Kids)", "Verheiratet (0 K.)", "既婚 (子供なし)"),
                },
                {
                  key: "married_1",
                  label: txt("Keluarga 1 Anak", "Family 1 Child", "Familie (1 Kind)", "家族 (子1人)"),
                },
                {
                  key: "married_2",
                  label: txt("Keluarga 2 Anak", "Family 2 Children", "Familie (2 Kinder)", "家族 (子2人)"),
                },
              ].map((item) => {
                const isActive = familyStatus === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFamilyStatus(item.key as FamilyCompositionKey)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      isActive
                        ? "bg-[var(--accent)] text-white border-[var(--accent)] font-bold shadow-md shadow-[var(--accent)]/20 scale-[1.01]"
                        : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gross Salary Slider */}
          <div className="space-y-3 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <label htmlFor="compare-gross-slider" className="text-xs font-medium text-[var(--muted)]">
                {txt("Gaji Kotor", "Gross Salary", "Bruttogehalt", "額面総支給")} ({sourceCity.city})
              </label>
              <span className="text-base font-bold font-mono text-[var(--text)]">
                {fmtValue(compareGrossInput, sourceCity.currency)}
                <span className="text-xs font-normal text-[var(--muted)] ml-1">
                  {txt("/bln", "/mo", "/Monat", "/月")}
                </span>
              </span>
            </div>

            <input
              id="compare-gross-slider"
              type="range"
              min={sourceCity.minGross}
              max={sourceCity.maxGross}
              step={sourceCity.stepGross}
              value={compareGrossInput}
              onChange={(e) => setCompareGrossInput(Number(e.target.value))}
              className="w-full cursor-pointer h-2 rounded-lg bg-[var(--surface-3)]"
              style={{ accentColor: "var(--accent)" }}
              aria-label={txt("Geser gaji kotor", "Slide gross allowance", "Bruttogehalt anpassen", "額面給与スライダー")}
            />

            <div className="flex justify-between text-[10px] font-mono text-[var(--soft)]">
              <span>{fmtValue(sourceCity.minGross, sourceCity.currency)}</span>
              <span className="text-[var(--accent)] font-semibold">
                {txt("Geser untuk Ubah", "Drag to adjust", "Schieberegler bewegen", "スライドで調整")}
              </span>
              <span>{fmtValue(sourceCity.maxGross, sourceCity.currency)}</span>
            </div>
          </div>

          {/* Equivalence Box Card (Setara dengan ... Di Kota Perbandingan) */}
          <div className="p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] space-y-3 shadow-sm">
            <div className="text-[11px] text-[var(--soft)] font-medium">
              {txt("Setara dengan", "Equivalent to", "Gleichwertig mit", "生活水準同等に必要な額面:")}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--accent)]">
                {compareEquivCalculation
                  ? fmtValue(compareEquivCalculation.equivalentGrossMajor, targetCity.currency)
                  : "..."}
                <span className="text-xs font-normal text-[var(--muted)] ml-1 font-sans">
                  {txt("/bln kotor", "/mo gross", "/Monat brutto", "/月 額面")}
                </span>
              </div>
              <div className="text-xs font-semibold text-[var(--text)] font-sans">
                {txt("Di", "In", "In", "対象都市:")} {targetCity.city}, {targetCity.country}
              </div>
            </div>

            {/* Daya Beli Nyata (Selectable Street Food vs Big Mac Index) */}
            <div className="pt-2 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-[var(--muted)] font-medium">
                  {txt("Daya beli nyata:", "Real purchasing power:", "Realkaufkraft:", "実質購買力:")}
                </span>
                <div className="flex items-center gap-2">
                  <label
                    className={`flex items-center gap-1 cursor-pointer text-[11px] ${
                      foodBenchmark === "street_food"
                        ? "text-[var(--accent)] font-bold"
                        : "text-[var(--soft)] hover:text-[var(--text)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="benchmark-type"
                      checked={foodBenchmark === "street_food"}
                      onChange={() => setFoodBenchmark("street_food")}
                      className="w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer"
                    />
                    <span>Street Food</span>
                  </label>

                  <label
                    className={`flex items-center gap-1 cursor-pointer text-[11px] ${
                      foodBenchmark === "big_mac"
                        ? "text-[var(--accent)] font-bold"
                        : "text-[var(--soft)] hover:text-[var(--text)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="benchmark-type"
                      checked={foodBenchmark === "big_mac"}
                      onChange={() => setFoodBenchmark("big_mac")}
                      className="w-3.5 h-3.5 accent-[var(--accent)] cursor-pointer"
                    />
                    <span>Big Mac Index</span>
                  </label>
                </div>
              </div>

              <div className="font-mono font-bold text-[var(--text)] text-xs bg-[var(--surface-3)] py-1 px-2.5 rounded-lg border border-[var(--border)] self-start sm:self-auto">
                {purchasingPowerText}
              </div>
            </div>
          </div>

          {/* ── Expandable Accordion 1: "Lihat detail" (Alokasi Gaji & Pengeluaran) ── */}
          <button
            type="button"
            onClick={() => setShowAllocationDetails(!showAllocationDetails)}
            className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs text-[var(--accent)] font-semibold flex items-center justify-between transition-colors cursor-pointer"
            aria-expanded={showAllocationDetails}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-[10px]">{showAllocationDetails ? "▲" : "▼"}</span>
              <span>
                {showAllocationDetails
                  ? txt("Sembunyikan Rincian Alokasi", "Hide Allocation Details", "Aufteilungsdetails ausblenden", "内訳詳細を閉じる")
                  : txt("Lihat detail ▾ (Alokasi, Pajak & Sewa)", "Show details ▾ (Breakdown, Taxes & Rent)", "Details anzeigen ▾ (Steuern, Miete, Essen)", "内訳詳細を表示 ▾")}
              </span>
            </span>
            <span className="text-[11px] text-[var(--soft)] font-mono">
              {showAllocationDetails ? "−" : "+"}
            </span>
          </button>

          {showAllocationDetails && (
            <div className="space-y-4 pt-1 animate-fade-in bg-[var(--surface-2)]/50 p-3.5 rounded-xl border border-[var(--border)]">
              {/* Stacked Bar 1: Kota Asal */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-[var(--muted)]">
                  <span className="font-medium text-[var(--text)]">
                    {txt("Alokasi Gaji & Pengeluaran di", "Allocation in", "Aufteilung in", "総支給額の配分:")} {sourceCity.city}, {sourceCity.country}
                  </span>
                  <span className="font-mono text-[var(--accent)] font-semibold">
                    {txt("Gaji Bersih:", "Net:", "Netto:", "手取り:")} {fmtValue(sourceBreakdown.netSalary, sourceCity.currency)}
                  </span>
                </div>

                <div className="w-full h-3 bg-[var(--surface-3)] rounded-full overflow-hidden flex shadow-inner border border-[var(--border)]">
                  <div style={{ width: `${sourceBreakdown.taxPct}%` }} className="h-full bg-red-400 transition-all duration-300" />
                  <div style={{ width: `${sourceBreakdown.rentPct}%` }} className="h-full bg-purple-400 transition-all duration-300" />
                  <div style={{ width: `${sourceBreakdown.livingPct}%` }} className="h-full bg-amber-400 transition-all duration-300" />
                  <div style={{ width: `${sourceBreakdown.savingsPct}%` }} className="h-full bg-teal-400 transition-all duration-300" />
                </div>

                <div className="flex items-center justify-between text-[10px] text-[var(--soft)] pt-0.5 flex-wrap gap-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    <span>{txt("Pajak/Asuransi", "Tax/Deductions", "Steuern", "税・社会保険")} (~{sourceBreakdown.taxPct}%)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                    <span>{txt("Sewa", "Rent", "Warmmiete", "家賃")} (~{sourceBreakdown.rentPct}%)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>{txt("Makan", "Living", "Lebenshaltung", "生活費")} (~{sourceBreakdown.livingPct}%)</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[var(--accent)]">
                    <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                    <span>{txt("Tabungan", "Savings", "Ersparnis", "貯蓄")} (~{sourceBreakdown.savingsPct}%)</span>
                  </span>
                </div>
              </div>

              {/* Stacked Bar 2: Kota Perbandingan */}
              <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                <div className="flex justify-between text-[11px] text-[var(--muted)]">
                  <span className="font-medium text-[var(--text)]">
                    {txt("Alokasi Gaji & Pengeluaran di", "Allocation in", "Aufteilung in", "総支給額の配分:")} {targetCity.city}, {targetCity.country}
                  </span>
                  <span className="font-mono text-[var(--accent)] font-semibold">
                    {txt("Gaji Bersih:", "Net:", "Netto:", "手取り:")} {fmtValue(targetBreakdown.netSalary, targetCity.currency)}
                  </span>
                </div>

                <div className="w-full h-3 bg-[var(--surface-3)] rounded-full overflow-hidden flex shadow-inner border border-[var(--border)]">
                  <div style={{ width: `${targetBreakdown.taxPct}%` }} className="h-full bg-red-400 transition-all duration-300" />
                  <div style={{ width: `${targetBreakdown.rentPct}%` }} className="h-full bg-purple-400 transition-all duration-300" />
                  <div style={{ width: `${targetBreakdown.livingPct}%` }} className="h-full bg-amber-400 transition-all duration-300" />
                  <div style={{ width: `${targetBreakdown.savingsPct}%` }} className="h-full bg-teal-400 transition-all duration-300" />
                </div>

                <div className="flex items-center justify-between text-[10px] text-[var(--soft)] pt-0.5 flex-wrap gap-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                    <span>{txt("Pajak/Asuransi", "Tax/Deductions", "Steuern", "税・社会保険")} (~{targetBreakdown.taxPct}%)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
                    <span>{txt("Sewa", "Rent", "Warmmiete", "家賃")} (~{targetBreakdown.rentPct}%)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    <span>{txt("Makan", "Living", "Lebenshaltung", "生活費")} (~{targetBreakdown.livingPct}%)</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[var(--accent)]">
                    <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                    <span>{txt("Tabungan", "Savings", "Ersparnis", "貯蓄")} (~{targetBreakdown.savingsPct}%)</span>
                  </span>
                </div>
              </div>

              {/* Realistic Living Notes */}
              <div className="text-[10px] text-[var(--soft)] pt-2 border-t border-[var(--border)] leading-relaxed space-y-1">
                <div>{sourceCity.livingNote[locale] ?? sourceCity.livingNote.en}</div>
                <div>{targetCity.livingNote[locale] ?? targetCity.livingNote.en}</div>
              </div>
            </div>
          )}

          {/* ── Expandable Accordion 2: "Lihat persentil" ────────────────────── */}
          <button
            type="button"
            onClick={() => setShowPercentileDetails(!showPercentileDetails)}
            className="w-full py-2.5 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs text-[var(--accent)] font-semibold flex items-center justify-between transition-colors cursor-pointer"
            aria-expanded={showPercentileDetails}
          >
            <span className="flex items-center gap-1.5">
              <span className="text-[10px]">{showPercentileDetails ? "▲" : "▼"}</span>
              <span>
                {showPercentileDetails
                  ? txt("Sembunyikan Rincian Persentil", "Hide Percentile Details", "Perzentildaten ausblenden", "所得順位を閉じる")
                  : txt("Lihat persentil ▾ (Peringkat Distribusi Pendapatan)", "View percentile ▾ (Income Distribution Rank)", "Perzentilrang anzeigen ▾", "所得順位（パーセンタイル）を表示 ▾")}
              </span>
            </span>
            <span className="text-[11px] text-[var(--soft)] font-mono">
              {showPercentileDetails ? "−" : "+"}
            </span>
          </button>

          {showPercentileDetails && (
            <div className="space-y-4 pt-1 animate-fade-in bg-[var(--surface-2)]/50 p-4 rounded-xl border border-[var(--border)]">
              {/* Kota Asal Percentile Card */}
              {sourcePercentile && (
                <div className="space-y-2.5 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text)]">
                      {txt("Kota Asal :", "Origin City:", "Herkunft:", "出発都市:")} {sourceCity.name[locale] ?? sourceCity.name.en}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Top {sourcePercentile.topPercentage}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--text)]">
                        Persentil ke-{sourcePercentile.percentile}
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono">
                        {fmtValue(compareGrossInput, sourceCity.currency)} / bln gross
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[var(--soft)]">Vs Median Nasional:</div>
                      <div className="text-sm font-bold font-mono text-amber-400">
                        {sourcePercentile.ratioToMedian}x Median
                      </div>
                    </div>
                  </div>

                  {/* Gradient Range Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="relative w-full h-2 rounded-full bg-[var(--surface-3)] overflow-visible">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${Math.max(4, Math.min(98, sourcePercentile.percentile))}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[var(--surface)] border-2 border-teal-400 shadow-md transition-all pointer-events-none"
                        style={{ left: `calc(${Math.max(2, Math.min(96, sourcePercentile.percentile))}% - 7px)` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-[var(--soft)] pt-1">
                      <span>P10</span>
                      <span className="text-[var(--accent)]">P50 (Median)</span>
                      <span>P90</span>
                      <span>P99 (Top 1%)</span>
                    </div>
                  </div>

                  {/* Class Status Text */}
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed pt-1 border-t border-[var(--border)]">
                    <span className="text-[var(--text)] font-semibold">Status Kelas: </span>
                    {sourcePercentile.description[locale] ?? sourcePercentile.description.id}
                  </p>
                </div>
              )}

              {/* Kota Perbandingan Percentile Card */}
              {targetPercentile && compareEquivCalculation && (
                <div className="space-y-2.5 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text)]">
                      {txt("Kota Perbandingan :", "Comparison City:", "Vergleich:", "比較対象都市:")} {targetCity.name[locale] ?? targetCity.name.en}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                      Top {targetPercentile.topPercentage}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div>
                      <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--text)]">
                        Persentil ke-{targetPercentile.percentile}
                      </div>
                      <div className="text-[11px] text-[var(--muted)] font-mono">
                        {fmtValue(compareEquivCalculation.equivalentGrossMajor, targetCity.currency)} / bln gross
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-[var(--soft)]">Vs Median Nasional:</div>
                      <div className="text-sm font-bold font-mono text-amber-400">
                        {targetPercentile.ratioToMedian}x Median
                      </div>
                    </div>
                  </div>

                  {/* Gradient Range Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="relative w-full h-2 rounded-full bg-[var(--surface-3)] overflow-visible">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400"
                        style={{ width: `${Math.max(4, Math.min(98, targetPercentile.percentile))}%` }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[var(--surface)] border-2 border-cyan-400 shadow-md transition-all pointer-events-none"
                        style={{ left: `calc(${Math.max(2, Math.min(96, targetPercentile.percentile))}% - 7px)` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-[var(--soft)] pt-1">
                      <span>P10</span>
                      <span className="text-[var(--accent)]">P50 (Median)</span>
                      <span>P90</span>
                      <span>P99 (Top 1%)</span>
                    </div>
                  </div>

                  {/* Class Status Text */}
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed pt-1 border-t border-[var(--border)]">
                    <span className="text-[var(--text)] font-semibold">Status Kelas: </span>
                    {targetPercentile.description[locale] ?? targetPercentile.description.id}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODE 2: JALUR KARIR PEMULA (LEGACY PRESETS SIMULATOR)               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {simulatorMode === "jalur_pemula" && (
        <div className="space-y-4 animate-fade-in">
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
                  onClick={() => handleSelectLegacyPreset(key)}
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

          {/* Gross Slider */}
          <div className="space-y-3 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <label htmlFor="legacy-gross-slider" className="text-xs font-medium text-[var(--muted)]">
                {txt("Gaji Kotor", "Gross Salary", "Bruttogehalt", "額面総支給")}
              </label>
              <span className="text-base font-bold font-mono text-[var(--text)]">
                {legacyPreset.currencySymbol}
                {legacyGrossInput.toLocaleString()}
                <span className="text-xs font-normal text-[var(--muted)] ml-1">
                  {txt("/bln", "/mo", "/Monat", "/月")}
                </span>
              </span>
            </div>

            <input
              id="legacy-gross-slider"
              type="range"
              min={legacyPreset.minGross}
              max={legacyPreset.maxGross}
              step={legacyPreset.stepGross}
              value={legacyGrossInput}
              onChange={(e) => setLegacyGrossInput(Number(e.target.value))}
              className="w-full cursor-pointer h-2 rounded-lg bg-[var(--surface-3)]"
              style={{ accentColor: "var(--accent)" }}
            />

            <div className="flex justify-between text-[10px] font-mono text-[var(--soft)]">
              <span>{legacyPreset.currencySymbol}{legacyPreset.minGross.toLocaleString()}</span>
              <span className="text-[var(--accent)] font-semibold">
                {txt("Geser untuk Ubah", "Drag to adjust", "Schieberegler bewegen", "スライドで調整")}
              </span>
              <span>{legacyPreset.currencySymbol}{legacyPreset.maxGross.toLocaleString()}</span>
            </div>
          </div>

          {/* Net Remaining Savings Headline Card */}
          <div
            className="p-4 rounded-xl border space-y-2.5"
            style={{
              background: legacyRemainingSavings >= 0 ? "var(--accent-soft)" : "rgba(239, 68, 68, 0.1)",
              borderColor: legacyRemainingSavings >= 0 ? "var(--border-strong)" : "rgba(239, 68, 68, 0.35)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text)]">
                {txt("💰 Sisa Uang Tabungan Bulanan:", "💰 Est. Monthly Net Savings:", "💰 Monatliche Ersparnis:", "💰 毎月の実質貯蓄可能額:")}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  legacyRemainingSavings >= 0
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}
              >
                {legacyRemainingSavings >= 0 ? txt("🟢 Aman", "🟢 Healthy", "🟢 Solide", "🟢 余裕あり") : txt("🔴 Defisit", "🔴 Deficit", "🔴 Defizit", "🔴 赤字")}
              </span>
            </div>

            <div className="text-xl sm:text-2xl font-bold font-mono text-[var(--text)]">
              {legacyRemainingSavings >= 0 ? "+" : "-"}
              {legacyPreset.currencySymbol}
              {Math.abs(legacyRemainingSavings).toLocaleString()}
              <span className="text-xs font-normal text-[var(--muted)] ml-1">
                {txt("/bln", "/mo", "/Monat", "/月")}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-[11px]">
              <span className="text-[var(--text)] font-medium flex items-center gap-1.5">
                <span>🍽️</span>
                <span>{txt("Daya Beli Nyata (Indeks Kenyang):", "Real Purchasing Power:", "Monatliche Realkaufkraft:", "実質購買力:")}</span>
              </span>
              <span className="font-mono font-bold text-[var(--accent)] text-xs">
                ~{legacySavingsMeals} {legacyPreset.stapleMeal.name[locale] ?? legacyPreset.stapleMeal.name.en}
              </span>
            </div>
          </div>

          {/* Collapsible Details */}
          <button
            type="button"
            onClick={() => setLegacyShowDetails(!legacyShowDetails)}
            className="w-full py-2 px-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-xs text-[var(--accent)] font-medium flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>{legacyShowDetails ? txt("Sembunyikan Rincian", "Hide Details", "Ausblenden", "閉じる") : txt("Lihat detail ▾ (Alokasi, Pajak & Sewa)", "Show details ▾", "Details anzeigen ▾", "詳細表示 ▾")}</span>
            <span className="font-mono text-[10px]">{legacyShowDetails ? "−" : "+"}</span>
          </button>

          {legacyShowDetails && (
            <div className="space-y-3 pt-1 animate-fade-in text-xs bg-[var(--surface-2)]/60 p-3.5 rounded-xl border border-[var(--border)]">
              <div className="w-full h-3 bg-[var(--surface-3)] rounded-full overflow-hidden flex border border-[var(--border)]">
                <div style={{ width: `${legacyTaxPct}%` }} className="h-full bg-red-400" />
                <div style={{ width: `${legacyRentPct}%` }} className="h-full bg-purple-400" />
                <div style={{ width: `${legacyLivingPct}%` }} className="h-full bg-amber-400" />
                <div style={{ width: `${Math.max(0, legacySavingsPct)}%` }} className="h-full bg-teal-400" />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--soft)] flex-wrap gap-1">
                <span>Pajak (~{legacyTaxPct}%)</span>
                <span>Sewa (~{legacyRentPct}%)</span>
                <span>Makan (~{legacyLivingPct}%)</span>
                <span className="text-[var(--accent)] font-semibold">Tabungan (~{Math.max(0, legacySavingsPct)}%)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODE 3: PERSENTIL GAJI (STANDALONE INTERACTIVE RADAR)               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {simulatorMode === "persentil_gaji" && (
        <div className="space-y-4 animate-fade-in">
          {/* Country Selection */}
          <div className="space-y-1.5">
            <label htmlFor="percentile-country-select" className="text-xs text-[var(--muted)] font-medium block">
              {txt("Pilih Negara Acuan Distribusi:", "Select Distribution Country:", "Vergleichsland:", "基準国を選択:")}
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
              {(["ID", "JP", "DE"] as PercentileCountry[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handlePercentileCountryChange(c)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                    percentileCountry === c
                      ? "bg-[var(--accent)] text-white shadow-md font-bold"
                      : "text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--surface-3)]"
                  }`}
                >
                  {c === "ID" ? "🇮🇩 Indonesia" : c === "JP" ? "🇯🇵 Jepang" : "🇩🇪 Jerman"}
                </button>
              ))}
            </div>
          </div>

          {/* Gross Input Slider */}
          <div className="space-y-3 bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <label htmlFor="percentile-slider" className="text-xs font-medium text-[var(--muted)]">
                {txt("Gaji Kotor Bulanan", "Gross Monthly Salary", "Bruttomonatsgehalt", "額面月給")}
              </label>
              <span className="text-base font-bold font-mono text-[var(--text)]">
                {percentileCountry === "ID" ? `Rp ${percentileGrossInput.toLocaleString("id-ID")}` : percentileCountry === "JP" ? `¥${percentileGrossInput.toLocaleString("id-ID")}` : `€${percentileGrossInput.toLocaleString("de-DE")}`}
                <span className="text-xs font-normal text-[var(--muted)] ml-1">
                  {txt("/bln", "/mo", "/Monat", "/月")}
                </span>
              </span>
            </div>

            <input
              id="percentile-slider"
              type="range"
              min={percentileCountry === "ID" ? 2000000 : percentileCountry === "JP" ? 120000 : 800}
              max={percentileCountry === "ID" ? 80000000 : percentileCountry === "JP" ? 8000000 : 50000}
              step={percentileCountry === "ID" ? 500000 : percentileCountry === "JP" ? 25000 : 200}
              value={percentileGrossInput}
              onChange={(e) => setPercentileGrossInput(Number(e.target.value))}
              className="w-full cursor-pointer h-2 rounded-lg bg-[var(--surface-3)]"
              style={{ accentColor: "var(--accent)" }}
            />

            <div className="flex justify-between text-[10px] font-mono text-[var(--soft)]">
              <span>{percentileCountry === "ID" ? "Rp 2 Juta" : percentileCountry === "JP" ? "¥120.000" : "€800"}</span>
              <span className="text-[var(--accent)] font-semibold">
                {txt("Geser Nilai Gaji", "Drag salary", "Gehalt anpassen", "給与額をスライド")}
              </span>
              <span>{percentileCountry === "ID" ? "Rp 80 Juta" : percentileCountry === "JP" ? "¥8.000.000" : "€50.000"}</span>
            </div>
          </div>

          {/* Standalone Percentile Result Box */}
          {standalonePercentileResult && (
            <div className="p-4 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text)]">
                  {txt("Peringkat Pendapatan:", "Income Percentile Rank:", "Einkommensrang:", "国内所得ランキング:")}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Top {standalonePercentileResult.topPercentage}%
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div className="text-2xl sm:text-3xl font-bold font-mono text-[var(--accent)]">
                  Persentil ke-{standalonePercentileResult.percentile}
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-[var(--soft)]">Vs Median:</div>
                  <div className="text-sm font-bold font-mono text-amber-400">
                    {standalonePercentileResult.ratioToMedian}x Median
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <div className="relative w-full h-2 rounded-full bg-[var(--surface-3)] overflow-visible">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${Math.max(4, Math.min(98, standalonePercentileResult.percentile))}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[var(--surface)] border-2 border-teal-400 shadow-md transition-all pointer-events-none"
                    style={{ left: `calc(${Math.max(2, Math.min(96, standalonePercentileResult.percentile))}% - 7px)` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-[var(--soft)] pt-1">
                  <span>P10</span>
                  <span className="text-[var(--accent)]">P50 (Median)</span>
                  <span>P90</span>
                  <span>P99 (Top 1%)</span>
                </div>
              </div>

              <p className="text-[11px] text-[var(--muted)] leading-relaxed pt-2 border-t border-[var(--border)]">
                {standalonePercentileResult.description[locale] ?? standalonePercentileResult.description.id}
              </p>
            </div>
          )}

          {/* Cross Country Comparison Quick Cards */}
          {crossCountryPercentiles && (
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              {(["ID", "JP", "DE"] as PercentileCountry[]).map((c) => {
                const item = crossCountryPercentiles[c];
                if (!item) return null;
                const flag = c === "ID" ? "🇮🇩" : c === "JP" ? "🇯🇵" : "🇩🇪";
                return (
                  <div key={c} className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] space-y-0.5">
                    <div className="text-xs">{flag}</div>
                    <div className="text-[10px] text-[var(--soft)] font-medium">Top {item.topPercentage}%</div>
                    <div className="text-[11px] font-bold font-mono text-[var(--text)]">P{item.percentile}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Action Buttons & Links ─────────────────────────────────────── */}
      <div className="space-y-2 pt-2 border-t border-[var(--border)]">
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

          <button
            type="button"
            onClick={handleSaveScenario}
            className="btn-secondary py-2 text-[11px] font-medium flex items-center justify-center gap-1.5 text-center cursor-pointer"
          >
            <span>💾</span>
            <span>{saveSuccessMsg || txt("Simpan Skenario", "Save Scenario", "Szenario speichern", "シミュレーション保存")}</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="py-1.5 px-2.5 rounded-lg border border-line bg-panel-2 hover:bg-panel-3 text-[11px] font-medium text-[var(--accent)] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>✨</span>
            <span>{txt("Kartu Hasil PNG", "Result Card PNG", "Ergebniskarte", "結果カード出力")}</span>
          </button>

          <Link
            href="/gaji-setara"
            className="py-1.5 px-2.5 rounded-lg border border-line bg-panel-2 hover:bg-panel-3 text-[11px] font-medium text-[var(--muted)] hover:text-[var(--text)] flex items-center justify-center gap-1.5 transition-colors text-center"
          >
            <span>🌐</span>
            <span>{txt("Gaji Setara", "Equivalent Salary", "Vergleichsgehalt", "購買力平価")}</span>
          </Link>
        </div>
      </div>

      {/* Share Card Modal (1080x1350 PNG) */}
      <ShareResultCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        data={{
          title:
            simulatorMode === "perbandingan_gaji"
              ? `${sourceCity.name[locale] || sourceCity.name.en} ➔ ${targetCity.name[locale] || targetCity.name.en}`
              : simulatorMode === "persentil_gaji"
              ? `Radar Persentil (${percentileCountry})`
              : legacyPreset.name[locale] || legacyPreset.name.en,
          sourceCity: simulatorMode === "perbandingan_gaji" ? sourceCity.city : legacyPreset.countryCode === "ID" ? "Jakarta" : "Tokyo",
          sourceCountry: simulatorMode === "perbandingan_gaji" ? sourceCity.country : legacyPreset.countryCode,
          targetCity: simulatorMode === "perbandingan_gaji" ? targetCity.city : legacyPreset.countryCode === "DE" ? "Berlin" : "Tokyo",
          targetCountry: simulatorMode === "perbandingan_gaji" ? targetCity.country : legacyPreset.countryCode,
          grossSalaryText:
            simulatorMode === "perbandingan_gaji"
              ? fmtValue(compareGrossInput, sourceCity.currency)
              : `${legacyPreset.currencySymbol}${legacyGrossInput.toLocaleString()}`,
          netSalaryText:
            simulatorMode === "perbandingan_gaji"
              ? fmtValue(compareEquivCalculation?.equivalentGrossMajor || 0, targetCity.currency)
              : `${legacyPreset.currencySymbol}${legacyNetTakeHome.toLocaleString()}`,
          expensesText:
            simulatorMode === "perbandingan_gaji"
              ? fmtValue(compareEquivCalculation?.targetSummary.totalConsumptionMonthlyMajor || 0, targetCity.currency)
              : `${legacyPreset.currencySymbol}${legacyTotalExpenses.toLocaleString()}`,
          savingsText:
            simulatorMode === "perbandingan_gaji"
              ? fmtValue(compareEquivCalculation?.targetSummary.discretionarySavingsMonthlyMajor || 0, targetCity.currency)
              : `${legacyRemainingSavings >= 0 ? "+" : "−"}${legacyPreset.currencySymbol}${Math.abs(legacyRemainingSavings).toLocaleString()}`,
          foodIndexText: purchasingPowerText || `~${legacySavingsMeals} porsi`,
          badgeText:
            simulatorMode === "perbandingan_gaji"
              ? `${txt("Setara Daya Beli", "Purchasing Power Parity", "Kaufkraftparität", "実質購買力同等")}: ${targetCity.city}`
              : `Tedori: ${legacyPreset.currencySymbol}${legacyNetTakeHome.toLocaleString()}`,
          periodicityText: `${txt("Per Bulan", "Monthly", "Monatlich", "月額")}`,
        }}
      />
    </div>
  );
}
