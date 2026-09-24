import { FlaskConical } from "lucide-react";

interface Experiment {
  id: number;
  title: string;
  hours?: number;
  allocated_hours?: number;
}

interface LabExperimentsSummaryProps {
  experiments?: Experiment[];
}

const LabExperimentsSummary = ({ experiments = [] }: LabExperimentsSummaryProps) => {
  const totalHours = experiments.reduce((s, e) => s + (e.allocated_hours ?? e.hours ?? 0), 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-color2-l flex h-8 w-8 items-center justify-center rounded-lg dark:bg-purple-900/20">
            <FlaskConical className="text-color2 h-4.5 w-4.5" />
          </div>
          <h3 className="text-lg font-bold text-color dark:text-white">Lab Experiments</h3>
        </div>
        <span className="text-sm font-semibold text-[#000] dark:text-gray-300">
          {experiments.length} Experiments • {totalHours} Hours
        </span>
      </div>

      {experiments.length === 0 ? (
        <p className="py-6 text-center text-xs text-gray-500 dark:text-gray-400">
          No laboratory experiments available for this syllabus.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {experiments.map((exp, idx) => (
            <div key={exp.id || idx} className="flex items-center gap-3 rounded-xl border border-primary2 bg-primary3 px-3 py-2.5 dark:border-gray-700">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-color2 text-xs font-bold text-white dark:bg-purple-900/20">
                {idx + 1}
              </span>
              <span className="flex-1 text-sm text-[#000] dark:text-gray-300">{exp.title}</span>
              <span className="shrink-0 rounded-md border px-2 py-0.5 text-xs border-primary2 font-semibold text-pri dark:border-gray-600">
                {exp.allocated_hours ?? exp.hours ?? 0} hrs
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabExperimentsSummary;
