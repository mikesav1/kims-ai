// app/api/chat/route.ts
export const runtime = "edge";

type IncomingPart = { type: string; text?: string };
type IncomingMsg =
  | { role: string; parts?: IncomingPart[] }
  | { role: string; content?: string }; // fallback, hvis nogen sender content:string

function pickLastUserText(body: any): string {
  // 1) Hvis frontend har sendt den serialiserede liste:
  if (Array.isArray(body?.messages) && body.messages.length) {
    const last = body.messages[body.messages.length - 1];
    const text =
      (last?.content as string) ??
      ((last?.parts || [])
        .map((p: IncomingPart) => (p?.type === "text" ? p.text || "" : ""))
        .join(" ")
        .trim());
    if (typeof text === "string" && text.length) return text;
  }

  // 2) Hvis frontend (eller noget ældre kode) har sendt "message" i din gamle form:
  const m = body?.message as IncomingMsg | undefined;
  if (m) {
    const fromParts =
      (m as any)?.parts
        ?.map((p: IncomingPart) => (p?.type === "text" ? p.text || "" : ""))
        .join(" ")
        .trim() || "";
    const fromContent = (m as any)?.content || "";
    const text = (fromParts || fromContent || "").trim();
    if (text) return text;
  }

  return "";
}

function uuid() {
  // Kører fint på edge (Web Crypto API)
  return crypto.randomUUID();
}

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
    // tomt body er ok
  }

  // Vi tvinger JSON-svar (matcher din frontend, der sender x-debug + mode=json)
  const userText = pickLastUserText(body);
  const reply =
    userText && userText.length
      ? `Hej! Jeg hørte: “${userText}”. Jeg virker ✅`
      : "Hej! Jeg virker ✅ – sig noget, så svarer jeg.";

  // Form som DefaultChatTransport kan læse uden streaming:
  const msg = {
    id: uuid(),
    role: "assistant",
    parts: [{ type: "text", text: reply }],
  };

  return Response.json({ messages: [msg] }, { status: 200 });
}
