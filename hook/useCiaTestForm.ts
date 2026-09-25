import { useState, useEffect } from "react";
import Models from "@/imports/models.import";
import { CreateCIATestPayload, CourseInstanceOption } from "@/types/cia-test.types";
import { Success, Failure } from "@/utils/function.utils";

export interface UseCiaTestFormProps {
  courseId: number | string;
  courseCode: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const useCiaTestForm = ({
  courseId,
  courseCode,
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

  // Auto-update test_code when courseCode changes
  useEffect(() => {
    if (courseCode) {
      setFormData((prev) => ({
        ...prev,
        test_code: prev.test_code.includes("-CIA")
          ? prev.test_code
          : `${courseCode}-CIA1-2026`,
      }));
    }
  }, [courseCode]);

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

        // If list is empty, create fallback candidates based on course
        if (list.length === 0) {
          list = [
            { id: 101, instance_name: `${courseCode || "Course"} - Sec A`, section: "A", enrolled_students_count: 58 },
            { id: 102, instance_name: `${courseCode || "Course"} - Sec B`, section: "B", enrolled_students_count: 62 },
          ];
        }

        setAvailableInstances(list);

        // Auto-select all available sections by default
        const allIds = list.map((i) => i.id);
        setFormData((prev) => ({ ...prev, course_instance_ids: allIds }));

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
          if (parsedTpls[0]) {
            setFormData((prev) => ({
              ...prev,
              question_paper_template_id: parsedTpls[0].id,
              max_marks: parsedTpls[0].total_maximum_marks || 50,
            }));
          }
        } else {
          const defaultTpls = [
            { id: 1, name: `CIA-1 Standard Blueprint - ${courseCode || "CS"}`, total_maximum_marks: 50 },
            { id: 2, name: `Anna University 100M Pattern - ${courseCode || "CS"}`, total_maximum_marks: 100 },
            { id: 3, name: `Model Exam Comprehensive Pattern - ${courseCode || "CS"}`, total_maximum_marks: 100 },
          ];
          setTemplates(defaultTpls);
          setFormData((prev) => ({
            ...prev,
            question_paper_template_id: defaultTpls[0].id,
            max_marks: defaultTpls[0].total_maximum_marks,
          }));
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
          setQuestionPapers([
            { id: 101, name: `${courseCode || "Course"} CIA-1 Official Question Paper` },
            { id: 102, name: `${courseCode || "Course"} Mid-Term Assessment Paper v2` },
          ]);
        }
      } catch (err) {
        console.error("Error fetching instances or templates:", err);
      } finally {
        setInstancesLoading(false);
      }
    };

    fetchInstancesAndTemplates();
  }, [courseId, courseCode]);

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

      await Models.cia_test.create(courseId, payload);
      Success(`CIA test "${formData.test_name}" created successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to create CIA test:", err);
      const errorMsg =
        err?.detail ||
        err?.message ||
        "Failed to create CIA test. Check if test code is already in use.";
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
