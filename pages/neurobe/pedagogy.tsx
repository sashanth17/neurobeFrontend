import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { Check, EditIcon, Hourglass, Lightbulb, Presentation, RefreshCw, ReplaceAll, Save, Sparkles } from "lucide-react";
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
import { UNIT_TABS } from "@/utils/constant.utils";
import PageHeader from "@/components/common-components/PageHeader";
import Models from "@/imports/models.import";

// ─── Static config ────────────────────────────────────────────────────────────





// Raw source data — no AccordiansStyle types here
const RAW_UNIT_DATA: Record<string, {
  title: string;
  topics: { id: string; title: string; level: string; hours: string }[];
  recommendations: { id: string; title: string; badge?: string; description: string; selected?: boolean }[];
}> = {
  "unit-1": {
    title: "Unit 1 — Physical Layer & Network Architectures",
    topics: [
      { id: "1.1", title: "Topic 1.1 — Network Models & Layered Architecture", level: "Knowledge Level K2", hours: "2 Hours" },
      { id: "1.2", title: "Topic 1.2 — Physical Layer & Transmission Media", level: "Knowledge Level K2", hours: "2 Hours" },
      { id: "1.3", title: "Topic 1.3 — Network Topologies & Switching Techniques", level: "Knowledge Level K3", hours: "2.5 Hours" },
      { id: "1.4", title: "Topic 1.4 — Network Performance Metrics", level: "Knowledge Level K2", hours: "2.5 Hours" },
    ],
    recommendations: [
      { id: "r1", title: "Concept Exploration", badge: "Directed", description: "Direct instruction on OSI layers to TCP/IP 5-layer reference models.", selected: true },
      { id: "r2", title: "Guided Discussion", badge: "Directed", description: "Interactive comparison of protocol encapsulation and layer boundaries.", selected: true },
      { id: "r3", title: "Collaborative Learning", description: "Small group mapping of real-world internet protocols to OSI layers." },
    ],
  },
  "unit-2": {
    title: "Unit 2 — Data Link Layer & Error Control",
    topics: [
      { id: "2.1", title: "Topic 2.1 — Framing & Error Detection", level: "Knowledge Level K2", hours: "2 Hours" },
      { id: "2.2", title: "Topic 2.2 — Flow Control Protocols", level: "Knowledge Level K3", hours: "2.5 Hours" },
      { id: "2.3", title: "Topic 2.3 — MAC Protocols & CSMA/CD", level: "Knowledge Level K3", hours: "2.5 Hours" },
    ],
    recommendations: [
      { id: "r1", title: "Problem-Based Learning", description: "Solve CRC and checksum problems with real packet examples.", selected: true },
      { id: "r2", title: "Simulation Lab", description: "Use Wireshark to capture and analyze data link frames." },
      { id: "r3", title: "Peer Teaching", description: "Students explain sliding window protocols to each other." },
    ],
  },
  "unit-3": {
    title: "Unit 3 — Network Layer & Routing",
    topics: [
      { id: "3.1", title: "Topic 3.1 — IP Addressing & Subnetting", level: "Knowledge Level K3", hours: "3 Hours" },
      { id: "3.2", title: "Topic 3.2 — Routing Algorithms", level: "Knowledge Level K4", hours: "3 Hours" },
      { id: "3.3", title: "Topic 3.3 — IPv6 & Transition Mechanisms", level: "Knowledge Level K2", hours: "2 Hours" },
      { id: "3.4", title: "Topic 3.4 — ICMP & Network Diagnostics", level: "Knowledge Level K3", hours: "2 Hours" },
    ],
    recommendations: [
      { id: "r1", title: "Case Study Analysis", description: "Analyze real-world routing table configurations.", selected: true },
      { id: "r2", title: "Hands-on Lab", description: "Configure static and dynamic routing using Cisco Packet Tracer." },
      { id: "r3", title: "Flipped Classroom", description: "Students watch routing algorithm videos before class discussion." },
    ],
  },
  "unit-4": {
    title: "Unit 4 — Transport Layer & TCP/UDP",
    topics: [
      { id: "4.1", title: "Topic 4.1 — TCP Connection Management", level: "Knowledge Level K3", hours: "3 Hours" },
      { id: "4.2", title: "Topic 4.2 — UDP & Real-time Applications", level: "Knowledge Level K2", hours: "2 Hours" },
      { id: "4.3", title: "Topic 4.3 — Congestion Control Mechanisms", level: "Knowledge Level K4", hours: "3 Hours" },
    ],
    recommendations: [
      { id: "r1", title: "Demonstration", description: "Live demo of TCP three-way handshake using network tools.", selected: true },
      { id: "r2", title: "Comparative Analysis", description: "Compare TCP vs UDP performance in different scenarios." },
      { id: "r3", title: "Project Work", description: "Build a simple client-server application using sockets." },
    ],
  },
  "unit-5": {
    title: "Unit 5 — Application Layer & Security",
    topics: [
      { id: "5.1", title: "Topic 5.1 — DNS & HTTP Protocols", level: "Knowledge Level K2", hours: "2 Hours" },
      { id: "5.2", title: "Topic 5.2 — Email & FTP Protocols", level: "Knowledge Level K2", hours: "2 Hours" },
      { id: "5.3", title: "Topic 5.3 — Network Security Fundamentals", level: "Knowledge Level K3", hours: "3 Hours" },
    ],
    recommendations: [
      { id: "r1", title: "Interactive Demo", description: "Trace HTTP requests using browser developer tools.", selected: true },
      { id: "r2", title: "Guest Lecture", description: "Industry expert on real-world network security practices." },
      { id: "r3", title: "Research Assignment", description: "Investigate a recent network security breach and present findings." },
    ],
  },
};

