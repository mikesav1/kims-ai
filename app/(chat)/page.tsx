import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { auth } from "../(auth)/auth";

import TTSButtons from "./TTSButtons";
import AutoSpeakObserver from "./AutoSpeakObserver"; 
import AutoSpeakDOM from "./AutoSpeakDOM";   // 👈 NY fallback

export default async function Page() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  const id = generateUUID();
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  const chatProps = {
    autoResume: false,
    id,
    initialMessages: [],
    initialVisibilityType: "private" as const,
    isReadonly: false,
    key: id,
  };

  return (
    <>
      <Chat
        {...chatProps}
        initialChatModel={modelIdFromCookie?.value || DEFAULT_CHAT_MODEL}
      />
      <DataStreamHandler />

      {/* TTS UI */}
      <div className="mt-4 space-y-3">
        <TTSButtons />
        <AutoSpeakObserver />   {/* bruger 'assistant:final' event */}
        <AutoSpeakDOM />        {/* fallback: scanner DOM for sidste assistent-svar */}
      </div>

      <div className="text-xs opacity-60">
        AutoSpeak v3 • build check
      </div>
    </>
  );
}
