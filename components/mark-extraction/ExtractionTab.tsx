import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, ArrowRight, X } from 'lucide-react';
import { MarkExtractionService } from '@/services/markExtraction.service';
import { useExtractionProgress } from '@/hooks/useExtractionProgress';

interface ExtractionTabProps {
  ciaTestId:          number;
  initialStatus?:     string | null;
  initialJobId?:      number | null;
  onGoToExtractedView: () => void;
}

export default function ExtractionTab({
  ciaTestId,
  initialStatus,
  initialJobId,
  onGoToExtractedView,
}: ExtractionTabProps) {
  const [file,       setFile]       = useState<File | null>(null);
  const [dragOver,   setDragOver]   = useState(false);
  const [batchId,    setBatchId]    = useState<number | null>(null);
  const [jobId,      setJobId]      = useState<number | null>(initialJobId ?? null);
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState<string | null>(null);
  const [extractErr, setExtractErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { progress, status, processedPages, totalPages } = useExtractionProgress(jobId, () => {});

  // Determine effective status: prefer live-polled status over initial
  const effectiveStatus = jobId ? status : (initialStatus ?? null);

  // Can we show the upload zone?
  const canUpload = !effectiveStatus
    || effectiveStatus === "FAILED"
    || effectiveStatus === "COMPLETED";

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setUploadErr(null);
    } else {
      setUploadErr("Only PDF files are accepted");
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) { setFile(selected); setUploadErr(null); }
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadErr(null);
    try {
      const batch = await MarkExtractionService.uploadAnswerSheetBatch(ciaTestId, file);
      // API returns { batch_id: number }
      setBatchId(batch.batch_id);
    } catch (err: any) {
      setUploadErr(err?.response?.data?.detail ?? err?.message ?? "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async () => {
    if (!batchId) return;
    setExtractErr(null);
    try {
      const job = await MarkExtractionService.triggerExtraction(batchId);
      setJobId(job.job_id);
    } catch (err: any) {
      setExtractErr(err?.response?.data?.detail ?? err?.message ?? "Failed to start extraction");
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setBatchId(null);
    setUploadErr(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Answer Sheet Extraction</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload scanned answer sheets and extract marks using AI
          </p>
        </div>
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full">
          CIA Test ID: {ciaTestId}
        </span>
      </div>

      {/* ── COMPLETED STATE ────────────────────────────────────────────────── */}
      {effectiveStatus === "COMPLETED" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Extraction Complete</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            {totalPages > 0 ? `Processed ${totalPages} pages successfully` : "All answer sheets have been processed"}
          </p>
          <button
            onClick={onGoToExtractedView}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            View Extracted Marks
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setJobId(null); setBatchId(null); setFile(null); }}
            className="mt-3 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 underline"
          >
            Upload new batch
          </button>
        </div>

      /* ── PROCESSING STATE ───────────────────────────────────────────────── */
      ) : effectiveStatus === "PROCESSING" || effectiveStatus === "PENDING" ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-full max-w-md">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                Extracting marks...
              </span>
              <span className="text-violet-600 dark:text-violet-400">{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Processing pages...</span>
              <span>{processedPages} / {totalPages} pages</span>
            </div>
          </div>
        </div>

      /* ── UPLOAD STATE ───────────────────────────────────────────────────── */
      ) : canUpload ? (
        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full">
          {/* Drop Zone */}
          <div
            className={`relative flex-1 min-h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-200 ${
              dragOver
                ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                : file
                  ? "border-violet-400 bg-violet-50 dark:bg-violet-900/10"
                  : "border-gray-300 dark:border-gray-600 hover:border-violet-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => !batchId && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="application/pdf"
              className="hidden"
            />

            {file ? (
              <>
                <FileText className="h-12 w-12 text-violet-500 mb-3" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate w-full px-4">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                {!batchId && (
                  <button
                    onClick={clearFile}
                    className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Click or drag PDF to upload
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Scanned answer-sheet batch (PDF only)
                </p>
              </>
            )}
          </div>

          {/* Error Messages */}
          {uploadErr && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {uploadErr}
            </div>
          )}
          {extractErr && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {extractErr}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 space-y-3">
            {!batchId && file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full py-3 flex items-center justify-center gap-2 bg-gray-800 dark:bg-gray-200 hover:bg-gray-900 dark:hover:bg-white text-white dark:text-gray-900 font-semibold rounded-xl transition disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                {uploading ? "Uploading..." : "Upload PDF Batch"}
              </button>
            )}
            {batchId && (
              <button
                onClick={handleExtract}
                className="w-full py-3 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition"
              >
                Extract Now
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
            {!file && !batchId && (
              <button
                disabled
                className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-semibold rounded-xl cursor-not-allowed"
              >
                Upload a PDF to continue
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
