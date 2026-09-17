import { DataTable } from "mantine-datatable";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { setPageTitle } from "../store/themeConfigSlice";
import { clearApplicationCount } from "../store/notificationSlice";
import TextInput from "@/components/FormFields/TextInput.component";
import TextArea from "@/components/FormFields/TextArea.component";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import CustomPhoneInput from "@/components/phoneInput";
import IconSearch from "@/components/Icon/IconSearch";
import IconPlus from "@/components/Icon/IconPlus";
import IconTrash from "@/components/Icon/IconTrash";
import IconEye from "@/components/Icon/IconEye";
import IconEyeOff from "@/components/Icon/IconEyeOff";
import IconLoader from "@/components/Icon/IconLoader";
import IconEdit from "@/components/Icon/IconEdit";
import Pagination from "@/components/pagination/pagination";
import {
  buildFormData,
  capitalizeFLetter,
  formatScheduleDateTime,
  showDeleteAlert,
  truncateText,
  useSetState,
} from "@/utils/function.utils";
import Modal from "@/components/modal/modal.component";
import { Models } from "@/imports/models.import";
import { Success, Failure } from "@/utils/function.utils";
import useDebounce from "@/hook/useDebounce";
import Swal from "sweetalert2";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  ClipboardList,
  UserCircle,
  Calendar,
  MessageSquare,
  Star,
  Building2,
  Mail,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Filter,
  FilterIcon,
  SlidersHorizontal,
  Hourglass,
  Verified,
  VerifiedIcon,
  X,
  BriefcaseBusiness,
  User,
  Phone,
} from "lucide-react";
import CustomeDatePicker from "@/components/datePicker";
import PrivateRouter from "@/hook/privateRouter";
import moment from "moment";
import { CALENDAR_CLIENT_ID,   RECORDS, ROLES, STATUS_COLOR } from "@/utils/constant.utils";
import Utils from "@/imports/utils.import";
import * as Yup from "yup";
import Link from "next/link";
import IconDownload from "@/components/Icon/IconDownload";
import * as XLSX from "xlsx";

const SESSION_KEY = "my_application_page";

