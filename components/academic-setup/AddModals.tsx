import { useState, useEffect } from "react";
import { Check, Edit, PlusIcon, Search, Users, X } from "lucide-react";
import TextInput from "@/components/FormFields/TextInput.component";
import TextArea from "@/components/FormFields/TextArea.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { Failure, useSetState } from "@/utils/function.utils";
import Models from "@/imports/models.import";
import { ROLES } from "@/utils/constant.utils";
import PDFUploadDropzone from "./PDFUploadDropzone";

// ─── Body scroll lock ─────────────────────────────────────────────────────────
const useLockBodyScroll = (active: boolean) => {
  useEffect(() => {
    if (active) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);
};

// ─── Animated visibility hook (delays unmount for closing animation) ────────
const useAnimatedVisibility = (open: boolean, duration = 220) => {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
  const ALL_INSTRUCTORS = ["Arun Kumar", "Priya Selvam", "Sanjay Murugan", "Vignesh Kumar", "Deepa Nair", "Dr. Senthil Nathan"];


  useEffect(() => {
    if (open) {
      setClosing(false);
      setVisible(true);
    } else if (visible) {
      setClosing(true);
      const t = setTimeout(() => { setVisible(false); setClosing(false); }, duration);
      return () => clearTimeout(t);
    }
  }, [open]);

  return { visible, closing };
};

// ─── Shared modal shell ───────────────────────────────────────────────────────
interface ModalShellProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  icon?: any;
  code?: string
}

