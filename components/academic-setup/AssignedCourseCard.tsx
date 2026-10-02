import React from "react";
import {
  GraduationCap,
  Layers,
  ArrowRight,
  Sparkles,
  History,
  ShieldCheck,
  UserCheck,
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
  onOpenCourse?: (courseId: number) => void;
  onOpenVersionHistory?: (courseId: number) => void;
}

export const getStatusConfig = (state?: string | null, version?: number | null) => {
  if (!version && !state) {
    return {
      label: "Not Started",
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-500",
      dot: "bg-slate-400",
    };
  }
  const s = String(state || "").toLowerCase();
  if (s === "completed" || s === "approved") {
    return {
      label: "Ready",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-600 dark:text-emerald-400",
      dot: "bg-emerald-500",
    };
  }
  if (s === "processing" || s === "generating" || s === "in_progress") {
    return {
      label: "Processing",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-600 dark:text-amber-400",
      dot: "bg-amber-500",
    };
  }
  if (s === "redis_queued") {
    return {
      label: "Queued",
      bg: "bg-sky-50 dark:bg-sky-950/40",
      text: "text-sky-600 dark:text-sky-400",
      dot: "bg-sky-500",
    };
  }
  if (s === "failed") {
    return {
      label: "Failed",
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-600 dark:text-rose-400",
      dot: "bg-rose-500",
    };
  }
  return {
    label: "Draft",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
  };
};

const AssignedCourseCard: React.FC<AssignedCourseCardProps> = ({
  course,
  onOpenCourse,
  onOpenVersionHistory,
}) => {
  const router = useRouter();
  const cid = course.course_id;
  const isCoord = Boolean(course.is_coordinator);
  const readiness = course.readiness_percentage ?? 0;
  const v = course.active_versions || {};

  const handleOpenArtifacts = () => {
    if (onOpenCourse) {
      onOpenCourse(cid);
    } else {
      router.push(`/neurobe/course-artifacts?course_id=${cid}`);
    }
  };

  const handleOpenVersionHistory = () => {
    if (onOpenVersionHistory) {
      onOpenVersionHistory(cid);
    } else {
      router.push(`/neurobe/course-version-history?course_id=${cid}`);
    }
  };

  const stages = [
    {
      key: "syllabus",
      label: "Syllabus",
      version: v.syllabus_version,
      state: v.syllabus_state,
    },
    {
      key: "extraction",
      label: "Extraction",
      version: v.extraction_version,
      state: v.extraction_state,
    },
    {
      key: "copo",
      label: "CO-PO",
      version: v.copo_version,
      state: v.copo_state,
    },
    {
      key: "pedagogy",
      label: "Pedagogy",
      version: v.pedagogy_version,
      state: v.pedagogy_state,
    },
    {
      key: "lesson_plan",
      label: "Lesson Plan",
      version: v.lesson_plan_version,
      state: v.lesson_plan_state,
    },
  ];

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-800">
      <div>
        {/* Header Badges & Role Allocation */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-indigo-600/10 px-3 py-1 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
              {course.course_code}
            </span>

            {isCoord ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="h-3 w-3" />
                Coordinator
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <UserCheck className="h-3 w-3" />
                Instructor
              </span>
            )}

            {v.credits ? (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {v.credits} Credits
              </span>
            ) : null}
          </div>

          {/* Overall AI Readiness Badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>{readiness}% Prepared</span>
          </div>
        </div>

        {/* Course Title */}
        <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900 dark:text-white">
          {course.course_code} — {course.course_title}
        </h3>

        {/* Academic Metadata Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate font-medium">{course.programme_name || "General"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-medium">
              {course.semester ? `Sem ${course.semester}` : "All Terms"}
            </span>
          </div>
        </div>

        {/* 5-Artifact Pipeline Snapshot */}
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Course Artifacts</span>
            <span className="text-[10px] text-slate-400">5 Modules</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {stages.map((st) => {
              const cfg = getStatusConfig(st.state, st.version);
              const hasVer = typeof st.version === "number" && st.version > 0;
              return (
                <div
                  key={st.key}
                  title={`${st.label}: ${cfg.label}${hasVer ? ` (v${st.version})` : ""}`}
                  className={`flex flex-col items-center justify-between rounded-lg p-1.5 text-center ${cfg.bg}`}
                >
                  <span className="truncate text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {st.label}
                  </span>
                  <div className="mt-1 flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    <span className={`text-[9px] font-semibold ${cfg.text}`}>
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
      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          type="button"
          onClick={handleOpenArtifacts}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-indigo-500/25 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <span>{isCoord ? "Manage Workspace" : "View Artifacts"}</span>
          <ArrowRight className="h-4 w-4" />
        </button>

        {/* Version History Button - Course Coordinator ONLY */}
        {isCoord && (
          <button
            type="button"
            onClick={handleOpenVersionHistory}
            title="Course Version History (Coordinator Only)"
            className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-slate-800/80 dark:hover:text-indigo-400"
          >
            <History className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AssignedCourseCard;
