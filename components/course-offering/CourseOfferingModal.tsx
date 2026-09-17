import { useEffect } from "react";
import { Edit, PlusIcon } from "lucide-react";
import * as Yup from "yup";
import { ModalShell } from "@/components/academic-setup/AddModals";
import TextInput from "@/components/FormFields/TextInput.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { useSetState, Dropdown, Failure } from "@/utils/function.utils";
import Models from "@/imports/models.import";

type DropdownOption = { value: string | number; label: string };

const TERM_OPTS: DropdownOption[] = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7", label: "7" },
  { value: "8", label: "8" },
];

const schema = Yup.object({
  course_instance_name: Yup.string().trim().required("Course instance name is required"),
  programme_id: Yup.mixed().required("Academic programme is required"),
  batch_id: Yup.mixed().required("Batch is required"),
  semester: Yup.mixed().required("Academic term is required"),
  course_id: Yup.mixed().required("Course is required"),
});

interface Props { open: boolean; onClose: () => void; initialData?: any; }

const CourseOfferingModal = ({ open, onClose, initialData }: Props) => {
  const isEdit = !!initialData;

  const [state, setState] = useSetState({
    // form fields
    course_instance_name: "",
    programme: null as any,
    batch: null as any,
    term: null as any,
    course: null as any,
    // validation errors
    errors: {} as Record<string, string>,
    // dropdown options
    programmeList: [] as DropdownOption[],
    batchList: [] as DropdownOption[],
    courseList: [] as DropdownOption[],
  });

  useEffect(() => {
    if (open) {
      batchList();
      programmeList();
      courseList();
    }
  }, [open]);

  // populate form when editing
  useEffect(() => {
    if (open && initialData) {
      setState({
        course_instance_name: initialData.course_instance_name ?? "",
        programme: initialData.programme_id
          ? { value: initialData.programme_id, label: initialData.programme_name ?? String(initialData.programme_id) }
          : null,
        batch: initialData.batch_id
          ? { value: initialData.batch_id, label: initialData.batch_name ?? String(initialData.batch_id) }
          : null,
        term: initialData.term
          ? { value: initialData.term, label: initialData.term }
          : null,
        course: initialData.course_id
          ? { value: initialData.course_id, label: initialData.course_title ?? String(initialData.course_id) }
          : null,
        errors: {},
      });
    } else if (open && !initialData) {
      setState({
        course_instance_name: "",
        programme: null,
        batch: null,
        term: null,
        course: null,
        errors: {},
      });
    }
  }, [open, initialData]);

  const programmeList = async () => {
    try {
      const res: any = await Models.programme.list();
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({ programmeList: Dropdown(list, "programme_name") });
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to load programmes");
    }
  };

  const batchList = async () => {
    try {
      const res: any = await Models.batch.list();
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({ batchList: Dropdown(list, "name") });
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to load batches");
    }
  };

  const courseList = async () => {
  try {
      const res: any = await Models.course.list();
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({ courseList: Dropdown(list, "course_title") });
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to load courses");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userStr = localStorage.getItem("user");
    const user = JSON.parse(userStr);

    const values = {
      course_instance_name: state.course_instance_name,
      programme_id: state.programme?.value,
      batch_id: state.batch?.value,
      semester: Number(state.term?.value),
      course_id: state.course?.value,
      organization_id: user.organization_id


    };
    console.log("values",values)

    try {
      await schema.validate(values, { abortEarly: false });
      const response = await Models.course_instance.create(values)
      console.log("response", response)
      setState({ errors: {} });
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
              title="Batch"
              required
              options={state.batchList}
              value={state.batch}
              onChange={(v) => setState({ batch: v })}
              placeholder="Select Batch"
              error={state.errors?.batch}
            />
            <CustomSelect
              title="Academic Term / Semester"
              required
              options={TERM_OPTS}
              value={state.term}
              onChange={(v) => setState({ term: v })}
              placeholder="Semester 3"
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
