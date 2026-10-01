import React from "react";
import {
  GraduationCap,
  Calendar,
  Layers,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  CourseWorkflow,
  StageStatus,
  useCourseWorkflowStatus,
} from "@/hook/useCourseWorkflowStatus";

export const STAGE_STATUS_CONFIG: Record<
  StageStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  not_started: {
    label: "Not Started",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
  redis_queued: {
    label: "Queued",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-600 dark:text-sky-400",
    dot: "bg-sky-500 animate-pulse",
  },
  generating: {
    label: "Generating...",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500 animate-spin",
  },
  draft: {
    label: "Draft",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-600 dark:text-indigo-400",
    dot: "bg-indigo-500",
  },
  approved: {
    label: "Approved",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  cancelled_by_user: {
    label: "Cancelled",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  cancelled_by_server: {
    label: "Halted",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  failed: {
    label: "Failed",
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export interface AssignedCourseCardProps {
  id?: number | string;
  courseId?: number | string;
  code?: string;
  courseCode?: string;
  title?: string;
  courseTitle?: string;
  programme: string;
  batch: string;
  semester: string | number;
  enrolledStudents?: number | string;
  allocation?: string;
  allocationTag?: string;
  credits?: number | string;
  formattedCredits?: string;
  workflowStatus?: CourseWorkflow | null;
  onOpenCourse?: () => void;
  onTriggerStage?: (stageKey: string, activeVersion: number) => void;
}

const AssignedCourseCard: React.FC<AssignedCourseCardProps> = ({
  id,
  courseId,
  code,
  courseCode,
  title,
  courseTitle,
  programme,
  batch,
  semester,
  enrolledStudents = 0,
  allocation,
  allocationTag,
  credits,
  formattedCredits,
  workflowStatus: incomingWorkflow,
  onOpenCourse,
  onTriggerStage,
}) => {
  const finalCode = courseCode || code || "";
  const finalTitle = courseTitle || title || "";
  const finalAllocation = allocationTag || allocation;
  const targetId = courseId || id || finalCode;

  // Use hook if external workflowStatus is not provided
  const { workflowStatus: fetchedWorkflow } = useCourseWorkflowStatus(
    incomingWorkflow ? null : targetId
  );
  const activeWorkflow = incomingWorkflow || fetchedWorkflow;

  const resolveStageData = (stItem: any) => {
    if (!stItem) return { status: "not_started" as StageStatus, active_version: null };
    const versions = stItem.versions || stItem.versions_detailed || [];
    // Prioritize is_active=true from versions list (source of truth) over the potentially stale active_version
    const activeVerObj = versions.find((v: any) => v.is_active);
    const activeVer = activeVerObj?.version_number ?? activeVerObj?.version ?? stItem.active_version;
    const currentVerObj = versions.find((v: any) => (v.version_number ?? v.version) === activeVer) || activeVerObj;
    const rawStatus = currentVerObj?.status || stItem.status || "not_started";
    const status = String(rawStatus).toLowerCase().trim() as StageStatus;
    return {
      ...stItem,
      status,
      active_version: activeVer,
    };
  };

  // Compute readiness points across the 4 core stages (Approved = 25% each, Draft = 12% each)
  const calculateProgress = () => {
    if (!activeWorkflow) return 0;
    const stages = [
      activeWorkflow.step_1_syllabus_extraction,
      activeWorkflow.step_2_copo_mapping,
      activeWorkflow.step_3_pedagogy_generation || activeWorkflow.step_4_pedagogy_generation,
      activeWorkflow.step_4_lesson_plan_schedules || activeWorkflow.step_5_lesson_plan_schedules,
    ].filter(Boolean);
    let points = 0;
    stages.forEach((st: any) => {
      const resolved = resolveStageData(st);
      if (resolved.status === "approved") points += 25;
      else if (resolved.status === "draft") points += 12;
    });
    return Math.min(points, 100);
  };

  const progressPct = calculateProgress();

  const stagesList = activeWorkflow
    ? [
        {
          key: "extraction",
          label: "Syllabus",
          data: resolveStageData(activeWorkflow.step_1_syllabus_extraction),
        },
        {
          key: "copo",
          label: "CO-PO",
          data: resolveStageData(activeWorkflow.step_2_copo_mapping),
        },
        {
          key: "pedagogy",
          label: "Pedagogy",
          data: resolveStageData(activeWorkflow.step_3_pedagogy_generation || activeWorkflow.step_4_pedagogy_generation),
        },
        {
          key: "schedule",
          label: "Schedule",
          data: resolveStageData(activeWorkflow.step_4_lesson_plan_schedules || activeWorkflow.step_5_lesson_plan_schedules),
        },
      ]
    : [
        { key: "extraction", label: "Syllabus", data: { status: "not_started" as StageStatus, active_version: null } },
        { key: "copo", label: "CO-PO", data: { status: "not_started" as StageStatus, active_version: null } },
        { key: "pedagogy", label: "Pedagogy", data: { status: "not_started" as StageStatus, active_version: null } },
        { key: "schedule", label: "Schedule", data: { status: "not_started" as StageStatus, active_version: null } },
      ];

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-indigo-800">
      <div>
        {/* 1. Header Badges & Role Allocation */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-indigo-600/10 px-3 py-1 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-400/10 dark:text-indigo-400">
              {finalCode}
            </span>
            {finalAllocation && (
              <span className="inline-flex items-center rounded-lg bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {finalAllocation}
              </span>
            )}
            {(formattedCredits || credits) && (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {formattedCredits || `${credits} Credits`}
              </span>
            )}
          </div>

          {/* Overall AI Readiness Badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>{progressPct}% Prepared</span>
          </div>
        </div>

        {/* 2. Course Title */}
        <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900 dark:text-white">
          {finalCode} — {finalTitle}
        </h3>

        {/* 3. Academic Metadata Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50/80 p-3 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate font-medium">{programme}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-medium">Batch {batch}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-medium">Sem {semester}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="font-medium">{enrolledStudents} Students</span>
          </div>
        </div>

        {/* 4. 4-Stage AI Intelligence Pipeline Stepper */}
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>AI Curriculum Pipeline</span>
            <span className="text-[10px] text-slate-400">4 Stages</span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {stagesList.map((item) => {
              const cfg =
                STAGE_STATUS_CONFIG[item.data?.status as StageStatus] ||
                STAGE_STATUS_CONFIG.not_started;
              const activeVer = item.data?.active_version;
              const hasActiveVer = typeof activeVer === "number" && activeVer > 0;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerStage?.(item.key, activeVer || 1);
                  }}
                  title={`${item.label}: ${cfg.label}${hasActiveVer ? ` (v${activeVer})` : ""}`}
                  className={`flex flex-col items-center justify-between rounded-lg p-1.5 text-center transition-all ${cfg.bg} hover:scale-105 active:scale-95`}
                >
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {item.label}
                  </span>

                  <div className="mt-1 flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                    <span className={`text-[9px] font-semibold ${cfg.text}`}>
                      {hasActiveVer ? `v${activeVer}` : "—"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Action Footer */}
      <div className="mt-5 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          type="button"
          onClick={onOpenCourse}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-indigo-500/25 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          <span>Open Course Workspace</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AssignedCourseCard;
