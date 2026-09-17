import React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface ProgramOutcomeAccordionItemProps {
  id?: string;
  poCode: string;
  poTitle: string;
  description: string;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

const ProgramOutcomeAccordionItem: React.FC<
  ProgramOutcomeAccordionItemProps
> = ({ poCode, poTitle, description, isOpen = false, onToggle, className = "" }) => {
  return (
    <div
      className={`rounded-2xl border transition-all ${
        isOpen
          ? "border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/90"
          : "border-gray-200/80 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-800/40"
      } ${className}`}
    >
      {/* Header Row (Clickable Accordion Bar) */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-left outline-none bg-dark_grey rounded-2xl"
      >
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <span className="rounded-lg bg-[#f5f3ff] px-2.5 py-1 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
            {poCode}
          </span>
          <h4 className="text-sm font-semibold text-pri dark:text-gray-200 leading-snug truncate sm:whitespace-normal">
            {poTitle}
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-pri" />
          ) : (
            <ChevronDown className="h-4 w-4 text-pri" />
          )}
        </div>
      </button>

      {/* Expanded Description Box */}
      {isOpen && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700/60 text-sm font-medium text-[#000] dark:text-gray-300 leading-relaxed">
          {description}
        </div>
      )}
    </div>
  );
};

export default ProgramOutcomeAccordionItem;
