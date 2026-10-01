# BandingHidup — Peta Halaman & Kamus Terjemahan Multibahasa
> **Panduan Penyesuaian Kata & Teks (Indonesian · Deutsch · English · 日本語)**
> File ini merangkum seluruh halaman aplikasi BandingHidup beserta komponen, struktur teks, dan lokasi file sumbernya agar Anda dapat dengan mudah memeriksa dan mengubah kata-kata di keempat bahasa.

---

## 📁 Ringkasan Lokasi File Terjemahan

Semua teks dalam aplikasi dikelola melalui 3 lapisan:
1. **File Kamus Terjemahan Global (JSON)**:
   - Bahasa Indonesia: `bandinghidup/apps/web/locales/id.json`
   - Deutsch: `bandinghidup/apps/web/locales/de.json` & `bandinghidup/apps/web/locales/de_inlines.json`
   - English: `bandinghidup/apps/web/locales/en.json`
   - 日本語: `bandinghidup/apps/web/locales/ja.json`
2. **Master Sync Script (Python)**:
   - `bandinghidup/scripts/sync_locales.py` (Script generator master yang menyinkronkan 100% kunci di keempat bahasa)
3. **Komponen UI Langsung (`txt(...)` inline helper)**:
   - Komponen halaman di `bandinghidup/apps/web/components/` memiliki helper multibahasa `txt(id, en, de, ja)` untuk teks yang sangat dinamis.

---

## 🧭 Navigasi & Elemen Global (Navbar, Footer, Modal)

| Komponen / Bagian | Bahasa Indonesia (ID) | Deutsch (DE) | English (EN) | 日本語 (JA) | File Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Brand Tagline** | Perbandingan Biaya Hidup Realistis | Realistischer Lebenshaltungskostenvergleich | Realistic Cost-of-Living Comparison | 現実的な生活費・手取り比較シミュレーター | `locales/*.json` (`app.tagline`) |
| **Nav 1 (Beranda)** | ⚖️ Banding Hidup | ⚖️ Vergleich | ⚖️ Cost Comparison | ⚖️ 生活費比較 | `components/layout/Navbar.tsx` |
| **Nav 2 (Gaji Setara)** | 🌐 Gaji Setara | 🌐 Gehaltsäquivalent | 🌐 Equivalent Salary | 🌐 必要給与 | `components/layout/Navbar.tsx` |
| **Nav 3 (Magang Azubi/JP)** | 🎓 Magang Azubi/JP | 🎓 Azubi vs. JP | 🎓 Trainee Compare | 🎓 実習・新卒比較 | `components/layout/Navbar.tsx` |
| **Nav 4 (Kalkulator 7 Langkah)** | 🧮 Kalkulator 7-Langkah | 🧮 7-Schritte | 🧮 7-Step Budget | 🧮 7段階計算機 | `components/layout/Navbar.tsx` |
| **Nav 5 (Persentil Gaji)** | 📊 Persentil | 📊 Perzentile | 📊 Percentile | 📊 所得順位 | `components/layout/Navbar.tsx` |
| **Nav (Kontribusi)** | Kontribusi Data | Daten beitragen | Contribute Data | データ提供 | `locales/*.json` (`nav.contribute`) |
| **Footer Legal** | Bukan nasihat hukum, pajak, atau keuangan. | Keine Rechts-, Steuer- oder Finanzberatung. | Not legal, tax, or financial advice. | 法的・税務・財務上の助言ではありません。 | `locales/*.json` (`footer.legal`) |
| **Footer Dedication** | Dibuat untuk para pejuang luar negeri 🌏 | Für alle im Auslandseinsatz 🌏 | Built for dreamers & workers abroad 🌏 | 海外で挑戦するすべての人のために 🌏 | `locales/*.json` (`footer.made_with`) |
| **Footer Data Sources** | Sumber data: Destatis (DE), e-Stat (JP), BPS (ID) | Datenquellen: Destatis (DE), e-Stat (JP), BPS (ID) | Data sources: Destatis (DE), e-Stat (JP), BPS (ID) | データ出典: Destatis (独), e-Stat (日), BPS (尼) | `locales/*.json` (`footer.data_source`) |
| **Disclaimer Peringatan** | Perhatian Penting: BandingHidup memberikan perkiraan perencanaan berdasarkan input pengguna dan data referensi resmi. | Wichtiger Hinweis: BandingHidup bietet Planungsschätzungen basierend auf Nutzereingaben und offiziellen Benchmarks. | Important Notice: BandingHidup provides planning estimates based on user inputs and official benchmarks. | 重要事項: BandingHidupは公的統計および入力に基づく試算を提供します。 | `locales/*.json` (`disclaimer.text`) |

---

## 📄 Halaman 1: Beranda / Landing Page (`/`)
> **URL**: `http://localhost:4321/` atau `https://compare.t-agung.id/`  
> **Komponen Utama**: `components/LandingPageClient.tsx` & `components/home/QuickHeroSimulator.tsx`

