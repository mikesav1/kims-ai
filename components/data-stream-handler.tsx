"use client";

import { useEffect, useRef } from "react";
import { useDataStream } from "./data-stream-provider";

/**
 * This handler only OBSERVES dataStream and dispatches an event when the
 * assistant message is done. No artifact typing or status juggling.
 */
export function DataStreamHandler() {
  const { dataStream } = useDataStream();

  // keep a buffer for the current assistant message
  const bufferRef = useRef<string>("");
  // process only new deltas each render
  const lastIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (!dataStream || dataStream.length === 0) return;

    const start = lastIndexRef.current + 1;
    const newDeltas = dataStream.slice(start);
    lastIndexRef.current = dataStream.length - 1;

    for (const delta of newDeltas) {
      // Debug: see exactly what your stream emits
      // Open DevTools console and watch these logs
      console.log("Δ", delta?.type, delta);

      // If a new assistant message begins, clear buffer
      // Many templates send a "role" delta; keep this generic & safe
      if (delta?.type === "role" && (delta as any)?.data === "assistant") {
        bufferRef.current = "";
        continue;
      }

      // Try to pick up text chunks across common delta shapes:
      // adjust as we learn what your template emits from the console logs.
      const asAny = delta as any;
      const maybeTextChunk =
        asAny.textDelta ??
        asAny.delta ??
        asAny.text ??
        asAny.data ??
        asAny.content ??
        "";

      if (typeof maybeTextChunk === "string" && maybeTextChunk) {
        bufferRef.current += maybeTextChunk;
      }

      // When the assistant finishes, templates usually emit some *finish* delta.
      // Catch several common variants:
      const t = (delta?.type || "").toString().toLowerCase();
      const looksFinished =
        t.includes("finish") ||
        t === "message-finish" ||
        t === "data-finish" ||
        t === "assistant-finish";

      if (looksFinished) {
        const text = bufferRef.current.trim();
        if (text) {
          // Fire the event our AutoSpeak listens to
          window.dispatchEvent(
            new CustomEvent("assistant:final", { detail: { text } })
          );
        }
        bufferRef.current = "";
      }
    }
  }, [dataStream]);

  return null;
}
