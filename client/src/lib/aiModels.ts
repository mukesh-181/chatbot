export type AIProvider = "gemini" | "openai";

export type AIModelId = string;

export type AIModelOption = {
  id: AIModelId;
  provider: AIProvider;
  label: string;
  description?: string;
};

export type AvailableModelsResponse = {
  defaultModel: AIModelId | null;
  models: AIModelOption[];
};
