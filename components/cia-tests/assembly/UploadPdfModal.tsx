import React, { useState } from "react";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface UploadPdfModalProps {
  isOpen: boolean;
  uploading: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<any>;
}

export const UploadPdfModal: React.FC<UploadPdfModalProps> = ({
  isOpen,
  uploading,
  onClose,
  onUpload,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [successResult, setSuccessResult] = useState<{ file_url: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setErrorMessage("Please select a valid PDF file.");
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
      setSuccessResult(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    try {
      const res = await onUpload(selectedFile);
      setSuccessResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload question paper PDF");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Store Final Question Paper PDF
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Feedback */}
        {successResult ? (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Upload Completed
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Question paper PDF has been archived in MinIO storage.
            </p>
            {successResult.file_url && (
              <a
                href={successResult.file_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-xs font-bold text-purple-600 hover:underline"
              >
                View Stored PDF Document
              </a>
            )}
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow hover:bg-purple-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <p className="text-gray-500 dark:text-gray-400">
              Upload the finalized, formatted, or signed question paper PDF for archiving and printing distribution.
            </p>

            {errorMessage && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 py-8 cursor-pointer hover:border-purple-500 dark:border-gray-600 transition-colors">
              <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
              <span className="font-bold text-gray-700 dark:text-gray-300">
                {selectedFile ? selectedFile.name : "Click to browse question paper PDF"}
              </span>
              <span className="text-[11px] text-gray-400 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                  : "PDF format up to 25MB"}
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="rounded-xl border border-gray-200 px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadSubmit}
                disabled={!selectedFile || uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2 font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading to MinIO...</span>
                  </>
                ) : (
                  <span>Upload PDF</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadPdfModal;
