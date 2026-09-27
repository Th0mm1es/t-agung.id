"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useI18n } from "@/lib/i18n";

export interface ShareCardData {
  title?: string | undefined;
  sourceCity?: string | undefined;
  sourceCountry?: string | undefined;
  targetCity?: string | undefined;
  targetCountry?: string | undefined;
  grossSalaryText: string;
  netSalaryText: string;
  expensesText?: string | undefined;
  expensesSubtext?: string | undefined;
  rentText?: string | undefined;
  livingCostText?: string | undefined;
  otherExpensesText?: string | undefined;
  taxText?: string | undefined;
  deductionsText?: string | undefined;
  savingsText: string;
  foodIndexText?: string | undefined;
  foodIndexSubtext?: string | undefined;
  badgeText?: string | undefined;
  periodicityText?: string | undefined;
  remittanceText?: string | undefined;
  remittanceIdrText?: string | undefined;
}

interface ShareResultCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareCardData;
}

export function ShareResultCardModal({
  isOpen,
  onClose,
  data,
}: ShareResultCardModalProps) {
  const { locale } = useI18n();
  const [dataUrl, setDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(true);

  const txt = useCallback(
    (idStr: string, enStr: string, deStr: string, jaStr: string) => {
      if (locale === "ja") return jaStr;
      if (locale === "de") return deStr;
      if (locale === "en") return enStr;
      return idStr;
    },
    [locale]
  );

  const renderCard = useCallback(async () => {
    setIsGenerating(true);
    if (typeof document !== "undefined" && document.fonts) {
      try {
        await document.fonts.ready;
      } catch {}
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── FIXED PALETTE (Explicit contrast, dark luxury theme, immune to site theme) ──
    const COLOR_BG_START = "#080d10";
    const COLOR_BG_MID = "#0f171b";
    const COLOR_BG_END = "#06090a";
    const COLOR_CARD_BG = "rgba(18, 25, 29, 0.95)";
    const COLOR_CARD_BORDER = "rgba(42, 169, 166, 0.32)";
    const COLOR_TEXT_HEAD = "#ffffff";
    const COLOR_TEXT_BODY = "#f4f7f6";
    const COLOR_TEXT_MUTED = "rgba(244, 247, 246, 0.72)";
    const COLOR_TEXT_SOFT = "rgba(244, 247, 246, 0.52)";
    const COLOR_ACCENT = "#2aa9a6";
    const COLOR_ACCENT_BRIGHT = "#63d8d4";
    const COLOR_GOLD = "#e3b341";
    const COLOR_GREEN = "#4ade80";
    const COLOR_RED = "#f87171";

    // ── Background Gradient ───────────────────────────────────────────
    const bgGradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    bgGradient.addColorStop(0, COLOR_BG_START);
    bgGradient.addColorStop(0.5, COLOR_BG_MID);
    bgGradient.addColorStop(1, COLOR_BG_END);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1080, 1350);

    // ── Ambient Glow (Teal Top-Right, Gold Bottom-Left) ───────────────
    const tealGlow = ctx.createRadialGradient(900, 160, 20, 900, 160, 600);
    tealGlow.addColorStop(0, "rgba(42, 169, 166, 0.28)");
    tealGlow.addColorStop(1, "rgba(42, 169, 166, 0)");
    ctx.fillStyle = tealGlow;
    ctx.fillRect(0, 0, 1080, 1350);

    const goldGlow = ctx.createRadialGradient(180, 1180, 20, 180, 1180, 520);
    goldGlow.addColorStop(0, "rgba(227, 179, 65, 0.16)");
    goldGlow.addColorStop(1, "rgba(227, 179, 65, 0)");
    ctx.fillStyle = goldGlow;
    ctx.fillRect(0, 0, 1080, 1350);

    // ── Outer Decorative Frame ────────────────────────────────────────
    ctx.beginPath();
    ctx.strokeStyle = COLOR_CARD_BORDER;
    ctx.lineWidth = 3;
    ctx.roundRect(40, 40, 1000, 1270, 36);
    ctx.stroke();

    // ── Brand Header (Real Logo Mark + Typography) ─────────────────────
    // Avatar circle with crisp gradient
    ctx.beginPath();
    const avatarGrad = ctx.createLinearGradient(80, 85, 140, 145);
    avatarGrad.addColorStop(0, "#2aa9a6");
    avatarGrad.addColorStop(1, "#166a68");
    ctx.fillStyle = avatarGrad;
    ctx.arc(110, 115, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = COLOR_ACCENT_BRIGHT;
    ctx.lineWidth = 2;
    ctx.arc(110, 115, 32, 0, Math.PI * 2);
    ctx.stroke();

    // Crisp Scales / Geometry inside Logo Avatar
    ctx.beginPath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    // Scale balance beam
    ctx.moveTo(96, 112);
    ctx.lineTo(124, 112);
    // Vertical post
    ctx.moveTo(110, 104);
    ctx.lineTo(110, 126);
    // Base
    ctx.moveTo(102, 126);
    ctx.lineTo(118, 126);
    ctx.stroke();

    // App Name & Subdomain
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = COLOR_TEXT_HEAD;
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("BandingHidup", 160, 112);

    ctx.fillStyle = COLOR_ACCENT_BRIGHT;
    ctx.font = "bold 20px monospace";
    ctx.fillText("compare.t-agung.id", 160, 138);

    // Watermark Badge (Right aligned)
    ctx.textAlign = "right";
    ctx.fillStyle = COLOR_GOLD;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(
      txt(
        "PARITAS DAYA BELI RIIL",
        "REAL PURCHASING POWER PARITY",
        "REALE KAUFKRAFTPARITÄT",
        "実質購買力平価（PPP）"
      ),
      980,
      112
    );
    ctx.fillStyle = COLOR_TEXT_MUTED;
    ctx.font = "18px sans-serif";
    ctx.fillText(
      txt(
        "Pajak & Biaya Hidup 2026",
        "Taxes & Cost of Living 2026",
        "Steuern & Lebenshaltungskosten 2026",
        "税金・生活費 2026年基準"
      ),
      980,
      138
    );

    // ── Top Scenario Header Card ──────────────────────────────────────
    let routeTitle = data.title || "";
    if (data.sourceCity && data.targetCity) {
      const src = data.sourceCountry ? `${data.sourceCity} (${data.sourceCountry})` : data.sourceCity;
      const tgt = data.targetCountry ? `${data.targetCity} (${data.targetCountry})` : data.targetCity;
      routeTitle = `${src} ➔ ${tgt}`;
    }
    if (!routeTitle) {
      routeTitle = txt(
        "Simulasi Gaji & Daya Beli Internasional",
        "International Salary & Purchasing Power",
        "Internationale Gehalts- & Kaufkraftsimulation",
        "国際給与・購買力シミュレーション"
      );
    }

    ctx.beginPath();
    ctx.fillStyle = "rgba(42, 169, 166, 0.14)";
    ctx.strokeStyle = "rgba(42, 169, 166, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.roundRect(80, 185, 920, 88, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLOR_TEXT_HEAD;
    ctx.font = "bold 38px sans-serif";
    ctx.fillText(routeTitle, 540, 229);

    // ── Main Result Card (Gross Target Salary) ────────────────────────
    ctx.beginPath();
    ctx.fillStyle = COLOR_CARD_BG;
    ctx.strokeStyle = "rgba(227, 179, 65, 0.45)";
    ctx.lineWidth = 2.5;
    ctx.roundRect(80, 298, 920, 246, 26);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = COLOR_GOLD;
    ctx.font = "bold 22px sans-serif";
    ctx.fillText(
      txt(
        "TARGET GAJI KOTOR (GROSS) KONTRAK",
        "TARGET GROSS CONTRACT SALARY",
        "ZIEL-BRUTTOGEHALT IM VERTRAG",
        "契約交渉の目標額面給与"
      ),
      540,
      342
    );

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 68px sans-serif";
    ctx.fillText(data.grossSalaryText || "€0", 540, 418);

    ctx.fillStyle = COLOR_TEXT_MUTED;
    ctx.font = "22px sans-serif";
    ctx.fillText(
      data.periodicityText ||
        txt(
          "Per Bulan · Menjaga Standar Hidup Setara",
          "Per Month · Maintaining Equal Living Standard",
          "Monatlich · Gleichen Lebensstandard sichern",
          "月額 · 同等生活水準の維持"
        ),
      540,
      474
    );

    if (data.badgeText) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(42, 169, 166, 0.22)";
      ctx.strokeStyle = "rgba(99, 216, 212, 0.35)";
      ctx.lineWidth = 1;
      ctx.roundRect(260, 502, 560, 32, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = COLOR_ACCENT_BRIGHT;
      ctx.font = "bold 17px sans-serif";
      ctx.fillText(data.badgeText, 540, 518);
    }

    // ── 3 Metric Cards Row (Net Pay, Expenses, Savings) ───────────────
    const colWidth = 286;
    const colY = 572;
    const colH = 205;

    // Card 1: Gaji Bersih
    ctx.beginPath();
    ctx.fillStyle = COLOR_CARD_BG;
    ctx.strokeStyle = "rgba(99, 216, 212, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.roundRect(80, colY, colWidth, colH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = COLOR_ACCENT_BRIGHT;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(
      txt(
        "GAJI BERSIH (TAKE-HOME)",
        "TAKE-HOME PAY",
        "NETTO-AUSZAHLUNG",
        "手取り受取額"
      ),
      80 + colWidth / 2,
      colY + 40
    );

    ctx.fillStyle = COLOR_TEXT_HEAD;
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(data.netSalaryText || "€0", 80 + colWidth / 2, colY + 104);

    ctx.fillStyle = COLOR_TEXT_MUTED;
    ctx.font = "17px sans-serif";
    ctx.fillText(
      txt(
        "Gaji Bersih Diterima",
        "Net Received to Bank",
        "Auszahlung auf Bankkonto",
        "口座振込実質手取り"
      ),
      80 + colWidth / 2,
      colY + 155
    );

    // Card 2: Pengeluaran Riil
    ctx.beginPath();
    ctx.fillStyle = COLOR_CARD_BG;
    ctx.strokeStyle = "rgba(248, 113, 113, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.roundRect(397, colY, colWidth, colH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLOR_RED;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(
      txt(
        "BIAYA HIDUP RIIL",
        "REAL LIVING COSTS",
        "REALE LEBENSHALTUNGSKOSTEN",
        "実質生活費合計"
      ),
      397 + colWidth / 2,
      colY + 40
    );

    ctx.fillStyle = COLOR_TEXT_HEAD;
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(
      data.expensesText ||
        txt("Sewa + Makan", "Rent + Meals", "Miete + Verpflegung", "家賃 ＋ 食費"),
      397 + colWidth / 2,
      colY + 104
    );

    ctx.fillStyle = COLOR_TEXT_MUTED;
    ctx.font = "17px sans-serif";
    ctx.fillText(
      data.expensesSubtext ||
        txt(
          "Total Kebutuhan Pokok",
          "Total Essential Living",
          "Gesamter Grundbedarf",
          "基本生活費合計"
        ),
      397 + colWidth / 2,
      colY + 155
    );

    // Card 3: Sisa Tabungan
    ctx.beginPath();
    ctx.fillStyle = COLOR_CARD_BG;
    ctx.strokeStyle = "rgba(74, 222, 128, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.roundRect(714, colY, colWidth, colH, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLOR_GREEN;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(
      txt(
        "SISA TABUNGAN",
        "MONTHLY SURPLUS",
        "MONATLICHER ÜBERSCHUSS",
        "実質貯蓄可能額"
      ),
      714 + colWidth / 2,
      colY + 40
    );

    ctx.fillStyle = COLOR_TEXT_HEAD;
    ctx.font = "bold 32px sans-serif";
    ctx.fillText(data.savingsText || "+€0", 714 + colWidth / 2, colY + 104);

    ctx.fillStyle = COLOR_TEXT_MUTED;
    ctx.font = "17px sans-serif";
    ctx.fillText(
      txt(
        "Netto − Pengeluaran",
        "Take-Home − Expenses",
        "Netto − Ausgaben",
        "手取り給与 − 実質生活費"
      ),
      714 + colWidth / 2,
      colY + 155
    );

    // ── Itemized Deduction & Arithmetic Transparency Strip ────────────
    const stripY = 800;
    ctx.beginPath();
    ctx.fillStyle = "rgba(15, 23, 27, 0.85)";
    ctx.strokeStyle = "rgba(244, 247, 246, 0.18)";
    ctx.lineWidth = 1;
    ctx.roundRect(80, stripY, 920, 52, 14);
    ctx.fill();
    ctx.stroke();

    const rentDetail =
      data.rentText ||
      txt("Sewa Standar", "Standard Rent", "Warmmiete", "基準家賃");
    const livingDetail =
      data.livingCostText ||
      data.otherExpensesText ||
      txt("Konsumsi & Utilitas", "Living & Utilities", "Lebenshaltung & Nebenkosten", "生活費・光熱費");
    const taxDetail =
      data.taxText ||
      data.deductionsText ||
      txt("Deduksi Pajak & Sosial", "Tax & Social Deductions", "Steuern & Abgaben", "税金・社会保険控除");
    const stripText = `🏠 ${rentDetail}   ·   🍽️ ${livingDetail}   ·   🏛️ ${taxDetail}`;

    ctx.textAlign = "center";
    ctx.fillStyle = COLOR_TEXT_MUTED;
    ctx.font = "16px sans-serif";
    ctx.fillText(stripText, 540, stripY + 26);

    // ── Indeks Kenyang Section ────────────────────────────────────────
    const kenyangY = 874;
    ctx.beginPath();
    ctx.fillStyle = "rgba(227, 179, 65, 0.08)";
    ctx.strokeStyle = "rgba(227, 179, 65, 0.32)";
    ctx.lineWidth = 1.5;
    ctx.roundRect(80, kenyangY, 920, 160, 22);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = COLOR_GOLD;
    ctx.font = "bold 21px sans-serif";
    ctx.fillText(
      txt(
        "🥣 INDEKS KENYANG & DAYA BELI RIIL",
        "🥣 REAL PURCHASING POWER & MEAL INDEX",
        "🥣 MAHLZEITEN-INDEX & REALE KAUFKRAFT",
        "🥣 実質購買力・満腹指数（外食換算）"
      ),
      540,
      kenyangY + 38
    );

    ctx.fillStyle = COLOR_TEXT_HEAD;
    ctx.font = "bold 34px sans-serif";
    ctx.fillText(
      data.foodIndexText ||
        txt(
          "180+ Porsi Makan Hangat / Bulan",
          "180+ Warm Meals / Month",
          "180+ Mahlzeiten / Monat",
          "月180食以上の食事相当"
        ),
      540,
      kenyangY + 86
    );

    ctx.fillStyle = COLOR_TEXT_MUTED;
    ctx.font = "18px sans-serif";
    ctx.fillText(
      data.foodIndexSubtext ||
        txt(
          "Perhitungan daya beli nyata di luar ilusi kurs mata uang nominal",
          "Real purchasing power calculated beyond nominal exchange rate illusion",
          "Echte Kaufkraftberechnung jenseits nominaler Wechselkursillusionen",
          "名目為替レートの錯覚を排した実質的な現地購買力の検証"
        ),
      540,
      kenyangY + 126
    );

    // ── Remittance / Kirim ke Keluarga Callout (Optional) ──────────────
    const finalRemittance = data.remittanceText || data.remittanceIdrText;
    if (finalRemittance) {
      const remitY = 1054;
      ctx.beginPath();
      ctx.fillStyle = "rgba(42, 169, 166, 0.12)";
      ctx.strokeStyle = "rgba(42, 169, 166, 0.3)";
      ctx.lineWidth = 1;
      ctx.roundRect(80, remitY, 920, 56, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = COLOR_ACCENT_BRIGHT;
      ctx.font = "bold 18px sans-serif";
      const remitMsg = txt(
        `💌 Potensi Kirim ke Keluarga: ~${finalRemittance} sampai di Jakarta`,
        `💌 Potential Family Remittance: ~${finalRemittance} arriving in Jakarta`,
        `💌 Mögliche Überweisung an Familie: ~${finalRemittance} in Jakarta`,
        `💌 家族への送金目安: ~${finalRemittance} ジャカルタ受取`
      );
      ctx.fillText(remitMsg, 540, remitY + 28);
    }

    // ── Footer & Trust Badges ─────────────────────────────────────────
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = COLOR_TEXT_SOFT;
    ctx.font = "18px sans-serif";
    ctx.fillText(
      txt(
        "Data Resmi: Destatis (DE) · e-Stat (JP) · BPS (ID) · Pajak Progresif 2026",
        "Official Data: Destatis (DE) · e-Stat (JP) · BPS (ID) · Progressive Tax 2026",
        "Amtliche Daten: Destatis (DE) · e-Stat (JP) · BPS (ID) · Steuern 2026",
        "公的統計: ドイツ連邦統計局 · 総務省統計局 · インドネシア統計局 · 2026年税制"
      ),
      540,
      1160
    );

    ctx.fillStyle = COLOR_ACCENT_BRIGHT;
    ctx.font = "bold 26px monospace";
    ctx.fillText("https://compare.t-agung.id", 540, 1205);

    const generated = canvas.toDataURL("image/png");
    setDataUrl(generated);
    setIsGenerating(false);
  }, [data, locale, txt]);

  useEffect(() => {
    if (!isOpen) return;
    renderCard();
  }, [isOpen, renderCard]);

  if (!isOpen) return null;

  async function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `bandinghidup-${(data.targetCity || "hasil").toLowerCase()}-card.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function handleShareWhatsApp() {
    const shareTitle = txt(
      "Hasil simulasi gaji & daya beli di BandingHidup",
      "Salary & Living Cost Simulation by BandingHidup",
      "Gehalts- & Kaufkraftsimulation bei BandingHidup",
      "BandingHidup 給与・購買力シミュレーション結果"
    );
    const targetLabel = data.targetCity || txt("Luar Negeri", "Overseas", "Ausland", "海外");
    const grossLabel = txt("Gaji target", "Target salary", "Zielgehalt", "目標給与");
    const netLabel = txt("Take-Home Pay", "Take-Home Pay", "Netto-Auszahlung", "手取り受取額");
    const savingsLabel = txt("Tabungan", "Surplus / Savings", "Ersparnis", "貯蓄可能額");
    const ctaLabel = txt("Cek simulasi lengkapmu di", "Check full simulation at", "Vollständige Simulation ansehen:", "完全シミュレーションはこちら:");

    const textMsg = encodeURIComponent(
      `📊 ${shareTitle}:\n` +
      `${grossLabel}: ${data.grossSalaryText} (${targetLabel})\n` +
      `${netLabel}: ${data.netSalaryText}\n` +
      `${savingsLabel}: ${data.savingsText}\n\n` +
      `${ctaLabel} https://compare.t-agung.id`
    );

    if (navigator.canShare && dataUrl) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "bandinghidup-result.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: txt(
              "BandingHidup — Kartu Hasil Gaji Setara",
              "BandingHidup — Equivalent Salary Result Card",
              "BandingHidup — Ergebnis-Karte Vergleichsgehalt",
              "BandingHidup — 購買力・適正給与結果カード"
            ),
            text: `${shareTitle} (${data.targetCity || targetLabel}): ${data.grossSalaryText}`,
            files: [file],
          });
          return;
        }
      } catch (err) {
        // User cancelled or share failed, fallback
      }
    }

    window.open(`https://wa.me/?text=${textMsg}`, "_blank");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-card max-w-lg w-full p-6 space-y-5 border border-line bg-panel max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <span className="badge-accent text-xs">
              ✨ {txt("Kartu Siap Bagikan", "Shareable Result Card", "Teilbare Ergebnis-Karte", "SNS共有カード")}
            </span>
            <h3 className="text-lg font-bold text-[var(--text)] mt-1">
              {txt(
                "Kartu Hasil BandingHidup (1080×1350)",
                "BandingHidup Result Card (1080×1350)",
                "BandingHidup Ergebnis-Karte (1080×1350)",
                "結果カードプレビュー (1080×1350)"
              )}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-fg-muted hover:text-[var(--text)] hover:bg-panel-2 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Card Preview */}
        <div className="flex justify-center bg-black/50 p-3 rounded-xl border border-line">
          {isGenerating ? (
            <div className="py-24 text-center text-fg-muted text-sm animate-pulse">
              {txt(
                "Merender kartu gambar resolusi tinggi...",
                "Rendering high-res card...",
                "Hochauflösende Karte wird gerendert...",
                "高解像度カードを生成中..."
              )}
            </div>
          ) : (
            <img
              src={dataUrl}
              alt="BandingHidup Result Card"
              className="max-h-[380px] w-auto rounded-lg shadow-2xl border border-line"
            />
          )}
        </div>

        {/* Actions with Re-render affordance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="btn-primary py-2.5 px-3 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>📥</span>
            <span>{txt("Unduh PNG", "Download PNG", "PNG herunterladen", "PNG保存")}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            disabled={isGenerating}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold text-white bg-[#25D366] hover:bg-[#20ba59] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>💬</span>
            <span>{txt("WhatsApp", "WhatsApp", "WhatsApp", "WhatsApp")}</span>
          </button>

          <button
            onClick={renderCard}
            disabled={isGenerating}
            className="py-2.5 px-3 rounded-xl text-xs font-semibold text-fg-muted hover:text-[var(--text)] bg-panel-2 hover:bg-panel-3 border border-line transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title={txt(
              "Muat ulang jika tampilan kosong",
              "Re-render card if empty",
              "Neu laden, falls Anzeige leer",
              "カードを再生成"
            )}
          >
            <span>🔄</span>
            <span>{txt("Render Ulang", "Re-render", "Neu berechnen", "再生成")}</span>
          </button>
        </div>

        <p className="text-[11px] text-fg-soft text-center">
          {txt(
            "Format 4:5 resolusi tinggi (1080×1350) optimal untuk Instagram Stories, TikTok, feed, dan grup WhatsApp.",
            "High-resolution 4:5 format (1080×1350) ideal for WhatsApp groups, Instagram Stories, and community feeds.",
            "Hochauflösendes 4:5-Format (1080×1350), ideal für WhatsApp-Gruppen, Instagram Stories und Feeds.",
            "InstagramやWhatsAppグループの共有に最適な縦型4:5高解像度フォーマット。"
          )}
        </p>
      </div>
    </div>
  );
}
