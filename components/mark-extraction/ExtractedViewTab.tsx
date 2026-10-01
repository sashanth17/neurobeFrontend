import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  FileText, ZoomIn, ZoomOut, Check, AlertTriangle, Save, Loader2, Info, 
  AlertCircle, Lock, Unlock, Search, RotateCw, Sparkles, User, ShieldCheck, RefreshCw,
  ChevronLeft, ChevronRight, Share2, Maximize2, ExternalLink, X, UserPlus, CheckCircle2, Trash2,
  Layers, ChevronDown
} from 'lucide-react';
import { 
  MarkExtractionService, 
  LatestExtractionResults, 
  StudentMarks, 
  QuestionMark,
  CIATestJobItem
} from '@/services/markExtraction.service';
import { Success, Failure } from '@/utils/function.utils';
import instance from '@/utils/axios.utils';

interface ExtractedViewTabProps {
  ciaTestId: number;
  instanceId?: string;
  onGoToExtraction?: () => void;
  onRefreshCiaTests?: () => void;
}

export default function ExtractedViewTab({ ciaTestId, instanceId, onGoToExtraction, onRefreshCiaTests }: ExtractedViewTabProps) {
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

  // Job History & Multi-Job Selection
  const [availableJobs, setAvailableJobs] = useState<CIATestJobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);

  // In-Progress Job Cancelling State
  const [isCancelling, setIsCancelling] = useState(false);

  // Unlocking State
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Pagination for Student Cards
  const [studentPageIndex, setStudentPageIndex] = useState(0);
  const STUDENTS_PER_PAGE = 10;

  // Delete Job Modal & 5-Second Undo State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingJob, setIsDeletingJob] = useState(false);
  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<number | null>(null);
  const [undoSecondsRemaining, setUndoSecondsRemaining] = useState<number>(5);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deleteCountdownRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
      if (deleteCountdownRef.current) clearInterval(deleteCountdownRef.current);
    };
  }, []);

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

  // Fetch available extraction jobs for this CIA test
  const fetchJobs = useCallback(async () => {
    if (!ciaTestId || isNaN(Number(ciaTestId))) return;
    try {
      const jobs = await MarkExtractionService.getCiaJobs(ciaTestId);
      setAvailableJobs(jobs);
    } catch (err) {
      console.error("Failed to fetch CIA extraction jobs", err);
    }
  }, [ciaTestId]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Cancel running extraction job
  const handleCancelJob = async (jobId: number) => {
    setIsCancelling(true);
    try {
      await MarkExtractionService.cancelExtractionJob(jobId);
      Success("Extraction job cancelled successfully.");
      await fetchJobs();
      await fetchResults(jobId);
      if (onRefreshCiaTests) onRefreshCiaTests();
    } catch (err: any) {
      console.error("Failed to cancel job", err);
      Failure(err?.response?.data?.detail || "Failed to cancel extraction job.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Poll progress when current job is in PROCESSING or PENDING
  useEffect(() => {
    if (!results || (results.job_status !== 'PROCESSING' && results.job_status !== 'PENDING')) return;

    const interval = setInterval(async () => {
      try {
        const data = await MarkExtractionService.getLatestExtractionResults(ciaTestId, selectedJobId ?? undefined);
        if (data) {
          setResults(data);
          if (data.job_status !== 'PROCESSING' && data.job_status !== 'PENDING') {
            await fetchJobs();
            if (onRefreshCiaTests) onRefreshCiaTests();
          }
        }
      } catch (err) {
        console.error("Polling error for in-progress job", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [results?.job_status, ciaTestId, selectedJobId, fetchJobs, onRefreshCiaTests]);

  useEffect(() => {
    if (!ciaTestId || isNaN(Number(ciaTestId))) {
      setLoadError("NOT_EXTRACTED_YET");
      return;
    }
    fetchResults();
  }, [ciaTestId]);

  const fetchResults = async (jobIdToFetch?: number) => {
    if (!ciaTestId || isNaN(Number(ciaTestId))) {
      setLoadError("NOT_EXTRACTED_YET");
      return;
    }
    setIsLoading(true);
    setLoadError(null);
    try {
      const targetJob = jobIdToFetch !== undefined ? jobIdToFetch : (selectedJobId ?? undefined);
      const data = await MarkExtractionService.getLatestExtractionResults(ciaTestId, targetJob);
      if (!data) {
        setResults(null);
        setSelectedStudent(null);
        setLoadError("NOT_EXTRACTED_YET");
        return;
      }
      setResults(data);
      if (data.job_id && selectedJobId !== data.job_id) {
        setSelectedJobId(data.job_id);
      }
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
      Failure("Please save your updated marks first by clicking 'Update Marks' before verifying.");
      return;
    }
    setIsVerifying(true);
    try {
      // 1. Automatically change all individual marks status to VERIFIED
      const verifiedMarks = (selectedStudent.marks || []).map(m => ({
        ...m,
        status: 'VERIFIED',
      }));

      // Update student marks with all marks set to VERIFIED status
      await MarkExtractionService.updateStudentMarks(selectedStudent.student_marks_id, {
        actual_reg_number: selectedStudent.actual_reg_number,
        student_reg_number: selectedStudent.actual_reg_number,
        final_total_mark: selectedStudent.final_total_mark,
        total_selection_option: selectedStudent.total_selection_option,
        marks: verifiedMarks,
      });

      // 2. Confirm and lock the student marks
      await MarkExtractionService.verifyAndLockStudentMarks(selectedStudent.student_marks_id);
      
      setHasUnsavedChanges(false);
      Success("Student marks verified and locked successfully!");
      await fetchResults();
    } catch (error: any) {
      console.error("Failed to verify and lock marks", error);
      Failure(error?.response?.data?.detail || "Failed to verify & lock student marks.");
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Action 3: Assign / Reassign student to sheet ──────────────────────────────
  const handleAssignStudent = async (student: any) => {
    if (!selectedStudent || isAssigning) return;
    setIsAssigning(true);
    try {
      const regNo = student.register_number || student.reg_no || '';
      const sId = student.student_id || student.id;
      const sName = student.student_name || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || regNo;
      
      await MarkExtractionService.updateStudentMarks(selectedStudent.student_marks_id, {
        student_id: sId,
        actual_reg_number: regNo,
        student_reg_number: regNo,
      });

      setSelectedStudent(prev => prev ? {
        ...prev,
        student_id: sId,
        student_name: sName,
        actual_reg_number: regNo,
        mapping_status: 'MANUALLY_MAPPED',
      } : null);

      Success(`Assigned answer sheet to ${sName} successfully!`);
      setIsAssignModalOpen(false);
      setAssignSearch('');
      await fetchResults(selectedJobId ?? undefined);
    } catch (err: any) {
      console.error("Failed to assign student", err);
      Failure(err?.response?.data?.detail || "Failed to assign student.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignByRegNumber = async (regNoToAssign: string) => {
    if (!selectedStudent || isAssigning || !regNoToAssign.trim()) return;
    setIsAssigning(true);
    try {
      const cleanReg = regNoToAssign.trim().toUpperCase();
      await MarkExtractionService.updateStudentMarks(selectedStudent.student_marks_id, {
        actual_reg_number: cleanReg,
        student_reg_number: cleanReg,
      });

      setSelectedStudent(prev => prev ? {
        ...prev,
        actual_reg_number: cleanReg,
        student_name: cleanReg,
        mapping_status: 'MANUALLY_MAPPED',
      } : null);

      Success(`Assigned answer sheet to Reg No ${cleanReg}!`);
      setIsAssignModalOpen(false);
      setAssignSearch('');
      await fetchResults(selectedJobId ?? undefined);
    } catch (err: any) {
      console.error("Failed to assign register number", err);
      Failure(err?.response?.data?.detail || "Failed to update register number.");
    } finally {
      setIsAssigning(false);
    }
  };

  // ── Action 4: Unlock Student Marks (Allows editing & removes from published result) ──
  const handleUnlockStudent = async () => {
    if (!selectedStudent || isUnlocking) return;
    setIsUnlocking(true);
    try {
      await MarkExtractionService.unlockStudentMarks(selectedStudent.student_marks_id);
      Success(`Student ${selectedStudent.student_name || selectedStudent.actual_reg_number} unlocked. You can now edit question marks.`);
      await fetchResults(selectedJobId ?? undefined);
      if (onRefreshCiaTests) onRefreshCiaTests();
    } catch (err: any) {
      console.error("Unlock student error", err);
      Failure(err?.response?.data?.detail || "Failed to unlock student marks.");
    } finally {
      setIsUnlocking(false);
    }
  };

  // ── Action 5: Delete extraction job with 5-Second Undo Grace Period ──────────
  const handleScheduleDeleteJob = () => {
    const targetJobId = results?.job_id || selectedJobId;
    if (!targetJobId) return;

    setShowDeleteModal(false);
    setPendingDeleteJobId(targetJobId);
    setUndoSecondsRemaining(5);

    deleteCountdownRef.current = setInterval(() => {
      setUndoSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (deleteCountdownRef.current) clearInterval(deleteCountdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    deleteTimeoutRef.current = setTimeout(async () => {
      await executeDeleteJob(targetJobId);
    }, 5000);
  };

  const handleCancelUndoDelete = () => {
    if (deleteTimeoutRef.current) clearTimeout(deleteTimeoutRef.current);
    if (deleteCountdownRef.current) clearInterval(deleteCountdownRef.current);
    setPendingDeleteJobId(null);
    Success("Extraction job deletion cancelled.");
  };

  const executeDeleteJob = async (id: number) => {
    setIsDeletingJob(true);
    try {
      await MarkExtractionService.deleteExtractionJob(id);
      Success("Extraction job and all associated files deleted successfully!");
      setResults(null);
      setSelectedStudent(null);
      await fetchJobs();
      if (onRefreshCiaTests) {
        await onRefreshCiaTests();
      }
      if (onGoToExtraction) {
        onGoToExtraction();
      } else {
        await fetchResults();
      }
    } catch (err: any) {
      console.error("Failed to delete job", err);
      Failure(err?.response?.data?.detail || "Failed to delete extraction job.");
    } finally {
      setIsDeletingJob(false);
      setPendingDeleteJobId(null);
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
    const readyToVerify = students.filter(s => (!s.is_locked && s.verification_status !== 'VERIFIED') && (s.mapping_status === 'AUTO_MAPPED' || s.mapping_status === 'MANUALLY_MAPPED') && !s.total_mismatch_flag).length;
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
      const isReadyToVerify = !isVerified && (s.mapping_status === 'AUTO_MAPPED' || s.mapping_status === 'MANUALLY_MAPPED') && !s.total_mismatch_flag;
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
      `${s.student_name || s.name || s.first_name || ''} ${s.last_name || ''} ${s.register_number || s.reg_no || ''}`.toLowerCase().includes(q)
    );
  }, [enrolledStudents, assignSearch]);

  // Paginated students for horizontal rail
  const totalStudentPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = studentPageIndex * STUDENTS_PER_PAGE;
    return filteredStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [filteredStudents, studentPageIndex]);

  // Current student index in filtered students
  const currentStudentIndex = useMemo(() => {
    if (!selectedStudent) return -1;
    return filteredStudents.findIndex(s => s.student_marks_id === selectedStudent.student_marks_id);
  }, [filteredStudents, selectedStudent]);

  const handleGoToNextStudent = () => {
    if (currentStudentIndex >= 0 && currentStudentIndex < filteredStudents.length - 1) {
      const next = filteredStudents[currentStudentIndex + 1];
      setSelectedStudent(next);
      if (next.source_pages && next.source_pages.length > 0) {
        setActivePage(next.source_pages[0]);
      }
    }
  };

  const handleGoToPrevStudent = () => {
    if (currentStudentIndex > 0) {
      const prev = filteredStudents[currentStudentIndex - 1];
      setSelectedStudent(prev);
      if (prev.source_pages && prev.source_pages.length > 0) {
        setActivePage(prev.source_pages[0]);
      }
    }
  };

  // Subsection totals computation
  const subsectionTotals = useMemo(() => {
    if (!selectedStudent?.marks || selectedStudent.marks.length === 0) return [];
    const map: Record<string, { section: string; obtained: number; max: number; count: number }> = {};
    selectedStudent.marks.forEach(m => {
      const sec = m.section_name || 'General';
      if (!map[sec]) {
        map[sec] = { section: sec, obtained: 0, max: 0, count: 0 };
      }
      map[sec].obtained += Number(m.final_mark) || 0;
      map[sec].max += Number(m.max_marks_assigned) || 0;
      map[sec].count += 1;
    });
    return Object.values(map);
  }, [selectedStudent?.marks]);

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

  // 1. In-Progress Job Card (when job is PROCESSING or PENDING)
  if (results && (results.job_status === 'PROCESSING' || results.job_status === 'PENDING')) {
    const totalP = results.total_pages || 1;
    const procP = results.processed_pages || 0;
    const pct = Math.min(100, Math.max(5, Math.round((procP / totalP) * 100)));
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/70 dark:bg-gray-900 h-full overflow-y-auto">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto shadow-inner">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Extraction in Progress
            </span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              AI Mark Extraction is Running
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Job #{results.job_id} • Processing answer sheets with high-precision OCR &amp; Vision models
            </p>
          </div>

          {/* Progress Bar & Counter: extraction of 30 out 2 done */}
          <div className="space-y-2 bg-gray-50 dark:bg-gray-750 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-gray-700 dark:text-gray-300">
                Extraction of {totalP} out {procP} done
              </span>
              <span className="text-violet-600 dark:text-violet-400 font-mono">
                {pct}%
              </span>
            </div>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-400 text-left pt-1">
              Currently processing pages. Results update automatically.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {results.job_id && (
              <button
                type="button"
                onClick={() => handleCancelJob(results.job_id!)}
                disabled={isCancelling}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800/80 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 transition cursor-pointer disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Cancel Running Job"}
              </button>
            )}

            <button
              type="button"
              onClick={() => fetchResults(selectedJobId ?? undefined)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Check Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Failed Job Card (when job is FAILED and 0 students were extracted)
  if (results && results.job_status === 'FAILED' && (!results.students || results.students.length === 0)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/70 dark:bg-gray-900 h-full overflow-y-auto">
        <div className="w-full max-w-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/60 rounded-3xl p-8 shadow-xl text-center space-y-6 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-200 dark:border-red-800">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 mb-3">
              Extraction Failed
            </span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Extraction Job #{results.job_id} Failed
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Pages attempted: {results.processed_pages || 0} of {results.total_pages || 0}
            </p>
          </div>

          <div className="p-4 bg-red-50/60 dark:bg-red-950/30 rounded-2xl border border-red-200 dark:border-red-900/60 text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 dark:text-red-300 block mb-1">
              Error Diagnostic
            </span>
            <p className="text-xs font-mono text-red-800 dark:text-red-300 break-words leading-relaxed">
              {results.error_message || "The AI worker encountered an unrecoverable failure during answer sheet extraction."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {results.job_id && (
              <button
                type="button"
                onClick={() => {
                  setPendingDeleteJobId(results.job_id!);
                  setShowDeleteModal(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Failed Job</span>
              </button>
            )}

            {onGoToExtraction && (
              <button
                type="button"
                onClick={onGoToExtraction}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Upload New Batch</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Graceful Empty State (when no extraction exists yet or 404)
  if (loadError === "NOT_EXTRACTED_YET" || (!isLoading && !loadError && (!results || (!results.students || results.students.length === 0)))) {
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
            onClick={() => fetchResults()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Error State
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
            onClick={() => fetchResults()}
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

      {/* Partial Extraction Warning Banner */}
      {(results?.job_status === 'PARTIAL' || (results?.job_status === 'FAILED' && (results?.students?.length || 0) > 0)) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs shadow-2xs">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <span className="font-bold">Partial Extraction (Job #{results?.job_id}):</span>{' '}
              {results?.processed_pages || results?.students?.length || 0} of {results?.total_pages || '?'} pages were successfully extracted before processing stopped.
              The successfully extracted student answer sheets and marks are shown below for verification.
            </div>
          </div>
          {results?.job_id && (
            <button
              type="button"
              onClick={() => {
                setPendingDeleteJobId(results.job_id!);
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto px-3.5 py-1.5 rounded-xl font-bold bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 text-amber-950 dark:text-white transition shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Job</span>
            </button>
          )}
        </div>
      )}

      {/* ── 0. Job Selector Bar (Switch between multiple extraction jobs) ── */}
      {availableJobs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200/90 dark:border-gray-700/80 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Extraction Job:</span>
            <div className="relative">
              <select
                value={selectedJobId ?? results?.job_id ?? ''}
                onChange={(e) => {
                  const newJobId = Number(e.target.value);
                  setSelectedJobId(newJobId);
                  fetchResults(newJobId);
                }}
                className="pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer appearance-none shadow-2xs"
              >
                {availableJobs.map((j, idx) => {
                  const dateStr = j.created_at ? new Date(j.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  }) : 'Unknown date';
                  const effectiveStatus = (j.status === 'FAILED' && j.student_count > 0) ? 'PARTIAL' : j.status;
                  return (
                    <option key={j.id} value={j.id}>
                      Job #{j.id} — {dateStr} ({j.student_count} students, {effectiveStatus}) {idx === 0 ? '★ Latest' : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-400">
              {availableJobs.length} {availableJobs.length === 1 ? 'batch job' : 'batch jobs'} recorded
            </span>
            <button
              type="button"
              onClick={() => {
                fetchJobs();
                fetchResults(selectedJobId ?? undefined);
              }}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
              title="Refresh job list & results"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

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
                  ? 'bg-violet-600 text-white'
                  : 'bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800'
              }`}
            >
              Unmapped ({filterCounts.UNMAPPED})
            </button>
          )}
        </div>

        {/* Share Button, Delete Job & Search */}
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
            <span>Share</span>
          </button>

          {results?.job_id && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 transition shadow-2xs"
              title="Delete this extraction job and all associated files"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
              <span>Delete Job</span>
            </button>
          )}
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
              const isSelected = selectedStudent?.student_marks_id === student.student_marks_id;
              const isVerified = student.is_locked || student.verification_status === 'VERIFIED';
              const isNeedsReview = !isVerified && (student.mapping_status === 'NEEDS_REVIEW' || student.verification_status === 'NEEDS_REVIEW' || student.total_mismatch_flag);
              const isUnmapped = !student.student_id || student.mapping_status === 'UNMAPPED' || student.mapping_status === 'NO_STUDENT_FOUND' || student.mapping_status === 'UNDETECTED_STUDENT_MARK';
              const isAutoMapped = !isVerified && !isUnmapped;

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
                      : isUnmapped
                      ? 'bg-violet-50/20 dark:bg-violet-950/15 border-violet-200/90 dark:border-violet-900/60 hover:border-violet-300 hover:shadow-xs'
                      : 'bg-white dark:bg-gray-800 border-gray-200/90 dark:border-gray-700/80 hover:border-gray-300 hover:shadow-xs'
                  }`}
                >
                  {/* Student Name */}
                  <div className={`font-bold text-xs truncate ${
                    isUnmapped ? 'text-violet-900 dark:text-violet-200' : 'text-gray-900 dark:text-white'
                  }`}>
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

                    {/* Status Pill Badge: Verified (Emerald), Unmapped (Purple), Auto Mapped (Grey) */}
                    {isVerified ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Verified
                      </span>
                    ) : isUnmapped ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100/90 text-violet-700 border border-violet-300 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800">
                        Unmapped
                      </span>
                    ) : isNeedsReview ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
                        Needs Review
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-300 dark:bg-gray-750 dark:text-gray-300 dark:border-gray-600">
                        {student.mapping_status === 'MANUALLY_MAPPED' ? 'Assigned' : 'Auto Mapped'}
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

      {/* Student Cards Rail Pagination Controls */}
      {filteredStudents.length > STUDENTS_PER_PAGE && (
        <div className="flex items-center justify-between px-2 text-xs text-gray-500 flex-shrink-0">
          <span className="text-[11px]">
            Showing {studentPageIndex * STUDENTS_PER_PAGE + 1}–
            {Math.min((studentPageIndex + 1) * STUDENTS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={studentPageIndex === 0}
              onClick={() => setStudentPageIndex(p => Math.max(0, p - 1))}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-750 transition cursor-pointer"
            >
              ← Prev
            </button>
            <span className="font-mono text-[11px] px-1 text-gray-400">
              Page {studentPageIndex + 1} of {totalStudentPages}
            </span>
            <button
              type="button"
              disabled={studentPageIndex >= totalStudentPages - 1}
              onClick={() => setStudentPageIndex(p => Math.min(totalStudentPages - 1, p + 1))}
              className="px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs font-semibold disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-750 transition cursor-pointer"
            >
              Next →
            </button>
          </div>
        </div>
      )}

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
                  disabled={selectedStudent.source_pages.indexOf(activePage) <= 0}
                  onClick={() => {
                    const idx = selectedStudent.source_pages.indexOf(activePage);
                    if (idx > 0) setActivePage(selectedStudent.source_pages[idx - 1]);
                  }}
                  className="hover:text-white disabled:opacity-30 disabled:hover:text-gray-300 cursor-pointer"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span>
                  Page {selectedStudent.source_pages.indexOf(activePage) >= 0 ? selectedStudent.source_pages.indexOf(activePage) + 1 : 1} of {selectedStudent.source_pages.length} (Sheet p.{activePage})
                </span>
                <button
                  type="button"
                  disabled={selectedStudent.source_pages.indexOf(activePage) >= selectedStudent.source_pages.length - 1}
                  onClick={() => {
                    const idx = selectedStudent.source_pages.indexOf(activePage);
                    if (idx >= 0 && idx < selectedStudent.source_pages.length - 1) setActivePage(selectedStudent.source_pages[idx + 1]);
                  }}
                  className="hover:text-white disabled:opacity-30 disabled:hover:text-gray-300 cursor-pointer"
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                          <Lock className="h-2.5 w-2.5" /> Verified &amp; Locked
                        </span>
                        <button
                          type="button"
                          onClick={handleUnlockStudent}
                          disabled={isUnlocking}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition cursor-pointer shadow-2xs"
                          title="Unlock marks to edit questions. Removes from final result until re-verified."
                        >
                          <Unlock className="w-2.5 h-2.5 text-amber-600" />
                          <span>{isUnlocking ? "Unlocking..." : "Unlock to Edit"}</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        Editable Draft
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

                {/* ── Subsection Totals Banner (Part A, Part B, Grand Total) ── */}
                {subsectionTotals.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900/40">
                    <div className="text-[11px] font-bold text-violet-950 dark:text-violet-200 mr-1 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                      <span>Subsections:</span>
                    </div>
                    {subsectionTotals.map((sec) => (
                      <div
                        key={sec.section}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-gray-800 border border-violet-200/80 dark:border-violet-800 text-xs shadow-2xs"
                      >
                        <span className="font-semibold text-gray-600 dark:text-gray-300">{sec.section}:</span>
                        <span className="font-mono font-bold text-violet-700 dark:text-violet-400">
                          {Math.round(sec.obtained * 100) / 100}
                        </span>
                        <span className="text-gray-400 text-[10px] font-mono">/ {sec.max}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-600 text-white text-xs font-bold shadow-2xs ml-auto">
                      <span>Grand Total:</span>
                      <span className="font-mono">{selectedStudent.final_total_mark}</span>
                      <span className="text-violet-200 text-[10px] font-mono">/ {selectedStudent.actual_max_mark || 50}</span>
                    </div>
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
              <div className="pt-3 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between space-x-3 flex-shrink-0">
                <div className="flex items-center">
                  {hasUnsavedChanges && (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-lg animate-pulse">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Unsaved edits! Click &ldquo;Update Marks&rdquo; first to enable Verify &amp; Lock.
                    </span>
                  )}
                  {selectedStudent.is_locked && (
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      Marks are verified and locked.
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {selectedStudent.is_locked ? (
                    <button
                      type="button"
                      onClick={handleUnlockStudent}
                      disabled={isUnlocking}
                      className="flex items-center space-x-2 py-2.5 px-5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white transition disabled:opacity-50 shadow-2xs cursor-pointer"
                    >
                      {isUnlocking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5" />
                      )}
                      <span>Unlock to Edit Marks</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleUpdateMarks}
                        disabled={isUpdating || isVerifying}
                        className="flex items-center space-x-2 py-2.5 px-5 rounded-xl font-bold text-xs border border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 hover:bg-violet-100 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
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
                        disabled={isUpdating || isVerifying || hasUnsavedChanges}
                        title={
                          hasUnsavedChanges
                            ? "Save changes using 'Update Marks' before verifying"
                            : "Verify and lock student marks"
                        }
                        className="flex items-center space-x-2 py-2.5 px-5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs cursor-pointer"
                      >
                        {isVerifying ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        )}
                        <span>{isVerifying ? "Verifying..." : "Verify & Lock"}</span>
                      </button>
                    </>
                  )}

                  {/* Next / Previous student quick navigation */}
                  <div className="flex items-center gap-1.5 ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                    <button
                      type="button"
                      onClick={handleGoToPrevStudent}
                      disabled={currentStudentIndex <= 0}
                      className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Previous Student"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono text-gray-400">
                      {currentStudentIndex + 1}/{filteredStudents.length}
                    </span>
                    <button
                      type="button"
                      onClick={handleGoToNextStudent}
                      disabled={currentStudentIndex < 0 || currentStudentIndex >= filteredStudents.length - 1}
                      className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      title="Next Student"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
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

      {/* Delete Job Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/60 rounded-2xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Extraction Job</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Permanently delete job data & files</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              Are you sure you want to delete this extraction job? This action will permanently remove:
            </p>
            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 mb-6 list-disc list-inside bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
              <li>All extracted student marks and confirmed marks for this job</li>
              <li>Uploaded answer sheet PDF files</li>
              <li>Rendered page images in cloud storage</li>
              <li>Extraction batch logs and audit records</li>
            </ul>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingJob}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleDeleteJob}
                disabled={isDeletingJob}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-sm cursor-pointer"
              >
                {isDeletingJob ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Job...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All Data & Files</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5-SECOND UNDO DELETION FLOATING TOAST ─────────────────────────── */}
      {pendingDeleteJobId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3.5 rounded-2xl bg-gray-900/95 dark:bg-black/95 text-white shadow-2xl border border-gray-700 backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>Job #{pendingDeleteJobId} scheduled for deletion</span>
              <span className="text-amber-400 font-mono">({undoSecondsRemaining}s)</span>
            </div>
            <p className="text-[11px] text-gray-400">All student marks & answer sheets will be deleted.</p>
          </div>
          <button
            type="button"
            onClick={handleCancelUndoDelete}
            className="ml-2 px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
          >
            UNDO
          </button>
        </div>
      )}
    </div>
  );
}
