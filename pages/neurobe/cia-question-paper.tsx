import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Plus, Eye, Save, FileQuestion } from "lucide-react";
import { useRouter } from "next/router";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import PageHeader from "@/components/common-components/PageHeader";
import CIAQuestionPaperStatusCard from "@/components/academic-setup/CIAQuestionPaperStatusCard";
import CIAPaperMarksAllocationBar from "@/components/academic-setup/CIAPaperMarksAllocationBar";
import CIAPaperReviewCard, {
  SectionPreviewItem,
} from "@/components/academic-setup/CIAPaperReviewCard";
import CIASectionsQuestionsCard, {
  SectionItem,
} from "@/components/academic-setup/CIASectionsQuestionsCard";
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

const CIAQuestionPaper = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    search: "",
    statusFilter: "all",
    loading: false,
    activeTab: "coordinator",
    isEditing: false,
    totalPaperMarks: 100,
    allocatedSectionMarks: 100,
    remainingToAllocate: 0,
    sections: INITIAL_SECTIONS,
  });

  useEffect(() => {
    dispatch(
      setPageTitle(
        state.isEditing ? "CIA–1 Question Paper" : "CIA Question Paper",
      ),
    );
  }, [dispatch, state.isEditing]);

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
        onBack={() =>
          state.isEditing ? setState({ isEditing: false }) : console.log("back")
        }
        onViewChange={(view) => setState({ activeTab: view })}
      />

      {state.isEditing ? (
        <>
          <PageHeader
            title="CIA–1 Question Paper"
            icon={<FileQuestion className="text-color2 h-5 w-5" />}
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

          <CIASectionsQuestionsCard
            title="2. Sections & Questions"
            subtitle="Allocate marks per section and compose syllabus-aligned questions"
            sections={state.sections}
            onAddSection={() => console.log("Add Section")}
            onAddQuestion={(secId) => console.log("Add Question to", secId)}
            onGenerateQuestions={(secId) =>
              console.log("Generate Questions for", secId)
            }
            onDeleteQuestion={(secId, qId) =>
              console.log("Delete Question", qId, "from", secId)
            }
            onDeleteSection={(secId) => console.log("Delete Section", secId)}
            onSectionSettings={(secId) =>
              console.log("Section Settings for", secId)
            }
          />

          <CIAPaperReviewCard
            title="3. Review & Finalize"
            subtitle="Academic printable preview of the question paper"
            sections={reviewSections}
            onFinalInspection={() => console.log("Final Inspection")}
          />

          <CIAPaperFinalizationActions
            onBackToEditSections={() => setState({ isEditing: false })}
            onSaveDraft={() => console.log("Save Draft")}
            onApproveFinalize={() => console.log("Approve & Finalize")}
            totalPaperMarks={state.totalPaperMarks}
          />
        </>
      ) : (
        <>
         
          <PageHeader
        title="CIA-1 Question Paper"
        subtitle="Create CIA Question Paper"
        icon={<FileQuestion className="text-color2 h-5 w-5" />}
       
        actionBtn1={{
          label: "Create CIA Paper",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => {},
        }}
      />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <CIAQuestionPaperStatusCard
              status="draft"
              title="CIA–1 Question Paper"
              courseCodeTitle="CS309 — Computer Networks"
              progressData={{
                sectionsCompleted: "2 of 3 Sections Completed",
                marksFilled: "75 of 100 Marks Filled",
                lastEdited: "Last Edited: 2026–09–02 11:30 AM",
              }}
              onViewDraft={() =>
                router.push("/neurobe/cia-question-paper-preview")
              }
              onResumeEditing={() => {
                setState({ isEditing: true });
                router.push("/neurobe/cia-question-paper/cia-question-paper-edit");
              }}
            />

            <CIAQuestionPaperStatusCard
              status="approved"
              title="CIA–2 Question Paper"
              courseCodeTitle="CS309 — Computer Networks"
              approvedData={{
                totalMarks: "100 Marks",
                sections: 3,
                questions: 10,
                lastUpdated: "Last Updated: 2026–08–25 04:15 PM",
              }}
              onViewPaper={() => console.log("View Paper")}
              onPrint={() => console.log("Print Paper")}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default PrivateRouter(CIAQuestionPaper);
