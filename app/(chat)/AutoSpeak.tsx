"use client";

import { useEffect, useState } from "react";

export default function AutoSpeak() {
  const [enabled, setEnabled] = useState(true);
  const [testing, setTesting] = useState(false);

  // central speak => sender til /api/tts og afspiller
  const speak = async (text: string) => {
    try {
      console.log("[AutoSpeak] speak() -> POST /api/tts, len:", text.length);
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        console.error("[AutoSpeak] TTS HTTP error", res.status);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      console.log("[AutoSpeak] playing audio ok");
    } catch (e) {
      console.error("[AutoSpeak] speak() failed", e);
    }
  };

  // Hør eventet fra DataStreamHandler
  useEffect(() => {
    console.log("[AutoSpeak] mounted");

    const onFinal = (e: Event) => {
      const detail = (e as CustomEvent)?.detail as { text?: string } | undefined;
      const text = detail?.text || "";
      console.log("[AutoSpeak] assistant:final event received, len:", text.length, "enabled:", enabled);
      if (!enabled || !text) return;
      speak(text);
    };

    window.addEventListener("assistant:final", onFinal);
    return () => {
      window.removeEventListener("assistant:final", onFinal);
    };
  }, [enabled]);

  const testNow = async () => {
    setTesting(true);
    await speak("Test — dette er AutoSpeak der læser op fra ElevenLabs.");
    setTesting(false);
  };

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        Læs svar højt automatisk
      </label>

      <button
        onClick={testNow}
        disabled={testing}
        className="rounded bg-neutral-200 px-3 py-1 text-sm dark:bg-neutral-700"
      >
        {testing ? "Tester…" : "Test oplæsning"}
      </button>

      <button
        onClick={() =>
          window.dispatchEvent(
            new CustomEvent("assistant:final", {
              detail: { text: "Simuleret event: AutoSpeak bør læse dette op." },
            })
          )
        }
        className="rounded bg-neutral-200 px-3 py-1 text-sm dark:bg-neutral-700"
      >
        Simulér event
      </button>
    </div>
  );
}
