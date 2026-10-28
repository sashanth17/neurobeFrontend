import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import PrivateRouter from '@/hook/privateRouter';
import Models from '@/imports/models.import';

// Icons
import {
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  Award,
  Zap,
  Eye,
  X,
  Search,
  RefreshCw,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
  Filter,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

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
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

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
    correct: string;
    time: string;
    switches: string;
  } | null>(null);

  useEffect(() => {
    dispatch(setPageTitle('Student Academic Dashboard'));
  }, [dispatch]);

  // Handle redirect from completed assessment without viva
  useEffect(() => {
    if (router.query.submitted === 'true') {
      setCompletionReport({
        title: (router.query.title as string) || 'Assessment',
        answered: (router.query.answered as string) || '0',
        total: (router.query.total as string) || '0',
        correct: (router.query.correct as string) || '0',
        time: (router.query.time as string) || 'N/A',
        switches: (router.query.switches as string) || '0',
      });
      router.replace('/neurobe/student-dashboard', undefined, { shallow: true });
      fetchDashboardData(true);
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
        setLastRefreshed(new Date());
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
    return scheduledTests
      .filter((test) => {
        const rawSt = (test.raw_status || test.status || '').toLowerCase();
        return rawSt !== 'draft' && rawSt !== 'setup_required';
      })
      .map((test) => {
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
        const matchesTitle = (test.title || '').toLowerCase().includes(q);
        const matchesCode = (test.test_code || '').toLowerCase().includes(q);
        const matchesCourse =
          (test.course_name || '').toLowerCase().includes(q) ||
          (test.course_code || '').toLowerCase().includes(q);
        const matchesType = (test.test_type || '').toLowerCase().includes(q);
        const matchesTopic = (test.topics || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCode && !matchesCourse && !matchesType && !matchesTopic) {
          return false;
        }
      }

      return true;
    });
  }, [resolvedTests, statusFilter, selectedCourseFilter, searchQuery]);

  // Filtered Courses for Courses Tab
  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return enrolledCourses;
    const q = searchQuery.toLowerCase().trim();
    return enrolledCourses.filter((c) => {
      return (
        (c.course_name || '').toLowerCase().includes(q) ||
        (c.course_code || '').toLowerCase().includes(q) ||
        (c.instance_name || '').toLowerCase().includes(q)
      );
    });
  }, [enrolledCourses, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'ALL' || selectedCourseFilter !== 'ALL';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setSelectedCourseFilter('ALL');
  };

  const handleStartTest = (test: ScheduledTest) => {
    if (test.source === 'online_mcq') {
      const codeQuery = test.secure_code ? `&code=${encodeURIComponent(test.secure_code)}` : '';
      const emailQuery = student?.email ? `&email=${encodeURIComponent(student.email)}` : '';
      router.push(
        `/neurobe/student-mcq-test?test_id=${test.raw_id}${codeQuery}&student_id=${student?.id || ''}${emailQuery}`
      );
    } else {
      alert(`Test "${test.title}" is currently live. Please follow the instructions from your course instructor.`);
    }
  };

  const handleViewReport = (test: ScheduledTest) => {
    router.push(
      `/neurobe/student-report?test_id=${test.raw_id}&student_id=${student?.id || ''}&source=${test.source || 'online_mcq'}`
    );
  };

  return (
    <div className="min-h-screen space-y-3 pb-8">
      {/* ── Header Row: Space-optimized Single-line Identity Bar ────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-200/60 pb-2.5 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-xs">
              <GraduationCap className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  {student?.full_name || student?.first_name || 'Student Dashboard'}
                </h1>
                {dynamicStats.live_tests > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    {dynamicStats.live_tests} Live Assessment{dynamicStats.live_tests > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Student Metadata Badges */}
          <div className="hidden items-center gap-1.5 text-xs sm:flex">
            {student?.register_number && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span className="text-slate-400 dark:text-slate-500">Reg:</span>
                {student.register_number}
              </span>
            )}
            {student?.department_name && (
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {student.department_name}
              </span>
            )}
            {student?.semester && (
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                Sem {student.semester}
              </span>
            )}
            {student?.batch_name && (
              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 font-medium text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                {student.batch_name}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="hidden text-xs text-slate-400 dark:text-slate-500 md:inline">
              Sync: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── Metric Strip: 4 Interactive KPI Cards ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:gap-3">
        {/* Live Assessments */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('tests');
            setStatusFilter('LIVE');
          }}
          className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition hover:shadow-xs active:scale-[0.99] ${
            activeTab === 'tests' && statusFilter === 'LIVE'
              ? 'border-emerald-500/80 bg-emerald-50/70 ring-1 ring-emerald-500/40 dark:border-emerald-700/80 dark:bg-emerald-950/30'
              : 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span className="relative flex h-1.5 w-1.5">
                {dynamicStats.live_tests > 0 && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              </span>
              <span>Live Now</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                {dynamicStats.live_tests}
              </span>
              <span className="text-[10px] font-medium text-slate-400">active</span>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <Zap className="h-4 w-4" />
          </div>
        </button>

        {/* Upcoming Exams */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('tests');
            setStatusFilter('UPCOMING');
          }}
          className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition hover:shadow-xs active:scale-[0.99] ${
            activeTab === 'tests' && statusFilter === 'UPCOMING'
              ? 'border-indigo-500/80 bg-indigo-50/70 ring-1 ring-indigo-500/40 dark:border-indigo-700/80 dark:bg-indigo-950/30'
              : 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Upcoming
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                {dynamicStats.upcoming_tests}
              </span>
              <span className="text-[10px] font-medium text-slate-400">scheduled</span>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100/70 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
            <Calendar className="h-4 w-4" />
          </div>
        </button>

        {/* Completed Tests */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('tests');
            setStatusFilter('COMPLETED');
          }}
          className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition hover:shadow-xs active:scale-[0.99] ${
            activeTab === 'tests' && statusFilter === 'COMPLETED'
              ? 'border-purple-500/80 bg-purple-50/70 ring-1 ring-purple-500/40 dark:border-purple-700/80 dark:bg-purple-950/30'
              : 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Completed
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                {dynamicStats.completed_tests}
              </span>
              <span className="text-[10px] font-medium text-slate-400">finished</span>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100/70 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </button>

        {/* Enrolled Courses */}
        <button
          type="button"
          onClick={() => {
            setActiveTab('courses');
            setStatusFilter('ALL');
          }}
          className={`flex items-center justify-between rounded-xl border p-2.5 text-left transition hover:shadow-xs active:scale-[0.99] ${
            activeTab === 'courses'
              ? 'border-sky-500/80 bg-sky-50/70 ring-1 ring-sky-500/40 dark:border-sky-700/80 dark:bg-sky-950/30'
              : 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              My Courses
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                {dynamicStats.enrolled_courses_count}
              </span>
              <span className="text-[10px] font-medium text-slate-400">enrolled</span>
            </div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100/70 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
            <BookOpen className="h-4 w-4" />
          </div>
        </button>
      </div>

      {/* ── Unified Compact Control Bar ────────────────────────────────────── */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-2 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('tests');
              setStatusFilter('ALL');
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'tests' && statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>All Tests</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'tests' && statusFilter === 'ALL'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {dynamicStats.total_tests}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tests');
              setStatusFilter('LIVE');
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'tests' && statusFilter === 'LIVE'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Live Now</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'tests' && statusFilter === 'LIVE'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {dynamicStats.live_tests}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tests');
              setStatusFilter('UPCOMING');
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'tests' && statusFilter === 'UPCOMING'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Upcoming</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'tests' && statusFilter === 'UPCOMING'
                  ? 'bg-white/20 text-white'
                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
              }`}
            >
              {dynamicStats.upcoming_tests}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('tests');
              setStatusFilter('COMPLETED');
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'tests' && statusFilter === 'COMPLETED'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'tests' && statusFilter === 'COMPLETED'
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
              }`}
            >
              {dynamicStats.completed_tests}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('courses');
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition ${
              activeTab === 'courses'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>Courses</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === 'courses'
                  ? 'bg-white/20 text-white'
                  : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
              }`}
            >
              {dynamicStats.enrolled_courses_count}
            </span>
          </button>
        </div>

        {/* Right: Course Filter & Search */}
        <div className="flex flex-wrap items-center gap-1.5">
          {activeTab === 'tests' && (
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                aria-label="Filter by course"
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="ALL">All Courses ({enrolledCourses.length})</option>
                {enrolledCourses.map((c) => (
                  <option key={c.course_id} value={String(c.course_id)}>
                    {c.course_code} - {c.course_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative flex-1 sm:w-56 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'tests' ? 'Search tests, topics...' : 'Search courses...'}
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-7 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Content View: Tests Grid ───────────────────────────────────────── */}
      {activeTab === 'tests' && (
        <>
          {loading && scheduledTests.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
              <span className="mt-2 text-xs font-medium text-slate-500">Loading your assessments...</span>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <AlertCircle className="h-8 w-8 text-slate-400" />
              <h3 className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                No assessments found
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                {hasActiveFilters
                  ? 'No tests match your current filter and search criteria. Try resetting filters.'
                  : 'You do not have any scheduled continuous assessments or MCQ exams right now.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTests.map((test) => {
                const isLive = test.status === 'Live';
                const isUpcoming = test.status === 'Upcoming';
                const isCompleted = test.status === 'Completed';
                const isCancelled = test.status === 'Cancelled';

                return (
                  <div
                    key={test.id}
                    className={`group flex flex-col justify-between rounded-xl border bg-white p-3.5 shadow-2xs transition-all hover:shadow-xs dark:bg-slate-900 ${
                      isLive
                        ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
                        : 'border-slate-200/90 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Top Row: Course Code + Status Pill */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {test.course_code || 'COURSE'}
                        </span>

                        {isLive && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Now
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            <Calendar className="h-2.5 w-2.5" />
                            Upcoming
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Completed
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Cancelled
                          </span>
                        )}
                      </div>

                      {/* Title & Course Name */}
                      <div className="mt-2">
                        <h3 className="line-clamp-1 text-sm font-bold text-slate-900 group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
                          {test.title}
                        </h3>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                          {test.course_name}
                        </p>
                      </div>

                      {/* Type and Meta tags */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {test.test_type}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {test.duration_minutes}m
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          <Award className="h-3 w-3 text-slate-400" />
                          {test.total_marks} Marks
                        </span>
                      </div>

                      {/* Timing schedule strip */}
                      <div className="mt-2.5 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 dark:text-slate-500">Date:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {test.test_date || 'TBA'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-slate-400 dark:text-slate-500">Window:</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {test.start_time || 'TBA'} - {test.end_time || 'TBA'}
                          </span>
                        </div>
                      </div>

                      {/* Topics pills if present */}
                      {test.topics && test.topics.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {test.topics.slice(0, 2).map((topic, idx) => (
                            <span
                              key={idx}
                              className="inline-block max-w-[130px] truncate rounded-sm bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                            >
                              #{topic}
                            </span>
                          ))}
                          {test.topics.length > 2 && (
                            <span className="text-[10px] text-slate-400">
                              +{test.topics.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSelectedTest(test)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Details</span>
                      </button>

                      {isLive && (
                        <button
                          type="button"
                          onClick={() => handleStartTest(test)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          <span>Start Test</span>
                        </button>
                      )}

                      {isUpcoming && test.source === 'online_mcq' && (
                        <button
                          type="button"
                          onClick={() => handleStartTest(test)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-indigo-600 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-indigo-700 active:scale-95"
                        >
                          <span>Join Screen</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}

                      {isCompleted && (
                        <button
                          type="button"
                          onClick={() => handleViewReport(test)}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-purple-600 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-purple-700 active:scale-95"
                        >
                          <span>View Result</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── Content View: Courses Grid ──────────────────────────────────────── */}
      {activeTab === 'courses' && (
        <>
          {filteredCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <BookOpen className="h-8 w-8 text-slate-400" />
              <h3 className="mt-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                No courses found
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {searchQuery
                  ? 'No enrolled courses match your search query.'
                  : 'You are not enrolled in any active courses.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((c) => (
                <div
                  key={c.course_id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                        {c.course_code}
                      </span>
                      {c.credits !== undefined && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {c.credits} Credits
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                      {c.course_name}
                    </h3>

                    {c.instance_name && (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Instance: <span className="font-medium text-slate-700 dark:text-slate-300">{c.instance_name}</span>
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      {c.semester && <span>Semester {c.semester}</span>}
                      {c.enrollment_status && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          {c.enrollment_status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3.5 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourseFilter(String(c.course_id));
                        setActiveTab('tests');
                        setStatusFilter('ALL');
                      }}
                      className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Layers className="h-3 w-3" />
                      <span>View Course Tests</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Test Details Modal ──────────────────────────────────────────────── */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {selectedTest.course_code}
                </span>
                <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                  {selectedTest.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTest(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div>
                  <span className="text-slate-400">Course</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedTest.course_name}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Test Type</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedTest.test_type}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Date & Window</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedTest.test_date || 'TBA'} ({selectedTest.start_time || 'TBA'} - {selectedTest.end_time || 'TBA'})
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Duration & Marks</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedTest.duration_minutes} Mins • {selectedTest.total_marks} Marks
                  </p>
                </div>
              </div>

              {selectedTest.description && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Instructions:</span>
                  <p className="mt-1 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300">
                    {selectedTest.description}
                  </p>
                </div>
              )}

              {selectedTest.topics && selectedTest.topics.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Syllabus / Topics:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedTest.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTest(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Close
              </button>
              {selectedTest.status === 'Live' && (
                <button
                  type="button"
                  onClick={() => {
                    const testToStart = selectedTest;
                    setSelectedTest(null);
                    handleStartTest(testToStart);
                  }}
                  className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  Start Assessment Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Completion Report Modal ─────────────────────────────────────────── */}
      {completionReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white p-5 shadow-2xl dark:border-emerald-950/60 dark:bg-slate-900">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <span className="mt-2.5 inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                Assessment Submitted
              </span>
              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                {completionReport.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Your test submission has been recorded successfully.
              </p>
            </div>

            {/* Score Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Correct
                </span>
                <p className="mt-0.5 text-lg font-black text-emerald-700 dark:text-emerald-300">
                  {completionReport.correct}{' '}
                  <span className="text-xs font-medium text-emerald-600/70">/ {completionReport.total}</span>
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Score %
                </span>
                <p
                  className={`mt-0.5 text-lg font-black ${
                    Number(completionReport.total) > 0
                      ? Math.round((Number(completionReport.correct) / Number(completionReport.total)) * 100) >= 40
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-500'
                  }`}
                >
                  {Number(completionReport.total) > 0
                    ? `${Math.round((Number(completionReport.correct) / Number(completionReport.total)) * 100)}%`
                    : '—'}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Time Taken
                </span>
                <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-200">
                  {completionReport.time}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-800/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tab Switches
                </span>
                <p
                  className={`mt-0.5 text-lg font-black ${
                    Number(completionReport.switches) === 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {completionReport.switches}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-indigo-50 p-2.5 text-[11px] text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Detailed question-level results will be available once the test window closes.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCompletionReport(null)}
              className="mt-4 w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivateRouter(StudentDashboard);
