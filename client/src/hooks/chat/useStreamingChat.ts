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
  setMessages: (messages: Message[]) => void;
  setActiveChatId: (chatId: string | null) => void;
  upsertChat: (chat: {
    id: string;
    title: string;
    updatedAt: string;
  }) => void;
  setSelectedModel: (modelId: AIModelId) => void;
  setStreamingChatId: (chatId: string | null) => void;
  setStreamingMessageId: (messageId: string | null) => void;
  updateStreamingMessageContent: (messageId: string, content: string) => void;
  setStreamingMessages: (messages: Message[]) => void;
  clearStreamingMessages: () => void;
};

const STREAM_ERROR_MESSAGE =
  "Sorry, I could not get a response right now. Please try again after sometime.";

export const useStreamingChat = ({
  setMessages,
  setActiveChatId,
  upsertChat,
  setSelectedModel,
  setStreamingChatId,
  setStreamingMessageId,
  updateStreamingMessageContent,
  setStreamingMessages,
  clearStreamingMessages,
}: UseStreamingChatParams) => {
  const [isStreaming, setIsStreaming] = useState(false);

  const typingQueueRef = useRef("");
  const displayedTextRef = useRef("");
  const typingPromiseRef = useRef<Promise<void> | null>(null);
  const currentAssistantMessageIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const flushTypingQueue = async () => {
    if (typingPromiseRef.current) {
      await typingPromiseRef.current;
    }
  };

  const getChunkSize = (queue: string) => {
    // Increase chunk sizes for faster display
    if (queue.length < 50) return 5;
    if (queue.length < 200) return 15;
    return 25;
  };

  const getDelay = (text: string) => {
    // Shorter delays for faster streaming
    if (/[.,!?]$/.test(text)) return 8;
    return 4;
  };

  const resetStreamState = () => {
    typingQueueRef.current = "";
    displayedTextRef.current = "";
    typingPromiseRef.current = null;
    currentAssistantMessageIdRef.current = null;
    setIsStreaming(false);
    abortControllerRef.current = null;
    setStreamingChatId(null);
    setStreamingMessageId(null);
    clearStreamingMessages();
  };

  const abortStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      resetStreamState();
    }
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
          updateStreamingMessageContent(
            currentAssistantMessageIdRef.current,
            displayedTextRef.current
          );
        }

        // Use dynamic delay based on punctuation
        const delay = getDelay(nextSlice);
        await new Promise((resolve) => setTimeout(resolve, delay));
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
    setIsStreaming(true);
    typingQueueRef.current = "";
    displayedTextRef.current = "";

    // Create a new AbortController for this stream
    abortControllerRef.current = new AbortController();

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
        signal: abortControllerRef.current.signal,
      });

      await consumeSSEStream(response, async (event) => {
        // console.log("Stream event:", event);

        if (event.type === "start") {
          const chat = event.chat as ApiChatDetails;
          upsertChat(mapApiChatSummary(chat));
          // Track which chat is streaming
          setStreamingChatId(chat._id);
          
          // Initialize streaming messages - capture current messages and add streaming assistant message
          const messages = mapApiChatMessages(chat);
          const assistantMessage: Message = {
            id: assistantTempId,
            role: "assistant",
            content: "",
          };
          setStreamingMessages([...messages, assistantMessage]);
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
          updateStreamingMessageContent(assistantTempId, displayedTextRef.current);
        }
      });
    } catch (error) {
      // Don't show error message if the request was aborted
      if (error instanceof DOMException && error.name === "AbortError") {
        // User clicked stop - keep the partial message that was already displayed
        return;
      }
      updateStreamingMessageContent(assistantTempId, STREAM_ERROR_MESSAGE);
    } finally {
      resetStreamState();
    }
  };

  return {
    isStreaming,
    startStream,
    abortStream,
  };
};
