"use client";

import { useEffect, useRef } from "react";
import { useDataStream } from "./data-stream-provider";

/**
 * Lytter på dataStream, buffer tekst, og emitter "assistant:final"
 * med den fulde tekst når LLM-svaret er færdigt.
 */
export function DataStreamHandler() {
  const { dataStream } = useDataStream();
  const bufferRef = useRef("");

  useEffect(() => {
    if (!dataStream?.length) return;

    // Tag kun de nye dele og opdater bufferen
    const last = dataStream[dataStream.length - 1];

    const t = last?.type;
    const d = (last as any)?.data;

    // Tekst-append (navne kan variere mellem templates)
    if (t === "text-delta" || t === "data-textDelta" || t === "data-text-delta") {
      if (typeof d === "string") bufferRef.current += d;
    }

    // Start på ny assistant-besked? (ryd buffer)
    if (t === "role" && d === "assistant") {
      bufferRef.current = "";
    }

    // Slut – emit den samlede tekst
    if (t === "finish" || t === "data-finish") {
      const text = bufferRef.current.trim();
      bufferRef.current = "";
      if (text && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("assistant:final", { detail: { text } }));
      }
    }
  }, [dataStream]);

  return null;
}
