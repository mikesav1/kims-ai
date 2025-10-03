"use client";

import { useEffect, useRef } from "react";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { artifactDefinitions } from "./artifact";
import { useDataStream } from "./data-stream-provider";

export function DataStreamHandler() {
  const { dataStream } = useDataStream();

  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);

  // Husk forrige status, så vi kan opdage overgang streaming -> idle
  const prevStatus = useRef<string | undefined>(artifact?.status);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    for (const delta of newDeltas) {
      const artifactDefinition = artifactDefinitions.find(
        (def) => def.kind === artifact.kind
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draft: any) => {
        if (!draft) {
          // 👇 status som literal type
          return { ...initialArtifactData, status: "streaming" as const };
        }

        switch (delta.type) {
          case "data-id":
            return {
              ...draft,
              documentId: delta.data,
              status: "streaming" as const,
            };

          case "data-title":
            return {
              ...draft,
              title: delta.data,
              status: "streaming" as const,
            };

          case "data-kind":
            return {
              ...draft,
              kind: delta.data,
              status: "streaming" as const,
            };

          case "data-clear":
            return {
              ...draft,
              content: "",
              status: "streaming" as const,
            };

          case "data-finish": {
            const next = { ...draft, status: "idle" as const };

            // Emit evt. den endelige tekst som fallback
            const text =
              (next as any)?.content?.toString?.() ??
              (next as any)?.content ??
              "";
            if (text && typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("assistant:final", { detail: { text } })
              );
            }
            return next;
          }

          default:
            return draft;
        }
      });
    }
  }, [dataStream, setArtifact, setMetadata, artifact]);

  // Ekstra sikkerhed: hvis vi opdager streaming -> idle, emittes final tekst
  useEffect(() => {
    const current = artifact?.status;
    const prev = prevStatus.current;

    if (prev !== "idle" && current === "idle") {
      const text =
        (artifact as any)?.content?.toString?.() ??
        (artifact as any)?.content ??
        "";

      if (text && typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("assistant:final", { detail: { text } })
        );
      }
    }

    prevStatus.current = current;
  }, [artifact?.status, artifact?.content]);

  return null;
}
