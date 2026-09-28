import { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  Sparkles,
  Search,
  BookOpen,
  Layers,
  Plus,
  Clock,
  Lock,
  Check,
  Users,
  Calendar,
  AlertCircle,
  BarChart2,
  X,
  Key,
  ChevronDown,
  Filter,
  Activity,
} from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure, getAuthUser, useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import StepHeader from "@/components/academic-setup/StepHeader";
import GenericTabs from "@/components/common-components/GenericTabs";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import MCQTestExecutionCard, {
  MCQTestExecutionItem,
} from "@/components/academic-setup/MCQTestExecutionCard";
import PreviewQuestionsModal from "@/components/academic-setup/PreviewQuestionsModal";
import EditTestScheduleModal from "@/components/academic-setup/EditTestScheduleModal";
import Models from "@/imports/models.import";

interface QuestionSetItem {
  id: string;
  name: string;
  unit_number?: number;
  course_id?: string;
  total_questions?: number;
  questions?: any[];
  question_ids?: string[];
  created_at?: string;
}

interface CourseUnitItem {
  id?: number | string;
  unit_number?: number;
  unit_title?: string;
  title?: string;
  name?: string;
  topics?: any[];
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "live", label: "Live Assessments" },
  { value: "upcoming", label: "Upcoming Tests" },
  { value: "setup_required", label: "Needs Access Setup" },
  { value: "completed", label: "Completed Sessions" },
];

const DURATION_OPTIONS = [
  { value: "15 Minutes", label: "15 Minutes" },
  { value: "30 Minutes", label: "30 Minutes" },
  { value: "45 Minutes", label: "45 Minutes" },
  { value: "60 Minutes", label: "60 Minutes" },
  { value: "90 Minutes", label: "90 Minutes" },
  { value: "120 Minutes", label: "120 Minutes" },
];

