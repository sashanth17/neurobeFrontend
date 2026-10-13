import React from "react";
import {
  GraduationCap,
  Layers,
  ArrowRight,
  Sparkles,
  History,
  ShieldCheck,
  UserCheck,
  Award,
} from "lucide-react";
import { useRouter } from "next/router";

export interface ActiveVersionsData {
  syllabus_id?: number | null;
  syllabus_version?: number | null;
  syllabus_state?: string | null;
  syllabus_approved?: boolean | null;
  extraction_id?: number | null;
  extraction_version?: number | null;
  extraction_state?: string | null;
  credits?: number | null;
  total_theory_hours?: number | null;
  total_lab_hours?: number | null;
  copo_id?: number | null;
  copo_version?: number | null;
  copo_state?: string | null;
  pedagogy_id?: number | null;
  pedagogy_version?: number | null;
  pedagogy_state?: string | null;
  lesson_plan_id?: number | null;
  lesson_plan_version?: number | null;
  lesson_plan_state?: string | null;
}

export interface AssignedCourseItem {
  course_id: number;
  course_code: string;
  course_title: string;
  department_name?: string;
  programme_name?: string;
  semester?: number | string | null;
  roles?: string[];
  is_coordinator?: boolean;
  can_edit?: boolean;
  active_versions?: ActiveVersionsData;
  readiness_percentage?: number;
}

export interface AssignedCourseCardProps {
  course: AssignedCourseItem;
  viewMode?: "grid" | "list";
  onOpenCourse?: (courseId: number) => void;
  onOpenVersionHistory?: (courseId: number) => void;
}

export const getStatusConfig = (state?: string | null, version?: number | null) => {
  if (!version && !state) {
    return {
      label: "Not Started",
      bg: "bg-slate-100 dark:bg-slate-800/70",
      text: "text-slate-500 dark:text-slate-400",
      border: "border-slate-200/80 dark:border-slate-700/60",
      dot: "bg-slate-400 dark:bg-slate-500",
    };
  }
  const s = String(state || "").toLowerCase();
  if (s === "completed" || s === "approved") {
    return {
      label: "Ready",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-200/80 dark:border-emerald-900/50",
      dot: "bg-emerald-500",
    };
  }
  if (s === "processing" || s === "generating" || s === "in_progress") {
    return {
      label: "Processing",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200/80 dark:border-amber-900/50",
      dot: "bg-amber-500 animate-pulse",
    };
  }
  if (s === "redis_queued") {
    return {
      label: "Queued",
      bg: "bg-sky-50 dark:bg-sky-950/40",
      text: "text-sky-700 dark:text-sky-400",
      border: "border-sky-200/80 dark:border-sky-900/50",
      dot: "bg-sky-500 animate-pulse",
    };
  }
  if (s === "failed") {
    return {
      label: "Failed",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-700 dark:text-rose-400",
      border: "border-rose-200/80 dark:border-rose-900/50",
      dot: "bg-rose-500",
    };
  }
  return {
    label: "Draft",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-400",
    border: "border-indigo-200/80 dark:border-indigo-900/50",
    dot: "bg-indigo-500",
  };
};

export const getReadinessTheme = (readiness: number) => {
  if (readiness >= 80) {
    return {
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
      barColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
      iconColor: "text-emerald-500",
    };
  }
  if (readiness >= 40) {
    return {
      badgeBg: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
      barColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      iconColor: "text-amber-500",
    };
  }
  return {
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
    barColor: "bg-gradient-to-r from-indigo-500 to-purple-500",
    iconColor: "text-indigo-500",
  };
};

