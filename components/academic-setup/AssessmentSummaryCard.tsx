import React from "react";
import {
  Calendar,
  HelpCircle,
  Users,
  Award,
  Info,
  CheckCircle2,
} from "lucide-react";

export interface MCQSummaryData {
  code?: string;
  title?: string;
  status?: string;
  testDate?: string;
  questionCount?: string;
  submissionCountText?: string;
  submissionCountVal?: string;
  submissionPercent?: string;
  averageScoreVal?: string;
  averagePercent?: string;
  highestScoreVal?: string;
  highestLabel?: string;
  lowestScoreVal?: string;
  lowestLabel?: string;
}

export interface CIASummaryData {
  code?: string;
  title?: string;
  status?: string;
  assessmentDate?: string;
  totalMarks?: string;
  verifiedScriptsText?: string;
  verifiedSheetsVal?: string;
  verifiedPercentLabel?: string;
  averageScoreVal?: string;
  averagePercent?: string;
  highestScoreVal?: string;
  highestLabel?: string;
  lowestScoreVal?: string;
  lowestLabel?: string;
}

export interface AssessmentSummaryCardProps {
  variant?: "mcq" | "cia";
  mcqData?: MCQSummaryData;
  ciaData?: CIASummaryData;
}

const DEFAULT_MCQ_DATA: MCQSummaryData = {
  code: "MCQ-CN-2026-T1",
  title: "Application Layer Protocols & DNS MCQ Assessment",
  status: "Completed",
  testDate: "25 Aug 2026",
  questionCount: "10 Questions",
  submissionCountText: "40 / 40 Submitted (100%)",
  submissionCountVal: "40 / 40",
  submissionPercent: "(100%)",
  averageScoreVal: "8.2 / 10",
  averagePercent: "(82%)",
  highestScoreVal: "10 / 10",
  highestLabel: "(Top Mark)",
  lowestScoreVal: "5 / 10",
  lowestLabel: "(Min Mark)",
};

const DEFAULT_CIA_DATA: CIASummaryData = {
  code: "CIA-1",
  title: "CIA–1 Continuous Internal Assessment",
  status: "Verified",
  assessmentDate: "22 Aug 2026",
  totalMarks: "50",
  verifiedScriptsText: "40 / 40 (100%)",
  verifiedSheetsVal: "40 / 40",
  verifiedPercentLabel: "(100% Finalized)",
  averageScoreVal: "39.4 / 50",
  averagePercent: "(78.8%)",
  highestScoreVal: "49 / 50",
  highestLabel: "(Top Mark)",
  lowestScoreVal: "24 / 50",
  lowestLabel: "(Min Mark)",
};

