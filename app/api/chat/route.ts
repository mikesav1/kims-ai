// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { streamText } from "ai";
import { KIM_AGENT_SYSTEM } from "@/lib/kim-agent-promt";
import { getModel } from "@/lib/ai/models";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages = [] } = await req.json();

    const model = getModel();

    const result = await streamText({
      model,
      system: KIM_AGENT_SYSTEM,
      messages,
    });

    // ✅ Dette er vigtigt: Brug DataStreamResponse, ikke TextStreamResponse
    return result.toTextStreamResponse();

  } catch (err) {
    console.error("[/api/chat] error:", err);
    return NextResponse.json({ error: "Chat server error." }, { status: 500 });
  }
}
