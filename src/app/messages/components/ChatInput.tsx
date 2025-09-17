"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ChatInput() {
  const [text, setText] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setText("");
      }}
      className="border-t bg-background p-3"
    >
      <div className="flex items-center gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message..." />
        <Button type="submit">Send</Button>
      </div>
    </form>
  );
}
