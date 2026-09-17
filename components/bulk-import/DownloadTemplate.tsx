type ImportType = "user" | "course";

interface DownloadTemplateProps {
  importType: ImportType;
  onDownload?: () => void;
  loading?: boolean;
}

const TEMPLATE_META: Record<
  ImportType,
  { required: string[]; optional: string[]; filename: string }
> = {
  user: {
    required: ["Email", "Register Number", "First Name", "Programme", "Department", "Batch"],
    optional: ["Last Name"],
    filename: "users_bulk_import_template.csv",
  },
  course: {
    required: ["Course Code", "Course Title", "Department", "Programme", "Semester"],
    optional: ["Credits", "Description"],
    filename: "courses_bulk_import_template.csv",
  },
};

const DownloadTemplate = ({
  importType,
  onDownload,
  loading = false,
}: DownloadTemplateProps) => {
  const meta = TEMPLATE_META[importType];

  return (
    <div className="flex h-full flex-col">
      {/* Section heading */}
      <div className="mb-4 flex items-center gap-1.5">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-color2 text-xs font-bold text-white">
          1
        </span>
        <h3 className="text-sm font-semibold text-[#000] dark:text-white">
          Download Template
        </h3>
      </div>

      <p className="mb-4 text-sm text-[#000] dark:text-[#000]">
        Download the standardized template file before uploading{" "}
        {importType === "user" ? "user" : "course"} data.
      </p>

      {/* Required / Optional fields card */}
      <div className="mb-5 flex-1 rounded-xl border  border-gray-300 bg-gray-50 px-5 py-4 dark:border-gray-600 dark:bg-gray-800/50">
        <p className="mb-2 text-sm text-[#000] dark:text-gray-300">
          <span className="font-semibold text-[#000] dark:text-white">Required: </span>
          {meta.required.join(", ")}
        </p>
        <p className="text-sm text-[#000] dark:text-gray-300">
          <span className="font-semibold text-[#000] dark:text-white">Optional: </span>
          {meta.optional.join(", ")}
        </p>
      </div>

      {/* Download button */}
      <button
        type="button"
        onClick={onDownload}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-color2 bg-white py-2.5 text-sm font-medium text-color2 transition-colors duration-200 hover:bg-color2-l dark:bg-transparent dark:hover:bg-color2/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-color2 border-t-transparent" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-4-4m4 4l4-4"
            />
          </svg>
        )}
        {loading
          ? "Downloading..."
          : `Download ${importType === "user" ? "User" : "Course"} Template`}
      </button>
    </div>
  );
};

export default DownloadTemplate;
