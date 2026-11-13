import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  academicAdminAiService,
  AiSuggestionReport,
  AiImprovementPoint,
  GenerateSuggestionInput,
  AiSuggestionScope,
  ScopedFilterSelection,
} from "@/services/academicAdminAiDb.service";
import {
  CourseBreakdownItem,
  academicAdminService,
} from "@/services/academicAdminAnalytics.service";

interface AcademicAiSuggestionsChatProps {
  initialDepartment?: string;
  initialCourseCode?: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  timestamp: string;
  text?: string;
  report?: AiSuggestionReport;
  scopeBadge?: string;
}

const POINT_ICONS: Record<
  string,
  { bg: string; text: string; label: string; icon: string }
> = {
  pedagogy_suggestions: {
    bg: "bg-blue-500/10 dark:bg-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    label: "Point 1: Teaching & Classroom Tips",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  anomaly_detections: {
    bg: "bg-amber-500/10 dark:bg-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    label: "Point 2: Where Students Are Struggling",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  cause_analysis: {
    bg: "bg-rose-500/10 dark:bg-rose-500/20",
    text: "text-rose-600 dark:text-rose-400",
    label: "Point 3: Why Is This Happening?",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  remedy_to_solve: {
    bg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    label: "Point 4: How to Fix It (Simple Steps)",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  assessment_improvements: {
    bg: "bg-purple-500/10 dark:bg-purple-500/20",
    text: "text-purple-600 dark:text-purple-400",
    label: "Point 5: Test & Exam Paper Tips",
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  },
  strategic_action_plan: {
    bg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    text: "text-indigo-600 dark:text-indigo-400",
    label: "Point 6: Simple 4-Week Action Plan",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  },
};

export const AcademicAiSuggestionsChat: React.FC<AcademicAiSuggestionsChatProps> = ({
  initialDepartment = "ALL",
  initialCourseCode = "",
}) => {
  // ── Filters Inside Chatbot State ──
  const [selectedMode, setSelectedMode] = useState<"CIA" | "MCQ">("CIA");
  const [selectedScope, setSelectedScope] = useState<AiSuggestionScope>("OVERALL");
  const [selectedDept, setSelectedDept] = useState<string>(initialDepartment);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(initialCourseCode);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("ALL");
  const [targetBenchmark, setTargetBenchmark] = useState<number>(60);

  // Filter options from backend
  const [departments, setDepartments] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [batches, setBatches] = useState<Array<{ year: string }>>([]);
  const [courses, setCourses] = useState<CourseBreakdownItem[]>([]);

  // Chat message feed & UI state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [pastSuggestions, setPastSuggestions] = useState<AiSuggestionReport[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // STRICT MCQ RULE: When MCQ, no word "attainment" anywhere!
  const isMcq = selectedMode === "MCQ";
  const scoreTerm = isMcq ? "Score" : "Attainment";

  // Load backend filters & courses
  useEffect(() => {
    academicAdminService.getFilters().then((res) => {
      if (res?.departments) {
        setDepartments(res.departments);
      }
      if (res?.academic_years) {
        setBatches(res.academic_years.map((y) => ({ year: y.year })));
      }
    });

    // Fetch courses for scope filtering
    academicAdminService.getTeachingLearningEffectiveness("cia", "ALL", "ALL").then((res) => {
      if (res?.course_breakdown) {
        setCourses(res.course_breakdown);
      }
    });

    // Load past suggestions
    academicAdminAiService.getPastSuggestions(selectedMode).then((history) => {
      setPastSuggestions(history);
    });
  }, [selectedMode]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Filter courses by selected department
  const availableCourses = useMemo(() => {
    if (!courses || courses.length === 0) return [];
    if (selectedDept === "ALL") return courses;
    return courses.filter((c) => c.department_code === selectedDept);
  }, [courses, selectedDept]);

  // Selected course object
  const selectedCourseObj = useMemo(() => {
    return availableCourses.find((c) => c.course_code === selectedCourseCode) || availableCourses[0];
  }, [availableCourses, selectedCourseCode]);

  // Available classrooms for selected course
  const availableClassrooms = useMemo(() => {
    return selectedCourseObj?.instances || [];
  }, [selectedCourseObj]);

  // Selected classroom object
  const selectedClassroomObj = useMemo(() => {
    return availableClassrooms.find((cl) => String(cl.id || cl.instance_id) === String(selectedClassId)) || availableClassrooms[0];
  }, [availableClassrooms, selectedClassId]);

  // Scope summary string
  const scopeSummary = useMemo(() => {
    if (selectedScope === "OVERALL") return "College-Wide (All Departments & Courses)";
    if (selectedScope === "DEPARTMENT") return selectedDept === "ALL" ? "All Departments" : `Department of ${selectedDept}`;
    if (selectedScope === "COURSE") {
      return selectedCourseObj ? `${selectedCourseObj.course_code} - ${selectedCourseObj.course_title}` : "Selected Course";
    }
    if (selectedScope === "CLASS") {
      const cCode = selectedCourseObj ? selectedCourseObj.course_code : "";
      const clName = selectedClassroomObj ? selectedClassroomObj.name : "Section";
      const teacher = selectedClassroomObj?.faculty_name ? ` (Instructor: ${selectedClassroomObj.faculty_name})` : "";
      return `${cCode} - ${clName}${teacher}`;
    }
    return "College-Wide";
  }, [selectedScope, selectedDept, selectedCourseObj, selectedClassroomObj]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome-1",
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: `👋 Greetings, Academic Administrator. I am your Executive AI Academic Assistant.\n\nYou can use the **filters embedded directly in the header above** to focus my analysis on the **Overall College**, a specific **Department**, an individual **Course**, or a specific **Classroom Section**.\n\nClick one of the prompt chips below or ask me any question to generate actionable 6-point pedagogical recommendations and root-cause diagnostics.`,
        },
      ]);
    }
  }, [messages.length]);

  // ── Core Generation Function ──
  const handleGenerateReport = useCallback(
    async (customPrompt?: string) => {
      setLoading(true);

      const userText = customPrompt || `Generate comprehensive 6-point suggestions for ${scopeSummary} (${selectedMode} mode at ${targetBenchmark}% target).`;

      // Append user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: userText,
      };

      setMessages((prev) => [...prev, userMsg]);

      try {
        let scopedScore = 72.0;
        let scopedParticipation = 88;
        let scopedKLevels: Record<string, number> = { K1: 76, K2: 70, K3: 58, K4: 62, K5: 54, K6: 48 };
        let scopedPushingUp: any[] = [];
        let scopedPullingDown: any[] = [];

        const scopeSelection: ScopedFilterSelection = {
          scope: selectedScope,
          departmentCode: selectedDept,
          departmentName: selectedDept,
        };

        if (selectedScope === "DEPARTMENT" && selectedDept !== "ALL") {
          const deptCourses = availableCourses;
          if (deptCourses.length > 0) {
            const sum = deptCourses.reduce((acc, c) => acc + (c.attainment_pct || 0), 0);
            scopedScore = Number((sum / deptCourses.length).toFixed(1));
            scopedPushingUp = deptCourses
              .filter((c) => c.attainment_pct >= targetBenchmark)
              .map((c) => ({ course_code: c.course_code, course_name: c.course_title, department_code: c.department_code, attainment_pct: c.attainment_pct }));
            scopedPullingDown = deptCourses
              .filter((c) => c.attainment_pct < targetBenchmark)
              .map((c) => ({ course_code: c.course_code, course_name: c.course_title, department_code: c.department_code, attainment_pct: c.attainment_pct }));
          }
        } else if (selectedScope === "COURSE" && selectedCourseObj) {
          scopeSelection.courseCode = selectedCourseObj.course_code;
          scopeSelection.courseName = selectedCourseObj.course_title;
          scopedScore = selectedCourseObj.attainment_pct || scopedScore;
          if (selectedCourseObj.k_levels) {
            scopedKLevels = { ...selectedCourseObj.k_levels };
          }
        } else if (selectedScope === "CLASS" && selectedCourseObj && selectedClassroomObj) {
          scopeSelection.courseCode = selectedCourseObj.course_code;
          scopeSelection.courseName = selectedCourseObj.course_title;
          scopeSelection.classroomId = selectedClassroomObj.id;
          scopeSelection.classroomName = selectedClassroomObj.name;
          scopeSelection.facultyName = selectedClassroomObj.faculty_name;
          scopedScore = selectedClassroomObj.attainment_pct || scopedScore;
          if (selectedClassroomObj.k_levels) {
            scopedKLevels = { ...selectedClassroomObj.k_levels };
          }
        }

        const payload: GenerateSuggestionInput = {
          type: selectedMode,
          department: selectedDept,
          batch: selectedBatch,
          testFilter: "ALL",
          targetBenchmark,
          totalAttainmentPct: scopedScore,
          participationPct: scopedParticipation,
          kLevels: scopedKLevels,
          coursesPushingUp: scopedPushingUp,
          coursesPullingDown: scopedPullingDown,
          scopeSelection,
        };

        const newReport = await academicAdminAiService.generateAndStoreReport(payload);

        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          scopeBadge: `${selectedScope}: ${scopeSummary}`,
          report: newReport,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setPastSuggestions((prev) => [newReport, ...prev.filter((x) => x.id !== newReport.id)]);
      } catch (err) {
        console.error("Error generating AI suggestions:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            text: "⚠️ Sorry, an error occurred while processing the suggestion pipeline. Please retry.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      scopeSummary,
      selectedMode,
      targetBenchmark,
      selectedScope,
      selectedDept,
      selectedBatch,
      availableCourses,
      selectedCourseObj,
      selectedClassroomObj,
    ]
  );

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || loading) return;
    const txt = inputPrompt.trim();
    setInputPrompt("");
    handleGenerateReport(txt);
  };

  return (
    <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-[calc(100vh-180px)] overflow-hidden">
      {/* ── 1. EMBEDDED FILTERS INSIDE CHATBOT HEADER ── */}
      <div className="bg-slate-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700/80 p-3.5 space-y-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>AI Academic Advisor Chatbot</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[10px] font-black uppercase">
                  {selectedMode} Mode
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Context: <strong className="text-gray-800 dark:text-gray-200">{scopeSummary}</strong>
              </p>
            </div>
          </div>

          {/* Mode Switch & History Drawer Toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedMode("CIA")}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedMode === "CIA" ? "bg-white dark:bg-gray-900 text-primary shadow-xs" : "text-gray-600 dark:text-gray-300"
                }`}
              >
                CIA Mode
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("MCQ")}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedMode === "MCQ" ? "bg-white dark:bg-gray-900 text-primary shadow-xs" : "text-gray-600 dark:text-gray-300"
                }`}
              >
                MCQ Mode
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                showHistory
                  ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>History ({pastSuggestions.length})</span>
            </button>
          </div>
        </div>

        {/* ── Granular Scoped Filters Row inside Chat ── */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-gray-200/70 dark:border-gray-700/70 text-xs">
          {/* Scope Selector Pills */}
          <div className="flex items-center bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            {(["OVERALL", "DEPARTMENT", "COURSE", "CLASS"] as AiSuggestionScope[]).map((scope) => (
              <button
                key={scope}
                type="button"
                onClick={() => setSelectedScope(scope)}
                className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] transition ${
                  selectedScope === scope
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {scope}
              </button>
            ))}
          </div>

          {/* Department Dropdown (shown when scope is not OVERALL) */}
          {selectedScope !== "OVERALL" && (
            <div className="flex items-center gap-1">
              <span className="font-bold text-[10px] text-gray-500 uppercase">Dept:</span>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedCourseCode("");
                  setSelectedClassId("");
                }}
                className="form-select text-xs py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 font-bold"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Course Dropdown (shown when scope is COURSE or CLASS) */}
          {(selectedScope === "COURSE" || selectedScope === "CLASS") && (
            <div className="flex items-center gap-1">
              <span className="font-bold text-[10px] text-gray-500 uppercase">Course:</span>
              <select
                value={selectedCourseObj?.course_code || ""}
                onChange={(e) => {
                  setSelectedCourseCode(e.target.value);
                  setSelectedClassId("");
                }}
                className="form-select text-xs py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 font-bold max-w-[200px] truncate"
              >
                {availableCourses.map((c) => (
                  <option key={c.course_code} value={c.course_code}>
                    {c.course_code} - {c.course_title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Classroom Dropdown (shown when scope is CLASS) */}
          {selectedScope === "CLASS" && (
            <div className="flex items-center gap-1">
              <span className="font-bold text-[10px] text-gray-500 uppercase">Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="form-select text-xs py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900 font-bold"
              >
                {availableClassrooms.map((cl) => (
                  <option key={String(cl.id || cl.instance_id)} value={String(cl.id || cl.instance_id)}>
                    {cl.name} ({cl.faculty_name || "Instructor"})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target Benchmark Slider */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="font-bold text-[10px] text-gray-500 uppercase">Benchmark:</span>
            <input
              type="range"
              min="40"
              max="90"
              value={targetBenchmark}
              onChange={(e) => setTargetBenchmark(Number(e.target.value))}
              className="w-20 accent-primary cursor-pointer"
            />
            <span className="font-extrabold text-xs text-primary">{targetBenchmark}%</span>
          </div>
        </div>
      </div>

      {/* ── 2. CHAT STREAM & MESSAGES ── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-900/40 dark:to-[#1a2234]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1.5`}
          >
            {/* Sender Label & Timestamp */}
            <div className="flex items-center gap-2 text-[11px] text-gray-400 font-semibold px-1">
              <span>{msg.sender === "user" ? "You (Principal)" : "AI Academic Advisor"}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
              {msg.scopeBadge && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                  {msg.scopeBadge}
                </span>
              )}
            </div>

            {/* Message Bubble */}
            {msg.text && (
              <div
                className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-xs ${
                  msg.sender === "user"
                    ? "bg-primary text-white rounded-br-xs font-semibold"
                    : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-xs"
                }`}
              >
                {msg.text}
              </div>
            )}

            {/* Structured 6-Point Academic Report */}
            {msg.report && (
              <div className="w-full max-w-4xl bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
                {/* Header Badge & Summary */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 dark:text-violet-400 block">
                      Targeted Executive Diagnosis
                    </span>
                    <h4 className="text-sm font-black text-gray-900 dark:text-white mt-0.5">
                      {msg.report.scope_details?.label || "Institutional Improvement Action Plan"}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold">
                      {scoreTerm}: {msg.report.current_metrics?.score_pct}%
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-extrabold">
                      Target: {msg.report.filters?.targetBenchmark}%
                    </span>
                  </div>
                </div>

                {/* Historical Improvement Memory Badge */}
                {msg.report.detected_changes?.has_previous_memory && (
                  <div className="p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-violet-900 dark:text-violet-200 font-bold">
                        {msg.report.detected_changes.summary}
                      </span>
                    </div>
                    {msg.report.detected_changes.score_diff !== undefined && (
                      <span
                        className={`font-black ${
                          msg.report.detected_changes.score_diff >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {msg.report.detected_changes.score_diff >= 0
                          ? `+${msg.report.detected_changes.score_diff}%`
                          : `${msg.report.detected_changes.score_diff}%`}{" "}
                        vs last run
                      </span>
                    )}
                  </div>
                )}

                {/* The 6 Key Simple, Actionable Improvement Points */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {(
                    Object.entries(msg.report.points) as [
                      string,
                      AiImprovementPoint
                    ][]
                  ).map(([key, pt]) => {
                    const iconConfig = POINT_ICONS[key] || {
                      bg: "bg-gray-100",
                      text: "text-gray-700",
                      label: pt.title,
                      icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                    };

                    return (
                      <div
                        key={key}
                        className="p-4 rounded-xl border border-gray-100 dark:border-gray-700/80 bg-gray-50/60 dark:bg-gray-900/40 space-y-2 hover:border-violet-300 dark:hover:border-violet-700 transition"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${iconConfig.bg} ${iconConfig.text} flex items-center justify-center shrink-0`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconConfig.icon} />
                            </svg>
                          </div>
                          <h5 className="text-xs font-black text-gray-900 dark:text-white truncate">
                            {iconConfig.label}
                          </h5>
                        </div>

                        <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">
                          {pt.summary}
                        </p>

                        {/* Action Checklist items */}
                        <div className="space-y-1 pt-1.5 border-t border-gray-200/60 dark:border-gray-800">
                          {pt.action_items.slice(0, 2).map((item, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[10px] text-gray-600 dark:text-gray-400">
                              <span className="text-emerald-500 font-black">✓</span>
                              <span className="leading-tight">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-fit text-xs text-gray-500 font-bold shadow-xs">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-600 border-t-transparent" />
            <span>Analyzing {scopeSummary} & formulating actionable solutions...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── 3. QUICK ACTION PROMPT CHIPS ── */}
      <div className="px-4 py-2 bg-gray-50/80 dark:bg-gray-900/60 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider shrink-0">
          Quick Prompts:
        </span>
        <button
          type="button"
          onClick={() => handleGenerateReport()}
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition"
        >
          💡 Full 6-Point Action Plan
        </button>
        <button
          type="button"
          onClick={() => handleGenerateReport(`Detect abnormal teacher divergence and sections falling behind in ${scopeSummary}.`)}
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition"
        >
          🚨 Detect Outlier Sections & Abnormalities
        </button>
        <button
          type="button"
          onClick={() => handleGenerateReport(`Identify student struggle areas in K3/K4 cognitive levels and suggest immediate remedies for ${scopeSummary}.`)}
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition"
        >
          🎯 K3/K4 Cognitive Remedies
        </button>
        <button
          type="button"
          onClick={() => handleGenerateReport(`Draft a practical 4-week execution checklist for teachers in ${scopeSummary}.`)}
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition"
        >
          📋 4-Week Teacher Checklist
        </button>
      </div>

      {/* ── 4. CHAT INPUT FORM ── */}
      <form
        onSubmit={handleSubmitText}
        className="p-3 bg-white dark:bg-[#1a2234] border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={`Ask anything about ${scopeSummary} (e.g. why did scores drop, remedial steps, exam tips)...`}
          className="form-input flex-1 text-xs py-2 px-3.5 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !inputPrompt.trim()}
          className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xs transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
        >
          <span>Send</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default AcademicAiSuggestionsChat;

