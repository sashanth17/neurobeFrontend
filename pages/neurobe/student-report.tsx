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
  Download,
  Printer,
  Sparkles,
  Brain,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Clock,
  HelpCircle,
  BookOpen,
  Volume2,
  TrendingUp,
  FileBarChart,
  Calendar,
  Check,
  X,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import Models from "@/imports/models.import";
import { getAuthUser } from "@/utils/function.utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface EvaluatedQuestion {
  question_id: string;
  question_index: number;
  question_string: string;
  options: string[];
  selected_option: string | null;
  correct_option?: string | null;
  is_correct: boolean;
  explanation?: string;
}

interface ScoreSummary {
  total_questions: number;
  answered_count: number;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  score_pct: number;
  passed: boolean;
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
  viva_report?: any | null;
  evaluation_summary?: string | null;
}

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
    if (!isoStr) return "N/A";
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

  // Safe normalized Viva Report parser (prevents React crashes)
  const normalizedVivaReport = useMemo(() => {
    const raw = reportData?.viva_report;
    const base = {
      session_metrics: {
        total_questions_asked: '-',
        total_answered_correctly: '-',
        total_topics: '-',
        viva_score: '-',
      },
      assessment_summary: {
        overall_understanding: "-",
        summary: "-",
        communication_skills: {
          articulation: "-",
          confidence: "-",
        },
      },
      reasoning_profile: {
        reasoning_depth: "-",
        summary: "-",
      },
      key_strengths: ["-"],
      priority_improvement_areas: ["-"],
      topic_analysis: [] as any[],
      dialogue_history: [] as any[],
    };

    if (!raw) return base;
    const parsed = typeof raw === "object" ? raw.report || raw : {};

    if (parsed.assessment_summary) base.assessment_summary = parsed.assessment_summary;
    if (parsed.session_metrics) base.session_metrics = { ...base.session_metrics, ...parsed.session_metrics };
    if (parsed.reasoning_profile) base.reasoning_profile = parsed.reasoning_profile;
    if (Array.isArray(parsed.key_strengths) && parsed.key_strengths.length) base.key_strengths = parsed.key_strengths;
    if (Array.isArray(parsed.priority_improvement_areas) && parsed.priority_improvement_areas.length) {
      base.priority_improvement_areas = parsed.priority_improvement_areas;
    }
    if (Array.isArray(parsed.topic_analysis)) base.topic_analysis = parsed.topic_analysis;
    if (Array.isArray(parsed.dialogue_history)) base.dialogue_history = parsed.dialogue_history;

    return base;
  }, [reportData]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    const list = reportData?.questions || [];
    if (questionFilter === "incorrect") {
      return list.filter((q) => !q.is_correct && q.selected_option !== null);
    }
    if (questionFilter === "correct") {
      return list.filter((q) => q.is_correct);
    }
    if (questionFilter === "unanswered") {
      return list.filter((q) => q.selected_option === null || q.selected_option === "");
    }
    return list;
  }, [reportData?.questions, questionFilter]);

  // Determine if Viva tab should be available
  const hasVivaTab = Boolean(
    reportData?.have_viva && (reportData?.viva_report || reportData?.viva_eligible)
  );

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

  const { score_summary, test_window_end } = reportData;
  const isPassed = score_summary?.passed ?? false;
  const scorePct = score_summary?.score_pct ?? 0;

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
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-5 shadow-xs dark:border-gray-800 dark:bg-gray-900">
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
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${isPassed
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                    }`}
                >
                  {isPassed ? "Passed" : "Needs Review"}
                </span>
                <span className="rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[10px] text-gray-600 font-mono dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300">
                  {reportData.test_code || "TEST"}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {reportData.title || "Academic Assessment"}
              </h1>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Candidate: <strong className="text-gray-700 dark:text-gray-200">{studentEmail}</strong> • Window Closes:{" "}
                <span className="font-mono text-gray-600 dark:text-gray-300">{formatDateTime(test_window_end)}</span>
              </p>
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

        {/* ── Viva Ineligibility Notice (if viva was configured but student didn't qualify) ─ */}
        {reportData.have_viva && !reportData.viva_eligible && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">Viva Voce Round Notice</p>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300/90 leading-relaxed">
                This assessment was configured with an AI Viva Voce session requiring a minimum score of{" "}
                <strong>{reportData.viva_threshold ?? 50}%</strong>. Your evaluated score was{" "}
                <strong>{scorePct}%</strong>. As the passing threshold was not met, the viva round was not conducted and
                your evaluation is based on your MCQ responses alone.
              </p>
            </div>
          </div>
        )}

        {/* ── Mode Toggle: Shown ONLY if Viva is Enabled and Conducted ── */}
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
              <span>MCQ Results</span>
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
              <span>Viva Voce Results</span>
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: MCQ Results View (Default & Single view if Viva Disabled)  */}
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
                    {scorePct}%
                  </span>
                  <span className={`text-xs font-bold ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {isPassed ? "Passed" : "Needs Review"}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isPassed ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, Math.max(0, scorePct))}%` }}
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
                    {score_summary?.correct_count ?? 0}
                  </span>
                  <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 font-mono">
                    / {score_summary?.total_questions ?? 0}
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
                    {score_summary?.incorrect_count ?? 0}
                  </span>
                  <span className="text-xs text-rose-600/70 dark:text-rose-400/70 font-mono">
                    / {score_summary?.total_questions ?? 0}
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
                    {score_summary?.unanswered_count ?? 0}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">/ {score_summary?.total_questions ?? 0}</span>
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
                      Incorrect ({score_summary?.incorrect_count || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestionFilter("correct")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${questionFilter === "correct"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-bold"
                          : "text-gray-600 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
                        }`}
                    >
                      Correct ({score_summary?.correct_count || 0})
                    </button>
                  </div>
                )}
              </div>

              {/* ── Case A: Window is Still Open (Answers Locked) ─────────── */}
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
                      Unlocks on: {formatDateTime(test_window_end)}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Case B: Window is Closed (Detailed Answers Unlocked) ───── */}
              {can_view_detailed_answers && (
                <div className="space-y-4">
                  {filteredQuestions.length === 0 ? (
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center text-xs text-gray-500 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-400">
                      No questions match the selected filter.
                    </div>
                  ) : (
                    filteredQuestions.map((q, idx) => {
                      const isUnanswered = !q.selected_option;
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
                                {q.question_index || idx + 1}
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
                            {q.question_string}
                          </h3>

                          {/* Options Grid */}
                          <div className="space-y-2 pt-1">
                            {q.options.map((optText, oIdx) => {
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
                                    <span>{optText}</span>
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
                          {q.explanation && (
                            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-900 dark:border-indigo-900/40 dark:bg-indigo-950/20 dark:text-indigo-200 leading-relaxed">
                              <strong className="text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                                Rationale & Concept Explanation:
                              </strong>
                              {q.explanation}
                            </div>
                          )}
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
        {/* VIEW 2: Viva Results View (Shown when toggled & viva report exists) */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "viva" && hasVivaTab && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Qualitative Metrics */}
            <div className="lg:col-span-5 space-y-6">
              {/* Viva Metrics */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <span>Oral Examination Metrics</span>
                  <Award className="h-4 w-4 text-amber-500" />
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">Oral Questions Evaluated</span>
                    <span className="font-mono text-base font-bold text-gray-900 dark:text-white">
                      {normalizedVivaReport.session_metrics.total_questions_asked || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-2.5">
                    <span className="text-gray-500 dark:text-gray-400">Correct Articulations</span>
                    <span className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {normalizedVivaReport.session_metrics.total_answered_correctly || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-2.5">
                    <span className="text-gray-500 dark:text-gray-400">Viva Score Evaluated</span>
                    <span className="font-mono text-base font-bold text-indigo-600 dark:text-indigo-400">
                      {normalizedVivaReport.session_metrics.viva_score || reportData.viva_score || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Overall Understanding */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
                  Conceptual Understanding
                </h3>
                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                    Level: {normalizedVivaReport.assessment_summary.overall_understanding.replace("_", " ")}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-xs leading-relaxed">
                  {normalizedVivaReport.assessment_summary.summary}
                </p>
              </div>

              {/* Communication Skills */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
                  Communication & Presentation
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[10px] mb-0.5">
                      Articulation
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {normalizedVivaReport.assessment_summary.communication_skills.articulation}
                    </p>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-800 pt-2.5">
                    <h4 className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px] mb-0.5">
                      Confidence & Poise
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {normalizedVivaReport.assessment_summary.communication_skills.confidence}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Strengths & Improvement Areas */}
            <div className="lg:col-span-7 space-y-6">
              {/* Strengths & Improvement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs dark:border-emerald-900/40 dark:bg-gray-900 space-y-3">
                  <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Demonstrated Strengths
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    {normalizedVivaReport.key_strengths.map((s: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-xs dark:border-amber-900/40 dark:bg-gray-900 space-y-3">
                  <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Focus Areas
                  </h3>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    {normalizedVivaReport.priority_improvement_areas.map((p: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Dialogue History / Q&A Transcript */}
              {normalizedVivaReport.dialogue_history?.length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-indigo-500" />
                    <span>Interview Dialogue Transcript</span>
                  </h3>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {normalizedVivaReport.dialogue_history.map((d: any, idx: number) => (
                      <div
                        key={idx}
                        className={`rounded-xl p-3.5 text-xs space-y-1 ${d.role === "assistant" || d.speaker === "ai"
                            ? "bg-indigo-50/60 border border-indigo-100 text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-200"
                            : "bg-gray-50 border border-gray-100 text-gray-800 dark:bg-gray-800/40 dark:border-gray-700 dark:text-gray-200"
                          }`}
                      >
                        <span className="font-bold uppercase tracking-wider text-[10px] text-gray-500 dark:text-gray-400 block">
                          {d.role === "assistant" || d.speaker === "ai" ? "AI Interviewer" : "Student Candidate"}
                        </span>
                        <p className="leading-relaxed">{d.content || d.text || ""}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateRouter(StudentReportPage);
