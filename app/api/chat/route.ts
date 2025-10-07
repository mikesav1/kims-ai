// app/api/chat/route.ts
export const runtime = "edge";

type UIMessage = {
  role: "user" | "assistant" | "system";
  content?: string; // hvis du bruger 'content' (plain useChat)
  parts?: Array<{ type: "text"; text: string }>; // hvis du bruger 'parts'
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  return Response.json(
    {
      ok: true,
      handler: "GET",
      path: url.pathname + url.search,
      note: "chat GET ok",
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // ignore
  }

  // 🔴 TVING JSON-MODE når vi beder om det fra UI (via header eller body)
  const wantsJson =
    request.headers.get("x-debug") === "json" || body?.mode === "json";

  if (wantsJson) {
    // prøv at udlede sidste brugerbesked (understøtter både 'messages[].content' og 'message.parts[0].text')
    const lastFromMessagesContent =
      Array.isArray(body?.messages) && body.messages.length
        ? (body.messages as UIMessage[]).at(-1)?.content ?? ""
        : "";

    const lastFromMessageParts =
      body?.message?.parts?.[0]?.text ??
      body?.messages?.at?.(-1)?.parts?.[0]?.text ??
      "";

    const last = lastFromMessagesContent || lastFromMessageParts || "";

    return Response.json(
      {
        ok: true,
        handler: "POST-json",
        reply: last ? `Echo: ${last}` : "Echo: (ingen besked)",
        received: body,
      },
      { status: 200 }
    );
  }

  // 🟡 Her kan din rigtige stream-løsning ligge senere.
  // Mens vi fejlsøger UI, holder vi os til JSON-svar:
  return Response.json(
    {
      ok: true,
      note: "chat endpoint alive (stream midlertidigt slået fra)",
    },
    { status: 200 }
  );
}
