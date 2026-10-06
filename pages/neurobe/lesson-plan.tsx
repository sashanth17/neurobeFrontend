import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  Sparkles,
  RotateCw,
  Check,
  Calendar,
  Hourglass,
  Clock,
  BookOpen,
  Edit3,
  Save,
  CheckCircle2,
  ArrowRight,
  ClipboardList,
  Layers,
  Undo2,
  Bookmark,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import StageVersionHistoryPanel from "@/components/academic-setup/StageVersionHistoryPanel";
import TableComponent from "@/components/common-components/TableComponent";
import EditLessonPlanModal, {
  LessonPlanEditData,
} from "@/components/lesson-plan/EditLessonPlanModal";
import Models from "@/imports/models.import";

const LessonPlanPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  // Master Course & Version State with immediate client fallback
  const [courseIdParam, setCourseIdParam] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      return (
        urlParams.get("course_id") ||
        urlParams.get("id") ||
        localStorage.getItem("active_course_id") ||
        null
      );
    }
    return null;
  });

  // Keep courseIdParam synchronized with router query
  useEffect(() => {
    const qCid =
      (router.query.course_id as string) ||
      (router.query.id as string) ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("course_id") ||
          new URLSearchParams(window.location.search).get("id") ||
          localStorage.getItem("active_course_id")
        : null);

    if (qCid) {
      if (qCid !== courseIdParam) {
        setCourseIdParam(qCid);
      }
      try {
        localStorage.setItem("active_course_id", qCid);
      } catch {}
    }
  }, [router.isReady, router.query, courseIdParam]);

  // Master Course & Version State
  const [courseData, setCourseData] = useState<any>(null);
  const [loadedVersion, setLoadedVersion] = useState<number | null>(null);
  const [activeUnitNum, setActiveUnitNum] = useState<number>(1);
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  // Loading & Action States
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingWorkspace, setLoadingWorkspace] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [versionRefreshKey, setVersionRefreshKey] = useState<number>(Date.now());

  // Polling ref
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Edit Modal State
  const [editModal, setEditModal] = useState<{
    open: boolean;
    data: LessonPlanEditData | null;
  }>({ open: false, data: null });

  useEffect(() => {
    dispatch(setPageTitle("Lesson Plan & Teaching Schedule"));
  }, [dispatch]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  /** Resolve syllabus ID */
  const getSyllabusId = useCallback(() => {
    return (
      courseData?.latest_syllabus?.id ||
      courseData?.syllabus_id ||
      workspaceData?.syllabus_id ||
      courseIdParam
    );
  }, [courseData, workspaceData, courseIdParam]);

  /** 1. Fetch Relational Lesson Plan Workspace from Database */
  const fetchWorkspace = useCallback(
    async (unitNum?: number, verNum?: number | null) => {
      const sid = getSyllabusId();
      if (!sid) return;

      const targetUnit = unitNum !== undefined ? unitNum : activeUnitNum;
      const targetVer = verNum !== undefined ? verNum : loadedVersion;

      try {
        setLoadingWorkspace(true);
        const res: any = await Models.lession_plan.detail(
          sid,
          targetUnit,
          targetVer !== null ? targetVer : undefined
        );
        const data = res?.data || res;
        setWorkspaceData(data);

        // Sync loaded version if not set
        if (targetVer === null && (data?.version || data?.version_number)) {
          setLoadedVersion(Number(data.version || data.version_number));
        }
      } catch (err: any) {
        console.error("Failed to load lesson plan workspace:", err);
        Failure(getErrorMessage(err, "Failed to load lesson plan data"));
      } finally {
        setLoadingWorkspace(false);
      }
    },
    [getSyllabusId, activeUnitNum, loadedVersion]
  );

  /** Initial load of course details */
  useEffect(() => {
    if (!courseIdParam) return;
    const init = async () => {
      try {
        setLoadingInitial(true);
        const cRes: any = await Models.course.detail(courseIdParam).catch(() => null);
        if (cRes) setCourseData(cRes);
      } catch (err) {
        console.warn("Init course fetch error:", err);
      } finally {
        setLoadingInitial(false);
      }
    };
    init();
  }, [courseIdParam]);

  /** Load workspace when courseIdParam is available */
  useEffect(() => {
    if (courseIdParam) {
      fetchWorkspace(activeUnitNum, loadedVersion);
    }
  }, [courseIdParam]);

  /** Fallback: re-fetch if courseData loads and workspace is still empty */
  useEffect(() => {
    if (courseData && !workspaceData) {
      fetchWorkspace(activeUnitNum, loadedVersion);
    }
  }, [courseData, workspaceData]);

  /** Handle tab change */
  const handleTabChange = (unitNum: number) => {
    setActiveUnitNum(unitNum);
    fetchWorkspace(unitNum, loadedVersion);
  };

  /** 2. Version Navigation: Load specific version */
  const handleVersionLoad = async (ver: number) => {
    setLoadedVersion(ver);
    await fetchWorkspace(activeUnitNum, ver);
  };

  /** 3. Version Navigation: Set active version */
  const handleVersionActivated = async (ver: number) => {
    setLoadedVersion(ver);
    setVersionRefreshKey(Date.now());
    await fetchWorkspace(activeUnitNum, ver);
  };

  /** 4. AI Generation of Lesson Plan Schedule */
  const handleGenerateNew = async (parentParams: {
    hierarchy_version?: number;
    pedagogy_version?: number;
  }) => {
    const sid = getSyllabusId();
    if (!sid) {
      Failure("Syllabus ID not found.");
      return;
    }

    try {
      setIsGenerating(true);
      const res: any = await Models.lession_plan.generate_timeline(sid, {
        hierarchy_version: parentParams?.hierarchy_version,
        pedagogy_version: parentParams?.pedagogy_version,
      });

      const jobId = res?.job_id;
      if (jobId) {
        Success("AI Lesson Plan generation started! Scheduling teaching sessions...");
        let attempts = 0;
        const poll = async () => {
          attempts++;
          if (attempts > 35) {
            setIsGenerating(false);
            return;
          }
          try {
            const jRes: any = await Models.pedagogy.jobStatus(jobId).catch(() => null);
            const status = jRes?.status ?? jRes?.state?.live_redis_status ?? jRes?.result?.status;
            if (
              status === "complete" ||
              status === "completed" ||
              status === "success" ||
              status === "finished"
            ) {
              setIsGenerating(false);
              Success("Lesson plan generated successfully with NEURO AI!");
              setVersionRefreshKey(Date.now());
              await fetchWorkspace(activeUnitNum, null);
              return;
            }
            if (status === "failed" || status === "error") {
              setIsGenerating(false);
              Failure(jRes?.message || "Lesson plan generation failed.");
              return;
            }
            pollTimerRef.current = setTimeout(poll, 3000);
          } catch {
            setIsGenerating(false);
          }
        };
        poll();
      } else {
        setIsGenerating(false);
        Success(res?.message || "Lesson plan generation completed.");
        setVersionRefreshKey(Date.now());
        await fetchWorkspace(activeUnitNum, null);
      }
    } catch (err: any) {
      setIsGenerating(false);
      Failure(getErrorMessage(err, "Failed to generate lesson plan"));
    }
  };

  /** 5. Edit Session Slot (Relational Table Update) */
  const handleSaveSlotEdit = async (updated: LessonPlanEditData) => {
    const targetTopicId = updated.topic_id || updated.id;
    try {
      await Models.lession_plan.update_topics(
        targetTopicId,
        {
          slot_id: updated.id,
          topic_name: updated.title,
          seq: updated.seq,
          level: updated.level,
          hours: String(updated.hours).replace(" Hours", "").replace(" Hour", "").trim(),
          status: updated.status,
          textbook: updated.textbook,
          reference_book: updated.reference,
          pedagogy: updated.pedagogy,
          subtopic: updated.subtopic,
        },
        loadedVersion ?? undefined
      );

      Success("Lesson plan item updated successfully!");
      setEditModal({ open: false, data: null });
      await fetchWorkspace(activeUnitNum, loadedVersion);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to update lesson plan item"));
    }
  };

  /** 6. Save Draft */
  const handleSaveDraft = async () => {
    const sid = getSyllabusId();
    if (!sid) return;
    try {
      setIsSavingDraft(true);
      await Models.lession_plan.draft(sid, loadedVersion ?? undefined);
      Success("Draft saved successfully.");
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save draft"));
    } finally {
      setIsSavingDraft(false);
    }
  };

  /** 7. Approve Stage */
  const handleApprove = async () => {
    const sid = getSyllabusId();
    if (!sid) return;
    try {
      setIsApproving(true);
      await Models.lession_plan.approve_schedule(sid, loadedVersion ?? undefined);
      if (courseIdParam) {
        await Models.syllabus.approve_stage(
          courseIdParam,
          "schedule",
          loadedVersion ?? undefined
        ).catch(() => null);
      }
      Success("Lesson plan review completed and approved successfully!");
      setWorkspaceData((prev: any) =>
        prev ? { ...prev, version_status: "approved", status: "approved" } : null
      );
      setVersionRefreshKey(Date.now());
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve lesson plan"));
    } finally {
      setIsApproving(false);
    }
  };

  /** 8. Disapprove Stage */
  const handleDisapprove = async () => {
    if (!courseIdParam) return;
    try {
      setIsApproving(true);
      await Models.syllabus.reject_stage(
        courseIdParam,
        "schedule",
        loadedVersion ?? undefined
      );
      Success("Lesson plan returned to Draft status.");
      setWorkspaceData((prev: any) =>
        prev ? { ...prev, version_status: "draft", status: "draft" } : null
      );
      setVersionRefreshKey(Date.now());
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to update status"));
    } finally {
      setIsApproving(false);
    }
  };

  // Derived Values
  const unitTabs: any[] = workspaceData?.unit_tabs || [
    { unit_number: 1, unit_title: "Unit 1" },
    { unit_number: 2, unit_title: "Unit 2" },
    { unit_number: 3, unit_title: "Unit 3" },
    { unit_number: 4, unit_title: "Unit 4" },
    { unit_number: 5, unit_title: "Unit 5" },
  ];

  const sessions: any[] = workspaceData?.selected_unit?.sessions || [];
  const hasSessions = sessions.length > 0;
  const isApproved =
    workspaceData?.version_status === "approved" ||
    workspaceData?.status === "approved" ||
    workspaceData?.overall_approval_status === "Approved";

  const totalTopics =
    workspaceData?.summary?.total_topics ||
    workspaceData?.metrics?.topics?.value ||
    sessions.length;

  const totalHours =
    workspaceData?.summary?.total_hours ||
    workspaceData?.metrics?.contact_hours?.value ||
    45;

  // Table Columns
  const columns = [
    {
      accessor: "seq",
      title: "SEQ",
      render: ({ seq }: any) => (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-indigo-700 dark:bg-purple-950/60 dark:text-purple-300">
          {String(seq).padStart(2, "0")}
        </span>
      ),
    },
    {
      accessor: "title",
      title: "TOPIC",
      render: ({ title, subtopic, topic_code }: any) => (
        <div className="max-w-md">
          <p className="font-semibold text-slate-900 dark:text-white leading-snug">
            {title}
          </p>
          {subtopic && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {subtopic}
            </p>
          )}
          {topic_code && (
            <span className="mt-1 inline-block text-[10px] font-bold text-slate-400">
              Topic {topic_code}
            </span>
          )}
        </div>
      ),
    },
    {
      accessor: "level",
      title: "LEVEL",
      render: ({ level }: any) => (
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {level || "K2"}
        </span>
      ),
    },
    {
      accessor: "textbook",
      title: "BOOKS & REFERENCES",
      render: ({ textbook, reference }: any) => (
        <div className="min-w-0 max-w-xs text-xs space-y-0.5">
          {textbook && (
            <p className="text-slate-700 dark:text-slate-300 truncate">
              <span className="font-semibold text-slate-900 dark:text-white">Textbook:</span>{" "}
              {textbook}
            </p>
          )}
          {reference && (
            <p className="text-slate-500 dark:text-slate-400 truncate">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Reference:</span>{" "}
              {reference}
            </p>
          )}
          {!textbook && !reference && (
            <span className="text-slate-400 italic">No prescribed book</span>
          )}
        </div>
      ),
    },
    {
      accessor: "hours",
      title: "DURATION",
      render: ({ hours }: any) => {
        const val = typeof hours === "number" ? hours : parseFloat(String(hours)) || 1;
        const mins = Math.round(val * 60);
        return (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {mins} minutes
          </span>
        );
      },
    },
    {
      accessor: "pedagogy",
      title: "PEDAGOGY",
      render: ({ pedagogy }: any) => (
        <span className="inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          {pedagogy || "Interactive Lecture"}
        </span>
      ),
    },
    {
      accessor: "status",
      title: "STATUS",
      render: ({ status }: any) => {
        const itemApproved = isApproved || status === "Approved" || status === "Reviewed";
        return itemApproved ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check className="h-3 w-3" strokeWidth={3} />
            Approved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-300">
            Scheduled
          </span>
        );
      },
    },
    {
      accessor: "id",
      title: "ACTION",
      render: (row: any) => (
        <button
          type="button"
          onClick={() =>
            setEditModal({
              open: true,
              data: {
                id: String(row.id || row.slot_id),
                topic_id: row.topic_id || row.id,
                seq: row.seq,
                title: row.title || row.topic_name,
                subtopic: row.subtopic || "",
                level: row.level || "K2",
                hours: String(row.hours || "1 Hour"),
                textbook: row.textbook || "",
                reference: row.reference || "",
                pedagogy: row.pedagogy || "",
                status: row.status === "Approved" ? "Reviewed" : "Needs Review",
                unitLabel:
                  workspaceData?.selected_unit?.unit_title || `Unit ${activeUnitNum}`,
              },
            })
          }
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 shadow-xs hover:bg-indigo-50 dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
        >
          <Edit3 className="h-3.5 w-3.5" />
          <span>Edit</span>
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* ── Top Course Banner ── */}
      <CourseBanner
        courseCode={courseData?.course_code || "Course"}
        courseTitle={courseData?.course_title || "Course Workspace"}
        description="Session-by-session teaching plan, lecture hours allocation, textbook chapters, and pedagogy methods."
        programme={courseData?.programme || "B.Tech CSE"}
        batch={courseData?.batch_name || "Batch 2025-2029"}
        academicYear={courseData?.academic_year || "2026-2027"}
        students={String(courseData?.students_count || 0)}
        onBack={() => router.push("/neurobe/my-assigned-courses")}
      />

      {/* ── Version History & Lifecycle Control ── */}
      {courseIdParam && (
        <div className="mt-4">
          <StageVersionHistoryPanel
            stage="schedule"
            stageLabel="Lesson Plan & Schedule"
            courseId={courseIdParam}
            refreshTrigger={versionRefreshKey}
            onVersionActivated={handleVersionActivated}
            onVersionLoad={handleVersionLoad}
            onGenerateNew={handleGenerateNew}
            isGenerating={isGenerating}
          />
        </div>
      )}

      {/* ── Metric Summary Cards ── */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Unit Sessions</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {sessions.length}
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Allocated Time</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {Math.round((Number(workspaceData?.selected_unit?.hours_allocated) || sessions.length) * 60)} mins
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Hourglass className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Course Total Hours</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {totalHours}
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Schedule Status</p>
              <span
                className={`mt-1 inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                  isApproved
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                }`}
              >
                {isApproved ? "Approved" : "Draft"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Unit Selection Tabs ── */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto border-b border-slate-200 pb-2 dark:border-slate-800">
        {unitTabs.map((unit: any) => {
          const uNum = Number(unit.unit_number);
          const isActive = activeUnitNum === uNum;
          return (
            <button
              key={uNum}
              type="button"
              onClick={() => handleTabChange(uNum)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <span>Unit {uNum}</span>
              {unit.sessions_count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {unit.sessions_count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Workspace: Session Schedule Table ── */}
      <div className="mt-4">
        {loadingWorkspace ? (
          <div className="flex items-center justify-center py-24 text-xs text-slate-400">
            <RotateCw className="mr-2 h-5 w-5 animate-spin text-indigo-500" />
            Loading Unit {activeUnitNum} lesson plan from database...
          </div>
        ) : !hasSessions ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <Calendar className="mx-auto h-10 w-10 text-indigo-400 animate-pulse" />
            <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
              No Lesson Plan Sessions Found for Unit {activeUnitNum}
            </h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              Use the version panel above to generate a teaching schedule from your approved Topic Hierarchy and Pedagogy Suggestions.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            {/* Unit Header Box */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 px-5 py-4 text-white">
              <div>
                <h3 className="text-base font-bold">
                  {workspaceData?.selected_unit?.unit_title || `Unit ${activeUnitNum}`}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {workspaceData?.selected_unit?.subtitle ||
                    "Session sequence, knowledge taxonomy, reference readings, and teaching strategies"}
                </p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                {sessions.length} Sessions &bull; {workspaceData?.selected_unit?.hours_badge || `${sessions.length} Hours`}
              </span>
            </div>

            {/* Session Schedule Table */}
            <TableComponent
              records={sessions.map((session: any) => ({
                id: session.slot_id || session.id,
                slot_id: session.slot_id || session.id,
                topic_id: session.topic_id,
                seq: session.seq,
                title: session.topic_name || session.title,
                subtopic: session.subtopic || "",
                topic_code: session.topic_code || "",
                level: session.level || "K2",
                textbook: session.textbook || "",
                reference: session.reference_book || "",
                hours:
                  session.hours_display ||
                  (session.hours
                    ? `${session.hours} Hour${Number(session.hours) > 1 ? "s" : ""}`
                    : "1 Hour"),
                pedagogy: session.pedagogy || "Interactive Lecture",
                status: session.status || "Scheduled",
              }))}
              columns={columns}
            />
          </div>
        )}
      </div>

      {/* ── Persistent Bottom Action Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500">
              Active Unit: <strong className="text-slate-800 dark:text-white">Unit {activeUnitNum}</strong>
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-medium text-slate-500">
              Sessions: <strong className="text-indigo-600 dark:text-indigo-400">{sessions.length}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isSavingDraft}
              onClick={handleSaveDraft}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {isSavingDraft ? (
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Save Draft</span>
            </button>

            {isApproved ? (
              <button
                type="button"
                disabled={isApproving}
                onClick={handleDisapprove}
                className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 shadow-xs hover:bg-amber-100 disabled:opacity-50 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              >
                <Undo2 className="h-3.5 w-3.5" />
                <span>Return to Draft</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isApproving}
                onClick={handleApprove}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
              >
                {isApproving ? (
                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Approve Lesson Plan</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                router.push(
                  courseIdParam
                    ? `/neurobe/learning-materials?course_id=${courseIdParam}`
                    : "/neurobe/learning-materials"
                )
              }
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              <span>Next: Learning Materials</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Edit Modal ── */}
      <EditLessonPlanModal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, data: null })}
        data={editModal.data}
        onSave={handleSaveSlotEdit}
      />
    </div>
  );
};

export default PrivateRouter(LessonPlanPage);
