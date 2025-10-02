"use client";

import { useEffect, useState } from "react";

export default function AutoSpeak() {
  const [enabled, setEnabled] = useState(false);

  // Hent tidligere bruger-valg fra localStorage
  useEffect(() => {
    const stored = localStorage.getItem("autoSpeakEnabled");
    if (stored === "true") {
      setEnabled(true);
    }
  }, []);

  // Lyt efter custom event fra DataStreamHandler
  useEffect(() => {
    if (!enabled) return;

    const handleSpeak = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      const text = customEvent.detail;

      // kald TTS-endpointet
      fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
        .then((res) => res.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.play();
        })
        .catch((err) => console.error("TTS fejl:", err));
    };

    window.addEventListener("tts:speak", handleSpeak);
    return () => window.removeEventListener("tts:speak", handleSpeak);
  }, [enabled]);

  const toggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    localStorage.setItem("autoSpeakEnabled", newValue.toString());
  };

  return (
    <div className="my-2">
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={toggle} />
        <span>Læs automatisk svar op</span>
      </label>
    </div>
  );
}
