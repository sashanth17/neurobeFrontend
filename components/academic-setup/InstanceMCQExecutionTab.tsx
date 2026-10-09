import { useEffect, useState, useMemo } from "react";
import {
  Sparkles,
  Search,
  BookOpen,
  Plus,
  Clock,
  Lock,
  Users,
  Calendar,
  AlertCircle,
  RefreshCw,
  Activity,
  Layers,
} from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.css";
import { Success, Failure, getAuthUser, useSetState } from "@/utils/function.utils";
import MCQTestExecutionCard, {
  MCQTestExecutionItem,
} from "@/components/academic-setup/MCQTestExecutionCard";
import PreviewQuestionsModal from "@/components/academic-setup/PreviewQuestionsModal";
import EditTestScheduleModal from "@/components/academic-setup/EditTestScheduleModal";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
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

interface InstanceMCQExecutionTabProps {
  instanceId: string | number;
  courseId?: string | number;
  instanceName?: string;
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

export default function InstanceMCQExecutionTab({
  instanceId,
  courseId: initialCourseId,
  instanceName,
}: InstanceMCQExecutionTabProps) {
  const [resolvedCourseId, setResolvedCourseId] = useState<number | null>(
    initialCourseId ? Number(initialCourseId) : null
  );
  const [courseInstance, setCourseInstance] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [tests, setTests] = useState<MCQTestExecutionItem[]>([]);
  const [questionSets, setQuestionSets] = useState<QuestionSetItem[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals
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
    testDate: "",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    secureCode: "",
    maxTabSwitches: 3,
    randomizeQuestions: false,
    randomizeOptions: false,
    haveViva: false,
    vivaThreshold: 50,
  });

  // 1. Resolve instance and courseId
  useEffect(() => {
    if (!instanceId) return;
    const fetchInstance = Models.course_instance?.detail
      ? Models.course_instance.detail(instanceId)
      : (Models.course_instance as any)?.get
      ? (Models.course_instance as any).get(instanceId)
      : Promise.reject(new Error("course_instance.detail not found"));

    fetchInstance
      .then((res: any) => {
        const inst = res?.data || res;
        setCourseInstance(inst);
        if (inst?.course_id) {
          setResolvedCourseId(Number(inst.course_id));
        }
      })
      .catch((err: any) => {
        console.error("Failed to fetch instance details:", err);
      });
  }, [instanceId]);

  // 2. Fetch tests, sets, and students
  const loadData = async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      const cid = resolvedCourseId;

      // 2a. Fetch Tests for this instance
      const testsRes: any = await (Models.mcq as any).list_tests({
        course_instance_id: Number(instanceId),
        course_id: cid || undefined,
      }).catch(() => []);

      let rawTests = Array.isArray(testsRes)
        ? testsRes
        : testsRes?.data ?? testsRes?.results ?? [];

