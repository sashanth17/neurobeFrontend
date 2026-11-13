import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  CourseBreakdownItem,
  academicAdminService,
} from "@/services/academicAdminAnalytics.service";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface AcademicAiSuggestionsChatProps {
  initialDepartment?: string;
  initialCourseCode?: string;
}

export interface ChatTurnMessage {
  id: string;
  sender: "user" | "assistant";
  timestamp: string;
  text: string;
  filterBadge?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: string;
  mode: "CIA" | "MCQ";
  filterSummary: string;
  messages: ChatTurnMessage[];
}

const STORAGE_SESSIONS_KEY = "neurobe_academic_ai_sessions_v5";

export const AcademicAiSuggestionsChat: React.FC<AcademicAiSuggestionsChatProps> = ({
  initialDepartment = "ALL",
  initialCourseCode = "",
}) => {
  // ── Filters State ──
  const [selectedMode, setSelectedMode] = useState<"CIA" | "MCQ">("CIA");
  const [selectedDepts, setSelectedDepts] = useState<string[]>(
    initialDepartment && initialDepartment !== "ALL" ? [initialDepartment] : []
  );
  const [selectedCourseCodes, setSelectedCourseCodes] = useState<string[]>(
    initialCourseCode ? [initialCourseCode] : []
  );
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [targetBenchmark, setTargetBenchmark] = useState<number>(60);

  // Dropdown UI toggles
  const [openDeptDropdown, setOpenDeptDropdown] = useState<boolean>(false);
  const [openCourseDropdown, setOpenCourseDropdown] = useState<boolean>(false);
  const [openClassDropdown, setOpenClassDropdown] = useState<boolean>(false);

  // Filter search queries
  const [deptSearch, setDeptSearch] = useState<string>("");
  const [courseSearch, setCourseSearch] = useState<string>("");
  const [classSearch, setClassSearch] = useState<string>("");

  // Data from backend
  const [departments, setDepartments] = useState<Array<{ id: number; code: string; name: string }>>([]);
  const [courses, setCourses] = useState<CourseBreakdownItem[]>([]);

  // ── Chat & Session State ──
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [messages, setMessages] = useState<ChatTurnMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // STRICT MCQ RULE: When MCQ, no word "attainment" anywhere!
  const isMcq = selectedMode === "MCQ";
  const scoreTerm = isMcq ? "Score" : "Attainment";

  // Initial welcome message generator
  const createWelcomeMessage = useCallback(
    (summaryText: string): ChatTurnMessage => {
      return {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `### 👋 Greetings, Academic Administrator!
I am your **AI Academic Intelligence & Analytics Advisor**.

You can customize your analysis using the **filter bar above**:
- 🏢 **Departments**: Multi-select any combination of departments without restriction.
- 📚 **Courses**: Select one or multiple courses across the institution.
- 🏫 **Classrooms**: Narrow down to specific sections **belonging strictly to your chosen courses**.
- 🎯 **Benchmark**: Adjust the target performance slider (${targetBenchmark}%).

Use the quick inquiry chips below to get **targeted suggestion cards** (teaching strategies, outlier alerts, remedial doubt clinics, Bloom's cognitive breakdowns) or type any question!`,
      };
    },
    [targetBenchmark]
  );

  // ── Load Filters & Courses from Backend ──
  useEffect(() => {
    academicAdminService.getFilters().then((res) => {
      if (res?.departments) {
        setDepartments(res.departments);
      }
    });

    academicAdminService.getTeachingLearningEffectiveness("cia", "ALL", "ALL").then((res) => {
      if (res?.course_breakdown) {
        setCourses(res.course_breakdown);
      }
    });
  }, []);

  // ── Compute Available Classrooms (Strictly from chosen courses) ──
  const availableClassrooms = useMemo(() => {
    if (!courses || courses.length === 0) return [];

    let targetCourses = courses;
    if (selectedCourseCodes.length > 0) {
      targetCourses = courses.filter((c) => selectedCourseCodes.includes(c.course_code));
    } else if (selectedDepts.length > 0) {
      targetCourses = courses.filter((c) => selectedDepts.includes(c.department_code));
    }

    const flatClassrooms: Array<{
      id: string | number;
      name: string;
      faculty_name: string;
      course_code: string;
      course_title: string;
      attainment_pct: number;
      k_levels?: Record<string, number>;
    }> = [];

    targetCourses.forEach((c) => {
      if (Array.isArray(c.instances)) {
        c.instances.forEach((inst) => {
          flatClassrooms.push({
            id: String(inst.id || inst.instance_id || `${c.course_code}-${inst.name}`),
            name: inst.name,
            faculty_name: inst.faculty_name || "Instructor",
            course_code: c.course_code,
            course_title: c.course_title,
            attainment_pct: inst.attainment_pct || c.attainment_pct || 70,
            k_levels: inst.k_levels || c.k_levels,
          });
        });
      }
    });

    return flatClassrooms;
  }, [courses, selectedCourseCodes, selectedDepts]);

  // Clean up selectedClassIds if they no longer exist in availableClassrooms
  useEffect(() => {
    if (selectedClassIds.length > 0 && availableClassrooms.length > 0) {
      const validIds = new Set(availableClassrooms.map((cl) => String(cl.id)));
      const filtered = selectedClassIds.filter((id) => validIds.has(id));
      if (filtered.length !== selectedClassIds.length) {
        setSelectedClassIds(filtered);
      }
    }
  }, [availableClassrooms, selectedClassIds]);

  // ── Compute Filter Summary String ──
  const filterSummary = useMemo(() => {
    const parts: string[] = [];

    if (selectedDepts.length === 0) {
      parts.push("All Departments");
    } else if (selectedDepts.length === 1) {
      parts.push(`Dept: ${selectedDepts[0]}`);
    } else {
      parts.push(`${selectedDepts.length} Depts (${selectedDepts.join(", ")})`);
    }

    if (selectedCourseCodes.length === 0) {
      parts.push("All Courses");
    } else if (selectedCourseCodes.length === 1) {
      const c = courses.find((x) => x.course_code === selectedCourseCodes[0]);
      parts.push(`Course: ${c?.course_code || selectedCourseCodes[0]}`);
    } else {
      parts.push(`${selectedCourseCodes.length} Courses`);
    }

    if (selectedClassIds.length === 0) {
      parts.push("All Sections");
    } else if (selectedClassIds.length === 1) {
      const cl = availableClassrooms.find((x) => String(x.id) === String(selectedClassIds[0]));
      parts.push(`Section: ${cl?.name || "Selected Section"}`);
    } else {
      parts.push(`${selectedClassIds.length} Sections`);
    }

    return parts.join(" • ");
  }, [selectedDepts, selectedCourseCodes, selectedClassIds, courses, availableClassrooms]);

  // ── Compute Live Metrics for the Selected Scope ──
  const liveScopedMetrics = useMemo(() => {
    let relevantCourses = courses;

    if (selectedCourseCodes.length > 0) {
      relevantCourses = courses.filter((c) => selectedCourseCodes.includes(c.course_code));
    } else if (selectedDepts.length > 0) {
      relevantCourses = courses.filter((c) => selectedDepts.includes(c.department_code));
    }

    let avgScore = 72.0;
    if (relevantCourses.length > 0) {
      const sum = relevantCourses.reduce((acc, c) => acc + (c.attainment_pct || 0), 0);
      avgScore = Number((sum / relevantCourses.length).toFixed(1));
    }

    // Classroom overrides if selected
    if (selectedClassIds.length > 0) {
      const matched = availableClassrooms.filter((cl) => selectedClassIds.includes(String(cl.id)));
      if (matched.length > 0) {
        const sum = matched.reduce((acc, cl) => acc + (cl.attainment_pct || 0), 0);
        avgScore = Number((sum / matched.length).toFixed(1));
      }
    }

    const pushingUp = relevantCourses
      .filter((c) => (c.attainment_pct || 0) >= targetBenchmark)
      .map((c) => ({ course_code: c.course_code, course_name: c.course_title, attainment_pct: c.attainment_pct }));

    const pullingDown = relevantCourses
      .filter((c) => (c.attainment_pct || 0) < targetBenchmark)
      .map((c) => ({ course_code: c.course_code, course_name: c.course_title, attainment_pct: c.attainment_pct }));

    // Composite K1-K6 Bloom levels
    let kLevels: Record<string, number> = { K1: 76, K2: 70, K3: 58, K4: 62, K5: 54, K6: 48 };
    if (relevantCourses.length > 0 && relevantCourses[0].k_levels) {
      kLevels = { ...relevantCourses[0].k_levels };
    }

    return {
      scorePct: avgScore,
      participationPct: 88,
      kLevels,
      pushingUp,
      pullingDown,
      courses: relevantCourses.map((c) => ({
        course_code: c.course_code,
        course_title: c.course_title,
        department_code: c.department_code,
        attainment_pct: c.attainment_pct,
      })),
      classrooms: availableClassrooms.map((cl) => ({
        id: cl.id,
        name: cl.name,
        faculty_name: cl.faculty_name,
        course_code: cl.course_code,
        score: cl.attainment_pct,
      })),
    };
  }, [courses, selectedCourseCodes, selectedDepts, selectedClassIds, availableClassrooms, targetBenchmark]);

  // ── Multi-Session Chat History Management ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(STORAGE_SESSIONS_KEY);
        if (saved) {
          const parsed: ChatSession[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSessions(parsed);
            const mostRecent = parsed[0];
            setActiveSessionId(mostRecent.id);
            setMessages(mostRecent.messages);
            setSelectedMode(mostRecent.mode || "CIA");
            return;
          }
        }
      } catch (_) {}

      // Create first default session
      const newId = `session-${Date.now()}`;
      const initialMsg = createWelcomeMessage(filterSummary);
      const initialSession: ChatSession = {
        id: newId,
        title: "Initial Academic Analysis",
        timestamp: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
        mode: "CIA",
        filterSummary,
        messages: [initialMsg],
      };
      setSessions([initialSession]);
      setActiveSessionId(newId);
      setMessages([initialMsg]);
      window.localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify([initialSession]));
    }
  }, [createWelcomeMessage, filterSummary]);

  // Auto-save active session messages to sessions & localStorage
  const saveCurrentSession = useCallback(
    (newMessages: ChatTurnMessage[], title?: string) => {
      setSessions((prevSessions) => {
        const updated = prevSessions.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: newMessages,
              filterSummary,
              mode: selectedMode,
              title: title || s.title,
              timestamp: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
            };
          }
          return s;
        });

        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(updated.slice(0, 25)));
        }
        return updated;
      });
    },
    [activeSessionId, filterSummary, selectedMode]
  );

  // Switch to a different session
  const handleSelectSession = (sessionId: string) => {
    const found = sessions.find((s) => s.id === sessionId);
    if (found) {
      setActiveSessionId(found.id);
      setMessages(found.messages);
      setSelectedMode(found.mode);
      setShowHistory(false);
    }
  };

  // Start a fresh new chat session
  const handleStartNewChat = () => {
    const newId = `session-${Date.now()}`;
    const initialMsg = createWelcomeMessage(filterSummary);
    const newSession: ChatSession = {
      id: newId,
      title: `Analysis: ${filterSummary.slice(0, 30)}...`,
      timestamp: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
      mode: selectedMode,
      filterSummary,
      messages: [initialMsg],
    };

    setSessions((prev) => {
      const list = [newSession, ...prev];
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(list));
      }
      return list;
    });

    setActiveSessionId(newId);
    setMessages([initialMsg]);
    setShowHistory(false);
  };

  // Delete a specific session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions((prev) => {
      const remaining = prev.filter((s) => s.id !== sessionId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(remaining));
      }
      if (sessionId === activeSessionId) {
        if (remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
          setMessages(remaining[0].messages);
        } else {
          // Re-create one empty session
          const newId = `session-${Date.now()}`;
          const initialMsg = createWelcomeMessage(filterSummary);
          const initialSession: ChatSession = {
            id: newId,
            title: "New Analysis",
            timestamp: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
            mode: selectedMode,
            filterSummary,
            messages: [initialMsg],
          };
          setActiveSessionId(newId);
          setMessages([initialMsg]);
          return [initialSession];
        }
      }
      return remaining;
    });
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Send Message Handler ──
  const handleSendMessage = useCallback(
    async (textToSend: string) => {
      const trimmed = textToSend.trim();
      if (!trimmed || loading) return;

      setLoading(true);

      const userMsg: ChatTurnMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: trimmed,
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);

      // Title derived from first user prompt if still default
      let sessionTitle: string | undefined;
      const activeSession = sessions.find((s) => s.id === activeSessionId);
      if (activeSession && activeSession.messages.length <= 1) {
        sessionTitle = trimmed.length > 40 ? `${trimmed.slice(0, 37)}...` : trimmed;
      }

      saveCurrentSession(updatedMessages, sessionTitle);

      try {
        const response = await fetch("/api/academic-admin/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: updatedMessages.slice(-6).map((m) => ({
              id: m.id,
              sender: m.sender,
              timestamp: m.timestamp,
              text: m.text,
            })),
            mode: selectedMode,
            targetBenchmark,
            departments: selectedDepts,
            courseCodes: selectedCourseCodes,
            classIds: selectedClassIds,
            filterSummary,
            metrics: liveScopedMetrics,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.message) {
            const assistantMsg: ChatTurnMessage = {
              id: data.message.id || `asst-${Date.now()}`,
              sender: "assistant",
              timestamp:
                data.message.timestamp ||
                new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              filterBadge: filterSummary,
              text: data.message.text,
            };

            const finalMessages = [...updatedMessages, assistantMsg];
            setMessages(finalMessages);
            saveCurrentSession(finalMessages, sessionTitle);
            return;
          }
        }

        // Fallback local response if network error
        const fallbackText = `### 💡 Analytics Response for **${filterSummary}**\n\n- **Target Standard**: ${targetBenchmark}%\n- **Current ${scoreTerm}**: **${liveScopedMetrics.scorePct}%**\n\n\`\`\`card\ntitle: Recommended Focus: Application & Tutorial Practice\ntype: remedy\npriority: HIGH\nimpact: +10% Attainment\ntag: Immediate Step\n\n- Foundational retention (K1/K2) is solid at **${liveScopedMetrics.kLevels.K1 || 76}%**.\n- Primary growth area is numerical application and problem solving (K3/K4: **${liveScopedMetrics.kLevels.K3 || 58}%**).\n- Recommend conducting weekly 30-minute peer doubt-solving circles.\n\`\`\``;

        const fallbackMsg: ChatTurnMessage = {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          filterBadge: filterSummary,
          text: fallbackText,
        };

        const finalMessages = [...updatedMessages, fallbackMsg];
        setMessages(finalMessages);
        saveCurrentSession(finalMessages, sessionTitle);
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            text: "⚠️ Sorry, unable to complete the analytics request right now. Please check connectivity and try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [
      loading,
      messages,
      saveCurrentSession,
      sessions,
      activeSessionId,
      selectedMode,
      targetBenchmark,
      selectedDepts,
      selectedCourseCodes,
      selectedClassIds,
      filterSummary,
      liveScopedMetrics,
      scoreTerm,
    ]
  );

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || loading) return;
    const txt = inputPrompt.trim();
    setInputPrompt("");
    handleSendMessage(txt);
  };

  // Helper to toggle item in array
  const toggleArrayItem = (list: string[], item: string): string[] => {
    if (list.includes(item)) {
      return list.filter((x) => x !== item);
    }
    return [...list, item];
  };

  // Filtered lists for dropdown searches
  const filteredDeptsList = useMemo(() => {
    if (!deptSearch.trim()) return departments;
    const q = deptSearch.toLowerCase();
    return departments.filter(
      (d) => d.code.toLowerCase().includes(q) || d.name.toLowerCase().includes(q)
    );
  }, [departments, deptSearch]);

  const filteredCoursesList = useMemo(() => {
    let base = courses;
    if (selectedDepts.length > 0) {
      base = courses.filter((c) => selectedDepts.includes(c.department_code));
    }
    if (!courseSearch.trim()) return base;
    const q = courseSearch.toLowerCase();
    return base.filter(
      (c) => c.course_code.toLowerCase().includes(q) || c.course_title.toLowerCase().includes(q)
    );
  }, [courses, selectedDepts, courseSearch]);

  const filteredClassroomsList = useMemo(() => {
    if (!classSearch.trim()) return availableClassrooms;
    const q = classSearch.toLowerCase();
    return availableClassrooms.filter(
      (cl) =>
        cl.name.toLowerCase().includes(q) ||
        cl.faculty_name.toLowerCase().includes(q) ||
        cl.course_code.toLowerCase().includes(q)
    );
  }, [availableClassrooms, classSearch]);

  return (
    <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-[calc(100vh-175px)] overflow-hidden relative">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & INTEGRATED MULTI-FILTER BAR
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700/80 p-3.5 space-y-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Title & Mode */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span>AI Academic Intelligence Advisor</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-[10px] font-black uppercase tracking-wide">
                  {selectedMode} Mode
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Scope: <strong className="text-gray-800 dark:text-gray-200 font-bold">{filterSummary}</strong>
              </p>
            </div>
          </div>

          {/* Mode Switch, + New Chat & History Drawer Toggle */}
          <div className="flex items-center gap-2">
            {/* Mode switch */}
            <div className="flex items-center bg-gray-200 dark:bg-gray-700 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setSelectedMode("CIA")}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedMode === "CIA"
                    ? "bg-white dark:bg-gray-900 text-primary shadow-xs"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                CIA Mode
              </button>
              <button
                type="button"
                onClick={() => setSelectedMode("MCQ")}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedMode === "MCQ"
                    ? "bg-white dark:bg-gray-900 text-primary shadow-xs"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                MCQ Mode
              </button>
            </div>

            {/* + New Chat */}
            <button
              type="button"
              onClick={handleStartNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-violet-400 hover:text-primary transition shadow-2xs"
              title="Start a new chat conversation"
            >
              <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>

            {/* Past History Drawer Toggle */}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>History ({sessions.length})</span>
            </button>
          </div>
        </div>

        {/* ── Filters Row (Multi-Department, Multi-Course, Classroom, Benchmark) ── */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/70 dark:border-gray-700/70 text-xs">
          {/* 1. Department Multi-Select */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenDeptDropdown((p) => !p);
                setOpenCourseDropdown(false);
                setOpenClassDropdown(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-200 hover:border-primary transition"
            >
              <span className="text-[10px] uppercase font-black text-gray-400">Dept:</span>
              <span>
                {selectedDepts.length === 0
                  ? "All Departments"
                  : selectedDepts.length === 1
                  ? selectedDepts[0]
                  : `${selectedDepts.length} Selected`}
              </span>
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openDeptDropdown && (
              <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-40 p-2.5 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-[11px] font-black uppercase text-gray-500">Select Departments</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDepts([])}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    Select All
                  </button>
                </div>
                <input
                  type="text"
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  placeholder="Search departments..."
                  className="form-input text-xs w-full py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredDeptsList.map((d) => {
                    const isChecked = selectedDepts.includes(d.code);
                    return (
                      <label
                        key={d.code}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => setSelectedDepts((prev) => toggleArrayItem(prev, d.code))}
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <span className="font-bold text-gray-800 dark:text-gray-200">{d.code}</span>
                        <span className="text-[11px] text-gray-400 truncate">{d.name}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="pt-1 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpenDeptDropdown(false)}
                    className="px-2.5 py-1 bg-primary text-white rounded-lg text-[11px] font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Course Multi-Select (Can choose any course without restriction) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenCourseDropdown((p) => !p);
                setOpenDeptDropdown(false);
                setOpenClassDropdown(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-200 hover:border-primary transition max-w-[260px] truncate"
            >
              <span className="text-[10px] uppercase font-black text-gray-400">Course:</span>
              <span className="truncate">
                {selectedCourseCodes.length === 0
                  ? "All Courses"
                  : selectedCourseCodes.length === 1
                  ? selectedCourseCodes[0]
                  : `${selectedCourseCodes.length} Courses Selected`}
              </span>
              <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openCourseDropdown && (
              <div className="absolute left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-40 p-2.5 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-[11px] font-black uppercase text-gray-500">
                    Select Courses ({filteredCoursesList.length})
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCourseCodes([])}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      All Courses
                    </button>
                    <span className="text-gray-300">•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCourseCodes(filteredCoursesList.map((c) => c.course_code))
                      }
                      className="text-[10px] font-bold text-gray-500 hover:underline"
                    >
                      Select All Filtered
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => setCourseSearch(e.target.value)}
                  placeholder="Search course code or title..."
                  className="form-input text-xs w-full py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                />
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {filteredCoursesList.map((c) => {
                    const isChecked = selectedCourseCodes.includes(c.course_code);
                    return (
                      <label
                        key={c.course_code}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-xs"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() =>
                            setSelectedCourseCodes((prev) => toggleArrayItem(prev, c.course_code))
                          }
                          className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-extrabold text-gray-900 dark:text-white mr-1.5">
                            {c.course_code}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {c.course_title}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {c.department_code}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="pt-1 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpenCourseDropdown(false)}
                    className="px-2.5 py-1 bg-primary text-white rounded-lg text-[11px] font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 3. Classroom Multi-Select (From chosen courses alone!) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenClassDropdown((p) => !p);
                setOpenDeptDropdown(false);
                setOpenCourseDropdown(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-200 hover:border-primary transition max-w-[260px] truncate"
            >
              <span className="text-[10px] uppercase font-black text-gray-400">Class:</span>
              <span className="truncate">
                {selectedClassIds.length === 0
                  ? "All Sections"
                  : selectedClassIds.length === 1
                  ? availableClassrooms.find((cl) => String(cl.id) === selectedClassIds[0])?.name || "1 Section"
                  : `${selectedClassIds.length} Sections Selected`}
              </span>
              <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openClassDropdown && (
              <div className="absolute left-0 mt-1 w-84 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-40 p-2.5 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <span className="text-[11px] font-black uppercase text-gray-500 block">
                      Sections ({availableClassrooms.length} available)
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {selectedCourseCodes.length > 0
                        ? "Filtered strictly by chosen courses"
                        : "Across all courses in scope"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedClassIds([])}
                    className="text-[10px] font-bold text-primary hover:underline"
                  >
                    All Sections
                  </button>
                </div>
                <input
                  type="text"
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  placeholder="Search section or faculty..."
                  className="form-input text-xs w-full py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-900"
                />
                <div className="max-h-52 overflow-y-auto space-y-1">
                  {filteredClassroomsList.length === 0 ? (
                    <p className="text-[11px] text-gray-400 p-2 text-center">No classrooms found for current courses.</p>
                  ) : (
                    filteredClassroomsList.map((cl) => {
                      const isChecked = selectedClassIds.includes(String(cl.id));
                      return (
                        <label
                          key={String(cl.id)}
                          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              setSelectedClassIds((prev) => toggleArrayItem(prev, String(cl.id)))
                            }
                            className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="font-extrabold text-gray-900 dark:text-white mr-1.5">
                              {cl.name}
                            </span>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              ({cl.course_code} • {cl.faculty_name})
                            </span>
                          </div>
                          <span className="text-[10px] font-extrabold text-violet-600 dark:text-violet-400">
                            {cl.attainment_pct}%
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="pt-1 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setOpenClassDropdown(false)}
                    className="px-2.5 py-1 bg-primary text-white rounded-lg text-[11px] font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Target Benchmark Slider */}
          <div className="flex items-center gap-2 ml-auto">
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

      {/* ─────────────────────────────────────────────────────────────
          2. CHAT FEED & MESSAGE STREAM (SINGLE CHAT INTERFACE)
          ───────────────────────────────────────────────────────────── */}
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
              {msg.filterBadge && (
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                  {msg.filterBadge}
                </span>
              )}
            </div>

            {/* Bubble Rendering with MarkdownRenderer (Card support included!) */}
            <div
              className={`max-w-3xl p-4 rounded-2xl text-xs leading-relaxed shadow-xs ${
                msg.sender === "user"
                  ? "bg-primary text-white rounded-br-xs font-semibold whitespace-pre-wrap"
                  : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-xs w-full"
              }`}
            >
              {msg.sender === "user" ? (
                <p>{msg.text}</p>
              ) : (
                <MarkdownRenderer content={msg.text} />
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-fit">
            <div className="w-2 h-2 rounded-full bg-violet-600 animate-bounce" />
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
            <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]" />
            <span className="text-xs font-bold text-gray-500">Synthesizing intelligence & suggestion cards...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. QUICK ASKING SUGGESTIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="px-3 py-2 bg-slate-50/90 dark:bg-gray-800/60 border-t border-gray-200/70 dark:border-gray-700/70 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
        <span className="text-[10px] font-black uppercase text-gray-400 shrink-0 mr-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Suggestions:
        </span>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Provide comprehensive improvement suggestions and remedial cards for ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition"
        >
          💡 Targeted Suggestions
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Detect outlier teachers and section divergences lagging behind benchmark in ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition"
        >
          🚨 Outlier Faculty & Sections
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Diagnose K1-K6 Bloom's cognitive gaps and student struggle areas for ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition"
        >
          🧠 K1-K6 Bloom's Gaps
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Recommend immediate remedial interventions and doubt clinics for low-scoring students in ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition"
        >
          🛠️ Remedial Action Steps
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Give question paper and test calibration tips under ${selectedMode} mode for ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition"
        >
          📝 Test Calibration Tips
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CHAT INPUT BAR
          ───────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmitText}
        className="p-3 bg-white dark:bg-[#1a2234] border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={`Ask about ${filterSummary} (e.g. why did scores drop, remedial steps, exam tips)...`}
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

      {/* ─────────────────────────────────────────────────────────────
          5. PAST CHAT HISTORY DRAWER
          ───────────────────────────────────────────────────────────── */}
      {showHistory && (
        <div className="absolute inset-y-0 right-0 w-80 max-w-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 flex flex-col animate-slideLeft">
          <div className="p-3.5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Past Chat Conversations</span>
            </h4>
            <button
              type="button"
              onClick={() => setShowHistory(false)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white font-bold text-sm"
            >
              ✕
            </button>
          </div>

          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={handleStartNewChat}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-black bg-primary text-white shadow-2xs hover:bg-primary-focus transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span>Start New Conversation</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sessions.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8 font-semibold">No past chats recorded yet.</p>
            ) : (
              sessions.map((item) => {
                const isActive = item.id === activeSessionId;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSession(item.id)}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 cursor-pointer transition ${
                      isActive
                        ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/30"
                        : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/40 hover:border-violet-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-violet-600 dark:text-violet-400 text-[10px] uppercase">
                        {item.mode} Mode
                      </span>
                      <span className="text-[10px] text-gray-400">{item.timestamp}</span>
                    </div>
                    <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
                      {item.title || "Academic Consultation"}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">{item.filterSummary}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                      <span className="text-[10px] font-bold text-gray-400">
                        {item.messages.length} messages
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(item.id, e)}
                        className="text-[10px] font-bold text-rose-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicAiSuggestionsChat;
