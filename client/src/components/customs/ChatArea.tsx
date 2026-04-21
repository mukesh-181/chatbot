import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { Send } from "lucide-react";

import { api } from "@/lib/api";
import { mapApiChatMessages, mapApiChatSummary } from "@/lib/chat";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";
import WelcomeBanner from "./WelcomeBanner";
import CodeBlock from "./CodeBlock";
import ReactMarkdown, { type Components } from "react-markdown";

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
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
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
        content:
          "Sorry, I could not get a response right now. Please try again after sometime.",
      });
    } finally {
      setLoading(false);
    }
  };

  const markdownComponents: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");

      // ✅ Code block
      if (match) {
        return <CodeBlock language={match[1]} children={String(children)} />;
      }

      // ✅ Inline code
      return (
        <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm">
          {children}
        </code>
      );
    },
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-6 pb-40 sm:pb-56"
      >
        {messages.length === 0 ? (
          <WelcomeBanner />
        ) : (
          <div className="w-full max-w-full sm:max-w-4xl mx-auto space-y-4 sm:space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`p-2 sm:p-4 rounded-lg w-full sm:w-auto max-w-xs sm:max-w-2xl wrap-break-words ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  }`}
                >
                  <div className="whitespace-pre-wrap wrap-break-words leading-6 sm:leading-7 text-sm sm:text-base">
                    <ReactMarkdown components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="p-3 sm:p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
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

      <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-6 fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 z-10">
        <div className="w-full max-w-full sm:max-w-4xl mx-auto">
          <div className="flex gap-2 sm:gap-4">
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
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
            />
            <Button
              onClick={() => void handleSendMessage()}
              disabled={!input.trim() || loading}
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-1 sm:gap-2 shrink-0"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
