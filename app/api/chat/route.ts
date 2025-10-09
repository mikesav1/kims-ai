// app/api/chat/route.ts
export const runtime = "edge";

// Læs evt. sidste bruger-tekst fra både messages[] eller message.parts
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

  // Manuelt UI-stream format: én JSON pr. linje
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (obj: any) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));

      // MINIMUM sekvens som useChat forventer
      send({ type: "start" });
      send({ type: "text-start", id });
      send({ type: "text-delta", id, delta: "Hej! Jeg virker ✅" });
      if (last) {
        send({ type: "text-delta", id, delta: ` – du skrev: “${last}”` });
      }
      send({ type: "text-end", id });
      send({ type: "finish" });

      controller.close();
    },
  });

  return new Response(stream, {
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
