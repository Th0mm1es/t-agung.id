/**
 * @bandinghidup/core — Career Pathways & Entry-Level Benchmarks
 *
 * Provides standardized salary, deduction, and living expense benchmarks for:
 *   a. Ausbildung (DE) / Kenshusei (JP) / Magang Kerja (ID)
 *   b. Fresh Graduate S1 (Bachelor Entry-Level)
 *   c. Fresh Graduate S2 (Master / Postgrad Entry-Level)
 *
 * Official data calibrated from:
 *   - Germany: BIBB (Datenreport 2025) & StepStone Gehaltsreport 2025/2026
 *   - Japan: MHLW Basic Survey on Wage Structure & Keidanren Spring Wage Settlement
 *   - Indonesia: BPS Keadaan Ketenagakerjaan & Mercer / Willis Towers Watson Salary Survey
 */

import type { CountryCode } from "./housing.js";
import { calculateActiveDeductions, type ActiveDeductionResult } from "./taxDeductions.js";

export type CareerPathwayCode = "ausbildung_kenshusei" | "fresh_grad_s1" | "fresh_grad_s2";

export interface CareerPathwayInfo {
  code: CareerPathwayCode;
  titleId: string;
  titleEn: string;
  titleJa: string;
  subtitleId: string;
  subtitleEn: string;
  badgeEmoji: string;
}

export const CAREER_PATHWAYS: Record<CareerPathwayCode, CareerPathwayInfo> = {
  ausbildung_kenshusei: {
    code: "ausbildung_kenshusei",
    titleId: "Ausbildung / Kenshusei",
    titleEn: "Vocational Trainee / Intern",
    titleJa: "技能実習・職業訓練（アウスビルドゥング）",
    subtitleId: "Magang Vokasi Jerman / Pemagang Teknis Jepang / Magang Kerja Resmi",
    subtitleEn: "German Vocational Training / Japan Technical Intern / Certified Apprenticeship",
    badgeEmoji: "🛠️",
  },
  fresh_grad_s1: {
    code: "fresh_grad_s1",
    titleId: "Fresh Grad (S1 / Bachelor)",
    titleEn: "Fresh Graduate (Bachelor / S1)",
    titleJa: "新卒・大卒エントリー（学部卒）",
    subtitleId: "Lulusan Baru Sarjana S1 / Einstiegsgehalt Bachelor / 大卒新卒",
    subtitleEn: "Entry-Level Bachelor Degree / Einstiegsgehalt Bachelor / First Full-Time Role",
    badgeEmoji: "🎓",
  },
  fresh_grad_s2: {
    code: "fresh_grad_s2",
    titleId: "Fresh Grad (S2 / Master)",
    titleEn: "Fresh Graduate (Master / S2)",
    titleJa: "新卒・大学院修了エントリー（修士卒）",
    subtitleId: "Lulusan Magister S2 / Einstiegsgehalt Master / Management Trainee",
    subtitleEn: "Master's Degree Entry / Corporate Trainee / 大学院新卒",
    badgeEmoji: "📜",
  },
};

export interface CareerBenchmarkResult {
  country: CountryCode;
  cityName: string;
  pathway: CareerPathwayCode;
  grossMonthlyMinorUnits: bigint;
  grossMonthlyMajor: number;
  grossYearlyMajor: number;
  recommendedRentMinorUnits: bigint;
  recommendedRentMajor: number;
  otherConsumptionMajor: number;
  totalExpensesMajor: number;
  housingTypeDescriptionId: string;
  housingTypeDescriptionEn: string;
  housingTypeDescriptionJa: string;
  deductionResult: ActiveDeductionResult;
  netMonthlyMajor: number;
  netYearlyMajor: number;
  monthlySavingsMajor: number;
  bonusContextId: string;
  bonusContextEn: string;
  bonusContextJa: string;
  auditorAdviceId: string;
  auditorAdviceEn: string;
  auditorAdviceJa: string;
}

