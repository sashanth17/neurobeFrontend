import React from "react";
import {
  ScopeMode,
  DistributionMode,
  KnowledgeLevelBreakdown,
  MCQQuestion,
  TopicRow,
} from "./types";
import { GenerationScopeSelector } from "./GenerationScopeSelector";
import { DistributionModeSelector } from "./DistributionModeSelector";
import { PedagogicalFocusCard } from "./PedagogicalFocusCard";
import { OutputConfigCard } from "./OutputConfigCard";
import { QuestionReviewPool } from "./QuestionReviewPool";

export interface MCQStudioWorkspaceProps {
  // ── 1. Scope props
  scopeMode: ScopeMode;
  onScopeModeChange: (mode: ScopeMode) => void;
  activeUnits: any[];
  selectedUnitIds: (string | number)[];
  onToggleUnitSelection: (unitId: string | number) => void;
  onSelectAllUnits: () => void;
  selectedSingleUnitId: string | number;
  onSingleUnitChange: (unitId: string | number) => void;
  topicRows: TopicRow[];
  onAddTopicRow: () => void;
  onRemoveTopicRow: (id: string) => void;
  onUpdateTopicRow: (id: string, patch: Partial<TopicRow>) => void;
  totalTopicQuestions: number;
  microTopics: string[];
  onAddMicroTopic: (topic: string) => void;
  onRemoveMicroTopic: (topic: string) => void;

  // ── 2. Distribution Mode props
  distributionMode: DistributionMode;
  onDistributionModeChange: (mode: DistributionMode) => void;
  targetQuestionCount: number;
  onTargetQuestionCountChange: (count: number) => void;
  knowledgeBreakdown: KnowledgeLevelBreakdown;
  onUpdateKnowledgeBreakdown: (kLevel: string, count: number) => void;
  onApplyKnowledgePreset: (preset: "balanced" | "foundational" | "advanced") => void;
  breakdown2D: Record<string, Record<string, number>>;
  onUpdateBreakdown2D: (kLevel: string, diff: string, val: number) => void;
  onAutoBalance2D: () => void;

  // ── 3. Pedagogical Steering props
  description: string;
  onDescriptionChange: (desc: string) => void;
  activePresetId: string | null;
  onSelectPreset: (presetId: string) => void;

  // ── 4. Output Configuration props
  includeExplanation: boolean;
  onToggleExplanation: () => void;
  shuffleOptions: boolean;
  onToggleShuffle: () => void;
  marksPerQuestion: string;
  onMarksChange: (marks: string) => void;

  // ── 5. Generation Execution Actions
  isGeneratingAI: boolean;
  canGenerate: boolean;
  validationError?: string | null;
  onGenerateForeground: () => void;
  onGenerateBackground: () => void;

