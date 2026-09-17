import React, { useState } from "react";
import {
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
} from "lucide-react";

export interface MarksAllocationRow {
  part: string;
  qNo: string;
  maxMarks: number | string;
  marksAwarded: number | string;
}

export interface AnswerSheetData {
  fileName?: string;
  studentName?: string;
  registerNo?: string;
  degreeBranch?: string;
  courseCodeTitle?: string;
  dateSession?: string;
  bookletSerialNo?: string;
  totalMarksAwarded?: string;
  marksRows?: MarksAllocationRow[];
}

export interface AnswerSheetPDFPreviewProps {
  data?: AnswerSheetData;
  className?: string;
}

const DEFAULT_MARKS_ROWS: MarksAllocationRow[] = [
  { part: "Part A", qNo: "Q1", maxMarks: 2, marksAwarded: 2 },
  { part: "Part A", qNo: "Q2", maxMarks: 2, marksAwarded: 2 },
  { part: "Part A", qNo: "Q3", maxMarks: 2, marksAwarded: 1 },
  { part: "Part A", qNo: "Q4", maxMarks: 2, marksAwarded: 2 },
  { part: "Part A", qNo: "Q5", maxMarks: 2, marksAwarded: 0.5 },
  { part: "Part B", qNo: "Q6", maxMarks: 8, marksAwarded: 7 },
  { part: "Part B", qNo: "Q7", maxMarks: 8, marksAwarded: 6 },
  { part: "Part C", qNo: "Q8", maxMarks: 24, marksAwarded: 24 },
];

export const AnswerSheetPDFPreview: React.FC<AnswerSheetPDFPreviewProps> = ({
  data,
  className = "",
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = 8;
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const fileName = data?.fileName || "CS309_CIA1_24CS1041_Ans...";
  const studentName = data?.studentName || "Sanjay Murugan";
  const registerNo = data?.registerNo || "24CS1041";
  const degreeBranch = data?.degreeBranch || "B.E. Computer Science & Engg";
  const courseCodeTitle =
    data?.courseCodeTitle || "CS309 – Computer Networks";
  const dateSession = data?.dateSession || "23–08–2026 (FN)";
  const bookletSerialNo = data?.bookletSerialNo || "VIT-CIA1-GRP_001";
  const totalMarksAwarded = data?.totalMarksAwarded || "43 / 50";
  const rows = data?.marksRows || DEFAULT_MARKS_ROWS;

  const handleZoomIn = () => setZoom((z) => Math.min(z + 15, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 15, 50));
  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div
      className={`relative flex flex-col rounded-3xl bg-[#111625] p-4 text-white shadow-xl dark:bg-[#0B0F19] sm:p-6 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none p-6" : ""
      } ${className}`}
    >
      {/* Top Toolbar Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        {/* Left: Document Title */}
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-white/70" />
          <span className="max-w-[180px] truncate text-xs font-semibold text-white sm:max-w-xs sm:text-sm">
            {fileName}
          </span>
        </div>

        {/* Center: Page Navigation */}
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-white/90">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Zoom & Fullscreen Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/90">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-0.5 text-white/70 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="min-w-[40px] text-center font-semibold">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-0.5 text-white/70 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Document Viewport */}
      <div className="no-scrollbar flex min-h-[580px] flex-1 items-center justify-center overflow-auto py-4">
        <div
          className="w-full max-w-[700px] border border-gray-200 bg-white p-6 font-sans text-gray-900 shadow-2xl transition-transform duration-200 sm:p-8"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
        >
          {/* Answer Sheet Header */}
          <div className="mb-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-3 text-xs font-bold text-gray-800">
              <span className="flex items-center gap-1 text-purple-700">
                ★ KARPAGAM
              </span>
              <span className="rounded bg-amber-500 px-1 py-0.5 text-[10px] text-white">
                A+ NAAC
              </span>
              <span className="rounded bg-blue-600 px-1 py-0.5 text-[10px] text-white">
                NBA ACCREDITED
              </span>
            </div>
            <h4 className="text-xs font-bold tracking-wide text-gray-800 uppercase sm:text-sm">
              OFFICE OF THE CONTROLLER OF EXAMINATIONS
            </h4>
            <h5 className="mt-0.5 text-xs font-bold text-gray-900 uppercase">
              CONTINUOUS INTERNAL ASSESSMENT – I (EVEN SEMESTER 2025–26)
            </h5>
          </div>

          {/* Student & Course Details Table */}
          <div className="mb-4 overflow-hidden rounded-xs border border-gray-900 text-xs">
            <div className="grid grid-cols-2 border-b border-gray-900">
              <div className="border-r border-gray-900 p-2">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">
                  REGISTER NUMBER:
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {registerNo}
                </span>
              </div>
              <div className="p-2">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">
                  STUDENT NAME:
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {studentName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 border-b border-gray-900">
              <div className="border-r border-gray-900 p-2">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">
                  DEGREE & BRANCH:
                </span>
                <span className="font-semibold text-gray-800">
                  {degreeBranch}
                </span>
              </div>
              <div className="p-2">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">
                  COURSE CODE & TITLE:
                </span>
                <span className="font-semibold text-gray-800">
                  {courseCodeTitle}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="border-r border-gray-900 p-2">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">
                  DATE & SESSION:
                </span>
                <span className="font-semibold text-gray-800">
                  {dateSession}
                </span>
              </div>
              <div className="p-2">
                <span className="block text-[10px] font-bold text-gray-500 uppercase">
                  BOOKLET SERIAL NO:
                </span>
                <span className="font-semibold text-gray-800">
                  {bookletSerialNo}
                </span>
              </div>
            </div>
          </div>

          {/* Marks Allocation Section Label */}
          <div className="mb-2 flex items-center justify-between text-[11px]">
            <span className="font-bold text-gray-800 uppercase">
              PART–WISE MARKS ALLOCATION
            </span>
            <span className="italic text-gray-400">
              (TO BE FILLED IN RED INK BY EVALUATOR)
            </span>
          </div>

          {/* Marks Allocation Table */}
          <div className="mb-4 overflow-hidden rounded-xs border border-gray-900 text-xs">
            <table className="w-full border-collapse text-center">
              <thead>
                <tr className="border-b border-gray-900 bg-gray-50 font-bold text-gray-900">
                  <th className="border-r border-gray-900 p-2 w-1/4">Part</th>
                  <th className="border-r border-gray-900 p-2 w-1/4">Q. No</th>
                  <th className="border-r border-gray-900 p-2 w-1/4">
                    Max Marks
                  </th>
                  <th className="p-2 w-1/4">Marks Awarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {rows.map((row, index) => (
                  <tr key={index} className="font-medium text-gray-800">
                    <td className="border-r border-gray-900 p-1.5">
                      {row.part}
                    </td>
                    <td className="border-r border-gray-900 p-1.5 font-bold">
                      {row.qNo}
                    </td>
                    <td className="border-r border-gray-900 p-1.5 text-gray-500">
                      {row.maxMarks}
                    </td>
                    <td className="p-1.5 font-bold text-red-600">
                      {row.marksAwarded}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Marks Box */}
          <div className="flex items-center justify-between rounded-xs border-2 border-gray-900 p-3">
            <div>
              <span className="block text-xs font-bold text-gray-900 uppercase">
                TOTAL MARKS (IN FIGURES):
              </span>
              <span className="text-[11px] italic text-gray-500">
                Total (in Words): Forty Three Marks Only
              </span>
            </div>
            <span className="text-xl font-bold text-red-600 sm:text-2xl">
              {totalMarksAwarded}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnswerSheetPDFPreview;