const totalTopics = UNIT_TABS.reduce((a, b) => a + b.count, 0);
const totalUnits = UNIT_TABS.length;
const totalRecs = Object.values(RAW_UNIT_DATA).reduce((s, u) => s + u.recommendations.length, 0);

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
  const course_id = useSearchParams().get("course_id");

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
  });

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  // accepted set per unit-tab
  const [acceptedMap, setAcceptedMap] = useState<Record<string, Set<string>>>({});

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
    } else {
      getUnits(1);
    }
  }, [course_id]);

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
      }, 0)
    ;

  const allAccepted = state.acceptedCount >= totalRecs;
  const raw = RAW_UNIT_DATA[state.activeTab];
  const accepted = acceptedMap[state.activeTab] ?? new Set<string>(
    raw?.recommendations.filter((r) => r.selected).map((r) => r.id) ?? []
  );

  const toggleAccept = (unitKey: string, recId: string) => {
    setAcceptedMap((prev) => {
      const current = prev[unitKey] ?? new Set<string>(
        RAW_UNIT_DATA[unitKey]?.recommendations.filter((r) => r.selected).map((r) => r.id) ?? []
      );
      const next = new Set(current);
      if (next.has(recId)) next.delete(recId); else next.add(recId);
      // recount total
      const newMap = { ...prev, [unitKey]: next };
      const total = Object.entries(newMap).reduce((s, [k, set]) => s + set.size, 0);
      setState({ acceptedCount: total });
      return newMap;
    });
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

  const getUnits = async (syllabusId?: any) => {
    const sid = syllabusId || state.courseDetail?.latest_syllabus?.id;
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
        getUnitDetail(sid, initialUnitNum);
      } else {
        setState({ loadingUnits: false });
        getUnitDetail(sid, 1);
      }
    } catch (error: any) {
      console.log("error fetching units", error);
      setState({ loadingUnits: false });
      Failure(getErrorMessage(error, "Failed to fetch syllabus units"));
    }
  };


  const getUnitDetail = async (syllabusId?: any, unitNumber?: any) => {
    const sid = syllabusId || state.courseDetail?.latest_syllabus?.id || state.unitsList?.[0]?.syllabus_id;
    const uNum = unitNumber ?? state.activeUnitNumber;
    try {
      setState({ loadingUnitDetail: true });
      const res: any = await Models.pedagogy.unit_detail(sid, uNum);
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
    getUnitDetail(sid, unitNum);
  };

  const handleGenerateRecommendations = async () => {
    const sid =
      state.courseDetail?.latest_syllabus?.id ||
      state.unitsList?.[0]?.syllabus_id ||
      activeUnitDetail?.syllabus_id;
    try {
      setState({ generatingRecommendations: true });
      const res: any = await Models.pedagogy.generate(sid, {});
      const jobId = res?.job_id;
      if (jobId) {
        setState({ pollingJob: true });
        pollRef.current = setInterval(async () => {
          try {
            const jobRes: any = await Models.pedagogy.jobStatus(jobId);
            const status = jobRes?.status ?? jobRes?.state?.live_redis_status ?? jobRes?.result?.status;
            if (status === "complete" || status === "completed" || status === "success" || status === "finished") {
              stopPolling();
              setState({ generatingRecommendations: false, pollingJob: false, recommendationsGenerated: true });
              Success(res?.message || "Pedagogy recommendations generated successfully");
              getUnitDetail(sid, activeUnitNum);
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
      } else {
        // no job_id — treat as immediate success
        setState({ generatingRecommendations: false, recommendationsGenerated: true });
        Success(res?.message || "Pedagogy recommendations generated successfully");
        getUnitDetail(sid, activeUnitNum);
      }
    } catch (error: any) {
      console.log("error generating recommendations", error);
      setState({ generatingRecommendations: false });
      Failure(getErrorMessage(error, "Failed to generate pedagogy recommendations"));
    }
  };
  

  // Build AccordionTopic[] from raw data + accepted state
  const buildTopics = () => {
    if (!raw) return [];
    return raw.topics.map((topic) => {
      const items= raw.recommendations.map((rec, idx) => {
        const isAccepted = accepted.has(rec.id);
        const actions = [];

        actions.push({
          key: "edit",
          label: "Edit",
          icon: <EditIcon className="h-3.5 w-3.5" />,
          className: "flex items-center gap-1.5 rounded-full border border-gray-400 px-3 py-1 text-xs font-semibold text-pri hover:border-[#000] hover:text-[#000]",
          onClick: (item) => setEditModal({
            open: true,
            title: item.title,
            description: item.description ?? "",
            topicLabel: topic.title,
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
              currentTitle: rec.title,
              topicLabel: topic.title,
              options: raw.recommendations.map((r) => ({ title: r.title, description: r.description })),
            }),
          });
          actions.push({
            key: "selected",
            label: "Selected",
            asTag: true,
            className: "rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white",
          });
        } else {
          actions.push({
            key: "accept",
            label: "Accept",
            className: "rounded-full border border-color2 px-3 py-1 text-xs font-semibold text-color2 hover:bg-color2-l",
            onClick: () => toggleAccept(state.activeTab, rec.id),
          });
        }

        return {
          id: rec.id,
          index: idx + 1,
          title: rec.title,
          description: rec.description,
          badge: rec.badge ? { label: rec.badge, className: "bg-green-500" } : undefined,
          highlighted: isAccepted,
          actions,
        };
      });

      return {
        id: topic.id,
        title: topic.title,
        meta: `${topic.level} · ${topic.hours} Hours`,
        collapsedBadge: { label: "Needs Review", className: "border border-orange-200 bg-orange-50 text-orange-600" },
        expandedBadge: { label: "Reviewed", className: "border border-green-200 bg-green-50 text-green-700" },
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
    if (!raw) return [];
    return raw.topics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      collapsedBadge: [{ label: topic.level, className: "bg-color2-l text-color2 font-bold" }, { label: topic.hours, className: "bg-gray-200 text-pri font-bold" }],
      items: [],
    }));
  };

  console.log("state?.unitDetailsMap?.metrics?.approved_topics?.value", state?.unitDetailsMap);
  

  const STAT_TABS = [
  { key: "approved-topics", label: "Approved Topics", count: state?.unitDetailsMap?.metrics?.approved_topics?.value, icon: <Check className="h-5 w-5" /> },
  { key: "pedagogy-recommendations", label: "Pending Pedagogy Recommendations", subLabel: "Pending Pedagogy Recommendations", count: 4, icon: <Hourglass className="h-5 w-5" /> },
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
        onBack={() => router.back()}
        onViewChange={(view) => setState({ activeBannerTab: view })}
      />


      <PageHeader
         title="Pedagogy"
        records={state.courseDetail ? `${state.courseDetail.course_code} — ${state.courseDetail.course_title}` : ""}
        subtitle={`Choose suitable teaching methods for the approved topics.`}
        icon={<Lightbulb className="h-5 w-5 text-color2" />}
        
      />

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
              <p className="mt-0.5 text-xs text-pri">{state.acceptedCount}/{totalRecs} Topics Reviewed</p>
            </div>
            <span className="text-xs font-semibold text-color2">
              {totalRecs > 0 ? Math.round((state.acceptedCount / totalRecs) * 100) : 0}% Complete
            </span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-color2 transition-all duration-500"
              style={{ width: `${totalRecs > 0 ? (state.acceptedCount / totalRecs) * 100 : 0}%` }}
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
          title={activeUnitDetail?.selected_unit?.unit_title || activeUnitDetail?.unit_title || raw?.title}
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
            content1={`Status: ${state.acceptedCount}/${totalRecs} Accepted`}
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
                    label: activeUnitDetail?.bottom_bar?.actions?.approve?.label || "Complete Pedagogy Review",
                    icon: <Check className="h-4 w-4" />,
                    onClick: () => { Success("Pedagogy approved successfully"); setState({ pedagogyApproved: true }); },
                    disabled: !allAccepted,
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
