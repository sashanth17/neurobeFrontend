import { useEffect, useMemo } from "react";
import { useDispatch } from "react-redux";
import { ClipboardList } from "lucide-react";
import { setPageTitle } from "@/store/themeConfigSlice";
import { useSetState } from "@/utils/function.utils";
import IconSearch from "@/components/Icon/IconSearch";
import {
  MOCK_AUDIT,
  AUDIT_COLUMNS,
} from "@/components/audit-trail/auditColumns";
import PrivateRouter from "@/hook/privateRouter";
import TableComponent from "@/components/common-components/TableComponent";
import CustomSelect from "@/components/FormFields/CustomSelect.component";
import PageHeader from "@/components/common-components/PageHeader";
import TextInput from "@/components/FormFields/TextInput.component";

const PAGE_SIZE = 8;

const CATEGORY_OPTS = [
  { value: "all_activity", label: "All Activity" },
  { value: "user_access", label: "User & Access" },
  { value: "course_enrollment", label: "Course & Enrollment" },
  { value: "academic_setup", label: "Academic Setup" },
  { value: "assessment_marks", label: "Assessment & Marks" },
  { value: "ai_attainment", label: "AI & Attainment" },
];

const USER_OPTS = [
  { value: "all_users", label: "All Users" },
  { value: "meena_subramanian", label: "Meena Subramanian" },
  { value: "arun_kumar", label: "Arun Kumar" },
  { value: "priya_selvan", label: "Priya Selvan" },
  { value: "kevin_raj", label: "Kevin Raj" },
  { value: "karthik_raja", label: "Karthik Raja" },
];

const ENTITY_OPTS = [
  { value: "all_entities", label: "All Entities" },
  { value: "user", label: "User" },
  { value: "course_offering", label: "Course Offering" },
  { value: "syllabus", label: "Syllabus" },
  { value: "marks", label: "Marks" },
  { value: "enrollment", label: "Enrollment" },
  { value: "attainment", label: "Attainment" },
  { value: "programme", label: "Programme" },
  { value: "batch", label: "Batch" },
  { value: "report", label: "Report" },
];

const DATE_OPTS = [
  { value: "all_dates", label: "All Dates" },
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
];

const AuditTrial = () => {
  const dispatch = useDispatch();

  const [state, setState] = useSetState({
    search: "",
    categoryFilter: null as any,
    userFilter: null as any,
    entityFilter: null as any,
    dateFilter: null as any,
    loading: false,
  });

  useEffect(() => {
    dispatch(setPageTitle("Audit Trail"));
  }, []);

  const setFilter = (key: string, val: any) => setState({ [key]: val });

  // ── filter ─────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const s = state.search.toLowerCase();
    return MOCK_AUDIT.filter((r) => {
      const matchSearch =
        !s ||
        r.name.toLowerCase().includes(s) ||
        r.action.toLowerCase().includes(s) ||
        r.entity.toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s);
      const matchCategory =
        !state.categoryFilter ||
        state.categoryFilter.value === "all_activity" ||
        r.category === state.categoryFilter.label;
      const matchUser =
        !state.userFilter ||
        state.userFilter.value === "all_users" ||
        r.name === state.userFilter.label;
      const matchEntity =
        !state.entityFilter ||
        state.entityFilter.value === "all_entities" ||
        r.entity === state.entityFilter.label;
      return matchSearch && matchCategory && matchUser && matchEntity;
    });
  }, [
    state.search,
    state.categoryFilter,
    state.userFilter,
    state.entityFilter,
  ]);

  // ── pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (state.page - 1) * PAGE_SIZE,
    state.page * PAGE_SIZE,
  );
  const goTo = (p: number) => {
    if (p >= 1 && p <= totalPages) setState({ page: p });
  };

  return (
    <div className="min-h-screen">
      {/* ── Header — same structure as user-list ────────────────────────────── */}

      <PageHeader
        title="Audit Trail"
        subtitle={`Institution: <span class="font-bold text-[#000]">Karpagam Institutions, Coimbatore</span>
            &nbsp;·&nbsp; Admin: <span class="font-bold text-[#000]">Meena Subramanian</span>`}
        icon={<ClipboardList className="h-5 w-5 text-color2" />}
        records={`${MOCK_AUDIT.length} Records`}
      />

      {/* ── Search + Filters — same panel structure as user-list ─────────────── */}
      <div className=" mb-6 flex flex-wrap items-center gap-3 border-b border-gray-100 dark:border-gray-700">
        {/* Search */}
        <div className="relative  min-w-[220px]  flex-1">
           <TextInput
            placeholder="Search by user, role, action, entity or category..."
              type="text"
              value={state.search}
              onChange={(e) => setState({ search: e.target.value })}
              icon={<IconSearch className="h-4 w-4" />}
            />
          
        </div>

        {/* Filter dropdowns — all CustomSelect with filter-input class */}
        <div className="flex gap-3">
          <CustomSelect
            options={CATEGORY_OPTS}
            value={state.categoryFilter}
            onChange={(v) => setFilter("categoryFilter", v)}
            placeholder="All Activity"
            className="filter-input"
            isClearable
          />
          <CustomSelect
            options={USER_OPTS}
            value={state.userFilter}
            onChange={(v) => setFilter("userFilter", v)}
            placeholder="All Users"
            className="filter-input"
            isClearable
          />
          <CustomSelect
            options={ENTITY_OPTS}
            value={state.entityFilter}
            onChange={(v) => setFilter("entityFilter", v)}
            placeholder="All Entities"
            className="filter-input"
            isClearable
          />
          <CustomSelect
            options={DATE_OPTS}
            value={state.dateFilter}
            onChange={(v) => setFilter("dateFilter", v)}
            placeholder="All Dates"
            className="filter-input"
            isClearable
          />
        </div>
      </div>

      {/* ── Directory label — same as user-list ─────────────────────────────── */}
      {/* <div className="mb-2 flex items-center gap-2 px-1">
        <p className="text-sm font-semibold text-[#000] dark:text-white">
          Audit Trail
        </p>
        <span className="text-xs text-[#000]">
          Shown {filtered.length} of {MOCK_AUDIT.length}
        </span>
      </div> */}

      {/* ── Table — pagination handled inside TableComponent ────────────────── */}
      <div className="panel">
        <TableComponent
          records={filtered}
          columns={AUDIT_COLUMNS}
          loading={state.loading}
          noRecordsText="No audit entries found"
          showPagination
          pageSize={8}
          paginationLabel="activities"
        />
      </div>

      {/* ── Footer count ────────────────────────────────────────────────────── */}
      <div className="mt-3 px-1">
        <p className="text-xs text-[#000]">
          Shown {filtered.length} of {MOCK_AUDIT.length} activities
        </p>
      </div>
    </div>
  );
};

export default PrivateRouter(AuditTrial);
