"use client";

import { useEffect } from "react";

export function DataStreamHandler() {
  // 1) Bekræft mount
  useEffect(() => {
    console.log("[DSH] mounted");
  }, []);

  // 2) Lav en global helper til test
  useEffect(() => {
    (window as any).__emitFinal = (text: string) => {
      console.log("[DSH] DISPATCH assistant:final with:", text);
      window.dispatchEvent(new CustomEvent("assistant:final", { detail: { text } }));
    };
    console.log(
      "%cSkriv i konsollen: __emitFinal('Hej fra test')",
      "color: lime; font-weight: bold;"
    );
  }, []);

  return null;
}
