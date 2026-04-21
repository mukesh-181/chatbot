import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  language: string;
  children: string;
}

const CodeBlock = ({ language, children }: CodeBlockProps) => {
  const [copied, setCopied] = useState(false);
  const code = String(children).replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy code");
    }
  };

  return (
    <div className="relative rounded-lg overflow-hidden my-2 sm:my-4 bg-gray-900 border border-gray-700 w-full">
      {/* Language label and copy button */}
      <div className="flex items-center justify-between bg-gray-800 px-2 sm:px-4 py-1.5 sm:py-2 border-b border-gray-700 gap-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition-colors shrink-0"
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <>
              <Check size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Copied</span>
            </>
          ) : (
            <>
              <Copy size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto max-w-full">
        <SyntaxHighlighter
          language={language}
          style={atomDark}
          customStyle={{
            margin: 0,
            padding: "0.75rem",
            fontSize: "0.75rem",
            lineHeight: "1.4",
          }}
          showLineNumbers={code.split("\n").length > 5}
          lineNumberStyle={{
            color: "#6b7280",
            paddingRight: "0.5rem",
          }}
          wrapLines={true}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
