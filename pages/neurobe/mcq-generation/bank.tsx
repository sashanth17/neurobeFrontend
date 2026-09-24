import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import CourseBanner from "@/components/academic-setup/CourseBanner";
import Models from "@/imports/models.import";
import CourseQuestionBankTab from "@/components/question-bank/CourseQuestionBankTab";

import {
  CourseItem,
  MCQQuestion,
  FALLBACK_COURSES,
  UNITS_CONFIG,
  normalizeMCQ,
  MCQStatsBanner,
} from "@/components/mcq-generation";

const MCQGenerationBankPage = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    courses: [] as CourseItem[],
    selectedCourse: null as CourseItem | null,
    courseUnits: [] as any[],
    courseQuestions: [] as MCQQuestion[],
    selectedBannerFilter: "all" as "recent" | "all" | "approved" | "archived" | "review" | "drafted",
  });

  useEffect(() => {
    dispatch(setPageTitle("Course Question Bank"));
    fetchAssignedCourses();
  }, [dispatch]);

  const fetchAssignedCourses = async () => {
    try {
      const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const user = userStr ? JSON.parse(userStr) : null;
      const body = { faculty_id: user?.id || 1, coordinator_id: user?.id || 1 };
      const res: any = await Models.course.faculty_dashboard_overview(body).catch(() => null);
      const raw = res?.courses || res?.data || res || [];
      let formatted: CourseItem[] = FALLBACK_COURSES;
      if (Array.isArray(raw) && raw.length > 0) {
        formatted = raw.map((c: any, idx: number) => ({
          id: c.id || c.course_id || `c-${idx}`,
          code: c.code || c.course_code || `COURSE${idx}`,
          title: c.title || c.course_title || "Academic Course",
          programme: c.programme || "B.Tech CSE",
          batch: c.batch_name || c.batch || "2024–2028",
          semester: c.semester || c.term || "Semester 5",
          students_count: c.students_count || c.enrolled_students_count || 45,
          role: c.role || "Course Instructor",
          role_type: c.role_type || "instructor",
          questions_count: 20 + idx * 6,
          approved_questions_count: 15 + idx * 4,
          units_count: 5,
        }));
      }
      setState({ courses: formatted });

      const cid = router.query.course_id;
      const matched = cid
        ? formatted.find(
            (c) =>
              String(c.id) === String(cid) ||
              String(c.code).toLowerCase() === String(cid).toLowerCase() ||
              String(c.course_code).toLowerCase() === String(cid).toLowerCase()
          )
        : formatted[0];

      if (matched) {
        setState({ selectedCourse: matched });
        fetchCourseUnits(matched.id);
        fetchQuestions(matched.code || matched.id);
      }
    } catch {
      setState({ courses: FALLBACK_COURSES });
    }
  };

  const fetchQuestions = async (courseKey: string | number) => {
    try {
      const res: any = await Models.mcq.history_questions({ course_id: courseKey }).catch(() => null);
      let rawList: any[] = [];
      if (res) {
        if (Array.isArray(res)) rawList = res;
        else if (res.items && Array.isArray(res.items)) rawList = res.items;
        else if (res.questions && Array.isArray(res.questions)) rawList = res.questions;
        else if (res.data && Array.isArray(res.data)) rawList = res.data;
      }
      const fetched: MCQQuestion[] = rawList.map((item, idx) => normalizeMCQ(item, idx));
      setState({ courseQuestions: fetched });
    } catch (err) {
      console.error("fetchQuestions error:", err);
    }
  };

  const fetchCourseUnits = async (courseId: string | number) => {
    try {
      const res: any = await Models.syllabus.get_units(courseId, { topic_status: "approved" });
      const arr = Array.isArray(res) ? res : res?.units || [];
      if (arr.length > 0) {
        const mapped = arr.map((u: any, idx: number) => ({
          unitId: u.id || idx + 1,
          label: `Unit ${u.unit_number || idx + 1}`,
          title: u.unit_title || u.title || u.name || `Unit ${idx + 1}`,
          topics: u.topics ? u.topics.map((t: any) => t.topic_name || t.title || t.name || t) : ["General Topic"],
        }));
        setState({ courseUnits: mapped });
      } else {
        setState({ courseUnits: UNITS_CONFIG });
      }
    } catch {
      setState({ courseUnits: UNITS_CONFIG });
    }
  };

  const currentCourseKey = state.selectedCourse?.code || state.selectedCourse?.course_code || "";
  const currentQuestions = state.courseQuestions || [];

  return (
    <div className="min-h-screen pb-14">
      {/* Top Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/neurobe/mcq-generation")}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Assigned Courses</span>
        </button>
        {state.selectedCourse && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Current Course:</span>
            <div className="relative">
              <select
                value={state.selectedCourse.code || state.selectedCourse.id}
                onChange={(e) => {
                  const found = state.courses.find(
                    (c) => String(c.code) === e.target.value || String(c.id) === e.target.value
                  );
                  if (found) {
                    setState({ selectedCourse: found });
                    fetchCourseUnits(found.id);
                    fetchQuestions(found.code || found.id);
                  }
                }}
                className="h-9 rounded-xl border border-gray-200 bg-white px-3 pr-8 text-xs font-semibold text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {state.courses.map((c) => (
                  <option key={c.id} value={c.code || c.id}>
                    {c.code} — {c.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>
        )}
      </div>

      {state.selectedCourse && (
        <>
          <CourseBanner
            courseCode={state.selectedCourse.code || state.selectedCourse.course_code || "CS309"}
            courseTitle={state.selectedCourse.title || state.selectedCourse.course_title || "Course"}
            description="Course Question Bank — Search, filter, inspect, and organize approved question sets."
            programme={state.selectedCourse.programme || "B.Tech CSE"}
            batch={state.selectedCourse.batch || "2024–2028"}
            academicYear={`${state.selectedCourse.semester || "Semester 5"}`}
            students={`${state.selectedCourse.students_count || 45} Students`}
            selectedCourse={state.selectedCourse.code}
            courseOptions={state.courses.map((c) => ({
              value: String(c.code || c.id),
              label: `${c.code} — ${c.title}`,
            }))}
            onCourseChange={(val) => {
              const target = typeof val === "object" ? val?.value : val;
              const found = state.courses.find(
                (c) => String(c.code) === String(target) || String(c.id) === String(target)
              );
              if (found) {
                setState({ selectedCourse: found });
                fetchCourseUnits(found.id);
                fetchQuestions(found.code || found.id);
              }
            }}
            onBack={() => router.push("/neurobe/mcq-generation")}
          />

          <MCQStatsBanner
            questions={currentQuestions}
            selectedFilter={state.selectedBannerFilter}
            onSelectFilter={(selectedBannerFilter) => setState({ selectedBannerFilter })}
          />

          <CourseQuestionBankTab
            courseKey={currentCourseKey}
            courseTitle={
              state.selectedCourse
                ? `${state.selectedCourse.code || state.selectedCourse.course_code} — ${
                    state.selectedCourse.title || state.selectedCourse.course_title
                  }`
                : "Course Question Bank"
            }
            courseQuestions={currentQuestions}
            courseUnits={state.courseUnits}
            onRefreshQuestions={() => {
              if (state.selectedCourse) {
                fetchQuestions(
                  state.selectedCourse.code || state.selectedCourse.course_code || state.selectedCourse.id
                );
              }
            }}
          />
        </>
      )}
    </div>
  );
};

export default PrivateRouter(MCQGenerationBankPage);
