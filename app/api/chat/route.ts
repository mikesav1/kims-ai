// app/api/chat/route.ts
export const runtime = "edge";

import { createUIMessageStream } from "ai";

export async function POST(req: Request) {
  // ——— Parse body og find sidste brugerbesked ————————————————
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

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

  // ——— Opret UI-stream med kun de godkendte event-typer ——————————
  const stream = createUIMessageStream({
    async execute({ writer }) {
      // 1) signalér start (nogle UI’er viser status-spinner på "start")
      await writer.write({ type: "start" });

      // 2) send tekst som deltas
      await writer.write({ type: "text-delta", text: "Hej! Jeg virker ✅" });
      if (last) {
        await writer.write({
          type: "text-delta",
          text: ` — du skrev: “${last}”.`,
        });
      }

      // 3) afslut tekst
      await writer.write({ type: "text-end" });

      // 4) og afslut hele svaret
      await writer.write({ type: "finish" });

      // Luk streamen (ellers hænger UI’et på “Please wait…”)
      await writer.close();
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
