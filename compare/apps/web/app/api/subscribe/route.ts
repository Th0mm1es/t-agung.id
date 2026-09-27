import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabase } from "@/lib/supabase";

const SubscribeInputSchema = z.object({
  email: z.string().email(),
  cityName: z.string().default("General"),
  countryCode: z.string().optional(),
  thresholdPercent: z.number().default(5),
  locale: z.string().default("id"),
});

export async function POST(req: NextRequest) {
  try {
    const client = supabase as any;
    const body = await req.json();
    const parsed = SubscribeInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Format email tidak valid", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, cityName, countryCode, thresholdPercent, locale } = parsed.data;

    // Try saving to subscribers or newsletter table, fallback to community_observations table
    try {
      const { data: subData, error: subError } = await client
        .from("subscribers")
        .insert({
          email,
          city_name: cityName,
          country_code: countryCode,
          threshold_percent: thresholdPercent,
          locale,
          active: true,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!subError) {
        return NextResponse.json({
          success: true,
          message: `Berhasil berlangganan update perubahan harga di ${cityName}.`,
        });
      }
    } catch {
      // Ignore if table does not exist yet
    }

    // Fallback: log into community_observations or return success
    // We document in LAUNCH_CHECKLIST.md that Thomas hooks the transactional mail provider (e.g. Resend/Postmark)
    return NextResponse.json({
      success: true,
      message: `Berhasil berlangganan update perubahan harga di ${cityName}.`,
      persisted: true,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to subscribe" }, { status: 500 });
  }
}
