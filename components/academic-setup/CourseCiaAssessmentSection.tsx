import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  FileCheck,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  BarChart2,
  Layers,
  Award,
  Calendar,
  Clock,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Search,
  Filter,
  Check,
  BookOpen,
} from "lucide-react";
import { useCiaTemplates } from "@/hook/useCiaTemplates";
import useCiaTests from "@/hook/useCiaTests";
import { useCourseOutcomes } from "@/hook/useCourseOutcomes";
import { QuestionPaperTemplate, CreateTemplatePayload } from "@/types/cia-test.types";
import TemplateCard from "@/components/cia-tests/templates/TemplateCard";
import CreateTemplateModal from "@/components/cia-tests/templates/CreateTemplateModal";
import QuestionAssemblyStudio from "@/components/cia-tests/assembly/QuestionAssemblyStudio";
import CiaTestList from "@/components/cia-tests/CiaTestList";
import CreateCiaTestModal from "@/components/cia-tests/modal/CreateCiaTestModal";
import CiaAnalyticsTab from "./CiaAnalyticsTab";

interface CourseCiaAssessmentSectionProps {
  courseId: number | string;
  courseCode: string;
  courseTitle: string;
  initialSubTab?: "builder" | "analytics";
}

export type CiaFlowStep = "overview" | "template_selection" | "assembly" | "schedule";

