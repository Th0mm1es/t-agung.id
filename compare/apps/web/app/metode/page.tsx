import { MetodeClient } from "@/components/metode/MetodeClient";
import type { Metadata } from "next";

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
      <MetodeClient />
    </div>
  );
}
