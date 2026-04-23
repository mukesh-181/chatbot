
import ReactMarkdown from "react-markdown";

type DisplayComponentProps = {
  messages: {
    id: string;
    role: "user" | "assistant";
    content: string;
  }[];
  loading: boolean;
  streamingMessageId?: string | null;
  markdownComponents: any;
};

const HistoryCard = ({
  messages,
  loading,
  streamingMessageId,
  markdownComponents,
}: DisplayComponentProps) => {
  return (
    <>
      <div className="w-full max-w-full sm:max-w-4xl mx-auto space-y-3 sm:space-y-5">
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`p-3 sm:p-4 rounded-2xl w-full sm:w-auto max-w-xs sm:max-w-2xl wrap-break-words transition-all duration-200 ${
                message.role === "user"
                  ? "bg-blue-100 dark:bg-blue-950 text-gray-900 dark:text-white border border-blue-300 dark:border-blue-800 shadow-md hover:shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="whitespace-pre-wrap wrap-break-words leading-6 sm:leading-7 text-sm sm:text-base">
                <ReactMarkdown components={markdownComponents}>
                  {message.content}
                </ReactMarkdown>
                {streamingMessageId === message.id && (
                  <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-blue-500 align-middle" />
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && !streamingMessageId && (
          <div className="flex justify-start">
            <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:200ms]" />
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce [animation-delay:400ms]" />
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default HistoryCard;
