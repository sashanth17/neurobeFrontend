import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import {
  FileSpreadsheet,
  Download,
  Search,
  RefreshCw,
  Award,
  Layers,
  CheckCircle2,
  Users,
  Target,
  BarChart3,
  TrendingUp,
  GraduationCap,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Percent,
} from "lucide-react";
import Models from "@/imports/models.import";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import {
  NormalizedAttainmentData,
  AttainmentCalculationSummary,
  fetchComprehensiveExtractionResults,
  normalizeComprehensiveExtractionData,
  calculateComprehensiveAttainment,
  exportComprehensiveAttainmentToExcel,
} from "@/services/attainmentReportService";

interface CourseAttainmentReportProps {
  courseId?: string | number | null;
  offeringId?: string | number | null;
  courseMetadata?: any;
}

const CourseAttainmentReport: React.FC<CourseAttainmentReportProps> = ({
  courseId,
  offeringId,
  courseMetadata,
}) => {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [targetPercentage, setTargetPercentage] = useState<number>(60);
  const [attainmentData, setAttainmentData] = useState<NormalizedAttainmentData | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | number | null>(null);

  // Course instances state
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | number | null>(null);
  const [courseDetail, setCourseDetail] = useState<any>(null);

  // Fetch Course details and available instances
  useEffect(() => {
    const fetchCourseAndInstances = async () => {
      const activeCourseId = courseId || 1;
      try {
        const [cRes, iRes]: [any, any] = await Promise.all([
          Models.course.detail(activeCourseId).catch(() => null),
          Models.course_instance.list({ course_id: activeCourseId }).catch(() => null),
        ]);

        if (cRes) {
          setCourseDetail(cRes);
        }

        // Build list of instances from course detail and instance list
        let instList: any[] = [];
        if (Array.isArray(iRes)) {
          instList = iRes;
        } else if (iRes?.data && Array.isArray(iRes.data)) {
          instList = iRes.data;
        } else if (cRes?.instances && Array.isArray(cRes.instances)) {
          instList = cRes.instances;
        } else if (cRes?.course_instances && Array.isArray(cRes.course_instances)) {
          instList = cRes.course_instances;
        }

        // If specific instance id is on course detail and not in list
        if (cRes?.course_instance_id && !instList.some((inst) => String(inst.id) === String(cRes.course_instance_id))) {
          instList.unshift({
            id: cRes.course_instance_id,
            course_instance_name: `Instance #${cRes.course_instance_id}`,
            coordinator_name: cRes.coordinator_name || null,
          });
        }

        if (instList.length === 0) {
          instList = [{ id: 1, course_instance_name: "Instance 1" }];
        }

        setInstances(instList);

        // Determine active instance ID
        const urlInstanceId = (router.query.course_instance_id as string) || (router.query.instance_id as string);
        const resolvedInstanceId =
          urlInstanceId ||
          cRes?.course_instance_id ||
          (instList[0]?.id ? String(instList[0].id) : "1");

        setSelectedInstanceId(resolvedInstanceId);
      } catch (err) {
        console.warn("Failed to fetch course detail or instances:", err);
      }
    };

    fetchCourseAndInstances();
  }, [courseId]);

  // Fetch extraction results for the active course and selected instance
  const loadExtractionData = async (instanceIdToUse?: string | number | null) => {
    setLoading(true);
    try {
      const activeCourseId = courseId || 1;
      const instId =
        instanceIdToUse !== undefined
          ? instanceIdToUse
          : selectedInstanceId || (router.query.course_instance_id as string) || 1;

      const raw = await fetchComprehensiveExtractionResults(activeCourseId, instId);

      // Find selected instance for coordinator details
      const matchedInst = instances.find((i) => String(i.id) === String(instId));
      const actualCoordinator = (
        matchedInst?.coordinator_name ||
        courseDetail?.coordinator_name ||
        courseMetadata?.coordinator_name ||
        courseMetadata?.course_coordinator ||
        ""
      ).trim();

      const normalized = normalizeComprehensiveExtractionData(
        raw,
        targetPercentage,
        actualCoordinator
      );

      // Overlay course metadata if present
      if (courseMetadata || courseDetail) {
        const meta = courseMetadata || courseDetail;
        normalized.course_code = meta.course_code || normalized.course_code;
        normalized.course_name = meta.course_title || normalized.course_name;
        if (meta.semester) {
          normalized.year_sem = `Year II / Sem ${meta.semester}`;
        }
        if (meta.department_name) {
          normalized.department_name = meta.department_name;
        }
      }

      setAttainmentData(normalized);
    } catch (err: any) {
      console.error("Failed to load comprehensive extraction results:", err);
      Failure(getErrorMessage(err, "Failed to load comprehensive extraction results"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedInstanceId !== null) {
      loadExtractionData(selectedInstanceId);
    }
  }, [selectedInstanceId, courseId]);

  // Handle instance dropdown change
  const handleInstanceChange = (newInstanceId: string) => {
    setSelectedInstanceId(newInstanceId);
    // Update router query without full page reload
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          course_instance_id: newInstanceId,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  // Dynamic calculations based on target percentage
  const summary: AttainmentCalculationSummary | null = useMemo(() => {
    if (!attainmentData) return null;
    return calculateComprehensiveAttainment(attainmentData, targetPercentage);
  }, [attainmentData, targetPercentage]);

  // Filter students based on search input
  const filteredStudents = useMemo(() => {
    if (!attainmentData) return [];
    if (!searchQuery.trim()) return attainmentData.students;
    const q = searchQuery.toLowerCase().trim();
    return attainmentData.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.register_no.toLowerCase().includes(q) ||
        String(s.student_id).toLowerCase().includes(q)
    );
  }, [attainmentData, searchQuery]);

  // Handle Excel Export
  const handleExportExcel = () => {
    if (!attainmentData || !summary) {
      Failure("Attainment data is not ready for export");
      return;
    }
    try {
      setExporting(true);
      const filename = `${attainmentData.course_code}_CO_Attainment_Report.xlsx`;
      exportComprehensiveAttainmentToExcel(attainmentData, summary, filename);
      Success("Attainment report exported to Excel successfully!");
    } catch (err: any) {
      console.error("Excel export error:", err);
      Failure(getErrorMessage(err, "Failed to export Excel file"));
    } finally {
      setExporting(false);
    }
  };

  const formatMark = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "-";
    return Number(val.toFixed(2));
  };

  if (loading && !attainmentData) {
    return (
      <div className="flex min-h-[460px] flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          Fetching Extraction Results...
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Loading student evaluation marks for Course Instance {selectedInstanceId ? `#${selectedInstanceId}` : ""}
        </p>
      </div>
    );
  }

  if (!attainmentData) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
        <p className="font-semibold">Unable to load attainment data</p>
        <button
          type="button"
          onClick={() => loadExtractionData()}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  const hasCoordinator = Boolean(attainmentData.course_coordinator && attainmentData.course_coordinator.trim() !== "");

  return (
    <div className="space-y-6">
      {/* ── Control & Action Toolbar (Aligned with Page UI) ── */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              {attainmentData.course_code}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Extraction Results
            </span>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {attainmentData.total_strength} Students Enrolled
            </span>
            {hasCoordinator && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Coord: {attainmentData.course_coordinator}
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {attainmentData.course_name} — Outcome Attainment Report
          </h2>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Target Percentage Quick Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-700 dark:bg-slate-800/80">
            <span className="px-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Target:
            </span>
            {[50, 60, 70, 80].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setTargetPercentage(pct)}
                className={`rounded-lg px-2 py-1 text-xs font-bold transition ${targetPercentage === pct
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
              >
                {pct}%
              </button>
            ))}
          </div>
          {/* Course Instance Filter Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800/80">
            <Layers className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
            <label htmlFor="course-instance-select" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Instance:
            </label>
            <select
              id="course-instance-select"
              value={selectedInstanceId || ""}
              onChange={(e) => handleInstanceChange(e.target.value)}
              className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {instances.map((inst) => (
                <option key={inst.id} value={String(inst.id)}>
                  {inst.course_instance_name || `Instance #${inst.id}`} {inst.semester ? `(Sem ${inst.semester})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student or reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 w-48 rounded-xl border border-slate-200 bg-white pl-8 pr-7 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => loadExtractionData()}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            title="Refresh Extraction Results"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-indigo-500" : ""}`} />
            <span>Refresh</span>
          </button>

          {/* Export as Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{exporting ? "Exporting..." : "Export as Excel"}</span>
          </button>
        </div>
      </div>

      {/* ── CO Attainment KPI Cards (Clean SaaS Design) ── */}
      {summary && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {attainmentData.cos.map((co) => {
            const data = summary.cos_summary[co];
            const level = data?.attainment_level || 0;
            const levelColor =
              level === 3
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                : level === 2
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400"
                  : level === 1
                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400"
                    : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400";

            return (
              <div
                key={co}
                className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                      {co}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Max {data?.max_marks || 0} Marks)
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${levelColor}`}
                  >
                    Level {level}
                  </span>
                </div>

                <div className="mt-3 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {data?.percentage_above_target || 0}%
                    </span>
                    <span className="ml-1.5 text-xs text-slate-500 dark:text-slate-400">
                      students ≥ {targetPercentage}%
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {data?.students_above_target_count || 0} / {summary.total_students}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${level === 3
                        ? "bg-emerald-500"
                        : level === 2
                          ? "bg-blue-500"
                          : level === 1
                            ? "bg-amber-500"
                            : "bg-slate-400"
                      }`}
                    style={{ width: `${Math.min(data?.percentage_above_target || 0, 100)}%` }}
                  />
                </div>

                <div className="mt-3 flex justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span>Target Value:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {data?.target_value} marks
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Main Sheet Container (Excel-Identical Structure, Modern SaaS Alignment) ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Institutional & Academic Header Strip */}
        <div className="border-b border-slate-100 bg-slate-50/60 p-6 text-center dark:border-slate-800 dark:bg-slate-800/40">
          <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 dark:text-white sm:text-lg">
            Karpagam Institute of Technology, Coimbatore - 641105
          </h3>
          <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            {attainmentData.department_name}
          </p>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {attainmentData.academic_year}
          </p>
          <div className="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
            Internal Assessment — Attainment of Course Outcomes (Through Direct Assessment)
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* ── Course Information & Attainment Level Scale Table (Unified Exact Excel Structure) ── */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full border-collapse text-xs">
              <tbody>
                {/* 1. Course Code */}
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="w-48 border-r border-slate-200 bg-slate-50/70 p-2.5 font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    COURSE CODE
                  </td>
                  <td className="border-r border-slate-200 p-2.5 font-mono font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                    {attainmentData.course_code}
                  </td>
                  <td className="w-48 border-r border-slate-200 bg-slate-50/70 p-2.5 font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    YEAR / SEM / CLASS
                  </td>
                  <td className="w-44 p-2.5 font-bold text-slate-900 dark:text-white">
                    {attainmentData.year_sem}
                  </td>
                </tr>

                {/* 2. Course Title */}
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <td className="w-48 border-r border-slate-200 bg-slate-50/70 p-2.5 font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    COURSE TITLE
                  </td>
                  <td className="border-r border-slate-200 p-2.5 font-bold uppercase text-slate-900 dark:border-slate-700 dark:text-white">
                    {attainmentData.course_name}
                  </td>
                  <td className="w-48 border-r border-slate-200 bg-slate-50/70 p-2.5 font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                    TARGET (%)
                  </td>
                  <td className="w-44 p-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                    {targetPercentage}%
                  </td>
                </tr>

                {/* 3. Course Coordinator & Total Strength */}
                {hasCoordinator ? (
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="w-48 border-r border-slate-200 bg-slate-50/70 p-2.5 font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                      COURSE COORDINATOR
                    </td>
                    <td className="border-r border-slate-200 p-2.5 font-medium text-slate-900 dark:border-slate-700 dark:text-white">
                      {attainmentData.course_coordinator}
                    </td>
                    <td className="w-48 border-r border-slate-200 bg-slate-50/70 p-2.5 font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                      TOTAL STRENGTH
                    </td>
                    <td className="w-44 p-2.5 font-bold text-slate-900 dark:text-white">
                      {attainmentData.total_strength}
                    </td>
                  </tr>
                ) : (
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="w-48 border-r border-slate-200 bg-slate-50/70 p-2.5 font-bold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                      TOTAL STRENGTH
                    </td>
                    <td colSpan={3} className="p-2.5 font-bold text-slate-900 dark:text-white">
                      {attainmentData.total_strength} Students Enrolled
                    </td>
                  </tr>
                )}

                {/* 4. Attainment Level Header */}
                <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/60 font-bold">
                  <td
                    rowSpan={attainmentData.attainment_levels.length + 1}
                    className="w-48 border-r border-slate-200 p-3 text-center font-bold uppercase text-slate-700 dark:border-slate-700 dark:text-slate-300 align-middle bg-slate-50/90 dark:bg-slate-800/80"
                  >
                    ATTAINMENT LEVEL
                  </td>
                  <td className="w-32 border-r border-slate-200 p-2 text-center font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    Level
                  </td>
                  <td
                    colSpan={2}
                    className="p-2 text-center font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300"
                  >
                    Range
                  </td>
                </tr>

                {/* 5. Attainment Levels (1, 2, 3) */}
                {attainmentData.attainment_levels.map((lvl, idx) => (
                  <tr
                    key={lvl.level}
                    className={
                      idx < attainmentData.attainment_levels.length - 1
                        ? "border-b border-slate-200 dark:border-slate-700"
                        : ""
                    }
                  >
                    <td className="w-32 border-r border-slate-200 p-2 text-center font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                      {lvl.level}
                    </td>
                    <td
                      colSpan={2}
                      className="p-2 text-left font-medium text-slate-700 dark:text-slate-300"
                    >
                      {lvl.range}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Main Assessment Spreadsheet Matrix Table ── */}
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-xs dark:border-slate-700">
            <div className="max-h-[720px] overflow-auto">
              <table className="w-full border-collapse text-center text-xs">
                {/* ── Table Headers ── */}
                <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800">
                  {/* Header Row 1 */}
                  <tr className="border-b border-slate-200 font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                    <th
                      rowSpan={2}
                      className="sticky left-0 z-30 min-w-[50px] border-r border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-800"
                    >
                      S.NO
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky left-[50px] z-30 min-w-[130px] border-r border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-800"
                    >
                      REG NO
                    </th>
                    <th
                      rowSpan={2}
                      className="sticky left-[180px] z-30 min-w-[190px] border-r border-slate-200 bg-slate-100 p-2 text-left dark:border-slate-700 dark:bg-slate-800"
                    >
                      NAME OF THE STUDENT
                    </th>

                    {/* Dynamic Tests Header Spans */}
                    {attainmentData.tests.map((test) => (
                      <th
                        key={test.test_id}
                        colSpan={test.cos.length}
                        className="border-r border-slate-200 p-2 text-center uppercase tracking-tight dark:border-slate-700"
                      >
                        {test.test_name} - MARKS ALLOTTED
                      </th>
                    ))}

                    {/* Cumulative CO Header Span */}
                    <th colSpan={attainmentData.cos.length} className="p-2 text-center uppercase tracking-tight">
                      CO WISE MARKS SCORED
                    </th>
                  </tr>

                  {/* Header Row 2 (Sub-headers: C1..Cn) */}
                  <tr className="border-b border-slate-200 font-bold text-slate-700 dark:border-slate-700 dark:text-slate-300">
                    {/* Per-test CO columns */}
                    {attainmentData.tests.map((test) =>
                      test.cos.map((co) => (
                        <th
                          key={`${test.test_id}-${co}`}
                          className="min-w-[48px] border-r border-slate-200 p-1.5 text-center dark:border-slate-700"
                        >
                          {co.replace("CO", "C")}
                        </th>
                      ))
                    )}
                    {/* Total CO columns */}
                    {attainmentData.cos.map((co, idx) => (
                      <th
                        key={`tot-${co}`}
                        className={`min-w-[48px] p-1.5 text-center ${idx < attainmentData.cos.length - 1
                            ? "border-r border-slate-200 dark:border-slate-700"
                            : ""
                          }`}
                      >
                        {co.replace("CO", "C")}
                      </th>
                    ))}
                  </tr>

                  {/* Header Row 3 (Allotted Marks - Distinct Blue Text) */}
                  <tr className="border-b-2 border-slate-300 bg-sky-50/70 font-bold text-sky-700 dark:border-slate-600 dark:bg-sky-950/30 dark:text-sky-300">
                    <td className="sticky left-0 z-30 border-r border-slate-200 bg-sky-50 dark:border-slate-700 dark:bg-sky-950/40 p-1.5"></td>
                    <td className="sticky left-[50px] z-30 border-r border-slate-200 bg-sky-50 dark:border-slate-700 dark:bg-sky-950/40 p-1.5"></td>
                    <td className="sticky left-[180px] z-30 border-r border-slate-200 bg-sky-50 dark:border-slate-700 dark:bg-sky-950/40 p-1.5 text-left uppercase text-[11px] tracking-wider text-sky-800 dark:text-sky-200">
                      MARKS ALLOTTED
                    </td>

                    {/* Per-test Max Marks */}
                    {attainmentData.tests.map((test) =>
                      test.cos.map((co) => (
                        <td
                          key={`max-${test.test_id}-${co}`}
                          className="border-r border-slate-200 p-1.5 dark:border-slate-700"
                        >
                          {test.max_marks[co] ?? "-"}
                        </td>
                      ))
                    )}

                    {/* Total Max Marks across tests */}
                    {attainmentData.cos.map((co, idx) => (
                      <td
                        key={`max-tot-${co}`}
                        className={`p-1.5 font-black text-sky-900 dark:text-sky-100 ${idx < attainmentData.cos.length - 1
                            ? "border-r border-slate-200 dark:border-slate-700"
                            : ""
                          }`}
                      >
                        {attainmentData.co_max_totals[co] ?? "-"}
                      </td>
                    ))}
                  </tr>
                </thead>

                {/* ── Student Rows ── */}
                <tbody className="divide-y divide-slate-100 text-slate-800 dark:divide-slate-800 dark:text-slate-200">
                  {filteredStudents.map((st, idx) => {
                    const isExpanded = expandedStudentId === st.student_id;

                    return (
                      <React.Fragment key={st.student_id}>
                        <tr className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                          {/* S.No */}
                          <td className="sticky left-0 z-10 border-r border-slate-200 bg-white p-2 font-mono text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                            {idx + 1}
                          </td>
                          {/* Reg No */}
                          <td className="sticky left-[50px] z-10 border-r border-slate-200 bg-white p-2 font-mono text-[11px] font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                            {st.register_no}
                          </td>
                          {/* Student Name */}
                          <td className="sticky left-[180px] z-10 border-r border-slate-200 bg-white p-2 text-left font-semibold text-slate-900 truncate max-w-[210px] dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                            <div className="flex items-center justify-between">
                              <span className="truncate">{st.name}</span>
                              {st.test_details && Object.keys(st.test_details).length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedStudentId(isExpanded ? null : st.student_id)
                                  }
                                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-0.5"
                                  title="Toggle question breakdown"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Per-test Marks */}
                          {attainmentData.tests.map((test) =>
                            test.cos.map((co) => (
                              <td
                                key={`st-${st.student_id}-${test.test_id}-${co}`}
                                className="border-r border-slate-100 p-1.5 font-medium tabular-nums dark:border-slate-800"
                              >
                                {formatMark(st.test_marks[test.test_id]?.[co])}
                              </td>
                            ))
                          )}

                          {/* Cumulative CO Total Marks */}
                          {attainmentData.cos.map((co, cIdx) => {
                            const score = st.co_totals[co] ?? 0;
                            const target = summary?.cos_summary?.[co]?.target_value || 0;
                            const isAbove = score >= target - 0.001;

                            return (
                              <td
                                key={`st-${st.student_id}-tot-${co}`}
                                className={`p-1.5 font-bold tabular-nums ${cIdx < attainmentData.cos.length - 1
                                    ? "border-r border-slate-100 dark:border-slate-800"
                                    : ""
                                  } ${isAbove
                                    ? "text-emerald-700 dark:text-emerald-400"
                                    : "text-slate-600 dark:text-slate-400"
                                  }`}
                              >
                                {score}
                              </td>
                            );
                          })}
                        </tr>

                        {/* Optional Question-Level Detail Row */}
                        {isExpanded && st.test_details && (
                          <tr className="bg-indigo-50/30 dark:bg-indigo-950/20 text-[11px]">
                            <td colSpan={3} className="sticky left-0 border-r border-slate-200 bg-indigo-50/40 p-2.5 text-left font-semibold text-indigo-900 dark:border-slate-700 dark:bg-indigo-950/40 dark:text-indigo-200">
                              Question Breakdown for {st.name}:
                            </td>
                            <td colSpan={100} className="p-2.5 text-left">
                              <div className="flex flex-wrap gap-2">
                                {Object.values(st.test_details).map((td) => (
                                  <div
                                    key={td.cia_test_id}
                                    className="rounded-lg border border-indigo-100 bg-white p-2 shadow-2xs dark:border-slate-700 dark:bg-slate-800"
                                  >
                                    <p className="font-bold text-slate-800 dark:text-slate-200">
                                      {td.cia_test_name} (Total: {td.final_total_mark} / {td.actual_max_mark})
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                      {(td.marks || []).map((m, mIdx) => (
                                        <span
                                          key={mIdx}
                                          className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                                        >
                                          {m.question_key} ({m.target_co}): {m.final_mark}/{m.max_marks_assigned}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}

                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={100} className="p-8 text-center text-xs text-slate-400">
                        No students found matching "{searchQuery}".
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* ── Summary Calculation Rows (Exact Match) ── */}
                {summary && (
                  <tfoot className="border-t-2 border-slate-300 bg-slate-50 text-xs font-bold text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                    {/* Row 1: CO's Target Value */}
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <td
                        colSpan={3}
                        className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 p-2.5 text-right font-extrabold uppercase dark:border-slate-700 dark:bg-slate-800"
                      >
                        CO's Target Value
                      </td>
                      <td
                        colSpan={attainmentData.tests.reduce((acc, t) => acc + t.cos.length, 0)}
                        className="border-r border-slate-200 p-2 text-center text-slate-400 dark:border-slate-700"
                      >
                        ({targetPercentage}% of CO Total Allotted Marks)
                      </td>
                      {attainmentData.cos.map((co, idx) => (
                        <td
                          key={`sum-target-${co}`}
                          className={`p-2 font-mono font-extrabold text-indigo-700 dark:text-indigo-400 ${idx < attainmentData.cos.length - 1
                              ? "border-r border-slate-200 dark:border-slate-700"
                              : ""
                            }`}
                        >
                          {summary.cos_summary[co]?.target_value}
                        </td>
                      ))}
                    </tr>

                    {/* Row 2: No. of Students scored above Target Value */}
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <td
                        colSpan={3}
                        className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 p-2.5 text-right font-extrabold uppercase dark:border-slate-700 dark:bg-slate-800"
                      >
                        No. of Students scored above CO's Target Value
                      </td>
                      <td
                        colSpan={attainmentData.tests.reduce((acc, t) => acc + t.cos.length, 0)}
                        className="border-r border-slate-200 p-2 text-center text-slate-400 dark:border-slate-700"
                      >
                        —
                      </td>
                      {attainmentData.cos.map((co, idx) => (
                        <td
                          key={`sum-count-${co}`}
                          className={`p-2 font-mono font-extrabold text-slate-900 dark:text-white ${idx < attainmentData.cos.length - 1
                              ? "border-r border-slate-200 dark:border-slate-700"
                              : ""
                            }`}
                        >
                          {summary.cos_summary[co]?.students_above_target_count}
                        </td>
                      ))}
                    </tr>

                    {/* Row 3: Percentage of Students scored above Target */}
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <td
                        colSpan={3}
                        className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 p-2.5 text-right font-extrabold uppercase dark:border-slate-700 dark:bg-slate-800"
                      >
                        Percentage of Students scored above Target
                      </td>
                      <td
                        colSpan={attainmentData.tests.reduce((acc, t) => acc + t.cos.length, 0)}
                        className="border-r border-slate-200 p-2 text-center text-slate-400 dark:border-slate-700"
                      >
                        —
                      </td>
                      {attainmentData.cos.map((co, idx) => (
                        <td
                          key={`sum-pct-${co}`}
                          className={`p-2 font-mono font-extrabold ${summary.cos_summary[co]?.attainment_level > 0
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-600 dark:text-slate-300"
                            } ${idx < attainmentData.cos.length - 1
                              ? "border-r border-slate-200 dark:border-slate-700"
                              : ""
                            }`}
                        >
                          {summary.cos_summary[co]?.percentage_above_target}%
                        </td>
                      ))}
                    </tr>

                    {/* Row 4: CO Attainment Level */}
                    <tr className="border-b border-slate-200 bg-indigo-50/50 dark:border-slate-700 dark:bg-indigo-950/20">
                      <td
                        colSpan={3}
                        className="sticky left-0 z-10 border-r border-slate-200 bg-indigo-50/70 p-2.5 text-right font-extrabold uppercase text-indigo-900 dark:border-slate-700 dark:bg-indigo-950/50 dark:text-indigo-200"
                      >
                        CO Attainment
                      </td>
                      <td
                        colSpan={attainmentData.tests.reduce((acc, t) => acc + t.cos.length, 0)}
                        className="border-r border-slate-200 p-2 text-center text-xs font-semibold text-indigo-600 dark:border-slate-700 dark:text-indigo-400"
                      >
                        Level achieved based on % students above target
                      </td>
                      {attainmentData.cos.map((co, idx) => {
                        const lvl = summary.cos_summary[co]?.attainment_level || 0;
                        return (
                          <td
                            key={`sum-level-${co}`}
                            className={`p-2 font-mono text-sm font-black ${lvl > 0
                                ? "text-indigo-700 dark:text-indigo-300"
                                : "text-slate-500 dark:text-slate-400"
                              } ${idx < attainmentData.cos.length - 1
                                ? "border-r border-slate-200 dark:border-slate-700"
                                : ""
                              }`}
                          >
                            {lvl.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Row 5: CO attainment Values to plot the Graph */}
                    <tr>
                      <td
                        colSpan={3}
                        className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 p-2.5 text-right font-extrabold uppercase text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        CO attainment Values to plot the Graph
                      </td>
                      <td
                        colSpan={attainmentData.tests.reduce((acc, t) => acc + t.cos.length, 0)}
                        className="border-r border-slate-200 p-2 text-center text-slate-400 dark:border-slate-700"
                      >
                        —
                      </td>
                      {attainmentData.cos.map((co, idx) => (
                        <td
                          key={`sum-graph-${co}`}
                          className={`p-2 font-mono text-sm font-extrabold text-slate-900 dark:text-white ${idx < attainmentData.cos.length - 1
                              ? "border-r border-slate-200 dark:border-slate-700"
                              : ""
                            }`}
                        >
                          {summary.cos_summary[co]?.attainment_level || 0}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* ── Signatures Section ── */}
          <div className="mt-8 flex items-center justify-between px-6 pt-4 text-xs font-bold text-slate-800 dark:text-slate-200">
            <div>
              <div className="h-0.5 w-40 bg-slate-400 dark:bg-slate-600 mb-2"></div>
              <p>Faculty Incharge</p>
              {hasCoordinator ? (
                <p className="text-[11px] font-medium text-slate-500">
                  {attainmentData.course_coordinator}
                </p>
              ) : null}
            </div>
            <div className="text-right">
              <div className="h-0.5 w-40 bg-slate-400 dark:bg-slate-600 mb-2 ml-auto"></div>
              <p>Head of the Department (HoD)</p>
              <p className="text-[11px] font-medium text-slate-500">
                {attainmentData.department_name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseAttainmentReport;
