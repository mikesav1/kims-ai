// app/api/chat/route.ts
export const runtime = "edge";

import { createUIMessageStream, JsonToSseTransformStream } from "ai";

// Lille id-helper uden 'crypto' import (Edge kan ikke importere 'crypto' pakken)
function uid() {
  // globalThis.crypto.randomUUID findes i Edge runtime.
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  // fallback
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

  // useChat sender typisk { messages: [...] }
  const msgs = Array.isArray(body?.messages) ? body.messages : [];
  // prøv både {content} og {parts:[{text}]}
  const lastContent =
    msgs.at(-1)?.content ??
    msgs.at(-1)?.parts?.find((p: any) => p?.type === "text")?.text ??
    "(ingen besked)";

  const reply = `Hej Kim – jeg virker nu og ser: “${lastContent}”. ✅`;

  // Byg et UI-kompatibelt SSE-stream
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      // Send et enkelt 'assistant'-svar som din frontend forstår
      writer.write({
        type: "data-appendMessage",
        data: JSON.stringify({
          id: uid(),
          role: "assistant",
          parts: [{ type: "text", text: reply }],
          createdAt: new Date().toISOString(),
        }),
      });

      // afslut
      writer.write({ type: "data-done" });
    },
  });

  return new Response(
    stream.pipeThrough(new JsonToSseTransformStream()),
    {
      status: 200,
      headers: { "Content-Type": "text/event-stream; charset=utf-8" },
    }
  );
}
