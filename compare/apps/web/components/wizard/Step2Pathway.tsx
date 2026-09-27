"use client";

import { useI18n } from "@/lib/i18n";
import type { WizardState, WizardAction } from "./wizardState";
import type { PathwayCode } from "@bandinghidup/core";

interface Step2Props {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  onNext: () => void;
  onBack: () => void;
}

type PathwayConfig = {
  code: PathwayCode;
  icon: string;
  labelId: string;
  labelEn: string;
  labelDe: string;
  labelJa: string;
  descId: string;
  descEn: string;
  descDe: string;
  descJa: string;
  countries: string[];
  tagId?: string;
  tagEn?: string;
  tagDe?: string;
  tagJa?: string;
};

const PATHWAYS: PathwayConfig[] = [
  {
    code: "ausbildung",
    icon: "🔧",
    labelId: "Ausbildung",
    labelEn: "Ausbildung",
    labelDe: "Duale Ausbildung",
    labelJa: "Ausbildung (独職業訓練)",
    descId: "Pelatihan vokasi resmi di Jerman. Mendapat gaji + pelatihan terstruktur 2–3 tahun.",
    descEn: "Official German vocational training. Paid stipend + structured 2–3 year program.",
    descDe: "Offizielle duale Berufsausbildung in Deutschland. Ausbildungsvergütung + Praxis & Berufsschule (2–3 Jahre).",
    descJa: "ドイツの公式職業訓練制度。2〜3年間の月額手当支給＋企業実習と学校教育の併行プログラム。",
    countries: ["DE"],
    tagId: "Khusus Jerman",
    tagEn: "Germany only",
    tagDe: "Nur Deutschland",
    tagJa: "ドイツ限定",
  },
  {
    code: "technical_intern",
    icon: "🏭",
    labelId: "Kenshusei / Technical Intern",
    labelEn: "Kenshusei / Technical Intern",
    labelDe: "Kenshusei / Praktikant (Japan)",
    labelJa: "技能実習 / 研修生",
    descId: "Program magang teknis di Jepang (TITP/JISSTP). Kontrak biasanya 3–5 tahun. Perhatikan biaya potongan!",
    descEn: "Japanese technical intern training (TITP/JISSTP). Typically 3–5 year contract. Watch out for contract deductions!",
    descDe: "Technisches Praktikantenprogramm in Japan (TITP). Typischerweise 3–5 Jahre. Auf vertragliche Abzüge achten!",
    descJa: "日本の技能実習・特定技能制度。通常3〜5年の契約。受入機関の天引き項目に要注意！",
    countries: ["JP"],
    tagId: "Khusus Jepang",
    tagEn: "Japan only",
    tagDe: "Nur Japan",
    tagJa: "日本限定",
  },
  {
    code: "student",
    icon: "🎓",
    labelId: "Mahasiswa",
    labelEn: "Student",
    labelDe: "Student",
    labelJa: "留学生 (アルバイト/奨学金)",
    descId: "Mahasiswa dengan part-time job atau beasiswa. Penghasilan paruh waktu.",
    descEn: "Student with part-time work or scholarship income.",
    descDe: "Studierende mit Nebenjob (Werkstudent/Minijob) oder Stipendium.",
    descJa: "学生アルバイトまたは奨学金。法定労働時間制限内のパートタイム所得。",
    countries: ["DE", "JP"],
  },
  {
    code: "fresh_grad",
    icon: "💼",
    labelId: "Fresh Graduate",
    labelEn: "Fresh Graduate",
    labelDe: "Berufseinsteiger",
    labelJa: "新卒正規雇用 (正社員)",
    descId: "Karyawan baru dengan kontrak kerja reguler.",
    descEn: "New employee on a regular employment contract.",
    descDe: "Berufseinsteiger mit regulärem Arbeitsvertrag nach Studienabschluss.",
    descJa: "大学・大学院卒業後のフルタイム正規雇用（正社員契約）。",
    countries: ["DE", "JP"],
  },
  {
    code: "custom",
    icon: "⚙️",
    labelId: "Kustom / Lainnya",
    labelEn: "Custom / Other",
    labelDe: "Benutzerdefiniert / Sonstige",
    labelJa: "手動設定 / その他契約",
    descId: "Input manual penghasilan dan potongan sesuai kontrakmu.",
    descEn: "Manually enter your income and deductions from your contract.",
    descDe: "Manuelle Eingabe von Bruttogehalt und Abzügen laut Arbeitsvertrag.",
    descJa: "雇用契約書に記載の月額給与と控除額を任意に入力。",
    countries: ["DE", "JP"],
  },
];

export function Step2Pathway({ state, dispatch, onNext, onBack }: Step2Props) {
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

  const availablePathways = PATHWAYS.filter(
    (p) => !state.country || p.countries.includes(state.country ?? "")
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-[var(--text)]">
          {txt("Jalur Penghasilan", "Income Pathway", "Karrierepfad & Status", "キャリア区分・就労形態")}
        </h2>
        <p className="text-fg-muted">
          {txt(
            "Apa status kamu di sana?",
            "What is your status there?",
            "Was ist Ihr beruflicher Status im Zielland?",
            "渡航先での滞在資格・就労形態を選択してください"
          )}
        </p>
      </div>

      <div className="space-y-3">
        {availablePathways.map((pathway) => {
          const isSelected = state.pathway === pathway.code;

          return (
            <button
              key={pathway.code}
              id={`pathway-btn-${pathway.code}`}
              onClick={() => dispatch({ type: "SET_PATHWAY", pathway: pathway.code })}
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 ${
                isSelected ? "ring-2 ring-[var(--accent-soft)]" : ""
              }`}
              style={{
                background: isSelected ? "rgba(40, 144, 109, 0.15)" : "rgba(28, 46, 34, 0.5)",
                border: `1px solid ${isSelected ? "rgba(40, 144, 109, 0.5)" : "rgba(255,255,255,0.08)"}`,
              }}
              aria-pressed={isSelected}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-0.5">{pathway.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--text)]">
                      {locale === "ja" ? pathway.labelJa : locale === "de" ? pathway.labelDe : locale === "en" ? pathway.labelEn : pathway.labelId}
                    </span>
                    {pathway.tagId && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(249, 134, 7, 0.15)",
                          border: "1px solid rgba(249, 134, 7, 0.3)",
                          color: "var(--highlight)",
                        }}
                      >
                        {locale === "ja" ? pathway.tagJa : locale === "de" ? (pathway.tagDe || pathway.tagEn) : locale === "en" ? pathway.tagEn : pathway.tagId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-fg-muted mt-1 leading-relaxed">
                    {locale === "ja" ? pathway.descJa : locale === "de" ? pathway.descDe : locale === "en" ? pathway.descEn : pathway.descId}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs text-white flex-shrink-0">
                    ✓
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button id="wizard-step2-back" onClick={onBack} className="btn-secondary flex-1 py-3">
          ← {txt("Kembali", "Back", "Zurück", "戻る")}
        </button>
        <button
          id="wizard-step2-next"
          onClick={onNext}
          disabled={!state.pathway}
          className={`btn-primary flex-[2] py-3 ${!state.pathway ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {txt("Lanjut →", "Continue →", "Weiter →", "次へ進む →")}
        </button>
      </div>
    </div>
  );
}
