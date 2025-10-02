"use client";

import { useEffect, useState } from "react";
import { playTTS } from "@/lib/play-tts-client"; // den vi allerede bruger fra knapperne

export default function AutoSpeak() {
  // lille toggle gemt i localStorage
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("tts:auto") === "1";
  });

  useEffect(() => {
    const onFinal = (e: Event) => {
      if (!enabled) return;
      const { text } = (e as CustomEvent).detail as { text: string };
      if (text && text.trim()) {
        playTTS(text.trim());
      }
    };
    window.addEventListener("assistant:final", onFinal as EventListener);
    return () => window.removeEventListener("assistant:final", onFinal as EventListener);
  }, [enabled]);

  return (
    <label className="flex items-center gap-2 text-sm mt-2">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => {
          const v = e.target.checked;
          setEnabled(v);
          if (typeof window !== "undefined") {
            localStorage.setItem("tts:auto", v ? "1" : "0");
          }
        }}
      />
      Læs svar højt automatisk
    </label>
  );
}
