import type { Metadata } from "next";
import { LandingPageClient } from "@/components/LandingPageClient";

export const metadata: Metadata = {
  title: "BandingHidup — Perbandingan Biaya Hidup Ausbildung & Kenshusei",
  description:
    "Perbandingan biaya hidup realistis untuk peserta Ausbildung di Jerman dan Kenshusei di Jepang. Gratis, anonim, dan jujur.",
};

export default function HomePage() {
  return <LandingPageClient />;
}
