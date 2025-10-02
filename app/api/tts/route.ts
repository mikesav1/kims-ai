// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  // lille helbredstjek
  return NextResponse.json({ ok: true, route: "/api/tts", engine: "openai:gpt-4o-mini-tts" });
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new NextResponse("Missing 'text' (string)", { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const voice = process.env.OPENAI_TTS_VOICE || "alloy"; // vælg selv: alloy, verse, breeze, …
    const format = "mp3";

    if (!apiKey) {
      return new NextResponse("Missing OPENAI_API_KEY", { status: 500 });
    }

    // kald OpenAI TTS REST endpoint (virker fint i Edge runtime)
    const resp = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        input: text,
        voice,
        format, // "mp3" | "wav" | "flac" | "aac" | "opus" …
      }),
    });

    if (!resp.ok || !resp.body) {
      const err = await resp.text().catch(() => "no body");
      return new NextResponse(`OpenAI TTS error: ${err}`, { status: 500 });
    }

    // stream MP3 tilbage til browseren
    return new NextResponse(resp.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return new NextResponse(`TTS exception: ${e?.message || e}`, { status: 500 });
  }
}
