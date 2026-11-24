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
    <div className="space-y-6">
      {/* ── Top Level Sub-Navigation: Builder vs Analytics ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("builder")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "builder"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "analytics"
                ? "bg-purple-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>CIA Analytics & Performance</span>
          </button>
        </div>

        {/* Quick Helper / Info */}
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>Course:</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">{courseCode}</span>
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
        <div className="space-y-6">
          {/* Stepper Progress Bar (Visible when in an active flow step) */}
          {flowStep !== "overview" && (
            <div className="rounded-2xl border border-purple-200/80 bg-white p-4 shadow-xs dark:border-purple-900/50 dark:bg-gray-850">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Stepper Steps */}
                <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0">
                  {/* Step 1: Template */}
                  <button
                    type="button"
                    onClick={() => setFlowStep("template_selection")}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                      flowStep === "template_selection"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                      1
                    </span>
                    <span>1. Choose / Create Template</span>
                    {activeTemplate && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    )}
                  </button>

                  <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />

                  {/* Step 2: Question Assembly */}
                  <button
                    type="button"
                    disabled={!selectedTemplateId}
                    onClick={() => selectedTemplateId && setFlowStep("assembly")}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      flowStep === "assembly"
                        ? "bg-purple-600 text-white shadow-xs"
                        : selectedTemplateId
                        ? "text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 cursor-pointer"
                        : "text-gray-400 bg-gray-50 dark:bg-gray-800/40 opacity-60 cursor-not-allowed"
                    }`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                      2
                    </span>
                    <span>2. Question Assembly Studio</span>
                  </button>

                  <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />

                  {/* Step 3: Schedule Test */}
                  <button
                    type="button"
                    disabled={!selectedTemplateId}
                    onClick={() => selectedTemplateId && setFlowStep("schedule")}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      flowStep === "schedule"
                        ? "bg-purple-600 text-white shadow-xs"
                        : selectedTemplateId
                        ? "text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 cursor-pointer"
                        : "text-gray-400 bg-gray-50 dark:bg-gray-800/40 opacity-60 cursor-not-allowed"
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
                  className="self-end sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition cursor-pointer shrink-0"
                >
                  <span>✕ Exit Flow / Overview</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: OVERVIEW DASHBOARD ── */}
          {flowStep === "overview" && (
            <div className="space-y-6">
              {/* Primary Linear Hero CTA Banner */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white shadow-lg shadow-purple-500/10">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-xs">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Linear Assessment Workflow</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Course Internal Assessment (CIA) Studio
                  </h2>
                  <p className="text-xs sm:text-sm text-purple-100">
                    A guided, step-by-step workflow: Select or configure your question paper blueprint, assemble questions with AI synthesis, preview the university exam paper, and schedule tests for classrooms.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setFlowStep("template_selection")}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-purple-700 font-bold text-xs sm:text-sm hover:bg-purple-50 active:scale-[0.98] transition shadow-md cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Start CIA Assessment Flow</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditTestId(null);
                      setIsCreateTestModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/15 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition backdrop-blur-xs cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" />
                    <span>Quick Schedule</span>
                  </button>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-850 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Blueprint Templates</span>
                    <FileCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                    {templates.length}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Configured for {courseCode}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-850 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Scheduled CIA Tests</span>
                    <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                    {activeTests.length}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {archivedTests.length} archived tests
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-850 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Active Outcomes</span>
                    <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">
                    {coCodes.length} COs
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Mapped for assessment evaluation
                  </p>
                </div>
              </div>

              {/* Blueprints Section */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-purple-600" />
                      <span>Question Paper Blueprints & Assembly</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Blueprints define the exam structure, mark distribution, and question slots.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(null);
                        setIsCreateTemplateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Create Blueprint</span>
                    </button>
                  </div>
                </div>

                {templates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 text-center">
                    <FileCheck className="h-10 w-10 text-gray-400 mb-2" />
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      No Question Paper Templates Yet
                    </h4>
                    <p className="text-xs text-gray-500 max-w-md mt-1 mb-4">
                      Create your first question paper template blueprint or start the linear CIA flow to assemble exam questions.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTemplate(null);
                        setIsCreateTemplateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create First Blueprint</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs hover:border-purple-300 dark:border-gray-800 dark:bg-gray-850 transition"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              {tmpl.status || "drafted"}
                            </span>
                            <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                              {tmpl.total_maximum_marks} Marks
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                            {tmpl.template_name}
                          </h4>

                          <p className="text-xs text-gray-500 line-clamp-2">
                            {tmpl.description || "Question paper blueprint."}
                          </p>

                          <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
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

                        <div className="pt-4 mt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTemplate(tmpl);
                              setIsCreateTemplateModalOpen(true);
                            }}
                            className="text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
                          >
                            Edit Blueprint
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectTemplateForAssembly(tmpl.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer shadow-2xs"
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
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span>Scheduled CIA Tests & Question Papers</span>
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tests assigned to student cohorts with marks entry and extraction status.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditTestId(null);
                      setIsCreateTestModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60 rounded-xl transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Schedule New Test</span>
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
            <div className="space-y-6">
              {/* Stepper Header Prompt */}
              <div className="p-6 rounded-3xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Step 1 of 3
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Choose an Existing Blueprint or Create a New One
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Select a blueprint template to populate question slots, or design a new template blueprint for this assessment.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsCreateTemplateModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 active:scale-[0.98] transition shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    <span>+ Create New Blueprint</span>
                  </button>
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Option A: Existing Templates List (2 Columns on large) */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-purple-600" />
                      <span>Available Blueprints for {courseCode} ({templates.length})</span>
                    </h3>
                  </div>

                  {templates.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-850">
                      <p className="text-xs font-semibold text-gray-500">
                        No templates found. Click "Create New Blueprint" to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {templates.map((tmpl) => (
                        <div
                          key={tmpl.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-200 bg-white hover:border-purple-400 dark:border-gray-800 dark:bg-gray-850 transition shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                {tmpl.template_name}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950 dark:text-purple-300">
                                {tmpl.total_maximum_marks} Marks
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-1">
                              {tmpl.description || `${tmpl.sections?.length || 0} sections configured`}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectTemplateForAssembly(tmpl.id)}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer shrink-0 shadow-2xs"
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
                <div className="p-6 rounded-3xl border-2 border-dashed border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 text-center space-y-4">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/20">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Create Custom Blueprint
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Define Part A/B sections, marks per question, and question outcome targets. Once created, you will proceed directly to question assembly.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsCreateTemplateModalOpen(true);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer shadow-xs"
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
            <div className="space-y-6">
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
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                      Step 3 of 3
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Schedule CIA Test for Classrooms
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Link the assembled question paper ({activeTemplate?.template_name || `Template #${selectedTemplateId}`}) to a CIA assessment.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFlowStep("assembly")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 rounded-xl transition cursor-pointer"
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
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition cursor-pointer shadow-xs"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Open Schedule Form</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                        Question Paper Assembled: {activeTemplate?.template_name}
                      </h4>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400">
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
                    className="px-4 py-2 text-xs font-bold text-purple-700 bg-white border border-purple-300 hover:bg-purple-50 rounded-xl transition cursor-pointer shadow-2xs"
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
