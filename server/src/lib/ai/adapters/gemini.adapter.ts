import { GoogleGenAI } from "@google/genai";

import { buildUnifiedPrompt } from "../prompt";
import { normalizeAIResponse } from "../responseFormatter";
import type { AIProviderAdapter } from "../interfaces/ai-provider.interface";
import type { ChatHistoryMessage } from "../types";

export class GeminiAdapter implements AIProviderAdapter {
  readonly provider = "gemini" as const;
  private readonly client: GoogleGenAI;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    this.client = new GoogleGenAI({ apiKey });
  }

  async generateReply(
    history: ChatHistoryMessage[],
    latestMessage: string,
    model: string
  ) {
    const result = await this.client.models.generateContent({
      model,
      contents: buildUnifiedPrompt(history, latestMessage),
    });

    const text = result.text?.trim();

    if (!text) {
      throw new Error("Gemini returned an empty response");
    }

    return normalizeAIResponse(text);
  }

  async *generateReplyStream(
    history: ChatHistoryMessage[],
    latestMessage: string,
    model: string
  ): AsyncGenerator<string> {
    const stream = await this.client.models.generateContentStream({
      model,
      contents: buildUnifiedPrompt(history, latestMessage),
    });

    for await (const chunk of stream) {
      const text = chunk.text;

      if (text) {
        yield text;
      }
    }
  }
}