| Bagian / Komponen | Bahasa Indonesia (ID) | Deutsch (DE) | English (EN) | 日本語 (JA) | File Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Badge** | ⚡ Simulator Kilat Realistis | ⚡ Realistischer Schnellrechner | ⚡ Instant Realistic Simulator | ⚡ リアルタイム簡易試算 | `components/home/QuickHeroSimulator.tsx` |
| **Hero Headline** | Berapa sih gaji setara kita kalau di negeri atau kota lain ? | Wie viel Gehalt entspricht unserem Niveau in einem anderen Land oder einer anderen Stadt? | What is our equivalent salary in another country or city? | 他国や他都市に移住・転職した場合、同等の給与・購買力はいくら？ | `LandingPageClient.tsx` |
| **Hero Subheadline** | Jangan terjebak ama ilusi kurs valuta asing yang kelihatan besar, coba kita lihat berapa sih sebenarnya daya beli dari gaji orang yang kerja di luar. Berapa sih yang bisa di tabung ? | Lassen Sie sich nicht von scheinbar hohen Wechselkursen täuschen. Sehen Sie die reale Kaufkraft von Auslandsgehältern – und wie viel Sie wirklich sparen können. | Don't get fooled by foreign exchange rates that look deceptively large. Let's see the actual purchasing power of working abroad—and how much you can truly save. | 数字上大きく見える名目為替レートの錯覚に惑わされないでください。海外就労における実質的な購買力と、実際にいくら貯金できるのかを正確に可視化します。 | `LandingPageClient.tsx` |
| **Opsi Radio Mode (Baru)** | 1. Perbandingan Gaji<br>2. Jalur karir pemula<br>3. Persentil gaji | 1. Gehaltsvergleich<br>2. Berufseinsteiger-Wege<br>3. Einkommens-Perzentil | 1. Salary Comparison<br>2. Entry Career Pathway<br>3. Salary Percentile | 1. 給与比較<br>2. 若手キャリア経路<br>3. 給与パーセンタイル | `components/home/QuickHeroSimulator.tsx` |
| **Pemilih Kota** | Kota Asal vs Kota Perbandingan (Jakarta, Berlin, Tokyo) | Herkunftsstadt vs Vergleichsstadt (Jakarta, Berlin, Tokio) | Origin City vs Comparison City (Jakarta, Berlin, Tokyo) | 出発都市 vs 比較都市（ジャカルタ、ベルリン、東京） | `components/home/QuickHeroSimulator.tsx` |
| **Komposisi Keluarga** | Lajang · Menikah (0 Anak) · Keluarga 1 Anak · Keluarga 2 Anak | Ledig · Verheiratet (0 Kinder) · Familie 1 Kind · Familie 2 Kinder | Single · Married (0 Kids) · Family 1 Child · Family 2 Children | 単身 · 既婚(子供なし) · 子1人世帯 · 子2人世帯 | `components/home/QuickHeroSimulator.tsx` |
| **Gaji Kotor Slider** | Gaji Kotor / Geser untuk Ubah | Bruttogehalt / Schieberegler bewegen | Gross Salary / Drag to adjust | 額面総支給 / スライドで調整 | `components/home/QuickHeroSimulator.tsx` |
| **Hasil Kesetaraan** | Setara dengan Rp XX.XXX.XXX /bln kotor Di Jakarta, ID | Entspricht Rp XX.XXX.XXX /Monat brutto in Jakarta, ID | Equivalent to Rp XX.XXX.XXX /mo gross In Jakarta, ID | ジャカルタ基準で月額総支給 Rp XX.XXX.XXX に相当 | `components/home/QuickHeroSimulator.tsx` |
| **Daya Beli Nyata** | Daya Beli Nyata: Street Food (Mie Ayam / Nasi Goreng, Gyudon, Döner) & Big Mac Index | Reale Kaufkraft: Street Food (Döner, Gyudon, Mie Ayam) & Big-Mac-Index | Real Purchasing Power: Street Food & Big Mac Index | 実質購買力: ストリートフード（牛丼/ケバブ/麺類）＆ビッグマック指数 | `components/home/QuickHeroSimulator.tsx` |
| **Rincian Alokasi (Toggle)** | Lihat detail ▾ (Alokasi, Pajak & Sewa) / Sembunyikan Rincian Alokasi | Details anzeigen ▾ / Aufteilungsdetails ausblenden | Show details ▾ / Hide Allocation Details | 内訳詳細を表示 ▾ / 内訳詳細を閉じる | `components/home/QuickHeroSimulator.tsx` |
| **Kategori Bar Alokasi** | Pajak/Asuransi · Sewa · Makan · Tabungan | Steuern/Abzüge · Warmmiete · Essen · Ersparnis | Tax/Deductions · Rent · Food · Savings | 税・社会保険 · 家賃 · 食費 · 貯蓄 | `components/home/QuickHeroSimulator.tsx` |
| **Radar Persentil (Toggle)** | Lihat persentil ▾ / Sembunyikan persentil | Perzentilrang anzeigen ▾ / Perzentil ausblenden | View percentile ▾ / Hide percentile | 所得順位を表示 ▾ / 閉じる | `components/home/QuickHeroSimulator.tsx` |
| **CTA Utama** | 🚀 Buka Kalkulator Lengkap (7 Langkah) | 🚀 Vollständigen 7-Schritte-Rechner öffnen | 🚀 Open Full 7-Step Calculator | 🚀 7段階完全シミュレーターを開く | `components/home/QuickHeroSimulator.tsx` |
| **Glossary Gakumen vs Tedori** | Gakumen adalah gaji kotor kontrak. Tedori adalah gaji bersih yang benar-benar masuk rekening. | Gakumen ist das vertragliche Bruttogehalt. Tedori ist die tatsächliche Nettoauszahlung. | Gakumen is gross salary on contract. Tedori is the take-home pay hitting your bank account. | 額面は契約上の総支給額。手取りは控除後に実際に口座へ振り込まれる金額です。 | `LandingPageClient.tsx` |
| **Biaya Tersembunyi (Hidden Costs)** | Pajak Penduduk Tahun ke-2 (Jepang) · Biaya Siaran TV Rundfunk (Jerman) · Deposit Sewa (Kaution/Shikikin) | 2. Jahr Einwohnersteuer (JP) · GEZ/Rundfunkbeitrag (DE) · Kaution & Abstandszahlungen | Year-2 Resident Tax (JP) · TV Broadcasting Fee (DE) · Rental Deposits (Kaution/Shikikin) | 2年目の住民税天引き (日) · 公共放送受信料 (独) · 敷金礼金・デポジット | `LandingPageClient.tsx` |

