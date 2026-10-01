import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  RotateCw,
  CheckCircle,
  GitBranch,
  Trash2,
  Check,
  ChevronDown,
} from "lucide-react";
import Models from "@/imports/models.import";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";

export interface VersionInfo {
  version: number;
  is_active: boolean;
  status: string;
  parent_version?: number | null;
  parent_pedagogy_version?: number | null;
  parent_hierarchy_version?: number | null;
  parent_pedagogy_id?: number | null;
  parent_extraction_id?: number | null;
  created_at?: string | null;
  created_by?: string | null;
}

interface StageVersionHistoryPanelProps {
  stage: "copo" | "hierarchy" | "pedagogy" | "schedule";
  stageLabel: string;
  courseId: string | number;
  onVersionActivated: (newVer: number) => Promise<void> | void;
  onVersionLoad?: (newVer: number) => Promise<void> | void;
  onGenerateNew: (parentParams: {
    extraction_version?: number;
    hierarchy_version?: number;
    pedagogy_version?: number;
  }) => Promise<void> | void;
  isGenerating?: boolean;
  refreshTrigger?: any;
  onExtractionChange?: (ver: number | null) => void;
  onVersionsLoaded?: (count: number) => void;
}

export default function StageVersionHistoryPanel({
  stage,
  stageLabel,
  courseId,
  onVersionActivated,
  onVersionLoad,
  onGenerateNew,
  isGenerating = false,
  refreshTrigger,
  onExtractionChange,
  onVersionsLoaded,
}: StageVersionHistoryPanelProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [activeVersion, setActiveVersion] = useState<number>(1);
  const [loadedVersion, setLoadedVersion] = useState<number | null>(null);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);
  const [loadingVersionId, setLoadingVersionId] = useState<number | null>(null);
  const [activatingVersion, setActivatingVersion] = useState<number | null>(null);
  const [deletingVersionId, setDeletingVersionId] = useState<number | null>(null);
  const [localGenerating, setLocalGenerating] = useState<boolean>(false);

  // Upstream versions for parent selection
  const [availableHierarchyVersions, setAvailableHierarchyVersions] = useState<number[]>([]);
  const [availablePedagogyVersions, setAvailablePedagogyVersions] = useState<number[]>([]);
  const [availableExtractionVersions, setAvailableExtractionVersions] = useState<number[]>([]);

  // Selected parent versions
  const [selectedExtractionVer, setSelectedExtractionVer] = useState<number | null>(null);
  const [selectedHierarchyVer, setSelectedHierarchyVer] = useState<number | null>(null);
  const [selectedPedagogyVer, setSelectedPedagogyVer] = useState<number | null>(null);

  /** 1. Fetch Version List for this stage */
  const loadVersions = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoadingVersions(true);
      const res: any = await Models.syllabus.get_versions(courseId, stage);
      const vList: VersionInfo[] = res?.versions || [];
      setVersions(vList);

      const actVer = res?.active_version ? Number(res.active_version) : 1;
      setActiveVersion(actVer);

      setLoadedVersion((prev) => {
        if (prev !== null && vList.some((v) => v.version === prev)) return prev;
        return actVer;
      });

      onVersionsLoaded?.(vList.length);
    } catch (err) {
      console.warn(`Failed to load versions for ${stage}:`, err);
      onVersionsLoaded?.(0);
    } finally {
      setLoadingVersions(false);
    }
  }, [courseId, stage, onVersionsLoaded]);

  /** 2. Load upstream versions (Hierarchy, Pedagogy, Extraction) */
  const loadUpstreamVersions = useCallback(async () => {
    if (!courseId) return;
    try {
      if (stage === "copo" || stage === "hierarchy") {
        const extRes: any = await Models.syllabus.get_versions(courseId, "extraction").catch(() => null);
        const vList = (extRes?.versions || []).map((v: any) => Number(v.version));
        setAvailableExtractionVersions(vList);
        const actVer = extRes?.active_version ? Number(extRes.active_version) : vList[vList.length - 1] || 1;
        setSelectedExtractionVer(actVer);
        onExtractionChange?.(actVer);
      } else if (stage === "pedagogy") {
        const hRes: any = await Models.syllabus.get_versions(courseId, "hierarchy").catch(() => null);
        const vList = (hRes?.versions || []).map((v: any) => Number(v.version));
        const actVer = hRes?.active_version ? Number(hRes.active_version) : vList[vList.length - 1] || 1;
        setAvailableHierarchyVersions(vList.length > 0 ? vList : [actVer]);
        setSelectedHierarchyVer(actVer);
      } else if (stage === "schedule") {
        const [hRes, pRes]: [any, any] = await Promise.all([
          Models.syllabus.get_versions(courseId, "hierarchy").catch(() => null),
          Models.syllabus.get_versions(courseId, "pedagogy").catch(() => null),
        ]);

        const hList = (hRes?.versions || []).map((v: any) => Number(v.version));
        const hAct = hRes?.active_version ? Number(hRes.active_version) : hList[hList.length - 1] || 1;
        setAvailableHierarchyVersions(hList.length > 0 ? hList : [hAct]);
        setSelectedHierarchyVer(hAct);

        const pList = (pRes?.versions || []).map((v: any) => Number(v.version));
        const pAct = pRes?.active_version ? Number(pRes.active_version) : pList[pList.length - 1] || 1;
        setAvailablePedagogyVersions(pList.length > 0 ? pList : [pAct]);
        setSelectedPedagogyVer(pAct);
      }
    } catch (err) {
      console.warn("Failed to load upstream versions:", err);
    }
  }, [courseId, stage, onExtractionChange]);

  useEffect(() => {
    if (courseId) {
      loadVersions();
      loadUpstreamVersions();
    }
  }, [courseId, stage, loadVersions, loadUpstreamVersions]);

  // Refresh trigger when parent completes work
  useEffect(() => {
    if (refreshTrigger !== undefined && courseId) {
      loadVersions();
      loadUpstreamVersions();
    }
  }, [refreshTrigger, courseId, loadVersions, loadUpstreamVersions]);

  /** 3. Handle Load Version */
  const handleLoad = async (ver: number) => {
    if (loadingVersionId !== null || activatingVersion !== null) return;
    try {
      setLoadingVersionId(ver);
      setLoadedVersion(ver);
      if (onVersionLoad) {
        await onVersionLoad(ver);
      } else {
        await onVersionActivated(ver);
      }
      Success(`Loaded Version ${ver} for ${stageLabel}`);
    } catch (err: any) {
      Failure(getErrorMessage(err, `Failed to load Version ${ver}`));
    } finally {
      setLoadingVersionId(null);
    }
  };

  /** 4. Handle Activate Version */
  const handleActivate = async (ver: number) => {
    if (activatingVersion !== null) return;
    try {
      setActivatingVersion(ver);
      await Models.syllabus.activate_version(courseId, stage, ver);
      Success(`Activated Version ${ver} for ${stageLabel}`);
      setActiveVersion(ver);
      setLoadedVersion(ver);
      await loadVersions();
      await onVersionActivated(ver);
    } catch (err: any) {
      Failure(getErrorMessage(err, `Failed to activate Version ${ver}`));
    } finally {
      setActivatingVersion(null);
    }
  };

  /** 5. Handle Delete Version */
  const handleDelete = async (ver: number) => {
    if (deletingVersionId !== null || activatingVersion !== null || loadingVersionId !== null) return;
    if (!window.confirm(`Are you sure you want to delete Version ${ver} of ${stageLabel}?`)) return;
    try {
      setDeletingVersionId(ver);
      await Models.syllabus.delete_version(courseId, stage, ver);
      Success(`Deleted Version ${ver} for ${stageLabel}`);
      if (loadedVersion === ver) {
        setLoadedVersion(null);
      }
      await loadVersions();
    } catch (err: any) {
      Failure(getErrorMessage(err, `Failed to delete Version ${ver}`));
    } finally {
      setDeletingVersionId(null);
    }
  };

  /** 6. Trigger Generation of Next Version */
  const handleTriggerGenerate = async () => {
    if (isGenerating || localGenerating) return;

    const params: {
      extraction_version?: number;
      hierarchy_version?: number;
      pedagogy_version?: number;
    } = {};

    if (stage === "copo" || stage === "hierarchy") {
      params.extraction_version = selectedExtractionVer || 1;
    } else if (stage === "pedagogy") {
      params.hierarchy_version = selectedHierarchyVer || availableHierarchyVersions[0] || 1;
    } else if (stage === "schedule") {
      params.hierarchy_version = selectedHierarchyVer || availableHierarchyVersions[0] || 1;
      params.pedagogy_version = selectedPedagogyVer || availablePedagogyVersions[0] || 1;
    }

    try {
      setLocalGenerating(true);
      await onGenerateNew(params);
      await loadVersions();
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to start generation"));
    } finally {
      setLocalGenerating(false);
    }
  };

  const currentlyGenerating = isGenerating || localGenerating;
  const nextVerNum = versions.length > 0 ? Math.max(...versions.map((v) => v.version)) + 1 : 1;

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* ── Section Header & Generate Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <GitBranch className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {stageLabel} Version Control & History
            </h4>
            <p className="text-[11px] text-slate-500">
              Active version:{" "}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                v{activeVersion || 1}
              </span>{" "}
              &bull; {versions.length} total version{versions.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {/* Generate Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Parent Selectors for Pedagogy */}
          {stage === "pedagogy" && availableHierarchyVersions.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-medium text-slate-500">Using Hierarchy:</span>
              <select
                value={selectedHierarchyVer ?? availableHierarchyVersions[0]}
                onChange={(e) => setSelectedHierarchyVer(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {availableHierarchyVersions.map((v) => (
                  <option key={v} value={v}>
                    v{v}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Parent Selectors for Schedule */}
          {stage === "schedule" && (
            <div className="flex items-center gap-2 text-xs">
              {availableHierarchyVersions.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-slate-500">Hierarchy:</span>
                  <select
                    value={selectedHierarchyVer ?? availableHierarchyVersions[0]}
                    onChange={(e) => setSelectedHierarchyVer(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {availableHierarchyVersions.map((v) => (
                      <option key={v} value={v}>
                        v{v}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {availablePedagogyVersions.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-slate-500">Pedagogy:</span>
                  <select
                    value={selectedPedagogyVer ?? availablePedagogyVersions[0]}
                    onChange={(e) => setSelectedPedagogyVer(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {availablePedagogyVersions.map((v) => (
                      <option key={v} value={v}>
                        v{v}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <button
            type="button"
            disabled={currentlyGenerating}
            onClick={handleTriggerGenerate}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:from-indigo-700 hover:to-purple-700 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {currentlyGenerating ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
                <span>Generating v{nextVerNum}...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate v{nextVerNum}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Version Cards Row ── */}
      <div className="mt-3.5 flex items-center gap-3 overflow-x-auto pb-1">
        {loadingVersions && versions.length === 0 ? (
          <div className="flex w-full items-center justify-center py-6 text-xs text-slate-400">
            <RotateCw className="mr-2 h-4 w-4 animate-spin text-indigo-500" />
            Loading version history...
          </div>
        ) : versions.length === 0 ? (
          <div className="flex w-full items-center justify-center py-6 text-xs text-slate-400">
            No versions generated yet. Click &quot;Generate v1&quot; above to create the initial version.
          </div>
        ) : (
          versions.map((ver) => {
            const isActive = ver.is_active || ver.version === activeVersion;
            const isApproved = ver.status === "approved";
            const isCurrentLoaded = (loadedVersion ?? activeVersion) === ver.version;
            const isLoadingThis = loadingVersionId === ver.version;
            const isActivatingThis = activatingVersion === ver.version;

            return (
              <div
                key={ver.version}
                onClick={() => {
                  if (!isCurrentLoaded && !isLoadingThis && !isActivatingThis) {
                    handleLoad(ver.version);
                  }
                }}
                className={`flex shrink-0 min-w-[280px] items-center justify-between gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                  isCurrentLoaded
                    ? "border-indigo-500 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-400 dark:border-indigo-500 dark:bg-indigo-950/30"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50/70 hover:shadow-xs dark:border-slate-800 dark:bg-slate-800/40"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-bold ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      v{ver.version}
                    </span>

                    <span
                      className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {isApproved ? "Approved" : "Draft"}
                    </span>

                    {isActive && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Active
                      </span>
                    )}

                    {isCurrentLoaded && !isActive && (
                      <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        Loaded
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 text-[10px] text-slate-400">
                    {stage === "schedule" ? (
                      <span>
                        H: v{ver.parent_hierarchy_version || 1} &bull; P: v{ver.parent_pedagogy_version || 1}
                      </span>
                    ) : (
                      <span>
                        Source: Hierarchy v{Number(ver.parent_version || 1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  className="flex items-center gap-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Load Button */}
                  <button
                    type="button"
                    disabled={isCurrentLoaded || isLoadingThis || isActivatingThis}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLoad(ver.version);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      isCurrentLoaded
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-default"
                        : "border border-slate-200 bg-white text-slate-700 shadow-xs hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {isLoadingThis ? (
                      <RotateCw className="h-3 w-3 animate-spin" />
                    ) : isCurrentLoaded ? (
                      "Loaded ✓"
                    ) : (
                      "Load"
                    )}
                  </button>

                  {/* Set Active Button */}
                  {isActive ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                      title={`v${ver.version} is currently active for instructors`}
                    >
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={isActivatingThis || isLoadingThis || deletingVersionId !== null}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivate(ver.version);
                      }}
                      className="rounded-lg bg-indigo-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                    >
                      {isActivatingThis ? (
                        <RotateCw className="h-3 w-3 animate-spin" />
                      ) : (
                        "Set Active"
                      )}
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={deletingVersionId !== null || isActivatingThis || isLoadingThis}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(ver.version);
                    }}
                    title={`Delete Version ${ver.version}`}
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-400 shadow-xs transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    {deletingVersionId === ver.version ? (
                      <RotateCw className="h-3 w-3 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
