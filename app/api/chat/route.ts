// app/api/chat/route.ts
export const runtime = "edge";

import { createUIMessageStream, JsonToSseTransformStream } from "ai";

// Helper til unikke ID’er (uden at bruge 'crypto' pakken)
function uid() {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
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

  // Brug sidste besked som input
  const msgs = Array.isArray(body?.messages) ? body.messages : [];
  const lastContent =
    msgs.at(-1)?.content ??
    msgs.at(-1)?.parts?.find((p: any) => p?.type === "text")?.text ??
    "(ingen besked)";

  const reply = `Hej Kim – jeg virker nu ✅\nDu skrev: “${lastContent}”`;

  // Opret UI-kompatibelt stream
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      // Send et svar som useChat forstår
      writer.write({
        type: "data-appendMessage",
        data: JSON.stringify({
          id: uid(),
          role: "assistant",
          parts: [{ type: "text", text: reply }],
          createdAt: new Date().toISOString(),
        }),
      });

      // ✅ Korrekt afslutning af streamen
      writer.done();
    },
  });

  // Returnér streamen i SSE-format
  return new Response(
    stream.pipeThrough(new JsonToSseTransformStream()),
    {
      status: 200,
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    }
  );
}
