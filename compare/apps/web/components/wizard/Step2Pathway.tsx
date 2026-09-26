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
  labelJa: string;
  descId: string;
  descEn: string;
  descJa: string;
  countries: string[];
  tagId?: string;
  tagEn?: string;
  tagJa?: string;
};

const PATHWAYS: PathwayConfig[] = [
  {
    code: "ausbildung",
    icon: "🔧",
    labelId: "Ausbildung",
    labelEn: "Ausbildung",
    labelJa: "Ausbildung (独職業訓練)",
    descId: "Pelatihan vokasi resmi di Jerman. Mendapat gaji + pelatihan terstruktur 2–3 tahun.",
    descEn: "Official German vocational training. Paid stipend + structured 2–3 year program.",
    descJa: "ドイツの公式職業訓練制度。2〜3年間の月額手当支給＋企業実習と学校教育の併行プログラム。",
    countries: ["DE"],
    tagId: "Khusus Jerman",
    tagEn: "Germany only",
    tagJa: "ドイツ限定",
  },
  {
    code: "technical_intern",
    icon: "🏭",
    labelId: "Kenshusei / Technical Intern",
    labelEn: "Kenshusei / Technical Intern",
    labelJa: "技能実習 / 研修生",
    descId: "Program magang teknis di Jepang (TITP/JISSTP). Kontrak biasanya 3–5 tahun. Perhatikan biaya potongan!",
    descEn: "Japanese technical intern training (TITP/JISSTP). Typically 3–5 year contract. Watch out for contract deductions!",
    descJa: "日本の技能実習・特定技能制度。通常3〜5年の契約。受入機関の天引き項目に要注意！",
    countries: ["JP"],
    tagId: "Khusus Jepang",
    tagEn: "Japan only",
    tagJa: "日本限定",
  },
  {
    code: "student",
    icon: "🎓",
    labelId: "Mahasiswa",
    labelEn: "Student",
    labelJa: "留学生 (アルバイト/奨学金)",
    descId: "Mahasiswa dengan part-time job atau beasiswa. Penghasilan paruh waktu.",
    descEn: "Student with part-time work or scholarship income.",
    descJa: "学生アルバイトまたは奨学金。法定労働時間制限内のパートタイム所得。",
    countries: ["DE", "JP"],
  },
  {
    code: "fresh_grad",
    icon: "💼",
    labelId: "Fresh Graduate",
    labelEn: "Fresh Graduate",
    labelJa: "新卒正規雇用 (正社員)",
    descId: "Karyawan baru dengan kontrak kerja reguler.",
    descEn: "New employee on a regular employment contract.",
    descJa: "大学・大学院卒業後のフルタイム正規雇用（正社員契約）。",
    countries: ["DE", "JP"],
  },
  {
    code: "custom",
    icon: "⚙️",
    labelId: "Kustom / Lainnya",
    labelEn: "Custom / Other",
    labelJa: "手動設定 / その他契約",
    descId: "Input manual penghasilan dan potongan sesuai kontrakmu.",
    descEn: "Manually enter your income and deductions from your contract.",
    descJa: "雇用契約書に記載の月額給与と控除額を任意に入力。",
    countries: ["DE", "JP"],
  },
];

export function Step2Pathway({ state, dispatch, onNext, onBack }: Step2Props) {
  const { locale } = useI18n();

  const txt = (idStr: string, enStr: string, jaStr: string) =>
    locale === "ja" ? jaStr : locale === "en" ? enStr : idStr;

  const availablePathways = PATHWAYS.filter(
    (p) => !state.country || p.countries.includes(state.country ?? "")
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-display font-bold text-white">
          {txt("Jalur Penghasilan", "Income Pathway", "キャリア区分・就労形態")}
        </h2>
        <p className="text-white/50">
          {txt(
            "Apa status kamu di sana?",
            "What is your status there?",
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
                isSelected ? "ring-2 ring-brand-400" : ""
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
                    <span className="font-semibold text-white">
                      {locale === "ja" ? pathway.labelJa : locale === "en" ? pathway.labelEn : pathway.labelId}
                    </span>
                    {pathway.tagId && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(249, 134, 7, 0.15)",
                          border: "1px solid rgba(249, 134, 7, 0.3)",
                          color: "#ffa528",
                        }}
                      >
                        {locale === "ja" ? pathway.tagJa : locale === "en" ? pathway.tagEn : pathway.tagId}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/50 mt-1 leading-relaxed">
                    {locale === "ja" ? pathway.descJa : locale === "en" ? pathway.descEn : pathway.descId}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center text-xs text-white flex-shrink-0">
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
          ← {txt("Kembali", "Back", "戻る")}
        </button>
        <button
          id="wizard-step2-next"
          onClick={onNext}
          disabled={!state.pathway}
          className={`btn-primary flex-[2] py-3 ${!state.pathway ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          {txt("Lanjut →", "Continue →", "次へ進む →")}
        </button>
      </div>
    </div>
  );
}
