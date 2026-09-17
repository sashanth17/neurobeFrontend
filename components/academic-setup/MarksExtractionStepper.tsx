import React from "react";

export type StepStatus = "active" | "completed" | "pending";

export interface MarksExtractionStep {
  number: number;
  label: string;
  subLabel: string;
}

interface MarksExtractionStepperProps {
  currentStep?: number; // 1-3, default 2
  verifiedCount?: number; // default 15
  totalStudents?: number; // default 40
  steps?: MarksExtractionStep[];
  onStepClick?: (stepNumber: number) => void;
  className?: string;
}

const DEFAULT_STEPS = (verifiedCount: number, totalStudents: number): MarksExtractionStep[] => [
  {
    number: 1,
    label: "1. Upload & Extract",
    subLabel: "PDF answer sheets",
  },
  {
    number: 2,
    label: "2. Verify Students",
    subLabel: `${verifiedCount} of ${totalStudents} Verified`,
  },
  {
    number: 3,
    label: "3. Final Approval",
    subLabel: `${Math.max(0, totalStudents - verifiedCount)} students remaining`,
  },
];

const MarksExtractionStepper: React.FC<MarksExtractionStepperProps> = ({
  currentStep = 2,
  verifiedCount = 15,
  totalStudents = 40,
  steps,
  onStepClick,
  className = "",
}) => {
  const [activeStep, setActiveStep] = React.useState<number>(currentStep);

  React.useEffect(() => {
    setActiveStep(currentStep);
  }, [currentStep]);

  const stepsToRender = steps || DEFAULT_STEPS(verifiedCount, totalStudents);

  const handleStepClick = (stepNumber: number) => {
    setActiveStep(stepNumber);
    if (onStepClick) {
      onStepClick(stepNumber);
    }
  };

  return (
    <div className={`panel mb-5 p-4 ${className}`}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stepsToRender.map((step) => {
          const isActive = step.number === activeStep;
          const isCompleted = step.number < activeStep;

          return (
            <div
              key={step.number}
              onClick={() => handleStepClick(step.number)}
              className={`relative flex flex-1 cursor-pointer items-center gap-3.5 rounded-xl p-3.5 sm:p-4 transition-all duration-200 ${isActive
                ? "border-2 border-purple-400 bg-purple-50/40 shadow-sm dark:border-purple-500/80 dark:bg-purple-950/20"
                : "border border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700/80 dark:bg-gray-800/80"
                }`}
            >
              {/* Step Circle */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${isActive
                  ? "border-gray-300 bg-color2 text-white 0 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                  : "border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
              >
                {step.number}
              </div>

              {/* Step Content */}
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-bold text-gray-800 dark:text-white">
                  {step.label}
                </span>
                <span className="truncate text-xs text-pri dark:text-gray-400">
                  {step.subLabel}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarksExtractionStepper;
