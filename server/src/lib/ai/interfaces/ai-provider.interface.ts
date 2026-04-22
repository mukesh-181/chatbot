import type { AIProvider, ChatHistoryMessage } from "../types";

export interface AIProviderAdapter {
  readonly provider: AIProvider;
  generateReply(history: ChatHistoryMessage[], latestMessage: string, model: string): Promise<string>;
}
