import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Users,
  Sparkles,
  Database,
  BriefcaseBusiness,
  Compass,
  Search,
  FileCode,
  HelpCircle,
  FileText,
  GitBranch,
  Layers,
  GraduationCap,
  Calendar,
  BookOpen,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import { useRouter } from "next/router";
import PageHeader from "@/components/common-components/PageHeader";
import QuestionBankFilter, {
  FilterValues,
} from "@/components/question-bank/QuestionBankFilter";
import QuestionCard, {
  QuestionCardProps,
} from "@/components/question-bank/QuestionCard";
import QuestionDetailCard from "@/components/question-bank/QuestionDetailCard";
import TabButton from "@/components/common-components/TabButton";
import GenericTabs from "@/components/common-components/GenericTabs";
import { QUS_TABS, UNIT_LIST, UNIT_TABS } from "@/utils/constant.utils";
import { EditQuestionModal } from "@/components/academic-setup/Question-bank/EditQuestionModal";
import ViewQuestionModal from "@/components/question-bank/ViewQuestionModal";
import GenerateQuestionsModal from "@/components/question-bank/GenerateQuestionsModal";
import QuestionSetsHeader from "@/components/question-bank/QuestionSetsHeader";
import QuestionSetsSearch from "@/components/question-bank/QuestionSetsSearch";
import QuestionSetBanner from "@/components/question-bank/QuestionSetBanner";
import QuestionSetCard, {
  QuestionSetCardProps,
} from "@/components/question-bank/QuestionSetCard";
import SyllabusStructureSidebar from "@/components/question-bank/SyllabusStructureSidebar";
import CourseReferencesCard, {
  ReferenceItem,
} from "@/components/academic-setup/CourseReferencesCard";
import SyllabusHeaderCard from "@/components/academic-setup/SyllabusHeaderCard";
import CourseInformationCard from "@/components/academic-setup/CourseInformationCard";
import CourseOutcomesCard from "@/components/academic-setup/CourseOutcomesCard";
import UnitWiseSyllabusCard from "@/components/academic-setup/UnitWiseSyllabusCard";
import TheoryAndLabCard from "@/components/academic-setup/TheoryAndLabCard";
import TextbooksCard from "@/components/academic-setup/TextbooksCard";
import ReferenceBooksCard from "@/components/academic-setup/ReferenceBooksCard";
import MappingRationaleCard from "@/components/academic-setup/MappingRationaleCard";
import CopoMappingMatrixCard from "@/components/academic-setup/CopoMappingMatrixCard";
import CourseTopicsCard from "@/components/academic-setup/CourseTopicsCard";
import PedagogyTopicsCard from "@/components/academic-setup/PedagogyTopicsCard";
import LessonPlanTopicsCard from "@/components/academic-setup/LessonPlanTopicsCard";
import LearningMaterialsCard from "@/components/academic-setup/LearningMaterialsCard";
import QuestionBankTopicsCard from "@/components/academic-setup/QuestionBankTopicsCard";
import CIAQuestionPapersCard from "@/components/academic-setup/CIAQuestionPapersCard";
import CIAPaperHeaderCard from "@/components/academic-setup/CIAPaperHeaderCard";
import CIAQuestionPaperViewCard from "@/components/academic-setup/CIAQuestionPaperViewCard";

const QUESTION_SETS: QuestionSetCardProps[] = [
  {
    id: "set-01",
    unit: "Unit 1",
    date: "Aug 18, 2025",
    title: "Unit 1 — Network Models — Set 01",
    topicSummary: "Network Models & Layered Architecture",
    total: 4,
    draft: 2,
    review: 0,
    approved: 2,
    accentColor: "#f97316",
    unitColor: "#fff7ed",
  },
  {
    id: "set-02",
    unit: "Unit 1",
    date: "Aug 19, 2025",
    title: "Unit 1 — Physical Layer — Set 02",
    topicSummary: "Physical Layer & Transmission Media",
    total: 1,
    draft: 0,
    review: 1,
    approved: 0,
    accentColor: "#22c55e",
    unitColor: "#f0fdf4",
  },
  {
    id: "set-03",
    unit: "Unit 2",
    date: "Aug 20, 2025",
    title: "Unit 2 — Error Detection — Set 03",
    topicSummary: "3 Topics • 3 Subtopics",
    total: 5,
    draft: 1,
    review: 1,
    approved: 3,
    accentColor: "#a855f7",
    unitColor: "#faf5ff",
  },
  {
    id: "set-04",
    unit: "Unit 3",
    date: "Aug 21, 2025",
    title: "Unit 3 — IPv4 Subnetting — Set 04",
    topicSummary: "3 Topics • 3 Subtopics",
    total: 4,
    draft: 1,
    review: 0,
    approved: 3,
    accentColor: "#3b82f6",
    unitColor: "#eff6ff",
  },
  {
    id: "set-05",
    unit: "Unit 4",
    date: "Aug 21, 2025",
    title: "Unit 4 — Transport Protocols — Set 05",
    topicSummary: "3 Topics • 3 Subtopics",
    total: 2,
    draft: 0,
    review: 0,
    approved: 2,
    accentColor: "#f59e0b",
    unitColor: "#fffbeb",
  },
  {
    id: "set-06",
    unit: "Unit 5",
    date: "Aug 22, 2025",
    title: "Unit 5 — Application Layer — Set 06",
    topicSummary: "3 Topics • 3 Subtopics",
    total: 4,
    draft: 1,
    review: 1,
    approved: 2,
    accentColor: "#10b981",
    unitColor: "#ecfdf5",
  },
];

const SAMPLE_QUESTIONS: QuestionCardProps[] = [
  {
    id: "Q-CN-001",
    question:
      "What is the total latency for transmitting a 1,500 Byte packet over a 100 Mbps link with a physical length of 10 km (signal velocity = 2 × 10^8 m/s)?",
    unit: "Unit 1",
    topic: "Network Performance Metrics",
    subtopic: "Propagation vs Transmission Delay Calculations",
    tags: [
      { label: "CO1" },
      { label: "K3" },
      { label: "MCQ" },
      { label: "2 Marks" },
      { label: "Medium" },
    ],
    specialTag: { label: "Eligible for MCQ Tests", color: "green" },
    status: "approved",
  },
  {
    id: "Q-CN-004",
    question:
      "Why does CSMA/CD enforce a minimum frame size constraint (e.g., 64 bytes) on IEEE 802.3 Ethernet networks?",
    unit: "Unit 2",
    topic: "Medium Access Control (MAC) Sublayer",
    subtopic: "CSMA/CD & Exponential Backoff Algorithm",
    tags: [
      { label: "CO2" },
      { label: "K3" },
      { label: "MCQ" },
      { label: "2 Marks" },
      { label: "Medium" },
    ],
    specialTag: { label: "Pending Approval", color: "orange" },
    status: "reviewed",
  },
  {
    id: "Q-CN-007",
    question:
      "In a Go-Back-N ARQ protocol utilizing a 4-bit sequence number, what is the maximum sender window size (W_s) permissible to avoid ambiguous frame acceptance?",
    unit: "Unit 2",
    topic: "Sliding Window Flow Control Protocols",
    subtopic: "Go-Back-N ARQ Window Sizing and Timers",
    tags: [
      { label: "CO2" },
      { label: "K3" },
      { label: "MCQ" },
      { label: "2 Marks" },
      { label: "Medium" },
    ],
    status: "approved",
  },
];

const SET_QUESTIONS: QuestionCardProps[] = [
  {
    id: "Q-CN-029",
    question:
      "Which layer of the OSI reference model is primarily responsible for end-to-end packet routing and logical network addressing across heterogeneous subnetworks?",
    unit: "Unit 1",
    topic: "Network Models & Layered Architecture",
    subtopic: "OSI 7-Layer Reference Model",
    tags: [
      { label: "CO1" },
      { label: "K2" },
      { label: "MCQ" },
      { label: "2 Marks" },
      { label: "Easy" },
    ],
    specialTag: { label: "Pending Review", color: "gray" },
    status: "draft",
  },
  {
    id: "Q-CN-001",
    question:
      "Which layer of the OSI reference model is primarily responsible for end-to-end packet routing and logical network addressing across heterogeneous subnetworks?",
    unit: "Unit 1",
    topic: "Network Models & Layered Architecture",
    subtopic: "OSI 7-Layer Reference Model",
    tags: [
      { label: "CO1" },
      { label: "K2" },
      { label: "MCQ" },
      { label: "2 Marks" },
      { label: "Easy" },
    ],
    specialTag: { label: "Eligible for MCQ Tests", color: "green" },
    status: "approved",
  },
  {
    id: "Q-CN-003",
    question:
      "In a mesh network topology with N nodes, what is the exact number of dedicated full-duplex physical links required to achieve complete inter-node interconnection?",
    unit: "Unit 1",
    topic: "Network Topologies & Switching Techniques",
    subtopic: "Packet Switching vs Circuit Switching",
    tags: [
      { label: "CO1" },
      { label: "K2" },
      { label: "MCQ" },
      { label: "2 Marks" },
      { label: "Medium" },
    ],
    specialTag: { label: "Pending Review", color: "gray" },
    status: "draft",
  },
];

const SYLLABUS_HEADER_DATA = {
  bannerProgramme: "B.Tech CSE",
  bannerBatch: "2025–2029",
  bannerSemester: "3",
  courseCode: "CS309",
  courseTitle: "Computer Networks",
  subtitle: "Approved course syllabus, outcomes, units and prescribed references.",
  approvedBy: "Dr. Arun Kumar",
  approvedDate: "18 Aug 2026",
  unitsCountText: "5 Units • CO1–CO5",
  versionBadgeText: "Approved v1.0",
  tabs: [
    { key: "course-info", label: "Course Info" },
    { key: "course-outcomes", label: "Course Outcomes" },
    { key: "unit-syllabus", label: "Unit-wise Syllabus" },
    { key: "theory-lab", label: "Theory & Lab" },
    { key: "textbooks", label: "Textbooks" },
    { key: "reference-books", label: "Reference Books" },
  ],
  creditStats: [
    { label: "L (Lecture)", value: "3", isPurpleLabel: true },
    { label: "T (Tutorial)", value: "0", isPurpleLabel: true },
    { label: "P (Practical)", value: "2", isPurpleLabel: true },
    { label: "C (Credits)", value: "4", isHighlighted: true, isPurpleLabel: true },
    { label: "Theory Hours", value: "45" },
    { label: "Lab Hours", value: "30" },
  ],
};

