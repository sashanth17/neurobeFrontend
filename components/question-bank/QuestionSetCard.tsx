import { BookOpen, Calendar } from "lucide-react";
import { ArrowRight } from "lucide-react";

export interface QuestionSetCardProps {
  id: string;
  unit: string;
  date: string;
  title: string;
  topicSummary: string;
  total: number;
  draft: number;
  review: number;
  approved: number;
  accentColor?: string;
  unitColor?: string;
  onOpen?: () => void;
}

const QuestionSetCard = ({
  unit,
  date,
  title,
  topicSummary,
  total,
  draft,
  review,
  approved,
  accentColor = "#f97316",
  unitColor = "#fff7ed",
  onOpen,
}: QuestionSetCardProps) => (
  <div className="relative flex flex-col rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
    {/* Top accent bar */}
    <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

    <div className="flex flex-col gap-4 p-5">
      {/* Unit badge + date */}
      <div className="flex items-center justify-between">
        <span
          className="rounded-lg px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: unitColor, color: accentColor }}
        >
          {unit}
        </span>
        <div className="flex items-center gap-1.5 text-xs text-[#000]">
          <Calendar className="h-3.5 w-3.5" />
          {date}
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-base font-bold text-[#000]">{title}</h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#000] uppercase tracking-wide">
          <BookOpen className="h-3.5 w-3.5" />
          Topics Included
        </div>
      </div>

      {/* Topic summary pill */}
      <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-[#000]">
        {topicSummary}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="flex flex-col items-center rounded-xl bg-slate-50 py-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Total</span>
          <span className="text-xl font-bold text-slate-700">{total}</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-amber-50 py-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Draft</span>
          <span className="text-xl font-bold text-amber-600">{draft}</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-indigo-50 py-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-700">Review</span>
          <span className="text-xl font-bold text-indigo-700">{review}</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-green-50 py-3">
          <span className="text-[10px] font-bold uppercase tracking-wide text-green-700">Appr.</span>
          <span className="text-xl font-bold text-green-700">{approved}</span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={onOpen}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        Open Question Set <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  </div>
);

export default QuestionSetCard;
