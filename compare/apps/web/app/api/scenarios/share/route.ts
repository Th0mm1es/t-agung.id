import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { generateToken, hashKey } from "@bandinghidup/core";

const ShareInputSchema = z.object({
  scenarioResult: z.any(), // ScenarioResult payload
});

export async function POST(req: NextRequest) {
  try {
    const client = supabase as any;
    const body = await req.json();
    const parsed = ShareInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid share payload" }, { status: 400 });
    }

    const { scenarioResult } = parsed.data;
    if (!scenarioResult || !scenarioResult.input) {
      return NextResponse.json({ error: "Invalid scenario data" }, { status: 400 });
    }

    // 1. Generate high-entropy 16-char token and 32-char revocation key
    const token = `s_${generateToken(16)}`;
    const revocationKey = `rev_${generateToken(32)}`;
    const revocationKeyHash = hashKey(revocationKey);

    // 2. Redact / sanitize any custom input text
    const sanitizedSnapshot = {
      ...scenarioResult,
      input: {
        ...scenarioResult.input,
        scenarioLabel: undefined, // Strip custom user labels for privacy
      },
    };

    // 3. Save to shared_scenarios
    const { error: insertErr } = await client.from("shared_scenarios").insert({
      id: token,
      revocation_key_hash: revocationKeyHash,
      country_code: scenarioResult.input.country,
      city_id: scenarioResult.input.cityId,
      pathway_code: scenarioResult.input.pathway,
      scenario_snapshot: sanitizedSnapshot,
      views_count: 0,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });

    if (insertErr) {
      return NextResponse.json({ error: "Failed to create share link", details: insertErr.message }, { status: 500 });
    }

    const rawDomain = process.env["NEXT_PUBLIC_APP_DOMAIN"] || "compare.t-agung.id";
    const cleanDomain = rawDomain.replace(/^https?:\/\//, "");

    return NextResponse.json({
      token,
      revocationKey,
      shareUrl: `https://${cleanDomain}/s/${token}`,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