---

## 📄 Halaman 2: Bandingkan Jalur Karir & Pemula (`/compare`)
> **URL**: `http://localhost:4321/compare`  
> **Komponen Utama**: `components/compare/CompareClient.tsx`

| Bagian / Komponen | Bahasa Indonesia (ID) | Deutsch (DE) | English (EN) | 日本語 (JA) | File Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Judul Halaman** | Magang & Fresh graduate : Indonesia, Jepang atau Jerman ? | Ausbildung & Berufseinstieg: Indonesien, Japan oder Deutschland? | Internships & Fresh Graduates: Indonesia, Japan, or Germany? | インターン・新卒就労：インドネシア、日本、またはドイツ？ | `components/compare/CompareClient.tsx` |
| **Deskripsi Halaman** | Bandingkan uang tabungan Ausbildung di Jerman,  kenshusei di Jepang, dan fresh graduate di Indonesia secara berdampingan. Lengkap dengan potongan pajak resmi, biaya sewa hunian, dan analisis finansial singkat. | Vergleichen Sie die Ersparnisse bei Ausbildung in Deutschland, Kenshusei in Japan und Berufseinstieg in Indonesien im direkten Vergleich. Inklusive gesetzlicher Steuerabzüge, Wohnungsmiete und kompakter Finanzanalyse. | Compare savings from Ausbildung in Germany, kenshusei in Japan, and fresh graduate jobs in Indonesia side-by-side. Complete with statutory tax deductions, housing rent, and a concise financial breakdown. | ドイツのAusbildung（職業訓練手当）、日本の技能実習手当、インドネシアの新卒初任給における「実際の貯蓄可能額」を並行比較。公的控除、家賃相場、簡潔な財務分析を網羅。 | `CompareClient.tsx` / `locales/*.json` |
| **Kota Acuan & Tujuan** | Kota Acuan (Baseline) vs Kota Tujuan (Destination) | Referenzstadt vs Zielstadt | Baseline City vs Destination City | 基準都市 vs 比較対象都市 | `CompareClient.tsx` |
| **Pilihan Jalur Karir** | Kenshusei (Jepang) · Ausbildung (Jerman) · Fresh Grad S1 (Jakarta) · Kustom | Praktikant (JP) · Azubi (DE) · Bachelor Jakarta (ID) · Benutzerdefiniert | Trainee (JP) · Ausbildung (DE) · Fresh Grad S1 (ID) · Custom | 技能実習・特定技能 · 職業訓練生(独) · ジャカルタ大卒初任給 · カスタム | `CompareClient.tsx` |
| **Perbandingan Uang Masuk** | Gaji Bersih (Take Home Pay) & Total Deduksi (Pajak & Asuransi) | Nettoauszahlung & Gesamtabzüge (Steuern & Sozialabgaben) | Net Take-Home Pay & Total Deductions (Tax & Insurance) | 手取り額（差引支給額）＆ 総控除額（税・社会保険） | `locales/*.json` (`compare.net_salary`) |
| **Potensi Kirim Uang** | Potensi Kirim Uang ke Keluarga di Indonesia (~Rp X Juta/bln) | Potenzielle Rücküberweisungen nach Indonesien | Remittance Potential to Family in Indonesia | 本国家族への仕送り・送金余力 | `locales/*.json` (`compare.remittance_potential`) |
| **Daya Beli Makanan** | Setara ~X Porsi Makan Kenyang / bulan | Entspricht ~X warmen Mahlzeiten / Monat | Equivalent to ~X staple meals / month | 月間約X食分の外食・定食に相当 | `CompareClient.tsx` |
| **Akumulasi Kontrak** | Proyeksi Tabungan 1 Tahun & Akumulasi Kontrak 3 Tahun | 1-Jahres-Ersparnis & 3-Jahres-Vertragsansparung | 1-Year Savings & 3-Year Contract Accumulation | 1年間貯蓄見込み ＆ 3年間契約満了時の累計貯蓄 | `locales/*.json` (`compare.annual_savings`) |
| **Tombol Aksi** | Simpan Skenario · Kirim WhatsApp · Buat Kartu Hasil PNG (1080×1350) | Szenario speichern · WhatsApp teilen · PNG-Ergebniskarte erstellen | Save Scenario · Share WhatsApp · Generate Result Card PNG | シミュレーション保存 · WhatsApp共有 · 結果カード画像(PNG)出力 | `CompareClient.tsx` |

