"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "autospeak-enabled";

// Ord/fraser vi ikke vil oplæse (ikon/knap-tekst m.v.)
const BAD_WORDS = [
  "kopiér", "kopier", "copy",
  "synes godt om", "synes ikke", "thumbs", "like", "dislike",
  "del", "share",
  "svar", "reply",
  "hænder", "hand", "ikon", "icon"
];

// Minimum meningsfuld længde på tekst
const MIN_LEN = 12;

// Valgfri: du kan sætte den til true, hvis du vil have AutoSpeak slået til som standard
const DEFAULT_ENABLED = true;

/**
 * Rengør teksten og afgør om vi bør læse den højt.
 * Returnerer den rengjorte tekst eller null, hvis den ikke skal oplæses.
 */
function sanitizeForSpeech(raw: string): string | null {
  if (!raw) return null;

  // Fjern ekstra whitespace og kontroltegn
  let t = raw.replace(/\s+/g, " ").replace(/\u200B/g, "").trim();

  // Ignorer meget korte bidder
  if (t.length < MIN_LEN) return null;

  // Fjern åbenlys UI-støj (enkelt ord/fraser)
  const low = t.toLowerCase();
  if (BAD_WORDS.some((w) => low.includes(w))) return null;

  // Fjern eventuelle [knap]-markører eller (ikon) mv. (blød rengøring)
  t = t.replace(/\[[^\]]+\]/g, "").replace(/\([^\)]+\)/g, " ").replace(/\s{2,}/g, " ").trim();

  if (t.length < MIN_LEN) return null;

  // Fjern trailing ikon-artefakter
  t = t.replace(/(?:👍|👎|🔗|🔊|🔇|📋|🔁)+/g, "").trim();

  return t.length >= MIN_LEN ? t : null;
}

/**
 * Spiller en Blob/URL via HTMLAudio—stopper forrige afspilning og rydder URL efter brug.
 */
function playBlobUrl(url: string, prevAudioRef: React.MutableRefObject<HTMLAudioElement | null>) {
  try {
    if (prevAudioRef.current) {
      try {
        prevAudioRef.current.pause();
      } catch {}
      // Gammel URL kan være en blob, så prøv at frigive
      try {
        URL.revokeObjectURL(prevAudioRef.current.src);
      } catch {}
    }
    const a = new Audio(url);
    prevAudioRef.current = a;
    // Sørg for at medier må afspilles (Safari/iOS kræver user gesture—men vi har allerede haft en interaktion)
    a.play().catch((err) => console.error("[AutoSpeak] play error:", err));
  } catch (err) {
    console.error("[AutoSpeak] Kunne ikke starte afspilning:", err);
  }
}

/**
 * Simpel fallback: brug browserens tekst-til-tale hvis /api/tts fejler.
 */
function speakFallbackBrowser(text: string, prevAudioRef: React.MutableRefObject<HTMLAudioElement | null>) {
  try {
    // Stop evtl. HTMLAudio (for en ren fallback)
    if (prevAudioRef.current) {
      try { prevAudioRef.current.pause(); } catch {}
      try { URL.revokeObjectURL(prevAudioRef.current.src); } catch {}
      prevAudioRef.current = null;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    // Sæt evt. dansk stemme hvis tilgængelig
    const voices = speechSynthesis.getVoices();
    const da = voices.find(v => v.lang?.toLowerCase().startsWith("da"));
    if (da) u.voice = da;
    speechSynthesis.speak(u);
  } catch (err) {
    console.error("[AutoSpeak] Browser-fallback fejlede:", err);
  }
}

export default function AutoSpeakObserver() {
  const lastSpokenRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Respektér brugerens toggle
    const enabledRaw = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) ?? "";
    const enabled = enabledRaw === "" ? DEFAULT_ENABLED : enabledRaw === "true";
    if (!enabled) {
      console.log("[AutoSpeak] Deaktiveret via localStorage.");
      return;
    }

    const onFinal = async (e: any) => {
      // NB: DataStreamHandler burde sende { detail: { text } }
      const raw: string | undefined = e?.detail?.text;
      if (!raw) return;

      const text = sanitizeForSpeech(raw);
      if (!text) {
        // Støj eller for kort tekst – ignorer
        return;
      }

      // Undgå at læse den samme sætning to gange i træk
      if (text === lastSpokenRef.current) return;
      lastSpokenRef.current = text;

      try {
        const r = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!r.ok) {
          console.error("[AutoSpeak] TTS failed:", await r.text());
          // Fallback: prøv browserens indbyggede TTS
          speakFallbackBrowser(text, audioRef);
          return;
        }

        // BEMÆRK: Vi bruger arrayBuffer -> blob -> objectURL -> HTMLAudio
        const ab = await r.arrayBuffer();
        const blob = new Blob([ab], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        playBlobUrl(url, audioRef);
        console.log("[AutoSpeak] Afspilning startet.");
      } catch (err) {
        console.error("[AutoSpeak] TTS error:", err);
        speakFallbackBrowser(text, audioRef);
      }
    };

    window.addEventListener("assistant:final", onFinal);
    return () => {
      window.removeEventListener("assistant:final", onFinal);
      // Ryd op: stop evt. lyd og frigiv URL
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
        }
      } catch {}
    };
  }, []);

  return null;
}
