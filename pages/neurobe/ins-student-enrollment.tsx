import CourseBanner from "@/components/academic-setup/CourseBanner";
import PageHeader from "@/components/common-components/PageHeader";
import TableComponent from "@/components/common-components/TableComponent";
import IconPlus from "@/components/Icon/IconPlus";
import IconSearch from "@/components/Icon/IconSearch";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import TextInput from "@/components/FormFields/TextInput.component";
import { useSetState } from "@/utils/function.utils";
import { Users } from "lucide-react";
import PrivateRouter from "@/hook/privateRouter";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setPageTitle } from "@/store/themeConfigSlice";
import { EnrollStudentsModal, EnrollableStudent } from "@/components/academic-setup/AddModals";

const AVAILABLE_STUDENTS: EnrollableStudent[] = [
  { id: "24CS1041", regNo: "24CS1041", name: "Jaganathan R",  programme: "B.Tech CSE", batch: "2025-2029", email: "jaganathan.r@karpagam.ac.in" },
  { id: "24CS1042", regNo: "24CS1042", name: "Kavin Raj",     programme: "B.Tech CSE", batch: "2025-2029", email: "kavin.raj@karpagam.ac.in" },
  { id: "24CS1043", regNo: "24CS1043", name: "Nisha Kumar",   programme: "B.Tech CSE", batch: "2025-2029", email: "nisha.k@karpagam.ac.in" },
  { id: "24CS1044", regNo: "24CS1044", name: "Pradeep S",     programme: "B.Tech CSE", batch: "2025-2029", email: "pradeep.s@karpagam.ac.in" },
  { id: "24CS1045", regNo: "24CS1045", name: "Ranjitha M",    programme: "B.Tech CSE", batch: "2025-2029", email: "ranjitha.m@karpagam.ac.in" },
];

