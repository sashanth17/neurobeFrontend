import React from "react";
import { CreateCIATestPayload } from "@/types/cia-test.types";
import { FileCheck, FileText, Link as LinkIcon } from "lucide-react";

interface PaperLinkSectionProps {
  formData: CreateCIATestPayload;
  templates: { id: number; name: string }[];
  questionPapers: { id: number; name: string }[];
  onChange: (field: keyof CreateCIATestPayload, val: any) => void;
}

export const PaperLinkSection: React.FC<PaperLinkSectionProps> = ({
  formData,
  templates,
  questionPapers,
  onChange,
}) => {
  return (
    <div className="space-y-4 pt-3 border-t border-gray-100 dark:border-gray-700">
      <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
        4. Question Paper & Blueprint Configuration (Optional)
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Template Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            Extraction / Blueprint Template
          </label>
          <select
            value={formData.question_paper_template_id || ""}
            onChange={(e) =>
              onChange(
                "question_paper_template_id",
                e.target.value ? Number(e.target.value) : null
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">-- No Template Assigned --</option>
            {templates.map((tpl) => (
              <option key={tpl.id} value={tpl.id}>
                {tpl.name}
              </option>
            ))}
          </select>
        </div>

        {/* Question Paper Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            Structured Question Paper
          </label>
          <select
            value={formData.question_paper_id || ""}
            onChange={(e) =>
              onChange(
                "question_paper_id",
                e.target.value ? Number(e.target.value) : null
              )
            }
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            <option value="">-- Attach Later / Generate in QB --</option>
            {questionPapers.map((qp) => (
              <option key={qp.id} value={qp.id}>
                {qp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Physical File / MinIO Storage URL */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
            <LinkIcon className="h-3.5 w-3.5 text-gray-400" />
            Physical Question Paper PDF Storage URL (MinIO/S3)
          </label>
          <input
            type="text"
            value={formData.question_paper_file_url || ""}
            onChange={(e) => onChange("question_paper_file_url", e.target.value)}
            placeholder="e.g. s3://neurobe-bucket/cia/cs301_cia1_qp.pdf"
            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs font-mono text-gray-800 transition-colors focus:border-purple-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          />
        </div>
      </div>
    </div>
  );
};

export default PaperLinkSection;
