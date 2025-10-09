// app/api/chat/route.ts
export const runtime = "edge";

import { createUIMessageStream } from "ai";

export async function POST(req: Request) {
  // Læs body og find sidste brugerbesked uanset format
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const lastFromList =
    Array.isArray(body?.messages) && body.messages.length > 0
      ? String(body.messages.at(-1)?.content ?? "")
      : "";

  const lastFromParts =
    typeof body?.message === "object" && Array.isArray(body?.message?.parts)
      ? body.message.parts
          .map((p: any) => (p?.type === "text" ? p.text : ""))
          .join(" ")
          .trim()
      : "";

  const last = (lastFromList || lastFromParts || "").trim();

  // Ét id til hele svar-beskeden (krævet for text-delta events i denne SDK)
  const msgId =
    (globalThis as any).crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2);

  const stream = createUIMessageStream({
    async execute({ writer }) {
      // 1) Start hele UI-streamen
      await writer.write({ type: "start" });

      // 2) Start tekst for denne besked
      await writer.write({ type: "text-start", id: msgId });

      // 3) Send tekst som deltas (med id)
      await writer.write({
        type: "text-delta",
        id: msgId,
        delta: "Hej! Jeg virker ✅",
      });

      if (last) {
        await writer.write({
          type: "text-delta",
          id: msgId,
          delta: ` — du skrev: “${last}”.`,
        });
      }

      // 4) Slut tekst for denne besked
      await writer.write({ type: "text-end", id: msgId });

      // 5) Slut hele UI-streamen
      await writer.write({ type: "finish" });

      // VIGTIGT: ingen writer.close() i din SDK – streamen lukkes når execute returnerer
      return;
    },
  });

  return new Response(stream as any, {
    status: 200,
    headers: {
      "Content-Type": "text/x-aiui-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function GET() {
  return Response.json({ ok: true, note: "chat UI-stream endpoint alive" });
}