/** City minimum wage multipliers relative to national capital (Source: Destatis / MHLW / BPS UMP) */
export const CITY_WAGE_MULTIPLIERS: Record<string, number> = {
  // Germany (Destatis / StepStone)
  Berlin: 1.00,
  Munich: 1.15,
  Frankfurt: 1.10,
  "Frankfurt am Main": 1.10,
  Hamburg: 1.05,
  Cologne: 1.02,
  Stuttgart: 1.08,
  Dusseldorf: 1.03,
  Nuremberg: 0.95,
  Leipzig: 0.90,
  Dresden: 0.88,

  // Japan (MHLW Basic Survey on Wage Structure)
  Tokyo: 1.00,
  Yokohama: 0.99,
  Osaka: 0.95,
  Nagoya: 0.92,
  Kyoto: 0.90,
  Kobe: 0.89,
  Sapporo: 0.85,
  Fukuoka: 0.84,

  // Indonesia (BPS Sakernas & UMP/UMK)
  Jakarta: 1.00,
  Surabaya: 0.88,
  Bandung: 0.78,
  Medan: 0.72,
  Semarang: 0.60,
  Denpasar: 0.58,
  Yogyakarta: 0.40,
};

/** City rent multipliers relative to national capital (Source: Destatis Mietspiegel / e-Stat / BPS Susenas) */
export const CITY_RENT_MULTIPLIERS: Record<string, number> = {
  // Germany (Destatis / Mietspiegel 2025/2026: Munich is +35% vs Berlin, Leipzig is -30%)
  Berlin: 1.00,
  Munich: 1.35,
  Frankfurt: 1.15,
  "Frankfurt am Main": 1.15,
  Hamburg: 1.10,
  Cologne: 1.00,
  Stuttgart: 1.10,
  Dusseldorf: 1.00,
  Nuremberg: 0.85,
  Leipzig: 0.70,
  Dresden: 0.68,

  // Japan (e-Stat / MHLW Housing Statistics: Tokyo 1.00, Osaka 0.78, Sapporo 0.55)
  Tokyo: 1.00,
  Yokohama: 0.90,
  Osaka: 0.78,
  Nagoya: 0.70,
  Kyoto: 0.72,
  Kobe: 0.68,
  Fukuoka: 0.58,
  Sapporo: 0.55,

  // Indonesia (BPS Susenas & Survei Biaya Hidup: Jakarta 1.00, Bandung 0.65, Semarang 0.48)
  Jakarta: 1.00,
  Denpasar: 0.80,
  Surabaya: 0.70,
  Bandung: 0.65,
  Medan: 0.60,
  Semarang: 0.48,
  Yogyakarta: 0.40,
};

/** City food & grocery price multipliers relative to national capital (Source: Statista / e-Stat / BPS SBH) */
export const CITY_FOOD_MULTIPLIERS: Record<string, number> = {
  // Germany (Döner / Dining Out: Munich €8.60 vs Berlin €7.50 vs Leipzig €6.75)
  Berlin: 1.00,
  Munich: 1.15,
  Frankfurt: 1.10,
  "Frankfurt am Main": 1.10,
  Hamburg: 1.05,
  Cologne: 1.00,
  Stuttgart: 1.06,
  Dusseldorf: 1.02,
  Nuremberg: 0.95,
  Leipzig: 0.90,
  Dresden: 0.90,

  // Japan (Retail Price Survey: Tokyo ¥620 vs Osaka ¥570 vs Sapporo ¥530)
  Tokyo: 1.00,
  Yokohama: 0.98,
  Kyoto: 0.95,
  Osaka: 0.92,
  Nagoya: 0.90,
  Kobe: 0.90,
  Fukuoka: 0.85,
  Sapporo: 0.85,

  // Indonesia (Survei Biaya Hidup: Jakarta Rp 20.000 vs Bandung Rp 16.000 vs Semarang Rp 13.000)
  Jakarta: 1.00,
  Denpasar: 0.90,
  Surabaya: 0.85,
  Bandung: 0.80,
  Medan: 0.80,
  Semarang: 0.65,
  Yogyakarta: 0.60,
};

