import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";
import PageBanner from "@/components/common-components/PageBanner";
import IconSearch from "@/components/Icon/IconSearch";
import { BookOpen, RefreshCw, AlertCircle, HelpCircle } from "lucide-react";
import useCoordinatorCourses, { CoordinatorCourse } from "@/hook/useCoordinatorCourses";
import CoordinatorCourseCard from "@/components/question-bank/CoordinatorCourseCard";

const QuestionBankCoursesPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const {
    courses,
    loading,
    search,
    setSearch,
    selectedSemester,
    setSelectedSemester,
    error,
    refresh,
  } = useCoordinatorCourses();

  useEffect(() => {
    dispatch(setPageTitle("Question Bank — Coordinator Courses"));
  }, [dispatch]);

  const handleSelectCourse = (course: CoordinatorCourse) => {
    const courseId = course.id;
    const courseCode = course.course_code || course.code || "";
    const courseTitle = course.course_title || course.title || "";
    router.push({
      pathname: `/neurobe/question-bank/${courseId}`,
      query: {
        code: courseCode,
        title: courseTitle,
      },
    });
  };

  const semesterOptions = [
    { label: "All Semesters", value: "all" },
    { label: "Semester 1", value: "1" },
    { label: "Semester 2", value: "2" },
    { label: "Semester 3", value: "3" },
    { label: "Semester 4", value: "4" },
    { label: "Semester 5", value: "5" },
    { label: "Semester 6", value: "6" },
    { label: "Semester 7", value: "7" },
    { label: "Semester 8", value: "8" },
  ];

  return (
    <div className="min-h-screen pb-16">
      {/* Top Banner */}
      <PageBanner
        title="Question Bank & Assessments"
        description="Course Coordinator Assessment Workspace — Select an assigned course to configure Question Banks, Blueprint Templates, and create Continuous Internal Assessment (CIA) tests distributed across multiple sections."
        icon={<BookOpen className="h-6 w-6 text-white" />}
      />

      <div className="pt-6">
        {/* Filter & Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by course code, title, or programme..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-purple-500 focus:bg-white focus:outline-none dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Semester Selector & Refresh */}
          <div className="flex items-center gap-3">
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-gray-700 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {semesterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={refresh}
              disabled={loading}
              title="Refresh courses"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content State: Loading, Empty, or Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex justify-between mb-4">
                  <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-2" />
                <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700 mb-6" />
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700/60" />
                  <div className="h-12 rounded-xl bg-gray-100 dark:bg-gray-700/60" />
                </div>
                <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              No Assigned Courses Found
            </h3>
            <p className="max-w-md text-sm text-gray-500 dark:text-gray-400 mb-6">
              {search
                ? `No courses match your search query "${search}". Try clearing your search or selecting a different semester.`
                : "You do not have any courses assigned under your Course Coordinator role for the selected filters."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CoordinatorCourseCard
                key={course.id}
                course={course}
                onSelect={handleSelectCourse}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateRouter(QuestionBankCoursesPage);
