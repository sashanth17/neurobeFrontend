import React from "react";
import { Users, CheckSquare, Square, AlertCircle } from "lucide-react";
import { CourseInstanceOption } from "@/types/cia-test.types";

interface SectionAssignSectionProps {
  availableInstances: CourseInstanceOption[];
  selectedInstanceIds: number[];
  instancesLoading: boolean;
  errorMessage?: string;
  onToggle: (id: number) => void;
  onSelectAll: () => void;
}

export const SectionAssignSection: React.FC<SectionAssignSectionProps> = ({
  availableInstances,
  selectedInstanceIds,
  instancesLoading,
  errorMessage,
  onToggle,
  onSelectAll,
}) => {
  const allSelected =
    availableInstances.length > 0 &&
    selectedInstanceIds.length === availableInstances.length;

  const totalSelectedStudents = availableInstances
    .filter((inst) => selectedInstanceIds.includes(inst.id))
    .reduce((sum, inst) => sum + (inst.enrolled_students_count || inst.students_count || 0), 0);

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            2. Assign Course Sections (M:N Assignment)
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Select the sections that will take this exam. A single unified test will be scheduled.
          </p>
        </div>

        {availableInstances.length > 0 && (
          <button
            type="button"
            onClick={onSelectAll}
            className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400"
          >
            {allSelected ? (
              <>
                <Square className="h-3.5 w-3.5" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <CheckSquare className="h-3.5 w-3.5" />
                <span>Select All ({availableInstances.length})</span>
              </>
            )}
          </button>
        )}
      </div>

      {instancesLoading ? (
        <div className="py-4 text-center text-xs text-gray-400">
          Loading course sections...
        </div>
      ) : availableInstances.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>No active sections found for this course.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {availableInstances.map((inst) => {
            const isSelected = selectedInstanceIds.includes(inst.id);
            const studentCount = inst.enrolled_students_count || inst.students_count || 0;
            const instructorName = inst.instructor_name || inst.faculty_name || "Faculty Assigned";

            return (
              <div
                key={inst.id}
                onClick={() => onToggle(inst.id)}
                className={`flex items-center justify-between rounded-xl border p-3.5 cursor-pointer transition-all ${
                  isSelected
                    ? "border-purple-500 bg-purple-50/70 shadow-sm dark:border-purple-500 dark:bg-purple-900/30"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                      isSelected
                        ? "border-purple-600 bg-purple-600 text-white"
                        : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
                    }`}
                  >
                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                  </div>

                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {inst.instance_name || inst.name || `Section ${inst.section || inst.id}`}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {instructorName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[11px] font-bold text-gray-700 shadow-2xs border border-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                  <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  <span>{studentCount} Std</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Summary Pill */}
      {selectedInstanceIds.length > 0 && (
        <div className="rounded-xl bg-purple-100/60 p-2.5 text-xs font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 flex items-center justify-between">
          <span>
            Selected Sections: <strong>{selectedInstanceIds.length} of {availableInstances.length}</strong>
          </span>
          <span>
            Total Enrolled Candidates: <strong>{totalSelectedStudents} Students</strong>
          </span>
        </div>
      )}

      {errorMessage && (
        <p className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default SectionAssignSection;
