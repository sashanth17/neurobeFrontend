import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  X,
  RefreshCw,
  Code2,
  Eye,
  Download,
  Check,
  Sparkles,
  Layers,
  Palette,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Cpu,
  Compass,
  Workflow,
  Sigma,
} from "lucide-react";
import QuestionPaperStudioService from "@/services/questionPaperStudioService";
import { DiagramRenderResponse } from "@/types/cia-test.types";
import { toast } from "react-toastify";

interface DiagramStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSpec?: Record<string, any> | null;
  courseCode?: string;
  courseId?: string | number;
  questionId?: number | null;
  onSaveSpec?: (spec: Record<string, any>, renderedUrl: string) => void;
}

const PRESET_TEMPLATES: Record<string, { label: string; icon: any; spec: Record<string, any> }> = {
  civil_beam: {
    label: "Civil Beam & Loads",
    icon: Compass,
    spec: {
      type: "beam",
      length: "8m",
      support_left: "pinned",
      support_right: "roller",
      loads: [
        { type: "point", value: "25 kN", position: "4m" },
        { type: "udl", value: "10 kN/m", start: "0m", end: "4m" },
      ],
      dimensions: [
        { from: 0, to: 4, label: "4.0 m" },
        { from: 4, to: 8, label: "4.0 m" },
      ],
    },
  },
  circuit_logic: {
    label: "Digital Logic Circuit",
    icon: Cpu,
    spec: {
      type: "circuit",
      components: [
        { type: "and_gate", id: "G1", x: 100, y: 80, inputs: ["A", "B"], output: "W1" },
        { type: "or_gate", id: "G2", x: 250, y: 120, inputs: ["W1", "C"], output: "Y" },
      ],
      connections: [
        { from: "G1.output", to: "G2.input1" },
      ],
      labels: [
        { text: "Output Y = (A · B) + C", x: 180, y: 220 },
      ],
    },
  },
  process_flow: {
    label: "Process Flowchart",
    icon: Workflow,
    spec: {
      type: "flowchart",
      nodes: [
        { id: "start", type: "terminal", label: "Start Analysis", x: 50, y: 50 },
        { id: "proc1", type: "process", label: "Read Sensor (T, P)", x: 50, y: 130 },
        { id: "dec1", type: "decision", label: "T > 100°C?", x: 50, y: 220 },
        { id: "alarm", type: "process", label: "Trigger Cooling Pump", x: 220, y: 220 },
      ],
      connections: [
        { from: "start", to: "proc1" },
        { from: "proc1", to: "dec1" },
        { from: "dec1", to: "alarm", label: "Yes" },
      ],
    },
  },
  vector_geometry: {
    label: "Coordinate Geometry",
    icon: Sigma,
    spec: {
      type: "geometry",
      coordinate_system: "cartesian",
      origin: [150, 150],
      vectors: [
        { label: "F1 (40N)", dx: 80, dy: -60, color: "#9333ea" },
        { label: "F2 (30N)", dx: -50, dy: -40, color: "#2563eb" },
      ],
      resultant: { label: "R", dx: 30, dy: -100, color: "#16a34a" },
    },
  },
};

