import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Hourglass,
  Check,
  ClipboardCheck,
  Sparkles,
  Save,
  EditIcon,
  ArrowRight,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, useSetState } from "@/utils/function.utils";
import TableComponent from "@/components/common-components/TableComponent";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import StepHeader from "@/components/academic-setup/StepHeader";
import MarksExtractionStepper from "@/components/academic-setup/MarksExtractionStepper";
import CIAMarksVerificationCard from "@/components/academic-setup/CIAMarksVerificationCard";
import EvaluatedAnswerSheetsUpload from "@/components/academic-setup/EvaluatedAnswerSheetsUpload";
import ExtractingMarksProgressCard from "@/components/academic-setup/ExtractingMarksProgressCard";
import StudentVerificationFilterBar from "@/components/academic-setup/StudentVerificationFilterBar";
import ShareVerificationTaskModal from "@/components/academic-setup/ShareVerificationTaskModal";
import ShareVerificationSuccessModal from "@/components/academic-setup/ShareVerificationSuccessModal";
import StudentVerificationSlider from "@/components/academic-setup/StudentVerificationSlider";
import AnswerSheetPDFPreview from "@/components/academic-setup/AnswerSheetPDFPreview";
import StudentVerificationSummaryCard from "@/components/academic-setup/StudentVerificationSummaryCard";
import TotalNeedsReviewCard from "@/components/academic-setup/TotalNeedsReviewCard";
import ReviewedBySuggestionCard from "@/components/academic-setup/ReviewedBySuggestionCard";
import MarksVerificationTableCard from "@/components/academic-setup/MarksVerificationTableCard";
import VerificationProgressApprovalCard from "@/components/academic-setup/VerificationProgressApprovalCard";
import FinalApprovalCard from "@/components/academic-setup/FinalApprovalCard";
import AssistantChangesModal from "@/components/academic-setup/AssistantChangesModal";
import EditLessonPlanModal, {
  LessonPlanEditData,
} from "@/components/lesson-plan/EditLessonPlanModal";
import ReviewLessonItemModal, {
  ReviewLessonItemData,
} from "@/components/lesson-plan/ReviewLessonItemModal";
import { useRouter } from "next/router";
import { UNIT_TABS } from "@/utils/constant.utils";


const STAT_TABS = [
  {
    key: "approve-topics",
    label: "Approved Topics",
    count: 22,
    subLabel: "Approved topics count",
    icon: <Check className="h-5 w-5" />,
  },
  {
    key: "approved-material-hours",
    label: "Approved Materials",
    subLabel: "Approved Material Count",
    count: "0 / 22",
    icon: <Hourglass className="h-5 w-5" />,
  },
];

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
      status: "Not Generated" | "Approved";
    }[];
  }
