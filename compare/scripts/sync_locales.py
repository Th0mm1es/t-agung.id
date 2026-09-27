import json
import os
import sys

LOCALES = ["id", "en", "de", "ja"]

# Master dictionary definition with complete 4-language translations
TRANSLATIONS = {
    # ── App & Navigation ──
    "app.name": {
        "id": "BandingHidup",
        "en": "BandingHidup",
        "de": "BandingHidup",
        "ja": "BandingHidup"
    },
    "app.tagline": {
        "id": "Perbandingan Biaya Hidup Realistis",
        "en": "Realistic Cost-of-Living Comparison",
        "de": "Realistischer Lebenshaltungskostenvergleich",
        "ja": "現実的な生活費・手取り比較シミュレーター"
    },
    "app.domain": {
        "id": "compare.t-agung.id",
        "en": "compare.t-agung.id",
        "de": "compare.t-agung.id",
        "ja": "compare.t-agung.id"
    },
    "app.title": {
        "id": "BandingHidup — Perbandingan Biaya Hidup Ausbildung & Kenshusei",
        "en": "BandingHidup — Realistic Cost of Living for Ausbildung & Kenshusei",
        "de": "BandingHidup — Realistischer Lebenshaltungskostenvergleich für Ausbildung & Kenshusei",
        "ja": "BandingHidup — ドイツAusbildung＆日本技能実習 生活費比較シミュレーター"
    },
    "nav.home": {
        "id": "Beranda",
        "en": "Home",
        "de": "Startseite",
        "ja": "ホーム"
    },
    "nav.compare": {
        "id": "Bandingkan",
        "en": "Compare",
        "de": "Vergleich",
        "ja": "2都市比較"
    },
    "nav.gaji_setara": {
        "id": "Gaji Setara",
        "en": "Equivalent Salary",
        "de": "Vergleichsgehalt",
        "ja": "必要額面給与"
    },
    "nav.wizard": {
        "id": "Kalkulator 7 Langkah",
        "en": "7-Step Planner",
        "de": "7-Schritte-Planer",
        "ja": "7段階プランナー"
    },
    "nav.percentile": {
        "id": "Persentil Gaji",
        "en": "Salary Percentiles",
        "de": "Gehaltsperzentile",
        "ja": "所得順位"
    },
    "nav.about": {
        "id": "Tentang",
        "en": "About",
        "de": "Über uns",
        "ja": "概要"
    },
    "nav.contribute": {
        "id": "Kontribusi Data",
        "en": "Contribute Data",
        "de": "Daten beitragen",
        "ja": "データ提供"
    },
    "nav.language": {
        "id": "Bahasa",
        "en": "Language",
        "de": "Sprache",
        "ja": "言語"
    },

    # ── Hero Section ──
    "hero.headline": {
        "id": "Perbandingan Biaya Hidup Realistis untuk Ausbildung di Jerman & Kenshusei di Jepang",
        "en": "Realistic Cost-of-Living Comparison for Ausbildung in Germany & Kenshusei in Japan",
        "de": "Realistischer Lebenshaltungskostenvergleich für Ausbildung in Deutschland & Kenshusei in Japan",
        "ja": "ドイツのアウスビルドゥング＆日本の技能実習生のための現実的な生活費シミュレーター"
    },
    "hero.subheadline": {
        "id": "Khusus untuk peserta magang vokasi, mahasiswa, fresh graduate, dan pekerja entry-level. Bukan untuk konsultan, bukan untuk show-off.",
        "en": "Built specifically for vocational trainees, students, fresh graduates, and entry-level workers. Honest numbers, no fluff.",
        "de": "Speziell für Auszubildende, Studenten, Berufseinsteiger und Praktikanten. Ehrliche Zahlen, keine Schönfärberei.",
        "ja": "職業訓練生、留学生、新卒、エントリーレベル労働者のために構築。見せかけではないリアルな数字。"
    },
    "hero.cta": {
        "id": "Mulai Perbandingan",
        "en": "Start Comparing",
        "de": "Vergleich starten",
        "ja": "シミュレーションを開始"
    },
    "hero.badge": {
        "id": "Gratis & Anonim",
        "en": "Free & Anonymous",
        "de": "Kostenlos & Anonym",
        "ja": "無料＆完全匿名"
    },

    # ── Landing Page P1-2 Updates ──
    "landing.future_support": {
        "id": "Gratis untuk mendukung masa depan Anda",
        "en": "Free — supporting your future",
        "de": "Kostenlos — für Ihre Zukunft",
        "ja": "無料 — あなたの未来のために"
    },
    "landing.gaji_setara_fit": {
        "id": "Cocok untuk: Negosiasi tawaran kontrak kerja di luar negeri dan melihat kesejahteraan Anda sekarang",
        "en": "Best for: Negotiating overseas contract offers and assessing your current real living standard",
        "de": "Ideal für: Gehaltsverhandlungen bei Arbeitsverträgen im Ausland und Einblick in Ihren aktuellen Lebensstandard",
        "ja": "海外就職・転職の給与交渉および現在の生活水準・実質購買力の把握に最適"
    },
    "landing.comments_contact": {
        "id": "Tuliskan komentar Anda di bawah atau hubungi saya langsung",
        "en": "Leave your comments below or contact me directly",
        "de": "Hinterlassen Sie unten Ihren Kommentar oder kontaktieren Sie mich direkt",
        "ja": "下記にコメントをご記入いただくか、私まで直接ご連絡ください"
    },

    # ── Forms & Selectors ──
    "form.select_country": {
        "id": "Pilih Negara",
        "en": "Select Country",
        "de": "Land auswählen",
        "ja": "国を選択"
    },
    "form.select_city": {
        "id": "Pilih Kota",
        "en": "Select City",
        "de": "Stadt auswählen",
        "ja": "都市を選択"
    },
    "form.select_pathway": {
        "id": "Pilih Jalur Penghasilan",
        "en": "Select Income Pathway",
        "de": "Verdienstweg auswählen",
        "ja": "職種・在留資格を選択"
    },
    "form.loading": {
        "id": "Memuat...",
        "en": "Loading...",
        "de": "Laden...",
        "ja": "読み込み中..."
    },
    "form.no_data": {
        "id": "Tidak ada data tersedia",
        "en": "No data available",
        "de": "Keine Daten verfügbar",
        "ja": "データがありません"
    },
    "form.back": {
        "id": "Kembali",
        "en": "Back",
        "de": "Zurück",
        "ja": "戻る"
    },
    "form.next": {
        "id": "Lanjut",
        "en": "Next",
        "de": "Weiter",
        "ja": "次へ"
    },
    "form.reset": {
        "id": "Reset",
        "en": "Reset",
        "de": "Zurücksetzen",
        "ja": "リセット"
    },
    "form.start_over": {
        "id": "Mulai Ulang",
        "en": "Start Over",
        "de": "Neu starten",
        "ja": "最初からやり直す"
    },

    # ── Countries ──
    "country.DE": {
        "id": "Jerman",
        "en": "Germany",
        "de": "Deutschland",
        "ja": "ドイツ"
    },
    "country.JP": {
        "id": "Jepang",
        "en": "Japan",
        "de": "Japan",
        "ja": "日本"
    },
    "country.ID": {
        "id": "Indonesia",
        "en": "Indonesia",
        "de": "Indonesien",
        "ja": "インドネシア"
    },

    # ── Pathways ──
    "pathway.ausbildung": {
        "id": "Ausbildung (Magang Vokasi Jerman)",
        "en": "Ausbildung (German Vocational Training)",
        "de": "Ausbildung (Duale Berufsausbildung)",
        "ja": "アウスビルドゥング（ドイツ職業訓練）"
    },
    "pathway.technical_intern": {
        "id": "Kenshusei / Technical Intern (Magang Jepang)",
        "en": "Kenshusei / Technical Intern (Japan)",
        "de": "Kenshusei / Technical Intern (Japan)",
        "ja": "技能実習生 / 特定技能（日本）"
    },
    "pathway.student": {
        "id": "Mahasiswa",
        "en": "Student",
        "de": "Student",
        "ja": "留学生・学生"
    },
    "pathway.fresh_grad": {
        "id": "Fresh Graduate",
        "en": "Fresh Graduate",
        "de": "Berufseinsteiger",
        "ja": "新卒・エントリーレベル"
    },
    "pathway.fresh_grad_s1": {
        "id": "Fresh Graduate S1 (Sarjana)",
        "en": "Fresh Graduate (Bachelor's)",
        "de": "Berufseinsteiger (Bachelor)",
        "ja": "大卒初任給（学士）"
    },
    "pathway.fresh_grad_s2": {
        "id": "Fresh Graduate S2 (Magister)",
        "en": "Fresh Graduate (Master's)",
        "de": "Berufseinsteiger (Master)",
        "ja": "院卒初任給（修士）"
    },
    "pathway.custom": {
        "id": "Kustom / Lainnya",
        "en": "Custom / Other",
        "de": "Benutzerdefiniert / Sonstige",
        "ja": "カスタム / その他"
    },

    # ── Expense Categories ──
    "category.housing": {
        "id": "Tempat Tinggal",
        "en": "Housing",
        "de": "Wohnen & Warmmiete",
        "ja": "家賃・住居費"
    },
    "category.utilities": {
        "id": "Listrik, Air & Internet",
        "en": "Electricity, Water & Internet",
        "de": "Strom, Wasser & Internet",
        "ja": "水道光熱費・通信費"
    },
    "category.food": {
        "id": "Makanan & Minuman",
        "en": "Food & Drinks",
        "de": "Essen & Trinken",
        "ja": "食費"
    },
    "category.transport": {
        "id": "Transportasi",
        "en": "Transportation",
        "de": "Mobilität & ÖPNV",
        "ja": "交通費"
    },
    "category.lifestyle": {
        "id": "Gaya Hidup & Hiburan",
        "en": "Lifestyle & Entertainment",
        "de": "Freizeit & Sonstiges",
        "ja": "娯楽・その他"
    },
    "category.relocation": {
        "id": "Biaya Pindah (Satu Kali)",
        "en": "Relocation Costs (One-Time)",
        "de": "Umzugskosten (einmalig)",
        "ja": "初期費用・渡航費（初回のみ）"
    },

    # ── Currencies ──
    "currency.eur": {
        "id": "Euro",
        "en": "Euro",
        "de": "Euro",
        "ja": "ユーロ"
    },
    "currency.jpy": {
        "id": "Yen Jepang",
        "en": "Japanese Yen",
        "de": "Japanischer Yen",
        "ja": "日本円"
    },
    "currency.idr": {
        "id": "Rupiah Indonesia",
        "en": "Indonesian Rupiah",
        "de": "Indonesische Rupiah",
        "ja": "インドネシア・ルピア"
    },
    "currency.usd": {
        "id": "Dolar AS",
        "en": "US Dollar",
        "de": "US-Dollar",
        "ja": "米ドル"
    },

    # ── Disclaimers & Footer ──
    "disclaimer.title": {
        "id": "Perhatian Penting",
        "en": "Important Notice",
        "de": "Wichtiger Hinweis",
        "ja": "重要事項"
    },
    "disclaimer.text": {
        "id": "BandingHidup memberikan perkiraan perencanaan berdasarkan input pengguna dan data referensi yang tersedia. Ini BUKAN merupakan nasihat hukum, pajak, penggajian, visa, atau keuangan. Selalu konsultasikan dengan profesional yang qualified untuk keputusan penting.",
        "en": "BandingHidup provides planning estimates based on user inputs and available reference data. It is NOT legal, tax, payroll, visa, or financial advice. Always consult qualified professionals for important decisions.",
        "de": "BandingHidup liefert Planungsschätzungen basierend auf Benutzereingaben und amtlichen Statistiken. Dies stellt KEINE Rechts-, Steuer-, Lohn-, Visa- oder Finanzberatung dar. Bitte konsultieren Sie bei wichtigen Entscheidungen stets qualifizierte Fachkräfte.",
        "ja": "BandingHidupはユーザー入力および公的統計基準に基づく試算シミュレーションを提供します。法的、税務、給与計算、ビザ、または財務に関する助言ではありません。決定を下す前に雇用契約および公式ビザ要件をご確認ください。"
    },
    "footer.legal": {
        "id": "Bukan nasihat hukum, pajak, atau keuangan.",
        "en": "Not legal, tax, or financial advice.",
        "de": "Keine Rechts-, Steuer- oder Finanzberatung.",
        "ja": "法的・税務・財務上の助言ではありません。"
    },
    "footer.made_with": {
        "id": "Dibuat untuk para pejuang luar negeri 🌏",
        "en": "Made for overseas fighters 🌏",
        "de": "Für alle Kämpfer im Ausland 🌏",
        "ja": "海外で挑戦するすべての人のために 🌏"
    },
    "footer.data_source": {
        "id": "Sumber data: Destatis (DE), e-Stat (JP), BPS (ID)",
        "en": "Data sources: Destatis (DE), e-Stat (JP), BPS (ID)",
        "de": "Datenquellen: Destatis (DE), e-Stat (JP), BPS (ID)",
        "ja": "データ元: ドイツ連邦統計局 (Destatis), 日本総務省統計局 (e-Stat), インドネシア統計局 (BPS)"
    },

    # ── Compare Component (Addresses P0-1 Fallback Strings) ──
    "compare.net_salary": {
        "id": "Gaji Bersih (Take Home Pay):",
        "en": "Net Salary (Take Home Pay):",
        "de": "Nettogehalt (Auszahlungsbetrag):",
        "ja": "手取り給与 (Take-home Pay):"
    },
    "compare.total_deductions": {
        "id": "Total Deduksi (Pajak & Asuransi):",
        "en": "Total Deductions (Tax & Social):",
        "de": "Gesamtabzüge (Steuern & Sozialabgaben):",
        "ja": "控除合計 (税金・社会保険):"
    },
    "compare.estimated_rent": {
        "id": "Estimasi Sewa Hunian Standar:",
        "en": "Estimated Standard Rent:",
        "de": "Geschätzte Standard-Warmmiete:",
        "ja": "標準家賃見積もり:"
    },
    "compare.discretionary_savings": {
        "id": "Sisa Uang Belanja & Tabungan:",
        "en": "Discretionary & Savings:",
        "de": "Verfügbares Einkommen & Ersparnisse:",
        "ja": "可処分残高・貯蓄可能額:"
    },
    "compare.ref_currency": {
        "id": "Konversi Acuan:",
        "en": "Ref Currency:",
        "de": "Referenzwährung:",
        "ja": "換算基準通貨:"
    },
    "compare.title": {
        "id": "Perbandingan Magang & Fresh Graduate",
        "en": "Trainee & Fresh Graduate Dual-City Comparison",
        "de": "Duales Städte-Vergleichstool für Praktikanten & Berufseinsteiger",
        "ja": "インターン・新卒 2都市給与比較"
    },
    "compare.subtitle": {
        "id": "Bandingkan uang saku Ausbildung di Jerman, gaji kenshusei di Jepang, dan fresh graduate di Indonesia secara berdampingan. Lengkap dengan potongan pajak resmi, biaya sewa hunian, dan analisis ketahanan finansial.",
        "en": "Compare vocational training stipends, intern wages, and fresh grad entry-level salaries side-by-side with statutory payroll deductions, accommodation costs, and net savings.",
        "de": "Vergleichen Sie Ausbildungsvergütungen in Deutschland, Praktikantengehälter in Japan und Einstiegsgehälter in Indonesien Seite an Seite inklusive Steuern, Miete und Ersparnissen.",
        "ja": "ドイツのAusbildung手当、日本の技能実習・新卒初任給、インドネシアの新卒初任給を並行比較。法定控除（税金・社会保険）、推奨家賃、手元に残る実質貯蓄可能額を完全シミュレーション。"
    },
    "compare.baseline_city": {
        "id": "Kota Acuan",
        "en": "Baseline City",
        "de": "Referenzstadt",
        "ja": "基準都市"
    },
    "compare.destination_city": {
        "id": "Kota Tujuan",
        "en": "Destination City",
        "de": "Zielstadt",
        "ja": "比較先都市"
    },
    "compare.career_pathway": {
        "id": "Jalur Karir / Kategori Pekerja:",
        "en": "Career Pathway / Category:",
        "de": "Karrierepfad / Kategorie:",
        "ja": "キャリア区分 / 就労形態:"
    },
    "compare.savings_comparison": {
        "id": "Perbandingan Potensi Tabungan Bulanan Bersih",
        "en": "Net Monthly Savings Potential Comparison",
        "de": "Vergleich des monatlichen Nettosparpotenzials",
        "ja": "月間実質貯蓄ポテンシャル比較"
    },
    "compare.conversion_diff": {
        "id": "Selisih Konversi",
        "en": "Conversion Difference",
        "de": "Umrechnungsdifferenz",
        "ja": "換算差額"
    },
    "compare.remittance_potential": {
        "id": "Potensi Kirim Uang ke Keluarga di Indonesia",
        "en": "Remittance Potential to Family in Indonesia",
        "de": "Überweisungspotenzial an Familie in Indonesien",
        "ja": "インドネシアの家族への送金目安"
    },
    "compare.per_month": {
        "id": "/ bulan",
        "en": "/ month",
        "de": "/ Monat",
        "ja": "/ 月"
    },
    "compare.per_year": {
        "id": "/ tahun",
        "en": "/ year",
        "de": "/ Jahr",
        "ja": "/ 年"
    },
    "compare.equivalent_to": {
        "id": "Setara",
        "en": "Eq.",
        "de": "Entspricht",
        "ja": "換算約"
    },
    "compare.financial_health": {
        "id": "Status Finansial:",
        "en": "Financial Health:",
        "de": "Finanzstatus:",
        "ja": "財務健全性ステータス:"
    },
    "compare.annual_savings": {
        "id": "Potensi Tabungan 1 Tahun:",
        "en": "1-Year Savings Potential:",
        "de": "1-Jahres-Sparpotenzial:",
        "ja": "年間貯蓄ポテンシャル:"
    },
    "compare.contract_savings": {
        "id": "Akumulasi Kontrak (3 Thn):",
        "en": "3-Year Contract Total:",
        "de": "Gesamtersparnis Vertrag (3 Jahre):",
        "ja": "契約期間累計 (3年分):"
    },
    "compare.actions_title": {
        "id": "Aksi & Bagikan Hasil Perbandingan",
        "en": "Actions & Share Comparison",
        "de": "Aktionen & Vergleich teilen",
        "ja": "アクション・比較結果を保存/共有"
    },
    "compare.actions_subtitle": {
        "id": "Simpan simulasi ke browser, bagikan via WhatsApp, atau unduh kartu infografis PNG 1080×1350.",
        "en": "Save simulation locally, share via WhatsApp, or download high-res 1080×1350 PNG card.",
        "de": "Simulation im Browser speichern, per WhatsApp teilen oder als 1080×1350 PNG-Infografik herunterladen.",
        "ja": "シミュレーションをブラウザに保存、WhatsAppで共有、または高画質PNGカード（1080×1350）を出力。"
    },
    "compare.save_scenario": {
        "id": "Simpan Skenario",
        "en": "Save Scenario",
        "de": "Szenario speichern",
        "ja": "保存"
    },
    "compare.generate_card": {
        "id": "Buat Kartu Hasil PNG",
        "en": "Generate Card PNG",
        "de": "PNG-Ergebniskarte erstellen",
        "ja": "結果カード出力"
    },

    # ── Result Card Nodes (P0-2) ──
    "card.header_ppp": {
        "id": "PARITAS DAYA BELI RIIL",
        "en": "REAL PURCHASING POWER PARITY",
        "de": "REALE KAUFKRAFTPARITÄT",
        "ja": "実質購買力平価（PPP）"
    },
    "card.header_tax_living": {
        "id": "Pajak & Biaya Hidup 2026",
        "en": "Taxes & Cost of Living 2026",
        "de": "Steuern & Lebenshaltungskosten 2026",
        "ja": "税金・生活費 2026年基準"
    },
    "card.target_gross_title": {
        "id": "TARGET GAJI KOTOR (GROSS) KONTRAK",
        "en": "TARGET GROSS CONTRACT SALARY",
        "de": "ZIEL-BRUTTOGEHALT IM VERTRAG",
        "ja": "契約交渉の目標額面給与"
    },
    "card.take_home_title": {
        "id": "GAJI BERSIH (TAKE-HOME)",
        "en": "TAKE-HOME PAY",
        "de": "NETTO-AUSZAHLUNG",
        "ja": "手取り受取額"
    },
    "card.take_home_sub": {
        "id": "Gaji Bersih Diterima",
        "en": "Net Received to Bank",
        "de": "Auszahlung auf Bankkonto",
        "ja": "口座振込実質手取り"
    },
    "card.living_cost_title": {
        "id": "BIAYA HIDUP RIIL",
        "en": "REAL LIVING COSTS",
        "de": "REALE LEBENSHALTUNGSKOSTEN",
        "ja": "実質生活費合計"
    },
    "card.living_cost_sub": {
        "id": "Sewa + Konsumsi Pokok",
        "en": "Rent + Essential Living",
        "de": "Warmmiete + Grundbedarf",
        "ja": "家賃 ＋ 生活消費費"
    },
    "card.savings_title": {
        "id": "SISA TABUNGAN",
        "en": "MONTHLY SURPLUS",
        "de": "MONATLICHER ÜBERSCHUSS",
        "ja": "実質貯蓄可能額"
    },
    "card.savings_sub": {
        "id": "Gaji Bersih − Pengeluaran",
        "en": "Take-Home − Expenses",
        "de": "Netto − Ausgaben",
        "ja": "手取り給与 − 実質生活費"
    },
    "card.satiety_title": {
        "id": "🥣 INDEKS KENYANG & DAYA BELI RIIL",
        "en": "🥣 REAL PURCHASING POWER & MEAL INDEX",
        "de": "🥣 MAHLZEITEN-INDEX & REALE KAUFKRAFT",
        "ja": "🥣 実質購買力・満腹指数（外食換算）"
    },
    "card.satiety_sub": {
        "id": "Perhitungan daya beli nyata di luar ilusi kurs mata uang nominal",
        "en": "Real purchasing power calculated beyond nominal exchange rate illusion",
        "de": "Echte Kaufkraftberechnung jenseits nominaler Wechselkursillusionen",
        "ja": "名目為替レートの錯覚を排した実質的な現地購買力の検証"
    },
    "card.default_rent": {
        "id": "Sewa Standar",
        "en": "Standard Rent",
        "de": "Standardmiete",
        "ja": "標準家賃"
    },
    "card.default_living": {
        "id": "Konsumsi & Utilitas",
        "en": "Living & Utilities",
        "de": "Lebenshaltung & Nebenkosten",
        "ja": "生活費・光熱費"
    },
    "card.default_deduction": {
        "id": "Deduksi Resmi",
        "en": "Statutory Deductions",
        "de": "Gesetzliche Abzüge",
        "ja": "法定控除"
    },
    "card.food_gyudon": {
        "id": "mangkuk Gyudon",
        "en": "bowls of gyudon",
        "de": "Gyudon-Schalen",
        "ja": "ラーメン"
    },
    "card.food_doner": {
        "id": "porsi Döner Kebab",
        "en": "warm Döner meals",
        "de": "Döner Kebab",
        "ja": "ドネルケバブ"
    },
    "card.remittance_prefix": {
        "id": "Potensi Kirim ke Keluarga:",
        "en": "Remittance Potential:",
        "de": "Überweisungspotenzial:",
        "ja": "母国家族への送金目安:"
    },
    "card.remittance_suffix": {
        "id": "sampai di tanah air",
        "en": "arriving domestically",
        "de": "in der Heimat",
        "ja": "現地受取目安"
    },
    "card.footer_sources": {
        "id": "Data Resmi: Destatis (DE) · e-Stat (JP) · BPS (ID) · Pajak Progresif 2026",
        "en": "Official Data: Destatis (DE) · e-Stat (JP) · BPS (ID) · Progressive Tax 2026",
        "de": "Amtliche Daten: Destatis (DE) · e-Stat (JP) · BPS (ID) · Steuern 2026",
        "ja": "公的統計: ドイツ連邦統計局 · 総務省統計局 · インドネシア統計局 · 2026年税制"
    },

    # ── Wizard Steps & Labels ──
    "wizard.step_counter": {
        "id": "Langkah {current} dari {total}",
        "en": "Step {current} of {total}",
        "de": "Schritt {current} von {total}",
        "ja": "ステップ {current} / {total}"
    },
    "wizard.step1_name": {
        "id": "Tujuan",
        "en": "Destination",
        "de": "Zielort",
        "ja": "渡航先"
    },
    "wizard.step2_name": {
        "id": "Jalur",
        "en": "Pathway",
        "de": "Pfad",
        "ja": "区分"
    },
    "wizard.step3_name": {
        "id": "Gaji & Potongan",
        "en": "Income & Tax",
        "de": "Gehalt & Abzüge",
        "ja": "給与・控除"
    },
    "wizard.step4_name": {
        "id": "Hunian",
        "en": "Housing",
        "de": "Wohnen",
        "ja": "住居"
    },
    "wizard.step5_name": {
        "id": "Gaya Hidup",
        "en": "Lifestyle",
        "de": "Lebensstil",
        "ja": "生活様式"
    },
    "wizard.step6_name": {
        "id": "Review",
        "en": "Review",
        "de": "Übersicht",
        "ja": "確認"
    },
    "wizard.step7_name": {
        "id": "Hasil",
        "en": "Results",
        "de": "Ergebnis",
        "ja": "診断結果"
    }
}

