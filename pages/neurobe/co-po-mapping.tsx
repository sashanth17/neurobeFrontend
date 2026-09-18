import { useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  GraduationCap,
  Lightbulb,
  Check,
  GitCompare,
  Save,
  Info,
  ArrowRight,
  Cable,
  Sparkles,
  RotateCw,
  Edit3,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState, Success, Dropdown, Failure } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import StatTabCard from "@/components/academic-setup/StatTabCard";
import MappingMatrixHeader from "@/components/co-po-mapping/MappingMatrixHeader";
import COPOMappingModal from "@/components/co-po-mapping/COPOMappingModal";
import TableComponent from "@/components/common-components/TableComponent";
import PageFooter from "@/components/common-components/PageFooter";
import KeepFilePrompt from "@/components/academic-setup/KeepFilePrompt";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/common-components/PageHeader";
import StageVersionHistoryPanel from "@/components/academic-setup/StageVersionHistoryPanel";
import Models from "@/imports/models.import";

export interface ProgramOutcome {
  code: string;
  title: string;
  description: string;
}

export interface CourseOutcome {
  id: number;
  co_code: string;
  bloom_level: string;
  description: string;
}

export interface MappingCell {
  correlation_level: number;
  strength_label: string;
  is_ai_suggested: boolean;
  justification: string | null;
  status: string;
  mapping_id: number | null;
}

export interface COPOMatrixResponse {
  syllabus_id: number;
  course_id: number;
  po_version: string;
  mapping_status: string;
  summary: {
    course_outcomes_count: number;
    program_outcomes_count: number;
    ai_suggestions_count: number;
    mappings_need_review_count: number;
  };
  program_outcomes: ProgramOutcome[];
  course_outcomes: CourseOutcome[];
  matrix: Record<string, Record<string, MappingCell>>;
}

const getErrorMessage = (error: any, fallback: string) => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error?.message === "string") return error.message;
  if (typeof error?.detail === "string") return error.detail;
  if (typeof error?.error === "string") return error.error;
  return fallback;
};

