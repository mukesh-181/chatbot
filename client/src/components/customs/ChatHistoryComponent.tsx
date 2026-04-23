import { useChatStore } from "@/store/useChatStore";
import { ChevronDown,  Trash2 } from "lucide-react";

type ChatHistoryComponentProps = {
  setIsDropdownOpen: (value: boolean) => void;
  isDropdownOpen: boolean;
  deletingChatId: string | null;
  handleDeleteChat: (chatId: string) => void;
  setIsSidebarOpen: (value: boolean) => void;
};

const ChatHistoryComponent = ({ setIsDropdownOpen, isDropdownOpen, deletingChatId,handleDeleteChat,setIsSidebarOpen }: ChatHistoryComponentProps) => {
    const { chats, activeChatId,  setActiveChatId,  } =
      useChatStore();
  return (
   <>
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
   
   </>
  )
}

export default ChatHistoryComponent