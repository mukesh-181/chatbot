import { GeminiAdapter } from "../adapters/gemini.adapter";
import { NvidiaAdapter } from "../adapters/nvidia.adapter";
import { OpenAIAdapter } from "../adapters/openai.adapter";
import type { AIProviderAdapter } from "../interfaces/ai-provider.interface";
import type { AIProvider } from "../types";

const providers: Partial<Record<AIProvider, AIProviderAdapter>> = {};

export const getAIProviderAdapter = (provider: AIProvider) => {
  if (!providers[provider]) {
    providers[provider] =
      provider === "gemini"
        ? new GeminiAdapter(process.env.GEMINI_API_KEY)
        : provider === "openai"
          ? new OpenAIAdapter(process.env.OPENAI_API_KEY)
          : new NvidiaAdapter(process.env.NVIDIA_API_KEY);
  }

  const adapter = providers[provider];

  if (!adapter) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return adapter;
};
