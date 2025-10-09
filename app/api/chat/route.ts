// app/api/chat/route.ts
export const runtime = "edge";

import { createUIMessageStream } from "ai"; // Vercel AI SDK – UI-stream

export async function POST(req: Request) {
  // Læs body (robust, da nogle browsere sender tom body på første kald)
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Find sidste brugerbesked i både "messages" og "message.parts"
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

  // Opret UI-streamen (i din SDK-version returneres KUN streamen)
  const stream = createUIMessageStream();
  const writer = stream.getWriter(); // <- hent writer via getWriter()

  // Skriv UI-events asynkront og luk streamen korrekt
  (async () => {
    // Start en assistent-besked
    await writer.write({
      type: "assistant-message",
      id: crypto.randomUUID(),
      role: "assistant",
    });

    // Tekst-deltas (UI’et bygger boblen løbende)
    await writer.write({ type: "assistant-text-delta", text: "Hej! " });
    await writer.write({ type: "assistant-text-delta", text: "Jeg virker ✅" });

    if (last) {
      await writer.write({
        type: "assistant-text-delta",
        text: ` — du skrev: “${last}”.`,
      });
    }

    // Marker at denne assistent-besked er færdig
    await writer.write({ type: "assistant-message-finished" });

    // (valgfrit) metadata/usage
    await writer.write({ type: "data", data: { ok: true } });

    // VIGTIGT: signalér at hele streamen er færdig
    await writer.write({ type: "data-done" });

    // Luk streamen – ellers hænger UI’et med “Please wait…”
    await writer.close();
  })();

  return new Response(stream as any, {
    status: 200,
    headers: {
      // Nødvendig content-type for AI UI-stream
      "Content-Type": "text/x-aiui-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function GET() {
  return Response.json({ ok: true, note: "chat UI-stream endpoint alive" });
}
