// app/api/chat/route.ts
export const runtime = "edge";

export async function POST(request: Request) {
  let body: any = {};
  try { body = await request.json(); } catch {}

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const last = messages[messages.length - 1]?.content ?? "(ingen besked)";

  const reply = `Hej Kim – jeg modtog: “${last}” 👍`;

  return new Response(
    JSON.stringify({
      ok: true,
      reply,
      received: body,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
