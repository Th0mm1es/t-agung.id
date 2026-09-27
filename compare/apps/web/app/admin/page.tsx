import { Suspense } from "react";
import { ProposalsAdminClient } from "@/components/admin/ProposalsAdminClient";
import { AdminAuthGate } from "@/components/admin/AdminAuthGate";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Proposal Portal — BandingHidup",
  description: "Data Governance & Hermes Ingestion Pipeline Review Portal",
};

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent-soft)] selection:text-[var(--text)] pb-16">
      <Suspense fallback={<div className="p-8 text-center text-fg-muted">Memuat Admin Portal...</div>}>
        <AdminAuthGate>
          <ProposalsAdminClient />
        </AdminAuthGate>
      </Suspense>
    </main>
  );
}
