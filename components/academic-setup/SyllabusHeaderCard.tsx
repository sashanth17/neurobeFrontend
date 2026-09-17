import React from "react";
import { BookOpen, CheckCircle2 } from "lucide-react";
import GenericTabs, { TabItem } from "@/components/common-components/GenericTabs";

export interface SyllabusHeaderCardProps {
  title?: string;
  icon?: React.ReactNode;
  bannerProgramme?: string;
  bannerBatch?: string;
  bannerSemester?: string;
  courseCode?: string;
  courseTitle?: string;
  subtitle?: string;
  approvedBy?: string;
  approvedDate?: string;
  unitsCountText?: string;
  versionBadgeText?: string;
  tabs?: TabItem[];
  activeTabKey?: string;
  onTabChange?: (key: string) => void;
  className?: string;
}

const DEFAULT_TABS: TabItem[] = [
  { key: "course-info", label: "Course Info" },
  { key: "course-outcomes", label: "Course Outcomes" },
  { key: "unit-syllabus", label: "Unit-wise Syllabus" },
  { key: "theory-lab", label: "Theory & Lab" },
  { key: "textbooks", label: "Textbooks" },
  { key: "reference-books", label: "Reference Books" },
];

const SyllabusHeaderCard: React.FC<SyllabusHeaderCardProps> = ({
  title = "Syllabus",
  icon = <BookOpen className="h-6 w-6" />,
  bannerProgramme = "B.Tech CSE",
  bannerBatch = "2025–2029",
  bannerSemester = "3",
  courseCode = "CS309",
  courseTitle = "Computer Networks",
  subtitle = "Approved course syllabus, outcomes, units and prescribed references.",
  approvedBy = "Dr. Arun Kumar",
  approvedDate = "18 Aug 2026",
  unitsCountText = "5 Units • CO1–CO5",
  versionBadgeText = "Approved v1.0",
  tabs = DEFAULT_TABS,
  activeTabKey = "course-info",
  onTabChange,
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Top Banner Pill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-gray-200/70 bg-dark_grey px-5 py-2.5 dark:border-gray-800 dark:bg-gray-800/40">
        <div className="text-sm font-semibold text-pri dark:text-gray-400">
          <span>Programme: <strong className="text-[#000] dark:text-gray-200">{bannerProgramme}</strong></span>
          <span className="mx-2 text-gray-300">•</span>
          <span>Batch: <strong className="text-[#000] dark:text-gray-200">{bannerBatch}</strong></span>
          <span className="mx-2 text-gray-300">•</span>
          <span>Semester: <strong className="text-[#000] dark:text-gray-200">{bannerSemester}</strong></span>
        </div>
        <div className="text-sm font-bold text-color2 dark:text-purple-400">
          {courseCode} — {courseTitle}
        </div>
      </div>

      {/* Main Header Row */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-start gap-4">
            {/* Icon Box */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-100 bg-[#f5f3ff] text-color2 dark:border-purple-900 dark:bg-purple-950/50 dark:text-purple-300">
              {icon}
            </div>

            <div>
              <h2 className="page-ti mb-2 dark:text-white">
                {title}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-pri dark:text-gray-400">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Approved Meta Line */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2 text-xs text-pri dark:text-gray-400">
            <span>
              <strong>Approved by:</strong> {approvedBy}
            </span>
            <span>•</span>
            <span>
              <strong>Approved on:</strong> {approvedDate}
            </span>
            <span>•</span>
            <span className="font-bold text-color2 dark:text-purple-300">
              {unitsCountText}
            </span>
          </div>
        </div>

        {/* Right Badge */}
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {versionBadgeText}
        </span>
      </div>
    </div>
  );
};

export default SyllabusHeaderCard;
