import { WizardClient } from "@/components/wizard/WizardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator Anggaran Penuh 7 Langkah — BandingHidup",
  description: "Simulasi biaya hidup realistis untuk Ausbildung di Jerman dan Kenshusei di Jepang.",
};

export default function WizardPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent-soft)] selection:text-[var(--text)] pb-16">
      <WizardClient />
    </main>
  );
}
