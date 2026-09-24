import { useState, useEffect } from "react";
import { CheckCircle2, Pencil, X, Check, Sparkle } from "lucide-react";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { Failure } from "@/utils/function.utils";


const KNOWLEDGE_OPTIONS = [
  { value: "K1", label: "K1 Remember" },
  { value: "K2", label: "K2 Understand" },
  { value: "K3", label: "K3 Apply" },
  { value: "K4", label: "K4 Analyze" },
  { value: "K5", label: "K5 Evaluate" },
  { value: "K6", label: "K6 Create" },
];

const CourseOutcomes = (props: any) => {
  const { outcomes = [], onSaveOutcome, onAcceptOutcome, onKnowledgeLevelChange } = props;
  const [cos, setCos] = useState(outcomes);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // Sync outcomes prop changes to local state
  useEffect(() => {
    setCos(outcomes);
  }, [outcomes]);

  const acceptedCount = cos.filter((c: any) => c.is_accepted).length;

  const handleEdit = (id: number, description: string) => {
    setEditingId(id);
    setEditDescription(description || "");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditDescription("");
  };

  const handleSave = async (id: number, co_code: string) => {
    if (!editDescription.trim()) {
      Failure("Description cannot be empty");
      return;
    }

    const updatedDesc = editDescription.trim();
    // Optimistic local update
    setCos((prev: any) =>
      prev.map((c: any) =>
        c.id === id ? { ...c, description: updatedDesc } : c
      )
    );
    setEditingId(null);
    setEditDescription("");

    if (onSaveOutcome) {
      try {
        setLoading(true);
        await onSaveOutcome(id, updatedDesc, co_code);
      } catch (error: any) {
        console.warn("handleSave backend call error, local state preserved:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAccept = async (id: number) => {
    // Optimistic local accept
    setCos((prev: any) =>
      prev.map((c: any) =>
        c.id === id ? { ...c, is_accepted: true } : c
      )
    );

    if (onAcceptOutcome) {
      try {
        setLoading(true);
        await onAcceptOutcome(id);
      } catch (error: any) {
        console.warn("handleAccept backend call error, local state preserved:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKnowledgeChange = async (id: number, value: string) => {
    // Optimistic local update so dropdown updates immediately
    setCos((prev: any) =>
      prev.map((c: any) =>
        c.id === id ? { ...c, knowledge_level: value } : c
      )
    );

    if (onKnowledgeLevelChange) {
      try {
        setLoading(true);
        await onKnowledgeLevelChange(id, value);
      } catch (error: any) {
        console.warn("handleKnowledgeChange backend call error, local state preserved:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary2 text-xs font-bold text-color2">2</span>
          <h3 className="text-sm font-extrabold  uppercase tracking-wide text-[#000] dark:text-white">Course Outcomes & Knowledge Levels</h3>
        </div>
      </div>

      <div className="space-y-4">
        {cos.map((co: any) => (
          <div
            key={co.id}
            className="rounded-xl border border-purple-100 p-4 dark:border-purple-900/30"
          >
            {/* Top row */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-bold text-white dark:bg-gray-100 dark:text-[#000]">
                  {co.co_code}
                </span>
                <div className="w-36">
                  <CustomSelect
                    options={KNOWLEDGE_OPTIONS}
                    value={KNOWLEDGE_OPTIONS.find((o) => o.value === co.knowledge_level) || null}
                    onChange={(opt: any) => handleKnowledgeChange(co.id, opt?.value)}
                    isSearchable={false}
                    isClearable={false}
                    disabled={loading}
                  />
                </div>
                <span className="rounded-md bg-sec px-2.5 py-0.5 text-md font-medium text-color2 dark:bg-purple-900/20">
                  AI Inferred Knowledge Level
                </span>
              </div>

              <div className="flex items-center gap-2">
                {editingId === co.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSave(co.id, co.co_code)}
                      disabled={loading}
                      className="flex items-center gap-1 rounded-md bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" /> Save
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex items-center gap-1 rounded-md bg-gray-400 px-2 py-1 text-xs font-medium text-white hover:bg-gray-500 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleEdit(co.id, co.description)}
                    className="flex items-center gap-1 text-xs font-medium text-pri hover:text-[#000]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            {editingId === co.id ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={loading}
                className="mb-3 w-full rounded-lg border border-blue-400 px-3 py-2 text-sm text-[#000] outline-none dark:bg-gray-800 dark:text-white"
                rows={3}
              />
            ) : (
              <p className="mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#000] dark:bg-gray-800 dark:text-gray-300">
                {co.description}
              </p>
            )}

            {/* Reason box */}
            {co.reason_for_inferred_level && (
              <div className="flex items-start gap-2 rounded-lg bg-purple-50 px-3 py-2.5 dark:bg-purple-900/10">
                <Sparkle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-color2" />
                <span className="text-xs text-[#000] dark:text-gray-400">
                  <strong className="text-color2">Reason for Inferred Knowledge Level: </strong>
                  {co.reason_for_inferred_level}
                </span>
              </div>
            )}
          </div>
        ))}

        {cos.length === 0 && (
          <p className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
            No course outcomes found in this syllabus.
          </p>
        )}
      </div>
    </div>
  );
};

export default CourseOutcomes;
