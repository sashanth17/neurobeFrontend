import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Dropdown, Success, useSetState } from "@/utils/function.utils";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import SyllabusStepper from "@/components/academic-setup/SyllabusStepper";
import StepHeader from "@/components/academic-setup/StepHeader";
import SyllabusUpload from "@/components/academic-setup/SyllabusUpload";
import KeepFilePrompt from "@/components/academic-setup/KeepFilePrompt";
import NeuroAIInfo from "@/components/academic-setup/NeuroAIInfo";
import ExtractionComplete from "@/components/academic-setup/ExtractionComplete";
import ReviewModeBar from "@/components/academic-setup/ReviewModeBar";
import PDFViewer from "@/components/academic-setup/PDFViewer";
import ExtractedDataPanel from "@/components/academic-setup/ExtractedDataPanel";
import SyllabusApprovedBanner from "@/components/academic-setup/SyllabusApprovedBanner";
import SyllabusApprovedSummary from "@/components/academic-setup/SyllabusApprovedSummary";
import IconEdit from "@/components/Icon/IconEdit";
import IconTrash from "@/components/Icon/IconTrash";
import TableComponent from "@/components/common-components/TableComponent";
import PrimaryButton from "@/components/FormFields/PrimaryButton.component";
import { Check, Sparkles } from "lucide-react";
import CourseOutcomes from "@/components/academic-setup/CourseOutcomes";
import { useRouter, useSearchParams } from "next/navigation";
import Models from "@/imports/models.import";

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
  });

  useEffect(() => {
    dispatch(setPageTitle("Syllabus"));
  }, []);

  useEffect(() => {
    if (course_id) {
      course_data(course_id);
      coordinator_course_data();

      // If job_id is passed from dashboard, use it directly
      if (job_id) {
        try {
          sessionStorage.setItem(jobKey, String(job_id));
        } catch { }
        job_Data(job_id);
      } else {
        // Otherwise restore from sessionStorage
        const savedJobId = getSavedJobId();
        if (savedJobId && getSavedStep() >= 3) {
          job_Data(savedJobId);
        }
      }

      // restore syllabus detail on refresh if step >= 3
      if (state.courseData?.latest_syllabus?.id && getSavedStep() >= 3) {
        syllabus_detail(state.courseData.latest_syllabus.id);
      }
      console.log("syllabus_id →", state.courseData?.latest_syllabus?.id);


    }
  }, [course_id, job_id]);

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

  // Check if course has latest_syllabus.id - if yes, go to review/edit, if no, start AI extraction
  useEffect(() => {
    if (state.courseData && course_id && state.currentStep < 3) {
      console.log("courseData updated:", state.courseData);
      
      if (state.courseData?.latest_syllabus?.id) {
        // Syllabus already exists and we're still on upload step, go to review and edit
        console.log("Latest syllabus found:", state.courseData.latest_syllabus.id);
        
        // Stop any ongoing polling
        stopPolling();
        
        try {
          sessionStorage.setItem(syllabusKey, String(state.courseData.latest_syllabus.id));
        } catch { }
        setStep(3);
        syllabus_detail(state.courseData.latest_syllabus.id);
      }
    } else if (state.courseData && course_id && state.currentStep >= 3) {
      // On step 3 or 4, just stop polling if syllabus exists
      if (state.courseData?.latest_syllabus?.id) {
        stopPolling();
      }
    }
  }, [state.courseData, course_id, state.currentStep]);

  const course_data = async (id: string) => {
    try {
      const res = await Models.course.detail(id);
      setState({ courseData: res });
      console.log("course detail →", res);
    } catch (error) {
      console.log("error", error);
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
        // persist syllabus_id from the create response
        if (res?.syllabus_id) {
          try {
            sessionStorage.setItem(syllabusKey, String(res.syllabus_id));
          } catch { }
        }
        job_Data(res.job_id);
      }
    } catch (error) {
      console.log("error", error);
    }
  };

  const job_Data = async (id: string | number) => {
    // stop any existing poll before starting a new one
    stopPolling();
    setState({ isJobLoading: true });

    let retries = 0;
    const maxRetries = 30; // Max 30 retries (about 1.5 minutes with 3s interval)
    const pollInterval = 3000; // 3 seconds

    const fetchOnce = async () => {
      try {
        const res: any = await Models.job.detail(id);
        console.log("job_Data response:", res);
        setStep(3);

        const status = res?.status ?? res?.state?.live_redis_status;
        if (
          status === "complete" ||
          status === "completed" ||
          status === "failed"
        ) {
          // Save syllabus_id to sessionStorage for persistence
          if (res?.syllabus_id) {
            try {
              sessionStorage.setItem(syllabusKey, String(res.syllabus_id));
            } catch { }
          }
          setState({ isJobLoading: false });
          syllabus_detail(res?.result?.syllabus_id);
          stopPolling();
        } else {
          // Job still processing, continue polling
          console.log(`Job status: ${status}, continuing to poll...`);
        }
      } catch (error: any) {
        console.log("job_Data error:", error);
        
        // Check if error is "job not found" - this means job is not yet in queue
        const errorMsg = error?.message || error?.detail || String(error);
        const isJobNotFound = errorMsg.includes("not found");
        
        if (isJobNotFound && retries < maxRetries) {
          // Job not yet in queue, keep retrying
          console.log(`Job not found, retrying... (${retries + 1}/${maxRetries})`);
          retries++;
          // Continue polling in the interval
        } else if (retries >= maxRetries) {
          // Max retries reached
          console.log("Max retries reached for job polling");
          setState({ isJobLoading: false });
          stopPolling();
        } else {
          // Other error - stop polling
          setState({ isJobLoading: false });
          stopPolling();
        }
      }
    };

    // call immediately, then every 3 seconds
    await fetchOnce();
    pollRef.current = setInterval(fetchOnce, pollInterval);
  };

  const syllabus_detail = async (id: string | number) => {
    try {
      const res: any = await Models.syllabus.detail(id);
      console.log("syllabus_detail →", res);

      // Only load uploaded file if we have a syllabus_id and haven't loaded it yet
      if (res?.id && res?.id !== state.lastLoadedSyllabusId) {
        uploded_file(res?.id);
        setState({ lastLoadedSyllabusId: res?.id });
      }
      setState({ jobData: res });
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
    try {
      const res = await Models.syllabus.edit_unit_outcome(id, {
        co_code: co_code,
        description: description.trim(),
      });
      Success("Outcome updated");
      if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);
    } catch (error: any) {
      console.log("edit_unit_outcome error", error);
      throw error;
    }
  };

  const handleAcceptOutcome = async (id: number) => {
    try {
      const res = await Models.syllabus.accept_outcome(id);
      Success("Outcome accepted");
      if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);
    } catch (error: any) {
      console.log("accept_outcome error", error);
      throw error;
    }
  };

  const handleKnowledgeLevelChange = async (id: number, value: string) => {
    try {
      const res = await Models.syllabus.update_knw_level_outcome(id, {
        knowledge_level: value,
      });
      Success("Knowledge level updated");
      if (state.courseData?.latest_syllabus?.id) syllabus_detail(state.courseData.latest_syllabus.id);
    } catch (error: any) {
      console.log("edit_unit_outcome error", error);
      throw error;
    }
  };

  const syllabus_status = async () => {
    try {
      const body = {
        approval_status: "approved_by_bos",
      };

      const res: any = await Models.syllabus.status(state.courseData?.latest_syllabus?.id, body);
      console.log("syllabus_status →", res);
      setStep(4)
    } catch (error) {
      console.log("syllabus_detail error", error);
    }
  };
  console.log('✌️state.course_data --->', state.courseData);


  const handleSaveDraft = async () => {
    try {
      const body = {
        credits: state?.jobData?.credits,
        lecture_hours: state?.jobData?.lecture_hours,
        tutorial_hours: state?.jobData?.tutorial_hours,
        practical_hours: state?.jobData?.practical_hours,
        regulation: state?.jobData?.regulation,
        programme: state?.jobData?.programme,
      };

      const res: any = await Models.syllabus.update_syllabus(
        state.courseData?.latest_syllabus?.id,
        body
      );
      Success("Draft changes saved successfully.");
      console.log("syllabus_status →", res);
    } catch (error) {
      console.log("syllabus_detail error", error);
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
          <div className=" py-3 pt-2">
            <StepHeader
              title="Upload Syllabus"
              description="Upload the syllabus document for CS301— Computer Networks."
            />
            <SyllabusUpload
              onFileSelect={(file) => setState({ selectedFile: file })}
            />
            {state.showKeepFilePrompt !== false && (
              <KeepFilePrompt
                title="Keep the source syllabus file permanently?"
                subTitle=" Choose whether the uploaded source syllabus should be retained permanently."
                actionBtn1={{
                  label: "Yes, keep file",
                  onClick: onKeep,
                }}
                actionBtn2={{
                  label: "No, do not keep file",
                  onClick: onDiscard,
                }}
              />
            )}
            <NeuroAIInfo />
            <div className="mt-4 flex justify-end">
              <PrimaryButton
                type="button"
                text="Start AI Extraction"
                className="bg-color2 hover:bg-color2"
                icon={<Sparkles className="h-4 w-4" />}
                onClick={() => startAIExtraction()}
              />
            </div>
          </div>
        )}

        {state.currentStep === 3 && (
          <div className=" py-3 pt-2">
            {!state.showReview ? (
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
                <ReviewModeBar
                  onSaveDraft={() => handleSaveDraft()}
                  onContinue={() => {
                    syllabus_status()
                  }}
                />
                <div
                  className="grid gap-5"
                  style={{
                    height: "80vh",
                    overflow: "hidden",
                    gridTemplateColumns: "2fr 3fr",
                  }}
                >
                  <div className="min-h-0 overflow-hidden">
                    {state.pdfBlobUrl ? (
                      // Use iframe for blob URL or direct URL
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
                            ? `${(
                              state.selectedFile.size /
                              (1024 * 1024)
                            ).toFixed(1)} MB`
                            : ""
                        }
                      />
                    )}
                  </div>
                  <div className="min-h-0 overflow-hidden">
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
                      syllabusId={state.courseData?.latest_syllabus?.id}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {state.currentStep === 4 && (
          <div className=" py-3 pt-4">
            <SyllabusApprovedBanner
              courseCode={state.courseData?.course_code}
              onProceed={() => router.push(`/neurobe/co-po-mapping?course_id=${course_id}`)}
            />
            <SyllabusApprovedSummary
            data={state.courseData?.latest_syllabus}
              courseCode={state.courseData?.course_code}
              courseTitle={state.courseData?.
                course_title
              }
              theoryHours={Number(state.courseData?.total_theory_hours)}
              labHours={state.courseData?.
                total_lab_hours}
              credits={state.courseData?.credits}
              ltpc={`${state.courseData?.
                lecture_hours}-${state.courseData?.
                  tutorial_hours
                }-${state.courseData?.

                  practical_hours
                }-${state.courseData?.

                  credits
                }
                
`}
              onRevise={() => {
                setStep(3);

                setState({ showReview: true });
              }}
              onProceed={() => router.push(`/neurobe/co-po-mapping?course_id=${course_id}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateRouter(Syllabus);
