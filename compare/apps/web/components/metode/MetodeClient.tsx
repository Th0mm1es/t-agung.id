"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import deInline from "@/locales/de_inlines.json";

const DE_INLINE = deInline as Record<string, string>;

export function MetodeClient() {
  const { locale } = useI18n();
  const txt = (idStr: string, enStr: string, deOrJaStr: string, jaStr?: string) => {
    if (jaStr !== undefined) {
      if (locale === "ja") return jaStr;
      if (locale === "de") return deOrJaStr;
      if (locale === "en") return enStr;
      return idStr;
    }
    if (locale === "ja") return deOrJaStr;
    if (locale === "de")
      return (DE_INLINE as Record<string, string>)[idStr] ?? (console.warn("[i18n] missing de inline:", idStr), enStr);
    if (locale === "en") return enStr;
    return idStr;
  };

  return (
    <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-10 animate-fade-in">
      {/* Header */}
      <div className="space-y-3 border-b border-line pb-6">
        <div className="flex items-center gap-2">
          <span className="badge-brand text-xs">🏛️ {txt("Transparansi & Integritas Data", "Transparency & Data Integrity", "Transparenz & Datenintegrität", "透明性・データ整合性")}</span>
          <span className="text-xs text-fg-soft font-mono">BPS · e-Stat · Destatis · EStG</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-[var(--text)]">
          {txt("Metodologi & Sumber Data", "Methodology & Data Sources", "Methodik & Datenquellen", "方法論とデータソース")}
        </h1>
        <p className="text-sm sm:text-base text-fg-60 max-w-2xl leading-relaxed">
          {txt(
            "BandingHidup dibangun untuk menghilangkan ilusi nominal konversi mata uang. Seluruh perhitungan didasarkan pada regulasi perpajakan resmi, statistik pendapatan nasional, dan paritas daya beli riil.",
            "BandingHidup is built to eliminate the illusion of nominal currency conversion. Every calculation is grounded in official tax regulations, national income statistics, and real purchasing-power parity.",
            "BandingHidup wurde entwickelt, um die Illusion der nominalen Währungsumrechnung zu beseitigen. Jede Berechnung basiert auf offiziellen Steuervorschriften, nationalen Einkommensstatistiken und realem Kaufkraftausgleich.",
            "BandingHidupは為替の単純換算による誤解を解消するために作られました。すべての計算は公的な税法・国税統計・実質的な購買力平価に基づいています。"
          )}
        </p>
      </div>

      {/* Section 1: Official Data Sources */}
      <section className="glass-card p-6 sm:p-8 space-y-4 border border-line rounded-xl bg-panel">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📊</span>
          <h2 className="text-lg font-bold text-[var(--text)]">
            {txt("1. Sumber Data Resmi per Negara", "1. Official Data Sources by Country", "1. Offizielle Datenquellen pro Land", "1. 国別の公的データソース")}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-fg-70 leading-relaxed">
          {txt(
            "Data pendapatan dan acuan biaya hidup di BandingHidup tidak menggunakan angka perkiraan kasar, melainkan dikalibrasi secara ketat terhadap publikasi statistik ketenagakerjaan resmi:",
            "Income data and cost-of-living references in BandingHidup do not use rough estimates — they are strictly calibrated against official labour-statistics publications:",
            "Einkommensdaten und Lebenshaltungsreferenzen in BandingHidup basieren nicht auf groben Schätzungen, sondern werden strikt an offiziellen Arbeitsstatistiken kalibriert:",
            "BandingHidupの所得データ・生活費基準は粗略な推定値ではなく、公的な労働統計の発表値に対して厳密にキャリブレーションされています："
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
            <div className="font-bold text-sm text-[var(--accent)] flex items-center gap-2">
              <span>🇩🇪</span>
              <span>{txt("Jerman (Germany)", "Germany", "Deutschland", "ドイツ")}</span>
            </div>
            <ul className="text-xs text-fg-60 space-y-1.5 list-disc list-inside">
              <li><strong className="text-fg-80">Statistisches Bundesamt (Destatis)</strong>: {txt("Verdienststrukturerhebung & Mikrozensus 2024–2026.", "Verdienststrukturerhebung & Mikrozensus 2024–2026.", "Verdienststrukturerhebung & Mikrozensus 2024–2026.", "VerdienststrukturerhebungおよびMikrozensus 2024–2026.")}</li>
              <li><strong className="text-fg-80">EStG § 32a</strong>: {txt("Rumus progresif Lohnsteuer resmi (Steuerklasse 1 s/d 5).", "Official progressive income-tax formula (tax classes 1–5).", "Offizielle progressive Lohnsteuerformel (Steuerklasse 1–5).", "公式の累進所得税計算式（ Steuerklasse 1〜5）。")}</li>
              <li><strong className="text-fg-80">Sozialgesetzbuch (SGB)</strong>: {txt("Tarif iuran asuransi sosial wajib (KV, RV, AV, PV).", "Mandatory social-security contribution rates (KV, RV, AV, PV).", "Pflichtbeiträge zur Sozialversicherung (KV, RV, AV, PV).", "社会保険料の法定料金（KV、RV、AV、PV）。")}</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
            <div className="font-bold text-sm text-[var(--accent)] flex items-center gap-2">
              <span>🇯🇵</span>
              <span>{txt("Jepang (Japan)", "Japan", "Japan", "日本")}</span>
            </div>
            <ul className="text-xs text-fg-60 space-y-1.5 list-disc list-inside">
              <li><strong className="text-fg-80">e-Stat & MHLW (厚生労働省)</strong>: {txt("賃金構造基本統計調査 & 国民生活基礎調査.", "Basic Survey on Wage Structure & National Living Level Survey.", "Grundgesamterhebung zur Vergütungsstruktur & Nationale Lebenshaltungserhebung.", "賃金構造基本統計調査および国民生活基礎調査。")}</li>
              <li><strong className="text-fg-80">NTA (国税庁)</strong>: {txt("Tabel pemotongan Pajak Penghasilan (Shotokuzei).", "Income-tax (Shotokuzei) withholding tables.", "Lohnsteuer-Abzugsformeln der NTA (Shotokuzei).", "国税庁（NTA）の所得税（所得税額）源泉徴収表。")}</li>
              <li><strong className="text-fg-80">{txt("Pajak Penduduk (住民税)", "Resident Tax (住民税)", "Einwohnersteuer (住民税)", "住民税")}</strong>: {txt("Aturan pembebasan tahun ke-1 untuk peserta magang asing.", "First-year exemption rules for foreign trainees.", "Befreiungsregel im ersten Jahr für ausländische Praktikanten.", "外国人研修・実習生に対する1年目の免税ルール。")}</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
            <div className="font-bold text-sm text-[var(--accent)] flex items-center gap-2">
              <span>🇮🇩</span>
              <span>{txt("Indonesia", "Indonesia", "Indonesien", "インドネシア")}</span>
            </div>
            <ul className="text-xs text-fg-60 space-y-1.5 list-disc list-inside">
              <li><strong className="text-fg-80">Badan Pusat Statistik (BPS)</strong>: {txt("Survei Angkatan Kerja Nasional (Sakernas) 2024–2026.", "National Labour Force Survey (Sakernas) 2024–2026.", "Nationale Arbeitskräfteerhebung (Sakernas) 2024–2026.", "全国労働力調査（Sakernas）2024–2026。")}</li>
              <li><strong className="text-fg-80">PP No. 58/2023</strong>: {txt("Tarif Efektif Rata-Rata (TER) PPh Pasal 21.", "Average Effective Rate (TER) for PPh Article 21.", "Durchschnittlicher Effektivsteuersatz (TER) PPh Artikel 21.", "源泉所得税（PPh21）の平均実効税率（TER）。")}</li>
              <li><strong className="text-fg-80">{txt("BPJS Ketenagakerjaan & Kesehatan", "BPJS Employment & Health", "BPJS Arbeits- & Krankenversicherung", "雇用保険・健康保険（BPJS）")}</strong>: {txt("Tarif iuran wajib JHT, JP, dan JKN.", "Mandatory JHT, JP and JKN contribution rates.", "Pflichtbeiträge JHT, JP und JKN.", "JHT、JP、JKNの法定保険料率。")}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 2: Why Nominal Currency Conversion Is Distorted */}
      <section className="glass-card p-6 sm:p-8 space-y-4 border border-line rounded-xl bg-panel">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">💡</span>
          <h2 className="text-lg font-bold text-[var(--text)]">
            {txt("2. Mengapa Konversi Kurs Nominal Menyesatkan?", "2. Why Nominal Exchange Conversion Misleads", "2. Warum nominale Währungsumrechnung irreführend ist", "2. なぜ名目為替換算が誤解を招くのか")}
          </h2>
        </div>
        <div className="space-y-3 text-xs sm:text-sm text-fg-70 leading-relaxed">
          <p>
            {txt(
              "Banyak calon pekerja migran, peserta magang, atau mahasiswa melakukan kesalahan fatal: mengalikan gaji luar negeri langsung dengan kurs rupiah (misalnya €1 = Rp 17.500 atau ¥1 = Rp 105) lalu membayangkan gaya hidup setara jumlah rupiah tersebut di tanah air.",
              "Many prospective migrant workers, trainees and students make a fatal mistake: multiplying a foreign salary straight by the rupiah rate (e.g. €1 = Rp 17,500 or ¥1 = Rp 105) and then imagining an equivalent home-country lifestyle at that rupiah amount.",
              "Viele angehende Migranten, Praktikanten und Studierende machen einen fatalen Fehler: Sie multiplizieren das ausländische Gehalt direkt mit dem Rupia-Kurs (z. B. 1 € = 17.500 Rp oder 1 ¥ = 105 Rp) und stellen sich dann ein gleichwertiges Leben in der Heimat vor.",
              "多くの海外志向の労働者・研修生・学生が致命的な間違いをします。海外の給与をそのままルピア為替（例：€1 = Rp 17,500、¥1 = Rp 105）で掛けて、そのルピア額と同じ生活ができると思い込むことです。"
            )}
          </p>
          <p>
            {txt(
              "Kenyataannya, biaya kebutuhan dasar (sewa tempat tinggal, makanan pokok, transportasi harian) di kota-kota seperti Munich, Berlin, atau Tokyo berkali-kali lipat lebih mahal daripada di Jakarta atau Surabaya. Gaji kotor €3.000 (Rp 52,5 juta) di Berlin setelah dipotong pajak & asuransi sosial (~35–42%) dan sewa apartemen (€800–€1.200) sering kali menyisakan daya beli yang setara dengan Rp 10–12 juta di Jakarta.",
              "In reality, basic costs (rent, groceries, daily transport) in cities like Munich, Berlin or Tokyo are multiples higher than in Jakarta or Surabaya. A €3,000 gross salary in Berlin, after tax and social security (~35–42%) and rent (€800–€1,200), often leaves purchasing power equivalent to Rp 10–12 million in Jakarta.",
              "In Wirklichkeit sind Grundkosten (Miete, Lebensmittel, Alltagstransport) in Städten wie München, Berlin oder Tokyo ein Vielfaches höher als in Jakarta oder Surabaya. Ein Bruttogehalt von 3.000 € in Berlin lässt nach Steuern und Sozialabgaben (~35–42 %) sowie Miete (800–1.200 €) oft nur noch Kaufkraft übrig, die 10–12 Mio. Rp in Jakarta entspricht.",
              "実際、ミュンヘン・ベルリン・東京のような都市では、住居・食費・日常交通費といった基礎的な生活コストがジャカルタやスラバヤの何倍も高くなっています。ベルリンで月総額3,000€（約Rp 5,250万）の給与から税金・社会保険料（約35〜42%）と家賃（€800〜€1,200）を引くと、残る購買力はジャカルタでRp 1,000〜1,200万相当になることが多いのです。"
            )}
          </p>
          <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/20 text-xs text-fg-80">
            <strong className="text-accent-300 block mb-1">
              {txt("Solusi BandingHidup: Indeks Kenyang & Paritas Beban", "The BandingHidup solution: Satiety Index & Burden Parity", "Die BandingHidup-Lösung: Sättigungsindex & Belastungsparität", "BandingHidupの解法：満腹インデックスと負担パリティ")}
            </strong>
            {txt(
              "Kami menghitung jumlah porsi makanan riil dan persentase biaya sewa terhadap gaji bersih untuk memastikan Anda mengetahui nilai nyata kontrak kerja Anda sebelum berangkat.",
              "We count real meal portions and rent as a percentage of take-home pay so you know the true value of your contract before you leave.",
              "Wir zählen reale Mahlzeiten und Miete als Anteil des Nettogehalts, damit Sie den wahren Wert Ihres Vertrags vor der Abreise kennen.",
              "実質的な食事の回数と、手取りに対する家賃の割合を算出することで、出発前にあなたの契約の実質的な価値を正確に把握できるようにします。"
            )}
          </div>
        </div>
      </section>

      {/* Section 3: Update Cadence & Pipeline */}
      <section className="glass-card p-6 sm:p-8 space-y-4 border border-line rounded-xl bg-panel">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🔄</span>
          <h2 className="text-lg font-bold text-[var(--text)]">
            {txt("3. Frekuensi Pembaruan Data", "3. Data Update Cadence", "3. Datenaktualisierung", "3. データ更新頻度")}
          </h2>
        </div>
        <div className="space-y-2 text-xs sm:text-sm text-fg-70 leading-relaxed">
          <p>
            {txt("BandingHidup mengoperasikan pipeline otomatis yang memeriksa:", "BandingHidup runs an automated pipeline that checks:", "BandingHidup betreibt eine automatisierte Pipeline, die prüft:", "BandingHidupは自動的に以下を監視するパイプラインを運用しています：")}
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-fg-60">
            <li><strong className="text-fg-80">{txt("Nilai Tukar Mata Uang:", "Exchange rates:", "Wechselkurse:", "為替レート：")}</strong> {txt("Diperbarui setiap hari kerja mengacu pada European Central Bank (ECB) dan konsensus pasar.", "Updated every business day based on the European Central Bank (ECB) and market consensus.", "An jedem Werktag aktualisiert, basierend auf der Europäischen Zentralbank (EZB) und Marktkonsens.", "業務日ごとに欧州中央銀行（ECB）と市場コンセンサスを基準に更新。")}</li>
            <li><strong className="text-fg-80">{txt("Regulasi Pajak & Iuran:", "Tax & contribution rules:", "Steuern & Beiträge:", "税法・保険料ルール：")}</strong> {txt("Diverifikasi setiap perubahan tahun fiskal (perubahan bracket PTKP, batas Beitragsbemessungsgrenze Jerman, dll).", "Verified at every fiscal-year change (PTKP bracket changes, German Beitragsbemessungsgrenze limits, etc.).", "Bei jeder Haushaltsjahresänderung verifiziert (PTKP-Progressionen, deutsche Beitragsbemessungsgrenzen usw.).", "毎年の予算年度変更時に検証（PTKPの控除額変更、ドイツの課税上限額変更など）。")}</li>
            <li><strong className="text-fg-80">{txt("Indeks Sewa & Harga Komoditas:", "Rent & commodity indices:", "Miet- & Warenpreisindizes:", "家賃・物価指数：")}</strong> {txt("Disinkronkan triwulanan menggunakan data agregasi komunitas dan survei harga perumahan.", "Synchronised quarterly using community aggregation data and housing price surveys.", "Quartalsweise synchronisiert anhand von Community-Aggregaten und Wohnungsmarkterhebungen.", "コミュニティ集計データと住宅価格調査を用いて四半期ごとに同期。")}</li>
          </ul>
        </div>
      </section>

      {/* Section 4: Community Contribution Pipeline */}
      <section className="glass-card p-6 sm:p-8 space-y-4 border border-line rounded-xl bg-panel">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🤝</span>
          <h2 className="text-lg font-bold text-[var(--text)]">
            {txt("4. Partisipasi Komunitas & Moderasi Data", "4. Community Participation & Data Moderation", "4. Community-Beitrag & Datenmoderation", "4. コミュニティ参加とデータモデレーション")}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-fg-70 leading-relaxed">
          {txt(
            "Agar angka di kota-kota spesifik tetap akurat dan mencerminkan kondisi riil di lapangan, BandingHidup membuka saluran kontribusi harga anonim dari warga Indonesia yang sedang tinggal di Jerman dan Jepang.",
            "To keep city-level figures accurate and reflective of real on-the-ground conditions, BandingHidup accepts anonymous price contributions from Indonesian residents living in Germany and Japan.",
            "Damit städtische Zahlen genau und realitätsnah bleiben, nimmt BandingHidup anonyme Preisbeiträge von in Deutschland und Japan lebenden Indonesien auf.",
            "都市ごとの数値を実態に合わせて正確に保つため、BandingHidupではドイツ・日本在住のインドネシア出身者からの匿名価格提供を受け付けています。"
          )}
        </p>
        <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2 text-xs text-fg-70">
          <div className="font-semibold text-fg-90">
            {txt("Prinsip Keamanan & Privasi Kontribusi:", "Contribution Security & Privacy Principles:", "Sicherheits- & Datenschutzgrundsätze für Beiträge:", "貢献のセキュリティとプライバシー原則：")}
          </div>
          <ul className="list-disc list-inside space-y-1 text-fg-60">
            <li><strong className="text-fg-80">{txt("100% Anonim:", "100% Anonymous:", "100 % anonym:", "100%匿名：")}</strong> {txt("Tanpa akun, tanpa pelacak data pribadi, dan nomor kontak tidak pernah disimpan.", "No account, no personal-data trackers, contact details are never stored.", "Kein Konto, keine personenbezogenen Tracker, Kontaktdaten werden nie gespeichert.", "アカウント不要・個人データの追跡なし・連絡先は保存されません。")}</li>
            <li><strong className="text-fg-80">{txt("Moderasi Ketat:", "Strict Moderation:", "Strenge Moderation:", "厳格なモデレーション：")}</strong> {txt("Setiap entri diverifikasi oleh tim kurator sebelum dimasukkan ke dalam agregasi median.", "Every entry is verified by the curation team before it enters the median aggregation.", "Jeder Eintrag wird vom Kuratorteam geprüft, bevor er in die Median-Aggregation aufgenommen wird.", "すべての投稿は、中央値の集計に反映される前にキュレーションチームが検証します。")}</li>
            <li><strong className="text-fg-80">{txt("Hanya Nilai Median:", "Medians Only:", "Nur Medianwerte:", "中央値のみ：")}</strong> {txt("Data ditampilkan sebagai nilai median kota untuk mencegah outlier atau distorsi harga sepihak.", "Data is shown as city medians to prevent outliers or one-sided price distortion.", "Daten werden als Stadtmittelwert (Median) angezeigt, um Ausreißer oder einseitige Preisverzerrung zu verhindern.", "データは都市の中央値として表示され、外れ値や一方的な価格歪みを防ぎます。")}</li>
          </ul>
        </div>

        <div className="pt-2">
          <Link
            href="/contribute"
            className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-semibold rounded-lg shadow-sm"
          >
            <span>💬</span>
            <span>{txt("Bagikan Pengamatan Harga di Kotamu", "Share Price Observations from Your City", "Preisbeobachtungen aus deiner Stadt teilen", "あなたの街の価格情報を共有する")}</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
