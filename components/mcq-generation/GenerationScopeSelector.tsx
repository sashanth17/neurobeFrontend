import React from "react";
import {
  Globe2,
  BookmarkCheck,
  ListTree,
  Crosshair,
  Plus,
  X,
  Check,
  Info,
} from "lucide-react";
import { ScopeMode, TopicRow } from "./types";
import { TopicRowsBuilder } from "./TopicRowsBuilder";

interface GenerationScopeSelectorProps {
  scopeMode: ScopeMode;
  onScopeModeChange: (mode: ScopeMode) => void;
  activeUnits: any[];

  // For all_units mode
  selectedUnitIds: (string | number)[];
  onToggleUnitSelection: (unitId: string | number) => void;
  onSelectAllUnits: () => void;

  // For single_unit mode
  selectedSingleUnitId: string | number;
  onSingleUnitChange: (unitId: string | number) => void;

  // For dynamic_topics mode
  topicRows: TopicRow[];
  onAddTopicRow: () => void;
  onRemoveTopicRow: (id: string) => void;
  onUpdateTopicRow: (id: string, patch: Partial<TopicRow>) => void;
  totalTopicQuestions: number;

  // For micro_topics mode
  microTopics: string[];
  onAddMicroTopic: (topic: string) => void;
  onRemoveMicroTopic: (topic: string) => void;
}

