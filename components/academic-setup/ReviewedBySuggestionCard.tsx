import React from "react";

export interface ReviewedBySuggestionCardProps {
  reviewerName?: string;
  suggestedChangesText?: string;
  actionBtnLabel?: string;
  onActionClick?: () => void;
  className?: string;
}

export const ReviewedBySuggestionCard: React.FC<
  ReviewedBySuggestionCardProps
> = ({
  reviewerName = "Kavya Raman",
  suggestedChangesText = "1 suggested change",
  actionBtnLabel = "Review Suggestion",
  onActionClick,
  className = "",
}) => {
    return (
      <div
        className={`panel flex items-center justify-between rounded-2xl border-1 border border-purple-400 bg-purple-50/30 p-3 transition-all duration-200 dark:border-purple-500/80 dark:bg-purple-950/20 ${className}`}
      >
        {/* Left Content */}
        <div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            Reviewed by {reviewerName}
          </h4>
          <p className="mt-0.5 text-sm font-medium text-pri dark:text-gray-400">
            {suggestedChangesText}
          </p>
        </div>

        {/* Right Action Button */}
        <div>
          <button
            type="button"
            onClick={onActionClick}
            className="inline-flex items-center rounded-xl border border-purple-300 bg-purple-100/80 px-4 py-1.5 text-xs font-bold text-color2 shadow-2xs transition-all hover:bg-purple-200 active:scale-[0.99] dark:border-purple-700 dark:bg-purple-900/60 dark:text-purple-300 dark:hover:bg-purple-900 sm:text-sm"
          >
            {actionBtnLabel}
          </button>
        </div>
      </div>
    );
  };

export default ReviewedBySuggestionCard;
