import { WizardClient } from "@/components/wizard/WizardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator Anggaran Penuh 7 Langkah — BandingHidup",
  description: "Simulasi biaya hidup realistis untuk Ausbildung di Jerman dan Kenshusei di Jepang.",
};

export default function WizardPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent-soft)] selection:text-[var(--text)] pb-16">
      <div className="max-w-xl mx-auto px-4 pt-6 pb-2 text-center">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--text)]">
          Kalkulator Anggaran Penuh (7 Langkah)
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
          Perencanaan modal awal, gaji bersih, pengeluaran riil, dan diagnostik ketahanan finansial Ausbildung & Kenshusei.
        </p>
      </div>
      <WizardClient />
    </main>
  );
}
