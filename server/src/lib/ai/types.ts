export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AIProvider = "gemini" | "openai";

export type AIModelId = string;

export type AIModelOption = {
  id: AIModelId;
  provider: AIProvider;
  label: string;
  description: string;
};

export type GenerateReplyInput = {
  history: ChatHistoryMessage[];
  latestMessage: string;
  provider: AIProvider;
  model: AIModelId;
};
