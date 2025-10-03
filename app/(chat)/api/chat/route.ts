// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { streamText, convertToModelMessages } from "ai";
import { KIM_AGENT_SYSTEM } from "@/lib/kim-agent-promt";
import { getModel } from "@/lib/ai/models";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    // body forventes á la { messages: [...] }
    const { messages = [] } = await req.json();
    const model = getModel(); // returnerer dit standard sprogmodel-objekt

    const result = await streamText({
      model,
      system: KIM_AGENT_SYSTEM,
      messages: convertToModelMessages(messages),
    });

    // ⬇ vigtig: brug text-stream respons-typen som din UI forstår
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json({ error: "Chat server error." }, { status: 500 });
  }
}
