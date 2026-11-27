import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Building2,
  Layers,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Save,
  RotateCcw,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  X,
  Plus,
  Trash2,
  HelpCircle,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import Models from "@/imports/models.import";
import { Success, Failure, getErrorMessage } from "@/utils/function.utils";
import { DepartmentCoPsoOverview } from "@/models/copso_map.models";

interface CoPsoMappingSectionProps {
  courseId: number | string;
  courseTitle?: string;
  courseCode?: string;
  isCoord: boolean;
  approvedExtractionId?: number | null;
}

export const CoPsoMappingSection: React.FC<CoPsoMappingSectionProps> = ({
  courseId,
  courseTitle,
  courseCode,
  isCoord,
  approvedExtractionId,
}) => {
  // Navigation & Dept Overview state
  const [departments, setDepartments] = useState<DepartmentCoPsoOverview[]>([]);
  const [loadingDepts, setLoadingDepts] = useState<boolean>(true);
  const [selectedDept, setSelectedDept] = useState<DepartmentCoPsoOverview | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "mapped" | "unmapped">("all");

  // Department Drilldown state
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);
  const [currentMatrix, setCurrentMatrix] = useState<any | null>(null);
  const [loadingVersions, setLoadingVersions] = useState<boolean>(false);
  const [loadingMatrix, setLoadingMatrix] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Cell Editing & Justification Modal state
  const [dirtyCells, setDirtyCells] = useState<
    Record<number, { matrix_value: number; justification?: string }>
  >({});
  const [savingDelta, setSavingDelta] = useState<boolean>(false);
  const [activeCellModal, setActiveCellModal] = useState<any | null>(null);

  // 1. Load departments overview
  const loadDepartments = useCallback(async () => {
    if (!courseId) return;
    setLoadingDepts(true);
    try {
      const data: DepartmentCoPsoOverview[] = await Models.copso.get_departments_overview(courseId);
      setDepartments(data || []);
      // If a department is already selected, update its reference
      if (selectedDept) {
        const updated = (data || []).find((d) => d.department_id === selectedDept.department_id);
        if (updated) setSelectedDept(updated);
      }
    } catch (err: any) {
      console.error("Failed to load department CO-PSO overview:", err);
      Failure(getErrorMessage(err, "Failed to load department overview"));
    } finally {
      setLoadingDepts(false);
    }
  }, [courseId, selectedDept]);

  useEffect(() => {
    loadDepartments();
  }, [courseId]);

  // 2. Load versions when a department is selected
  const loadDepartmentVersions = useCallback(
    async (deptId: number, autoSelectVersionId?: number) => {
      setLoadingVersions(true);
      try {
        const list = await Models.copso.list({
          course_id: courseId,
          department_id: deptId,
        });
        const sorted = (list || []).sort(
          (a: any, b: any) => Number(b.version_id || 0) - Number(a.version_id || 0)
        );
        setVersions(sorted);

        // Pick version: specific > active > latest
        let target = null;
        if (autoSelectVersionId) {
          target = sorted.find((v: any) => v.copso_id === autoSelectVersionId);
        }
        if (!target) {
          target = sorted.find((v: any) => v.is_active) || sorted[0] || null;
        }
        setSelectedVersion(target);

        if (target) {
          loadMatrixDetail(target.copso_id);
        } else {
          setCurrentMatrix(null);
        }
      } catch (err: any) {
        console.error("Failed to load department versions:", err);
        Failure(getErrorMessage(err, "Failed to load mapping versions"));
      } finally {
        setLoadingVersions(false);
      }
    },
    [courseId]
  );

  // 3. Load full matrix detail
  const loadMatrixDetail = async (copsoId: number) => {
    setLoadingMatrix(true);
    setDirtyCells({});
    try {
      const full = await Models.copso.get(copsoId);
      setCurrentMatrix(full);
    } catch (err: any) {
      console.error("Failed to load matrix detail:", err);
      Failure(getErrorMessage(err, "Failed to load matrix details"));
    } finally {
      setLoadingMatrix(false);
    }
  };

  const handleSelectDepartment = (dept: DepartmentCoPsoOverview) => {
    setSelectedDept(dept);
    setDirtyCells({});
    loadDepartmentVersions(dept.department_id);
  };

  const handleBackToOverview = () => {
    setSelectedDept(null);
    setSelectedVersion(null);
    setCurrentMatrix(null);
    setDirtyCells({});
    loadDepartments();
  };

  // 4. Trigger AI Generation for Department
  const handleGenerateAI = async () => {
    if (!selectedDept) return;
    if (!approvedExtractionId) {
      Failure("Cannot generate CO-PSO mapping: Course extraction must be approved first.");
      return;
    }
    setActionLoading("generate");
    try {
      const res = await Models.copso.generate({
        extractions_id: Number(approvedExtractionId),
        department_id: selectedDept.department_id,
      });
      Success(`CO-PSO mapping generation started for ${selectedDept.department_name}!`);

      // Poll until state is completed or failed
      const copsoId = res.copso_id;
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const check = await Models.copso.get(copsoId);
          if (check.current_state === "completed") {
            clearInterval(pollInterval);
            setActionLoading(null);
            Success(`CO-PSO Mapping generated successfully (v${check.version_id})!`);
            await loadDepartmentVersions(selectedDept.department_id, copsoId);
            loadDepartments();
          } else if (check.current_state === "failed") {
            clearInterval(pollInterval);
            setActionLoading(null);
            Failure("AI Generation failed. Please try again or create manually.");
            loadDepartmentVersions(selectedDept.department_id);
          } else if (attempts >= 40) {
            clearInterval(pollInterval);
            setActionLoading(null);
          }
        } catch {
          if (attempts >= 40) {
            clearInterval(pollInterval);
            setActionLoading(null);
          }
        }
      }, 3000);
    } catch (err: any) {
      setActionLoading(null);
      Failure(getErrorMessage(err, "Failed to start AI generation"));
    }
  };

  // 5. Version Lifecycle Actions: Approve, Activate, Deactivate, Delete
  const handleApprove = async () => {
    if (!selectedVersion) return;
    setActionLoading("approve");
    try {
      const res = await Models.copso.approve(selectedVersion.copso_id);
      Success("CO-PSO mapping approved successfully!");
      setCurrentMatrix(res);
      await loadDepartmentVersions(selectedDept!.department_id, selectedVersion.copso_id);
      loadDepartments();
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to approve mapping"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async () => {
    if (!selectedVersion) return;
    setActionLoading("activate");
    try {
      const res = await Models.copso.activate(selectedVersion.copso_id);
      Success("CO-PSO mapping set as Active for this department!");
      setCurrentMatrix(res);
      await loadDepartmentVersions(selectedDept!.department_id, selectedVersion.copso_id);
      loadDepartments();
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to activate mapping"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedVersion) return;
    setActionLoading("deactivate");
    try {
      const res = await Models.copso.deactivate(selectedVersion.copso_id);
      Success("CO-PSO mapping deactivated.");
      setCurrentMatrix(res);
      await loadDepartmentVersions(selectedDept!.department_id, selectedVersion.copso_id);
      loadDepartments();
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to deactivate mapping"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedVersion) return;
    if (selectedVersion.is_active) {
      Failure("Cannot delete an active version. Deactivate it first.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this CO-PSO mapping version?")) {
      return;
    }
    setActionLoading("delete");
    try {
      await Models.copso.delete(selectedVersion.copso_id);
      Success("Version deleted successfully.");
      await loadDepartmentVersions(selectedDept!.department_id);
      loadDepartments();
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to delete mapping version"));
    } finally {
      setActionLoading(null);
    }
  };

  // 6. Cell Modification & Dirty Cells handling
  const handleCellChange = (matrixId: number, newValue: number) => {
    setDirtyCells((prev) => ({
      ...prev,
      [matrixId]: {
        ...(prev[matrixId] || {}),
        matrix_value: newValue,
      },
    }));
  };

  const handleSaveDeltaChanges = async () => {
    if (!selectedVersion || Object.keys(dirtyCells).length === 0) return;
    setSavingDelta(true);
    try {
      for (const [matrixIdStr, changes] of Object.entries(dirtyCells)) {
        await Models.copso.update_matrix_cell(
          selectedVersion.copso_id,
          Number(matrixIdStr),
          changes
        );
      }
      Success("Matrix changes saved successfully!");
      setDirtyCells({});
      await loadMatrixDetail(selectedVersion.copso_id);
    } catch (err: any) {
      Failure(getErrorMessage(err, "Failed to save matrix changes"));
    } finally {
      setSavingDelta(false);
    }
  };

  // 7. Matrix Data Grouping (COs x PSOs)
  const { coList, psoList, matrixCellMap, psoAverages } = useMemo(() => {
    const cells = currentMatrix?.matrix_entries || [];
    const coMap = new Map<string, { id: number; co_code: string; description: string }>();
    const psoMap = new Map<string, { id: number; pso_code: string; description: string }>();
    const cellMap = new Map<string, any>();

    cells.forEach((cell: any) => {
      const coKey = cell.co_code || `CO${cell.course_outcome_id}`;
      const psoKey = cell.pso_code || `PSO${cell.pso_id}`;

      if (!coMap.has(coKey)) {
        coMap.set(coKey, {
          id: cell.course_outcome_id,
          co_code: coKey,
          description: cell.co_description || "",
        });
      }
      if (!psoMap.has(psoKey)) {
        psoMap.set(psoKey, {
          id: cell.pso_id,
          pso_code: psoKey,
          description: cell.pso_description || "",
        });
      }

      cellMap.set(`${coKey}-${psoKey}`, cell);
    });

    // Natural sort COs and PSOs
    const sortedCos = Array.from(coMap.values()).sort((a, b) =>
      a.co_code.localeCompare(b.co_code, undefined, { numeric: true })
    );
    const sortedPsos = Array.from(psoMap.values()).sort((a, b) =>
      a.pso_code.localeCompare(b.pso_code, undefined, { numeric: true })
    );

    // Calculate column averages for PSOs
    const avgs: Record<string, number> = {};
    sortedPsos.forEach((pso) => {
      let sum = 0;
      let count = 0;
      sortedCos.forEach((co) => {
        const cell = cellMap.get(`${co.co_code}-${pso.pso_code}`);
        const dirty = dirtyCells[cell?.id];
        const val = dirty ? dirty.matrix_value : cell?.matrix_value || 0;
        if (val > 0) {
          sum += val;
          count++;
        }
      });
      avgs[pso.pso_code] = count > 0 ? Number((sum / count).toFixed(2)) : 0;
    });

    return {
      coList: sortedCos,
      psoList: sortedPsos,
      matrixCellMap: cellMap,
      psoAverages: avgs,
    };
  }, [currentMatrix, dirtyCells]);

  // Filtered department cards
  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      const matchesSearch =
        d.department_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.department_code.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === "mapped") return d.total_versions > 0;
      if (statusFilter === "unmapped") return d.total_versions === 0;
      return true;
    });
  }, [departments, searchQuery, statusFilter]);

  // Color helper for matrix values (0, 1, 2, 3)
  const renderScoreBadge = (score: number) => {
    if (score === 3) {
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
          3
        </span>
      );
    }
    if (score === 2) {
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-xs font-bold text-blue-800 dark:bg-blue-950/70 dark:text-blue-300">
          2
        </span>
      );
    }
    if (score === 1) {
      return (
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-xs font-bold text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
          1
        </span>
      );
    }
    return <span className="text-xs font-medium text-slate-300 dark:text-slate-600">-</span>;
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER: VIEW 1 - DEPARTMENT CARDS OVERVIEW
  // ─────────────────────────────────────────────────────────────
  if (!selectedDept) {
    return (
      <div className="space-y-4">
        {/* Header & Filter Bar */}
        <div className="ui-card-compact flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="ui-icon-badge">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="section-ti">
                Department-Specific CO-PSO Mappings
              </h3>
              <p className="section-mini-cap">
                Select a department to view or configure its Program Specific Outcomes (PSOs)
                matrix for this course.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ui-input-sm h-8 w-48 pl-8 pr-7 sm:w-60"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  statusFilter === "all"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                All ({departments.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("mapped")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  statusFilter === "mapped"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                Mapped ({departments.filter((d) => d.total_versions > 0).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("unmapped")}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  statusFilter === "unmapped"
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                Unmapped ({departments.filter((d) => d.total_versions === 0).length})
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loadingDepts && (
          <div className="ui-card flex flex-col items-center justify-center py-12 text-center">
            <RefreshCw className="mb-2 h-7 w-7 animate-spin text-indigo-600" />
            <p className="card-ti">
              Loading department mappings...
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loadingDepts && filteredDepartments.length === 0 && (
          <div className="ui-empty-state">
            <Building2 className="mb-2 h-9 w-9 text-slate-300 dark:text-slate-600" />
            <h4 className="section-ti">
              No departments found
            </h4>
            <p className="section-mini-cap mt-1">Try adjusting your search query or filters.</p>
          </div>
        )}

        {/* Department Cards Grid */}
        {!loadingDepts && filteredDepartments.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDepartments.map((dept) => {
              const hasActive = dept.is_active;
              const hasVersions = dept.total_versions > 0;

              return (
                <div
                  key={dept.department_id}
                  onClick={() => handleSelectDepartment(dept)}
                  className="ui-card group relative flex cursor-pointer flex-col justify-between overflow-hidden transition hover:border-indigo-400 hover:shadow-md dark:hover:border-indigo-600"
                >
                  <div className="space-y-3">
                    {/* Top Row: Department Code & Status Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="ui-badge-code">
                        {dept.department_code}
                      </span>

                      {hasActive ? (
                        <span className="ui-badge-success">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Active v{dept.active_version_id}</span>
                        </span>
                      ) : hasVersions ? (
                        <span className="ui-badge-warning">
                          <Clock className="h-3 w-3" />
                          <span>v{dept.latest_version_id} (Draft)</span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Not Mapped
                        </span>
                      )}
                    </div>

                    {/* Department Name */}
                    <div>
                      <h4 className="card-ti transition group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {dept.department_name}
                      </h4>
                      <p className="ui-muted-text mt-1">
                        {dept.pso_count > 0
                          ? `${dept.pso_count} Program Specific Outcomes defined`
                          : "Standard PSOs will be auto-assigned"}
                      </p>
                    </div>
                  </div>

                  {/* Card Bottom Meta & Open Button */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                    <div className="ui-muted-text flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5" />
                      <span>{dept.total_versions} version{dept.total_versions === 1 ? "" : "s"}</span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition group-hover:translate-x-0.5 dark:text-indigo-400">
                      <span>{hasVersions ? "Open Studio" : "Configure"}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: VIEW 2 - DEPARTMENT DRILLDOWN STUDIO
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Studio Header & Breadcrumb */}
      <div className="ui-card-compact flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToOverview}
            className="ui-btn-icon"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="ui-badge-code">
                {selectedDept.department_code}
              </span>
              <h3 className="section-ti">
                {selectedDept.department_name}
              </h3>
            </div>
            <p className="section-mini-cap">
              Course: <span className="font-semibold">{courseCode}</span> {courseTitle && `- ${courseTitle}`}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isCoord && (
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={actionLoading === "generate" || loadingVersions}
              className="ui-btn-primary-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{actionLoading === "generate" ? "Generating..." : "Generate with AI"}</span>
            </button>
          )}

          {isCoord && selectedVersion && !selectedVersion.is_approved && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={Boolean(actionLoading)}
              className="ui-btn-success-sm"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Approve</span>
            </button>
          )}

          {isCoord && selectedVersion && selectedVersion.is_approved && !selectedVersion.is_active && (
            <button
              type="button"
              onClick={handleActivate}
              disabled={Boolean(actionLoading)}
              className="ui-btn-primary-sm"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Set Active</span>
            </button>
          )}

          {isCoord && selectedVersion && selectedVersion.is_active && (
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={Boolean(actionLoading)}
              className="ui-btn-secondary-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Deactivate</span>
            </button>
          )}

          {isCoord && selectedVersion && !selectedVersion.is_active && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={Boolean(actionLoading)}
              className="ui-btn-icon-danger"
              title="Delete Version"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Version Selector Bar */}
      <div className="ui-card-compact flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-500">
            Versions:
          </span>

          {versions.length === 0 && (
            <span className="no-content-text">No versions generated yet.</span>
          )}

          {versions.map((ver) => {
            const isSelected = selectedVersion?.copso_id === ver.copso_id;
            return (
              <button
                key={ver.copso_id}
                type="button"
                onClick={() => {
                  setSelectedVersion(ver);
                  loadMatrixDetail(ver.copso_id);
                }}
                className={isSelected ? "ui-btn-primary-sm" : "ui-btn-secondary-sm"}
              >
                <span>Version {ver.version_id}</span>
                {ver.is_active && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                )}
                {ver.is_approved && !ver.is_active && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>

        {selectedVersion && (
          <div className="flex items-center gap-2 text-xs">
            {selectedVersion.is_active && (
              <span className="ui-badge-success">
                <CheckCircle2 className="h-3 w-3" /> Active Version
              </span>
            )}
            {selectedVersion.is_approved && !selectedVersion.is_active && (
              <span className="ui-badge-info">
                Approved
              </span>
            )}
            {!selectedVersion.is_approved && (
              <span className="ui-badge-warning">
                Draft
              </span>
            )}
          </div>
        )}
      </div>

      {/* Unsaved Delta Changes Notification Bar */}
      {Object.keys(dirtyCells).length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-200">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="ui-body-text">
              You have <strong>{Object.keys(dirtyCells).length}</strong> unsaved cell change(s) in
              this matrix.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDirtyCells({})}
              className="ui-btn-secondary-sm"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSaveDeltaChanges}
              disabled={savingDelta}
              className="ui-btn-success-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{savingDelta ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Matrix Loading state */}
      {loadingMatrix && (
        <div className="ui-card flex flex-col items-center justify-center py-12 text-center">
          <RefreshCw className="mb-2 h-7 w-7 animate-spin text-indigo-600" />
          <p className="card-ti">
            Loading correlation matrix...
          </p>
        </div>
      )}

      {/* No Versions Empty State */}
      {!loadingMatrix && versions.length === 0 && (
        <div className="ui-empty-state">
          <Sparkles className="mb-3 h-10 w-10 text-indigo-400" />
          <h4 className="section-ti">
            No CO-PSO Mapping for {selectedDept.department_name}
          </h4>
          <p className="section-mini-cap mb-4 mt-1 max-w-md">
            Generate an AI-powered correlation matrix mapping the course outcomes to this
            department's Program Specific Outcomes (PSOs).
          </p>
          {isCoord && (
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={actionLoading === "generate"}
              className="ui-btn-primary-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{actionLoading === "generate" ? "Generating..." : "Generate CO-PSO Mapping"}</span>
            </button>
          )}
        </div>
      )}

      {/* Interactive Matrix Table */}
      {!loadingMatrix && selectedVersion && coList.length > 0 && (
        <div className="ui-card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-indigo-200/80 bg-[#EEF2FF] dark:border-slate-700 dark:bg-slate-800/60">
                  <th className="w-64 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Course Outcomes (CO)
                  </th>
                  {psoList.map((pso) => (
                    <th
                      key={pso.pso_code}
                      className="group relative min-w-24 cursor-help px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100"
                      title={pso.description}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{pso.pso_code}</span>
                        <Info className="h-3 w-3 text-slate-400 transition group-hover:text-indigo-600" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {coList.map((co) => (
                  <tr
                    key={co.co_code}
                    className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    {/* CO Description Column */}
                    <td className="px-4 py-3 align-middle">
                      <div className="text-[13px] font-bold text-indigo-700 dark:text-indigo-400">
                        {co.co_code}
                      </div>
                      <div className="ui-body-text line-clamp-2" title={co.description}>
                        {co.description || "Course outcome details"}
                      </div>
                    </td>

                    {/* PSO Score Cells */}
                    {psoList.map((pso) => {
                      const cell = matrixCellMap.get(`${co.co_code}-${pso.pso_code}`);
                      if (!cell) {
                        return (
                          <td key={pso.pso_code} className="px-3 py-3 text-center align-middle">
                            <span className="text-xs text-slate-300">-</span>
                          </td>
                        );
                      }

                      const dirty = dirtyCells[cell.id];
                      const currentValue = dirty ? dirty.matrix_value : cell.matrix_value || 0;
                      const justification = dirty?.justification || cell.justification;

                      return (
                        <td
                          key={pso.pso_code}
                          className="group/cell relative px-3 py-3 text-center align-middle"
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            {/* Score selector / Badge */}
                            {isCoord ? (
                              <select
                                value={currentValue}
                                onChange={(e) =>
                                  handleCellChange(cell.id, Number(e.target.value))
                                }
                                className={`h-8 w-11 rounded-lg border text-center text-xs font-bold transition focus:outline-none ${
                                  currentValue === 3
                                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    : currentValue === 2
                                    ? "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                    : currentValue === 1
                                    ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    : "border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                                }`}
                              >
                                <option value={0}>-</option>
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                              </select>
                            ) : (
                              renderScoreBadge(currentValue)
                            )}

                            {/* Justification link */}
                            {justification && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveCellModal({
                                    ...cell,
                                    currentValue,
                                    co_code: co.co_code,
                                    pso_code: pso.pso_code,
                                    justification,
                                  })
                                }
                                className="text-[11px] font-medium text-indigo-600 transition hover:underline dark:text-indigo-400"
                                title="Read Justification"
                              >
                                View note
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Average Row */}
                <tr className="border-t-2 border-slate-200 bg-slate-50/90 font-bold dark:border-slate-700 dark:bg-slate-800/80">
                  <td className="px-4 py-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                    Average Correlation
                  </td>
                  {psoList.map((pso) => {
                    const avg = psoAverages[pso.pso_code] || 0;
                    return (
                      <td
                        key={pso.pso_code}
                        className="px-3 py-3 text-center text-xs font-bold text-slate-900 dark:text-white"
                      >
                        {avg > 0 ? avg : "-"}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Ratings:</span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                3 = High
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                2 = Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                1 = Low
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
                0 = None / Not Mapped
              </span>
            </div>
            <span className="ui-muted-text">Department: {selectedDept.department_name}</span>
          </div>
        </div>
      )}

      {/* Justification Modal */}
      {activeCellModal && (
        <div className="ui-modal-backdrop">
          <div className="ui-modal">
            <div className="ui-card-header">
              <div className="flex items-center gap-2">
                <span className="ui-badge-code">
                  {activeCellModal.co_code} → {activeCellModal.pso_code}
                </span>
                <span className="ui-muted-text">
                  (Score: {activeCellModal.currentValue})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveCellModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 py-4">
              <label className="ui-label">
                Educational Alignment Reasoning
              </label>
              <div className="ui-subcard ui-body-text">
                {activeCellModal.justification || "No specific justification recorded."}
              </div>
            </div>

            <div className="ui-modal-footer">
              <button
                type="button"
                onClick={() => setActiveCellModal(null)}
                className="ui-btn-secondary-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoPsoMappingSection;
