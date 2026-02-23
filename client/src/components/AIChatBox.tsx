import React, { useState, useRef, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

export type Message = {
  role: "system" | "user" | "assistant" | string;
  content: string;
};

export type AIChatBoxProps = {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  height?: string;
  emptyStateMessage?: string;
  suggestedPrompts?: string[];
};

export const AIChatBox: React.FC<AIChatBoxProps> = ({
  messages,
  onSendMessage,
  isLoading = false,
  placeholder = "Say something...",
  height = "400px",
  emptyStateMessage = "No messages yet",
  suggestedPrompts = [],
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // scroll to bottom whenever messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea
        className="flex-1 mb-2 p-2 space-y-2 border rounded-md"
        style={{ height }}
        ref={scrollRef as any}
      >
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground">
            {emptyStateMessage}
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={
              msg.role === "user"
                ? "text-right"
                : msg.role === "assistant"
                ? "text-left"
                : "text-center"
            }
          >
            <span
              className={
                msg.role === "user"
                  ? "inline-block bg-primary text-primary-foreground px-3 py-1 rounded-lg"
                  : msg.role === "assistant"
                  ? "inline-block bg-secondary text-secondary-foreground px-3 py-1 rounded-lg"
                  : "italic text-sm text-muted-foreground"
              }
            >
              {msg.content}
            </span>
          </div>
        ))}
      </ScrollArea>

      {suggestedPrompts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {suggestedPrompts.map((p, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              onClick={() => {
                onSendMessage(p);
              }}
            >
              {p}
            </Button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
        </Button>
      </form>
    </div>
  );
};
