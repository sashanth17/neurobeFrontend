import { useState, useEffect } from "react";
import Models from "@/imports/models.import";
import { Success, Failure } from "@/utils/function.utils";
import { Check, RefreshCw, Lock } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";
import TextInput from "@/components/FormFields/TextInput.component";
import TextArea from "@/components/FormFields/TextArea.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";

const UNIT_OPTIONS = [
  { value: "u1", label: "Unit 1 — Physical Layer & Network Architectures" },
  { value: "u2", label: "Unit 2 — Data Link Layer & MAC Protocols" },
  { value: "u3", label: "Unit 3 — Network Layer & Routing" },
  { value: "u4", label: "Unit 4 — Transport Layer Protocols" },
  { value: "u5", label: "Unit 5 — Application Layer & Network Security" },
];

const TOPIC_OPTIONS = [
  { value: "t1", label: "3.1 IPv4 Addressing & Subnet Design" },
  { value: "t2", label: "3.2 Routing Algorithms" },
  { value: "t3", label: "3.3 Routing Protocols: RIP, OSPF, BGP" },
];

const SUBTOPIC_OPTIONS = [
  { value: "s1", label: "Variable Length Subnet Masking (VLSM) Design" },
  { value: "s2", label: "CIDR Notation and Address Aggregation" },
];

const CO_OPTIONS = [
  { value: "CO1", label: "CO1" },
  { value: "CO2", label: "CO2" },
  { value: "CO3", label: "CO3" },
  { value: "CO4", label: "CO4" },
  { value: "CO5", label: "CO5" },
  { value: "CO6", label: "CO6" },
];

const KNOWLEDGE_OPTIONS = [
  { value: "K1", label: "K1 (Remember)" },
  { value: "K2", label: "K2 (Understand)" },
  { value: "K3", label: "K3 (Apply)" },
  { value: "K4", label: "K4 (Analyze)" },
  { value: "K5", label: "K5 (Evaluate)" },
  { value: "K6", label: "K6 (Create)" },
];

const QUESTION_TYPE_OPTIONS = [
  { value: "MCQ", label: "MCQ" },
  { value: "Short", label: "Short Answer" },
  { value: "Long", label: "Long Answer" },
  { value: "Fill", label: "Fill in the Blank" },
];

const DIFFICULTY_OPTIONS = [
  { value: "Easy", label: "Easy" },
  { value: "Medium", label: "Medium" },
  { value: "Hard", label: "Hard" },
];

interface EditQuestionModalProps {
  open: boolean;
  onClose: () => void;
  topicLabel?: string;
  code?: string;
  initialData?: any;
  onSave?: (updated: any) => void;
}

