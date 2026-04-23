import { useEffect, useState } from "react";
import { useUser } from "@clerk/react";
import { Plus, Menu, X } from "lucide-react";

import { api } from "@/lib/api";
import { mapApiChatSummary } from "@/lib/chat";
import { useChatStore } from "@/store/useChatStore";
import { Button } from "@/components/ui/button";
import ChatHistoryComponent from "./ChatHistoryComponent";

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const { user } = useUser();
  const { activeChatId, clearChat, removeChat, setChats } = useChatStore();

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
        {isSidebarOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
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

        <ChatHistoryComponent
          setIsDropdownOpen={setIsDropdownOpen}
          isDropdownOpen={isDropdownOpen}
          deletingChatId={deletingChatId}
          handleDeleteChat={handleDeleteChat}
          setIsSidebarOpen={setIsSidebarOpen}
        />

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
