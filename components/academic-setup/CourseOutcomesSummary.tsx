import { GraduationCap, CheckCircle2 } from "lucide-react";

interface CO {
  id: number;
  co_code: string;
  description: string;
  knowledge_level: string;
  bloom_level: string;
  is_accepted: boolean;
  syllabus_id?: number;
  reason_for_inferred_level?: string;
}

interface CourseOutcomesSummaryProps {
  outcomes?: CO[];
}

const KNOWLEDGE_LABELS: { [key: string]: string } = {
  K1: "K1 Remember",
  K2: "K2 Understand",
  K3: "K3 Apply",
  K4: "K4 Analyze",
  K5: "K5 Evaluate",
  K6: "K6 Create",
};

const CourseOutcomesSummary = ({
  outcomes = [],
}: CourseOutcomesSummaryProps) => {
  const acceptedCount = outcomes.filter((co) => co.is_accepted).length;
  
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-color2-l flex h-8 w-8 items-center justify-center rounded-lg dark:bg-purple-900/20">
            <GraduationCap className="text-color2 h-4.5 w-4.5" />
          </div>
          <h3 className="text-color text-lg font-bold dark:text-white">
            Course Outcomes & Knowledge Levels
          </h3>
        </div>
        <span className="text-color2 text-sm font-semibold">
          {acceptedCount} / {outcomes.length} Accepted
        </span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {outcomes.length === 0 ? (
          <p className="py-4 text-center text-gray-500 dark:text-gray-400">
            No outcomes available
          </p>
        ) : (
          outcomes.map((co) => (
            <div key={co.id} className="flex items-start justify-between gap-3 py-4">
              <div className="flex flex-1 items-start gap-3">
                <div className="flex flex-col gap-2">
                  <span className="text-color2 rounded-md bg-purple-50 px-2.5 py-0.5 text-xs font-bold dark:bg-purple-900/20">
                    {co.co_code}
                  </span>
                  {co.is_accepted && (
                    <span className="flex items-center gap-1 rounded-md border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-600 dark:bg-green-900/20 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" /> Accepted
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-sm font-medium text-[#000] dark:text-gray-200">
                    {co.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">
                      {co.bloom_level}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-color2 shrink-0 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1 text-sm font-bold dark:bg-purple-900/20 dark:border-purple-800">
                {KNOWLEDGE_LABELS[co.knowledge_level] || co.knowledge_level}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseOutcomesSummary;
