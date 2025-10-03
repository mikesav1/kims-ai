"use client";

import { useEffect, useRef } from "react";
import { initialArtifactData, useArtifact } from "@/hooks/use-artifact";
import { artifactDefinitions } from "./artifact";
import { useDataStream } from "./data-stream-provider";

export function DataStreamHandler() {
  const { dataStream } = useDataStream();
  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);

  // 👇 Nyt: track forrige status
  const prevStatus = useRef<string | undefined>(artifact?.status);

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    for (const delta of newDeltas) {
      const artifactDefinition = artifactDefinitions.find(
        (currentArtifactDefinition) =>
          currentArtifactDefinition.kind === artifact.kind
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      setArtifact((draftArtifact) => {
        if (!draftArtifact) {
          return { ...initialArtifactData, status: "streaming" };
        }

        switch (delta.type) {
          case "data-id":
            return { ...draftArtifact, documentId: delta.data, status: "streaming" };

          case "data-title":
            return { ...draftArtifact, title: delta.data, status: "streaming" };

          case "data-kind":
            return { ...draftArtifact, kind: delta.data, status: "streaming" };

          case "data-clear":
            return { ...draftArtifact, content: "", status: "streaming" };

          case "data-finish": {
            const next = { ...draftArtifact, status: "idle" };
            const text =
              (next as any)?.content?.toString?.() ??
              (next as any)?.content ??
              "";
            if (text && typeof window !== "undefined") {
              console.log("[DSH] Fallback dispatch on data-finish:", text.slice(0, 120));
              window.dispatchEvent(new CustomEvent("assistant:final", { detail: { text } }));
            }
            return next;
          }

          default:
            return draftArtifact;
        }
      });
    }
  }, [dataStream, setArtifact, setMetadata, artifact]);

  // 👇 Nyt: ekstra sikkerhed – status-overvågning
  useEffect(() => {
    const current = artifact?.status;
    const prev = prevStatus.current;

    if (prev !== "idle" && current === "idle") {
      const text =
        (artifact as any)?.content?.toString?.() ??
        (artifact as any)?.content ??
        "";

      console.log("[DSH] streaming -> idle. Text length:", text?.length ?? 0);

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
