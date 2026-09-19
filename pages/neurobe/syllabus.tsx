import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Dropdown, Success, Failure, useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import SyllabusStepper from "@/components/academic-setup/SyllabusStepper";
import StepHeader from "@/components/academic-setup/StepHeader";
import NeuroAIInfo from "@/components/academic-setup/NeuroAIInfo";
import ExtractionComplete from "@/components/academic-setup/ExtractionComplete";
import ReviewModeBar from "@/components/academic-setup/ReviewModeBar";
import PDFViewer from "@/components/academic-setup/PDFViewer";
import ExtractedDataPanel from "@/components/academic-setup/ExtractedDataPanel";
import { useRouter, useSearchParams } from "next/navigation";
import Models from "@/imports/models.import";
import {
  Upload,
  FileText,
  Plus,
  Sparkles,
  Clock,
  CheckCircle,
  RotateCw,
  ArrowRight,
  Layers,
} from "lucide-react";

type ImportType = "user" | "course";

const Syllabus = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const course_id = searchParams.get("course_id");
  const job_id = searchParams.get("job_id");

  const stepKey = `syllabus_step_${course_id ?? "default"}`;
  const jobKey = `syllabus_job_${course_id ?? "default"}`;
  const syllabusKey = `syllabus_id_${course_id ?? "default"}`;

  const getSavedStep = () => {
    try {
      const saved = sessionStorage.getItem(stepKey);
      return saved ? Number(saved) : 1;
    } catch {
      return 1;
    }
  };

  const getSavedJobId = () => {
    try {
      return sessionStorage.getItem(jobKey) || null;
    } catch {
      return null;
    }
  };

  const getSavedSyllabusId = () => {
    try {
      return sessionStorage.getItem(syllabusKey) || null;
    } catch {
      return null;
    }
  };

  const setStep = (step: number) => {
    try {
      sessionStorage.setItem(stepKey, String(step));
    } catch { }
    setState({ currentStep: step });
  };

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // clear poll on unmount
  useEffect(() => () => stopPolling(), []);

  const [state, setState] = useSetState({
    importType: "user" as ImportType,
    currentStep: getSavedStep(),
    selectedFile: null as File | null,
    showReview: false,
    activeTab: "coordinator",
    courseData: null as any,
    jobData: null as any,
    syllabusData: null as any,
    course_list: [],
    keep_file: false,
    showKeepFilePrompt: true,
    isJobLoading: false,
    pdfBlobUrl: null as string | null,
    lastLoadedSyllabusId: null as string | number | null,
    // Versioned file upload state
    fileVersions: [] as any[],
    isUploadingFile: false,
    pendingUploadFile: null as File | null,
    extractingFileVersionId: null as number | null,
  });

  useEffect(() => {
    dispatch(setPageTitle("Syllabus"));
  }, []);

  useEffect(() => {
    if (course_id) {
      course_data(course_id);
      coordinator_course_data();
      // Load file versions
      loadFileVersions(course_id);

      const explicitStep = searchParams.get("step");
      const explicitView = searchParams.get("view");
      const action = searchParams.get("action");

      // If job_id is explicitly passed in URL from an active action, poll it
      if (job_id) {
        try { sessionStorage.setItem(jobKey, String(job_id)); } catch { }
        setStep(3);
        job_Data(job_id);
      } else if (explicitStep === "3" || explicitView === "review") {
        setStep(3);
        const sid = searchParams.get("syllabus_id") || getSavedSyllabusId();
        if (sid) syllabus_detail(sid);
      } else if (explicitStep === "1" || action === "upload") {
        // Explicitly routed to upload screen (e.g. from '+' button)
        setStep(1);
      } else {
        // Cold-load or navigation: dynamically restore last left state from live workflow
        restoreStepFromWorkflow(course_id);
      }
    }
  }, [course_id, job_id, searchParams]);

  // When step 4 is reached, refresh course and syllabus data
  useEffect(() => {
    if (state.currentStep === 4 && course_id) {
      console.log("Step 4 reached, refreshing data...");
      course_data(course_id);
      if (state.courseData?.latest_syllabus?.id) {
        syllabus_detail(state.courseData.latest_syllabus.id);
      }
    }
  }, [state.currentStep]);

  const course_data = async (id: string) => {
    try {
      const res = await Models.course.detail(id);
      setState({ courseData: res });
    } catch (error) {
      console.log("error", error);
    }
  };

  /** Restore current step from live workflow status on navigation or cold-load */
  const restoreStepFromWorkflow = async (cid: string) => {
    try {
      const wfRes: any = await Models.syllabus.get_workflow_status(cid);
      const extraction = wfRes?.workflow?.step_1_syllabus_extraction;
      if (!extraction) {
        setStep(1);
        return;
      }
      const { status } = extraction;
      if (status === "redis_queued" || status === "generating") {
        // Extraction is in-progress — show loading step
        setStep(3);
        setState({ isJobLoading: true });
        const jobId = extraction.job_id;
        if (jobId) { 
          try { sessionStorage.setItem(jobKey, jobId); } catch { } 
          job_Data(jobId); 
        }
      } else if (status === "approved") {
        // Extraction already approved — show Review with Approved state (step 4)
        setStep(4);
        setState({ isJobLoading: false, showReview: true });
        const sid = wfRes?.syllabus_id || getSavedSyllabusId();
        if (sid) {
          try { sessionStorage.setItem(syllabusKey, String(sid)); } catch { }
          syllabus_detail(sid);
        }
      } else if (status === "draft") {
        // Extraction in draft — jump to Review & Edit (step 3)
        setStep(3);
        setState({ isJobLoading: false, showReview: true });
        const sid = wfRes?.syllabus_id || getSavedSyllabusId();
        if (sid) {
          try { sessionStorage.setItem(syllabusKey, String(sid)); } catch { }
          syllabus_detail(sid);
        }
      } else {
        // Not started or only file uploaded without extraction — stay on Step 1
        setStep(1);
        setState({ isJobLoading: false });
      }
    } catch (err) {
      console.warn("restoreStepFromWorkflow error:", err);
      setStep(1);
    }
  };

  /** Load all versioned file uploads for the course */
  const loadFileVersions = async (cid: string | number) => {
    try {
      const res: any = await Models.syllabus.listFileVersions(cid);
      setState({ fileVersions: res?.file_versions || [] });
    } catch {
      setState({ fileVersions: [] });
    }
  };

  /** Upload a new syllabus file version (no extraction triggered yet) */
  const uploadAndSaveFileVersion = async (file: File) => {
    if (!course_id) return;
    try {
      setState({ isUploadingFile: true });
      const formData = new FormData();
      formData.append("file", file);
      const res: any = await Models.syllabus.uploadFileVersion(course_id, formData);
      Success(`Syllabus v${res.version_number} uploaded — "${res.original_filename}"`);
      await loadFileVersions(course_id);
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Upload failed");
    } finally {
      setState({ isUploadingFile: false, pendingUploadFile: null });
    }
  };

  /** Trigger AI extraction from a specific file version */
  const extractFromVersion = async (fileVersionId: number, versionNumber: number) => {
    if (!course_id) return;
    try {
      setState({ extractingFileVersionId: fileVersionId });
      const res: any = await Models.syllabus.extractFromFileVersion(course_id, fileVersionId);
      Success(`Extraction started for v${versionNumber}`);
      if (res?.job_id) {
        try { sessionStorage.setItem(jobKey, String(res.job_id)); } catch { }
        setStep(3);
        setState({ isJobLoading: true });
        job_Data(res.job_id);
      }
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Extraction failed to start");
    } finally {
      setState({ extractingFileVersionId: null });
    }
  };


  const coordinator_course_data = async () => {
    try {
      const user = localStorage.getItem("user");
      const u = JSON.parse(user);
      const body = {
        coordinator_id: u?.id,
      };
      const res = await Models.course.list(body);
      const dropdown = Dropdown(res, "course_code");
      // setState({ courseData: res });
      console.log("coordinator_course_data detail →", dropdown);
      setState({ course_list: dropdown });
    } catch (error) {
      console.log("error", error);
    }
  };

  const onKeep = () => {
    setState({ keep_file: true, showKeepFilePrompt: false });
    console.log("Keep file");
  };

  const onDiscard = () => {
    setState({ keep_file: false, showKeepFilePrompt: false });
  };

  const normalizeSyllabusData = (data: any) => {
    if (!data) return null;

    const source = data?.course_data || data?.result?.course_data || data?.result || data;

    // 1. Outcomes
    const rawOutcomes = source?.outcomes || source?.courseOutcomes || data?.outcomes || data?.courseOutcomes || [];
    const outcomes = rawOutcomes.map((co: any, idx: number) => ({
      id: co.id ?? idx + 1,
      co_code: co.co_code || co.coCode || `CO${idx + 1}`,
      description: co.description || co.statement || "",
      knowledge_level: co.knowledge_level || co.knowledgeLevel || co.bloomLevel || "K2",
      is_accepted: co.is_accepted ?? false,
      reason_for_inferred_level: co.reason_for_inferred_level || co.reason || "",
    }));

    // 2. Units & Topics
    const rawUnits = source?.units || data?.units || [];
    const units = rawUnits.map((u: any, idx: number) => {
      const rawTopics = u.topics || [];
      const topics = rawTopics.map((t: any, tIdx: number) => ({
        id: t.id ?? tIdx + 1,
        topic_code: t.topic_code || t.topicId || `${u.unit_number || u.unitNumber || idx + 1}.${tIdx + 1}`,
        topic_name: t.topic_name || t.title || "",
        learning_sequence: t.learning_sequence || t.sequence || tIdx + 1,
      }));

      return {
        id: u.id ?? idx + 1,
        unit_number: u.unit_number ?? u.unitNumber ?? (idx + 1),
        unit_title: u.unit_title || u.title || `UNIT ${idx + 1}`,
        theory_hours: u.theory_hours ?? u.hours ?? 0,
        lab_hours: u.lab_hours ?? 0,
        syllabus_id: u.syllabus_id || data?.id || source?.syllabus_id,
        topics,
      };
    });

    // 3. Textbooks
    const rawTextbooks = source?.textbooks || source?.textBooks || data?.textbooks || data?.textBooks || [];
    const textbooks = rawTextbooks.map((b: any, idx: number) => ({
      id: b.id ?? idx + 1,
      title: b.title || "",
      authors: Array.isArray(b.authors) ? b.authors.join(", ") : (b.authors || ""),
      edition: b.edition || "",
      publisher: b.publisher || "",
      publication_year: b.publication_year ?? b.publicationYear ?? "",
    }));

    // 4. Reference Books
    const rawReferences = source?.reference_books || source?.references || data?.reference_books || data?.references || [];
    const reference_books = rawReferences.map((b: any, idx: number) => ({
      id: b.id ?? idx + 1,
      title: b.title || "",
      authors: Array.isArray(b.authors) ? b.authors.join(", ") : (b.authors || ""),
      edition: b.edition || "",
      publisher: b.publisher || "",
      publication_year: b.publication_year ?? b.publicationYear ?? "",
    }));

    return {
      ...data,
      ...source,
      course_data: source,
      outcomes,
      units,
      textbooks,
      reference_books,
    };
  };

  const startAIExtraction = async () => {
    try {
      const body = {
        file: state.selectedFile,
        course_id: course_id,
        keep_permanently: state.keep_file,
      };
      console.log("body", body);

      const formData = new FormData();
      formData.append("file", state.selectedFile);
      formData.append("course_id", course_id);
      formData.append("regulation", state.courseData?.regulation);
      formData.append("programme", state.courseData?.programme_id);
      formData.append("academic_year", state.courseData?.academic_year);

      formData.append("keep_permanently", state.keep_file);

      const res: any = await Models.syllabus.create(formData);
      console.log("res", res);

      if (res?.job_id) {
        try {
          sessionStorage.setItem(jobKey, String(res.job_id));
        } catch { }
        const sId = res?.syllabus_id || res?.result?.syllabus_id;
        if (sId) {
          try {
            sessionStorage.setItem(syllabusKey, String(sId));
          } catch { }
        }
        job_Data(res.job_id);
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const job_Data = async (id: string | number) => {
    stopPolling();
    setState({ isJobLoading: true });

    let retries = 0;
    const maxRetries = 30; // Max 30 retries (about 1.5 minutes with 3s interval)
    const pollInterval = 3000; // 3 seconds

    const fetchOnce = async () => {
      try {
        let res: any = null;
        try {
          res = await Models.job.detail(id);
          console.log("job_Data response:", res);
        } catch (jobErr) {
          console.log("Job detail error, will cross-check workflow status:", jobErr);
        }

        setStep(3);

        // Cross-check master workflow status if course_id is present
        let wfExtraction: any = null;
        if (course_id) {
          try {
            const wfRes: any = await Models.syllabus.get_workflow_status(course_id);
            wfExtraction = wfRes?.workflow?.step_1_syllabus_extraction;
          } catch (wfErr) {
            console.log("Workflow status check error:", wfErr);
          }
        }

        if (res?.status === "not_found") {
          console.log("Job status is not_found, stopping polling");
          setState({ isJobLoading: false });
          stopPolling();
          return;
        }

        const isCompleted =
          res?.status === "complete" ||
          res?.status === "completed" ||
          wfExtraction?.status === "draft" ||
          wfExtraction?.status === "approved";

        if (isCompleted) {
          const syllabusId =
            res?.result?.syllabus_id ||
            res?.syllabus_id ||
            res?.result?.course_data?.syllabus_id ||
            getSavedSyllabusId();

          if (syllabusId) {
            try {
              sessionStorage.setItem(syllabusKey, String(syllabusId));
            } catch { }
          }

          setState({ isJobLoading: false, showReview: true });

          // Populate jobData from extracted job result immediately
          if (res?.result) {
            const normalized = normalizeSyllabusData(res.result);
            console.log("Normalized extracted job result:", normalized);
            setState({ jobData: normalized });
          }

          if (syllabusId) {
            syllabus_detail(syllabusId);
          }
          stopPolling();
        } else if (res?.status === "failed" || wfExtraction?.status === "failed") {
          console.log("Job marked as failed");
          setState({ isJobLoading: false });
          stopPolling();
        } else {
          console.log(`Job status: ${res?.status || wfExtraction?.status || "processing"}, continuing to poll...`);
        }
      } catch (error: any) {
        console.log("job_Data error:", error);
        setState({ isJobLoading: false });
        stopPolling();
      }
    };

    await fetchOnce();
    pollRef.current = setInterval(fetchOnce, pollInterval);
  };

  const syllabus_detail = async (id: string | number) => {
    try {
      const res: any = await Models.syllabus.detail(id);
      console.log("syllabus_detail →", res);

      if (res?.id && res?.id !== state.lastLoadedSyllabusId) {
        uploded_file(res?.id);
        setState({ lastLoadedSyllabusId: res?.id });
      }

      const normalizedDetail = normalizeSyllabusData(res);

      setState((prev: any) => {
        const existingData = prev.jobData;
        const hasDbContent =
          (normalizedDetail?.outcomes && normalizedDetail.outcomes.length > 0) ||
          (normalizedDetail?.units && normalizedDetail.units.length > 0);

        if (hasDbContent || !existingData) {
          return { jobData: normalizedDetail };
        } else {
          // Keep existing extracted jobData but merge DB metadata like id, etc.
          return {
            jobData: {
              ...existingData,
              ...res,
              outcomes: existingData.outcomes?.length > 0 ? existingData.outcomes : normalizedDetail.outcomes,
              units: existingData.units?.length > 0 ? existingData.units : normalizedDetail.units,
              textbooks: existingData.textbooks?.length > 0 ? existingData.textbooks : normalizedDetail.textbooks,
              reference_books: existingData.reference_books?.length > 0 ? existingData.reference_books : normalizedDetail.reference_books,
            },
          };
        }
      });
    } catch (error) {
      console.log("syllabus_detail error", error);
    }
  };

  const uploded_file = async (id: string | number) => {
    try {
      const res: any = await Models.syllabus.uploded_file(id);
      console.log("uploded_file response →", res);
      console.log("uploded_file response type →", typeof res);
      console.log("uploded_file is Blob? →", res instanceof Blob);
      console.log("uploded_file is ArrayBuffer? →", res instanceof ArrayBuffer);

      // API should return a Blob (due to responseType: 'blob')
      if (res instanceof Blob) {
        console.log("Creating blob URL from Blob");
        const pdfBlobUrl = URL.createObjectURL(res);
        console.log("Blob URL created:", pdfBlobUrl);
        setState({ pdfBlobUrl });
      } else if (typeof res === "string") {
        console.log("Using response as string URL");
        // Fallback: if it's a URL string, use directly
        setState({ pdfBlobUrl: res });
      } else {
        console.log("Unknown response type, attempting to create blob");
        // Try to convert to blob as last resort
        const blob = new Blob([res], { type: "application/pdf" });
        const pdfBlobUrl = URL.createObjectURL(blob);
        setState({ pdfBlobUrl });
      }
    } catch (error) {
      console.log("uploded_file error", error);
    }
  };

  const handleAddTopic = async (
    unitId: number,
    body: { topic_code: string; topic_name: string; learning_sequence: number }
  ) => {
    try {
      const res = await Models.syllabus.create_unit_topic(unitId, body);
      Success("Topics added");
      if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);
    } catch (error: any) {
      console.log("create_unit_topic error", error);
      throw error;
    }
  };

  const onDeleteTopic = async (id: string | number) => {
    try {
      const res = await Models.syllabus.delete_unit_topic(id);
      Success("Topics deleted");
      if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);

      console.log("syllabus_status →", res);
    } catch (error) {
      console.log("syllabus_detail error", error);
    }
  };

  const handleAddTextbook = async (body: {
    syllabus_id: number;
    title: string;
    authors: string[];
    edition: string;
    publisher: string;
    publication_year: number;
  }) => {
    try {
      const res = await Models.syllabus.create_unit_textbook(body.syllabus_id, {
        title: body.title,
        authors: body.authors,
        edition: body.edition,
        publisher: body.publisher,
        publication_year: body.publication_year,
      });
      Success("Textbook added");
      if (body.syllabus_id) syllabus_detail(body.syllabus_id);
    } catch (error: any) {
      console.log("create_unit_textbook error", error);
      throw error;
    }
  };

  const handleAddReference = async (body: {
    syllabus_id: number;
    title: string;
    authors: string[];
    edition: string;
    publisher: string;
    publication_year: number;
  }) => {
    console.log("✌️reference body --->", body);

    try {
      const res = await Models.syllabus.create_unit_reference_book(
        body.syllabus_id,
        {
          title: body.title,
          authors: body.authors,
          edition: body.edition,
          publisher: body.publisher,
          publication_year: body.publication_year,
        }
      );
      Success("Reference book added");
      if (body.syllabus_id) syllabus_detail(body.syllabus_id);
    } catch (error: any) {
      console.log("create_unit_reference_book error", error);
      throw error;
    }
  };

  const onDeleteTextbook = async (id: string | number) => {
    try {
      const res = await Models.syllabus.delete_unit_textbook(id);
      Success("Textbook deleted");
      if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);
    } catch (error) {
      console.log("delete_unit_textbook error", error);
    }
  };

  const onDeleteReference = async (id: string | number) => {
    try {
      const res = await Models.syllabus.delete_unit_reference_book(id);
      Success("Reference book deleted");
      if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);
    } catch (error) {
      console.log("delete_unit_reference_book error", error);
    }
  };

  const handleSaveOutcome = async (id: number, description: string, co_code: string) => {
    setState((prev: any) => ({
      ...prev,
      jobData: {
        ...prev.jobData,
        outcomes: prev.jobData?.outcomes?.map((co: any) =>
          co.id === id ? { ...co, description, co_code } : co
        ),
      },
    }));

    try {
      await Models.syllabus.edit_unit_outcome(id, {
        co_code: co_code,
        description: description.trim(),
      });
      Success("Outcome updated");
      if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);
    } catch (error: any) {
      console.log("edit_unit_outcome error (preserved in draft):", error);
    }
  };

  const handleAcceptOutcome = async (id: number) => {
    setState((prev: any) => ({
      ...prev,
      jobData: {
        ...prev.jobData,
        outcomes: prev.jobData?.outcomes?.map((co: any) =>
          co.id === id ? { ...co, is_accepted: true } : co
        ),
      },
    }));

    try {
      await Models.syllabus.accept_outcome(id);
      Success("Outcome accepted");
      if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);
    } catch (error: any) {
      console.log("accept_outcome error (preserved in draft):", error);
    }
  };

  const handleKnowledgeLevelChange = async (id: number, value: string) => {
    setState((prev: any) => ({
      ...prev,
      jobData: {
        ...prev.jobData,
        outcomes: prev.jobData?.outcomes?.map((co: any) =>
          co.id === id ? { ...co, knowledge_level: value } : co
        ),
      },
    }));

    try {
      await Models.syllabus.update_knw_level_outcome(id, {
        knowledge_level: value,
      });
      Success("Knowledge level updated");
      if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);
    } catch (error: any) {
      console.log("update_knw_level_outcome error (preserved in draft):", error);
    }
  };

  const handleUpdateUnitHours = async (unitId: number, hours: number) => {
    setState((prev: any) => ({
      ...prev,
      jobData: {
        ...prev.jobData,
        units: prev.jobData?.units?.map((u: any) =>
          u.id === unitId ? { ...u, theory_hours: hours, hours } : u
        ),
      },
    }));

    try {
      await Models.syllabus.update_unit(unitId, { theory_hours: hours });
      Success("Unit hours updated");
      if (state.courseData?.latest_syllabus?.id) {
        syllabus_detail(state.courseData.latest_syllabus.id);
      }
    } catch (error: any) {
      console.log("update_unit hours error (preserved in draft):", error);
    }
  };

  const handleUpdateUnitTitle = async (unitId: number, title: string) => {
    setState((prev: any) => ({
      ...prev,
      jobData: {
        ...prev.jobData,
        units: prev.jobData?.units?.map((u: any) =>
          u.id === unitId ? { ...u, unit_title: title, title } : u
        ),
      },
    }));

    try {
      await Models.syllabus.update_unit(unitId, { unit_title: title });
      Success("Unit title updated");
      if (state.courseData?.latest_syllabus?.id) {
        syllabus_detail(state.courseData.latest_syllabus.id);
      }
    } catch (error: any) {
      console.log("update_unit title error (preserved in draft):", error);
    }
  };

  const getEffectiveSyllabusId = async (): Promise<string | number | null> => {
    if (state.courseData?.latest_syllabus?.id) return state.courseData.latest_syllabus.id;
    if (state.lastLoadedSyllabusId) return state.lastLoadedSyllabusId;
    if (state.jobData?.syllabus_id) return state.jobData.syllabus_id;
    if (state.jobData?.id) return state.jobData.id;
    const saved = getSavedSyllabusId();
    if (saved) return saved;
    if (course_id) {
      try {
        const wf: any = await Models.syllabus.get_workflow_status(course_id);
        if (wf?.syllabus_id) return wf.syllabus_id;
      } catch {}
    }
    return null;
  };

  const syllabus_status = async () => {
    try {
      const sid = await getEffectiveSyllabusId();

      // 1. Update syllabus repository status if syllabus ID is present
      if (sid) {
        try {
          const body = {
            approval_status: "approved_by_bos",
          };
          await Models.syllabus.status(sid, body);
        } catch (err) {
          console.warn("Update syllabus status warning:", err);
        }
      }

      // 2. Approve the workflow stage so downstream steps (CO-PO mapping, topics) unlock
      if (course_id) {
        try {
          await (Models.syllabus as any).approve_stage(course_id, "extraction");
        } catch (stgErr) {
          console.warn("approve_stage warning:", stgErr);
        }
      } else if (sid) {
        try {
          await (Models.syllabus as any).approve_stage(sid, "extraction");
        } catch (stgErr) {
          console.warn("approve_stage warning:", stgErr);
        }
      }

      Success("Syllabus extraction approved successfully!");
      setStep(4);
      if (course_id) {
        course_data(course_id);
      }
      if (sid) {
        syllabus_detail(sid);
      }
    } catch (error: any) {
      console.log("syllabus approval error", error);
      Failure(typeof error === "string" ? error : error?.message || "Failed to approve syllabus");
    }
  };
  console.log('✌️state.course_data --->', state.courseData);

  const handleSaveDraft = async () => {
    try {
      const sid = await getEffectiveSyllabusId();
      if (!sid) {
        Failure("No syllabus ID found to save draft");
        return;
      }

      const body = {
        credits: state?.jobData?.credits,
        lecture_hours: state?.jobData?.lecture_hours,
        tutorial_hours: state?.jobData?.tutorial_hours,
        practical_hours: state?.jobData?.practical_hours,
        regulation: state?.jobData?.regulation,
        programme: state?.jobData?.programme,
      };

      const res: any = await Models.syllabus.update_syllabus(sid, body);
      Success("Draft changes saved successfully.");
      console.log("syllabus draft saved →", res);
    } catch (error) {
      console.log("handleSaveDraft error", error);
    }
  };

  return (
    <div className="min-h-screen">
      <CourseBanner
        courseCode={state.courseData?.course_code || ""}
        courseTitle={state.courseData?.course_title || ""}
        description="Coordinator View — Academic course preparation, syllabus, outcomes mapping, lesson plans, question banking, and CIA paper generation."
        programme={state.courseData?.programme || ""}
        batch={state.courseData?.batch_name || ""}
        academicYear={state.courseData?.academic_year || ""}
        students={`${state.courseData?.students_count ?? 0} Students`}
        selectedCourse={state.courseData?.course_code || ""}
        courseOptions={state.course_list}
        onCourseChange={(val) => console.log("course", val)}
        activeView={state.activeTab}
        onBack={() => router.back()}
        onViewChange={(view) => setState({ activeTab: view })}
      />
      <div className="">
        <SyllabusStepper
          currentStep={state.currentStep}
          statusLabel={
            state.currentStep === 4
              ? "Approved"
              : state.currentStep === 3
                ? "Review Required"
                : "Awaiting Upload"
          }
          statusClassName={
            state.currentStep === 4
              ? "border-green-300 bg-green-50 text-green-600 font-bold"
              : state.currentStep === 3
                ? "border-orange-200 bg-orange-50 text-orange-600 font-bold"
                : ""
          }
        />
        <div className=" mx-6 border-t border-gray-200 dark:border-gray-700" />
        {state.currentStep === 1 && (
          <div className="py-3 pt-2 px-4 max-w-2xl mx-auto">
            <StepHeader
              title="Syllabus File Versions"
              description={`Upload one or more syllabus PDF versions, then press Extract on any version to start AI extraction.`}
            />

            {state.courseData?.latest_syllabus?.id && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 dark:border-emerald-800/50 dark:bg-emerald-950/30">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      Extracted Syllabus Available
                    </p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                      An extracted syllabus is saved. You can upload new files below or review the current syllabus.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(3);
                    syllabus_detail(state.courseData.latest_syllabus.id);
                  }}
                  className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-emerald-700 active:scale-95"
                >
                  Review Syllabus →
                </button>
              </div>
            )}

            {/* File Version List */}
            <div className="mt-4 flex flex-col gap-3">
              {state.fileVersions.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 py-10 text-center dark:border-indigo-800/40 dark:bg-indigo-950/20">
                  <Layers className="h-10 w-10 text-indigo-300" />
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No syllabus files uploaded yet</p>
                  <p className="text-xs text-slate-400">Upload a PDF to get started</p>
                </div>
              )}

              {state.fileVersions.map((fv: any) => {
                const isExtracting = state.extractingFileVersionId === fv.id;
                return (
                  <div
                    key={fv.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40">
                        <FileText className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                          <span className="mr-2 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                            v{fv.version_number}
                          </span>
                          {fv.original_filename}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {fv.uploaded_by} &bull; {fv.created_at ? new Date(fv.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isExtracting}
                      onClick={() => extractFromVersion(fv.id, fv.version_number)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                    >
                      {isExtracting ? (
                        <><RotateCw className="h-3 w-3 animate-spin" /> Extracting...</>
                      ) : (
                        <><Sparkles className="h-3 w-3" /> Extract</>
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Upload New Version */}
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30 px-4 py-3 transition-all hover:border-indigo-400 hover:bg-indigo-50/60 dark:border-indigo-800/40 dark:bg-indigo-950/20">
                <input
                  type="file"
                  accept=".pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAndSaveFileVersion(file);
                    e.target.value = "";
                  }}
                />
                {state.isUploadingFile ? (
                  <RotateCw className="h-5 w-5 animate-spin text-indigo-400" />
                ) : (
                  <Plus className="h-5 w-5 text-indigo-400" />
                )}
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  {state.isUploadingFile ? "Uploading..." : state.fileVersions.length === 0 ? "Upload Syllabus PDF" : "Upload New Version"}
                </span>
              </label>
            </div>

            <NeuroAIInfo />
          </div>
        )}

        {(state.currentStep === 3 || state.currentStep === 4) && (
          <div className=" py-3 pt-2">
            {!state.showReview && state.currentStep !== 4 ? (
              <ExtractionComplete
                fileName={state.selectedFile?.name}
                isLoading={state.isJobLoading}
                onReview={() => {
                  if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);
                  setState({ showReview: true });
                }}
                progress={state.isJobLoading ? 75 : 100}
              />
            ) : (
              <>
                {state.currentStep === 4 ? (
                  <div className="mb-5 mt-2 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-800 dark:bg-green-950/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white dark:bg-green-900">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-green-900 dark:text-green-200">
                            SYLLABUS EXTRACTION APPROVED
                          </p>
                          <span className="rounded-full border border-green-400 bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900 dark:text-green-300">
                            Approved by BoS
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-green-700 dark:text-green-400">
                          Extraction is verified and approved. You can now generate CO-PO Mapping and Topic Hierarchy.
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/neurobe/co-po-mapping?course_id=${course_id}`)}
                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition-all"
                      >
                        CO-PO Mapping <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/neurobe/topics?course_id=${course_id}`)}
                        className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-purple-700 transition-all"
                      >
                        Topic Hierarchy <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <ReviewModeBar
                    onSaveDraft={() => handleSaveDraft()}
                    onContinue={() => syllabus_status()}
                  />
                )}
                <div
                  className="grid gap-5"
                  style={{
                    height: "74vh",
                    overflow: "hidden",
                    gridTemplateColumns: "2fr 3fr",
                  }}
                >
                  <div className="min-h-0 overflow-hidden">
                    {state.pdfBlobUrl ? (
                      <iframe
                        src={state.pdfBlobUrl}
                        className="h-full w-full rounded-xl border border-gray-200 dark:border-gray-700"
                        title="PDF Viewer"
                      />
                    ) : (
                      <PDFViewer
                        file={state.selectedFile}
                        fileName={state.selectedFile?.name}
                        fileSize={
                          state.selectedFile
                            ? `${(state.selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                            : ""
                        }
                      />
                    )}
                  </div>
                  <div className="min-h-0 overflow-auto flex flex-col gap-3">
                    <ExtractedDataPanel
                      data={state.jobData}
                      courseData={state.courseData}
                      onAddTopic={handleAddTopic}
                      onDeleteTopic={onDeleteTopic}
                      handleAddTextbook={handleAddTextbook}
                      onDeleteTextbook={onDeleteTextbook}
                      handleAddReference={handleAddReference}
                      onDeleteReference={onDeleteReference}
                      handleSaveOutcome={handleSaveOutcome}
                      handleAcceptOutcome={handleAcceptOutcome}
                      handleKnowledgeLevelChange={handleKnowledgeLevelChange}
                      onUpdateUnitHours={handleUpdateUnitHours}
                      onUpdateUnitTitle={handleUpdateUnitTitle}
                      syllabusId={state.courseData?.latest_syllabus?.id || state.lastLoadedSyllabusId || state.jobData?.syllabus_id || state.jobData?.id}
                    />

                    {/* Navigation buttons to downstream stages */}
                    <div className="flex items-center gap-3 border-t border-slate-200 pt-4 mt-2 pb-4 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-500 flex-1">Approve this extraction, then proceed to:</p>
                      <button
                        type="button"
                        onClick={() => router.push(`/neurobe/co-po-mapping?course_id=${course_id}`)}
                        className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-300"
                      >
                        CO-PO Mapping <ArrowRight className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => router.push(`/neurobe/topics?course_id=${course_id}`)}
                        className="flex items-center gap-1.5 rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:border-purple-700 dark:bg-purple-950/30 dark:text-purple-300"
                      >
                        Topic Hierarchy <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateRouter(Syllabus);
