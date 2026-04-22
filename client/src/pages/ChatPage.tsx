import { UserButton, useUser } from "@clerk/react";
import Sidebar from "@/components/customs/Sidebar";
import ChatArea from "@/components/customs/ChatArea";

const Chat = () => {
  const { user } = useUser();

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col lg:ml-64 overflow-hidden">
        
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center">
          
          {/* Left Side: Logo + Name */}
          <div className="flex  ml-10 items-center gap-2 font-semibold text-lg">
             <span>RoboChat</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {user?.fullName || user?.username || "User"}
            </span>
          </div>

          {/* Right Side: User Icon */}
          <UserButton />
        </div>

        {/* Chat Area */}
        <ChatArea />
      </div>
    </div>
  );
};

export default Chat;