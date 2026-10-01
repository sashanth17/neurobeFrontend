import React, { useEffect, useRef, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Cable,
  Sparkles,
  RotateCw,
  Check,
  ArrowRight,
  Info,
  Save,
  Trash2,
  CheckCircle2,
  ChevronDown,
  Layers,
  AlertCircle,
  Lightbulb,
  GraduationCap,
  GitBranch,
  Edit3,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import {
  useSetState,
  Success,
  Dropdown,
  Failure,
  getErrorMessage,
  isLimitExhaustion,
  showLimitExhaustedModal,
  LIMIT_EXHAUSTED_MESSAGE,
} from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import StatTabCard from "@/components/academic-setup/StatTabCard";
import PageHeader from "@/components/common-components/PageHeader";
import COPOMappingModal from "@/components/co-po-mapping/COPOMappingModal";
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

export interface COPOVersionItem {
  id: number;
  copo_mapping_id: number;
  version_number: number;
  version: number;
  parent_extraction_id: number;
  parent_extraction_version?: number;
  job_id?: string;
  status: string;
  is_active: boolean;
  created_at: string;
  mapped_cells_count: number;
  label: string;
}

export interface ExtractionVersionItem {
  id: number;
  version_number: number;
  status: string;
  is_active: boolean;
  label: string;
}

const COPOMapping = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const course_id = searchParams.get("course_id");
  const fromParam = searchParams.get("from");

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const [state, setState] = useSetState({
    search: "",
    selectedCourse: null as any,
    courseDetail: null as any,
    courseList: [] as any[],
    activeTab: "coordinator",
    organization_id: "",

    // Matrix state
    loading: false,
    matrixData: null as any,
    courseOutcomes: [] as CourseOutcome[],
    programOutcomes: [] as ProgramOutcome[],
    matrix: {} as Record<string, Record<string, MappingCell>>,
    poAverages: {} as Record<string, number>,
    unmappedJustifications: {} as Record<string, string>,
    versionNumber: null as number | null,
    parentExtractionId: null as number | null,
    parentExtractionVersion: null as number | null,
    versionStatus: "draft",
    isActive: false,

    // Version management
    versions: [] as COPOVersionItem[],
    availableExtractions: [] as ExtractionVersionItem[],
    selectedExtractionForGen: null as number | null,
    loadingVersions: false,
    generatingCopo: false,
    savingDraft: false,
    approvingMap: false,
    activatingVersion: false,
    deletingVersion: false,

    // Modal state for editing single cell justification
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
    updatingCell: false,

    // Unmapped panel collapse
    showUnmappedPanel: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("CO-PO Mapping"));
  }, [dispatch]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setState({ organization_id: user?.organization_id });
    if (user?.organization_id) {
      loadAllCourses(user.organization_id);
    } else {
      loadAllCourses();
    }
  }, []);

  useEffect(() => {
    if (course_id) {
      loadCourseDetails();
      loadVersionsAndMatrix();
    }
  }, [course_id]);

  const loadAllCourses = async (orgId?: any) => {
    try {
      const targetOrg = orgId || state?.organization_id;
      const res: any = await Models.course.list(targetOrg ? { organization_id: targetOrg } : {});
      const dropdown = Dropdown(res, "course_title");
      setState({ courseList: dropdown });
    } catch (error: any) {
      console.error("Error fetching courses:", error);
    }
  };

  const loadCourseDetails = async () => {
    if (!course_id) return;
    try {
      const res: any = await Models.course.detail(course_id);
      setState({
        courseDetail: res,
        selectedCourse: res ? { value: res.id, label: `${res.course_code} - ${res.course_title}` } : null,
      });
    } catch (error: any) {
      console.error("Error fetching course detail:", error);
    }
  };

  const loadVersionsAndMatrix = async (targetVersion?: number) => {
    if (!course_id) return;
    try {
      setState({ loadingVersions: true });
      const verRes: any = await Models.COPOMap.get_versions(course_id);
      const vList: COPOVersionItem[] = verRes?.versions || [];
      const availExt: ExtractionVersionItem[] = verRes?.available_extractions || [];

      // Determine default extraction for generation
      const activeExt = availExt.find((e) => e.is_active) || availExt[0];
      const defaultExtId = activeExt ? activeExt.id : null;

      // Determine which version to load
      let verToLoad = targetVersion;
      if (verToLoad === undefined) {
        const activeV = vList.find((v) => v.is_active);
        verToLoad = activeV ? activeV.version_number : vList.length > 0 ? vList[0].version_number : undefined;
      }

      setState({
        versions: vList,
        availableExtractions: availExt,
        selectedExtractionForGen: defaultExtId,
        loadingVersions: false,
      });

      if (verToLoad !== undefined) {
        await loadMatrix(verToLoad);
      } else {
        setState({
          matrixData: null,
          courseOutcomes: [],
          programOutcomes: [],
          matrix: {},
          poAverages: {},
          unmappedJustifications: {},
          versionNumber: null,
          loading: false,
        });
      }
    } catch (err: any) {
      console.error("Error loading versions:", err);
      setState({ loadingVersions: false, loading: false });
    }
  };

  const loadMatrix = async (verNum?: number) => {
    if (!course_id) return;
    try {
      setState({ loading: true });
      const data: any = await Models.COPOMap.copo_map(course_id, verNum);
      if (data) {
        setState({
          matrixData: data,
          courseOutcomes: data.course_outcomes || [],
          programOutcomes: data.program_outcomes || [],
          matrix: data.matrix || {},
          poAverages: data.po_averages || {},
          unmappedJustifications: data.unmapped_justifications || {},
          versionNumber: data.version_number,
          parentExtractionId: data.parent_extraction_id,
          parentExtractionVersion: data.parent_extraction_version,
          versionStatus: data.status || "draft",
          isActive: Boolean(data.is_active),
          loading: false,
        });
      }
    } catch (error: any) {
      console.error("Error loading CO-PO matrix:", error);
      Failure(getErrorMessage(error, "Failed to load CO-PO matrix"));
      setState({ loading: false });
    }
  };

  // Polling for AI worker generation
  const startPolling = (jobId?: string) => {
    stopPolling();
    setState({ generatingCopo: true });

    let attempts = 0;
    const maxAttempts = 100;
    const pollInterval = 3000;

    const checkStatus = async () => {
      attempts++;
      try {
        if (!jobId) {
          stopPolling();
          setState({ generatingCopo: false });
          return;
        }

        const jobRes: any = await Models.COPOMap.get_job_status(jobId);
        const jobStatus = jobRes?.status || jobRes?.state;

        if (jobStatus === "completed" || jobStatus === "success") {
          stopPolling();
          setState({ generatingCopo: false });
          Success("NEURO AI has successfully generated your CO-PO mapping!");
          await loadVersionsAndMatrix();
        } else if (jobStatus === "failed" || jobStatus === "error") {
          stopPolling();
          setState({ generatingCopo: false });
          const errDetail = jobRes?.error || jobRes?.detail || "AI mapping generation failed.";
          if (isLimitExhaustion(errDetail)) {
            showLimitExhaustedModal(errDetail);
            Failure(LIMIT_EXHAUSTED_MESSAGE);
          } else {
            Failure(errDetail);
          }
        } else if (attempts >= maxAttempts) {
          stopPolling();
          setState({ generatingCopo: false });
          await loadVersionsAndMatrix();
        }
      } catch (pollErr) {
        console.warn("Polling warning:", pollErr);
        if (attempts >= maxAttempts) {
          stopPolling();
          setState({ generatingCopo: false });
        }
      }
    };

    setTimeout(checkStatus, 1500);
    pollRef.current = setInterval(checkStatus, pollInterval);
  };

  const handleGenerate = async () => {
    if (!course_id) return;
    try {
      setState({ generatingCopo: true });
      const payload: any = {};
      if (state.selectedExtractionForGen) {
        payload.parent_extraction_id = state.selectedExtractionForGen;
      }

      const res: any = await Models.COPOMap.generate_copo(course_id, payload);
      Success("NEURO AI generation initiated! Formulating Bloom correlation mappings...");
      if (res?.job_id) {
        startPolling(res.job_id);
      } else {
        await loadVersionsAndMatrix();
        setState({ generatingCopo: false });
      }
    } catch (err: any) {
      setState({ generatingCopo: false });
      if (isLimitExhaustion(err)) {
        showLimitExhaustedModal(err);
        Failure(LIMIT_EXHAUSTED_MESSAGE);
      } else {
        Failure(getErrorMessage(err, "Failed to start AI generation"));
      }
    }
  };

  // Direct cell cycle: 0 -> 1 -> 2 -> 3 -> 0
  const handleCellCycle = async (co: CourseOutcome, po: ProgramOutcome) => {
    const co_code = co.co_code;
    const target_code = po.code;
    const currentCell = state.matrix[co_code]?.[target_code] || {
      correlation_level: 0,
      strength_label: "- No Mapping",
      is_ai_suggested: false,
      justification: "",
      status: "draft",
      mapping_id: null,
    };

    const currentScore = currentCell.correlation_level || 0;
    const nextScore = (currentScore + 1) % 4;

    const strengthMap: Record<number, string> = {
      3: "3 - High",
      2: "2 - Medium",
      1: "1 - Low",
      0: "- No Mapping",
    };

    // Optimistic local state update
    const updatedRow = {
      ...(state.matrix[co_code] || {}),
      [target_code]: {
        ...currentCell,
        correlation_level: nextScore,
        strength_label: strengthMap[nextScore],
        status: "draft",
      },
    };

    const updatedMatrix = {
      ...state.matrix,
      [co_code]: updatedRow,
    };

    // Recalculate column average optimistically
    const newAverages = { ...state.poAverages };
    let sum = 0;
    let count = 0;
    state.courseOutcomes.forEach((r) => {
      const cellVal = r.co_code === co_code ? nextScore : (state.matrix[r.co_code]?.[target_code]?.correlation_level || 0);
      if (cellVal > 0) {
        sum += cellVal;
        count += 1;
      }
    });
    newAverages[target_code] = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0.0;

    setState({
      matrix: updatedMatrix,
      poAverages: newAverages,
    });

    // Save directly to relational outcome_mappings table
    try {
      await Models.COPOMap.copo_update(
        course_id!,
        {
          co_code,
          target_code,
          correlation_level: nextScore,
          justification: currentCell.justification || "",
          version_number: state.versionNumber || undefined,
        },
        state.versionNumber
      );
    } catch (err: any) {
      console.error("Cell update error:", err);
      Failure(getErrorMessage(err, `Failed to update ${co_code} × ${target_code}`));
    }
  };

  // Open modal to view/edit academic justification
  const handleOpenCellModal = (co: CourseOutcome, po: ProgramOutcome) => {
    const co_code = co.co_code;
    const target_code = po.code;
    const cell = state.matrix[co_code]?.[target_code] || {
      correlation_level: 0,
      strength_label: "- No Mapping",
      is_ai_suggested: false,
      justification: "",
      status: "draft",
      mapping_id: null,
    };

    setState({
      mappingModal: {
        coCode: co_code,
        coTitle: "Course Outcome",
        coDescription: co.description,
        bloomLevel: co.bloom_level,
        poKey: target_code,
        poTitle: po.title,
        poDescription: po.description,
        score: cell.correlation_level || 0,
        strengthLabel: cell.strength_label,
        justification: cell.justification || "",
        suggestedBy: cell.is_ai_suggested ? "NEURO AI" : "Faculty",
        isAiSuggested: cell.is_ai_suggested,
        status: cell.status || "draft",
      },
    });
  };

  // Save changes from modal
  const handleUpdateFromModal = async (payload: {
    co_code: string;
    target_code: string;
    correlation_level: number;
    justification: string;
    status: string;
  }) => {
    try {
      setState({ updatingCell: true });
      await Models.COPOMap.copo_update(
        course_id!,
        {
          co_code: payload.co_code,
          target_code: payload.target_code,
          correlation_level: payload.correlation_level,
          justification: payload.justification,
          version_number: state.versionNumber || undefined,
        },
        state.versionNumber
      );

      // Refresh current version matrix
      await loadMatrix(state.versionNumber || undefined);
      setState({ mappingModal: null, updatingCell: false });
      Success(`Mapping for ${payload.co_code} × ${payload.target_code} saved!`);
    } catch (err: any) {
      setState({ updatingCell: false });
      Failure(getErrorMessage(err, "Failed to update mapping justification"));
    }
  };

  // Bulk save draft
  const handleSaveDraft = async () => {
    if (!course_id) return;
    try {
      setState({ savingDraft: true });
      const formattedMatrix: Record<string, Record<string, number>> = {};
      const formattedJustifications: Record<string, Record<string, string>> = {};

      Object.keys(state.matrix).forEach((co) => {
        formattedMatrix[co] = {};
        formattedJustifications[co] = {};
        Object.keys(state.matrix[co] || {}).forEach((po) => {
          const cell = state.matrix[co][po];
          if (cell) {
            formattedMatrix[co][po] = cell.correlation_level ?? 0;
            if (cell.justification) {
              formattedJustifications[co][po] = cell.justification;
            }
          }
        });
      });

      await Models.COPOMap.save_draft(
        course_id,
        {
          matrix: formattedMatrix,
          justifications: formattedJustifications,
          unmapped_justifications: state.unmappedJustifications,
          version_number: state.versionNumber || undefined,
        },
        state.versionNumber
      );

      Success("CO-PO mapping draft saved to database.");
      setState({ savingDraft: false });
    } catch (err: any) {
      setState({ savingDraft: false });
      Failure(getErrorMessage(err, "Failed to save draft"));
    }
  };

  // Approve version
  const handleApprove = async () => {
    if (!course_id || !state.versionNumber) return;
    try {
      setState({ approvingMap: true });
      await Models.COPOMap.approve_map(course_id, {
        version_number: state.versionNumber,
      });
      Success(`CO-PO mapping Version ${state.versionNumber} approved!`);
      setState({ approvingMap: false, versionStatus: "approved" });
      await loadVersionsAndMatrix(state.versionNumber);
    } catch (err: any) {
      setState({ approvingMap: false });
      Failure(getErrorMessage(err, "Failed to approve CO-PO mapping"));
    }
  };

  // Reject / Disapprove version
  const handleReject = async () => {
    if (!course_id || !state.versionNumber) return;
    try {
      setState({ approvingMap: true });
      await Models.COPOMap.reject_map(course_id, {
        version_number: state.versionNumber,
      });
      Success(`CO-PO mapping Version ${state.versionNumber} marked as draft.`);
      setState({ approvingMap: false, versionStatus: "draft" });
      await loadVersionsAndMatrix(state.versionNumber);
    } catch (err: any) {
      setState({ approvingMap: false });
      Failure(getErrorMessage(err, "Failed to update version status"));
    }
  };

  // Activate version
  const handleActivate = async (verNum: number) => {
    if (!course_id) return;
    try {
      setState({ activatingVersion: true });
      await Models.COPOMap.activate_version(course_id, verNum);
      Success(`Version ${verNum} is now active.`);
      setState({ activatingVersion: false, isActive: true });
      await loadVersionsAndMatrix(verNum);
    } catch (err: any) {
      setState({ activatingVersion: false });
      Failure(getErrorMessage(err, "Failed to activate version"));
    }
  };

  // Delete version
  const handleDeleteVersion = async (verNum: number) => {
    if (!course_id) return;
    if (!window.confirm(`Are you sure you want to permanently delete CO-PO Version ${verNum}?`)) {
      return;
    }
    try {
      setState({ deletingVersion: true });
      await Models.COPOMap.delete_version(course_id, verNum);
      Success(`Version ${verNum} deleted successfully.`);
      setState({ deletingVersion: false });
      await loadVersionsAndMatrix();
    } catch (err: any) {
      setState({ deletingVersion: false });
      Failure(getErrorMessage(err, "Failed to delete version"));
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let high = 0;
    let med = 0;
    let low = 0;
    let unmapped = 0;
    let totalMapped = 0;

    state.courseOutcomes.forEach((co) => {
      state.programOutcomes.forEach((po) => {
        const lvl = state.matrix[co.co_code]?.[po.code]?.correlation_level || 0;
        if (lvl === 3) high++;
        else if (lvl === 2) med++;
        else if (lvl === 1) low++;
      });
    });

    totalMapped = high + med + low;

    // Count POs with 0 mapping across all COs
    state.programOutcomes.forEach((po) => {
      const avg = state.poAverages[po.code] || 0;
      if (avg === 0) unmapped++;
    });

    return { high, med, low, unmapped, totalMapped };
  }, [state.matrix, state.courseOutcomes, state.programOutcomes, state.poAverages]);

  const filteredCOs = useMemo(() => {
    const s = state.search.toLowerCase().trim();
    if (!s) return state.courseOutcomes;
    return state.courseOutcomes.filter(
      (co) =>
        co.co_code.toLowerCase().includes(s) ||
        co.description.toLowerCase().includes(s) ||
        co.bloom_level.toLowerCase().includes(s)
    );
  }, [state.courseOutcomes, state.search]);

  // Check unmapped POs list
  const unmappedPOs = useMemo(() => {
    return state.programOutcomes.filter((po) => (state.poAverages[po.code] || 0) === 0);
  }, [state.programOutcomes, state.poAverages]);

  const isApproved = state.versionStatus === "approved";

  return (
    <div className="min-h-screen pb-16">
      {/* Course Banner */}
      <CourseBanner
        courseCode={state?.courseDetail?.course_code}
        courseTitle={state?.courseDetail?.course_title}
        description="Coordinator View — Academic course preparation, syllabus extraction, CO-PO matrix alignment, pedagogy selection, and lesson schedule."
        programme={state?.courseDetail?.programme}
        batch={state?.courseDetail?.batch_name}
        academicYear={state?.courseDetail?.academic_year || state?.courseDetail?.batch_name || ""}
        students={state?.courseDetail?.students_count}
        selectedCourse={state.selectedCourse}
        courseOptions={state.courseList}
        onCourseChange={(val) => {
          setState({ selectedCourse: val });
          router.push(`/neurobe/co-po-mapping?course_id=${val.value}`);
        }}
        activeView={state.activeTab}
        onBack={() => {
          if (fromParam === "my-courses") {
            router.push("/neurobe/my-assigned-courses");
          } else {
            router.back();
          }
        }}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      <PageHeader
        title="CO–PO Mapping Matrix"
        records={state.versionNumber ? `Version ${state.versionNumber} (Syllabus v${state.parentExtractionVersion || "—"})` : undefined}
        subtitle="AI-assisted alignment matrix connecting Course Outcomes (CO) with Program Outcomes (PO1-PO12 & PSOs) with Bloom taxonomy compliance."
        icon={<Cable className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
      />

      {/* Version Selector & Generation Bar */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Version pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <span>CO-PO Versions:</span>
            </div>

            {state.versions.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No versions created yet</span>
            ) : (
              state.versions.map((v) => {
                const isSelected = v.version_number === state.versionNumber;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => loadMatrix(v.version_number)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300 dark:ring-indigo-800"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{v.label}</span>
                    {v.is_active && (
                      <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase ${isSelected ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"}`}>
                        Active
                      </span>
                    )}
                    {v.status === "approved" && (
                      <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold uppercase ${isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"}`}>
                        Approved
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Right: Parent Extraction Selector & Generate Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            {state.availableExtractions.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500">Parent Syllabus:</span>
                <select
                  value={state.selectedExtractionForGen || ""}
                  onChange={(e) => setState({ selectedExtractionForGen: Number(e.target.value) })}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {state.availableExtractions.map((ext) => (
                    <option key={ext.id} value={ext.id}>
                      {ext.label} {ext.status === "approved" ? "(Approved)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={state.generatingCopo || state.availableExtractions.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
            >
              {state.generatingCopo ? (
                <>
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate New Version</span>
                </>
              )}
            </button>

            {state.versionNumber && !state.isActive && (
              <button
                type="button"
                onClick={() => handleActivate(state.versionNumber!)}
                disabled={state.activatingVersion}
                className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Set Active</span>
              </button>
            )}

            {state.versionNumber && (
              <button
                type="button"
                onClick={() => handleDeleteVersion(state.versionNumber!)}
                disabled={state.deletingVersion}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300"
                title="Delete this version"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {state.versionNumber && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTabCard
            icon={<Lightbulb className="h-5 w-5" />}
            label="Course Outcomes"
            count={state.courseOutcomes.length}
            subLabel={`Ext v${state.parentExtractionVersion || "—"} Approved`}
            active={false}
          />
          <StatTabCard
            icon={<GraduationCap className="h-5 w-5" />}
            label="Program Outcomes"
            count={state.programOutcomes.length}
            subLabel="12 POs + 4 PSOs"
            active={false}
          />
          <StatTabCard
            icon={<GitBranch className="h-5 w-5" />}
            label="Correlations Mapped"
            count={stats.totalMapped}
            subLabel={`H: ${stats.high} | M: ${stats.med} | L: ${stats.low}`}
            active={false}
          />
          <StatTabCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Mapping Status"
            count={isApproved ? "Approved" : "Draft"}
            subLabel={state.isActive ? "Active Version" : "Historical Version"}
            active={isApproved}
          />
        </div>
      )}

      {/* Mapping Matrix Container */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Matrix Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              CO-PO Correlation Matrix
            </h3>
            {state.versionNumber && (
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                v{state.versionNumber}
              </span>
            )}
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                isApproved
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {isApproved ? "Approved" : "Draft"}
            </span>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-500">Legend:</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">3</span>
              <span>High (3)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">2</span>
              <span>Medium (2)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">1</span>
              <span>Low (1)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">-</span>
              <span>No Map</span>
            </span>
          </div>
        </div>

        {/* Matrix Loading / Empty / Content */}
        {state.generatingCopo ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <RotateCw className="h-10 w-10 text-indigo-600 mb-3 animate-spin dark:text-indigo-400" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              NEURO AI Mapping Generation in Progress
            </h4>
            <p className="mt-1 text-sm text-slate-500 max-w-md">
              Evaluating parent Course Outcomes against 12 Program Outcomes with Bloom's taxonomy & generating rigorous academic justifications...
            </p>
          </div>
        ) : state.versions.length === 0 && !state.loading ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <Sparkles className="h-12 w-12 text-indigo-500 mb-4 animate-pulse" />
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No CO-PO Mapping Generated Yet
            </h4>
            <p className="mt-2 text-sm text-slate-500 max-w-sm">
              Generate your first AI-assisted CO-PO correlation matrix using approved Course Outcomes.
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={state.generatingCopo || state.availableExtractions.length === 0}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>Generate CO-PO Mapping</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="sticky left-0 z-20 min-w-[220px] max-w-[280px] bg-slate-50/95 p-3.5 font-bold text-slate-700 backdrop-blur dark:bg-slate-800/95 dark:text-slate-200">
                    Course Outcome
                  </th>
                  {state.programOutcomes.map((po) => (
                    <th
                      key={po.code}
                      className="min-w-[56px] p-2 text-center font-bold text-slate-700 dark:text-slate-200"
                      title={`${po.code}: ${po.title}\n${po.description}`}
                    >
                      <div className="flex flex-col items-center cursor-help">
                        <span className="font-extrabold">{po.code}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCOs.map((co, rIdx) => (
                  <tr
                    key={co.co_code}
                    className="hover:bg-slate-50/50 transition-colors dark:hover:bg-slate-800/40"
                  >
                    {/* Row Header: CO Code + Bloom + Description */}
                    <td className="sticky left-0 z-10 bg-white/95 p-3 font-medium text-slate-800 backdrop-blur dark:bg-slate-900/95 dark:text-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {co.co_code}
                        </span>
                        {co.bloom_level && (
                          <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                            {co.bloom_level}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 leading-relaxed" title={co.description}>
                        {co.description}
                      </p>
                    </td>

                    {/* Correlation Cells */}
                    {state.programOutcomes.map((po, poIdx) => {
                      const cell = state.matrix[co.co_code]?.[po.code] || {
                        correlation_level: 0,
                        strength_label: "- No Mapping",
                        is_ai_suggested: false,
                        justification: "",
                        status: "draft",
                        mapping_id: null,
                      };
                      const score = cell.correlation_level || 0;

                      return (
                        <td key={po.code} className="p-1 text-center relative group">
                          <div className="flex items-center justify-center">
                            {/* Interactive Button */}
                            <button
                              type="button"
                              onClick={() => handleCellCycle(co, po)}
                              className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
                              title={`Click to cycle correlation (${co.co_code} × ${po.code})`}
                            >
                              {score === 3 && (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-900">
                                  3
                                </span>
                              )}
                              {score === 2 && (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm ring-2 ring-blue-200 dark:ring-blue-900">
                                  2
                                </span>
                              )}
                              {score === 1 && (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white shadow-sm ring-2 ring-amber-200 dark:ring-amber-900">
                                  1
                                </span>
                              )}
                              {score === 0 && (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500">
                                  -
                                </span>
                              )}

                              {cell.is_ai_suggested && score > 0 && (
                                <span
                                  className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900"
                                  title="NEURO AI Suggested"
                                />
                              )}
                            </button>

                            {/* Small pencil icon on hover to open detail modal */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenCellModal(co, po);
                              }}
                              className="absolute top-1 right-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded bg-slate-200/80 text-slate-600 hover:bg-indigo-600 hover:text-white dark:bg-slate-700 dark:text-slate-300"
                              title="Edit academic rationale"
                            >
                              <Edit3 className="h-2.5 w-2.5" />
                            </button>
                          </div>

                          {/* Hover Card for Rationale */}
                          <div
                            className={`pointer-events-none absolute z-50 hidden w-80 rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-2xl group-hover:block dark:border-slate-700 dark:bg-slate-900 ${
                              rIdx < 2 ? "top-full mt-2" : "bottom-full mb-2"
                            } ${poIdx >= state.programOutcomes.length - 2 ? "right-0" : poIdx === 0 ? "left-0" : "left-1/2 -translate-x-1/2"}`}
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                  {co.co_code} × {po.code}
                                </span>
                                {co.bloom_level && (
                                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                                    {co.bloom_level}
                                  </span>
                                )}
                              </div>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  score === 3
                                    ? "bg-emerald-100 text-emerald-800"
                                    : score === 2
                                    ? "bg-blue-100 text-blue-800"
                                    : score === 1
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {cell.strength_label}
                              </span>
                            </div>

                            <div className="mt-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Target Outcome ({po.code})
                              </p>
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                                {po.title || po.code}
                              </p>
                              {po.description && (
                                <p className="mt-0.5 text-[10px] text-slate-500 line-clamp-2">
                                  {po.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-800/60">
                              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                <Sparkles className="h-3 w-3" /> Academic Rationale
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300 break-words whitespace-normal">
                                {cell.justification || "No justification entered. Click cell to cycle strength or edit icon to enter rationale."}
                              </p>
                            </div>

                            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5 text-[10px] text-slate-400 dark:border-slate-800">
                              <span>Click cell: 0 → 1 → 2 → 3</span>
                              {cell.is_ai_suggested && (
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">NEURO AI</span>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Average Row */}
                <tr className="border-t-2 border-slate-300 bg-slate-50/95 font-bold dark:border-slate-700 dark:bg-slate-800/90">
                  <td className="sticky left-0 z-20 bg-slate-100/95 p-3 text-xs font-bold text-slate-800 backdrop-blur dark:bg-slate-850 dark:text-slate-100">
                    <div className="flex items-center justify-between">
                      <span>AVERAGE CORRELATION</span>
                      <span className="text-[10px] text-slate-400 font-normal">OBE Score</span>
                    </div>
                  </td>
                  {state.programOutcomes.map((po) => {
                    const avg = state.poAverages[po.code] || 0.0;
                    return (
                      <td key={po.code} className="p-2 text-center text-xs">
                        <span
                          className={`inline-block font-extrabold ${
                            avg >= 2.5
                              ? "text-emerald-700 dark:text-emerald-400"
                              : avg >= 1.5
                              ? "text-blue-700 dark:text-blue-400"
                              : avg > 0
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-400 dark:text-slate-500"
                          }`}
                        >
                          {avg.toFixed(2)}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unmapped Outcomes Justification Section */}
      {unmappedPOs.length > 0 && state.versionNumber && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/40 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Unmapped Program Outcomes ({unmappedPOs.length})
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  For NBA/OBE compliance, specify why certain Program Outcomes or PSOs are not addressed by this course.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setState({ showUnmappedPanel: !state.showUnmappedPanel })}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 dark:text-amber-400 flex items-center gap-1"
            >
              <span>{state.showUnmappedPanel ? "Hide Justifications" : "Review Justifications"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${state.showUnmappedPanel ? "rotate-180" : ""}`} />
            </button>
          </div>

          {state.showUnmappedPanel && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {unmappedPOs.map((po) => (
                <div
                  key={po.code}
                  className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {po.code}: {po.title}
                    </span>
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      Unmapped
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={state.unmappedJustifications[po.code] || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setState({
                        unmappedJustifications: {
                          ...state.unmappedJustifications,
                          [po.code]: val,
                        },
                      });
                    }}
                    placeholder={`Provide academic rationale why ${po.code} is not directly mapped...`}
                    className="mt-2 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating Action Bar */}
      {state.versionNumber && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur shadow-lg dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                }`}
              >
                {isApproved ? "Approved" : "Draft"}
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-500">
                Version {state.versionNumber} (Syllabus v{state.parentExtractionVersion || "—"})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={state.savingDraft}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Save className="h-4 w-4" />
                <span>{state.savingDraft ? "Saving Draft..." : "Save Draft"}</span>
              </button>

              {isApproved ? (
                <>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={state.approvingMap}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 shadow-sm hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                  >
                    <RotateCw className="h-4 w-4" />
                    <span>Revert to Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cid = course_id || state.selectedCourse?.value;
                      router.push(cid ? `/neurobe/pedagogy?course_id=${cid}` : "/neurobe/pedagogy");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700"
                  >
                    <span>Next: Pedagogy</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={state.approvingMap}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  <span>{state.approvingMap ? "Approving..." : "Approve CO-PO Mapping"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detail Justification Modal */}
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
          loading={state.updatingCell}
          onUpdate={handleUpdateFromModal}
        />
      )}
    </div>
  );
};

export default PrivateRouter(COPOMapping);
