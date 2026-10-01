import React, { useRef, useState } from "react";
import { Upload, FileText, X, RotateCw, CheckCircle2 } from "lucide-react";

interface SyllabusUploadProps {
  isUploading: boolean;
  onUploadFile: (file: File) => Promise<void>;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SyllabusUpload: React.FC<SyllabusUploadProps> = ({
  isUploading,
  onUploadFile,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = (file: File) => {
    setErrorMsg(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg("Please upload a valid PDF document (.pdf)");
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleSelectFile(dropped);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!selectedFile || isUploading) return;
    try {
      await onUploadFile(selectedFile);
      handleClear();
    } catch (err: any) {
      setErrorMsg(typeof err === "string" ? err : err?.message || "Upload failed");
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Upload Syllabus Document
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Each upload creates a new version with the document saved for this course.
          </p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
          PDF Format Only
        </span>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-8 px-4 text-center transition-all ${
          dragging
            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20"
            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 dark:border-slate-700 dark:hover:border-indigo-600 dark:hover:bg-slate-800/50"
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
          <Upload className="h-6 w-6" />
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
          Click to choose or drag & drop your syllabus PDF
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Standard academic course syllabus with units, topics, outcomes & textbooks
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleSelectFile(f);
          }}
        />
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
          {errorMsg}
        </div>
      )}

      {/* Selected File Card & Upload CTA */}
      {selectedFile && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatSize(selectedFile.size)} • Ready to upload as new version
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleClear}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 dark:hover:bg-slate-800"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </button>

            <button
              type="button"
              disabled={isUploading}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isUploading ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Uploading Version...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Upload & Create Version</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusUpload;