const Application = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const profileRef = useRef(null);

  const [state, setState] = useSetState({
    page: 1,
    pageSize: 10,
    recordsData: [],
    totalRecords: 0,
    search: "",
    statusFilter: null,
    showModal: false,
    showFilterModal: false,
    loading: false,
    submitting: false,
    exporting: false,
    sortBy: "",
    sortOrder: "asc",
    applicant_name: "",
    applicant_email: "",
    applicant_phone: "",
    position_applied: "",
    qualification: "",
    experience: "",
    cover_letter: "",
    errors: {},
    count: 0,
    applicationList: [],
    next: null,
    prev: null,
    editId: null,

    // Filter states
    institutionFilter: null,
    collegeFilter: null,
    departmentFilter: null,
    start_date: "",
    end_date: "",
    locationFilter: null,
    categoryFilter: null,
    priorityFilter: null,
    typeFilter: null,
    salaryFilter: null,

    // Dropdown data
    institutionList: [],
    institutionLoading: false,
    institutionPage: 1,
    institutionNext: null,

    collegeList: [],
    collegeLoading: false,
    collegePage: 1,
    collegeNext: null,

    departmentList: [],
    departmentLoading: false,
    departmentPage: 1,
    departmentNext: null,

    locationList: [],
    locationLoading: false,

    categoryList: [],
    categoryLoading: false,

    salaryRangeList: [],
    salaryRangeLoading: false,

    priorityList: [],
    priorityLoading: false,

    typeList: [],
    typeLoading: false,

    jobStatusList: [],
    jobStatusLoading: false,

    profile: null,
    showStatusModal: false,

    // Interview Schedule Modal
    showInterviewModal: false,
    selectedJobs: [],
    selectedDepartments: [],
    interviewSlot: "",
    panelMembers: [],
    selectedApplicants: [],
    requestForChange: false,
    googleAuthCode: "",
    roundName: "",
    interviewStatus: null,

    jobList: [],
    jobLoading: false,
    panelMemberList: [],
    panelMemberLoading: false,
    applicantsList: [],
    applicantsLoading: false,
    interviewStatusList: [
      { value: "scheduled", label: "Scheduled" },
      { value: "completed", label: "Completed" },
    ],
    isOpenRound: false,
    expandedRounds: {},
    selectedRecords: [],
    sortingFilter: {
      value: 1,
      label: "All Records",
    },
  });

  const debounceSearch = useDebounce(state.search, 500);

  useEffect(() => {
    dispatch(setPageTitle("Applications"));
    dispatch(clearApplicationCount());
    const savedPage = parseInt(sessionStorage.getItem(SESSION_KEY) || "1", 10);
    if (savedPage > 1) {
      setState({ page: savedPage });
    }
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const savedForm = sessionStorage.getItem("interviewFormState");
    if (code && savedForm) {
      const restored = JSON.parse(savedForm);
      sessionStorage.removeItem("interviewFormState");
      window.history.replaceState({}, "", window.location.pathname);
      profile(savedPage, { googleAuthCode: code, showInterviewModal: true, ...restored }, restored);
    } else {
      profile(savedPage);
    }
    institutionDropdownList(1);
    locationList(1);
    salaryRangeList(1);
    priorityList(1);
    typeList();
    jobStatusList();
    categoryList(1);
    applicationStatusList();
    applicationStatusExceptAppliedandInterList();
  }, []);

  useEffect(() => {
    if (profileRef.current) {
      sessionStorage.removeItem(SESSION_KEY);
      setState({ page: 1 });
      const role = state.profile?.role;
      if (role === ROLES.SUPER_ADMIN) {
        applicationList(1, null, null, null, state.profile?.id);
      } else if (role === ROLES.INSTITUTION_ADMIN) {
        applicationList(
          1,
          state.profile?.institution?.id,
          null,
          null,
          state.profile?.id,
        );
      } else if (role === ROLES.HR) {
        setState({
          collegeList: state.profile?.college?.map((item) => ({
            value: item?.college_id,
            label: item?.short_name,
          })),
        });
        applicationList(
          1,
          null,
          state.profile?.college?.map((item) => item?.college_id),
          null,
          state.profile?.id,
        );
      } else if (role === ROLES.HOD) {
        applicationList(
          1,
          null,
          null,
          state.profile?.department?.department_id,
          state.profile?.id,
        );
      }
    }
  }, [
    debounceSearch,
    state.selectedStatus,
    state.sortBy,
    state.institutionFilter,
    state.collegeFilter,
    state.departmentFilter,
    state.start_date,
    state.end_date,
    state.locationFilter,
    state.categoryFilter,
    state.priorityFilter,
    state.typeFilter,
    state.salaryFilter,
    state.sortingFilter,
    state.filterCollege,
  ]);

  useEffect(() => {
    if (state.profile?.role === ROLES.HR && state.profile?.college?.length > 0) {
      readApplicationNotification(state.profile.college.map((item) => item?.college_id));
    }
  }, [state.profile]);

  console.log("✌️collegeList --->", state.collegeList);

  const profile = async (initialPage = 1, restoreState: any = null, restored: any = null) => {
    try {
      const res: any = await Models.auth.profile();
      setState({ profile: res });
      profileRef.current = true;
      

      if (restoreState) {
        setState(restoreState);
        if (restored?.selectedDepartments?.length > 0) {
          loadPanelMembers(1, "", false, restored.selectedDepartments);
          // Pass profile id directly since state.profile not yet set
          const body: any = { department: restored.selectedDepartments?.map((item) => item?.value) };
          body.created_by = res?.id;
          body.team = "No";
          Models.application.list(1, body).then((appRes: any) => {
            const dropdown = appRes?.results?.map((item) => ({
              value: item.id,
              label: `${item.first_name} ${item.last_name}`,
            }));
            setState({ applicantsList: dropdown, appPage: 1, appNext: appRes?.next });
          });
        }
        if (restored?.selectedJobs?.length > 0) {
          loadDepartmentsByJobs(1, "", false, restored.selectedJobs);
        }
      }
      if (res?.role == ROLES.SUPER_ADMIN) {
        collegeDropdownList(1, "", false, "", res.id);
        applicationList(initialPage, null, null, null, res?.id);
        loadJobList(1, null, false, null, null, null, res?.id);
      } else if (res?.role == ROLES.INSTITUTION_ADMIN) {
        collegeDropdownList(1, "", false, res?.institution?.id, res.id);
        applicationList(initialPage, res?.institution?.id, null, null, res?.id);
        loadJobList(1, null, false, null, null, null, res?.id);
      } else if (res?.role == ROLES.HR) {
        setState({
          collegeList: res?.college?.map((item) => ({
            value: item?.college_id,
            label: item?.short_name,
          })),
        });
        applicationCount(res?.college?.map((item) => item?.college_id));

        departmentDropdownList(
          1,
          "",
          false,
          res?.college?.map((college) => college.college_id),
          null,
        );
        applicationList(
          initialPage,
          null,
          res?.college?.map((college) => college.college_id),
          null,
          res?.id,
        );
        loadJobList(1, null, false, null, null, null, res?.id);
      } else if (res?.role == ROLES.HOD) {
        applicationList(
          initialPage,
          null,
          null,
          res?.department?.department_id,
          res?.id,
        );
        loadJobList(1, null, false, null, null, null, res?.id);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const applicationStatusList = async () => {
    try {
      setState({ applicationStatusLoading: true });
      const body = {
        rexclude_applied_interview: "Yes",
      };
      const res: any = await Models.master.application_status_list(body);
      const dropdown = res?.map((item) => ({
        value: item.id,
        label: item.name,
      }));
      setState({
        applicationStatusLoading: false,
        applicationStatusList: dropdown,
      });
    } catch (error) {
      setState({ applicationStatusLoading: false });
    }
  };

  const applicationStatusExceptAppliedandInterList = async () => {
    try {
      setState({ applicationStatusLoading: true });
      const body = {
        rexclude_applied_interview: "Yes",
      };
      const res: any = await Models.master.application_status_list(body);
      const dropdown = res?.map((item) => ({
        value: item.id,
        label: item.name,
      }));
      setState({
        applicationStatusLoading: false,
        applicationStatusesList: dropdown,
      });
    } catch (error) {
      setState({ applicationStatusLoading: false });
    }
  };

  const formatApplicationRow = (item: any) => ({
    applicant_name: `${item?.first_name || ""} ${item?.last_name || ""}`.trim(),
    applicant_email: item?.email,
    applicant_phone: item?.phone,
    position_applied: item?.position_applied,
    qualification: item?.qualification || item?.job_detail?.qualification,
    experience: item?.experience,
    status: item?.status,
    status_display: item?.status_display,
    id: item?.id,
    applied_date: item?.applied_date || item?.created_at,
    created_at: item?.created_at,
    updated_at: item?.updated_at,
    job_title: item?.job_detail?.job_title || item?.job_title,
    job_short_title: item?.job_detail?.short_name || item?.job_short_name,
    job_description: item?.job_detail?.job_description,
    resume: item?.resume,
    application_status: {
      value: item?.application_status?.id,
      label: item?.application_status?.name,
    },
    institution_name:
      item?.job_detail?.institution?.name ||
      item?.job_detail?.institution?.institution_name ||
      "-",
    college_name: item?.job_detail?.college?.short_name,
    college_full_name: item?.job_detail?.college?.name,
    department_name: item?.department_details?.map(
      (department: any) => department?.short_name,
    ),
    department_full_name:
      item?.job_detail?.department?.length > 0
        ? item?.job_detail?.department?.map(
            (department: any) => department?.name || department?.short_name,
          )
        : item?.department_details?.map(
            (department: any) =>
              department?.department_name || department?.short_name,
          ),
    categories:
      item?.job_detail?.categories?.length > 0
        ? item?.job_detail?.categories?.map((category: any) => category?.name)
        : [],
    locations:
      item?.job_detail?.locations?.length > 0
        ? item?.job_detail?.locations?.map((location: any) => location?.city)
        : [],
    salary_range: item?.job_detail?.salary_range,
    job_experience: item?.job_detail?.experiences?.name,
    priority: item?.job_detail?.priority,
    number_of_openings: item?.job_detail?.number_of_openings,
    last_date: item?.job_detail?.last_date,
    interview_status:
      item?.interview_slots?.length > 0
        ? item?.interview_slots[item?.interview_slots.length - 1]?.status
        : "-",
    job_id: item?.job,
    is_viewed: item?.is_viewed,
    interview_slots: item?.interview_slots
  });

  const buildApplicationListBody = (
    institutionId = null,
    collegeId = null,
    deptId = null,
    profileId = null,
  ) => {
    const body = bodyData();

    if (institutionId) {
      body.institution = institutionId;
    }
    if (collegeId) {
      body.college = collegeId;
    }
    if (deptId) {
      body.department = deptId;
    }
    if (state.departmentFilter) {
      body.department = state.departmentFilter?.value;
    }
    if (state.filterCollege) {
      body.college = state.filterCollege?.value;
    }
    if (state.sortingFilter?.value) {
      if (state.sortingFilter?.value == 2) {
        body.team = "No";
        body.created_by = profileId;
      } else if (state.sortingFilter?.value == 3) {
        body.created_by = profileId;
        body.team = "Yes";
      }
    }

    return body;
  };

  const applicationList = async (
    page,
    institutionId = null,
    collegeId = null,
    deptId = null,
    profileId = null,
  ) => {
    try {
      setState({ loading: true });
      const body = buildApplicationListBody(
        institutionId,
        collegeId,
        deptId,
        profileId,
      );

      const res: any = await Models.application.list(page, body);

      const tableData = res?.results?.map(formatApplicationRow);
      setState({
        loading: false,
        page: page,
        count: res?.count,
        applicationList: tableData,
        next: res?.next,
        prev: res?.previous,
        applications_by_status: res?.applications_by_status,
      });
    } catch (error) {
      console.error("Error fetching applications:", error);
      setState({
        recordsData: [],
        totalRecords: 0,
        loading: false,
      });
    }
  };

  const readApplicationNotification = async (collegeIds?: number[]) => {
    try {
      const college_id = collegeIds ?? state.profile?.college?.map((item) => item?.college_id);
      if (!college_id?.length) return;
      const body = { college_id };
      await Models.notification.notification_view(body);
    } catch (error) {
      console.log("error", error);
    }
  }

  const applicationCount = async (college) => {
    try {
      setState({ applicationCountLoading: true });
      const body = {
        college,
      };
      const res: any = await Models.application.application_counts(body);
      setState({ applicationCount: res });
    } catch (error) {
      setState({ applicationCountLoading: false });
    }
  };

  const bodyData = () => {
    const body: any = {};
    if (state.search) {
      body.search = state.search;
    }
    if (state.institutionFilter?.value) {
      body.institution = state.institutionFilter.value;
    }
    if (state.collegeFilter?.value) {
      body.college = state.collegeFilter.value;
    }
    if (state.departmentFilter?.value) {
      body.department = state.departmentFilter.value;
    }
    if (state.start_date) {
      body.start_date = moment(state.start_date).format("YYYY-MM-DD");
    }
    if (state.end_date) {
      body.end_date = moment(state.end_date).format("YYYY-MM-DD");
    }
    if (state.locationFilter?.value) {
      body.location = state.locationFilter.value;
    }
    if (state.categoryFilter?.value) {
      body.category = state.categoryFilter.value;
    }
    if (state.priorityFilter?.value) {
      body.priority = state.priorityFilter.value;
    }
    if (state.typeFilter?.value) {
      body.job_type = state.typeFilter.value;
    }
    if (state.salaryFilter?.value) {
      body.salary_range = state.salaryFilter.value;
    }
    if (state.selectedStatus?.value) {
      body.status = state.selectedStatus.value;
    }
    if (state.sortBy) {
      body.ordering =
        state.sortOrder === "desc" ? `-${state.sortBy}` : state.sortBy;
    }
    return body;
  };

  const handlePageChange = (pageNumber: number) => {
    setState({ page: pageNumber });
    sessionStorage.setItem(SESSION_KEY, String(pageNumber));
    const role = state.profile?.role;
    if (role === ROLES.SUPER_ADMIN) {
      applicationList(pageNumber, null, null, null, state.profile?.id);
    } else if (role === ROLES.INSTITUTION_ADMIN) {
      applicationList(
        pageNumber,
        state.profile?.institution?.id,
        null,
        null,
        state.profile?.id,
      );
    } else if (role === ROLES.HR) {
      applicationList(
        pageNumber,
        null,
        state.profile?.college?.map((item) => item?.college_id),
        null,
        state.profile?.id,
      );
    } else if (role === ROLES.HOD) {
      applicationList(
        pageNumber,
        null,
        null,
        state.profile?.department?.department_id,
        state.profile?.id,
      );
    }
  };

  const handleStatusChange = (selectedOption: any) => {
    setState({ statusFilter: selectedOption, page: 1 });
  };

  const handleCloseModal = () => {
    setState({
      showModal: false,
      applicant_name: "",
      applicant_email: "",
      applicant_phone: "",
      position_applied: "",
      qualification: "",
      experience: "",
      cover_letter: "",
      errors: {},
      editId: null,
    });
  };

  const handleFormChange = (field: string, value: string) => {
    setState({
      [field]: value,
      errors: {
        ...state.errors,
        [field]: "",
      },
    });
  };

  const handleStatusSubmit = async () => {
    try {
      if (!state.selectedStatus) {
        Failure("Please select a status");
        return;
      }
      const body = {
        status: state.selectedStatus.label,
      };
      await Models.application.update(body, state.selectedApplication?.id);
      Success("Application status updated successfully!");
      setState({
        showStatusModal: false,
        selectedApplication: null,
        selectedStatus: null,
      });
      const role = state.profile?.role;
      if (role === ROLES.SUPER_ADMIN) {
        applicationList(state.page, null, null, null, state.profile?.id);
      } else if (role === ROLES.INSTITUTION_ADMIN) {
        applicationList(
          state.page,
          state.profile?.institution?.id,
          null,
          null,
          state.profile?.id,
        );
      } else if (role === ROLES.HR) {
        applicationList(
          state.page,
          null,
          state.profile?.college?.map((item) => item?.college_id),
          null,
          state.profile?.id,
        );
      } else if (role === ROLES.HOD) {
        applicationList(
          state.page,
          null,
          null,
          state.profile?.department?.department_id,
          state.profile?.id,
        );
      }
      applicationCount(state.profile?.college?.map((item) => item?.college_id));
    } catch (error) {
      Failure("Failed to update status. Please try again.");
    }
  };

  const handleEdit = (row) => {
    router.push(`/faculty/application_detail?id=${row?.id}`);
  };

  const handleUpdateStatus = async (row: any, newStatus: string) => {
    try {
      const role = state.profile?.role;
      if (role === ROLES.SUPER_ADMIN) {
        applicationList(state.page, null, null, null, state.profile?.id);
      } else if (role === ROLES.INSTITUTION_ADMIN) {
        applicationList(
          state.page,
          state.profile?.institution?.id,
          null,
          null,
          state.profile?.id,
        );
      } else if (role === ROLES.HR) {
        applicationList(
          state.page,
          null,
          state.profile?.college?.map((item) => item?.college_id),
          null,
          state.profile?.id,
        );
      } else if (role === ROLES.HOD) {
        applicationList(
          state.page,
          null,
          null,
          state.profile?.department?.department_id,
          state.profile?.id,
        );
      }
    } catch (error) {
      Failure("Failed to update status. Please try again.");
    }
  };

  const handleDelete = (row) => {
    showDeleteAlert(
      () => {
        deleteRecord(row);
      },
      () => {
        Swal.fire("Cancelled", "Your Record is safe :)", "info");
      },
      "Are you sure want to delete record?",
    );
  };

  const institutionDropdownList = async (
    page,
    search = "",
    loadMore = false,
  ) => {
    try {
      setState({ institutionLoading: true });
      const body = { search };
      const res: any = await Models.institution.list(page, body);
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.institution_name,
      }));
      setState({
        institutionLoading: false,
        institutionPage: page,
        institutionList: loadMore
          ? [...state.institutionList, ...dropdown]
          : dropdown,
        institutionNext: res?.next,
      });
    } catch (error) {
      setState({ institutionLoading: false });
    }
  };

  const collegeDropdownList = async (
    page,
    search = "",
    loadMore = false,
    institutionId = null,
    createdBy = null,
  ) => {
    try {
      setState({ collegeLoading: true });
      const body: any = { search };
      if (institutionId) {
        body.institution = institutionId;
      } else if (state.profile?.role === "institution_admin") {
        body.institution = state.profile?.institution?.id;
      }
      if (createdBy) {
        body.created_by = createdBy;
      }
      body.team = "No";
      const res: any = await Models.college.list(page, body);
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.college_name,
      }));
      setState({
        collegeLoading: false,
        collegePage: page,
        collegeList: loadMore ? [...state.collegeList, ...dropdown] : dropdown,
        collegeNext: res?.next,
      });
    } catch (error) {
      setState({ collegeLoading: false });
    }
  };

  const departmentDropdownList = async (
    page,
    search = "",
    loadMore = false,
    collegeId = null,
    createdBy = null,
  ) => {
    try {
      setState({ departmentLoading: true });
      const body: any = { search };
      if (collegeId) {
        body.college = collegeId;
      } else if (state.profile?.role === "hr") {
        body.college = state.profile?.college?.college_id;
      }
      if (createdBy) {
        body.created_by = createdBy;
      }
      body.pagination = "No";
      // body.team = "No";
      const res: any = await Models.department.list(page, body);
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.short_name,
      }));
      setState({
        departmentLoading: false,
        departmentPage: page,
        departmentList: loadMore
          ? [...state.departmentList, ...dropdown]
          : dropdown,
        departmentNext: res?.next,
      });
    } catch (error) {
      setState({ departmentLoading: false });
    }
  };

  const locationList = async (page = 1) => {
    try {
      setState({ locationLoading: true });
      const res: any = await Models.job.job_locations();
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.city,
      }));
      setState({ locationLoading: false, locationList: dropdown });
    } catch (error) {
      setState({ locationLoading: false });
    }
  };

  const categoryList = async (page = 1) => {
    try {
      setState({ categoryLoading: true });
      const res: any = await Models.job.job_category();
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.name,
      }));
      setState({ categoryLoading: false, categoryList: dropdown });
    } catch (error) {
      setState({ categoryLoading: false });
    }
  };

  const salaryRangeList = async (page = 1) => {
    try {
      setState({ salaryRangeLoading: true });
      const res: any = await Models.job.job_salary_ranges();
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.name,
      }));
      setState({ salaryRangeLoading: false, salaryRangeList: dropdown });
    } catch (error) {
      setState({ salaryRangeLoading: false });
    }
  };

  const priorityList = async (page = 1) => {
    try {
      setState({ priorityLoading: true });
      const res: any = await Models.job.job_priority();
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.name,
      }));
      setState({ priorityLoading: false, priorityList: dropdown });
    } catch (error) {
      setState({ priorityLoading: false });
    }
  };

  const typeList = async (page = 1) => {
    try {
      setState({ typeLoading: true });
      const res: any = await Models.job.job_types();
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.name,
      }));
      setState({ typeLoading: false, typeList: dropdown });
    } catch (error) {
      setState({ typeLoading: false });
    }
  };

  const jobStatusList = async (page = 1) => {
    try {
      setState({ jobStatusLoading: true });
      const res: any = await Models.job.job_status();
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.name,
      }));
      setState({ jobStatusLoading: false, jobStatusList: dropdown });
    } catch (error) {
      setState({ jobStatusLoading: false });
    }
  };

  const handleInstitutionChange = (selectedOption: any) => {
    setState({
      institutionFilter: selectedOption,
      collegeFilter: null,
      collegeList: [],
      page: 1,
    });
    if (selectedOption?.value) {
      collegeDropdownList(
        1,
        "",
        false,
        selectedOption.value,
        state.profile?.id,
      );
    }
  };

  const handleCollegeChange = (selectedOption: any) => {
    setState({
      collegeFilter: selectedOption,
      departmentFilter: null,
      departmentList: [],
      page: 1,
    });
    if (selectedOption?.value) {
      departmentDropdownList(
        1,
        "",
        false,
        selectedOption.value,
        state.profile?.id,
      );
    }
  };

  const handleDepartmentChange = (selectedOption: any) => {
    setState({ departmentFilter: selectedOption, page: 1 });
  };

  const deleteRecord = async (row: any) => {
    try {
      await Models.application.delete(row?.id);
      Success("Application deleted successfully!");
      // applicationList(state.page);
      handleUpdateStatus("", "");
      if (state.selectedRecords?.length > 0) {
        const filter = state.selectedRecords?.filter((item) => item != row?.id);
        setState({ selectedRecords: filter });
      }
    } catch (error) {
      Failure("Failed to delete application. Please try again.");
    }
  };

  const handleSubmit = async () => {
    try {
      setState({ submitting: true });
      const body = {
        applicant_name: state.applicant_name,
        applicant_email: state.applicant_email,
        applicant_phone: state.applicant_phone,
        position_applied: state.position_applied,
        qualification: state.qualification,
        experience: state.experience,
        cover_letter: state.cover_letter,
        status: "Pending",
      };

      if (state.editId) {
        await Models.application.update(body, state.editId);
        Success("Application updated successfully!");
      } else {
        await Models.application.create(body);
        Success("Application created successfully!");
      }

      applicationList(state.page);
      handleCloseModal();
    } catch (error: any) {
      if (error?.inner) {
        const errors: any = {};
        error?.inner?.forEach((err: any) => {
          errors[err?.path] = err.message;
        });
        setState({ errors });
      } else {
        Failure("Failed to create application. Please try again.");
      }
    } finally {
      setState({ submitting: false });
    }
  };

  const handleDownloadResume = (row) => {
    if (row?.resume) {
      window.open(row.resume, "_blank");
    }
  };

  // Interview Schedule Functions
  const loadJobList = async (
    page = 1,
    search = "",
    loadMore = false,
    institutionId = null,
    collegeId = null,
    deptId = null,
    created_by = null,
  ) => {
    try {
      setState({ jobLoading: true });
      const body: any = { search };
      if (institutionId) body.institution = institutionId;
      if (collegeId) body.college = collegeId;
      if (deptId) body.department = deptId;
      body.created_by = state.profile?.id;
      if (created_by) {
        body.created_by = created_by;
      }
      body.team = "No";
      const res: any = await Models.job.list(page, body);
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.job_title,
        department_id: item.department,
      }));
      setState({
        jobPage: page,
        jobLoading: false,
        jobList: loadMore ? [...state.jobList, ...dropdown] : dropdown,
        jobNext: res?.next,
      });
    } catch (error) {
      setState({ jobLoading: false });
    }
  };

  const loadDepartmentsByJobs = async (
    page = 1,
    search = "",
    loadMore = false,
    job = null,
  ) => {
    try {
      const body = {
        job_id: job?.map((item) => item?.value),
        search,
      };

      const res: any = await Models.department.list(page, body);
      // const uniqueDeptIds = [...new Set(deptIds)];
      // const body: any = { ids: uniqueDeptIds.join(",") };
      // const res: any = await Models.department.list(1, body);
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.department_name,
      }));
      setState({
        interviewDeptList: loadMore
          ? [...state.interviewDeptList, ...dropdown]
          : dropdown,
        deptPage: page,
        deptNext: res?.next,
      });
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadPanelMembers = async (
    page = 1,
    search = "",
    loadMore = false,
    deptId = null,
  ) => {
    try {
      setState({ panelMemberLoading: true });
      const body: any = { search };
      if (deptId) body.department_id = deptId?.map((item) => item?.value);
      const res: any = await Models.master.panel_list(body, page);
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: item.name,
      }));
      setState({
        panelMemberLoading: false,
        panelMemberList: loadMore
          ? [...state.panelMemberList, ...dropdown]
          : dropdown,
        panelNext: res?.next,
        panelPage: page,
      });
    } catch (error) {
      setState({ panelMemberLoading: false });
    }
  };

  const loadApplicantsByDept = async (
    page = 1,
    search = "",
    loadMore = false,
    deptIds,
  ) => {
    try {
      setState({ applicantsLoading: true });
      const body: any = {
        search,
      };
      if (deptIds) {
        body.department = deptIds?.map((item) => item?.value);
      }
      body.created_by = state.profile?.id;
      body.team = "No";
      const res: any = await Models.application.list(page, body);
      const dropdown = res?.results?.map((item) => ({
        value: item.id,
        label: `${item.first_name} ${item.last_name}`,
      }));
      setState({
        applicantsLoading: false,
        applicantsList: loadMore
          ? [...state.applicantsList, ...dropdown]
          : dropdown,
        appPage: page,
        appNext: res?.next,
      });
    } catch (error) {
      setState({ applicantsLoading: false });
    }
  };

  const handleInterviewScheduleSubmit = async () => {
    try {
      setState({ submitting: true });

      const validation = {
        selectedJobs: state.selectedJobs.map((j) => j.value),
        selectedDepartments: state.selectedDepartments?.map(
          (item) => item?.value,
        ),
        interviewSlot: state.interviewSlot
          ? moment(state.interviewSlot).format("YYYY-MM-DD HH:mm")
          : "",
        panelMembers: state.panelMembers.map((p) => p.value),
        selectedApplicants: state.selectedApplicants.map((a) => a.value),
        request_for_change: state.requestForChange,
        roundName: state.roundName,
        interviewStatus: "Scheduled",
        response_from_applicant: state.requestForChange,
        interview_link: state.interview_link,
      };

      await Utils.Validation.interview.validate(validation, {
        abortEarly: false,
      });

      const body:any = {
        position_ids: state.selectedJobs.map((j) => j.value),
        // department_id: state.selectedDepartments?.map((item)=>item?.value),
        department_id: state.selectedDepartments[0]?.value,

        scheduled_date: moment(state.interviewSlot).format("YYYY-MM-DD HH:mm"),
        panel_ids: state.panelMembers.map((p) => p.value),
        application_ids: state.selectedApplicants.map((a) => a.value),
        response_from_applicant: state.requestForChange,
        round_name: state.roundName,
        status: "Scheduled",
        interview_link: state.interview_link ?? "",
      };
      if (!state.google_calendar_connected_at && state.googleAuthCode) {
        body.code = state.googleAuthCode;
      }
      console.log("✌️body --->", body);

      await Models.interview.create(body);
      Success("Interview schedule created successfully!");
      setState({
        showInterviewModal: false,
        errors: {},
        selectedJobs: [],
        selectedDepartments: [],
        selectedApplicants: [],
        panelMembers: [],
        interviewSlot: "",
        roundName: "",
        requestForChange: false,
        interviewStatus: null,
        submitting: false,
        interview_link: "",
        selectedRecords: [],
        googleAuthCode: "",
      });
      sessionStorage.removeItem("interviewFormState");
      profile();
    } catch (error) {
      if (error instanceof Yup.ValidationError) {
        const validationErrors = {};
        error.inner.forEach((err) => {
          validationErrors[err.path] = err?.message;
        });

        setState({ errors: validationErrors, submitting: false });
      } else {
        Failure(error?.error);
        setState({ submitting: false });
      }
    }
  };

  const handleRound = async (row) => {
    try {
      const res: any = await Models.application.details(row?.id);

      setState({
        application: res,
        loading: false,
        appstatus: row?.application_status,
        isOpenRound: true,
      });
    } catch (error) {
      console.log("✌️error --->", error);
    }
  };

  const updateStatus = async () => {
    try {
      setState({ btnLoading: true });
      const body = {
        status: state.appstatus?.label,
      };
      const res = await Models.application.update(body, state.application?.id);
      Success("Application status updated successfully!");
      setState({ btnLoading: false, isOpenRound: false });
      handleUpdateStatus("", "");
      if (state.appstatus?.label == "Rejected") {
        const filter = state.selectedRecords?.filter(
          (item) => item != state.application?.id,
        );
        setState({ selectedRecords: filter });
      }
      applicationCount(state.profile?.college?.map((item) => item?.college_id));
    } catch (error) {
      setState({ btnLoading: false, isOpenRound: false });

      console.log("✌️error --->", error);
    }
  };

  const bulkSelect = async () => {
    try {
      const responses = await Promise.all(
        state.selectedRecords.map((id) => Models.application.details(id)),
      );

      console.log("✌️responses --->", responses);

      const jobMap = new Map();
      const deptMap = new Map();
      const applicantMap = new Map();

      responses.forEach((res) => {
        const job = res?.job_detail;
        const dept = res?.department_details;
        console.log("✌️dept --->", dept);

        // Job
        if (job && !jobMap.has(job.id)) {
          jobMap.set(job.id, {
            value: job.id,
            label: job.job_title?.trim() || "No Title",
          });
        }

        // Department
        // if (dept && !deptMap.has(dept.id)) {
        //   deptMap.set(dept.id, {
        //     value: dept.id,
        //     label: dept.short_name?.trim() || "No Department",
        //   });
        // }

        if (Array.isArray(dept)) {
          dept.forEach((dept) => {
            console.log("abcd --->", dept);
            if (dept && !deptMap.has(dept.id)) {
              deptMap.set(dept.id, {
                value: dept.id,
                label: dept.short_name?.trim() || "No Department",
              });
            }
          });
        }

        // Applicant
        if (res?.id && !applicantMap.has(res.id)) {
          applicantMap.set(res.id, {
            value: res.id,
            label: res.applicant_name?.trim() || "No Name",
          });
        }
      });

      const jobList = Array.from(jobMap.values());
      console.log("✌️jobList --->", jobList);
      const departmentList = Array.from(deptMap.values());
      console.log("✌️departmentList --->", departmentList);
      const applicantList = Array.from(applicantMap.values());
      console.log("✌️applicantList --->", applicantList);

      if (departmentList?.length > 0) {
        loadPanelMembers(1, "", false, departmentList);
      }

      setState({
        selectedJobs: jobList,
        selectedDepartments: departmentList,
        selectedApplicants: applicantList,
        showInterviewModal: true,
      });
    } catch (error) {
      console.log("error --->", error);
    }
  };

  const getDeptCollegeIds = () => {
    if (state.profile?.role === ROLES.HR) {
      return state.profile?.college?.map((c: any) => c.college_id);
    }
    return state.filterCollege?.value ? [state.filterCollege.value] : null;
  };

  const handleExportJobs = async () => {
    try {
      setState({ exporting: true });

      const role = state.profile?.role;
      const profileId = state.profile?.id;
      let institutionId = null;
      let collegeId = null;
      let deptId = null;

      if (role === ROLES.INSTITUTION_ADMIN) {
        institutionId = state.profile?.institution?.id;
      } else if (role === ROLES.HR) {
        collegeId = state.profile?.college?.map((item: any) => item?.college_id);
      } else if (role === ROLES.HOD) {
        deptId = state.profile?.department?.department_id;
      }

      const body = buildApplicationListBody(institutionId, collegeId, deptId, profileId);
      let page = 1;
      let hasNextPage = true;
      const results: any[] = [];

      while (hasNextPage) {
        const res: any = await Models.application.list(page, body);
        const pageResults = Array.isArray(res) ? res : res?.results || [];
        results.push(...pageResults);
        hasNextPage = !!res?.next;
        page += 1;
      }

      const applications = results.map(formatApplicationRow);

      if (applications.length === 0) {
        Failure("No applications available to export");
        return;
      }

      const headers = [
        "S.No", "Faculty Name", "Email", "Phone", "Experience",
        "Application Status", "Applied Date", "Interview Rounds",
        "Job Title", "Job Short Name", "Institution", "College", "Department",
        "Categories", "Locations", "Job Experience", "Qualification",
        "Salary Range", "Openings", "Urgency", "Interview Status",
        "Resume", "Job Description", "Created At", "Updated At",
      ];

      // Header style: dark blue bg, white text, bold
      const HEADER_BG = "FF1E3786";
      const HEADER_FG = "FFFFFFFF";

      const makeCell = (value: any, forceString = false): XLSX.CellObject => {
        if (value === null || value === undefined || value === "") return { v: "-", t: "s" };
        if (forceString) return { v: String(value), t: "s" };
        if (typeof value === "number") return { v: value, t: "n" };
        return { v: String(value), t: "s" };
      };

      const makeHeaderCell = (value: string): XLSX.CellObject => ({
        v: value, t: "s",
        s: {
          fill: { fgColor: { rgb: HEADER_BG } },
          font: { bold: true, color: { rgb: HEADER_FG }, sz: 11 },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: {
            bottom: { style: "thin", color: { rgb: "FFCCCCCC" } },
            right: { style: "thin", color: { rgb: "FFCCCCCC" } },
          },
        },
      });

      const wsData: XLSX.CellObject[][] = [headers.map(makeHeaderCell)];

      applications.forEach((app: any, index: number) => {
        wsData.push([
          makeCell(index + 1),
          makeCell(app.applicant_name || "-"),
          makeCell(app.applicant_email || "-"),
          makeCell(app.applicant_phone, true), // force string — no scientific notation
          makeCell(app.experience || "-"),
          makeCell(app.application_status?.label || app.status_display || app.status || "-"),
          makeCell(app.applied_date ? moment(app.applied_date).format("DD/MM/YYYY") : "-"),
          makeCell(app.interview_slots?.length > 0 ? app.interview_slots.map((s: any) => s?.round_name).join(", ") : "-"),
          makeCell(app.job_title || "-"),
          makeCell(app.job_short_title || "-"),
          makeCell(app.institution_name || "-"),
          makeCell(app.college_name || app.college_full_name || "-"),
          makeCell(app.department_full_name?.length > 0 ? app.department_full_name.join(", ") : "-"),
          makeCell(app.categories?.length > 0 ? app.categories.join(", ") : "-"),
          makeCell(app.locations?.length > 0 ? app.locations.join(", ") : "-"),
          makeCell(app.job_experience || "-"),
          makeCell(app.qualification || "-"),
          makeCell(app.salary_range || "-"),
          makeCell(app.number_of_openings ?? "-"),
          makeCell(app.priority || "-"),
          makeCell(app.interview_status || "-"),
          makeCell(app.resume || "-"),
          makeCell(app.job_description || "-"),
          makeCell(app.created_at ? moment(app.created_at).format("DD/MM/YYYY") : "-"),
          makeCell(app.updated_at ? moment(app.updated_at).format("DD/MM/YYYY") : "-"),
        ]);
      });

      const ws: XLSX.WorkSheet = {};
      wsData.forEach((row, R) => {
        row.forEach((cell, C) => {
          ws[XLSX.utils.encode_cell({ r: R, c: C })] = cell;
        });
      });
      ws["!ref"] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: wsData.length - 1, c: headers.length - 1 });
      ws["!cols"] = headers.map(() => ({ wch: 20 }));
      ws["!rows"] = [{ hpt: 30 }]; // taller header row

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Applications");
      XLSX.writeFile(wb, `application-list-${moment().format("YYYY-MM-DD")}.xlsx`);
    } catch (error) {
      Failure("Failed to export applications");
    } finally {
      setState({ exporting: false });
    }
  };

  return (
    <div className="min-h-screen dark:from-gray-900 dark:to-gray-800">
      {/* Header Section */}
      <div className="mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="page-ti  text-transparent">
              Application Management
            </h1>
            <p className="text-[#000] dark:text-[#000]">
              Manage and review job applications
            </p>
          </div>
          <button
            onClick={handleExportJobs}
            disabled={state.exporting}
            className="tour-add-job group relative inline-flex transform items-center gap-2 overflow-hidden rounded-lg bg-emerald-600 px-4 py-2  text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            <div className="absolute inset-0 bg-emerald-700 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
            <IconDownload className="relative z-10 h-5 w-5" />
            <span className="relative z-10">
              {state.exporting ? "Exporting..." : "Export"}
            </span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="tour-myapp-stats mb-6 flex gap-4">
        <div
          onClick={() =>
            setState({
              institutionFilter: null,
              collegeFilter: null,
              departmentFilter: null,
              start_date: null,
              end_date: null,
              selectedStatus: null,
            })
          }
          className=" flex-1 cursor-pointer rounded-lg  border-gray-200 bg-blue-100 px-4 py-4 transition hover:shadow-md dark:border-gray-700"
        >
          <div className="flex items-center gap-5">
            <div className="flex  items-center justify-center  bg-white/70 rounded-full p-2 dark:border-gray-700">
              <FileText className="text-dblue h-7 w-7" />
            </div>

            <div className="flex flex-col">
              <p className="text-2xl  leading-none text-[#000] dark:text-white">
                {state.applicationCount?.count || 0}
              </p>
              <p className="text-sm text-[#000] dark:text-[#000]">
                Applications
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() =>
            setState({ selectedStatus: { value: 5, label: "Applied" } })
          }
          className="flex-1 cursor-pointer rounded-lg  border-gray-200 bg-yellow-100 px-4 py-4 transition hover:shadow-md dark:border-gray-700"
        >
          <div className="flex items-center gap-5">
            <div className="flex  items-center justify-center  bg-white/70 rounded-full p-2 dark:border-gray-700">
              <Clock className="h-7 w-7 text-yellow-600" />
            </div>

            <div className="flex flex-col">
              <p className="text-2xl  leading-none text-[#000] dark:text-white">
                {state.applicationCount?.applications_by_status?.applied ||
                  state.applicationCount?.applications_by_status?.Applied ||
                  0}
              </p>
              <p className="text-sm text-[#000] dark:text-[#000]">
                Applied
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() =>
            setState({ selectedStatus: { value: 4, label: "Selected" } })
          }
          className="flex-1 cursor-pointer rounded-lg  border-gray-200 bg-green-100 px-4 py-4  transition hover:shadow-md dark:border-gray-700"
        >
          <div className="flex items-center gap-5">
            <div className="flex  items-center justify-center  bg-white/70 rounded-full p-2 dark:border-gray-700">
              <CheckCircle className="h-7 w-7 text-green-600" />
            </div>

            <div className="flex flex-col">
              <p className="text-2xl  leading-none text-[#000] dark:text-white">
                {state.applicationCount?.applications_by_status?.Selected || 0}
              </p>
              <p className="text-sm text-[#000] dark:text-[#000]">
                Selected
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() =>
            setState({
              selectedStatus: { value: 6, label: "Interview Scheduled" },
            })
          }
          className="flex-1 cursor-pointer rounded-lg  border-gray-200 bg-[#d2c1f7f2] px-4 py-4 transition hover:shadow-md dark:border-gray-700"
        >
          <div className="flex items-center gap-5">
            <div className="flex  items-center justify-center  bg-white/70 rounded-full p-2 dark:border-gray-700">
              <Clock className="h-7 w-7 text-[#7349cff2]" />
            </div>

            <div className="flex flex-col">
              <p className="text-2xl  leading-none text-[#000] dark:text-white">
                {state.applicationCount?.applications_by_status?.[
                  "Interview Scheduled"
                ] ||
                  state.applicationCount?.applications_by_status?.[
                    "interview scheduled"
                  ] ||
                  0}
              </p>
              <p className="text-sm text-[#000] dark:text-[#000]">
                Interview Scheduled
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="tour-myapp-filters mb-5 rounded-2xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between gap-5">
          <TextInput
            placeholder="Search applicants..."
            value={state.search}
            onChange={(e) => setState({ search: e.target.value })}
            icon={<IconSearch className="h-4 w-4" />}
          />

          {state.profile?.role == ROLES.HR && (
            <>
              <CustomSelect
                options={state.collegeList}
                value={state.filterCollege}
                onChange={(e) => {
                  if (e) {
                    departmentDropdownList(1, "", false, e?.value);
                  } else {
                    setState({ departmentFilter: "", departmentList: [] });
                  }
                  setState({ filterCollege: e });
                }}
                placeholder={"Select College"}
                isClearable={true}
              />
              <CustomSelect
                options={state.departmentList}
                value={state.departmentFilter}
                onChange={handleDepartmentChange}
                placeholder="Select department"
                isClearable={true}
                // onSearch={(searchTerm) => {
                //   const ids = getDeptCollegeIds();
                //   if (ids) departmentDropdownList(1, searchTerm, false, ids);
                // }}
                // loadMore={() => {
                //   if (state.departmentNext) {
                //     const ids = getDeptCollegeIds();
                //     if (ids)
                //       departmentDropdownList(
                //         state.departmentPage + 1,
                //         "",
                //         true,
                //         ids
                //       );
                //   }
                // }}
                loading={state.departmentLoading}
                disabled={!state.filterCollege}
              />
            </>
          )}
          {/* <CustomeDatePicker
            value={state.start_date}
            placeholder="Choose From"
            onChange={(e) => setState({ start_date: e })}
            showTimeSelect={false}
          />
          <CustomeDatePicker
            value={state.end_date}
            placeholder="Choose To "
            onChange={(e) => setState({ end_date: e })}
            showTimeSelect={false}
          /> */}

          <CustomSelect
            options={RECORDS}
            value={state.sortingFilter}
            onChange={(e) => setState({ sortingFilter: e })}
            placeholder={"All Records"}
            isClearable={false}
          />
          <button
            onClick={() => setState({ showFilterModal: true })}
            className="flex items-center gap-4 rounded-lg border bg-white p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 "
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </button>
        </div>
        <div className="mt-4">
          <div className="group relative"></div>
          {(() => {
            const activeFilters = [];
            if (state.institutionFilter)
              activeFilters.push({
                key: "institutionFilter",
                label: `Inst: ${state.institutionFilter.label}`,
              });
            if (state.sortingFilter?.value != 1 && state.sortingFilter)
              activeFilters.push({
                key: "sortingFilter",
                label: `Record: ${state.sortingFilter?.label}`,
              });
            if (state.filterCollege)
              activeFilters.push({
                key: "filterCollege",
                label: `College: ${state.filterCollege.label}`,
              });
            if (state.departmentFilter)
              activeFilters.push({
                key: "departmentFilter",
                label: `Dept: ${state.departmentFilter.label}`,
              });
            if (state.start_date)
              activeFilters.push({
                key: "start_date",
                label: `From: ${moment(state.start_date).format("DD/MM/YY")}`,
              });
            if (state.end_date)
              activeFilters.push({
                key: "end_date",
                label: `To: ${moment(state.end_date).format("DD/MM/YY")}`,
              });
            if (state.selectedStatus)
              activeFilters.push({
                key: "selectedStatus",
                label: `Status: ${state.selectedStatus.label}`,
              });

            if (activeFilters.length > 0) {
              return (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {activeFilters.map((filter) => (
                    <div
                      key={filter.key}
                      className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      <span>{filter.label}</span>
                      <button
                        onClick={() => setState({ [filter.key]: null })}
                        className="rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() =>
                      setState({
                        institutionFilter: null,
                        collegeFilter: null,
                        departmentFilter: null,
                        start_date: null,
                        end_date: null,
                        selectedStatus: null,
                        filterCollege: null,
                        sortingFilter: null,
                      })
                    }
                    className="text-xs  text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden rounded-lg   backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            {/* Left */}
            <h3 className="text-lg font-bold text-[#000] dark:text-white">
              Applicants List
            </h3>

            {/* Right */}
            <div className="flex items-center gap-4">
              {/* {state.selectedRecords?.length > 0 && (
                <button
                  onClick={() => bulkSelect()}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-dblue px-6 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-dblue opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>
                  <UserCheck className="relative z-10 h-5 w-5" />
                  <span className="relative z-10">Interview Schedule</span>
                </button>
              )} */}

              <div className="text-sm text-black">
                {state.count} applications found
              </div>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto border border-gray-200 bg-white tour-myapp-table">
          <DataTable
            noRecordsText="No applications found"
            highlightOnHover
            className="table-hover whitespace-nowrap"
            records={state.applicationList}
            fetching={state.loading}
            selectedRecords={state.applicationList?.filter((record) =>
              state.selectedRecords.includes(record.id),
            )}
            isRecordSelectable={(row: any) => row?.status !== "Rejected"}
            onSelectedRecordsChange={(records) => {
              const currentPageIds = state.applicationList?.map(
                (r: any) => r.id,
              );
              const otherPageSelections = state.selectedRecords?.filter(
                (id) => !currentPageIds.includes(id),
              );
              const newSelections = records?.map((r: any) => r.id);
              setState({
                selectedRecords: [...otherPageSelections, ...newSelections],
              });
            }}
            customLoader={
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-3">
                  <IconLoader className="h-6 w-6 animate-spin text-blue-600" />
                  <span className="text-[#000] dark:text-[#000]">
                    Loading applications...
                  </span>
                </div>
              </div>
            }
            rowStyle={(row: any) => !row?.is_viewed ? { backgroundColor: '#EFF6FF', fontWeight: 600 } : {}}
            columns={[
              {
                accessor: "applicant_name",
                title: "Faculty Name",
                sortable: true,

                render: (row) => (
                  <Link
                    href={`/faculty/application_detail?id=${row?.id}`}
                    title={row?.applicant_name}
                    className={`inline-flex items-center gap-2 ${!row?.is_viewed ? 'text-[#000] font-semibold' : 'text-[#000] dark:text-[#000]'}`}
                  >
                    {row?.applicant_name}
                  </Link>
                ),
              },
              {
                accessor: "job_short_title",
                title: "Job Title",
                sortable: true,
                render: (row) => (
                  <Link
                    href={`/faculty/job_details?id=${row?.job_id}`}
                    title={row?.job_title}
                    className={!row?.is_viewed ? 'text-[#000] font-semibold' : 'text-[#000] dark:text-[#000]'}
                  >
                    {row?.job_short_title}
                  </Link>
                ),
              },

              {
                accessor: "college",
                title: "College",
                sortable: true,
                render: (row) => (
                  <div
                    title={row?.college_name}
                    className={!row?.is_viewed ? 'text-[#000] font-semibold' : 'text-[#000] dark:text-[#000]'}
                  >
                    {row?.college_name}
                  </div>
                ),
              },
              {
                accessor: "department_name",
                title: "Department",
                render: (row) => {
                  const { department_name } = row;
                  if (!department_name || department_name?.length === 0) {
                    return <span className="text-[#000]">-</span>;
                  }

                  const firstDept = department_name?.[0];
                  const otherDept = department_name?.slice(1);
                  const maxShow = 3;
                  const remaining = otherDept?.length - maxShow;
                  const visibleDept = otherDept?.slice(0, maxShow);
                  const hiddenDept = otherDept?.slice(maxShow);

                  return (
                    <div className="flex flex-wrap items-center gap-2">
                      {/* First department text */}
                      <span
                        title={firstDept}
                        className={`text-sm ${!row?.is_viewed ? 'text-[#000] font-semibold' : 'text-[#000] dark:text-gray-300'}`}
                      >
                        {firstDept}
                      </span>

                      {/* Avatars */}
                      <div className="flex items-center -space-x-2">
                        {visibleDept?.map((dept: string, index: number) => (
                          <div key={index} className="group relative z-10">
                            <div className="bg-dblue flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs  text-white dark:border-gray-900">
                              {dept?.slice(0, 2)?.toUpperCase()}
                            </div>

                            {/* Tooltip */}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                              {capitalizeFLetter(dept)}
                            </div>
                          </div>
                        ))}
                        {remaining > 0 && (
                          <div className="group relative">
                            <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-gray-400 text-xs  text-white dark:border-gray-900">
                              +{remaining}
                            </div>

                            {/* Remaining tooltip */}
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                              {hiddenDept
                                ?.map((d: string) => capitalizeFLetter(d))
                                .join(", ")}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                },
                sortable: true,
              },

              // {
              //   accessor: "applicant_email",
              //   title: "Email",
              //   sortable: true,

              //   render: ({ applicant_email }) => (
              //     <span
              //       title={applicant_email}
              //       className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-[#000] dark:bg-gray-700 dark:text-gray-200"
              //     >
              //       {truncateText(applicant_email)}
              //     </span>
              //   ),
              // },
              // {
              //   accessor: "applicant_phone",
              //   title: "Phone",
              //   render: ({ applicant_phone }) => (
              //     <div className="text-[#000] dark:text-[#000]">
              //       {applicant_phone}
              //     </div>
              //   ),
              // },
              // {
              //   accessor: "experience",
              //   title: "Experience",
              //   render: ({ experience }) => (
              //     <div className="text-[#000] dark:text-[#000]">
              //       {experience}
              //     </div>
              //   ),
              // },

              {
                accessor: "status",
                title: "Status",
                sortable: true,

                render: (row) => (
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      STATUS_COLOR[row?.status] || "bg-slate-100 text-slate-800"
                    } ${!row?.is_viewed ? 'pt-0.5 font-semibold ring-1 ring-inset ring-current' : ''}`}
                  >
                    {capitalizeFLetter(row?.status)}
                  </span>
                ),
              },
              {
                accessor: "actions",
                title: "Actions",
                textAlignment: "center",
                render: (row: any) => (
                  <div className="tour-myapp-actions flex items-center justify-center gap-3">
                    <button
                      onClick={() => handleEdit(row)}
                      className="flex  items-center justify-center rounded-lg  text-green-900 transition-all duration-200 "
                      title="View"
                    >
                      <IconEye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadResume(row)}
                      className="flex  items-center justify-center rounded-lg text-blue-600 transition-all duration-200 "
                      title="Resume"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRound(row)}
                      className="flex  items-center justify-center rounded-lg  text-pink-600 transition-all duration-200 "
                      title="Interview Round"
                    >
                      <BriefcaseBusiness className="h-4 w-4" />
                    </button>

                    {state.profile?.role == ROLES.HR && (
                      <button
                        onClick={() => {
                          setState({
                            showStatusModal: true,
                            selectedApplication: row,
                            selectedStatus: row.application_status,
                          });
                        }}
                        className="flex items-center justify-center rounded-lg text-purple-600 transition-all duration-200 "
                        title="Update Status"
                      >
                        <UserCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(row)}
                      className="flex items-center justify-center rounded-lg  text-red-600 transition-all duration-200 "
                      title="Delete"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            sortStatus={{
              columnAccessor: state.sortBy,
              direction: state.sortOrder as "asc" | "desc",
            }}
            onSortStatusChange={({ columnAccessor, direction }) => {
              setState({
                sortBy: columnAccessor,
                sortOrder: direction,
                page: 1,
              });
              handleUpdateStatus(columnAccessor, direction);
            }}
            minHeight={200}
          />
        </div>

        <div className="border-t border-gray-200 p-6 dark:border-gray-700">
          <Pagination
            activeNumber={handlePageChange}
            totalPage={state.count}
            currentPages={state.page}
            pageSize={state.pageSize}
          />
        </div>
      </div>
      {state.selectedRecords?.length > 0 && (
        <div className="fixed bottom-6 right-9 z-50">
          <button
            onClick={bulkSelect}
            className="bg-dblue group relative inline-flex items-center gap-2 overflow-hidden rounded-xl px-6 py-3 font-medium text-white shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl"
          >
            <div className="bg-dblue absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"></div>

            <UserCheck className="relative z-10 h-5 w-5" />

            <span className="relative z-10">
              Interview Schedule ({state.selectedRecords.length})
            </span>
          </button>
        </div>
      )}

      <Modal
        subTitle="Update Application Status"
        closeIcon
        open={state.showStatusModal}
        close={() =>
          setState({
            showStatusModal: false,
            selectedApplication: null,
            selectedStatus: null,
          })
        }
        renderComponent={() => (
          <div className="p-6">
            <div className="mb-6">
              <CustomSelect
                options={state.applicationStatusList}
                value={state.selectedStatus}
                onChange={(e) => setState({ selectedStatus: e })}
                placeholder="Select status"
                loading={state.applicationStatusLoading}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  setState({
                    showStatusModal: false,
                    selectedApplication: null,
                    selectedStatus: null,
                  })
                }
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusSubmit}
                className="bg-dblue flex-1 rounded-lg px-4 py-2 text-white hover:shadow-lg"
              >
                Update Status
              </button>
            </div>
          </div>
        )}
      />

      {/* Interview Schedule Modal */}
      <Modal
        subTitle="Create Interview Schedule"
        closeIcon
        open={state.showInterviewModal}
        close={() =>
          setState({
            showInterviewModal: false,
            errors: {},
            selectedJobs: [],
            selectedDepartments: [],
            selectedApplicants: [],
            panelMembers: [],
            interviewSlot: "",
            roundName: "",
            requestForChange: false,
            interviewStatus: null,
            googleAuthCode: "",
          })
        }
        renderComponent={() => (
          <div className="">
            <div className="space-y-5">
              <CustomSelect
                title="Select Jobs"
                options={state.jobList}
                value={state.selectedJobs}
                onChange={(e) => {
                  setState({
                    selectedJobs: e,
                    selectedDepartments: null,
                    selectedApplicants: [],
                    panelMemberList: [],
                    panelMembers: null,
                    errors: { ...state.errors, selectedJobs: "" },
                  });

                  if (e) {
                    loadDepartmentsByJobs(1, "", false, e);
                  }
                }}
                onSearch={(searchTerm) => {
                  loadJobList(1, searchTerm);
                }}
                loadMore={() => {
                  state.jobNext && loadJobList(state.jobPage + 1, "", true);
                }}
                isMulti
                loading={state.jobLoading}
                error={state.errors.selectedJobs}
                required
                disabled
              />

              <CustomSelect
                title="Select Departments"
                options={state.interviewDeptList}
                value={state.selectedDepartments}
                onChange={(e) => {
                  setState({
                    selectedDepartments: e,
                    selectedApplicants: [],
                    panelMemberList: [],
                    panelMembers: null,
                    applicantsList: [],

                    errors: { ...state.errors, selectedDepartments: "" },
                  });
                  if (e) {
                    loadPanelMembers(1, "", false, e);
                    loadApplicantsByDept(1, "", false, e);
                  }
                }}
                onSearch={(searchTerm) => {
                  loadDepartmentsByJobs(
                    1,
                    searchTerm,
                    false,
                    state.selectedJobs,
                  );
                }}
                loadMore={() => {
                  state.deptNext &&
                    loadDepartmentsByJobs(
                      state.deptPage + 1,
                      "",
                      true,
                      state.selectedJobs,
                    );
                }}
                isMulti
                placeholder="Select Departments"
                error={state.errors.selectedDepartments}
                required
                disabled
              />

              <CustomSelect
                title="Select Faculty"
                options={state.applicantsList}
                value={state.selectedApplicants}
                onChange={(e) =>
                  setState({
                    selectedApplicants: e,
                    errors: { ...state.errors, selectedApplicants: "" },
                  })
                }
                onSearch={(searchTerm) => {
                  loadApplicantsByDept(
                    1,
                    searchTerm,
                    false,
                    state.selectedDepartments,
                  );
                }}
                loadMore={() => {
                  if (state.appNext) {
                    loadApplicantsByDept(
                      state.appPage + 1,
                      "",
                      false,
                      state.selectedDepartments,
                    );
                  }
                }}
                placeholder="Select Faculty"
                isMulti
                loading={state.applicantsLoading}
                disabled
                error={state.errors.selectedApplicants}
                required
              />

              <CustomSelect
                title="Select Panel Members"
                placeholder="Select Panel Members"
                options={state.panelMemberList}
                value={state.panelMembers}
                onChange={(e) => {
                  setState({
                    panelMembers: e,
                    errors: { ...state.errors, panelMembers: "" },
                  });
                }}
                onSearch={(searchTerm) => {
                  loadPanelMembers(
                    1,
                    searchTerm,
                    false,
                    state.selectedDepartments,
                  );
                }}
                loadMore={() => {
                  if (state.panelNext) {
                    loadPanelMembers(
                      state.panelPage + 1,
                      "",
                      false,
                      state.selectedDepartments,
                    );
                  }
                }}
                isMulti
                loading={state.jobLoading}
                error={state.errors?.panelMembers}
                required
              />
              <CustomeDatePicker
                title="Interview Slot"
                value={state.interviewSlot}
                placeholder="Choose From"
                onChange={(e) =>
                  setState({
                    interviewSlot: e,
                    errors: { ...state.errors, interviewSlot: "" },
                  })
                }
                showTimeSelect={true}
                required
                usePortal={false}
                minDate={new Date()}
                error={state.errors?.interviewSlot}
              />

              <TextInput
                title="Round Name"
                placeholder="Enter round name (e.g., Technical Round 1)"
                value={state.roundName}
                onChange={(e) =>
                  setState({
                    roundName: e.target.value,
                    errors: { ...state.errors, roundName: "" },
                  })
                }
                error={state.errors?.roundName}
                required
              />
              <TextInput
                title="Interview Link"
                placeholder="Enter interview link (e.g., https://example.com/interview)"
                value={state.interview_link}
                onChange={(e) =>
                  setState({
                    interview_link: e.target.value,
                    errors: { ...state.errors, interview_link: "" },
                  })
                }
                error={state.errors?.interview_link}
              />
<div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="requestForChange"
                  checked={state.requestForChange}
                  onChange={(e) =>
                    setState({ requestForChange: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="requestForChange"
                  className="text-sm pt-2 font-medium text-[#000] dark:text-gray-300"
                >
                  Request the candidate to change the interview slot
                </label>
              </div>
             {!state.profile?.google_calendar_connected_at && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="connectGoogleCalendar"
                      checked={!!state.googleAuthCode}
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Save current form state before redirect
                          sessionStorage.setItem(
                            "interviewFormState",
                            JSON.stringify({
                              selectedJobs: state.selectedJobs,
                              selectedDepartments: state.selectedDepartments,
                              selectedApplicants: state.selectedApplicants,
                              panelMembers: state.panelMembers,
                              interviewSlot: state.interviewSlot,
                              roundName: state.roundName,
                              requestForChange: state.requestForChange,
                              interview_link: state.interview_link,
                            })
                          );
                          const url = new URL(window.location.href);
                          url.searchParams.delete("code");
                          const redirectUri = url.toString();
                          const googleAuthUrl =
                            `https://accounts.google.com/o/oauth2/v2/auth?` +
                            `client_id=${CALENDAR_CLIENT_ID}&` +
                            `redirect_uri=https://user-service.88.222.213.249.nip.io/auth/google/callback&` +
                            `response_type=code&` +
                            `scope=${encodeURIComponent("https://www.googleapis.com/auth/calendar.events")}&` +
                            `access_type=offline&` +
                            `prompt=consent&` +
                            `state=${encodeURIComponent(redirectUri)}`;

                          window.location.href = googleAuthUrl;
                        } else {
                          setState({ googleAuthCode: "" });
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="connectGoogleCalendar"
                      className="pt-2  text-sm font-medium text-[#000] dark:text-gray-300"
                    >
                      {`Connect Google Calendar (Optional)`}
                      {state.googleAuthCode && (
                        <span className="ml-2 text-xs text-green-600">
                          ✓ Connected
                        </span>
                      )}
                    </label>
                  </div>
             )}  
            </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() =>
                  setState({
                    showInterviewModal: false,
                    errors: {},
                    selectedJobs: [],
                    selectedDepartments: [],
                    selectedApplicants: [],
                    panelMembers: [],
                    interviewSlot: "",
                    roundName: "",
                    requestForChange: false,
                    interviewStatus: null,
                    interview_link: "",
                    googleAuthCode: "",
                  })
                }
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-[#000] hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleInterviewScheduleSubmit}
                disabled={state.submitting}
                className="bg-dblue flex-1 rounded-lg  px-4 py-2 text-white hover:shadow-lg disabled:opacity-50"
              >
                {state.submitting ? "Creating..." : "Create Schedule"}
              </button>
            </div>
          </div>
        )}
      />

      {/* View Interview rounds and feedback */}

      <Modal
        subTitle="Interview Rounds"
        open={state.isOpenRound}
        close={() => setState({ isOpenRound: false })}
        closeIcon={() => setState({ isOpenRound: false })}
        padding="px-0 py-4"
        renderComponent={() => (
          <div className="flex h-[75vh] flex-col">
            {/* Scrollable Content */}
            <div className="flex-1 space-y-2 overflow-y-auto px-2">
              {/* Candidate */}
              <div className="rounded-xl border bg-white px-2 py-2 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-[#000]">
                  Application Details
                </p>

                {/* Name */}
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold">
                    {capitalizeFLetter(state.application?.first_name)}{" "}
                    {state.application?.last_name}
                  </h3>
                </div>

                {/* Email + Phone in single row */}
                <div className="mt-3 flex flex-wrap items-center gap-6 text-sm text-[#000]">
                  {/* Email */}
                  <div className="flex min-w-[200px] items-center gap-2">
                    <Mail className="h-4 w-4 text-[#000]" />
                    <span className="truncate">
                      {state.application?.email || "N/A"}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-[#000]" />
                    <span>{state.application?.phone || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Rounds */}
              <div className="space-y-4  ">
                {state.application?.interview_slots?.map((round) => {
                  const isRoundOpen = !!state.expandedRounds?.[round.id];
                  return (
                    <div
                      key={round.id}
                      className="rounded-lg border bg-white shadow-sm"
                    >
                      {/* Round Header — clickable accordion toggle */}
                      <button
                        type="button"
                        onClick={() =>
                          setState({
                            expandedRounds: {
                              ...state.expandedRounds,
                              [round.id]: !isRoundOpen,
                            },
                          })
                        }
                        className="flex w-full items-center justify-between p-4 text-left"
                      >
                        <p className="font-semibold">
                          {capitalizeFLetter(round.round_name)}
                        </p>
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded px-3 py-1 text-xs font-semibold ${
                              round.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {capitalizeFLetter(round.status)}
                          </span>
                          <p className="text-xs text-[#000]">
                            {formatScheduleDateTime(
                              round.scheduled_date,
                              round.scheduled_time,
                            )}
                          </p>
                          <svg
                            className={`h-4 w-4 text-[#000] transition-transform ${
                              isRoundOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </button>

                      {/* Feedback List */}
                      {isRoundOpen && (
                        <div className="space-y-2 border-t px-4 pb-4 pt-3">
                          <div>Pannel Members With Feedbacks :</div>
                          {round.panels?.map((panel) => {
                            const feedback = panel?.feedbacks?.[0];
                            const panelKey = `${round.id}-${panel.id}`;
                            const isPanelOpen =
                              !!state.expandedRounds?.[panelKey];
                            return (
                              <div
                                key={panel.id}
                                className="rounded border bg-gray-50"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    setState({
                                      expandedRounds: {
                                        ...state.expandedRounds,
                                        [panelKey]: !isPanelOpen,
                                      },
                                    })
                                  }
                                  className={`flex w-full items-center justify-between p-3 text-left ${
                                    feedback
                                      ? "cursor-pointer"
                                      : "cursor-default"
                                  }`}
                                >
                                  <p className="text-sm font-medium">
                                    {panel.name}
                                  </p>
                                  {feedback && (
                                    <svg
                                      className={`h-4 w-4 text-[#000] transition-transform ${
                                        isPanelOpen ? "rotate-180" : ""
                                      }`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  )}
                                </button>
                                {isPanelOpen && feedback && (
                                  <div className="border-t px-3 pb-3 pt-2">
                                    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                                      {feedback.is_same_as_applicant !==
                                        undefined && (
                                        <p>
                                          <span className="font-semibold">
                                            Same As Applicant :
                                          </span>{" "}
                                          {feedback.is_same_as_applicant
                                            ? "Yes"
                                            : "No"}
                                        </p>
                                      )}

                                      {feedback.academic_record_remark && (
                                        <p>
                                          <span className="font-semibold">
                                            Academic Record :
                                          </span>{" "}
                                          {feedback.academic_record_remark}
                                        </p>
                                      )}

                                      {feedback.experience_remark && (
                                        <p>
                                          <span className="font-semibold">
                                            Experience :
                                          </span>{" "}
                                          {feedback.experience_remark}
                                        </p>
                                      )}

                                      {feedback.knowledge_rating && (
                                        <p>
                                          <span className="font-semibold">
                                            Knowledge Rating :
                                          </span>{" "}
                                          {feedback.knowledge_rating}
                                        </p>
                                      )}

                                      {feedback.knowledge_detail && (
                                        <p>
                                          <span className="font-semibold">
                                            Knowledge Detail :
                                          </span>{" "}
                                          {feedback.knowledge_detail}
                                        </p>
                                      )}

                                      {feedback.communication_skills_rating && (
                                        <p>
                                          <span className="font-semibold">
                                            Communication Rating :
                                          </span>{" "}
                                          {feedback.communication_skills_rating}
                                        </p>
                                      )}

                                      {feedback.communication_skills_comment && (
                                        <p>
                                          <span className="font-semibold">
                                            Communication Comment :
                                          </span>{" "}
                                          {
                                            feedback.communication_skills_comment
                                          }
                                        </p>
                                      )}

                                      {feedback.attitude_rating && (
                                        <p>
                                          <span className="font-semibold">
                                            Attitude Rating :
                                          </span>{" "}
                                          {feedback.attitude_rating}
                                        </p>
                                      )}

                                      {feedback.attitude_comment && (
                                        <p>
                                          <span className="font-semibold">
                                            Attitude Comment :
                                          </span>{" "}
                                          {feedback.attitude_comment}
                                        </p>
                                      )}

                                      {feedback.overall_assessment_rating && (
                                        <p>
                                          <span className="font-semibold">
                                            Overall Assessment :
                                          </span>{" "}
                                          {feedback.overall_assessment_rating}
                                        </p>
                                      )}

                                      {feedback.overall_assessment_remark && (
                                        <p>
                                          <span className="font-semibold">
                                            Overall Remark :
                                          </span>{" "}
                                          {feedback.overall_assessment_remark}
                                        </p>
                                      )}

                                      {feedback.position_recommendation && (
                                        <p>
                                          <span className="font-semibold">
                                            Position Recommendation :
                                          </span>{" "}
                                          {feedback.position_recommendation}
                                        </p>
                                      )}

                                      {feedback.recommendation_comments && (
                                        <p>
                                          <span className="font-semibold">
                                            Recommendation Comment :
                                          </span>{" "}
                                          {feedback.recommendation_comments}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-xl border bg-gray-50 p-2">
              <div className="flex items-center justify-between">
                {/* Status */}
                <div>
                  <p className="text-xs text-[#000]">Application Status</p>
                  <span className="mt-1 inline-block rounded bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {capitalizeFLetter(state.application?.status || "Pending")}
                  </span>
                </div>

                {/* View Application Button */}
                <button
                  onClick={() => {
                    setState({ isOpenRound: false });
                    router.push(
                      `/faculty/application_detail?id=${state.application?.id}`,
                    );
                    // navigate or open application
                    // viewApplication(state.application?.id);
                  }}
                  className="flex items-center gap-2 rounded border border-blue-600 px-2 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  View Application
                </button>
              </div>
            </div>
            {/* Fixed Bottom Section */}
            <div className="sticky bottom-0 border-t bg-white p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <CustomSelect
                    options={state.applicationStatusesList}
                    value={state.appstatus}
                    onChange={(e) => setState({ appstatus: e })}
                    placeholder="Select final status"
                    isClearable={false}
                  />
                </div>

                <button
                  onClick={() => updateStatus()}
                  className="bg-dblue rounded px-5 py-2 text-white"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )}
      />

      <Modal
        open={state.showFilterModal}
        close={() => setState({ showFilterModal: false })}
        // title="Filters"
        maxWidth="!w-[800px]"
        renderComponent={() => (
          <div>
            <div className="flex items-center justify-between ">
              <h2 className="text-lg ">Filters</h2>
              <button
                onClick={() => setState({ showFilterModal: false })}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 py-3 md:grid-cols-3">
              {(state.profile?.role == ROLES.SUPER_ADMIN ||
                state.profile?.role == ROLES.INSTITUTION_ADMIN) && (
                <>
                  {state.profile?.role == ROLES.SUPER_ADMIN && (
                    <CustomSelect
                      options={state.institutionList}
                      value={state.institutionFilter}
                      onChange={handleInstitutionChange}
                      placeholder="Select institution"
                      isClearable={true}
                      onSearch={(searchTerm) =>
                        institutionDropdownList(1, searchTerm)
                      }
                      loadMore={() =>
                        state.institutionNext &&
                        institutionDropdownList(
                          state.institutionPage + 1,
                          "",
                          true,
                        )
                      }
                      loading={state.institutionLoading}
                    />
                  )}
                  <CustomSelect
                    options={state.collegeList}
                    value={state.collegeFilter}
                    onChange={handleCollegeChange}
                    placeholder="Select college"
                    isClearable={true}
                    onSearch={(searchTerm) => {
                      const institutionId =
                        state.profile?.role === ROLES.SUPER_ADMIN
                          ? state.institutionFilter?.value
                          : null;
                      collegeDropdownList(
                        1,
                        searchTerm,
                        false,
                        institutionId,
                        state.profile?.id,
                      );
                    }}
                    loadMore={() => {
                      const institutionId =
                        state.profile?.role === ROLES.SUPER_ADMIN
                          ? state.institutionFilter?.value
                          : state.profile?.institution?.id;
                      state.collegeNext &&
                        collegeDropdownList(
                          state.collegePage + 1,
                          "",
                          true,
                          institutionId,
                          state.profile?.id,
                        );
                    }}
                    loading={state.collegeLoading}
                  />

                  <CustomSelect
                    options={state.departmentList}
                    value={state.departmentFilter}
                    onChange={handleDepartmentChange}
                    placeholder="Select department"
                    isClearable={true}
                    onSearch={(searchTerm) => {
                      const collegeId = state.collegeFilter?.value;
                      collegeId &&
                        departmentDropdownList(
                          1,
                          searchTerm,
                          false,
                          collegeId,
                          state.profile?.id,
                        );
                    }}
                    loadMore={() => {
                      const collegeId = state.collegeFilter?.value;
                      state.departmentNext &&
                        collegeId &&
                        departmentDropdownList(
                          state.departmentPage + 1,
                          "",
                          true,
                          collegeId,
                          state.profile?.id,
                        );
                    }}
                    loading={state.departmentLoading}
                    disabled={!state.collegeFilter}
                  />
                </>
              )}
              <CustomSelect
                options={state.applicationStatusList}
                value={state.selectedStatus}
                onChange={(e) => setState({ selectedStatus: e })}
                placeholder="Select status"
                loading={state.applicationStatusLoading}
              />
            </div>
            <div className="flex items-center justify-between py-3 ">
              <button
                onClick={() => {
                  setState({
                    institutionFilter: null,
                    collegeFilter: null,
                    departmentFilter: null,
                    selectedStatus: null,
                  });
                }}
                className=" text-sm text-red-500 transition-all hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Clear All
              </button>
              <button
                onClick={() => setState({ showFilterModal: false })}
                className="bg-dblue  rounded-lg px-4 py-2  text-sm text-white shadow-md transition-all hover:shadow-lg"
              >
                Show {state.count} Application Results
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default PrivateRouter(Application);
