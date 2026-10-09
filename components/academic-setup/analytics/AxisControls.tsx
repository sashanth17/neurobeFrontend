import React from "react";
import {
  TrendingUp,
  BarChart3,
  ScatterChart as ScatterIcon,
  PieChart as PieIcon,
  Layers,
  CircleDot,
  Radio,
  Sliders,
} from "lucide-react";
import { ChartType } from "./ScoreChart";

interface AxisControlsProps {
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  scaleMode: "percent" | "raw";
  onScaleModeChange: (mode: "percent" | "raw") => void;
  canUseRawMarks: boolean;
  yAxisMode: "count" | "percent";
  onYAxisModeChange: (mode: "count" | "percent") => void;
  bandStep: number;
  onBandStepChange: (step: number) => void;
}

const CHART_TYPES: { id: ChartType; label: string; icon: React.ReactNode }[] = [
  { id: "line", label: "Line", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "spline", label: "Spline", icon: <TrendingUp className="h-4 w-4 stroke-[2.5]" /> },
  { id: "bar", label: "Grouped Bar", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "histogram", label: "Histogram", icon: <Layers className="h-4 w-4" /> },
  { id: "scatter", label: "Scatter", icon: <ScatterIcon className="h-4 w-4" /> },
  { id: "bubble", label: "Bubble", icon: <CircleDot className="h-4 w-4" /> },
  { id: "radar", label: "Radar", icon: <Radio className="h-4 w-4" /> },
  { id: "pie", label: "Pie", icon: <PieIcon className="h-4 w-4" /> },
];

const AxisControls: React.FC<AxisControlsProps> = ({
  chartType,
  onChartTypeChange,
  scaleMode,
  onScaleModeChange,
  canUseRawMarks,
  yAxisMode,
  onYAxisModeChange,
  bandStep,
  onBandStepChange,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
      {/* Chart Type Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Chart:
        </span>
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
          {CHART_TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => onChartTypeChange(t.id)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                chartType === t.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/60"
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Axis & Scale Adjustment */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* X-Axis Scale: Percent vs Raw */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">X-Scale:</span>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => onScaleModeChange("percent")}
              className={`rounded px-2 py-0.5 font-semibold transition-all ${
                scaleMode === "percent"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
              }`}
            >
              Percent (0–100%)
            </button>
            <button
              onClick={() => canUseRawMarks && onScaleModeChange("raw")}
              disabled={!canUseRawMarks}
              title={
                !canUseRawMarks
                  ? "Raw marks mode is disabled because selected tests have different maximum marks."
                  : ""
              }
              className={`rounded px-2 py-0.5 font-semibold transition-all ${
                scaleMode === "raw"
                  ? "bg-indigo-600 text-white"
                  : !canUseRawMarks
                  ? "cursor-not-allowed opacity-40 text-slate-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
              }`}
            >
              Raw Marks
            </button>
          </div>
        </div>

        {/* Band Width Slider/Buttons */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Band Width:</span>
          <select
            value={bandStep}
            onChange={(e) => onBandStepChange(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-700 shadow-sm focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={5}>5 marks / band</option>
            <option value={10}>10 marks / band</option>
            <option value={20}>20 marks / band</option>
          </select>
        </div>

        {/* Y-Axis Mode: Student Count vs % of Class */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500">Y-Axis:</span>
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => onYAxisModeChange("count")}
              className={`rounded px-2 py-0.5 font-semibold transition-all ${
                yAxisMode === "count"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
              }`}
            >
              Count
            </button>
            <button
              onClick={() => onYAxisModeChange("percent")}
              className={`rounded px-2 py-0.5 font-semibold transition-all ${
                yAxisMode === "percent"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300"
              }`}
            >
              % of Class
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AxisControls;
