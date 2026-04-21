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
    <div className="relative rounded-2xl overflow-hidden my-2 sm:my-4 bg-linear-to-b from-gray-950 to-gray-900 border border-gray-700 w-full shadow-xl hover:shadow-2xl transition-shadow duration-300">
      {/* Language label and copy button */}
      <div className="flex items-center justify-between bg-linear-to-r from-gray-900 to-gray-800 px-2 sm:px-4 py-2 sm:py-2.5 border-b border-gray-700 gap-2">
        <span className="text-xs font-bold text-blue-400 uppercase tracking-wider truncate">
          {language || "code"}
        </span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shrink-0 ${
            copied
              ? "bg-green-600 text-white"
              : "bg-gray-700 text-gray-200 hover:bg-blue-600 hover:text-white"
          }`}
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
            padding: "1rem",
            fontSize: "0.813rem",
            lineHeight: "1.5",
            backgroundColor: "transparent",
          }}
          showLineNumbers={code.split("\n").length > 5}
          lineNumberStyle={{
            color: "#4b5563",
            paddingRight: "1rem",
            minWidth: "2rem",
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
