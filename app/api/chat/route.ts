// app/api/chat/route.ts
export const runtime = "edge";

type InMsg = { role: "user" | "assistant" | "system"; content: string };

function readText(body: any): { lastText: string; all: InMsg[] } {
  const list: InMsg[] = Array.isArray(body?.messages) ? body.messages : [];
  const cleaned: InMsg[] = list
    .filter((m) => m && typeof m.role === "string")
    .map((m) => ({
      role: m.role as InMsg["role"],
      content: (m.content ?? "").toString(),
    }));
  const lastText = cleaned.at(-1)?.content ?? "";
  return { lastText, all: cleaned };
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Læs sidste bruger-besked (til demo-svar)
  const { lastText } = readText(body);
  const reply =
    lastText && lastText.trim()
      ? `Hej! Du skrev: “${lastText.trim()}”. Her er et streamsvar.`
      : "Hej! Skriv et spørgsmål – jeg svarer i en stream.";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // lille “typing”-fornemmelse
      const chunks = reply.split(/(\s+)/).filter(Boolean);

      // AI SDK’s transport kan forstå en simpel “text-delta” + “final”
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "assistant-start" })}\n\n`
        )
      );

      let i = 0;
      const tick = () => {
        if (i >= chunks.length) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "final" })}\n\n`
            )
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "text-delta",
              textDelta: chunks[i],
            })}\n\n`
          )
        );

        i += 1;
        setTimeout(tick, 40);
      };

      tick();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

// (valgfrit) En simpel GET – hjælper i DevTools, hvis du vil sanity-tjekke endpointet
export async function GET() {
  return new Response(
    JSON.stringify({ ok: true, note: "chat endpoint alive (GET)" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
