import React from "react";
import { Search, Archive, Layers, Filter } from "lucide-react";

interface CiaTestsTabsProps {
  activeTab: "active" | "archived";
  onTabChange: (tab: "active" | "archived") => void;
  activeCount: number;
  archivedCount: number;
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
}

export const CiaTestsTabs: React.FC<CiaTestsTabsProps> = ({
  activeTab,
  onTabChange,
  activeCount,
  archivedCount,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
      {/* Primary Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onTabChange("active")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "active"
              ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Active Assessments</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
              activeTab === "active"
                ? "bg-white/20 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => onTabChange("archived")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
            activeTab === "archived"
              ? "bg-gray-800 text-white shadow-md dark:bg-gray-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          <Archive className="h-4 w-4" />
          <span>Archived Assessments</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${
              activeTab === "archived"
                ? "bg-white/20 text-white"
                : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {archivedCount}
          </span>
        </button>
      </div>

      {/* Filter and Search on Right */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search test name or code..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-56 sm:w-64 rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-xs text-gray-800 placeholder-gray-400 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>

        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CiaTestsTabs;
