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
} from "lucide-react";
import PageBanner from "@/components/common-components/PageBanner";
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
  return (
    <div>
      <PageBanner
        badges={[
          { label: "Faculty / Staff", className: "bg-[#1244cc] text-white px-3.5 py-1 font-medium" },
          {
            label: "AI Question Generation Studio",
            dot: true,
            className: "bg-[#043e2e] text-[#10b981] border border-[#065f46] px-3.5 py-1 font-medium",
          },
        ]}
        title="MCQ Question Generation"
        description="Select a course to build a dynamic question set — choose units, topics, configure Bloom's taxonomy levels and difficulty, then let AI generate aligned MCQs."
        stats={[
          { label: "ASSIGNED COURSES", value: courses.length },
          {
            label: "MCQ POOL QUESTIONS",
            value: courses.reduce((acc, c) => acc + (c.questions_count || 0), 0),
            valueColor: "text-[#10b981]",
          },
          { label: "PREPARED UNITS", value: "5 Units" },
        ]}
      />

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-white">
            <span>My Assigned Courses</span>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {filteredCourses.length} {filteredCourses.length === 1 ? "Course" : "Courses"}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Click <strong>Manage Questions</strong> on any course to enter the MCQ Generation workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search course code or title..."
              className="h-10 w-64 rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
            {(["all", "coordinator", "instructor"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => onRoleFilterChange(role)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  roleFilter === role
                    ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/40"
            />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">No assigned courses found.</p>
          <button
            type="button"
            onClick={() => {
              onSearchChange("");
              onRoleFilterChange("all");
            }}
            className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/95 dark:hover:border-indigo-700"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center rounded-lg bg-indigo-600/10 px-2.5 py-1 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                        {code}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-semibold ${
                          isCoordinator
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                        }`}
                      >
                        {isCoordinator ? "Coordinator" : "Instructor"}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Sparkles className="h-3 w-3 text-indigo-500" />
                      <span>AI Ready</span>
                    </span>
                  </div>
                  <h3 className="mt-3.5 text-base font-bold tracking-tight text-slate-900 line-clamp-1 dark:text-white">
                    {title}
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 truncate">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{course.programme}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">Batch {course.batch}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{course.semester}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{studentCount} Students</span>
                    </div>
                  </div>
                  <div className="mt-3.5 rounded-xl border border-slate-100 bg-indigo-50/40 p-3 dark:border-slate-800 dark:bg-indigo-950/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">MCQ Question Pool</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalQ} Questions</span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
                      <span>{approvedQ} Approved</span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onManageQuestions(course)}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-color1 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-color1/90 active:scale-[0.98]"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Manage Questions
                  <ArrowRight className="h-3.5 w-3.5" />
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
