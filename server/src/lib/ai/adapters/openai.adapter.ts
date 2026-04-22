import { buildUnifiedPrompt } from "../prompt";
import { normalizeAIResponse } from "../responseFormatter";
import type { AIProviderAdapter } from "../interfaces/ai-provider.interface";
import type { ChatHistoryMessage } from "../types";

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class OpenAIAdapter implements AIProviderAdapter {
  readonly provider = "openai" as const;
  private readonly apiKey: string;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    this.apiKey = apiKey;
  }

  async generateReply(
    history: ChatHistoryMessage[],
    latestMessage: string,
    model: string
  ) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "developer",
            content:
              "You must follow the formatting and behavior instructions in the provided prompt exactly.",
          },
          {
            role: "user",
            content: buildUnifiedPrompt(history, latestMessage),
          },
        ],
      }),
    });

    const payload = (await response.json()) as OpenAIChatCompletionResponse;

    if (!response.ok) {
      throw new Error(payload.error?.message || "OpenAI request failed");
    }

    const text = payload.choices?.[0]?.message?.content?.trim();

    if (!text) {
      throw new Error("OpenAI returned an empty response");
    }

    return normalizeAIResponse(text);
  }
}
