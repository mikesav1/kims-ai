// app/api/chat/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const payload = {
    ok: true,
    handler: "GET",
    path: url.pathname + url.search,
    note: "Kims debug stub",
  };
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "x-kim-debug": "get-ok-123",
      "x-handler": "get",
    },
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("mode") === "json") {
    let body: any = {};
    try { body = await request.json(); } catch {}
    const payload = {
      ok: true,
      handler: "POST-json",
      reply: `Echo: ${body?.message ?? "ingen besked"}`,
      received: body,
    };
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "x-kim-debug": "post-json-ok-123",
        "x-handler": "post-json",
      },
    });
  }

  const payload = { ok: true, handler: "POST", note: "chat endpoint alive" };
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "x-kim-debug": "post-ok-123",
      "x-handler": "post",
    },
  });
}
