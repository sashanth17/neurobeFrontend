import React from "react";
import { ArrowLeft, CheckCircle, Info } from "lucide-react";

export interface CIAPaperFinalizationActionsProps {
  onBackToEditSections?: () => void;
  onSaveDraft?: () => void;
  onApproveFinalize?: () => void;
  totalPaperMarks?: number | string;
  requirementText?: string;
}

export const CIAPaperFinalizationActions: React.FC<CIAPaperFinalizationActionsProps> = ({
  onBackToEditSections,
  onSaveDraft,
  onApproveFinalize,
  totalPaperMarks = 100,
  requirementText,
}) => {
  const defaultRequirement = `Finalization requirement: Sum of all Section Marks must equal Total Paper Marks (${totalPaperMarks} Marks), and question marks inside each section must equal the section's allocated marks.`;

  return (
    <div className="space-y-4 pt-2 pb-6">
      {/* Top Row: Navigation Back & Main Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Back to Edit Sections */}
        <button
          type="button"
          onClick={onBackToEditSections || (() => window.history.back())}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs md:text-sm font-semibold text-[#000] shadow-2xs hover:bg-gray-50 active:scale-[0.99] transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4 text-pri dark:text-gray-400" />
          <span>Back to Edit Sections</span>
        </button>

        {/* Right: Save Draft & Approve & Finalize */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSaveDraft || (() => console.log("Save Draft"))}
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs md:text-sm font-semibold text-[#000] shadow-2xs hover:bg-gray-50 active:scale-[0.99] transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={onApproveFinalize || (() => console.log("Approve & Finalize"))}
            className="inline-flex items-center gap-2 rounded-xl bg-color2 px-5 py-2 text-xs md:text-sm font-bold text-white shadow-xs hover:opacity-90 active:scale-[0.99] transition-all"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Approve & Finalize</span>
          </button>
        </div>
      </div>

      {/* Bottom Info Banner */}
      <div className="rounded-2xl border border-amber-200/90 bg-[#FFFDF0] p-4 text-xs md:text-sm text-amber-900 shadow-2xs flex items-start sm:items-center gap-3 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
        <div className="rounded-full border border-amber-300 bg-amber-100/80 p-1 shrink-0 dark:border-amber-700 dark:bg-amber-900/50">
          <Info className="h-4 w-4 text-amber-800 dark:text-amber-300" />
        </div>
        <p className="leading-relaxed">
          <strong className="font-bold text-amber-950 dark:text-amber-200">
            Finalization requirement:
          </strong>{" "}
          {requirementText ||
            `Sum of all Section Marks must equal Total Paper Marks (${totalPaperMarks} Marks), and question marks inside each section must equal the section's allocated marks.`}
        </p>
      </div>
    </div>
  );
};

export default CIAPaperFinalizationActions;
