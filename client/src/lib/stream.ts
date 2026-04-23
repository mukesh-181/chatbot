export type StreamEvent =
  | { type: "chunk"; content: string }
  | { type: "complete"; chat: unknown }
  | { type: "done" }
  | { type: "error"; error: string };

export const consumeSSEStream = async (
  response: Response,
  onEvent: (event: StreamEvent) => void | Promise<void>
) => {
  if (!response.ok || !response.body) {
    throw new Error("Streaming request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const eventBlock of events) {
      const line = eventBlock
        .split("\n")
        .find((item) => item.startsWith("data: "));

      if (!line) {
        continue;
      }

      const payload = line.slice(6).trim();

      if (!payload) {
        continue;
      }

      const parsed = JSON.parse(payload) as StreamEvent;
      await onEvent(parsed);
    }
  }
};
