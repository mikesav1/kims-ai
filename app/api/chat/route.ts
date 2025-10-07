// app/api/chat/route.ts
export const runtime = "edge";

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
  let body: any = {};
  try { body = await request.json(); } catch {}

  // find sidste brugerbesked (hvis din frontend sender useChat-format)
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const last = messages[messages.length - 1]?.content ?? "";

  const reply =
`Hej! Jeg er Kim-agenten og jeg virker 👍
Du skrev: “${last}”

• Dette svar kommer som en tekst-stream (som useChat forstår).
• Næste trin er at koble Kim-profilen og modellen på.`;

  // Stream ét svar som ren tekst (det useChat forventer)
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(reply));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
