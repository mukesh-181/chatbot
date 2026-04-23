import { z } from "zod";
import { getModelById, isValidProviderModelPair } from "../lib/ai/constants";

const modelSchema = z.string().trim().min(1, "model is required");

const aiSelectionSchema = z
  .object({
    provider: z.enum(["gemini", "openai", "nvidia"]).optional(),
    model: modelSchema.optional(),
  })
  .refine(({ model }) => !model || !!getModelById(model), {
    message: "Unsupported AI model",
    path: ["model"],
  })
  .refine(
    ({ provider, model }) =>
      !provider || !model || isValidProviderModelPair(provider, model),
    {
      message: "Selected model does not belong to the chosen provider",
      path: ["model"],
    }
  );

export const createChatSchema = z
  .object({
    userId: z.string().trim().min(1, "userId is required"),
    message: z.string().trim().min(1, "message is required"),
  })
  .merge(aiSelectionSchema);

export const addMessageSchema = z
  .object({
    message: z.string().trim().min(1, "message is required"),
  })
  .merge(aiSelectionSchema);

export const streamChatSchema = z
  .object({
    chatId: z.string().trim().optional(),
    userId: z.string().trim().optional(),
    message: z.string().trim().min(1, "message is required"),
  })
  .merge(aiSelectionSchema)
  .refine(({ chatId, userId }) => !!chatId || !!userId, {
    message: "userId is required when chatId is missing",
    path: ["userId"],
  });

export const buildChatTitle = (message: string) => message.trim().slice(0, 40) || "New Chat";
