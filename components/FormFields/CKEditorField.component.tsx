import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  Sigma,
  Eye,
  EyeOff,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
} from "lucide-react";

export interface CKEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  minHeight?: string;
  badgeLabel?: string;
  hideBadge?: boolean;
  compactToolbar?: boolean;
  showImageUploadButton?: boolean;
  showMathFormulaButton?: boolean;
  onFormulaClick?: () => void;
  showPreviewButton?: boolean;
  isPreviewOpen?: boolean;
  onTogglePreview?: () => void;
  previewHtml?: string;
  helperText?: string;
}

export const CKEditorField: React.FC<CKEditorFieldProps> = ({
  value,
  onChange,
  title,
  placeholder = "Type your content here...",
  required = false,
  error,
  minHeight = "120px",
  badgeLabel = "CKEditor",
  hideBadge = false,
  compactToolbar = false,
  showImageUploadButton = true,
  showMathFormulaButton = false,
  onFormulaClick,
  showPreviewButton = false,
  isPreviewOpen = false,
  onTogglePreview,
  previewHtml,
  helperText,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorInstanceRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Helper to detect initial size & alignment from HTML content
  const detectImageProperties = (html?: string | null): { size: number; align: "left" | "center" | "right" } => {
    let size = 160;
    let align: "left" | "center" | "right" = "center";
    if (!html) return { size, align };

    if (html.includes("image-size-80") || /width=["']?80["']?/i.test(html) || /max-height:\s*80px/i.test(html)) {
      size = 80;
    } else if (html.includes("image-size-120") || /width=["']?120["']?/i.test(html) || /max-height:\s*120px/i.test(html)) {
      size = 120;
    } else if (html.includes("image-size-240") || /width=["']?240["']?/i.test(html) || /max-height:\s*240px/i.test(html)) {
      size = 240;
    } else if (html.includes("image-size-160") || /width=["']?160["']?/i.test(html) || /max-height:\s*160px/i.test(html)) {
      size = 160;
    }

    if (
      html.includes("image-align-left") ||
      /text-align:\s*left/i.test(html) ||
      /margin-left:\s*0/i.test(html) ||
      /margin:\s*[^;]*\s0px\b/i.test(html) ||
      /align=["']?left["']?/i.test(html)
    ) {
      align = "left";
    } else if (
      html.includes("image-align-right") ||
      /text-align:\s*right/i.test(html) ||
      /margin-right:\s*0/i.test(html) ||
      /align=["']?right["']?/i.test(html) ||
      html.includes("image-style-side")
    ) {
      align = "right";
    } else if (
      html.includes("image-align-center") ||
      /text-align:\s*center/i.test(html) ||
      /align=["']?center["']?/i.test(html)
    ) {
      align = "center";
    }

    return { size, align };
  };

  const initialProps = detectImageProperties(value);
  const [isReady, setIsReady] = useState(false);
  const [currentImageSize, setCurrentImageSize] = useState<number>(initialProps.size);
  const [currentImageAlign, setCurrentImageAlign] = useState<"left" | "center" | "right">(initialProps.align);

  const imageFormatRef = useRef<{ size: number; align: "left" | "center" | "right" }>(initialProps);
  imageFormatRef.current = { size: currentImageSize, align: currentImageAlign };
  const isInternalChangeRef = useRef(false);

  const hasImagesInContent = Boolean(value && /<img\s/i.test(value));

  // Helper to directly enforce image sizing and alignment on the live CKEditor DOM
  const applyDiagramStylesToDom = (size: number, align: "left" | "center" | "right") => {
    if (!containerRef.current) return;

    const alignLeft = align === "right" ? "auto" : align === "center" ? "auto" : "0px";
    const alignRight = align === "left" ? "auto" : align === "center" ? "auto" : "0px";

    // 1. All image wrapper containers / figures in the editor
    const figures = containerRef.current.querySelectorAll<HTMLElement>(
      "figure.image, .ck-widget.image, .ck-content figure, .ck-content .image, .ck-widget"
    );
    figures.forEach((fig) => {
      if (fig.querySelector("img") || fig.classList.contains("image")) {
        fig.style.setProperty("max-width", `${size}px`, "important");
        fig.style.setProperty("width", "auto", "important");
        fig.style.setProperty("margin-left", alignLeft, "important");
        fig.style.setProperty("margin-right", alignRight, "important");
        fig.style.setProperty("text-align", align, "important");
        fig.style.setProperty("display", "block", "important");
      }
    });

    // 2. All <img> elements in the editor
    const images = containerRef.current.querySelectorAll<HTMLImageElement>(
      ".ck-content img, .ck-editor img, img"
    );
    images.forEach((img) => {
      img.style.setProperty("max-height", `${size}px`, "important");
      img.style.setProperty("max-width", `${size}px`, "important");
      img.style.setProperty("width", "auto", "important");
      img.style.setProperty("min-width", "0px", "important");
      img.style.setProperty("height", "auto", "important");
      img.style.setProperty("object-fit", "contain", "important");
      img.style.setProperty("display", "block", "important");
      img.style.setProperty("margin-left", alignLeft, "important");
      img.style.setProperty("margin-right", alignRight, "important");
    });
  };

  // Helper using DOMParser to cleanly format HTML for storage and previews
  const updateHtmlImageFormatting = (html: string, size: number, align: "left" | "center" | "right"): string => {
    if (!html || typeof window === "undefined") return html;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const images = doc.querySelectorAll("img");
      if (images.length === 0) return html;

      const alignLeft = align === "right" ? "auto" : align === "center" ? "auto" : "0px";
      const alignRight = align === "left" ? "auto" : align === "center" ? "auto" : "0px";
      const margin = `6px ${alignRight} 6px ${alignLeft}`;
      const textAlign = align;
      const alignClass = `image-align-${align}`;
      const sizeClass = `image-size-${size}`;
      const styleStr = `max-height: ${size}px !important; max-width: ${size}px !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; margin: ${margin} !important;`;

      images.forEach((img) => {
        img.setAttribute("width", String(size));
        img.setAttribute("style", styleStr);
        const curImgClass = (img.getAttribute("class") || "")
          .replace(/image-size-\d+/g, "")
          .replace(/image-align-[a-z]+/g, "")
          .trim();
        img.setAttribute("class", `${curImgClass} ${sizeClass}`.trim());

        const figure = img.closest("figure");
        if (figure) {
          figure.setAttribute(
            "style",
            `max-width: ${size}px !important; width: auto !important; text-align: ${textAlign} !important; margin: ${margin} !important; display: block !important;`
          );
          const curFigClass = (figure.getAttribute("class") || "")
            .replace(/image-size-\d+/g, "")
            .replace(/image-align-[a-z]+/g, "")
            .trim();
          figure.setAttribute("class", `${curFigClass} ${alignClass} ${sizeClass}`.trim());
        } else {
          const parentP = img.parentElement;
          if (parentP && parentP.tagName.toLowerCase() === "p" && parentP.children.length === 1) {
            parentP.setAttribute("style", `text-align: ${textAlign} !important; margin: ${margin} !important;`);
            const curPClass = (parentP.getAttribute("class") || "")
              .replace(/image-size-\d+/g, "")
              .replace(/image-align-[a-z]+/g, "")
              .trim();
            parentP.setAttribute("class", `${curPClass} ${alignClass} ${sizeClass}`.trim());
          }
        }
      });

      return doc.body.innerHTML;
    } catch (e) {
      console.error("Error updating image formatting:", e);
      return html;
    }
  };

  const handleUpdateImageFormat = (opts: { size?: number; align?: "left" | "center" | "right" }) => {
    const newSize = opts.size ?? imageFormatRef.current.size;
    const newAlign = opts.align ?? imageFormatRef.current.align;

    imageFormatRef.current = { size: newSize, align: newAlign };
    if (opts.size) setCurrentImageSize(newSize);
    if (opts.align) setCurrentImageAlign(newAlign);

    // 1. Immediately apply to live editor DOM
    applyDiagramStylesToDom(newSize, newAlign);

    let content = "";
    if (editorInstanceRef.current) {
      content = editorInstanceRef.current.getData() || "";
    } else {
      content = value || "";
    }
    if (!content) return;

    // 2. Format HTML cleanly with the updated size & alignment
    const updated = updateHtmlImageFormatting(content, newSize, newAlign);

    // 3. Mark internal change so external value sync does not reset it
    isInternalChangeRef.current = true;
    onChangeRef.current(updated);
    setTimeout(() => {
      isInternalChangeRef.current = false;
      applyDiagramStylesToDom(newSize, newAlign);
    }, 60);
  };

  const handleRemoveAllImages = () => {
    let content = "";
    if (editorInstanceRef.current) {
      content = editorInstanceRef.current.getData() || "";
    } else {
      content = value || "";
    }
    if (!content) return;

    const updated = content
      .replace(/<p[^>]*>\s*<img[^>]*>\s*<\/p>/gi, "")
      .replace(/<figure[^>]*>\s*<img[^>]*>\s*<\/figure>/gi, "")
      .replace(/<img[^>]*>/gi, "");

    if (editorInstanceRef.current) {
      editorInstanceRef.current.setData(updated);
    }
    onChangeRef.current(updated);
  };

  const handleDirectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const alignLeft = currentImageAlign === "right" ? "auto" : currentImageAlign === "center" ? "auto" : "0px";
      const alignRight = currentImageAlign === "left" ? "auto" : currentImageAlign === "center" ? "auto" : "0px";
      const margin = `6px ${alignRight} 6px ${alignLeft}`;
      const textAlign = currentImageAlign;
      const alignClass = `image-align-${currentImageAlign}`;
      const sizeClass = `image-size-${currentImageSize}`;
      const styleStr = `max-height: ${currentImageSize}px !important; max-width: ${currentImageSize}px !important; width: auto !important; height: auto !important; object-fit: contain !important; display: block !important; margin: ${margin} !important;`;
      const imgHtml = `<p class="${alignClass} ${sizeClass}" style="text-align: ${textAlign}; margin: ${margin};"><img src="${base64}" alt="Diagram" width="${currentImageSize}" class="${sizeClass}" style="${styleStr}" /></p>`;
      if (editorInstanceRef.current) {
        const currentData = editorInstanceRef.current.getData() || "";
        const newData = currentData ? `${currentData}${imgHtml}` : imgHtml;
        editorInstanceRef.current.setData(newData);
        onChangeRef.current(newData);
        setTimeout(() => {
          applyDiagramStylesToDom(currentImageSize, currentImageAlign);
        }, 50);
      } else {
        onChangeRef.current(value ? `${value}${imgHtml}` : imgHtml);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Initialize CKEditor on client mount
  useEffect(() => {
    let isCancelled = false;
    let editorInstance: any = null;

    if (!containerRef.current) return;

    // Create target wrapper div for CKEditor
    const mountPoint = document.createElement("div");
    containerRef.current.appendChild(mountPoint);

    // Dynamically load the CKEditor 5 Classic build
    import("@ckeditor/ckeditor5-build-classic")
      .then((module) => {
        if (isCancelled || !mountPoint) return;

        const ClassicEditor: any = (module as any).default || module;

        // Base64 upload adapter so images can be chosen from device, pasted, or dragged
        function Base64UploadAdapterPlugin(editor: any) {
          const fileRepository = editor.plugins?.get?.("FileRepository");
          if (fileRepository) {
            fileRepository.createUploadAdapter = (loader: any) => {
              return {
                upload() {
                  return loader.file.then(
                    (file: File) =>
                      new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => {
                          resolve({ default: reader.result });
                        };
                        reader.onerror = (error) => reject(error);
                        reader.onabort = () => reject();
                        reader.readAsDataURL(file);
                      })
                  );
                },
                abort() {},
              };
            };
          }
        }

        const toolbarItems = compactToolbar
          ? [
              "bold",
              "italic",
              "link",
              "bulletedList",
              "numberedList",
              "|",
              "uploadImage",
              "|",
              "undo",
              "redo",
            ]
          : [
              "heading",
              "|",
              "bold",
              "italic",
              "link",
              "bulletedList",
              "numberedList",
              "|",
              "uploadImage",
              "insertTable",
              "blockQuote",
              "|",
              "outdent",
              "indent",
              "|",
              "undo",
              "redo",
            ];

        return ClassicEditor.create(mountPoint, {
          placeholder: placeholder,
          extraPlugins: [Base64UploadAdapterPlugin],
          toolbar: {
            items: toolbarItems,
            shouldNotGroupWhenFull: true,
          },
          table: {
            contentToolbar: ["tableColumn", "tableRow", "mergeTableCells"],
          },
          image: {
            toolbar: [
              "imageTextAlternative",
              "toggleImageCaption",
              "imageStyle:inline",
              "imageStyle:block",
              "imageStyle:side",
            ],
          },
        }).then((editor: any) => {
          if (isCancelled) {
            editor.destroy().catch(() => {});
            return;
          }

          editorInstance = editor;
          editorInstanceRef.current = editor;

          // Populate initial value if present
          if (value) {
            editor.setData(value);
            setTimeout(() => {
              applyDiagramStylesToDom(initialProps.size, initialProps.align);
            }, 60);
          }

          setIsReady(true);

          // Listen for content changes
          editor.model.document.on("change:data", () => {
            const rawData = editor.getData();
            // Automatically preserve currently selected diagram size & alignment on any image in content
            const formatted = updateHtmlImageFormatting(
              rawData,
              imageFormatRef.current.size,
              imageFormatRef.current.align
            );
            isInternalChangeRef.current = true;
            onChangeRef.current(formatted);
            setTimeout(() => {
              isInternalChangeRef.current = false;
              applyDiagramStylesToDom(imageFormatRef.current.size, imageFormatRef.current.align);
            }, 40);
          });
        });
      })
      .catch((err) => {
        console.error("[CKEditorField] Initialization error:", err);
      });

    return () => {
      isCancelled = true;
      if (editorInstance) {
        editorInstance.destroy().catch(() => {});
      }
      editorInstanceRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  // Keep live DOM in sync whenever size, align, or ready state updates
  useEffect(() => {
    if (isReady) {
      applyDiagramStylesToDom(currentImageSize, currentImageAlign);
    }
  }, [currentImageSize, currentImageAlign, isReady]);

  // Sync external changes (e.g. form reset or prefilled value)
  useEffect(() => {
    if (isInternalChangeRef.current) {
      isInternalChangeRef.current = false;
      return;
    }

    if (editorInstanceRef.current && isReady) {
      const currentData = editorInstanceRef.current.getData();
      const stripFormat = (h: string) =>
        h ? h.replace(/class="[^"]*image-[^"]*"/g, "").replace(/style="[^"]*"/g, "").trim() : "";

      if (stripFormat(value) !== stripFormat(currentData)) {
        editorInstanceRef.current.setData(value || "");
      }

      if (value && /<img\s/i.test(value)) {
        const props = detectImageProperties(value);
        imageFormatRef.current = props;
        setCurrentImageSize(props.size);
        setCurrentImageAlign(props.align);
        setTimeout(() => {
          applyDiagramStylesToDom(props.size, props.align);
        }, 50);
      }
    }
  }, [value, isReady]);

  return (
    <div className="w-full">
      {/* Field Header */}
      {(title || showImageUploadButton) && (
        <div className="flex items-center justify-between mb-1.5">
          {title ? (
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {title} {required && <span className="text-rose-500">*</span>}
            </label>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1.5">
            {showImageUploadButton && (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md border border-purple-200/80 bg-purple-50/80 px-2 py-0.5 text-[10px] font-bold text-purple-700 hover:bg-purple-100 hover:text-purple-800 dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-300 transition cursor-pointer active:scale-95 shadow-2xs"
                  title="Upload image or diagram from computer"
                >
                  <ImageIcon className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                  <span>+ Image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleDirectImageUpload}
                />
              </>
            )}

            {showMathFormulaButton && onFormulaClick && (
              <button
                type="button"
                onClick={onFormulaClick}
                className="inline-flex items-center gap-1 rounded-md border border-indigo-200/80 bg-indigo-50/80 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-300 transition cursor-pointer active:scale-95 shadow-2xs"
                title="Insert mathematical equation or LaTeX formula"
              >
                <Sigma className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400" />
                <span>+ LaTeX</span>
              </button>
            )}

            {showPreviewButton && onTogglePreview && (
              <button
                type="button"
                onClick={onTogglePreview}
                className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold transition cursor-pointer active:scale-95 shadow-2xs ${
                  isPreviewOpen
                    ? "border-purple-500 bg-purple-600 text-white font-bold"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
                title="Toggle live rendered LaTeX preview"
              >
                {isPreviewOpen ? (
                  <>
                    <EyeOff className="h-2.5 w-2.5" />
                    <span>Preview</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                    <span>Preview</span>
                  </>
                )}
              </button>
            )}

            {!hideBadge && badgeLabel && (
              <span className="inline-flex items-center gap-1 rounded-md border border-purple-200/60 bg-purple-50/80 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-300">
                <Sparkles className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                <span>{badgeLabel}</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Diagram Size & Alignment Controls Bar (when question content has images) */}
      {hasImagesInContent && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50/40 to-white p-2 text-xs shadow-2xs dark:border-purple-900/60 dark:bg-gray-800 mb-1.5 animate-in fade-in">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-200">
              <ImageIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span className="text-[11px]">Diagram:</span>
            </div>

            {/* Size Presets */}
            <div className="flex items-center gap-1 border-l border-purple-200/80 dark:border-purple-800 pl-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Size:</span>
              <button
                type="button"
                onClick={() => handleUpdateImageFormat({ size: 80 })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition border cursor-pointer ${
                  currentImageSize === 80
                    ? "border-purple-600 bg-purple-600 text-white shadow-2xs"
                    : "border-gray-200 bg-white hover:bg-purple-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
                title="Extra Small (80px)"
              >
                XS (80px)
              </button>
              <button
                type="button"
                onClick={() => handleUpdateImageFormat({ size: 120 })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition border cursor-pointer ${
                  currentImageSize === 120
                    ? "border-purple-600 bg-purple-600 text-white shadow-2xs"
                    : "border-gray-200 bg-white hover:bg-purple-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
                title="Small (120px)"
              >
                Small (120px)
              </button>
              <button
                type="button"
                onClick={() => handleUpdateImageFormat({ size: 160 })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition border cursor-pointer ${
                  currentImageSize === 160
                    ? "border-purple-600 bg-purple-600 text-white shadow-2xs"
                    : "border-purple-300 bg-purple-100/60 hover:bg-purple-200/60 text-purple-800 dark:border-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                }`}
                title="Standard Exam Fit (160px) - Recommended for printed question papers"
              >
                Exam Fit (160px) ★
              </button>
              <button
                type="button"
                onClick={() => handleUpdateImageFormat({ size: 240 })}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition border cursor-pointer ${
                  currentImageSize === 240
                    ? "border-purple-600 bg-purple-600 text-white shadow-2xs"
                    : "border-gray-200 bg-white hover:bg-purple-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
                title="Medium (240px)"
              >
                Medium (240px)
              </button>
            </div>

            {/* Alignment Options */}
            <div className="flex items-center gap-1 border-l border-purple-200/80 dark:border-purple-800 pl-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Align:</span>
              <button
                type="button"
                onClick={() => handleUpdateImageFormat({ align: "left" })}
                className={`p-1 rounded text-[10px] font-bold transition border cursor-pointer ${
                  currentImageAlign === "left"
                    ? "border-purple-600 bg-purple-600 text-white shadow-2xs"
                    : "border-gray-200 bg-white hover:bg-purple-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
                title="Align Diagram Left"
              >
                <AlignLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleUpdateImageFormat({ align: "center" })}
                className={`p-1 rounded text-[10px] font-bold transition border cursor-pointer ${
                  currentImageAlign === "center"
                    ? "border-purple-600 bg-purple-600 text-white shadow-2xs"
                    : "border-gray-200 bg-white hover:bg-purple-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
                title="Align Diagram Center"
              >
                <AlignCenter className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleUpdateImageFormat({ align: "right" })}
                className={`p-1 rounded text-[10px] font-bold transition border cursor-pointer ${
                  currentImageAlign === "right"
                    ? "border-purple-600 bg-purple-600 text-white shadow-2xs"
                    : "border-gray-200 bg-white hover:bg-purple-50 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
                title="Align Diagram Right"
              >
                <AlignRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveAllImages}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
            title="Remove diagram from question"
          >
            <Trash2 className="h-3 w-3" />
            <span>Remove</span>
          </button>
        </div>
      )}

      {/* CKEditor Container */}
      <div
        className={`ck-editor-wrapper ${compactToolbar ? "ck-editor-compact" : ""} relative transition-all`}
        style={{
          ["--editor-min-height" as any]: minHeight,
          ["--diagram-max-height" as any]: `${currentImageSize}px`,
          ["--diagram-max-width" as any]: `${currentImageSize}px`,
          ["--diagram-align-margin-left" as any]:
            currentImageAlign === "right" ? "auto" : currentImageAlign === "center" ? "auto" : "0px",
          ["--diagram-align-margin-right" as any]:
            currentImageAlign === "left" ? "auto" : currentImageAlign === "center" ? "auto" : "0px",
        }}
      >
        {/* Loading skeleton placeholder */}
        {!isReady && (
          <div
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/40 animate-pulse flex flex-col justify-between"
            style={{ minHeight }}
          >
            <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2.5">
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-6 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-6 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-6 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-4">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              <span>Initializing Rich Text Editor...</span>
            </div>
          </div>
        )}

        {/* DOM node where CKEditor will attach */}
        <div
          ref={containerRef}
          className={!isReady ? "hidden" : "block"}
        />
      </div>

      {/* Live Preview Box if enabled */}
      {showPreviewButton && isPreviewOpen && (
        <div className="mt-2 rounded-xl border border-purple-200 bg-gradient-to-r from-purple-50/80 via-indigo-50/40 to-white p-3 text-xs shadow-2xs dark:border-purple-900/60 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-1.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            <span className="flex items-center gap-1 font-bold">
              <Sparkles className="h-3 w-3 text-purple-600" />
              <span>Live Rendered Preview:</span>
            </span>
            {onTogglePreview && (
              <button
                type="button"
                onClick={onTogglePreview}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer"
              >
                ✕ Close
              </button>
            )}
          </div>
          <div className="min-h-[28px] py-1">
            {previewHtml ? (
              <div
                className="rich-text-content katex-rendered text-sm font-semibold text-slate-900 dark:text-white leading-relaxed max-w-full overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <span className="text-[11px] text-slate-400 italic">No content or formula entered yet</span>
            )}
          </div>
        </div>
      )}

      {/* Helper text or Error message */}
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
      {error && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-rose-500 font-medium">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default CKEditorField;
