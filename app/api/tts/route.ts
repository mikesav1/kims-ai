import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVEN_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVEN_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: process.env.ELEVEN_MODEL_ID || "eleven_multilingual_v2",
        }),
      }
    );

    if (!r.ok) {
      const error = await r.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    const arrayBuffer = await r.arrayBuffer();

    return new Response(Buffer.from(arrayBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}
