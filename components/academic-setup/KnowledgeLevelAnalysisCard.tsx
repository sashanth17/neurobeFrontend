import React from "react";
import { TrendingUp } from "lucide-react";

export interface KnowledgeLevelItem {
  key: string;
  percentage: number;
  questionsCount: string;
}

export interface KnowledgeLevelAnalysisCardProps {
  title?: string;
  subtitle?: string;
  items?: KnowledgeLevelItem[];
}

const DEFAULT_ITEMS: KnowledgeLevelItem[] = [
  {
    key: "K1",
    percentage: 91.5,
    questionsCount: "3 Questions",
  },
  {
    key: "K2",
    percentage: 83,
    questionsCount: "4 Questions",
  },
  {
    key: "K3",
    percentage: 74.5,
    questionsCount: "3 Questions",
  },
];

export const KnowledgeLevelAnalysisCard: React.FC<KnowledgeLevelAnalysisCardProps> = ({
  title = "Knowledge Level Analysis",
  subtitle = "Knowledge-level breakdown and student performance percentages for this test.",
  items = DEFAULT_ITEMS,
}) => {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 md:p-6 shadow-xs dark:border-gray-800 dark:bg-gray-900 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-color2" />
          <h3 className="text-base md:text-lg font-bold text-[#000] dark:text-white">
            {title}
          </h3>
        </div>
        <p className=" text-md font-medium text-pri dark:text-gray-400">
          {subtitle}
        </p>
      </div>

      {/* Grid of 3 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        {items.map((item) => (
          <div
            key={item.key}
            className="rounded-2xl border border-gray-100 bg-sec1 p-4.5 space-y-3 dark:border-gray-800/80 dark:bg-gray-800/60"
          >
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[#000] dark:text-white">
                {item.key} — {item.percentage}%
              </span>
              <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-color2 dark:bg-purple-950/60 dark:text-purple-300">
                {item.key}
              </span>
            </div>

            <div className=" text-xs">
              <div className="flex items-center justify-between">
                <span className="text-pri text-sm dark:text-gray-400">
                  Number of Questions:
                </span>
                <span className="font-bold text-color1 text-sm dark:text-white">
                  {item.questionsCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-pri  text-sm dark:text-gray-400">
                  Performance Percentage:
                </span>
                <span className="font-bold  text-sm text-color2 dark:text-purple-400">
                  {item.percentage}%
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-gray-200/80 overflow-hidden dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-color2 transition-all duration-300"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeLevelAnalysisCard;