export const CourseCiaAssessmentSection: React.FC<CourseCiaAssessmentSectionProps> = ({
  courseId,
  courseCode,
  courseTitle,
  initialSubTab = "builder",
}) => {
  const router = useRouter();
  const validCourseId = Number(courseId) || 1;

  // Outer section toggle: Builder (Linear Flow) vs CIA Analytics
  const [activeSubTab, setActiveSubTab] = useState<"builder" | "analytics">(initialSubTab);

  // Stepper flow within the Assessment Builder: "overview" | "template_selection" | "assembly" | "schedule"
  const [flowStep, setFlowStep] = useState<CiaFlowStep>("overview");

  // Selected template for assembly & scheduling
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Template creation modal state
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionPaperTemplate | null>(null);

  // CIA Test creation modal state
  const [isCreateTestModalOpen, setIsCreateTestModalOpen] = useState<boolean>(false);
  const [editTestId, setEditTestId] = useState<number | null>(null);

  // Hooks
  const {
    templates,
    loading: templatesLoading,
    actionLoadingId: templateActionId,
    statusFilter,
    setStatusFilter,
    handleDeleteTemplate,
    handleCreateTemplate,
    handleUpdateTemplate,
  } = useCiaTemplates(validCourseId);

  const {
    activeTests,
    archivedTests,
    filteredTests,
    loading: testsLoading,
    actionLoadingId: testActionId,
    search: testSearch,
    setSearch: setTestSearch,
    statusFilter: testStatusFilter,
    setStatusFilter: setTestStatusFilter,
    refresh: refreshCiaTests,
    handleArchive,
    handleUnarchive,
    handleDelete: handleDeleteTest,
  } = useCiaTests(validCourseId);

  const { coCodes } = useCourseOutcomes(validCourseId);

  // Find currently selected template object
  const activeTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  // Handle template selection to start assembly
  const handleSelectTemplateForAssembly = (templateId: number) => {
    setSelectedTemplateId(templateId);
    setFlowStep("assembly");
  };

  // Handle modal submit: If creating, auto-select the newly created template and proceed directly to assembly
  const handleTemplateModalSubmit = async (
    payload: CreateTemplatePayload,
    editId?: number
  ): Promise<boolean> => {
    if (editId) {
      return await handleUpdateTemplate(editId, payload);
    } else {
      const res: any = await handleCreateTemplate(payload);
      if (res) {
        // If API returned the template with ID, select it directly
        const newId = typeof res === "object" && res.id ? res.id : null;
        if (newId) {
          setSelectedTemplateId(newId);
          setIsCreateTemplateModalOpen(false);
          setFlowStep("assembly");
          return true;
        }
        // Fallback: If ID wasn't in response, refresh and attempt to pick the latest
        setTimeout(() => {
          if (templates.length > 0) {
            const latest = templates[templates.length - 1];
            if (latest?.id) setSelectedTemplateId(latest.id);
          }
          setIsCreateTemplateModalOpen(false);
          setFlowStep("assembly");
        }, 500);
        return true;
      }
      return false;
    }
  };

  const handleEditTest = (id: number) => {
    setEditTestId(id);
    setIsCreateTestModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* ── Top Level Sub-Navigation: Builder vs Analytics ── */}
      <div className="ui-card-compact flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("builder")}
            className={`ui-tab-pill ${
              activeSubTab === "builder" ? "ui-tab-pill-active" : "ui-tab-pill-idle"
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>Assessments & Question Papers</span>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
              {templates.length} Blueprints
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("analytics")}
            className={`ui-tab-pill ${
              activeSubTab === "analytics" ? "ui-tab-pill-active" : "ui-tab-pill-idle"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>CIA Analytics & Performance</span>
          </button>
        </div>

        {/* Quick Helper / Info */}
        <div className="flex items-center gap-2">
          <span className="section-mini-cap">Course:</span>
          <span className="ui-badge-code">{courseCode}</span>
        </div>
      </div>

      {/* ── SUB-VIEW 2: CIA Analytics ── */}
      {activeSubTab === "analytics" && (
        <div className="space-y-4">
          <CiaAnalyticsTab courseId={validCourseId} />
        </div>
      )}

      {/* ── SUB-VIEW 1: Assessment Builder (Linear CIA Flow) ── */}
      {activeSubTab === "builder" && (
        <div className="space-y-4">
          {/* Stepper Progress Bar (Visible when in an active flow step) */}
          {flowStep !== "overview" && (
            <div className="ui-card-compact">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                {/* Stepper Steps */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:gap-3 sm:pb-0">
                  {/* Step 1: Template */}
                  <button
                    type="button"
                    onClick={() => setFlowStep("template_selection")}
                    className={`ui-tab-pill ${
                      flowStep === "template_selection" ? "ui-tab-pill-active" : "ui-tab-pill-idle"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                      1
                    </span>
                    <span>1. Choose / Create Template</span>
                    {activeTemplate && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </button>

                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />

                  {/* Step 2: Question Assembly */}
                  <button
                    type="button"
                    disabled={!selectedTemplateId}
                    onClick={() => selectedTemplateId && setFlowStep("assembly")}
                    className={`ui-tab-pill ${
                      flowStep === "assembly"
                        ? "ui-tab-pill-active"
                        : selectedTemplateId
                        ? "ui-tab-pill-idle"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                      2
                    </span>
                    <span>2. Question Assembly Studio</span>
                  </button>

                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />

                  {/* Step 3: Schedule Test */}
                  <button
                    type="button"
                    disabled={!selectedTemplateId}
                    onClick={() => selectedTemplateId && setFlowStep("schedule")}
                    className={`ui-tab-pill ${
                      flowStep === "schedule"
                        ? "ui-tab-pill-active"
                        : selectedTemplateId
                        ? "ui-tab-pill-idle"
                        : "cursor-not-allowed opacity-50"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                      3
                    </span>
                    <span>3. Schedule CIA Test</span>
                  </button>
                </div>

                {/* Exit flow button */}
                <button
                  type="button"
                  onClick={() => setFlowStep("overview")}
                  className="ui-btn-secondary-sm self-end sm:self-auto"
                >
                  <span>✕ Exit Flow / Overview</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: OVERVIEW DASHBOARD ── */}
          {flowStep === "overview" && (
            <div className="space-y-4">
              {/* Primary Linear Hero CTA Banner */}
              <div className="flex flex-col justify-between gap-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-5 text-white shadow-sm md:flex-row md:items-center sm:p-6">
                <div className="max-w-xl space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="!text-white">Linear Assessment Workflow</span>
                  </div>
                  <h2 className="text-lg font-bold tracking-tight !text-white sm:text-xl">
                    Course Internal Assessment (CIA) Studio
                  </h2>
                  <p className="text-xs leading-relaxed !text-indigo-100 sm:text-[13px]">
                    A guided, step-by-step workflow: Select or configure your question paper blueprint, assemble questions with AI synthesis, preview the university exam paper, and schedule tests for classrooms.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => setFlowStep("template_selection")}
                    className="ui-btn-secondary"
                  >
                    <Plus className="h-4 w-4 text-indigo-600" />
                    <span>Start CIA Assessment Flow</span>
                    <ArrowRight className="h-4 w-4 text-indigo-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditTestId(null);
                      setIsCreateTestModalOpen(true);
                    }}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2 text-xs font-semibold !text-white transition hover:bg-white/25"
                  >
                    <Calendar className="h-4 w-4" />
                    <span className="!text-white">Quick Schedule</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="stat-card stat-card-indigo">
                  <FileCheck className="h-6 w-6 shrink-0 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <p className="stat-value">{templates.length}</p>
                    <p className="stat-label">Blueprint Templates ({courseCode})</p>
                  </div>
                </div>

                <div className="stat-card stat-card-purple">
                  <Calendar className="h-6 w-6 shrink-0 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="stat-value">{activeTests.length}</p>
                    <p className="stat-label">Scheduled CIA Tests ({archivedTests.length} archived)</p>
                  </div>
                </div>

                <div className="stat-card stat-card-emerald">
                  <Award className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="stat-value">{coCodes.length} COs</p>
                    <p className="stat-label">Active Mapped Outcomes</p>
                  </div>
                </div>
              </div>

              {/* Blueprints Section */}
              <div className="ui-card space-y-4">
                <div className="ui-card-header">
                  <div className="flex items-center gap-2.5">
                    <div className="ui-icon-badge">
                      <FileCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="section-ti">
                        Question Paper Blueprints & Assembly
                      </h3>
                      <p className="section-mini-cap">
                        Blueprints define the exam structure, mark distribution, and question slots.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsCreateTemplateModalOpen(true);
                    }}
                    className="ui-btn-primary-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create Blueprint</span>
                  </button>
                </div>

                {templates.length === 0 ? (
                  <div className="ui-empty-state">
                    <FileCheck className="mb-2 h-10 w-10 text-slate-400" />
                    <h4 className="section-ti">
                      No Question Paper Templates Yet
                    </h4>
                    <p className="section-mini-cap mb-4 mt-1 max-w-md">
                      Create your first question paper template blueprint or start the linear CIA flow to assemble exam questions.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(null);
                        setIsCreateTemplateModalOpen(true);
                      }}
                      className="ui-btn-primary-sm"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create First Blueprint</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        className="ui-subcard flex flex-col justify-between transition hover:border-indigo-300"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="ui-badge-purple uppercase">
                              {tmpl.status || "drafted"}
                            </span>
                            <span className="ui-badge-code">
                              {tmpl.total_maximum_marks} Marks
                            </span>
                          </div>

                          <h4 className="card-ti line-clamp-1">
                            {tmpl.template_name}
                          </h4>

                          <p className="ui-body-text line-clamp-2">
                            {tmpl.description || "Question paper blueprint."}
                          </p>

                          <div className="ui-muted-text flex items-center gap-3 pt-0.5">
                            <span>{tmpl.sections?.length || 0} Sections</span>
                            <span>•</span>
                            <span>
                              {tmpl.sections?.reduce(
                                (acc, s) => acc + (s.questions?.length || 0),
                                0
                              ) || 0}{" "}
                              Questions
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700/80">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplate(tmpl);
                              setIsCreateTemplateModalOpen(true);
                            }}
                            className="ui-btn-secondary-sm"
                          >
                            Edit Blueprint
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectTemplateForAssembly(tmpl.id)}
                            className="ui-btn-primary-sm"
                          >
                            <span>Assemble Questions</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Scheduled CIA Tests Section */}
              <div className="ui-card space-y-4">
                <div className="ui-card-header">
                  <div className="flex items-center gap-2.5">
                    <div className="ui-icon-badge">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="section-ti">
                        Scheduled CIA Tests & Question Papers
                      </h3>
                      <p className="section-mini-cap">
                        Tests assigned to student cohorts with marks entry and extraction status.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditTestId(null);
                      setIsCreateTestModalOpen(true);
                    }}
                    className="ui-btn-primary-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Schedule New Test</span>
                  </button>
                </div>

                <CiaTestList
                  tests={filteredTests}
                  loading={testsLoading}
                  isArchivedView={testStatusFilter === "archived"}
                  actionLoadingId={testActionId}
                  onEdit={handleEditTest}
                  onArchive={handleArchive}
                  onUnarchive={handleUnarchive}
                  onDelete={handleDeleteTest}
                  onCreateClick={() => {
                    setEditTestId(null);
                    setIsCreateTestModalOpen(true);
                  }}
                />
              </div>
            </div>
          )}

          {/* ── STEP 1: TEMPLATE SELECTION / CREATION ── */}
          {flowStep === "template_selection" && (
            <div className="space-y-4">
              {/* Stepper Header Prompt */}
              <div className="ui-card">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-1">
                    <span className="ui-badge-code">
                      Step 1 of 3
                    </span>
                    <h2 className="section-ti pt-1">
                      Choose an Existing Blueprint or Create a New One
                    </h2>
                    <p className="section-mini-cap">
                      Select a blueprint template to populate question slots, or design a new template blueprint for this assessment.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsCreateTemplateModalOpen(true);
                    }}
                    className="ui-btn-primary-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create New Blueprint</span>
                  </button>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
                {/* Option A: Existing Templates List (2 Columns on large) */}
                <div className="ui-card space-y-4 lg:col-span-2">
                  <div className="ui-card-header">
                    <div className="flex items-center gap-2.5">
                      <div className="ui-icon-badge">
                        <FileCheck className="h-4 w-4" />
                      </div>
                      <h3 className="section-ti">
                        Available Blueprints for {courseCode} ({templates.length})
                      </h3>
                    </div>
                  </div>

                  {templates.length === 0 ? (
                    <div className="ui-empty-state">
                      <p className="section-mini-cap">
                        No templates found. Click &quot;Create New Blueprint&quot; to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {templates.map((tmpl) => (
                        <div
                          key={tmpl.id}
                          className="ui-subcard flex flex-col justify-between gap-3 transition hover:border-indigo-400 sm:flex-row sm:items-center"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="card-ti">
                                {tmpl.template_name}
                              </h4>
                              <span className="ui-badge-code">
                                {tmpl.total_maximum_marks} Marks
                              </span>
                            </div>
                            <p className="ui-muted-text line-clamp-1">
                              {tmpl.description || `${tmpl.sections?.length || 0} sections configured`}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectTemplateForAssembly(tmpl.id)}
                            className="ui-btn-primary-sm"
                          >
                            <span>Select & Assemble</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Option B: Create New Blueprint Card (1 Column) */}
                <div className="ui-empty-state space-y-4">
                  <div className="ui-icon-badge !h-12 !w-12">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="section-ti">
                      Create Custom Blueprint
                    </h4>
                    <p className="section-mini-cap mt-1">
                      Define Part A/B sections, marks per question, and question outcome targets. Once created, you will proceed directly to question assembly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsCreateTemplateModalOpen(true);
                    }}
                    className="ui-btn-primary w-full"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Template</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: QUESTION ASSEMBLY STUDIO ── */}
          {flowStep === "assembly" && selectedTemplateId && (
            <div className="space-y-4">
              <QuestionAssemblyStudio
                courseId={validCourseId}
                templateId={selectedTemplateId}
                courseCode={courseCode}
                courseTitle={courseTitle}
                onBackToTemplates={() => setFlowStep("template_selection")}
                onProceedToSchedule={() => setFlowStep("schedule")}
                onEditTemplateBlueprint={() => {
                  if (activeTemplate) {
                    setEditingTemplate(activeTemplate);
                    setIsCreateTemplateModalOpen(true);
                  }
                }}
              />
            </div>
          )}

          {/* ── STEP 3: SCHEDULE / PUBLISH CIA TEST ── */}
          {flowStep === "schedule" && (
            <div className="space-y-4">
              <div className="ui-card space-y-4">
                <div className="ui-card-header">
                  <div>
                    <span className="ui-badge-code">
                      Step 3 of 3
                    </span>
                    <h2 className="section-ti pt-1">
                      Schedule CIA Test for Classrooms
                    </h2>
                    <p className="section-mini-cap">
                      Link the assembled question paper ({activeTemplate?.template_name || `Template #${selectedTemplateId}`}) to a CIA assessment.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFlowStep("assembly")}
                      className="ui-btn-secondary-sm"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Back to Assembly</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditTestId(null);
                        setIsCreateTestModalOpen(true);
                      }}
                      className="ui-btn-primary-sm"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Open Schedule Form</span>
                    </button>
                  </div>
                </div>

                <div className="ui-subcard flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="ui-icon-badge">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="card-ti">
                        Question Paper Assembled: {activeTemplate?.template_name}
                      </h4>
                      <p className="ui-muted-text">
                        Total Marks: {activeTemplate?.total_maximum_marks || 100} • Status: Ready
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditTestId(null);
                      setIsCreateTestModalOpen(true);
                    }}
                    className="ui-btn-secondary-sm"
                  >
                    Schedule Assessment Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}

      {/* Template Creation / Edit Modal */}
      <CreateTemplateModal
        isOpen={isCreateTemplateModalOpen}
        courseCode={courseCode}
        courseId={validCourseId}
        availableCos={coCodes}
        initialData={editingTemplate}
        onClose={() => {
          setIsCreateTemplateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSubmit={handleTemplateModalSubmit}
      />

      {/* CIA Test Creation / Edit Modal */}
      <CreateCiaTestModal
        isOpen={isCreateTestModalOpen}
        courseId={validCourseId}
        courseCode={courseCode}
        courseTitle={courseTitle}
        editTestId={editTestId}
        onClose={() => {
          setIsCreateTestModalOpen(false);
          setEditTestId(null);
        }}
        onSuccess={async () => {
          await refreshCiaTests();
          setIsCreateTestModalOpen(false);
          setEditTestId(null);
        }}
      />
    </div>
  );
};

export default CourseCiaAssessmentSection;
