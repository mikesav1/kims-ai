import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/tts" });
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    return NextResponse.json({ ok: true, message: `Modtog: ${text}` });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "unknown" }, { status: 400 });
  }
}
