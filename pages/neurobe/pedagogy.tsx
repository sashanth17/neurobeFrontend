import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Check, EditIcon, Hourglass, Lightbulb, Presentation, RefreshCw, ReplaceAll, Save, Sparkles, Trash2 } from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState, Success, Failure, Dropdown } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import StepHeader from "@/components/academic-setup/StepHeader";
import StatTabCard from "@/components/academic-setup/StatTabCard";
import PageFooter from "@/components/common-components/PageFooter";
import GenericTabs from "@/components/common-components/GenericTabs";
import AccordiansStyle from "@/components/common-components/AccordiansStyle";
import { EditPedagogyModal, ReplacePedagogyModal } from "@/components/co-po-mapping/PedagogyModals";
import { useRouter, useSearchParams } from "next/navigation";
import TableTitle from "@/components/common-components/TableTitle";
import PageHeader from "@/components/common-components/PageHeader";
import StageVersionHistoryPanel from "@/components/academic-setup/StageVersionHistoryPanel";
import Models from "@/imports/models.import";

// ─── Page ─────────────────────────────────────────────────────────────────────
const getErrorMessage = (error: any, fallback: string) => {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (typeof error?.message === "string") return error.message;
  if (typeof error?.detail === "string") return error.detail;
  if (typeof error?.error === "string") return error.error;
  return fallback;
};
const Pedagogy = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const course_id = searchParams.get("course_id");
  const fromParam = searchParams.get("from");

  const [state, setState] = useSetState({
    activeTab: "unit-1",
    activeUnitNumber: 1,
    recommendationsGenerated: false,
    acceptedCount: 0,
    pedagogyApproved: false,
    activeBannerTab: "coordinator",
    courseDetail: null as any,
    courseList: [] as any[],
    selectedCourse: null as any,
    organization_id: "",
    coordinator_id: "",
    isCourseCoordinator: false,
    unitsList: [] as any[],
    unitDetailsMap: {} as Record<number, any>,
    loadingUnits: false,
    loadingUnitDetail: false,
    generatingRecommendations: false,
    pollingJob: false,
    upstreamNotApproved: false,
    approvingPedagogy: false,
  });

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  // accepted pedagogy IDs set
  const [acceptedIds, setAcceptedIds] = useState<Set<number | string>>(new Set());
  const [loadedVersion, setLoadedVersion] = useState<number | null>(null);

  // modal state — owned here, passed down via renderModals
  const [editModal, setEditModal] = useState<{
    open: boolean; title: string; description: string; topicLabel: string;
  }>({ open: false, title: "", description: "", topicLabel: "" });

  const [replaceModal, setReplaceModal] = useState<{
    open: boolean; currentTitle: string; topicLabel: string;
    options: { title: string; description: string }[];
  }>({ open: false, currentTitle: "", topicLabel: "", options: [] });

  useEffect(() => {
    dispatch(setPageTitle("Pedagogy & Teaching Methodologies"));
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
      restoreWorkflowState(course_id);
    } else {
      getUnits(1);
    }
  }, [course_id]);

  const restoreWorkflowState = async (cid: string | number) => {
    try {
      const wfRes: any = await Models.syllabus.get_workflow_status(cid);
      const topicStep = wfRes?.workflow?.step_3_topic_hierarchy;
      const isTopicApproved = topicStep?.status === "approved";
      setState({ upstreamNotApproved: !isTopicApproved });

      const pedStep = wfRes?.workflow?.step_4_pedagogy_generation;
      if (!pedStep) return;

      const { status, job_id } = pedStep;
      if (status === "redis_queued" || status === "generating") {
        setState({ generatingRecommendations: true });
        if (job_id) {
          startPollingJob(job_id, cid);
        }
      } else if (status === "approved") {
        setState({ pedagogyApproved: true, recommendationsGenerated: true, generatingRecommendations: false, pollingJob: false });
      } else if (status === "draft") {
        setState({ recommendationsGenerated: true, generatingRecommendations: false, pollingJob: false });
      }
    } catch (err) {
      console.warn("restoreWorkflowState in pedagogy error:", err);
    }
  };

  const activeUnitNum =
    state.activeUnitNumber ||
    (typeof state.activeTab === "string" ? Number(state.activeTab.replace("unit-", "")) : 1) ||
    1;
  const activeUnitDetail = state.unitDetailsMap?.[activeUnitNum];

  const unitTabs = state.unitsList.length > 0
    ? state.unitsList.map((u: any) => ({
        key: `unit-${u.unit_number}`,
        label: `Unit ${u.unit_number}`,
        count: u.topics_count ?? u.topics?.length ?? 0,
      }))
    : [];

  const apiTopics: any[] | null = (() => {
    if (!activeUnitDetail) return null;
    if (Array.isArray(activeUnitDetail.selected_unit?.topics)) return activeUnitDetail.selected_unit.topics;
    if (Array.isArray(activeUnitDetail.topics)) return activeUnitDetail.topics;
    return null;
  })();

  const computedTotalUnits = state.unitsList.length;
  const computedTotalTopics = state.unitsList.reduce((acc: number, u: any) => {
        const uDetail = state.unitDetailsMap?.[u.unit_number];
        const topicsArr = uDetail?.selected_unit?.topics || uDetail?.topics;
        return acc + (Array.isArray(topicsArr) ? topicsArr.length : (u.topics_count ?? 0));
      }, 0);

  const currentTopics: any[] = apiTopics || [];

  const isTopicReviewed = (topic: any) => {
    const peds = topic.suggested_pedagogies || [];
    return peds.length > 0 && peds.every((p: any) => acceptedIds.has(p.id) || p.is_selected);
  };

  const isEveryUnitReviewed =
    state.unitsList.length > 0 &&
    state.unitsList.every((u: any) => {
      const uDetail = state.unitDetailsMap?.[u.unit_number];
      if (!uDetail) return false;
      const topics = uDetail.selected_unit?.topics || uDetail.topics || [];
      return topics.length > 0 && topics.every(isTopicReviewed);
    });

  const totalCourseTopics =
    state.unitsList.length > 0
      ? state.unitsList.reduce((acc: number, u: any) => {
          const uDetail = state.unitDetailsMap?.[u.unit_number];
          const topics = uDetail?.selected_unit?.topics || uDetail?.topics || [];
          return acc + (topics.length > 0 ? topics.length : (u.topics_count ?? 0));
        }, 0)
      : (activeUnitDetail?.metrics?.approved_topics?.value ??
        activeUnitDetail?.target_topics ??
        currentTopics.length);

  const reviewedCourseTopics =
    state.unitsList.length > 0
      ? state.unitsList.reduce((acc: number, u: any) => {
          const uDetail = state.unitDetailsMap?.[u.unit_number];
          const topics = uDetail?.selected_unit?.topics || uDetail?.topics || [];
          return acc + topics.filter(isTopicReviewed).length;
        }, 0)
      : currentTopics.filter(isTopicReviewed).length;

  const progressPercentage =
    totalCourseTopics > 0
      ? Math.min(100, Math.round((reviewedCourseTopics / totalCourseTopics) * 100))
      : 0;

  // Complete review can ONLY be enabled when EVERY unit across the entire course has all its topics reviewed!
  const allAccepted = Boolean(isEveryUnitReviewed && totalCourseTopics > 0);

  const toggleAccept = async (pedagogyId: number | string, topic?: any) => {
    const isCurrentlyAccepted = acceptedIds.has(pedagogyId);
    const nextSelected = !isCurrentlyAccepted;

    // Optimistically update UI
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      if (nextSelected) {
        next.add(pedagogyId);
      } else {
        next.delete(pedagogyId);
      }
      return next;
    });

    const sid =
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id ||
      activeUnitDetail?.syllabus_id ||
      course_id;

    if (!sid) {
      Failure("Syllabus ID not found to update selection");
      return;
    }

    try {
      await Models.pedagogy.update_selection(sid, pedagogyId, { is_selected: nextSelected }, loadedVersion);

      // Update in-memory topic suggested_pedagogies in unitDetailsMap
      setState((prev: any) => {
        const currentUnitDetail = prev.unitDetailsMap?.[activeUnitNum];
        if (!currentUnitDetail) return prev;

        const updatedTopics = (currentUnitDetail.selected_unit?.topics || currentUnitDetail.topics || []).map((t: any) => {
          const updatedPeds = (t.suggested_pedagogies || []).map((p: any) => {
            if (p.id === pedagogyId) {
              return { ...p, is_selected: nextSelected };
            }
            return p;
          });
          return { ...t, suggested_pedagogies: updatedPeds };
        });

        const updatedUnitDetail = {
          ...currentUnitDetail,
          ...(currentUnitDetail.selected_unit
            ? { selected_unit: { ...currentUnitDetail.selected_unit, topics: updatedTopics } }
            : { topics: updatedTopics }),
        };

        return {
          unitDetailsMap: {
            ...(prev.unitDetailsMap || {}),
            [activeUnitNum]: updatedUnitDetail,
          },
        };
      });

      Success(nextSelected ? "Teaching method selected" : "Teaching method unselected");
    } catch (err: any) {
      console.error("Failed to update pedagogy selection:", err);
      // Revert optimistic update
      setAcceptedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyAccepted) {
          next.add(pedagogyId);
        } else {
          next.delete(pedagogyId);
        }
        return next;
      });
      Failure(getErrorMessage(err, "Failed to update pedagogy selection"));
    }
  };

  const handleDeletePedagogy = async (pedagogyId: number | string, topic?: any) => {
    const sid =
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id ||
      activeUnitDetail?.syllabus_id ||
      course_id;

    if (!sid) {
      Failure("Syllabus ID not found to delete pedagogy");
      return;
    }

    try {
      if (typeof pedagogyId === "number" || (typeof pedagogyId === "string" && /^\d+$/.test(pedagogyId))) {
        await Models.pedagogy.delete(sid, pedagogyId, loadedVersion);
      }

      setAcceptedIds((prev) => {
        const next = new Set(prev);
        next.delete(pedagogyId);
        return next;
      });

      setState((prev: any) => {
        const nextMap = { ...(prev.unitDetailsMap || {}) };
        Object.keys(nextMap).forEach((uKey) => {
          const uData = nextMap[uKey];
          if (!uData) return;
          const updateTopics = (tList: any[]) =>
            tList.map((t: any) => {
              if (topic && t.id !== topic.id && t.topic_code !== topic.topic_code) return t;
              const peds = (t.suggested_pedagogies || []).filter((p: any) => p.id !== pedagogyId);
              return { ...t, suggested_pedagogies: peds };
            });

          if (uData.selected_unit?.topics) {
            nextMap[uKey] = {
              ...uData,
              selected_unit: {
                ...uData.selected_unit,
                topics: updateTopics(uData.selected_unit.topics),
              },
            };
          } else if (uData.topics) {
            nextMap[uKey] = {
              ...uData,
              topics: updateTopics(uData.topics),
            };
          }
        });

        return { unitDetailsMap: nextMap };
      });

      Success("Suggested pedagogy removed");
    } catch (err: any) {
      console.error("Failed to delete pedagogy:", err);
      Failure(getErrorMessage(err, "Failed to delete pedagogy"));
    }
  };

  // api integration 

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
      getUnits(sid);
    } catch (error: any) {
      console.log("error fetching course detail", error);
      Failure(getErrorMessage(error, "Failed to fetch course detail"));
      getUnits();
    }
  };

  const getUnits = async (syllabusId?: any, verNum?: number) => {
    const sid = syllabusId || state.courseDetail?.latest_syllabus?.id;
    const vToUse = verNum !== undefined ? verNum : loadedVersion;
    try {
      setState({ loadingUnits: true });
      const res: any = await Models.topics.units(sid);
      const rawUnitsData = Array.isArray(res) ? res : res?.data || [];
      const unitsData = rawUnitsData.map((u: any, idx: number) => {
        const num = u.unit_number ?? (idx + 1);
        const realId = u.id ?? u.unit_id;
        return { ...u, id: realId, unit_id: realId, unit_number: num };
      });

      if (unitsData.length > 0) {
        const initialUnit = unitsData[0];
        const initialUnitNum = initialUnit.unit_number || 1;
        setState({
          unitsList: unitsData,
          activeTab: `unit-${initialUnitNum}`,
          activeUnitNumber: initialUnitNum,
          loadingUnits: false,
        });
        getUnitDetail(sid, initialUnitNum, vToUse);
        prefetchAllUnits(sid, unitsData, vToUse);
      } else {
        setState({ loadingUnits: false });
        getUnitDetail(sid, 1, vToUse);
      }
    } catch (error: any) {
      console.log("error fetching units", error);
      setState({ loadingUnits: false });
      Failure(getErrorMessage(error, "Failed to fetch syllabus units"));
    }
  };

  const prefetchAllUnits = async (sid: any, unitsData: any[], verNum?: number) => {
    const vToUse = verNum !== undefined ? verNum : loadedVersion;
    try {
      const results = await Promise.all(
        unitsData.map(async (u) => {
          try {
            const res: any = await Models.pedagogy.unit_detail(sid, u.unit_number, vToUse);
            return { unitNum: u.unit_number, data: res?.data || res };
          } catch {
            return null;
          }
        })
      );
      const newMap: Record<number, any> = {};
      const newAccepted = new Set<number | string>();
      results.forEach((r) => {
        if (r && r.data) {
          newMap[r.unitNum] = r.data;
          const tList = r.data.selected_unit?.topics || r.data.topics || [];
          tList.forEach((t: any) => {
            (t.suggested_pedagogies || []).forEach((p: any) => {
              if (p.is_selected) {
                newAccepted.add(p.id);
              }
            });
          });
        }
      });
      setAcceptedIds((prev) => {
        const next = new Set(prev);
        newAccepted.forEach((id) => next.add(id));
        return next;
      });
      setState((prev: any) => ({
        unitDetailsMap: { ...(prev.unitDetailsMap || {}), ...newMap },
      }));
    } catch (err) {
      console.warn("prefetchAllUnits error:", err);
    }
  };


  const getUnitDetail = async (syllabusId?: any, unitNumber?: any, verNum?: number) => {
    const sid = syllabusId || state.courseDetail?.latest_syllabus?.id || state.unitsList?.[0]?.syllabus_id;
    const uNum = unitNumber ?? state.activeUnitNumber;
    const vToUse = verNum !== undefined ? verNum : loadedVersion;
    try {
      setState({ loadingUnitDetail: true });
      const res: any = await Models.pedagogy.unit_detail(sid, uNum, vToUse);
      const data = res?.data || res;

      setState((prev: any) => {
        const targetUnitNum = data?.selected_unit?.unit_number ?? uNum;
        const existingCourse = prev.courseDetail || {};
        const updatedCourseDetail = data?.course_code
          ? {
              ...existingCourse,
              id: data.course_id ?? existingCourse.id,
              course_code: data.course_code ?? existingCourse.course_code,
              course_title: data.course_title ?? existingCourse.course_title,
              programme: data.programme ?? existingCourse.programme,
              batch_name: data.batch ?? existingCourse.batch_name,
              students_count: data.student_count ?? existingCourse.students_count,
              latest_syllabus: { id: data.syllabus_id ?? existingCourse.latest_syllabus?.id ?? sid },
            }
          : existingCourse;

        return {
          loadingUnitDetail: false,
          courseDetail: updatedCourseDetail,
          unitDetailsMap: {
            ...(prev.unitDetailsMap || {}),
            [targetUnitNum]: data,
            [uNum]: data,
          },
        };
      });

      const topicsList = data?.selected_unit?.topics || data?.topics || [];
      const hasGeneratedPedagogies = topicsList.some((t: any) => Array.isArray(t.suggested_pedagogies) && t.suggested_pedagogies.length > 0);
      if (hasGeneratedPedagogies) {
        setState({ recommendationsGenerated: true });
      }

      setAcceptedIds((prev) => {
        const next = new Set(prev);
        topicsList.forEach((t: any) => {
          (t.suggested_pedagogies || []).forEach((p: any) => {
            if (p.is_selected) {
              next.add(p.id);
            }
          });
        });
        return next;
      });
    } catch (error: any) {
      console.log("error fetching unit detail", error);
      setState({ loadingUnitDetail: false });
      Failure(getErrorMessage(error, `Failed to fetch Unit ${uNum} details`));
    }
  };

  const handleTabChange = (tabKey: string | number) => {
    const keyStr = String(tabKey);
    const unitNum = Number(keyStr.replace("unit-", "")) || 1;
    setState({ activeTab: keyStr, activeUnitNumber: unitNum });
    const sid =
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id;
    getUnitDetail(sid, unitNum, loadedVersion);
  };

  const startPollingJob = (jobId: string, sid?: any) => {
    stopPolling();
    const targetSid = sid || state.courseDetail?.latest_syllabus?.id || state.unitsList?.[0]?.syllabus_id || activeUnitDetail?.syllabus_id || course_id;
    setState({ pollingJob: true, generatingRecommendations: true });
    pollRef.current = setInterval(async () => {
      try {
        const jobRes: any = await Models.pedagogy.jobStatus(jobId);
        const status = jobRes?.status ?? jobRes?.state?.live_redis_status ?? jobRes?.result?.status;
        if (status === "complete" || status === "completed" || status === "success" || status === "finished") {
          stopPolling();
          setState({ generatingRecommendations: false, pollingJob: false, recommendationsGenerated: true, pedagogyApproved: false });
          Success("Pedagogy recommendations generated successfully");
          if (targetSid) getUnitDetail(targetSid, activeUnitNum);
        } else if (status === "failed" || status === "error") {
          stopPolling();
          setState({ generatingRecommendations: false, pollingJob: false });
          Failure(jobRes?.message || "Pedagogy generation job failed");
        }
      } catch (pollError: any) {
        stopPolling();
        setState({ generatingRecommendations: false, pollingJob: false });
        Failure(getErrorMessage(pollError, "Failed to check job status"));
      }
    }, 3000);
  };

  const handleGenerateRecommendations = async (parentParams?: { hierarchy_version?: number }) => {
    const sid =
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id ||
      activeUnitDetail?.syllabus_id ||
      course_id;
    try {
      setState({ generatingRecommendations: true, pedagogyApproved: false });
      const res: any = await Models.pedagogy.generate_pedagogies(sid, {
        hierarchy_version: parentParams?.hierarchy_version,
      });
      const jobId = res?.job_id;
      if (jobId) {
        startPollingJob(jobId, sid);
      } else {
        // no job_id — treat as immediate success
        setState({ generatingRecommendations: false, recommendationsGenerated: true, pedagogyApproved: false });
        Success(res?.message || "Pedagogy recommendations generated successfully");
        getUnitDetail(sid, activeUnitNum);
      }
    } catch (error: any) {
      console.log("error generating recommendations", error);
      setState({ generatingRecommendations: false });
      Failure(getErrorMessage(error, "Failed to generate pedagogy recommendations"));
    }
  };

  const handleApprovePedagogy = async () => {
    const sid =
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id ||
      activeUnitDetail?.syllabus_id ||
      course_id;

    if (state.upstreamNotApproved) {
      Failure("Cannot approve pedagogy: Topic hierarchy must be approved first.");
      return;
    }

    try {
      setState({ approvingPedagogy: true });
      await Models.syllabus.approve_stage(course_id || sid, "pedagogy");
      Success("Pedagogy approved successfully");
      setState({ pedagogyApproved: true });
      if (course_id) {
        await restoreWorkflowState(course_id);
      }
      if (sid) {
        await getUnitDetail(sid, activeUnitNum);
      }
    } catch (error: any) {
      console.error("approve_pedagogy error:", error);
      Failure(getErrorMessage(error, "Failed to approve pedagogy"));
    } finally {
      setState({ approvingPedagogy: false });
    }
  };

  const handleVersionActivated = async (newVer: number) => {
    setLoadedVersion(newVer);
    const sid =
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id ||
      course_id;
    if (sid) {
      await getUnits(sid, newVer);
      await getUnitDetail(sid, state.activeUnitNumber || 1, newVer);
    }
    if (course_id) {
      await restoreWorkflowState(course_id);
    }
  };

  // Build AccordionTopic[] from real API unit topics + accepted state
  const buildTopics = () => {
    if (!currentTopics || currentTopics.length === 0) return [];

    return currentTopics.map((topic: any, tIdx: number) => {
      const topicId = topic.id || `topic-${tIdx + 1}`;
      const topicCode = topic.topic_code || `Topic ${activeUnitNum}.${tIdx + 1}`;
      const topicName = topic.topic_name || topic.title || "";
      const displayTitle = topicCode && !topicName.startsWith(topicCode)
        ? `${topicCode} — ${topicName}`
        : (topicName || topicCode);

      const level = topic.knowledge_level
        ? (String(topic.knowledge_level).includes("Knowledge") ? topic.knowledge_level : `Knowledge Level ${topic.knowledge_level}`)
        : "Knowledge Level K2";
      const hours = topic.theory_hours ?? topic.hours ?? 2;

      const peds: any[] = Array.isArray(topic.suggested_pedagogies) ? topic.suggested_pedagogies : [];
      const topicHasSelection = peds.length > 0 && peds.every((p: any) => acceptedIds.has(p.id) || p.is_selected);

      const items = peds.map((rec: any, idx: number) => {
        const recId = rec.id || `${topicId}-rec-${idx + 1}`;
        const isAccepted = acceptedIds.has(rec.id) || (!acceptedIds.has(rec.id) && Boolean(rec.is_selected));
        const title = rec.pedagogy_name || rec.strategy_name || rec.title || `Pedagogy ${idx + 1}`;
        const description = rec.methodology || rec.description || "";

        const actions: any[] = [];

        actions.push({
          key: "edit",
          label: "Edit",
          icon: <EditIcon className="h-3.5 w-3.5" />,
          className: "flex items-center gap-1.5 rounded-full border border-gray-400 px-3 py-1 text-xs font-semibold text-pri hover:border-[#000] hover:text-[#000]",
          onClick: () => setEditModal({
            open: true,
            title: title,
            description: description,
            topicLabel: displayTitle,
          }),
        });

        if (isAccepted) {
          actions.push({
            key: "replace",
            label: "Replace",
            icon: <ReplaceAll className="h-3.5 w-3.5" />,
            className: "flex items-center gap-1.5 rounded-full border border-gray-400 px-3 py-1 text-xs font-semibold text-pri hover:border-[#000] hover:text-[#000]",
            onClick: () => setReplaceModal({
              open: true,
              currentTitle: title,
              topicLabel: displayTitle,
              options: peds.map((r: any) => ({
                title: r.pedagogy_name || r.strategy_name || r.title,
                description: r.methodology || r.description,
              })),
            }),
          });
          actions.push({
            key: "selected",
            label: "Selected ✓",
            className: "rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white cursor-pointer hover:bg-green-700 transition",
            onClick: () => toggleAccept(rec.id, topic),
          });
        } else {
          actions.push({
            key: "accept",
            label: "Accept",
            className: "rounded-full border border-color2 px-3 py-1 text-xs font-semibold text-color2 hover:bg-color2-l cursor-pointer transition",
            onClick: () => toggleAccept(rec.id, topic),
          });
        }

        actions.push({
          key: "delete",
          label: "Delete",
          icon: <Trash2 className="h-3.5 w-3.5 text-red-500" />,
          className: "flex items-center gap-1.5 rounded-full border border-red-300 px-2.5 py-1 text-xs font-semibold text-red-600 hover:border-red-500 hover:bg-red-50 hover:text-red-700 transition cursor-pointer",
          onClick: () => handleDeletePedagogy(rec.id, topic),
        });

        return {
          id: recId,
          index: idx + 1,
          title: title,
          description: description,
          badge: rec.badge ? { label: rec.badge, className: "bg-green-500" } : undefined,
          highlighted: isAccepted,
          actions,
        };
      });

      return {
        id: topicId,
        title: displayTitle,
        meta: `${level} · ${hours} Hours`,
        collapsedBadge: topicHasSelection
          ? { label: "Reviewed", className: "border border-green-200 bg-green-50 text-green-700 font-semibold" }
          : { label: "Needs Review", className: "border border-orange-200 bg-orange-50 text-orange-600 font-semibold" },
        expandedBadge: topicHasSelection
          ? { label: "Reviewed", className: "border border-green-200 bg-green-50 text-green-700 font-semibold" }
          : { label: "Needs Review", className: "border border-orange-200 bg-orange-50 text-orange-600 font-semibold" },
        items,
      };
    });
  };

  // Initial (pre-generate) topics — no items, just meta badges
  const buildInitialTopics = () => {
    if (apiTopics && apiTopics.length > 0) {
      return apiTopics.map((topic: any, idx: number) => {
        const topicName = topic.topic_name || topic.title || `Topic ${idx + 1}`;
        const displayTitle = topic.topic_code && !topicName.startsWith(topic.topic_code)
          ? `${topic.topic_code} — ${topicName}`
          : topicName;
        const levelBadge = topic.level ||
          (topic.knowledge_level ? `Knowledge Level ${String(topic.knowledge_level).startsWith("K") ? topic.knowledge_level : `K${topic.knowledge_level}`}` : "Knowledge Level K2");
        const hoursBadge = topic.theory_hours ? `${topic.theory_hours} Hours` : (topic.hours ? `${topic.hours} Hours` : "2 Hours");
        return {
          id: topic.id || `${idx + 1}`,
          title: displayTitle,
          collapsedBadge: [
            { label: levelBadge, className: "bg-color2-l text-color2 font-bold" },
            { label: hoursBadge, className: "bg-gray-200 text-pri font-bold" },
          ],
          items: [],
        };
      });
    }
    return [];
  };

  const pendingRecommendationsCount =
    activeUnitDetail?.pending_topics ??
    activeUnitDetail?.metrics?.approved_topics?.pending_count ??
    Math.max(0, totalCourseTopics - reviewedCourseTopics);

  const STAT_TABS = [
    {
      key: "approved-topics",
      label: "Approved Topics",
      count: totalCourseTopics,
      icon: <Check className="h-5 w-5" />,
    },
    {
      key: "pedagogy-recommendations",
      label: "Pending Pedagogy Recommendations",
      subLabel: "Pending Pedagogy Recommendations",
      count: pendingRecommendationsCount,
      icon: <Hourglass className="h-5 w-5" />,
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
        academicYear={`${state?.courseDetail?.batch_name}`}
        students={state?.courseDetail?.students_count}
        selectedCourse={state.selectedCourse}
        courseOptions={state.courseList}
        onCourseChange={(val) => {
          setState({ selectedCourse: val });
          router.push(`/neurobe/pedagogy?course_id=${val.value}`);
        }}
        activeView={state.activeBannerTab}
        onBack={() => {
          if (fromParam === "my-courses") {
            router.push("/neurobe/my-assigned-courses");
          } else {
            router.back();
          }
        }}
        onViewChange={(view) => setState({ activeBannerTab: view })}
      />


      <PageHeader
         title="Pedagogy"
        records={state.courseDetail ? `${state.courseDetail.course_code} — ${state.courseDetail.course_title}` : ""}
        subtitle={`Choose suitable teaching methods for the approved topics.`}
        icon={<Lightbulb className="h-5 w-5 text-color2" />}
      />

      {course_id && (
        <StageVersionHistoryPanel
          stage="pedagogy"
          stageLabel="Pedagogy Suggestions"
          courseId={course_id}
          onVersionActivated={handleVersionActivated}
          onVersionLoad={handleVersionActivated}
          onGenerateNew={handleGenerateRecommendations}
          isGenerating={state.generatingRecommendations}
        />
      )}

      {/* ── Stat tabs — shown only before recommendations are generated ── */}
      {!state.recommendationsGenerated && (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {STAT_TABS.map((tab) => (
            <StatTabCard
              key={tab.key}
              icon={tab.icon}
              label={tab.label}
              subLabel={tab.subLabel}
              count={tab.count}
              active={state.activeTab === tab.key}
            />
          ))}
        </div>
      )}

      {/* ── Progress bar — shown after recommendations are generated ── */}
      {state.recommendationsGenerated && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-[#000] dark:text-white">Pedagogy Review Progress</p>
              <p className="mt-0.5 text-xs text-pri">{reviewedCourseTopics}/{totalCourseTopics} Topics Reviewed</p>
            </div>
            <span className="text-xs font-semibold text-color2">
              {progressPercentage}% Complete
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-color2 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

        <TableTitle
        title="Approved Topics"
        label={`${computedTotalUnits} Units`}
        subLabel={`${computedTotalTopics} Topics`}
        />

      <div className="mt-4">
        <GenericTabs
          tabs={unitTabs}
          activeKey={state.activeTab}
          onChange={(unit) => handleTabChange(unit)}
        />

        

        <AccordiansStyle
          expandable={state.recommendationsGenerated}
          topics={state.recommendationsGenerated ? buildTopics() : buildInitialTopics()}
          title={
            activeUnitDetail?.selected_unit?.unit_title ||
            activeUnitDetail?.unit_title ||
            state.unitsList.find((u: any) => u.unit_number === activeUnitNum)?.unit_title ||
            `Unit ${activeUnitNum}`
          }
          subtitle={
            state.recommendationsGenerated
              ? "Click a topic to expand and view recommended teaching methods."
              : "Approved syllabus topics ready for pedagogy assignment."
          }
          expandedSectionLabel={<><Sparkles className="h-3.5 w-3.5" /> Recommended Teaching Methods</>}
          footerContent={
            state.recommendationsGenerated ? (
              <><RefreshCw className="h-3 w-3" /> Review the recommendations above and select the methods that best fit this topic.</>
            ) : (
              <><Sparkles className="h-4 w-4" /> NEURO AI will use each topic, its Knowledge Level, and duration to recommend up to 3 suitable teaching methods.</>
            )
          }
          renderModals={() => (
            <>
              <EditPedagogyModal
                open={editModal.open}
                onClose={() => setEditModal((p) => ({ ...p, open: false }))}
                topicLabel={editModal.topicLabel}
                initialTitle={editModal.title}
                initialDescription={editModal.description}
              />
              <ReplacePedagogyModal
                open={replaceModal.open}
                onClose={() => setReplaceModal((p) => ({ ...p, open: false }))}
                topicLabel={replaceModal.topicLabel}
                currentTitle={replaceModal.currentTitle}
                options={replaceModal.options}
              />
            </>
          )}
        />

        {state.recommendationsGenerated ? (
          <PageFooter
            content1={`Status: ${reviewedCourseTopics}/${totalCourseTopics} Topics Reviewed`}
            content2={
              state.courseDetail
                ? `Course: ${state.courseDetail.course_code} — ${state.courseDetail.course_title}`
                : (activeUnitDetail?.course_display_tag || "")
            }
            batch
            actionBtn1={
              state.pedagogyApproved
                ? {
                    label: activeUnitDetail?.bottom_bar?.actions?.next?.label || "Next: Lesson Plan",
                    icon: <Check className="h-4 w-4" />,
                    onClick: () => {
                      const cid = course_id || state.selectedCourse?.value || state.courseDetail?.id;
                      router.push(cid ? `/neurobe/lesson-plan?course_id=${cid}` : "/neurobe/lesson-plan");
                    },
                    className: "create-btn",
                  }
                : {
                    label: state.approvingPedagogy
                      ? "Approving..."
                      : state.upstreamNotApproved
                      ? "Requires Topics Approval"
                      : !allAccepted
                      ? `Complete Pedagogy Review (${reviewedCourseTopics}/${totalCourseTopics} Reviewed)`
                      : (activeUnitDetail?.bottom_bar?.actions?.approve?.label || "Complete Pedagogy Review"),
                    icon: state.approvingPedagogy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />,
                    onClick: handleApprovePedagogy,
                    disabled: !allAccepted || state.approvingPedagogy || state.upstreamNotApproved,
                  }
            }
            actionBtn2={{
              label: activeUnitDetail?.bottom_bar?.actions?.save_draft?.label || "Save Draft",
              icon: <Save className="h-4 w-4" />,
              onClick: () => {},
            }}
          />
        ) : (
          <PageFooter
            content1={
              state.courseDetail
                ? `Course: ${state.courseDetail.course_code} — ${state.courseDetail.course_title}`
                : (activeUnitDetail?.course_display_tag || "")
            }
            content2={activeUnitDetail?.bottom_bar?.subtitle || ""}
            actionBtn1={{
              label: state.generatingRecommendations || state.pollingJob
                ? "Generating..."
                : (activeUnitDetail?.cta_action?.label || "Generate Recommendations with NEURO AI"),
              icon: state.generatingRecommendations || state.pollingJob
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <Sparkles className="h-4 w-4" />,
              onClick: handleGenerateRecommendations,
              disabled: state.generatingRecommendations || state.pollingJob,
              className: "create-btn",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PrivateRouter(Pedagogy);
