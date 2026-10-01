import React from "react";
import {
  FileText,
  Sparkles,
  Eye,
  CheckCircle,
  Clock,
  RotateCw,
  AlertCircle,
  Check,
} from "lucide-react";

export interface FileVersionItem {
  id: number;
  version_number: number;
  original_filename: string;
  file_path: string;
  is_active: boolean;
  uploaded_by: string;
  created_at: string | null;
  label?: string;
  extraction_version?: number | null;
  extraction_status?: string | null;
  extraction_is_active?: boolean;
}

interface FileVersionCardProps {
  version: FileVersionItem;
  isExtracting: boolean;
  isLoadingReview: boolean;
  onExtract: (version: FileVersionItem) => void;
  onReview: (version: FileVersionItem) => void;
  onActivate?: (version: FileVersionItem) => void;
}

const EXTRACTION_STATUS_MAP: Record<
  string,
  { label: string; badgeCls: string; dotCls: string }
> = {
  approved: {
    label: "✓ Approved",
    badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
    dotCls: "bg-emerald-500",
  },
  draft: {
    label: "Draft",
    badgeCls: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800",
    dotCls: "bg-sky-500",
  },
  redis_queued: {
    label: "Queued",
    badgeCls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
    dotCls: "bg-amber-500 animate-pulse",
  },
  generating: {
    label: "Extracting...",
    badgeCls: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800",
    dotCls: "bg-indigo-500 animate-spin",
  },
  failed: {
    label: "Failed",
    badgeCls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
    dotCls: "bg-rose-500",
  },
  not_started: {
    label: "Not Extracted",
    badgeCls: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
    dotCls: "bg-slate-400",
  },
};

const FileVersionCard: React.FC<FileVersionCardProps> = ({
  version,
  isExtracting,
  isLoadingReview,
  onExtract,
  onReview,
  onActivate,
}) => {
  const extStatus = (version.extraction_status || "not_started").toLowerCase();
  const statusCfg = EXTRACTION_STATUS_MAP[extStatus] || EXTRACTION_STATUS_MAP.not_started;
  const hasExtraction = extStatus !== "not_started";
  const isActive = Boolean(version.is_active);

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
        isActive
          ? "border-emerald-300 bg-emerald-50/20 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/10"
          : "border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <div>
        {/* Header row: Version badge, Active tag, Extraction status */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400"
              }`}
            >
              Version {version.version_number}
            </span>

            {isActive ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                <Check className="h-3 w-3" /> Active File
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Inactive
              </span>
            )}
          </div>

          {/* Extraction status badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusCfg.badgeCls}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dotCls}`} />
            <span>{statusCfg.label}</span>
          </span>
        </div>

        {/* File Details */}
        <div className="mt-4 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              isActive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            }`}
          >
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className="truncate text-sm font-bold text-slate-900 dark:text-white"
              title={version.original_filename}
            >
              {version.original_filename}
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Uploaded by {version.uploaded_by || "Faculty"}
              {version.created_at && (
                <span>
                  {" • "}
                  {new Date(version.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
              {version.extraction_version && (
                <span className="ml-1 font-semibold text-indigo-600 dark:text-indigo-400">
                  {" • "}Extraction v{version.extraction_version}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div>
          {!isActive && onActivate && (
            <button
              type="button"
              onClick={() => onActivate(version)}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              Make Active
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Extract button */}
          <button
            type="button"
            disabled={isExtracting}
            onClick={() => onExtract(version)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-xs transition-all hover:bg-indigo-100 active:scale-95 disabled:opacity-60 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
          >
            {isExtracting ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{hasExtraction ? "Re-Extract" : "Extract"}</span>
              </>
            )}
          </button>

          {/* Review button - only when extraction exists */}
          {hasExtraction && (
            <button
              type="button"
              disabled={isLoadingReview}
              onClick={() => onReview(version)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {isLoadingReview ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  <span>Review & Populate</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileVersionCard;
