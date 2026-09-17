import React from "react";
import { ArrowRight } from "lucide-react";

export interface UnitTopicItem {
  code: string;
  title: string;
}

export interface UnitSyllabusCardItemProps {
  id?: string;
  unitNumber: number | string;
  unitTitle: string;
  hoursText: string;
  topicsCountText: string;
  topics: UnitTopicItem[];
  hierarchyLinkText?: string;
  onHierarchyClick?: () => void;
  className?: string;
}

const UnitSyllabusCardItem: React.FC<UnitSyllabusCardItemProps> = ({
  unitNumber,
  unitTitle,
  hoursText,
  topicsCountText,
  topics,
  hierarchyLinkText = "Detailed topic hierarchy available",
  onHierarchyClick,
  className = "",
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-800/80 ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4 dark:border-gray-700/60">
        <div>
          <span className="text-md font-bold uppercase tracking-wider text-color2 dark:text-purple-400">
            UNIT {unitNumber}
          </span>
          <h3 className="text-lg font-bold text-[#000] dark:text-white leading-tight">
            {unitTitle}
          </h3>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="rounded-xl border border-gray-200 bg-white px-3 py-1 text-sm font-bold text-[#000] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {hoursText}
          </span>
          <span className="rounded-xl border border-purple-100 bg-[#f5f3ff] px-3 py-1 text-sm font-bold text-color2 dark:border-purple-900 dark:bg-purple-950/60 dark:text-purple-300">
            {topicsCountText}
          </span>
        </div>
      </div>

      {/* Topics Header Row */}
      <div className="mt-4 mb-3 flex items-center justify-between">
        <span className="text-md font-bold uppercase tracking-wider text-pri dark:text-pri">
          SYLLABUS TOPICS
        </span>
        <button
          type="button"
          onClick={onHierarchyClick}
          className="flex items-center gap-1 text-sm font-semibold text-color2 hover:underline dark:text-purple-400 transition"
        >
          <span>{hierarchyLinkText}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Topics 2-Column Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6">
        {topics.map((t, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm">
            <span className="font-bold text-color2 dark:text-purple-400 shrink-0">
              {t.code}
            </span>
            <span className="font-semibold text-[#000] dark:text-gray-200 leading-snug">
              {t.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnitSyllabusCardItem;
