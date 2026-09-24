import React from "react";
import { BarChart3, CheckCircle2, Archive, Clock, FileCheck2 } from "lucide-react";
import { MCQQuestion } from "./types";

interface MCQStatsBannerProps {
  questions: MCQQuestion[];
  selectedFilter: "recent" | "all" | "approved" | "archived" | "review" | "drafted";
  onSelectFilter: (filter: "recent" | "all" | "approved" | "archived" | "review" | "drafted") => void;
}

export const MCQStatsBanner: React.FC<MCQStatsBannerProps> = ({
  questions,
  selectedFilter,
  onSelectFilter,
}: MCQStatsBannerProps) => {
  const approvedCount = questions.filter((q) => (q.status || "").toLowerCase() === "approved").length;
  const reviewCount = questions.filter(
    (q) => (q.status || "").toLowerCase() === "need review" || (q.status || "").toLowerCase() === "review"
  ).length;
  const draftedCount = questions.filter(
    (q) => (q.status || "").toLowerCase() === "drafted" || (q.status || "").toLowerCase() === "draft"
  ).length;
  const archivedCount = questions.filter((q) => (q.status || "").toLowerCase() === "archived").length;

  const scrollToQuestions = () => {
    document.getElementById("questions-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total questions */}
      <button
        type="button"
        onClick={() => {
          onSelectFilter("all");
          scrollToQuestions();
        }}
        className={`group flex items-center gap-4 rounded-2xl border p-5 shadow-sm text-left transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer ${
          selectedFilter === "all"
            ? "border-indigo-500 bg-indigo-50/90 ring-2 ring-indigo-500/30 dark:bg-indigo-950/50"
            : "border-indigo-100 bg-gradient-to-br from-indigo-50 to-white dark:border-indigo-900/40 dark:from-indigo-950/30 dark:to-gray-900"
        }`}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow group-hover:scale-105 transition-transform">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300">{questions.length}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Total Questions</p>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 underline">View All</span>
          </div>
        </div>
      </button>

      {/* Approved */}
      <button
        type="button"
        onClick={() => {
          onSelectFilter(selectedFilter === "approved" ? "all" : "approved");
          scrollToQuestions();
        }}
        className={`group flex items-center gap-4 rounded-2xl border p-5 shadow-sm text-left transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer ${
          selectedFilter === "approved"
            ? "border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/30 dark:bg-emerald-950/50"
            : "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900/40 dark:from-emerald-950/30 dark:to-gray-900"
        }`}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow group-hover:scale-105 transition-transform">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{approvedCount}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Approved</p>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 underline">Filter</span>
          </div>
        </div>
      </button>

      {/* Archived with Distinct Violet Styling */}
      <button
        type="button"
        onClick={() => {
          onSelectFilter(selectedFilter === "archived" ? "all" : "archived");
          scrollToQuestions();
        }}
        className={`group flex items-center gap-4 rounded-2xl border p-5 shadow-sm text-left transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer ${
          selectedFilter === "archived"
            ? "border-purple-600 bg-purple-50 ring-2 ring-purple-600/30 dark:bg-purple-950/50"
            : "border-purple-200/80 bg-gradient-to-br from-purple-50/60 to-white dark:border-purple-900/40 dark:from-purple-950/30 dark:to-gray-900"
        }`}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow group-hover:scale-105 transition-transform">
          <Archive className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">{archivedCount}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-purple-900 dark:text-purple-300">Archived</p>
            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 underline">Filter</span>
          </div>
        </div>
      </button>

      {/* Need Review */}
      <button
        type="button"
        onClick={() => {
          onSelectFilter(selectedFilter === "review" ? "all" : "review");
          scrollToQuestions();
        }}
        className={`group flex items-center gap-4 rounded-2xl border p-5 shadow-sm text-left transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer ${
          selectedFilter === "review"
            ? "border-amber-500 bg-amber-50/90 ring-2 ring-amber-500/30 dark:bg-amber-950/50"
            : "border-amber-100 bg-gradient-to-br from-amber-50 to-white dark:border-amber-900/40 dark:from-amber-950/30 dark:to-gray-900"
        }`}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow group-hover:scale-105 transition-transform">
          <Clock className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">{reviewCount}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Need Review</p>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 underline">Filter</span>
          </div>
        </div>
      </button>

      {/* Drafted */}
      <button
        type="button"
        onClick={() => {
          onSelectFilter(selectedFilter === "drafted" ? "all" : "drafted");
          scrollToQuestions();
        }}
        className={`group flex items-center gap-4 rounded-2xl border p-5 shadow-sm text-left transition-all hover:shadow-md hover:scale-[1.01] cursor-pointer ${
          selectedFilter === "drafted"
            ? "border-slate-500 bg-slate-100 ring-2 ring-slate-500/30 dark:bg-slate-800"
            : "border-slate-100 bg-gradient-to-br from-slate-50 to-white dark:border-slate-800 dark:from-slate-900/50 dark:to-gray-900"
        }`}
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-600 text-white shadow group-hover:scale-105 transition-transform">
          <FileCheck2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-extrabold text-slate-700 dark:text-slate-300">{draftedCount}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Drafted</p>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 underline">Filter</span>
          </div>
        </div>
      </button>
    </div>
  );
};

export default MCQStatsBanner;
