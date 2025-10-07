// app/api/chat/route.ts
import { streamText } from "ai";
import { xai } from "@ai-sdk/xai";
import { KIM_AGENT_SYSTEM } from "@/lib/kim/profile";

export const runtime = "edge";

/**
 * Valgfri debug: /api/chat?mode=json
 * POST body: { "message": "ping" }
 * Retunerer echo-JSON, så vi hurtigt kan se at endpointet svarer.
 */
function isJsonDebug(url: URL) {
  return url.searchParams.get("mode") === "json";
}

export async function POST(request: Request) {
  const url = new URL(request.url);

  // Debug-mode: echo JSON hurtigt uden model
  if (isJsonDebug(url)) {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}
    return new Response(
      JSON.stringify({
        ok: true,
        handler: "POST-json",
        reply: `Echo: ${body?.message ?? "ingen besked"}`,
        received: body,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  // Rigtig chat: brug Kim-profilen som systemprompt og stream svar
  try {
    // Frontend sender normalt { messages: [...] }
    const { messages = [] } = await request.json();

    const result = await streamText({
      model: xai("grok-beta"),        // vælg din model
      system: KIM_AGENT_SYSTEM,       // <- din Kim-profil
      messages,                       // brugerens chat-historik
    });

    // ai@5.x: server-sent text stream, som UI kan læse løbende
    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[/api/chat] error:", err);
    return new Response(
      JSON.stringify({ error: "Chat server error." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/** (valgfri) GET healthcheck – fint at beholde, men ikke nødvendig for chat */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return new Response(
    JSON.stringify({
      ok: true,
      handler: "GET",
      path: url.pathname + url.search,
      note: "healthcheck",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "x-handler": "get",
      },
    }
  );
}
