let currentAudio: HTMLAudioElement | null = null;

export async function playTTS(text: string) {
  const r = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error(await r.text());

  const blob = await r.blob();
  const url = URL.createObjectURL(blob);

  if (currentAudio) { try { currentAudio.pause(); } catch {} }
  currentAudio = new Audio(url);
  currentAudio.onended = () => URL.revokeObjectURL(url);

  await currentAudio.play().catch(() => {
    console.warn("Autoplay blokeret – klik på siden og prøv igen.");
  });
}
