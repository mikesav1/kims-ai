// app/api/chat/route.ts
export const runtime = "edge";

import { createUIMessageStream } from "ai";

export async function POST(req: Request) {
  // Parse body og find sidste brugerbesked (både useChat-format og din egen)
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const lastFromList =
    Array.isArray(body?.messages) && body.messages.length > 0
      ? String(body.messages.at(-1)?.content ?? "")
      : "";

  const lastFromParts =
    typeof body?.message === "object" && Array.isArray(body?.message?.parts)
      ? body.message.parts
          .map((p: any) => (p?.type === "text" ? p.text : ""))
          .join(" ")
          .trim()
      : "";

  const last = (lastFromList || lastFromParts || "").trim();

  // Stream kun med events din SDK-version kender: start → text-delta → text-end → finish
  const stream = createUIMessageStream({
    async execute({ writer }) {
      await writer.write({ type: "start" });

      await writer.write({ type: "text-delta", delta: "Hej! Jeg virker ✅" });
      if (last) {
        await writer.write({
          type: "text-delta",
          delta: ` — du skrev: “${last}”.`,
        });
      }

      await writer.write({ type: "text-end" });
      await writer.write({ type: "finish" });

      await writer.close();
    },
  });

  return new Response(stream as any, {
    status: 200,
    headers: {
      "Content-Type": "text/x-aiui-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function GET() {
  return Response.json({ ok: true, note: "chat UI-stream endpoint alive" });
}
