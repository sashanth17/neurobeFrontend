import { Search } from "lucide-react";
import { useState } from "react";
import CustomSelect from "@/components/FormFields/CustomSelect.component";

const UNIT_OPTIONS = [
  { value: "all", label: "All Units" },
  { value: "unit-1", label: "Unit 1" },
  { value: "unit-2", label: "Unit 2" },
  { value: "unit-3", label: "Unit 3" },
  { value: "unit-4", label: "Unit 4" },
];

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

interface QuestionSetsSearchProps {
  onSearch?: (value: string) => void;
  onUnitChange?: (unit: string) => void;
  tabs?: TabItem[];
  activeTab?: string;
  onTabChange?: (tabKey: string) => void;
  placeholder?: string;
  showUnitSelect?: boolean;
}

const QuestionSetsSearch = ({
  onSearch,
  onUnitChange,
  tabs,
  activeTab,
  onTabChange,
  placeholder = "Search Question Sets by name or topic...",
  showUnitSelect = true,
}: QuestionSetsSearchProps) => {
  const [unit, setUnit] = useState(UNIT_OPTIONS[0]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 shadow-sm">
      {/* Search Input + Optional Unit Select */}
      <div className="flex flex-1 items-center gap-3 w-full">
        <Search className="h-4 w-4 shrink-0 text-[#000]" />
        <input
          type="text"
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm text-[#000] dark:text-gray-200 placeholder:text-gray-400 outline-none"
          onChange={(e) => onSearch?.(e.target.value)}
        />
        {showUnitSelect && (
          <CustomSelect
            options={UNIT_OPTIONS}
            value={unit}
            onChange={(val) => {
              if (val) {
                setUnit(val as typeof UNIT_OPTIONS[0]);
                onUnitChange?.(val.value as string);
              }
            }}
            isSearchable={false}
            isClearable={false}
            className="w-36 shrink-0"
          />
        )}
      </div>

      {/* Right Side Tabs */}
      {tabs && tabs.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-700">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange?.(tab.key)}
                className={`rounded-lg px-4 py-1 text-sm font-medium transition-all whitespace-nowrap ${isActive
                    ? "bg-[#1c1a27] dark:bg-slate-700 text-white font-semibold shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-transparent"
                  }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestionSetsSearch;
