import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Sparkles,
  HelpCircle,
  Copy,
  RotateCcw,
  Sigma,
  Code2,
  Terminal,
  BookOpen,
} from "lucide-react";
import { loadKatex, renderLatex } from "./katexLoader";

export interface LatexFormulaModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (formulaCode: string) => void;
  initialFormula?: string;
  targetLabel?: string;
}

interface SymbolItem {
  label: string;
  latex: string;
  display?: string;
  tooltip?: string;
}

const CATEGORIES = [
  { id: "cs", name: "Data Structures & CS" },
  { id: "algebra", name: "Algebra & Powers" },
  { id: "calculus", name: "Calculus & Sums" },
  { id: "greek", name: "Greek Letters" },
  { id: "symbols", name: "Symbols & Logic" },
  { id: "matrix", name: "Matrices & Linear Alg" },
];

const SYMBOL_GROUPS: Record<string, SymbolItem[]> = {
  cs: [
    { label: "O(1)", latex: "O(1)", tooltip: "Constant Time" },
    { label: "O(log n)", latex: "O(\\log n)", tooltip: "Logarithmic Time" },
    { label: "O(n)", latex: "O(n)", tooltip: "Linear Time" },
    { label: "O(n log n)", latex: "O(n \\log n)", tooltip: "Linearithmic Time" },
    { label: "O(n²)", latex: "O(n^2)", tooltip: "Quadratic Time" },
    { label: "O(2ⁿ)", latex: "O(2^n)", tooltip: "Exponential Time" },
    { label: "Ω(n)", latex: "\\Omega(n)", tooltip: "Omega Lower Bound" },
    { label: "Θ(n)", latex: "\\Theta(n)", tooltip: "Theta Tight Bound" },
    { label: "Floor", latex: "\\lfloor \\frac{n}{2} \\rfloor", tooltip: "Floor function" },
    { label: "Ceiling", latex: "\\lceil \\frac{n}{2} \\rceil", tooltip: "Ceiling function" },
    { label: "Divide & Conquer", latex: "T(n) = 2T(n/2) + O(n)", tooltip: "MergeSort Recurrence" },
    { label: "Linear Recurrence", latex: "T(n) = T(n-1) + O(1)", tooltip: "Linear Search Recurrence" },
    { label: "Tree Nodes", latex: "2^{h+1} - 1", tooltip: "Max nodes in binary tree" },
    { label: "Tree Height", latex: "\\lfloor \\log_2 n \\rfloor", tooltip: "Height of complete binary tree" },
    { label: "P ≠ NP", latex: "\\mathcal{P} \\neq \\mathcal{NP}", tooltip: "Complexity class" },
  ],
  algebra: [
    { label: "Fraction", latex: "\\frac{a}{b}", tooltip: "Fraction a/b" },
    { label: "Square Root", latex: "\\sqrt{x}", tooltip: "Square root" },
    { label: "N-th Root", latex: "\\sqrt[n]{x}", tooltip: "N-th root" },
    { label: "Power", latex: "x^{2}", tooltip: "Superscript power" },
    { label: "Subscript", latex: "x_{i}", tooltip: "Subscript index" },
    { label: "Sub & Super", latex: "x_{i}^{2}", tooltip: "Both sub and superscript" },
    { label: "Quadratic", latex: "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", tooltip: "Quadratic formula" },
    { label: "Binomial", latex: "\\binom{n}{k}", tooltip: "Combination n choose k" },
    { label: "Abs", latex: "|x|", tooltip: "Absolute value" },
    { label: "( a / b )", latex: "\\left( \\frac{a}{b} \\right)", tooltip: "Auto-scaled parentheses" },
    { label: "[ a / b ]", latex: "\\left[ \\frac{a}{b} \\right]", tooltip: "Auto-scaled brackets" },
  ],
  calculus: [
    { label: "Definite Int", latex: "\\int_{a}^{b} f(x) \\, dx", tooltip: "Definite integral" },
    { label: "Indefinite Int", latex: "\\int f(x) \\, dx", tooltip: "Indefinite integral" },
    { label: "Double Int", latex: "\\iint_D f(x,y) \\, dA", tooltip: "Double integral" },
    { label: "Summation", latex: "\\sum_{i=1}^{n} x_i", tooltip: "Sigma summation" },
    { label: "Product", latex: "\\prod_{i=1}^{n} x_i", tooltip: "Capital Pi product" },
    { label: "Limit (x→0)", latex: "\\lim_{x \\to 0} f(x)", tooltip: "Limit as x approaches 0" },
    { label: "Limit (n→∞)", latex: "\\lim_{n \\to \\infty} a_n", tooltip: "Limit as n approaches infinity" },
    { label: "dy / dx", latex: "\\frac{dy}{dx}", tooltip: "First derivative" },
    { label: "d²y / dx²", latex: "\\frac{d^2 y}{dx^2}", tooltip: "Second derivative" },
    { label: "∂f / ∂x", latex: "\\frac{\\partial f}{\\partial x}", tooltip: "Partial derivative" },
  ],
  greek: [
    { label: "α", latex: "\\alpha", tooltip: "Alpha" },
    { label: "β", latex: "\\beta", tooltip: "Beta" },
    { label: "γ", latex: "\\gamma", tooltip: "Gamma" },
    { label: "δ", latex: "\\delta", tooltip: "Delta" },
    { label: "ε", latex: "\\epsilon", tooltip: "Epsilon" },
    { label: "θ", latex: "\\theta", tooltip: "Theta" },
    { label: "λ", latex: "\\lambda", tooltip: "Lambda" },
    { label: "μ", latex: "\\mu", tooltip: "Mu" },
    { label: "π", latex: "\\pi", tooltip: "Pi" },
    { label: "σ", latex: "\\sigma", tooltip: "Sigma" },
    { label: "τ", latex: "\\tau", tooltip: "Tau" },
    { label: "φ", latex: "\\phi", tooltip: "Phi" },
    { label: "ω", latex: "\\omega", tooltip: "Omega" },
    { label: "Δ", latex: "\\Delta", tooltip: "Capital Delta" },
    { label: "Θ", latex: "\\Theta", tooltip: "Capital Theta" },
    { label: "Λ", latex: "\\Lambda", tooltip: "Capital Lambda" },
    { label: "Σ", latex: "\\Sigma", tooltip: "Capital Sigma" },
    { label: "Ω", latex: "\\Omega", tooltip: "Capital Omega" },
  ],
  symbols: [
    { label: "≤", latex: "\\leq", tooltip: "Less than or equal" },
    { label: "≥", latex: "\\geq", tooltip: "Greater than or equal" },
    { label: "≠", latex: "\\neq", tooltip: "Not equal" },
    { label: "≈", latex: "\\approx", tooltip: "Approximately equal" },
    { label: "±", latex: "\\pm", tooltip: "Plus-minus" },
    { label: "×", latex: "\\times", tooltip: "Multiplication" },
    { label: "÷", latex: "\\div", tooltip: "Division" },
    { label: "·", latex: "\\cdot", tooltip: "Center dot" },
    { label: "∞", latex: "\\infty", tooltip: "Infinity" },
    { label: "∈", latex: "\\in", tooltip: "Element of" },
    { label: "∉", latex: "\\notin", tooltip: "Not element of" },
    { label: "⊂", latex: "\\subset", tooltip: "Proper subset" },
    { label: "⊆", latex: "\\subseteq", tooltip: "Subset or equal" },
    { label: "∪", latex: "\\cup", tooltip: "Union" },
    { label: "∩", latex: "\\cap", tooltip: "Intersection" },
    { label: "∀", latex: "\\forall", tooltip: "For all" },
    { label: "∃", latex: "\\exists", tooltip: "There exists" },
    { label: "⇒", latex: "\\implies", tooltip: "Implies" },
    { label: "⇔", latex: "\\iff", tooltip: "If and only if" },
    { label: "→", latex: "\\rightarrow", tooltip: "Right arrow" },
  ],
  matrix: [
    {
      label: "2x2 Matrix",
      latex: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
      tooltip: "2x2 Parentheses matrix",
    },
    {
      label: "Bracket Matrix",
      latex: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
      tooltip: "2x2 Bracket matrix",
    },
    {
      label: "Determinant",
      latex: "\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}",
      tooltip: "2x2 Determinant",
    },
    { label: "Vector", latex: "\\vec{v}", tooltip: "Vector arrow" },
    { label: "Transpose", latex: "\\mathbf{A}^T", tooltip: "Matrix Transpose" },
    { label: "Inverse", latex: "\\mathbf{A}^{-1}", tooltip: "Matrix Inverse" },
  ],
};

