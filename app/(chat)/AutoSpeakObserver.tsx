// app/(chat)/AutoSpeakObserver.tsx
"use client";

import { useEffect } from "react";

const DENYLIST = [
  "copy", "kopy", "upload", "response", "thumb", "like", "dislike",
  "share", "download", "open in new", "open in gmail",
];

function isReadable(text: string): boolean {
  const t = (text || "").trim();

  // for kort -> sandsynligvis knap/label
  if (t.length < 20) return false;

  const lc = t.toLowerCase();

  // klassiske UI-ord
  if (DENYLIST.some(w => lc.includes(w))) return false;

  // rene links/URL’er
  if (/^(https?:\/\/|www\.)/i.test(t)) return false;

  // heuristik: engelske onboarding-sætninger uden danske specialtegn
  if (/(click|button|press|upload|drag|drop|you can|try|examples)/i.test(t) && !/[æøå]/i.test(t)) {
    return false;
  }

  return true;
}

export default function AutoSpeakObserver() {
  useEffect(() => {
    let currentAudio: HTMLAudioElement | null = null;

    const onFinal = async (e: any) => {
      const text: string | undefined = e?.detail?.text;
      if (!text) return;

      // læs kun “rigtige” svar
      if (!isReadable(text)) {
        // console.log("[AutoSpeak] filtreret fra:", text);
        return;
      }

      try {
        // stop evt igangværende afspilning
        try {
          currentAudio?.pause();
          currentAudio = null;
        } catch {}

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
        currentAudio = a;

        a.play().catch(err => console.error("[AutoSpeak] play error:", err));
        // console.log("[AutoSpeak] Afspilning startet.");
      } catch (err) {
        console.error("[AutoSpeak] TTS error:", err);
      }
    };

    window.addEventListener("assistant:final", onFinal);
    return () => window.removeEventListener("assistant:final", onFinal);
  }, []);

  return null;
}
