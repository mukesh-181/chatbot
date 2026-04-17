import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const apiKey = process.env.GEMINI_API_KEY;

const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
    })
  : null;

const formatPrompt = (messages: ChatHistoryMessage[], latestMessage: string) => {
  const history = messages
    .slice(-8)
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n\n");

  return [
    "You are a simple helpful chatbot.",
    "Keep answers short, clear, and friendly.",
    "Use simple text formatting with short paragraphs or bullet points when helpful.",
    history ? `Conversation so far:\n${history}` : "",
    `User: ${latestMessage}`,
    "Assistant:",
  ]
    .filter(Boolean)
    .join("\n\n");
};

const formatGeminiText = (text: string) =>
  text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

export const generateChatReply = async (
  messages: ChatHistoryMessage[],
  latestMessage: string
) => {
  if (!ai) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: formatPrompt(messages, latestMessage),
  });

  const text = result.text?.trim();

  if (!text) {
    return "I could not generate a response right now. Please try again.";
  }

  return formatGeminiText(text);
};
