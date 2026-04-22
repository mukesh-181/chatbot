import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { ChevronDown, Plus, Trash2, Menu, X } from "lucide-react";

import { api } from "@/lib/api";
import { mapApiChatSummary } from "@/lib/chat";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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

  const handleNewChat = () => {
    clearChat();
    setIsSidebarOpen(false);
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
      {/* Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen((open) => !open)}
        className="fixed top-2.5 left-2 z-50 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 lg:hidden"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 z-40`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 mt-16 lg:mt-0">
          <Button
            onClick={handleNewChat}
            className="w-full cursor-pointer flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </Button>
        </div>

        {/* Chat History Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Dropdown Header */}
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between gap-2 px-4 py-3 mx-4 mt-4 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-150 dark:hover:bg-gray-750 transition-colors text-gray-900 dark:text-white font-medium text-sm w-auto"
          >
            <span>Chat History</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Chat List */}
          {isDropdownOpen && (
            <div className="flex-1 overflow-y-auto p-4">
              {chats.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No chat history yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chats.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setActiveChatId(chat.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`p-3 rounded-lg cursor-pointer group transition-colors flex items-center gap-2 ${
                        activeChatId === chat.id
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate capitalize font-medium">
                          {chat.title}
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
                        className="rounded p-1.5 cursor-pointer text-gray-400 opacity-0 transition hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 group-hover:opacity-100 disabled:opacity-100 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Settings Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-gray-900 dark:text-gray-100"
          >
            Settings
          </Button>
        </div>
      </aside>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
