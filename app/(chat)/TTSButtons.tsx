"use client";

import { useState } from "react";
import { playTTS } from "@/lib/play-tts-client";

export default function TTSButtons() {
  const [busy, setBusy] = useState(false);

  const say = async (text: string) => {
    try {
      setBusy(true);
      await playTTS(text);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap mt-4">
      <button
        disabled={busy}
        onClick={() =>
          say("Hej – jeg er Kim. Jeg bygger bro mellem unge, praksis og tech.")
        }
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        🔊 30 sek pitch
      </button>
      <button
        disabled={busy}
        onClick={() =>
          say("Jeg hedder Kim Vase og bor i Grindsted. Jeg er mediegrafiker og underviser ...")
        }
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        🔊 90 sek pitch
      </button>
      <button
        disabled={busy}
        onClick={() =>
          say("Kim er en jordnær mediegrafiker og underviser fra Grindsted ...")
        }
        className="px-4 py-2 bg-purple-500 text-white rounded"
      >
        🔊 Hvem er Kim?
      </button>
    </div>
  );
}
