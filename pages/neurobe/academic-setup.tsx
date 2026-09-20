import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Settings, Home } from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState, Success, Failure, showDeleteAlert, getOrganizationId } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import IconPlus from "@/components/Icon/IconPlus";
import PageBanner from "@/components/common-components/PageBanner";
import StatTabCard from "@/components/academic-setup/StatTabCard";
import {
  MOCK_DEPARTMENTS,
  makeDepartmentColumns,
  MOCK_PROGRAMMES,
  makeProgrammeColumns,
  MOCK_BATCHES,
  makeBatchColumns,
  MOCK_COURSES,
  makeCourseColumns,
  MOCK_PSOS,
  makePSOColumns,
} from "@/components/academic-setup/tableColumns";
import {
  CreateCourseModal,
  CreateDepartmentModal,
  CreateProgrammeModal,
  CreateBatchModal,
  CreatePSOModal,
} from "@/components/academic-setup/AddModals";
import PrivateRouter from "@/hook/privateRouter";
import TableComponent from "@/components/common-components/TableComponent";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import TextInput from "@/components/FormFields/TextInput.component";
import Models from "@/imports/models.import";
import useDebounce from "@/hook/useDebounce";

const TABS = [
  {
    key: "departments",
    label: "Departments",
    subLabel: "Academic Divisions",
    count: 0,
  },
  {
    key: "programmes",
    label: "Programmes",
    subLabel: "Degrees & Majors",
    count: 0,
  },
  { key: "batches", label: "Batches", subLabel: "Academic Batches", count: 0 },
  { key: "courses", label: "Courses", subLabel: "Course Catalog", count: 0 },
  {
    key: "psos",
    label: "PSOs",
    subLabel: "Programme Specific Outcomes",
    count: 6,
  },
];

