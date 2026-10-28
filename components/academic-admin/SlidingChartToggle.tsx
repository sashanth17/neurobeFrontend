import React from "react";

interface SlidingChartToggleProps {
  chartType: "line" | "bar";
  onChange: (type: "line" | "bar") => void;
}

export const SlidingChartToggle: React.FC<SlidingChartToggleProps> = ({
  chartType,
  onChange,
}) => {
  return (
    <div className="relative inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 select-none">
      {/* Animated slider background pill */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 ease-out ${
          chartType === "line" ? "left-1" : "left-[calc(50%+2px)]"
        }`}
      />

      {/* Line Chart Button */}
      <button
        type="button"
        onClick={() => onChange("line")}
        className={`relative z-10 flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 ${
          chartType === "line"
            ? "text-primary dark:text-primary-light"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 12l3-3 3 3 4-4M3 21h18M3 3v18"
          />
        </svg>
        <span>Line Chart</span>
      </button>

      {/* Bar Chart Button */}
      <button
        type="button"
        onClick={() => onChange("bar")}
        className={`relative z-10 flex items-center justify-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors duration-200 ${
          chartType === "bar"
            ? "text-primary dark:text-primary-light"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span>Bar Chart</span>
      </button>
    </div>
  );
};

export default SlidingChartToggle;
