/**
 * @bandinghidup/core — Risk Diagnostic Engine
 *
 * Evaluates financial scenarios and returns explainable diagnostic objects.
 * Each diagnostic has a code, severity level, title, message, and suggestion.
 * Supports localization in Indonesian ('id'), English ('en'), and Japanese ('ja').
 *
 * Levels:
 *   🔴 red   — Critical: deficit or savings shortfall (must act)
 *   🟡 amber — Warning: high risk, incomplete data
 *   🟢 green — Viable: healthy scenario
 */

import type { PathwayCode } from "../types/supabase.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiagnosticLevel = "green" | "amber" | "red";

export type DiagnosticCode =
  | "MONTHLY_DEFICIT"
  | "SAVINGS_SHORTFALL"
  | "HIGH_RENT_SHARE"
  | "VERY_HIGH_RENT_SHARE"
  | "MISSING_JP_DEDUCTIONS"
  | "VIABLE"
  | "GOOD_SAVINGS_BUFFER"
  | "BELOW_GERMANY_BENCHMARK";

export interface DiagnosticResult {
  code: DiagnosticCode;
  level: DiagnosticLevel;
  /** Short title for alert header */
  title: string;
  /** Detailed explanation */
  message: string;
  /** Actionable suggestion */
  suggestion: string;
}

