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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Scroll to bottom on new messages inside the conversation container only (NEVER scrolling the browser window)
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
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
        const fallbackText = `### 💡 Analytics & Remedial Response for **${filterSummary}**\n\n- **Target Standard**: ${targetBenchmark}%\n- **Current ${scoreTerm}**: **${liveScopedMetrics.scorePct}%**\n\n\`\`\`card\ntitle: Targeted Remedial Doubt Clinics with Alternate Pedagogy\ntype: remedy\npriority: HIGH\nimpact: +14% ${scoreTerm} Boost\ntag: Remedial Intervention\nscope: Low-scoring students in ${filterSummary}\nalternate_pedagogy: Think-Pair-Share & Peer Instruction\n\n- Foundational retention (K1/K2) is solid at **${liveScopedMetrics.kLevels.K1 || 76}%**.\n- Primary growth area is numerical application and problem solving (K3/K4: **${liveScopedMetrics.kLevels.K3 || 58}%**).\n- **Alternate Pedagogy**: Deploy **Think-Pair-Share** and **Peer Instruction** rather than re-lecturing. Have students solve coupled problem variants in pairs with real-time feedback.\n- **Action**: Host two 30-minute structured clinics before mid-term assessments.\n\`\`\``;

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputPrompt(e.target.value);
    // Auto-resizing textarea based on typed content
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleSubmitText = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || loading) return;
    const txt = inputPrompt.trim();
    setInputPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    handleSendMessage(txt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitText();
    }
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
    <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-full overflow-hidden relative">
      {/* ─────────────────────────────────────────────────────────────
          1. SLEEK CONTROL TOOLBAR (ALWAYS VISIBLE & LOCKED AT TOP)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2.5 py-1 shrink-0 flex flex-wrap items-center justify-between gap-1.5 text-xs min-h-[36px]">
        {/* Left: AI Icon + Mode Toggle + Multi-Filter Dropdowns */}
        <div className="flex items-center gap-1 flex-wrap">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-black text-gray-900 dark:text-white text-[11px] mr-0.5 hidden sm:inline">
            Advisor
          </span>

          {/* Mode switch */}
          <div className="flex items-center bg-gray-200 dark:bg-gray-700 p-0.5 rounded-md text-[9px] font-bold">
            <button
              type="button"
              onClick={() => setSelectedMode("CIA")}
              className={`px-1.5 py-0.2 rounded transition ${
                selectedMode === "CIA"
                  ? "bg-white dark:bg-gray-900 text-primary shadow-2xs font-black"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              CIA
            </button>
            <button
              type="button"
              onClick={() => setSelectedMode("MCQ")}
              className={`px-1.5 py-0.2 rounded transition ${
                selectedMode === "MCQ"
                  ? "bg-white dark:bg-gray-900 text-primary shadow-2xs font-black"
                  : "text-gray-600 dark:text-gray-300"
              }`}
            >
              MCQ
            </button>
          </div>

          {/* 1. Department Multi-Select */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenDeptDropdown((p) => !p);
                setOpenCourseDropdown(false);
                setOpenClassDropdown(false);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-200 hover:border-primary transition text-[10px]"
            >
              <span className="text-[9px] uppercase font-black text-gray-400">Dept:</span>
              <span className="max-w-[80px] truncate">
                {selectedDepts.length === 0
                  ? "All"
                  : selectedDepts.length === 1
                  ? selectedDepts[0]
                  : `${selectedDepts.length}`}
              </span>
              <svg className="w-2.5 h-2.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* 2. Course Multi-Select */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenCourseDropdown((p) => !p);
                setOpenDeptDropdown(false);
                setOpenClassDropdown(false);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-200 hover:border-primary transition text-[10px] max-w-[140px] truncate"
            >
              <span className="text-[9px] uppercase font-black text-gray-400">Course:</span>
              <span className="truncate">
                {selectedCourseCodes.length === 0
                  ? "All"
                  : selectedCourseCodes.length === 1
                  ? selectedCourseCodes[0]
                  : `${selectedCourseCodes.length}`}
              </span>
              <svg className="w-2.5 h-2.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* 3. Classroom Multi-Select */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpenClassDropdown((p) => !p);
                setOpenDeptDropdown(false);
                setOpenCourseDropdown(false);
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 font-bold text-gray-700 dark:text-gray-200 hover:border-primary transition text-[10px] max-w-[140px] truncate"
            >
              <span className="text-[9px] uppercase font-black text-gray-400">Class:</span>
              <span className="truncate">
                {selectedClassIds.length === 0
                  ? "All"
                  : selectedClassIds.length === 1
                  ? availableClassrooms.find((cl) => String(cl.id) === selectedClassIds[0])?.name || "1 Sec"
                  : `${selectedClassIds.length}`}
              </span>
              <svg className="w-2.5 h-2.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        </div>

        {/* Right: Target Benchmark Slider + New Chat + History */}
        <div className="flex items-center gap-1.5 ml-auto shrink-0">
          {/* Target Benchmark Slider */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 px-1.5 py-0.2 rounded-md border border-gray-200 dark:border-gray-700">
            <span className="font-black text-[8px] text-gray-400 uppercase">Target:</span>
            <input
              type="range"
              min="40"
              max="90"
              value={targetBenchmark}
              onChange={(e) => setTargetBenchmark(Number(e.target.value))}
              className="w-10 accent-primary cursor-pointer h-0.5"
            />
            <span className="font-black text-[10px] text-primary">{targetBenchmark}%</span>
          </div>

          {/* + New Chat */}
          <button
            type="button"
            onClick={handleStartNewChat}
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-violet-400 hover:text-primary transition shadow-none"
            title="Start new conversation"
          >
            <svg className="w-2.5 h-2.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>New</span>
          </button>

          {/* History Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border transition ${
              showHistory
                ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            }`}
          >
            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>History ({sessions.length})</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. EXPANSIVE READING SECTION (MAXIMUM SCREEN REAL ESTATE ~90%+)
          ───────────────────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-3 py-1.5 space-y-2 bg-gradient-to-b from-gray-50/30 to-white dark:from-gray-900/30 dark:to-[#1a2234]"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} space-y-1`}
          >
            {/* Sender Label & Timestamp */}
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-semibold px-1">
              <span>{msg.sender === "user" ? "You (Principal)" : "AI Academic Advisor"}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
              {msg.filterBadge && (
                <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold text-[9px]">
                  {msg.filterBadge}
                </span>
              )}
            </div>

            {/* Expansive Bubble with Markdown & Card Rendering */}
            <div
              className={`w-full max-w-full p-2.5 sm:p-3 rounded-xl text-xs leading-relaxed shadow-none ${
                msg.sender === "user"
                  ? "bg-primary text-white rounded-br-xs font-semibold whitespace-pre-wrap ml-auto max-w-2xl"
                  : "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-xs"
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
          <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 w-fit">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]" />
            <span className="text-[11px] font-bold text-gray-500">Synthesizing intelligence & suggestion cards...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ULTRA-SLIM QUICK SUGGESTIONS BAR (~22px)
          ───────────────────────────────────────────────────────────── */}
      <div className="px-2 py-0.5 bg-slate-50/90 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1 overflow-x-auto text-[10px] shrink-0 h-6.5 min-h-0">
        <span className="text-[9px] font-black uppercase text-gray-400 shrink-0 mr-0.5 flex items-center gap-0.5">
          <svg className="w-3 h-3 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick:
        </span>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Provide comprehensive improvement suggestions and remedial cards for ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-1.5 py-0.2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition text-[9px] whitespace-nowrap"
        >
          💡 Suggestions
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Detect outlier teachers and section divergences lagging behind benchmark in ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-1.5 py-0.2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition text-[9px] whitespace-nowrap"
        >
          🚨 Outliers
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Diagnose K1-K6 Bloom's cognitive gaps and student struggle areas for ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-1.5 py-0.2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition text-[9px] whitespace-nowrap"
        >
          🧠 Bloom's Gaps
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Recommend targeted remedial interventions incorporating alternate pedagogies (like Flipped Classroom, Think-Pair-Share, POGIL, and Peer Instruction) for ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-black hover:border-indigo-400 shrink-0 transition flex items-center gap-0.5 text-[9px] whitespace-nowrap shadow-none"
        >
          <span>🎓</span>
          <span>Alternate Pedagogies</span>
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Recommend immediate remedial interventions and doubt clinics for low-scoring students in ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-1.5 py-0.2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition text-[9px] whitespace-nowrap"
        >
          🛠️ Remedial
        </button>
        <button
          type="button"
          onClick={() =>
            handleSendMessage(
              `Give question paper and test calibration tips under ${selectedMode} mode for ${filterSummary}`
            )
          }
          disabled={loading}
          className="px-1.5 py-0.2 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:border-violet-400 shrink-0 transition text-[9px] whitespace-nowrap"
        >
          📝 Test Tips
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. AUTO-EXTENDING CHAT INPUT SECTION (ULTRA-SLIM BASE ~32px)
          ───────────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmitText}
        className="p-1 sm:px-2 sm:py-1 bg-white dark:bg-[#1a2234] border-t border-gray-100 dark:border-gray-800 flex items-end gap-1.5 shrink-0 transition-all"
      >
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputPrompt}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${filterSummary} (Type query; Enter to send)...`}
          className="form-textarea flex-1 text-xs py-1 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 dark:bg-gray-800 resize-none min-h-[32px] max-h-[140px] overflow-y-auto leading-relaxed focus:ring-1 focus:ring-primary shadow-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !inputPrompt.trim()}
          className="h-[32px] px-3 rounded-lg text-xs font-black bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-none transition disabled:opacity-50 shrink-0 flex items-center gap-1"
        >
          <span>Send</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
