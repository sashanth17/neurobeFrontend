import React, { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  Sparkles,
  ArrowLeft,
  ChevronDown,
  FileCheck2,
  X,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState, Success, getAuthUser } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import useDebounce from "@/hook/useDebounce";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import Models from "@/imports/models.import";
import { EditQuestionModal } from "@/components/question-bank/EditQuestionModal";
import ViewQuestionModal from "@/components/question-bank/ViewQuestionModal";
import { CreateQuestionSetModal } from "@/components/question-bank/CreateQuestionSetModal";
import CourseQuestionBankTab from "@/components/question-bank/CourseQuestionBankTab";
import ConfigureTestScheduleModal from "@/components/academic-setup/ConfigureTestScheduleModal";

import {
  CourseItem,
  MCQQuestion,
  TopicRow,
  FALLBACK_COURSES,
  UNITS_CONFIG,
  newRow,
  normalizeMCQ,
  CourseSelectorView,
  MCQStatsBanner,
  MCQStudioWorkspace,
} from "@/components/mcq-generation";

const MCQGenerationIndexPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    search: "",
    roleFilter: "all" as "all" | "coordinator" | "instructor",
    loading: false,
    courses: [] as CourseItem[],
    selectedCourse: null as CourseItem | null,
    activeTab: "generator" as "generator" | "bank",
    courseUnits: [] as any[],

    /* Dynamic builder state */
    topicRows: [newRow()] as TopicRow[],

    /* 2D breakdown: K-level × difficulty */
    breakdown: {
      K1: { easy: 0, medium: 1, hard: 0 },
      K2: { easy: 0, medium: 2, hard: 0 },
      K3: { easy: 0, medium: 1, hard: 0 },
      K4: { easy: 0, medium: 1, hard: 0 },
    } as Record<string, Record<string, number>>,

    marksPerQuestion: "2",

    /* Questions pool */
    courseQuestions: {} as Record<string, MCQQuestion[]>,
    selectedBannerFilter: "recent" as "recent" | "all" | "approved" | "archived" | "review" | "drafted",
    recentQuestionIds: [] as string[],
    isGeneratingAI: false,
    generationToast: null as null | { type: "success" | "error"; msg: string },

    /* Modals & Accordion */
    expandedQuestionIds: [] as string[],
    isEditModalOpen: false,
    editingQuestion: null as MCQQuestion | null,
    viewQuestion: null as MCQQuestion | null,
    isViewModalOpen: false,
    isSetModalOpen: false,
    isConfigureModalOpen: false,
    configureModalData: null as any,
  });

  const debouncedSearch = useDebounce(state.search, 300);

  useEffect(() => {
    dispatch(setPageTitle("MCQ Generation"));
  }, [dispatch]);

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  useEffect(() => {
    if (router.query.course_id && state.courses.length > 0) {
      const found = state.courses.find(
        (c) =>
          String(c.id) === String(router.query.course_id) ||
          String(c.code).toLowerCase() === String(router.query.course_id).toLowerCase() ||
          String(c.course_code).toLowerCase() === String(router.query.course_id).toLowerCase()
      );
      if (found) setState({ selectedCourse: found });
    }
  }, [router.query.course_id, state.courses]);

  useEffect(() => {
    if (state.selectedCourse) {
      fetchCourseUnits(state.selectedCourse.id);
      fetchQuestions(state.selectedCourse.code || state.selectedCourse.id);
    }
  }, [state.selectedCourse]);

  /* ── Data fetching ────────────────────────────────────────────────── */
  const fetchQuestions = async (courseKey: string | number) => {
    try {
      const res: any = await Models.mcq.history_questions({ course_id: courseKey }).catch((err) => {
        console.error("fetchQuestions error:", err);
        return null;
      });
      let rawList: any[] = [];
      if (res) {
        if (Array.isArray(res)) rawList = res;
        else if (res.items && Array.isArray(res.items)) rawList = res.items;
        else if (res.questions && Array.isArray(res.questions)) rawList = res.questions;
        else if (res.data && Array.isArray(res.data)) rawList = res.data;
      }
      const fetched: MCQQuestion[] = rawList.map((item, idx) => normalizeMCQ(item, idx));
      setState({ courseQuestions: { ...state.courseQuestions, [courseKey]: fetched } });
    } catch (err) {
      console.error("Failed to fetch questions:", err);
    }
  };

  const fetchCourseUnits = async (courseId: string | number) => {
    try {
      const res: any = await Models.syllabus.get_units(courseId, { topic_status: "approved" });
      const arr = Array.isArray(res) ? res : (res?.units || []);
      if (arr.length > 0) {
        const mapped = arr.map((u: any, idx: number) => ({
          unitId: u.id || idx + 1,
          label: `Unit ${u.unit_number || idx + 1}`,
          title: u.unit_title || u.title || u.name || `Unit ${idx + 1}`,
          topics: u.topics ? u.topics.map((t: any) => t.topic_name || t.title || t.name || t) : ["General Topic"],
        }));
        setState({ courseUnits: mapped });
      } else {
        setState({ courseUnits: UNITS_CONFIG });
      }
    } catch {
      setState({ courseUnits: UNITS_CONFIG });
    }
  };

  const fetchAssignedCourses = async () => {
    try {
      setState({ loading: true });
      const authUser = getAuthUser();
      const userId = authUser?.id || 1;
      const body = { faculty_id: userId, coordinator_id: userId };
      const res: any = await Models.course.faculty_dashboard_overview(body).catch(() => null);
      const raw = res?.courses || res?.data || res || [];
      if (Array.isArray(raw) && raw.length > 0) {
        const formatted = raw.map((c: any, idx: number) => {
          const roleType: "coordinator" | "instructor" =
            c.role_type === "coordinator" || c.faculty_role === "coordinator" || c.role === "Course Coordinator"
              ? "coordinator"
              : "instructor";
          const qb = c.academic_preparation?.question_bank || {};
          return {
            id: c.id || c.course_id || `c-${idx}`,
            code: c.code || c.course_code || `COURSE${idx}`,
            course_code: c.course_code || c.code || `COURSE${idx}`,
            title: c.title || c.course_title || "Academic Course",
            course_title: c.course_title || c.title || "Academic Course",
            programme: c.programme || "B.Tech CSE",
            batch: c.batch_name || c.batch || "2024–2028",
            semester: c.semester || c.term || "Semester 5",
            students_count: c.students_count ?? c.student_count ?? c.enrolled_students_count ?? c.enrolled_count ?? 0,
            student_count: c.student_count ?? c.students_count ?? c.enrolled_students_count ?? 0,
            role: roleType === "coordinator" ? "Course Coordinator" : "Course Instructor",
            role_type: roleType,
            questions_count: c.questions_count ?? qb.questions_count ?? (Array.isArray(c.questions) ? c.questions.length : 0),
            approved_questions_count: c.approved_questions_count ?? qb.approved_questions_count ?? 0,
            drafted_questions_count: c.drafted_questions_count ?? qb.drafted_questions_count ?? 0,
            need_review_questions_count: c.need_review_questions_count ?? qb.need_review_questions_count ?? 0,
            units_count: c.units_count ?? c.total_units ?? 5,
          } as CourseItem;
        });
        setState({ courses: formatted, loading: false });
      } else {
        setState({ courses: [], loading: false });
      }
    } catch {
      setState({ courses: [], loading: false });
    }
  };

  /* ── Derived calculations ─────────────────────────────────────────── */
  const filteredCourses = state.courses.filter((course) => {
    const s = (debouncedSearch || "").toLowerCase().trim();
    const code = (course.code || course.course_code || "").toLowerCase();
    const title = (course.title || course.course_title || "").toLowerCase();
    const matchesSearch = !s || code.includes(s) || title.includes(s);
    const matchesRole =
      state.roleFilter === "all" ||
      (state.roleFilter === "coordinator" && course.role_type === "coordinator") ||
      (state.roleFilter === "instructor" && course.role_type !== "coordinator");
    return matchesSearch && matchesRole;
  });

  const currentCourseKey = state.selectedCourse?.code || state.selectedCourse?.course_code || "";
  const currentQuestions = state.courseQuestions[currentCourseKey] || [];

  const displayedQuestions = useMemo(() => {
    let list = currentQuestions;
    if (state.selectedBannerFilter === "recent") {
      if (state.recentQuestionIds && state.recentQuestionIds.length > 0) {
        list = currentQuestions.filter((q) => state.recentQuestionIds.includes(q.id));
      } else {
        list = currentQuestions.slice(0, 10);
      }
    } else if (state.selectedBannerFilter === "approved") {
      list = currentQuestions.filter((q) => (q.status || "").toLowerCase() === "approved");
    } else if (state.selectedBannerFilter === "archived") {
      list = currentQuestions.filter((q) => (q.status || "").toLowerCase() === "archived");
    } else if (state.selectedBannerFilter === "review") {
      list = currentQuestions.filter((q) => {
        const s = (q.status || "").toLowerCase();
        return s === "need review" || s === "review";
      });
    } else if (state.selectedBannerFilter === "drafted") {
      list = currentQuestions.filter((q) => {
        const s = (q.status || "").toLowerCase();
        return s === "drafted" || s === "draft";
      });
    }
    return list;
  }, [currentQuestions, state.selectedBannerFilter, state.recentQuestionIds]);

  const activeUnits = state.courseUnits.length > 0 ? state.courseUnits : UNITS_CONFIG;

  const totalBreakdown: number = Object.values(state.breakdown || {}).reduce<number>(
    (sum: number, diffObj: any) =>
      sum +
      Object.values(diffObj || {}).reduce<number>((s: number, v: any) => s + (Number(v) || 0), 0),
    0
  );
  const totalTopicQuestions = state.topicRows.reduce((s, r) => s + (Number(r.questionCount) || 0), 0);
  const breakdownValid = totalBreakdown === totalTopicQuestions;

  /* ── Handlers ─────────────────────────────────────────────────────── */
  const handleManageQuestions = (course: CourseItem) => {
    setState({ selectedCourse: course, activeTab: "generator" });
    router.replace({ pathname: router.pathname, query: { course_id: course.code || course.id } }, undefined, {
      shallow: true,
    });
  };

  const handleBackToCourses = () => {
    setState({ selectedCourse: null });
    router.replace({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
  };

  const addTopicRow = () => setState({ topicRows: [...state.topicRows, newRow()] });

  const removeTopicRow = (id: string) => {
    if (state.topicRows.length === 1) return;
    setState({ topicRows: state.topicRows.filter((r) => r.id !== id) });
  };

  const updateRow = (id: string, patch: Partial<TopicRow>) => {
    setState({
      topicRows: state.topicRows.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, ...patch };
        if (patch.unitId !== undefined) {
          const unit = activeUnits.find((u) => String(u.unitId) === String(patch.unitId));
          updated.topicName = unit?.topics?.[0] || "";
        }
        return updated;
      }),
    });
  };

  const updateBreakdown = (kLevel: string, diff: string, value: number) => {
    setState({
      breakdown: {
        ...state.breakdown,
        [kLevel]: { ...state.breakdown[kLevel], [diff]: Math.max(0, value) },
      },
    });
  };

  const showToast = (type: "success" | "error", msg: string) => {
    setState({ generationToast: { type, msg } });
    setTimeout(() => setState({ generationToast: null }), 5000);
  };

  const pollJobStatus = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res: any = await Models.mcq.status(jobId);
        if (res.status === "completed" || res.status === "complete") {
          clearInterval(interval);
          setState({ isGeneratingAI: false });
          if (state.selectedCourse) {
            const courseKey = state.selectedCourse.code || state.selectedCourse.id;
            const existingIds = new Set((state.courseQuestions[courseKey] || []).map((q) => q.id));
            const freshRes: any = await Models.mcq
              .history_questions({ course_id: courseKey, limit: 100 })
              .catch(() => null);
            let rawList: any[] = [];
            if (freshRes) {
              if (Array.isArray(freshRes)) rawList = freshRes;
              else if (freshRes.items) rawList = freshRes.items;
              else if (freshRes.questions) rawList = freshRes.questions;
              else if (freshRes.data) rawList = freshRes.data;
            }
            const fetched: MCQQuestion[] = rawList.map((item, idx) => normalizeMCQ(item, idx));
            const newlyCreated = fetched.filter((q) => !existingIds.has(q.id)).map((q) => q.id);
            const recentIds =
              newlyCreated.length > 0 ? newlyCreated : fetched.slice(0, totalTopicQuestions).map((q) => q.id);
            setState({
              courseQuestions: { ...state.courseQuestions, [courseKey]: fetched },
              recentQuestionIds: recentIds,
              selectedBannerFilter: "recent",
            });
          }
          showToast("success", "✓ MCQ Generation complete! Showing recently generated questions.");
          setTimeout(() => {
            document.getElementById("questions-section")?.scrollIntoView({ behavior: "smooth" });
          }, 350);
        } else if (res.status === "failed") {
          clearInterval(interval);
          setState({ isGeneratingAI: false });
          showToast("error", "Generation failed. Please try again.");
        }
      } catch {
        clearInterval(interval);
        setState({ isGeneratingAI: false });
        showToast("error", "Lost connection while polling job status.");
      }
    }, 5000);
  };

  const handleGenerateQuestions = async () => {
    if (!state.selectedCourse) return;
    if (!breakdownValid) {
      alert(`Bloom's taxonomy total (${totalBreakdown}) must equal total topic questions (${totalTopicQuestions}).`);
      return;
    }
    if (state.topicRows.some((r) => !r.topicName)) {
      alert("Please select a topic for every row.");
      return;
    }

    setState({ isGeneratingAI: true });

    try {
      const unitMap: Record<string, { unit_number: number; unit_title: string; topics: any[] }> = {};
      state.topicRows.forEach((row) => {
        const uid = String(row.unitId);
        const unit = activeUnits.find((u) => String(u.unitId) === uid);
        if (!unitMap[uid]) {
          unitMap[uid] = {
            unit_number: Number(uid) || 1,
            unit_title: unit?.title || `Unit ${uid}`,
            topics: [],
          };
        }
        unitMap[uid].topics.push({
          topic_id: String(unitMap[uid].topics.length + 1),
          topic_name: row.topicName,
          subtopics: [],
        });
      });

      const filteredBreakdown: Record<string, Record<string, number>> = {};
      Object.entries(state.breakdown).forEach(([k, diffObj]) => {
        const nonZero = Object.entries(diffObj).filter(([, v]) => (Number(v) || 0) > 0);
        if (nonZero.length > 0) filteredBreakdown[k] = Object.fromEntries(nonZero);
      });

      const payload = {
        syllabus: {
          course_id: String(state.selectedCourse?.code || currentCourseKey),
          units: Object.values(unitMap),
        },
        question_count: totalTopicQuestions,
        type: "mcq",
        language: "en",
        include_explanation: true,
        shuffle_options: true,
        distribution_mode: "knowledge_and_difficulty",
        knowledge_difficulty_breakdown: filteredBreakdown,
      };

      const res: any = await Models.mcq.generate(payload).catch((err) => {
        console.error("Generate API Error:", err);
        showToast("error", `Error from server: ${err?.message || "Unknown Error"}`);
        return null;
      });

      const jobId = res?.job_id || res?.data?.job_id || res?.id;
      if (jobId) {
        pollJobStatus(jobId);
      } else {
        setState({ isGeneratingAI: false });
        showToast("error", "Failed to start generation job. No job_id returned.");
      }
    } catch (err) {
      console.error("Generate error:", err);
      setState({ isGeneratingAI: false });
      showToast("error", "Unexpected error during generation.");
    }
  };

  const handleToggleApprove = async (questionId: string) => {
    const question = currentQuestions.find((q) => q.id === questionId);
    if (!question) return;
    const newStatus = (question.status || "").toLowerCase() === "approved" ? "Draft" : "Approved";
    try {
      await Models.mcq.update_question(questionId, { status: newStatus });
      const updated = currentQuestions.map((q) => (q.id === questionId ? { ...q, status: newStatus as any } : q));
      setState({ courseQuestions: { ...state.courseQuestions, [currentCourseKey]: updated } });
    } catch {
      showToast("error", "Failed to update question status.");
    }
  };

  const handleToggleArchive = async (questionId: string) => {
    const question = currentQuestions.find((q) => q.id === questionId);
    if (!question) return;
    const newStatus = (question.status || "").toLowerCase() === "archived" ? "Draft" : "Archived";
    try {
      await Models.mcq.update_question(questionId, { status: newStatus });
      const updated = currentQuestions.map((q) => (q.id === questionId ? { ...q, status: newStatus as any } : q));
      setState({ courseQuestions: { ...state.courseQuestions, [currentCourseKey]: updated } });
    } catch {
      showToast("error", "Failed to update question status.");
    }
  };

  const handleApproveAll = () => {
    const updated = currentQuestions.map((q) => ({ ...q, status: "approved" as const }));
    setState({ courseQuestions: { ...state.courseQuestions, [currentCourseKey]: updated } });
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await Models.mcq.delete_question(questionId);
      const updated = currentQuestions.filter((q) => q.id !== questionId);
      setState({ courseQuestions: { ...state.courseQuestions, [currentCourseKey]: updated } });
    } catch {
      showToast("error", "Failed to delete question.");
    }
  };

  const handleToggleExpandOne = (id: string) => {
    const current = state.expandedQuestionIds || [];
    if (current.includes(id)) {
      setState({ expandedQuestionIds: current.filter((qid: string) => qid !== id) });
    } else {
      setState({ expandedQuestionIds: [...current, id] });
    }
  };

  const handleToggleExpandAll = () => {
    const allIds = displayedQuestions.map((q) => q.id);
    const isAll = (state.expandedQuestionIds || []).length === allIds.length && allIds.length > 0;
    setState({ expandedQuestionIds: isAll ? [] : allIds });
  };

  /* ─── RENDER ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen pb-14">
      {/* Toast Notification */}
      {state.generationToast && (
        <div
          className={`fixed right-5 top-5 z-[9999] flex items-start gap-3 rounded-2xl px-5 py-4 shadow-2xl text-sm font-semibold animate-in slide-in-from-top-2 ${
            state.generationToast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          <span className="flex-1">{state.generationToast.msg}</span>
          <button onClick={() => setState({ generationToast: null })} className="ml-2 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* VIEW 1: ASSIGNED COURSES LIST */}
      {!state.selectedCourse ? (
        <CourseSelectorView
          courses={state.courses}
          filteredCourses={filteredCourses}
          loading={state.loading}
          search={state.search}
          onSearchChange={(search) => setState({ search })}
          roleFilter={state.roleFilter}
          onRoleFilterChange={(roleFilter) => setState({ roleFilter })}
          onManageQuestions={handleManageQuestions}
        />
      ) : (
        /* VIEW 2: QUESTION GENERATION WORKSPACE */
        <div>
          {/* Top nav bar */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToCourses}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Assigned Courses</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Current Course:</span>
              <div className="relative">
                <select
                  value={state.selectedCourse.code || state.selectedCourse.id}
                  onChange={(e) => {
                    const found = state.courses.find(
                      (c) => String(c.code) === e.target.value || String(c.id) === e.target.value
                    );
                    if (found) setState({ selectedCourse: found });
                  }}
                  className="h-9 rounded-xl border border-gray-200 bg-white px-3 pr-8 text-xs font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {state.courses.map((c) => (
                    <option key={c.id} value={c.code || c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <CourseBanner
            courseCode={state.selectedCourse.code || state.selectedCourse.course_code || "CS309"}
            courseTitle={state.selectedCourse.title || state.selectedCourse.course_title || "Course"}
            description="AI MCQ Generation Studio — Build dynamic question sets aligned to your syllabus units and topics."
            programme={state.selectedCourse.programme || "B.Tech CSE"}
            batch={state.selectedCourse.batch || "2024–2028"}
            academicYear={`${state.selectedCourse.semester || "Semester 5"}`}
            students={`${state.selectedCourse.students_count || 45} Students`}
            selectedCourse={state.selectedCourse.code}
            courseOptions={state.courses.map((c) => ({
              value: String(c.code || c.id),
              label: `${c.code} — ${c.title}`,
            }))}
            onCourseChange={(val) => {
              const target = typeof val === "object" ? val?.value : val;
              const found = state.courses.find(
                (c) => String(c.code) === String(target) || String(c.id) === String(target)
              );
              if (found) setState({ selectedCourse: found });
            }}
            onBack={handleBackToCourses}
          />

          {/* STATS BANNER */}
          <MCQStatsBanner
            questions={currentQuestions}
            selectedFilter={state.selectedBannerFilter}
            onSelectFilter={(selectedBannerFilter) => setState({ selectedBannerFilter })}
          />

          {/* Workspace Tabs */}
          <div className="mb-6 flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-800 gap-3">
            <div className="flex">
              {(["generator", "bank"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setState({ activeTab: tab })}
                  className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                    state.activeTab === tab
                      ? "border-color1 text-color1 dark:border-indigo-400 dark:text-indigo-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {tab === "generator" ? (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>AI Generation Studio</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="h-4 w-4" />
                      <span>Course Question Bank</span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                        {currentQuestions.length}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>

            <div className="pb-2">
              <button
                type="button"
                onClick={() => {
                  const c = state.selectedCourse;
                  setState({
                    isConfigureModalOpen: true,
                    configureModalData: {
                      testCode: `MCQ-${c?.code || "TEST"}-${Date.now().toString().slice(-4)}`,
                      courseCodeTitle: c ? `${c.code || c.course_code} — ${c.title || c.course_title}` : "Course MCQ Test",
                      testName: "Unit Assessment / MCQ Quiz",
                      unitLabel: "Unit 1",
                      topics: "Selected Question Bank Topics",
                      questionsCount: currentQuestions.length > 0 ? Math.min(currentQuestions.length, 10) : 10,
                      duration: "30 Minutes",
                      secureCode: `SEC-${Math.floor(1000 + Math.random() * 9000)}`,
                    },
                  });
                }}
                className="flex items-center gap-1.5 rounded-lg bg-color2 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Create Test</span>
              </button>
            </div>
          </div>

          {/* TAB 1: AI GENERATION STUDIO */}
          {state.activeTab === "generator" && (
            <MCQStudioWorkspace
              topicRows={state.topicRows}
              activeUnits={activeUnits}
              onAddRow={addTopicRow}
              onRemoveRow={removeTopicRow}
              onUpdateRow={updateRow}
              totalTopicQuestions={totalTopicQuestions}
              breakdown={state.breakdown}
              onUpdateBreakdown={updateBreakdown}
              totalBreakdown={totalBreakdown}
              breakdownValid={breakdownValid}
              marksPerQuestion={state.marksPerQuestion}
              onMarksChange={(marksPerQuestion) => setState({ marksPerQuestion })}
              isGeneratingAI={state.isGeneratingAI}
              onGenerateQuestions={handleGenerateQuestions}
              currentQuestions={currentQuestions}
              displayedQuestions={displayedQuestions}
              selectedBannerFilter={state.selectedBannerFilter}
              onSelectBannerFilter={(selectedBannerFilter) => setState({ selectedBannerFilter })}
              recentQuestionIds={state.recentQuestionIds}
              expandedQuestionIds={state.expandedQuestionIds}
              onToggleExpandOne={handleToggleExpandOne}
              onToggleExpandAll={handleToggleExpandAll}
              onToggleApprove={handleToggleApprove}
              onToggleArchive={handleToggleArchive}
              onEditQuestion={(q) => setState({ editingQuestion: q, isEditModalOpen: true })}
              onViewQuestion={(q) => setState({ viewQuestion: q, isViewModalOpen: true })}
              onDeleteQuestion={handleDeleteQuestion}
              onApproveAll={handleApproveAll}
              onCreateQuestionSet={() => setState({ isSetModalOpen: true })}
            />
          )}

          {/* TAB 2: COURSE QUESTION BANK */}
          {state.activeTab === "bank" && (
            <CourseQuestionBankTab
              courseKey={currentCourseKey}
              courseTitle={
                state.selectedCourse
                  ? `${state.selectedCourse.code || state.selectedCourse.course_code} — ${
                      state.selectedCourse.title || state.selectedCourse.course_title
                    }`
                  : "Course Question Bank"
              }
              courseQuestions={currentQuestions}
              courseUnits={state.courseUnits}
              onRefreshQuestions={() => {
                if (state.selectedCourse) {
                  fetchQuestions(
                    state.selectedCourse.code || state.selectedCourse.course_code || state.selectedCourse.id
                  );
                }
              }}
            />
          )}

          {/* Modals */}
          <EditQuestionModal
            open={state.isEditModalOpen}
            onClose={() => setState({ isEditModalOpen: false, editingQuestion: null })}
            topicLabel={state.selectedCourse ? `${state.selectedCourse.code} — ${state.selectedCourse.title}` : ""}
            code={state.editingQuestion?.code || "Q-MCQ-01"}
            onSave={(updated) => {
              const updatedQuestions = currentQuestions.map((q) =>
                q.id === updated.id
                  ? {
                      ...q,
                      text: updated.text,
                      question: updated.text,
                      options: updated.options,
                      explanation: updated.explanation,
                    }
                  : q
              );
              setState({ courseQuestions: { ...state.courseQuestions, [currentCourseKey]: updatedQuestions } });
              if (state.selectedCourse) {
                fetchQuestions(state.selectedCourse.code || state.selectedCourse.id);
              }
            }}
            initialData={
              state.editingQuestion
                ? {
                    id: state.editingQuestion.id,
                    question: state.editingQuestion.question || state.editingQuestion.text || "",
                    optionA: state.editingQuestion.options?.[0]?.text || "",
                    optionB: state.editingQuestion.options?.[1]?.text || "",
                    optionC: state.editingQuestion.options?.[2]?.text || "",
                    optionD: state.editingQuestion.options?.[3]?.text || "",
                    correctAnswer: (() => {
                      const opts = state.editingQuestion.options || [];
                      const foundIdx = opts.findIndex((o: any) => o.isCorrect === true || o.is_correct === true);
                      if (foundIdx === 0) return "A";
                      if (foundIdx === 1) return "B";
                      if (foundIdx === 2) return "C";
                      if (foundIdx === 3) return "D";
                      const foundKey = opts.find((o: any) => o.isCorrect || o.is_correct)?.key;
                      return foundKey || "A";
                    })(),
                    explanation: state.editingQuestion.explanation || "",
                    unit: {
                      value: state.editingQuestion.unit || "",
                      label: state.editingQuestion.unit || "Unit",
                    },
                    topic: {
                      value: state.editingQuestion.topic || "",
                      label: state.editingQuestion.topic || "Topic",
                    },
                    subtopic: {
                      value: state.editingQuestion.subtopic || "",
                      label: state.editingQuestion.subtopic || "Subtopic",
                    },
                    co: {
                      value: state.editingQuestion.co || "",
                      label: state.editingQuestion.co || "CO",
                    },
                    knowledge: {
                      value: state.editingQuestion.level || "",
                      label: state.editingQuestion.level || "Knowledge Level",
                    },
                    questionType: { value: "MCQ", label: "MCQ" },
                    marks: state.editingQuestion.marks || "2",
                    difficulty: {
                      value: state.editingQuestion.difficulty || "medium",
                      label: state.editingQuestion.difficulty || "Medium",
                    },
                  }
                : null
            }
          />

          {state.viewQuestion && (
            <ViewQuestionModal
              open={state.isViewModalOpen}
              onClose={() => setState({ isViewModalOpen: false, viewQuestion: null })}
              question={{
                id: state.viewQuestion.id,
                status: state.viewQuestion.status,
                unit: state.viewQuestion.unit,
                topic: state.viewQuestion.topic,
                subtopic: state.viewQuestion.subtopic,
                co: state.viewQuestion.co,
                level: state.viewQuestion.level,
                marks: state.viewQuestion.marks,
                difficulty: state.viewQuestion.difficulty,
                question: state.viewQuestion.question || state.viewQuestion.text || "",
                optionA: state.viewQuestion.options[0]?.text,
                optionB: state.viewQuestion.options[1]?.text,
                optionC: state.viewQuestion.options[2]?.text,
                optionD: state.viewQuestion.options[3]?.text,
                correctAnswer: state.viewQuestion.options.find((o) => o.isCorrect)?.key || "A",
                explanation: state.viewQuestion.explanation,
                course: currentCourseKey,
              }}
            />
          )}

          {state.isSetModalOpen && (
            <CreateQuestionSetModal
              open={state.isSetModalOpen}
              onClose={() => setState({ isSetModalOpen: false })}
              availableQuestions={currentQuestions}
              courseId={state.selectedCourse?.code || state.selectedCourse?.id}
              courseTitle={state.selectedCourse?.title || state.selectedCourse?.course_title}
              units={UNITS_CONFIG.map((u) => ({ unit_number: u.unitId, title: u.title }))}
              onCreated={() => {
                fetchQuestions(state.selectedCourse?.code || state.selectedCourse?.id);
              }}
            />
          )}

          {state.isConfigureModalOpen && (
            <ConfigureTestScheduleModal
              open={state.isConfigureModalOpen}
              onClose={() => setState({ isConfigureModalOpen: false, configureModalData: null })}
              testData={state.configureModalData}
              courseCodeTitle={state.configureModalData?.courseCodeTitle}
              testCode={state.configureModalData?.testCode}
              testName={state.configureModalData?.testName}
              unitLabel={state.configureModalData?.unitLabel}
              topics={state.configureModalData?.topics}
              questionsCount={state.configureModalData?.questionsCount}
              duration={state.configureModalData?.duration}
              secureCode={state.configureModalData?.secureCode}
              onSave={() => {
                Success("Test schedule configured successfully!");
                setState({ isConfigureModalOpen: false, configureModalData: null });
                const cId = state.selectedCourse?.id || state.selectedCourse?.code || "";
                router.push(`/neurobe/ins-mcq-test-execution?course_id=${cId}`);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(MCQGenerationIndexPage);
