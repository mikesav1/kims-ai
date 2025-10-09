// app/api/chat/route.ts
export const runtime = "edge";

import { createUIMessageStream } from "ai";

// Hjælper til at hente sidste bruger-tekst (uanset om du sender den som messages[] eller message.parts)
function pickLastUserText(body: any): string {
  const fromList =
    Array.isArray(body?.messages) && body.messages.length > 0
      ? String(body.messages.at(-1)?.content ?? "")
      : "";

  const fromParts =
    typeof body?.message === "object" && Array.isArray(body?.message?.parts)
      ? body.message.parts
          .map((p: any) => (p?.type === "text" ? p.text : ""))
          .join(" ")
          .trim()
      : "";

  return (fromList || fromParts || "").trim();
}

export async function POST(req: Request) {
  let json: any = {};
  try { json = await req.json(); } catch {}

  const last = pickLastUserText(json);
  const id =
    (globalThis as any).crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2);

  const stream = createUIMessageStream({
    // VIGTIGT: Vi SKAL skrive mindst: start -> text-start -> text-delta -> text-end -> finish
    async execute({ writer }) {
      await writer.write({ type: "start" });
      await writer.write({ type: "text-start", id });

      await writer.write({
        type: "text-delta",
        id,
        delta: "Hej! Jeg virker ✅",
      });

      if (last) {
        await writer.write({
          type: "text-delta",
          id,
          delta: ` – du skrev: “${last}”`,
        });
      }

      await writer.write({ type: "text-end", id });
      await writer.write({ type: "finish" });

      // Ingen writer.close() i denne SDK-version
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
