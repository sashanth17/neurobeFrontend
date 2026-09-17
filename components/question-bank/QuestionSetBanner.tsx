export interface QuestionSetBannerProps {
  unit: string;
  title: string;
  generatedOn: string;
  totalQuestions: number;
  approved: number;
  topics: string[];
  accentColor?: string;
  unitColor?: string;
}

const QuestionSetBanner = ({
  unit,
  title,
  generatedOn,
  totalQuestions,
  approved,
  topics,
  accentColor = "#a855f7",
  unitColor = "#faf5ff",
}: QuestionSetBannerProps) => (
  <div className="rounded-xl border border-gray-100 bg-white px-6 py-4 space-y-3">
    {/* Row 1: unit + title + stats */}
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          className="rounded-lg px-3 py-1 text-xs font-semibold shrink-0"
          style={{ backgroundColor: unitColor, color: accentColor }}
        >
          {unit}
        </span>
        <h2 className="text-xl font-bold text-[#000]">{title}</h2>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-sm font-semibold text-[#000]">
          {totalQuestions} Total Questions
        </span>
        <span className="rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-600">
          {approved} Approved
        </span>
      </div>
    </div>

    {/* Row 2: date */}
    <p className="text-sm text-[#000]">Generated on {generatedOn}</p>

    {/* Row 3: topics */}
    <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 flex-wrap">
      <span className="text-sm text-[#000] shrink-0">Topics Covered:</span>
      {topics.map((t) => (
        <span
          key={t}
          className="rounded-full border px-3 py-1 text-xs font-medium"
          style={{
            borderColor: accentColor + "55",
            color: accentColor,
            backgroundColor: unitColor,
          }}
        >
          {t}
        </span>
      ))}
    </div>
  </div>
);

export default QuestionSetBanner;