const REFERENCE_HEADER_DATA_MAP: Record<
  string,
  {
    title: string;
    icon: React.ReactNode;
    subtitle: string;
    approvedBy: string;
    approvedDate: string;
    unitsCountText: string;
    versionBadgeText: string;
  }
> = {
  syllabus: {
    title: "Syllabus",
    icon: <BookOpen className="h-6 w-6" />,
    subtitle: "Approved course syllabus, outcomes, units and prescribed references.",
    approvedBy: "Dr. Arun Kumar",
    approvedDate: "18 Aug 2026",
    unitsCountText: "5 Units • CO1–CO5",
    versionBadgeText: "Approved v1.0",
  },
  copo: {
    title: "CO–PO Mapping",
    icon: <GitBranch className="h-6 w-6" />,
    subtitle: "View the approved mapping between Course Outcomes and Program Outcomes.",
    approvedBy: "Dr. Arun Kumar",
    approvedDate: "20 Aug 2026",
    unitsCountText: "11 Program Outcomes",
    versionBadgeText: "Approved v1.0",
  },
  topics: {
    title: "Topics",
    icon: <Layers className="h-6 w-6" />,
    subtitle: "View the approved topic hierarchy for this course.crea",
    approvedBy: "Dr. Arun Kumar",
    approvedDate: "21 Aug 2026",
    unitsCountText: "5 Units • 20 Main Topics",
    versionBadgeText: "Approved v1.0",
  },
  pedagogy: {
    title: "Pedagogy",
    icon: <GraduationCap className="h-6 w-6" />,
    subtitle: "View the approved teaching approaches assigned to each course topic.",
    approvedBy: "Dr. Arun Kumar",
    approvedDate: "22 Aug 2026",
    unitsCountText: "4 Delivery Modes",
    versionBadgeText: "Approved v1.0",
  },
  "lesson-plan": {
    title: "Lesson Plan",
    icon: <Calendar className="h-6 w-6" />,
    subtitle: "View the approved course delivery plan by unit and topic.",
    approvedBy: "Dr. Arun Kumar",
    approvedDate: "23 Aug 2026",
    unitsCountText: "45 Planned Sessions",
    versionBadgeText: "Approved v1.0",
  },
  "learning-materials": {
    title: "Learning Materials",
    icon: <BookOpen className="h-6 w-6" />,
    subtitle: "Course lecture notes, slide decks, and reference study guides.",
    approvedBy: "Dr. Arun Kumar",
    approvedDate: "24 Aug 2026",
    unitsCountText: "6 Approved Materials",
    versionBadgeText: "Approved v1.0",
  },
  "question-bank": {
    title: "Question Bank",
    icon: <HelpCircle className="h-6 w-6" />,
    subtitle: "Comprehensive repository of approved questions.",
    approvedBy: "Dr. Arun Kumar",
    approvedDate: "25 Aug 2026",
    unitsCountText: "12 Approved Questions",
    versionBadgeText: "Approved v1.0",
  },
  "cia-papers": {
    title: "CIA Question Papers",
    icon: <FileCode className="h-6 w-6" />,
    subtitle: "Continuous Internal Assessment question papers.",
    approvedBy: "Dr. Arun Kumar",
    approvedDate: "26 Aug 2026",
    unitsCountText: "3 Approved Papers",
    versionBadgeText: "Approved v1.0",
  },
};

const COURSE_OUTCOMES_DATA = {
  title: "COURSE OUTCOMES",
  approvedCountText: "5 Approved Statements",
  outcomes: [
    {
      id: "co1",
      coCode: "CO1",
      statement: "Understand network architectures, reference models and physical-layer fundamentals.",
      knowledgeLevel: "K2",
    },
    {
      id: "co2",
      coCode: "CO2",
      statement: "Analyze data-link protocols, framing, error control and medium-access techniques.",
      knowledgeLevel: "K4",
    },
    {
      id: "co3",
      coCode: "CO3",
      statement: "Apply IP addressing, subnetting and routing concepts.",
      knowledgeLevel: "K3",
    },
    {
      id: "co4",
      coCode: "CO4",
      statement: "Explain transport-layer protocols and mechanisms.",
      knowledgeLevel: "K2",
    },
    {
      id: "co5",
      coCode: "CO5",
      statement: "Explain application-layer protocols and services.",
      knowledgeLevel: "K2",
    },
  ],
  coverageUnitsText: "5 Units",
  coverageTheoryHoursText: "45 Theory Hours",
  coverageLabHoursText: "30 Lab Hours",
  coverageTopicsText: "35 Syllabus Topics",
};

const UNIT_WISE_SYLLABUS_DATA = {
  title: "UNIT-WISE SYLLABUS",
  headerStatsText: "5 Units · 35 Ordered Topics",
  units: [
    {
      id: "unit-1",
      unitNumber: 1,
      unitTitle: "Introduction & Physical Layer",
      hoursText: "9 Hours",
      topicsCountText: "7 Topics",
      topics: [
        { code: "1.1", title: "Fundamentals of Computer Networks and Data Communication" },
        { code: "1.2", title: "Network Architecture, Components and Communication Models" },
        { code: "1.3", title: "Layered Network Architecture and Protocol Design Principles" },
        { code: "1.4", title: "OSI Reference Model and Functions of Individual Layers" },
        { code: "1.5", title: "TCP/IP Reference Model and Comparison with the OSI Model" },
        { code: "1.6", title: "Physical Layer Concepts, Signals and Data Transmission Fundamentals" },
        { code: "1.7", title: "Guided and Unguided Transmission Media for Computer Networks" },
      ],
    },
    {
      id: "unit-2",
      unitNumber: 2,
      unitTitle: "Data Link Layer & MAC Sublayer",
      hoursText: "9 Hours",
      topicsCountText: "7 Topics",
      topics: [
        { code: "2.1", title: "Data Link Layer Services and Frame Organization" },
        { code: "2.2", title: "Framing Methods and Data Link Control Mechanisms" },
        { code: "2.3", title: "Error Detection Techniques using Parity, Checksum and CRC" },
        { code: "2.4", title: "Error Correction Methods and Reliable Data Transmission" },
        { code: "2.5", title: "Flow Control and Automatic Repeat Request Protocols" },
        { code: "2.6", title: "Medium Access Control Techniques for Shared Communication Channels" },
        { code: "2.7", title: "Ethernet Architecture, Frame Format and MAC Addressing" },
      ],
    },
  ],
};

const THEORY_AND_LAB_DATA = {
  title: "THEORY & LABORATORY",
  headerSubtitle: "Curriculum Allocation",
  theoryHours: "45",
  theoryWeeklyHours: "3 Hours / Week",
  labHours: "30",
  labWeeklyHours: "2 Hours / Week",
  labExperimentsTitle: "LAB EXPERIMENTS",
  experiments: [
    { id: "exp-1", title: "Study of network configuration and addressing" },
    { id: "exp-2", title: "Packet capture and protocol analysis" },
    { id: "exp-3", title: "IPv4 subnetting exercise" },
    { id: "exp-[#4]", title: "Static and dynamic routing configuration" },
    { id: "exp-5", title: "TCP / UDP communication analysis" },
    { id: "exp-6", title: "DNS and HTTP protocol observation" },
  ],
};

const TEXTBOOKS_DATA = {
  title: "TEXTBOOKS",
  headerSubtitle: "Approved Prescribed Literature",
  textbooks: [
    {
      id: "tb-1",
      title: "Computer Networks",
      authors: "Andrew S. Tanenbaum, David J. Wetherall",
      publisher: "Pearson · 5th Edition",
    },
  ],
};

const REFERENCE_BOOKS_DATA = {
  title: "REFERENCE BOOKS",
  headerSubtitle: "Supplementary Academic References",
  references: [
    {
      id: "ref-1",
      title: "Data Communications and Networking",
      authors: "Behrouz A. Forouzan",
      publisher: "McGraw Hill",
    },
    {
      id: "ref-2",
      title: "Computer Networking: A Top-Down Approach",
      authors: "James F. Kurose, Keith W. Ross",
      publisher: "Pearson",
    },
  ],
};

