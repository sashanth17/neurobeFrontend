import React, { useState, useEffect } from "react";
import { Image as ImageIcon, Loader2, Maximize2, AlertCircle, Compass } from "lucide-react";
import QuestionPaperStudioService from "@/services/questionPaperStudioService";

// Global in-memory cache for rendered diagram SVG data URIs
const diagramCache = new Map<string, string>();

export const normalizeDiagramUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("data:")) return url;

  let clean = url
    .replace(/^https?:\/\/minio:9000/i, "http://localhost:9000")
    .replace(/^https?:\/\/neurobe_minio:9000/i, "http://localhost:9000")
    .replace(/^https?:\/\/[^/]+(?::\d+)?\/api\/v1\/storage/i, "http://localhost:9000")
    .replace(/^\/api\/v1\/storage/i, "http://localhost:9000");

  if (clean.startsWith("/question-diagrams")) {
    clean = `http://localhost:9000${clean}`;
  }
  return clean;
};

interface QuestionDiagramPreviewProps {
  diagramUrl?: string | null;
  diagramSpec?: Record<string, any> | null;
  alt?: string;
  className?: string;
  thumbnail?: boolean;
  questionNumber?: number | string;
  onOpenStudio?: () => void;
  onZoom?: (url: string) => void;
}

export const QuestionDiagramPreview: React.FC<QuestionDiagramPreviewProps> = ({
  diagramUrl,
  diagramSpec,
  alt = "Question diagram",
  className = "",
  thumbnail = false,
  questionNumber,
  onOpenStudio,
  onZoom,
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() =>
    normalizeDiagramUrl(diagramUrl)
  );
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [loadFailed, setLoadFailed] = useState<boolean>(false);

  // Helper to safely parse stringified or object diagramSpec
  const safeSpec = typeof diagramSpec === "string" ? (() => {
    try { return JSON.parse(diagramSpec); } catch { return null; }
  })() : diagramSpec;

  // When props change, re-evaluate URL
  useEffect(() => {
    const directUrl = normalizeDiagramUrl(diagramUrl);
    if (directUrl) {
      setResolvedSrc(directUrl);
      setLoadFailed(false);
      return;
    }

    const currentSpec = typeof diagramSpec === "string" ? (() => {
      try { return JSON.parse(diagramSpec); } catch { return null; }
    })() : diagramSpec;

    if (currentSpec && Object.keys(currentSpec).length > 0) {
      // Check cache first
      const specKey = JSON.stringify(currentSpec);
      if (diagramCache.has(specKey)) {
        setResolvedSrc(diagramCache.get(specKey)!);
        setLoadFailed(false);
      } else {
        compileSpec(currentSpec);
      }
    } else {
      setResolvedSrc(null);
    }
  }, [diagramUrl, diagramSpec]);

  const compileSpec = async (spec: Record<string, any>) => {
    const specKey = JSON.stringify(spec);
    setIsCompiling(true);
    try {
      const res = await QuestionPaperStudioService.renderDiagram({ diagram_spec: spec });
      if (res && (res.data_uri || res.diagram_url)) {
        const url = res.data_uri || normalizeDiagramUrl(res.diagram_url) || "";
        diagramCache.set(specKey, url);
        setResolvedSrc(url);
        setLoadFailed(false);
      } else {
        setLoadFailed(true);
      }
    } catch (err) {
      console.warn("Failed to compile diagram_spec dynamically:", err);
      setLoadFailed(true);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleImageError = () => {
    // If the image failed to load from URL (e.g. MinIO connectivity or path mismatch)
    // and we have diagramSpec, compile it dynamically into Data URI
    const currentSpec = typeof diagramSpec === "string" ? (() => {
      try { return JSON.parse(diagramSpec); } catch { return null; }
    })() : diagramSpec;

    if (currentSpec && Object.keys(currentSpec).length > 0 && !isCompiling) {
      compileSpec(currentSpec);
    } else {
      setLoadFailed(true);
    }
  };

  // If nothing to display
  if (!resolvedSrc && !diagramSpec && !isCompiling) {
    return null;
  }

  if (isCompiling) {
    return (
      <div
        className={`flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-teal-300 bg-teal-50/50 p-2 text-teal-700 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-300 ${
          thumbnail ? "h-12 w-20" : "h-28 w-full max-w-xs"
        }`}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="text-[10px] font-bold">Compiling SVG...</span>
      </div>
    );
  }

  if (loadFailed && !resolvedSrc) {
    return (
      <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-400">
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span>Diagram unavailable</span>
        {onOpenStudio && (
          <button
            type="button"
            onClick={onOpenStudio}
            className="underline font-bold hover:text-amber-900 ml-1"
          >
            Open in Studio
          </button>
        )}
      </div>
    );
  }

  if (thumbnail) {
    return (
      <div className="relative group inline-flex items-center">
        <button
          type="button"
          onClick={() => {
            if (onZoom && resolvedSrc) onZoom(resolvedSrc);
            else if (onOpenStudio) onOpenStudio();
          }}
          className={`group flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/80 p-1.5 hover:border-purple-300 hover:bg-purple-50/30 transition-all dark:border-gray-700 dark:bg-gray-800/80 ${className}`}
        >
          {resolvedSrc ? (
            <img
              src={resolvedSrc}
              alt={alt}
              onError={handleImageError}
              className="h-10 w-16 rounded-lg object-contain bg-white border border-gray-200 p-0.5 shadow-xs"
            />
          ) : (
            <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
              <ImageIcon className="h-4 w-4" />
            </div>
          )}
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> Vector Diagram
            </span>
            <span className="text-[11px] text-gray-500 group-hover:text-purple-600 font-semibold">
              Click to Zoom
            </span>
          </div>
        </button>

        {onOpenStudio && (
          <button
            type="button"
            onClick={onOpenStudio}
            title="Edit diagram in Vector Studio"
            className="ml-1.5 p-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300 transition-colors"
          >
            <Compass className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Full / Paper preview display
  return (
    <div className={`my-3 text-center ${className}`}>
      <div className="relative inline-block max-w-full">
        {resolvedSrc && (
          <img
            src={resolvedSrc}
            alt={alt}
            onError={handleImageError}
            className="mx-auto max-h-56 max-w-full rounded-xl border border-gray-300 bg-white p-2 object-contain shadow-xs print:border-black print:max-h-48"
          />
        )}
        {onZoom && resolvedSrc && (
          <button
            type="button"
            onClick={() => onZoom(resolvedSrc)}
            className="absolute top-2 right-2 rounded-lg bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100 hover:bg-black transition-opacity print:hidden"
            title="Zoom Diagram"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {questionNumber && (
        <div className="mt-1 text-[11px] font-serif italic text-gray-600 print:text-black">
          Figure Q{questionNumber}
        </div>
      )}
    </div>
  );
};

export default QuestionDiagramPreview;
