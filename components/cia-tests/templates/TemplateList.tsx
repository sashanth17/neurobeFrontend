import React, { useState } from "react";
import { Plus, Filter, FileCheck, HelpCircle } from "lucide-react";
import { QuestionPaperTemplate, CreateTemplatePayload } from "@/types/cia-test.types";
import TemplateCard from "./TemplateCard";
import CreateTemplateModal from "./CreateTemplateModal";

interface TemplateListProps {
  courseCode: string;
  templates: QuestionPaperTemplate[];
  loading: boolean;
  actionLoadingId: number | null;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onDeleteTemplate: (id: number) => void;
  onCreateTemplate: (payload: CreateTemplatePayload) => Promise<boolean>;
  onUpdateTemplate: (id: number, payload: any) => Promise<boolean>;
}

export const TemplateList: React.FC<TemplateListProps> = ({
  courseCode,
  templates,
  loading,
  actionLoadingId,
  statusFilter,
  onStatusFilterChange,
  onDeleteTemplate,
  onCreateTemplate,
  onUpdateTemplate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuestionPaperTemplate | null>(null);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (template: QuestionPaperTemplate) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (payload: CreateTemplatePayload, editId?: number) => {
    if (editId) {
      return await onUpdateTemplate(editId, payload);
    } else {
      return await onCreateTemplate(payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-purple-600" />
            <span>Course Blueprint Templates</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Configure marks distributions, sections, and question blueprints scoped to {courseCode}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-750 dark:text-gray-200 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="drafted">Drafted</option>
              <option value="build">Build</option>
              <option value="underreview">Under Review</option>
              <option value="verified">Verified</option>
            </select>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Blueprint</span>
          </button>
        </div>
      </div>

      {/* Grid of Templates */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex justify-between mb-4">
                <div className="h-5 w-20 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-4" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 mb-4">
            <FileCheck className="h-8 w-8" />
          </div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
            No Blueprint Templates Found
          </h4>
          <p className="max-w-md text-xs text-gray-500 dark:text-gray-400 mb-6">
            Create a custom question paper template defining sections and question allocations for continuous assessment exams.
          </p>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-500/20 hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Blueprint</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              actionLoading={actionLoadingId === tpl.id}
              onEdit={handleOpenEdit}
              onDelete={onDeleteTemplate}
            />
          ))}
        </div>
      )}

      {/* Creation & Edit Modal */}
      <CreateTemplateModal
        isOpen={isModalOpen}
        courseCode={courseCode}
        initialData={editingTemplate}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default TemplateList;
