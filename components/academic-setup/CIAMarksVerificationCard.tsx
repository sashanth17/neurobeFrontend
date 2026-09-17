import React from "react";
import { ArrowRight, UserCheck } from "lucide-react";

export type CIAVerificationStatus = "in_progress" | "not_started" | "completed";

export interface CIAMarksVerificationCardProps {
  title: string;
  marks?: number | string;
  studentsCount?: number | string;
  status?: CIAVerificationStatus;
  statusLabel?: string;
  verifiedCount?: number;
  totalCount?: number;
  reviewedByNote?: string;
  emptyNote?: string;
  active?: boolean;
  primaryBtnLabel?: string;
  onPrimaryClick?: () => void;
  secondaryBtnLabel?: string;
  onSecondaryClick?: () => void;
  className?: string;
}

export const CIAMarksVerificationCard: React.FC<CIAMarksVerificationCardProps> = ({
  title,
  marks = "50 Marks",
  studentsCount = "40 Students",
  status = "in_progress",
  statusLabel,
  verifiedCount = 19,
  totalCount = 40,
  reviewedByNote,
  emptyNote = "No evaluated answer sheets uploaded yet.",
  active = false,
  primaryBtnLabel,
  onPrimaryClick,
  secondaryBtnLabel,
  onSecondaryClick,
  className = "",
}) => {
  const isInProgress = status === "in_progress";
  const isNotStarted = status === "not_started";
  const isCompleted = status === "completed";

  // Default badges
  const computedStatusLabel =
    statusLabel ||
    (isInProgress
      ? "Verification In Progress"
      : isNotStarted
        ? "Not Started"
        : "Completed");

  // Default primary button labels
  const computedPrimaryBtnLabel =
    primaryBtnLabel ||
    (isInProgress
      ? "Continue Verification"
      : isNotStarted
        ? "Start Verification"
        : "View Verification");

  const isHighlighted = active || isNotStarted;

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl p-5 shadow-xs transition-all duration-200 ${isHighlighted
        ? "border-2 border-purple-400 bg-[#FAF7FF] dark:border-purple-500/80 dark:bg-purple-950/20"
        : "border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
        } ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-color1 dark:text-white sm:text-xl">
            {title}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-pri dark:text-gray-400 sm:text-sm">
            {typeof marks === "number" ? `${marks} Marks` : marks} •{" "}
            {typeof studentsCount === "number"
              ? `${studentsCount} Students`
              : studentsCount}
          </p>
        </div>

        {/* Status Badge */}
        {isInProgress ? (
          <span className="rounded-lg bg-purple-100 px-3 py-1 text-sm font-bold text-color2 dark:bg-purple-900/60 dark:text-purple-300">
            {computedStatusLabel}
          </span>
        ) : isCompleted ? (
          <span className="rounded-lg bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            {computedStatusLabel}
          </span>
        ) : (
          <span className="rounded-lg bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {computedStatusLabel}
          </span>
        )}
      </div>

      {/* Main Content Area */}
      <div className="my-2 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800 dark:bg-gray-800/40">
        {isInProgress ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-pri dark:text-gray-300">
                Verified:
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 sm:text-sm">
                {verifiedCount} of {totalCount} Verified
              </span>
            </div>
            {reviewedByNote && (
              <div className="flex items-center gap-1.5 pt-1 text-xs text-gray-600 dark:text-gray-300">
                <UserCheck className="h-4 w-4 shrink-0 text-color2" />
                <span className="text-sm">{reviewedByNote}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-pri dark:text-gray-400">
            {emptyNote}
          </p>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="mt-auto flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onPrimaryClick}
          className=" create-btn"
        >
          <span>{computedPrimaryBtnLabel}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {secondaryBtnLabel && (
          <button
            type="button"
            onClick={onSecondaryClick}
            className="text-xs font-bold text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white sm:text-sm"
          >
            {secondaryBtnLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default CIAMarksVerificationCard;
