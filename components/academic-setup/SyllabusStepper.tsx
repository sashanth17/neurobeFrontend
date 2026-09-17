import { ArrowRightIcon } from "lucide-react";

type StepStatus = "active" | "completed" | "pending";

interface Step {
  number: number;
  label: string;
}

const STEPS: Step[] = [
  { number: 1, label: "Upload Syllabus" },
  { number: 2, label: "AI Extraction" },
  { number: 3, label: "Review & Edit" },
  { number: 4, label: "Approve & Save" },
];

const getStepStatus = (stepNumber: number, currentStep: number): StepStatus => {
  if (stepNumber < currentStep) return "completed";
  if (stepNumber === currentStep) return "active";
  return "pending";
};

const StepCircle = ({ step, status }: { step: Step; status: StepStatus }) => {
  if (status === "completed") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-color2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }
  if (status === "active") {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-color2 text-sm font-bold text-white">
        {step.number}
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-gray-300 text-sm font-semibold text-[#000] dark:border-gray-600 dark:text-[#000]">
      {step.number}
    </div>
  );
};

interface SyllabusStepperProps {
  currentStep: number;
  title?: string;
  description?: string;
  statusLabel?: string;
  statusClassName?: string;
}

const SyllabusStepper = ({
  currentStep = 1,
  title = "Syllabus",
  description = "Course structure, learning outcomes, unit breakdown, and prescribed readings.",
  statusLabel = "Not Started",
  statusClassName = "",
}: SyllabusStepperProps) => {
  return (
    <div className="panel px-6 py-4">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-base font-bold text-[#000] dark:text-white">{title}</h2>
          <p className="mt-0.5 text-sm text-pri">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-pri">
          <span>Status:</span>
          <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold dark:border-gray-600 dark:text-gray-300 ${statusClassName || "border-gray-300 text-[#000]"}`}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.number, currentStep);
          const isLast = index === STEPS.length - 1;
          return (
            <div key={step.number} className="flex flex-1 items-center">
              <div className="flex flex-1 items-center gap-2.5 rounded-lg border border-gray-100 bg-sec p-2">
                <StepCircle step={step} status={status} />
                <span className={`whitespace-nowrap text-sm font-medium ${status === "pending" ? "text-gray-400 dark:text-[#000]" : "text-[#000] dark:text-white"}`}>
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div className="mx-3 flex items-center">
                  <ArrowRightIcon className="h-4 w-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SyllabusStepper;
