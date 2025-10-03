"use client";

import { useEffect, useRef } from "react";
import { useDataStream } from "./data-stream-provider";

export function DataStreamHandler() {
  const { dataStream } = useDataStream();

  // Samler tokens indtil vi får finish
  const bufferRef = useRef("");

  useEffect(() => {
    if (!dataStream?.length) return;

    // Gennemløb alle dele (du kan evt. optimere med "sidst set" indeks)
    for (const delta of dataStream) {
      const t = String((delta as any)?.type);   // <— normaliser til string
      const d = (delta as any)?.data;

      // 1) Ny assistant-besked starter → nulstil buffer
      if (t === "role" && d === "assistant") {
        bufferRef.current = "";
        continue;
      }

      // 2) Tekst-append (navne kan variere mellem templates)
      const isTextDelta = ["text-delta", "data-textDelta", "data-text-delta"].includes(t);
      if (isTextDelta) {
        // d kan være string eller et objekt afh. af strømmen
        if (typeof d === "string") {
          bufferRef.current += d;
        } else if (d?.content) {
          bufferRef.current += String(d.content);
        }
        continue;
      }

      // 3) Slut på besked → udsend endelig tekst
      const isFinish = t === "finish" || t === "data-finish";
      if (isFinish) {
        const finalText = bufferRef.current.trim();
        if (finalText && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("assistant:final", { detail: { text: finalText } })
          );
        }
        bufferRef.current = "";
      }
    }
  }, [dataStream]);

  return null;
}
