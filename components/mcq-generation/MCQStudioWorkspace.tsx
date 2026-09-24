import React from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { TopicRowsBuilder } from "./TopicRowsBuilder";
import { BloomsMatrixTable } from "./BloomsMatrixTable";
import { QuestionReviewPool } from "./QuestionReviewPool";
import { MCQQuestion, TopicRow } from "./types";

interface MCQStudioWorkspaceProps {
  topicRows: TopicRow[];
  activeUnits: any[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateRow: (id: string, patch: Partial<TopicRow>) => void;
  totalTopicQuestions: number;

  breakdown: Record<string, Record<string, number>>;
  onUpdateBreakdown: (kLevel: string, diff: string, val: number) => void;
  totalBreakdown: number;
  breakdownValid: boolean;

  marksPerQuestion: string;
  onMarksChange: (marks: string) => void;

  isGeneratingAI: boolean;
  onGenerateQuestions: () => void;

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
  topicRows,
  activeUnits,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  totalTopicQuestions,

  breakdown,
  onUpdateBreakdown,
  totalBreakdown,
  breakdownValid,

  marksPerQuestion,
  onMarksChange,

  isGeneratingAI,
  onGenerateQuestions,

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
    <div className="space-y-5">
      {/* ── CARD 1: Dynamic Topic Builder ── */}
      <TopicRowsBuilder
        topicRows={topicRows}
        activeUnits={activeUnits}
        onAddRow={onAddRow}
        onRemoveRow={onRemoveRow}
        onUpdateRow={onUpdateRow}
        totalTopicQuestions={totalTopicQuestions}
      />

      {/* ── CARD 2: Bloom's × Difficulty 2D Matrix ── */}
      <BloomsMatrixTable
        breakdown={breakdown}
        onUpdateBreakdown={onUpdateBreakdown}
        totalTopicQuestions={totalTopicQuestions}
        totalBreakdown={totalBreakdown}
        breakdownValid={breakdownValid}
      />

      {/* ── CARD 3: Marks + Generate Button ── */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">
              Marks per Question
            </label>
            <select
              value={marksPerQuestion}
              onChange={(e) => onMarksChange(e.target.value)}
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs font-medium text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="0.5">0.5 Mark</option>
              <option value="1">1 Mark</option>
              <option value="2">2 Marks</option>
              <option value="4">4 Marks</option>
            </select>
          </div>
          <div className="h-10 w-px bg-gray-200 dark:bg-gray-700" />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>
              <strong className="text-gray-800 dark:text-gray-200">{topicRows.length}</strong> topic rows
            </p>
            <p>
              <strong className="text-gray-800 dark:text-gray-200">{totalTopicQuestions}</strong> total questions
            </p>
          </div>
          {!breakdownValid && totalTopicQuestions > 0 && (
            <p className="text-xs font-semibold text-red-500">
              ⚠ Matrix total ({totalBreakdown}) ≠ question total ({totalTopicQuestions})
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={isGeneratingAI || !breakdownValid || totalTopicQuestions === 0}
          onClick={onGenerateQuestions}
          className="flex items-center gap-2 rounded-xl bg-color1 px-7 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-color1/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGeneratingAI ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Generating with AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate Questions Now</span>
            </>
          )}
        </button>
      </div>

      {/* ── CARD 4: Generated Question Pool & Review ── */}
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
