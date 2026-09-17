interface QuestionSetsHeaderProps {
  count?: number;
}

const QuestionSetsHeader = ({ count = 6 }: QuestionSetsHeaderProps) => (
  <div className="rounded-xl border border-gray-100 bg-white px-6 py-4">
    <div className="flex items-center gap-3">
      <h2 className="text-2xl font-bold text-[#000]">Question Sets</h2>
      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-0.5 text-xs font-medium text-green-600">
        {count} sets
      </span>
    </div>
    <p className="mt-1 text-sm font-medium text-color2">
      Each question generation automatically creates a Question Set for easy review.
    </p>
  </div>
);

export default QuestionSetsHeader;
