import React, { useMemo } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
}) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeLanguage = "";
    let inList = false;
    let listItems: React.ReactNode[] = [];
    let isNumberedList = false;
    let inTable = false;
    let tableRows: string[][] = [];

    const flushList = () => {
      if (inList && listItems.length > 0) {
        if (isNumberedList) {
          elements.push(
            <ol key={`ol-${elements.length}`} className="list-decimal pl-5 space-y-1 my-2 text-xs">
              {listItems}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`ul-${elements.length}`} className="list-disc pl-5 space-y-1 my-2 text-xs">
              {listItems}
            </ul>
          );
        }
        listItems = [];
        inList = false;
      }
    };

    const flushTable = () => {
      if (inTable && tableRows.length > 0) {
        const header = tableRows[0];
        const bodyRows = tableRows.slice(1).filter((r) => !r.every((cell) => cell.trim().startsWith("---")));

        elements.push(
          <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-extrabold uppercase text-[10px]">
                <tr>
                  {header.map((col, idx) => (
                    <th key={idx} className="py-2.5 px-3 border-b border-gray-200 dark:border-gray-700">
                      {parseInlineFormatting(col.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 text-gray-800 dark:text-gray-200">
                        {parseInlineFormatting(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code Block Boundary
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            <div key={`code-${elements.length}`} className="my-3 rounded-xl bg-gray-900 text-gray-100 p-3.5 text-xs font-mono overflow-x-auto shadow-inner">
              {codeLanguage && (
                <div className="text-[10px] text-gray-400 uppercase font-black tracking-wider pb-1.5 border-b border-gray-800 mb-2">
                  {codeLanguage}
                </div>
              )}
              <pre className="whitespace-pre-wrap">{codeBlockContent.join("\n")}</pre>
            </div>
          );
          inCodeBlock = false;
          codeBlockContent = [];
          codeLanguage = "";
        } else {
          // Start of code block
          flushList();
          flushTable();
          inCodeBlock = true;
          codeLanguage = line.trim().slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Markdown Table Row
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        flushList();
        inTable = true;
        const cells = line
          .trim()
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Horizontal Rule
      if (/^(\*\*\*|---|___)$/.test(line.trim())) {
        flushList();
        elements.push(<hr key={`hr-${elements.length}`} className="my-4 border-gray-200 dark:border-gray-700" />);
        continue;
      }

      // Headers
      if (line.startsWith("# ")) {
        flushList();
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-base sm:text-lg font-black text-gray-900 dark:text-white mt-3 mb-1.5 flex items-center gap-1.5">
            {parseInlineFormatting(line.slice(2))}
          </h1>
        );
        continue;
      }
      if (line.startsWith("## ")) {
        flushList();
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white mt-2.5 mb-1 flex items-center gap-1.5">
            {parseInlineFormatting(line.slice(3))}
          </h2>
        );
        continue;
      }
      if (line.startsWith("### ")) {
        flushList();
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-xs sm:text-sm font-black text-primary dark:text-violet-400 mt-2 mb-1">
            {parseInlineFormatting(line.slice(4))}
          </h3>
        );
        continue;
      }
      if (line.startsWith("#### ")) {
        flushList();
        elements.push(
          <h4 key={`h4-${elements.length}`} className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mt-2 mb-1">
            {parseInlineFormatting(line.slice(5))}
          </h4>
        );
        continue;
      }

      // Blockquotes
      if (line.startsWith("> ")) {
        flushList();
        elements.push(
          <blockquote key={`bq-${elements.length}`} className="my-2 border-l-4 border-violet-500 bg-violet-50/60 dark:bg-violet-950/30 p-2.5 rounded-r-xl text-xs text-gray-700 dark:text-gray-300 italic font-medium">
            {parseInlineFormatting(line.slice(2))}
          </blockquote>
        );
        continue;
      }

      // Bullet List
      const bulletMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (bulletMatch) {
        if (!inList || isNumberedList) {
          flushList();
          inList = true;
          isNumberedList = false;
        }
        listItems.push(
          <li key={`li-${listItems.length}`} className="leading-relaxed text-gray-700 dark:text-gray-300">
            {parseInlineFormatting(bulletMatch[2])}
          </li>
        );
        continue;
      }

      // Numbered List
      const numberedMatch = line.match(/^(\s*)\d+\.\s+(.*)$/);
      if (numberedMatch) {
        if (!inList || !isNumberedList) {
          flushList();
          inList = true;
          isNumberedList = true;
        }
        listItems.push(
          <li key={`li-${listItems.length}`} className="leading-relaxed text-gray-700 dark:text-gray-300">
            {parseInlineFormatting(numberedMatch[2])}
          </li>
        );
        continue;
      }

      // Empty line
      if (!line.trim()) {
        flushList();
        continue;
      }

      // Regular Paragraph
      flushList();
      elements.push(
        <p key={`p-${elements.length}`} className="text-xs leading-relaxed text-gray-800 dark:text-gray-200 my-1 font-medium">
          {parseInlineFormatting(line)}
        </p>
      );
    }

    flushList();
    flushTable();

    return elements;
  }, [content]);

  return <div className={`space-y-1 ${className}`}>{renderedElements}</div>;
};

/**
 * Parses inline formatting: **bold**, *italic*, `code`, ~~strike~~
 */
function parseInlineFormatting(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex to tokenize bold, code, italic, links
  const tokenRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|~~[^~]+~~|https?:\/\/[^\s]+)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold: **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-black text-gray-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Inline Code: `code`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-primary dark:text-violet-300 font-mono text-[11px] font-bold">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Italic: *text*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-gray-800 dark:text-gray-200">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Strikethrough: ~~text~~
    if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      return (
        <del key={index} className="line-through text-gray-400">
          {part.slice(2, -2)}
        </del>
      );
    }

    // Bare URL
    if (part.startsWith("http://") || part.startsWith("https://")) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">
          {part}
        </a>
      );
    }

    return part;
  });
}

export default MarkdownRenderer;

