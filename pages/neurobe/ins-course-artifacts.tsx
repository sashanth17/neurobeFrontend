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
  ChevronDown,
  ChevronRight,
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
  Lock,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import Models from "@/imports/models.import";
import PDFViewer from "@/components/academic-setup/PDFViewer";

const InsCourseArtifacts = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  // Active course ID from query or localStorage
  const courseIdParam = useMemo(() => {
    return (
      (router.query.course_id as string) ||
      (router.query.id as string) ||
      (typeof window !== "undefined" ? localStorage.getItem("active_course_id") : null)
    );
  }, [router.query.course_id, router.query.id]);

  useEffect(() => {
    if (courseIdParam) {
      try {
        localStorage.setItem("active_course_id", courseIdParam);
      } catch {}
    }
  }, [courseIdParam]);

  // Master Portfolio Data state
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"syllabus" | "copo" | "pedagogy" | "lesson_plan">("syllabus");

  // Filter unit selection for Pedagogy & Lesson Plan
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number>(0);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  // Background job notice banner (Static, NO polling)
  const [jobNotice, setJobNotice] = useState<string | null>(null);

  // Action in-progress state
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    dispatch(setPageTitle("Course Artifacts Portfolio"));
  }, [dispatch]);

  // Single Atomic Fetch (Load once on mount / explicit refresh only)
  const fetchPortfolio = async (isManualRefresh = false) => {
    if (!courseIdParam) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res: any = await Models.course.course_portfolio(courseIdParam);
      setPortfolio(res);
    } catch (err: any) {
      console.error("Failed to load course portfolio:", err);
      setError(getErrorMessage(err, "Failed to load course portfolio"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (courseIdParam) {
      fetchPortfolio(false);
    }
  }, [courseIdParam]);

  const course = portfolio?.course || {};
  const perms = portfolio?.permissions || {
    is_coordinator: false,
    can_edit: false,
    can_upload_syllabus: false,
    can_approve: false,
    can_activate: false,
    can_generate_copo: false,
    can_generate_pedagogy: false,
    can_generate_lesson_plan: false,
  };
  const isCoord = Boolean(perms.is_coordinator);

  const activeSyllabus = portfolio?.active_syllabus;
  const activeExt = portfolio?.active_extraction;
  const activeCopo = portfolio?.active_copo;
  const activePedagogy = portfolio?.active_pedagogy;
  const activeLessonPlan = portfolio?.active_lesson_plan;

  // ── Selected Historical Version State (for Coordinator preview) ────────────
  const [selectedVersionData, setSelectedVersionData] = useState<{
    syllabus?: any;
    copo?: any;
    pedagogy?: any;
    lesson_plan?: any;
  }>({});
  const [loadingVersionDetail, setLoadingVersionDetail] = useState<boolean>(false);

  // Active / Selected item aliases
  const currentExt = selectedVersionData.syllabus || activeExt;
  const currentCopo = selectedVersionData.copo || activeCopo;
  const currentPedagogy = selectedVersionData.pedagogy || activePedagogy;
  const currentLessonPlan = selectedVersionData.lesson_plan || activeLessonPlan;

  // In-progress generation check (One generation at a time per tab)
  const isExtractionBusy = Boolean(
    (portfolio?.versions?.extractions || []).some(
      (e: any) => e.current_state === "redis_queued" || e.current_state === "processing"
    )
  );
  const isCopoBusy = Boolean(
    (portfolio?.versions?.copo || []).some(
      (c: any) => c.current_state === "redis_queued" || c.current_state === "processing"
    )
  );
  const isPedagogyBusy = Boolean(
    (portfolio?.versions?.pedagogies || []).some(
      (p: any) => p.current_state === "redis_queued" || p.current_state === "processing"
    )
  );
  const isLessonPlanBusy = Boolean(
    (portfolio?.versions?.lesson_plans || []).some(
      (l: any) => l.current_state === "redis_queued" || l.current_state === "processing"
    )
  );

  // ── Generation Modals State ────────────────────────────────────────────────
  const [showGenerateCopoModal, setShowGenerateCopoModal] = useState<boolean>(false);
  const [selectedExtractionForCopo, setSelectedExtractionForCopo] = useState<number | null>(null);

  const [showGeneratePedagogyModal, setShowGeneratePedagogyModal] = useState<boolean>(false);
  const [selectedExtractionForPedagogy, setSelectedExtractionForPedagogy] = useState<number | null>(null);

  const [showGenerateLessonPlanModal, setShowGenerateLessonPlanModal] = useState<boolean>(false);
  const [selectedExtractionForLp, setSelectedExtractionForLp] = useState<number | null>(null);
  const [selectedPedagogyForLp, setSelectedPedagogyForLp] = useState<number | null>(null);
  const [lpTargetHours, setLpTargetHours] = useState<number>(45);

  // ── COPO Matrix Grid & Delta Save State ────────────────────────────────────
  const [copoEditingCell, setCopoEditingCell] = useState<any | null>(null);
  const [copoDirtyCells, setCopoDirtyCells] = useState<Record<number, { matrix_value: number; justification?: string }>>({});
  const [savingCopoDelta, setSavingCopoDelta] = useState<boolean>(false);

  // ── Pedagogy Per-Topic Edit State ──────────────────────────────────────────
  const [editingPedagogyTopicId, setEditingPedagogyTopicId] = useState<number | null>(null);
  const [pedagogyDraft, setPedagogyDraft] = useState<{
    bloom_level_1?: string;
    pedagogy_suggested_1?: string;
    description_1?: string;
    methodology_1?: string;
  }>({});
  const [savingPedagogyTopic, setSavingPedagogyTopic] = useState<boolean>(false);

  // ── Lesson Plan Per-Slot Edit State ────────────────────────────────────────
  const [editingLpSlotId, setEditingLpSlotId] = useState<number | null>(null);
  const [lpSlotDraft, setLpSlotDraft] = useState<{
    time_allocated?: number;
    bloom_level?: string;
    suggested_activity?: string;
  }>({});
  const [savingLpSlot, setSavingLpSlot] = useState<boolean>(false);

  // ── Split-Screen Document Viewer State ─────────────────────────────────────
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
    const directFileUrl = `http://localhost:8080/course/syllabi/${sylId}/file${tokenParam}`;

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

  // ── Actions (Course Coordinator Only) ──────────────────────────────────────

  const handleUploadSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !courseIdParam) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("course_id", String(courseIdParam));
      formData.append("file", uploadFile);

      await Models.syllabus.upload(formData);
      Success("Syllabus document uploaded! AI Extraction has been queued.");
      setShowUploadModal(false);
      setUploadFile(null);
      setJobNotice(
        "A syllabus extraction job has been queued. When processing completes, please click the Refresh button above to load the extracted curriculum."
      );
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to upload syllabus document"));
    } finally {
      setUploading(false);
    }
  };

  const handleApproveExtraction = async (specificId?: any) => {
    const targetId = specificId || currentExt?.extractions_id;
    if (!targetId) return;
    try {
      setActionLoading(`approve_syllabus_${targetId}`);
      await Models.syllabus.extraction_approve(targetId);
      Success("Curriculum extraction approved successfully!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve extraction"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateExtraction = async (specificId?: any) => {
    const targetId = specificId || currentExt?.extractions_id;
    if (!targetId) return;
    try {
      setActionLoading(`activate_syllabus_${targetId}`);
      await Models.syllabus.extraction_activate(targetId);
      Success("Extraction activated as current version!");
      setSelectedVersionData((prev) => ({ ...prev, syllabus: undefined }));
      fetchPortfolio(true);
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
    const approvedExts = (portfolio?.versions?.extractions || []).filter((e: any) => e.is_approved);
    if (approvedExts.length === 0) {
      Failure("No approved extraction found. Please approve an extraction version first.");
      return;
    }
    setSelectedExtractionForCopo(approvedExts[0].extractions_id);
    setShowGenerateCopoModal(true);
  };

  const handleConfirmGenerateCopo = async () => {
    if (!selectedExtractionForCopo) return;
    try {
      setActionLoading("generate_copo");
      await Models.copo.generate({ extractions_id: selectedExtractionForCopo });
      Success("CO-PO mapping generation queued!");
      setShowGenerateCopoModal(false);
      setJobNotice(
        "CO-PO mapping generation is queued. When completed, click the Refresh button to load the generated matrix."
      );
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to trigger CO-PO generation"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveCopo = async (specificId?: any) => {
    const targetId = specificId || currentCopo?.copo_id;
    if (!targetId) return;
    try {
      setActionLoading(`approve_copo_${targetId}`);
      await Models.copo.approve(targetId);
      Success("CO-PO mapping approved!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve CO-PO mapping"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateCopo = async (specificId?: any) => {
    const targetId = specificId || currentCopo?.copo_id;
    if (!targetId) return;
    try {
      setActionLoading(`activate_copo_${targetId}`);
      await Models.copo.activate(targetId);
      Success("CO-PO mapping activated as current version!");
      setSelectedVersionData((prev) => ({ ...prev, copo: undefined }));
      fetchPortfolio(true);
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
    const approvedExts = (portfolio?.versions?.extractions || []).filter((e: any) => e.is_approved);
    if (approvedExts.length === 0) {
      Failure("No approved extraction found. Please approve an extraction version first.");
      return;
    }
    setSelectedExtractionForPedagogy(approvedExts[0].extractions_id);
    setShowGeneratePedagogyModal(true);
  };

  const handleConfirmGeneratePedagogy = async () => {
    if (!selectedExtractionForPedagogy) return;
    try {
      setActionLoading("generate_pedagogy");
      await Models.pedagogy.generate({ extractions_id: selectedExtractionForPedagogy });
      Success("Pedagogy suggestions generation queued!");
      setShowGeneratePedagogyModal(false);
      setJobNotice(
        "Pedagogy generation is queued. When completed, click the Refresh button to load the new teaching strategies."
      );
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to trigger pedagogy generation"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprovePedagogy = async (specificId?: any) => {
    const targetId = specificId || currentPedagogy?.pedagogy_id;
    if (!targetId) return;
    try {
      setActionLoading(`approve_pedagogy_${targetId}`);
      await Models.pedagogy.approve(targetId);
      Success("Pedagogy suggestions approved!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve pedagogy"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivatePedagogy = async (specificId?: any) => {
    const targetId = specificId || currentPedagogy?.pedagogy_id;
    if (!targetId) return;
    try {
      setActionLoading(`activate_pedagogy_${targetId}`);
      await Models.pedagogy.activate(targetId);
      Success("Pedagogy suggestions activated as current version!");
      setSelectedVersionData((prev) => ({ ...prev, pedagogy: undefined }));
      fetchPortfolio(true);
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
    const approvedExts = (portfolio?.versions?.extractions || []).filter((e: any) => e.is_approved);
    if (approvedExts.length === 0) {
      Failure("No approved extraction found. Please approve an extraction version first.");
      return;
    }
    setSelectedExtractionForLp(approvedExts[0].extractions_id);
    const approvedPeds = (portfolio?.versions?.pedagogies || []).filter((p: any) => p.is_approved);
    setSelectedPedagogyForLp(approvedPeds.length > 0 ? approvedPeds[0].pedagogy_id : null);
    setLpTargetHours(currentExt?.total_theory_hours || 45);
    setShowGenerateLessonPlanModal(true);
  };

  const handleConfirmGenerateLessonPlan = async () => {
    if (!selectedExtractionForLp) return;
    try {
      setActionLoading("generate_lp");
      await Models.lession_plan.generate({
        extractions_id: selectedExtractionForLp,
        pedagogy_id: selectedPedagogyForLp || undefined,
        target_total_hours: Number(lpTargetHours) || 45,
      });
      Success("Lesson plan generation queued!");
      setShowGenerateLessonPlanModal(false);
      setJobNotice(
        "Lesson plan schedule generation is queued. When completed, click the Refresh button to load the hourly timeline."
      );
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to trigger lesson plan generation"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveLessonPlan = async (specificId?: any) => {
    const targetId = specificId || currentLessonPlan?.lesson_plan_id;
    if (!targetId) return;
    try {
      setActionLoading(`approve_lesson_plan_${targetId}`);
      await Models.lession_plan.approve(targetId);
      Success("Lesson plan approved!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve lesson plan"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateLessonPlan = async (specificId?: any) => {
    const targetId = specificId || currentLessonPlan?.lesson_plan_id;
    if (!targetId) return;
    try {
      setActionLoading(`activate_lesson_plan_${targetId}`);
      await Models.lession_plan.activate(targetId);
      Success("Lesson plan activated as current version!");
      setSelectedVersionData((prev) => ({ ...prev, lesson_plan: undefined }));
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate lesson plan"));
    } finally {
      setActionLoading(null);
    }
  };

  // ── Version Card Selection Handler ─────────────────────────────────────────
  const handleSelectVersionCard = async (
    tabType: "syllabus" | "copo" | "pedagogy" | "lesson_plan",
    versionItem: any,
    idKey: string
  ) => {
    const itemId = versionItem[idKey];
    if (versionItem.is_active) {
      setSelectedVersionData((prev) => ({ ...prev, [tabType]: undefined }));
      return;
    }
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

  // ── Version Cards Carousel / Panel ─────────────────────────────────────────
  const renderVersionCards = (tabType: "syllabus" | "copo" | "pedagogy" | "lesson_plan") => {
    if (!isCoord) return null;

    let versionsList: any[] = [];
    let idKey = "";
    let approveFn: ((id: any) => Promise<void>) | null = null;
    let activateFn: ((id: any) => Promise<void>) | null = null;
    let approveLoadingPrefix = "";
    let activateLoadingPrefix = "";

    if (tabType === "syllabus") {
      versionsList = portfolio?.versions?.extractions || [];
      idKey = "extractions_id";
      approveFn = handleApproveExtraction;
      activateFn = handleActivateExtraction;
      approveLoadingPrefix = "approve_syllabus_";
      activateLoadingPrefix = "activate_syllabus_";
    } else if (tabType === "copo") {
      versionsList = portfolio?.versions?.copo || [];
      idKey = "copo_id";
      approveFn = handleApproveCopo;
      activateFn = handleActivateCopo;
      approveLoadingPrefix = "approve_copo_";
      activateLoadingPrefix = "activate_copo_";
    } else if (tabType === "pedagogy") {
      versionsList = portfolio?.versions?.pedagogies || [];
      idKey = "pedagogy_id";
      approveFn = handleApprovePedagogy;
      activateFn = handleActivatePedagogy;
      approveLoadingPrefix = "approve_pedagogy_";
      activateLoadingPrefix = "activate_pedagogy_";
    } else if (tabType === "lesson_plan") {
      versionsList = portfolio?.versions?.lesson_plans || [];
      idKey = "lesson_plan_id";
      approveFn = handleApproveLessonPlan;
      activateFn = handleActivateLessonPlan;
      approveLoadingPrefix = "approve_lesson_plan_";
      activateLoadingPrefix = "activate_lesson_plan_";
    }

    if (versionsList.length === 0) return null;

    const selectedVer = selectedVersionData[tabType];

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Version History ({versionsList.length})
              </span>
            </div>
            {selectedVer && (
              <button
                type="button"
                onClick={() => setSelectedVersionData((prev) => ({ ...prev, [tabType]: undefined }))}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                ← Reset to Active Version
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
            {versionsList.map((ver: any, idx: number) => {
              const itemId = ver[idKey];
              const isItemActive = Boolean(ver.is_active);
              const isItemApproved = Boolean(ver.is_approved);
              const isSelected = selectedVer ? (selectedVer[idKey] === itemId) : isItemActive;
              const isBusy = ver.current_state === "redis_queued" || ver.current_state === "processing";

              return (
                <div
                  key={itemId || idx}
                  className={`min-w-[210px] shrink-0 rounded-xl border p-3 transition ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/40 shadow-xs dark:border-indigo-600 dark:bg-indigo-950/40"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-850/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      v{ver.version_number || (idx + 1)}
                    </span>
                    <div className="flex items-center gap-1">
                      {isItemActive && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Active
                        </span>
                      )}
                      {isItemApproved ? (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          Approved
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-1 text-[11px] text-slate-400">
                    {ver.created_at ? new Date(ver.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </p>

                  {isBusy && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                      <Sparkles className="h-3 w-3 animate-spin" />
                      <span>{ver.current_state}</span>
                    </div>
                  )}

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    {isSelected ? (
                      <span className="rounded-md bg-indigo-600/10 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {isItemActive && !selectedVer ? "Active Current" : "Currently Viewing"}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectVersionCard(tabType, ver, idKey)}
                        disabled={loadingVersionDetail}
                        className="rounded-md border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        View
                      </button>
                    )}

                    {!isItemApproved && approveFn && (
                      <button
                        type="button"
                        onClick={() => approveFn?.(itemId)}
                        disabled={actionLoading === `${approveLoadingPrefix}${itemId}`}
                        className="rounded-md bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {actionLoading === `${approveLoadingPrefix}${itemId}` ? "..." : "Approve"}
                      </button>
                    )}

                    {isItemApproved && !isItemActive && activateFn && (
                      <button
                        type="button"
                        onClick={() => activateFn?.(itemId)}
                        disabled={actionLoading === `${activateLoadingPrefix}${itemId}`}
                        className="rounded-md bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
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
          <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>
                Viewing historical version <strong>v{selectedVer.version_number || ""}</strong> ({selectedVer.is_approved ? "Approved" : "Draft"}). Artifact is in read-only mode.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedVersionData((prev) => ({ ...prev, [tabType]: undefined }))}
              className="rounded-lg bg-amber-600 px-2.5 py-1 font-semibold text-white transition hover:bg-amber-700"
            >
              Return to Active Version
            </button>
          </div>
        )}
      </div>
    );
  };

  // ── COPO Matrix Delta Save ────────────────────────────────────────────────
  const saveCopoDeltaChanges = async () => {
    if (!currentCopo?.copo_id) return;
    try {
      setSavingCopoDelta(true);
      for (const [cellIdStr, delta] of Object.entries(copoDirtyCells)) {
        await Models.copo.update_matrix_cell(currentCopo.copo_id, cellIdStr, delta);
      }
      Success("CO-PO matrix delta changes saved successfully!");
      setCopoDirtyCells({});
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save CO-PO matrix changes"));
    } finally {
      setSavingCopoDelta(false);
    }
  };

  // ── Pedagogy Per-Topic Edit & Save ─────────────────────────────────────────
  const startEditPedagogyTopic = (sug: any) => {
    setEditingPedagogyTopicId(sug.id);
    setPedagogyDraft({
      bloom_level_1: sug.bloom_level_1 || "K2 - Understand",
      pedagogy_suggested_1: sug.pedagogy_suggested_1 || "",
      description_1: sug.description_1 || "",
      methodology_1: sug.methodology_1 || "",
    });
  };

  const savePedagogyTopic = async (sugId: number) => {
    if (!currentPedagogy?.pedagogy_id) return;
    try {
      setSavingPedagogyTopic(true);
      await Models.pedagogy.update_topic_suggestion(currentPedagogy.pedagogy_id, sugId, {
        bloom_level_1: pedagogyDraft.bloom_level_1,
        pedagogy_suggested_1: pedagogyDraft.pedagogy_suggested_1?.trim(),
        description_1: pedagogyDraft.description_1?.trim() || undefined,
        methodology_1: pedagogyDraft.methodology_1?.trim() || undefined,
      });
      Success("Topic pedagogy strategy updated successfully!");
      setEditingPedagogyTopicId(null);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to update pedagogy topic"));
    } finally {
      setSavingPedagogyTopic(false);
    }
  };

  // ── Lesson Plan Per-Slot Edit & Save ───────────────────────────────────────
  const startEditLpSlot = (slot: any) => {
    setEditingLpSlotId(slot.id);
    setLpSlotDraft({
      time_allocated: Number(slot.time_allocated) || 1,
      bloom_level: slot.bloom_level || "Understand",
      suggested_activity: slot.suggested_activity || "",
    });
  };

  const saveLpSlot = async (slotId: number) => {
    if (!currentLessonPlan?.lesson_plan_id) return;
    try {
      setSavingLpSlot(true);
      await Models.lession_plan.update_topic_slot(currentLessonPlan.lesson_plan_id, slotId, {
        time_allocated: Number(lpSlotDraft.time_allocated) || 1,
        bloom_level: lpSlotDraft.bloom_level,
        suggested_activity: lpSlotDraft.suggested_activity?.trim() || undefined,
      });
      Success("Topic slot schedule updated successfully!");
      setEditingLpSlotId(null);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to update lesson plan slot"));
    } finally {
      setSavingLpSlot(false);
    }
  };

  // Units list from current extraction
  const units = currentExt?.units || [];
  const selectedUnit = units[selectedUnitIndex] || units[0];

  // ── Coordinator CRUD & Section Edit State ─────────────────────────────────
  const canEdit = Boolean(isCoord && currentExt && !currentExt.is_approved && !selectedVersionData.syllabus);

  const KNOWLEDGE_LEVELS = [
    "K1 - Remember",
    "K2 - Understand",
    "K3 - Apply",
    "K4 - Analyze",
    "K5 - Evaluate",
    "K6 - Create",
  ];

  // Section edit modes: null | "hours" | "objectives" | "outcomes" | "textbooks"
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState<boolean>(false);

  // Draft states
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

  // Hierarchy CRUD modal state (Unit / Topic / Subtopic)
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

  // ── Section 1: Hours & Credits Handlers ────────────────────────────────────
  const startEditHours = () => {
    setHoursDraft({
      credits: activeExt?.credits ?? course.credits ?? 0,
      lecture_hours: activeExt?.lecture_hours ?? 0,
      tutorial_hours: activeExt?.tutorial_hours ?? 0,
      practical_hours: activeExt?.practical_hours ?? 0,
      total_theory_hours: activeExt?.total_theory_hours ?? course.total_theory_hours ?? 0,
      total_lab_hours: activeExt?.total_lab_hours ?? course.total_lab_hours ?? 0,
    });
    setEditingSection("hours");
  };

  const saveHours = async () => {
    if (!activeExt?.extractions_id) return;
    try {
      setSavingSection(true);
      await Models.syllabus.update_hours(activeExt.extractions_id, {
        credits: Number(hoursDraft.credits),
        lecture_hours: Number(hoursDraft.lecture_hours),
        tutorial_hours: Number(hoursDraft.tutorial_hours),
        practical_hours: Number(hoursDraft.practical_hours),
        total_theory_hours: Number(hoursDraft.total_theory_hours),
        total_lab_hours: Number(hoursDraft.total_lab_hours),
      });
      Success("Curriculum hours and credits updated successfully!");
      setEditingSection(null);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to update hours"));
    } finally {
      setSavingSection(false);
    }
  };

  // ── Section 2: Objectives Handlers ─────────────────────────────────────────
  const startEditObjectives = () => {
    setObjectivesDraft((activeExt?.objectives || []).map((o: any) => ({ ...o })));
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
    if (!activeExt?.extractions_id) return;
    try {
      setSavingSection(true);
      const original = activeExt.objectives || [];
      const currentIds = new Set(objectivesDraft.filter((o) => !o.isNew).map((o) => o.id));

      for (const orig of original) {
        if (!currentIds.has(orig.id)) {
          await Models.syllabus.deleteObjective(activeExt.extractions_id, orig.id);
        }
      }

      for (const obj of objectivesDraft) {
        if (obj.isNew) {
          if (obj.description?.trim()) {
            await Models.syllabus.addObjective(activeExt.extractions_id, {
              objective_number: Number(obj.objective_number) || 1,
              description: obj.description.trim(),
            });
          }
        } else {
          await Models.syllabus.updateObjective(activeExt.extractions_id, obj.id, {
            objective_number: Number(obj.objective_number) || 1,
            description: obj.description?.trim() || "",
          });
        }
      }

      Success("Course objectives saved successfully!");
      setEditingSection(null);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save objectives"));
    } finally {
      setSavingSection(false);
    }
  };

  // ── Section 3: Course Outcomes Handlers ────────────────────────────────────
  const startEditOutcomes = () => {
    setOutcomesDraft(
      (activeExt?.outcomes || []).map((co: any) => ({
        ...co,
        knowledge_level: co.knowledge_level || (co.bloom_level ? `K2 - ${co.bloom_level}` : "K2 - Understand"),
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
    if (!activeExt?.extractions_id) return;
    try {
      setSavingSection(true);
      const original = activeExt.outcomes || [];
      const currentIds = new Set(outcomesDraft.filter((co) => !co.isNew).map((co) => co.id));

      for (const orig of original) {
        if (!currentIds.has(orig.id)) {
          await Models.syllabus.deleteOutcome(activeExt.extractions_id, orig.id);
        }
      }

      for (const co of outcomesDraft) {
        const kLevel = co.knowledge_level || "K2 - Understand";
        const bloomPart = kLevel.includes("-") ? kLevel.split("-")[1].trim() : kLevel;

        if (co.isNew) {
          if (co.description?.trim()) {
            await Models.syllabus.addOutcome(activeExt.extractions_id, {
              co_code: co.co_code?.trim() || "CO1",
              description: co.description.trim(),
              knowledge_level: kLevel,
              bloom_level: bloomPart,
            });
          }
        } else {
          await Models.syllabus.updateOutcome(activeExt.extractions_id, co.id, {
            co_code: co.co_code?.trim() || "CO1",
            description: co.description?.trim() || "",
            knowledge_level: kLevel,
            bloom_level: bloomPart,
          });
        }
      }

      Success("Course outcomes saved successfully!");
      setEditingSection(null);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save outcomes"));
    } finally {
      setSavingSection(false);
    }
  };

  // ── Section 4: Textbooks Handlers ──────────────────────────────────────────
  const startEditTextbooks = () => {
    setTextbooksDraft(
      (activeExt?.textbooks || []).map((t: any) => ({
        ...t,
        authorsStr: Array.isArray(t.authors) ? t.authors.join(", ") : (t.authors || ""),
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
    if (!activeExt?.extractions_id) return;
    try {
      setSavingSection(true);
      const original = activeExt.textbooks || [];
      const currentIds = new Set(textbooksDraft.filter((t) => !t.isNew).map((t) => t.id));

      for (const orig of original) {
        if (!currentIds.has(orig.id)) {
          await Models.syllabus.deleteTextbook(activeExt.extractions_id, orig.id);
        }
      }

      for (const t of textbooksDraft) {
        const authorsArr = (t.authorsStr || "")
          .split(",")
          .map((a: string) => a.trim())
          .filter(Boolean);

        if (t.isNew) {
          if (t.title?.trim()) {
            await Models.syllabus.addTextbook(activeExt.extractions_id, {
              title: t.title.trim(),
              authors: authorsArr,
              publisher: t.publisher?.trim() || undefined,
              edition: t.edition?.trim() || undefined,
              publication_year: t.publication_year ? Number(t.publication_year) : undefined,
            });
          }
        } else {
          await Models.syllabus.updateTextbook(activeExt.extractions_id, t.id, {
            title: t.title?.trim() || "",
            authors: authorsArr,
            publisher: t.publisher?.trim() || undefined,
            edition: t.edition?.trim() || undefined,
            publication_year: t.publication_year ? Number(t.publication_year) : undefined,
          });
        }
      }

      Success("Textbooks saved successfully!");
      setEditingSection(null);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save textbooks"));
    } finally {
      setSavingSection(false);
    }
  };

  // ── Section 4b: Reference Books Handlers ────────────────────────────────────
  const startEditReferenceBooks = () => {
    setReferenceBooksDraft(
      (currentExt?.reference_books || []).map((t: any) => ({
        ...t,
        authorsStr: Array.isArray(t.authors) ? t.authors.join(", ") : (t.authors || ""),
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
    if (!currentExt?.extractions_id) return;
    try {
      setSavingSection(true);
      const original = currentExt.reference_books || [];
      const currentIds = new Set(referenceBooksDraft.filter((t) => !t.isNew).map((t) => t.id));

      for (const orig of original) {
        if (!currentIds.has(orig.id)) {
          await Models.syllabus.deleteReferenceBook(currentExt.extractions_id, orig.id);
        }
      }

      for (const t of referenceBooksDraft) {
        const authorsArr = (t.authorsStr || "")
          .split(",")
          .map((a: string) => a.trim())
          .filter(Boolean);

        if (t.isNew) {
          if (t.title?.trim()) {
            await Models.syllabus.addReferenceBook(currentExt.extractions_id, {
              title: t.title.trim(),
              authors: authorsArr,
              publisher: t.publisher?.trim() || undefined,
              edition: t.edition?.trim() || undefined,
              publication_year: t.publication_year ? Number(t.publication_year) : undefined,
            });
          }
        } else {
          await Models.syllabus.updateReferenceBook(currentExt.extractions_id, t.id, {
            title: t.title?.trim() || "",
            authors: authorsArr,
            publisher: t.publisher?.trim() || undefined,
            edition: t.edition?.trim() || undefined,
            publication_year: t.publication_year ? Number(t.publication_year) : undefined,
          });
        }
      }

      Success("Reference books saved successfully!");
      setEditingSection(null);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save reference books"));
    } finally {
      setSavingSection(false);
    }
  };

  // ── Section 5: Curriculum Hierarchy Modal & CRUD (Unit / Topic / Subtopic) ──
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
            unit_number: unit.unit_number || 1,
            unit_title: unit.unit_title || "",
            unit_overview: unit.unit_overview || "",
            theory_hours: unit.theory_hours || 0,
            lab_hours: unit.lab_hours || 0,
            tutorial_hours: unit.tutorial_hours || 0,
          }
        : {
            unit_number: (units.length || 0) + 1,
            unit_title: "",
            unit_overview: "",
            theory_hours: 8,
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
            topic_code: topic.topic_code || "",
            topic_name: topic.topic_name || "",
            topic_description: topic.topic_description || "",
            knowledge_level: topic.knowledge_level || "K2 - Understand",
            learning_sequence: topic.learning_sequence || 1,
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
            subtopic_code: subtopic.subtopic_code || "",
            subtopic_name: subtopic.subtopic_name || "",
            subtopic_description: subtopic.subtopic_description || "",
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
    if (!hierarchyModal || !activeExt?.extractions_id) return;
    try {
      setSubmittingModal(true);
      const { type, mode, unitId, topicId, subtopicId } = hierarchyModal;

      if (type === "unit") {
        if (mode === "add") {
          await Models.syllabus.addUnit(activeExt.extractions_id, {
            unit_number: Number(modalForm.unit_number) || 1,
            unit_title: modalForm.unit_title.trim(),
            unit_overview: modalForm.unit_overview?.trim() || undefined,
            theory_hours: Number(modalForm.theory_hours) || 0,
            lab_hours: Number(modalForm.lab_hours) || 0,
            tutorial_hours: Number(modalForm.tutorial_hours) || 0,
          });
          Success("Unit created successfully!");
        } else {
          await Models.syllabus.updateUnit(activeExt.extractions_id, unitId!, {
            unit_number: Number(modalForm.unit_number) || undefined,
            unit_title: modalForm.unit_title?.trim() || undefined,
            unit_overview: modalForm.unit_overview?.trim() || undefined,
            theory_hours: Number(modalForm.theory_hours) ?? undefined,
            lab_hours: Number(modalForm.lab_hours) ?? undefined,
            tutorial_hours: Number(modalForm.tutorial_hours) ?? undefined,
          });
          Success("Unit updated successfully!");
        }
      } else if (type === "topic") {
        if (mode === "add") {
          await Models.syllabus.addTopic(activeExt.extractions_id, unitId!, {
            topic_code: modalForm.topic_code?.trim() || "",
            topic_name: modalForm.topic_name.trim(),
            topic_description: modalForm.topic_description?.trim() || undefined,
            knowledge_level: modalForm.knowledge_level || undefined,
            learning_sequence: Number(modalForm.learning_sequence) || 1,
          });
          Success("Topic created successfully!");
        } else {
          await Models.syllabus.updateTopic(activeExt.extractions_id, topicId!, {
            topic_code: modalForm.topic_code?.trim() || undefined,
            topic_name: modalForm.topic_name?.trim() || undefined,
            topic_description: modalForm.topic_description?.trim() || undefined,
            knowledge_level: modalForm.knowledge_level || undefined,
            learning_sequence: Number(modalForm.learning_sequence) || undefined,
          });
          Success("Topic updated successfully!");
        }
      } else if (type === "subtopic") {
        if (mode === "add") {
          await Models.syllabus.addSubtopic(activeExt.extractions_id, topicId!, {
            subtopic_code: modalForm.subtopic_code?.trim() || "",
            subtopic_name: modalForm.subtopic_name.trim(),
            subtopic_description: modalForm.subtopic_description?.trim() || undefined,
          });
          Success("Subtopic created successfully!");
        } else {
          await Models.syllabus.updateSubtopic(activeExt.extractions_id, subtopicId!, {
            subtopic_code: modalForm.subtopic_code?.trim() || undefined,
            subtopic_name: modalForm.subtopic_name?.trim() || undefined,
            subtopic_description: modalForm.subtopic_description?.trim() || undefined,
          });
          Success("Subtopic updated successfully!");
        }
      }

      setHierarchyModal(null);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save changes"));
    } finally {
      setSubmittingModal(false);
    }
  };

  const handleDeleteUnit = async (unitId: number) => {
    if (!confirm("Are you sure you want to delete this Unit and all its topics and subtopics?")) return;
    try {
      await Models.syllabus.deleteUnit(activeExt.extractions_id, unitId);
      Success("Unit deleted successfully!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to delete unit"));
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    if (!confirm("Are you sure you want to delete this Topic and its subtopics?")) return;
    try {
      await Models.syllabus.deleteTopic(activeExt.extractions_id, topicId);
      Success("Topic deleted successfully!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to delete topic"));
    }
  };

  const handleDeleteSubtopic = async (subtopicId: number) => {
    if (!confirm("Are you sure you want to delete this Subtopic?")) return;
    try {
      await Models.syllabus.deleteSubtopic(activeExt.extractions_id, subtopicId);
      Success("Subtopic deleted successfully!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to delete subtopic"));
    }
  };

  return (
    <div className="min-h-screen space-y-6 pb-16">
      {/* ── Top Header & Course Identity ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => router.push("/neurobe/my-assigned-courses")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to My Assigned Courses</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                {course.course_code || "Course"}
              </span>

              {isCoord ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Course Coordinator
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="h-3.5 w-3.5" />
                  Course Instructor
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl">
              {course.course_title || "Course Artifacts"}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchPortfolio(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
              <span>Refresh</span>
            </button>

            {activeSyllabus && (
              <button
                type="button"
                onClick={() => setSplitScreenView(!splitScreenView)}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs transition ${
                  splitScreenView
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/70 dark:text-indigo-300"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
                title={splitScreenView ? "Close split screen view" : "View original document in split screen"}
              >
                <Columns className="h-3.5 w-3.5 text-indigo-500" />
                <span>{splitScreenView ? "Exit Split View" : "Split View (Document)"}</span>
              </button>
            )}

            {/* Coordinator-only Upload */}
            {isCoord && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Syllabus</span>
              </button>
            )}
          </div>
        </div>

        {/* Academic Details Strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <GraduationCap className="h-4 w-4 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{course.programme_name || "General"}</p>
              <p className="text-[10px] text-slate-400">Programme</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Layers className="h-4 w-4 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{course.semester ? `Semester ${course.semester}` : "All Terms"}</p>
              <p className="text-[10px] text-slate-400">Term</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <Clock className="h-4 w-4 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{course.credits || 0} Credits</p>
              <p className="text-[10px] text-slate-400">{course.total_theory_hours || 0} Theory / {course.total_lab_hours || 0} Lab Hrs</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <BookOpen className="h-4 w-4 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">{course.department_name || "General"}</p>
              <p className="text-[10px] text-slate-400">Department</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Background Job Notice Banner ── */}
      {jobNotice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 text-xs text-indigo-900 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
          <div className="flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
            <div>
              <p className="font-semibold">Background Job In Progress</p>
              <p className="mt-0.5">{jobNotice}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setJobNotice(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Tabs Navigation ── */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("syllabus")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "syllabus"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            1. Syllabus & Curriculum
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("copo")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "copo"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            2. CO-PO Mapping
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pedagogy")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "pedagogy"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            3. Pedagogy & Strategies
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lesson_plan")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "lesson_plan"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            4. Lesson Plan & Timeline
          </button>
        </nav>
      </div>

      {/* ── Tabs Content (Full Width or Split Screen) ── */}
      {(() => {
        const tabContent = (
          <>
            {/* ── TAB 1: SYLLABUS & CURRICULUM ── */}
            {activeTab === "syllabus" && (
        <div className="space-y-6">
          {renderVersionCards("syllabus")}

          {/* Active Version Snapshot Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {selectedVersionData.syllabus ? "Viewing Syllabus Version" : "Active Syllabus File"}
                </p>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeSyllabus?.original_filename || "No syllabus uploaded"}
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
                  Draft Extraction (v{currentExt.version_number || currentExt.extraction_version_id})
                </span>
              ) : null}

              {/* Coordinator Approval & Activation Controls */}
              {isCoord && currentExt && !currentExt.is_approved && (
                <button
                  type="button"
                  onClick={() => handleApproveExtraction(currentExt.extractions_id)}
                  disabled={actionLoading === `approve_syllabus_${currentExt.extractions_id}`}
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === `approve_syllabus_${currentExt.extractions_id}` ? "Approving..." : "Approve Extraction"}
                </button>
              )}

              {isCoord && currentExt && currentExt.is_approved && !currentExt.is_active && (
                <button
                  type="button"
                  onClick={() => handleActivateExtraction(currentExt.extractions_id)}
                  disabled={actionLoading === `activate_syllabus_${currentExt.extractions_id}`}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === `activate_syllabus_${currentExt.extractions_id}` ? "Activating..." : "Set as Active"}
                </button>
              )}

              {activeSyllabus && (
                <button
                  type="button"
                  onClick={() => setSplitScreenView(!splitScreenView)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition ${
                    splitScreenView
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950 dark:text-indigo-300"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <Columns className="h-3.5 w-3.5 text-indigo-500" />
                  <span>{splitScreenView ? "Close Split View" : "Split View (Source Document)"}</span>
                </button>
              )}
            </div>
          </div>

          {/* If No Extraction */}
          {!currentExt && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <FileText className="h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                No Syllabus Extracted Yet
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {isCoord
                  ? "Upload a PDF or DOCX syllabus document above to initiate AI extraction of objectives, outcomes, and curriculum hierarchy."
                  : "The course coordinator has not yet uploaded and extracted the syllabus for this course."}
              </p>
              {isCoord && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload Syllabus Document</span>
                </button>
              )}
            </div>
          )}

          {currentExt && (
            <div className="space-y-6">
              {/* ── Section 1: Curriculum Hours & Credits ── */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
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
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Credits</label>
                        <input
                          type="number"
                          min={0}
                          value={hoursDraft.credits}
                          onChange={(e) => setHoursDraft({ ...hoursDraft, credits: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Theory Hrs</label>
                        <input
                          type="number"
                          min={0}
                          value={hoursDraft.total_theory_hours}
                          onChange={(e) => setHoursDraft({ ...hoursDraft, total_theory_hours: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Lab Hrs</label>
                        <input
                          type="number"
                          min={0}
                          value={hoursDraft.total_lab_hours}
                          onChange={(e) => setHoursDraft({ ...hoursDraft, total_lab_hours: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Lecture Hrs</label>
                        <input
                          type="number"
                          min={0}
                          value={hoursDraft.lecture_hours}
                          onChange={(e) => setHoursDraft({ ...hoursDraft, lecture_hours: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tutorial Hrs</label>
                        <input
                          type="number"
                          min={0}
                          value={hoursDraft.tutorial_hours}
                          onChange={(e) => setHoursDraft({ ...hoursDraft, tutorial_hours: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Practical Hrs</label>
                        <input
                          type="number"
                          min={0}
                          value={hoursDraft.practical_hours}
                          onChange={(e) => setHoursDraft({ ...hoursDraft, practical_hours: Number(e.target.value) })}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingSection(null)}
                        disabled={savingSection}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveHours}
                        disabled={savingSection}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        <span>{savingSection ? "Saving..." : "Save Hours"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{currentExt?.credits ?? course.credits ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Credits</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{currentExt?.total_theory_hours ?? course.total_theory_hours ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Theory Hours</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{currentExt?.total_lab_hours ?? course.total_lab_hours ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Lab Hours</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{currentExt?.lecture_hours ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Lecture (L)</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{currentExt?.tutorial_hours ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Tutorial (T)</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{currentExt?.practical_hours ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Practical (P)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Two Columns: Objectives/Outcomes/Textbooks (Left) & Units Hierarchy (Right) ── */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left Column: Objectives & Outcomes & Textbooks */}
                <div className="space-y-6 lg:col-span-1">
                  {/* ── Course Objectives Card ── */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
                        {objectivesDraft.map((obj, idx) => (
                          <div key={obj.id} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 dark:border-slate-700 dark:bg-slate-800/40">
                            <input
                              type="number"
                              min={1}
                              value={obj.objective_number}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setObjectivesDraft(objectivesDraft.map((o) => o.id === obj.id ? { ...o, objective_number: val } : o));
                              }}
                              className="w-12 shrink-0 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                              placeholder="#"
                            />
                            <textarea
                              rows={2}
                              value={obj.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                setObjectivesDraft(objectivesDraft.map((o) => o.id === obj.id ? { ...o, description: val } : o));
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
                        {(currentExt?.objectives || []).map((obj: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                              {obj.objective_number || idx + 1}
                            </span>
                            <span className="leading-relaxed">{obj.description}</span>
                          </li>
                        ))}
                        {(!currentExt?.objectives || currentExt.objectives.length === 0) && (
                          <li className="text-xs text-slate-400 italic">No specific objectives defined.</li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* ── Course Outcomes Card ── */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
                        {outcomesDraft.map((co, idx) => (
                          <div key={co.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2 dark:border-slate-700 dark:bg-slate-800/40">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={co.co_code}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setOutcomesDraft(outcomesDraft.map((item) => item.id === co.id ? { ...item, co_code: val } : item));
                                }}
                                className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900"
                                placeholder="CO#"
                              />
                              <select
                                value={co.knowledge_level || "K2 - Understand"}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setOutcomesDraft(outcomesDraft.map((item) => item.id === co.id ? { ...item, knowledge_level: val } : item));
                                }}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                              >
                                {KNOWLEDGE_LEVELS.map((lvl) => (
                                  <option key={lvl} value={lvl}>{lvl}</option>
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
                                setOutcomesDraft(outcomesDraft.map((item) => item.id === co.id ? { ...item, description: val } : item));
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
                        {(currentExt.outcomes || []).map((co: any, idx: number) => (
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
                            {co.reason_for_inferred_level && (
                              <div className="mt-1.5 rounded-lg bg-indigo-50/50 px-2 py-1 text-[11px] text-indigo-700 italic dark:bg-indigo-950/30 dark:text-indigo-300">
                                💡 Inferred Level Rationale: {co.reason_for_inferred_level}
                              </div>
                            )}
                          </div>
                        ))}
                        {(!currentExt.outcomes || currentExt.outcomes.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No course outcomes extracted.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Prescribed Textbooks Card ── */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
                        {textbooksDraft.map((t, idx) => (
                          <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2 dark:border-slate-700 dark:bg-slate-800/40">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={t.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTextbooksDraft(textbooksDraft.map((item) => item.id === t.id ? { ...item, title: val } : item));
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
                                setTextbooksDraft(textbooksDraft.map((item) => item.id === t.id ? { ...item, authorsStr: val } : item));
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              placeholder="Authors (comma-separated)"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={t.publisher || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTextbooksDraft(textbooksDraft.map((item) => item.id === t.id ? { ...item, publisher: val } : item));
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                placeholder="Publisher"
                              />
                              <input
                                type="number"
                                value={t.publication_year || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTextbooksDraft(textbooksDraft.map((item) => item.id === t.id ? { ...item, publication_year: val } : item));
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
                        {(currentExt?.textbooks || []).map((b: any, idx: number) => (
                          <div key={idx} className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                            <p className="font-semibold text-slate-900 dark:text-white">{b.title}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              {Array.isArray(b.authors) ? b.authors.join(", ") : b.authors} {b.publisher ? `— ${b.publisher}` : ""} {b.publication_year ? `(${b.publication_year})` : ""}
                            </p>
                          </div>
                        ))}
                        {(!currentExt?.textbooks || currentExt.textbooks.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No textbooks recorded.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Prescribed Reference Books Card ── */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
                          <div key={t.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2 dark:border-slate-700 dark:bg-slate-800/40">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={t.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReferenceBooksDraft(referenceBooksDraft.map((item) => item.id === t.id ? { ...item, title: val } : item));
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
                                setReferenceBooksDraft(referenceBooksDraft.map((item) => item.id === t.id ? { ...item, authorsStr: val } : item));
                              }}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              placeholder="Authors (comma-separated)"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={t.publisher || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReferenceBooksDraft(referenceBooksDraft.map((item) => item.id === t.id ? { ...item, publisher: val } : item));
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                                placeholder="Publisher"
                              />
                              <input
                                type="number"
                                value={t.publication_year || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReferenceBooksDraft(referenceBooksDraft.map((item) => item.id === t.id ? { ...item, publication_year: val } : item));
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
                        {(currentExt?.reference_books || []).map((b: any, idx: number) => (
                          <div key={idx} className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                            <p className="font-semibold text-slate-900 dark:text-white">{b.title}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              {Array.isArray(b.authors) ? b.authors.join(", ") : b.authors} {b.publisher ? `— ${b.publisher}` : ""} {b.publication_year ? `(${b.publication_year})` : ""}
                            </p>
                          </div>
                        ))}
                        {(!currentExt?.reference_books || currentExt.reference_books.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No reference books recorded.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Right Column: Curriculum Hierarchy (Units, Topics & Subtopics) ── */}
                <div className="space-y-4 lg:col-span-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Curriculum Hierarchy (Units, Topics & Subtopics)
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {units.length} Units • Structured hierarchical teaching units
                        </p>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openUnitModal("add")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Unit</span>
                        </button>
                      )}
                    </div>

                    <div className="mt-5 space-y-6">
                      {units.map((u: any, uIdx: number) => (
                        <div
                          key={u.id || uIdx}
                          className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-850/40"
                        >
                          {/* Unit Header Bar */}
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="rounded-md bg-indigo-600 px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-2xs dark:bg-indigo-500">
                                  Unit {u.unit_number}
                                </span>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                  {u.unit_title}
                                </h4>
                              </div>
                              {u.unit_overview && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xl">
                                  {u.unit_overview}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="rounded-lg bg-slate-200/70 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {u.theory_hours || 0} Theory Hrs • {u.lab_hours || 0} Lab Hrs
                              </span>

                              {canEdit && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openTopicModal("add", u.id)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-400"
                                    title="Add Topic to this Unit"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Add Topic</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openUnitModal("edit", u)}
                                    className="rounded-lg border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    title="Edit Unit"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUnit(u.id)}
                                    className="rounded-lg border border-rose-200 bg-rose-50 p-1 text-rose-600 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-400"
                                    title="Delete Unit"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Topics List (Hierarchical children of Unit) */}
                          <div className="mt-4 space-y-3">
                            {(u.topics || []).map((t: any, tIdx: number) => (
                              <div
                                key={t.id || tIdx}
                                className="rounded-xl border border-slate-200/70 bg-white p-4 shadow-2xs dark:border-slate-700/60 dark:bg-slate-800"
                              >
                                {/* Topic Title & Controls */}
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                                      {t.topic_code ? `${t.topic_code} : ` : ""}{t.topic_name}
                                    </span>
                                    {t.knowledge_level && (
                                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                        {t.knowledge_level}
                                      </span>
                                    )}
                                  </div>

                                  {canEdit && (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => openSubtopicModal("add", t.id)}
                                        className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-400"
                                        title="Add Subtopic under this Topic"
                                      >
                                        <Plus className="h-3 w-3" />
                                        <span>Add Subtopic</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openTopicModal("edit", u.id, t)}
                                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                                        title="Edit Topic"
                                      >
                                        <Edit2 className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteTopic(t.id)}
                                        className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                                        title="Delete Topic"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {t.topic_description && (
                                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {t.topic_description}
                                  </p>
                                )}

                                {/* Subtopics: Rendered Hierarchically Under Parent Topic */}
                                <div className="mt-3 ml-3 border-l-2 border-indigo-200 pl-3.5 space-y-2 dark:border-indigo-900/60">
                                  {(t.subtopics || []).map((st: any, stIdx: number) => (
                                    <div
                                      key={st.id || stIdx}
                                      className="group flex items-center justify-between gap-2 rounded-lg bg-slate-50/70 px-2.5 py-1.5 text-xs transition hover:bg-slate-100 dark:bg-slate-850/60 dark:hover:bg-slate-850"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                                        <span className="font-medium text-slate-700 dark:text-slate-200">
                                          {st.subtopic_code ? `${st.subtopic_code} : ` : ""}{st.subtopic_name}
                                        </span>
                                        {st.subtopic_description && (
                                          <span className="text-[11px] text-slate-400">
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
                                    <div className="flex items-center gap-2 text-[11px] text-slate-400 italic">
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
                              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-800">
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
                        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
                          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            No curriculum units recorded
                          </p>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openUnitModal("add")}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                            >
                              <Plus className="h-3.5 w-3.5" />
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

      {/* ── TAB 2: CO-PO MAPPING ── */}
      {activeTab === "copo" && (
        <div className="space-y-6">
          {renderVersionCards("copo")}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Course Outcome to Program Outcome (CO-PO) Correlation Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Accreditation correlation matrix (1 = Low, 2 = Medium, 3 = High, 0 = None)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentCopo?.is_approved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  CO-PO Matrix Approved
                </span>
              ) : currentCopo ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  Draft Version v{currentCopo.version_number || currentCopo.version_id}
                </span>
              ) : null}

              {/* Coordinator Controls */}
              {isCoord && (
                <button
                  type="button"
                  onClick={openGenerateCopoModal}
                  disabled={isCopoBusy || actionLoading === "generate_copo"}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isCopoBusy ? "Generating CO-PO..." : "Generate CO-PO Mapping"}
                </button>
              )}

              {isCoord && currentCopo && !currentCopo.is_approved && (
                <button
                  type="button"
                  onClick={() => handleApproveCopo(currentCopo.copo_id)}
                  disabled={actionLoading === `approve_copo_${currentCopo.copo_id}`}
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading === `approve_copo_${currentCopo.copo_id}` ? "Approving..." : "Approve CO-PO"}
                </button>
              )}

              {isCoord && currentCopo && currentCopo.is_approved && !currentCopo.is_active && (
                <button
                  type="button"
                  onClick={() => handleActivateCopo(currentCopo.copo_id)}
                  disabled={actionLoading === `activate_copo_${currentCopo.copo_id}`}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === `activate_copo_${currentCopo.copo_id}` ? "Activating..." : "Set as Active"}
                </button>
              )}
            </div>
          </div>

          {/* Delta Changes Notice Banner */}
          {Object.keys(copoDirtyCells).length > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-200">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>You have <strong>{Object.keys(copoDirtyCells).length}</strong> unsaved matrix cell change(s).</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCopoDirtyCells({})}
                  className="rounded-lg border border-slate-300 px-3 py-1 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={saveCopoDeltaChanges}
                  disabled={savingCopoDelta}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Save className="h-3 w-3" />
                  <span>{savingCopoDelta ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          )}

          {!currentCopo ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <Layers className="h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                No CO-PO Mapping Generated
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {isCoord
                  ? "Click 'Generate CO-PO Mapping' to trigger AI matrix generation based on an approved curriculum extraction."
                  : "The course coordinator has not generated a CO-PO mapping version for this course yet."}
              </p>
              {isCoord && (
                <button
                  type="button"
                  onClick={openGenerateCopoModal}
                  disabled={isCopoBusy}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate CO-PO Mapping</span>
                </button>
              )}
            </div>
          ) : (() => {
            // Compute unique POs and COs for n x m grid
            const entries = currentCopo.matrix_entries || [];
            const posMap = new Map<number, { po_id: number; po_code: string }>();
            const cosMap = new Map<number, { course_outcome_id: number; co_code: string; description?: string }>();
            const cellMap = new Map<string, any>();
            const extOutcomesMap = new Map<number, any>();
            (currentExt?.outcomes || []).forEach((o: any) => extOutcomesMap.set(o.id, o));

            entries.forEach((e: any) => {
              if (!posMap.has(e.po_id)) {
                posMap.set(e.po_id, { po_id: e.po_id, po_code: e.po_code || `PO${e.po_id}` });
              }
              if (!cosMap.has(e.course_outcome_id)) {
                const extCo = extOutcomesMap.get(e.course_outcome_id);
                cosMap.set(e.course_outcome_id, {
                  course_outcome_id: e.course_outcome_id,
                  co_code: e.co_code || extCo?.co_code || `CO${e.course_outcome_id}`,
                  description: extCo?.description,
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

            const canEditMatrix = Boolean(isCoord && !currentCopo.is_approved && !selectedVersionData.copo);

            return (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Correlation Matrix ({cosList.length} COs × {posList.length} POs)
                    </span>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> 3 = High</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> 2 = Medium</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> 1 = Low</span>
                      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> 0 = None</span>
                    </div>
                  </div>

                  <table className="mt-4 w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                        <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 w-24">CO</th>
                        <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 min-w-[200px]">Outcome Description</th>
                        {posList.map((po) => (
                          <th key={po.po_id} className="py-2.5 px-2 text-center font-bold text-slate-700 dark:text-slate-300 w-16">
                            {po.po_code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {cosList.map((co) => (
                        <tr key={co.course_outcome_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                            {co.co_code}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px] leading-snug max-w-sm">
                            {co.description || "—"}
                          </td>
                          {posList.map((po) => {
                            const entry = cellMap.get(`${co.course_outcome_id}_${po.po_id}`);
                            if (!entry) {
                              return <td key={po.po_id} className="py-2.5 px-2 text-center text-slate-300">—</td>;
                            }
                            const dirty = copoDirtyCells[entry.id];
                            const currentVal = dirty !== undefined ? dirty.matrix_value : (entry.matrix_value ?? 0);
                            const currentJust = dirty?.justification !== undefined ? dirty.justification : (entry.justification || "");
                            const isDirty = dirty !== undefined;

                            let colorClass = "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500";
                            if (currentVal === 3) colorClass = "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 font-bold";
                            else if (currentVal === 2) colorClass = "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 font-bold";
                            else if (currentVal === 1) colorClass = "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 font-semibold";

                            return (
                              <td key={po.po_id} className="py-2 px-1 text-center">
                                <button
                                  type="button"
                                  disabled={!canEditMatrix}
                                  onClick={() => setCopoEditingCell({
                                    id: entry.id,
                                    co_code: co.co_code,
                                    po_code: po.po_code,
                                    matrix_value: currentVal,
                                    justification: currentJust,
                                  })}
                                  title={currentJust ? `${co.co_code} → ${po.po_code}: ${currentJust}` : `${co.co_code} → ${po.po_code} (${currentVal})`}
                                  className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-xs transition ${colorClass} ${
                                    canEditMatrix ? "cursor-pointer hover:scale-110 hover:shadow-xs" : "cursor-default"
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

                {/* Justification Details Reference */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 pb-2 dark:border-slate-800">
                    Matrix Correlation Justifications ({entries.filter((e: any) => e.justification || copoDirtyCells[e.id]?.justification).length})
                  </h4>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
                    {entries
                      .filter((e: any) => (copoDirtyCells[e.id]?.justification ?? e.justification))
                      .map((e: any) => {
                        const val = copoDirtyCells[e.id]?.matrix_value ?? e.matrix_value;
                        const just = copoDirtyCells[e.id]?.justification ?? e.justification;
                        return (
                          <div key={e.id} className="rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800/40">
                            <div className="flex items-center justify-between gap-1 font-semibold text-slate-800 dark:text-slate-200">
                              <span>{e.co_code || `CO${e.course_outcome_id}`} → {e.po_code || `PO${e.po_id}`}</span>
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

      {/* ── TAB 3: PEDAGOGY & DELIVERY ── */}
      {activeTab === "pedagogy" && (
        <div className="space-y-6">
          {renderVersionCards("pedagogy")}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Instructional Strategies & Topic Delivery Methods
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Suggested pedagogical approaches, activity models, and learning modes
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentPedagogy?.is_approved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Pedagogy Approved
                </span>
              ) : currentPedagogy ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  Draft Version v{currentPedagogy.version_number || currentPedagogy.version_id}
                </span>
              ) : null}

              {/* Coordinator Controls */}
              {isCoord && (
                <button
                  type="button"
                  onClick={openGeneratePedagogyModal}
                  disabled={isPedagogyBusy || actionLoading === "generate_pedagogy"}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isPedagogyBusy ? "Generating Pedagogy..." : "Generate Pedagogy"}
                </button>
              )}

              {isCoord && currentPedagogy && !currentPedagogy.is_approved && (
                <button
                  type="button"
                  onClick={() => handleApprovePedagogy(currentPedagogy.pedagogy_id)}
                  disabled={actionLoading === `approve_pedagogy_${currentPedagogy.pedagogy_id}`}
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading === `approve_pedagogy_${currentPedagogy.pedagogy_id}` ? "Approving..." : "Approve Pedagogy"}
                </button>
              )}

              {isCoord && currentPedagogy && currentPedagogy.is_approved && !currentPedagogy.is_active && (
                <button
                  type="button"
                  onClick={() => handleActivatePedagogy(currentPedagogy.pedagogy_id)}
                  disabled={actionLoading === `activate_pedagogy_${currentPedagogy.pedagogy_id}`}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === `activate_pedagogy_${currentPedagogy.pedagogy_id}` ? "Activating..." : "Set as Active"}
                </button>
              )}
            </div>
          </div>

          {!currentPedagogy ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <Presentation className="h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                No Pedagogy Generated
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {isCoord
                  ? "Click 'Generate Pedagogy' to automatically synthesize topic-level teaching delivery methods based on an approved curriculum extraction."
                  : "The course coordinator has not generated pedagogy strategies for this course yet."}
              </p>
              {isCoord && (
                <button
                  type="button"
                  onClick={openGeneratePedagogyModal}
                  disabled={isPedagogyBusy}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Pedagogy</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(currentPedagogy.topic_suggestions || []).map((sug: any, idx: number) => {
                const isEditingThisTopic = editingPedagogyTopicId === sug.id;
                const canEditThis = Boolean(isCoord && !currentPedagogy.is_approved && !selectedVersionData.pedagogy);

                return (
                  <div
                    key={sug.id || idx}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {sug.topic_name || `Topic #${sug.topic_id}`}
                      </span>
                      <div className="flex items-center gap-2">
                        {sug.bloom_level_1 && (
                          <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                            {sug.bloom_level_1}
                          </span>
                        )}
                        {canEditThis && !isEditingThisTopic && (
                          <button
                            type="button"
                            onClick={() => startEditPedagogyTopic(sug)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <Edit2 className="h-3 w-3 text-indigo-500" />
                            <span>Edit</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditingThisTopic ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Bloom Taxonomy Level</label>
                          <select
                            value={pedagogyDraft.bloom_level_1 || "K2 - Understand"}
                            onChange={(e) => setPedagogyDraft({ ...pedagogyDraft, bloom_level_1: e.target.value })}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-indigo-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-400"
                          >
                            {KNOWLEDGE_LEVELS.map((lvl) => (
                              <option key={lvl} value={lvl}>{lvl}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Primary Strategy</label>
                          <input
                            type="text"
                            value={pedagogyDraft.pedagogy_suggested_1 || ""}
                            onChange={(e) => setPedagogyDraft({ ...pedagogyDraft, pedagogy_suggested_1: e.target.value })}
                            placeholder="e.g. Flipped Classroom / Problem-Based Learning"
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Strategy Description</label>
                          <textarea
                            rows={2}
                            value={pedagogyDraft.description_1 || ""}
                            onChange={(e) => setPedagogyDraft({ ...pedagogyDraft, description_1: e.target.value })}
                            placeholder="Brief description of instructional flow..."
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Suggested Methodology</label>
                          <input
                            type="text"
                            value={pedagogyDraft.methodology_1 || ""}
                            onChange={(e) => setPedagogyDraft({ ...pedagogyDraft, methodology_1: e.target.value })}
                            placeholder="e.g. Small group brainstorming & case study presentation"
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setEditingPedagogyTopicId(null)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => savePedagogyTopic(sug.id)}
                            disabled={savingPedagogyTopic}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Save className="h-3 w-3" />
                            <span>{savingPedagogyTopic ? "Saving..." : "Save Strategy"}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2 text-xs">
                        <div>
                          <p className="font-semibold text-indigo-600 dark:text-indigo-400">
                            Primary Strategy: {sug.pedagogy_suggested_1}
                          </p>
                          {sug.description_1 && (
                            <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                              {sug.description_1}
                            </p>
                          )}
                        </div>

                        {sug.methodology_1 && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                            Methodology: {sug.methodology_1}
                          </p>
                        )}

                        {sug.pedagogy_suggested_2 && (
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                            <span className="font-semibold">Alternative Strategy:</span> {sug.pedagogy_suggested_2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {(currentPedagogy.topic_suggestions || []).length === 0 && (
                <div className="col-span-2 py-8 text-center text-xs text-slate-400 italic">
                  No topic suggestions recorded in this pedagogy version.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: LESSON PLAN & TIMELINE ── */}
      {activeTab === "lesson_plan" && (
        <div className="space-y-6">
          {renderVersionCards("lesson_plan")}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Lecture Plan, Hourly Allocation & Delivery Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target hours: {currentLessonPlan?.target_total_hours || 45} Hrs • Total Theory: {currentLessonPlan?.total_theory_hours || 0} Hrs • Total Lab: {currentLessonPlan?.total_lab_hours || 0} Hrs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentLessonPlan?.is_approved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Lesson Plan Approved
                </span>
              ) : currentLessonPlan ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  Draft Version v{currentLessonPlan.version_number || currentLessonPlan.version_id}
                </span>
              ) : null}

              {/* Coordinator Controls */}
              {isCoord && (
                <button
                  type="button"
                  onClick={openGenerateLessonPlanModal}
                  disabled={isLessonPlanBusy || actionLoading === "generate_lp"}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isLessonPlanBusy ? "Generating Lesson Plan..." : "Generate Lesson Plan"}
                </button>
              )}

              {isCoord && currentLessonPlan && !currentLessonPlan.is_approved && (
                <button
                  type="button"
                  onClick={() => handleApproveLessonPlan(currentLessonPlan.lesson_plan_id)}
                  disabled={actionLoading === `approve_lesson_plan_${currentLessonPlan.lesson_plan_id}`}
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading === `approve_lesson_plan_${currentLessonPlan.lesson_plan_id}` ? "Approving..." : "Approve Lesson Plan"}
                </button>
              )}

              {isCoord && currentLessonPlan && currentLessonPlan.is_approved && !currentLessonPlan.is_active && (
                <button
                  type="button"
                  onClick={() => handleActivateLessonPlan(currentLessonPlan.lesson_plan_id)}
                  disabled={actionLoading === `activate_lesson_plan_${currentLessonPlan.lesson_plan_id}`}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === `activate_lesson_plan_${currentLessonPlan.lesson_plan_id}` ? "Activating..." : "Set as Active"}
                </button>
              )}
            </div>
          </div>

          {!currentLessonPlan ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <Calendar className="h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                No Lesson Plan Generated
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {isCoord
                  ? "Click 'Generate Lesson Plan' to allocate hours across topics and subtopics based on syllabus requirements."
                  : "The course coordinator has not generated a lesson plan for this course yet."}
              </p>
              {isCoord && (
                <button
                  type="button"
                  onClick={openGenerateLessonPlanModal}
                  disabled={isLessonPlanBusy}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Lesson Plan</span>
                </button>
              )}
            </div>
          ) : (() => {
            const slots = currentLessonPlan.topic_slots || [];
            const groupsMap = new Map<string, { unitTitle: string; slots: any[]; totalHours: number }>();

            slots.forEach((slot: any) => {
              const uKey = slot.unit_title || (slot.unit_id ? `Unit ${slot.unit_id}` : "Curriculum Topics");
              if (!groupsMap.has(uKey)) {
                groupsMap.set(uKey, { unitTitle: uKey, slots: [], totalHours: 0 });
              }
              const g = groupsMap.get(uKey)!;
              g.slots.push(slot);
              g.totalHours += Number(slot.time_allocated) || 0;
            });

            const groupsList = Array.from(groupsMap.values());
            const canEditLp = Boolean(isCoord && !currentLessonPlan.is_approved && !selectedVersionData.lesson_plan);

            return (
              <div className="space-y-6">
                {groupsList.map((group, gIdx) => (
                  <div key={gIdx} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-indigo-500" />
                        <span>{group.unitTitle}</span>
                      </h4>
                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        {group.totalHours} Allocated Hours
                      </span>
                    </div>

                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 w-16">Slot #</th>
                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 min-w-[220px]">Topic / Subtopic</th>
                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 w-28">Allocated</th>
                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300 w-32">Bloom Level</th>
                            <th className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">Suggested Activity</th>
                            {canEditLp && <th className="py-2.5 px-3 text-right font-bold text-slate-700 dark:text-slate-300 w-20">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {group.slots.map((slot: any, sIdx: number) => {
                            const isEditingThisSlot = editingLpSlotId === slot.id;

                            if (isEditingThisSlot) {
                              return (
                                <tr key={slot.id || sIdx} className="bg-indigo-50/40 dark:bg-indigo-950/30">
                                  <td className="py-2.5 px-3 font-bold text-indigo-600">{sIdx + 1}</td>
                                  <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                    <div>{slot.topic_name || `Topic #${slot.topic_id}`}</div>
                                    {slot.subtopic_name && <div className="text-[11px] text-slate-400">↳ {slot.subtopic_name}</div>}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="number"
                                      min={0.5}
                                      step={0.5}
                                      value={lpSlotDraft.time_allocated}
                                      onChange={(e) => setLpSlotDraft({ ...lpSlotDraft, time_allocated: Number(e.target.value) })}
                                      className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="text"
                                      value={lpSlotDraft.bloom_level}
                                      onChange={(e) => setLpSlotDraft({ ...lpSlotDraft, bloom_level: e.target.value })}
                                      placeholder="e.g. Understand"
                                      className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <input
                                      type="text"
                                      value={lpSlotDraft.suggested_activity}
                                      onChange={(e) => setLpSlotDraft({ ...lpSlotDraft, suggested_activity: e.target.value })}
                                      placeholder="e.g. Interactive discussion & problem solving"
                                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                    />
                                  </td>
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => saveLpSlot(slot.id)}
                                        disabled={savingLpSlot}
                                        className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                      >
                                        <Check className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingLpSlotId(null)}
                                        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return (
                              <tr key={slot.id || sIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                                <td className="py-2.5 px-3 font-bold text-slate-400">{sIdx + 1}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                                  <div>{slot.topic_name || `Topic #${slot.topic_id}`}</div>
                                  {slot.subtopic_name && <div className="text-[11px] text-slate-400">↳ {slot.subtopic_name}</div>}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-indigo-600 dark:text-indigo-400">
                                  {slot.time_allocated || 1} Hr(s)
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {slot.bloom_level || "Understand"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                  {slot.suggested_activity || "Interactive Lecture & Discussion"}
                                </td>
                                {canEditLp && (
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => startEditLpSlot(slot)}
                                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                    >
                                      <Edit2 className="h-3 w-3 text-indigo-500" />
                                      <span>Edit</span>
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}

                {groupsList.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400 italic">
                    No topic slots defined in this lesson plan version.
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );

  if (splitScreenView) {
    return (
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: 6 Cols - Sticky Document Viewer */}
        <div className="lg:col-span-6 h-[calc(100vh-210px)] min-h-[680px] sticky top-6 rounded-2xl border border-slate-200/80 bg-slate-900 shadow-sm overflow-hidden dark:border-slate-800 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <FileText className="h-4 w-4 text-indigo-400 shrink-0" />
              <span className="font-semibold truncate">
                {activeSyllabus?.original_filename || "Syllabus Document"}
              </span>
              {activeSyllabus?.version_id && (
                <span className="text-[10px] text-slate-400 font-mono">v{activeSyllabus.version_id}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSplitScreenView(false)}
              className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded-lg hover:bg-slate-800 transition"
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
                fileName={activeSyllabus?.original_filename || "Syllabus_Document.pdf"}
              />
            )}
          </div>
        </div>

        {/* Right Column: 6 Cols - Tab content with independent scroll */}
        <div className="lg:col-span-6 h-[calc(100vh-210px)] min-h-[680px] overflow-y-auto pr-1 space-y-6">
          {tabContent}
        </div>
      </div>
    );
  }

  return <div className="mt-6 space-y-6">{tabContent}</div>;
})()}

      {/* ── Hierarchy CRUD Modal (Unit / Topic / Subtopic) ── */}
      {hierarchyModal && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {hierarchyModal.type === "unit"
                  ? hierarchyModal.mode === "add" ? "Add Curriculum Unit" : `Edit Unit ${modalForm.unit_number}`
                  : hierarchyModal.type === "topic"
                  ? hierarchyModal.mode === "add" ? "Add Topic to Unit" : "Edit Topic"
                  : hierarchyModal.mode === "add" ? "Add Subtopic to Topic" : "Edit Subtopic"}
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
              {/* Unit Form */}
              {hierarchyModal.type === "unit" && (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit #</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={modalForm.unit_number}
                        onChange={(e) => setModalForm({ ...modalForm, unit_number: Number(e.target.value) })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit Title</label>
                      <input
                        type="text"
                        required
                        value={modalForm.unit_title}
                        onChange={(e) => setModalForm({ ...modalForm, unit_title: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        placeholder="e.g., Introduction to Neural Networks"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Unit Overview</label>
                    <textarea
                      rows={3}
                      value={modalForm.unit_overview}
                      onChange={(e) => setModalForm({ ...modalForm, unit_overview: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Brief overview or learning outcome of this unit..."
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Theory Hours</label>
                      <input
                        type="number"
                        min={0}
                        value={modalForm.theory_hours}
                        onChange={(e) => setModalForm({ ...modalForm, theory_hours: Number(e.target.value) })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Lab Hours</label>
                      <input
                        type="number"
                        min={0}
                        value={modalForm.lab_hours}
                        onChange={(e) => setModalForm({ ...modalForm, lab_hours: Number(e.target.value) })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tutorial Hours</label>
                      <input
                        type="number"
                        min={0}
                        value={modalForm.tutorial_hours}
                        onChange={(e) => setModalForm({ ...modalForm, tutorial_hours: Number(e.target.value) })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Topic Form */}
              {hierarchyModal.type === "topic" && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Topic Code</label>
                      <input
                        type="text"
                        value={modalForm.topic_code}
                        onChange={(e) => setModalForm({ ...modalForm, topic_code: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        placeholder="e.g. 1.1"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Knowledge Level</label>
                      <select
                        value={modalForm.knowledge_level || "K2 - Understand"}
                        onChange={(e) => setModalForm({ ...modalForm, knowledge_level: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {KNOWLEDGE_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Topic Name</label>
                    <input
                      type="text"
                      required
                      value={modalForm.topic_name}
                      onChange={(e) => setModalForm({ ...modalForm, topic_name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="e.g., Perceptrons and Multi-layer Networks"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Topic Description</label>
                    <textarea
                      rows={3}
                      value={modalForm.topic_description}
                      onChange={(e) => setModalForm({ ...modalForm, topic_description: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Summary of topics covered..."
                    />
                  </div>
                </>
              )}

              {/* Subtopic Form */}
              {hierarchyModal.type === "subtopic" && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subtopic Code</label>
                    <input
                      type="text"
                      value={modalForm.subtopic_code}
                      onChange={(e) => setModalForm({ ...modalForm, subtopic_code: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="e.g. 1.1.1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subtopic Name</label>
                    <input
                      type="text"
                      required
                      value={modalForm.subtopic_name}
                      onChange={(e) => setModalForm({ ...modalForm, subtopic_name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="e.g., Activation Functions & Sigmoid"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subtopic Description</label>
                    <textarea
                      rows={3}
                      value={modalForm.subtopic_description}
                      onChange={(e) => setModalForm({ ...modalForm, subtopic_description: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Specific scope of this subtopic..."
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

      {/* ── Upload Syllabus Modal (Coordinator Only) ── */}
      {showUploadModal && isCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upload Course Syllabus
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select a PDF or DOCX syllabus document. The AI worker will extract course objectives, outcomes, and topics.
            </p>

            <form onSubmit={handleUploadSyllabus} className="mt-5 space-y-4">
              <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-indigo-500 dark:border-slate-700">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="syllabus-upload-input"
                />
                <label
                  htmlFor="syllabus-upload-input"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-slate-400" />
                  <span className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {uploadFile ? uploadFile.name : "Click to browse file"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-1">PDF or DOCX up to 25MB</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploading}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? "Uploading & Queuing..." : "Upload & Extract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Generate CO-PO Mapping Modal ── */}
      {showGenerateCopoModal && isCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
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

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              The AI worker will synthesize correlation scores (1–3) and justification text between each course outcome and program outcome based on the selected curriculum extraction.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Approved Extraction Version
                </label>
                <select
                  value={selectedExtractionForCopo || ""}
                  onChange={(e) => setSelectedExtractionForCopo(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {(portfolio?.versions?.extractions || [])
                    .filter((e: any) => e.is_approved)
                    .map((e: any) => (
                      <option key={e.extractions_id} value={e.extractions_id}>
                        Version v{e.version_number} (ID: {e.extractions_id}) — {e.is_active ? "Active" : "Approved"}
                      </option>
                    ))}
                </select>
              </div>
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
                disabled={actionLoading === "generate_copo" || !selectedExtractionForCopo}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{actionLoading === "generate_copo" ? "Queuing..." : "Queue Generation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Pedagogy Modal ── */}
      {showGeneratePedagogyModal && isCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
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

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              The AI worker will analyze the topics and Bloom taxonomy levels to recommend primary & alternative instructional strategies and active learning methodologies.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Approved Extraction Version
                </label>
                <select
                  value={selectedExtractionForPedagogy || ""}
                  onChange={(e) => setSelectedExtractionForPedagogy(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {(portfolio?.versions?.extractions || [])
                    .filter((e: any) => e.is_approved)
                    .map((e: any) => (
                      <option key={e.extractions_id} value={e.extractions_id}>
                        Version v{e.version_number} (ID: {e.extractions_id}) — {e.is_active ? "Active" : "Approved"}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 border-t border-slate-100 dark:border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setShowGeneratePedagogyModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGeneratePedagogy}
                disabled={actionLoading === "generate_pedagogy" || !selectedExtractionForPedagogy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{actionLoading === "generate_pedagogy" ? "Queuing..." : "Queue Generation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate Lesson Plan Modal ── */}
      {showGenerateLessonPlanModal && isCoord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
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

            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Generate an hourly schedule distributing syllabus topics across the semester timeline. You can optionally link an approved pedagogy version to carry over suggested delivery activities.
            </p>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Approved Extraction Version <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedExtractionForLp || ""}
                  onChange={(e) => setSelectedExtractionForLp(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {(portfolio?.versions?.extractions || [])
                    .filter((e: any) => e.is_approved)
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
                  value={selectedPedagogyForLp || ""}
                  onChange={(e) => setSelectedPedagogyForLp(e.target.value ? Number(e.target.value) : null)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">None (Use standard classroom delivery activities)</option>
                  {(portfolio?.versions?.pedagogies || [])
                    .filter((p: any) => p.is_approved)
                    .map((p: any) => (
                      <option key={p.pedagogy_id} value={p.pedagogy_id}>
                        Pedagogy v{p.version_number || p.version_id} — {p.is_active ? "Active" : "Approved"}
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
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="e.g. 45"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-5 border-t border-slate-100 dark:border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setShowGenerateLessonPlanModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerateLessonPlan}
                disabled={actionLoading === "generate_lp" || !selectedExtractionForLp}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{actionLoading === "generate_lp" ? "Queuing..." : "Queue Generation"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CO-PO Cell Correlation Edit Modal ── */}
      {copoEditingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-indigo-500" />
                <span>Edit Cell: {copoEditingCell.co_code} → {copoEditingCell.po_code}</span>
              </h3>
              <button
                type="button"
                onClick={() => setCopoEditingCell(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Correlation Level
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[
                    { val: 0, label: "0 - None", color: "hover:border-slate-400 bg-slate-50 dark:bg-slate-800" },
                    { val: 1, label: "1 - Low", color: "hover:border-amber-400 bg-amber-50/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
                    { val: 2, label: "2 - Medium", color: "hover:border-sky-400 bg-sky-50/70 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300" },
                    { val: 3, label: "3 - High", color: "hover:border-emerald-400 bg-emerald-50/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setCopoEditingCell({ ...copoEditingCell, matrix_value: opt.val })}
                      className={`rounded-xl border py-2.5 text-center text-xs font-bold transition ${opt.color} ${
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
                  rows={3}
                  value={copoEditingCell.justification || ""}
                  onChange={(e) => setCopoEditingCell({ ...copoEditingCell, justification: e.target.value })}
                  placeholder="Explain why this CO supports this Program Outcome..."
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setCopoEditingCell(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
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
                      justification: copoEditingCell.justification?.trim() || "",
                    },
                  }));
                  setCopoEditingCell(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95"
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
