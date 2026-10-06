import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Sliders,
  Scale,
  Grid3X3,
  BookOpen,
  ArrowRight,
  Info,
} from "lucide-react";
import Models from "@/imports/models.import";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import {
  NormalizedAttainmentData,
  AttainmentCalculationSummary,
  WeightedCOAttainment,
  POAttainmentResult,
  COPOMatrixData,
  fetchComprehensiveExtractionResults,
  normalizeComprehensiveExtractionData,
  calculateComprehensiveAttainment,
  calculateWeightedCOAttainment,
  calculatePOAttainment,
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

  // Sub-tab within CO Attainment: "internal" | "weighted" | "po-attainment"
  const [subTab, setSubTab] = useState<"internal" | "weighted" | "po-attainment">("internal");

  // Weightage state
  const [weightInternal, setWeightInternal] = useState<number>(0.6);
  const [weightExternal, setWeightExternal] = useState<number>(0.4);

  // CO-PO matrix state
  const [copoMatrix, setCopoMatrix] = useState<COPOMatrixData | null>(null);
  const [loadingCopo, setLoadingCopo] = useState<boolean>(false);

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

  // Weighted CO attainment calculation
  const weightedCOAttainment: WeightedCOAttainment[] = useMemo(() => {
    if (!attainmentData || !summary) return [];
    return calculateWeightedCOAttainment(attainmentData, summary, weightInternal, weightExternal);
  }, [attainmentData, summary, weightInternal, weightExternal]);

  // PO attainment calculation
  const poAttainment: POAttainmentResult[] = useMemo(() => {
    if (weightedCOAttainment.length === 0 || !copoMatrix) return [];
    return calculatePOAttainment(weightedCOAttainment, copoMatrix);
  }, [weightedCOAttainment, copoMatrix]);

  // Fetch active CO-PO matrix
  const loadCopoMatrix = useCallback(async () => {
    const activeCourseId = courseId || 1;
    setLoadingCopo(true);
    try {
      const res: any = await Models.copo.get_active(activeCourseId);
      if (res && res.matrix_entries) {
        setCopoMatrix(res);
      } else if (res?.copo_id) {
        setCopoMatrix(res);
      }
    } catch (err) {
      console.warn("No active CO-PO matrix found:", err);
      // Try list and get the first one
      try {
        const listRes: any = await Models.copo.list({ course_id: activeCourseId });
        const versions = Array.isArray(listRes) ? listRes : listRes?.data || [];
        if (versions.length > 0) {
          const latest = versions[versions.length - 1];
          const fullRes: any = await Models.copo.get(latest.copo_id || latest.id);
          if (fullRes) setCopoMatrix(fullRes);
        }
      } catch (err2) {
        console.warn("Could not load CO-PO matrix:", err2);
      }
    } finally {
      setLoadingCopo(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCopoMatrix();
  }, [loadCopoMatrix]);

  // Keep Wint + Wext = 1.0
  const handleWeightInternalChange = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setWeightInternal(Number(clamped.toFixed(2)));
    setWeightExternal(Number((1 - clamped).toFixed(2)));
  };
  const handleWeightExternalChange = (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setWeightExternal(Number(clamped.toFixed(2)));
    setWeightInternal(Number((1 - clamped).toFixed(2)));
  };

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

      {/* ── Sub-Tab Navigation ── */}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setSubTab("internal")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${subTab === "internal"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          Internal Assessment
        </button>
        <button
          type="button"
          onClick={() => setSubTab("weighted")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${subTab === "weighted"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
        >
          <Scale className="h-3.5 w-3.5" />
          Weighted CO Attainment
        </button>
        <button
          type="button"
          onClick={() => setSubTab("po-attainment")}
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${subTab === "po-attainment"
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            }`}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          PO Attainment
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SUB-TAB: Internal Assessment (existing content) ──────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {subTab === "internal" && (<>

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
          </div>
        </div>
      </div>
      </>)}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SUB-TAB: Weighted CO Attainment ──────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {subTab === "weighted" && (
        <div className="space-y-6">

          {/* ── Weightage Controls ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Sliders className="h-4 w-4 text-indigo-500" />
                  Internal & External Weightage
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adjust the weightage for internal (CIA + Direct Assessment) and external (End Semester) components. Total must equal 1.0.
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    W<sub>int</sub> (Internal)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weightInternal}
                      onChange={(e) => handleWeightInternalChange(Number(e.target.value))}
                      className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-indigo-200 accent-indigo-600 dark:bg-indigo-900"
                    />
                    <span className="min-w-[40px] rounded-lg bg-indigo-50 px-2 py-1 text-center font-mono text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {weightInternal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-lg font-light text-slate-300 dark:text-slate-600">+</div>

                <div className="flex flex-col items-center gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    W<sub>ext</sub> (External)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={weightExternal}
                      onChange={(e) => handleWeightExternalChange(Number(e.target.value))}
                      className="h-1.5 w-28 cursor-pointer appearance-none rounded-full bg-emerald-200 accent-emerald-600 dark:bg-emerald-900"
                    />
                    <span className="min-w-[40px] rounded-lg bg-emerald-50 px-2 py-1 text-center font-mono text-xs font-black text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {weightExternal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="text-lg font-light text-slate-300 dark:text-slate-600">=</div>

                <span className="rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-sm font-black text-slate-900 dark:bg-slate-800 dark:text-white">
                  {(weightInternal + weightExternal).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Presets:</span>
              {[
                { label: "60 / 40", wi: 0.6, we: 0.4 },
                { label: "50 / 50", wi: 0.5, we: 0.5 },
                { label: "70 / 30", wi: 0.7, we: 0.3 },
                { label: "80 / 20", wi: 0.8, we: 0.2 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { setWeightInternal(p.wi); setWeightExternal(p.we); }}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition ${weightInternal === p.wi && weightExternal === p.we
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400"
                    }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Direct Assessments (Assignments) & External Exams Side-by-Side ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Direct Assessments Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="border-b border-slate-100 bg-indigo-50/50 px-5 py-3 dark:border-slate-800 dark:bg-indigo-950/30">
                <h4 className="flex items-center gap-2 text-xs font-bold text-indigo-800 dark:text-indigo-300">
                  <BookOpen className="h-3.5 w-3.5" />
                  Direct Assessments (Assignments)
                </h4>
                <p className="mt-0.5 text-[10px] text-indigo-600/70 dark:text-indigo-400/70">
                  CO-wise marks from uploaded assignment results
                </p>
              </div>
              <div className="p-4">
                {attainmentData.direct_assessments.length > 0 ? (
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 px-3 text-left font-bold text-slate-700 dark:text-slate-300">CO</th>
                        <th className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">Marks Obtained</th>
                        <th className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">Max Marks</th>
                        <th className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">% Score</th>
                        <th className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">Attainment (0-3)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attainmentData.direct_assessments.map((da) => {
                        const pct = da.max_mark > 0 ? ((da.mark_obtained / da.max_mark) * 100).toFixed(1) : "0";
                        const att = da.max_mark > 0 ? ((da.mark_obtained / da.max_mark) * 3).toFixed(2) : "0";
                        return (
                          <tr key={da.co_code} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-bold text-indigo-600 dark:text-indigo-400">{da.co_code}</td>
                            <td className="py-2 px-3 text-center font-semibold text-slate-900 dark:text-white">{da.mark_obtained}</td>
                            <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-300">{da.max_mark}</td>
                            <td className="py-2 px-3 text-center font-semibold text-sky-700 dark:text-sky-400">{pct}%</td>
                            <td className="py-2 px-3 text-center font-black text-indigo-700 dark:text-indigo-300">{att}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">No direct assessment data available</p>
                    <p className="text-[10px] text-slate-400">Upload assignment marks to see CO-wise attainment</p>
                  </div>
                )}
              </div>
            </div>

            {/* External Exams Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
              <div className="border-b border-slate-100 bg-emerald-50/50 px-5 py-3 dark:border-slate-800 dark:bg-emerald-950/30">
                <h4 className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <GraduationCap className="h-3.5 w-3.5" />
                  External Exams (End Semester)
                </h4>
                <p className="mt-0.5 text-[10px] text-emerald-600/70 dark:text-emerald-400/70">
                  CO-wise marks from end semester examination results
                </p>
              </div>
              <div className="p-4">
                {attainmentData.external_exams.length > 0 ? (
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 px-3 text-left font-bold text-slate-700 dark:text-slate-300">CO</th>
                        <th className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">Marks Obtained</th>
                        <th className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">Max Marks</th>
                        <th className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">% Score</th>
                        <th className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">Attainment (0-3)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {attainmentData.external_exams.map((ee) => {
                        const pct = ee.max_mark > 0 ? ((ee.mark_obtained / ee.max_mark) * 100).toFixed(1) : "0";
                        const att = ee.max_mark > 0 ? ((ee.mark_obtained / ee.max_mark) * 3).toFixed(2) : "0";
                        return (
                          <tr key={ee.co_code} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-bold text-emerald-600 dark:text-emerald-400">{ee.co_code}</td>
                            <td className="py-2 px-3 text-center font-semibold text-slate-900 dark:text-white">{ee.mark_obtained}</td>
                            <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-300">{ee.max_mark}</td>
                            <td className="py-2 px-3 text-center font-semibold text-sky-700 dark:text-sky-400">{pct}%</td>
                            <td className="py-2 px-3 text-center font-black text-emerald-700 dark:text-emerald-300">{att}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <GraduationCap className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">No external exam data available</p>
                    <p className="text-[10px] text-slate-400">External exam marks will appear here when available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Weighted CO Attainment Summary Table ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-emerald-50/80 px-6 py-4 dark:border-slate-800 dark:from-indigo-950/30 dark:to-emerald-950/30">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Scale className="h-4 w-4 text-indigo-500" />
                Total CO Attainment — Weighted Calculation
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Formula: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">W<sub>int</sub> × Internal + W<sub>ext</sub> × External</span>
                {" "}= <span className="font-mono font-bold">{weightInternal} × Internal + {weightExternal} × External</span>
              </p>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full border-collapse text-xs text-center">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      <th className="py-3 px-4 text-left">CO</th>
                      <th className="py-3 px-3">CIA Attainment<br /><span className="text-[10px] font-normal text-slate-400">(Level 0-3)</span></th>
                      <th className="py-3 px-3">Direct Assessment<br /><span className="text-[10px] font-normal text-slate-400">(Scaled 0-3)</span></th>
                      <th className="py-3 px-3 bg-indigo-50/60 dark:bg-indigo-950/20">Combined Internal<br /><span className="text-[10px] font-normal text-indigo-500">(Avg of CIA + DA)</span></th>
                      <th className="py-3 px-3 bg-emerald-50/60 dark:bg-emerald-950/20">External Attainment<br /><span className="text-[10px] font-normal text-emerald-500">(Scaled 0-3)</span></th>
                      <th className="py-3 px-3 bg-violet-50/60 dark:bg-violet-950/20">
                        <span className="text-violet-700 dark:text-violet-300">Total Attainment</span>
                        <br /><span className="text-[10px] font-normal text-violet-500">{weightInternal}×Int + {weightExternal}×Ext</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {weightedCOAttainment.map((w) => {
                      const totalLevel = w.total_attainment >= 2.5 ? 3 : w.total_attainment >= 1.5 ? 2 : w.total_attainment >= 0.5 ? 1 : 0;
                      const levelColor =
                        totalLevel === 3 ? "text-emerald-700 dark:text-emerald-400"
                          : totalLevel === 2 ? "text-blue-700 dark:text-blue-400"
                            : totalLevel === 1 ? "text-amber-700 dark:text-amber-400"
                              : "text-slate-500";

                      return (
                        <tr key={w.co} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-4 text-left font-bold text-indigo-600 dark:text-indigo-400">{w.co}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{w.internal_attainment}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{w.direct_assessment_attainment}</td>
                          <td className="py-3 px-3 font-bold text-indigo-700 bg-indigo-50/40 dark:text-indigo-300 dark:bg-indigo-950/10">{w.combined_internal}</td>
                          <td className="py-3 px-3 font-bold text-emerald-700 bg-emerald-50/40 dark:text-emerald-300 dark:bg-emerald-950/10">{w.external_attainment}</td>
                          <td className={`py-3 px-3 font-black text-base bg-violet-50/40 dark:bg-violet-950/10 ${levelColor}`}>
                            {w.total_attainment}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Visual bar representation */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {weightedCOAttainment.map((w) => (
                  <div key={`bar-${w.co}`} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{w.co}</span>
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-white">{w.total_attainment} / 3</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${w.total_attainment >= 2.5 ? "bg-emerald-500" : w.total_attainment >= 1.5 ? "bg-blue-500" : w.total_attainment >= 0.5 ? "bg-amber-500" : "bg-slate-400"}`}
                        style={{ width: `${Math.min((w.total_attainment / 3) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SUB-TAB: PO Attainment ───────────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {subTab === "po-attainment" && (
        <div className="space-y-6">

          {/* CO-PO Matrix Status */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Grid3X3 className="h-4 w-4 text-indigo-500" />
                  Program Outcome (PO) Attainment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PO attainment is calculated by mapping weighted CO attainment through the active CO-PO matrix.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {copoMatrix ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    CO-PO Matrix Loaded (ID: {copoMatrix.copo_id})
                  </span>
                ) : loadingCopo ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Loading CO-PO Matrix...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                    <Info className="h-3.5 w-3.5" />
                    No active CO-PO matrix found
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => loadCopoMatrix()}
                  disabled={loadingCopo}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingCopo ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {poAttainment.length > 0 ? (
            <>
              {/* PO Attainment Cards */}
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {poAttainment.map((po) => {
                  const level = po.attainment_value >= 2.5 ? 3 : po.attainment_value >= 1.5 ? 2 : po.attainment_value >= 0.5 ? 1 : 0;
                  const cardBorder =
                    level === 3 ? "border-emerald-200 dark:border-emerald-800"
                      : level === 2 ? "border-blue-200 dark:border-blue-800"
                        : level === 1 ? "border-amber-200 dark:border-amber-800"
                          : "border-slate-200 dark:border-slate-800";
                  const barColor =
                    level === 3 ? "bg-emerald-500" : level === 2 ? "bg-blue-500" : level === 1 ? "bg-amber-500" : "bg-slate-400";
                  const valueColor =
                    level === 3 ? "text-emerald-700 dark:text-emerald-400"
                      : level === 2 ? "text-blue-700 dark:text-blue-400"
                        : level === 1 ? "text-amber-700 dark:text-amber-400"
                          : "text-slate-600 dark:text-slate-400";

                  return (
                    <div
                      key={po.po_code}
                      className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md dark:bg-slate-900 ${cardBorder}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                          {po.po_code}
                        </span>
                        <span className={`text-2xl font-black ${valueColor}`}>
                          {po.attainment_value}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: `${Math.min((po.attainment_value / 3) * 100, 100)}%` }}
                        />
                      </div>

                      {/* Contributing COs */}
                      <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Contributing COs:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {po.contributing_cos.map((c) => (
                            <span
                              key={c.co}
                              className="inline-flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              title={`${c.co}: attainment=${c.co_attainment}, mapping=${c.mapping_value}`}
                            >
                              {c.co}
                              <span className="text-slate-400">×{c.mapping_value}</span>
                            </span>
                          ))}
                          {po.contributing_cos.length === 0 && (
                            <span className="text-[10px] text-slate-400 italic">No mapped COs</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* PO Attainment Detailed Table */}
              <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/60 px-6 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    PO Attainment Calculation Breakdown
                  </h4>
                  <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    PO Attainment = Σ(CO Attainment × Mapping Value) / Σ(Mapping Value) for each Program Outcome
                  </p>
                </div>
                <div className="p-5 overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-200 bg-slate-50 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <th className="py-3 px-4 text-left">PO</th>
                        <th className="py-3 px-4 text-center">Attainment Value</th>
                        <th className="py-3 px-4 text-center">Level</th>
                        <th className="py-3 px-4 text-left">Contributing COs (CO × Mapping)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {poAttainment.map((po) => {
                        const level = po.attainment_value >= 2.5 ? 3 : po.attainment_value >= 1.5 ? 2 : po.attainment_value >= 0.5 ? 1 : 0;
                        const levelBadge =
                          level === 3 ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : level === 2 ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400"
                              : level === 1 ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400"
                                : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
                        return (
                          <tr key={po.po_code} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{po.po_code}</td>
                            <td className="py-3 px-4 text-center font-mono text-base font-black text-slate-900 dark:text-white">
                              {po.attainment_value}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold ${levelBadge}`}>
                                Level {level}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1.5">
                                {po.contributing_cos.map((c, idx) => (
                                  <React.Fragment key={c.co}>
                                    <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {c.co}
                                      <span className="text-slate-400">({c.co_attainment} × {c.mapping_value})</span>
                                    </span>
                                    {idx < po.contributing_cos.length - 1 && (
                                      <span className="text-slate-300 self-center">+</span>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <Grid3X3 className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <h4 className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                PO Attainment Not Available
              </h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {!copoMatrix
                  ? "No active CO-PO matrix found for this course. Please generate and activate a CO-PO matrix in the CO-PO Mapping tab first."
                  : "No weighted CO attainment data available. Ensure extraction results and assessment data are loaded."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseAttainmentReport;
