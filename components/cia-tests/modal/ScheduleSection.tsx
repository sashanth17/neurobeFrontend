import React from "react";
import { CreateCIATestPayload } from "@/types/cia-test.types";

interface ScheduleSectionProps {
  formData: CreateCIATestPayload;
  formErrors: Record<string, string>;
  onChange: (field: keyof CreateCIATestPayload, val: any) => void;
}

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  formData,
  formErrors,
  onChange,
}) => {
  return (
    <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-700">
      <h4
        className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
        3. Schedule & Scoring Parameters
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Test Date */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Exam Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={formData.test_date || ""}
            onChange={(e) => onChange("test_date", e.target.value)}
            className={`w-full rounded-xl border px-3 py-2 text-xs text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:bg-gray-800 dark:text-gray-200 ${formErrors.test_date
                ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
                : "border-gray-200 bg-white dark:border-gray-700"
              }`}
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Start Time
          </label>
          <input
            type="text"
            value={formData.start_time || "09:30 AM"}
            onChange={(e) => onChange("start_time", e.target.value)}
            placeholder="09:30 AM"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            End Time
          </label>
          <input
            type="text"
            value={formData.end_time || "11:00 AM"}
            onChange={(e) => onChange("end_time", e.target.value)}
            placeholder="11:00 AM"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Duration (Mins) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={15}
            max={300}
            value={formData.duration_minutes || 90}
            onChange={(e) => onChange("duration_minutes", Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Max Marks (Dynamic - Derived from Template) */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
            <span>Maximum Marks</span>
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
              * Decided automatically by assigned Template
            </span>
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center justify-between rounded-xl border border-purple-200 bg-purple-50/60 px-4 py-2 text-xs font-bold text-purple-900 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              <span>Total Maximum Score:</span>
              <span className="text-sm font-extrabold text-purple-700 dark:text-purple-200">
                {formData.max_marks || 50} Marks
              </span>
            </div>
            <input
              type="hidden"
              value={formData.max_marks || 50}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleSection;
