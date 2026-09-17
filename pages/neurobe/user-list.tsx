import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Upload, Users } from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState, Success, Failure, showDeleteAlert, getOrganizationId, Dropdown } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import IconPlus from "@/components/Icon/IconPlus";
import {
  MOCK_USERS,
  makeUserListColumns,
} from "@/components/user-list/userListColumns";
import AddUserModal from "@/components/user-list/AddUserModal";
import BulkImportModal from "@/components/user-list/BulkImportModal";
import PrivateRouter from "@/hook/privateRouter";
import TableComponent from "@/components/common-components/TableComponent";
import PageHeader from "@/components/common-components/PageHeader";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import TextInput from "@/components/FormFields/TextInput.component";
import Models from "@/imports/models.import";
import useDebounce from "@/hook/useDebounce";
import { useRouter } from "next/router";
import { DROPDOWN_ROLES } from "@/utils/constant.utils";

const ROLE_OPTIONS = [
  { value: "All Roles", label: "All Roles" },
  ...DROPDOWN_ROLES,
];

const STATUS_OPTIONS = [
  { value: "All Status", label: "All Status" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const MODAL_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const UserList = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [state, setState] = useSetState({
    search: "",
    roleFilter: null as any,
    deptFilter: null as any,
    progFilter: null as any,
    batchFilter: null as any,
    statusFilter: null as any,
    loading: false,
    submitting: false,
    showModal: false,
    showBulkModal: false,
    editRow: null as any,
    page: 1,
    userList: null as any[] | null,
    departmentList: null as any[] | null,
    programmeList: null as any[] | null,
    batchList: null as any[] | null,
  });

  const debouncedSearch = useDebounce(state.search, 500);

  const openCreate = () => {
    getDepartmentList();
    getProgrammeList();
    getBatchList();
    setState({ showModal: true, editRow: null });
  };
  const openEdit = (row: any) => {
    getDepartmentList();
    getProgrammeList();
    getBatchList();
    setState({ showModal: true, editRow: row });
  };
  const closeModal = () => setState({ showModal: false, editRow: null });

  // ── Pre-load Master Lists ──────────────────────────────────────────────────
  const getDepartmentList = async () => {
    try {
      const res: any = await Models.department.list({ organization_id: getOrganizationId() }, 1);
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({ departmentList: list });
    } catch (error) {
      console.log("department list error", error);
    }
  };

  const getProgrammeList = async () => {
    try {
      const res: any = await Models.programme.list({ organization_id: getOrganizationId() }, 1);
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({ programmeList: list });
    } catch (error) {
      console.log("programme list error", error);
    }
  };

  const getBatchList = async () => {
    try {
      const res: any = await Models.batch.list({ organization_id: getOrganizationId() }, 1);
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({ batchList: list });
    } catch (error) {
      console.log("batch list error", error);
    }
  };

  // ── Dynamic Options via Dropdown helper ────────────────────────────────────
  const modalDepartmentOptions = Dropdown(state.departmentList, "department_name");
  const modalProgrammeOptions = Dropdown(state.programmeList, "programme_name");
  const modalBatchOptions = Dropdown(state.batchList, "name");

  const departmentOptions = [
    { value: "All Departments", label: "All Departments" },
    ...modalDepartmentOptions,
  ];

  const programmeOptions = [
    { value: "All Programmes", label: "All Programmes" },
    ...modalProgrammeOptions,
  ];

  const batchOptions = [
    { value: "All Batches", label: "All Batches" },
    ...modalBatchOptions,
  ];

  // ── Body Params for List API ───────────────────────────────────────────────
  const bodyData = (searchVal = debouncedSearch) => {
    let body: any = {
      organization_id: getOrganizationId(),
    };
    if (searchVal) {
      body.search = searchVal;
    }
    const statusVal = state.statusFilter?.value;
    if (statusVal && statusVal !== "All Status" && statusVal !== "all_status") {
      body.status = statusVal;
    }
    const roleVal = state.roleFilter?.value;
    if (roleVal && roleVal !== "All Roles" && roleVal !== "all_roles") {
      body.role = roleVal;
    }
    const deptVal = state.deptFilter?.value;
    if (deptVal && deptVal !== "All Departments" && deptVal !== "all_depts") {
      body.department_id = deptVal;
    }
    const progVal = state.progFilter?.value;
    if (progVal && progVal !== "All Programmes" && progVal !== "all_progs") {
      body.programme_id = progVal;
    }
    const batchVal = state.batchFilter?.value;
    if (batchVal && batchVal !== "All Batches" && batchVal !== "all_batches") {
      body.batch_id = batchVal;
    }
    return body;
  };

  const getUserList = async () => {
    try {
      setState({ loading: true });
      const body = bodyData();
      const res: any = await Models.users.list(body, 1);
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({ userList: list, loading: false });
    } catch (error) {
      console.log("user list error", error);
      setState({ loading: false });
    }
  };

  useEffect(() => {
    dispatch(setPageTitle("User List"));
    getDepartmentList();
    getProgrammeList();
    getBatchList();
  }, []);

  useEffect(() => {
    getUserList();
  }, [
    debouncedSearch,
    state.statusFilter?.value,
    state.roleFilter?.value,
    state.deptFilter?.value,
    state.progFilter?.value,
    state.batchFilter?.value,
  ]);

  // ── Save User (Create / Update) ───────────────────────────────────────────
  const handleSaveUser = async (formData: any) => {
    try {
      setState({ submitting: true });

      const isStudent = formData.role === "Student";
      const isActive = formData.is_active !== undefined ? formData.is_active : true;

      const payload: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
        is_active: isActive,
        is_staff: formData.is_staff !== undefined ? formData.is_staff : !isStudent,
        organization_id: getOrganizationId(),
        department_id:
          formData.department_id && Number(formData.department_id) > 0
            ? Number(formData.department_id)
            : null,
        programme_id:
          formData.programme_id && Number(formData.programme_id) > 0
            ? Number(formData.programme_id)
            : null,
        batch_id:
          formData.batch_id && Number(formData.batch_id) > 0
            ? Number(formData.batch_id)
            : null,
      };

      if (formData.password) {
        payload.password = formData.password;
      } else if (!state.editRow?.id) {
        payload.password = "erp@123";
      }

      if (state.editRow?.id) {
        await Models.users.update(state.editRow.id, payload);
        Success("User updated successfully");
      } else {
        await Models.users.create(payload);
        Success("User created successfully");
      }

      closeModal();
      getUserList();
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to save user");
    } finally {
      setState({ submitting: false });
    }
  };

  // ── Delete User ────────────────────────────────────────────────────────────
  const handleDeleteUser = (row: any) => {
    showDeleteAlert(
      async () => {
        try {
          setState({ loading: true });
          await Models.users.delete(row.id);
          Success("User deleted successfully");
          getUserList();
        } catch (error: any) {
          Failure(typeof error === "string" ? error : error?.message || "Failed to delete user");
          setState({ loading: false });
        }
      },
      () => {},
      `Delete ${row.first_name ? `${row.first_name} ${row.last_name || ""}`.trim() : row.name || "User"}?`
    );
  };

  // ── Filter Records ─────────────────────────────────────────────────────────
  const userList = state.userList !== null ? state.userList : MOCK_USERS;
  const records = userList.filter((r: any) => {
    const s = state.search.toLowerCase();
    const fullName = (r.first_name ? `${r.first_name} ${r.last_name || ""}` : r.name || "").toLowerCase();
    const email = (r.email || "").toLowerCase();
    const regNo = (r.regNo || r.registry_number || (r.id ? `USR-${String(r.id).padStart(4, "0")}` : "")).toLowerCase();
    const matchSearch = !s || fullName.includes(s) || email.includes(s) || regNo.includes(s);

    const rRole = (r.role === "ERP_ADMIN" ? "ERP Admin" : r.role || "").toLowerCase();
    const matchRole =
      !state.roleFilter ||
      state.roleFilter.value === "All Roles" ||
      rRole === String(state.roleFilter.value).toLowerCase();

    const deptFilterVal = state.deptFilter?.value;
    const matchDept =
      !state.deptFilter ||
      deptFilterVal === "All Departments" ||
      (typeof deptFilterVal === "number" && (r.department_id === deptFilterVal || r.department?.id === deptFilterVal)) ||
      String(r.department?.department_name || r.department_name || r.department || "")
        .toLowerCase()
        .includes(String(state.deptFilter.label || deptFilterVal).toLowerCase());

    const progFilterVal = state.progFilter?.value;
    const matchProg =
      !state.progFilter ||
      progFilterVal === "All Programmes" ||
      (typeof progFilterVal === "number" && (r.programme_id === progFilterVal || r.programme?.id === progFilterVal)) ||
      String(r.programme?.programme_name || r.programme_name || r.programme || "")
        .toLowerCase()
        .includes(String(state.progFilter.label || progFilterVal).toLowerCase());

    const batchFilterVal = state.batchFilter?.value;
    const matchBatch =
      !state.batchFilter ||
      batchFilterVal === "All Batches" ||
      (typeof batchFilterVal === "number" && (r.batch_id === batchFilterVal || r.batch?.id === batchFilterVal)) ||
      String(r.batch?.name || r.batch_name || r.batch || "")
        .toLowerCase()
        .includes(String(state.batchFilter.label || batchFilterVal).toLowerCase()) ||
      (r.is_staff && String(batchFilterVal).toLowerCase().includes("staff"));

    const statusFilterVal = state.statusFilter?.value;
    const rStatus = (r.status || (r.is_active ? "Active" : "Inactive")).toLowerCase();
    const matchStatus =
      !state.statusFilter ||
      statusFilterVal === "All Status" ||
      statusFilterVal === "all_status" ||
      rStatus === String(statusFilterVal).toLowerCase();

    return matchSearch && matchRole && matchDept && matchProg && matchBatch && matchStatus;
  });

  return (
    <div className="min-h-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <PageHeader
        title="User List"
        subtitle={`Institution: <span class="font-bold text-[#000]">Karpagam Institutions, Coimbatore</span>
            &nbsp;·&nbsp; Admin: <span class="font-bold text-[#000]">ERP Admin</span>`}
        icon={<Users className="h-5 w-5 text-color2" />}
        actionBtn1={{
          label: "Add User",
          icon: <IconPlus className="h-4 w-4" />,
          onClick: openCreate,
        }}
        actionBtn2={{
          label: "Bulk Import",
          icon: <Upload className="h-4 w-4" />,
          // onClick: () => setState({ showBulkModal: true }),
          onClick: () => {router.push("/neurobe/bulk-import")}
        }}
        records={`${records.length} Records`}
      />

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <TextInput
            placeholder="Search by name, email, register number..."
            type="text"
            value={state.search}
            onChange={(e) => setState({ search: e.target.value })}
            icon={<IconSearch className="h-4 w-4" />}
          />
        </div>
        <CustomSelect
          options={ROLE_OPTIONS}
          value={state.roleFilter}
          onChange={(v) => setState({ roleFilter: v })}
          placeholder="All Roles"
          className="filter-input"
          isClearable
        />
        <CustomSelect
          options={departmentOptions}
          value={state.deptFilter}
          onChange={(v) => setState({ deptFilter: v })}
          placeholder="All Departments"
          className="filter-input"
          isClearable
        />
        <CustomSelect
          options={programmeOptions}
          value={state.progFilter}
          onChange={(v) => setState({ progFilter: v })}
          placeholder="All Programmes"
          className="filter-input"
          isClearable
        />
        <CustomSelect
          options={batchOptions}
          value={state.batchFilter}
          onChange={(v) => setState({ batchFilter: v })}
          placeholder="All Batches"
          className="filter-input"
          isClearable
        />
        <CustomSelect
          options={STATUS_OPTIONS}
          value={state.statusFilter}
          onChange={(v) => setState({ statusFilter: v })}
          placeholder="All Status"
          className="filter-input"
          isClearable
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="panel">
        <TableComponent
          records={records}
          columns={makeUserListColumns(openEdit, handleDeleteUser)}
          loading={state.loading}
          noRecordsText="No users found"
        />
      </div>

      {/* ── Footer count ───────────────────────────────────────────────────── */}
      <p className="mt-3 text-xs text-[#000]">
        Showing 1–{records.length} of {records.length} users
      </p>

      {/* ── Add User Modal ─────────────────────────────────────────────────── */}
      <AddUserModal
        open={state.showModal}
        onClose={closeModal}
        initialData={state.editRow}
        onSubmit={handleSaveUser}
        submitting={state.submitting}
        departmentOptions={modalDepartmentOptions}
        programmeOptions={modalProgrammeOptions}
        batchOptions={modalBatchOptions}
        roleOptions={DROPDOWN_ROLES}
        statusOptions={MODAL_STATUS_OPTIONS}
      />
      <BulkImportModal
        open={state.showBulkModal}
        onClose={() => setState({ showBulkModal: false })}
      />
    </div>
  );
};

export default PrivateRouter(UserList);
