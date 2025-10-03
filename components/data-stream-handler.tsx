"use client";

import { useEffect, useRef } from "react";
import { useDataStream } from "./data-stream-provider";

/**
 * Observerer kun dataStream og udsender 'assistant:final' med den samlede tekst,
 * når en assistent-svar er færdigt. Rører ikke ved artifact-typerne.
 */
export function DataStreamHandler() {
  const { dataStream } = useDataStream();

  // buffer for nuværende assistent-svar
  const bufferRef = useRef<string>("");
  // track om vi er i gang med at modtage et svar
  const inProgressRef = useRef<boolean>(false);
  // behandl kun nye deltas
  const lastIndexRef = useRef<number>(-1);

  useEffect(() => {
    if (!dataStream || dataStream.length === 0) return;

    const start = lastIndexRef.current + 1;
    const newDeltas = dataStream.slice(start);
    lastIndexRef.current = dataStream.length - 1;

    for (const delta of newDeltas) {
      // debug i konsollen—se præcis hvad dit setup sender
      console.log("Δ", delta?.type, delta);

      const t = String(delta?.type || "").toLowerCase();

      // Hent tekst-chunk på tværs af typiske felter
      const any = delta as any;
      let chunk = "";
      if (typeof any.textDelta === "string") chunk = any.textDelta;
      else if (typeof any.delta === "string") chunk = any.delta;
      else if (typeof any.text === "string") chunk = any.text;
      else if (typeof any.data === "string") chunk = any.data;
      else if (typeof any.content === "string") chunk = any.content;

      // Hvis vi modtager tekst og ikke var i gang, så starter vi implicit en ny buffer
      if (chunk) {
        if (!inProgressRef.current) {
          bufferRef.current = "";
          inProgressRef.current = true;
        }
        bufferRef.current += chunk;
      }

      // Slut-delta? match flere almindelige varianter
      const looksFinished =
        t.includes("finish") ||
        t === "message-finish" ||
        t === "data-finish" ||
        t === "assistant-finish";

      if (looksFinished) {
        const text = bufferRef.current.trim();
        if (text) {
          window.dispatchEvent(
            new CustomEvent("assistant:final", { detail: { text } })
          );
        }
        bufferRef.current = "";
        inProgressRef.current = false;
      }
    }
  }, [dataStream]);

  return null;
}
