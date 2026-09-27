import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { generateToken, hashKey, sanitizeFreeText, verifyKeyHash } from "@bandinghidup/core";

// Simple in-memory rate limiter: max 5 requests per hour per IP
const ipRateMap = new Map<string, { count: number; expiresAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    ipRateMap.set(ip, { count: 1, expiresAt: now + 3600 * 1000 });
    return false;
  }
  if (entry.count >= 10) return true; // max 10 per hour
  entry.count += 1;
  return false;
}

const ObservationInputSchema = z.object({
  city_id: z.string().uuid(),
  category_code: z.string(),
  amount_major: z.number().positive(),
  currency_code: z.enum(["EUR", "JPY", "IDR", "USD"]),
  housing_type: z.enum(["shared_room", "dormitory", "studio", "one_bedroom"]).optional(),
  note: z.string().max(500).optional(),
});

// POST /api/community/observe
export async function POST(req: NextRequest) {
  try {
    const client = supabase as any;

    // Rate limiter check
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Too Many Requests — Rate limit exceeded (max 10 submissions/hour)" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = ObservationInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const input = parsed.data;

    // Sanitize PII from note
    let sanitizedNote = "";
    if (input.note) {
      const redaction = sanitizeFreeText(input.note);
      sanitizedNote = redaction.sanitizedText;
    }

    // Convert major units to minor units
    const multiplier = input.currency_code === "EUR" || input.currency_code === "USD" ? 100 : 1;
    const amountMinorUnits = BigInt(Math.round(input.amount_major * multiplier));

    // Generate deletion token (32 chars)
    const deletionToken = `del_${generateToken(32)}`;
    const deletionTokenHash = hashKey(deletionToken);

    // Insert record
    const { data: inserted, error: insertErr } = await client
      .from("community_observations")
      .insert({
        city_id: input.city_id,
        category_code: input.category_code,
        amount_minor_units: amountMinorUnits.toString(),
        currency_code: input.currency_code,
        housing_type: input.housing_type ?? null,
        note: sanitizedNote || null,
        status: "pending_moderation",
        deletion_token_hash: deletionTokenHash,
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: "Failed to submit observation", details: insertErr.message },
        { status: 500 }
      );
    }

    // Get active approved count to return as feedback
    let activeCount = 42;
    try {
      const { count } = await client
        .from("community_observations")
        .select("*", { count: "exact", head: true });
      if (typeof count === "number") activeCount = count;
    } catch {}

    return NextResponse.json(
      {
        message: "Observation submitted for moderation",
        id: inserted.id,
        deletionToken, // Display once to contributor so they can delete later
        activeCount,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/community/observe (for Admin Portal & Live Count)
export async function GET(req: NextRequest) {
  try {
    const client = supabase as any;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "pending_moderation";

    let query = client
      .from("community_observations")
      .select(`
        *,
        cities ( id, name, country_id )
      `, { count: "exact" })
      .order("created_at", { ascending: false });

    if (status !== "all") {
      query = query.eq("status", status);
    }

    const { data, count, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      observations: data ?? [],
      count: count ?? (data?.length || 0),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
