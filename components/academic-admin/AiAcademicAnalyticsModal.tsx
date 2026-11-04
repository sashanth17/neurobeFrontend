import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  DeptBreakdownRow,
} from "@/services/academicAdminAnalytics.service";

interface AiAcademicAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportInput: GenerateSuggestionInput;
  courseBreakdown?: CourseBreakdownItem[];
  departmentBreakdown?: DeptBreakdownRow[];
  departments?: string[];
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

export const AiAcademicAnalyticsModal: React.FC<AiAcademicAnalyticsModalProps> = ({
  isOpen,
  onClose,
  reportInput,
  courseBreakdown = [],
  departmentBreakdown = [],
  departments: propDepartments = [],
}) => {
  // STRICT MCQ RULE: When MCQ, no word "attainment" anywhere!
  const isMcq = reportInput.type === "MCQ";
  const scoreTerm = isMcq ? "Score" : "Attainment";
  const scoreTermLower = isMcq ? "score" : "attainment";

  // Filter Scope State
  const [selectedScope, setSelectedScope] = useState<AiSuggestionScope>("OVERALL");
  const [filterDept, setFilterDept] = useState<string>("ALL");
  const [filterCourseCode, setFilterCourseCode] = useState<string>("");
  const [filterClassId, setFilterClassId] = useState<string>("");

  // Loading & Generation State
  const [loading, setLoading] = useState<boolean>(false);
  const [hasAsked, setHasAsked] = useState<boolean>(false);
  const [currentReport, setCurrentReport] = useState<AiSuggestionReport | null>(null);
  const [pastSuggestions, setPastSuggestions] = useState<AiSuggestionReport[]>([]);
  const [selectedPastId, setSelectedPastId] = useState<string | null>(null);
  const [showMemorySection, setShowMemorySection] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Derive department list
  const allDepartments = useMemo(() => {
    const list = new Set<string>();
    if (propDepartments && propDepartments.length > 0) {
      propDepartments.forEach((d) => list.add(d));
    }
    if (departmentBreakdown && departmentBreakdown.length > 0) {
      departmentBreakdown.forEach((d) => list.add(d.department_code));
    }
    if (courseBreakdown && courseBreakdown.length > 0) {
      courseBreakdown.forEach((c) => {
        if (c.department_code) list.add(c.department_code);
      });
    }
    return Array.from(list).sort();
  }, [propDepartments, departmentBreakdown, courseBreakdown]);

  // Derive course list (filtered by filterDept if not "ALL")
  const availableCourses = useMemo(() => {
    if (!courseBreakdown || courseBreakdown.length === 0) return [];
    if (filterDept === "ALL") return courseBreakdown;
    return courseBreakdown.filter((c) => c.department_code === filterDept);
  }, [courseBreakdown, filterDept]);

  // Selected Course Object
  const selectedCourseObj = useMemo(() => {
    return availableCourses.find((c) => c.course_code === filterCourseCode) || availableCourses[0];
  }, [availableCourses, filterCourseCode]);

  // Available Classrooms for the selected course
  const availableClassrooms = useMemo(() => {
    if (!selectedCourseObj || !selectedCourseObj.instances) return [];
    return selectedCourseObj.instances;
  }, [selectedCourseObj]);

  // Selected Classroom Object
  const selectedClassroomObj = useMemo(() => {
    return (
      availableClassrooms.find((cl) => String(cl.id || cl.instance_id) === String(filterClassId)) ||
      availableClassrooms[0]
    );
  }, [availableClassrooms, filterClassId]);

  // When scope changes, auto-select first available options if empty
  const handleScopeChange = (newScope: AiSuggestionScope) => {
    setSelectedScope(newScope);
    setHasAsked(false); // User must click "Ask for Suggestions" for this new filter

    if (newScope === "COURSE") {
      if (!filterCourseCode && availableCourses.length > 0) {
        setFilterCourseCode(availableCourses[0].course_code);
      }
    } else if (newScope === "CLASS") {
      if (!filterCourseCode && availableCourses.length > 0) {
        setFilterCourseCode(availableCourses[0].course_code);
      }
      if (selectedCourseObj && selectedCourseObj.instances && selectedCourseObj.instances.length > 0) {
        setFilterClassId(String(selectedCourseObj.instances[0].id || selectedCourseObj.instances[0].instance_id));
      }
    }
  };

  // Load past suggestions from DB on mount
  useEffect(() => {
    if (isOpen) {
      academicAdminAiService.getPastSuggestions(reportInput.type).then((history) => {
        setPastSuggestions(history);
        if (history.length > 0 && !currentReport) {
          // Display the most recent report as initial view, but user can ask fresh for any filter
          setCurrentReport(history[0]);
          setSelectedPastId(history[0].id);
          setHasAsked(true);
        }
      });
    }
  }, [isOpen, reportInput.type]);

  // Build human-friendly label for current filter selection
  const currentFilterSummary = useMemo(() => {
    if (selectedScope === "OVERALL") {
      return "Overall College (All Departments & Courses)";
    }
    if (selectedScope === "DEPARTMENT") {
      return filterDept === "ALL" ? "All Departments Combined" : `Department: ${filterDept}`;
    }
    if (selectedScope === "COURSE") {
      if (selectedCourseObj) {
        return `Course: ${selectedCourseObj.course_code} - ${selectedCourseObj.course_name || selectedCourseObj.course_title}`;
      }
      return filterCourseCode ? `Course: ${filterCourseCode}` : "Select a Course";
    }
    if (selectedScope === "CLASS") {
      const cCode = selectedCourseObj ? selectedCourseObj.course_code : filterCourseCode;
      const clName = selectedClassroomObj?.name || "Classroom";
      const teacher = selectedClassroomObj?.faculty_name ? ` • Teacher: ${selectedClassroomObj.faculty_name}` : "";
      return `Class: ${clName} (${cCode})${teacher}`;
    }
    return "Overall College";
  }, [selectedScope, filterDept, filterCourseCode, selectedCourseObj, selectedClassroomObj]);

  // Primary function: "Ask for Suggestions" based on the user's filtered request
  const handleAskSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Compute scoped metrics based on selected filter
      let scopedScore = reportInput.totalAttainmentPct;
      let scopedParticipation = reportInput.participationPct;
      let scopedKLevels = { ...reportInput.kLevels };
      let scopedPushingUp = [...reportInput.coursesPushingUp];
      let scopedPullingDown = [...reportInput.coursesPullingDown];

      const scopeSelection: ScopedFilterSelection = {
        scope: selectedScope,
        departmentCode: filterDept,
        departmentName: filterDept,
      };

      if (selectedScope === "DEPARTMENT") {
        if (filterDept !== "ALL") {
          // Filter courses in department
          const deptCourses = courseBreakdown.filter((c) => c.department_code === filterDept);
          if (deptCourses.length > 0) {
            const sumScore = deptCourses.reduce((acc, c) => acc + (c.total_pct ?? c.attainment_pct ?? 0), 0);
            scopedScore = Number((sumScore / deptCourses.length).toFixed(1));

            scopedPushingUp = deptCourses
              .filter((c) => (c.total_pct ?? c.attainment_pct ?? 0) >= reportInput.targetBenchmark)
              .map((c) => ({
                course_code: c.course_code,
                course_name: c.course_name || c.course_title,
                department_code: c.department_code,
                attainment_pct: c.total_pct ?? c.attainment_pct,
              }));

            scopedPullingDown = deptCourses
              .filter((c) => (c.total_pct ?? c.attainment_pct ?? 0) < reportInput.targetBenchmark)
              .map((c) => ({
                course_code: c.course_code,
                course_name: c.course_name || c.course_title,
                department_code: c.department_code,
                attainment_pct: c.total_pct ?? c.attainment_pct,
              }));
          }
        }
      } else if (selectedScope === "COURSE") {
        if (selectedCourseObj) {
          scopeSelection.courseCode = selectedCourseObj.course_code;
          scopeSelection.courseName = selectedCourseObj.course_name || selectedCourseObj.course_title;
          scopedScore = selectedCourseObj.total_pct ?? selectedCourseObj.attainment_pct ?? scopedScore;
          if (selectedCourseObj.k_levels) {
            scopedKLevels = { ...selectedCourseObj.k_levels };
          }
          scopedPushingUp = [
            {
              course_code: selectedCourseObj.course_code,
              course_name: selectedCourseObj.course_name || selectedCourseObj.course_title,
              department_code: selectedCourseObj.department_code,
              attainment_pct: scopedScore,
            },
          ];
          scopedPullingDown = [];
        }
      } else if (selectedScope === "CLASS") {
        if (selectedCourseObj && selectedClassroomObj) {
          scopeSelection.courseCode = selectedCourseObj.course_code;
          scopeSelection.courseName = selectedCourseObj.course_name || selectedCourseObj.course_title;
          scopeSelection.classroomId = selectedClassroomObj.id || selectedClassroomObj.instance_id;
          scopeSelection.classroomName = selectedClassroomObj.name;
          scopeSelection.facultyName = selectedClassroomObj.faculty_name;

          scopedScore = selectedClassroomObj.total_pct ?? selectedClassroomObj.attainment_pct ?? scopedScore;
          if (selectedClassroomObj.k_levels) {
            scopedKLevels = { ...selectedClassroomObj.k_levels };
          }
        }
      }

      // 2. Prepare payload
      const payload: GenerateSuggestionInput = {
        ...reportInput,
        totalAttainmentPct: scopedScore,
        participationPct: scopedParticipation,
        kLevels: scopedKLevels,
        coursesPushingUp: scopedPushingUp,
        coursesPullingDown: scopedPullingDown,
        scopeSelection,
      };

      // 3. Generate via AI Service & store in DB
      const newReport = await academicAdminAiService.generateAndStoreReport(payload);
      setCurrentReport(newReport);
      setSelectedPastId(newReport.id);
      setHasAsked(true);

      // 4. Update memory list
      setPastSuggestions((prev) => [newReport, ...prev.filter((x) => x.id !== newReport.id)]);
    } catch (err) {
      console.error("Failed to generate scoped suggestions:", err);
    } finally {
      setLoading(false);
    }
  }, [
    reportInput,
    selectedScope,
    filterDept,
    selectedCourseObj,
    selectedClassroomObj,
    courseBreakdown,
  ]);

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
    if (window.confirm("Are you sure you want to clear suggestions memory history for this section?")) {
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
      <header className="bg-white dark:bg-[#1a2234] border-b border-gray-200 dark:border-gray-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-sm shrink-0">
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
              <span>Principal Suggestions Assistant</span>
            </span>
            <span className="text-xs text-gray-400 font-medium">•</span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {reportInput.type} Suggestions & Guidance
            </span>
            <span className="text-xs text-gray-400 font-medium">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Target Benchmark: <strong>{reportInput.targetBenchmark}%</strong>
            </span>
          </div>
          <h1 className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white tracking-tight mt-1 flex items-center gap-2">
            <span>Actionable Suggestions & Improvement Points</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
              Simple & Practical
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
            <span>Past Suggestions History ({pastSuggestions.length})</span>
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

      {/* ── Suggestions Filter Bar (Overall, Department, Course, Class) ── */}
      <div className="bg-slate-100 dark:bg-[#151c2e] border-b border-gray-200 dark:border-gray-800 px-6 py-3.5 shrink-0 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Scope Selector Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 mr-1 flex items-center gap-1">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Scope:</span>
            </span>

            <div className="inline-flex rounded-xl bg-white dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700 shadow-xs">
              {/* 1. Overall */}
              <button
                type="button"
                onClick={() => handleScopeChange("OVERALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedScope === "OVERALL"
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>🏛️</span>
                <span>Overall College</span>
              </button>

              {/* 2. Department */}
              <button
                type="button"
                onClick={() => handleScopeChange("DEPARTMENT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedScope === "DEPARTMENT"
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>🏢</span>
                <span>Department</span>
              </button>

              {/* 3. Course */}
              <button
                type="button"
                onClick={() => handleScopeChange("COURSE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedScope === "COURSE"
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>📚</span>
                <span>Course</span>
              </button>

              {/* 4. Class / Section */}
              <button
                type="button"
                onClick={() => handleScopeChange("CLASS")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedScope === "CLASS"
                    ? "bg-primary text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>👥</span>
                <span>Class / Section</span>
              </button>
            </div>
          </div>

          {/* Center: Dynamic Dropdown Filters according to Scope */}
          <div className="flex items-center gap-2.5 flex-wrap flex-1 max-w-2xl">
            {/* Department Dropdown (visible in Department, Course, and Class scopes) */}
            {selectedScope !== "OVERALL" && (
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Dept:
                </label>
                <select
                  value={filterDept}
                  onChange={(e) => {
                    setFilterDept(e.target.value);
                    setHasAsked(false);
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs"
                >
                  <option value="ALL">All Departments</option>
                  {allDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Course Dropdown (visible in Course and Class scopes) */}
            {(selectedScope === "COURSE" || selectedScope === "CLASS") && (
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Course:
                </label>
                <select
                  value={filterCourseCode}
                  onChange={(e) => {
                    setFilterCourseCode(e.target.value);
                    setHasAsked(false);
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs flex-1 truncate"
                >
                  {availableCourses.length === 0 ? (
                    <option value="">No courses available</option>
                  ) : (
                    availableCourses.map((c) => (
                      <option key={c.course_code} value={c.course_code}>
                        {c.course_code} - {c.course_name || c.course_title}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Class / Section Dropdown (visible only in Class scope) */}
            {selectedScope === "CLASS" && (
              <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Class:
                </label>
                <select
                  value={filterClassId}
                  onChange={(e) => {
                    setFilterClassId(e.target.value);
                    setHasAsked(false);
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs flex-1 truncate"
                >
                  {availableClassrooms.length === 0 ? (
                    <option value="">No classes found</option>
                  ) : (
                    availableClassrooms.map((cl) => {
                      const idVal = String(cl.id || cl.instance_id);
                      const clScore = cl.total_pct ?? cl.attainment_pct ?? 0;
                      return (
                        <option key={idVal} value={idVal}>
                          {cl.name} - {cl.faculty_name} ({clScore.toFixed(0)}% {scoreTermLower})
                        </option>
                      );
                    })
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Right: The Explicit "Ask for Suggestions" Button */}
          <div>
            <button
              type="button"
              onClick={handleAskSuggestions}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all scale-100 hover:scale-105 disabled:opacity-50"
              title="Apply filter and generate suggestions"
            >
              <svg
                className={`w-4 h-4 text-amber-300 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{loading ? "Generating Suggestions..." : "✨ Ask for Suggestions"}</span>
            </button>
          </div>
        </div>

        {/* Current Active Filter Indicator Banner */}
        <div className="mt-2.5 pt-2 border-t border-gray-200/70 dark:border-gray-700/60 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 dark:text-gray-200">Selected Target:</span>
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
              {currentFilterSummary}
            </span>
          </div>

          {!hasAsked && (
            <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] flex items-center gap-1 animate-pulse">
              <span>👉 Filter chosen. Click &quot;Ask for Suggestions&quot; to generate advice for this selection.</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Main View Container: Split between Memory History & Suggestions Display ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Past Suggestions History Drawer (Sidebar) */}
        {showMemorySection && (
          <aside className="w-80 lg:w-96 bg-gray-50 dark:bg-[#151c2e] border-r border-gray-200 dark:border-gray-800 flex flex-col shrink-0 overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Past Suggestions Log</span>
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Saved runs for Overall, Department, Course, and Class requests.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClearMemory}
                className="text-[11px] text-rose-500 hover:text-rose-700 font-bold hover:underline"
                title="Clear suggestions history"
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

                  const itemScore = item.current_metrics.score_pct ?? item.current_metrics.total_attainment_pct ?? 0;

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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            {item.scope || "OVERALL"}
                          </span>
                          {isLatest && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Latest
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{dateStr}</span>
                      </div>

                      <div className="font-bold text-gray-800 dark:text-gray-200 truncate mt-1">
                        {item.scope_details?.label || `Run #${pastSuggestions.length - index}`}
                      </div>

                      <div className="flex items-center justify-between text-[11px] mt-1.5 text-gray-600 dark:text-gray-400">
                        <span>
                          {scoreTerm}:{" "}
                          <strong className="text-gray-900 dark:text-white">
                            {itemScore.toFixed(1)}%
                          </strong>
                        </span>
                        <span>
                          Target: <strong>{item.filters.targetBenchmark}%</strong>
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

            {/* Footer */}
            <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border-t border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-300">
              <span className="font-bold">Progress Tracker:</span> Each run remembers prior advice so suggestions stay fresh and track actual score improvement.
            </div>
          </aside>
        )}

        {/* ── Main Content Area: Suggestions Points ── */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-[#0f172a] space-y-5">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white mb-4 animate-bounce shadow-lg">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                Generating Simple, Actionable Suggestions...
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mt-1">
                Analyzing performance for <strong className="text-gray-700 dark:text-gray-300">{currentFilterSummary}</strong>, identifying struggle areas, and drafting 6 practical steps.
              </p>
            </div>
          ) : !displayedReport ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Ready to Ask for Suggestions
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Select your desired scope above (Overall College, Department, Course, or Class) and click the{" "}
                <strong className="text-primary">&quot;✨ Ask for Suggestions&quot;</strong> button to generate tailored guidance.
              </p>
              <button
                type="button"
                onClick={handleAskSuggestions}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-dark text-white shadow-md transition-all"
              >
                <span>✨ Ask for Suggestions Now</span>
              </button>
            </div>
          ) : (
            <>
              {/* ── Scope Header Card ── */}
              <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-blue-50/90 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-blue-950/40 p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-600 text-white">
                        {displayedReport.scope || "OVERALL"} SUGGESTIONS
                      </span>
                      <h2 className="text-sm font-extrabold text-indigo-950 dark:text-indigo-100">
                        {displayedReport.scope_details?.label || currentFilterSummary}
                      </h2>
                    </div>

                    <p className="text-xs text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                      {displayedReport.detected_changes.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block">
                        Average {scoreTerm}
                      </span>
                      <span className="text-lg font-black text-indigo-950 dark:text-white">
                        {(displayedReport.current_metrics.score_pct ?? displayedReport.current_metrics.total_attainment_pct ?? 0).toFixed(1)}%
                      </span>
                    </div>

                    {displayedReport.id !== currentReport?.id && (
                      <button
                        type="button"
                        onClick={() => setSelectedPastId(currentReport?.id || null)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 text-primary border border-primary shadow-xs hover:bg-primary hover:text-white transition-all ml-2"
                      >
                        Return to Current Run
                      </button>
                    )}
                  </div>
                </div>

                {/* Specific Progress Highlights */}
                {(displayedReport.detected_changes.improved_aspects.length > 0 ||
                  displayedReport.detected_changes.critical_alerts.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-indigo-200/60 dark:border-indigo-800/60 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedReport.detected_changes.improved_aspects.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Positive Progress Noticed:</span>
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
                          <span>Key Focus Areas:</span>
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
                  All 6 Suggestions
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
                              {point.priority === "CRITICAL"
                                ? "Urgent Action"
                                : point.priority === "HIGH"
                                ? "Important"
                                : "Recommended"}
                            </span>
                          </div>

                          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                            {point.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">
                            {point.summary}
                          </p>
                        </div>

                        {/* What We Noticed (Findings) */}
                        {point.key_findings && point.key_findings.length > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                              What We Noticed
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

                        {/* Simple Steps to Take (Actions) */}
                        {point.action_items && point.action_items.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                              Simple Steps to Take
                            </span>
                            <div className="space-y-1.5">
                              {point.action_items.map((act, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs text-emerald-900 dark:text-emerald-200"
                                >
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                                    {i + 1}.
                                  </span>
                                  <span className="leading-relaxed">{act}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Expected Result */}
                        {point.impact && (
                          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Expected Result:</span>
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
          Suggestions saved automatically in memory • Filter Scope:{" "}
          <strong className="text-gray-900 dark:text-white">{currentFilterSummary}</strong>
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
