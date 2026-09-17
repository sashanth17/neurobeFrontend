import React from "react";
import { Eye, Edit3, Printer } from "lucide-react";

export interface ProgressData {
  sectionsCompleted?: string;
  marksFilled?: string;
  lastEdited?: string;
}

export interface ApprovedData {
  totalMarks?: string;
  sections?: string | number;
  questions?: string | number;
  lastUpdated?: string;
}

export interface CIAQuestionPaperStatusCardProps {
  status?: "draft" | "approved";
  title?: string;
  courseCodeTitle?: string;
  progressData?: ProgressData;
  approvedData?: ApprovedData;
  onViewDraft?: () => void;
  onResumeEditing?: () => void;
  onViewPaper?: () => void;
  onPrint?: () => void;
}

const DEFAULT_PROGRESS_DATA: ProgressData = {
  sectionsCompleted: "2 of 3 Sections Completed",
  marksFilled: "75 of 100 Marks Filled",
  lastEdited: "Last Edited: 2026–09–02 11:30 AM",
};

const DEFAULT_APPROVED_DATA: ApprovedData = {
  totalMarks: "100 Marks",
  sections: 3,
  questions: 10,
  lastUpdated: "Last Updated: 2026–08–25 04:15 PM",
};

export const CIAQuestionPaperStatusCard: React.FC<CIAQuestionPaperStatusCardProps> = ({
  status = "draft",
  title,
  courseCodeTitle = "CS309 — Computer Networks",
  progressData = DEFAULT_PROGRESS_DATA,
  approvedData = DEFAULT_APPROVED_DATA,
  onViewDraft,
  onResumeEditing,
  onViewPaper,
  onPrint,
}) => {
  const isDraft = status === "draft";
  const displayTitle = title || (isDraft ? "CIA–1 Question Paper" : "CIA–2 Question Paper");

  const prog = { ...DEFAULT_PROGRESS_DATA, ...progressData };
  const appr = { ...DEFAULT_APPROVED_DATA, ...approvedData };

  return (
    <div className="flex flex-col justify-between h-full rounded-3xl border border-gray-100 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-5">
      {/* Top Header: Title & Status Badge */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg md:text-xl font-bold text-[#000] dark:text-white">
            {displayTitle}
          </h3>
          <p className="text-sm font-semibold text-pri dark:text-gray-400">
            {courseCodeTitle}
          </p>
        </div>

        {isDraft ? (
          <span className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
            Draft
          </span>
        ) : (
          <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-100/60 dark:bg-emerald-950/60 dark:text-emerald-400">
            Approved
          </span>
        )}
      </div>

      {/* Main Content Area */}
      {isDraft ? (
        /* DRAFT VARIATION: Progress Panel */
        <div className="rounded-2xl border border-gray-100 bg-grey p-4 space-y-1.5 dark:border-gray-800 dark:bg-gray-800/40">
          <p className="text-[11px] font-bold uppercase tracking-wider text-pri">
            PROGRESS:
          </p>
          <p className="text-sm md:text-base font-bold text-[#000] dark:text-white">
            {prog.sectionsCompleted}
          </p>
          <p className="text-sm md:text-base font-bold text-color2 dark:text-purple-400">
            {prog.marksFilled}
          </p>
          <p className="text-xs text-pri dark:text-gray-400 pt-1">
            {prog.lastEdited}
          </p>
        </div>
      ) : (
        /* APPROVED VARIATION: Stats Grid */
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-100 bg-grey p-4 dark:border-gray-800 dark:bg-gray-800/40">
              <p className="text-[11px] font-bold uppercase tracking-wider text-pri">
                TOTAL MARKS
              </p>
              <p className="text-base md:text-lg font-bold text-[#000] dark:text-white mt-1">
                {appr.totalMarks}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-grey p-4 dark:border-gray-800 dark:bg-gray-800/40">
              <p className="text-[11px] font-bold uppercase tracking-wider text-pri">
                SECTIONS
              </p>
              <p className="text-base md:text-lg font-bold text-[#000] dark:text-white mt-1">
                {appr.sections}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-grey p-4 dark:border-gray-800 dark:bg-gray-800/40">
              <p className="text-[11px] font-bold uppercase tracking-wider text-pri">
                QUESTIONS
              </p>
              <p className="text-base md:text-lg font-bold text-[#000] dark:text-white mt-1">
                {appr.questions}
              </p>
            </div>
          </div>

          <p className="text-xs text-pri dark:text-gray-400">
            {appr.lastUpdated}
          </p>
        </div>
      )}

      {/* Action Buttons Row (Bottom Right, aligned across cards via mt-auto) */}
      <div className="flex items-center justify-end gap-3 pt-1 mt-auto">
        {isDraft ? (
          <>
            <button
              type="button"
              onClick={onViewDraft}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-[#000] shadow-2xs hover:bg-gray-50 active:scale-[0.99] transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Eye className="h-4 w-4 text-sm text-pri dark:text-gray-400" />
              <span className="text-sm">View Draft</span>
            </button>

            <button
              type="button"
              onClick={onResumeEditing}
              className="inline-flex items-center gap-2 rounded-xl bg-color2 px-5 py-2 text-xs font-bold text-white shadow-xs hover:opacity-90 active:scale-[0.99] transition-all"
            >
              <Edit3 className="h-4 w-4" />
              <span className="text-sm">Resume Editing</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onViewPaper}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2 text-xs font-bold text-[#000] shadow-2xs hover:bg-gray-50 active:scale-[0.99] transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <Eye className="h-4 w-4 text-pri dark:text-gray-400" />
              <span className="text-sm">View Paper</span>
            </button>

            <button
              type="button"
              onClick={onPrint}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E1B3A] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1E1B4B] active:scale-[0.99] transition-all dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <Printer className="h-4 w-4" />
              <span className="text-sm">Print</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CIAQuestionPaperStatusCard;
