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

  // ── Coordinator CRUD & Section Edit State ─────────────────────────────────
  const canEdit = Boolean(isCoord && activeExt && !activeExt.is_approved);

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

      {/* ── Tabs Content (Full Width or Split Screen) ── */}
      {(() => {
        const tabContent = (
          <>
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
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{activeExt.credits ?? course.credits ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Credits</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{activeExt.total_theory_hours ?? course.total_theory_hours ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Theory Hours</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{activeExt.total_lab_hours ?? course.total_lab_hours ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Lab Hours</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{activeExt.lecture_hours ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Lecture (L)</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{activeExt.tutorial_hours ?? 0}</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Tutorial (T)</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800/40">
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{activeExt.practical_hours ?? 0}</p>
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
                        {(activeExt.outcomes || []).map((co: any, idx: number) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                {co.co_code}
                              </span>
                              {(co.knowledge_level || co.bloom_level) && (
                                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                                  {co.knowledge_level || co.bloom_level}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                              {co.description}
                            </p>
                          </div>
                        ))}
                        {(!activeExt.outcomes || activeExt.outcomes.length === 0) && (
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
                        {(activeExt.textbooks || []).map((b: any, idx: number) => (
                          <div key={idx} className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                            <p className="font-semibold text-slate-900 dark:text-white">{b.title}</p>
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              {Array.isArray(b.authors) ? b.authors.join(", ") : b.authors} {b.publisher ? `— ${b.publisher}` : ""} {b.publication_year ? `(${b.publication_year})` : ""}
                            </p>
                          </div>
                        ))}
                        {(!activeExt.textbooks || activeExt.textbooks.length === 0) && (
                          <p className="text-xs text-slate-400 italic">No textbooks recorded.</p>
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
    </div>
  );
};

export default PrivateRouter(InsCourseArtifacts);
