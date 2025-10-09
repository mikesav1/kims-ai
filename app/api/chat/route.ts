// app/api/chat/route.ts
export const runtime = "edge";

// Lille helper til at sende SSE-linjer
function sseLine(data: string) {
  return `data: ${data}\n\n`;
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Forsøg at finde sidste brugerbesked (både parts[] og content)
  const last =
    (Array.isArray(body?.messages) && body.messages.length > 0
      ? String(body.messages.at(-1)?.content ?? "")
      : "") ||
    (typeof body?.message === "object"
      ? (Array.isArray(body?.message?.parts)
          ? body.message.parts
              .map((p: any) => (p?.type === "text" ? p.text : ""))
              .join(" ")
              .trim()
          : "") || String(body?.message?.content ?? "")
      : "");

  const reply =
    `Hej! Jeg er på linjen og jeg virker ✅\n` +
    (last ? `Du skrev: “${last}”.\n` : "") +
    `Jeg streamer svaret via SSE (text/event-stream).`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // send i 2 små bidder for at demonstrere streaming
      controller.enqueue(encoder.encode(sseLine("Hej Kim…")));
      setTimeout(() => {
        controller.enqueue(encoder.encode(sseLine(reply)));
        // marker slut
        controller.close();
      }, 150);
    },
    cancel() {
      // no-op
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

// (Valgfri) GET kan bare svare simpelt, så /api/chat kan pinges i browser
export async function GET() {
  return Response.json({ ok: true, note: "chat endpoint (SSE POST) alive" });
}
