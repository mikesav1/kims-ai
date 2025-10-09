// app/api/chat/route.ts
export async function POST(request: Request) {
  let body: any = {};
  try { body = await request.json(); } catch {}

  const url = new URL(request.url);
  const mode = body?.mode ?? url.searchParams.get("mode");

  // DEBUG JSON mode: svarer bare med tekst
  if (mode === "json") {
    const last =
      Array.isArray(body?.messages) && body.messages.length
        ? body.messages.at(-1)?.content ?? ""
        : body?.message?.parts?.[0]?.text ?? "";

    return Response.json({
      ok: true,
      handler: "POST-json",
      reply: last
        ? `Echo: ${last}`
        : "Hej! (debug) – sendte du ingen tekst?",
      received: body,
    });
  }

  // (Evt. behold dit gamle streaming-svar her, men det bruger vi ikke lige nu)
  return Response.json({ ok: true, note: "chat endpoint alive" });
}
