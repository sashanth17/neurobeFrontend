import React from "react";

export type StudentVerificationStatus =
  | "needs_review"
  | "ready_to_verify"
  | "verified";

export interface StudentVerificationCardProps {
  id?: string;
  name: string;
  registerNo: string;
  marks: string;
  status: StudentVerificationStatus;
  statusLabel?: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StudentVerificationCard: React.FC<
  StudentVerificationCardProps
> = ({
  name,
  registerNo,
  marks,
  status,
  statusLabel,
  selected = false,
  onClick,
  className = "",
}) => {
  // Render badge variant depending on status
  const renderBadge = () => {
    switch (status) {
      case "needs_review":
        return (
          <span className="rounded-lg bg-amber-100/90 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
            {statusLabel || "Needs Review"}
          </span>
        );
      case "ready_to_verify":
        return (
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:bg-blue-950/70 dark:text-blue-300">
            {statusLabel || "Ready to Verify"}
          </span>
        );
      case "verified":
        return (
          <span className="rounded-lg bg-emerald-100/90 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
            {statusLabel || "Verified"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative flex min-w-[210px] shrink-0 cursor-pointer flex-col justify-between rounded-2xl p-4 transition-all duration-200 ${
        selected
          ? "border-2 border-purple-500 bg-white shadow-sm dark:border-purple-500/80 dark:bg-gray-800"
          : "border border-gray-200 bg-white hover:border-gray-300 dark:border-gray-750 dark:bg-gray-850"
      } ${className}`}
    >
      {/* Top Header: Name & Roll Number */}
      <div className="mb-4">
        <h4 className="truncate text-sm font-bold text-gray-900 dark:text-white">
          {name}
        </h4>
        <p className="mt-0.5 text-xs font-semibold text-gray-400 dark:text-gray-400">
          {registerNo}
        </p>
      </div>

      {/* Bottom Footer: Marks & Status Badge */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-sm font-bold text-gray-900 dark:text-white">
          {marks}
        </span>
        {renderBadge()}
      </div>
    </div>
  );
};

export default StudentVerificationCard;
