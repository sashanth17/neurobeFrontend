import React from "react";

interface Tab {
  key: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabButtonProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
}

const TabButton = ({ tabs, activeKey, onChange }: TabButtonProps) => {
  return (
    <div className="mt-4 flex items-center gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            activeKey === tab.key
              ? "bg-color2 text-white"
              : "border border-gray-200 bg-white text-[#000] hover:border-gray-300"
          }`}
        >
          {tab.icon}
          <span>{tab.label}{tab.count !== undefined ? ` (${tab.count})` : ""}</span>
        </button>
      ))}
    </div>
  );
};

export default TabButton;
