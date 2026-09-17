import React from "react";

export interface CreditStatItem {
  label: string;
  value: string;
  isPurpleLabel?: boolean;
  isHighlighted?: boolean;
}

export interface CourseInformationCardProps {
  title?: string;
  headerSubtitle?: string;
  courseCode?: string;
  courseTitle?: string;
  creditStats?: CreditStatItem[];
  className?: string;
}

const DEFAULT_STATS: CreditStatItem[] = [
  { label: "Theory Hours", value: "45" },
  { label: "Lab Hours", value: "30" },
  { label: "Tutorial Hours", value: "0" },
  { label: "Total Credits", value: "4", isPurpleLabel: true, isHighlighted: true },
  { label: "COs Mapped", value: "5", isPurpleLabel: true, isHighlighted: true },
  { label: "Units Count", value: "5" },
];

const CourseInformationCard: React.FC<CourseInformationCardProps> = ({
  title = "COURSE INFORMATION",
  headerSubtitle = "Curriculum Structure",
  courseCode = "CS309",
  courseTitle = "Computer Networks",
  creditStats = DEFAULT_STATS,
  className = "",
}) => {
  return (
    <div
      className={`rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-5">
        <div className="flex items-center gap-2 text-md font-extrabold uppercase tracking-wider text-color1 dark:text-white">
          <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
          <span className="text-md font-bold">{title}</span>
        </div>
        <span className="text-xs font-mono font-medium text-[#000] dark:text-pri">
          {headerSubtitle}
        </span>
      </div>

      {/* 2 Column Code & Title Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 mb-4">
        <div className="sm:col-span-4 rounded-2xl border border-gray-200/60 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri mb-1">
            COURSE CODE
          </p>
          <p className="text-lg font-extrabold text-color2 dark:text-purple-400">
            {courseCode}
          </p>
        </div>

        <div className="sm:col-span-8 rounded-2xl border border-gray-200/60 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
          <p className="text-xs font-bold uppercase tracking-wider text-pri dark:text-pri mb-1">
            COURSE TITLE
          </p>
          <p className="text-lg font-bold text-[#000] dark:text-white">
            {courseTitle}
          </p>
        </div>
      </div>

      {/* 6 Credit Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {creditStats.map((stat, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-4 text-center border transition ${stat.isHighlighted
              ? "border-purple-200 bg-[#f5f3ff] dark:border-purple-900 dark:bg-purple-950/40"
              : "border-gray-200/60 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-800/40"
              }`}
          >
            <p
              className={`text-xs font-bold mb-1 ${stat.isPurpleLabel
                ? "text-color2 dark:text-purple-300"
                : "text-pri dark:text-gray-400"
                }`}
            >
              {stat.label}
            </p>
            <p
              className={`text-lg font-extrabold ${stat.isHighlighted
                ? "text-color2 dark:text-purple-300"
                : "text-[#000] dark:text-white"
                }`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseInformationCard;
