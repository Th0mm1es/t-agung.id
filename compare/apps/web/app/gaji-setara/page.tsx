import type { Metadata } from "next";
import { EquivalenceCalculatorClient } from "@/components/equivalence/EquivalenceCalculatorClient";
import { CommentsSection } from "@/components/common/CommentsSection";

export const metadata: Metadata = {
  title: "Berapa Gaji Setaraku? — Ekivalen Gaya Hidup & Gaji",
  description:
    "Hitung berapa gaji yang harus Anda dapatkan di Jerman, Jepang, atau Indonesia agar standar hidup dan daya beli Anda tetap sama persis.",
};

export default function GajiSetaraPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] pb-16">
      <EquivalenceCalculatorClient />
      <CommentsSection threadId="gaji-setara" />
    </main>
  );
}
