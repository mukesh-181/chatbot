import { addMessageSchema, buildChatTitle, createChatSchema } from "../utils/zodValidation";
import { generateChatReply } from "../lib/gemini";
import { Chat } from "../models/chat.model";
import { formatError } from "zod";





export const createNewChat = async (req: any, res: any) => {
  const parsed = createChatSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error:formatError(parsed.error)});
  }

  const { userId, message } = parsed.data;

  try {
    const reply = await generateChatReply([], message);

    const chat = await Chat.create({
      userId,
      title: buildChatTitle(message),
      messages: [
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ],
    });

    return res.status(201).json(chat);
  } catch (error) {
    console.error("Create chat failed:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
}



export const getIndividualChatDetails =async (req : any, res : any) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  return res.json(chat);
}





export const updatePrevChat = async (req: any, res: any) => {
  const parsed = addMessageSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: formatError(parsed.error) });
  }

  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  const { message } = parsed.data;

  try {
    const history = chat.messages.map((item) => ({
      role: item.role,
      content: item.content,
    })).slice(-8);

    console.log("Chat history for reply generation:", history);

    const reply = await generateChatReply(history, message);

    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "assistant", content: reply });

    if (!chat.title?.trim()) {
      chat.title = buildChatTitle(message);
    }

    await chat.save();

    return res.json(chat);
  } catch (error) {
    console.error("Add message failed:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
}




export const getUserChats = async (req: any, res: any) => {
  const chats = await Chat.find({ userId: req.params.userId })
    .sort({ updatedAt: -1 })
    .select("_id title updatedAt")
    .lean();

    const formattedChats = chats.map((chat) => ({
      _id: String(chat._id),
      title: chat.title,
      updatedAt: chat.updatedAt,
    }))
  return res.json(
    formattedChats
  );
}




export const deleteChat = async (req: any, res: any) => {
  const chat = await Chat.findByIdAndDelete(req.params.id);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  return res.json({ success: true });
};


