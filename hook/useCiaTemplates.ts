import { useState, useEffect, useCallback } from "react";
import Models from "@/imports/models.import";
import { QuestionPaperTemplate, CreateTemplatePayload } from "@/types/cia-test.types";
import { Success, Failure } from "@/utils/function.utils";

export const useCiaTemplates = (courseId: number | string) => {
  const [templates, setTemplates] = useState<QuestionPaperTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const statusParam = statusFilter !== "all" ? statusFilter : undefined;
      const res: any = await Models.cia_test.listCourseTemplates(courseId, statusParam).catch(() => []);
      
      let list: QuestionPaperTemplate[] = [];
      if (Array.isArray(res)) list = res;
      else if (res?.items && Array.isArray(res.items)) list = res.items;
      else if (res?.data && Array.isArray(res.data)) list = res.data;

      setTemplates(list);
    } catch (err: any) {
      console.error("Failed to load question paper templates:", err);
    } finally {
      setLoading(false);
    }
  }, [courseId, statusFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      setActionLoadingId(templateId);
      await Models.cia_test.deleteTemplate(templateId);
      Success("Question paper template deleted successfully");
      await fetchTemplates();
    } catch (err: any) {
      console.error("Failed to delete template:", err);
      if (err?.status === 409 || err?.detail?.includes("assigned") || err?.message?.includes("assigned")) {
        Failure("Cannot delete template: It is currently assigned to one or more CIA tests.");
      } else {
        Failure(err?.detail || err?.message || "Failed to delete template");
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateTemplate = async (payload: CreateTemplatePayload) => {
    try {
      await Models.cia_test.createTemplate(courseId, payload);
      Success(`Template "${payload.template_name}" created successfully!`);
      await fetchTemplates();
      return true;
    } catch (err: any) {
      console.error("Failed to create template:", err);
      Failure(err?.detail || err?.message || "Failed to create template");
      return false;
    }
  };

  const handleUpdateTemplate = async (templateId: number, payload: any) => {
    try {
      setActionLoadingId(templateId);
      await Models.cia_test.updateTemplate(templateId, payload);
      Success("Question paper template updated successfully!");
      await fetchTemplates();
      return true;
    } catch (err: any) {
      console.error("Failed to update template:", err);
      if (
        err?.status === 409 ||
        err?.detail?.includes("assigned") ||
        err?.message?.includes("assigned")
      ) {
        Failure(
          "Cannot edit template: It is currently assigned to a CIA test. Unassign to make edits."
        );
      } else {
        Failure(err?.detail || err?.message || "Failed to update template");
      }
      return false;
    } finally {
      setActionLoadingId(null);
    }
  };

  return {
    templates,
    loading,
    statusFilter,
    setStatusFilter,
    actionLoadingId,
    refresh: fetchTemplates,
    handleDeleteTemplate,
    handleCreateTemplate,
    handleUpdateTemplate,
  };
};

export default useCiaTemplates;