export const AssessmentSummaryCard: React.FC<AssessmentSummaryCardProps> = ({
  variant = "mcq",
  mcqData = DEFAULT_MCQ_DATA,
  ciaData = DEFAULT_CIA_DATA,
}) => {
  if (variant === "mcq") {
    const data = { ...DEFAULT_MCQ_DATA, ...mcqData };

    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
        {/* Header Title & Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold text-pri dark:bg-gray-800 dark:text-gray-400">
              {data.code}
            </span>
            <h3 className="text-base md:text-lg font-bold text-[#000] dark:text-white">
              {data.title}
            </h3>
            {/* <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-100/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
              {data.status}
            </span> */}

            <span className="inline-flex  items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-100/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
              <span className="text-[#047857] font-bold">{data.status}</span>
            </span>
          </div>
        </div>

        {/* Metadata Details Row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#000] dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-pri" />
            <span className="text-pri">
              Test Date:{" "}
              <strong className="text-[#000] dark:text-gray-200 font-bold">
                {data.testDate}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-pri" />
            <span className="text-pri">
              Question Count:{" "}
              <strong className="text-[#000] dark:text-gray-200 font-bold">
                {data.questionCount}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-pri" />
            <span className="text-pri">
              Submission Count:{" "}
              <strong className="text-[#000] dark:text-gray-200 font-bold">
                {data.submissionCountText}
              </strong>
            </span>
          </div>
        </div>

        {/* Stat Cards 4 Grid (MCQ Variant: clean white border cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* Card 1 */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-2xs dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri">
              SUBMISSION COUNT
            </p>
            <div className="mt-2.5 flex items-baseline">
              <span className="text-2xl font-bold text-[#000] dark:text-white">
                {data.submissionCountVal}
              </span>
              <span className="ml-1.5 text-xs font-semibold text-pri">
                {data.submissionPercent}
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-2xs dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri">
              CLASS AVERAGE SCORE
            </p>
            <div className="mt-2.5 flex items-baseline">
              <span className="text-2xl font-bold text-[#000] dark:text-white">
                {data.averageScoreVal}
              </span>
              <span className="ml-1.5 text-xs font-semibold text-pri">
                {data.averagePercent}
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-2xs dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri">
              HIGHEST SCORE
            </p>
            <div className="mt-2.5 flex items-baseline">
              <span className="text-2xl font-bold text-[#000] dark:text-white">
                {data.highestScoreVal}
              </span>
              <span className="ml-1.5 text-xs font-semibold text-pri">
                {data.highestLabel}
              </span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-4.5 shadow-2xs dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri">
              LOWEST SCORE
            </p>
            <div className="mt-2.5 flex items-baseline">
              <span className="text-2xl font-bold text-[#000] dark:text-white">
                {data.lowestScoreVal}
              </span>
              <span className="ml-1.5 text-xs font-semibold text-pri">
                {data.lowestLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // CIA Variant (Soft Light Slate Box Background Matching Image 2)
  const data = { ...DEFAULT_CIA_DATA, ...ciaData };

  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
      {/* Header Title & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-bold text-pri dark:bg-gray-800 dark:text-gray-400">
            {data.code}
          </span>
          <h3 className="text-base md:text-lg font-bold text-[#000] dark:text-white">
            {data.title}
          </h3>
          {/* <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-100/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{data.status}</span>
          </span> */}

          <span className="inline-flex border border-[#10B981] items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-100/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#047857] font-bold  dark:text-emerald-400" />
            <span className="text-[#047857] font-bold">{data.status}</span>
          </span>
        </div>
      </div>

      {/* Metadata Details Row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#000] dark:text-gray-400">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-[#000]" />
          <span>
            Assessment Date:{" "}
            <strong className="text-[#000] dark:text-gray-200 font-bold">
              {data.assessmentDate}
            </strong>
          </span>
        </div>

        <span>•</span>

        <div className="flex items-center gap-1.5">
          <Award className="h-4 w-4 text-[#000]" />
          <span>
            Total Marks:{" "}
            <strong className="text-[#000] dark:text-gray-200 font-bold">
              {data.totalMarks}
            </strong>
          </span>
        </div>

        <span>•</span>

        <div className="flex items-center gap-1.5">
          <Info className="h-4 w-4 text-[#000]" />
          <span>
            Verified Scripts:{" "}
            <strong className="text-[#000] dark:text-gray-200 font-bold">
              {data.verifiedScriptsText}
            </strong>
          </span>
        </div>
      </div>

      {/* Stat Cards 4 Grid (CIA Variant: bg-[#F4F6F8] matching screenshot Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {/* Card 1 */}
        <div className="rounded-2xl border border-gray-100 bg-sec p-4.5 dark:border-gray-800/80 dark:bg-gray-800/60">
          <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri">
            VERIFIED ANSWER SHEETS
          </p>
          <div className="mt-2.5 flex items-baseline">
            <span className="text-2xl font-bold text-[#000] dark:text-white">
              {data.verifiedSheetsVal}
            </span>
            <span className="ml-1.5 text-xs font-semibold text-pri">
              {data.verifiedPercentLabel}
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-2xl border border-gray-100 bg-sec p-4.5 dark:border-gray-800/80 dark:bg-gray-800/60">
          <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri">
            CLASS AVERAGE SCORE
          </p>
          <div className="mt-2.5 flex items-baseline">
            <span className="text-2xl font-bold text-[#000] dark:text-white">
              {data.averageScoreVal}
            </span>
            <span className="ml-1.5 text-xs font-bold text-color2 dark:text-purple-400">
              {data.averagePercent}
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-2xl border border-gray-100 bg-sec p-4.5 dark:border-gray-800/80 dark:bg-gray-800/60">
          <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri">
            HIGHEST SCORE
          </p>
          <div className="mt-2.5 flex items-baseline">
            <span className="text-2xl font-bold text-[#000] dark:text-white">
              {data.highestScoreVal}
            </span>
            <span className="ml-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {data.highestLabel}
            </span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-2xl border border-gray-100 bg-sec p-4.5 dark:border-gray-800/80 dark:bg-gray-800/60">
          <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri">
            LOWEST SCORE
          </p>
          <div className="mt-2.5 flex items-baseline">
            <span className="text-2xl font-bold text-[#000] dark:text-white">
              {data.lowestScoreVal}
            </span>
            <span className="ml-1.5 text-xs font-semibold text-pri">
              {data.lowestLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentSummaryCard;
