import React from "react";

export interface VerificationProgressApprovalCardProps {
  verifiedCount?: number;
  totalCount?: number;
  btnLabel?: string;
  onProceed?: () => void;
  className?: string;
}

export const VerificationProgressApprovalCard: React.FC<
  VerificationProgressApprovalCardProps
> = ({
  verifiedCount = 40,
  totalCount = 40,
  btnLabel = "Proceed to Final Approval",
  onProceed,
  className = "",
}) => {
    return (
      <div
        className={`panel flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-900 sm:px-6 sm:py-4 ${className}`}
      >
        {/* Left Content */}
        <div>
          <span className="block text-[10px] font-bold tracking-wider text-pri uppercase sm:text-xs dark:text-gray-400">
            VERIFICATION PROGRESS
          </span>
          <h4 className="mt-0.5 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
            {verifiedCount} of {totalCount} Students Verified
          </h4>
        </div>

        {/* Right Button */}
        <button
          type="button"
          onClick={onProceed}
          className="create-btn px-6 py-2.5 text-xs font-bold shadow-xs sm:text-sm"
        >
          {btnLabel}
        </button>
      </div>
    );
  };

export default VerificationProgressApprovalCard;
