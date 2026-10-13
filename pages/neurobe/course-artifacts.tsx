import React, { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  BookOpen,
  Layers,
  GraduationCap,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  Presentation,
  Calendar,
  ArrowLeft,
  Upload,
  FileText,
  ShieldCheck,
  UserCheck,
  Check,
  History,
  Columns,
  Edit2,
  Plus,
  Trash2,
  Save,
  X,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import {
  Success,
  Failure,
  getErrorMessage,
  isLimitExhaustion,
  showLimitExhaustedModal,
  LIMIT_EXHAUSTED_MESSAGE,
} from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import Models from "@/imports/models.import";
import { normalizeCoCode } from "@/hook/useCourseOutcomes";
import PDFViewer from "@/components/academic-setup/PDFViewer";
import CourseAttainmentReport from "@/components/academic-setup/CourseAttainmentReport";
import CoursePortfolioReport from "@/components/academic-setup/CoursePortfolioReport";
import CiaAnalyticsTab from "@/components/academic-setup/CiaAnalyticsTab";
import McqVivaTab from "@/components/academic-setup/McqVivaTab";
import {
  SimplifiedMCQGenerator,
  HierarchyUnitItem,
} from "@/components/mcq-generation/SimplifiedMCQGenerator";
import { BACKEND_URL } from "@/utils/constant.utils";

interface VersionSortConfig {
  idKey: string;
}

const sortAndNumberVersions = (items: any[], config: VersionSortConfig): any[] => {
  if (!Array.isArray(items)) {
    return [];
  }
  return [...items]
    .sort((a, b) => Number(a[config.idKey]) - Number(b[config.idKey]))
    .map((item, index) => ({
      ...item,
      version_number: index + 1,
    }));
};

const InsCourseArtifacts = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const courseIdParam = useMemo(() => {
    if (typeof router.query.course_id === "string") return router.query.course_id;
    if (typeof router.query.id === "string") return router.query.id;
    if (typeof window !== "undefined") return localStorage.getItem("active_course_id");
    return null;
  }, [router.query.course_id, router.query.id]);

  useEffect(() => {
    if (courseIdParam) {
      try {
        localStorage.setItem("active_course_id", courseIdParam);
      } catch {}
    }
  }, [courseIdParam]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    | "syllabus"
    | "copo"
    | "pedagogy"
    | "lesson_plan"
    | "mcq_generation"
    | "co-attainment"
    | "report"
    | "cia_analytics"
    | "mcq_viva"
  >("syllabus");

  const [sectionData, setSectionData] = useState<{
    syllabus?: any;
    copo?: any;
    pedagogy?: any;
    lesson_plan?: any;
  }>({});

  const [sectionVersions, setSectionVersions] = useState<{
    syllabi: any[];
    extractions: any[];
    copo: any[];
    pedagogies: any[];
    lesson_plans: any[];
  }>({
    syllabi: [],
    extractions: [],
    copo: [],
    pedagogies: [],
    lesson_plans: [],
  });

  const [sectionLoading, setSectionLoading] = useState<{
    syllabus: boolean;
    copo: boolean;
    pedagogy: boolean;
    lesson_plan: boolean;
  }>({
    syllabus: false,
    copo: false,
    pedagogy: false,
    lesson_plan: false,
  });

  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const [jobNotice, setJobNotice] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    dispatch(setPageTitle("Course Artifacts Portfolio"));
  }, [dispatch]);

  const course = useMemo(() => portfolio?.course ?? {}, [portfolio]);
  const perms = useMemo(
    () =>
      portfolio?.permissions ?? {
        is_coordinator: false,
        can_edit: false,
        can_upload_syllabus: false,
        can_approve: false,
        can_activate: false,
        can_generate_copo: false,
        can_generate_pedagogy: false,
        can_generate_lesson_plan: false,
      },
    [portfolio]
  );

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const userRole = useMemo(() => {
    if (typeof window !== "undefined") {
      if (currentUser?.role) return String(currentUser.role).toLowerCase();
      const localRole = localStorage.getItem("role");
      if (localRole) return localRole.toLowerCase();
      const localGroup = localStorage.getItem("group");
      if (localGroup) return localGroup.toLowerCase();
    }
    return "";
  }, [currentUser]);

  const isCoord = useMemo(() => {
    if (perms.is_coordinator) return true;
    if (perms.can_edit) return true;
    if (userRole.includes("coordinator")) return true;
    if (userRole === "admin") return true;
    if (userRole === "super_admin") return true;
    if (currentUser?.id && course?.coordinator_id === currentUser.id) return true;
    return false;
  }, [perms, userRole, currentUser, course]);

  const [selectedVersionData, setSelectedVersionData] = useState<{
    syllabus?: any;
    copo?: any;
    pedagogy?: any;
    lesson_plan?: any;
  }>({});
  const [loadingVersionDetail, setLoadingVersionDetail] = useState<boolean>(false);

  // Normalized, sorted, and indexed version lists
  const versionsExtractions = useMemo(() => {
    const source =
      sectionVersions.extractions.length > 0
        ? sectionVersions.extractions
        : (portfolio?.versions?.extractions ?? []);
    return sortAndNumberVersions(source, { idKey: "extractions_id" });
  }, [sectionVersions.extractions, portfolio?.versions?.extractions]);

  const versionsCopo = useMemo(() => {
    const source =
      sectionVersions.copo.length > 0
        ? sectionVersions.copo
        : (portfolio?.versions?.copo ?? []);
    return sortAndNumberVersions(source, { idKey: "copo_id" });
  }, [sectionVersions.copo, portfolio?.versions?.copo]);

  const versionsPedagogies = useMemo(() => {
    const source =
      sectionVersions.pedagogies.length > 0
        ? sectionVersions.pedagogies
        : (portfolio?.versions?.pedagogies ?? []);
    return sortAndNumberVersions(source, { idKey: "pedagogy_id" });
  }, [sectionVersions.pedagogies, portfolio?.versions?.pedagogies]);

  const versionsLessonPlans = useMemo(() => {
    const source =
      sectionVersions.lesson_plans.length > 0
        ? sectionVersions.lesson_plans
        : (portfolio?.versions?.lesson_plans ?? []);
    return sortAndNumberVersions(source, { idKey: "lesson_plan_id" });
  }, [sectionVersions.lesson_plans, portfolio?.versions?.lesson_plans]);

  const versionsSyllabi = useMemo(() => {
    const source =
      sectionVersions.syllabi.length > 0
        ? sectionVersions.syllabi
        : (portfolio?.versions?.syllabi ?? []);
    return sortAndNumberVersions(source, { idKey: "course_syllabus_id" });
  }, [sectionVersions.syllabi, portfolio?.versions?.syllabi]);

  const activeExt = sectionData.syllabus ?? portfolio?.active_extraction ?? null;
  const activeCopo = sectionData.copo ?? portfolio?.active_copo ?? null;
  const activePedagogy = sectionData.pedagogy ?? portfolio?.active_pedagogy ?? null;
  const activeLessonPlan = sectionData.lesson_plan ?? portfolio?.active_lesson_plan ?? null;

  const currentExt = selectedVersionData.syllabus ?? activeExt;
  const currentCopo = selectedVersionData.copo ?? activeCopo;
  const currentPedagogy = selectedVersionData.pedagogy ?? activePedagogy;
  const currentLessonPlan = selectedVersionData.lesson_plan ?? activeLessonPlan;

  const activeSyllabus = useMemo(() => {
    const activeMatch = versionsSyllabi.find((s: any) => Boolean(s.is_active));
    if (activeMatch) return activeMatch;
    if (currentExt?.course_syllabus_id) {
      const match = versionsSyllabi.find(
        (s: any) => s.course_syllabus_id === currentExt.course_syllabus_id
      );
      if (match) return match;
    }
    if (portfolio?.active_syllabus) return portfolio.active_syllabus;
    if (versionsSyllabi.length > 0) return versionsSyllabi[0];
    return null;
  }, [versionsSyllabi, currentExt, portfolio]);

  const refreshCurrentVersion = async (
    tab: "syllabus" | "copo" | "pedagogy" | "lesson_plan",
    id?: number
  ) => {
    try {
      if (tab === "syllabus") {
        const extId = id ?? selectedVersionData.syllabus?.extractions_id ?? currentExt?.extractions_id;
        if (extId) {
          const full = await Models.syllabus.get_extraction(extId);
          if (selectedVersionData.syllabus || isCoord) {
            setSelectedVersionData((prev) => ({ ...prev, syllabus: full }));
          }
          setSectionData((prev) => ({ ...prev, syllabus: full }));
        }
      } else if (tab === "copo") {
        const copoId = id ?? selectedVersionData.copo?.copo_id ?? currentCopo?.copo_id;
        if (copoId) {
          const full = await Models.copo.get(copoId);
          if (selectedVersionData.copo || isCoord) {
            setSelectedVersionData((prev) => ({ ...prev, copo: full }));
          }
          setSectionData((prev) => ({ ...prev, copo: full }));
        }
      } else if (tab === "pedagogy") {
        const pedId = id ?? selectedVersionData.pedagogy?.pedagogy_id ?? currentPedagogy?.pedagogy_id;
        if (pedId) {
          const full = await Models.pedagogy.get(pedId);
          if (selectedVersionData.pedagogy || isCoord) {
            setSelectedVersionData((prev) => ({ ...prev, pedagogy: full }));
          }
          setSectionData((prev) => ({ ...prev, pedagogy: full }));
        }
      } else if (tab === "lesson_plan") {
        const lpId = id ?? selectedVersionData.lesson_plan?.lesson_plan_id ?? currentLessonPlan?.lesson_plan_id;
        if (lpId) {
          const full = await Models.lession_plan.get(lpId);
          if (selectedVersionData.lesson_plan || isCoord) {
            setSelectedVersionData((prev) => ({ ...prev, lesson_plan: full }));
          }
          setSectionData((prev) => ({ ...prev, lesson_plan: full }));
        }
      }
    } catch (err) {
      console.error(`Failed to refresh version data for ${tab}:`, err);
    }
  };

  const loadSectionData = async (
    tab:
      | "syllabus"
      | "copo"
      | "pedagogy"
      | "lesson_plan"
      | "mcq_generation"
      | "co-attainment"
      | "report"
      | "cia_analytics"
      | "mcq_viva",
    forceRefresh = false,
    coordOverride?: boolean
  ) => {
    if (!courseIdParam) return;
    if (
      tab === "co-attainment" ||
      tab === "report" ||
      tab === "cia_analytics" ||
      tab === "mcq_viva" ||
      tab === "mcq_generation"
    )
      return;

    const userIsCoord = coordOverride !== undefined ? coordOverride : isCoord;
    setSectionLoading((prev) => ({ ...prev, [tab]: true }));

    try {
      if (userIsCoord) {
        if (tab === "syllabus") {
          const [extractionsRes, syllabiRes]: [any, any] = await Promise.all([
            Models.syllabus.list_extractions({ course_id: courseIdParam }),
            Models.syllabus.list_syllabi({ course_id: courseIdParam }),
          ]);
          setSectionVersions((prev) => ({
            ...prev,
            extractions: Array.isArray(extractionsRes) ? extractionsRes : [],
            syllabi: Array.isArray(syllabiRes) ? syllabiRes : [],
          }));
          if (selectedVersionData.syllabus?.extractions_id) {
            try {
              const full = await Models.syllabus.get_extraction(
                selectedVersionData.syllabus.extractions_id
              );
              setSelectedVersionData((prev) => ({ ...prev, syllabus: full }));
            } catch {}
          }
        } else if (tab === "copo") {
          const copoRes: any = await Models.copo.list({ course_id: courseIdParam });
          setSectionVersions((prev) => ({
            ...prev,
            copo: Array.isArray(copoRes) ? copoRes : [],
          }));
          if (selectedVersionData.copo?.copo_id) {
            try {
              const full = await Models.copo.get(selectedVersionData.copo.copo_id);
              setSelectedVersionData((prev) => ({ ...prev, copo: full }));
            } catch {}
          }
        } else if (tab === "pedagogy") {
          const [pedRes, extractionsRes]: [any, any] = await Promise.all([
            Models.pedagogy.list({ course_id: courseIdParam }),
            sectionVersions.extractions.length > 0
              ? Promise.resolve(sectionVersions.extractions)
              : Models.syllabus.list_extractions({ course_id: courseIdParam }),
          ]);
          setSectionVersions((prev) => ({
            ...prev,
            pedagogies: Array.isArray(pedRes) ? pedRes : [],
            extractions: Array.isArray(extractionsRes) ? extractionsRes : [],
          }));
          if (selectedVersionData.pedagogy?.pedagogy_id) {
            try {
              const full = await Models.pedagogy.get(selectedVersionData.pedagogy.pedagogy_id);
              setSelectedVersionData((prev) => ({ ...prev, pedagogy: full }));
            } catch {}
          }
        } else if (tab === "lesson_plan") {
          const [lpRes, extractionsRes, pedRes]: [any, any, any] = await Promise.all([
            Models.lession_plan.list({ course_id: courseIdParam }),
            sectionVersions.extractions.length > 0
              ? Promise.resolve(sectionVersions.extractions)
              : Models.syllabus.list_extractions({ course_id: courseIdParam }),
            sectionVersions.pedagogies.length > 0
              ? Promise.resolve(sectionVersions.pedagogies)
              : Models.pedagogy.list({ course_id: courseIdParam }),
          ]);
          setSectionVersions((prev) => ({
            ...prev,
            lesson_plans: Array.isArray(lpRes) ? lpRes : [],
            extractions: Array.isArray(extractionsRes) ? extractionsRes : [],
            pedagogies: Array.isArray(pedRes) ? pedRes : [],
          }));
          if (selectedVersionData.lesson_plan?.lesson_plan_id) {
            try {
              const full = await Models.lession_plan.get(
                selectedVersionData.lesson_plan.lesson_plan_id
              );
              setSelectedVersionData((prev) => ({ ...prev, lesson_plan: full }));
            } catch {}
          }
        }
      } else {
        if (tab === "syllabus") {
          const act = await Models.syllabus.get_active_extraction(courseIdParam);
          setSectionData((prev) => ({ ...prev, syllabus: act }));
        } else if (tab === "copo") {
          const act = await Models.copo.get_active(courseIdParam);
          setSectionData((prev) => ({ ...prev, copo: act }));
        } else if (tab === "pedagogy") {
          const act = await Models.pedagogy.get_active(courseIdParam);
          setSectionData((prev) => ({ ...prev, pedagogy: act }));
        } else if (tab === "lesson_plan") {
          const act = await Models.lession_plan.get_active(courseIdParam);
          setSectionData((prev) => ({ ...prev, lesson_plan: act }));
        }
      }
    } catch (err: any) {
      console.error(`Failed to load section data for ${tab}:`, err);
    } finally {
      setSectionLoading((prev) => ({ ...prev, [tab]: false }));
    }
  };

  const fetchPortfolio = async (isManualRefresh = false) => {
    if (!courseIdParam) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res: any = await Models.course.course_portfolio(courseIdParam);
      setPortfolio(res);

      let role = "";
      let uid: any = null;
      try {
        const uStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (uStr) {
          const u = JSON.parse(uStr);
          role = String(u.role).toLowerCase();
          uid = u.id;
        }
        if (!role && typeof window !== "undefined") {
          const r = localStorage.getItem("role");
          if (r) role = r.toLowerCase();
          else {
            const g = localStorage.getItem("group");
            if (g) role = g.toLowerCase();
          }
        }
      } catch {}

      const userIsCoord = Boolean(
        res?.permissions?.is_coordinator ||
          res?.permissions?.can_edit ||
          role.includes("coordinator") ||
          role === "admin" ||
          role === "super_admin" ||
          (uid && res?.course && res.course.coordinator_id === uid)
      );
      loadSectionData(activeTab, true, userIsCoord);
    } catch (err: any) {
      console.error("Failed to load course portfolio:", err);
      setError(getErrorMessage(err, "Failed to load course portfolio"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [courseIdParam]);

  useEffect(() => {
    if (courseIdParam && portfolio) {
      loadSectionData(activeTab);
    }
  }, [activeTab]);

  const isBusyState = (state?: string) =>
    state === "redis_queued" || state === "sent_to_llm" || state === "processing";

  const isExtractionBusy = Boolean(
    versionsExtractions.some((e: any) => isBusyState(e.current_state))
  );
  const isCopoBusy = Boolean(
    versionsCopo.some((c: any) => isBusyState(c.current_state))
  );
  const isPedagogyBusy = Boolean(
    versionsPedagogies.some((p: any) => isBusyState(p.current_state))
  );
  const isLessonPlanBusy = Boolean(
    versionsLessonPlans.some((l: any) => isBusyState(l.current_state))
  );

  const [showGenerateCopoModal, setShowGenerateCopoModal] = useState<boolean>(false);
  const [selectedExtractionForCopo, setSelectedExtractionForCopo] = useState<number | null>(null);

  const [showGeneratePedagogyModal, setShowGeneratePedagogyModal] = useState<boolean>(false);
  const [selectedExtractionForPedagogy, setSelectedExtractionForPedagogy] = useState<number | null>(null);

  const [showGenerateLessonPlanModal, setShowGenerateLessonPlanModal] = useState<boolean>(false);
  const [selectedExtractionForLp, setSelectedExtractionForLp] = useState<number | null>(null);
  const [selectedPedagogyForLp, setSelectedPedagogyForLp] = useState<number | null>(null);
  const [lpTargetHours, setLpTargetHours] = useState<number>(45);

  const [copoEditingCell, setCopoEditingCell] = useState<any | null>(null);
  const [copoDirtyCells, setCopoDirtyCells] = useState<
    Record<number, { matrix_value: number; justification?: string }>
  >({});
  const [savingCopoDelta, setSavingCopoDelta] = useState<boolean>(false);

  const [editingPedagogyTopicId, setEditingPedagogyTopicId] = useState<number | null>(null);
  const [pedagogyDraft, setPedagogyDraft] = useState<{
    bloom_level_1?: string;
    pedagogy_suggested_1?: string;
    description_1?: string;
    methodology_1?: string;
    bloom_level_2?: string;
    pedagogy_suggested_2?: string;
    description_2?: string;
    methodology_2?: string;
    bloom_level_3?: string;
    pedagogy_suggested_3?: string;
    description_3?: string;
    methodology_3?: string;
  }>({});
  const [savingPedagogyTopic, setSavingPedagogyTopic] = useState<boolean>(false);

  const [editingLpSlotId, setEditingLpSlotId] = useState<number | null>(null);
  const [lpSlotDraft, setLpSlotDraft] = useState<{
    time_allocated?: number;
    bloom_level?: string;
    suggested_activity?: string;
  }>({});
  const [savingLpSlot, setSavingLpSlot] = useState<boolean>(false);

  const [editingLpSubtopicSlotId, setEditingLpSubtopicSlotId] = useState<number | null>(null);
  const [lpSubtopicSlotDraft, setLpSubtopicSlotDraft] = useState<{
    time_allocated?: number;
    bloom_level?: string;
    suggested_activity?: string;
  }>({});
  const [savingLpSubtopicSlot, setSavingLpSubtopicSlot] = useState<boolean>(false);

  const [splitScreenView, setSplitScreenView] = useState<boolean>(false);
  const [documentBlobUrl, setDocumentBlobUrl] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<boolean>(false);

  useEffect(() => {
    if (!splitScreenView) return;
    const sylId = activeSyllabus?.course_syllabus_id;
    if (!sylId) {
      setDocumentBlobUrl(null);
      return;
    }

    let isMounted = true;
    setLoadingDoc(true);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : "";
    const directFileUrl = `${BACKEND_URL}course/syllabi/${sylId}/file${tokenParam}`;

    Models.syllabus
      .getFileBlob(sylId)
      .then((blob: any) => {
        if (!isMounted) return;
        if (blob instanceof Blob && blob.size > 0) {
          const pdfBlob =
            blob.type === "application/pdf"
              ? blob
              : new Blob([blob], { type: "application/pdf" });
          const url = URL.createObjectURL(pdfBlob);
          setDocumentBlobUrl(url);
        } else {
          setDocumentBlobUrl(directFileUrl);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setDocumentBlobUrl(directFileUrl);
      })
      .finally(() => {
        if (isMounted) setLoadingDoc(false);
      });

    return () => {
      isMounted = false;
    };
  }, [splitScreenView, activeSyllabus?.course_syllabus_id]);

  const handleUploadSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExtractionBusy) {
      Failure("An extraction job is already in progress for this course. Please wait for it to complete.");
      return;
    }
    if (!uploadFile || !courseIdParam) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("course_id", String(courseIdParam));
      formData.append("file", uploadFile);

      const res: any = await Models.syllabus.upload(formData);
      Success("Syllabus document uploaded! AI Extraction has been queued.");
      setShowUploadModal(false);
      setUploadFile(null);
      setJobNotice(
        "A syllabus extraction job has been queued. When processing completes, please click the Refresh button above to load the extracted curriculum."
      );
      if (res?.extractions_id) {
        setSelectedVersionData((prev) => ({ ...prev, syllabus: res }));
      }
      fetchPortfolio(true);
      loadSectionData("syllabus", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to upload syllabus document"));
    } finally {
      setUploading(false);
    }
  };

  const handleApproveExtraction = async (specificId?: number) => {
    const targetId = specificId ?? currentExt?.extractions_id;
    if (!targetId) return;
    try {
      setActionLoading(`approve_syllabus_${targetId}`);
      await Models.syllabus.extraction_approve(targetId);
      Success("Curriculum extraction approved successfully!");
      fetchPortfolio(true);
      loadSectionData("syllabus", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve extraction"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateExtraction = async (specificId?: number) => {
    const targetId = specificId ?? currentExt?.extractions_id;
    if (!targetId) return;
    try {
      setActionLoading(`activate_syllabus_${targetId}`);
      await Models.syllabus.extraction_activate(targetId);
      Success("Extraction activated as current version!");
      setSelectedVersionData((prev) => ({ ...prev, syllabus: undefined }));
      fetchPortfolio(true);
      loadSectionData("syllabus", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate extraction"));
    } finally {
      setActionLoading(null);
    }
  };

  const openGenerateCopoModal = () => {
    if (isCopoBusy) {
      Failure("A CO-PO generation job is already in progress for this course.");
      return;
    }
    const approvedExts = versionsExtractions.filter((e: any) => Boolean(e.is_approved));
    if (approvedExts.length === 0) {
      Failure("No approved extraction found. Please approve an extraction version first.");
      return;
    }
    setSelectedExtractionForCopo(approvedExts[0].extractions_id);
    setShowGenerateCopoModal(true);
  };

  const handleConfirmGenerateCopo = async () => {
    if (isCopoBusy) {
      Failure("A CO-PO generation job is already in progress for this course.");
      return;
    }
    if (!selectedExtractionForCopo) return;
    try {
      setActionLoading("generate_copo");
      const res: any = await Models.copo.generate({ extractions_id: selectedExtractionForCopo });
      Success("CO-PO mapping generation queued!");
      setShowGenerateCopoModal(false);
      setJobNotice(
        "CO-PO mapping generation is queued. When completed, click the Refresh button to load the generated matrix."
      );
      if (res?.copo_id) {
        setSelectedVersionData((prev) => ({ ...prev, copo: res }));
      }
      fetchPortfolio(true);
      loadSectionData("copo", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to trigger CO-PO generation"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveCopo = async (specificId?: number) => {
    const targetId = specificId ?? currentCopo?.copo_id;
    if (!targetId) return;
    try {
      setActionLoading(`approve_copo_${targetId}`);
      await Models.copo.approve(targetId);
      Success("CO-PO mapping approved!");
      fetchPortfolio(true);
      loadSectionData("copo", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve CO-PO mapping"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateCopo = async (specificId?: number) => {
    const targetId = specificId ?? currentCopo?.copo_id;
    if (!targetId) return;
    try {
      setActionLoading(`activate_copo_${targetId}`);
      await Models.copo.activate(targetId);
      Success("CO-PO mapping activated as current version!");
      setSelectedVersionData((prev) => ({ ...prev, copo: undefined }));
      fetchPortfolio(true);
      loadSectionData("copo", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate CO-PO mapping"));
    } finally {
      setActionLoading(null);
    }
  };

  const openGeneratePedagogyModal = () => {
    if (isPedagogyBusy) {
      Failure("A pedagogy suggestion generation job is already in progress for this course.");
      return;
    }
    const approvedExts = versionsExtractions.filter((e: any) => Boolean(e.is_approved));
    if (approvedExts.length === 0) {
      Failure("No approved extraction found. Please approve an extraction version first.");
      return;
    }
    setSelectedExtractionForPedagogy(approvedExts[0].extractions_id);
    setShowGeneratePedagogyModal(true);
  };

  const handleConfirmGeneratePedagogy = async () => {
    if (isPedagogyBusy) {
      Failure("A pedagogy suggestion generation job is already in progress for this course.");
      return;
    }
    if (!selectedExtractionForPedagogy) return;
    try {
      setActionLoading("generate_pedagogy");
      const res: any = await Models.pedagogy.generate({
        extractions_id: selectedExtractionForPedagogy,
      });
      Success("Pedagogy suggestions generation queued!");
      setShowGeneratePedagogyModal(false);
      setJobNotice(
        "Pedagogy generation is queued. When completed, click the Refresh button to load the new teaching strategies."
      );
      if (res?.pedagogy_id) {
        setSelectedVersionData((prev) => ({ ...prev, pedagogy: res }));
      }
      fetchPortfolio(true);
      loadSectionData("pedagogy", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to trigger pedagogy generation"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprovePedagogy = async (specificId?: number) => {
    const targetId = specificId ?? currentPedagogy?.pedagogy_id;
    if (!targetId) return;
    try {
      setActionLoading(`approve_pedagogy_${targetId}`);
      await Models.pedagogy.approve(targetId);
      Success("Pedagogy suggestions approved!");
      fetchPortfolio(true);
      loadSectionData("pedagogy", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve pedagogy"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivatePedagogy = async (specificId?: number) => {
    const targetId = specificId ?? currentPedagogy?.pedagogy_id;
    if (!targetId) return;
    try {
      setActionLoading(`activate_pedagogy_${targetId}`);
      await Models.pedagogy.activate(targetId);
      Success("Pedagogy suggestions activated as current version!");
      setSelectedVersionData((prev) => ({ ...prev, pedagogy: undefined }));
      fetchPortfolio(true);
      loadSectionData("pedagogy", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate pedagogy"));
    } finally {
      setActionLoading(null);
    }
  };

  const openGenerateLessonPlanModal = () => {
    if (isLessonPlanBusy) {
      Failure("A lesson plan generation job is already in progress for this course.");
      return;
    }
    const approvedExts = versionsExtractions.filter((e: any) => Boolean(e.is_approved));
    if (approvedExts.length === 0) {
      Failure("No approved extraction found. Please approve an extraction version first.");
      return;
    }
    setSelectedExtractionForLp(approvedExts[0].extractions_id);
    const approvedPeds = versionsPedagogies.filter((p: any) => Boolean(p.is_approved));
    setSelectedPedagogyForLp(approvedPeds.length > 0 ? approvedPeds[0].pedagogy_id : null);
    setLpTargetHours(currentExt?.total_theory_hours ?? 45);
    setShowGenerateLessonPlanModal(true);
  };

  const handleConfirmGenerateLessonPlan = async () => {
    if (isLessonPlanBusy) {
      Failure("A lesson plan generation job is already in progress for this course.");
      return;
    }
    if (!selectedExtractionForLp) return;
    try {
      setActionLoading("generate_lp");
      const res: any = await Models.lession_plan.generate({
        extractions_id: selectedExtractionForLp,
        pedagogy_id: selectedPedagogyForLp ?? undefined,
        target_total_hours: Number(lpTargetHours) || 45,
      });
      Success("Lesson plan generation queued!");
      setShowGenerateLessonPlanModal(false);
      setJobNotice(
        "Lesson plan schedule generation is queued. When completed, click the Refresh button to load the hourly timeline."
      );
      if (res?.lesson_plan_id) {
        setSelectedVersionData((prev) => ({ ...prev, lesson_plan: res }));
      }
      fetchPortfolio(true);
      loadSectionData("lesson_plan", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to trigger lesson plan generation"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveLessonPlan = async (specificId?: number) => {
    const targetId = specificId ?? currentLessonPlan?.lesson_plan_id;
    if (!targetId) return;
    try {
      setActionLoading(`approve_lesson_plan_${targetId}`);
      await Models.lession_plan.approve(targetId);
      Success("Lesson plan approved!");
      fetchPortfolio(true);
      loadSectionData("lesson_plan", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve lesson plan"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateLessonPlan = async (specificId?: number) => {
    const targetId = specificId ?? currentLessonPlan?.lesson_plan_id;
    if (!targetId) return;
    try {
      setActionLoading(`activate_lesson_plan_${targetId}`);
      await Models.lession_plan.activate(targetId);
      Success("Lesson plan activated as current version!");
      setSelectedVersionData((prev) => ({ ...prev, lesson_plan: undefined }));
      fetchPortfolio(true);
      loadSectionData("lesson_plan", true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate lesson plan"));
    } finally {
      setActionLoading(null);
    }
  };

  const [isGeneratingMCQ, setIsGeneratingMCQ] = useState<boolean>(false);
  const [mcqHierarchyUnits, setMcqHierarchyUnits] = useState<HierarchyUnitItem[]>([]);
  const [loadingHierarchyUnits, setLoadingHierarchyUnits] = useState<boolean>(false);

  const fetchTopicHierarchyUnits = async (courseId: string | number) => {
    if (!courseId) return;
    try {
      setLoadingHierarchyUnits(true);
      const portRes: any = await Models.course.course_portfolio(courseId).catch((err: any) => {
        console.warn("Course portfolio fetch error:", err);
        return null;
      });

      let rawUnits: any[] = [];
      if (portRes?.active_extraction?.units) {
        rawUnits = portRes.active_extraction.units;
      } else if (portRes?.active_syllabus?.units) {
        rawUnits = portRes.active_syllabus.units;
      } else if (currentExt?.units) {
        rawUnits = currentExt.units;
      } else {
        const unitsRes: any = await Models.syllabus
          .get_units(courseId, { topic_status: "approved" })
          .catch(() => null);
        rawUnits = Array.isArray(unitsRes) ? unitsRes : [];
      }

      if (Array.isArray(rawUnits) && rawUnits.length > 0) {
        const mapped: HierarchyUnitItem[] = rawUnits.map((u: any, uIdx: number) => ({
          unit_number: Number(u.unit_number) || uIdx + 1,
          unit_title: u.unit_title || `Unit ${uIdx + 1}`,
          topics: (u.topics || []).map((t: any, tIdx: number) => {
            const topicTitle = typeof t === "string" ? t : t.topic_name || `Topic ${tIdx + 1}`;
            const topicCode =
              typeof t === "object" && t.topic_code
                ? String(t.topic_code)
                : `${uIdx + 1}.${tIdx + 1}`;
            const rawSub = typeof t === "object" && Array.isArray(t.subtopics) ? t.subtopics : [];
            return {
              id: topicCode,
              code: topicCode,
              title: topicTitle,
              subtopics: rawSub.map((st: any, sIdx: number) => ({
                id:
                  typeof st === "object" && st.subtopic_code
                    ? String(st.subtopic_code)
                    : `${topicCode}.${sIdx + 1}`,
                code:
                  typeof st === "object" && st.subtopic_code
                    ? String(st.subtopic_code)
                    : `${topicCode}.${sIdx + 1}`,
                title:
                  typeof st === "string"
                    ? st
                    : st.subtopic_name || `Subtopic ${sIdx + 1}`,
              })),
            };
          }),
        }));
        setMcqHierarchyUnits(mapped);
      } else {
        setMcqHierarchyUnits([]);
      }
    } catch (err) {
      console.error("Failed to load topic hierarchy units:", err);
      setMcqHierarchyUnits([]);
    } finally {
      setLoadingHierarchyUnits(false);
    }
  };

  useEffect(() => {
    if (activeTab === "mcq_generation" && courseIdParam) {
      fetchTopicHierarchyUnits(courseIdParam);
    }
  }, [activeTab, courseIdParam]);

  const handleSimplifiedMCQGenerate = async (genData: {
    selectedUnits: HierarchyUnitItem[];
    bloomCounts: Record<string, number>;
    totalQuestions: number;
    activePresetId: string | null;
    activePresetDescription: string;
    includeExplanation: boolean;
    shuffleOptions: boolean;
    enableBreakdown?: boolean;
    difficultyBreakdown?: Record<string, { easy: number; medium: number; hard: number }>;
  }) => {
    if (!isCoord) {
      Failure("Permission Denied: Only Course Coordinators can generate new MCQ questions.");
      return;
    }
    try {
      setIsGeneratingMCQ(true);
      const unitsPayload = genData.selectedUnits.map((u) => ({
        unit_number: u.unit_number,
        unit_title: u.unit_title,
        topics: u.topics.map((t) => ({
          topic_id: t.code,
          topic_name: t.title,
          subtopics: (t.subtopics || []).map((st) => ({
            subtopic_id: st.code,
            subtopic_name: st.title,
          })),
        })),
      }));

      const courseIdForPayload = String(course?.course_id ?? courseIdParam);

      const payload: any = {
        syllabus: {
          course_id: courseIdForPayload,
          units: unitsPayload,
        },
        question_count: genData.totalQuestions,
        type: "mcq",
        language: "en",
        include_explanation: genData.includeExplanation,
        shuffle_options: genData.shuffleOptions,
      };

      if (genData.enableBreakdown && genData.difficultyBreakdown) {
        payload.distribution_mode = "knowledge_and_difficulty";
        const diffBreakdown: any = {};
        ["K1", "K2", "K3", "K4", "K5", "K6"].forEach((k) => {
          const bd = genData.difficultyBreakdown?.[k] ?? { easy: 0, medium: 0, hard: 0 };
          diffBreakdown[k] = {
            easy: Number(bd.easy) || 0,
            medium: Number(bd.medium) || 0,
            hard: Number(bd.hard) || 0,
          };
        });
        payload.knowledge_difficulty_breakdown = diffBreakdown;
        payload.knowledge_level_breakdown = null;
      } else {
        payload.distribution_mode = "knowledge_level";
        payload.knowledge_level_breakdown = genData.bloomCounts;
        payload.knowledge_difficulty_breakdown = null;
      }

      if (genData.activePresetDescription) {
        payload.description = genData.activePresetDescription;
      }

      const res: any = await Models.mcq.generate(payload).catch((err: any) => {
        console.error("MCQ Generate API Error:", err);
        if (isLimitExhaustion(err)) {
          showLimitExhaustedModal(getErrorMessage(err));
          Failure(LIMIT_EXHAUSTED_MESSAGE);
        } else {
          Failure(getErrorMessage(err, "Failed to start MCQ generation"));
        }
        return null;
      });

      const jobId = res?.job_id;
      if (jobId) {
        Success("MCQ generation job submitted! Questions are being generated in the background.");
        let attempts = 0;
        const maxAttempts = 60;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const statusRes: any = await Models.mcq.get_job_status(jobId);
            const st = String(statusRes?.status).toLowerCase();
            if (st === "completed" || st === "success") {
              clearInterval(interval);
              setIsGeneratingMCQ(false);
              Success(`AI Generated ${genData.totalQuestions} questions successfully!`);
            } else if (st === "failed" || st === "failure") {
              clearInterval(interval);
              setIsGeneratingMCQ(false);
              const errorMsg = statusRes?.error || "Unknown error";
              if (isLimitExhaustion(statusRes) || isLimitExhaustion(errorMsg)) {
                showLimitExhaustedModal(errorMsg);
                Failure(LIMIT_EXHAUSTED_MESSAGE);
              } else {
                Failure(`MCQ generation failed: ${errorMsg}`);
              }
            } else if (attempts >= maxAttempts) {
              clearInterval(interval);
              setIsGeneratingMCQ(false);
              Failure("MCQ generation timed out. Please check back shortly.");
            }
          } catch {
            if (attempts >= maxAttempts) {
              clearInterval(interval);
              setIsGeneratingMCQ(false);
            }
          }
        }, 3000);
      } else {
        setIsGeneratingMCQ(false);
        Failure("Failed to queue MCQ generation job.");
      }
    } catch (err: any) {
      console.error("MCQ Generate error:", err);
      setIsGeneratingMCQ(false);
      Failure(getErrorMessage(err, "Unexpected error during generation."));
    }
  };

  const handleSelectVersionCard = async (
    tabType: "syllabus" | "copo" | "pedagogy" | "lesson_plan",
    versionItem: any,
    idKey: string
  ) => {
    const itemId = versionItem[idKey];
    if (!itemId) return;
    try {
      setLoadingVersionDetail(true);
      if (tabType === "syllabus") {
        const full = await Models.syllabus.get_extraction(itemId);
        setSelectedVersionData((prev) => ({ ...prev, syllabus: full }));
      } else if (tabType === "copo") {
        const full = await Models.copo.get(itemId);
        setSelectedVersionData((prev) => ({ ...prev, copo: full }));
      } else if (tabType === "pedagogy") {
        const full = await Models.pedagogy.get(itemId);
        setSelectedVersionData((prev) => ({ ...prev, pedagogy: full }));
      } else if (tabType === "lesson_plan") {
        const full = await Models.lession_plan.get(itemId);
        setSelectedVersionData((prev) => ({ ...prev, lesson_plan: full }));
      }
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to load version details"));
    } finally {
      setLoadingVersionDetail(false);
    }
  };

  const renderGenerationLoadingScreen = (
    stageName: string,
    state: string,
    versionNumber?: number | string
  ) => {
    const isProcessing = state === "sent_to_llm" || state === "processing";

    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-indigo-200/80 bg-gradient-to-b from-indigo-50/70 via-white to-indigo-50/30 p-5 text-center shadow-xs dark:border-indigo-900/50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20 my-2">
        <div className="relative mb-3 flex h-11 w-11 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-indigo-400/20 dark:bg-indigo-500/20" />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25 dark:bg-indigo-500">
            {isProcessing ? (
              <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
            ) : (
              <Clock className="h-5 w-5 text-white" />
            )}
          </div>
        </div>

        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-2.5 py-0.5 text-[11px] font-semibold dark:border-slate-800 dark:bg-slate-800">
          {isProcessing ? (
            <span className="inline-flex items-center gap-1 text-purple-700 dark:text-purple-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-purple-500"></span>
              </span>
              <span className="text-[10px] font-bold tracking-wide uppercase">
                Processing (Sent to LLM)
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-300">
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              <span className="text-[10px] font-bold tracking-wide uppercase">Queued</span>
            </span>
          )}
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
          {stageName} {versionNumber ? `(v${versionNumber})` : ""} Generation in Progress
        </h3>

        <div className="mt-2 max-w-md space-y-1.5">
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            {isProcessing
              ? "The AI worker has picked up this job and is actively querying the LLM to synthesize curriculum data."
              : "This generation job is currently waiting in the processing queue."}
          </p>

          <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 text-center">
            <p className="font-bold flex items-center justify-center gap-1 text-[11px] text-amber-900 dark:text-amber-200">
              <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Please check back in ~2 minutes</span>
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              fetchPortfolio(true);
              loadSectionData(activeTab, true);
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Checking..." : "Refresh to Load Data"}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderVersionCards = (tabType: "syllabus" | "copo" | "pedagogy" | "lesson_plan") => {
    if (!isCoord) return null;

    let versionsList: any[] = [];
    let idKey = "";
    let approveFn: ((id: any) => Promise<void>) | null = null;
    let activateFn: ((id: any) => Promise<void>) | null = null;
    let approveLoadingPrefix = "";
    let activateLoadingPrefix = "";

    if (tabType === "syllabus") {
      versionsList = versionsExtractions;
      idKey = "extractions_id";
      approveFn = handleApproveExtraction;
      activateFn = handleActivateExtraction;
      approveLoadingPrefix = "approve_syllabus_";
      activateLoadingPrefix = "activate_syllabus_";
    } else if (tabType === "copo") {
      versionsList = versionsCopo;
      idKey = "copo_id";
      approveFn = handleApproveCopo;
      activateFn = handleActivateCopo;
      approveLoadingPrefix = "approve_copo_";
      activateLoadingPrefix = "activate_copo_";
    } else if (tabType === "pedagogy") {
      versionsList = versionsPedagogies;
      idKey = "pedagogy_id";
      approveFn = handleApprovePedagogy;
      activateFn = handleActivatePedagogy;
      approveLoadingPrefix = "approve_pedagogy_";
      activateLoadingPrefix = "activate_pedagogy_";
    } else if (tabType === "lesson_plan") {
      versionsList = versionsLessonPlans;
      idKey = "lesson_plan_id";
      approveFn = handleApproveLessonPlan;
      activateFn = handleActivateLessonPlan;
      approveLoadingPrefix = "approve_lesson_plan_";
      activateLoadingPrefix = "activate_lesson_plan_";
    }

    if (versionsList.length === 0) return null;

    const selectedVer = selectedVersionData[tabType];

    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <History className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Version History ({versionsList.length})
              </span>
            </div>
            {selectedVer && (
              <button
                type="button"
                onClick={() => {
                  setSelectedVersionData((prev) => ({ ...prev, [tabType]: undefined }));
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                Close View ✕
              </button>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {versionsList.map((ver: any) => {
              const itemId = ver[idKey];
              const isItemActive = Boolean(ver.is_active);
              const isItemApproved = Boolean(ver.is_approved);
              const isSelected = Boolean(selectedVer && selectedVer[idKey] === itemId);
              const isBusy = isBusyState(ver.current_state);

              return (
                <div
                  key={itemId}
                  className={`min-w-[175px] shrink-0 rounded-lg border p-2 transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/50 shadow-xs dark:border-indigo-600 dark:bg-indigo-950/40"
                      : "border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      v{ver.version_number}
                    </span>
                    <div className="flex items-center gap-1">
                      {isItemActive && (
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </span>
                      )}
                      {isItemApproved ? (
                        <span className="rounded-full bg-sky-100 px-1.5 py-0.2 text-[9px] font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          Approved
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.2 text-[9px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {ver.created_at
                      ? new Date(ver.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </p>

                  {isBusy && (
                    <div
                      className={`mt-1 flex items-center gap-1 text-[9px] font-semibold ${
                        ver.current_state === "sent_to_llm" || ver.current_state === "processing"
                          ? "text-purple-600 dark:text-purple-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {ver.current_state === "sent_to_llm" || ver.current_state === "processing" ? (
                        <>
                          <Sparkles className="h-2.5 w-2.5 animate-spin" />
                          <span>Processing</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-2.5 w-2.5" />
                          <span>Queued</span>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-800">
                    {isSelected ? (
                      <span className="rounded bg-indigo-600/10 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                        Viewing
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectVersionCard(tabType, ver, idKey)}
                        disabled={loadingVersionDetail}
                        className="rounded border border-slate-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        View
                      </button>
                    )}

                    {!isItemApproved && approveFn && (
                      <button
                        type="button"
                        onClick={() => approveFn?.(itemId)}
                        disabled={isBusy || actionLoading === `${approveLoadingPrefix}${itemId}`}
                        className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionLoading === `${approveLoadingPrefix}${itemId}` ? "..." : "Approve"}
                      </button>
                    )}

                    {isItemApproved && !isItemActive && activateFn && (
                      <button
                        type="button"
                        onClick={() => activateFn?.(itemId)}
                        disabled={isBusy || actionLoading === `${activateLoadingPrefix}${itemId}`}
                        className="rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {actionLoading === `${activateLoadingPrefix}${itemId}` ? "..." : "Activate"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedVer && (
          <div
            className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs ${
              isCoord || perms.can_edit
                ? "border-indigo-300 bg-indigo-50/80 text-indigo-950 dark:border-indigo-800/60 dark:bg-indigo-950/40 dark:text-indigo-200"
                : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {isCoord || perms.can_edit ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              )}
              <span>
                Viewing version <strong>v{selectedVer.version_number}</strong>
                {isCoord || perms.can_edit
                  ? " Edit permissions enabled for coordinator."
                  : " Artifact is in read-only mode."}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedVersionData((prev) => ({ ...prev, [tabType]: undefined }));
                loadSectionData(tabType, true);
              }}
              className={`rounded-lg px-2.5 py-1 font-semibold text-white transition ${
                isCoord || perms.can_edit
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              Close View
            </button>
          </div>
        )}
      </div>
    );
  };

  const saveCopoDeltaChanges = async () => {
    if (!currentCopo?.copo_id) return;
    try {
      setSavingCopoDelta(true);
      for (const [cellIdStr, delta] of Object.entries(copoDirtyCells)) {
        await Models.copo.update_matrix_cell(currentCopo.copo_id, cellIdStr, delta);
      }
      Success("CO-PO matrix delta changes saved successfully!");
      setCopoDirtyCells({});
      await refreshCurrentVersion("copo", currentCopo.copo_id);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save CO-PO matrix changes"));
    } finally {
      setSavingCopoDelta(false);
    }
  };

  const startEditPedagogyTopic = (sug: any) => {
    setEditingPedagogyTopicId(sug.id);
    setPedagogyDraft({
      bloom_level_1: sug.bloom_level_1 ?? "K2 - Understand",
      pedagogy_suggested_1: sug.pedagogy_suggested_1 ?? "",
      description_1: sug.description_1 ?? "",
      methodology_1: sug.methodology_1 ?? "",
      bloom_level_2: sug.bloom_level_2 ?? "K3 - Apply",
      pedagogy_suggested_2: sug.pedagogy_suggested_2 ?? "",
      description_2: sug.description_2 ?? "",
      methodology_2: sug.methodology_2 ?? "",
      bloom_level_3: sug.bloom_level_3 ?? "K4 - Analyze",
      pedagogy_suggested_3: sug.pedagogy_suggested_3 ?? "",
      description_3: sug.description_3 ?? "",
      methodology_3: sug.methodology_3 ?? "",
    });
  };

  const savePedagogyTopic = async (sugId: number) => {
    if (!currentPedagogy?.pedagogy_id) return;
    try {
      setSavingPedagogyTopic(true);
      await Models.pedagogy.update_topic_suggestion(currentPedagogy.pedagogy_id, sugId, {
        bloom_level_1: pedagogyDraft.bloom_level_1,
        pedagogy_suggested_1: pedagogyDraft.pedagogy_suggested_1?.trim(),
        description_1: pedagogyDraft.description_1?.trim() ?? undefined,
        methodology_1: pedagogyDraft.methodology_1?.trim() ?? undefined,
        bloom_level_2: pedagogyDraft.bloom_level_2,
        pedagogy_suggested_2: pedagogyDraft.pedagogy_suggested_2?.trim(),
        description_2: pedagogyDraft.description_2?.trim() ?? undefined,
        methodology_2: pedagogyDraft.methodology_2?.trim() ?? undefined,
        bloom_level_3: pedagogyDraft.bloom_level_3,
        pedagogy_suggested_3: pedagogyDraft.pedagogy_suggested_3?.trim(),
        description_3: pedagogyDraft.description_3?.trim() ?? undefined,
        methodology_3: pedagogyDraft.methodology_3?.trim() ?? undefined,
      });
      Success("Topic pedagogy strategies updated successfully!");
      setEditingPedagogyTopicId(null);
      await refreshCurrentVersion("pedagogy", currentPedagogy.pedagogy_id);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to update pedagogy topic"));
    } finally {
      setSavingPedagogyTopic(false);
    }
  };

  const formatMinutes = (hours: number | string | undefined | null) => {
    if (hours === undefined || hours === null || hours === "") return "0 minutes";
    const h = Number(hours);
    if (isNaN(h)) return `${hours}`;
    const mins = Math.round(h * 60);
    return `${mins} ${mins === 1 ? "minute" : "minutes"}`;
  };

  const startEditLpSlot = (slot: any) => {
    setEditingLpSlotId(slot.id);
    setLpSlotDraft({
      time_allocated: Number(slot.time_allocated) || 1,
      bloom_level: slot.bloom_level ?? "Understand",
      suggested_activity: slot.suggested_activity ?? "",
    });
  };

  const saveLpSlot = async (slotId: number) => {
    if (!currentLessonPlan?.lesson_plan_id) return;
    try {
      setSavingLpSlot(true);
      await Models.lession_plan.update_topic_slot(currentLessonPlan.lesson_plan_id, slotId, {
        time_allocated: Number(lpSlotDraft.time_allocated) || 1,
        bloom_level: lpSlotDraft.bloom_level,
        suggested_activity: lpSlotDraft.suggested_activity?.trim() ?? undefined,
      });
      Success("Topic slot schedule updated successfully!");
      setEditingLpSlotId(null);
      await refreshCurrentVersion("lesson_plan", currentLessonPlan.lesson_plan_id);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to update lesson plan slot"));
    } finally {
      setSavingLpSlot(false);
    }
  };

  const startEditLpSubtopicSlot = (subSlot: any) => {
    setEditingLpSubtopicSlotId(subSlot.id);
    setLpSubtopicSlotDraft({
      time_allocated: Number(subSlot.time_allocated) || 0.5,
      bloom_level: subSlot.bloom_level ?? "Understand",
      suggested_activity: subSlot.suggested_activity ?? "",
    });
  };

  const saveLpSubtopicSlot = async (subSlotId: number) => {
    if (!currentLessonPlan?.lesson_plan_id) return;
    try {
      setSavingLpSubtopicSlot(true);
      await Models.lession_plan.update_subtopic_slot(currentLessonPlan.lesson_plan_id, subSlotId, {
        time_allocated: Number(lpSubtopicSlotDraft.time_allocated) || 0.5,
        bloom_level: lpSubtopicSlotDraft.bloom_level,
        suggested_activity: lpSubtopicSlotDraft.suggested_activity?.trim() ?? undefined,
      });
      Success("Subtopic slot schedule updated successfully!");
      setEditingLpSubtopicSlotId(null);
      await refreshCurrentVersion("lesson_plan", currentLessonPlan.lesson_plan_id);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to update subtopic slot"));
    } finally {
      setSavingLpSubtopicSlot(false);
    }
  };

  const units = currentExt?.units ?? [];
  const canEdit = Boolean((isCoord || perms.can_edit) && currentExt);

  const KNOWLEDGE_LEVELS = [
    "K1 - Remember",
    "K2 - Understand",
    "K3 - Apply",
    "K4 - Analyze",
    "K5 - Evaluate",
    "K6 - Create",
  ];

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<boolean>(false);

  const [hoursDraft, setHoursDraft] = useState({
    credits: 0,
    lecture_hours: 0,
    tutorial_hours: 0,
    practical_hours: 0,
    total_theory_hours: 0,
    total_lab_hours: 0,
  });
  const [objectivesDraft, setObjectivesDraft] = useState<any[]>([]);
  const [outcomesDraft, setOutcomesDraft] = useState<any[]>([]);
  const [textbooksDraft, setTextbooksDraft] = useState<any[]>([]);
  const [referenceBooksDraft, setReferenceBooksDraft] = useState<any[]>([]);

  const [hierarchyModal, setHierarchyModal] = useState<{
    type: "unit" | "topic" | "subtopic";
    mode: "add" | "edit";
    data?: any;
    unitId?: number;
    topicId?: number;
    subtopicId?: number;
  } | null>(null);
  const [modalForm, setModalForm] = useState<any>({});
  const [submittingModal, setSubmittingModal] = useState<boolean>(false);

  const startEditHours = () => {
    setHoursDraft({
      credits: currentExt?.credits ?? course?.credits ?? 0,
      lecture_hours: currentExt?.lecture_hours ?? 0,
      tutorial_hours: currentExt?.tutorial_hours ?? 0,
      practical_hours: currentExt?.practical_hours ?? 0,
      total_theory_hours: currentExt?.total_theory_hours ?? course?.total_theory_hours ?? 0,
      total_lab_hours: currentExt?.total_lab_hours ?? course?.total_lab_hours ?? 0,
    });
    setEditingSection("hours");
  };

  const saveHours = async () => {
    const extId = currentExt?.extractions_id;
    if (!extId) return;
    try {
      setSavingSection(true);
      await Models.syllabus.update_hours(extId, {
        credits: Number(hoursDraft.credits),
        lecture_hours: Number(hoursDraft.lecture_hours),
        tutorial_hours: Number(hoursDraft.tutorial_hours),
        practical_hours: Number(hoursDraft.practical_hours),
        total_theory_hours: Number(hoursDraft.total_theory_hours),
        total_lab_hours: Number(hoursDraft.total_lab_hours),
      });
      Success("Curriculum hours and credits updated successfully!");
      setEditingSection(null);
      await refreshCurrentVersion("syllabus", extId);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to update hours"));
    } finally {
      setSavingSection(false);
    }
  };

  const startEditObjectives = () => {
    setObjectivesDraft((currentExt?.objectives ?? []).map((o: any) => ({ ...o })));
    setEditingSection("objectives");
  };

  const handleAddObjectiveRow = () => {
    setObjectivesDraft((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        objective_number: prev.length + 1,
        description: "",
        isNew: true,
      },
    ]);
  };

  const handleDeleteObjectiveRow = (id: any) => {
    setObjectivesDraft((prev) => prev.filter((o) => o.id !== id));
  };

  const saveObjectives = async () => {
    const extId = currentExt?.extractions_id;
    if (!extId) return;
    try {
      setSavingSection(true);
      const original = currentExt?.objectives ?? [];
      const currentIds = new Set(objectivesDraft.filter((o) => !o.isNew).map((o) => o.id));

      for (const orig of original) {
        if (!currentIds.has(orig.id)) {
          await Models.syllabus.deleteObjective(extId, orig.id);
        }
      }

      for (const obj of objectivesDraft) {
        if (obj.isNew) {
          if (obj.description?.trim()) {
            await Models.syllabus.addObjective(extId, {
              objective_number: Number(obj.objective_number) || 1,
              description: obj.description.trim(),
            });
          }
        } else {
          await Models.syllabus.updateObjective(extId, obj.id, {
            objective_number: Number(obj.objective_number) || 1,
            description: obj.description?.trim() ?? "",
          });
        }
      }

      Success("Course objectives saved successfully!");
      setEditingSection(null);
      await refreshCurrentVersion("syllabus", extId);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save objectives"));
    } finally {
      setSavingSection(false);
    }
  };

  const startEditOutcomes = () => {
    setOutcomesDraft(
      (currentExt?.outcomes ?? []).map((co: any) => ({
        ...co,
        knowledge_level: co.knowledge_level ?? (co.bloom_level ? `K2 - ${co.bloom_level}` : "K2 - Understand"),
      }))
    );
    setEditingSection("outcomes");
  };

  const handleAddOutcomeRow = () => {
    setOutcomesDraft((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        co_code: `CO${prev.length + 1}`,
        description: "",
        knowledge_level: "K2 - Understand",
        bloom_level: "Understand",
        isNew: true,
      },
    ]);
  };

  const handleDeleteOutcomeRow = (id: any) => {
    setOutcomesDraft((prev) => prev.filter((co) => co.id !== id));
  };

  const saveOutcomes = async () => {
    const extId = currentExt?.extractions_id;
    if (!extId) return;
    try {
      setSavingSection(true);
      const original = currentExt?.outcomes ?? [];
      const currentIds = new Set(outcomesDraft.filter((co) => !co.isNew).map((co) => co.id));

      for (const orig of original) {
        if (!currentIds.has(orig.id)) {
          await Models.syllabus.deleteOutcome(extId, orig.id);
        }
      }

      for (const co of outcomesDraft) {
        const kLevel = co.knowledge_level ?? "K2 - Understand";
        const bloomPart = kLevel.includes("-") ? kLevel.split("-")[1].trim() : kLevel;

        if (co.isNew) {
          if (co.description?.trim()) {
            await Models.syllabus.addOutcome(extId, {
              co_code: normalizeCoCode(co.co_code) ?? "CO1",
              description: co.description.trim(),
              knowledge_level: kLevel,
              bloom_level: bloomPart,
            });
          }
        } else {
          await Models.syllabus.updateOutcome(extId, co.id, {
            co_code: normalizeCoCode(co.co_code) ?? "CO1",
            description: co.description?.trim() ?? "",
            knowledge_level: kLevel,
            bloom_level: bloomPart,
          });
        }
      }

      Success("Course outcomes saved successfully!");
      setEditingSection(null);
      await refreshCurrentVersion("syllabus", extId);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save outcomes"));
    } finally {
      setSavingSection(false);
    }
  };

  const startEditTextbooks = () => {
    setTextbooksDraft(
      (currentExt?.textbooks ?? []).map((t: any) => ({
        ...t,
        authorsStr: Array.isArray(t.authors) ? t.authors.join(", ") : (t.authors ?? ""),
      }))
    );
    setEditingSection("textbooks");
  };

  const handleAddTextbookRow = () => {
    setTextbooksDraft((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        title: "",
        authorsStr: "",
        publisher: "",
        edition: "",
        publication_year: new Date().getFullYear(),
        isNew: true,
      },
    ]);
  };

  const handleDeleteTextbookRow = (id: any) => {
    setTextbooksDraft((prev) => prev.filter((t) => t.id !== id));
  };

  const saveTextbooks = async () => {
    const extId = currentExt?.extractions_id;
    if (!extId) return;
    try {
      setSavingSection(true);
      const original = currentExt?.textbooks ?? [];
      const currentIds = new Set(textbooksDraft.filter((t) => !t.isNew).map((t) => t.id));

      for (const orig of original) {
        if (!currentIds.has(orig.id)) {
          await Models.syllabus.deleteTextbook(extId, orig.id);
        }
      }

      for (const t of textbooksDraft) {
        const authorsArr = (t.authorsStr ?? "")
          .split(",")
          .map((a: string) => a.trim())
          .filter(Boolean);

        if (t.isNew) {
          if (t.title?.trim()) {
            await Models.syllabus.addTextbook(extId, {
              title: t.title.trim(),
              authors: authorsArr,
              publisher: t.publisher?.trim() ?? undefined,
              edition: t.edition?.trim() ?? undefined,
              publication_year: t.publication_year ? Number(t.publication_year) : undefined,
            });
          }
        } else {
          await Models.syllabus.updateTextbook(extId, t.id, {
            title: t.title?.trim() ?? "",
            authors: authorsArr,
            publisher: t.publisher?.trim() ?? undefined,
            edition: t.edition?.trim() ?? undefined,
            publication_year: t.publication_year ? Number(t.publication_year) : undefined,
          });
        }
      }

      Success("Textbooks saved successfully!");
      setEditingSection(null);
      await refreshCurrentVersion("syllabus", extId);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save textbooks"));
    } finally {
      setSavingSection(false);
    }
  };

  const startEditReferenceBooks = () => {
    setReferenceBooksDraft(
      (currentExt?.reference_books ?? []).map((t: any) => ({
        ...t,
        authorsStr: Array.isArray(t.authors) ? t.authors.join(", ") : (t.authors ?? ""),
      }))
    );
    setEditingSection("reference_books");
  };

  const handleAddReferenceBookRow = () => {
    setReferenceBooksDraft((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        title: "",
        authorsStr: "",
        publisher: "",
        edition: "",
        publication_year: new Date().getFullYear(),
        isNew: true,
      },
    ]);
  };

  const handleDeleteReferenceBookRow = (id: any) => {
    setReferenceBooksDraft((prev) => prev.filter((t) => t.id !== id));
  };

  const saveReferenceBooks = async () => {
    const extId = currentExt?.extractions_id;
    if (!extId) return;
    try {
      setSavingSection(true);
      const original = currentExt?.reference_books ?? [];
      const currentIds = new Set(referenceBooksDraft.filter((t) => !t.isNew).map((t) => t.id));

      for (const orig of original) {
        if (!currentIds.has(orig.id)) {
          await Models.syllabus.deleteReferenceBook(extId, orig.id);
        }
      }

      for (const t of referenceBooksDraft) {
        const authorsArr = (t.authorsStr ?? "")
          .split(",")
          .map((a: string) => a.trim())
          .filter(Boolean);

        if (t.isNew) {
          if (t.title?.trim()) {
            await Models.syllabus.addReferenceBook(extId, {
              title: t.title.trim(),
              authors: authorsArr,
              publisher: t.publisher?.trim() ?? undefined,
              edition: t.edition?.trim() ?? undefined,
              publication_year: t.publication_year ? Number(t.publication_year) : undefined,
            });
          }
        } else {
          await Models.syllabus.updateReferenceBook(extId, t.id, {
            title: t.title?.trim() ?? "",
            authors: authorsArr,
            publisher: t.publisher?.trim() ?? undefined,
            edition: t.edition?.trim() ?? undefined,
            publication_year: t.publication_year ? Number(t.publication_year) : undefined,
          });
        }
      }

      Success("Reference books saved successfully!");
      setEditingSection(null);
      await refreshCurrentVersion("syllabus", extId);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save reference books"));
    } finally {
      setSavingSection(false);
    }
  };

  const openUnitModal = (mode: "add" | "edit", unit?: any) => {
    setHierarchyModal({
      type: "unit",
      mode,
      unitId: unit?.id,
      data: unit,
    });
    setModalForm(
      mode === "edit"
        ? {
            unit_number: unit.unit_number ?? 1,
            unit_title: unit.unit_title ?? "",
            unit_overview: unit.unit_overview ?? "",
            theory_hours: unit.theory_hours ?? 0,
            lab_hours: unit.lab_hours ?? 0,
            tutorial_hours: unit.tutorial_hours ?? 0,
          }
        : {
            unit_number: units.length + 1,
            unit_title: "",
            unit_overview: "",
            theory_hours: 0,
            lab_hours: 0,
            tutorial_hours: 0,
          }
    );
  };

  const openTopicModal = (mode: "add" | "edit", unitId: number, topic?: any) => {
    setHierarchyModal({
      type: "topic",
      mode,
      unitId,
      topicId: topic?.id,
      data: topic,
    });
    setModalForm(
      mode === "edit"
        ? {
            topic_code: topic.topic_code ?? "",
            topic_name: topic.topic_name ?? "",
            topic_description: topic.topic_description ?? "",
            knowledge_level: topic.knowledge_level ?? "K2 - Understand",
            learning_sequence: topic.learning_sequence ?? 1,
          }
        : {
            topic_code: "",
            topic_name: "",
            topic_description: "",
            knowledge_level: "K2 - Understand",
            learning_sequence: 1,
          }
    );
  };

  const openSubtopicModal = (mode: "add" | "edit", topicId: number, subtopic?: any) => {
    setHierarchyModal({
      type: "subtopic",
      mode,
      topicId,
      subtopicId: subtopic?.id,
      data: subtopic,
    });
    setModalForm(
      mode === "edit"
        ? {
            subtopic_code: subtopic.subtopic_code ?? "",
            subtopic_name: subtopic.subtopic_name ?? "",
            subtopic_description: subtopic.subtopic_description ?? "",
          }
        : {
            subtopic_code: "",
            subtopic_name: "",
            subtopic_description: "",
          }
    );
  };

  const handleHierarchySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const extId = currentExt?.extractions_id;
    if (!hierarchyModal || !extId) return;
    try {
      setSubmittingModal(true);
      const { type, mode, unitId, topicId, subtopicId } = hierarchyModal;

      if (type === "unit") {
        if (mode === "add") {
          await Models.syllabus.addUnit(extId, {
            unit_number: Number(modalForm.unit_number) || 1,
            unit_title: modalForm.unit_title.trim(),
            unit_overview: modalForm.unit_overview?.trim() ?? undefined,
            theory_hours: Number(modalForm.theory_hours) || 0,
            lab_hours: Number(modalForm.lab_hours) || 0,
            tutorial_hours: Number(modalForm.tutorial_hours) || 0,
          });
          Success("Unit created successfully!");
        } else {
          await Models.syllabus.updateUnit(extId, unitId as number, {
            unit_number: Number(modalForm.unit_number) || undefined,
            unit_title: modalForm.unit_title?.trim() ?? undefined,
            unit_overview: modalForm.unit_overview?.trim() ?? undefined,
            theory_hours: Number(modalForm.theory_hours) ?? undefined,
            lab_hours: Number(modalForm.lab_hours) ?? undefined,
            tutorial_hours: Number(modalForm.tutorial_hours) ?? undefined,
          });
          Success("Unit updated successfully!");
        }
      } else if (type === "topic") {
        if (mode === "add") {
          await Models.syllabus.addTopic(extId, unitId as number, {
            topic_code: modalForm.topic_code?.trim() ?? "",
            topic_name: modalForm.topic_name.trim(),
            topic_description: modalForm.topic_description?.trim() ?? undefined,
            knowledge_level: modalForm.knowledge_level ?? undefined,
            learning_sequence: Number(modalForm.learning_sequence) || 1,
          });
          Success("Topic created successfully!");
        } else {
          await Models.syllabus.updateTopic(extId, topicId as number, {
            topic_code: modalForm.topic_code?.trim() ?? undefined,
            topic_name: modalForm.topic_name?.trim() ?? undefined,
            topic_description: modalForm.topic_description?.trim() ?? undefined,
            knowledge_level: modalForm.knowledge_level ?? undefined,
            learning_sequence: Number(modalForm.learning_sequence) ?? undefined,
          });
          Success("Topic updated successfully!");
        }
      } else if (type === "subtopic") {
        if (mode === "add") {
          await Models.syllabus.addSubtopic(extId, topicId as number, {
            subtopic_code: modalForm.subtopic_code?.trim() ?? "",
            subtopic_name: modalForm.subtopic_name.trim(),
            subtopic_description: modalForm.subtopic_description?.trim() ?? undefined,
          });
          Success("Subtopic created successfully!");
        } else {
          await Models.syllabus.updateSubtopic(extId, subtopicId as number, {
            subtopic_code: modalForm.subtopic_code?.trim() ?? undefined,
            subtopic_name: modalForm.subtopic_name?.trim() ?? undefined,
            subtopic_description: modalForm.subtopic_description?.trim() ?? undefined,
          });
          Success("Subtopic updated successfully!");
        }
      }

      setHierarchyModal(null);
      await refreshCurrentVersion("syllabus", extId);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save changes"));
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    const extId = currentExt?.extractions_id;
    if (!extId) return;
    if (!confirm("Are you sure you want to delete this Unit and all its topics and subtopics?"))
      return;
    try {
      await Models.syllabus.deleteUnit(extId, unitId);
      Success("Unit deleted successfully!");
      await refreshCurrentVersion("syllabus", extId);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to delete unit"));
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    const extId = currentExt?.extractions_id;
    if (!extId) return;
    if (!confirm("Are you sure you want to delete this Topic and its subtopics?")) return;
    try {
      await Models.syllabus.deleteTopic(extId, topicId);
      Success("Topic deleted successfully!");
      await refreshCurrentVersion("syllabus", extId);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to delete topic"));
    }
  };

  const handleDeleteSubtopic = async (subtopicId: number) => {
    const extId = currentExt?.extractions_id;
    if (!extId) return;
    if (!confirm("Are you sure you want to delete this Subtopic?")) return;
    try {
      await Models.syllabus.deleteSubtopic(extId, subtopicId);
      Success("Subtopic deleted successfully!");
      await refreshCurrentVersion("syllabus", extId);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to delete subtopic"));
    }
  };  return (
    <div className="min-h-screen space-y-3 pb-8">
      {/* Compact Course Header Card */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-center">
          {/* Left: Back + Badges + Title */}
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => router.push("/neurobe/my-assigned-courses")}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/70 px-2 py-1 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              title="Back to My Courses"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Courses</span>
            </button>

            <span className="rounded-md border border-indigo-200/60 bg-indigo-50/80 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-300">
              {course.course_code ?? "Course"}
            </span>

            {isCoord ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-purple-200/60 bg-purple-50/70 px-1.5 py-0.5 text-[11px] font-semibold text-purple-700 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300">
                <ShieldCheck className="h-3 w-3" />
                Coordinator
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/60 bg-emerald-50/70 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                <UserCheck className="h-3 w-3" />
                Instructor
              </span>
            )}

            <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base md:text-lg truncate max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">
              {course.course_title ?? "Course Artifacts"}
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {activeSyllabus && (
              <button
                type="button"
                onClick={() => setSplitScreenView(!splitScreenView)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-xs transition ${
                  splitScreenView
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/70 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                }`}
                title={splitScreenView ? "Close split screen view" : "View source document in split screen"}
              >
                <Columns className="h-3.5 w-3.5 text-indigo-500" />
                <span>{splitScreenView ? "Close Split" : "Split View"}</span>
              </button>
            )}

            {isCoord && (
              <button
                type="button"
                onClick={() => {
                  if (isExtractionBusy) {
                    Failure("An extraction job is already in progress for this course.");
                    return;
                  }
                  setShowUploadModal(true);
                }}
                disabled={isExtractionBusy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 disabled:opacity-50 dark:bg-indigo-500"
              >
                {isExtractionBusy ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3 w-3" />
                    <span>Upload Syllabus</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchPortfolio(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
              <span>{refreshing ? "..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* Compact Metadata Strip */}
        <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-medium text-slate-700 dark:text-slate-300">{course.programme_name ?? "General"}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>{course.semester ? `Sem ${course.semester}` : "All Terms"}</span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {course.credits ?? 0} Credits ({course.total_theory_hours ?? 0}h Theory / {course.total_lab_hours ?? 0}h Lab)
            </span>
          </div>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <div className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5 text-slate-400" />
            <span>{course.department_name ?? "General"}</span>
          </div>
        </div>
      </div>

      {jobNotice && (
        <div className="flex items-center justify-between gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/80 p-2.5 text-xs text-indigo-900 shadow-2xs dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
            <span className="truncate">{jobNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setJobNotice(null)}
            className="text-slate-400 hover:text-slate-600 shrink-0 px-1"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* High Density Pill Navigation Bar */}
      <div className="border-b border-slate-200/80 dark:border-slate-800">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("syllabus")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition shrink-0 ${
              activeTab === "syllabus"
                ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span>1. Syllabus</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("copo")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition shrink-0 ${
              activeTab === "copo"
                ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span>2. CO-PO</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pedagogy")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition shrink-0 ${
              activeTab === "pedagogy"
                ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span>3. Pedagogy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lesson_plan")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition shrink-0 ${
              activeTab === "lesson_plan"
                ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span>4. Lesson Plan</span>
          </button>

          {isCoord && (
            <button
              type="button"
              onClick={() => setActiveTab("mcq_generation")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition shrink-0 ${
                activeTab === "mcq_generation"
                  ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <span>5. MCQ Gen</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition shrink-0 ${
              activeTab === "report"
                ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span>{isCoord ? "6. Report" : "5. Report"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cia_analytics")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition shrink-0 ${
              activeTab === "cia_analytics"
                ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span>{isCoord ? "7. CIA Analytics" : "6. CIA Analytics"}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mcq_viva")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition shrink-0 ${
              activeTab === "mcq_viva"
                ? "bg-indigo-600 text-white shadow-xs dark:bg-indigo-500"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            <span>{isCoord ? "8. MCQ & Viva" : "7. MCQ & Viva"}</span>
          </button>
        </nav>
      </div>

      {(() => {
        const tabContent = (
          <>
            {activeTab === "syllabus" && (
              <div className="space-y-3">
                {renderVersionCards("syllabus")}

                <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium leading-none">
                        {selectedVersionData.syllabus
                          ? "Viewing Version File"
                          : "Active Curriculum File"}
                      </p>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {activeSyllabus?.original_filename ?? "No syllabus uploaded"}
                      </h4>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentExt?.is_approved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Extraction Approved
                      </span>
                    ) : currentExt ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                        Draft Extraction (v{currentExt.version_number})
                      </span>
                    ) : null}

                    {isCoord && currentExt && !currentExt.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApproveExtraction(currentExt.extractions_id)}
                        disabled={actionLoading === `approve_syllabus_${currentExt.extractions_id}`}
                        className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                      >
                        {actionLoading === `approve_syllabus_${currentExt.extractions_id}`
                          ? "Approving..."
                          : "Approve Extraction"}
                      </button>
                    )}

                    {isCoord && currentExt && currentExt.is_approved && !currentExt.is_active && (
                      <button
                        type="button"
                        onClick={() => handleActivateExtraction(currentExt.extractions_id)}
                        disabled={actionLoading === `activate_syllabus_${currentExt.extractions_id}`}
                        className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                      >
                        {actionLoading === `activate_syllabus_${currentExt.extractions_id}`
                          ? "Activating..."
                          : "Set as Active"}
                      </button>
                    )}

                    {activeSyllabus && (
                      <button
                        type="button"
                        onClick={() => setSplitScreenView(!splitScreenView)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold shadow-xs transition ${
                          splitScreenView
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-300"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                        }`}
                      >
                        <Columns className="h-3.5 w-3.5 text-indigo-500" />
                        <span>
                          {splitScreenView ? "Close Split View" : "Split View (Source Document)"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {(sectionLoading.syllabus || loadingVersionDetail) && !currentExt && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white py-8 text-center dark:border-slate-800 dark:bg-slate-900">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Loading syllabus data...
                    </p>
                    <p className="text-[11px] text-slate-400">Fetching latest extraction details</p>
                  </div>
                )}

                {!sectionLoading.syllabus && !loadingVersionDetail && (() => {
                  const isCurrentBusy = isBusyState(currentExt?.current_state);
                  const inProgressExt = versionsExtractions.find((e: any) =>
                    isBusyState(e.current_state)
                  );

                  if (isCurrentBusy) {
                    return renderGenerationLoadingScreen(
                      "Syllabus Curriculum",
                      currentExt.current_state,
                      currentExt.version_number
                    );
                  }
                  if (!currentExt && inProgressExt) {
                    return renderGenerationLoadingScreen(
                      "Syllabus Curriculum",
                      inProgressExt.current_state,
                      inProgressExt.version_number
                    );
                  }
                  return null;
                })()}

                {!sectionLoading.syllabus &&
                  !loadingVersionDetail &&
                  !currentExt &&
                  !versionsExtractions.some((e: any) => isBusyState(e.current_state)) && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center dark:border-slate-800 dark:bg-slate-900">
                      <FileText className="h-8 w-8 text-slate-400" />
                      <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                        {isCoord
                          ? versionsExtractions.length > 0
                            ? "Select a Version to View"
                            : "No Syllabus Extracted Yet"
                          : "No Active Curriculum Available"}
                      </h3>
                      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        {isCoord
                          ? versionsExtractions.length > 0
                            ? "Click 'View' on any version card above to load and inspect curriculum details."
                            : "Upload a PDF or DOCX syllabus document above to initiate AI extraction of objectives, outcomes, and curriculum hierarchy."
                          : "The course coordinator has not yet activated a syllabus extraction for this course."}
                      </p>
                      {isCoord && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isExtractionBusy) {
                              Failure(
                                "An extraction job is already in progress for this course. Please wait for it to complete."
                              );
                              return;
                            }
                            setShowUploadModal(true);
                          }}
                          disabled={isExtractionBusy}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload Syllabus Document</span>
                        </button>
                      )}
                    </div>
                  )}

                {currentExt && !isBusyState(currentExt.current_state) && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-indigo-500" />
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            Curriculum Hours & Credits
                          </h3>
                        </div>

                        {canEdit && editingSection !== "hours" && (
                          <button
                            type="button"
                            onClick={startEditHours}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <Edit2 className="h-3 w-3 text-indigo-500" />
                            <span>Edit Hours</span>
                          </button>
                        )}
                      </div>

                      {editingSection === "hours" ? (
                        <div className="mt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                Credits
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={hoursDraft.credits}
                                onChange={(e) =>
                                  setHoursDraft({
                                    ...hoursDraft,
                                    credits: Number(e.target.value),
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                Total Theory Hrs
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={hoursDraft.total_theory_hours}
                                onChange={(e) =>
                                  setHoursDraft({
                                    ...hoursDraft,
                                    total_theory_hours: Number(e.target.value),
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                Total Lab Hrs
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={hoursDraft.total_lab_hours}
                                onChange={(e) =>
                                  setHoursDraft({
                                    ...hoursDraft,
                                    total_lab_hours: Number(e.target.value),
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                Lecture Hrs
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={hoursDraft.lecture_hours}
                                onChange={(e) =>
                                  setHoursDraft({
                                    ...hoursDraft,
                                    lecture_hours: Number(e.target.value),
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                Tutorial Hrs
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={hoursDraft.tutorial_hours}
                                onChange={(e) =>
                                  setHoursDraft({
                                    ...hoursDraft,
                                    tutorial_hours: Number(e.target.value),
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                Practical Hrs
                              </label>
                              <input
                                type="number"
                                min={0}
                                value={hoursDraft.practical_hours}
                                onChange={(e) =>
                                  setHoursDraft({
                                    ...hoursDraft,
                                    practical_hours: Number(e.target.value),
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingSection(null)}
                              disabled={savingSection}
                              className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={saveHours}
                              disabled={savingSection}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                            >
                              <Save className="h-3 w-3" />
                              <span>{savingSection ? "Saving..." : "Save Hours"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/40">
                            <p className="text-base font-bold text-slate-900 dark:text-white">
                              {currentExt?.credits ?? course?.credits ?? 0}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase">
                              Credits
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/40">
                            <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                              {currentExt?.total_theory_hours ?? course?.total_theory_hours ?? 0}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase">
                              Theory Hours
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/40">
                            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                              {currentExt?.total_lab_hours ?? course?.total_lab_hours ?? 0}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase">
                              Lab Hours
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/40">
                            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                              {currentExt?.lecture_hours ?? 0}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase">
                              Lecture (L)
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/40">
                            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                              {currentExt?.tutorial_hours ?? 0}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase">
                              Tutorial (T)
                            </p>
                          </div>
                          <div className="rounded-lg bg-slate-50 p-2 text-center dark:bg-slate-800/40">
                            <p className="text-base font-bold text-slate-700 dark:text-slate-300">
                              {currentExt?.practical_hours ?? 0}
                            </p>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase">
                              Practical (P)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                      <div className="space-y-3 lg:col-span-1">
                        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Award className="h-4 w-4 text-indigo-500" />
                              <span>Course Objectives</span>
                            </h3>

                            {canEdit && (
                              <div>
                                {editingSection === "objectives" ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={handleAddObjectiveRow}
                                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                                      title="Add Objective"
                                    >
                                      <Plus className="h-3 w-3" />
                                      <span>Add</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveObjectives}
                                      disabled={savingSection}
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      <Save className="h-3 w-3" />
                                      <span>Save</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingSection(null)}
                                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={startEditObjectives}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    <Edit2 className="h-3 w-3 text-indigo-500" />
                                    <span>Edit</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {editingSection === "objectives" ? (
                            <div className="mt-3 space-y-3">
                              {objectivesDraft.map((obj) => (
                                <div
                                  key={obj.id}
                                  className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-800/40"
                                >
                                  <input
                                    type="number"
                                    min={1}
                                    value={obj.objective_number}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setObjectivesDraft(
                                        objectivesDraft.map((o) =>
                                          o.id === obj.id ? { ...o, objective_number: val } : o
                                        )
                                      );
                                    }}
                                    className="w-12 shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                    placeholder="#"
                                  />
                                  <textarea
                                    rows={2}
                                    value={obj.description}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setObjectivesDraft(
                                        objectivesDraft.map((o) =>
                                          o.id === obj.id ? { ...o, description: val } : o
                                        )
                                      );
                                    }}
                                    className="flex-1 rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    placeholder="Objective description..."
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteObjectiveRow(obj.id)}
                                    className="mt-1 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                    title="Delete Objective"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                              {objectivesDraft.length === 0 && (
                                <p className="text-center text-xs text-slate-400 py-3 italic">
                                  No objectives. Click &apos;Add&apos; to create one.
                                </p>
                              )}
                            </div>
                          ) : (
                            <ul className="mt-3 space-y-2.5">
                              {(currentExt?.objectives ?? []).map((obj: any, idx: number) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300"
                                >
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                                    {obj.objective_number ?? idx + 1}
                                  </span>
                                  <span className="leading-relaxed">{obj.description}</span>
                                </li>
                              ))}
                              {(!currentExt?.objectives || currentExt.objectives.length === 0) && (
                                <li className="text-xs text-slate-400 italic">
                                  No specific objectives defined.
                                </li>
                              )}
                            </ul>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              <span>Course Outcomes (COs)</span>
                            </h3>

                            {canEdit && (
                              <div>
                                {editingSection === "outcomes" ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={handleAddOutcomeRow}
                                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                                      title="Add Course Outcome"
                                    >
                                      <Plus className="h-3 w-3" />
                                      <span>Add</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveOutcomes}
                                      disabled={savingSection}
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      <Save className="h-3 w-3" />
                                      <span>Save</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingSection(null)}
                                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={startEditOutcomes}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    <Edit2 className="h-3 w-3 text-indigo-500" />
                                    <span>Edit</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {editingSection === "outcomes" ? (
                            <div className="mt-3 space-y-3">
                              {outcomesDraft.map((co) => (
                                <div
                                  key={co.id}
                                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2 dark:border-slate-700 dark:bg-slate-800/40"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      value={co.co_code}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setOutcomesDraft(
                                          outcomesDraft.map((item) =>
                                            item.id === co.id ? { ...item, co_code: val } : item
                                          )
                                        );
                                      }}
                                      className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                      placeholder="CO#"
                                    />
                                    <select
                                      value={co.knowledge_level ?? "K2 - Understand"}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setOutcomesDraft(
                                          outcomesDraft.map((item) =>
                                            item.id === co.id
                                              ? { ...item, knowledge_level: val }
                                              : item
                                          )
                                        );
                                      }}
                                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    >
                                      {KNOWLEDGE_LEVELS.map((lvl) => (
                                        <option key={lvl} value={lvl}>
                                          {lvl}
                                        </option>
                                      ))}
                                    </select>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteOutcomeRow(co.id)}
                                      className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                      title="Delete Outcome"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <textarea
                                    rows={2}
                                    value={co.description}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setOutcomesDraft(
                                        outcomesDraft.map((item) =>
                                          item.id === co.id ? { ...item, description: val } : item
                                        )
                                      );
                                    }}
                                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    placeholder="Course outcome description..."
                                  />
                                </div>
                              ))}
                              {outcomesDraft.length === 0 && (
                                <p className="text-center text-xs text-slate-400 py-3 italic">
                                  No course outcomes. Click &apos;Add&apos; to create one.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3 space-y-3">
                              {(currentExt?.outcomes ?? []).map((co: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                      {co.co_code}
                                    </span>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {co.knowledge_level && (
                                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                                          {co.knowledge_level}
                                        </span>
                                      )}
                                      {co.bloom_level && (
                                        <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/80 dark:text-purple-300">
                                          {co.bloom_level}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {co.description}
                                  </p>
                                </div>
                              ))}
                              {(!currentExt?.outcomes || currentExt.outcomes.length === 0) && (
                                <p className="text-xs text-slate-400 italic">
                                  No course outcomes extracted.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <BookOpen className="h-4 w-4 text-purple-500" />
                              <span>Prescribed Textbooks</span>
                            </h3>

                            {canEdit && (
                              <div>
                                {editingSection === "textbooks" ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={handleAddTextbookRow}
                                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                                      title="Add Textbook"
                                    >
                                      <Plus className="h-3 w-3" />
                                      <span>Add</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveTextbooks}
                                      disabled={savingSection}
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      <Save className="h-3 w-3" />
                                      <span>Save</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingSection(null)}
                                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={startEditTextbooks}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    <Edit2 className="h-3 w-3 text-indigo-500" />
                                    <span>Edit</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {editingSection === "textbooks" ? (
                            <div className="mt-3 space-y-3">
                              {textbooksDraft.map((t) => (
                                <div
                                  key={t.id}
                                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2 dark:border-slate-700 dark:bg-slate-800/40"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      value={t.title}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTextbooksDraft(
                                          textbooksDraft.map((item) =>
                                            item.id === t.id ? { ...item, title: val } : item
                                          )
                                        );
                                      }}
                                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                      placeholder="Book Title"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTextbookRow(t.id)}
                                      className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                      title="Delete Textbook"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={t.authorsStr}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setTextbooksDraft(
                                        textbooksDraft.map((item) =>
                                          item.id === t.id ? { ...item, authorsStr: val } : item
                                        )
                                      );
                                    }}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                    placeholder="Authors (comma-separated)"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={t.publisher ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTextbooksDraft(
                                          textbooksDraft.map((item) =>
                                            item.id === t.id ? { ...item, publisher: val } : item
                                          )
                                        );
                                      }}
                                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                      placeholder="Publisher"
                                    />
                                    <input
                                      type="number"
                                      value={t.publication_year ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setTextbooksDraft(
                                          textbooksDraft.map((item) =>
                                            item.id === t.id
                                              ? { ...item, publication_year: val }
                                              : item
                                          )
                                        );
                                      }}
                                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                      placeholder="Year"
                                    />
                                  </div>
                                </div>
                              ))}
                              {textbooksDraft.length === 0 && (
                                <p className="text-center text-xs text-slate-400 py-3 italic">
                                  No textbooks. Click &apos;Add&apos; to record one.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2.5">
                              {(currentExt?.textbooks ?? []).map((b: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                                >
                                  <p className="font-semibold text-slate-900 dark:text-white">
                                    {b.title}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                    {Array.isArray(b.authors) ? b.authors.join(", ") : b.authors}{" "}
                                    {b.publisher ? `— ${b.publisher}` : ""}{" "}
                                    {b.publication_year ? `(${b.publication_year})` : ""}
                                  </p>
                                </div>
                              ))}
                              {(!currentExt?.textbooks || currentExt.textbooks.length === 0) && (
                                <p className="text-xs text-slate-400 italic">No textbooks recorded.</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <BookOpen className="h-4 w-4 text-teal-500" />
                              <span>Reference Books</span>
                            </h3>

                            {canEdit && (
                              <div>
                                {editingSection === "reference_books" ? (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={handleAddReferenceBookRow}
                                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                                      title="Add Reference Book"
                                    >
                                      <Plus className="h-3 w-3" />
                                      <span>Add</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={saveReferenceBooks}
                                      disabled={savingSection}
                                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                                    >
                                      <Save className="h-3 w-3" />
                                      <span>Save</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingSection(null)}
                                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={startEditReferenceBooks}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    <Edit2 className="h-3 w-3 text-indigo-500" />
                                    <span>Edit</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {editingSection === "reference_books" ? (
                            <div className="mt-3 space-y-3">
                              {referenceBooksDraft.map((t) => (
                                <div
                                  key={t.id}
                                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2 dark:border-slate-700 dark:bg-slate-800/40"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      value={t.title}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setReferenceBooksDraft(
                                          referenceBooksDraft.map((item) =>
                                            item.id === t.id ? { ...item, title: val } : item
                                          )
                                        );
                                      }}
                                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                      placeholder="Reference Book Title"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteReferenceBookRow(t.id)}
                                      className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                      title="Delete Reference Book"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={t.authorsStr}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setReferenceBooksDraft(
                                        referenceBooksDraft.map((item) =>
                                          item.id === t.id ? { ...item, authorsStr: val } : item
                                        )
                                      );
                                    }}
                                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                    placeholder="Authors (comma-separated)"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="text"
                                      value={t.publisher ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setReferenceBooksDraft(
                                          referenceBooksDraft.map((item) =>
                                            item.id === t.id ? { ...item, publisher: val } : item
                                          )
                                        );
                                      }}
                                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                      placeholder="Publisher"
                                    />
                                    <input
                                      type="number"
                                      value={t.publication_year ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setReferenceBooksDraft(
                                          referenceBooksDraft.map((item) =>
                                            item.id === t.id
                                              ? { ...item, publication_year: val }
                                              : item
                                          )
                                        );
                                      }}
                                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                      placeholder="Year"
                                    />
                                  </div>
                                </div>
                              ))}
                              {referenceBooksDraft.length === 0 && (
                                <p className="text-center text-xs text-slate-400 py-3 italic">
                                  No reference books. Click &apos;Add&apos; to record one.
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2.5">
                              {(currentExt?.reference_books ?? []).map((b: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 dark:bg-slate-800/40 dark:text-slate-300"
                                >
                                  <p className="font-semibold text-slate-900 dark:text-white">
                                    {b.title}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                    {Array.isArray(b.authors) ? b.authors.join(", ") : b.authors}{" "}
                                    {b.publisher ? `— ${b.publisher}` : ""}{" "}
                                    {b.publication_year ? `(${b.publication_year})` : ""}
                                  </p>
                                </div>
                              ))}
                              {(!currentExt?.reference_books ||
                                currentExt.reference_books.length === 0) && (
                                <p className="text-xs text-slate-400 italic">
                                  No reference books recorded.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 lg:col-span-2">
                        <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 dark:border-slate-800">
                            <div>
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                Curriculum Hierarchy (Units, Topics & Subtopics)
                              </h3>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {units.length} Units • Structured hierarchical teaching units
                              </p>
                            </div>

                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openUnitModal("add")}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Unit</span>
                              </button>
                            )}
                          </div>

                          <div className="mt-3 space-y-2.5">
                            {units.map((u: any, uIdx: number) => (
                              <div
                                key={u.id ?? uIdx}
                                className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 shadow-2xs dark:border-slate-800 dark:bg-slate-850/40"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="rounded-md bg-indigo-600 px-2 py-0.5 font-mono text-[10px] font-bold text-white shadow-2xs dark:bg-indigo-500">
                                        Unit {u.unit_number}
                                      </span>
                                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                        {u.unit_title}
                                      </h4>
                                    </div>
                                    {u.unit_overview && (
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                                        {u.unit_overview}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5">
                                    <span className="rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {u.theory_hours ?? 0} Th • {u.lab_hours ?? 0} Lab
                                    </span>

                                    {canEdit && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => openTopicModal("add", u.id)}
                                          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                                          title="Add Topic to this Unit"
                                        >
                                          <Plus className="h-3 w-3" />
                                          <span>Add Topic</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => openUnitModal("edit", u)}
                                          className="rounded-md border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                          title="Edit Unit"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteUnit(u.id)}
                                          className="rounded-md border border-rose-200 bg-rose-50 p-1 text-rose-600 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                                          title="Delete Unit"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-2.5 space-y-2">
                                  {(u.topics ?? []).map((t: any, tIdx: number) => (
                                    <div
                                      key={t.id ?? tIdx}
                                      className="rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-2xs dark:border-slate-700/60 dark:bg-slate-800"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                                            {t.topic_code ? `${t.topic_code} : ` : ""}
                                            {t.topic_name}
                                          </span>
                                          {t.knowledge_level && (
                                            <span className="rounded bg-indigo-50 px-1.5 py-0.2 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                              {t.knowledge_level}
                                            </span>
                                          )}
                                        </div>

                                        {canEdit && (
                                          <div className="flex items-center gap-1">
                                            <button
                                              type="button"
                                              onClick={() => openSubtopicModal("add", t.id)}
                                              className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                                              title="Add Subtopic under this Topic"
                                            >
                                              <Plus className="h-2.5 w-2.5" />
                                              <span>Subtopic</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => openTopicModal("edit", u.id, t)}
                                              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                              title="Edit Topic"
                                            >
                                              <Edit2 className="h-2.5 w-2.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteTopic(t.id)}
                                              className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                              title="Delete Topic"
                                            >
                                              <Trash2 className="h-2.5 w-2.5" />
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      {t.topic_description && (
                                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                          {t.topic_description}
                                        </p>
                                      )}

                                      <div className="mt-2 ml-2 border-l-2 border-indigo-200 pl-2.5 space-y-1.5 dark:border-indigo-900/60">
                                        {(t.subtopics ?? []).map((st: any, stIdx: number) => (
                                          <div
                                            key={st.id ?? stIdx}
                                            className="group flex items-center justify-between gap-2 rounded-md bg-slate-50/70 px-2 py-1 text-xs transition hover:bg-slate-100 dark:bg-slate-855/60 dark:hover:bg-slate-850"
                                          >
                                            <div className="flex items-center gap-1.5">
                                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                                              <span className="font-medium text-slate-700 dark:text-slate-200">
                                                {st.subtopic_code ? `${st.subtopic_code} : ` : ""}
                                                {st.subtopic_name}
                                              </span>
                                              {st.subtopic_description && (
                                                <span className="text-[10px] text-slate-400">
                                                  — {st.subtopic_description}
                                                </span>
                                              )}
                                            </div>

                                            {canEdit && (
                                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                                <button
                                                  type="button"
                                                  onClick={() => openSubtopicModal("edit", t.id, st)}
                                                  className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                                  title="Edit Subtopic"
                                                >
                                                  <Edit2 className="h-2.5 w-2.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteSubtopic(st.id)}
                                                  className="rounded p-0.5 text-slate-400 hover:text-rose-600"
                                                  title="Delete Subtopic"
                                                >
                                                  <Trash2 className="h-2.5 w-2.5" />
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        ))}

                                        {(!t.subtopics || t.subtopics.length === 0) && (
                                          <div className="flex items-center gap-2 text-[10px] text-slate-400 italic">
                                            <span>No subtopics nested.</span>
                                            {canEdit && (
                                              <button
                                                type="button"
                                                onClick={() => openSubtopicModal("add", t.id)}
                                                className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400 not-italic"
                                              >
                                                + Add Subtopic
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  {(!u.topics || u.topics.length === 0) && (
                                    <div className="rounded-lg border border-dashed border-slate-200 p-2.5 text-center text-xs text-slate-400 dark:border-slate-800">
                                      <span>No topics in this unit yet.</span>
                                      {canEdit && (
                                        <button
                                          type="button"
                                          onClick={() => openTopicModal("add", u.id)}
                                          className="ml-2 font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                                        >
                                          Add Topic
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {units.length === 0 && (
                              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center dark:border-slate-800">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                  No curriculum units recorded
                                </p>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => openUnitModal("add")}
                                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Create First Unit</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "copo" && (
              <div className="space-y-3">
                {renderVersionCards("copo")}

                <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Course Outcome to Program Outcome (CO-PO) Correlation Matrix
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Accreditation correlation matrix (1 = Low, 2 = Medium, 3 = High, 0 = None)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentCopo?.is_approved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        CO-PO Matrix Approved
                      </span>
                    ) : currentCopo ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                        Draft Version {currentCopo.version_number}
                      </span>
                    ) : null}

                    {isCoord && (
                      <button
                        type="button"
                        onClick={openGenerateCopoModal}
                        disabled={isCopoBusy || actionLoading === "generate_copo"}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isCopoBusy ? "Generating..." : "Generate CO-PO Mapping"}
                      </button>
                    )}

                    {isCoord && currentCopo && !currentCopo.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApproveCopo(currentCopo.copo_id)}
                        disabled={actionLoading === `approve_copo_${currentCopo.copo_id}`}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionLoading === `approve_copo_${currentCopo.copo_id}`
                          ? "Approving..."
                          : "Approve CO-PO"}
                      </button>
                    )}

                    {isCoord && currentCopo && currentCopo.is_approved && !currentCopo.is_active && (
                      <button
                        type="button"
                        onClick={() => handleActivateCopo(currentCopo.copo_id)}
                        disabled={actionLoading === `activate_copo_${currentCopo.copo_id}`}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {actionLoading === `activate_copo_${currentCopo.copo_id}`
                          ? "Activating..."
                          : "Set as Active"}
                      </button>
                    )}
                  </div>
                </div>

                {Object.keys(copoDirtyCells).length > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-2.5 text-xs text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-200">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      <span>
                        You have <strong>{Object.keys(copoDirtyCells).length}</strong> unsaved matrix
                        cell change(s).
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCopoDirtyCells({})}
                        className="rounded-lg border border-slate-300 px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        onClick={saveCopoDeltaChanges}
                        disabled={savingCopoDelta}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        <span>{savingCopoDelta ? "Saving..." : "Save Changes"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {(sectionLoading.copo || loadingVersionDetail) && !currentCopo && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white py-8 text-center dark:border-slate-800 dark:bg-slate-900">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Loading CO-PO matrix data...
                    </p>
                    <p className="text-[11px] text-slate-400">Fetching latest correlation matrix</p>
                  </div>
                )}

                {!sectionLoading.copo && !loadingVersionDetail && (() => {
                  const isCurrentBusy = isBusyState(currentCopo?.current_state);
                  const inProgressCopo = versionsCopo.find((c: any) =>
                    isBusyState(c.current_state)
                  );

                  if (isCurrentBusy) {
                    return renderGenerationLoadingScreen(
                      "CO-PO Correlation Matrix",
                      currentCopo.current_state,
                      currentCopo.version_number
                    );
                  }
                  if (!currentCopo && inProgressCopo) {
                    return renderGenerationLoadingScreen(
                      "CO-PO Correlation Matrix",
                      inProgressCopo.current_state,
                      inProgressCopo.version_number
                    );
                  }
                  return null;
                })()}

                {!sectionLoading.copo &&
                  !loadingVersionDetail &&
                  !currentCopo &&
                  !versionsCopo.some((c: any) => isBusyState(c.current_state)) && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center dark:border-slate-800 dark:bg-slate-900">
                      <Layers className="h-8 w-8 text-slate-400" />
                      <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                        {isCoord
                          ? versionsCopo.length > 0
                            ? "Select a Version to View"
                            : "No CO-PO Mapping Generated"
                          : "No Active CO-PO Mapping Available"}
                      </h3>
                      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        {isCoord
                          ? versionsCopo.length > 0
                            ? "Click 'View' on any version card above to load and inspect its correlation matrix."
                            : "Click 'Generate CO-PO Mapping' to trigger AI matrix generation based on an approved curriculum extraction."
                          : "There is no approved active CO-PO mapping version for this course yet."}
                      </p>
                      {isCoord && versionsCopo.length === 0 && (
                        <button
                          type="button"
                          onClick={openGenerateCopoModal}
                          disabled={isCopoBusy}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Generate CO-PO Mapping</span>
                        </button>
                      )}
                    </div>
                  )}

                {currentCopo && !isBusyState(currentCopo.current_state) && (() => {
                  const entries = currentCopo.matrix_entries ?? [];
                  const posMap = new Map<number, { po_id: number; po_code: string }>();
                  const cosMap = new Map<
                    number,
                    { course_outcome_id: number; co_code: string; description?: string }
                  >();
                  const cellMap = new Map<string, any>();
                  const extOutcomesMap = new Map<number, any>();
                  (currentExt?.outcomes ?? []).forEach((o: any) => extOutcomesMap.set(o.id, o));

                  entries.forEach((e: any) => {
                    if (!posMap.has(e.po_id)) {
                      posMap.set(e.po_id, {
                        po_id: e.po_id,
                        po_code: e.po_code ?? `PO${e.po_id}`,
                      });
                    }
                    if (!cosMap.has(e.course_outcome_id)) {
                      const extCo = extOutcomesMap.get(e.course_outcome_id);
                      cosMap.set(e.course_outcome_id, {
                        course_outcome_id: e.course_outcome_id,
                        co_code: e.co_code ?? extCo?.co_code ?? `CO${e.course_outcome_id}`,
                        description: e.co_description ?? extCo?.description,
                      });
                    }
                    cellMap.set(`${e.course_outcome_id}_${e.po_id}`, e);
                  });

                  const posList = Array.from(posMap.values()).sort((a, b) => {
                    const numA = parseInt(a.po_code.replace(/\D/g, "")) || a.po_id;
                    const numB = parseInt(b.po_code.replace(/\D/g, "")) || b.po_id;
                    return numA - numB;
                  });

                  const cosList = Array.from(cosMap.values()).sort((a, b) => {
                    const numA = parseInt(a.co_code.replace(/\D/g, "")) || a.course_outcome_id;
                    const numB = parseInt(b.co_code.replace(/\D/g, "")) || b.course_outcome_id;
                    return numA - numB;
                  });

                  const canEditMatrix = Boolean((isCoord || perms.can_edit) && currentCopo);

                  return (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Correlation Matrix ({cosList.length} COs × {posList.length} POs)
                            </span>
                            {canEditMatrix && (
                              <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                                Click any cell to edit score & justification
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 3 = High
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> 2 = Medium
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 1 = Low
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> 0 = None
                            </span>
                          </div>
                        </div>

                        <table className="mt-2.5 w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                              <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 w-24">
                                CO
                              </th>
                              <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 min-w-[200px]">
                                Outcome Description
                              </th>
                              {posList.map((po) => (
                                <th
                                  key={po.po_id}
                                  className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300 w-16"
                                >
                                  {po.po_code}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {cosList.map((co) => (
                              <tr
                                key={co.course_outcome_id}
                                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
                              >
                                <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                                  {co.co_code}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px] leading-snug max-w-sm">
                                  {co.description ?? "—"}
                                </td>
                                {posList.map((po) => {
                                  const entry = cellMap.get(
                                    `${co.course_outcome_id}_${po.po_id}`
                                  );
                                  if (!entry) {
                                    return (
                                      <td
                                        key={po.po_id}
                                        className="py-2.5 px-2 text-center text-slate-300"
                                      >
                                        —
                                      </td>
                                    );
                                  }
                                  const dirty = copoDirtyCells[entry.id];
                                  const currentVal =
                                    dirty !== undefined
                                      ? dirty.matrix_value
                                      : (entry.matrix_value ?? 0);
                                  const currentJust =
                                    dirty?.justification !== undefined
                                      ? dirty.justification
                                      : (entry.justification ?? "");
                                  const isDirty = dirty !== undefined;

                                  let colorClass =
                                    "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500";
                                  if (currentVal === 3)
                                    colorClass =
                                      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-bold";
                                  else if (currentVal === 2)
                                    colorClass =
                                      "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 font-bold";
                                  else if (currentVal === 1)
                                    colorClass =
                                      "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-semibold";

                                  return (
                                    <td key={po.po_id} className="py-2 px-1 text-center">
                                      <button
                                        type="button"
                                        disabled={!canEditMatrix}
                                        onClick={() =>
                                          setCopoEditingCell({
                                            id: entry.id,
                                            co_code: co.co_code,
                                            po_code: po.po_code,
                                            matrix_value: currentVal,
                                            justification: currentJust,
                                          })
                                        }
                                        title={
                                          currentJust
                                            ? `${co.co_code} → ${po.po_code}: ${currentJust}`
                                            : `${co.co_code} → ${po.po_code} (${currentVal})`
                                        }
                                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition ${colorClass} ${
                                          canEditMatrix
                                            ? "cursor-pointer hover:scale-110 hover:shadow-xs"
                                            : "cursor-default"
                                        } ${isDirty ? "ring-2 ring-indigo-500" : ""}`}
                                      >
                                        {currentVal}
                                      </button>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 pb-2 dark:border-slate-800">
                          Matrix Correlation Justifications (
                          {
                            entries.filter(
                              (e: any) =>
                                Boolean(e.justification) ||
                                Boolean(copoDirtyCells[e.id]?.justification)
                            ).length
                          }
                          )
                        </h4>
                        <div className="mt-2.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                          {entries
                            .filter(
                              (e: any) =>
                                Boolean(copoDirtyCells[e.id]?.justification) ||
                                Boolean(e.justification)
                            )
                            .map((e: any) => {
                              const val =
                                copoDirtyCells[e.id]?.matrix_value ?? e.matrix_value;
                              const just =
                                copoDirtyCells[e.id]?.justification ?? e.justification;
                              return (
                                <div
                                  key={e.id}
                                  className="rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800/40"
                                >
                                  <div className="flex items-center justify-between gap-1 font-semibold text-slate-800 dark:text-slate-200">
                                    <span>
                                      {e.co_code ?? `CO${e.course_outcome_id}`} →{" "}
                                      {e.po_code ?? `PO${e.po_id}`}
                                    </span>
                                    <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                      Level {val}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                    {just}
                                  </p>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === "pedagogy" && (
              <div className="space-y-3">
                {renderVersionCards("pedagogy")}

                <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Instructional Strategies & Topic Delivery Methods
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Suggested pedagogical approaches, activity models, and learning modes
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentPedagogy?.is_approved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Pedagogy Approved
                      </span>
                    ) : currentPedagogy ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                        Draft Version {currentPedagogy.version_number}
                      </span>
                    ) : null}

                    {isCoord && (
                      <button
                        type="button"
                        onClick={openGeneratePedagogyModal}
                        disabled={isPedagogyBusy || actionLoading === "generate_pedagogy"}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isPedagogyBusy ? "Generating..." : "Generate Pedagogy"}
                      </button>
                    )}

                    {isCoord && currentPedagogy && !currentPedagogy.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApprovePedagogy(currentPedagogy.pedagogy_id)}
                        disabled={
                          actionLoading === `approve_pedagogy_${currentPedagogy.pedagogy_id}`
                        }
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionLoading === `approve_pedagogy_${currentPedagogy.pedagogy_id}`
                          ? "Approving..."
                          : "Approve Pedagogy"}
                      </button>
                    )}

                    {isCoord &&
                      currentPedagogy &&
                      currentPedagogy.is_approved &&
                      !currentPedagogy.is_active && (
                        <button
                          type="button"
                          onClick={() => handleActivatePedagogy(currentPedagogy.pedagogy_id)}
                          disabled={
                            actionLoading === `activate_pedagogy_${currentPedagogy.pedagogy_id}`
                          }
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {actionLoading === `activate_pedagogy_${currentPedagogy.pedagogy_id}`
                            ? "Activating..."
                            : "Set as Active"}
                        </button>
                      )}
                  </div>
                </div>

                {(sectionLoading.pedagogy || loadingVersionDetail) && !currentPedagogy && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white py-8 text-center dark:border-slate-800 dark:bg-slate-900">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Loading pedagogy suggestions...
                    </p>
                    <p className="text-[11px] text-slate-400">Fetching latest instructional strategies</p>
                  </div>
                )}

                {!sectionLoading.pedagogy && !loadingVersionDetail && (() => {
                  const isCurrentBusy = isBusyState(currentPedagogy?.current_state);
                  const inProgressPedagogy = versionsPedagogies.find((p: any) =>
                    isBusyState(p.current_state)
                  );

                  if (isCurrentBusy) {
                    return renderGenerationLoadingScreen(
                      "Instructional Pedagogy",
                      currentPedagogy.current_state,
                      currentPedagogy.version_number
                    );
                  }
                  if (!currentPedagogy && inProgressPedagogy) {
                    return renderGenerationLoadingScreen(
                      "Instructional Pedagogy",
                      inProgressPedagogy.current_state,
                      inProgressPedagogy.version_number
                    );
                  }
                  return null;
                })()}

                {!sectionLoading.pedagogy &&
                  !loadingVersionDetail &&
                  !currentPedagogy &&
                  !versionsPedagogies.some((p: any) => isBusyState(p.current_state)) && (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center dark:border-slate-800 dark:bg-slate-900">
                      <Presentation className="h-8 w-8 text-slate-400" />
                      <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                        {isCoord
                          ? versionsPedagogies.length > 0
                            ? "Select a Version to View"
                            : "No Pedagogy Generated"
                          : "No Active Pedagogy Available"}
                      </h3>
                      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                        {isCoord
                          ? versionsPedagogies.length > 0
                            ? "Click 'View' on any version card above to load and inspect topic-level teaching delivery methods."
                            : "Click 'Generate Pedagogy' to automatically synthesize topic-level teaching delivery methods based on an approved curriculum extraction."
                          : "There is no approved active pedagogy strategy version for this course yet."}
                      </p>
                      {isCoord && versionsPedagogies.length === 0 && (
                        <button
                          type="button"
                          onClick={openGeneratePedagogyModal}
                          disabled={isPedagogyBusy}
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Generate Pedagogy</span>
                        </button>
                      )}
                    </div>
                  )}

                {currentPedagogy && !isBusyState(currentPedagogy.current_state) && (() => {
                  const unitsList = currentExt?.units ?? [];
                  const topicSuggestions = currentPedagogy.topic_suggestions ?? [];
                  const sugByTopicId = new Map<number, any>();
                  topicSuggestions.forEach((s: any) => sugByTopicId.set(s.topic_id, s));

                  const canEditPedagogy = Boolean((isCoord || perms.can_edit) && currentPedagogy);
                  const renderedSugIds = new Set<number>();
                  const hasUnits = unitsList.length > 0;

                  const renderStrategyCards = (sug: any) => (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-emerald-200/80 bg-white p-3.5 shadow-2xs dark:border-emerald-900/60 dark:bg-slate-900 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              1. Primary Strategy
                            </span>
                            {sug.bloom_level_1 && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {sug.bloom_level_1}
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {sug.pedagogy_suggested_1 ?? "Direct Instruction & Discussion"}
                          </h5>
                          {sug.methodology_1 && (
                            <p className="mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                              {sug.methodology_1}
                            </p>
                          )}
                          {sug.description_1 && (
                            <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                              {sug.description_1}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-sky-200/80 bg-white p-3.5 shadow-2xs dark:border-sky-900/60 dark:bg-slate-900 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                              2. Alternative Strategy 1
                            </span>
                            {sug.bloom_level_2 && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {sug.bloom_level_2}
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {sug.pedagogy_suggested_2 ?? "Collaborative Problem Solving"}
                          </h5>
                          {sug.methodology_2 && (
                            <p className="mt-1 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                              {sug.methodology_2}
                            </p>
                          )}
                          {sug.description_2 && (
                            <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                              {sug.description_2}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-violet-200/80 bg-white p-3.5 shadow-2xs dark:border-violet-900/60 dark:bg-slate-900 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                              3. Alternative Strategy 2
                            </span>
                            {sug.bloom_level_3 && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {sug.bloom_level_3}
                              </span>
                            )}
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                            {sug.pedagogy_suggested_3 ?? "Flipped Classroom / Project Work"}
                          </h5>
                          {sug.methodology_3 && (
                            <p className="mt-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
                              {sug.methodology_3}
                            </p>
                          )}
                          {sug.description_3 && (
                            <p className="mt-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                              {sug.description_3}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );

                  return (
                    <div className="space-y-3">
                      {hasUnits
                        ? unitsList.map((unit: any, uIdx: number) => {
                            const uTopics = unit.topics ?? [];
                            if (uTopics.length === 0) return null;

                            return (
                              <div
                                key={unit.id ?? uIdx}
                                className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-2 dark:border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white shadow-2xs dark:bg-indigo-500">
                                      Unit {unit.unit_number}
                                    </span>
                                    <div>
                                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                        {unit.unit_title}
                                      </h4>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {uTopics.map((topic: any, tIdx: number) => {
                                    const sug = sugByTopicId.get(topic.id);
                                    if (sug) renderedSugIds.add(sug.id);

                                    return (
                                      <div
                                        key={topic.id ?? tIdx}
                                        className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850/50 space-y-2"
                                      >
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5 dark:border-slate-750">
                                          <div className="flex items-center gap-2">
                                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                              Topic {unit.unit_number}.{topic.learning_sequence ?? tIdx + 1}
                                            </span>
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                              {topic.topic_name}
                                            </span>
                                          </div>
                                        </div>

                                        {sug ? (
                                          renderStrategyCards(sug)
                                        ) : (
                                          <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400 dark:border-slate-700">
                                            No pedagogy strategies recorded for this topic.
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })
                        : null}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === "lesson_plan" && (
              <div className="space-y-3">
                {renderVersionCards("lesson_plan")}

                <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Lecture Plan, Hourly Allocation & Delivery Schedule
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Target hours: {currentLessonPlan?.target_total_hours ?? 45} Hrs
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentLessonPlan?.is_approved ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Lesson Plan Approved
                      </span>
                    ) : currentLessonPlan ? (
                      <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                        Draft Version {currentLessonPlan.version_number}
                      </span>
                    ) : null}

                    {isCoord && (
                      <button
                        type="button"
                        onClick={openGenerateLessonPlanModal}
                        disabled={isLessonPlanBusy || actionLoading === "generate_lp"}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {isLessonPlanBusy ? "Generating..." : "Generate Lesson Plan"}
                      </button>
                    )}

                    {isCoord && currentLessonPlan && !currentLessonPlan.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApproveLessonPlan(currentLessonPlan.lesson_plan_id)}
                        disabled={
                          actionLoading ===
                          `approve_lesson_plan_${currentLessonPlan.lesson_plan_id}`
                        }
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionLoading ===
                        `approve_lesson_plan_${currentLessonPlan.lesson_plan_id}`
                          ? "Approving..."
                          : "Approve Lesson Plan"}
                      </button>
                    )}

                    {isCoord &&
                      currentLessonPlan &&
                      currentLessonPlan.is_approved &&
                      !currentLessonPlan.is_active && (
                        <button
                          type="button"
                          onClick={() => handleActivateLessonPlan(currentLessonPlan.lesson_plan_id)}
                          disabled={
                            actionLoading ===
                            `activate_lesson_plan_${currentLessonPlan.lesson_plan_id}`
                          }
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                        >
                          {actionLoading ===
                          `activate_lesson_plan_${currentLessonPlan.lesson_plan_id}`
                            ? "Activating..."
                            : "Set as Active"}
                        </button>
                      )}
                  </div>
                </div>

                {(sectionLoading.lesson_plan || loadingVersionDetail) && !currentLessonPlan && (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-white py-8 text-center dark:border-slate-800 dark:bg-slate-900">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Loading lesson plan schedule...
                    </p>
                  </div>
                )}

                {!sectionLoading.lesson_plan && !loadingVersionDetail && (() => {
                  const isCurrentBusy = isBusyState(currentLessonPlan?.current_state);
                  const inProgressLessonPlan = versionsLessonPlans.find((l: any) =>
                    isBusyState(l.current_state)
                  );

                  if (isCurrentBusy) {
                    return renderGenerationLoadingScreen(
                      "Lesson Plan Timeline",
                      currentLessonPlan.current_state,
                      currentLessonPlan.version_number
                    );
                  }
                  if (!currentLessonPlan && inProgressLessonPlan) {
                    return renderGenerationLoadingScreen(
                      "Lesson Plan Timeline",
                      inProgressLessonPlan.current_state,
                      inProgressLessonPlan.version_number
                    );
                  }
                  return null;
                })()}

                {currentLessonPlan && !isBusyState(currentLessonPlan.current_state) && (() => {
                  const slots = currentLessonPlan.topic_slots ?? [];
                  const groupsMap = new Map<
                    string,
                    { unitTitle: string; slots: any[]; totalHours: number }
                  >();

                  slots.forEach((slot: any) => {
                    const uKey = slot.unit_title ?? "Curriculum Topics";
                    if (!groupsMap.has(uKey)) {
                      groupsMap.set(uKey, { unitTitle: uKey, slots: [], totalHours: 0 });
                    }
                    const g = groupsMap.get(uKey)!;
                    g.slots.push(slot);
                    g.totalHours += Number(slot.time_allocated) || 0;
                  });

                  const groupsList = Array.from(groupsMap.values());
                  const canEditLp = Boolean((isCoord || perms.can_edit) && currentLessonPlan);

                  return (
                    <div className="space-y-3">
                      {groupsList.map((group, gIdx) => (
                        <div
                          key={gIdx}
                          className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-2 dark:border-slate-800">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                              {group.unitTitle}
                            </h4>
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                              {formatMinutes(group.totalHours)} Total Allocated
                            </span>
                          </div>

                          <div className="space-y-2">
                            {group.slots.map((slot: any, sIdx: number) => {
                              const isEditingThisSlot = editingLpSlotId === slot.id;
                              const subSlots = slot.subtopic_slots ?? [];

                              return (
                                <div
                                  key={slot.id ?? sIdx}
                                  className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-850/40 space-y-2"
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="space-y-0.5">
                                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-2">
                                        Slot #{sIdx + 1}
                                      </span>
                                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {slot.topic_name}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="rounded-lg bg-indigo-100/70 px-2.5 py-0.5 font-mono text-xs font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                        {formatMinutes(slot.time_allocated)}
                                      </span>
                                      {canEditLp && !isEditingThisSlot && (
                                        <button
                                          type="button"
                                          onClick={() => startEditLpSlot(slot)}
                                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                          <Edit2 className="h-3 w-3 text-indigo-500" />
                                          <span>Edit Slot</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {isEditingThisSlot ? (
                                    <div className="rounded-lg border border-indigo-200 bg-white p-3 dark:border-indigo-900 dark:bg-slate-900 space-y-3">
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                            Allocated Time ({formatMinutes(lpSlotDraft.time_allocated)})
                                          </label>
                                          <input
                                            type="number"
                                            min={0.1}
                                            step={0.05}
                                            value={lpSlotDraft.time_allocated}
                                            onChange={(e) =>
                                              setLpSlotDraft({
                                                ...lpSlotDraft,
                                                time_allocated: Number(e.target.value),
                                              })
                                            }
                                            className="mt-1 w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-end gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => saveLpSlot(slot.id)}
                                          disabled={savingLpSlot}
                                          className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                          <Check className="h-3 w-3" />
                                          <span>{savingLpSlot ? "Saving..." : "Save"}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingLpSlotId(null)}
                                          className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                                        Activity:{" "}
                                      </span>
                                      <span>
                                        {slot.suggested_activity ??
                                          "Interactive lecture with hands-on practice"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {activeTab === "mcq_generation" && isCoord && (
              <SimplifiedMCQGenerator
                courseCode={course?.course_code ?? "COURSE"}
                courseTitle={course?.course_title ?? "Academic Course"}
                hierarchyUnits={mcqHierarchyUnits}
                loadingHierarchy={Boolean(loadingHierarchyUnits || sectionLoading.syllabus || loading)}
                onGenerate={handleSimplifiedMCQGenerate}
                isGeneratingAI={isGeneratingMCQ}
              />
            )}

            {activeTab === "report" && (
              <CoursePortfolioReport
                courseId={Number(courseIdParam) || 1}
                portfolio={portfolio}
                courseMetadata={course}
                onRefresh={fetchPortfolio}
              />
            )}

            {activeTab === "cia_analytics" && (
              <CiaAnalyticsTab courseId={Number(courseIdParam) || 1} />
            )}

            {activeTab === "mcq_viva" && (
              <McqVivaTab courseId={Number(courseIdParam) || 1} />
            )}
          </>
        );

        if (splitScreenView) {
          return (
            <div className="mt-2.5 grid grid-cols-1 gap-3 lg:grid-cols-12 items-start">
              <div className="lg:col-span-6 h-[calc(100vh-140px)] min-h-[580px] sticky top-3 rounded-xl border border-slate-200/90 bg-slate-900 shadow-xs overflow-hidden dark:border-slate-800 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold truncate">
                      {activeSyllabus?.original_filename ?? "Syllabus Document"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSplitScreenView(false)}
                    className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded-md hover:bg-slate-800 transition"
                  >
                    Close Split View ✕
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  {loadingDoc ? (
                    <div className="flex h-full items-center justify-center text-slate-400 text-xs">
                      <RefreshCw className="h-5 w-5 animate-spin mr-2 text-indigo-400" />
                      Loading document preview...
                    </div>
                  ) : (
                    <PDFViewer
                      file={documentBlobUrl}
                      fileName={activeSyllabus?.original_filename ?? "Syllabus_Document.pdf"}
                    />
                  )}
                </div>
              </div>

              <div className="lg:col-span-6 h-[calc(100vh-140px)] min-h-[580px] overflow-y-auto pr-1 space-y-3">
                {tabContent}
              </div>
            </div>
          );
        }

        return <div className="mt-2.5 space-y-3">{tabContent}</div>;
      })()}

      {hierarchyModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 sm:p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {hierarchyModal.type === "unit"
                  ? hierarchyModal.mode === "add"
                    ? "Add Curriculum Unit"
                    : `Edit Unit ${modalForm.unit_number}`
                  : hierarchyModal.type === "topic"
                  ? hierarchyModal.mode === "add"
                    ? "Add Topic to Unit"
                    : "Edit Topic"
                  : hierarchyModal.mode === "add"
                  ? "Add Subtopic to Topic"
                  : "Edit Subtopic"}
              </h3>
              <button
                type="button"
                onClick={() => setHierarchyModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleHierarchySubmit} className="mt-4 space-y-4">
              {hierarchyModal.type === "unit" && (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Unit #
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={modalForm.unit_number}
                        onChange={(e) =>
                          setModalForm({ ...modalForm, unit_number: Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Unit Title
                      </label>
                      <input
                        type="text"
                        required
                        value={modalForm.unit_title}
                        onChange={(e) =>
                          setModalForm({ ...modalForm, unit_title: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        placeholder="e.g., Introduction to Neural Networks"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Unit Overview
                    </label>
                    <textarea
                      rows={3}
                      value={modalForm.unit_overview}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, unit_overview: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </>
              )}

              {hierarchyModal.type === "topic" && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Topic Code
                      </label>
                      <input
                        type="text"
                        value={modalForm.topic_code}
                        onChange={(e) =>
                          setModalForm({ ...modalForm, topic_code: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Topic Name
                    </label>
                    <input
                      type="text"
                      required
                      value={modalForm.topic_name}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, topic_name: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </>
              )}

              {hierarchyModal.type === "subtopic" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Subtopic Code
                    </label>
                    <input
                      type="text"
                      value={modalForm.subtopic_code}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, subtopic_code: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Subtopic Name
                    </label>
                    <input
                      type="text"
                      required
                      value={modalForm.subtopic_name}
                      onChange={(e) =>
                        setModalForm({ ...modalForm, subtopic_name: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setHierarchyModal(null)}
                  disabled={submittingModal}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{submittingModal ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadModal && isCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-4 sm:p-5 shadow-xl dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Upload Course Syllabus
            </h3>
            <form onSubmit={handleUploadSyllabus} className="mt-4 space-y-3">
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-4 text-center hover:border-indigo-500 dark:border-slate-700">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                  id="syllabus-upload-input"
                />
                <label htmlFor="syllabus-upload-input" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-6 w-6 text-slate-400" />
                  <span className="mt-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {uploadFile ? uploadFile.name : "Click to browse file"}
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1.5">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading || isExtractionBusy}
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload & Extract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGenerateCopoModal && isCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-4 sm:p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <span>Generate CO-PO Mapping</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGenerateCopoModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Approved Extraction Version
              </label>
              <select
                value={selectedExtractionForCopo ?? ""}
                onChange={(e) => setSelectedExtractionForCopo(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {versionsExtractions
                  .filter((e: any) => Boolean(e.is_approved))
                  .map((e: any) => (
                    <option key={e.extractions_id} value={e.extractions_id}>
                      Version {e.version_number} — {e.is_active ? "Active" : "Approved"}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 border-t border-slate-100 dark:border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setShowGenerateCopoModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerateCopo}
                disabled={actionLoading === "generate_copo" || !selectedExtractionForCopo || isCopoBusy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Queue Generation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showGeneratePedagogyModal && isCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-4 sm:p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Presentation className="h-4 w-4 text-indigo-500" />
                <span>Generate Pedagogy Strategies</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGeneratePedagogyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Select Approved Extraction Version
              </label>
              <select
                value={selectedExtractionForPedagogy ?? ""}
                onChange={(e) => setSelectedExtractionForPedagogy(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {versionsExtractions
                  .filter((e: any) => Boolean(e.is_approved))
                  .map((e: any) => (
                    <option key={e.extractions_id} value={e.extractions_id}>
                      Version {e.version_number} — {e.is_active ? "Active" : "Approved"}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setShowGeneratePedagogyModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGeneratePedagogy}
                disabled={actionLoading === "generate_pedagogy" || !selectedExtractionForPedagogy || isPedagogyBusy}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Queue Generation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerateLessonPlanModal && isCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white p-4 sm:p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-500" />
                <span>Generate Lesson Plan Schedule</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGenerateLessonPlanModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Approved Extraction Version
                </label>
                <select
                  value={selectedExtractionForLp ?? ""}
                  onChange={(e) => setSelectedExtractionForLp(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {versionsExtractions
                    .filter((e: any) => Boolean(e.is_approved))
                    .map((e: any) => (
                      <option key={e.extractions_id} value={e.extractions_id}>
                        Extraction v{e.version_number} — {e.is_active ? "Active" : "Approved"}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Approved Pedagogy Version (Optional)
                </label>
                <select
                  value={selectedPedagogyForLp ?? ""}
                  onChange={(e) =>
                    setSelectedPedagogyForLp(e.target.value ? Number(e.target.value) : null)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">None (Use standard classroom delivery activities)</option>
                  {versionsPedagogies
                    .filter((p: any) => Boolean(p.is_approved))
                    .map((p: any) => (
                      <option key={p.pedagogy_id} value={p.pedagogy_id}>
                        Pedagogy v{p.version_number} — {p.is_active ? "Active" : "Approved"}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Total Hours
                </label>
                <input
                  type="number"
                  min={1}
                  value={lpTargetHours}
                  onChange={(e) => setLpTargetHours(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="e.g. 45"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setShowGenerateLessonPlanModal(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerateLessonPlan}
                disabled={actionLoading === "generate_lp" || !selectedExtractionForLp || isLessonPlanBusy}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Queue Generation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {copoEditingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-4 sm:p-5 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Edit2 className="h-4 w-4 text-indigo-500" />
                <span>
                  Edit Cell: {copoEditingCell.co_code} → {copoEditingCell.po_code}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setCopoEditingCell(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Correlation Level
                </label>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                  {[
                    { val: 0, label: "0 - None", color: "hover:border-slate-400 bg-slate-50 dark:bg-slate-800" },
                    { val: 1, label: "1 - Low", color: "hover:border-amber-400 bg-amber-50/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
                    { val: 2, label: "2 - Medium", color: "hover:border-sky-400 bg-sky-50/70 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300" },
                    { val: 3, label: "3 - High", color: "hover:border-emerald-400 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() =>
                        setCopoEditingCell({ ...copoEditingCell, matrix_value: opt.val })
                      }
                      className={`rounded-lg border py-2 text-center text-xs font-bold transition ${opt.color} ${
                        copoEditingCell.matrix_value === opt.val
                          ? "border-indigo-600 ring-2 ring-indigo-500/30"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Accreditation Justification
                </label>
                <textarea
                  rows={2.5}
                  value={copoEditingCell.justification ?? ""}
                  onChange={(e) =>
                    setCopoEditingCell({
                      ...copoEditingCell,
                      justification: e.target.value,
                    })
                  }
                  placeholder="Explain why this CO supports this Program Outcome..."
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setCopoEditingCell(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setCopoDirtyCells((prev) => ({
                    ...prev,
                    [copoEditingCell.id]: {
                      matrix_value: Number(copoEditingCell.matrix_value) || 0,
                      justification: copoEditingCell.justification?.trim() ?? "",
                    },
                  }));
                  setCopoEditingCell(null);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-95"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Apply to Cell</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(InsCourseArtifacts);