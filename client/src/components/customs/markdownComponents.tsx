import type { Components } from "react-markdown";
import CodeBlock from "./CodeBlock";

export const markdownComponents: Components = {
  // � Headers
  h1({ children }: any) {
    return (
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white  border-b-2 border-gray-300 dark:border-gray-700 ">
        {children}
      </h1>
    );
  },
  h2({ children }: any) {
    return (
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white  border-b border-gray-300 dark:border-gray-700 ">
        {children}
      </h2>
    );
  },
  h3({ children }: any) {
    return (
      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white ">
        {children}
      </h3>
    );
  },
  h4({ children }: any) {
    return (
      <h4 className="text-lg font-bold text-gray-900 dark:text-white ">
        {children}
      </h4>
    );
  },
  h5({ children }: any) {
    return (
      <h5 className="text-base font-bold text-gray-900 dark:text-white ">
        {children}
      </h5>
    );
  },
  h6({ children }: any) {
    return (
      <h6 className="text-sm font-bold text-gray-600 dark:text-gray-300 ">
        {children}
      </h6>
    );
  },

  // 🖼️ Images
  img({ src, alt, title, style }: any) {
    return (
      <div className="my-4 flex justify-center">
        <img
          src={src}
          alt={alt || "Image"}
          title={title}
          style={{
            maxWidth: "100%",
            height: "auto",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            border: "1px solid #d1d5db",
            ...style,
          }}
          className="dark:border-gray-600 max-h-96 object-cover"
        />
      </div>
    );
  },

  // 📝 Paragraphs
  p({ children }: any) {
    // Skip rendering empty paragraphs
    const isEmpty = 
      !children || 
      (Array.isArray(children) && children.every((child: any) => !child || (typeof child === 'string' && !child.trim()))) ||
      (typeof children === 'string' && !children.trim());
    
    if (isEmpty) return null;
    
    return (
      <p className="text-gray-900 dark:text-gray-100 leading-7  text-sm sm:text-base">
        {children}
      </p>
    );
  },

  // 📋 Lists
  ul({ children }: any) {
    return (
      <ul className="list-disc list-inside  text-gray-900 dark:text-gray-100">
        {children}
      </ul>
    );
  },
  ol({ children }: any) {
    return (
      <ol className="list-decimal list-inside  text-gray-900 dark:text-gray-100">
        {children}
      </ol>
    );
  },
  li({ children }: any) {
    return (
      <li className="text-sm sm:text-base leading-6">
        {children}
      </li>
    );
  },

  // 💬 Blockquotes
  blockquote({ children }: any) {
    return (
      <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30  rounded text-gray-900 dark:text-gray-100 italic">
        {children}
      </blockquote>
    );
  },

  // 📊 Tables
  table({ children }: any) {
    return (
      <div className="overflow-x-auto my-4 rounded-lg border border-gray-300 dark:border-gray-700">
        <table className="w-full text-sm text-gray-900 dark:text-gray-100">
          {children}
        </table>
      </div>
    );
  },
  thead({ children }: any) {
    return (
      <thead className="bg-gray-200 dark:bg-gray-800 font-bold border-b-2 border-gray-300 dark:border-gray-700">
        {children}
      </thead>
    );
  },
  tbody({ children }: any) {
    return (
      <tbody className="divide-y divide-gray-300 dark:divide-gray-700">
        {children}
      </tbody>
    );
  },
  tr({ children }: any) {
    return (
      <tr className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        {children}
      </tr>
    );
  },
  th({ children, align }: any) {
    const alignMap: Record<string, string> = {
      center: "text-center",
      right: "text-right",
      left: "text-left",
    };
    const alignClass = (align && alignMap[align as string]) || "text-left";

    return (
      <th className={`px-4 py-3 font-bold ${alignClass}`}>
        {children}
      </th>
    );
  },
  td({ children, align }: any) {
    const alignMap: Record<string, string> = {
      center: "text-center",
      right: "text-right",
      left: "text-left",
    };
    const alignClass = (align && alignMap[align as string]) || "text-left";

    return (
      <td className={`px-4 py-2 ${alignClass} text-sm sm:text-base`}>
        {children}
      </td>
    );
  },

  // 💻 Code (block + inline)
  code({ className, children }: any) {
    const match = /language-(\w+)/.exec(className || "");

    // ✅ Code block
    if (match) {
      return (
        <CodeBlock language={match[1]} children={String(children)} />
      );
    }

    // ✅ Inline code
    return (
      <code className="bg-white/20 dark:bg-black/30 text-gray-900 dark:text-gray-100 px-2 py-1 rounded font-mono text-sm border border-gray-300 dark:border-gray-600">
        {children}
      </code>
    );
  },

  // 🔗 Link (open in new tab)
  a({ href, children, ...props }: any) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        {...props}
      >
        {children}
      </a>
    );
  },

  // 🔀 Horizontal Rule
  hr() {
    return (
      <hr className="my-4 border-t-2 border-gray-300 dark:border-gray-700" />
    );
  },

  // ❌ Strong (Bold)
  strong({ children }: any) {
    return (
      <strong className="font-bold text-gray-900 dark:text-white">
        {children}
      </strong>
    );
  },

  // 📕 Emphasis (Italic)
  em({ children }: any) {
    return (
      <em className="italic text-gray-900 dark:text-gray-100">
        {children}
      </em>
    );
  },

  // 🗑️ Delete (Strikethrough)
  del({ children }: any) {
    return (
      <del className="line-through text-gray-600 dark:text-gray-400">
        {children}
      </del>
    );
  },
};