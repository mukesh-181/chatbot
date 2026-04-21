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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

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
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
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
        <code className="bg-white/20 dark:bg-black/30 text-gray-900 dark:text-gray-100 px-2 py-1 rounded font-mono text-sm border border-gray-300 dark:border-gray-600">
          {children}
        </code>
      );
    },
  };

  return (
    <div className="flex flex-col h-full w-full bg-linear-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-6 pb-40 sm:pb-56"
      >
        {messages.length === 0 ? (
          <WelcomeBanner />
        ) : (
          <div className="w-full max-w-full sm:max-w-4xl mx-auto space-y-3 sm:space-y-5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                } animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`p-3 sm:p-4 rounded-2xl w-full sm:w-auto max-w-xs sm:max-w-2xl wrap-break-words transition-all duration-200 ${
                    message.role === "user"
                      ? "bg-blue-100 dark:bg-blue-950 text-gray-900 dark:text-white border border-blue-300 dark:border-blue-800 shadow-md hover:shadow-lg"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
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
                <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" />
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:200ms]" />
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:400ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-6 fixed bottom-0 left-0 w-full bg-white dark:bg-gray-900 z-10 shadow-2xl backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        <div className="w-full max-w-full sm:max-w-4xl mx-auto">
          <div className="flex gap-2 sm:gap-3 items-center">
            <textarea
              ref={textareaRef}
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              disabled={loading}
              rows={1}
              className="flex-1 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 disabled:opacity-50 transition-all duration-200 text-sm sm:text-base shadow-sm resize-none overflow-hidden max-h-52 min-h-10"
            />
            <Button
              onClick={() => void handleSendMessage()}
              disabled={!input.trim() || loading}
              className="bg-linear-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white px-3 sm:px-6 py-2.5 sm:py-3 flex items-center gap-1 sm:gap-2 shrink-0 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
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