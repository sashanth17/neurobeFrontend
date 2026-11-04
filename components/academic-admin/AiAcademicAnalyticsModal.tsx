import React, { useState, useEffect, useCallback } from "react";
import {
  academicAdminAiService,
  AiSuggestionReport,
  AiImprovementPoint,
  GenerateSuggestionInput,
} from "@/services/academicAdminAiDb.service";

interface AiAcademicAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportInput: GenerateSuggestionInput;
}

const POINT_ICONS: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  pedagogy_suggestions: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    label: "Point 1: Pedagogy Suggestions",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  anomaly_detections: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    label: "Point 2: Anomaly Detections",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  cause_analysis: {
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    label: "Point 3: Cause of Problem Analysis",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  remedy_to_solve: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Point 4: Remedy to Solve",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  assessment_improvements: {
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    label: "Point 5: Assessment Improvements",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  strategic_action_plan: {
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
    label: "Point 6: Strategic Action Plan",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
};

export const AiAcademicAnalyticsModal: React.FC<AiAcademicAnalyticsModalProps> = ({
  isOpen,
  onClose,
  reportInput,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentReport, setCurrentReport] = useState<AiSuggestionReport | null>(null);
  const [pastSuggestions, setPastSuggestions] = useState<AiSuggestionReport[]>([]);
  const [selectedPastId, setSelectedPastId] = useState<string | null>(null);
  const [showMemorySection, setShowMemorySection] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Load or generate a fresh suggestion every time the window is opened
  const loadOrGenerate = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch past suggestions from DB
      const history = await academicAdminAiService.getPastSuggestions(reportInput.type);
      setPastSuggestions(history);

      // 2. Generate a new suggestion from the current report (injecting past 4-5 suggestions into prompt)
      const newReport = await academicAdminAiService.generateAndStoreReport(reportInput);
      setCurrentReport(newReport);
      setSelectedPastId(newReport.id);

      // 3. Update history list with the new run at front
      setPastSuggestions((prev) => [newReport, ...prev.filter((x) => x.id !== newReport.id)]);
    } catch (err) {
      console.error("Failed to generate AI suggestion:", err);
    } finally {
      setLoading(false);
    }
  }, [reportInput]);

  // Trigger when modal opens
  useEffect(() => {
    if (isOpen) {
      loadOrGenerate();
    }
  }, [isOpen, loadOrGenerate]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // The active displayed suggestion (either current newly generated or selected past suggestion)
  const displayedReport =
    selectedPastId && selectedPastId !== currentReport?.id
      ? pastSuggestions.find((p) => p.id === selectedPastId) || currentReport
      : currentReport;

  const handleClearMemory = async () => {
    if (window.confirm("Are you sure you want to clear historical AI memory for this section?")) {
      await academicAdminAiService.clearHistory(reportInput.type);
      if (currentReport) {
        setPastSuggestions([currentReport]);
      } else {
        setPastSuggestions([]);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex flex-col overflow-hidden animate-fadeIn">
      {/* ── Top Header ── */}
      <header className="bg-white dark:bg-[#1a2234] border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>AI Academic Intelligence</span>
            </span>
            <span className="text-xs text-gray-400 font-medium">•</span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {reportInput.type} Effectiveness Analysis
            </span>
            <span className="text-xs text-gray-400 font-medium">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Dept: <strong>{reportInput.department}</strong> | Target: <strong>{reportInput.targetBenchmark}%</strong>
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <span>6 Key Improvement & Analytics Points</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300">
              Auto-Stored to DB
            </span>
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Toggle Memory Section */}
          <button
            type="button"
            onClick={() => setShowMemorySection((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
              showMemorySection
                ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Memory & Past Suggestions ({pastSuggestions.length})</span>
          </button>

          {/* Regenerate Fresh Point */}
          <button
            type="button"
            onClick={loadOrGenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white transition-all shadow-xs disabled:opacity-50"
            title="Generate a new suggestion based on latest changes"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? "Generating..." : "Generate New Run"}</span>
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-all border border-gray-300 dark:border-gray-700 shadow-xs"
          >
            <span>Close</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
              ESC
            </kbd>
          </button>
        </div>
      </header>

      {/* ── Main View Container: Split between Memory Section & 6 Points ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Memory Maintaining Section (Sidebar Drawer) */}
        {showMemorySection && (
          <aside className="w-80 lg:w-96 bg-gray-50 dark:bg-[#151c2e] border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Memory Log & DB History</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Past 4-5 runs are automatically injected into prompt for change detection.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearMemory}
                className="text-[11px] text-rose-500 hover:text-rose-700 font-bold hover:underline"
                title="Clear memory history"
              >
                Clear
              </button>
            </div>

            {/* List of Past Suggestions */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {pastSuggestions.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-400">
                  No previous suggestions recorded yet.
                </div>
              ) : (
                pastSuggestions.map((item, index) => {
                  const isSelected = item.id === displayedReport?.id;
                  const isLatest = index === 0;
                  const dateStr = new Date(item.timestamp).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedPastId(item.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? "bg-white dark:bg-gray-800 border-primary ring-2 ring-primary/20 shadow-sm"
                          : "bg-white/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {isLatest && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Current / New
                            </span>
                          )}
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            Run #{pastSuggestions.length - index}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">{dateStr}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] mt-1 text-gray-600 dark:text-gray-400">
                        <span>
                          Score:{" "}
                          <strong className="text-gray-900 dark:text-white">
                            {item.current_metrics.total_attainment_pct.toFixed(1)}%
                          </strong>
                        </span>
                        <span>
                          Target: <strong>{item.filters.targetBenchmark}%</strong>
                        </span>
                        <span className="text-rose-500 font-semibold">
                          {item.current_metrics.pulling_down_count} Lows
                        </span>
                      </div>

                      {item.detected_changes?.score_diff !== undefined && (
                        <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-700/60 text-[10px]">
                          <span
                            className={
                              item.detected_changes.score_diff >= 0
                                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                : "text-rose-600 dark:text-rose-400 font-bold"
                            }
                          >
                            {item.detected_changes.score_diff >= 0 ? "+" : ""}
                            {item.detected_changes.score_diff}% change vs prior
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Memory Info Footer */}
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300">
              <span className="font-bold">Memory Engine:</span> Injects last 4-5 runs into prompt to analyze trajectory and avoid redundant advice.
            </div>
          </aside>
        )}

        {/* ── Center & Right: The 6 Points Display ── */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0f172a] space-y-5">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white mb-4 animate-bounce shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                Generating 6 Improvement & Analytics Points...
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mt-1">
                Injecting past 4-5 memory records, evaluating cognitive levels (K1-K6), detecting anomalies, and writing actionable remedies into DB.
              </p>
            </div>
          ) : !displayedReport ? (
            <div className="py-20 text-center text-xs text-gray-400">
              No analysis available. Click &quot;Generate New Run&quot; above.
            </div>
          ) : (
            <>
              {/* ── Banner: Detected Changes from Injected Past Memory ── */}
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-blue-50/90 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-600 text-white">
                        Memory Change Detection
                      </span>
                      <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                        {displayedReport.injected_past_count > 0
                          ? `Context Injected: Evaluated Against ${displayedReport.injected_past_count} Past Suggestions`
                          : "Initial Baseline Run"}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                      {displayedReport.detected_changes.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {displayedReport.id !== currentReport?.id && (
                      <button
                        type="button"
                        onClick={() => setSelectedPastId(currentReport?.id || null)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 text-primary border border-primary shadow-xs hover:bg-primary hover:text-white transition-all"
                      >
                        Return to Current Run
                      </button>
                    )}
                  </div>
                </div>

                {/* Specific Change Highlights */}
                {(displayedReport.detected_changes.improved_aspects.length > 0 ||
                  displayedReport.detected_changes.critical_alerts.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-800/60 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedReport.detected_changes.improved_aspects.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Positive Momentum Detected:</span>
                        </span>
                        <ul className="text-[11px] text-gray-700 dark:text-gray-300 list-disc list-inside space-y-0.5 pl-1">
                          {displayedReport.detected_changes.improved_aspects.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {displayedReport.detected_changes.critical_alerts.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span>Critical Trajectory Alerts:</span>
                        </span>
                        <ul className="text-[11px] text-gray-700 dark:text-gray-300 list-disc list-inside space-y-0.5 pl-1">
                          {displayedReport.detected_changes.critical_alerts.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Filter / Navigation Tabs for 6 Points ── */}
              <div className="flex items-center gap-2 flex-wrap pb-1 border-b border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "all"
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                  }`}
                >
                  All 6 Points
                </button>
                {Object.keys(POINT_ICONS).map((key) => {
                  const meta = POINT_ICONS[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTab(key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeTab === key
                          ? "bg-primary text-white shadow-xs"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                      }`}
                    >
                      {meta.label.split(":")[1]?.trim() || meta.label}
                    </button>
                  );
                })}
              </div>

              {/* ── The 6 Improvement and Analytics Points Cards ── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {(Object.entries(displayedReport.points) as [string, AiImprovementPoint][])
                  .filter(([cat]) => activeTab === "all" || activeTab === cat)
                  .map(([cat, point]) => {
                    const meta = POINT_ICONS[cat] || POINT_ICONS.pedagogy_suggestions;

                    return (
                      <div
                        key={cat}
                        className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                      >
                        {/* Point Header */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-xl ${meta.bg} ${meta.text} flex items-center justify-center`}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={meta.icon} />
                                </svg>
                              </div>
                              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                {meta.label}
                              </span>
                            </div>

                            {/* Priority Badge */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${
                                point.priority === "CRITICAL"
                                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  : point.priority === "HIGH"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              {point.priority} Priority
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                            {point.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">
                            {point.summary}
                          </p>
                        </div>

                        {/* Diagnostic Findings */}
                        {point.key_findings && point.key_findings.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                              Diagnostic Findings & Analytics Evidence
                            </span>
                            <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1 pl-1">
                              {point.key_findings.map((f, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-primary font-bold">•</span>
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Actionable Remedies / Prescriptions */}
                        {point.action_items && point.action_items.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                              Prescribed Action Items & Remedial Steps
                            </span>
                            <div className="space-y-1.5">
                              {point.action_items.map((act, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200"
                                >
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                                    {i + 1}.
                                  </span>
                                  <span>{act}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Projected Impact Footer */}
                        {point.impact && (
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Projected Impact:</span>
                            <span className="font-bold text-gray-800 dark:text-gray-200 text-right">
                              {point.impact}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Footer ── */}
      <footer className="bg-white dark:bg-[#1a2234] border-t border-gray-200 dark:border-gray-800 px-6 py-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 shrink-0">
        <div>
          Auto-synchronized with DB:{" "}
          <strong className="text-gray-900 dark:text-white">neurobe_academic_ai_db</strong> (IndexedDB & LocalStorage) • Memory Depth: 5 historical checkpoints
        </div>
        <div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            Close Window
          </button>
        </div>
      </footer>
    </div>
  );
};

export default AiAcademicAnalyticsModal;

