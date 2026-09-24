import React from "react";
import UnitSyllabusCardItem, {
  UnitSyllabusCardItemProps,
} from "./UnitSyllabusCardItem";

export interface UnitWiseSyllabusCardProps {
  title?: string;
  headerStatsText?: string;
  units?: UnitSyllabusCardItemProps[];
  onHierarchyClick?: (unitNumber: number | string) => void;
  className?: string;
}

const UnitWiseSyllabusCard: React.FC<UnitWiseSyllabusCardProps> = ({
  title = "UNIT-WISE SYLLABUS",
  headerStatsText,
  units = [],
  onHierarchyClick,
  className = "",
}) => {
  const displayStats = headerStatsText || `${units.length} Unit${units.length === 1 ? "" : "s"}`;
  return (
    <div
      className={`rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Header Row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
          <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
          <span className="text-md font-bold">{title}</span>


        </div>
        <span className="text-xs font-semibold text-pri dark:text-gray-400">
          {displayStats}
        </span>
      </div>

      {/* Units List using UnitSyllabusCardItem inner sub-component */}
      <div className="space-y-4">
        {units.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No approved units syllabus available for this course.
          </div>
        ) : (
          units.map((unit) => (
            <UnitSyllabusCardItem
              key={unit.id || unit.unitNumber}
              unitNumber={unit.unitNumber}
              unitTitle={unit.unitTitle}
              hoursText={unit.hoursText}
              topicsCountText={unit.topicsCountText}
              topics={unit.topics}
              onHierarchyClick={() =>
                onHierarchyClick && onHierarchyClick(unit.unitNumber)
              }
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UnitWiseSyllabusCard;
