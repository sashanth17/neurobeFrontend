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
import Models from "@/imports/models.import";
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
import { EditQuestionModal } from "@/components/question-bank/EditQuestionModal";
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
    selectedSetId: null as string | number | null,
    selectedSetData: null as any,
    loadingSet: false,
    availableCIAPapers: [] as any[],
    selectedCIAPaperId: null as string | number | null,
    activeCIAPaperDetail: null as any,
    loadingCIAPaper: false,
    activeHierarchySnapshot: null as any,
    activePedagogySnapshot: null as any,
    activeLessonPlanSnapshot: null as any,
    courseData: null as any,
    workflowStatus: null as any,
    syllabusDetail: null as any,
    copoData: null as any,
    topicsUnits: [] as any[],
    pedagogyUnits: [] as any[],
    lessonUnits: [] as any[],
    learningUnits: [] as any[],
    rawQuestions: [] as any[],
    rawQuestionSets: [] as any[],
    allCourses: [] as any[],
    loadingArtifacts: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("View Learning Material"));
  }, [dispatch]);

  useEffect(() => {
    if (!router.isReady) return;

    const loadAllArtifacts = async () => {
      setState({ loadingArtifacts: true });
      try {
        let targetId = router?.query?.course_id;
        let allCoursesList: any[] = [];

        // 1. Fetch all available courses
        try {
          const cListRes: any = await Models.course.list().catch(() => null);
          if (Array.isArray(cListRes)) {
            allCoursesList = cListRes;
          } else if (cListRes?.courses && Array.isArray(cListRes.courses)) {
            allCoursesList = cListRes.courses;
          }
        } catch {}

        if (allCoursesList.length === 0) {
          try {
            const user = localStorage.getItem("user");
            const u = user ? JSON.parse(user) : null;
            const body = { faculty_id: u?.id || 1, coordinator_id: u?.id || 1 };
            const fRes: any = await Models.course.faculty_dashboard_overview(body).catch(() => null);
            allCoursesList = fRes?.courses || [];
          } catch {}
        }

        // 2. Resolve target course ID
        if (!targetId) {
          if (router?.query?.code) {
            const found = allCoursesList.find(
              (c: any) =>
                (c.course_code || c.code)?.toLowerCase() ===
                String(router.query.code).toLowerCase()
            );
            if (found?.id) targetId = found.id;
          }
          if (!targetId && allCoursesList.length > 0) {
            const activeCourse = allCoursesList.find(
              (c: any) =>
                (c.course_code || c.code)?.toUpperCase() === "IT602" ||
                c.syllabus_id ||
                c.latest_syllabus?.id ||
                c.status === "Ready" ||
                c.status === "approved"
            );
            targetId = activeCourse ? activeCourse.id : allCoursesList[0].id;
          }
          if (!targetId && router?.query?.code) {
            targetId = router.query.code;
          }
        }

        if (!targetId) {
          setState({ loadingArtifacts: false, allCourses: allCoursesList });
          return;
        }

        // Fetch course details & workflow status
        const [cData, wfRes]: [any, any] = await Promise.all([
          Models.course.detail(targetId).catch(() => null),
          Models.syllabus.get_workflow_status(targetId).catch(() => null),
        ]);

        const sid =
          wfRes?.syllabus_id ||
          cData?.latest_syllabus?.id ||
          cData?.syllabus_id ||
          cData?.syllabus?.id ||
          targetId;
        const currentCode = cData?.course_code || wfRes?.course_code || "";

        const wfObj = wfRes?.workflow || wfRes || {};
        const step1 = wfObj?.step_1_syllabus_extraction;
        const step2 = wfObj?.step_2_copo_mapping;
        const step3 = wfObj?.step_3_topic_hierarchy;
        const step4 = wfObj?.step_3_pedagogy_generation || wfObj?.step_4_pedagogy_generation;
        const step5 = wfObj?.step_4_lesson_plan_schedules || wfObj?.step_5_lesson_plan_schedules;

        const isSyllabusApprovedAndActive =
          ((step1?.status?.toLowerCase() === "approved") || (cData?.latest_syllabus?.approval_status?.toLowerCase().includes("approved"))) &&
          (step1?.is_active !== false);

        const isCopoApprovedAndActive =
          ((step2?.status?.toLowerCase() === "approved") || (cData?.latest_syllabus?.copo_status?.toLowerCase() === "approved")) &&
          (step2?.versions_detailed?.find((v: any) => v.version_number === step2.active_version)?.is_active ?? step2?.is_active ?? true);

        const isHierarchyApprovedAndActive =
          ((step1?.status?.toLowerCase() === "approved") || (step3?.status?.toLowerCase() === "approved")) &&
          (Number(step1?.total_versions || step3?.total_versions || 1) > 0);

        const isPedagogyApprovedAndActive =
          (step4?.status?.toLowerCase() === "approved") &&
          (Number(step4?.total_versions) > 0);

        const isLessonPlanApprovedAndActive =
          (step5?.status?.toLowerCase() === "approved") &&
          (Number(step5?.total_versions) > 0);

        // Fetch stage-specific approved & active data in parallel
        const [sRes, copoRes, hierSnap, pedSnap, planSnap, qpRes, setsRes]: [any, any, any, any, any, any, any] = await Promise.all([
          isSyllabusApprovedAndActive && sid ? Models.syllabus.detail(sid).catch(() => null) : Promise.resolve(null),
          isCopoApprovedAndActive && sid ? Models.COPOMap.copo_map(sid).catch(() => null) : Promise.resolve(null),
          isHierarchyApprovedAndActive ? Models.syllabus.get_specific_version(targetId, "hierarchy", step3.active_version || 1).catch(() => null) : Promise.resolve(null),
          isPedagogyApprovedAndActive ? Models.syllabus.get_specific_version(targetId, "pedagogy", step4.active_version || 1).catch(() => null) : Promise.resolve(null),
          isLessonPlanApprovedAndActive ? Models.syllabus.get_specific_version(targetId, "schedule", step5.active_version || 1).catch(() => null) : Promise.resolve(null),
          sid ? Models.cia_test.getQuestionPapers(sid).catch(() => null) : Promise.resolve(null),
          Models.mcq.list_sets({ course_id: currentCode || targetId }).catch(() => null),
        ]);

        const rawPapers = qpRes?.papers || (Array.isArray(qpRes) ? qpRes : []);
        const approvedPapers = rawPapers.filter((p: any) => {
          const st = (p.status || "").toLowerCase();
          return st === "approved" || st === "assigned" || st === "ready";
        });

        let firstPaperDetail = null;
        let selectedQpId = null;
        if (approvedPapers.length > 0) {
          selectedQpId = approvedPapers[0].id;
          firstPaperDetail = await Models.cia_test.getQuestionPaperDetail(approvedPapers[0].id).catch(() => null);
        }

        const qSets = Array.isArray(setsRes) ? setsRes : (setsRes?.sets || setsRes?.items || []);

        setState({
          courseData: cData,
          workflowStatus: wfRes,
          syllabusDetail: sRes || (isSyllabusApprovedAndActive ? cData?.latest_syllabus : null),
          copoData: copoRes,
          activeHierarchySnapshot: hierSnap,
          activePedagogySnapshot: pedSnap,
          activeLessonPlanSnapshot: planSnap,
          availableCIAPapers: approvedPapers,
          selectedCIAPaperId: selectedQpId,
          activeCIAPaperDetail: firstPaperDetail,
          rawQuestionSets: qSets,
          allCourses: allCoursesList,
          loadingArtifacts: false,
        });
      } catch (err) {
        console.error("Failed to load course artifacts:", err);
        setState({ loadingArtifacts: false });
      }
    };

    loadAllArtifacts();
  }, [router?.query?.course_id, router?.query?.code, router.isReady]);

  useEffect(() => {
    if (router?.query?.stage) {
      const stageMap: Record<string, string> = {
        extraction: "syllabus",
        copo: "copo",
        hierarchy: "topics",
        pedagogy: "pedagogy",
        schedule: "lesson-plan",
      };
      const targetRef = stageMap[String(router.query.stage)];
      if (targetRef) {
        setState({ selectedReferenceId: targetRef });
      }
    }
  }, [router?.query?.stage]);

  const activeCourseCode = state.courseData?.course_code || "";
  const activeCourseTitle = state.courseData?.course_title || "";
  const activeProgramme = state.courseData?.programme || "";
  const activeBatch = state.courseData?.batch_name || "";
  const activeSemester = state.courseData?.term || "";

  const wfObj = state.workflowStatus?.workflow || state.workflowStatus || {};
  const stageWorkflowMap: Record<string, any> = {
    syllabus: wfObj?.step_1_syllabus_extraction,
    copo: wfObj?.step_2_copo_mapping,
    topics: wfObj?.step_3_topic_hierarchy || wfObj?.step_1_syllabus_extraction,
    pedagogy: wfObj?.step_3_pedagogy_generation || wfObj?.step_4_pedagogy_generation,
    "lesson-plan": wfObj?.step_4_lesson_plan_schedules || wfObj?.step_5_lesson_plan_schedules,
  };
  const activeStageWf = stageWorkflowMap[state.selectedReferenceId] || wfObj?.step_1_syllabus_extraction;

  const activeApprovedBy =
    activeStageWf?.approved_by ||
    wfObj?.step_1_syllabus_extraction?.approved_by ||
    state.courseData?.coordinator_name ||
    "Course Coordinator";

  const rawApprovedDate = activeStageWf?.updated_at || wfObj?.step_1_syllabus_extraction?.updated_at;
  const activeApprovedDate = rawApprovedDate
    ? new Date(rawApprovedDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Approved";

  const activeStageStatusRaw =
    (state.selectedReferenceId === "copo"
      ? state.copoData?.mapping_status || state.copoData?.status || state.copoData?.data?.mapping_status
      : null) ||
    activeStageWf?.status ||
    "approved";

  const formatStatusBadgeText = (status: string, version?: number | null) => {
    const s = (status || "").toLowerCase();
    if (s === "approved") return version ? `Approved v${version}` : "Approved";
    if (s === "draft") return version ? `Draft v${version}` : "Draft";
    if (s === "generating") return "Generating...";
    if (s === "redis_queued") return "Queued...";
    if (s === "not_started") return "Not Started";
    if (s === "failed") return "Failed";
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Approved";
  };

  const activeVersionBadgeText = formatStatusBadgeText(activeStageStatusRaw, activeStageWf?.active_version);

  const dynamicOutcomes = (state.syllabusDetail?.outcomes || []).map((co: any, idx: number) => ({
    id: String(co.id || idx + 1),
    coCode: co.co_code || `CO${idx + 1}`,
    statement: co.description || "",
    knowledgeLevel: co.knowledge_level || "K2",
  }));

  const dynamicUnits = (state.syllabusDetail?.units || []).map((u: any, idx: number) => ({
    id: `unit-${u.unit_number || idx + 1}`,
    unitNumber: u.unit_number || idx + 1,
    unitTitle: u.unit_title || `Unit ${idx + 1}`,
    hoursText: `${u.theory_hours || 0} Hours`,
    topicsCountText: `${(u.topics || []).length} Topics`,
    topics: (u.topics || []).map((t: any, tIdx: number) => ({
      code: t.topic_code || `${u.unit_number || idx + 1}.${tIdx + 1}`,
      title: t.topic_name || "",
    })),
  }));

  const unitTheorySum = (state.syllabusDetail?.units || []).reduce(
    (acc: number, u: any) => acc + (Number(u.theory_hours) || 0),
    0
  );
  const dynamicTheoryHours = String(
    (unitTheorySum > 0 ? unitTheorySum : null) ??
      (Number(state.syllabusDetail?.total_theory_hours) > 0 ? state.syllabusDetail.total_theory_hours : null) ??
      (Number(state.syllabusDetail?.theory_hours) > 0 ? state.syllabusDetail.theory_hours : null) ??
      (Number(state.courseData?.total_theory_hours) > 0 ? state.courseData.total_theory_hours : null) ??
      (Number(state.courseData?.lecture_hours) > 0 ? state.courseData.lecture_hours * 15 : null) ??
      0
  );

  const unitLabSum = (state.syllabusDetail?.units || []).reduce(
    (acc: number, u: any) => acc + (Number(u.lab_hours) || 0),
    0
  );
  const dynamicLabHours = String(
    (Number(state.syllabusDetail?.total_lab_hours) > 0 ? state.syllabusDetail.total_lab_hours : null) ??
      (unitLabSum > 0 ? unitLabSum : null) ??
      (Number(state.syllabusDetail?.lab_hours) > 0 ? state.syllabusDetail.lab_hours : null) ??
      (Number(state.courseData?.total_lab_hours) > 0 ? state.courseData.total_lab_hours : null) ??
      (Number(state.courseData?.practical_hours) > 0 ? state.courseData.practical_hours * 15 : null) ??
      0
  );

  const courseInfoStats = [
    { label: "Theory Hours", value: String(dynamicTheoryHours) },
    { label: "Lab Hours", value: String(dynamicLabHours) },
    { label: "Tutorial Hours", value: String(state.syllabusDetail?.tutorial_hours ?? state.courseData?.tutorial_hours ?? 0) },
    { label: "Total Credits", value: String(state.syllabusDetail?.credits ?? state.courseData?.credits ?? 0), isPurpleLabel: true, isHighlighted: true },
    { label: "COs Mapped", value: String(dynamicOutcomes.length), isPurpleLabel: true, isHighlighted: true },
    { label: "Units Count", value: String(dynamicUnits.length) },
  ];

  const dynamicTextbooks = (state.syllabusDetail?.textbooks || []).map((b: any, idx: number) => ({
    id: `tb-${b.id || idx + 1}`,
    title: b.title || "",
    authors: Array.isArray(b.authors) ? b.authors.join(", ") : b.authors || "",
    publisher: [b.publisher, b.edition].filter(Boolean).join(" · "),
  }));

  const dynamicReferences = (state.syllabusDetail?.reference_books || []).map((b: any, idx: number) => ({
    id: `ref-${b.id || idx + 1}`,
    title: b.title || "",
    authors: Array.isArray(b.authors) ? b.authors.join(", ") : b.authors || "",
    publisher: [b.publisher, b.edition].filter(Boolean).join(" · "),
  }));

  const dynamicLaboratoryExperiments = (
    state.syllabusDetail?.laboratory_experiments ||
    state.syllabusDetail?.laboratoryExperiments ||
    state.syllabusDetail?.experiments ||
    []
  ).map((e: any, idx: number) => ({
    id: `exp-${e.id || idx + 1}`,
    title: e.title || e.experiment_title || `Experiment ${idx + 1}`,
    hours: e.allocated_hours || e.hours || 0,
  }));

  const rawMatrix =
    state.copoData?.matrix ||
    state.copoData?.data?.matrix ||
    state.copoData?.copo_matrix ||
    {};

  const rawPos =
    (state.copoData?.program_outcomes?.length ? state.copoData?.program_outcomes : null) ||
    (state.copoData?.data?.program_outcomes?.length ? state.copoData?.data?.program_outcomes : null) ||
    (state.copoData?.pos?.length ? state.copoData?.pos : null) ||
    [];

  const rawCos =
    (state.copoData?.course_outcomes?.length ? state.copoData?.course_outcomes : null) ||
    (state.copoData?.data?.course_outcomes?.length ? state.copoData?.data?.course_outcomes : null) ||
    (state.copoData?.outcomes?.length ? state.copoData?.outcomes : null) ||
    (state.syllabusDetail?.outcomes?.length ? state.syllabusDetail?.outcomes : null) ||
    Object.keys(rawMatrix).map((coKey) => ({ co_code: coKey, code: coKey }));

  const defaultPos = ["PO01", "PO02", "PO03", "PO04", "PO05", "PO06", "PO07", "PO08", "PO09", "PO10", "PO11"];

  const dynamicPoHeaders: string[] =
    rawPos.length > 0
      ? rawPos.map((po: any) => po.code || po.po_code || `PO${po.id}`)
      : Object.keys(rawMatrix[Object.keys(rawMatrix)[0]] || {}).length > 0
      ? Object.keys(rawMatrix[Object.keys(rawMatrix)[0]] || {})
      : defaultPos;

  const dynamicCopoRows = rawCos.map((co: any, idx: number) => {
    const coCode = co.co_code || co.code || co.coCode || (typeof co === "string" ? co : `CO${co.id || idx + 1}`);
    const scores: Record<string, number> = {};
    const rowObj =
      rawMatrix[coCode] ||
      rawMatrix[co.co_code] ||
      rawMatrix[co.code] ||
      rawMatrix[String(co.id)] ||
      rawMatrix[`CO${idx + 1}`] ||
      {};

    dynamicPoHeaders.forEach((poKey) => {
      const exactVal = rowObj[poKey];
      const fallbackKey = Object.keys(rowObj).find(
        (k) => k.toLowerCase().replace(/[^a-z0-9]/g, "") === poKey.toLowerCase().replace(/[^a-z0-9]/g, "")
      );
      const val = exactVal !== undefined ? exactVal : fallbackKey ? rowObj[fallbackKey] : undefined;
      scores[poKey] = typeof val === "object" && val !== null ? Number(val.score ?? 0) : Number(val || 0);
    });
    return { coCode, poScores: scores };
  });

  const dynamicRationaleItems = rawCos.map((co: any, idx: number) => {
    const coCode = co.co_code || co.code || co.coCode || (typeof co === "string" ? co : `CO${co.id || idx + 1}`);
    const rowObj =
      rawMatrix[coCode] ||
      rawMatrix[co.co_code] ||
      rawMatrix[co.code] ||
      rawMatrix[String(co.id)] ||
      rawMatrix[`CO${idx + 1}`] ||
      {};

    const mappedPos = Object.keys(rowObj)
      .filter((k) => (Number(typeof rowObj[k] === "object" ? rowObj[k]?.score : rowObj[k]) || 0) > 0)
      .map((k) => {
        const val = rowObj[k];
        const score = typeof val === "object" ? val?.score : val;
        const rationale = typeof val === "object" ? (val?.justification || val?.rationale) : undefined;
        return {
          id: `${coCode}-${k}`,
          poCode: k,
          poTitle: (typeof val === "object" && val?.po_title) || k,
          strengthText: `Strength: ${score}`,
          strengthBadgeClass: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300",
          rationale: rationale || "Aligned with course outcome requirements.",
        };
      });

    return {
      id: coCode,
      coCode,
      statement: co.description || co.statement || co.title || "",
      mappedCountText: `${mappedPos.length} mapped outcomes`,
      poItems: mappedPos,
    };
  });

  const isSyllabusApprovedAndActive =
    ((wfObj?.step_1_syllabus_extraction?.status?.toLowerCase() === "approved") || (state.syllabusDetail?.approval_status?.toLowerCase().includes("approved"))) &&
    (wfObj?.step_1_syllabus_extraction?.is_active !== false) &&
    (state.syllabusDetail?.is_archived !== true);

  const isCopoApprovedAndActive =
    ((wfObj?.step_2_copo_mapping?.status?.toLowerCase() === "approved") || (state.copoData?.mapping_status?.toLowerCase() === "approved") || (state.copoData?.status?.toLowerCase() === "approved")) &&
    (wfObj?.step_2_copo_mapping?.versions_detailed?.find((v: any) => v.version_number === wfObj?.step_2_copo_mapping.active_version)?.is_active ?? wfObj?.step_2_copo_mapping?.is_active ?? true);

  const isHierarchyApprovedAndActive =
    ((wfObj?.step_1_syllabus_extraction?.status?.toLowerCase() === "approved") ||
     (wfObj?.step_3_topic_hierarchy?.status?.toLowerCase() === "approved")) &&
    (Number(wfObj?.step_1_syllabus_extraction?.total_versions || wfObj?.step_3_topic_hierarchy?.total_versions || 1) > 0);

  const isPedagogyApprovedAndActive =
    ((wfObj?.step_3_pedagogy_generation?.status?.toLowerCase() === "approved") ||
     (wfObj?.step_4_pedagogy_generation?.status?.toLowerCase() === "approved")) &&
    (Number(wfObj?.step_3_pedagogy_generation?.total_versions || wfObj?.step_4_pedagogy_generation?.total_versions || 0) > 0);

  const isLessonPlanApprovedAndActive =
    ((wfObj?.step_4_lesson_plan_schedules?.status?.toLowerCase() === "approved") ||
     (wfObj?.step_5_lesson_plan_schedules?.status?.toLowerCase() === "approved")) &&
    (Number(wfObj?.step_4_lesson_plan_schedules?.total_versions || wfObj?.step_5_lesson_plan_schedules?.total_versions || 0) > 0);

  // Topics: MUST come from topic hierarchy generation, NOT from extraction, NO timing
  const dynamicTopicUnits = isHierarchyApprovedAndActive && state.activeHierarchySnapshot ? (
    (state.activeHierarchySnapshot.data_ai_gave?.units || state.activeHierarchySnapshot.data_ai_gave || state.activeHierarchySnapshot.units || []).map((u: any, idx: number) => ({
      id: `topic-unit-${u.unitNumber || u.unit_number || idx + 1}`,
      unitNumber: u.unitNumber || u.unit_number || idx + 1,
      unitCodeText: `Unit ${u.unitNumber || u.unit_number || idx + 1}`,
      title: u.unitTitle || u.title || `Unit ${idx + 1}`,
      topicsCountText: `${(u.topics || []).length} Topics`,
      topics: (u.topics || []).map((t: any, tIdx: number) => ({
        code: t.topicId || t.code || `${u.unitNumber || idx + 1}.${tIdx + 1}`,
        title: t.title || t.topicName || t.topic_name || "",
        description: t.description || "",
        levelText: t.bloomLevel || t.knowledge_level ? `Knowledge Level: ${t.bloomLevel || t.knowledge_level}` : "",
        subtopics: (t.subtopics || []).map((st: any, stIdx: number) => ({
          code: st.subtopicId || st.code || `${t.topicId || tIdx + 1}.${stIdx + 1}`,
          title: st.title || st.subtopicName || st.subtopic_name || (typeof st === "string" ? st : ""),
        })),
      })),
    }))
  ) : [];

  // Pedagogy: MUST come from pedagogy generation version data, NOT from extraction
  const dynamicPedagogyUnits = isPedagogyApprovedAndActive && state.activePedagogySnapshot ? (
    (state.activePedagogySnapshot.data_ai_gave?.units || state.activePedagogySnapshot.data_ai_gave || state.activePedagogySnapshot.units || []).map((u: any, idx: number) => {
      const uNum = u.unitNumber || u.unit_number || idx + 1;
      const uTitle = u.unitTitle || u.title || `Unit ${uNum}`;
      const topics = (u.topics || []).map((t: any, tIdx: number) => ({
        code: t.topicId || t.code || `${uNum}.${tIdx + 1}`,
        title: t.title || t.topicName || t.topic_name || "",
        description: t.description || "",
        bloomLevel: (t.bloomLevel || t.knowledge_level || "K2").replace("Knowledge Level: ", "").trim(),
        teachingApproaches: (t.suggested_pedagogies || t.pedagogies || [])
          .map((p: any) => (typeof p === "string" ? p : p.strategy_name || p.pedagogy_name || p.name))
          .filter(Boolean),
      }));
      return {
        id: `ped-unit-${uNum}`,
        unitNumber: uNum,
        unitCodeText: `Unit ${uNum}`,
        title: uTitle,
        topicsCountText: `${topics.length} Topics`,
        topics,
      };
    })
  ) : [];

  // Lesson Plan: MUST come from lesson plan version data, NOT from extraction
  const dynamicLessonUnits = isLessonPlanApprovedAndActive && state.activeLessonPlanSnapshot ? (
    (state.activeLessonPlanSnapshot.data_ai_gave?.units || state.activeLessonPlanSnapshot.data_ai_gave || state.activeLessonPlanSnapshot.units || []).map((u: any, idx: number) => {
      const uNum = u.unitNumber || u.unit_number || idx + 1;
      const uTitle = u.unitTitle || u.title || `Unit ${uNum}`;
      const sessions = u.sessions || u.hourly_schedule || u.topics || [];
      const topics = sessions.map((s: any, sIdx: number) => ({
        code: s.topic_code || s.seq || `${uNum}.${sIdx + 1}`,
        title: s.topic_name ? `${s.topic_name}${s.subtopic ? ` — ${s.subtopic}` : ""}` : (s.subtopic || s.title || `Session ${sIdx + 1}`),
        description: s.books_display || s.description || "",
        bloomLevel: s.level || s.bloom_level || "K2",
        hoursText: s.hours_display || `${s.hours || 1} Hour${(s.hours || 1) > 1 ? "s" : ""}`,
        pedagogy: Array.isArray(s.pedagogy) ? s.pedagogy : [s.pedagogy || "Lecture"],
        textbook: s.textbook || "",
        referenceBook: s.reference_book || "",
      }));
      return {
        id: `lesson-unit-${uNum}`,
        unitNumber: uNum,
        unitCodeText: `Unit ${uNum}`,
        title: uTitle,
        hoursText: `${sessions.reduce((acc: number, s: any) => acc + (Number(s.hours) || 1), 0)} Hours`,
        topicsCountText: `${topics.length} Sessions`,
        topics,
      };
    })
  ) : [];

  const extractPartA = (detail: any) => {
    if (!detail || !detail.sections) return [];
    const secA = detail.sections.find((s: any) => (s.section_letter || s.section_name || "").toUpperCase() === "A") || detail.sections[0];
    if (!secA) return [];
    return (secA.questions || []).map((q: any, idx: number) => ({
      id: String(q.id || idx),
      qNo: `${q.question_number || idx + 1}.`,
      question: q.question_text || q.question_statement || "",
      coTag: [q.course_outcome, q.knowledge_level].filter(Boolean).join(" • ") || "CO1 • K2",
      marks: `${q.marks || 2} Marks`,
    }));
  };

  const extractPartB = (detail: any) => {
    if (!detail || !detail.sections) return [];
    const secB = detail.sections.find((s: any) => (s.section_letter || s.section_name || "").toUpperCase() === "B") || (detail.sections.length > 1 ? detail.sections[1] : null);
    if (!secB) return [];
    const qs = secB.questions || [];
    const pairs: any[] = [];
    for (let i = 0; i < qs.length; i += 2) {
      const qA = qs[i];
      const qB = qs[i + 1] || qA;
      pairs.push({
        id: String(qA.id || i),
        qNoA: `${qA.question_number || (Math.floor(i / 2) + 6)}. (a)`,
        questionA: qA.question_text || qA.question_statement || "",
        coTagA: [qA.course_outcome, qA.knowledge_level].filter(Boolean).join(" • ") || "CO1 • K3",
        marksA: `${qA.marks || 8} Marks`,
        qNoB: `${(qB.question_number || (Math.floor(i / 2) + 6))}. (b)`,
        questionB: qB.question_text || qB.question_statement || "",
        coTagB: [qB.course_outcome, qB.knowledge_level].filter(Boolean).join(" • ") || "CO1 • K3",
        marksB: `${qB.marks || 8} Marks`,
      });
    }
    return pairs;
  };

  const dynamicLearningMaterialUnits = (() => {
    if (state.learningUnits && state.learningUnits.length > 0) {
      return state.learningUnits
        .map((mResp: any, idx: number) => {
          const su = mResp?.selected_unit || {};
          const uNum = su.unit_number || idx + 1;
          const uTitle = su.unit_title || `Unit ${uNum}`;
          const approvedTopics = (su.topics || []).filter(
            (t: any) => t.status === "Approved" || t.status === "approved"
          );
          if (approvedTopics.length === 0) return null;

          const topics = approvedTopics.map((t: any) => ({
            id: `mat-${t.topic_id || t.topic_code || idx}`,
            topicCode: t.topic_code || "",
            topicTitle: t.topic_name || "",
            materialTitle: `${t.topic_name} — Lecture Notes & Study Guide`,
            versionText: "v1.0",
            approvedDateText: "Approved Curriculum",
            details: {
              approvedBy: activeApprovedBy,
              approvedDate: activeApprovedDate,
              overview: `Curriculum reference notes for ${t.topic_name}.`,
              learningContent: [],
            },
          }));

          return {
            id: `lm-unit-${uNum}`,
            unitNumber: uNum,
            unitCodeText: `Unit ${uNum}`,
            title: uTitle,
            materialsCountText: `${topics.length} Approved Materials`,
            materials: topics,
          };
        })
        .filter(Boolean);
    }

    return [];
  })();

  const dynamicQuestionBankUnits = (() => {
    const rawQs = state.rawQuestions || [];
    if (rawQs.length > 0) {
      const unitMap: Record<number, any[]> = {};
      rawQs.forEach((q: any) => {
        const uNum = Number(q.unit_number) || 1;
        if (!unitMap[uNum]) unitMap[uNum] = [];
        unitMap[uNum].push(q);
      });

      const allUnitNums = Array.from(
        new Set([...dynamicUnits.map((u: any) => u.unitNumber), ...Object.keys(unitMap).map(Number)])
      ).sort((a, b) => a - b);

      return allUnitNums.map((uNum) => {
        const matchedUnit = dynamicUnits.find((u: any) => u.unitNumber === uNum);
        const qList = unitMap[uNum] || [];
        const questions = qList.map((q: any) => ({
          id: q.id,
          questionCode: q.question_code || `Q-${String(q.id).slice(0, 6)}`,
          topicCode: q.topic || `Topic ${uNum}.1`,
          topicTitle: q.topic || matchedUnit?.unitTitle || `Unit ${uNum}`,
          questionText: q.text || "",
          tags: [
            q.course_outcome || "CO1",
            q.knowledge_level || "K2",
            "MCQ",
            `${q.marks || 2} Marks`,
            q.difficulty ? q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1) : "Medium",
          ],
          options: (q.options || []).map((opt: any, oIdx: number) => ({
            key: String.fromCharCode(65 + oIdx),
            text: typeof opt === "string" ? opt : opt.text || "",
            isCorrect: typeof opt === "object" ? Boolean(opt.is_correct) : false,
          })),
          correctAnswer: (q.options || []).find((o: any) => o.is_correct)?.text || "",
          explanation: q.explanation || "",
        }));

        return {
          id: `qb-unit-${uNum}`,
          unitNumber: uNum,
          unitCodeText: `Unit ${uNum}`,
          title: matchedUnit?.unitTitle || `Unit ${uNum}`,
          questionsCountText: `${questions.length} Question${questions.length === 1 ? "" : "s"}`,
          questions: questions,
        };
      });
    }

    return (dynamicUnits || []).map((u: any) => ({
      id: `qb-unit-${u.unitNumber}`,
      unitNumber: u.unitNumber,
      unitCodeText: `Unit ${u.unitNumber}`,
      title: u.unitTitle,
      questionsCountText: `0 Questions`,
      questions: [],
    }));
  })();

  const referenceItems: ReferenceItem[] = [
    {
      id: "syllabus",
      icon: (
        <FileText
          className={`h-5 w-5 ${
            state.selectedReferenceId === "syllabus"
              ? "text-white"
              : "text-pri dark:text-gray-400"
          }`}
        />
      ),
      title: "Syllabus",
      subtitle: `${dynamicUnits.length} Units • ${dynamicOutcomes.length} Outcomes`,
      isActive: state.selectedReferenceId === "syllabus",
      isCompleted: isSyllabusApprovedAndActive && dynamicUnits.length > 0,
    },
    {
      id: "copo",
      icon: (
        <GitBranch
          className={`h-5 w-5 ${
            state.selectedReferenceId === "copo"
              ? "text-white"
              : "text-pri dark:text-gray-400"
          }`}
        />
      ),
      title: "CO-PO Mapping",
      subtitle: `${dynamicPoHeaders.length} Program Outcomes • ${dynamicOutcomes.length} COs`,
      isActive: state.selectedReferenceId === "copo",
      isCompleted: isCopoApprovedAndActive && dynamicPoHeaders.length > 0,
    },
    {
      id: "topics",
      icon: (
        <Layers
          className={`h-5 w-5 ${
            state.selectedReferenceId === "topics"
              ? "text-white"
              : "text-pri dark:text-gray-400"
          }`}
        />
      ),
      title: "Topics",
      subtitle: `${dynamicTopicUnits.length} Units • ${dynamicTopicUnits.reduce((acc: number, u: any) => acc + (u.topics?.length || 0), 0)} Topics`,
      isActive: state.selectedReferenceId === "topics",
      isCompleted: isHierarchyApprovedAndActive && dynamicTopicUnits.length > 0,
    },
    {
      id: "pedagogy",
      icon: (
        <GraduationCap
          className={`h-5 w-5 ${
            state.selectedReferenceId === "pedagogy"
              ? "text-white"
              : "text-pri dark:text-gray-400"
          }`}
        />
      ),
      title: "Pedagogy",
      subtitle: `${dynamicPedagogyUnits.length} Units • ${dynamicPedagogyUnits.reduce((acc: number, u: any) => acc + (u.topics?.length || 0), 0)} Teaching Approaches`,
      isActive: state.selectedReferenceId === "pedagogy",
      isCompleted: isPedagogyApprovedAndActive && dynamicPedagogyUnits.length > 0,
    },
    {
      id: "lesson-plan",
      icon: (
        <Calendar
          className={`h-5 w-5 ${
            state.selectedReferenceId === "lesson-plan"
              ? "text-white"
              : "text-pri dark:text-gray-400"
          }`}
        />
      ),
      title: "Lesson Plan",
      subtitle: `${dynamicLessonUnits.length} Units • ${dynamicLessonUnits.reduce((acc: number, u: any) => acc + (u.topics?.length || 0), 0)} Scheduled Sessions`,
      isActive: state.selectedReferenceId === "lesson-plan",
      isCompleted: isLessonPlanApprovedAndActive && dynamicLessonUnits.length > 0,
    },
    {
      id: "learning-materials",
      icon: (
        <BookOpen
          className={`h-5 w-5 ${
            state.selectedReferenceId === "learning-materials"
              ? "text-white"
              : "text-pri dark:text-gray-400"
          }`}
        />
      ),
      title: "Learning Materials",
      subtitle: "On Hold",
      isActive: state.selectedReferenceId === "learning-materials",
      isCompleted: false,
    },
  ];

  const assessmentItems: ReferenceItem[] = [
    {
      id: "question-bank",
      icon: (
        <HelpCircle
          className={`h-5 w-5 ${
            state.selectedReferenceId === "question-bank"
              ? "text-white"
              : "text-pri dark:text-gray-400"
          }`}
        />
      ),
      title: "Question Bank",
      subtitle: `${(state.rawQuestionSets || []).length} Question Set${(state.rawQuestionSets || []).length === 1 ? "" : "s"}`,
      isActive: state.selectedReferenceId === "question-bank",
      isCompleted: (state.rawQuestionSets || []).length > 0,
    },
    {
      id: "cia-papers",
      icon: (
        <FileCode
          className={`h-5 w-5 ${
            state.selectedReferenceId === "cia-papers"
              ? "text-white"
              : "text-pri dark:text-gray-400"
          }`}
        />
      ),
      title: "CIA Question Papers",
      subtitle: `${(state.availableCIAPapers || []).length} Approved Paper${(state.availableCIAPapers || []).length === 1 ? "" : "s"}`,
      isActive: state.selectedReferenceId === "cia-papers",
      isCompleted: (state.availableCIAPapers || []).length > 0,
    },
  ];

  const renderNotApprovedState = (title: string, message: string) => (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-xs dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 mb-4">
        <Sparkles className="h-6 w-6" />
      </div>
      <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h4>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
        {message}
      </p>
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        <span>Requires Coordinator Approval & Active Status</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-8">
      <CourseBanner
        courseCode={activeCourseCode || "Course"}
        courseTitle={activeCourseTitle || "Course Artifacts"}
        description="Instructor View — Access approved academic artifacts, active syllabus, outcomes mapping, topic hierarchy, pedagogy, and lesson plans."
        programme={activeProgramme}
        batch={activeBatch}
        academicYear={state.courseData?.academic_year || ""}
        students={`${state.courseData?.students_count ?? 0} Students`}
        selectedCourse={activeCourseCode}
        courseOptions={(state.allCourses || []).map((c: any) => ({
          value: String(c.id),
          label: `${c.course_code || c.code} — ${c.course_title || c.title}`,
        }))}
        onCourseChange={(val) => {
          const targetId = typeof val === "object" ? val?.value : val;
          const selected = (state.allCourses || []).find((c: any) => String(c.id) === String(targetId));
          if (selected) {
            router.push(
              `/neurobe/ins-course-artifacts?course_id=${selected.id}&code=${selected.course_code || selected.code}`
            );
          }
        }}
        toogle="instructor"
        activeView={state.activeTab}
        onBack={() => {
          if (router?.query?.from === "my-courses") {
            router.push("/neurobe/my-assigned-courses");
          } else {
            router.back();
          }
        }}
        onViewChange={(view) => {
          setState({ activeTab: view });
          if (view === "coordinator") {
            router.push(
              `/neurobe/course-artifacts?course_id=${state.courseData?.id || router?.query?.course_id || ""}&code=${activeCourseCode}`
            );
          }
        }}
      />

      {/* ── Course Instructor View Banner ── */}
      <div className="mx-6 mt-4 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 p-4 shadow-xs dark:border-indigo-800/60 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Course Instructor View
              </h3>
              <span className="rounded-full border border-indigo-300 bg-indigo-100 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                Active Approved Versions Only
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Read-only view of the coordinator-approved curriculum and active academic artifacts for this course.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            if (router?.query?.from === "my-courses") {
              router.push("/neurobe/my-assigned-courses");
            } else {
              router.back();
            }
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-4 py-2 text-xs font-bold text-indigo-700 shadow-sm transition-all hover:bg-indigo-50 active:scale-95 dark:border-indigo-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
        >
          ← Back
        </button>
      </div>

      <PageHeader
        title="Course Artifacts"
        records={
          activeCourseCode && activeCourseTitle
            ? `${activeCourseCode} — ${activeCourseTitle}`
            : activeCourseCode || "Course Artifacts"
        }
        subtitle={`Access active approved academic references prepared for this course.`}
        icon={<Users className="h-5 w-5 text-color2" />}
        record2="Instructor View"
        record3="Active Version Only"
      />

      {/* Main Grid Layout: Left Course References Navigation + Right Artifact Details */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Course References List */}
        <div className="lg:col-span-4 xl:col-span-3">
          <CourseReferencesCard
            title="COURSE REFERENCES"
            availableCountText={`${[...referenceItems, ...assessmentItems].filter((i) => i.isCompleted).length} Available References`}
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
                  : null;

            const activeUnitsCountText = (() => {
              switch (state.selectedReferenceId) {
                case "syllabus":
                  return `${dynamicUnits.length} Units`;
                case "copo":
                  return `${dynamicPoHeaders.length} Program Outcomes • ${dynamicOutcomes.length} COs`;
                case "topics":
                  return `${dynamicTopicUnits.length} Units • ${dynamicTopicUnits.reduce((acc: number, u: any) => acc + (u.topics?.length || 0), 0)} Topics`;
                case "pedagogy":
                  return `${dynamicPedagogyUnits.length} Units`;
                case "lesson-plan":
                  return `${dynamicLessonUnits.length} Units`;
                case "learning-materials":
                  return "On Hold";
                case "question-bank":
                  return `${(state.rawQuestionSets || []).length} Question Sets`;
                case "cia-papers":
                  return `${state.availableCIAPapers?.length || 0} Approved Papers`;
                default:
                  return `${dynamicUnits.length} Units`;
              }
            })();

            const isCurrentStageApproved = (() => {
              switch (state.selectedReferenceId) {
                case "syllabus":
                  return isSyllabusApprovedAndActive;
                case "copo":
                  return isCopoApprovedAndActive;
                case "topics":
                  return isHierarchyApprovedAndActive && dynamicTopicUnits.length > 0;
                case "pedagogy":
                  return isPedagogyApprovedAndActive && dynamicPedagogyUnits.length > 0;
                case "lesson-plan":
                  return isLessonPlanApprovedAndActive && dynamicLessonUnits.length > 0;
                case "learning-materials":
                  return false;
                case "question-bank":
                  return (state.rawQuestionSets || []).length > 0;
                case "cia-papers":
                  return (state.availableCIAPapers || []).length > 0;
                default:
                  return true;
              }
            })();

            return (
              <>
                {state.selectedReferenceId !== "cia-papers" && (
                  <SyllabusHeaderCard
                    title={currentHeaderData.title}
                    icon={currentHeaderData.icon}
                    subtitle={currentHeaderData.subtitle}
                    approvedBy={activeApprovedBy}
                    approvedDate={activeApprovedDate}
                    unitsCountText={activeUnitsCountText}
                    versionBadgeText={isCurrentStageApproved ? activeVersionBadgeText : "Not Approved"}
                    bannerProgramme={activeProgramme}
                    bannerBatch={activeBatch}
                    bannerSemester={activeSemester}
                    courseCode={activeCourseCode}
                    courseTitle={activeCourseTitle}
                  />
                )}

                {state.selectedReferenceId === "cia-papers" && (
                  <div id="cia-papers-section" className="space-y-4 scroll-mt-36">
                    <CIAQuestionPapersCard
                      title="CIA QUESTION PAPERS"
                      subtitle="Continuous Internal Assessment examination papers approved for this course."
                      courseCode={activeCourseCode}
                      courseTitle={activeCourseTitle}
                      programme={activeProgramme}
                      batch={activeBatch}
                      semester={activeSemester}
                    />
                    {(state.availableCIAPapers || []).length > 0 ? (
                      <>
                        {/* Sliding Window / Paper Selector */}
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {(state.availableCIAPapers || []).map((paper: any, idx: number) => {
                            const isSelected = state.selectedCIAPaperId === paper.id;
                            return (
                              <button
                                key={paper.id || idx}
                                type="button"
                                onClick={async () => {
                                  setState({ selectedCIAPaperId: paper.id, loadingCIAPaper: true });
                                  try {
                                    const detail = await Models.cia_test.getQuestionPaperDetail(paper.id);
                                    setState({ activeCIAPaperDetail: detail, loadingCIAPaper: false });
                                  } catch {
                                    setState({ loadingCIAPaper: false });
                                  }
                                }}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                                  isSelected
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <FileCode className="h-4 w-4" />
                                <span>{paper.name || paper.title || `CIA Paper ${idx + 1}`}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    isSelected
                                      ? "bg-white/20 text-white"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                                  }`}
                                >
                                  {paper.status || "Approved"}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <CIAPaperHeaderCard
                          selectedPaperName={
                            (state.availableCIAPapers || []).find((p: any) => p.id === state.selectedCIAPaperId)?.name ||
                            state.activeCIAPaperDetail?.title ||
                            "Approved CIA Paper"
                          }
                          versionBadgeText="Approved"
                          approvedBy={activeApprovedBy}
                          approvedDate={activeApprovedDate}
                          onPrint={() => window.print()}
                        />

                        <div id="printable-question-paper">
                          <CIAQuestionPaperViewCard
                            department={state.courseData?.department || "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING"}
                            assessmentTitle={
                              state.activeCIAPaperDetail?.title ||
                              (state.availableCIAPapers || []).find((p: any) => p.id === state.selectedCIAPaperId)?.name ||
                              "CONTINUOUS INTERNAL ASSESSMENT"
                            }
                            courseCodeTitle={`${activeCourseCode} — ${activeCourseTitle}`}
                            programme={activeProgramme}
                            semester={activeSemester}
                            academicYear={state.courseData?.academic_year || "Current Academic Year"}
                            partAQuestions={extractPartA(state.activeCIAPaperDetail)}
                            partBQuestions={extractPartB(state.activeCIAPaperDetail)}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="rounded-3xl border border-gray-200/80 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                        <FileCode className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">No CIA Question Papers Available</h4>
                        <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
                          No continuous internal assessment question papers have been approved for this course yet.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {((state.selectedReferenceId === "syllabus" && isSyllabusApprovedAndActive) ||
                  (state.selectedReferenceId === "copo" && isCopoApprovedAndActive)) &&
                  activeTabs && (
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

                {state.selectedReferenceId === "syllabus" &&
                  (isSyllabusApprovedAndActive ? (
                    <>
                      <div id="course-info" className="scroll-mt-36">
                        <CourseInformationCard
                          courseCode={activeCourseCode}
                          courseTitle={activeCourseTitle}
                          creditStats={courseInfoStats}
                        />
                      </div>

                      <div id="course-outcomes" className="scroll-mt-36">
                        <CourseOutcomesCard
                          title="COURSE OUTCOMES"
                          approvedCountText={`${dynamicOutcomes.length} Approved Statements`}
                          outcomes={dynamicOutcomes}
                          coverageUnitsText={`${dynamicUnits.length} Units`}
                          coverageTheoryHoursText={`${dynamicTheoryHours} Theory Hours`}
                          coverageLabHoursText={`${dynamicLabHours} Lab Hours`}
                          coverageTopicsText={`${dynamicUnits.reduce((acc: number, u: any) => acc + (u.topics?.length || 0), 0)} Syllabus Topics`}
                        />
                      </div>

                      <div id="unit-syllabus" className="scroll-mt-36">
                        <UnitWiseSyllabusCard
                          title="UNIT-WISE SYLLABUS"
                          headerStatsText={`${dynamicUnits.length} Units`}
                          units={dynamicUnits}
                          onHierarchyClick={(unitNum) =>
                            console.log("Hierarchy clicked for unit:", unitNum)
                          }
                        />
                      </div>

                      <div id="theory-lab" className="scroll-mt-36">
                        <TheoryAndLabCard
                          title="THEORY & LABORATORY"
                          headerSubtitle="Curriculum Allocation"
                          theoryHours={dynamicTheoryHours}
                          labHours={dynamicLabHours}
                          experiments={dynamicLaboratoryExperiments}
                        />
                      </div>

                      <div id="textbooks" className="scroll-mt-36">
                        <TextbooksCard
                          title="TEXTBOOKS"
                          headerSubtitle="Approved Prescribed Literature"
                          textbooks={dynamicTextbooks}
                        />
                      </div>

                      <div id="reference-books" className="scroll-mt-36">
                        <ReferenceBooksCard
                          title="REFERENCE BOOKS"
                          headerSubtitle="Supplementary Academic References"
                          references={dynamicReferences}
                        />
                      </div>
                    </>
                  ) : (
                    renderNotApprovedState(
                      "Syllabus Not Approved or Inactive",
                      "The syllabus extraction for this course has not yet been approved and set active by the course coordinator."
                    )
                  ))}

                {state.selectedReferenceId === "copo" &&
                  (isCopoApprovedAndActive ? (
                    <>
                      <div id="course-outcomes" className="scroll-mt-36">
                        <CourseOutcomesCard
                          title="COURSE OUTCOMES"
                          approvedCountText={`${dynamicOutcomes.length} Approved Statements`}
                          outcomes={dynamicOutcomes}
                          isCopoView={true}
                        />
                      </div>

                      <div id="copo-matrix" className="scroll-mt-36">
                        <CopoMappingMatrixCard
                          title="CO–PO MAPPING MATRIX"
                          subtitle="Shows how each Course Outcome is mapped to the Program Outcomes."
                          headerStatsText={`${dynamicOutcomes.length} × ${dynamicPoHeaders.length} Matrix`}
                          poHeaders={dynamicPoHeaders}
                          rows={dynamicCopoRows}
                        />
                      </div>

                      <div id="mapping-rationale" className="scroll-mt-36">
                        <MappingRationaleCard
                          title="MAPPING RATIONALE"
                          subtitle="Detailed justification for each mapped Course Outcome."
                          headerStatsText={`${dynamicRationaleItems.length} Outcomes`}
                          items={dynamicRationaleItems}
                        />
                      </div>

                      <div id="program-outcomes" className="scroll-mt-36">
                        <MappingRationaleCard
                          title="PROGRAM OUTCOMES"
                          subtitle="View the Program Outcomes used for this course mapping."
                          headerStatsText={`${dynamicPoHeaders.length} Program Outcomes`}
                          items={(state.copoData?.program_outcomes || []).map((po: any) => ({
                            id: po.code || po.po_code,
                            poCode: po.code || po.po_code,
                            poTitle: po.title || po.name || po.code,
                            description: po.description || po.statement || "",
                          }))}
                        />
                      </div>
                    </>
                  ) : (
                    renderNotApprovedState(
                      "CO–PO Mapping Not Approved or Inactive",
                      "The CO-PO matrix and mapping rationale have not yet been approved and set active by the course coordinator."
                    )
                  ))}

                {state.selectedReferenceId === "topics" &&
                  (isHierarchyApprovedAndActive && dynamicTopicUnits.length > 0 ? (
                    <div id="topics-section" className="scroll-mt-36">
                      <CourseTopicsCard units={dynamicTopicUnits} showTiming={false} />
                    </div>
                  ) : (
                    renderNotApprovedState(
                      "Topic Hierarchy Not Approved or Inactive",
                      "The topic hierarchy for this course has not yet been generated and approved by the course coordinator."
                    )
                  ))}

                {state.selectedReferenceId === "pedagogy" &&
                  (isPedagogyApprovedAndActive && dynamicPedagogyUnits.length > 0 ? (
                    <div id="pedagogy-section" className="scroll-mt-36">
                      <PedagogyTopicsCard
                        title="TEACHING APPROACHES OF TOPICS"
                        subtitle="Approved teaching methods for each topic in the course."
                        headerStatsText={`${dynamicPedagogyUnits.length} Units`}
                        units={dynamicPedagogyUnits}
                      />
                    </div>
                  ) : (
                    renderNotApprovedState(
                      "Pedagogy Not Approved or Inactive",
                      "Teaching approaches have not yet been generated and approved by the course coordinator."
                    )
                  ))}

                {state.selectedReferenceId === "lesson-plan" &&
                  (isLessonPlanApprovedAndActive && dynamicLessonUnits.length > 0 ? (
                    <div id="lesson-plan-section" className="scroll-mt-36">
                      <LessonPlanTopicsCard
                        title="LESSON PLAN OF TOPICS"
                        subtitle="Prescribed teaching methods, textbooks and reference books for each topic."
                        headerStatsText={`${dynamicLessonUnits.length} Units`}
                        units={dynamicLessonUnits}
                      />
                    </div>
                  ) : (
                    renderNotApprovedState(
                      "Lesson Plan Not Approved or Inactive",
                      "The lesson plan delivery schedules have not yet been generated and approved by the course coordinator."
                    )
                  ))}

                {state.selectedReferenceId === "learning-materials" && (
                  <div id="learning-materials-section" className="scroll-mt-36">
                    <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/50 p-12 text-center dark:border-amber-800 dark:bg-amber-950/20">
                      <BookOpen className="mx-auto h-12 w-12 text-amber-500 mb-3" />
                      <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Learning Materials On Hold</h4>
                      <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                        The learning materials module is currently on hold. Approved lecture notes, slide decks, and study references will be available here once activated.
                      </p>
                    </div>
                  </div>
                )}

                {state.selectedReferenceId === "question-bank" && (
                  <div id="question-bank-section" className="scroll-mt-36 space-y-4">
                    {state.selectedSetData ? (
                      /* Single Set Detailed View */
                      <div className="space-y-4">
                        {/* Set Header Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                          <div className="space-y-1">
                            <button
                              type="button"
                              onClick={() => setState({ selectedSetData: null, selectedSetId: null })}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 mb-1"
                            >
                              ← Back to All Question Sets
                            </button>
                            <div className="flex items-center gap-2.5">
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {state.selectedSetData.name || `Question Set #${state.selectedSetData.id}`}
                              </h3>
                              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                {state.selectedSetData.unit_number ? `Unit ${state.selectedSetData.unit_number}` : "All Units"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {Array.isArray(state.selectedSetData.topics_included) && state.selectedSetData.topics_included.length > 0
                                ? state.selectedSetData.topics_included.join(" • ")
                                : "Questions aligned with syllabus topics and outcomes."}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                              {(state.selectedSetData.questions || []).length} Question{(state.selectedSetData.questions || []).length === 1 ? "" : "s"}
                            </span>
                          </div>
                        </div>

                        {/* List of Questions in Set */}
                        {(state.selectedSetData.questions || []).length > 0 ? (
                          <div className="space-y-4">
                            {(state.selectedSetData.questions || []).map((q: any, qIdx: number) => {
                              const qCode = q.question_code || `Q-${qIdx + 1}`;
                              const options = q.options || [];
                              return (
                                <div
                                  key={q.id || qIdx}
                                  className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/80 space-y-4"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 dark:border-gray-700">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                                        {qCode}
                                      </span>
                                      {q.topic && (
                                        <span className="text-xs text-slate-500">• {q.topic}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      {q.course_outcome && (
                                        <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                                          {q.course_outcome}
                                        </span>
                                      )}
                                      {q.knowledge_level && (
                                        <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                          {q.knowledge_level}
                                        </span>
                                      )}
                                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                        {q.marks || 2} Marks
                                      </span>
                                      {q.difficulty && (
                                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                                          {q.difficulty}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                                    {q.text}
                                  </p>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {options.map((opt: any, optIdx: number) => {
                                      const optKey = String.fromCharCode(65 + optIdx);
                                      const optText = typeof opt === "string" ? opt : opt.text || "";
                                      const isCorrect = typeof opt === "object" ? Boolean(opt.is_correct) : false;
                                      return (
                                        <div
                                          key={optIdx}
                                          className={`flex items-start gap-3 rounded-xl border p-3 text-xs transition-colors ${
                                            isCorrect
                                              ? "border-emerald-300 bg-emerald-50/70 text-emerald-900 font-semibold dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                                              : "border-slate-200 bg-slate-50/60 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                                          }`}
                                        >
                                          <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                              isCorrect
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                                            }`}
                                          >
                                            {optKey}
                                          </span>
                                          <span className="flex-1">{optText}</span>
                                          {isCorrect && (
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                              Correct
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {q.explanation && (
                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3 text-xs text-slate-700 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-slate-300">
                                      <strong className="font-bold text-indigo-900 dark:text-indigo-300">Explanation: </strong>
                                      {q.explanation}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-xs text-slate-500">
                            No questions found in this set.
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Question Sets Grid View */
                      <div>
                        {(state.rawQuestionSets || []).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {(state.rawQuestionSets || []).map((set: any) => (
                              <QuestionSetCard
                                key={set.id}
                                id={String(set.id)}
                                unit={set.unit_number ? `Unit ${set.unit_number}` : "All Units"}
                                date={
                                  set.created_at
                                    ? new Date(set.created_at).toLocaleDateString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "Recent"
                                }
                                title={set.name || `Question Set #${set.id}`}
                                topicSummary={
                                  Array.isArray(set.topics_included) && set.topics_included.length > 0
                                    ? set.topics_included.join(" • ")
                                    : "Curriculum Aligned Questions"
                                }
                                total={set.total_count ?? (set.questions?.length || 0)}
                                draft={set.draft_count ?? 0}
                                review={set.reviewed_count ?? 0}
                                approved={set.approved_count ?? (set.questions?.length || 0)}
                                onOpen={async () => {
                                  setState({ selectedSetId: set.id, loadingSet: true });
                                  try {
                                    const res: any = await Models.mcq.get_set(set.id);
                                    const fullSet = res?.set || res || set;
                                    setState({ selectedSetData: fullSet, loadingSet: false });
                                  } catch (err) {
                                    console.error("Failed to load set:", err);
                                    setState({ selectedSetData: set, loadingSet: false });
                                  }
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-3xl border border-gray-200/80 bg-white p-12 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
                            <HelpCircle className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" />
                            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">No Question Sets Available</h4>
                            <p className="mt-1.5 text-sm text-slate-500 max-w-md mx-auto">
                              No question sets have been generated or approved for this course yet.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
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
