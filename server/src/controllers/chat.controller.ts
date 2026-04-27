import {
  addMessageSchema,
  buildChatTitle,
  createChatSchema,
  streamChatSchema,
} from "../utils/zodValidation";
import { getAvailableAIModels, resolveAISelection } from "../lib/ai/constants";
import {
  generateChatReply,
  generateChatReplyStream,
} from "../lib/ai/services/chat-completion.service";
import { normalizeAIResponse } from "../lib/ai/responseFormatter";
import { Chat } from "../models/chat.model";
import { formatError } from "zod";
import { initSSE, writeSSE } from "../utils/sse";

const getErrorMessage = (error: unknown) =>
  error instanceof Error && error.message
    ? error.message
    : "Failed to generate response";

export const createNewChat = async (req: any, res: any) => {
  const parsed = createChatSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: formatError(parsed.error) });
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
    return res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const getIndividualChatDetails = async (req: any, res: any) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  return res.json(chat);
};

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
    const history = chat.messages
      .map((item) => ({
        role: item.role,
        content: item.content,
      }))
      .slice(-8);

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
    return res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const getUserChats = async (req: any, res: any) => {
  const chats = await Chat.find({ userId: req.params.userId })
    .sort({ updatedAt: -1 })
    .select("_id title updatedAt")
    .lean();

  const formattedChats = chats.map((chat) => ({
    _id: String(chat._id),
    title: chat.title,
    updatedAt: chat.updatedAt,
  }));
  return res.json(formattedChats);
};

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

// export const streamChatResponse = async (req: any, res: any) => {
//   const parsed = streamChatSchema.safeParse(req.body);

//   if (!parsed.success) {
//     return res.status(400).json({ error: formatError(parsed.error) });
//   }

//   const { chatId, userId, message } = parsed.data;
//   let chat = chatId ? await Chat.findById(chatId) : null;

//   if (chatId && !chat) {
//     return res.status(404).json({ error: "Chat not found" });
//   }

//   const { provider, model } = resolveAISelection({
//     provider: parsed.data.provider || chat?.provider,
//     model: parsed.data.model || chat?.modelId,
//   });

//   const history = chat
//     ? chat.messages
//         .map((item) => ({
//           role: item.role,
//           content: item.content,
//         }))
//         .slice(-8)
//     : [];

//   initSSE(res);

//   try {
//     const stream = generateChatReplyStream({
//       history,
//       latestMessage: message,
//       provider,
//       model,
//     });

//     let fullReply = "";

//     for await (const chunk of stream) {
//       fullReply += chunk;
//       writeSSE(res, { type: "chunk", content: chunk, chat });
//     }

//     const assistantMessage = normalizeAIResponse(fullReply);

//     chat =
//       chat ||
//       (await Chat.create({
//         userId,
//         title: buildChatTitle(message),
//         provider,
//         modelId: model,
//         messages: [],
//       }));

//     chat.messages.push({ role: "user", content: message });
//     chat.messages.push({ role: "assistant", content: assistantMessage });
//     chat.provider = provider;
//     chat.modelId = model;

//     if (!chat.title?.trim()) {
//       chat.title = buildChatTitle(message);
//     }

//     await chat.save();

//     writeSSE(res, { type: "complete", chat });
//     writeSSE(res, { type: "done" });
//     return res.end();
//   } catch (error) {
//     console.error("Stream chat failed:", error);
//     writeSSE(res, {
//       type: "error",
//       error: getErrorMessage(error),
//     });
//     return res.end();
//   }
// };

export const streamChatResponse = async (req: any, res: any) => {
  let isnewChat = false;
  const parsed = streamChatSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: formatError(parsed.error) });
  }

  const { chatId, userId, message } = parsed.data;
  let chat = chatId ? await Chat.findById(chatId) : null;

  if (!chatId || !chat) {
    isnewChat = true;
  }

  if (chatId && !chat) {
    return res.status(404).json({ error: "Chat not found" });
  }

  const { provider, model } = resolveAISelection({
    provider: parsed.data.provider || chat?.provider,
    model: parsed.data.model || chat?.modelId,
  });

  const history = chat
    ? chat.messages
        .map((item) => ({
          role: item.role,
          content: item.content,
        }))
        .slice(-8)
    : [];

  initSSE(res);

  try {
    const stream = generateChatReplyStream({
      history,
      latestMessage: message,
      provider,
      model,
    });

    let fullReply = "";

    chat =
      chat ||
      (await Chat.create({
        userId,
        title: buildChatTitle(message),
        provider,
        modelId: model,
        messages: [],
      }));

    chat.messages.push({ role: "user", content: message });
    await chat.save();
    writeSSE(res, { type: "start", chat });
    
    for await (const chunk of stream) {
      fullReply += chunk;
      // Only send chunk content, not entire chat object for each chunk
      writeSSE(res, { type: "chunk", content: chunk });
    }

    const assistantMessage = normalizeAIResponse(fullReply);

    chat.messages.push({ role: "assistant", content: assistantMessage });
    chat.provider = provider;
    chat.modelId = model;

    if (!chat.title?.trim()) {
      chat.title = buildChatTitle(message);
    }

    await chat.save();

    if (isnewChat) {
      isnewChat = false; // Reset the flag after successful creation
    }

    writeSSE(res, { type: "complete", chat });
    writeSSE(res, { type: "done" });
    return res.end();
  } catch (error) {
    if (isnewChat && chat) {
      await Chat.findByIdAndDelete(chat._id);
    } else if (!isnewChat && chat) {
      chat.messages.pop(); // Remove the last user message which caused the error
      await chat.save();
    }

    console.error("Stream chat failed:", error);
    writeSSE(res, {
      type: "error",
      error: getErrorMessage(error),
    });
    return res.end();
  }
};

export const savePartialMessage = async (req: any, res: any) => {
  try {
    const { chatId, userId, message, userMessage } = req.body;

    if (!chatId && !userId) {
      return res.status(400).json({ error: "chatId or userId is required" });
    }

    let chat = chatId ? await Chat.findById(chatId) : null;

    if (chatId && !chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // If creating new chat with partial message
    if (!chat && userId) {
      chat = await Chat.create({
        userId,
        title: buildChatTitle(userMessage || "Partial conversation"),
        messages: [],
      });
    }

    if (!chat) {
      return res.status(400).json({ error: "Could not create or find chat" });
    }

    // Add user message if provided
    if (userMessage && !chat.messages.some(m => m.content === userMessage && m.role === "user")) {
      chat.messages.push({ role: "user", content: userMessage });
    }

    // Add or update the partial assistant message
    const lastMessage = chat.messages[chat.messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      // Update existing assistant message
      lastMessage.content = message;
    } else {
      // Add new assistant message
      chat.messages.push({ role: "assistant", content: message });
    }

    await chat.save();
    return res.json(chat);
  } catch (error) {
    console.error("Save partial message failed:", error);
    return res.status(500).json({ error: getErrorMessage(error) });
  }
};
