import React from "react";
import { Plus, Award, Layers, Clock, Archive } from "lucide-react";
import { CIATestItem } from "@/types/cia-test.types";

interface CiaTestsHeaderProps {
  courseCode: string;
  courseTitle: string;
  activeCount: number;
  archivedCount: number;
  onCreateClick: () => void;
}

export const CiaTestsHeader: React.FC<CiaTestsHeaderProps> = ({
  courseCode,
  courseTitle,
  activeCount,
  archivedCount,
  onCreateClick,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and metadata */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {courseCode || "COURSE"}
            </span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Continuous Internal Assessment (CIA) Management
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {courseTitle || "Course Assessments"}
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Create and schedule unified assessments across multiple course sections, manage question papers, and archive past exams.
          </p>
        </div>

        {/* Create CIA CTA Button */}
        <div>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Create CIA Test</span>
          </button>
        </div>
      </div>

      {/* Quick Status Stats Row */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-gray-100 dark:border-gray-750">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Active Exams</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Evaluation Phase</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Active</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Multi-Section</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">Enabled</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            <Archive className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Archived Records</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{archivedCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CiaTestsHeader;
