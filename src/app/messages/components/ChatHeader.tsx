"use client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ChatHeader({ partnerName = "User" }: { partnerName?: string }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background p-3">
      <Button variant="ghost" aria-label="Back" className="h-8 w-8 p-0 rounded-full">◄</Button>
      <Avatar className="h-8 w-8"><AvatarFallback>{partnerName[0]}</AvatarFallback></Avatar>
      <div className="flex flex-col">
        <span className="font-semibold">{partnerName}</span>
        <span className="text-xs text-muted-foreground">online</span>
      </div>
    </div>
  );
}
