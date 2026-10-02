import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  ExternalLink,
  Download,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  AlertCircle,
} from "lucide-react";

interface PDFViewerProps {
  file: File | string | null;
  fileName?: string;
  fileSize?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  fileName = "Syllabus Document.pdf",
  fileSize = "",
}) => {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert File to object URL or use string URL directly
  useEffect(() => {
    setError(null);
    setLoading(true);

    if (!file) {
      setResolvedUrl(null);
      setLoading(false);
      return;
    }

    if (file instanceof File) {
      const url = URL.createObjectURL(file);
      setResolvedUrl(url);
      setLoading(false);
      return () => {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      };
    } else if (typeof file === "string") {
      setResolvedUrl(file);
      setLoading(false);
    } else {
      setError("Unsupported file format");
      setLoading(false);
    }
  }, [file]);

  const handleOpenExternal = () => {
    if (resolvedUrl) {
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleDownload = () => {
    if (!resolvedUrl) return;
    const a = document.createElement("a");
    a.href = resolvedUrl;
    a.download = fileName || "syllabus.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!file) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center rounded-2xl bg-slate-900 p-8 text-center text-slate-400">
        <FileText className="h-12 w-12 text-slate-600 mb-3" />
        <p className="text-sm font-semibold text-slate-300">No document loaded</p>
        <p className="text-xs text-slate-500 mt-1">
          Select a file version to inspect its original uploaded PDF.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[500px] flex-col overflow-hidden rounded-2xl bg-slate-900 shadow-md">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-600 text-white shadow-xs">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-white" title={fileName}>
              {fileName}
            </p>
            <p className="text-[10px] text-slate-400">
              Source PDF Document{fileSize ? ` • ${fileSize}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-700 hover:text-white"
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            type="button"
            onClick={handleOpenExternal}
            className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-indigo-500"
            title="Open in new window"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Pop Out</span>
          </button>
        </div>
      </div>

      {/* Viewer Body */}
      <div className="relative flex-1 bg-slate-900 overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-900/90 text-slate-300">
            <RotateCw className="h-6 w-6 animate-spin text-indigo-400" />
            <span className="text-xs">Loading PDF document...</span>
          </div>
        )}

        {error && (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center text-rose-400">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p className="text-sm font-bold">Failed to display document</p>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
          </div>
        )}

        {resolvedUrl && !error && (
          <iframe
            src={`${resolvedUrl}#toolbar=1&navpanes=0&view=FitH`}
            className="h-full w-full border-none bg-slate-900"
            title={fileName}
            onLoad={() => setLoading(false)}
          />
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
