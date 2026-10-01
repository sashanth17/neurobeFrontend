import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  RotateCw,
  Check,
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Save,
  CheckCircle2,
  Layers,
  Lightbulb,
  ArrowRight,
  Clock,
  AlertCircle,
  Undo2,
  Bookmark,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import StageVersionHistoryPanel from "@/components/academic-setup/StageVersionHistoryPanel";
import Models from "@/imports/models.import";
import { EditPedagogyModal, AddPedagogyModal } from "@/components/co-po-mapping/PedagogyModals";

const PedagogyPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("course_id");

  // Master Course & Version State
  const [courseData, setCourseData] = useState<any>(null);
  const [loadedVersion, setLoadedVersion] = useState<number | null>(null);
  const [activeUnitNum, setActiveUnitNum] = useState<number>(1);
  const [workspaceData, setWorkspaceData] = useState<any>(null);

  // Loading & Generation States
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingWorkspace, setLoadingWorkspace] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [versionRefreshKey, setVersionRefreshKey] = useState<number>(Date.now());

  // Polling ref
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modal States
  const [editModal, setEditModal] = useState<{
    open: boolean;
    pedagogyId?: number | string;
    title: string;
    description: string;
    topicLabel: string;
  }>({ open: false, title: "", description: "", topicLabel: "" });

  const [addModal, setAddModal] = useState<{
    open: boolean;
    topicId?: number | string;
    topicLabel: string;
  }>({ open: false, topicLabel: "" });

  useEffect(() => {
    dispatch(setPageTitle("Pedagogy & Teaching Methodologies"));
  }, [dispatch]);

  // Clean up poll on unmount
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

  /** 1. Fetch Relational Pedagogy Workspace from Database */
  const fetchWorkspace = useCallback(
    async (unitNum?: number, verNum?: number | null) => {
      const sid = getSyllabusId();
      if (!sid) return;

      const targetUnit = unitNum !== undefined ? unitNum : activeUnitNum;
      const targetVer = verNum !== undefined ? verNum : loadedVersion;

      try {
        setLoadingWorkspace(true);
        const res: any = await Models.pedagogy.unit_detail(
          sid,
          targetUnit,
          targetVer !== null ? targetVer : undefined
        );
        const data = res?.data || res;
        setWorkspaceData(data);

        // Sync loaded version if not set
        if (targetVer === null && data?.version_number) {
          setLoadedVersion(Number(data.version_number));
        }
      } catch (err: any) {
        console.error("Failed to load pedagogy workspace:", err);
        Failure(getErrorMessage(err, "Failed to load pedagogy data"));
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

  /** Load workspace whenever syllabus or initial load completes */
  useEffect(() => {
    if (courseData && !loadingInitial) {
      fetchWorkspace(1, loadedVersion);
    }
  }, [courseData, loadingInitial]);

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

  /** 4. AI Generation of Pedagogy Suggestions */
  const handleGenerateNew = async (parentParams: { hierarchy_version?: number }) => {
    const sid = getSyllabusId();
    if (!sid) {
      Failure("Syllabus ID not found.");
      return;
    }

    try {
      setIsGenerating(true);
      const res: any = await Models.pedagogy.generate_pedagogies(sid, {
        hierarchy_version: parentParams?.hierarchy_version,
      });

      const jobId = res?.job_id;
      if (jobId) {
        Success("AI Pedagogy generation started! Processing suggestions...");
        let attempts = 0;
        const poll = async () => {
          attempts++;
          if (attempts > 30) {
            setIsGenerating(false);
            return;
          }
          try {
            const jRes: any = await Models.pedagogy.jobStatus(jobId);
            const status = jRes?.status ?? jRes?.state?.live_redis_status ?? jRes?.result?.status;
            if (
              status === "complete" ||
              status === "completed" ||
              status === "success" ||
              status === "finished"
            ) {
              setIsGenerating(false);
              Success("Pedagogy suggestions generated successfully!");
              setVersionRefreshKey(Date.now());
              await fetchWorkspace(activeUnitNum, null);
              return;
            }
            if (status === "failed" || status === "error") {
              setIsGenerating(false);
              Failure(jRes?.message || "Generation failed. Please try again.");
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
        Success(res?.message || "Pedagogy suggestions generated successfully!");
        setVersionRefreshKey(Date.now());
        await fetchWorkspace(activeUnitNum, null);
      }
    } catch (err: any) {
      setIsGenerating(false);
      Failure(getErrorMessage(err, "Failed to generate pedagogy suggestions"));
    }
  };


  /** 6. Delete Pedagogy Item (Relational Table Deletion) */
  const handleDeletePedagogy = async (pedagogyId: number | string) => {
    const sid = getSyllabusId();
    if (!sid) return;

    if (!window.confirm("Are you sure you want to remove this teaching method?")) return;

    // Optimistically remove from state
    setWorkspaceData((prev: any) => {
      if (!prev?.selected_unit?.topics) return prev;
      const updatedTopics = prev.selected_unit.topics.map((t: any) => {
        const filtered = (t.suggested_pedagogies || []).filter(
          (p: any) => String(p.id) !== String(pedagogyId)
        );
        return { ...t, suggested_pedagogies: filtered };
      });
      return {
        ...prev,
        selected_unit: { ...prev.selected_unit, topics: updatedTopics },
      };
    });

    try {
      await Models.pedagogy.delete(sid, pedagogyId, loadedVersion);
      Success("Teaching method removed");
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to remove teaching method"));
      fetchWorkspace(activeUnitNum, loadedVersion);
    }
  };

  /** 7. Edit Pedagogy Item (Relational Table Update) */
  const handleSaveEdit = async (title: string, description: string) => {
    const sid = getSyllabusId();
    const pedId = editModal.pedagogyId;
    if (!sid || !pedId) return;

    try {
      await Models.pedagogy.update_selection(
        sid,
        pedId,
        {
          pedagogy_name: title,
          methodology: description,
          is_selected: true,
        },
        loadedVersion
      );

      // In-memory update
      setWorkspaceData((prev: any) => {
        if (!prev?.selected_unit?.topics) return prev;
        const updatedTopics = prev.selected_unit.topics.map((t: any) => {
          const updatedPeds = (t.suggested_pedagogies || []).map((p: any) => {
            if (String(p.id) === String(pedId)) {
              return {
                ...p,
                pedagogy_name: title,
                title: title,
                methodology: description,
                description: description,
                is_selected: true,
              };
            }
            return p;
          });
          return { ...t, suggested_pedagogies: updatedPeds };
        });
        return {
          ...prev,
          selected_unit: { ...prev.selected_unit, topics: updatedTopics },
        };
      });

      Success("Teaching method updated successfully");
      setEditModal((prev) => ({ ...prev, open: false }));
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to update teaching method"));
    }
  };

  /** 8. Add New Teaching Method to Topic (Relational Table Insertion) */
  const handleAddNewMethod = async (
    targetTopicId: number | string,
    title: string,
    description: string,
    isSelected: boolean
  ) => {
    try {
      const res: any = await Models.pedagogy.add_pedagogy(
        targetTopicId,
        {
          pedagogy_name: title,
          methodology: description,
          is_selected: isSelected,
        },
        loadedVersion
      );

      const createdId = res?.id || res?.data?.id || `new-${Date.now()}`;
      const newItem = {
        id: createdId,
        topic_id: targetTopicId,
        pedagogy_name: title,
        title: title,
        methodology: description,
        description: description,
        is_selected: isSelected,
      };

      // Add to in-memory workspace
      setWorkspaceData((prev: any) => {
        if (!prev?.selected_unit?.topics) return prev;
        const updatedTopics = prev.selected_unit.topics.map((t: any) => {
          if (String(t.id) === String(targetTopicId)) {
            const currentPeds = Array.isArray(t.suggested_pedagogies)
              ? [...t.suggested_pedagogies]
              : [];
            return { ...t, suggested_pedagogies: [...currentPeds, newItem] };
          }
          return t;
        });
        return {
          ...prev,
          selected_unit: { ...prev.selected_unit, topics: updatedTopics },
        };
      });

      Success("New teaching method added successfully");
      setAddModal({ open: false, topicLabel: "" });
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to add teaching method"));
    }
  };

  /** 9. Save Draft */
  const handleSaveDraft = async () => {
    if (!courseIdParam) return;
    try {
      setIsSavingDraft(true);
      await Models.syllabus.update_version(
        courseIdParam,
        "pedagogy",
        loadedVersion || 1,
        { status: "draft" }
      ).catch(() => null);
      Success("Pedagogy draft saved successfully.");
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save draft"));
    } finally {
      setIsSavingDraft(false);
    }
  };

  /** 10. Approve Stage */
  const handleApprove = async () => {
    if (!courseIdParam) return;
    try {
      setIsApproving(true);
      await Models.syllabus.approve_stage(courseIdParam, "pedagogy", loadedVersion || 1);
      Success("Pedagogy Approved! You can now proceed to Lesson Plan & Schedule.");

      setWorkspaceData((prev: any) =>
        prev ? { ...prev, version_status: "approved", status: "approved" } : null
      );
      setVersionRefreshKey(Date.now());
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve pedagogy"));
    } finally {
      setIsApproving(false);
    }
  };

  /** 11. Disapprove Stage */
  const handleDisapprove = async () => {
    if (!courseIdParam) return;
    try {
      setIsApproving(true);
      await Models.syllabus.reject_stage(courseIdParam, "pedagogy", loadedVersion || 1);
      Success("Pedagogy returned to Draft status.");

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

  const topics: any[] = workspaceData?.selected_unit?.topics || [];
  const isApproved =
    workspaceData?.version_status === "approved" ||
    workspaceData?.status === "approved" ||
    workspaceData?.pedagogy_status === "approved";

  const totalTopics =
    workspaceData?.summary?.total_topics ||
    workspaceData?.metrics?.topics?.value ||
    topics.length;

  const totalMethods = topics.reduce(
    (acc: number, t: any) => acc + (t.suggested_pedagogies?.length || 0),
    0
  );


  return (
    <div className="min-h-screen pb-16">
      {/* ── Top Course Banner ── */}
      <CourseBanner
        courseCode={courseData?.course_code || "Course"}
        courseTitle={courseData?.course_title || "Course Workspace"}
        description="Review, configure, and approve pedagogy teaching methods mapped directly to course topics."
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
            stage="pedagogy"
            stageLabel="Pedagogy & Teaching Methodologies"
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
              <p className="text-xs font-medium text-slate-500">Unit Topics</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {topics.length}
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Teaching Methods</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {totalMethods}
              </h4>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Allocated Hours</p>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                {workspaceData?.selected_unit?.theory_hours || 9} hrs
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
              <p className="text-xs font-medium text-slate-500">Stage Status</p>
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
              {unit.topics_count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  }`}
                >
                  {unit.topics_count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Workspace: Topics & Suggested Pedagogies ── */}
      <div className="mt-4">
        {loadingWorkspace ? (
          <div className="flex items-center justify-center py-24 text-xs text-slate-400">
            <RotateCw className="mr-2 h-5 w-5 animate-spin text-indigo-500" />
            Loading Unit {activeUnitNum} pedagogy methods from database...
          </div>
        ) : topics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
            <Lightbulb className="mx-auto h-10 w-10 text-indigo-400 animate-pulse" />
            <h4 className="mt-3 text-sm font-bold text-slate-800 dark:text-white">
              No Pedagogy Methods Found for Unit {activeUnitNum}
            </h4>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              Use the version panel above to generate pedagogy suggestions from your approved Topic Hierarchy.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unit Header Box */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-xs">
              <div>
                <h3 className="text-base font-bold">
                  {workspaceData?.selected_unit?.unit_title || `Unit ${activeUnitNum}`}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Knowledge level alignment, instructional models, and active learning strategies
                </p>
              </div>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                {topics.length} Topics &bull; {workspaceData?.selected_unit?.theory_hours || 9} Hours
              </span>
            </div>

            {/* List of Topics */}
            {topics.map((topic: any, tIdx: number) => {
              const suggestedPeds = topic.suggested_pedagogies || [];
              const topicCode = topic.topic_code || `${activeUnitNum}.${tIdx + 1}`;
              const topicName = topic.topic_name || topic.title || `Topic ${topicCode}`;

              return (
                <div
                  key={topic.id || tIdx}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all dark:border-slate-800 dark:bg-slate-900"
                >
                  {/* Topic Row Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {topicCode}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {topicName}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {topic.knowledge_level || topic.bloom_level || "Understand"}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {topic.theory_hours || 1} Hour{Number(topic.theory_hours) > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setAddModal({
                          open: true,
                          topicId: topic.id,
                          topicLabel: `${topicCode} — ${topicName}`,
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-100 hover:text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-300"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Teaching Method</span>
                    </button>
                  </div>

                  {/* Suggested Pedagogies Grid */}
                  <div className="mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {suggestedPeds.length === 0 ? (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400">
                        No teaching methods suggested yet. Click &quot;Add Teaching Method&quot; above to create one.
                      </div>
                    ) : (
                      suggestedPeds.map((ped: any, pedIdx: number) => {
                        const title = ped.pedagogy_name || ped.strategy_name || ped.title || "Method";
                        const desc = ped.methodology || ped.description || "";

                        return (
                          <div
                            key={ped.id || pedIdx}
                            className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs transition hover:border-indigo-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-slate-700"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                                    {pedIdx + 1}
                                  </span>
                                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                    {title}
                                  </h5>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditModal({
                                        open: true,
                                        pedagogyId: ped.id,
                                        title: title,
                                        description: desc,
                                        topicLabel: `${topicCode} — ${topicName}`,
                                      })
                                    }
                                    title="Edit teaching method"
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePedagogy(ped.id)}
                                    title="Delete teaching method"
                                    className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {desc && (
                                <p className="mt-2.5 text-xs text-slate-600 leading-relaxed dark:text-slate-300">
                                  {desc}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
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
              Topics: <strong className="text-slate-800 dark:text-white">{topics.length}</strong>
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-medium text-slate-500">
              Teaching Methods: <strong className="text-indigo-600 dark:text-indigo-400">{totalMethods}</strong>
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
                <span>Approve Pedagogy</span>
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                router.push(`/neurobe/lesson-plan?course_id=${courseIdParam}`)
              }
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
            >
              <span>Next: Lesson Plan</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <EditPedagogyModal
        open={editModal.open}
        onClose={() => setEditModal((p) => ({ ...p, open: false }))}
        topicLabel={editModal.topicLabel}
        initialTitle={editModal.title}
        initialDescription={editModal.description}
        onSave={handleSaveEdit}
      />

      <AddPedagogyModal
        open={addModal.open}
        onClose={() => setAddModal({ open: false, topicLabel: "" })}
        topicLabel={addModal.topicLabel}
        topicId={addModal.topicId}
        onAdd={handleAddNewMethod}
      />
    </div>
  );
};

export default PrivateRouter(PedagogyPage);
