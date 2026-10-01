import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import { ArrowLeft, Loader2, Search, Users, FileText, BookOpen } from "lucide-react";
import ExtractionTab from "@/components/mark-extraction/ExtractionTab";
import ExtractedViewTab from "@/components/mark-extraction/ExtractedViewTab";
import ResultPageTab from "@/components/mark-extraction/ResultPageTab";
import { MarkExtractionService, CiaTestStatus } from "@/services/markExtraction.service";

const TABS = [
  { id: "extraction",     label: "Extraction" },
  { id: "extracted-view", label: "Extracted View" },
  { id: "result",         label: "Result Page" },
  { id: "students",       label: "Student List" },
];

function InstanceDashboardPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { courseId, instanceId } = router.query;

  const [activeTab,        setActiveTab]        = useState("extraction");
  const [ciaTests,         setCiaTests]         = useState<CiaTestStatus[]>([]);
  const [selectedCiaTest,  setSelectedCiaTest]  = useState<CiaTestStatus | null>(null);
  const [loadingTests,     setLoadingTests]     = useState(true);

  useEffect(() => {
    dispatch(setPageTitle("Instance Dashboard"));
  }, [dispatch]);

  const fetchCiaTests = useCallback(async () => {
    if (!instanceId) return;
    setLoadingTests(true);
    try {
      const tests = await MarkExtractionService.getCiaTestsStatus(instanceId as string);
      setCiaTests(tests ?? []);
      if (tests && tests.length > 0) setSelectedCiaTest(tests[0]);
    } catch (err) {
      console.error("Failed to fetch CIA tests", err);
    } finally {
      setLoadingTests(false);
    }
  }, [instanceId]);

  useEffect(() => {
    fetchCiaTests();
  }, [fetchCiaTests]);

  const handleCiaTestChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const found = ciaTests.find((t) => String(t.cia_test_id) === e.target.value);
    if (found) setSelectedCiaTest(found);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "COMPLETED":   return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "PROCESSING":  return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "FAILED":      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:            return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => router.push(`/neurobe/mark-extraction/${courseId}`)}
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
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Assessment selector */}
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
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden p-6">
        {loadingTests ? (
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
            {activeTab === "extraction"     && (
              <ExtractionTab
                ciaTestId={selectedCiaTest.cia_test_id}
                initialStatus={selectedCiaTest.job_status}
                initialJobId={selectedCiaTest.latest_job_id}
                onGoToExtractedView={() => setActiveTab("extracted-view")}
              />
            )}
            {activeTab === "extracted-view" && (
              <ExtractedViewTab 
                ciaTestId={selectedCiaTest.cia_test_id} 
                instanceId={instanceId as string}
                onGoToExtraction={() => setActiveTab("extraction")}
              />
            )}
            {activeTab === "result"         && <ResultPageTab    ciaTestId={selectedCiaTest.cia_test_id} />}
            {activeTab === "students"       && <StudentListTab   instanceId={instanceId as string} />}
          </div>
        )}
      </div>
    </div>
  );
}

export default PrivateRouter(InstanceDashboardPage);

// ─────────────────────────────────────────────────────────────────────────────
// StudentListTab  — Tab 4
// ─────────────────────────────────────────────────────────────────────────────
function StudentListTab({ instanceId }: { instanceId: string }) {
  const [students,  setStudents]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [searchQ,   setSearchQ]   = useState("");

  useEffect(() => {
    if (!instanceId) return;
    setLoading(true);
    // Fetch enrolled students for this instance
    import("@/utils/axios.utils").then(({ default: instance }) => {
      instance()
        .get(`course-enrollments/?course_instance_id=${instanceId}`)
        .then((res: any) => {
          const list = Array.isArray(res.data) ? res.data : (res.data?.results ?? res.data?.data ?? []);
          setStudents(list);
        })
        .catch((err: any) => console.error("Failed to fetch students", err))
        .finally(() => setLoading(false));
    });
  }, [instanceId]);

  const filtered = students.filter((s) =>
    `${s.student_name ?? ""} ${s.register_number ?? ""}`.toLowerCase().includes(searchQ.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Enrolled Students</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {loading ? "Loading..." : `${students.length} students enrolled`}
          </p>
        </div>
        <div className="relative w-60">
          <input
            type="text"
            placeholder="Search by name or reg no..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Register No</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-500">
                    {searchQ ? "No students match your search" : "No student data available"}
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <tr key={s.student_id ?? i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-400">{i + 1}</td>
                    <td className="px-6 py-3 text-sm font-medium text-violet-700 dark:text-violet-400">
                      {s.register_number ?? "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-800 dark:text-white">
                      {s.student_name ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
