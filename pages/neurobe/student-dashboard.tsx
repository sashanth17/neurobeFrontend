import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import PrivateRouter from '@/hook/privateRouter';
import Models from '@/imports/models.import';

// Icons
import IconCalendar from '@/components/Icon/IconCalendar';
import IconClock from '@/components/Icon/IconClock';
import IconBook from '@/components/Icon/IconBook';
import IconClipboardText from '@/components/Icon/IconClipboardText';
import IconSearch from '@/components/Icon/IconSearch';
import IconCircleCheck from '@/components/Icon/IconCircleCheck';
import IconAward from '@/components/Icon/IconAward';
import IconBolt from '@/components/Icon/IconBolt';
import IconEye from '@/components/Icon/IconEye';
import IconInfoCircle from '@/components/Icon/IconInfoCircle';
import IconX from '@/components/Icon/IconX';

interface StudentInfo {
  id: string;
  enrollment_number: string;
  register_number: string;
  user_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  department_id?: number;
  department_name?: string;
  programme_id?: number;
  programme_name?: string;
  batch_id?: number;
  batch_name?: string;
  semester?: number;
}

interface EnrolledCourse {
  course_id: number;
  course_instance_id?: number;
  course_code: string;
  course_name: string;
  instance_name?: string;
  semester?: number;
  credits?: number;
  enrollment_status?: string;
  enrolled_on?: string;
}

interface ScheduledTest {
  id: string;
  raw_id: string;
  source: string;
  title: string;
  test_code: string;
  test_type: string;
  description: string;
  course_id: number;
  course_code: string;
  course_name: string;
  course_instance_id?: number;
  course_instance_name?: string;
  test_date?: string;
  start_time?: string;
  end_time?: string;
  test_window_start?: string;
  test_window_end?: string;
  duration_minutes: number;
  total_marks: number;
  status: 'Upcoming' | 'Live' | 'Completed' | 'Draft' | 'Cancelled';
  raw_status?: string;
  have_viva?: boolean;
  question_count?: number;
  topics?: string[];
  can_start?: boolean;
  secure_code?: string;
}

