// app/api/chat/route.ts
export async function POST(request: Request) {
  const url = new URL(request.url);

  // Debug-mode: /api/chat?mode=json
  if (url.searchParams.get("mode") === "json") {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}
    return Response.json({
      ok: true,
      reply: `Echo: ${body?.message ?? "ingen besked"}`,
      received: body,
    });
  }

  // Standard-svar (midlertidigt)
  return Response.json({ ok: true, note: "chat endpoint alive" });
}
