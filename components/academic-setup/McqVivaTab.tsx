import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  RotateCw,
  Search,
  Users,
  GraduationCap,
  CheckSquare,
  Square,
  FileText,
  Download,
  X,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Award,
  Sparkles,
  BarChart2,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import CourseAnalyticsService, {
  AnalyticsFilterTest,
  AnalyticsScoresResponse,
  McqStudentSummary,
  StudentDashboardResponse,
} from "@/services/courseAnalyticsService";
import ScoreChart, { ChartType } from "./analytics/ScoreChart";
import AxisControls from "./analytics/AxisControls";
import ExcludedStudentsModal from "./analytics/ExcludedStudentsModal";
import { binStudentScores, BandConfig } from "./analytics/binning";
import { generateStudentDashboardPdf } from "@/services/studentDashboardPdf";
import { BACKEND_URL } from "@/utils/constant.utils";

interface McqVivaTabProps {
  courseId: number;
  lockedInstanceId?: number;
}

const McqVivaTab: React.FC<McqVivaTabProps> = ({
  courseId,
  lockedInstanceId,
}) => {
  const [subView, setSubView] = useState<"graph" | "roster">("graph");

  // Filters & Options
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingScores, setLoadingScores] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [instances, setInstances] = useState<{ id: number; name: string; student_count: number }[]>([]);
  const [tests, setTests] = useState<AnalyticsFilterTest[]>([]);

  // Selection states for graph
  const [selectedInstanceIds, setSelectedInstanceIds] = useState<number[]>([]);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  // Data & Chart controls
  const [scoresData, setScoresData] = useState<AnalyticsScoresResponse | null>(null);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [scaleMode, setScaleMode] = useState<"percent" | "raw">("percent");
  const [yAxisMode, setYAxisMode] = useState<"count" | "percent">("count");
  const [bandStep, setBandStep] = useState<number>(10);

  // Roster state
  const [roster, setRoster] = useState<McqStudentSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [rosterInstanceFilter, setRosterInstanceFilter] = useState<string>("ALL");

  // Student Dossier Modal
  const [activeStudentReg, setActiveStudentReg] = useState<string | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardData, setDashboardData] = useState<StudentDashboardResponse | null>(null);
  const [isVivaReportExpanded, setIsVivaReportExpanded] = useState(false);

  // Lazy Paper View Modal
  const [paperModalUrl, setPaperModalUrl] = useState<string | null>(null);

  // 1. Load Filters
  const loadFilters = useCallback(async () => {
    try {
      setLoadingFilters(true);
      const res = await CourseAnalyticsService.getFilters(courseId, "MCQ");
      setUserRole(res.role);
      setInstances(res.instances || []);
      setTests(res.tests || []);

      if (lockedInstanceId) {
        setSelectedInstanceIds([lockedInstanceId]);
      } else if (res.instances && res.instances.length > 0) {
        setSelectedInstanceIds(res.instances.map((i) => i.id));
      }

      if (res.tests && res.tests.length > 0) {
        setSelectedTestIds(res.tests.slice(0, 2).map((t) => t.id));
      }
    } catch (err: any) {
      console.error("Failed to load MCQ filters:", err);
    } finally {
      setLoadingFilters(false);
    }
  }, [courseId, lockedInstanceId]);

  useEffect(() => {
    if (courseId) {
      loadFilters();
    }
  }, [courseId, loadFilters]);

  // 2. Fetch Scores for Graph
  const fetchScores = useCallback(async () => {
    if (selectedInstanceIds.length === 0 || selectedTestIds.length === 0) {
      setScoresData(null);
      return;
    }
    try {
      setLoadingScores(true);
      const data = await CourseAnalyticsService.getScores(
        courseId,
        "MCQ",
        selectedInstanceIds,
        selectedTestIds
      );
      setScoresData(data);
    } catch (err) {
      console.error("Failed to fetch MCQ scores:", err);
      setScoresData(null);
    } finally {
      setLoadingScores(false);
    }
  }, [courseId, selectedInstanceIds, selectedTestIds]);

  useEffect(() => {
    if (subView === "graph") {
      fetchScores();
    }
  }, [fetchScores, subView]);

  // 3. Fetch Roster for Student Dossiers
  const fetchRoster = useCallback(async () => {
    try {
      setLoadingRoster(true);
      const targetIds = lockedInstanceId ? [lockedInstanceId] : undefined;
      const data = await CourseAnalyticsService.getMcqStudents(courseId, targetIds);
      setRoster(data || []);
    } catch (err) {
      console.error("Failed to fetch MCQ roster:", err);
      setRoster([]);
    } finally {
      setLoadingRoster(false);
    }
  }, [courseId, lockedInstanceId]);

  useEffect(() => {
    if (subView === "roster") {
      fetchRoster();
    }
  }, [fetchRoster, subView]);

  // 4. Open Student Dashboard
  const openDashboard = async (regNo: string) => {
    try {
      setActiveStudentReg(regNo);
      setLoadingDashboard(true);
      setIsVivaReportExpanded(false);
      const data = await CourseAnalyticsService.getStudentDashboard(courseId, regNo);
      setDashboardData(data);
    } catch (err) {
      console.error("Failed to load student dashboard:", err);
    } finally {
      setLoadingDashboard(false);
    }
  };

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
      max: 100,
      step: bandStep,
    };
    return binStudentScores(
      scoresData.series,
      false, // MCQ is percentage based
      yAxisMode,
      bandConfig
    );
  }, [scoresData, yAxisMode, bandStep]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter((st) => {
      const matchesSearch =
        searchQuery === "" ||
        st.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.register_no.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesInst =
        rosterInstanceFilter === "ALL" || String(st.instance_id) === rosterInstanceFilter;

      return matchesSearch && matchesInst;
    });
  }, [roster, searchQuery, rosterInstanceFilter]);

  if (loadingFilters) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <RotateCw className="h-4 w-4 animate-spin text-emerald-600" />
        Loading MCQ & Viva Workspace...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Bar with Sub-View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              MCQ Assessment & Viva System
            </h2>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {userRole}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare MCQ score distributions and review comprehensive student dossiers with AI viva reports
          </p>
        </div>

        {/* View Switcher: Graph vs Student Roster */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            onClick={() => setSubView("graph")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              subView === "graph"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            <span>Distribution Graph</span>
          </button>
          <button
            onClick={() => setSubView("roster")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              subView === "roster"
                ? "bg-white text-emerald-700 shadow-xs dark:bg-slate-900 dark:text-emerald-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Student Roster & Reports</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SUBVIEW 1: DISTRIBUTION GRAPH                               */}
      {/* ─────────────────────────────────────────────────────────── */}
      {subView === "graph" && (
        <div className="space-y-4">
          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!lockedInstanceId && (
              <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                    Select Instances ({selectedInstanceIds.length}/{instances.length}):
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      onClick={() => setSelectedInstanceIds(instances.map((i) => i.id))}
                      className="font-semibold text-emerald-600 hover:underline"
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
                            ? "border-emerald-500 bg-emerald-50/70 text-emerald-800 font-semibold dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {selected ? (
                          <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
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

            <div className={`rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 ${lockedInstanceId ? 'col-span-2' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
                  Select MCQ Tests ({selectedTestIds.length}/{tests.length}):
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() => setSelectedTestIds(tests.map((t) => t.id))}
                    className="font-semibold text-indigo-600 hover:underline"
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
                  <span className="text-xs text-slate-400 italic">No MCQ tests available.</span>
                ) : (
                  tests.map((t) => {
                    const selected = selectedTestIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => toggleTest(t.id)}
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
                        <span>{t.name}</span>
                        {t.have_viva && (
                          <span className="ml-1 rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                            +Viva
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Excluded Students Notice */}
          <ExcludedStudentsModal excludedSummary={scoresData?.excluded_summary} />

          {/* Axis Controls */}
          <AxisControls
            chartType={chartType}
            onChartTypeChange={setChartType}
            scaleMode={scaleMode}
            onScaleModeChange={setScaleMode}
            canUseRawMarks={false}
            yAxisMode={yAxisMode}
            onYAxisModeChange={setYAxisMode}
            bandStep={bandStep}
            onBandStepChange={setBandStep}
          />

          {/* Chart Display */}
          <div className="relative">
            {loadingScores && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-xs rounded-2xl dark:bg-slate-900/60">
                <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                  <RotateCw className="h-4 w-4 animate-spin text-emerald-600" />
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
              xAxisTitle="MCQ Percentage Score Bands (%)"
              height={420}
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SUBVIEW 2: STUDENT ROSTER & INDIVIDUAL DOSSIERS             */}
      {/* ─────────────────────────────────────────────────────────── */}
      {subView === "roster" && (
        <div className="space-y-4">
          {/* Controls: Search and Instance Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name or register no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-800 shadow-2xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
              </div>

              {!lockedInstanceId && instances.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-slate-500">Instance:</span>
                  <select
                    value={rosterInstanceFilter}
                    onChange={(e) => setRosterInstanceFilter(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="ALL">All Sections</option>
                    {instances.map((i) => (
                      <option key={i.id} value={String(i.id)}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={fetchRoster}
              disabled={loadingRoster}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RotateCw className={`h-3.5 w-3.5 ${loadingRoster ? "animate-spin text-emerald-600" : ""}`} />
              <span>Refresh Roster</span>
            </button>
          </div>

          {/* Roster Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50">
                    <th className="py-3 px-4">Register No</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Section / Instance</th>
                    <th className="py-3 px-4 text-center">MCQ Tests Attended</th>
                    <th className="py-3 px-4 text-center">Avg MCQ Score</th>
                    <th className="py-3 px-4 text-center">Viva Score</th>
                    <th className="py-3 px-4 text-center">Flags</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-slate-400 italic">
                        {loadingRoster ? "Loading enrolled students..." : "No students found matching your filters."}
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((st) => (
                      <tr
                        key={st.register_no}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {st.register_no}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                          {st.student_name}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                          {st.instance_name}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {st.mcq_tests_attended} / {st.total_mcq_tests}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {st.avg_score_pct !== null ? (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                                st.avg_score_pct >= 75
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : st.avg_score_pct >= 40
                                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                              }`}
                            >
                              {st.avg_score_pct}%
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not taken</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {st.viva_score !== null ? (
                            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                              {st.viva_score}%
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {st.flags_count > 0 ? (
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
                              {st.flags_count} flags
                            </span>
                          ) : (
                            <span className="text-slate-400">Clean</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => openDashboard(st.register_no)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 shadow-2xs hover:bg-indigo-50/50 hover:border-indigo-300 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                          >
                            <FileText className="h-3 w-3" />
                            <span>View Dossier</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* STUDENT PERFORMANCE DOSSIER MODAL                           */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeStudentReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Student Performance Dossier
                  </h3>
                  <p className="text-xs text-slate-500">
                    Comprehensive CIA marks, answer sheet copies, MCQ metrics, and viva evaluations
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {dashboardData && (
                  <button
                    onClick={() => generateStudentDashboardPdf(dashboardData)}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition-all"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download PDF</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setActiveStudentReg(null);
                    setDashboardData(null);
                  }}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {loadingDashboard ? (
              <div className="flex h-64 items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                <RotateCw className="h-5 w-5 animate-spin text-indigo-600" />
                Loading comprehensive dossier...
              </div>
            ) : dashboardData ? (
              <div className="mt-5 space-y-6">
                {/* 1. Profile Cards */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-slate-400 text-[11px] block">STUDENT NAME</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {dashboardData.profile.student_name}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 text-[11px] block">REGISTER NUMBER</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {dashboardData.profile.register_number}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 text-[11px] block">SECTION / INSTANCE</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dashboardData.profile.instance_name}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-400 text-[11px] block">EMAIL</span>
                    <span className="text-slate-600 dark:text-slate-300 truncate block">
                      {dashboardData.profile.email || "N/A"}
                    </span>
                  </div>
                </div>

                {/* 2. CIA Assessments & Paper Link */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                    Continuous Internal Assessment (CIA) & Answer Sheets
                  </h4>
                  {dashboardData.cia_assessments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No CIA test results found for this student.</p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800 dark:bg-slate-800/40">
                            <th className="py-2.5 px-3">Test</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3 text-center">Marks Obtained</th>
                            <th className="py-2.5 px-3 text-center">Percentage</th>
                            <th className="py-2.5 px-3 text-right">Digital Answer Sheet</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {dashboardData.cia_assessments.map((cia, ci) => (
                            <tr key={ci}>
                              <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                {cia.test_name}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">{cia.test_type || "CIA"}</td>
                              <td className="py-2.5 px-3 text-center font-mono font-semibold">
                                {cia.final_total_mark} / {cia.actual_max_mark}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
                                {cia.marks_obtained_percentage}%
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {cia.paper_links && cia.paper_links.length > 0 ? (
                                  <button
                                    onClick={() => setPaperModalUrl(cia.paper_links[0])}
                                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition-all dark:bg-indigo-950/50 dark:text-indigo-300"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    <span>View Paper ({cia.paper_links.length}p)</span>
                                  </button>
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">No paper linked</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 3. MCQ Assessments Table */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                    MCQ Performance Breakdown
                  </h4>
                  {dashboardData.mcq_assessments.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No MCQ tests taken by this student.</p>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800 dark:bg-slate-800/40">
                            <th className="py-2.5 px-3">Test Title</th>
                            <th className="py-2.5 px-3 text-center">Correct / Questions</th>
                            <th className="py-2.5 px-3 text-center">Score %</th>
                            <th className="py-2.5 px-3 text-center">Result</th>
                            <th className="py-2.5 px-3 text-center">Proctoring Flags</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {dashboardData.mcq_assessments.map((mcq, mi) => (
                            <tr key={mi}>
                              <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                {mcq.title || mcq.test_code || "MCQ Test"}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono">
                                {mcq.correct_count} / {mcq.total_questions}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                                {mcq.score_pct}%
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    mcq.passed
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                                      : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300"
                                  }`}
                                >
                                  {mcq.passed ? "PASSED" : "FAILED"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {mcq.tab_switches > 0 ? (
                                  <span className="font-semibold text-amber-600">
                                    {mcq.tab_switches} switches
                                  </span>
                                ) : (
                                  <span className="text-slate-400">0 flags</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 4. Viva Voce Section (Evaluation Summary + Collapsible Full Report) */}
                {dashboardData.viva && (
                  <div className="rounded-2xl border border-purple-200/80 bg-purple-50/50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-200">
                          AI Viva Voce Evaluation
                        </h4>
                      </div>
                      {dashboardData.viva.viva_score !== null && (
                        <span className="rounded-full bg-purple-200/80 px-2.5 py-0.5 text-xs font-extrabold text-purple-900 dark:bg-purple-900 dark:text-purple-100">
                          Viva Score: {dashboardData.viva.viva_score}%
                        </span>
                      )}
                    </div>

                    {/* Evaluation Summary Always Visible */}
                    <div className="mt-3 rounded-xl bg-white p-3.5 shadow-2xs border border-purple-100 text-xs text-slate-700 leading-relaxed dark:bg-slate-900 dark:border-purple-950 dark:text-slate-300">
                      <p className="font-semibold text-slate-900 dark:text-white mb-1">
                        Evaluation Summary:
                      </p>
                      {dashboardData.viva.evaluation_summary}
                    </div>

                    {/* Collapsible Full Viva Report */}
                    {dashboardData.viva.viva_report && (
                      <div className="mt-3">
                        <button
                          onClick={() => setIsVivaReportExpanded((prev) => !prev)}
                          className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 transition-colors dark:text-purple-300"
                        >
                          {isVivaReportExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>
                            {isVivaReportExpanded
                              ? "Collapse Full Viva Report"
                              : "Expand Detailed Viva Report & Transcript"}
                          </span>
                        </button>

                        {isVivaReportExpanded && (
                          <div className="mt-2.5 max-h-72 overflow-y-auto rounded-xl bg-slate-900 p-4 font-mono text-xs text-purple-200">
                            <pre className="whitespace-pre-wrap font-sans text-xs">
                              {typeof dashboardData.viva.viva_report === "string"
                                ? dashboardData.viva.viva_report
                                : JSON.stringify(dashboardData.viva.viva_report, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* LAZY ANSWER SHEET VIEWER MODAL                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {paperModalUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl rounded-2xl bg-white p-4 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Answer Sheet Digital Copy
              </span>
              <button
                onClick={() => setPaperModalUrl(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 flex max-h-[75vh] items-center justify-center overflow-auto rounded-xl bg-slate-100 p-2 dark:bg-slate-950">
              <img
                src={
                  paperModalUrl.startsWith("http")
                    ? paperModalUrl
                    : `${BACKEND_URL.replace(/\/+$/, "")}/${paperModalUrl.replace(/^\/+/, "")}`
                }
                alt="Answer Sheet Copy"
                className="max-h-[70vh] rounded shadow object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default McqVivaTab;
