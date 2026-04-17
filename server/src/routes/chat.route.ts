import { Router } from "express";
import { z } from "zod";
import { Chat } from "../models/chat.model";

const router = Router();

const createChatSchema = z.object({
  userId: z.string().trim().min(1, "userId is required"),
  message: z.string().trim().min(1, "message is required"),
});

const addMessageSchema = z.object({
  message: z.string().trim().min(1, "message is required"),
});

const buildAssistantReply = (message: string) => `Echo: ${message}`;

router.post("/", async (req, res) => {
  const parsed = createChatSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { userId, message } = parsed.data;
  const reply = buildAssistantReply(message);

  const chat = new Chat({
    userId,
    title: message.slice(0, 30),
    messages: [
      { role: "user", content: message },
      { role: "assistant", content: reply },
    ],
  });

  await chat.save();

  return res.status(201).json(chat);
});

router.post("/:id/messages", async (req, res) => {
  const parsed = addMessageSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  const { message } = parsed.data;
  const reply = buildAssistantReply(message);

  chat.messages.push({ role: "user", content: message });
  chat.messages.push({ role: "assistant", content: reply });

  await chat.save();

  return res.json(chat);
});

router.get("/user/:userId", async (req, res) => {
  const chats = await Chat.find({ userId: req.params.userId })
    .sort({ updatedAt: -1 })
    .select("_id title updatedAt")
    .lean();

  return res.json(
    chats.map((chat) => ({
      _id: String(chat._id),
      title: chat.title,
      updatedAt: chat.updatedAt,
    }))
  );
});

router.get("/:id", async (req, res) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  return res.json(chat);
});

export default router;
