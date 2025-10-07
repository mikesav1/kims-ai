// app/api/chat/route.ts
export const runtime = "edge";

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  // GET: hvis du sætter ?mode=json, returnerer vi JSON
  if ((url.searchParams.get("mode") || "").toLowerCase() === "json") {
    return json({
      ok: true,
      handler: "GET-json",
      path: url.pathname + url.search,
      note: "chat GET ok",
    });
  }
  // Ellers bare en kort tekst
  return new Response("chat GET ok", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);

  // Prøv at læse body (tåler tom/ugyldig body)
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    /* ignore */
  }

  // Flere måder at tvinge JSON-svar:
  // 1) ?mode=json i URL
  // 2) Header: x-debug: json
  // 3) Body: { "mode": "json" }
  const modeFromQuery = (url.searchParams.get("mode") || "").toLowerCase();
  const modeFromHeader = (request.headers.get("x-debug") || "").toLowerCase();
  const modeFromBody = (String(body?.mode || "") || "").toLowerCase();

  const wantJson =
    modeFromQuery === "json" || modeFromHeader === "json" || modeFromBody === "json";

  // Simpel “echo” JSON hvis der er bedt om det
  if (wantJson) {
    const received =
      body?.message ??
      (Array.isArray(body?.messages)
        ? body.messages[body.messages.length - 1]?.content ?? ""
        : body);
    return json({
      ok: true,
      handler: "POST-json",
      reply: `Echo: ${received || "(ingen besked)"}`,
      received: body,
    });
  }

  // Ellers: stream ét svar som text/plain (for useChat / UI)
  const last =
    Array.isArray(body?.messages) && body.messages.length
      ? body.messages[body.messages.length - 1]?.content ?? ""
      : String(body?.message ?? "");

  const reply =
    `Hej! Jeg er Kim-agenten og jeg virker 👍\n` +
    `Du skrev: “${last || "(ingen besked)"}”\n\n` +
    `• Dette svar kommer som en tekst-stream (som useChat forstår).\n` +
    `• Når vi er klar, kobler vi Kim-profilen og modellen på.`;

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