---

## 📄 Halaman 3: Kalkulator Gaji Setara / Paritas Daya Beli (`/gaji-setara`)
> **URL**: `http://localhost:4321/gaji-setara`  
> **Komponen Utama**: `components/equivalence/EquivalenceCalculatorClient.tsx`

| Bagian / Komponen | Bahasa Indonesia (ID) | Deutsch (DE) | English (EN) | 日本語 (JA) | File Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Judul Halaman** | Berapa Gaji Setaraku di negeri lain? | Wie viel Gehalt entspricht meinem Niveau in einem anderen Land? | What Is My Equivalent Salary in Another Country or City? | 他国・他都市での同等給与シミュレーター | `EquivalenceCalculatorClient.tsx` |
| **Subjudul** | Hitung secara realistis berapa gaji di negara / kota lain agar standar hidup Anda tidak turun. Dilengkapi simulasi potongan pajak & asuransi aktif sesuai struktur keluarga, sewa tempat tinggal, serta berbagai pilihan logika daya beli yang nyata. Bukan sekedar perhitungan kurs valuta asing. | Berechnen Sie realistisch, welches Gehalt Sie in einem anderen Land oder einer anderen Stadt benötigen, damit Ihr Lebensstandard nicht sinkt. Inklusive Steuern und Sozialabgaben nach Familienstand, Warmmiete und realen Kaufkraftmodellen – mehr als nur eine einfache Währungsumrechnung. | Calculate realistically what salary you need in another country or city so your standard of living doesn't decline. Complete with interactive tax & social insurance simulations based on family structure, local rent, and real purchasing power options—not just a simple currency conversion. | 生活水準を落とさないために、他国や他都市で実際に必要となる給与水準をリアルに逆算。家族構成に応じた税金・社会保険料の控除シミュレーション、家賃相場、単なる為替換算にとどまらない実質的な購買力指標を網羅。 | `EquivalenceCalculatorClient.tsx` |
| **Pilihan Logika Kesetaraan** | 1. Sisa Tabungan Bulanan Setara (Discretionary Savings - Direkomendasikan)<br>2. Gaji Bersih Setara (Net Take-Home)<br>3. Gaji Kotor Setara (Gross Contract) | 1. Gleiche Sparreserve (Empfohlen)<br>2. Gleiches Nettogehalt<br>3. Gleiches Bruttogehalt | 1. Same Monthly Savings (Recommended)<br>2. Same Net Take-Home<br>3. Same Gross Contract | 1. 同等の月間貯蓄余力（推奨）<br>2. 同等の手取り額<br>3. 同等の総支給額 | `EquivalenceCalculatorClient.tsx` |
| **Pilihan Acuan Barang (Index Type)** | • Street Food Lokal (Mie Ayam / Gyudon / Döner)<br>• Big Mac Index (The Economist)<br>• Secangkir Kopi Kafe<br>• Keranjang Konsumsi Resmi (BPS / Destatis / e-Stat) | • Lokales Street Food (Döner / Gyudon / Mie Ayam)<br>• Big-Mac-Index (The Economist)<br>• Café-Kaffee<br>• Offizieller Warenkorb | • Local Street Food (Mie Ayam / Gyudon / Döner)<br>• Big Mac Index (The Economist)<br>• Specialty Coffee<br>• Official Consumer Basket | • 現地定番食（ラーメン・牛丼・ケバブ等）<br>• ビッグマック指数（エコノミスト誌）<br>• カフェラテ1杯<br>• 公的統計消費支出バスケット | `EquivalenceCalculatorClient.tsx` |
| **Pilihan Hunian** | Kamar Bersama (WG/Shared) · Asrama (Dorm) · Studio / 1-Zimmer · Apartemen 1 Kamar Tidur | WG-Zimmer · Wohnheim · Studio-Apartment · 1-Zimmer-Wohnung | Shared Room (WG) · Dormitory · Studio Flat · One Bedroom Apartment | シェアハウス(WG) · 寮 · ワンルーム/スタジオ · 1LDKアパート | `EquivalenceCalculatorClient.tsx` |
| **Status Keluarga & Pajak** | Pajak Jerman (Steuerklasse 1-5, Gereja) · Pajak Jepang (Tahun 1/2) · Pajak Indonesia (PTKP TK/0 - K/3) | Deutsche Steuerklassen (1–5, Kirche) · Japan (1./2. Jahr) · PTKP Indonesien | German Tax Class (1–5, Church) · Japan Year 1/2 · Indonesia PTKP | ドイツ税区分(1〜5級, 教会税) · 日本住民税有無 · インドネシア扶養控除 | `EquivalenceCalculatorClient.tsx` |
| **Kartu Hasil Target** | TARGET GAJI KOTOR (GROSS) KONTRAK: Valuta Lokal / bln | ZIEL-BRUTTOGEHALT LAUT VERTRAG | TARGET GROSS CONTRACT SALARY | 提示を受けるべき目標額面給与 (月額/年額) | `locales/*.json` (`card.target_gross_title`) |
| **Rincian Beban Hidup** | Sewa Hunian · Konsumsi Pokok & Makan · Listrik, Air & Internet · Tiket Transportasi Umum · Potongan Wajib | Miete · Lebenshaltung · Nebenkosten & Internet · ÖPNV-Ticket · Gesetzliche Abzüge | Rent · Groceries & Food · Utilities & Internet · Public Transit · Mandatory Deductions | 家賃 · 食費・生活必需品 · 光熱水費・通信費 · 交通定期代 · 法的控除額 | `EquivalenceCalculatorClient.tsx` |

