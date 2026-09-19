import React from "react";
import { Sparkles, RotateCw } from "lucide-react";

interface MappingMatrixHeaderProps {
  title?: string;
  version?: string;
  status?: string;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

const LEGEND = [
  { label: "3 – High", bg: "bg-green-800", text: "text-white", char: "3" },
  { label: "2 – Medium", bg: "bg-blue-700", text: "text-white", char: "2" },
  { label: "1 – Low", bg: "bg-amber-600", text: "text-white", char: "1" },
  { label: "– No Mapping", bg: "bg-gray-300", text: "text-[#000]", char: "–" },
];

const MappingMatrixHeader = ({
  title = "CO–PO Mapping Matrix",
  version,
  status,
  onGenerate,
  isGenerating,
}: MappingMatrixHeaderProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-700">
    {/* Title + version badge + status + Generate Button */}
    <div className="flex flex-wrap items-center gap-2.5">
      <h3 className="text-sm font-bold text-[#000] dark:text-white">
        {title}
      </h3>
      {version && (
        <span className="text-color2 rounded-full bg-[#ede9fe] px-2.5 py-0.5 text-xs font-semibold">
          {version}
        </span>
      )}
      {status && (
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
            status.toLowerCase() === "approved"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
          }`}
        >
          {status}
        </span>
      )}

      {onGenerate && (
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <RotateCw className="h-3.5 w-3.5 animate-spin" />
              <span>Generating with AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Generate CO-PO Mapping</span>
            </>
          )}
        </button>
      )}
    </div>

    {/* Legend */}
    <div className="flex flex-wrap items-center gap-3 text-xs text-[#000] dark:text-gray-300">
      <span className="font-semibold">Strength:</span>
      {LEGEND.map((l) => (
        <span key={l.label} className="flex items-center gap-1">
          <span
            className={`inline-flex h-2 w-2 items-center justify-center rounded-full text-[10px] font-bold ${l.bg} ${l.text}`}
          />
          {l.label}
        </span>
      ))}
      <span className="bg-color2-l text-color2 rounded-md px-2 py-1 font-bold flex items-center gap-1">
        <span
          className="bg-color2 inline-flex h-1.5 w-1.5 items-center justify-center rounded-full text-[10px] font-bold"
        />
        AI Suggested
      </span>
    </div>
  </div>
);

export default MappingMatrixHeader;