const MAPPING_RATIONALE_DATA = {
  title: "MAPPING RATIONALE",
  subtitle: "Why each Course Outcome is mapped to the selected Program Outcomes.",
  headerStatsText: "5 Outcome Rationales",
  items: [
    {
      id: "co1",
      coCode: "CO1",
      statement:
        "Understand network architectures, reference models and physical-layer fundamentals.",
      mappedCountText: "3 mapped outcomes",
      poItems: [
        {
          id: "po1-1",
          poCode: "PO1",
          poTitle: "Engineering Knowledge",
          strengthText: "Strength: 3 (High)",
          strengthBadgeClass:
            "bg-[#f5f3ff] text-color2 dark:bg-purple-950/60 dark:text-purple-300",
          rationale:
            "The outcome requires students to apply core engineering and computing knowledge to understand network architectures and protocol models.",
        },
        {
          id: "po1-2",
          poCode: "PO2",
          poTitle: "Problem Analysis",
          strengthText: "Strength: 2 (Medium)",
          strengthBadgeClass:
            "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
          rationale:
            "Students interpret and compare networking models and communication structures using engineering principles.",
        },
        {
          id: "po1-5",
          poCode: "PO5",
          poTitle: "Modern Tool Usage",
          strengthText: "Strength: 1 (Low)",
          strengthBadgeClass:
            "bg-gray-100 text-[#000] dark:bg-gray-800 dark:text-gray-300",
          rationale:
            "Students examine packet structures and basic physical transmission concepts using simulation tools and network diagnostic utilities.",
        },
      ],
    },
    {
      id: "co2",
      coCode: "CO2",
      statement:
        "Analyze data-link protocols, framing, error control and medium-access techniques.",
      mappedCountText: "3 mapped outcomes",
      poItems: [
        {
          id: "po2-1",
          poCode: "PO1",
          poTitle: "Engineering Knowledge",
          strengthText: "Strength: 3 (High)",
          strengthBadgeClass:
            "bg-[#f5f3ff] text-color2 dark:bg-purple-950/60 dark:text-purple-300",
          rationale:
            "Outcome requires analytical evaluation of error detection and flow control algorithms at the data link layer.",
        },
        {
          id: "po2-2",
          poCode: "PO2",
          poTitle: "Problem Analysis",
          strengthText: "Strength: 3 (High)",
          strengthBadgeClass:
            "bg-[#f5f3ff] text-color2 dark:bg-purple-950/60 dark:text-purple-300",
          rationale:
            "Students analyze framing methods and error correction techniques for efficient transmission.",
        },
      ],
    },
    {
      id: "co3",
      coCode: "CO3",
      statement: "Apply IP addressing, subnetting and routing concepts.",
      mappedCountText: "4 mapped outcomes",
      poItems: [
        {
          id: "po3-1",
          poCode: "PO1",
          poTitle: "Engineering Knowledge",
          strengthText: "Strength: 3 (High)",
          strengthBadgeClass:
            "bg-[#f5f3ff] text-color2 dark:bg-purple-950/60 dark:text-purple-300",
          rationale:
            "Application of IPv4 subnetting formulas and routing algorithm mechanics.",
        },
      ],
    },
    {
      id: "co4",
      coCode: "CO4",
      statement: "Explain transport-layer protocols and mechanisms.",
      mappedCountText: "4 mapped outcomes",
      poItems: [
        {
          id: "co4-1",
          poCode: "PO1",
          poTitle: "Engineering Knowledge",
          strengthText: "Strength: 2 (Medium)",
          strengthBadgeClass:
            "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
          rationale:
            "Understanding end-to-end transport mechanics, TCP congestion control, and UDP socket communication.",
        },
      ],
    },
    {
      id: "co5",
      coCode: "CO5",
      statement: "Explain application-layer protocols and services.",
      mappedCountText: "4 mapped outcomes",
      poItems: [
        {
          id: "co5-1",
          poCode: "PO1",
          poTitle: "Engineering Knowledge",
          strengthText: "Strength: 2 (Medium)",
          strengthBadgeClass:
            "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
          rationale:
            "Explanations of client-server architectures, DNS resolution, and HTTP protocol operations.",
        },
      ],
    },
  ],
};

const PROGRAM_OUTCOMES_DATA = {
  title: "PROGRAM OUTCOMES",
  subtitle: "View the Program Outcomes used for this course mapping.",
  headerStatsText: "11 Program Outcomes",
  items: [
    {
      id: "po1",
      poCode: "PO1",
      poTitle: "Engineering Knowledge",
      description:
        "Apply knowledge of mathematics, science, engineering fundamentals and computing principles to solve complex engineering problems.",
    },
    {
      id: "po2",
      poCode: "PO2",
      poTitle: "Problem Analysis",
      description:
        "Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences.",
    },
    {
      id: "po3",
      poCode: "PO3",
      poTitle: "Design / Development of Solutions",
      description:
        "Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations.",
    },
    {
      id: "po4",
      poCode: "PO4",
      poTitle: "Conduct Investigations of Complex Problems",
      description:
        "Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions.",
    },
    {
      id: "po5",
      poCode: "PO5",
      poTitle: "Modern Tool Usage",
      description:
        "Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations.",
    },
    {
      id: "po6",
      poCode: "PO6",
      poTitle: "The Engineer and Society",
      description:
        "Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice.",
    },
    {
      id: "po7",
      poCode: "PO7",
      poTitle: "Environment and Sustainability",
      description:
        "Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development.",
    },
    {
      id: "po8",
      poCode: "PO8",
      poTitle: "Ethics",
      description:
        "Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice.",
    },
    {
      id: "po9",
      poCode: "PO9",
      poTitle: "Individual and Team Work",
      description:
        "Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings.",
    },
    {
      id: "po10",
      poCode: "PO10",
      poTitle: "Communication",
      description:
        "Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation, make effective presentations, and give and receive clear instructions.",
    },
    {
      id: "po11",
      poCode: "PO11",
      poTitle: "Project Management and Finance",
      description:
        "Demonstrate knowledge and understanding of the engineering and management principles and apply these to one's own work, as a member and leader in a team, to manage projects and in multidisciplinary environments.",
    },
  ],
};

const COPO_HEADER_TABS = [
  { key: "course-outcomes", label: "Course Outcomes" },
  { key: "copo-matrix", label: "Co-Po Matrix" },
  { key: "mapping-rationale", label: "Mapping Rationale" },
  { key: "program-outcomes", label: "Program Outcomes" },
];

const TOPICS_HEADER_TABS = [
  { key: "all-units", label: "All Units" },
  { key: "unit-1", label: "Unit 1" },
  { key: "unit-2", label: "Unit 2" },
  { key: "unit-3", label: "Unit 3" },
  { key: "unit-4", label: "Unit 4" },
  { key: "unit-5", label: "Unit 5" },
];

const PEDAGOGY_HEADER_TABS = [
  { key: "all-units", label: "All Units" },
  { key: "unit-1", label: "Unit 1" },
  { key: "unit-2", label: "Unit 2" },
  { key: "unit-3", label: "Unit 3" },
  { key: "unit-4", label: "Unit 4" },
  { key: "unit-5", label: "Unit 5" },
];

const COURSE_TOPICS_CARD_DATA = {
  units: [
    {
      id: "unit-1",
      unitNumber: 1,
      unitCodeText: "Unit 1",
      title: "Introduction & Physical Layer",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "1.1",
          title: "Fundamentals of Computer Networks",
          description:
            "Introduces basic data communication concepts, network purpose, components and network classifications.",
          hoursText: "2 Hours",
          levelText: "Knowledge Level: K2",
          subtopics: [
            { code: "1.1.1", title: "Data Communication and Network Fundamentals" },
            { code: "1.1.2", title: "Network Components and Communication Links" },
            { code: "1.1.3", title: "LAN, MAN and WAN Concepts" },
          ],
        },
        {
          code: "1.2",
          title: "Network Architecture and Layered Communication",
          description:
            "Explains layered architecture, network services, protocols and interfaces used for structured communication.",
          hoursText: "2 Hours",
          levelText: "Knowledge Level: K2",
          subtopics: [
            { code: "1.2.1", title: "Layered Network Architecture" },
            { code: "1.2.2", title: "Protocols, Services and Interfaces" },
            { code: "1.2.3", title: "Benefits of Layered Communication" },
          ],
        },
        {
          code: "1.3",
          title: "OSI and TCP/IP Reference Models",
          description:
            "Studies standard reference models and functions of networking layers.",
          hoursText: "3 Hours",
          levelText: "Knowledge Level: K2",
          subtopics: [
            { code: "1.3.1", title: "OSI Reference Model and Layer Functions" },
            { code: "1.3.2", title: "TCP/IP Reference Model and Protocol Suite" },
            { code: "1.3.3", title: "Comparison of OSI and TCP/IP Models" },
          ],
        },
        {
          code: "1.4",
          title: "Physical Layer and Transmission Media",
          description:
            "Covers physical transmission concepts and communication media used in computer networks.",
          hoursText: "2 Hours",
          levelText: "Knowledge Level: K2",
          subtopics: [
            { code: "1.4.1", title: "Signals and Data Transmission Fundamentals" },
            { code: "1.4.2", title: "Guided Transmission Media" },
            { code: "1.4.3", title: "Unguided Transmission Media" },
          ],
        },
      ],
    },
    {
      id: "unit-2",
      unitNumber: 2,
      unitCodeText: "Unit 2",
      title: "Data Link Layer & MAC Sublayer",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "2.1",
          title: "Data Link Layer Design & Framing",
          description:
            "Examines framing, error detection mechanisms, and sliding window flow control protocols.",
          hoursText: "2 Hours",
          levelText: "Knowledge Level: K3",
          subtopics: [
            { code: "2.1.1", title: "Framing Methods & Character/Bit Stuffing" },
            { code: "2.1.2", title: "CRC & Checksum Error Control Algorithms" },
            {
              code: "2.1.3",
              title:
                "Sliding Window Protocols (Stop-and-Wait, Go-Back-N, Selective Repeat)",
            },
          ],
        },
        {
          code: "2.2",
          title: "Medium Access Control & Ethernet",
          description:
            "Covers random access protocols, collision handling, and Ethernet standards.",
          hoursText: "3 Hours",
          levelText: "Knowledge Level: K3",
          subtopics: [
            { code: "2.2.1", title: "ALOHA and CSMA/CD Protocol Mechanics" },
            { code: "2.2.2", title: "Binary Exponential Backoff Algorithm" },
            { code: "2.2.3", title: "IEEE 802.3 Frame Format and Fast/Gigabit Ethernet" },
          ],
        },
      ],
    },
    {
      id: "unit-3",
      unitNumber: 3,
      unitCodeText: "Unit 3",
      title: "Network Layer & Routing",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "3.1",
          title: "IPv4/IPv6 Addressing & Subnetting",
          description: "IP addressing structures, VLSM, CIDR, and IPv6 transition.",
          hoursText: "3 Hours",
          levelText: "Knowledge Level: K3",
          subtopics: [
            { code: "3.1.1", title: "Classful vs Classless Inter-Domain Routing (CIDR)" },
            { code: "3.1.2", title: "Variable Length Subnet Masking (VLSM)" },
          ],
        },
        {
          code: "3.2",
          title: "Routing Algorithms & Protocols",
          description: "Distance Vector, Link State, RIP, OSPF, and BGP protocols.",
          hoursText: "4 Hours",
          levelText: "Knowledge Level: K4",
          subtopics: [
            { code: "3.2.1", title: "Distance Vector vs Link State Routing" },
            { code: "3.2.2", title: "RIP, OSPF and BGP Operation Mechanics" },
          ],
        },
      ],
    },
    {
      id: "unit-4",
      unitNumber: 4,
      unitCodeText: "Unit 4",
      title: "Transport Layer Protocols",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "4.1",
          title: "TCP Connection Management & Flow Control",
          description: "TCP three-way handshake, sliding window, and congestion control.",
          hoursText: "4 Hours",
          levelText: "Knowledge Level: K3",
          subtopics: [
            { code: "4.1.1", title: "Three-Way Handshake & Connection Termination" },
            { code: "4.1.2", title: "TCP Sliding Window & Congestion Control" },
          ],
        },
        {
          code: "4.2",
          title: "UDP & Socket Programming",
          description: "UDP datagram communication and socket programming basics.",
          hoursText: "3 Hours",
          levelText: "Knowledge Level: K2",
          subtopics: [
            { code: "4.2.1", title: "Connectionless UDP Transmission" },
            { code: "4.2.2", title: "Socket API Fundamentals" },
          ],
        },
      ],
    },
    {
      id: "unit-5",
      unitNumber: 5,
      unitCodeText: "Unit 5",
      title: "Application Layer",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "5.1",
          title: "Application Protocols",
          description: "DNS resolution, HTTP/HTTPS operations, and email protocols.",
          hoursText: "4 Hours",
          levelText: "Knowledge Level: K2",
          subtopics: [
            { code: "5.1.1", title: "Domain Name System (DNS) Architecture" },
            { code: "5.1.2", title: "HTTP/HTTPS Request-Response Mechanics" },
          ],
        },
        {
          code: "5.2",
          title: "Network Management & Security",
          description: "Encryption basics, firewalls, and VPN technologies.",
          hoursText: "4 Hours",
          levelText: "Knowledge Level: K3",
          subtopics: [
            { code: "5.2.1", title: "Symmetric & Asymmetric Encryption Overview" },
            { code: "5.2.2", title: "Firewalls and Virtual Private Networks (VPN)" },
          ],
        },
      ],
    },
  ],
};

