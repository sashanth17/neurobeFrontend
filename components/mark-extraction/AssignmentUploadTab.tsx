import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Layers,
  Download,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { MarkExtractionService } from '@/services/markExtraction.service';
import { Success, Failure } from '@/utils/function.utils';

interface AssignmentUploadTabProps {
  instanceId: string | number;
  courseId?: string | number;
}

export default function AssignmentUploadTab({
  instanceId,
  courseId,
}: AssignmentUploadTabProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        [
          'Register Number',
          'CO1_Mark',
          'CO1_Max',
          'CO2_Mark',
          'CO2_Max',
          'CO3_Mark',
          'CO3_Max',
          'CO4_Mark',
          'CO4_Max',
        ],
        ['721225C5DA07', 5, 10, 8, 10, 5, 10, 5, 10],
      ];
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Worksheet');
      XLSX.writeFile(wb, 'Sample_Direct_Assessment.xlsx');
      Success('Sample Direct Assessment template downloaded');
    } catch {
      // Fallback: download the file copied to public
      const link = document.createElement('a');
      link.href = '/Sample_Direct_Assessment.xlsx';
      link.download = 'Sample_Direct_Assessment.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResponseMessage(null);
      setResponseData(null);
      setErrorMessage(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResponseMessage(null);
      setResponseData(null);
      setErrorMessage(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const extractApiErrorMessage = (err: any): string => {
    if (!err) return 'Failed to upload assignment marks. Please try again.';
    if (typeof err === 'string') return err;

    const resData = err?.response?.data;
    if (resData) {
      if (typeof resData === 'string' && resData.trim()) return resData;

      // FastAPI / Pydantic validation error array: detail = [{ loc, msg, type }]
      if (Array.isArray(resData.detail)) {
        return resData
          .map((d: any) => {
            if (typeof d === 'string') return d;
            const field = Array.isArray(d?.loc) ? d.loc.slice(-1)[0] : '';
            const msg = d?.msg || d?.message || 'Invalid value';
            return field ? `${field}: ${msg}` : msg;
          })
          .join(', ');
      }

      // Detail as object { detail, message, error }
      if (resData.detail && typeof resData.detail === 'object') {
        return (
          resData.detail.detail ||
          resData.detail.message ||
          resData.detail.error ||
          JSON.stringify(resData.detail)
        );
      }

      if (typeof resData.detail === 'string' && resData.detail.trim()) {
        return resData.detail;
      }

      if (typeof resData.message === 'string' && resData.message.trim()) {
        return resData.message;
      }
      if (typeof resData.error === 'string' && resData.error.trim()) {
        return resData.error;
      }
      if (typeof resData.msg === 'string' && resData.msg.trim()) {
        return resData.msg;
      }

      if (Array.isArray(resData.errors) && resData.errors.length > 0) {
        return resData.errors
          .map((e: any) => (typeof e === 'string' ? e : e?.msg || e?.message || JSON.stringify(e)))
          .join(', ');
      }
    }

    const status = err?.response?.status;
    if (status === 400) return err?.response?.data?.error || err?.response?.data?.message || 'Bad Request: Please verify file format and columns.';
    if (status === 404) return 'Endpoint not found or Course Instance does not exist.';
    if (status === 413) return 'File too large. Please upload a smaller file.';
    if (status === 422) return 'Validation error: Ensure the file has key "file" and columns match the template.';
    if (status === 500) return 'Server Error: The server encountered an issue processing the marks.';

    if (err?.message) {
      if (err.message === 'Network Error') {
        return 'Network Error: Cannot reach the backend service. Check your connection or gateway.';
      }
      return err.message;
    }

    return 'Failed to upload assignment marks. Please try again.';
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResponseMessage(null);
    setResponseData(null);
    setErrorMessage(null);

    try {
      const res = await MarkExtractionService.uploadDirectCoMarks(instanceId, file);

      if (!res.success) {
        const errText = res.error || res.message || 'Failed to upload assignment marks';
        setErrorMessage(errText);

        // Show SweetAlert2 toast notification
        try {
          const toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000,
            timerProgressBar: true,
            customClass: {
              title: 'small-font-toast',
            },
          });
          toast.fire({
            icon: 'error',
            title: errText,
            padding: '10px 20px',
          });
        } catch {
          Failure(errText);
        }
        return;
      }

      const msg = res.message || 'Assignment marks uploaded successfully!';
      setResponseMessage(msg);
      setResponseData(res.data);
      Success(msg);
    } catch (unexpectedErr: any) {
      console.warn('[AssignmentUploadTab] Upload error:', unexpectedErr);
      const parsedError = extractApiErrorMessage(unexpectedErr);
      setErrorMessage(parsedError);
      Failure(parsedError, unexpectedErr);
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    handleRemoveFile();
    setResponseMessage(null);
    setResponseData(null);
    setErrorMessage(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-6 bg-slate-50/50 dark:bg-gray-900/50">
      <div className="max-w-4xl w-full mx-auto space-y-6">

        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Upload Assignment Marks (Direct CO Marks)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload student assignment scores and direct CO marks using the standard template
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Download Template (.xlsx)
            </button>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800">
              <Layers className="h-3.5 w-3.5" />
              Instance ID: {instanceId || 1}
            </span>
          </div>
        </div>

        {/* Success Alert Banner */}
        {responseMessage && (
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 dark:border-emerald-800 dark:bg-emerald-950/40 animate-fadeIn">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Upload Succeeded
                </h4>
                <p className="mt-1 text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {responseMessage}
                </p>

                {responseData && typeof responseData === 'object' && Object.keys(responseData).length > 1 && (
                  <details className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                    <summary className="cursor-pointer font-semibold hover:underline">
                      View details
                    </summary>
                    <pre className="mt-2 p-2.5 rounded-lg bg-emerald-100/60 dark:bg-emerald-900/50 font-mono text-[11px] overflow-x-auto text-emerald-900 dark:text-emerald-200">
                      {JSON.stringify(responseData, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
              <button
                type="button"
                onClick={() => setResponseMessage(null)}
                className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-1"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/90 dark:border-rose-800 dark:bg-rose-950/40 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Upload Failed
                </h4>
                <p className="mt-1 text-sm font-medium text-rose-800 dark:text-rose-300 break-words">
                  {errorMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-600 hover:text-rose-800 dark:text-rose-400 p-1"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Main Upload Box */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 shadow-xs">
          <input
            ref={fileInputRef}
            type="file"
            name="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            id="assignment-file-input"
          />

          {!file ? (
            /* Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${dragOver
                ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/20'
                : 'border-slate-300 dark:border-gray-600 hover:border-violet-400 hover:bg-slate-50 dark:hover:bg-gray-700/50'
                }`}
            >
              <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 mb-3 shadow-xs">
                <Upload className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">
                Choose a file or drag & drop it here
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Supports Excel (.xlsx, .xls) or CSV (.csv) matching the direct assessment template
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 transition shadow-sm"
              >
                Browse Files
              </button>
            </div>
          ) : (
            /* Selected File Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-700/40">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {formatFileSize(file.size)} • {file.type || 'Spreadsheet'}
                    </p>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    title="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Upload Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading & Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Assignment Marks
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
