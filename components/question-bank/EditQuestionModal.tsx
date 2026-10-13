import { useState, useEffect } from "react";
import Models from "@/imports/models.import";
import { Success, Failure } from "@/utils/function.utils";
import { Check, RefreshCw, Lock, Image as ImageIcon } from "lucide-react";
import { ModalShell } from "@/components/academic-setup/AddModals";
import TextInput from "@/components/FormFields/TextInput.component";
import TextArea from "@/components/FormFields/TextArea.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import CKEditorField from "@/components/FormFields/CKEditorField.component";
import { useCourseOutcomes } from "@/hook/useCourseOutcomes";

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
  courseId?: string | number;
  coOptions?: any[];
}

export const EditQuestionModal = ({
  open,
  onClose,
  topicLabel = "",
  code,
  initialData,
  onSave,
  courseId,
  coOptions: customCoOptions,
}: EditQuestionModalProps) => {
  const { coOptions: fetchedCoOptions } = useCourseOutcomes(courseId);
  const activeCoOptions = customCoOptions || (fetchedCoOptions.length > 0 ? fetchedCoOptions : CO_OPTIONS);
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

  useEffect(() => {
    if (initialData && open) {
      let corrKey = "A";
      if (initialData.correctAnswer) {
        corrKey = typeof initialData.correctAnswer === "object"
          ? (initialData.correctAnswer?.value || "A")
          : String(initialData.correctAnswer);
      } else if (Array.isArray(initialData.options)) {
        const found = initialData.options.find((o: any) => o.isCorrect === true || o.is_correct === true);
        if (found?.key) corrKey = found.key;
      }

      const getOpt = (k: string, idx: number) => {
        if (initialData[`option${k}`] !== undefined) return initialData[`option${k}`];
        if (Array.isArray(initialData.options)) {
          const byKey = initialData.options.find((o: any) => (o.key || "").toUpperCase() === k);
          if (byKey) return byKey.text || byKey.option || "";
          return initialData.options[idx]?.text || initialData.options[idx]?.option || "";
        }
        return "";
      };

      const optA = getOpt("A", 0);
      const optB = getOpt("B", 1);
      const optC = getOpt("C", 2);
      const optD = getOpt("D", 3);

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
        question: initialData.question || initialData.questionText || initialData.text || "",
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        correctAnswer: corrKey,
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
      maxWidth="max-w-3xl"
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
            options={activeCoOptions}
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
        <div>
          <CKEditorField
            title="Question Statement"
            placeholder="Enter the question..."
            value={form.question}
            onChange={(val) => set("question", val)}
            required
            minHeight="140px"
            badgeLabel="CKEditor"
          />
        </div>

        {/* Answer Options & Correct Key (Editable) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Answer Options & Correct Key *
            </span>
            <span className="text-[11px] text-slate-500">
              Click the radio badge next to an option to designate it as the correct answer.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[
              { key: "A" as const, val: form.optionA, setter: "optionA" },
              { key: "B" as const, val: form.optionB, setter: "optionB" },
              { key: "C" as const, val: form.optionC, setter: "optionC" },
              { key: "D" as const, val: form.optionD, setter: "optionD" },
            ].map(({ key, val, setter }) => {
              const currentCorrectKey = typeof form.correctAnswer === "object"
                ? (form.correctAnswer?.value || "A")
                : (form.correctAnswer || "A");
              const isSelected = currentCorrectKey === key;

              return (
                <div
                  key={key}
                  className={`relative rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30 dark:bg-emerald-950/20"
                      : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-[11px] font-bold text-white shadow-2xs dark:bg-slate-100 dark:text-slate-900">
                        {key}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Option {key}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                      {/* Direct Option Image Attachment */}
                      <label
                        className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50/90 px-2 py-0.5 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 hover:text-purple-800 dark:border-purple-800/60 dark:bg-purple-950/40 dark:text-purple-300 transition cursor-pointer active:scale-95 shadow-2xs shrink-0 whitespace-nowrap"
                        title={`Attach image or diagram to Option ${key}`}
                      >
                        <ImageIcon className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                        <span>Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const base64 = reader.result as string;
                              const currentVal = (form as any)[setter] || "";
                              const imgHtml = `<p><img src="${base64}" alt="Option ${key}" /></p>`;
                              set(setter, currentVal ? `${currentVal}${imgHtml}` : imgHtml);
                            };
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => set("correctAnswer", key)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-xs font-bold"
                            : "border border-slate-200 bg-slate-100/90 text-slate-600 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="h-3 w-3 stroke-[2.5]" />
                            <span>Correct</span>
                          </>
                        ) : (
                          <span>Mark Correct</span>
                        )}
                      </button>
                    </div>
                  </div>

                  <CKEditorField
                    placeholder={`Enter text or formula for Option ${key}...`}
                    value={val}
                    onChange={(newVal) => set(setter, newVal)}
                    required
                    minHeight="70px"
                    compactToolbar
                    hideBadge
                    showImageUploadButton={false}
                  />

                  {val && val.includes("<img") && (
                    <div className="mt-2 flex items-center justify-between gap-1 rounded-md border border-purple-200/60 bg-purple-50/60 px-2 py-1 text-[11px] text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/30 dark:text-purple-300">
                      <span className="flex items-center gap-1.5 font-medium truncate">
                        <ImageIcon className="h-3 w-3 shrink-0 text-purple-600 dark:text-purple-400" />
                        <span className="truncate">Image Attached</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const withoutImg = val
                            .replace(/<figure[^>]*>.*?<\/figure>/gis, "")
                            .replace(/<p>\s*<img[^>]*>\s*<\/p>/gis, "")
                            .replace(/<img[^>]*>/gis, "");
                          set(setter, withoutImg);
                        }}
                        className="text-[11px] font-bold text-rose-500 hover:text-rose-700 hover:underline cursor-pointer shrink-0 whitespace-nowrap ml-1.5"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
