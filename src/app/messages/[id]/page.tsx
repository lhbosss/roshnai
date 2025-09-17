"use client";
import ChatHeader from "@/app/messages/components/ChatHeader";
import MessageList, { ChatMessage } from "@/app/messages/components/MessageList";
import ChatInput from "@/app/messages/components/ChatInput";

export default function ChatPage({ params }: { params: { id: string } }) {
  const mockMessages: ChatMessage[] = [
    { id: "1", sender: "them", text: "Hey! Did you finish the book?", timestamp: "10:01 AM" },
    { id: "2", sender: "me", text: "Almost, a few chapters left!", timestamp: "10:03 AM" },
    { id: "3", sender: "them", text: "Nice! Want to swap after?", timestamp: "10:04 AM" },
    { id: "4", sender: "me", text: "Sure, I’ll bring it tomorrow.", timestamp: "10:05 AM" },
    { id: "5", sender: "them", text: "Perfect, thanks!", timestamp: "10:06 AM" },
  ];
  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-3xl mx-auto w-full flex-col">
      <ChatHeader partnerName={`User ${params.id}`} />
      <div className="flex-1 min-h-0">
        <MessageList messages={mockMessages} />
      </div>
      <ChatInput />
    </div>
  );
}
