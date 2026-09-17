import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import PrivateRouter from "@/hook/privateRouter";
import AssignedCourseCard from "@/components/academic-setup/AssignedCourseCard";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import { useRouter } from "next/navigation";

const MOCK_TEACHING_COURSES = [
  {
    code: "CS309",
    title: "Computer Networks",
    programme: "B.Tech CSE",
    batch: "2025–2029",
    semester: "3",
    enrolledStudents: "40",
    allocation: "Primary Allocation",
  },
  {
    code: "CS310",
    title: "Database Management Systems",
    programme: "B.Tech CSE",
    batch: "2025–2029",
    semester: "3",
    enrolledStudents: "42",
  },
  {
    code: "CS204",
    title: "Object Oriented Programming with Java",
    programme: "B.Tech CSE",
    batch: "2024–2028",
    semester: "4",
    enrolledStudents: "38",
  },
];

const MyAssignedCourses = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    search: "",
    statusFilter: "all",
    programmeFilter: "all",
    loading: false,
    type: "all_semester",
  });

  useEffect(() => {
    dispatch(setPageTitle("My Assigned Courses"));
  }, [dispatch]);

  const semester = [
    {
      label: "All Semsters",
      value: "all_semester",
    },
    {
      label: "Semester 3",
      value: "semester_3",
    },
    {
      label: "Semester 4",
      value: "semester_4",
    },
  ];

  const onAction = (data) => {
    router.push(`/neurobe/ins-course-artifacts?code=${data.code}`)
    console.log("onAction", data);
  };

  const filteredCourses = MOCK_TEACHING_COURSES.filter((c) => {
    const s = state.search.toLowerCase();
    const matchSearch =
      !s ||
      c.code.toLowerCase().includes(s) ||
      c.title.toLowerCase().includes(s) ||
      c.programme.toLowerCase().includes(s);
    const matchSem =
      state.type === "all_semester" ||
      (state.type === "semester_3" && c.semester === "3") ||
      (state.type === "semester_4" && c.semester === "4");
    return matchSearch && matchSem;
  });

  return (
    <div className="min-h-screen">
      <CourseBanner
        courseCode="CS301"
        courseTitle="Computer Networks"
        description="Coordinator View — Academic course preparation, syllabus, outcomes mapping, lesson plans, question banking, and CIA paper generation."
        programme="B.Tech CSE"
        batch="2025–2029"
        academicYear="2026–2027 / Semester 3"
        students="40 Students"
        selectedCourse="CS309"
        courseOptions={[
          { value: "CS309", label: "Course: CS309" },
          { value: "CS301", label: "Course: CS301" },
        ]}
        toogle="instructor"
        onCourseChange={(val) => console.log("course", val)}
        activeView={state.activeTab}
        onBack={() => console.log("back")}
        onViewChange={(view) => setState({ activeTab: view })}
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

      {/* <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
            {semester.map((sem) => (
              <button
                key={sem.value}
                onClick={() => setState({ type: sem.value })}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${state.type === sem.value
                    ? "text-color2 rounded-lg bg-[#fff] shadow-sm"
                    : "hover:text-pri text-[#000] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  }`}
              >
                {sem.label}
              </button>
            ))}
          </div>
        </div>
      </div> */}

      {/* Cards */}
      <div className="">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((card) => (
            <AssignedCourseCard
              key={card.code}
              {...card}
              onOpenCourse={() => onAction(card)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivateRouter(MyAssignedCourses);
