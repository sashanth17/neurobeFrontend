import React, { useState } from "react";
import { Check, CheckCircle2, Copy } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";
import TextInput from "@/components/FormFields/TextInput.component";

export interface ShareVerificationSuccessModalProps {
  open: boolean;
  onClose: () => void;
  verificationLink?: string;
  securityCode?: string;
  expiresOn?: string;
  usage?: string;
  onRevoke?: () => void;
}

export const ShareVerificationSuccessModal: React.FC<
  ShareVerificationSuccessModalProps
> = ({
  open,
  onClose,
  verificationLink = "https://obe.vetri.edu/assistant/verify?token=",
  securityCode = "363-286",
  expiresOn = "11 Sept 2026, 11:59 PM",
  usage = "0 of 10 uses",
  onRevoke,
}) => {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    const handleCopyLink = () => {
      navigator.clipboard.writeText(verificationLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleCopyCode = () => {
      navigator.clipboard.writeText(securityCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    };

    return (
      <ModalShell
        title="Share Verification Task"
        open={open}
        onClose={onClose}
      >
        <div className="space-y-4">
          {/* Top Success Banner */}
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-[#ECFDF5] p-3.5 dark:border-emerald-800/40 dark:bg-emerald-950/30">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </div>
            <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Secure link &amp; code ready to share.
            </span>
          </div>

          {/* Verification Link */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextInput
                title="Verification Link"
                value={verificationLink}
                readOnly
                onChange={() => { }}
                className="font-mono text-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex h-[38px] items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 text-xs font-bold text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-750"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Security Code */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <TextInput
                title="Security Code"
                value={securityCode}
                readOnly
                onChange={() => { }}
                className="font-mono font-bold tracking-wider text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex h-[38px] items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 text-xs font-bold text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-750"
            >
              {copiedCode ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Details Card */}
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-pri dark:text-gray-400 text-sm">Expires On</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {expiresOn}
              </span>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-pri dark:text-gray-400 text-sm">Usage</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {usage}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onRevoke}
              className="text-sm font-bold text-red-600 underline transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              Revoke Access
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#111625] px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-gray-700 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </ModalShell>
    );
  };

export default ShareVerificationSuccessModal;