export const ModalShell = ({
  title,
  subtitle,
  open,
  onClose,
  children,
  icon,
  code
}: ModalShellProps) => {
  const { visible, closing } = useAnimatedVisibility(open);
  useLockBodyScroll(visible);

  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ animation: closing ? "fadeOut 0.22s ease forwards" : "fadeIn 0.22s ease" }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900"
        style={{ animation: closing ? "slideDown 0.22s ease forwards" : "slideUp 0.22s ease" }}
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-700">
          <div className='flex items-center gap-2'>
            {icon && (
              <div className="text-color2 w-fit rounded-md bg-gray-200 p-2">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className=" text-base font-semibold text-[#000] dark:text-white">
                  {title}
                </h3>
                {code &&
                  <div className="text-color2 w-fit rounded-md  px-3 py-1 bg-color2-l text-xs font-semibold text-color2">
                    {code}
                  </div>
                }
              </div>
              {subtitle && (
                <p className="mt-0.5 text-xs text-[#000]">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-pri mt-0.5 rounded-full border border-gray-500 p-0.5 hover:text-[#000] dark:hover:text-gray-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

const ModalFooter = ({
  onClose,
  submitLabel,
}: {
  onClose: () => void;
  submitLabel: string;
}) => (
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
      {submitLabel}
    </button>
  </div>
);

// ─── Option helpers ───────────────────────────────────────────────────────────
const toOpts = (arr: string[]) => arr.map((v) => ({ value: v, label: v }));
const toOpt = (v: string | null | undefined) =>
  v ? { value: v, label: v } : null;

const DEPT_OPTS = toOpts([
  "CS - Computer Science",
  "EC - Electronics",
  "AI - Artificial Intelligence",
  "ME - Mechanical",
  "CE - Civil",
]);
const STATUS_OPTS = toOpts(["Active", "Inactive"]);
const PROG_OPTS = toOpts(["BTECH-CSE", "BTECH-ECE", "MTECH-AI", "MBA"]);
const TYPE_OPTS = toOpts(["UG", "PG", "Diploma", "PhD"]);
const BATCH_STATUS_OPTS = toOpts(["Active", "Inactive"]);

// ─── CREATE / EDIT COURSE MODAL ───────────────────────────────────────────────
export interface CourseFormData {
  department_id: number;
  course_code: string;
  course_title: string;
  status: string;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  credits: number;
  total_theory_hours: number;
  total_lab_hours: number;
  syllabus_file?: File | null;
  regulation?: string;
  is_active?: boolean;
  coordinator?: { value: number | string; label: string } | null;
  instructors?: { value: number | string; label: string }[];
}

interface CourseModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (formData: CourseFormData) => void;
  submitting?: boolean;
  departmentOptions?: { value: number | string; label: string }[];
}

export const CreateCourseModal = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
  departmentOptions,
}: CourseModalProps) => {
  const isEdit = !!initialData;
  const deptOpts = departmentOptions ;
  const COORDINATOR_OPTS = toOpts(["Arun Kumar (FAC-CSE-018)", "Priya Selvan (FAC-CSE-042)", "Vignesh Kumar (FAC-BCE-031)", "Priya Balwani (FAC-CSE-044)"]);

  const [state, setState] = useSetState({
    code: "",
    title: "",
    department: null as any,
    status: { value: "Active", label: "Active" } as any,
    regulation: "R2023",
    lecture: "3",
    tutorial: "0",
    practical: "0",
    credits: "0",
    theoryHours: "45",
    labHours: "0",
    coordinator: null as any,
    coordinatorList: [],
    instructorList: [],
    instructor: [],
    syllabusFile: null as File | null,
  });

  useEffect(() => {
    getCourseCoordinator();
    getCourseInstructor();
  }, [open]);

  useEffect(() => {
    if (open && initialData) {
      get_instructor(initialData)
      console.log("initialData",initialData)
      setState({
        code: initialData.course_code || "",
        title: initialData.course_title || "",
        department: initialData.department_id
          ? { value: initialData.department_id, label: initialData.department_name || String(initialData.department_id) }
          : null,
        status: initialData.status
          ? { value: initialData.status, label: initialData.status }
          : { value: "Active", label: "Active" },
        regulation: initialData.regulation || "R2023",
        lecture: String(initialData.lecture_hours ?? "3"),
        tutorial: String(initialData.tutorial_hours ?? "0"),
        practical: String(initialData.practical_hours ?? "0"),
        credits: String(initialData.credits ?? "0"),
        theoryHours: String(initialData.total_theory_hours ?? "45"),
        labHours: String(initialData.total_lab_hours ?? "0"),
        coordinator: initialData.coordinator_id
          ? { value: initialData.coordinator_id, label: initialData.coordinator_name || String(initialData.coordinator_id) }
          : null,
        syllabusFile: null,
        // Don't reset instructor here - let get_instructor set it
      });
    } else if (open && !initialData) {
      setState({
        code: "",
        title: "",
        department: null,
        status: { value: "Active", label: "Active" },
        regulation: "R2023",
        lecture: "3",
        tutorial: "0",
        practical: "0",
        credits: "0",
        theoryHours: "45",
        labHours: "0",
        coordinator: null,
        instructor: [],
        syllabusFile: null,
      });
    }
  }, [open, initialData]);

  const get_instructor = async (data) => {
    try {
      const body = {
        course_id: data?.id
      };

      const res: any = await Models.course_instructor.list(body);
      console.log("get_instructor response:", res);

      if (res && Array.isArray(res) && res.length > 0) {
        const instructorList = res.map((item: any) => ({
          value: item.id,
          label: item.instructor_name,
        }));
        
        console.log("Setting instructors:", instructorList);
        setState({ instructor: instructorList });
      }
    } catch (error) {
      console.log('✌️error --->', error);
    }
  };


  const getCourseCoordinator = async () => {
    try {
      const body = {
        role: ROLES.COURSE_COORDINATOR
      };

      const res: any = await Models.users.list(body);
      const dropdown = res?.map((item) => ({
        label: `${item.first_name} (${item.last_name})`,
        value: item?.id
      }));
      setState({ coordinatorList: dropdown });

      console.log('✌️res --->', dropdown);

    } catch (error) {
      console.log('✌️error --->', error);
    }
  };


  const getCourseInstructor = async () => {
    try {
      const body = {
      };

      const res: any = await Models.course_instructor.list(body);

      const dropdown = res?.map((item) => ({
        label: `${item.instructor_name}`,
        value: item?.id
      }));
      setState({ instructorList: dropdown });

      console.log('✌️res --->', dropdown);

    } catch (error) {
      console.log('✌️error --->', error);
    }
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.code.trim()) {
      Failure("Please enter course code");
      return;
    }
    if (!state.title.trim()) {
      Failure("Please enter course title");
      return;
    }
    if (!state.department?.value) {
      Failure("Please select a department");
      return;
    }
    if (!state.coordinator?.value) {
      Failure("Please select a course coordinator");
      return;
    }

    const payload: CourseFormData = {
      department_id: Number(state.department.value) || 0,
      course_code: state.code.trim(),
      course_title: state.title.trim(),
      status: state.status?.value || "Active",
      lecture_hours: Number(state.lecture) || 0,
      tutorial_hours: Number(state.tutorial) || 0,
      practical_hours: Number(state.practical) || 0,
      credits: Number(state.credits) || 0,
      total_theory_hours: Number(state.theoryHours) || 0,
      total_lab_hours: Number(state.labHours) || 0,
      regulation: state.regulation || "R2023",
      is_active: (state.status?.value || "Active").toLowerCase() === "active",
      syllabus_file: state.syllabusFile ?? null,
      coordinator: state.coordinator ?? null,
      instructors: state.instructor || [],
    };

    onSubmit(payload);
  };

  const toggleInstructor = (item: any) => {
    const selected: any[] = state.instructor || [];
    const exists = selected.some((i) => i.value === item.value);
    setState({
      instructor: exists
        ? selected.filter((i) => i.value !== item.value)
        : [...selected, item],
    });
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Course" : "Create New Course"}
      icon={
        isEdit ? (
          <Edit className="h-3.5 w-3.5" />
        ) : (
          <PlusIcon className="h-3.5 w-3.5" />
        )
      }
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            title="Course Code"
            required
            placeholder="e.g. CS301"
            value={state.code}
            onChange={(e) => setState({ code: e.target.value })}
          />
          <TextInput
            title="Course Title"
            required
            placeholder="e.g. Data Structures"
            value={state.title}
            onChange={(e) => setState({ title: e.target.value })}
          />
          <CustomSelect
            title="Department"
            required
            options={deptOpts}
            value={state.department}
            onChange={(v) => setState({ department: v })}
            placeholder="Select Department"
          />
          <CustomSelect
            title="Status"
            options={STATUS_OPTS}
            value={state.status}
            onChange={(v) => setState({ status: v })}
            placeholder="Active"
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <TextInput
            title="Regulation"
            placeholder="e.g. R2023"
            value={state.regulation}
            onChange={(e) => setState({ regulation: e.target.value })}
          />
          <div></div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between">
            <p className="mb-2 text-xs font-semibold text-[#000] dark:text-[#000]">
              L-T-P-C Breakdown (Weekly Hours &amp; Credits)
            </p>
            <span className="text-color2 ml-2 cursor-pointer text-xs font-bold">
              Credits : {state.credits}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <TextInput
              title="Lecture (L)"
              type="number"
              value={state.lecture}
              onChange={(e) => setState({ lecture: e.target.value })}
            />
            <TextInput
              title="Tutorial (T)"
              type="number"
              value={state.tutorial}
              onChange={(e) => setState({ tutorial: e.target.value })}
            />
            <TextInput
              title="Practical (P)"
              type="number"
              value={state.practical}
              onChange={(e) => setState({ practical: e.target.value })}
            />
            <TextInput
              title="Credits (C)"
              type="number"
              value={state.credits}
              onChange={(e) => setState({ credits: e.target.value })}
              className="border-[#7c3aed] bg-[#ede9fe] text-center font-bold text-color2"
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <TextInput
            title="Total Theory Hours"
            type="number"
            placeholder="45"
            value={state.theoryHours}
            onChange={(e) => setState({ theoryHours: e.target.value })}
          />
          <TextInput
            title="Total Lab Hours"
            type="number"
            placeholder="30"
            value={state.labHours}
            onChange={(e) => setState({ labHours: e.target.value })}
          />

        </div>

        <div className="mt-4 rounded-xl border border-[#ede9fe] bg-[#faf8ff] p-4 dark:border-purple-800 dark:bg-purple-900/10">
          <CustomSelect
            title="Assigned Course Coordinator"
            required
            options={state.coordinatorList}
            value={state.coordinator}
            onChange={(v) => setState({ coordinator: v })}
            placeholder="Arun Kumar (FAC-CSE-018)"
          />
        </div>
        <div className="mt-4">
          <p className="mt-4 mb-2 text-sm font-bold text-[#000] dark:text-gray-300">
            Additional Course Instructor(s)
          </p>
          <div className="grid grid-cols-2 gap-2">

            {state.instructorList?.map((name) => {
            const checked = state.instructor.some((i: any) => i.value === name.value);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleInstructor(name)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${checked
                      ? "border-[#7c3aed] bg-[#ede9fe] text-color2"
                      : "border-gray-200 bg-white text-[#000] hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? "border-[#7c3aed] bg-[#7c3aed]" : "border-gray-300"}`}>
                    {checked && (
                      <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {name?.label}
                  {/* {name === "Arun Kumar" && <span className="ml-auto text-yellow-400">☆</span>} */}
                </button>
              );
            })}
          </div>

        </div>

        <div className="mt-4">
          <PDFUploadDropzone
            label="Course Syllabus (PDF)"
            existingFileUrl={initialData?.syllabus_file || null}
            onFileSelect={(file) => setState({ syllabusFile: file })}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-color2 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {submitting ? "Saving…" : isEdit ? "Update Course" : "Create Course"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ─── CREATE / EDIT DEPARTMENT MODAL ──────────────────────────────────────────
export interface DepartmentFormData {
  department_name: string;
  department_short_name: string;
  status: string;
}

interface DeptModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (formData: DepartmentFormData) => void;
  submitting?: boolean;
}

export const CreateDepartmentModal = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
}: DeptModalProps) => {
  console.log("initialData",initialData)
  const isEdit = !!initialData;
  const [state, setState] = useSetState({
    code: "",
    name: "",
    status: { value: "Active", label: "Active" } as any,
  });

  useEffect(() => {
    if (initialData) {
      setState({
        code: initialData.department_short_name ?? initialData.code ?? "",
        name: initialData.department_name ?? initialData.name ?? "",
        status: toOpt(initialData.status?.toLowerCase() === "inactive" ? "Inactive" : "Active"),
      });
    } else {
      setState({ code: "", name: "", status: { value: "Active", label: "Active" } });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name?.trim()) {
      Failure("Please enter department name");
      return;
    }
    if (!state.code?.trim()) {
      Failure("Please enter department short name / code");
      return;
    }

    onSubmit({
      department_name: state.name.trim(),
      department_short_name: state.code.trim(),
      status: (state.status?.value ?? "Active").toLowerCase(),
    });
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Department" : "Create New Department"}
      icon={isEdit ? <Edit className="h-3.5 w-3.5" /> : <PlusIcon className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4">
          <TextInput
            title="Department Name"
            required
            placeholder="e.g. Computer Science & Engineering"
            value={state.name}
            onChange={(e) => setState({ name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextInput
              title="Department Code"
              required
              placeholder="e.g. CSE"
              value={state.code}
              onChange={(e) => setState({ code: e.target.value })}
            />
            <CustomSelect
              title="Status"
              options={STATUS_OPTS}
              value={state.status}
              onChange={(v) => setState({ status: v })}
              placeholder="Active"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-color2 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {submitting ? "Saving…" : isEdit ? "Update Department" : "Create Department"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ─── CREATE / EDIT PROGRAMME MODAL ───────────────────────────────────────────
export interface ProgrammeFormData {
  department_id: number;
  programme_name: string;
  short_name: string;
  degree_level: string;
  status: string;
}

interface ProgModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (formData: ProgrammeFormData) => void;
  submitting?: boolean;
  departmentOptions?: { value: number | string; label: string }[];
}

export const CreateProgrammeModal = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
  departmentOptions,
}: ProgModalProps) => {
  const isEdit = !!initialData;
  const deptOpts = departmentOptions ;

  const [state, setState] = useSetState({
    name: "",
    short_name: "",
    department: null as any,
    degree_level: { value: "UG", label: "UG" } as any,
    status: { value: "Active", label: "Active" } as any,
  });

  useEffect(() => {
    if (initialData) {
      const foundDept = deptOpts.find(
        (d: any) =>
          d.value === initialData.department_id ||
          d.label === initialData.department_name ||
          d.label === initialData.department
      );
      setState({
        name: initialData.programme_name ?? initialData.name ?? "",
        short_name: initialData.short_name ?? initialData.code ?? "",
        department: foundDept ?? toOpt(initialData.department_name || initialData.department),
        degree_level: toOpt(initialData.degree_level ?? initialData.type ?? "UG"),
        status: toOpt(initialData.status?.toLowerCase() === "inactive" ? "Inactive" : "Active"),
      });
    } else {
      setState({
        name: "",
        short_name: "",
        department: null,
        degree_level: { value: "UG", label: "UG" },
        status: { value: "Active", label: "Active" },
      });
    }
  }, [initialData, open, deptOpts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name.trim()) {
      Failure("Please enter programme name");
      return;
    }
    if (!state.short_name.trim()) {
      Failure("Please enter short name");
      return;
    }
    if (!state.department?.value) {
      Failure("Please select an associated department");
      return;
    }

    onSubmit({
      department_id: Number(state.department.value) || 0,
      programme_name: state.name.trim(),
      short_name: state.short_name.trim(),
      degree_level: state.degree_level?.value || "UG",
      status: state.status?.value || "Active",
    });
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Programme" : "Create New Programme"}
      icon={
        isEdit ? (
          <Edit className="h-3.5 w-3.5" />
        ) : (
          <PlusIcon className="h-3.5 w-3.5" />
        )
      }
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <TextInput
          title="Programme Name"
          required
          placeholder="e.g. B.Tech Computer Science"
          value={state.name}
          onChange={(e) => setState({ name: e.target.value })}
        />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <TextInput
            title="Short Name"
            required
            placeholder="e.g. BTECH-CSE"
            value={state.short_name}
            onChange={(e) => setState({ short_name: e.target.value })}
          />

          <CustomSelect
            title="Associated Department"
            required
            options={deptOpts}
            value={state.department}
            onChange={(v) => setState({ department: v })}
            placeholder="Select Department"
          />
          <CustomSelect
            title="Degree Level"
            required
            options={TYPE_OPTS}
            value={state.degree_level}
            onChange={(v) => setState({ degree_level: v })}
            placeholder="UG / PG"
          />
          <CustomSelect
            title="Status"
            options={STATUS_OPTS}
            value={state.status}
            onChange={(v) => setState({ status: v })}
            placeholder="Active"
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-color2 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {submitting ? "Saving…" : isEdit ? "Update Programme" : "Create Programme"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ─── CREATE / EDIT BATCH MODAL ────────────────────────────────────────────────
export interface BatchFormData {
  name: string;
  programme_id: number;
  start_year: number;
  end_year: number;
  status: string;
  is_active: boolean;
}

interface BatchModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (formData: BatchFormData) => void;
  submitting?: boolean;
  programmeOptions?: { value: number | string; label: string }[];
}

export const CreateBatchModal = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
  programmeOptions,
}: BatchModalProps) => {
  const isEdit = !!initialData;
  const progOpts = programmeOptions ;

  const [state, setState] = useSetState({
    name: "",
    programme: null as any,
    start_year: "",
    end_year: "",
    status: null as any,
  });

  useEffect(() => {
    if (initialData) {
      const foundProg = progOpts.find(
        (p: any) =>
          p.value === initialData.programme_id ||
          p.label === initialData.programme_name ||
          p.label === initialData.programme
      );
      setState({
        name: initialData.name ?? initialData.batch ?? "",
        programme: foundProg ?? toOpt(initialData.programme_name || initialData.programme),
        start_year: String(initialData.start_year ?? initialData.startYear ?? ""),
        end_year: String(initialData.end_year ?? initialData.endYear ?? ""),
        status: toOpt(initialData.status),
      });
    } else {
      setState({
        name: "",
        programme: null,
        start_year: "",
        end_year: "",
        status: null,
      });
    }
  }, [initialData, open, progOpts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.name.trim()) {
      Failure("Please enter batch name");
      return;
    }
    if (!state.programme?.value) {
      Failure("Please select a programme");
      return;
    }
    if (!state.start_year) {
      Failure("Please enter start year");
      return;
    }
    if (!state.end_year) {
      Failure("Please enter end year");
      return;
    }

    onSubmit({
      name: state.name.trim(),
      programme_id: Number(state.programme.value) || 0,
      start_year: Number(state.start_year) || 0,
      end_year: Number(state.end_year) || 0,
      status: state.status?.value || "Draft",
      is_active: (state.status?.value || "Draft").toLowerCase() === "active",
    });
  };

  return (
    <ModalShell
      title={isEdit ? "Edit Batch" : "Create New Batch"}
      icon={
        isEdit ? (
          <Edit className="h-3.5 w-3.5" />
        ) : (
          <PlusIcon className="h-3.5 w-3.5" />
        )
      }
      open={open}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            title="Batch Name"
            required
            placeholder="e.g. Batch 2024-2028"
            value={state.name}
            onChange={(e) => setState({ name: e.target.value })}
          />
          <CustomSelect
            title="Programme"
            required
            options={progOpts}
            value={state.programme}
            onChange={(v) => setState({ programme: v })}
            placeholder="Select Programme"
          />
          <TextInput
            title="Start Year"
            required
            type="number"
            placeholder="e.g. 2024"
            value={state.start_year}
            onChange={(e) => setState({ start_year: e.target.value })}
          />
          <TextInput
            title="End Year"
            required
            type="number"
            placeholder="e.g. 2028"
            value={state.end_year}
            onChange={(e) => setState({ end_year: e.target.value })}
          />
        </div>
        <CustomSelect
          title="Status"
          options={BATCH_STATUS_OPTS}
          value={state.status}
          onChange={(v) => setState({ status: v })}
          placeholder="Select Status"
          className="mt-4"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="bg-color2 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {submitting ? "Saving…" : isEdit ? "Update Batch" : "Create Batch"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ─── CREATE / EDIT PSO MODAL ──────────────────────────────────────────────────
interface PSOModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: any;
}

export const CreatePSOModal = ({
  open,
  onClose,
  initialData,
}: PSOModalProps) => {
  const isEdit = !!initialData;
  const [state, setState] = useSetState({
    code: "",
    programme: null as any,
    description: "",
    status: null as any,
    version: "",
  });

  useEffect(() => {
    if (initialData) {
      setState({
        code: initialData.code ?? "",
        programme: toOpt(initialData.programme),
        description: initialData.description ?? "",
        status: toOpt(initialData.status),
        version: initialData.version ?? "",
      });
    } else {
      setState({
        code: "",
        programme: null,
        description: "",
        status: null,
        version: "",
      });
    }
  }, [initialData, open]);

  return (
    <ModalShell
      title={isEdit ? "Edit PSO" : "Create New PSO"}
      icon={
        isEdit ? (
          <Edit className="h-3.5 w-3.5" />
        ) : (
          <PlusIcon className="h-3.5 w-3.5" />
        )
      }
      open={open}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <TextInput
            title="PSO Code"
            required
            placeholder="e.g. PSO1"
            value={state.code}
            onChange={(e) => setState({ code: e.target.value })}
          />
          <CustomSelect
            title="Programme"
            required
            options={PROG_OPTS}
            value={state.programme}
            onChange={(v) => setState({ programme: v })}
            placeholder="Select Programme"
          />
        </div>
        <div className="mt-4">
          <TextArea
            title="Description"
            required
            rows={3}
            placeholder="e.g. Apply knowledge of computing..."
            value={state.description}
            onChange={(e) => setState({ description: e.target.value })}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <TextInput
            title="Version"
            required
            placeholder="e.g. v1.04"
            value={state.version}
            onChange={(e) => setState({ version: e.target.value })}
          />
          <CustomSelect
            title="Status"
            options={STATUS_OPTS}
            value={state.status}
            onChange={(v) => setState({ status: v })}
            placeholder="Active"
          />
        </div>
        <ModalFooter
          onClose={onClose}
          submitLabel={isEdit ? "Update PSO" : "Create PSO"}
        />
      </form>
    </ModalShell>
  );
};

// ─── ENROLL STUDENTS MODAL ────────────────────────────────────────────────────

export interface EnrollableStudent {
  id: string | number;
  regNo: string;
  name: string;
  programme: string;
  batch: string;
  email: string;
}

interface EnrollStudentsModalProps {
  open: boolean;
  onClose: () => void;
  courseCode?: string;
  courseTitle?: string;
  availableStudents?: EnrollableStudent[];
  onEnroll?: (selected: EnrollableStudent[]) => void;
}

export const EnrollStudentsModal = ({
  open,
  onClose,
  courseCode = "CS309",
  courseTitle = "Computer Networks",
  availableStudents = [],
  onEnroll,
}: EnrollStudentsModalProps) => {
  const [state, setState] = useSetState({
    search: "",
    selectedIds: new Set<string | number>(),
  });

  useEffect(() => {
    if (!open) {
      setState({
        search: "",
        selectedIds: new Set(),
      });
    }
  }, [open]);

  const filtered = availableStudents.filter((s) => {
    const q = state.search.toLowerCase();
    return (
      !q ||
      s.regNo.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
  });

  const toggle = (id: string | number) => {
    const next = new Set(state.selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setState({ selectedIds: next });
  };

  const handleEnroll = () => {
    const selected = availableStudents.filter((s) => state.selectedIds.has(s.id));
    onEnroll?.(selected);
    onClose();
  };

  const count = state.selectedIds.size;

  return (
    <ModalShell
      title="Enroll Students"
      subtitle={`Select existing students to add to ${courseCode} — ${courseTitle}.`}
      icon={<Users className="h-3.5 w-3.5" />}
      open={open}
      onClose={onClose}
    >
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#000]" />
        <input
          type="text"
          placeholder="Search students..."
          value={state.search}
          onChange={(e) => setState({ search: e.target.value })}
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-color2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* List label */}
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#000]">
        Available Students ({filtered.length})
      </p>

      {/* Student list */}
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-[#000]">No students found.</p>
        ) : (
          filtered.map((student) => {
            const isSelected = state.selectedIds.has(student.id);
            return (
              <button
                key={student.id}
                type="button"
                onClick={() => toggle(student.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${isSelected
                  ? "border-color2 bg-color2-l"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                  }`}
              >
                {/* checkbox */}
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-all ${isSelected ? "border-color2 bg-color2" : "border-gray-300"
                    }`}
                >
                  {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                </span>

                {/* info */}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${isSelected ? "text-color2" : "text-[#000] dark:text-white"}`}>
                    {student.regNo} — {student.name}
                  </p>
                  <p className="text-xs text-[#000]">
                    {student.programme} • Batch {student.batch}
                  </p>
                  <p className="text-xs text-[#000]">{student.email}</p>
                </div>

                {isSelected && (
                  <span className="shrink-0 rounded-full bg-color2-l px-2.5 py-0.5 text-xs font-semibold text-color2">
                    Selected
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
        <p className="text-sm font-semibold text-color2">
          {count > 0 ? `${count} student${count > 1 ? "s" : ""} selected` : ""}
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={count === 0}
            onClick={handleEnroll}
            className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition-all ${count === 0
              ? "cursor-not-allowed bg-color2/40"
              : "bg-color2 hover:opacity-90"
              }`}
          >
            Enroll {count > 0 ? `${count} Student${count > 1 ? "s" : ""}` : "Student"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};
