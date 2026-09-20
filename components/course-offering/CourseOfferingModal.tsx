import { useEffect } from "react";
import { Edit, PlusIcon } from "lucide-react";
import * as Yup from "yup";
import { ModalShell } from "@/components/academic-setup/AddModals";
import TextInput from "@/components/FormFields/TextInput.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { useSetState, Failure } from "@/utils/function.utils";
import Models from "@/imports/models.import";

type DropdownOption = { value: string | number; label: string };

const TERM_OPTS: DropdownOption[] = [
  { value: "1", label: "Semester 1" },
  { value: "2", label: "Semester 2" },
  { value: "3", label: "Semester 3" },
  { value: "4", label: "Semester 4" },
  { value: "5", label: "Semester 5" },
  { value: "6", label: "Semester 6" },
  { value: "7", label: "Semester 7" },
  { value: "8", label: "Semester 8" },
];

const schema = Yup.object({
  course_instance_name: Yup.string().trim().required("Course instance name is required"),
  programme_id: Yup.mixed().required("Academic programme is required"),
  department_id: Yup.mixed().required("Department is required"),
  semester: Yup.mixed().required("Academic term is required"),
  course_id: Yup.mixed().required("Course is required"),
});

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSuccess?: () => void;
}

const CourseOfferingModal = ({ open, onClose, initialData, onSuccess }: Props) => {
  const isEdit = !!initialData;

  const [state, setState] = useSetState({
    // form fields
    course_instance_name: "",
    programme: null as any,
    department: null as any,
    term: null as any,
    course: null as any,
    // validation errors
    errors: {} as Record<string, string>,
    // dropdown options
    programmeList: [] as DropdownOption[],
    departmentList: [] as DropdownOption[],
    courseList: [] as DropdownOption[],
  });

  useEffect(() => {
    if (open) {
      initModalData();
    }
  }, [open, initialData]);

  const fetchProgrammeList = async (): Promise<DropdownOption[]> => {
    try {
      const res: any = await Models.programme.list();
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      return list.map((item: any) => ({
        value: item.id,
        label: item.programme_name || item.name || item.short_name || item.code || `Programme #${item.id}`,
      }));
    } catch {
      return [];
    }
  };

  const fetchDepartmentList = async (): Promise<DropdownOption[]> => {
    try {
      const res: any = await Models.department.list();
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      return list.map((item: any) => ({
        value: item.id,
        label: item.department_name || item.name || item.short_name || item.code || `Department #${item.id}`,
      }));
    } catch {
      return [];
    }
  };

  const fetchCourseList = async (): Promise<DropdownOption[]> => {
    try {
      const res: any = await Models.course.list();
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      return list.map((item: any) => ({
        value: item.id,
        label: item.course_title || item.title || item.course_name || item.code || `Course #${item.id}`,
      }));
    } catch {
      return [];
    }
  };

  const initModalData = async () => {
    const [progs, depts, crses] = await Promise.all([
      fetchProgrammeList(),
      fetchDepartmentList(),
      fetchCourseList(),
    ]);

    setState({
      programmeList: progs,
      departmentList: depts,
      courseList: crses,
    });

    if (initialData) {
      const progVal = initialData.programme_id ?? initialData.programme;
      const deptVal = initialData.department_id ?? initialData.department;
      const termVal = initialData.semester || initialData.term;
      const crsVal = initialData.course_id ?? initialData.course;

      const matchedProg = progs.find((p) => String(p.value) === String(progVal));
      const matchedDept = depts.find((d) => String(d.value) === String(deptVal));
      const matchedTerm = TERM_OPTS.find((t) => String(t.value) === String(termVal));
      const matchedCrs = crses.find((c) => String(c.value) === String(crsVal));

      const progLabel = matchedProg?.label || initialData.programme_name || (progVal ? `Programme #${progVal}` : "");
      const deptLabel = matchedDept?.label || initialData.department_name || (deptVal ? `Department #${deptVal}` : "");
      const termLabel = matchedTerm?.label || (termVal ? `Semester ${termVal}` : "");
      const crsLabel = matchedCrs?.label || initialData.course_title || (crsVal ? `Course #${crsVal}` : "");

      setState({
        course_instance_name: (initialData.course_instance_name ?? initialData.course) || "",
        programme: progVal ? { value: progVal, label: progLabel } : null,
        department: deptVal ? { value: deptVal, label: deptLabel } : null,
        term: termVal ? { value: String(termVal), label: termLabel } : null,
        course: crsVal ? { value: crsVal, label: crsLabel } : null,
        errors: {},
      });
    } else {
      setState({
        course_instance_name: "",
        programme: null,
        department: null,
        term: null,
        course: null,
        errors: {},
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const user = userStr ? JSON.parse(userStr) : {};

    const values = {
      organization_id: user?.organization_id || 0,
      course_id: state.course?.value,
      course_instance_name: state.course_instance_name,
      programme_id: state.programme?.value,
      department_id: state.department?.value,
      semester: Number(state.term?.value),
      is_active: true,
      term_visibility: true,
      is_archived: false,
      created_by_id: user?.id || 0,
      created_on: new Date().toISOString(),
    };

    try {
      await schema.validate(values, { abortEarly: false });
      let response: any = null;
      if (isEdit && initialData?.id) {
        response = await Models.course_instance.update(initialData.id, values);
      } else {
        response = await Models.course_instance.create(values);
      }
      console.log("response", response);
      setState({ errors: {} });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const errors: Record<string, string> = {};
      err.inner?.forEach((e: any) => {
        errors[e.path] = e.message;
      });
      setState({ errors });
      return;
    }
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Course Offering" : "Create Course Offering"}
      icon={isEdit ? <Edit className="w-3.5 h-3.5" /> : <PlusIcon className="w-3.5 h-3.5" />}
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <TextInput
            title="Course Instance Name"
            required
            placeholder="Enter course instance name"
            value={state.course_instance_name}
            onChange={(e) => setState({ course_instance_name: e.target.value })}
            error={state.errors?.course_instance_name}
          />

          <CustomSelect
            title="Academic Programme"
            required
            options={state.programmeList}
            value={state.programme}
            onChange={(v) => setState({ programme: v })}
            placeholder="Select Programme"
            error={state.errors?.programme}
          />

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              title="Department"
              required
              options={state.departmentList}
              value={state.department}
              onChange={(v) => setState({ department: v })}
              placeholder="Select Department"
              error={state.errors?.department}
            />
            <CustomSelect
              title="Academic Term / Semester"
              required
              options={TERM_OPTS}
              value={state.term}
              onChange={(v) => setState({ term: v })}
              placeholder="Select Semester"
              error={state.errors?.term}
            />
          </div>

          <CustomSelect
            title="Course"
            required
            options={state.courseList}
            value={state.course}
            onChange={(v) => setState({ course: v })}
            placeholder="Select Course"
            error={state.errors?.course}
          />
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
            className="bg-color2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {isEdit ? "Update Offering" : "Create Offering"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default CourseOfferingModal;
