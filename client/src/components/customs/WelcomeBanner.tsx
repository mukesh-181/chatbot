import { MessageSquare } from "lucide-react";

const WelcomeBanner = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      {/* Logo */}
      <div className="w-20 h-20 bg-linear-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
        <MessageSquare className="w-10 h-10 text-white" />
      </div>

      {/* Welcome Text */}
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to ChatBot
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Start a new conversation or continue your previous chat
        </p>
      </div>

      {/* Suggested Prompts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl px-4">
        {[
          { icon: "💡", title: "Ask me anything", desc: "Get help on any topic" },
          { icon: "✍️", title: "Write something", desc: "Create content with me" },
          { icon: "📊", title: "Analyze data", desc: "Process and understand data" },
          { icon: "🔧", title: "Code help", desc: "Debug or create code" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer transition-colors"
          >
            <p className="text-2xl mb-2">{item.icon}</p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {item.title}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeBanner;
