import React from "react";
import { X, Sparkles, Plus, Loader2 } from "lucide-react";
import useCiaTestForm from "@/hook/useCiaTestForm";
import BasicDetailsSection from "./BasicDetailsSection";
import SectionAssignSection from "./SectionAssignSection";
import ScheduleSection from "./ScheduleSection";
import PaperLinkSection from "./PaperLinkSection";

interface CreateCiaTestModalProps {
  isOpen: boolean;
  courseId: number | string;
  courseCode: string;
  courseTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCiaTestModal: React.FC<CreateCiaTestModalProps> = ({
  isOpen,
  courseId,
  courseCode,
  courseTitle,
  onClose,
  onSuccess,
}) => {
  const {
    formData,
    formErrors,
    submitting,
    instancesLoading,
    availableInstances,
    templates,
    questionPapers,
    updateField,
    toggleInstanceSelection,
    selectAllInstances,
    handleSubmit,
  } = useCiaTestForm({
    courseId,
    courseCode,
    onSuccess,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-850 z-10 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700 bg-gradient-to-r from-purple-50/50 to-white dark:from-purple-950/20 dark:to-gray-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-purple-600 px-2 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                {courseCode || "CS301"}
              </span>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Create CIA Assessment
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {courseTitle} • Multi-Section Course Level Test
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-750 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Basic Details */}
          <BasicDetailsSection
            courseCode={courseCode}
            formData={formData}
            formErrors={formErrors}
            onChange={updateField}
          />

          {/* Section 2: Multi-Section Assignment */}
          <SectionAssignSection
            availableInstances={availableInstances}
            selectedInstanceIds={formData.course_instance_ids}
            instancesLoading={instancesLoading}
            errorMessage={formErrors.course_instance_ids}
            onToggle={toggleInstanceSelection}
            onSelectAll={selectAllInstances}
          />

          {/* Section 3: Schedule & Duration */}
          <ScheduleSection
            formData={formData}
            formErrors={formErrors}
            onChange={updateField}
          />

          {/* Section 4: Blueprint & Question Paper */}
          <PaperLinkSection
            formData={formData}
            templates={templates}
            questionPapers={questionPapers}
            onChange={updateField}
          />
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            * All selected sections will be linked to this exam.
          </p>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 active:scale-95 disabled:opacity-60 transition-all"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Test...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Create Assessment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCiaTestModal;
