import IconUser from "@/components/Icon/IconUser";
import { BookOpen, User2Icon } from "lucide-react";

type ImportType = "user" | "course";

interface BulkImportBannerProps {
  importType: ImportType;
  onTypeChange: (type: ImportType) => void;
}

const BulkImportBanner = ({ importType, onTypeChange }: BulkImportBannerProps) => {
  return (
    <div className="panel mb-5 flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      {/* Left: icon + text */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-color2-l">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-color2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-3-3m3 3l3-3"
            />
          </svg>
        </div>
        <div>
          <h2 className="section-ti">
            Bulk Import
          </h2>
          <p className="mt-0.5 text-sm text-[#000] dark:text-[#000]">
            Import users and courses from Excel or CSV files with validation before final import.
          </p>
        </div>
      </div>

      {/* Right: type toggle buttons */}
      <div className="flex shrink-0 items-center gap-2 bg-sec p-1 rounded-lg">
        <button
          onClick={() => onTypeChange("user")}
          className={`flex items-center gap-2  px-4 py-2 text-sm font-medium transition-all duration-200 ${
            importType === "user"
              ? "bg-[#fff] text-color2 shadow-sm rounded-lg"
              : " text-[#000]  hover:text-pri dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          <User2Icon className="w-4 h-4"/>
          User Import
        </button>

        <button
          onClick={() => onTypeChange("course")}
          className={`flex items-center gap-2  px-4 py-2 text-sm font-medium transition-all duration-200 ${
            importType === "course"
              ? "bg-[#fff] text-color2 shadow-sm rounded-lg"
              : " text-[#000]  hover:text-pri dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
         <BookOpen className="w-4 h-4"/>
          Course Import
        </button>
      </div>
    </div>
  );
};

export default BulkImportBanner;
