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
import { Activity, ArrowRight } from "lucide-react";

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
    activeAssessments: [] as any[],
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

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const role = localStorage.getItem("role") || user?.role || "";
      const isCoordinatorRole = String(role).toLowerCase().includes("coordinator");
      if (
        isCoordinatorRole ||
        router.query.view === "coordinator" ||
        router.query.toggle === "coordinator"
      ) {
        setState({ activeToggle: "coordinator" });
      }
    } catch {}
  }, [router.query.view, router.query.toggle]);

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

      // Fetch active & scheduled assessments for live monitor connectivity
      let activeAssessments: any[] = [];
      try {
        const testsRes: any = await Models.mcq.list_tests().catch(() => []);
        if (Array.isArray(testsRes)) {
          const now = Date.now();
          activeAssessments = testsRes
            .filter((t: any) => {
              const s = (t.status || "").toLowerCase();
              return s !== "cancelled" && s !== "completed";
            })
            .map((t: any) => {
              const ws = t.test_window_start ? new Date(t.test_window_start).getTime() : 0;
              const we = t.test_window_end ? new Date(t.test_window_end).getTime() : 0;
              const isLiveNow =
                (ws > 0 && we > 0 && now >= ws && now <= we) ||
                (t.status || "").toLowerCase() === "live";
              return {
                ...t,
                isLiveNow,
              };
            });
        }
      } catch {}

      const courses = res?.courses || [];
      const hasCoord = courses.some((c: any) => {
        const roleType =
          c.role_type ||
          ((c.faculty_role || c.role || "").toLowerCase().includes("coordinator")
            ? "coordinator"
            : "instructor");
        return roleType === "coordinator";
      });
      const hasIns = courses.some((c: any) => {
        const roleType =
          c.role_type ||
          ((c.faculty_role || c.role || "").toLowerCase().includes("coordinator")
            ? "coordinator"
            : "instructor");
        return roleType === "instructor";
      });
      setState({
        data: res,
        activeAssessments,
        loading: false,
        ...(hasCoord && !hasIns ? { activeToggle: "coordinator" } : {}),
      });
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
      router.push(`/neurobe/mcq-generation/bank${buildQueryString()}`);
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

      {/* Live & Scheduled Assessments Monitoring Bar */}
      {state.activeAssessments && state.activeAssessments.length > 0 && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-indigo-50/40 p-5 shadow-xs dark:border-emerald-900/40 dark:bg-gradient-to-r dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-indigo-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-200/60 pb-3 dark:border-emerald-900/60">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Active Assessments & Live Proctoring</span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                  {state.activeAssessments.length} Active
                </span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => router.push("/neurobe/ins-mcq-live-monitor")}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              <span>Open Live Monitor Room</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {state.activeAssessments.slice(0, 3).map((test: any) => (
              <div
                key={test.test_id}
                className="flex flex-col justify-between rounded-xl border border-emerald-200/80 bg-white p-4 shadow-2xs hover:shadow-sm transition-all dark:border-emerald-900/60 dark:bg-gray-800"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                      {test.test_code || "MCQ"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        test.isLiveNow
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 animate-pulse"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${test.isLiveNow ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {test.isLiveNow ? "Live Assessment" : "Scheduled"}
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                    {test.title}
                  </h4>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {test.unit_name || "Assessment"} • {test.duration_minutes || 30} mins
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/neurobe/ins-mcq-live-monitor?test_id=${test.test_id}&test_title=${encodeURIComponent(test.title)}&course_id=${test.course_id || ""}`
                      )
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Monitor Live</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/neurobe/ins-mcq-test-execution?course_id=${test.course_id || ""}`)
                    }
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 cursor-pointer"
                    title="Manage Test Execution"
                  >
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

        {/* Sliding Pill Toggle + Live Monitor Quick Action */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/neurobe/ins-mcq-live-monitor")}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-2xs hover:bg-emerald-100 transition-all dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer"
          >
            <Activity className="h-4 w-4 text-emerald-600 animate-pulse" />
            <span>Live Test Monitor</span>
          </button>

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
