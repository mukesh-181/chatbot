import type { AIModelId, AIModelOption, AIProvider } from "./types";

export const AI_MODELS: AIModelOption[] = [
  {
    id: "gemini-2.5-flash-lite",
    provider: "gemini",
    label: "Gemini Flash-Lite",
    description: "Fastest Gemini option for everyday chat.",
  },
  {
    id: "gemini-2.5-flash",
    provider: "gemini",
    label: "Gemini Flash",
    description: "Stronger Gemini model for richer answers.",
  },
  {
    id: "gpt-4.1-mini",
    provider: "openai",
    label: "ChatGPT 4.1 Mini",
    description: "Fast OpenAI model with lower cost and latency.",
  },
  {
    id: "gpt-4.1",
    provider: "openai",
    label: "ChatGPT 4.1",
    description: "Stronger OpenAI model for deeper responses.",
  },
];

export const DEFAULT_AI_MODEL: AIModelId = "gemini-2.5-flash-lite";

export const DEFAULT_AI_PROVIDER: AIProvider = "gemini";

export const getModelById = (model: AIModelId) =>
  AI_MODELS.find((item) => item.id === model);

export const getAvailableAIModels = () => AI_MODELS;

export const getProviderForModel = (model: AIModelId): AIProvider =>
  getModelById(model)?.provider || DEFAULT_AI_PROVIDER;

export const isValidProviderModelPair = (
  provider: AIProvider,
  model: AIModelId
) => getProviderForModel(model) === provider;

export const resolveAISelection = (selection?: {
  provider?: AIProvider | string;
  model?: AIModelId | string;
}) => {
  if (
    selection?.provider &&
    selection.provider !== "gemini" &&
    selection.provider !== "openai"
  ) {
    throw new Error("Unsupported AI provider");
  }

  if (selection?.model && !getModelById(selection.model as AIModelId)) {
    throw new Error("Unsupported AI model");
  }

  const model = (selection?.model as AIModelId | undefined) || DEFAULT_AI_MODEL;
  const provider =
    (selection?.provider as AIProvider | undefined) || getProviderForModel(model);

  if (!isValidProviderModelPair(provider, model)) {
    throw new Error("Selected model does not belong to the chosen provider");
  }

  return { provider, model };
};
