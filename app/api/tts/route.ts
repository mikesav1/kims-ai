// test: dette er en kommentar i TTS route
// Test commit for TTS route
import { NextRequest, NextResponse } from "next/server";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new NextResponse("Missing text", { status: 400 });
    }

    const apiKey = process.env.ELEVEN_API_KEY!;
    const voiceId = process.env.ELEVEN_VOICE_ID!;
    const modelId = process.env.ELEVEN_MODEL_ID || "eleven_multilingual_v2";

    if (!apiKey || !voiceId) {
      return new NextResponse("Missing ELEVEN_API_KEY or ELEVEN_VOICE_ID", { status: 500 });
    }

    const prepared = text
      .replace(/(\S)\s*([.?!])/g, "$1$2 ")
      .replace(/,\s*/g, ", ... ")
      .slice(0, 5000);

    const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: prepared,
        model_id: modelId,
        voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true },
        optimize_streaming_latency: 2,
        output_format: "mp3_44100_128",
      }),
    });

    if (!resp.ok || !resp.body) {
      const errText = await resp.text().catch(() => "no body");
      return new NextResponse(`TTS error: ${errText}`, { status: 500 });
    }

    return new NextResponse(resp.body, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return new NextResponse(`TTS exception: ${e?.message || e}`, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/tts" });
}
