// app/api/chat/route.ts
export const runtime = "edge";

import { createUIMessageStream } from "ai"; // <- Vercel AI SDK UI stream

export async function POST(req: Request) {
  // Læs body (brugerbeskeder, hvis din chat sender dem)
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Find sidste brugerbesked på en robust måde (både content- og parts-formater)
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

  // Opret UI-streamen
  const { stream, writer } = createUIMessageStream();

  // Skriv svar asynkront, så vi kan returnere streamen med det samme
  (async () => {
    // Start en ny assistent-besked
    writer.write({
      type: "assistant-message",
      id: crypto.randomUUID(),
      role: "assistant",
    });

    // Tekst “deltas” (kommer løbende — UI’et bygger boblen for dig)
    writer.write({ type: "assistant-text-delta", text: "Hej! " });
    writer.write({ type: "assistant-text-delta", text: "Jeg virker ✅" });

    if (last) {
      writer.write({
        type: "assistant-text-delta",
        text: ` — du skrev: “${last}”.`,
      });
    }

    // Marker at assistentens besked er færdig
    writer.write({ type: "assistant-message-finished" });

    // (valgfrit) brug data-evt. – fint til usage osv.
    writer.write({ type: "data", data: { ok: true } });

    // VIGTIGT: sig at vi er helt færdige
    writer.write({ type: "data-done" });

    // Luk streamen (ellers forbliver UI’et i “Please wait…”)
    writer.close();
  })();

  return new Response(stream, {
    status: 200,
    headers: {
      // AI SDK tjekker denne content-type for UI-stream
      "Content-Type": "text/x-aiui-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// (valgfri) GET til ping
export async function GET() {
  return Response.json({ ok: true, note: "chat UI-stream endpoint alive" });
}
