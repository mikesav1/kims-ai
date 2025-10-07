cat > "app/(chat)/api/chat/route.ts" <<'TS'
export async function GET(request: Request) {
  const url = new URL(request.url);
  return new Response(JSON.stringify({
    ok: true,
    handler: "GET",
    path: url.pathname + url.search
  }), {
    status: 200,
    headers: { "Content-Type": "application/json", "x-kim-debug": "get-ok-123" }
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("mode") === "json") {
    let body: any = {};
    try { body = await request.json(); } catch {}
    return new Response(JSON.stringify({
      ok: true,
      handler: "POST-json",
      reply: `Echo: ${body?.message ?? "ingen besked"}`,
      received: body
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", "x-kim-debug": "post-json-ok-123" }
    });
  }
  return new Response(JSON.stringify({ ok: true, handler: "POST" }), {
    status: 200,
    headers: { "Content-Type": "application/json", "x-kim-debug": "post-ok-123" }
  });
}
TS

git add "app/(chat)/api/chat/route.ts"
git commit -m "fix: add GET/POST handlers to (chat) api/chat route"
git push origin main