const COPOMapping = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const course_id = useSearchParams().get("course_id");

  const [state, setState] = useSetState({
    search: "",
    selectedCourse: null,
    activeCourse: null as any,
    loading: false,
    generatingCopo: false,
    activeTab: "coordinator",
    approvedMappings: [] as string[],
    mappingApproved: false,
    copoMatrix: null as any,
    courseDetail: null as any,
    courseList: [] as any[],
    organization_id: "",
    coordinator_id: "",
    isCourseCoordinator: false,
    mappingModal: null as null | {
      coCode: string;
      coTitle?: string;
      coDescription: string;
      bloomLevel?: string;
      poKey: string;
      poTitle?: string;
      poDescription?: string;
      score: number;
      strengthLabel?: string;
      justification?: string | null;
      suggestedBy?: string;
      isAiSuggested?: boolean;
      status?: string;
    },
    fetchingCell: false,
    updatingCell: false,
    savingDraft: false,
    approvingMap: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("CO-PO Mapping"));
  }, [dispatch]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.role === "course_coordinator") {
      setState({
        isCourseCoordinator: true,
        coordinator_id: user.id,
      });
    }
    setState({
      organization_id: user?.organization_id,
    });
    if (user?.organization_id) {
      getAllCourse(user.organization_id);
    } else {
      getAllCourse();
    }
  }, []);

  useEffect(() => {
    if (course_id) {
      getCourseDetails();
      // getCOPOMatrix();
    }
  }, [course_id]);

  // API integrations
  const getAllCourse = async (orgId?: any) => {
    try {
      const targetOrg = orgId || state?.organization_id;
      const res: any = await Models.course.list(targetOrg ? { organization_id: targetOrg } : {});
      const dropdown = Dropdown(res, "course_title");
      setState({
        courseList: dropdown,
      });
    } catch (error: any) {
      console.log("error fetching course list", error);
      Failure(getErrorMessage(error, "Failed to fetch course list"));
    }
  };

  const getCourseDetails = async () => {
    try {
      const res: any = await Models.course.detail(course_id);
      setState({
        courseDetail: res,
        selectedCourse: res ? { value: res.id, label: `${res.course_code} - ${res.course_title}` } : null,
      });
      const sid = res?.syllabus_id || res?.latest_syllabus?.id;
      if (sid) {
        getCOPOMatrix(sid);
      } else {
        setState({ loading: false, copoMatrix: null });
      }
    } catch (error: any) {
      console.log("error fetching course detail", error);
      Failure(getErrorMessage(error, "Failed to fetch course detail"));
      setState({ loading: false, copoMatrix: null });
    }
  };

  const getCOPOMatrix = async (syllabusId?: any) => {
    const sid = syllabusId || state.courseDetail?.latest_syllabus?.id || state.courseDetail?.syllabus_id || course_id;
    if (!sid) {
      setState({ loading: false, copoMatrix: null });
      return;
    }
    try {
      setState({ loading: true });
      const res: any = await Models.COPOMap.copo_map(sid);
      if (res && (res.matrix || res.data?.matrix)) {
        const matrixObj = res.matrix ? res : res.data;
        const isApprovedStatus = matrixObj?.mapping_status === "Approved";
        setState({
          copoMatrix: matrixObj,
          mappingApproved: isApprovedStatus,
          loading: false,
        });
      } else {
        setState({ copoMatrix: res?.data || null, loading: false });
      }
    } catch (error: any) {
      console.log("error fetching copo matrix", error);
      Failure(getErrorMessage(error, "Failed to fetch CO-PO matrix"));
      setState({ loading: false, copoMatrix: null });
    }
  };

  const handleGenerateCopo = async (parentParams?: { extraction_version?: number }) => {
    const sid = state.courseDetail?.latest_syllabus?.id || state.courseDetail?.syllabus_id || course_id;
    if (!sid) {
      Failure("No syllabus found for this course. Please upload a syllabus first.");
      return;
    }
    try {
      setState({ generatingCopo: true });
      await Models.COPOMap.generate_copo(sid, {
        extraction_version: parentParams?.extraction_version,
      });
      Success("CO-PO mapping generation started with NEURO AI!");
      setTimeout(async () => {
        await getCOPOMatrix(sid);
        setState({ generatingCopo: false });
      }, 2500);
    } catch (error: any) {
      console.error("Error generating CO-PO mapping:", error);
      Failure(getErrorMessage(error, "Failed to generate CO-PO mapping"));
      setState({ generatingCopo: false });
    }
  };

  const handleVersionActivated = async (newVer: number) => {
    const sid = state.courseDetail?.latest_syllabus?.id || state.courseDetail?.syllabus_id || course_id;
    if (sid) {
      await getCOPOMatrix(sid);
    }
  };

  // Matrix data resolution
  const matrixData: COPOMatrixResponse = state.copoMatrix || {};
  const programOutcomes = matrixData?.program_outcomes || [];
  const courseOutcomes = matrixData?.course_outcomes || [];
  const matrix = matrixData?.matrix || {};
  const summary = matrixData?.summary;

  const isApproved = state.mappingApproved || matrixData?.mapping_status === "Approved";
  const allMapped = state.approvedMappings.length > 0;

  // Direct cell cycle handler (0 -> 1 -> 2 -> 3 -> 0)
  const handleDirectCellCycle = async (row: any, po: any) => {
    const co_code = row.co_code;
    const target_code = po.code;
    const currentCell: any = matrix[co_code]?.[target_code] || {};
    const currentScore = currentCell.correlation_level ?? 0;
    const nextScore = (currentScore + 1) % 4; // Cycles: 0 -> 1 -> 2 -> 3 -> 0

    const strengthMap: Record<number, string> = {
      3: "3 – High",
      2: "2 – Medium",
      1: "1 – Low",
      0: "– No Mapping",
    };

    // Optimistic UI update
    const currentCoMap = matrix[co_code] || {};
    const updatedMatrix = {
      ...matrix,
      [co_code]: {
        ...currentCoMap,
        [target_code]: {
          ...currentCell,
          correlation_level: nextScore,
          strength_label: strengthMap[nextScore] || "– No Mapping",
          status: "accepted",
          is_ai_suggested: false,
        },
      },
    };

    const mappingKey = `${co_code}-${target_code}`;
    const updatedApproved = state.approvedMappings.includes(mappingKey)
      ? state.approvedMappings
      : [...state.approvedMappings, mappingKey];

    setState({
      approvedMappings: updatedApproved,
      copoMatrix: {
        ...matrixData,
        matrix: updatedMatrix,
      },
    });

    const sid = state.courseDetail?.latest_syllabus?.id || state.courseDetail?.syllabus_id || state.copoMatrix?.syllabus_id || course_id;
    try {
      await Models.COPOMap.copo_update(sid, {
        co_code,
        target_code,
        correlation_level: nextScore,
        justification: currentCell.justification || `Updated correlation level to ${nextScore}`,
        status: "accepted",
      });
    } catch (error: any) {
      console.error("Error cycling cell score:", error);
      Failure(getErrorMessage(error, `Failed to update ${co_code} × ${target_code}`));
    }
  };

  const handleCellClick = async (row: any, po: any) => {
    const co_code = row.co_code;
    const target_code = po.code;
    const cell: any = matrix[co_code]?.[target_code] || {};
    const score = cell.correlation_level ?? 0;

    // Set immediate modal state with existing matrix/row info
    setState({
      fetchingCell: true,
      mappingModal: {
        coCode: co_code,
        coTitle: "Course Outcome",
        coDescription: row.description,
        bloomLevel: row.bloom_level,
        poKey: target_code,
        poTitle: po.title,
        poDescription: po.description,
        score: score,
        strengthLabel: cell.strength_label || (score > 0 ? `Mapping Strength: ${score}` : "No Mapping"),
        justification: cell.justification || null,
        suggestedBy: "NEURO AI",
        isAiSuggested: cell.is_ai_suggested ?? true,
        status: cell.status || "suggested",
      },
    });

    const sid = state.courseDetail?.latest_syllabus?.id || state.copoMatrix?.syllabus_id ;
    try {
      const res: any = await Models.COPOMap.get_cell_detail(sid, {
        co_code,
        target_code,
      });
      const data = res?.data || res;
      if (data) {
        const newScore =
          data.suggested_mapping_value !== undefined ? data.suggested_mapping_value : score;
        const mappingKey = `${co_code}-${target_code}`;
        const isAccepted = data.status === "accepted";
        const updatedApproved =
          isAccepted && !state.approvedMappings.includes(mappingKey)
            ? [...state.approvedMappings, mappingKey]
            : state.approvedMappings;

        setState({
          fetchingCell: false,
          approvedMappings: updatedApproved,
          mappingModal: {
            coCode: data.co_code || co_code,
            coTitle: data.co_title || "Course Outcome",
            coDescription: data.co_description || row.description,
            bloomLevel: row.bloom_level,
            poKey: data.target_code || target_code,
            poTitle: data.target_title || po.title,
            poDescription: data.target_description || po.description,
            score: newScore,
            strengthLabel:
              data.strength_label ||
              (newScore > 0 ? `Mapping Strength: ${newScore}` : "No Mapping"),
            suggestedBy: data.suggested_by || "NEURO AI",
            justification: data.rationale || data.justification || cell.justification,
            isAiSuggested: cell.is_ai_suggested ?? true,
            status: data.status || cell.status || "suggested",
          },
        });
      } else {
        setState({ fetchingCell: false });
      }
    } catch (error: any) {
      console.log("error fetching cell detail", error);
      setState({ fetchingCell: false });
      Failure(getErrorMessage(error, "Failed to fetch cell details"));
    }
  };

  const handleUpdateMapping = async (payload: {
    co_code: string;
    target_code: string;
    correlation_level: number;
    justification: string;
    status: string;
  }) => {
    try {
      setState({ updatingCell: true });
      const sid = state.courseDetail?.latest_syllabus?.id || state.copoMatrix?.syllabus_id ;

      console.log("Calling copo_update with syllabus_id:", sid, "payload:", payload);
      await Models.COPOMap.copo_update(sid, payload);

      const { co_code, target_code, correlation_level, justification, status } = payload;
      const strengthMap: Record<number, string> = {
        3: "3 - High",
        2: "2 - Medium",
        1: "1 - Low",
        0: "- No Mapping",
      };

      const currentCoMatrix = matrix[co_code] || {};
      const currentCell = currentCoMatrix[target_code] || {};

      const updatedMatrix = {
        ...matrix,
        [co_code]: {
          ...currentCoMatrix,
          [target_code]: {
            ...currentCell,
            correlation_level,
            strength_label: strengthMap[correlation_level] || "- No Mapping",
            justification,
            status,
            is_ai_suggested: false,
          },
        },
      };

      const key = `${co_code}-${target_code}`;
      const updatedApproved = state.approvedMappings.includes(key)
        ? state.approvedMappings
        : [...state.approvedMappings, key];

      setState({
        approvedMappings: updatedApproved,
        copoMatrix: {
          ...matrixData,
          matrix: updatedMatrix,
        },
        mappingModal: null,
        updatingCell: false,
      });

      Success(`Mapping for ${co_code} × ${target_code} updated successfully`);
    } catch (error: any) {
      console.log("error updating mapping", error);
      setState({ updatingCell: false });
      Failure(getErrorMessage(error, `Failed to update mapping for ${payload.co_code} × ${payload.target_code}`));
    }
  };

  const handleAcceptMapping = async (payload: {
    co_code: string;
    target_code: string;
  }) => {
    try {
      setState({ updatingCell: true });
      const sid = state.courseDetail?.latest_syllabus?.id || state.copoMatrix?.syllabus_id ;

      console.log("Calling accept_map with syllabus_id:", sid, "payload:", payload);
      await Models.COPOMap.accept_map(sid, payload);

      const { co_code, target_code } = payload;
      const currentCoMatrix = matrix[co_code] || {};
      const currentCell = currentCoMatrix[target_code] || {};

      const updatedMatrix = {
        ...matrix,
        [co_code]: {
          ...currentCoMatrix,
          [target_code]: {
            ...currentCell,
            status: "accepted",
          },
        },
      };

      const key = `${co_code}-${target_code}`;
      const updatedApproved = state.approvedMappings.includes(key)
        ? state.approvedMappings
        : [...state.approvedMappings, key];

      setState({
        approvedMappings: updatedApproved,
        copoMatrix: {
          ...matrixData,
          matrix: updatedMatrix,
        },
        mappingModal: state.mappingModal
          ? {
              ...state.mappingModal,
              status: "accepted",
            }
          : null,
        updatingCell: false,
      });

      Success(`Mapping for ${co_code} × ${target_code} accepted successfully`);
    } catch (error: any) {
      console.log("error accepting mapping", error);
      setState({ updatingCell: false });
      Failure(getErrorMessage(error, `Failed to accept mapping for ${payload.co_code} × ${payload.target_code}`));
    }
  };

  const handleApproveMapping = async () => {
    try {
      setState({ approvingMap: true });
      const sid = state.courseDetail?.latest_syllabus?.id || state.copoMatrix?.syllabus_id ;

      // Construct dynamic comments based on logged in user / course coordinator
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const fullName =
        user?.first_name && user?.last_name
          ? `${user.first_name} ${user.last_name}`
          : user?.name || user?.full_name || "Faculty Member";
      const formattedName = fullName.toLowerCase().includes("dr") ? fullName : `${fullName}`;
      const roleName =
        user?.role === "course_coordinator" || !user?.role ? "Course Coordinator" : user.role;
      const comments = `Reviewed and ratified by ${roleName} ${formattedName}`;

      const payload = {
        comments,
      };

      console.log("Calling approve_map with syllabus_id:", sid, "payload:", payload);
      await Models.COPOMap.approve_map(sid, payload);
      Success("CO-PO mapping approved successfully");
      setState({ mappingApproved: true, approvingMap: false });
      getCOPOMatrix(sid);
    } catch (error: any) {
      console.log("error approving map", error);
      setState({ approvingMap: false });
      Failure(getErrorMessage(error, "Failed to approve CO-PO mapping"));
    }
  };

  const handleSaveDraft = async () => {
    try {
      setState({ savingDraft: true });
      const sid = state.courseDetail?.latest_syllabus?.id || state.copoMatrix?.syllabus_id ;

      const formattedMatrix: Record<string, Record<string, number>> = {};
      const formattedJustifications: Record<string, Record<string, string>> = {};

      Object.keys(matrix).forEach((coCode) => {
        formattedMatrix[coCode] = {};
        formattedJustifications[coCode] = {};
        Object.keys(matrix[coCode] || {}).forEach((poCode) => {
          const cell: any = matrix[coCode][poCode];
          if (cell !== undefined && cell !== null) {
            formattedMatrix[coCode][poCode] =
              typeof cell === "number" ? cell : (cell.correlation_level ?? 0);
            if (cell.justification) {
              formattedJustifications[coCode][poCode] = cell.justification;
            }
          }
        });
      });

      const payload = {
        matrix: formattedMatrix,
        justifications: formattedJustifications,
      };

      console.log("Calling save_draft with syllabus_id:", sid, "payload:", payload);
      await Models.COPOMap.save_draft(sid, payload);
      Success("CO-PO mapping draft saved successfully");
      setState({ savingDraft: false });
    } catch (error: any) {
      console.log("error saving draft", error);
      setState({ savingDraft: false });
      Failure(getErrorMessage(error, "Failed to save CO-PO mapping draft"));
    }
  };

  const filteredRecords = courseOutcomes.filter((row) => {
    const s = state.search.toLowerCase();
    return (
      !s ||
      row.co_code.toLowerCase().includes(s) ||
      row.description.toLowerCase().includes(s) ||
      row.bloom_level.toLowerCase().includes(s)
    );
  });

  const getScoreBadge = (score: number) => {
    if (score === 3)
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-800 text-xs font-bold text-white shadow-sm">
          3
        </span>
      );
    if (score === 2)
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white shadow-sm">
          2
        </span>
      );
    if (score === 1)
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white shadow-sm">
          1
        </span>
      );
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-xs font-bold text-[#000]">
        -
      </span>
    );
  };

  const verifiedCount = state.approvedMappings.length;
  const needReviewCount = Math.max(
    0,
    (summary?.mappings_need_review_count ?? summary?.ai_suggestions_count ?? 0) - verifiedCount
  );

  const TABS = [
    {
      key: "course_outcome",
      label: "Course Outcome",
      count: summary?.course_outcomes_count ?? courseOutcomes.length,
      subLabel: "Course outcomes to map",
      icon: <Lightbulb className="h-5 w-5" />,
    },
    {
      key: "program_outcome",
      label: "Program Outcome",
      count: summary?.program_outcomes_count ?? programOutcomes.length,
      subLabel: matrixData?.po_version || "—",
      icon: <GraduationCap className="h-5 w-5" />,
    },
    {
      key: "ai_suggestions",
      label: "AI Generated Mapping Suggestions",
      subLabel: "Mappings Need Review",
      count: summary?.ai_suggestions_count ?? 0,
      icon: <GitCompare className="h-5 w-5" />,
    },
    {
      key: "mapping_verified",
      label: "Mapping Verified",
      subLabel: "AI-generated mappings verified by Coordinator",
      count: verifiedCount,
      icon: <Check className="h-5 w-5" />,
    },
  ];

  return (
    <div className="min-h-screen">
      <CourseBanner
        courseCode={state?.courseDetail?.course_code}
        courseTitle={state?.courseDetail?.course_title}
        description="Coordinator View — Academic course preparation, syllabus, outcomes mapping, lesson plans, question banking, and CIA paper generation."
        programme={state?.courseDetail?.programme}
        batch={state?.courseDetail?.batch_name}
        academicYear={state?.courseDetail?.batch_name || ""}
        students={state?.courseDetail?.students_count}
        selectedCourse={state.selectedCourse}
        courseOptions={state.courseList}
        onCourseChange={(val) => {
          setState({ selectedCourse: val });
          router.push(`/neurobe/co-po-mapping?course_id=${val.value}`);
        }}
        activeView={state.activeTab}
        onBack={() => router.back()}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      <PageHeader
        title="CO–PO Mapping"
        records={matrixData?.po_version ? `PO Version: ${matrixData.po_version}` : ""}
        subtitle="AI-assisted mapping between approved Course Outcomes and the selected Program Outcome version. Hover over any cell to see strength & rationale, or click to cycle strength."
        icon={<Cable className="h-5 w-5 text-color2" />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {TABS.map((tab) => (
          <StatTabCard
            key={tab.key}
            icon={tab.icon}
            label={tab.label}
            subLabel={tab.subLabel}
            count={tab.count}
            active={state.activeTab === tab.key}
            onClick={() => setState({ activeTab: tab.key })}
          />
        ))}
      </div>

      <KeepFilePrompt
        icon={<Info className="text-color2 h-4 w-4" />}
        title="Hover over any cell to inspect correlation strength, Bloom level, and NEURO AI rationale. Click any cell to cycle strength directly."
      />

      {course_id && (
        <StageVersionHistoryPanel
          stage="copo"
          stageLabel="CO-PO Mapping"
          courseId={course_id}
          onVersionActivated={handleVersionActivated}
          onGenerateNew={handleGenerateCopo}
          isGenerating={state.generatingCopo}
        />
      )}

      {/* CO-PO Mapping Matrix */}
      <div className="panel">
        <MappingMatrixHeader
          title={
            courseOutcomes.length > 0 && programOutcomes.length > 0
              ? `${courseOutcomes[0]?.co_code}–${courseOutcomes[courseOutcomes.length - 1]?.co_code} × ${programOutcomes[0]?.code}–${programOutcomes[programOutcomes.length - 1]?.code} Mapping Matrix`
              : "CO–PO Mapping Matrix"
          }
          version={matrixData?.po_version || ""}
          status={isApproved ? "Approved" : matrixData?.mapping_status || "Review Required"}
          onGenerate={() => handleGenerateCopo()}
          isGenerating={state.generatingCopo}
        />

        {courseOutcomes.length === 0 && !state.loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/30">
            <Sparkles className="h-10 w-10 text-indigo-500 mb-3 animate-pulse" />
            <h4 className="text-base font-bold text-gray-900 dark:text-white">
              No CO-PO Mapping Generated Yet
            </h4>
            <p className="mt-1 text-sm text-gray-500 max-w-md">
              Generate AI-assisted mapping between approved Course Outcomes and Program Outcomes with academic rationales.
            </p>
            <button
              type="button"
              onClick={() => handleGenerateCopo()}
              disabled={state.generatingCopo}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
            >
              {state.generatingCopo ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  <span>Generating Mapping with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate CO-PO Mapping with AI</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <TableComponent
            records={filteredRecords}
            loading={state.loading}
            noRecordsText="No CO-PO mappings found"
            columns={[
              {
                accessor: "co_code",
                title: "COURSE OUTCOME",
                render: ({ co_code, bloom_level, description }: any) => (
                  <div className="min-w-[220px] max-w-[280px] py-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-color2-l text-color2 rounded-md px-2 py-0.5 text-xs font-bold">
                        {co_code}
                      </span>
                      {bloom_level && (
                        <span className="rounded bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-color2 dark:bg-purple-900/30">
                          {bloom_level}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-[#000] dark:text-gray-300" title={description}>
                      {description}
                    </p>
                  </div>
                ),
              },
              ...programOutcomes.map((po) => ({
                accessor: po.code,
                title: (
                  <div
                    className="flex flex-col items-center justify-center text-center cursor-help"
                    title={`${po.code}: ${po.title}\n${po.description}`}
                  >
                    <span className="font-bold text-xs">{po.code}</span>
                  </div>
                ),
                render: (row: any) => {
                  const cell = matrix[row.co_code]?.[po.code] || {
                    correlation_level: 0,
                    strength_label: "– No Mapping",
                    is_ai_suggested: false,
                    justification: null,
                    status: "suggested",
                  };
                  const mappingKey = `${row.co_code}-${po.code}`;
                  const isMappingApproved = state.approvedMappings.includes(mappingKey);
                  const score = cell.correlation_level ?? 0;

                  return (
                    <div className="relative group flex items-center justify-center py-1">
                      {/* Clickable Badge: direct cycle 0 -> 1 -> 2 -> 3 -> 0 */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDirectCellCycle(row, po);
                        }}
                        className="relative p-1 rounded-lg transition-transform hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
                        title="Click to cycle correlation strength (0 → 1 → 2 → 3)"
                      >
                        {getScoreBadge(score)}
                        {cell.is_ai_suggested && score > 0 && !isMappingApproved && (
                          <div
                            title="AI Suggested (Review Required)"
                            className="bg-color2 absolute right-0.5 -top-0.5 inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-white animate-pulse"
                          />
                        )}
                        {isMappingApproved && !isApproved && (
                          <div
                            title="Mapping Verified"
                            className="bg-green-600 absolute right-0.5 -top-0.5 inline-flex h-2.5 w-2.5 rounded-full ring-2 ring-white"
                          />
                        )}
                      </button>

                      {/* Floating Hover Card on Cell (Strength, Bloom level, and Justification without opening any dropdown or modal!) */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-72 -translate-x-1/2 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-2xl group-hover:block dark:border-slate-700 dark:bg-slate-900">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                              {row.co_code} × {po.code}
                            </span>
                            {row.bloom_level && (
                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                {row.bloom_level}
                              </span>
                            )}
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              score === 3
                                ? "bg-green-100 text-green-800"
                                : score === 2
                                ? "bg-blue-100 text-blue-800"
                                : score === 1
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {score === 3
                              ? "3 – High"
                              : score === 2
                              ? "2 – Medium"
                              : score === 1
                              ? "1 – Low"
                              : "– No Mapping"}
                          </span>
                        </div>

                        <div className="mt-2">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            Target Program Outcome ({po.code})
                          </p>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {po.title || po.code}
                          </p>
                          {po.description && (
                            <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-2">
                              {po.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800/60">
                          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            <Sparkles className="h-3 w-3" /> Academic Rationale
                          </p>
                          <p className="mt-1 max-h-24 overflow-y-auto text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                            {cell.justification || "No rationale provided yet. Click cell to cycle strength."}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400 dark:border-slate-800">
                          <span>💡 Click cell to cycle: 0 → 1 → 2 → 3</span>
                          {cell.is_ai_suggested && (
                            <span className="font-medium text-indigo-500">NEURO AI</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                },
              })),
            ]}
          />
        )}
      </div>

      {state.mappingModal && (
        <COPOMappingModal
          open={!!state.mappingModal}
          onClose={() => setState({ mappingModal: null })}
          coCode={state.mappingModal.coCode}
          coTitle={state.mappingModal.coTitle}
          coDescription={state.mappingModal.coDescription}
          bloomLevel={state.mappingModal.bloomLevel}
          poKey={state.mappingModal.poKey}
          poTitle={state.mappingModal.poTitle}
          poDescription={state.mappingModal.poDescription}
          score={state.mappingModal.score}
          strengthLabel={state.mappingModal.strengthLabel}
          justification={state.mappingModal.justification}
          suggestedBy={state.mappingModal.suggestedBy}
          isAiSuggested={state.mappingModal.isAiSuggested}
          status={state.mappingModal.status}
          fetching={state.fetchingCell}
          loading={state.updatingCell}
          onUpdate={handleUpdateMapping}
          onAccept={handleAcceptMapping}
        />
      )}

      <div className="mt-4">
        <PageFooter
          batch={!allMapped && !isApproved}
          status={{
            label: isApproved ? "Approved" : (matrixData?.mapping_status || "Review Required"),
            color: isApproved ? "#16a34a" : "#ea580c",
          }}
          content1={
            state.courseDetail?.course_code
              ? `Course: ${state.courseDetail?.course_code} – ${state.courseDetail?.course_title || ""}`
              : ""
          }
          content2={matrixData?.po_version ? `PO Version: ${matrixData.po_version}` : ""}
          actionBtn1={
            isApproved
              ? {
                  label: "Next: Topic",
                  icon: <ArrowRight className="h-4 w-4" />,
                  onClick: () => {
                    const cid = course_id || state.selectedCourse?.value || state.courseDetail?.id;
                    router.push(cid ? `/neurobe/topics?course_id=${cid}` : "/neurobe/topics");
                  },
                  className: "create-btn",
                }
              : {
                  label: state.approvingMap ? "Approving..." : "Approve Mapping",
                  icon: <Check className="h-4 w-4" />,
                  onClick: handleApproveMapping,
                  disabled: state.approvingMap,
                }
          }
          actionBtn2={
            isApproved
              ? {
                  label: "Mapping Approved",
                  icon: <Check className="h-4 w-4" />,
                  onClick: () => {},
                  className: "create-btn !bg-green-600 cursor-default",
                }
              : {
                  label: state.savingDraft ? "Saving..." : "Save Draft",
                  icon: <Save className="h-4 w-4" />,
                  onClick: handleSaveDraft,
                  disabled: state.savingDraft,
                }
          }
        />
      </div>
    </div>
  );
};

export default PrivateRouter(COPOMapping);