const PEDAGOGY_TOPICS_CARD_DATA = {
  title: "TEACHING APPROACHES OF TOPICS",
  subtitle: "Approved teaching methods for each topic in the course.",
  headerStatsText: "5 Units • 20 Main Topics",
  units: [
    {
      id: "unit-1",
      unitNumber: 1,
      unitCodeText: "UNIT 1",
      title: "Introduction & Physical Layer",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "1.1",
          title: "Fundamentals of Computer Networks",
          bloomLevel: "K2",
          hoursText: "2 Hours",
          teachingApproaches: ["Lecture", "Concept Mapping", "Group Discussion"],
        },
        {
          code: "1.2",
          title: "Network Architecture and Layered Communication",
          bloomLevel: "K2",
          hoursText: "2 Hours",
          teachingApproaches: [
            "Interactive Lecture",
            "Concept Mapping",
            "Comparative Discussion",
          ],
        },
        {
          code: "1.3",
          title: "OSI and TCP/IP Reference Models",
          bloomLevel: "K2",
          hoursText: "3 Hours",
          teachingApproaches: [
            "Diagrammatic Walkthrough",
            "Comparative Analysis",
            "Peer Instruction",
          ],
        },
        {
          code: "1.4",
          title: "Physical Layer and Transmission Media",
          bloomLevel: "K2",
          hoursText: "2 Hours",
          teachingApproaches: ["Demonstration", "Lecture", "Discussion"],
        },
      ],
    },
    {
      id: "unit-2",
      unitNumber: 2,
      unitCodeText: "UNIT 2",
      title: "Data Link Layer & MAC Sublayer",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "2.1",
          title: "Data Link Layer Design & Framing",
          bloomLevel: "K3",
          hoursText: "2 Hours",
          teachingApproaches: ["Interactive Lecture", "Problem Solving", "Simulation Lab"],
        },
        {
          code: "2.2",
          title: "Medium Access Control & Ethernet",
          bloomLevel: "K3",
          hoursText: "3 Hours",
          teachingApproaches: ["Case Study", "Group Discussion", "Protocol Animation"],
        },
      ],
    },
    {
      id: "unit-3",
      unitNumber: 3,
      unitCodeText: "UNIT 3",
      title: "Network Layer & Routing",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "3.1",
          title: "IPv4/IPv6 Addressing & Subnetting",
          bloomLevel: "K3",
          hoursText: "3 Hours",
          teachingApproaches: ["Subnet Workshop", "Interactive Quiz", "Guided Problem Solving"],
        },
        {
          code: "3.2",
          title: "Routing Algorithms & Protocols",
          bloomLevel: "K4",
          hoursText: "4 Hours",
          teachingApproaches: ["Algorithm Walkthrough", "Packet Tracer Demo", "Comparative Analysis"],
        },
      ],
    },
    {
      id: "unit-4",
      unitNumber: 4,
      unitCodeText: "UNIT 4",
      title: "Transport Layer Protocols",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "4.1",
          title: "TCP Connection Management & Flow Control",
          bloomLevel: "K3",
          hoursText: "4 Hours",
          teachingApproaches: ["Wireshark Lab", "Interactive Lecture", "Handshake Role Play"],
        },
        {
          code: "4.2",
          title: "UDP & Socket Programming",
          bloomLevel: "K3",
          hoursText: "3 Hours",
          teachingApproaches: ["Live Coding Demo", "Peer Code Review", "Lab Assignment"],
        },
      ],
    },
    {
      id: "unit-5",
      unitNumber: 5,
      unitCodeText: "UNIT 5",
      title: "Application Layer",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "5.1",
          title: "Application Protocols (DNS, HTTP/HTTPS)",
          bloomLevel: "K2",
          hoursText: "4 Hours",
          teachingApproaches: ["Protocol Inspection", "Concept Mapping", "Interactive Lecture"],
        },
        {
          code: "5.2",
          title: "Network Management & Security",
          bloomLevel: "K3",
          hoursText: "4 Hours",
          teachingApproaches: ["Security Case Study", "Demonstration", "Group Discussion"],
        },
      ],
    },
  ],
};

const LESSON_PLAN_TOPICS_CARD_DATA = {
  title: "Course Delivery Plan",
  subtitle: "View the approved course delivery plan by unit and topic.",
  headerStatsText: "5 Units • 20 Main Topics • 45 Planned Hours",
  units: [
    {
      id: "unit-1",
      unitNumber: 1,
      unitCodeText: "Unit 1",
      title: "Introduction & Physical Layer",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "1.1",
          title: "Fundamentals of Computer Networks",
          bloomLevel: "K2",
          hoursText: "2 Hours",
          pedagogy: ["Lecture", "Concept Mapping", "Group Discussion"],
          textbook: "Computer Networks — Tanenbaum & Wetherall",
          referenceBook: "Data Communications and Networking — Forouzan",
        },
        {
          code: "1.2",
          title: "Network Architecture and Layered Communication",
          bloomLevel: "K2",
          hoursText: "2 Hours",
          pedagogy: [
            "Interactive Lecture",
            "Concept Mapping",
            "Comparative Discussion",
          ],
          textbook: "Computer Networks — Tanenbaum & Wetherall",
          referenceBook: "Data Communications and Networking — Forouzan",
        },
        {
          code: "1.3",
          title: "OSI and TCP/IP Reference Models",
          bloomLevel: "K2",
          hoursText: "3 Hours",
          pedagogy: [
            "Diagrammatic Walkthrough",
            "Comparative Analysis",
            "Peer Instruction",
          ],
          textbook: "Computer Networks — Tanenbaum & Wetherall",
          referenceBook: "Internetworking with TCP/IP — Douglas Comer",
        },
        {
          code: "1.4",
          title: "Physical Layer and Transmission Media",
          bloomLevel: "K2",
          hoursText: "2 Hours",
          pedagogy: ["Demonstration", "Lecture", "Discussion"],
          textbook: "Computer Networks — Tanenbaum & Wetherall",
          referenceBook: "Data Communications and Networking — Forouzan",
        },
      ],
    },
    {
      id: "unit-2",
      unitNumber: 2,
      unitCodeText: "Unit 2",
      title: "Data Link Layer & MAC Sublayer",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "2.1",
          title: "Data Link Layer Design & Framing",
          bloomLevel: "K3",
          hoursText: "2 Hours",
          pedagogy: ["Interactive Lecture", "Problem Solving", "Simulation Lab"],
          textbook: "Computer Networks — Tanenbaum & Wetherall",
          referenceBook: "Data Communications and Networking — Forouzan",
        },
        {
          code: "2.2",
          title: "Medium Access Control & Ethernet",
          bloomLevel: "K3",
          hoursText: "3 Hours",
          pedagogy: ["Case Study", "Group Discussion", "Protocol Animation"],
          textbook: "Computer Networks — Tanenbaum & Wetherall",
          referenceBook: "IEEE 802.3 Standard Documents",
        },
      ],
    },
    {
      id: "unit-3",
      unitNumber: 3,
      unitCodeText: "Unit 3",
      title: "Network Layer & Routing",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "3.1",
          title: "IPv4/IPv6 Addressing & Subnetting",
          bloomLevel: "K3",
          hoursText: "3 Hours",
          pedagogy: ["Subnet Workshop", "Interactive Quiz", "Guided Problem Solving"],
          textbook: "Computer Networks — Tanenbaum & Wetherall",
          referenceBook: "TCP/IP Illustrated, Vol. 1 — W. Richard Stevens",
        },
        {
          code: "3.2",
          title: "Routing Algorithms & Protocols",
          bloomLevel: "K4",
          hoursText: "4 Hours",
          pedagogy: ["Algorithm Walkthrough", "Packet Tracer Demo", "Comparative Analysis"],
          textbook: "Computer Networks — Tanenbaum & Wetherall",
          referenceBook: "Routing TCP/IP, Vol. 1 — Jeff Doyle",
        },
      ],
    },
    {
      id: "unit-4",
      unitNumber: 4,
      unitCodeText: "Unit 4",
      title: "Transport Layer Protocols",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "4.1",
          title: "TCP Connection Management & Flow Control",
          bloomLevel: "K3",
          hoursText: "4 Hours",
          pedagogy: ["Wireshark Lab", "Interactive Lecture", "Handshake Role Play"],
          textbook: "Computer Networks — Tanenbaum & Wetherall",
          referenceBook: "TCP/IP Illustrated, Vol. 1 — W. Richard Stevens",
        },
        {
          code: "4.2",
          title: "UDP & Socket Programming",
          bloomLevel: "K3",
          hoursText: "3 Hours",
          pedagogy: ["Live Coding Demo", "Peer Code Review", "Lab Assignment"],
          textbook: "Unix Network Programming — W. Richard Stevens",
          referenceBook: "Computer Networks — Tanenbaum & Wetherall",
        },
      ],
    },
    {
      id: "unit-5",
      unitNumber: 5,
      unitCodeText: "Unit 5",
      title: "Application Layer",
      hoursText: "9 Hours",
      topicsCountText: "4 Main Topics",
      topics: [
        {
          code: "5.1",
          title: "Application Protocols",
          bloomLevel: "K2",
          hoursText: "4 Hours",
          pedagogy: ["Protocol Inspection", "Concept Mapping", "Interactive Lecture"],
          textbook: "Computer Networks — Tanenbaum & Wetherall",
          referenceBook: "HTTP: The Definitive Guide — David Gourley",
        },
        {
          code: "5.2",
          title: "Network Management & Security",
          bloomLevel: "K3",
          hoursText: "4 Hours",
          pedagogy: ["Security Case Study", "Demonstration", "Group Discussion"],
          textbook: "Cryptography and Network Security — William Stallings",
          referenceBook: "Computer Networks — Tanenbaum & Wetherall",
        },
      ],
    },
  ],
};