      const formattedTests: MCQTestExecutionItem[] = rawTests.map((t: any) => {
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
        }

        const formatDateGB = (d: Date) => {
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        };

        return {
          id: t.test_id,
          testCode: t.test_code || `MCQ-T`,
          title: t.title || "MCQ Test",
          status,
          statusLabel,
          unitLabel: t.unit_name || "Assessment",
          questionsCount: t.question_count || 10,
          duration: `${t.duration_minutes || 30} Minutes`,
          testWindow:
            startT && endT
              ? `${startT.toLocaleDateString()} ${startT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – ${endT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Pending Schedule",
          isPendingWindow: !startT,
          topics: Array.isArray(t.topics) ? t.topics.join("; ") : t.topics || "",
          secureCode: t.secure_code,
          questionSetId: t.question_set_id,
          maxTabSwitches: t.max_tab_switches,
          randomizeQuestions: t.randomize_questions,
          randomizeOptions: t.randomize_options,
          haveViva: t.have_viva,
          rawTestDate: startT ? formatDateGB(startT) : undefined,
          rawStartTime: startT ? startT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : undefined,
          rawEndTime: endT ? endT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : undefined,
          testWindowStart: t.test_window_start,
          testWindowEnd: t.test_window_end,
        };
      });

      setTests(formattedTests);

      // 2b. Fetch Question Sets if courseId is available
      if (cid) {
        const setsRes: any = await Models.mcq.list_sets({ course_id: cid }).catch(() => []);
        let setsList = Array.isArray(setsRes)
          ? setsRes
          : setsRes?.items ?? setsRes?.sets ?? setsRes?.data ?? [];
        setQuestionSets(setsList);
      }

      // 2c. Fetch Enrolled Students for this instance
      const enrollRes: any = await Models.course_enrollment.list({
        course_instance_id: Number(instanceId),
      }).catch(() => []);
      let enrolledList = Array.isArray(enrollRes)
        ? enrollRes
        : enrollRes?.data ?? enrollRes?.items ?? [];
      setEnrolledStudents(enrolledList);
    } catch (err) {
      console.error("Error loading instance tests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [instanceId, resolvedCourseId]);

  // Open Create Test Modal
  const openCreateTest = () => {
    const codePrefix = courseInstance?.course_code || `SEC${instanceId}`;
    const randCode = `${codePrefix.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000).toString(36).toUpperCase().slice(0, 4)}`;
    const newTestNum = tests.length + 1;
    const defaultSet = questionSets[0];
    const initialUnit = defaultSet?.unit_number ? `Unit ${defaultSet.unit_number}` : "Unit 1";

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
      testCode: `MCQ-${codePrefix}-T${newTestNum}`,
      title: `${instanceName || `Section ${instanceId}`} — ${initialUnit} Assessment`,
      unitLabel: initialUnit,
      topics: (defaultSet as any)?.topics_included?.join(", ") || "",
      questionSetId: defaultSet?.id || "",
      questionsCount: (defaultSet as any)?.total_count || defaultSet?.total_questions || defaultSet?.questions?.length || 10,
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
    const cid = resolvedCourseId || courseInstance?.course_id;
    if (!cid) {
      Failure("Course ID could not be identified for this instance.");
      return;
    }

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
        const h24 = period?.toUpperCase() === "PM" ? (hh === 12 ? 12 : hh + 12) : hh === 12 ? 0 : hh;
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
      Failure("Test window end time must be in the future.");
      return;
    }

    const durationMins = parseInt(createModal.duration) || 30;
    const enrolledEmails = enrolledStudents.map((s: any) => s.email).filter(Boolean);

    const payload = {
      question_set_id: createModal.questionSetId,
      course_id: Number(cid),
      course_instance_id: Number(instanceId),
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
      Success(`MCQ Assessment "${createModal.title}" scheduled successfully for this instance!`);
      setCreateModal((prev) => ({ ...prev, open: false, submitting: false }));
      await loadData();
    } catch (err: any) {
      setCreateModal((prev) => ({ ...prev, submitting: false }));
      const errorMsg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to schedule test.";
      Failure(errorMsg);
    }
  };

  const handleUpdateSchedule = async (updatedData: any) => {
    if (!editModal.data) return;
    const testId = editModal.data.id;

    const parseDatetime = (dateStr: string, timeStr: string) => {
      try {
        const parts = dateStr.includes("/") ? dateStr.split("/").map(Number) : dateStr.split("-").map(Number);
        let day: number, month: number, year: number;
        if (parts[0] > 1000) [year, month, day] = parts;
        else [day, month, year] = parts;
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
      await loadData();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || err?.message || "Failed to update test schedule";
      Failure(errorMsg);
    }
  };

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.testCode.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        t.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [tests, search, statusFilter]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Top Action & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 border-b border-gray-100 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-850">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              MCQ Test Execution & Scheduling
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Instance #{instanceId} • {enrolledStudents.length} Students Enrolled • {tests.length} Assessment(s) Scheduled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={openCreateTest}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Assessment</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Search & Status Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 border-b border-gray-100 dark:border-gray-700">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search test by title or code..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                statusFilter === opt.value
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Test Cards List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm font-semibold">Loading instance assessments...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
            <BookOpen className="h-10 w-10 text-slate-400 mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No assessments found for this instance
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Click &quot;Schedule Assessment&quot; to pick an approved question set and schedule an MCQ test with proctoring for this section.
            </p>
            <button
              type="button"
              onClick={openCreateTest}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule Test Now</span>
            </button>
          </div>
        ) : (
          filteredTests.map((test) => (
            <MCQTestExecutionCard
              key={test.id}
              test={test}
              onPreviewQuestions={(t) => {
                let testQuestions = t.questions || [];
                if (testQuestions.length === 0 && t.questionSetId) {
                  const foundSet = questionSets.find((s) => s.id === t.questionSetId);
                  if (foundSet?.questions?.length) testQuestions = foundSet.questions;
                }
                setPreviewModal({
                  open: true,
                  title: t.title,
                  testCode: t.testCode,
                  unitLabel: t.unitLabel,
                  questions: testQuestions,
                });
              }}
              onEditSettings={(t) => setEditModal({ open: true, data: t })}
              onCancelTest={async (t) => {
                try {
                  await (Models.mcq as any).cancel_test(t.id);
                  Success(`Test "${t.title}" cancelled.`);
                  loadData();
                } catch {
                  Failure("Failed to cancel test.");
                }
              }}
              onDeleteTest={async (t) => {
                try {
                  await (Models.mcq as any).delete_test(t.id);
                  Success(`Test "${t.title}" deleted.`);
                  loadData();
                } catch {
                  Failure("Failed to delete test.");
                }
              }}
            />
          ))
        )}
      </div>

      {/* Schedule Assessment Modal */}
      {createModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Schedule Assessment for Section
                  </h3>
                  <p className="text-xs text-slate-400">
                    Host an MCQ test exclusively for Course Instance #{instanceId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModal((prev) => ({ ...prev, open: false }))}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Question Set Selection */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Question Set <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createModal.questionSetId}
                  onChange={(e) => {
                    const selSet = questionSets.find((s) => s.id === e.target.value);
                    setCreateModal((prev) => ({
                      ...prev,
                      questionSetId: e.target.value,
                      questionsCount: (selSet as any)?.total_count || selSet?.total_questions || selSet?.questions?.length || 10,
                      unitLabel: selSet?.unit_number ? `Unit ${selSet.unit_number}` : prev.unitLabel,
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="">-- Select Question Set from Course Pool --</option>
                  {questionSets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.total_questions || (s.questions || []).length || 10} Questions)
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Assessment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={createModal.title}
                  onChange={(e) => setCreateModal((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Test Code */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Test Code
                </label>
                <input
                  type="text"
                  value={createModal.testCode}
                  onChange={(e) => setCreateModal((prev) => ({ ...prev, testCode: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Passcode */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Passcode for Students <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={createModal.secureCode}
                  onChange={(e) => setCreateModal((prev) => ({ ...prev, secureCode: e.target.value.toUpperCase() }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 font-mono text-xs font-bold text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                />
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Duration
                </label>
                <select
                  value={createModal.duration}
                  onChange={(e) => setCreateModal((prev) => ({ ...prev, duration: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Date
                </label>
                <Flatpickr
                  value={createModal.testDate}
                  onChange={([d]) =>
                    d && setCreateModal((prev) => ({ ...prev, testDate: d.toLocaleDateString("en-GB") }))
                  }
                  options={{ dateFormat: "d/m/Y", minDate: "today" }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Start Time</label>
                  <Flatpickr
                    value={createModal.startTime}
                    onChange={([d]) => {
                      if (!d) return;
                      let hh = d.getHours();
                      const mm = d.getMinutes().toString().padStart(2, "0");
                      const period = hh >= 12 ? "PM" : "AM";
                      hh = hh % 12 || 12;
                      setCreateModal((prev) => ({ ...prev, startTime: `${hh.toString().padStart(2, "0")}:${mm} ${period}` }));
                    }}
                    options={{ enableTime: true, noCalendar: true, dateFormat: "h:i K" }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">End Time</label>
                  <Flatpickr
                    value={createModal.endTime}
                    onChange={([d]) => {
                      if (!d) return;
                      let hh = d.getHours();
                      const mm = d.getMinutes().toString().padStart(2, "0");
                      const period = hh >= 12 ? "PM" : "AM";
                      hh = hh % 12 || 12;
                      setCreateModal((prev) => ({ ...prev, endTime: `${hh.toString().padStart(2, "0")}:${mm} ${period}` }));
                    }}
                    options={{ enableTime: true, noCalendar: true, dateFormat: "h:i K" }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Checkboxes: Proctoring & Viva */}
            <div className="flex flex-wrap items-center gap-5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createModal.randomizeQuestions}
                  onChange={(e) => setCreateModal((prev) => ({ ...prev, randomizeQuestions: e.target.checked }))}
                  className="rounded text-indigo-600"
                />
                <span>Shuffle Questions</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createModal.randomizeOptions}
                  onChange={(e) => setCreateModal((prev) => ({ ...prev, randomizeOptions: e.target.checked }))}
                  className="rounded text-indigo-600"
                />
                <span>Shuffle Options</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createModal.haveViva}
                  onChange={(e) => setCreateModal((prev) => ({ ...prev, haveViva: e.target.checked }))}
                  className="rounded text-indigo-600"
                />
                <span>Enable AI Viva</span>
              </label>
            </div>

            {/* Submit & Cancel */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCreateModal((prev) => ({ ...prev, open: false }))}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveNewTest}
                disabled={createModal.submitting}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {createModal.submitting ? "Scheduling..." : "Schedule Assessment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editModal.open && editModal.data && (
        <EditTestScheduleModal
          open={editModal.open}
          onClose={() => setEditModal({ open: false, data: null })}
          testData={{
            ...editModal.data,
            testName: editModal.data.title,
          }}
          onSave={handleUpdateSchedule}
        />
      )}

      {/* Preview Questions Modal */}
      {previewModal.open && (
        <PreviewQuestionsModal
          open={previewModal.open}
          onClose={() => setPreviewModal((prev) => ({ ...prev, open: false }))}
          testTitle={previewModal.title}
          testCode={previewModal.testCode}
          unitLabel={previewModal.unitLabel}
          questions={previewModal.questions}
        />
      )}
    </div>
  );
}
