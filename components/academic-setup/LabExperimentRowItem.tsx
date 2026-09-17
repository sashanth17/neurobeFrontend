import React from "react";

export interface LabExperimentRowItemProps {
  index: number;
  title: string;
  isLast?: boolean;
  className?: string;
}

const LabExperimentRowItem: React.FC<LabExperimentRowItemProps> = ({
  index,
  title,
  isLast = false,
  className = "",
}) => {
  return (
    <div
      className={`flex items-start py-3.5 ${
        !isLast ? "border-b border-gray-100 dark:border-gray-800" : ""
      } ${className}`}
    >
      <span className="font-bold text-color2 dark:text-purple-400 font-mono text-sm mr-3 shrink-0">
        {index}.
      </span>
      <span className="text-sm font-semibold text-[#000] dark:text-gray-200 leading-snug">
        {title}
      </span>
    </div>
  );
};

export default LabExperimentRowItem;