const STATUS_OPTIONS = [
  { value: "all_status", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

const ADD_LABELS: Record<string, string> = {
  departments: "Add Department",
  programmes: "Add Programme",
  batches: "Add Batch",
  courses: "Add Courses",
  psos: "Add PSO",
};

const AcademicSetup = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    activeTab: "departments",
    search: "",
    statusFilter: { value: "all_status", label: "All Statuses" },
    deptFilter: "All Departments",
    loading: false,
    submitting: false,
    showModal: false,
    editRow: null as any,
    departmentList: null as any[] | null,
    programmeList: null as any[] | null,
    batchList: null as any[] | null,
    courseList: null as any[] | null,
    psoList: null as any[] | null,
    statCount: null as any,
  });

  const debouncedSearch = useDebounce(state.search, 500);

  useEffect(() => {
    if (router.isReady) {
      const tabParam = router.query.tab as string;
      const editIdParam = router.query.edit_id as string;
      const codeParam = router.query.code as string;

      if (tabParam === "courses" || editIdParam || codeParam) {
        setState({ activeTab: "courses" });
      } else if (tabParam) {
        const validTabs = ["departments", "programmes", "batches", "courses", "psos"];
        if (validTabs.includes(tabParam)) {
          setState({ activeTab: tabParam });
        }
      }
    }
  }, [router.isReady, router.query.tab, router.query.edit_id, router.query.code]);

  useEffect(() => {
    dispatch(setPageTitle("Academic Setup"));
    // Pre-load departments, programmes, and stats so dashboard cards and dropdowns are populated immediately
    statCount();
    getDepartmentList();
    getProgrammeList();
  }, []);

  useEffect(() => {
    if (state.activeTab === "departments") {
      getDepartmentList();
    } else if (state.activeTab === "programmes") {
      getProgrammeList();
    } else if (state.activeTab === "batches") {
      getBatchList();
    } else if (state.activeTab === "courses") {
      getCourseList();
    } else if (state.activeTab === "psos") {
      getPsoList();
    }
  }, [debouncedSearch, state.statusFilter?.value, state.activeTab]);

  // ── filter helpers ─────────────────────────────────────────────────────────
  const bySearch = (row: any, keys: string[]) => {
    const s = state.search.toLowerCase();
    return (
      !s ||
      keys.some((k) =>
        String(row[k] ?? "")
          .toLowerCase()
          .includes(s)
      )
    );
  };
  const byStatus = (row: any) => {
    const filterVal = state.statusFilter?.value;
    if (!filterVal || filterVal === "all_status") return true;
    return String(row.status ?? "").toLowerCase() === filterVal.toLowerCase();
  };
  const byDept = (row: any) => {
    if (state.deptFilter === "All Departments") return true;
    const deptName = row.department_name || row.department?.department_name || row.department;
    return deptName === state.deptFilter;
  };

  // ── modal helpers ──────────────────────────────────────────────────────────
  const openCreate = () => setState({ showModal: true, editRow: null });
  const openEdit = (row: any) => setState({ showModal: true, editRow: row });
  const closeModal = () => setState({ showModal: false, editRow: null });

  // ── Select Options derived from Live Lists ─────────────────────────────────
  const departmentOptions = (state.departmentList ?? []).map((d: any) => ({
    value: d.id,
    label: d.department_name || d.name || d.department_short_name || d.code || `Department ${d.id}`,
  }));

  const programmeOptions = (state.programmeList ?? []).map((p: any) => ({
    value: p.id,
    label: p.programme_name || p.name || p.short_name || p.code || `Programme ${p.id}`,
  }));


  const bodyData = (searchVal = debouncedSearch) => {
    let body: any = {
      organization_id: getOrganizationId(),
    };
    if (searchVal) {
      body.search = searchVal;
    }
    const statusVal = state.statusFilter?.value;
    if (statusVal && statusVal !== "all_status") {
      body.status = statusVal;
    }
    return body;
  };

  // ── GET Lists ──────────────────────────────────────────────────────────────

  const statCount = async () => {
    try {
      const res = await Models.stats.academic_setup(getOrganizationId());
      setState({
        statCount: res,
      });
    } catch (error) {
      console.log("stat count error", error);
    }
  };


  const getDepartmentList = async (searchVal?: string) => {
    try {
      if (state.activeTab === "departments") setState({ loading: true });
      const body = bodyData(searchVal !== undefined ? searchVal : debouncedSearch);
      const res: any = await Models.department.list(body, 1);
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({
        departmentList: list,
        loading: false,
      });
    } catch (error) {
      console.log("department error", error);
      setState({ loading: false });
    }
  };

  const getProgrammeList = async (searchVal?: string) => {
    try {
      if (state.activeTab === "programmes") setState({ loading: true });
      const body = bodyData(searchVal !== undefined ? searchVal : debouncedSearch);
      const res: any = await Models.programme.list(body, 1);
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({
        programmeList: list,
        loading: false,
      });
    } catch (error) {
      console.log("programme error", error);
      setState({ loading: false });
    }
  };

  const getBatchList = async (searchVal?: string) => {
    try {
      setState({ loading: true });
      const body = bodyData(searchVal !== undefined ? searchVal : debouncedSearch);
      const res: any = await Models.batch.list(body, 1);
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({
        batchList: list,
        loading: false,
      });
    } catch (error) {
      console.log("batch error", error);
      setState({ loading: false });
    }
  };

  const getCourseList = async (searchVal?: string) => {
    try {
      setState({ loading: true });
      const body = bodyData(searchVal !== undefined ? searchVal : debouncedSearch);
      const res: any = await Models.course.list(body, 1);
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];

      const enrichedList = await Promise.all(
        list.map(async (c: any) => {
          try {
            const assignRes: any = await Models.faculty.getCourseAssignments(c.id);
            const coordFacultyId = assignRes?.coordinator?.faculty_id || c.coordinator_id || null;
            return {
              ...c,
              coordinator_name: assignRes?.coordinator?.name
                ? `${assignRes.coordinator.name}${assignRes.coordinator.register_number ? ` (${assignRes.coordinator.register_number})` : ""}`
                : c.coordinator_name || null,
              coordinator_id: coordFacultyId,
              instructors:
                Array.isArray(assignRes?.instructors) && assignRes.instructors.length > 0
                  ? assignRes.instructors
                    .filter((ins: any) => !coordFacultyId || (ins.faculty_id || ins.id) !== coordFacultyId)
                    .map((ins: any) => ({
                      ...ins,
                      name: ins.name
                        ? `${ins.name}${ins.register_number ? ` (${ins.register_number})` : ""}`
                        : ins.email || `Faculty #${ins.faculty_id}`,
                    }))
                  : c.instructor_name
                    ? [{ name: c.instructor_name }]
                    : [],
            };
          } catch {
            return c;
          }
        })
      );

      // Auto-open Edit Course modal if edit_id or code query parameter is passed
      const editIdParam = router.query.edit_id ? String(router.query.edit_id) : null;
      const codeParam = router.query.code ? String(router.query.code) : null;

      let targetCourse: any = null;
      if (editIdParam || codeParam) {
        targetCourse = enrichedList.find((c: any) =>
          (editIdParam && String(c.id) === editIdParam) ||
          (codeParam && (String(c.code || "").toLowerCase() === codeParam.toLowerCase() || String(c.course_code || "").toLowerCase() === codeParam.toLowerCase()))
        );
      }

      setState({
        courseList: enrichedList,
        loading: false,
        ...(targetCourse ? { showModal: true, editRow: targetCourse } : {}),
      });
    } catch (error) {
      console.log("course error", error);
      setState({ loading: false });
    }
  };

  const getPsoList = async (searchVal?: string) => {
    try {
      setState({ loading: true });
      const body = bodyData(searchVal !== undefined ? searchVal : debouncedSearch);
      const res: any = await Models.pso.list(body, 1);
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({
        psoList: list,
        loading: false,
      });
    } catch (error) {
      console.log("pso error", error);
      setState({ loading: false });
    }
  };

  // ── SAVE Handlers (Create / Update) ────────────────────────────────────────
  const handleSavePSO = async (formData: any) => {
    try {
      setState({ submitting: true });

      if (state.editRow?.id) {
        await Models.pso.update(state.editRow.id, formData);
        Success("PSO updated successfully");
      } else {
        await Models.pso.create(formData);
        Success("PSO created successfully");
      }

      closeModal();
      getPsoList();
      statCount();
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to save PSO");
    } finally {
      setState({ submitting: false });
    }
  };

  const handleDeletePSO = (row: any) => {
    showDeleteAlert(
      async () => {
        try {
          setState({ loading: true });
          await Models.pso.delete(row.id);
          Success("PSO deleted successfully");
          getPsoList();
          statCount();
        } catch (error: any) {
          Failure(typeof error === "string" ? error : error?.message || "Failed to delete PSO");
          setState({ loading: false });
        }
      },
      () => { },
      "Are you sure you want to delete this PSO?"
    );
  };

  const handleSaveDepartment = async (formData: {
    department_name: string;
    department_short_name: string;
    status: string;
  }) => {
    try {
      setState({ submitting: true });

      const body = {
        organization_id: getOrganizationId(),
        department_name: formData.department_name,
        department_short_name: formData.department_short_name,
        is_approved: true,
        status: formData.status || "active",
      };

      if (state.editRow?.id) {
        await Models.department.update(state.editRow.id, body);
        Success("Department updated successfully");
      } else {
        await Models.department.create(body);
        Success("Department created successfully");
      }

      closeModal();
      getDepartmentList();
      statCount();
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to save department");
    } finally {
      setState({ submitting: false });
    }
  };

  const handleSaveProgramme = async (formData: {
    programme_name: string;
    short_name: string;
    degree_level: string;
    status: string;
  }) => {
    try {
      setState({ submitting: true });

      const body = {
        organization_id: getOrganizationId(),
        programme_name: formData.programme_name,
        short_name: formData.short_name,
        degree_level: formData.degree_level,
        status: formData.status || "Active",
      };

      if (state.editRow?.id) {
        await Models.programme.update(state.editRow.id, body);
        Success("Programme updated successfully");
      } else {
        await Models.programme.create(body);
        Success("Programme created successfully");
      }

      closeModal();
      getProgrammeList();
      statCount();
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to save programme");
    } finally {
      setState({ submitting: false });
    }
  };

  const handleSaveBatch = async (formData: {
    name: string;
    start_year: number;
    end_year: number;
    status: string;
    is_active: boolean;
  }) => {
    try {
      setState({ submitting: true });

      const body = {
        name: formData.name,
        organization_id: getOrganizationId(),
        start_year: formData.start_year,
        end_year: formData.end_year,
        status: formData.status,
        is_active: formData.is_active !== undefined ? formData.is_active : true,
      };

      if (state.editRow?.id) {
        await Models.batch.update(state.editRow.id, body);
        Success("Batch updated successfully");
      } else {
        await Models.batch.create(body);
        Success("Batch created successfully");
      }

      closeModal();
      getBatchList();
      statCount();
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to save batch");
    } finally {
      setState({ submitting: false });
    }
  };

  const handleSaveCourse = async (formData: any) => {
    try {
      setState({ submitting: true });

      const body = {
        organization_id: getOrganizationId(),
        course_code: formData.course_code,
        course_title: formData.course_title,
        status: formData.status || "Active",
        is_active: (formData.status || "Active").toLowerCase() === "active",
      };

      let courseId = state.editRow?.id;
      if (courseId) {
        await Models.course.update(courseId, body);
        Success("Course updated successfully");
      } else {
        const createRes: any = await Models.course.create(body);
        courseId = createRes?.id || createRes?.data?.id;
        Success("Course created successfully");
      }

      // Sync coordinator and instructors with the backend
      if (courseId) {
        const userIdsToAssign = new Set<number>();
        if (formData.coordinator_id) {
          userIdsToAssign.add(Number(formData.coordinator_id));
        }
        if (Array.isArray(formData.instructor_ids)) {
          formData.instructor_ids.forEach((id: number) => {
            if (id) userIdsToAssign.add(Number(id));
          });
        }

        for (const userId of Array.from(userIdsToAssign)) {
          try {
            await Models.faculty.assignCourseInstructor({
              user_id: userId,
              course_id: Number(courseId),
            });
          } catch (assignErr) {
            console.warn(`Could not assign instructor ${userId} to course ${courseId}:`, assignErr);
          }
        }

        try {
          await Models.faculty.patchCourseAssignments(courseId, {
            coordinator_id: formData.coordinator_id || null,
            remove_coordinator: !formData.coordinator_id,
            set_instructor_ids: formData.instructor_ids || [],
          });
        } catch {
          // Ignored if patchCourseAssignments is not implemented
        }
      }

      closeModal();
      getCourseList();
      statCount();
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to save course");
    } finally {
      setState({ submitting: false });
    }
  };

  // ── DELETE Handlers ────────────────────────────────────────────────────────
  const handleDeleteDepartment = (row: any) => {
    showDeleteAlert(
      async () => {
        try {
          setState({ loading: true });
          await Models.department.delete(row.id);
          Success("Department deleted successfully");
          getDepartmentList();
          statCount();
        } catch (error: any) {
          Failure(typeof error === "string" ? error : error?.message || "Failed to delete department");
          setState({ loading: false });
        }
      },
      () => { },
      `Delete ${row.department_name || row.name || "Department"}?`
    );
  };

  const handleDeleteProgramme = (row: any) => {
    showDeleteAlert(
      async () => {
        try {
          setState({ loading: true });
          await Models.programme.delete(row.id);
          Success("Programme deleted successfully");
          getProgrammeList();
          statCount();
        } catch (error: any) {
          Failure(typeof error === "string" ? error : error?.message || "Failed to delete programme");
          setState({ loading: false });
        }
      },
      () => { },
      `Delete ${row.programme_name || row.name || "Programme"}?`
    );
  };

  const handleDeleteBatch = (row: any) => {
    showDeleteAlert(
      async () => {
        try {
          setState({ loading: true });
          await Models.batch.delete(row.id);
          Success("Batch deleted successfully");
          getBatchList();
          statCount();
        } catch (error: any) {
          Failure(typeof error === "string" ? error : error?.message || "Failed to delete batch");
          setState({ loading: false });
        }
      },
      () => { },
      `Delete ${row.name || row.batch || "Batch"}?`
    );
  };

  const handleDeleteCourse = (row: any) => {
    showDeleteAlert(
      async () => {
        try {
          setState({ loading: true });
          await Models.course.delete(row.id);
          Success("Course deleted successfully");
          getCourseList();
          statCount();
        } catch (error: any) {
          Failure(typeof error === "string" ? error : error?.message || "Failed to delete course");
          setState({ loading: false });
        }
      },
      () => { },
      `Delete ${row.course_title || row.title || row.course_code || "Course"}?`
    );
  };

  // ── per-tab config ─────────────────────────────────────────────────────────
  const TAB_CONFIG: Record<
    string,
    { records: any[]; columns: any[]; noRecordsText: string }
  > = {
    departments: {
      records: (state.departmentList ?? []).filter(
        (r: any) =>
          bySearch(r, [
            "code",
            "name",
            "department_name",
            "department_short_name",
          ]) && byStatus(r)
      ),
      columns: makeDepartmentColumns(openEdit, handleDeleteDepartment),
      noRecordsText: "No departments found",
    },
    programmes: {
      records: (state.programmeList ?? []).filter(
        (r: any) =>
          bySearch(r, [
            "code",
            "name",
            "short_name",
            "programme_name",
            "department",
            "department_name",
          ]) && byStatus(r)
      ),
      columns: makeProgrammeColumns(openEdit, handleDeleteProgramme),
      noRecordsText: "No programmes found",
    },
    batches: {
      records: (state.batchList ?? []).filter(
        (r: any) =>
          bySearch(r, [
            "code",
            "name",
            "batch",
          ]) && byStatus(r)
      ),
      columns: makeBatchColumns(openEdit, handleDeleteBatch),
      noRecordsText: "No batches found",
    },
    courses: {
      records: (state.courseList ?? []).filter(
        (r: any) =>
          bySearch(r, [
            "code",
            "title",
            "course_code",
            "course_title",
            "department",
            "department_name",
          ]) &&
          byStatus(r) &&
          byDept(r)
      ),
      columns: makeCourseColumns(openEdit, handleDeleteCourse),
      noRecordsText: "No courses found",
    },
    psos: {
      records: (state.psoList ?? MOCK_PSOS).filter(
        (r: any) => bySearch(r, ["code", "pso_code", "programme", "programme_name", "description"]) && byStatus(r)
      ),
      columns: makePSOColumns(openEdit, handleDeletePSO),
      noRecordsText: "No PSOs found",
    },
  };

  const current = TAB_CONFIG[state.activeTab];

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <PageBanner
        title="Academic Setup"
        description="Manage core academic master data including Departments, Programmes, Batches, Courses, and Programme Specific Outcomes (PSOs)."
        icon={<Settings className="text-color2 h-7 w-7" />}
        imageUrl="/assets/images/neurobe/Rectangle.png"
      />

      {/* Add button */}
      <div className="mb-5 flex justify-end">
        <button
          onClick={openCreate}
          className="create-btn"
        >
          <IconPlus className="h-4 w-4" />
          {ADD_LABELS[state.activeTab]}
        </button>
      </div>

      {/* Modals — open for create (editRow=null) or edit (editRow=row) */}
      <CreateCourseModal
        open={state.showModal && state.activeTab === "courses"}
        onClose={closeModal}
        initialData={state.editRow}
        onSubmit={handleSaveCourse}
        submitting={state.submitting}
        departmentOptions={departmentOptions}
      />
      <CreateDepartmentModal
        open={state.showModal && state.activeTab === "departments"}
        onClose={closeModal}
        initialData={state.editRow}
        onSubmit={handleSaveDepartment}
        submitting={state.submitting}
      />
      <CreateProgrammeModal
        open={state.showModal && state.activeTab === "programmes"}
        onClose={closeModal}
        initialData={state.editRow}
        onSubmit={handleSaveProgramme}
        submitting={state.submitting}
      />
      <CreateBatchModal
        open={state.showModal && state.activeTab === "batches"}
        onClose={closeModal}
        initialData={state.editRow}
        onSubmit={handleSaveBatch}
        submitting={state.submitting}
      />
      <CreatePSOModal
        open={state.showModal && state.activeTab === "psos"}
        onClose={closeModal}
        initialData={state.editRow}
        onSubmit={handleSavePSO}
        submitting={state.submitting}
        departmentOptions={departmentOptions}
        programmeOptions={programmeOptions}
      />

      {/* Stat Tab Cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {TABS.map((tab) => {
          let count = tab.count;
          if (state.statCount) {
            if (tab.key === "departments" && state.statCount.departments_count !== undefined) {
              count = state.statCount.departments_count;
            } else if (tab.key === "programmes" && state.statCount.programmes_count !== undefined) {
              count = state.statCount.programmes_count;
            } else if (tab.key === "batches" && state.statCount.batches_count !== undefined) {
              count = state.statCount.batches_count;
            } else if (tab.key === "courses" && state.statCount.courses_count !== undefined) {
              count = state.statCount.courses_count;
            } else if (tab.key === "psos" && state.statCount.psos_count !== undefined) {
              count = state.statCount.psos_count;
            }
          } else {
            if (tab.key === "departments" && state.departmentList !== null) {
              count = state.departmentList.length;
            } else if (tab.key === "programmes" && state.programmeList !== null) {
              count = state.programmeList.length;
            } else if (tab.key === "batches" && state.batchList !== null) {
              count = state.batchList.length;
            } else if (tab.key === "courses" && state.courseList !== null) {
              count = state.courseList.length;
            } else if (tab.key === "psos" && state.psoList !== null) {
              count = state.psoList.length;
            }
          }

          return (
            <StatTabCard
              key={tab.key}
              icon={<Home className="h-5 w-5" />}
              label={tab.label}
              subLabel={tab.subLabel}
              count={count}
              active={state.activeTab === tab.key}
              onClick={() =>
                setState({
                  activeTab: tab.key,
                  search: "",
                  statusFilter: { value: "all_status", label: "All Statuses" },
                  deptFilter: "All Departments",
                })
              }
            />
          );
        })}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700">
        <div className="relative max-w-[300px] flex-1">
          <TextInput
            placeholder={`Search ${state.activeTab}...`}
            type="text"
            value={state.search}
            onChange={(e) => setState({ search: e.target.value })}
            icon={<IconSearch className="h-4 w-4" />}
          />
        </div>

        <div className="flex gap-3">
          <CustomSelect
            options={STATUS_OPTIONS}
            value={
              STATUS_OPTIONS.find((o) => o.value === state.statusFilter.value) ?? null
            }
            onChange={(e) =>
              setState({ statusFilter: e ?? { value: "all_status", label: "All Statuses" } })
            }
            className="filter-input"
          />

          {state.activeTab === "courses" && (
            <CustomSelect
              options={[
                { value: "All Departments", label: "All Departments" },
                ...departmentOptions,
              ]}
              value={{ value: state.deptFilter, label: state.deptFilter }}
              onChange={(e) =>
                setState({ deptFilter: e?.label ?? e?.value ?? "All Departments" })
              }
              className="filter-input"
            />
          )}
        </div>
      </div>

      {/* Table */}
      <div className="panel">
        <TableComponent
          records={current.records}
          columns={current.columns}
          loading={state.loading}
          noRecordsText={current.noRecordsText}
        />
      </div>
    </div>
  );
};

export default PrivateRouter(AcademicSetup);
