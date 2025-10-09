"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";

import { ChatHeader } from "@/components/chat-header";
import { MultimodalInput } from "./multimodal-input";
import { Messages } from "./messages";
import { Artifact } from "./artifact";
import { useArtifactSelector } from "@/hooks/use-artifact";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import type { VisibilityType } from "./visibility-selector";
import { fetcher, generateUUID } from "@/lib/utils";
import { getChatHistoryPaginationKey } from "./sidebar-history";

/** Hjælper: lav en assistentbesked (uden createdAt/attachments) */
function toAssistantMessage(text: string): ChatMessage {
  return {
    id: generateUUID(),
    role: "assistant",
    parts: [{ type: "text", text }],
  } as ChatMessage;
}

/** Hjælper: konverter ChatMessage[] → API-format (role + content) */
function serializeMessagesForApi(msgs: ChatMessage[]) {
  return msgs.map((m) => {
    const text =
      (m.parts || [])
        .map((p) => (p.type === "text" ? p.text : ""))
        .join(" ")
        .trim() || "";
    return { role: m.role, content: text };
  });
}

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialLastContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const { visibilityType } = useChatVisibility({ chatId: id, initialVisibilityType });
  const isArtifactVisible = useArtifactSelector((s) => s.isVisible);
  const { mutate } = useSWRConfig();

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [input, setInput] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  // (valgfrit — behold for konsistens)
  useSWR(messages.length >= 2 ? `/api/vote?chatId=${id}` : null, fetcher);

  /** Midlertidig debug-funktion: kalder /api/chat?mode=json */
  async function sendMessageDebug(userText: string) {
    if (!userText.trim()) return;
    setStatus("submitting");

    // 1) Tilføj brugerbesked lokalt
    const userMsg: ChatMessage = {
      id: generateUUID(),
      role: "user",
      parts: [{ type: "text", text: userText }],
    } as ChatMessage;

    setMessages((prev) => [...prev, userMsg]);

    try {
      // 2) Kald API i debug-mode
      const current = [...messages, userMsg];
      const payload = {
        id,
        message: userMsg,
        messages: serializeMessagesForApi(current),
        mode: "json",
        selectedChatModel: initialChatModel,
        selectedVisibilityType: visibilityType,
      };

      const res = await fetch("/api/chat?mode=json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 3) Læs svar og tilføj assistentbesked
      const data = await res.json().catch(() => ({} as any));
      const replyText: string =
        typeof data?.reply === "string"
          ? data.reply
          : "Hej! (debug) – intet gyldigt svar fra serveren.";

      setMessages((prev) => [...prev, toAssistantMessage(replyText)]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        toAssistantMessage("Ups – der skete en fejl i debug-kaldet."),
      ]);
    } finally {
      setStatus("idle");
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    }
  }

  // Håndter evt. ?query=... i URL
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const hasHandledQueryRef = useRef(false);
  useEffect(() => {
    if (query && !hasHandledQueryRef.current) {
      hasHandledQueryRef.current = true;
      void sendMessageDebug(query);
      window.history.replaceState({}, "", `/chat/${id}`);
    }
  }, [query, id]);

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader
          chatId={id}
          isReadonly={isReadonly}
          selectedVisibilityType={initialVisibilityType}
        />

        <Messages
          chatId={id}
          isArtifactVisible={isArtifactVisible}
          isReadonly={isReadonly}
          messages={messages}
          regenerate={() => {}}
          selectedModelId={initialChatModel}
          setMessages={setMessages}
          status={status}
          votes={undefined}
        />

        <div className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4">
          {!isReadonly && (
            <MultimodalInput
              attachments={[]} // ikke i brug nu
              chatId={id}
              input={input}
              messages={messages}
              onModelChange={() => {}}
              selectedModelId={initialChatModel}
              selectedVisibilityType={visibilityType}
              sendMessage={async ({ content }) => {
                await sendMessageDebug(content);
                setInput("");
              }}
              setAttachments={() => {}}
              setInput={setInput}
              setMessages={setMessages}
              status={status}
              stop={() => {}}
              usage={undefined}
            />
          )}
        </div>
      </div>

      <Artifact
        attachments={[]} // placeholder
        chatId={id}
        input={input}
        isReadonly={isReadonly}
        messages={messages}
        regenerate={() => {}}
        selectedModelId={initialChatModel}
        selectedVisibilityType={visibilityType}
        sendMessage={async () => {}}
        setAttachments={() => {}}
        setInput={setInput}
        setMessages={setMessages}
        status={status}
        stop={() => {}}
        votes={undefined}
      />
    </>
  );
}
