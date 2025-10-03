"use client";

import { useEffect, useRef } from "react";
import { useDataStream } from "./data-stream-provider";

// En supertolerant parser: logger ALT og prøver almindelige feltnavne
export function DataStreamHandler() {
  const { dataStream } = useDataStream();
  const bufferRef = useRef("");
  const lastRoleRef = useRef<"assistant" | "user" | "">("");

  useEffect(() => {
    const arr = dataStream ?? [];
    if (!arr.length) return;

    for (const delta of arr) {
      const d: any = delta;

      // LOG ALTING: type + et kort udsnit af værdien
      const preview =
        (typeof d?.data === "string" && d.data.slice(0, 80)) ||
        (typeof d?.text === "string" && d.text.slice(0, 80)) ||
        (typeof d?.delta === "string" && d.delta.slice(0, 80)) ||
        (typeof d?.value === "string" && d.value.slice(0, 80)) ||
        JSON.stringify(d).slice(0, 80);
      console.log("[DSH] delta:", d?.type, preview);

      // 1) Rolle-skift (mange skabeloner sender 'role' eller 'data-role')
      if (d.type === "role" || d.type === "data-role") {
        if (d.data === "assistant") {
          bufferRef.current = ""; // ny assistent-besked starter
          lastRoleRef.current = "assistant";
          console.log("[DSH] role=assistant -> buffer reset");
        } else if (d.data === "user") {
          lastRoleRef.current = "user";
          console.log("[DSH] role=user");
        }
        continue;
      }

      // 2) Tekst-delta (navne varierer: text / data / textDelta / data-textDelta / delta / value)
      if (
        d.type?.includes?.("text") ||
        d.type === "text" ||
        d.type === "text-delta" ||
        d.type === "data-textDelta" ||
        d.type === "data-text-delta" ||
        d.type === "data-text"
      ) {
        const piece: string =
          d.text ?? d.data ?? d.delta ?? d.value ?? "";
        if (typeof piece === "string" && piece.length) {
          bufferRef.current += piece;
          console.log("[DSH] appended:", piece.slice(0, 80));
        }
        continue;
      }

      // 3) Slut på besked (mange variabler: finish / data-finish / response-finish / done)
      if (
        d.type?.includes?.("finish") ||
        d.type === "finish" ||
        d.type === "data-finish" ||
        d.type === "response-finish" ||
        d.type === "done"
      ) {
        console.log("[DSH] finish modtaget. role=", lastRoleRef.current);
        if (lastRoleRef.current === "assistant") {
          const text = bufferRef.current.trim();
          bufferRef.current = "";
          if (text) {
            console.log("[DSH] DISPATCH assistant:final:", text.slice(0, 120));
            window.dispatchEvent(
              new CustomEvent("assistant:final", { detail: { text } })
            );
          } else {
            console.log("[DSH] tom buffer ved finish – ingen dispatch.");
          }
        }
        continue;
      }
    }
  }, [dataStream]);

  return null;
}