> = {
  "unit-1": {
    title: "Unit 1 — Physical Layer & Network Architectures",
    totalHours: 9,
    topics: [
      {
        id: "1.1",
        seq: 1,
        title: "Network Models & Layered Architecture",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networks — Chapter 1",
        reference: "Data Communications and Networking — Chapter 2",
        pedagogy: "Concept Exploration",
        status: "Not Generated",
      },
      {
        id: "1.2",
        seq: 2,
        title: "Physical Layer & Transmission Media",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networks — Chapter 2",
        reference: "Data Communications and Networking — Chapter 3",
        pedagogy: "Guided Discussion",
        status: "Approved",
      },
      {
        id: "1.3",
        seq: 3,
        title: "Network Topologies & Switching Techniques",
        level: "K2",
        hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 2",
        reference: "Data Communications and Networking — Chapter 8",
        pedagogy: "Concept Exploration",
        status: "Not Generated",
      },
      {
        id: "1.4",
        seq: 4,
        title: "Network Performance Metrics",
        level: "K3",
        hours: "2.5 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 1",
        reference: "Computer Networks: A Systems Approach — Chapter 1",
        pedagogy: "Problem-Based Learning",
        status: "Not Generated",
      },
    ],
  },
  "unit-2": {
    title: "Unit 2 — Data Link Layer & Error Control",
    totalHours: 7,
    topics: [
      {
        id: "2.1",
        seq: 1,
        title: "Framing & Error Detection",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networks — Chapter 3",
        reference: "Data Communications and Networking — Chapter 10",
        pedagogy: "Concept Exploration",
        status: "Not Generated",
      },
      {
        id: "2.2",
        seq: 2,
        title: "Flow Control Protocols",
        level: "K3",
        hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 3",
        reference: "Data Communications and Networking — Chapter 11",
        pedagogy: "Problem-Based Learning",
        status: "Not Generated",
      },
      {
        id: "2.3",
        seq: 3,
        title: "MAC Protocols & CSMA/CD",
        level: "K3",
        hours: "2.5 Hours",
        textbook: "Computer Networks — Chapter 4",
        reference: "Computer Networking: A Top-Down Approach — Chapter 5",
        pedagogy: "Simulation Lab",
        status: "Not Generated",
      },
    ],
  },
  "unit-3": {
    title: "Unit 3 — Network Layer & Routing",
    totalHours: 10,
    topics: [
      {
        id: "3.1",
        seq: 1,
        title: "IP Addressing & Subnetting",
        level: "K3",
        hours: "3 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Computer Networking: A Top-Down Approach — Chapter 4",
        pedagogy: "Hands-on Lab",
        status: "Not Generated",
      },
      {
        id: "3.2",
        seq: 2,
        title: "Routing Algorithms",
        level: "K4",
        hours: "3 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Data Communications and Networking — Chapter 14",
        pedagogy: "Case Study Analysis",
        status: "Not Generated",
      },
      {
        id: "3.3",
        seq: 3,
        title: "IPv6 & Transition Mechanisms",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networks — Chapter 5",
        reference: "Computer Networking: A Top-Down Approach — Chapter 4",
        pedagogy: "Flipped Classroom",
        status: "Not Generated",
      },
      {
        id: "3.4",
        seq: 4,
        title: "ICMP & Network Diagnostics",
        level: "K3",
        hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 4",
        reference: "Computer Networks: A Systems Approach — Chapter 3",
        pedagogy: "Guided Discussion",
        status: "Not Generated",
      },
    ],
  },
  "unit-4": {
    title: "Unit 4 — Transport Layer & TCP/UDP",
    totalHours: 8,
    topics: [
      {
        id: "4.1",
        seq: 1,
        title: "TCP Connection Management",
        level: "K3",
        hours: "3 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 3",
        reference: "Computer Networks — Chapter 6",
        pedagogy: "Demonstration",
        status: "Not Generated",
      },
      {
        id: "4.2",
        seq: 2,
        title: "UDP & Real-time Applications",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 3",
        reference: "Data Communications and Networking — Chapter 23",
        pedagogy: "Comparative Analysis",
        status: "Not Generated",
      },
      {
        id: "4.3",
        seq: 3,
        title: "Congestion Control Mechanisms",
        level: "K4",
        hours: "3 Hours",
        textbook: "Computer Networks — Chapter 6",
        reference: "Computer Networking: A Top-Down Approach — Chapter 3",
        pedagogy: "Problem-Based Learning",
        status: "Not Generated",
      },
    ],
  },
  "unit-5": {
    title: "Unit 5 — Application Layer & Security",
    totalHours: 7,
    topics: [
      {
        id: "5.1",
        seq: 1,
        title: "DNS & HTTP Protocols",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 2",
        reference: "Computer Networks — Chapter 7",
        pedagogy: "Interactive Demo",
        status: "Not Generated",
      },
      {
        id: "5.2",
        seq: 2,
        title: "Email & FTP Protocols",
        level: "K2",
        hours: "2 Hours",
        textbook: "Computer Networking: A Top-Down Approach — Chapter 2",
        reference: "Data Communications and Networking — Chapter 26",
        pedagogy: "Concept Exploration",
        status: "Not Generated",
      },
      {
        id: "5.3",
        seq: 3,
        title: "Network Security Fundamentals",
        level: "K3",
        hours: "3 Hours",
        textbook: "Computer Networks — Chapter 8",
        reference: "Computer Networking: A Top-Down Approach — Chapter 8",
        pedagogy: "Guest Lecture",
        status: "Not Generated",
      },
    ],
  },
};

const totalTopics = UNIT_TABS.reduce((a, b) => a + b.count, 0);
const totalUnits = UNIT_TABS.length;
const totalRecs = Object.values(RAW_UNIT_DATA).reduce(
  (s, u) => s + u.topics.length,
  0
);

