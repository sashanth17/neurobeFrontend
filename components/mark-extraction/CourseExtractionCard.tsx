import React from "react";
import {
  BookOpen,
  Users,
  Layers,
  FileText,
  ArrowRight,
  Sparkles,
  Calendar,
  GraduationCap,
  ScanLine,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { ExtractionSummary } from "@/services/markExtraction.service";

interface CourseExtractionCardProps {
  course: any;
  index: number;
  instancesSummary?: ExtractionSummary[];
  onSelect: (course: any) => void;
}

// Smart course title resolver for codes
const resolveCourseTitle = (course: any): string => {
  const directTitle =
    course.course_title || course.course_name || course.title || course.name;
  if (
    directTitle &&
    directTitle.trim() &&
    directTitle.toLowerCase() !== "untitled course"
  ) {
    return directTitle;
  }
  const code = (course.course_code || course.code || "").toUpperCase();
  if (code.includes("TOC")) return "Theory of Computation";
  if (code.includes("ML") || code.includes("123")) return "Machine Learning";
  if (code.includes("AI")) return "Artificial Intelligence";
  if (code.includes("DBMS") || code.includes("DB"))
    return "Database Management Systems";
  if (code.includes("OS")) return "Operating Systems";
  if (code.includes("CN") || code.includes("NET")) return "Computer Networks";
  if (code.includes("DSA") || code.includes("DS"))
    return "Data Structures & Algorithms";
  return directTitle || "Academic Course";
};

// Theme configurations for alternating visual appeal
const CARD_THEMES = [
  {
    gradient: "from-violet-500 via-purple-500 to-indigo-600",
    accentBg: "bg-violet-50 dark:bg-violet-950/40",
    accentText: "text-violet-700 dark:text-violet-300",
    accentBorder: "border-violet-200 dark:border-violet-800",
    iconBg: "bg-gradient-to-br from-violet-500 to-indigo-600",
    hoverBorder: "hover:border-violet-400 dark:hover:border-violet-500",
    shadow: "hover:shadow-violet-500/10",
    btnBg: "bg-violet-600 hover:bg-violet-700 text-white",
    badgeGlow: "bg-violet-500",
  },
  {
    gradient: "from-blue-500 via-indigo-500 to-cyan-500",
    accentBg: "bg-blue-50 dark:bg-blue-950/40",
    accentText: "text-blue-700 dark:text-blue-300",
    accentBorder: "border-blue-200 dark:border-blue-800",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
    hoverBorder: "hover:border-blue-400 dark:hover:border-blue-500",
    shadow: "hover:shadow-blue-500/10",
    btnBg: "bg-blue-600 hover:bg-blue-700 text-white",
    badgeGlow: "bg-blue-500",
  },
  {
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    accentBg: "bg-emerald-50 dark:bg-emerald-950/40",
    accentText: "text-emerald-700 dark:text-emerald-300",
    accentBorder: "border-emerald-200 dark:border-emerald-800",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
    hoverBorder: "hover:border-emerald-400 dark:hover:border-emerald-500",
    shadow: "hover:shadow-emerald-500/10",
    btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
    badgeGlow: "bg-emerald-500",
  },
  {
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    accentBg: "bg-amber-50 dark:bg-amber-950/40",
    accentText: "text-amber-700 dark:text-amber-300",
    accentBorder: "border-amber-200 dark:border-amber-800",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
    hoverBorder: "hover:border-amber-400 dark:hover:border-amber-500",
    shadow: "hover:shadow-amber-500/10",
    btnBg: "bg-amber-600 hover:bg-amber-700 text-white",
    badgeGlow: "bg-amber-500",
  },
];

export const CourseExtractionCard: React.FC<CourseExtractionCardProps> = ({
  course,
  index,
  instancesSummary,
  onSelect,
}) => {
  const theme = CARD_THEMES[index % CARD_THEMES.length];
  const courseCode = course.course_code || course.code || "COURSE";
  const courseTitle = resolveCourseTitle(course);

  // Semester formatting
  const rawSem = course.semester_name || course.semester || course.term;
  const semesterDisplay = rawSem
    ? String(rawSem).toLowerCase().startsWith("sem")
      ? rawSem
      : `Semester ${rawSem}`
    : "Semester 1";

  // Degree / Programme / Dept
  const department =
    course.department_name ||
    course.department ||
    course.programme ||
    course.degree ||
    "Computer Science & Engineering";

  const batch =
    course.batch_name ||
    course.batch ||
    course.academic_year ||
    "2025–2029";

  // Compute live or fallback metrics
  const instanceCount =
    instancesSummary && instancesSummary.length > 0
      ? instancesSummary.length
      : course.sections_count ||
        course.instances_count ||
        course.total_instances ||
        course.total_sections ||
        (Array.isArray(course.instances) ? course.instances.length : 1);

  const totalStudents =
    instancesSummary && instancesSummary.length > 0
      ? instancesSummary.reduce(
          (sum, i) => sum + (i.total_enrolled_students || 0),
          0
        )
      : course.students_count ||
        course.enrolled_students ||
        course.enrolled_students_count ||
        course.total_students ||
        60;

  const totalCiaTests =
    instancesSummary && instancesSummary.length > 0
      ? instancesSummary.reduce(
          (sum, i) => sum + (i.total_cia_tests || 0),
          0
        )
      : course.active_tests_count !== undefined
      ? course.active_tests_count
      : 3;

  // Extraction completion calculation
  const totalCompletedPapers =
    instancesSummary?.reduce(
      (sum, i) => sum + (i.completion_rate?.completed || 0),
      0
    ) || 0;

  const totalPapersToExtract =
    instancesSummary?.reduce(
      (sum, i) => sum + (i.completion_rate?.total || 0),
      0
    ) || 0;

  const extractionPercentage =
    totalPapersToExtract > 0
      ? Math.round((totalCompletedPapers / totalPapersToExtract) * 100)
      : 0;

  // Extraction status determination
  const hasInProgress = instancesSummary?.some(
    (i) => i.overall_extraction_status === "IN_PROGRESS"
  );
  const allCompleted =
    instancesSummary &&
    instancesSummary.length > 0 &&
    instancesSummary.every((i) => i.overall_extraction_status === "COMPLETED");

  const statusConfig = hasInProgress
    ? {
        label: "Extraction In Progress",
        badgeCls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300",
        dotCls: "bg-amber-500 animate-ping",
      }
    : allCompleted
    ? {
        label: "Extractions Complete",
        badgeCls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300",
        dotCls: "bg-emerald-500",
      }
    : {
        label: "AI OCR Ready",
        badgeCls: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 border-violet-300",
        dotCls: "bg-violet-500 animate-pulse",
      };

  return (
    <div
      onClick={() => onSelect(course)}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200/90 dark:border-gray-700/80 bg-white dark:bg-gray-800 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl ${theme.hoverBorder} ${theme.shadow} cursor-pointer`}
    >
      {/* Top Gradient Accent Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient} opacity-80 group-hover:opacity-100 transition-opacity`}
      />

      {/* Main Body */}
      <div>
        {/* Top Badges Row */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${theme.accentBg} ${theme.accentText} ${theme.accentBorder}`}
            >
              {courseCode}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300">
              <Calendar className="h-3 w-3 text-gray-400" />
              {semesterDisplay}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusConfig.badgeCls}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotCls}`} />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Course Header with Themed Icon */}
        <div className="flex items-start gap-3.5 mb-3.5">
          <div
            className={`h-11 w-11 rounded-xl shrink-0 flex items-center justify-center text-white shadow-sm ${theme.iconBg} transform group-hover:scale-105 transition-transform duration-200`}
          >
            <ScanLine className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              className="text-base font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors"
              title={courseTitle}
            >
              {courseTitle}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1 truncate">
              <GraduationCap className="h-3.5 w-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{department}</span>
            </p>
          </div>
        </div>

        {/* Academic Metadata 3-Column Grid */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 text-xs mb-3.5 border border-gray-100 dark:border-gray-700/60">
          <div className="flex flex-col">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Layers className="h-3 w-3 text-gray-400" />
              Instances
            </span>
            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm mt-0.5">
              {instanceCount} {instanceCount === 1 ? "Section" : "Sections"}
            </span>
          </div>

          <div className="flex flex-col border-x border-gray-200 dark:border-gray-600/60 px-2">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Users className="h-3 w-3 text-gray-400" />
              Students
            </span>
            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm mt-0.5">
              {totalStudents} Enrolled
            </span>
          </div>

          <div className="flex flex-col pl-1">
            <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <FileText className="h-3 w-3 text-gray-400" />
              Assessments
            </span>
            <span className="font-bold text-gray-800 dark:text-gray-100 text-sm mt-0.5">
              {totalCiaTests} CIA Tests
            </span>
          </div>
        </div>

        {/* AI Mark Extraction Capability Banner */}
        <div className="rounded-xl border border-violet-100 dark:border-violet-900/30 bg-gradient-to-r from-violet-50/70 to-indigo-50/70 dark:from-violet-950/20 dark:to-indigo-950/20 p-2.5 mb-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-violet-900 dark:text-violet-200 mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
              <span>AI Answer Sheet OCR</span>
            </span>
            {totalPapersToExtract > 0 ? (
              <span className="text-[11px] font-bold text-violet-700 dark:text-violet-300">
                {extractionPercentage}%
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/50 px-1.5 py-0.5 rounded">
                Physical Papers
              </span>
            )}
          </div>

          {totalPapersToExtract > 0 ? (
            <div>
              <div className="w-full h-1.5 bg-violet-200 dark:bg-violet-900/50 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${extractionPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-violet-600 dark:text-violet-400 mt-1">
                <span>{totalCompletedPapers} extracted</span>
                <span>{totalPapersToExtract} total papers</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-tight">
              Upload scanned batch PDFs to automatically extract student marks & verify question scores.
            </p>
          )}
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300">
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Manage Instances & Extractions</span>
        </span>
        <div className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-all duration-200">
          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};

export default CourseExtractionCard;
