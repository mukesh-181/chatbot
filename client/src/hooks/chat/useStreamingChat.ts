import { useRef, useState } from "react";

import { api } from "@/lib/api";
import {
  mapApiChatMessages,
  mapApiChatSummary,
  type ApiChatDetails,
} from "@/lib/chat";
import { consumeSSEStream } from "@/lib/stream";
import type { AIModelId, AIProvider } from "@/lib/aiModels";
import type { Message } from "@/store/useChatStore";

type StreamRequest = {
  assistantTempId: string;
  chatId?: string;
  userId?: string;
  message: string;
  provider: AIProvider;
  model: AIModelId;
};

type UseStreamingChatParams = {
  updateMessageContent: (messageId: string, content: string) => void;
  setMessages: (messages: Message[]) => void;
  setActiveChatId: (chatId: string | null) => void;
  upsertChat: (chat: {
    id: string;
    title: string;
    updatedAt: string;
  }) => void;
  setSelectedModel: (modelId: AIModelId) => void;
};

const STREAM_ERROR_MESSAGE =
  "Sorry, I could not get a response right now. Please try again after sometime.";

export const useStreamingChat = ({
  updateMessageContent,
  setMessages,
  setActiveChatId,
  upsertChat,
  setSelectedModel,
}: UseStreamingChatParams) => {
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const typingQueueRef = useRef("");
  const displayedTextRef = useRef("");
  const typingPromiseRef = useRef<Promise<void> | null>(null);
  const currentAssistantMessageIdRef = useRef<string | null>(null);

  const flushTypingQueue = async () => {
    if (typingPromiseRef.current) {
      await typingPromiseRef.current;
    }
  };

  const getChunkSize = (queue: string) => {
    if (queue.length < 20) return 1;
    if (queue.length < 100) return 2;
    return 4;
  };

  const getDelay = (text: string) => {
    if (/[.,!?]$/.test(text)) return 120;
    return 16;
  };

  const resetStreamState = () => {
    typingQueueRef.current = "";
    displayedTextRef.current = "";
    typingPromiseRef.current = null;
    currentAssistantMessageIdRef.current = null;
    setStreamingMessageId(null);
  };

  const startTypingDrain = () => {
    if (typingPromiseRef.current) {
      return;
    }

    typingPromiseRef.current = (async () => {
      while (typingQueueRef.current.length > 0) {
        const chunkSize = getChunkSize(typingQueueRef.current);
        const nextSlice = typingQueueRef.current.slice(0, chunkSize);

        typingQueueRef.current = typingQueueRef.current.slice(nextSlice.length);
        displayedTextRef.current += nextSlice;

        if (currentAssistantMessageIdRef.current) {
          updateMessageContent(
            currentAssistantMessageIdRef.current,
            displayedTextRef.current
          );
        }

        await new Promise((resolve) => setTimeout(resolve, getDelay(nextSlice)));
      }

      typingPromiseRef.current = null;
    })();
  };

  const startStream = async ({
    assistantTempId,
    chatId,
    userId,
    message,
    provider,
    model,
  }: StreamRequest) => {
    const baseUrl = api.defaults.baseURL || "";

    currentAssistantMessageIdRef.current = assistantTempId;
    setStreamingMessageId(assistantTempId);
    typingQueueRef.current = "";
    displayedTextRef.current = "";

    try {
      const response = await fetch(`${baseUrl}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId,
          userId,
          message,
          provider,
          model,
        }),
      });

      await consumeSSEStream(response, async (event) => {
        // console.log("Stream event:", event);

        if (event.type === "start") {
          const chat = event.chat as ApiChatDetails;
          upsertChat(mapApiChatSummary(chat));
        }

        if (event.type === "chunk") {
          typingQueueRef.current += event.content;
          startTypingDrain();
          return;
        }

        if (event.type === "complete") {
          await flushTypingQueue();

                // console.log("Stream data:", event.chat);
          const chat = event.chat as ApiChatDetails;
          setActiveChatId(chat._id);
          setMessages(mapApiChatMessages(chat));
          // upsertChat(mapApiChatSummary(chat));
          //  console.log("Stream formatted data:", mapApiChatSummary(chat));

          if (chat.modelId) {
            setSelectedModel(chat.modelId);
          }

          return;
        }

        if (event.type === "error") {
          const err= JSON.parse(JSON.parse(event.error).error.message).error.message
          // const msg = "This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later"
          // console.log("Stream error:", err);
          typingQueueRef.current = "";
          displayedTextRef.current = err || STREAM_ERROR_MESSAGE;
          updateMessageContent(assistantTempId, displayedTextRef.current);
        }
      });
    } catch {
      updateMessageContent(assistantTempId, STREAM_ERROR_MESSAGE);
    } finally {
      resetStreamState();
    }
  };

  return {
    streamingMessageId,
    startStream,
  };
};
