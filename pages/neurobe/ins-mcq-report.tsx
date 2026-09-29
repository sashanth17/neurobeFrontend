import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  FileBarChart,
  Users,
  CheckCircle,
  XCircle,
  BarChart2,
  AlertTriangle,
  Download,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import Models from "@/imports/models.import";

interface StudentReport {
  student_email: string;
  score_pct: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  tab_switch_count: number;
  time_taken_seconds: number;
  auto_submitted: boolean;
  flagged: boolean;
  per_question: Array<{ question_id: string; selected_option: string; is_correct: boolean }>;
}

interface QuestionReport {
  question_id: string;
  question_index?: number;
  question_text?: string;
  options?: string[];
  correct_answer?: string;
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  total_attempts?: number;
  correct_pct: number;
}

interface ReportData {
  test_id: string;
  test_code: string;
  title: string;
  completed_at: string | null;
  total_students: number;
  submitted_count: number;
  class_avg_pct: number;
  pass_count: number;
  fail_count: number;
  highest_score_pct: number;
  lowest_score_pct: number;
  flagged_students: number;
  students: StudentReport[];
  questions: QuestionReport[];
}

// ──────────────────────────────────────────────────────────────────────────────

const scoreColor = (pct: number) => {
  if (pct >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
};

const ScoreBar = ({ pct }: { pct: number }) => (
  <div className="relative h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
    <div
      className={`absolute left-0 top-0 h-1.5 rounded-full transition-all duration-700 ${
        pct >= 75 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"
      }`}
      style={{ width: `${Math.min(100, pct)}%` }}
    />
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────

const MCQTestReport = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { test_id, test_title, course_id } = router.query;

  const testId = Array.isArray(test_id) ? test_id[0] : test_id;
  const testTitle = Array.isArray(test_title) ? test_title[0] : test_title;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(setPageTitle("Test Report — MCQ Assessment"));
  }, [dispatch]);

  useEffect(() => {
    if (!testId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data: any = await Models.mcq.get_test_report(testId);
        setReport(data as ReportData);
      } catch (e: any) {
        setError(e?.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [testId]);

  const filteredStudents = useMemo(() => {
    if (!report) return [];
    // Only show students who actually submitted (answered at least 1 question)
    const attended = report.students.filter(
      (st) => (st.correct + st.incorrect + st.unanswered) > 0 || st.time_taken_seconds > 0
    );
    if (!search.trim()) return attended;
    const s = search.toLowerCase();
    return attended.filter((st) =>
      st.student_email.toLowerCase().includes(s)
    );
  }, [report, search]);

  const nonAttendingStudents = useMemo(() => {
    if (!report) return [];
    return report.students.filter(
      (st) => (st.correct + st.incorrect + st.unanswered) === 0 && st.time_taken_seconds === 0
    );
  }, [report]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading assessment report…</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <XCircle className="h-10 w-10 text-red-400" />
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {error || "Report not found"}
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-indigo-500" />
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Assessment Report
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {report.title || testTitle}{" "}
              <span className="font-mono text-indigo-500">· {report.test_code}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Download className="h-4 w-4" />
          Export / Print
        </button>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {[
          { label: "Total Students", value: report.total_students, icon: <Users className="h-4 w-4" />, cls: "text-indigo-600 dark:text-indigo-400 bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/40" },
          { label: "Submitted", value: report.submitted_count, icon: <CheckCircle className="h-4 w-4" />, cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40" },
          { label: "Not Attended", value: nonAttendingStudents.length, icon: <AlertTriangle className="h-4 w-4" />, cls: "text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40" },
          { label: "Class Avg", value: `${report.class_avg_pct.toFixed(1)}%`, icon: <BarChart2 className="h-4 w-4" />, cls: "text-purple-600 dark:text-purple-400 bg-purple-50/70 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/40" },
          { label: "Passed", value: report.pass_count, icon: <Trophy className="h-4 w-4" />, cls: "text-teal-600 dark:text-teal-400 bg-teal-50/70 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/40" },
          { label: "Failed", value: report.fail_count, icon: <XCircle className="h-4 w-4" />, cls: "text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40" },
          { label: "Highest Score", value: `${report.highest_score_pct.toFixed(1)}%`, icon: <TrendingUp className="h-4 w-4" />, cls: "text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40" },
          { label: "Flagged", value: report.flagged_students, icon: <AlertTriangle className="h-4 w-4" />, cls: "text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40" },
        ].map((kpi, i) => (
          <div key={i} className={`rounded-2xl border p-3 ${kpi.cls}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">{kpi.label}</span>
              <span className="opacity-80">{kpi.icon}</span>
            </div>
            <p className="mt-1.5 text-xl font-black">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Per Student Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Student Results ({filteredStudents.length} attended)
            </h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email…"
              className="h-9 w-64 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs focus:border-indigo-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-6 py-3">#</th>
                  <th className="px-4 py-3">Student Email</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-center">Correct</th>
                  <th className="px-4 py-3 text-center">Wrong</th>
                  <th className="px-4 py-3 text-center">Unanswered</th>
                  <th className="px-4 py-3 text-center">Tab Switches</th>
                  <th className="px-4 py-3 text-center">Time</th>
                  <th className="px-4 py-3 text-center">Flagged</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                      No students have submitted this assessment yet.
                    </td>
                  </tr>
                ) : (
                  filteredStudents
                    .slice()
                    .sort((a, b) => b.score_pct - a.score_pct)
                    .map((s, idx) => (
                      <tr
                        key={s.student_email}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors ${
                          s.flagged ? "bg-red-50/30 dark:bg-red-950/10" : ""
                        }`}
                      >
                        <td className="px-6 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {s.student_email}
                          {s.auto_submitted && (
                            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                              Auto-Submitted
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="space-y-1">
                            <span className={`font-black text-sm ${scoreColor(s.score_pct)}`}>
                              {s.score_pct.toFixed(1)}%
                            </span>
                            <ScoreBar pct={s.score_pct} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-emerald-600 dark:text-emerald-400">
                          {s.correct}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-red-500 dark:text-red-400">
                          {s.incorrect}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          {s.unanswered}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`font-bold ${
                              s.tab_switch_count > 0
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-gray-400"
                            }`}
                          >
                            {s.tab_switch_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          {s.time_taken_seconds > 0
                            ? `${Math.round(s.time_taken_seconds / 60)}m`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.flagged ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Flagged
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Not Attended Students */}
      {nonAttendingStudents.length > 0 && (
        <div className="rounded-2xl border border-orange-200 bg-white shadow-xs dark:border-orange-900/40 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100 px-6 py-4 dark:border-orange-900/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                Did Not Attend ({nonAttendingStudents.length} students)
              </h2>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">These students were enrolled but did not submit the assessment.</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="px-6 py-3">#</th>
                  <th className="px-4 py-3">Student Email</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {nonAttendingStudents.map((s, idx) => (
                  <tr key={s.student_email} className="hover:bg-orange-50/30 dark:hover:bg-orange-950/10 transition-colors">
                    <td className="px-6 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{s.student_email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Not Attended
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    );
  };

export default PrivateRouter(MCQTestReport);
