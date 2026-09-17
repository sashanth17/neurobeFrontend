import { TrendingUp, Check, ArrowRight } from "lucide-react";

export type StepStatus = "active" | "completed" | "pending";

export interface Step {
  number: number;
  label: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Upload File" },
  { number: 2, label: "Validate File" },
  { number: 3, label: "Review Results" },
  { number: 4, label: "Import Complete" },
];

interface ImportProgressStepperProps {
  currentStep: number; // 1-4
  statusLabel?: string; // e.g. "Awaiting Upload"
}

const getStepStatus = (stepNumber: number, currentStep: number): StepStatus => {
  if (stepNumber < currentStep) return "completed";
  if (stepNumber === currentStep) return "active";
  return "pending";
};

const StepCircle = ({ step, status }: { step: Step; status: StepStatus }) => {
  if (status === "completed") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00ba88]">
        <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
      </div>
    );
  }

  if (status === "active") {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5925dc] text-xs font-bold text-white">
        {step.number}
      </div>
    );
  }

  // pending
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gray-300 text-xs font-semibold text-gray-400 dark:border-gray-600 dark:text-gray-500">
      {step.number}
    </div>
  );
};

const ImportProgressStepper = ({
  currentStep = 1,
  statusLabel = "Awaiting Upload",
}: ImportProgressStepperProps) => {
  const isComplete = currentStep === 4;

  return (
    <div className="panel mb-5 px-6 py-4">
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#5925dc]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#1e293b] dark:text-white">
            IMPORT PROGRESS
          </span>
        </div>

        {/* Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isComplete
              ? "border border-[#a7f3d0] bg-[#ecfdf5] text-[#027a48] dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
              : "border border-[#d9d6fe] bg-[#f4f3ff] text-[#5925dc] dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isComplete ? "bg-[#12b76a]" : "bg-[#5925dc]"
            }`}
          />
          <span>{statusLabel}</span>
        </span>
      </div>

      {/* Steps Row with connector arrows */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.number, currentStep);
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.number} className="flex flex-1 items-center gap-3">
              {/* Step Card */}
              <div
                className={`flex flex-1 items-center gap-2.5 rounded-xl px-4 py-3 border transition-all duration-200 ${
                  status === "completed"
                    ? "border-[#a7f3d0] bg-[#ecfdf5] text-[#027a48] dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
                    : status === "active"
                    ? "border-[#d9d6fe] bg-[#f4f3ff] text-[#5925dc] dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300 shadow-sm"
                    : "border-gray-200 bg-gray-50/70 text-gray-400 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-500"
                }`}
              >
                <StepCircle step={step} status={status} />
                <span
                  className={`text-xs sm:text-sm font-bold truncate ${
                    status === "completed"
                      ? "text-[#027a48] dark:text-green-300"
                      : status === "active"
                      ? "text-[#5925dc] dark:text-purple-300"
                      : "text-gray-400 dark:text-gray-500 font-medium"
                  }`}
                >
                  {step.number}. {step.label}
                </span>
              </div>

              {/* Connector arrow — not after last step */}
              {!isLast && (
                <div className="flex shrink-0 items-center justify-center text-gray-400 dark:text-gray-500">
                  <ArrowRight className="h-4 w-4 rotate-90 lg:rotate-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImportProgressStepper;
