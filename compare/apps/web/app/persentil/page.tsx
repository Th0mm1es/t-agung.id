import type { Metadata } from "next";
import { PercentileClient } from "@/components/percentile/PercentileClient";

export const metadata: Metadata = {
  title: "Posisi Persentil Gaji — Radar Pendapatan Nasional & Global",
  description:
    "Cek posisi persentil gaji Anda di Indonesia, serta perbandingannya dengan distribusi pendapatan di Jerman dan Jepang.",
};

export default function PersentilPage() {
  return <PercentileClient />;
}
