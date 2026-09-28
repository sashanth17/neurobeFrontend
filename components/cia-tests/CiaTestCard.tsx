import React, { useState } from "react";
import { useRouter } from "next/router";
import {
  Calendar,
  Clock,
  Award,
  Users,
  FileCheck,
  Archive,
  RotateCcw,
  Trash2,
  MoreVertical,
  CheckCircle,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { CIATestItem } from "@/types/cia-test.types";

interface CiaTestCardProps {
  test: CIATestItem;
  isArchivedView: boolean;
  actionLoading: boolean;
  onArchive: (id: number) => void;
  onUnarchive: (id: number) => void;
  onDelete: (id: number) => void;
}

export const CiaTestCard: React.FC<CiaTestCardProps> = ({
  test,
  isArchivedView,
  actionLoading,
  onArchive,
  onUnarchive,
  onDelete,
}) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Status color badge
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
      case "scheduled":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
      case "published":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700";
      case "completed":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
      case "archived":
        return "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
      default:
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300";
    }
  };

  const assignedInstances = test.assigned_instances || [];
  const assignedCount = test.assigned_instances_count ?? assignedInstances.length;
  const totalEnrolled =
    test.total_students_enrolled ??
    assignedInstances.reduce((sum, inst) => sum + (inst.enrolled_students_count || 0), 0);

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-purple-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Test Type Badge */}
          <span className="rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-purple-500/20">
            {test.test_type || "CIA"}
          </span>

          {/* Test Code */}
          <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
            {test.test_code}
          </span>

          {/* Status Badge */}
          <span
            className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold capitalize ${getStatusBadge(
              test.status
            )}`}
          >
            {test.status || "Draft"}
          </span>
        </div>

        {/* Action Button & Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            disabled={actionLoading}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-gray-200 bg-white py-1.5 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                {!isArchivedView ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onArchive(test.id);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <Archive className="h-3.5 w-3.5 text-amber-500" />
                    Move to Archive
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onUnarchive(test.id);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-purple-500" />
                    Restore Test
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (window.confirm("Are you sure you want to delete this CIA test?")) {
                      onDelete(test.id);
                    }
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Test
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Test Name */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {test.test_name}
      </h3>

      {/* Meta Grid: Date, Time, Duration, Max Marks, Branch & Sem */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-xl bg-gray-50/80 p-3 dark:bg-gray-750/50 border border-gray-100 dark:border-gray-700 mb-4">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <Calendar className="h-4 w-4 text-purple-500 flex-shrink-0" />
          <span>
            {test.test_date || "Date Unscheduled"}
            {test.start_time && ` • ${test.start_time}`}
          </span>
        </div>

        {/* Duration & Marks */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <Clock className="h-4 w-4 text-blue-500 flex-shrink-0" />
          <span>
            {test.duration_minutes || 90} Mins • <strong>{test.max_marks || 50} Marks</strong>
          </span>
        </div>

        {/* Academic Details */}
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <Award className="h-4 w-4 text-amber-500 flex-shrink-0" />
          <span>
            {test.branch || "CSE"} • Sem {test.semester || 1} • {test.academic_year || "2026-2027"}
          </span>
        </div>
      </div>

      {/* Assigned Course Instances / Sections (M:N Assignment) */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            Assigned Sections ({assignedCount}):
          </span>
          {totalEnrolled > 0 && (
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {totalEnrolled} Total Students
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {assignedInstances.length > 0 ? (
            assignedInstances.map((inst, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-800 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                {inst.instance_name || `Section ${inst.instance_id}`}
                {inst.enrolled_students_count ? (
                  <span className="text-[10px] text-purple-600 dark:text-purple-400">
                    ({inst.enrolled_students_count} std)
                  </span>
                ) : null}
              </span>
            ))
          ) : (
            <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> No sections assigned yet
            </span>
          )}
        </div>
      </div>

      {/* Question Paper & Template Link Status */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <FileCheck
              className={`h-4 w-4 ${
                test.question_paper_template_id || test.has_template
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            />
            <span>
              {test.question_paper_template_id || test.has_template
                ? "Blueprint Template Linked"
                : "No Template"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
            <FileText
              className={`h-4 w-4 ${
                test.question_paper_id || test.has_question_paper
                  ? "text-green-500"
                  : "text-gray-400"
              }`}
            />
            <span>
              {test.question_paper_id || test.has_question_paper
                ? "Question Paper Ready"
                : "QP Pending"}
            </span>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2">
          {test.question_paper_template_id && (
            <button
              onClick={() => {
                const cId = test.course_id || router.query.courseId;
                router.push(
                  `/neurobe/question-bank/${cId}/templates/${test.question_paper_template_id}/assembly`
                );
              }}
              className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 font-bold text-white shadow-sm shadow-purple-500/20 hover:bg-purple-700 transition-all text-xs"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Assemble Paper</span>
            </button>
          )}

          {!isArchivedView ? (
            <button
              onClick={() => onArchive(test.id)}
              disabled={actionLoading}
              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-600 hover:bg-gray-50 hover:text-amber-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive</span>
            </button>
          ) : (
            <button
              onClick={() => onUnarchive(test.id)}
              disabled={actionLoading}
              className="flex items-center gap-1 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/40 dark:text-purple-300 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CiaTestCard;
