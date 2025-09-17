"use client";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "@/app/messages/components/TypingIndicator";

export type ChatMessage = { id: string; sender: "me" | "them"; text: string; timestamp: string };

export default function MessageList({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-3">
      {messages.map((m) => (
        <MessageBubble key={m.id} side={m.sender === "me" ? "right" : "left"}>
          {m.text}
          <div className="mt-1 text-[10px] opacity-70">{m.timestamp}</div>
        </MessageBubble>
      ))}
      <div className="mt-2">
        <TypingIndicator />
      </div>
    </div>
  );
}
