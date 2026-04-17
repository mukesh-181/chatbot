import { z } from "zod";

export const createChatSchema = z.object({
  userId: z.string().trim().min(1, "userId is required"),
  message: z.string().trim().min(1, "message is required"),
});

export const addMessageSchema = z.object({
  message: z.string().trim().min(1, "message is required"),
});

export const buildChatTitle = (message: string) => message.trim().slice(0, 40) || "New Chat";