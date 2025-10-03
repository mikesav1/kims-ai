"use client";

import { useEffect, useRef } from "react";
import { useDataStream } from "./data-stream-provider";

/**
 * Robust stream-handler:
 * - Bufferer tekst fra tekst-deltas (flere felt-navne understøttes)
 * - Udløser 'assistant:final' ved finish-delta ELLER efter inaktivitet (fallback)
 * - Logger alle deltas i konsollen (så vi kan finjustere)
 */
export function DataStreamHandler() {
  const { dataStream } = useDataStream();

  // Buffer for igangværende svar
  const bufferRef = useRef<string>("");
  const inProgressRef = useRef<boolean>(false);
  const lastIndexRef = useRef<number>(-1);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hvor mange ms uden nye tekst-chunks før vi flusher (fallback)
  const IDLE_MS = 1200;

  const flush = () => {
    const text = bufferRef.current.trim();
    if (text) {
      console.log("[DataStreamHandler] FLUSH -> assistant:final", text.slice(0, 120), "…");
      window.dispatchEvent(new CustomEvent("assistant:final", { detail: { text } }));
    }
    bufferRef.current = "";
    inProgressRef.current = false;
  };

  const armIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (inProgressRef.current) {
        console.log("[DataStreamHandler] idle timeout -> flush");
        flush();
      }
    }, IDLE_MS);
  };

  useEffect(() => {
    if (!dataStream || dataStream.length === 0) return;

    const start = lastIndexRef.current + 1;
    const newDeltas = dataStream.slice(start);
    lastIndexRef.current = dataStream.length - 1;

    for (const delta of newDeltas) {
      console.log("Δ", delta?.type, delta);

      const t = String(delta?.type || "").toLowerCase();
      const any = delta as any;

      // Læs tekst fra de mest almindelige felter
      let chunk = "";
      if (typeof any.textDelta === "string") chunk = any.textDelta;
      else if (typeof any.delta === "string") chunk = any.delta;
      else if (typeof any.text === "string") chunk = any.text;
      else if (typeof any.data === "string") chunk = any.data;
      else if (typeof any.content === "string") chunk = any.content;

      if (chunk) {
        if (!inProgressRef.current) {
          console.log("[DataStreamHandler] start new buffer");
          bufferRef.current = "";
          inProgressRef.current = true;
        }
        bufferRef.current += chunk;
        armIdleTimer();
      }

      // Slut-signaler – match flere varianter
      const looksFinished =
        t.includes("finish") ||
        t === "message-finish" ||
        t === "data-finish" ||
        t === "assistant-finish";

      if (looksFinished) {
        console.log("[DataStreamHandler] finish delta -> flush");
        flush();
      }
    }
  }, [dataStream]);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return null;
}
