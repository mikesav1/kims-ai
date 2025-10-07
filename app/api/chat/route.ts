// app/api/chat/route.ts

export async function GET(request: Request) {
  // Simpel GET-stub – bruges kun til health-check
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

export async function POST(request: Request) {
  const url = new URL(request.url);

  // Debug-mode: /api/chat?mode=json
  if (url.searchParams.get("mode") === "json") {
    let body: any = {};
    try {
      body = await request.json();
    } catch {}
    return new Response(
      JSON.stringify({
        ok: true,
        handler: "POST-json",
        reply: `Echo: ${body?.message ?? "ingen besked"}`,
        received: body,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Standard-stub (indtil vi kobler modellen på)
  return new Response(
    JSON.stringify({ ok: true, handler: "POST", note: "chat endpoint alive" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}
