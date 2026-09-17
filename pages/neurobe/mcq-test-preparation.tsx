import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Users,
  Sparkles,
  Database,
  BriefcaseBusiness,
  Compass,
  Search,
  Plus,
  Monitor,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import { useRouter } from "next/router";
import PageHeader from "@/components/common-components/PageHeader";
import {
  FilterValues,
} from "@/components/question-bank/QuestionBankFilter";
import {
  QuestionCardProps,
} from "@/components/question-bank/QuestionCard";
import { EditQuestionModal } from "@/components/academic-setup/Question-bank/EditQuestionModal";
import ViewQuestionModal from "@/components/question-bank/ViewQuestionModal";
import GenerateQuestionsModal from "@/components/question-bank/GenerateQuestionsModal";
import QuestionSetsSearch from "@/components/question-bank/QuestionSetsSearch";
import McqTestPrepCard, {
  McqTestPrepCardProps,
  MCQTestStatus,
} from "@/components/mcq-preparation/McqTestPrepCard";
import ConfigureMcqTestModal from "@/components/mcq-preparation/ConfigureMcqTestModal";
import SelectApprovedQuestionsModal from "@/components/mcq-preparation/SelectApprovedQuestionsModal";
import ViewTestDetailsModal from "@/components/mcq-preparation/ViewTestDetailsModal";
import QuestionBankPreviewModal from "@/components/mcq-preparation/QuestionBankPreviewModal";
import { QuestionSetCardProps } from "@/components/question-bank/QuestionSetCard";

const QUESTION_BANK_PREVIEW_QUESTIONS = [
  {
    id: "qb-p-1",
    questionNumber: 1,
    level: "K1",
    co: "CO1",
    question: "How many distinct structural layers are defined in the ISO/OSI standard reference architecture?",
    options: [
      { key: "A", text: "4 layers" },
      { key: "B", text: "5 layers" },
      { key: "C", text: "7 layers", isCorrect: true },
      { key: "D", text: "8 layers" },
    ],
  },
  {
    id: "qb-p-2",
    questionNumber: 2,
    level: "K1",
    co: "CO1",
    question: "Which communication transmission mode permits signals to flow in both directions simultaneously?",
    options: [
      { key: "A", text: "Simplex mode" },
      { key: "B", text: "Half-Duplex mode" },
      { key: "C", text: "Full-Duplex mode", isCorrect: true },
      { key: "D", text: "Asynchronous mode" },
    ],
  },
  {
    id: "qb-p-3",
    questionNumber: 3,
    level: "K2",
    co: "CO1",
    question: "Which layer of the OSI reference model is responsible for data encryption, compression, and syntax translation?",
    options: [
      { key: "A", text: "Application Layer" },
      { key: "B", text: "Presentation Layer", isCorrect: true },
      { key: "C", text: "Session Layer" },
      { key: "D", text: "Transport Layer" },
    ],
  },
  {
    id: "qb-p-4",
    questionNumber: 4,
    level: "K2",
    co: "CO2",
    question: "What is the primary function of the Data Link Layer framing process?",
    options: [
      { key: "A", text: "Encapsulation of network layer packets into discrete transmission units", isCorrect: true },
      { key: "B", text: "Routing packets across multiple autonomous subnets" },
      { key: "C", text: "Establishing end-to-end TCP socket connections" },
      { key: "D", text: "Converting analog signals to digital bit streams" },
    ],
  },
  {
    id: "qb-p-5",
    questionNumber: 5,
    level: "K3",
    co: "CO2",
    question: "In Cyclic Redundancy Check (CRC), what mathematical operation is performed during generator polynomial division?",
    options: [
      { key: "A", text: "Binary Addition" },
      { key: "B", text: "Modulo-2 Arithmetic (XOR)", isCorrect: true },
      { key: "C", text: "Bitwise AND Operation" },
      { key: "D", text: "2's Complement Subtraction" },
    ],
  },
];

