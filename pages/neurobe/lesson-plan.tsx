import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import {
  Hourglass,
  Check,
  ClipboardCheck,
  Sparkles,
  Save,
  EditIcon,
  ClipboardList,
  RotateCw,
} from "lucide-react";
import {
  Dropdown,
  Success,
  Failure,
  useSetState,
  isLimitExhaustion,
  showLimitExhaustedModal,
  LIMIT_EXHAUSTED_MESSAGE,
  getErrorMessage,
} from "@/utils/function.utils";
import TableComponent from "@/components/common-components/TableComponent";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import StepHeader from "@/components/academic-setup/StepHeader";
import StatTabCard from "@/components/academic-setup/StatTabCard";
import TableTitle from "@/components/common-components/TableTitle";
import GenericTabs from "@/components/common-components/GenericTabs";
import AccordiansStyle from "@/components/common-components/AccordiansStyle";
import PageFooter from "@/components/common-components/PageFooter";
import EditLessonPlanModal, { LessonPlanEditData } from "@/components/lesson-plan/EditLessonPlanModal";
import ReviewLessonItemModal, { ReviewLessonItemData } from "@/components/lesson-plan/ReviewLessonItemModal";
import { useRouter } from "next/router";
import { UNIT_TABS } from "@/utils/constant.utils";
import PageHeader from "@/components/common-components/PageHeader";
import StageVersionHistoryPanel from "@/components/academic-setup/StageVersionHistoryPanel";
import { useSearchParams } from "next/navigation";
import Models from "@/imports/models.import";
import GenericTabsData from "@/components/common-components/GenericTabsData";




const RAW_UNIT_DATA: Record<
  string,
  {
    title: string;
    totalHours: number;
    topics: {
      id: string;
      seq: number;
      title: string;
      level: string;
      hours: string;
      textbook: string;
      reference: string;
      pedagogy: string;
      status: "Reviewed" | "Needs Review";
    }[];
  }
> = {
  "unit-1": {
    title: "Unit 1 — Physical Layer & Network Architectures",
    totalHours: 9,
    topics: [
      {
        id: "1.1", seq: 1,
        title: "Network Models & Layered Architecture",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networks — Chapter 1",
        reference: "Data Communications and Networking — Chapter 2",
        pedagogy: "Concept Exploration",
        status: "Reviewed",
      },
      {
        id: "1.2", seq: 2,
        title: "Physical Layer & Transmission Media",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networks — Chapter 2",
        reference: "Data Communications and Networking — Chapter 3",
        pedagogy: "Guided Discussion",
        status: "Needs Review",
      },
      {
        id: "1.3", seq: 3,
        title: "Network Topologies & Switching Techniques",
        level: "K2", hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 2",
        reference: "Data Communications and Networking — Chapter 8",
        pedagogy: "Concept Exploration",
        status: "Needs Review",
      },
      {
        id: "1.4", seq: 4,
        title: "Network Performance Metrics",
        level: "K3", hours: "2.5 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 1",
        reference: "Computer Networks: A Systems Approach — Chapter 1",
        pedagogy: "Problem-Based Learning",
        status: "Needs Review",
      },
    ],
  },
  "unit-2": {
    title: "Unit 2 — Data Link Layer & Error Control",
    totalHours: 7,
    topics: [
      {
        id: "2.1", seq: 1,
        title: "Framing & Error Detection",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networks — Chapter 3",
        reference: "Data Communications and Networking — Chapter 10",
        pedagogy: "Concept Exploration",
        status: "Needs Review",
      },
      {
        id: "2.2", seq: 2,
        title: "Flow Control Protocols",
        level: "K3", hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 3",
        reference: "Data Communications and Networking — Chapter 11",
        pedagogy: "Problem-Based Learning",
        status: "Needs Review",
      },
      {
        id: "2.3", seq: 3,
        title: "MAC Protocols & CSMA/CD",
        level: "K3", hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 4",
        reference: "Computer Networking: A Top-Down Approach — Chapter 5",
        pedagogy: "Simulation Lab",
        status: "Needs Review",
      },
    ],
  },
  "unit-3": {
    title: "Unit 3 — Network Layer & Routing",
    totalHours: 10,
    topics: [
      {
        id: "3.1", seq: 1,
        title: "IP Addressing & Subnetting",
        level: "K3", hours: "3 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Computer Networking: A Top-Down Approach — Chapter 4",
        pedagogy: "Hands-on Lab",
        status: "Needs Review",
      },
      {
        id: "3.2", seq: 2,
        title: "Routing Algorithms",
        level: "K4", hours: "3 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Data Communications and Networking — Chapter 14",
        pedagogy: "Case Study Analysis",
        status: "Needs Review",
      },
      {
        id: "3.3", seq: 3,
        title: "IPv6 & Transition Mechanisms",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Computer Networking: A Top-Down Approach — Chapter 4",
        pedagogy: "Flipped Classroom",
        status: "Needs Review",
      },
      {
        id: "3.4", seq: 4,
        title: "ICMP & Network Diagnostics",
        level: "K3", hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 4",
        reference: "Computer Networks: A Systems Approach — Chapter 3",
        pedagogy: "Guided Discussion",
        status: "Needs Review",
      },
    ],
  },
  "unit-4": {
    title: "Unit 4 — Transport Layer & TCP/UDP",
    totalHours: 8,
    topics: [
      {
        id: "4.1", seq: 1,
        title: "TCP Connection Management",
        level: "K3", hours: "3 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 3",
        reference: "Computer Networks — Chapter 6",
        pedagogy: "Demonstration",
        status: "Needs Review",
      },
      {
        id: "4.2", seq: 2,
        title: "UDP & Real-time Applications",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 3",
        reference: "Data Communications and Networking — Chapter 23",
        pedagogy: "Comparative Analysis",
        status: "Needs Review",
      },
      {
        id: "4.3", seq: 3,
        title: "Congestion Control Mechanisms",
        level: "K4", hours: "3 Hours",
        textbook: "Computer Networks — Chapter 6",
        reference: "Computer Networking: A Top-Down Approach — Chapter 3",
        pedagogy: "Problem-Based Learning",
        status: "Needs Review",
      },
    ],
  },
  "unit-5": {
    title: "Unit 5 — Application Layer & Security",
    totalHours: 7,
    topics: [
      {
        id: "5.1", seq: 1,
        title: "DNS & HTTP Protocols",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 2",
        reference: "Computer Networks — Chapter 7",
        pedagogy: "Interactive Demo",
        status: "Needs Review",
      },
      {
        id: "5.2", seq: 2,
        title: "Email & FTP Protocols",
        level: "K2", hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 2",
        reference: "Data Communications and Networking — Chapter 26",
        pedagogy: "Concept Exploration",
        status: "Needs Review",
      },
      {
        id: "5.3", seq: 3,
        title: "Network Security Fundamentals",
        level: "K3", hours: "3 Hours",
        textbook: "Computer Networks — Chapter 8",
        reference: "Computer Networking: A Top-Down Approach — Chapter 8",
        pedagogy: "Guest Lecture",
        status: "Needs Review",
      },
    ],
  },
};



