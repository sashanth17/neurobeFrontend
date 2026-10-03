import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import { ArrowLeft, Users, FileText, CheckCircle, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { MarkExtractionService } from "@/services/markExtraction.service";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  COMPLETED:   { label: "Completed",   cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  IN_PROGRESS: { label: "In Progress", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  PENDING:     { label: "Pending",     cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

function CourseInstancesPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { courseId } = router.query;

  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    dispatch(setPageTitle("Course Instances"));
  }, [dispatch]);

  const fetchInstances = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await MarkExtractionService.getCourseInstancesSummary(courseId as string);
      setInstances(data ?? []);
    } catch (err: any) {
      console.error("Failed to fetch course instances summary", err);
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to load instances");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breadcrumb + Title */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push("/neurobe/mark-extraction")}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Mark Extraction / Course {courseId}
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">Course Instances</h1>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-violet-500" />
          <p className="text-sm">Loading instances...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 text-red-500">
          <AlertCircle className="h-10 w-10 mb-3" />
          <p className="font-medium">Could not load instances</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
          <button onClick={fetchInstances} className="mt-4 px-5 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition">Retry</button>
        </div>
      ) : instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500">
          <FileText className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
          <p className="font-medium">No instances found</p>
          <p className="text-sm mt-1">This course has no instances yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {instances.map((inst, idx) => {
            const statusKey = inst.overall_extraction_status ?? "PENDING";
            const badge = STATUS_CONFIG[statusKey] ?? { label: statusKey, cls: "bg-gray-100 text-gray-700" };
            const completed = inst.completion_rate?.completed ?? 0;
            const total     = inst.completion_rate?.total ?? 0;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div
                key={inst.instance_id ?? idx}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-lg hover:shadow-violet-100 dark:hover:shadow-violet-900/20 transition-all duration-200"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-5">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {inst.instance_name ?? `Instance ${idx + 1}`}
                  </h3>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="flex flex-col items-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <Users className="h-4 w-4 text-blue-500 mb-1" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{inst.total_enrolled_students ?? 0}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Students</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                    <FileText className="h-4 w-4 text-purple-500 mb-1" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{inst.total_cia_tests ?? 0}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">CIA Tests</span>
                  </div>
                  <div className="flex flex-col items-center p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-500 mb-1" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{completed}/{total}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Extracted</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>Extraction Progress</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() =>
                    router.push(`/neurobe/mark-extraction/${courseId}/instances/${inst.instance_id}`)
                  }
                  className="mt-auto w-full py-2.5 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Manage Extraction
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PrivateRouter(CourseInstancesPage);
