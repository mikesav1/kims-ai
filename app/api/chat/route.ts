// app/api/chat/route.ts
export const runtime = "edge";

/**
 * Simpel hjælpefunktion til at sende tekst som stream (useChat-kompatibelt)
 */
function toTextStream(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

/**
 * GET: bruges mest til hurtige test eller healthcheck
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  return new Response(
    JSON.stringify({
      ok: true,
      handler: "GET",
      path: url.pathname + url.search,
      note: "chat GET ok",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * POST: håndterer både JSON-test og streaming-svar til UI
 */
export async function POST(request: Request) {
  const url = new URL(request.url);

  // Prøv at læse JSON-body (f.eks. { message } eller { messages: [...] })
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // Ignorer fejl ved tom body
  }

  // Find sidste besked fra useChat-format
  const lastFromMessages =
    Array.isArray(body?.messages) ? body.messages.at(-1)?.content ?? "" : "";
  const message = body?.message ?? lastFromMessages ?? "";

  /**
   * JSON-debug mode:
   * Kan testes fra browser console: fetch("/api/chat?mode=json", {...})
   */
  if (url.searchParams.get("mode") === "json") {
    return new Response(
      JSON.stringify({
        ok: true,
        handler: "POST-json",
        reply: `Echo: ${message || "ingen besked"}`,
        received: body,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  /**
   * STREAM-mode (bruges af selve UI’et)
   */
  const reply =
    `Hej! Jeg er Kim-agenten og jeg virker 👍\n` +
    (message ? `Du skrev: “${message}”\n\n` : ``) +
    `• Dette svar sendes som en tekst-stream.\n` +
    `• Næste trin er at koble Kim-profilen og en model på.`;

  return new Response(toTextStream(reply), {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
