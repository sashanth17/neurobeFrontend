import React from "react";
import { Share, Upload } from "lucide-react";

export interface VerificationTab {
  key: string;
  label: string;
  count: number;
}

export interface StudentVerificationFilterBarProps {
  activeTab?: string;
  tabs?: VerificationTab[];
  onTabChange?: (key: string) => void;
  onShareTask?: () => void;
  className?: string;
}

const DEFAULT_TABS: VerificationTab[] = [
  { key: "all", label: "All", count: 40 },
  { key: "needs_review", label: "Needs Review", count: 4 },
  { key: "ready_to_verify", label: "Ready to Verify", count: 15 },
  { key: "verified", label: "Verified", count: 21 },
];

export const StudentVerificationFilterBar: React.FC<
  StudentVerificationFilterBarProps
> = ({
  activeTab = "all",
  tabs = DEFAULT_TABS,
  onTabChange,
  onShareTask,
  className = "",
}) => {
    const [selectedTab, setSelectedTab] = React.useState(activeTab);

    React.useEffect(() => {
      setSelectedTab(activeTab);
    }, [activeTab]);

    const handleTabClick = (key: string) => {
      setSelectedTab(key);
      if (onTabChange) {
        onTabChange(key);
      }
    };

    return (
      <div
        className={`panel flex flex-col gap-4 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${className}`}
      >
        {/* Left side Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {tabs.map((tab) => {
            const isActive = tab.key === selectedTab;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${isActive
                  ? "bg-color2 text-white shadow-xs dark:bg-gray-100 dark:text-gray-900"
                  : "border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-750"
                  }`}
              >
                <span className="font-semibold text-sm">{tab.label}</span>
                <span
                  className={`text-[11px] ${isActive ? "text-gray-300 dark:text-gray-600" : "text-gray-400"
                    }`}
                >
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Right side Action Button */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onShareTask}
            className="create-btn-outline py-1.5 !border-color2 !text-color2"
          >
            <Upload className="h-4 w-4" />
            <span className="font-bold">Share Verification Task</span>
          </button>
        </div>
      </div>
    );
  };

export default StudentVerificationFilterBar;
