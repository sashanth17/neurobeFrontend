import React, { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";
import TableComponent from "@/components/common-components/TableComponent";

export interface AssistantChangeRecord {
  id: string;
  studentName: string;
  studentCode: string;
  question: string;
  systemRead: number;
  assistantSuggested: number;
  submittedAt: string;
}

export interface AssistantChangesModalProps {
  open: boolean;
  onClose: () => void;
  reviewerName?: string;
  records?: AssistantChangeRecord[];
  onReviewRow?: (record: AssistantChangeRecord) => void;
}

const DEFAULT_CHANGES: AssistantChangeRecord[] = [
  {
    id: "1",
    studentName: "Deepika Sundaram",
    studentCode: "24CS1044",
    question: "Q4",
    systemRead: 2.5,
    assistantSuggested: 2,
    submittedAt: "08 Sep 2026, 11:20 AM",
  },
  {
    id: "2",
    studentName: "Bhuvaneshwari P",
    studentCode: "24CS1046",
    question: "Q4",
    systemRead: 2.5,
    assistantSuggested: 2,
    submittedAt: "08 Sep 2026, 12:35 PM",
  },
  {
    id: "3",
    studentName: "Bhuvaneshwari P",
    studentCode: "24CS1046",
    question: "Q6",
    systemRead: 7,
    assistantSuggested: 6.5,
    submittedAt: "08 Sep 2026, 12:35 PM",
  },
];

// ── Hooks ──
const useLockBodyScroll = (active: boolean) => {
  useEffect(() => {
    if (active) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);
};

const useAnimatedVisibility = (open: boolean, duration = 220) => {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
    } else if (visible) {
      setClosing(true);
      const t = setTimeout(() => {
        setVisible(false);
        setClosing(false);
      }, duration);
      return () => clearTimeout(t);
    }
  }, [open]);

  return { visible, closing };
};

export const AssistantChangesModal: React.FC<AssistantChangesModalProps> = ({
  open,
  onClose,
  reviewerName = "Kavya Raman",
  records = DEFAULT_CHANGES,
  onReviewRow,
}) => {
  const { visible, closing } = useAnimatedVisibility(open);
  useLockBodyScroll(visible);

  if (!visible) return null;

  const columns = [
    {
      accessor: "studentName",
      title: "STUDENT",
      render: ({ studentName, studentCode }: AssistantChangeRecord) => (
        <div>
          <p className="font-bold text-gray-900 dark:text-white">{studentName}</p>
          <p className="text-xs text-gray-400">{studentCode}</p>
        </div>
      ),
    },
    {
      accessor: "question",
      title: "QUESTION",
      render: ({ question }: AssistantChangeRecord) => (
        <span className="font-bold text-gray-900 dark:text-white">{question}</span>
      ),
    },
    {
      accessor: "systemRead",
      title: "SYSTEM READ",
      render: ({ systemRead }: AssistantChangeRecord) => (
        <span className="text-gray-600 dark:text-gray-300">{systemRead}</span>
      ),
    },
    {
      accessor: "assistantSuggested",
      title: "ASSISTANT SUGGESTED",
      render: ({ assistantSuggested }: AssistantChangeRecord) => (
        <span className="font-bold text-color2 dark:text-purple-400">
          {assistantSuggested}
        </span>
      ),
    },
    {
      accessor: "submittedAt",
      title: "SUBMITTED AT",
      render: ({ submittedAt }: AssistantChangeRecord) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {submittedAt}
        </span>
      ),
    },
    {
      accessor: "action",
      title: "ACTION",
      render: (record: AssistantChangeRecord) => (
        <button
          type="button"
          onClick={() => onReviewRow?.(record)}
          className="text-color2 inline-flex items-center gap-1 text-xs font-bold transition-colors hover:underline"
        >
          <span>Review</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        style={{ animation: closing ? "fadeOut 0.22s ease forwards" : "fadeIn 0.22s ease" }}
        onClick={onClose}
      />

      {/* Right-side drawer / sidebar */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col bg-white shadow-2xl dark:bg-gray-900"
        style={{ animation: closing ? "slideOutRight 0.22s ease forwards" : "slideInRight 0.22s ease" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Assistant Changes
            </h3>
            <p className=" text-sm font-medium text-pri dark:text-gray-400">
              Reviewed by {reviewerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-gray-100 p-0.5 border border-color1"
          >
            <X className="h-4 w-4 text-color1" />
          </button>
        </div>

        {/* Scrollable Body with Table */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
            <TableComponent
              records={records}
              columns={columns}
              noRecordsText="No assistant changes found"
            />
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-gray-700">
          <p className="text-sm font-semibold text-pri dark:text-gray-400">
            {records.length} suggestions pending instructor review
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-[#111625] px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default AssistantChangesModal;