---

## 📄 Halaman 4: Radar Persentil Pendapatan (`/persentil`)
> **URL**: `http://localhost:4321/persentil`  
> **Komponen Utama**: `components/percentile/PercentileClient.tsx`

| Bagian / Komponen | Bahasa Indonesia (ID) | Deutsch (DE) | English (EN) | 日本語 (JA) | File Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Judul Halaman** | Di Mana Posisi Gajimu? (Radar Persentil Pendapatan) | Wo steht Ihr Gehalt? (Einkommens-Perzentil-Radar) | Where Does Your Salary Rank? (Income Percentile Radar) | あなたの月収はどの位置？（日・独・尼 所得パーセンタイル診断） | `components/percentile/PercentileClient.tsx` |
| **Deskripsi Halaman** | Masukkan penghasilan kotor Anda untuk melihat peringkat persentil Anda di negara asal, serta perbandingannya jika dikonversi secara langsung di negara lain.<br><br>Angka konversi nominal murni tidak mencerminkan daya beli riil karena biaya hidup dasar dan struktur upah di negara lain kadang berbeda jauh. Ini menunjukkan konversi simpel valuta asing itu tidak dapat jadi perbandingan langsung. | Geben Sie Ihr Bruttoeinkommen ein, um Ihren Perzentilrang im Heimatland zu ermitteln und zu sehen, wie es bei direkter Umrechnung in einem anderen Land abschneidet.<br><br>Reine nominale Umrechnungszahlen spiegeln nicht die tatsächliche Kaufkraft wider, da sich Grundlebenshaltungskosten und Lohnstrukturen im Ausland oft erheblich unterscheiden. Dies verdeutlicht, warum eine einfache Währungsumrechnung kein direkter Vergleichsmaßstab sein kann. | Enter your gross income to see your percentile rank in your home country, as well as how it compares when directly converted in another country.<br><br>Pure nominal conversion numbers do not reflect real purchasing power, as baseline living costs and wage structures abroad are often vastly different. This demonstrates why simple foreign currency conversion cannot serve as a direct comparison. | 額面収入を入力すると、母国での所得パーセンタイル順位と、他国で直接換算した場合の相対的な位置づけを確認できます。<br><br>基礎的な生活費や給与体系は国によって大きく異なるため、単なる名目上の為替換算は実質的な購買力を反映しません。単純な外貨換算だけでは直接比較にならないことがよく分かります。 | `PercentileClient.tsx` |
| **Pilihan Negara Acuan** | 🇮🇩 Indonesia (Rupiah - IDR)<br>🇯🇵 Jepang (Yen - JPY)<br>🇩🇪 Jerman (Euro - EUR) | 🇮🇩 Indonesien (IDR)<br>🇯🇵 Japan (JPY)<br>🇩🇪 Deutschland (EUR) | 🇮🇩 Indonesia (IDR)<br>🇯🇵 Japan (JPY)<br>🇩🇪 Germany (EUR) | 🇮🇩 インドネシア (IDR)<br>🇯🇵 日本 (JPY)<br>🇩🇪 ドイツ (EUR) | `PercentileClient.tsx` |
| **Preset Cepat Gaji** | UMR Jakarta · Fresh Grad S1 · Mid-Level · Senior Lead | Mindestlohn · Berufseinsteiger · Fachkraft · Führungskraft | Minimum Wage · Fresh Grad · Mid-Level · Senior Lead | 最低賃金 · 新卒初任給 · 中堅専門職 · 管理職/シニア | `PercentileClient.tsx` |
| **Hasil Peringkat Utama** | Persentil ke-X (Top Y%) · Rasio vs Median Nasional (misal 1.25x Median) | X. Perzentil (Top Y%) · Verhältnis zum Median (z.B. 1,25x Median) | Xth Percentile (Top Y%) · Ratio vs National Median (e.g. 1.25x Median) | 上位 Y%（第 X パーセンタイル）· 全国中央値比（例: 1.25倍） | `PercentileClient.tsx` |
| **Skala Distribusi Bar** | P10 (Bawah 10%) · P25 · P50 (Median) · P75 · P90 · P99 (Top 1%) | P10 · P25 · P50 (Median) · P75 · P90 · P99 (Top 1%) | P10 · P25 · P50 (Median) · P75 · P90 · P99 (Top 1%) | P10 · P25 · P50(中央値) · P75 · P90 · P99(上位1%) | `PercentileClient.tsx` |
| **Deskripsi Status Kelas** | Penghasilan Anda berada di persentil ke-X (Top Y%) di [Negara]. Sekitar X% pekerja memiliki pendapatan di bawah angka ini. | Ihr Einkommen liegt im X. Perzentil (Top Y%) in [Land]. Rund X% der Beschäftigten verdienen weniger als diesen Betrag. | Your income ranks in the Xth percentile (Top Y%) in [Country]. About X% of workers earn less than this. | あなたの月収は[国名]の所得上位 Y%（パーセンタイル第 X 位）に位置します。就業者の約 X% がこの金額を下回っています。 | `packages/core/src/calculator/percentile.ts` |
| **Kartu Perbandingan Lintas Negara** | Posisi jika uang yang sama dikonversi ke Indonesia, Jerman, dan Jepang | Vergleich der Kaufkraftäquivalente in Indonesien, Deutschland und Japan | Cross-Country Purchasing Power Equivalent in ID, DE, JP | 3カ国間での相対所得ポジション比較カード | `PercentileClient.tsx` |

