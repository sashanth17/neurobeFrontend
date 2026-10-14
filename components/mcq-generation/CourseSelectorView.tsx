import React from "react";
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  Search,
  Layers,
  GraduationCap,
  Calendar,
  User,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import { CourseItem } from "./types";

interface CourseSelectorViewProps {
  courses: CourseItem[];
  filteredCourses: CourseItem[];
  loading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  roleFilter: "all" | "coordinator" | "instructor";
  onRoleFilterChange: (role: "all" | "coordinator" | "instructor") => void;
  onManageQuestions: (course: CourseItem) => void;
}

export const CourseSelectorView: React.FC<CourseSelectorViewProps> = ({
  courses,
  filteredCourses,
  loading,
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  onManageQuestions,
}) => {
  const coordinatorCount = courses.filter((c) => c.role_type === "coordinator").length;
  const instructorCount = courses.filter((c) => c.role_type !== "coordinator").length;
  const totalQuestions = courses.reduce((acc, c) => acc + (c.questions_count || 0), 0);

  return (
    <div className="space-y-3">
      {/* Header & Page Title - Compact Single Line (Consistent with my-assigned-courses) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            MCQ Management
          </h1>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
            {courses.length} Courses
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <Sparkles className="h-3 w-3 text-emerald-500" />
            {totalQuestions} Pool Questions
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select a course to generate and review AI-aligned questions
        </p>
      </div>

      {/* Unified Compact Control Bar (Role Tabs + Search in ONE Sleek Row) */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        {/* Left: Role Filter Tabs with Metric Badges */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => onRoleFilterChange("all")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              roleFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>All Courses</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                roleFilter === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              {courses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onRoleFilterChange("coordinator")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              roleFilter === "coordinator"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Coordinated</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                roleFilter === "coordinator"
                  ? "bg-white/20 text-white"
                  : "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
              }`}
            >
              {coordinatorCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onRoleFilterChange("instructor")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
              roleFilter === "instructor"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Instructor</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                roleFilter === "instructor"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
              }`}
            >
              {instructorCount}
            </span>
          </button>
        </div>

        {/* Right: Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search code or title..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-7 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Course Cards Grid - High density, space optimized */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40"
            />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">No assigned courses found.</p>
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onRoleFilterChange("all");
            }}
            className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const code = course.code || course.course_code || "";
            const title = course.title || course.course_title || "";
            const isCoordinator = course.role_type === "coordinator";
            const totalQ = course.questions_count ?? 0;
            const approvedQ = course.approved_questions_count ?? 0;
            const pct = totalQ > 0 ? Math.round((approvedQ / totalQ) * 100) : 0;
            const studentCount =
              course.students_count ??
              course.student_count ??
              course.enrolled_students_count ??
              course.enrolled_count ??
              0;

            return (
              <div
                key={course.id}
                className="group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xs transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {code}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          isCoordinator
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        }`}
                      >
                        {isCoordinator ? "Coordinator" : "Instructor"}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Sparkles className="h-2.5 w-2.5 text-indigo-500" />
                      <span>AI Ready</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-2 text-sm font-bold tracking-tight text-slate-900 line-clamp-1 dark:text-white" title={title}>
                    {title}
                  </h3>

                  {/* Info grid */}
                  <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-lg bg-slate-50/80 p-2 text-[11px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <div className="flex items-center gap-1 truncate">
                      <GraduationCap className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">{course.programme || "UG"}</span>
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <Calendar className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">Batch {course.batch || "2024"}</span>
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <Layers className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">{course.semester || "Sem"}</span>
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <User className="h-3 w-3 shrink-0 text-slate-400" />
                      <span className="truncate">{studentCount} Students</span>
                    </div>
                  </div>

                  {/* Question Pool Progress */}
                  <div className="mt-2 rounded-lg border border-slate-100 bg-indigo-50/30 p-2 dark:border-slate-800 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">MCQ Pool</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalQ} Qs ({approvedQ} Approved)</span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Manage Questions Button */}
                <button
                  type="button"
                  onClick={() => onManageQuestions(course)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-color1 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-color1/90 active:scale-[0.98]"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Manage Questions</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseSelectorView;
