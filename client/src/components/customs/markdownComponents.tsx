import type { Components } from "react-markdown";
import CodeBlock from "./CodeBlock";


 export const markdownComponents: Components = {
    code({ className, children, }) {
      const match = /language-(\w+)/.exec(className || "");

      // ✅ Code block
      if (match) {
        return <CodeBlock language={match[1]} children={String(children)} />;
      }

      // ✅ Inline code
      return (
        <code className="bg-white/20 dark:bg-black/30 text-gray-900 dark:text-gray-100 px-2 py-1 rounded font-mono text-sm border border-gray-300 dark:border-gray-600">
          {children}
        </code>
      );
    },
  };