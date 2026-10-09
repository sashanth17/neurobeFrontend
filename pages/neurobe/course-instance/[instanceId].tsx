import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import ExtractionTab from "@/components/mark-extraction/ExtractionTab";
import ExtractedViewTab from "@/components/mark-extraction/ExtractedViewTab";
import ResultPageTab from "@/components/mark-extraction/ResultPageTab";
import AssignmentUploadTab from "@/components/mark-extraction/AssignmentUploadTab";
import { MarkExtractionService, CiaTestStatus } from "@/services/markExtraction.service";
import CourseAttainmentReport from "@/components/academic-setup/CourseAttainmentReport";
import InstanceMCQExecutionTab from "@/components/academic-setup/InstanceMCQExecutionTab";

// Tabs that do NOT need a CIA test selected to render
const CIA_INDEPENDENT_TABS = new Set(["mcq-test-execution", "assignment-upload", "co-po-attainment"]);

const TABS = [
  { id: "mcq-test-execution", label: "MCQ Test Execution" },
  { id: "extraction", label: "Extraction" },
  { id: "extracted-view", label: "Extracted View" },
  { id: "result", label: "Result Page" },
  { id: "assignment-upload", label: "Upload Assignments" },
  { id: "co-po-attainment", label: "CO/PO Attainment" },
];

function InstanceDashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { courseId, instanceId, tab: queryTab } = router.query;

  const [activeTab, setActiveTab] = useState((queryTab as string) || "mcq-test-execution");

  useEffect(() => {
    if (queryTab && typeof queryTab === "string") {
      setActiveTab(queryTab);
    }
  }, [queryTab]);
  const [ciaTests, setCiaTests] = useState<CiaTestStatus[]>([]);
  const [selectedCiaTest, setSelectedCiaTest] = useState<CiaTestStatus | null>(null);
  const [loadingTests, setLoadingTests] = useState(true);

  useEffect(() => {
    dispatch(setPageTitle("Instance Dashboard"));
  }, [dispatch]);

  const fetchCiaTests = useCallback(async (silent = false) => {
    if (!instanceId) return;
    if (!silent) setLoadingTests(true);
    try {
      const tests = await MarkExtractionService.getCiaTestsStatus(instanceId as string);
      setCiaTests(tests ?? []);
      if (tests && tests.length > 0) {
        setSelectedCiaTest((prev) => {
          if (!prev) return tests[0];
          const matched = tests.find((t) => t.cia_test_id === prev.cia_test_id);
          return matched || tests[0];
        });
      }
    } catch (err) {
      console.error("Failed to fetch CIA tests", err);
    } finally {
      if (!silent) setLoadingTests(false);
    }
  }, [instanceId]);

  useEffect(() => {
    fetchCiaTests(false);
  }, [fetchCiaTests]);

  const handleCiaTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = ciaTests.find((t) => String(t.cia_test_id) === e.target.value);
    if (found) setSelectedCiaTest(found);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "PROCESSING": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "FAILED": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  // Whether the current tab needs a CIA test to be selected
  const isCiaIndependent = CIA_INDEPENDENT_TABS.has(activeTab);

  return (
    <div
      className={`flex flex-col bg-gray-50 dark:bg-gray-900 ${activeTab === "co-po-attainment"
        ? "min-h-full"
        : "h-[calc(100vh-80px)] overflow-hidden"
        }`}
    >

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.push(`/neurobe/course-offering`)}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Mark Extraction / Course {courseId} / Instance {instanceId}
            </p>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
              Instance Dashboard
            </h1>
          </div>
        </div>

        {/* CIA Test Selector + Tab Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                  ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Assessment selector — hidden for CIA-independent tabs */}
          {!isCiaIndependent && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Assessment:
              </label>
              {loadingTests ? (
                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              ) : (
                <select
                  className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                  value={selectedCiaTest?.cia_test_id ?? ""}
                  onChange={handleCiaTestChange}
                >
                  {ciaTests.map((t) => (
                    <option key={t.cia_test_id} value={t.cia_test_id}>
                      {t.test_name}
                      {t.job_status ? ` — ${t.job_status === "COMPLETED" ? "✓ Extracted" : t.job_status === "PROCESSING" ? "⟳ Processing" : "Pending"}` : ""}
                    </option>
                  ))}
                </select>
              )}
              {selectedCiaTest?.job_status && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getStatusBadgeClass(selectedCiaTest.job_status)}`}>
                  {selectedCiaTest.job_status}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────────────────────── */}
      <div className={`p-6 ${activeTab === "co-po-attainment" ? "flex-1" : "flex-1 overflow-hidden"}`}>

        {/* MCQ Test Execution — renders independently for this course instance */}
        {activeTab === "mcq-test-execution" && (
          <div className="h-full">
            <InstanceMCQExecutionTab
              instanceId={instanceId as string}
              courseId={courseId as string}
            />
          </div>
        )}

        {/* CO/PO Attainment — renders independently, single unified scroll */}
        {activeTab === "co-po-attainment" && (
          <div className="w-full">
            <CourseAttainmentReport
              courseId={courseId as string}
              offeringId={instanceId as string}
              courseMetadata={{}}
            />
          </div>
        )}

        {/* Assignment Upload — renders independently, no CIA test needed */}
        {activeTab === "assignment-upload" && (
          <div className="h-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
            <AssignmentUploadTab
              instanceId={instanceId as string}
              courseId={courseId as string}
            />
          </div>
        )}

        {/* CIA-dependent tabs */}
        {!isCiaIndependent && (
          loadingTests ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Loader2 className="h-8 w-8 animate-spin mb-3 text-violet-500" />
              <p className="text-sm">Loading CIA tests...</p>
            </div>
          ) : !selectedCiaTest ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <BookOpen className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
              <p className="font-medium">No CIA Tests found</p>
              <p className="text-sm mt-1">This instance has no configured CIA tests yet</p>
            </div>
          ) : (
            <div className="h-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
              {activeTab === "extraction" && (
                <ExtractionTab
                  key={`extraction-${selectedCiaTest.cia_test_id}`}
                  ciaTestId={selectedCiaTest.cia_test_id}
                  initialStatus={selectedCiaTest.job_status}
                  initialJobId={selectedCiaTest.latest_job_id}
                  onGoToExtractedView={() => setActiveTab("extracted-view")}
                  onRefreshCiaTests={fetchCiaTests}
                />
              )}
              {activeTab === "extracted-view" && (
                <ExtractedViewTab
                  key={`extracted-view-${selectedCiaTest.cia_test_id}`}
                  ciaTestId={selectedCiaTest.cia_test_id}
                  instanceId={instanceId as string}
                  onGoToExtraction={() => setActiveTab("extraction")}
                  onRefreshCiaTests={fetchCiaTests}
                />
              )}
              {activeTab === "result" && (
                <ResultPageTab
                  key={`result-${selectedCiaTest.cia_test_id}`}
                  ciaTestId={selectedCiaTest.cia_test_id}
                  instanceId={instanceId as string}
                  onGoToExtractedView={() => setActiveTab("extracted-view")}
                  onRefreshCiaTests={fetchCiaTests}
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default PrivateRouter(InstanceDashboardPage);
