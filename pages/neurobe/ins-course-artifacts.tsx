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
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import Models from "@/imports/models.import";

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

  const handleApproveExtraction = async () => {
    if (!activeExt?.extractions_id) return;
    try {
      setActionLoading("approve_extraction");
      await Models.syllabus.extraction_approve(activeExt.extractions_id);
      Success("Curriculum extraction approved successfully!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve extraction"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateExtraction = async () => {
    if (!activeExt?.extractions_id) return;
    try {
      setActionLoading("activate_extraction");
      await Models.syllabus.extraction_activate(activeExt.extractions_id);
      Success("Extraction activated as current version!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate extraction"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateCopo = async () => {
    if (!activeExt?.extractions_id) return;
    try {
      setActionLoading("generate_copo");
      await Models.copo.generate({ extractions_id: activeExt.extractions_id });
      Success("CO-PO mapping generation queued!");
      setJobNotice(
        "CO-PO mapping generation is queued. When completed, click the Refresh button to load the generated matrix."
      );
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to trigger CO-PO generation"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveCopo = async () => {
    if (!activeCopo?.copo_id) return;
    try {
      setActionLoading("approve_copo");
      await Models.copo.approve(activeCopo.copo_id);
      Success("CO-PO mapping approved!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve CO-PO mapping"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateCopo = async () => {
    if (!activeCopo?.copo_id) return;
    try {
      setActionLoading("activate_copo");
      await Models.copo.activate(activeCopo.copo_id);
      Success("CO-PO mapping activated as current version!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate CO-PO mapping"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleGeneratePedagogy = async () => {
    if (!activeExt?.extractions_id) return;
    try {
      setActionLoading("generate_pedagogy");
      await Models.pedagogy.generate({ extractions_id: activeExt.extractions_id });
      Success("Pedagogy suggestions generation queued!");
      setJobNotice(
        "Pedagogy generation is queued. When completed, click the Refresh button to load the new teaching strategies."
      );
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to trigger pedagogy generation"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprovePedagogy = async () => {
    if (!activePedagogy?.pedagogy_id) return;
    try {
      setActionLoading("approve_pedagogy");
      await Models.pedagogy.approve(activePedagogy.pedagogy_id);
      Success("Pedagogy suggestions approved!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve pedagogy"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivatePedagogy = async () => {
    if (!activePedagogy?.pedagogy_id) return;
    try {
      setActionLoading("activate_pedagogy");
      await Models.pedagogy.activate(activePedagogy.pedagogy_id);
      Success("Pedagogy suggestions activated as current version!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate pedagogy"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateLessonPlan = async () => {
    if (!activeExt?.extractions_id) return;
    try {
      setActionLoading("generate_lp");
      await Models.lession_plan.generate({
        extractions_id: activeExt.extractions_id,
        target_total_hours: 45,
      });
      Success("Lesson plan generation queued!");
      setJobNotice(
        "Lesson plan schedule generation is queued. When completed, click the Refresh button to load the hourly timeline."
      );
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to trigger lesson plan generation"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveLessonPlan = async () => {
    if (!activeLessonPlan?.lesson_plan_id) return;
    try {
      setActionLoading("approve_lp");
      await Models.lession_plan.approve(activeLessonPlan.lesson_plan_id);
      Success("Lesson plan approved!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve lesson plan"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivateLessonPlan = async () => {
    if (!activeLessonPlan?.lesson_plan_id) return;
    try {
      setActionLoading("activate_lp");
      await Models.lession_plan.activate(activeLessonPlan.lesson_plan_id);
      Success("Lesson plan activated as current version!");
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate lesson plan"));
    } finally {
      setActionLoading(null);
    }
  };

  // Units list from active extraction
  const units = activeExt?.units || [];
  const selectedUnit = units[selectedUnitIndex] || units[0];

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

            {/* Coordinator-only Upload & Version History */}
            {isCoord && (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/neurobe/course-version-history?course_id=${courseIdParam}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <History className="h-3.5 w-3.5 text-slate-500" />
                  <span>Version History</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Syllabus</span>
                </button>
              </>
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

      {/* ── TAB 1: SYLLABUS & CURRICULUM ── */}
      {activeTab === "syllabus" && (
        <div className="space-y-6">
          {/* Active Version Snapshot Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Active Syllabus File
                </p>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {activeSyllabus?.original_filename || "No syllabus uploaded"}
                </h4>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeExt?.is_approved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Extraction Approved
                </span>
              ) : activeExt ? (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  Draft Extraction (v{activeExt.extraction_version_id})
                </span>
              ) : null}

              {/* Coordinator Approval & Activation Controls */}
              {isCoord && activeExt && !activeExt.is_approved && (
                <button
                  type="button"
                  onClick={handleApproveExtraction}
                  disabled={actionLoading === "approve_extraction"}
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === "approve_extraction" ? "Approving..." : "Approve Extraction"}
                </button>
              )}

              {isCoord && activeExt && activeExt.is_approved && !activeExt.is_active && (
                <button
                  type="button"
                  onClick={handleActivateExtraction}
                  disabled={actionLoading === "activate_extraction"}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                >
                  {actionLoading === "activate_extraction" ? "Activating..." : "Set as Active"}
                </button>
              )}
            </div>
          </div>

          {/* If No Extraction */}
          {!activeExt && (
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

          {activeExt && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left Column: Objectives & Outcomes */}
              <div className="space-y-6 lg:col-span-1">
                {/* Course Objectives */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="h-4 w-4 text-indigo-500" />
                    <span>Course Objectives</span>
                  </h3>
                  <ul className="mt-3 space-y-2.5">
                    {(activeExt.objectives || []).map((obj: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-indigo-50 font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                          {obj.objective_number || idx + 1}
                        </span>
                        <span className="leading-relaxed">{obj.description}</span>
                      </li>
                    ))}
                    {(!activeExt.objectives || activeExt.objectives.length === 0) && (
                      <li className="text-xs text-slate-400 italic">No specific objectives defined.</li>
                    )}
                  </ul>
                </div>

                {/* Course Outcomes */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Course Outcomes (COs)</span>
                  </h3>
                  <div className="mt-3 space-y-3">
                    {(activeExt.outcomes || []).map((co: any, idx: number) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {co.co_code}
                          </span>
                          {co.bloom_level && (
                            <span className="rounded bg-slate-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                              {co.bloom_level}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                          {co.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Textbooks & References */}
                <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    <span>Prescribed Textbooks</span>
                  </h3>
                  <div className="mt-3 space-y-2.5">
                    {(activeExt.textbooks || []).map((b: any, idx: number) => (
                      <div key={idx} className="text-xs text-slate-700 dark:text-slate-300">
                        <p className="font-semibold">{b.title}</p>
                        <p className="text-[11px] text-slate-400">
                          {Array.isArray(b.authors) ? b.authors.join(", ") : b.authors} {b.publisher ? `— ${b.publisher}` : ""}
                        </p>
                      </div>
                    ))}
                    {(!activeExt.textbooks || activeExt.textbooks.length === 0) && (
                      <p className="text-xs text-slate-400 italic">No textbooks recorded.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Units & Curriculum Hierarchy */}
              <div className="space-y-4 lg:col-span-2">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Curriculum Hierarchy (Units, Topics & Subtopics)
                    </h3>
                    <span className="text-xs font-semibold text-slate-400">
                      {units.length} Units Extracted
                    </span>
                  </div>

                  <div className="mt-5 space-y-5">
                    {units.map((u: any, uIdx: number) => (
                      <div
                        key={uIdx}
                        className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 dark:border-slate-800 dark:bg-slate-800/30"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Unit {u.unit_number}: {u.unit_title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <span>{u.theory_hours || 0} Theory Hrs</span>
                            <span>•</span>
                            <span>{u.lab_hours || 0} Lab Hrs</span>
                          </div>
                        </div>

                        {u.unit_overview && (
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {u.unit_overview}
                          </p>
                        )}

                        {/* Topics List */}
                        <div className="mt-3 space-y-2">
                          {(u.topics || []).map((t: any, tIdx: number) => (
                            <div
                              key={tIdx}
                              className="rounded-lg border border-slate-100 bg-white p-3 shadow-2xs dark:border-slate-700/60 dark:bg-slate-800"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                                  {t.topic_code ? `${t.topic_code} — ` : ""}{t.topic_name}
                                </span>
                                {t.knowledge_level && (
                                  <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                                    {t.knowledge_level}
                                  </span>
                                )}
                              </div>

                              {/* Subtopics */}
                              {(t.subtopics || []).length > 0 && (
                                <ul className="mt-2 pl-4 border-l-2 border-indigo-100 dark:border-indigo-950 space-y-1">
                                  {t.subtopics.map((st: any, stIdx: number) => (
                                    <li key={stIdx} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                      <span className="h-1 w-1 rounded-full bg-indigo-400" />
                                      <span>{st.subtopic_name}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Course Outcome to Program Outcome (CO-PO) Correlation Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Accreditation mapping (1 = Low, 2 = Medium, 3 = High correlation)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeCopo?.is_approved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  CO-PO Matrix Approved
                </span>
              ) : activeCopo ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  Draft Version {activeCopo.version_id}
                </span>
              ) : null}

              {/* Coordinator Controls */}
              {isCoord && !activeCopo && activeExt?.is_approved && (
                <button
                  type="button"
                  onClick={handleGenerateCopo}
                  disabled={actionLoading === "generate_copo"}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === "generate_copo" ? "Queuing..." : "Generate CO-PO Mapping"}
                </button>
              )}

              {isCoord && activeCopo && !activeCopo.is_approved && (
                <button
                  type="button"
                  onClick={handleApproveCopo}
                  disabled={actionLoading === "approve_copo"}
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading === "approve_copo" ? "Approving..." : "Approve CO-PO"}
                </button>
              )}

              {isCoord && activeCopo && activeCopo.is_approved && !activeCopo.is_active && (
                <button
                  type="button"
                  onClick={handleActivateCopo}
                  disabled={actionLoading === "activate_copo"}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === "activate_copo" ? "Activating..." : "Set as Active"}
                </button>
              )}
            </div>
          </div>

          {!activeCopo ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <Layers className="h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                No CO-PO Mapping Generated
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {isCoord
                  ? activeExt?.is_approved
                    ? "Click 'Generate CO-PO Mapping' to trigger AI matrix generation based on the approved extraction."
                    : "The extraction must be approved first before generating the CO-PO correlation matrix."
                  : "The course coordinator has not generated a CO-PO mapping version for this course yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">CO Code</th>
                    <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Target PO</th>
                    <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Correlation Level</th>
                    <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(activeCopo.matrix_entries || []).map((cell: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{cell.co_code || `CO${cell.course_outcome_id}`}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{cell.po_code || `PO${cell.po_id}`}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            cell.matrix_value === 3
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                              : cell.matrix_value === 2
                              ? "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300"
                              : cell.matrix_value === 1
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {cell.matrix_value || 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                        {cell.justification || "—"}
                      </td>
                    </tr>
                  ))}
                  {(activeCopo.matrix_entries || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        No matrix cell entries recorded in this mapping version.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PEDAGOGY & DELIVERY ── */}
      {activeTab === "pedagogy" && (
        <div className="space-y-6">
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
              {activePedagogy?.is_approved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Pedagogy Approved
                </span>
              ) : activePedagogy ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  Draft Version {activePedagogy.version_id}
                </span>
              ) : null}

              {/* Coordinator Controls */}
              {isCoord && !activePedagogy && activeExt?.is_approved && (
                <button
                  type="button"
                  onClick={handleGeneratePedagogy}
                  disabled={actionLoading === "generate_pedagogy"}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === "generate_pedagogy" ? "Queuing..." : "Generate Pedagogy"}
                </button>
              )}

              {isCoord && activePedagogy && !activePedagogy.is_approved && (
                <button
                  type="button"
                  onClick={handleApprovePedagogy}
                  disabled={actionLoading === "approve_pedagogy"}
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading === "approve_pedagogy" ? "Approving..." : "Approve Pedagogy"}
                </button>
              )}

              {isCoord && activePedagogy && activePedagogy.is_approved && !activePedagogy.is_active && (
                <button
                  type="button"
                  onClick={handleActivatePedagogy}
                  disabled={actionLoading === "activate_pedagogy"}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === "activate_pedagogy" ? "Activating..." : "Set as Active"}
                </button>
              )}
            </div>
          </div>

          {!activePedagogy ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <Presentation className="h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                No Pedagogy Generated
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {isCoord
                  ? activeExt?.is_approved
                    ? "Click 'Generate Pedagogy' to automatically synthesize topic-level teaching delivery methods."
                    : "The extraction must be approved first before generating pedagogy strategies."
                  : "The course coordinator has not generated pedagogy strategies for this course yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(activePedagogy.topic_suggestions || []).map((sug: any, idx: number) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      Topic #{sug.topic_id}
                    </span>
                    {sug.bloom_level_1 && (
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        {sug.bloom_level_1}
                      </span>
                    )}
                  </div>

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

                    {sug.pedagogy_suggested_2 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                        <span className="font-semibold">Alternative Strategy:</span> {sug.pedagogy_suggested_2}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(activePedagogy.topic_suggestions || []).length === 0 && (
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
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Lecture Plan, Hourly Allocation & Delivery Schedule
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target hours: {activeLessonPlan?.target_total_hours || 45} Hrs • Total Theory: {activeLessonPlan?.total_theory_hours || 0} Hrs • Total Lab: {activeLessonPlan?.total_lab_hours || 0} Hrs
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeLessonPlan?.is_approved ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Lesson Plan Approved
                </span>
              ) : activeLessonPlan ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                  Draft Version {activeLessonPlan.version_id}
                </span>
              ) : null}

              {/* Coordinator Controls */}
              {isCoord && !activeLessonPlan && activeExt?.is_approved && (
                <button
                  type="button"
                  onClick={handleGenerateLessonPlan}
                  disabled={actionLoading === "generate_lp"}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === "generate_lp" ? "Queuing..." : "Generate Lesson Plan"}
                </button>
              )}

              {isCoord && activeLessonPlan && !activeLessonPlan.is_approved && (
                <button
                  type="button"
                  onClick={handleApproveLessonPlan}
                  disabled={actionLoading === "approve_lp"}
                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {actionLoading === "approve_lp" ? "Approving..." : "Approve Lesson Plan"}
                </button>
              )}

              {isCoord && activeLessonPlan && activeLessonPlan.is_approved && !activeLessonPlan.is_active && (
                <button
                  type="button"
                  onClick={handleActivateLessonPlan}
                  disabled={actionLoading === "activate_lp"}
                  className="rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading === "activate_lp" ? "Activating..." : "Set as Active"}
                </button>
              )}
            </div>
          </div>

          {!activeLessonPlan ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <Calendar className="h-10 w-10 text-slate-400" />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                No Lesson Plan Generated
              </h3>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                {isCoord
                  ? activeExt?.is_approved
                    ? "Click 'Generate Lesson Plan' to allocate hours across topics and subtopics based on syllabus requirements."
                    : "The extraction must be approved first before generating a lesson plan."
                  : "The course coordinator has not generated a lesson plan for this course yet."}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Slot #</th>
                    <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Topic / Subtopic</th>
                    <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Time Allocated</th>
                    <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Bloom Level</th>
                    <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Suggested Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(activeLessonPlan.topic_slots || []).map((slot: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        Topic ID: {slot.topic_id}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                        {slot.time_allocated || 1} Hr(s)
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {slot.bloom_level || "Understand"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {slot.suggested_activity || "Interactive Lecture & Discussion"}
                      </td>
                    </tr>
                  ))}
                  {(activeLessonPlan.topic_slots || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                        No topic slots defined in this lesson plan version.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
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
    </div>
  );
};

export default PrivateRouter(InsCourseArtifacts);
