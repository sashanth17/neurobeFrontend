import { TriangleAlert } from "lucide-react";

interface ReviewModeBarProps {
  onSaveDraft?: () => void;
  onContinue?: () => void;
}

const ReviewModeBar = ({ onSaveDraft, onContinue }: ReviewModeBarProps) => {
  return (
    <div className="mb-5 mt-2 flex items-center justify-between rounded-xl border border-yellow-200 bg-[#FEF3C7] px-5 py-4 dark:border-yellow-800 dark:bg-yellow-900/20">
      <div className="flex items-center gap-3"> 
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white">
          <TriangleAlert className="h-5 w-5 text-yellow-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#000] dark:text-white">
              NOTHING IS FINAL UNTIL COORDINATOR APPROVAL
            </p>
            <span className="rounded-full border border-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-600">
              Review Mode
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[#000] dark:text-gray-400">
            Verify all AI-extracted fields against the source PDF on the left. You can edit every title, topic, L-T-P-C value, and Knowledge Level.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onSaveDraft}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#000] hover:bg-gray-50 transition-all dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          <span>🗒</span> Save Draft
        </button>
        <button
          onClick={onContinue}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-all"
        >
          Continue to Approve & Save →
        </button>
      </div>
    </div>
  );
};

export default ReviewModeBar;
