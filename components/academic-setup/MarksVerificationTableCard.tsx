import React, { useState } from "react";
import { Check, AlertCircle, ChevronRight } from "lucide-react";
import VerificationProgressApprovalCard from "@/components/academic-setup/VerificationProgressApprovalCard";

export type QuestionStatus = "verified" | "corrected" | "needs_review";

export interface QuestionRowData {
  id: string;
  qNo: string;
  maxMark: number;
  systemRead: number;
  finalMark: number;
  status: QuestionStatus;
}

export interface MarksVerificationTableCardProps {
  title?: string;
  subtitle?: string;
  questions?: QuestionRowData[];
  variation?: "unverified" | "review_warning" | "verified";
  warningMessage?: string;
  onVerify?: () => void;
  onNextStudent?: () => void;
  onProceedToApproval?: () => void;
  verifiedCount?: number;
  totalCount?: number;
  className?: string;
}

const DEFAULT_QUESTIONS: QuestionRowData[] = [
  {
    id: "1",
    qNo: "Q1 (Part A)",
    maxMark: 2,
    systemRead: 2,
    finalMark: 2,
    status: "verified",
  },
  {
    id: "2",
    qNo: "Q2 (Part A)",
    maxMark: 2,
    systemRead: 2,
    finalMark: 2,
    status: "verified",
  },
  {
    id: "3",
    qNo: "Q3 (Part A)",
    maxMark: 2,
    systemRead: 1,
    finalMark: 1,
    status: "verified",
  },
  {
    id: "4",
    qNo: "Q4 (Part A)",
    maxMark: 2,
    systemRead: 1,
    finalMark: 2,
    status: "corrected",
  },
  {
    id: "5",
    qNo: "Q5 (Part A)",
    maxMark: 2,
    systemRead: 0.5,
    finalMark: 0.5,
    status: "verified",
  },
  {
    id: "6",
    qNo: "Q6 (Part B)",
    maxMark: 8,
    systemRead: 7,
    finalMark: 7,
    status: "verified",
  },
  {
    id: "7",
    qNo: "Q7 (Part B)",
    maxMark: 8,
    systemRead: 6,
    finalMark: 6,
    status: "verified",
  },
  {
    id: "8",
    qNo: "Q8 (Part C)",
    maxMark: 24,
    systemRead: 24,
    finalMark: 24,
    status: "verified",
  },
];

export const MarksVerificationTableCard: React.FC<
  MarksVerificationTableCardProps