---

## 📄 Halaman 5: Kalkulator Anggaran Penuh 7 Langkah (`/wizard`)
> **URL**: `http://localhost:4321/wizard`  
> **Komponen Utama**: `components/wizard/WizardClient.tsx` & `components/wizard/Step*.tsx`

| Langkah / Bagian | Bahasa Indonesia (ID) | Deutsch (DE) | English (EN) | 日本語 (JA) | File Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Indikator Progres** | Langkah {current} dari 7 | Schritt {current} von 7 | Step {current} of 7 | ステップ {current} / 7 | `locales/*.json` (`wizard.step_counter`) |
| **Langkah 1 (Tujuan)** | Pilih Negara & Kota Tujuan (Jerman: Berlin/München/Hamburg; Jepang: Tokyo/Osaka/Nagoya; Indonesia: Jakarta/Bandung/Surabaya) | Zielland & Zielstadt wählen | Choose Destination Country & City | 渡航先・目的都市の選択 | `components/wizard/Step1Destination.tsx` |
| **Langkah 2 (Jalur)** | Pilih Jalur: Ausbildung · Kenshusei · Mahasiswa · Fresh Grad · Profesional | Weg: Ausbildung · Kenshusei · Student · Berufseinsteiger | Pathway: Vocational Trainee · Technical Intern · Student · Fresh Grad | ビザ・就業形態: 職業訓練生 · 技能実習 · 留学生 · 新卒 | `components/wizard/Step2Pathway.tsx` |
| **Langkah 3 (Gaji & Potongan)** | Input Gaji Kotor, Tunjangan Lembur/Makan, Simulasi Pajak Progresif & Asuransi Sosial Wajib | Bruttogehalt, Zulagen, progressive Steuern & Sozialversicherungsabzüge | Gross Salary, Allowances, Progressive Tax & Social Insurance Deductions | 額面総支給・各種手当、累進税率および社会保険料の自動控除計算 | `components/wizard/Step3Income.tsx` |
| **Langkah 4 (Hunian & Sewa)** | Tipe Tempat Tinggal (Asrama pabrik, WG-Zimmer, Kost, Studio, Apartemen) & Biaya Awal (Kaution/Shikikin) | Wohnsituation (Wohnheim, WG, Studio, Wohnung) & Kaution | Housing Setup (Dorm, Shared Flat, Studio, 1BR) & Upfront Deposit | 住居形態（会社寮、シェアハウス、一般賃貸アパート）および初期費用 | `components/wizard/Step4Housing.tsx` |
| **Langkah 5 (Gaya Hidup & Belanja)** | Makan Masak Sendiri vs Jajan Luar, Tiket Transportasi, Pulsa & Internet, Hiburan, Asuransi Tambahan | Lebenshaltung: Kochen vs. Auswärtsessen, ÖPNV, Internet, Freizeit | Lifestyle: Cooking vs Dining Out, Transit Pass, Telecom, Leisure | 生活費: 自炊派vs外食派、交通費定期、通信費、娯楽・雑費 | `components/wizard/Step5Lifestyle.tsx` |
| **Langkah 6 (Review Parameter)** | Verifikasi Ringkasan Arus Kas, Modal Pindah Awal, dan Parameter Skenario | Zusammenfassung & Überprüfung aller Eingaben | Review & Audit: Cash Flow & Initial Relocation Costs | 入力内容の最終確認・初期移転費用と月次収支サマリー | `components/wizard/Step6Review.tsx` |
| **Langkah 7 (Hasil & Diagnostik)** | Lembar Hasil Lengkap: Gaji Bersih, Biaya Hidup Total, Sisa Tabungan, Runway Darurat, Skor Ketahanan Finansial, Unduh Kartu | Vollständige Auswertung: Netto, Ausgaben, Sparpotenzial, Notfall-Puffer, Risiko-Score, Kartendownload | Complete Financial Diagnosis: Net Income, Total Burn Rate, Net Savings, Runway Buffer, Health Score | 総合診断結果: 手取り額、月間支出合計、貯蓄余力、緊急防衛資金日数、財務健全度スコア | `components/wizard/Step7Results.tsx` |

