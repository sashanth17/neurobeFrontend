import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Search,
  Layers,
  GraduationCap,
  Calendar,
  User,
  Plus,
  Edit3,
  Eye,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Clock,
  Check,
  ChevronDown,
  Filter,
  FileCheck2,
  BarChart2,
  SlidersHorizontal,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import useDebounce from "@/hook/useDebounce";
import PageBanner from "@/components/common-components/PageBanner";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import Models from "@/imports/models.import";
import GenerateQuestionsModal from "@/components/question-bank/GenerateQuestionsModal";
import { EditQuestionModal } from "@/components/academic-setup/Question-bank/EditQuestionModal";
import ViewQuestionModal from "@/components/question-bank/ViewQuestionModal";

interface CourseItem {
  id: number | string;
  course_id?: number | string;
  code: string;
  course_code?: string;
  title: string;
  course_title?: string;
  programme: string;
  batch: string;
  semester: string | number;
  students_count?: number;
  enrolled_students?: number | string;
  role?: string;
  faculty_role?: string;
  role_type?: "coordinator" | "instructor";
  questions_count?: number;
  approved_questions_count?: number;
  draft_questions_count?: number;
  units_count?: number;
}

interface MCQOption {
  key: "A" | "B" | "C" | "D";
  text: string;
  isCorrect?: boolean;
}

interface MCQQuestion {
  id: string;
  questionNumber: number;
  code?: string;
  question: string;
  unit: string;
  topic: string;
  subtopic?: string;
  co: string;
  level: "K1" | "K2" | "K3" | "K4";
  marks: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "approved" | "draft" | "review";
  options: MCQOption[];
  explanation: string;
}

const FALLBACK_COURSES: CourseItem[] = [
  {
    id: "c-101",
    code: "CS309",
    course_code: "CS309",
    title: "Computer Networks",
    course_title: "Computer Networks",
    programme: "B.Tech CSE",
    batch: "2024–2028",
    semester: "Semester 5",
    students_count: 64,
    role: "Course Coordinator",
    role_type: "coordinator",
    questions_count: 38,
    approved_questions_count: 28,
    draft_questions_count: 10,
    units_count: 5,
  },
  {
    id: "c-102",
    code: "CS301",
    course_code: "CS301",
    title: "Design and Analysis of Algorithms",
    course_title: "Design and Analysis of Algorithms",
    programme: "B.Tech CSE",
    batch: "2024–2028",
    semester: "Semester 5",
    students_count: 58,
    role: "Course Instructor",
    role_type: "instructor",
    questions_count: 24,
    approved_questions_count: 18,
    draft_questions_count: 6,
    units_count: 5,
  },
  {
    id: "c-103",
    code: "IT204",
    course_code: "IT204",
    title: "Database Management Systems",
    course_title: "Database Management Systems",
    programme: "B.Tech IT",
    batch: "2025–2029",
    semester: "Semester 3",
    students_count: 62,
    role: "Course Instructor",
    role_type: "instructor",
    questions_count: 30,
    approved_questions_count: 22,
    draft_questions_count: 8,
    units_count: 5,
  },
  {
    id: "c-104",
    code: "CS402",
    course_code: "CS402",
    title: "Cloud Computing & Distributed Systems",
    course_title: "Cloud Computing & Distributed Systems",
    programme: "B.Tech CSE",
    batch: "2023–2027",
    semester: "Semester 7",
    students_count: 52,
    role: "Course Coordinator",
    role_type: "coordinator",
    questions_count: 16,
    approved_questions_count: 12,
    draft_questions_count: 4,
    units_count: 5,
  },
];

