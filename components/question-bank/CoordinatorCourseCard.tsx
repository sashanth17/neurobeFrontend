import React from "react";
import { BookOpen, Users, FileText, ArrowRight, Layers, Award } from "lucide-react";
import { CoordinatorCourse } from "@/hook/useCoordinatorCourses";

interface CoordinatorCourseCardProps {
  course: CoordinatorCourse;
  onSelect: (course: CoordinatorCourse) => void;
}

export const CoordinatorCourseCard: React.FC<CoordinatorCourseCardProps> = ({
  course,
  onSelect,
}) => {
  const code = course.course_code || course.code || "COURSE";
  const title = course.course_title || course.title || course.name || "Untitled Course";
  const programme = course.programme || course.degree || "Computer Science & Engineering";
  const semester = course.semester ? `Semester ${course.semester}` : "Current Semester";
  const year = course.year ? `Year ${course.year}` : "";
  const academicYear = course.academic_year || "2026-2027";
  const sectionsCount = course.sections_count || course.total_sections || course.instances_count || 2;
  const enrolledCount = course.enrolled_students_count || course.total_students || 120;
  const activeTestsCount = course.active_tests_count !== undefined ? course.active_tests_count : 2;

  return (
    <div
      onClick={() => onSelect(course)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-500 cursor-pointer"
    >
      {/* Top Accent Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity" />

      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700">
              {code}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {semester} {year && `• ${year}`}
            </span>
          </div>

          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500">
            {academicYear}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400 transition-colors line-clamp-2 mb-1">
          {title}
        </h3>

        {/* Programme */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 flex items-center gap-1.5">
          <Award className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
          <span className="truncate">{programme}</span>
        </p>

        {/* Metadata & Statistics Chips */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-750">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 flex-shrink-0">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Sections</p>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {sectionsCount} Sec • {enrolledCount} Std
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 p-2.5 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-750">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 flex-shrink-0">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Assessments</p>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {activeTestsCount} CIA Tests
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-0.5 transition-transform">
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Open Question Bank & Tests
        </span>
        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
};

export default CoordinatorCourseCard;
