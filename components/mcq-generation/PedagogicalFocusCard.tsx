import React from "react";
import {
  Sparkles,
  Calculator,
  Briefcase,
  Code2,
  BookOpen,
  X,
  Lightbulb,
  Check,
} from "lucide-react";
import { PEDAGOGICAL_PRESETS } from "./types";

interface PedagogicalFocusCardProps {
  description: string;
  onDescriptionChange: (desc: string) => void;
  activePresetId: string | null;
  onSelectPreset: (presetId: string) => void;
}

export const PedagogicalFocusCard: React.FC<PedagogicalFocusCardProps> = ({
  description,
  onDescriptionChange,
  activePresetId,
  onSelectPreset,
}) => {
  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case "Calculator":
        return <Calculator className="h-4 w-4" />;
      case "Briefcase":
        return <Briefcase className="h-4 w-4" />;
      case "Code2":
        return <Code2 className="h-4 w-4" />;
      case "BookOpen":
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const activePreset = PEDAGOGICAL_PRESETS.find((p) => p.id === activePresetId);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900">
      {/* ── Card Header ── */}
      <div className="flex flex-col gap-2 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Lightbulb className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Step 3 (Optional)
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Pedagogical Focus & Question Style
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select a specialized pedagogical focus or problem style for the AI question generator.
            </p>
          </div>
        </div>

        {activePreset && (
          <button
            type="button"
            onClick={() => onSelectPreset(activePreset.id)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-red-500 dark:hover:text-red-400"
          >
            <X className="h-3.5 w-3.5" />
            Reset Style
          </button>
        )}
      </div>

      <div className="p-6">
        {/* ── Preset Cards ── */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {PEDAGOGICAL_PRESETS.map((p) => {
            const isSelected = activePresetId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectPreset(p.id)}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? "border-amber-500 bg-amber-50/60 shadow-xs ring-1 ring-amber-500 dark:border-amber-500 dark:bg-amber-950/40"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700"
                }`}
              >
                <div className="mb-2 flex w-full items-center justify-between">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {getPresetIcon(p.iconName)}
                  </div>
                  {isSelected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-gray-900 dark:text-white">{p.label}</span>
                <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Active style preview indicator if selected */}
        {activePreset && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900 border border-amber-200/80 dark:bg-amber-950/30 dark:border-amber-800/60 dark:text-amber-200">
            <span className="font-semibold">Active Focus:</span>
            <span className="text-[11px] leading-snug">{activePreset.description}</span>
          </div>
        )}
      </div>
    </div>
  );
};
