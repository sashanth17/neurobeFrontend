import React from "react";
import { Check } from "lucide-react";

export interface CIAPaperMarksAllocationBarProps {
  totalPaperMarks?: number | string;
  allocatedSectionMarks?: number | string;
  remainingToAllocate?: number | string;
  badgeText?: string;
  isBalanced?: boolean;
  badgeColor?: string;
}

export const CIAPaperMarksAllocationBar: React.FC<
  CIAPaperMarksAllocationBarProps
> = ({
  totalPaperMarks = 100,
  allocatedSectionMarks = 100,
  remainingToAllocate = 0,
  badgeText = "Section Marks Balanced (100%)",
  isBalanced = true,
  badgeColor,
}) => {
  return (
    <div className="bg-color1 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#2D2A54]/60 px-6 py-4 text-white shadow-md">
      {/* Left side: Stats inline list with separators */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium sm:text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-300">Total Paper Marks:</span>
          <span className="font-bold text-white">{totalPaperMarks}</span>
        </div>

        <span className="select-none font-light text-pri">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-300">Allocated Section Marks:</span>
          <span className="font-bold text-white">{allocatedSectionMarks}</span>
        </div>

        <span className="select-none font-light text-pri">|</span>

        <div className="flex items-center gap-1.5">
          <span className="text-gray-300">Remaining to Allocate:</span>
          <span className="font-bold text-white">{remainingToAllocate}</span>
        </div>
      </div>

      {/* Right side: Green checkmark badge */}
      {isBalanced && (
        <div
          className={`inline-flex items-center gap-2 rounded-lg  px-4 py-1.5 text-xs font-bold sm:text-sm ${
            badgeColor ? "" : "border border-green text-green-l"
          }`}
          style={
            badgeColor
              ? {
                  background: badgeColor,
                  color: "#fff",
                }
              : undefined
          }
        >
          <Check
            className="h-4 w-4 stroke-[2.5]"
            style={badgeColor ? { color: badgeColor } : undefined}
          />

          <span className="font-bold">{badgeText}</span>
        </div>
      )}
    </div>
  );
};

export default CIAPaperMarksAllocationBar;
