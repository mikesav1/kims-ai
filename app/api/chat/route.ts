// app/api/chat/route.ts
export const runtime = "edge";

import { createUIMessageStream } from "ai";

export async function POST(req: Request) {
  // --- Læs og normalisér body ---------------------------------------------
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Sidste brugerbesked – understøt både messages[] og message.parts
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

  // --- Opret UI-streamen med execute({ writer }) ---------------------------
  const stream = createUIMessageStream({
    async execute({ writer }) {
      // Start én assistent-besked
      await writer.write({
        type: "assistant-message",
        id: crypto.randomUUID(),
        role: "assistant",
      });

      // Skriv løbende tekst (deltas)
      await writer.write({
        type: "assistant-text-delta",
        text: "Hej! Jeg virker ✅",
      });

      if (last) {
        await writer.write({
          type: "assistant-text-delta",
          text: ` — du skrev: “${last}”.`,
        });
      }

      // Afslut beskeden
      await writer.write({ type: "assistant-message-finished" });

      // Valgfri metadata (frontend kan lytte på 'data')
      await writer.write({ type: "data", data: { ok: true } });

      // Signalér at alt er færdigt (frontend stopper spinner)
      await writer.write({ type: "data-done" });

      // Luk streamen! (ellers hænger UI’et på “Please wait…”)
      await writer.close();
    },
  });

  // Returnér streamen til UI
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
