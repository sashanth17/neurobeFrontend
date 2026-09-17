import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface PoRationaleItem {
  id?: string;
  poCode: string;
  poTitle: string;
  strengthText: string;
  strengthBadgeClass?: string;
  rationale: string;
}

export interface MappingRationaleItemProps {
  id?: string;
  coCode: string;
  statement: string;
  mappedCountText: string;
  poItems?: PoRationaleItem[];
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

const MappingRationaleItem: React.FC<MappingRationaleItemProps> = ({
  coCode,
  statement,
  mappedCountText,
  poItems = [],
  isOpen = false,
  onToggle,
  className = "",
}) => {
  return (
    <div
      className={`rounded-2xl border transition-all ${isOpen
        ? "border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/90"
        : "border-gray-200/80 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-800/40"
        } ${className}`}
    >
      {/* Header Row (Clickable Accordion Bar) */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex flex-col bg-dark_grey  sm:flex-row sm:items-center justify-between gap-3 p-4 text-left outline-none"
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <span className="rounded-lg bg-[#f5f3ff] px-2.5 py-1 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
            {coCode}
          </span>
          <p className="text-sm font-semibold text-pri dark:text-gray-200 leading-snug truncate sm:whitespace-normal">
            {statement}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <span className="text-xs font-mono text-pri dark:text-gray-400">
            {mappedCountText}
          </span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-pri" />
          ) : (
            <ChevronDown className="h-4 w-4 text-pri" />
          )}
        </div>
      </button>

      {/* Expanded Details Content */}
      {isOpen && poItems.length > 0 && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-gray-100 dark:border-gray-700/60">
          {poItems.map((po, idx) => (
            <div key={po.id || idx} className="space-y-2 pt-2">
              {/* PO Title & Strength Badge Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 ">
                <div className="flex items-center gap-1.5 text-sm font-bold text-[#000] dark:text-white">
                  <span className="font-bold">{po.poCode}</span>
                  <span className="font-extrabold text-pri">•</span>
                  <span className="font-bold text-sm text-color1">{po.poTitle}</span>
                </div>

                <span
                  className={`rounded-xl px-3 py-1 text-xs font-bold font-mono shrink-0 self-start sm:self-auto ${po.strengthBadgeClass ||
                    "bg-[#f5f3ff] text-color2 dark:bg-purple-950/60 dark:text-purple-300"
                    }`}
                >
                  {po.strengthText}
                </span>
              </div>

              {/* Approved Academic Rationale Box */}
              <div className="rounded-xl border border-gray-100 bg-[#f8fafc] p-4 dark:border-gray-800 dark:bg-gray-800/40">
                <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri mb-1">
                  APPROVED ACADEMIC RATIONALE
                </p>
                <p className="text-sm font-medium text-[#000] dark:text-gray-300 leading-relaxed">
                  {po.rationale}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MappingRationaleItem;
