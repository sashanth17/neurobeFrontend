import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  BookOpen,
  BookOpenCheck,
  Check,
  CheckCircle2,
  Clock,
  EditIcon,
  Hourglass,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState, Success, Failure, Dropdown } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";

const getErrorMessage = (error: any, fallback: string) => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error?.message === "string") return error.message;
  if (typeof error?.detail === "string") return error.detail;
  if (typeof error?.error === "string") return error.error;
  return fallback;
};
import StepHeader from "@/components/academic-setup/StepHeader";
import StatTabCard from "@/components/academic-setup/StatTabCard";
import TableTitle from "@/components/common-components/TableTitle";
import GenericTabs from "@/components/common-components/GenericTabs";
import AccordiansStyle from "@/components/common-components/AccordiansStyle";
import PageFooter from "@/components/common-components/PageFooter";
import AddTopicModal from "@/components/academic-setup/AddTopicModal";
import EditTopicModal from "@/components/academic-setup/EditTopicModal";
import { useRouter, useSearchParams } from "next/navigation";
import { UNIT_TABS } from "@/utils/constant.utils";
import PageHeader from "@/components/common-components/PageHeader";
import Models from "@/imports/models.import";

// ─── Raw unit data ─────────────────────────────────────────────────────────────

type TopicStatus = "Approved" | "Needs Review";

interface SubTopic {
  id: string;
  title: string;
  hours: string;
  level: string;
  status: TopicStatus;
}

interface UnitData {
  title: string;
  topics: { id: string; title: string; level: string; hours: string; subtopics: SubTopic[] }[];
}

const RAW_UNIT_DATA: Record<string, UnitData> = {
  "unit-1": {
    title: "Unit 1 — Physical Layer & Network Architectures",
    topics: [
      {
        id: "1", title: "Layered Network Architecture: OSI Model vs TCP/IP Protocol Stack",
        level: "Knowledge Level K2", hours: "4 Hours",
        subtopics: [
          { id: "1.1", title: "Network Models & Layered Architecture", hours: "2", level: "K2", status: "Approved" },
          { id: "1.2", title: "Physical Layer & Transmission Media", hours: "2", level: "K2", status: "Needs Review" },
        ],
      },
      {
        id: "2", title: "Physical Media: Guided and Unguided Transmission",
        level: "Knowledge Level K2", hours: "5 Hours",
        subtopics: [
          { id: "2.1", title: "Network Topologies & Switching Techniques", hours: "2.5", level: "K2", status: "Needs Review" },
          { id: "2.2", title: "Network Performance Metrics", hours: "2.5", level: "K3", status: "Needs Review" },
        ],
      },
      {
        id: "3", title: "Signal Encoding, Digital Transmission, and Multiplexing",
        level: "Knowledge Level K2", hours: "2 Hours",
        subtopics: [
          { id: "3.1", title: "Signal Encoding Techniques", hours: "2", level: "K2", status: "Approved" },
        ],
      },
      {
        id: "4", title: "Network Topologies, Performance Metrics",
        level: "Knowledge Level K3", hours: "1.5 Hours",
        subtopics: [
          { id: "4.1", title: "Bandwidth & Latency Analysis", hours: "1.5", level: "K3", status: "Approved" },
        ],
      },
    ],
  },
  "unit-2": {
    title: "Unit 2 — Data Link Layer & Error Control",
    topics: [
      {
        id: "1", title: "Framing, Flow Control, and Error Control Mechanisms",
        level: "Knowledge Level K2", hours: "2 Hours",
        subtopics: [
          { id: "1.1", title: "Framing & Error Detection", hours: "2", level: "K2", status: "Approved" },
        ],
      },
      {
        id: "2", title: "HDLC and PPP Protocols",
        level: "Knowledge Level K2", hours: "2 Hours",
        subtopics: [
          { id: "2.1", title: "HDLC Frame Structure", hours: "2", level: "K2", status: "Needs Review" },
        ],
      },
      {
        id: "3", title: "Multiple Access Protocols: ALOHA, CSMA/CD, CSMA/CA",
        level: "Knowledge Level K3", hours: "2.5 Hours",
        subtopics: [
          { id: "3.1", title: "ALOHA & CSMA Variants", hours: "2.5", level: "K3", status: "Approved" },
        ],
      },
    ],
  },
  "unit-3": {
    title: "Unit 3 — Network Layer & Routing",
    topics: [
      {
        id: "1", title: "IPv4 Addressing, Subnetting, and CIDR",
        level: "Knowledge Level K3", hours: "3 Hours",
        subtopics: [
          { id: "1.1", title: "IPv4 Subnetting & CIDR", hours: "3", level: "K3", status: "Approved" },
        ],
      },
      {
        id: "2", title: "Routing Algorithms: Dijkstra, Bellman-Ford",
        level: "Knowledge Level K3", hours: "2.5 Hours",
        subtopics: [
          { id: "2.1", title: "Dijkstra & Bellman-Ford", hours: "2.5", level: "K3", status: "Needs Review" },
        ],
      },
      {
        id: "3", title: "Routing Protocols: RIP, OSPF, BGP",
        level: "Knowledge Level K2", hours: "2.5 Hours",
        subtopics: [
          { id: "3.1", title: "RIP, OSPF & BGP Overview", hours: "2.5", level: "K2", status: "Approved" },
        ],
      },
      {
        id: "4", title: "IPv6 Addressing and Transition Mechanisms",
        level: "Knowledge Level K2", hours: "2 Hours",
        subtopics: [
          { id: "4.1", title: "IPv6 & Transition Strategies", hours: "2", level: "K2", status: "Needs Review" },
        ],
      },
    ],
  },
  "unit-4": {
    title: "Unit 4 — Transport Layer & Congestion Control",
    topics: [
      {
        id: "1", title: "TCP: Connection Establishment, Flow Control, Congestion Control",
        level: "Knowledge Level K3", hours: "3 Hours",
        subtopics: [
          { id: "1.1", title: "TCP Handshake & Flow Control", hours: "3", level: "K3", status: "Approved" },
        ],
      },
      {
        id: "2", title: "UDP: Characteristics and Use Cases",
        level: "Knowledge Level K2", hours: "2 Hours",
        subtopics: [
          { id: "2.1", title: "UDP Use Cases", hours: "2", level: "K2", status: "Needs Review" },
        ],
      },
      {
        id: "3", title: "Socket Programming Basics",
        level: "Knowledge Level K3", hours: "4 Hours",
        subtopics: [
          { id: "3.1", title: "Socket API & Programming", hours: "4", level: "K3", status: "Approved" },
        ],
      },
    ],
  },
  "unit-5": {
    title: "Unit 5 — Application Layer & Network Security",
    topics: [
      {
        id: "1", title: "HTTP, HTTPS, DNS, FTP, SMTP Protocols",
        level: "Knowledge Level K2", hours: "3 Hours",
        subtopics: [
          { id: "1.1", title: "Application Layer Protocols", hours: "3", level: "K2", status: "Approved" },
        ],
      },
      {
        id: "2", title: "Cryptography: Symmetric, Asymmetric, and Hash Functions",
        level: "Knowledge Level K3", hours: "3 Hours",
        subtopics: [
          { id: "2.1", title: "Cryptographic Techniques", hours: "3", level: "K3", status: "Needs Review" },
        ],
      },
      {
        id: "3", title: "Firewalls, IDS, and VPN Technologies",
        level: "Knowledge Level K2", hours: "2 Hours",
        subtopics: [
          { id: "3.1", title: "Firewalls & VPN", hours: "2", level: "K2", status: "Approved" },
        ],
      },
    ],
  },
};

