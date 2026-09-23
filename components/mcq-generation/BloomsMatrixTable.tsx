import React from "react";
import { Zap, Check } from "lucide-react";
import { K_LEVELS, DIFFICULTIES } from "./types";

interface BloomsMatrixTableProps {
  breakdown: Record<string, Record<string, number>>;
  onUpdateBreakdown: (kLevel: string, diff: string, val: number) => void;
  totalTopicQuestions: number;
  totalBreakdown: number;
  breakdownValid: boolean;
}

export const BloomsMatrixTable: React.FC<BloomsMatrixTableProps> = ({
  breakdown,
  onUpdateBreakdown,
  totalTopicQuestions,
  totalBreakdown,
  breakdownValid,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600/10 text-purple-600">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Bloom's Taxonomy × Difficulty Matrix</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Set how many questions per Bloom's level per difficulty. Total must equal{" "}
              <strong className={breakdownValid ? "text-emerald-600" : "text-red-500"}>
                {String(totalTopicQuestions)}
              </strong>{" "}
              (current:{" "}
              <strong className={breakdownValid ? "text-emerald-600" : "text-red-500"}>
                {String(totalBreakdown)}
              </strong>
              ).
            </p>
          </div>
        </div>
        {breakdownValid && totalTopicQuestions > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Check className="h-3.5 w-3.5" /> Balanced
          </span>
        )}
      </div>

      <div className="overflow-x-auto p-6">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="w-28 pb-3 text-left font-bold text-gray-500 dark:text-gray-400">K Level</th>
              {DIFFICULTIES.map((diff) => (
                <th key={diff} className="pb-3 text-center font-bold capitalize text-gray-700 dark:text-gray-300">
                  <span
                    className={`inline-block rounded-lg px-3 py-1 text-[11px] font-bold ${
                      diff === "easy"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : diff === "medium"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    }`}
                  >
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </span>
                </th>
              ))}
              <th className="pb-3 text-center font-bold text-gray-500 dark:text-gray-400">Row Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {K_LEVELS.map((k) => {
              const rowTotal = DIFFICULTIES.reduce((s, d) => s + (Number(breakdown[k]?.[d]) || 0), 0);
              return (
                <tr key={k} className="group">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-10 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                        {k}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {k === "K1"
                          ? "Remember"
                          : k === "K2"
                          ? "Understand"
                          : k === "K3"
                          ? "Apply"
                          : k === "K4"
                          ? "Analyze"
                          : k === "K5"
                          ? "Evaluate"
                          : "Create"}
                      </span>
                    </div>
                  </td>
                  {DIFFICULTIES.map((diff) => {
                    const val = breakdown[k]?.[diff] ?? 0;
                    return (
                      <td key={diff} className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onUpdateBreakdown(k, diff, val - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={val}
                            onChange={(e) => onUpdateBreakdown(k, diff, Number(e.target.value))}
                            className="h-7 w-10 rounded-lg border border-gray-200 bg-white text-center text-xs font-bold text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => onUpdateBreakdown(k, diff, val + 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 font-bold text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                          >
                            +
                          </button>
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-3 text-center">
                    <span
                      className={`text-sm font-extrabold ${
                        rowTotal > 0 ? "text-indigo-600 dark:text-indigo-400" : "text-gray-300"
                      }`}
                    >
                      {rowTotal}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-200 dark:border-gray-700">
              <td className="pt-3 text-xs font-bold text-gray-600 dark:text-gray-400">Column Total</td>
              {DIFFICULTIES.map((diff) => {
                const colTotal = K_LEVELS.reduce((s, k) => s + (Number(breakdown[k]?.[diff]) || 0), 0);
                return (
                  <td key={diff} className="pt-3 text-center text-sm font-extrabold text-gray-700 dark:text-gray-300">
                    {colTotal}
                  </td>
                );
              })}
              <td
                className={`pt-3 text-center text-base font-extrabold ${
                  breakdownValid && totalTopicQuestions > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : totalTopicQuestions > 0
                    ? "text-red-500"
                    : "text-gray-400"
                }`}
              >
                {`${totalBreakdown}${breakdownValid && totalTopicQuestions > 0 ? " ✓" : ""}`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default BloomsMatrixTable;
