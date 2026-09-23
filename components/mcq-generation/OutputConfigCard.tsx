import React from "react";
import {
  SlidersHorizontal,
  Sparkles,
  RefreshCw,
  Clock,
  Shuffle,
  BookOpenCheck,
  Zap,
} from "lucide-react";

interface OutputConfigCardProps {
  questionCount: number;
  onQuestionCountChange: (count: number) => void;

  includeExplanation: boolean;
  onToggleExplanation: () => void;

  shuffleOptions: boolean;
  onToggleShuffle: () => void;

  marksPerQuestion: string;
  onMarksChange: (marks: string) => void;

  isGeneratingAI: boolean;
  canGenerate: boolean;
  validationError?: string | null;

  onGenerateForeground: () => void;
  onGenerateBackground: () => void;
}

const PRESET_COUNTS = [5, 10, 15, 20, 25, 30];

export const OutputConfigCard: React.FC<OutputConfigCardProps> = ({
  questionCount,
  onQuestionCountChange,
  includeExplanation,
  onToggleExplanation,
  shuffleOptions,
  onToggleShuffle,
  marksPerQuestion,
  onMarksChange,
  isGeneratingAI,
  canGenerate,
  validationError,
  onGenerateForeground,
  onGenerateBackground,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900">
      {/* ── Card Header ── */}
      <div className="flex flex-col gap-2 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Step 4
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Output Specifications & Execution
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configure question quantity, rationale toggles, and start foreground or background generation.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* ── Row 1: Question Count Selector + Presets ── */}
        <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/30 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
              Total Questions to Generate
            </label>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Range: 1 to 50 questions per generation job.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick preset buttons */}
            <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-gray-200 dark:border-gray-700 dark:bg-gray-800">
              {PRESET_COUNTS.map((cnt) => (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => onQuestionCountChange(cnt)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    questionCount === cnt
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {cnt}
                </button>
              ))}
            </div>

            {/* Stepper control */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onQuestionCountChange(Math.max(1, questionCount - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
              >
                −
              </button>
              <input
                type="number"
                min={1}
                max={50}
                value={questionCount}
                onChange={(e) =>
                  onQuestionCountChange(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))
                }
                className="w-14 rounded-lg border border-gray-200 bg-white py-1.5 text-center text-xs font-bold text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={() => onQuestionCountChange(Math.min(50, questionCount + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* ── Row 2: Switches and Marks ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Toggle: Explanations */}
          <div
            onClick={onToggleExplanation}
            className={`flex cursor-pointer items-start justify-between rounded-xl border p-3.5 transition-all ${
              includeExplanation
                ? "border-emerald-500 bg-emerald-50/40 dark:border-emerald-600 dark:bg-emerald-950/20"
                : "border-gray-200 bg-white opacity-70 dark:border-gray-800 dark:bg-gray-800/40"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${
                  includeExplanation
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                <BookOpenCheck className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">Conceptual Explanations</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  Detailed rationale for correct & distractor options
                </div>
              </div>
            </div>
            {/* Toggle visual */}
            <div
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                includeExplanation ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  includeExplanation ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </div>
          </div>

          {/* Toggle: Shuffle Options */}
          <div
            onClick={onToggleShuffle}
            className={`flex cursor-pointer items-start justify-between rounded-xl border p-3.5 transition-all ${
              shuffleOptions
                ? "border-emerald-500 bg-emerald-50/40 dark:border-emerald-600 dark:bg-emerald-950/20"
                : "border-gray-200 bg-white opacity-70 dark:border-gray-800 dark:bg-gray-800/40"
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div
                className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg ${
                  shuffleOptions
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                <Shuffle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-900 dark:text-white">Shuffle Answers</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">
                  Randomize correct position across A, B, C, D
                </div>
              </div>
            </div>
            {/* Toggle visual */}
            <div
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                shuffleOptions ? "bg-emerald-600" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  shuffleOptions ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </div>
          </div>

          {/* Select: Marks per question */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-800/40">
            <div>
              <div className="text-xs font-bold text-gray-900 dark:text-white">Marks per Question</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">Assessment weightage</div>
            </div>
            <select
              value={marksPerQuestion}
              onChange={(e) => onMarksChange(e.target.value)}
              className="h-8 rounded-lg border border-gray-200 bg-gray-50 px-2.5 text-xs font-bold text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="0.5">0.5 Mark</option>
              <option value="1">1 Mark</option>
              <option value="2">2 Marks</option>
              <option value="4">4 Marks</option>
            </select>
          </div>
        </div>

        {/* ── Validation error message if any ── */}
        {validationError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
            {validationError}
          </div>
        )}

        {/* ── Row 3: Action Buttons (Foreground & Background) ── */}
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
          {/* Secondary Action: Run in Background */}
          <button
            type="button"
            disabled={isGeneratingAI || !canGenerate}
            onClick={onGenerateBackground}
            className="flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Clock className="h-4 w-4 text-indigo-500" />
            <span>Run in Background</span>
          </button>

          {/* Primary Action: Generate Foreground */}
          <button
            type="button"
            disabled={isGeneratingAI || !canGenerate}
            onClick={onGenerateForeground}
            className="flex items-center justify-center gap-2 rounded-xl bg-color1 px-7 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-color1/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Generating {questionCount} Questions with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Questions Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
