import React from "react";

export interface TabItem {
  key?: string | number;
  label?: string;
  count?: string | number;
}

interface GenericTabsProps {
  tabs: TabItem[];
  activeKey: string | number;
  onChange: (key: string | number) => void;
  rightContent?: React.ReactNode;
  className?: string;
  noWrap?: boolean;
}

const GenericTabs = ({
  tabs,
  activeKey,
  onChange,
  rightContent,
  className = "",
  noWrap = false,
}: GenericTabsProps) => {
  return (
    <div
      className={`flex ${noWrap ? "flex-nowrap overflow-x-auto" : "flex-wrap"} items-center justify-between px-1 pb-0 ${className}`}
      style={noWrap ? { scrollbarWidth: "none" } : undefined}
    >
      <div
        className={`flex ${noWrap ? "flex-nowrap overflow-x-auto" : "flex-wrap"} items-center gap-2 sm:gap-3`}
        style={noWrap ? { scrollbarWidth: "none" } : undefined}
      >
        {tabs.map((tab) => {
          const active = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`${noWrap ? "mb-1" : "mb-2"} flex items-center gap-2 sm:gap-3 rounded-full border px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold transition-all shrink-0 whitespace-nowrap ${
                active
                  ? " bg-color2 text-white"
                  : "border-gray-200 text-[#000] hover:text-[#000] bg-[#fff]"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    active ? "bg-white/20 text-white" : "bg-purple-100 text-color2"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {rightContent && (
        <div className="flex items-center pr-2 text-xs text-[#000]">{rightContent}</div>
      )}
    </div>
  );
};

export default GenericTabs;
