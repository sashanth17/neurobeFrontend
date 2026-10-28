import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  CoursesMatrixResponse,
  McqAnalyticsResponse,
  CourseMatrixItem,
} from "@/services/academicAdminAnalytics.service";
import CourseDetailModal from "./CourseDetailModal";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CourseMcqPerformanceViewProps {
  coursesData: CoursesMatrixResponse;
  mcqData: McqAnalyticsResponse;
  onBackToLevel2: () => void;
}

export const CourseMcqPerformanceView: React.FC<CourseMcqPerformanceViewProps> = ({
  coursesData,
  mcqData,
  onBackToLevel2,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<number | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"courses" | "mcq">("courses");
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<CourseMatrixItem | null>(null);

  // Available semesters
  const availableSemesters = useMemo(() => {
    const sems = new Set<number>();
    coursesData.courses.forEach((c) => sems.add(c.semester));
    return Array.from(sems).sort();
  }, [coursesData]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return coursesData.courses.filter((course) => {
      const matchesSem = selectedSemester === "ALL" || course.semester === selectedSemester;
      const matchesSearch =
        searchQuery.trim() === "" ||
        course.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.course_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.assigned_faculty.some((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSem && matchesSearch;
    });
  }, [coursesData, selectedSemester, searchQuery]);

  // MCQ Performance Tiers Chart (Donut)
  const tiersSeries = useMemo(() => {
    const pt = mcqData.performance_tiers;
    return [
      pt.excellent_above_80,
      pt.good_60_to_80,
      pt.average_40_to_60,
      pt.needs_improvement_below_40,
    ];
  }, [mcqData]);

  const tiersOptions: any = useMemo(() => {
    return {
      chart: {
        type: "donut",
        height: 260,
      },
      labels: [
        "Excellent (> 80%)",
        "Good (60% - 80%)",
        "Average (40% - 60%)",
        "Needs Improvement (< 40%)",
      ],
      colors: ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"],
      legend: {
        position: "bottom",
        fontSize: "12px",
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number, opts: any) => {
          return `${opts.w.globals.series[opts.seriesIndex]} (${val.toFixed(0)}%)`;
        },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Evaluated",
                fontSize: "12px",
                formatter: (w: any) => {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                },
              },
            },
          },
        },
      },
    };
  }, [mcqData]);

  // MCQ vs Descriptive Score Comparison (Bar)
  const scoreComparisonSeries = useMemo(() => {
    return [
      {
        name: "Average Score %",
        data: [mcqData.summary.average_mcq_score_pct, mcqData.summary.average_descriptive_score_pct],
      },
    ];
  }, [mcqData]);

  const scoreComparisonOptions: any = useMemo(() => {
    return {
      chart: {
        type: "bar",
        height: 220,
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          columnWidth: "40%",
          borderRadius: 8,
          distributed: true,
          dataLabels: { position: "top" },
        },
      },
      colors: ["#6366f1", "#0ea5e9"],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val}%`,
        offsetY: -20,
        style: { fontSize: "12px", fontWeight: "bold", colors: ["#334155"] },
      },
      xaxis: {
        categories: ["MCQ Assessments", "Theory / Descriptive Exams"],
        labels: { style: { fontSize: "12px", fontWeight: 600 } },
      },
      yaxis: {
        max: 100,
        labels: { formatter: (v: number) => `${v}%` },
      },
      legend: { show: false },
      grid: { borderColor: "#f1f5f9" },
    };
  }, [mcqData]);

  return (
    <div className="space-y-6">
      {/* ── Department Top Banner ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLevel2}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Department Comparison</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
                  {coursesData.department_code}
                </span>
                <h2 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                  {coursesData.department_name}
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Detailed course-level performance, continuous assessments, and MCQ cognitive analytics.
              </p>
            </div>
          </div>

          {/* Quick Department Stats */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-right">
              <span className="text-[10px] text-gray-400 block font-medium">Courses Running</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {coursesData.courses.length} Courses
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-right">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-medium">MCQ Participation</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {mcqData.summary.student_participation_rate}%
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Courses vs MCQ Deep-Dive) */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("courses")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "courses"
                  ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Courses Matrix & Pass Rates ({coursesData.courses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("mcq")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "mcq"
                  ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>MCQ Analytics & Cognitive Rigor</span>
            </button>
          </div>

          {activeTab === "courses" && (
            <div className="flex items-center gap-2">
              {/* Semester Filter */}
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 text-xs">
                <button
                  onClick={() => setSelectedSemester("ALL")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    selectedSemester === "ALL"
                      ? "bg-primary text-white"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                  }`}
                >
                  All Semesters
                </button>
                {availableSemesters.map((sem) => (
                  <button
                    key={sem}
                    onClick={() => setSelectedSemester(sem)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                      selectedSemester === sem
                        ? "bg-primary text-white"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>

              {/* Course Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses or faculty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input text-xs py-1.5 pl-8 pr-3 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-48 focus:w-60 transition-all"
                />
                <svg
                  className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── View 1: Courses Matrix Tab ── */}
      {activeTab === "courses" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map((course) => {
              const totalBloom = Object.values(course.bloom_distribution).reduce((a, b) => a + b, 0);

              return (
                <div
                  key={course.course_id}
                  className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary">
                            {course.course_code}
                          </span>
                          <span className="text-xs font-semibold text-gray-400">
                            Semester {course.semester}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-1.5">
                          {course.course_title}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-gray-400 block font-medium">Enrolled</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                          {course.total_enrolled_students} Students
                        </span>
                      </div>
                    </div>

                    {/* Faculty Badges */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {course.assigned_faculty.map((faculty, fIdx) => (
                        <span
                          key={fIdx}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        >
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{faculty.name}</span>
                          <span className="text-[9px] text-gray-400">({faculty.role})</span>
                        </span>
                      ))}
                    </div>

                    {/* Pass Rates Progress */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                      <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/40">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-sky-700 dark:text-sky-300">Internal CIA</span>
                          <span className="font-bold text-sky-800 dark:text-sky-200">{course.internal_pass_pct}%</span>
                        </div>
                        <div className="w-full bg-sky-200 dark:bg-sky-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-sky-600 h-full rounded-full" style={{ width: `${course.internal_pass_pct}%` }} />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">External Exam</span>
                          <span className="font-bold text-emerald-800 dark:text-emerald-200">{course.external_pass_pct}%</span>
                        </div>
                        <div className="w-full bg-emerald-200 dark:bg-emerald-900 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${course.external_pass_pct}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Course Bloom Breakdown */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mb-1">
                        <span>Cognitive Bloom Distribution</span>
                        <span>Dominant: K3 ({course.bloom_distribution.K3} students)</span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {(["K1", "K2", "K3", "K4", "K5", "K6"] as const).map((lvl) => {
                          const count = course.bloom_distribution[lvl];
                          const pct = totalBloom > 0 ? (count / totalBloom) * 100 : 0;
                          const colors: Record<string, string> = {
                            K1: "#3b82f6",
                            K2: "#06b6d4",
                            K3: "#10b981",
                            K4: "#f59e0b",
                            K5: "#f97316",
                            K6: "#8b5cf6",
                          };
                          return (
                            <div
                              key={lvl}
                              style={{ width: `${pct}%`, backgroundColor: colors[lvl] }}
                              title={`${lvl}: ${count} students (${pct.toFixed(1)}%)`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">Benchmark: ≥ 50% Marks</span>
                    <button
                      onClick={() => setSelectedCourseForModal(course)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                    >
                      <span>View Full Breakdown</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="p-8 text-center bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800">
              <p className="text-gray-500 text-sm">No courses found matching the search or semester filter.</p>
            </div>
          )}
        </div>
      )}

      {/* ── View 2: MCQ Analytics Tab ── */}
      {activeTab === "mcq" && (
        <div className="space-y-6">
          {/* MCQ KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm">
              <span className="text-xs text-gray-400 font-medium">MCQ Tests Conducted</span>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {mcqData.summary.total_mcq_tests_conducted}
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Across this department</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm">
              <span className="text-xs text-gray-400 font-medium">Student Participation Rate</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {mcqData.summary.student_participation_rate}%
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">High Engagement</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm">
              <span className="text-xs text-gray-400 font-medium">Average MCQ Score</span>
              <div className="text-2xl font-bold text-primary mt-1">
                {mcqData.summary.average_mcq_score_pct}%
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Automated Assessment</div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm">
              <span className="text-xs text-gray-400 font-medium">Overall MCQ Pass %</span>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                {mcqData.summary.pass_percentage}%
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Benchmark: ≥ 50%</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cognitive Rigor Analysis */}
            <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Cognitive Rigor Distribution in MCQs
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Evaluates question complexity: Foundational Recall (K1–K2) vs Analytical Thinking (K3–K4).
                </p>

                <div className="mt-6 space-y-4">
                  {/* Foundational */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-blue-600 dark:text-blue-400">
                        Foundational Rigor (K1 Remember & K2 Understand)
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {mcqData.cognitive_rigor_distribution.foundational_k1_k2_pct}%
                      </span>
                    </div>
                    <div className="w-full bg-blue-100 dark:bg-blue-950/40 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${mcqData.cognitive_rigor_distribution.foundational_k1_k2_pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Analytical */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Analytical & Application Rigor (K3 Apply & K4 Analyze)
                      </span>
                      <span className="text-gray-900 dark:text-white">
                        {mcqData.cognitive_rigor_distribution.analytical_k3_k4_pct}%
                      </span>
                    </div>
                    <div className="w-full bg-emerald-100 dark:bg-emerald-950/40 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${mcqData.cognitive_rigor_distribution.analytical_k3_k4_pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
                  <div className="font-semibold text-gray-900 dark:text-white mb-1">
                    Total Questions Evaluated: {mcqData.cognitive_rigor_distribution.total_questions_analyzed} Questions
                  </div>
                  Higher analytical rigor indicates students are being challenged with problem-solving questions rather than mere rote memorization.
                </div>
              </div>

              {/* Theory vs MCQ Bar Comparison */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                  Average MCQ vs Theory / Descriptive Exam Scores
                </div>
                <div className="min-h-[220px]">
                  <ReactApexChart
                    options={scoreComparisonOptions}
                    series={scoreComparisonSeries}
                    type="bar"
                    height={220}
                  />
                </div>
              </div>
            </div>

            {/* Performance Tiers Donut */}
            <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Student MCQ Performance Tier Breakdown
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Student count categorized by assessment achievement tiers.
              </p>

              <div className="mt-4 min-h-[260px]">
                <ReactApexChart
                  options={tiersOptions}
                  series={tiersSeries}
                  type="donut"
                  height={260}
                />
              </div>

              {/* Tiers Legend Table */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                    Excellent (&gt; 80%)
                  </span>
                  <div className="text-base font-bold text-emerald-800 dark:text-emerald-200 mt-0.5">
                    {mcqData.performance_tiers.excellent_above_80} Students
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                    Good (60% - 80%)
                  </span>
                  <div className="text-base font-bold text-blue-800 dark:text-blue-200 mt-0.5">
                    {mcqData.performance_tiers.good_60_to_80} Students
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40">
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    Average (40% - 60%)
                  </span>
                  <div className="text-base font-bold text-amber-800 dark:text-amber-200 mt-0.5">
                    {mcqData.performance_tiers.average_40_to_60} Students
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                  <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                    Needs Improvement (&lt; 40%)
                  </span>
                  <div className="text-base font-bold text-rose-800 dark:text-rose-200 mt-0.5">
                    {mcqData.performance_tiers.needs_improvement_below_40} Students
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Deep Inspection */}
      <CourseDetailModal
        course={selectedCourseForModal}
        onClose={() => setSelectedCourseForModal(null)}
        departmentName={coursesData.department_name}
      />
    </div>
  );
};

export default CourseMcqPerformanceView;
