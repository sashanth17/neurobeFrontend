import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  file: File | string | null;
  fileName?: string;
  fileSize?: string;
}

const getFileType = (file: File | string | null): "pdf" | "docx" | "txt" | "unknown" => {
  if (!file) return "unknown";
  const name = typeof file === "string" ? file : file.name;
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  if (ext === "txt") return "txt";
  return "unknown";
};

const BUFFER = 1; // pages above/below viewport to keep rendered

const PDFViewer = ({ file, fileName = "Document", fileSize = "" }: PDFViewerProps) => {
  if (!file) return (
    <div className="flex h-full min-h-0 flex-col rounded-xl bg-[#1a1f2e] overflow-hidden">
      <div className="flex h-full items-center justify-center text-white/40 text-sm">
        No file selected
      </div>
    </div>
  );
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [debouncedScale, setDebouncedScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [docxHtml, setDocxHtml] = useState("");
  const [txtContent, setTxtContent] = useState("");
  const [pdfLoading, setPdfLoading] = useState(true);
  const [zoomLoading, setZoomLoading] = useState(false);
  // per-page rendered heights so placeholders match
  const [pageHeights, setPageHeights] = useState<Record<number, number>>({});
  // set of page indexes currently visible in viewport
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([0]));

  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstZoomRender = useRef(true);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const fileType = getFileType(file);

  // Reset on file change
  useEffect(() => {
    if (!(file instanceof File)) return;
    setDocxHtml("");
    setTxtContent("");
    setPageNumber(1);
    setPdfLoading(true);
    setPageHeights({});
    setVisiblePages(new Set([0]));
    isFirstZoomRender.current = true;

    if (fileType === "docx") {
      import("mammoth/mammoth.browser").then((mammoth) => {
        file.arrayBuffer().then((buf) => {
          mammoth.convertToHtml({ arrayBuffer: buf }).then((result: { value: string }) =>
            setDocxHtml(result.value)
          );
        });
      });
    } else if (fileType === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => setTxtContent(e.target?.result as string);
      reader.readAsText(file);
    }
  }, [file, fileType]);

  // Measure container width
  useEffect(() => {
    if (!scrollRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, []);

  // IntersectionObserver — track which page divs are visible
  useEffect(() => {
    if (!scrollRef.current || numPages === 0) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisiblePages((prev) => {
          const next = new Set(prev);
          entries.forEach((entry) => {
            const idx = Number((entry.target as HTMLElement).dataset.pageindex);
            if (entry.isIntersecting) next.add(idx);
            else next.delete(idx);
          });
          return next;
        });
      },
      { root: scrollRef.current, rootMargin: "200px 0px" }
    );

    pageRefs.current.forEach((el) => {
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [numPages, scrollRef.current]);

  // Debounce scale → debouncedScale
  useEffect(() => {
    if (isFirstZoomRender.current) {
      isFirstZoomRender.current = false;
      setDebouncedScale(scale);
      return;
    }
    setZoomLoading(true);
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    zoomTimerRef.current = setTimeout(() => {
      setDebouncedScale(scale);
      setZoomLoading(false);
    }, 300);
    return () => { if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current); };
  }, [scale]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setPdfLoading(false);
    pageRefs.current = new Array(numPages).fill(null);
  }, []);

  const zoomIn = () => setScale((s) => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));

  const pageWidth = useMemo(
    () => (containerWidth > 0 ? (containerWidth - 32) * debouncedScale : undefined),
    [containerWidth, debouncedScale]
  );

  const goToPage = (page: number) => {
    const el = pageRefs.current[page - 1];
    if (el && scrollRef.current) {
      scrollRef.current.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
    }
    setPageNumber(page);
  };

  const handleScroll = () => {
    if (!scrollRef.current || fileType !== "pdf") return;
    const scrollTop = scrollRef.current.scrollTop;
    for (let i = pageRefs.current.length - 1; i >= 0; i--) {
      const el = pageRefs.current[i];
      if (el && el.offsetTop - 32 <= scrollTop) {
        setPageNumber(i + 1);
        break;
      }
    }
  };

  const shouldRender = (idx: number) => {
    for (const v of visiblePages) {
      if (Math.abs(v - idx) <= BUFFER) return true;
    }
    return false;
  };

  const headerColor =
    fileType === "pdf" ? "bg-red-500" : fileType === "docx" ? "bg-blue-500" : "bg-gray-500";

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl bg-[#1a1f2e] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${headerColor}`}>
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{fileName}</p>
          <p className="text-xs text-white/50">Original Document{fileSize ? ` • ${fileSize}` : ""}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        {fileType === "pdf" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(Math.max(pageNumber - 1, 1))}
              disabled={pageNumber <= 1}
              className="rounded p-1 text-white/60 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-white/70">
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => goToPage(Math.min(pageNumber + 1, numPages))}
              disabled={pageNumber >= numPages}
              className="rounded p-1 text-white/60 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="rounded p-1 text-white/60 hover:text-white">
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-xs text-white/70">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="rounded p-1 text-white/60 hover:text-white">
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-auto min-h-0 relative"
      >
        {/* Loading overlay */}
        {fileType === "pdf" && (pdfLoading || zoomLoading) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#1a1f2e]/80 backdrop-blur-sm">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <span className="text-xs text-white/50">
              {pdfLoading ? "Loading document..." : "Applying zoom..."}
            </span>
          </div>
        )}

        {fileType === "pdf" && (
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={null}
            error={
              <div className="flex h-40 items-center justify-center text-red-400 text-sm">
                Failed to load PDF.
              </div>
            }
          >
            <div className="flex flex-col items-center gap-4 py-4 px-4">
              {Array.from({ length: numPages }, (_, i) => (
                <div
                  key={i + 1}
                  data-pageindex={i}
                  ref={(el) => {
                    pageRefs.current[i] = el;
                    if (el && observerRef.current) observerRef.current.observe(el);
                  }}
                  className="flex-shrink-0"
                  style={
                    !shouldRender(i) && pageHeights[i]
                      ? { height: pageHeights[i], width: pageWidth }
                      : undefined
                  }
                >
                  {shouldRender(i) ? (
                    <Page
                      pageNumber={i + 1}
                      width={pageWidth}
                      renderTextLayer
                      renderAnnotationLayer
                      className="shadow-lg"
                      onRenderSuccess={() => {
                        const el = pageRefs.current[i];
                        if (el) {
                          setPageHeights((prev) => ({ ...prev, [i]: el.offsetHeight }));
                        }
                      }}
                    />
                  ) : (
                    <div
                      className="bg-white/5 rounded"
                      style={{ height: pageHeights[i] ?? 800, width: pageWidth ?? "100%" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </Document>
        )}

        {fileType === "docx" && (
          docxHtml
            ? (
              <div className="px-4 pt-4 pb-8">
                <div
                  className="prose max-w-none text-sm w-full bg-white text-black p-6 rounded shadow-lg"
                  style={{ fontSize: `${scale}em` }}
                  dangerouslySetInnerHTML={{ __html: docxHtml }}
                />
              </div>
            )
            : <div className="flex h-40 items-center justify-center text-white/50 text-sm">Loading document...</div>
        )}

        {fileType === "txt" && (
          <div className="flex justify-center py-4 px-4">
            <pre
              className="whitespace-pre-wrap font-mono text-white/90 w-full"
              style={{ fontSize: `${scale}em` }}
            >
              {txtContent}
            </pre>
          </div>
        )}

        {fileType === "unknown" && (
          <div className="flex h-40 items-center justify-center text-white/50 text-sm">
            Unsupported file type.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-2 text-center text-xs text-white/40">
        Click any bordered section in the document to view corresponding extracted fields.
      </div>
    </div>
  );
};

export default PDFViewer;