const totalTopics = UNIT_TABS.reduce((a, b) => a + b.count, 0);
const totalUnits = UNIT_TABS.length;
const totalRecs = Object.values(RAW_UNIT_DATA).reduce(
  (s, u) => s + u.topics.length,
  0,
);

const LessonPlan = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const course_id = searchParams.get("course_id");
  const fromParam = searchParams.get("from");
  console.log("course_id", course_id);

  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const completedJobsRef = useRef<Set<string>>(new Set());
  const pollingJobIdRef = useRef<string | number | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollingJobIdRef.current = null;
  };

  useEffect(() => () => stopPolling(), []);

  const [state, setState] = useSetState({
    search: "",
    unitFilter: "all",
    statusFilter: "all",
    loading: false,
    activeTab: "unit-1",
    activeBannerTab: "coordinator",
    lession_data: null,
    matrix: [],
    generateLoading: false,
    generatedResponse: null,
    lessonApproved: false,
    versionRefreshKey: Date.now(),
    upstreamNotApproved: false,
    approvingLesson: false,
    savingDraft: false,
    versionsLoaded: false,
    hasVersions: false,
  });
  const [loadedVersion, setLoadedVersion] = useState<number | null>(null);

  useEffect(() => {
    dispatch(setPageTitle("Lesson Plan"));
  }, [dispatch]);

  useEffect(() => {
    if (course_id) {
      course_data();
      coordinator_course_data();
      restoreWorkflowState(course_id);
    }
  }, [course_id]);

  const getSyllabusId = () => {
    return (
      state.courseData?.latest_syllabus?.id ||
      state.courseData?.syllabus_id ||
      state.lession_data?.syllabus_id ||
      state.lession_data?.selected_unit?.syllabus_id ||
      course_id
    );
  };

  const restoreWorkflowState = async (cid: string | number) => {
    try {
      const wfRes: any = await Models.syllabus.get_workflow_status(cid);
      const pedStep = wfRes?.workflow?.step_4_pedagogy_generation;
      const isPedagogyApproved = pedStep?.status === "approved";
      setState({ upstreamNotApproved: !isPedagogyApproved });

      const lpStep = wfRes?.workflow?.step_5_lesson_plan_schedules;
      if (!lpStep) return;

      const { status, job_id, active_version, total_versions } = lpStep;
      if (status === "redis_queued" || status === "generating") {
        setState({ generateLoading: true });
        startPolling(cid, job_id);
      } else if (status === "approved") {
        setState({ lessonApproved: true, recommendationsGenerated: true, generateLoading: false });
      } else if (status === "draft") {
        const hasVer = Boolean(active_version || (total_versions && total_versions > 0));
        setState({ recommendationsGenerated: hasVer, generateLoading: false });
      } else if (status === "failed" || status === "not_started") {
        setState({ generateLoading: false });
      }
    } catch (err) {
      console.warn("restoreWorkflowState in lesson-plan error:", err);
    }
  };

  const handleApproveLessonPlan = async () => {
    const sid = getSyllabusId();
    if (state.upstreamNotApproved) {
      Failure("Cannot approve lesson plan: Pedagogy recommendations must be approved first.");
      return;
    }
    try {
      setState({ approvingLesson: true });
      try {
        await Models.lession_plan.approve_schedule(sid);
      } catch (err) {
        console.warn("approve_schedule fallback:", err);
        await Models.lession_plan.approve(sid);
      }
      try {
        await Models.syllabus.approve_stage(course_id || sid, "schedule", loadedVersion ?? undefined);
      } catch (e) {
        console.warn("approve_stage schedule warning:", e);
      }
      Success("Lesson plan review completed successfully");
      setState({ lessonApproved: true, versionRefreshKey: Date.now() });
      if (course_id) {
        await restoreWorkflowState(course_id);
      }
      if (sid) {
        const activeUnitNum = parseInt(state.activeTab?.split("-")[1] || "1", 10) || 1;
        await lession_data(sid, activeUnitNum, loadedVersion ?? undefined);
      }
    } catch (error: any) {
      console.log("Approve error:", error);
      Failure(typeof error === "string" ? error : error?.message || "Failed to approve lesson plan");
    } finally {
      setState({ approvingLesson: false });
    }
  };

  const handleSaveDraft = async () => {
    const sid = getSyllabusId();
    try {
      setState({ savingDraft: true });
      const res: any = await Models.lession_plan.draft(sid);
      Success(res?.message || "Draft saved successfully");
    } catch (error: any) {
      console.log("Draft save error:", error);
      Failure(typeof error === "string" ? error : error?.message || "Failed to save draft");
    } finally {
      setState({ savingDraft: false });
    }
  };

  const lession_data = async (syllabus_id: any, unit: any, verNum?: number) => {
    if (!syllabus_id) return;
    try {
      const vToUse = verNum !== undefined ? verNum : loadedVersion;
      const res: any = await Models.lession_plan.detail(syllabus_id, unit, vToUse);
      const isApproved = res?.overall_approval_status === "Approved" || res?.workspace_status === "Approved";
      
      const vListVersion = res?.version ? Number(res.version) : (res?.active_version ? Number(res.active_version) : null);
      if (verNum !== undefined && verNum !== null) {
        setLoadedVersion(verNum);
      } else if (vListVersion && loadedVersion === null) {
        setLoadedVersion(vListVersion);
      }

      const hasActiveVersion = Boolean(
        verNum !== undefined ||
        loadedVersion !== null ||
        (res?.version && Number(res.version) > 0) ||
        res?.active_version ||
        res?.is_generated
      );

      const hasSessions = Boolean(res?.selected_unit?.sessions && res.selected_unit.sessions.length > 0);
      const isGen = Boolean(
        hasSessions ||
        res?.is_generated ||
        isApproved ||
        res?.workspace_status === "Ready" ||
        res?.workspace_status === "Review Required" ||
        res?.workspace_status === "Approved"
      );
      if (isGen) {
        setState({ recommendationsGenerated: true });
      }

      if (isApproved) {
        setState({ lessonApproved: true });
      }

      const topicsCount =
        res?.metrics?.topics?.value ??
        res?.summary?.total_topics ??
        res?.total_topics ??
        0;

      const contactHours =
        res?.metrics?.contact_hours?.value ??
        res?.metrics?.contact_hours?.display ??
        res?.total_hours ??
        45;

      const scheduleStatus =
        isApproved
          ? "Approved"
          : (isGen
            ? "Ready"
            : (res?.workspace_status || res?.overall_approval_status || "Not Started"));

      const data = [{
        key: "total-topics",
        label: "Total Topics",
        count: topicsCount,
        subLabel: "Curriculum topic count",
        icon: <Check className="h-5 w-5" />,
      },
      {
        key: "total-hours",
        label: "Total Hours",
        subLabel: "Allocated semester teaching time",
        count: contactHours,
        icon: <Hourglass className="h-5 w-5" />,
      },
      {
        key: "status",
        label: "Schedule Status",
        subLabel: "Milestone status",
        count: scheduleStatus,
        icon: <ClipboardCheck className="h-5 w-5" />,
      }];
      setState({ lession_data: res, matrix: data });

    } catch (error) {
      console.log("error", error);
    }
  };

  const course_data = async () => {
    if (!course_id) return;
    try {
      const res: any = await Models.course.detail(course_id);
      setState({ courseData: res });
      console.log("course detail →", res);
      const sid = res?.latest_syllabus?.id || res?.syllabus_id;
      if (sid) {
        lession_data(sid, 1);
      }

    } catch (error) {
      console.log("error", error);
    }
  };
 

  const coordinator_course_data = async () => {
    try {
      const user = localStorage.getItem("user")
      const u = JSON.parse(user);
      const body = {
        coordinator_id: u?.id
      }
      const res = await Models.course.list(body);
      const dropdown = Dropdown(res, "course_code")
      // setState({ courseData: res });
      console.log("coordinator_course_data detail →", dropdown);
      setState({ course_list: dropdown })
    } catch (error) {
      console.log("error", error);
    }
  };


  const raw = RAW_UNIT_DATA[state.activeTab];

  // modal state
  const [editModal, setEditModal] = useState<{
    open: boolean;
    data: LessonPlanEditData | null;
  }>({ open: false, data: null });

  const [reviewModal, setReviewModal] = useState<{
    open: boolean;
    data: ReviewLessonItemData | null;
    unitKey: string;
    topicId: string;
  }>({ open: false, data: null, unitKey: "", topicId: "" });

  // ── Per-unit reviewed topic tracking ──────────────────────────────────────
  // Pre-seed with topics that already have status "Reviewed" in RAW_UNIT_DATA
  const [reviewedMap, setReviewedMap] = useState<Record<string, Set<string>>>(
    () =>
      Object.fromEntries(
        Object.entries(RAW_UNIT_DATA).map(([unitKey, unit]) => [
          unitKey,
          new Set(
            unit.topics
              .filter((t) => t.status === "Reviewed")
              .map((t) => t.id),
          ),
        ]),
      ),
  );

  const totalTopicCount = Object.values(RAW_UNIT_DATA).reduce(
    (s, u) => s + u.topics.length,
    0,
  );
  const totalReviewedCount = Object.values(reviewedMap).reduce(
    (s, set) => s + set.size,
    0,
  );
  const allReviewed = totalReviewedCount >= totalTopicCount;

  const markReviewed = (unitKey: string, topicId: string) => {
    setReviewedMap((prev) => {
      const next = new Set<string>(prev[unitKey] ?? new Set<string>());
      next.add(topicId);
      return { ...prev, [unitKey]: next };
    });
  };

  // ── Pre-generate: topics list for the accordion (level + hours badges only) ──
  const buildInitialTopics = () => {
    if (state?.lession_data?.selected_unit?.sessions?.length) {
      return state.lession_data.selected_unit.sessions.map((session: any) => ({
        id: session.slot_id || session.id,
        title: session.topic_name ? `Topic ${session.topic_code || session.seq || ''} — ${session.topic_name}` : (session.title || ""),
        collapsedBadge: [
          { label: `Knowledge Level ${session.level || 'K2'}`, className: "bg-color2-l text-color2 font-bold" },
          { label: session.hours_display || `${session.hours || 2} Hours`, className: "bg-gray-200 text-pri font-bold" },
        ],
        items: [],
      }));
    }
    const currentUnitTopics = state?.lession_data?.selected_unit?.topics || [];
    if (currentUnitTopics.length > 0) {
      return currentUnitTopics.map((t: any) => ({
        id: t.id,
        title: `${t.code || t.topic_code || ''} — ${t.title || t.topic_name || ''}`,
        collapsedBadge: [
          { label: `Knowledge Level ${t.bloom_level || t.knowledge_level || 'K2'}`, className: "bg-color2-l text-color2 font-bold" },
          { label: `${t.hours || 2} Hours`, className: "bg-gray-200 text-pri font-bold" },
        ],
        items: [],
      }));
    }
    return [];
  };

  // ── Generated: flat table columns matching the screenshot ──
  const lessonPlanColumns = [
    {
      accessor: "seq",
      title: "SEQ",
      render: ({ seq }: any) => (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-color2">
          {String(seq).padStart(2, "0")}
        </span>
      ),
    },
    {
      accessor: "title",
      title: "TOPIC",
      render: ({ title, id }: any) => (
        <div>
          <p className="font-semibold text-[#000] dark:text-white">{title}</p>
          <p className="mt-0.5 text-xs text-[#000]">Topic {id}</p>
        </div>
      ),
    },
    {
      accessor: "level",
      title: "LEVEL",
      render: ({ level }: any) => (
        <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-[#000]">
          {level}
        </span>
      ),
    },
    {
      accessor: "textbook",
      title: "BOOKS & REFERENCES",
      render: ({ textbook, reference }: any) => (
        <div className="min-w-0">
          <p className="text-xs text-[#000]">
            <span className="font-semibold">Textbook:</span> {textbook}
          </p>
          <p className="mt-0.5 text-xs text-[#000]">
            <span className="font-semibold">Reference:</span> {reference}
          </p>
        </div>
      ),
    },
    {
      accessor: "hours",
      title: "HOURS",
      render: ({ hours }: any) => (
        <span className="text-xs font-semibold text-[#000]">{hours}</span>
      ),
    },
    {
      accessor: "pedagogy",
      title: "PEDAGOGY",
      render: ({ pedagogy }: any) => (
        <span className="text-xs font-semibold text-color2">{pedagogy}</span>
      ),
    },
    {
      accessor: "status",
      title: "STATUS",
      render: ({ status, status_display }: any) => {
        const isApproved =
          state.lessonApproved ||
          status === "Approved" ||
          status === "Reviewed" ||
          (status_display && status_display.includes("Approved"));

        return isApproved ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            Approved <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            {status_display || status || "Scheduled"}
          </span>
        );
      },
    },
    {
      accessor: "id",
      title: "EDIT",
      render: ({ title, id, topic_id, seq, level, hours, textbook, reference, pedagogy, status, subtopic }: any) => (
        <button
          type="button"
          onClick={() =>
            setEditModal({
              open: true,
              data: {
                id: String(id),
                topic_id: topic_id || id,
                seq,
                title,
                subtopic: subtopic || "",
                level,
                hours: String(hours || "1 Hour"),
                textbook: textbook || "",
                reference: reference || "",
                pedagogy: pedagogy || "",
                status: status === "Reviewed" || status === "Approved" ? "Reviewed" : "Needs Review",
                unitLabel: state?.lession_data?.selected_unit?.unit_title || raw?.title || "",
              },
            })
          }
          className="flex items-center gap-1 text-xs font-semibold text-pri hover:text-color2"
        >
          <EditIcon className="h-3.5 w-3.5" /> Edit
        </button>
      ),
    },
  ];

  const startPolling = (cid: string | number, jobId?: string) => {
    stopPolling();
    setState({ generateLoading: true });

    let attempts = 0;
    const maxAttempts = 100; // 100 attempts at 3s = 5 minutes timeout
    const pollInterval = 3000; // 3 seconds interval for responsive status updates

    const checkScheduleStatus = async () => {
      attempts++;
      try {
        const wfRes: any = await Models.syllabus.get_workflow_status(cid);
        const lpStep = wfRes?.workflow?.step_5_lesson_plan_schedules;
        const currentStatus = lpStep?.status;
        const currentJobId = lpStep?.job_id;

        // If we enqueued a specific new job, don't exit early on stale status from an older job
        if (jobId && currentJobId && currentJobId !== jobId && (currentStatus === "draft" || currentStatus === "approved")) {
          if (attempts < 5) return;
        }

        if (currentStatus === "draft" || currentStatus === "approved") {
          stopPolling();
          setState({
            generateLoading: false,
            lessonApproved: currentStatus === "approved",
            recommendationsGenerated: true,
            versionRefreshKey: Date.now(),
          });
          const sid = getSyllabusId();
          if (sid) {
            const activeUnitNum = parseInt(state.activeTab?.split("-")[1] || "1", 10) || 1;
            await lession_data(sid, activeUnitNum);
          }
          Success("Lesson plan generated successfully with NEURO AI!");
        } else if (currentStatus === "failed") {
          stopPolling();
          setState({ generateLoading: false, versionRefreshKey: Date.now() });
          const errDetail =
            lpStep?.error ||
            wfRes?.error ||
            "";
          if (lpStep?.is_limit_exhausted || isLimitExhaustion(errDetail) || isLimitExhaustion(wfRes)) {
            showLimitExhaustedModal(errDetail);
            Failure(LIMIT_EXHAUSTED_MESSAGE);
          } else {
            Failure("Lesson plan generation failed. Please try again.");
          }
        } else if (attempts >= maxAttempts) {
          stopPolling();
          setState({ generateLoading: false, versionRefreshKey: Date.now() });
          const sid = getSyllabusId();
          if (sid) {
            const activeUnitNum = parseInt(state.activeTab?.split("-")[1] || "1", 10) || 1;
            await lession_data(sid, activeUnitNum);
          }
        }
      } catch (pollErr) {
        console.warn("Lesson plan polling error:", pollErr);
        if (attempts >= maxAttempts) {
          stopPolling();
          setState({ generateLoading: false, versionRefreshKey: Date.now() });
        }
      }
    };

    // First check after 1.5s so backend has registered the enqueued job
    setTimeout(checkScheduleStatus, 1500);
    pollRef.current = setInterval(checkScheduleStatus, pollInterval);
  };

  const generateLessionPlan = async (parentParams?: {
    hierarchy_version?: number;
    pedagogy_version?: number;
  }) => {
    try {
      setState({ generateLoading: true });
      const syllabusId = state.courseData?.latest_syllabus?.id || course_id;
      if (!syllabusId) {
        Failure("Syllabus ID not found.");
        setState({ generateLoading: false });
        return;
      }

      // Post the generation job with parent versions
      const res: any = await Models.lession_plan.generate_timeline(syllabusId, {
        hierarchy_version: parentParams?.hierarchy_version,
        pedagogy_version: parentParams?.pedagogy_version,
      });
      console.log("generate_timeline response:", res);

      Success("Lesson plan generation started with NEURO AI!");
      startPolling(course_id || syllabusId, res?.job_id);
    } catch (error: any) {
      console.log("Generate error:", error);
      setState({ generateLoading: false });
      if (isLimitExhaustion(error)) {
        showLimitExhaustedModal(error?.response?.data?.detail || error?.message);
        Failure(LIMIT_EXHAUSTED_MESSAGE);
      } else {
        Failure(getErrorMessage(error, "Error generating lesson plan."));
      }
    }
  };

  const handleVersionActivated = async (newVer: number) => {
    setLoadedVersion(newVer);
    setState({ recommendationsGenerated: true, versionRefreshKey: Date.now() });
    const syllabusId = getSyllabusId();
    if (syllabusId) {
      const activeUnitNum = parseInt(state.activeTab?.split("-")[1] || "1", 10) || 1;
      await lession_data(syllabusId, activeUnitNum, newVer);
    }
  };

  const handleVersionLoad = async (ver: number) => {
    setLoadedVersion(ver);
    setState({ recommendationsGenerated: true });
    const syllabusId = getSyllabusId();
    if (syllabusId) {
      const activeUnitNum = parseInt(state.activeTab?.split("-")[1] || "1", 10) || 1;
      await lession_data(syllabusId, activeUnitNum, ver);
    }
  };

  const hasSessions = Boolean(
    state?.lession_data?.selected_unit?.sessions &&
    state.lession_data.selected_unit.sessions.length > 0
  );

  return (
    <div className="min-h-screen">
      <CourseBanner
        courseCode={state.courseData?.course_code || state.lession_data?.course_code || ""}
        courseTitle={state.courseData?.course_title || state.lession_data?.course_title || ""}
        description="Coordinator View — Academic course preparation, syllabus, outcomes mapping, lesson plans, question banking, and CIA paper generation."
        programme={state.courseData?.programme || state.lession_data?.programme || ""}
        batch={state.courseData?.batch_name || state.courseData?.batch || state.lession_data?.batch || ""}
        academicYear={state.courseData?.academic_year || state.courseData?.academic_year_term || state.lession_data?.academic_year_term || ""}
        students={`${state.courseData?.students_count ?? state.courseData?.student_count ?? state.lession_data?.student_count ?? 0} Students`}
        selectedCourse={state.courseData?.course_code || state.lession_data?.course_code || ""}
        courseOptions={state.course_list}
        onCourseChange={(val) => console.log("course", val)}
        activeView={state.activeTab}
        onBack={() => {
          if (fromParam === "my-courses") {
            router.push("/neurobe/my-assigned-courses");
          } else {
            router.back();
          }
        }}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      <PageHeader
        title="Lesson Plan"
        records={`${state.courseData?.course_code || state.lession_data?.course_code || ""} - ${state.courseData?.course_title || state.lession_data?.course_title || ""}`}
        subtitle="Create a teaching plan using the approved topics, books, hours, and pedagogies."
        icon={<ClipboardList className="h-5 w-5 text-color2" />}
      />

      {/* ── Stat cards — only when versions exist ── */}
      {state.hasVersions && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {state.matrix?.map((tab) => (
            <StatTabCard
              key={tab.key}
              icon={tab.icon}
              label={tab.label}
              subLabel={tab.subLabel}
              count={tab.count}
              active={state.activeTab === tab.key}
            />
          ))}
        </div>
      )}

      {/* ── Empty state OR full content ── */}
      {state.generateLoading ? (
        <div className="panel flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/30 dark:border-indigo-800/40 dark:bg-indigo-950/20">
          <RotateCw className="h-10 w-10 text-indigo-600 mb-3 animate-spin dark:text-indigo-400" />
          <h4 className="text-base font-bold text-gray-900 dark:text-white">NEURO AI Lesson Plan Generation in Progress</h4>
          <p className="mt-1 text-sm text-gray-500 max-w-md">Sequencing topics, assigning textbook chapters, calibrating session hours, and linking pedagogy methods...</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
            <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
            Status: Processing in AI Worker Queue
          </div>
        </div>
      ) : !state.hasVersions && !state.generateLoading ? (
        <div className="panel flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30">
          <Sparkles className="h-12 w-12 text-indigo-500 mb-4 animate-pulse" />
          <h4 className="text-base font-bold text-gray-900 dark:text-white">No Lesson Plan Generated Yet</h4>
          <p className="mt-2 text-sm text-gray-500 max-w-sm">
            Use the version panel above to generate a session-by-session lesson plan from the approved topics, books, hours, and pedagogies.
          </p>
          <button
            type="button"
            onClick={() => generateLessionPlan()}
            disabled={state.generateLoading || state.upstreamNotApproved}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Generate Lesson Plan
          </button>
        </div>
      ) : state.hasVersions ? (
        <div className="mt-4">
          <TableTitle
            title={hasSessions ? "Generated Lesson Plan & Schedules" : "Topics from Approved Syllabus"}
            label={`${state?.lession_data?.unit_tabs?.length || 5} Units`}
            subLabel={`${hasSessions ? (state?.lession_data?.selected_unit?.sessions?.length ?? 0) : (state?.lession_data?.selected_unit?.topics_count ?? state?.lession_data?.selected_unit?.topics?.length ?? 0)} ${hasSessions ? "Sessions" : "Topics"}`}
          />

          <div className="mt-4">
            <GenericTabsData
              tabs={
                state?.lession_data?.unit_tabs?.map((unit: any) => ({
                  key: `unit-${unit.unit_number}`,
                  label: `Unit ${unit.unit_number}`,
                })) || [
                  { key: "unit-1", label: "Unit 1" },
                  { key: "unit-2", label: "Unit 2" },
                  { key: "unit-3", label: "Unit 3" },
                  { key: "unit-4", label: "Unit 4" },
                  { key: "unit-5", label: "Unit 5" },
                ]
              }
              activeKey={state.activeTab}
              onChange={(unit) => {
                setState({ activeTab: unit as string });
                const unitNumber = parseInt((unit as string).split("-")[1], 10) || 1;
                lession_data(getSyllabusId(), unitNumber, loadedVersion ?? undefined);
              }}
            />

            {hasSessions ? (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 mb-5">
                <div className="flex items-center justify-between bg-[#111238] px-4 py-3 text-white">
                  <div>
                    <h3 className="text-lg font-bold">{state?.lession_data?.selected_unit?.unit_title}</h3>
                    <p className="mt-0.5 text-sm text-white/70">
                      {state?.lession_data?.selected_unit?.subtitle}
                    </p>
                  </div>
                  <span className="rounded bg-white/15 px-4 py-1 text-sm font-semibold">
                    {state?.lession_data?.selected_unit?.hours_badge}
                  </span>
                </div>
                <TableComponent
                  records={state?.lession_data?.selected_unit?.sessions?.map((session: any) => ({
                    id: session.slot_id,
                    slot_id: session.slot_id,
                    topic_id: session.topic_id,
                    seq: session.seq,
                    title: session.topic_name,
                    subtopic: session.subtopic || "",
                    level: session.level,
                    textbook: session.textbook,
                    reference: session.reference_book,
                    hours: session.hours_display || (session.hours ? `${session.hours} Hour${Number(session.hours) > 1 ? 's' : ''}` : "1 Hour"),
                    pedagogy: session.pedagogy,
                    status: session.status || session.status_display || "Scheduled",
                    status_display: session.status_display || session.status || "Scheduled",
                    status_badge: session.status_badge,
                  })) ?? []}
                  columns={lessonPlanColumns}
                />
              </div>
            ) : (
              <AccordiansStyle
                expandable={false}
                topics={buildInitialTopics()}
                title={state?.lession_data?.selected_unit?.unit_title || "Unit 1 — Approved Topics"}
                subtitle={state?.lession_data?.selected_unit?.subtitle || "Approved topic sequencing and teaching methods"}
                topicCount={state?.lession_data?.selected_unit?.topics_count || state?.lession_data?.selected_unit?.topics?.length}
                footerContent={
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse flex-shrink-0" />
                      <span>NEURO AI will sequence all topics, assign textbook chapters, calibrate session hours, and link pedagogy methods.</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => generateLessionPlan()}
                      disabled={state.generateLoading}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50 flex-shrink-0"
                    >
                      {state.generateLoading ? (
                        <>
                          <RotateCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Generate Lesson Plan with NEURO AI</span>
                        </>
                      )}
                    </button>
                  </div>
                }
              />
            )}
          </div>

          {hasSessions ? (
            <PageFooter
              content1={`Unit Topics: ${state?.lession_data?.selected_unit?.topics_count ?? 0}`}
              content2={`Course: ${state.courseData?.course_code || state.lession_data?.course_code || ""} - ${state.courseData?.course_title || state.lession_data?.course_title || ""}`}
              batch
              actionBtn1={
                state.lessonApproved
                  ? {
                    label: "Next: Learning Material",
                    icon: <Check className="h-4 w-4" />,
                    onClick: () => router.push(course_id ? `/neurobe/learning-materials?course_id=${course_id}` : "/neurobe/learning-materials"),
                    className: "create-btn",
                  }
                  : {
                    label: state.approvingLesson
                      ? "Approving..."
                      : state.upstreamNotApproved
                      ? "Requires Pedagogy Approval"
                      : "Approve Lesson Plan",
                    icon: state.approvingLesson ? <RotateCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />,
                    onClick: handleApproveLessonPlan,
                    disabled: state.approvingLesson || state.upstreamNotApproved,
                  }
              }
              actionBtn2={{
                label: state.savingDraft ? "Saving..." : "Save Draft",
                icon: <Save className="h-4 w-4" />,
                onClick: handleSaveDraft,
                disabled: state.savingDraft,
              }}
            />
          ) : (
            <PageFooter
              content1={`Curriculum: ${state?.lession_data?.summary?.total_topics ?? state?.lession_data?.metrics?.topics?.value ?? 28} Topics across ${state?.lession_data?.unit_tabs?.length ?? 5} Units`}
              content2={`Course: ${state.courseData?.course_code || state.lession_data?.course_code || ""} - ${state.courseData?.course_title || state.lession_data?.course_title || ""}`}
              actionBtn1={{
                label: state.generateLoading ? "Generating..." : "Generate Lesson Plan with NEURO AI",
                icon: state.generateLoading ? null : <Sparkles className="h-4 w-4" />,
                onClick: () => generateLessionPlan(),
                className: "create-btn",
                disabled: state.generateLoading,
              }}
            />
          )}
        </div>
      ) : null}

      {/* Avoided generation popup modal per user requirement */}

      <EditLessonPlanModal
        open={editModal.open}
        onClose={() => setEditModal((p) => ({ ...p, open: false }))}
        data={editModal.data}
        onSave={async (updated) => {
          try {
            const targetTopicId = updated.topic_id || updated.id;
            await Models.lession_plan.update_topics(targetTopicId, {
              topic_name: updated.title,
              seq: updated.seq,
              level: updated.level,
              hours: `${updated.hours}`.replace(" Hours", ""),
              status: updated.status,
              textbook: updated.textbook,
              reference_book: updated.reference,
              pedagogy: updated.pedagogy,
              subtopic: updated.subtopic,
            }, loadedVersion ?? undefined);
            Success("Lesson plan item updated successfully!");
            // Refresh the data
            const sid = getSyllabusId();
            if (sid) {
              const activeUnitNum = parseInt(state.activeTab.split('-')[1], 10) || 1;
              await lession_data(sid, activeUnitNum, loadedVersion ?? undefined);
            }
          } catch (error: any) {
            console.log("Update topic error:", error);
            Failure(typeof error === "string" ? error : error?.message || "Failed to update lesson plan item");
          }
        }}
      />

      <ReviewLessonItemModal
        open={reviewModal.open}
        onClose={() => setReviewModal((p) => ({ ...p, open: false }))}
        data={reviewModal.data}
        onAccept={() => markReviewed(reviewModal.unitKey, reviewModal.topicId)}
      />
    </div>
  );
};

export default PrivateRouter(LessonPlan);
