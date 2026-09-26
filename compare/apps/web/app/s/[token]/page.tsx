import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SharedScenarioClient } from "@/components/share/SharedScenarioClient";
import type { Metadata } from "next";

interface Props {
  params: { token: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "Skenario Privat — BandingHidup",
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function SharedScenarioPage({ params }: Props) {
  const { token } = params;
  const client = supabase as any;

  const { data: shared, error } = await client
    .from("shared_scenarios")
    .select("*")
    .eq("id", token)
    .maybeSingle();

  if (error || !shared) {
    notFound();
  }

  if (shared.expires_at && new Date(shared.expires_at).getTime() < Date.now()) {
    notFound();
  }

  // Restore BigInts in scenario_snapshot if needed
  const snapshot = shared.scenario_snapshot;

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-brand-500 selection:text-white pb-16">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <SharedScenarioClient token={token} result={snapshot} />
    </main>
  );
}
