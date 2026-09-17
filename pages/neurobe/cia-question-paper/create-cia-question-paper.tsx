import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import PaperSetupSection from "@/components/academic-setup/PaperSetupSection";
import SectionsAndQuestionsSection, {
  CIASection,
} from "@/components/academic-setup/SectionsAndQuestionsSection";
import ReviewAndFinalizeSection from "@/components/academic-setup/ReviewAndFinalizeSection";
import PageHeader from "@/components/common-components/PageHeader";
import { Eye, Plus, Save, Users } from "lucide-react";
import CIAPaperMarksAllocationBar from "@/components/academic-setup/CIAPaperMarksAllocationBar";

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
    usedMarks: 80,
    questions: [],
  },
];

const CreateCIAPaper = () => {
  const dispatch = useDispatch();

  const [state, setState] = useSetState({
    activeTab: "",
    paperName: "CIA-3 Question Paper",
    totalMarks: "100",
    course: COURSE_OPTIONS[0],
    sections: DEFAULT_SECTIONS as CIASection[],
  });

  useEffect(() => {
    dispatch(setPageTitle("Create CIA Question Paper"));
  }, [dispatch]);

  const handlePaperChange = (field: string, value: any) => {
    setState({ [field]: value });
  };

  const handleAddSection = () => {
    const newSection: CIASection = {
      id: `section-${Date.now()}`,
      title: `Section ${String.fromCharCode(65 + state.sections.length)}`,
      totalMarks: 100,
      usedMarks: 0,
      questions: [],
    };
    setState({ sections: [...state.sections, newSection] });
  };

  return (
    <div className="min-h-screen">
      <CourseBanner
        courseCode="CS309"
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

      <PageHeader
        title="Create CIA Question Paper"
        subtitle="Create CIA Question Paper"
        icon={<Plus className="text-color2 h-5 w-5" />}
        actionBtn2={{
          label: "Save Draft",
          icon: <Save className="h-4 w-4" />,
          onClick: () => { },
        }}
        actionBtn1={{
          label: "View Draft",
          icon: <Eye className="h-4 w-4" />,
          onClick: () => { },
        }}
      />

      <CIAPaperMarksAllocationBar
        totalPaperMarks="100"
        allocatedSectionMarks={state.allocatedSectionMarks}
        remainingToAllocate={state.remainingToAllocate}
        badgeText="80 marks remaining to allocate"
        badgeColor="#78350F"
        isBalanced={true}
      />

      {/* 1. Paper Setup */}
      <PaperSetupSection
        paperName={state.paperName}
        totalMarks={state.totalMarks}
        course={state.course}
        courseOptions={COURSE_OPTIONS}
        step="Step 1 of 3"
        onChange={handlePaperChange}
      />

      {/* 2. Sections & Questions */}
      <SectionsAndQuestionsSection
        sections={state.sections}
        onAddSection={handleAddSection}
        onSectionSettings={(id) => console.log("settings", id)}
        onSectionsChange={(updated) => setState({ sections: updated })}
      />

      {/* 3. Review & Finalize */}
      <ReviewAndFinalizeSection
        onBackToEdit={() => console.log("back to edit")}
        onSaveDraft={() => console.log("save draft")}
        onApproveFinalize={() => console.log("approve")}
      />
    </div>
  );
};

export default PrivateRouter(CreateCIAPaper);
