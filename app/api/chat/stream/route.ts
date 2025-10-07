// app/api/chat/stream/route.ts
// Minimal "no-op" endpoint — bruges kun for at undgå fejl hvis UI prøver at kalde /api/chat/stream
// Returnerer status 204 (ingen indhold) i stedet for at smide fejl.

export const runtime = "edge";

export async function GET(request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      "cache-control": "no-store",
      "x-kim-stream": "disabled",
      "x-handler": "stream",
    },
  });
}