---

## 📄 Halaman 6: Kontribusi Data Komunitas (`/contribute`)
> **URL**: `http://localhost:4321/contribute`  
> **Komponen Utama**: `components/contribute/ContributeClient.tsx`

| Bagian / Komponen | Bahasa Indonesia (ID) | Deutsch (DE) | English (EN) | 日本語 (JA) | File Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Judul Halaman** | Kontribusi Data Biaya Hidup Riil | Reale Lebenshaltungskosten beitragen | Contribute Real Cost of Living Observations | リアルな現地生活費データの提供・投稿 | `components/contribute/ContributeClient.tsx` |
| **Pesan Anonimitas** | 100% Anonim & Tanpa Registrasi. Data Anda membantu ribuan calon pejuang kerja luar negeri agar tidak tertipu agen nakal. | 100% anonym & ohne Registrierung. Ihre Erfahrung schützt künftige Berufseinsteiger vor falschen Versprechungen. | 100% Anonymous & No Registration Needed. Help fellow workers avoid exploitation and unrealistic agent promises. | 完全匿名・登録不要。あなたの実体験データが、これから海外を目指す人々の不当な契約や情報格差を防ぎます。 | `ContributeClient.tsx` |
| **Formulir Biaya** | Pilih Kota · Harga Sewa Kamar Sebenarnya · Biaya Makan Mingguan · Biaya Listrik/Pemanas Dingin · Tips Bertahan Hidup | Stadt wählen · Reale Miete · Wöchentliche Essenskosten · Nebenkosten/Heizung · Spartipps | City Select · Actual Rent · Weekly Groceries · Heating & Utilities · Survival Tips | 都市選択 · 実際の家賃 · 週間食費 · 冬季光熱費 · 現地生活のアドバイス | `ContributeClient.tsx` |
| **Tombol Kirim** | Kirim Pengamatan Anonim | Anonymen Beitrag absenden | Submit Anonymous Data | 匿名データを送信する | `ContributeClient.tsx` |
| **Konfirmasi Sukses** | Terima kasih! Pengamatan Anda telah masuk ke sistem antrean kurasi kami. | Vielen Dank! Ihr Beitrag wurde zur redaktionellen Prüfung übermittelt. | Thank you! Your observation has been queued for verification. | ありがとうございます！投稿内容はデータ精査キューへ送られました。 | `ContributeClient.tsx` |

---

## 📄 Halaman 7: Metodologi & Sumber Data (`/metode`)
> **URL**: `http://localhost:4321/metode`  
> **Komponen Utama**: `components/metode/MetodeClient.tsx`

| Bagian / Komponen | Bahasa Indonesia (ID) | Deutsch (DE) | English (EN) | 日本語 (JA) | File Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Judul Halaman** | Metodologi Perhitungan & Sumber Data Resmi | Berechnungsmethodik & Offizielle Datenquellen | Calculation Methodology & Official Data Sources | 計算方法・算定基準および公的データ出典 | `components/metode/MetodeClient.tsx` |
| **Pilar 1: Pajak & Asuransi** | Formula Pajak Lohnsteuer Jerman 2026, Shakai Hoken & Juminzei Jepang, dan PPh 21 TER / BPJS Indonesia | Deutsches Steuer- & Sozialversicherungsmodell 2026, Japanische Sozialabgaben, Indonesische PPh 21 & BPJS | Statutory Deductions: Germany 2026 Tax Table, Japan Social Insurance & Resident Tax, Indonesia PPh 21 TER & BPJS | 控除計算モデル: 2026年ドイツ所得税法、日本社会保険料率・住民税、インドネシア源泉徴収税(TER)・BPJS | `MetodeClient.tsx` |
| **Pilar 2: Paritas Daya Beli** | Mengapa Membandingkan Uang Saku Lewat Kurs Nominal Adalah Jebakan Finansial (Ilusi Nominal FX vs Real Purchasing Power) | Warum der reine Nominalkurs eine Illusion ist: Reale Kaufkraft vs. Wechselkurs | Why Nominal Currency Conversion is a Trap: PPP vs Nominal FX Illusion | 為替レート換算の罠: 名目換算と実質購買力（PPP）の違い | `MetodeClient.tsx` |
| **Pilar 3: Standar Sumber** | Destatis GENESIS-Online (Jerman) · e-Stat MHLW (Jepang) · BPS Sakernas/Susenas (Indonesia) · The Economist Big Mac Index | Destatis (DE) · e-Stat (JP) · BPS (ID) · The Economist Big-Mac-Index | Official Statistical Offices: Destatis, e-Stat, BPS, and The Economist Big Mac Index | 公的統計機関: ドイツ連邦統計局、日本政府統計e-Stat、インドネシア統計庁BPS、英エコノミスト誌 | `MetodeClient.tsx` |

