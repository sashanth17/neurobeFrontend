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
    statCount: null as any,
  });

  const debouncedSearch = useDebounce(state.search, 500);

  useEffect(() => {
    if (router.isReady && router.query.tab && typeof router.query.tab === "string") {
      const validTabs = ["departments", "programmes", "batches", "courses", "psos"];
      if (validTabs.includes(router.query.tab)) {
        setState({ activeTab: router.query.tab });
      }
    }
  }, [router.isReady, router.query.tab]);

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
      setState({
        courseList: list,
        loading: false,
      });
    } catch (error) {
      console.log("course error", error);
      setState({ loading: false });
    }
  };

  // ── SAVE Handlers (Create / Update) ────────────────────────────────────────
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
    department_id: number;
    programme_name: string;
    short_name: string;
    degree_level: string;
    status: string;
  }) => {
    try {
      setState({ submitting: true });

      const body = {
        organization_id: getOrganizationId(),
        department_id: formData.department_id,
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
    programme_id: number;
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
        programme_id: formData.programme_id,
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
    console.log("formData", formData)
    try {
      setState({ submitting: true });

      const body = new FormData();
      body.append("organization_id", String(getOrganizationId()));
      body.append("department_id", String(formData.department_id));
      body.append("course_code", formData.course_code);
      body.append("course_title", formData.course_title);
      body.append("status", formData.status || "Active");
      body.append("lecture_hours", String(formData.lecture_hours ?? 0));
      body.append("tutorial_hours", String(formData.tutorial_hours ?? 0));
      body.append("practical_hours", String(formData.practical_hours ?? 0));
      body.append("credits", String(formData.credits ?? 0));
      body.append("total_theory_hours", String(formData.total_theory_hours ?? 0));
      body.append("total_lab_hours", String(formData.total_lab_hours ?? 0));
      body.append("regulation", formData.regulation || "R2023");
      body.append("is_active", String(formData.is_active !== undefined ? formData.is_active : true));

      // only include syllabus_file if a new File was selected
      if (formData.syllabus_file instanceof File) {
        body.append("syllabus_file", formData.syllabus_file);
      }
      console.log("org/api/v1/", body)

      if (state.editRow?.id) {
        const res:any = await Models.course.update(state.editRow.id, body);
        console.log("editRow", res)

        if (formData?.coordinator?.value) {
          await Models.course.create_course_coordinators({
            course_id: res?.id,
            organization_id: res?.organization_id,
            coordinator_id: formData.coordinator.value,
          });
        }

        // assign each instructor
        if (formData?.instructors?.length) {
          await Promise.all(
            formData.instructors.map((instructor: any) =>
              Models.course.create_course_instructors({
                course_id: res?.id,
                organization_id: res?.organization_id,
                instructor_id: instructor.value,
              })
            )
          );
        }

        Success("Course updated successfully");
      } else {
        const res: any = await Models.course.create(body);
        console.log("res", res)

        // assign coordinator
        if (formData?.coordinator?.value) {
          await Models.course.create_course_coordinators({
            course_id: res?.id,
            organization_id: res?.organization_id,
            coordinator_id: formData.coordinator.value,
          });
        }

        // assign each instructor
        if (formData?.instructors?.length) {
          await Promise.all(
            formData.instructors.map((instructor: any) =>
              Models.course.create_course_instructors({
                course_id: res?.id,
                organization_id: res?.organization_id,
                instructor_id: instructor.value,
              })
            )
          );
        }


        Success("Course created successfully");
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
            "programme",
            "programme_name",
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
      records: MOCK_PSOS.filter(
        (r: any) => bySearch(r, ["code", "programme", "description"]) && byStatus(r)
      ),
      columns: makePSOColumns(openEdit, () => { }),
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
        departmentOptions={departmentOptions}
      />
      <CreateBatchModal
        open={state.showModal && state.activeTab === "batches"}
        onClose={closeModal}
        initialData={state.editRow}
        onSubmit={handleSaveBatch}
        submitting={state.submitting}
        programmeOptions={programmeOptions}
      />
      <CreatePSOModal
        open={state.showModal && state.activeTab === "psos"}
        onClose={closeModal}
        initialData={state.editRow}
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
            placeholder="All Status"
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
              placeholder="All Departments"
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
