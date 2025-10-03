"use client";

import { useEffect, useRef, useState } from "react";
// TJEK DISSE IMPORT-STIER I DIT PROJEKT:
import { useDataStream } from "@/components/data-stream-provider";
import { useArtifact } from "@/hooks/use-artifact";

// Lille helper der kalder din /api/tts og spiller lyden
async function speak(text: string) {
  if (!text?.trim()) return;
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    console.error("TTS fejl:", await res.text());
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  try {
    await audio.play();
  } catch (e) {
    console.error("Audio play fejlede (autoplay?):", e);
  } finally {
    audio.onended = () => URL.revokeObjectURL(url);
  }
}

export default function AutoSpeakObserver() {
  const { dataStream } = useDataStream(); // deltas fra din chat-stream
  const { artifact } = useArtifact();     // indeholder den akkumulerede tekst
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return (localStorage.getItem("autospeak") ?? "1") === "1";
    } catch {
      return true;
    }
  });

  // Husk brugerens valg
  useEffect(() => {
    try {
      localStorage.setItem("autospeak", enabled ? "1" : "0");
    } catch {}
  }, [enabled]);

  // Sørger for kun at reagere på NYE "data-finish" events
  const lastFinishIdx = useRef<number>(-1);

  useEffect(() => {
    if (!enabled) return;
    if (!dataStream?.length) return;

    for (let i = lastFinishIdx.current + 1; i < dataStream.length; i++) {
      const d = dataStream[i] as any;
      if (d?.type === "data-finish") {
        lastFinishIdx.current = i;

        // Læs seneste tekst ud af artifact (samlet svar)
        const text =
          (artifact as any)?.content?.toString?.() ??
          (artifact as any)?.content ??
          "";

        // Sig det højt
        if (text) speak(text).catch(console.error);
      }
    }
  }, [dataStream, artifact, enabled]);

  // Lille UI under indtastningsfeltet
  return (
    <div className="mt-2 flex items-center gap-3">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Læs svar højt automatisk
      </label>

      <button
        type="button"
        className="rounded-md border px-3 py-1 text-sm"
        onClick={() => {
          const text =
            (artifact as any)?.content?.toString?.() ??
            (artifact as any)?.content ??
            "Hej Kim, test af oplæsning.";
          speak(text).catch(console.error);
        }}
      >
        Test oplæsning
      </button>
    </div>
  );
}