const StudentDashboard = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [scheduledTests, setScheduledTests] = useState<ScheduledTest[]>([]);
  const [stats, setStats] = useState({
    total_tests: 0,
    upcoming_tests: 0,
    live_tests: 0,
    completed_tests: 0,
    enrolled_courses_count: 0,
  });

  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  useEffect(() => {
    const ticker = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(ticker);
  }, []);

  const [activeTab, setActiveTab] = useState<'tests' | 'courses'>('tests');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');

  // Modal State
  const [selectedTest, setSelectedTest] = useState<ScheduledTest | null>(null);
  const [completionReport, setCompletionReport] = useState<{
    title: string;
    answered: string;
    total: string;
    time: string;
    switches: string;
  } | null>(null);

  useEffect(() => {
    dispatch(setPageTitle('Student Dashboard | Scheduled Tests'));
  }, [dispatch]);

  // Handle redirect from completed assessment without viva
  useEffect(() => {
    if (router.query.submitted === 'true') {
      setCompletionReport({
        title: (router.query.title as string) || 'Assessment',
        answered: (router.query.answered as string) || '0',
        total: (router.query.total as string) || '0',
        time: (router.query.time as string) || 'N/A',
        switches: (router.query.switches as string) || '0',
      });
      router.replace('/neurobe/student-dashboard', undefined, { shallow: true });
      fetchDashboardData();
    }
  }, [router.query.submitted]);

  // Sync tab with URL query parameter
  useEffect(() => {
    if (router.query.tab === 'courses') {
      setActiveTab('courses');
    } else if (router.query.tab === 'tests') {
      setActiveTab('tests');
    }
  }, [router.query.tab]);

  const fetchDashboardData = async (silent: boolean = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await Models.student.getDashboard();
      if (res && res.status === 'success') {
        setStudent(res.student);
        setEnrolledCourses(res.enrolled_courses || []);
        setScheduledTests(res.scheduled_tests || []);
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const pollTimer = setInterval(() => fetchDashboardData(true), 30000);
    return () => clearInterval(pollTimer);
  }, []);

  // Dynamically resolve test status: whenever current time is within test window, mark as Live!
  const resolvedTests = useMemo<ScheduledTest[]>(() => {
    return scheduledTests.map((test) => {
      const rawSt = (test.raw_status || test.status || '').toLowerCase();
      if (rawSt === 'cancelled' || rawSt === 'canceled' || test.status === 'Cancelled') {
        return { ...test, status: 'Cancelled' as const, can_start: false };
      }
      if (rawSt === 'completed' || rawSt === 'finished' || test.status === 'Completed') {
        return { ...test, status: 'Completed' as const, can_start: false };
      }
      if (test.test_window_start && test.test_window_end) {
        const ws = new Date(test.test_window_start).getTime();
        const we = new Date(test.test_window_end).getTime();
        if (currentTime >= ws && currentTime <= we) {
          return { ...test, status: 'Live' as const, can_start: true };
        }
        if (currentTime > we) {
          return { ...test, status: 'Completed' as const, can_start: false };
        }
        if (currentTime < ws) {
          return { ...test, status: 'Upcoming' as const };
        }
      }
      return test;
    });
  }, [scheduledTests, currentTime]);

  const dynamicStats = useMemo(() => {
    const total = resolvedTests.length;
    const live = resolvedTests.filter((t) => t.status === 'Live').length;
    const completed = resolvedTests.filter((t) => t.status === 'Completed').length;
    const upcoming = resolvedTests.filter((t) => t.status === 'Upcoming').length;
    return {
      total_tests: total,
      live_tests: live,
      upcoming_tests: upcoming,
      completed_tests: completed,
      enrolled_courses_count: enrolledCourses.length,
    };
  }, [resolvedTests, enrolledCourses.length]);

  // Filtered Tests based on resolved statuses
  const filteredTests = useMemo(() => {
    return resolvedTests.filter((test) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL') {
        if (test.status.toUpperCase() !== statusFilter) return false;
      }

      // 2. Course Filter
      if (selectedCourseFilter !== 'ALL') {
        if (String(test.course_id) !== selectedCourseFilter) return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = test.title.toLowerCase().includes(q);
        const matchesCode = (test.test_code || '').toLowerCase().includes(q);
        const matchesCourse = (test.course_name || '').toLowerCase().includes(q) || (test.course_code || '').toLowerCase().includes(q);
        const matchesType = (test.test_type || '').toLowerCase().includes(q);
        const matchesTopic = (test.topics || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCode && !matchesCourse && !matchesType && !matchesTopic) {
          return false;
        }
      }

      return true;
    });
  }, [resolvedTests, statusFilter, selectedCourseFilter, searchQuery]);

  const handleStartTest = (test: ScheduledTest) => {
    if (test.source === 'online_mcq') {
      const codeQuery = test.secure_code ? `&code=${encodeURIComponent(test.secure_code)}` : '';
      const emailQuery = student?.email ? `&email=${encodeURIComponent(student.email)}` : '';
      router.push(`/neurobe/student-mcq-test?test_id=${test.raw_id}${codeQuery}&student_id=${student?.id || ''}${emailQuery}`);
    } else {
      alert(`Test "${test.title}" is currently live. Please follow the instructions from your course instructor.`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Unified Hero Banner & Profile Card ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 bg-color1 to-slate-900 p-8 text-white shadow-2xl border border-white/10">
        {/* Background decorations */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 right-40 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-3xl font-bold shadow-inner backdrop-blur-md border border-white/20">
              {student?.first_name ? student.first_name.charAt(0).toUpperCase() : 'S'}
            </div>

            {/* User Info & Page Description */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  Student Academic Dashboard
                </span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Welcome back, {student?.full_name || student?.first_name || 'Student'}
              </h1>
              <p className="text-sm text-indigo-200 max-w-xl">
                View your scheduled continuous internal assessments, online MCQ exams, and actively enrolled courses.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-md border border-white/10">
                  <span className="text-indigo-300 text-xs uppercase tracking-wider font-semibold">Reg No:</span>
                  <span className="font-mono font-bold text-white">{student?.register_number || student?.id || '—'}</span>
                </span>
                {student?.department_name && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 backdrop-blur-md border border-white/10 text-white font-medium">
                    {student.department_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side stats/tags inside banner */}
          <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-300 border border-emerald-500/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Enrolled & Active
            </span>
            <div className="flex gap-2">
              {student?.batch_name && (
                <div className="rounded-xl bg-black/20 px-4 py-2 backdrop-blur-md border border-white/5 text-right">
                  <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Batch</span>
                  <span className="text-sm font-bold text-white">{student.batch_name}</span>
                </div>
              )}
              <div className="rounded-xl bg-black/20 px-4 py-2 backdrop-blur-md border border-white/5 text-right">
                <span className="block text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Semester</span>
                <span className="text-sm font-bold text-white">Sem {student?.semester || 1}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Metric Statistic Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Scheduled Tests */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Total Tests Scheduled
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 transition-transform group-hover:scale-110">
              <IconCalendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {dynamicStats.total_tests}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Exams</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">Continuous & online assessments</div>
        </div>

        {/* Upcoming Tests */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Upcoming Exams
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 transition-transform group-hover:scale-110">
              <IconClock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {dynamicStats.upcoming_tests}
            </span>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Scheduled</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">Prepare before start time</div>
        </div>

        {/* Live / Active Tests */}
        <div className="group relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 dark:border-emerald-900/40 dark:bg-emerald-900/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Live Assessments
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300 transition-transform group-hover:scale-110">
              <IconBolt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100">
              {dynamicStats.live_tests}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Ready to take
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
            {dynamicStats.live_tests > 0 ? 'Active window open now' : 'No tests currently in session'}
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Enrolled Courses
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 transition-transform group-hover:scale-110">
              <IconBook className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
              {dynamicStats.enrolled_courses_count}
            </span>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Courses</span>
          </div>
          <div className="mt-2 text-xs text-gray-400">Current academic term</div>
        </div>
      </div>

      {/* ── Main Tab Navigation ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-2 border-b-2 pb-3 pt-2 text-sm font-semibold transition-colors ${activeTab === 'tests'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
          >
            <IconClipboardText className="h-4 w-4" />
            Scheduled Tests
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === 'tests' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
              {resolvedTests.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 border-b-2 pb-3 pt-2 text-sm font-semibold transition-colors ${activeTab === 'courses'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
          >
            <IconBook className="h-4 w-4" />
            My Enrolled Courses
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === 'courses' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
              {enrolledCourses.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Tab Content: Scheduled Tests ──────────────────────────────────── */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          {/* Filter & Search Toolbar */}
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 lg:flex-row lg:items-center lg:justify-between">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { key: 'ALL', label: 'All Tests' },
                  { key: 'LIVE', label: 'Live Now' },
                  { key: 'UPCOMING', label: 'Upcoming' },
                  { key: 'COMPLETED', label: 'Completed' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${statusFilter === tab.key
                    ? 'bg-blue-600 text-white shadow-md dark:bg-blue-500'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                >
                  {tab.label}
                  {tab.key === 'LIVE' && dynamicStats.live_tests > 0 && (
                    <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Course Dropdown & Search Input */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {enrolledCourses.length > 0 && (
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="ALL">All Courses</option>
                  {enrolledCourses.map((c) => (
                    <option key={c.course_id} value={String(c.course_id)}>
                      {c.course_code} - {c.course_name}
                    </option>
                  ))}
                </select>
              )}

              <div className="relative min-w-[260px]">
                <input
                  type="text"
                  placeholder="Search tests, topics, courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white py-2 pl-10 pr-4 text-xs text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
                <IconSearch className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Tests List */}
          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-60 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/50"
                ></div>
              ))}
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <IconClipboardText className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                No Tests Scheduled At This Time
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                {searchQuery || statusFilter !== 'ALL' || selectedCourseFilter !== 'ALL'
                  ? 'No scheduled examinations match your current filters. Try resetting search filters.'
                  : 'Your course instructors will schedule examinations and online assessments here. Check back periodically for updates.'}
              </p>
              {(searchQuery || statusFilter !== 'ALL' || selectedCourseFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setStatusFilter('ALL');
                    setSelectedCourseFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTests.map((test) => {
                const isLive = test.status === 'Live';
                const isCompleted = test.status === 'Completed' || (test.raw_status || '').toLowerCase() === 'completed';
                const isCancelled = test.status === 'Cancelled' || (test.raw_status || '').toLowerCase() === 'cancelled' || (test.raw_status || '').toLowerCase() === 'canceled';

                return (
                  <div
                    key={test.id}
                    className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:bg-gray-900 ${isLive
                      ? 'border-emerald-300 ring-2 ring-emerald-500/20 dark:border-emerald-700'
                      : 'border-gray-200 dark:border-gray-800'
                      }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-extrabold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                          {test.course_code || 'COURSE'}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                            {test.test_type}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${isLive
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                              : isCompleted
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                              }`}
                          >
                            {isLive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                            )}
                            {test.status}
                          </span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors dark:text-white dark:group-hover:text-blue-400 line-clamp-2">
                        {test.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-1 dark:text-gray-400">
                        {test.course_name}
                      </p>

                      {/* Meta Grid */}
                      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 p-4 text-xs dark:bg-gray-800/60">
                        <div>
                          <span className="block text-[10px] uppercase font-semibold text-gray-400 mb-0.5">Date</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {test.test_date || 'TBA'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-semibold text-gray-400 mb-0.5">Time</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {test.start_time || 'Scheduled Slot'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-semibold text-gray-400 mb-0.5">Duration</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {test.duration_minutes} Mins
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-semibold text-gray-400 mb-0.5">Total Marks</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {test.total_marks} Marks
                          </span>
                        </div>
                      </div>

                      {test.have_viva && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                          <IconAward className="h-4 w-4" />
                          <span>Includes AI Viva Voce Assessment</span>
                        </div>
                      )}

                      {test.secure_code && (
                        <div className="mt-3 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 border border-indigo-100 text-xs dark:bg-indigo-900/30 dark:border-indigo-800/50">
                          <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">Passcode:</span>
                          <span className="font-mono font-bold tracking-widest text-indigo-900 dark:text-indigo-100 bg-white dark:bg-indigo-950 px-2 py-0.5 rounded">{test.secure_code}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                      <button
                        onClick={() => setSelectedTest(test)}
                        className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        Details
                      </button>

                      {isCancelled ? (
                        <div className="flex-1 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 py-2.5 text-center text-xs font-bold text-rose-600 dark:text-rose-400 select-none">
                          Cancelled
                        </div>
                      ) : isCompleted ? (
                        <div className="flex-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 select-none">
                          Completed
                        </div>
                      ) : isLive ? (
                        <button
                          onClick={() => handleStartTest(test)}
                          className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow active:scale-[0.98]"
                        >
                          Start Test Now
                        </button>
                      ) : test.source === 'online_mcq' ? (
                        <button
                          onClick={() => handleStartTest(test)}
                          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow active:scale-[0.98]"
                        >
                          Join Screen →
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedTest(test)}
                          className="flex-1 rounded-xl bg-blue-50 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                        >
                          Upcoming
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Content: Enrolled Courses ─────────────────────────────────── */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          {enrolledCourses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-16 text-center dark:border-gray-800 dark:bg-gray-900">
              <IconBook className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-base font-bold text-gray-900 dark:text-white">
                No Enrolled Courses Found
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                You have not been assigned to any course instances yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((c) => (
                <div
                  key={c.course_id}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {c.course_code}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                      {c.enrollment_status || 'Active'}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {c.course_name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                    Instance: {c.instance_name || 'Standard Curriculum'}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    <span className="font-medium text-gray-600 dark:text-gray-300">Semester {c.semester || 1}</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-lg">
                      {c.credits || 3} Credits
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Test Details Modal ────────────────────────────────────────────── */}
      {selectedTest && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-gray-200 dark:border-gray-800 transform transition-all">
            <button
              onClick={() => setSelectedTest(null)}
              className="absolute right-5 top-5 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <IconX className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <IconClipboardText className="h-6 w-6" />
              </div>
              <div className="pt-1 pr-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  {selectedTest.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {selectedTest.course_code} - {selectedTest.course_name}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-gray-50 p-5 dark:bg-gray-800/50">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                  Examination Details
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Type</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedTest.test_type}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Status</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedTest.status}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Date</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedTest.test_date || 'TBA'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Time</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedTest.start_time || 'TBA'}</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Duration</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedTest.duration_minutes} Mins</span>
                  </div>
                  <div>
                    <span className="block text-gray-500 dark:text-gray-400">Total Marks</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{selectedTest.total_marks} Marks</span>
                  </div>
                </div>
              </div>

              {selectedTest.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Instructions</h4>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 bg-white border border-gray-100 rounded-xl p-3 dark:bg-gray-900 dark:border-gray-800">
                    {selectedTest.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={() => setSelectedTest(null)}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              {selectedTest.status === 'Live' && (
                <button
                  onClick={() => handleStartTest(selectedTest)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-emerald-700 transition-colors"
                >
                  Start Exam Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Completion Report Modal (When returned from test without viva) */}
      {completionReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 border border-emerald-100 dark:border-emerald-950/40">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 mb-4 shadow-sm">
                <IconCircleCheck className="h-10 w-10" />
              </div>
              <span className="text-xs font-bold tracking-wider text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/40">
                Assessment Submitted
              </span>
              <h3 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
                {completionReport.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your responses have been successfully submitted and your test is marked as completed.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="rounded-lg bg-white p-3 shadow-xs dark:bg-gray-900">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Answered Questions</span>
                  <span className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {completionReport.answered} / {completionReport.total}
                  </span>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-xs dark:bg-gray-900">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Time Taken</span>
                  <span className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
                    {completionReport.time}
                  </span>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-xs dark:bg-gray-900">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Tab Switches</span>
                  <span className={`mt-1 text-lg font-bold ${Number(completionReport.switches) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                    {completionReport.switches}
                  </span>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-xs dark:bg-gray-900">
                  <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">Status</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Completed
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setCompletionReport(null)}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default PrivateRouter(StudentDashboard);
