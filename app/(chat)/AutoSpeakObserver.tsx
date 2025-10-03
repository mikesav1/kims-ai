"use client";

import { useEffect, useRef } from "react";

function scrubAssistantText(input: string): string {
  let t = input ?? "";

  // Fjern emojis/ikon-UI
  t = t.replace(/[👍👎📎🔊🎤📤📥💬🗒️⭐️]/g, " ");

  // Fjern typiske UI-etiketter (DK/EN) som kan snige sig med i strengen
  const uiWords = new Set(
    [
      "kopi", "kopier", "kopiér", "copy",
      "upload", "download", "del", "share",
      "like", "dislike", "thumbs up", "thumbs down",
      "svar", "send", "besked", "skriv en besked",
      "response", "respone", "respond", "reply",
      "test oplæsning", "30 sek pitch", "90 sek pitch", "hvem er kim?",
    ].map((s) => s.toLowerCase())
  );

  // Linje-for-linje rens:
  t = t
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter((line) => {
      const k = line.toLowerCase();

      // Smid helt tomme linjer
      if (!k) return false;

      // Smid meget korte "UI-agtige" linjer
      if (k.length <= 2) return false;

      // Fjern linjer der *kun* består af "UI-ord"
      if (uiWords.has(k)) return false;

      // Fjern linjer der starter med typiske UI-tekster
      if (/^(kopi(ér|er)?|copy|upload|download|del|share|svar|send|response|respone|like|dislike)\b/i.test(k)) {
        return false;
      }

      // Fjern de auto-knapper vi har tilføjet
      if (/^(30 sek pitch|90 sek pitch|hvem er kim\?)$/i.test(k)) return false;

      return true;
    })
    .join("\n");

  // Fjern "code fences" (hvis de skulle dukke op)
  t = t.replace(/```[\s\S]*?```/g, "");

  // Komprimer whitespace
  t = t.replace(/\s{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();

  return t;
}

export default function AutoSpeakObserver() {
  const lastSpokenRef = useRef<string>("");           // deduplikér sidste udsendte
  const playingRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const onFinal = async (e: any) => {
      const rawText: string | undefined = e?.detail?.text;
      if (!rawText) return;

      // Sanér/filtrér
      const text = scrubAssistantText(rawText);

      // Hvis der kun er UI tilbage → ikke tal det
      if (!text || text.length < 5) return;

      // Deduplikér (undgå at læse samme svar to gange)
      if (text === lastSpokenRef.current) return;
      lastSpokenRef.current = text;

      // Stop igangværende afspilning (hvis bruger skynder sig)
      try {
        playingRef.current?.pause?.();
        playingRef.current = null;
      } catch {}

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
        playingRef.current = a;

        await a.play();
        console.log("[AutoSpeak] Afspilning startet.");
      } catch (err) {
        console.error("[AutoSpeak] TTS error:", err);
      }
    };

    window.addEventListener("assistant:final", onFinal);
    return () => {
      window.removeEventListener("assistant:final", onFinal);
      try {
        playingRef.current?.pause?.();
      } catch {}
      playingRef.current = null;
    };
  }, []);

  return null;
}
