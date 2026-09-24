import { useState, useEffect } from "react";
import { Check, BookOpen, XCircle, Plus, Trash2 } from "lucide-react";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { Dropdown } from "@/utils/function.utils";

const RAW_KNOWLEDGE_LEVELS = [
  { id: "K1 — Remember", name: "K1 — Remember" },
  { id: "K2 — Understand", name: "K2 — Understand" },
  { id: "K3 — Apply", name: "K3 — Apply" },
  { id: "K4 — Analyze", name: "K4 — Analyze" },
  { id: "K5 — Evaluate", name: "K5 — Evaluate" },
  { id: "K6 — Create", name: "K6 — Create" },
];

const RAW_STATUS = [
  { id: "Needs Review", name: "Needs Review" },
  { id: "Approved", name: "Approved" },
];

interface AddSubtopicModalProps {
  open: boolean;
  onClose: () => void;
  parentTopic?: any;
  loading?: boolean;
  onAdd: (payload: {
    subtopic_code: string;
    subtopic_name: string;
    hours: number;
    knowledge_level: string;
    status: string;
    micro_topics: { micro_topic_name: string }[];
  }) => Promise<void> | void;
}

const AddSubtopicModal = ({
  open,
  onClose,
  parentTopic,
  loading = false,
  onAdd,
}: AddSubtopicModalProps) => {
  const knowledgeLevelOptions = Dropdown(RAW_KNOWLEDGE_LEVELS, "name");
  const statusOptions = Dropdown(RAW_STATUS, "name");

  const [subtopicCode, setSubtopicCode] = useState("");
  const [subtopicName, setSubtopicName] = useState("");
  const [hours, setHours] = useState("1");
  const [selectedLevel, setSelectedLevel] = useState<any>(knowledgeLevelOptions[1]); // K2
  const [selectedStatus, setSelectedStatus] = useState<any>(statusOptions[0]); // Needs Review
  const [microTopicInput, setMicroTopicInput] = useState("");
  const [microTopics, setMicroTopics] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      const parentCode = parentTopic?.topic_code || parentTopic?.id || "1";
      const existingSubsCount = Array.isArray(parentTopic?.subtopics) ? parentTopic.subtopics.length : 0;
      setSubtopicCode(`${parentCode}.${existingSubsCount + 1}`);
      setSubtopicName("");
      setHours("1");
      setSelectedLevel(knowledgeLevelOptions[1] || null);
      setSelectedStatus(statusOptions[0] || null);
      setMicroTopics([]);
      setMicroTopicInput("");
      setError("");
    }
  }, [open, parentTopic]);

  const handleAddMicroTopic = () => {
    const trimmed = microTopicInput.trim();
    if (!trimmed) return;
    if (!microTopics.includes(trimmed)) {
      setMicroTopics((prev) => [...prev, trimmed]);
    }
    setMicroTopicInput("");
  };

  const handleRemoveMicroTopic = (indexToRemove: number) => {
    setMicroTopics((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async () => {
    if (!subtopicName.trim()) {
      setError("Please enter a subtopic title");
      return;
    }

    const payload = {
      subtopic_code: subtopicCode.trim() || `${parentTopic?.topic_code || "1"}.1`,
      subtopic_name: subtopicName.trim(),
      hours: parseFloat(hours) || 1,
      knowledge_level: selectedLevel?.value?.split(" ")[0] || "K2",
      status: selectedStatus?.value || "Needs Review",
      micro_topics: microTopics.map((m) => ({ micro_topic_name: m })),
    };

    try {
      await onAdd(payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to add subtopic");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ animation: "fadeIn 0.18s ease" }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        style={{ animation: "slideUp 0.18s ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <BookOpen className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">Add New Subtopic</p>
              <p className="text-xs text-gray-500">
                Under: <span className="font-semibold text-gray-700 dark:text-gray-300">{parentTopic?.topic_name || parentTopic?.title || "Topic"}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          {/* Subtopic Code */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Subtopic Code
            </label>
            <input
              type="text"
              value={subtopicCode}
              onChange={(e) => setSubtopicCode(e.target.value)}
              placeholder="e.g. 1.1.1"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Subtopic Title */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Subtopic Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subtopicName}
              onChange={(e) => {
                setSubtopicName(e.target.value);
                if (error) setError("");
              }}
              placeholder="Enter subtopic title"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Hours & Knowledge Level */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Estimated Hours
              </label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
                Knowledge Level
              </label>
              <CustomSelect
                options={knowledgeLevelOptions}
                value={selectedLevel}
                onChange={(val: any) => setSelectedLevel(val)}
                placeholder="Select level"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Approval Status
            </label>
            <CustomSelect
              options={statusOptions}
              value={selectedStatus}
              onChange={(val: any) => setSelectedStatus(val)}
              placeholder="Select status"
            />
          </div>

          {/* Micro Topics (Optional) */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">
              Micro-Topics (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={microTopicInput}
                onChange={(e) => setMicroTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMicroTopic();
                  }
                }}
                placeholder="Add concept or micro-topic and press Enter"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddMicroTopic}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200"
              >
                <Plus className="h-3 w-3" />
                Add
              </button>
            </div>
            {microTopics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {microTopics.map((m, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => handleRemoveMicroTopic(idx)}
                      className="text-indigo-400 hover:text-indigo-700"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Add Subtopic
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSubtopicModal;
