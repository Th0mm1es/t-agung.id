import { Suspense } from "react";
import { ContributeClient } from "@/components/contribute/ContributeClient";
import { CommentsSection } from "@/components/common/CommentsSection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontribusi Anonim — BandingHidup",
  description: "Bagikan pengamatan harga riil di kotamu secara anonim tanpa akun.",
};

export default function ContributePage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent-soft)] selection:text-[var(--text)] pb-16">
      <Suspense fallback={<div className="p-8 text-center text-fg-muted">Memuat form kontribusi...</div>}>
        <ContributeClient />
      </Suspense>
      <CommentsSection threadId="contribute" />
    </main>
  );
}
