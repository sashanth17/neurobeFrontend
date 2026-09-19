import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  RotateCw,
  CheckCircle,
  Clock,
  Layers,
  ChevronDown,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  GitBranch,
} from "lucide-react";
import Models from "@/imports/models.import";
import { Success, Failure } from "@/utils/function.utils";

export interface VersionInfo {
  version: number;
  is_active: boolean;
  status: string;
  parent_version?: number | null;
  parent_pedagogy_version?: number | null;
  parent_hierarchy_version?: number | null;
  created_at?: string | null;
  created_by?: string | null;
}

interface StageVersionHistoryPanelProps {
  stage: "copo" | "hierarchy" | "pedagogy" | "schedule";
  stageLabel: string;
  courseId: string | number;
  onVersionActivated: (newVer: number) => Promise<void> | void;
  onGenerateNew: (parentParams: {
    extraction_version?: number;
    hierarchy_version?: number;
    pedagogy_version?: number;
  }) => Promise<void> | void;
  isGenerating?: boolean;
  refreshTrigger?: any;
  onExtractionChange?: (ver: number | null) => void;
}

export default function StageVersionHistoryPanel({
  stage,
  stageLabel,
  courseId,
  onVersionActivated,
  onGenerateNew,
  isGenerating = false,
  refreshTrigger,
  onExtractionChange,
}: StageVersionHistoryPanelProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [activeVersion, setActiveVersion] = useState<number>(1);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);
  const [activatingVersion, setActivatingVersion] = useState<number | null>(null);

  // Upstream approved versions
  const [approvedExtractionVersions, setApprovedExtractionVersions] = useState<number[]>([]);
  const [approvedHierarchyVersions, setApprovedHierarchyVersions] = useState<number[]>([]);
  const [approvedPedagogyVersions, setApprovedPedagogyVersions] = useState<number[]>([]);

  // Selected parent versions for generation
  const [selectedExtractionVer, setSelectedExtractionVer] = useState<number | null>(null);
  const [selectedHierarchyVer, setSelectedHierarchyVer] = useState<number | null>(null);
  const [selectedPedagogyVer, setSelectedPedagogyVer] = useState<number | null>(null);

  // Load versions for this stage
  const loadVersions = async () => {
    if (!courseId) return;
    try {
      setLoadingVersions(true);
      const res: any = await Models.syllabus.get_versions(courseId, stage);
      const vList: VersionInfo[] = res?.versions || [];
      setVersions(vList);
      setActiveVersion(res?.active_version || 1);
    } catch (err) {
      console.error(`Failed to load versions for ${stage}:`, err);
    } finally {
      setLoadingVersions(false);
    }
  };

  // Load upstream approved versions to enforce gatekeeper rule
  const loadUpstreamApproved = async () => {
    if (!courseId) return;
    try {
      if (stage === "copo" || stage === "hierarchy") {
        const extRes: any = await Models.syllabus.get_versions(courseId, "extraction");
        const approved: number[] = (extRes?.versions || [])
          .filter((v: any) => v.status === "approved")
          .map((v: any) => Number(v.version))
          .sort((a: number, b: number) => a - b);
        setApprovedExtractionVersions(approved);
        if (approved.length === 0) {
          // No approved extractions — clear selection; block is enforced by canGenerate()
          setSelectedExtractionVer(null);
          onExtractionChange?.(null);
          return;
        }
        const activeExtVer = extRes?.active_version ? Number(extRes.active_version) : approved[0];
        let chosenVer = selectedExtractionVer;
        if (!chosenVer || !approved.includes(chosenVer)) {
          chosenVer = approved.includes(activeExtVer) ? activeExtVer : approved[0];
          setSelectedExtractionVer(chosenVer);
          onExtractionChange?.(chosenVer);
        }
      } else if (stage === "pedagogy") {
        const hRes: any = await Models.syllabus.get_versions(courseId, "hierarchy");
        const approved = (hRes?.versions || [])
          .filter((v: any) => v.status === "approved")
          .map((v: any) => v.version);
        setApprovedHierarchyVersions(approved);
        if (approved.length > 0) setSelectedHierarchyVer(approved[approved.length - 1]);
      } else if (stage === "schedule") {
        const hRes: any = await Models.syllabus.get_versions(courseId, "hierarchy");
        const hApproved = (hRes?.versions || [])
          .filter((v: any) => v.status === "approved")
          .map((v: any) => v.version);
        setApprovedHierarchyVersions(hApproved);
        if (hApproved.length > 0) setSelectedHierarchyVer(hApproved[hApproved.length - 1]);

        const pRes: any = await Models.syllabus.get_versions(courseId, "pedagogy");
        const pApproved = (pRes?.versions || [])
          .filter((v: any) => v.status === "approved")
          .map((v: any) => v.version);
        setApprovedPedagogyVersions(pApproved);
        if (pApproved.length > 0) setSelectedPedagogyVer(pApproved[pApproved.length - 1]);
      }
    } catch (err) {
      console.error("Failed to load upstream approved versions:", err);
    }
  };

  useEffect(() => {
    if (courseId) {
      loadVersions();
      loadUpstreamApproved();
    }
  }, [courseId, stage]);

  // Auto-update this section as soon as generation completes
  const prevGenerating = useRef(isGenerating);
  useEffect(() => {
    if (prevGenerating.current && !isGenerating && courseId) {
      loadVersions();
      loadUpstreamApproved();
    }
    prevGenerating.current = isGenerating;
  }, [isGenerating, courseId]);

  // Explicit refresh trigger from parent
  useEffect(() => {
    if (refreshTrigger !== undefined && courseId) {
      loadVersions();
      loadUpstreamApproved();
    }
  }, [refreshTrigger, courseId]);

  const handleActivate = async (ver: number) => {
    try {
      setActivatingVersion(ver);
      await Models.syllabus.activate_version(courseId, stage, ver);
      Success(`Activated Version ${ver} for ${stageLabel}`);
      await loadVersions();
      await onVersionActivated(ver);
    } catch (err: any) {
      Failure(typeof err === "string" ? err : err?.message || `Failed to activate Version ${ver}`);
    } finally {
      setActivatingVersion(null);
    }
  };

  const handleTriggerGenerate = async () => {
    const params: {
      extraction_version?: number;
      hierarchy_version?: number;
      pedagogy_version?: number;
    } = {};

    if (stage === "copo" || stage === "hierarchy") {
      if (!selectedExtractionVer) {
        Failure("Please select an approved Syllabus Extraction version.");
        return;
      }
      params.extraction_version = selectedExtractionVer;
    } else if (stage === "pedagogy") {
      if (!selectedHierarchyVer) {
        Failure("Please select an approved Topic Hierarchy version.");
        return;
      }
      params.hierarchy_version = selectedHierarchyVer;
    } else if (stage === "schedule") {
      if (!selectedHierarchyVer || !selectedPedagogyVer) {
        Failure("Both Topic Hierarchy and Pedagogy versions must be approved and selected.");
        return;
      }
      params.hierarchy_version = selectedHierarchyVer;
      params.pedagogy_version = selectedPedagogyVer;
    }

    await onGenerateNew(params);
    await loadVersions();
  };

  // Determine canGenerate based on upstream approval gatekeeper
  const canGenerate = () => {
    if (stage === "copo" || stage === "hierarchy") {
      return approvedExtractionVersions.length > 0;
    }
    if (stage === "pedagogy") {
      return approvedHierarchyVersions.length > 0;
    }
    if (stage === "schedule") {
      return approvedHierarchyVersions.length > 0 && approvedPedagogyVersions.length > 0;
    }
    return true;
  };

  const getDependencyRequirementMessage = () => {
    if (stage === "copo" || stage === "hierarchy") {
      return "Requires an Approved Syllabus Extraction (BoS Approved) before generating.";
    }
    if (stage === "pedagogy") {
      return "Requires an Approved Topic Hierarchy before generating Pedagogy Suggestions.";
    }
    if (stage === "schedule") {
      return "Requires BOTH an Approved Topic Hierarchy AND Approved Pedagogy Suggestions before generating.";
    }
    return "Upstream stage must be approved.";
  };

  const allowed = canGenerate();

  // Filter versions by the selected extraction version (tactics identical to CourseCard)
  const displayedVersions =
    (stage === "copo" || stage === "hierarchy") && selectedExtractionVer
      ? versions.filter(
          (ver) => (ver.parent_version ?? (ver as any).extraction_version_used ?? 1) === selectedExtractionVer
        )
      : versions;

  const activeChild = displayedVersions.find((v) => v.is_active) || displayedVersions.find((v) => v.version === activeVersion);
  const effectiveActiveDisplayVer = activeChild?.version || activeVersion;

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {stageLabel} Version Control & History
            </h4>
            <p className="text-[11px] text-slate-500">
              {displayedVersions.length > 0 ? (
                <>
                  Active version:{" "}
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    v{effectiveActiveDisplayVer}
                  </span>{" "}
                  &bull; {displayedVersions.length} total version{displayedVersions.length === 1 ? "" : "s"}
                </>
              ) : (
                <>{selectedExtractionVer ? `No versions for Extraction v${selectedExtractionVer} yet` : "No versions generated yet"}</>
              )}
            </p>
          </div>
        </div>

        {/* Generate Next Version Controller */}
        <div className="flex flex-wrap items-center gap-2">
          {!allowed ? (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{getDependencyRequirementMessage()}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Parent Version Selectors */}
              {(stage === "copo" || stage === "hierarchy") && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-slate-500">Using Extraction:</span>
                  <select
                    value={selectedExtractionVer ?? ""}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setSelectedExtractionVer(v);
                      onExtractionChange?.(v);
                    }}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {approvedExtractionVersions.map((v) => (
                      <option key={v} value={v}>
                        v{v} (Approved)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {stage === "pedagogy" && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium text-slate-500">Using Hierarchy:</span>
                  <select
                    value={selectedHierarchyVer ?? ""}
                    onChange={(e) => setSelectedHierarchyVer(Number(e.target.value))}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {approvedHierarchyVersions.map((v) => (
                      <option key={v} value={v}>
                        v{v} (Approved)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {stage === "schedule" && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-500">Hierarchy:</span>
                    <select
                      value={selectedHierarchyVer ?? ""}
                      onChange={(e) => setSelectedHierarchyVer(Number(e.target.value))}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {approvedHierarchyVersions.map((v) => (
                        <option key={v} value={v}>
                          v{v} (Approved)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-slate-500">Pedagogy:</span>
                    <select
                      value={selectedPedagogyVer ?? ""}
                      onChange={(e) => setSelectedPedagogyVer(Number(e.target.value))}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {approvedPedagogyVersions.map((v) => (
                        <option key={v} value={v}>
                          v{v} (Approved)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={isGenerating || !allowed}
                onClick={handleTriggerGenerate}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:from-indigo-700 hover:to-purple-700 active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating v{versions.length + 1}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate v{versions.length + 1}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Version Cards Carousel / Row */}
      <div className="mt-3 flex items-center gap-3 overflow-x-auto pb-1">
        {displayedVersions.length === 0 && !loadingVersions && (
          <div className="flex w-full items-center justify-center py-4 text-xs text-slate-400">
            No versions generated for Extraction v{selectedExtractionVer} yet. Click Generate v{versions.length + 1} above to begin.
          </div>
        )}

        {displayedVersions.map((ver) => {
          const isActive = ver.is_active || ver.version === effectiveActiveDisplayVer;
          const isApproved = ver.status === "approved";
          const isActivating = activatingVersion === ver.version;

          return (
            <div
              key={ver.version}
              className={`flex shrink-0 min-w-[210px] items-center justify-between gap-2 rounded-xl border p-2.5 transition-all ${
                isActive
                  ? "border-indigo-400 bg-indigo-50/50 shadow-sm dark:border-indigo-600 dark:bg-indigo-950/20"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/40"
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
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isApproved
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    }`}
                  >
                    {isApproved ? "Approved" : "Draft"}
                  </span>
                  {isActive && (
                    <span className="rounded bg-indigo-100 px-1 py-0.2 text-[9px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      Active
                    </span>
                  )}
                </div>

                {/* Parent version used tag */}
                <div className="mt-1 text-[10px] text-slate-400">
                  {stage === "schedule" ? (
                    <span>
                      H: v{ver.parent_hierarchy_version || 1} &bull; P: v{ver.parent_pedagogy_version || 1}
                    </span>
                  ) : (
                    <span>
                      Source: {stage === "pedagogy" ? "Topics" : "Extraction"} v{Number(ver.parent_version ?? (ver as any).extraction_version_used ?? selectedExtractionVer ?? 1)}
                    </span>
                  )}
                </div>
              </div>

              <div>
                {isActive ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={isActivating}
                    onClick={() => handleActivate(ver.version)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {isActivating ? (
                      <RotateCw className="h-3 w-3 animate-spin" />
                    ) : (
                      "Set Active"
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
