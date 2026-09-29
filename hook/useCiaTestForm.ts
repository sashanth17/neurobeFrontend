import { useState, useEffect } from "react";
import Models from "@/imports/models.import";
import { CreateCIATestPayload, CourseInstanceOption } from "@/types/cia-test.types";
import { Success, Failure } from "@/utils/function.utils";

export interface UseCiaTestFormProps {
  courseId: number | string;
  courseCode: string;
  editTestId?: number | null;
  onSuccess: () => void;
  onClose: () => void;
}

export const useCiaTestForm = ({
  courseId,
  courseCode,
  editTestId,
  onSuccess,
  onClose,
}: UseCiaTestFormProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [instancesLoading, setInstancesLoading] = useState(false);
  const [availableInstances, setAvailableInstances] = useState<CourseInstanceOption[]>([]);
  const [templates, setTemplates] = useState<{ id: number; name: string; total_maximum_marks?: number }[]>([]);
  const [questionPapers, setQuestionPapers] = useState<{ id: number; name: string }[]>([]);

  // Form Fields
  const [formData, setFormData] = useState<CreateCIATestPayload>({
    test_name: "CIA-1 Assessment 2026",
    test_code: `${courseCode || "CS"}-CIA1-2026`,
    test_type: "CIA",
    branch: "CSE",
    academic_year: "2026-2027",
    year: 3,
    semester: 5,
    test_date: new Date().toISOString().split("T")[0],
    start_time: "09:30 AM",
    end_time: "11:00 AM",
    duration_minutes: 90,
    max_marks: 50,
    question_paper_template_id: 1,
    question_paper_id: null,
    question_paper_file_url: null,
    course_instance_ids: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Auto-update test_code when courseCode changes (only for create mode)
  useEffect(() => {
    if (courseCode && !editTestId) {
      setFormData((prev) => ({
        ...prev,
        test_code: prev.test_code.includes("-CIA")
          ? prev.test_code
          : `${courseCode}-CIA1-2026`,
      }));
    }
  }, [courseCode, editTestId]);

  // Load available course instances (sections) and templates for this course
  useEffect(() => {
    const fetchInstancesAndTemplates = async () => {
      if (!courseId) return;
      try {
        setInstancesLoading(true);

        // Fetch course instances (sections)
        const instRes: any = await Models.cia_test.getCourseInstances(courseId).catch(() => null);
        let list: CourseInstanceOption[] = [];
        if (instRes) {
          if (Array.isArray(instRes)) list = instRes;
          else if (instRes.items && Array.isArray(instRes.items)) list = instRes.items;
          else if (instRes.data && Array.isArray(instRes.data)) list = instRes.data;
        }



        setAvailableInstances(list);

        // Auto-select all available sections by default, if not in edit mode
        if (!editTestId) {
          const allIds = list.map((i) => i.id);
          setFormData((prev) => ({ ...prev, course_instance_ids: allIds }));
        }

        // 1. Fetch course-level question paper templates first
        const courseTemplatesRes: any = await Models.cia_test.listCourseTemplates(courseId).catch(() => []);
        let tplList: any[] = [];
        if (Array.isArray(courseTemplatesRes) && courseTemplatesRes.length > 0) {
          tplList = courseTemplatesRes;
        } else {
          // 2. Fallback to organization templates
          const orgTemplatesRes: any = await Models.cia_test.getTemplates().catch(() => []);
          if (Array.isArray(orgTemplatesRes) && orgTemplatesRes.length > 0) {
            tplList = orgTemplatesRes;
          }
        }

        if (tplList.length > 0) {
          const parsedTpls = tplList.map((t: any) => ({
            id: t.id,
            name: t.name || t.template_name || `Template #${t.id}`,
            total_maximum_marks: Number(t.total_maximum_marks || t.max_marks || 50),
          }));
          setTemplates(parsedTpls);

          // Auto-select first template and set initial max_marks dynamically
          if (parsedTpls[0] && !editTestId) {
            setFormData((prev) => ({
              ...prev,
              question_paper_template_id: parsedTpls[0].id,
              max_marks: parsedTpls[0].total_maximum_marks || 50,
            }));
          }
        } else {
          setTemplates([]);
          if (!editTestId) {
            setFormData((prev) => ({
              ...prev,
              question_paper_template_id: null,
              max_marks: 50,
            }));
          }
        }

        // Fetch question papers from course service
        const realPapers: any = await Models.cia_test.getQuestionPapers(courseId).catch(() => []);
        if (Array.isArray(realPapers) && realPapers.length > 0) {
          setQuestionPapers(
            realPapers.map((p: any) => ({
              id: p.id,
              name: p.title || p.name || p.paper_name || `Paper #${p.id}`,
            }))
          );
        } else {
          setQuestionPapers([]);
        }
      } catch (err) {
        console.error("Error fetching instances or templates:", err);
      } finally {
        setInstancesLoading(false);
      }
    };

    const fetchDetails = async () => {
      if (!editTestId) return;
      try {
        const res: any = await Models.cia_test.details(editTestId);
        setFormData((prev) => ({
          ...prev,
          test_name: res.test_name || "",
          test_code: res.test_code || "",
          test_type: res.test_type || "CIA",
          branch: res.branch || "CSE",
          academic_year: res.academic_year || "2026-2027",
          year: res.year || 3,
          semester: res.semester || 5,
          test_date: res.test_date || "",
          start_time: res.start_time || "",
          end_time: res.end_time || "",
          duration_minutes: res.duration_minutes || 90,
          max_marks: res.max_marks || 50,
          question_paper_template_id: res.question_paper_template_id || null,
          question_paper_id: res.question_paper_id || null,
          question_paper_file_url: res.question_paper_file_url || null,
          course_instance_ids: res.assigned_instances?.map((i: any) => i.course_instance_id || i.id) || [],
        }));
      } catch (err) {
        console.error("Failed to load CIA test details for edit", err);
      }
    };

    fetchInstancesAndTemplates().then(fetchDetails);
  }, [courseId, courseCode, editTestId]);

  const updateField = (field: keyof CreateCIATestPayload, value: any) => {
    if (field === "question_paper_template_id") {
      const selectedTpl = templates.find((t) => t.id === Number(value));
      const derivedMarks = selectedTpl?.total_maximum_marks ?? 50;
      setFormData((prev) => ({
        ...prev,
        question_paper_template_id: value ? Number(value) : null,
        max_marks: derivedMarks,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    const fieldKey = String(field);
    if (formErrors[fieldKey]) {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldKey];
        return updated;
      });
    }
  };

  const toggleInstanceSelection = (id: number) => {
    setFormData((prev) => {
      const exists = prev.course_instance_ids.includes(id);
      const nextIds = exists
        ? prev.course_instance_ids.filter((item) => item !== id)
        : [...prev.course_instance_ids, id];
      return { ...prev, course_instance_ids: nextIds };
    });
    if (formErrors.course_instance_ids) {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy.course_instance_ids;
        return copy;
      });
    }
  };

  const selectAllInstances = () => {
    const allIds = availableInstances.map((i) => i.id);
    setFormData((prev) => ({
      ...prev,
      course_instance_ids: prev.course_instance_ids.length === allIds.length ? [] : allIds,
    }));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.test_name?.trim()) errors.test_name = "Test name is required";
    if (!formData.test_code?.trim()) errors.test_code = "Test code is required";
    if (!formData.course_instance_ids || formData.course_instance_ids.length === 0) {
      errors.course_instance_ids = "At least one section must be assigned to this test";
    }
    if (!formData.test_date) errors.test_date = "Test date is required";
    if (!formData.duration_minutes || formData.duration_minutes <= 0) {
      errors.duration_minutes = "Valid duration is required";
    }
    if (!formData.max_marks || formData.max_marks <= 0) {
      errors.max_marks = "Max marks is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload: CreateCIATestPayload = {
        ...formData,
        year: Number(formData.year),
        semester: Number(formData.semester),
        duration_minutes: Number(formData.duration_minutes),
        max_marks: Number(formData.max_marks),
        question_paper_template_id: formData.question_paper_template_id
          ? Number(formData.question_paper_template_id)
          : null,
        question_paper_id: formData.question_paper_id
          ? Number(formData.question_paper_id)
          : null,
      };
      if (editTestId) {
        await Models.cia_test.update(editTestId, payload);
        Success(`CIA test "${formData.test_name}" updated successfully!`);
      } else {
        await Models.cia_test.create(courseId, payload);
        Success(`CIA test "${formData.test_name}" created successfully!`);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(editTestId ? "Failed to update CIA test:" : "Failed to create CIA test:", err);
      const errorMsg =
        err?.detail ||
        err?.message ||
        (editTestId ? "Failed to update CIA test." : "Failed to create CIA test. Check if test code is already in use.");
      Failure(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    formErrors,
    submitting,
    instancesLoading,
    availableInstances,
    templates,
    questionPapers,
    updateField,
    toggleInstanceSelection,
    selectAllInstances,
    handleSubmit,
  };
};

export default useCiaTestForm;
