import React, { useState } from "react";
import { AlertCircle, ChevronRight, X, UserX, AlertTriangle } from "lucide-react";
import { ExcludedStudentInfo } from "@/services/courseAnalyticsService";

interface ExcludedStudentsModalProps {
  excludedSummary?: {
    total_excluded: number;
    students: ExcludedStudentInfo[];
  };
}

const ExcludedStudentsModal: React.FC<ExcludedStudentsModalProps> = ({ excludedSummary }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!excludedSummary || excludedSummary.total_excluded === 0) {
    return null;
  }

  const { total_excluded, students } = excludedSummary;

  return (
    <>
      {/* Exclusion Notification Banner */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-2.5 text-xs text-amber-900 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            <strong className="font-semibold">{total_excluded} student{total_excluded > 1 ? "s" : ""}</strong> excluded
            from the distribution because they haven't attended all selected tests.
          </span>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 font-semibold text-amber-800 shadow-2xs hover:bg-amber-100/50 transition-all dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
        >
          <span>View Excluded Details</span>
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                  <UserX className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Excluded Students ({total_excluded})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Students omitted from analytics due to incomplete test attendance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="mt-4 max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {students.map((st, i) => (
                <div key={i} className="py-2.5 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 mr-2">
                      {st.student_id}
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {st.student_name}
                    </span>
                    <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">
                      {st.instance_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">Missed:</span>
                    {st.missed_tests.map((m, mi) => (
                      <span
                        key={mi}
                        className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExcludedStudentsModal;
