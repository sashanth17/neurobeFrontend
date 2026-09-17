import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Printer, Edit3 } from "lucide-react";
import { useRouter } from "next/router";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import PageHeader from "@/components/common-components/PageHeader";
import CIAPaperReviewCard, { SectionPreviewItem } from "@/components/academic-setup/CIAPaperReviewCard";

const PREVIEW_SECTIONS: SectionPreviewItem[] = [
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

const CIAQuestionPaperPreview = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => {
    dispatch(setPageTitle("CIA–1 Question Paper"));
  }, [dispatch]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
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
        // activeView="cia-paper"
        onBack={() => router.push("/neurobe/cia-question-paper/cia-question-paper-edit")}
        onViewChange={(view) => console.log("view", view)}
      />

      <PageHeader
        title="CIA–1 Question Paper"
        draft="Draft"
        actionBtn2={{
          label: "Print",
          icon: <Printer className="h-4 w-4" />,
          onClick: handlePrint,
        }}
        actionBtn1={{
          label: "Resume Editing",
          icon: <Edit3 className="h-4 w-4" />,
          onClick: () => router.push("/neurobe/cia-question-paper/cia-question-paper-edit"),
        }}
      />

      <CIAPaperReviewCard
        hideHeader={true}
        sections={PREVIEW_SECTIONS}
        onFinalInspection={() => console.log("Final Inspection")}
      />
    </div>
  );
};

export default PrivateRouter(CIAQuestionPaperPreview);
