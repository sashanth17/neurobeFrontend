import React, { useState } from "react";
import { Users, CheckSquare, Square, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { CourseInstanceOption } from "@/types/cia-test.types";

interface SectionAssignSectionProps {
  availableInstances: CourseInstanceOption[];
  selectedInstanceIds: number[];
  instancesLoading: boolean;
  errorMessage?: string;
  onToggle: (id: number) => void;
  onSelectAll: () => void;
}

const getSectionDisplayName = (inst: CourseInstanceOption): string => {
  const name =
    inst.course_instance_name?.trim() ||
    inst.section_name?.trim() ||
    inst.instance_name?.trim() ||
    inst.name?.trim();

  if (name) return name;
  if (inst.section) return `Section ${inst.section}`;
  return `Section ${inst.id}`;
};

const getStudentCount = (inst: CourseInstanceOption): number => {
  return (
    inst.enrolled_students_count ??
    inst.students_count ??
    inst.total_enrolled ??
    inst.student_count ??
    0
  );
};

export const SectionAssignSection: React.FC<SectionAssignSectionProps> = ({
  availableInstances,
  selectedInstanceIds,
  instancesLoading,
  errorMessage,
  onToggle,
  onSelectAll,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const allSelected =
    availableInstances.length > 0 &&
    selectedInstanceIds.length === availableInstances.length;

  const totalSelectedStudents = availableInstances
    .filter((inst) => selectedInstanceIds.includes(inst.id))
    .reduce((sum, inst) => sum + getStudentCount(inst), 0);

  const selectedInstances = availableInstances.filter((inst) =>
    selectedInstanceIds.includes(inst.id)
  );

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            2. Assign Course Sections (M:N Assignment)
          </h4>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            Select the sections that will take this exam. A single unified test will be scheduled.
          </p>
        </div>

        {availableInstances.length > 0 && (
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Expand All / Collapse Toggle */}
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span>Expand All ({availableInstances.length})</span>
                </>
              )}
            </button>

            {/* Select All Toggle */}
            <button
              type="button"
              onClick={onSelectAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-bold text-purple-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-purple-400 transition-colors"
            >
              {allSelected ? (
                <>
                  <Square className="h-3.5 w-3.5" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Select All</span>
                </>
              )}
            </button>
          </div>
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
        <>
          {/* Collapsed Compact Overview */}
          {!isExpanded && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-700 dark:bg-gray-850 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {selectedInstanceIds.length} of {availableInstances.length} Section{availableInstances.length !== 1 ? "s" : ""} Assigned ({totalSelectedStudents} Students)
                </span>
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="text-xs font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
                >
                  <span>Expand All</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {selectedInstances.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedInstances.map((inst) => (
                    <span
                      key={inst.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-purple-100/70 border border-purple-200 px-2 py-0.5 text-[11px] font-bold text-purple-800 dark:bg-purple-950/60 dark:border-purple-800 dark:text-purple-300"
                    >
                      <span>✓ {getSectionDisplayName(inst)}</span>
                      <span className="text-purple-500 font-normal">({getStudentCount(inst)} Students)</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expanded Compact Section List (Clean, space-efficient list instead of large bulky boxes) */}
          {isExpanded && (
            <div className="space-y-1.5 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-2 dark:border-gray-700 dark:bg-gray-900/40">
              {availableInstances.map((inst) => {
                const isSelected = selectedInstanceIds.includes(inst.id);
                const displayName = getSectionDisplayName(inst);
                const studentCount = getStudentCount(inst);
                const instructor = inst.instructor_name || inst.faculty_name || "Faculty Assigned";

                return (
                  <div
                    key={inst.id}
                    onClick={() => onToggle(inst.id)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 cursor-pointer transition-all ${
                      isSelected
                        ? "bg-purple-50 border border-purple-300 text-purple-900 dark:bg-purple-950/40 dark:border-purple-700 dark:text-purple-200 shadow-2xs"
                        : "bg-white border border-gray-200/80 text-gray-800 hover:border-purple-200 hover:bg-purple-50/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-colors ${
                          isSelected
                            ? "border-purple-600 bg-purple-600 text-white"
                            : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
                        }`}
                      >
                        {isSelected && <span className="text-[9px] font-bold">✓</span>}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 dark:text-white truncate block">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-gray-400 truncate block">
                          {instructor}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 rounded-lg bg-gray-100/80 px-2.5 py-1 text-[11px] font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                      <span>{studentCount} Students</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Selected Summary Bar */}
      {selectedInstanceIds.length > 0 && isExpanded && (
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