const INITIAL_GENERATED_QUESTIONS: Record<string, MCQQuestion[]> = {
  CS309: [
    {
      id: "q-mcq-101",
      questionNumber: 1,
      code: "Q-CN-U1-01",
      question:
        "Which layer in the OSI reference model is responsible for packet forwarding and end-to-end logical address routing?",
      unit: "Unit 1: Network Models & Layered Architecture",
      topic: "1.1 OSI 7-Layer Reference Model",
      subtopic: "Network Layer Routing and Protocol Addressing",
      co: "CO1",
      level: "K1",
      marks: "2 Marks",
      difficulty: "Easy",
      status: "approved",
      options: [
        { key: "A", text: "Data Link Layer" },
        { key: "B", text: "Network Layer", isCorrect: true },
        { key: "C", text: "Transport Layer" },
        { key: "D", text: "Session Layer" },
      ],
      explanation:
        "The Network Layer (Layer 3) defines logical addresses (IP addresses) and routes packets across diverse interconnected networks.",
    },
    {
      id: "q-mcq-102",
      questionNumber: 2,
      code: "Q-CN-U1-02",
      question:
        "In a mesh topology having 8 interconnected host computers, what is the required count of duplex physical communication links?",
      unit: "Unit 1: Network Models & Layered Architecture",
      topic: "1.3 Network Topologies & Switching",
      subtopic: "Mesh Topology Physical Links Calculation",
      co: "CO1",
      level: "K2",
      marks: "2 Marks",
      difficulty: "Medium",
      status: "approved",
      options: [
        { key: "A", text: "16 links" },
        { key: "B", text: "28 links", isCorrect: true },
        { key: "C", text: "56 links" },
        { key: "D", text: "64 links" },
      ],
      explanation:
        "For N nodes in a full mesh network, links = N(N - 1) / 2. Here, 8 × 7 / 2 = 28 dedicated full-duplex communication links.",
    },
    {
      id: "q-mcq-103",
      questionNumber: 3,
      code: "Q-CN-U2-03",
      question:
        "Why does IEEE 802.3 standard Ethernet enforce a strict minimum frame payload length limit of 64 bytes for CSMA/CD operation?",
      unit: "Unit 2: Data Link Layer & MAC Protocols",
      topic: "2.2 MAC Protocols & Collision Detection",
      subtopic: "CSMA/CD Slot Time & Minimum Frame Size",
      co: "CO2",
      level: "K3",
      marks: "2 Marks",
      difficulty: "Medium",
      status: "draft",
      options: [
        { key: "A", text: "To optimize buffer memory allocation in switch hardware" },
        {
          key: "B",
          text: "To ensure the sender transmits long enough to detect collision across the maximum round-trip propagation delay",
          isCorrect: true,
        },
        { key: "C", text: "To restrict CRC calculation processing overhead" },
        { key: "D", text: "To adhere to physical twisted-pair impedance parameters" },
      ],
      explanation:
        "The transmission time of the frame must be at least twice the maximum propagation delay (2 × Tprop) so collisions are detected prior to frame transmission completion.",
    },
    {
      id: "q-mcq-104",
      questionNumber: 4,
      code: "Q-CN-U3-04",
      question:
        "An IPv4 address block is designated as 192.168.10.0/27. What is the maximum number of assignable valid host addresses within this subnet?",
      unit: "Unit 3: Network Layer & Routing Protocols",
      topic: "3.1 IPv4 Subnetting & CIDR",
      subtopic: "VLSM Subnet Calculation",
      co: "CO3",
      level: "K3",
      marks: "2 Marks",
      difficulty: "Hard",
      status: "draft",
      options: [
        { key: "A", text: "32 hosts" },
        { key: "B", text: "30 hosts", isCorrect: true },
        { key: "C", text: "62 hosts" },
        { key: "D", text: "14 hosts" },
      ],
      explanation:
        "With a /27 prefix mask, 5 bits remain for host addressing (32 - 27 = 5). Total usable host addresses = 2^5 - 2 = 30 (excluding network and broadcast addresses).",
    },
  ],
};

