import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AIChatBox, Message } from "@/components/AIChatBox";
import { toast } from "sonner";

export default function Chat() {
  // redirect unauthenticated users to login
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });

  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // using main layout since chat lives in standard sidebar

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (response) => {
      const content = response.choices?.[0]?.message?.content;
      if (content) {
        setChatMessages((prev) => [...prev, { role: "assistant", content }]);
      }
      setIsChatLoading(false);
    },
    onError: (err) => {
      console.error("Chat mutation error", err);
      setIsChatLoading(false);
      toast.error("Unable to reach AI service");
    },
  });

  const handleSend = (content: string) => {
    const newMsgs = [...chatMessages, { role: "user", content }];
    setChatMessages(newMsgs);
    setIsChatLoading(true);
    chatMutation.mutate({ messages: newMsgs });
  };

  if (loading) return null; // or a spinner

  if (!isAuthenticated) {
    return null; // useAuth will redirect
  }

  return (
    <div className="min-h-screen p-4 bg-background">
        <h1 className="text-2xl font-bold mb-4">AI Chat</h1>
        <div className="h-[70vh]">
          <AIChatBox
            messages={chatMessages}
            onSendMessage={handleSend}
            isLoading={isChatLoading}
            placeholder="Ask the AI anything..."
            emptyStateMessage="Start the conversation by typing a message"
            suggestedPrompts={[
              "Explain roguescript obfuscation",
              "How does HWID ban work?",
              "What features does Roguard have?",
            ]}
            height="100%"
          />
        </div>
    </div>
  );
}
