"use client";

import { useEffect, useState, useCallback } from "react";

export default function AutoSpeak() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("tts:auto") === "1";
  });

  // Kald TTS-endpointet og afspil
  const speak = useCallback(async (text: string) => {
    try {
      console.log("[AutoSpeak] fetch /api/tts with:", text.slice(0, 120) + (text.length > 120 ? "…" : ""));
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[AutoSpeak] /api/tts error:", res.status, err);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      console.log("[AutoSpeak] audio started");
    } catch (e) {
      console.error("[AutoSpeak] play error:", e);
    }
  }, []);

  // Event listener
  useEffect(() => {
    const handler = (e: Event) => {
      if (!enabled) {
        console.log("[AutoSpeak] event ignored (disabled)");
        return;
      }
      const detail = (e as CustomEvent<{ text?: string }>).detail;
      const text = detail?.text ?? "";
      console.log("[AutoSpeak] assistant:final received. Text len:", text.length);
      if (text.trim()) speak(text.trim());
    };

    // 👇 SKAL matche DataStreamHandler
    window.addEventListener("assistant:final", handler as EventListener);
    return () => window.removeEventListener("assistant:final", handler as EventListener);
  }, [enabled, speak]);

  return (
    <div className="mt-2 flex items-center gap-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            const v = e.target.checked;
            setEnabled(v);
            localStorage.setItem("tts:auto", v ? "1" : "0");
            console.log("[AutoSpeak] enabled:", v);
          }}
        />
        Læs svar højt automatisk
      </label>

      <button
        type="button"
        className="px-2 py-1 border rounded text-sm"
        onClick={() => speak("Test: Kim-agenten læser dette højt.")}
        title="Afspil test-lyd"
      >
        Test oplæsning
      </button>
    </div>
  );
}