const UNITS_CONFIG = [
  {
    unitId: 1,
    label: "Unit 1",
    title: "Network Models & Layered Architecture",
    topics: ["1.1 OSI Reference Model", "1.2 TCP/IP Protocol Suite", "1.3 Network Topologies & Delay"],
  },
  {
    unitId: 2,
    label: "Unit 2",
    title: "Data Link Layer & MAC Protocols",
    topics: ["2.1 Framing & CRC Error Control", "2.2 CSMA/CD & MAC Protocols", "2.3 Ethernet Standards"],
  },
  {
    unitId: 3,
    label: "Unit 3",
    title: "Network Layer & Routing Protocols",
    topics: ["3.1 IPv4/IPv6 Addressing & CIDR", "3.2 Dijkstra & Link State Routing", "3.3 Congestion Control Algorithms"],
  },
  {
    unitId: 4,
    label: "Unit 4",
    title: "Transport Layer Protocols",
    topics: ["4.1 TCP Connection Lifecycle & 3-Way Handshake", "4.2 Sliding Window & Flow Control", "4.3 UDP Datagram Operations"],
  },
  {
    unitId: 5,
    label: "Unit 5",
    title: "Application Layer & Network Security",
    topics: ["5.1 DNS, HTTP/HTTPS, FTP", "5.2 Symmetric & Asymmetric Encryption", "5.3 Firewalls & Digital Signatures"],
  },
];

const MCQGenerationPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    search: "",
    roleFilter: "all" as "all" | "coordinator" | "instructor",
    loading: false,
    courses: [] as CourseItem[],
    selectedCourse: null as CourseItem | null,
    activeTab: "generator" as "generator" | "bank" | "sets",

    // Generator Form State
    selectedUnit: 1,
    selectedCO: "CO1",
    selectedDifficulty: "Medium" as "Easy" | "Medium" | "Hard",
    questionCount: 5,
    marksPerQuestion: "2",
    kCounts: {
      K1: 2,
      K2: 2,
      K3: 1,
      K4: 0,
    } as Record<string, number>,

    // Generated Questions Pool per Course
    courseQuestions: INITIAL_GENERATED_QUESTIONS as Record<string, MCQQuestion[]>,
    isGeneratingAI: false,

    // Modal states
    isGenerateModalOpen: false,
    isEditModalOpen: false,
    editingQuestion: null as MCQQuestion | null,
    viewQuestion: null as MCQQuestion | null,
    isViewModalOpen: false,
  });

  const debouncedSearch = useDebounce(state.search, 300);

  useEffect(() => {
    dispatch(setPageTitle("MCQ Generation"));
  }, [dispatch]);

  // Load assigned courses on mount
  useEffect(() => {
    fetchAssignedCourses();
  }, []);

  // Handle URL query for direct deep linking to a course
  useEffect(() => {
    if (router.query.course_id && state.courses.length > 0) {
      const found = state.courses.find(
        (c) =>
          String(c.id) === String(router.query.course_id) ||
          String(c.code).toLowerCase() === String(router.query.course_id).toLowerCase() ||
          String(c.course_code).toLowerCase() === String(router.query.course_id).toLowerCase()
      );
      if (found) {
        setState({ selectedCourse: found });
      }
    }
  }, [router.query.course_id, state.courses]);

  const fetchAssignedCourses = async () => {
    try {
      setState({ loading: true });
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const body = {
        faculty_id: user?.id || 1,
        coordinator_id: user?.id || 1,
      };

      const res: any = await Models.course.faculty_dashboard_overview(body).catch(() => null);
      const apiCourses: any[] = res?.courses || [];

      if (apiCourses.length > 0) {
        const formatted: CourseItem[] = apiCourses.map((c: any, idx: number) => {
          const roleType =
            c.role_type ||
            ((c.faculty_role || c.role || "").toLowerCase().includes("coordinator")
              ? "coordinator"
              : "instructor");

          return {
            id: c.id || `c-${idx + 1}`,
            course_id: c.id,
            code: c.course_code || c.code || `CS${300 + idx}`,
            course_code: c.course_code || c.code || `CS${300 + idx}`,
            title: c.course_title || c.title || "Academic Course",
            course_title: c.course_title || c.title || "Academic Course",
            programme: c.programme || "B.Tech CSE",
            batch: c.batch_name || c.batch || "2024–2028",
            semester: c.semester || c.term || "Semester 5",
            students_count: c.students_count || c.enrolled_students_count || 45,
            role: roleType === "coordinator" ? "Course Coordinator" : "Course Instructor",
            role_type: roleType,
            questions_count: 20 + idx * 6,
            approved_questions_count: 15 + idx * 4,
            draft_questions_count: 5 + idx * 2,
            units_count: 5,
          };
        });
        setState({ courses: formatted, loading: false });
      } else {
        // Fallback realistic courses
        setState({ courses: FALLBACK_COURSES, loading: false });
      }
    } catch (err) {
      console.error("Error loading assigned courses:", err);
      setState({ courses: FALLBACK_COURSES, loading: false });
    }
  };

  // Filtered courses
  const filteredCourses = state.courses.filter((course) => {
    const s = (debouncedSearch || "").toLowerCase().trim();
    const code = (course.code || course.course_code || "").toLowerCase();
    const title = (course.title || course.course_title || "").toLowerCase();
    const prog = (course.programme || "").toLowerCase();

    const matchesSearch = !s || code.includes(s) || title.includes(s) || prog.includes(s);
    const matchesRole =
      state.roleFilter === "all" ||
      (state.roleFilter === "coordinator" && course.role_type === "coordinator") ||
      (state.roleFilter === "instructor" && course.role_type !== "coordinator");

    return matchesSearch && matchesRole;
  });

  // Handle opening question management for a specific course
  const handleManageQuestions = (course: CourseItem) => {
    setState({ selectedCourse: course, activeTab: "generator" });
    router.replace(
      {
        pathname: router.pathname,
        query: { course_id: course.code || course.id },
      },
      undefined,
      { shallow: true }
    );
  };

  // Back to courses list
  const handleBackToCourses = () => {
    setState({ selectedCourse: null });
    router.replace(
      {
        pathname: router.pathname,
        query: {},
      },
      undefined,
      { shallow: true }
    );
  };

  // Get current active questions for selected course
  const currentCourseKey = state.selectedCourse?.code || state.selectedCourse?.course_code || "CS309";
  const currentQuestions = state.courseQuestions[currentCourseKey] || state.courseQuestions["CS309"] || [];

  // Generate Questions Simulation
  const handleGenerateQuestions = () => {
    setState({ isGeneratingAI: true });

    setTimeout(() => {
      const activeUnitObj = UNITS_CONFIG.find((u) => u.unitId === state.selectedUnit) || UNITS_CONFIG[0];
      const selectedTopic = activeUnitObj.topics[0];

      const newBatch: MCQQuestion[] = [
        {
          id: `q-gen-${Date.now()}-1`,
          questionNumber: currentQuestions.length + 1,
          code: `Q-${currentCourseKey}-U${state.selectedUnit}-0${currentQuestions.length + 1}`,
          question: `In the context of ${activeUnitObj.title}, what fundamental design criterion distinguishes connection-oriented transport from datagram communication?`,
          unit: `Unit ${state.selectedUnit}: ${activeUnitObj.title}`,
          topic: selectedTopic,
          subtopic: "Architecture & Protocols",
          co: state.selectedCO,
          level: "K2",
          marks: `${state.marksPerQuestion} Marks`,
          difficulty: state.selectedDifficulty,
          status: "draft",
          options: [
            { key: "A", text: "Static transmission power budget optimization" },
            {
              key: "B",
              text: "Explicit handshake state establishment and sequence synchronization prior to payload transfer",
              isCorrect: true,
            },
            { key: "C", text: "Physical fiber optic wave division multiplexing" },
            { key: "D", text: "Hop-by-hop framing and hardware parity verification" },
          ],
          explanation:
            "Connection-oriented protocols (like TCP) mandate pre-allocation of logical state, socket handshakes, and sequencing, unlike connectionless datagram transport.",
        },
        {
          id: `q-gen-${Date.now()}-2`,
          questionNumber: currentQuestions.length + 2,
          code: `Q-${currentCourseKey}-U${state.selectedUnit}-0${currentQuestions.length + 2}`,
          question: `Given a transmission scenario in ${selectedTopic}, how does the receiver verify data integrity using Cyclic Redundancy Check (CRC)?`,
          unit: `Unit ${state.selectedUnit}: ${activeUnitObj.title}`,
          topic: selectedTopic,
          subtopic: "Error Detection Mechanisms",
          co: state.selectedCO,
          level: "K3",
          marks: `${state.marksPerQuestion} Marks`,
          difficulty: state.selectedDifficulty,
          status: "draft",
          options: [
            { key: "A", text: "By subtracting the polynomial divisor using 2's complement logic" },
            {
              key: "B",
              text: "By executing modulo-2 polynomial division on the received payload and verifying a zero remainder",
              isCorrect: true,
            },
            { key: "C", text: "By summing all 16-bit word blocks in one's complement" },
            { key: "D", text: "By computing a cryptographic HMAC signature" },
          ],
          explanation:
            "In CRC verification, the receiver divides the received frame by the generator polynomial G(x) via modulo-2 arithmetic; a zero remainder indicates no bit errors.",
        },
      ];

      setState({
        courseQuestions: {
          ...state.courseQuestions,
          [currentCourseKey]: [...newBatch, ...currentQuestions],
        },
        isGeneratingAI: false,
      });
    }, 1200);
  };

  // Toggle approve question
  const handleToggleApprove = (questionId: string) => {
    const updated = currentQuestions.map((q) => {
      if (q.id === questionId) {
        return {
          ...q,
          status: q.status === "approved" ? "draft" : "approved",
        };
      }
      return q;
    });

    setState({
      courseQuestions: {
        ...state.courseQuestions,
        [currentCourseKey]: updated,
      },
    });
  };

  // Approve all questions
  const handleApproveAll = () => {
    const updated = currentQuestions.map((q) => ({
      ...q,
      status: "approved" as const,
    }));
    setState({
      courseQuestions: {
        ...state.courseQuestions,
        [currentCourseKey]: updated,
      },
    });
  };

  // Delete question
  const handleDeleteQuestion = (questionId: string) => {
    const updated = currentQuestions.filter((q) => q.id !== questionId);
    setState({
      courseQuestions: {
        ...state.courseQuestions,
        [currentCourseKey]: updated,
      },
    });
  };

  const totalAllocatedK = Object.values(state.kCounts || {}).reduce(
    (acc: number, val: any) => acc + (Number(val) || 0),
    0
  );

  return (
    <div className="min-h-screen pb-14">
      {/* ─────────────────────────────────────────────────────────────
          VIEW 1: ASSIGNED COURSES CARD LIST
          ───────────────────────────────────────────────────────────── */}
      {!state.selectedCourse ? (
        <div>
          {/* Top Banner */}
          <PageBanner
            badges={[
              {
                label: "Faculty / Staff",
                className: "bg-[#1244cc] text-white px-3.5 py-1 font-medium",
              },
              {
                label: "AI Question Generation Studio",
                dot: true,
                className:
                  "bg-[#043e2e] text-[#10b981] border border-[#065f46] px-3.5 py-1 font-medium",
              },
            ]}
            title="MCQ Question Generation"
            description="Select an assigned course to configure Bloom's taxonomy parameters, generate AI-aligned MCQ questions, manage question pools, and prepare tests."
            stats={[
              {
                label: "ASSIGNED COURSES",
                value: state.courses.length,
              },
              {
                label: "MCQ POOL QUESTIONS",
                value: state.courses.reduce((acc, c) => acc + (c.questions_count || 25), 0),
                valueColor: "text-[#10b981]",
              },
              {
                label: "PREPARED UNITS",
                value: "5 Units",
              },
            ]}
          />

          {/* Search, Filter, and Controls Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-white">
                <span>My Assigned Courses</span>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                  {filteredCourses.length} {filteredCourses.length === 1 ? "Course" : "Courses"}
                </span>
              </h2>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                Click <strong>Manage Questions</strong> on any assigned course to enter the MCQ Question Generation workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={state.search}
                  onChange={(e) => setState({ search: e.target.value })}
                  placeholder="Search course code or title..."
                  className="h-10 w-64 rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* Role Toggle Pills */}
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
                <button
                  type="button"
                  onClick={() => setState({ roleFilter: "all" })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    state.roleFilter === "all"
                      ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setState({ roleFilter: "coordinator" })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    state.roleFilter === "coordinator"
                      ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
                >
                  Coordinator
                </button>
                <button
                  type="button"
                  onClick={() => setState({ roleFilter: "instructor" })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    state.roleFilter === "instructor"
                      ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
                >
                  Instructor
                </button>
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {state.loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/40"
                />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                No assigned courses match your search.
              </p>
              <button
                type="button"
                onClick={() => setState({ search: "", roleFilter: "all" })}
                className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => {
                const code = course.code || course.course_code || "";
                const title = course.title || course.course_title || "";
                const isCoordinator = course.role_type === "coordinator";
                const totalQ = course.questions_count || 32;
                const approvedQ = course.approved_questions_count || 24;

                return (
                  <div
                    key={course.id}
                    className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/95 dark:hover:border-indigo-700"
                  >
                    <div>
                      {/* Header Tags */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-lg bg-indigo-600/10 px-2.5 py-1 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
                            {code}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-[11px] font-semibold ${
                              isCoordinator
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            }`}
                          >
                            {isCoordinator ? "Course Coordinator" : "Instructor"}
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          <Sparkles className="h-3 w-3 text-indigo-500" />
                          <span>AI Ready</span>
                        </span>
                      </div>

                      {/* Course Title */}
                      <h3 className="mt-3.5 text-base font-bold tracking-tight text-slate-900 line-clamp-1 dark:text-white">
                        {title}
                      </h3>

                      {/* Metadata Grid */}
                      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                        <div className="flex items-center gap-1.5 truncate">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{course.programme}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">Batch {course.batch}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{course.semester}</span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">
                            {course.students_count || 40} Students
                          </span>
                        </div>
                      </div>

                      {/* Question Pool Summary Pill Box */}
                      <div className="mt-3.5 rounded-xl border border-slate-100 bg-indigo-50/40 p-3 dark:border-slate-800 dark:bg-indigo-950/20">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            MCQ Question Pool
                          </span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {totalQ} Questions
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {approvedQ} Approved
                          </span>
                          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {totalQ - approvedQ} In Draft
                          </span>
                          <span>5 Units</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleManageQuestions(course)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-color1 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-color1/90 active:scale-[0.98]"
                      >
                        <span>Manage Questions</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setState({
                            selectedCourse: course,
                            isGenerateModalOpen: true,
                          });
                        }}
                        title="Quick Generate with AI"
                        className="flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2.5 text-indigo-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 dark:border-gray-700 dark:bg-gray-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
           VIEW 2: MCQ QUESTION GENERATION SCREEN (Active Course)
           ───────────────────────────────────────────────────────────── */
        <div>
          {/* Back & Course Switcher Navigation Bar */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBackToCourses}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Assigned Courses</span>
            </button>

            {/* Course Switcher Dropdown */}
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

              <button
                type="button"
                onClick={() => setState({ isGenerateModalOpen: true })}
                className="flex items-center gap-1.5 rounded-xl bg-color1 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-color1/90"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>+ Custom AI Modal</span>
              </button>
            </div>
          </div>

          {/* Course Banner */}
          <CourseBanner
            courseCode={state.selectedCourse.code || state.selectedCourse.course_code || "CS309"}
            courseTitle={state.selectedCourse.title || state.selectedCourse.course_title || "Computer Networks"}
            description="Staff MCQ Question Generation Studio — Design, calibrate Bloom's taxonomy knowledge levels, generate AI questions, review options, and manage the course question pool."
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

          {/* Tabs bar */}
          <div className="mb-6 flex border-b border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setState({ activeTab: "generator" })}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                state.activeTab === "generator"
                  ? "border-color1 text-color1 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Generation Studio</span>
            </button>

            <button
              type="button"
              onClick={() => setState({ activeTab: "bank" })}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                state.activeTab === "bank"
                  ? "border-color1 text-color1 dark:border-indigo-400 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <FileCheck2 className="h-4 w-4" />
              <span>Course Question Bank</span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {currentQuestions.length}
              </span>
            </button>
          </div>

          {/* TAB 1: AI GENERATION STUDIO */}
          {state.activeTab === "generator" && (
            <div className="space-y-6">
              {/* Interactive Generation Control Panel */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-color1/10 text-color1">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        AI MCQ Question Generator
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Configure syllabus unit, Bloom&apos;s cognitive taxonomy, and question count.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Syllabus Aligned
                    </span>
                  </div>
                </div>

                {/* Configuration Grid */}
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                  {/* 1. Unit Selector */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Target Syllabus Unit
                    </label>
                    <select
                      value={state.selectedUnit}
                      onChange={(e) => setState({ selectedUnit: Number(e.target.value) })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      {UNITS_CONFIG.map((u) => (
                        <option key={u.unitId} value={u.unitId}>
                          {u.label}: {u.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. Course Outcome */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Course Outcome (CO)
                    </label>
                    <select
                      value={state.selectedCO}
                      onChange={(e) => setState({ selectedCO: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="CO1">CO1 — Foundational Architectures</option>
                      <option value="CO2">CO2 — Data Link Framing & Protocols</option>
                      <option value="CO3">CO3 — Network Subnetting & Routing</option>
                      <option value="CO4">CO4 — Transport Layer Services</option>
                      <option value="CO5">CO5 — Application Protocols & Security</option>
                    </select>
                  </div>

                  {/* 3. Difficulty */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Difficulty Level
                    </label>
                    <div className="flex gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
                      {(["Easy", "Medium", "Hard"] as const).map((diff) => (
                        <button
                          key={diff}
                          type="button"
                          onClick={() => setState({ selectedDifficulty: diff })}
                          className={`flex-1 rounded-lg py-1 text-xs font-semibold transition-all ${
                            state.selectedDifficulty === diff
                              ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-white"
                              : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Question Count & Marks */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Questions & Marks
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={state.questionCount}
                        onChange={(e) => setState({ questionCount: Number(e.target.value) })}
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value={2}>2 Questions</option>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                        <option value={15}>15 Questions</option>
                      </select>

                      <select
                        value={state.marksPerQuestion}
                        onChange={(e) => setState({ marksPerQuestion: e.target.value })}
                        className="w-24 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="1">1 Mark</option>
                        <option value="2">2 Marks</option>
                        <option value="4">4 Marks</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bloom's Taxonomy Distribution Counters */}
                <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Bloom&apos;s Taxonomy Level Distribution
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {`Total Allocated: ${totalAllocatedK}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { key: "K1", label: "K1: Remember" },
                      { key: "K2", label: "K2: Understand" },
                      { key: "K3", label: "K3: Apply" },
                      { key: "K4", label: "K4: Analyze" },
                    ].map((lvl) => (
                      <div
                        key={lvl.key}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {lvl.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setState({
                                kCounts: {
                                  ...state.kCounts,
                                  [lvl.key]: Math.max(0, (state.kCounts[lvl.key] || 0) - 1),
                                },
                              })
                            }
                            className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-xs font-bold hover:bg-gray-200 dark:bg-gray-700"
                          >
                            -
                          </button>
                          <span className="w-5 text-center text-xs font-bold">
                            {state.kCounts[lvl.key] ?? 0}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setState({
                                kCounts: {
                                  ...state.kCounts,
                                  [lvl.key]: (state.kCounts[lvl.key] || 0) + 1,
                                },
                              })
                            }
                            className="flex h-5 w-5 items-center justify-center rounded bg-gray-100 text-xs font-bold hover:bg-gray-200 dark:bg-gray-700"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                    disabled={state.isGeneratingAI}
                    onClick={handleGenerateQuestions}
                    className="flex items-center gap-2 rounded-xl bg-color1 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition-all hover:bg-color1/90 active:scale-[0.98] disabled:opacity-60"
                  >
                    {state.isGeneratingAI ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Generating Questions with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Questions Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Generated Question Pool Section */}
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Questions for {currentCourseKey}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Review options, Bloom&apos;s level, explanation, and approve into the official Question Bank.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApproveAll}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve All to Bank</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push(`/neurobe/mcq-test-execution?course_id=${currentCourseKey}`)}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    >
                      <span>Create MCQ Test</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-4">
                  {currentQuestions.map((q, idx) => {
                    const isApproved = q.status === "approved";

                    return (
                      <div
                        key={q.id}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 dark:border-gray-800 dark:bg-gray-900"
                      >
                        {/* Top Metadata Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-800">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {idx + 1}
                            </span>
                            <span className="font-mono text-xs font-bold text-gray-500">
                              {q.code}
                            </span>
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                              {q.co}
                            </span>
                            <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              {q.level}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {q.marks}
                            </span>
                            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              {q.difficulty}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isApproved ? "bg-emerald-500" : "bg-amber-500"
                                }`}
                              />
                              {isApproved ? "Approved" : "Draft / Review"}
                            </span>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="mt-3.5">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {q.question}
                          </p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {q.unit} • {q.topic}
                          </p>
                        </div>

                        {/* 4 Options Grid */}
                        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                          {q.options.map((opt) => (
                            <div
                              key={opt.key}
                              className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs transition-colors ${
                                opt.isCorrect
                                  ? "border-emerald-300 bg-emerald-50/70 font-semibold text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                  : "border-gray-200 bg-gray-50/50 text-gray-700 dark:border-gray-800 dark:bg-gray-800/40 dark:text-gray-300"
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold ${
                                  opt.isCorrect
                                    ? "bg-emerald-600 text-white"
                                    : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {opt.key}
                              </span>
                              <span className="flex-1">{opt.text}</span>
                              {opt.isCorrect && (
                                <span className="ml-auto inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                  Correct
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Explanation Box */}
                        {q.explanation && (
                          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/40 dark:text-slate-400">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Rationale / Explanation:{" "}
                            </span>
                            {q.explanation}
                          </div>
                        )}

                        {/* Card Bottom Actions */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleApprove(q.id)}
                              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                isApproved
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                  : "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>{isApproved ? "Approved ✓" : "Approve to Bank"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setState({
                                  editingQuestion: q,
                                  isEditModalOpen: true,
                                })
                              }
                              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setState({
                                  viewQuestion: q,
                                  isViewModalOpen: true,
                                })
                              }
                              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Details</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COURSE QUESTION BANK */}
          {state.activeTab === "bank" && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Question Bank Pool ({currentQuestions.length} Questions)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Repository of vetted multiple-choice questions for test construction.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setState({ isGenerateModalOpen: true })}
                  className="flex items-center gap-1.5 rounded-xl bg-color1 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-color1/90"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {currentQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-colors hover:bg-slate-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {q.code}
                        </span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {q.question}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {q.unit} • {q.co} • {q.level} • {q.marks}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          q.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {q.status === "approved" ? "Approved" : "Draft"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setState({ viewQuestion: q, isViewModalOpen: true })}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integrated Modals */}
          <GenerateQuestionsModal
            open={state.isGenerateModalOpen}
            onClose={() => setState({ isGenerateModalOpen: false })}
            courseCode={`${currentCourseKey} — ${state.selectedCourse.title || "Computer Networks"}`}
            onSubmit={(data) => {
              console.log("Generate modal data:", data);
              handleGenerateQuestions();
            }}
          />

          <EditQuestionModal
            open={state.isEditModalOpen}
            onClose={() => setState({ isEditModalOpen: false, editingQuestion: null })}
            topicLabel={`${currentCourseKey} — ${state.selectedCourse.title}`}
            code={state.editingQuestion?.code || "Q-MCQ-01"}
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
                question: state.viewQuestion.question,
                optionA: state.viewQuestion.options[0]?.text,
                optionB: state.viewQuestion.options[1]?.text,
                optionC: state.viewQuestion.options[2]?.text,
                optionD: state.viewQuestion.options[3]?.text,
                correctAnswer:
                  state.viewQuestion.options.find((o) => o.isCorrect)?.key || "A",
                explanation: state.viewQuestion.explanation,
                course: currentCourseKey,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MCQGenerationPage;
