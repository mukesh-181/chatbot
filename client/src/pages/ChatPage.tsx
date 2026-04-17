import { UserButton } from "@clerk/react";
import Sidebar from "@/components/customs/Sidebar";
import ChatArea from "@/components/customs/ChatArea";

const Chat = () => {
  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Header with User Button */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4 flex justify-end">
          <UserButton />
        </div>

        {/* Chat Area */}
        <ChatArea />
      </div>
    </div>
  );
};

export default Chat;