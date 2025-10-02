"use client";

import { useEffect, useState } from "react";
import { playTTS } from "@/lib/play-tts-client";

export default function AutoSpeak() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("tts:auto") === "1";
  });

  useEffect(() => {
    const handler = (e: Event) => {
      if (!enabled) return;
      const { text } = (e as CustomEvent<{ text: string }>).detail || { text: "" };
      if (!text?.trim()) return;

      console.log("[AutoSpeak] final text:", text.slice(0, 120) + (text.length > 120 ? "…" : ""));
      playTTS(text.trim());
    };

    // 👈 matcher DataStreamHandler
    window.addEventListener("assistant:final", handler as EventListener);
    return () => window.removeEventListener("assistant:final", handler as EventListener);
  }, [enabled]);

  return (
    <label className="flex items-center gap-2 text-sm mt-2">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => {
          const v = e.target.checked;
          setEnabled(v);
          localStorage.setItem("tts:auto", v ? "1" : "0");
        }}
      />
      Læs svar højt automatisk
    </label>
  );
}
