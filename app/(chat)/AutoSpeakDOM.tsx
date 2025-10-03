"use client";

import { useEffect, useRef } from "react";

// Meget tolerant DOM-observer: finder sidste assistent-boble og læser den op via /api/tts.
export default function AutoSpeakDOM() {
  // Brug samme toggle som dine knapper (lokalStorage "autospeak_enabled" = "1"/"0")
  const enabledRef = useRef<boolean>(true);
  const lastSpokenRef = useRef<string>(""); // undgå dobbelt oplæsning
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      enabledRef.current = localStorage.getItem("autospeak_enabled") !== "0";
    } catch {}

    const onStorage = () => {
      try {
        enabledRef.current = localStorage.getItem("autospeak_enabled") !== "0";
      } catch {}
    };
    window.addEventListener("storage", onStorage);

    const mo = new MutationObserver(() => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // vent lidt, så teksten er færdig med at “sætte sig”
      debounceRef.current = setTimeout(checkAndSpeak, 900);
    });

    // observer hele dokumentet – robust på tværs af templates
    mo.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      window.removeEventListener("storage", onStorage);
      mo.disconnect();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  async function checkAndSpeak() {
    if (!enabledRef.current) return;

    const el = findLastAssistantNode();
    if (!el) return;

    const text = (el.textContent || "").trim();
    if (!text) return;

    // undgå at læse samme svar flere gange
    if (text === lastSpokenRef.current) return;
    lastSpokenRef.current = text;

    // Kald din TTS-API og afspil
    try {
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      console.log("[AutoSpeakDOM] TTS status:", r.status);

      if (!r.ok) return;

      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play().catch((e) => console.warn("Audio play error:", e));
      setTimeout(() => URL.revokeObjectURL(url), 15000);
    } catch (e) {
      console.warn("[AutoSpeakDOM] TTS fetch/afspil fejl:", e);
    }
  }

  // Forsøg at finde sidste assistent-boble på tværs af forskellige UI'er
  function findLastAssistantNode(): HTMLElement | null {
    const selectors = [
      // typiske attributter/klasser
      '[data-role="assistant"]',
      '[data-author="assistant"]',
      '[data-message-author="assistant"]',
      'article[aria-label^="Assistant"]',
      ".assistant",
      '[data-variant="assistant"]',
    ];

    for (const sel of selectors) {
      const nodes = document.querySelectorAll<HTMLElement>(sel);
      if (nodes.length) return nodes[nodes.length - 1];
    }

    // Fallback: vælg et “stort” tekstblok i de nyeste message-containere
    const candidates = Array.from(
      document.querySelectorAll<HTMLElement>("article,section,div,p")
    ).slice(-60);
    let best: HTMLElement | null = null;
    for (const n of candidates) {
      const t = (n.textContent || "").trim();
      if (t.length > 60) best = n; // heuristik
    }
    return best;
  }

  return null;
}
