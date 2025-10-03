"use client";

import { useEffect } from "react";

export default function AutoSpeakObserver() {
  useEffect(() => {
    const onFinal = async (e: any) => {
      const text: string | undefined = e?.detail?.text;
      if (!text) return;

      try {
        const r = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!r.ok) {
          console.error("[AutoSpeak] TTS failed:", await r.text());
          return;
        }

        const ab = await r.arrayBuffer();
        const blob = new Blob([ab], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);
        const a = new Audio(url);
        a.play().catch(err => console.error("[AutoSpeak] play error:", err));
        console.log("[AutoSpeak] Afspilning startet.");
      } catch (err) {
        console.error("[AutoSpeak] TTS error:", err);
      }
    };

    window.addEventListener("assistant:final", onFinal);
    return () => window.removeEventListener("assistant:final", onFinal);
  }, []);

  return null;
}
