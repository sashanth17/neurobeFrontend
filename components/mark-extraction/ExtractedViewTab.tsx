import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, ZoomIn, ZoomOut, Check, AlertTriangle, Save, Loader2, Info, 
  AlertCircle, Lock, Search, RotateCw, Sparkles, User, ShieldCheck, RefreshCw,
  ChevronLeft, ChevronRight, Share2, Maximize2, ExternalLink, X, UserPlus, CheckCircle2
} from 'lucide-react';
import { 
  MarkExtractionService, 
  LatestExtractionResults, 
  StudentMarks, 
  QuestionMark 
} from '@/services/markExtraction.service';
import { Success, Failure } from '@/utils/function.utils';
import instance from '@/utils/axios.utils';

interface ExtractedViewTabProps {
  ciaTestId: number;
  instanceId?: string;
  onGoToExtraction?: () => void;
}

export default function ExtractedViewTab({ ciaTestId, instanceId, onGoToExtraction }: ExtractedViewTabProps) {
  const [results, setResults] = useState<LatestExtractionResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Filter Tabs
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEEDS_REVIEW' | 'READY_TO_VERIFY' | 'VERIFIED' | 'UNMAPPED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentMarks | null>(null);

  // Image Viewer State
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fitMode, setFitMode] = useState<'width' | 'page'>('width');
  const [activePage, setActivePage] = useState(1);
  const marksTableContainerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const studentRailRef = useRef<HTMLDivElement>(null);

  // Total Mismatch Option
  const [mismatchDecision, setMismatchDecision] = useState<'calculated' | 'paper' | 'custom'>('calculated');
  const [isCustomTotalEditing, setIsCustomTotalEditing] = useState(false);
  const [customTotalValue, setCustomTotalValue] = useState<string>('');

  // Assign Student Modal State (for Unmapped Students)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [isLoadingEnrolled, setIsLoadingEnrolled] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch enrolled students for mapping
  useEffect(() => {
    if (!instanceId) return;
    setIsLoadingEnrolled(true);
    instance()
      .get(`course-enrollments/?course_instance_id=${instanceId}`)
      .then((res: any) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.results ?? res.data?.data ?? []);
        setEnrolledStudents(list);
      })
      .catch((err) => console.error("Failed to load enrolled students", err))
      .finally(() => setIsLoadingEnrolled(false));
  }, [instanceId]);

  // Reset scroll when selected student changes
  useEffect(() => {
    marksTableContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    imageContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setIsCustomTotalEditing(false);
  }, [selectedStudent?.student_marks_id]);

  useEffect(() => {
    if (!ciaTestId || isNaN(Number(ciaTestId))) {
      setLoadError("NOT_EXTRACTED_YET");
      return;
    }
    fetchResults();
  }, [ciaTestId]);

  const fetchResults = async () => {
    if (!ciaTestId || isNaN(Number(ciaTestId))) {
      setLoadError("NOT_EXTRACTED_YET");
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await MarkExtractionService.getLatestExtractionResults(ciaTestId);
      if (!data) {
        setResults(null);
        setSelectedStudent(null);
        setLoadError("NOT_EXTRACTED_YET");
        return;
      }
      setResults(data);
      if (data.students && data.students.length > 0) {
        if (selectedStudent) {
          const current = data.students.find((s: StudentMarks) => s.student_marks_id === selectedStudent.student_marks_id);
          if (current) {
            setSelectedStudent(current);
            return;
          }
        }
        // Auto-select first student
        const firstMatch = data.students.find((s: StudentMarks) => s.mapping_status === 'AUTO_MAPPED') || data.students[0];
        setSelectedStudent(firstMatch);
        if (firstMatch && firstMatch.source_pages && firstMatch.source_pages.length > 0) {
          setActivePage(firstMatch.source_pages[0]);
        }
      } else {
        setSelectedStudent(null);
      }
    } catch (error: any) {
      console.error("Failed to fetch extraction results", error);
      setResults(null);
      setSelectedStudent(null);
      setLoadError(
        error?.response?.data?.detail || 
        error?.message || 
        "Unable to load extraction results. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkChange = (questionKey: string, newValue: number) => {
    if (!selectedStudent) return;
    
    const validVal = isNaN(newValue) ? 0 : newValue;
    const updatedMarks = selectedStudent.marks.map(m => 
      m.question_key === questionKey ? { ...m, final_mark: validVal, status: 'VERIFIED' } : m
    );
    
    // Auto-recalculate total sum
    const newTotal = updatedMarks.reduce((sum, m) => sum + (Number(m.final_mark) || 0), 0);
    const paperEntered = selectedStudent.paper_total_entered;
    const mismatch = paperEntered !== undefined && paperEntered !== null && Math.abs(newTotal - paperEntered) > 0.01;

    setSelectedStudent({
      ...selectedStudent,
      marks: updatedMarks,
      final_total_mark: Math.round(newTotal * 100) / 100,
      total_mismatch_flag: mismatch,
    });
    setMismatchDecision('calculated');
    setHasUnsavedChanges(true);
  };

  const handleDecisionChange = (decision: 'calculated' | 'paper') => {
    if (!selectedStudent) return;
    setMismatchDecision(decision);
    setIsCustomTotalEditing(false);

    let chosenTotal = selectedStudent.final_total_mark;
    if (decision === 'paper' && selectedStudent.paper_total_entered !== undefined) {
      chosenTotal = selectedStudent.paper_total_entered;
    } else if (decision === 'calculated') {
      chosenTotal = selectedStudent.marks.reduce((sum, m) => sum + (Number(m.final_mark) || 0), 0);
    }

    setSelectedStudent({
      ...selectedStudent,
      final_total_mark: chosenTotal,
      total_selection_option: decision === 'paper' ? 'KEEP_PAPER_TOTAL' : 'USE_CALCULATED_TOTAL',
    });
    setHasUnsavedChanges(true);
  };

  const handleCustomTotalSave = () => {
    if (!selectedStudent) return;
    const val = parseFloat(customTotalValue);
    if (isNaN(val) || val < 0) {
      Failure("Please enter a valid positive number for total mark.");
      return;
    }
    setSelectedStudent({
      ...selectedStudent,
      final_total_mark: val,
      total_selection_option: 'CUSTOM_OVERRIDE',
    });
    setMismatchDecision('custom');
    setIsCustomTotalEditing(false);
    setHasUnsavedChanges(true);
  };

  // ── Action 1: Update marks only (Save Draft) ──────────────────────────────────
  const handleUpdateMarks = async () => {
    if (!selectedStudent || isUpdating || isVerifying) return;
    setIsUpdating(true);
    try {
      await MarkExtractionService.updateStudentMarks(selectedStudent.student_marks_id, {
        actual_reg_number: selectedStudent.actual_reg_number,
        student_reg_number: selectedStudent.actual_reg_number,
        final_total_mark: selectedStudent.final_total_mark,
        total_selection_option: selectedStudent.total_selection_option,
        marks: selectedStudent.marks,
      });
      
      Success("Student marks updated successfully!");
      setHasUnsavedChanges(false);
      await fetchResults();
    } catch (error: any) {
      console.error("Failed to update marks", error);
      Failure(error?.response?.data?.detail || "Failed to update student marks.");
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Action 2: Verify & lock student marks ─────────────────────────────────────
  const handleVerifyAndLock = async () => {
    if (!selectedStudent || isVerifying || isUpdating) return;
    if (hasUnsavedChanges) {
      Failure("Please save your updated marks first before verifying.");
      return;
    }
    setIsVerifying(true);
    try {
      await MarkExtractionService.verifyAndLockStudentMarks(selectedStudent.student_marks_id);
      
      Success("Student marks verified and locked successfully!");
      await fetchResults();
    } catch (error: any) {
      console.error("Failed to verify and lock marks", error);
      Failure(error?.response?.data?.detail || "Failed to verify & lock student marks.");
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Action 3: Assign student to unmapped sheet ────────────────────────────────
  const handleAssignStudent = async (student: any) => {
    if (!selectedStudent || isAssigning) return;
    setIsAssigning(true);
    try {
      const regNo = student.register_number || student.reg_no || '';
      const sId = student.student_id || student.id;
      
      await MarkExtractionService.updateStudentMarks(selectedStudent.student_marks_id, {
        student_id: sId,
        actual_reg_number: regNo,
        student_reg_number: regNo,
      });

      Success(`Assigned answer sheet to ${student.student_name || regNo} successfully!`);
      setIsAssignModalOpen(false);
      setAssignSearch('');
      await fetchResults();
    } catch (err: any) {
      console.error("Failed to assign student", err);
      Failure(err?.response?.data?.detail || "Failed to assign student.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleShareTask = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      Success("Verification task link copied to clipboard!");
    }
  };

  const scrollRail = (direction: 'left' | 'right') => {
    if (studentRailRef.current) {
      studentRailRef.current.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth'
      });
    }
  };

  // Counts for Metric Cards & Filter Tabs
  const filterCounts = useMemo(() => {
    const students = results?.students || [];
    const verified = students.filter(s => s.is_locked || s.verification_status === 'VERIFIED').length;
    const needsReview = students.filter(s => (!s.is_locked && s.verification_status !== 'VERIFIED') && (s.mapping_status === 'NEEDS_REVIEW' || s.verification_status === 'NEEDS_REVIEW' || s.total_mismatch_flag)).length;
    const readyToVerify = students.filter(s => (!s.is_locked && s.verification_status !== 'VERIFIED') && s.mapping_status === 'AUTO_MAPPED' && !s.total_mismatch_flag).length;
    const unmapped = students.filter(s => s.mapping_status === 'UNMAPPED' || s.mapping_status === 'NO_STUDENT_FOUND' || s.mapping_status === 'UNDETECTED_STUDENT_MARK' || !s.student_id).length;

    return {
      ALL: students.length,
      NEEDS_REVIEW: needsReview,
      READY_TO_VERIFY: readyToVerify,
      VERIFIED: verified,
      UNMAPPED: unmapped,
      REMAINING: students.length - verified,
    };
  }, [results?.students]);

  // Filter students for the horizontal rail
  const filteredStudents = useMemo(() => {
    if (!results?.students) return [];
    return results.students.filter(s => {
      const isVerified = s.is_locked || s.verification_status === 'VERIFIED';
      const isNeedsReview = !isVerified && (s.mapping_status === 'NEEDS_REVIEW' || s.verification_status === 'NEEDS_REVIEW' || s.total_mismatch_flag);
      const isReadyToVerify = !isVerified && s.mapping_status === 'AUTO_MAPPED' && !s.total_mismatch_flag;
      const isUnmapped = s.mapping_status === 'UNMAPPED' || s.mapping_status === 'NO_STUDENT_FOUND' || s.mapping_status === 'UNDETECTED_STUDENT_MARK' || !s.student_id;

      if (activeFilter === 'NEEDS_REVIEW' && !isNeedsReview) return false;
      if (activeFilter === 'READY_TO_VERIFY' && !isReadyToVerify) return false;
      if (activeFilter === 'VERIFIED' && !isVerified) return false;
      if (activeFilter === 'UNMAPPED' && !isUnmapped) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = (s.student_name || '').toLowerCase().includes(query);
        const regMatch = (s.actual_reg_number || s.register_number || '').toLowerCase().includes(query);
        return nameMatch || regMatch;
      }
      return true;
    });
  }, [results?.students, activeFilter, searchQuery]);

  // Filter enrolled students for the assign modal
  const filteredEnrolledStudents = useMemo(() => {
    if (!assignSearch.trim()) return enrolledStudents;
    const q = assignSearch.toLowerCase().trim();
    return enrolledStudents.filter(s => 
      (s.student_name || s.name || '').toLowerCase().includes(q) ||
      (s.register_number || s.reg_no || '').toLowerCase().includes(q)
    );
  }, [enrolledStudents, assignSearch]);

  // Loading state
  if (isLoading && !results) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500 bg-white dark:bg-gray-800 h-full">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600 mb-3" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Loading extraction results...</h3>
        <p className="text-xs text-gray-400 mt-1">Retrieving student marks and answer scripts</p>
      </div>
    );
  }

  // Graceful Empty State (when no extraction exists yet or 404)
  if (loadError === "NOT_EXTRACTED_YET" || (!isLoading && !loadError && (!results || results.students?.length === 0))) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-gray-800 h-full">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-950/60 flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          No Extraction Results Available
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
          This CIA test does not have any completed mark extractions yet. Upload student answer sheets in the Extraction tab to run AI extraction.
        </p>
        <div className="flex items-center gap-3">
          {onGoToExtraction && (
            <button
              onClick={onGoToExtraction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-violet-600 text-white hover:bg-violet-700 transition shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Go to Extraction Tab</span>
            </button>
          )}
          <button
            onClick={fetchResults}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    );
  }

  // Error State
  if (loadError && !results) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-gray-800 h-full">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/60 flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Unable to Load Extraction Results
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400 max-w-md mb-6 font-mono text-xs bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200 dark:border-red-900/60">
          {loadError}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchResults}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-violet-600 text-white hover:bg-violet-700 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          {onGoToExtraction && (
            <button
              onClick={onGoToExtraction}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <span>Go to Extraction Tab</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const isSelectedUnmapped = !selectedStudent?.student_id || selectedStudent.mapping_status === 'UNMAPPED' || selectedStudent.mapping_status === 'NO_STUDENT_FOUND' || selectedStudent.mapping_status === 'UNDETECTED_STUDENT_MARK';
  const calculatedSum = selectedStudent?.marks ? selectedStudent.marks.reduce((sum, m) => sum + (Number(m.final_mark) || 0), 0) : 0;
  const systemReadSum = selectedStudent?.marks ? selectedStudent.marks.reduce((sum, m) => sum + (Number(m.system_read) || 0), 0) : 0;
  const maxMarkSum = selectedStudent?.actual_max_mark || (selectedStudent?.marks ? selectedStudent.marks.reduce((sum, m) => sum + (Number(m.max_marks_assigned) || 0), 0) : 50);

  const handleMarkStatusToggle = (questionKey: string) => {
    if (!selectedStudent || selectedStudent.is_locked) return;
    const updatedMarks = selectedStudent.marks.map(m =>
      m.question_key === questionKey
        ? { ...m, status: m.status === 'VERIFIED' ? 'NEEDS_REVIEW' : 'VERIFIED' }
        : m
    );
    setSelectedStudent({ ...selectedStudent, marks: updatedMarks });
    setHasUnsavedChanges(true);
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-gray-50/70 dark:bg-gray-900 p-4 xl:p-6 space-y-4">

      {/* ── 1. Filter Bar & Share Task Action ───────────────────────────────── */}

      <div className="flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {/* All */}
          <button
            type="button"
            onClick={() => setActiveFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
              activeFilter === 'ALL'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            All ({filterCounts.ALL})
          </button>

          {/* Needs Review */}
          <button
            type="button"
            onClick={() => setActiveFilter('NEEDS_REVIEW')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
              activeFilter === 'NEEDS_REVIEW'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            Needs Review ({filterCounts.NEEDS_REVIEW})
          </button>

          {/* Ready to Verify */}
          <button
            type="button"
            onClick={() => setActiveFilter('READY_TO_VERIFY')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
              activeFilter === 'READY_TO_VERIFY'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            Ready to Verify ({filterCounts.READY_TO_VERIFY})
          </button>

          {/* Verified */}
          <button
            type="button"
            onClick={() => setActiveFilter('VERIFIED')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
              activeFilter === 'VERIFIED'
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            Verified ({filterCounts.VERIFIED})
          </button>

          {/* Unmapped (if any) */}
          {filterCounts.UNMAPPED > 0 && (
            <button
              type="button"
              onClick={() => setActiveFilter('UNMAPPED')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-2xs ${
                activeFilter === 'UNMAPPED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              Unmapped ({filterCounts.UNMAPPED})
            </button>
          )}
        </div>

        {/* Share Button & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search student or reg no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 w-52"
            />
          </div>

          <button
            type="button"
            onClick={handleShareTask}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 transition shadow-2xs"
          >
            <Share2 className="h-3.5 w-3.5 text-gray-500" />
            <span>Share Verification Task</span>
          </button>
        </div>
      </div>

      {/* ── 2. Horizontal Student Cards Rail / Carousel ────────────────────── */}
      <div className="relative flex items-center flex-shrink-0 group">
        {/* Left Scroll Button */}
        <button
          type="button"
          onClick={() => scrollRail('left')}
          title="Scroll Left"
          className="absolute -left-2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Horizontal Scroll Area */}
        <div 
          ref={studentRailRef}
          className="w-full flex items-center space-x-3 overflow-x-auto py-2 px-1 scroll-smooth no-scrollbar"
          style={{ scrollbarWidth: 'none' }}
        >
          {filteredStudents.length === 0 ? (
            <div className="w-full py-6 text-center text-xs text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              No students match the selected filter.
            </div>
          ) : (
            filteredStudents.map(student => {
              const isSelected = selectedStudent?.student_marks_id === student.student_marks_id;
              const isVerified = student.is_locked || student.verification_status === 'VERIFIED';
              const isNeedsReview = !isVerified && (student.mapping_status === 'NEEDS_REVIEW' || student.verification_status === 'NEEDS_REVIEW' || student.total_mismatch_flag);
              const isReadyToVerify = !isVerified && student.mapping_status === 'AUTO_MAPPED' && !student.total_mismatch_flag;
              const isUnmapped = !student.student_id || student.mapping_status === 'UNMAPPED' || student.mapping_status === 'NO_STUDENT_FOUND' || student.mapping_status === 'UNDETECTED_STUDENT_MARK';

              return (
                <button
                  type="button"
                  key={student.student_marks_id}
                  onClick={() => {
                    setSelectedStudent(student);
                    setHasUnsavedChanges(false);
                    if (student.source_pages && student.source_pages.length > 0) {
                      setActivePage(student.source_pages[0]);
                    }
                  }}
                  className={`w-56 shrink-0 p-3 rounded-2xl cursor-pointer text-left transition-all duration-150 border relative ${
                    isSelected
                      ? 'bg-violet-50/50 dark:bg-violet-950/30 border-violet-500 shadow-sm ring-2 ring-violet-500/20'
                      : 'bg-white dark:bg-gray-800 border-gray-200/90 dark:border-gray-700/80 hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  {/* Student Name */}
                  <div className="font-bold text-xs text-gray-900 dark:text-white truncate">
                    {student.student_name || (isUnmapped ? 'Unmapped Answer Sheet' : 'Unknown Student')}
                  </div>

                  {/* Register Number */}
                  <div className="text-[11px] text-gray-400 font-mono mt-0.5 truncate">
                    {student.actual_reg_number || student.register_number || 'No reg number detected'}
                  </div>

                  {/* Marks & Status Badge */}
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    <span className="text-xs font-black text-gray-900 dark:text-white">
                      {student.final_total_mark !== undefined ? student.final_total_mark : '-'}/{student.actual_max_mark || 50}
                    </span>

                    {/* Status Pill Badge */}
                    {isVerified && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Verified
                      </span>
                    )}
                    {isReadyToVerify && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300">
                        Ready to Verify
                      </span>
                    )}
                    {isNeedsReview && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                        Needs Review
                      </span>
                    )}
                    {isUnmapped && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300">
                        Unmapped
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Scroll Button */}
        <button
          type="button"
          onClick={() => scrollRail('right')}
          title="Scroll Right"
          className="absolute -right-2 z-10 p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── 3. Main Workspace Layout (2 Columns: Left = Document, Right = Verification) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-[620px]">

        {/* ── Left Column: Physical Answer Script Viewer (Dark Canvas) ─────── */}
        <div className="lg:col-span-6 xl:col-span-6 bg-gray-950 rounded-2xl border border-gray-800 shadow-sm flex flex-col overflow-hidden h-[680px]">
          
          {/* Canvas Top Bar */}
          <div className="px-4 py-2.5 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between text-xs text-gray-300 flex-shrink-0">
            {/* File info */}
            <div className="flex items-center space-x-2 truncate">
              <FileText className="h-4 w-4 text-violet-400 flex-shrink-0" />
              <span className="font-mono text-[11px] text-gray-200 truncate max-w-[200px]">
                {selectedStudent?.actual_reg_number ? `Ans_${selectedStudent.actual_reg_number}.pdf` : 'Physical Answer Script'}
              </span>
            </div>

            {/* Page switcher (Center) */}
            {selectedStudent && selectedStudent.source_pages && selectedStudent.source_pages.length > 0 && (
              <div className="flex items-center space-x-2 bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-700 text-[11px]">
                <button
                  type="button"
                  disabled={activePage <= 1}
                  onClick={() => setActivePage(p => Math.max(1, p - 1))}
                  className="hover:text-white disabled:opacity-30 disabled:hover:text-gray-300"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span>Page {activePage} of {selectedStudent.source_pages.length}</span>
                <button
                  type="button"
                  disabled={activePage >= selectedStudent.source_pages.length}
                  onClick={() => setActivePage(p => Math.min(selectedStudent.source_pages.length, p + 1))}
                  className="hover:text-white disabled:opacity-30 disabled:hover:text-gray-300"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* View Controls (Right) */}
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => setFitMode(m => m === 'width' ? 'page' : 'width')}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  fitMode === 'width' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
                title={fitMode === 'width' ? "Switch to Fit Page" : "Switch to Fit Width"}
              >
                {fitMode === 'width' ? 'Fit Width' : 'Fit Box'}
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(z => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                className="p-1 hover:text-white text-gray-400 transition"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => { setZoomLevel(1); setFitMode('width'); setRotation(0); }}
                className="font-mono text-[11px] hover:text-white text-gray-300 px-1"
                title="Reset to 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(z => Math.min(2.5, Number((z + 0.15).toFixed(2))))}
                className="p-1 hover:text-white text-gray-400 transition"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="p-1 hover:text-white text-gray-400 transition"
                title="Rotate 90°"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Scrollable Image Area */}
          <div 
            ref={imageContainerRef}
            className="flex-1 overflow-y-auto overflow-x-auto bg-gray-950 p-4 relative"
            style={{ scrollBehavior: 'smooth' }}
          >
            {selectedStudent && results?.image_base_url ? (
              <div className="min-w-full flex flex-col items-center justify-start py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={MarkExtractionService.resolvePageImageUrl(results.image_base_url, activePage)}
                  alt="Scanned Answer Script"
                  style={{
                    width: fitMode === 'width' ? `${Math.round(zoomLevel * 100)}%` : 'auto',
                    maxWidth: fitMode === 'width' ? (zoomLevel <= 1 ? '920px' : 'none') : 'none',
                    maxHeight: fitMode === 'page' ? '100%' : 'none',
                    transform: rotation ? `rotate(${rotation}deg)` : undefined,
                    transformOrigin: 'top center',
                  }}
                  className="h-auto object-contain bg-white rounded-lg shadow-2xl border border-gray-800 transition-all duration-100 mb-16"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder-document.svg';
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 py-24 h-full">
                <FileText className="h-12 w-12 mb-3 text-violet-400/30" />
                <p className="text-sm font-medium">Select a student card above to inspect answer script</p>
                <p className="text-xs text-gray-500 mt-1">Answer scripts are streamed directly from object storage</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Column: Marks Verification & Student Details ──────────── */}
        <div className="lg:col-span-6 xl:col-span-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/90 dark:border-gray-700/80 p-5 xl:p-6 shadow-sm flex flex-col h-[680px] overflow-hidden">
          {selectedStudent ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Student Header */}
              <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-700/60 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedStudent.student_name || (isSelectedUnmapped ? 'Unmapped Answer Sheet' : 'Unknown Student')}
                    </h2>
                    {isSelectedUnmapped && (
                      <button
                        type="button"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition shadow-2xs"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Assign Student</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {selectedStudent.actual_reg_number || 'No Register Number Mapped'}
                    </span>
                    {selectedStudent.is_locked ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" /> Locked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        Draft
                      </span>
                    )}
                  </div>
                </div>

                {/* Final Total Display */}
                <div className="text-right">
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {selectedStudent.final_total_mark} / {selectedStudent.actual_max_mark || 50}
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    Final Total Mark
                  </div>
                </div>
              </div>

              {/* Scrollable Verification Body */}
              <div ref={marksTableContainerRef} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">

                {/* Unmapped Student Notice Banner */}
                {isSelectedUnmapped && (
                  <div className="p-3.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/60 flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <UserPlus className="h-5 w-5 text-violet-600 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-violet-900 dark:text-violet-200">
                          Student Not Identified Yet
                        </div>
                        <div className="text-[11px] text-violet-700 dark:text-violet-300">
                          This evaluated answer sheet could not be automatically matched to an enrolled student.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAssignModalOpen(true)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-600 text-white hover:bg-violet-700 transition shadow-2xs shrink-0"
                    >
                      Assign Student
                    </button>
                  </div>
                )}

                {/* ── Total Needs Review / Mismatch Alert Box ──────────────── */}
                {selectedStudent.total_mismatch_flag && (
                  <div className="p-4 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-3">
                    <div className="flex items-start space-x-2.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                          TOTAL NEEDS REVIEW
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                          The total written on the paper is <strong>{selectedStudent.paper_total_entered}</strong>, but the question marks add up to <strong>{calculatedSum}</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Radio Options */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {selectedStudent.paper_total_entered !== undefined && (
                        <button
                          type="button"
                          onClick={() => handleDecisionChange('paper')}
                          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            mismatchDecision === 'paper'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white dark:bg-gray-800 text-amber-800 dark:text-amber-300 border-amber-300 hover:bg-amber-100'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${mismatchDecision === 'paper' ? 'border-white' : 'border-amber-500'}`}>
                            {mismatchDecision === 'paper' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span>Keep Paper Total — {selectedStudent.paper_total_entered}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDecisionChange('calculated')}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          mismatchDecision === 'calculated'
                            ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${mismatchDecision === 'calculated' ? 'border-white' : 'border-gray-400'}`}>
                          {mismatchDecision === 'calculated' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span>Use Question Total — {calculatedSum}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomTotalEditing(true);
                          setCustomTotalValue(String(selectedStudent.final_total_mark));
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition"
                      >
                        Edit Final Total
                      </button>
                    </div>

                    {/* Inline Custom Total Input */}
                    {isCustomTotalEditing && (
                      <div className="flex items-center gap-2 pt-2 border-t border-amber-200/60">
                        <span className="text-xs text-amber-800 font-semibold">Custom Total:</span>
                        <input
                          type="number"
                          step="0.5"
                          value={customTotalValue}
                          onChange={(e) => setCustomTotalValue(e.target.value)}
                          className="w-20 px-2 py-1 text-xs font-bold rounded border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleCustomTotalSave}
                          className="px-3 py-1 rounded bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsCustomTotalEditing(false)}
                          className="text-xs text-gray-500 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Marks Verification Table ─────────────────────────────── */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                        MARKS VERIFICATION
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        System Read = mark extracted from the evaluated answer sheet. Final Mark = mark confirmed by the instructor.
                      </p>
                    </div>
                  </div>

                  {/* Table Structure */}
                  <div className="border border-gray-200 dark:border-gray-700/80 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/90 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">QUESTION</th>
                          <th className="py-2.5 px-3 text-center">MAX MARK</th>
                          <th className="py-2.5 px-3 text-center">SYSTEM READ</th>
                          <th className="py-2.5 px-3 text-center">FINAL MARK</th>
                          <th className="py-2.5 px-3 text-right">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-750">
                        {selectedStudent.marks && selectedStudent.marks.length > 0 ? (
                          selectedStudent.marks.map((mark) => {
                            const isMarkVerified = mark.status === 'VERIFIED';
                            const qNum = parseInt(mark.question_key.replace(/\D/g, '') || '0', 10);
                            const sectionLabel = mark.section_name || (qNum <= 10 ? 'Part A' : 'Part B');

                            return (
                              <tr key={mark.question_key} className="hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition">
                                <td className="py-2 px-3 font-bold text-gray-900 dark:text-white">
                                  {mark.question_key} <span className="font-normal text-gray-400 text-[11px]">({sectionLabel})</span>
                                </td>
                                <td className="py-2 px-3 text-center font-medium text-gray-500 dark:text-gray-400">
                                  {mark.max_marks_assigned}
                                </td>
                                <td className="py-2 px-3 text-center font-bold text-gray-700 dark:text-gray-300">
                                  {mark.system_read ?? '-'}
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={mark.max_marks_assigned}
                                    step={0.5}
                                    value={mark.final_mark ?? ''}
                                    onChange={(e) => handleMarkChange(mark.question_key, parseFloat(e.target.value))}
                                    disabled={selectedStudent.is_locked}
                                    className="w-16 h-7 text-center font-bold text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:outline-none transition shadow-2xs"
                                  />
                                </td>
                                <td className="py-2 px-3 text-right">
                                  <button
                                    type="button"
                                    title={selectedStudent.is_locked ? 'Locked — cannot change status' : (isMarkVerified ? 'Click to mark as Needs Review' : 'Click to mark as Verified')}
                                    disabled={selectedStudent.is_locked}
                                    onClick={() => handleMarkStatusToggle(mark.question_key)}
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition cursor-pointer select-none ${
                                      isMarkVerified
                                        ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                                        : 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
                                    } disabled:cursor-default disabled:opacity-60`}
                                  >
                                    {isMarkVerified ? (
                                      <><Check className="h-2.5 w-2.5 stroke-[2.5]" /> Verified</>
                                    ) : (
                                      <>Needs Review</>
                                    )}
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-gray-400 text-xs">
                              No question marks found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      {/* Total Footer Row */}
                      <tfoot className="bg-gray-50/90 dark:bg-gray-750 font-bold border-t border-gray-200 dark:border-gray-700">
                        <tr>
                          <td className="py-2.5 px-3 text-gray-900 dark:text-white">Total</td>
                          <td className="py-2.5 px-3 text-center text-gray-500">{maxMarkSum}</td>
                          <td className="py-2.5 px-3 text-center text-gray-700 dark:text-gray-300">{systemReadSum}</td>
                          <td className="py-2.5 px-3 text-center text-violet-600 dark:text-violet-400 font-black text-sm">
                            {selectedStudent.final_total_mark}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-900 dark:text-white font-mono">
                            {selectedStudent.final_total_mark} / {selectedStudent.actual_max_mark || 50}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Review Highlight Banner */}
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 flex items-center space-x-2 text-xs text-amber-800 dark:text-amber-300">
                  <Info className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span>Review the highlighted mark before verification.</span>
                </div>
              </div>

              {/* ── Footer: Action Buttons ─────────────────────────────────── */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-end space-x-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleUpdateMarks}
                  disabled={selectedStudent.is_locked || isUpdating || isVerifying}
                  className="flex items-center space-x-2 py-2.5 px-5 rounded-xl font-bold text-xs border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-600" />
                  ) : (
                    <Save className="h-3.5 w-3.5 text-violet-600" />
                  )}
                  <span>{isUpdating ? "Saving..." : "Update Marks"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleVerifyAndLock}
                  disabled={selectedStudent.is_locked || isUpdating || isVerifying}
                  className="flex items-center space-x-2 py-2.5 px-5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                >
                  {isVerifying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  )}
                  <span>{isVerifying ? "Verifying..." : "Verify & Lock"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400 py-32 h-full">
              <User className="h-12 w-12 mb-3 text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">No Student Selected</p>
              <p className="text-xs text-gray-400 mt-1">Select a student card above to inspect and verify marks.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Assign Student Modal (For Unmapped Answer Sheets) ─────────────── */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-lg w-full p-5 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-violet-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Assign Student to Answer Sheet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Match this scanned physical answer sheet to an enrolled student from the class roster.
            </p>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name or register number..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-750 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Students List */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-xl p-1">
              {isLoadingEnrolled ? (
                <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                  <span>Loading enrolled students...</span>
                </div>
              ) : filteredEnrolledStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">
                  No enrolled students match your search.
                </div>
              ) : (
                filteredEnrolledStudents.map((st: any) => (
                  <button
                    key={st.student_id || st.id || st.register_number}
                    type="button"
                    onClick={() => handleAssignStudent(st)}
                    disabled={isAssigning}
                    className="w-full p-2.5 rounded-lg flex items-center justify-between text-left hover:bg-violet-50/60 dark:hover:bg-violet-950/30 transition group"
                  >
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-violet-700">
                        {st.student_name || st.name}
                      </div>
                      <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                        {st.register_number || st.reg_no}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-violet-600 opacity-0 group-hover:opacity-100 transition">
                      Assign →
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
