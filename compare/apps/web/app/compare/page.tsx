import { Suspense } from "react";
import { CompareClient } from "@/components/compare/CompareClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perbandingan Kota — BandingHidup",
  description: "Bandingkan biaya hidup & sisa uang bulanan antar kota di Jerman dan Jepang.",
};

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-brand-500 selection:text-white pb-16">
      <Suspense fallback={<div className="p-8 text-center text-white/50">Memuat perbandingan...</div>}>
        <CompareClient />
      </Suspense>
    </main>
  );
}