const MarksExtraction = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    search: "",
    unitFilter: "all",
    statusFilter: "all",
    loading: false,
    activeTab: "unit-1",
  });

  useEffect(() => {
    dispatch(setPageTitle("Lesson Plan"));
  }, [dispatch]);

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

  const [generateModal, setGenerateModal] = useState(false);

  // ── Per-unit reviewed topic tracking ──────────────────────────────────────
  // Pre-seed with topics that already have status "Reviewed" in RAW_UNIT_DATA
  const [reviewedMap, setReviewedMap] = useState<Record<string, Set<string>>>(
    () =>
      Object.fromEntries(
        Object.entries(RAW_UNIT_DATA).map(([unitKey, unit]) => [
          unitKey,
          new Set(
            unit.topics.filter((t) => t.status === "Approved").map((t) => t.id)
          ),
        ])
      )
  );

  const totalTopicCount = Object.values(RAW_UNIT_DATA).reduce(
    (s, u) => s + u.topics.length,
    0
  );
  const totalReviewedCount = Object.values(reviewedMap).reduce(
    (s, set) => s + set.size,
    0
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
    if (!raw) return [];
    return raw.topics.map((topic) => ({
      id: topic.id,
      title: `Topic ${topic.id} — ${topic.title}`,
      button: {
        label: `Generate Material`,
        icon: <Sparkles className="h-3 w-3" />,
      },
      verified: topic.status,
      verified_status: topic.status,

      items: [],
    }));
  };

  // ── Generated: flat table columns matching the screenshot ──
  const lessonPlanColumns = [
    {
      accessor: "seq",
      title: "SEQ",
      render: ({ seq }: any) => (
        <span className="text-color2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold">
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
          <p className="mt-0.5 text-xs text-gray-400">Topic {id}</p>
        </div>
      ),
    },
    {
      accessor: "level",
      title: "LEVEL",
      render: ({ level }: any) => (
        <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-bold text-gray-600">
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
          <p className="mt-0.5 text-xs text-gray-400">
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
        <span className="text-color2 text-xs font-semibold">{pedagogy}</span>
      ),
    },
    {
      accessor: "status",
      title: "STATUS",
      render: ({
        status,
        id,
        seq,
        title,
        level,
        hours,
        textbook,
        reference,
        pedagogy,
      }: any) => {
        const isReviewed =
          status === "Reviewed" ||
          (reviewedMap[state.activeTab]?.has(id) ?? false);

        return isReviewed ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
            Reviewed <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : (
          <button
            type="button"
            onClick={() =>
              setReviewModal({
                open: true,
                unitKey: state.activeTab,
                topicId: id,
                data: {
                  id,
                  seq,
                  title,
                  level,
                  hours,
                  textbook,
                  reference,
                  pedagogy,
                  unitLabel: raw?.title ?? "",
                },
              })
            }
            className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 transition-colors hover:border-orange-400 hover:bg-orange-100"
          >
            • Need Review
          </button>
        );
      },
    },
    {
      accessor: "id",
      title: "EDIT",
      render: ({
        title,
        id,
        seq,
        level,
        hours,
        textbook,
        reference,
        pedagogy,
        status,
      }: any) => (
        <button
          type="button"
          onClick={() =>
            setEditModal({
              open: true,
              data: {
                id,
                seq,
                title,
                level,
                hours,
                textbook,
                reference,
                pedagogy,
                status,
                unitLabel: raw?.title ?? "",
              },
            })
          }
          className="hover:text-color2 flex items-center gap-1 text-xs font-semibold text-gray-500"
        >
          <EditIcon className="h-3.5 w-3.5" /> Edit
        </button>
      ),
    },
  ];

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
        activeView={state.activeTab}
        onBack={() => console.log("back")}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      <StepHeader
        title="Marks Extraction & Verification"
        description="Upload evaluated CIA answer sheets, review extracted marks, and verify each student before final approval."
      />

      <MarksExtractionStepper
        currentStep={state.currentStep ?? 1}
        verifiedCount={15}
        totalStudents={40}
        onStepClick={(step) => {
          // Allow switching back to Step 1 or to Step 2 if unlocked
          if (step === 1 || (state.hasExtracted && step <= 3)) {
            setState({ currentStep: step });
          }
        }}
      />

      {(state.currentStep ?? 1) === 3 ? (
        /* ── Step 3: Final Approval View ── */
        <FinalApprovalCard
          courseName="CS309 — Computer Networks"
          assessmentName="CIA-1"
          totalStudents={40}
          verifiedStudents={40}
          unresolvedIssues={0}
          onBackToVerification={() => setState({ currentStep: 2 })}
          onViewResults={() => router.push("/neurobe/result-analysis")}
          onBackToCourses={() => console.log("Back to Courses clicked")}
        />
      ) : (state.currentStep ?? 1) === 2 ? (
        state.showVerificationFilterBar ? (
          /* ── Step 2: Student Verification Filter Bar & Slider ── */
          <div className="space-y-5">
            <StudentVerificationFilterBar
              onShareTask={() => setState({ showShareModal: true })}
            />
            <StudentVerificationSlider
              onSelectStudent={(student) => setState({ selectedStudent: student })}
            />

            {/* 2-Column Side-by-Side Verification View */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
              {/* Left Column: Answer Sheet PDF Preview */}
              <div>
                <AnswerSheetPDFPreview
                  data={{
                    studentName: state.selectedStudent?.name || "Sanjay Murugan",
                    registerNo: state.selectedStudent?.registerNo || "24CS1041",
                    totalMarksAwarded: state.customScore
                      ? `${state.customScore} / 50`
                      : state.selectedStudent?.marks || "43 / 50",
                  }}
                />
              </div>

              {/* Right Column: Student Summary Card, Review Warning, Table Card */}
              <div className="space-y-5">
                <StudentVerificationSummaryCard
                  name={state.selectedStudent?.name || "Sanjay Murugan"}
                  registerNo={state.selectedStudent?.registerNo || "24CS1041"}
                  finalScore={
                    state.customScore
                      ? `${state.customScore} / 50`
                      : state.selectedStudent?.marks || "45 / 50"
                  }
                />

                {state.showReviewedBySuggestionCard && (
                  <ReviewedBySuggestionCard
                    reviewerName="Kavya Raman"
                    suggestedChangesText="1 suggested change"
                    actionBtnLabel="Review Suggestion"
                    onActionClick={() =>
                      setState({ showAssistantChangesModal: true })
                    }
                  />
                )}

                <TotalNeedsReviewCard
                  paperTotal={43}
                  questionTotal={45}
                  onSave={(finalTotal) => {
                    setState({
                      customScore: finalTotal,
                      hasExtracted: true,
                      unlockedStep3: true,
                    });
                  }}
                />

                <MarksVerificationTableCard
                  variation={state.isStudentVerified ? "verified" : "unverified"}
                  onVerify={() => setState({ isStudentVerified: true })}
                  onNextStudent={() => console.log("Next student clicked")}
                />
              </div>
            </div>

            {/* Full-width Verification Progress Approval Card */}
            {state.isStudentVerified && (
              <VerificationProgressApprovalCard
                verifiedCount={40}
                totalCount={40}
                onProceed={() => setState({ currentStep: 3 })}
              />
            )}
          </div>
        ) : (
          /* ── Step 2: Extracting Marks Progress Screen ── */
          <ExtractingMarksProgressCard
            onNext={() => setState({ showVerificationFilterBar: true })}
          />
        )
      ) : (
        /* ── Step 1: Upload & Extract Content Panel ── */
        <div className="panel p-4">
          {/* Step 1 Content Section */}
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Step 1 — Upload & Extract
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              Select the CIA assessment and upload the evaluated answer sheets PDF. Extractions will automatically advance to Student Verification.
            </p>
          </div>

          {/* Assessment Sub-header */}
          <div className="mb-3">
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Assessment
            </h3>
          </div>

          {/* CIA Cards Grid */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CIAMarksVerificationCard
              title="CIA-1"
              marks="50 Marks"
              studentsCount="40 Students"
              status="in_progress"
              statusLabel="Verification In Progress"
              verifiedCount={19}
              totalCount={40}
              reviewedByNote="Kavya Raman reviewed 5 students."
              primaryBtnLabel="Continue Verification"
              secondaryBtnLabel="View Shared Review"
              onPrimaryClick={() => console.log("Continue Verification CIA-1")}
              onSecondaryClick={() => console.log("View Shared Review CIA-1")}
            />

            <CIAMarksVerificationCard
              title="CIA-2"
              marks="50 Marks"
              studentsCount="40 Students"
              status="not_started"
              statusLabel="Not Started"
              emptyNote="No evaluated answer sheets uploaded yet."
              active={true}
              primaryBtnLabel="Start Verification"
              onPrimaryClick={() => console.log("Start Verification CIA-2")}
            />
          </div>

          {/* Evaluated Answer Sheets Upload Component */}
          <EvaluatedAnswerSheetsUpload />

          {/* Bottom Action Footer Row */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200/60 pt-4 dark:border-gray-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Target Course: <span className="font-bold text-gray-900 dark:text-white">CS309 — Computer Networks</span> (40 Enrolled Students)
            </p>
            <button
              type="button"
              onClick={() => setState({ currentStep: 2, hasExtracted: true })}
              className="create-btn inline-flex items-center justify-center gap-2"
            >
              <span>Extract Marks</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Share Verification Task Modals */}
      <ShareVerificationTaskModal
        open={state.showShareModal || false}
        onClose={() =>
          setState({ showShareModal: false, showReviewedBySuggestionCard: true })
        }
        onGenerate={() =>
          setState({ showShareModal: false, showShareSuccessModal: true })
        }
      />

      <ShareVerificationSuccessModal
        open={state.showShareSuccessModal || false}
        onClose={() =>
          setState({ showShareSuccessModal: false, showReviewedBySuggestionCard: true })
        }
        onRevoke={() => {
          console.log("Revoke access clicked");
          setState({ showShareSuccessModal: false, showReviewedBySuggestionCard: true });
        }}
      />

      <AssistantChangesModal
        open={state.showAssistantChangesModal || false}
        onClose={() => setState({ showAssistantChangesModal: false })}
        reviewerName="Kavya Raman"
        onReviewRow={(record) => {
          console.log("Review row clicked", record);
          setState({ showAssistantChangesModal: false });
        }}
      />
    </div>
  );
};

export default PrivateRouter(MarksExtraction);
