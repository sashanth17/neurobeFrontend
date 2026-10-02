import React, { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  Sparkles,
  ArrowLeft,
  ChevronDown,
  FileCheck2,
  X,
  Eye,
  Activity,
  Plus,
  Search,
  BookOpen,
  Calendar,
  Layers,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import {
  useSetState,
  Success,
  Failure,
  getAuthUser,
  isLimitExhaustion,
  showLimitExhaustedModal,
  LIMIT_EXHAUSTED_MESSAGE,
  getErrorMessage,
} from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import useDebounce from "@/hook/useDebounce";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import Models from "@/imports/models.import";
import { EditQuestionModal } from "@/components/question-bank/EditQuestionModal";
import ViewQuestionModal from "@/components/question-bank/ViewQuestionModal";
import { CreateQuestionSetModal } from "@/components/question-bank/CreateQuestionSetModal";
import CourseQuestionBankTab from "@/components/question-bank/CourseQuestionBankTab";
import ConfigureTestScheduleModal from "@/components/academic-setup/ConfigureTestScheduleModal";
import MCQTestExecutionCard, {
  MCQTestExecutionItem,
} from "@/components/academic-setup/MCQTestExecutionCard";
import PreviewQuestionsModal from "@/components/academic-setup/PreviewQuestionsModal";
import EditTestScheduleModal from "@/components/academic-setup/EditTestScheduleModal";

import {
  CourseItem,
  MCQQuestion,
  UNITS_CONFIG,
  normalizeMCQ,
  CourseSelectorView,
  MCQStatsBanner,
  QuestionReviewPool,
} from "@/components/mcq-generation";
import {
  SimplifiedMCQGenerator,
  HierarchyUnitItem,
} from "@/components/mcq-generation/SimplifiedMCQGenerator";

type MCQTabKey = "generator" | "questions" | "bank" | "tests";

const MCQGenerationIndexPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    search: "",
    roleFilter: "all" as "all" | "coordinator" | "instructor",
    loading: false,
    courses: [] as CourseItem[],
    selectedCourse: null as CourseItem | null,
    activeTab: "generator" as MCQTabKey,

    /* Topic hierarchy version data */
    hierarchyUnits: [] as HierarchyUnitItem[],
    loadingHierarchy: false,

    /* Questions pool */
    courseQuestions: {} as Record<string, MCQQuestion[]>,
    selectedBannerFilter: "recent" as "recent" | "all" | "approved" | "archived" | "review" | "drafted",
    recentQuestionIds: [] as string[],
    isGeneratingAI: false,
    generationToast: null as null | { type: "success" | "error"; msg: string },

    /* Tests & Execution */
    tests: [] as MCQTestExecutionItem[],
    loadingTests: false,
    testSearch: "",
    testStatusFilter: "all" as string,

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

  // Modal states for tests
  const [previewTestModal, setPreviewTestModal] = useState<{
    open: boolean;
    test: MCQTestExecutionItem | null;
    questions: any[];
  }>({
    open: false,
    test: null,
    questions: [],
  });

  const [editTestModal, setEditTestModal] = useState<{
    open: boolean;
    data: MCQTestExecutionItem | null;
  }>({
    open: false,
    data: null,
  });

  const debouncedSearch = useDebounce(state.search, 300);

  useEffect(() => {
    dispatch(setPageTitle("MCQ"));
  }, [dispatch]);

  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  // Handle URL query parameters
  useEffect(() => {
    if (router.query.tab) {
      const tabParam = String(router.query.tab) as MCQTabKey;
      if (["generator", "questions", "bank", "tests"].includes(tabParam)) {
        setState({ activeTab: tabParam });
      }
    }
  }, [router.query.tab]);

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
      const courseId = state.selectedCourse.id;
      const courseKey = state.selectedCourse.code || state.selectedCourse.id;
      fetchTopicHierarchyUnits(courseId);
      fetchQuestions(courseKey);
      fetchTests(courseId);
    }
  }, [state.selectedCourse]);

  /* ── 1. Fetch Assigned Courses ─────────────────────────────────────── */
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

  /* ── 2. Fetch Topic Hierarchy from Generated Versions ──────────────── */
  const fetchTopicHierarchyUnits = async (courseId: string | number) => {
    try {
      setState({ loadingHierarchy: true });

      // Step A: Fetch active extraction from course portfolio
      const portRes: any = await Models.course.course_portfolio(courseId).catch((err) => {
        console.warn("Course portfolio fetch error:", err);
        return null;
      });

      let rawUnits: any[] =
        portRes?.active_extraction?.units ||
        portRes?.active_syllabus?.units ||
        [];

      // Step B: Fallback to syllabus units if portfolio didn't provide units
      if (!rawUnits.length) {
        const unitsRes: any = await Models.syllabus.get_units(courseId, { topic_status: "approved" }).catch(() => null);
        rawUnits = Array.isArray(unitsRes) ? unitsRes : unitsRes?.units || [];
      }

      // Step C: Map units and real topic names
      if (Array.isArray(rawUnits) && rawUnits.length > 0) {
        const mapped: HierarchyUnitItem[] = rawUnits.map((u: any, uIdx: number) => ({
          unit_number: Number(u.unit_number || u.unitNumber || uIdx + 1),
          unit_title: u.unit_title || u.unitTitle || u.title || `Unit ${uIdx + 1}`,
          topics: (u.topics || []).map((t: any, tIdx: number) => {
            const topicTitle =
              typeof t === "string"
                ? t
                : t.topic_name || t.topicName || t.title || t.name || `Topic ${tIdx + 1}`;
            const topicCode =
              typeof t === "object"
                ? String(t.topic_code || t.topicId || t.code || `${uIdx + 1}.${tIdx + 1}`)
                : `${uIdx + 1}.${tIdx + 1}`;
            const rawSub = typeof t === "object" && Array.isArray(t.subtopics) ? t.subtopics : [];
            return {
              id: topicCode,
              code: topicCode,
              title: topicTitle,
              subtopics: rawSub.map((st: any, sIdx: number) => ({
                id:
                  typeof st === "object"
                    ? String(st.subtopic_code || st.subtopicId || st.code || `${topicCode}.${sIdx + 1}`)
                    : `${topicCode}.${sIdx + 1}`,
                code:
                  typeof st === "object"
                    ? String(st.subtopic_code || st.subtopicId || st.code || `${topicCode}.${sIdx + 1}`)
                    : `${topicCode}.${sIdx + 1}`,
                title:
                  typeof st === "string"
                    ? st
                    : st.subtopic_name || st.subtopicName || st.title || st.name || `Subtopic ${sIdx + 1}`,
              })),
            };
          }),
        }));

        setState({ hierarchyUnits: mapped, loadingHierarchy: false });
        return;
      }

      // If no extraction units found, avoid dummy "Topic 1.1" placeholders
      setState({
        hierarchyUnits: [],
        loadingHierarchy: false,
      });
    } catch (err) {
      console.error("Failed to load topic hierarchy units:", err);
      setState({ hierarchyUnits: [], loadingHierarchy: false });
    }
  };

  /* ── 3. Fetch Questions Pool ───────────────────────────────────────── */
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

  /* ── 4. Fetch Tests Execution ──────────────────────────────────────── */
  const fetchTests = async (courseId: string | number) => {
    try {
      setState({ loadingTests: true });
      const testsRes: any = await Models.mcq.list_tests({ course_id: courseId }).catch(() => null);
      let backendTests: MCQTestExecutionItem[] = [];

      if (testsRes && Array.isArray(testsRes) && testsRes.length > 0) {
        const courseCode = state.selectedCourse?.code || "MCQ";
        backendTests = testsRes.map((t: any) => {
          const startT = t.test_window_start ? new Date(t.test_window_start) : null;
          const endT = t.test_window_end ? new Date(t.test_window_end) : null;
          const now = new Date();
          let status: any = "upcoming";
          let statusLabel = "Upcoming Test";
          const s = (t.status || "").toLowerCase();
          if (s === "cancelled" || s === "canceled") {
            status = "cancelled";
            statusLabel = "Cancelled";
          } else if (s === "completed") {
            status = "completed";
            statusLabel = "Completed Session";
          } else if (s === "draft") {
            status = "setup_required";
            statusLabel = "Access Setup Required";
          } else if (startT && endT && now >= startT && now <= endT) {
            status = "live";
            statusLabel = "• Live Assessment";
          } else if (s === "live") {
            status = "live";
            statusLabel = "• Live Assessment";
          } else if (endT && now > endT) {
            status = "completed";
            statusLabel = "Completed Session";
          } else {
            status = "upcoming";
            statusLabel = "Upcoming Test";
          }

          const formatDateGB = (d: Date) => {
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
          };

          const rawDateStr = startT ? formatDateGB(startT) : undefined;
          const rawStartTimeStr = startT
            ? startT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
            : undefined;
          const rawEndTimeStr = endT
            ? endT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })
            : undefined;

          return {
            id: t.test_id,
            testCode: t.test_code || `MCQ-${courseCode}-T`,
            title: t.title || "MCQ Test",
            status,
            statusLabel,
            unitLabel: t.unit_name || "Unit 1",
            questionsCount: t.question_count || 10,
            duration: `${t.duration_minutes || 30} Minutes`,
            testWindow:
              startT && endT
                ? `${startT.toLocaleDateString()} ${startT.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} – ${endT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : status === "setup_required"
                ? "Pending (Setup Required)"
                : "Not Scheduled",
            isPendingWindow: !startT,
            topics: Array.isArray(t.topics) ? t.topics.join("; ") : t.topics || "",
            secureCode: t.secure_code,
            questionSetId: t.question_set_id,
            questionSetName: undefined,
            maxTabSwitches: t.max_tab_switches,
            randomizeQuestions: t.randomize_questions,
            randomizeOptions: t.randomize_options,
            haveViva: t.have_viva,
            rawTestDate: rawDateStr,
            rawStartTime: rawStartTimeStr,
            rawEndTime: rawEndTimeStr,
            testWindowStart: t.test_window_start,
            testWindowEnd: t.test_window_end,
          };
        });
      }

      setState({ tests: backendTests, loadingTests: false });
    } catch {
      setState({ loadingTests: false });
    }
  };

  /* ── 5. AI Generation Handler ──────────────────────────────────────── */
  const showToast = (type: "success" | "error", msg: string) => {
    setState({ generationToast: { type, msg } });
    setTimeout(() => setState({ generationToast: null }), 5000);
  };

  const pollJobStatus = (jobId: string, requestedCount: number) => {
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
              newlyCreated.length > 0 ? newlyCreated : fetched.slice(0, requestedCount).map((q) => q.id);

            setState({
              courseQuestions: { ...state.courseQuestions, [courseKey]: fetched },
              recentQuestionIds: recentIds,
              selectedBannerFilter: "recent",
              activeTab: "questions", // Automatically switch to Generated Questions view!
            });
          }
          showToast("success", "✓ MCQ Generation complete! Switched to Generated Questions.");
        } else if (res.status === "failed") {
          clearInterval(interval);
          setState({ isGeneratingAI: false });
          const errorMsg = res.error || res.message || res.detail || "";
          if (isLimitExhaustion(res) || isLimitExhaustion(errorMsg)) {
            showLimitExhaustedModal(errorMsg);
            showToast("error", LIMIT_EXHAUSTED_MESSAGE);
          } else {
            showToast("error", errorMsg || "Generation failed. Please try again.");
          }
        }
      } catch {
        clearInterval(interval);
        setState({ isGeneratingAI: false });
        showToast("error", "Lost connection while polling job status.");
      }
    }, 5000);
  };

  const handleSimplifiedGenerate = async (genData: {
    selectedUnits: HierarchyUnitItem[];
    bloomCounts: Record<string, number>;
    totalQuestions: number;
    activePresetId: string | null;
    activePresetDescription: string;
    includeExplanation: boolean;
    shuffleOptions: boolean;
    enableBreakdown?: boolean;
    difficultyBreakdown?: Record<string, { easy: number; medium: number; hard: number }>;
  }) => {
    if (!state.selectedCourse) return;

    setState({ isGeneratingAI: true });

    try {
      const units = genData.selectedUnits.map((u) => ({
        unit_number: u.unit_number,
        unit_title: u.unit_title,
        topics: u.topics.map((t) => ({
          topic_id: t.code || t.id || t.title,
          topic_name: t.title,
          subtopics: (t.subtopics || []).map((st) => ({
            subtopic_id: st.code || st.id || st.title,
            subtopic_name: st.title,
          })),
        })),
      }));

      const payload: any = {
        syllabus: {
          course_id: String(state.selectedCourse.code || state.selectedCourse.id),
          units,
        },
        question_count: genData.totalQuestions,
        type: "mcq",
        language: "en",
        include_explanation: genData.includeExplanation,
        shuffle_options: genData.shuffleOptions,
      };

      if (genData.enableBreakdown && genData.difficultyBreakdown) {
        payload.distribution_mode = "knowledge_and_difficulty";
        const diffBreakdown: any = {};
        ["K1", "K2", "K3", "K4", "K5", "K6"].forEach((k) => {
          const bd = genData.difficultyBreakdown![k] || { easy: 0, medium: 0, hard: 0 };
          diffBreakdown[k] = {
            easy: Number(bd.easy) || 0,
            medium: Number(bd.medium) || 0,
            hard: Number(bd.hard) || 0,
          };
        });
        payload.knowledge_difficulty_breakdown = diffBreakdown;
        payload.knowledge_level_breakdown = null;
      } else {
        payload.distribution_mode = "knowledge_level";
        payload.knowledge_level_breakdown = genData.bloomCounts;
        payload.knowledge_difficulty_breakdown = null;
      }

      if (genData.activePresetDescription) {
        payload.description = genData.activePresetDescription;
      }

      const res: any = await Models.mcq.generate(payload).catch((err) => {
        console.error("Generate API Error:", err);
        if (isLimitExhaustion(err)) {
          showLimitExhaustedModal(getErrorMessage(err));
          showToast("error", LIMIT_EXHAUSTED_MESSAGE);
        } else {
          showToast("error", `Error: ${getErrorMessage(err, "Unknown Error")}`);
        }
        return null;
      });

      const jobId = res?.job_id || res?.data?.job_id || res?.id;
      if (jobId) {
        pollJobStatus(jobId, genData.totalQuestions);
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

  /* ── 6. Question Actions ───────────────────────────────────────────── */
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

  /* ── 7. Tests Filter & Action Handlers ─────────────────────────────── */
  const filteredTests = useMemo(() => {
    return state.tests.filter((test) => {
      const q = state.testSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        test.title.toLowerCase().includes(q) ||
        test.testCode.toLowerCase().includes(q) ||
        (test.topics && test.topics.toLowerCase().includes(q));

      const matchesStatus =
        state.testStatusFilter === "all" ||
        (state.testStatusFilter === "live" && test.status === "live") ||
        (state.testStatusFilter === "upcoming" && test.status === "upcoming") ||
        (state.testStatusFilter === "setup_required" && test.status === "setup_required") ||
        (state.testStatusFilter === "completed" && test.status === "completed");

      return matchesSearch && matchesStatus;
    });
  }, [state.tests, state.testSearch, state.testStatusFilter]);

  const handlePreviewQuestions = async (testItem: MCQTestExecutionItem) => {
    setPreviewTestModal({
      open: true,
      test: testItem,
      questions: currentQuestions.slice(0, Number(testItem.questionsCount) || 10),
    });
  };

  const handleCancelTest = async (testId: string) => {
    try {
      await Models.mcq.update_test(testId, { status: "cancelled" });
      Success("Test cancelled successfully.");
      if (state.selectedCourse) fetchTests(state.selectedCourse.id);
    } catch {
      Failure("Failed to cancel test.");
    }
  };

  const handleCompleteTest = async (testId: string) => {
    try {
      await Models.mcq.update_test(testId, { status: "completed" });
      Success("Test marked as completed.");
      if (state.selectedCourse) fetchTests(state.selectedCourse.id);
    } catch {
      Failure("Failed to complete test.");
    }
  };

  const handleDeleteTest = async (testId: string) => {
    try {
      await Models.mcq.delete_test(testId);
      Success("Test deleted successfully.");
      if (state.selectedCourse) fetchTests(state.selectedCourse.id);
    } catch {
      Failure("Failed to delete test.");
    }
  };

  const handleMonitorLive = (testId: string) => {
    const courseId = state.selectedCourse?.id || state.selectedCourse?.code || "";
    router.push(`/neurobe/ins-live-test-monitor?test_id=${testId}&course_id=${courseId}`);
  };

  const handleViewReport = (testId: string) => {
    const courseId = state.selectedCourse?.id || state.selectedCourse?.code || "";
    router.push(`/neurobe/ins-live-test-monitor?test_id=${testId}&course_id=${courseId}`);
  };

  const handleCopyCode = (code: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      Success("Secure access code copied to clipboard!");
    }
  };

  const handleManageQuestions = (course: CourseItem) => {
    setState({ selectedCourse: course, activeTab: "generator" });
    router.replace(
      { pathname: router.pathname, query: { course_id: course.code || course.id } },
      undefined,
      { shallow: true }
    );
  };

  const handleBackToCourses = () => {
    setState({ selectedCourse: null });
    router.replace({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
  };

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

  /* ── 8. Render ─────────────────────────────────────────────────────── */
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

      {/* VIEW 1: ASSIGNED COURSES SELECTOR */}
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
        /* VIEW 2: MCQ WORKSPACE */
        <div>
          {/* Top navigation */}
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

          {/* Course Banner */}
          <CourseBanner
            courseCode={state.selectedCourse.code || state.selectedCourse.course_code || "CS309"}
            courseTitle={state.selectedCourse.title || state.selectedCourse.course_title || "Course"}
            description="Comprehensive MCQ Studio — Generate questions from topic hierarchy, create question banks, and schedule & monitor student assessments."
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

          {/* Unified 4-Step Lifecycle Workspace Tabs */}
          <div className="mb-6 flex flex-wrap items-center justify-between border-b border-gray-200 dark:border-gray-800 gap-3">
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {[
                { id: "generator", label: "Generate Questions", icon: Sparkles, badge: null },
                {
                  id: "questions",
                  label: "Generated Questions",
                  icon: Eye,
                  badge: currentQuestions.length,
                },
                { id: "bank", label: "Question Banks", icon: FileCheck2, badge: null },
                {
                  id: "tests",
                  label: "Tests & Execution",
                  icon: Activity,
                  badge: state.tests.length > 0 ? state.tests.length : null,
                },
              ].map((tab) => {
                const IconComp = tab.icon;
                const isActive = state.activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setState({ activeTab: tab.id as MCQTabKey });
                      router.replace(
                        {
                          pathname: router.pathname,
                          query: { ...router.query, tab: tab.id },
                        },
                        undefined,
                        { shallow: true }
                      );
                    }}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? "border-color1 text-color1 dark:border-indigo-400 dark:text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    <IconComp className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.badge !== null && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          isActive
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300"
                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Action: Schedule Test button */}
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
                className="flex items-center gap-1.5 rounded-xl bg-color1 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule Test</span>
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              TAB 1: SIMPLIFIED STEP-BY-STEP GENERATOR
              ══════════════════════════════════════════════════════════════ */}
          {state.activeTab === "generator" && (
            <SimplifiedMCQGenerator
              courseCode={state.selectedCourse.code || state.selectedCourse.course_code || ""}
              courseTitle={state.selectedCourse.title || state.selectedCourse.course_title || ""}
              hierarchyUnits={state.hierarchyUnits}
              loadingHierarchy={state.loadingHierarchy}
              onGenerate={handleSimplifiedGenerate}
              isGeneratingAI={state.isGeneratingAI}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 2: GENERATED QUESTIONS & REVIEW POOL
              ══════════════════════════════════════════════════════════════ */}
          {state.activeTab === "questions" && (
            <div className="space-y-6">
              {/* Filter Pills Banner */}
              <MCQStatsBanner
                questions={currentQuestions}
                selectedFilter={state.selectedBannerFilter}
                onSelectFilter={(selectedBannerFilter) => setState({ selectedBannerFilter })}
              />

              {/* Questions Pool */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <QuestionReviewPool
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
                  isGeneratingAI={state.isGeneratingAI}
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 3: QUESTION BANKS
              ══════════════════════════════════════════════════════════════ */}
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
              courseUnits={state.hierarchyUnits.map((u) => ({
                unitId: u.unit_number,
                label: `Unit ${u.unit_number}`,
                title: u.unit_title,
                topics: u.topics.map((t) => t.title),
              }))}
              onRefreshQuestions={() => {
                if (state.selectedCourse) {
                  fetchQuestions(
                    state.selectedCourse.code || state.selectedCourse.course_code || state.selectedCourse.id
                  );
                }
              }}
            />
          )}

          {/* ══════════════════════════════════════════════════════════════
              TAB 4: TESTS & EXECUTION
              ══════════════════════════════════════════════════════════════ */}
          {state.activeTab === "tests" && (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={state.testSearch}
                    onChange={(e) => setState({ testSearch: e.target.value })}
                    placeholder="Search test code, title, topics..."
                    className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-xs text-gray-900 placeholder:text-gray-400 focus:border-indigo-600 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Status filter pill buttons */}
                  {(["all", "live", "upcoming", "setup_required", "completed"] as const).map((st) => {
                    const labels: Record<string, string> = {
                      all: "All Statuses",
                      live: "Live",
                      upcoming: "Upcoming",
                      setup_required: "Needs Setup",
                      completed: "Completed",
                    };
                    const isSelected = state.testStatusFilter === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setState({ testStatusFilter: st })}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        {labels[st]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Test Cards List */}
              <div className="space-y-4">
                {state.loadingTests ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/40"
                      />
                    ))}
                  </div>
                ) : filteredTests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
                    <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                    <h4 className="mt-3 text-base font-bold text-gray-900 dark:text-white">
                      No Scheduled MCQ Tests Found
                    </h4>
                    <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
                      {state.testSearch
                        ? `No tests match "${state.testSearch}". Try clearing your search.`
                        : "No tests scheduled yet for this course. Click 'Schedule Test' to set up a live student assessment from your question banks."}
                    </p>
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
                      className="mt-4 flex items-center gap-1.5 rounded-xl bg-color1 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Schedule New Test</span>
                    </button>
                  </div>
                ) : (
                  filteredTests.map((testItem) => (
                    <MCQTestExecutionCard
                      key={testItem.id}
                      test={testItem}
                      onPreviewQuestions={handlePreviewQuestions}
                      onEditSettings={(t) => setEditTestModal({ open: true, data: t })}
                      onConfigureTest={(t) => setEditTestModal({ open: true, data: t })}
                      onViewResults={(t) => handleViewReport(t.id)}
                      onCopyCode={handleCopyCode}
                      onMonitorLive={(t) => handleMonitorLive(t.id)}
                      onViewReport={(t) => handleViewReport(t.id)}
                      onCancelTest={(t) => handleCancelTest(t.id)}
                      onCompleteTest={(t) => handleCompleteTest(t.id)}
                      onDeleteTest={(t) => handleDeleteTest(t.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              MODALS
              ══════════════════════════════════════════════════════════════ */}
          {/* Edit Question Modal */}
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

          {/* View Question Modal */}
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

          {/* Create Question Set Modal */}
          {state.isSetModalOpen && (
            <CreateQuestionSetModal
              open={state.isSetModalOpen}
              onClose={() => setState({ isSetModalOpen: false })}
              availableQuestions={currentQuestions}
              courseId={state.selectedCourse?.code || state.selectedCourse?.id}
              courseTitle={state.selectedCourse?.title || state.selectedCourse?.course_title}
              units={state.hierarchyUnits.map((u) => ({
                unit_number: u.unit_number,
                title: u.unit_title,
              }))}
              onCreated={() => {
                fetchQuestions(state.selectedCourse?.code || state.selectedCourse?.id);
              }}
            />
          )}

          {/* Configure Test Schedule Modal */}
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
                setState({ isConfigureModalOpen: false, configureModalData: null, activeTab: "tests" });
                if (state.selectedCourse) fetchTests(state.selectedCourse.id);
              }}
            />
          )}

          {/* Preview Test Questions Modal */}
          {previewTestModal.open && (
            <PreviewQuestionsModal
              open={previewTestModal.open}
              onClose={() => setPreviewTestModal({ open: false, test: null, questions: [] })}
              testTitle={previewTestModal.test?.title}
              testCode={previewTestModal.test?.testCode}
              unitLabel={previewTestModal.test?.unitLabel}
              questions={previewTestModal.questions}
            />
          )}

          {/* Edit Test Schedule Modal */}
          {editTestModal.open && editTestModal.data && (
            <EditTestScheduleModal
              open={editTestModal.open}
              onClose={() => setEditTestModal({ open: false, data: null })}
              testData={editTestModal.data ? {
                testCode: editTestModal.data.testCode,
                testName: editTestModal.data.title,
                unitLabel: editTestModal.data.unitLabel,
                topics: editTestModal.data.topics,
                questionsCount: editTestModal.data.questionsCount,
                duration: editTestModal.data.duration,
                testDate: editTestModal.data.rawTestDate,
                startTime: editTestModal.data.rawStartTime,
                endTime: editTestModal.data.rawEndTime,
                secureCode: editTestModal.data.secureCode,
                maxTabSwitches: editTestModal.data.maxTabSwitches,
                haveViva: editTestModal.data.haveViva,
              } : null}
              onSave={() => {
                Success("Test schedule updated successfully!");
                setEditTestModal({ open: false, data: null });
                if (state.selectedCourse) fetchTests(state.selectedCourse.id);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(MCQGenerationIndexPage);
