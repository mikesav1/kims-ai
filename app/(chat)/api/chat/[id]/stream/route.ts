// app/(chat)/api/chat/[id]/stream/route.ts
export const runtime = "edge";

export async function GET() {
  // Resumable streaming er slået fra i projektet – returnér bare 204.
  return new Response(null, { status: 204 });
}
