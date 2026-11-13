import React, { useMemo, useState } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface CardMetadata {
  title: string;
  type: "pedagogy" | "alert" | "remedy" | "exam" | "action" | "insight";
  priority?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  impact?: string;
  tag?: string;
  scope?: string;
  alternatePedagogy?: string;
}

const CARD_STYLES: Record<
  string,
  {
    border: string;
    bg: string;
    headerBg: string;
    text: string;
    badgeBg: string;
    icon: string;
    defaultTag: string;
  }
> = {
  pedagogy: {
    border: "border-blue-400 dark:border-blue-600",
    bg: "bg-blue-50/60 dark:bg-blue-950/20",
    headerBg: "bg-blue-100/70 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    badgeBg: "bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200",
    defaultTag: "Pedagogical Tip",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  alert: {
    border: "border-rose-400 dark:border-rose-600",
    bg: "bg-rose-50/60 dark:bg-rose-950/20",
    headerBg: "bg-rose-100/70 dark:bg-rose-900/40",
    text: "text-rose-700 dark:text-rose-300",
    badgeBg: "bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200",
    defaultTag: "Performance Alert",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  remedy: {
    border: "border-emerald-400 dark:border-emerald-600",
    bg: "bg-emerald-50/60 dark:bg-emerald-950/20",
    headerBg: "bg-emerald-100/70 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300",
    badgeBg: "bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200",
    defaultTag: "Remedial Intervention",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  exam: {
    border: "border-purple-400 dark:border-purple-600",
    bg: "bg-purple-50/60 dark:bg-purple-950/20",
    headerBg: "bg-purple-100/70 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
    badgeBg: "bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200",
    defaultTag: "Exam & Assessment Tip",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  action: {
    border: "border-indigo-400 dark:border-indigo-600",
    bg: "bg-indigo-50/60 dark:bg-indigo-950/20",
    headerBg: "bg-indigo-100/70 dark:bg-indigo-900/40",
    text: "text-indigo-700 dark:text-indigo-300",
    badgeBg: "bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200",
    defaultTag: "Action Plan",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
  insight: {
    border: "border-amber-400 dark:border-amber-600",
    bg: "bg-amber-50/60 dark:bg-amber-950/20",
    headerBg: "bg-amber-100/70 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    badgeBg: "bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200",
    defaultTag: "Strategic Insight",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
};

// Safe clipboard helper that works in both secure (HTTPS) and non-secure (HTTP IP) contexts
const safeCopyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy fallback
    }
  }

  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn("Clipboard copy not supported in this browser context:", err);
    return false;
  }
};

const CardBlock: React.FC<{
  metadata: CardMetadata;
  bodyLines: string[];
}> = ({ metadata, bodyLines }) => {
  const [copied, setCopied] = useState(false);
  const typeKey = (metadata.type || "insight").toLowerCase();
  const style = CARD_STYLES[typeKey] || CARD_STYLES.insight;

  const handleCopy = async () => {
    const textToCopy = `${metadata.title}\n\n${bodyLines.join("\n")}`;
    const ok = await safeCopyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const priorityColor =
    metadata.priority === "CRITICAL"
      ? "bg-rose-500 text-white"
      : metadata.priority === "HIGH"
      ? "bg-amber-500 text-white"
      : metadata.priority === "MEDIUM"
      ? "bg-blue-500 text-white"
      : "bg-gray-500 text-white";

  return (
    <div
      className={`my-1.5 rounded-xl border ${style.border} ${style.bg} overflow-hidden shadow-2xs transition hover:shadow-xs`}
    >
      {/* Card Header */}
      <div className={`px-3 py-1.5 ${style.headerBg} flex flex-wrap items-center justify-between gap-1.5 border-b border-inherit`}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-white dark:bg-gray-800 flex items-center justify-center shadow-2xs shrink-0">
            <svg className={`w-3 h-3 ${style.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${style.badgeBg}`}>
                {metadata.tag || style.defaultTag}
              </span>
              {metadata.priority && (
                <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${priorityColor}`}>
                  {metadata.priority}
                </span>
              )}
              {metadata.impact && (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  ⚡ {metadata.impact}
                </span>
              )}
              {metadata.alternatePedagogy && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  🎓 Alternate Pedagogy: {metadata.alternatePedagogy}
                </span>
              )}
            </div>
            <h4 className="text-xs font-black text-gray-900 dark:text-white mt-0.5 truncate">
              {metadata.title || "AI Improvement Recommendation"}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {metadata.scope && (
            <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-800/70 px-1.5 py-0.5 rounded-md">
              {metadata.scope}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60 transition text-[11px] font-bold"
            title="Copy suggestion"
          >
            {copied ? (
              <span className="text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold">Copied!</span>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-2.5 sm:p-3 space-y-1 text-xs leading-relaxed text-gray-800 dark:text-gray-200">
        {bodyLines.map((bLine, idx) => {
          const trimmed = bLine.trim();
          if (!trimmed) return <div key={idx} className="h-0.5" />;

          // Highlighted Alternate Pedagogy Box
          const isAlternatePedagogy =
            trimmed.toLowerCase().startsWith("- **alternate pedagogy") ||
            trimmed.toLowerCase().startsWith("**alternate pedagogy") ||
            trimmed.toLowerCase().includes("alternate pedagogy:");

          if (isAlternatePedagogy) {
            return (
              <div
                key={idx}
                className="my-1 p-2 rounded-lg border border-indigo-300 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 flex items-start gap-2 shadow-2xs"
              >
                <span className="text-sm leading-none mt-0.5">🎓</span>
                <div className="flex-1 text-[11px] font-semibold leading-relaxed">
                  {parseInlineFormatting(trimmed.replace(/^[-*]\s*/, ""))}
                </div>
              </div>
            );
          }

          // Bullet point
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
                <span className="text-primary mt-1 font-black leading-none">•</span>
                <div className="flex-1 font-medium">{parseInlineFormatting(trimmed.slice(2))}</div>
              </div>
            );
          }

          // Numbered point
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
                <span className="font-extrabold text-primary text-[10px] min-w-[14px]">{numMatch[1]}.</span>
                <div className="flex-1 font-medium">{parseInlineFormatting(numMatch[2])}</div>
              </div>
            );
          }

          return (
            <p key={idx} className="font-medium">
              {parseInlineFormatting(trimmed)}
            </p>
          );
        })}
      </div>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  const renderedElements = useMemo(() => {
    if (!content) return null;

    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeLanguage = "";

    let inCardBlock = false;
    let cardMetadata: CardMetadata = { title: "", type: "insight" };
    let cardBodyLines: string[] = [];

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
          <div
            key={`table-${elements.length}`}
            className="my-3 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xs"
          >
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
      const trimmedLine = line.trim();

      // Card block fence check
      if (trimmedLine.startsWith("```card") || trimmedLine.startsWith("```suggestion")) {
        flushList();
        flushTable();
        inCardBlock = true;
        cardMetadata = { title: "", type: "insight" };
        cardBodyLines = [];
        continue;
      }

      if (inCardBlock) {
        if (trimmedLine.startsWith("```")) {
          // End of card block
          elements.push(
            <CardBlock
              key={`card-${elements.length}`}
              metadata={cardMetadata}
              bodyLines={cardBodyLines}
            />
          );
          inCardBlock = false;
          continue;
        }

        // Parse key-value headers in card
        const colonIdx = line.indexOf(":");
        if (
          colonIdx > 0 &&
          cardBodyLines.length === 0 &&
          /^(title|type|priority|impact|tag|badge|scope|alternate_pedagogy|alternatepedagogy)$/i.test(line.slice(0, colonIdx).trim())
        ) {
          const key = line.slice(0, colonIdx).trim().toLowerCase();
          const val = line.slice(colonIdx + 1).trim();
          if (key === "title") cardMetadata.title = val;
          else if (key === "type") cardMetadata.type = val as any;
          else if (key === "priority") cardMetadata.priority = val.toUpperCase() as any;
          else if (key === "impact") cardMetadata.impact = val;
          else if (key === "tag" || key === "badge") cardMetadata.tag = val;
          else if (key === "scope") cardMetadata.scope = val;
          else if (key === "alternate_pedagogy" || key === "alternatepedagogy") cardMetadata.alternatePedagogy = val;
        } else {
          cardBodyLines.push(line);
        }
        continue;
      }

      // Standard Code Block Boundary
      if (trimmedLine.startsWith("```")) {
        if (inCodeBlock) {
          // End of code block
          elements.push(
            <div
              key={`code-${elements.length}`}
              className="my-3 rounded-xl bg-gray-900 text-gray-100 p-3.5 text-xs font-mono overflow-x-auto shadow-inner"
            >
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
          flushList();
          flushTable();
          inCodeBlock = true;
          codeLanguage = trimmedLine.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Markdown Table Row
      if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
        flushList();
        inTable = true;
        const cells = trimmedLine
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Horizontal Rule
      if (/^(\*\*\*|---|___)$/.test(trimmedLine)) {
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
      if (!trimmedLine) {
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

    // If card block was open at EOF
    if (inCardBlock && cardBodyLines.length > 0) {
      elements.push(
        <CardBlock
          key={`card-${elements.length}`}
          metadata={cardMetadata}
          bodyLines={cardBodyLines}
        />
      );
    }

    return elements;
  }, [content]);

  return <div className={`space-y-1.5 ${className}`}>{renderedElements}</div>;
};

/**
 * Parses inline formatting: **bold**, *italic*, `code`, ~~strike~~, and bare URLs
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
