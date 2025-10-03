// components/data-stream-handler.tsx
"use client";

import { useEffect, useRef } from "react";
import { useDataStream } from "./data-stream-provider";

export function DataStreamHandler() {
  const { dataStream } = useDataStream();
  const bufferRef = useRef<string>("");

  useEffect(() => {
    if (!dataStream || dataStream.length === 0) return;

    // Tag kun de sidste ~20 events for ikke at spamme i loops
    const recent = dataStream.slice(-20);

    for (const delta of recent as any[]) {
      const t = delta?.type;
      const d = (delta as any)?.data;

      // 1) Når en ny assistant-besked starter, ryd bufferen
      if (t === "role" && d === "assistant") {
        bufferRef.current = "";
        continue;
      }

      // 2) Tekst-append (navn afhænger af template)
      if (t === "text-delta" || t === "data-textDelta" || t === "data-text-delta") {
        if (typeof d === "string") bufferRef.current += d;
        continue;
      }

      // 3) Når streamen melder færdig -> emit event
      if (t === "data-finish" || t === "finish" || t === "done") {
        const text = bufferRef.current.trim();
        if (text) {
          console.log("[DSH] EMIT assistant:final:", text.slice(0, 120));
          window.dispatchEvent(new CustomEvent("assistant:final", { detail: { text } }));
        }
        bufferRef.current = "";
        continue;
      }
    }
  }, [dataStream]);

  return null;
}