const LEARNING_MATERIALS_CARD_DATA = {
  title: "LEARNING MATERIALS",
  subtitle: "View the approved learning materials available for this course.",
  headerStatsText: "5 Units • 6 Approved Materials",
  units: [
    {
      id: "unit-1",
      unitNumber: 1,
      unitCodeText: "UNIT 1",
      title: "Introduction & Physical Layer",
      materialsCountText: "2 Approved Materials",
      materials: [
        {
          id: "mat-1.3",
          topicCode: "1.3",
          topicTitle: "OSI and TCP/IP Reference Models",
          materialTitle: "OSI and TCP/IP Architecture Notes",
          versionText: "v1.0",
          approvedDateText: "Approved 26 Aug 2026",
          details: {
            approvedBy: "Dr. Arun Kumar",
            approvedDate: "26 Aug 2026",
            overview:
              "Introduction to layered network architecture, peer-to-peer communication models, protocol encapsulation hierarchies, and comparison of standard reference models.",
            learningContent: [
              {
                title: "Layered Network Architecture",
                items: [
                  "Communication functions are systematically partitioned into discrete horizontal layers to reduce design complexity and promote vendor interoperability.",
                  "Each layer provides specific services to the layer directly above it while hiding internal implementation mechanics and hardware dependencies.",
                  "Peer entities across communicating network nodes exchange Protocol Data Units (PDUs) conforming to layer-specific protocol rules, with headers prepended during encapsulation.",
                ],
              },
              {
                title: "OSI Reference Model",
                items: [
                  "Physical Layer (Layer 1): Transmits unstructured raw bit streams over physical transmission media; governs electrical, optical, and mechanical specifications.",
                  "Data Link Layer (Layer 2): Organizes bits into frames, provides physical MAC addressing, flow control, and CRC error detection over single-hop links.",
                  "Network Layer (Layer 3): Manages end-to-end packet delivery across intermediate subnet routers using logical IPv4/IPv6 addressing.",
                  "Transport Layer (Layer 4): Delivers process-to-process communication, port multiplexing, segmentation, and end-to-end reliability (TCP) or lightweight delivery (UDP).",
                  "Session Layer (Layer 5): Establishes, maintains, coordinates, and synchronizes dialogues between communicating applications.",
                  "Presentation Layer (Layer 6): Handles data representation, character formatting, TLS cryptographic encryption, and data compression.",
                  "Application Layer (Layer 7): Provides direct interface to user network applications including HTTP, DNS, SMTP, and SSH.",
                ],
              },
              {
                title: "TCP/IP Reference Model",
                items: [
                  "Network Access Layer: Combines Physical and Data Link functions; interfaces directly with host hardware and physical transmission media.",
                  "Internet Layer: Hosts the Internet Protocol (IPv4/IPv6, ICMP, ARP) providing connectionless best-effort packet delivery across internetworks.",
                  "Transport Layer: Implements end-to-end transport protocols (TCP for connection-oriented byte streams, UDP for connectionless datagrams).",
                  "Application Layer: Combines OSI's top three layers, supporting direct-to-protocol services like DNS, HTTP/HTTPS, FTP, and SMTP.",
                ],
              },
              {
                title: "OSI and TCP/IP Comparison",
                items: [
                  "Layer Hierarchy: OSI defines 7 conceptual layers; TCP/IP utilizes 4 practical functional layers.",
                  "Design Philosophy: OSI clearly distinguishes between services, interfaces, and protocols; TCP/IP was engineered around actual working protocols.",
                  "Network Service Support: OSI supports both connection-oriented and connectionless network services; TCP/IP strictly enforces connectionless IP at the network layer with reliability delegated to the transport layer.",
                  "Industry Adoption: TCP/IP is the ubiquitous operational standard powering the global Internet, while OSI serves as the primary pedagogical reference model.",
                ],
              },
            ],
            example: {
              title: "Web Request Layer Encapsulation Trace (Browser to Wire)",
              steps: [
                "Application Layer: Web browser initiates HTTP GET /index.html request (Application Data Payload).",
                "Transport Layer: Appends TCP header with Source Port (e.g., 52140), Destination Port 80/443, and Sequence Numbers (TCP Segment).",
                "Network Layer: Appends IPv4 header with Source IP (192.168.1.50) and Destination IP (93.184.216.34) (IP Packet).",
                "Data Link Layer: Appends Ethernet Header with Source MAC, Default Gateway MAC, and 32-bit CRC trailer (Ethernet Frame).",
                "Physical Layer: Frame is modulated into electrical voltage pulses or optical light signals for transmission onto the physical medium.",
              ],
            },
            exercises: [
              "Compare the OSI and TCP/IP reference models with respect to layering, protocol independence, and practical Internet implementation.",
              "Identify the specific OSI layer responsible for packet routing across heterogeneous networks.",
              "Explain the function of the Transport Layer and contrast TCP connection-oriented delivery with UDP datagram service.",
            ],
            references: [
              {
                title: "Computer Networks",
                author: "Andrew S. Tanenbaum & David J. Wetherall (5th Edition)",
              },
              {
                title: "Data Communications and Networking",
                author: "Behrouz A. Forouzan (5th Edition)",
              },
              {
                title: "Computer Networking: A Top-Down Approach",
                author: "James F. Kurose & Keith W. Ross",
              },
            ],
          },
        },
        {
          id: "mat-1.4",
          topicCode: "1.4",
          topicTitle: "Physical Layer and Transmission Media",
          materialTitle: "Transmission Media and Signal Fundamentals",
          versionText: "v1.0",
          approvedDateText: "Approved 26 Aug 2026",
          details: {
            approvedBy: "Dr. Arun Kumar",
            approvedDate: "26 Aug 2026",
            overview:
              "Explores physical transmission media, guided copper and fiber optic links, wireless channel propagation characteristics, and digital signal modulation techniques.",
            learningContent: [
              {
                title: "Guided Transmission Media",
                items: [
                  "Twisted Pair Cables (UTP/STP Cat 5e/6a): Shielded and unshielded copper pairs used for Ethernet LAN connections.",
                  "Coaxial Cables: Broadband transmission with central copper conductor surrounded by insulating layer and braided shield.",
                  "Fiber Optic Cables (Single-mode & Multi-mode): High-speed data transmission using total internal reflection of light pulses.",
                ],
              },
              {
                title: "Unguided Wireless Communication",
                items: [
                  "Radio Transmission: Omnidirectional wireless waves suitable for cellular and Wi-Fi access points.",
                  "Microwave Links: Line-of-sight high-frequency radio links for long-distance point-to-point backhaul.",
                  "Infrared & Satellite Communications: Short-range line-of-sight and geostationary orbital transponders.",
                ],
              },
            ],
            example: {
              title: "Optical Fiber Total Internal Reflection & Attenuation Calculation",
              steps: [
                "Core/Cladding Interface: Light enters core with refractive index n1 > n2 cladding.",
                "Critical Angle: Angle of incidence exceeds critical angle θc = arcsin(n2/n1), causing 100% internal reflection.",
                "Attenuation Loss: Signal experiences 0.2 dB/km attenuation at 1550nm wavelength over 50km link.",
              ],
            },
            exercises: [
              "Calculate Nyquist maximum bit rate over a 4kHz bandwidth noiseless channel with 4-level signaling.",
              "Differentiate between single-mode and multi-mode optical fibers.",
              "Explain Manchester encoding clock synchronization advantages over NRZ-L.",
            ],
            references: [
              {
                title: "Computer Networks",
                author: "Andrew S. Tanenbaum & David J. Wetherall (5th Edition)",
              },
              {
                title: "Data Communications and Networking",
                author: "Behrouz A. Forouzan (5th Edition)",
              },
            ],
          },
        },
      ],
    },
    {
      id: "unit-2",
      unitNumber: 2,
      unitCodeText: "UNIT 2",
      title: "Data Link Layer & MAC Sublayer",
      materialsCountText: "1 Approved Material",
      materials: [
        {
          id: "mat-2.1",
          topicCode: "2.1",
          topicTitle: "Data Link Layer Design & Framing",
          materialTitle: "Data Link Protocols and Framing Guide",
          versionText: "v1.0",
          approvedDateText: "Approved 27 Aug 2026",
          details: {
            approvedBy: "Dr. Arun Kumar",
            approvedDate: "27 Aug 2026",
            overview:
              "Covers data link layer framing techniques, byte and bit stuffing algorithms, CRC polynomial division error detection, and sliding window flow control.",
            learningContent: [
              {
                title: "Framing & Character/Bit Stuffing",
                items: [
                  "Byte-Count Framing: Demarcates frames using character count field in frame header.",
                  "Byte Stuffing: Inserts ESC escape bytes before payload flag occurrences in character-oriented protocols.",
                  "Bit Stuffing: Inserts 0 bit after five consecutive 1 bits in HDLC frame flags (01111110).",
                ],
              },
              {
                title: "Error Detection & Flow Control",
                items: [
                  "Cyclic Redundancy Check (CRC-32): Uses modulo-2 polynomial division to generate checksum trailers.",
                  "Sliding Window ARQ: Governs sender and receiver window sizes in Stop-and-Wait, Go-Back-N, and Selective Repeat protocols.",
                ],
              },
            ],
            example: {
              title: "CRC-16 Polynomial Division & Frame Trailer Generation",
              steps: [
                "Data Polynomial: Frame data bits D = 1101011011 appended with r=4 zero bits.",
                "Divisor Generator: Generator polynomial G(x) = x^4 + x + 1 (10011).",
                "Modulo-2 Division: XOR division yields 4-bit remainder R = 1110.",
                "Transmitted Frame: Append remainder R to data D yielding frame 11010110111110.",
              ],
            },
            exercises: [
              "Perform bit stuffing on data bit sequence 0111111111110.",
              "Compute CRC remainder for data 1101011011 using generator polynomial G(x) = x^4 + x + 1.",
              "Contrast Go-Back-N and Selective Repeat sender and receiver window sizes.",
            ],
            references: [
              {
                title: "Computer Networks",
                author: "Andrew S. Tanenbaum & David J. Wetherall (5th Edition)",
              },
            ],
          },
        },
      ],
    },
    {
      id: "unit-3",
      unitNumber: 3,
      unitCodeText: "UNIT 3",
      title: "Network Layer & Routing",
      materialsCountText: "1 Approved Material",
      materials: [
        {
          id: "mat-3.1",
          topicCode: "3.1",
          topicTitle: "IPv4/IPv6 Addressing & Subnetting",
          materialTitle: "IP Subnetting & CIDR Lecture Slides",
          versionText: "v1.0",
          approvedDateText: "Approved 28 Aug 2026",
          details: {
            approvedBy: "Dr. Arun Kumar",
            approvedDate: "28 Aug 2026",
            overview:
              "In-depth study of network layer logical addressing, IPv4 classful vs CIDR subnetting, VLSM allocation algorithms, and IPv6 header structure.",
            learningContent: [
              {
                title: "IPv4 Addressing & CIDR Notation",
                items: [
                  "32-bit dotted-decimal IP addresses partitioned into Network ID and Host ID.",
                  "Classless Inter-Domain Routing (CIDR) uses variable prefix lengths /24 to /30.",
                ],
              },
              {
                title: "Variable Length Subnet Masking (VLSM)",
                items: [
                  "Custom network subnetting based on specific host count requirements per department.",
                  "Minimizes wasted IP address space in enterprise router networks.",
                ],
              },
            ],
            example: {
              title: "Enterprise Network VLSM Subnet Breakdown",
              steps: [
                "Base Address: 192.168.10.0/24 subnetted for 4 engineering departments.",
                "Department A (50 hosts): Subnet 192.168.10.0/26 (Host Range: .1 to .62).",
                "Department B (30 hosts): Subnet 192.168.10.64/27 (Host Range: .65 to .94).",
                "Point-to-Point Router Link (2 hosts): Subnet 192.168.10.96/30.",
              ],
            },
            exercises: [
              "Given IP 192.168.10.0/24, design 4 subnets accommodating 50, 30, 10, and 10 hosts.",
              "Identify network ID, broadcast address, and usable host range for 172.16.45.100/20.",
            ],
            references: [
              {
                title: "Computer Networking: A Top-Down Approach",
                author: "James F. Kurose & Keith W. Ross",
              },
            ],
          },
        },
      ],
    },
    {
      id: "unit-4",
      unitNumber: 4,
      unitCodeText: "UNIT 4",
      title: "Transport Layer Protocols",
      materialsCountText: "1 Approved Material",
      materials: [
        {
          id: "mat-4.1",
          topicCode: "4.1",
          topicTitle: "TCP Connection Management & Flow Control",
          materialTitle: "TCP Flow & Congestion Control Lab Manual",
          versionText: "v1.0",
          approvedDateText: "Approved 29 Aug 2026",
          details: {
            approvedBy: "Dr. Arun Kumar",
            approvedDate: "29 Aug 2026",
            overview:
              "Hands-on guide for Wireshark TCP 3-way handshake packet analysis, Reno/Tahoe congestion control algorithms, and window scaling.",
            learningContent: [
              {
                title: "TCP Connection Establishment & Teardown",
                items: [
                  "3-Way Handshake: SYN -> SYN-ACK -> ACK establishes sequence numbers and socket buffers.",
                  "Connection Teardown: 4-way FIN exchange gracefully terminates bidirectional stream.",
                ],
              },
              {
                title: "Congestion Control Algorithms",
                items: [
                  "Slow Start: Congestion window (cwnd) doubles every RTT until ssthresh.",
                  "Congestion Avoidance: Linear cwnd increase by 1 MSS per RTT.",
                  "Fast Retransmit & Recovery: Triggered upon 3 duplicate ACKs without waiting for timeout.",
                ],
              },
            ],
            example: {
              title: "Wireshark Packet Trace of TCP 3-Way Handshake",
              steps: [
                "Packet 1: Client -> Server [SYN] Seq=0 Win=64240 MSS=1460.",
                "Packet 2: Server -> Client [SYN, ACK] Seq=0 Ack=1 Win=65535 MSS=1460.",
                "Packet 3: Client -> Server [ACK] Seq=1 Ack=1 Win=64240.",
              ],
            },
            exercises: [
              "Trace Congestion Window (cwnd) evolution during Slow Start and Fast Recovery across 10 RTTs.",
              "Differentiate TCP flow control (Receiver Window) from congestion control (Congestion Window).",
            ],
            references: [
              {
                title: "TCP/IP Illustrated, Vol. 1",
                author: "W. Richard Stevens",
              },
            ],
          },
        },
      ],
    },
    {
      id: "unit-5",
      unitNumber: 5,
      unitCodeText: "UNIT 5",
      title: "Application Layer",
      materialsCountText: "1 Approved Material",
      materials: [
        {
          id: "mat-5.1",
          topicCode: "5.1",
          topicTitle: "Application Protocols",
          materialTitle: "DNS, HTTP/HTTPS Protocol Specifications",
          versionText: "v1.0",
          approvedDateText: "Approved 30 Aug 2026",
          details: {
            approvedBy: "Dr. Arun Kumar",
            approvedDate: "30 Aug 2026",
            overview:
              "Examines client-server and P2P architectures, DNS domain resolution hierarchy, HTTP 1.1/2/3 request-response mechanics, and TLS encryption.",
            learningContent: [
              {
                title: "Domain Name System (DNS) Architecture",
                items: [
                  "Distributed hierarchical database: Root DNS -> TLD DNS -> Authoritative DNS.",
                  "Recursive vs Iterative name resolution mechanics.",
                ],
              },
              {
                title: "HTTP/HTTPS Operations",
                items: [
                  "HTTP Methods: GET, POST, PUT, DELETE, HEAD.",
                  "TLS 1.3 Handshake: Symmetric session key exchange via Diffie-Hellman.",
                ],
              },
            ],
            example: {
              title: "Browser HTTP GET Request & Packet Exchange Trace",
              steps: [
                "DNS Lookup: Browser queries local resolver for www.example.com IP.",
                "TCP Connect: 3-way handshake established on port 443.",
                "TLS Handshake: Key exchange and certificate validation.",
                "HTTP GET: Request Sent -> Server responds with 200 OK + HTML payload.",
              ],
            },
            exercises: [
              "Draw the step-by-step iterative DNS lookup sequence for www.example.com.",
              "Explain HTTP/2 multiplexing and how it solves head-of-line blocking in HTTP/1.1.",
            ],
            references: [
              {
                title: "HTTP: The Definitive Guide",
                author: "David Gourley & Brian Totty",
              },
            ],
          },
        },
      ],
    },
  ],
};

