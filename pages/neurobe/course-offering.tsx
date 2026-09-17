import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { ArrowRight, BookOpen, Info, User, UserCheck } from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
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

const CourseOffering = () => {
  const dispatch = useDispatch();

  const [state, setState] = useSetState({
    search: "",
    programmeFilter: "all",
    batchFilter: "all",
    statusFilter: "all",
    loading: false,
    showModal: false,
    editRow: null as any,
  });

  const openCreate = () => setState({ showModal: true, editRow: null });
  const openEdit = (row: any) => setState({ showModal: true, editRow: row });
  const closeModal = () => setState({ showModal: false, editRow: null });

  useEffect(() => {
    dispatch(setPageTitle("Course Offerings"));
  }, []);

   useEffect(() => {
   course_instance_list()
  }, []);

  const course_instance_list=async()=>{
    try {
      const res=await Models.course_instance.list()
      console.log("res",res)
      
    } catch (error) {
      console.log("error",error)
      
    }
  }

  // ── filtered records ───────────────────────────────────────────────────────
  const records = MOCK_OFFERINGS.filter((r) => {
    const s = state.search.toLowerCase();
    const matchSearch =
      !s ||
      r.course.toLowerCase().includes(s) ||
      r.code.toLowerCase().includes(s) ||
      r.coordinator.toLowerCase().includes(s) ||
      r.instructors.some((i) => i.toLowerCase().includes(s));
    const matchProg =
      !state.programmeFilter ||
      state.programmeFilter === "all" ||
      r.programme ===
        PROGRAMME_OPTIONS.find((o) => o.value === state.programmeFilter)?.label;
    const matchBatch =
      !state.batchFilter ||
      state.batchFilter === "all" ||
      r.batch === state.batchFilter;
    const matchStatus =
      !state.statusFilter ||
      state.statusFilter === "all" ||
      r.status ===
        STATUS_OPTIONS.find((o) => o.value === state.statusFilter)?.label;
    return matchSearch && matchProg && matchBatch && matchStatus;
  });

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      {/* <p className="mb-2 text-xs text-[#000]">
        ADMIN INSTITUTION &nbsp;›&nbsp; COURSE OFFERINGS
      </p> */}

      {/* <h1 className="page-ti mb-5">Course Offerings</h1> */}

      {/* Info banner */}
      <PageHeader
        title="Course Offerings & Faculty Assignment"
        subtitle="Manage course offerings across programmes, batches, and terms with automated Coordinator-to-Instructor access maintenance."
        icon={<BookOpen className="h-5 w-5 text-color2" />}
        actionBtn1={{
          label: "Create Course Offering",
          icon: <IconPlus className="h-4 w-4" />,
          onClick: openCreate,
        }}
        records={`${records.length} Records`}
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
        </div>
      </div>

      {/* Table */}
      <div className="panel">
        <AcademicTable
          records={records}
          columns={makeCourseOfferingColumns(openEdit)}
          loading={state.loading}
          noRecordsText="No course offerings found"
        />
      </div>
    </div>
  );
};

export default PrivateRouter(CourseOffering);