---

## 📄 Halaman 8: Portal Admin & Kurasi Data (`/admin`)
> **URL**: `http://localhost:4321/admin`  
> **Komponen Utama**: `components/admin/AdminClient.tsx` & `components/admin/ProposalsAdminClient.tsx`

| Bagian / Komponen | Bahasa Indonesia (ID) | Deutsch (DE) | English (EN) | 日本語 (JA) | File Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Judul Halaman** | Portal Kurasi Data & Verifikasi Benchmark | Administrations- & Benchmark-Kurierungsportal | Benchmark Verification & Proposal Admin Portal | データ検証・提案承認管理ポータル | `components/admin/ProposalsAdminClient.tsx` |
| **Autentikasi** | Masukkan Kunci Akses Admin (Token Sandi) | Administrator-Passwort eingeben | Enter Admin Security Token | 管理者認証キーの入力 | `components/admin/AdminAuthGate.tsx` |
| **Status Sinkronisasi** | Sinkronisasi Kurs ECB Terakhir · Status API Destatis · Status API e-Stat | Letzte EZB-Wechselkurssynchronisierung · Destatis API-Status · e-Stat API-Status | Last ECB Exchange Rate Sync · Destatis API Status · e-Stat API Status | 欧州中銀為替同期ステータス · Destatis接続状況 · e-Stat接続状況 | `ProposalsAdminClient.tsx` |
| **Daftar Proposal (Diff)** | Tinjau Usulan Pembaruan Harga (Nilai Lama vs Nilai Baru dari Hermes Crawler / Kontribusi Pengguna) | Preisvorschläge prüfen (Bestehend vs. Vorgeschlagen) | Review Benchmark Proposals (Current vs Proposed Value) | 物価ベンチマーク変更提案の差分レビュー（現行値 vs 提案値） | `ProposalsAdminClient.tsx` |
| **Tombol Keputusan** | Setujui Pembaruan · Tolak Proposal · Edit Nilai Manual | Genehmigen · Ablehnen · Manuell anpassen | Approve · Reject · Edit Manually | 承認して本番反映 · 却下 · 手動修正 | `ProposalsAdminClient.tsx` |

---

## 📄 Halaman 9: Tinjau Skenario Berbagi (`/s/[token]`)
> **URL**: `http://localhost:4321/s/[token]`  
> **Komponen Utama**: `components/share/SharedScenarioClient.tsx`

| Bagian / Komponen | Bahasa Indonesia (ID) | Deutsch (DE) | English (EN) | 日本語 (JA) | File Sumber |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Judul Halaman** | Skenario Simulasi Dibagikan Secara Privat | Geteiltes Simulations-Szenario | Privately Shared Scenario | 共有されたシミュレーション結果 | `components/share/SharedScenarioClient.tsx` |
| **Badge Enkripsi** | 🔒 Skenario Terenkripsi & Dapat Dibatalkan Kapan Saja | 🔒 Verschlüsselt & jederzeit widerrufbar | 🔒 Encrypted & Revocable Anytime | 🔒 暗号化リンク・共有停止可能 | `SharedScenarioClient.tsx` |
| **Kartu Tinjauan** | Ringkasan Anggaran: Kota Asal vs Kota Tujuan, Gaji Bersih, Sewa, Makanan, Sisa Tabungan Bersih | Budget-Zusammenfassung: Netto, Warmmiete, Lebenshaltung, Sparreserve | Budget Summary: Net Pay, Housing, Living, Discretionary Savings | 収支概要カード: 手取り額、家賃、生活費、貯蓄可能額 | `SharedScenarioClient.tsx` |
| **Tombol Kloning** | 📋 Kloning & Sesuaikan Skenario Ini Sendiri | 📋 Als eigene Vorlage übernehmen & anpassen | 📋 Clone & Customize This Scenario | 📋 この設定を複製して自分の条件で試算する | `SharedScenarioClient.tsx` |

---

## 🛠️ Cara Cepat Mengubah Teks & Menjalankan Sinkronisasi

1. **Jika ingin mengubah kata pada teks global / UI umum**:
   - Buka `bandinghidup/scripts/sync_locales.py`.
   - Cari kunci teks yang ingin diubah pada kamus `TRANSLATIONS`.
   - Perbarui kata di baris `"id"`, `"de"`, `"en"`, atau `"ja"`.
   - Jalankan terminal di folder `bandinghidup/`:
     ```bash
     python scripts/sync_locales.py
     ```
   - Script akan otomatis memperbarui `apps/web/locales/id.json`, `en.json`, `de.json`, `ja.json` serta package core dengan 100% konsistensi.

2. **Jika ingin mengubah kata pada komponen spesifik**:
   - Langsung edit teks pada fungsi `txt("ID", "EN", "DE", "JA")` di dalam file komponen yang bersangkutan (misalnya `QuickHeroSimulator.tsx` atau `CompareClient.tsx`).
