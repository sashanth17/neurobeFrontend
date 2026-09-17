import { useState, useEffect } from "react";
import { Check, Edit2, Plus, Sparkles, Trash2 } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";
import TextArea from "@/components/FormFields/TextArea.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import TextInput from "@/components/FormFields/TextInput.component";

const TOPIC_OPTIONS = [
  { value: "network-models", label: "Network Models & Layered Architecture" },
  { value: "physical-layer", label: "Physical Layer & Transmission Media" },
  { value: "network-topologies", label: "Network Topologies & Switching Techniques" },
  { value: "performance-metrics", label: "Network Performance Metrics" },
  { value: "error-detection", label: "Framing & Error Detection" },
  { value: "flow-control", label: "Flow Control Protocols" },
];

const CO_OPTIONS = [
  { value: "CO1", label: "CO1" },
  { value: "CO2", label: "CO2" },
  { value: "CO3", label: "CO3" },
  { value: "CO4", label: "CO4" },
  { value: "CO5", label: "CO5" },
];

const KNOWLEDGE_OPTIONS = [
  { value: "K1", label: "K1" },
  { value: "K2", label: "K2" },
  { value: "K3", label: "K3" },
  { value: "K4", label: "K4" },
  { value: "K5", label: "K5" },
  { value: "K6", label: "K6" },
];

const MARKS_OPTIONS = [
  { value: "2", label: "2" },
  { value: "5", label: "5" },
  { value: "8", label: "8" },
  { value: "10", label: "10" },
  { value: "16", label: "16" },
];

// ─── Add Question Modal ───────────────────────────────────────────────────────
interface AddQuestionModalProps {
  open: boolean;
  onClose: () => void;
  sectionTitle?: string;
  questionNumber?: number;
}

