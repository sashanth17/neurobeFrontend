import React from "react";
import {
  Sparkles,
  BarChart3,
  Grid3X3,
  Check,
  AlertCircle,
  Wand2,
  HelpCircle,
} from "lucide-react";
import {
  DistributionMode,
  K_LEVELS,
  DIFFICULTIES,
  BLOOM_DEFINITIONS,
  KnowledgeLevelBreakdown,
} from "./types";
import { BloomsMatrixTable } from "./BloomsMatrixTable";

interface DistributionModeSelectorProps {
  distributionMode: DistributionMode;
  onDistributionModeChange: (mode: DistributionMode) => void;

  targetQuestionCount: number;

  // For knowledge_level mode (1D)
  knowledgeBreakdown: KnowledgeLevelBreakdown;
  onUpdateKnowledgeBreakdown: (kLevel: string, count: number) => void;
  onApplyKnowledgePreset: (preset: "balanced" | "foundational" | "advanced") => void;

  // For knowledge_and_difficulty mode (2D)
  breakdown2D: Record<string, Record<string, number>>;
  onUpdateBreakdown2D: (kLevel: string, diff: string, val: number) => void;
  onAutoBalance2D: () => void;
}

export const DistributionModeSelector: React.FC<DistributionModeSelectorProps> = ({
  distributionMode,
  onDistributionModeChange,
  targetQuestionCount,
  knowledgeBreakdown,
  onUpdateKnowledgeBreakdown,
  onApplyKnowledgePreset,
  breakdown2D,
  onUpdateBreakdown2D,
  onAutoBalance2D,
}) => {
  // Sum for 1D mode
  const total1D = Object.values(knowledgeBreakdown || {}).reduce(
    (acc, val) => acc + (Number(val) || 0),
    0
  );
  const isValid1D = total1D === targetQuestionCount;

  // Sum for 2D mode
  const total2D = Object.values(breakdown2D || {}).reduce<number>(
    (sum, diffObj) =>
      sum +
      Object.values(diffObj || {}).reduce<number>((s, v) => s + (Number(v) || 0), 0),
    0
  );
  const isValid2D = total2D === targetQuestionCount;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900">
      {/* ── Card Header ── */}
      <div className="flex flex-col gap-2 border-b border-gray-100 px-6 py-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                Step 2
              </span>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Cognitive Blueprint & Distribution Mode
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configure how questions map to Bloom's Taxonomy cognitive levels and difficulty tiers.
            </p>
          </div>
        </div>

        {/* Status validation chip */}
        <div>
          {distributionMode === "none" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> AI Autonomous Mode
            </span>
          )}
          {distributionMode === "knowledge_level" && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isValid1D
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              {isValid1D ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Balanced: {total1D}/{targetQuestionCount}
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" /> Sum: {total1D} (Need {targetQuestionCount})
                </>
              )}
            </span>
          )}
          {distributionMode === "knowledge_and_difficulty" && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isValid2D
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              {isValid2D ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Balanced: {total2D}/{targetQuestionCount}
                </>
              ) : (
                <>
                  <AlertCircle className="h-3.5 w-3.5" /> Sum: {total2D} (Need {targetQuestionCount})
                </>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* ── Mode Selection Cards ── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Mode 1: Automatic / None */}
          <button
            type="button"
            onClick={() => onDistributionModeChange("none")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
              distributionMode === "none"
                ? "border-purple-600 bg-purple-50/50 shadow-sm ring-1 ring-purple-600 dark:border-purple-500 dark:bg-purple-950/30"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700"
            }`}
          >
            <div className="mb-2 flex w-full items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  distributionMode === "none"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              {distributionMode === "none" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">Automatic / Free Mode</div>
            <div className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              AI automatically picks optimal Bloom's levels and balanced difficulty. Best for rapid generation.
            </div>
          </button>

          {/* Mode 2: Bloom's Stratification (1D) */}
          <button
            type="button"
            onClick={() => onDistributionModeChange("knowledge_level")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
              distributionMode === "knowledge_level"
                ? "border-purple-600 bg-purple-50/50 shadow-sm ring-1 ring-purple-600 dark:border-purple-500 dark:bg-purple-950/30"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700"
            }`}
          >
            <div className="mb-2 flex w-full items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  distributionMode === "knowledge_level"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
              </div>
              {distributionMode === "knowledge_level" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">Bloom's Stratification (1D)</div>
            <div className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              Specify exact question counts per Bloom's Level (K1 to K6) to match course blueprints.
            </div>
          </button>

          {/* Mode 3: 2D Matrix */}
          <button
            type="button"
            onClick={() => onDistributionModeChange("knowledge_and_difficulty")}
            className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
              distributionMode === "knowledge_and_difficulty"
                ? "border-purple-600 bg-purple-50/50 shadow-sm ring-1 ring-purple-600 dark:border-purple-500 dark:bg-purple-950/30"
                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-800/40 dark:hover:border-gray-700"
            }`}
          >
            <div className="mb-2 flex w-full items-center justify-between">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  distributionMode === "knowledge_and_difficulty"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </div>
              {distributionMode === "knowledge_and_difficulty" && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">2D Cognitive & Difficulty Matrix</div>
            <div className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              Full control over each Bloom's Level crossed with Easy, Medium, and Hard tiers.
            </div>
          </button>
        </div>

        {/* ── Sub-Panels based on distributionMode ── */}
        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-800/80 dark:bg-gray-800/20">
          {/* Mode 1 Info */}
          {distributionMode === "none" && (
            <div className="flex items-center gap-3 py-2 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  Zero configuration needed.
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  The AI will generate <strong className="text-gray-700 dark:text-gray-300">{targetQuestionCount}</strong>{" "}
                  questions by autonomously determining the most pedagogically appropriate Bloom's levels and difficulty balance.
                </p>
              </div>
            </div>
          )}

          {/* Mode 2: 1D Breakdown */}
          {distributionMode === "knowledge_level" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 pb-3 dark:border-gray-700/80">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Allocate Questions across Bloom's Levels:
                </div>
                {/* Preset shortcuts */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-gray-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => onApplyKnowledgePreset("balanced")}
                    className="rounded-lg border border-purple-200 bg-white px-2 py-1 text-[11px] font-semibold text-purple-700 transition hover:bg-purple-50 dark:border-purple-800 dark:bg-gray-800 dark:text-purple-300"
                  >
                    Balanced K1–K4
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyKnowledgePreset("foundational")}
                    className="rounded-lg border border-purple-200 bg-white px-2 py-1 text-[11px] font-semibold text-purple-700 transition hover:bg-purple-50 dark:border-purple-800 dark:bg-gray-800 dark:text-purple-300"
                  >
                    Foundational K1–K2
                  </button>
                  <button
                    type="button"
                    onClick={() => onApplyKnowledgePreset("advanced")}
                    className="rounded-lg border border-purple-200 bg-white px-2 py-1 text-[11px] font-semibold text-purple-700 transition hover:bg-purple-50 dark:border-purple-800 dark:bg-gray-800 dark:text-purple-300"
                  >
                    Advanced K3–K6
                  </button>
                </div>
              </div>

              {/* Grid of K1 to K6 cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {K_LEVELS.map((k) => {
                  const def = BLOOM_DEFINITIONS[k] || { name: k, verbs: "", color: "indigo" };
                  const count = Number(knowledgeBreakdown[k]) || 0;
                  return (
                    <div
                      key={k}
                      className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-xs dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            {k}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-500">{def.name}</span>
                        </div>
                        <p className="mt-1 line-clamp-1 text-[10px] text-gray-400" title={def.verbs}>
                          {def.verbs}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => onUpdateKnowledgeBreakdown(k, Math.max(0, count - 1))}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={count}
                          onChange={(e) => onUpdateKnowledgeBreakdown(k, Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 rounded-lg border border-gray-200 bg-gray-50 py-1 text-center text-xs font-bold text-gray-900 focus:border-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateKnowledgeBreakdown(k, count + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {!isValid1D && (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  ⚠ Total Bloom's count is {total1D}, but target question count is {targetQuestionCount}.
                  Please adjust to make them match.
                </p>
              )}
            </div>
          )}

          {/* Mode 3: 2D Matrix */}
          {distributionMode === "knowledge_and_difficulty" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Set exact questions for each Bloom's Level & Difficulty combination:
                </span>
                <button
                  type="button"
                  onClick={onAutoBalance2D}
                  className="flex items-center gap-1.5 rounded-lg border border-purple-200 bg-white px-2.5 py-1 text-xs font-semibold text-purple-700 transition hover:bg-purple-50 dark:border-purple-800 dark:bg-gray-800 dark:text-purple-300"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Auto-Balance to {targetQuestionCount} Qs
                </button>
              </div>

              <BloomsMatrixTable
                breakdown={breakdown2D}
                onUpdateBreakdown={onUpdateBreakdown2D}
                totalTopicQuestions={targetQuestionCount}
                totalBreakdown={total2D}
                breakdownValid={isValid2D}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
