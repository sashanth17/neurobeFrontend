import { useEffect, useState } from "react";
import { Edit, PlusIcon, Loader2 } from "lucide-react";
import * as Yup from "yup";
import { ModalShell } from "@/components/academic-setup/AddModals";
import TextInput from "@/components/FormFields/TextInput.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { useSetState, Failure, Success, getAuthUser } from "@/utils/function.utils";
import Models from "@/imports/models.import";

type DropdownOption = { value: string | number; label: string };

const REQUEST_TIMEOUT_MS = 20000;

const withTimeout = <T,>(promise: Promise<T>, timeoutMs = REQUEST_TIMEOUT_MS): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Request timed out. Please check your network connection and try again."));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

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
  defaultCourseId?: string | number;
  defaultCourseName?: string;
}

const CourseOfferingModal = ({ open, onClose, initialData, onSuccess, defaultCourseId, defaultCourseName }: Props) => {
  const isEdit = !!initialData;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [state, setState] = useSetState({
    // form fields
    course_instance_name: "",
    programme: null as any,
    department: null as any,
    term: null as any,
    course: null as any,
    term_visibility: true,
    is_archived: false,
    // validation errors
    errors: {} as Record<string, string>,
    // dropdown options
    programmeList: [] as DropdownOption[],
    departmentList: [] as DropdownOption[],
    courseList: [] as DropdownOption[],
  });

  useEffect(() => {
    if (open) {
      setIsSubmitting(false);
      initModalData();
    }
  }, [open, initialData, defaultCourseId, defaultCourseName]);

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
      const authUser = getAuthUser();
      const userId = authUser?.id || 1;
      let raw: any[] = [];
      try {
        const res: any = await Models.course.my_assigned_courses({ faculty_id: userId });
        if (res?.courses && Array.isArray(res.courses)) raw = res.courses;
        else if (Array.isArray(res)) raw = res;
      } catch (e) {
        console.warn("my_assigned_courses error in modal:", e);
      }

      if (raw.length === 0) {
        try {
          const res2: any = await Models.course.faculty_dashboard_overview({ faculty_id: userId, coordinator_id: userId });
          if (res2?.courses && Array.isArray(res2.courses)) raw = res2.courses;
          else if (Array.isArray(res2)) raw = res2;
        } catch (e2) {
          console.warn("faculty_dashboard_overview error in modal:", e2);
        }
      }

      const seen = new Set<string>();
      const opts: DropdownOption[] = [];
      for (const item of raw) {
        const val = item.course_id || item.id;
        if (!val || seen.has(String(val))) continue;
        seen.add(String(val));
        const code = item.course_code || item.code || "";
        const title = item.course_title || item.title || item.name || `Course #${val}`;
        opts.push({
          value: val,
          label: code ? `${code} - ${title}` : title,
        });
      }
      return opts;
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
        term_visibility: initialData.term_visibility ?? true,
        is_archived: initialData.is_archived ?? false,
        errors: {},
      });
    } else {
      let matchedCrs = defaultCourseId ? crses.find((c) => String(c.value) === String(defaultCourseId)) : null;
      if (!matchedCrs && defaultCourseId) {
        matchedCrs = {
          value: defaultCourseId,
          label: defaultCourseName || `Course #${defaultCourseId}`,
        };
      }
      setState({
        course_instance_name: "",
        programme: null,
        department: null,
        term: null,
        course: matchedCrs || null,
        term_visibility: true,
        is_archived: false,
        errors: {},
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const authUser = getAuthUser();

    const values = {
      organization_id: authUser?.organization_id || 0,
      course_id: state.course?.value,
      course_instance_name: state.course_instance_name,
      programme_id: state.programme?.value,
      department_id: state.department?.value,
      semester: Number(state.term?.value),
      is_active: true,
      term_visibility: Boolean(state.term_visibility),
      is_archived: Boolean(state.is_archived),
      created_by_id: authUser?.id || 0,
      created_on: new Date().toISOString(),
    };

    // 1. Schema Validation
    try {
      await schema.validate(values, { abortEarly: false });
      setState({ errors: {} });
    } catch (err: any) {
      const errors: Record<string, string> = {};
      err.inner?.forEach((e: any) => {
        errors[e.path] = e.message;
      });
      setState({ errors });
      return;
    }

    // 2. API Request with Loading and Timeout
    setIsSubmitting(true);
    try {
      let response: any = null;
      if (isEdit && initialData?.id) {
        response = await withTimeout(Models.course_instance.update(initialData.id, values));
        Success("Course Offering updated successfully.");
      } else {
        response = await withTimeout(Models.course_instance.create(values));
        Success("Course Offering created successfully.");
      }
      console.log("response", response);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Error saving course offering:", err);
      const errMsg =
        typeof err === "string"
          ? err
          : err?.message || "Failed to save course offering. Please try again.";
      Failure(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Full-screen Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate__animated animate__fadeIn">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-center max-w-sm mx-4">
            <div className="relative flex items-center justify-center">
              <div className="h-16 w-16 rounded-full border-4 border-purple-200 dark:border-purple-900/40 border-t-purple-600 animate-spin" />
              <Loader2 className="absolute h-8 w-8 text-purple-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {isEdit ? "Updating Course Offering..." : "Creating Course Offering..."}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Please wait while we process your request. This will take just a moment.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-purple-50 px-3.5 py-1 text-[11px] font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
              <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
              <span>Communicating with server...</span>
            </div>
          </div>
        </div>
      )}

      <ModalShell
        title={isEdit ? "Edit Course Offering" : "Create Course Offering"}
        icon={isEdit ? <Edit className="w-3.5 h-3.5" /> : <PlusIcon className="w-3.5 h-3.5" />}
        open={open}
        onClose={() => {
          if (!isSubmitting) onClose();
        }}
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

            {/* Resolved Course (Locked when opened from a specific course) */}
            {defaultCourseId ? (
              <div>
                <label className="text-sm font-semibold text-[#000] dark:text-white mb-1.5 block">
                  Course <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-100/90 px-3.5 py-2.5 text-sm font-medium text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <span className="font-semibold">
                    {state.course?.label || defaultCourseName || `Course #${defaultCourseId}`}
                  </span>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-lg dark:bg-purple-950/60 dark:text-purple-300">
                    Fixed to Course
                  </span>
                </div>
              </div>
            ) : (
              <CustomSelect
                title="Course"
                required
                options={state.courseList}
                value={state.course}
                onChange={(v) => setState({ course: v })}
                placeholder="Select Course"
                error={state.errors?.course}
              />
            )}

            {/* Visibility and Archive Settings */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 space-y-3 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#000] dark:text-white">Student Visibility</p>
                  <p className="text-xs text-pri">Allow enrolled students to view course materials in their dashboard</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.term_visibility}
                    onChange={(e) => setState({ term_visibility: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-color2"></div>
                </label>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#000] dark:text-white">Archive Offering</p>
                  <p className="text-xs text-pri">Hide from active dashboard and place in Archived section</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.is_archived}
                    onChange={(e) => setState({ is_archived: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-gray-200 px-5 py-2 text-sm text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-color2 flex items-center justify-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{isEdit ? "Updating..." : "Creating..."}</span>
                </>
              ) : (
                <span>{isEdit ? "Update Offering" : "Create Offering"}</span>
              )}
            </button>
          </div>
        </form>
      </ModalShell>
    </>
  );
};

export default CourseOfferingModal;
