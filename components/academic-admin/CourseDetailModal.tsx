import React from "react";
import { CourseMatrixItem } from "@/services/academicAdminAnalytics.service";

interface CourseDetailModalProps {
  course: CourseMatrixItem | null;
  onClose: () => void;
  departmentName: string;
}

const BLOOM_BADGES: Record<string, { label: string; bg: string }> = {
  K1: { label: "K1: Remember", bg: "bg-blue-500" },
  K2: { label: "K2: Understand", bg: "bg-cyan-500" },
  K3: { label: "K3: Apply", bg: "bg-emerald-500" },
  K4: { label: "K4: Analyze", bg: "bg-amber-500" },
  K5: { label: "K5: Evaluate", bg: "bg-orange-500" },
  K6: { label: "K6: Create", bg: "bg-purple-500" },
};

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  course,
  onClose,
  departmentName,
}) => {
  if (!course) return null;

  const totalBloom = Object.values(course.bloom_distribution).reduce((acc, v) => acc + v, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-[#1a2234] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
                {course.course_code}
              </span>
              <span className="text-xs text-gray-500">Semester {course.semester}</span>
              <span className="text-xs text-gray-400">• {departmentName}</span>
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
              {course.course_title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-center">
              <span className="text-[11px] font-medium text-gray-400">Enrolled Students</span>
              <div className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                {course.total_enrolled_students}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40 text-center">
              <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400">Internal Pass %</span>
              <div className="text-xl font-bold text-sky-700 dark:text-sky-300 mt-0.5">
                {course.internal_pass_pct}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-center">
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">External Pass %</span>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                {course.external_pass_pct}%
              </div>
            </div>
          </div>

          {/* Assigned Faculty */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Assigned Faculty & Roles
            </h3>
            <div className="space-y-2">
              {course.assigned_faculty.map((faculty, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                      {faculty.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">
                        {faculty.name}
                      </div>
                      <div className="text-[10px] text-gray-500">Verified Teaching Faculty</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                    {faculty.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Course-Specific Bloom Distribution */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Course-Level Cognitive Bloom's Taxonomy Attainment
            </h3>
            <div className="space-y-2">
              {(["K1", "K2", "K3", "K4", "K5", "K6"] as const).map((level) => {
                const count = course.bloom_distribution[level] || 0;
                const pct = totalBloom > 0 ? ((count / totalBloom) * 100).toFixed(1) : "0.0";
                const badge = BLOOM_BADGES[level];

                return (
                  <div key={level} className="flex items-center gap-3">
                    <span className="w-24 text-xs font-bold text-gray-700 dark:text-gray-300">
                      {badge.label}
                    </span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${badge.bg}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-24 text-right text-xs font-medium text-gray-500">
                      <strong className="text-gray-800 dark:text-gray-100">{count}</strong> ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailModal;
