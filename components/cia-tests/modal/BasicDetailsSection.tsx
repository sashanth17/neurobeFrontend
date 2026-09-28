import React from "react";
import { CreateCIATestPayload } from "@/types/cia-test.types";

interface BasicDetailsSectionProps {
  courseCode: string;
  formData: CreateCIATestPayload;
  formErrors: Record<string, string>;
  onChange: (field: keyof CreateCIATestPayload, val: any) => void;
}

export const BasicDetailsSection: React.FC<BasicDetailsSectionProps> = ({
  courseCode,
  formData,
  formErrors,
  onChange,
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
        1. Assessment Identity & Classification
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Course Code (Locked / Auto-set) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Course Code (Inherited)
          </label>
          <input
            type="text"
            value={courseCode || "CS301"}
            disabled
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-xs font-bold text-gray-600 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          />
        </div>

        {/* Test Type */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Test Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.test_type}
            onChange={(e) => onChange("test_type", e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="CIA">CIA (Continuous Internal Assessment)</option>
            <option value="MODEL">Model Examination</option>
            <option value="RETEST">Retest / Improvement</option>
            <option value="QUIZ">Quiz / Unit Assessment</option>
            <option value="ASSIGNMENT">Assignment Exam</option>
          </select>
        </div>

        {/* Test Name */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Assessment Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.test_name}
            onChange={(e) => onChange("test_name", e.target.value)}
            placeholder="e.g. CIA-1 Continuous Assessment 2026"
            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:bg-gray-800 dark:text-gray-200 ${
              formErrors.test_name
                ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
                : "border-gray-200 bg-white dark:border-gray-700"
            }`}
          />
          {formErrors.test_name && (
            <p className="mt-1 text-[11px] text-red-500">{formErrors.test_name}</p>
          )}
        </div>

        {/* Test Code */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Unique Exam Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.test_code}
            onChange={(e) => onChange("test_code", e.target.value)}
            placeholder="e.g. CS301-CIA1-2026"
            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:bg-gray-800 dark:text-gray-200 ${
              formErrors.test_code
                ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/20"
                : "border-gray-200 bg-white dark:border-gray-700"
            }`}
          />
          {formErrors.test_code && (
            <p className="mt-1 text-[11px] text-red-500">{formErrors.test_code}</p>
          )}
        </div>

        {/* Branch / Department */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Branch / Department <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.branch}
            onChange={(e) => onChange("branch", e.target.value)}
            placeholder="e.g. CSE, IT, ECE"
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Academic Year */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Academic Year
          </label>
          <input
            type="text"
            value={formData.academic_year}
            onChange={(e) => onChange("academic_year", e.target.value)}
            placeholder="e.g. 2026-2027"
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Year & Semester */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Year
            </label>
            <select
              value={formData.year}
              onChange={(e) => onChange("year", Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Semester
            </label>
            <select
              value={formData.semester}
              onChange={(e) => onChange("semester", Number(e.target.value))}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Sem {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicDetailsSection;
