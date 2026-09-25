import React from "react";
import { useRouter } from "next/router";
import {
  FileCheck,
  Trash2,
  Edit3,
  Award,
  Layers,
  AlertCircle,
  CheckCircle2,
  Lock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { QuestionPaperTemplate } from "@/types/cia-test.types";

interface TemplateCardProps {
  template: QuestionPaperTemplate;
  courseId?: string | number;
  actionLoading: boolean;
  onEdit: (template: QuestionPaperTemplate) => void;
  onDelete: (id: number) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  courseId,
  actionLoading,
  onEdit,
  onDelete,
}) => {
  const router = useRouter();

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
      case "underreview":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700";
      case "build":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
      case "drafted":
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
    }
  };

  const sections = template.sections || [];
  const totalQuestions = sections.reduce(
    (sum, sec) => sum + (sec.questions?.length || 0),
    0
  );

  // Business Protection Rules: Locked once assigned to 1+ CIA tests
  const isEditable =
    template.is_editable !== false &&
    (!template.assigned_tests_count || template.assigned_tests_count === 0);

  const isDeletable =
    template.is_deletable !== false &&
    (!template.assigned_tests_count || template.assigned_tests_count === 0);

  const handleOpenAssembly = () => {
    const cId = courseId || template.course_id || router.query.courseId;
    if (cId) {
      router.push(`/neurobe/question-bank/${cId}/templates/${template.id}/assembly`);
    }
  };

  return (
    <div className="relative flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-purple-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div>
        {/* Header row: Status and Total Marks */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${getStatusBadge(
              template.status
            )}`}
          >
            {template.status || "drafted"}
          </span>

          <span className="flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1 text-xs font-extrabold text-purple-700 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800">
            <Award className="h-3.5 w-3.5" />
            {template.total_maximum_marks} Marks
          </span>
        </div>

        {/* Template Name */}
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
          {template.template_name}
        </h3>

        {/* Description */}
        {template.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Section Structure Chips */}
        <div className="mb-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
            <Layers className="h-3.5 w-3.5 text-purple-600" />
            <span>
              Blueprint: {sections.length} Section{sections.length !== 1 ? "s" : ""} • {totalQuestions} Questions
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {sections.map((sec, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                <strong>{sec.section_name}:</strong> {sec.allocated_marks}M ({sec.questions?.length || 0} Qs)
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        {/* Assembly Studio CTA Button */}
        <button
          onClick={handleOpenAssembly}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 px-3 text-xs font-bold text-white shadow-sm shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all mb-3 group"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Question Assembly Studio</span>
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Footer: Status Guard, Edit & Delete CTAs */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
          <div>
            {!isEditable ? (
              <span
                title={`Assigned to ${template.assigned_tests_count || 1} CIA test(s). Editing and deletion are locked.`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400"
              >
                <Lock className="h-3 w-3" />
                Locked ({template.assigned_tests_count || 1} Tests)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Editable (Unassigned)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Edit Button with Protection Tooltip */}
            <button
              onClick={() => onEdit(template)}
              disabled={actionLoading || !isEditable}
              title={
                !isEditable
                  ? `Locked: Assigned to ${template.assigned_tests_count || 1} CIA test(s). Unassign to edit.`
                  : "Edit question paper blueprint template"
              }
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-bold transition-colors ${
                isEditable
                  ? "bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>

            {/* Delete Button with Protection */}
            <button
              onClick={() => {
                if (!isDeletable) {
                  alert(
                    `Cannot delete template: It is currently assigned to ${
                      template.assigned_tests_count || 1
                    } active CIA test(s). Unassign the template from those tests first.`
                  );
                  return;
                }
                if (window.confirm(`Delete question paper template "${template.template_name}"?`)) {
                  onDelete(template.id);
                }
              }}
              disabled={actionLoading || !isDeletable}
              title={
                !isDeletable
                  ? `Assigned to ${template.assigned_tests_count || 1} CIA test(s)`
                  : "Delete Template"
              }
              className={`flex items-center gap-1 rounded-lg px-2 py-1.5 font-bold transition-colors ${
                isDeletable
                  ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                  : "text-gray-300 cursor-not-allowed dark:text-gray-600"
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateCard;