export const DiagramStudioModal: React.FC<DiagramStudioModalProps> = ({
  isOpen,
  onClose,
  initialSpec,
  courseCode = "CS301",
  courseId,
  questionId,
  onSaveSpec,
}) => {
  const defaultSpec = useMemo(
    () => initialSpec || PRESET_TEMPLATES.civil_beam.spec,
    [initialSpec]
  );

  const [jsonText, setJsonText] = useState(() => JSON.stringify(defaultSpec, null, 2));
  const [theme, setTheme] = useState<"academic" | "blueprint" | "vibrant">("academic");
  const [rendered, setRendered] = useState<DiagramRenderResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleCompile = useCallback(
    async (specToCompile?: Record<string, any>) => {
      try {
        setError(null);
        setLoading(true);
        let parsed = specToCompile;
        if (!parsed) {
          try {
            parsed = JSON.parse(jsonText);
          } catch (jsonErr: any) {
            setError(`Invalid JSON: ${jsonErr.message}`);
            setLoading(false);
            return;
          }
        }
        const res = await QuestionPaperStudioService.renderDiagram({
          diagram_spec: parsed,
          course_code: courseCode,
          upload_to_minio: true,
          theme,
        });
        setRendered(res);
      } catch (err: any) {
        console.error("Diagram compile error:", err);
        const msg = err?.response?.data?.detail || err.message || "Failed to render vector diagram";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [jsonText, courseCode, theme]
  );

  // Sync spec and auto-compile when modal opens or initialSpec changes
  useEffect(() => {
    if (isOpen) {
      const spec = initialSpec || PRESET_TEMPLATES.civil_beam.spec;
      setJsonText(JSON.stringify(spec, null, 2));
      handleCompile(spec);
    }
  }, [isOpen, initialSpec]);

  // Re-compile when theme changes while open
  useEffect(() => {
    if (isOpen) {
      handleCompile();
    }
  }, [theme]);

  // Prevent rendering DOM if modal is closed (called AFTER all hooks)
  if (!isOpen) return null;

  const handleSelectPreset = (key: string) => {
    const preset = PRESET_TEMPLATES[key];
    if (preset) {
      const formatted = JSON.stringify(preset.spec, null, 2);
      setJsonText(formatted);
      handleCompile(preset.spec);
    }
  };

  const handleDownloadSvg = () => {
    if (!rendered?.svg_content) return;
    const blob = new Blob([rendered.svg_content], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagram_${rendered.diagram_type || "vector"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Vector SVG downloaded!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="flex h-[88vh] w-full max-w-5xl flex-col rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden dark:border-gray-800 dark:bg-gray-900">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-6 py-4 dark:border-gray-800 dark:bg-gray-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Multi-Domain Diagram Studio
                </h2>
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-extrabold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  Vector SVG &lt;15ms
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Generate, live-edit, and attach pure SVG engineering schematics to assessment questions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Selector */}
            <div className="flex items-center rounded-xl bg-gray-200/60 p-1 dark:bg-gray-800">
              {(["academic", "blueprint", "vibrant"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition-all ${
                    theme === t
                      ? "bg-white text-purple-700 shadow-sm dark:bg-gray-700 dark:text-purple-300"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-200/60 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Preset Templates Bar */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-6 py-2.5 dark:border-gray-800 dark:bg-gray-900 overflow-x-auto">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 flex-shrink-0">
            Presets:
          </span>
          {Object.entries(PRESET_TEMPLATES).map(([key, item]) => {
            const IconComponent = item.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectPreset(key)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-all hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-600 dark:hover:text-purple-300 flex-shrink-0"
              >
                <IconComponent className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Workspace (Split Grid: Code Editor on Left, Live SVG on Right) */}
        <div className="grid flex-1 grid-cols-12 overflow-hidden">
          {/* Left: JSON Spec Editor */}
          <div className="col-span-5 flex flex-col border-r border-gray-100 bg-gray-900 p-4 text-white dark:border-gray-800 dark:bg-gray-950">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                <Code2 className="h-4 w-4 text-purple-400" />
                <span>Structured Spec (JSON)</span>
              </span>
              <button
                type="button"
                onClick={() => handleCompile()}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Compile</span>
              </button>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
              className="flex-1 resize-none rounded-xl border border-gray-800 bg-gray-950/80 p-3 font-mono text-xs leading-relaxed text-purple-200 focus:border-purple-500 focus:outline-none"
            />

            {error && (
              <div className="mt-2 rounded-lg border border-red-500/30 bg-red-950/40 p-2 text-xs text-red-300">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>

          {/* Right: Live SVG Viewport */}
          <div className="relative col-span-7 flex flex-col items-center justify-center bg-gray-50/60 p-6 dark:bg-gray-900/40 overflow-hidden">
            {/* Viewport Control Pill */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-xl border border-gray-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/90">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 text-[11px] font-mono font-bold text-gray-700 dark:text-gray-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* SVG Render Canvas */}
            <div className="flex flex-1 items-center justify-center w-full overflow-auto p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center text-center text-purple-600">
                  <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                    Compiling pure vector schematic...
                  </span>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center text-center p-6 max-w-md rounded-2xl border border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20">
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-2">
                    <X className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    Diagram Compilation Error
                  </h4>
                  <p className="text-xs text-red-600 dark:text-red-400 mb-3 font-mono break-all">
                    {error}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleCompile()}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
                  >
                    Retry Compile
                  </button>
                </div>
              ) : rendered ? (
                <div
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
                  className="w-[560px] max-w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-transform duration-150 dark:border-gray-700 dark:bg-gray-950 flex items-center justify-center"
                >
                  {rendered.svg_content ? (
                    <div
                      className="w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[380px]"
                      dangerouslySetInnerHTML={{ __html: rendered.svg_content }}
                    />
                  ) : (
                    <img
                      src={rendered.data_uri}
                      alt="Compiled Vector Engineering Diagram"
                      className="max-h-[380px] w-full object-contain mx-auto"
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-gray-400">
                  <Sparkles className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <span className="text-xs font-semibold">Click Compile to generate diagram preview</span>
                </div>
              )}
            </div>

            {/* Canvas Meta Bar */}
            {rendered && (
              <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Engine: {rendered.engine_used}
                </span>
                <span>Canvas: {rendered.width} × {rendered.height}px</span>
                {rendered.diagram_url && (
                  <span className="text-purple-600 dark:text-purple-400">
                    MinIO: Synced
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={handleDownloadSvg}
            disabled={!rendered}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" />
            <span>Download Vector (.SVG)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Cancel
            </button>

            {onSaveSpec && (
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonText);
                    const url = rendered?.diagram_url || rendered?.data_uri || "";
                    onSaveSpec(parsed, url);
                    onClose();
                  } catch (e) {
                    toast.error("Invalid JSON syntax in diagram specification");
                  }
                }}
                disabled={!rendered}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                <span>Attach Diagram to Question</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagramStudioModal;