const MCQTestExecution = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    courses: [] as any[],
    selectedCourse: null as any,
    selectedCourseOption: null as any,
    courseOptions: [] as { value: string; label: string }[],
    courseUnits: [] as CourseUnitItem[],
    unitOptions: [] as { value: string; label: string }[],
    loadingCourses: true,
    loadingTests: false,
    tests: [] as MCQTestExecutionItem[],
    questionSets: [] as QuestionSetItem[],
    questionPool: [] as any[],
    enrolledStudents: [] as any[],
    search: "",
    statusFilter: "all",
    unitFilter: "all",
    activeTab: "all",
  });

  // Modal states
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    title: string;
    testCode: string;
    unitLabel: string;
    questionSetName?: string;
    questions: any[];
  }>({
    open: false,
    title: "",
    testCode: "",
    unitLabel: "",
    questionSetName: "",
    questions: [],
  });

  const [editModal, setEditModal] = useState<{
    open: boolean;
    data: MCQTestExecutionItem | null;
  }>({ open: false, data: null });

  const [createModal, setCreateModal] = useState<{
    open: boolean;
    submitting: boolean;
    testCode: string;
    title: string;
    unitLabel: string;
    topics: string;
    questionSetId: string;
    questionsCount: number;
    duration: string;
    testDate: string;
    startTime: string;
    endTime: string;
    secureCode: string;
    maxTabSwitches: number;
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    haveViva: boolean;
    vivaThreshold: number;
  }>({
    open: false,
    submitting: false,
    testCode: "",
    title: "",
    unitLabel: "Unit 1",
    topics: "",
    questionSetId: "",
    questionsCount: 10,
    duration: "30 Minutes",
    testDate: new Date().toLocaleDateString("en-GB"),
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    secureCode: "",
    maxTabSwitches: 3,
    randomizeQuestions: false,
    randomizeOptions: false,
    haveViva: false,
    vivaThreshold: 50,
  });

  useEffect(() => {
    dispatch(setPageTitle("MCQ Test Execution"));
  }, [dispatch]);

  // 1. Fetch assigned courses for current user
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setState({ loadingCourses: true });
      const authUser = getAuthUser();
      const userId = authUser?.id || 1;
      const res: any = await Models.course.faculty_dashboard_overview({
        faculty_id: userId,
        coordinator_id: userId,
      }).catch(() => null);

      const rawCourses = res?.courses || res?.data || res || [];
      const courseList = Array.isArray(rawCourses) ? rawCourses : [];

      const formattedOptions = courseList.map((c: any) => ({
        value: String(c.id),
        label: `${c.course_code || c.code} — ${c.course_title || c.title}`,
      }));

      let selected = null;
      let selectedOpt = null;

      if (courseList.length > 0) {
        const queryCourseId = router.query.course_id;
        if (queryCourseId) {
          selected = courseList.find(
            (c: any) =>
              String(c.id) === String(queryCourseId) ||
              String(c.course_code || c.code).toLowerCase() === String(queryCourseId).toLowerCase()
          );
        }
        if (!selected) {
          selected = courseList[0];
        }
        selectedOpt = formattedOptions.find((o) => o.value === String(selected.id)) || {
          value: String(selected.id),
          label: `${selected.course_code || selected.code} — ${selected.course_title || selected.title}`,
        };
      }

      setState({
        courses: courseList,
        courseOptions: formattedOptions,
        selectedCourse: selected,
        selectedCourseOption: selectedOpt,
        loadingCourses: false,
      });

      if (selected) {
        loadCourseTestData(selected);
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setState({ loadingCourses: false });
    }
  };

  // 2. Fetch Question Sets, Syllabus Units, and Questions for selected course
  const loadCourseTestData = async (courseObj: any) => {
    if (!courseObj) return;
    try {
      setState({ loadingTests: true });
      const courseId = courseObj.id;
      const courseKey = courseObj.id || courseObj.course_code || courseObj.code;

      // 2a. Fetch Course Units from syllabus
      const unitsRes: any = await Models.syllabus.get_units(courseId, { topic_status: "approved" }).catch(() => null);
      let rawUnits: CourseUnitItem[] = [];
      if (unitsRes) {
        if (Array.isArray(unitsRes)) rawUnits = unitsRes;
        else if (unitsRes.units && Array.isArray(unitsRes.units)) rawUnits = unitsRes.units;
        else if (unitsRes.data && Array.isArray(unitsRes.data)) rawUnits = unitsRes.data;
      }

      const formattedUnitOptions = [
        { value: "all", label: "All Units" },
        ...(rawUnits.length > 0
          ? rawUnits.map((u, idx) => {
            const uNum = u.unit_number || idx + 1;
            const uTitle = u.unit_title || u.title || u.name || `Unit ${uNum}`;
            return {
              value: `Unit ${uNum}`,
              label: `Unit ${uNum}: ${uTitle}`,
            };
          })
          : [1, 2, 3, 4, 5].map((u) => ({
            value: `Unit ${u}`,
            label: `Unit ${u}`,
          }))),
      ];

      // 2b. Fetch Question Sets from backend
      const setsRes: any = await Models.mcq.list_sets({ course_id: courseKey }).catch(() => []);
      let setsList: QuestionSetItem[] = [];
      if (setsRes) {
        if (Array.isArray(setsRes)) setsList = setsRes;
        else if (setsRes.items && Array.isArray(setsRes.items)) setsList = setsRes.items;
        else if (setsRes.sets && Array.isArray(setsRes.sets)) setsList = setsRes.sets;
        else if (setsRes.data && Array.isArray(setsRes.data)) setsList = setsRes.data;
      }

      // 2c. Fetch History Questions for this course
      const qRes: any = await Models.mcq.history_questions({ course_id: courseKey }).catch(() => []);
      let rawQuestions: any[] = [];
      if (qRes) {
        if (Array.isArray(qRes)) rawQuestions = qRes;
        else if (qRes.items && Array.isArray(qRes.items)) rawQuestions = qRes.items;
        else if (qRes.questions && Array.isArray(qRes.questions)) rawQuestions = qRes.questions;
        else if (qRes.data && Array.isArray(qRes.data)) rawQuestions = qRes.data;
      }

      // 2d. Fetch tests from backend API
      const testsRes: any = await Models.mcq.list_tests({ course_id: courseId }).catch(() => null);
      let backendTests: MCQTestExecutionItem[] = [];

      if (testsRes && Array.isArray(testsRes) && testsRes.length > 0) {
        const courseCode = courseObj.course_code || courseObj.code || "MCQ";
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
            title: t.title || `MCQ Test`,
            status,
            statusLabel,
            unitLabel: t.unit_name || "Unit 1",
            questionsCount: t.question_count || 10,
            duration: `${t.duration_minutes || 30} Minutes`,
            testWindow: startT && endT
              ? `${startT.toLocaleDateString()} ${startT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${endT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : status === "setup_required" ? "Pending (Setup Required)" : "Not Scheduled",
            isPendingWindow: !startT,
            topics: Array.isArray(t.topics) ? t.topics.join("; ") : (t.topics || ""),
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

      // 2e. Fetch Enrolled Students for this course
      const enrollRes: any = await Models.course_enrollment.list({ course_id: courseId }).catch(() => null);
      let enrolledList: any[] = [];
      if (enrollRes) {
        if (Array.isArray(enrollRes)) enrolledList = enrollRes;
        else if (enrollRes.data && Array.isArray(enrollRes.data)) enrolledList = enrollRes.data;
        else if (enrollRes.items && Array.isArray(enrollRes.items)) enrolledList = enrollRes.items;
      }

      setState({
        courseUnits: rawUnits,
        unitOptions: formattedUnitOptions,
        questionSets: setsList,
        questionPool: rawQuestions,
        enrolledStudents: enrolledList,
        tests: backendTests,
        loadingTests: false,
      });
    } catch (err) {
      console.error("Error loading course test data:", err);
      setState({ loadingTests: false });
    }
  };

  // Safe handler for CourseBanner course switching
  const handleCourseChange = (val: any) => {
    const courseId = typeof val === "object" ? val?.value : val;
    if (!courseId) return;

    const matched = state.courses.find(
      (c: any) =>
        String(c.id) === String(courseId) ||
        String(c.course_code || c.code).toLowerCase() === String(courseId).toLowerCase()
    );

    if (matched) {
      const selectedOpt = state.courseOptions.find((o: any) => o.value === String(matched.id)) || {
        value: String(matched.id),
        label: `${matched.course_code || matched.code} — ${matched.course_title || matched.title}`,
      };
      setState({ selectedCourse: matched, selectedCourseOption: selectedOpt });
      router.push(`/neurobe/ins-mcq-test-execution?course_id=${matched.id}`, undefined, { shallow: true });
      loadCourseTestData(matched);
    }
  };

  // Helper to persist updated tests locally if needed
  const saveTestsState = (newTests: MCQTestExecutionItem[]) => {
    setState({ tests: newTests });
  };

  // 3. Open Create Test Modal
  const openCreateTest = () => {
    const courseCode = state.selectedCourse?.course_code || state.selectedCourse?.code || "MCQ";
    const prefix = courseCode.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "CN";
    const randCode = `${prefix}-${Math.floor(1000 + Math.random() * 9000).toString(36).toUpperCase().slice(0, 4)}`;
    const newTestNum = state.tests.length + 1;
    const defaultSet = state.questionSets[0];
    const initialUnit = defaultSet?.unit_number ? `Unit ${defaultSet.unit_number}` : "Unit 1";
    const initialTopics =
      defaultSet?.topics_included?.join(", ") ||
      state.courseUnits[0]?.topics?.map((t: any) => t.topic_name || t.title || t).slice(0, 3).join(", ") ||
      "";

    const now = new Date();
    const startMins = Math.ceil((now.getMinutes() + 2) / 5) * 5;
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), startMins);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

    const formatTime12 = (d: Date) => {
      let hh = d.getHours();
      const mm = d.getMinutes().toString().padStart(2, "0");
      const period = hh >= 12 ? "PM" : "AM";
      hh = hh % 12;
      hh = hh ? hh : 12;
      return `${hh.toString().padStart(2, "0")}:${mm} ${period}`;
    };

    setCreateModal({
      open: true,
      submitting: false,
      testCode: `MCQ-${courseCode}-T${newTestNum}`,
      title: `${courseCode} — ${initialUnit} Assessment`,
      unitLabel: initialUnit,
      topics: initialTopics,
      questionSetId: defaultSet?.id || "",
      questionsCount: defaultSet?.total_count || defaultSet?.total_questions || defaultSet?.questions?.length || 10,
      duration: "30 Minutes",
      testDate: startDate.toLocaleDateString("en-GB"),
      startTime: formatTime12(startDate),
      endTime: formatTime12(endDate),
      secureCode: randCode,
      maxTabSwitches: 3,
      randomizeQuestions: false,
      randomizeOptions: false,
      haveViva: false,
      vivaThreshold: 50,
    });
  };

  const handleSaveNewTest = async () => {
    if (!createModal.title.trim()) {
      Failure("Please enter a valid assessment title.");
      return;
    }
    if (!createModal.questionSetId) {
      Failure("Please select a Question Set from the pool.");
      return;
    }
    if (!createModal.secureCode.trim()) {
      Failure("Please enter or generate a secure test passcode.");
      return;
    }
    if (!state.selectedCourse?.id) {
      Failure("No course selected.");
      return;
    }

    // Parse date + times to ISO
    const parseDatetime = (dateStr: string, timeStr: string) => {
      try {
        const parts = dateStr.includes("/") ? dateStr.split("/").map(Number) : dateStr.split("-").map(Number);
        let day: number, month: number, year: number;
        if (parts[0] > 1000) {
          [year, month, day] = parts;
        } else {
          [day, month, year] = parts;
        }
        const [time, period] = (timeStr || "10:00 AM").trim().split(" ");
        const [hh, mm] = time.split(":").map(Number);
        const h24 =
          period?.toUpperCase() === "PM" ? (hh === 12 ? 12 : hh + 12) : hh === 12 ? 0 : hh;
        return new Date(year, month - 1, day, h24, mm, 0).toISOString();
      } catch {
        return undefined;
      }
    };

    const startISO = parseDatetime(createModal.testDate, createModal.startTime);
    const endISO = parseDatetime(createModal.testDate, createModal.endTime);

    if (!startISO || !endISO) {
      Failure("Please select a valid test date, start time, and end time.");
      return;
    }
    if (new Date(endISO) <= new Date(startISO)) {
      Failure("Test end time must be after start time.");
      return;
    }
    if (new Date(endISO).getTime() <= Date.now()) {
      Failure("Test window end time must be in the future. Please select a valid future date and time.");
      return;
    }

    const durationMins = parseInt(createModal.duration) || 30;
    const enrolledEmails = (state.enrolledStudents || [])
      .map((s: any) => s.email)
      .filter(Boolean);

    const payload = {
      question_set_id: createModal.questionSetId,
      course_id: Number(state.selectedCourse.id),
      title: createModal.title.trim(),
      test_code: createModal.testCode.trim(),
      unit_name: createModal.unitLabel,
      topics: createModal.topics
        ? createModal.topics.split(/[,;]/).map((t: string) => t.trim()).filter(Boolean)
        : [],
      duration_minutes: durationMins,
      test_window_start: startISO,
      test_window_end: endISO,
      secure_code: createModal.secureCode.trim(),
      max_tab_switches: Number(createModal.maxTabSwitches) || 0,
      randomize_questions: Boolean(createModal.randomizeQuestions),
      randomize_options: Boolean(createModal.randomizeOptions),
      have_viva: Boolean(createModal.haveViva),
      viva_threshold: Number(createModal.vivaThreshold) || 50,
      students_associated: enrolledEmails,
    };

    try {
      setCreateModal((prev) => ({ ...prev, submitting: true }));
      await (Models.mcq as any).create_test_schedule(payload);
      Success(`MCQ Assessment "${createModal.title}" scheduled successfully!`);
      setCreateModal((prev) => ({ ...prev, open: false, submitting: false }));
      // Reload tests directly from backend API
      await loadCourseTestData(state.selectedCourse);
    } catch (err: any) {
      setCreateModal((prev) => ({ ...prev, submitting: false }));
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        (typeof err === "string" ? err : "Failed to create and schedule test.");
      Failure(errorMsg);
    }
  };

  // 4. Update existing schedule via real API
  const handleUpdateSchedule = async (updatedData: any) => {
    if (!editModal.data) return;
    const testId = editModal.data.id;

    const parseDatetime = (dateStr: string, timeStr: string) => {
      try {
        const parts = dateStr.includes("/") ? dateStr.split("/").map(Number) : dateStr.split("-").map(Number);
        let day: number, month: number, year: number;
        if (parts[0] > 1000) [year, month, day] = parts;
        else[day, month, year] = parts;
        const [time, period] = (timeStr || "10:00 AM").trim().split(" ");
        const [hh, mm] = time.split(":").map(Number);
        const h24 = period?.toUpperCase() === "PM" ? (hh === 12 ? 12 : hh + 12) : hh === 12 ? 0 : hh;
        return new Date(year, month - 1, day, h24, mm, 0).toISOString();
      } catch {
        return undefined;
      }
    };

    const startISO = updatedData.testDate && updatedData.startTime ? parseDatetime(updatedData.testDate, updatedData.startTime) : undefined;
    const endISO = updatedData.testDate && updatedData.endTime ? parseDatetime(updatedData.testDate, updatedData.endTime) : undefined;

    const payload: any = {};
    if (updatedData.secureCode) payload.secure_code = updatedData.secureCode.trim();
    if (startISO) payload.test_window_start = startISO;
    if (endISO) payload.test_window_end = endISO;

    try {
      await (Models.mcq as any).update_test_schedule(testId, payload);
      Success("Test schedule and access passcode updated successfully.");
      setEditModal({ open: false, data: null });
      await loadCourseTestData(state.selectedCourse);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || "Failed to update test schedule";
      Failure(errorMsg);
    }
  };

  // 5. Preview Questions Modal handler
  const handlePreviewQuestions = (testItem: MCQTestExecutionItem) => {
    let testQuestions = testItem.questions || [];
    if (testQuestions.length === 0 && testItem.questionSetId) {
      const foundSet = state.questionSets.find((s) => s.id === testItem.questionSetId);
      if (foundSet?.questions?.length) testQuestions = foundSet.questions;
    }
    if (testQuestions.length === 0) {
      const qNum = typeof testItem.questionsCount === "number" ? testItem.questionsCount : 5;
      testQuestions = state.questionPool.slice(0, qNum);
    }

    setPreviewModal({
      open: true,
      title: testItem.title,
      testCode: testItem.testCode,
      unitLabel: testItem.unitLabel,
      questionSetName: testItem.questionSetName,
      questions: testQuestions,
    });
  };

  // 6. Copy access code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    Success(`Passcode "${code}" copied to clipboard!`);
  };

  // 7. Navigate to live monitor
  const handleMonitorLive = (testItem: MCQTestExecutionItem) => {
    router.push(
      `/neurobe/ins-mcq-live-monitor?test_id=${testItem.id}&test_title=${encodeURIComponent(testItem.title)}&course_id=${state.selectedCourse?.id || ""}`
    );
  };

  // 8. Navigate to post-test report
  const handleViewReport = (testItem: MCQTestExecutionItem) => {
    router.push(
      `/neurobe/ins-mcq-report?test_id=${testItem.id}&test_title=${encodeURIComponent(testItem.title)}&course_id=${state.selectedCourse?.id || ""}`
    );
  };

  // 9. Cancel test
  const handleCancelTest = async (testItem: MCQTestExecutionItem) => {
    try {
      await (Models.mcq as any).cancel_test(testItem.id);
      const updated = state.tests.map((t) =>
        t.id === testItem.id ? { ...t, status: "cancelled" as any, statusLabel: "Cancelled" } : t
      );
      setState({ tests: updated });
      Success(`Test "${testItem.title}" cancelled successfully.`);
    } catch (e: any) {
      Failure(e?.message || "Failed to cancel test");
    }
  };

  // 9b. Complete test
  const handleCompleteTest = async (testItem: MCQTestExecutionItem) => {
    try {
      await (Models.mcq as any).complete_test(testItem.id);
      const updated = state.tests.map((t) =>
        t.id === testItem.id ? { ...t, status: "completed" as any, statusLabel: "Completed" } : t
      );
      setState({ tests: updated });
      Success(`Assessment "${testItem.title}" concluded and marked as Completed.`);
    } catch (e: any) {
      Failure(e?.message || "Failed to complete test");
    }
  };

  // 10. Delete test
  const handleDeleteTest = async (testItem: MCQTestExecutionItem) => {
    try {
      await (Models.mcq as any).delete_test(testItem.id);
      const updated = state.tests.filter((t) => t.id !== testItem.id);
      setState({ tests: updated });
      Success(`Test "${testItem.title}" deleted.`);
    } catch (e: any) {
      Failure(e?.message || "Failed to delete test");
    }
  };

  // Derived filtered tests
  const filteredTests = useMemo(() => {
    return state.tests.filter((t) => {
      // Tab / Status Filter
      if (state.activeTab !== "all" && t.status !== state.activeTab) {
        return false;
      }
      if (state.statusFilter !== "all" && t.status !== state.statusFilter) {
        return false;
      }
      // Unit filter
      if (state.unitFilter !== "all" && !t.unitLabel?.toLowerCase().includes(state.unitFilter.toLowerCase())) {
        return false;
      }
      // Search filter
      if (state.search.trim()) {
        const s = state.search.toLowerCase().trim();
        const matchesCode = t.testCode.toLowerCase().includes(s);
        const matchesTitle = t.title.toLowerCase().includes(s);
        const matchesTopics = (t.topics || "").toLowerCase().includes(s);
        const matchesUnit = (t.unitLabel || "").toLowerCase().includes(s);
        const matchesSet = (t.questionSetName || "").toLowerCase().includes(s);
        if (!matchesCode && !matchesTitle && !matchesTopics && !matchesUnit && !matchesSet) {
          return false;
        }
      }
      return true;
    });
  }, [state.tests, state.activeTab, state.statusFilter, state.unitFilter, state.search]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: state.tests.length,
      setup_required: 0,
      upcoming: 0,
      live: 0,
      completed: 0,
    };
    state.tests.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });
    return counts;
  }, [state.tests]);

  const dynamicTabs = STATUS_FILTER_OPTIONS.map((tab) => ({
    key: tab.value,
    label: tab.label,
    count: tabCounts[tab.value] ?? 0,
  }));

  const activeCourse = state.selectedCourse;
  const courseCode = activeCourse?.course_code || activeCourse?.code || "COURSE";
  const courseTitle = activeCourse?.course_title || activeCourse?.title || "Academic Course";
  const studentCount = activeCourse?.students_count ?? activeCourse?.student_count ?? 0;

  return (
    <div className="min-h-screen">
      {/* 1. Dynamic Course Banner */}
      <CourseBanner
        courseCode={courseCode}
        courseTitle={courseTitle}
        description="Instructor View — Configure test execution schedules, assign Question Sets from the pool, generate secure passcodes, and monitor live submissions."
        programme={activeCourse?.programme || "B.Tech CSE"}
        batch={activeCourse?.batch_name || activeCourse?.batch || "2024–2028"}
        academicYear={activeCourse?.semester ? `Semester ${activeCourse.semester}` : "Semester 5"}
        students={`${studentCount} Students`}
        toogle="instructor"
        selectedCourse={state.selectedCourseOption}
        activeView={state.activeTab}
        onBack={() => router.push("/neurobe/mcq-generation")}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      {/* 3. Summary Stats Banner */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Assessments
            </span>
            <div className="rounded-xl bg-purple-100 p-2 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {state.tests.length}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">Configured test schedules</p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs dark:border-emerald-900/40 dark:bg-gray-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Live Assessments
            </span>
            <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {tabCounts.live}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">Currently active sessions</p>
        </div>

        <div className="rounded-2xl border border-indigo-200/80 bg-white p-4 shadow-xs dark:border-indigo-900/40 dark:bg-gray-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Question Sets
            </span>
            <div className="rounded-xl bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {state.questionSets.length || (state.questionPool.length > 0 ? 2 : 0)} Sets
          </p>
          <p className="mt-0.5 text-xs text-gray-500">Available for assignment</p>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 shadow-xs dark:border-gray-800 dark:bg-gray-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              MCQ Pool Questions
            </span>
            <div className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {state.questionPool.length || activeCourse?.questions_count || 0}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">Total approved question bank</p>
        </div>
      </div>

      {/* 4. Controls, Search Bar, Unit and Status Filters */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[260px] max-w-sm flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={state.search}
            onChange={(e) => setState({ search: e.target.value })}
            placeholder="Search test code, title, topics, sets..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-xs text-gray-900 placeholder:text-gray-400 focus:border-purple-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Dropdown Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Unit Filter Dropdown */}
          <div className="w-48 shrink-0">
            <CustomSelect
              options={state.unitOptions}
              value={state.unitOptions.find((o) => o.value === state.unitFilter) || state.unitOptions[0]}
              onChange={(e) => setState({ unitFilter: e?.value || "all" })}
              placeholder="Filter by Unit"
              isClearable={false}
              borderRadius={12}
              className="w-full text-xs"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-48 shrink-0">
            <CustomSelect
              options={STATUS_FILTER_OPTIONS}
              value={STATUS_FILTER_OPTIONS.find((o) => o.value === state.statusFilter) || STATUS_FILTER_OPTIONS[0]}
              onChange={(e) => setState({ statusFilter: e?.value || "all" })}
              placeholder="Filter by Status"
              isClearable={false}
              borderRadius={12}
              className="w-full text-xs"
            />
          </div>

          {/* Action Button: Create Test */}
          <button
            type="button"
            onClick={openCreateTest}
            className="flex h-[38px] items-center gap-2 rounded-xl bg-color1 px-4 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            <span>Create Test</span>
          </button>
        </div>
      </div>

      {/* 5. Generic Tabs Filter */}
      <div className="mt-4">
        <GenericTabs
          tabs={dynamicTabs}
          activeKey={state.activeTab}
          onChange={(tabKey) => setState({ activeTab: tabKey as string, statusFilter: tabKey as string })}
        />
      </div>

      {/* 6. Test Cards List */}
      <div className="mt-6 space-y-4">
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
              No MCQ Tests Found
            </h4>
            <p className="mt-1 max-w-sm text-xs text-gray-500 dark:text-gray-400">
              {state.search
                ? `No tests match "${state.search}". Try clearing the search query.`
                : "No assessments scheduled for this filter. Create and schedule a new test to get started."}
            </p>
            <button
              type="button"
              onClick={openCreateTest}
              className="mt-4 flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create New Test</span>
            </button>
          </div>
        ) : (
          filteredTests.map((testItem) => (
            <MCQTestExecutionCard
              key={testItem.id}
              test={testItem}
              onPreviewQuestions={handlePreviewQuestions}
              onEditSettings={(t) => setEditModal({ open: true, data: t })}
              onConfigureTest={(t) => setEditModal({ open: true, data: t })}
              onViewResults={handleViewReport}
              onCopyCode={handleCopyCode}
              onMonitorLive={handleMonitorLive}
              onViewReport={handleViewReport}
              onCancelTest={handleCancelTest}
              onCompleteTest={handleCompleteTest}
              onDeleteTest={handleDeleteTest}
            />
          ))
        )}
      </div>

      {/* 7. Preview Questions Modal */}
      <PreviewQuestionsModal
        open={previewModal.open}
        onClose={() => setPreviewModal((prev) => ({ ...prev, open: false }))}
        testTitle={previewModal.title}
        testCode={previewModal.testCode}
        unitLabel={previewModal.unitLabel}
        questionSetName={previewModal.questionSetName}
        questions={previewModal.questions}
      />

      {/* 8. Edit Test Schedule Modal */}
      <EditTestScheduleModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, data: null })}
        testData={
          editModal.data
            ? {
              testCode: editModal.data.testCode,
              courseCodeTitle: `${courseCode} — ${courseTitle}`,
              testName: editModal.data.title,
              unitLabel: editModal.data.unitLabel,
              topics: editModal.data.topics,
              questionsCount: editModal.data.questionsCount,
              duration: editModal.data.duration,
              testDate: editModal.data.rawTestDate || new Date().toLocaleDateString("en-GB"),
              startTime: editModal.data.rawStartTime || "10:00 AM",
              endTime: editModal.data.rawEndTime || "11:00 AM",
              secureCode: editModal.data.secureCode || "",
              maxTabSwitches: editModal.data.maxTabSwitches,
              haveViva: editModal.data.haveViva,
            }
            : null
        }
        onSave={handleUpdateSchedule}
      />

      {/* 9. Create Test Modal with Question Set Assignment */}
      {createModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setCreateModal((prev) => ({ ...prev, open: false }))}
          />
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 animate-slideUp">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800 shrink-0">
              <div>
                <span className="rounded-md bg-purple-100 px-2.5 py-0.5 font-mono text-xs font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                  {createModal.testCode}
                </span>
                <h3 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                  Create & Schedule MCQ Assessment
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Assign a Question Set, configure test window, and generate student passcode.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModal((prev) => ({ ...prev, open: false }))}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {/* Test Title */}
              <div className="space-y-1">
                <label className="font-bold text-gray-900 dark:text-white">
                  Assessment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createModal.title}
                  onChange={(e) => setCreateModal((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Unit 1 Physical Layer Quiz"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Question Set Assignment Selector */}
              <div className="space-y-1 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                    <Layers className="h-4 w-4 text-indigo-600" />
                    <span>Assign Question Set <span className="text-red-500">*</span></span>
                  </label>
                  <span className="text-[11px] text-indigo-600 font-semibold">
                    {state.questionSets.length} sets available
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                  Select an approved Question Set from the course pool to link to this test.
                </p>

                <select
                  value={createModal.questionSetId}
                  onChange={(e) => {
                    const setId = e.target.value;
                    const matchedSet = state.questionSets.find((s) => s.id === setId);
                    setCreateModal((p) => ({
                      ...p,
                      questionSetId: setId,
                      questionsCount: matchedSet?.total_questions || p.questionsCount,
                      unitLabel: matchedSet?.unit_number ? `Unit ${matchedSet.unit_number}` : p.unitLabel,
                    }));
                  }}
                  className="mt-2 w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                >
                  <option value="">-- Select Question Set from Course Pool --</option>
                  {state.questionSets.map((qs) => (
                    <option key={qs.id} value={qs.id}>
                      {qs.name} ({qs.total_count || qs.total_questions || qs.questions?.length || 0} Questions • Unit {qs.unit_number || 1})
                    </option>
                  ))}
                </select>

                {state.questionSets.length === 0 && (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                    ⚠️ No Question Sets found for this course. Please create a Question Set in MCQ Question Bank first.
                  </p>
                )}
              </div>

              {/* Unit & Questions Count */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-900 dark:text-white">Unit</label>
                  <select
                    value={createModal.unitLabel}
                    onChange={(e) => setCreateModal((p) => ({ ...p, unitLabel: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                  >
                    {state.unitOptions
                      .filter((u) => u.value !== "all")
                      .map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-900 dark:text-white">
                    Questions Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={createModal.questionsCount}
                    onChange={(e) =>
                      setCreateModal((p) => ({ ...p, questionsCount: Number(e.target.value) || 1 }))
                    }
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Duration & Topics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-900 dark:text-white">Test Duration</label>
                  <select
                    value={createModal.duration}
                    onChange={(e) => setCreateModal((p) => ({ ...p, duration: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-900 dark:text-white">Topics Covered</label>
                  <input
                    type="text"
                    value={createModal.topics}
                    onChange={(e) => setCreateModal((p) => ({ ...p, topics: e.target.value }))}
                    placeholder="e.g. Protocol Stack, Physical Media"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Schedule Date & Time */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-900 dark:text-white">Test Date</label>
                  <Flatpickr
                    value={createModal.testDate}
                    options={{ dateFormat: "d/m/Y" }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                    onChange={(_, dateStr) =>
                      setCreateModal((p) => ({ ...p, testDate: dateStr }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-900 dark:text-white">Start Time</label>
                  <Flatpickr
                    value={createModal.startTime}
                    options={{ noCalendar: true, enableTime: true, dateFormat: "h:i K" }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                    onChange={(_, timeStr) =>
                      setCreateModal((p) => ({ ...p, startTime: timeStr }))
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-900 dark:text-white">End Time</label>
                  <Flatpickr
                    value={createModal.endTime}
                    options={{ noCalendar: true, enableTime: true, dateFormat: "h:i K" }}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-semibold text-gray-900 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white cursor-pointer"
                    onChange={(_, timeStr) =>
                      setCreateModal((p) => ({ ...p, endTime: timeStr }))
                    }
                  />
                </div>
              </div>

              {/* Passcode & Enrolled Students */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-900 dark:text-white">
                    Secure Test Passcode <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const prefix = courseCode.slice(0, 2).toUpperCase() || "CN";
                      const rand = `${prefix}-${Math.floor(1000 + Math.random() * 9000).toString(36).toUpperCase().slice(0, 4)}`;
                      setCreateModal((p) => ({ ...p, secureCode: rand }));
                    }}
                    className="text-[11px] font-bold text-purple-600 hover:underline"
                  >
                    Generate New Code
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={createModal.secureCode}
                    onChange={(e) =>
                      setCreateModal((p) => ({ ...p, secureCode: e.target.value.toUpperCase() }))
                    }
                    placeholder="e.g. CN-9J2R"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 py-2.5 font-mono text-xs font-bold text-purple-700 focus:border-purple-600 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-purple-300"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                  <span>Students enter this passcode to join the proctored test environment.</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    👥 {state.enrolledStudents.length} Students Enrolled
                  </span>
                </div>
              </div>

              {/* Proctoring Settings */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    <span>Strict Proctoring Controls</span>
                  </label>
                  <span className="text-[11px] text-emerald-700 font-semibold">Active Monitoring</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300">
                      Max Tab Switches (0 = unltd)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={createModal.maxTabSwitches}
                      onChange={(e) => setCreateModal((p) => ({ ...p, maxTabSwitches: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-emerald-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="randomize_q"
                      checked={createModal.randomizeQuestions}
                      onChange={(e) => setCreateModal((p) => ({ ...p, randomizeQuestions: e.target.checked }))}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="randomize_q" className="text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
                      Shuffle Questions
                    </label>
                  </div>

                  <div className="flex items-center justify-between sm:justify-start gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="randomize_opt"
                      checked={createModal.randomizeOptions}
                      onChange={(e) => setCreateModal((p) => ({ ...p, randomizeOptions: e.target.checked }))}
                      className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="randomize_opt" className="text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer">
                      Shuffle Options
                    </label>
                  </div>
                </div>
              </div>

              {/* Viva Settings */}
              <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 font-bold text-purple-900 dark:text-purple-200">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span>AI Viva Voce Integration</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createModal.haveViva}
                      onChange={(e) => setCreateModal((p) => ({ ...p, haveViva: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {createModal.haveViva && (
                  <div className="flex items-center gap-3 pt-1">
                    <label className="text-xs font-semibold text-purple-900 dark:text-purple-300">
                      Viva Score Threshold (% to trigger viva):
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={createModal.vivaThreshold}
                      onChange={(e) => setCreateModal((p) => ({ ...p, vivaThreshold: Number(e.target.value) || 50 }))}
                      className="w-20 rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs font-bold text-purple-700 focus:border-purple-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-purple-300"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">% minimum</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3.5 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
              <button
                type="button"
                onClick={() => setCreateModal((prev) => ({ ...prev, open: false }))}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createModal.submitting}
                onClick={handleSaveNewTest}
                className="flex items-center gap-2 rounded-xl bg-color1 px-5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                {createModal.submitting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                <span>{createModal.submitting ? "Scheduling Assessment..." : "Save & Schedule Assessment"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(MCQTestExecution);
