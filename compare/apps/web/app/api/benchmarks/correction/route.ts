import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env["NEXT_PUBLIC_SUPABASE_URL"] ?? "https://placeholder.supabase.co";
const serviceRoleKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] || process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || "placeholder";

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const CorrectionSchema = z.object({
  city_id: z.string().uuid(),
  category_code: z.string().min(2),
  corrected_value_major: z.number().positive(),
  currency_code: z.enum(["EUR", "JPY", "IDR", "USD"]),
  user_identifier: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CorrectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid correction payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { city_id, category_code, corrected_value_major, currency_code, user_identifier, note } = parsed.data;

    // Convert to minor units
    const multiplier = currency_code === "EUR" || currency_code === "USD" ? 100 : 1;
    const valueMinorUnits = BigInt(Math.round(corrected_value_major * multiplier));

    const allowDirectUpdate = process.env["NEXT_PUBLIC_ALLOW_DIRECT_BENCHMARK_UPDATES"] !== "false";
    const now = new Date().toISOString();

    // 1. Fetch data source 'user_crowdsource' or fallback
    const { data: source } = await adminClient
      .from("data_sources")
      .select("id")
      .eq("code", "user_crowdsource")
      .maybeSingle();

    const sourceId = source?.id ?? null;

    // 2. Lookup existing live benchmark
    const { data: currentBenchmark } = await adminClient
      .from("expense_benchmarks")
      .select("value_minor_units")
      .eq("city_id", city_id)
      .eq("category_code", category_code)
      .eq("currency_code", currency_code)
      .maybeSingle();

    let percentageDelta: number | null = null;
    if (currentBenchmark && currentBenchmark.value_minor_units > 0) {
      const cur = Number(currentBenchmark.value_minor_units);
      const proposed = Number(valueMinorUnits);
      percentageDelta = Number((((proposed - cur) / cur) * 100).toFixed(2));
    }

    // 3. Staging proposal
    const status = allowDirectUpdate ? "approved" : "pending";
    const proposalPayload: any = {
      city_id,
      category_code,
      proposed_value_minor_units: valueMinorUnits.toString(),
      currency_code,
      percentage_delta_vs_current: percentageDelta,
      confidence_score: 0.80,
      source_url: "https://compare.t-agung.id/user-correction",
      rationale: `User correction by ${user_identifier || "anonymous"}: ${note || "Price adjusted by local resident/user"}.`,
      status,
      reviewed_at: allowDirectUpdate ? now : null,
    };

    if (sourceId) {
      proposalPayload.source_id = sourceId;
    }

    const { data: proposal, error: proposalErr } = await adminClient
      .from("data_change_proposals")
      .insert(proposalPayload)
      .select()
      .maybeSingle();

    // 4. If direct updates enabled, update live expense_benchmarks immediately
    let liveUpdated = false;
    if (allowDirectUpdate) {
      const benchmarkPayload: any = {
        city_id,
        category_code,
        value_minor_units: valueMinorUnits.toString(),
        currency_code,
        confidence_level: "medium",
        last_verified_at: now,
      };
      if (sourceId) benchmarkPayload.source_id = sourceId;

      const { error: benchmarkErr } = await adminClient
        .from("expense_benchmarks")
        .upsert(benchmarkPayload, { onConflict: "city_id,category_code,currency_code" });

      if (!benchmarkErr) {
        liveUpdated = true;
        // Audit log
        await adminClient.from("audit_logs").insert({
          action: "USER_CORRECT_BENCHMARK",
          entity_type: "expense_benchmarks",
          entity_id: city_id,
          new_values: {
            category_code,
            value_minor_units: valueMinorUnits.toString(),
            currency_code,
            corrected_by: user_identifier || "anonymous",
            note,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: liveUpdated
        ? "Koreksi harga berhasil disimpan dan langsung diperbarui di database!"
        : "Koreksi harga berhasil dikirimkan ke antrean peninjauan.",
      category_code,
      corrected_value_major,
      value_minor_units: valueMinorUnits.toString(),
      currency_code,
      status,
      live_reflected: liveUpdated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
