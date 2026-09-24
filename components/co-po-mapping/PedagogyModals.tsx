import { useState, useEffect } from "react";
import { BookOpen, RefreshCw, Check, Plus } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";
import TextInput from "@/components/FormFields/TextInput.component";
import TextArea from "@/components/FormFields/TextArea.component";

// ─── Edit Pedagogy Modal ──────────────────────────────────────────────────────
interface EditPedagogyModalProps {
  open: boolean;
  onClose: () => void;
  topicLabel?: string;
  initialTitle?: string;
  initialDescription?: string;
  onSave?: (title: string, description: string) => Promise<void> | void;
}

export const EditPedagogyModal = ({
  open,
  onClose,
  topicLabel = "",
  initialTitle = "",
  initialDescription = "",
  onSave,
}: EditPedagogyModalProps) => {
  const [form, setForm] = useState({ title: initialTitle, description: initialDescription });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ title: initialTitle, description: initialDescription });
  }, [open, initialTitle, initialDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      setSaving(true);
      if (onSave) {
        await onSave(form.title.trim(), form.description.trim());
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Edit Pedagogy Method"
      subtitle={topicLabel}
      icon={<BookOpen className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <TextInput
          title="Teaching Method Name"
          required
          placeholder="e.g. Concept Exploration"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        <div className="mt-4">
          <TextArea
            title="Description / Classroom Activity"
            required
            rows={4}
            placeholder="Describe the teaching activity..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save and Accept"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

interface ReplacePedagogyModalProps {
  open: boolean;
  onClose: () => void;
  topicLabel?: string;
  currentTitle?: string;
  options?: any[];
  onSelect?: (selectedTitle: string, selectedDescription: string) => Promise<void> | void;
}

export const ReplacePedagogyModal = ({
  open,
  onClose,
  topicLabel = "",
  currentTitle = "",
  options = [],
  onSelect,
}: ReplacePedagogyModalProps) => {
  const [selected, setSelected] = useState(currentTitle);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSelected(currentTitle);
  }, [open, currentTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenOption = options.find((opt) => opt.title === selected);
    const chosenDesc = chosenOption?.description || "";
    try {
      setSubmitting(true);
      if (onSelect) {
        await onSelect(selected, chosenDesc);
      } else {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="Replace Pedagogy Method"
      subtitle={topicLabel}
      icon={<RefreshCw className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <p className="mb-3 text-xs text-[#000] dark:text-white/70">
          Select an alternative teaching method from the library:
        </p>
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = selected === opt.title;
            return (
              <button
                key={opt.title}
                type="button"
                onClick={() => setSelected(opt.title)}
                className={`flex w-full items-start justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  isSelected
                    ? "border-color2 bg-color2-l"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? "text-color2" : "text-[#000] dark:text-white"}`}>
                    {opt.title}
                  </p>
                  {opt.description && (
                    <p className="mt-0.5 text-xs text-pri dark:text-white/60">{opt.description}</p>
                  )}
                </div>
                <span className={`ml-3 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  isSelected ? "border-color2 bg-color2" : "border-gray-300"
                }`}>
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !selected}
            className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> {submitting ? "Replacing..." : "Replace & Accept"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ─── Add Pedagogy Modal ───────────────────────────────────────────────────────
interface AddPedagogyModalProps {
  open: boolean;
  onClose: () => void;
  topicLabel?: string;
  topicId?: number | string;
  availableTopics?: { id: number | string; title: string }[];
  onAdd?: (topicId: number | string, title: string, description: string, isSelected: boolean) => Promise<void> | void;
}

const COMMON_PEDAGOGIES = [
  {
    title: "Concept Exploration",
    description: "Interactive classroom lecture with visual diagrams and conceptual Q&A.",
  },
  {
    title: "Flipped Classroom",
    description: "Students review digital self-study material beforehand; classroom dedicated to advanced applications.",
  },
  {
    title: "Collaborative Problem Solving",
    description: "Small student groups work collaboratively through complex domain problem scenarios.",
  },
  {
    title: "Case Study Analysis",
    description: "In-depth investigation of real-world industry case studies and post-mortems.",
  },
  {
    title: "Peer Instruction",
    description: "Short conceptual questions followed by peer discussion and instructor reconciliation.",
  },
  {
    title: "Interactive Demonstration",
    description: "Live walk-through demonstration or simulator test with immediate formative quiz.",
  },
  {
    title: "Think-Pair-Share",
    description: "Individual reflection followed by pairwise synthesis and cohort sharing.",
  },
];

export const AddPedagogyModal = ({
  open,
  onClose,
  topicLabel = "",
  topicId,
  availableTopics = [],
  onAdd,
}: AddPedagogyModalProps) => {
  const [selectedTopicId, setSelectedTopicId] = useState<number | string | undefined>(topicId);
  const [form, setForm] = useState({ title: "", description: "" });
  const [isSelected, setIsSelected] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedTopicId(topicId || (availableTopics.length > 0 ? availableTopics[0].id : undefined));
    setForm({ title: "", description: "" });
    setIsSelected(true);
  }, [open, topicId, availableTopics]);

  const handleApplyPreset = (preset: { title: string; description: string }) => {
    setForm({ title: preset.title, description: preset.description });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTopicId = selectedTopicId ?? topicId;
    if (!finalTopicId || !form.title.trim()) return;
    try {
      setSaving(true);
      if (onAdd) {
        await onAdd(finalTopicId, form.title.trim(), form.description.trim(), isSelected);
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const currentTopicDisplay = availableTopics.find((t) => String(t.id) === String(selectedTopicId))?.title || topicLabel;

  return (
    <ModalShell
      title="Add Teaching Method"
      subtitle={currentTopicDisplay ? `For ${currentTopicDisplay}` : "Define teaching methodology"}
      icon={<Plus className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {availableTopics.length > 1 && (
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold text-[#000] dark:text-white">
              Target Topic
            </label>
            <select
              value={String(selectedTopicId || "")}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#000] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {availableTopics.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-semibold text-pri dark:text-white/70">
            Quick Pick from Library
          </label>
          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
            {COMMON_PEDAGOGIES.map((p) => {
              const isActive = form.title === p.title;
              return (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    isActive
                      ? "bg-color2 text-white shadow-sm"
                      : "border border-gray-200 bg-gray-50 text-gray-700 hover:border-color2 hover:text-color2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  }`}
                >
                  {p.title}
                </button>
              );
            })}
          </div>
        </div>

        <TextInput
          title="Teaching Method Name"
          required
          placeholder="e.g. Concept Exploration or Collaborative Problem Solving"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />

        <div className="mt-4">
          <TextArea
            title="Description / Classroom Activity"
            required
            rows={4}
            placeholder="Describe the instructional activity, student engagement model, or lab integration..."
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-50 p-2.5 dark:bg-gray-800">
          <input
            id="mark-selected-cb"
            type="checkbox"
            checked={isSelected}
            onChange={(e) => setIsSelected(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-color2 focus:ring-color2 cursor-pointer"
          />
          <label htmlFor="mark-selected-cb" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            Mark as selected / active teaching method for this topic
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.title.trim()}
            className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> {saving ? "Adding..." : "Add Teaching Method"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

