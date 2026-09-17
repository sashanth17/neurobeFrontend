import { Check, CheckCircle2, Sparkles } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenerateLessonPlanModalProps {
  open: boolean;
  onClose: () => void;
  /** e.g. "CS309 — Computer Networks" */
  courseLabel?: string;
  stats?: {
    topics: number;
    units: number;
    hours: number;
  };
  response?: {
    job_id: string;
    status: string;
    result?: {
      timeline_id: number;
      syllabus_id: string;
      course_id: string;
      total_hours: number;
      total_units: number;
      total_topics: number;
      stages_completed?: string[];
      progress_percentage?: number;
    };
  } | null;
  onReview?: () => void;
}

// ─── Static generation steps ──────────────────────────────────────────────────

const GENERATION_STEPS = [
  {
    title: "Ingesting Approved Topics & Syllabus",
    description: "Loading 5 units, 22 approved topics, and 45 contact hours for CS309",
  },
  {
    title: "Allocating Lecture Hours & Sequencing",
    description: "Balancing lecture hours (1–3 hrs) per topic to reach 45 contact hours",
  },
  {
    title: "Calibrating Knowledge Levels & Pedagogies",
    description: "Aligning Bloom cognitive levels (K1–K4) with active teaching methods",
  },
  {
    title: "Mapping Textbooks & Reference Chapters",
    description: "Associating Tanenbaum, Kurose-Ross, and Forouzan textbook sections",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

const GenerateLessonPlanModal = ({
  open,
  onClose,
  courseLabel = "CS309 — Computer Networks",
  stats = { topics: 22, units: 5, hours: 45 },
  response = null,
  onReview,
}: GenerateLessonPlanModalProps) => {
  // Use response data if available, otherwise use static GENERATION_STEPS
  const stepsToDisplay = response?.result?.stages_completed || GENERATION_STEPS.map(s => s.title);
  const progressPercentage = response?.result?.progress_percentage ?? 100;
  const totalTopics = response?.result?.total_topics ?? stats.topics;
  const totalUnits = response?.result?.total_units ?? stats.units;
  const totalHours = response?.result?.total_hours ?? stats.hours;
  return (
    <ModalShell
      title="Generate Lesson Plan with NEURO AI"
      subtitle={courseLabel}
      icon={<Sparkles className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      <div className="space-y-4">

        {/* ── Success banner + progress bar ── */}
        <div className="overflow-hidden rounded-xl border border-green-200 bg-green-50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
              <span className="text-sm font-bold text-green-700">
                Lesson Plan Generated Successfully
              </span>
            </div>
            <span className="text-sm font-bold text-green-700">{progressPercentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-green-100">
            <div 
              className="h-full rounded-full bg-green-500 transition-all" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* ── Generation steps ── */}
        <div className="space-y-2">
          {stepsToDisplay.map((step, index) => {
            const stepData = typeof step === 'string' 
              ? { title: step, description: '' }
              : step;
            
            return (
              <div
                key={stepData.title}
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#000]">{stepData.title}</p>
                  {stepData.description && (
                    <p className="mt-0.5 text-xs text-pri">{stepData.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-100 bg-gray-50">
          <div className="flex flex-col items-center py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#000]">
              Topics
            </span>
            <span className="mt-1 text-base font-bold text-[#000]">
              {totalTopics} Topics
            </span>
          </div>
          <div className="flex flex-col items-center py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#000]">
              Units
            </span>
            <span className="mt-1 text-base font-bold text-[#000]">
              {totalUnits} Units
            </span>
          </div>
          <div className="flex flex-col items-center py-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#000]">
              Hours
            </span>
            <span className="mt-1 text-base font-bold text-color2">
              {totalHours} Hours
            </span>
          </div>
        </div>

        {/* ── Review CTA ── */}
        <button
          type="button"
          onClick={() => { onReview?.(); onClose(); }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-color2 py-3.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          Review Generated Lesson Plan
          <span className="text-base leading-none">→</span>
        </button>

      </div>
    </ModalShell>
  );
};

export default GenerateLessonPlanModal;
