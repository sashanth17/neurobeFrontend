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

  const stats = [
    {
      id: "all" as const,
      label: "Total Questions",
      count: questions.length,
      icon: BarChart3,
      iconBg: "bg-indigo-600 text-white",
      textColor: "text-indigo-700 dark:text-indigo-300",
      activeBg: "border-indigo-500 bg-indigo-50/90 ring-1 ring-indigo-500/30 dark:bg-indigo-950/50",
      defaultBg: "border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900",
    },
    {
      id: "approved" as const,
      label: "Approved",
      count: approvedCount,
      icon: CheckCircle2,
      iconBg: "bg-emerald-600 text-white",
      textColor: "text-emerald-700 dark:text-emerald-300",
      activeBg: "border-emerald-500 bg-emerald-50/90 ring-1 ring-emerald-500/30 dark:bg-emerald-950/50",
      defaultBg: "border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900",
    },
    {
      id: "archived" as const,
      label: "Archived",
      count: archivedCount,
      icon: Archive,
      iconBg: "bg-purple-600 text-white",
      textColor: "text-purple-700 dark:text-purple-300",
      activeBg: "border-purple-600 bg-purple-50 ring-1 ring-purple-600/30 dark:bg-purple-950/50",
      defaultBg: "border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900",
    },
    {
      id: "review" as const,
      label: "Need Review",
      count: reviewCount,
      icon: Clock,
      iconBg: "bg-amber-500 text-white",
      textColor: "text-amber-700 dark:text-amber-300",
      activeBg: "border-amber-500 bg-amber-50/90 ring-1 ring-amber-500/30 dark:bg-amber-950/50",
      defaultBg: "border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900",
    },
    {
      id: "drafted" as const,
      label: "Drafted",
      count: draftedCount,
      icon: FileCheck2,
      iconBg: "bg-slate-600 text-white",
      textColor: "text-slate-700 dark:text-slate-300",
      activeBg: "border-slate-500 bg-slate-100 ring-1 ring-slate-500/30 dark:bg-slate-800",
      defaultBg: "border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const isSelected = selectedFilter === stat.id;
        return (
          <button
            key={stat.id}
            type="button"
            onClick={() => {
              onSelectFilter(isSelected && stat.id !== "all" ? "all" : stat.id);
              scrollToQuestions();
            }}
            className={`group flex items-center gap-2.5 rounded-xl border p-2 text-left shadow-2xs transition hover:shadow-xs active:scale-[0.99] cursor-pointer ${
              isSelected ? stat.activeBg : stat.defaultBg
            }`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-2xs ${stat.iconBg}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1">
                <span className={`text-base font-black tracking-tight ${stat.textColor}`}>{stat.count}</span>
                {isSelected && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">Active</span>
                )}
              </div>
              <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MCQStatsBanner;