const MCQ_PREPARATION_TESTS: McqTestPrepCardProps[] = [
  {
    id: "mcq-prep-01",
    code: "MCQ-CN-2026-T1",
    title: "Application Layer MCQ Quiz",
    status: "live",
    unit: "Unit 5: Application Layer",
    questionsCount: 5,
    knowledgeLevels: "K1: 2 • K2: 2 • K3: 1",
    selectedQuestions: "5 Approved Questions",
    selectedDotColor: "bg-emerald-500",
    topics: [
      "5.2 Domain Name System",
      "5.3 Web and File Transfer Services",
    ],
    testWindowDate: "25 Aug 2026",
    testWindowTime: "10:00 AM – 11:00 AM",
    readOnly: true,
    questions: [
      {
        id: "q-u5-1",
        questionNumber: 1,
        code: "qb_cn_u5_k1_1",
        level: "K1",
        marks: "2 Marks",
        topic: "5.2 Domain Name System",
        subtopic: "Domain Resolution Architecture",
        question: "Which protocol is responsible for translating human-readable domain names into numerical IP addresses?",
        options: [
          { key: "A", text: "HTTP" },
          { key: "B", text: "DNS", isCorrect: true },
          { key: "C", text: "FTP" },
          { key: "D", text: "SMTP" },
        ],
        explanation: "DNS (Domain Name System) maps hostnames to IP addresses across hierarchical domain servers.",
      },
      {
        id: "q-u5-2",
        questionNumber: 2,
        code: "qb_cn_u5_k2_1",
        level: "K2",
        marks: "2 Marks",
        topic: "5.3 Web Services",
        subtopic: "HTTP Response Status Codes",
        question: "What is the primary meaning of the HTTP status code 404 Not Found?",
        options: [
          { key: "A", text: "Internal Server Error" },
          { key: "B", text: "Requested resource could not be found on server", isCorrect: true },
          { key: "C", text: "Unauthorized Access" },
          { key: "D", text: "Bad Gateway Request" },
        ],
        explanation: "HTTP 404 indicates the origin server did not find a current representation for the requested target resource.",
      },
      {
        id: "q-u5-3",
        questionNumber: 3,
        code: "qb_cn_u5_k2_2",
        level: "K2",
        marks: "2 Marks",
        topic: "5.2 Domain Name System",
        subtopic: "Transport Protocol Selection",
        question: "Which transport protocol does DNS primarily use for standard name resolution queries?",
        options: [
          { key: "A", text: "UDP Port 53", isCorrect: true },
          { key: "B", text: "TCP Port 80" },
          { key: "C", text: "SCTP Port 21" },
          { key: "D", text: "ICMP Type 8" },
        ],
        explanation: "DNS uses UDP port 53 for standard small queries due to lower latency and overhead.",
      },
      {
        id: "q-u5-4",
        questionNumber: 4,
        code: "qb_cn_u5_k3_1",
        level: "K3",
        marks: "2 Marks",
        topic: "5.3 File Transfer Services",
        subtopic: "FTP Active Data Transfer Ports",
        question: "In standard FTP active mode data transfer, which port is used by the server to initiate data connections?",
        options: [
          { key: "A", text: "Port 20", isCorrect: true },
          { key: "B", text: "Port 21" },
          { key: "C", text: "Port 80" },
          { key: "D", text: "Port 443" },
        ],
        explanation: "FTP control commands use Port 21, while active mode data transfers originate from Port 20.",
      },
      {
        id: "q-u5-5",
        questionNumber: 5,
        code: "qb_cn_u5_k1_2",
        level: "K1",
        marks: "2 Marks",
        topic: "5.3 Web Services",
        subtopic: "HTTP/1.1 Persistent Connections",
        question: "Which HTTP header field controls persistent TCP connection reuse across multiple HTTP requests?",
        options: [
          { key: "A", text: "Connection: keep-alive", isCorrect: true },
          { key: "B", text: "Cache-Control: max-age=0" },
          { key: "C", text: "Host: example.com" },
          { key: "D", text: "User-Agent: Mozilla/5.0" },
        ],
        explanation: "Connection: keep-alive allows a single TCP socket connection to remain open for multiple HTTP requests/responses.",
      },
    ],
  },
  {
    id: "mcq-prep-02",
    code: "MCQ-CN-2026-T2",
    title: "Data Link Layer MCQ Test",
    status: "upcoming",
    unit: "Unit 2: Data Link Layer",
    questionsCount: 5,
    knowledgeLevels: "K1: 2 • K2: 2 • K3: 1",
    selectedQuestions: "5 Approved Questions",
    selectedDotColor: "bg-emerald-500",
    topics: [
      "2.2 Error Detection (CRC, Checksum, Parity) & Error Correction",
      "2.3 ARQ Protocols (Stop-and-Wait, Go-Back-N, Selective Repeat)",
    ],
    testWindowDate: "02 Sep 2026",
    testWindowTime: "10:00 AM – 11:00 AM",
    readOnly: true,
    questions: [
      {
        id: "q-u2-1",
        questionNumber: 1,
        code: "qb_cn_u2_k1_1",
        level: "K1",
        marks: "2 Marks",
        topic: "2.1 Data Link Layer Sublayers",
        subtopic: "MAC vs LLC Responsibilities",
        question: "Which sublayer of the Data Link Layer manages access to the shared physical transmission channel?",
        options: [
          { key: "A", text: "MAC Sublayer", isCorrect: true },
          { key: "B", text: "LLC Sublayer" },
          { key: "C", text: "Network Layer" },
          { key: "D", text: "Physical Signaling Layer" },
        ],
        explanation: "The Media Access Control (MAC) sublayer regulates shared medium access and framing.",
      },
      {
        id: "q-u2-2",
        questionNumber: 2,
        code: "qb_cn_u2_k2_1",
        level: "K2",
        marks: "2 Marks",
        topic: "2.2 Error Detection & Correction",
        subtopic: "Cyclic Redundancy Check (CRC)",
        question: "In Cyclic Redundancy Check (CRC) error detection, what mathematical operation is used during polynomial division?",
        options: [
          { key: "A", text: "Binary Addition" },
          { key: "B", text: "Modulo-2 Arithmetic (XOR)", isCorrect: true },
          { key: "C", text: "2's Complement Addition" },
          { key: "D", text: "Bitwise AND" },
        ],
        explanation: "CRC polynomial division uses Modulo-2 binary arithmetic where subtraction and addition are equivalent to XOR operations.",
      },
      {
        id: "q-u2-3",
        questionNumber: 3,
        code: "qb_cn_u2_k2_2",
        level: "K2",
        marks: "2 Marks",
        topic: "2.1 Ethernet Architecture",
        subtopic: "CSMA/CD Minimum Frame Size",
        question: "Why does CSMA/CD enforce a minimum frame size constraint (e.g., 64 bytes) on IEEE 802.3 Ethernet networks?",
        options: [
          { key: "A", text: "To guarantee collision detection before transmission ends", isCorrect: true },
          { key: "B", text: "To increase maximum link throughput" },
          { key: "C", text: "To fit routing table entries" },
          { key: "D", text: "To prevent receiver buffer overflow" },
        ],
        explanation: "The frame duration must exceed the round-trip propagation delay (2τ) so collision signals return while transmitting.",
      },
      {
        id: "q-u2-4",
        questionNumber: 4,
        code: "qb_cn_u2_k3_1",
        level: "K3",
        marks: "2 Marks",
        topic: "2.3 ARQ Protocols",
        subtopic: "Go-Back-N Window Sizing",
        question: "In a Go-Back-N ARQ protocol utilizing a 3-bit sequence number, what is the maximum sender window size (W_s) permissible?",
        options: [
          { key: "A", text: "7", isCorrect: true },
          { key: "B", text: "8" },
          { key: "C", text: "4" },
          { key: "D", text: "15" },
        ],
        explanation: "For an m-bit sequence number, the maximum sender window size in Go-Back-N is (2^m) - 1 = 7.",
      },
      {
        id: "q-u2-5",
        questionNumber: 5,
        code: "qb_cn_u2_k1_2",
        level: "K1",
        marks: "2 Marks",
        topic: "2.1 Framing Methods",
        subtopic: "Bit Stuffing Delimiters",
        question: "Which framing method inserts a 0 bit after five consecutive 1 bits to prevent accidental flag pattern collision (01111110)?",
        options: [
          { key: "A", text: "Bit Stuffing", isCorrect: true },
          { key: "B", text: "Byte Stuffing" },
          { key: "C", text: "Character Count" },
          { key: "D", text: "Physical Code Violation" },
        ],
        explanation: "Bit stuffing ensures the flag sequence (01111110) never appears inside arbitrary binary payload data.",
      },
    ],
  },
  {
    id: "mcq-prep-03",
    code: "MCQ-CN-2026-DRAFT",
    title: "Routing & IP Addressing Diagnostic Drill",
    status: "draft",
    unit: "Unit 3: Network Layer",
    questionsCount: 5,
    knowledgeLevels: "K1: 2 • K2: 1 • K3: 2",
    selectedQuestions: "5 Approved Questions",
    selectedDotColor: "bg-emerald-500",
    topics: [
      "3.2 IPv4 Addressing, Subnetting & Supernetting",
      "3.4 Routing Algorithms: Distance Vector and Link State",
    ],
    testWindowDate: "12 Oct 2026",
    testWindowTime: "01:00 PM – 02:00 PM",
    readOnly: true,
    questions: [
      {
        id: "q-u3-1",
        questionNumber: 1,
        code: "qb_cn_u3_k1_1",
        level: "K1",
        marks: "2 Marks",
        topic: "3.2 IPv4 Subnetting",
        subtopic: "CIDR /24 Host Capacity",
        question: "How many total IP addresses exist in a standard /24 IPv4 subnet blocks?",
        options: [
          { key: "A", text: "256 Total (254 Usable)", isCorrect: true },
          { key: "B", text: "128 Total (126 Usable)" },
          { key: "C", text: "512 Total (510 Usable)" },
          { key: "D", text: "64 Total (62 Usable)" },
        ],
        explanation: "A /24 subnet has 8 host bits, yielding 2^8 = 256 total IP addresses.",
      },
      {
        id: "q-u3-2",
        questionNumber: 2,
        code: "qb_cn_u3_k2_1",
        level: "K2",
        marks: "2 Marks",
        topic: "3.4 Distance Vector Routing",
        subtopic: "RIP Hop Count Metric",
        question: "Which routing metric is exclusively utilized by the Distance Vector Routing Information Protocol (RIP)?",
        options: [
          { key: "A", text: "Hop Count", isCorrect: true },
          { key: "B", text: "Link Bandwidth" },
          { key: "C", text: "Interface Delay" },
          { key: "D", text: "MTU Size" },
        ],
        explanation: "RIP computes path cost purely based on hop count, capping valid paths at a maximum of 15 hops.",
      },
      {
        id: "q-u3-3",
        questionNumber: 3,
        code: "qb_cn_u3_k3_1",
        level: "K3",
        marks: "2 Marks",
        topic: "3.2 Subnetting Calculations",
        subtopic: "CIDR /27 Dotted-Decimal Mask",
        question: "What is the dotted-decimal subnet mask corresponding to CIDR notation /27?",
        options: [
          { key: "A", text: "255.255.255.224", isCorrect: true },
          { key: "B", text: "255.255.255.192" },
          { key: "C", text: "255.255.255.240" },
          { key: "D", text: "255.255.255.128" },
        ],
        explanation: "/27 mask has 27 set bits (11111111.11111111.11111111.11100000), which equals 255.255.255.224.",
      },
      {
        id: "q-u3-4",
        questionNumber: 4,
        code: "qb_cn_u3_k2_2",
        level: "K2",
        marks: "2 Marks",
        topic: "3.2 Network Layer Protocols",
        subtopic: "Address Resolution Protocol (ARP)",
        question: "Which protocol maps a known target IPv4 address to its corresponding physical MAC hardware address?",
        options: [
          { key: "A", text: "ARP", isCorrect: true },
          { key: "B", text: "ICMP" },
          { key: "C", text: "DHCP" },
          { key: "D", text: "DNS" },
        ],
        explanation: "ARP (Address Resolution Protocol) broadcasts a query to discover the MAC address associated with an IP address.",
      },
      {
        id: "q-u3-5",
        questionNumber: 5,
        code: "qb_cn_u3_k3_2",
        level: "K3",
        marks: "2 Marks",
        topic: "3.4 Link-State Routing",
        subtopic: "Dijkstra Shortest Path Tree",
        question: "In Link-State routing protocols like OSPF, which algorithm is executed by each router to build the shortest path tree?",
        options: [
          { key: "A", text: "Dijkstra's Algorithm", isCorrect: true },
          { key: "B", text: "Bellman-Ford Algorithm" },
          { key: "C", text: "Floyd-Warshall Algorithm" },
          { key: "D", text: "Kruskal's Algorithm" },
        ],
        explanation: "OSPF routers run Dijkstra's SPF algorithm on the link-state database (LSDB) to compute shortest path routes.",
      },
    ],
  },
];