// ─── Static config ─────────────────────────────────────────────────────────────

const STAT_TABS = [
  {
    key: "total-topics",
    label: "Total Topics",
    subLabel: "Across all units",
    count: 22,
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    key: "approved",
    label: "Approved Topics",
    subLabel: "Ready for lesson plan",
    count: 10,
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
  {
    key: "needs-review",
    label: "Needs Review",
    subLabel: "Pending approval",
    count: 12,
    icon: <Hourglass className="h-5 w-5" />,
  },
  {
    key: "contact-hours",
    label: "Contact Hours",
    subLabel: "Total teaching hours",
    count: 45,
    icon: <Clock className="h-5 w-5" />,
  },
];



const GENERATE_STEPS = [
  {
    title: "Analyzing Course Syllabus",
    description: "Deconstructing 5 syllabus units and 45 contact hours for CS309 — Computer Networks.",
  },
  {
    title: "Topic & Subtopic Decomposition",
    description: "Generating topics and granular subtopics for all 5 units.",
  },
  {
    title: "Knowledge Level Calibration",
    description: "Assigning Knowledge Levels (K1–K6) per topic based on complexity mapping.",
  },
  {
    title: "Contact Hour Allocation",
    description: "Balancing lecture hours across 45 total hours to fit university parameters.",
  },
];

const fallbackTotalTopics = UNIT_TABS.reduce((a, b) => a + b.count, 0);
const fallbackTotalUnits = UNIT_TABS.length;

// count all subtopics across all units
const fallbackTotalSubtopics = Object.values(RAW_UNIT_DATA).reduce(
  (s, u) => s + u.topics.reduce((ts, t) => ts + t.subtopics.length, 0),
  0,
);

// ─── Page ──────────────────────────────────────────────────────────────────────

const Topics = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pollRef = useRef<NodeJS.Timeout | null>(null);


  const [state, setState] = useSetState({
    activeTab: "unit-1",
    activeUnitNumber: 1,
    activeStatTab: "total-topics",
    topicsGenerated: false,
    approvedCount: 0,
    topicsApproved: false,
    showGenerateModal: false,
    generatingTopics: false,
    topicsLoading: false,
    activeBannerTab: "coordinator",
    selectedCourse: null,
    courseDetail: null as any,
    courseList: [] as any[],
    organization_id: "",
    coordinator_id: "",
    isCourseCoordinator: false,
    unitsList: [] as any[],
    unitDetailsMap: {} as Record<number, any>,
    loadingUnits: false,
    loadingUnitDetail: false,
  });

  const course_id = useSearchParams().get("course_id");

  // per-unit accepted (approved) subtopic IDs
  const [approvedMap, setApprovedMap] = useState<Record<string, Set<string>>>(() =>
    Object.fromEntries(
      Object.entries(RAW_UNIT_DATA).map(([unitKey, unit]) => [
        unitKey,
        new Set(
          unit.topics.flatMap((t) =>
            t.subtopics.filter((s) => s.status === "Approved").map((s) => s.id),
          ),
        ),
      ]),
    ),
  );

  const [addTopicModal, setAddTopicModal] = useState(false);
  const [editTopicModal, setEditTopicModal] = useState(false);
  const [selectedTopicToEdit, setSelectedTopicToEdit] = useState<any>(null);
  const [updatingTopic, setUpdatingTopic] = useState(false);
  const [editModalInitialStatus, setEditModalInitialStatus] = useState<"Approved" | "Needs Review">("Approved");

  const openEditTopicModal = (topic: any, initialStatus: "Approved" | "Needs Review" = "Approved") => {
    setSelectedTopicToEdit(topic);
    setEditModalInitialStatus(initialStatus);
    setEditTopicModal(true);
  };

  useEffect(() => {
    dispatch(setPageTitle("Topics"));
  }, [dispatch]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.role === "course_coordinator") {
      setState({
        isCourseCoordinator: true,
        coordinator_id: user.id,
      });
    }
    setState({
      organization_id: user?.organization_id,
    });
    if (user?.organization_id) {
      getAllCourse(user.organization_id);
    } else {
      getAllCourse();
    }
  }, []);

  useEffect(() => {
    if (course_id) {
      getCourseDetails();
    } else {
      getUnits(1);
    }
  }, [course_id]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);


  // "API Integration"
  const getAllCourse = async (orgId?: any) => {
    try {
      const targetOrg = orgId || state?.organization_id;
      const res: any = await Models.course.list(targetOrg ? { organization_id: targetOrg } : {});
      const dropdown = Dropdown(res, "course_title");
      setState({
        courseList: dropdown,
      });
      if (!course_id && res && res.length > 0) {
        const firstCourse = res[0];
        getCourseDetails(firstCourse.id);
      }
    } catch (error: any) {
      console.log("error fetching course list", error);
      Failure(getErrorMessage(error, "Failed to fetch course list"));
    }
  };

  const getCourseDetails = async (targetCourseId?: any) => {
    const cid = targetCourseId || course_id;
    if (!cid) return;
    try {
      const res: any = await Models.course.detail(cid);
      setState({
        courseDetail: res,
        selectedCourse: res ? { value: res.id, label: `${res.course_code} - ${res.course_title}` } : null,
      });
      const sid = res?.syllabus_id || res?.latest_syllabus?.id;
      getUnits(sid);
    } catch (error: any) {
      console.log("error fetching course detail", error);
      Failure(getErrorMessage(error, "Failed to fetch course detail"));
      getUnits(1);
    }
  };

  const getUnits = async (syllabusId?: any) => {
    const sid = syllabusId || state.courseDetail?.latest_syllabus?.id;
    try {
      setState({ loadingUnits: true });
      const res: any = await Models.topics.units(sid);
      const rawUnitsData = Array.isArray(res) ? res : res?.data || [];
      const unitsData = rawUnitsData.map((u: any, idx: number) => {
        const num = u.unit_number ?? (idx + 1);
        const realId = u.id ?? u.unit_id;
        return {
          ...u,
          id: realId,
          unit_id: realId,
          unit_number: num,
        };
      });

      if (unitsData && unitsData.length > 0) {
        const initialUnit = unitsData[0];
        const initialUnitNum = initialUnit.unit_number || 1;
        const initialTabKey = `unit-${initialUnitNum}`;

        setState({
          unitsList: unitsData,
          activeTab: initialTabKey,
          activeUnitNumber: initialUnitNum,
          loadingUnits: false,
        });

        getUnitDetail(sid, initialUnitNum);
      } else {
        setState({ loadingUnits: false });
        getUnitDetail(sid, 1);
      }
    } catch (error: any) {
      console.log("error fetching units", error);
      setState({ loadingUnits: false });
      Failure(getErrorMessage(error, "Failed to fetch syllabus units"));
    }
  };

  const getUnitDetail = async (syllabusId?: any, unitNumber?: any) => {
    const sid = syllabusId || state.courseDetail?.latest_syllabus?.id || state.unitsList?.[0]?.syllabus_id;
    const uNum = unitNumber ?? state.activeUnitNumber ;
    try {
      setState({ loadingUnitDetail: true }); 
      const res: any = await Models.topics.unit_detail(sid, uNum);
      const data = res?.data || res;

      setState((prev: any) => {
        const resUnitTabs = data?.unit_tabs;
        const targetUnitNum = data?.selected_unit?.unit_number ?? uNum;
        const currentUnitDbId = data?.selected_unit?.id;

        const existingUnits = prev.unitsList || [];
        const mergedUnitsList = (Array.isArray(resUnitTabs) && resUnitTabs.length > 0)
          ? resUnitTabs.map((tab: any, idx: number) => {
              const tabNum = tab.unit_number ?? (idx + 1);
              const fromExisting = existingUnits.find(
                (eu: any) => (eu.unit_number ?? eu.id) === tabNum
              );
              const realId =
                (data?.selected_unit?.unit_number === tabNum ? currentUnitDbId : null) ||
                fromExisting?.unit_id ||
                fromExisting?.id ||
                tab.unit_id ||
                tab.id ||
                (tabNum === 1 ? (currentUnitDbId || 2) : (currentUnitDbId ? currentUnitDbId + (tabNum - 1) : tabNum + 1));

              return {
                ...tab,
                id: realId,
                unit_id: realId,
                unit_number: tabNum,
              };
            })
          : existingUnits;

        const existingCourse = prev.courseDetail || {};
        const updatedCourseDetail = data?.course_code
          ? {
            ...existingCourse,
            id: data.course_id ?? existingCourse.id,
            course_code: data.course_code ?? existingCourse.course_code,
            course_title: data.course_title ?? existingCourse.course_title,
            course_display_tag: data.course_display_tag ?? existingCourse.course_display_tag,
            programme: data.programme ?? existingCourse.programme,
            batch_name: data.batch ?? existingCourse.batch_name,
            students_count: data.student_count ?? existingCourse.students_count,
            academic_year: data.academic_year_term ?? existingCourse.academic_year,
            latest_syllabus: {
              id: data.syllabus_id ?? existingCourse.latest_syllabus?.id ?? sid,
            },
          }
          : existingCourse;

        const isStructureGenerated =
          data?.metrics?.topic_structure?.status === "generated" ||
          (Array.isArray(data?.selected_unit?.topics) &&
            data.selected_unit.topics.some((t: any) => Array.isArray(t.subtopics) && t.subtopics.length > 0));

        return {
          loadingUnitDetail: false,
          unitsList: mergedUnitsList,
          courseDetail: updatedCourseDetail,
          // ...(isStructureGenerated ? { topicsGenerated: true } : {}),
          unitDetailsMap: {
            ...(prev.unitDetailsMap || {}),
            [targetUnitNum]: data,
            [uNum]: data,
          },
        };
      });
    } catch (error: any) {
      console.log("error fetching unit detail", error);
      setState({ loadingUnitDetail: false });
      Failure(getErrorMessage(error, `Failed to fetch Unit ${uNum} details`));
    }
  };


  const job_Data = async (id?: string | number) => {
    // stop any existing poll before starting a new one
    stopPolling();

    const targetId = id || state.jobId;
    if (!targetId) {
      console.warn("job_Data called without id");
      return;
    }

    const fetchOnce = async () => {
      try {
        setState({
          topicsLoading: true,
        });
        const res: any = await Models.job.detail(targetId);
        console.log("job_Data", res);
        setState({ jobData: res });

        const status = res?.status ?? res?.state?.live_redis_status ?? res?.result?.status;
        const syllabusId = res?.result?.syllabus_id || res?.syllabus_id;

        if (status === "complete" || status === "completed" || status === "finished" || status === "success" || syllabusId) {
          stopPolling();
          console.log("job_Data complete, syllabus_id:", syllabusId);

          const targetSid = syllabusId || state.courseDetail?.latest_syllabus?.id || state.unitsList?.[0]?.syllabus_id;
          const currentUnitNum = state.activeUnitNumber || 1;

          await getUnits(targetSid);
          await getUnitDetail(targetSid, currentUnitNum);

          setState({
            topicsLoading: false,
            topicsGenerated: true,
          });
        } else if (status === "failed" || status === "error") {
          stopPolling();
          setState({
            topicsLoading: false,
          });
          Failure(res?.message || res?.error || "Topic generation job failed");
        }
      } catch (error) {
        console.log("job_Data error", error);
        stopPolling();
        setState({
          topicsLoading: false,
        });
      }
    };

    // call immediately, then every 3 seconds
    await fetchOnce();
    pollRef.current = setInterval(fetchOnce, 3000);
  };




  const handleTabChange = (tabKey: string | number) => {
    const keyStr = String(tabKey);
    const selectedUnit = unitsList?.find(
      (u: any) => `unit-${u.unit_number}` === keyStr || String(u.unit_number) === keyStr
    );
    const unitNum = selectedUnit?.unit_number ?? (Number(keyStr.replace("unit-", "")) || 1);

    setState({
      activeTab: keyStr,
      activeUnitNumber: unitNum,
    });

    const sid =
      activeUnitDetail?.syllabus_id ||
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id ||
      9;
    getUnitDetail(sid, unitNum);
  };

  const activeUnitNum =
    state.activeUnitNumber ||
    (typeof state.activeTab === "string" ? Number(state.activeTab.replace("unit-", "")) : 1) ||
    1;
  const activeUnitDetail = state.unitDetailsMap?.[activeUnitNum];

  const rawUnitsSource =
    (activeUnitDetail?.unit_tabs && activeUnitDetail.unit_tabs.length > 0)
      ? activeUnitDetail.unit_tabs
      : (state.unitsList && state.unitsList.length > 0)
        ? state.unitsList
        : [];

  const unitsList = rawUnitsSource.map((u: any, idx: number) => {
    const num = u.unit_number ?? (idx + 1);
    const existingFromState = state.unitsList?.find(
      (su: any) => (su.unit_number ?? su.id) === num
    );
    const detailForUnit = state.unitDetailsMap?.[num];
    const realId =
      detailForUnit?.selected_unit?.id ||
      (activeUnitDetail?.selected_unit?.unit_number === num ? activeUnitDetail.selected_unit.id : null) ||
      existingFromState?.unit_id ||
      existingFromState?.id ||
      u.unit_id ||
      u.id ||
      (num === 1 ? (activeUnitDetail?.selected_unit?.id || 2) : (activeUnitDetail?.selected_unit?.id ? activeUnitDetail.selected_unit.id + (num - 1) : num + 1));

    return {
      ...u,
      id: realId,
      unit_id: realId,
      unit_number: num,
    };
  });

  const totalUnits =
    activeUnitDetail?.metrics?.units?.value ??
    (unitsList.length > 0 ? unitsList.length : fallbackTotalUnits);

  const totalTopics =
    unitsList.length > 0
      ? unitsList.reduce((acc: number, u: any) => {
        const uDetail = state.unitDetailsMap?.[u.unit_number];
        const topicsArr = uDetail?.selected_unit?.topics || uDetail?.topics;
        const count = Array.isArray(topicsArr) && topicsArr.length > 0
          ? topicsArr.length
          : (u.topics_count ?? (u.topics?.length || 0));
        return acc + count;
      }, 0)
      : fallbackTotalTopics;

  const unitTabs = unitsList.map((u: any) => {
    const uDetail = state.unitDetailsMap?.[u.unit_number];
    const topicsArr = uDetail?.selected_unit?.topics || uDetail?.topics;
    const count = Array.isArray(topicsArr) && topicsArr.length > 0
      ? topicsArr.length
      : (u.topics_count ?? (u.topics?.length || 0));
    return {
      key: `unit-${u.unit_number}`,
      label: `Unit ${u.unit_number}`,
      count,
    };
  });

  const totalContactHours =
    activeUnitDetail?.metrics?.total_hours?.value ??
    (unitsList.length > 0
      ? unitsList.reduce((acc: number, u: any) => acc + (u.total_hours ?? (u.theory_hours || 0) + (u.lab_hours || 0)), 0)
      : 27);

  const activeUnitFromList = unitsList.find(
    (u: any) => u.unit_number === activeUnitNum || `unit-${u.unit_number}` === state.activeTab
  );

  // const raw = RAW_UNIT_DATA[state.activeTab];

  const getUnitTitleText = () => {
    const rawTitle =
      activeUnitDetail?.selected_unit?.unit_title ||
      activeUnitDetail?.unit_title ||
      activeUnitDetail?.title ||
      activeUnitDetail?.unit?.unit_title ||
      activeUnitFromList?.unit_title;

    // if (!rawTitle) return raw?.title || `Unit ${activeUnitNum}`;
    return rawTitle;
  };

  const currentUnitTitle = getUnitTitleText();

  let apiTopics: any[] | null = null;
  if (activeUnitDetail) {
    if (Array.isArray(activeUnitDetail.selected_unit?.topics)) {
      apiTopics = activeUnitDetail.selected_unit.topics;
    } else if (Array.isArray(activeUnitDetail.topics)) {
      apiTopics = activeUnitDetail.topics;
    } else if (Array.isArray(activeUnitDetail)) {
      apiTopics = activeUnitDetail;
    } else if (Array.isArray(activeUnitDetail.data?.selected_unit?.topics)) {
      apiTopics = activeUnitDetail.data.selected_unit.topics;
    } else if (Array.isArray(activeUnitDetail.data?.topics)) {
      apiTopics = activeUnitDetail.data.topics;
    } else if (Array.isArray(activeUnitDetail.data)) {
      apiTopics = activeUnitDetail.data;
    } else if (Array.isArray(activeUnitDetail.workspace?.topics)) {
      apiTopics = activeUnitDetail.workspace.topics;
    }
  }
  if (!apiTopics || apiTopics.length === 0) {
    if (Array.isArray(activeUnitFromList?.topics) && activeUnitFromList.topics.length > 0) {
      apiTopics = activeUnitFromList.topics;
    }
  }

  const computedTotalSubtopics = unitsList.reduce((acc: number, u: any) => {
    const uDetail = state.unitDetailsMap?.[u.unit_number];
    const topicsArr = uDetail?.selected_unit?.topics || uDetail?.topics || u.topics || [];
    const subsCount = topicsArr.reduce((sAcc: number, t: any) => sAcc + (t.subtopics?.length || 2), 0);
    return acc + subsCount;
  }, 0);

  const approvedInUnit = approvedMap[state.activeTab] ?? new Set<string>();

  // Count approved across loaded units
  let computedApprovedCount = 0;
  unitsList.forEach((u: any) => {
    const uDetail = state.unitDetailsMap?.[u.unit_number];
    const topicsArr = uDetail?.selected_unit?.topics || uDetail?.topics;
    if (Array.isArray(topicsArr) && topicsArr.length > 0) {
      topicsArr.forEach((t: any) => {
        const topicId = String(t.id || t.topic_code);
        const isAppr =
          approvedInUnit.has(topicId) ||
          approvedInUnit.has(String(t.id)) ||
          t.status === "Approved" ||
          t.status_badge === "success";
        if (isAppr) {
          computedApprovedCount++;
        }
      });
    }
  });

  const totalApproved = Object.values(approvedMap).reduce((s, set) => s + set.size, 0) || computedApprovedCount;
  const allApproved = totalApproved >= computedTotalSubtopics;

  const displayNeedsReview = Math.max(0, totalTopics - totalApproved);

  const statTabs = [
    {
      key: "total-topics",
      label: "Total Topics",
      subLabel: "Across all units",
      count: totalTopics,
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      key: "approved",
      label: "Approved Topics",
      subLabel: "Ready for lesson plan",
      count: totalApproved,
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      key: "needs-review",
      label: "Needs Review",
      subLabel: "Pending approval",
      count: displayNeedsReview,
      icon: <Hourglass className="h-5 w-5" />,
    },
    {
      key: "contact-hours",
      label: "Contact Hours",
      subLabel: "Total teaching hours",
      count: totalContactHours,
      icon: <Clock className="h-5 w-5" />,
    },
  ];

  const toggleApprove = (unitKey: string, subId: string) => {
    setApprovedMap((prev) => {
      const next = new Set<string>(prev[unitKey] ?? new Set<string>());
      if (next.has(subId)) next.delete(subId); else next.add(subId);
      const newMap = { ...prev, [unitKey]: next };
      const total = Object.values(newMap).reduce((s, set) => s + set.size, 0);
      setState({ approvedCount: total });
      return newMap;
    });
  };

  const handleAddTopic = async (newTopic: {
    title: string;
    unit: string;
    unitNumber: number;
    level: string;
    hours: string;
    status: string;
  }) => {
    const matchedUnitNum =
      newTopic.unitNumber ||
      activeUnitNum

    const matchedUnit =
      unitsList?.find((u: any) => u.unit_number === matchedUnitNum) ||
      state.unitsList?.find((u: any) => u.unit_number === matchedUnitNum);

    const unitDetail = state.unitDetailsMap?.[matchedUnitNum];
    const unitId =
      unitDetail?.selected_unit?.id ||
      matchedUnit?.id ||
      activeUnitDetail?.selected_unit?.id ||
      matchedUnitNum

    const topicName = newTopic.title;
    const estimatedHours = parseFloat(newTopic.hours);
    const knowledgeLevel = newTopic.level;
    const status = newTopic.status;

    const body = {
      topic_name: topicName,
      estimated_hours: estimatedHours,
      knowledge_level: knowledgeLevel,
      status: status,
    };

    console.log("Calling Models.topics.create with unitId:", unitId, "body:", body);

    try {
      setState({ creatingTopic: true });
      const res: any = await Models.topics.create(unitId, body);
      console.log("create topic response:", res);
      Success(res?.message || "Topic created successfully");

      const sid =
        activeUnitDetail?.syllabus_id ||
        state.courseDetail?.latest_syllabus?.id ||
        state.unitsList?.[0]?.syllabus_id ||
        9;
      await getUnitDetail(sid, matchedUnitNum);
    } catch (error: any) {
      console.log("create topic error:", error);
      Failure(getErrorMessage(error, "Failed to create topic"));

      // Local optimistic update
      const topicLevelCode = knowledgeLevel.split(" ")[0] || "K2";
      const levelNum = topicLevelCode.replace("K", "") || "2";

      const newTopicObj = {
        id: `${matchedUnitNum}.${Date.now()}`,
        topic_code: `${matchedUnitNum}.${(apiTopics?.length || 0) + 1}`,
        topic_name: topicName,
        title: topicName,
        knowledge_level: levelNum,
        level: `Knowledge Level ${topicLevelCode}`,
        hours: estimatedHours,
        theory_hours: estimatedHours,
        status: status,
        status_badge: status === "Approved" ? "success" : "warning",
        subtopics_count: 0,
        is_expanded: false,
        subtopics: [],
        can_edit: true,
      };

      setState((prev: any) => {
        const currentUnitDetail = prev?.unitDetailsMap?.[matchedUnitNum];
        const existingTopics =
          currentUnitDetail?.selected_unit?.topics ||
          currentUnitDetail?.topics ||
          apiTopics ||
          [];
        const updatedTopics = [...existingTopics, newTopicObj];

        return {
          unitDetailsMap: {
            ...(prev.unitDetailsMap || {}),
            [matchedUnitNum]: {
              ...(typeof currentUnitDetail === "object" ? currentUnitDetail : {}),
              selected_unit: {
                ...(currentUnitDetail?.selected_unit || {}),
                topics: updatedTopics,
              },
              topics: updatedTopics,
            },
          },
        };
      });
    } finally {
      setState({ creatingTopic: false });
    }
  };

  const handleUpdateTopic = async (payload: {
    topic_id: any;
    parent_topic_id?: any;
    is_subtopic?: boolean;
    subtopic_id?: any;
    subtopic_code?: string;
    micro_topics?: any[];
    topic_name: string;
    unit_id: number;
    estimated_hours: number;
    knowledge_level: string;
    status: string;
  }) => {
    const isSub = Boolean(payload.is_subtopic);
    const targetTopicId = isSub
      ? (payload.parent_topic_id || selectedTopicToEdit?.parent_topic_id || payload.topic_id)
      : payload.topic_id;
    const subtopicId = payload.subtopic_id || payload.topic_id;

    // Resolve the real database unit_id
    const matchedUnit =
      unitsList?.find((u: any) => u.id === payload.unit_id || u.unit_id === payload.unit_id) ||
      state.unitsList?.find((u: any) => u.id === payload.unit_id || u.unit_id === payload.unit_id) ||
      unitsList?.find((u: any) => u.unit_number === payload.unit_id) ||
      state.unitsList?.find((u: any) => u.unit_number === payload.unit_id);

    const matchedUnitNum =
      matchedUnit?.unit_number ||
      selectedTopicToEdit?.unit_number ||
      activeUnitNum;

    const unitDetail = state.unitDetailsMap?.[matchedUnitNum];

    const resolvedUnitId =
      unitDetail?.selected_unit?.id ||
      (matchedUnitNum === activeUnitNum ? activeUnitDetail?.selected_unit?.id : null) ||
      matchedUnit?.unit_id ||
      matchedUnit?.id ||
      (payload.unit_id && payload.unit_id > 1 ? payload.unit_id : null) ||
      selectedTopicToEdit?.unit_id ||
      payload.unit_id;

    // Body for Subtopic update
    const subtopicCode =
      payload.subtopic_code ||
      selectedTopicToEdit?.subtopic_code ||
      selectedTopicToEdit?.code ||
      selectedTopicToEdit?.topic_code ||
      (selectedTopicToEdit?.parent_topic_code ? `${selectedTopicToEdit.parent_topic_code}.1` : "1.1.1");

    const existingMicroTopics = payload.micro_topics || selectedTopicToEdit?.micro_topics;
    const microTopicsList = (Array.isArray(existingMicroTopics) && existingMicroTopics.length > 0)
      ? existingMicroTopics.map((m: any) => ({
          micro_topic_name: typeof m === "string" ? m : (m?.micro_topic_name || m?.name || m?.title || payload.topic_name),
        }))
      : [
          {
            micro_topic_name: payload.topic_name,
          },
        ];

    const subtopicBody = {
      subtopic_code: subtopicCode,
      subtopic_name: payload.topic_name,
      micro_topics: microTopicsList,
      hours : payload.estimated_hours,
      knowledge_level : payload.knowledge_level,
      status: payload.status,
    };

    // Body for Parent Topic update
    const topicBody = {
      topic_name: payload.topic_name,
      unit_id: Number(resolvedUnitId),
      estimated_hours: payload.estimated_hours,
      knowledge_level: payload.knowledge_level,
      status: payload.status,
    };

    try {
      setUpdatingTopic(true);
      let res: any;
      if (isSub) {
        console.log("Calling Models.topics.subTopics_update with topicId:", targetTopicId, "body:", subtopicBody);
        res = await Models.topics.subTopics_update(targetTopicId, subtopicBody);
      } else {
        console.log("Calling Models.topics.update with topicId:", targetTopicId, "body:", topicBody);
        res = await Models.topics.update(targetTopicId, topicBody);
      }

      if (res && (res.status === false || res.success === false)) {
        throw new Error(res?.message || (isSub ? "Failed to update subtopic" : "Failed to update topic"));
      }

      Success(res?.message || (payload.status === "Approved" ? (isSub ? "Subtopic approved successfully" : "Topic approved successfully") : (isSub ? "Subtopic updated successfully" : "Topic updated successfully")));
      setEditTopicModal(false);

      const trackedId = String(isSub ? subtopicId : targetTopicId);
      if (payload.status === "Approved") {
        setApprovedMap((prev: any) => {
          const next = new Set(prev[state.activeTab] || []);
          next.add(trackedId);
          return { ...prev, [state.activeTab]: next };
        });
      } else {
        setApprovedMap((prev: any) => {
          const next = new Set(prev[state.activeTab] || []);
          next.delete(trackedId);
          return { ...prev, [state.activeTab]: next };
        });
      }

      // Update local state ONLY on success
      setState((prev: any) => {
        const currentUnitDetail = prev.unitDetailsMap?.[matchedUnitNum];
        const existingTopics =
          currentUnitDetail?.selected_unit?.topics ||
          currentUnitDetail?.topics ||
          apiTopics ||
          [];

        const updatedTopics = existingTopics.map((t: any) => {
          if (isSub) {
            const subList = Array.isArray(t.subtopics) ? t.subtopics : [];
            const hasSub = subList.some((s: any) =>
              String(s.id) === String(subtopicId) ||
              s.subtopic_name === payload.topic_name ||
              s.title === payload.topic_name
            );
            if (hasSub || String(t.id) === String(targetTopicId) || String(t.topic_id) === String(targetTopicId)) {
              const updatedSubList = subList.map((s: any) => {
                if (
                  String(s.id) === String(subtopicId) ||
                  s.subtopic_name === payload.topic_name ||
                  s.title === payload.topic_name
                ) {
                  return {
                    ...s,
                    subtopic_name: payload.topic_name,
                    title: payload.topic_name,
                    theory_hours: payload.estimated_hours,
                    hours: payload.estimated_hours,
                    knowledge_level: payload.knowledge_level,
                    level: payload.knowledge_level,
                    status: payload.status,
                    status_badge: payload.status === "Approved" ? "success" : "warning",
                  };
                }
                return s;
              });
              return {
                ...t,
                subtopics: updatedSubList,
              };
            }
            return t;
          }

          const tId = t.id || t.topic_id || t.topic_code;
          if (String(tId) === String(targetTopicId) || t.topic_name === payload.topic_name || t.title === payload.topic_name) {
            return {
              ...t,
              topic_name: payload.topic_name,
              title: payload.topic_name,
              theory_hours: payload.estimated_hours,
              hours: payload.estimated_hours,
              knowledge_level: payload.knowledge_level,
              status: payload.status,
              status_badge: payload.status === "Approved" ? "success" : "warning",
            };
          }
          return t;
        });

        return {
          unitDetailsMap: {
            ...(prev.unitDetailsMap || {}),
            [matchedUnitNum]: {
              ...(typeof currentUnitDetail === "object" ? currentUnitDetail : {}),
              selected_unit: {
                ...(currentUnitDetail?.selected_unit || {}),
                topics: updatedTopics,
              },
              topics: updatedTopics,
            },
          },
        };
      });

      const sid =
        activeUnitDetail?.syllabus_id ||
        state.courseDetail?.latest_syllabus?.id ||
        state.unitsList?.[0]?.syllabus_id ||
        9;
      await getUnitDetail(sid, matchedUnitNum);
    } catch (error: any) {
      console.log("update topic error:", error);
      Failure(getErrorMessage(error, isSub ? "Failed to update subtopic" : "Failed to update topic"));
    } finally {
      setUpdatingTopic(false);
    }
  };

  const handleSaveDraft = async () => {
    const sid =
      activeUnitDetail?.syllabus_id ||
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id ||
      9;

    try {
      setState({ savingDraft: true });
      const res: any = await Models.topics.save_draft(sid, {});
      console.log("save_draft response:", res);
      Success(res?.message || "Draft saved successfully");
    } catch (error: any) {
      console.log("save_draft error:", error);
      Failure(getErrorMessage(error, "Failed to save draft"));
    } finally {
      setState({ savingDraft: false });
    }
  };

  const handleApproveTopics = async () => {
    const sid =
      activeUnitDetail?.syllabus_id ||
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id ||
      9;

    try {
      setState({ approvingTopics: true });
      const res: any = await Models.topics.approve_topics(sid, {});
      console.log("approve_topics response:", res);
      Success(res?.message || "Topics approved successfully");
      setState({ topicsApproved: true });
    } catch (error: any) {
      console.log("approve_topics error:", error);
      Failure(getErrorMessage(error, "Failed to approve topics"));
      setState({ topicsApproved: true });
    } finally {
      setState({ approvingTopics: false });
    }
  };

  const handleGenerateTopics = async () => {
    const sid =
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id ||
      activeUnitDetail?.syllabus_id ||
      9;
    try {
      setState({ generatingTopics: true });
      const res: any = await Models.topics.generate(sid, {});
      console.log("generate response", res);
      Success(res?.message || "Topic hierarchy generation job enqueued");
      setState({
        generatingTopics: false,
        showGenerateModal: true,
        jobId: res.job_id,
      });
    } catch (error: any) {
      console.log("generate error", error);
      Failure(getErrorMessage(error, "Failed to generate topics"));
      setState({
        generatingTopics: false,
        showGenerateModal: true,
      });
    }
  };

  // ── Pre-generate: plain topic rows with level + hours badges ─────────────────
  console.log("apiTopics", apiTopics);

  const buildInitialTopics = () => {
    if (apiTopics && apiTopics.length > 0) {
      return apiTopics.map((topic: any, idx: number) => {
        const topicId = topic.id || topic.topic_code || `${idx + 1}`;
        const topicName = topic.topic_name || topic.title || topic.topic_description || "Topic";
        const displayTitle = topic.topic_code && !topicName.startsWith(topic.topic_code)
          ? `${topic.topic_code} — ${topicName}`
          : topicName;

        const levelBadge =
          topic.level ||
          (topic.knowledge_level
            ? String(topic.knowledge_level).startsWith("K")
              ? `Knowledge Level ${topic.knowledge_level}`
              : `Knowledge Level K${topic.knowledge_level}`
            : null) ||
          (topic.learning_sequence ? `Sequence: ${topic.learning_sequence}` : "Knowledge Level K2");

        const hoursBadge =
          typeof topic.hours === "number"
            ? `${topic.hours} Hours`
            : topic.hours
              ? (String(topic.hours).toLowerCase().includes("hour") ? String(topic.hours) : `${topic.hours} Hours`)
              : (topic.theory_hours ? `${topic.theory_hours} Hours` : "2 Hours");

        const isApproved =
          approvedInUnit.has(String(topicId)) ||
          approvedInUnit.has(String(topic.id)) ||
          topic.status === "Approved" ||
          topic.status_badge === "success";

        // const statusBadge = {
        //   label: isApproved ? "Approved" : (topic.status || "Needs Review"),
        //   className: isApproved
        //     ? "border border-green-300 bg-green-50 text-green-700 font-semibold"
        //     : "border border-orange-300 bg-orange-50 text-orange-600 font-semibold",
        //   onClick: () => toggleApprove(state.activeTab, String(topicId)),
        // };

        return {
          id: `${state.activeTab}-${topicId}`,
          title: displayTitle,
          collapsedBadge: [
            { label: levelBadge, className: "bg-color2-l text-color2 font-bold" },
            { label: hoursBadge, className: "bg-gray-200 text-pri font-bold" },
            // statusBadge,
          ],
          items: [],
        };
      });
    }

    return [];
  };

  // ── Post-generate: expandable topics with subtopic items ─────────────────────
  const buildGeneratedTopics = () => {
    const raw = RAW_UNIT_DATA[state.activeTab];
    const sourceTopics =
      Array.isArray(apiTopics) && apiTopics.length > 0
        ? apiTopics
        : (raw?.topics || []);

    const currentUnitDbId =
      activeUnitDetail?.selected_unit?.id ||
      unitsList.find((u: any) => u.unit_number === activeUnitNum)?.id ||
      state.unitsList?.find((u: any) => u.unit_number === activeUnitNum)?.id ||
      (activeUnitNum === 1 ? 2 : activeUnitNum + 1);

    return sourceTopics.map((topic: any, tIdx: number) => {
      const topicId = topic.id || topic.topic_code || `${tIdx + 1}`;
      const topicName = topic.topic_name || topic.title || topic.topic_description || `Topic ${tIdx + 1}`;
      const topicTitle = topic.topic_code && !topicName.startsWith(topic.topic_code)
        ? `${topic.topic_code} — ${topicName}`
        : topicName;

      const parentTopicDbUnitId =
        topic.unit_id ||
        currentUnitDbId;

      const topicObj = {
        ...topic,
        unit_id: parentTopicDbUnitId,
        unit_number: topic.unit_number || activeUnitNum,
      };

      const rawHours =
        topic.estimated_hours ??
        topic.theory_hours ??
        topic.hours ??
        2;
      const displayHours =
        typeof rawHours === "number"
          ? rawHours
          : parseFloat(String(rawHours).replace(/[^0-9.]/g, "")) || 2;

      const rawKLevel =
        topic.knowledge_level ||
        topic.level ||
        "K2";
      const kLevelTag =
        String(rawKLevel).toUpperCase().startsWith("K")
          ? String(rawKLevel).split(" ")[0]
          : `K${rawKLevel}`;

      const isTopicApproved = topic.status === "Approved" ||
        topic.status_badge === "success";

      const topicActions = [
        {
          key: "hours",
          label: `Hours ${displayHours}`,
          asTag: true as const,
          className: "text-xs font-semibold text-gray-700 dark:text-gray-300",
        },
        {
          key: "level",
          label: kLevelTag,
          asTag: true as const,
          className: "rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600",
        },
        isTopicApproved
          ? {
              key: "status",
              label: "Approved",
              asTag: true as const,
              className: "rounded-full border border-green-400 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-600",
            }
          : {
              key: "status",
              label: "Needs Review",
              asTag: false as const,
              className:
                "inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-500 hover:border-orange-400 hover:bg-orange-100 cursor-pointer",
              onClick: () => openEditTopicModal(topicObj, "Approved"),
            },
        {
          key: "edit",
          label: "",
          icon: <EditIcon className="h-3.5 w-3.5" />,
          className:
            "flex items-center rounded border border-gray-300 bg-white p-1 text-gray-500 hover:border-color2 hover:text-color2 cursor-pointer shadow-xs",
          onClick: () => openEditTopicModal(topicObj, isTopicApproved ? "Approved" : "Needs Review"),
        },
      ];

      const subtopicsList = (topic.subtopics && topic.subtopics.length > 0)
        ? topic.subtopics
        : [];

      const items = subtopicsList.map((sub: any, idx: number) => {
        const subId = String(sub.id || `${topicId}.${idx + 1}`);
        const isApproved = sub.status === "Approved" || sub.status_badge === "success";
        const subCode = sub.subtopic_code || sub.code || `${topic.topic_code || topicId}.${idx + 1}`;
        const subtopicObj = {
          ...sub,
          is_subtopic: true,
          parent_topic_id: topic.id || topic.topic_id || topicId,
          parent_topic_code: topic.topic_code,
          parent_topic_name: topic.topic_name || topic.title,
          subtopic_id: sub.id || subId,
          subtopic_code: subCode,
          subtopic_name: sub.subtopic_name || sub.title || `Topic ${subId}`,
          title: sub.subtopic_name || sub.title || `Topic ${subId}`,
          topic_name: sub.subtopic_name || sub.title || `Topic ${subId}`,
          unit_number: topic.unit_number || activeUnitNum,
          unit_id: parentTopicDbUnitId,
          micro_topics: Array.isArray(sub.micro_topics) ? sub.micro_topics : [],
        };
        const actions = [
          {
            key: "level",
            label: sub.level || (`${sub.knowledge_level}`),
            asTag: true as const,
            className: "rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600",
          },
          {
            key: "hours",
            label: `${sub.hours || sub.theory_hours || 2} Hours`,
            asTag: true as const,
            className: "rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-[#000]",
          },
          isApproved
            ? {
              key: "status",
              label: "Approved",
              asTag: true as const,
              className: "rounded-full border border-green-400 bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-600",
            }
            : {
              key: "status",
              label: "• Needs Review",
              asTag: false as const,
              className:
                "inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-500 hover:border-orange-400 hover:bg-orange-100 cursor-pointer",
              onClick: () => openEditTopicModal(subtopicObj, "Approved"),
            },
          {
            key: "edit",
            label: "",
            icon: <EditIcon className="h-3.5 w-3.5" />,
            className:
              "flex items-center rounded border border-gray-300 bg-white p-1 text-gray-500 hover:border-color2 hover:text-color2 cursor-pointer shadow-xs",
            onClick: () => openEditTopicModal(subtopicObj, isApproved ? "Approved" : "Needs Review"),
          },
        ];

        return {
          id: subId,
          index: idx + 1,
          title: sub.subtopic_name || sub.title || `Topic ${subId}`,
          highlighted: isApproved,
          actions,
        };
      });

      const approvedCount = subtopicsList.filter((s: any) =>
        approvedInUnit.has(String(s.id)) || s.status === "Approved"
      ).length;

      return {
        id: `${state.activeTab}-${topicId}`,
        title: topicTitle,
        actions: topicActions,
        meta: `${topic.level || (topic.knowledge_level ? `Knowledge Level ${String(topic.knowledge_level).startsWith("K") ? topic.knowledge_level : `K${topic.knowledge_level}`}` : null) || "Knowledge Level K2"} · ${topic.hours || (topic.theory_hours ? `${topic.theory_hours} Hours` : "2 Hours")}`,
        collapsedBadge: {
          label: `${approvedCount}/${subtopicsList.length} Approved`,
          className:
            approvedCount === subtopicsList.length && subtopicsList.length > 0
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-orange-200 bg-orange-50 text-orange-600",
        },
        expandedBadge: {
          label: `${approvedCount}/${subtopicsList.length} Approved`,
          className:
            approvedCount === subtopicsList.length && subtopicsList.length > 0
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-orange-200 bg-orange-50 text-orange-600",
        },
        items,
      };
    });
  };

  return (
    <div className="min-h-screen">
      {/* ── Course banner ── */}
      <CourseBanner
        courseCode={activeUnitDetail?.course_code || state?.courseDetail?.course_code}
        courseTitle={activeUnitDetail?.course_title || state?.courseDetail?.course_title}
        description="Coordinator View — Academic course preparation, syllabus, outcomes mapping, lesson plans, question banking, and CIA paper generation."
        programme={activeUnitDetail?.programme || state?.courseDetail?.programme}
        batch={activeUnitDetail?.batch || state?.courseDetail?.batch_name}
        academicYear={activeUnitDetail?.academic_year_term || `${state?.courseDetail?.batch_name} `}
        students={activeUnitDetail?.student_count ?? state?.courseDetail?.students_count}
        selectedCourse={state.selectedCourse}
        courseOptions={state.courseList}
        onCourseChange={(val) => {
          setState({ selectedCourse: val });
          router.push(`/neurobe/topics?course_id=${val.value}`);
        }}
        activeView={state.activeBannerTab}
        onBack={() => router.back()}
        onViewChange={(view) => setState({ activeBannerTab: view })}
      />

      {/* ── Step header ── */}
      <PageHeader
        title="Topics"
        records={
          activeUnitDetail?.course_display_tag ||
          (state.courseDetail
            ? `${state.courseDetail.course_code} — ${state.courseDetail.course_title}`
            : "CS309 — Computer Networks")
        }
        subtitle="Create a detailed topic structure from the approved syllabus."
        icon={<BookOpenCheck className="h-5 w-5 text-color2" />}
      />

      {/* ── Stat cards — hidden after generation ── */}

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {statTabs.map((tab) => (
          <StatTabCard
            key={tab.key}
            icon={tab.icon}
            label={tab.label}
            subLabel={tab.subLabel}
            count={tab.count}
            active={state.activeStatTab === tab.key}
            onClick={() => setState({ activeStatTab: tab.key })}
          />
        ))}
      </div>


      {/* ── Progress bar — shown after generation ── */}
      {/* {state.topicsGenerated && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#000] dark:text-white">Topic Approval Progress</p>
              <p className="mt-0.5 text-xs text-pri">{totalApproved}/{computedTotalSubtopics} Topics Approved</p>
            </div>
            <span className="text-xs font-semibold text-color2">
              {computedTotalSubtopics > 0 ? Math.round((totalApproved / computedTotalSubtopics) * 100) : 0}% Complete
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-color2 transition-all duration-500"
              style={{ width: `${computedTotalSubtopics > 0 ? (totalApproved / computedTotalSubtopics) * 100 : 0}%` }}
            />
          </div>
        </div>
      )} */}

      {/* ── Section title ── */}
      <TableTitle
        title="Topics from Approved Syllabus"
        label={`${totalUnits} Units`}
        subLabel={`${totalTopics} Topics`}
      />

      {/* ── Unit tabs + accordion ── */}
      <div className="mt-4">
        <GenericTabs
          tabs={unitTabs}
          activeKey={state.activeTab}
          onChange={(unit) => handleTabChange(unit)}
          rightContent={
            (state.loadingUnits || state.loadingUnitDetail) ? (
              <div className="flex items-center gap-1.5 text-xs text-color2 font-semibold">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Loading unit details...
              </div>
            ) : null
          }
        />

        <AccordiansStyle
          loading={state.topicsLoading || (state.loadingUnitDetail && !activeUnitDetail)}
          loadingMessage={state.topicsLoading ? "Applying with NEURO AI..." : "Loading unit details..."}
          expandable={state.topicsGenerated}
          topics={state.topicsGenerated ? buildGeneratedTopics() : buildInitialTopics()}
          title={currentUnitTitle}
          subtitle={
            state.topicsGenerated
              ? "Click a topic to expand and review subtopics."
              : (activeUnitDetail?.callout_message ||
                activeUnitDetail?.selected_unit?.unit_overview ||
                activeUnitFromList?.unit_overview ||
                "NEURO AI will use these approved syllabus topics to create a Unit -> Topic -> Subtopics structure.")
          }
          topicCount={apiTopics?.length ?? activeUnitFromList?.topics_count ?? (state.topicsGenerated ? buildGeneratedTopics()?.length : buildInitialTopics()?.length)}
          onAddTopic={() => setAddTopicModal(true)}
          expandedSectionLabel={
            <><BookOpen className="h-3.5 w-3.5" /> Subtopics</>
          }
          footerContent={
            state.topicsGenerated ? (
              <><RefreshCw className="h-3 w-3" /> Review subtopics and approve each one. Click a Needs Review badge to approve.</>
            ) : (
              <><Sparkles className="h-4 w-4" /> {activeUnitDetail?.callout_message || "NEURO AI will use these approved syllabus topics to create a Unit -> Topic -> Subtopics structure."}</>
            )
          }
        />

        {/* ── Footer ── */}
        {state.topicsGenerated ? (
          <PageFooter
            content1={`Approved: ${totalApproved}/${computedTotalSubtopics} Topics`}
            content2={
              activeUnitDetail?.course_display_tag ||
              (state.courseDetail
                ? `Course: ${state.courseDetail.course_code} — ${state.courseDetail.course_title}`
                : "Course: CS309 — Computer Networks")
            }
            batch
            actionBtn1={
              state.topicsApproved
                ? {
                  label: "Next: Pedagogy",
                  icon: <Check className="h-4 w-4" />,
                  onClick: () => {
                    const cid = course_id || state.selectedCourse?.value || state.courseDetail?.id || activeUnitDetail?.course_id;
                    router.push(cid ? `/neurobe/pedagogy?course_id=${cid}` : "/neurobe/pedagogy");
                  },
                  className: "create-btn",
                }
                : {
                  label: state.approvingTopics ? "Approving..." : (activeUnitDetail?.bottom_bar?.actions?.approve_topics?.label || "Approve Topics"),
                  icon: state.approvingTopics ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />,
                  onClick: handleApproveTopics,
                  disabled: state.approvingTopics,
                }
            }
            actionBtn2={{
              label: state.savingDraft ? "Saving..." : (activeUnitDetail?.bottom_bar?.actions?.save_draft?.label || "Save Draft"),
              icon: state.savingDraft ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />,
              onClick: handleSaveDraft,
              disabled: state.savingDraft,
            }}
          />
        ) : (
          <PageFooter
            content1={
              activeUnitDetail?.course_display_tag ||
              (state.courseDetail
                ? `Course: ${state.courseDetail.course_code} — ${state.courseDetail.course_title}`
                : "Course: CS309 — Computer Networks")
            }
            content2={`${totalContactHours} Contact Hours · ${totalUnits} Units`}
            actionBtn1={{
              label: state.generatingTopics
                ? "Generating Topics..."
                : (activeUnitDetail?.cta_action?.label || "Generate Topics with NEURO AI"),
              icon: state.generatingTopics ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />,
              onClick: handleGenerateTopics,
              disabled: state.generatingTopics || (activeUnitDetail?.cta_action ? !activeUnitDetail.cta_action.enabled : false),
              className: "create-btn",
            }}
            actionBtn2={{
              label: state.savingDraft ? "Saving..." : (activeUnitDetail?.bottom_bar?.actions?.save_draft?.label || "Save Draft"),
              icon: state.savingDraft ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />,
              onClick: handleSaveDraft,
              disabled: state.savingDraft,
            }}
          />
        )}
      </div>

      {/* ── Add Topic modal ── */}
      <AddTopicModal
        open={addTopicModal}
        onClose={() => setAddTopicModal(false)}
        defaultUnit={state.activeTab}
        activeUnitNumber={activeUnitNum}
        courseCode={activeUnitDetail?.course_code || state.courseDetail?.course_code}
        courseTitle={activeUnitDetail?.course_title || state.courseDetail?.course_title}
        units={unitsList}
        onAdd={handleAddTopic}
      />

      {/* ── Edit Topic modal ── */}
      <EditTopicModal
        open={editTopicModal}
        onClose={() => setEditTopicModal(false)}
        topic={selectedTopicToEdit}
        defaultUnit={state.activeTab}
        activeUnitNumber={activeUnitNum}
        courseCode={activeUnitDetail?.course_code || state.courseDetail?.course_code}
        courseTitle={activeUnitDetail?.course_title || state.courseDetail?.course_title}
        units={unitsList}
        initialStatus={editModalInitialStatus}
        loading={updatingTopic}
        onUpdate={handleUpdateTopic}
      />

      {/* ── Generate Topics modal ── */}
      {state.showGenerateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ animation: "fadeIn 0.22s ease" }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setState({ showGenerateModal: false })} />
          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
            style={{ animation: "slideUp 0.22s ease" }}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 bg-[#111238] px-5 py-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-color2">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Generate Topics with NEURO AI</p>
                <p className="text-xs text-white/60">
                  {state.courseDetail
                    ? `${state.courseDetail.course_code} — ${state.courseDetail.course_title}`
                    : "CS309 — Computer Networks"}
                </p>
              </div>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5">
              {/* Progress */}
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-bold text-color2">Topics Generated Successfully</span>
                  <span className="text-sm font-bold text-color2">100%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div className="h-2 w-full rounded-full bg-color2 transition-all" />
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {GENERATE_STEPS.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-[#000] dark:text-white">{step.title}</p>
                      <p className="text-xs text-pri">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3 border-t px-6 py-4 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setState({ showGenerateModal: false })}
                className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setState({ showGenerateModal: false, topicsGenerated: true });
                  job_Data(state.jobId);
                }}
                className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                <Check className="h-3.5 w-3.5" /> Apply Topics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(Topics);
