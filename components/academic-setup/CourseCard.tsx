import React, { useState } from "react";
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  TrendingUp,
  TriangleAlert,
  RotateCw,
  Sparkles,
  Layers,
  ChevronDown,
  Plus,
  Lock,
} from "lucide-react";
import { useRouter } from "next/router";
import { useCourseWorkflowStatus, StageWorkflowData } from "@/hook/useCourseWorkflowStatus";
import Models from "@/imports/models.import";
import { Success, Failure } from "@/utils/function.utils";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; cell: string }> = {
  not_started: {
    label: "Not started",
    icon: null,
    cell: "border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
  },
  approved: {
    label: "Approved",
    icon: <CheckCircle className="h-4 w-4 text-emerald-500" />,
    cell: "bg-emerald-50/60 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800",
  },
  review: {
    label: "Review",
    icon: <TriangleAlert className="h-4 w-4 text-amber-500" />,
    cell: "bg-amber-50/60 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800",
  },
  draft: {
    label: "Draft",
    icon: <Clock className="h-4 w-4 text-slate-700 dark:text-slate-300" />,
    cell: "bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800",
  },
  generating: {
    label: "Generating...",
    icon: <RotateCw className="h-4 w-4 text-amber-500 animate-spin" />,
    cell: "bg-amber-50/60 border border-amber-300 dark:bg-amber-950/30",
  },
  redis_queued: {
    label: "Queued",
    icon: <Clock className="h-4 w-4 text-sky-500 animate-pulse" />,
    cell: "bg-sky-50/60 border border-sky-300 dark:bg-sky-950/30",
  },
  // Error / terminal states
  failed: {
    label: "Failed",
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    cell: "bg-red-50/60 border border-red-200 dark:bg-red-950/20 dark:border-red-800",
  },
  cancelled_by_user: {
    label: "Cancelled",
    icon: <AlertCircle className="h-4 w-4 text-slate-400" />,
    cell: "bg-slate-50 border border-slate-200 dark:bg-slate-900/20 dark:border-slate-700",
  },
  cancelled_by_server: {
    label: "Cancelled",
    icon: <AlertCircle className="h-4 w-4 text-slate-400" />,
    cell: "bg-slate-50 border border-slate-200 dark:bg-slate-900/20 dark:border-slate-700",
  },
};

