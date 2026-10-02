import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import SyllabusStepper from "@/components/academic-setup/SyllabusStepper";
import SyllabusUpload from "@/components/academic-setup/SyllabusUpload";
import FileVersionCard, {
  FileVersionItem,
} from "@/components/academic-setup/FileVersionCard";
import ReviewModeBar from "@/components/academic-setup/ReviewModeBar";
import PDFViewer from "@/components/academic-setup/PDFViewer";
import ExtractedDataPanel from "@/components/academic-setup/ExtractedDataPanel";
import { useRouter, useSearchParams } from "next/navigation";
import Models from "@/imports/models.import";
import { Sparkles, Layers, ArrowRight, RotateCw, FileText } from "lucide-react";

const Syllabus = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseIdParam = searchParams.get("course_id");
  const codeParam = searchParams.get("code");

  // State
  const [courseData, setCourseData] = useState<any>(null);
  const [fileVersions, setFileVersions] = useState<FileVersionItem[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Upload & Extraction states
  const [isUploading, setIsUploading] = useState(false);
  const [extractingId, setExtractingId] = useState<number | null>(null);

  // Review & Split-Screen View states
  const [viewMode, setViewMode] = useState<"files" | "review">("files");
  const [loadingReviewId, setLoadingReviewId] = useState<number | null>(null);
  const [reviewFileVersion, setReviewFileVersion] = useState<FileVersionItem | null>(null);
  const [reviewExtractionData, setReviewExtractionData] = useState<any>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Poll timer
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    dispatch(setPageTitle("Syllabus Extraction & Curriculum"));
  }, [dispatch]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        try {
          URL.revokeObjectURL(pdfBlobUrl);
        } catch {}
      }
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [pdfBlobUrl]);

  /** Load course details, versions list, and workflow status */
  const loadCourseData = useCallback(async () => {
    if (!courseIdParam) return;
    try {
      const [cRes, fvRes, wfRes]: [any, any, any] = await Promise.all([
        Models.course.detail(courseIdParam).catch(() => null),
        Models.syllabus.listFileVersions(courseIdParam).catch(() => null),
        Models.syllabus.get_workflow_status(courseIdParam).catch(() => null),
      ]);

      if (cRes) setCourseData(cRes);
      if (fvRes?.file_versions && Array.isArray(fvRes.file_versions)) {
        setFileVersions(fvRes.file_versions);
      }
      if (wfRes) setWorkflowStatus(wfRes.workflow || wfRes);
    } catch (err) {
      console.warn("Error fetching course data:", err);
    } finally {
      setLoadingInitial(false);
    }
  }, [courseIdParam]);

  useEffect(() => {
    loadCourseData();
  }, [loadCourseData]);

  /** 1. Upload Syllabus File -> Creates new file version */
  const handleUploadFile = async (file: File) => {
    if (!courseIdParam) {
      Failure("No course selected.");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res: any = await Models.syllabus.uploadFileVersion(courseIdParam, formData);
      const newVerNum = res?.version_number || fileVersions.length + 1;
      Success(`Syllabus uploaded successfully as Version ${newVerNum}`);

      // Refresh list
      await loadCourseData();
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to upload syllabus file"));
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  /** 2. Trigger Extraction from a specific file version */
  const handleExtract = async (version: FileVersionItem) => {
    if (!courseIdParam) return;

    try {
      setExtractingId(version.id);
      await Models.syllabus.extractFromFileVersion(courseIdParam, version.id);
      Success(`AI Extraction started for File Version ${version.version_number}`);

      // Poll until extraction completes
      const pollExtraction = async (attempts = 0) => {
        if (attempts > 30) {
          setExtractingId(null);
          return;
        }

        try {
          const [fvRes, wfRes]: [any, any] = await Promise.all([
            Models.syllabus.listFileVersions(courseIdParam).catch(() => null),
            Models.syllabus.get_workflow_status(courseIdParam).catch(() => null),
          ]);

          if (fvRes?.file_versions) {
            setFileVersions(fvRes.file_versions);
            const currentFv = fvRes.file_versions.find((v: any) => v.id === version.id);
            const st = currentFv?.extraction_status?.toLowerCase();

            if (st === "draft" || st === "approved" || st === "failed") {
              setExtractingId(null);
              if (st === "failed") {
                Failure("Extraction failed. Please check the PDF document.");
              } else {
                Success(`Extraction completed for Version ${version.version_number}!`);
              }
              if (wfRes) setWorkflowStatus(wfRes.workflow || wfRes);
              return;
            }
          }

          pollTimerRef.current = setTimeout(() => pollExtraction(attempts + 1), 3000);
        } catch {
          setExtractingId(null);
        }
      };

      pollExtraction();
    } catch (err: any) {
      setExtractingId(null);
      Failure(getErrorMessage(err, "Failed to trigger extraction"));
    }
  };

  /** 3. Review a File Version & Populate Extraction Data in Split-Screen */
  const handleReview = async (version: FileVersionItem) => {
    if (!courseIdParam) return;

    try {
      setLoadingReviewId(version.id);

      // Fetch PDF Blob and Extraction Data in parallel
      const [blobRes, extRes]: [any, any] = await Promise.all([
        Models.syllabus.getFileVersionFile(courseIdParam, version.version_number).catch(() => null),
        Models.syllabus.getFileVersionExtraction(courseIdParam, version.version_number).catch(() => null),
      ]);

      // Set PDF blob with fallback
      let urlToUse: string | null = null;
      if (blobRes instanceof Blob && blobRes.size > 0) {
        const pdfBlob =
          blobRes.type === "application/pdf"
            ? blobRes
            : new Blob([blobRes], { type: "application/pdf" });
        if (pdfBlobUrl) {
          try {
            URL.revokeObjectURL(pdfBlobUrl);
          } catch {}
        }
        urlToUse = URL.createObjectURL(pdfBlob);
      } else if (blobRes && !(blobRes instanceof Blob)) {
        const pdfBlob = new Blob([blobRes], { type: "application/pdf" });
        urlToUse = URL.createObjectURL(pdfBlob);
      } else {
        // Direct stream fallback
        urlToUse = `http://localhost:8080/course/syllabi/courses/${courseIdParam}/file-versions/${version.version_number}/file`;
      }
      setPdfBlobUrl(urlToUse);

      // Populate extracted data
      let finalData = extRes?.data_ai_gave;

      // If data_ai_gave has no nested units, fall back to master syllabus detail
      if (!finalData || (!finalData.units && !finalData.outcomes && !finalData.courseOutcomes)) {
        const sid = courseData?.latest_syllabus?.id || courseData?.syllabus_id || extRes?.extraction_id;
        if (sid) {
          try {
            const masterSyl: any = await Models.syllabus.detail(sid);
            if (masterSyl) finalData = masterSyl;
          } catch {}
        }
      }

      setReviewFileVersion(version);
      setReviewExtractionData(finalData || {});
      setViewMode("review");
      Success(`Loaded Version ${version.version_number} data into Review`);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to load version review data"));
    } finally {
      setLoadingReviewId(null);
    }
  };

  /** 4. Save Draft Changes */
  const handleSaveDraft = async () => {
    if (!courseIdParam || !reviewFileVersion) return;
    try {
      setIsSavingDraft(true);
      await (Models.syllabus as any).updateFileVersionExtraction(
        courseIdParam,
        reviewFileVersion.version_number,
        reviewExtractionData
      );
      Success("Draft saved successfully.");
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save draft"));
    } finally {
      setIsSavingDraft(false);
    }
  };

  /** 5. Approve Extraction */
  const handleApprove = async () => {
    if (!courseIdParam || !reviewFileVersion) return;
    try {
      setIsApproving(true);
      const extVer = reviewFileVersion.extraction_version || 1;

      // Auto-save any pending changes to extraction snapshot before approving
      if (reviewExtractionData) {
        await (Models.syllabus as any)
          .updateFileVersionExtraction(
            courseIdParam,
            reviewFileVersion.version_number,
            reviewExtractionData
          )
          .catch(() => null);
      }

      await Models.syllabus.approve_stage(courseIdParam, "extraction", extVer);
      Success("Syllabus Extraction Approved! You can now proceed to CO-PO Mapping.");

      // Update local state to reflect approved status
      setReviewFileVersion((prev) =>
        prev ? { ...prev, extraction_status: "approved" } : null
      );

      // Refresh master course data & workflow status
      await loadCourseData();
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve extraction"));
    } finally {
      setIsApproving(false);
    }
  };

  /** 6. Make a File Version Active */
  const handleActivate = async (version: FileVersionItem) => {
    if (!courseIdParam) return;
    try {
      await Models.syllabus.activateFileVersion(courseIdParam, version.version_number);
      if (version.extraction_version) {
        await Models.syllabus
          .activate_version(courseIdParam, "extraction", version.extraction_version)
          .catch(() => null);
      }
      Success(`Version ${version.version_number} is now the active syllabus.`);
      await loadCourseData();
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate version"));
    }
  };

  /** 6. Proceed to CO-PO Mapping */
  const handleProceedToCopo = () => {
    const code = courseData?.course_code || codeParam || "";
    router.push(
      `/neurobe/co-po-mapping?course_id=${courseIdParam}&code=${code}&from=syllabus`
    );
  };

  /** Update LTPC from ExtractedDataPanel */
  const handleUpdateLTPC = async (ltpc: any) => {
    if (!courseIdParam) return;
    try {
      await Models.course.update(courseIdParam, ltpc);
      setCourseData((prev: any) => ({ ...prev, ...ltpc }));
    } catch {}
  };

  // Derive stepper step: 1 = Upload, 2 = AI Extraction, 3 = Review & Edit, 4 = Approve & Save
  const currentStep =
    viewMode === "review"
      ? reviewFileVersion?.extraction_status === "approved"
        ? 4
        : 3
      : fileVersions.length > 0
      ? 2
      : 1;

  const currentStatusLabel =
    workflowStatus?.step_1_syllabus_extraction?.status === "approved"
      ? "Approved"
      : workflowStatus?.step_1_syllabus_extraction?.status === "draft"
      ? "Draft"
      : "Not Started";

  return (
    <div className="min-h-screen pb-12">
      {/* ── Course Banner ── */}
      <CourseBanner
        courseCode={courseData?.course_code || codeParam || "Course"}
        courseTitle={courseData?.course_title || "Course Workspace"}
        description="Academic course preparation, syllabus extraction, outcomes mapping, and curriculum design."
        programme={courseData?.programme || "B.Tech CSE"}
        batch={courseData?.batch_name || "Batch 2025-2029"}
        academicYear={courseData?.academic_year || "2026-2027"}
        students={String(courseData?.students_count || 0)}
        onBack={() => router.push("/neurobe/my-assigned-courses")}
      />

      {/* ── Progress Stepper ── */}
      <div className="mt-4">
        <SyllabusStepper
          currentStep={currentStep}
          statusLabel={currentStatusLabel}
        />
      </div>

      {/* ── VIEW A: Files & Versions View ── */}
      {viewMode === "files" && (
        <div className="mt-6 space-y-6">
          {/* Upload Dropzone */}
          <SyllabusUpload
            isUploading={isUploading}
            onUploadFile={handleUploadFile}
          />

          {/* Uploaded File Versions List */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Syllabus File Versions
                </h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {fileVersions.length} {fileVersions.length === 1 ? "Version" : "Versions"}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Each upload saves document location and allows independent AI extraction.
              </p>
            </div>

            {loadingInitial ? (
              <div className="flex items-center justify-center py-12 text-xs text-slate-400">
                <RotateCw className="mr-2 h-4 w-4 animate-spin text-indigo-500" />
                Loading syllabus files...
              </div>
            ) : fileVersions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-xs text-slate-400 dark:border-slate-700">
                No syllabus documents uploaded yet. Upload a PDF above to create Version 1.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {fileVersions.map((fv) => (
                  <FileVersionCard
                    key={fv.id}
                    version={fv}
                    isExtracting={extractingId === fv.id}
                    isLoadingReview={loadingReviewId === fv.id}
                    onExtract={handleExtract}
                    onReview={handleReview}
                    onActivate={handleActivate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW B: Split-Screen Review View ── */}
      {viewMode === "review" && reviewFileVersion && (
        <div className="mt-6">
          {/* Top Review Mode Action Bar */}
          <ReviewModeBar
            fileVersionNumber={reviewFileVersion.version_number}
            extractionVersion={reviewFileVersion.extraction_version}
            extractionStatus={reviewFileVersion.extraction_status || "draft"}
            isSaving={isSavingDraft}
            isApproving={isApproving}
            onBackToVersions={() => setViewMode("files")}
            onSaveDraft={handleSaveDraft}
            onApprove={handleApprove}
            onProceedToCopo={handleProceedToCopo}
          />

          {/* 50 / 50 Split-Screen Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2" style={{ height: "calc(100vh - 260px)", minHeight: "650px" }}>
            {/* Left Column: PDF Document Viewer */}
            <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-900 shadow-xs dark:border-slate-800">
              <PDFViewer
                file={pdfBlobUrl}
                fileName={reviewFileVersion.original_filename}
              />
            </div>

            {/* Right Column: Extracted Structured Data Tabs */}
            <div className="h-full overflow-hidden">
              <ExtractedDataPanel
                data={reviewExtractionData}
                courseData={courseData}
                courseId={courseIdParam}
                versionNumber={reviewFileVersion.version_number}
                onChangeData={(updatedData) => setReviewExtractionData(updatedData)}
                onUpdateLTPC={handleUpdateLTPC}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(Syllabus);
