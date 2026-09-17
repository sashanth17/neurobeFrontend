import React from "react";

export interface CourseOutcomeItemProps {
  id?: string;
  coCode: string;
  statement: string;
  knowledgeLevel: string;
  className?: string;
}

const CourseOutcomeItem: React.FC<CourseOutcomeItemProps> = ({
  coCode,
  statement,
  knowledgeLevel,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 transition dark:border-gray-800 dark:bg-gray-800/40 hover:border-gray-200 dark:hover:border-gray-700 ${className}`}
    >
      <div className="flex items-center gap-3.5 flex-1">
        <span className="rounded-lg bg-[#f5f3ff] px-2.5 py-1 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300 shrink-0">
          {coCode}
        </span>
        <p className="text-sm font-semibold text-[#000] dark:text-gray-200 leading-relaxed">
          {statement}
        </p>
      </div>

      <span className="rounded-xl border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-[#000] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 shrink-0 self-start sm:self-auto">
        Knowledge Level: {knowledgeLevel}
      </span>
    </div>
  );
};

export default CourseOutcomeItem;
