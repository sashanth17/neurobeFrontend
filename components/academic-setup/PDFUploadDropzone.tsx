import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { FileText, X } from "lucide-react";

interface PDFUploadDropzoneProps {
  onFileSelect?: (file: File) => void;
  label?: string;
  existingFileUrl?: string | null;
}

const ACCEPTED_EXTENSIONS = [".pdf"];
const ACCEPT_ATTR = ".pdf";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const PDFUploadDropzone = ({ 
  onFileSelect, 
  label = "Upload PDF Syllabus",
  existingFileUrl = null,
}: PDFUploadDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // derive display name from the existing URL (e.g. "uploads/syllabi/57b6ac45_sample.pdf" → "57b6ac45_sample.pdf")
  const existingFileName = existingFileUrl
    ? existingFileUrl.split("/").pop() || existingFileUrl
    : null;

  const handleFile = (file: File) => {
    setError(null);
    
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setError("Only PDF files are allowed");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File size must be less than 10 MB (current: ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      return;
    }

    setSelectedFile(file);
    onFileSelect?.(file);
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
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div>
      {/* Label */}
      <p className="mb-2 text-sm font-semibold text-[#000] dark:text-gray-300">
        {label}
      </p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors duration-200 ${
          isDragging
            ? "border-color2 bg-color2-l dark:bg-color2/10"
            : selectedFile || existingFileName
            ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/10"
            : error
            ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-900/10"
            : "border-gray-300 bg-gray-50 hover:border-color2 hover:bg-color2-l dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-color2"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={onInputChange}
        />

        {selectedFile ? (
          /* ── New file selected ── */
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#000] dark:text-white">
                {selectedFile.name}
              </p>
              <p className="mt-0.5 text-xs text-[#000] dark:text-[#000]">
                {(selectedFile.size / 1024).toFixed(1)} KB · Click to replace
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="mt-1 flex items-center gap-1 rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:bg-transparent dark:hover:bg-red-900/20"
            >
              <X className="h-3 w-3" />
              Remove
            </button>
          </div>
        ) : existingFileName ? (
          /* ── Existing file from server ── */
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#000] dark:text-white">
                {existingFileName}
              </p>
              <p className="mt-0.5 text-xs text-[#000] dark:text-[#000]">
                Click to replace
              </p>
            </div>
          </div>
        ) : error ? (
          /* ── Error state ── */
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                {error}
              </p>
              <p className="mt-1 text-xs text-[#000] dark:text-[#000]">
                Click to try again
              </p>
            </div>
          </div>
        ) : (
          /* ── Empty / drag state ── */
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-color2-l dark:bg-color2/20">
              <FileText className="h-6 w-6 text-color2" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#000] dark:text-gray-200">
                Click to select or drag and drop your PDF
              </p>
              <p className="mt-1 text-xs text-[#000] dark:text-[#000]">
                PDF files only, max 10 MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFUploadDropzone;
