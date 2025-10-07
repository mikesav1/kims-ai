// app/api/chat/route.ts
export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return new Response(
    JSON.stringify({
      ok: true,
      handler: "GET",
      path: url.pathname + url.search,
      note: "chat GET ok (edge)",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // brug Web Crypto i stedet for Node import
  const id =
    globalThis.crypto && "randomUUID" in globalThis.crypto
      ? globalThis.crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  // find sidste besked
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const last = messages[messages.length - 1]?.content ?? "";

  const reply = `Hej! Jeg er Kim-agenten og jeg virker 👍
Du skrev: “${last}”

• Dette svar kommer som en tekst-stream (Edge version).
• ID: ${id}
`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(reply));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