export const AddQuestionModal = ({
  open,
  onClose,
  sectionTitle = "Section A",
  questionNumber = 1,
}: AddQuestionModalProps) => {
  const [form, setForm] = useState({
    questionText: "",
    topic: null as any,
    co: null as any,
    knowledgeLevel: { value: "K2", label: "K2" },
    marks: { value: "5", label: "5" },
  });

  useEffect(() => {
    if (open) setForm({ questionText: "", topic: null, co: null, knowledgeLevel: { value: "K2", label: "K2" }, marks: { value: "5", label: "5" } });
  }, [open]);

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <ModalShell
      title={`Add Question — ${sectionTitle}`}
      subtitle={`Q${questionNumber}`}
      icon={<Plus className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      <form onSubmit={(e) => { e.preventDefault(); onClose(); }}>
        <TextArea
          title="Question Text"
          required
          rows={4}
          placeholder="Enter question statement (e.g., Explain the role of the Network Layer...)"
          value={form.questionText}
          onChange={(e) => set("questionText", e.target.value)}
        />

        <div className="mt-4">
          <CustomSelect
            title="Topic"
            required
            options={TOPIC_OPTIONS}
            value={form.topic}
            onChange={(v) => set("topic", v)}
            placeholder="Network Models & Layered Architecture"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <CustomSelect
            title="CO"
            required
            options={CO_OPTIONS}
            value={form.co}
            onChange={(v) => set("co", v)}
            placeholder="CO2"
          />
          <CustomSelect
            title="Knowledge Level"
            required
            options={KNOWLEDGE_OPTIONS}
            value={form.knowledgeLevel}
            onChange={(v) => set("knowledgeLevel", v)}
            placeholder="K2"
          />
          <CustomSelect
            title="Marks"
            required
            options={MARKS_OPTIONS}
            value={form.marks}
            onChange={(v) => set("marks", v)}
            placeholder="5"
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
            <Plus className="h-3.5 w-3.5" /> Add Question
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ─── Generate Questions Modal ─────────────────────────────────────────────────
interface GeneratedQuestion {
  id: string;
  text: string;
  co: string;
  kl: string;
  marks: number;
  topic: string;
  selected: boolean;
}

interface GenerateQuestionsModalProps {
  open: boolean;
  onClose: () => void;
  sectionTitle?: string;
  sectionType?: string;
  targetMarks?: number;
  onAddQuestions?: (questions: GeneratedQuestion[]) => void;
}

export const GenerateQuestionsModal = ({
  open,
  onClose,
  sectionTitle = "Section A",
  sectionType = "Short Answer Questions",
  targetMarks = 20,
  onAddQuestions,
}: GenerateQuestionsModalProps) => {
  const [step, setStep] = useState<"config" | "review">("config");
  const [form, setForm] = useState({
    topic: null as any,
    co: null as any,
    knowledgeLevel: { value: "K2", label: "K2" },
    marksPerQuestion: { value: "5", label: "5" },
    numberOfQuestions: "4",
  });
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);

  useEffect(() => {
    if (open) {
      setStep("config");
      setForm({ topic: null, co: null, knowledgeLevel: { value: "K2", label: "K2" }, marksPerQuestion: { value: "5", label: "5" }, numberOfQuestions: "4" });
    }
  }, [open]);

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const calculatedMarks =
    (parseFloat(form.marksPerQuestion?.value ?? "0") || 0) *
    (parseInt(form.numberOfQuestions) || 0);

  const handleGenerate = () => {
    const count = parseInt(form.numberOfQuestions) || 4;
    const marks = parseFloat(form.marksPerQuestion?.value ?? "5") || 5;
    const co = form.co?.value ?? "CO2";
    const kl = form.knowledgeLevel?.value ?? "K2";
    const topicLabel = form.topic?.label ?? "Network Models & Layered Architecture";
    const SAMPLE_TEXTS = [
      "Explain the operational workflow of Network Models & Layered Architecture with emphasis on protocol efficiency and design trade-offs.",
      "Describe the operational workflow of Network Models & Layered Architecture with emphasis on protocol efficiency and design trade-offs.",
      "Analyse the operational workflow of Network Models & Layered Architecture with emphasis on protocol efficiency and design trade-offs.",
      "Evaluate the operational workflow of Network Models & Layered Architecture with emphasis on protocol efficiency and design trade-offs.",
    ];
    const questions: GeneratedQuestion[] = Array.from({ length: count }, (_, i) => ({
      id: `gen-${i + 1}`,
      text: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length],
      co,
      kl,
      marks,
      topic: topicLabel,
      selected: true,
    }));
    setGeneratedQuestions(questions);
    setStep("review");
  };

  const toggleSelect = (id: string) =>
    setGeneratedQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, selected: !q.selected } : q))
    );

  const selectedCount = generatedQuestions.filter((q) => q.selected).length;

  return (
    <ModalShell
      title={`Generate Questions — ${sectionTitle}`}
      subtitle={
        step === "config"
          ? `${sectionType} • Target: ${targetMarks} Marks`
          : `Review Generated Questions — ${generatedQuestions.length} questions pending to add to Section`
      }
      icon={<Sparkles className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      {step === "config" ? (
        <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
          <div className="mb-4 rounded-lg bg-color2-l px-4 py-3 text-xs font-semibold text-color2">
            Configure descriptive question criteria for {sectionTitle}. AI will formulate academic syllabus-aligned questions that you can review and edit before adding.
          </div>

          <CustomSelect
            title="Topic"
            required
            options={TOPIC_OPTIONS}
            value={form.topic}
            onChange={(v) => set("topic", v)}
            placeholder="Network Models & Layered Architecture"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <CustomSelect
              title="CO"
              required
              options={CO_OPTIONS}
              value={form.co}
              onChange={(v) => set("co", v)}
              placeholder="CO2"
            />
            <CustomSelect
              title="Knowledge Level"
              required
              options={KNOWLEDGE_OPTIONS}
              value={form.knowledgeLevel}
              onChange={(v) => set("knowledgeLevel", v)}
              placeholder="K2"
            />
            <CustomSelect
              title="Marks per Question"
              required
              options={MARKS_OPTIONS}
              value={form.marksPerQuestion}
              onChange={(v) => set("marksPerQuestion", v)}
              placeholder="5"
            />
            <TextInput
              title="Number of Questions"
              type="number"
              required
              placeholder="4"
              value={form.numberOfQuestions}
              onChange={(e) => set("numberOfQuestions", e.target.value)}
            />
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
            <span className="text-xs text-pri">Calculated batch marks:</span>
            <span className="text-sm font-bold text-[#000] dark:text-white">{calculatedMarks} Marks</span>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90">
              <Sparkles className="h-3.5 w-3.5" /> Generate Questions
            </button>
          </div>
        </form>
      ) : (
        <div>
          {/* Adjust Parameters link */}
          <div className="mb-3 flex justify-end">
            <button type="button" onClick={() => setStep("config")} className="text-xs font-semibold text-color2 hover:underline">
              ← Adjust Parameters
            </button>
          </div>

          {/* Question list */}
          <div className="space-y-2">
            {generatedQuestions.map((q, idx) => (
              <div
                key={q.id}
                className={`rounded-xl border px-4 py-3 ${
                  q.selected ? "border-color2 bg-color2-l" : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelect(q.id)}
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                        q.selected ? "border-color2 bg-color2" : "border-gray-300"
                      }`}
                    >
                      {q.selected && <Check className="h-2.5 w-2.5 text-white" />}
                    </button>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-color2 mb-0.5">Item {idx + 1}</p>
                      <p className="text-xs text-[#000] dark:text-white leading-relaxed">{q.text}</p>
                      <p className="mt-1 text-[10px] text-pri">From: {q.topic}</p>
                    </div>
                  </div>
                  {/* Badges + actions */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded bg-color2-l px-1.5 py-0.5 text-[10px] font-bold text-color2">{q.co}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-pri dark:bg-gray-700">{q.kl}</span>
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-bold text-pri dark:bg-gray-700">{q.marks} Marks</span>
                    <button type="button" className="rounded p-1 text-pri hover:text-color2">
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button type="button" className="rounded p-1 text-pri hover:text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const selected = generatedQuestions.filter((q) => q.selected);
                onAddQuestions?.(selected);
              }}
              className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Add {selectedCount} Selected to {sectionTitle}
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
};
