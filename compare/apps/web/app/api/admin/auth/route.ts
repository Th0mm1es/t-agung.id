import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();

    const validPasswords = [
      process.env.ADMIN_PASSWORD,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      "bandinghidup2026",
    ].filter(Boolean);

    if (!passcode || !validPasswords.includes(passcode.trim())) {
      return NextResponse.json(
        { success: false, error: "Passcode admin salah atau tidak valid." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("bh_admin_auth", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("bh_admin_auth")?.value;
  return NextResponse.json({ authenticated: cookie === "authenticated" });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("bh_admin_auth");
  return response;
}
