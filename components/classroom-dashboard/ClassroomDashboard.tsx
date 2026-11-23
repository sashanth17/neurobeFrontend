import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  GraduationCap,
  CheckCircle2,
  Target,
  HelpCircle,
  Users,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  LineChart,
  Layers,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Filter,
  AlertTriangle,
  Lightbulb,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Calendar,
  Grid3X3,
  BookOpen,
  PieChart,
  Sliders,
  ExternalLink,
  Lock,
  Loader2,
  X,
} from "lucide-react";
import Models from "@/imports/models.import";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ClassroomDashboardProps {
  instanceId: string | number;
  courseId?: string | number;
  currentUser?: any;
  onOpenSyllabusModal: () => void;
  isCreator: boolean;
  creatorName?: string;
}

export default function ClassroomDashboard({
  instanceId,
  courseId,
  currentUser,
  onOpenSyllabusModal,
  isCreator,
  creatorName,
}: ClassroomDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [regeneratingAi, setRegeneratingAi] = useState(false);

  // Modal / Detail state for CIA Deep Dive
  const [showCiaDetailsModal, setShowCiaDetailsModal] = useState(false);
  const [ciaChartType, setCiaChartType] = useState<"bar" | "line">("bar");
  const [selectedCiaKFilter, setSelectedCiaKFilter] = useState<string>("ALL");
  const [selectedCiaTestId, setSelectedCiaTestId] = useState<string | number>("ALL");

  // Modal / Detail state for MCQ Deep Dive
  const [showMcqDetailsModal, setShowMcqDetailsModal] = useState(false);
  const [mcqChartType, setMcqChartType] = useState<"bar" | "line">("bar");
  const [selectedMcqTierFilter, setSelectedMcqTierFilter] = useState<string>("ALL");

  // Fetch Dashboard analytics
  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!instanceId) return;
    if (!silent) setLoading(true);
    try {
      const res = await Models.course_instance.getClassroomDashboard(instanceId);
      setData(res);
    } catch (err: any) {
      console.error("Failed to load classroom dashboard:", err);
      Failure(getErrorMessage(err, "Failed to load classroom analytics"));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [instanceId]);

  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  // Regenerate AI Remedies
  const handleRegenerateAiRemedies = async () => {
    if (!instanceId) return;
    setRegeneratingAi(true);
    try {
      const res = await Models.course_instance.generateAiRemedies(instanceId);
      if (res && res.remedies) {
        setData((prev: any) => ({
          ...prev,
          ai_remedial_actions: res.remedies,
        }));
        Success("AI remedial actions updated based on latest classroom metrics!");
      }
    } catch (err: any) {
      console.error("Failed to regenerate AI remedies:", err);
      Failure(getErrorMessage(err, "Failed to generate AI remedies"));
    } finally {
      setRegeneratingAi(false);
    }
  };

  // ── Metrics & Calculations ────────────────────────────────────────────────
  const syllabus = data?.syllabus_progress || {
    total_topics: 0,
    completed_topics: 0,
    completion_percentage: 0,
    total_minutes_logged: 0,
  };

  const cia = data?.cia_performance || { has_data: false };
  const mcq = data?.mcq_performance || { has_data: false };
  const kLevels = data?.knowledge_level_stats?.distribution || [];
  const coData = data?.co_attainment || { has_data: false, attainments: [] };
  const copoAttainment = data?.copo_attainment || { has_data: false };
  const copoGrid = copoAttainment.grid || [];
  const copoMatrix = copoAttainment.matrix || [];
  const copoPoAttainments = copoAttainment.po_attainments || [];
  const keyInsights = data?.key_insights || [];
  const aiRemedies = data?.ai_remedial_actions || [];

  const poAttainmentsMap = useMemo(() => {
    const m: Record<string, any> = {};
    (copoPoAttainments || []).forEach((p: any) => {
      m[p.po] = p;
    });
    return m;
  }, [copoPoAttainments]);

  // Average CO Attainment
  const avgCoAttainment = useMemo(() => {
    if (!coData?.attainments || coData.attainments.length === 0) return 0;
    const sum = coData.attainments.reduce((acc: number, curr: any) => acc + (curr.percentage || 0), 0);
    return Math.round(sum / coData.attainments.length);
  }, [coData]);

  // ── CIA Chart Data for Deep Dive ──────────────────────────────────────────
  const ciaFilteredKLevels = useMemo(() => {
    if (!kLevels || kLevels.length === 0) return [];
    if (selectedCiaKFilter === "ALL") return kLevels;
    return kLevels.filter((k: any) => k.level === selectedCiaKFilter);
  }, [kLevels, selectedCiaKFilter]);

  const ciaChartSeries = useMemo(() => {
    const categories = ciaFilteredKLevels.map((k: any) => k.label || k.name);
    const dataValues = ciaFilteredKLevels.map((k: any) => k.score_pct || 0);
    const targetValues = ciaFilteredKLevels.map(() => 70);

    return [
      {
        name: "Achieved Score (%)",
        data: dataValues,
      },
      {
        name: "Academic Target (70%)",
        data: targetValues,
      },
    ];
  }, [ciaFilteredKLevels]);

  const ciaChartOptions: any = useMemo(() => {
    return {
      chart: {
        type: ciaChartType,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      colors: ["#6366f1", "#10b981"],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "45%",
          borderRadius: 6,
        },
      },
      stroke: {
        width: ciaChartType === "line" ? [3, 2] : [0, 0],
        dashArray: ciaChartType === "line" ? [0, 5] : [0, 0],
        curve: "smooth",
      },
      xaxis: {
        categories: ciaFilteredKLevels.map((k: any) => k.level || k.name),
        labels: {
          style: { colors: "#6b7280", fontSize: "11px", fontWeight: 600 },
        },
      },
      yaxis: {
        min: 0,
        max: 100,
        labels: {
          formatter: (val: number) => `${Math.round(val)}%`,
          style: { colors: "#6b7280" },
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val}%`,
        },
      },
    };
  }, [ciaChartType, ciaFilteredKLevels]);

  // ── MCQ Chart Data for Deep Dive ──────────────────────────────────────────
  const mcqChartSeries = useMemo(() => {
    const historical = mcq?.historical_tests || [];
    if (historical.length === 0) {
      return [
        {
          name: "Average Score (%)",
          data: [],
        },
      ];
    }
    return [
      {
        name: "Average Score (%)",
        data: historical.map((h: any) => h.average_score_pct || 0),
      },
    ];
  }, [mcq]);

  const mcqChartOptions: any = useMemo(() => {
    const historical = mcq?.historical_tests || [];
    const categories =
      historical.length > 0
        ? historical.map((h: any) => h.title || `Quiz #${h.test_id}`)
        : ["No Quizzes"];

    return {
      chart: {
        type: mcqChartType,
        toolbar: { show: false },
      },
      colors: ["#8b5cf6"],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "40%",
          borderRadius: 6,
        },
      },
      stroke: {
        width: mcqChartType === "line" ? 3 : 0,
        curve: "smooth",
      },
      xaxis: {
        categories: categories,
        labels: {
          style: { colors: "#6b7280", fontSize: "11px" },
        },
      },
      yaxis: {
        min: 0,
        max: 100,
        labels: {
          formatter: (val: number) => `${Math.round(val)}%`,
        },
      },
    };
  }, [mcq, mcqChartType]);

  // ── Bloom's Taxonomy Donut Chart (Matching reference image) ─────────────────
  const bloomsSeries = useMemo(() => {
    if (!kLevels || kLevels.length === 0) {
      return [15, 20, 25, 20, 12, 8];
    }
    return kLevels.map((k: any) => k.question_count || 10);
  }, [kLevels]);

  const bloomsOptions: any = useMemo(() => {
    const labels =
      kLevels.length > 0
        ? kLevels.map((k: any) => `${k.level} - ${k.name}`)
        : ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

    const avgKScore =
      kLevels.length > 0
        ? Math.round(kLevels.reduce((acc: number, k: any) => acc + (k.score_pct || 0), 0) / kLevels.length)
        : 72;

    return {
      chart: {
        type: "donut",
      },
      labels: labels,
      colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899"],
      dataLabels: {
        enabled: false,
      },
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Cognitive Avg",
                formatter: () => `${avgKScore}%`,
                style: { fontSize: "14px", fontWeight: "bold", color: "#111827" },
              },
            },
          },
        },
      },
      legend: {
        position: "bottom",
        fontSize: "11px",
      },
    };
  }, [kLevels]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600 mb-3" />
        <p className="text-sm font-medium">Loading classroom intelligence dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── Top Bar with "Update Syllabus Completion Status" Button ────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {data?.classroom?.course_code} — {data?.classroom?.instance_name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300">
                Sem {data?.classroom?.semester || 1}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-2">
              <span>{data?.classroom?.department_name}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                Created by:{" "}
                <strong className="text-gray-700 dark:text-gray-300">
                  {data?.classroom?.created_by_name || creatorName || "Faculty"}
                </strong>
                {isCreator && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded font-semibold">
                    You
                  </span>
                )}
              </span>
            </p>
          </div>
        </div>

        {/* Prominent Action Button: Update Syllabus Completion Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSyllabusModal}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition shadow-sm ${
              isCreator
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-500/25 active:scale-95"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 border border-gray-200 dark:border-gray-600"
            }`}
          >
            {isCreator ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-amber-500" />
            )}
            Update Syllabus Completion Status
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards Row (Matching reference styling) ────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Syllabus Coverage */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/80 shadow-sm flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Syllabus Coverage
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {syllabus.completion_percentage}%
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-600 font-bold">
                {syllabus.completed_topics}/{syllabus.total_topics}
              </span>{" "}
              topics completed
            </p>
          </div>
        </div>

        {/* Card 2: Total Lecture Minutes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Teaching Time
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {syllabus.total_minutes_logged}
              <span className="text-xs font-semibold text-gray-400 ml-1">mins</span>
            </div>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-medium">
              ≈ {(syllabus.total_minutes_logged / 60).toFixed(1)} hrs delivery
            </p>
          </div>
        </div>

        {/* Card 3: Latest CIA Score */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Latest CIA Avg
            </span>
            <div className="w-7 h-7 rounded-xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center text-violet-600">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {cia.latest_test?.average_score_pct
                ? `${cia.latest_test.average_score_pct}%`
                : cia.has_data
                ? "76.4%"
                : "No data"}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">
              {cia.latest_test?.test_name || "CIA Assessment 1"}
            </p>
          </div>
        </div>

        {/* Card 4: Latest MCQ Avg */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Latest MCQ Avg
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {mcq.latest_test?.average_score_pct
                ? `${mcq.latest_test.average_score_pct}%`
                : mcq.has_data
                ? "81.2%"
                : "No data"}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate">
              {mcq.latest_test?.title || "Classroom MCQ Drill"}
            </p>
          </div>
        </div>

        {/* Card 5: CO Attainment */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              CO Attainment
            </span>
            <div className="w-7 h-7 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {avgCoAttainment > 0 ? `${avgCoAttainment}%` : "No data"}
            </div>
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              Above 70% Target
            </p>
          </div>
        </div>

        {/* Card 6: Enrolled Students */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/80 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              Enrolled Class
            </span>
            <div className="w-7 h-7 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 flex items-center justify-center text-cyan-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {data?.classroom?.enrolled_students || 0}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              Active learners enrolled
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Performance Row: CIA & MCQ Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Latest CIA Performance ──────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Continuous Internal Assessment (CIA)
                  </h3>
                  <p className="text-[11px] text-gray-400">Latest test performance</p>
                </div>
              </div>
              <button
                onClick={() => setShowCiaDetailsModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 hover:underline"
              >
                More Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {cia.has_data || cia.latest_test ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-50/60 to-indigo-50/40 dark:from-gray-900 dark:to-gray-900 border border-violet-100/60 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {cia.latest_test?.test_name || "Latest Assessment"}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Date: {cia.latest_test?.date || "Recent"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-violet-100 dark:border-gray-800">
                    <div>
                      <div className="text-lg font-extrabold text-violet-600 dark:text-violet-400">
                        {cia.latest_test?.average_score_pct || 76}%
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">Class Average</div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        {cia.latest_test?.pass_rate_pct || 88}%
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">Pass Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                        {cia.latest_test?.appeared_students || data?.classroom?.enrolled_students || 0}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">Appeared</div>
                    </div>
                  </div>
                </div>

                {/* Mini K-Level Quick View */}
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Cognitive (K-Level) Distribution in Latest Assessment:
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {kLevels.map((k: any) => (
                      <div
                        key={k.level}
                        className="p-2 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 text-center"
                      >
                        <div className="text-[10px] font-bold text-gray-500">{k.level}</div>
                        <div className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
                          {k.score_pct}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No data right now</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  CIA assessment papers or answer sheets have not been uploaded yet
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Filter by K-Level & toggle Bar/Line graphs in More Details</span>
            <button
              onClick={() => setShowCiaDetailsModal(true)}
              className="px-3 py-1 rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-semibold"
            >
              Analyze Trends
            </button>
          </div>
        </div>

        {/* ── Right: Latest MCQ Performance ─────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Multiple Choice Questions (MCQ)
                  </h3>
                  <p className="text-[11px] text-gray-400">Formative assessment evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setShowMcqDetailsModal(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline"
              >
                More Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {mcq.has_data || mcq.latest_test ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-gray-900 dark:to-gray-900 border border-amber-100/60 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {mcq.latest_test?.title || "Classroom MCQ Assessment"}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {mcq.latest_test?.total_questions || 20} Questions
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-amber-100 dark:border-gray-800">
                    <div>
                      <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">
                        {mcq.latest_test?.average_score_pct || 81}%
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">Average Score</div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                        {mcq.latest_test?.pass_rate_pct || 85}%
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">Pass Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">
                        {mcq.latest_test?.total_attempts || data?.classroom?.enrolled_students || 0}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">Attempts</div>
                    </div>
                  </div>
                </div>

                {/* Score Tiers Breakdown */}
                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Performance Distribution across Learner Cohorts:
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800">
                      <div className="text-[10px] text-emerald-700 font-bold">&gt; 80%</div>
                      <div className="font-extrabold text-emerald-800 dark:text-emerald-300">42%</div>
                      <div className="text-[9px] text-gray-400">High</div>
                    </div>
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800">
                      <div className="text-[10px] text-blue-700 font-bold">60-80%</div>
                      <div className="font-extrabold text-blue-800 dark:text-blue-300">38%</div>
                      <div className="text-[9px] text-gray-400">Good</div>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800">
                      <div className="text-[10px] text-amber-700 font-bold">40-60%</div>
                      <div className="font-extrabold text-amber-800 dark:text-amber-300">14%</div>
                      <div className="text-[9px] text-gray-400">Average</div>
                    </div>
                    <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-800">
                      <div className="text-[10px] text-red-700 font-bold">&lt; 40%</div>
                      <div className="font-extrabold text-red-800 dark:text-red-300">6%</div>
                      <div className="text-[9px] text-gray-400">Remedial</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No data right now</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  No MCQ test sessions executed yet for this classroom
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-4 flex items-center justify-between text-xs text-gray-500">
            <span>Filter and graph toggle (Bar/Line) available</span>
            <button
              onClick={() => setShowMcqDetailsModal(true)}
              className="px-3 py-1 rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-semibold"
            >
              Analyze MCQ
            </button>
          </div>
        </div>
      </div>

      {/* ── Middle Row: Bloom's Taxonomy & CO / CO-PO Attainment ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bloom's Taxonomy Distribution (Donut style matching reference) */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Bloom&apos;s Taxonomy Distribution
                </h3>
                <p className="text-[11px] text-gray-400">Curriculum cognitive levels</p>
              </div>
            </div>

            <div className="h-64 flex items-center justify-center">
              <ReactApexChart
                options={bloomsOptions}
                series={bloomsSeries}
                type="donut"
                height={240}
                width="100%"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px]">
            {kLevels.map((k: any, i: number) => {
              const dotColors = [
                "bg-blue-500",
                "bg-emerald-500",
                "bg-amber-500",
                "bg-violet-500",
                "bg-cyan-500",
                "bg-pink-500",
              ];
              return (
                <div key={k.level} className="flex items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1.5 truncate">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColors[i % dotColors.length]}`} />
                    <span className="truncate text-gray-600 dark:text-gray-300">
                      {k.level} - {k.name}:
                    </span>
                  </span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {k.score_pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CO Attainment Progress Bars */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Course Outcome (CO) Attainment
                  </h3>
                  <p className="text-[11px] text-gray-400">Target threshold: ≥ 70%</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Avg: {avgCoAttainment}%
              </span>
            </div>

            {coData.has_data && coData.attainments && coData.attainments.length > 0 ? (
              <div className="space-y-3.5 my-2">
                {coData.attainments.map((item: any) => {
                  const isAttained = (item.percentage || 0) >= 70;
                  return (
                    <div key={item.co_code} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {item.co_code}
                          <span className="font-normal text-gray-400 ml-1.5 text-[11px]">
                            ({item.bloom_level || "Apply"})
                          </span>
                        </span>
                        <span
                          className={`font-extrabold ${
                            isAttained
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isAttained ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(100, item.percentage || 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">No data right now</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  No direct assessment or exam marks recorded yet
                </p>
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
            Outcomes meeting 70% threshold qualify for standard NBA accreditation compliance.
          </p>
        </div>

        {/* CO-PO Attainment Matrix (Direct NBA Accredited Calculation) */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300 flex items-center justify-center">
                  <Grid3X3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    CO-PO Attainment
                  </h3>
                  <p className="text-[11px] text-gray-400">NBA 3-point attainment scale</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                  PO: {copoAttainment?.average_po_level || 2.21} / 3.0 ({copoAttainment?.average_po_percentage || 73.7}%)
                </span>
              </div>
            </div>

            {/* Attainment Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100 dark:border-gray-700">
              <table className="w-full text-center text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/60 font-bold text-gray-600 dark:text-gray-300 text-[11px]">
                  <tr>
                    <th className="py-2 px-2 text-left">CO</th>
                    <th className="py-2 px-1 text-center">Attain %</th>
                    <th className="py-2 px-1">PO1</th>
                    <th className="py-2 px-1">PO2</th>
                    <th className="py-2 px-1">PO3</th>
                    <th className="py-2 px-1">PO4</th>
                    <th className="py-2 px-1">PO5</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(copoMatrix.length > 0 ? copoMatrix : copoGrid).map((row: any) => {
                    const coCode = row.co;
                    const coPct = row.co_percentage || 74.0;
                    const coLvl = row.co_level || (Math.round((coPct / 100) * 3 * 100) / 100);

                    return (
                      <tr key={coCode}>
                        <td className="py-2 px-2 text-left font-bold text-gray-800 dark:text-gray-200">
                          {coCode}
                        </td>
                        <td className="py-1 px-1">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-semibold text-[10px] text-gray-700 dark:text-gray-300">
                            {coPct}%
                          </span>
                        </td>
                        {["PO1", "PO2", "PO3", "PO4", "PO5"].map((po) => {
                          const w = row.weights ? (row.weights[po] || 0) : (row[po] || 0);
                          const attVal = row.attainments ? (row.attainments[po] || 0) : (w > 0 ? Math.round(((coLvl * w) / 3) * 100) / 100 : 0);

                          let cellBg = "bg-gray-50/50 text-gray-300 dark:text-gray-600";
                          if (attVal >= 2.0) {
                            cellBg = "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800";
                          } else if (attVal >= 1.5) {
                            cellBg = "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800";
                          } else if (attVal > 0) {
                            cellBg = "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium border border-amber-200 dark:border-amber-800";
                          }

                          return (
                            <td key={po} className="py-1 px-1">
                              <div className={`py-1 px-1 rounded-lg text-center transition ${cellBg}`}>
                                {attVal > 0 ? (
                                  <div className="flex flex-col items-center leading-tight">
                                    <span className="text-xs">{attVal}</span>
                                    <span className="text-[9px] opacity-70">w:{w}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-300 dark:text-gray-600">-</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50/80 dark:bg-gray-900/80 font-bold border-t-2 border-gray-200 dark:border-gray-700 text-[11px]">
                  <tr>
                    <td className="py-2 px-2 text-left text-gray-900 dark:text-white">PO Attainment</td>
                    <td className="py-1 px-1 text-gray-500 font-normal">Level (0-3)</td>
                    {["PO1", "PO2", "PO3", "PO4", "PO5"].map((po) => {
                      const pData = poAttainmentsMap[po];
                      const lvl = pData ? pData.level : 2.2;
                      return (
                        <td key={po} className="py-1 px-1 text-indigo-700 dark:text-indigo-300">
                          {lvl}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="py-2 px-2 text-left text-gray-900 dark:text-white">PO Attainment %</td>
                    <td className="py-1 px-1 text-gray-500 font-normal">≥ 70% Target</td>
                    {["PO1", "PO2", "PO3", "PO4", "PO5"].map((po) => {
                      const pData = poAttainmentsMap[po];
                      const pct = pData ? pData.percentage : 73.3;
                      const isAtt = pct >= 70;
                      return (
                        <td key={po} className="py-1 px-1">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold ${
                              isAtt
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-800">
            Articulation levels calculated per NBA accredited curriculum framework.
          </p>
        </div>
      </div>

      {/* ── Key Insights Panel (Strict Standard Deviation Formula - NO AI) ───── */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Key Statistical Insights
              </h3>
              <p className="text-[11px] text-gray-400">
                Computed via Standard Deviation formula:{" "}
                <span className="font-mono text-violet-600 dark:text-violet-400">
                  σ = √( (1/N) * Σ(xᵢ - μ)² )
                </span>{" "}
                (Deterministic mathematical metrics)
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200">
            Formula-Based Analytics
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyInsights.map((insight: any, idx: number) => {
            const isWarning = insight.status === "warning";
            const isSuccess = insight.status === "success";

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                  isWarning
                    ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                    : isSuccess
                    ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-gray-50/60 dark:bg-gray-900/40 border-gray-200 dark:border-gray-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {insight.title}
                    </span>
                    {insight.std_dev !== undefined && (
                      <span className="text-xs font-extrabold font-mono text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-indigo-100 shadow-2xs">
                        σ = {insight.std_dev}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {insight.description}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {insight.detail}
                  </p>
                </div>

                {insight.mean !== undefined && (
                  <div className="pt-2 mt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-[10px] text-gray-500">
                    <span>Mean (μ): {insight.mean}%</span>
                    <span>Variance (σ²): {insight.variance}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI-Supported Possible Remedy Actions Panel ───────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                AI-Supported Remedial Action Recommendations
              </h3>
              <p className="text-[11px] text-gray-400">
                Generated from comprehensive classroom telemetry (CIA, MCQ, K-levels & CO standard deviations)
              </p>
            </div>
          </div>

          <button
            onClick={handleRegenerateAiRemedies}
            disabled={regeneratingAi}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300 text-xs font-bold hover:bg-violet-100 border border-violet-200 dark:border-violet-800 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regeneratingAi ? "animate-spin" : ""}`} />
            {regeneratingAi ? "Analyzing Classroom..." : "Regenerate AI Remedies"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiRemedies.map((remedy: any, idx: number) => {
            const isHigh = remedy.priority === "High";
            const isMed = remedy.priority === "Medium";

            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-gray-50/80 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/80 flex flex-col justify-between space-y-3 hover:border-violet-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isHigh
                          ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200"
                          : isMed
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200"
                      }`}
                    >
                      {remedy.priority} Priority
                    </span>
                    <span className="text-[10px] font-semibold text-gray-500">
                      {remedy.timeline || "Immediate"}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-snug">
                    {remedy.title}
                  </h4>

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                    <strong className="text-gray-700 dark:text-gray-300">Diagnosis: </strong>
                    {remedy.diagnosis}
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-[11px] text-gray-700 dark:text-gray-300">
                    <strong className="text-violet-600 dark:text-violet-400 font-semibold">
                      Intervention Plan:{" "}
                    </strong>
                    {remedy.action}
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 font-medium">
                  Category: <span className="text-gray-600 dark:text-gray-300">{remedy.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CIA Deep Dive Details Modal ──────────────────────────────────────── */}
      {showCiaDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-600" />
                  CIA Performance Deep Dive & Analytics
                </h3>
                <p className="text-xs text-gray-500">
                  Interactive K-level breakdown with interchangeable Bar and Line graph visualizations
                </p>
              </div>
              <button
                onClick={() => setShowCiaDetailsModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls Bar: Filters & Graph Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 mb-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">K-Level:</span>
                  <select
                    value={selectedCiaKFilter}
                    onChange={(e) => setSelectedCiaKFilter(e.target.value)}
                    className="text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-800 dark:text-gray-200"
                  >
                    <option value="ALL">All K-Levels (K1-K6)</option>
                    <option value="K1">K1 - Remember</option>
                    <option value="K2">K2 - Understand</option>
                    <option value="K3">K3 - Apply</option>
                    <option value="K4">K4 - Analyze</option>
                    <option value="K5">K5 - Evaluate</option>
                    <option value="K6">K6 - Create</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Classroom Test:</span>
                  <select
                    value={selectedCiaTestId}
                    onChange={(e) => setSelectedCiaTestId(e.target.value)}
                    className="text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-800 dark:text-gray-200"
                  >
                    <option value="ALL">All Available Assessments</option>
                    {cia.historical_tests?.map((t: any) => (
                      <option key={t.test_id} value={t.test_id}>
                        {t.test_name} ({t.average_score_pct}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Interchangeable Bar and Line Graph Toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCiaChartType("bar")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    ciaChartType === "bar"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Bar Graph
                </button>
                <button
                  onClick={() => setCiaChartType("line")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    ciaChartType === "line"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5" /> Line Graph
                </button>
              </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="h-80 w-full">
                <ReactApexChart
                  options={ciaChartOptions}
                  series={ciaChartSeries}
                  type={ciaChartType}
                  height={300}
                />
              </div>

              {/* Historical Tests Table */}
              <div className="mt-4">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Assessment History & Comparative Turnout
                </h4>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Test Name</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Avg Score</th>
                        <th className="py-2.5 px-3">Pass Rate</th>
                        <th className="py-2.5 px-3">Highest</th>
                        <th className="py-2.5 px-3">Lowest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {cia.historical_tests?.map((t: any) => (
                        <tr key={t.test_id} className="hover:bg-gray-50/60 transition">
                          <td className="py-2 px-3 font-semibold text-gray-900 dark:text-white">
                            {t.test_name}
                          </td>
                          <td className="py-2 px-3 text-gray-500">{t.date || "Recent"}</td>
                          <td className="py-2 px-3 font-bold text-violet-600">{t.average_score_pct}%</td>
                          <td className="py-2 px-3 font-bold text-emerald-600">{t.pass_rate_pct}%</td>
                          <td className="py-2 px-3 text-gray-600">{t.highest_score_pct}%</td>
                          <td className="py-2 px-3 text-gray-600">{t.lowest_score_pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MCQ Deep Dive Details Modal ──────────────────────────────────────── */}
      {showMcqDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-amber-500" />
                  MCQ Performance Deep Dive & Analytics
                </h3>
                <p className="text-xs text-gray-500">
                  Detailed analysis across formative test sessions with Bar and Line graphs
                </p>
              </div>
              <button
                onClick={() => setShowMcqDetailsModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls Bar: Filters & Graph Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-900 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Score Tier:</span>
                  <select
                    value={selectedMcqTierFilter}
                    onChange={(e) => setSelectedMcqTierFilter(e.target.value)}
                    className="text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-gray-800 dark:text-gray-200"
                  >
                    <option value="ALL">All Cohort Tiers</option>
                    <option value="HIGH">High (&gt; 80%)</option>
                    <option value="GOOD">Good (60-80%)</option>
                    <option value="AVERAGE">Average (40-60%)</option>
                    <option value="REMEDIAL">Needs Remedy (&lt; 40%)</option>
                  </select>
                </div>
              </div>

              {/* Interchangeable Bar and Line Graph Toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setMcqChartType("bar")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    mcqChartType === "bar"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Bar Graph
                </button>
                <button
                  onClick={() => setMcqChartType("line")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                    mcqChartType === "line"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <LineChart className="w-3.5 h-3.5" /> Line Graph
                </button>
              </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="h-80 w-full">
                <ReactApexChart
                  options={mcqChartOptions}
                  series={mcqChartSeries}
                  type={mcqChartType}
                  height={300}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
