import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Users, CheckCircle2, Eye, Edit2, Trash2, Cloud } from "lucide-react";
import { useFormik } from "formik";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import Modal from "@/components/modal/modal.component";
import TextInput from "@/components/FormFields/TextInput.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import PrimaryButton from "@/components/FormFields/PrimaryButton.component";
import { CreateUserForm } from "@/utils/validation.utils";
import PrivateRouter from "@/hook/privateRouter";

type ModalType = "add_user" | "bulk_import" | null;

const ROLE_OPTIONS = [
  "All Roles",
  "Faculty",
  "Student",
  "Admin",
  "Course Instructor",
  "Course Coordinator",
];
const DEPARTMENT_OPTIONS = [
  "All Departments",
  "Computer Science & Engg.",
  "Electronics & Communication",
  "Artificial Intelligence & Data",
];
const PROGRAMME_OPTIONS = [
  "All Programmes",
  "B.E. Computer Science",
  "B.Tech Artificial Intelligence",
  "B.Tech Information Technology",
];
const BATCH_OPTIONS = ["All Batches", "2024-2028", "2025-2029", "2023-2027"];
const STATUS_OPTIONS = ["All Status", "Active", "Inactive", "Locked"];

// Mock user data
const MOCK_USERS = [
  {
    id: 1,
    initials: "AK",
    name: "Arun Kumar",
    joined: "Joined Jan 2021",
    email: "arun.kumar@karpagam.edu...",
    register_no: "FAC-CSE-018",
    role: "Course Coordinator",
    department: "Computer Science & Engg.",
    programme: "B.E. Computer Science a...",
    batch: "Faculty/Staff",
    status: "Active",
    color: "bg-purple-600",
  },
  {
    id: 2,
    initials: "PS",
    name: "Priya Selvan",
    joined: "Joined Jan 2022",
    email: "priya.selvan@karpagam.edu...",
    register_no: "FAC-CSE-042",
    role: "Course Instructor",
    department: "Computer Science & Engg.",
    programme: "B.E. Computer Science a...",
    batch: "Faculty/Staff",
    status: "Active",
    color: "bg-teal-600",
  },
  {
    id: 3,
    initials: "KR",
    name: "Kevin Raj",
    joined: "Joined Aug 2024",
    email: "kevin.raj@student.karpag...",
    register_no: "24CS1042",
    role: "Student",
    department: "Computer Science & Engg.",
    programme: "B.E. Computer Science a...",
    batch: "2024-2028",
    status: "Active",
    color: "bg-orange-600",
  },
  {
    id: 4,
    initials: "NK",
    name: "Nivetha Krishnan",
    joined: "Joined Aug 2024",
    email: "nivetha.k@student.karpag...",
    register_no: "24CS1088",
    role: "Student",
    department: "Computer Science & Engg.",
    programme: "B.E. Computer Science a...",
    batch: "2024-2028",
    status: "Active",
    color: "bg-pink-600",
  },
  {
    id: 5,
    initials: "SM",
    name: "Sanjay Murugan",
    joined: "Joined Jan 2020",
    email: "sanjay.murugan@karpagan...",
    register_no: "FAC-AIDS-012",
    role: "Course Instructor",
    department: "Artificial Intelligence & Da...",
    programme: "B.Tech Artificial Intelligen...",
    batch: "Faculty/Staff",
    status: "Invited",
    color: "bg-indigo-600",
  },
  {
    id: 6,
    initials: "HR",
    name: "Harini Ramesh",
    joined: "Joined Aug 2023",
    email: "harini.ramesh@student.ka...",
    register_no: "23AIO19",
    role: "Student",
    department: "Artificial Intelligence & Da...",
    programme: "B.Tech Artificial Intelligen...",
    batch: "2023-2027",
    status: "Locked",
    color: "bg-cyan-600",
  },
  {
    id: 7,
    initials: "VK",
    name: "Vignesh Kumar",
    joined: "Joined Jan 2020",
    email: "vignesh.kumar@karpagam.e...",
    register_no: "FAC-ECE-031",
    role: "Course Coordinator",
    department: "Electronics & Communicati...",
    programme: "B.E. Electronics & Comm...",
    batch: "Faculty/Staff",
    status: "Inactive",
    color: "bg-blue-600",
  },
  {
    id: 8,
    initials: "KR",
    name: "Keerthana Ravi",
    joined: "Joined Aug 2022",
    email: "keerthana.ravi@student.k...",
    register_no: "22IT055",
    role: "Student",
    department: "Information Technology",
    programme: "B.Tech Information Techn...",
    batch: "2022-2026",
    status: "Active",
    color: "bg-yellow-600",
  },
  {
    id: 9,
    initials: "NS",
    name: "Neena Subramanian",
    joined: "Joined Jan 2020",
    email: "neena.subramanian@karpag...",
    register_no: "ADM-ERP-001",
    role: "ERP Admin",
    department: "Academic Office & Exami...",
    programme: "Institutional Administration",
    batch: "Faculty/Staff",
    status: "Active",
    color: "bg-red-600",
  },
];