const QUESTION_BANK_TOPICS_CARD_DATA = {
  title: "QUESTION BANK BY TOPICS",
  subtitle: "Curated question bank items categorized by units and topics.",
  headerStatsText: "5 Units • 10 Questions",
  units: [
    {
      id: "unit-1",
      unitNumber: 1,
      unitCodeText: "UNIT 1",
      title: "Introduction & Physical Layer",
      questionsCountText: "3 Approved Questions",
      questions: [
        {
          id: "q-1.3-1",
          questionCode: "Q-CN-001",
          topicCode: "1.3",
          topicTitle: "OSI and TCP/IP Reference Models",
          questionText:
            "Which OSI layer is responsible for logical addressing and packet routing across intermediate networks?",
          tags: ["CO1", "K2", "MCQ", "2 Marks"],
          options: [
            { key: "A", text: "Data Link Layer" },
            { key: "B", text: "Network Layer", isCorrect: true },
            { key: "C", text: "Transport Layer" },
            { key: "D", text: "Physical Layer" },
          ],
          correctAnswer: "Option B (Network Layer)",
          explanation:
            "The Network Layer (Layer 3) handles logical IPv4/IPv6 addressing and determines optimal packet routing paths across interconnected subnets.",
        },
        {
          id: "q-1.4-1",
          questionCode: "Q-CN-002",
          topicCode: "1.4",
          topicTitle: "Physical Layer and Transmission Media",
          questionText:
            "Which transmission medium provides the highest immunity to electromagnetic interference?",
          tags: ["CO1", "K2", "MCQ", "2 Marks"],
          options: [
            { key: "A", text: "Unshielded Twisted Pair (UTP)" },
            { key: "B", text: "Coaxial Cable" },
            { key: "C", text: "Optical Fiber Cable", isCorrect: true },
            { key: "D", text: "Shielded Twisted Pair (STP)" },
          ],
          correctAnswer: "Option C (Optical Fiber Cable)",
          explanation:
            "Optical Fiber transmits light pulses through glass/plastic strands rather than electrical currents, making it completely immune to EMI and RFI.",
        },
        {
          id: "q-1.3-2",
          questionCode: "Q-CN-003",
          topicCode: "1.3",
          topicTitle: "OSI and TCP/IP Reference Models",
          questionText:
            "Which TCP/IP layer corresponds most closely to the OSI Transport Layer?",
          tags: ["CO1", "K2", "MCQ", "2 Marks"],
          options: [
            { key: "A", text: "Application Layer" },
            { key: "B", text: "Transport Layer", isCorrect: true },
            { key: "C", text: "Internet Layer" },
            { key: "D", text: "Network Access Layer" },
          ],
          correctAnswer: "Option B (Transport Layer)",
          explanation:
            "The TCP/IP Transport Layer provides end-to-end communication services (TCP/UDP) equivalent to the OSI Transport Layer.",
        },
      ],
    },
    {
      id: "unit-2",
      unitNumber: 2,
      unitCodeText: "UNIT 2",
      title: "Data Link Layer & MAC Sublayer",
      questionsCountText: "2 Approved Questions",
      questions: [
        {
          id: "q-2.1-1",
          questionCode: "Q-CN-004",
          topicCode: "2.1",
          topicTitle: "Data Link Layer Design & Framing",
          questionText:
            "What pattern is used as a flag byte to mark frame boundaries in HDLC bit stuffing?",
          tags: ["CO2", "K2", "MCQ", "2 Marks"],
          options: [
            { key: "A", text: "01111110", isCorrect: true },
            { key: "B", text: "11111111" },
            { key: "C", text: "00000000" },
            { key: "D", text: "10101010" },
          ],
          correctAnswer: "Option A (01111110)",
          explanation:
            "HDLC uses the bit pattern 01111110 (0x7E) as a frame delimiter and inserts a 0 bit after five consecutive 1s in body payload.",
        },
        {
          id: "q-2.1-2",
          questionCode: "Q-CN-005",
          topicCode: "2.1",
          topicTitle: "Data Link Layer Design & Framing",
          questionText:
            "Explain the working mechanism of CRC-32 polynomial division in detecting transmission errors.",
          tags: ["CO2", "K3", "Descriptive", "10 Marks"],
          explanation:
            "Sender appends r-bit CRC remainder from modulo-2 division of payload by generator polynomial G(x). Receiver divides incoming frame by G(x); zero remainder indicates error-free transmission.",
        },
      ],
    },
    {
      id: "unit-3",
      unitNumber: 3,
      unitCodeText: "UNIT 3",
      title: "Network Layer & Routing",
      questionsCountText: "2 Approved Questions",
      questions: [
        {
          id: "q-3.1-1",
          questionCode: "Q-CN-006",
          topicCode: "3.1",
          topicTitle: "IPv4/IPv6 Addressing & Subnetting",
          questionText:
            "How many usable host IP addresses are available in a standard /26 CIDR subnet?",
          tags: ["CO3", "K3", "MCQ", "2 Marks"],
          options: [
            { key: "A", text: "64" },
            { key: "B", text: "62", isCorrect: true },
            { key: "C", text: "128" },
            { key: "D", text: "30" },
          ],
          correctAnswer: "Option B (62)",
          explanation:
            "A /26 subnet leaves 6 host bits (2^6 = 64 total addresses). Subtracting Network ID and Broadcast address yields 62 usable host IPs.",
        },
      ],
    },
    {
      id: "unit-4",
      unitNumber: 4,
      unitCodeText: "UNIT 4",
      title: "Transport Layer Protocols",
      questionsCountText: "2 Approved Questions",
      questions: [
        {
          id: "q-4.1-1",
          questionCode: "Q-CN-007",
          topicCode: "4.1",
          topicTitle: "TCP Connection Management & Flow Control",
          questionText:
            "Which TCP control flags are exchanged during the initial 3-way handshake connection establishment phase?",
          tags: ["CO4", "K2", "MCQ", "2 Marks"],
          options: [
            { key: "A", text: "SYN -> SYN-ACK -> ACK", isCorrect: true },
            { key: "B", text: "FIN -> ACK -> FIN-ACK" },
            { key: "C", text: "RST -> SYN -> ACK" },
            { key: "D", text: "URG -> PSH -> ACK" },
          ],
          correctAnswer: "Option A (SYN -> SYN-ACK -> ACK)",
          explanation:
            "Client initiates with SYN, Server responds with SYN-ACK, and Client completes connection setup with ACK.",
        },
      ],
    },
    {
      id: "unit-5",
      unitNumber: 5,
      unitCodeText: "UNIT 5",
      title: "Application Layer",
      questionsCountText: "1 Question",
      questions: [
        {
          id: "q-5.1-1",
          questionCode: "Q-CN-008",
          topicCode: "5.1",
          topicTitle: "Application Protocols",
          questionText:
            "Which default transport layer protocol and port number are utilized by DNS recursive resolvers for standard query transactions?",
          tags: ["CO5", "K2", "MCQ", "2 Marks"],
          options: [
            { key: "A", text: "TCP Port 80" },
            { key: "B", text: "UDP Port 53", isCorrect: true },
            { key: "C", text: "TCP Port 443" },
            { key: "D", text: "UDP Port 67" },
          ],
          correctAnswer: "Option B (UDP Port 53)",
          explanation:
            "Standard DNS domain name lookups use lightweight UDP port 53 for fast query and response round trips.",
        },
      ],
    },
  ],
};

