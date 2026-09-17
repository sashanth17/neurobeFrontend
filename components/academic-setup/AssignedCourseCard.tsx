import React from "react";
import { GraduationCap, Calendar, Layers, User, ArrowRight } from "lucide-react";

export interface AssignedCourseCardProps {
  code: string;
  title: string;
  programme: string;
  batch: string;
  semester: string | number;
  enrolledStudents: string | number;
  allocation?: string;
  onOpenCourse?: () => void;
}

const AssignedCourseCard: React.FC<AssignedCourseCardProps> = ({
  code,
  title,
  programme,
  batch,
  semester,
  enrolledStudents,
  allocation,
  onOpenCourse,
}) => {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-lg bg-[#5C28CA] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm">
            {code}
          </span>
          {allocation && (
            <span className="inline-flex items-center rounded-lg bg-color2-l px-3 py-1.5 text-xs font-semibold text-color2">
              {allocation}
            </span>
          )}
        </div>

        {/* Card Title using sec-heading */}
        <h3 className="font-bold text-lg my-4 text-[#000] dark:text-white">
          {code} — {title}
        </h3>

        {/* Metadata Details */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-pri text-pri dark:text-gray-400">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>Programme:</span>
            </div>
            <span className="font-semibold text-[#000] dark:text-white">
              {programme}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-pri text-pri dark:text-gray-400">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>Batch:</span>
            </div>
            <span className="font-semibold text-[#000] dark:text-white">
              {batch}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-pri text-pri dark:text-gray-400">
              <Layers className="h-4 w-4 shrink-0" />
              <span>Semester:</span>
            </div>
            <span className="font-semibold text-[#000] dark:text-white">
              {semester}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-pri text-pri dark:text-gray-400">
              <User className="h-4 w-4 shrink-0" />
              <span>Enrolled Students:</span>
            </div>
            <span className="font-semibold text-[#000] dark:text-white">
              {enrolledStudents}
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={onOpenCourse}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5C28CA] py-3 text-md font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#4c1fa8] active:scale-[0.99]"
      >
        <span className="font-bold">Open Course</span>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default AssignedCourseCard;
