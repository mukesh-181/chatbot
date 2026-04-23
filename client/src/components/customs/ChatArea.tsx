import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";
import { Send } from "lucide-react";

import { api } from "@/lib/api";
import {
  mapApiChatMessages,
  mapApiChatSummary,
  type ApiChatDetails,
} from "@/lib/chat";
import { consumeSSEStream } from "@/lib/stream";
import type {
  AIModelId,
  AIModelOption,
  AvailableModelsResponse,
} from "@/lib/aiModels";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";
import WelcomeBanner from "./WelcomeBanner";

import { markdownComponents } from "./markdownComponents";
import HistoryCard from "./HistoryCard";

const ChatArea = () => {
  const [input, setInput] = useState("");
  const [availableModels, setAvailableModels] = useState<AIModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModelId>("");
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingQueueRef = useRef("");
  const displayedTextRef = useRef("");
  const typingPromiseRef = useRef<Promise<void> | null>(null);
  const currentAssistantMessageIdRef = useRef<string | null>(null);

  const { user } = useUser();

  const {
    activeChatId,
    loading,
    messages,
    addMessage,
    setActiveChatId,
    setLoading,
    setMessages,
    updateMessageContent,
    upsertChat,
  } = useChatStore();

  const selectedModelOption = availableModels.find(
    (model) => model.id === selectedModel,
  );

  const fallbackModelId = availableModels[0]?.id || "";

  // 🔹 Load models
  useEffect(() => {
    const loadAvailableModels = async () => {
      try {
        const res = await api.get("/chat/models");
        const data = res.data as AvailableModelsResponse;

        setAvailableModels(data.models);

        setSelectedModel((currentModel) => {
          if (
            currentModel &&
            data.models.some((model) => model.id === currentModel)
          ) {
            return currentModel;
          }

          if (
            data.defaultModel &&
            data.models.some((model) => model.id === data.defaultModel)
          ) {
            return data.defaultModel;
          }

          return data.models[0]?.id || "";
        });
      } catch {
        setAvailableModels([]);
      }
    };

    void loadAvailableModels();
  }, []);

  // 🔹 Ensure valid model
  useEffect(() => {
    if (availableModels.length === 0) return;

    if (!selectedModelOption) {
      setSelectedModel(fallbackModelId);
    }
  }, [availableModels, fallbackModelId, selectedModelOption]);

  // 🔹 Load active chat
  useEffect(() => {
    const loadActiveChat = async () => {
      if (!activeChatId) {
        setMessages([]);
        return;
      }

      setLoading(true);

      try {
        const res = await api.get(`/chat/${activeChatId}`);
        const chat = res.data as ApiChatDetails;
        const nextMessages = mapApiChatMessages(chat);

        setMessages(nextMessages);

        if (
          chat.modelId &&
          availableModels.some((model) => model.id === chat.modelId)
        ) {
          setSelectedModel(chat.modelId);
        } else if (!chat.modelId && fallbackModelId) {
          setSelectedModel(fallbackModelId);
        }
      } catch {
        setMessages([]);
        setActiveChatId(null);
      } finally {
        setLoading(false);
      }
    };

    void loadActiveChat();
  }, [
    activeChatId,
    availableModels,
    fallbackModelId,
    setActiveChatId,
    setLoading,
    setMessages,
  ]);

  // 🔹 Auto scroll
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // 🔹 Auto resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";

    const newHeight = Math.min(el.scrollHeight, 200);
    el.style.height = `${newHeight}px`;

    el.style.overflowY = el.scrollHeight > 200 ? "auto" : "hidden";
  }, [input]);

  // 🔹 Send message
  const handleSendMessage = async () => {
    const trimmedInput = input.trim();

    if (!trimmedInput || !user?.id || loading) return;

    if (!selectedModelOption) return;

    const optimisticUserMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user" as const,
      content: trimmedInput,
    };
    const assistantTempId = `temp-assistant-${Date.now()}`;

    const flushTypingQueue = async () => {
      if (typingPromiseRef.current) {
        await typingPromiseRef.current;
      }
    };

    const startTypingDrain = () => {
      if (typingPromiseRef.current) {
        return;
      }

      typingPromiseRef.current = (async () => {
        while (typingQueueRef.current.length > 0) {
          const nextSlice = typingQueueRef.current.slice(0, 5);
          typingQueueRef.current = typingQueueRef.current.slice(nextSlice.length);
          displayedTextRef.current += nextSlice;
          if (currentAssistantMessageIdRef.current) {
            updateMessageContent(
              currentAssistantMessageIdRef.current,
              displayedTextRef.current,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 8));
        }

        typingPromiseRef.current = null;
      })();
    };

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    addMessage(optimisticUserMessage);
    addMessage({
      id: assistantTempId,
      role: "assistant",
      content: "",
    });
    currentAssistantMessageIdRef.current = assistantTempId;
    setStreamingMessageId(assistantTempId);
    typingQueueRef.current = "";
    displayedTextRef.current = "";
    setLoading(true);

    try {
      const baseUrl = api.defaults.baseURL || "";
      const response = await fetch(`${baseUrl}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: activeChatId || undefined,
          userId: activeChatId ? undefined : user.id,
          message: trimmedInput,
          provider: selectedModelOption.provider,
          model: selectedModelOption.id,
        }),
      });

      await consumeSSEStream(response, async (event) => {
        if (event.type === "chunk") {
          typingQueueRef.current += event.content;
          startTypingDrain();
          return;
        }

        if (event.type === "complete") {
          await flushTypingQueue();

          const chat = event.chat as ApiChatDetails;
          setActiveChatId(chat._id);
          setMessages(mapApiChatMessages(chat));
          upsertChat(mapApiChatSummary(chat));

          if (chat.modelId) {
            setSelectedModel(chat.modelId);
          }

          return;
        }

        if (event.type === "error") {
          typingQueueRef.current = "";
          displayedTextRef.current = event.error;
          if (currentAssistantMessageIdRef.current) {
            updateMessageContent(currentAssistantMessageIdRef.current, event.error);
          }
        }
      });
    } catch {
      if (currentAssistantMessageIdRef.current) {
        updateMessageContent(
          currentAssistantMessageIdRef.current,
          "Sorry, I could not get a response right now. Please try again after sometime.",
        );
      }
    } finally {
      typingQueueRef.current = "";
      displayedTextRef.current = "";
      typingPromiseRef.current = null;
      currentAssistantMessageIdRef.current = null;
      setStreamingMessageId(null);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-linear-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      {/* 🔹 Chat Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-6 pb-40 sm:pb-56"
      >
        {messages.length === 0 ? (
          <WelcomeBanner />
        ) : (
          <HistoryCard
            messages={messages}
            loading={loading}
            streamingMessageId={streamingMessageId}
            markdownComponents={markdownComponents}
          />
        )}
      </div>

      {/* 🔹 Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3 sm:p-6 fixed bottom-0 left-0 lg:left-64 w-full lg:w-[calc(100%-16rem)] bg-white dark:bg-gray-900 z-10 shadow-2xl backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        <div className="w-full max-w-full sm:max-w-4xl mx-auto">
          {/* Model Select */}
          <div className="mb-4 flex justify-end">
            <div className="relative">
              {/* Label (optional but improves UX) */}
              <span className="absolute -top-2 left-3 px-1 text-xs bg-white dark:bg-gray-900 text-gray-500">
                Model
              </span>

              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={loading || availableModels.length === 0}
                className="appearance-none bg-white dark:bg-gray-900 
      border border-gray-300 dark:border-gray-700
      text-sm font-medium text-gray-900 dark:text-white
      rounded-full px-4 py-2 pr-10
      shadow-sm
      focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white
      hover:border-gray-400 dark:hover:border-gray-500
      transition-all duration-200
      disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.label}
                  </option>
                ))}
              </select>

              {/* Custom Dropdown Arrow */}
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                ▼
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-2 sm:gap-3 items-center">
            <textarea
              ref={textareaRef}
              value={input}
              placeholder="Ask me anything..."
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              disabled={loading}
              rows={1}
              className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />

            <Button
              onClick={() => void handleSendMessage()}
              disabled={!input.trim() || loading}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
