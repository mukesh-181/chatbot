import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { Send } from "lucide-react";

import { api } from "@/lib/api";
import { mapApiChatMessages, mapApiChatSummary } from "@/lib/chat";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";
import WelcomeBanner from "./WelcomeBanner";

const ChatArea = () => {
  const [input, setInput] = useState("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const {
    activeChatId,
    loading,
    messages,
    addMessage,
    setActiveChatId,
    setLoading,
    setMessages,
    upsertChat,
  } = useChatStore();

  useEffect(() => {
    const loadActiveChat = async () => {
      if (!activeChatId) {
        setMessages([]);
        return;
      }

      setLoading(true);

      try {
        const res = await api.get(`/chat/${activeChatId}`);
        setMessages(mapApiChatMessages(res.data));
      } catch {
        setMessages([]);
        setActiveChatId(null);
      } finally {
        setLoading(false);
      }
    };

    void loadActiveChat();
  }, [activeChatId, setActiveChatId, setLoading, setMessages]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || !user?.id || loading) {
      return;
    }

    const optimisticUserMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user" as const,
      content: trimmedInput,
    };

    setInput("");
    addMessage(optimisticUserMessage);
    setLoading(true);

    try {
      const res = activeChatId
        ? await api.post(`/chat/${activeChatId}/messages`, {
            message: trimmedInput,
          })
        : await api.post("/chat", {
            userId: user.id,
            message: trimmedInput,
          });

      const chat = res.data;
      setActiveChatId(chat._id);
      setMessages(mapApiChatMessages(chat));
      upsertChat(mapApiChatSummary(chat));
    } catch {
      addMessage({
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I could not get a response right now. Please try again after sometime.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6 pb-56">
        {messages.length === 0 ? (
          <WelcomeBanner />
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-4 rounded-lg max-w-2xl ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  <div className="whitespace-pre-wrap wrap-break-words leading-7">
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:200ms]" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:400ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-6 fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <Button
              onClick={() => void handleSendMessage()}
              disabled={!input.trim() || loading}
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-6 flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
