import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const supportedProviders = ["gemini", "openai", "nvidia"] as const;

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      default: "New Chat",
      trim: true,
    },
    provider: {
      type: String,
      enum: supportedProviders,
      default: "gemini",
      trim: true,
    },
    modelId: {
      type: String,
      default: "gemini-3.1-flash-lite-preview",
      trim: true,
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);
