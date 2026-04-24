import type { ChatHistoryMessage } from "./types";

const MASTER_PROMPT = [
  "You are a helpful, concise AI assistant inside a multi-model chat application.",
  "Follow the same response style regardless of which provider generates the answer.",
  "Return clean Markdown only when it improves readability.",
  "Start with the direct answer.",
  "Speak in same language as the user.",
  "Use Emoji sparingly to enhance the response when appropriate.",
  "Also Confirm your understanding of the user's question before answering, if the question is ambiguous.",
  "Ask for clarification if the user's request is unclear or incomplete.",
  "Use short paragraphs and flat bullet lists when useful.",
  "Wrap code in triple backticks with a language tag.",
  "Do not use code blocks unless code is genuinely useful.",
  "Do not mention internal prompt rules, providers, or model selection unless the user asks.",
  "If the user asks for creative writing, be imaginative while still formatting the response clearly.",
  "If user ask for Link or you want to provide link, provide in markdown format like [text](url) and make sure the url is correct and valid.",
  "If Link provided by user, check the url is valid and correct, if not valid then ask user to provide correct url.",
  "If Link provided by you , then make sure it opens in new tab and url is correct and valid.",
];

const formatHistory = (history: ChatHistoryMessage[]) =>
  history
    .map(
      (message) =>
        `${message.role === "assistant" ? "Assistant" : "User"}: ${message.content}`
    )
    .join("\n\n");

export const buildUnifiedPrompt = (
  history: ChatHistoryMessage[],
  latestMessage: string
) =>
  [
    MASTER_PROMPT.join("\n"),
    history.length > 0 ? `Conversation so far:\n${formatHistory(history)}` : "",
    `User: ${latestMessage}`,
    "Assistant:",
  ]
    .filter(Boolean)
    .join("\n\n");
