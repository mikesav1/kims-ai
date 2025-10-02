import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const hasKey = !!process.env.ELEVEN_API_KEY;
  const keyLength = process.env.ELEVEN_API_KEY?.length || 0;

  return NextResponse.json({
    ok: true,
    hasKey,                 // true = fundet, false = mangler
    keyLength,              // længden på nøglen, ikke selve nøglen
    provider: process.env.TTS_PROVIDER || "not set",
  });
}