const PRESETS = [
  { label: "Merge Sort O(n log n)", latex: "O(n \\log n)" },
  { label: "Binary Search O(log n)", latex: "O(\\log n)" },
  { label: "Master Theorem Recurrence", latex: "T(n) = 2T\\left(\\frac{n}{2}\\right) + O(n)" },
  { label: "Quadratic Formula", latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
  { label: "Sum of Series (1 to n)", latex: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" },
  { label: "Definite Integral", latex: "\\int_{0}^{1} x^2 \\, dx = \\frac{1}{3}" },
];

export const LatexFormulaModal: React.FC<LatexFormulaModalProps> = ({
  open,
  onClose,
  onInsert,
  initialFormula = "",
  targetLabel = "Question Statement",
}) => {
  const [activeCategory, setActiveCategory] = useState("cs");
  const [formula, setFormula] = useState("");
  const [isBlockMath, setIsBlockMath] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Initialize or strip existing delimiters if prefilled
  useEffect(() => {
    if (open) {
      loadKatex();
      let raw = initialFormula.trim();
      if (raw.startsWith("$$") && raw.endsWith("$$")) {
        setFormula(raw.slice(2, -2).trim());
        setIsBlockMath(true);
      } else if (raw.startsWith("$") && raw.endsWith("$")) {
        setFormula(raw.slice(1, -1).trim());
        setIsBlockMath(false);
      } else {
        setFormula(raw || "O(n \\log n)");
        setIsBlockMath(false);
      }
    }
  }, [open, initialFormula]);

  if (!open) return null;

  // Insert a symbol or template at the cursor position
  const handleInsertSymbol = (latexToAdd: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setFormula((prev) => (prev ? `${prev} ${latexToAdd}` : latexToAdd));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formula;

    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = `${before}${latexToAdd}${after}`;

    setFormula(newText);

    // Focus and position cursor right after insertion
    setTimeout(() => {
      textarea.focus();
      const newPos = start + latexToAdd.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  const handleCopy = () => {
    const wrapped = isBlockMath ? `$$${formula}$$` : `$${formula}$`;
    navigator.clipboard.writeText(wrapped);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertToEditor = () => {
    if (!formula.trim()) {
      onClose();
      return;
    }
    const clean = formula.trim();
    const finalDelimited = isBlockMath ? `$$${clean}$$` : `$${clean}$`;
    onInsert(finalDelimited);
    onClose();
  };

  const { html: renderedHtml, error: renderError } = renderLatex(formula, isBlockMath);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 dark:bg-slate-900 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-5 py-3.5 bg-gradient-to-r from-purple-50/70 via-indigo-50/40 to-white dark:from-purple-950/30 dark:via-slate-900 dark:to-slate-900 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-500/30">
              <Sigma className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  LaTeX Math Formula Builder
                </h3>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                  {targetLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Click symbols to insert, write LaTeX, or choose presets. Real-time KaTeX rendering.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Presets & Quick Pickers */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Quick Templates
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormula(p.latex)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-purple-300 hover:bg-purple-50/70 hover:text-purple-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 transition shadow-2xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symbol Category Tabs */}
          <div>
            <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-1.5 dark:border-slate-800 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Symbol Palette Grid */}
            <div className="mt-2.5 grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
              {SYMBOL_GROUPS[activeCategory]?.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleInsertSymbol(item.latex)}
                  title={item.tooltip || item.latex}
                  className="group flex flex-col items-center justify-center rounded-lg border border-slate-200/80 bg-white p-1.5 hover:border-purple-400 hover:bg-purple-50/80 dark:border-slate-700/80 dark:bg-slate-800 dark:hover:bg-slate-750 transition active:scale-95 shadow-2xs"
                >
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 truncate max-w-full">
                    {item.label}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 truncate max-w-full">
                    {item.latex}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Formula Editor Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                LaTeX Formula Code
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-purple-600 dark:hover:text-purple-400 transition"
                  title="Copy LaTeX string"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormula("")}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 transition"
                  title="Clear formula"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              rows={3}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g. O(n \log n) or \frac{a}{b} or \sqrt{x^2 + y^2}"
              className="w-full rounded-xl border border-slate-300 bg-slate-900 p-3 font-mono text-xs text-purple-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-slate-700"
            />

            {/* Display Mode Toggle */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Display Mode:</span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBlockMath(false)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    !isBlockMath
                      ? "bg-white text-purple-700 shadow-xs dark:bg-slate-700 dark:text-purple-300 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Inline ($...$)
                </button>
                <button
                  type="button"
                  onClick={() => setIsBlockMath(true)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    isBlockMath
                      ? "bg-white text-purple-700 shadow-xs dark:bg-slate-700 dark:text-purple-300 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  }`}
                >
                  Block ($$...$$)
                </button>
              </div>
            </div>
          </div>

          {/* Live KaTeX Render Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                <span>Live KaTeX Preview</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Formatted as:{" "}
                <code className="text-purple-600 font-mono">
                  {isBlockMath ? `$$...$$` : `$...$`}
                </code>
              </span>
            </div>

            <div className="min-h-[85px] rounded-xl border border-purple-200/70 bg-gradient-to-b from-purple-50/40 to-slate-50/40 p-4 flex flex-col items-center justify-center text-center dark:border-purple-900/40 dark:bg-slate-900/60 dark:from-purple-950/20">
              {formula.trim() ? (
                <div
                  className="katex-preview text-base sm:text-lg text-slate-900 dark:text-white max-w-full overflow-x-auto py-1"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Formula preview will appear here as you type or pick symbols...
                </span>
              )}

              {renderError && (
                <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                  Note: {renderError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-purple-500" />
            <span>KaTeX renders with full mathematical typesetting.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInsertToEditor}
              disabled={!formula.trim()}
              className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition hover:from-purple-700 hover:to-indigo-700 active:scale-98 ${
                !formula.trim() ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Insert Formula</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LatexFormulaModal;