export function getCityRentMultiplier(cityName: string): number {
  if (CITY_RENT_MULTIPLIERS[cityName] !== undefined) return CITY_RENT_MULTIPLIERS[cityName];
  if (cityName === "Frankfurt am Main") return CITY_RENT_MULTIPLIERS["Frankfurt"] ?? 1.15;
  return 1.0;
}

export function getCityFoodMultiplier(cityName: string): number {
  if (CITY_FOOD_MULTIPLIERS[cityName] !== undefined) return CITY_FOOD_MULTIPLIERS[cityName];
  if (cityName === "Frankfurt am Main") return CITY_FOOD_MULTIPLIERS["Frankfurt"] ?? 1.10;
  return 1.0;
}

export function getCityWageMultiplier(cityName: string): number {
  if (CITY_WAGE_MULTIPLIERS[cityName] !== undefined) return CITY_WAGE_MULTIPLIERS[cityName];
  if (cityName === "Frankfurt am Main") return CITY_WAGE_MULTIPLIERS["Frankfurt"] ?? 1.10;
  return 1.0;
}

export function getCareerPathwayBenchmark(
  country: CountryCode,
  cityName: string,
  pathway: CareerPathwayCode,
  options?: {
    isJapanSecondYear?: boolean;
    familyStatus?: "single" | "married" | "married_children";
    numChildren?: number;
    taxClassDE?: 1 | 3 | 4 | 5;
    ptkpStatusID?: "TK/0" | "K/0" | "K/1" | "K/2" | "K/3";
  }
): CareerBenchmarkResult {
  const wageMult = CITY_WAGE_MULTIPLIERS[cityName] ?? 1.0;
  const rentMult = CITY_RENT_MULTIPLIERS[cityName] ?? 1.0;

  let baseGrossMajor = 0;
  let baseRentMajor = 0;
  let housingDescId = "";
  let housingDescEn = "";
  let housingDescJa = "";
  let bonusContextId = "";
  let bonusContextEn = "";
  let bonusContextJa = "";
  let auditorAdviceId = "";
  let auditorAdviceEn = "";
  let auditorAdviceJa = "";

  if (country === "DE") {
    if (pathway === "ausbildung_kenshusei") {
      baseGrossMajor = Math.round(1100 * wageMult);
      baseRentMajor = Math.round(500 * rentMult);
      housingDescId = "Kamar WG (Wohngemeinschaft) / Asrama Mahasiswa";
      housingDescEn = "Shared WG Room / Student Dormitory";
      housingDescJa = "WGシェアハウス（個室）/ 学生寮";
      bonusContextId = "Sebagian besar kontrak Ausbildung memberikan tunjangan tiket (Deutschlandticket €49) dan tunjangan buku.";
      bonusContextEn = "Most Ausbildung contracts include public transit tickets (Deutschlandticket €49) & book subsidies.";
      bonusContextJa = "多くのアウスビルドゥング契約で交通費補助（Deutschlandticket €49）や教材手当が支給されます。";
      auditorAdviceId = "💡 Pajak penghasilan sangat rendah/nihil karena di bawah Grundfreibetrag (€11.784/thn). Potongan utama adalah jaminan sosial (~19.6%).";
      auditorAdviceEn = "💡 Income tax is minimal/zero under Grundfreibetrag (€11,784/yr). Primary deduction is social security (~19.6%).";
      auditorAdviceJa = "💡 基礎控除額（Grundfreibetrag €11,784/年）以下のため所得税は極めて低額または非課税です。主な控除は社会保険料（約19.6%）です。";
    } else if (pathway === "fresh_grad_s1") {
      baseGrossMajor = Math.round(3750 * wageMult); // ~€45k/yr
      baseRentMajor = Math.round(800 * rentMult);
      housingDescId = "Apartemen 1-Zimmer / Studio Pribadi";
      housingDescEn = "1-Room Studio / Private Flat";
      housingDescJa = "1 Zimmer（ワンルーム）/ 専用アパート";
      bonusContextId = "Gaji tahunan umumnya dibagi 12 atau 13 bulan (Weihnachtsgeld / Bonus Natal).";
      bonusContextEn = "Annual salary often paid over 12 or 13 installments (Christmas bonus / Weihnachtsgeld).";
      bonusContextJa = "年収は通常12分割または13分割（クリスマス手当・Weihnachtsgeld）で支給されます。";
      auditorAdviceId = "💡 Total potongan Steuerklasse 1 sekitar 38-40% (pajak progresif + asuransi kesehatan & pensiun).";
      auditorAdviceEn = "💡 Tax Class 1 total deductions average 38-40% (progressive tax + statutory health & pension).";
      auditorAdviceJa = "💡 税区分1（独身・子供なし）の総控除率は累進課税と健康・年金保険を合わせて約38〜40%です。";
    } else {
      // fresh_grad_s2
      baseGrossMajor = Math.round(4400 * wageMult); // ~€52.8k/yr
      baseRentMajor = Math.round(900 * rentMult);
      housingDescId = "Apartemen 1.5 - 2 Zimmer Nyaman";
      housingDescEn = "1.5 to 2-Room Comfortable Flat";
      housingDescJa = "1.5〜2 Zimmer 快適アパート";
      bonusContextId = "Seringkali mencakup bonus performa tahunan 5–10% dan skema pensiun perusahaan (bAV).";
      bonusContextEn = "Often includes 5–10% performance bonus and company pension match (bAV).";
      bonusContextJa = "年間5〜10%の業績賞与や企業年金（bAV）制度が含まれることが一般的です。";
      auditorAdviceId = "💡 Dengan gaji di atas €50.000/thn, perhatikan plafon batas iuran asuransi kesehatan (Beitragsbemessungsgrenze).";
      auditorAdviceEn = "💡 At salaries >€50,000/yr, observe statutory health insurance contribution caps.";
      auditorAdviceJa = "💡 年収5万ユーロ超では、公的健康保険の上限基準額（Beitragsbemessungsgrenze）に留意してください。";
    }
  } else if (country === "JP") {
    if (pathway === "ausbildung_kenshusei") {
      baseGrossMajor = Math.round(180000 * wageMult);
      baseRentMajor = Math.round(22000 * rentMult);
      housingDescId = "Kamar Asrama Perusahaan (Kigyo Ryo / 企業寮)";
      housingDescEn = "Employer Company Dormitory";
      housingDescJa = "企業寮 / 社宅（個室または相部屋）";
      bonusContextId = "Kontrak magang umumnya tidak memiliki bonus besar, namun akomodasi disubsidi langsung oleh perusahaan penerima.";
      bonusContextEn = "Trainee contracts rarely have large bonuses, but housing is subsidized directly by employer.";
      bonusContextJa = "実習生契約では基本賞与は少額ですが、受入企業により社宅費が大幅に補助されます。";
      auditorAdviceId = "💡 Jebakan Tahun ke-2: Di tahun ke-1 bebas Pajak Daerah (Juminzei). Mulai bulan Juni tahun ke-2, gaji bersih akan terpotong ~¥15.000-¥20.000/bln untuk Juminzei!";
      auditorAdviceEn = "💡 2nd-Year Trap: Year 1 is exempt from Inhabitant Tax (Juminzei). From June of Year 2, net pay drops by ~¥15,000-¥20,000/mo!";
      auditorAdviceJa = "💡 2年目の住民税注意点：1年目は住民税非課税ですが、2年目6月以降は前年所得に基づき月額約1.5万〜2万円の住民税が天引きされます。";
    } else if (pathway === "fresh_grad_s1") {
      baseGrossMajor = Math.round(235000 * wageMult);
      baseRentMajor = Math.round(65000 * rentMult);
      housingDescId = "Apartemen Studio 1K / Manshon";
      housingDescEn = "1K Studio Apartment / Manshon";
      housingDescJa = "1K / ワンルームマンション";
      bonusContextId = "Tradisi bonus musim panas (Juni) dan musim dingin (Desember) setara 2–4 bulan gaji kotor per tahun.";
      bonusContextEn = "Biannual bonus culture (Summer June & Winter Dec) typically adds 2–4 months gross salary yearly.";
      bonusContextJa = "夏冬の賞与（ボーナス）は年間2〜4ヶ月分が一般的です。";
      auditorAdviceId = "💡 Sebagian besar perusahaan Jepang memberikan tunjangan transportasi harian (Tsukin Teate) 100% penuh di luar gaji pokok.";
      auditorAdviceEn = "💡 Most Japanese companies provide 100% commuter transit allowance (Tsukin Teate) on top of base pay.";
      auditorAdviceJa = "💡 日本の企業の多くは全額通勤手当（非課税枠内）を基本給とは別枠で支給します。";
    } else {
      // fresh_grad_s2
      baseGrossMajor = Math.round(265000 * wageMult);
      baseRentMajor = Math.round(75000 * rentMult);
      housingDescId = "Apartemen 1DK / 1LDK Nyaman";
      housingDescEn = "1DK / 1LDK Modern Apartment";
      housingDescJa = "1DK / 1LDK 快適マンション";
      bonusContextId = "Bonus tahunan rata-rata 3–5 bulan gaji di perusahaan multinasional / R&D tech.";
      bonusContextEn = "Average annual bonus 3–5 months at multinational corporations / tech R&D firms.";
      bonusContextJa = "グローバル企業やR&D研究職では年間賞与3〜5ヶ月分が標準的です。";
      auditorAdviceId = "💡 Lulusan S2 di Jepang memiliki poin tinggi untuk visa 'Highly Skilled Professional' (Koudo Jinzai) yang mempercepat Permanent Residency (PR).";
      auditorAdviceEn = "💡 Master's graduates in Japan gain extra points for Highly Skilled Professional visa, fast-tracking Permanent Residency.";
      auditorAdviceJa = "💡 大学院修士修了者は「高度専門職」ポイント加算があり、永住権（PR）申請までの期間を大幅に短縮できます。";
    }
  } else {
    // Indonesia
    if (pathway === "ausbildung_kenshusei") {
      baseGrossMajor = Math.round(5396000 * wageMult);
      baseRentMajor = Math.round(1400000 * rentMult);
      housingDescId = "Kamar Kost Standar (Kamar Mandi Luar / Bersama)";
      housingDescEn = "Standard Kost Room (Shared Bathroom)";
      housingDescJa = "標準コス（バストイレ共用）";
      bonusContextId = "Uang saku magang resmi setara UMR, umumnya belum mendapatkan THR penuh kecuali ada kebijakan internal.";
      bonusContextEn = "Official trainee stipend matches regional minimum wage, usually prorated THR.";
      bonusContextJa = "公式研修手当は地域最低賃金（UMR）基準で支給されます。";
      auditorAdviceId = "💡 Penghasilan di bawah PTKP (Rp 4.5jt/bln) bebas PPh 21, hanya dipotong BPJS Ketenagakerjaan magang ~0.54%.";
      auditorAdviceEn = "💡 Income under PTKP is free from PPh 21 tax, only minimal BPJS trainee coverage applied.";
      auditorAdviceJa = "💡 PTKP（年5400万ルピア）以下のため所得税（PPh 21）は非課税、研修生向けBPJSのみ控除されます。";
    } else if (pathway === "fresh_grad_s1") {
      baseGrossMajor = Math.round(7500000 * wageMult);
      baseRentMajor = Math.round(2200000 * rentMult);
      housingDescId = "Kamar Kost AC KM Dalam / Studio Sederhana";
      housingDescEn = "Air-conditioned Kost with Ensuite Bathroom";
      housingDescJa = "エアコン・バス付コス / 小型スタジオ";
      bonusContextId = "Wajib memperoleh 1x bulan THR (Tunjangan Hari Raya) keagamaan dan asuransi kesehatan BPJS.";
      bonusContextEn = "Entitled to 1 month religious holiday bonus (THR) and BPJS health insurance.";
      bonusContextJa = "宗教大祭手当（THR・基本給1ヶ月分相当）およびBPJS健康保険の加入が法定義務付けられています。";
      auditorAdviceId = "💡 Skema TER PPh 21 (PP 58/2023) membuat potongan pajak bulanan sangat rapi dan konsisten berkisar 0.25% - 1.5%.";
      auditorAdviceEn = "💡 Indonesia TER tax scheme ensures clear monthly deductions between 0.25% - 1.5% for fresh grads.";
      auditorAdviceJa = "💡 新規則（PP 58/2023 TER）により新卒の月次PPh 21源泉徴収率は約0.25%〜1.5%と極めて明瞭です。";
    } else {
      // fresh_grad_s2
      baseGrossMajor = Math.round(12000000 * wageMult);
      baseRentMajor = Math.round(3500000 * rentMult);
      housingDescId = "Kost Eksklusif / Apartemen Studio 1BR";
      housingDescEn = "Exclusive Serviced Kost / 1BR Apartment";
      housingDescJa = "高級サービスコス / 1BRアパート";
      bonusContextId = "Program Management Trainee (MT) umumnya menawarkan bonus kinerja tahunan 1–3x bulan gaji + THR.";
      bonusContextEn = "Management Trainee (MT) tracks usually offer 1–3x monthly performance bonus plus statutory THR.";
      bonusContextJa = "マネジメント・トレイニー（MT）等では年間1〜3ヶ月の業績賞与とTHRが支給されます。";
      auditorAdviceId = "💡 Potongan BPJS Ketenagakerjaan & Kesehatan memiliki batas atas (ceiling) sehingga beban persentase deduksi relatif lebih hemat.";
      auditorAdviceEn = "💡 BPJS salary caps apply, keeping the total statutory deduction burden percentage economical.";
      auditorAdviceJa = "💡 BPJS控除には上限額が設定されているため、高額給与帯ほど控除率の割合が低減します。";
    }
  }

  const decimals = country === "DE" ? 2 : 0;
  const grossMinor = BigInt(Math.round(baseGrossMajor * Math.pow(10, decimals)));
  const rentMinor = BigInt(Math.round(baseRentMajor * Math.pow(10, decimals)));

  const deductionResult = calculateActiveDeductions({
    country,
    grossMonthlyMinorUnits: grossMinor,
    familyStatus: options?.familyStatus ?? "single",
    numChildren: options?.numChildren,
    taxClassDE: options?.taxClassDE,
    isJapanSecondYear: options?.isJapanSecondYear,
    ptkpStatusID: options?.ptkpStatusID,
  });

  const netMajor = deductionResult.netMonthlyMajor;
  // Estimated living consumption besides rent (food, transit, utilities): ~35% of gross or basic basket
  const otherConsumptionMajor = Math.round(baseRentMajor * 0.9);
  const totalExpensesMajor = baseRentMajor + otherConsumptionMajor;
  const monthlySavingsMajor = netMajor - totalExpensesMajor;

  return {
    country,
    cityName,
    pathway,
    grossMonthlyMinorUnits: grossMinor,
    grossMonthlyMajor: baseGrossMajor,
    grossYearlyMajor: baseGrossMajor * 12,
    recommendedRentMinorUnits: rentMinor,
    recommendedRentMajor: baseRentMajor,
    otherConsumptionMajor,
    totalExpensesMajor,
    housingTypeDescriptionId: housingDescId,
    housingTypeDescriptionEn: housingDescEn,
    housingTypeDescriptionJa: housingDescJa,
    deductionResult,
    netMonthlyMajor: netMajor,
    netYearlyMajor: netMajor * 12,
    monthlySavingsMajor,
    bonusContextId,
    bonusContextEn,
    bonusContextJa,
    auditorAdviceId,
    auditorAdviceEn,
    auditorAdviceJa,
  };
}
