import { useEffect } from "react";
import { X, Check, SquarePen } from "lucide-react";

interface ViewQuestionModalProps {
  open: boolean;
  onClose: () => void;
  question: {
    id: string;
    status: "approved" | "reviewed" | "pending";
    aiVersion?: string;
    unit: string;
    topic: string;
    subtopic?: string;
    co?: string;
    level?: string;
    questionType?: string;
    marks?: string | number;
    difficulty?: string;
    question: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    correctAnswer?: string; // "A" | "B" | "C" | "D"
    explanation?: string;
    course?: string;
    approvedBy?: string;
    approvedDate?: string;
  };
  onCreateDraft?: () => void;
}

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

const OptionCell = ({
  letter,
  text,
  isCorrect,
}: {
  letter: string;
  text: string;
  isCorrect: boolean;
}) => (
  <div
    className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
      isCorrect ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
    }`}
  >
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
        isCorrect ? "bg-green-700 text-white" : "bg-gray-100 text-[#000]"
      }`}
    >
      {letter}
    </span>
    <span
      className={`text-sm font-medium ${
        isCorrect ? "text-green-800" : "text-[#000]"
      }`}
    >
      {text}
    </span>
  </div>
);

const ViewQuestionModal = ({
  open,
  onClose,
  question,
  onCreateDraft,
}: ViewQuestionModalProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const options: Record<string, string | undefined> = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="p-6">
          {/* Top bar */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="border-color2 text-color2 rounded-lg border px-3 py-1 text-xs font-bold">
                {question.id}
              </span>
              {question.status === "approved" && (
                <span className="flex items-center gap-1 rounded-lg border border-green-400 bg-white px-3 py-1 text-xs font-semibold text-green-600">
                  <Check className="h-3 w-3" /> Approved
                </span>
              )}
              {question.aiVersion && (
                <span className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-pri">
                  {question.aiVersion}
                </span>
              )}
            </div>
            <button
            onClick={onClose}
            className="text-pri mt-0.5 rounded-full border border-gray-500 p-0.5 hover:text-[#000] dark:hover:text-gray-200"
          >
            <X className="h-3 w-3" />
          </button>
          </div>

          {/* Breadcrumb + Title */}
          <div className="mb-3">
            <p className="text-color2 mb-1 text-xs font-semibold">
              {question.unit}
              {question.topic && (
                <>
                  {" "}
                  › <span>{question.topic}</span>
                </>
              )}
              {question.subtopic && (
                <>
                  {" "}
                  › <span>{question.subtopic}</span>
                </>
              )}
            </p>
            <h2 className="text-base font-bold text-[#000] dark:text-white">
              {question.question.slice(0, 60)}
              {question.question.length > 60 ? "..." : ""}
            </h2>
          </div>

          {/* Meta tags */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {question.co && (
              <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-[#000]">
                Outcome: {question.co}
              </span>
            )}
            {question.level && (
              <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-[#000]">
                Level: {question.level}
              </span>
            )}
            {question.questionType && (
              <span className="border-color2 text-color2 rounded-full border bg-purple-50 px-3 py-1 text-xs font-bold">
                {question.questionType}
              </span>
            )}
            {question.marks && (
              <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-[#000]">
                {question.marks} Marks
              </span>
            )}
            {question.difficulty && (
              <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-[#000]">
                Difficulty: {question.difficulty}
              </span>
            )}
          </div>

          {/* Question Statement */}
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#000]">
            Question Statement
          </p>
          <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm font-semibold text-[#000] dark:bg-gray-800 dark:text-gray-200">
            {question.question}
          </div>

          {/* Answer Options */}
          {(question.optionA ||
            question.optionB ||
            question.optionC ||
            question.optionD) && (
            <>
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#000]">
                Answer Options & Key
              </p>
              <div className="mb-5 grid grid-cols-2 gap-3">
                {OPTION_KEYS.map((key) =>
                  options[key] ? (
                    <OptionCell
                      key={key}
                      letter={key}
                      text={options[key]!}
                      isCorrect={question.correctAnswer === key}
                    />
                  ) : null
                )}
              </div>
            </>
          )}

          {/* Explanation */}
          {question.explanation && (
            <>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#000]">
                Solution & Explanation
              </p>
              <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-[#000] dark:bg-gray-800 dark:text-gray-300">
                {question.explanation}
              </div>
            </>
          )}

          {/* Footer meta */}
          <div className="mb-5 flex items-center justify-between text-xs text-[#000]">
            {question.course && (
              <span>
                Course:{" "}
                <strong className="text-[#000] dark:text-gray-300">
                  {question.course}
                </strong>
              </span>
            )}
            {question.approvedBy && (
              <span>
                Approved by:{" "}
                <strong className="text-[#000] dark:text-gray-300">
                  {question.approvedBy} {question.approvedDate}
                </strong>
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
            {onCreateDraft && (
              <button
                onClick={onCreateDraft}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-[#000] hover:bg-gray-50"
              >
                <SquarePen className="h-4 w-4" /> Create New Draft Version
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-900 px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewQuestionModal;
