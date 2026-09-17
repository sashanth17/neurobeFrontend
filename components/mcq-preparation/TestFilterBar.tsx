import React from "react";
import { Search } from "lucide-react";

export type FilterTab = "all" | "draft" | "upcoming" | "live" | "completed";

interface TestFilterBarProps {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All Tests" },
  { key: "draft", label: "Draft" },
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "completed", label: "Completed" },
];

const TestFilterBar: React.FC<TestFilterBarProps> = ({
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <span className="absolute inset-y-0 left-3 flex items-center text-[#000]">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search tests by name, unit, or topic..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-purple-400"
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-gray-800 text-white dark:bg-gray-700"
                  : "bg-gray-100 text-[#000] hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestFilterBar;
