import { z } from "zod";
import { isValidProviderModelPair } from "../lib/ai/constants";

const modelSchema = z.enum([
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gpt-4.1-mini",
  "gpt-4.1",
]);

const aiSelectionSchema = z
  .object({
    provider: z.enum(["gemini", "openai"]).optional(),
    model: modelSchema.optional(),
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

export const buildChatTitle = (message: string) => message.trim().slice(0, 40) || "New Chat";
