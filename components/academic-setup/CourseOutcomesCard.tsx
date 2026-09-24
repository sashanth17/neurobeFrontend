import React from "react";
import CourseOutcomeItem, {
  CourseOutcomeItemProps,
} from "./CourseOutcomeItem";

export interface CourseOutcomesCardProps {
  title?: string;
  approvedCountText?: string;
  outcomes?: CourseOutcomeItemProps[];
  coverageUnitsText?: string;
  coverageTheoryHoursText?: string;
  coverageLabHoursText?: string;
  coverageTopicsText?: string;
  isCopoView?: boolean;
  className?: string;
}

const CourseOutcomesCard: React.FC<CourseOutcomesCardProps> = ({
  title = "COURSE OUTCOMES",
  approvedCountText,
  outcomes = [],
  coverageUnitsText = "5 Units",
  coverageTheoryHoursText = "45 Theory Hours",
  coverageLabHoursText = "30 Lab Hours",
  coverageTopicsText = "35 Syllabus Topics",
  isCopoView = false,
  className = "",
}) => {
  const displayCount = approvedCountText || `${outcomes.length} Approved Statement${outcomes.length === 1 ? "" : "s"}`;
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
        <span className="text-xs font-bold text-color2 dark:text-purple-400">
          {displayCount}
        </span>
      </div>

      {/* Outcome Cards List using CourseOutcomeItem inner sub-component */}
      <div className="space-y-3">
        {outcomes.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
            No approved course outcomes available for this course.
          </div>
        ) : (
          outcomes.map((co) => (
            <CourseOutcomeItem
              key={co.id || co.coCode}
              coCode={co.coCode}
              statement={co.statement}
              knowledgeLevel={co.knowledgeLevel}
            />
          ))
        )}
      </div>

      {/* Bottom Footer Bar */}
      {isCopoView ? (
        <div className="mt-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 rounded-2xl border border-purple-100 bg-[#f9f8ff] px-4 py-3.5 dark:border-purple-900/40 dark:bg-purple-950/30">
          <div className="flex items-center gap-x-2 text-xs font-bold text-[#000] dark:text-white shrink-0 whitespace-nowrap">
            <span>5 Course Outcomes</span>
            <span className="text-gray-300">•</span>
            <span>11 Program Outcomes</span>
            <span className="text-gray-300">•</span>
            <span className="text-color2 dark:text-purple-300 font-bold">
              Approved v1.0
            </span>
          </div>
          <div className="flex items-center gap-x-1.5 text-xs text-pri dark:text-gray-400 shrink-0 whitespace-nowrap overflow-x-auto">
            <span>Mapping Scale:</span>
            <span className="font-semibold text-[#000] dark:text-gray-300">3 = High</span>
            <span className="text-gray-300">·</span>
            <span className="font-semibold text-[#000] dark:text-gray-300">2 = Medium</span>
            <span className="text-gray-300">·</span>
            <span className="font-semibold text-[#000] dark:text-gray-300">1 = Low</span>
            <span className="text-gray-300">·</span>
            <span className="font-semibold text-[#000] dark:text-gray-300">– = No Mapping</span>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <span className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri">
            SYLLABUS COVERAGE
          </span>
          <div className="text-xs font-bold font-mono text-[#000] dark:text-gray-300 flex flex-wrap items-center gap-x-4">
            <span>{coverageUnitsText}</span>
            <span>·</span>
            <span>{coverageTheoryHoursText}</span>
            <span>·</span>
            <span>{coverageLabHoursText}</span>
            <span>·</span>
            <span>{coverageTopicsText}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseOutcomesCard;
