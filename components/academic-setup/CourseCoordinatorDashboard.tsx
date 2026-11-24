import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import {
  GraduationCap,
  Users,
  Layers,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Filter,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CheckCircle2,
  Calendar,
  Grid3X3,
  BookOpen,
  PieChart,
  BarChart3,
  ExternalLink,
  X,
  Target,
  Award,
  Sliders,
} from "lucide-react";
import Models from "@/imports/models.import";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CourseCoordinatorDashboardProps {
  courseId: number | string;
  courseMetadata?: any;
  onNavigateToTab?: (tab: string) => void;
}

export default function CourseCoordinatorDashboard({
  courseId,
  courseMetadata,
  onNavigateToTab,
}: CourseCoordinatorDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<"overview" | "classrooms" | "drilldown">("overview");

  // Dual-tab analytics (Section 5.1): "insights" vs "suggestions"
  const [analyticsTab, setAnalyticsTab] = useState<"insights" | "suggestions">("insights");

  // Assessment Drill-Down Modal State (Section 2.3)
  const [showDrilldownModal, setShowDrilldownModal] = useState(false);
  const [drilldownType, setDrilldownType] = useState<"CIA" | "MCQ">("CIA");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | number>("ALL");
  const [selectedKLevel, setSelectedKLevel] = useState<string>("ALL");
  const [drilldownChartType, setDrilldownChartType] = useState<"bar" | "line">("bar");

  // Attainment Detail Modal State (Section 2.4)
  const [showAttainmentModal, setShowAttainmentModal] = useState(false);

  // Fetch coordinator dashboard analytics
  const fetchDashboard = useCallback(async (silent = false) => {
    if (!courseId) return;
    if (!silent) setLoading(true);
    try {
      const data: any = await Models.course.coordinator_dashboard(courseId);
      setDashboardData(data);
    } catch (err: any) {
      console.error("Failed to load coordinator dashboard:", err);
      Failure(getErrorMessage(err, "Failed to load course coordinator dashboard"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  // Data helpers
  const counters = dashboardData?.metadata_counters || { total_classrooms: 0, total_instructors: 0 };
  const heatmap = dashboardData?.copo_heatmap || { has_data: false, cos: [], pos: [], cells: [] };
  const assessment = dashboardData?.assessment_performance || { has_data: false, mark_ranges: {} };
  const coAttainment = dashboardData?.co_attainment || { has_data: false, attainments: [] };
  const qbSummary = dashboardData?.question_bank_summary || { total_questions: 0, total_marks: 0, by_knowledge_level: {} };
  const classrooms = dashboardData?.classrooms || [];
  const keyInsights = dashboardData?.dual_tab_analytics?.key_insights || [];
  const suggestions = dashboardData?.dual_tab_analytics?.suggestions_remedies || [];

  // Abstract Donut Chart for Assessment Performance (Section 2.3)
  const donutSeries = useMemo(() => {
    if (!assessment.has_data || assessment.overall_pass_percentage === null) return [0, 100];
    const pass = assessment.overall_pass_percentage;
    const fail = Math.max(0, 100 - pass);
    return [pass, fail];
  }, [assessment]);

  const donutOptions: any = useMemo(() => ({
    chart: { type: "donut", fontFamily: "inherit" },
    labels: ["Passed (≥50%)", "Failed (<50%)"],
    colors: ["#10b981", "#ef4444"],
    legend: { position: "bottom", labels: { colors: "#64748b" } },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Overall Pass",
              fontSize: "12px",
              color: "#64748b",
              formatter: () => (assessment.overall_pass_percentage !== null ? `${assessment.overall_pass_percentage}%` : "No Data"),
            },
            value: {
              fontSize: "20px",
              fontWeight: 700,
              color: "#0f172a",
              formatter: () => (assessment.overall_pass_percentage !== null ? `${assessment.overall_pass_percentage}%` : "N/A"),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      y: { formatter: (val: number) => `${val.toFixed(1)}%` },
    },
    stroke: { width: 0 },
  }), [assessment]);

  // Single Bar Chart for CO Attainment (Section 2.4)
  const coBarSeries = useMemo(() => {
    const vals = (coAttainment.attainments || []).map((c: any) => c.percentage || 0);
    return [{ name: "Current Attainment (%)", data: vals }];
  }, [coAttainment]);

  const coBarOptions: any = useMemo(() => ({
    chart: { type: "bar", height: 180, toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "40%",
        distributed: true,
      },
    },
    colors: ["#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b"],
    xaxis: {
      categories: (coAttainment.attainments || []).map((c: any) => c.co_code),
      labels: { style: { colors: "#64748b", fontSize: "11px", fontWeight: 600 } },
    },
    yaxis: {
      max: 100,
      labels: { formatter: (val: number) => `${val}%`, style: { colors: "#64748b" } },
    },
    grid: { borderColor: "#f1f5f9" },
    legend: { show: false },
    dataLabels: {
      enabled: true,
      formatter: (val: number, opts: any) => {
        const item = coAttainment.attainments?.[opts.dataPointIndex];
        return item && item.is_calculated ? `${val}%` : "Pending";
      },
      style: { fontSize: "10px", colors: ["#ffffff"] },
    },
  }), [coAttainment]);

  // Mark Range Distribution Bar Chart (Section 2.3 drilldown)
  const markRangeSeries = useMemo(() => {
    const ranges = assessment.mark_ranges || {};
    return [{ name: "Students", data: Object.values(ranges) as number[] }];
  }, [assessment]);

  const markRangeOptions: any = useMemo(() => ({
    chart: { type: drilldownChartType, toolbar: { show: false }, fontFamily: "inherit" },
    plotOptions: {
      bar: { borderRadius: 4, columnWidth: "45%" },
    },
    colors: ["#8b5cf6"],
    xaxis: {
      categories: Object.keys(assessment.mark_ranges || {}),
      labels: { style: { colors: "#64748b", fontSize: "10px" } },
    },
    yaxis: {
      labels: { style: { colors: "#64748b" } },
    },
    grid: { borderColor: "#f1f5f9" },
    dataLabels: { enabled: true },
  }), [assessment, drilldownChartType]);

  // Build matrix lookup for 4-tier heatmap
  const matrixCellMap = useMemo(() => {
    const map: Record<string, any> = {};
    (heatmap.cells || []).forEach((c: any) => {
      map[`${c.co_code}-${c.po_code}`] = c;
    });
    return map;
  }, [heatmap]);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading course coordinator intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header Banner with Metadata Counters (Section 2.2) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-sm dark:border-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300 ring-1 ring-indigo-500/30">
                Course Coordinator Workspace
              </span>
              <span className="text-xs text-slate-300">•</span>
              <span className="text-xs text-slate-300">{dashboardData?.course_code}</span>
            </div>
            <h1 className="mt-1.5 text-xl font-extrabold tracking-tight sm:text-2xl">
              {dashboardData?.course_title || "Course Dashboard"}
            </h1>
            <p className="mt-1 text-xs text-slate-300">
              Department of {dashboardData?.department_name} • {dashboardData?.programme_name}
            </p>
          </div>

          {/* Metadata Counters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-xs ring-1 ring-white/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/30 text-indigo-300">
                <Grid3X3 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-300">Total Classrooms</p>
                <p className="text-lg font-bold text-white">{counters.total_classrooms}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-xs ring-1 ring-white/10">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/30 text-emerald-300">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-300">Assigned Instructors</p>
                <p className="text-lg font-bold text-white">{counters.total_instructors}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchDashboard(false)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 transition active:scale-95"
              title="Refresh Dashboard"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Top-Level Abstract Row (Section 1.4 & 2.3): Donut Pass %, CO Attainment, Question Bank Card ── */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: Assessment Performance (Abstract) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <PieChart className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Assessment Performance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDrilldownModal(true)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-0.5"
              >
                <span>View Details</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Donut Chart */}
            <div className="my-2 h-48 flex items-center justify-center">
              {assessment.has_data ? (
                <ReactApexChart
                  options={donutOptions}
                  series={donutSeries}
                  type="donut"
                  height={190}
                  width="100%"
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs font-semibold text-slate-400">No assessment scores recorded</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Threshold: 50% pass mark</p>
                </div>
              )}
            </div>
          </div>

          {/* Latest Assessment Tags */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <div>
              <span className="text-slate-400">Latest CIA: </span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {assessment.latest_cia?.pass_percentage !== null && assessment.latest_cia?.pass_percentage !== undefined
                  ? `${assessment.latest_cia.pass_percentage}%`
                  : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Latest MCQ: </span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {assessment.latest_mcq?.pass_percentage !== null && assessment.latest_mcq?.pass_percentage !== undefined
                  ? `${assessment.latest_mcq.pass_percentage}%`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: CO-PO Attainment Bar Chart (Section 2.4) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  CO Attainment ("As of Now")
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAttainmentModal(true)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 inline-flex items-center gap-0.5"
              >
                <span>View Details</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Single Bar Chart */}
            <div className="my-2 h-48 flex items-center justify-center">
              {coAttainment.has_data ? (
                <ReactApexChart
                  options={coBarOptions}
                  series={coBarSeries}
                  type="bar"
                  height={180}
                  width="100%"
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs font-semibold text-slate-400">Yet to be calculated</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Awaiting direct assessment results</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Status: CO1 – CO5</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Target: ≥ 60%</span>
          </div>
        </div>

        {/* Card 3: Question Bank Summary Card (Section 2.5) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                  <Layers className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Question Bank Summary
                </h3>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/neurobe/question-bank/${courseId}`)}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 inline-flex items-center gap-0.5"
              >
                <span>View Bank</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Total Questions & Total Marks */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-[10px] font-bold uppercase text-slate-400">Total Questions</p>
                <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">
                  {qbSummary.total_questions}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Instructor-Authored</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <p className="text-[10px] font-bold uppercase text-slate-400">Total Marks</p>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
                  {qbSummary.total_marks}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">From Approved Papers</p>
              </div>
            </div>

            {/* Knowledge Level Breakdown (K1, K2, K3) */}
            <div className="mt-4 space-y-2">
              {["K1", "K2", "K3"].map((k) => {
                const stat = qbSummary.by_knowledge_level?.[k] || { questions: 0, marks: 0 };
                return (
                  <div key={k} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/60 last:border-none">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{k} Level</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">{stat.questions} Qs</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-bold text-purple-600 dark:text-purple-400">{stat.marks} Marks</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Trigger (Section 1.2 & 2.5) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => router.push(`/neurobe/question-bank/${courseId}`)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-50 py-2.5 text-xs font-bold text-purple-700 hover:bg-purple-100 transition dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/40"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>View Course Question Bank</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CO-PO Mapping Heatmap (Section 2.1: 4-Tier Articulation Matrix) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                <Grid3X3 className="h-4 w-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                CO-PO Articulation Matrix / Heatmap
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Visual 4-tier correlation scale (Level 3 Dark Green, Level 2 Medium Green, Level 1 Light Green, Level 0 White)
            </p>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-700" />
              <span className="text-[11px] text-slate-600 dark:text-slate-400">Level 3 (High)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-400" />
              <span className="text-[11px] text-slate-600 dark:text-slate-400">Level 2 (Mod)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-100 dark:bg-emerald-950/60" />
              <span className="text-[11px] text-slate-600 dark:text-slate-400">Level 1 (Low)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-800" />
              <span className="text-[11px] text-slate-600 dark:text-slate-400">Level 0 (None)</span>
            </div>
          </div>
        </div>

        {heatmap.has_data && heatmap.cos.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 text-left">Course Outcome</th>
                  {heatmap.pos.map((po: string) => (
                    <th key={po} className="p-2.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {po}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.cos.map((co: string) => (
                  <tr key={co} className="border-b border-slate-100 dark:border-slate-800 last:border-none">
                    <td className="p-2.5 text-xs font-bold text-slate-800 dark:text-white text-left bg-slate-50/50 dark:bg-slate-800/30">
                      {co}
                    </td>
                    {heatmap.pos.map((po: string) => {
                      const cell = matrixCellMap[`${co}-${po}`];
                      const lvl = cell ? cell.correlation_level : 0;
                      let cellClass = "bg-white text-slate-400 dark:bg-slate-900";
                      if (lvl === 3) cellClass = "bg-emerald-700 text-white font-bold";
                      else if (lvl === 2) cellClass = "bg-emerald-500 text-white font-semibold";
                      else if (lvl === 1) cellClass = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300";

                      return (
                        <td key={po} className={`p-2.5 text-xs transition-colors ${cellClass}`} title={cell?.justification || ""}>
                          {lvl > 0 ? lvl : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400">No active CO-PO matrix loaded</p>
            <p className="text-[11px] text-slate-400 mt-1">Configure and approve CO-PO mapping to render the articulation matrix.</p>
          </div>
        )}
      </div>

      {/* ── Classroom-Wise Performance Table (Section 2.6) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Classroom-Wise Performance
              </h3>
              <p className="text-xs text-slate-400">
                Active classrooms mapped to this course across all participating sections & batches
              </p>
            </div>
          </div>
        </div>

        {classrooms.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Classroom / Section</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Department</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300">Assigned Instructor</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-center">Enrolled Students</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-center">Pass % (≥50%)</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-center">Avg Score</th>
                  <th className="p-3 font-bold text-slate-700 dark:text-slate-300 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {classrooms.map((c: any) => (
                  <tr key={c.instance_id} className="border-b border-slate-100 dark:border-slate-800 last:border-none hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                      {c.classroom_name}
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{c.department_name}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400 font-medium">{c.instructor_name}</td>
                    <td className="p-3 text-center text-slate-700 dark:text-slate-300">{c.enrolled_students}</td>
                    <td className="p-3 text-center">
                      {c.has_data ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          c.pass_percentage >= 70
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : c.pass_percentage >= 50
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                        }`}>
                          {c.pass_percentage}%
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No marks</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {c.average_score !== null ? `${c.average_score}%` : "-"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => router.push(`/neurobe/course-instance/${c.instance_id}?courseId=${courseId}`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-slate-700 hover:bg-slate-100 transition dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <span>Open Dashboard</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-400">No classrooms created for this course</p>
          </div>
        )}
      </div>

      {/* ── Dual-Tab Analytics Component: Key Insights & Actionable Suggestions (Sections 5.1 – 5.3) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setAnalyticsTab("insights")}
              className={`flex items-center gap-2 pb-2 text-xs font-bold transition border-b-2 -mb-3 ${
                analyticsTab === "insights"
                  ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              <span>Key Insights (Deterministic)</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] dark:bg-slate-800">
                {keyInsights.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setAnalyticsTab("suggestions")}
              className={`flex items-center gap-2 pb-2 text-xs font-bold transition border-b-2 -mb-3 ${
                analyticsTab === "suggestions"
                  ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Suggestions & Remedies (AI)</span>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] dark:bg-slate-800">
                {suggestions.length}
              </span>
            </button>
          </div>
        </div>

        <div className="pt-4">
          {analyticsTab === "insights" && (
            <div className="space-y-3">
              {keyInsights.map((ins: any, idx: number) => {
                let badgeClass = "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300";
                if (ins.type === "danger") badgeClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300";
                if (ins.type === "warning") badgeClass = "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300";
                if (ins.type === "success") badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300";

                return (
                  <div key={idx} className={`rounded-xl border p-3.5 transition-all ${badgeClass}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{ins.category}</span>
                    </div>
                    <h4 className="text-xs font-bold mt-1 text-slate-900 dark:text-white">{ins.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{ins.detail}</p>
                  </div>
                );
              })}
            </div>
          )}

          {analyticsTab === "suggestions" && (
            <div className="space-y-3">
              {suggestions.map((sug: any, idx: number) => (
                <div key={idx} className="rounded-xl border border-purple-100 bg-purple-50/40 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900/60 dark:text-purple-300">
                      Priority: {sug.priority}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1.5">{sug.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    <strong>Rationale:</strong> {sug.rationale}
                  </p>
                  <div className="mt-2.5 rounded-lg bg-white p-2.5 border border-purple-100 dark:bg-slate-900 dark:border-purple-900/50">
                    <p className="text-xs font-medium text-purple-900 dark:text-purple-300">
                      👉 <strong>Action Plan:</strong> {sug.recommended_action}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Assessment Performance Drill-Down Modal (Section 1.4 & 2.3) ── */}
      {showDrilldownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Assessment Performance Granular Breakdown
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDrilldownModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Bar (Section 2.3: CIA Selector, MCQ Selector, Knowledge Level K1-K3) */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Assessment Mode</label>
                <select
                  value={drilldownType}
                  onChange={(e) => setDrilldownType(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="CIA">CIA Question Papers</option>
                  <option value="MCQ">MCQ Quizzes</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Specific Test</label>
                <select
                  value={selectedAssessmentId}
                  onChange={(e) => setSelectedAssessmentId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="ALL">All {drilldownType} Tests (Aggregated)</option>
                  {(drilldownType === "CIA" ? assessment.available_cia_tests : assessment.available_mcq_tests)?.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase">Knowledge Level Filter</label>
                <select
                  value={selectedKLevel}
                  onChange={(e) => setSelectedKLevel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="ALL">All K-Levels</option>
                  <option value="K1">K1 - Remembering</option>
                  <option value="K2">K2 - Understanding</option>
                  <option value="K3">K3 - Applying</option>
                </select>
              </div>
            </div>

            {/* Chart Type Toggle & Mark-Range Distribution */}
            <div className="mt-6 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Student Mark Range Distribution
              </h4>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setDrilldownChartType("bar")}
                  className={`rounded px-2 py-1 text-xs font-semibold ${drilldownChartType === "bar" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Bar Chart
                </button>
                <button
                  type="button"
                  onClick={() => setDrilldownChartType("line")}
                  className={`rounded px-2 py-1 text-xs font-semibold ${drilldownChartType === "line" ? "bg-indigo-600 text-white" : "text-slate-600 dark:text-slate-400"}`}
                >
                  Line Graph
                </button>
              </div>
            </div>

            <div className="mt-3 h-64">
              <ReactApexChart
                options={markRangeOptions}
                series={markRangeSeries}
                type={drilldownChartType}
                height={240}
                width="100%"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDrilldownModal(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CO Attainment Drill-Down Modal (Section 2.4) ── */}
      {showAttainmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Course Outcome Attainment Calculations
              </h3>
              <button
                type="button"
                onClick={() => setShowAttainmentModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {(coAttainment.attainments || []).map((co: any) => (
                <div key={co.co_code} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{co.co_code}</span>
                    <p className="text-[11px] text-slate-500">Benchmark Target: 60%</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                      {co.status_text}
                    </span>
                    {co.is_calculated && (
                      <p className="text-[11px] text-slate-500">3-point Level: {co.attainment_level}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAttainmentModal(false)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
