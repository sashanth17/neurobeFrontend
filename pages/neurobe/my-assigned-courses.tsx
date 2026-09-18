import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import PageBanner from "@/components/common-components/PageBanner";
import TableComponent from "@/components/common-components/TableComponent";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import PrivateRouter from "@/hook/privateRouter";
import useDebounce from "@/hook/useDebounce";
import { BookOpen, User2Icon } from "lucide-react";
import CourseCard from "@/components/academic-setup/CourseCard";
import Models from "@/imports/models.import";
import { useRouter } from "next/navigation";


const MyAssignedCourses = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    search: "",
    statusFilter: "all",
    programmeFilter: "all",
    loading: false,
    type: "all_semester",
    data: null,
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
        ...(semesterId && semesterId !== "all_semester" && { semester: typeof semesterId === "object" ? semesterId.id || semesterId.semester : semesterId }),
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
        course_id: courseId,
      });
      if (includeJobId && jobId) {
        params.append("job_id", jobId);
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
    } else if (nextAction.includes("topics")) {
      // Only syllabus gets job_id
      router.push(`/neurobe/syllabus${buildQueryString(true)}`);
    } else if (nextAction.includes("learning")) {
      router.push(`/neurobe/learning-materials${buildQueryString()}`);
    } else {
      // Default: go to syllabus with job_id
      router.push(`/neurobe/syllabus${buildQueryString(true)}`);
    }
  };

  const onInstructorAction = (data: any) => {
    console.log("onInstructorAction data", data);
    const courseId = data?.id;
    const courseCode = data?.course_code || data?.code || "";
    router.push(`/neurobe/ins-course-artifacts?course_id=${courseId}&code=${courseCode}`);
  };

  return (
    <div className="min-h-screen">
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
            value: state?.data?.summary?.total_courses ?? state?.data?.summary?.courses_count ?? 0,
          },
          {
            label: "AVG READINESS",
            value: state?.data?.summary?.avg_readiness != null
              ? `${state?.data?.summary?.avg_readiness}%`
              : state?.data?.summary?.avg_readiness_percentage ?? "0%",
            valueColor: "text-[#10b981]",
          },
          {
            label: "ENROLLED STUDENTS",
            value: state?.data?.summary?.total_students ?? state?.data?.summary?.enrolled_students_count ?? 0,
          },
        ]}
      />

      {/* Filters */}
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
      </div>

      {/* Cards */}
      <div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {state.data?.courses?.map((card: any) => (
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
      </div>
    </div>
  );
};

export default PrivateRouter(MyAssignedCourses);