export const GenerationScopeSelector: React.FC<GenerationScopeSelectorProps> = ({
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
}) => {
  const currentSingleUnit =
    activeUnits.find((u) => String(u.unitId) === String(selectedSingleUnitId)) || activeUnits[0];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900">
      {/* ── Card Header ── */}
      <div className="flex flex-col gap-2 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Step 1
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Curriculum Scope & Syllabus Granularity
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Select how broad or targeted the syllabus context should be for the AI generator.
            </p>
          </div>
        </div>
      </div>

      {/* ── Mode Selection Tabs / Cards ── */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Option 1: Multi-Unit */}
          <button
            type="button"
            onClick={() => onScopeModeChange("all_units")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
              scopeMode === "all_units"
                ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/30"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700"
            }`}
          >
            <div className="mb-2 flex w-full items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  scopeMode === "all_units"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                <Globe2 className="h-4 w-4" />
              </div>
              {scopeMode === "all_units" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">Comprehensive / Multi-Unit</div>
            <div className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              Entire semester curriculum or multiple selected units.
            </div>
          </button>

          {/* Option 2: Unit-Specific */}
          <button
            type="button"
            onClick={() => onScopeModeChange("single_unit")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
              scopeMode === "single_unit"
                ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/30"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700"
            }`}
          >
            <div className="mb-2 flex w-full items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  scopeMode === "single_unit"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                <BookmarkCheck className="h-4 w-4" />
              </div>
              {scopeMode === "single_unit" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">Unit-Specific (CO Mapped)</div>
            <div className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              Laser focus on a single unit and mapped Course Outcome.
            </div>
          </button>

          {/* Option 3: Dynamic Topics */}
          <button
            type="button"
            onClick={() => onScopeModeChange("dynamic_topics")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
              scopeMode === "dynamic_topics"
                ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/30"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700"
            }`}
          >
            <div className="mb-2 flex w-full items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  scopeMode === "dynamic_topics"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                <ListTree className="h-4 w-4" />
              </div>
              {scopeMode === "dynamic_topics" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">Dynamic Topic Selection</div>
            <div className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              Hand-pick verified syllabus topics with custom quotas.
            </div>
          </button>

          {/* Option 4: Micro-Topic Laser Focus */}
          <button
            type="button"
            onClick={() => onScopeModeChange("micro_topics")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
              scopeMode === "micro_topics"
                ? "border-indigo-600 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-600 dark:border-indigo-500 dark:bg-indigo-950/30"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700"
            }`}
          >
            <div className="mb-2 flex w-full items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  scopeMode === "micro_topics"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                <Crosshair className="h-4 w-4" />
              </div>
              {scopeMode === "micro_topics" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">Micro-Topic Laser Focus</div>
            <div className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              Provide exact conceptual keywords, subtopics, or tags.
            </div>
          </button>
        </div>

        {/* ── Sub-Configuration Panels based on scopeMode ── */}
        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800/80 dark:bg-gray-800/20">
          {/* Subpanel 1: Multi-Unit */}
          {scopeMode === "all_units" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <span>Include Units in AI Syllabus:</span>
                  <span className="text-[11px] text-gray-500">
                    ({selectedUnitIds.length} of {activeUnits.length} selected)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onSelectAllUnits}
                  className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {selectedUnitIds.length === activeUnits.length ? "Deselect All" : "Select All Units"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {activeUnits.map((u) => {
                  const isSelected = selectedUnitIds.some((id) => String(id) === String(u.unitId));
                  return (
                    <button
                      key={u.unitId}
                      type="button"
                      onClick={() => onToggleUnitSelection(u.unitId)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          isSelected
                            ? "border-white bg-white/20"
                            : "border-gray-400 bg-transparent dark:border-gray-600"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span>{u.label}</span>
                      <span className={`text-[10px] ${isSelected ? "text-indigo-100" : "text-gray-400"}`}>
                        ({u.topics?.length || 0} topics)
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <Info className="h-3.5 w-3.5 text-indigo-500" />
                The AI will automatically balance questions proportionately across all selected syllabus units.
              </p>
            </div>
          )}

          {/* Subpanel 2: Unit-Specific */}
          {scopeMode === "single_unit" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Target Unit for MCQ Generation:
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {activeUnits.map((u) => {
                  const isSelected = String(u.unitId) === String(selectedSingleUnitId);
                  return (
                    <button
                      key={u.unitId}
                      type="button"
                      onClick={() => onSingleUnitChange(u.unitId)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50 shadow-sm dark:border-indigo-500 dark:bg-indigo-950/40"
                          : "border-gray-200 bg-white hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/60"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-gray-400 dark:border-gray-500"
                        }`}
                      >
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{u.label}</span>
                          <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                            CO{u.unitId}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">
                          {u.title}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {currentSingleUnit && (
                <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-600 shadow-xs dark:bg-gray-800/80 dark:text-gray-300">
                  <span className="font-semibold text-gray-900 dark:text-white">Active Unit Topics:</span>
                  <div className="flex flex-wrap gap-1">
                    {(currentSingleUnit.topics || []).slice(0, 4).map((t: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {t}
                      </span>
                    ))}
                    {(currentSingleUnit.topics || []).length > 4 && (
                      <span className="text-[11px] text-gray-400">
                        +{(currentSingleUnit.topics || []).length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subpanel 3: Dynamic Topics */}
          {scopeMode === "dynamic_topics" && (
            <div className="space-y-4">
              <TopicRowsBuilder
                topicRows={topicRows}
                activeUnits={activeUnits}
                onAddRow={onAddTopicRow}
                onRemoveRow={onRemoveTopicRow}
                onUpdateRow={onUpdateTopicRow}
                totalTopicQuestions={totalTopicQuestions}
              />
            </div>
          )}

          {/* Subpanel 4: Micro-Topic Laser Focus */}
          {scopeMode === "micro_topics" && (
            <div className="space-y-3">
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Select Granular Topics for Laser Focus:
                </span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Click any topic below to target or remove it from the focused concept list.
                </p>
              </div>

              {/* Tag Chips Selected */}
              {microTopics.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 border border-indigo-100 dark:bg-gray-800 dark:border-gray-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Selected ({microTopics.length}):
                  </span>
                  {microTopics.map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200"
                    >
                      <span>{topic}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveMicroTopic(topic)}
                        className="rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Syllabus topics to click */}
              <div className="flex flex-wrap gap-2 pt-1">
                {activeUnits
                  .flatMap((u) => u.topics || [])
                  .map((topic, i) => {
                    const isSelected = microTopics.includes(topic);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            onRemoveMicroTopic(topic);
                          } else {
                            onAddMicroTopic(topic);
                          }
                        }}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        {isSelected ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <Plus className="h-3.5 w-3.5" />}
                        <span>{topic}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