const MOCK_ENROLLED_STUDENTS = [
  { id: 1,  regNo: "24CS001", name: "Aaron Swaminathan",  email: "aaron.s@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 2,  regNo: "24CS002", name: "Abinaya Sundaram",   email: "abinaya.s@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 3,  regNo: "24CS003", name: "Aditya Narayanan",   email: "aditya.n@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 4,  regNo: "24CS004", name: "Ananya Ramesh",      email: "ananya.r@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 5,  regNo: "24CS005", name: "Bala Chandran",      email: "bala.c@karpagam.ac.in",      enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 6,  regNo: "24CS006", name: "Deepa Muthukumar",   email: "deepa.m@karpagam.ac.in",     enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 7,  regNo: "24CS007", name: "Dharun Karthik",     email: "dharun.k@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 8,  regNo: "24CS008", name: "Divya Bharathi",     email: "divya.b@karpagam.ac.in",     enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 9,  regNo: "24CS009", name: "Gokul Prasanth",     email: "gokul.p@karpagam.ac.in",     enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 10, regNo: "24CS010", name: "Harini Venkatesan",  email: "harini.v@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 11, regNo: "24CS011", name: "Ishwarya Mohan",     email: "ishwarya.m@karpagam.ac.in",  enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 12, regNo: "24CS012", name: "Jayakumar Selvam",   email: "jayakumar.s@karpagam.ac.in", enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 13, regNo: "24CS013", name: "Karthikeyan Raja",   email: "karthik.r@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 14, regNo: "24CS014", name: "Kavitha Suresh",     email: "kavitha.s@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 15, regNo: "24CS015", name: "Logesh Babu",        email: "logesh.b@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 16, regNo: "24CS016", name: "Madhumitha Raj",     email: "madhu.r@karpagam.ac.in",     enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 17, regNo: "24CS017", name: "Naveen Kumar",       email: "naveen.k@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 18, regNo: "24CS018", name: "Nithya Devi",        email: "nithya.d@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 19, regNo: "24CS019", name: "Oviya Krishnan",     email: "oviya.k@karpagam.ac.in",     enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 20, regNo: "24CS020", name: "Praveen Anand",      email: "praveen.a@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 21, regNo: "24CS021", name: "Priya Lakshmi",      email: "priya.l@karpagam.ac.in",     enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 22, regNo: "24CS022", name: "Rahul Shankar",      email: "rahul.s@karpagam.ac.in",     enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 23, regNo: "24CS023", name: "Ramya Priya",        email: "ramya.p@karpagam.ac.in",     enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 24, regNo: "24CS024", name: "Santhosh Kumar",     email: "santhosh.k@karpagam.ac.in",  enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 25, regNo: "24CS025", name: "Saranya Devi",       email: "saranya.d@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 26, regNo: "24CS026", name: "Senthil Nathan",     email: "senthil.n@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 27, regNo: "24CS027", name: "Shobana Ravi",       email: "shobana.r@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 28, regNo: "24CS028", name: "Sivakami Arjun",     email: "sivakami.a@karpagam.ac.in",  enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 29, regNo: "24CS029", name: "Suresh Babu",        email: "suresh.b@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 30, regNo: "24CS030", name: "Swetha Murugan",     email: "swetha.m@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 31, regNo: "24CS031", name: "Tamil Selvan",       email: "tamil.s@karpagam.ac.in",     enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 32, regNo: "24CS032", name: "Tharani Priya",      email: "tharani.p@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 33, regNo: "24CS033", name: "Udhaya Kumar",       email: "udhaya.k@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 34, regNo: "24CS034", name: "Uma Devi",           email: "uma.d@karpagam.ac.in",       enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 35, regNo: "24CS035", name: "Vaishnavi Raj",      email: "vaishnavi.r@karpagam.ac.in", enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 36, regNo: "24CS036", name: "Vasanth Kumar",      email: "vasanth.k@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 37, regNo: "24CS037", name: "Vijaya Lakshmi",     email: "vijaya.l@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 38, regNo: "24CS038", name: "Vinoth Raj",         email: "vinoth.r@karpagam.ac.in",    enrolledOn: "26 Aug 2026", section: "Section B", status: "Enrolled" },
  { id: 39, regNo: "24CS039", name: "Yazhini Murugan",    email: "yazhini.m@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
  { id: 40, regNo: "24CS040", name: "Yuvaraj Pandian",    email: "yuvaraj.p@karpagam.ac.in",   enrolledOn: "26 Aug 2026", section: "Section A", status: "Enrolled" },
];

const SECTION_OPTIONS = [
  { value: "all", label: "All Sections" },
  { value: "Section A", label: "Section A" },
  { value: "Section B", label: "Section B" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Enrolled", label: "Enrolled" },
  { value: "Not Enrolled", label: "Not Enrolled" },
];

const COLUMNS = [
  {
    accessor: "regNo",
    title: "REGISTER NUMBER",
    render: ({ regNo }: any) => (
      <span className="font-bold text-[#000] dark:text-white">{regNo}</span>
    ),
  },
  {
    accessor: "name",
    title: "STUDENT NAME",
    render: ({ name }: any) => (
      <span className="font-semibold text-[#000] dark:text-white">{name}</span>
    ),
  },
  {
    accessor: "email",
    title: "EMAIL",
    render: ({ email }: any) => (
      <span className="text-sm text-pri">{email}</span>
    ),
  },
  {
    accessor: "enrolledOn",
    title: "ENROLLED ON",
    render: ({ enrolledOn }: any) => (
      <span className="text-sm text-[#000] dark:text-white">{enrolledOn}</span>
    ),
  },
  {
    accessor: "status",
    title: "ENROLLMENT STATUS",
    render: ({ status }: any) => (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {status}
      </span>
    ),
  },
];

const StudentEnrollment = () => {
  const dispatch = useDispatch();

  const [state, setState] = useSetState({
    activeTab: "",
    search: "",
    sectionFilter: "all",
    statusFilter: "all",
    loading: false,
  });

  const [enrollModal, setEnrollModal] = useState(false);

  useEffect(() => {
    dispatch(setPageTitle("Student Enrollment"));
  }, [dispatch]);

  const filteredRecords = MOCK_ENROLLED_STUDENTS.filter((row) => {
    const s = state.search.toLowerCase();
    const matchSearch =
      !s ||
      row.regNo.toLowerCase().includes(s) ||
      row.name.toLowerCase().includes(s) ||
      row.email.toLowerCase().includes(s);
    const matchSection =
      state.sectionFilter === "all" || row.section === state.sectionFilter;
    const matchStatus =
      state.statusFilter === "all" || row.status === state.statusFilter;
    return matchSearch && matchSection && matchStatus;
  });

  return (
    <div className="min-h-screen">
      <CourseBanner
        courseCode="CS301"
        courseTitle="Computer Networks"
        description="Coordinator View — Academic course preparation, syllabus, outcomes mapping, lesson plans, question banking, and CIA paper generation."
        programme="B.Tech CSE"
        batch="2025–2029"
        academicYear="2026–2027 / Semester 3"
        students="40 Students"
        selectedCourse="CS309"
        courseOptions={[
          { value: "CS309", label: "Course: CS309" },
          { value: "CS301", label: "Course: CS301" },
        ]}
        onCourseChange={(val) => console.log("course", val)}
        activeView={state.activeTab}
        toogle="instructor"
        onBack={() => console.log("back")}
        onViewChange={(view) => setState({ activeTab: view })}
      />

      {/* Header */}
      <PageHeader
        title="Enrolled Students"
        subtitle="Students currently enrolled in this course."
        icon={<Users className="h-5 w-5 text-color2" />}
        records={`${MOCK_ENROLLED_STUDENTS.length} Students`}
        actionBtn1={{
          label: "Enroll Student",
          icon: <IconPlus className="h-4 w-4" />,
          onClick: () => setEnrollModal(true),
        }}
        program={[
          { title: "Programme", value: "B.Tech CSE" },
          { title: "Batch", value: "2025–2029" },
          { title: "Semester", value: "3" },
        ]}
      />

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
            options={SECTION_OPTIONS}
            value={SECTION_OPTIONS.find((o) => o.value === state.sectionFilter) ?? null}
            onChange={(e) => setState({ sectionFilter: e?.value ?? "all" })}
            placeholder="All Sections"
            className="filter-input"
            isClearable
          />
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
          noRecordsText="No students found"
          showPagination
          pageSize={10}
          paginationLabel="students"
        />
      </div>
      <EnrollStudentsModal
        open={enrollModal}
        onClose={() => setEnrollModal(false)}
        courseCode="CS309"
        courseTitle="Computer Networks"
        availableStudents={AVAILABLE_STUDENTS}
        onEnroll={(selected) => console.log("Enrolling:", selected)}
      />
    </div>
  );
};

export default PrivateRouter(StudentEnrollment);
