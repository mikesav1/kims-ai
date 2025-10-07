// app/api/chat/route.ts
export const runtime = "edge";

function safeJsonParse(input: string | null) {
  if (!input) return {};
  try { return JSON.parse(input); } catch { return {}; }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return new Response(
    JSON.stringify({
      ok: true,
      handler: "GET",
      path: url.pathname + url.search,
      note: "chat GET ok",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const wantJson =
    url.searchParams.get("mode") === "json" ||
    request.headers.get("x-debug") === "json" ||
    request.headers.get("x-kim-debug") === "json";

  let body: any = {};
  try { body = await request.json(); } catch {}

  // Brug enten useChat-format (messages[])
  // eller en enkel { message: "..." }
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const lastUser =
    messages.length > 0
      ? messages[messages.length - 1]?.content ?? ""
      : body?.message ?? "";

  if (wantJson) {
    return new Response(
      JSON.stringify({
        ok: true,
        handler: "POST-json",
        reply: `Echo: ${lastUser || "ingen besked"}`,
        received: body,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // --- SSE stream som din UI forventer ---
  const reply =
    `Hej! Jeg er Kim-agenten og jeg virker 👍\n` +
    (lastUser ? `Du skrev: “${lastUser}”\n\n` : `\n`) +
    `• Dette svar sendes som SSE (assistant:final)\n` +
    `• Næste trin er at koble Kim-profilen og modellen på.`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1) Selve assistantsvaret (det UI’et opfanger)
      const assistantEvent =
        `event: assistant:final\n` +
        `data: ${JSON.stringify({
          id: crypto.randomUUID(),
          role: "assistant",
          content: reply,
        })}\n\n`;
      controller.enqueue(encoder.encode(assistantEvent));

      // (valgfrit) 2) Usage/data
      const usageEvent =
        `event: data-usage\n` +
        `data: ${JSON.stringify({ modelId: "stub", tokens: 0 })}\n\n`;
      controller.enqueue(encoder.encode(usageEvent));

      // 3) Luk stream pænt
      const closeEvent = `event: close\ndata: {}\n\n`;
      controller.enqueue(encoder.encode(closeEvent));

      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
