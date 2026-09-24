import { useState, useEffect } from "react";
import { PlusCircle, SquarePen, Trash2, Check, X, FlaskConical } from "lucide-react";

interface Experiment {
  id: number;
  experiment_number?: number;
  experimentNumber?: number;
  title: string;
  hours?: number;
  allocated_hours?: number;
  description?: string;
}

interface LabExperimentsProps {
  experiments?: Experiment[];
  syllabusId?: number | string;
  onAddExperiment?: (exp: Partial<Experiment>) => void;
  onDeleteExperiment?: (id: number) => void;
  onUpdateExperiment?: (id: number, updated: Partial<Experiment>) => void;
}

const LabExperiments = ({
  experiments: propExperiments = [],
  syllabusId,
  onAddExperiment,
  onDeleteExperiment,
  onUpdateExperiment,
}: LabExperimentsProps) => {
  const [experiments, setExperiments] = useState<Experiment[]>(propExperiments);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editHours, setEditHours] = useState(3);

  // New experiment form toggle
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newHours, setNewHours] = useState(3);

  useEffect(() => {
    setExperiments(propExperiments || []);
  }, [propExperiments]);

  const handleStartEdit = (exp: Experiment) => {
    setEditingId(exp.id);
    setEditTitle(exp.title || "");
    setEditHours(exp.allocated_hours ?? exp.hours ?? 3);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleSaveEdit = (id: number) => {
    if (!editTitle.trim()) return;
    const updated = { title: editTitle.trim(), allocated_hours: Number(editHours) || 0, hours: Number(editHours) || 0 };
    setExperiments((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updated } : e))
    );
    onUpdateExperiment?.(id, updated);
    setEditingId(null);
  };

  const handleDelete = (id: number) => {
    setExperiments((prev) => prev.filter((e) => e.id !== id));
    onDeleteExperiment?.(id);
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    const newExp: Experiment = {
      id: experiments.length ? Math.max(...experiments.map((e) => Number(e.id) || 0)) + 1 : 1,
      experiment_number: experiments.length + 1,
      experimentNumber: experiments.length + 1,
      title: newTitle.trim(),
      hours: Number(newHours) || 3,
      allocated_hours: Number(newHours) || 3,
    };
    setExperiments((prev) => [...prev, newExp]);
    onAddExperiment?.(newExp);
    setNewTitle("");
    setNewHours(3);
    setShowAddForm(false);
  };

  const totalHours = experiments.reduce(
    (sum, e) => sum + Number(e.allocated_hours ?? e.hours ?? 0),
    0
  );

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary2 text-xs font-bold text-color2 mt-0.5">
            4
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#000] dark:text-white">
                Laboratory Experiments & Practical Exercises
              </h3>
              {experiments.length > 0 && (
                <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-bold text-color2 dark:bg-purple-950/40">
                  {experiments.length} {experiments.length === 1 ? "Experiment" : "Experiments"} • {totalHours} hrs
                </span>
              )}
            </div>
            <p className="text-xs text-[#000] mt-0.5 dark:text-gray-300">
              Hands-on practicals, laboratory exercises, and experiments extracted directly from the syllabus.
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-color2-l px-3 py-1.5 text-sm font-semibold text-color2 hover:bg-primary2 self-center dark:border-purple-700 dark:text-purple-300"
        >
          <PlusCircle className="h-4 w-4" /> {showAddForm ? "Cancel" : "Add Experiment"}
        </button>
      </div>

      {/* Add New Experiment Inline Form */}
      {showAddForm && (
        <div className="mb-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-950/20">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-color2">New Laboratory Experiment</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Experiment Title (e.g., Characteristics of PN Junction Diode)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#000] outline-none focus:border-color2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={newHours}
                onChange={(e) => setNewHours(Number(e.target.value))}
                className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#000] text-center outline-none focus:border-color2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <span className="text-xs font-semibold text-gray-500">hrs</span>
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-lg bg-color2 px-4 py-2 text-xs font-bold text-white hover:opacity-90"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Experiment list or Zero-Data empty state */}
      {experiments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center bg-gray-50/50 dark:bg-gray-800/40">
          <FlaskConical className="h-8 w-8 text-gray-400 mx-auto mb-2 opacity-60" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            No laboratory experiments found in this syllabus.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            This syllabus does not list practical exercises or this course is theory-only. You can use &quot;Add Experiment&quot; above to add one manually.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiments.map((exp, idx) => {
            const expNum = exp.experiment_number ?? exp.experimentNumber ?? (idx + 1);
            const hrs = exp.allocated_hours ?? exp.hours ?? 0;
            const isEditing = editingId === exp.id;

            return (
              <div
                key={exp.id || idx}
                className="flex items-center gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <span className="flex bg-light-yellow h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-yellow text-sm font-bold text-amber-500">
                  {expNum}
                </span>

                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 rounded-lg border border-purple-400 px-3 py-1.5 text-sm text-[#000] outline-none dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      min="0"
                      value={editHours}
                      onChange={(e) => setEditHours(Number(e.target.value))}
                      className="w-16 rounded-lg border border-purple-400 px-2 py-1.5 text-sm text-center outline-none dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      onClick={() => handleSaveEdit(exp.id)}
                      className="rounded-md bg-emerald-600 p-1.5 text-white hover:bg-emerald-700"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="rounded-md bg-gray-400 p-1.5 text-white hover:bg-gray-500"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#000] dark:text-gray-200">
                        {exp.title}
                      </p>
                      {exp.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {exp.description}
                        </p>
                      )}
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-sm font-bold text-[#000] dark:border-gray-600 dark:text-gray-300">
                      {hrs} <span className="text-xs font-normal text-gray-500">hrs</span>
                    </span>
                    <button
                      onClick={() => handleStartEdit(exp)}
                      className="text-gray-400 hover:text-color2 p-1"
                      title="Edit experiment"
                    >
                      <SquarePen className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Delete experiment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LabExperiments;
