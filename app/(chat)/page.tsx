// app/(chat)/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { auth } from "../(auth)/auth";

import TTSButtons from "./TTSButtons";
import AutoSpeakObserver from "./AutoSpeakObserver"; // behold KUN denne

export default async function Page() {
  const session = await auth();
  if (!session) redirect("/api/auth/guest");

  const id = generateUUID();
  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get("chat-model");

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
        initialChatModel={modelIdFromCookie?.value || DEFAULT_CHAT_MODEL}
      />
      <DataStreamHandler />

      {/* Manuel TTS + autospeak kun når AI-svar er færdigt */}
      <div className="mt-4 space-y-3">
        <TTSButtons />
        <AutoSpeakObserver />
      </div>
    </>
  );
}
