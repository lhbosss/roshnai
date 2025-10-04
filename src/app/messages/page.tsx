"use client";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useWebSocket } from "@/lib/realtime";

type Conversation = { id: string; name: string; lastMessage: string; time: string };

const conversations: Conversation[] = [
  { id: "1", name: "Alice Johnson", lastMessage: "See you at 5?", time: "2m" },
  { id: "2", name: "Bob Smith", lastMessage: "Got the book, thanks!", time: "8m" },
  { id: "3", name: "Carla Reyes", lastMessage: "Lol that was great 😂", time: "14m" },
  { id: "4", name: "David Kim", lastMessage: "Sending it now.", time: "1h" },
  { id: "5", name: "Emma Brown", lastMessage: "Let’s catch up tomorrow.", time: "3h" },
];

export default function MessagesPage() {
  // Connect to real-time messaging WebSocket
  const { isConnected, sendMessage } = useWebSocket('ws://localhost:3001/messages');

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Messages</h1>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {conversations.map((c) => (
          <Link key={c.id} href={`/messages/${c.id}`} className="block">
            <Card className="flex items-center gap-3 p-3 hover:bg-gray-50">
              <Avatar>
                <AvatarImage alt={c.name} />
                <AvatarFallback>{c.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{c.name}</p>
                  <span className="text-xs text-muted-foreground">{c.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