> = ({
  title = "MARKS VERIFICATION",
  subtitle = "System Read = mark extracted from the evaluated answer sheet. Final Mark = mark confirmed by the Instructor.",
  questions = DEFAULT_QUESTIONS,
  variation = "unverified",
  warningMessage = "Review the highlighted mark before verification.",
  onVerify,
  onNextStudent,
  onProceedToApproval,
  verifiedCount = 40,
  totalCount = 40,
  className = "",
}) => {
    const [rows, setRows] = useState<QuestionRowData[]>(questions);

    const handleMarkChange = (id: string, newMark: number) => {
      setRows((prev) =>
        prev.map((row) =>
          row.id === id
            ? {
              ...row,
              finalMark: newMark,
              status: newMark !== row.systemRead ? "corrected" : "verified",
            }
            : row
        )
      );
    };

    const totalMax = rows.reduce((acc, r) => acc + r.maxMark, 0);
    const totalSystem = rows.reduce((acc, r) => acc + r.systemRead, 0);
    const totalFinal = rows.reduce((acc, r) => acc + r.finalMark, 0);

    const hasNeedsReview = rows.some((r) => r.status === "needs_review");

    return (
      <div
        className={`panel rounded-3xl border border-gray-100 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 sm:p-6 ${className}`}
      >
        {/* Header Title & Subtitle */}
        <div className="mb-5">
          <h3 className="text-sm font-bold uppercase tracking-wide text-gray-900 dark:text-white sm:text-base">
            {title}
          </h3>
          <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400 sm:text-sm">
            System Read = mark extracted from the evaluated answer sheet.{" "}
            <span className="font-bold text-gray-800 dark:text-gray-200">
              Final Mark
            </span>{" "}
            = mark confirmed by the Instructor.
          </p>
        </div>

        {/* Table Container */}
        <div className="mb-5 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
                <th className="py-3 px-4">QUESTION</th>
                <th className="py-3 px-4 text-center">MAX MARK</th>
                <th className="py-3 px-4 text-center">SYSTEM READ</th>
                <th className="py-3 px-4 text-center">FINAL MARK</th>
                <th className="py-3 px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.map((row) => {
                const isNeedsReview = row.status === "needs_review";
                const isCorrected = row.status === "corrected";

                return (
                  <tr
                    key={row.id}
                    className={`transition-colors ${isNeedsReview
                      ? "bg-[#FFF9F2] dark:bg-amber-950/20"
                      : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                      }`}
                  >
                    {/* Question Name */}
                    <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                      {row.qNo.split(" ")[0]}{" "}
                      <span className="font-normal text-gray-400">
                        {row.qNo.substring(row.qNo.indexOf(" "))}
                      </span>
                    </td>

                    {/* Max Mark */}
                    <td className="py-3.5 px-4 text-center font-medium text-gray-600 dark:text-gray-300">
                      {row.maxMark}
                    </td>

                    {/* System Read */}
                    <td className="py-3.5 px-4 text-center font-medium text-gray-600 dark:text-gray-300">
                      {row.systemRead}
                    </td>

                    {/* Final Mark Input */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="number"
                        value={row.finalMark}
                        onChange={(e) =>
                          handleMarkChange(row.id, Number(e.target.value))
                        }
                        className={`w-16 rounded-xl p-1.5 text-center text-xs font-bold transition-all focus:outline-none sm:w-20 sm:text-sm ${isCorrected
                          ? "border-2 border-purple-500 bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white"
                          : isNeedsReview
                            ? "border-2 border-amber-500 bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white"
                            : "border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          }`}
                      />
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {isNeedsReview ? (
                        <span className="inline-block rounded-lg bg-amber-100/90 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                          Needs Review
                        </span>
                      ) : isCorrected ? (
                        <span className="inline-block rounded-lg bg-purple-100 px-3 py-1 text-xs font-bold text-color2 dark:bg-purple-900/60 dark:text-purple-300">
                          Corrected
                        </span>
                      ) : (
                        <span className="inline-block rounded-lg bg-emerald-100/90 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                          Verified
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Total Summary Row */}
              <tr className="bg-gray-50/40 font-bold text-gray-900 dark:bg-gray-800/40 dark:text-white">
                <td className="py-4 px-4 font-bold">Total</td>
                <td className="py-4 px-4 text-center font-bold">{totalMax}</td>
                <td className="py-4 px-4 text-center font-bold">{totalSystem}</td>
                <td className="py-4 px-4 text-center font-bold text-color2 dark:text-purple-400">
                  {totalFinal}
                </td>
                <td className="py-4 px-4 text-center font-bold text-gray-600 dark:text-gray-300">
                  {totalFinal} / {totalMax}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Warning Alert Banner (if needed or review_warning variation) */}
        {/* {(hasNeedsReview || variation === "review_warning") && ( */}
        <div className="mb-5 flex items-center gap-2 rounded-2xl border border-amber-200/90 bg-[#FFF9DC] p-3.5 text-xs font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 sm:text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400" />
          <span>{warningMessage}</span>
        </div>
        {/* )} */}

        {/* Footer Action Variants */}
        {variation === "verified" ? (
          /* Variation 3: Verified banner + Next Student button */
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 sm:text-sm">
                Student Verified
              </span>
            </div>
            <button
              type="button"
              onClick={onNextStudent}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#111625] px-5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 sm:text-sm"
            >
              <span>Next Student</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : variation === "unverified" ? (
          /* Variation 1: Full-width Verify Student Marks Button */
          <button
            type="button"
            onClick={onVerify}
            className="create-btn flex w-full items-center justify-center py-3 text-sm font-bold"
          >
            Verify Student Marks
          </button>
        ) : null}
      </div>
    );
  };

export default MarksVerificationTableCard;
