import type { KeyboardEvent, RefObject } from "react";
import { Send, Square } from "lucide-react";

import { Button } from "@/components/ui/button";

type InputComponentsProps = {
  input: string;
  loading: boolean;
  isStreaming: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onInputChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  onStop: () => void;
};

const InputComponents = ({
  input,
  loading,
  isStreaming,
  textareaRef,
  onInputChange,
  onSend,
  onStop,
}: InputComponentsProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming) {
        void onSend();
      }
    }
  };

  return (
    <div className="flex gap-2 sm:gap-3 items-center">
      <textarea
        ref={textareaRef}
        value={input}
        placeholder="Ask me anything..."
        onChange={(e) => onInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading || isStreaming}
        rows={1}
        className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none disabled:opacity-50"
      />

      {isStreaming ? (
        <Button
          onClick={onStop}
          className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white"
        >
          <Square className="w-4 h-4 fill-current" />
        </Button>
      ) : (
        <Button onClick={() => void onSend()} disabled={!input.trim() || loading}>
          <Send className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default InputComponents;
