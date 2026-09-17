import { CheckCircle2, ArrowRight } from "lucide-react";

interface SyllabusApprovedBannerProps {
  courseCode?: string;
  onProceed?: () => void;
}

const SyllabusApprovedBanner = ({ courseCode = "CS309", onProceed }: SyllabusApprovedBannerProps) => (
  <div className="mb-4 flex items-center justify-between rounded-xl btn-green px-5 py-4">
    <div className="flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
      <div>
        <p className="text-lg font-bold text-white">Syllabus Approved Successfully</p>
        <p className="text-sm text-white/80">Status: Published and Syllabus list active for {courseCode}.</p>
      </div>
    </div>
    <button
      onClick={onProceed}
      className="flex items-center gap-2 rounded-lg border border-white/60 px-4 py-1.5 text-sm font-semibold text-green bg-white"
    >
      Proceed to CO-PO Mapping <ArrowRight className="h-4 w-4" />
    </button>
  </div>
);

export default SyllabusApprovedBanner;