def generate_locales():
    web_locales_dir = os.path.abspath("apps/web/locales")
    core_locales_dir = os.path.abspath("packages/core/src/i18n")
    
    os.makedirs(web_locales_dir, exist_ok=True)
    os.makedirs(core_locales_dir, exist_ok=True)

    locale_dicts = {loc: {} for loc in LOCALES}
    
    for key, trans in TRANSLATIONS.items():
        for loc in LOCALES:
            val = trans.get(loc, "").strip()
            if not val:
                print(f"ERROR: Missing translation for key '{key}' in locale '{loc}'", file=sys.stderr)
                sys.exit(1)
            locale_dicts[loc][key] = val

    # Verify key counts and parity
    key_counts = {loc: len(locale_dicts[loc]) for loc in LOCALES}
    print(f"Key counts across locales: {key_counts}")
    
    id_keys = set(locale_dicts["id"].keys())
    for loc in ["de", "en", "ja"]:
        loc_keys = set(locale_dicts[loc].keys())
        diff_missing = id_keys - loc_keys
        diff_extra = loc_keys - id_keys
        if diff_missing:
            print(f"ERROR: Locale '{loc}' missing keys: {diff_missing}", file=sys.stderr)
            sys.exit(1)
        if diff_extra:
            print(f"ERROR: Locale '{loc}' extra keys: {diff_extra}", file=sys.stderr)
            sys.exit(1)

    # Write files
    for loc in LOCALES:
        web_path = os.path.join(web_locales_dir, f"{loc}.json")
        core_path = os.path.join(core_locales_dir, f"{loc}.json")
        
        with open(web_path, "w", encoding="utf-8") as f:
            json.dump(locale_dicts[loc], f, ensure_ascii=False, indent=2)
        with open(core_path, "w", encoding="utf-8") as f:
            json.dump(locale_dicts[loc], f, ensure_ascii=False, indent=2)
            
        print(f"Wrote {len(locale_dicts[loc])} keys to {web_path} and {core_path}")

    print("\nSUCCESS: All 4 locales generated with perfect 100% key parity and 0 missing keys.")

if __name__ == "__main__":
    generate_locales()
