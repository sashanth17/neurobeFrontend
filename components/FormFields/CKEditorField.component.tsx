import React, { useEffect, useRef, useState } from "react";
import { Sparkles, AlertCircle, Image as ImageIcon, Sigma, Eye, EyeOff } from "lucide-react";

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

  const [isReady, setIsReady] = useState(false);

  const handleDirectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const imgHtml = `<p><img src="${base64}" alt="Option Image" /></p>`;
      if (editorInstanceRef.current) {
        const currentData = editorInstanceRef.current.getData() || "";
        const newData = currentData ? `${currentData}${imgHtml}` : imgHtml;
        editorInstanceRef.current.setData(newData);
        onChangeRef.current(newData);
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
          }

          setIsReady(true);

          // Listen for content changes
          editor.model.document.on("change:data", () => {
            const data = editor.getData();
            onChangeRef.current(data);
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

  // Sync external changes (e.g. form reset or prefilled value)
  useEffect(() => {
    if (editorInstanceRef.current && isReady) {
      const currentData = editorInstanceRef.current.getData();
      if (value !== currentData) {
        editorInstanceRef.current.setData(value || "");
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

      {/* CKEditor Container */}
      <div
        className={`ck-editor-wrapper ${compactToolbar ? "ck-editor-compact" : ""} relative transition-all`}
        style={{ ["--editor-min-height" as any]: minHeight }}
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
