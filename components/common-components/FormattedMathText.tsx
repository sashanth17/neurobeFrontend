import React, { useEffect, useState, useMemo } from "react";

interface FormattedMathTextProps {
  text?: string | null;
  className?: string;
}

declare global {
  interface Window {
    katex?: {
      renderToString: (
        tex: string,
        options?: { displayMode?: boolean; throwOnError?: boolean }
      ) => string;
    };
  }
}

let isKatexLoading = false;
let isKatexLoaded = false;

export const FormattedMathText: React.FC<FormattedMathTextProps> = ({
  text,
  className = "",
}) => {
  const [katexReady, setKatexReady] = useState(
    typeof window !== "undefined" && !!window.katex
  );

  useEffect(() => {
    if (typeof window === "undefined" || window.katex) {
      setKatexReady(true);
      return;
    }

    if (!isKatexLoading && !isKatexLoaded) {
      isKatexLoading = true;

      // 1. Inject KaTeX CSS
      if (!document.getElementById("katex-css")) {
        const link = document.createElement("link");
        link.id = "katex-css";
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css";
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      }

      // 2. Inject KaTeX JS
      if (!document.getElementById("katex-js")) {
        const script = document.createElement("script");
        script.id = "katex-js";
        script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js";
        script.async = true;
        script.onload = () => {
          isKatexLoaded = true;
          isKatexLoading = false;
          setKatexReady(true);
        };
        script.onerror = () => {
          isKatexLoading = false;
        };
        document.head.appendChild(script);
      }
    } else {
      const interval = setInterval(() => {
        if (window.katex) {
          setKatexReady(true);
          clearInterval(interval);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, []);

  // Split text by LaTeX delimiters: $$...$$, $...$, \[...\], \(...\)
  const segments = useMemo(() => {
    if (!text) return [];

    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
    const parts: { type: "text" | "inline-math" | "block-math"; content: string }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }

      const raw = match[0];
      if (raw.startsWith("$$") || raw.startsWith("\\[")) {
        const formula = raw.startsWith("$$")
          ? raw.slice(2, -2).trim()
          : raw.slice(2, -2).trim();
        parts.push({ type: "block-math", content: formula });
      } else {
        const formula = raw.startsWith("$")
          ? raw.slice(1, -1).trim()
          : raw.slice(2, -2).trim();
        parts.push({ type: "inline-math", content: formula });
      }

      lastIndex = match.index + raw.length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return parts;
  }, [text]);

  if (!text) return null;

  // Graceful plain-text math beautifier if KaTeX is not loaded
  const fallbackFormat = (tex: string) => {
    return tex
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
      .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
      .replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, "∑_{$1}^{$2}")
      .replace(/\\sum/g, "∑")
      .replace(/\\int/g, "∫")
      .replace(/\\times/g, "×")
      .replace(/\\cdot/g, "·")
      .replace(/\\leq?/g, "≤")
      .replace(/\\geq?/g, "≥")
      .replace(/\\neq?/g, "≠")
      .replace(/\\approx/g, "≈")
      .replace(/\\infty/g, "∞")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\theta/g, "θ")
      .replace(/\\pi/g, "π")
      .replace(/\\sigma/g, "σ")
      .replace(/\\lambda/g, "λ")
      .replace(/\\Delta/g, "Δ")
      .replace(/\^2/g, "²")
      .replace(/\^3/g, "³")
      .replace(/\^n/g, "ⁿ");
  };

  return (
    <span className={`inline ${className}`}>
      {segments.map((seg, idx) => {
        if (seg.type === "text") {
          return <span key={idx}>{seg.content}</span>;
        }

        const isBlock = seg.type === "block-math";

        if (katexReady && typeof window !== "undefined" && window.katex) {
          try {
            const html = window.katex.renderToString(seg.content, {
              displayMode: isBlock,
              throwOnError: false,
            });

            return (
              <span
                key={idx}
                className={isBlock ? "my-2 block text-center overflow-x-auto" : "inline-block px-1"}
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            // KaTeX parse error fallback
          }
        }

        // Fallback rendered formula
        return (
          <span
            key={idx}
            className={`font-serif italic text-purple-900 dark:text-purple-300 font-semibold ${
              isBlock
                ? "my-2 block text-center rounded-lg bg-gray-100 dark:bg-gray-800 p-2"
                : "rounded bg-purple-50 dark:bg-purple-950/40 px-1 py-0.5 mx-0.5"
            }`}
          >
            {fallbackFormat(seg.content)}
          </span>
        );
      })}
    </span>
  );
};

export default FormattedMathText;
