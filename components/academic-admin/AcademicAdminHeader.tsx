import React from "react";
import {
  FilterAcademicYear,
  FilterExamScope,
} from "@/services/academicAdminAnalytics.service";

interface AcademicAdminHeaderProps {
  level: 1 | 2 | 3;
  onNavigateLevel: (level: 1 | 2 | 3, deptId?: number) => void;
  selectedDepartmentName?: string;
  selectedDepartmentId?: number;
  academicYears: FilterAcademicYear[];
  selectedYear: string;
  onYearChange: (year: string) => void;
  examScopes: FilterExamScope[];
  selectedScope: string;
  onScopeChange: (scope: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const AcademicAdminHeader: React.FC<AcademicAdminHeaderProps> = ({
  level,
  onNavigateLevel,
  selectedDepartmentName,
  selectedDepartmentId,
  academicYears,
  selectedYear,
  onYearChange,
  examScopes,
  selectedScope,
  onScopeChange,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="mb-6 flex flex-col gap-4 bg-white dark:bg-[#1a2234] p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
      {/* Top Row: Title, Breadcrumbs & Level indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {/* Breadcrumb Path */}
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-1">
            <button
              onClick={() => onNavigateLevel(1)}
              className={`hover:text-primary transition-colors flex items-center gap-1 ${
                level === 1 ? "text-primary font-semibold" : ""
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              College Overview
            </button>

            {level >= 2 && (
              <>
                <span>/</span>
                <button
                  onClick={() => onNavigateLevel(2)}
                  className={`hover:text-primary transition-colors ${
                    level === 2 ? "text-primary font-semibold" : ""
                  }`}
                >
                  Department Analytics
                </button>
              </>
            )}

            {level === 3 && (
              <>
                <span>/</span>
                <span className="text-primary font-semibold truncate max-w-[220px]">
                  {selectedDepartmentName || "Department"} Courses & MCQs
                </span>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {level > 1 && (
              <button
                type="button"
                onClick={() => onNavigateLevel((level - 1) as 1 | 2, selectedDepartmentId)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                title="Go back to previous level"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {level === 1 && "Academic Administrator Executive Dashboard"}
              {level === 2 && "Department-Wise Bloom's & Exam Comparison"}
              {level === 3 && `${selectedDepartmentName || "Department"} • Courses & MCQ Performance`}
            </h1>

            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
              Drill-down Level {level}
            </span>
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Academic Year Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Batch / Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[130px] rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium focus:ring-1 focus:ring-primary focus:border-primary"
            >
              {academicYears.map((ay) => (
                <option key={ay.year} value={ay.year}>
                  {ay.year} {ay.is_latest ? "(Latest)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Scope Filter (Available for Level 2 & Level 3) */}
          {level >= 2 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="font-semibold text-gray-700 dark:text-gray-300">Exam Scope:</span>
              <select
                value={selectedScope}
                onChange={(e) => onScopeChange(e.target.value)}
                className="form-select text-xs py-1.5 pl-3 pr-8 min-w-[140px] rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium focus:ring-1 focus:ring-primary focus:border-primary"
              >
                {examScopes.map((scope) => (
                  <option key={scope.id} value={scope.id}>
                    {scope.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Action */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors disabled:opacity-50"
              title="Refresh Analytics"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Info sub-bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800/80 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Evaluation Benchmark: <strong className="text-gray-800 dark:text-gray-200 font-semibold">≥ 50.0% Marks</strong> (CIA & External)
          </span>
          <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
          <span className="hidden sm:inline">
            Bloom Mastery Rule: <strong className="text-gray-800 dark:text-gray-200 font-semibold">Highest Attained Level</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {level === 1 && (
            <span className="text-primary font-medium flex items-center gap-1">
              <span>💡 Tip: Click any Bloom column or pass percentage card to drill down into Department metrics</span>
            </span>
          )}
          {level === 2 && (
            <span className="text-primary font-medium flex items-center gap-1">
              <span>💡 Tip: Click any department line or bar to drill down into its Courses & MCQs</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademicAdminHeader;
