// app/api/chat/route.ts
export const runtime = "edge";

/** Lille uid-helper uden 'crypto' import */
function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return Math.random().toString(36).slice(2);
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
  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  // find sidste brugerbesked (understøtter både {content} og {parts:[{type:'text'}]})
  const msgs = Array.isArray(body?.messages) ? body.messages : [];
  const last =
    msgs.at(-1)?.content ??
    msgs.at(-1)?.parts?.find((p: any) => p?.type === "text")?.text ??
    "(ingen besked)";

  const replyText = `Hej Kim – jeg virker nu ✅
Du skrev: “${last}”`;

  const encoder = new TextEncoder();

  // Rå SSE: send præcis de events useChat forventer
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data?: unknown) => {
        let payload = `event: ${event}\n`;
        if (data !== undefined) {
          payload += `data: ${JSON.stringify(data)}\n`;
        }
        payload += `\n`;
        controller.enqueue(encoder.encode(payload));
      };

      // 1) send selve svaret
      send("data-appendMessage", {
        id: uid(),
        role: "assistant",
        parts: [{ type: "text", text: replyText }],
        createdAt: new Date().toISOString(),
      });

      // 2) signalér at vi er færdige (meget vigtigt – ellers venter UI’et!)
      send("data-done");

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
