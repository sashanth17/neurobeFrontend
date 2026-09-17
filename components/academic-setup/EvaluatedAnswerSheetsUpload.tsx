import React, { useRef, useState, DragEvent, ChangeEvent } from "react";
import { FileText } from "lucide-react";

export interface EvaluatedAnswerSheetsUploadProps {
  title?: string;
  fileName?: string;
  fileSize?: string;
  pageCount?: number | string;
  detectedBooklets?: number | string;
  description?: string;
  onFileSelect?: (file: File) => void;
  className?: string;
}

export const EvaluatedAnswerSheetsUpload: React.FC<
  EvaluatedAnswerSheetsUploadProps
> = ({
  title = "Upload Evaluated Answer Sheets",
  fileName = "CS309_CIA1_Evaluated_Answer_Sheets_Batch.pdf",
  fileSize = "18.4 MB",
  pageCount = "320 Pages",
  detectedBooklets = "40 Student Booklets Detected",
  description = "Supports one PDF containing multiple student answer sheets. The system automatically separates and groups pages into individual student booklets.",
  onFileSelect,
  className = "",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFileName, setCurrentFileName] = useState(fileName);
  const [currentFileSize, setCurrentFileSize] = useState(fileSize);

  const handleFile = (file: File) => {
    setCurrentFileName(file.name);
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    setCurrentFileSize(`${sizeInMB} MB`);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className={`mb-6 ${className}`}>
      {/* Section Header Title */}
      {title && (
        <h3 className="mb-3 text-base font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
      )}

      {/* Dashed Dropzone Box */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-all duration-200 ${
          isDragging
            ? "border-purple-500 bg-purple-100/60 dark:bg-purple-950/40"
            : "border-purple-200/80 bg-[#FAF8FE] hover:border-purple-400 hover:bg-purple-50/50 dark:border-purple-500/50 dark:bg-purple-950/10 dark:hover:border-purple-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={onInputChange}
        />

        {/* Cloud Upload Icon */}
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-purple-100/80 text-color2 dark:bg-purple-900/50 dark:text-purple-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        {/* File Name */}
        <h4 className="mb-1.5 text-base font-bold text-gray-900 dark:text-white">
          {currentFileName}
        </h4>

        {/* Description Subtitle */}
        <p className="mb-3.5 max-w-2xl text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          {description}
        </p>

        {/* Metadata Details Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          <FileText className="h-4 w-4 text-gray-400" />
          <span>{currentFileSize}</span>
          <span>•</span>
          <span>
            {typeof pageCount === "number" ? `${pageCount} Pages` : pageCount}
          </span>
          <span>•</span>
          <span className="rounded-full bg-emerald-100/90 px-3 py-1 text-xs font-bold text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-300">
            {typeof detectedBooklets === "number"
              ? `${detectedBooklets} Student Booklets Detected`
              : detectedBooklets}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EvaluatedAnswerSheetsUpload;
