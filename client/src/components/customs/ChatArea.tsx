import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/react";

import { api } from "@/lib/api";
import { mapApiChatMessages, type ApiChatDetails } from "@/lib/chat";

import { useChatStore } from "@/store/useChatStore";
import WelcomeBanner from "./WelcomeBanner";

import { markdownComponents } from "./markdownComponents";
import DisplayComponent from "./DisplayComponent";
import { useModels } from "@/hooks/model/useModels";
import { useStreamingChat } from "@/hooks/chat/useStreamingChat";
import ModelSelectionComponent from "./ModelSelectionComponent";
import InputComponents from "./InputComponents";

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
    updateMessageContent,
    upsertChat,
  } = useChatStore();

  const { availableModels, selectedModel, setSelectedModel } = useModels();

  const { streamingMessageId, startStream } = useStreamingChat({
    updateMessageContent,
    setMessages,
    setActiveChatId,
    upsertChat,
    setSelectedModel,
  });

  const selectedModelOption = availableModels.find(
    (model) => model.id === selectedModel,
  );

  const fallbackModelId = availableModels[0]?.id || "";

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

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    addMessage(optimisticUserMessage);
    addMessage({
      id: assistantTempId,
      role: "assistant",
      content: "",
    });
    setLoading(true);

    try {
      await startStream({
        assistantTempId,
        chatId: activeChatId || undefined,
        userId: activeChatId ? undefined : user.id,
        message: trimmedInput,
        provider: selectedModelOption.provider,
        model: selectedModelOption.id,
      });
    } finally {
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
          <DisplayComponent
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
          <ModelSelectionComponent
            availableModels={availableModels}
            selectedModel={selectedModel}
            loading={loading}
            onModelChange={setSelectedModel}
          />

          <InputComponents
            input={input}
            loading={loading}
            textareaRef={textareaRef}
            onInputChange={setInput}
            onSend={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
