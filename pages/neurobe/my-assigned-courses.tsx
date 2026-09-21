import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import PageBanner from "@/components/common-components/PageBanner";
import PrivateRouter from "@/hook/privateRouter";
import useDebounce from "@/hook/useDebounce";
import CourseCard from "@/components/academic-setup/CourseCard";
import AssignedCourseCard from "@/components/academic-setup/AssignedCourseCard";
import Models from "@/imports/models.import";
import { useRouter } from "next/router";

const MyAssignedCourses = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    search: "",
    statusFilter: "all",
    programmeFilter: "all",
    loading: false,
    type: "all_semester",
    activeToggle: "instructor" as "instructor" | "coordinator",
    data: null as any,
  });

  const debouncedSearch = useDebounce(state.search, 500);

  useEffect(() => {
    dispatch(setPageTitle("My Assigned Courses"));
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
  }, [debouncedSearch, state.type]);

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
      console.log("faculties dashboard overview res", res);
      setState({ data: res, loading: false });
    } catch (error) {
      console.log("error fetching faculty dashboard overview", error);
      setState({ loading: false });
    }
  };

  const onCoordinatorAction = (data: any) => {
    console.log("onCoordinatorAction data", data);

    const nextAction = data?.next_action?.toLowerCase() || "";
    const courseId = data?.id;
    const jobId = data?.job_ids?.extraction_job_id;

    // Build query params - course_id for all, job_id only for syllabus
    const buildQueryString = (includeJobId = false) => {
      const params = new URLSearchParams({
        course_id: String(courseId),
        from: "my-courses",
      });
      if (includeJobId && jobId) {
        params.append("job_id", String(jobId));
      }
      return `?${params.toString()}`;
    };

    // Route based on next_action keyword matching
    if (nextAction.includes("co-po")) {
      router.push(`/neurobe/co-po-mapping${buildQueryString()}`);
    } else if (nextAction.includes("cia")) {
      router.push(`/neurobe/cia-question-paper${buildQueryString()}`);
    } else if (nextAction.includes("bank")) {
      router.push(`/neurobe/question-bank${buildQueryString()}`);
    } else if (nextAction.includes("pedagogy")) {
      router.push(`/neurobe/pedagogy${buildQueryString()}`);
    } else if (nextAction.includes("lesson")) {
      router.push(`/neurobe/lesson-plan${buildQueryString()}`);
    } else if (nextAction.includes("topics") || nextAction.includes("hierarchy")) {
      router.push(`/neurobe/topics${buildQueryString()}`);
    } else if (nextAction.includes("learning")) {
      router.push(`/neurobe/learning-materials${buildQueryString()}`);
    } else if (
      nextAction.includes("syllabus") ||
      nextAction.includes("extract") ||
      nextAction.includes("upload")
    ) {
      router.push(`/neurobe/syllabus${buildQueryString(true)}`);
    } else {
      router.push(`/neurobe/syllabus${buildQueryString(true)}`);
    }
  };

  const onInstructorAction = (data: any) => {
    console.log("onInstructorAction data", data);
    const courseId = data?.id;
    const courseCode = data?.course_code || data?.code || "";
    router.push(
      `/neurobe/ins-course-artifacts?course_id=${courseId}&code=${courseCode}&from=my-courses`
    );
  };

  const rawCourses: any[] = state.data?.courses || [];

  // Partition courses: coordinator courses vs instructor-only courses
  const coordinatorCourses = rawCourses.filter((c: any) => {
    const roleType =
      c.role_type ||
      ((c.faculty_role || c.role || "").toLowerCase().includes("coordinator")
        ? "coordinator"
        : "instructor");
    return roleType === "coordinator";
  });

  const instructorCourses = rawCourses.filter((c: any) => {
    const roleType =
      c.role_type ||
      ((c.faculty_role || c.role || "").toLowerCase().includes("coordinator")
        ? "coordinator"
        : "instructor");
    return roleType !== "coordinator";
  });

  const currentRoleCourses =
    state.activeToggle === "coordinator" ? coordinatorCourses : instructorCourses;

  const visibleCourses = currentRoleCourses.filter((c: any) => {
    const s = (state.search || "").toLowerCase().trim();
    if (!s) return true;
    const code = (c.course_code || c.code || "").toLowerCase();
    const title = (c.course_title || c.title || "").toLowerCase();
    const prog = (c.programme || "").toLowerCase();
    return code.includes(s) || title.includes(s) || prog.includes(s);
  });

  return (
    <div className="min-h-screen pb-12">
      <PageBanner
        badges={[
          {
            label: "Faculty",
            className: "bg-[#1244cc] text-white px-3.5 py-1 font-medium",
          },
          {
            label: "Instructor & Coordinator access",
            dot: true,
            className:
              "bg-[#043e2e] text-[#10b981] border border-[#065f46] px-3.5 py-1 font-medium",
          },
        ]}
        title="My Assigned Courses"
        description="Academic course preparation, syllabus, outcomes mapping, lesson plans, question banking, and classroom execution."
        stats={[
          {
            label: "COURSES",
            value:
              state?.data?.summary?.total_courses ??
              state?.data?.summary?.courses_count ??
              0,
          },
          {
            label: "AVG READINESS",
            value:
              state?.data?.summary?.avg_readiness != null
                ? `${state?.data?.summary?.avg_readiness}%`
                : state?.data?.summary?.avg_readiness_percentage ?? "0%",
            valueColor: "text-[#10b981]",
          },
          {
            label: "ENROLLED STUDENTS",
            value:
              state?.data?.summary?.total_students ??
              state?.data?.summary?.enrolled_students_count ??
              0,
          },
        ]}
      />

      {/* Role Toggle & Header Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            {state.activeToggle === "coordinator"
              ? "Course Coordinator Workspace"
              : "Course Instructor View"}
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              {visibleCourses.length} {visibleCourses.length === 1 ? "Course" : "Courses"}
            </span>
          </h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {state.activeToggle === "coordinator"
              ? "Design syllabus, outcomes, pedagogy, and oversee course delivery."
              : "Access academic artifacts, approved syllabus, teaching schedule, and class materials."}
          </p>
        </div>

        {/* Sliding Pill Toggle */}
        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100 p-1.5 dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setState({ activeToggle: "instructor" })}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              state.activeToggle === "instructor"
                ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <span>Course Instructor</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                state.activeToggle === "instructor"
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
              }`}
            >
              {instructorCourses.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setState({ activeToggle: "coordinator" })}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              state.activeToggle === "coordinator"
                ? "bg-white text-indigo-700 shadow-sm dark:bg-gray-700 dark:text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            }`}
          >
            <span>Course Coordinator</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                state.activeToggle === "coordinator"
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200"
                  : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300"
              }`}
            >
              {coordinatorCourses.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-[320px] flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
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
            {state?.data?.semesters?.map((sem: any) => {
              const semVal = typeof sem === "object" ? sem.id || sem.semester : sem;
              const semDisplay =
                typeof sem === "object" ? sem.semester || sem.name || sem.id : sem;
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
      </div>

      {/* Cards List */}
      <div>
        {state.loading && rawCourses.length === 0 ? (
          <div className="flex justify-center py-16 text-sm text-gray-500">
            Loading assigned courses...
          </div>
        ) : visibleCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800">
            {state.activeToggle === "coordinator"
              ? "No courses found where you are assigned as Course Coordinator."
              : "No teaching courses found matching your criteria."}
          </div>
        ) : state.activeToggle === "coordinator" ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {visibleCourses.map((card: any) => (
              <CourseCard
                key={card.id}
                data={card}
                {...card}
                onAction={() => onCoordinatorAction(card)}
                onCoordinatorAction={() => onCoordinatorAction(card)}
                onInstructorAction={() => onInstructorAction(card)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleCourses.map((card: any) => (
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
                  card.students_count ||
                  card.enrolled_students ||
                  card.enrolled_students_count ||
                  0
                }
                allocation={card.allocation || "Primary Allocation"}
                onOpenCourse={() => onInstructorAction(card)}
                onTriggerStage={(stageKey) => {
                  const courseId = card.id || card.course_id;
                  const courseCode = card.course_code || card.code || "";
                  if (stageKey === "extraction") {
                    router.push(
                      `/neurobe/syllabus?course_id=${courseId}&code=${courseCode}&from=my-courses`
                    );
                  } else {
                    router.push(
                      `/neurobe/ins-course-artifacts?course_id=${courseId}&code=${courseCode}&stage=${stageKey}&from=my-courses`
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
