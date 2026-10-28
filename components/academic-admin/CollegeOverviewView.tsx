import React, { useMemo } from "react";
import dynamic from "next/dynamic";
import {
  AcademicKpiSummary,
  BloomDistributionResponse,
  PassPercentagesResponse,
} from "@/services/academicAdminAnalytics.service";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface CollegeOverviewViewProps {
  kpi: AcademicKpiSummary;
  bloom: BloomDistributionResponse;
  passPercentages: PassPercentagesResponse;
  onDrilldownToLevel2: (options?: { departmentId?: number; focus?: "bloom" | "exams" }) => void;
  onDrilldownToLevel3: (departmentId: number, departmentName: string) => void;
}

const BLOOM_COLORS: Record<string, { bg: string; border: string; text: string; hex: string; lightBg: string }> = {
  K1: { bg: "bg-blue-500", border: "border-blue-400", text: "text-blue-600 dark:text-blue-400", hex: "#3b82f6", lightBg: "bg-blue-50 dark:bg-blue-950/30" },
  K2: { bg: "bg-cyan-500", border: "border-cyan-400", text: "text-cyan-600 dark:text-cyan-400", hex: "#06b6d4", lightBg: "bg-cyan-50 dark:bg-cyan-950/30" },
  K3: { bg: "bg-emerald-500", border: "border-emerald-400", text: "text-emerald-600 dark:text-emerald-400", hex: "#10b981", lightBg: "bg-emerald-50 dark:bg-emerald-950/30" },
  K4: { bg: "bg-amber-500", border: "border-amber-400", text: "text-amber-600 dark:text-amber-400", hex: "#f59e0b", lightBg: "bg-amber-50 dark:bg-amber-950/30" },
  K5: { bg: "bg-orange-500", border: "border-orange-400", text: "text-orange-600 dark:text-orange-400", hex: "#f97316", lightBg: "bg-orange-50 dark:bg-orange-950/30" },
  K6: { bg: "bg-purple-500", border: "border-purple-400", text: "text-purple-600 dark:text-purple-400", hex: "#8b5cf6", lightBg: "bg-purple-50 dark:bg-purple-950/30" },
};