const DEFAULT_OPTIONS = {
  roles: [
    { label: "Faculty", value: "faculty" },
    { label: "Student", value: "student" },
    { label: "Admin", value: "admin" },
    { label: "Course Instructor", value: "course_instructor" },
    { label: "Course Coordinator", value: "course_coordinator" },
  ],
  departments: [
    { label: "Computer Science & Engg.", value: "cse" },
    { label: "Electronics & Communication", value: "ece" },
    { label: "Artificial Intelligence & Data", value: "ai" },
  ],
  programmes: [
    { label: "B.E. Computer Science", value: "becs" },
    { label: "B.Tech Artificial Intelligence", value: "btai" },
    { label: "B.Tech Information Technology", value: "btit" },
    { label: "B.E. Electronics & Comm.", value: "beece" },
  ],
  batches: [
    { label: "2024-2028", value: "2024-2028" },
    { label: "2025-2029", value: "2025-2029" },
    { label: "2023-2027", value: "2023-2027" },
    { label: "2022-2026", value: "2022-2026" },
  ],
};

const UserList = () => {
  const dispatch = useDispatch();

  const [state, setState] = useSetState({
    search: "",
    roleFilter: "All Roles",
    departmentFilter: "All Departments",
    programmeFilter: "All Programmes",
    batchFilter: "All Batches",
    statusFilter: "All Status",
    modalOpen: false,
    modalType: null as ModalType,
    loading: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("Users"));
  }, []);

  // Filter helpers
  const bySearch = (row: any) => {
    const s = state.search.toLowerCase();
    return (
      !s ||
      String(row.name || "")
        .toLowerCase()
        .includes(s) ||
      String(row.email || "")
        .toLowerCase()
        .includes(s) ||
      String(row.register_no || "")
        .toLowerCase()
        .includes(s)
    );
  };

  const byRole = (row: any) =>
    state.roleFilter === "All Roles" || row.role === state.roleFilter;

  const byDepartment = (row: any) =>
    state.departmentFilter === "All Departments" ||
    row.department === state.departmentFilter;

  // Filtered records
  const filteredRecords = MOCK_USERS.filter(
    (r) => bySearch(r) && byRole(r) && byDepartment(r),
  );

  // Handle modal submit
  const handleModalSubmit = async (data: any) => {
    console.log("User added:", data);
    setState({ modalOpen: false, modalType: null });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; dot: string }> =
      {
        Active: {
          bg: "bg-green-50",
          text: "text-green-700",
          dot: "bg-green-600",
        },
        Inactive: {
          bg: "bg-gray-50",
          text: "text-[#000]",
          dot: "bg-gray-600",
        },
        Locked: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-600" },
        Invited: {
          bg: "bg-blue-50",
          text: "text-blue-700",
          dot: "bg-blue-600",
        },
      };
    const config = statusMap[status] || statusMap.Active;
    return config;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-6 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#000] dark:text-white">
                  Users
                </h1>
                <p className="text-sm text-[#000] dark:text-[#000]">
                  9 Total Registered
                </p>
              </div>
            </div>
            <p className="mt-2 text-sm text-[#000] dark:text-[#000]">
              Institution:{" "}
              <span className="font-semibold">
                Karpagam Institutions, Coimbatore
              </span>{" "}
              • Admin: <span className="font-semibold">Meena Subramanian</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() =>
                setState({ modalOpen: true, modalType: "bulk_import" })
              }
              className="rounded-xl border border-gray-300 px-4 py-1 text-sm font-semibold text-[#000] transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              ⬇️ Bulk Import
            </button>
            <button
              onClick={() =>
                setState({ modalOpen: true, modalType: "add_user" })
              }
              className="bg-color2 hover:bg-color2 flex items-center gap-2 rounded-xl px-4 py-1 text-sm font-semibold text-white transition hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600"
            >
              + Add User
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 px-6 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#000]">
              <IconSearch className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by name, email, register number..."
              value={state.search}
              onChange={(e) => setState({ search: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-purple-400"
            />
          </div>

          <select
            value={state.roleFilter}
            onChange={(e) => setState({ roleFilter: e.target.value })}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-[#000] outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-purple-400"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>

          <select
            value={state.departmentFilter}
            onChange={(e) => setState({ departmentFilter: e.target.value })}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-[#000] outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-purple-400"
          >
            {DEPARTMENT_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>

          <select
            value={state.programmeFilter}
            onChange={(e) => setState({ programmeFilter: e.target.value })}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-[#000] outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-purple-400"
          >
            {PROGRAMME_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>

          <select
            value={state.batchFilter}
            onChange={(e) => setState({ batchFilter: e.target.value })}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-[#000] outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-purple-400"
          >
            {BATCH_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>

          <select
            value={state.statusFilter}
            onChange={(e) => setState({ statusFilter: e.target.value })}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-[#000] outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-purple-400"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* User Directory */}
        <div>
          <h3 className="mb-4 text-sm font-semibold text-[#000] dark:text-gray-300">
            User Directory ({filteredRecords.length} shown of{" "}
            {MOCK_USERS.length})
          </h3>

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#000] dark:text-gray-300">
                    NAME / JOINED
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#000] dark:text-gray-300">
                    EMAIL
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#000] dark:text-gray-300">
                    REGISTER NO.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#000] dark:text-gray-300">
                    ROLE
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#000] dark:text-gray-300">
                    DEPARTMENT
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#000] dark:text-gray-300">
                    PROGRAMME
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#000] dark:text-gray-300">
                    BATCH
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#000] dark:text-gray-300">
                    STATUS
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#000] dark:text-gray-300">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((user) => {
                  const statusConfig = getStatusBadge(user.status);
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${user.color} text-sm font-semibold text-white`}
                          >
                            {user.initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#000] dark:text-white">
                              {user.name}
                            </p>
                            <p className="text-xs text-pri">
                              {user.joined}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-[#000] dark:text-[#000]">
                          <span>📧</span>
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#000] dark:text-[#000]">
                        {user.register_no}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#000] dark:text-[#000]">
                        {user.department}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#000] dark:text-[#000]">
                        {user.programme}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#000] dark:text-[#000]">
                        {user.batch}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${statusConfig.dot}`}
                          />
                          <span
                            className={`text-sm font-semibold ${statusConfig.text}`}
                          >
                            {user.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="rounded-lg p-2 text-pri transition hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="rounded-lg p-2 text-pri transition hover:bg-gray-100 dark:hover:bg-gray-700">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="rounded-lg p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {state.modalType === "add_user" && (
        <AddUserModal
          open={state.modalOpen}
          close={() => setState({ modalOpen: false, modalType: null })}
          onSubmit={handleModalSubmit}
        />
      )}
      {state.modalType === "bulk_import" && (
        <BulkImportModal
          open={state.modalOpen}
          close={() => setState({ modalOpen: false, modalType: null })}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
};

// Add User Modal Component
interface AddUserModalProps {
  open: boolean;
  close: () => void;
  onSubmit: (data: any) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  open,
  close,
  onSubmit,
}) => {
  const formik = useFormik({
    initialValues: {
      first_name: "",
      last_name: "",
      email: "",
      register_number: "",
      role: "",
      department: "",
      programme: "",
      batch: "",
    },
    validationSchema: CreateUserForm,
    onSubmit: async (values) => {
      await onSubmit(values);
      handleClose();
    },
  });

  const handleClose = () => {
    formik.resetForm();
    close();
  };

  return (
    <Modal
      open={open}
      close={handleClose}
      subTitle="Add New User"
      modalIcon={<Users className="h-6 w-6 text-color2" />}
      closeIcon
      maxWidth="max-w-2xl"
      renderComponent={() => (
        <form onSubmit={formik.handleSubmit}>
          <div className="space-y-5">
            {/* Description */}
            <p className="text-sm text-[#000] dark:text-[#000]">
              Add a user and assign their role, department, programme, and
              batch.
            </p>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <TextInput
                name="first_name"
                title="First Name"
                placeholder="e.g. Arun"
                value={formik.values.first_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.first_name && formik.errors.first_name}
                required
              />
              <TextInput
                name="last_name"
                title="Last Name"
                placeholder="e.g. Kumar"
                value={formik.values.last_name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.last_name && formik.errors.last_name}
                required
              />
            </div>

            {/* Email */}
            <TextInput
              name="email"
              title="Email"
              placeholder="e.g. arun.kumar@vetri.edu.in"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && formik.errors.email}
              required
            />

            {/* Register Number */}
            <TextInput
              name="register_number"
              title="Register / Employee Number"
              placeholder="E.G. 24CS1042 OR FAC-CSE-018"
              value={formik.values.register_number}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.register_number && formik.errors.register_number
              }
              required
            />

            {/* Role & Department */}
            <div className="grid grid-cols-2 gap-4">
              <CustomSelect
                title="Role"
                options={DEFAULT_OPTIONS.roles}
                value={
                  DEFAULT_OPTIONS.roles.find(
                    (opt) => opt.value === formik.values.role,
                  ) || null
                }
                onChange={(selected) =>
                  formik.setFieldValue("role", selected?.value || "")
                }
                error={formik.touched.role && formik.errors.role}
                required
              />
              <CustomSelect
                title="Department"
                options={DEFAULT_OPTIONS.departments}
                value={
                  DEFAULT_OPTIONS.departments.find(
                    (opt) => opt.value === formik.values.department,
                  ) || null
                }
                onChange={(selected) =>
                  formik.setFieldValue("department", selected?.value || "")
                }
                error={formik.touched.department && formik.errors.department}
                required
              />
            </div>

            {/* Programme & Batch */}
            <div className="grid grid-cols-2 gap-4">
              <CustomSelect
                title="Programme"
                options={DEFAULT_OPTIONS.programmes}
                value={
                  DEFAULT_OPTIONS.programmes.find(
                    (opt) => opt.value === formik.values.programme,
                  ) || null
                }
                onChange={(selected) =>
                  formik.setFieldValue("programme", selected?.value || "")
                }
                error={formik.touched.programme && formik.errors.programme}
                required
              />
              <CustomSelect
                title="Batch"
                options={DEFAULT_OPTIONS.batches}
                value={
                  DEFAULT_OPTIONS.batches.find(
                    (opt) => opt.value === formik.values.batch,
                  ) || null
                }
                onChange={(selected) =>
                  formik.setFieldValue("batch", selected?.value || "")
                }
                error={formik.touched.batch && formik.errors.batch}
                required
              />
            </div>

            {/* Info Box */}
            <div className="flex gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <span className="text-lg">📧</span>
              </div>
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-semibold">Upon saving,</span> an
                  automated welcome email with initial temporary access
                  credentials and OBE orientation will be queued for immediate
                  delivery.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-5">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-gray-200 px-6 py-2 text-[#000] transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <PrimaryButton
                type="submit"
                text="Create User"
                className="bg-color2 hover:bg-color2 "
                disabled={formik.isSubmitting}
              />
            </div>
          </div>
        </form>
      )}
    />
  );
};

// Bulk Import Modal Component
interface BulkImportModalProps {
  open: boolean;
  close: () => void;
  onSubmit: (data: any) => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ open, close }) => {
  const [step, setStep] = useState<"upload" | "success">("upload");
  const [selectedRole, setSelectedRole] = useState("student");
  const [selectedBatch, setSelectedBatch] = useState("2024-2028");
  const [selectedDepartment, setSelectedDepartment] = useState("cse");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.type === "text/csv" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setSelectedFile(file);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (
        file.type === "text/csv" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
        setSelectedFile(file);
      }
    }
  };

  const handleValidateFile = () => {
    if (selectedFile) {
      setUploadedCount(3);
      setStep("success");
    }
  };

  const handleCloseSuccess = () => {
    setStep("upload");
    setSelectedFile(null);
    setUploadedCount(0);
    close();
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      [
        "Email",
        "Register Number",
        "First Name",
        "Last Name",
        "Programme",
        "Department",
        "Batch",
      ],
      [
        "arun.kumar@karpagam.edu.in",
        "FAC-CSE-018",
        "Arun",
        "Kumar",
        "B.E. Computer Science",
        "Computer Science & Engg.",
        "Faculty/Staff",
      ],
      [
        "kevin.raj@student.karpagam.edu.in",
        "24CS1042",
        "Kevin",
        "Raj",
        "B.E. Computer Science",
        "Computer Science & Engg.",
        "2024-2028",
      ],
    ];
    const csv = csvContent
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bulk-import-template.csv";
    link.click();
  };

  if (step === "success") {
    return (
      <Modal
        open={open}
        close={handleCloseSuccess}
        subTitle="Bulk User Import"
        modalIcon={<Cloud className="h-6 w-6 text-color2" />}
        closeIcon
        maxWidth="max-w-2xl"
        renderComponent={() => (
          <div className="rounded-3xl border-2 border-green-300 bg-gradient-to-b from-green-50 to-green-100/50 p-16 dark:border-green-700 dark:from-green-950/40 dark:to-green-900/30">
            <div className="flex flex-col items-center justify-center gap-8">
              {/* Checkmark Circle */}
              <div className="flex h-28 w-28 items-center justify-center">
                <div className="relative flex h-full w-full items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-green-500 dark:border-green-400" />
                  <svg
                    className="h-16 w-16 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Text Content */}
              <div className="text-center">
                <h3 className="text-3xl font-bold text-[#000] dark:text-white">
                  Bulk Ingestion Completed
                </h3>
                <p className="mt-4 text-lg font-medium text-green-700 dark:text-green-300">
                  {uploadedCount} user account{uploadedCount !== 1 ? "s" : ""}{" "}
                  successfully added and queued for email delivery.
                </p>
              </div>

              {/* Button */}
              <button
                onClick={handleCloseSuccess}
                className="mt-2 rounded-full bg-green-600 px-12 py-4 text-base font-semibold text-white shadow-md transition hover:bg-green-700 hover:shadow-lg dark:bg-green-600 dark:hover:bg-green-700"
              >
                Close & View Directory
              </button>
            </div>
          </div>
        )}
      />
    );
  }

  return (
    <Modal
      open={open}
      close={close}
      subTitle="Bulk User Import"
      modalIcon={<Cloud className="h-6 w-6 text-color2" />}
      closeIcon
      maxWidth="max-w-2xl"
      renderComponent={() => (
        <div className="space-y-5">
          <p className="text-sm text-[#000] dark:text-[#000]">
            Import multiple users from CSV or Excel.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              title="User Role"
              options={[
                { label: "Student", value: "student" },
                { label: "Faculty", value: "faculty" },
                { label: "Admin", value: "admin" },
              ]}
              value={
                [
                  { label: "Student", value: "student" },
                  { label: "Faculty", value: "faculty" },
                  { label: "Admin", value: "admin" },
                ].find((opt) => opt.value === selectedRole) || null
              }
              onChange={(selected) =>
                setSelectedRole((selected?.value as string) || "student")
              }
              required
            />

            <CustomSelect
              title="Batch"
              options={[
                { label: "2024-2028", value: "2024-2028" },
                { label: "2025-2029", value: "2025-2029" },
                { label: "2023-2027", value: "2023-2027" },
                { label: "Faculty/Staff", value: "faculty" },
              ]}
              value={
                [
                  { label: "2024-2028", value: "2024-2028" },
                  { label: "2025-2029", value: "2025-2029" },
                  { label: "2023-2027", value: "2023-2027" },
                  { label: "Faculty/Staff", value: "faculty" },
                ].find((opt) => opt.value === selectedBatch) || null
              }
              onChange={(selected) =>
                setSelectedBatch((selected?.value as string) || "2024-2028")
              }
              required
            />
          </div>

          <CustomSelect
            title="Department"
            options={[
              { label: "Computer Science & Engg.", value: "cse" },
              { label: "Electronics & Communication", value: "ece" },
              { label: "Artificial Intelligence & Data", value: "ai" },
            ]}
            value={
              [
                { label: "Computer Science & Engg.", value: "cse" },
                { label: "Electronics & Communication", value: "ece" },
                { label: "Artificial Intelligence & Data", value: "ai" },
              ].find((opt) => opt.value === selectedDepartment) || null
            }
            onChange={(selected) =>
              setSelectedDepartment((selected?.value as string) || "cse")
            }
            required
          />

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed transition-colors ${
              dragActive
                ? "border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-950"
                : "border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950"
            }`}
          >
            <input
              type="file"
              id="file-input"
              accept=".csv,.xlsx"
              onChange={handleChange}
              className="hidden"
            />
            <label
              htmlFor="file-input"
              className="flex cursor-pointer flex-col items-center justify-center gap-3 px-6 py-12"
            >
              <div className="text-3xl">📋</div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#000] dark:text-white">
                  Drop CSV or Excel (.xlsx) file here, or{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    browse
                  </span>
                </p>
                <p className="mt-2 text-xs text-[#000] dark:text-[#000]">
                  Expected columns: Email, Register Number, First Name, Last
                  Name (Optional), Programme, Department, Batch
                </p>
              </div>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <span>✅</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  File selected and ready to validate
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-sm text-[#000] dark:text-[#000]">
              Need the standard CSV structure?
            </p>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ⬇️ Download Template
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-5">
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-gray-200 px-6 py-2 text-[#000] transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleValidateFile}
              disabled={!selectedFile}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
            >
              ▶️ Validate File
            </button>
          </div>
        </div>
      )}
    />
  );
};

export default PrivateRouter(UserList);
