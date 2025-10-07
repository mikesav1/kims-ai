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

function sseLine(obj: any) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { lastText } = readText(body);

  const reply =
    lastText && lastText.trim()
      ? `Hej! Du skrev: “${lastText.trim()}”. Her er et streamsvar.`
      : "Hej! Skriv et spørgsmål – jeg svarer i en stream.";

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1) signalér at assistenten starter
      controller.enqueue(
        encoder.encode(sseLine({ type: "assistant-start" }))
      );

      // 2) send “typing” med text-delta (valgfrit, men rart)
      const words = reply.split(/(\s+)/).filter(Boolean);
      let i = 0;

      const tick = () => {
        if (i >= words.length) {
          // 3a) send en fuld “assistant-message” som fallback/snapshot
          controller.enqueue(
            encoder.encode(
              sseLine({
                type: "assistant-message",
                message: {
                  id: crypto.randomUUID?.() ?? String(Date.now()),
                  role: "assistant",
                  content: [{ type: "text", text: reply }],
                },
              })
            )
          );

          // 3b) slut korrekt
          controller.enqueue(encoder.encode(sseLine({ type: "assistant-finish" })));
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            sseLine({ type: "text-delta", textDelta: words[i] })
          )
        );

        i += 1;
        setTimeout(tick, 35);
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

export async function GET() {
  return new Response(
    JSON.stringify({ ok: true, note: "chat endpoint alive (GET)" }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
