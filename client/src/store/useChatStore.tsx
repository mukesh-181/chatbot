import { create } from "zustand";

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ChatSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

type ChatState = {
  activeChatId: string | null;
  chats: ChatSummary[];
  messages: Message[];
  loading: boolean;
  setActiveChatId: (chatId: string | null) => void;
  setChats: (chats: ChatSummary[]) => void;
  upsertChat: (chat: ChatSummary) => void;
  removeChat: (chatId: string) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessageContent: (messageId: string, content: string) => void;
  setLoading: (loading: boolean) => void;
  clearChat: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  activeChatId: null,
  chats: [],
  messages: [],
  loading: false,

  setActiveChatId: (activeChatId) => set({ activeChatId }),

  setChats: (chats) => set({ chats }),

  upsertChat: (chat) =>
    set((state) => {
      const chats = state.chats.filter((item) => item.id !== chat.id);
      return { chats: [chat, ...chats] };
    }),

  removeChat: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((item) => item.id !== chatId),
    })),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateMessageContent: (messageId, content) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === messageId ? { ...message, content } : message
      ),
    })),

  setLoading: (loading) => set({ loading }),

  clearChat: () => set({ activeChatId: null, messages: [] }),
}));
