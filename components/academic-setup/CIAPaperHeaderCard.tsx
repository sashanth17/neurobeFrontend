import React from "react";
import { Eye, Printer } from "lucide-react";

export interface CIAPaperHeaderCardProps {
  selectedPaperName?: string;
  versionBadgeText?: string;
  viewModeText?: string;
  approvedBy?: string;
  approvedDate?: string;
  onPrint?: () => void;
}

const CIAPaperHeaderCard: React.FC<CIAPaperHeaderCardProps> = ({
  selectedPaperName = "CIA 1",
  versionBadgeText = "Approved v1.0",
  viewModeText = "View Only",
  approvedBy = "Dr. Arun Kumar",
  approvedDate = "25 Aug 2026",
  onPrint,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Left Info Section */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="text-xs font-medium uppercase tracking-wider text-pri">
          SELECTED:
        </span>
        <span className="font-bold text-[#000] dark:text-white">
          {selectedPaperName}
        </span>

        {/* Status Badge */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {versionBadgeText}
        </span>

        {/* View Mode Badge */}
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-[#000] dark:bg-gray-700 dark:text-gray-300">
          <Eye className="h-3.5 w-3.5 text-pri" />
          {viewModeText}
        </span>

        <span className="text-gray-300 dark:text-[#000]">|</span>

        {/* Approved Metadata */}
        <span className="text-sm text-pri">
          Approved by{" "}
          <strong className="font-bold text-[#000] dark:text-white">
            {approvedBy}
          </strong>{" "}
          on {approvedDate}
        </span>
      </div>

      {/* Right Print Action Button */}
      <button
        type="button"
        onClick={onPrint || (() => window.print())}
        className="flex items-center gap-2 rounded-xl bg-[#13112E] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#1f1c48] active:scale-[0.99] dark:bg-gray-700 dark:hover:bg-gray-600"
      >
        <Printer className="h-4 w-4" />
        <span>Print Paper</span>
      </button>
    </div>
  );
};

export default CIAPaperHeaderCard;
