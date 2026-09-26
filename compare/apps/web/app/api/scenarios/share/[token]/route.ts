import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifyKeyHash } from "@bandinghidup/core";

interface Context {
  params: { token: string };
}

// GET /api/scenarios/share/[token]
export async function GET(_req: NextRequest, { params }: Context) {
  try {
    const client = supabase as any;
    const { token } = params;

    const { data: shared, error } = await client
      .from("shared_scenarios")
      .select("*")
      .eq("id", token)
      .maybeSingle();

    if (error || !shared) {
      return NextResponse.json({ error: "Shared scenario not found or link has been revoked" }, { status: 404 });
    }

    // Check expiration
    if (shared.expires_at && new Date(shared.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "Shared scenario link has expired" }, { status: 410 });
    }

    // Increment views_count asynchronously
    await client
      .from("shared_scenarios")
      .update({ views_count: (shared.views_count || 0) + 1 })
      .eq("id", token);

    return NextResponse.json({ shared });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/scenarios/share/[token] (Revocation endpoint)
export async function DELETE(req: NextRequest, { params }: Context) {
  try {
    const client = supabase as any;
    const { token } = params;
    const body = await req.json();

    const revocationKey = body.revocationKey ?? body.revocation_key;
    if (!revocationKey) {
      return NextResponse.json({ error: "Missing revocation key" }, { status: 400 });
    }

    const { data: shared, error } = await client
      .from("shared_scenarios")
      .select("revocation_key_hash")
      .eq("id", token)
      .single();

    if (error || !shared) {
      return NextResponse.json({ error: "Shared scenario not found" }, { status: 404 });
    }

    // Verify key match
    if (!verifyKeyHash(revocationKey, shared.revocation_key_hash)) {
      return NextResponse.json({ error: "Invalid revocation key" }, { status: 403 });
    }

    // Delete record permanently
    await client.from("shared_scenarios").delete().eq("id", token);

    return NextResponse.json({ message: "Shared scenario link successfully revoked and deleted permanently" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