const COPO_MATRIX_CARD_DATA = {
  title: "CO–PO MAPPING MATRIX",
  subtitle: "Shows how each Course Outcome is mapped to the Program Outcomes.",
  headerStatsText: "5 × 11 Matrix",
  poHeaders: [
    "P01",
    "P02",
    "P03",
    "P04",
    "P05",
    "P06",
    "P07",
    "P08",
    "P09",
    "P010",
    "P011",
  ],
  rows: [
    {
      coCode: "C01",
      poScores: { P01: 3, P02: 2, P05: 1 },
    },
    {
      coCode: "C02",
      poScores: { P01: 2, P02: 3, P03: 2 },
    },
    {
      coCode: "C03",
      poScores: { P01: 3, P02: 2, P03: 3, P04: 2 },
    },
    {
      coCode: "C04",
      poScores: { P01: 2, P03: 2, P04: 3, P05: 2 },
    },
    {
      coCode: "C05",
      poScores: { P02: 2, P04: 2, P05: 3, P06: 2 },
    },
  ],
};

const QuestionBank = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    activeTab: "instructor",
    selectedReferenceId: "syllabus",
    activeSubTab: "course-info",
    isEditing: false,
    isGenerating: false,
    viewQuestion: null as QuestionCardProps | null,
    activeQTab: "all-questions" as "all-questions" | "question-sets",
    appliedFilters: null as FilterValues | null,
    isSyllabusOpen: false,
    selectedSetId: null as string | null,
  });

  useEffect(() => {
    dispatch(setPageTitle("View Learning Material"));
  }, [dispatch]);

  const referenceItems: ReferenceItem[] = [
    {
      id: "syllabus",
      icon: (
        <FileText
          className={`h-5 w-5 ${state.selectedReferenceId === "syllabus"
            ? "text-white"
            : "text-pri dark:text-gray-400"
            }`}
        />
      ),
      title: "Syllabus",
      subtitle: "5 Units • CO1-CO6",
      isActive: state.selectedReferenceId === "syllabus",
      isCompleted: true,
    },
    {
      id: "copo",
      icon: (
        <GitBranch
          className={`h-5 w-5 ${state.selectedReferenceId === "copo"
            ? "text-white"
            : "text-pri dark:text-gray-400"
            }`}
        />
      ),
      title: "CO-PO Mapping",
      subtitle: "11 Program Outcomes",
      isActive: state.selectedReferenceId === "copo",
      isCompleted: true,
    },
    {
      id: "topics",
      icon: (
        <Layers
          className={`h-5 w-5 ${state.selectedReferenceId === "topics"
            ? "text-white"
            : "text-pri dark:text-gray-400"
            }`}
        />
      ),
      title: "Topics",
      subtitle: "5 Units • 20 Main Topics",
      isActive: state.selectedReferenceId === "topics",
      isCompleted: true,
    },
    {
      id: "pedagogy",
      icon: (
        <GraduationCap
          className={`h-5 w-5 ${state.selectedReferenceId === "pedagogy"
            ? "text-white"
            : "text-pri dark:text-gray-400"
            }`}
        />
      ),
      title: "Pedagogy",
      subtitle: "Teaching Approaches",
      isActive: state.selectedReferenceId === "pedagogy",
      isCompleted: true,
    },
    {
      id: "lesson-plan",
      icon: (
        <Calendar
          className={`h-5 w-5 ${state.selectedReferenceId === "lesson-plan"
            ? "text-white"
            : "text-pri dark:text-gray-400"
            }`}
        />
      ),
      title: "Lesson Plan",
      subtitle: "Course Delivery Plan",
      isActive: state.selectedReferenceId === "lesson-plan",
      isCompleted: true,
    },
    {
      id: "learning-materials",
      icon: (
        <BookOpen
          className={`h-5 w-5 ${state.selectedReferenceId === "learning-materials"
            ? "text-white"
            : "text-pri dark:text-gray-400"
            }`}
        />
      ),
      title: "Learning Materials",
      subtitle: "6 Approved Materials",
      isActive: state.selectedReferenceId === "learning-materials",
      isCompleted: true,
    },
  ];

  const assessmentItems: ReferenceItem[] = [
    {
      id: "question-bank",
      icon: (
        <HelpCircle
          className={`h-5 w-5 ${state.selectedReferenceId === "question-bank"
            ? "text-white"
            : "text-pri dark:text-gray-400"
            }`}
        />
      ),
      title: "Question Bank",
      subtitle: "12 Approved Questions",
      isActive: state.selectedReferenceId === "question-bank",
      isCompleted: true,
    },
    {
      id: "cia-papers",
      icon: (
        <FileCode
          className={`h-5 w-5 ${state.selectedReferenceId === "cia-papers"
            ? "text-white"
            : "text-pri dark:text-gray-400"
            }`}
        />
      ),
      title: "CIA Question Papers",
      subtitle: "3 Approved Papers",
      isActive: state.selectedReferenceId === "cia-papers",
      isCompleted: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      <CourseBanner
        courseCode="CS301"
        courseTitle="Computer Networks"
        description="Coordinator View — Academic course preparation, syllabus, outcomes mapping, lesson plans, question banking, and CIA paper generation."
        programme="B.Tech CSE"
        batch="2025–2029"
        academicYear="2026–2027 / Semester 3"
        students="40 Students"
        selectedCourse="CS309"
        courseOptions={[
          { value: "CS309", label: "Course: CS309" },
          { value: "CS301", label: "Course: CS301" },
        ]}
        onCourseChange={(val) => console.log("course", val)}
        activeView={state.activeTab}
        onBack={() => router.back()}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      <PageHeader
        title="Course Artifacts"
        records="CS309  —  Computer Networks"
        subtitle={`Access approved academic references prepared for this course.`}
        icon={<Users className="h-5 w-5 text-color2" />}
        record2="Instructor View"
        record3="Read Only"
      />

      {/* Main Grid Layout: Left Course References Navigation + Right Artifact Details */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Course References List */}
        <div className="lg:col-span-4 xl:col-span-3">
          <CourseReferencesCard
            title="COURSE REFERENCES"
            availableCountText="8 Available References"
            items={referenceItems}
            assessmentItems={assessmentItems}
            onItemClick={(item) => {
              const defaultSubTab =
                item.id === "syllabus"
                  ? "course-info"
                  : item.id === "copo"
                    ? "course-outcomes"
                    : item.id === "topics"
                      ? "all-units"
                      : state.activeSubTab;
              setState({ selectedReferenceId: item.id, activeSubTab: defaultSubTab });
            }}
          />
        </div>

        {/* Right Column: Syllabus Details */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {(() => {
            const currentHeaderData =
              REFERENCE_HEADER_DATA_MAP[state.selectedReferenceId] ||
              REFERENCE_HEADER_DATA_MAP["syllabus"];

            const activeTabs =
              state.selectedReferenceId === "syllabus"
                ? SYLLABUS_HEADER_DATA.tabs
                : state.selectedReferenceId === "copo"
                  ? COPO_HEADER_TABS
                  : state.selectedReferenceId === "topics"
                    ? TOPICS_HEADER_TABS
                    : null;

            return (
              <>
                {state.selectedReferenceId !== "cia-papers" && (
                  <SyllabusHeaderCard
                    title={currentHeaderData.title}
                    icon={currentHeaderData.icon}
                    subtitle={currentHeaderData.subtitle}
                    approvedBy={currentHeaderData.approvedBy}
                    approvedDate={currentHeaderData.approvedDate}
                    unitsCountText={currentHeaderData.unitsCountText}
                    versionBadgeText={currentHeaderData.versionBadgeText}
                    bannerProgramme={SYLLABUS_HEADER_DATA.bannerProgramme}
                    bannerBatch={SYLLABUS_HEADER_DATA.bannerBatch}
                    bannerSemester={SYLLABUS_HEADER_DATA.bannerSemester}
                    courseCode={SYLLABUS_HEADER_DATA.courseCode}
                    courseTitle={SYLLABUS_HEADER_DATA.courseTitle}
                  />
                )}

                {state.selectedReferenceId === "cia-papers" && (
                  <div id="cia-papers-section" className="space-y-4 scroll-mt-36">
                    <CIAQuestionPapersCard />
                    <CIAPaperHeaderCard onPrint={() => window.print()} />
                    <div id="printable-question-paper">
                      <CIAQuestionPaperViewCard />
                    </div>
                  </div>
                )}
                {(state.selectedReferenceId === "syllabus" || state.selectedReferenceId === "copo") && (
                  <div className="sticky top-20 z-20 backdrop-blur-md dark:bg-gray-900/95 overflow-x-auto pt-2.5 pb-0 -mb-1">
                    <GenericTabs
                      tabs={activeTabs}
                      activeKey={state.activeSubTab}
                      noWrap={true}
                      onChange={(tabKey: any) => {
                        setState({ activeSubTab: tabKey });
                        const el = document.getElementById(tabKey);
                        if (el) {
                          const y =
                            el.getBoundingClientRect().top +
                            window.pageYOffset -
                            140;
                          window.scrollTo({ top: y, behavior: "smooth" });
                        }
                      }}
                    />
                  </div>
                )}

                {state.selectedReferenceId === "syllabus" && (
                  <>
                    <div id="course-info" className="scroll-mt-36">
                      <CourseInformationCard
                        courseCode={SYLLABUS_HEADER_DATA.courseCode}
                        courseTitle={SYLLABUS_HEADER_DATA.courseTitle}
                      />
                    </div>

                    <div id="course-outcomes" className="scroll-mt-36">
                      <CourseOutcomesCard
                        title={COURSE_OUTCOMES_DATA.title}
                        approvedCountText={COURSE_OUTCOMES_DATA.approvedCountText}
                        outcomes={COURSE_OUTCOMES_DATA.outcomes}
                        coverageUnitsText={COURSE_OUTCOMES_DATA.coverageUnitsText}
                        coverageTheoryHoursText={
                          COURSE_OUTCOMES_DATA.coverageTheoryHoursText
                        }
                        coverageLabHoursText={
                          COURSE_OUTCOMES_DATA.coverageLabHoursText
                        }
                        coverageTopicsText={
                          COURSE_OUTCOMES_DATA.coverageTopicsText
                        }
                      />
                    </div>

                    <div id="unit-syllabus" className="scroll-mt-36">
                      <UnitWiseSyllabusCard
                        title={UNIT_WISE_SYLLABUS_DATA.title}
                        headerStatsText={UNIT_WISE_SYLLABUS_DATA.headerStatsText}
                        units={UNIT_WISE_SYLLABUS_DATA.units}
                        onHierarchyClick={(unitNum) =>
                          console.log("Hierarchy clicked for unit:", unitNum)
                        }
                      />
                    </div>

                    <div id="theory-lab" className="scroll-mt-36">
                      <TheoryAndLabCard
                        title={THEORY_AND_LAB_DATA.title}
                        headerSubtitle={THEORY_AND_LAB_DATA.headerSubtitle}
                        theoryHours={THEORY_AND_LAB_DATA.theoryHours}
                        theoryWeeklyHours={THEORY_AND_LAB_DATA.theoryWeeklyHours}
                        labHours={THEORY_AND_LAB_DATA.labHours}
                        labWeeklyHours={THEORY_AND_LAB_DATA.labWeeklyHours}
                        labExperimentsTitle={THEORY_AND_LAB_DATA.labExperimentsTitle}
                        experiments={THEORY_AND_LAB_DATA.experiments}
                      />
                    </div>

                    <div id="textbooks" className="scroll-mt-36">
                      <TextbooksCard
                        title={TEXTBOOKS_DATA.title}
                        headerSubtitle={TEXTBOOKS_DATA.headerSubtitle}
                        textbooks={TEXTBOOKS_DATA.textbooks}
                      />
                    </div>

                    <div id="reference-books" className="scroll-mt-36">
                      <ReferenceBooksCard
                        title={REFERENCE_BOOKS_DATA.title}
                        headerSubtitle={REFERENCE_BOOKS_DATA.headerSubtitle}
                        references={REFERENCE_BOOKS_DATA.references}
                      />
                    </div>
                  </>
                )}
                {state.selectedReferenceId === "copo" && (
                  <>
                    <div id="course-outcomes" className="scroll-mt-36">
                      <CourseOutcomesCard
                        title={COURSE_OUTCOMES_DATA.title}
                        approvedCountText={COURSE_OUTCOMES_DATA.approvedCountText}
                        outcomes={COURSE_OUTCOMES_DATA.outcomes}
                        isCopoView={true}
                      />
                    </div>

                    <div id="copo-matrix" className="scroll-mt-36">
                      <CopoMappingMatrixCard
                        title={COPO_MATRIX_CARD_DATA.title}
                        subtitle={COPO_MATRIX_CARD_DATA.subtitle}
                        headerStatsText={COPO_MATRIX_CARD_DATA.headerStatsText}
                        poHeaders={COPO_MATRIX_CARD_DATA.poHeaders}
                        rows={COPO_MATRIX_CARD_DATA.rows}
                      />
                    </div>

                    <div id="mapping-rationale" className="scroll-mt-36">
                      <MappingRationaleCard
                        title={MAPPING_RATIONALE_DATA.title}
                        subtitle={MAPPING_RATIONALE_DATA.subtitle}
                        headerStatsText={MAPPING_RATIONALE_DATA.headerStatsText}
                        items={MAPPING_RATIONALE_DATA.items}
                      />
                    </div>

                    <div id="program-outcomes" className="scroll-mt-36">
                      <MappingRationaleCard
                        title={PROGRAM_OUTCOMES_DATA.title}
                        subtitle={PROGRAM_OUTCOMES_DATA.subtitle}
                        headerStatsText={PROGRAM_OUTCOMES_DATA.headerStatsText}
                        items={PROGRAM_OUTCOMES_DATA.items}
                      />
                    </div>
                  </>
                )}
                {state.selectedReferenceId === "topics" && (
                  <div id="topics-section" className="scroll-mt-36">
                    <CourseTopicsCard units={COURSE_TOPICS_CARD_DATA.units} />
                  </div>
                )}

                {state.selectedReferenceId === "pedagogy" && (
                  <div id="pedagogy-section" className="scroll-mt-36">
                    <PedagogyTopicsCard
                      title={PEDAGOGY_TOPICS_CARD_DATA.title}
                      subtitle={PEDAGOGY_TOPICS_CARD_DATA.subtitle}
                      headerStatsText={PEDAGOGY_TOPICS_CARD_DATA.headerStatsText}
                      units={PEDAGOGY_TOPICS_CARD_DATA.units}
                    />
                  </div>
                )}

                {state.selectedReferenceId === "lesson-plan" && (
                  <div id="lesson-plan-section" className="scroll-mt-36">
                    <LessonPlanTopicsCard
                      title={LESSON_PLAN_TOPICS_CARD_DATA.title}
                      subtitle={LESSON_PLAN_TOPICS_CARD_DATA.subtitle}
                      headerStatsText={LESSON_PLAN_TOPICS_CARD_DATA.headerStatsText}
                      units={LESSON_PLAN_TOPICS_CARD_DATA.units}
                    />
                  </div>
                )}

                {state.selectedReferenceId === "learning-materials" && (
                  <div id="learning-materials-section" className="scroll-mt-36">
                    <LearningMaterialsCard
                      title={LEARNING_MATERIALS_CARD_DATA.title}
                      subtitle={LEARNING_MATERIALS_CARD_DATA.subtitle}
                      headerStatsText={LEARNING_MATERIALS_CARD_DATA.headerStatsText}
                      units={LEARNING_MATERIALS_CARD_DATA.units}
                    />
                  </div>
                )}

                {state.selectedReferenceId === "question-bank" && (
                  <div id="question-bank-section" className="scroll-mt-36">
                    <QuestionBankTopicsCard
                      title={QUESTION_BANK_TOPICS_CARD_DATA.title}
                      subtitle={QUESTION_BANK_TOPICS_CARD_DATA.subtitle}
                      headerStatsText={QUESTION_BANK_TOPICS_CARD_DATA.headerStatsText}
                      units={QUESTION_BANK_TOPICS_CARD_DATA.units}
                    />
                  </div>
                )}


              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default PrivateRouter(QuestionBank);
