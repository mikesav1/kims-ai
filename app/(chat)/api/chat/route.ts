// app/(chat)/api/chat/route.ts
import { streamText } from "ai";
// Brug én af disse to afhængigt af dit projekt.
// A) Hvis du har en getModel() i "@/lib/ai/models":
// import { getModel } from "@/lib/ai/models";

// B) Ellers brug xAI direkte (kræver XAI_API_KEY i env):
import { xai } from "@ai-sdk/xai";

import { KIM_AGENT_SYSTEM } from "@/lib/kim/profile";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages = [] } = await req.json();

    // Vælg model:
    // A) Hvis du har en getModel():
    // const model = getModel();

    // B) Ellers xAI direkte:
    const model = xai("grok-beta");

    const result = await streamText({
      model,
      system: KIM_AGENT_SYSTEM,
      messages,
    });

    // AI SDK v5: brug tekst-stream svar
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return new Response(
      JSON.stringify({ error: "Chat server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
