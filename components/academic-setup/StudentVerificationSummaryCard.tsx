import React from "react";

export interface StudentVerificationSummaryCardProps {
  name?: string;
  registerNo?: string;
  finalScore?: string;
  scoreLabel?: string;
  className?: string;
}

export const StudentVerificationSummaryCard: React.FC<
  StudentVerificationSummaryCardProps
> = ({
  name = "Sanjay Murugan",
  registerNo = "24CS1041",
  finalScore = "45 / 50",
  scoreLabel = "Final Total Mark",
  className = "",
}) => {
    return (
      <div
        className={`panel flex items-center justify-between p-4 sm:p-5 ${className}`}
      >
        {/* Left Student Info */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
            {name}
          </h3>
          <p className="mt-0.5 text-xs font-semibold text-pri dark:text-gray-400 sm:text-sm">
            {registerNo}
          </p>
        </div>

        {/* Right Score Info */}
        <div className="text-right">
          <span className="block text-lg font-bold text-color1 dark:text-white sm:text-xl">
            {finalScore}
          </span>
          <span className="mt-0.5 block text-xs font-medium text-pri dark:text-gray-400">
            {scoreLabel}
          </span>
        </div>
      </div>
    );
  };

export default StudentVerificationSummaryCard;