  // ── 6. Review Pool props
  currentQuestions: MCQQuestion[];
  displayedQuestions: MCQQuestion[];
  selectedBannerFilter: string;
  onSelectBannerFilter: (filter: any) => void;
  recentQuestionIds: string[];
  expandedQuestionIds: string[];
  onToggleExpandOne: (id: string) => void;
  onToggleExpandAll: () => void;
  onToggleApprove: (id: string) => void;
  onToggleArchive: (id: string) => void;
  onEditQuestion: (q: MCQQuestion) => void;
  onViewQuestion: (q: MCQQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onApproveAll: () => void;
  onCreateQuestionSet: () => void;
}

export const MCQStudioWorkspace: React.FC<MCQStudioWorkspaceProps> = ({
  // Scope
  scopeMode,
  onScopeModeChange,
  activeUnits,
  selectedUnitIds,
  onToggleUnitSelection,
  onSelectAllUnits,
  selectedSingleUnitId,
  onSingleUnitChange,
  topicRows,
  onAddTopicRow,
  onRemoveTopicRow,
  onUpdateTopicRow,
  totalTopicQuestions,
  microTopics,
  onAddMicroTopic,
  onRemoveMicroTopic,

  // Distribution
  distributionMode,
  onDistributionModeChange,
  targetQuestionCount,
  onTargetQuestionCountChange,
  knowledgeBreakdown,
  onUpdateKnowledgeBreakdown,
  onApplyKnowledgePreset,
  breakdown2D,
  onUpdateBreakdown2D,
  onAutoBalance2D,

  // Pedagogical
  description,
  onDescriptionChange,
  activePresetId,
  onSelectPreset,

  // Output
  includeExplanation,
  onToggleExplanation,
  shuffleOptions,
  onToggleShuffle,
  marksPerQuestion,
  onMarksChange,

  // Actions
  isGeneratingAI,
  canGenerate,
  validationError,
  onGenerateForeground,
  onGenerateBackground,

  // Pool
  currentQuestions,
  displayedQuestions,
  selectedBannerFilter,
  onSelectBannerFilter,
  recentQuestionIds,
  expandedQuestionIds,
  onToggleExpandOne,
  onToggleExpandAll,
  onToggleApprove,
  onToggleArchive,
  onEditQuestion,
  onViewQuestion,
  onDeleteQuestion,
  onApproveAll,
  onCreateQuestionSet,
}) => {
  return (
    <div className="space-y-6">
      {/* ── STEP 1: Syllabus Granularity & Scope Selection ── */}
      <GenerationScopeSelector
        scopeMode={scopeMode}
        onScopeModeChange={onScopeModeChange}
        activeUnits={activeUnits}
        selectedUnitIds={selectedUnitIds}
        onToggleUnitSelection={onToggleUnitSelection}
        onSelectAllUnits={onSelectAllUnits}
        selectedSingleUnitId={selectedSingleUnitId}
        onSingleUnitChange={onSingleUnitChange}
        topicRows={topicRows}
        onAddTopicRow={onAddTopicRow}
        onRemoveTopicRow={onRemoveTopicRow}
        onUpdateTopicRow={onUpdateTopicRow}
        totalTopicQuestions={totalTopicQuestions}
        microTopics={microTopics}
        onAddMicroTopic={onAddMicroTopic}
        onRemoveMicroTopic={onRemoveMicroTopic}
      />

      {/* ── STEP 2: Cognitive Blueprint & Distribution Mode ── */}
      <DistributionModeSelector
        distributionMode={distributionMode}
        onDistributionModeChange={onDistributionModeChange}
        targetQuestionCount={targetQuestionCount}
        knowledgeBreakdown={knowledgeBreakdown}
        onUpdateKnowledgeBreakdown={onUpdateKnowledgeBreakdown}
        onApplyKnowledgePreset={onApplyKnowledgePreset}
        breakdown2D={breakdown2D}
        onUpdateBreakdown2D={onUpdateBreakdown2D}
        onAutoBalance2D={onAutoBalance2D}
      />

      {/* ── STEP 3: Pedagogical Steering & Custom AI Prompt (Optional) ── */}
      <PedagogicalFocusCard
        description={description}
        onDescriptionChange={onDescriptionChange}
        activePresetId={activePresetId}
        onSelectPreset={onSelectPreset}
      />

      {/* ── STEP 4: Output Specifications & Execution ── */}
      <OutputConfigCard
        questionCount={targetQuestionCount}
        onQuestionCountChange={onTargetQuestionCountChange}
        includeExplanation={includeExplanation}
        onToggleExplanation={onToggleExplanation}
        shuffleOptions={shuffleOptions}
        onToggleShuffle={onToggleShuffle}
        marksPerQuestion={marksPerQuestion}
        onMarksChange={onMarksChange}
        isGeneratingAI={isGeneratingAI}
        canGenerate={canGenerate}
        validationError={validationError}
        onGenerateForeground={onGenerateForeground}
        onGenerateBackground={onGenerateBackground}
      />

      {/* ── STEP 5: Generated Question Pool & Review ── */}
      <QuestionReviewPool
        currentQuestions={currentQuestions}
        displayedQuestions={displayedQuestions}
        selectedBannerFilter={selectedBannerFilter}
        onSelectBannerFilter={onSelectBannerFilter}
        recentQuestionIds={recentQuestionIds}
        expandedQuestionIds={expandedQuestionIds}
        onToggleExpandOne={onToggleExpandOne}
        onToggleExpandAll={onToggleExpandAll}
        onToggleApprove={onToggleApprove}
        onToggleArchive={onToggleArchive}
        onEditQuestion={onEditQuestion}
        onViewQuestion={onViewQuestion}
        onDeleteQuestion={onDeleteQuestion}
        onApproveAll={onApproveAll}
        onCreateQuestionSet={onCreateQuestionSet}
        isGeneratingAI={isGeneratingAI}
      />
    </div>
  );
};

export default MCQStudioWorkspace;
