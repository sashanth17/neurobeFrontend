import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Eye, Save } from "lucide-react";
import { useRouter } from "next/router";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import PageHeader from "@/components/common-components/PageHeader";
import CIAPaperMarksAllocationBar from "@/components/academic-setup/CIAPaperMarksAllocationBar";
import CIAPaperReviewCard, { SectionPreviewItem } from "@/components/academic-setup/CIAPaperReviewCard";
import CIASectionsQuestionsCard, { SectionItem } from "@/components/academic-setup/CIASectionsQuestionsCard";
import CIAPaperFinalizationActions from "@/components/academic-setup/CIAPaperFinalizationActions";
import PaperSetupSection from "@/components/academic-setup/PaperSetupSection";
import { CIASection } from "@/components/academic-setup/SectionsAndQuestionsSection";

const INITIAL_SECTIONS: SectionItem[] = [
  {
    id: "sec-a",
    sectionLetter: "A",
    title: "Short Answer Questions",
    totalMarks: "20 Marks",
    questionsCount: 4,
    marksUsed: "20 / 20",
    isComplete: true,
    questions: [
      {
        id: "q1",
        qNo: "Q1",
        text: "State the difference between protocol independence and layered abstraction in network architecture.",
        co: "CO1",
        kLevel: "K1",
        marks: "5 Marks",
        topic: "Network Models & Layered Architecture",
      },
      {
        id: "q2",
        qNo: "Q2",
        text: "Explain the difference between bit stuffing and byte stuffing with a simple frame delimiter example.",
        co: "CO2",
        kLevel: "K2",
        marks: "5 Marks",
        topic: "Data Link Layer & Framing",
      },
      {
        id: "q3",
        qNo: "Q3",
        text: "Define the purpose of Time-to-Live (TTL) field in an IPv4 packet header.",
        co: "CO3",
        kLevel: "K1",
        marks: "5 Marks",
        topic: "Network Layer & Routing Protocols",
      },
      {
        id: "q4",
        qNo: "Q4",
        text: "Distinguish between port numbers and socket addresses in the transport layer.",
        co: "CO4",
        kLevel: "K2",
        marks: "5 Marks",
        topic: "Transport Layer Protocols",
      },
    ],
  },
  {
    id: "sec-b",
    sectionLetter: "B",
    title: "Descriptive Questions",
    totalMarks: "65 Marks",
    remainingMarksText: "25 Marks Remaining",
    isComplete: false,
    questions: [
      {
        id: "q5",
        qNo: "Q5",
        text: "Explain the role of the Network Layer and contrast virtual circuit packet switching with datagram networks.",
        co: "CO2",
        kLevel: "K2",
        marks: "15 Marks",
        topic: "Network Layer & Routing Protocols",
      },
      {
        id: "q6",
        qNo: "Q6",
        text: "Analyze the working principle of the TCP three-way handshake and describe how connection teardown is achieved using FIN packets.",
        co: "CO4",
        kLevel: "K3",
        marks: "15 Marks",
        topic: "TCP Connection Lifecycle & Three-Way Handshake",
      },
      {
        id: "q7",
        qNo: "Q7",
        text: "Given the generator polynomial G(x) = x^4 + x + 1 and data bits 1101011011, calculate the transmitted frame using Cyclic Redundancy Check.",
        co: "CO2",
        kLevel: "K3",
        marks: "10 Marks",
        topic: "Error Detection (CRC, Checksum, Parity)",
      },
    ],
  },
  {
    id: "sec-c",
    sectionLetter: "C",
    title: "Application Questions",
    totalMarks: "15 Marks",
    isComplete: true,
    questions: [
      {
        id: "q8",
        qNo: "Q8",
        text: "Design a variable length subnet masking (VLSM) scheme for an organization allocated 192.168.1.0/24 with three departments having 60, 28, and 12 hosts respectively. List network IDs, broadcast IDs, and usable IP ranges.",
        co: "CO3",
        kLevel: "K3",
        marks: "15 Marks",
        topic: "IPv4 Addressing, Subnetting & CIDR",
      },
    ],
  },
];

const INITIAL_REVIEW_SECTIONS: SectionPreviewItem[] = [
  {
    id: "sec-a",
    sectionTitle: "SECTION A — SHORT ANSWER QUESTIONS",
    totalMarksText: "[20 MARKS]",
    questions: [
      {
        id: "q1",
        qNoNumber: 1,
        text: "State the difference between protocol independence and layered abstraction in network architecture.",
        marks: "5 Marks",
        co: "CO1",
        kLevel: "K1",
        topic: "Network Models & Layered Architecture",
      },
      {
        id: "q2",
        qNoNumber: 2,
        text: "Explain the difference between bit stuffing and byte stuffing with a simple frame delimiter example.",
        marks: "5 Marks",
        co: "CO2",
        kLevel: "K2",
        topic: "Data Link Layer & Framing",
      },
      {
        id: "q3",
        qNoNumber: 3,
        text: "Define the purpose of Time-to-Live (TTL) field in an IPv4 packet header.",
        marks: "5 Marks",
        co: "CO3",
        kLevel: "K1",
        topic: "Network Layer & Routing Protocols",
      },
      {
        id: "q4",
        qNoNumber: 4,
        text: "Distinguish between port numbers and socket addresses in the transport layer.",
        marks: "5 Marks",
        co: "CO4",
        kLevel: "K2",
        topic: "Transport Layer Protocols",
      },
    ],
  },
  {
    id: "sec-b",
    sectionTitle: "SECTION B — DESCRIPTIVE QUESTIONS",
    totalMarksText: "[65 MARKS]",
    questions: [
      {
        id: "q5",
        qNoNumber: 5,
        text: "Explain the role of the Network Layer and contrast virtual circuit packet switching with datagram networks.",
        marks: "15 Marks",
        co: "CO2",
        kLevel: "K2",
        topic: "Network Layer & Routing Protocols",
      },
      {
        id: "q6",
        qNoNumber: 6,
        text: "Analyze the working principle of the TCP three-way handshake and describe how connection teardown is achieved using FIN packets.",
        marks: "15 Marks",
        co: "CO4",
        kLevel: "K3",
        topic: "TCP Connection Lifecycle & Three-Way Handshake",
      },
      {
        id: "q7",
        qNoNumber: 7,
        text: "Given the generator polynomial G(x) = x^4 + x + 1 and data bits 1101011011, calculate the transmitted frame using Cyclic Redundancy Check.",
        marks: "10 Marks",
        co: "CO2",
        kLevel: "K3",
        topic: "Error Detection (CRC, Checksum, Parity)",
      },
    ],
  },
  {
    id: "sec-c",
    sectionTitle: "SECTION C — APPLICATION QUESTIONS",
    totalMarksText: "[15 MARKS]",
    questions: [
      {
        id: "q8",
        qNoNumber: 8,
        text: "Design a variable length subnet masking (VLSM) scheme for an organization allocated 192.168.1.0/24 with three departments having 60, 28, and 12 hosts respectively. List network IDs, broadcast IDs, and usable IP ranges.",
        marks: "15 Marks",
        co: "CO3",
        kLevel: "K3",
        topic: "IPv4 Addressing, Subnetting & CIDR",
      },
    ],
  },
];

