// app/api/chat/route.ts
import { createUIMessageStream, JsonToSseTransformStream } from "ai";
import { randomUUID } from "crypto";

export const runtime = "edge";

function pickUserText(body: any): string {
  // 1) Vores nye client sender en serialiseret liste: [{role, content}]
  if (Array.isArray(body?.messages) && body.messages.length) {
    const last = body.messages[body.messages.length - 1];
    if (typeof last?.content === "string") return last.content;
  }

  // 2) Faldbak: gammel form med { message: { parts:[{type:"text",text:"..."}] } }
  const parts = body?.message?.parts;
  if (Array.isArray(parts)) {
    const txt = parts
      .filter((p: any) => p?.type === "text" && typeof p?.text === "string")
      .map((p: any) => p.text)
      .join(" ")
      .trim();
    if (txt) return txt;
  }

  // 3) Sidste faldbak: hvis der kom en flad `message`
  if (typeof body?.message === "string") return body.message;

  return "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return new Response(
    JSON.stringify({
      ok: true,
      handler: "GET",
      path: url.pathname + url.search,
      note: "chat GET ok",
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {}

  const userText = pickUserText(body);
  const reply =
    `Hej! Jeg er Kim-agenten og jeg virker 👍\n` +
    (userText ? `Du skrev: “${userText}”\n\n` : "\n") +
    `• Dette svar sendes som en UI-stream (som useChat forventer).\n` +
    `• Næste trin: koble Kim-profil og model på.`;

  // Send en minimal UI-stream med én assistent-besked
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      const msg = {
        id: randomUUID(),
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: reply }],
        createdAt: new Date(),
        attachments: [] as any[],
        chatId: body?.id ?? randomUUID(),
      };

      // append den færdige besked til UI'et
      writer.write({
        type: "data-appendMessage",
        data: JSON.stringify(msg),
      });

      // signalér at vi er færdige
      writer.write({ type: "done" });
      writer.close();
    },
    generateId: randomUUID,
  });

  return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
    status: 200,
    headers: {
      // vigtigt for SSE
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
