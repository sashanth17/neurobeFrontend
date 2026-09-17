import React, { useState } from "react";
import { Check, CheckCircle2, FileCheck, ArrowLeft } from "lucide-react";

export interface FinalApprovalCardProps {
  courseName?: string;
  assessmentName?: string;
  totalStudents?: number;
  verifiedStudents?: number;
  unresolvedIssues?: number;
  isApproved?: boolean;
  onApprove?: () => void;
  onBackToVerification?: () => void;
  onViewResults?: () => void;
  onBackToCourses?: () => void;
  className?: string;
}

export const FinalApprovalCard: React.FC<FinalApprovalCardProps> = ({
  courseName = "CS309 — Computer Networks",
  assessmentName = "CIA-1",
  totalStudents = 40,
  verifiedStudents = 40,
  unresolvedIssues = 0,
  isApproved: controlledIsApproved,
  onApprove,
  onBackToVerification,
  onViewResults,
  onBackToCourses,
  className = "",
}) => {
  const [internalApproved, setInternalApproved] = useState(false);
  const approved =
    controlledIsApproved !== undefined ? controlledIsApproved : internalApproved;

  const handleApprove = () => {
    setInternalApproved(true);
    if (onApprove) {
      onApprove();
    }
  };

  return (
    <div
      className={`mx-auto max-w-xl rounded-3xl border border-gray-100 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 sm:p-8 ${className}`}
    >
      {!approved ? (
        /* ── Image 1: Initial Final Approval View ── */
        <div className="text-center">
          {/* Top Icon Badge */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <FileCheck className="h-8 w-8" />
          </div>

          {/* Header */}
          <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Final Approval
          </h3>
          <p className="mt-1 text-xs text-pri dark:text-gray-400 sm:text-sm">
            Review assessment verification summary before final approval.
          </p>

          {/* Details Card */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white text-left dark:border-gray-700 dark:bg-gray-800">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              <div className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <span className="text-lg text-pri dark:text-gray-400">
                  Course
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {courseName}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <span className="text-lg text-pri dark:text-gray-400">
                  Assessment
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {assessmentName}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <span className="text-lg text-pri dark:text-gray-400">
                  Students
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {totalStudents}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <span className="text-lg text-pri dark:text-gray-400">
                  Verified
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {verifiedStudents}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <span className="text-lg text-pri dark:text-gray-400">
                  Unresolved Issues
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {unresolvedIssues}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handleApprove}
            className="create-btn mt-6 w-full items-center justify-center py-3 text-sm font-bold shadow-xs"
          >
            Approve Final Marks
          </button>

          {/* Sub-caption */}
          <p className="mt-2.5 text-md text-pri dark:text-gray-500">
            Do not auto-approve. Requires explicit instructor confirmation.
          </p>

          {/* Back to Student Verification Link */}
          <div className="mt-5">
            <button
              type="button"
              onClick={onBackToVerification}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-3.5 w-3.5 font-semibold text-sm" />
              <span className="text-pri text-sm font-semibold">Back to Student Verification</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── Image 2: Marks Approved & Locked View ── */
        <div className="text-center">
          {/* Top Icon Badge */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="h-9 w-9" />
          </div>

          {/* Header */}
          <h3 className="mt-4 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            Marks Approved &amp; Locked
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Review assessment verification summary before final approval.
          </p>

          {/* Details Card */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white text-left dark:border-gray-700 dark:bg-gray-800">
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              <div className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <span className="text-lg text-pri dark:text-gray-400">
                  Course
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {courseName}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <span className="text-lg text-pri dark:text-gray-400">
                  Assessment
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {assessmentName}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <span className="text-lg text-pri dark:text-gray-400">
                  Students
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {totalStudents}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <span className="text-lg text-pri dark:text-gray-400">
                  Verified
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {verifiedStudents}
                </span>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5 text-xs sm:text-sm">
                <span className="text-lg text-pri dark:text-gray-400">
                  Unresolved Issues
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {unresolvedIssues}
                </span>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300 sm:text-sm">
            Marks locked. Assessment is ready for CO Attainment calculation.
          </div>

          {/* Action Buttons */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onViewResults}
              className="create-btn items-center justify-center  text-sm font-bold"
            >
              View Results &amp; Analysis
            </button>
            <button
              type="button"
              onClick={onBackToCourses}
              className="rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
            >
              Back to Courses
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalApprovalCard;
