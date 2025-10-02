// app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/tts",
    provider: (process.env.TTS_PROVIDER || "openai").toLowerCase(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new NextResponse("Missing 'text' (string)", { status: 400 });
    }

    const provider = (process.env.TTS_PROVIDER || "openai").toLowerCase();

    // ---------- ELEVENLABS ----------
    if (provider === "eleven") {
      const apiKey  = process.env.ELEVEN_API_KEY;
      const voiceId = process.env.ELEVEN_VOICE_ID;
      const modelId = process.env.ELEVEN_MODEL_ID || "eleven_multilingual_v2";
      if (!apiKey || !voiceId) return new NextResponse("Missing ELEVEN_API_KEY or ELEVEN_VOICE_ID", { status: 500 });

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
        const err = await resp.text().catch(() => "no body");
        return new NextResponse(`ElevenLabs TTS error: ${err}`, { status: 500 });
      }

      return new NextResponse(resp.body, {
        status: 200,
        headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
      });
    }

    // ---------- OPENAI (fallback / standard) ----------
    const openaiKey = process.env.OPENAI_API_KEY;
    const openaiVoice = process.env.OPENAI_TTS_VOICE || "alloy";
    if (!openaiKey) return new NextResponse("Missing OPENAI_API_KEY", { status: 500 });

    const resp = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o-mini-tts", input: text, voice: openaiVoice, format: "mp3" }),
    });

    if (!resp.ok || !resp.body) {
      const err = await resp.text().catch(() => "no body");
      return new NextResponse(`OpenAI TTS error: ${err}`, { status: 500 });
    }

    return new NextResponse(resp.body, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return new NextResponse(`TTS exception: ${e?.message || e}`, { status: 500 });
  }
}
