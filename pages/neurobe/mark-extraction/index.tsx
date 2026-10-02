import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import {
  Search,
  LayoutGrid,
  List,
  BookOpen,
  ChevronRight,
  Loader2,
  Sparkles,
  Users,
  Layers,
  FileText,
  ScanLine,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  X,
  FileCheck,
  Bot,
  Zap,
} from "lucide-react";
import Models from "@/imports/models.import";
import { MarkExtractionService, ExtractionSummary } from "@/services/markExtraction.service";
import CourseExtractionCard from "@/components/mark-extraction/CourseExtractionCard";

function CourseSelectionPage() {
  const dispatch = useDispatch();
  const router = useRouter();

  const [viewType, setViewType] = useState<"card" | "list">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSemester, setSelectedSemester] = useState<string>("all");
  const [courses, setCourses] = useState<any[]>([]);
  const [instancesMap, setInstancesMap] = useState<Record<string | number, ExtractionSummary[]>>({});
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
      const userId = user?.id || 1;

      const res: any = await Models.course.faculty_dashboard_overview({
        faculty_id: userId,
        coordinator_id: userId,
      });

      // faculty_dashboard_overview resolves res.data directly, so res is the payload
      const list = res?.courses ?? res?.data ?? (Array.isArray(res) ? res : []);
      const courseList = Array.isArray(list) ? list : [];
      setCourses(courseList);

      // Asynchronously enrich with live extraction summary per course
      fetchInstancesData(courseList);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInstancesData = async (courseList: any[]) => {
    const map: Record<string | number, ExtractionSummary[]> = {};
    await Promise.allSettled(
      courseList.map(async (c) => {
        const cid = c.id ?? c.course_id;
        if (!cid) return;
        try {
          const summaries = await MarkExtractionService.getCourseInstancesSummary(cid);
          if (Array.isArray(summaries)) {
            map[cid] = summaries;
          }
        } catch {
          // graceful fallback
        }
      })
    );
    setInstancesMap(map);
  };

  // Extract unique semesters
  const availableSemesters = useMemo(() => {
    const sems = new Set<string>();
    courses.forEach((c) => {
      const sem = c.semester_name || c.semester || c.term;
      if (sem) sems.add(String(sem));
    });
    return Array.from(sems);
  }, [courses]);

  // Filtered course list
  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const code = (c.course_code || c.code || "").toLowerCase();
      const title = (
        c.course_title ||
        c.course_name ||
        c.title ||
        c.name ||
        ""
      ).toLowerCase();
      const dept = (
        c.department_name ||
        c.department ||
        c.programme ||
        c.degree ||
        ""
      ).toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q || code.includes(q) || title.includes(q) || dept.includes(q);

      const sem = String(c.semester_name || c.semester || c.term || "");
      const matchesSem = selectedSemester === "all" || sem === selectedSemester;

      return matchesSearch && matchesSem;
    });
  }, [courses, searchQuery, selectedSemester]);

  // Summary statistics across courses
  const stats = useMemo(() => {
    const totalCourses = courses.length;

    let totalInstances = 0;
    let totalStudents = 0;

    courses.forEach((c) => {
      const cid = c.id ?? c.course_id;
      const summaries = instancesMap[cid];
      if (summaries && summaries.length > 0) {
        totalInstances += summaries.length;
        totalStudents += summaries.reduce(
          (sum, s) => sum + (s.total_enrolled_students || 0),
          0
        );
      } else {
        totalInstances +=
          c.sections_count ||
          c.instances_count ||
          c.total_instances ||
          c.total_sections ||
          1;
        totalStudents +=
          c.students_count ||
          c.enrolled_students ||
          c.enrolled_students_count ||
          c.total_students ||
          0;
      }
    });

    return {
      totalCourses,
      totalInstances,
      totalStudents,
    };
  }, [courses, instancesMap]);

  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#f8fafc] dark:bg-gray-900 transition-colors">
      {/* Page Header with Hero Banner */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold tracking-wider uppercase text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/60 px-2.5 py-0.5 rounded-md">
                Assessment & Evaluation
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI OCR Vision Engine Active
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Mark Extraction & OCR Evaluation
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Select an assigned course to manage student physical answer sheets, run AI automated mark extraction, and verify marks.
            </p>
          </div>

          {/* Quick Engine Status Pill */}
          <div className="hidden sm:flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 shadow-xs">
            <div className="h-9 w-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 flex items-center justify-center">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Automated Rubric OCR
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                CIA 1, CIA 2 & Model Exams
              </p>
            </div>
          </div>
        </div>

        {/* Quick Overview Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Assigned Courses
              </p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {stats.totalCourses} {stats.totalCourses === 1 ? "Course" : "Courses"}
              </h4>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Class Sections
              </p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {stats.totalInstances} {stats.totalInstances === 1 ? "Section" : "Sections"}
              </h4>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Total Students
              </p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                {stats.totalStudents} Enrolled
              </h4>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Scanning Pipeline
              </p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                PDF Batch Ready
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Search, and View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-white dark:bg-gray-800 p-3.5 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs">
        {/* Semester Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedSemester("all")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              selectedSemester === "all"
                ? "bg-violet-600 text-white shadow-xs"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            All Courses ({courses.length})
          </button>
          {availableSemesters.map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                selectedSemester === sem
                  ? "bg-violet-600 text-white shadow-xs"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Semester {sem}
            </button>
          ))}
        </div>

        {/* Right Tools: Search & Grid/List View */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search code, title, or dept..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/70 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-gray-900 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-0.5 bg-gray-50 dark:bg-gray-900/50">
            <button
              title="Card View"
              className={`p-1.5 rounded-lg transition-all ${
                viewType === "card"
                  ? "bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-xs"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
              onClick={() => setViewType("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              title="List View"
              className={`p-1.5 rounded-lg transition-all ${
                viewType === "list"
                  ? "bg-white dark:bg-gray-800 text-violet-600 dark:text-violet-400 shadow-xs"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              }`}
              onClick={() => setViewType("list")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Course Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Loader2 className="h-9 w-9 animate-spin mb-3 text-violet-600" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Loading your assigned courses...
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Fetching course instances & extraction statuses
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center mb-4 text-gray-400">
            <BookOpen className="h-8 w-8" />
          </div>
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
            No courses found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
            {searchQuery
              ? `No courses matching "${searchQuery}". Try clearing the search or checking semester filters.`
              : "No courses currently assigned to your faculty profile."}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSemester("all");
              }}
              className="mt-4 px-4 py-2 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 rounded-xl text-xs font-bold hover:bg-violet-100 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewType === "card" ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filtered.map((course, idx) => {
            const courseId = course.id ?? course.course_id;
            return (
              <CourseExtractionCard
                key={courseId ?? idx}
                course={course}
                index={idx}
                instancesSummary={instancesMap[courseId]}
                onSelect={(c) => router.push(`/neurobe/mark-extraction/${courseId}`)}
              />
            );
          })}
        </div>
      ) : (
        /* List View Table */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-left">
              <thead className="bg-gray-50/80 dark:bg-gray-900/60 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Course Info</th>
                  <th className="px-6 py-4">Department / Programme</th>
                  <th className="px-6 py-4">Semester</th>
                  <th className="px-6 py-4 text-center">Sections</th>
                  <th className="px-6 py-4 text-center">Students</th>
                  <th className="px-6 py-4">Extraction Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {filtered.map((course, idx) => {
                  const courseId = course.id ?? course.course_id;
                  const summaries = instancesMap[courseId];
                  const code = course.course_code || course.code || "COURSE";
                  const title =
                    course.course_title ||
                    course.course_name ||
                    course.title ||
                    course.name ||
                    (code === "TOC02"
                      ? "Theory of Computation"
                      : code === "ML123"
                      ? "Machine Learning"
                      : "Academic Course");
                  const dept =
                    course.department_name ||
                    course.department ||
                    course.programme ||
                    course.degree ||
                    "Computer Science";
                  const sem =
                    course.semester_name || course.semester || course.term || "1";
                  const instCount =
                    summaries && summaries.length > 0
                      ? summaries.length
                      : course.sections_count ||
                        course.instances_count ||
                        course.total_instances ||
                        1;
                  const students =
                    summaries && summaries.length > 0
                      ? summaries.reduce(
                          (sum, s) => sum + (s.total_enrolled_students || 0),
                          0
                        )
                      : course.students_count ||
                        course.enrolled_students ||
                        60;

                  return (
                    <tr
                      key={courseId ?? idx}
                      className="hover:bg-violet-50/40 dark:hover:bg-violet-950/20 cursor-pointer transition-colors group"
                      onClick={() =>
                        router.push(`/neurobe/mark-extraction/${courseId}`)
                      }
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded-md">
                            {code}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 transition-colors">
                            {title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                        {dept}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                        Semester {sem}
                      </td>
                      <td className="px-6 py-4 text-xs text-center font-semibold text-gray-700 dark:text-gray-300">
                        {instCount}
                      </td>
                      <td className="px-6 py-4 text-xs text-center font-semibold text-gray-700 dark:text-gray-300">
                        {students}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                          <Sparkles className="h-3 w-3 text-violet-500" />
                          Ready for Extraction
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/neurobe/mark-extraction/${courseId}`);
                          }}
                        >
                          <span>Manage</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* How AI Mark Extraction Works Section */}
      <div className="mt-12 rounded-3xl bg-gradient-to-br from-white via-violet-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-gray-800/90 dark:to-gray-800/80 border border-violet-100 dark:border-violet-900/30 p-6 md:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-violet-600 text-white">
            <Zap className="h-4 w-4" />
          </span>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            How Mark Extraction Works
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">
          Neurobe utilizes advanced Vision OCR and AI handwriting evaluation to scan student answer booklets, match roll numbers, and extract marks question-by-question.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex gap-3.5 items-start p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
            <div className="h-8 w-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 flex items-center justify-center font-bold text-xs shrink-0">
              1
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                Select Course & Offering
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Choose your course above and select the specific class instance or section conducting CIA assessments.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
            <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
              2
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                Upload Scanned PDF Batches
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Upload scanned physical answer sheets (up to 60 pages per batch). Neurobe automatically arranges and splits student papers.
              </p>
            </div>
          </div>

          <div className="flex gap-3.5 items-start p-4 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
              3
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1">
                AI Extraction & 1-Click Verification
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                Review detected student registration numbers, inspect question-by-question marks, and confirm verified results to the gradebook.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivateRouter(CourseSelectionPage);
