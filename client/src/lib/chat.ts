import type { ChatSummary, Message } from "@/store/useChatStore";
import type { AIModelId, AIProvider } from "./aiModels";

type ApiMessage = {
  _id?: string;
  role: "user" | "assistant";
  content: string;
};

type ApiChat = {
  _id: string;
  title: string;
  updatedAt: string;
  provider?: AIProvider;
  modelId?: AIModelId;
  messages: ApiMessage[];
};

export type ApiChatDetails = ApiChat;

export const mapApiMessage = (message: ApiMessage, index: number): Message => ({
  id: message._id || `${message.role}-${index}`,
  role: message.role,
  content: message.content,
});

export const mapApiChatSummary = (
  chat: Pick<ApiChat, "_id" | "title" | "updatedAt">
): ChatSummary => ({
  id: chat._id,
  title: chat.title,
  updatedAt: chat.updatedAt,
});

export const mapApiChatMessages = (chat: ApiChat): Message[] =>
  chat.messages.map(mapApiMessage);
