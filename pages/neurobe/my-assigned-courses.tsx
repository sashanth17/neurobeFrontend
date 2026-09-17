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

const MOCK_ASSIGNED_COURSES = [
  {
    id: 1,
    code: "CS301",
    title: "Data Structures & Algorithms",
    programme: "B.E. Computer Science",
    batch: "2023-2027",
    semester: "Semester 5",
    credits: 4,
    studentsCount: 64,
    role: "Course Coordinator & Instructor",
    status: "Active",
  },
  {
    id: 2,
    code: "CS402",
    title: "Database Management Systems",
    programme: "B.E. Computer Science",
    batch: "2023-2027",
    semester: "Semester 5",
    credits: 3,
    studentsCount: 62,
    role: "Course Instructor",
    status: "Active",
  },
  {
    id: 3,
    code: "AI201",
    title: "Introduction to Artificial Intelligence",
    programme: "B.Tech AI & DS",
    batch: "2024-2028",
    semester: "Semester 3",
    credits: 4,
    studentsCount: 58,
    role: "Course Coordinator & Instructor",
    status: "Active",
  },
  {
    id: 4,
    code: "CS504",
    title: "Cloud Computing Architectures",
    programme: "B.E. Computer Science",
    batch: "2022-2026",
    semester: "Semester 7",
    credits: 3,
    studentsCount: 55,
    role: "Course Instructor",
    status: "Completed",
  },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Completed", label: "Completed" },
];

const PROGRAMME_OPTIONS = [
  { value: "all", label: "All Programmes" },
  { value: "B.E. Computer Science", label: "B.E. Computer Science" },
  { value: "B.Tech AI & DS", label: "B.Tech AI & DS" },
];

const MOCK_CARDS = [
  {
    isNew: true,
    code: "CS301",
    credits: "4 Credits • L-3 : T-0 : P-2",
    role: "Coordinator + Instructor",
    title: "Computer Networks",
    programme: "B.Tech CSE",
    batch: "2025-2029",
    term: "Semester 3",
    students: "43 Students",
    prepItems: [
      { label: "SYLLABUS", status: "not_started" as const },
      { label: "CO-PO MAPPING", status: "not_started" as const },
      { label: "TOPICS", status: "not_started" as const },
      { label: "PEDAGOGY", status: "not_started" as const },
      { label: "LESSON PLAN", status: "not_started" as const },
      { label: "LEARNING MATERIALS", status: "not_started" as const },
      { label: "QUESTION BANK", status: "not_started" as const },
      { label: "CIA QUESTION PAPER", status: "not_started" as const },
    ],
    nextAction: "Upload Syllabus",
    instructors:
      "Instructors: Arun Kumar (Coordinator), Priya Selvam (Instructor)",
    actionLabel: "Start Course Preparation",
  },
  {
    code: "CS201",
    credits: "4 Credits • L-3 : T-0 : P-2",
    role: "Coordinator + Instructor",
    title: "Data Structures",
    readiness: "78%",
    programme: "B.Tech CSE",
    batch: "2025-2029 Batch",
    term: "Semester 3",
    students: "41 Students",
    prepItems: [
      { label: "SYLLABUS", status: "approved" as const },
      { label: "CO-PO MAPPING", status: "review" as const },
      { label: "TOPICS", status: "approved" as const },
      { label: "PEDAGOGY", status: "approved" as const },
      { label: "LESSON PLAN", status: "draft" as const },
      {
        label: "QUESTION BANK",
        status: "approved" as const,
        extra: "68 Questions",
      },
      { label: "LEARNING MATERIALS", status: "draft" as const },
      { label: "CIA", status: "draft" as const },
    ],
    nextAction: "Review CO-PO mapping",
    instructors:
      "Instructors: Arun Kumar (Coordinator), Priya Selvam (Instructor)",
    actionLabel: "Enter Course Workspaces",
  },
];

const MyAssignedCourses = () => {
  const dispatch = useDispatch();
  const router = useRouter()

  const [state, setState] = useSetState({
    search: "",
    statusFilter: "all",
    programmeFilter: "all",
    loading: false,
    type: "all_semester",
    data: null

  });

  const debouncedSearch = useDebounce(state.search, 500);

  useEffect(() => {
    dispatch(setPageTitle("My Assigned Courses"));
  }, [dispatch]);

  useEffect(() => {
    dashboard_view()
  }, []);

  useEffect(() => {
    if (state.type !== "all_semester") {
      dashboard_view(state.type?.id || state.type)
    }
  }, [state.type]);

  useEffect(() => {
    dashboard_view(state.type?.id || state.type, debouncedSearch);
  }, [debouncedSearch, state.type]);

  const dashboard_view = async (semesterId?: any, searchQuery?: string) => {
    try {
      const user = localStorage.getItem("user")
      const u = JSON.parse(user);
      const body = {
        coordinator_id: u?.id,
        ...(semesterId && semesterId !== "all_semester" && { semester: semesterId }),
        ...(searchQuery && { search: searchQuery })
      }
      const res = await Models.course.coordinator_dashboard_overview(body)
      console.log("res", res)
      setState({ data: res })

    } catch (error) {
      console.log('error', error)

    }
  }




  const onAction = (data) => {
    console.log('data', data)

    const nextAction = data?.next_action?.toLowerCase() || "";
    const courseId = data?.id;
    const jobId = data?.job_ids?.extraction_job_id;

    // Build query params - course_id for all, job_id only for syllabus
    const buildQueryString = (includeJobId = false) => {
      const params = new URLSearchParams({
        course_id: courseId
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

    console.log("onAction", data)
  }

  return (
    <div className="min-h-screen">
      <PageBanner
        badges={[
          {
            label: "Course Coordinator",
            className: "bg-[#1244cc] text-white px-3.5 py-1 font-medium",
          },
          {
            label: "Instructor access included",
            dot: true,
            className:
              "bg-[#043e2e] text-[#10b981] border border-[#065f46] px-3.5 py-1 font-medium",
          },
        ]}
        title="My Assigned Courses"
        description="Academic course preparation, syllabus, outcomes mapping, lesson plans, question banking, and classroom execution."
        stats={[
          { label: "COURSES", value: state?.data?.summary?.courses_count },
          {
            label: "AVG READINESS",
            value: state?.data?.summary?.avg_readiness_percentage,
            valueColor: "text-[#10b981]",
          },
          { label: "ENROLLED STUDENTS", value: state?.data?.summary?.enrolled_students_count },
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
          <p>Semester : </p>

          <div className="bg-sec-dark flex shrink-0 items-center gap-2 rounded-lg px-1 py-1">
            <button
              onClick={() => {
                setState({ type: "all_semester" });
                dashboard_view();
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${state.type === "all_semester"
                ? "text-color2 rounded-lg bg-[#fff] shadow-sm"
                : "hover:text-pri text-[#000] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                }`}
            >
              All Semesters
            </button>
            {state?.data?.semesters.map((sem) => (
              <button
                key={sem.id}
                onClick={() => setState({ type: sem })}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${state.type?.id === sem.id
                  ? "text-color2 rounded-lg bg-[#fff] shadow-sm"
                  : "hover:text-pri text-[#000] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }`}
              >
                Semester {sem}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="">

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {console.log(state?.data)}
          {state.data?.courses.map((card) => (
            <CourseCard data={card} key={card.id} {...card} onAction={() => onAction(card)} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivateRouter(MyAssignedCourses);
