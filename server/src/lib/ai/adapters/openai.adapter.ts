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

  async *generateReplyStream(
    history: ChatHistoryMessage[],
    latestMessage: string,
    model: string
  ): AsyncGenerator<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
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

    if (!response.ok || !response.body) {
      let errorMessage = "OpenAI streaming request failed";

      try {
        const payload = (await response.json()) as OpenAIChatCompletionResponse;
        errorMessage = payload.error?.message || errorMessage;
      } catch {
        // Ignore JSON parsing errors for stream failures.
      }

      throw new Error(errorMessage);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();

        if (!line.startsWith("data: ")) {
          continue;
        }

        const data = line.slice(6).trim();

        if (data === "[DONE]") {
          return;
        }

        try {
          const parsed = JSON.parse(data) as {
            choices?: Array<{
              delta?: {
                content?: string;
              };
            }>;
          };
          const text = parsed.choices?.[0]?.delta?.content;

          if (text) {
            yield text;
          }
        } catch {
          // Ignore malformed stream chunks and continue reading.
        }
      }
    }
  }
}
