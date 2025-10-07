import { streamText } from "ai";
import { xai } from "@ai-sdk/xai";
// Hvis du har en systemprompt:
import { KIM_AGENT_SYSTEM } from "@/lib/kim-agent-promt"; // ellers sæt en kort streng direkte

export async function POST(request: Request) {
  const url = new URL(request.url);

  // Debug-mode: /api/chat?mode=json
  if (url.searchParams.get("mode") === "json") {
    let body: any = {};
    try { body = await request.json(); } catch {}
    return new Response(JSON.stringify({
      ok: true,
      handler: "POST-json",
      reply: `Echo: ${body?.message ?? "ingen besked"}`,
      received: body
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "x-kim-debug": "post-json-ok-123" }
    });
  }

  // Normal chat (stream)
  const { messages = [] } = await request.json();

  const result = await streamText({
    model: xai("grok-beta"),        // eller xai("grok-2-latest") alt efter hvad du har
    system: KIM_AGENT_SYSTEM ?? "Svar på dansk og hjælp Kim kort og konkret.",
    messages                       // forventer samme struktur som din chat-frontend sender
  });

  // ai@v5: send som textstream (frontend kan konsumere som SSE / tekstchunks)
  return result.toTextStreamResponse();
}
