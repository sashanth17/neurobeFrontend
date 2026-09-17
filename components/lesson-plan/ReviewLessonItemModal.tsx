import { CheckCircle2 } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReviewLessonItemData {
  id: string;
  seq: number;
  title: string;
  level: string;
  hours: string;
  textbook: string;
  reference: string;
  pedagogy: string;
  unitLabel?: string;
}

interface ReviewLessonItemModalProps {
  open: boolean;
  onClose: () => void;
  data: ReviewLessonItemData | null;
  onAccept: () => void;
}

// ─── Row helper ───────────────────────────────────────────────────────────────

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#000]">
      {label}
    </span>
    <span className="text-sm font-medium text-[#000] dark:text-white">{value}</span>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ReviewLessonItemModal = ({
  open,
  onClose,
  data,
  onAccept,
}: ReviewLessonItemModalProps) => {
  if (!data) return null;

  return (
    <ModalShell
      title="Review Lesson Plan Item"
      subtitle={data.unitLabel ?? ""}
      icon={
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-color2 text-xs font-bold text-white">
          {String(data.seq).padStart(2, "0")}
        </span>
      }
      open={open}
      onClose={onClose}
    >
      <div className="space-y-4">

        {/* Topic title */}
        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#000]">
            Topic
          </p>
          <p className="mt-1 text-sm font-semibold text-[#000] dark:text-white">
            {data.title}
          </p>
        </div>

        {/* Level / Hours / Pedagogy */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50">
          <div className="flex flex-col items-center py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#000]">
              Level
            </span>
            <span className="mt-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-bold text-[#000]">
              {data.level}
            </span>
          </div>
          <div className="flex flex-col items-center py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#000]">
              Hours
            </span>
            <span className="mt-1 text-sm font-bold text-[#000]">{data.hours}</span>
          </div>
          <div className="flex flex-col items-center py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#000]">
              Pedagogy
            </span>
            <span className="mt-1 text-center text-xs font-semibold text-color2">
              {data.pedagogy}
            </span>
          </div>
        </div>

        {/* Books */}
        <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
          <InfoRow label="Textbook" value={data.textbook} />
          <div className="border-t border-gray-100" />
          <InfoRow label="Reference Book" value={data.reference} />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { onAccept(); onClose(); }}
            className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Accept
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default ReviewLessonItemModal;
