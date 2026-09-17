import { useState, useEffect } from "react";
import { Edit, Info, PlusIcon, X, Eye, EyeOff } from "lucide-react";
import TextInput from "@/components/FormFields/TextInput.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import { Failure } from "@/utils/function.utils";

const toOpts = (arr: string[]) => arr.map((v) => ({ value: v, label: v }));
const toOpt  = (v: string | null | undefined) => v ? { value: v, label: v } : null;

const ROLE_OPTS   = toOpts(["Course Coordinator", "Course Instructor", "Student", "ERP Admin"]);
const DEPT_OPTS   = toOpts(["Computer Science & Engineering", "Electronics & Communication", "Artificial Intelligence", "Information Technology", "Mechanical Engineering"]);
const PROG_OPTS   = toOpts(["B.E. Computer Science and Engineering", "B.Tech Electronics & Communication", "D.Tech Artificial Intelligence", "D.Tech Information Technology", "MBA"]);
const BATCH_OPTS  = toOpts(["2024-2028", "2023-2027", "2022-2026", "2021-2025", "Faculty / Staff"]);
const STATUS_OPTS = toOpts(["Active", "Inactive", "Locked"]);

const useLockBodyScroll = (active: boolean) => {
  useEffect(() => {
    if (active) document.body.style.overflow = "hidden";
    else        document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [active]);
};

const useAnimatedVisibility = (open: boolean, duration = 220) => {
  const [visible, setVisible] = useState(open);
  const [closing, setClosing] = useState(false);
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

interface Props {
  open: boolean;
  onClose: () => void;
  initialData?: any;
  onSubmit: (formData: any) => void;
  submitting?: boolean;
  departmentOptions?: { value: any; label: string }[];
  programmeOptions?: { value: any; label: string }[];
  batchOptions?: { value: any; label: string }[];
  roleOptions?: { value: any; label: string }[];
  statusOptions?: { value: any; label: string }[];
}

const AddUserModal = ({
  open,
  onClose,
  initialData,
  onSubmit,
  submitting = false,
  departmentOptions,
  programmeOptions,
  batchOptions,
  roleOptions,
  statusOptions,
}: Props) => {
  const isEdit = !!initialData;

  const deptOpts = departmentOptions || [];
  const progOpts = programmeOptions || [];
  const batchOpts = batchOptions || [];
  const roleOpts = roleOptions || [];
  const statusOpts = statusOptions || [];

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    regNo: "",
    role: null as any,
    department: null as any,
    programme: null as any,
    batch: null as any,
    status: { value: "Active", label: "Active" } as any,
  });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setShowPassword(false);
    }
  }, [open]);

  useEffect(() => {
    if (initialData) {
      const first = initialData.first_name || (initialData.name ? initialData.name.split(" ")[0] : "");
      const last = initialData.last_name || (initialData.name ? initialData.name.split(" ").slice(1).join(" ") : "");
      const normRole = initialData.role === "ERP_ADMIN" ? "ERP Admin" : initialData.role;

      const deptMatch =
        deptOpts.find(
          (o: any) =>
            o.value === initialData.department_id ||
            o.label === (initialData.department?.department_name || initialData.department_name || initialData.department)
        ) || (initialData.department ? toOpt(initialData.department?.department_name || initialData.department_name || initialData.department) : null);

      const progMatch =
        progOpts.find(
          (o: any) =>
            o.value === initialData.programme_id ||
            o.label === (initialData.programme?.programme_name || initialData.programme_name || initialData.programme)
        ) || (initialData.programme ? toOpt(initialData.programme?.programme_name || initialData.programme_name || initialData.programme) : null);

      const batchMatch =
        batchOpts.find(
          (o: any) =>
            o.value === initialData.batch_id ||
            o.label === (initialData.batch?.name || initialData.batch_name || initialData.batch)
        ) || (initialData.batch ? toOpt(initialData.batch?.name || initialData.batch_name || initialData.batch) : null);

      const roleMatch =
        roleOpts.find((o: any) => o.value === normRole || o.label === normRole) ||
        toOpt(normRole);

      setForm({
        firstName:  first,
        lastName:   last,
        email:      initialData.email  ?? "",
        password:   "",
        regNo:      initialData.regNo  ?? initialData.registry_number ?? (initialData.id ? `USR-${String(initialData.id).padStart(4, "0")}` : ""),
        role:       roleMatch,
        department: deptMatch,
        programme:  progMatch,
        batch:      batchMatch,
        status:     toOpt(initialData.is_active === false || initialData.status?.toLowerCase() === "inactive" ? "Inactive" : "Active"),
      });
    } else {
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        regNo: "",
        role: null,
        department: null,
        programme: null,
        batch: null,
        status: { value: "Active", label: "Active" }
      });
    }
  }, [initialData, open, departmentOptions, programmeOptions, batchOptions, roleOptions, statusOptions]);

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim()) {
      Failure("Please enter first name");
      return;
    }
    if (!form.lastName.trim()) {
      Failure("Please enter last name");
      return;
    }
    if (!form.email.trim()) {
      Failure("Please enter email");
      return;
    }
    if (!isEdit && !form.password.trim()) {
      Failure("Please enter password");
      return;
    }
    if (!form.role?.value) {
      Failure("Please select a role");
      return;
    }

    const isStudent = form.role.value === "Student";
    const isActive = (form.status?.value ?? "Active").toLowerCase() === "active";

    onSubmit({
      ...form,
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password ? form.password.trim() : undefined,
      role: form.role.value,
      status: form.status?.value ?? "Active",
      is_active: isActive,
      is_staff: !isStudent,
      department_id: form.department?.value && Number(form.department.value) > 0 ? Number(form.department.value) : null,
      programme_id: form.programme?.value && Number(form.programme.value) > 0 ? Number(form.programme.value) : null,
      batch_id: form.batch?.value && Number(form.batch.value) > 0 ? Number(form.batch.value) : null,
      regNo: form.regNo?.trim() || undefined,
    });
  };

  const { visible, closing } = useAnimatedVisibility(open);
  useLockBodyScroll(visible);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        style={{ animation: closing ? "fadeOut 0.22s ease forwards" : "fadeIn 0.22s ease" }}
        onClick={onClose}
      />

      {/* Right-side drawer */}
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-gray-900"
        style={{ animation: closing ? "slideOutRight 0.22s ease forwards" : "slideInRight 0.22s ease" }}
      >

        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-200 text-color2">
              {isEdit
                ? <Edit className="h-4 w-4" />
                : <PlusIcon className="h-4 w-4" />
              }
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#000] dark:text-white">
                {isEdit ? "Edit User" : "Add New User"}
              </h3>
              <p className="mt-0.5 text-xs text-[#000]">
                Fill in user details: role, department, programme and batch.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 rounded-full border border-gray-400 p-0.5 text-[#000] hover:text-[#000] dark:hover:text-gray-200"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form id="user-form" onSubmit={handleSubmit}>
            <div className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <TextInput title="First Name" required placeholder="e.g. Arun"  value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
                <TextInput title="Last Name"  required placeholder="e.g. Kumar" value={form.lastName}  onChange={(e) => set("lastName",  e.target.value)} />
              </div>

              <TextInput title="Email" required type="email" placeholder="e.g. arun@karpagam.edu" value={form.email} onChange={(e) => set("email", e.target.value)} />

              <TextInput
                title={isEdit ? "Password (leave blank to keep current)" : "Password"}
                required={!isEdit}
                type={showPassword ? "text" : "password"}
                placeholder="e.g. erp@123"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                rightIcon={
                  showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                  )
                }
                rightIconOnlick={() => setShowPassword((prev) => !prev)}
              />

              <TextInput title="Registry / Employee Number" placeholder="e.g. FAC-CSE-038 / 24C0068" value={form.regNo} onChange={(e) => set("regNo", e.target.value)} />

              <CustomSelect title="Role"       required options={roleOpts}   value={form.role}       onChange={(v) => set("role",       v)} placeholder="Select role..." />
              <CustomSelect title="Department" options={deptOpts}   value={form.department} onChange={(v) => set("department", v)} placeholder="Select department..." />
              <CustomSelect title="Programme"  options={progOpts}   value={form.programme}  onChange={(v) => set("programme",  v)} placeholder="Select programme..." />
              <CustomSelect title="Batch"      options={batchOpts}  value={form.batch}      onChange={(v) => set("batch",      v)} placeholder="Select batch..." />
              <CustomSelect title="Status"     options={statusOpts} value={form.status}     onChange={(v) => set("status",     v)} placeholder="Active" />

              {/* Info notice */}
              <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Upon saving, an automated welcome email with initial temporary access credentials and OBC clearance will be queued for immediate delivery.
                </p>
              </div>

            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
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
            form="user-form"
            disabled={submitting}
            className="bg-color2 flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {submitting && (
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {submitting ? "Saving…" : isEdit ? "Update User" : "Create User"}
          </button>
        </div>
      </div>
    </>
  );
};

export default AddUserModal;
