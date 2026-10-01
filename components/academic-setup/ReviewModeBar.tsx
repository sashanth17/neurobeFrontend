import React from "react";
import { ArrowLeft, CheckCircle2, RotateCw, Sparkles, FileText, ArrowRight } from "lucide-react";

interface ReviewModeBarProps {
  fileVersionNumber: number;
  extractionVersion?: number | null;
  extractionStatus?: string;
  isSaving: boolean;
  isApproving: boolean;
  onBackToVersions: () => void;
  onSaveDraft: () => void;
  onApprove: () => void;
  onProceedToCopo?: () => void;
}

const ReviewModeBar: React.FC<ReviewModeBarProps> = ({
  fileVersionNumber,
  extractionVersion,
  extractionStatus = "draft",
  isSaving,
  isApproving,
  onBackToVersions,
  onSaveDraft,
  onApprove,
  onProceedToCopo,
}) => {
  const isApproved = extractionStatus.toLowerCase() === "approved";

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      {/* Left: Back button & Version info */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToVersions}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>All Syllabus Files</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
            <FileText className="h-3.5 w-3.5" />
            <span>File v{fileVersionNumber}</span>
          </div>

          {extractionVersion && (
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Extraction v{extractionVersion}</span>
            </div>
          )}

          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              isApproved
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
            }`}
          >
            {isApproved ? "✓ Approved" : "Draft (Reviewing)"}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {!isApproved && (
          <button
            type="button"
            disabled={isSaving || isApproving}
            onClick={onSaveDraft}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {isSaving ? <RotateCw className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>Save Draft</span>
          </button>
        )}

        {isApproved ? (
          <button
            type="button"
            onClick={onProceedToCopo}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            <span>Proceed to CO-PO Mapping</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isApproving || isSaving}
            onClick={onApprove}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {isApproving ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>Approving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>Approve Extraction</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ReviewModeBar;
