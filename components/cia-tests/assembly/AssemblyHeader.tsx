import React from "react";
import { useRouter } from "next/router";
import {
  ArrowLeft,
  FileCheck,
  Eye,
  UploadCloud,
  Award,
  Layers,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { QuestionPaperTemplate } from "@/types/cia-test.types";

interface AssemblyHeaderProps {
  courseId: string | number;
  courseCode: string;
  courseTitle: string;
  template: QuestionPaperTemplate | null;
  assemblyStats: {
    totalSlots: number;
    assignedSlots: number;
    percentage: number;
  };
  onOpenPreview: () => void;
  onOpenUploadPdf: () => void;
}

export const AssemblyHeader: React.FC<AssemblyHeaderProps> = ({
  courseId,
  courseCode,
  courseTitle,
  template,
  assemblyStats,
  onOpenPreview,
  onOpenUploadPdf,
}) => {
  const router = useRouter();

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Top Navigation Row */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
        <button
          onClick={() => router.push(`/neurobe/question-bank/${courseId}`)}
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Course Blueprints & Assessments</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800">
            <Award className="h-3.5 w-3.5" />
            Target: {template?.total_maximum_marks || 0} Marks
          </span>

          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
              template?.status === "verified"
                ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300"
                : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
            }`}
          >
            {template?.status || "Draft"}
          </span>
        </div>
      </div>

      {/* Main Title & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1">
            <span>{courseCode}</span>
            <span>•</span>
            <span>{courseTitle}</span>
          </div>

          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Question Assembly Studio:</span>
            <span className="text-purple-600 dark:text-purple-400">
              {template?.template_name || "Blueprint"}
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Map candidate pool questions and AI-generated prompts into question paper blueprint slots.
          </p>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenPreview}
            className="inline-flex items-center gap-2 rounded-xl border border-purple-200 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-700 shadow-sm transition-all hover:bg-purple-100 hover:shadow dark:border-purple-800 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60"
          >
            <Eye className="h-4 w-4" />
            <span>Live Exam Paper Preview</span>
          </button>

          <button
            onClick={onOpenUploadPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 transition-all hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Store Final Paper PDF</span>
          </button>
        </div>
      </div>

      {/* Assembly Progress Bar */}
      <div className="mt-5 rounded-xl bg-gray-50 p-3.5 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
            <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            Blueprint Slot Allocation Progress
          </span>
          <span className="text-purple-600 dark:text-purple-400">
            {assemblyStats.assignedSlots} of {assemblyStats.totalSlots} Slots Assigned ({assemblyStats.percentage}%)
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${assemblyStats.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default AssemblyHeader;
