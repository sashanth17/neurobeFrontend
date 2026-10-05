import React, { useEffect, useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import {
  History,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileText,
  Layers,
  Presentation,
  Calendar,
  Sparkles,
  Clock,
} from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import PrivateRouter from "@/hook/privateRouter";
import Models from "@/imports/models.import";

const CourseVersionHistory = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const courseIdParam = useMemo(() => {
    return (
      (router.query.course_id as string) ||
      (router.query.id as string) ||
      (typeof window !== "undefined" ? localStorage.getItem("active_course_id") : null)
    );
  }, [router.query.course_id, router.query.id]);

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"syllabi" | "extractions" | "copo" | "pedagogies" | "lesson_plans">("syllabi");

  useEffect(() => {
    dispatch(setPageTitle("Course Artifact Version History"));
  }, [dispatch]);

  const fetchPortfolio = async (isManual = false) => {
    if (!courseIdParam) return;
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res: any = await Models.course.course_portfolio(courseIdParam);
      setPortfolio(res);

      // Enforce Coordinator-only access
      if (res && res.permissions && !res.permissions.is_coordinator) {
        setError("Access Restricted: Version History is only accessible to Course Coordinators.");
        setTimeout(() => {
          router.push(`/neurobe/course-artifacts?course_id=${courseIdParam}`);
        }, 2500);
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to load version history"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (courseIdParam) {
      fetchPortfolio(false);
    }
  }, [courseIdParam]);

  const course = portfolio?.course || {};
  const perms = portfolio?.permissions || {};
  const versions = portfolio?.versions || {
    syllabi: [],
    extractions: [],
    copo: [],
    pedagogies: [],
    lesson_plans: [],
  };

  // ── Version Lifecycle Actions ──

  const handleActivate = async (type: string, id: number | string) => {
    try {
      setActionLoading(`activate_${type}_${id}`);
      if (type === "syllabus") await Models.syllabus.activate(id);
      else if (type === "extraction") await Models.syllabus.extraction_activate(id);
      else if (type === "copo") await Models.copo.activate(id);
      else if (type === "pedagogy") await Models.pedagogy.activate(id);
      else if (type === "lesson_plan") await Models.lession_plan.activate(id);

      Success(`Version activated successfully!`);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate version"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (type: string, id: number | string) => {
    try {
      setActionLoading(`approve_${type}_${id}`);
      if (type === "syllabus") await Models.syllabus.approve(id);
      else if (type === "extraction") await Models.syllabus.extraction_approve(id);
      else if (type === "copo") await Models.copo.approve(id);
      else if (type === "pedagogy") await Models.pedagogy.approve(id);
      else if (type === "lesson_plan") await Models.lession_plan.approve(id);

      Success(`Version approved!`);
      fetchPortfolio(true);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve version"));
    } finally {
      setActionLoading(null);
    }
  };

  const isBusyState = (state?: string) =>
    state === "redis_queued" || state === "sent_to_llm" || state === "processing";

  const renderStateBadge = (state?: string) => {
    if (state === "sent_to_llm" || state === "processing") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
          <Sparkles className="h-3 w-3 animate-spin" />
          Processing
        </span>
      );
    }
    if (state === "redis_queued") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <Clock className="h-3 w-3" />
          Queued
        </span>
      );
    }
    if (state === "completed") {
      return (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
          Completed
        </span>
      );
    }
    if (state === "failed") {
      return (
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950 dark:text-rose-300 uppercase">
          Failed
        </span>
      );
    }
    return (
      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 uppercase">
        {state || "—"}
      </span>
    );
  };

  return (
    <div className="min-h-screen space-y-6 pb-16">
      {/* Top Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => router.push(`/neurobe/course-artifacts?course_id=${courseIdParam}`)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Course Workspace</span>
            </button>

            <div className="flex items-center gap-2 pt-1">
              <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                {course.course_code || "Course"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                Coordinator Control
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white md:text-2xl flex items-center gap-2">
              <History className="h-6 w-6 text-indigo-500" />
              <span>Version History & Rollback Console</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {course.course_title} • Audit, approve, and activate previous versions of syllabi, extractions, CO-PO, pedagogies, and schedules.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchPortfolio(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-indigo-500" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error / Unauthorized Alert */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Version Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("syllabi")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "syllabi"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Syllabi Files ({versions.syllabi?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("extractions")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "extractions"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Extractions ({versions.extractions?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("copo")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "copo"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            CO-PO Mappings ({versions.copo?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pedagogies")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "pedagogies"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Pedagogies ({versions.pedagogies?.length || 0})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lesson_plans")}
            className={`border-b-2 pb-3 text-sm font-semibold transition ${
              activeTab === "lesson_plans"
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Lesson Plans ({versions.lesson_plans?.length || 0})
          </button>
        </nav>
      </div>

      {/* Version Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Version</th>
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Details</th>
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Lifecycle State</th>
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Status Badges</th>
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Created At</th>
              <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {/* Syllabi */}
            {activeTab === "syllabi" &&
              (versions.syllabi || []).map((s: any) => (
                <tr key={s.course_syllabus_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                    v{s.version_id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {s.original_filename}
                  </td>
                  <td className="py-3 px-4">
                    {renderStateBadge(s.current_state)}
                  </td>
                  <td className="py-3 px-4 space-x-1.5">
                    {s.is_active && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                    {s.is_approved && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        Approved
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "—"}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {!s.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApprove("syllabus", s.course_syllabus_id)}
                        disabled={isBusyState(s.current_state) || actionLoading === `approve_syllabus_${s.course_syllabus_id}`}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {!s.is_active && s.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleActivate("syllabus", s.course_syllabus_id)}
                        disabled={isBusyState(s.current_state) || actionLoading === `activate_syllabus_${s.course_syllabus_id}`}
                        className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Set Active
                      </button>
                    )}
                  </td>
                </tr>
              ))}

            {/* Extractions */}
            {activeTab === "extractions" &&
              (versions.extractions || []).map((e: any) => (
                <tr key={e.extractions_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                    v{e.extraction_version_id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {e.credits || 0} Credits • {e.total_theory_hours || 0} Theory Hrs / {e.total_lab_hours || 0} Lab Hrs
                  </td>
                  <td className="py-3 px-4">
                    {renderStateBadge(e.current_state)}
                  </td>
                  <td className="py-3 px-4 space-x-1.5">
                    {e.is_active && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                    {e.is_approved && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        Approved
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{e.created_at ? new Date(e.created_at).toLocaleDateString() : "—"}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {!e.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApprove("extraction", e.extractions_id)}
                        disabled={isBusyState(e.current_state) || actionLoading === `approve_extraction_${e.extractions_id}`}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {!e.is_active && e.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleActivate("extraction", e.extractions_id)}
                        disabled={isBusyState(e.current_state) || actionLoading === `activate_extraction_${e.extractions_id}`}
                        className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Set Active
                      </button>
                    )}
                  </td>
                </tr>
              ))}

            {/* CO-PO */}
            {activeTab === "copo" &&
              (versions.copo || []).map((c: any) => (
                <tr key={c.copo_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                    v{c.version_id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Bound to Extraction v{c.extractions_id}
                  </td>
                  <td className="py-3 px-4">
                    {renderStateBadge(c.current_state)}
                  </td>
                  <td className="py-3 px-4 space-x-1.5">
                    {c.is_active && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                    {c.is_approved && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        Approved
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {!c.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApprove("copo", c.copo_id)}
                        disabled={isBusyState(c.current_state) || actionLoading === `approve_copo_${c.copo_id}`}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {!c.is_active && c.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleActivate("copo", c.copo_id)}
                        disabled={isBusyState(c.current_state) || actionLoading === `activate_copo_${c.copo_id}`}
                        className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Set Active
                      </button>
                    )}
                  </td>
                </tr>
              ))}

            {/* Pedagogies */}
            {activeTab === "pedagogies" &&
              (versions.pedagogies || []).map((p: any) => (
                <tr key={p.pedagogy_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                    v{p.version_id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    Bound to Extraction v{p.extractions_id}
                  </td>
                  <td className="py-3 px-4">
                    {renderStateBadge(p.current_state)}
                  </td>
                  <td className="py-3 px-4 space-x-1.5">
                    {p.is_active && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                    {p.is_approved && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        Approved
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {!p.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApprove("pedagogy", p.pedagogy_id)}
                        disabled={isBusyState(p.current_state) || actionLoading === `approve_pedagogy_${p.pedagogy_id}`}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {!p.is_active && p.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleActivate("pedagogy", p.pedagogy_id)}
                        disabled={isBusyState(p.current_state) || actionLoading === `activate_pedagogy_${p.pedagogy_id}`}
                        className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Set Active
                      </button>
                    )}
                  </td>
                </tr>
              ))}

            {/* Lesson Plans */}
            {activeTab === "lesson_plans" &&
              (versions.lesson_plans || []).map((l: any) => (
                <tr key={l.lesson_plan_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                  <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                    v{l.version_id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {l.target_total_hours} Target Hrs • {l.total_theory_hours} Theory / {l.total_lab_hours} Lab Hrs
                  </td>
                  <td className="py-3 px-4">
                    {renderStateBadge(l.current_state)}
                  </td>
                  <td className="py-3 px-4 space-x-1.5">
                    {l.is_active && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Active
                      </span>
                    )}
                    {l.is_approved && (
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        Approved
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{l.created_at ? new Date(l.created_at).toLocaleDateString() : "—"}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {!l.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleApprove("lesson_plan", l.lesson_plan_id)}
                        disabled={isBusyState(l.current_state) || actionLoading === `approve_lp_${l.lesson_plan_id}`}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                    )}
                    {!l.is_active && l.is_approved && (
                      <button
                        type="button"
                        onClick={() => handleActivate("lesson_plan", l.lesson_plan_id)}
                        disabled={isBusyState(l.current_state) || actionLoading === `activate_lp_${l.lesson_plan_id}`}
                        className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Set Active
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrivateRouter(CourseVersionHistory);
