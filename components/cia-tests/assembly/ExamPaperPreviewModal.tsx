import React from "react";
import {
  X,
  Printer,
  Download,
  Award,
  FileCheck,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { ExamPaperPreviewData, QuestionPaperTemplate } from "@/types/cia-test.types";
import FormattedMathText from "@/components/common-components/FormattedMathText";
import QuestionDiagramPreview from "./QuestionDiagramPreview";

interface ExamPaperPreviewModalProps {
  isOpen: boolean;
  previewData: ExamPaperPreviewData | null;
  template: QuestionPaperTemplate | null;
  courseCode: string;
  courseTitle: string;
  loading: boolean;
  onClose: () => void;
}

export const ExamPaperPreviewModal: React.FC<ExamPaperPreviewModalProps> = ({
  isOpen,
  previewData,
  template,
  courseCode,
  courseTitle,
  loading,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const sections = previewData?.sections || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 print:max-h-none print:w-full print:shadow-none print:rounded-none">
        {/* Modal Top Bar (Hidden during printing) */}
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Live University Exam Paper Preview
            </h2>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-extrabold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {template?.total_maximum_marks || previewData?.total_maximum_marks || 50} Marks
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-purple-700 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print Paper</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document Container */}
        <div className="overflow-y-auto p-8 print:p-0 text-gray-900 dark:text-gray-100 font-serif">
          {loading ? (
            <div className="py-20 text-center text-xs text-gray-400">
              Generating university exam paper blueprint preview...
            </div>
          ) : (
            <div className="mx-auto max-w-3xl border border-gray-300 bg-white p-8 text-black shadow-sm print:border-none print:p-0 print:shadow-none font-serif">
              {/* College / Institution Exam Header */}
              <div className="border-b-2 border-black pb-4 text-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {previewData?.institution_name || "AUTONOMOUS INSTITUTION — AFFILIATED TO UNIVERSITY"}
                </h3>
                <h2 className="mt-1 text-base font-black uppercase tracking-wide">
                  CONTINUOUS INTERNAL ASSESSMENT EXAMINATION
                </h2>
                <div className="mt-1 text-xs font-semibold text-gray-600">
                  Academic Year: {previewData?.academic_year || "2026-2027"} • Regulation: 2022
                </div>
              </div>

              {/* Course & Exam Metadata Grid */}
              <div className="grid grid-cols-2 gap-y-1.5 border-b border-black py-3 text-xs">
                <div>
                  <strong>Course Code & Name: </strong>
                  <span>
                    {courseCode} — {courseTitle}
                  </span>
                </div>
                <div className="text-right">
                  <strong>Max. Marks: </strong>
                  <span>
                    {template?.total_maximum_marks || previewData?.total_maximum_marks || 50}
                  </span>
                </div>
                <div>
                  <strong>Branch & Semester: </strong>
                  <span>
                    {previewData?.branch || "B.E. Computer Science and Engineering"} • Sem {previewData?.semester || 5}
                  </span>
                </div>
                <div className="text-right">
                  <strong>Duration: </strong>
                  <span>{previewData?.duration_minutes || 90} Minutes</span>
                </div>
              </div>

              {/* General Instructions */}
              <div className="py-2.5 text-[11px] italic text-gray-700 border-b border-gray-300">
                <strong>General Instructions: </strong>
                <span>
                  Answer all questions in Part A. Part B questions carry either/or choice. Neatly drawn circuit diagrams and algorithms carry marks.
                </span>
              </div>

              {/* Exam Sections */}
              {sections.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 italic">
                  No questions assigned to this blueprint yet. Map candidate pool questions to slots to view full paper.
                </div>
              ) : (
                <div className="mt-4 space-y-6">
                  {sections.map((sec: any, secIdx: number) => {
                    const questions: any[] = sec?.questions || sec?.slots || sec?.slot_questions || [];

                    return (
                      <div key={sec.id || secIdx} className="space-y-3">
                        {/* Section Title Banner */}
                        <div className="text-center font-sans">
                          <span className="font-black uppercase tracking-wider text-xs underline">
                            {sec.section_name}: {sec.section_title}
                          </span>
                          <div className="text-[11px] font-semibold text-gray-600">
                            (Total Marks: {sec.allocated_marks})
                          </div>
                        </div>

                        {/* Questions List */}
                        <table className="w-full border-collapse text-xs font-serif">
                          <thead>
                            <tr className="border-b border-black font-sans text-[11px]">
                              <th className="py-1 text-left w-10">Q.No</th>
                              <th className="py-1 text-left">Question Statement</th>
                              <th className="py-1 text-center w-12">CO</th>
                              <th className="py-1 text-center w-12">RBT</th>
                              <th className="py-1 text-right w-14">Marks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {questions.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-4 text-center text-xs italic text-gray-400">
                                  No questions assigned in this section yet.
                                </td>
                              </tr>
                            ) : (
                              questions.map((q: any, qIdx: number) => {
                                const qData = q.question || (q.question_text ? q : null);
                                const isAssigned = Boolean(q.is_assigned || qData || q.actual_question_id);
                                const qNumber = q.question_number ?? qIdx + 1;
                                const slotKey = q.slot_id ?? q.id ?? `${secIdx}-${qIdx}`;
                                const slotMarks = q.allocated_marks ?? qData?.max_marks ?? "-";
                                const co = qData?.co_level || qData?.course_outcome || "-";
                                const rbt = qData?.knowledge_level || qData?.bloom_level || "-";

                                const subQuestions = qData?.sub_questions || [];
                                const eitherOr =
                                  qData?.either_or_content ||
                                  (qData?.option_a && qData?.option_b
                                    ? { option_a: qData.option_a, option_b: qData.option_b }
                                    : null);

                                return (
                                  <tr key={slotKey} className="align-top">
                                    <td className="py-2.5 font-bold">{qNumber}.</td>

                                    <td className="py-2.5 pr-3">
                                      {isAssigned && qData?.question_text ? (
                                        <div>
                                          <FormattedMathText
                                            text={qData.question_text}
                                            className="leading-relaxed whitespace-pre-wrap block"
                                          />

                                          {/* Vector or MinIO Diagram inline rendering */}
                                          {(qData.diagram_url || qData.diagram_spec) && (
                                            <QuestionDiagramPreview
                                              diagramUrl={qData.diagram_url}
                                              diagramSpec={qData.diagram_spec}
                                              questionNumber={qNumber}
                                              className="my-2"
                                            />
                                          )}

                                          {/* Sub questions */}
                                          {subQuestions.length > 0 && (
                                            <div className="mt-2 space-y-1.5 pl-3">
                                              {subQuestions.map((sub: any, sIdx: number) => (
                                                <div
                                                  key={sIdx}
                                                  className="flex items-start justify-between text-xs"
                                                >
                                                  <span>
                                                    <strong>({sub.sub_label || String.fromCharCode(97 + sIdx)})</strong>{" "}
                                                    <FormattedMathText text={sub.text || sub.sub_text} />
                                                  </span>
                                                  <span className="font-semibold text-gray-700 ml-2">
                                                    [{sub.marks}]
                                                  </span>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* Choice / Either-Or */}
                                          {eitherOr && eitherOr.option_a && eitherOr.option_b && (
                                            <div className="mt-2 space-y-2 border-l-2 border-purple-200 pl-3">
                                              <div>
                                                <strong>(a)</strong>{" "}
                                                <FormattedMathText text={eitherOr.option_a.text} />{" "}
                                                <span className="font-semibold">[{eitherOr.option_a.marks || slotMarks}]</span>
                                              </div>
                                              <div className="text-center font-bold text-[11px] tracking-widest text-gray-500">
                                                (OR)
                                              </div>
                                              <div>
                                                <strong>(b)</strong>{" "}
                                                <FormattedMathText text={eitherOr.option_b.text} />{" "}
                                                <span className="font-semibold">[{eitherOr.option_b.marks || slotMarks}]</span>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="italic text-gray-400">
                                          [Unassigned Slot — Allocate question from candidate pool]
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-2.5 text-center font-sans font-bold text-gray-700">
                                      {co}
                                    </td>
                                    <td className="py-2.5 text-center font-sans font-bold text-gray-700">
                                      {rbt}
                                    </td>
                                    <td className="py-2.5 text-right font-sans font-bold">
                                      {slotMarks}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* End of Question Paper Signoff */}
              <div className="mt-8 border-t border-gray-300 pt-3 text-center text-xs font-semibold text-gray-500">
                — END OF EXAMINATION QUESTION PAPER —
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamPaperPreviewModal;