const AssignedCourseCard: React.FC<AssignedCourseCardProps> = ({
  course,
  viewMode = "grid",
  onOpenCourse,
  onOpenVersionHistory,
}) => {
  const router = useRouter();
  const cid = course.course_id;
  const isCoord = Boolean(course.is_coordinator);
  const readiness = Math.min(100, Math.max(0, course.readiness_percentage ?? 0));
  const v = course.active_versions || {};
  const rTheme = getReadinessTheme(readiness);

  const handleOpenArtifacts = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onOpenCourse) {
      onOpenCourse(cid);
    } else {
      router.push(`/neurobe/course-artifacts?course_id=${cid}`);
    }
  };

  const handleOpenVersionHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenVersionHistory) {
      onOpenVersionHistory(cid);
    } else {
      router.push(`/neurobe/course-version-history?course_id=${cid}`);
    }
  };

  const stages = [
    { key: "syllabus", label: "Syllabus", shortLabel: "Syl", version: v.syllabus_version, state: v.syllabus_state },
    { key: "extraction", label: "Extraction", shortLabel: "Ext", version: v.extraction_version, state: v.extraction_state },
    { key: "copo", label: "CO-PO", shortLabel: "COPO", version: v.copo_version, state: v.copo_state },
    { key: "pedagogy", label: "Pedagogy", shortLabel: "Ped", version: v.pedagogy_version, state: v.pedagogy_state },
    { key: "lesson_plan", label: "Lesson Plan", shortLabel: "LP", version: v.lesson_plan_version, state: v.lesson_plan_state },
  ];

  // List View Layout (High Density, Zero-Scroll Friendly)
  if (viewMode === "list") {
    return (
      <div
        onClick={() => handleOpenArtifacts()}
        className="group relative flex cursor-pointer flex-col justify-between gap-2.5 rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs transition-all duration-150 hover:border-indigo-400 hover:bg-slate-50/50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-600 sm:flex-row sm:items-center"
      >
        {/* Left: Code, Role & Title */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-md border border-indigo-200/60 bg-indigo-50/70 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
              {course.course_code}
            </span>

            {isCoord ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-purple-200/60 bg-purple-50/70 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300">
                <ShieldCheck className="h-3 w-3" />
                Coordinator
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/60 bg-emerald-50/70 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                <UserCheck className="h-3 w-3" />
                Instructor
              </span>
            )}

            {course.semester && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <Layers className="h-3 w-3 text-slate-400" />
                Sem {course.semester}
              </span>
            )}

            {v.credits ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <Award className="h-3 w-3 text-slate-400" />
                {v.credits} Cr
              </span>
            ) : null}

            {course.programme_name && (
              <span className="hidden truncate text-[11px] text-slate-500 dark:text-slate-400 md:inline-flex items-center gap-1">
                <GraduationCap className="h-3 w-3 text-slate-400" />
                {course.programme_name}
              </span>
            )}
          </div>

          <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
            {course.course_title}
          </h3>
        </div>

        {/* Middle: Artifacts Pipeline & Readiness */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden w-24 space-y-1 sm:block">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">Prep</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{readiness}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className={`h-full rounded-full ${rTheme.barColor}`}
                style={{ width: `${readiness}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1">
            {stages.map((st) => {
              const cfg = getStatusConfig(st.state, st.version);
              const hasVer = typeof st.version === "number" && st.version > 0;
              return (
                <div
                  key={st.key}
                  title={`${st.label}: ${cfg.label}${hasVer ? ` (v${st.version})` : ""}`}
                  className={`flex flex-col items-center rounded border px-1.5 py-0.5 text-center ${cfg.bg} ${cfg.border}`}
                >
                  <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300">
                    {st.shortLabel}
                  </span>
                  <span className={`text-[8px] font-semibold ${cfg.text}`}>
                    {hasVer ? `v${st.version}` : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 pl-1">
            <button
              type="button"
              onClick={handleOpenArtifacts}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500"
            >
              <span>Enter</span>
              <ArrowRight className="h-3 w-3" />
            </button>

            {isCoord && (
              <button
                type="button"
                onClick={handleOpenVersionHistory}
                title="Version History (Coordinator Only)"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <History className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid View Layout (Ultra Compact, Direct Clickable)
  return (
    <div
      onClick={() => handleOpenArtifacts()}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600"
    >
      {/* Top accent readiness line */}
      <div className="absolute inset-x-0 top-0 h-1 bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full transition-all duration-300 ${rTheme.barColor}`}
          style={{ width: `${readiness}%` }}
        />
      </div>

      <div>
        {/* Header Badges & Role */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <div className="flex flex-wrap items-center gap-1">
            <span className="inline-flex items-center rounded-md border border-indigo-200/60 bg-indigo-50/70 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
              {course.course_code}
            </span>

            {isCoord ? (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-purple-200/60 bg-purple-50/70 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300">
                <ShieldCheck className="h-2.5 w-2.5" />
                Coordinator
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-emerald-200/60 bg-emerald-50/70 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                <UserCheck className="h-2.5 w-2.5" />
                Instructor
              </span>
            )}
          </div>

          {/* Preparedness Pill */}
          <div
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${rTheme.badgeBg}`}
          >
            <Sparkles className={`h-2.5 w-2.5 ${rTheme.iconColor}`} />
            <span>{readiness}%</span>
          </div>
        </div>

        {/* Course Title */}
        <h3
          className="mt-2 line-clamp-1 text-sm font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400"
          title={`${course.course_code} - ${course.course_title}`}
        >
          {course.course_title}
        </h3>

        {/* Compact Metadata Row */}
        <div className="mt-1.5 flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1 min-w-0 truncate">
            <GraduationCap className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="truncate">{course.programme_name || course.department_name || "General"}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 font-medium">
            {course.semester && <span>Sem {course.semester}</span>}
            {v.credits ? <span>{v.credits} Cr</span> : null}
          </div>
        </div>

        {/* 5-Artifact Pipeline Snapshot */}
        <div className="mt-2.5 border-t border-slate-100 pt-2 dark:border-slate-800">
          <div className="grid grid-cols-5 gap-1">
            {stages.map((st) => {
              const cfg = getStatusConfig(st.state, st.version);
              const hasVer = typeof st.version === "number" && st.version > 0;
              return (
                <div
                  key={st.key}
                  title={`${st.label}: ${cfg.label}${hasVer ? ` (v${st.version})` : ""}`}
                  className={`flex flex-col items-center justify-between rounded border p-1 text-center ${cfg.bg} ${cfg.border}`}
                >
                  <span className="truncate text-[9px] font-bold text-slate-700 dark:text-slate-300">
                    {st.shortLabel}
                  </span>
                  <div className="mt-0.5 flex items-center gap-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    <span className={`text-[8px] font-semibold ${cfg.text}`}>
                      {hasVer ? `v${st.version}` : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-800">
        <button
          type="button"
          onClick={handleOpenArtifacts}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-1.5 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500"
        >
          <span>{isCoord ? "Manage Workspace" : "View Artifacts"}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>

        {isCoord && (
          <button
            type="button"
            onClick={handleOpenVersionHistory}
            title="Course Version History (Coordinator Only)"
            className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <History className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AssignedCourseCard;
