import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { ChevronDown, ChevronLeft, ChevronRight, Eye, Search } from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import PrivateRouter from "@/hook/privateRouter";

type AuditRecord = {
  user: string;
  email: string;
  initials: string;
  role: string;
  action: string;
  entity: string;
  category: string;
  date: string;
  time: string;
};

const PAGE_SIZE = 8;
const CATEGORY_OPTIONS = ["All Activity", "User & Access", "Course & Enrollment", "Academic Setup", "Assessment & Marks", "AI & Attainment", "Program Outcome"];
const USER_OPTIONS = ["All Users", "Meena Subramanian", "Arun Kumar", "Priya Selvam", "Kavin Raj", "Karthik Rajan"];
const ENTITY_OPTIONS = ["All Entities", "User", "Course Offering", "Syllabus", "Marks", "Enrollment", "Program Outcome", "Attainment"];
const DATE_OPTIONS = ["All Dates", "Aug 24, 2026", "Aug 23, 2026", "Aug 22, 2026"];

const AUDIT_RECORDS: AuditRecord[] = [
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Created user Kavin Raj",
    entity: "User",
    category: "User & Access",
    date: "Aug 24, 2026",
    time: "3:00 am",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Assigned Priya Selvam to CS301",
    entity: "Course Offering",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "2:15 am",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Approved syllabus extraction for CS301",
    entity: "Syllabus",
    category: "Academic Setup",
    date: "Aug 24, 2026",
    time: "1:45 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Corrected extracted mark for CIA-1",
    entity: "Marks",
    category: "Assessment & Marks",
    date: "Aug 24, 2026",
    time: "1:10 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Enrolled Kavin Raj in CS301",
    entity: "Enrollment",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "12:28 am",
  },
  {
    user: "Kavin Raj",
    email: "kavin.raj@student.neurobe.in",
    initials: "KR",
    role: "Student",
    action: "Login successful",
    entity: "User Account",
    category: "User & Access",
    date: "Aug 23, 2026",
    time: "11:45 pm",
  },
  {
    user: "Karthik Rajan",
    email: "karthik.rajan@neurobe.in",
    initials: "KR",
    role: "Super Admin",
    action: "Updated Program Outcome version",
    entity: "Program Outcome",
    category: "Program Outcome",
    date: "Aug 22, 2026",
    time: "10:15 pm",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Ran attainment calculation for CS301",
    entity: "Attainment",
    category: "AI & Attainment",
    date: "Aug 22, 2026",
    time: "3:45 pm",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Created user Kavin Raj",
    entity: "User",
    category: "User & Access",
    date: "Aug 24, 2026",
    time: "3:00 am",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Assigned Priya Selvam to CS301",
    entity: "Course Offering",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "2:15 am",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Approved syllabus extraction for CS301",
    entity: "Syllabus",
    category: "Academic Setup",
    date: "Aug 24, 2026",
    time: "1:45 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Corrected extracted mark for CIA-1",
    entity: "Marks",
    category: "Assessment & Marks",
    date: "Aug 24, 2026",
    time: "1:10 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Enrolled Kavin Raj in CS301",
    entity: "Enrollment",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "12:28 am",
  },
  {
    user: "Kavin Raj",
    email: "kavin.raj@student.neurobe.in",
    initials: "KR",
    role: "Student",
    action: "Login successful",
    entity: "User Account",
    category: "User & Access",
    date: "Aug 23, 2026",
    time: "11:45 pm",
  },
  {
    user: "Karthik Rajan",
    email: "karthik.rajan@neurobe.in",
    initials: "KR",
    role: "Super Admin",
    action: "Updated Program Outcome version",
    entity: "Program Outcome",
    category: "Program Outcome",
    date: "Aug 22, 2026",
    time: "10:15 pm",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Ran attainment calculation for CS301",
    entity: "Attainment",
    category: "AI & Attainment",
    date: "Aug 22, 2026",
    time: "3:45 pm",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Created user Kavin Raj",
    entity: "User",
    category: "User & Access",
    date: "Aug 24, 2026",
    time: "3:00 am",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Assigned Priya Selvam to CS301",
    entity: "Course Offering",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "2:15 am",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Approved syllabus extraction for CS301",
    entity: "Syllabus",
    category: "Academic Setup",
    date: "Aug 24, 2026",
    time: "1:45 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Corrected extracted mark for CIA-1",
    entity: "Marks",
    category: "Assessment & Marks",
    date: "Aug 24, 2026",
    time: "1:10 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Enrolled Kavin Raj in CS301",
    entity: "Enrollment",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "12:28 am",
  },
  {
    user: "Kavin Raj",
    email: "kavin.raj@student.neurobe.in",
    initials: "KR",
    role: "Student",
    action: "Login successful",
    entity: "User Account",
    category: "User & Access",
    date: "Aug 23, 2026",
    time: "11:45 pm",
  },
  {
    user: "Karthik Rajan",
    email: "karthik.rajan@neurobe.in",
    initials: "KR",
    role: "Super Admin",
    action: "Updated Program Outcome version",
    entity: "Program Outcome",
    category: "Program Outcome",
    date: "Aug 22, 2026",
    time: "10:15 pm",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Ran attainment calculation for CS301",
    entity: "Attainment",
    category: "AI & Attainment",
    date: "Aug 22, 2026",
    time: "3:45 pm",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Created user Kavin Raj",
    entity: "User",
    category: "User & Access",
    date: "Aug 24, 2026",
    time: "3:00 am",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Assigned Priya Selvam to CS301",
    entity: "Course Offering",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "2:15 am",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Approved syllabus extraction for CS301",
    entity: "Syllabus",
    category: "Academic Setup",
    date: "Aug 24, 2026",
    time: "1:45 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Corrected extracted mark for CIA-1",
    entity: "Marks",
    category: "Assessment & Marks",
    date: "Aug 24, 2026",
    time: "1:10 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Enrolled Kavin Raj in CS301",
    entity: "Enrollment",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "12:28 am",
  },
  {
    user: "Kavin Raj",
    email: "kavin.raj@student.neurobe.in",
    initials: "KR",
    role: "Student",
    action: "Login successful",
    entity: "User Account",
    category: "User & Access",
    date: "Aug 23, 2026",
    time: "11:45 pm",
  },
  {
    user: "Karthik Rajan",
    email: "karthik.rajan@neurobe.in",
    initials: "KR",
    role: "Super Admin",
    action: "Updated Program Outcome version",
    entity: "Program Outcome",
    category: "Program Outcome",
    date: "Aug 22, 2026",
    time: "10:15 pm",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Ran attainment calculation for CS301",
    entity: "Attainment",
    category: "AI & Attainment",
    date: "Aug 22, 2026",
    time: "3:45 pm",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Created user Kavin Raj",
    entity: "User",
    category: "User & Access",
    date: "Aug 24, 2026",
    time: "3:00 am",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Assigned Priya Selvam to CS301",
    entity: "Course Offering",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "2:15 am",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Approved syllabus extraction for CS301",
    entity: "Syllabus",
    category: "Academic Setup",
    date: "Aug 24, 2026",
    time: "1:45 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Corrected extracted mark for CIA-1",
    entity: "Marks",
    category: "Assessment & Marks",
    date: "Aug 24, 2026",
    time: "1:10 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Enrolled Kavin Raj in CS301",
    entity: "Enrollment",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "12:28 am",
  },
  {
    user: "Kavin Raj",
    email: "kavin.raj@student.neurobe.in",
    initials: "KR",
    role: "Student",
    action: "Login successful",
    entity: "User Account",
    category: "User & Access",
    date: "Aug 23, 2026",
    time: "11:45 pm",
  },
  {
    user: "Karthik Rajan",
    email: "karthik.rajan@neurobe.in",
    initials: "KR",
    role: "Super Admin",
    action: "Updated Program Outcome version",
    entity: "Program Outcome",
    category: "Program Outcome",
    date: "Aug 22, 2026",
    time: "10:15 pm",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Ran attainment calculation for CS301",
    entity: "Attainment",
    category: "AI & Attainment",
    date: "Aug 22, 2026",
    time: "3:45 pm",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Created user Kavin Raj",
    entity: "User",
    category: "User & Access",
    date: "Aug 24, 2026",
    time: "3:00 am",
  },
  {
    user: "Meena Subramanian",
    email: "meena.subramanian@neurobe.in",
    initials: "MS",
    role: "ERP Admin",
    action: "Assigned Priya Selvam to CS301",
    entity: "Course Offering",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "2:15 am",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Approved syllabus extraction for CS301",
    entity: "Syllabus",
    category: "Academic Setup",
    date: "Aug 24, 2026",
    time: "1:45 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Corrected extracted mark for CIA-1",
    entity: "Marks",
    category: "Assessment & Marks",
    date: "Aug 24, 2026",
    time: "1:10 am",
  },
  {
    user: "Priya Selvam",
    email: "priya.selvam@neurobe.in",
    initials: "PS",
    role: "Course Instructor",
    action: "Enrolled Kavin Raj in CS301",
    entity: "Enrollment",
    category: "Course & Enrollment",
    date: "Aug 24, 2026",
    time: "12:28 am",
  },
  {
    user: "Kavin Raj",
    email: "kavin.raj@student.neurobe.in",
    initials: "KR",
    role: "Student",
    action: "Login successful",
    entity: "User Account",
    category: "User & Access",
    date: "Aug 23, 2026",
    time: "11:45 pm",
  },
  {
    user: "Karthik Rajan",
    email: "karthik.rajan@neurobe.in",
    initials: "KR",
    role: "Super Admin",
    action: "Updated Program Outcome version",
    entity: "Program Outcome",
    category: "Program Outcome",
    date: "Aug 22, 2026",
    time: "10:15 pm",
  },
  {
    user: "Arun Kumar",
    email: "arun.kumar@neurobe.in",
    initials: "AK",
    role: "Course Coordinator",
    action: "Ran attainment calculation for CS301",
    entity: "Attainment",
    category: "AI & Attainment",
    date: "Aug 22, 2026",
    time: "3:45 pm",
  },
];