export const EditQuestionModal = ({
  open,
  onClose,
  topicLabel = "",
  code,
  initialData,
  onSave,
}: EditQuestionModalProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    id: "",
    unit: UNIT_OPTIONS[2] as any,
    topic: TOPIC_OPTIONS[0] as any,
    subtopic: SUBTOPIC_OPTIONS[0] as any,
    co: CO_OPTIONS[2] as any,
    knowledge: KNOWLEDGE_OPTIONS[0] as any,
    questionType: QUESTION_TYPE_OPTIONS[0] as any,
    marks: "2",
    difficulty: DIFFICULTY_OPTIONS[1] as any,
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: null as any,
    explanation: "",
  });

  const correctAnswerOptions = [
    { value: "A", label: `A. ${form.optionA || "Option A"}` },
    { value: "B", label: `B. ${form.optionB || "Option B"}` },
    { value: "C", label: `C. ${form.optionC || "Option C"}` },
    { value: "D", label: `D. ${form.optionD || "Option D"}` },
  ];

  useEffect(() => {
    if (initialData && open) {
      const corrKey = typeof initialData.correctAnswer === "object"
        ? (initialData.correctAnswer?.value || "A")
        : (initialData.correctAnswer || "A");

      const optA = initialData.optionA ?? "";
      const optB = initialData.optionB ?? "";
      const optC = initialData.optionC ?? "";
      const optD = initialData.optionD ?? "";

      const getLabel = (k: string) => {
        if (k === "A") return `A. ${optA || "Option A"}`;
        if (k === "B") return `B. ${optB || "Option B"}`;
        if (k === "C") return `C. ${optC || "Option C"}`;
        if (k === "D") return `D. ${optD || "Option D"}`;
        return `A. ${optA || "Option A"}`;
      };

      setForm({
        id: initialData.id || "",
        unit: initialData.unit && typeof initialData.unit === "object" ? initialData.unit : { value: initialData.unit || "", label: initialData.unit || "Unit" },
        topic: initialData.topic && typeof initialData.topic === "object" ? initialData.topic : { value: initialData.topic || "", label: initialData.topic || "Topic" },
        subtopic: initialData.subtopic && typeof initialData.subtopic === "object" ? initialData.subtopic : { value: initialData.subtopic || "", label: initialData.subtopic || "Subtopic" },
        co: initialData.co && typeof initialData.co === "object" ? initialData.co : { value: initialData.co || "", label: initialData.co || "CO" },
        knowledge: initialData.knowledge && typeof initialData.knowledge === "object" ? initialData.knowledge : { value: initialData.knowledge || "", label: initialData.knowledge || "Knowledge Level" },
        questionType: initialData.questionType && typeof initialData.questionType === "object" ? initialData.questionType : { value: "MCQ", label: "MCQ" },
        marks: String(initialData.marks ?? "2"),
        difficulty: initialData.difficulty && typeof initialData.difficulty === "object" ? initialData.difficulty : { value: initialData.difficulty || "medium", label: initialData.difficulty || "Medium" },
        question: initialData.question || initialData.text || "",
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctAnswer: { value: corrKey, label: getLabel(corrKey) },
        explanation: initialData.explanation || "",
      });
    }
  }, [open, initialData]);

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  return (
    <ModalShell
      title="Edit Question"
      subtitle={topicLabel}
      icon={false}
      open={open}
      onClose={onClose}
      code={code}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!form.id) {
            Failure("Question ID is missing.");
            return;
          }
          setIsSaving(true);
          try {
            const corrKey = typeof form.correctAnswer === "object"
              ? (form.correctAnswer?.value || "A")
              : (form.correctAnswer || "A");

            const formattedOptions = [
              { text: form.optionA, is_correct: corrKey === "A", key: "A", isCorrect: corrKey === "A" },
              { text: form.optionB, is_correct: corrKey === "B", key: "B", isCorrect: corrKey === "B" },
              { text: form.optionC, is_correct: corrKey === "C", key: "C", isCorrect: corrKey === "C" },
              { text: form.optionD, is_correct: corrKey === "D", key: "D", isCorrect: corrKey === "D" },
            ];

            const payload = {
              text: form.question,
              options: formattedOptions,
              explanation: form.explanation,
            };

            await Models.mcq.update_question(form.id, payload);
            Success("Question updated successfully!");
            if (onSave) {
              onSave({
                id: form.id,
                text: form.question,
                question: form.question,
                options: formattedOptions,
                explanation: form.explanation,
              });
            }
            onClose();
          } catch (err: any) {
            console.error("[EditQuestionModal] Update error:", err);
            Failure(typeof err === "string" ? err : "Failed to update question.");
          } finally {
            setIsSaving(false);
          }
        }}
        className="space-y-4"
      >
        {/* Fixed metadata notice banner */}
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>Course alignment metadata (Unit, Topic, CO, Knowledge Level, Type, Marks, Difficulty) are fixed parameters and cannot be altered.</span>
        </div>

        {/* Unit + Topic (Read Only) */}
        <div className="grid grid-cols-2 gap-4">
          <CustomSelect
            title="Unit"
            disabled={true}
            options={UNIT_OPTIONS}
            value={form.unit}
            onChange={(v) => set("unit", v)}
            isSearchable={false}
            isClearable={false}
          />
          <CustomSelect
            title="Topic"
            disabled={true}
            options={TOPIC_OPTIONS}
            value={form.topic}
            onChange={(v) => set("topic", v)}
            isSearchable={false}
            isClearable={false}
          />
        </div>

        {/* Subtopic (Read Only) */}
        <CustomSelect
          title="Subtopic / Child Topic"
          disabled={true}
          options={SUBTOPIC_OPTIONS}
          value={form.subtopic}
          onChange={(v) => set("subtopic", v)}
          isSearchable={false}
          isClearable={false}
        />

        {/* CO + Knowledge + Type + Marks (Read Only) */}
        <div className="grid grid-cols-4 gap-4">
          <CustomSelect
            title="Course Outcome"
            disabled={true}
            options={CO_OPTIONS}
            value={form.co}
            onChange={(v) => set("co", v)}
            isSearchable={false}
            isClearable={false}
          />
          <CustomSelect
            title="Knowledge Level"
            disabled={true}
            options={KNOWLEDGE_OPTIONS}
            value={form.knowledge}
            onChange={(v) => set("knowledge", v)}
            isSearchable={false}
            isClearable={false}
          />
          <CustomSelect
            title="Question Type"
            disabled={true}
            options={QUESTION_TYPE_OPTIONS}
            value={form.questionType}
            onChange={(v) => set("questionType", v)}
            isSearchable={false}
            isClearable={false}
          />
          <TextInput
            title="Marks"
            disabled={true}
            placeholder="e.g. 2"
            value={form.marks}
            onChange={(e) => set("marks", e.target.value)}
          />
        </div>

        {/* Difficulty (Read Only) */}
        <CustomSelect
          title="Difficulty"
          disabled={true}
          options={DIFFICULTY_OPTIONS}
          value={form.difficulty}
          onChange={(v) => set("difficulty", v)}
          isSearchable={false}
          isClearable={false}
        />

        {/* Question Statement (Editable) */}
        <TextArea
          title="Question Statement"
          rows={4}
          placeholder="Enter the question..."
          value={form.question}
          onChange={(e) => set("question", e.target.value)}
          required
        />

        {/* Answer Options & Correct Key (Editable) */}
        <div className="rounded-xl border border-gray-100 bg-slate-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-200">
            Answer Options & Correct Key
          </p>
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              title="Option A"
              placeholder="Option A"
              value={form.optionA}
              onChange={(e) => set("optionA", e.target.value)}
              required
            />
            <TextInput
              title="Option B"
              placeholder="Option B"
              value={form.optionB}
              onChange={(e) => set("optionB", e.target.value)}
              required
            />
            <TextInput
              title="Option C"
              placeholder="Option C"
              value={form.optionC}
              onChange={(e) => set("optionC", e.target.value)}
              required
            />
            <TextInput
              title="Option D"
              placeholder="Option D"
              value={form.optionD}
              onChange={(e) => set("optionD", e.target.value)}
              required
            />
          </div>

          {/* Correct Answer */}
          <div className="mt-4">
            <CustomSelect
              title="Correct Answer Key"
              options={correctAnswerOptions}
              value={form.correctAnswer}
              onChange={(v) => set("correctAnswer", v)}
              isSearchable={false}
              isClearable={false}
              placeholder="Select correct answer..."
            />
          </div>
        </div>

        {/* Explanation (Editable) */}
        <TextArea
          title="Solution / Explanation"
          rows={3}
          placeholder="Explain the correct answer..."
          value={form.explanation}
          onChange={(e) => set("explanation", e.target.value)}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Check className="h-3.5 w-3.5" /> {isSaving ? "Saving..." : "Save Changes"}
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <p className="mb-3 text-xs text-[#000] dark:text-white/70">
          Select an alternative teaching method from the library:
        </p>
        <div className="space-y-2">
          {options.map((opt: any) => {
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
                  <p
                    className={`text-sm font-semibold ${
                      isSelected ? "text-color2" : "text-[#000] dark:text-white"
                    }`}
                  >
                    {opt.title}
                  </p>
                  {opt.description && (
                    <p className="text-pri mt-0.5 text-xs dark:text-white/60">
                      {opt.description}
                    </p>
                  )}
                </div>
                <span
                  className={`ml-3 mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-color2 bg-color2" : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  )}
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

export default EditQuestionModal;
