// app/api/chat/route.ts
export const runtime = "edge";

import { createUIMessageStream } from "ai";

export async function POST(req: Request) {
  // Læs body sikkert
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Træk sidste brugerbesked ud (både fra messages[] og message.parts)
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

  // ⬇️ Din SDK kræver et argument → giv et tomt options-objekt
  const stream = createUIMessageStream({});
  const writer = stream.getWriter();

  (async () => {
    // Start én assistent-besked
    await writer.write({
      type: "assistant-message",
      id: crypto.randomUUID(),
      role: "assistant",
    });

    // Deltas (UI bygger teksten løbende)
    await writer.write({ type: "assistant-text-delta", text: "Hej! " });
    await writer.write({ type: "assistant-text-delta", text: "Jeg virker ✅" });

    if (last) {
      await writer.write({
        type: "assistant-text-delta",
        text: ` — du skrev: “${last}”.`,
      });
    }

    // Afslut beskeden
    await writer.write({ type: "assistant-message-finished" });

    // (valgfrit) metadata
    await writer.write({ type: "data", data: { ok: true } });

    // Signalér at streamen er helt færdig
    await writer.write({ type: "data-done" });

    // Luk streamen (ellers hænger UI’et på “Please wait…”)
    await writer.close();
  })();

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
