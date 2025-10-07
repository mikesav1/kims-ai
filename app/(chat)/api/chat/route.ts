cd kims-ai
git switch main
cat > app/(chat)/api/chat/route.ts <<'TS'
import { streamText } from "ai";
import { xai } from "@ai-sdk/xai";

export async function POST(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("mode") === "json") {
    let body: any = {};
    try { body = await request.json(); } catch {}
    return new Response(
      JSON.stringify({
        ok: true,
        handler: "POST-json",
        reply: `Echo: ${body?.message ?? ""}`,
        received: body
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages = [] } = await request.json();

  const result = await streamText({
    model: xai("grok-beta"),
    system: "Svar på dansk, kort og konkret for Kim Vase.",
    messages
  });

  return result.toTextStreamResponse();
}
TS
