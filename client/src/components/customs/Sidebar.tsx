import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/react";
import { Menu, Plus, Trash2, X } from "lucide-react";

import { api } from "@/lib/api";
import { mapApiChatSummary } from "@/lib/chat";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const { user } = useUser();
  const { chats, activeChatId, clearChat, removeChat, setActiveChatId, setChats } =
    useChatStore();

  useEffect(() => {
    const loadChats = async () => {
      const res = await api.get(`/chat/user/${user?.id}`);
      setChats(res.data.map(mapApiChatSummary));
    };

    if (user?.id) {
      void loadChats();
    }
  }, [setChats, user?.id]);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }),
    []
  );

  const handleNewChat = () => {
    clearChat();
    setIsOpen(false);
  };

  const handleDeleteChat = async (chatId: string) => {
    setDeletingChatId(chatId);

    try {
      await api.delete(`/chat/${chatId}`);
      removeChat(chatId);

      if (activeChatId === chatId) {
        clearChat();
      }
    } finally {
      setDeletingChatId(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 lg:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 z-40`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 mt-16 lg:mt-0">
          <Button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <Plus className="w-5 h-5" />
            New chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  setIsOpen(false);
                }}
                className={`p-3 rounded-lg cursor-pointer group transition-colors ${
                  activeChatId === chat.id
                    ? "bg-blue-50 dark:bg-blue-950/40"
                    : "hover:bg-gray-100 dark:hover:bg-gray-900"
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {chat.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatter.format(new Date(chat.updatedAt))}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete chat"
                    disabled={deletingChatId === chat.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      void handleDeleteChat(chat.id);
                    }}
                    className="mt-0.5 rounded p-1 text-gray-400 opacity-0 transition hover:bg-gray-200 hover:text-red-500 group-hover:opacity-100 disabled:opacity-100 dark:hover:bg-gray-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-gray-900 dark:text-gray-100"
          >
            Settings
          </Button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
