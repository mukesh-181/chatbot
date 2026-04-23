export const writeSSE = (res: any, payload: unknown) => {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

export const initSSE = (res: any) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }
};
