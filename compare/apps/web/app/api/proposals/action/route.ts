import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const ActionInputSchema = z.object({
  proposal_id: z.string().uuid(),
  action: z.enum(["approve", "reject"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ActionInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid action payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { proposal_id, action } = parsed.data;
    const client = supabase as any;

    // 1. Fetch proposal
    const { data: proposal, error: fetchErr } = await client
      .from("data_change_proposals")
      .select("*")
      .eq("id", proposal_id)
      .single();

    if (fetchErr || !proposal) {
      return NextResponse.json(
        { error: `Proposal '${proposal_id}' not found` },
        { status: 404 }
      );
    }

    if (proposal.status !== "pending") {
      return NextResponse.json(
        { error: `Proposal is already '${proposal.status}'` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      // Upsert into expense_benchmarks
      const { error: upsertErr } = await client
        .from("expense_benchmarks")
        .upsert(
          {
            city_id: proposal.city_id,
            category_code: proposal.category_code,
            value_minor_units: proposal.proposed_value_minor_units,
            currency_code: proposal.currency_code,
            confidence_level: proposal.confidence_score >= 0.8 ? "high" : "medium",
            source_id: proposal.source_id,
            source_url: proposal.source_url,
            last_verified_at: now,
          },
          { onConflict: "city_id,category_code,currency_code" }
        );

      if (upsertErr) {
        return NextResponse.json(
          { error: "Failed to update live benchmark", details: upsertErr.message },
          { status: 500 }
        );
      }

      // Update proposal status
      await client
        .from("data_change_proposals")
        .update({ status: "approved", reviewed_at: now })
        .eq("id", proposal_id);

      // Log in audit_logs
      await client.from("audit_logs").insert({
        action: "APPROVE_PROPOSAL",
        entity_type: "expense_benchmarks",
        entity_id: proposal_id,
        new_values: {
          city_id: proposal.city_id,
          category_code: proposal.category_code,
          value_minor_units: proposal.proposed_value_minor_units,
        },
      });

      return NextResponse.json({
        message: "Proposal approved successfully and benchmark updated",
        proposal_id,
        status: "approved",
      });
    }

    if (action === "reject") {
      // Update status to rejected
      await client
        .from("data_change_proposals")
        .update({ status: "rejected", reviewed_at: now })
        .eq("id", proposal_id);

      // Log audit
      await client.from("audit_logs").insert({
        action: "REJECT_PROPOSAL",
        entity_type: "data_change_proposals",
        entity_id: proposal_id,
      });

      return NextResponse.json({
        message: "Proposal rejected",
        proposal_id,
        status: "rejected",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
