import React from "react";
import { FileText, Plus, Archive, HelpCircle } from "lucide-react";
import { CIATestItem } from "@/types/cia-test.types";
import CiaTestCard from "./CiaTestCard";

interface CiaTestListProps {
  tests: CIATestItem[];
  loading: boolean;
  isArchivedView: boolean;
  actionLoadingId: number | null;
  onArchive: (id: number) => void;
  onUnarchive: (id: number) => void;
  onDelete: (id: number) => void;
  onCreateClick: () => void;
}

export const CiaTestList: React.FC<CiaTestListProps> = ({
  tests,
  loading,
  isArchivedView,
  actionLoadingId,
  onArchive,
  onUnarchive,
  onDelete,
  onCreateClick,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex justify-between mb-4">
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-6 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-6 w-8 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            <div className="h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
            <div className="h-10 w-full rounded bg-gray-100 dark:bg-gray-700/60 mb-4" />
            <div className="h-6 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  if (tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
          {isArchivedView ? (
            <Archive className="h-8 w-8" />
          ) : (
            <FileText className="h-8 w-8" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {isArchivedView ? "No Archived CIA Assessments" : "No Active CIA Assessments"}
        </h3>
        <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 mb-6">
          {isArchivedView
            ? "Completed or retired CIA exams moved to the archive will appear here for historical mark records."
            : "No continuous internal assessment exams have been created for this course yet. Create one and assign it across multiple sections simultaneously."}
        </p>

        {!isArchivedView && (
          <button
            onClick={onCreateClick}
            className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create First CIA Test</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tests.map((test) => (
        <CiaTestCard
          key={test.id}
          test={test}
          isArchivedView={isArchivedView}
          actionLoading={actionLoadingId === test.id}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CiaTestList;