const categoryStyles: Record<string, string> = {
  "User & Access": "bg-[#e9f3ff] text-[#2a6fe5]",
  "Course & Enrollment": "bg-[#edf2ff] text-[#4a66d8]",
  "Academic Setup": "bg-[#ffe6eb] text-[#d44667]",
  "Assessment & Marks": "bg-[#e8f7f1] text-[#1a9b72]",
  "AI & Attainment": "bg-[#f2ebff] text-[#7c52d7]",
  "Program Outcome": "bg-[#ffe6eb] text-[#d44667]",
};

const AuditTrail = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Activity");
  const [user, setUser] = useState("All Users");
  const [entity, setEntity] = useState("All Entities");
  const [date, setDate] = useState("All Dates");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(setPageTitle("Audit Trail"));
  }, [dispatch]);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();

    return AUDIT_RECORDS.filter((record) => {
      const matchesSearch =
        !term ||
        record.user.toLowerCase().includes(term) ||
        record.email.toLowerCase().includes(term) ||
        record.action.toLowerCase().includes(term) ||
        record.entity.toLowerCase().includes(term) ||
        record.category.toLowerCase().includes(term);

      const matchesCategory = category === "All Activity" || record.category === category;
      const matchesUser = user === "All Users" || record.user === user;
      const matchesEntity = entity === "All Entities" || record.entity === entity;
      const matchesDate = date === "All Dates" || record.date === date;

      return matchesSearch && matchesCategory && matchesUser && matchesEntity && matchesDate;
    });
  }, [category, date, entity, search, user]);

  useEffect(() => {
    setPage(1);
  }, [category, date, entity, search, user]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRecords = filteredRecords.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const pageNumbers = [1, 2];

  return (
    <div className="min-h-screen bg-[#f3f4f7] px-3 pb-8 pt-4 text-[#111827]">
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-4 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b93a5]">
          <span>KARPAGAM INSTITUTIONS</span>
          <span className="px-1 text-[#c2c6d0]">&nbsp;›&nbsp;</span>
          <span>AUDIT TRIAL</span>
        </div>

        <h1 className="mb-5 text-[38px] font-bold leading-none text-[#111827]">Audit Trail</h1>

        <section className="mb-5 rounded-[15px] border border-[#e5e7eb] bg-white px-5 py-4 shadow-[0_0_0_1px_rgba(17,24,39,0.02)]">
          <h2 className="text-[26px] font-bold leading-tight text-[#111827]">Audit Trail</h2>
          <p className="mt-1 text-[15px] text-[#6b7280]">View the history of all administrative and academic changes made in the system.</p>
        </section>

        <div className="rounded-[15px] border border-[#e5e7eb] bg-white p-4 shadow-[0_0_0_1px_rgba(17,24,39,0.02)]">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by user, role, action, entity, or category..."
                className="w-full rounded-xl border border-[#e5e7eb] bg-[#f9fafb] py-2.5 pl-10 pr-3 text-sm text-[#111827] outline-none placeholder:text-[#9ca3af] focus:border-[#8b5cf6]"
              />
            </div>
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Category</label>
              <div className="relative">
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="w-full appearance-none rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 pr-9 text-sm text-[#111827] outline-none focus:border-[#8b5cf6]">
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">User</label>
              <div className="relative">
                <select value={user} onChange={(event) => setUser(event.target.value)} className="w-full appearance-none rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 pr-9 text-sm text-[#111827] outline-none focus:border-[#8b5cf6]">
                  {USER_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Entity</label>
              <div className="relative">
                <select value={entity} onChange={(event) => setEntity(event.target.value)} className="w-full appearance-none rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 pr-9 text-sm text-[#111827] outline-none focus:border-[#8b5cf6]">
                  {ENTITY_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Date</label>
              <div className="relative">
                <select value={date} onChange={(event) => setDate(event.target.value)} className="w-full appearance-none rounded-xl border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 pr-9 text-sm text-[#111827] outline-none focus:border-[#8b5cf6]">
                  {DATE_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7280]" />
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#f3f4f7] text-left text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    <th className="px-4 py-4">User</th>
                    <th className="px-4 py-4">Role</th>
                    <th className="px-4 py-4">Action</th>
                    <th className="px-4 py-4">Entity</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Date &amp; Time</th>
                    <th className="px-4 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRecords.map((record, index) => (
                    <tr key={`${record.user}-${record.action}-${index}`} className="border-t border-[#eef0f5] text-sm text-[#111827] hover:bg-[#fafbff]">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f1ebff] text-[11px] font-bold text-color2">
                            {record.initials}
                          </div>
                          <div>
                            <div className="font-semibold text-[#111827]">{record.user}</div>
                            <div className="text-xs text-[#6b7280]">{record.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-[#111827]">
                        <span className="inline-flex rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1 text-[11px] font-medium text-[#374151]">
                          {record.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-[#111827]">{record.action}</td>
                      <td className="px-4 py-4 text-[#111827]">
                        <span className="inline-flex rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1 text-[11px] font-medium text-[#374151]">
                          {record.entity}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${categoryStyles[record.category] ?? "bg-[#f3f4f6] text-[#374151]"}`}>
                          {record.category}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-[#374151]">
                        <div className="font-medium">{record.date}</div>
                        <div className="text-xs text-[#6b7280]">{record.time}</div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="inline-flex items-center gap-1.5 rounded-full bg-[#ebf8ef] px-2.5 py-1.5 text-[11px] font-medium text-[#08a05c]">
                          <Eye className="h-3.5 w-3.5" />
                          View Changes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 text-sm text-[#6b7280]">
            <span>
              Showing {filteredRecords.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRecords.length)} of {filteredRecords.length} activities
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={safePage === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${safePage === 1 ? "cursor-not-allowed border-[#e5e7eb] bg-[#f3f4f6] text-[#9ca3af]" : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"}`}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-semibold ${safePage === pageNumber ? "bg-[#7c3aed] text-white" : "bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]"}`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                disabled={safePage === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium ${safePage === totalPages ? "cursor-not-allowed border-[#e5e7eb] bg-[#f3f4f6] text-[#9ca3af]" : "border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]"}`}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateRouter(AuditTrail);
