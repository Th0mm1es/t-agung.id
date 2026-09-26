"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { ActiveLocale } from "@bandinghidup/core";

// ─── Translation Dictionaries (inlined for Next.js bundle compatibility) ──────

const dictionaries: Record<ActiveLocale, Record<string, string>> = {
  id: {
    "app.name": "BandingHidup",
    "app.tagline": "Perbandingan Biaya Hidup Realistis",
    "nav.home": "Beranda",
    "nav.compare": "Bandingkan",
    "nav.about": "Tentang",
    "nav.language": "Bahasa",
    "hero.headline": "Perbandingan Biaya Hidup Realistis untuk Ausbildung di Jerman & Kenshusei di Jepang",
    "hero.subheadline": "Khusus untuk peserta magang vokasi, mahasiswa, fresh graduate, dan pekerja entry-level. Bukan untuk konsultan, bukan untuk show-off.",
    "hero.cta": "Mulai Perbandingan",
    "hero.badge": "Gratis & Anonim",
    "form.select_country": "Pilih Negara",
    "form.select_city": "Pilih Kota",
    "form.select_pathway": "Pilih Jalur Penghasilan",
    "form.loading": "Memuat...",
    "form.no_data": "Tidak ada data tersedia",
    "country.DE": "Jerman",
    "country.JP": "Jepang",
    "country.ID": "Indonesia",
    "pathway.ausbildung": "Ausbildung (Magang Vokasi Jerman)",
    "pathway.technical_intern": "Kenshusei / Technical Intern (Magang Jepang)",
    "pathway.student": "Mahasiswa",
    "pathway.fresh_grad": "Fresh Graduate",
    "pathway.custom": "Kustom / Lainnya",
    "category.housing": "Tempat Tinggal",
    "category.utilities": "Listrik, Air & Internet",
    "category.food": "Makanan & Minuman",
    "category.transport": "Transportasi",
    "category.lifestyle": "Gaya Hidup & Hiburan",
    "category.relocation": "Biaya Pindah (Satu Kali)",
    "currency.eur": "Euro",
    "currency.jpy": "Yen Jepang",
    "currency.idr": "Rupiah Indonesia",
    "currency.usd": "Dolar AS",
    "disclaimer.title": "Perhatian Penting",
    "disclaimer.text": "BandingHidup memberikan perkiraan perencanaan berdasarkan input pengguna dan data referensi yang tersedia. Ini BUKAN merupakan nasihat hukum, pajak, penggajian, visa, atau keuangan. Selalu konsultasikan dengan profesional yang qualified untuk keputusan penting.",
    "footer.legal": "Bukan nasihat hukum, pajak, atau keuangan.",
    "footer.made_with": "Dibuat untuk para pejuang luar negeri 🌏",
    "footer.data_source": "Sumber data: Destatis (DE), e-Stat (JP), BPS (ID)",
  },
  en: {
    "app.name": "BandingHidup",
    "app.tagline": "Realistic Cost-of-Living Comparison",
    "nav.home": "Home",
    "nav.compare": "Compare",
    "nav.about": "About",
    "nav.language": "Language",
    "hero.headline": "Realistic Cost-of-Living Comparison for Ausbildung in Germany & Kenshusei in Japan",
    "hero.subheadline": "Built specifically for vocational trainees, students, fresh graduates, and entry-level workers. Honest numbers, no fluff.",
    "hero.cta": "Start Comparing",
    "hero.badge": "Free & Anonymous",
    "form.select_country": "Select Country",
    "form.select_city": "Select City",
    "form.select_pathway": "Select Income Pathway",
    "form.loading": "Loading...",
    "form.no_data": "No data available",
    "country.DE": "Germany",
    "country.JP": "Japan",
    "country.ID": "Indonesia",
    "pathway.ausbildung": "Ausbildung (German Vocational Training)",
    "pathway.technical_intern": "Kenshusei / Technical Intern (Japan)",
    "pathway.student": "Student",
    "pathway.fresh_grad": "Fresh Graduate",
    "pathway.custom": "Custom / Other",
    "category.housing": "Housing",
    "category.utilities": "Electricity, Water & Internet",
    "category.food": "Food & Drinks",
    "category.transport": "Transportation",
    "category.lifestyle": "Lifestyle & Entertainment",
    "category.relocation": "Relocation Costs (One-Time)",
    "currency.eur": "Euro",
    "currency.jpy": "Japanese Yen",
    "currency.idr": "Indonesian Rupiah",
    "currency.usd": "US Dollar",
    "disclaimer.title": "Important Notice",
    "disclaimer.text": "BandingHidup provides planning estimates based on user inputs and available reference data. It is NOT legal, tax, payroll, visa, or financial advice. Always consult qualified professionals for important decisions.",
    "footer.legal": "Not legal, tax, or financial advice.",
    "footer.made_with": "Made for overseas fighters 🌏",
    "footer.data_source": "Data sources: Destatis (DE), e-Stat (JP), BPS (ID)",
  },
  ja: {
    "app.name": "BandingHidup",
    "app.tagline": "現実的な生活費・手取り比較シミュレーター",
    "nav.home": "ホーム",
    "nav.compare": "2都市比較",
    "nav.about": "概要",
    "nav.language": "言語",
    "hero.headline": "ドイツのアウスビルドゥング＆日本の技能実習生のための現実的な生活費シミュレーター",
    "hero.subheadline": "職業訓練生、留学生、新卒、エントリーレベル労働者のために構築。見せかけではないリアルな数字。",
    "hero.cta": "シミュレーションを開始",
    "hero.badge": "無料＆完全匿名",
    "form.select_country": "国を選択",
    "form.select_city": "都市を選択",
    "form.select_pathway": "職種・在留資格を選択",
    "form.loading": "読み込み中...",
    "form.no_data": "データがありません",
    "country.DE": "ドイツ",
    "country.JP": "日本",
    "country.ID": "インドネシア",
    "pathway.ausbildung": "アウスビルドゥング（ドイツ職業訓練）",
    "pathway.technical_intern": "技能実習生 / 特定技能（日本）",
    "pathway.student": "留学生・学生",
    "pathway.fresh_grad": "新卒・エントリーレベル",
    "pathway.custom": "カスタム / その他",
    "category.housing": "家賃・住居費",
    "category.utilities": "水道光熱費・通信費",
    "category.food": "食費",
    "category.transport": "交通費",
    "category.lifestyle": "娯楽・その他",
    "category.relocation": "初期費用・渡航費（初回のみ）",
    "currency.eur": "ユーロ",
    "currency.jpy": "日本円",
    "currency.idr": "インドネシアルピア",
    "currency.usd": "米ドル",
    "disclaimer.title": "重要事項",
    "disclaimer.text": "BandingHidupはユーザー入力および公的統計基準に基づく試算シミュレーションを提供します。法的、税務、給与計算、ビザ、または財務に関する助言ではありません。決定を下す前に雇用契約および公式ビザ要件をご確認ください。",
    "footer.legal": "法的・税務・財務上の助言ではありません。",
    "footer.made_with": "海外で挑戦するすべての人のために 🌏",
    "footer.data_source": "データ元: ドイツ連邦統計局 (Destatis), 日本総務省統計局 (e-Stat), インドネシア統計局 (BPS)",
  },
  de: {
    "app.name": "BandingHidup",
    "app.tagline": "Realistischer Lebenshaltungskostenvergleich",
    "nav.home": "Startseite",
    "nav.compare": "Vergleich",
    "nav.about": "Über uns",
    "nav.language": "Sprache",
    "hero.headline": "Realistischer Lebenshaltungskostenvergleich für Ausbildung in Deutschland & Kenshusei in Japan",
    "hero.subheadline": "Speziell für Auszubildende, Studenten, Berufseinsteiger und Praktikanten. Ehrliche Zahlen, keine Schönfärberei.",
    "hero.cta": "Vergleich starten",
    "hero.badge": "Kostenlos & Anonym",
    "form.select_country": "Land auswählen",
    "form.select_city": "Stadt auswählen",
    "form.select_pathway": "Verdienstweg auswählen",
    "form.loading": "Laden...",
    "form.no_data": "Keine Daten verfügbar",
    "country.DE": "Deutschland",
    "country.JP": "Japan",
    "country.ID": "Indonesien",
    "pathway.ausbildung": "Ausbildung (Duale Berufsausbildung)",
    "pathway.technical_intern": "Kenshusei / Technical Intern (Japan)",
    "pathway.student": "Student",
    "pathway.fresh_grad": "Berufseinsteiger",
    "pathway.custom": "Benutzerdefiniert / Sonstige",
    "category.housing": "Wohnen & Warmmiete",
    "category.utilities": "Strom, Wasser & Internet",
    "category.food": "Essen & Trinken",
    "category.transport": "Mobilität & ÖPNV",
    "category.lifestyle": "Freizeit & Sonstiges",
    "category.relocation": "Umzugskosten (einmalig)",
    "currency.eur": "Euro",
    "currency.jpy": "Japanischer Yen",
    "currency.idr": "Indonesische Rupiah",
    "currency.usd": "US-Dollar",
    "disclaimer.title": "Wichtiger Hinweis",
    "disclaimer.text": "BandingHidup liefert Planungsschätzungen basierend auf Benutzereingaben und amtlichen Statistiken. Dies stellt KEINE Rechts-, Steuer-, Lohn-, Visa- oder Finanzberatung dar.",
    "footer.legal": "Keine Rechts-, Steuer- oder Finanzberatung.",
    "footer.made_with": "Für alle Kämpfer im Ausland 🌏",
    "footer.data_source": "Datenquellen: Destatis (DE), e-Stat (JP), BPS (ID)",
  },
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface I18nContextValue {
  locale: ActiveLocale;
  setLocale: (locale: ActiveLocale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: ActiveLocale;
}

export function I18nProvider({ children, defaultLocale = "id" }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<ActiveLocale>(defaultLocale);

  // Initialize from persisted localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("bandinghidup_locale") as ActiveLocale | null;
      if (saved && (["id", "en", "de", "ja"] as ActiveLocale[]).includes(saved)) {
        setLocaleState(saved);
        if (typeof document !== "undefined") {
          document.documentElement.lang = saved;
        }
      }
    } catch {}
  }, []);

  const setLocale = useCallback((newLocale: ActiveLocale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("bandinghidup_locale", newLocale);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale;
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const dict = dictionaries[locale] ?? dictionaries["id"];
      return dict[key] ?? fallback ?? key;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider>");
  }
  return ctx;
}

