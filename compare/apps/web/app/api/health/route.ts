import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    app: "BandingHidup",
    version: "0.0.0",
    stage: "Stage 0 — Technical Foundations",
  });
}
