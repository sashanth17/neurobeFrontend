import { ArrowLeft, CheckCircle, Info, Save } from "lucide-react";
import Image from "next/image";
import KeepFilePrompt from "./KeepFilePrompt";

interface ReviewAndFinalizeSectionProps {
  onBackToEdit?: () => void;
  onSaveDraft?: () => void;
  onApproveFinalize?: () => void;
  finalInspectLabel?: string;
}

const ReviewAndFinalizeSection = ({
  onBackToEdit,
  onSaveDraft,
  onApproveFinalize,
  finalInspectLabel = "Final Inspect Run",
}: ReviewAndFinalizeSectionProps) => {
  return (
    <div className="panel mb-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="section-ti">3. Review &amp; Finalize</h3>
          <p className="mt-0.5 text-xs text-pri">
            Academic print-preview of the question paper.
          </p>
        </div>
        <button
          type="button"
          className="create-btn flex items-center gap-1.5"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {finalInspectLabel}
        </button>
      </div>

      {/* Paper Preview Image */}
      <div className="flex justify-center py-4">
        <Image
          src="/assets/images/neurobe/cia-review.png"
          alt="CIA Question Paper Preview"
          width={500}
          height={800}
          className="rounded-xl border border-gray-200 object-contain shadow-sm dark:border-gray-700"
          priority
        />
      </div>

      {/* Footer Actions */}
      <div className="mt-4 flex items-center justify-between  pt-4 dark:border-gray-700">
        <button
          type="button"
          onClick={onBackToEdit}
          className="create-btn-sec flex items-center gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Edit Sections
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            className="create-btn-sec flex items-center gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            Save Draft
          </button>
          <button
            type="button"
            onClick={onApproveFinalize}
            className="create-btn flex items-center gap-1.5"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Approve &amp; Finalize
          </button>
        </div>
      </div>

      <div className="mt-5">
      <KeepFilePrompt
        icon={<Info className="text-color2 h-4 w-4" />}
        title="Finalization requirement: Sum of all Section Marks must equal Total Paper Marks (100 Marks), and question marks inside each section must equal the section's allocated marks."

      />
      </div>
    </div>
  );
};

export default ReviewAndFinalizeSection;
