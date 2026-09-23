import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { Users, Upload, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState, Success, Failure, showDeleteAlert } from "@/utils/function.utils";
import IconPlus from "@/components/Icon/IconPlus";
import IconSearch from "@/components/Icon/IconSearch";
import PageHeader from "@/components/common-components/PageHeader";
import TableComponent from "@/components/common-components/TableComponent";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import TextInput from "@/components/FormFields/TextInput.component";
import PrivateRouter from "@/hook/privateRouter";
import { EnrollStudentsModal, EnrollableStudent } from "@/components/academic-setup/AddModals";
import { BulkEnrollmentUploadModal } from "@/components/course-offering/BulkEnrollmentUploadModal";
import Models from "@/imports/models.import";

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Active", label: "Active" },
  { value: "Dropped", label: "Dropped" },
];

const StudentEnrollment = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useSetState({
    search: "",
    statusFilter: "all",
    loading: false,
    uploading: false,
    courseInstances: [] as any[],
    selectedInstance: null as any,
    enrolledStudents: [] as any[],
    availableStudents: [] as EnrollableStudent[],
  });

  const [enrollModal, setEnrollModal] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  useEffect(() => {
    dispatch(setPageTitle("Student Enrollment"));
    fetchCourseInstances();
  }, [dispatch]);

  useEffect(() => {
    if (state.selectedInstance?.value) {
      fetchEnrolledStudents(state.selectedInstance.value);
      fetchAvailableStudents();
    }
  }, [state.selectedInstance]);

  // 1. Fetch active course instances
  const fetchCourseInstances = async () => {
    try {
      setState({ loading: true });
      const res: any = await Models.course_instance.list();
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      const options = list.map((item: any) => ({
        value: item.id,
        label: item.course_instance_name || `${item.course_code || "Course"} - Sec ${item.section || "A"} (Sem ${item.semester || 1})`,
        data: item,
      }));

      const queryInstanceId = router.query.instance_id;
      let matched = null;
      if (queryInstanceId) {
        matched = options.find((o: any) => String(o.value) === String(queryInstanceId));
      }

      setState({
        courseInstances: options,
        selectedInstance: matched || (options.length > 0 ? options[0] : null),
        loading: false,
      });
    } catch (error) {
      console.log("Error loading course instances:", error);
      setState({ loading: false });
    }
  };

  // 2. Fetch enrolled students for selected course offering
  const fetchEnrolledStudents = async (instanceId: number) => {
    try {
      setState({ loading: true });
      const res: any = await Models.course_enrollment.list({ course_instance_id: instanceId });
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];
      setState({ enrolledStudents: list, loading: false });
    } catch (error) {
      console.log("Error loading enrolled students:", error);
      setState({ enrolledStudents: [], loading: false });
    }
  };

  // 3. Fetch available students for manual enrollment
  const fetchAvailableStudents = async () => {
    try {
      const activeOffering = state.selectedInstance?.data;
      const params: any = {};
      if (activeOffering?.department_id) params.department_id = activeOffering.department_id;
      if (activeOffering?.course_id) params.exclude_course_id = activeOffering.course_id;

      const res: any = await Models.course_enrollment.getAvailableStudents(params);
      const list = Array.isArray(res) ? res : res?.data ?? res?.results ?? [];

      // Filter out students already enrolled
      const enrolledIds = new Set(
        state.enrolledStudents.map((s: any) => String(s.student_id || s.register_number))
      );

      const formatted: EnrollableStudent[] = list
        .filter((s: any) => !enrolledIds.has(String(s.id || s.register_number)))
        .map((s: any) => ({
          id: String(s.id || s.register_number || s.regNo),
          regNo: String(s.register_number || s.regNo || s.id),
          name: s.name || `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Student",
          programme: s.programme_name || s.programme || "Engineering",
          batch: s.batch_name || s.batch || "Active",
          email: s.email || "-",
        }));

      setState({ availableStudents: formatted });
    } catch (error) {
      console.log("Error loading available students:", error);
    }
  };

  // 4. Batch Multi-Select Enrollment
  const handleBatchEnroll = async (selected: EnrollableStudent[]) => {
    if (!state.selectedInstance?.value) {
      Failure("Please select a course offering first.");
      return;
    }

    try {
      const studentIds = selected.map((s) => String(s.regNo || s.id));
      const payload = {
        course_instance_id: state.selectedInstance.value,
        student_ids: studentIds,
        enrollment_status: "Active" as const,
      };

      const res: any = await Models.course_enrollment.enroll(payload);
      Success(res?.message || `Enrolled ${studentIds.length} student(s) successfully`);
      fetchEnrolledStudents(state.selectedInstance.value);
      fetchAvailableStudents();
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to enroll students");
    }
  };

  // 5. Bulk Upload via Excel (.xlsx / .csv)
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !state.selectedInstance?.value) return;

    try {
      setState({ uploading: true });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("course_instance_id", String(state.selectedInstance.value));
      formData.append("enrollment_status", "Active");

      const res: any = await Models.course_enrollment.bulkUpload(formData);
      Success(res?.message || `Bulk enrollment complete: ${res?.enrolled_count ?? 0} enrolled`);
      fetchEnrolledStudents(state.selectedInstance.value);
      fetchAvailableStudents();
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to bulk upload enrollments");
    } finally {
      setState({ uploading: false });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 6. Toggle Status (Active / Dropped)
  const handleToggleStatus = async (row: any) => {
    const currentStatus = row.enrollment_status || row.status || "Active";
    const nextStatus = currentStatus === "Active" ? "Dropped" : "Active";

    try {
      await Models.course_enrollment.updateStatus(row.id, nextStatus);
      Success(`Status updated to ${nextStatus}`);
      fetchEnrolledStudents(state.selectedInstance.value);
    } catch (error: any) {
      Failure(typeof error === "string" ? error : error?.message || "Failed to update enrollment status");
    }
  };

  // 7. Delete Enrollment
  const handleDeleteEnrollment = (row: any) => {
    showDeleteAlert(
      async () => {
        try {
          await Models.course_enrollment.delete(row.id);
          Success("Student enrollment removed");
          fetchEnrolledStudents(state.selectedInstance.value);
          fetchAvailableStudents();
        } catch (error: any) {
          Failure(typeof error === "string" ? error : error?.message || "Failed to remove enrollment");
        }
      },
      () => {},
      `Remove ${row.student_name || row.name || row.student_id || "Student"} from this course offering?`
    );
  };

  // Columns definition
  const COLUMNS = [
    {
      accessor: "regNo",
      title: "REGISTER NUMBER",
      render: (row: any) => (
        <span className="font-bold text-[#000] dark:text-white">
          {row.student_id || row.register_number || row.regNo || "-"}
        </span>
      ),
    },
    {
      accessor: "name",
      title: "STUDENT NAME",
      render: (row: any) => (
        <span className="font-semibold text-[#000] dark:text-white">
          {row.student_name || row.name || "-"}
        </span>
      ),
    },
    {
      accessor: "email",
      title: "EMAIL",
      render: (row: any) => (
        <span className="text-sm text-pri">{row.email || row.student_email || "-"}</span>
      ),
    },
    {
      accessor: "enrolledOn",
      title: "ENROLLED ON",
      render: (row: any) => (
        <span className="text-sm text-[#000] dark:text-white">
          {row.enrolled_on ? new Date(row.enrolled_on).toLocaleDateString() : row.enrolledOn || "-"}
        </span>
      ),
    },
    {
      accessor: "status",
      title: "ENROLLMENT STATUS",
      render: (row: any) => {
        const isDropped = (row.enrollment_status || row.status || "Active") === "Dropped";
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
              isDropped
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isDropped ? "bg-red-500" : "bg-green-500"}`}
            />
            {isDropped ? "Dropped" : "Active"}
          </span>
        );
      },
    },
    {
      accessor: "actions",
      title: "ACTIONS",
      render: (row: any) => {
        const isDropped = (row.enrollment_status || row.status || "Active") === "Dropped";
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleStatus(row)}
              className="text-xs font-semibold text-color2 hover:underline"
              title={isDropped ? "Re-activate student" : "Drop student"}
            >
              {isDropped ? "Activate" : "Drop"}
            </button>
            <button
              onClick={() => handleDeleteEnrollment(row)}
              className="text-[#000] hover:text-red-500"
              title="Remove enrollment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  // Filtering
  const filteredRecords = state.enrolledStudents.filter((row: any) => {
    const s = state.search.toLowerCase();
    const reg = String(row.student_id || row.register_number || row.regNo || "").toLowerCase();
    const name = String(row.student_name || row.name || "").toLowerCase();
    const email = String(row.email || row.student_email || "").toLowerCase();
    const matchSearch = !s || reg.includes(s) || name.includes(s) || email.includes(s);

    const status = String(row.enrollment_status || row.status || "Active");
    const matchStatus =
      state.statusFilter === "all" || status.toLowerCase() === state.statusFilter.toLowerCase();

    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen">
      {/* Hidden Excel File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleBulkUpload}
      />

      {/* Header */}
      <PageHeader
        title="Student Enrollment"
        subtitle="Manage student roster and course offering enrollments."
        icon={<Users className="h-5 w-5 text-color2" />}
        records={`${filteredRecords.length} Students`}
        actionBtn1={{
          label: "Enroll Students",
          icon: <IconPlus className="h-4 w-4" />,
          onClick: () => setEnrollModal(true),
        }}
      />

      {/* Offering Selector & Controls */}
      <div className="panel mb-5 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-[280px] flex-1">
            <CustomSelect
              title="Select Course Offering (Section)"
              options={state.courseInstances}
              value={state.selectedInstance}
              onChange={(v) => setState({ selectedInstance: v })}
              placeholder="Select Course Offering..."
            />
          </div>
          <div className="flex items-center gap-2 pt-5">
            <button
              type="button"
              onClick={() => setBulkModalOpen(true)}
              disabled={!state.selectedInstance?.value}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-[#000] hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <Upload className="h-4 w-4 text-color2" />
              Import Excel / CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="relative max-w-[340px] flex-1">
          <TextInput
            placeholder="Search by student name, register number or email"
            type="text"
            value={state.search}
            onChange={(e) => setState({ search: e.target.value })}
            icon={<IconSearch className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-3">
          <CustomSelect
            options={STATUS_OPTIONS}
            value={STATUS_OPTIONS.find((o) => o.value === state.statusFilter) ?? null}
            onChange={(e) => setState({ statusFilter: e?.value ?? "all" })}
            placeholder="All Statuses"
            className="filter-input"
            isClearable
          />
        </div>
      </div>

      {/* Table */}
      <div className="panel">
        <TableComponent
          records={filteredRecords}
          columns={COLUMNS}
          loading={state.loading}
          noRecordsText={
            state.selectedInstance
              ? "No students enrolled in this offering yet."
              : "Please select a course offering above."
          }
          showPagination
          pageSize={10}
          paginationLabel="students"
        />
      </div>

      {/* Manual Enroll Modal */}
      <EnrollStudentsModal
        open={enrollModal}
        onClose={() => setEnrollModal(false)}
        courseCode={state.selectedInstance?.data?.course_code || "Course"}
        courseTitle={state.selectedInstance?.data?.course_instance_name || state.selectedInstance?.label || "Offering"}
        availableStudents={state.availableStudents}
        onEnroll={handleBatchEnroll}
      />

      {/* Bulk Upload with Validation Modal */}
      <BulkEnrollmentUploadModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        courseInstanceId={state.selectedInstance?.value}
        courseId={state.selectedInstance?.data?.course_id}
        courseName={state.selectedInstance?.label}
        onSuccess={() => {
          if (state.selectedInstance?.value) {
            fetchEnrolledStudents(state.selectedInstance.value);
            fetchAvailableStudents();
          }
        }}
      />
    </div>
  );
};

export default PrivateRouter(StudentEnrollment);
