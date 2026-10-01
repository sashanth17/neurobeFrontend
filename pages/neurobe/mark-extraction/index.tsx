import { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import { Search, LayoutGrid, List, BookOpen, ChevronRight, Loader2 } from "lucide-react";
import Models from "@/imports/models.import";

function CourseSelectionPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [viewType, setViewType] = useState<"card" | "list">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(setPageTitle("Mark Extraction"));
    fetchCourses();
  }, [dispatch]);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const res: any = await Models.course.faculty_dashboard_overview({
        faculty_id: user?.id,
      });
      // faculty_dashboard_overview resolves res.data directly, so res is the payload
      const list = res?.courses ?? (Array.isArray(res) ? res : []);
      setCourses(list);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = courses.filter((c) =>
    `${c.course_name ?? ""} ${c.course_code ?? ""}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mark Extraction</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Select a course to manage answer-sheet extraction
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses..."
              className="pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 w-56"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>

          {/* View Toggle */}
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              title="Card View"
              className={`px-3 py-2 transition ${viewType === "card" ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              onClick={() => setViewType("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              title="List View"
              className={`px-3 py-2 transition ${viewType === "list" ? "bg-violet-600 text-white" : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
              onClick={() => setViewType("list")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-violet-500" />
          <p className="text-sm">Loading your courses...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500">
          <BookOpen className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
          <p className="font-medium">No courses found</p>
          <p className="text-sm mt-1">{searchQuery ? "Try a different search term" : "You have no assigned courses"}</p>
        </div>
      ) : viewType === "card" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((course, idx) => (
            <div
              key={course.course_id ?? course.id ?? idx}
              className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:border-violet-400 dark:hover:border-violet-500 hover:shadow-lg hover:shadow-violet-100 dark:hover:shadow-violet-900/20 transition-all duration-200"
              onClick={() => router.push(`/neurobe/mark-extraction/${course.course_id ?? course.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-semibold bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full">
                  {course.course_code ?? "—"}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-violet-500 transition-colors" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-3">
                {course.course_name ?? "Untitled Course"}
              </h3>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
                <span>{course.semester_name ?? course.semester ?? "—"}</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {course.total_instances ?? 0} instances
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                {["Course Code", "Course Name", "Semester", "Instances"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((course, idx) => (
                <tr
                  key={course.course_id ?? course.id ?? idx}
                  className="hover:bg-violet-50 dark:hover:bg-violet-900/10 cursor-pointer transition-colors"
                  onClick={() => router.push(`/neurobe/mark-extraction/${course.course_id ?? course.id}`)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-violet-700 dark:text-violet-400">{course.course_code ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-800 dark:text-white">{course.course_name ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{course.semester_name ?? course.semester ?? "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{course.total_instances ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PrivateRouter(CourseSelectionPage);