const CIAQuestionPaperEdit = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const COURSE_OPTIONS = [
    { value: "CS309", label: "CS309 — Computer Networks" },
    { value: "CS301", label: "CS301 — Data Structures" },
    { value: "CS402", label: "CS402 — Database Management" },
  ];

  const DEFAULT_SECTIONS: CIASection[] = [
    {
      id: "section-a",
      title: "Short Answer Questions",
      totalMarks: 20,
      usedMarks: 0,
      questions: [],
    },
  ];

  const [state, setState] = useSetState({
    search: "",
    statusFilter: "all",
    loading: false,
    activeTab: "cia-paper",
    totalPaperMarks: 100,
    allocatedSectionMarks: 100,
    remainingToAllocate: 0,
    sections: INITIAL_SECTIONS,
    reviewSections: INITIAL_REVIEW_SECTIONS,
    activeTabs: "",
    paperName: "CIA-3 Question Paper",
    totalMarks: "100",
    course: COURSE_OPTIONS[0],
    sections_data: DEFAULT_SECTIONS as CIASection[],
  });

  useEffect(() => {
    dispatch(setPageTitle("CIA–1 Question Paper"));
  }, [dispatch]);

  const reviewSections: SectionPreviewItem[] = state.sections.map((sec) => ({
    id: sec.id,
    sectionTitle: `SECTION ${sec.sectionLetter} — ${sec.title.toUpperCase()}`,
    totalMarksText: `[${sec.totalMarks.toString().toUpperCase()}]`,
    questions: sec.questions.map((q, idx) => ({
      id: q.id,
      qNoNumber: q.qNo.replace(/^Q/i, "") || idx + 1,
      text: q.text,
      marks: q.marks,
      co: q.co,
      kLevel: q.kLevel,
      topic: q.topic,
    })),
  }));

  const handlePaperChange = (field: string, value: any) => {
    setState({ [field]: value });
  };

  return (
    <div className="min-h-screen space-y-6">
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
        onBack={() => router.push("/neurobe/cia-question-paper")}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      <PageHeader
        title="CIA–1 Question Paper"
        records="Draft"
        actionBtn2={{
              label: "Save Draft",
              icon: <Save className="h-4 w-4" />,
              onClick: () => {},
            }}
            actionBtn1={{
              label: "View Draft",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => {},
            }}
      />

      <CIAPaperMarksAllocationBar
        totalPaperMarks={state.totalPaperMarks}
        allocatedSectionMarks={state.allocatedSectionMarks}
        remainingToAllocate={state.remainingToAllocate}
        badgeText="Section Marks Balanced (100%)"
        isBalanced={true}
      />


      <PaperSetupSection
        paperName={state.paperName}
        totalMarks={state.totalMarks}
        course={state.course}
        courseOptions={COURSE_OPTIONS}
        step="Step 1 of 3"
        onChange={handlePaperChange}
      />

      <CIASectionsQuestionsCard
        title="2. Sections & Questions"
        subtitle="Allocate marks per section and compose syllabus-aligned questions"
        sections={state.sections}
        onAddSection={() => console.log("Add Section")}
        onAddQuestion={(secId) => console.log("Add Question to", secId)}
        onGenerateQuestions={(secId) => console.log("Generate Questions for", secId)}
        onDeleteQuestion={(secId, qId) => console.log("Delete Question", qId, "from", secId)}
        onDeleteSection={(secId) => console.log("Delete Section", secId)}
        onSectionSettings={(secId) => console.log("Section Settings for", secId)}
      />

      <CIAPaperReviewCard
        title="3. Review & Finalize"
        subtitle="Academic printable preview of the question paper"
        sections={reviewSections}
        onFinalInspection={() => console.log("Final Inspection")}
      />

      <CIAPaperFinalizationActions
        onBackToEditSections={() => router.push("/neurobe/cia-question-paper")}
        onSaveDraft={() => console.log("Save Draft")}
        onApproveFinalize={() => console.log("Approve & Finalize")}
        totalPaperMarks={state.totalPaperMarks}
      />
    </div>
  );
};

export default PrivateRouter(CIAQuestionPaperEdit);
