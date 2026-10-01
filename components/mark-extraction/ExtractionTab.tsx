import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Upload, FileText, Loader2, CheckCircle2, AlertCircle, ArrowRight, 
  X, Trash2, StopCircle, RefreshCw, Layers, ShieldAlert, Sparkles, Clock, AlertTriangle
} from 'lucide-react';
import { MarkExtractionService } from '@/services/markExtraction.service';
import { Success, Failure } from '@/utils/function.utils';

interface ExtractionTabProps {
  ciaTestId:          number;
  initialStatus?:     string | null;
  initialJobId?:      number | null;
  onGoToExtractedView: () => void;
  onRefreshCiaTests?:  () => void;
}

export default function ExtractionTab({
  ciaTestId,
  initialStatus,
  initialJobId,
  onGoToExtractedView,
  onRefreshCiaTests,
}: ExtractionTabProps) {
  const [file,            setFile]            = useState<File | null>(null);
  const [dragOver,        setDragOver]        = useState(false);
  const [batchId,         setBatchId]         = useState<number | null>(null);
  const [jobId,           setJobId]           = useState<number | null>(initialJobId ?? null);
  const [jobStatus,       setJobStatus]       = useState<string | null>(initialStatus ?? null);
  const [progressPct,     setProgressPct]     = useState<number>(0);
  const [processedPages,  setProcessedPages]  = useState<number>(0);
  const [totalPages,      setTotalPages]      = useState<number>(0);
  const [errorMessage,    setErrorMessage]    = useState<string | null>(null);

  const [isUploading,     setIsUploading]     = useState(false);
  const [isCancelling,    setIsCancelling]    = useState(false);
  const [isDeleting,      setIsDeleting]      = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Undo Deletion State (5-second grace period)
  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<number | null>(null);
  const [undoSecondsRemaining, setUndoSecondsRemaining] = useState<number>(5);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deleteCountdownRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isPollingRef = useRef(false);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      if (deleteCountdownRef.current) clearInterval(deleteCountdownRef.current);
    };
  }, []);

  // ── 1. Fetch current job on mount / ciaTestId change ──────────────────────
  const fetchCurrentJob = useCallback(async () => {
    if (!ciaTestId) return;
    try {
      const current = await MarkExtractionService.getCurrentCiaJob(ciaTestId);
      if (current) {
        setJobId(current.job_id);
        setJobStatus(current.status);
        setProgressPct(current.progress_pct || 0);
        setProcessedPages(current.processed_pages || 0);
        setTotalPages(current.total_pages || 0);
        setErrorMessage(current.error_message || null);
        if (current.batch_id) setBatchId(current.batch_id);
      } else {
        setJobId(null);
        setJobStatus(null);
        setProgressPct(0);
        setProcessedPages(0);
        setTotalPages(0);
        setErrorMessage(null);
      }
    } catch (err) {
      console.error("Failed to load current CIA job status", err);
    }
  }, [ciaTestId]);

  useEffect(() => {
    fetchCurrentJob();
  }, [fetchCurrentJob]);

  // ── 2. Real-time Polling: ONLY active when job is PENDING or PROCESSING ────
  useEffect(() => {
    if (!jobId) return;

    const isRunning = jobStatus === "PENDING" || jobStatus === "PROCESSING";
    if (!isRunning) return; // Do not poll finished/idle jobs!

    const poll = async () => {
      if (isPollingRef.current) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      isPollingRef.current = true;
      try {
        const data = await MarkExtractionService.pollExtractionStatus(jobId);
        setJobStatus(data.status);
        setProgressPct(data.progress_pct || 0);
        setProcessedPages(data.processed_pages || 0);
        setTotalPages(data.total_pages || 0);
        setErrorMessage(data.error_message || null);

        // Terminal state reached: notify once
        if (data.status === "COMPLETED" || data.status === "PARTIAL" || data.status === "FAILED" || data.status === "CANCELLED") {
          onRefreshCiaTests?.();
        }
      } catch (err) {
        console.error("Extraction polling error:", err);
      } finally {
        isPollingRef.current = false;
      }
    };

    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [jobId, jobStatus, onRefreshCiaTests]);

  const isRunning = jobStatus === "PENDING" || jobStatus === "PROCESSING";
  const isCompleted = jobStatus === "COMPLETED";
  const isPartial = jobStatus === "PARTIAL";
  const isFailed = jobStatus === "FAILED" || jobStatus === "CANCELLED";

  // ── 3. Drag and Drop & File Selection ─────────────────────────────────────
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (isRunning || isUploading) return;

    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      setBatchId(null);
      setErrorMessage(null);
    } else {
      setErrorMessage("Only PDF files are accepted.");
    }
  }, [isRunning, isUploading]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setBatchId(null);
      setErrorMessage(null);
    }
  }, []);

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setBatchId(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── 4. Upload PDF Batch ───────────────────────────────────────────────────
  const handleUploadAndExtract = async () => {
    if (!file || isUploading || isRunning) return;
    setIsUploading(true);
    setErrorMessage(null);
    try {
      // 1. Upload PDF batch (max 60 pages enforced by backend)
      const batch = await MarkExtractionService.uploadAnswerSheetBatch(ciaTestId, file);
      const targetBatchId = Number(batch.batch_id ?? (batch as any).id);
      if (!targetBatchId || isNaN(targetBatchId)) {
        throw new Error("Answer sheet batch uploaded, but valid batch ID was not received from server.");
      }
      setBatchId(targetBatchId);

      // 2. Trigger Extraction
      const job = await MarkExtractionService.triggerExtraction(targetBatchId);
      setJobId(job.job_id);
      setJobStatus("PENDING");
      setProgressPct(0);
      setProcessedPages(0);
      setTotalPages(0);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      Success("Answer sheet uploaded! AI Extraction has started.");
      onRefreshCiaTests?.();
    } catch (err: any) {
      console.error("Upload error", err);
      const msg = err?.response?.data?.detail ?? err?.message ?? "Upload failed. Please check the PDF and try again.";
      setErrorMessage(msg);
      Failure(msg);
    } finally {
      setIsUploading(false);
    }
  };

  // ── 5. Cancel Running Job ─────────────────────────────────────────────────
  const handleCancelJob = async () => {
    if (!jobId || isCancelling) return;
    setIsCancelling(true);
    try {
      await MarkExtractionService.cancelExtractionJob(jobId);
      setJobStatus("CANCELLED");
      setErrorMessage("Extraction was cancelled by user.");
      setShowCancelModal(false);
      Success("Extraction job cancelled.");
      onRefreshCiaTests?.();
    } catch (err: any) {
      console.error("Cancel job error", err);
      Failure(err?.response?.data?.detail || "Failed to cancel extraction job.");
    } finally {
      setIsCancelling(false);
    }
  };

  // ── 6. Delete Job with 5-Second Undo Grace Period ─────────────────────────
  const handleScheduleDeleteJob = () => {
    if (!jobId) return;
    const targetJobId = jobId;
    setShowDeleteModal(false);
    setPendingDeleteJobId(targetJobId);
    setUndoSecondsRemaining(5);

    // Countdown interval
    deleteCountdownRef.current = setInterval(() => {
      setUndoSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (deleteCountdownRef.current) clearInterval(deleteCountdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Execute deletion after 5 seconds
    deleteTimeoutRef.current = setTimeout(async () => {
      await executeDeleteJob(targetJobId);
    }, 5000);
  };

  const handleCancelUndoDelete = () => {
    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    if (deleteCountdownRef.current) clearInterval(deleteCountdownRef.current);
    setPendingDeleteJobId(null);
    Success("Extraction job deletion cancelled.");
  };

  const executeDeleteJob = async (id: number) => {
    setIsDeleting(true);
    try {
      await MarkExtractionService.deleteExtractionJob(id);
      Success("Extraction job, answer sheets, and images deleted successfully.");
      setJobId(null);
      setJobStatus(null);
      setBatchId(null);
      setProgressPct(0);
      setProcessedPages(0);
      setTotalPages(0);
      setErrorMessage(null);
      onRefreshCiaTests?.();
    } catch (err: any) {
      console.error("Delete job error", err);
      Failure(err?.response?.data?.detail || "Failed to delete extraction job.");
    } finally {
      setIsDeleting(false);
      setPendingDeleteJobId(null);
    }
  };

  // Stage description helper
  const getStageDescription = () => {
    if (jobStatus === "PENDING") {
      return "Preparing documents, inspecting PDF pages, and generating processing batches...";
    }
    if (jobStatus === "PROCESSING") {
      if (processedPages === 0) {
        return "Rendering high-resolution page images and sending to AI Vision models...";
      }
      return `Analyzing answer sheets: ${processedPages} of ${totalPages} pages extracted...`;
    }
    return "";
  };

  return (
    <div className="h-full flex flex-col p-6 overflow-y-auto space-y-6 bg-gray-50/70 dark:bg-gray-900">
      
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Answer Sheet Extraction</span>
            {isRunning && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                Active Job #{jobId}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Upload physical answer sheet batches (up to 60 pages per batch) for automated AI mark extraction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCurrentJob}
            title="Refresh job status"
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-xl shadow-2xs">
            CIA Test #{ciaTestId}
          </span>
        </div>
      </div>

      {/* ── 1. ACTIVE RUNNING JOB BANNER & PROGRESS ─────────────────────────── */}
      {isRunning && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-violet-200 dark:border-violet-900/50 p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Extraction in Progress (Job #{jobId})
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {getStageDescription()}
                </p>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 transition cursor-pointer"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Cancel Job</span>
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                <Clock className="w-3.5 h-3.5" />
                {progressPct.toFixed(0)}% Completed
              </span>
              <span>{processedPages} / {totalPages > 0 ? `${totalPages} pages` : 'Calculating...'}</span>
            </div>
            <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(5, progressPct)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-violet-50/60 dark:bg-violet-950/20 rounded-xl border border-violet-100 dark:border-violet-900/40 text-[11px] text-violet-800 dark:text-violet-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-violet-500" />
            <span>AI is parsing student registration numbers and handwritten question marks. You can navigate between tabs while this runs.</span>
          </div>
        </div>
      )}

      {/* ── 2. PREVIOUS COMPLETED / PARTIAL BATCH STATUS BANNER ─────────────── */}
      {!isRunning && (isCompleted || isPartial) && (
        <div className={`rounded-2xl border p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isPartial 
            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60' 
            : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isPartial 
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' 
                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
            }`}>
              {isPartial ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {isPartial ? 'Partial Extraction Completed' : 'Answer Sheets Extracted Successfully'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  isPartial 
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300'
                }`}>
                  {jobStatus}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {isPartial 
                  ? 'Some pages completed extraction while some batches encountered issues. You can review the extracted marks or delete this batch.'
                  : `${totalPages > 0 ? `${totalPages} pages processed.` : 'All answer sheets processed.'} Extracted marks are ready for review and locking.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onGoToExtractedView}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white transition shadow-2xs cursor-pointer"
            >
              <span>View Extracted Marks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              title="Delete this extraction job and start over"
              className="p-2 rounded-xl border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── 3. FAILED / CANCELLED NOTIFICATION BANNER ────────────────────────── */}
      {!isRunning && isFailed && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-900 dark:text-red-300">
                Extraction {jobStatus === 'CANCELLED' ? 'Cancelled' : 'Failed'}
              </p>
              <p className="text-[11px] text-red-700 dark:text-red-400 mt-0.5">
                {errorMessage || "The job did not complete successfully. You can delete it or upload a new PDF."}
              </p>
            </div>
          </div>
          {jobId && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
            >
              Clear Job
            </button>
          )}
        </div>
      )}

      {/* ── 4. UPLOAD NEXT BATCH SECTION (ALWAYS AVAILABLE WHEN NOT RUNNING) ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/90 dark:border-gray-700/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700/60">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-600" />
              <span>{isCompleted || isPartial ? 'Upload Next Answer Sheet Batch' : 'Upload Answer Sheet Batch'}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload a scanned physical answer sheet PDF (Max limit: 60 pages).
            </p>
          </div>
          <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800 px-2.5 py-1 rounded-full">
            Limit: 60 Pages / PDF
          </span>
        </div>

        {/* Drop Zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all duration-200 ${
            isRunning || isUploading
              ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700'
              : dragOver
              ? 'border-violet-500 bg-violet-50/60 dark:bg-violet-950/20 cursor-pointer'
              : file
              ? 'border-violet-400 bg-violet-50/40 dark:bg-violet-950/10'
              : 'border-gray-300 dark:border-gray-600 hover:border-violet-400 hover:bg-gray-50/50 cursor-pointer'
          }`}
          onDragOver={(e) => { e.preventDefault(); if (!isRunning && !isUploading) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => {
            if (!isRunning && !isUploading && !file) {
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            onClick={(e) => e.stopPropagation()}
            accept="application/pdf"
            disabled={isRunning || isUploading}
            className="hidden"
          />

          {file ? (
            <div className="flex flex-col items-center space-y-2 max-w-sm">
              <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-full">
                {file.name}
              </p>
              <span className="text-[11px] text-gray-400">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • PDF Ready
              </span>
              {!isUploading && !isRunning && (
                <button
                  type="button"
                  onClick={clearFile}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Choose a different file</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-750 flex items-center justify-center text-gray-400">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {isRunning 
                  ? 'Extraction is currently running — please wait...' 
                  : 'Click to select or drag and drop evaluated answer sheets (PDF)'}
              </p>
              <p className="text-[11px] text-gray-400">
                Single PDF file containing evaluated student answer sheets (up to 60 pages).
              </p>
              {!isRunning && !isUploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="mt-1 px-4 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/60 border border-violet-200 dark:border-violet-800 transition cursor-pointer"
                >
                  Browse PDF File
                </button>
              )}
            </div>
          )}
        </div>

        {/* Error Notice */}
        {errorMessage && !isRunning && (
          <div className="flex items-center gap-2 p-3 text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Upload & Extract Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={handleUploadAndExtract}
            disabled={!file || isUploading || isRunning}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Uploading & Starting AI Extraction...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Upload & Extract Marks</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 5. CANCEL CONFIRMATION MODAL ────────────────────────────────────── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Cancel Active Extraction?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Are you sure you want to cancel Job #{jobId}? The ongoing page parsing will be halted immediately.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Keep Running
              </button>
              <button
                type="button"
                onClick={handleCancelJob}
                disabled={isCancelling}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition"
              >
                {isCancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Yes, Cancel Job</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. DELETE CONFIRMATION MODAL ────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Delete Extraction Job & Files?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This will permanently delete Job #{jobId}, including all extracted marks, answer sheets, and rendered page images for this batch. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleDeleteJob}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. 5-SECOND UNDO DELETION FLOATING TOAST ────────────────────────── */}
      {pendingDeleteJobId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-gray-900/95 dark:bg-black/95 text-white shadow-2xl border border-gray-700 backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>Job #{pendingDeleteJobId} scheduled for deletion</span>
              <span className="text-amber-400 font-mono">({undoSecondsRemaining}s)</span>
            </div>
            <p className="text-[11px] text-gray-400">All student marks & answer sheets will be deleted.</p>
          </div>
          <button
            type="button"
            onClick={handleCancelUndoDelete}
            className="ml-2 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
          >
            UNDO
          </button>
        </div>
      )}

    </div>
  );
}
