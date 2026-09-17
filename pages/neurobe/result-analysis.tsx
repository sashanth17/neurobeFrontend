import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import ResultAnalysisHeaderCard from "@/components/academic-setup/ResultAnalysisHeaderCard";
import AssessmentSummaryCard from "@/components/academic-setup/AssessmentSummaryCard";
import KnowledgeLevelAnalysisCard from "@/components/academic-setup/KnowledgeLevelAnalysisCard";
import StudentResultsTableCard from "@/components/academic-setup/StudentResultsTableCard";

const ResultsAnalysis = () => {
  const dispatch = useDispatch();

  const [state, setState] = useSetState({
    search: "",
    loading: false,
    activeTab: "results-analysis",
    mode: "mcq",
    selectedMcq: "mcq-1",
    selectedCia: "cia-1",
  });

  useEffect(() => {
    dispatch(setPageTitle("Results & Analysis"));
  }, [dispatch]);

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
        onBack={() => console.log("back")}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      <div className="space-y-4">
        <ResultAnalysisHeaderCard
          courseCode="CS309 — Computer Networks"
          enrolledStudentsMcq="45 Enrolled Students"
          enrolledStudentsCia="40 Enrolled Students"
          activeMode={state.mode}
          onModeChange={(mode) => setState({ mode })}
          selectedMcqId={state.selectedMcq}
          onMcqSelect={(id) => setState({ selectedMcq: id })}
          selectedCiaId={state.selectedCia}
          onCiaSelect={(id) => setState({ selectedCia: id })}
        />

        <AssessmentSummaryCard variant={state.mode as "mcq" | "cia"} />

        {state.mode === "mcq" && <KnowledgeLevelAnalysisCard />}

        <StudentResultsTableCard mode={state.mode as "mcq" | "cia"} />
      </div>
    </div>
  );
};

export default PrivateRouter(ResultsAnalysis);
