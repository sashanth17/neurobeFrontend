import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import PrivateRouter from "@/hook/privateRouter";
import AssignedCourseCard from "@/components/academic-setup/AssignedCourseCard";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import { useRouter } from "next/router";
import useDebounce from "@/hook/useDebounce";
import Models from "@/imports/models.import";

const MyAssignedCourses = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    search: "",
    statusFilter: "all",
    programmeFilter: "all",
    loading: false,
    type: "all_semester",
    data: null as any,
  });

  const debouncedSearch = useDebounce(state.search, 500);

  useEffect(() => {
    dispatch(setPageTitle("My Assigned Courses — Instructor View"));
  }, [dispatch]);

  useEffect(() => {
    dashboard_view();
  }, []);

  useEffect(() => {
    if (state.type !== "all_semester") {
      dashboard_view(state.type?.id || state.type);
    }
  }, [state.type]);

  useEffect(() => {
    dashboard_view(state.type?.id || state.type, debouncedSearch);
  }, [debouncedSearch]);

  const dashboard_view = async (semesterId?: any, searchQuery?: string) => {
    try {
      setState({ loading: true });
      const user = localStorage.getItem("user");
      const u = user ? JSON.parse(user) : null;
      const body = {
        faculty_id: u?.id || 1,
        coordinator_id: u?.id || 1,
        ...(semesterId &&
          semesterId !== "all_semester" && {
            semester:
              typeof semesterId === "object"
                ? semesterId.id || semesterId.semester
                : semesterId,
          }),
        ...(searchQuery && { search: searchQuery }),
      };
      const res: any = await Models.course.faculty_dashboard_overview(body);
      setState({ data: res, loading: false });
    } catch (error) {
      console.error("Error fetching faculty dashboard overview:", error);
      setState({ loading: false });
    }
  };

  const onAction = (card: any) => {
    const courseId = card.id || card.course_id;
    const courseCode = card.course_code || card.code || "";
    router.push(`/neurobe/ins-course-artifacts?course_id=${courseId}&code=${courseCode}`);
  };

  const rawCourses = state.data?.courses || [];
  const filteredCourses = rawCourses.filter((c: any) => {
    const s = state.search.toLowerCase();
    const code = (c.course_code || c.code || "").toLowerCase();
    const title = (c.course_title || c.title || "").toLowerCase();
    const prog = (c.programme || "").toLowerCase();
    const matchSearch = !s || code.includes(s) || title.includes(s) || prog.includes(s);
    return matchSearch;
  });

  const firstCourse = filteredCourses[0] || rawCourses[0];

  return (
    <div className="min-h-screen">
      <CourseBanner
        courseCode={firstCourse?.course_code || firstCourse?.code || "Courses"}
        courseTitle={firstCourse?.course_title || firstCourse?.title || "My Assigned Courses"}
        description="Instructor View — Access academic course artifacts, approved syllabus, outcomes mapping, topic hierarchy, pedagogy, and lesson plans."
        programme={firstCourse?.programme || "B.Tech"}
        batch={firstCourse?.batch_name || firstCourse?.batch || "Active Academic Year"}
        academicYear={firstCourse?.academic_year || firstCourse?.term || "Active Term"}
        students={`${state.data?.summary?.total_students ?? state.data?.summary?.enrolled_students_count ?? firstCourse?.students_count ?? 0} Students`}
        selectedCourse={firstCourse?.course_code || firstCourse?.code}
        courseOptions={rawCourses.map((c: any) => ({
          value: String(c.id),
          label: `${c.course_code || c.code} — ${c.course_title || c.title}`,
        }))}
        toogle="instructor"
        onCourseChange={(val) => {
          const targetId = typeof val === "object" ? val?.value : val;
          const selected = rawCourses.find((c: any) => String(c.id) === String(targetId));
          if (selected) {
            router.push(
              `/neurobe/ins-course-artifacts?course_id=${selected.id}&code=${selected.course_code || selected.code}`
            );
          }
        }}
        activeView="instructor"
        onBack={() => router.push("/neurobe/my-assigned-courses")}
        onViewChange={(view) => {
          if (view === "coordinator") {
            router.push("/neurobe/my-assigned-courses");
          }
        }}
      />

      {/* Header bar above filters & cards */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-wider text-pri">
          ASSIGNED TEACHING COURSES ({filteredCourses.length})
        </h4>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-sm font-semibold text-pink-600 dark:bg-pink-900/20 dark:text-pink-300">
          <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
          Active Semester
        </span>
      </div>

      {/* Search & Semester Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-[300px] flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-[#000]">
            <IconSearch className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by code, title..."
            value={state.search}
            onChange={(e) => setState({ search: e.target.value })}
            className="border-input w-full rounded-lg border bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-[#7c3aed] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {state.data?.semesters && state.data.semesters.length > 0 && (
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">Semester : </p>
            <div className="bg-sec-dark flex shrink-0 items-center gap-2 rounded-lg px-1 py-1">
              <button
                onClick={() => {
                  setState({ type: "all_semester" });
                  dashboard_view();
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  state.type === "all_semester"
                    ? "text-color2 rounded-lg bg-[#fff] shadow-sm"
                    : "hover:text-pri text-[#000] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                All Semesters
              </button>
              {state.data.semesters.map((sem: any) => {
                const semVal = typeof sem === "object" ? sem.id || sem.semester : sem;
                const semDisplay = typeof sem === "object" ? sem.semester || sem.name || sem.id : sem;
                const isSelected =
                  state.type === sem || state.type?.id === semVal || state.type === semVal;
                return (
                  <button
                    key={semVal}
                    onClick={() => setState({ type: semVal })}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? "text-color2 rounded-lg bg-[#fff] shadow-sm"
                        : "hover:text-pri text-[#000] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    Semester {semDisplay}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Course Cards Grid */}
      <div>
        {state.loading && rawCourses.length === 0 ? (
          <div className="flex justify-center py-16 text-sm text-gray-500">
            Loading assigned courses...
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
            No teaching courses found matching your criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((card: any) => (
              <AssignedCourseCard
                key={card.id || card.course_code || card.code}
                id={card.id}
                courseId={card.id}
                code={card.course_code || card.code}
                courseCode={card.course_code || card.code}
                title={card.course_title || card.title}
                courseTitle={card.course_title || card.title}
                programme={card.programme || "B.Tech"}
                batch={card.batch_name || card.batch || "2025–2029"}
                semester={card.semester || card.term || "1"}
                enrolledStudents={
                  card.students_count || card.enrolled_students || card.enrolled_students_count || 0
                }
                allocation={card.allocation || "Primary Allocation"}
                onOpenCourse={() => onAction(card)}
                onTriggerStage={(stageKey) => {
                  const courseId = card.id || card.course_id;
                  const courseCode = card.course_code || card.code || "";
                  if (stageKey === "extraction") {
                    router.push(`/neurobe/syllabus?course_id=${courseId}&code=${courseCode}`);
                  } else {
                    router.push(
                      `/neurobe/ins-course-artifacts?course_id=${courseId}&code=${courseCode}&stage=${stageKey}`
                    );
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivateRouter(MyAssignedCourses);