export default function CourseCard(props: any) {
  const router = useRouter();
  const {
    isNew,
    code,
    credits,
    role,
    title,
    readiness,
    programme,
    batch,
    term,
    students,
    nextAction,
    instructors,
    actionLabel,
    onAction,
    onInstructorAction,
    onCoordinatorAction,
    data,
  } = props;

  const targetCourseId = data?.id || data?.course_id || code;
  const courseCode = data?.course_code || code || "";

  // Live master workflow status polling
  const { workflowStatus, syllabusFiles, refetch } = useCourseWorkflowStatus(targetCourseId);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [optimisticVersions, setOptimisticVersions] = useState<Record<string, number>>({});

  const getRolesList = (roleData: any): string[] => {
    if (!roleData) return [];
    if (Array.isArray(roleData)) return roleData.map((r) => String(r));
    return [String(roleData)];
  };

  const rawRole = data?.role || role || data?.role_badge;
  const rolesList = getRolesList(rawRole);

  const hasInstructorRole = rolesList.some((r) => {
    const normalized = r.toLowerCase().replace(/[\s_]+/g, "");
    return normalized.includes("instructor");
  });

  // Calculate live readiness percentage based on workflowStatus or data
  const calculateReadiness = () => {
    if (!workflowStatus) return data?.readiness_percentage ?? 0;
    const stages = Object.values(workflowStatus) as StageWorkflowData[];
    let points = 0;
    stages.forEach((st) => {
      if (st?.status === "approved") points += 20;
      else if (st?.status === "draft") points += 10;
    });
    return Math.min(points, 100);
  };

  const readinessPct = calculateReadiness();

  // Compute live stage state from workflowStatus if available, otherwise fallback to data
  const getStageInfo = (
    stageKey: string,
    wfItem?: StageWorkflowData,
    fallbackState?: string
  ) => {
    const status = wfItem?.status || fallbackState || "not_started";
    const hasVersions =
      (wfItem?.total_versions !== undefined && wfItem.total_versions > 0) ||
      (wfItem?.available_versions && wfItem.available_versions.length > 0) ||
      (wfItem?.active_version !== undefined && wfItem.active_version > 0 && status !== "not_started");
    const ver = hasVersions ? (wfItem?.active_version || 1) : null;
    const totalVers = hasVersions ? (wfItem?.total_versions || wfItem?.available_versions?.length || 1) : 0;
    // Derive real available versions: strictly what backend reports or 1..totalVers, never synthesize beyond totalVers
    const availableVersions: number[] =
      hasVersions
        ? (wfItem?.available_versions && wfItem.available_versions.length > 0
          ? wfItem.available_versions
          : totalVers > 1
          ? Array.from({ length: totalVers }, (_, i) => i + 1)
          : (ver ? [ver] : []))
        : [];
    return { status, ver, totalVers, availableVersions, canGenerate: wfItem?.can_generate ?? true, hasVersions };
  };

  const sSyllabus = getStageInfo("extraction", workflowStatus?.step_1_syllabus_extraction, data?.academic_preparation?.syllabus?.state);
  const sCopo = getStageInfo("copo", workflowStatus?.step_2_copo_mapping, data?.academic_preparation?.copo_mapping?.state);

  const activeExtractionVer =
    optimisticVersions.extraction ||
    syllabusFiles?.find((f: any) => f.is_active)?.version_number ||
    sSyllabus.ver ||
    (syllabusFiles && syllabusFiles.length > 0 ? syllabusFiles[syllabusFiles.length - 1]?.version_number : 1);

  // Filter CO-PO versions to only children of the currently active extraction version
  const copoDetailed = (workflowStatus?.step_2_copo_mapping as any)?.versions_detailed;
  let copoStatus = sCopo.status;
  let copoVer = optimisticVersions.copo || sCopo.ver;
  let copoTotalVers = sCopo.totalVers;
  let copoAvailableVersions = sCopo.availableVersions;

  if (Array.isArray(copoDetailed)) {
    const matchingChildCopo = copoDetailed.filter(
      (v: any) => (v.extraction_version_used ?? v.parent_version ?? 1) === activeExtractionVer
    );
    if (matchingChildCopo.length === 0) {
      copoStatus = "not_started";
      copoVer = undefined;
      copoTotalVers = 0;
      copoAvailableVersions = [];
    } else {
      const activeMatch =
        matchingChildCopo.find((v: any) => v.is_active) || matchingChildCopo[matchingChildCopo.length - 1];
      copoVer = optimisticVersions.copo || activeMatch.version;
      copoStatus = activeMatch.status === "approved" ? "approved" : "draft";
      copoTotalVers = matchingChildCopo.length;
      copoAvailableVersions = matchingChildCopo.map((v: any) => v.version);
    }
  }

  const sTopics = getStageInfo("hierarchy", workflowStatus?.step_3_topic_hierarchy, data?.academic_preparation?.topics?.state);
  const sPedagogy = getStageInfo("pedagogy", workflowStatus?.step_4_pedagogy_generation, data?.academic_preparation?.pedagogy?.state);
  const sLesson = getStageInfo("schedule", workflowStatus?.step_5_lesson_plan_schedules, data?.academic_preparation?.lesson_plan?.state);

  // Approval status indicators for topological gating
  const isSyllabusApproved = sSyllabus.status === "approved";
  const isTopicsApproved = sTopics.status === "approved";
  const isPedagogyApproved = sPedagogy.status === "approved";
  const isLessonApproved = sLesson.status === "approved";

  const preparations = [
    {
      label: "SYLLABUS",
      stageKey: "extraction",
      status: sSyllabus.status,
      version: optimisticVersions.extraction || sSyllabus.ver,
      totalVersions: sSyllabus.totalVers,
      availableVersions: sSyllabus.availableVersions,
      extra: syllabusFiles && syllabusFiles.length > 0 ? `${syllabusFiles.length} file${syllabusFiles.length > 1 ? "s" : ""}` : undefined,
      route: `/neurobe/syllabus?course_id=${targetCourseId}`,
      artifactsTab: "syllabus",
      isUnlocked: true,
      unlockMessage: "",
    },
    {
      label: "CO-PO MAPPING",
      stageKey: "copo",
      status: copoStatus,
      version: copoVer,
      totalVersions: copoTotalVers,
      availableVersions: copoAvailableVersions,
      route: `/neurobe/co-po-mapping?course_id=${targetCourseId}`,
      artifactsTab: "copo",
      isUnlocked: isSyllabusApproved,
      unlockMessage: "Requires Syllabus Extraction to be approved first.",
    },
    {
      label: "TOPICS",
      stageKey: "hierarchy",
      status: sTopics.status,
      version: optimisticVersions.hierarchy || sTopics.ver,
      totalVersions: sTopics.totalVers,
      availableVersions: sTopics.availableVersions,
      route: `/neurobe/topics?course_id=${targetCourseId}`,
      artifactsTab: "topics",
      isUnlocked: isSyllabusApproved,
      unlockMessage: "Requires Syllabus Extraction to be approved first.",
    },
    {
      label: "PEDAGOGY",
      stageKey: "pedagogy",
      status: sPedagogy.status,
      version: optimisticVersions.pedagogy || sPedagogy.ver,
      totalVersions: sPedagogy.totalVers,
      availableVersions: sPedagogy.availableVersions,
      route: `/neurobe/pedagogy?course_id=${targetCourseId}`,
      artifactsTab: "pedagogy",
      isUnlocked: isTopicsApproved,
      unlockMessage: "Requires Topic Hierarchy to be approved first.",
    },
    {
      label: "LESSON PLAN",
      stageKey: "schedule",
      status: sLesson.status,
      version: optimisticVersions.schedule || sLesson.ver,
      totalVersions: sLesson.totalVers,
      availableVersions: sLesson.availableVersions,
      route: `/neurobe/lesson-plan?course_id=${targetCourseId}`,
      artifactsTab: "lesson-plan",
      isUnlocked: isPedagogyApproved,
      unlockMessage: "Requires Pedagogy Recommendations to be approved first.",
    },
    {
      label: "LEARNING MATERIALS",
      stageKey: "learning-materials",
      status: data?.academic_preparation?.learning_materials?.state || "not_started",
      route: `/neurobe/learning-materials?course_id=${targetCourseId}`,
      artifactsTab: "learning-materials",
      isUnlocked: isLessonApproved,
      unlockMessage: "Requires Lesson Plan to be approved first.",
    },
    {
      label: "QUESTION BANK",
      stageKey: "question-bank",
      status: data?.academic_preparation?.question_bank?.state || "not_started",
      extra: data?.academic_preparation?.question_bank?.count !== undefined ? `${data?.academic_preparation?.question_bank?.count} Questions` : undefined,
      route: `/neurobe/mcq-generation/bank?course_id=${targetCourseId}`,
      artifactsTab: "question-bank",
      isUnlocked: isTopicsApproved,
      unlockMessage: "Requires Topic Hierarchy to be approved first.",
    },
    {
      label: "CIA QUESTION PAPER",
      stageKey: "cia-papers",
      status: data?.academic_preparation?.cia_question_paper?.state || "not_started",
      route: `/neurobe/cia-question-paper?course_id=${targetCourseId}`,
      artifactsTab: "cia-papers",
      isUnlocked: isSyllabusApproved,
      unlockMessage: "Requires Syllabus Extraction to be approved first.",
    },
  ];

  // Dynamic Next Action computation
  const getComputedNextAction = () => {
    if (sSyllabus.status === "not_started") return "Upload Syllabus & Extract";
    if (sTopics.status === "not_started") return "Generate Topics Hierarchy";
    if (sCopo.status === "not_started") return "Generate CO-PO Mapping";
    if (sPedagogy.status === "not_started") return "Generate Pedagogy Suggestions";
    if (sLesson.status === "not_started") return "Generate Lesson Plan / Schedule";
    return data?.next_action || nextAction || "Review Course Curriculum";
  };

  const computedNextAction = getComputedNextAction();

  // Navigation when touching a section
  const handleOpenSection = (item: typeof preparations[0]) => {
    if (!item.isUnlocked) {
      Failure(item.unlockMessage || "This stage is locked.");
      return;
    }
    if (item.stageKey === "extraction") {
      router.push(`/neurobe/syllabus?course_id=${targetCourseId}`);
    } else if (item.stageKey === "copo") {
      router.push(`/neurobe/co-po-mapping?course_id=${targetCourseId}`);
    } else if (item.route) {
      router.push(item.route);
    } else {
      router.push(`/neurobe/course-artifacts?code=${courseCode}&course_id=${targetCourseId}&stage=${item.stageKey}`);
    }
  };

  // Version activation directly from card
  const handleToggleVersion = async (stageKey: string, newVer: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const stepKeyMap: Record<string, string> = {
      extraction: "step_1_syllabus_extraction",
      copo: "step_2_copo_mapping",
      hierarchy: "step_3_topic_hierarchy",
      pedagogy: "step_4_pedagogy_generation",
      schedule: "step_5_lesson_plan_schedules",
    };
    try {
      setActionLoading(stageKey);
      setOptimisticVersions((prev) => ({ ...prev, [stageKey]: newVer }));
      await Models.syllabus.activate_version(targetCourseId, stageKey, newVer);
      Success(`Activated Version ${newVer} for ${stageKey.toUpperCase()}`);
      await refetch();
      setActiveMenu(null);
    } catch (err: any) {
      console.error("Failed to activate version:", err);
      setOptimisticVersions((prev) => {
        const next = { ...prev };
        delete next[stageKey];
        return next;
      });
      Failure(typeof err === "string" ? err : err?.message || `Failed to activate Version ${newVer}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Syllabus file version activation
  const handleActivateSyllabusVersion = async (newVer: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading("extraction");
      setOptimisticVersions((prev) => ({ ...prev, extraction: newVer }));
      try {
        await (Models.syllabus as any).activateFileVersion(targetCourseId, newVer);
      } catch {
        await Models.syllabus.activate_version(targetCourseId, "extraction", newVer);
      }
      Success(`Activated Version ${newVer} for SYLLABUS`);
      await refetch();
      setActiveMenu(null);
    } catch (err: any) {
      console.error("Failed to activate syllabus version:", err);
      setOptimisticVersions((prev) => {
        const next = { ...prev };
        delete next.extraction;
        return next;
      });
      Failure(typeof err === "string" ? err : err?.message || `Failed to activate Version ${newVer}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Extract from specific syllabus file version directly from card
  const handleExtractFromFile = async (fileVersionId: number, versionNum: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading("extraction");
      await Models.syllabus.extractFromFileVersion(targetCourseId, fileVersionId);
      Success(`Started extraction from syllabus v${versionNum}`);
      setActiveMenu(null);
      await refetch();
      router.push(`/neurobe/syllabus?course_id=${targetCourseId}`);
    } catch (err: any) {
      Failure(typeof err === "string" ? err : err?.message || "Failed to start extraction");
    } finally {
      setActionLoading(null);
    }
  };

  // Quick Regeneration handler directly from card
  const handleRegenerate = async (stageKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading(stageKey);
      if (stageKey === "hierarchy") {
        await Models.topics.generate_hierarchy(targetCourseId);
      } else if (stageKey === "copo") {
        await Models.copo_map.generate_copo(targetCourseId);
      } else if (stageKey === "pedagogy") {
        await Models.pedagogy.generate_pedagogies(targetCourseId);
      } else if (stageKey === "schedule") {
        await Models.lession_plan.generate_timeline(targetCourseId);
      }
      await refetch();
    } catch (err) {
      console.error(`Failed to regenerate ${stageKey}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
      {/* 1. Header Badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {data?.is_new || isNew ? (
            <span className="rounded-md bg-[#F3F4F6] px-2.5 py-0.5 text-md font-bold text-primary">
              NEW
            </span>
          ) : (
            <span className="rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-[#000] dark:bg-gray-700 dark:text-gray-200">
              {courseCode}
            </span>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {data?.formatted_credits || credits || ""}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {rolesList.length > 0 ? (
            rolesList.map((r, idx) => (
              <span
                key={idx}
                className="rounded-full border border-purple-300 bg-purple-50 px-3 py-0.5 text-xs font-semibold text-purple-700 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
              >
                {r}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-purple-300 px-3 py-1 text-xs font-medium text-purple-700">
              {data?.role_badge || "—"}
            </span>
          )}
        </div>
      </div>

      {/* 2. Course Title & Readiness */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-[#000] dark:text-white truncate">
          {data?.course_title || title}
        </h3>
        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          <TrendingUp className="h-4 w-4" /> {readinessPct}% Ready
        </span>
      </div>

      {/* 3. Academic Metadata Grid */}
      <div className="grid grid-cols-4 gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
        {[
          { label: "PROGRAMME", value: data?.programme || programme || "—" },
          { label: "BATCH", value: data?.batch_name || batch || "—" },
          { label: "TERM", value: data?.term || term || "—" },
          {
            label: "STUDENTS",
            value: data?.students_count !== undefined ? `${data.students_count} Students` : students ? `${students} Students` : "—",
          },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {m.label}
            </p>
            <p className="text-xs font-bold text-[#000] dark:text-gray-200 truncate">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {/* 4. Academic Preparation Progress (2-Column Grid) */}
      <div>
        <div className="mb-2 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
          <p className="text-sm font-bold text-[#000] dark:text-gray-200">
            Academic Preparation Progress
          </p>
          <span className="text-[11px] text-slate-400">Click section to open & toggle version</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {preparations.map((item) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.not_started;
            const isMenuOpen = activeMenu === item.stageKey;
            const isLoading = actionLoading === item.stageKey;
            const isUnlocked = item.isUnlocked;

            return (
              <div
                key={item.label}
                onClick={() => handleOpenSection(item)}
                className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-150 ${
                  isUnlocked
                    ? `cursor-pointer hover:border-indigo-400 hover:shadow-sm ${cfg.cell}`
                    : "cursor-not-allowed opacity-60 border border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-800/40"
                }`}
                title={!isUnlocked ? item.unlockMessage : undefined}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 truncate">
                      {item.label}
                    </p>
                    {!isUnlocked && <Lock className="h-3 w-3 text-slate-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-[#000] dark:text-gray-200">
                      {!isUnlocked ? "Locked" : cfg.label}
                      {isUnlocked && item.extra && <span className="ml-1 text-xs text-slate-500">{item.extra}</span>}
                    </span>

                    {/* Version Selector Pill right on the card */}
                    {item.stageKey === "extraction" ? (
                      <div className="relative inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {(!syllabusFiles || syllabusFiles.length === 0) ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/neurobe/syllabus?course_id=${targetCourseId}&step=1`);
                            }}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-indigo-400 bg-indigo-50/70 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-500 active:scale-95 transition-all dark:border-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                            title="Add Syllabus"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <>
                            {/* Version Dropdown */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(isMenuOpen ? null : item.stageKey);
                              }}
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all dark:bg-slate-700 dark:text-slate-300"
                              title="Click to toggle version"
                            >
                              <span>
                                v{syllabusFiles.find((f: any) => f.is_active)?.version_number || sSyllabus.ver || syllabusFiles[syllabusFiles.length - 1]?.version_number || 1}
                              </span>
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </button>

                            {/* Plus Button to add another version */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/neurobe/syllabus?course_id=${targetCourseId}&step=1`);
                              }}
                              className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-dashed border-indigo-400 bg-indigo-50/70 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-500 active:scale-95 transition-all dark:border-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                              title="Upload New Version"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>

                            {/* Syllabus File Version Dropdown Menu */}
                            {isMenuOpen && (
                              <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                                <div className="mb-1 px-2 py-1 text-[10px] font-bold text-slate-400">
                                  Select Active Version
                                </div>
                                <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                                  {syllabusFiles.map((fv: any) => {
                                    const currentActiveVer = syllabusFiles.find((f: any) => f.is_active)?.version_number || sSyllabus.ver || syllabusFiles[syllabusFiles.length - 1]?.version_number || 1;
                                    const isCurrent = fv.version_number === currentActiveVer;
                                    return (
                                      <button
                                        key={fv.id || fv.version_number}
                                        type="button"
                                        disabled={actionLoading === "extraction"}
                                        onClick={(e) => handleActivateSyllabusVersion(fv.version_number, e)}
                                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-all ${
                                          isCurrent
                                            ? "bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                                            : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                                        }`}
                                      >
                                        <div className="min-w-0 pr-1">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-bold">v{fv.version_number}</span>
                                            {isCurrent && (
                                              <span className="rounded bg-indigo-100 px-1 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                                                Active
                                              </span>
                                            )}
                                          </div>
                                          {fv.original_filename && (
                                            <span className="block truncate text-[10px] text-slate-400">
                                              {fv.original_filename}
                                            </span>
                                          )}
                                        </div>
                                        {isCurrent && <CheckCircle className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : (!item.version || item.status === "not_started") ? (
                      isUnlocked ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSection(item);
                          }}
                          className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-indigo-400 bg-indigo-50/60 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 hover:border-indigo-500 dark:border-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                          title={`Create ${item.label}`}
                        >
                          <Plus className="h-2.5 w-2.5" />
                          <span>Add</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-400">
                          <Lock className="h-2.5 w-2.5" />
                          <span>Locked</span>
                        </span>
                      )
                    ) : (
                      <div className="relative inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {item.availableVersions && item.availableVersions.length > 1 ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(isMenuOpen ? null : item.stageKey);
                              }}
                              className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-slate-700 dark:text-slate-300"
                              title="Click to switch version"
                            >
                              <span>v{item.version}</span>
                              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                            </button>

                            {/* Version Dropdown Menu */}
                            {isMenuOpen && (
                              <div className="absolute left-0 top-full z-20 mt-1 w-28 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                                <div className="px-2 py-1 text-[9px] font-semibold text-slate-400">
                                  Switch Version
                                </div>
                                {item.availableVersions.map((v: number) => (
                                  <button
                                    key={v}
                                    type="button"
                                    onClick={(e) => handleToggleVersion(item.stageKey, v, e)}
                                    className={`flex w-full items-center justify-between rounded px-2 py-1 text-xs ${
                                      v === item.version
                                        ? "bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                                    }`}
                                  >
                                    <span>Version {v}</span>
                                    {v === item.version && <CheckCircle className="h-3 w-3 text-indigo-600" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            v{item.version}
                          </span>
                        )}

                        {/* Plus button for all AI stages when unlocked */}
                        {["copo", "hierarchy", "pedagogy", "schedule"].includes(item.stageKey) && isUnlocked && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenSection(item);
                            }}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-md border border-dashed border-indigo-400 bg-indigo-50/70 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-500 active:scale-95 transition-all dark:border-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                            title={`Add / Generate New ${item.label} Version`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Icon & Quick Actions */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isLoading ? (
                    <RotateCw className="h-4 w-4 animate-spin text-indigo-500" />
                  ) : !isUnlocked ? (
                    <Lock className="h-4 w-4 text-slate-400" />
                  ) : (
                    <>
                      {/* Quick Regenerate button on supported AI stages — visible on hover;
                   also shown on failed/cancelled so users can retry inline */}
                      {["hierarchy", "copo", "pedagogy", "schedule"].includes(item.stageKey) &&
                        item.status !== "not_started" && (
                          <button
                            type="button"
                            title={`Regenerate ${item.label}`}
                            onClick={(e) => handleRegenerate(item.stageKey, e)}
                            className="opacity-0 group-hover:opacity-100 rounded p-1 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all dark:hover:bg-slate-700"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        )}
                      {cfg.icon}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Next Action Banner */}
      <div
        onClick={() => {
          if (computedNextAction.toLowerCase().includes("syllabus")) {
            router.push(`/neurobe/syllabus?course_id=${targetCourseId}`);
          } else {
            router.push(`/neurobe/course-artifacts?code=${courseCode}&course_id=${targetCourseId}`);
          }
        }}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-amber-800 transition-all hover:bg-amber-100/70 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300"
      >
        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="truncate">
          <span className="font-semibold">Next Action:</span> {computedNextAction}
        </span>
      </div>

      {/* 6. Footer & Primary Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
        <p className="text-xs text-gray-500 truncate max-w-[60%]">
          <span className="font-medium">Instructors: </span>
          {data?.instructors?.length > 0
            ? data.instructors.map((item: any) => `${item?.name || item?.first_name || ""} (${item?.role || "Instructor"})`).join(", ")
            : instructors || "—"}
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(`/neurobe/ins-course-artifacts?course_id=${targetCourseId}&from=my-courses`)
          }
          className="rounded-xl border border-purple-600 bg-white px-4 py-2 text-xs font-bold text-purple-700 shadow-sm transition-all hover:bg-purple-50 active:scale-95 dark:bg-gray-800 dark:text-purple-300 dark:hover:bg-purple-900/30"
        >
          View as Course Instructor →
        </button>
      </div>
    </div>
  );
}
