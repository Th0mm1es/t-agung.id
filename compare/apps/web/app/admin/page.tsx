import { Suspense } from "react";
import { ProposalsAdminClient } from "@/components/admin/ProposalsAdminClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Proposal Portal — BandingHidup",
  description: "Data Governance & Hermes Ingestion Pipeline Review Portal",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-brand-500 selection:text-white pb-16">
      <Suspense fallback={<div className="p-8 text-center text-white/50">Memuat Admin Portal...</div>}>
        <ProposalsAdminClient />
      </Suspense>
    </main>
  );
}
