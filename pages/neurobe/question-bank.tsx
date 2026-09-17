import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Users,
  Sparkles,
  Database,
  BriefcaseBusiness,
  Compass,
  Search,
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
  {
    id: "Q-CN-004",
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
];

const QuestionBank = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    activeTab: "unit-1",
    isEditing: false,
    isGenerating: false,
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

  return (
    <div className="min-h-screen">
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
        title="Question Bank"
        records="CS309 — Computer Networks"
        subtitle={`Create, review, approve, and reuse questions across the course.`}
        icon={<Users className="h-5 w-5 text-color2" />}
        actionBtn4={
          state.isEditing
            ? undefined
            : {
              label: "Generate Questions",
              icon: <Sparkles className="h-4 w-4" />,
              onClick: () => setState({ isGenerating: true }),
            }
        }
      />
      <TabButton
        tabs={[
          {
            key: "all-questions",
            label: "All Questions",
            count: 28,
            icon: <Database className="h-4 w-4" />,
          },
          {
            key: "question-sets",
            label: "Question Sets",
            count: 6,
            icon: <BriefcaseBusiness className="h-4 w-4" />,
          },
        ]}
        activeKey={state.activeQTab}
        onChange={(key) =>
          setState({ activeQTab: key as "all-questions" | "question-sets" })
        }
      />
      {state.activeQTab === "all-questions" && (
        <>
          <div className="mt-6">
            <GenericTabs
              tabs={QUS_TABS}
              activeKey={state.activeTab}
              onChange={(unit) => setState({ activeTab: unit as string })}
              rightContent={
                <div className="flex items-center gap-2 text-xs">
                  <Compass className=" text-color2 h-4  w-4 text-sm font-bold" />
                  <div
                    className="text-color2 cursor-pointer  text-sm font-bold"
                    onClick={() => setState({ isSyllabusOpen: true })}
                  >
                    Browse Syllabus Structure
                  </div>
                </div>
              }
            />
          </div>
          <div className="mt-4">
            <QuestionBankFilter
              onApply={(filters) => setState({ appliedFilters: filters })}
              question={true}
            />
          </div>
          <div className="space-y-3">
            {SAMPLE_QUESTIONS.map((q) => (
              <QuestionCard
                key={q.id}
                {...q}
                onView={() => setState({ viewQuestion: q })}
                onEdit={() => setState({ isEditing: true })}
                onApprove={() => console.log("approve", q.id)}
              />
            ))}
          </div>
        </>
      )}

      {state.activeQTab === "question-sets" && (
        <div className="mt-4 space-y-3">
          {!state.selectedSetId ? (
            <>
              <QuestionSetsHeader count={6} />
              <QuestionSetsSearch />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {QUESTION_SETS.map((qs) => (
                  <QuestionSetCard
                    key={qs.title}
                    {...qs}
                    onOpen={() => setState({ selectedSetId: qs.id })}
                  />
                ))}
              </div>

            </>
          ) : (
            <div className="space-y-3">
              {(() => {
                const qs = QUESTION_SETS.find((q) => q.id === state.selectedSetId);
                return qs ? (
                  <QuestionSetBanner
                    unit={qs.unit}
                    title={qs.title}
                    generatedOn={qs.date}
                    totalQuestions={qs.total}
                    approved={qs.approved}
                    accentColor={qs.accentColor}
                    unitColor={qs.unitColor}
                    topics={[qs.topicSummary]}
                  />
                ) : null;
              })()}
              <GenericTabs
                tabs={QUS_TABS}
                activeKey={state.activeTab}
                onChange={(unit) => setState({ activeTab: unit as string })}
                rightContent={
                  <div className="flex items-center gap-2 rounded-xl mb-1 border border-gray-200 bg-white px-4  h-11">
                    <Search className="h-4 w-4 shrink-0 text-[#000]" />
                    <input
                      type="text"
                      placeholder="Search questions in this set..."
                      className="w-64 bg-transparent text-sm text-[#000] placeholder:text-gray-400 outline-none"
                    />
                  </div>
                }
              />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 pt-2">
                {SET_QUESTIONS.map((q) => (
                  <QuestionDetailCard
                    key={q.id}
                    {...q}
                    onView={() => setState({ viewQuestion: q })}
                    onEdit={() => setState({ isEditing: true })}
                    onMarkAsReviewed={() => console.log("Mark as reviewed:", q.id)}
                    onApprove={() => console.log("Approve:", q.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <SyllabusStructureSidebar
        open={state.isSyllabusOpen}
        onClose={() => setState({ isSyllabusOpen: false })}
        courseCode="CS309 — Computer Networks"
        totalCount={19}
        units={UNIT_LIST}
      />

      <GenerateQuestionsModal
        open={state.isGenerating}
        onClose={() => setState({ isGenerating: false })}
        courseCode="CS2304 — Computer Networks"
        onSubmit={(data) => console.log("Generate:", data)}
      />

      <EditQuestionModal
        open={state.isEditing}
        onClose={() => setState({ isEditing: false })}
        topicLabel={"CS309 — Computer Networks"}
        code={"Q-CN-003"}
      />

      <ViewQuestionModal
        open={!!state.viewQuestion}
        onClose={() => setState({ viewQuestion: null })}
        question={
          state.viewQuestion
            ? {
              id: state.viewQuestion.id,
              status: state.viewQuestion.status,
              aiVersion: "NEUROBE AI · v1.0",
              unit: state.viewQuestion.unit,
              topic: state.viewQuestion.topic,
              subtopic: state.viewQuestion.subtopic,
              co: state.viewQuestion.tags?.find((t) =>
                t.label.startsWith("CO")
              )?.label,
              level: state.viewQuestion.tags?.find((t) =>
                t.label.startsWith("K")
              )?.label,
              questionType: state.viewQuestion.tags?.find((t) =>
                [
                  "MCQ",
                  "Short Answer",
                  "Long Answer",
                  "Fill in the Blank",
                ].includes(t.label)
              )?.label,
              marks: state.viewQuestion.tags?.find((t) =>
                t.label.includes("Marks")
              )?.label,
              difficulty: state.viewQuestion.tags?.find((t) =>
                ["Easy", "Medium", "Hard"].includes(t.label)
              )?.label,
              question: state.viewQuestion.question,
              optionA: "IEEE 802.1Q",
              optionB: "IEEE 802.1D Spanning Tree Protocol",
              optionC: "IEEE 802.3ad",
              optionD: "IEEE 802.1X",
              correctAnswer: "B",
              explanation:
                "STP (Spanning Tree Protocol) builds an acyclic tree covering all switches, blocking redundant backup ports until an active link fails, thereby ensuring loop-free Layer-2 environments.",
              course: "CS309 — Computer Networks",
              approvedBy: "Dr. Arun Kumar",
              approvedDate: "2025-08-21",
            }
            : { id: "", status: "approved", unit: "", topic: "", question: "" }
        }
        onCreateDraft={() => console.log("create draft")}
      />
    </div>
  );
};

export default PrivateRouter(QuestionBank);
