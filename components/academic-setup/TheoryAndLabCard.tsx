import React from "react";
import LabExperimentRowItem, {
  LabExperimentRowItemProps,
} from "./LabExperimentRowItem";

export interface LabExperiment {
  id?: string;
  title: string;
}

export interface TheoryAndLabCardProps {
  title?: string;
  headerSubtitle?: string;
  theoryHours?: string | number;
  theoryWeeklyHours?: string;
  labHours?: string | number;
  labWeeklyHours?: string;
  labExperimentsTitle?: string;
  experiments?: LabExperiment[];
  className?: string;
}

const TheoryAndLabCard: React.FC<TheoryAndLabCardProps> = ({
  title = "THEORY & LABORATORY",
  headerSubtitle = "Curriculum Allocation",
  theoryHours = "0",
  theoryWeeklyHours = "Hours / Week",
  labHours = "0",
  labWeeklyHours = "Hours / Week",
  labExperimentsTitle = "LAB EXPERIMENTS",
  experiments = [],
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Header Row */}
      <div className="mb-5 flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-[#000] dark:text-white">
          <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
          <span className="text-md font-bold">{title}</span>

        </div>
        <span className="text-xs font-mono font-medium text-pri dark:text-pri">
          {headerSubtitle}
        </span>
      </div>

      {/* 2-Column Theory & Laboratory Hours Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Theory Block */}
        <div className="rounded-2xl border border-gray-200/60 bg-[#fbfbff] p-4 dark:border-gray-800 dark:bg-gray-800/80">
          <p className="text-xs font-bold uppercase tracking-wide text-pri dark:text-gray-400 mb-1">
            THEORY
          </p>
          <p className="text-2xl font-bold text-[#000] dark:text-white">
            {theoryHours}{" "}
            <span className="text-lg font-bold text-[#000] dark:text-gray-200 font-mono">
              Hours
            </span>
          </p>
          <p className="text-xs font-medium text-pri dark:text-pri mt-1.5">
            {theoryWeeklyHours}
          </p>
        </div>

        {/* Laboratory Block */}
        <div className="rounded-2xl border border-gray-200/60 bg-[#fbfbff] p-4 dark:border-gray-800 dark:bg-gray-800/80">
          <p className="text-xs font-bold uppercase tracking-wide text-pri dark:text-gray-400 mb-1">
            LABORATORY
          </p>
          <p className="text-2xl font-bold text-[#000] dark:text-white">
            {labHours}{" "}
            <span className="text-lg font-bold text-[#000] dark:text-gray-200 font-mono">
              Hours
            </span>
          </p>
          <p className="text-xs font-medium text-pri dark:text-pri mt-1.5">
            {labWeeklyHours}
          </p>
        </div>
      </div>

      {/* Lab Experiments Section */}
      {experiments.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/80">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#000] dark:text-white mb-3">
            {labExperimentsTitle}
          </h4>

          {/* List of Lab Experiments using LabExperimentRowItem inner component */}
          <div>
            {experiments.map((exp, idx) => (
              <LabExperimentRowItem
                key={exp.id || idx}
                index={idx + 1}
                title={exp.title}
                isLast={idx === experiments.length - 1}
              />
            ))}
          </div>
        </div>
      ) : Number(labHours) > 0 ? (
        <div className="mt-5 rounded-2xl border border-gray-200/60 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/80">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[#000] dark:text-white mb-2">
            {labExperimentsTitle}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            No specific laboratory experiments listed in the syllabus extract.
          </p>
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 text-center dark:border-gray-800 dark:bg-gray-800/40">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Theory-only course. No laboratory experiments required.
          </p>
        </div>
      )}
    </div>
  );
};

export default TheoryAndLabCard;
