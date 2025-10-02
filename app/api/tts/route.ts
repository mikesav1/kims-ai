// app/api/tts/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // 👉 kald ElevenLabs API (her skal du indsætte din API-key i .env)
    const r = await fetch("https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVEN_API_KEY as string,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
        },
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    // ElevenLabs returnerer en lydfil som binary → send videre
    const audio = await r.arrayBuffer();

    return new NextResponse(audio, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
