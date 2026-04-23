import { getAIProviderAdapter } from "../factory/ai-provider.factory";
import { getProviderForModel } from "../constants";
import type { GenerateReplyInput } from "../types";

export const generateChatReply = async ({
  history,
  latestMessage,
  provider,
  model,
}: GenerateReplyInput) => {
  const resolvedProvider = provider || getProviderForModel(model);
  const adapter = getAIProviderAdapter(resolvedProvider);

  return adapter.generateReply(history, latestMessage, model);
};

export const generateChatReplyStream = ({
  history,
  latestMessage,
  provider,
  model,
}: GenerateReplyInput) => {
  const resolvedProvider = provider || getProviderForModel(model);
  const adapter = getAIProviderAdapter(resolvedProvider);

  return adapter.generateReplyStream(history, latestMessage, model);
};
