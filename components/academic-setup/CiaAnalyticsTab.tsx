import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  RotateCw,
  Layers,
  CheckSquare,
  Square,
  SlidersHorizontal,
  GraduationCap,
  Users,
} from "lucide-react";
import CourseAnalyticsService, {
  AnalyticsFilterTest,
  AnalyticsScoresResponse,
} from "@/services/courseAnalyticsService";
import ScoreChart, { ChartType } from "./analytics/ScoreChart";
import AxisControls from "./analytics/AxisControls";
import ExcludedStudentsModal from "./analytics/ExcludedStudentsModal";
import { binStudentScores, BandConfig } from "./analytics/binning";

interface CiaAnalyticsTabProps {
  courseId: number;
  lockedInstanceId?: number;
}

const CiaAnalyticsTab: React.FC<CiaAnalyticsTabProps> = ({
  courseId,
  lockedInstanceId,
}) => {
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [instances, setInstances] = useState<{ id: number; name: string; student_count: number }[]>([]);
  const [tests, setTests] = useState<AnalyticsFilterTest[]>([]);

  // Selection states
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<number[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  // Data & Chart controls
  const [scoresData, setScoresData] = useState<AnalyticsScoresResponse | null>(null);
  const [chartType, setChartType] = useState<ChartType>("spline");
  const [scaleMode, setScaleMode] = useState<"percent" | "raw">("percent");
  const [yAxisMode, setYAxisMode] = useState<"count" | "percent">("count");
  const [bandStep, setBandStep] = useState<number>(10);

  // 1. Load Filters
  const loadFilters = useCallback(async () => {
    try {
      setLoadingFilters(true);
      const res = await CourseAnalyticsService.getFilters(courseId, "CIA");
      setUserRole(res.role);
      setInstances(res.instances || []);
      setTests(res.tests || []);

      // If lockedInstanceId is passed, use it, else pick all available instances
      if (lockedInstanceId) {
        setSelectedInstanceIds([lockedInstanceId]);
      } else if (res.instances && res.instances.length > 0) {
        setSelectedInstanceIds(res.instances.map((i) => i.id));
      }

      // Pre-select first 2 tests if available
      if (res.tests && res.tests.length > 0) {
        setSelectedTestIds(res.tests.slice(0, 2).map((t) => t.id));
      }
    } catch (err: any) {
      console.error("Failed to load CIA filters:", err);
    } finally {
      setLoadingFilters(false);
    }
  }, [courseId, lockedInstanceId]);

  useEffect(() => {
    if (courseId) {
      loadFilters();
    }
  }, [courseId, loadFilters]);

  // 2. Fetch Scores whenever instance or test selection changes
  const fetchScores = useCallback(async () => {
    if (selectedInstanceIds.length === 0 || selectedTestIds.length === 0) {
      setScoresData(null);
      return;
    }
    try {
      setLoadingScores(true);
      const data = await CourseAnalyticsService.getScores(
        courseId,
        "CIA",
        selectedInstanceIds,
        selectedTestIds
      );
      setScoresData(data);
      if (!data.can_use_raw_marks && scaleMode === "raw") {
        setScaleMode("percent");
      }
    } catch (err) {
      console.error("Failed to fetch CIA scores:", err);
      setScoresData(null);
    } finally {
      setLoadingScores(false);
    }
  }, [courseId, selectedInstanceIds, selectedTestIds, scaleMode]);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Toggle instance selection
  const toggleInstance = (id: number) => {
    if (lockedInstanceId) return;
    setSelectedInstanceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Toggle test selection
  const toggleTest = (id: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Compute binned data
  const binnedResult = useMemo(() => {
    if (!scoresData || !scoresData.series || scoresData.series.length === 0) {
      return { categories: [], series: [], collisionMap: new Map() };
    }

    const bandConfig: BandConfig = {
      min: 0,
      max: scaleMode === "raw" ? 50 : 100, // or test max
      step: bandStep,
    };

    if (scaleMode === "raw") {
      const maxVals = Object.values(scoresData.test_max_marks || {});
      if (maxVals.length > 0) {
        bandConfig.max = Math.max(...maxVals);
      }
    }

    return binStudentScores(
      scoresData.series,
      scaleMode === "raw",
      yAxisMode,
      bandConfig
    );
  }, [scoresData, scaleMode, yAxisMode, bandStep]);

  if (loadingFilters) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <RotateCw className="h-4 w-4 animate-spin text-indigo-600" />
        Loading CIA Analytics filters...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header & Role Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              CIA Performance Distribution & Analytics
            </h2>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300">
              {userRole}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare student score frequencies across multiple sections on a single plane with adjustable scales
          </p>
        </div>

        <button
          onClick={fetchScores}
          disabled={loadingScores}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <RotateCw className={`h-3.5 w-3.5 ${loadingScores ? "animate-spin text-indigo-600" : ""}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Filter Selection Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Instance Selector */}
        {!lockedInstanceId && (
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-indigo-600" />
                Select Instances ({selectedInstanceIds.length}/{instances.length}):
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <button
                  onClick={() => setSelectedInstanceIds(instances.map((i) => i.id))}
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Select All
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => setSelectedInstanceIds([])}
                  className="font-semibold text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {instances.map((inst) => {
                const selected = selectedInstanceIds.includes(inst.id);
                return (
                  <button
                    key={inst.id}
                    onClick={() => toggleInstance(inst.id)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                      selected
                        ? "border-indigo-500 bg-indigo-50/70 text-indigo-800 font-semibold dark:border-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-200"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="h-3.5 w-3.5 text-indigo-600" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span>{inst.name}</span>
                    <span className="ml-1 rounded bg-white px-1.5 py-0.2 text-[10px] text-slate-500 border border-slate-200/60 dark:bg-slate-900">
                      {inst.student_count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Test Selector */}
        <div className={`rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 ${lockedInstanceId ? 'col-span-2' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
              Select CIA Tests ({selectedTestIds.length}/{tests.length}):
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                onClick={() => setSelectedTestIds(tests.map((t) => t.id))}
                className="font-semibold text-emerald-600 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => setSelectedTestIds([])}
                className="font-semibold text-slate-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {tests.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No CIA tests found for this course.</span>
            ) : (
              tests.map((t) => {
                const selected = selectedTestIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTest(t.id)}
                    className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                      selected
                        ? "border-emerald-500 bg-emerald-50/70 text-emerald-800 font-semibold dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200"
                        : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {selected ? (
                      <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <span>{t.name}</span>
                    <span className="ml-1 text-[10px] text-slate-400 font-mono">
                      (Max: {t.max_marks}m)
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Attendance & Incomplete Test Exclusions Notice */}
      <ExcludedStudentsModal excludedSummary={scoresData?.excluded_summary} />

      {/* Axis & Scale Adjustment Controls */}
      <AxisControls
        chartType={chartType}
        onChartTypeChange={setChartType}
        scaleMode={scaleMode}
        onScaleModeChange={setScaleMode}
        canUseRawMarks={scoresData?.can_use_raw_marks ?? false}
        yAxisMode={yAxisMode}
        onYAxisModeChange={setYAxisMode}
        bandStep={bandStep}
        onBandStepChange={setBandStep}
      />

      {/* Graph Visualizer */}
      <div className="relative">
        {loadingScores && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-xs rounded-2xl dark:bg-slate-900/60">
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
              <RotateCw className="h-4 w-4 animate-spin text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Updating distribution...
              </span>
            </div>
          </div>
        )}

        <ScoreChart
          binnedData={binnedResult}
          chartType={chartType}
          yAxisMode={yAxisMode}
          xAxisTitle={scaleMode === "raw" ? "Raw Marks Bands" : "Normalized Percentage Bands (%)"}
          height={420}
        />
      </div>
    </div>
  );
};

export default CiaAnalyticsTab;
