import { useRef, useState, useEffect, DragEvent, ChangeEvent } from "react";

interface FileUploadDropzoneProps {
  onFileSelect?: (file: File | null) => void;
  Validate?: () => void;
  loading?: boolean;
  file?: File | null;
}

const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const ACCEPT_ATTR = ".xlsx,.xls,.csv";

const FileUploadDropzone = ({
  onFileSelect,
  Validate,
  loading = false,
  file,
}: FileUploadDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(file ?? null);

  useEffect(() => {
    setSelectedFile(file ?? null);
  }, [file]);

  const handleFile = (file: File) => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) return;
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
    onFileSelect?.(null);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Section heading */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-color2 text-xs font-bold text-white">
            2
          </span>
          <h3 className="text-sm font-semibold text-[#000] dark:text-white">
            Upload Excel or CSV File <span className="text-xs  text-gray"> (Excel (.xlsx, .xls) and CSV (.csv))</span>
          </h3>
        </div>
        <button
          type="button"
          disabled={!selectedFile || loading}
          className="create-btn cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          onClick={Validate}
        >
          {loading ? "Validating..." : "Validate"}
        </button>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => !selectedFile && inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 ${
          isDragging
            ? "border-color2 bg-color2-l dark:bg-color2/10"
            : selectedFile
            ? "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/10"
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
          /* ── File selected state ── */
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
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
              className="mt-1 rounded-full border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 dark:bg-transparent dark:hover:bg-red-900/20"
            >
              Remove
            </button>
          </div>
        ) : (
          /* ── Empty / drag state ── */
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-color2-l dark:bg-color2/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-color2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 8l-4-4-4 4M12 4v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#000] dark:text-gray-200">
                Click to select or drag and drop your file
              </p>
              <p className="mt-1 text-xs text-[#000] dark:text-[#000]">
                Upload your file to validate the data before import.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadDropzone;
