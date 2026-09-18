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
    const ver = wfItem?.active_version || 1;
    const totalVers = wfItem?.total_versions || 1;
    // Derive real available versions: strictly what backend reports or 1..totalVers, never synthesize beyond totalVers
    const availableVersions: number[] =
      wfItem?.available_versions && wfItem.available_versions.length > 0
        ? wfItem.available_versions
        : totalVers > 1
        ? Array.from({ length: totalVers }, (_, i) => i + 1)
        : [ver];
    return { status, ver, totalVers, availableVersions, canGenerate: wfItem?.can_generate ?? true };
  };

  const sSyllabus = getStageInfo("extraction", workflowStatus?.step_1_syllabus_extraction, data?.academic_preparation?.syllabus?.state);
  const sCopo = getStageInfo("copo", workflowStatus?.step_2_copo_mapping, data?.academic_preparation?.copo_mapping?.state);
  const sTopics = getStageInfo("hierarchy", workflowStatus?.step_3_topic_hierarchy, data?.academic_preparation?.topics?.state);
  const sPedagogy = getStageInfo("pedagogy", workflowStatus?.step_4_pedagogy_generation, data?.academic_preparation?.pedagogy?.state);
  const sLesson = getStageInfo("schedule", workflowStatus?.step_5_lesson_plan_schedules, data?.academic_preparation?.lesson_plan?.state);

  const preparations = [
    {
      label: "SYLLABUS",
      stageKey: "extraction",
      status: sSyllabus.status,
      version: sSyllabus.ver,
      totalVersions: sSyllabus.totalVers,
      availableVersions: sSyllabus.availableVersions,
      extra: syllabusFiles && syllabusFiles.length > 0 ? `${syllabusFiles.length} file${syllabusFiles.length > 1 ? "s" : ""}` : undefined,
      route: `/neurobe/syllabus?course_id=${targetCourseId}`,
      artifactsTab: "syllabus",
    },
    {
      label: "CO-PO MAPPING",
      stageKey: "copo",
      status: sCopo.status,
      version: sCopo.ver,
      totalVersions: sCopo.totalVers,
      availableVersions: sCopo.availableVersions,
      route: `/neurobe/co-po-mapping?course_id=${targetCourseId}`,
      artifactsTab: "copo",
    },
    {
      label: "TOPICS",
      stageKey: "hierarchy",
      status: sTopics.status,
      version: sTopics.ver,
      totalVersions: sTopics.totalVers,
      availableVersions: sTopics.availableVersions,
      route: `/neurobe/topics?course_id=${targetCourseId}`,
      artifactsTab: "topics",
    },
    {
      label: "PEDAGOGY",
      stageKey: "pedagogy",
      status: sPedagogy.status,
      version: sPedagogy.ver,
      totalVersions: sPedagogy.totalVers,
      availableVersions: sPedagogy.availableVersions,
      route: `/neurobe/pedagogy?course_id=${targetCourseId}`,
      artifactsTab: "pedagogy",
    },
    {
      label: "LESSON PLAN",
      stageKey: "schedule",
      status: sLesson.status,
      version: sLesson.ver,
      totalVersions: sLesson.totalVers,
      availableVersions: sLesson.availableVersions,
      route: `/neurobe/lesson-plan?course_id=${targetCourseId}`,
      artifactsTab: "lesson-plan",
    },
    {
      label: "LEARNING MATERIALS",
      stageKey: "learning-materials",
      status: data?.academic_preparation?.learning_materials?.state || "not_started",
      route: `/neurobe/learning-materials?course_id=${targetCourseId}`,
      artifactsTab: "learning-materials",
    },
    {
      label: "QUESTION BANK",
      stageKey: "question-bank",
      status: data?.academic_preparation?.question_bank?.state || "not_started",
      extra: data?.academic_preparation?.question_bank?.count !== undefined ? `${data?.academic_preparation?.question_bank?.count} Questions` : undefined,
      route: `/neurobe/question-bank?course_id=${targetCourseId}`,
      artifactsTab: "question-bank",
    },
    {
      label: "CIA QUESTION PAPER",
      stageKey: "cia-papers",
      status: data?.academic_preparation?.cia_question_paper?.state || "not_started",
      route: `/neurobe/cia-question-paper?course_id=${targetCourseId}`,
      artifactsTab: "cia-papers",
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
    if (item.stageKey === "extraction") {
      router.push(`/neurobe/syllabus?course_id=${targetCourseId}`);
    } else {
      router.push(`/neurobe/course-artifacts?code=${courseCode}&course_id=${targetCourseId}&stage=${item.stageKey}`);
    }
  };

  // Version activation directly from card
  const handleToggleVersion = async (stageKey: string, newVer: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setActionLoading(stageKey);
      await Models.syllabus.activate_version(targetCourseId, stageKey, newVer);
      Success(`Activated Version ${newVer} for ${stageKey.toUpperCase()}`);
      await refetch();
      setActiveMenu(null);
    } catch (err: any) {
      console.error("Failed to activate version:", err);
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

            return (
              <div
                key={item.label}
                onClick={() => handleOpenSection(item)}
                className={`group relative flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 transition-all duration-150 hover:border-indigo-400 hover:shadow-sm ${cfg.cell}`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                    {item.label}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold text-[#000] dark:text-gray-200">
                      {cfg.label}
                      {item.extra && <span className="ml-1 text-xs text-slate-500">{item.extra}</span>}
                    </span>

                    {/* Version Selector Pill right on the card */}
                    {item.stageKey === "extraction" ? (
                      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                        {(!syllabusFiles || syllabusFiles.length === 0) ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/neurobe/syllabus?course_id=${targetCourseId}`);
                            }}
                            className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-indigo-400 bg-indigo-50/60 px-1.5 py-0.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-100 hover:border-indigo-500 dark:border-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                            title="Upload Syllabus PDF"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            <span>Upload</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenu(isMenuOpen ? null : item.stageKey);
                              }}
                              className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-slate-700 dark:text-slate-300"
                              title="Click to view file versions"
                            >
                              <span>v{sSyllabus.ver || syllabusFiles[syllabusFiles.length - 1]?.version_number || 1}</span>
                              <ChevronDown className="h-2.5 w-2.5 opacity-60" />
                            </button>

                            {/* Syllabus File Version Dropdown */}
                            {isMenuOpen && (
                              <div className="absolute left-0 top-full z-30 mt-1 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                                <div className="mb-1.5 flex items-center justify-between px-1 text-[10px] font-bold text-slate-400">
                                  <span>Syllabus Files ({syllabusFiles.length})</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/neurobe/syllabus?course_id=${targetCourseId}`);
                                    }}
                                    className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                  >
                                    + Upload New
                                  </button>
                                </div>
                                <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                                  {syllabusFiles.map((fv) => (
                                    <div
                                      key={fv.id}
                                      className="flex items-center justify-between rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/60"
                                    >
                                      <div className="min-w-0 flex-1 pr-1.5">
                                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                                          <span className="mr-1 rounded bg-indigo-100 px-1 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                                            v{fv.version_number}
                                          </span>
                                          {fv.original_filename}
                                        </p>
                                        <p className="text-[9px] text-slate-400">
                                          {fv.uploaded_by}
                                        </p>
                                      </div>
                                      <button
                                        type="button"
                                        disabled={actionLoading === "extraction"}
                                        onClick={(e) => handleExtractFromFile(fv.id, fv.version_number, e)}
                                        className="flex shrink-0 items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                                        title={`Extract from v${fv.version_number}`}
                                      >
                                        <Sparkles className="h-2.5 w-2.5" />
                                        <span>Extract</span>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ) : item.version ? (
                      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
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
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Status Icon & Quick Actions */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isLoading ? (
                    <RotateCw className="h-4 w-4 animate-spin text-indigo-500" />
                  ) : (
                    <>
                      {/* Quick Regenerate button on supported AI stages */}
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
        onClick={() => router.push(`/neurobe/course-artifacts?code=${courseCode}&course_id=${targetCourseId}`)}
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
            router.push(`/neurobe/ins-course-artifacts?course_id=${targetCourseId}`)
          }
          className="rounded-xl border border-purple-600 bg-white px-4 py-2 text-xs font-bold text-purple-700 shadow-sm transition-all hover:bg-purple-50 active:scale-95 dark:bg-gray-800 dark:text-purple-300 dark:hover:bg-purple-900/30"
        >
          View as Course Instructor →
        </button>
      </div>
    </div>
  );
}
