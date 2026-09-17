import React from "react";
import { ChevronRight, Check } from "lucide-react";

export interface TagItem {
  label: string;
}

export interface SpecialTag {
  label: string;
  color?: "green" | "orange" | "gray";
}

export interface QuestionDetailCardProps {
  id: string;
  question: string;
  unit: string;
  topic: string;
  subtopic?: string;
  tags?: (string | TagItem)[];
  specialTag?: SpecialTag;
  status: "draft" | "approved" | "reviewed" | "pending";
  onView?: () => void;
  onEdit?: () => void;
  onMarkAsReviewed?: () => void;
  onApprove?: () => void;
}

const QuestionDetailCard: React.FC<QuestionDetailCardProps> = ({
  id,
  question,
  unit,
  topic,
  subtopic,
  tags = [],
  specialTag,
  status,
  onView,
  onEdit,
  onMarkAsReviewed,
  onApprove,
}) => {
  // Derive default special tag if not explicitly passed
  const effectiveSpecialTag: SpecialTag = specialTag || (
    status === "draft" || status === "pending"
      ? { label: "Pending Review", color: "gray" }
      : status === "approved"
      ? { label: "Eligible for MCQ Tests", color: "green" }
      : { label: "Reviewed", color: "gray" }
  );

  return (
    <div className="rounded-[20px] border border-gray-200/80 bg-white p-5 shadow-xs transition-shadow hover:shadow-md">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-base font-bold text-[#000] tracking-tight">{id}</h4>
        
        {/* Status Badge */}
        {status === "draft" && (
          <span className="rounded-lg bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-500">
            Draft
          </span>
        )}
        {status === "approved" && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            Approved <Check className="h-3.5 w-3.5 stroke-[2.5]" />
          </span>
        )}
        {status === "reviewed" && (
          <span className="rounded-lg bg-purple-50 px-3 py-1 text-xs font-semibold text-color2">
            Reviewed
          </span>
        )}
        {status === "pending" && (
          <span className="rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
            Pending Approval
          </span>
        )}
      </div>

      {/* Question Text */}
      <p className="mt-3 text-[14.5px] font-medium leading-relaxed text-[#000]">
        {question}
      </p>

      {/* Unit & Topic Metadata */}
      <div className="mt-3.5 space-y-0.5">
        <div className="flex items-center gap-1 text-xs font-semibold text-[#000]">
          <span>{unit} · {topic}</span>
          <ChevronRight className="h-3.5 w-3.5 text-[#000]" />
        </div>
        {subtopic && (
          <p className="text-xs font-medium text-[#000]">{subtopic}</p>
        )}
      </div>

      {/* Bottom Footer: Tags & Action Buttons */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Tags List */}
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag, idx) => {
            const label = typeof tag === "string" ? tag : tag.label;
            return (
              <span
                key={idx}
                className="rounded-lg bg-[#F3F4F6] px-3 py-1 text-xs font-semibold text-[#4B5563]"
              >
                {label}
              </span>
            );
          })}

          {/* Special Tag (e.g., Pending Review / Eligible for MCQ Tests) */}
          {effectiveSpecialTag && (
            <span
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                effectiveSpecialTag.color === "green"
                  ? "bg-[#E8F8F0] text-[#10B981]"
                  : effectiveSpecialTag.color === "orange"
                  ? "bg-orange-50 text-orange-500"
                  : "bg-[#F3F4F6] text-[#4B5563]"
              }`}
            >
              {effectiveSpecialTag.label}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {(status === "draft" || status === "pending") && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-xl border border-gray-200 bg-white px-4.5 py-1.5 text-sm font-semibold text-[#000] transition-colors hover:bg-gray-50 active:scale-98"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onMarkAsReviewed}
                className="rounded-xl bg-color2-l px-4.5 py-1.5 text-sm font-semibold text-color2 transition-opacity hover:opacity-90 active:scale-98"
              >
                Mark as Reviewed
              </button>
            </>
          )}

          {status === "approved" && (
            <button
              type="button"
              onClick={onView}
              className="rounded-xl border border-gray-200 bg-white px-5 py-1.5 text-sm font-semibold text-[#000] transition-colors hover:bg-gray-50 active:scale-98"
            >
              View
            </button>
          )}

          {status === "reviewed" && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-xl border border-gray-200 bg-white px-4.5 py-1.5 text-sm font-semibold text-[#000] transition-colors hover:bg-gray-50 active:scale-98"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onApprove}
                className="rounded-xl bg-color2 px-4.5 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 active:scale-98"
              >
                Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionDetailCard;
