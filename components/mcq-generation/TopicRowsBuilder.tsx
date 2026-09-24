import React from "react";
import { Target, Plus, X } from "lucide-react";
import { TopicRow } from "./types";

interface TopicRowsBuilderProps {
  topicRows: TopicRow[];
  activeUnits: any[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateRow: (id: string, patch: Partial<TopicRow>) => void;
  totalTopicQuestions: number;
}

export const TopicRowsBuilder: React.FC<TopicRowsBuilderProps> = ({
  topicRows,
  activeUnits,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  totalTopicQuestions,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Unit & Topic Selection</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Add one or more unit–topic pairs for generation.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-1.5 rounded-xl border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Row
        </button>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-3 px-6 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          <div className="col-span-4">Syllabus Unit</div>
          <div className="col-span-5">Topic</div>
          <div className="col-span-2 text-center">Questions</div>
          <div className="col-span-1"></div>
        </div>

        {topicRows.map((row) => {
          const unit = activeUnits.find((u) => String(u.unitId) === String(row.unitId));
          const topics: string[] = unit?.topics || [];
          return (
            <div key={row.id} className="grid grid-cols-12 items-center gap-3 px-6 py-3">
              {/* Unit */}
              <div className="col-span-4">
                <select
                  value={row.unitId}
                  onChange={(e) => onUpdateRow(row.id, { unitId: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {activeUnits.map((u) => (
                    <option key={u.unitId} value={u.unitId}>
                      {u.label}: {u.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div className="col-span-5">
                <select
                  value={row.topicName}
                  onChange={(e) => onUpdateRow(row.id, { topicName: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">— Select topic —</option>
                  {topics.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Question count */}
              <div className="col-span-2">
                <div className="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateRow(row.id, { questionCount: Math.max(1, row.questionCount - 1) })}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={row.questionCount}
                    onChange={(e) => onUpdateRow(row.id, { questionCount: Math.max(1, Number(e.target.value)) })}
                    className="h-7 w-10 rounded-lg border border-gray-200 bg-white text-center text-xs font-bold text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateRow(row.id, { questionCount: row.questionCount + 1 })}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Remove */}
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => onRemoveRow(row.id)}
                  disabled={topicRows.length === 1}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-950/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Total row */}
        <div className="flex items-center justify-between px-6 py-3 text-xs">
          <span className="font-semibold text-gray-500 dark:text-gray-400">Total questions to generate:</span>
          <span
            className={`text-base font-extrabold ${
              totalTopicQuestions > 0 ? "text-indigo-700 dark:text-indigo-300" : "text-gray-400"
            }`}
          >
            {totalTopicQuestions}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopicRowsBuilder;
