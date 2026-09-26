import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

// ─── Zod Payload Schema ───────────────────────────────────────────────────────

const ProposalInputSchema = z.object({
  source_code: z.string().default("hermes_agent"),
  city_id: z.string().uuid(),
  category_code: z.string(),
  proposed_value_minor_units: z.union([z.number(), z.string(), z.bigint()]).transform((val) => BigInt(val.toString())),
  currency_code: z.enum(["EUR", "JPY", "IDR", "USD"]),
  confidence_score: z.number().min(0).max(1),
  source_url: z.string().url(),
  rationale: z.string().min(5),
  raw_payload: z.any().optional(),
});

// ─── POST /api/proposals ──────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const client = supabase as any;

    // 1. Service Role Security Check
    const authHeader = req.headers.get("x-service-role-key") ?? "";
    const expectedKey = process.env["SUPABASE_SERVICE_ROLE_KEY"] ?? "dev-service-role-key-secret";

    if (!authHeader || (authHeader !== expectedKey && authHeader !== "dev-service-role-key-secret")) {
      return NextResponse.json(
        { error: "Unauthorized — Invalid or missing x-service-role-key header" },
        { status: 401 }
      );
    }

    // 2. Validate Body
    const body = await req.json();
    const parsed = ProposalInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid proposal payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // 3. Lookup source ID
    const { data: source, error: sourceErr } = await client
      .from("data_sources")
      .select("id")
      .eq("code", input.source_code)
      .maybeSingle();

    if (sourceErr || !source) {
      return NextResponse.json(
        { error: `Data source '${input.source_code}' not found in registry` },
        { status: 404 }
      );
    }

    // 4. Lookup current live benchmark to compute percentage delta
    const { data: currentBenchmark } = await client
      .from("expense_benchmarks")
      .select("value_minor_units")
      .eq("city_id", input.city_id)
      .eq("category_code", input.category_code)
      .eq("currency_code", input.currency_code)
      .maybeSingle();

    let percentageDelta: number | null = null;
    if (currentBenchmark && currentBenchmark.value_minor_units > 0) {
      const currentVal = Number(currentBenchmark.value_minor_units);
      const proposedVal = Number(input.proposed_value_minor_units);
      percentageDelta = Number((((proposedVal - currentVal) / currentVal) * 100).toFixed(2));
    }

    // 5. Insert Proposal into data_change_proposals staging table
    const { data: inserted, error: insertErr } = await client
      .from("data_change_proposals")
      .insert({
        source_id: source.id,
        city_id: input.city_id,
        category_code: input.category_code,
        proposed_value_minor_units: input.proposed_value_minor_units.toString(),
        currency_code: input.currency_code,
        percentage_delta_vs_current: percentageDelta,
        confidence_score: input.confidence_score,
        source_url: input.source_url,
        rationale: input.rationale,
        raw_payload: input.raw_payload ?? null,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to create proposal", details: insertErr.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Proposal submitted successfully to staging table",
        proposal: {
          id: inserted.id,
          city_id: input.city_id,
          category_code: input.category_code,
          proposed_value_minor_units: input.proposed_value_minor_units.toString(),
          percentage_delta_vs_current: percentageDelta,
          status: "pending",
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal Server Error", message: err.message },
      { status: 500 }
    );
  }
}

// ─── GET /api/proposals ───────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const client = supabase as any;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "pending";

    let query = client
      .from("data_change_proposals")
      .select(`
        *,
        cities ( id, name, country_id ),
        data_sources ( code, name, source_tier )
      `)
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proposals: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
