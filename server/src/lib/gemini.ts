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
    .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`)
    .join("\n\n");

return [
    //  Role
    "You are a helpful, concise chatbot.",
    
    
    //  Style rules
    "Use simple Markdown for formatting (paragraphs, bullet points).",

    //  Code rules
   "don't use code unless it's necessary to explain something.",
    "Wrap code in triple backticks with language (e.g. ```js).",

    //  Structure rules
    "Start with a direct answer.",
    "Use different Emoji to make more interactive and engaging responses.",
    "Give detail explanations when the user asks for it, but keep it concise by default.",
    "Add a brief explanation if needed.",
    "End with a short conclusion when helpful.",
    "For any story writing or any blog or any creative writing, use a storytelling style and be more descriptive and imaginative in your response , also give numbers of line as per the request.",

    //  Context
    history ? `Conversation so far:\n${history}` : "",
    
    //  User input
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
    model: "gemini-3.1-flash-lite-preview",
    contents: formatPrompt(messages, latestMessage),
  });

  const text = result.text?.trim();

  if (!text) {
    return "I could not generate a response right now. Please try again.";
  }

  return formatGeminiText(text);
};
