"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currencyContext";
import { QuickHeroSimulator, type PathwayPreset } from "@/components/home/QuickHeroSimulator";
import { SavedScenarios } from "@/components/home/SavedScenarios";
import { CommentsSection } from "@/components/common/CommentsSection";

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: string;
  label: string;
}) {
  return (
    <div className="stat-card text-center animate-fade-in p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-xl font-bold text-gradient-brand">{value}</div>
      <div className="text-xs text-[var(--muted)]">{label}</div>
    </div>
  );
}

// ─── Feature Badge ────────────────────────────────────────────────────────────

function FeatureBadge({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--text)] transition-colors"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ─── Main Landing Page Client Component ──────────────────────────────────────

export function LandingPageClient() {
  const { t, locale } = useI18n();
  const { exchangeRates } = useCurrency();
  const [selectedPathway, setSelectedPathway] = useState<PathwayPreset>("kenshusei");

  const formattedDataDate = useMemo(() => {
    try {
      const d = exchangeRates?.fetchedAt ? new Date(exchangeRates.fetchedAt) : new Date();
      return d.toLocaleDateString(
        locale === "de" ? "de-DE" : locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "id-ID",
        { year: "numeric", month: "long", day: "numeric" }
      );
    } catch {
      return "Q1 2026";
    }
  }, [exchangeRates?.fetchedAt, locale]);

  const handleSelectOnRamp = (pathway: PathwayPreset) => {
    setSelectedPathway(pathway);
    if (typeof window !== "undefined") {
      const el = document.getElementById("quick-simulator");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  const txt = (
    idStr: string,
    enStr: string,
    deStr: string,
    jaStr: string
  ) => {
    if (locale === "de") return deStr;
    if (locale === "ja") return jaStr;
    if (locale === "en") return enStr;
    return idStr;
  };

  const glossaryItems = [
    {
      term: "Gakumen vs Tedori (額面 vs 手取り)",
      country: "🇯🇵 Jepang",
      desc: txt(
        "Gakumen adalah gaji kotor yang tertulis di kontrak. Tedori adalah gaji bersih yang benar-benar masuk ke rekening bank Anda setelah dipotong pajak, asuransi Shakai Hoken, dan sewa asrama.",
        "Gakumen is the gross salary on contract. Tedori is the take-home pay transferred to your bank after taxes, social insurance, and dorm deductions.",
        "Gakumen ist das vertragliche Bruttogehalt. Tedori ist der tatsächliche Nettoauszahlungsbetrag nach Abzug von Steuern, Sozialversicherungen und Wohnheimkosten.",
        "額面は契約上の総支給額。手取りは社会保険料・税金・寮費控除後に実際に銀行口座に振り込まれる金額です。"
      ),
    },
    {
      term: "Warmmiete vs Kaltmiete",
      country: "🇩🇪 Jerman",
      desc: txt(
        "Kaltmiete adalah sewa dingin (hanya fisik kamar). Warmmiete sudah mencakup pemanas musim dingin (Heizung), air, dan pemeliharaan gedung (Nebenkosten) yang dibayar langsung sekaligus ke pemilik rumah (Vermieter/Landlord). Berbeda dengan di Jepang dan Indonesia di mana sewa hanya untuk fisik kamar dan tagihan utilitas (listrik, gas, air) dibayar mandiri langsung ke masing-masing provider/perusahaan utilitas.",
        "Kaltmiete is cold rent (physical room space only). Warmmiete includes winter heating, water, and building maintenance (Nebenkosten) which are paid directly to the landlord in one package. Unlike in Japan and Indonesia where rent covers only the room, while utilities (electricity, water, gas) are paid separately directly to utility providers.",
        "Kaltmiete ist die reine Raummiete. Warmmiete beinhaltet Nebenkosten wie Heizung und Wasser, die direkt an den Vermieter gezahlt werden (Strom/Internet separat). Im Gegensatz zu Japan und Indonesien, wo Versorgerverträge separat mit den Anbietern abgerechnet werden.",
        "Kaltmieteは基本家賃（部屋代のみ）。Warmmieteは冬季暖房費・水道・共益費等を含み、家主（大家）に一括して支払います（電気・ネットは個別契約）。日本やインドネシアと異なり、光熱費の一部が家賃に含まれて請求されるのが特徴です。"
      ),
    },
    {
      term: "Sperrkonto (Rekening Blokir)",
      country: "🇩🇪 Jerman",
      desc: txt(
        "Rekening bank khusus di Jerman untuk syarat visa studi/pelatihan mandiri. Uang dicairkan otomatis secara berkala per bulan (standar resmi 2026: ~€992/bln) untuk menjamin biaya hidup Anda.",
        "A blocked German bank account required for certain student/training visas, releasing a fixed monthly amount (2026 benchmark: ~€992/mo) for living expenses.",
        "Ein deutsches Sperrkonto zur Sicherung des Lebensunterhalts für Visumanträge (Richtwert 2026: ca. €992/Monat).",
        "ドイツのビザ申請で求められる閉鎖口座。生活費を保証するため、毎月一定額（2026年基準：約€992/月）ずつ分割で引き出せます。"
      ),
    },
    {
      term: "Shakai Hoken (社会保険)",
      country: "🇯🇵 Jepang",
      desc: txt(
        "Asuransi sosial gabungan di Jepang (Kesehatan + Pensiun Kosei Nenkin). Memotong sekitar 15-16% dari gaji kotor bulanan Anda, namun menjamin biaya dokter hanya bayar 30% dan uang pensiun dapat diklaim saat pulang (Lump-sum Withdrawal).",
        "Japan's public health & pension package, taking ~15-16% of gross pay. Covers 70% of medical costs, and pension contributions can be refunded upon returning home.",
        "Japanisches Sozialversicherungspaket (Kranken- und Rentenversicherung), ca. 15-16% Abzug vom Bruttogehalt.",
        "日本の健康保険と厚生年金の総称。総支給の約15〜16%が控除されますが、医療費自己負担が3割になり、帰国時に脱退一時金を請求できます。"
      ),
    },
  ];

  const hiddenCosts = [
    {
      flag: "🇩🇪",
      title: txt("Biaya Tersembunyi di Jerman", "Hidden Costs in Germany", "Versteckte Kosten in Deutschland", "ドイツで注意すべき想定外費用"),
      items: [
        {
          label: "Rundfunkbeitrag (Iuran TV & Radio Publik)",
          cost: "€18,36 / bulan",
          note: txt(
            "Wajib per apartemen/WG, tidak peduli Anda punya TV atau tidak.",
            "Mandatory per flat/WG, whether you own a TV/radio or not.",
            "Verpflichtender Rundfunkbeitrag pro Wohnung/WG, unabhängig von TV-Besitz.",
            "テレビの有無に関わらず、世帯ごとに毎月支払いが義務付けられています。"
          ),
        },
        {
          label: "Kaution (Deposit Sewa Kamar)",
          cost: "2-3x Sewa Dingin (Kaltmiete)",
          note: txt(
            "Modal awal tunai yang harus diserahkan sebelum serah terima kunci (misal €800 - €1.500).",
            "Upfront cash deposit held until lease ends (e.g. €800 - €1,500).",
            "Mietkaution vor Schlüsselübergabe (ca. 2-3 Kaltmieten).",
            "入居時に支払う敷金。退去時まで拘束されます。"
          ),
        },
        {
          label: "Iuran Kesehatan TK / AOK (Krankenkasse)",
          cost: "~10% dari Gaji Kotor",
          note: txt(
            "Dipungut langsung dari uang saku Ausbildung untuk jaminan kesehatan paripurna.",
            "Automatically deducted from vocational allowance for comprehensive healthcare.",
            "Gesetzliche Krankenversicherung, wird direkt von der Ausbildungsvergütung einbehalten.",
            "公的医療保険料。給与から毎月天引きされます。"
          ),
        },
        {
          label: txt(
            "Makan di Luar (Restoran / Imbiss)",
            "Dining Out (Restaurants / Imbiss)",
            "Außer-Haus-Verpflegung (Gastronomie)",
            "外食費（レストラン・インビス）"
          ),
          cost: "€12 - €25+ / makan",
          note: txt(
            "⚠️ Makan di restoran Jerman jauh lebih mahal dibanding warung di Indonesia atau teishoku/Sukiya di Jepang. Memasak sendiri (food prep) adalah kunci utama agar uang saku Anda bisa ditabung.",
            "⚠️ Dining out in Germany is significantly pricier than casual dining in Indonesia or cheap chain eateries in Japan. Cooking at home is essential to preserve your savings.",
            "⚠️ Essen im Restaurant ist in Deutschland merklich teurer als in Japan oder Indonesien. Selbstkochen ist der größte Hebel für Ersparnisse.",
            "⚠️ ドイツの外食費は日本（松屋・すき家等）やインドネシアの屋台と比べかなり割高です。自炊が貯蓄を残すための最重要ポイントです。"
          ),
        },
      ],
    },
    {
      flag: "🇯🇵",
      title: txt("Biaya Tersembunyi di Jepang", "Hidden Costs in Japan", "Versteckte Kosten in Japan", "日本で注意すべき想定外費用"),
      items: [
        {
          label: "Juminzei (Pajak Penduduk Daerah)",
          cost: "~¥8.000 - ¥15.000 / bulan",
          note: txt(
            "⚠️ Hati-hati: Di tahun pertama nol, tapi mulai tahun ke-2 otomatis memotong gaji!",
            "⚠️ Watch out: Zero in year 1, but automatically deducted starting from Year 2!",
            "⚠️ Achtung: Im 1. Jahr steuerfrei, ab dem 2. Jahr greift der automatische Gehaltsabzug!",
            "⚠️ 1年目は非課税ですが、2年目から前年所得に基づき天引きが始まります！"
          ),
        },
        {
          label: "Shikikin & Reikin (Uang Jaminan & Hadiah Pemilik)",
          cost: "1-2 bulan sewa",
          note: txt(
            "Jika tidak tinggal di asrama pabrik, sewa apato mandiri memerlukan modal awal cukup besar.",
            "If renting independently outside factory dorms, upfront key money is required.",
            "Außerhalb von Firmenwohnheimen fallen für private Wohnungen erhebliche Vorabkosten an (Kaution & Schlüsselgeld).",
            "一般アパートを借りる場合の敷金・礼金。"
          ),
        },
        {
          label: "Tagihan Pemanas Gas & Listrik Musim Dingin",
          cost: "+¥6.000 - ¥12.000 / bulan",
          note: txt(
            "Tagihan gas & listrik di bulan Desember-Februari biasanya naik 2x lipat dari musim panas.",
            "Winter heating gas bills can double during freezing months (Dec-Feb).",
            "Heiz- und Stromkosten verdoppeln sich in den Wintermonaten (Dezember–Februar) im Vergleich zum Sommer.",
            "冬季（12月〜2月）の暖房・ガス代は夏季の約2倍に跳ね上がります。"
          ),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="flex-1">
        {/* ── Hero Section (2-Column Responsive Layout) ──────────────────── */}
        <section
          id="hero"
          className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 overflow-hidden"
          aria-labelledby="hero-headline"
        >
          <div className="relative max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Empathetic Copy & Value Pillars */}
              <div className="lg:col-span-6 space-y-6 text-left">
                {/* Lightweight Persona On-Ramp */}
                <div className="space-y-2">
                  <div className="text-[11px] font-mono text-[var(--soft)] uppercase tracking-wider font-semibold">
                    {txt(
                      "Pilih Tujuan Anda:",
                      "Choose Your Goal:",
                      "Ihr Zielland wählen:",
                      "渡航先を選択:"
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      id="onramp-japan-btn"
                      onClick={() => handleSelectOnRamp("kenshusei")}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedPathway === "kenshusei"
                          ? "bg-[var(--accent)] text-white shadow-md ring-2 ring-[var(--accent)]/30 font-bold scale-[1.02]"
                          : "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-3)]"
                      }`}
                    >
                      <span>🇯🇵</span>
                      <span>{txt("Pindah ke Jepang (Kenshusei / Tokutei)", "Move to Japan (Trainee)", "Nach Japan (Praktikum)", "日本へ渡航（技能実習・特定技能）")}</span>
                    </button>

                    <button
                      type="button"
                      id="onramp-germany-btn"
                      onClick={() => handleSelectOnRamp("ausbildung")}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedPathway === "ausbildung"
                          ? "bg-[var(--accent)] text-white shadow-md ring-2 ring-[var(--accent)]/30 font-bold scale-[1.02]"
                          : "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-3)]"
                      }`}
                    >
                      <span>🇩🇪</span>
                      <span>{txt("Pindah ke Jerman (Ausbildung)", "Move to Germany (Ausbildung)", "Nach Deutschland (Ausbildung)", "ドイツへ渡航（職業訓練）")}</span>
                    </button>

                    <Link
                      href="/compare"
                      id="onramp-compare-btn"
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-3)]"
                    >
                      <span>⚖️</span>
                      <span>{txt("Bandingkan 2 Kota", "Compare 2 Cities", "2 Städte vergleichen", "2都市を直接比較")}</span>
                    </Link>
                  </div>
                </div>

                {/* Hero Main Headline */}
                <h1
                  id="hero-headline"
                  className="text-3xl sm:text-5xl font-display font-bold leading-[1.15] tracking-tight text-[var(--text)]"
                >
                  <span>
                    {txt(
                      "Berapa Sisa Uang Bersihmu di ",
                      "What Is Your Real Take-Home in ",
                      "Wie viel Netto bleibt dir in ",
                      "海外生活での実質手取り・貯蓄力 "
                    )}
                  </span>
                  <span className="text-gradient-brand">
                    {txt("Jerman & Jepang?", "Germany & Japan?", "Deutschland & Japan?", "精密シミュレーター")}
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed">
                  {txt(
                    "Jangan terjebak ilusi kurs nominal! Hitung uang saku kotor ke gaji bersih masuk rekening (net take-home pay), biaya sewa kamar, dan sisa tabungan kirim ke kampung.",
                    "Don't fall for exchange rate illusions. Calculate contract allowance to take-home pay, local room rent, and estimated remittance savings.",
                    "Keine Wechselkurs-Illusionen: Berechnen Sie Ausbildungsvergütung/Bruttogehalt bis zum echten Nettoauszahlungsbetrag, Miete und Sparpotenzial.",
                    "名目為替の錯覚を防ぐ。額面給与から税金・社会保険料控除後の手取り額、家賃、生活費、本国送金可能額をリアルタイムに試算。"
                  )}
                </p>

                {/* Action CTA Buttons */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/wizard"
                    className="btn-primary py-3.5 px-6 text-sm font-semibold flex items-center gap-2 shadow-lg"
                  >
                    <span>
                      {txt(
                        "🚀 Hitung Anggaran Penuh (7 Langkah)",
                        "🚀 Open 7-Step Budget Planner",
                        "🚀 7-Schritte Budgetplaner starten",
                        "🚀 7段階詳細プランナーを開く"
                      )}
                    </span>
                    <span>→</span>
                  </Link>

                  <Link
                    href="/compare"
                    className="btn-secondary py-3.5 px-5 text-sm font-semibold flex items-center gap-2"
                  >
                    <span>⚖️</span>
                    <span>
                      {txt(
                        "Bandingkan Jalur Karir",
                        "Compare Career Pathways",
                        "Karrierepfade vergleichen",
                        "キャリア経路を比較"
                      )}
                    </span>
                  </Link>
                </div>

                {/* Trust and Privacy Badges */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <FeatureBadge
                    icon="🔒"
                    text={txt("100% Anonim", "100% Anonymous", "100% Anonym / Keine Registrierung", "100% 匿名（登録不要）")}
                  />
                  <FeatureBadge
                    icon="💰"
                    text={txt(
                      "Gratis untuk mendukung masa depan Anda",
                      "Free — supporting your future",
                      "Kostenlos — für Ihre Zukunft",
                      "無料 — あなたの未来のために"
                    )}
                  />
                  <FeatureBadge
                    icon="📊"
                    text={txt(
                      "Data Resmi 2026 (Destatis/e-Stat/BPS)",
                      "Official 2026 Stats Data",
                      "Amtliche Statistik 2026",
                      "公式政府統計 2026年基準"
                    )}
                  />
                </div>

                {/* Live Data Freshness & Non-Fabricated Scale Line */}
                <div className="pt-2 flex flex-col gap-1 text-[11px] text-[var(--soft)] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span>🕒</span>
                    <span>
                      {txt(
                        `Kurs & data biaya hidup diperbarui: ${formattedDataDate} (Destatis · e-Stat · BPS)`,
                        `Exchange rates & living costs updated: ${formattedDataDate} (Destatis · e-Stat · BPS)`,
                        `Wechselkurse & Lebenshaltungskosten aktualisiert: ${formattedDataDate} (Destatis · e-Stat · BPS)`,
                        `為替レート・生活費統計更新日: ${formattedDataDate}（公的統計基準）`
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[var(--muted)]">
                    <span>👥</span>
                    <span>
                      {txt(
                        "Digunakan oleh calon perantau & pekerja di 15+ kota di Jerman, Jepang, dan Indonesia.",
                        "Used by overseas trainees & workers exploring 15+ cities across DE, JP & ID.",
                        "Genutzt von Auszubildenden und Fachkräften in über 15 Städten in DE, JP und ID.",
                        "ドイツ・日本・インドネシアの15以上の都市を検討する実習生や若手労働者が活用。"
                      )}
                    </span>
                  </div>
                </div>

                {/* NoScript Fallback Message */}
                <noscript>
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                    {txt(
                      "Perhatian: JavaScript dinonaktifkan di browser Anda. Aktifkan JavaScript untuk menjalankan kalkulator interaktif realistis.",
                      "Notice: JavaScript is disabled in your browser. Please enable JavaScript to run the interactive real-time simulator.",
                      "Hinweis: JavaScript ist in Ihrem Browser deaktiviert. Bitte aktivieren Sie JavaScript für den interaktiven Rechner.",
                      "ご注意: JavaScriptが無効です。インタラクティブな試算を行うにはJavaScriptを有効にしてください。"
                    )}
                  </div>
                </noscript>
              </div>

              {/* Right Column: Live Interactive Quick Simulator & Saved Scenarios */}
              <div className="lg:col-span-6 w-full space-y-4">
                <QuickHeroSimulator
                  selectedPathway={selectedPathway}
                  onPathwayChange={setSelectedPathway}
                />
                <SavedScenarios />
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats Highlights Section ───────────────────────────────────── */}
        <section
          id="stats"
          aria-label="Statistics overview"
          className="py-10 px-4 sm:px-6"
          style={{
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface)",
          }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                emoji="🇩🇪"
                value="8+ Kota"
                label={txt("Jerman (Berlin, München, dll)", "German Cities", "Deutsche Städte (Berlin, München etc.)", "ドイツの主要都市")}
              />
              <StatCard
                emoji="🇯🇵"
                value="8+ Kota"
                label={txt("Jepang (Tokyo, Osaka, dll)", "Japanese Cities", "Japanische Städte (Tokio, Osaka etc.)", "日本の主要都市")}
              />
              <StatCard
                emoji="💱"
                value="Kurs Real-Time"
                label={txt("EUR · JPY · IDR · USD", "Live Exchange Rates", "Echtzeit-Wechselkurse (EUR · JPY · IDR · USD)", "リアルタイム為替連動")}
              />
              <StatCard
                emoji="🛡️"
                value="Pajak 2026"
                label={txt("Steuerklasse & Shakai Hoken", "Official Tax Brackets", "Steuerklassen & Sozialversicherung 2026", "最新税制・社会保険対応")}
              />
            </div>
          </div>
        </section>

        {/* ── 4 Core Feature Pillars ─────────────────────────────────────── */}
        <section
          id="features"
          className="py-16 sm:py-20 px-4 sm:px-6"
          aria-labelledby="features-headline"
        >
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest font-mono">
                {txt("FITUR UTAMA LENGKAP", "CORE FEATURE SUITE", "HAUPTFUNKTIONEN", "主要機能一覧")}
              </span>
              <h2
                id="features-headline"
                className="text-2xl sm:text-4xl font-display font-bold text-[var(--text)]"
              >
                {txt("Pilih Simulator Sesuai Kebutuhanmu", "Choose Your Specific Calculator", "Passenden Rechner auswählen", "目的に合わせた精密シミュレーター")}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {txt("Tiap modul dirancang untuk menjawab keraguan spesifik sebelum menandatangani kontrak atau mengajukan visa.", "Each tool is designed to solve a specific financial dilemma before signing your contract or applying for a visa.", "Jedes Modul beantwortet gezielte finanzielle Fragen vor Vertragsunterzeichnung oder Visumantrag.", "渡航前の契約締結やビザ申請における不安を解消するためのツール群。")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pillar 1: Berapa Gaji Setaraku? */}
              <div className="tagung-card-hover p-6 sm:p-7 flex flex-col justify-between space-y-5 group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">🌐</span>
                    <span className="badge-brand text-[10px]">
                      {txt("Paling Dicari", "Most Popular", "Beliebtestes Tool", "一番人気")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                    {txt("1. Berapa Gaji Setaraku?", "1. What Is My Equivalent Salary?", "1. Welches Gehalt entspricht meinem Niveau?", "1. 海外必要給与シミュレーター")}
                  </h3>
                  <p className="text-xs font-semibold text-[var(--accent)] font-mono">
                    🥙 Döner · 🍜 Gyudon / Ramen · 🍛 Nasi Padang
                  </p>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {txt("Berapa gaji kotor (gross) yang harus Anda dapatkan di Tokyo atau Berlin agar standar hidup dan daya beli Anda tetap sama dengan di Jakarta? Dilengkapi kalkulasi potongan pajak & asuransi sosial.", "Find out how much gross salary you need in Tokyo or Berlin to maintain the exact same lifestyle and purchasing power as in Jakarta.", "Welches Bruttogehalt benötigen Sie in Tokio oder Berlin, um denselben Lebensstandard wie in Jakarta zu halten? Inklusive Steuern und Sozialabgaben.", "ジャカルタでの生活水準と購買力を東京やベルリンで維持するために必要な額面給与を精密算出。")}
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)]">
                      <span>🎯</span>
                      <span>
                        {txt(
                          "Cocok untuk: Negosiasi tawaran kontrak kerja di luar negeri dan melihat kesejahteraan Anda sekarang",
                          "Best for: Negotiating overseas contract offers and assessing your current real living standard",
                          "Ideal für: Gehaltsverhandlungen bei Arbeitsverträgen im Ausland und Einblick in Ihren aktuellen Lebensstandard",
                          "海外就職・転職の給与交渉および現在の生活水準・実質購買力の把握に最適"
                        )}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/gaji-setara"
                    className="btn-primary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <span>
                      {txt("Hitung Gaji Setara Sekarang", "Calculate Equivalent Salary", "Vergleichsgehalt berechnen", "必要給与を計算する")}
                    </span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Pillar 2: Magang & Fresh Grad Comparison */}
              <div className="tagung-card-hover p-6 sm:p-7 flex flex-col justify-between space-y-5 group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">🎓</span>
                    <span className="badge-accent text-[10px]">
                      {txt("Side-by-Side", "Side-by-Side", "Direktvergleich", "並列比較")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text)] group-hover:text-amber-500 transition-colors">
                    {txt("2. Magang & Fresh Grad", "2. Trainee & Fresh Grad Comparison", "2. Ausbildung & Berufseinsteiger", "2. 実習生・新卒キャリア比較")}
                  </h3>
                  <p className="text-xs font-semibold text-[var(--accent-warm)] font-mono">
                    Ausbildung 🇩🇪 · Kenshusei 🇯🇵 · Fresh Grad S1 🇮🇩
                  </p>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {txt("Bandingkan uang saku Ausbildung di Jerman, gaji kenshusei di Jepang, dan pekerja pemula di Indonesia secara berdampingan. Lengkap dengan opsi input angka mandiri atau standar resmi kota.", "Compare vocational trainee allowances in Germany (Ausbildung), technical intern wages in Japan (Kenshusei), and entry-level salaries in Indonesia.", "Vergleichen Sie Ausbildungsvergütung in Deutschland, Kenshusei-Gehalt in Japan und Einstiegsgehälter in Indonesien Seite an Seite mit echten Lebenshaltungskosten.", "ドイツのアウスビルドゥング、日本の技能実習、インドネシアの大卒初任給の生活費・手取りを2都市並列比較。")}
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--surface-2)] text-[var(--accent-warm)] border border-[var(--border)]">
                      <span>🎯</span>
                      <span>
                        {txt("Cocok untuk: Calon peserta Ausbildung, pemagang Kenshusei & Fresh Grad S1", "Best for: Ausbildung trainees, Kenshusei interns & Fresh Grads", "Ideal für: Angehende Auszubildende, Kenshusei-Praktikanten und Absolventen", "アウスビルドゥング志望者、技能実習生、新卒求職者向け")}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/compare"
                    className="btn-secondary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 hover:border-[var(--accent-warm)]"
                  >
                    <span>
                      {txt("Bandingkan Jalur Karir", "Compare Career Pathways", "Karrierepfade vergleichen", "キャリア経路を比較する")}
                    </span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Pillar 3: Full 7-Step Budget Planner */}
              <div className="tagung-card-hover p-6 sm:p-7 flex flex-col justify-between space-y-5 group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">🧮</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                      {txt("7 Langkah Mendalam", "Full 7-Step Planner", "7-Schritte Detailanalyse", "7段階詳細プランナー")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text)] group-hover:text-purple-500 transition-colors">
                    {txt("3. Kalkulator Anggaran Penuh", "3. Full 7-Step Budget Planner", "3. Vollständiger 7-Schritte Budgetplaner", "3. 完全渡航・生活費計算機")}
                  </h3>
                  <p className="text-xs font-semibold text-purple-500 font-mono">
                    {txt("Tiket · Visa · Deposit · Keranjang Belanja · Resiko", "Flights · Visa · Deposit · Basket · Financial Runway", "Flüge · Visum · Kaution · Warenkorb · Notgroschen", "渡航費 · ビザ · 敷金 · 消費バスケット · リスク診断")}
                  </p>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {txt("Simulasi perencanaan kepindahan menyeluruh: hitung modal awal (tiket pesawat, visa, sewa awal), rincian belanja bulanan personal, dan diagnostik ketahanan finansial.", "Comprehensive relocation planner: calculate upfront costs (flights, visa, deposit), itemized grocery baskets, and financial runway diagnostics.", "Ganzheitlicher Umzugsplaner: Berechnen Sie Startkapital (Flüge, Visum, Kaution), monatliche Warenkörbe und finanzielle Notfallreserven.", "初期費用（航空券、ビザ、敷金・礼金）、毎月の詳細な消費バスケット、生活防衛資金診断の包括計画。")}
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--surface-2)] text-purple-600 dark:text-purple-300 border border-[var(--border)]">
                      <span>🎯</span>
                      <span>
                        {txt("Cocok untuk: Hitung modal awal pindah (tiket, visa, deposit sewa) & simulasi kas", "Best for: Upfront relocation capital (visa, flights, deposit) & cash flow", "Ideal für: Startkapitalplanung (Visum, Flüge, Kaution) & Cashflow-Sicherheit", "渡航初期費用とキャッシュフロー予測に最適")}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/wizard"
                    className="btn-secondary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 hover:border-purple-500"
                  >
                    <span>
                      {txt("Buka Kalkulator 7-Langkah", "Open 7-Step Calculator", "7-Schritte-Rechner öffnen", "7段階計算機を開く")}
                    </span>
                    <span>→</span>
                  </Link>
                </div>
              </div>

              {/* Pillar 4: Income Percentile Radar */}
              <div className="tagung-card-hover p-6 sm:p-7 flex flex-col justify-between space-y-5 group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">📊</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
                      {txt("Statistik Resmi", "Official Statistics", "Amtliche Statistik", "公的政府統計基準")}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text)] group-hover:text-cyan-500 transition-colors">
                    {txt("4. Posisi Persentil Gaji", "4. Income Percentile Radar", "4. Einkommens-Perzentil-Radar", "4. 所得パーセンタイル診断")}
                  </h3>
                  <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-300 font-mono">
                    BPS Susenas · e-Stat MHLW · Destatis SOEP
                  </p>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {txt("Cek posisi persentil gaji Anda di Indonesia (misal: Top 10% atau Median), serta bandingkan posisinya jika dikonversi secara nominal di Jerman dan Jepang.", "Evaluate your income percentile rank domestically (e.g. Top 10% or Median), and examine how that nominal amount ranks in Germany and Japan.", "Ermitteln Sie Ihren Einkommensrang im Heimatland (z. B. Top 10 % oder Median) und vergleichen Sie Ihre Kaufkraft mit Deutschland und Japan.", "国内所得順位（中央値や上位10%など）を診断し、為替換算した場合に現地でどのパーセンタイルに位置するかを検証。")}
                  </p>
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--surface-2)] text-cyan-600 dark:text-cyan-300 border border-[var(--border)]">
                      <span>🎯</span>
                      <span>
                        {txt("Cocok untuk: Evaluasi peringkat pendapatan & hindari ilusi nilai tukar", "Best for: Income rank evaluation & avoiding exchange rate illusion", "Ideal für: Realistische Gehaltseinstufung ohne Wechselkursillusion", "所得順位の把握と名目為替の錯覚防止に最適")}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="pt-2">
                  <Link
                    href="/persentil"
                    className="btn-secondary w-full py-3 text-xs font-semibold flex items-center justify-center gap-2 hover:border-cyan-500"
                  >
                    <span>
                      {txt("Cek Persentil Gajiku", "Check My Percentile", "Mein Perzentil prüfen", "所得順位を診断する")}
                    </span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section: Biaya Wajib & Tersembunyi (Hidden Costs Alert) ───── */}
        <section
          id="hidden-costs"
          className="py-16 px-4 sm:px-6"
          style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
        >
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest font-mono">
                {txt("⚠️ PERINGATAN PENTING", "⚠️ ESSENTIAL WATCH-OUTS", "⚠️ WICHTIGE WARNHINWEISE", "⚠️ 渡航前の必須注意点")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text)]">
                {txt("Biaya Wajib & Tersembunyi yang Sering Lupa Dihitung", "Mandatory Hidden Costs Often Overlooked", "Versteckte Pflichtabgaben, die oft vergessen werden", "見落としがちな必須経費・初期費用")}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {txt("Banyak agen LPK hanya memaparkan gaji kotor tanpa merinci potongan wajib ini. Catat dan masukkan dalam anggaran Anda!", "Many agencies only advertise gross salary without mentioning these non-negotiable costs. Factor them into your plan!", "Viele Vermittlungsagenturen werben nur mit dem Bruttogehalt ohne Pflichtabgaben zu erwähnen. Planen Sie diese fest ein!", "募集要項の額面だけに惑わされず、法的に義務付けられている控除や初期費用を正しく把握しましょう。")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {hiddenCosts.map((block) => (
                <div
                  key={block.title}
                  className="tagung-card p-6 space-y-4 border-amber-500/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{block.flag}</span>
                    <h3 className="text-lg font-bold text-[var(--text)]">{block.title}</h3>
                  </div>

                  <div className="space-y-3">
                    {block.items.map((item) => (
                      <div
                        key={item.label}
                        className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[var(--text)]">
                            {item.label}
                          </span>
                          <span className="font-mono font-bold text-amber-500">
                            {item.cost}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                          {item.note}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section: Indeks Kenyang Riil (Food Purchasing Power) ───────── */}
        <section
          id="food-index"
          className="py-16 px-4 sm:px-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest font-mono">
                {txt("DAYA BELI NYATA", "REAL PURCHASING POWER", "ECHTE KAUFKRAFT", "実質購買力指標")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text)]">
                {txt("Indeks Kenyang: 1 Jam Kerja Dapat Apa?", "Indeks Kenyang: What Does 1 Hour Buy?", "Sättigungsindex: Was kauft 1 Arbeitsstunde?", "満腹指数（Indeks Kenyang）：1時間の労働で買えるもの")}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {txt("Membandingkan upah dengan harga makanan pokok setempat adalah cara termudah memahami standar hidup riil.", "Comparing hourly wages against staple meals is the most intuitive way to grasp actual quality of life.", "Der Vergleich von Stundenlöhnen mit Grundnahrungsmitteln zeigt den echten Lebensstandard am verständlichsten.", "時給を現地の定番食料の価格と比較することで、生活の実質的な豊かさを直感的に把握できます。")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Germany */}
              <div className="tagung-card p-5 text-center space-y-3">
                <div className="text-4xl">🇩🇪 🥙</div>
                <h3 className="font-bold text-[var(--text)] text-base">Jerman (Berlin)</h3>
                <div className="text-2xl font-bold font-mono text-[var(--accent)]">
                  ~1.5 Porsi
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Döner Kebab lezat (€7.50) per 1 jam kerja magang
                </div>
                <div className="text-[11px] text-[var(--soft)] pt-1 font-mono">
                  Upah Magang: ~€11 - €13/jam
                </div>
              </div>

              {/* Japan */}
              <div className="tagung-card p-5 text-center space-y-3">
                <div className="text-4xl">🇯🇵 🍜</div>
                <h3 className="font-bold text-[var(--text)] text-base">Jepang (Tokyo)</h3>
                <div className="text-2xl font-bold font-mono text-amber-500">
                  ~2.2 Mangkok
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Gyudon Sukiya / Ramen (¥500-¥700) per 1 jam kerja
                </div>
                <div className="text-[11px] text-[var(--soft)] pt-1 font-mono">
                  Upah Minimum: ~¥1.113/jam
                </div>
              </div>

              {/* Indonesia */}
              <div className="tagung-card p-5 text-center space-y-3">
                <div className="text-4xl">🇮🇩 🍛</div>
                <h3 className="font-bold text-[var(--text)] text-base">Indonesia (Jakarta)</h3>
                <div className="text-2xl font-bold font-mono text-cyan-500">
                  ~1.2 Porsi
                </div>
                <div className="text-xs text-[var(--muted)]">
                  Nasi Padang Rendang / Ayam (Rp 25.000) per 1 jam UMR
                </div>
                <div className="text-[11px] text-[var(--soft)] pt-1 font-mono">
                  Upah UMR: ~Rp 31.000/jam
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section: Kamus Istilah Anak Rantau (Glossary) ──────────────── */}
        <section
          id="glossary"
          className="py-16 px-4 sm:px-6"
          style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
        >
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-widest font-mono">
                {txt("EDUKASI CALON PESERTA", "EXPAT DICTIONARY", "EXPAT-LEXIKON", "用語解説")}
              </span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text)]">
                {txt("Kamus Istilah Penting Anak Rantau", "Essential Expat Terminology", "Wichtige Fachbegriffe für Auslandsschaffende", "渡航前に知っておくべき必須用語")}
              </h2>
              <p className="text-sm text-[var(--muted)]">
                {txt("Pahami istilah-istilah di slip gaji dan kontrak agar tidak mudah dibodohi oknum agen nakal.", "Master the fine print on your payslip and contract so you never get taken advantage of.", "Verstehen Sie die Klauseln in Gehaltsabrechnungen und Verträgen, um böse Überraschungen zu vermeiden.", "給与明細や雇用契約書に頻出する最重要用語を平易に解説。")}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {glossaryItems.map((item) => (
                <div
                  key={item.term}
                  className="tagung-card p-5 space-y-2 hover:border-[var(--accent)] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text)] font-mono">
                      {item.term}
                    </h3>
                    <span className="text-[11px] text-[var(--accent)] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)]">
                      {item.country}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Target Audience Section ────────────────────────────────────── */}
        <section
          id="about"
          aria-label="About BandingHidup"
          className="py-16 px-4 sm:px-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text)]">
                {txt("Untuk Siapa Ini?", "Who Is This For?", "Für wen ist dieser Rechner?", "誰のためのサービスか？")}
              </h2>
              <p className="text-[var(--muted)] max-w-xl mx-auto text-sm">
                {txt("Dibuat khusus untuk mereka yang benar-benar butuh data jujur, bukan sekadar brosur agen.", "Built for people who need genuine numbers before making life-changing career moves.", "Entwickelt für Menschen, die ehrliche Daten statt Werbebroschüren von Vermittlungsagenturen brauchen.", "夢のパンフレットではなく、客観的で真実の数字を必要とする方のために。")}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  emoji: "🏭",
                  title: txt("Kenshusei / Ginou Jisshusei", "Kenshusei / Technical Intern", "Kenshusei / Technische Praktikanten (Japan)", "技能実習生・特定技能"),
                  desc: txt("Pahami perbedaan gaji kotor vs gaji bersih masuk rekening (net take-home), biaya asrama, dan sisa uang yang bisa dikirim ke orang tua di kampung.", "Understand gross salary vs net take-home pay, company dorm deductions, and actual remittance potential.", "Verstehen Sie Bruttogehalt vs. Nettoauszahlung, Wohnheimabzüge und tatsächliches Spar- und Überweisungspotenzial nach Hause.", "額面給与と実際の手取り、寮費、手元に残る実質貯蓄額・本国送金可能額を明瞭に把握。"),
                },
                {
                  emoji: "🔧",
                  title: txt("Ausbildung (Vokasi Jerman)", "Ausbildung (German Vocational)", "Duale Ausbildung in Deutschland", "アウスビルドゥング（独職業訓練）"),
                  desc: txt("Berapa yang benar-benar tersisa dari uang saku €900 - €1.400 setelah asuransi kesehatan wajib dan sewa kamar WG? Kota mana yang ramah kantong?", "How much remains after mandatory public health insurance and WG rent? Which cities offer the best savings runway?", "Wie viel bleibt von der Vergütung (€900–€1.400) nach Krankenversicherung und WG-Miete wirklich übrig? Welche Städte sind am bezahlbarsten?", "月€900〜€1,400の手当から公的保険とWG家賃を引いた後の実質残高を試算。"),
                },
                {
                  emoji: "🎓",
                  title: txt("Mahasiswa & Fresh Graduate", "Students & Fresh Graduates", "Studierende & Hochschulabsolventen", "留学生・新卒求職者"),
                  desc: txt("Pertimbangkan kuliah S1/S2 atau karir pertama di luar negeri. Data statistik pemerintah riil, transparan, dan tanpa kepentingan sponsor agen.", "Compare study or entry-level job opportunities abroad with neutral, official government data.", "Planen Sie Studium oder den ersten Karriereschritt im Ausland mit neutralen, amtlichen Regierungsdaten ohne Agenturinteressen.", "海外留学や初の海外就職。エージェントの宣伝に左右されない公的統計に基づく客観データ。"),
                },
              ].map((card) => (
                <div key={card.title} className="tagung-card-hover p-6 space-y-3">
                  <div className="text-3xl">{card.emoji}</div>
                  <h3 className="text-base font-semibold text-[var(--text)]">{card.title}</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section: Isso Comments & Admin Contact ─────────────────────── */}
        <CommentsSection />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        id="footer"
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
        }}
        className="py-10 px-4 sm:px-6"
      >
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Legal Disclaimer */}
          <div
            className="rounded-xl p-5 space-y-2"
            role="note"
            aria-label={t("disclaimer.title")}
            style={{
              background: "rgba(249, 134, 7, 0.08)",
              border: "1px solid rgba(249, 134, 7, 0.25)",
            }}
          >
            <p className="text-sm font-semibold text-amber-500">
              ⚠️ {t("disclaimer.title")}
            </p>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {t("disclaimer.text")}
            </p>
          </div>

          {/* Footer bottom row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--soft)] pt-2">
            <div className="flex items-center gap-2">
              <span className="text-[var(--accent)] font-bold">BandingHidup</span>
              <span>·</span>
              <span>{t("footer.legal")}</span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/wizard"
                className="hover:text-[var(--text)] transition-colors"
              >
                Kalkulator 7-Langkah
              </Link>
              <Link
                href="/compare"
                className="hover:text-[var(--text)] transition-colors"
              >
                Bandingkan Jalur
              </Link>
              <Link
                href="/gaji-setara"
                className="hover:text-[var(--text)] transition-colors"
              >
                Gaji Setara
              </Link>
              <Link
                href="/persentil"
                className="hover:text-[var(--text)] transition-colors"
              >
                Persentil
              </Link>
              <a
                href={process.env["NEXT_PUBLIC_BLOG_URL"] || "https://t-agung.id"}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[var(--text)] transition-colors"
              >
                t-agung.id
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
