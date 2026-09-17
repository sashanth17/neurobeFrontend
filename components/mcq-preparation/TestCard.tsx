import React from "react";
import { Clock, Users, FileText, ChevronRight } from "lucide-react";

export type TestStatus = "draft" | "upcoming" | "live" | "completed";

export interface TestCardProps {
  id: string;
  title: string;
  unit: string;
  topic: string;
  status: TestStatus;
  questions: number;
  duration: number; // in minutes
  totalAttempts?: number;
  highestScore?: number;
  scheduledDate?: string;
  onStart?: () => void;
  onView?: () => void;
  onRetry?: () => void;
}

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    bgClass: "bg-gray-100 dark:bg-gray-700",
    textClass: "text-[#000] dark:text-gray-300",
    badgeClass: "bg-gray-200 dark:bg-gray-600 text-[#000] dark:text-gray-200",
  },
  upcoming: {
    label: "Upcoming",
    bgClass: "bg-blue-50 dark:bg-blue-950/30",
    textClass: "text-blue-700 dark:text-blue-300",
    badgeClass: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  },
  live: {
    label: "Live",
    bgClass: "bg-green-50 dark:bg-green-950/30",
    textClass: "text-green-700 dark:text-green-300",
    badgeClass: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  },
  completed: {
    label: "Completed",
    bgClass: "bg-purple-50 dark:bg-purple-950/30",
    textClass: "text-purple-700 dark:text-purple-300",
    badgeClass: "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300",
  },
};

const TestCard: React.FC<TestCardProps> = ({
  id,
  title,
  unit,
  topic,
  status,
  questions,
  duration,
  totalAttempts,
  highestScore,
  scheduledDate,
  onStart,
  onView,
  onRetry,
}) => {
  const statusCfg = STATUS_CONFIG[status];

  return (
    <div
      className={`rounded-lg border border-gray-200 dark:border-gray-700 p-5 transition hover:shadow-md dark:bg-gray-800 ${statusCfg.bgClass}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left Content */}
        <div className="min-w-0 flex-1">
          {/* Title */}
          <h3 className="mb-1 text-sm font-bold text-[#000] dark:text-white">
            {title}
          </h3>

          {/* Meta */}
          <p className="mb-3 text-xs text-[#000] dark:text-gray-400">
            {unit} • {topic}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-xs text-[#000] dark:text-gray-400">
            <div className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span>{questions} Questions</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{duration} mins</span>
            </div>
            {status === "completed" && totalAttempts && (
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>{totalAttempts} Attempts</span>
              </div>
            )}
          </div>

          {/* Score for completed */}
          {status === "completed" && highestScore !== undefined && (
            <div className="mt-3 rounded-lg bg-white dark:bg-gray-700 px-3 py-2">
              <p className="text-xs font-semibold text-[#000] dark:text-gray-300">
                Highest Score: <span className="text-purple-600 dark:text-purple-400">{highestScore}%</span>
              </p>
            </div>
          )}

          {/* Scheduled date */}
          {status === "upcoming" && scheduledDate && (
            <div className="mt-3 rounded-lg bg-white dark:bg-gray-700 px-3 py-2">
              <p className="text-xs font-semibold text-[#000] dark:text-gray-300">
                Scheduled: <span className="text-blue-600 dark:text-blue-400">{scheduledDate}</span>
              </p>
            </div>
          )}
        </div>

        {/* Right Content */}
        <div className="flex shrink-0 flex-col items-end justify-between gap-3 self-stretch">
          {/* Status Badge */}
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusCfg.badgeClass}`}>
            {statusCfg.label}
          </span>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {status === "draft" && onStart && (
              <button
                onClick={onStart}
                className="flex items-center gap-1 rounded-lg bg-purple-600 dark:bg-purple-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 dark:hover:bg-purple-600 transition"
              >
                Start
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
            {status === "live" && onStart && (
              <button
                onClick={onStart}
                className="flex items-center gap-1 rounded-lg bg-green-600 dark:bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 dark:hover:bg-green-600 transition"
              >
                Start Test
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
            {status === "completed" && onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-[#000] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Retry
              </button>
            )}
            {onView && (
              <button
                onClick={onView}
                className="flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-[#000] dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                View
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCard;
