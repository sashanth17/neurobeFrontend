import { useState, useEffect } from "react";
import { Check, RefreshCw } from "lucide-react";
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
}

export const EditQuestionModal = ({
  open,
  onClose,
  topicLabel = "",
  code,
  initialData,
}: EditQuestionModalProps) => {
  const [form, setForm] = useState({
    unit: UNIT_OPTIONS[2],
    topic: TOPIC_OPTIONS[0],
    subtopic: SUBTOPIC_OPTIONS[0],
    co: CO_OPTIONS[2],
    knowledge: KNOWLEDGE_OPTIONS[0],
    questionType: QUESTION_TYPE_OPTIONS[0],
    marks: "2",
    difficulty: DIFFICULTY_OPTIONS[1],
    question:
      "What is the default subnet mask for a standard Class B IPv4 network address in traditional classful addressing?",
    optionA: "255.0.0.0 (/8)",
    optionB: "255.255.0.0 (/16)",
    optionC: "255.255.255.0 (/24)",
    optionD: "255.255.255.240 (/28)",
    correctAnswer: null as any,
    explanation:
      "Classful Class B networks allocate 16 bits to the Network prefix and 16 bits to the Host address, giving the default subnet mask 255.255.0.0.",
  });

  const correctAnswerOptions = [
    { value: "A", label: `A. ${form.optionA}` },
    { value: "B", label: `B. ${form.optionB}` },
    { value: "C", label: `C. ${form.optionC}` },
    { value: "D", label: `D. ${form.optionD}` },
  ];

  useEffect(() => {
    if (initialData) setForm((p) => ({ ...p, ...initialData }));
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
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
        className="space-y-4"
      >
        {/* Unit + Topic */}
        <div className="grid grid-cols-2 gap-4">
          <CustomSelect
            title="Unit"
            options={UNIT_OPTIONS}
            value={form.unit}
            onChange={(v) => set("unit", v)}
            isSearchable={false}
            isClearable={false}
          />
          <CustomSelect
            title="Topic"
            options={TOPIC_OPTIONS}
            value={form.topic}
            onChange={(v) => set("topic", v)}
            isSearchable={false}
            isClearable={false}
          />
        </div>

        {/* Subtopic */}
        <CustomSelect
          title="Subtopic / Child Topic"
          options={SUBTOPIC_OPTIONS}
          value={form.subtopic}
          onChange={(v) => set("subtopic", v)}
          isSearchable={false}
          isClearable={false}
        />

        {/* CO + Knowledge + Type + Marks */}
        <div className="grid grid-cols-4 gap-4">
          <CustomSelect
            title="Course Outcome"
            options={CO_OPTIONS}
            value={form.co}
            onChange={(v) => set("co", v)}
            isSearchable={false}
            isClearable={false}
          />
          <CustomSelect
            title="Knowledge Level"
            options={KNOWLEDGE_OPTIONS}
            value={form.knowledge}
            onChange={(v) => set("knowledge", v)}
            isSearchable={false}
            isClearable={false}
          />
          <CustomSelect
            title="Question Type"
            options={QUESTION_TYPE_OPTIONS}
            value={form.questionType}
            onChange={(v) => set("questionType", v)}
            isSearchable={false}
            isClearable={false}
          />
          <TextInput
            title="Marks"
            placeholder="e.g. 2"
            value={form.marks}
            onChange={(e) => set("marks", e.target.value)}
          />
        </div>

        {/* Difficulty */}
        <CustomSelect
          title="Difficulty"
          options={DIFFICULTY_OPTIONS}
          value={form.difficulty}
          onChange={(v) => set("difficulty", v)}
          isSearchable={false}
          isClearable={false}
        />

        {/* Question Statement */}
        <TextArea
          title="Question Statement"
          rows={4}
          placeholder="Enter the question..."
          value={form.question}
          onChange={(e) => set("question", e.target.value)}
        />

        {/* Answer Options */}
        <div>
          <p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-[#000]">
            Answer Options & Correct Key
          </p>
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              title="Option A"
              placeholder="Option A"
              value={form.optionA}
              onChange={(e) => set("optionA", e.target.value)}
            />
            <TextInput
              title="Option B"
              placeholder="Option B"
              value={form.optionB}
              onChange={(e) => set("optionB", e.target.value)}
            />
            <TextInput
              title="Option C"
              placeholder="Option C"
              value={form.optionC}
              onChange={(e) => set("optionC", e.target.value)}
            />
            <TextInput
              title="Option D"
              placeholder="Option D"
              value={form.optionD}
              onChange={(e) => set("optionD", e.target.value)}
            />
          </div>
        </div>

        {/* Correct Answer */}
        <CustomSelect
          title="Correct Answer Key"
          options={correctAnswerOptions}
          value={form.correctAnswer}
          onChange={(v) => set("correctAnswer", v)}
          isSearchable={false}
          isClearable={false}
          placeholder="Select correct answer..."
        />

        {/* Explanation */}
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
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-color2 flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Check className="h-3.5 w-3.5" /> Save Changes
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