export const CollegeOverviewView: React.FC<CollegeOverviewViewProps> = ({
  kpi,
  bloom,
  passPercentages,
  onDrilldownToLevel2,
  onDrilldownToLevel3,
}) => {
  // Chart config for College-Wide Bloom Distribution
  const bloomChartSeries = useMemo(() => {
    return [
      {
        name: "Student Count",
        data: bloom.bloom_levels.map((item) => item.student_count),
      },
    ];
  }, [bloom]);

  const bloomChartOptions: any = useMemo(() => {
    return {
      chart: {
        type: "bar",
        height: 280,
        toolbar: { show: false },
        events: {
          dataPointSelection: () => {
            onDrilldownToLevel2({ focus: "bloom" });
          },
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "45%",
          distributed: true,
          dataLabels: {
            position: "top",
          },
        },
      },
      colors: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#f97316", "#8b5cf6"],
      legend: { show: false },
      dataLabels: {
        enabled: true,
        formatter: (val: number, opts: any) => {
          const pct = bloom.bloom_levels[opts.dataPointIndex]?.percentage || 0;
          return `${val} (${pct}%)`;
        },
        offsetY: -22,
        style: {
          fontSize: "11px",
          fontWeight: "600",
          colors: ["#64748b"],
        },
      },
      xaxis: {
        categories: bloom.bloom_levels.map((b) => `${b.level} - ${b.name}`),
        labels: {
          style: {
            fontSize: "12px",
            fontWeight: 600,
          },
        },
      },
      yaxis: {
        title: {
          text: "Number of Students Evaluated",
          style: { fontSize: "11px", fontWeight: 500, color: "#94a3b8" },
        },
      },
      tooltip: {
        theme: "dark",
        custom: ({ series, seriesIndex, dataPointIndex }: any) => {
          const item = bloom.bloom_levels[dataPointIndex];
          return `
            <div class="px-3 py-2 text-xs font-sans">
              <div class="font-bold text-sm text-white">${item.level} : ${item.name}</div>
              <div class="text-gray-300 mt-1">${item.description}</div>
              <div class="mt-2 text-emerald-400 font-semibold">${item.student_count} Students (${item.percentage}%)</div>
              <div class="text-[10px] text-gray-400 mt-1 italic">Click to drill down into departments</div>
            </div>
          `;
        },
      },
      grid: {
        borderColor: "#f1f5f9",
        strokeDashArray: 4,
      },
    };
  }, [bloom, onDrilldownToLevel2]);

  // Chart config for Department Pass Percentages (Internal vs External)
  const passComparisonSeries = useMemo(() => {
    return [
      {
        name: "Continuous Internal Assessment (CIA) Pass %",
        data: passPercentages.department_summary.map((d) => d.internal_pass_percentage),
      },
      {
        name: "Semester External Exam Pass %",
        data: passPercentages.department_summary.map((d) => d.external_pass_percentage),
      },
    ];
  }, [passPercentages]);

  const passComparisonOptions: any = useMemo(() => {
    return {
      chart: {
        type: "bar",
        height: 320,
        toolbar: { show: false },
        events: {
          dataPointSelection: (_event: any, _chartContext: any, config: any) => {
            const dept = passPercentages.department_summary[config.dataPointIndex];
            if (dept) {
              onDrilldownToLevel2({ departmentId: dept.department_id, focus: "exams" });
            }
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: "55%",
          borderRadius: 6,
          dataLabels: { position: "top" },
        },
      },
      colors: ["#0284c7", "#10b981"],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val}%`,
        offsetX: 28,
        style: {
          fontSize: "11px",
          fontWeight: 600,
          colors: ["#475569"],
        },
      },
      xaxis: {
        categories: passPercentages.department_summary.map((d) => `${d.department_code} (${d.total_students})`),
        max: 100,
        labels: {
          formatter: (v: number) => `${v}%`,
        },
      },
      legend: {
        position: "top",
        horizontalAlign: "right",
        fontSize: "12px",
      },
      grid: {
        borderColor: "#f1f5f9",
        strokeDashArray: 4,
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: (val: number) => `${val}% Pass Rate (Benchmark ≥ 50%)`,
        },
      },
    };
  }, [passPercentages, onDrilldownToLevel2]);

  return (
    <div className="space-y-6">
      {/* ── Executive KPI Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total College Enrollment */}
        <div
          onClick={() => onDrilldownToLevel2()}
          className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Enrolled</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {kpi.total_college_enrollment.toLocaleString()}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">100% Evaluated Students</div>
          </div>
        </div>

        {/* Overall Internal Pass % */}
        <div
          onClick={() => onDrilldownToLevel2({ focus: "exams" })}
          className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-emerald-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Internal Pass Rate</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {kpi.overall_internal_pass_pct}%
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">CIA Assessments</div>
          </div>
        </div>

        {/* Overall External Pass % */}
        <div
          onClick={() => onDrilldownToLevel2({ focus: "exams" })}
          className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-emerald-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">External Pass Rate</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {kpi.overall_external_pass_pct}%
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Semester External</div>
          </div>
        </div>

        {/* Dominant Bloom Level */}
        <div
          onClick={() => onDrilldownToLevel2({ focus: "bloom" })}
          className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-amber-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Dominant Bloom</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {kpi.dominant_bloom_level}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">33.5% of students</div>
          </div>
        </div>

        {/* Total Active Departments */}
        <div
          onClick={() => onDrilldownToLevel2()}
          className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-purple-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Departments</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {kpi.total_active_departments}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Click to view all</div>
          </div>
        </div>

        {/* Total Courses Running */}
        <div
          onClick={() => onDrilldownToLevel2()}
          className="p-4 rounded-2xl bg-white dark:bg-[#1a2234] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-indigo-500/40 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Running Courses</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {kpi.total_courses_running}
            </div>
            <div className="text-[11px] text-gray-400 mt-0.5">Across All Semesters</div>
          </div>
        </div>
      </div>

      {/* ── College-Wide Bloom Distribution Columns ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Whole College Bloom's Taxonomy Cognitive Distribution
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                Latest Academic Year ({bloom.academic_year})
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Classified by each student's highest achieved Bloom mastery level with ≥ 50% marks.
              Clicking anywhere below drills down into department-wise comparisons.
            </p>
          </div>

          <button
            onClick={() => onDrilldownToLevel2({ focus: "bloom" })}
            className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-dark transition-colors px-3 py-1.5 rounded-lg border border-primary/20 hover:bg-primary/5"
          >
            <span>View Department-Wise Graphs</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        {/* 6 Columns Grid - One per Bloom level */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {bloom.bloom_levels.map((item) => {
            const colorCfg = BLOOM_COLORS[item.level] || BLOOM_COLORS.K1;
            return (
              <div
                key={item.level}
                onClick={() => onDrilldownToLevel2({ focus: "bloom" })}
                className={`p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 group ${colorCfg.lightBg}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black px-2 py-0.5 rounded-md text-white ${colorCfg.bg}`}>
                    {item.level}
                  </span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {item.percentage}%
                  </span>
                </div>

                <div className="mt-2.5">
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-100">
                    {item.name}
                  </div>
                  <div className="text-xl font-extrabold text-gray-900 dark:text-white mt-1">
                    {item.student_count.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.description}
                  </div>
                </div>

                {/* Mini progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colorCfg.bg}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ApexChart Visualization */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800/80">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Interactive Column Overview (Click bar to drill down)
          </div>
          <div className="min-h-[280px]">
            <ReactApexChart
              options={bloomChartOptions}
              series={bloomChartSeries}
              type="bar"
              height={280}
            />
          </div>
        </div>
      </div>

      {/* ── Internal & External Exam Pass % Across Departments ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Pass Percentages in Internal & External Exams Across Departments
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Passing benchmark set to ≥ 50.0% marks. Compares Continuous Internal Assessments (CIA) vs. External Semester Exams.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span className="w-3 h-3 rounded-sm bg-sky-600 inline-block" />
              Internal Exam Pass %
            </span>
            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              External Exam Pass %
            </span>
          </div>
        </div>

        {/* Pass Percentages Chart */}
        <div className="min-h-[320px]">
          <ReactApexChart
            options={passComparisonOptions}
            series={passComparisonSeries}
            type="bar"
            height={320}
          />
        </div>

        {/* Department Table Overview with direct Level 3 drill-down */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Total Students</th>
                <th className="py-3 px-4 text-center">Internal Pass %</th>
                <th className="py-3 px-4 text-center">External Pass %</th>
                <th className="py-3 px-4 text-center">Variance</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {passPercentages.department_summary.map((dept) => {
                const diff = (dept.internal_pass_percentage - dept.external_pass_percentage).toFixed(1);
                return (
                  <tr
                    key={dept.department_id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {dept.department_code}
                      </span>
                      <span>{dept.department_name}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-gray-600 dark:text-gray-300">
                      {dept.total_students}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md font-bold text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300">
                        {dept.internal_pass_percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {dept.external_pass_percentage}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-500">
                      +{diff}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDrilldownToLevel3(dept.department_id, dept.department_name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all shadow-sm"
                      >
                        <span>Deep Dive Courses</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollegeOverviewView;
