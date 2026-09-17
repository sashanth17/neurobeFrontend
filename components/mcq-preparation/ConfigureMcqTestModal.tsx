import React, { useState, useEffect } from "react";
import { X, ChevronRight, Check, ArrowRight } from "lucide-react";
import CustomSelect from "@/components/FormFields/CustomSelect.component";

const UNIT_OPTIONS = [
  { value: "unit-1", label: "Unit 1: Physical Layer & Network Architectures" },
  { value: "unit-2", label: "Unit 2: Data Link Layer & MAC Protocols" },
  { value: "unit-3", label: "Unit 3: Network Layer & Routing" },
  { value: "unit-4", label: "Unit 4: Transport Layer" },
  { value: "unit-5", label: "Unit 5: Application Layer & Network Security" },
];

const TOPICS_DATA = [
  {
    id: "4.1",
    label: "4.1 Transport Layer Services, Multiplexing & Demultiplexing",
  },
  {
    id: "4.2",
    label: "4.2 TCP Segment Header & 3-Way Handshake",
  },
  {
    id: "4.3",
    label: "4.3 UDP Protocol & Socket Concepts",
  },
  {
    id: "4.4",
    label: "4.4 Congestion Control Mechanisms",
  },
];

export interface ConfigureMcqTestModalProps {
  open: boolean;
  onClose: () => void;
  onContinueToStep2?: (data: any) => void;
  mode?: "create" | "configure";
  code?: string;
  initialData?: any;
  onSubmit?: (data: any) => void;
  onSaveDraft?: (data: any) => void;
}

const ConfigureMcqTestModal: React.FC<ConfigureMcqTestModalProps> = ({
  open,
  onClose,
  onContinueToStep2,
  mode = "configure",
  code = "MCQ-CN-2026-T3",
  initialData,
  onSubmit,
  onSaveDraft,
}) => {
  const [testName, setTestName] = useState(
    "Transport Layer Reliability & Congestion Drill"
  );
  const [selectedUnit, setSelectedUnit] = useState(UNIT_OPTIONS[0]);
  const [questionCount, setQuestionCount] = useState<string | number>(3);
  const [availableApproved, setAvailableApproved] = useState<number>(7);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    "4.2",
    "4.4",
  ]);
  const [activeStep, setActiveStep] = useState<number>(1);

  const modalTitle = mode === "create" ? "Create MCQ Test" : "Configure Test";

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (initialData) {
      if (initialData.testName) setTestName(initialData.testName);
      if (initialData.code) code = initialData.code;
    }
  }, [open, initialData]);

  if (!open) return null;

  const toggleTopic = (id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    const data = {
      code,
      testName,
      unit: selectedUnit?.value,
      questionCount,
      selectedTopics,
    };
    onSubmit?.(data);
    onContinueToStep2?.(data);
    console.log("Configure Test Submitted:", data);
  };

  const handleDraft = () => {
    const data = {
      code,
      testName,
      unit: selectedUnit?.value,
      questionCount,
      selectedTopics,
      status: "draft",
    };
    onSaveDraft?.(data);
    console.log("Saved Draft:", data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-8 py-5 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#000] dark:text-white">
              {modalTitle}
            </h2>
            <span className="rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-0.5 text-xs font-semibold text-color2 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300">
              {code}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-color1 p-1 text-[#000] hover:bg-gray-100 hover:text-[#000] dark:hover:bg-gray-800 dark:hover:text-gray-200 transition"
          >
            <X className="h-4 w-4 text-pri" />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="border-b border-gray-100 bg-white px-8 py-3.5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3 text-sm font-semibold">
            {/* Step 1 */}
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${activeStep === 1
                ? "bg-[#7c3aed] text-white shadow-sm"
                : "bg-gray-100 text-pri dark:bg-gray-800 dark:text-gray-400"
                }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${activeStep === 1
                  ? "bg-white text-color2"
                  : "border border-gray-300 text-[#000] dark:border-gray-600 dark:text-gray-300"
                  }`}
              >
                1
              </span>
              <span>Step 1 — Test Details</span>
            </div>

            <ChevronRight className="h-4 w-4 text-[#000]" />

            {/* Step 2 */}
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all ${activeStep === 2
                ? "bg-[#7c3aed] text-white shadow-sm"
                : "text-pri dark:text-gray-400"
                }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs font-bold text-pri dark:border-gray-600 dark:text-gray-400">
                2
              </span>
              <span>Step 2 — Select Approved Questions</span>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div
          className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
          style={{ scrollbarWidth: "none" }}
        >
          {/* Test Name Field */}
          <div>
            <label className="mb-2 block text-sm font-bold text-[#000] dark:text-gray-100">
              Test Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="Enter test name..."
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#000] outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Unit & Questions Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            {/* Unit Selection */}
            <div>
              <div className="mb-2 flex h-6 items-center">
                <label className="text-sm font-bold text-[#000] dark:text-gray-100">
                  Unit <span className="text-red-500">*</span>
                </label>
              </div>
              <CustomSelect
                options={UNIT_OPTIONS}
                value={selectedUnit}
                onChange={(val: any) => setSelectedUnit(val)}
                isSearchable={false}
                isClearable={false}
                borderRadius={14}
              />
            </div>

            {/* Question Count */}
            <div>
              <div className="mb-2 flex h-6 items-center justify-between">
                <label className="text-sm font-bold text-[#000] dark:text-gray-100">
                  Number of Questions <span className="text-red-500">*</span>
                </label>
                <span className="text-sm font-semibold text-color2 dark:text-purple-400">
                  Available Approved Questions: {availableApproved}
                </span>
              </div>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                min={1}
                max={availableApproved}
                className="h-[38px] w-full rounded-[14px] border border-gray-200 bg-white px-4 text-sm font-semibold text-[#000] outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Topics Selection Grid */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <label className="text-sm font-bold text-[#000] dark:text-gray-100">
                Topics <span className="text-red-500">*</span>
              </label>
              <span className="text-sm font-semibold text-color2 dark:text-purple-400">
                {selectedTopics.length} of {TOPICS_DATA.length} Selected (Multiple selection allowed)
              </span>
            </div>

            {/* Container for Topic Cards */}
            <div className="rounded-2xl border border-gray-100 bg-[#f8fafc] p-4 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {TOPICS_DATA.map((topic) => {
                  const isChecked = selectedTopics.includes(topic.id);
                  return (
                    <div
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border px-4 py-3.5 transition-all ${isChecked
                        ? "border-[#ddd6fe] bg-[#f5f3ff] text-color2 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300"
                        : "border-gray-200 bg-white text-[#000] hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                    >
                      {/* Checkbox */}
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${isChecked
                          ? "border-[#7c3aed] bg-[#7c3aed] text-white"
                          : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700"
                          }`}
                      >
                        {isChecked && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                      </span>

                      <span className="text-sm font-semibold leading-snug">
                        {topic.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex shrink-0 items-center justify-between border-t border-gray-100 px-8 py-4 bg-white rounded-b-2xl dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[#000] hover:text-[#000] dark:text-gray-400 dark:hover:text-white transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDraft}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#000] shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleContinue}
              className="flex items-center gap-2 rounded-xl bg-[#7c3aed] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#6d28d9] transition"
            >
              Continue to Select Questions
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigureMcqTestModal;
