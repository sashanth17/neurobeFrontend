import { useState, useEffect } from "react";
import { BookOpen, Save } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";
import TextInput from "@/components/FormFields/TextInput.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";

// ─── Options ─────────────────────────────────────────────────────────────────

const LEVEL_OPTS = ["K1", "K2", "K3", "K4", "K5", "K6"].map((v) => ({
  value: v,
  label: v,
}));

const STATUS_OPTS = [
  { value: "Reviewed", label: "Reviewed" },
  { value: "Needs Review", label: "Needs Review" },
];

const PEDAGOGY_OPTS = [
  "Concept Exploration",
  "Guided Discussion",
  "Problem-Based Learning",
  "Collaborative Learning",
  "Hands-on Lab",
  "Flipped Classroom",
  "Case Study Analysis",
  "Simulation Lab",
  "Peer Teaching",
  "Demonstration",
  "Comparative Analysis",
  "Interactive Demo",
  "Guest Lecture",
  "Research Assignment",
  "Project Work",
].map((v) => ({ value: v, label: v }));

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonPlanEditData {
  id: string;
  seq: number;
  title: string;
  level: string;
  hours: string;
  textbook: string;
  reference: string;
  pedagogy: string;
  status: "Reviewed" | "Needs Review";
  unitLabel?: string;
}

interface EditLessonPlanModalProps {
  open: boolean;
  onClose: () => void;
  data: LessonPlanEditData | null;
  onSave?: (updated: LessonPlanEditData) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const toOpt = (v: string) => ({ value: v, label: v });

const EditLessonPlanModal = ({
  open,
  onClose,
  data,
  onSave,
}: EditLessonPlanModalProps) => {
  const [form, setForm] = useState({
    title: "",
    seq: "",
    level: null as any,
    hours: "",
    status: null as any,
    textbook: "",
    reference: "",
    pedagogy: null as any,
  });

  // Sync form when data changes or modal opens
  useEffect(() => {
    if (data) {
      setForm({
        title: data.title,
        seq: String(data.seq),
        level: toOpt(data.level),
        hours: data.hours.replace(" Hours", ""),
        status: toOpt(data.status),
        textbook: data.textbook,
        reference: data.reference,
        pedagogy: toOpt(data.pedagogy),
      });
    }
  }, [data, open]);

  const set = (key: string, val: any) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    onSave?.({
      ...data,
      title: form.title,
      seq: Number(form.seq),
      level: form.level?.value ?? data.level,
      hours: `${form.hours} Hours`,
      status: form.status?.value ?? data.status,
      textbook: form.textbook,
      reference: form.reference,
      pedagogy: form.pedagogy?.value ?? data.pedagogy,
    });
    onClose();
  };

  const seqLabel = data
    ? `Topic ${data.id} — ${data.unitLabel ?? ""}`
    : "";

  return (
    <ModalShell
      title="Edit Lesson Plan Item"
      subtitle={seqLabel}
      icon={
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-color2 text-xs font-bold text-white">
          {String(data?.seq ?? "").padStart(2, "0")}
        </span>
      }
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        {/* Topic */}
        <TextInput
          title="Topic"
          required
          placeholder="e.g. Network Models & Layered Architecture"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />

        {/* Sequence / Level / Hours / Status */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          <TextInput
            title="Sequence"
            type="number"
            required
            placeholder="1"
            value={form.seq}
            onChange={(e) => set("seq", e.target.value)}
          />
          <CustomSelect
            title="Knowledge Level"
            options={LEVEL_OPTS}
            value={form.level}
            onChange={(v) => set("level", v)}
            placeholder="K2"
          />
          <TextInput
            title="Hours"
            type="number"
            required
            placeholder="2"
            value={form.hours}
            onChange={(e) => set("hours", e.target.value)}
          />
          <CustomSelect
            title="Status"
            options={STATUS_OPTS}
            value={form.status}
            onChange={(v) => set("status", v)}
            placeholder="Reviewed"
          />
        </div>

        {/* Textbook */}
        <div className="mt-4">
          <TextInput
            title="Textbook"
            required
            placeholder="e.g. Computer Networks — Chapter 1"
            value={form.textbook}
            onChange={(e) => set("textbook", e.target.value)}
          />
        </div>

        {/* Reference Book */}
        <div className="mt-4">
          <TextInput
            title="Reference Book"
            placeholder="e.g. Data Communications and Networking — Chapter 2"
            value={form.reference}
            onChange={(e) => set("reference", e.target.value)}
          />
        </div>

        {/* Pedagogy */}
        <div className="mt-4">
          <CustomSelect
            title="Pedagogy"
            options={PEDAGOGY_OPTS}
            value={form.pedagogy}
            onChange={(v) => set("pedagogy", v)}
            placeholder="Select pedagogy method"
          />
        </div>

        {/* Footer */}
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
            <Save className="h-3.5 w-3.5" /> Save Changes
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default EditLessonPlanModal;
