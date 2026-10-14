/**
 * KaTeX dynamic loader and math renderer utility for Neurobe
 * Handles inline ($...$, \(...\)) and block ($$...$$, \[...\]) math formulas
 * Automatically decodes rich-text HTML entities inside math delimiters.
 */

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

let isKatexScriptLoading = false;
let isKatexScriptLoaded = false;
const listeners: Array<() => void> = [];

export function loadKatex(onLoaded?: () => void) {
  if (typeof window === "undefined") return;

  if (window.katex) {
    if (onLoaded) onLoaded();
    return;
  }

  if (onLoaded) {
    listeners.push(onLoaded);
  }

  if (isKatexScriptLoading) return;
  isKatexScriptLoading = true;

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
      isKatexScriptLoaded = true;
      isKatexScriptLoading = false;
      while (listeners.length > 0) {
        const cb = listeners.shift();
        if (cb) cb();
      }
    };
    script.onerror = () => {
      isKatexScriptLoading = false;
    };
    document.head.appendChild(script);
  }
}

export function isKatexAvailable(): boolean {
  return typeof window !== "undefined" && !!window.katex;
}

// Unescape rich text HTML entities within formula string before sending to KaTeX
function cleanLatexString(raw: string): string {
  return raw
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, "") // strip accidental HTML tags inside formula
    .trim();
}

// Plain-text math beautifier if KaTeX is loading or unavailable
export function fallbackMathFormat(tex: string): string {
  const clean = cleanLatexString(tex);
  return clean
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, "$1√($2)")
    .replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, "∑_{$1}^{$2}")
    .replace(/\\sum/g, "∑")
    .replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, "∫_{$1}^{$2}")
    .replace(/\\int/g, "∫")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\leq?/g, "≤")
    .replace(/\\geq?/g, "≥")
    .replace(/\\neq?/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\infty/g, "∞")
    .replace(/\\in/g, "∈")
    .replace(/\\notin/g, "∉")
    .replace(/\\subset/g, "⊂")
    .replace(/\\cup/g, "∪")
    .replace(/\\cap/g, "∩")
    .replace(/\\forall/g, "∀")
    .replace(/\\exists/g, "∃")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\theta/g, "θ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\pi/g, "π")
    .replace(/\\sigma/g, "σ")
    .replace(/\\omega/g, "ω")
    .replace(/\\Delta/g, "Δ")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\^n/g, "ⁿ");
}

/**
 * Render a single TeX string to HTML via KaTeX
 */
export function renderLatex(tex: string, displayMode: boolean = false): { html: string; error?: string } {
  const cleanTex = cleanLatexString(tex);
  if (!cleanTex) return { html: "" };

  if (typeof window !== "undefined" && window.katex) {
    try {
      const html = window.katex.renderToString(cleanTex, {
        displayMode,
        throwOnError: true,
      });
      return { html };
    } catch (err: any) {
      // In case of syntax error, attempt non-throwing render
      try {
        const fallbackHtml = window.katex.renderToString(cleanTex, {
          displayMode,
          throwOnError: false,
        });
        return { html: fallbackHtml, error: err?.message || "Syntax error" };
      } catch (inner) {
        return {
          html: `<span class="katex-fallback font-serif italic text-purple-800">${fallbackMathFormat(cleanTex)}</span>`,
          error: err?.message || "Invalid LaTeX syntax",
        };
      }
    }
  }

  // Fallback if KaTeX JS not yet ready
  return {
    html: `<span class="katex-fallback font-serif italic text-purple-900">${fallbackMathFormat(cleanTex)}</span>`,
  };
}

/**
 * Replaces all $...$, $$...$$, \[...\], \(...\) inside an HTML or plain text string
 * with rendered KaTeX markup while leaving outer HTML structure completely intact.
 */
export function renderMathInHtml(content?: string | null): string {
  if (!content) return "";

  // Check if content might contain LaTeX math markers
  const mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[^$\n]+?\$|\\\([\s\S]*?\\\))/g;
  if (!mathRegex.test(content)) {
    return content;
  }

  return content.replace(mathRegex, (match) => {
    let tex = "";
    let isBlock = false;

    if (match.startsWith("$$")) {
      tex = match.slice(2, -2);
      isBlock = true;
    } else if (match.startsWith("\\[")) {
      tex = match.slice(2, -2);
      isBlock = true;
    } else if (match.startsWith("$")) {
      tex = match.slice(1, -1);
      isBlock = false;
    } else if (match.startsWith("\\(")) {
      tex = match.slice(2, -2);
      isBlock = false;
    }

    const { html } = renderLatex(tex, isBlock);
    return isBlock ? `<div class="katex-block-wrapper my-2">${html}</div>` : html;
  });
}
