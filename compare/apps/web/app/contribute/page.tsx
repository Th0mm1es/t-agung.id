import { Suspense } from "react";
import { ContributeClient } from "@/components/contribute/ContributeClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontribusi Anonim — BandingHidup",
  description: "Bagikan pengamatan harga riil di kotamu secara anonim tanpa akun.",
};

export default function ContributePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-brand-500 selection:text-white pb-16">
      <Suspense fallback={<div className="p-8 text-center text-white/50">Memuat form kontribusi...</div>}>
        <ContributeClient />
      </Suspense>
    </main>
  );
}
