import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Metodologi & Sumber Data | BandingHidup",
  description:
    "Transparansi metodologi kalkulasi paritas daya beli, sumber data resmi (Destatis, e-Stat, BPS), mitigasi distorsi kurs, dan pipeline data BandingHidup.",
  alternates: {
    canonical: "/metode",
  },
};

export default function MetodePage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 space-y-10 animate-fade-in">
        {/* Header */}
        <div className="space-y-3 border-b border-line pb-6">
          <div className="flex items-center gap-2">
            <span className="badge-brand text-xs">🏛️ Transparansi & Integritas Data</span>
            <span className="text-xs text-fg-soft font-mono">BPS · e-Stat · Destatis · EStG</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-[var(--text)]">
            Metodologi & Sumber Data
          </h1>
          <p className="text-sm sm:text-base text-fg-60 max-w-2xl leading-relaxed">
            BandingHidup dibangun untuk menghilangkan ilusi nominal konversi mata uang. Seluruh perhitungan didasarkan pada regulasi perpajakan resmi, statistik pendapatan nasional, dan paritas daya beli riil.
          </p>
        </div>

        {/* Section 1: Official Data Sources */}
        <section className="glass-card p-6 sm:p-8 space-y-4 border border-line rounded-xl bg-panel">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-bold text-[var(--text)]">
              1. Sumber Data Resmi per Negara
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-fg-70 leading-relaxed">
            Data pendapatan dan acuan biaya hidup di BandingHidup tidak menggunakan angka perkiraan kasar, melainkan dikalibrasi secara ketat terhadap publikasi statistik ketenagakerjaan resmi:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
              <div className="font-bold text-sm text-[var(--accent)] flex items-center gap-2">
                <span>🇩🇪</span>
                <span>Jerman (Germany)</span>
              </div>
              <ul className="text-xs text-fg-60 space-y-1.5 list-disc list-inside">
                <li><strong className="text-fg-80">Statistisches Bundesamt (Destatis)</strong>: Verdienststrukturerhebung & Mikrozensus 2024–2026.</li>
                <li><strong className="text-fg-80">EStG § 32a</strong>: Rumus progresif Lohnsteuer resmi (Steuerklasse 1 s/d 5).</li>
                <li><strong className="text-fg-80">Sozialgesetzbuch (SGB)</strong>: Tarif iuran asuransi sosial wajib (KV, RV, AV, PV).</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
              <div className="font-bold text-sm text-[var(--accent)] flex items-center gap-2">
                <span>🇯🇵</span>
                <span>Jepang (Japan)</span>
              </div>
              <ul className="text-xs text-fg-60 space-y-1.5 list-disc list-inside">
                <li><strong className="text-fg-80">e-Stat & MHLW (厚生労働省)</strong>: 賃金構造基本統計調査 & 国民生活基礎調査.</li>
                <li><strong className="text-fg-80">NTA (国税庁)</strong>: Tabel pemotongan Pajak Penghasilan (Shotokuzei).</li>
                <li><strong className="text-fg-80">Pajak Penduduk (住民税)</strong>: Aturan pembebasan tahun ke-1 untuk peserta magang asing.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2">
              <div className="font-bold text-sm text-[var(--accent)] flex items-center gap-2">
                <span>🇮🇩</span>
                <span>Indonesia</span>
              </div>
              <ul className="text-xs text-fg-60 space-y-1.5 list-disc list-inside">
                <li><strong className="text-fg-80">Badan Pusat Statistik (BPS)</strong>: Survei Angkatan Kerja Nasional (Sakernas) 2024–2026.</li>
                <li><strong className="text-fg-80">PP No. 58/2023</strong>: Tarif Efektif Rata-Rata (TER) PPh Pasal 21.</li>
                <li><strong className="text-fg-80">BPJS Ketenagakerjaan & Kesehatan</strong>: Tarif iuran wajib JHT, JP, dan JKN.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 2: Why Nominal Currency Conversion Is Distorted */}
        <section className="glass-card p-6 sm:p-8 space-y-4 border border-line rounded-xl bg-panel">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💡</span>
            <h2 className="text-lg font-bold text-[var(--text)]">
              2. Mengapa Konversi Kurs Nominal Menyesatkan?
            </h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-fg-70 leading-relaxed">
            <p>
              Banyak calon pekerja migran, peserta magang, atau mahasiswa melakukan kesalahan fatal: mengalikan gaji luar negeri langsung dengan kurs rupiah (misalnya <code className="px-1.5 py-0.5 rounded bg-panel-2 font-mono text-[var(--accent)]">€1 = Rp 17.500</code> atau <code className="px-1.5 py-0.5 rounded bg-panel-2 font-mono text-[var(--accent)]">¥1 = Rp 105</code>) lalu membayangkan gaya hidup setara jumlah rupiah tersebut di tanah air.
            </p>
            <p>
              Kenyataannya, biaya kebutuhan dasar (sewa tempat tinggal, makanan pokok, transportasi harian) di kota-kota seperti Munich, Berlin, atau Tokyo berkali-kali lipat lebih mahal daripada di Jakarta atau Surabaya. Gaji kotor €3.000 (Rp 52,5 juta) di Berlin setelah dipotong pajak & asuransi sosial (~35–42%) dan sewa apartemen (€800–€1.200) sering kali menyisakan daya beli yang setara dengan Rp 10–12 juta di Jakarta.
            </p>
            <div className="p-4 rounded-xl bg-accent-500/10 border border-accent-500/20 text-xs text-fg-80">
              <strong className="text-accent-300 block mb-1">Solusi BandingHidup: Indeks Kenyang & Paritas Beban</strong>
              Kami menghitung jumlah porsi makanan riil dan persentase biaya sewa terhadap gaji bersih untuk memastikan Anda mengetahui nilai nyata kontrak kerja Anda sebelum berangkat.
            </div>
          </div>
        </section>

        {/* Section 3: Update Cadence & Pipeline */}
        <section className="glass-card p-6 sm:p-8 space-y-4 border border-line rounded-xl bg-panel">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔄</span>
            <h2 className="text-lg font-bold text-[var(--text)]">
              3. Frekuensi Pembaruan Data
            </h2>
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-fg-70 leading-relaxed">
            <p>
              BandingHidup mengoperasikan pipeline otomatis yang memeriksa:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-fg-60">
              <li><strong className="text-fg-80">Nilai Tukar Mata Uang:</strong> Diperbarui setiap hari kerja mengacu pada European Central Bank (ECB) dan konsensus pasar.</li>
              <li><strong className="text-fg-80">Regulasi Pajak & Iuran:</strong> Diverifikasi setiap perubahan tahun fiskal (perubahan bracket PTKP, batas Beitragsbemessungsgrenze Jerman, dll).</li>
              <li><strong className="text-fg-80">Indeks Sewa & Harga Komoditas:</strong> Disinkronkan triwulanan menggunakan data agregasi komunitas dan survei harga perumahan.</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Community Contribution Pipeline */}
        <section className="glass-card p-6 sm:p-8 space-y-4 border border-line rounded-xl bg-panel">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🤝</span>
            <h2 className="text-lg font-bold text-[var(--text)]">
              4. Partisipasi Komunitas & Moderasi Data
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-fg-70 leading-relaxed">
            Agar angka di kota-kota spesifik tetap akurat dan mencerminkan kondisi riil di lapangan, BandingHidup membuka saluran kontribusi harga anonim dari warga Indonesia yang sedang tinggal di Jerman dan Jepang.
          </p>
          <div className="p-4 rounded-xl bg-panel-2 border border-line space-y-2 text-xs text-fg-70">
            <div className="font-semibold text-fg-90">Prinsip Keamanan & Privasi Kontribusi:</div>
            <ul className="list-disc list-inside space-y-1 text-fg-60">
              <li><strong className="text-fg-80">100% Anonim:</strong> Tanpa akun, tanpa pelacak data pribadi, dan nomor kontak tidak pernah disimpan.</li>
              <li><strong className="text-fg-80">Moderasi Ketat:</strong> Setiap entri diverifikasi oleh tim kurator sebelum dimasukkan ke dalam agregasi median.</li>
              <li><strong className="text-fg-80">Hanya Nilai Median:</strong> Data ditampilkan sebagai nilai median kota untuk mencegah outlier atau distorsi harga sepihak.</li>
            </ul>
          </div>

          <div className="pt-2">
            <Link
              href="/contribute"
              className="btn-primary inline-flex items-center gap-2 py-2.5 px-5 text-xs font-semibold rounded-lg shadow-sm"
            >
              <span>💬</span>
              <span>Bagikan Pengamatan Harga di Kotamu</span>
              <span>→</span>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