export interface DiagnosticInput {
  /** Net monthly take-home pay in minor units */
  netMonthlyIncome: bigint;
  /** Total monthly recurring expenses (housing + basket) in minor units */
  totalMonthlyExpenses: bigint;
  /** Monthly housing cost specifically (for rent-to-income ratio) */
  monthlyHousingCost: bigint;
  /** Total upfront relocation cost in minor units */
  totalUpfrontRelocationCost: bigint;
  /** User's available savings to cover upfront costs, in minor units */
  availableSavings: bigint;
  /** True if JP trainee but all contract deductions entered as 0 */
  hasZeroDeductionsJPTrainee: boolean;
  /** Pathway to apply relevant rules */
  pathway: PathwayCode;
  /** Target language for diagnostic text ('id', 'en', 'ja') */
  locale?: "id" | "en" | "ja" | undefined;
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const HIGH_RENT_THRESHOLD = 0.45;        // 45%
const VERY_HIGH_RENT_THRESHOLD = 0.60;   // 60%
const HEALTHY_RENT_THRESHOLD = 0.35;     // 35%
const GOOD_SAVINGS_RATE_THRESHOLD = 0.15; // 15% of net

// ─── Diagnostic Engine ────────────────────────────────────────────────────────

export function evaluateDiagnostics(input: DiagnosticInput): DiagnosticResult[] {
  const {
    netMonthlyIncome,
    totalMonthlyExpenses,
    monthlyHousingCost,
    totalUpfrontRelocationCost,
    availableSavings,
    hasZeroDeductionsJPTrainee,
    pathway,
    locale = "id",
  } = input;

  const results: DiagnosticResult[] = [];
  const monthlyBalance = netMonthlyIncome - totalMonthlyExpenses;

  const rentRatio =
    netMonthlyIncome === 0n
      ? 0
      : Number(monthlyHousingCost) / Number(netMonthlyIncome);

  const rentPct = Math.round(rentRatio * 100);

  // ── 🔴 MONTHLY DEFICIT ────────────────────────────────────────────────────
  if (monthlyBalance < 0n) {
    if (locale === "id") {
      results.push({
        code: "MONTHLY_DEFICIT",
        level: "red",
        title: "Defisit Bulanan — Pengeluaran Melebihi Gaji",
        message: "Pengeluaran bulananmu melebihi gaji bersih yang kamu bawa pulang. Rencana keuangan ini belum mencukupi kebutuhan bulanan.",
        suggestion: "Kurangi pengeluaran (pilih opsi kamar/asrama lebih murah atau profil hemat), atau tanyakan kembali ke LPK/majikan terkait nominal gaji lembur atau tunjangan.",
      });
    } else if (locale === "ja") {
      results.push({
        code: "MONTHLY_DEFICIT",
        level: "red",
        title: "月次赤字 — 支出が手取り収入を超過",
        message: "毎月の総支出が手取り給与を上回っています。このままでは持続可能ではありません。",
        suggestion: "住居費（寮やシェアハウスの検討）や生活費を見直すか、残業代や手当の条件を再確認してください。",
      });
    } else {
      results.push({
        code: "MONTHLY_DEFICIT",
        level: "red",
        title: "Monthly Deficit — Expenses Exceed Income",
        message: "Your monthly expenses exceed your take-home pay. This scenario is not financially sustainable.",
        suggestion: "Reduce expenses (choose cheaper housing or a frugal lifestyle), or verify income and deduction figures with your employer.",
      });
    }
  }

  // ── 🔴 SAVINGS SHORTFALL ─────────────────────────────────────────────────
  if (totalUpfrontRelocationCost > 0n && availableSavings < totalUpfrontRelocationCost) {
    if (locale === "id") {
      results.push({
        code: "SAVINGS_SHORTFALL",
        level: "red",
        title: "Tabungan Tidak Cukup untuk Biaya Awal Pindah",
        message: "Tabungan yang kamu miliki saat ini lebih kecil dari total biaya awal pindah (deposit/kaution, perabotan, atau tiket).",
        suggestion: "Kumpulkan tabungan sebelum keberangkatan, pilih akomodasi asrama perusahaan tanpa deposit, atau tanyakan program pinjaman/talangan awal dari perusahaan.",
      });
    } else if (locale === "ja") {
      results.push({
        code: "SAVINGS_SHORTFALL",
        level: "red",
        title: "初期費用不足 — 準備金が足りません",
        message: "用意している初期貯蓄が、敷金・礼金・渡航費などの初期移転費用を下回っています。",
        suggestion: "渡航前の貯蓄を増やすか、敷金・礼金不要の社寮を雇用主に相談してください。",
      });
    } else {
      results.push({
        code: "SAVINGS_SHORTFALL",
        level: "red",
        title: "Insufficient Savings for Move-In Costs",
        message: "Your available savings are less than your upfront relocation costs (deposit, setup, travel).",
        suggestion: "Build up savings before departing, choose employer-provided housing to eliminate deposits, or inquire about company relocation assistance.",
      });
    }
  }

  // ── 🔴 VERY HIGH RENT SHARE (> 60%) ──────────────────────────────────────
  if (rentRatio > VERY_HIGH_RENT_THRESHOLD && monthlyHousingCost > 0n) {
    if (locale === "id") {
      results.push({
        code: "VERY_HIGH_RENT_SHARE",
        level: "red",
        title: `Biaya Sewa Sangat Tinggi (${rentPct}% dari Gaji Bersih)`,
        message: "Biaya tempat tinggal menyerap lebih dari 60% gaji bersihmu. Ini menyisakan sangat sedikit untuk makan, transport, dan kebutuhan darurat.",
        suggestion: "Sangat disarankan memilih asrama perusahaan (dormitory), kamar bersama (WG / sharehouse), atau menegosiasikan tunjangan perumahan.",
      });
    } else if (locale === "ja") {
      results.push({
        code: "VERY_HIGH_RENT_SHARE",
        level: "red",
        title: `家賃比率が極めて高い（手取りの${rentPct}%）`,
        message: "住居費が手取り月収の60%を超えています。食費や日用品の確保が困難になる恐れがあります。",
        suggestion: "社寮やルームシェアへの変更、または住宅手当の支給を強く検討してください。",
      });
    } else {
      results.push({
        code: "VERY_HIGH_RENT_SHARE",
        level: "red",
        title: `Rent is ${rentPct}% of Take-Home Pay`,
        message: "Your housing cost exceeds 60% of your monthly net income. This leaves very little for daily necessities.",
        suggestion: "Strongly consider employer-provided dormitory, a shared room (WG/sharehouse), or negotiating an accommodation allowance.",
      });
    }
  } else if (rentRatio > HIGH_RENT_THRESHOLD && monthlyHousingCost > 0n) {
    // ── 🟡 HIGH RENT SHARE (> 45%) ─────────────────────────────────────────
    if (locale === "id") {
      results.push({
        code: "HIGH_RENT_SHARE",
        level: "amber",
        title: `Porsi Sewa Cukup Tinggi (${rentPct}% dari Gaji Bersih)`,
        message: "Tempat tinggal memakan lebih dari 45% gaji bersihmu — di atas batas aman stabilitas keuangan (idealnya di bawah 35%).",
        suggestion: "Pertimbangkan kamar bersama (WG di Jerman / Sharehouse di Jepang) atau asrama perusahaan untuk menghemat pengeluaran.",
      });
    } else if (locale === "ja") {
      results.push({
        code: "HIGH_RENT_SHARE",
        level: "amber",
        title: `家賃負担がやや高い（手取りの${rentPct}%）`,
        message: "住居費が手取り月収の45%を超えています（推奨水準は35%以下）。",
        suggestion: "シェアハウスや社寮の利用により、住居比率を35%以下に抑えることをお勧めします。",
      });
    } else {
      results.push({
        code: "HIGH_RENT_SHARE",
        level: "amber",
        title: `Rent is ${rentPct}% of Take-Home Pay`,
        message: "Housing takes more than 45% of your take-home pay — above the recommended threshold for financial stability.",
        suggestion: "Try a shared flat (WG in Germany / Sharehouse in Japan) or company housing to reduce costs below 35%.",
      });
    }
  }

  // ── 🟡 MISSING JP DEDUCTIONS ─────────────────────────────────────────────
  if (pathway === "technical_intern" && hasZeroDeductionsJPTrainee) {
    if (locale === "id") {
      results.push({
        code: "MISSING_JP_DEDUCTIONS",
        level: "amber",
        title: "Potongan Kontrak Belum Diisi",
        message: "Kamu memilih jalur Magang/Kenshusei Jepang tetapi memasukkan ¥0 untuk semua potongan kontrak (asrama, asuransi, dll). Gaji bersih riil (Tedori) akan jauh lebih kecil dari gaji kotor (Gakumen).",
        suggestion: "Minta rincian 賃金控除協定 (perjanjian pemotongan upah) dari LPK/perusahaan dan masukkan komponen potongan (biasanya 15–30% dari gaji kotor).",
      });
    } else if (locale === "ja") {
      results.push({
        code: "MISSING_JP_DEDUCTIONS",
        level: "amber",
        title: "賃金控除が未入力です",
        message: "技能実習・研修生を選択していますが、控除額がすべて0円になっています。実際の手取り額は額面よりも大幅に少なくなります。",
        suggestion: "賃金控除協定書を確認し、寮費や社会保険料などの控除項目を入力してください（通常、額面の15〜30%程度）。",
      });
    } else {
      results.push({
        code: "MISSING_JP_DEDUCTIONS",
        level: "amber",
        title: "Contract Deductions Not Entered",
        message: "You selected the Japanese Technical Intern pathway but entered ¥0 for all employer contract deductions. Your actual take-home pay (Tedori) will be lower than your gross wage (Gakumen).",
        suggestion: "Request your wage deduction agreement from your employer/union and enter each deduction item (typically 15–30% of gross).",
      });
    }
  }

  // ── 🟢 VIABLE — positive balance + healthy rent ratio ────────────────────
  if (
    monthlyBalance >= 0n &&
    (rentRatio <= HEALTHY_RENT_THRESHOLD || monthlyHousingCost === 0n) &&
    !hasZeroDeductionsJPTrainee
  ) {
    const savingsRate =
      netMonthlyIncome === 0n
        ? 0
        : Number(monthlyBalance) / Number(netMonthlyIncome);

    const savingsPct = Math.round(savingsRate * 100);

    if (locale === "id") {
      results.push({
        code: "VIABLE",
        level: "green",
        title: "Skenario Finansial Layak & Sehat",
        message: `Sisa uang bulanan bernilai positif dan biaya sewa ${monthlyHousingCost === 0n ? "ditanggung penuh majikan" : `sebesar ${rentPct}% dari gaji bersih (sehat)`}. Rencana ini layak dijalankan.`,
        suggestion:
          savingsRate >= GOOD_SAVINGS_RATE_THRESHOLD
            ? "Bagus — kamu memiliki ruang menabung yang cukup setiap bulan. Pertimbangkan membuat pos tabungan otomatis."
            : "Pertimbangkan mencari peluang menambah surplus bulanan — tabungan kecil yang konsisten akan sangat berarti selama 2-3 tahun kontrak.",
      });

      if (savingsRate >= GOOD_SAVINGS_RATE_THRESHOLD && monthlyBalance > 0n) {
        results.push({
          code: "GOOD_SAVINGS_BUFFER",
          level: "green",
          title: `Tingkat Tabungan Sangat Baik (${savingsPct}%)`,
          message: `Kamu dapat menabung sekitar ${savingsPct}% dari gaji bersihmu setiap bulan. Akumulasi ini akan menjadi modal yang sangat signifikan setelah selesai kontrak.`,
          suggestion:
            "Catat pengeluaran riil setiap bulan agar tetap sesuai rencana, terutama dalam 3 bulan pertama saat beradaptasi dengan harga lokal.",
        });
      }
    } else if (locale === "ja") {
      results.push({
        code: "VIABLE",
        level: "green",
        title: "健全な収支計画",
        message: `月次収支が黒字で、住居費負担も${monthlyHousingCost === 0n ? "全額会社負担" : `手取りの${rentPct}%（適正水準）`}です。実行可能な計画です。`,
        suggestion:
          savingsRate >= GOOD_SAVINGS_RATE_THRESHOLD
            ? "毎月計画的に貯蓄できる余裕があります。自動積立などを検討してください。"
            : "契約期間中の生活防衛のため、少しずつでも貯蓄余力を増やす工夫を続けましょう。",
      });

      if (savingsRate >= GOOD_SAVINGS_RATE_THRESHOLD && monthlyBalance > 0n) {
        results.push({
          code: "GOOD_SAVINGS_BUFFER",
          level: "green",
          title: `良好な貯蓄率（${savingsPct}%）`,
          message: `毎月手取りの約${savingsPct}%を貯蓄に回すことができます。契約満了時には大きな資産形成につながります。`,
          suggestion: "物価に慣れる最初の3ヶ月間は、実際の出費と計画のズレをこまめにチェックしましょう。",
        });
      }
    } else {
      results.push({
        code: "VIABLE",
        level: "green",
        title: "Viable Scenario",
        message: `Monthly balance is positive and rent is ${monthlyHousingCost === 0n ? "covered by employer" : `${rentPct}% of take-home pay`}. This is a workable financial scenario.`,
        suggestion:
          savingsRate >= GOOD_SAVINGS_RATE_THRESHOLD
            ? "Great — you have room to save each month. Consider setting up an automatic savings transfer."
            : "Consider finding ways to increase your monthly surplus — even small savings compound over a 2-year contract.",
      });

      if (savingsRate >= GOOD_SAVINGS_RATE_THRESHOLD && monthlyBalance > 0n) {
        results.push({
          code: "GOOD_SAVINGS_BUFFER",
          level: "green",
          title: `${savingsPct}% Monthly Savings Rate`,
          message: `You save approximately ${savingsPct}% of your take-home pay each month. Over your contract this will add up significantly.`,
          suggestion:
            "Track actual spending vs. your plan monthly. Small overruns compound — especially in the first 3 months.",
        });
      }
    }
  }

  // Sort: red → amber → green
  const levelOrder: Record<DiagnosticLevel, number> = { red: 0, amber: 1, green: 2 };
  results.sort((a, b) => levelOrder[a.level] - levelOrder[b.level]);

  return results;
}

/** Get the highest severity level from a diagnostic array */
export function getOverallSeverity(diagnostics: DiagnosticResult[]): DiagnosticLevel {
  if (diagnostics.some((d) => d.level === "red")) return "red";
  if (diagnostics.some((d) => d.level === "amber")) return "amber";
  return "green";
}
