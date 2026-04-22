import { addMessageSchema, buildChatTitle, createChatSchema } from "../utils/zodValidation";
import { getAvailableAIModels, resolveAISelection } from "../lib/ai/constants";
import { generateChatReply } from "../lib/ai/services/chat-completion.service";
import { Chat } from "../models/chat.model";
import { formatError } from "zod";





export const createNewChat = async (req: any, res: any) => {
  const parsed = createChatSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error:formatError(parsed.error)});
  }

  const { userId, message } = parsed.data;
  const { provider, model } = resolveAISelection(parsed.data);

  try {
    const reply = await generateChatReply({
      history: [],
      latestMessage: message,
      provider,
      model,
    });

    const chat = await Chat.create({
      userId,
      title: buildChatTitle(message),
      provider,
      modelId: model,
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
  const { provider, model } = resolveAISelection({
    provider: parsed.data.provider || chat.provider,
    model: parsed.data.model || chat.modelId,
  });

  try {
    const history = chat.messages.map((item) => ({
      role: item.role,
      content: item.content,
    })).slice(-8);

    const reply = await generateChatReply({
      history,
      latestMessage: message,
      provider,
      model,
    });

    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "assistant", content: reply });
    chat.provider = provider;
    chat.modelId = model;

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



export const getAvailableModels = async (_req: any, res: any) => {
  return res.json({
    defaultModel: getAvailableAIModels()[0]?.id || null,
    models: getAvailableAIModels(),
  });
};
