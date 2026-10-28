import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  DepartmentBloomComparisonResponse,
  FilterDepartment,
} from "@/services/academicAdminAnalytics.service";
import SlidingChartToggle from "./SlidingChartToggle";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DepartmentDrilldownViewProps {
  data: DepartmentBloomComparisonResponse;
  allDepartments: FilterDepartment[];
  selectedDepartmentIds: number[];
  onToggleDepartment: (deptId: number) => void;
  onSelectAllDepartments: () => void;
  onDrilldownToLevel3: (departmentId: number, departmentName: string) => void;
  onBackToLevel1: () => void;
}

const DEPT_COLORS = [
  "#2563eb", // CSE - Blue
  "#06b6d4", // IT - Cyan
  "#8b5cf6", // ECE - Purple
  "#f59e0b", // MECH - Amber
  "#64748b", // CIVIL - Slate
  "#10b981", // AIDS - Emerald
  "#ec4899", // Pink
  "#f97316", // Orange
];

export const DepartmentDrilldownView: React.FC<DepartmentDrilldownViewProps> = ({
  data,
  allDepartments,
  selectedDepartmentIds,
  onToggleDepartment,
  onSelectAllDepartments,
  onDrilldownToLevel3,
  onBackToLevel1,
}) => {
  const [chartType, setChartType] = useState<"line" | "bar">("line");
  const [metricMode, setMetricMode] = useState<"percentages" | "counts">("percentages");
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  // Filtered department list based on selected IDs
  const activeDepartments = useMemo(() => {
    if (!selectedDepartmentIds || selectedDepartmentIds.length === 0) {
      return data.departments_data;
    }
    return data.departments_data.filter((d) => selectedDepartmentIds.includes(d.department_id));
  }, [data, selectedDepartmentIds]);

  // Chart Series construction
  const chartSeries = useMemo(() => {
    return activeDepartments.map((dept) => {
      const source = metricMode === "percentages" ? dept.percentages : dept.counts;
      return {
        name: `${dept.department_code} - ${dept.department_name}`,
        department_id: dept.department_id,
        department_name: dept.department_name,
        data: data.categories.map((k) => source[k] || 0),
      };
    });
  }, [activeDepartments, data.categories, metricMode]);

  // Chart Options
  const chartOptions: any = useMemo(() => {
    const isLine = chartType === "line";

    return {
      chart: {
        type: isLine ? "line" : "bar",
        height: 380,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 600,
        },
        events: {
          dataPointSelection: (_e: any, _chartContext: any, config: any) => {
            const seriesIndex = config.seriesIndex;
            const targetDept = activeDepartments[seriesIndex];
            if (targetDept) {
              onDrilldownToLevel3(targetDept.department_id, targetDept.department_name);
            }
          },
          markerClick: (_e: any, _chartContext: any, { seriesIndex }: any) => {
            const targetDept = activeDepartments[seriesIndex];
            if (targetDept) {
              onDrilldownToLevel3(targetDept.department_id, targetDept.department_name);
            }
          },
        },
      },
      stroke: {
        curve: "smooth",
        width: isLine ? 3 : 1,
      },
      colors: DEPT_COLORS.slice(0, activeDepartments.length),
      markers: {
        size: isLine ? 5 : 0,
        hover: {
          size: 8,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: "55%",
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: data.categories.map((c) => {
          const map: Record<string, string> = {
            K1: "K1 (Remember)",
            K2: "K2 (Understand)",
            K3: "K3 (Apply)",
            K4: "K4 (Analyze)",
            K5: "K5 (Evaluate)",
            K6: "K6 (Create)",
          };
          return map[c] || c;
        }),
        labels: {
          style: {
            fontSize: "12px",
            fontWeight: 600,
          },
        },
      },
      yaxis: {
        title: {
          text: metricMode === "percentages" ? "Percentage of Department Students (%)" : "Student Count",
          style: { fontSize: "12px", fontWeight: 500, color: "#64748b" },
        },
        labels: {
          formatter: (val: number) => (metricMode === "percentages" ? `${val}%` : `${val}`),
        },
        max: metricMode === "percentages" ? 50 : undefined,
      },
      legend: {
        position: "top",
        horizontalAlign: "left",
        fontSize: "12px",
        fontWeight: 500,
        markers: {
          radius: 12,
        },
      },
      tooltip: {
        theme: "dark",
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) => (metricMode === "percentages" ? `${val.toFixed(2)}%` : `${val} Students`),
        },
      },
      grid: {
        borderColor: "#f1f5f9",
        strokeDashArray: 4,
      },
    };
  }, [chartType, metricMode, activeDepartments, data.categories, onDrilldownToLevel3]);

  return (
    <div className="space-y-6">
      {/* ── Control & Filter Bar ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToLevel1}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Overview</span>
            </button>

            <div>
              <h2 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                Cross-Department Bloom's Taxonomy Level Comparison
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Compare cognitive progression across academic departments. Click any line or bar to inspect courses.
              </p>
            </div>
          </div>

          {/* Sliding Tab Switcher & Metric Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Metric Mode Toggle (Percentage vs Count) */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMetricMode("percentages")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  metricMode === "percentages"
                    ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => setMetricMode("counts")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  metricMode === "counts"
                    ? "bg-white dark:bg-gray-900 text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Student Count
              </button>
            </div>

            {/* Sliding Chart Toggle (Line vs Bar) */}
            <SlidingChartToggle chartType={chartType} onChange={setChartType} />
          </div>
        </div>

        {/* Department Filter Chips */}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">
            Filter Departments:
          </span>

          <button
            onClick={onSelectAllDepartments}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedDepartmentIds.length === 0 || selectedDepartmentIds.length === allDepartments.length
                ? "bg-primary text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            All Departments
          </button>

          {allDepartments.map((dept, index) => {
            const isSelected =
              selectedDepartmentIds.length === 0 || selectedDepartmentIds.includes(dept.id);
            const color = DEPT_COLORS[index % DEPT_COLORS.length];

            return (
              <button
                key={dept.id}
                onClick={() => onToggleDepartment(dept.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                  isSelected
                    ? "border-transparent text-white font-semibold shadow-sm"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-transparent hover:border-gray-300"
                }`}
                style={{
                  backgroundColor: isSelected ? color : "transparent",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? "#fff" : color }}
                />
                <span>{dept.code}</span>
                <span className="text-[10px] opacity-80">({dept.student_count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Interactive Chart ── */}
      <div className="bg-white dark:bg-[#1a2234] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {chartType === "line" ? "Continuous Cognitive Line Chart" : "Categorical Grouped Bar Chart"}
            </span>
            <span className="text-xs text-primary font-medium">
              (Showing {activeDepartments.length} Departments)
            </span>
          </div>

          <div className="text-xs text-gray-400 flex items-center gap-1">
            <svg className="w-4 h-4 text-primary animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <span>Click any department line or bar to drill down to its courses</span>
          </div>
        </div>

        <div className="min-h-[380px]">
          <ReactApexChart
            options={chartOptions}
            series={chartSeries}
            type={chartType}
            height={380}
          />
        </div>
      </div>

      {/* ── Department Breakdown Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeDepartments.map((dept, idx) => {
          const color = DEPT_COLORS[idx % DEPT_COLORS.length];
          return (
            <div
              key={dept.department_id}
              onClick={() => onDrilldownToLevel3(dept.department_id, dept.department_name)}
              onMouseEnter={() => setHoveredDept(dept.department_code)}
              onMouseLeave={() => setHoveredDept(null)}
              className="bg-white dark:bg-[#1a2234] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary/40 cursor-pointer transition-all group flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-bold text-gray-400">
                        {dept.department_code}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mt-1 group-hover:text-primary transition-colors">
                      {dept.department_name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      Attainment: {dept.average_attainment_score}%
                    </span>
                  </div>
                </div>

                {/* K1-K6 Distribution Mini Bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5 font-medium">
                    <span>Bloom K1–K6 Attainment Ratio</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      Peak: K3 ({dept.percentages.K3}%)
                    </span>
                  </div>

                  <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <div style={{ width: `${dept.percentages.K1}%`, backgroundColor: "#3b82f6" }} title={`K1: ${dept.percentages.K1}%`} />
                    <div style={{ width: `${dept.percentages.K2}%`, backgroundColor: "#06b6d4" }} title={`K2: ${dept.percentages.K2}%`} />
                    <div style={{ width: `${dept.percentages.K3}%`, backgroundColor: "#10b981" }} title={`K3: ${dept.percentages.K3}%`} />
                    <div style={{ width: `${dept.percentages.K4}%`, backgroundColor: "#f59e0b" }} title={`K4: ${dept.percentages.K4}%`} />
                    <div style={{ width: `${dept.percentages.K5}%`, backgroundColor: "#f97316" }} title={`K5: ${dept.percentages.K5}%`} />
                    <div style={{ width: `${dept.percentages.K6}%`, backgroundColor: "#8b5cf6" }} title={`K6: ${dept.percentages.K6}%`} />
                  </div>

                  {/* K1-K6 Count badges */}
                  <div className="grid grid-cols-6 gap-1 mt-2 text-center text-[10px] font-bold">
                    <span className="p-1 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600">K1: {dept.counts.K1}</span>
                    <span className="p-1 rounded bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600">K2: {dept.counts.K2}</span>
                    <span className="p-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">K3: {dept.counts.K3}</span>
                    <span className="p-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600">K4: {dept.counts.K4}</span>
                    <span className="p-1 rounded bg-orange-50 dark:bg-orange-950/40 text-orange-600">K5: {dept.counts.K5}</span>
                    <span className="p-1 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-600">K6: {dept.counts.K6}</span>
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  Tap to view courses & MCQs
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Deep Dive</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DepartmentDrilldownView;
