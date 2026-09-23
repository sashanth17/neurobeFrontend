import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { ArrowRight, BookOpen, Info, User, UserCheck } from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState, Success, Failure, showDeleteAlert } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import IconPlus from "@/components/Icon/IconPlus";
import AcademicTable from "@/components/common-components/TableComponent";
import {
  MOCK_OFFERINGS,
  makeCourseOfferingColumns,
} from "@/components/course-offering/courseOfferingColumns";
import CourseOfferingModal from "@/components/course-offering/CourseOfferingModal";
import PrivateRouter from "@/hook/privateRouter";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import PageHeader from "@/components/common-components/PageHeader";
import TextInput from "@/components/FormFields/TextInput.component";
import Models from "@/imports/models.import";

const PROGRAMME_OPTIONS = [
  { value: "all", label: "All Programmes" },
  { value: "btech-cse", label: "B.Tech CSE" },
  { value: "btech-ece", label: "B.Tech ECE" },
  { value: "mtech-ai", label: "M.Tech AI" },
];

const BATCH_OPTIONS = [
  { value: "all", label: "All Batches" },
  { value: "2025-29", label: "2025-29" },
  { value: "2024-28", label: "2024-28" },
  { value: "2023-27", label: "2023-27" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const ARCHIVE_OPTIONS = [
  { value: "all", label: "All Offerings" },
  { value: "active", label: "Active Offerings" },
  { value: "archived", label: "Archived Offerings" },
];

const CourseOffering = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [state, setState] = useSetState({
    search: "",
    programmeFilter: "all",
    batchFilter: "all",
    statusFilter: "all",
    archiveFilter: "active",
    loading: false,
    showModal: false,
    editRow: null as any,
    instanceList: [] as any[],
  });

  const openCreate = () => setState({ showModal: true, editRow: null });
  const openEdit = (row: any) => setState({ showModal: true, editRow: row });
  const closeModal = () => setState({ showModal: false, editRow: null });

  const handleManageStudents = (row: any) => {
    router.push(`/neurobe/student-enrollment?instance_id=${row.id}&course_id=${row.course_id || ""}`);
  };

  const handleToggleArchive = async (row: any) => {
    try {
      setState({ loading: true });
      const nextArchived = !row.is_archived;
      await Models.course_instance.update(row.id, {
        ...row,
        is_archived: nextArchived,
      });
      Success(nextArchived ? "Course instance archived" : "Course instance unarchived");
      course_instance_list();
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to update archive status");
      setState({ loading: false });
    }
  };

  useEffect(() => {
    dispatch(setPageTitle("Course Offerings"));
  }, []);

  useEffect(() => {
    course_instance_list();
  }, []);

  const course_instance_list = async () => {
    try {
      setState({ loading: true });
      const res: any = await Models.course_instance.list();
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({ instanceList: list, loading: false });
    } catch (error) {
      console.log("error", error);
      setState({ loading: false });
    }
  };

  const handleDelete = (row: any) => {
    showDeleteAlert(
      async () => {
        try {
          setState({ loading: true });
          await Models.course_instance.delete(row.id);
          Success("Course offering deleted successfully");
          course_instance_list();
        } catch (error: any) {
          Failure(typeof error === "string" ? error : error?.message || "Failed to delete course offering");
          setState({ loading: false });
        }
      },
      () => { },
      `Are you sure you want to delete ${row.course_instance_name || row.course || "this course offering"}?`
    );
  };

  // ── filtered records ───────────────────────────────────────────────────────
  const rawList = state.instanceList || [];
  const records = rawList.filter((r: any) => {
    const s = state.search.toLowerCase();
    const courseTitle = r.course_instance_name || r.course || r.course_title || "";
    const courseCode = r.course_code || r.code || "";
    const createdBy = r.created_by_name || r.created_by || "";
    const matchSearch =
      !s ||
      courseTitle.toLowerCase().includes(s) ||
      courseCode.toLowerCase().includes(s) ||
      createdBy.toLowerCase().includes(s);
    const matchStatus =
      !state.statusFilter ||
      state.statusFilter === "all" ||
      String(r.status || (r.is_active ? "active" : "inactive")).toLowerCase() === state.statusFilter.toLowerCase();
    const matchArchive =
      !state.archiveFilter ||
      state.archiveFilter === "all" ||
      (state.archiveFilter === "archived" ? Boolean(r.is_archived) : !r.is_archived);
    return matchSearch && matchStatus && matchArchive;
  });

  return (
    <div className="min-h-screen">
      {/* Info banner */}
      <PageHeader
        title="Course Offerings"
        subtitle="Overview of course offerings and section instances across programmes and terms."
        icon={<BookOpen className="h-5 w-5 text-color2" />}
        records={`${records.length} Records`}
        actionBtn1={{
          label: "Create Offering",
          icon: <IconPlus className="h-4 w-4" />,
          onClick: openCreate,
          view: true,
        }}
      />

      {/* Auto-instructor notice */}
      <div className="panel mb-5 flex items-center gap-3 rounded-xl  bg-[#ede9fe]/60 px-5 py-4 dark:border-yellow-800 dark:bg-yellow-900/20">
        <div className="bg-color2-l flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
          <UserCheck className="text-color2 h-5 w-5" />
        </div>
        <p className="text-color2 text-sm font-bold dark:text-yellow-300">
          <span className="font-bold">
            Course Coordinators automatically have Instructor access for the
            same course.{" "}
          </span>
          <span className="font-semibold text-green-600">Now Active</span>
          <br />
          <span>
            When a faculty member e.g. Arjun Kumar is assigned as Course
            Coordinator, they automatically possess full Course Instructor
            access for the same course delivery.
          </span>
        </p>
        <button className="text-color2 ml-auto flex shrink-0 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-bold hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
          <UserCheck className="h-3 w-3" />
          Coordinator <ArrowRight className="h-3 w-3" /> Auto-Instructor
        </button>
      </div>

      {/* Modal */}
      <CourseOfferingModal
        open={state.showModal}
        onClose={closeModal}
        onSuccess={course_instance_list}
        initialData={state.editRow}
      />

      {/* Filters */}
      <div className=" mb-4 flex flex-wrap items-center justify-between gap-3  py-4">
        {/* Search */}
        <div className="relative max-w-[300px] flex-1">

          <TextInput
            placeholder="Search by code, title, faculty..."
            type="text"
            value={state.search}
            onChange={(e) => setState({ search: e.target.value })}
            icon={<IconSearch className="h-4 w-4" />}
          />
        </div>

        <div className="flex gap-3">
          <CustomSelect
            options={PROGRAMME_OPTIONS}
            value={
              PROGRAMME_OPTIONS.find(
                (o) => o.value === state.programmeFilter,
              ) ?? null
            }
            onChange={(e) => setState({ programmeFilter: e?.value ?? "all" })}
            placeholder="All Programmes"
            className="filter-input"
            isClearable
          />

          <CustomSelect
            options={BATCH_OPTIONS}
            value={
              BATCH_OPTIONS.find((o) => o.value === state.batchFilter) ?? null
            }
            onChange={(e) => setState({ batchFilter: e?.value ?? "all" })}
            placeholder="All Batches"
            className="filter-input"
            isClearable
          />

          <CustomSelect
            options={STATUS_OPTIONS}
            value={
              STATUS_OPTIONS.find((o) => o.value === state.statusFilter) ?? null
            }
            onChange={(e) => setState({ statusFilter: e?.value ?? "all" })}
            placeholder="All Statuses"
            className="filter-input"
            isClearable
          />

          <CustomSelect
            options={ARCHIVE_OPTIONS}
            value={
              ARCHIVE_OPTIONS.find((o) => o.value === state.archiveFilter) ?? null
            }
            onChange={(e) => setState({ archiveFilter: e?.value ?? "all" })}
            placeholder="Active Offerings"
            className="filter-input"
            isClearable={false}
          />
        </div>
      </div>

      {/* Table */}
      <div className="panel">
        <AcademicTable
          records={records}
          columns={makeCourseOfferingColumns(openEdit, handleDelete, handleManageStudents, handleToggleArchive)}
          loading={state.loading}
          noRecordsText="No course offerings found"
        />
      </div>
    </div>
  );
};

export default PrivateRouter(CourseOffering);
