import { useState, useEffect } from "react";
import { BookOpen, RefreshCw, Check } from "lucide-react";
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
}

export const EditPedagogyModal = ({
  open,
  onClose,
  topicLabel = "",
  initialTitle = "",
  initialDescription = "",
}: EditPedagogyModalProps) => {
  const [form, setForm] = useState({ title: initialTitle, description: initialDescription });

  useEffect(() => {
    setForm({ title: initialTitle, description: initialDescription });
  }, [open, initialTitle, initialDescription]);

  return (
    <ModalShell
      title="Edit Pedagogy Method"
      subtitle={topicLabel}
      icon={<BookOpen className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      <form onSubmit={(e) => { e.preventDefault(); onClose(); }}>
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
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Check className="h-3.5 w-3.5" /> Save and Accept
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
  options?: any;
}

export const ReplacePedagogyModal = ({
  open,
  onClose,
  topicLabel = "",
  currentTitle = "",
  options = [],
}: ReplacePedagogyModalProps) => {
  const [selected, setSelected] = useState(currentTitle);

  useEffect(() => {
    setSelected(currentTitle);
  }, [open, currentTitle]);

  return (
    <ModalShell
      title="Replace Pedagogy Method"
      subtitle={topicLabel}
      icon={<RefreshCw className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      <form onSubmit={(e) => { e.preventDefault(); onClose(); }}>
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
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Check className="h-3.5 w-3.5" /> Replace & Accept
          </button>
        </div>
      </form>
    </ModalShell>
  );
};
