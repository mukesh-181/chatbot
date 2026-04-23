import OpenAI from "openai";

import { buildUnifiedPrompt } from "../prompt";
import { normalizeAIResponse } from "../responseFormatter";
import type { AIProviderAdapter } from "../interfaces/ai-provider.interface";
import type { ChatHistoryMessage } from "../types";

const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";
const NVIDIA_TIMEOUT_MS = 45_000;
const NVIDIA_SYSTEM_MESSAGE =
  "You must follow the formatting and behavior instructions in the provided prompt exactly.";

const getNvidiaErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "NVIDIA request failed";
};

export class NvidiaAdapter implements AIProviderAdapter {
  readonly provider = "nvidia" as const;
  private readonly client: OpenAI;

  constructor(apiKey: string | undefined) {
    if (!apiKey) {
      throw new Error("NVIDIA_API_KEY is not configured");
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: NVIDIA_BASE_URL,
      timeout: NVIDIA_TIMEOUT_MS,
      maxRetries: 0,
    });
  }

  async generateReply(
    history: ChatHistoryMessage[],
    latestMessage: string,
    model: string
  ) {
    try {
      const completion = await this.client.chat.completions.create({
        model,
        temperature: 1,
        top_p: 0.7,
        max_tokens: 4096,
        messages: [
          {
            role: "system",
            content: NVIDIA_SYSTEM_MESSAGE,
          },
          {
            role: "user",
            content: buildUnifiedPrompt(history, latestMessage),
          },
        ],
      });

      const text = completion.choices[0]?.message?.content?.trim();

      if (!text) {
        throw new Error("NVIDIA returned an empty response");
      }

      return normalizeAIResponse(text);
    } catch (error) {
      throw new Error(getNvidiaErrorMessage(error));
    }
  }

  async *generateReplyStream(
    history: ChatHistoryMessage[],
    latestMessage: string,
    model: string
  ): AsyncGenerator<string> {
    try {
      const stream = await this.client.chat.completions.create({
        model,
        temperature: 1,
        top_p: 0.7,
        max_tokens: 4096,
        stream: true,
        messages: [
          {
            role: "system",
            content: NVIDIA_SYSTEM_MESSAGE,
          },
          {
            role: "user",
            content: buildUnifiedPrompt(history, latestMessage),
          },
        ],
      });

      let hasContent = false;

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;

        if (text) {
          hasContent = true;
          yield text;
        }
      }

      if (!hasContent) {
        throw new Error("NVIDIA returned an empty streamed response");
      }
    } catch (error) {
      throw new Error(getNvidiaErrorMessage(error));
    }
  }
}
