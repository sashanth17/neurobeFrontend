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
import instance from "@/utils/axios.utils";
import { getOrganizationId } from "@/utils/function.utils";
import ciaAssessmentService from "@/services/ciaAssessment.service";

interface ExamPaperPreviewModalProps {
  isOpen: boolean;
  previewData: ExamPaperPreviewData | null;
  template: QuestionPaperTemplate | null;
  courseCode: string;
  courseTitle: string;
  loading: boolean;
  organizationName?: string;
  testName?: string;
  onClose: () => void;
}

export const ExamPaperPreviewModal: React.FC<ExamPaperPreviewModalProps> = ({
  isOpen,
  previewData,
  template,
  courseCode,
  courseTitle,
  loading,
  organizationName,
  testName,
  onClose,
}) => {
  if (!isOpen) return null;

  const [printImageSize, setPrintImageSize] = React.useState<"compact" | "standard" | "large">("standard");
  const paperRef = React.useRef<HTMLDivElement | null>(null);
  const sections = previewData?.sections || [];

  // Resolve Organization Name dynamically
  const [orgName, setOrgName] = React.useState<string>(organizationName || "");

  React.useEffect(() => {
    if (organizationName) {
      setOrgName(organizationName);
      return;
    }
    if ((previewData as any)?.organization_name) {
      setOrgName((previewData as any).organization_name);
      return;
    }
    if (
      previewData?.institution_name &&
      previewData.institution_name !== "AUTONOMOUS INSTITUTION — AFFILIATED TO UNIVERSITY"
    ) {
      setOrgName(previewData.institution_name);
      return;
    }
    // Fallback to localStorage user
    try {
      const uStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (uStr) {
        const u = JSON.parse(uStr);
        const name =
          u?.organization_name ||
          u?.organization?.organization_name ||
          u?.organization?.name ||
          u?.institution_name;
        if (name) {
          setOrgName(name);
          return;
        }
      }
    } catch { }

    // Fallback to Organization API
    const orgId = getOrganizationId();
    if (orgId) {
      instance()
        .get(`organizations/${orgId}`)
        .then((res) => {
          const name = res.data?.organization_name || res.data?.name;
          if (name) setOrgName(name);
        })
        .catch(() => { });
    }
  }, [organizationName, previewData, isOpen]);

  // Resolve Test Name dynamically
  const [resolvedTestName, setResolvedTestName] = React.useState<string>(testName || "");

  React.useEffect(() => {
    if (testName) {
      setResolvedTestName(testName);
      return;
    }
    if ((previewData as any)?.test_name) {
      setResolvedTestName((previewData as any).test_name);
      return;
    }
    if (template?.id) {
      ciaAssessmentService
        .getTemplateAssignedCiaTests(template.id)
        .then((tests: any) => {
          if (Array.isArray(tests) && tests.length > 0 && tests[0]?.test_name) {
            setResolvedTestName(tests[0].test_name);
          } else if (template?.template_name) {
            setResolvedTestName(template.template_name);
          }
        })
        .catch(() => {
          if (template?.template_name) {
            setResolvedTestName(template.template_name);
          }
        });
    } else if (template?.template_name) {
      setResolvedTestName(template.template_name);
    }
  }, [testName, template, previewData, isOpen]);

  const displayOrgName =
    orgName ||
    (previewData as any)?.organization_name ||
    (previewData?.institution_name &&
      previewData.institution_name !== "AUTONOMOUS INSTITUTION — AFFILIATED TO UNIVERSITY"
      ? previewData.institution_name
      : "") ||
    "INSTITUTION / ORGANIZATION";

  const displayTestName =
    resolvedTestName ||
    (previewData as any)?.test_name ||
    template?.template_name ||
    previewData?.template_name ||
    "CONTINUOUS INTERNAL ASSESSMENT";

  const handlePrint = React.useCallback(() => {
    const paperElement = document.getElementById("printable-question-paper");
    if (!paperElement) {
      window.print();
      return;
    }

    let printIframe = document.getElementById("exam-paper-print-frame") as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement("iframe");
      printIframe.id = "exam-paper-print-frame";
      printIframe.setAttribute(
        "style",
        "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none;"
      );
      document.body.appendChild(printIframe);
    }

    const iframeDoc = printIframe.contentWindow?.document;
    if (!iframeDoc) {
      window.print();
      return;
    }

    // Extract all stylesheets and style blocks from current page
    const headStyles = Array.from(document.querySelectorAll("link[rel='stylesheet'], style"))
      .map((node) => node.outerHTML)
      .join("\n");

    const paperHtml = paperElement.outerHTML;

    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <base href="${window.location.origin}/" />
  <title>${displayOrgName} — ${displayTestName} — ${courseCode}</title>
  ${headStyles}
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      background: #ffffff !important;
      color: #000000 !important;
      margin: 0 !important;
      padding: 0 !important;
      font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      width: 100% !important;
      min-height: 0 !important;
      overflow: visible !important;
    }
    body * {
      visibility: visible !important;
    }
    #printable-question-paper,
    .printable-exam-paper {
      position: static !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background: #ffffff !important;
      visibility: visible !important;
      display: block !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
    thead {
      display: table-header-group !important;
    }
    tr, figure, .print-avoid-break {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    img {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  </style>
</head>
<body class="printable-exam-paper exam-img-${printImageSize}">
  ${paperHtml}
</body>
</html>`);
    iframeDoc.close();

    const triggerPrint = () => {
      try {
        printIframe?.contentWindow?.focus();
        printIframe?.contentWindow?.print();
      } catch (err) {
        console.error("Print iframe error, falling back to window.print", err);
        window.print();
      }
    };

    const iframeImages = Array.from(iframeDoc.images);
    if (iframeImages.length === 0) {
      setTimeout(triggerPrint, 250);
    } else {
      let loadedCount = 0;
      const onDone = () => {
        loadedCount++;
        if (loadedCount >= iframeImages.length) {
          setTimeout(triggerPrint, 150);
        }
      };

      iframeImages.forEach((img) => {
        if (img.complete) {
          onDone();
        } else {
          img.onload = onDone;
          img.onerror = onDone;
        }
      });

      // Safety timeout
      setTimeout(triggerPrint, 800);
    }
  }, [courseCode, courseTitle, printImageSize, displayOrgName, displayTestName]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handlePrint]);

  React.useEffect(() => {
    return () => {
      const existingIframe = document.getElementById("exam-paper-print-frame");
      if (existingIframe) {
        existingIframe.remove();
      }
    };
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;

    const applySize = () => {
      if (!paperRef.current) return;
      const maxH = printImageSize === "compact" ? 100 : printImageSize === "standard" ? 140 : 190;
      const maxW = printImageSize === "compact" ? 160 : printImageSize === "standard" ? 220 : 280;

      const images = paperRef.current.querySelectorAll<HTMLImageElement>("img");
      images.forEach((img) => {
        img.style.setProperty("max-height", `${maxH}px`, "important");
        img.style.setProperty("max-width", `${maxW}px`, "important");
        img.style.setProperty("width", "auto", "important");
        img.style.setProperty("height", "auto", "important");
        img.style.setProperty("object-fit", "contain", "important");
        img.style.setProperty("display", "block", "important");
      });

      const figures = paperRef.current.querySelectorAll<HTMLElement>("figure, .image");
      figures.forEach((fig) => {
        fig.style.setProperty("max-height", `${maxH}px`, "important");
        fig.style.setProperty("max-width", `${maxW}px`, "important");
        fig.style.setProperty("width", "auto", "important");
        fig.style.setProperty("display", "block", "important");
      });
    };

    applySize();
    const t1 = setTimeout(applySize, 50);
    const t2 = setTimeout(applySize, 200);
    const t3 = setTimeout(applySize, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [printImageSize, previewData, loading, isOpen]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:p-0 print:bg-white print:static print:block print:overflow-visible print:h-auto">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl dark:bg-gray-900 print:max-h-none print:w-full print:shadow-none print:rounded-none print:block print:overflow-visible print:h-auto print:border-none print:p-0 print:static">
        {/* Modal Top Bar (Hidden during printing) */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 p-4 dark:border-gray-800 print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Live University Exam Paper Preview
            </h2>
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-extrabold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              {template?.total_maximum_marks || previewData?.total_maximum_marks || 50} Marks
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Diagram Print Size Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800 text-xs">
              <ImageIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 ml-1.5" />
              <span className="text-[11px] font-semibold text-gray-500 mr-1 hidden sm:inline">Diagram Size:</span>
              <button
                type="button"
                onClick={() => setPrintImageSize("compact")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${printImageSize === "compact"
                    ? "bg-white text-purple-700 shadow-xs dark:bg-gray-700 dark:text-purple-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
                title="Compact diagrams (100px) - ideal for saving paper"
              >
                Compact (100px)
              </button>
              <button
                type="button"
                onClick={() => setPrintImageSize("standard")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${printImageSize === "standard"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
                title="Standard exam diagram size (140px) - Recommended"
              >
                Standard (140px) ★
              </button>
              <button
                type="button"
                onClick={() => setPrintImageSize("large")}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${printImageSize === "large"
                    ? "bg-white text-purple-700 shadow-xs dark:bg-gray-700 dark:text-purple-300"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                  }`}
                title="Large diagram size (190px)"
              >
                Large (190px)
              </button>
            </div>

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
        <div className="overflow-y-auto p-8 print:p-0 print:overflow-visible print:h-auto print:max-h-none text-gray-900 dark:text-gray-100 font-serif">
          {loading ? (
            <div className="py-20 text-center text-xs text-gray-400">
              Generating university exam paper blueprint preview...
            </div>
          ) : (
            <div
              id="printable-question-paper"
              ref={paperRef}
              className={`mx-auto max-w-3xl border border-gray-300 bg-white p-8 text-black shadow-sm print:border-none print:p-0 print:shadow-none font-serif printable-exam-paper exam-img-${printImageSize}`}
              style={{
                ["--exam-diagram-max-height" as any]: `${printImageSize === "compact" ? 100 : printImageSize === "standard" ? 140 : 190}px`,
                ["--exam-diagram-max-width" as any]: `${printImageSize === "compact" ? 160 : printImageSize === "standard" ? 220 : 280}px`,
              }}
            >
              {/* College / Institution Exam Header */}
              <div className="border-b-2 border-black pb-4 text-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  {displayOrgName}
                </h3>
                <h2 className="mt-1 text-base font-black uppercase tracking-wide">
                  {displayTestName}
                </h2>
                {/* <div className="mt-1 text-xs font-semibold text-gray-600">
                  Academic Year: {previewData?.academic_year || "2026-2027"} • Regulation: {previewData?.regulation || "2022"}
                </div> */}
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
                                const subStructure = q.sub_question_structure || qData?.sub_question_structure;
                                const co = q.target_co || subStructure?.target_co || qData?.co_level || qData?.course_outcome || "-";
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
                                      {subStructure ? (
                                        subStructure.type === "either_or" ? (
                                          <div className="space-y-2">
                                            {/* Option A Sub-parts */}
                                            <div className="space-y-1.5">
                                              {(subStructure.option_a?.sub_questions || []).map((sub: any, sIdx: number) => {
                                                const qText = sub.assigned_question?.question_text || sub.assigned_question_text;
                                                return (
                                                  <div key={sIdx} className="flex items-start justify-between text-xs">
                                                    <span>
                                                      <strong>({sub.label || `a.${sIdx + 1}`})</strong>{" "}
                                                      {qText ? (
                                                        <FormattedMathText text={qText} />
                                                      ) : (
                                                        <span className="italic text-gray-400">[Option A sub-part unassigned]</span>
                                                      )}
                                                    </span>
                                                    <span className="font-semibold text-gray-700 ml-2">
                                                      [{sub.marks}]
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>

                                            {/* Real-World Centered OR */}
                                            <div className="text-center font-bold text-[11px] tracking-widest text-gray-800 my-1">
                                              (OR)
                                            </div>

                                            {/* Option B Sub-parts */}
                                            <div className="space-y-1.5">
                                              {(subStructure.option_b?.sub_questions || []).map((sub: any, sIdx: number) => {
                                                const qText = sub.assigned_question?.question_text || sub.assigned_question_text;
                                                return (
                                                  <div key={sIdx} className="flex items-start justify-between text-xs">
                                                    <span>
                                                      <strong>({sub.label || `b.${sIdx + 1}`})</strong>{" "}
                                                      {qText ? (
                                                        <FormattedMathText text={qText} />
                                                      ) : (
                                                        <span className="italic text-gray-400">[Option B sub-part unassigned]</span>
                                                      )}
                                                    </span>
                                                    <span className="font-semibold text-gray-700 ml-2">
                                                      [{sub.marks}]
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        ) : (
                                          /* Direct Sub-parts */
                                          <div className="space-y-1.5">
                                            {(subStructure.sub_questions || []).map((sub: any, sIdx: number) => {
                                              const qText = sub.assigned_question?.question_text || sub.assigned_question_text;
                                              return (
                                                <div key={sIdx} className="flex items-start justify-between text-xs">
                                                  <span>
                                                    <strong>({sub.label || String.fromCharCode(97 + sIdx)})</strong>{" "}
                                                    {qText ? (
                                                      <FormattedMathText text={qText} />
                                                    ) : (
                                                      <span className="italic text-gray-400">[Sub-part unassigned]</span>
                                                    )}
                                                  </span>
                                                  <span className="font-semibold text-gray-700 ml-2">
                                                    [{sub.marks}]
                                                  </span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )
                                      ) : isAssigned && qData?.question_text ? (
                                        <div>
                                          <FormattedMathText
                                            text={qData.question_text}
                                            className="leading-relaxed whitespace-pre-wrap block"
                                          />

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
