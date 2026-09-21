import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const EXTRACTION_TASKS = [
  "Read syllabus document and extract structure",
  "Extract course code, title, L/T/P/S/C, theory hours and lab hours",
  "Extract course outcomes and knowledge levels",
  "Extract units, topics and unit hours",
  "Extract textbooks and reference books",
];

interface ExtractionCompleteProps {
  fileName?: string;
  progress?: number;
  isLoading?: boolean;
  isApproved?: boolean;
  onReview?: () => void;
}

const ExtractionComplete = ({
  fileName = "CS309_Computer_Networks_Syllabus.pdf",
  progress: progressProp = 100,
  isLoading = false,
  isApproved = false,
  onReview,
}: ExtractionCompleteProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setProgress(progressProp), 100);
    return () => clearTimeout(timer);
  }, [progressProp]);
  return (
    <div className="panel mt-2 mb-5 px-6 py-6 dark:border-gray-700 ">
      {/* Top badge row */}
      <div className="mb-4 flex items-center gap-3">
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          isLoading 
            ? "border border-blue-300 bg-blue-50 text-blue-600"
            : isApproved
            ? "border border-green-400 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
            : "border border-green-300 bg-green-50 text-green-600"
        }`}>
          {isLoading ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div> Processing
            </>
          ) : isApproved ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Approved & Ratified
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" /> Extraction Complete
            </>
          )}
        </span>
        <span className="text-sm text-pri">{fileName}</span>
      </div>

      {/* Title */}
      <h2 className="mb-4 text-xl font-bold text-[#000] dark:text-white">
        {isLoading ? "Processing Extraction..." : isApproved ? "Syllabus Extraction Approved" : "Extraction Complete"}
      </h2>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-1 flex items-center justify-between text-sm font-semibold text-[#000] dark:text-gray-200">
          <span>{isLoading ? "Processing..." : isApproved ? "Syllabus Extraction Approved" : "Extraction Complete"}</span>
          <span className={isLoading ? "text-blue-600" : "text-primary"}>{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${
              isLoading ? "bg-blue-500" : isApproved ? "bg-green-600" : "bg-primary-custom"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Task list */}
      <div className="mb-6 divide-y divide-gray-100 dark:divide-gray-700">
        {EXTRACTION_TASKS.map((task) => (
          <div key={task} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                isLoading ? "bg-blue-500" : isApproved ? "bg-green-600" : "bg-primary-custom"
              }`}>
                {isLoading ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                )}
              </div>
              <span className="text-sm text-[#000] dark:text-gray-300">{task}</span>
            </div>
            <span className={`text-sm font-medium ${isLoading ? "text-blue-600" : isApproved ? "text-green-600" : "text-primary"}`}>
              {isLoading ? "Processing..." : isApproved ? "Approved" : "Completed"}
            </span>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div className={`flex items-center justify-between rounded-xl px-5 py-4 ${
        isLoading 
          ? "bg-blue-50 dark:bg-blue-900/20"
          : isApproved
          ? "bg-green-50 dark:bg-green-900/20"
          : "bg-purple-50 dark:bg-purple-900/20"
      }`}>
        <div>
          <p className="text-sm font-bold text-[#000] dark:text-white">
            {isLoading ? "Processing Extraction..." : isApproved ? "Syllabus Extraction Approved" : "Extraction Complete"}
          </p>
          <p className="mt-0.5 text-sm text-primary">
            {isLoading 
              ? "AI is processing your syllabus. This may take a few moments..."
              : isApproved
              ? "Extraction has been approved and ratified. Downstream stages (CO-PO Mapping, Topics Hierarchy) are unlocked."
              : "AI extraction completed. Faculty review and ratification is required before final approval."
            }
          </p>
        </div>
        <button
          onClick={onReview}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed opacity-50"
              : isApproved
              ? "bg-green-600 hover:bg-green-700"
              : "bg-primary-custom hover:opacity-90"
          }`}
        >
          {isLoading ? "Processing..." : isApproved ? "View Extracted Data →" : "Review Extracted Data →"}
        </button>
      </div>
    </div>
  );
};

export default ExtractionComplete;
