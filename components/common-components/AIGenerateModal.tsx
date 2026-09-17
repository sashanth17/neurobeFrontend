import React from "react";
import { X } from "lucide-react";

interface Step {
  title: string;
  description: string;
}

interface AIGenerateModalProps {
  open: boolean;
  onClose: () => void;
  // Header
  headerIcon?: React.ReactNode;
  title: string;
  subtitle?: string;
  // Progress
  progressLabel?: string;
  progressPercent?: number;
  // Steps (dynamic center content)
  steps?: Step[];
  // Footer
  cancelLabel?: string;
  actionLabel: string;
  actionBgColor?: string;
  onAction: () => void;
  render: () => React.ReactNode;
  actionIcon?: React.ReactNode;
  actionLoading?: boolean;
}

const AIGenerateModal = ({
  open,
  onClose,
  headerIcon,
  title,
  subtitle,
  progressLabel = "COMPLETED SUCCESSFULLY",
  progressPercent = 100,
  steps = [],
  cancelLabel = "Cancel",
  actionLabel,
  actionBgColor = "#7c3aed",
  onAction,
  render,
  actionIcon,
  actionLoading = false,
}: AIGenerateModalProps) => {
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="bg-dark-blue flex items-center justify-between border border-white/5 px-6 py-5">
          <div className="flex items-center gap-4">
            {headerIcon && (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#7c3aed]">
                {headerIcon}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-white">{title}</h2>
              {subtitle && <p className="text-sm text-[#a78bfa]">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-600 text-[#000] hover:text-white"
          >
            <X className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Body */}
        {render()}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
          <button
            onClick={onClose}
            className="text-pri text-sm font-medium hover:text-[#000]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={(e) => onAction()}
            disabled={actionLoading}
            className={`create-btn cursor-pointer ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {actionIcon}
            {actionLoading ? "Generating..." : actionLabel}
          </button>
          {/* <button
            onClick={onAction}
            className={` ${actionBgColor} flex items-center gap-2 rounded-xl px-6 py-3 text-md font-bold text-white transition-opacity hover:opacity-90`}
          >
            {actionLabel}
            <span>→</span>
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default AIGenerateModal;
