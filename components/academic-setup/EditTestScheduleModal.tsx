import React, { useState, useEffect } from "react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import {
  X,
  Lock,
  Clock,
  Settings,
  Calendar as CalendarIcon,
  Copy,
  Check,
  Key,
} from "lucide-react";

// Body scroll lock hook
const useLockBodyScroll = (active: boolean) => {
  useEffect(() => {
    if (active) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);
};

// Animated visibility hook for modal open/close transitions
const useAnimatedVisibility = (open: boolean, duration = 220) => {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
    } else if (visible) {
      setClosing(true);
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, duration);
      return () => clearTimeout(t);
    }
  }, [open]);

  return { visible, closing };
};

export interface EditTestScheduleModalProps {
  open: boolean;
  onClose: () => void;
  testData?: {
    testCode?: string;
    courseCodeTitle?: string;
    testName?: string;
    unitLabel?: string;
    topics?: string;
    questionsCount?: string | number;
    duration?: string;
    testDate?: string;
    startTime?: string;
    endTime?: string;
    secureCode?: string;
  } | null;
  onSave?: (data: any) => void;
}

export const EditTestScheduleModal: React.FC<EditTestScheduleModalProps> = ({
  open,
  onClose,
  testData,
  onSave,
}) => {
  const { visible, closing } = useAnimatedVisibility(open);
  useLockBodyScroll(visible);

  // Form State
  const [testDate, setTestDate] = useState("08/09/2026");
  const [startTime, setStartTime] = useState("10:00 AM");
  const [endTime, setEndTime] = useState("11:00 AM");
  const [secureCode, setSecureCode] = useState("CN-4V9X");
  const [copied, setCopied] = useState(false);

  // Sync testData prop when opened
  useEffect(() => {
    if (testData) {
      if (testData.testDate) setTestDate(testData.testDate);
      if (testData.startTime) setStartTime(testData.startTime);
      if (testData.endTime) setEndTime(testData.endTime);
      if (testData.secureCode) setSecureCode(testData.secureCode);
    }
  }, [testData, open]);

  // Generate random passcode (e.g. CN-9X4V)
  const handleGenerateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "CN-";
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSecureCode(code);
  };

  // Copy passcode to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(secureCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        ...testData,
        testDate,
        startTime,
        endTime,
        secureCode,
      });
    }
    onClose();
  };

  if (!visible) return null;

  const code = testData?.testCode || "MCQ-CN-2026-T2";
  const course = testData?.courseCodeTitle || "CS309 — Computer Networks";
  const name = testData?.testName || "Data Link Layer MCQ Test";
  const unit = testData?.unitLabel || "Unit 2: Data Link Layer";
  const topics =
    testData?.topics ||
    "2.2 Error Detection (CRC, Checksum, Parity) & Error Correction; 2.3 ARQ Protocols (Stop-and-Wait, Go-Back-N, Selective Repeat)";
  const questionsCount = testData?.questionsCount || "5 Questions";
  const duration = testData?.duration || "30 Minutes";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{
        animation: closing
          ? "fadeOut 0.22s ease forwards"
          : "fadeIn 0.22s ease",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
        style={{
          animation: closing
            ? "slideDown 0.22s ease forwards"
            : "slideUp 0.22s ease",
        }}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-xl font-bold text-[#000] dark:text-white">
              Edit Test Schedule & Access
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-pri dark:text-gray-400">
              <span className="text-[#6D28D9] dark:text-purple-400 font-bold">
                {code}
              </span>{" "}
              • {course}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-[#000] hover:bg-gray-100 hover:text-[#000] dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="max-h-[78vh] overflow-y-auto p-4 space-y-6">
          {/* SECTION 1: READ-ONLY COORDINATOR DETAILS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pri dark:text-gray-400">
                <Lock className="h-3.5 w-3.5" />
                <span>READ-ONLY COORDINATOR DETAILS</span>
              </div>
              <span className="rounded-md bg-[#F3E8FF] px-2.5 py-1 text-xs font-bold text-[#7E22CE] dark:bg-purple-950/60 dark:text-purple-300">
                {code}
              </span>
            </div>

            {/* Readonly Metadata Rows */}
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-[#F9FAFB]/60 px-4 text-xs md:text-sm dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-800/40">
              <div className="grid grid-cols-3 py-3 items-center">
                <span className="text-pri dark:text-gray-400 font-medium">
                  Test Name
                </span>
                <span className="col-span-2 font-bold text-[#000] dark:text-white">
                  {name}
                </span>
              </div>

              <div className="grid grid-cols-3 py-3 items-center">
                <span className="text-pri dark:text-gray-400 font-medium">
                  Unit
                </span>
                <span className="col-span-2 font-bold text-[#000] dark:text-white">
                  {unit}
                </span>
              </div>

              <div className="grid grid-cols-3 py-3 items-start">
                <span className="text-pri dark:text-gray-400 font-medium pt-0.5">
                  Topics
                </span>
                <span className="col-span-2 font-bold text-[#000] dark:text-white leading-relaxed">
                  {topics}
                </span>
              </div>

              <div className="grid grid-cols-3 py-3 items-center">
                <span className="text-pri dark:text-gray-400 font-medium">
                  Question Count
                </span>
                <span className="col-span-2 font-bold text-[#000] dark:text-white">
                  {questionsCount}
                </span>
              </div>

              <div className="grid grid-cols-3 py-3 items-center">
                <span className="text-pri dark:text-gray-400 font-medium">
                  Test Duration
                </span>
                <div className="col-span-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-color2-l px-3 py-1 text-xs  text-color2 dark:bg-purple-950/60 dark:text-purple-300">
                    <Clock className="h-3.5 w-3.5 font-bold" />
                    <span className="font-bold">{duration}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: INSTRUCTOR EXECUTION SETTINGS */}
          <div className="space-y-4 pt-1">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#7E22CE] dark:text-purple-400">
                <Settings className="h-4 w-4 text-sm font-bold" />
                <span className="text-sm font-bold">INSTRUCTOR EXECUTION SETTINGS</span>
              </div>
              <p className="mt-1 text-md text-pri dark:text-gray-400">
                Configure the test schedule and generate the secure entry
                passcode for students.
              </p>
            </div>

            {/* Test Date */}
            <div className="">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-sm dark:text-white">
                  Test Date <span className="text-red-500">*</span>
                </label>
                <span className="text-pri text-xs">
                  Date students will attempt the test
                </span>
              </div>
              <div className="relative">
                <Flatpickr
                  value={testDate}
                  options={{
                    dateFormat: "d/m/Y",
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#000] shadow-2xs focus:border-[#6D28D9] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                  onChange={(_, dateStr) => setTestDate(dateStr)}
                />
                <CalendarIcon className="absolute right-3.5 top-3 h-4 w-4 text-[#000] pointer-events-none" />
              </div>
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Start Time */}
              <div className="space-y-1.5">
                <label className="font-bold text-sm dark:text-white">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Flatpickr
                    value={startTime}
                    options={{
                      noCalendar: true,
                      enableTime: true,
                      dateFormat: "h:i K",
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#000] shadow-2xs focus:border-[#6D28D9] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                    onChange={(_, dateStr) => setStartTime(dateStr)}
                  />
                  <Clock className="absolute right-3.5 top-3 h-4 w-4 text-[#000] pointer-events-none" />
                </div>
              </div>

              {/* End Time */}
              <div className="space-y-1.5">
                <label className="font-bold text-sm dark:text-white">
                  End Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Flatpickr
                    value={endTime}
                    options={{
                      noCalendar: true,
                      enableTime: true,
                      dateFormat: "h:i K",
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#000] shadow-2xs focus:border-[#6D28D9] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                    onChange={(_, dateStr) => setEndTime(dateStr)}
                  />
                  <Clock className="absolute right-3.5 top-3 h-4 w-4 text-[#000] pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Secure Test Code */}
            <div className="">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-sm dark:text-white">
                  Secure Test Code <span className="text-red-500">*</span>
                </label>
                <span className="text-pri text-xs">
                  Student authorization passcode
                </span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
                {/* Input box */}
                <div className="relative flex-1">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-[#000]" />
                  <input
                    type="text"
                    value={secureCode}
                    onChange={(e) => setSecureCode(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm font-bold text-[#000] shadow-2xs focus:border-[#6D28D9] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="CN-XXXX"
                  />
                </div>

                {/* Generate Button */}
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="rounded-xl bg-color2-l px-4 py-2 text-md font-bold text-color2 shadow-2xs hover:bg-[#E9D5FF] active:scale-[0.99] transition-all dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60"
                >
                  Generate Code
                </button>

                {/* Copy Button */}
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5  rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-bold text-[#000] shadow-2xs hover:bg-gray-100 active:scale-[0.99] transition-all dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-pri" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              <span className="text-pri text-xs">
                Students must enter this passcode to launch the test during the
                scheduled window.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[#000] hover:text-[#000] dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#5B21B6] active:scale-[0.99] transition-all dark:bg-purple-600 dark:hover:bg-purple-700"
          >
            <Check className="h-4 w-4" />
            <span>Save Test Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTestScheduleModal;
