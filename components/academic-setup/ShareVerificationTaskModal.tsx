import React, { useState } from "react";
import { ModalShell } from "@/components/academic-setup/AddModals";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import TextInput from "@/components/FormFields/TextInput.component";

export interface StudentSelectionItem {
  id: string;
  name: string;
  code: string;
}

export interface ShareVerificationTaskModalProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (data?: any) => void;
  courseName?: string;
  assessmentName?: string;
}

const LINK_VALIDITY_OPTIONS = [
  { value: "1 Day", label: "1 Day" },
  { value: "3 Days", label: "3 Days" },
  { value: "7 Days", label: "7 Days" },
  { value: "14 Days", label: "14 Days" },
  { value: "30 Days", label: "30 Days" },
];

const DEFAULT_STUDENTS: StudentSelectionItem[] = [
  { id: "1", name: "Sanjay Murugan", code: "24CS1041" },
  { id: "2", name: "Kavin Raj", code: "24CS1042" },
  { id: "3", name: "Deepika Sundaram", code: "24CS1044" },
  { id: "4", name: "Arun Balaji", code: "24CS1045" },
];

export const ShareVerificationTaskModal: React.FC<
  ShareVerificationTaskModalProps
> = ({
  open,
  onClose,
  onGenerate,
  courseName = "CS309 — Computer Networks",
  assessmentName = "CIA-1",
}) => {
    const [reviewMode, setReviewMode] = useState<"all" | "select">("all");
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([
      "1",
      "2",
    ]);
    const [linkValidity, setLinkValidity] = useState<{
      value: string;
      label: string;
    } | null>({ value: "3 Days", label: "3 Days" });
    const [linkLimit, setLinkLimit] = useState("10");

    const toggleStudent = (id: string) => {
      setSelectedStudentIds((prev) =>
        prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
      );
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onGenerate({
        course: courseName,
        assessment: assessmentName,
        reviewMode,
        selectedStudentIds,
        linkValidity: linkValidity?.value ?? "3 Days",
        linkLimit,
      });
    };

    return (
      <ModalShell
        title="Share Verification Task"
        open={open}
        onClose={onClose}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Course */}
          <TextInput
            title="Course"
            value={courseName}
            disabled
            onChange={() => { }}
          />

          {/* Assessment */}
          <TextInput
            title="Assessment"
            value={assessmentName}
            disabled
            onChange={() => { }}
          />

          {/* Students to Review */}
          <div>
            <label className="mb-1.5 block text-sm font-bold text-[#000] mb-1 dark:text-gray-300">
              Students to Review
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Card 1: All Pending Students */}
              <div
                onClick={() => setReviewMode("all")}
                className={`cursor-pointer rounded-xl p-4 transition-all ${reviewMode === "all"
                  ? "border-2 border-[#7C3AED] bg-[#F5F3FF] dark:bg-purple-950/30"
                  : "border border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  }`}
              >
                <h4
                  className={`text-sm font-bold ${reviewMode === "all"
                    ? "text-[#7C3AED] dark:text-purple-300"
                    : "text-gray-900 dark:text-white"
                    }`}
                >
                  All Pending Students
                </h4>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  21 students awaiting review
                </p>
              </div>

              {/* Card 2: Select Students */}
              <div
                onClick={() => setReviewMode("select")}
                className={`cursor-pointer rounded-xl p-4 transition-all ${reviewMode === "select"
                  ? "border-2 border-[#7C3AED] bg-[#F5F3FF] dark:bg-purple-950/30"
                  : "border border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                  }`}
              >
                <h4
                  className={`text-sm font-bold ${reviewMode === "select"
                    ? "text-[#7C3AED] dark:text-purple-300"
                    : "text-gray-900 dark:text-white"
                    }`}
                >
                  Select Students
                </h4>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {selectedStudentIds.length} selected
                </p>
              </div>
            </div>
          </div>

          {/* Student Checklist Section (Visible when Select Students is active) */}
          {reviewMode === "select" && (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {DEFAULT_STUDENTS.map((student) => {
                  const isChecked = selectedStudentIds.includes(student.id);
                  return (
                    <div
                      key={student.id}
                      onClick={() => toggleStudent(student.id)}
                      className="flex cursor-pointer items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${isChecked
                            ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                            : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                            }`}
                        >
                          {isChecked && (
                            <svg
                              className="h-3.5 w-3.5 stroke-current"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="3"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.name}
                        </span>
                      </div>
                      <span className="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                        {student.code}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Link Valid For */}
          <div>
            <CustomSelect
              title="Link Valid For"
              options={LINK_VALIDITY_OPTIONS}
              value={linkValidity}
              onChange={(selected: any) => setLinkValidity(selected)}
              placeholder="Select validity duration"
              isClearable={false}
              isSearchable={false}
            />
          </div>

          {/* Link Use Limit (Optional) */}
          <div>
            <TextInput
              title="Link Use Limit (Optional)"
              value={linkLimit}
              onChange={(e) => setLinkLimit(e.target.value)}
              placeholder="10"
            />
            <p className="mt-1 text-xs text-pri dark:text-gray-400">
              Maximum number of times this secure link can be used.
            </p>
          </div>

          {/* Sticky Fixed Footer Button */}
          <div className="sticky -bottom-5 -mx-6 -mb-5 z-10 bg-white px-6 pb-5 pt-3 border-t border-gray-100 shadow-xs dark:border-gray-800 dark:bg-gray-900">
            <button
              type="submit"
              className="create-btn !w-full items-center !justify-center font-bold p-3"
            >
              Generate Secure Link &amp; Code
            </button>
          </div>
        </form>
      </ModalShell>
    );
  };

export default ShareVerificationTaskModal;
