import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  Activity,
  Users,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  BarChart2,
  Wifi,
  WifiOff,
  RefreshCw,
  XCircle,
  Shield,
  Zap,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import { useLiveMonitor, StudentStat } from "@/hooks/useLiveMonitor";
import Models from "@/imports/models.import";

// ──────────────────────────────────────────────────────────────────────────────

const statusColor: Record<string, string> = {
  active: "bg-emerald-400",
  submitted: "bg-indigo-400",
  offline: "bg-gray-300",
  idle: "bg-yellow-400",
  Flagged: "bg-red-400",
};

const statusLabel: Record<string, string> = {
  active: "Active",
  submitted: "Submitted",
  offline: "Offline",
  idle: "Idle",
  Flagged: "Flagged",
};

// ──────────────────────────────────────────────────────────────────────────────

const MCQLiveMonitor = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { test_id, test_title, course_id } = router.query;

  const testId = Array.isArray(test_id) ? test_id[0] : test_id;
  const testTitle = Array.isArray(test_title) ? test_title[0] : test_title;

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [httpStats, setHttpStats] = useState<any>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [currentServerTime, setCurrentServerTime] = useState<number>(Date.now());

  // 10-second ticker to re-evaluate live window dynamically
  useEffect(() => {
    const clock = setInterval(() => setCurrentServerTime(Date.now()), 10000);
    return () => clearInterval(clock);
  }, []);

  const { isConnected, studentStats, kpis, lastEvent, sendEndTest, requestSnapshot } =
    useLiveMonitor(testId);

  useEffect(() => {
    dispatch(setPageTitle("Live Monitor — MCQ Test"));
  }, [dispatch]);

  // Load available tests to allow faculty to switch between tests or auto-select active test
  const loadAvailableTests = async () => {
    setLoadingTests(true);
    try {
      const res: any = await Models.mcq.list_tests(course_id ? { course_id } : {}).catch(() => []);
      const list: any[] = Array.isArray(res) ? res : (res?.data || []);
      const active = list.filter((t: any) => {
        const s = (t.status || "").toLowerCase();
        return s !== "cancelled" && s !== "canceled";
      });
      setAvailableTests(active);

      // If testId is not present in URL, auto-select the first Live test or first active test
      if (!testId && active.length > 0) {
        const now = Date.now();
        const liveOne = active.find((t: any) => {
          if (t.status?.toLowerCase() === "live") return true;
          if (t.test_window_start && t.test_window_end) {
            const ws = new Date(t.test_window_start).getTime();
            const we = new Date(t.test_window_end).getTime();
            return now >= ws && now <= we;
          }
          return false;
        });
        const chosen = liveOne || active[0];
        router.replace(
          {
            pathname: router.pathname,
            query: {
              ...router.query,
              test_id: chosen.test_id || chosen.id,
              test_title: chosen.title,
              course_id: chosen.course_id || router.query.course_id,
            },
          },
          undefined,
          { shallow: true }
        );
      }
    } catch (err) {
      console.error("Failed to load tests for live monitor:", err);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    loadAvailableTests();
  }, [course_id]);

  // Current test object from available list
  const currentTestObj = useMemo(() => {
    return availableTests.find((t) => (t.test_id || t.id) === testId) || null;
  }, [availableTests, testId]);

  // Dynamic evaluation: is this test currently Live?
  const isCurrentLive = useMemo(() => {
    if (!currentTestObj) {
      return (httpStats?.status || "").toLowerCase() === "live";
    }
    const rawSt = (currentTestObj.status || "").toLowerCase();
    if (rawSt === "live" || rawSt === "active" || rawSt === "ongoing") return true;
    if (currentTestObj.test_window_start && currentTestObj.test_window_end) {
      const ws = new Date(currentTestObj.test_window_start).getTime();
      const we = new Date(currentTestObj.test_window_end).getTime();
      return currentServerTime >= ws && currentServerTime <= we;
    }
    return false;
  }, [currentTestObj, currentServerTime, httpStats]);

  // Load initial HTTP snapshot
  useEffect(() => {
    if (!testId) return;
    const loadStats = async () => {
      try {
        const res: any = await Models.mcq.get_live_stats(testId).catch(() => null);
        setHttpStats(res);
      } catch {
        // silently ignore
      } finally {
        setLoadingInitial(false);
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [testId]);

  // Merge HTTP stats with WS stats
  const mergedStudents: StudentStat[] = useMemo(() => {
    if (studentStats.length > 0) return studentStats;
    if (httpStats?.per_student) {
      return httpStats.per_student.map((s: any) => ({
        student_email: s.student_email,
        answered: s.answered || 0,
        correct: s.correct || 0,
        incorrect: s.incorrect || 0,
        score_pct: s.score_pct || 0,
        tab_switch_count: s.tab_switch_count || 0,
        flagged: s.flagged || false,
        status: s.status || "active",
      }));
    }
    return [];
  }, [studentStats, httpStats]);

  const displayKpis = useMemo(() => {
    if (isConnected && kpis.totalEnrolled > 0) return kpis;
    if (httpStats) {
      return {
        connected: httpStats.connected_now || 0,
        submitted: httpStats.submitted_count || 0,
        totalEnrolled: httpStats.total_enrolled || 0,
        avgScore: httpStats.avg_score_pct || 0,
        completionPct: httpStats.completion_rate_pct || 0,
      };
    }
    return kpis;
  }, [isConnected, kpis, httpStats]);

  const flaggedCount = mergedStudents.filter((s) => s.flagged).length;

  const handleEndTest = async () => {
    if (!testId) return;
    try {
      sendEndTest("Instructor ended test from Live Monitor");
      await Models.mcq.cancel_test(testId).catch(() => null);
      Success("Test ended. All students have been disconnected.");
      setConfirmEnd(false);
      setTimeout(() => router.push(`/neurobe/ins-mcq-test-execution?course_id=${course_id || ""}`), 1500);
    } catch (e: any) {
      Failure(e?.message || "Failed to end test");
    }
  };

  return (
    <div className="min-h-screen space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Activity className={`h-5 w-5 ${isCurrentLive ? "text-emerald-500 animate-pulse" : "text-amber-500"}`} />
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Live Monitor
                </h1>
              </div>

              {/* Status Badge: Live vs Upcoming */}
              {testId && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                    isCurrentLive
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isCurrentLive ? "bg-emerald-500 animate-ping" : "bg-amber-400"
                    }`}
                  />
                  {isCurrentLive ? "• Live Assessment" : "⏳ Upcoming Assessment"}
                </span>
              )}
            </div>

            {/* Test Selector Dropdown */}
            {availableTests.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={testId || ""}
                  onChange={(e) => {
                    const chosen = availableTests.find((t) => (t.test_id || t.id) === e.target.value);
                    if (chosen) {
                      router.replace(
                        {
                          pathname: router.pathname,
                          query: {
                            ...router.query,
                            test_id: chosen.test_id || chosen.id,
                            test_title: chosen.title,
                            course_id: chosen.course_id || router.query.course_id,
                          },
                        },
                        undefined,
                        { shallow: true }
                      );
                    }
                  }}
                  className="rounded-xl border border-gray-300 bg-white py-1 px-3 text-xs font-bold text-gray-800 shadow-xs focus:border-emerald-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                >
                  {availableTests.map((t) => {
                    const tid = t.test_id || t.id;
                    const isL = (() => {
                      if ((t.status || "").toLowerCase() === "live") return true;
                      if (t.test_window_start && t.test_window_end) {
                        const ws = new Date(t.test_window_start).getTime();
                        const we = new Date(t.test_window_end).getTime();
                        return currentServerTime >= ws && currentServerTime <= we;
                      }
                      return false;
                    })();
                    return (
                      <option key={tid} value={tid}>
                        {isL ? "🟢 [LIVE] " : "⏳ [UPCOMING] "} {t.title} ({t.duration_minutes || 30}m)
                      </option>
                    );
                  })}
                </select>

                {currentTestObj?.test_window_start && (
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                    Window: {new Date(currentTestObj.test_window_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(currentTestObj.test_window_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>
            ) : testTitle ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">{testTitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* WS Connection Badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              isConnected
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
            }`}
          >
            {isConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {isConnected ? "WS Connected" : "Reconnecting…"}
          </span>

          {testId && (
            <button
              type="button"
              onClick={() => router.push(`/neurobe/ins-mcq-report?test_id=${testId}`)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <BarChart2 className="h-3.5 w-3.5 text-indigo-500" />
              Report
            </button>
          )}

          {/* Snapshot refresh */}
          <button
            type="button"
            onClick={requestSnapshot}
            title="Request fresh snapshot"
            className="rounded-xl border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* End Test Button */}
          {!confirmEnd ? (
            <button
              type="button"
              onClick={() => setConfirmEnd(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 active:scale-[0.98] transition-all shadow-sm"
            >
              <XCircle className="h-4 w-4" />
              End Test
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-red-600">Confirm end?</span>
              <button
                type="button"
                onClick={handleEndTest}
                className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                Yes, End Now
              </button>
              <button
                type="button"
                onClick={() => setConfirmEnd(false)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Empty State when no assessments exist */}
      {!testId && availableTests.length === 0 && !loadingTests && (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <Activity className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
            No Active Assessments Found
          </h2>
          <p className="mt-2 text-xs text-gray-500 max-w-md mx-auto dark:text-gray-400">
            There are currently no scheduled or ongoing assessments to monitor. You can schedule new tests from the MCQ Test Execution dashboard.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/neurobe/ins-mcq-test-execution")}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-500 transition shadow-sm cursor-pointer"
            >
              Go to MCQ Test Execution →
            </button>
            <button
              type="button"
              onClick={() => router.push("/neurobe/my-assigned-courses")}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 transition cursor-pointer"
            >
              Faculty Dashboard
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {[
          {
            label: "Total Enrolled",
            value: displayKpis.totalEnrolled,
            icon: <Users className="h-5 w-5" />,
            color: "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900",
          },
          {
            label: "Connected Live",
            value: displayKpis.connected,
            icon: <Wifi className="h-5 w-5" />,
            color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900",
          },
          {
            label: "Submitted",
            value: displayKpis.submitted,
            icon: <CheckCircle className="h-5 w-5" />,
            color: "text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900",
          },
          {
            label: "Completion",
            value: `${Math.round(displayKpis.completionPct)}%`,
            icon: <Zap className="h-5 w-5" />,
            color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900",
          },
          {
            label: "Flagged",
            value: flaggedCount,
            icon: <AlertTriangle className="h-5 w-5" />,
            color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900",
          },
        ].map((kpi, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-4 ${kpi.color} transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider opacity-80">{kpi.label}</span>
              <span className="opacity-70">{kpi.icon}</span>
            </div>
            <p className="mt-2 text-2xl font-black">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Student List */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-xs dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-500" />
            Student Monitoring Table
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {mergedStudents.length} students
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th className="px-6 py-3">Student Email</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Answered</th>
                <th className="px-4 py-3 text-center">Tab Switches</th>
                <th className="px-4 py-3 text-center">Flagged</th>
                <th className="px-4 py-3 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loadingInitial && mergedStudents.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : mergedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400 dark:text-gray-600">
                    No students connected yet. Waiting for students to join…
                  </td>
                </tr>
              ) : (
                mergedStudents.map((s) => (
                  <tr
                    key={s.student_email}
                    className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      s.flagged ? "bg-red-50/40 dark:bg-red-950/10" : ""
                    }`}
                  >
                    <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                      {s.student_email}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${statusColor[s.status] || "bg-gray-300"}`}
                        />
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {statusLabel[s.status] || s.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">
                      {s.answered}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`font-bold ${
                          s.tab_switch_count > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {s.tab_switch_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.flagged ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold text-red-700 dark:bg-red-950/40 dark:text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          Flagged
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.score_pct > 0 ? (
                        <span
                          className={`font-bold ${
                            s.score_pct >= 75
                              ? "text-emerald-600"
                              : s.score_pct >= 40
                              ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {s.score_pct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Event Stream */}
      {lastEvent && (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-xs dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            Last Event
          </h3>
          <pre className="overflow-x-auto rounded-xl bg-gray-50 p-3 text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {JSON.stringify(lastEvent, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(MCQLiveMonitor);
