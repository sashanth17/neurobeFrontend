import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import Head from "next/head";
import {
  ChevronLeft,
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Printer,
  Sparkles,
  Brain,
  MessageSquare,
  RefreshCw,
  Clock,
  HelpCircle,
  BookOpen,
  TrendingUp,
  Calendar,
  Check,
  X,
  Target,
  Layers,
  FileText,
  User,
  Info,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import Models from "@/imports/models.import";
import { getAuthUser } from "@/utils/function.utils";
import VivaResultComponent from "@/components/viva_result_component";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EvaluatedQuestion {
  question_id: string;
  question_index?: number;
  question_string?: string;
  options?: string[];
  selected_option?: string | null;
  correct_option?: string | null;
  is_correct?: boolean;
  explanation?: string | null;
}

interface ScoreSummary {
  total_questions?: number;
  correct_count?: number;
  unanswered_count?: number;
  score_pct?: number;
  passed?: boolean;
}

interface TopicAnalysisItem {
  topic?: string;
  depth?: string;
  understanding_level?: string;
  feedback?: string;
  strengths?: string[];
  knowledge_gaps?: string[];
  misconceptions?: string[];
  concept_breakdown?: string[];
  mcq_questions_asked?: number;
  mcq_questions_correct?: number;
  mcq_interview_consistency?: string;
}

interface VivaReportData {
  final_summary?: string;
  key_strengths?: string[];
  topic_analysis?: TopicAnalysisItem[];
  session_metrics?: {
    total_questions_asked?: number;
    total_answered_correctly?: number;
    total_topics?: number;
    viva_score?: number;
  };
  reasoning_profile?: {
    summary?: string;
    reasoning_depth?: string;
  };
  assessment_summary?: {
    summary?: string;
    overall_understanding?: string;
    communication_skills?: {
      confidence?: string;
      articulation?: string;
    };
  };
  priority_improvement_areas?: string[];
  dialogue_history?: Array<{
    role?: string;
    speaker?: string;
    content?: string;
    text?: string;
  }>;
}

interface StudentReviewData {
  test_id: string;
  test_code: string;
  title: string;
  student_email: string;
  status: string;
  have_viva?: boolean;
  viva_threshold?: number;
  viva_eligible?: boolean;
  can_view_detailed_answers: boolean;
  message?: string;
  test_window_start?: string | null;
  test_window_end?: string | null;
  score_summary: ScoreSummary;
  questions?: EvaluatedQuestion[] | null;
  viva_score?: number | null;
  viva_report?: VivaReportData | any | null;
  evaluation_summary?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers for safe value display (show "—" on any missing data)
// ─────────────────────────────────────────────────────────────────────────────

const valOrDash = (val: any): string => {
  if (val === null || val === undefined) return "—";
  const s = String(val).trim();
  return s === "" ? "—" : s;
};

const renderBulletList = (arr?: string[] | null) => {
  if (!arr || !Array.isArray(arr) || arr.length === 0) {
    return <span className="font-mono text-gray-400 dark:text-gray-500">—</span>;
  }
  const filtered = arr.filter((x) => x && String(x).trim() !== "");
  if (filtered.length === 0) {
    return <span className="font-mono text-gray-400 dark:text-gray-500">—</span>;
  }
  return (
    <ul className="space-y-1.5">
      {filtered.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
};

const getUnderstandingBadge = (level?: string) => {
  const norm = String(level || "").toLowerCase().trim();
  if (norm === "weak") {
    return (
      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
        Weak
      </span>
    );
  }
  if (norm === "basic" || norm === "moderate") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
        {norm}
      </span>
    );
  }
  if (norm === "strong" || norm === "good") {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
        Strong
      </span>
    );
  }
  if (norm === "excellent") {
    return (
      <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300">
        Excellent
      </span>
    );
  }
  return <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{valOrDash(level)}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const StudentReportPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<StudentReviewData | null>(null);
  const [activeTab, setActiveTab] = useState<"mcq" | "viva">("mcq");
  const [questionFilter, setQuestionFilter] = useState<"all" | "incorrect" | "correct" | "unanswered">("all");

  const testId = (router.query.test_id as string) || "";
  const authUser = getAuthUser();
  const studentEmail =
    (router.query.student_email as string) ||
    authUser?.email ||
    (typeof window !== "undefined" ? localStorage.getItem("email") || "" : "");

  useEffect(() => {
    dispatch(setPageTitle("Student Assessment Report"));
  }, [dispatch]);

  const fetchReport = async () => {
    if (!testId) {
      setError("No Test ID was provided in the URL.");
      setLoading(false);
      return;
    }

    if (!studentEmail) {
      setError("No student email reference identified. Please log in or open from dashboard.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res: any = await Models.mcq.get_student_test_review(testId, studentEmail);
      if (res) {
        setReportData(res);
      } else {
        setError("Failed to fetch assessment review data.");
      }
    } catch (err: any) {
      console.error("[student-report] Error loading review:", err);
      const msg =
        typeof err === "string"
          ? err
          : err?.detail || err?.message || "Failed to load examination report. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      fetchReport();
    }
  }, [router.isReady, testId, studentEmail]);

  // Format date helper
  const formatDateTime = (isoStr?: string | null) => {
    if (!isoStr) return "—";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  // Safe normalized Viva Report parser
  const parsedVivaReport = useMemo<VivaReportData | null>(() => {
    const raw = reportData?.viva_report;
    if (!raw) return null;
    let obj = raw;
    if (typeof raw === "string") {
      try {
        obj = JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return typeof obj === "object" && obj?.report ? obj.report : obj;
  }, [reportData?.viva_report]);

  // Strict double check: ensure answers only unlock after test window has officially ended
  const isWindowStillActive = useMemo(() => {
    const endStr = reportData?.test_window_end;
    if (!endStr) return false;
    try {
      const we = new Date(endStr).getTime();
      return !isNaN(we) && Date.now() < we;
    } catch {
      return false;
    }
  }, [reportData?.test_window_end]);

  // Determine if Viva tab should be available
  const hasVivaTab = Boolean(
    reportData?.have_viva && (parsedVivaReport || reportData?.viva_eligible || reportData?.viva_score !== null)
  );

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    const list = reportData?.questions || [];
    if (questionFilter === "incorrect") {
      return list.filter((q) => !q.is_correct && q.selected_option !== null && String(q.selected_option).trim() !== "");
    }
    if (questionFilter === "correct") {
      return list.filter((q) => q.is_correct);
    }
    if (questionFilter === "unanswered") {
      return list.filter((q) => q.selected_option === null || q.selected_option === undefined || String(q.selected_option).trim() === "");
    }
    return list;
  }, [reportData?.questions, questionFilter]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading student assessment report…</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !reportData) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-8 text-center space-y-4 shadow-sm dark:border-rose-900/40 dark:bg-gray-900">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-rose-50 text-rose-500 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Unable to Load Report</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {error || "Could not retrieve examination details. The assessment may not exist or access is restricted."}
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={fetchReport}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/neurobe/student-dashboard")}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 text-xs font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { score_summary } = reportData;
  const totalQuestions = score_summary?.total_questions ?? (reportData.questions?.length ?? 0);
  const correctCount = score_summary?.correct_count ?? 0;
  const unansweredCount = score_summary?.unanswered_count ?? 0;
  // Derive incorrect answers: total - correct - unanswered
  const incorrectCount = Math.max(0, totalQuestions - correctCount - unansweredCount);
  const scorePct = score_summary?.score_pct;
  const isPassed = score_summary?.passed;

  const can_view_detailed_answers = Boolean(
    reportData.can_view_detailed_answers && !isWindowStillActive && (reportData.questions?.length || 0) > 0
  );

  return (
    <div className="min-h-screen space-y-6 pb-16">
      <Head>
        <title>Assessment Report — {reportData.title || "Neurobe"}</title>
      </Head>

      <div className="space-y-6">
        {/* ── Top Header Card ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
          <div className="flex flex-wrap items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/neurobe/student-dashboard")}
                className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors cursor-pointer mt-1 sm:mt-0"
                title="Return to Dashboard"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Student Evaluation Report
                  </span>
                  <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600 font-mono dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                    {valOrDash(reportData.test_code)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${reportData.status?.toLowerCase() === "completed"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                        : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                      }`}
                  >
                    {valOrDash(reportData.status)}
                  </span>
                  {isPassed !== undefined && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${isPassed
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                        }`}
                    >
                      {isPassed ? "Passed" : "Needs Review"}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {valOrDash(reportData.title)}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all cursor-pointer shadow-xs"
              >
                <Printer className="h-4 w-4" />
                <span>Print / Export</span>
              </button>
              <button
                type="button"
                onClick={() => router.push("/neurobe/student-dashboard")}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-semibold text-white shadow-xs transition-all cursor-pointer"
              >
                <span>Dashboard</span>
              </button>
            </div>
          </div>

          {/* Sub-bar with Test Window & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">Candidate:</span>
              <strong className="text-gray-800 dark:text-gray-200 font-mono truncate">
                {valOrDash(reportData.student_email)}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">Window Start:</span>
              <span className="text-gray-800 dark:text-gray-200 font-mono">
                {formatDateTime(reportData.test_window_start)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">Window End:</span>
              <span className="text-gray-800 dark:text-gray-200 font-mono">
                {formatDateTime(reportData.test_window_end)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-gray-500 dark:text-gray-400">Viva Round:</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium">
                {!reportData.have_viva ? (
                  "—"
                ) : reportData.viva_eligible ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Eligible (Req. {valOrDash(reportData.viva_threshold)}%)</span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">Threshold Not Met (Req. {valOrDash(reportData.viva_threshold)}%)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* ── System / API Message Banner ─────────────────────────────────── */}
        {reportData.message && (
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-950 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200 flex items-start gap-3">
            <Info className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
            <p className="leading-relaxed">{reportData.message}</p>
          </div>
        )}

        {/* ── Evaluation Summary Banner (if provided) ─────────────────────── */}
        {reportData.evaluation_summary && (
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 text-xs text-purple-950 dark:border-purple-900/40 dark:bg-purple-950/20 dark:text-purple-200 flex items-start gap-3">
            <Brain className="h-4 w-4 shrink-0 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div>
              <p className="font-bold text-[11px] uppercase tracking-wider text-purple-700 dark:text-purple-300">
                Evaluation Summary
              </p>
              <p className="mt-0.5 leading-relaxed">{reportData.evaluation_summary}</p>
            </div>
          </div>
        )}

        {/* ── Viva Ineligibility Notice (if viva configured but threshold not met) ─ */}
        {reportData.have_viva && !reportData.viva_eligible && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Viva Voce Round Notice</p>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300/90 leading-relaxed">
                This assessment was configured with an AI Viva Voce session requiring a minimum MCQ score of{" "}
                <strong>{valOrDash(reportData.viva_threshold)}%</strong>. Your evaluated MCQ score was{" "}
                <strong>{scorePct !== undefined && scorePct !== null ? `${scorePct}%` : "—"}</strong>. As the passing threshold was not met, the viva round was not conducted and your evaluation is based on your MCQ responses alone.
              </p>
            </div>
          </div>
        )}

        {/* ── Mode Toggle: Shown if Viva is Enabled ──────────────────────── */}
        {hasVivaTab && (
          <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-2xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("mcq")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "mcq"
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>MCQ Assessment</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("viva")}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "viva"
                  ? "bg-white text-indigo-600 shadow-sm dark:bg-gray-800 dark:text-indigo-400"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
            >
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>AI Viva Voce Report</span>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: MCQ Results View                                           */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "mcq" && (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {/* Score Pct */}
              <div className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs dark:border-indigo-900/40 dark:bg-gray-900 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Evaluated Score</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                    {scorePct !== undefined && scorePct !== null ? `${scorePct}%` : "—"}
                  </span>
                  {isPassed !== undefined && (
                    <span className={`text-xs font-bold ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                      {isPassed ? "Passed" : "Needs Review"}
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isPassed ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, Math.max(0, scorePct ?? 0))}%` }}
                  />
                </div>
              </div>

              {/* Correct */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Correct Answers</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">
                    {score_summary?.correct_count !== undefined && score_summary?.correct_count !== null
                      ? score_summary.correct_count
                      : "—"}
                  </span>
                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-mono">
                    / {totalQuestions}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2">Verified correct selections</p>
              </div>

              {/* Incorrect */}
              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-xs dark:border-rose-900/40 dark:bg-rose-950/20 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-rose-700 dark:text-rose-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Incorrect Answers</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300">
                    <XCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-rose-700 dark:text-rose-300 font-mono">
                    {score_summary ? incorrectCount : "—"}
                  </span>
                  <span className="text-xs text-rose-600/70 dark:text-rose-400/70 font-mono">
                    / {totalQuestions}
                  </span>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2">Wrong option selected</p>
              </div>

              {/* Unanswered */}
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs dark:border-gray-800 dark:bg-gray-900 flex flex-col justify-between">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">Unanswered</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    <HelpCircle className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-800 dark:text-gray-200 font-mono">
                    {score_summary?.unanswered_count !== undefined && score_summary?.unanswered_count !== null
                      ? score_summary.unanswered_count
                      : "—"}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">/ {totalQuestions}</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">Skipped or unattempted</p>
              </div>
            </div>

            {/* Detailed Question Review Section */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>Question-by-Question Breakdown</span>
                    {can_view_detailed_answers ? (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300">
                        Answer Key Unlocked
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Inspect questions, submitted responses, and official rationale.
                  </p>
                </div>

                {/* Filter Pills (Enabled only when detailed answers are unlocked) */}
                {can_view_detailed_answers && (
                  <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setQuestionFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${questionFilter === "all"
                          ? "bg-white text-indigo-600 shadow-xs dark:bg-gray-900 dark:text-indigo-400 font-bold"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        }`}
                    >
                      All ({reportData.questions?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionFilter("incorrect")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${questionFilter === "incorrect"
                          ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 font-bold"
                          : "text-gray-600 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400"
                        }`}
                    >
                      Incorrect ({incorrectCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionFilter("correct")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${questionFilter === "correct"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-bold"
                          : "text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
                        }`}
                    >
                      Correct ({correctCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionFilter("unanswered")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${questionFilter === "unanswered"
                          ? "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 font-bold"
                          : "text-gray-600 hover:text-amber-600 dark:text-gray-400 dark:hover:text-amber-400"
                        }`}
                    >
                      Unanswered ({unansweredCount})
                    </button>
                  </div>
                )}
              </div>

              {/* Case A: Window is Still Open (Answers Locked) */}
              {!can_view_detailed_answers && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-8 text-center space-y-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                    <Lock className="h-6 w-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                      Detailed Answer Key Confidential
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      To preserve examination integrity, individual correct answers, choice comparisons, and question
                      explanations will unlock automatically after the scheduled test window closes.
                    </p>
                    <div className="rounded-xl bg-white border border-indigo-100 px-4 py-2 mt-3 inline-block font-mono text-xs font-semibold text-indigo-700 dark:bg-gray-800 dark:border-gray-700 dark:text-indigo-300 shadow-xs">
                      Unlocks on: {formatDateTime(reportData.test_window_end)}
                    </div>
                  </div>
                </div>
              )}

              {/* Case B: Window is Closed (Detailed Answers Unlocked) */}
              {can_view_detailed_answers && (
                <div className="space-y-4">
                  {filteredQuestions.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
                      No questions match the selected filter.
                    </div>
                  ) : (
                    filteredQuestions.map((q, idx) => {
                      const isUnanswered =
                        q.selected_option === null ||
                        q.selected_option === undefined ||
                        String(q.selected_option).trim() === "";
                      return (
                        <div
                          key={q.question_id || idx}
                          className={`rounded-2xl border p-5 space-y-4 transition-all ${q.is_correct
                              ? "border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10"
                              : isUnanswered
                                ? "border-gray-200 bg-gray-50/40 dark:border-gray-800 dark:bg-gray-900/30"
                                : "border-rose-200 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/10"
                            }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-800 font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                                {q.question_index ?? idx + 1}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${q.is_correct
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                                    : isUnanswered
                                      ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                                      : "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                                  }`}
                              >
                                {q.is_correct ? "Correct" : isUnanswered ? "Unanswered" : "Incorrect"}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-relaxed">
                            {valOrDash(q.question_string)}
                          </h3>

                          {/* Options Grid */}
                          <div className="space-y-2 pt-1">
                            {(q.options || []).map((optText, oIdx) => {
                              const isSelected =
                                String(q.selected_option || "").trim().toLowerCase() ===
                                String(optText).trim().toLowerCase();
                              const isCorrectOpt =
                                String(q.correct_option || "").trim().toLowerCase() ===
                                String(optText).trim().toLowerCase();

                              let optBorder =
                                "border-gray-200 bg-white text-gray-700 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-300";
                              if (isCorrectOpt) {
                                optBorder =
                                  "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-500/60 dark:text-emerald-200 font-semibold";
                              } else if (isSelected && !isCorrectOpt) {
                                optBorder =
                                  "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:border-rose-500/60 dark:text-rose-200";
                              }

                              return (
                                <div
                                  key={oIdx}
                                  className={`flex items-center justify-between rounded-xl border p-3 text-xs ${optBorder}`}
                                >
                                  <span className="flex items-center gap-2.5">
                                    <span className="font-mono text-gray-400 dark:text-gray-500">
                                      {String.fromCharCode(65 + oIdx)}.
                                    </span>
                                    <span>{valOrDash(optText)}</span>
                                  </span>

                                  <div className="flex items-center gap-2">
                                    {isCorrectOpt && (
                                      <span className="rounded-lg bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold dark:bg-emerald-900/60 dark:text-emerald-300 flex items-center gap-1">
                                        <Check className="h-3 w-3" /> Correct Answer
                                      </span>
                                    )}
                                    {isSelected && !isCorrectOpt && (
                                      <span className="rounded-lg bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold dark:bg-rose-900/60 dark:text-rose-300 flex items-center gap-1">
                                        <X className="h-3 w-3" /> Your Selection
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation Box */}
                          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200 leading-relaxed">
                            <strong className="text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                              Rationale & Explanation:
                            </strong>
                            <span>{valOrDash(q.explanation)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: AI Viva Voce Report View                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "viva" && hasVivaTab && (
          <div className="flex-1 flex flex-col w-full">
            <VivaResultComponent
              report={{
                ...(parsedVivaReport || (typeof reportData?.viva_report === "object" ? reportData?.viva_report : {})),
                session_metrics: {
                  ...(parsedVivaReport?.session_metrics || {}),
                  viva_score: reportData?.viva_score ?? parsedVivaReport?.session_metrics?.viva_score,
                },
              }}
              testDetails={{
                title: reportData?.title,
                secure_code: reportData?.test_code,
                test_id: reportData?.test_id,
              }}
              studentEmail={studentEmail}
              dialogueMessages={parsedVivaReport?.dialogue_history}
              loading={loading}
              onBackToDashboard={() => router.push("/neurobe/student-dashboard")}
            />
          </div>
        )}

      </div>
    </div>
  );
};

export default PrivateRouter(StudentReportPage);