const MCQTextPreperation = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    activeTab: "unit-1",
    statusFilter: "all" as "all" | MCQTestStatus,
    searchQuery: "",
    isEditing: false,
    isGenerating: false,
    isConfiguring: false,
    isSelectQuestionsOpen: false,
    isViewTestOpen: false,
    isQuestionBankPreviewOpen: false,
    activeViewTest: null as McqTestPrepCardProps | null,
    modalMode: "create" as "create" | "configure",
    activeConfigCode: "MCQ-CN-2026-T3",
    viewQuestion: null as QuestionCardProps | null,
    activeQTab: "all-questions" as "all-questions" | "question-sets",
    appliedFilters: null as FilterValues | null,
    isSyllabusOpen: false,
    selectedSetId: null as string | null,
    activeBannerTab: "coordinator",
  });

  useEffect(() => {
    dispatch(setPageTitle("View Learning Material"));
  }, [dispatch]);

  const filteredTests = MCQ_PREPARATION_TESTS.filter((test) => {
    if (state.statusFilter !== "all" && test.status !== state.statusFilter) {
      return false;
    }
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      return (
        test.title.toLowerCase().includes(q) ||
        test.code.toLowerCase().includes(q) ||
        test.unit.toLowerCase().includes(q) ||
        test.topics.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
        activeView={state.activeBannerTab}
        onBack={() => router.back()}
        onViewChange={(view) => setState({ activeBannerTab: view })}
      />

      <PageHeader
        title="MCQ Test Preparation"
        records="CS309 - Computer Networks"
        subtitle={`Create and configure an MCQ test using approved Question Bank questions.`}
        icon={<Users className="h-5 w-5 text-color2" />}
        actionBtn1={
          state.isEditing
            ? undefined
            : {
              label: "Create MCQ Test",
              icon: <Plus className="h-4 w-4" />,
              onClick: () =>
                setState({
                  isConfiguring: true,
                  modalMode: "create",
                  activeConfigCode: "MCQ-CN-2026-T3",
                }),
            }
        }
        actionBtn2={
          state.isEditing
            ? undefined
            : {
              label: "Question Bank",
              icon: <Monitor className="h-4 w-4" />,
              onClick: () => {},
            }
        }
      />
      <div className="">
        <QuestionSetsSearch
          placeholder="Search MCQ tests by title, code, unit..."
          onSearch={(query) => setState({ searchQuery: query })}
          showUnitSelect={false}
          tabs={[
            { key: "all", label: "All Tests" },
            { key: "draft", label: "Draft" },
            { key: "upcoming", label: "Upcoming" },
            { key: "live", label: "Live" },
            { key: "completed", label: "Completed" },
          ]}
          activeTab={state.statusFilter}
          onTabChange={(tabKey) => setState({ statusFilter: tabKey as any })}
        />
      </div>

      {/* Cards List */}
      <div className="py-4 space-y-4">
        {filteredTests.length > 0 ? (
          filteredTests.map((test) => (
            <McqTestPrepCard
              key={test.id || test.code}
              {...test}
              onViewTest={() =>
                setState({
                  isViewTestOpen: true,
                  activeViewTest: test,
                })
              }
              onConfigureTest={() =>
                setState({
                  isConfiguring: true,
                  modalMode: "configure",
                  activeConfigCode: test.code,
                })
              }
              onPreviewQuestions={() =>
                setState({ isQuestionBankPreviewOpen: true,activeViewTest: test })
                // setState({
                //   isViewTestOpen: true,
                //   activeViewTest: test,
                // })
              }
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-pri">
            No tests found matching your criteria.
          </div>
        )}
      </div>

      <ConfigureMcqTestModal
        open={state.isConfiguring}
        onClose={() => setState({ isConfiguring: false })}
        mode={state.modalMode}
        code={state.activeConfigCode || "MCQ-CN-2026-T3"}
        onContinueToStep2={() =>
          setState({
            isConfiguring: false,
            isSelectQuestionsOpen: true,
          })
        }
        onSubmit={(data) => console.log("Configure test submit:", data)}
        onSaveDraft={(data) => console.log("Configure test draft:", data)}
      />

      <SelectApprovedQuestionsModal
        open={state.isSelectQuestionsOpen}
        onClose={() => setState({ isSelectQuestionsOpen: false })}
        onBackToStep1={() =>
          setState({
            isSelectQuestionsOpen: false,
            isConfiguring: true,
          })
        }
        mode={state.modalMode}
        code={state.activeConfigCode || "MCQ-CN-2026-T3"}
        requiredCount={5}
        onSaveTest={(data) => console.log("Save test:", data)}
        onSaveDraft={(data) => console.log("Save draft:", data)}
      />

      <ViewTestDetailsModal
        open={state.isViewTestOpen}
        onClose={() => setState({ isViewTestOpen: false })}
        testData={
          state.activeViewTest
            ? {
              code: state.activeViewTest.code,
              title: state.activeViewTest.title,
              status: state.activeViewTest.status === "live" ? "Live" : state.activeViewTest.status === "upcoming" ? "Upcoming" : "Draft",
              courseCode: "CS309 – Computer Networks",
              unit: state.activeViewTest.unit,
              questionsCount: state.activeViewTest.questionsCount,
              knowledgeLevels: state.activeViewTest.knowledgeLevels,
              testWindowDate: state.activeViewTest.testWindowDate || "01 Sep 2026",
              testWindowTime: state.activeViewTest.testWindowTime || "2:00 PM – 3:00 PM",
              topics: state.activeViewTest.topics,
              questions: state.activeViewTest.questions,
            }
            : undefined
        }
      />

      <QuestionBankPreviewModal
        open={state.isQuestionBankPreviewOpen}
        onClose={() => setState({ isQuestionBankPreviewOpen: false })}
        title="Network Models & Physical Layer Quiz"
        subtitle="Unit 1: Physical & Network Models • 5 Questions Selected"
        questions={QUESTION_BANK_PREVIEW_QUESTIONS}
      />


    </div>
  );
};

export default PrivateRouter(MCQTextPreperation);

