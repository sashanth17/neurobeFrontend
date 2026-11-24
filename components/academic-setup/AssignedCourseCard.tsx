import React from "react";
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Building2,
  Users,
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
  // Appended fields
  is_active?: boolean;
  status?: string;
  no_of_classrooms?: number;
  no_of_instructors?: number;
  total_students_enrolled?: number;
}

export interface AssignedCourseCardProps {
  course: AssignedCourseItem;
  viewMode?: "grid" | "list";
  onOpenCourse?: (courseId: number) => void;
}

const AssignedCourseCard: React.FC<AssignedCourseCardProps> = ({
  course,
  viewMode = "grid",
  onOpenCourse,
}) => {
  const router = useRouter();
  const cid = course.course_id;
  const isCoord = Boolean(course.is_coordinator);
  const isActive = course.is_active !== false && course.status !== "Inactive";

  const classroomsCount = course.no_of_classrooms ?? 0;
  const instructorsCount = course.no_of_instructors ?? 0;
  const studentsCount = course.total_students_enrolled ?? 0;

  const handleOpenArtifacts = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onOpenCourse) {
      onOpenCourse(cid);
    } else {
      router.push(`/neurobe/course-artifacts?course_id=${cid}`);
    }
  };

  // Status Badge Component
  const StatusBadge = () => (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
        isActive
          ? "border border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );

  // List View Layout
  if (viewMode === "list") {
    return (
      <div
        onClick={() => handleOpenArtifacts()}
        className="group relative flex cursor-pointer flex-col justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition-all duration-150 hover:border-indigo-400 hover:bg-slate-50/50 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-600 sm:flex-row sm:items-center"
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

            <StatusBadge />
          </div>

          <h3 className="truncate text-sm font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
            {course.course_title}
          </h3>
        </div>

        {/* Middle: 3 Required Metrics Only */}
        <div className="flex items-center gap-4 shrink-0 sm:gap-6">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Building2 className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Classrooms:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{classroomsCount}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Instructors:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{instructorsCount}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400">Students:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100">{studentsCount}</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleOpenArtifacts}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500"
            >
              <span>Enter</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View Layout
  return (
    <div
      onClick={() => handleOpenArtifacts()}
      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-600"
    >
      <div>
        {/* Header: Course Code, Role & Active Status */}
        <div className="flex items-center justify-between gap-2">
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
          </div>

          <StatusBadge />
        </div>

        {/* Course Title */}
        <h3
          className="mt-3 line-clamp-2 text-sm font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 min-h-[2.5rem]"
          title={`${course.course_code} - ${course.course_title}`}
        >
          {course.course_title}
        </h3>

        {/* 3 Metrics: Classrooms, Instructors, Total Students Enrolled */}
        <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-850/50">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-medium text-slate-400">Classrooms</span>
            <span className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-100">
              {classroomsCount}
            </span>
          </div>
          <div className="flex flex-col items-center border-x border-slate-200/60 px-1 text-center dark:border-slate-700/60">
            <span className="text-[10px] font-medium text-slate-400">Instructors</span>
            <span className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-100">
              {instructorsCount}
            </span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-medium text-slate-400">Students</span>
            <span className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-100">
              {studentsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3.5 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 dark:border-slate-800">
        <button
          type="button"
          onClick={handleOpenArtifacts}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-1.5 px-3 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500"
        >
          <span>{isCoord ? "Manage Workspace" : "View Artifacts"}</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

export default AssignedCourseCard;
