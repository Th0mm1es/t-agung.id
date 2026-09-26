import { WizardClient } from "@/components/wizard/WizardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kalkulator Cost of Living — BandingHidup",
  description: "Simulasi biaya hidup realistis untuk Ausbildung di Jerman dan Kenshusei di Jepang.",
};

export default function WizardPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-brand-500 selection:text-white pb-16">
      <WizardClient />
    </main>
  );
}
