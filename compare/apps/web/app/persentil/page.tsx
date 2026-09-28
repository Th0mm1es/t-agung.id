import type { Metadata } from "next";
import { PercentileClient } from "@/components/percentile/PercentileClient";
import { CommentsSection } from "@/components/common/CommentsSection";

export const metadata: Metadata = {
  title: "Posisi Persentil Gaji — Radar Pendapatan Nasional & Global",
  description:
    "Cek posisi persentil gaji Anda di Indonesia, serta perbandingannya dengan distribusi pendapatan di Jerman dan Jepang.",
};

export default function PersentilPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-16">
      <PercentileClient />
      <CommentsSection threadId="persentil" />
    </main>
  );
}
